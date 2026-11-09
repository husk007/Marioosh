/**
 * W2-L3 „Magnetyczne Przepaście” (docs/design/09 §7, 11): magazyn stalowych belek. Trzy przepaście między blokami regałów;
 * w każdej leży belka, którą trzeba ułożyć w uchwytach panelem suwnicy — most zostaje na stałe (nie ma dalekich skoków).
 *  Przepaść 1: panel na bloku za schodami z hali (najprostszy — dźwignia).
 *  Przepaść 2: panel na szczycie regału: dwie półki połączone drabinami (pionowa wspinaczka, żaden skok).
 *  Przepaść 3: dwa panele (przekaźniki) — jeden na bloku, drugi na kładce nad nim; belka opada dopiero po obu.
 * Opcjonalnie: właz w bloku regałów prowadzi do skarbca ze złotą puszką. Za trzecią przepaścią schody w dół do hali wyjściowej.
 */
import { AuthoredRoom, Canvas, assemble, cx, feet } from '../authored';
import type { LevelData } from '../types';

export function buildW2L3(): LevelData {
  const c = new Canvas(176, 32);
  c.rect(0, 0, 175, 2, '#'); c.rect(0, 3, 0, 31, '#'); c.rect(175, 3, 175, 31, '#');
  c.ground(1, 19, 24); c.rampUp(20, 24, 5); c.ground(30, 47, 19);
  c.ground(60, 75, 19); c.ground(92, 110, 19); c.ground(123, 129, 19); c.rampDown(130, 19, 5); c.ground(140, 174, 24);
  // regał na bloku B2: półka 1 (wiersz 12) i półka 2 z panelem (wiersz 6), drabiny L1 (x62) i L2 (x73)
  c.rect(63, 12, 73, 12, '='); c.ladder(62, 12, 18); c.rect(64, 6, 73, 6, '='); c.ladder(73, 6, 11);
  // skarbiec w bloku B3 (właz z drabiną) i kładka nad blokiem B3 z drabiną
  c.rect(95, 24, 106, 28, '.'); c.ladder(100, 19, 28); c.rect(100, 12, 108, 12, '='); c.ladder(104, 12, 18);

  c.set(3, 23, 'S'); c.set(16, 23, 'K'); c.set(46, 18, 'K'); c.set(93, 18, 'K'); c.set(126, 18, 'K'); c.set(172, 23, 'X');
  c.set(24, 0, '?'); c.set(44, 0, '?'); c.set(100, 0, '?');
  for (const [x, y] of [[4, 23], [8, 23], [14, 23], [33, 18], [40, 18], [64, 18], [66, 11], [68, 5], [95, 18], [107, 18], [102, 11], [125, 18], [127, 18], [150, 23]]) c.set(x, y, 'p');
  const cans: [number, number][] = [[6, 23], [9, 23], [12, 23], [15, 23], [32, 18], [35, 18], [38, 18], [41, 18], [50, 18], [54, 18], [58, 18], [62, 18], [66, 18], [70, 18], [74, 18],
    [64, 11], [67, 11], [70, 11], [72, 11], [70, 5], [72, 5], [71, 5], [78, 18], [84, 18], [90, 18], [97, 18], [99, 18], [109, 18], [96, 28], [97, 28], [98, 28], [99, 28], [101, 28], [102, 28],
    [101, 11], [107, 11], [152, 23], [156, 23], [160, 23]];
  for (const [x, y] of cans) c.set(x, y, 'k');
  c.set(105, 28, '*');
  c.set(36, 18, 'T'); c.set(64, 5, 'T'); c.set(165, 23, 'T');
  c.set(44, 18, 'Q'); c.set(66, 5, 'R'); c.set(108, 18, 'Z'); c.set(106, 11, 'W');
  c.set(142, 23, 'a'); c.set(158, 23, 'a');

  const room = new AuthoredRoom('W2-L3:main', c.rows(), { name: 'main', world: 2 });
  const sw = (id: string, ch: string, gate: string, style: 'lever' | 'relay', sym: number): void => { const m = room.at(ch); room.push({ t: 'switch', id, x: cx(m.tx), y: feet(m.ty), gate, style, symbol: sym }); };
  sw('W2-L3:p1', 'Q', 'm1', 'lever', 0); sw('W2-L3:p2', 'R', 'm2', 'relay', 1); sw('W2-L3:p3a', 'Z', 'm3', 'relay', 2); sw('W2-L3:p3b', 'W', 'm3', 'relay', 3);
  const span = (gate: string, x0: number, x1: number): void => { room.push({ t: 'span', gate, cells: Array.from({ length: x1 - x0 + 1 }, (_, i) => [x0 + i, 19] as [number, number]) }); };
  span('m1', 48, 59); span('m2', 76, 91); span('m3', 111, 122);
  for (const [x, y] of [[10, 23], [38, 18], [66, 18], [96, 18], [126, 18], [150, 23]]) room.push({ t: 'enemy', k: 'slimorog', x: cx(x), y: feet(y) });
  for (const [x, y] of [[54, 15], [83, 15], [116, 15], [135, 20]]) room.push({ t: 'enemy', k: 'pszczolrog', x: cx(x), y: feet(y) });
  room.autoSpecs('W2-L3', ['W2-L3-S1', 'W2-L3-S2', 'W2-L3-S3']);
  return assemble({ id: 'W2-L3', world: 2, stage: 3, residents: 3, hints: ['hint.ladder', 'hint.switch', 'hint.gate2'], budget: { pet: 14, cans: 39, golden: 1 } }, [room]);
}
