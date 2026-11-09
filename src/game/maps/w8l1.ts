/**
 * W8-L1 „Deszcz Kamieni” (docs/design/09 §29, 11): zrujnowane kamienne miasto na Katoblisie (0,95 g), czarne niebo. Inna mechanika niż osuwy W5-L1:
 * DESZCZ POJEDYNCZYCH GŁAZÓW w kolumnach (`arc` rodzaj „rock”): cień i pył na ziemi 1,2 s przed upadkiem; łuki i zadaszenia są schronami.
 *  1. (x 0–60) ulica ruin: kolumny upadku, dwa łuki-schrony (x 34, 50).
 *  2. (x 60–120) ulica zablokowana rumowiskiem (brama g1, x 104): zawór (dźwignia) jest w piwnicy (drabina x 62 w dół, x 98 w górę); nad piwnicą spada deszcz kamieni.
 *  3. (x 120–180) wielki schron z punktem kontrolnym (x 132), potem ulica z dwoma Bazaliskami naprzeciw siebie (podwójny promień).
 *  4. (x 180–240) bieg przez rumowisko: dwie kule toczą się po ulicy (ostrzeżenie 3 s), schronienie na półkach (drabiny x 190, 204, 218), kolumny upadku; wyjście: rozdzielnia (X). Sekret: bateria na górnej półce (x 220).
 */
import { AuthoredRoom, Canvas, assemble, cx, feet } from '../authored';
import type { LevelData } from '../types';

export function buildW8L1(): LevelData {
  const c = new Canvas(240, 40);
  c.rect(0, 0, 0, 39, '#'); c.rect(239, 0, 239, 39, '#');
  c.ground(1, 238, 29);                                                 // ulica: powierzchnia wiersz 29 (stoi się w 28)
  const arch = (x0: number, w: number): void => { c.rect(x0, 21, x0 + w - 1, 22, '#'); c.rect(x0, 23, x0, 24, '#'); c.rect(x0 + w - 1, 23, x0 + w - 1, 24, '#'); };
  for (const [x, w] of [[34, 8], [50, 8], [82, 8], [126, 16]] as const) arch(x, w);
  for (const x of [8, 24, 70, 112, 146, 160]) c.rect(x, 27, x + 1, 28, '#');   // ruiny (2 wiersze — do przeskoku)
  // piwnica z zaworem
  c.rect(63, 33, 100, 36, '.'); c.ladder(62, 29, 36); c.ladder(98, 29, 36);
  c.rect(104, 0, 104, 28, '1');                                         // rumowisko (brama g1)
  // półki-schrony nad ulicą (S4) i półka sekretna
  for (const x of [190, 204, 218]) { c.rect(x + 1, 24, x + 5, 24, '='); c.ladder(x, 24, 28); }
  c.rect(219, 19, 222, 19, '='); c.ladder(223, 19, 23);

  c.set(3, 28, 'S'); c.set(132, 28, 'K'); c.set(236, 28, 'X');
  c.set(6, 0, '?'); c.set(62, 0, '?'); c.set(180, 0, '?');
  c.set(43, 28, 'T'); c.set(125, 28, 'T'); c.set(188, 28, 'T');
  c.set(96, 36, 'Q'); c.set(220, 18, 'B');
  // PET (12)
  for (const [x, y] of [[6, 28], [26, 28], [38, 28], [54, 28], [68, 28], [80, 36], [88, 36], [114, 28], [131, 28], [166, 28], [193, 23], [207, 23]]) c.set(x, y, 'p');
  // puszki (12)
  for (const [x, y] of [[14, 28], [32, 28], [48, 28], [60, 28], [84, 36], [92, 36], [120, 28], [138, 28], [158, 28], [180, 28], [212, 28], [232, 28]]) c.set(x, y, 'k');

  const room = new AuthoredRoom('W8-L1:main', c.rows(), { name: 'main', world: 8 });
  room.push({ t: 'gate', id: 'g1', cells: room.gateCells.get('g1') ?? [], need: 1 });
  { const m = room.at('Q'); room.push({ t: 'switch', id: 'W8-L1:valve', x: cx(m.tx), y: feet(m.ty), gate: 'g1', style: 'valve', symbol: 0 }); }
  // deszcz głazów: [x, przesunięcie fazy]
  const rocks: [number, number][] = [[12, 0], [20, 1.1], [28, 2.2], [45, 3.3], [66, 0.6], [74, 1.7], [92, 2.8], [108, 3.9], [116, 0.3], [186, 1.4], [196, 2.5], [200, 3.6], [212, 0.9], [226, 2.0]];
  for (const [x, off] of rocks) room.push({ t: 'arc', x0: x * 32, y0: 2 * 32, x1: (x + 2) * 32, y1: 29 * 32, period: 4.4, on: 0.4, warn: 1.2, offset: off, kind: 'rock' });
  // kule na ulicy (S4): po jednej co 9 s, na zmianę
  const R = 36, Y = 29 * 32 - R;
  room.push({ t: 'boulder', r: R, path: [[236 * 32, Y], [184 * 32, Y]], speed: 110, every: 9, offset: 3, warn: 3 });
  room.push({ t: 'boulder', r: R, path: [[236 * 32, Y], [184 * 32, Y]], speed: 110, every: 9, offset: 7.5, warn: 3 });
  // Kamienioróg 8, Bykobieg 5, Bazalisk 4
  for (const x of [16, 36, 56, 78, 118, 136, 156, 182]) room.push({ t: 'enemy', k: 'kamienirog', x: cx(x), y: feet(28) });
  for (const x of [24, 100, 122, 176, 206]) room.push({ t: 'enemy', k: 'bykobieg', x: cx(x), y: feet(28) });
  for (const x of [150, 172, 196, 222]) room.push({ t: 'enemy', k: 'bazalisk', x: cx(x), y: feet(28) });
  room.autoSpecs('W8-L1');
  return assemble({ id: 'W8-L1', world: 8, stage: 1, residents: 3, hints: ['hint.rockfall', 'hint.switch', 'hint.boulder'], budget: { pet: 12, cans: 12, golden: 0 } }, [room]);
}
