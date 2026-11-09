/**
 * W5-L4 „Twierdza Ceratopsora” (docs/design/09 §20, 11): skalna warownia na dwóch wysokościach — dolna hala, szyb z drabinami (zygzak), górna hala z dwiema bramami i arena.
 * Dolna hala: Bykobiegi, Gekorogi, Bazalisk za skałą, dźwignia bramy g1 przy szybie. Górna hala (idzie się na zachód): brama g1 (x 48), dźwignia bramy g2 przy szybie, brama g2 (x 34) i arena.
 * Arena: dwie kolumny (4 wiersze) dzielą salę na trzy pasy; galeria nad nimi (dwie drabiny) z dźwignią PIECZĘCI. Ceratopsor szarżuje w stronę gracza i zatrzymuje się na kolumnie lub ścianie.
 * Pieczęć (16 s) zdejmuje pancerz — dopiero wtedy utknięty boss jest podatny na uderzenie. Brak skakania po głowie.
 */
import { AuthoredRoom, Canvas, assemble, cx, feet } from '../authored';
import type { LevelData } from '../types';

export function buildW5L4(): LevelData {
  const c = new Canvas(100, 40, '#');
  const carve = (x0: number, y0: number, x1: number, y1: number) => c.rect(x0, y0, x1, y1, '.');
  carve(1, 29, 94, 36);                                  // dolna hala (stoi się w wierszu 36)
  carve(90, 17, 94, 28);                                 // szyb
  carve(1, 17, 89, 24);                                  // górna hala (wiersz 24)
  carve(2, 12, 33, 24);                                  // arena
  c.rect(90, 31, 94, 31, '='); c.ladder(94, 31, 36); c.ladder(90, 25, 30);   // zygzak: dół → półka → górna hala
  for (const x of [20, 40, 70, 78]) c.rect(x, 35, x + 1, 36, '#');          // skały-osłony w dolnej hali
  c.rect(80, 23, 81, 24, '#');                           // skała-osłona w górnej hali
  c.rect(12, 21, 13, 24, '#'); c.rect(22, 21, 23, 24, '#');                   // kolumny areny
  c.rect(8, 20, 28, 20, '='); c.ladder(7, 20, 24); c.ladder(29, 20, 24);      // galeria nad kolumnami
  c.rect(48, 17, 48, 24, '1'); c.rect(34, 17, 34, 24, '2');                   // bramy g1, g2

  c.set(3, 36, 'S'); c.set(40, 36, 'K'); c.set(36, 24, 'K');
  c.set(6, 0, '?'); c.set(20, 0, '?'); c.set(60, 0, '?');
  for (const [x, y] of [[6, 36], [14, 36], [30, 36], [46, 36], [58, 36], [74, 36], [82, 24], [70, 24], [56, 24], [44, 24], [38, 24], [92, 30]]) c.set(x, y, 'p');
  for (const [x, y] of [[8, 36], [24, 36], [36, 36], [52, 36], [64, 36], [76, 36], [76, 24], [62, 24], [40, 24], [10, 19], [26, 19]]) c.set(x, y, 'k');
  c.set(44, 36, 'T'); c.set(66, 24, 'T'); c.set(42, 24, 'T');
  c.set(84, 36, 'Q'); c.set(86, 24, 'R'); c.set(18, 19, 'U');

  const room = new AuthoredRoom('W5-L4:main', c.rows(), { name: 'main', world: 5, bossArena: { x0: 2, x1: 33 } });
  room.push({ t: 'gate', id: 'g1', cells: room.gateCells.get('g1') ?? [], need: 1 });
  room.push({ t: 'gate', id: 'g2', cells: room.gateCells.get('g2') ?? [], need: 1 });
  const sw = (id: string, ch: string, gate: string, sym: number, style: 'lever' | 'relay'): void => { const m = room.at(ch); room.push({ t: 'switch', id, x: cx(m.tx), y: feet(m.ty), gate, style, symbol: sym }); };
  sw('W5-L4:a', 'Q', 'g1', 0, 'lever'); sw('W5-L4:b', 'R', 'g2', 1, 'relay'); sw('W5-L4:seal', 'U', 'seal', 2, 'lever');
  for (const [x, y] of [[16, 36], [60, 36], [74, 24], [40, 24]]) room.push({ t: 'enemy', k: 'bykobieg', x: cx(x), y: feet(y) });
  for (const [x, y] of [[30, 36], [50, 36], [72, 36], [80, 24], [60, 24]]) room.push({ t: 'enemy', k: 'gekorog', x: cx(x), y: feet(y) });
  for (const [x, y] of [[82, 36], [66, 36], [88, 24]]) room.push({ t: 'enemy', k: 'bazalisk', x: cx(x), y: feet(y) });
  room.push({ t: 'boss', k: 'ceratopsor', x: cx(26), y: feet(24) });
  room.autoSpecs('W5-L4', ['W5-L4-S1', 'W5-L4-S2', 'W5-L4-S3']);
  return assemble({ id: 'W5-L4', world: 5, stage: 4, boss: 'ceratopsor', residents: 3, hints: ['hint.ladder', 'bosshint.ceratopsor', 'hint.gate2'], budget: { pet: 12, cans: 11, golden: 0 } }, [room]);
}
