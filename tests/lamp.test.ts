import { describe, expect, it } from 'vitest';
import type { PlayerInput } from '../src/engine/input';
import { defaultSettings } from '../src/engine/settings';
import { World } from '../src/game/world';
import { Session } from '../src/game/session';
import { newSave } from '../src/game/save';
import { getLevel } from '../src/game/levels';
import { TILE } from '../src/game/constants';
import { makeEnemy } from '../src/game/enemies';
import type { EnemyKind } from '../src/game/types';
import { stubAudio } from './bot';

const ACT = ['left', 'right', 'up', 'down', 'jump', 'run', 'attack', 'interact', 'switch'] as const;
const blank = () => Object.fromEntries(ACT.map((a) => [a, false])) as Record<(typeof ACT)[number], boolean>;
const idle = (): PlayerInput => ({ held: blank(), pressed: blank(), released: blank() });

/** W6-L1: ptaki nie nurkują na gracza stojącego w świetle lampy lub zapalonej latarni */
function attackStates(kind: EnemyKind, tx: number, bx: number, lightLantern = false): Set<string> {
  const w = new World(getLevel('W6-L1'), new Session(newSave('solo', 'M'), 0), { audio: stubAudio, settings: defaultSettings(), night: false });
  w.readyT = 0; w.rt.enemies.length = 0; w.update(1 / 60, [idle(), idle()]);
  if (lightLantern) for (const l of w.rt.lanterns) l.lit = true;
  const e = makeEnemy(kind, bx * TILE + TILE / 2, 28 * TILE); w.rt.enemies.push(e);
  const seen = new Set<string>(); const b = w.players[0].mv.body;
  for (let i = 0; i < 60 * 12; i++) {
    b.x = tx * TILE + TILE / 2 - b.w / 2; b.y = 28 * TILE - b.h; b.vx = b.vy = 0; w.players[0].hp = 99;
    w.update(1 / 60, [idle(), idle()]); seen.add(e.st);
  }
  return seen;
}

describe('latarnie jako bezpieczne strefy (W6-L1)', () => {
  it('Ćmoróg nurkuje w ciemności, ale nie na gracza w świetle stałej lampy (x=8)', () => {
    expect([...attackStates('cmorog', 20, 20)].some((s) => s === 'alert' || s === 'dive')).toBe(true);
    expect([...attackStates('cmorog', 8, 8)].some((s) => s === 'alert' || s === 'dive')).toBe(false);
  });
  it('Rogowróbel nie nurkuje nad lampą, ale nurkuje w ciemnej części ulicy', () => {
    expect(attackStates('rogowrobel', 20, 20).has('down')).toBe(true);
    expect(attackStates('rogowrobel', 8, 8).has('down')).toBe(false);
  });
  it('Krukoróg nie zrywa się do lotu nurkowego na gracza w świetle', () => {
    expect([...attackStates('krukorog', 20, 20)].some((s) => s === 'alert' || s === 'swoop')).toBe(true);
    expect([...attackStates('krukorog', 8, 8)].some((s) => s === 'alert' || s === 'swoop')).toBe(false);
  });
  it('latarnia na ulicy 1 chroni dopiero po zapaleniu (x=87)', () => {
    expect([...attackStates('cmorog', 87, 87)].some((s) => s === 'alert' || s === 'dive')).toBe(true);
    expect([...attackStates('cmorog', 87, 87, true)].some((s) => s === 'alert' || s === 'dive')).toBe(false);
  });
});
