import { describe, expect, it } from 'vitest';
import levelsJson from '../src/data/levels.json';
import { buildLevel, buildPradowo } from '../src/game/levelgen';
import { BROTHERS, GRAVITY, PICKUP_RADIUS } from '../src/game/constants';
import { T, type LevelJson, type LevelData, type Room } from '../src/game/types';

const JSONS = (levelsJson as unknown as { levels: LevelJson[] }).levels;
const built = new Map<string, LevelData>();
for (const j of JSONS) built.set(j.level_id, buildLevel(j));

const items = (r: Room, k: string) => r.specs.filter((s) => s.t === 'item' && s.k === k);

describe('generator poziomów', () => {
  it('dokumentacja zawiera 32 poziomy', () => { expect(JSONS.length).toBe(32); });
  it('buduje wszystkie 32 poziomy deterministycznie', () => {
    for (const j of JSONS) {
      const a = buildLevel(j), b = buildLevel(j);
      expect(a.rooms[0].tiles).toEqual(b.rooms[0].tiles);
      expect(a.rooms[0].specs.length).toBe(b.rooms[0].specs.length);
    }
  });
  it('Prądowo (świat 0) się buduje', () => { expect(buildPradowo().rooms.length).toBeGreaterThan(0); });

  for (const j of JSONS) {
    describe(j.level_id, () => {
      const L = built.get(j.level_id)!;
      const main = L.rooms[0];
      it('ma trzech mieszkańców ze stabilnymi id i pasujące posągi', () => {
        expect(L.residents).toEqual([1, 2, 3].map((i) => `${j.level_id}-S${i}`));
        const statues = main.specs.filter((s) => s.t === 'statue');
        const inRooms = L.rooms.flatMap((r) => r.specs).filter((s) => s.t === 'statue');
        expect(inRooms.length).toBeGreaterThanOrEqual(3);
        expect(new Set(inRooms.map((s) => (s as { id: string }).id)).size).toBe(inRooms.length);
        expect(statues.length).toBeGreaterThan(0);
      });
      it('ma spawn, checkpoint i wyjście w obrębie planszy', () => {
        expect(main.spawn.x).toBeGreaterThanOrEqual(0);
        expect(main.specs.some((s) => s.t === 'exit')).toBe(true);
        expect(main.specs.some((s) => s.t === 'checkpoint')).toBe(true);
        expect(L.exitPx.x).toBeLessThanOrEqual(main.w * 32);
      });
      it('budżet PET/puszek nie jest przekroczony i jest bliski spec.', () => {
        const pets = items(main, 'pet').length, cans = items(main, 'can').length + items(main, 'golden').length;
        expect(pets).toBeLessThanOrEqual(j.collectibles.pet + 2);
        expect(pets).toBeGreaterThanOrEqual(Math.floor(j.collectibles.pet * 0.6));
        expect(cans).toBeGreaterThanOrEqual(Math.floor((j.collectibles.cans + j.collectibles.golden_cans) * 0.5));
      });
      it('id przedmiotów są unikalne w całym poziomie', () => {
        const ids = L.rooms.flatMap((r) => r.specs).filter((s) => s.t === 'item' || s.t === 'crate').map((s) => (s as { id: string }).id);
        expect(new Set(ids).size).toBe(ids.length);
      });
      it('żaden spec nie leży poza planszą', () => {
        for (const r of L.rooms) for (const s of r.specs) {
          if ('x' in s && 'y' in s && s.t !== 'hint' && s.t !== 'current') {
            expect(s.x).toBeGreaterThanOrEqual(-1); expect(s.x).toBeLessThanOrEqual(r.w * 32 + 1);
            expect(s.y).toBeGreaterThanOrEqual(-1); expect(s.y).toBeLessThanOrEqual(r.h * 32 + 64);
          }
        }
      });
      it('przewody mają cel w istniejącym pokoju', () => {
        for (const s of L.rooms.flatMap((r) => r.specs)) if (s.t === 'cable' && s.dest) {
          expect(s.dest.room).toBeGreaterThanOrEqual(0); expect(s.dest.room).toBeLessThan(L.rooms.length);
        }
      });
      if (j.stage === 4) it('plansza bossa ma arenę i bossa', () => {
        expect(L.boss).toBeTruthy();
        expect(main.bossArena).toBeTruthy();
        expect(main.specs.some((s) => s.t === 'boss')).toBe(true);
      });
      if (L.mode === 'run') it('żadna przepaść (bez platformy/podpory) nie jest szersza niż 6 kafelków', () => {
        // kolumna jest "otwarta", gdy od rzędu 7 w dół nie ma żadnego kafla nośnego ani platformy
        const covered = new Set<number>();
        for (const s of main.specs) if (s.t === 'platform') {
          const x1 = s.x + s.w + (s.mode === 'h' ? s.range : 0);
          for (let c = Math.floor(s.x / 32); c <= Math.ceil(x1 / 32); c++) covered.add(c);
        }
        let run = 0, worst = 0, at = 0;
        for (let x = 0; x < main.w; x++) {
          let support = covered.has(x);
          for (let y = 7; y < main.h && !support; y++) { const t = main.tiles[y * main.w + x]; if (t !== T.EMPTY && t !== T.HAZARD && t !== T.LADDER) support = true; }
          run = support ? 0 : run + 1; if (run > worst) { worst = run; at = x; }
        }
        expect(worst, `najszersza przepaść ${worst} kafli przy x=${at}`).toBeLessThanOrEqual(6);
      });
    });
  }
});

describe('osiągalność przedmiotów (wysokość skoku)', () => {
  const apexM = BROTHERS.M.jump ** 2 / (2 * GRAVITY);            // najsłabszy skok ≈ 77 px
  const LIMIT = Math.floor(apexM + BROTHERS.M.hitH / 2 + PICKUP_RADIUS) - 16; // zapas na niedokładny skok
  const SUP = new Set<number>([T.SOLID, T.ONEWAY, T.CRUMBLE, T.CONVL, T.CONVR, T.CRACKED]);
  it('żadne opakowanie nie wisi wyżej, niż sięgnie Marioosh ze stałego podłoża', () => {
    const tooHigh: string[] = [];
    for (const [id, L] of built) L.rooms.forEach((r, ri) => {
      const platforms = r.specs.filter((s) => s.t === 'platform') as unknown as { x: number }[];
      for (const s of r.specs) {
        if (s.t !== 'item') continue;
        const it = s as unknown as { x: number; y: number; k: string };
        const cx = Math.floor(it.x / 32); let best = Infinity;
        for (const dx of [-1, 0, 1]) {
          const c = cx + dx; if (c < 0 || c >= r.w) continue;
          for (let row = Math.max(0, Math.floor(it.y / 32)); row < r.h; row++) if (SUP.has(r.tiles[row * r.w + c])) { best = Math.min(best, row * 32 - it.y); break; }
        }
        const overMoving = platforms.some((p) => Math.abs(p.x / 32 - cx) < 8);
        if (best !== Infinity && best > LIMIT && !overMoving) tooHigh.push(`${id}#${ri} ${it.k}@${it.x},${it.y} h=${best}`);
      }
    });
    expect(tooHigh).toEqual([]);
  });
  it('komory bonusowe: puszki do ~88 px nad podłożem lub na półce', () => {
    for (const [id, L] of built) for (const r of L.rooms.filter((q) => q.name === 'bonus' || q.name === 'secret' || q.name === 'scarlet')) {
      for (const s of r.specs) if (s.t === 'item') {
        const it = s as unknown as { x: number; y: number };
        const cx = Math.floor(it.x / 32); let below = -1;
        for (let row = Math.floor(it.y / 32); row < r.h; row++) if (SUP.has(r.tiles[row * r.w + cx])) { below = row * 32 - it.y; break; }
        expect(below, `${id} ${r.name}`).toBeGreaterThan(0);
        expect(below, `${id} ${r.name} @${cx}`).toBeLessThanOrEqual(LIMIT);
      }
    }
  });
});
