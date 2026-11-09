import { it, expect } from 'vitest';
import { getLevel } from '../src/game/levels';
import { T, type Spec } from '../src/game/types';
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

it('grawitacja planet: wyspa za przerwą 5 kafli (W6-L1) dostępna na Vesperze (0,86 g) dla obu braci, na Prądowie tylko dla Darioosha, na Skaltrii dla nikogo; trasa główna wszędzie', () => {
  const L0 = getLevel('W6-L1'); const exit = L0.rooms[0].specs.find((s) => s.t === 'exit')!;
  const island = (L0.rooms[0].specs.filter((s) => s.t === 'item') as Extract<Spec, { t: 'item' }>[]).find((s) => s.k === 'pet' && s.x > 77 * 32)!;
  const probe = (planet: number, b: 'M' | 'D') => { const L = structuredClone(L0); L.planet = planet; const a = analyze(L, b); return { exit: a.reaches(0, exit.x, exit.y, 40, 10), island: a.touches(0, island.x, island.y, 24) }; };
  expect(probe(6, 'M')).toEqual({ exit: true, island: true }); expect(probe(6, 'D')).toEqual({ exit: true, island: true });
  expect(probe(0, 'M')).toEqual({ exit: true, island: false }); expect(probe(0, 'D')).toEqual({ exit: true, island: true });
  expect(probe(5, 'M')).toEqual({ exit: true, island: false }); expect(probe(5, 'D')).toEqual({ exit: true, island: false });
}, 600000);

it('W5-L1 (Skaltria 1,14 g): wyjście osiągalne dla obu braci', () => {
  const L = getLevel('W5-L1'); const exit = L.rooms[0].specs.find((s) => s.t === 'exit')!;
  for (const b of ['M', 'D'] as const) expect(analyze(L, b).reaches(0, exit.x, exit.y, 40, 10), b).toBe(true);
}, 200000);

/** Aqualis: każdy element mechaniki wody jest NIEZBĘDNY (bez niego wyjście jest nieosiągalne) */
const exitOfLevel = (L: ReturnType<typeof getLevel>) => L.rooms[0].specs.find((s) => s.t === 'exit')!;
const without = (id: string, pred: (s: Spec) => boolean) => { const L = structuredClone(getLevel(id)); L.rooms[0].specs = L.rooms[0].specs.filter((s) => !pred(s)); return L; };
it('negatywny W4-L1: bez dźwigni mostu zwodzonego (l1) wyspa B i wyjście są nieosiągalne; bez drugiej dźwigni (l2) również; z obiema — osiągalne', () => {
  for (const sw of ['l1', 'l2']) { const L = without('W4-L1', (s) => s.t === 'switch' && s.id.endsWith(':' + sw)); const e = exitOfLevel(L); expect(analyze(L, 'M').reaches(0, e.x, e.y, 40, 10), sw).toBe(false); }
  const L = getLevel('W4-L1'); const e = exitOfLevel(L); expect(analyze(L, 'D').reaches(0, e.x, e.y, 40, 10)).toBe(true);
}, 300000);
it('negatywny W4-L2: bez któregokolwiek z trzech bezpieczników śluza zostaje zamknięta', () => {
  for (const sw of ['b1', 'b3']) { const L = without('W4-L2', (s) => s.t === 'switch' && s.id.endsWith(':' + sw)); const e = exitOfLevel(L); expect(analyze(L, 'M').reaches(0, e.x, e.y, 40, 10), sw).toBe(false); }
}, 300000);
it('negatywny W4-L3: bez zaworu A (spust) dolny korytarz jest za długi na jeden oddech; bez zaworu B nie da się wypłynąć do wysokich drzwi', () => {
  for (const sw of ['vA', 'vB']) { const L = without('W4-L3', (s) => s.t === 'switch' && s.id.endsWith(':' + sw)); const e = exitOfLevel(L); expect(analyze(L, 'M').reaches(0, e.x, e.y, 40, 10), sw).toBe(false); }
}, 300000);
it('negatywny W1-L3: bez wciągarki mostu 1 (w1), bez wagonika nad kanionem 2 i bez rozdzielnicy na słupie (w3) wyjście jest nieosiągalne', () => {
  for (const sw of ['w1', 'w3']) { const L = without('W1-L3', (s) => s.t === 'switch' && s.id.endsWith(':' + sw)); const e = exitOfLevel(L); expect(analyze(L, 'M').reaches(0, e.x, e.y, 40, 10), sw).toBe(false); }
  const L = without('W1-L3', (s) => s.t === 'platform'); const e = exitOfLevel(L); expect(analyze(L, 'D').reaches(0, e.x, e.y, 40, 10), 'wagonik').toBe(false);
}, 400000);
it('negatywny W2-L1: bez żurawia (pomostu nad fosą) wyjście jest nieosiągalne', () => {
  const L = without('W2-L1', (s) => s.t === 'platform'); const e = exitOfLevel(L);
  for (const b of ['M', 'D'] as const) expect(analyze(L, b).reaches(0, e.x, e.y, 40, 10), b).toBe(false);
}, 300000);
it('negatywny W2-L2: bez dźwigni blokady prasy albo bez pomostu inspekcyjnego wyjście jest nieosiągalne; bez zwrotnicy skarbiec zostaje zamknięty', () => {
  for (const pred of [(s: Spec) => s.t === 'switch' && s.id.endsWith(':lock'), (s: Spec) => s.t === 'platform']) { const L = without('W2-L2', pred); const e = exitOfLevel(L); expect(analyze(L, 'M').reaches(0, e.x, e.y, 40, 10)).toBe(false); }
  const L = without('W2-L2', (s) => s.t === 'switch' && s.id.endsWith(':t2'));
  const vault = L.rooms[0].specs.find((s): s is Extract<Spec, { t: 'item' }> => s.t === 'item' && s.k === 'can' && s.y > 34 * 32)!;
  expect(analyze(L, 'D').touches(0, vault.x, vault.y, 24)).toBe(false);
}, 400000);
it('negatywny W2-L3: bez panelu belki 1 lub 2 oraz bez belki 3 kolejny most nie powstaje i wyjście jest nieosiągalne', () => {
  for (const sw of ['p1', 'p2']) { const L = without('W2-L3', (s) => s.t === 'switch' && s.id.endsWith(':' + sw)); const e = exitOfLevel(L); expect(analyze(L, 'M').reaches(0, e.x, e.y, 40, 10), sw).toBe(false); }
  const L = without('W2-L3', (s) => s.t === 'span' && s.gate === 'm3'); const e = exitOfLevel(L); expect(analyze(L, 'D').reaches(0, e.x, e.y, 40, 10), 'm3').toBe(false);
}, 590000);
it('negatywny W2-L4: bez żaluzji (w), bez wyłącznika A albo B arena jest nieosiągalna, a oba pulpity suwnicy są osiągalne', () => {
  for (const sw of ['w', 'a', 'b']) { const L = without('W2-L4', (s) => s.t === 'switch' && s.id.endsWith(':' + sw)); expect(analyze(L, 'M').reaches(0, 122 * 32 + 16, 22 * 32, 40, 10), sw).toBe(false); }
  const a = analyze(getLevel('W2-L4'), 'D'); expect(a.switchesOn.has('0:W2-L4:c1')).toBe(true); expect(a.switchesOn.has('0:W2-L4:c2')).toBe(true);
}, 590000);
it('negatywny W3-L2: bez dźwigni l1 (taras 2) i bez dźwigni l2 (taras 4) wyjście jest nieosiągalne', () => {
  for (const sw of ['l1', 'l2']) { const L = without('W3-L2', (s) => s.t === 'switch' && s.id.endsWith(':' + sw)); const e = exitOfLevel(L); expect(analyze(L, 'M').reaches(0, e.x, e.y, 40, 10), sw).toBe(false); }
}, 400000);
it('negatywny W3-L4: bez dźwigni l1 (galeria) lub l2 (półka) brama areny jest zamknięta i arena nieosiągalna', () => {
  for (const sw of ['l1', 'l2']) {
    const L = without('W3-L4', (s) => s.t === 'switch' && s.id.endsWith(':' + sw));
    const kp = L.rooms[0].specs.filter((s): s is Extract<Spec, { t: 'checkpoint' }> => s.t === 'checkpoint').find((s) => s.x > 99 * 32)!;
    expect(analyze(L, 'M').reaches(0, kp.x, kp.y, 40, 10), sw).toBe(false);
  }
}, 400000);
it('negatywny W5-L2: brama rozdzielni wymaga DWÓCH z trzech zasilań — brak jednego nie przeszkadza, brak dwóch zamyka wyjście', () => {
  const sws = ['a', 'b', 'c'];
  const reach = (L: ReturnType<typeof getLevel>) => { const e = exitOfLevel(L); return analyze(L, 'M').reaches(0, e.x, e.y, 40, 10); };
  for (const drop of [['a', 'b'], ['a', 'c'], ['b', 'c']]) { const L = without('W5-L2', (s) => s.t === 'switch' && drop.some((d) => s.id.endsWith(':' + d))); expect(reach(L), drop.join('')).toBe(false); }
  expect(sws.length).toBe(3);
  const L1 = without('W5-L2', (s) => s.t === 'switch' && s.id.endsWith(':b')); expect(reach(L1)).toBe(true);
}, 590000);
it('negatywny W5-L2: bez kolejki kopalniana wschodnia sztolnia (przekaźnik) jest nieosiągalna', () => {
  const L = without('W5-L2', (s) => s.t === 'platform'); const sw = L.rooms[0].specs.find((s) => s.t === 'switch' && s.id.endsWith(':b'))!;
  expect(analyze(L, 'D').switchesOn.has(`0:${sw.t === 'switch' ? sw.id : ''}`)).toBe(false);
}, 300000);
it('negatywny W5-L3: bez zwrotnicy (dźwigni na tarasie) rumowisko nie otwiera się; bez windy taras jest nieosiągalny', () => {
  const reach = (L: ReturnType<typeof getLevel>) => { const e = exitOfLevel(L); return analyze(L, 'D').reaches(0, e.x, e.y, 40, 10); };
  expect(reach(without('W5-L3', (s) => s.t === 'switch'))).toBe(false);
  expect(reach(without('W5-L3', (s) => s.t === 'platform'))).toBe(false);
}, 400000);
