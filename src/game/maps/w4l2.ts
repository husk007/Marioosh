/**
 * W4-L2 „Zatopione Obwody” (docs/design/09 §14, 11): zatopiony dworzec — komory z powietrzem, połączone zalanymi korytarzami.
 * Główna mechanika poziomu: ODDYCHANIE I NAWIGACJA POD WODĄ. Powietrze (20 s) uzupełnia się tylko w suchych częściach komór i w „dzwonach”
 * (wnękach w stropie zalanej hali). Każdy odcinek pod wodą zaplanowano na ≤ 15 s; zawsze są drabiny na suche półki.
 * Cel: wyłączyć trzy rozdzielnice (bezpieczniki) — pierwszą na dnie hali, drugą na półce komory B, trzecią na półce komory C pod okiem Bazaliska —
 * co otwiera śluzę w ostatnim korytarzu. Sekret: wąski tunel z szybu do suchej komory z półką pełną puszek (12).
 */
import { AuthoredRoom, Canvas, assemble, cx, feet } from '../authored';
import type { LevelData } from '../types';

export function buildW4L2(): LevelData {
  const c = new Canvas(132, 30, '#');
  const carve = (x0: number, y0: number, x1: number, y1: number) => c.rect(x0, y0, x1, y1, '.');
  carve(1, 3, 24, 8);                    // hala wejściowa (sucha)
  carve(25, 5, 25, 8);                   // przejście do szybu
  carve(26, 3, 29, 21);                  // szyb: góra sucha, woda od wiersza 14
  c.ladder(26, 9, 21);
  carve(30, 16, 52, 22);                 // hala dolna (zalana, strop z dzwonami)
  carve(36, 11, 39, 15); carve(46, 11, 49, 15);   // dzwony z powietrzem
  carve(53, 19, 60, 22);                 // korytarz 1
  carve(61, 7, 78, 22);                  // komora B
  c.rect(70, 12, 77, 12, '#'); c.ladder(69, 12, 21);
  carve(79, 19, 90, 22); carve(84, 14, 86, 18);   // korytarz 2 + dzwon
  carve(91, 5, 106, 22);                 // komora C
  c.rect(100, 9, 105, 9, '#'); c.ladder(99, 9, 21);
  carve(107, 19, 116, 22);               // korytarz 3 z śluzą
  c.rect(108, 19, 108, 22, '1');
  carve(117, 4, 128, 22);                // komora wyjściowa
  c.rect(123, 9, 127, 9, '#'); c.ladder(122, 9, 21);
  carve(20, 19, 25, 21); carve(6, 13, 19, 21);    // sekret: tunel i sucha komora ze skarbem
  c.rect(9, 18, 18, 18, '#'); c.ladder(8, 18, 21);
  // przeszkody-maszyny w hali dolnej (utrudniają prostą linię, wymuszają pływanie górą/dołem)
  c.rect(33, 20, 34, 22, '#'); c.rect(42, 16, 43, 19, '#'); c.rect(48, 20, 49, 22, '#');

  c.set(3, 8, 'S'); c.set(73, 11, 'K'); c.set(127, 8, 'X');
  c.set(20, 4, '?'); c.set(27, 4, '?'); c.set(62, 8, '?');
  for (const [x, y] of [[6, 8], [9, 8], [12, 8], [16, 8], [27, 11], [28, 11], [31, 21], [41, 21], [47, 20], [37, 13], [48, 13], [56, 21], [75, 11], [66, 14], [76, 20], [84, 16], [88, 21], [101, 8], [95, 12], [112, 21], [126, 8], [17, 17]]) c.set(x, y, 'p');
  for (const [x, y] of [[4, 8], [20, 8], [35, 22], [51, 21], [68, 21], [82, 21], [104, 20], [115, 21]]) c.set(x, y, 'k');
  for (let x = 10; x <= 15; x++) { c.set(x, 17, 'k'); c.set(x, 16, 'k'); }
  c.set(14, 8, 'T'); c.set(72, 11, 'T'); c.set(124, 8, 'T');
  c.set(10, 8, 'r'); c.set(19, 8, 'r');
  c.set(44, 22, 'W'); c.set(76, 11, 'U'); c.set(103, 8, 'V');

  const room = new AuthoredRoom('W4-L2:main', c.rows(), {
    name: 'main', world: 4,
    wet: [[26, 14, 29, 21], [30, 16, 52, 22], [53, 19, 60, 22], [61, 15, 78, 22], [79, 19, 90, 22], [91, 13, 106, 22], [107, 19, 116, 22], [117, 14, 128, 22], [20, 19, 25, 21], [6, 19, 19, 21]],
  });
  room.push({ t: 'gate', id: 'g1', cells: room.gateCells.get('g1') ?? [], need: 3 });
  const sw = (id: string, ch: string, sym: number, style: 'lever' | 'valve' | 'relay'): void => { const m = room.at(ch); room.push({ t: 'switch', id, x: cx(m.tx), y: feet(m.ty), gate: 'g1', style, symbol: sym }); };
  sw('W4-L2:b1', 'W', 0, 'valve'); sw('W4-L2:b2', 'U', 1, 'relay'); sw('W4-L2:b3', 'V', 2, 'relay');
  for (const [x, y] of [[34, 18], [44, 20], [56, 21], [84, 21]]) room.push({ t: 'enemy', k: 'rogopletw', x: cx(x), y: feet(y) });
  for (const [x, y] of [[70, 18], [88, 20], [112, 21], [98, 18], [121, 18]]) room.push({ t: 'enemy', k: 'osmiorog', x: cx(x), y: feet(y) });
  room.push({ t: 'enemy', k: 'bazalisk', x: cx(101), y: feet(8) });
  room.autoSpecs('W4-L2', ['W4-L2-S1', 'W4-L2-S2', 'W4-L2-S3']);
  return assemble({ id: 'W4-L2', world: 4, stage: 2, residents: 3, hints: ['hint.air', 'hint.ladder', 'hint.switch'], budget: { pet: 22, cans: 20, golden: 0 } }, [room]);
}
