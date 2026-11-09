/**
 * W2-L2 „Wielka Sortownia” (docs/design/09 §6, 11): hala o trzech piętrach. Główna mechanika: PIONOWA PĘTLA STEROWANIA — prasa blokuje tunel wyjściowy,
 * a jej blokadę bezpieczeństwa zwalnia dźwignia na dachu maszynowni, do którego dojeżdża się ruchomym pomostem inspekcyjnym nad komorą prasy.
 *  Parter: taśmociągi (przeciwbieżny pas spowalnia, zgodny przyspiesza), klatka schodowa; piętro 1: kładka z zwrotnicą; piętro 2: kładka i pomost, dach tunelu.
 *  Trzy zwrotnice (parter, piętro 1, piętro 2) naprawiają butelkomat i otwierają dodatkowy właz do skarbca z puszkami pod tunelem.
 * Tunel za prasą jest zamknięty dachem (brak obejścia upadkiem). Dwie drogi powrotu nie istnieją: z dachu wraca się pomostem.
 */
import { AuthoredRoom, Canvas, assemble, cx, feet } from '../authored';
import type { LevelData } from '../types';
import { TILE } from '../constants';

export function buildW2L2(): LevelData {
  const c = new Canvas(150, 38);
  c.rect(0, 0, 149, 2, '#'); c.rect(0, 3, 0, 37, '#'); c.rect(149, 3, 149, 37, '#');
  c.ground(1, 148, 30);
  for (let x = 15; x <= 32; x++) c.set(x, 30, '<');
  for (let x = 120; x <= 140; x++) c.set(x, 30, '>');
  // klatka schodowa: rampa → podest → rampa → filar piętra 1
  c.rampUp(46, 30, 4); c.rect(54, 26, 57, 29, '#'); c.rampUp(58, 26, 4); c.rect(66, 22, 70, 29, '#');
  // piętro 1 i 2: kładki, drabina między nimi przy zachodnim końcu
  c.rect(71, 22, 91, 22, '='); c.rect(70, 14, 92, 14, '='); c.ladder(74, 14, 21);
  // maszynownia: lity blok z tunelem wyjściowym (4 kafle wysokości), dach = piętro 2
  c.rect(100, 14, 148, 25, '#');
  // właz do skarbca pod tunelem
  c.rect(106, 31, 118, 34, '.'); c.ladder(112, 30, 34);
  // brama prasy (4 kafle) w wejściu do tunelu i zamknięty właz
  c.rect(100, 26, 100, 29, '1'); c.set(112, 29, '2');

  c.set(3, 29, 'S'); c.set(34, 29, 'K'); c.set(110, 29, 'K'); c.set(146, 29, 'X');
  c.set(4, 0, '?'); c.set(38, 0, '?'); c.set(68, 0, '?'); c.set(98, 0, '?');
  c.set(40, 29, 'N');
  for (const [x, y] of [[6, 29], [10, 29], [14, 29], [20, 29], [26, 29], [38, 29], [55, 25], [73, 21], [79, 21], [85, 21], [89, 21], [72, 13], [78, 13], [84, 13], [88, 13], [110, 13], [119, 13], [108, 29], [124, 29], [142, 29]]) c.set(x, y, 'p');
  const cans: [number, number][] = [[17, 29], [19, 29], [21, 29], [23, 29], [25, 29], [27, 29], [29, 29], [31, 29], [36, 29], [42, 29],
    [72, 21], [75, 21], [77, 21], [81, 21], [83, 21], [87, 21], [91, 21], [71, 13], [76, 13], [80, 13], [86, 13], [90, 13],
    [104, 13], [106, 13], [108, 13], [112, 13], [114, 13], [116, 13], [118, 13], [122, 13], [124, 13], [126, 13], [128, 13], [132, 13]];
  for (let x = 107; x <= 118; x++) cans.push([x, 34]);
  for (const [x, y] of cans) c.set(x, y, 'k');
  c.set(43, 29, 'T'); c.set(90, 21, 'T'); c.set(125, 13, 'T');
  c.set(8, 29, 'A'); c.set(80, 21, 'R'); c.set(82, 13, 'Z'); c.set(136, 13, 'Q');
  for (const [x, y] of [[22, 29], [28, 29], [95, 21], [120, 13]]) c.set(x, y, 'z');
  for (const [x, y] of [[118, 29], [130, 29], [140, 29]]) c.set(x, y, 'a');

  const room = new AuthoredRoom('W2-L2:main', c.rows(), { name: 'main', world: 2 });
  room.push({ t: 'gate', id: 'g1', cells: room.gateCells.get('g1') ?? [], need: 1 });
  room.push({ t: 'gate', id: 'g2', cells: room.gateCells.get('g2') ?? [], need: 3 });
  const sw = (id: string, ch: string, gate: string, style: 'lever' | 'relay', sym: number): void => { const m = room.at(ch); room.push({ t: 'switch', id, x: cx(m.tx), y: feet(m.ty), gate, style, symbol: sym }); };
  sw('W2-L2:t1', 'A', 'g2', 'relay', 0); sw('W2-L2:t2', 'R', 'g2', 'relay', 1); sw('W2-L2:t3', 'Z', 'g2', 'relay', 2); sw('W2-L2:lock', 'Q', 'g1', 'lever', 3);
  const N = room.at('N');
  room.push({ t: 'ecoport', x: cx(N.tx), y: feet(N.ty), broken: true, id: 'W2-L2:eco', fuses: ['W2-L2:t1', 'W2-L2:t2', 'W2-L2:t3'] });
  for (const [x, y] of [[55, 25], [84, 29], [60, 29], [89, 21], [112, 13]]) room.push({ t: 'enemy', k: 'slimorog', x: cx(x), y: feet(y) });
  // pomost inspekcyjny nad komorą prasy: zaczyna nad deskami x90–92, kończy na dachu maszynowni (x99–101)
  room.push({ t: 'platform', x: 90 * TILE, y: 14 * TILE, w: 3, mode: 'h', range: 9 * TILE, speed: 60, offset: 0, dwell: 1.5 });
  room.autoSpecs('W2-L2', ['W2-L2-S1', 'W2-L2-S2', 'W2-L2-S3']);
  return assemble({ id: 'W2-L2', world: 2, stage: 2, residents: 3, hints: ['hint.switch', 'hint.eco', 'hint.ladder', 'hint.gate2'], budget: { pet: 20, cans: 46, golden: 0 } }, [room]);
}
