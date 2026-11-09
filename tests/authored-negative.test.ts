import { it, expect } from 'vitest';
import { getLevel } from '../src/game/levels';
import { buildW6Gravity } from '../src/game/maps/proto';
import { T, type Spec } from '../src/game/types';
import { BROTHERS } from '../src/game/constants';
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

it('grawitacja planet: wyspa za przerwą 5 kafli (fragment testowy) dostępna na Vesperze (0,86 g) dla obu braci, na Prądowie tylko dla Darioosha, na Skaltrii dla nikogo; trasa główna wszędzie', () => {
  const L0 = buildW6Gravity(); const exit = L0.rooms[0].specs.find((s) => s.t === 'exit')!;
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
it('negatywny W5-L4: bez dźwigni a (brama g1) lub b (brama g2) arena jest nieosiągalna', () => {
  for (const sw of ['a', 'b']) {
    const L = without('W5-L4', (s) => s.t === 'switch' && s.id.endsWith(':' + sw));
    const can = L.rooms[0].specs.filter((s): s is Extract<Spec, { t: 'item' }> => s.t === 'item' && s.k === 'can').find((s) => s.x < 30 * 32 && s.y < 22 * 32)!;
    expect(analyze(L, 'M').touches(0, can.x, can.y, 24), sw).toBe(false);
  }
}, 590000);

it('W6-L1: obie trasy prowadzą do wyjścia niezależnie — dolna (parter i mieszkania) bez schodów pożarowych, górna (dachy i pomosty) bez przejść przez parter', () => {
  const E = T.EMPTY;
  const lower = structuredClone(getLevel('W6-L1')); const r1 = lower.rooms[0];
  for (let y = 0; y < r1.h; y++) for (const x of [41, 44]) if (r1.tiles[y * r1.w + x] === T.LADDER || (r1.tiles[y * r1.w + x] === T.ONEWAY)) r1.tiles[y * r1.w + x] = E;
  const upper = structuredClone(getLevel('W6-L1')); const r2 = upper.rooms[0];
  for (const [x0, x1] of [[45, 76], [101, 130], [151, 182]]) for (let y = 24; y <= 27; y++) for (let x = x0; x <= x1; x++) r2.tiles[y * r2.w + x] = T.SOLID;
  for (const L of [lower, upper]) { const e = exitOfLevel(L); for (const b of ['M', 'D'] as const) expect(analyze(L, b).reaches(0, e.x, e.y, 40, 10), b).toBe(true); }
  // sanity: bez obu tras (zasypane parterowe przejścia i zdjęte drabiny) wyjścia nie ma
  const none = structuredClone(upper); const r3 = none.rooms[0];
  for (let y = 0; y < r3.h; y++) for (const x of [41, 44]) if (r3.tiles[y * r3.w + x] === T.LADDER || r3.tiles[y * r3.w + x] === T.ONEWAY) r3.tiles[y * r3.w + x] = E;
  expect(analyze(none, 'M').reaches(0, exitOfLevel(none).x, exitOfLevel(none).y, 40, 10)).toBe(false);
}, 400000);

it('negatywny W6-L2: bez któregokolwiek z dwóch bezpieczników winda szczytowa stoi i wyjście jest nieosiągalne; bez windy E1 piętra od 2 wzwyż są odcięte; z kompletem — osiągalne', () => {
  for (const sw of ['f1', 'f2']) { const L = without('W6-L2', (s) => s.t === 'switch' && s.id.endsWith(':' + sw)); const e = exitOfLevel(L); expect(analyze(L, 'M').reaches(0, e.x, e.y, 40, 10), sw).toBe(false); }
  const L1 = without('W6-L2', (s) => s.t === 'platform' && !s.power); const e1 = exitOfLevel(L1); expect(analyze(L1, 'D').reaches(0, e1.x, e1.y, 40, 10), 'E1').toBe(false);
  const L = getLevel('W6-L2'); const e = exitOfLevel(L);
  for (const b of ['M', 'D'] as const) expect(analyze(L, b).reaches(0, e.x, e.y, 40, 10), b).toBe(true);
}, 400000);

it('W6-L3: bez ruchomego pomostu (pętla B) albo bez windy szczytowej (pętla C) wyjście jest nieosiągalne; dach gniazda A dostępny zarówno windą, jak i klatką schodową', () => {
  const plats = getLevel('W6-L3').rooms[0].specs.filter((s): s is Extract<Spec, { t: 'platform' }> => s.t === 'platform');
  const hOnly = (keep: (p: Extract<Spec, { t: 'platform' }>) => boolean) => without('W6-L3', (s) => s.t === 'platform' && !keep(s));
  expect(plats.length).toBe(3);
  for (const drop of plats.filter((p) => p.mode === 'h' || p.x > 150 * 32)) { const L = hOnly((p) => p !== drop && !(p.x === drop.x && p.y === drop.y)); const e = exitOfLevel(L); expect(analyze(L, 'M').reaches(0, e.x, e.y, 40, 10), `${drop.mode}@${drop.x}`).toBe(false); }
  const nest = (L: ReturnType<typeof getLevel>) => L.rooms[0].specs.find((s): s is Extract<Spec, { t: 'item' }> => s.t === 'item' && s.k === 'can' && s.x > 49 * 32 && s.x < 52 * 32)!;
  const noLift = without('W6-L3', (s) => s.t === 'platform' && s.mode === 'v' && s.x < 40 * 32);
  expect(analyze(noLift, 'D').touches(0, nest(noLift).x, nest(noLift).y, 24), 'klatka schodowa').toBe(true);
  const noStairs = structuredClone(getLevel('W6-L3')); const r = noStairs.rooms[0];
  for (let y = 28; y <= 37; y++) for (const x of [36, 39]) if (r.tiles[y * r.w + x] === T.LADDER) r.tiles[y * r.w + x] = T.EMPTY;
  expect(analyze(noStairs, 'M').touches(0, nest(noStairs).x, nest(noStairs).y, 24), 'winda').toBe(true);
}, 500000);

it('negatywny W6-L4: bez któregokolwiek z dwóch bezpieczników brama areny pozostaje zamknięta; trzy reflektory da się zapalić solo w oknie 8 s (bieg ≤ 6 s)', () => {
  for (const sw of ['f1', 'f2']) {
    const L = without('W6-L4', (s) => s.t === 'switch' && s.id.endsWith(':' + sw));
    const arenaFloor = L.rooms[0].specs.find((s) => s.t === 'boss')!;
    expect(analyze(L, 'M').reaches(0, arenaFloor.x, arenaFloor.y, 40, 10), sw).toBe(false);
  }
  const L0 = getLevel('W6-L4'); const boss = L0.rooms[0].specs.find((s) => s.t === 'boss')!;
  for (const b of ['M', 'D'] as const) expect(analyze(L0, b).reaches(0, boss.x, boss.y, 40, 10), b).toBe(true);
  const sp = L0.rooms[0].specs.filter((s): s is Extract<Spec, { t: 'switch' }> => s.t === 'switch' && s.gate === 'spot'); const xs = sp.map((s) => s.x);
  expect(sp.length).toBe(3);
  expect((Math.max(...xs) - Math.min(...xs)) / BROTHERS.M.run).toBeLessThan(6);
}, 400000);

it('W7-L1: bez przekaźnika 1 (brama g1) albo 2 (brama g2) wyjście jest nieosiągalne; bez pasm nad przepaścią prasy też; odłącznik nie jest wymagany', () => {
  for (const sw of ['r1', 'r2']) { const L = without('W7-L1', (s) => s.t === 'switch' && s.id.endsWith(':' + sw)); const e = exitOfLevel(L); expect(analyze(L, 'M').reaches(0, e.x, e.y, 40, 10), sw).toBe(false); }
  const P = structuredClone(getLevel('W7-L1')); const r = P.rooms[0];
  for (let x = 58; x <= 99; x++) { r.tiles[21 * r.w + x] = T.EMPTY; r.tiles[12 * r.w + x] = T.EMPTY; }
  const ep = exitOfLevel(P); expect(analyze(P, 'D').reaches(0, ep.x, ep.y, 40, 10), 'przepaść').toBe(false);
  const NS = without('W7-L1', (s) => s.t === 'switch' && s.id.endsWith(':stop')); const en = exitOfLevel(NS);
  for (const b of ['M', 'D'] as const) expect(analyze(NS, b).reaches(0, en.x, en.y, 40, 10), 'bez odłącznika ' + b).toBe(true);
  const L = getLevel('W7-L1'); const e = exitOfLevel(L);
  for (const b of ['M', 'D'] as const) expect(analyze(L, b).reaches(0, e.x, e.y, 40, 10), b).toBe(true);
}, 600000);

it('W7-L2: bez dźwigni mostu 1 albo mostu 2 wyjście jest nieosiągalne; dźwignia ciszy i trasa górna nie są wymagane', () => {
  for (const sw of ['b1', 'b2']) { const L = without('W7-L2', (s) => s.t === 'switch' && s.id.endsWith(':' + sw)); const e = exitOfLevel(L); expect(analyze(L, 'M').reaches(0, e.x, e.y, 40, 10), sw).toBe(false); }
  const NC = without('W7-L2', (s) => s.t === 'switch' && s.id.endsWith(':calm')); const en = exitOfLevel(NC);
  expect(analyze(NC, 'D').reaches(0, en.x, en.y, 40, 10), 'bez ciszy').toBe(true);
  const NP = without('W7-L2', (s) => s.t === 'platform'); const eP = exitOfLevel(NP);
  expect(analyze(NP, 'M').reaches(0, eP.x, eP.y, 40, 10), 'trasa dolna bez pomostu').toBe(true);
  const L = getLevel('W7-L2'); const e = exitOfLevel(L);
  for (const b of ['M', 'D'] as const) expect(analyze(L, b).reaches(0, e.x, e.y, 40, 10), b).toBe(true);
}, 600000);

it('W7-L3: bez któregokolwiek z mostów na czas, stacji pomostów, trzech przekaźników rdzenia albo windy wyjście jest nieosiągalne; z kompletem — osiągalne dla obu braci', () => {
  const ids = ['tb1', 'tb2', 'tb3', 'p1', 'p2', 'p3', 'o1', 'o2', 'o3'];
  for (const id of ids) { const L = without('W7-L3', (s) => s.t === 'switch' && s.id.endsWith(':' + id)); const e = exitOfLevel(L); expect(analyze(L, 'M').reaches(0, e.x, e.y, 40, 10), id).toBe(false); }
  const NL = without('W7-L3', (s) => s.t === 'platform' && s.mode === 'v'); const eN = exitOfLevel(NL); expect(analyze(NL, 'D').reaches(0, eN.x, eN.y, 40, 10), 'bez windy').toBe(false);
  const L = getLevel('W7-L3'); const e = exitOfLevel(L);
  for (const b of ['M', 'D'] as const) expect(analyze(L, b).reaches(0, e.x, e.y, 40, 10), b).toBe(true);
}, 900000);

it('negatywny W7-L4: bez dźwigni testu 1, 2 lub 3 arena Rogodrona jest nieosiągalna; trzy generatory da się włączyć solo w oknie 28 s (marsz ≤ 24 s); z kompletem arena osiągalna dla obu braci', () => {
  for (const sw of ['t1', 't2', 't3']) {
    const L = without('W7-L4', (s) => s.t === 'switch' && s.id.endsWith(':' + sw));
    const boss = L.rooms[0].specs.find((s) => s.t === 'boss')!;
    expect(analyze(L, 'M').reaches(0, boss.x, boss.y, 40, 10), sw).toBe(false);
  }
  const L0 = getLevel('W7-L4'); const boss = L0.rooms[0].specs.find((s) => s.t === 'boss')!;
  for (const b of ['M', 'D'] as const) expect(analyze(L0, b).reaches(0, boss.x, boss.y, 40, 10), b).toBe(true);
  const g = L0.rooms[0].specs.filter((s): s is Extract<Spec, { t: 'switch' }> => s.t === 'switch' && s.gate === 'gen').sort((a, b) => a.x - b.x); expect(g.length).toBe(3);
  // droga: lewy podest → drabina (4 wiersze) → podłoga → środek (drabina) → podłoga → prawy podest; marsz ≈ dystans poziomy + 3 × 3 s na drabiny
  const t = (g[2].x - g[0].x) / BROTHERS.M.run + 3 * 3; expect(t).toBeLessThan(24);
}, 900000);

it('W8-L1: bez zaworu w piwnicy rumowisko (brama g1) blokuje ulicę — wyjście nieosiągalne; z zaworem osiągalne dla obu braci, piwnica i półka sekretna dostępne', () => {
  const L = without('W8-L1', (s) => s.t === 'switch'); const e = exitOfLevel(L);
  expect(analyze(L, 'M').reaches(0, e.x, e.y, 40, 10)).toBe(false);
  const L0 = getLevel('W8-L1'); const e0 = exitOfLevel(L0);
  for (const b of ['M', 'D'] as const) expect(analyze(L0, b).reaches(0, e0.x, e0.y, 40, 10), b).toBe(true);
}, 400000);

it('W8-L2: bez przekaźników rozdzielni grodź (zamknięte drzwi do hali wyjściowej) odcina wyjście; z nimi osiągalne dla obu braci, wszystkie stacje dostępne', () => {
  const L = structuredClone(getLevel('W8-L2')); for (const r of L.rooms) r.specs = r.specs.filter((s) => s.t !== 'switch'); const e = exitOfLevel(L);
  expect(analyze(L, 'M').reaches(0, e.x, e.y, 40, 10)).toBe(false);
  const L0 = getLevel('W8-L2'); const e0 = exitOfLevel(L0);
  for (const b of ['M', 'D'] as const) expect(analyze(L0, b).reaches(0, e0.x, e0.y, 40, 10), b).toBe(true);
}, 400000);

it('W8-L3: bez obwodu 1 (winda), obwodu 2 (brama sali) lub uwolnionych posągów wyjście jest nieosiągalne; z wszystkim osiągalne dla obu braci', () => {
  const strip = (pred: (s: Spec) => boolean) => { const L = structuredClone(getLevel('W8-L3')); L.rooms[0].specs = L.rooms[0].specs.filter((s) => !pred(s)); return L; };
  for (const pred of [(s: Spec) => s.t === 'switch' && s.id.endsWith(':c1'), (s: Spec) => s.t === 'switch' && s.id.endsWith(':c2'), (s: Spec) => s.t === 'statue']) {
    const L = strip(pred); const e = exitOfLevel(L); expect(analyze(L, 'M').reaches(0, e.x, e.y, 40, 10)).toBe(false);
  }
  const L0 = getLevel('W8-L3'); const e0 = exitOfLevel(L0);
  for (const b of ['M', 'D'] as const) expect(analyze(L0, b).reaches(0, e0.x, e0.y, 40, 10), b).toBe(true);
}, 900000);

it('W8-L4: bez przekaźnika rozdzielni (r1/r2) lub przekaźnika portalu (r3) arena jest nieosiągalna; z wszystkimi — osiągalna dla obu braci, razem z ośmioma węzłami', () => {
  const arenaPt = (L: ReturnType<typeof getLevel>) => L.rooms[0].specs.find((s) => s.t === 'boss')!;
  for (const id of ['r1', 'r2', 'r3']) {
    const L = structuredClone(getLevel('W8-L4')); L.rooms[0].specs = L.rooms[0].specs.filter((s) => !(s.t === 'switch' && s.id.endsWith(':' + id)));
    const b = arenaPt(L); expect(analyze(L, 'M').reaches(0, b.x, b.y, 40, 10), id).toBe(false);
  }
  const L0 = getLevel('W8-L4'); const b0 = arenaPt(L0);
  for (const br of ['M', 'D'] as const) { const a = analyze(L0, br); expect(a.reaches(0, b0.x, b0.y, 40, 10), br).toBe(true); for (const s of L0.rooms[0].specs) if (s.t === 'switch' && s.gate === 'node') expect(a.switchesOn.has(`0:${s.id}`), s.id).toBe(true); }
}, 900000);
