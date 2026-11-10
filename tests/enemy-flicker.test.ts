import { it } from 'vitest';
import type { PlayerInput } from '../src/engine/input';
import { defaultSettings } from '../src/engine/settings';
import { World } from '../src/game/world';
import { Session } from '../src/game/session';
import { newSave } from '../src/game/save';
import { getLevel } from '../src/game/levels';
import { AUTHORED } from '../src/game/maps';
import { stubAudio } from './bot';
const ACT = ['left', 'right', 'up', 'down', 'jump', 'run', 'attack', 'interact', 'switch'] as const;
const blank = () => Object.fromEntries(ACT.map((a) => [a, false])) as Record<(typeof ACT)[number], boolean>;
const idle = (): PlayerInput => ({ held: blank(), pressed: blank(), released: blank() });
import { expect } from 'vitest';
/** Regresja: mob nie może migać lewo-prawo (zmiana kierunku co kilka klatek) ani zawieszać się przy ścianie — w żadnym z 32 poziomów, przez 30 s. */
it('żaden mob w żadnym poziomie nie zmienia kierunku w serii co kilka klatek', () => {
  const bad: string[] = [];
  for (const id of Object.keys(AUTHORED)) {
    const w = new World(getLevel(id), new Session(newSave('solo', 'M'), 0), { audio: stubAudio, settings: defaultSettings(), night: false });
    w.readyT = 0;
    const st = new Map<object, { dir: number; lastFlip: number; rapid: number }>();
    for (const e of w.rt.enemies) st.set(e, { dir: e.dir, lastFlip: -999, rapid: 0 });
    for (let i = 0; i < 60 * 30; i++) {
      w.update(1 / 60, [idle(), idle()]);
      for (const e of w.rt.enemies) { const s = st.get(e); if (!s || e.dead) continue; if (e.dir !== s.dir) { if (i - s.lastFlip < 8) s.rapid++; s.lastFlip = i; s.dir = e.dir; } }
    }
    for (const e of w.rt.enemies) { const s = st.get(e); if (s && s.rapid > 3) bad.push(`${id} ${e.kind} @${Math.round(e.b.x / 32)},${Math.round(e.b.y / 32)} rapid=${s.rapid} st=${e.st}`); }
  }
  expect(bad).toEqual([]);
}, 300000);
