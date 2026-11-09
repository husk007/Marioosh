import { describe, expect, it } from 'vitest';
import type { PlayerInput } from '../src/engine/input';
import { defaultSettings } from '../src/engine/settings';
import { World } from '../src/game/world';
import { Session } from '../src/game/session';
import { newSave } from '../src/game/save';
import { getLevel } from '../src/game/levels';
import { stubAudio } from './bot';

const ACT = ['left', 'right', 'up', 'down', 'jump', 'run', 'attack', 'interact', 'switch'] as const;
const blank = () => Object.fromEntries(ACT.map((a) => [a, false])) as Record<(typeof ACT)[number], boolean>;
const idle = (): PlayerInput => ({ held: blank(), pressed: blank(), released: blank() });
const step = (w: World, n: number) => { for (let i = 0; i < n; i++) w.update(1 / 60, [idle(), idle()]); };

describe('winda zasilana bezpiecznikami (W6-L2)', () => {
  it('winda szczytowa stoi bez prądu i rusza po włączeniu obu bezpieczników; winda E1 jeździ od razu', () => {
    const w = new World(getLevel('W6-L2'), new Session(newSave('solo', 'M'), 0), { audio: stubAudio, settings: defaultSettings(), night: false });
    w.readyT = 0; w.rt.enemies.length = 0; step(w, 3);
    const e3 = w.rt.plats.find((p) => p.power === 'pw')!, e1 = w.rt.plats.find((p) => !p.power)!;
    const y3 = e3.y, y1 = e1.y; step(w, 60 * 8);
    expect(e3.y).toBe(y3); expect(e1.y).not.toBe(y1);
    const sw = w.rt.switches.filter((s) => s.gate === 'pw'); expect(sw.length).toBe(2);
    sw[0].on = true; step(w, 5); expect(w.rt.gates.find((g) => g.id === 'pw')!.open).toBe(false);
    sw[1].on = true; step(w, 5); expect(w.rt.gates.find((g) => g.id === 'pw')!.open).toBe(true);
    step(w, 60 * 6); expect(e3.y).toBeGreaterThan(y3);
  });
});
