/**
 * W4-L3 „Prądy Głębinowe” (docs/design/09 §15, 11): podwodny zakład pomp z trzema ogromnymi zbiornikami.
 * Główna mechanika poziomu: STEROWANIE POZIOMEM WODY zaworami (pionowość, nie labirynt jak w L2).
 *  Zbiornik A — zalany: zawór na suchej półce SPUSZCZA wodę, bo długi dolny korytarz jest za długi na jeden oddech;
 *  Zbiornik B — suchy: zawór na dnie NAPEŁNIA go, żeby wypłynąć do wysokich drzwi (i do sekretnej śluzy ze złotą puszką);
 *  Zbiornik C — zalany do połowy: dwa przełączniki (półka i dno) otwierają ostatnią śluzę; w korytarzu jest dzwon z powietrzem.
 * Sekret: opuszczona śluza z logiem Scarlet w ścianie zbiornika B (dostępna tylko przy napełnionym B).
 */
import { AuthoredRoom, Canvas, assemble, cx, feet } from '../authored';
import type { LevelData } from '../types';

export function buildW4L3(): LevelData {
  const c = new Canvas(126, 30, '#');
  const carve = (x0: number, y0: number, x1: number, y1: number) => c.rect(x0, y0, x1, y1, '.');
  carve(1, 4, 14, 9);                      // hala startowa (sucha), podłoga: wiersz 10
  carve(15, 6, 15, 9);                     // drzwi do zbiornika A
  carve(16, 4, 34, 27);                    // zbiornik A
  c.rect(16, 10, 21, 10, '#'); c.ladder(22, 10, 27);
  carve(35, 24, 58, 27);                   // długi dolny korytarz (24 kafle)
  carve(59, 4, 76, 27);                    // zbiornik B (suchy na początku)
  carve(49, 14, 57, 19); carve(58, 15, 58, 18);   // sekretna śluza Scarlet (suche powietrze nad wodą)
  c.rect(77, 6, 77, 9, '.');               // wysokie drzwi B → C
  carve(78, 4, 100, 27);                   // zbiornik C
  c.rect(77, 10, 82, 10, '#'); c.ladder(83, 10, 27);
  carve(101, 24, 111, 27); carve(103, 19, 106, 23);   // korytarz z dzwonem
  c.rect(108, 24, 108, 27, '1');
  carve(112, 6, 124, 27);                  // komora wyjściowa
  c.rect(114, 10, 123, 10, '#'); c.ladder(113, 10, 27);
  // maszyny (słupy) w zbiornikach
  c.rect(26, 18, 27, 21, '#'); c.rect(64, 14, 65, 19, '#'); c.rect(70, 8, 71, 12, '#'); c.rect(90, 16, 91, 21, '#');

  c.set(3, 9, 'S'); c.set(78, 9, 'K'); c.set(120, 9, 'X');
  c.set(8, 5, '?'); c.set(30, 5, '?'); c.set(62, 5, '?'); c.set(85, 5, '?');
  for (const [x, y] of [[4, 9], [7, 9], [10, 9], [13, 9], [24, 16], [28, 20], [31, 24], [33, 16], [38, 26], [44, 26], [50, 26], [55, 26], [62, 26], [70, 26], [67, 20], [73, 12],
    [50, 18], [79, 9], [83, 9], [86, 14], [90, 22], [94, 26], [97, 26], [116, 9]]) c.set(x, y, 'p');
  for (const [x, y] of [[2, 9], [8, 9], [18, 9], [26, 22], [30, 14], [33, 22], [41, 26], [47, 26], [53, 26], [60, 26], [68, 24], [72, 18], [75, 26], [52, 18], [55, 18],
    [99, 26], [84, 16], [88, 22], [92, 26], [98, 18], [82, 9], [118, 9]]) c.set(x, y, 'k');
  c.set(53, 19, '*');
  c.set(12, 9, 'T'); c.set(68, 27, 'T'); c.set(81, 9, 'T');
  c.set(20, 9, 'A'); c.set(62, 27, 'Q'); c.set(80, 9, 'R'); c.set(95, 27, 'Z');

  const room = new AuthoredRoom('W4-L3:main', c.rows(), { name: 'main', world: 4, wet: [[49, 18, 57, 19], [78, 12, 100, 27], [101, 24, 111, 27], [112, 14, 124, 27]] });
  room.push({ t: 'flood', x0: 16, x1: 34, from: 14, to: 28, speed: 1.4, gate: 'vA' });
  room.push({ t: 'flood', x0: 35, x1: 57, y0: 24, y1: 27, from: 14, to: 28, speed: 1.4, gate: 'vA' });
  room.push({ t: 'flood', x0: 58, x1: 76, from: 28, to: 8, speed: 1.6, gate: 'vB' });
  room.push({ t: 'gate', id: 'g1', cells: room.gateCells.get('g1') ?? [], need: 2 });
  const sw = (id: string, ch: string, gate: string, sym: number, style: 'lever' | 'valve' | 'relay'): void => { const m = room.at(ch); room.push({ t: 'switch', id, x: cx(m.tx), y: feet(m.ty), gate, style, symbol: sym }); };
  sw('W4-L3:vA', 'A', 'vA', 0, 'valve'); sw('W4-L3:vB', 'Q', 'vB', 1, 'valve');
  sw('W4-L3:l1', 'R', 'g1', 2, 'lever'); sw('W4-L3:l2', 'Z', 'g1', 3, 'relay');
  for (const [x, y] of [[26, 24], [31, 17], [86, 20], [94, 24], [74, 22]]) room.push({ t: 'enemy', k: 'rogopletw', x: cx(x), y: feet(y) });
  for (const [x, y] of [[90, 14], [97, 22], [118, 20], [30, 22]]) room.push({ t: 'enemy', k: 'osmiorog', x: cx(x), y: feet(y) });
  room.push({ t: 'enemy', k: 'bazalisk', x: cx(118), y: feet(9) });
  room.autoSpecs('W4-L3', ['W4-L3-S1', 'W4-L3-S2', 'W4-L3-S3']);
  return assemble({ id: 'W4-L3', world: 4, stage: 3, residents: 3, hints: ['hint.valve', 'hint.air', 'hint.ladder', 'hint.gate2'], budget: { pet: 24, cans: 22, golden: 1 } }, [room]);
}
