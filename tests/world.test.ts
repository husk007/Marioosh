import { describe, expect, it } from 'vitest';
import type { PlayerInput } from '../src/engine/input';
import { defaultSettings } from '../src/engine/settings';
import { World } from '../src/game/world';
import { Session } from '../src/game/session';
import { newSave } from '../src/game/save';
import { getLevel } from '../src/game/levels';
import { makeEnemy } from '../src/game/enemies';
import { INVULN_AFTER_HIT, MAX_HP, PETRIFY_DECAY, PETRIFY_DELAY, PETRIFY_MAX, PETRIFY_RATE } from '../src/game/constants';
import { stubAudio } from './bot';

const ACT = ['left', 'right', 'up', 'down', 'jump', 'run', 'attack', 'interact', 'switch'] as const;
const blank = () => Object.fromEntries(ACT.map((a) => [a, false])) as Record<(typeof ACT)[number], boolean>;
const idle = (): PlayerInput => ({ held: blank(), pressed: blank(), released: blank() });
const DT = 1 / 60;

function mkWorld(mode: 'solo' | 'coop' = 'solo', level = 'W1-L1'): World {
  const s = new Session(newSave(mode, 'M'), 0);
  const w = new World(getLevel(level), s, { audio: stubAudio, settings: defaultSettings(), night: false });
  w.readyT = 0; w.rt.enemies.length = 0; return w;
}
const step = (w: World, n: number, inp: PlayerInput[] = [idle(), idle()]) => { for (let i = 0; i < n; i++) w.update(DT, inp); };

describe('świat: HP 3 + tarcza (v0.4)', () => {
  it('gracz zaczyna z 3 HP; trafienie zabiera 1 HP i daje nietykalność 1,3 s; trzecie trafienie odsyła do checkpointu', () => {
    const w = mkWorld(); step(w, 5); const p = w.players[0];
    expect(p.hp).toBe(MAX_HP);
    w.hurtPlayer(p, p.mv.body.x + 50);
    expect(p.hp).toBe(MAX_HP - 1); expect(p.dead).toBe(false); expect(p.invuln).toBeGreaterThan(INVULN_AFTER_HIT - 0.1);
    w.hurtPlayer(p, p.mv.body.x); expect(p.hp).toBe(MAX_HP - 1);          // w trakcie nietykalności
    step(w, Math.ceil((INVULN_AFTER_HIT + 0.2) / DT)); w.hurtPlayer(p, p.mv.body.x + 10); expect(p.hp).toBe(MAX_HP - 2); expect(p.dead).toBe(false);
    step(w, Math.ceil((INVULN_AFTER_HIT + 0.2) / DT)); w.hurtPlayer(p, p.mv.body.x + 10); expect(p.dead).toBe(true);
  });
  it('tarcza (XL) pochłania jedno trafienie i nie zabiera HP; rozmiar hitboksu się nie zmienia', () => {
    const w = mkWorld(); step(w, 5); const p = w.players[0]; const h0 = p.mv.body.h;
    p.upg[p.brother].shield = true; step(w, 3); expect(p.mv.body.h).toBe(h0);
    w.hurtPlayer(p, p.mv.body.x + 50);
    expect(p.upg[p.brother].shield).toBe(false); expect(p.hp).toBe(MAX_HP); expect(p.invuln).toBeGreaterThan(INVULN_AFTER_HIT - 0.1);
  });
  it('śmierć nie odejmuje żyć (brak żyć w v0.4) — po chwili gracz wraca na checkpoint z pełnym HP', () => {
    const w = mkWorld(); step(w, 5); const before = [...w.session.lives]; w.killPlayer(w.players[0]);
    expect(w.players[0].dead).toBe(true);
    step(w, 200); expect([...w.session.lives]).toEqual(before); expect(w.players[0].dead).toBe(false); expect(w.players[0].hp).toBe(MAX_HP); expect(w.state).toBe('play');
  });
  it('tryb god (testowy) ignoruje wrogów, ale nie kolce', () => {
    const w = mkWorld(); w.god = true; step(w, 5); const p = w.players[0];
    w.hurtPlayer(p, 0); expect(p.hp).toBe(MAX_HP); w.hurtPlayer(p, 0, true); expect(p.hp).toBe(MAX_HP - 1);
  });
  it('upadek w przepaść: −1 HP i powrót na ostatnie bezpieczne miejsce (bez śmierci przy HP > 1)', () => {
    const w = mkWorld(); step(w, 30); const p = w.players[0]; const safe = { ...p.safe };
    p.mv.body.y = w.grid.h * 32 + 200; step(w, 2);
    expect(p.hp).toBe(MAX_HP - 1); expect(p.dead).toBe(false); expect(Math.abs(p.mv.body.x + p.mv.body.w / 2 - safe.x)).toBeLessThan(2);
  });
  it('upadek z ≥ 2,4 m rani, z 1,2–2,4 m tylko potyka', () => {
    const w = mkWorld(); step(w, 30); const p = w.players[0]; const b = p.mv.body;
    const hp0 = p.hp; b.y -= 130; b.vy = 0; p.mv.peakFeet = b.y + b.h; step(w, 60);
    expect(p.hp).toBeLessThan(hp0);
  });
  it('grawitacja świata zależy od planety (W5 Skaltria cięższa niż W6 Vespera)', () => {
    expect(mkWorld('solo', 'W5-L1').g).toBeCloseTo(446.88, 1); expect(mkWorld('solo', 'W6-L1').g).toBeCloseTo(337.12, 1);
  });
  it('brak globalnego licznika czasu: wynik poziomu nie zawiera premii za czas', () => {
    const w = mkWorld(); step(w, 600); expect(w.state).toBe('play'); expect(w.result().bonus).toBe(0);
  });
});

describe('świat: brak skakania po głowach (v0.4)', () => {
  it('spadając na wroga gracz nie rani go „stompem” — kontakt z aktywnym wrogiem rani gracza', () => {
    const w = mkWorld(); step(w, 5); const p = w.players[0]; const b = p.mv.body;
    const e = makeEnemy('rogus', b.x + b.w / 2, b.y + b.h); e.b.vx = 0; w.rt.enemies.push(e);
    b.y -= 40; b.vy = 200;
    for (let i = 0; i < 30; i++) w.update(DT, [idle(), idle()]);
    expect(e.dead).toBe(false); expect(p.hp).toBeLessThan(MAX_HP);
  });
  it('wolny kontakt z boku rani gracza', () => {
    const w = mkWorld(); step(w, 5); const p = w.players[0]; const b = p.mv.body;
    const e = makeEnemy('rogus', b.x + b.w / 2, b.y + b.h); w.rt.enemies.push(e); step(w, 20);
    expect(p.dead || p.invuln > 0).toBe(true);
  });
});

describe('świat: spetryfikowanie (miernik)', () => {
  const beamOn = (w: World) => { const b = w.players[0].mv.body; w.beams = [{ x: b.x - 40, y: b.y + b.h / 2, dir: 1, len: 200, t: 5, warn: false, owner: 0 }]; };
  it('promień podnosi miernik ~45/s, po wyjściu zanika z opóźnieniem 0,5 s ~30/s', () => {
    const w = mkWorld(); step(w, 5); const p = w.players[0]; beamOn(w); step(w, 30);
    expect(p.petrify).toBeGreaterThan(PETRIFY_RATE * 0.5 - 6); expect(p.petrify).toBeLessThan(PETRIFY_RATE * 0.5 + 6);
    w.beams = []; const hi = p.petrify; step(w, Math.round(PETRIFY_DELAY / DT) - 2); expect(p.petrify).toBeCloseTo(hi, 0);
    step(w, 30 + 2); expect(p.petrify).toBeLessThan(hi - PETRIFY_DECAY * 0.3);
  });
  it('pełny miernik w solo kończy się powrotem do checkpointu; w co-op partner może uwolnić posąg', () => {
    const w = mkWorld(); step(w, 5); beamOn(w); let died = false;
    for (let i = 0; i < Math.ceil(PETRIFY_MAX / PETRIFY_RATE / DT) + 60 && !died; i++) { w.update(DT, [idle(), idle()]); if (w.players[0].dead) died = true; }
    expect(died).toBe(true);
    w.beams = []; step(w, 220); expect(w.players[0].dead).toBe(false);
    const c = mkWorld('coop'); step(c, 5); const b = c.players[0].mv.body; c.beams = [{ x: b.x - 40, y: b.y + b.h / 2, dir: 1, len: 200, t: 9, warn: false, owner: 0 }];
    step(c, Math.ceil(PETRIFY_MAX / PETRIFY_RATE / DT) + 10); expect(c.players[0].statue).toBeGreaterThan(0);
  });
});

describe('świat: co-op', () => {
  it('ma dwóch graczy z osobnym HP', () => {
    const c = mkWorld('coop'); expect(c.players.length).toBe(2);
    const s = mkWorld('solo'); expect(s.session.coop).toBe(false);
  });
  it('ginący gracz w co-op wraca na checkpoint, drugi pozostaje nietknięty', () => {
    const c = mkWorld('coop'); step(c, 5); c.killPlayer(c.players[0]); step(c, 220);
    expect(c.players[0].dead).toBe(false); expect(c.players[1].dead).toBe(false); expect(c.players[1].hp).toBe(MAX_HP);
  });
});
