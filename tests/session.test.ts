import { beforeEach, describe, expect, it } from 'vitest';
import { Session } from '../src/game/session';
import { newSave, migrate, readSlot, writeSlot, deleteSlot, completion, SAVE_VERSION } from '../src/game/save';
import { MAX_LIVES } from '../src/game/constants';
import { storage } from '../src/engine/storage';

const mk = (mode: 'solo' | 'coop' = 'solo') => new Session(newSave(mode, 'M'), 0);

describe('licznik opakowań (kryterium: 99 / 100 / 101)', () => {
  it('99 opakowań nie daje życia, 100. daje dokładnie jedno, 101. nic', () => {
    const s = mk(); const start = s.lives[0]; let gained = 0;
    for (let i = 1; i <= 99; i++) if (s.collectPackage(`pet${i}`, 'pet', 0).lifeGained) gained++;
    expect(gained).toBe(0); expect(s.lives[0]).toBe(start);
    expect(s.collectPackage('pet100', 'pet', 0).lifeGained).toBe(true); expect(s.lives[0]).toBe(start + 1);
    expect(s.collectPackage('pet101', 'pet', 0).lifeGained).toBe(false); expect(s.lives[0]).toBe(start + 1);
    expect(s.packages).toBe(101);
  });
  it('to samo opakowanie nie liczy się dwa razy (antyduplikacja po id)', () => {
    const s = mk(); expect(s.collectPackage('a', 'can', 0).counted).toBe(true);
    const again = s.collectPackage('a', 'can', 0); expect(again.counted).toBe(false); expect(s.packages).toBe(1); expect(s.score).toBe(150);
  });
  it('złota puszka to JEDNO opakowanie, 750 pkt i 2,50 zł', () => {
    const s = mk(); const r = s.collectPackage('g', 'golden', 0);
    expect(r.score).toBe(750); expect(s.packages).toBe(1); expect(s.data.depositGrosze).toBe(250);
  });
  it('PET = 100 pkt / 0,50 zł, puszka = 150 pkt / 0,50 zł', () => {
    const s = mk(); s.collectPackage('p', 'pet', 0); s.collectPackage('c', 'can', 0);
    expect(s.score).toBe(250); expect(s.data.depositGrosze).toBe(100);
  });
  it('nadmiar życia ponad limit zamienia się na 2000 pkt', () => {
    const s = mk(); s.data.lives[0] = MAX_LIVES; const before = s.score;
    expect(s.addLife(0)).toBe(false); expect(s.score).toBe(before + 2000); expect(s.lives[0]).toBe(MAX_LIVES);
  });
  it('kaucja: EcoPort wypłaca różnicę tylko raz', () => {
    const s = mk(); s.collectPackage('p', 'pet', 0); s.collectPackage('c', 'can', 0);
    expect(s.deposit()).toBe(100); expect(s.deposit()).toBe(0);
    s.collectPackage('g', 'golden', 0); expect(s.deposit()).toBe(250);
  });
  it('mieszkańcy i unikaty liczą się jednorazowo', () => {
    const s = mk(); expect(s.freeResident('W1-L1-S1')).toBe(true); expect(s.freeResident('W1-L1-S1')).toBe(false);
    expect(s.collectUnique('shard:1')).toBe(true); expect(s.collectUnique('shard:1')).toBe(false);
  });
});

describe('postęp i odblokowania', () => {
  it('poziom odblokowuje się po ukończeniu poprzedniego; warp odblokowuje świat', () => {
    const s = mk(); expect(s.isLevelUnlocked(1, 1)).toBe(true); expect(s.isLevelUnlocked(1, 2)).toBe(false);
    s.beginLevel(); s.completeLevel('W1-L1', 55, 300); expect(s.isLevelUnlocked(1, 2)).toBe(true);
    expect(s.isLevelUnlocked(2, 1)).toBe(false); expect(s.unlockWorld(2)).toBe(true); expect(s.isLevelUnlocked(2, 1)).toBe(true);
    expect(s.unlockWorld(1)).toBe(false);
  });
  it('rekord poziomu zachowuje najlepszy wynik i czas', () => {
    const s = mk(); s.beginLevel(); s.collectPackage('a', 'pet', 0); const r1 = s.completeLevel('W1-L1', 100, 0);
    s.beginLevel(); const r2 = s.completeLevel('W1-L1', 80, 0);
    expect(r2.bestTime).toBe(80); expect(r2.bestScore).toBeGreaterThanOrEqual(r1.bestScore); expect(r2.pets).toBe(1);
  });
});

describe('zapis gry', () => {
  beforeEach(() => { for (let i = 0; i < 3; i++) deleteSlot(i); });
  it('zapis i odczyt zachowują stan (round-trip)', () => {
    const s = mk('coop'); s.collectPackage('x', 'pet', 0); s.freeResident('r'); s.collectUnique('shard:3'); s.shards.add('shard:3'); s.persist(12);
    const r = readSlot(0)!; expect(r.mode).toBe('coop'); expect(r.packageCount).toBe(1); expect(r.freed).toEqual(['r']); expect(r.playSeconds).toBe(12); expect(r.v).toBe(SAVE_VERSION);
  });
  it('pusty slot = null, usunięcie czyści', () => {
    expect(readSlot(1)).toBeNull(); mk().persist(); expect(readSlot(0)).not.toBeNull(); deleteSlot(0); expect(readSlot(0)).toBeNull();
  });
  it('migrate odrzuca śmieci i naprawia niepełne/uszkodzone dane', () => {
    expect(migrate(null)).toBeNull(); expect(migrate('x')).toBeNull();
    const m = migrate({ lives: [500, -4], score: -1, unlockedWorld: 99, collected: ['a', 3, null], levels: { 'W1-L1': { done: 1 } }, mode: 'weird' })!;
    expect(m.lives).toEqual([99, 0]); expect(m.score).toBe(0); expect(m.unlockedWorld).toBe(8); expect(m.collected).toEqual(['a']);
    expect(m.levels['W1-L1'].done).toBe(true); expect(m.mode).toBe('solo');
  });
  it('uszkodzony JSON w slocie nie wywala gry', () => {
    writeSlot(2, newSave('solo', 'D')); storage.set('marioosh.save.v1.slot2', '{ to nie jest json');
    expect(() => readSlot(2)).not.toThrow(); expect(readSlot(2)).toBeNull();
  });
  it('procent ukończenia mieści się w 0–100 i rośnie', () => {
    const d = newSave('solo', 'M'); expect(completion(d)).toBe(0);
    for (let w = 1; w <= 8; w++) for (let l = 1; l <= 4; l++) d.levels[`W${w}-L${l}`] = { done: true, bestScore: 0, bestTime: 1, pets: 0, cans: 0, golden: 0, freed: 0 };
    expect(completion(d)).toBe(40);
    d.freed = Array.from({ length: 96 }, (_, i) => `f${i}`); d.shards = Array.from({ length: 8 }, (_, i) => `s${i}`); d.notes = Array.from({ length: 8 }, (_, i) => `n${i}`);
    expect(completion(d)).toBe(100);
  });
});
