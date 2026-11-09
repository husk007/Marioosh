/**
 * W1-L3 „Mosty Wysokiego Napięcia” (docs/design/09 §3, 11): kanion o trzech mostach na różnych wysokościach, każdy inaczej obsługiwany.
 *  Most 1 (wiersz 14): brakujący segment opuszcza WCIĄGARKA ukryta na pomoście rewizyjnym POD mostem (zejście drabiną, ślepy pomost).
 *  Most 2 (wiersz 10): ogromna luka (10 kafli) — przez nią kursuje WAGONIK linowy; trzeba odczekać na przystani i nie dać się zepchnąć ptakom.
 *  Most 3 (wiersz 22): wciągarka jest na szczycie SŁUPA WYSOKIEGO NAPIĘCIA (drabina 10 kafli), a most leży daleko poniżej.
 * Pod każdym mostem pomost rewizyjny z drabiną (puszki, PET, posąg). Złota puszka na wąskiej półce przy zejściu z wieży 2 (x≈145).
 * Na poziomie nie ma skoków między odległymi wyspami: każda luka większa niż 3 kafle ma mechanizm.
 */
import { AuthoredRoom, Canvas, assemble, cx, feet } from '../authored';
import type { LevelData } from '../types';
import { TILE } from '../constants';

export function buildW1L3(): LevelData {
  const c = new Canvas(202, 38);
  c.rect(0, 0, 201, 1, '#'); c.rect(0, 2, 0, 37, '#'); c.rect(201, 2, 201, 37, '#');
  // zachodnia krawędź kanionu
  c.ground(1, 29, 14);
  // most 1: ślepy pomost rewizyjny (drabina x30), luka x41–48 (wciągarka na pomoście)
  c.ladder(30, 14, 23); c.rect(30, 24, 46, 24, '=');
  c.rect(31, 14, 40, 14, '='); c.rect(49, 14, 61, 14, '=');
  // filar 1 + schody na wieżę
  c.ground(62, 90, 14); c.rampUp(64, 14, 4); c.rect(72, 10, 90, 13, '#');
  // most 2: pomost rewizyjny pod zachodnim przęsłem (drabina x91), wagonik w luce x101–118
  c.ladder(91, 10, 19); c.rect(91, 20, 106, 20, '=');
  c.rect(92, 10, 104, 10, '='); c.rect(115, 10, 130, 10, '=');   // z dokami wagonika (x101–104 i x115–118)
  // wieża 2 i zejście drabiną na platformę 3 (półka ze złotą puszką)
  c.ground(131, 142, 10); c.rect(143, 16, 147, 16, '='); c.ladder(143, 10, 15); c.ladder(148, 16, 21);   // dwa odcinki drabiny z półką-odpoczynkiem
  c.rect(145, 14, 147, 14, '=');
  c.ground(143, 159, 22);
  // słup wysokiego napięcia z rozdzielnicą (szczyt: wiersz 12, pod nim przejście na most), drabina x155
  c.rect(156, 12, 159, 17, '#'); c.ladder(155, 12, 21);   // pod rozdzielnicą wolne przejście (4 wiersze)
  // most 3: pomost rewizyjny (drabina x160), luka x167–176
  c.ladder(160, 22, 29); c.rect(160, 30, 175, 30, '=');
  c.rect(161, 22, 166, 22, '='); c.rect(177, 22, 184, 22, '=');
  c.ground(185, 200, 22);

  // znaczniki
  c.set(3, 13, 'S'); c.set(24, 13, 'K'); c.set(74, 9, 'K'); c.set(134, 9, 'K'); c.set(150, 21, 'K'); c.set(196, 21, 'X');
  c.set(8, 0, '?'); c.set(26, 0, '?'); c.set(150, 0, '?');
  for (const [x, y] of [[6, 13], [9, 13], [12, 13], [33, 23], [40, 23], [52, 13], [76, 9], [82, 9], [95, 19], [101, 19], [134, 9], [138, 9], [152, 21], [157, 11], [180, 21]]) c.set(x, y, 'p');
  for (const [x, y] of [[18, 13], [20, 13], [36, 23], [43, 23], [86, 9], [97, 19], [103, 19], [124, 9], [136, 9], [164, 29], [170, 29], [190, 21]]) c.set(x, y, 'k');
  c.set(146, 13, '*');
  c.set(38, 23, 'T'); c.set(99, 19, 'T'); c.set(173, 29, 'T');
  c.set(45, 23, 'W'); c.set(158, 11, 'V');
  for (const [x, y] of [[14, 13], [55, 13], [80, 9]]) c.set(x, y, 'r');
  for (const [x, y] of [[36, 11], [96, 8], [124, 8], [172, 19]]) c.set(x, y, 'm');

  const room = new AuthoredRoom('W1-L3:main', c.rows(), { name: 'main', world: 1 });
  const sw = (id: string, ch: string, gate: string, symbol: number): void => { const m = room.at(ch); room.push({ t: 'switch', id, x: cx(m.tx), y: feet(m.ty), gate, style: 'lever', symbol }); };
  sw('W1-L3:w1', 'W', 'br1', 0); sw('W1-L3:w3', 'V', 'br3', 1);
  const span = (gate: string, x0: number, x1: number, y: number): void => { room.push({ t: 'span', gate, cells: Array.from({ length: x1 - x0 + 1 }, (_, i) => [x0 + i, y] as [number, number]) }); };
  span('br1', 41, 48, 14); span('br3', 167, 176, 22);
  room.push({ t: 'platform', x: 101 * TILE, y: 10 * TILE, w: 4, mode: 'h', range: 14 * TILE, speed: 55, offset: 0, dwell: 2 });
  for (const [x, y] of [[110, 7], [158, 9], [180, 19]]) room.push({ t: 'enemy', k: 'rogowrobel', x: cx(x), y: feet(y) });
  room.autoSpecs('W1-L3', ['W1-L3-S1', 'W1-L3-S2', 'W1-L3-S3']);
  return assemble({ id: 'W1-L3', world: 1, stage: 3, residents: 3, hints: ['hint.fall', 'hint.ladder', 'hint.switch'], budget: { pet: 15, cans: 12, golden: 1 } }, [room]);
}
