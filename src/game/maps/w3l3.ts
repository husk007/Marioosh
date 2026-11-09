/**
 * W3-L3 „Słoneczne Ogrody” (docs/design/09 §11, 11): długa SZKLARNIA o trzech kondygnacjach (parter, antresola, dach) — poziom poziomy, bez wspinaczek po koronach (L1) i bez zygzaku tarasów (L2).
 * Główna mechanika: PROMIEŃ ŚWIATŁA. Okno w dachu rzuca promień w dół; trzy obrotowe lustra (E) muszą poprowadzić go: dach → antresola → parter → panel słoneczny przy bramie.
 *  Droga światła: lustro 1 i 2 stoją na antresoli (drabina z parteru), lustro 3 na parterze, panel stoi na cokole obok bramy.
 *  Droga mechaniczna: drabina na dach i korba (dźwignia) na jego zachodnim końcu — otwiera tę samą bramę, ale trzeba przejść dachem obok Rogoróż.
 * Parter: sala palmowa → kanał nawadniający (pływanie; z dna tunel do podziemnego ogrodu ze złotą puszką) → sala oranżerii z bramą → wzgórze ogrodowe z wyjściem.
 */
import { AuthoredRoom, Canvas, assemble, cx, feet } from '../authored';
import type { LevelData } from '../types';

export function buildW3L3(): LevelData {
  const c = new Canvas(150, 36);
  c.rect(0, 0, 149, 2, '#'); c.rect(0, 3, 0, 35, '#'); c.rect(149, 3, 149, 35, '#');
  c.rect(1, 29, 148, 35, '#');                         // podłoga parteru (wiersz 29), stoi się w wierszu 28
  // kanał nawadniający + tunel + podziemny ogród
  c.rect(38, 29, 60, 32, '.'); c.rect(31, 30, 37, 32, '.'); c.rect(14, 30, 30, 32, '.');
  // sala palmowa: donice 2 wiersze
  c.rect(12, 27, 14, 28, '#'); c.rect(24, 27, 26, 28, '#');
  // antresola (półki jednokierunkowe — światło i gracz przechodzą od dołu), dach, ściany, drabiny
  c.rect(66, 20, 100, 20, '='); c.rect(62, 10, 100, 10, '=');
  c.rect(65, 12, 65, 19, '#'); c.rect(61, 4, 61, 9, '#');
  c.rect(101, 3, 104, 21, '#'); c.rect(1, 3, 1, 3, '#');
  c.ladder(67, 20, 28); c.ladder(96, 20, 28); c.ladder(98, 10, 19);
  c.rect(100, 28, 100, 28, '#');                        // cokół panelu słonecznego
  c.rect(104, 22, 104, 28, '1');                        // brama oranżerii g1
  // wzgórze ogrodowe za bramą
  c.profile(105, [[5, 29], [8, 27], [7, 25], [10, 27]]);

  c.set(3, 28, 'S'); c.set(34, 28, 'K'); c.set(107, 28, 'K'); c.set(140, 26, 'X');
  c.set(30, 0, '?'); c.set(66, 0, '?'); c.set(96, 0, '?'); c.set(106, 0, '?');
  for (const [x, y] of [[4, 28], [6, 28], [8, 28], [10, 28], [13, 26], [17, 28], [20, 28], [22, 28], [25, 26], [29, 28], [32, 28],
    [44, 30], [50, 30], [56, 30], [17, 32], [21, 32], [27, 32], [29, 32],
    [64, 28], [72, 28], [84, 28], [70, 19], [74, 19], [84, 19], [66, 9], [86, 9], [92, 9],
    [116, 26], [120, 26], [128, 24], [131, 24], [139, 26]]) c.set(x, y, 'p');
  for (const [x, y] of [[18, 28], [30, 28], [47, 31], [53, 31], [16, 32], [19, 32], [28, 32], [36, 28], [78, 28], [80, 19], [74, 9], [118, 26], [130, 24]]) c.set(x, y, 'k');
  c.set(23, 32, '*');
  c.set(19, 28, 'T'); c.set(72, 19, 'T'); c.set(132, 24, 'T');
  c.set(100, 27, 'A'); c.set(64, 9, 'Q');

  const room = new AuthoredRoom('W3-L3:main', c.rows(), { name: 'main', world: 3, wet: [[38, 28, 60, 32], [31, 30, 37, 32]] });
  room.push({ t: 'gate', id: 'g1', cells: room.gateCells.get('g1') ?? [], need: 1 });
  // promień światła: okno w dachu, trzy lustra, panel
  room.push({ t: 'decor', k: 'sun_d', x: cx(78), y: feet(4) });
  room.push({ t: 'decor', k: 'lmirror', x: cx(78), y: feet(19) });
  room.push({ t: 'decor', k: 'lmirror', x: cx(92), y: feet(19) });
  room.push({ t: 'decor', k: 'lmirror', x: cx(92), y: feet(28) });
  const a = room.at('A'); room.push({ t: 'switch', id: 'W3-L3:sun', x: cx(a.tx), y: feet(a.ty), gate: 'g1', style: 'mirror', symbol: 2 });
  const q = room.at('Q'); room.push({ t: 'switch', id: 'W3-L3:crank', x: cx(q.tx), y: feet(q.ty), gate: 'g1', style: 'lever', symbol: 1 });
  for (const [x, y] of [[27, 28], [68, 28], [82, 28], [88, 9], [126, 24]]) room.push({ t: 'enemy', k: 'rogoroza', x: cx(x), y: feet(y) });
  for (const [x, y] of [[16, 28], [33, 28], [75, 28], [107, 28], [140, 26]]) room.push({ t: 'enemy', k: 'rogopnacze', x: cx(x), y: feet(y) });
  for (const [x, y] of [[74, 15], [90, 15], [72, 7], [94, 7]]) room.push({ t: 'enemy', k: 'pszczolrog', x: cx(x), y: feet(y) });
  room.autoSpecs('W3-L3', ['W3-L3-S1', 'W3-L3-S2', 'W3-L3-S3']);
  return assemble({ id: 'W3-L3', world: 3, stage: 3, residents: 3, hints: ['hint.air', 'hint.sun', 'hint.ladder', 'hint.switch'], budget: { pet: 32, cans: 13, golden: 1 } }, [room]);
}
