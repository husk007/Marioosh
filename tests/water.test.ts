import { describe, expect, it } from 'vitest';
import type { PlayerInput } from '../src/engine/input';
import { defaultSettings } from '../src/engine/settings';
import { World } from '../src/game/world';
import { Session } from '../src/game/session';
import { newSave } from '../src/game/save';
import { getLevel } from '../src/game/levels';
import { AIR_MAX, MAX_HP, TILE } from '../src/game/constants';
import { T } from '../src/game/types';
import { stubAudio } from './bot';

const ACT = ['left', 'right', 'up', 'down', 'jump', 'run', 'attack', 'interact', 'switch'] as const;
const blank = () => Object.fromEntries(ACT.map((a) => [a, false])) as Record<(typeof ACT)[number], boolean>;
const idle = (): PlayerInput => ({ held: blank(), pressed: blank(), released: blank() });
const DT = 1 / 60;
function mkWorld(level = 'W4-L1'): World {
  const s = new Session(newSave('solo', 'M'), 0);
  const w = new World(getLevel(level), s, { audio: stubAudio, settings: defaultSettings(), night: false });
  w.readyT = 0; w.rt.enemies.length = 0; return w;
}
const step = (w: World, n: number) => { for (let i = 0; i < n; i++) w.update(DT, [idle(), idle()]); };

describe('powietrze i woda (Aqualis)', () => {
  it('pod wodą ubywa powietrza (20 s), po wyczerpaniu tonie się: −1 HP co ≈1,6 s; nad wodą powietrze szybko wraca', () => {
    const w = mkWorld(); step(w, 10); const p = w.players[0];
    const b = p.mv.body; b.x = 28 * TILE; b.y = 17 * TILE - b.h; b.vx = b.vy = 0;
    w.rt.water.fill(1);                                          // woda wszędzie: głowa zawsze pod wodą
    step(w, 60 * 10); expect(p.air).toBeLessThan(AIR_MAX - 9); expect(p.air).toBeGreaterThan(AIR_MAX - 11); expect(p.hp).toBe(MAX_HP);
    step(w, 60 * 11); expect(p.air).toBe(0);
    step(w, 60 * 2); expect(p.hp).toBeLessThan(MAX_HP);
    w.rt.water.fill(0); step(w, 60 * 3); expect(p.air).toBe(AIR_MAX);
  });
  it('bez sterowania wypływasz na powierzchnię i tam oddychasz (basen z dnem pod powierzchnią)', () => {
    const w = mkWorld(); step(w, 10); const p = w.players[0]; const b = p.mv.body;
    b.x = 28 * TILE; b.y = 17 * TILE - b.h; b.vx = b.vy = 0;      // dno basenu 1
    step(w, 60 * 8);
    expect(b.y + b.h).toBeLessThan(16 * TILE + 80);                // głowa przy lustrze wody (wiersz 16)
    expect(p.air).toBeGreaterThan(AIR_MAX - 4);
  });
  it('dźwignia opuszcza most zwodzony (kafle desek pojawiają się w wierszu 10)', () => {
    const w = mkWorld(); step(w, 5); const rt = w.rt; const gi = (x: number) => rt.tiles[10 * rt.grid.w + x];
    expect(gi(50)).toBe(T.EMPTY);
    for (const s of rt.switches) if (s.gate === 'br1') s.on = true;
    step(w, 5); expect(gi(50)).toBe(T.ONEWAY); expect(gi(58)).toBe(T.ONEWAY);
  });
  it('zawór (flood) zmienia poziom wody w kolumnach: najpierw stały, potem opada/rośnie do `to`', () => {
    const w = mkWorld(); step(w, 5); const rt = w.rt; const W = rt.grid.w;
    rt.floods.push({ x0: 1, x1: 10, y0: 0, y1: 9999, from: 15, to: 6, speed: 3, gate: 'zz', cur: 15 });
    rt.switches.push({ ...rt.switches[0], gate: 'zz', on: false });
    step(w, 5); expect(rt.water[16 * W + 5]).toBe(1); expect(rt.water[8 * W + 5]).toBe(0);
    rt.switches[rt.switches.length - 1].on = true;
    step(w, 60 * 4); expect(rt.water[8 * W + 5]).toBe(1); expect(rt.water[5 * W + 5]).toBe(0);
    expect(rt.water[8 * W + 12]).toBe(0);                          // poza kolumnami zbiornika bez zmian
  });
});
