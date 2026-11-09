/**
 * W8-L4 „Tron Katoblepasa” (docs/design/09 §32, 11): twierdza na Katoblisie (0,95 g) → arena Katoblepasa na solidnej posadzce. Wyjście = pokonanie bossa (brak znacznika X).
 *  1. Dziedziniec (x 1–69, wysoka sala pod gołym stropem): głazy-osłony, Bazalisk (strefa rażenia: ten sam wiersz ±56 px, do 280 px), drabina do rozdzielni (x 70).
 *  2. Podziemna rozdzielnia (x 71–140): dwa piętra korytarzy (dolny z przekaźnikiem 1, górny z przekaźnikiem 2; drabiny w x 78 i 128); brama g1 (x 134) otwiera się dwoma przekaźnikami.
 *  3. Galeria Luster (x 141–202, wysokość 28 wierszy): parter z trzema Bazaliskami za głazami-osłonami ALBO balkon (drabiny 10 wierszy) nad zasięgiem rażenia; przekaźnik 3 stoi na górnym balkonie (otwiera portal areny, x 204).
 *  4. Arena (x 206–245): trzy filary (faza 1: szarża Katoblepasa je rozbija), trzy lustra (faza 2: ustaw lustro i odbij Spojrzenie), osiem Węzłów Energii na czterech galeriach (faza 3).
 *     Boss nie dostaje ciosów kluczem — tylko mechanika filarów, luster i węzłów. Brak skakania po głowie.
 */
import { AuthoredRoom, Canvas, assemble, cx, feet } from '../authored';
import type { LevelData } from '../types';

export function buildW8L4(): LevelData {
  const c = new Canvas(250, 46, '#');
  const carve = (x0: number, y0: number, x1: number, y1: number) => c.rect(x0, y0, x1, y1, '.');
  carve(1, 10, 69, 29);                                             // dziedziniec (podłoga: wiersz 30)
  carve(70, 10, 70, 39);                                            // szyb z drabiną
  carve(71, 35, 140, 39);                                           // rozdzielnia — piętro dolne
  carve(78, 28, 128, 32);                                           // rozdzielnia — piętro górne
  c.rect(134, 35, 134, 39, '1');                                    // brama g1 (dwa przekaźniki)
  carve(141, 12, 202, 39);                                          // Galeria Luster
  carve(203, 32, 205, 39); c.rect(204, 32, 204, 39, '2');           // portal areny (brama g2: przekaźnik 3)
  carve(206, 8, 245, 39);                                           // arena

  c.ladder(70, 30, 39);                                             // dziedziniec → rozdzielnia (10 wierszy)
  c.ladder(78, 33, 39); c.ladder(128, 33, 39);                      // piętro dolne ↔ górne (7 wierszy)
  for (const x of [14, 30, 54]) c.rect(x, 28, x + 1, 29, '#');      // głazy-osłony na dziedzińcu (2 wiersze)
  for (const x of [156, 178, 188]) c.rect(x, 38, x + 1, 39, '#');   // głazy-osłony w galerii
  c.rect(149, 30, 197, 30, '='); c.ladder(148, 30, 39); c.ladder(198, 30, 39);     // balkon (drabiny 10 wierszy)
  c.rect(176, 22, 197, 22, '='); c.ladder(175, 22, 29);             // górny balkon z przekaźnikiem 3
  // arena: cztery galerie z Węzłami Energii (wiersz 36 — 4 wiersze nad podłogą, drabiny po prawej)
  for (const x0 of [206, 216, 226, 236]) { c.rect(x0, 36, x0 + 5, 36, '='); c.ladder(x0 + 6, 36, 39); }

  c.set(3, 29, 'S'); c.set(74, 39, 'K'); c.set(202, 39, 'K');
  c.set(28, 0, '?'); c.set(72, 0, '?'); c.set(200, 0, '?');
  c.set(48, 29, 'T'); c.set(138, 39, 'T'); c.set(168, 39, 'T');
  c.set(100, 39, 'Q'); c.set(104, 32, 'R'); c.set(192, 21, 'U');
  c.set(196, 21, 'B');                                              // zielona bateria (sekret: górny balkon)
  // PET (8)
  for (const [x, y] of [[10, 29], [52, 29], [88, 39], [116, 39], [100, 32], [158, 39], [170, 29], [228, 39]]) c.set(x, y, 'p');
  // puszki (10)
  for (const [x, y] of [[18, 29], [40, 29], [66, 29], [82, 39], [106, 39], [94, 32], [114, 32], [162, 29], [186, 29], [186, 21]]) c.set(x, y, 'k');

  const room = new AuthoredRoom('W8-L4:main', c.rows(), { name: 'main', world: 8, bossArena: { x0: 206, x1: 245 } });
  room.push({ t: 'gate', id: 'g1', cells: room.gateCells.get('g1') ?? [], need: 2 });
  room.push({ t: 'gate', id: 'g2', cells: room.gateCells.get('g2') ?? [], need: 1 });
  const sw = (id: string, ch: string, gate: string, sym: number): void => { const m = room.at(ch); room.push({ t: 'switch', id, x: cx(m.tx), y: feet(m.ty), gate, style: 'relay', symbol: sym }); };
  sw('W8-L4:r1', 'Q', 'g1', 0); sw('W8-L4:r2', 'R', 'g1', 1); sw('W8-L4:r3', 'U', 'g2', 2);
  // arena: filary (faza 1), lustra (faza 2), osiem Węzłów Energii (faza 3)
  for (const x of [214, 224, 234]) room.push({ t: 'decor', k: 'pillar', x: cx(x), y: feet(39) });
  for (const x of [209, 219, 239]) room.push({ t: 'decor', k: 'mirror', x: cx(x), y: feet(39) });
  [207, 210, 217, 220, 227, 230, 237, 240].forEach((x, i) => room.push({ t: 'switch', id: `W8-L4:node${i}`, x: cx(x), y: feet(35), gate: 'node', style: 'rune', symbol: i % 4 }));
  for (const [x, y] of [[8, 29], [36, 29], [60, 29], [76, 39], [98, 39], [120, 39], [136, 39], [156, 39], [176, 39], [200, 39], [100, 32], [180, 21]]) room.push({ t: 'lamp', x: cx(x), y: feet(y) });
  // Kamienioróg 8, Bykobieg 4, Bazalisk 5
  for (const [x, y] of [[20, 29], [42, 29], [66, 29], [84, 39], [110, 39], [90, 32], [160, 29], [184, 29]]) room.push({ t: 'enemy', k: 'kamienirog', x: cx(x), y: feet(y) });
  for (const [x, y] of [[24, 29], [112, 32], [122, 39], [155, 29]]) room.push({ t: 'enemy', k: 'bykobieg', x: cx(x), y: feet(y) });
  for (const [x, y] of [[34, 29], [58, 29], [162, 39], [184, 39], [194, 39]]) room.push({ t: 'enemy', k: 'bazalisk', x: cx(x), y: feet(y) });
  room.push({ t: 'boss', k: 'katoblepas', x: cx(226), y: feet(39) });
  room.autoSpecs('W8-L4');
  return assemble({ id: 'W8-L4', world: 8, stage: 4, boss: 'katoblepas', residents: 3, hints: ['hint.beam', 'hint.switch', 'bosshint.katoblepas'], budget: { pet: 8, cans: 10, golden: 0 } }, [room]);
}
