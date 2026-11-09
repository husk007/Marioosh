import { describe, expect, it } from 'vitest';
import type { PlayerInput } from '../src/engine/input';
import { defaultSettings } from '../src/engine/settings';
import { World } from '../src/game/world';
import { Session } from '../src/game/session';
import { newSave } from '../src/game/save';
import { getLevel } from '../src/game/levels';
import { MAX_HP, TILE } from '../src/game/constants';
import { stubAudio } from './bot';

const ACT = ['left', 'right', 'up', 'down', 'jump', 'run', 'attack', 'interact', 'switch'] as const;
const blank = () => Object.fromEntries(ACT.map((a) => [a, false])) as Record<(typeof ACT)[number], boolean>;
const idle = (): PlayerInput => ({ held: blank(), pressed: blank(), released: blank() });
const step = (w: World, n: number) => { for (let i = 0; i < n; i++) w.update(1 / 60, [idle(), idle()]); };

/** W5-L3: kula toczy się po torze; zwrotnica (dźwignia na tarasie) kieruje ją na rumowisko i otwiera bramę; półka nad drogą jest bezpieczna */
function world(tx: number, ty: number): World {
  const w = new World(getLevel('W5-L3'), new Session(newSave('solo', 'M'), 0), { audio: stubAudio, settings: defaultSettings(), night: false });
  w.readyT = 0; w.rt.enemies.length = 0; step(w, 3); put(w, tx, ty); return w;
}
function put(w: World, tx: number, ty: number) { const b = w.players[0].mv.body; b.x = tx * TILE + TILE / 2 - b.w / 2; b.y = (ty + 1) * TILE - b.h; b.vx = b.vy = 0; w.players[0].safe = { x: b.x + b.w / 2, y: (ty + 1) * TILE }; }
const gate = (w: World) => w.rt.gates.find((g) => g.id === 'g1')!;

describe('kula na torze (W5-L3)', () => {
  it('zwrotnica wyłączona: kula wpada do studzienki, brama zostaje zamknięta', () => {
    const w = world(150 - 3, 37); // daleko od toru? gracz musi być blisko, więc stawiamy go na końcu toru (komora wyjściowa)
    put(w, 116, 34); const b = w.players[0].mv.body;
    for (let i = 0; i < 60 * 40; i++) { step(w, 1); put(w, 116, 34); b.vy = 0; }
    expect(gate(w).open).toBe(false); expect(w.players[0].hp).toBe(MAX_HP);
  });
  it('zwrotnica włączona: kula dociera do rumowiska i otwiera bramę', () => {
    const w = world(116, 34); for (const s of w.rt.switches) if (s.gate === 'tz') s.on = true;
    const b = w.players[0].mv.body; let t = 0;
    for (let i = 0; i < 60 * 45 && !gate(w).open; i++) { step(w, 1); t += 1 / 60; put(w, 116, 34); b.vy = 0; }
    expect(gate(w).open).toBe(true); expect(t).toBeGreaterThan(3);
  });
  it('kula rani gracza stojącego na drodze, ale nie na półce-schronie (3 kafle nad drogą)', () => {
    const w = world(100, 37); const b = w.players[0].mv.body;
    for (let i = 0; i < 60 * 30 && w.players[0].hp === MAX_HP; i++) { step(w, 1); put(w, 100, 37); }
    expect(w.players[0].hp).toBeLessThan(MAX_HP);
    const w2 = world(104, 34); const b2 = w2.players[0].mv.body; void b;
    for (let i = 0; i < 60 * 30; i++) { step(w2, 1); put(w2, 104, 34); b2.vy = 0; }
    expect(w2.players[0].hp).toBe(MAX_HP);
  });
  it('kula jest zapowiedziana ≥ 2,5 s przed startem, a okres między kulami ≥ 8 s', () => {
    const w = world(100, 34); const bd = w.rt.boulders[0]; let warnAt = -1, rollAt = -1, t = 0; const b = w.players[0].mv.body;
    for (let i = 0; i < 60 * 30 && rollAt < 0; i++) { step(w, 1); t += 1 / 60; put(w, 100, 34); b.vy = 0; if (bd.warned && warnAt < 0) warnAt = t; if (bd.roll && rollAt < 0) rollAt = t; }
    expect(warnAt).toBeGreaterThan(0); expect(rollAt - warnAt).toBeGreaterThan(2.5); expect(bd.spec.every).toBeGreaterThanOrEqual(8);
  });
  it('analizator: z dźwignią zwrotnicy brama rumowiska jest otwarta; bez niej nie', () => {
    // (osiągalność wyjścia sprawdza authored.test; tu tylko struktura)
    const L = getLevel('W5-L3'); const sp = L.rooms[0].specs.find((s) => s.t === 'boulder')!;
    expect(sp.t === 'boulder' && sp.fork?.select).toBe('tz'); expect(L.rooms[0].specs.some((s) => s.t === 'switch' && s.gate === 'tz')).toBe(true);
  });
});
