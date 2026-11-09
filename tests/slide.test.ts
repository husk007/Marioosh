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

/** W5-L1: osuw ostrzega 1,8 s przed spadkiem; nawis (lity łuk) chroni, odkryty odcinek nie */
function worldAt(tx: number): World {
  const w = new World(getLevel('W5-L1'), new Session(newSave('solo', 'M'), 0), { audio: stubAudio, settings: defaultSettings(), night: false });
  w.readyT = 0; w.rt.enemies.length = 0; step(w, 3);
  const b = w.players[0].mv.body; b.x = tx * TILE + TILE / 2 - b.w / 2; b.y = 28 * TILE - b.h; b.vx = b.vy = 0; w.players[0].safe = { x: b.x + b.w / 2, y: 28 * TILE };
  return w;
}
const hold = (w: World, tx: number, secs: number) => { const b = w.players[0].mv.body; for (let i = 0; i < 60 * secs; i++) { step(w, 1); b.x = tx * TILE + TILE / 2 - b.w / 2; b.vx = 0; } };

describe('osuw skalny (W5-L1)', () => {
  it('dwie strefy osuwu; pod nawisem (łuk 37–44) gracz przez 40 s nie traci zdrowia', () => {
    const w = worldAt(40); expect(w.rt.slides.length).toBe(2);
    hold(w, 40, 40); expect(w.players[0].hp).toBe(MAX_HP);
  });
  it('na odkrytym odcinku (46–52) osuw rani gracza', () => {
    const w = worldAt(49); hold(w, 49, 20); expect(w.players[0].hp).toBeLessThan(MAX_HP);
  });
  it('ostrzeżenie (komunikat, kurz) poprzedza spadek kamieni o ≥ 1,5 s', () => {
    const w = worldAt(41); const sl = w.rt.slides[0]; let warnAt = -1, rockAt = -1; let t = 0;
    for (let i = 0; i < 60 * 12 && rockAt < 0; i++) { step(w, 1); t += 1 / 60; if (sl.warned && warnAt < 0) warnAt = t; if (w.projs.some((p) => p.kind === 'rock') && rockAt < 0) rockAt = t; }
    expect(warnAt).toBeGreaterThan(0); expect(rockAt - warnAt).toBeGreaterThan(1.5);
  });
  it('wszystkie nawisy są dostępne od poziomu dna z wysokością ≥ 4 wierszy pod płytą (przejście bez zaczepiania)', () => {
    const r = getLevel('W5-L1').rooms[0];
    for (const x of [37, 53, 69, 98, 111]) for (let dx = 1; dx <= 4; dx++) for (let y = 24; y <= 27; y++) expect(r.tiles[y * r.w + x + dx], `${x + dx},${y}`).toBe(0);
  });
});
