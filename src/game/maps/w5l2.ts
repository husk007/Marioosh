/**
 * W5-L2 „Jaskinie Bazalisków” (docs/design/09 §18, 11): system grot ze WSPÓLNYM WĘZŁEM i trzema odnogami — wybierasz DWIE z trzech, bo brama rozdzielni wymaga dwóch zasilań z trzech.
 *  Korytarz wejściowy (nauka Bazalisków: ostrzeżenie błyskiem, skała 2 wiersze jako osłona) → wielka grota (węzeł) z Bazaliskami, Kamienioróg i skałami-osłonami.
 *  Odnoga A (w dół drabiną, zachodnia sztolnia): dźwignia mechaniczna, dwa Bazalisk; odnoga B (w dół drabiną, wschodnia sztolnia): kolejka kopalniana nad przepaścią z kolcami i przekaźnik elektryczny;
 *  odnoga C (dwie drabiny na galerię nad grotą): górna galeria z Bazaliskami i dźwignia. Brama (2 z 3) prowadzi do komory wyjściowej.
 * Skamieniające spojrzenie Bazalisków jest zapowiedziane błyskiem, a skały 2-wierszowe osłaniają gracza (można je też zabić, gdy odpoczywają).
 */
import { AuthoredRoom, Canvas, assemble, cx, feet } from '../authored';
import type { LevelData } from '../types';
import { TILE } from '../constants';

export function buildW5L2(): LevelData {
  const c = new Canvas(128, 48, '#');
  const carve = (x0: number, y0: number, x1: number, y1: number) => c.rect(x0, y0, x1, y1, '.');
  carve(1, 26, 36, 30);                                   // korytarz wejściowy (stoi się w wierszu 30)
  carve(37, 12, 90, 33);                                  // wielka grota (podłoga: wiersz 34)
  c.rampDown(37, 31, 3);                                  // zejście z korytarza do groty
  carve(91, 26, 99, 33); carve(101, 26, 118, 33);         // korytarz do bramy i komora wyjściowa
  carve(10, 36, 51, 41);                                  // odnoga A: zachodnia sztolnia
  carve(88, 36, 125, 41); carve(99, 42, 115, 44);         // odnoga B: wschodnia sztolnia z przepaścią
  c.rect(99, 45, 115, 45, '^');
  // skały-osłony (2 wiersze), stalaktyty
  c.rect(20, 29, 21, 30, '#');
  for (const x of [56, 66, 82]) c.rect(x, 32, x + 1, 33, '#');
  for (const x of [20, 28]) c.rect(x, 40, x + 1, 41, '#');
  c.rect(120, 40, 121, 41, '#');
  for (const x of [60, 68]) c.rect(x, 20, x + 1, 21, '#');
  for (const x of [45, 55, 65, 75, 85]) c.rect(x, 12, x, 15, '#');
  // drabiny: odnoga A (38), odnoga B (88), galeria C (zygzak: półka 28 i drabina 49 → galeria wiersz 22 → drabina 83, półka, drabina 87)
  c.ladder(51, 34, 41); c.ladder(88, 34, 41);
  c.rect(44, 28, 48, 28, '='); c.ladder(43, 28, 33); c.ladder(49, 22, 27); c.rect(50, 22, 82, 22, '=');
  c.rect(84, 28, 86, 28, '='); c.ladder(83, 22, 27); c.ladder(87, 28, 33);
  // dok kolejki kopalnianej B
  c.rect(99, 42, 102, 42, '='); c.rect(112, 42, 115, 42, '=');
  // brama rozdzielni (2 zasilania z 3)
  c.rect(100, 26, 100, 33, '1');

  c.set(3, 30, 'S'); c.set(34, 30, 'K'); c.set(93, 33, 'K'); c.set(114, 33, 'X');
  c.set(6, 0, '?'); c.set(42, 0, '?'); c.set(94, 0, '?');
  for (const [x, y] of [[4, 30], [10, 30], [16, 30], [46, 33], [58, 33], [70, 33], [84, 33], [14, 41], [22, 41], [30, 41], [91, 41], [95, 41], [117, 41], [52, 21], [62, 21], [74, 21]]) c.set(x, y, 'p');
  for (const [x, y] of [[7, 30], [13, 30], [24, 30], [48, 33], [55, 33], [68, 33], [86, 33], [18, 41], [26, 41], [32, 41], [35, 41], [93, 41], [97, 41], [118, 41], [123, 41], [55, 21], [66, 21], [78, 21]]) c.set(x, y, 'k');
  c.set(6, 30, 'T'); c.set(58, 21, 'T'); c.set(16, 41, 'T');
  c.set(12, 41, 'Q'); c.set(124, 41, 'R'); c.set(80, 21, 'U');

  const room = new AuthoredRoom('W5-L2:main', c.rows(), { name: 'main', world: 5 });
  room.push({ t: 'gate', id: 'g1', cells: room.gateCells.get('g1') ?? [], need: 2 });
  const sw = (id: string, ch: string, sym: number, style: 'lever' | 'relay'): void => { const m = room.at(ch); room.push({ t: 'switch', id, x: cx(m.tx), y: feet(m.ty), gate: 'g1', style, symbol: sym }); };
  sw('W5-L2:a', 'Q', 0, 'lever'); sw('W5-L2:b', 'R', 1, 'relay'); sw('W5-L2:c', 'U', 2, 'lever');
  for (const [x, y] of [[28, 30], [52, 33], [78, 33], [24, 41], [33, 41], [122, 41], [56, 21], [72, 21]]) room.push({ t: 'enemy', k: 'bazalisk', x: cx(x), y: feet(y) });
  for (const [x, y] of [[12, 30], [62, 33], [31, 41], [96, 41], [52, 21], [76, 21]]) room.push({ t: 'enemy', k: 'gekorog', x: cx(x), y: feet(y) });
  for (const [x, y] of [[74, 33], [95, 33]]) room.push({ t: 'enemy', k: 'kamienirog', x: cx(x), y: feet(y) });
  // kolejka kopalniana nad przepaścią odnogi B
  room.push({ t: 'platform', x: 100 * TILE, y: 42 * TILE, w: 3, mode: 'h', range: 12 * TILE, speed: 70, offset: 0, dwell: 1.5 });
  room.autoSpecs('W5-L2', ['W5-L2-S1', 'W5-L2-S2', 'W5-L2-S3']);
  return assemble({ id: 'W5-L2', world: 5, stage: 2, residents: 3, hints: ['hint.beam', 'hint.ladder', 'hint.gate2'], budget: { pet: 16, cans: 18, golden: 0 } }, [room]);
}
