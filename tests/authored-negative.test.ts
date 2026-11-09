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

it('negatywny W1-L2: bez windy chodnik górny i wyjście są nieosiągalne; bez przekaźnika B brama zamknięta', () => {
  const exitOf = (L: ReturnType<typeof getLevel>) => L.rooms[0].specs.find((s) => s.t === 'exit')!;
  const L = structuredClone(getLevel('W1-L2'));
  L.rooms[0].specs = L.rooms[0].specs.filter((s) => s.t !== 'platform');
  const a = analyze(L, 'M');
  expect(a.reaches(0, exitOf(L).x, exitOf(L).y, 40, 10)).toBe(false);
  const L2 = structuredClone(getLevel('W1-L2'));
  L2.rooms[0].specs = L2.rooms[0].specs.filter((s) => !(s.t === 'switch' && s.id.endsWith(':rb')));
  const a2 = analyze(L2, 'D');
  expect(a2.reaches(0, exitOf(L2).x, exitOf(L2).y, 40, 10)).toBe(false);
  // drabina 2 usunięta: z chodnika nie da się zejść do magazynu bez obrażeń
  const L3 = structuredClone(getLevel('W1-L2'));
  const r = L3.rooms[0]; for (let y = 9; y <= 16; y++) r.tiles[y * r.w + 100] = y <= 10 ? T.SOLID : T.EMPTY;
  const a3 = analyze(L3, 'M');
  expect(a3.reaches(0, exitOf(L3).x, exitOf(L3).y, 40, 10)).toBe(false);
}, 240000);
