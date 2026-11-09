import { it, expect } from 'vitest';
import { getLevel } from '../src/game/levels';
import { T } from '../src/game/types';
import { analyze } from './reach';
it('negatywny: bez drabiny taras jest nieosiągalny; bez przełącznika brama zamknięta', () => {
  const L = structuredClone(getLevel('W1-L1'));
  const r = L.rooms[0];
  for (let y = 9; y <= 13; y++) r.tiles[y * r.w + 102] = T.EMPTY;
  const a = analyze(L, 'D');
  const ex = r.specs.find((s) => s.t === 'exit')!;
  expect(a.reaches(0, ex.x, ex.y, 40, 10)).toBe(false);
  const L2 = structuredClone(getLevel('W1-L1'));
  L2.rooms[0].specs = L2.rooms[0].specs.filter((s) => !(s.t === 'switch' && s.id.endsWith('sw2')));
  const a2 = analyze(L2, 'M');
  const ex2 = L2.rooms[0].specs.find((s) => s.t === 'exit')!;
  expect(a2.reaches(0, ex2.x, ex2.y, 40, 10)).toBe(false);
}, 120000);
