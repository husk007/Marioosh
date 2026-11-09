/**
 * W8-L3 „Sala Tysiąca Posągów” (docs/design/09 §31, 11): monumentalna galeria na Katoblisie (0,95 g), w przekroju. Mechanika: TRZY OBWODY + UWOLNIENI MIESZKAŃCY.
 *  A „Nawa Pamięci” (x 1–71): rampa na galerię nad nawą (x 22–60) z przekaźnikiem obwodu 1; drabina w dół; brama g (x 72) i winda serwisowa dostają prąd z tego obwodu.
 *  B „Sala Balkonów” (x 76–147): parter z posągiem mieszkańca i punktem kontrolnym; na pierwszy balkon (wiersz 32) wjeżdża się TYLKO windą serwisową (zasilaną obwodem 1) —
 *     dalej drabiny: balkon 2 (przekaźnik obwodu 2 — otwiera bramę wyjściową z sali) i balkon 3 z Archiwum (ósmy fragment kryształu, notatka), przejście przez archiwum do bramy g2.
 *  C „Taras Latarni” (x 152–223): przekaźnik obwodu 3 otwiera Salę Wielkiej Latarni Scarlet (złota puszka), a ostatnia brama do tronu (wyjście X) otwiera się, gdy uwolnisz WSZYSTKICH
 *     trzech mieszkańców-posągów (parter A… galeria A, parter B, taras C). Wyższe kondygnacje — winda i drabiny, żadnych skoków po posągach (posągi dekoracyjne to tło).
 */
import { AuthoredRoom, Canvas, assemble, cx, feet } from '../authored';
import type { LevelData } from '../types';
import { TILE } from '../constants';

export function buildW8L3(): LevelData {
  const c = new Canvas(225, 44, '#');
  const carve = (x0: number, y0: number, x1: number, y1: number) => c.rect(x0, y0, x1, y1, '.');
  carve(1, 4, 71, 39);                                              // A
  carve(73, 31, 75, 39);                                            // przejście A→B (brama w kolumnie 72)
  c.rect(72, 31, 72, 39, '1');
  carve(76, 4, 147, 39);                                            // B
  carve(149, 11, 151, 15);                                          // przejście B→C (brama w kolumnie 148, wiersze 11–15)
  c.rect(148, 11, 148, 15, '2');
  carve(152, 4, 223, 15);                                           // C: taras (podłoga: wiersz 16)
  c.rect(188, 4, 189, 11, '#'); c.rect(188, 12, 188, 15, '3');      // wejście do Sali Latarni
  c.rect(208, 4, 209, 11, '#');                                     // wyjście z Sali Latarni (otwarte)
  c.rect(214, 4, 215, 11, '#'); c.rect(214, 12, 214, 15, '4');      // ostatnia brama (uwolnieni mieszkańcy)

  // A: rampa (6 wierszy) na galerię nad nawą, drabina w dół, osłony (głazy 2 wiersze)
  c.rampUp(10, 40, 6);
  c.rect(22, 34, 60, 39, '#'); c.ladder(61, 34, 39);
  c.rect(30, 32, 31, 33, '#'); c.rect(46, 32, 47, 33, '#'); c.rect(64, 38, 65, 39, '#');
  // B: balkony przy lewej ścianie, winda serwisowa, drabiny, archiwum
  c.rect(76, 32, 97, 32, '='); c.rect(98, 32, 100, 32, '=');        // balkon 1 + dok windy
  c.rect(76, 24, 116, 24, '=');                                     // balkon 2
  c.rect(76, 16, 147, 16, '=');                                     // balkon 3 (galeria)
  c.ladder(90, 24, 31); c.ladder(110, 16, 23);
  c.rect(126, 9, 143, 10, '#'); c.rect(126, 11, 127, 12, '#');      // archiwum: zadaszenie i nadproże wejścia (wejście 3 wiersze)
  c.rect(110, 38, 111, 39, '#'); c.rect(130, 38, 131, 39, '#');     // osłony przed Bazaliskiem na parterze B

  c.set(3, 39, 'S'); c.set(124, 39, 'K'); c.set(156, 15, 'K'); c.set(221, 15, 'X');
  c.set(6, 0, '?'); c.set(80, 0, '?'); c.set(154, 0, '?');
  c.set(38, 33, 'T'); c.set(117, 39, 'T'); c.set(178, 15, 'T');
  c.set(56, 33, 'Q'); c.set(114, 23, 'U'); c.set(170, 15, 'V');
  // PET (10)
  for (const [x, y] of [[4, 39], [26, 33], [50, 33], [84, 39], [104, 39], [128, 39], [80, 31], [96, 23], [134, 15], [160, 15]]) c.set(x, y, 'p');
  // puszki (16)
  for (const [x, y] of [[7, 39], [68, 39], [34, 33], [54, 33], [88, 39], [114, 39], [138, 39], [86, 31], [104, 23], [112, 15], [120, 15], [130, 15], [140, 15], [168, 15], [184, 15], [200, 15]]) c.set(x, y, 'k');
  c.set(206, 15, '*');                                              // złota puszka w Sali Latarni

  const room = new AuthoredRoom('W8-L3:main', c.rows(), { name: 'main', world: 8 });
  // bramy: obwód 1 (+ winda), obwód 2, obwód 3, uwolnieni mieszkańcy
  room.push({ t: 'gate', id: 'pwA', cells: room.gateCells.get('g1') ?? [], need: 1 });
  room.push({ t: 'gate', id: 'g2', cells: room.gateCells.get('g2') ?? [], need: 1 });
  room.push({ t: 'gate', id: 'g3', cells: room.gateCells.get('g3') ?? [], need: 1 });
  room.push({ t: 'gate', id: 'free1', cells: room.gateCells.get('g4') ?? [], need: 3 });
  const sw = (id: string, ch: string, gate: string, sym: number): void => { const m = room.at(ch); room.push({ t: 'switch', id, x: cx(m.tx), y: feet(m.ty), gate, style: 'relay', symbol: sym }); };
  sw('W8-L3:c1', 'Q', 'pwA', 0); sw('W8-L3:c2', 'U', 'g2', 1); sw('W8-L3:c3', 'V', 'g3', 2);
  room.push({ t: 'platform', x: 98 * TILE, y: 32 * TILE, w: 3, mode: 'v', range: 8 * TILE, speed: 60, offset: 0, dwell: 1.5, power: 'pwA' });
  // ósmy fragment kryształu i notatka w Archiwum
  room.push({ t: 'item', k: 'shard', x: cx(136), y: 15 * TILE + 16, id: 'shard:8' });
  room.push({ t: 'item', k: 'note', x: cx(141), y: 15 * TILE + 16, id: 'note:8' });
  room.push({ t: 'lantern', x: cx(198), y: feet(15), id: 'W8-L3:lt' });          // Wielka Latarnia Scarlet
  for (const [x, y] of [[8, 39], [40, 33], [66, 39], [82, 39], [118, 39], [126, 39], [84, 31], [102, 23], [120, 15], [156, 15], [176, 15], [196, 15], [218, 15]]) room.push({ t: 'lamp', x: cx(x), y: feet(y) });
  // posągi dekoracyjne (tło: „tysiąc posągów”)
  const deco: [number, number][] = [[6, 39], [24, 33], [36, 33], [44, 33], [52, 33], [62, 39], [68, 39], [78, 39], [92, 39], [96, 39], [108, 39], [120, 39], [134, 39], [142, 39], [78, 31], [92, 31],
    [78, 23], [86, 23], [98, 23], [106, 23], [78, 15], [92, 15], [100, 15], [116, 15], [124, 15], [144, 15], [158, 15], [164, 15], [174, 15], [182, 15], [192, 15], [194, 15], [202, 15], [212, 15], [218, 15]];
  deco.forEach(([x, y], i) => room.push({ t: 'decor', k: i % 3 === 2 ? 'guard' : 'statue', x: cx(x), y: feet(y) }));
  // Kamienioróg 10, Rogoróża 4, Bazalisk 5
  for (const [x, y] of [[28, 33], [46, 33], [66, 39], [84, 39], [94, 39], [82, 31], [100, 23], [100, 15], [160, 15], [198, 15]]) room.push({ t: 'enemy', k: 'kamienirog', x: cx(x), y: feet(y) });
  for (const [x, y] of [[80, 23], [90, 15], [172, 15], [204, 15]]) room.push({ t: 'enemy', k: 'rogoroza', x: cx(x), y: feet(y) });
  for (const [x, y] of [[69, 39], [140, 39], [164, 15], [183, 15], [202, 15]]) room.push({ t: 'enemy', k: 'bazalisk', x: cx(x), y: feet(y) });
  room.autoSpecs('W8-L3');
  return assemble({ id: 'W8-L3', world: 8, stage: 3, residents: 3, hints: ['hint.hall', 'hint.lift3', 'hint.freegate'], budget: { pet: 10, cans: 16, golden: 1 } }, [room]);
}
