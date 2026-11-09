/**
 * W2-L4 „Fort Złomotaura” (docs/design/09 §8, 11): dawna huta z dwiema suwnicami → arena Złomotaura.
 * Dziedziniec: żaluzja bramy (ćwiczenie dźwigni) → odlewnia: taśmy, rowy z kolcami, winda na kładkę z wyłącznikiem A i drugi wyłącznik B → drzwi areny (2 wyłączniki).
 * Arena: dwie wieże-suwnice z pulpitami (po jednym na wieżę), między nimi wagonik suwnicy; pod płytami wież korytarze, w prawym kieszeń-schron.
 * Złomotaur szarżuje po podłodze (wolniej niż biegnie Marioosh) i kończy bieg przy ścianie obok drabiny wieży. Oba pulpity włączone w oknie 14 s zdejmują pancerz;
 * wtedy, gdy utknął, zejdź drabiną i uderz. Trafienie przywraca pancerz i wyłącza pulpity. Z góry spadają kawały złomu. Brak skakania po głowie.
 */
import { AuthoredRoom, Canvas, assemble, cx, feet } from '../authored';
import type { LevelData } from '../types';
import { TILE } from '../constants';

export function buildW2L4(): LevelData {
  const c = new Canvas(152, 30);
  c.rect(0, 0, 151, 2, '#'); c.rect(0, 3, 0, 29, '#'); c.rect(151, 3, 151, 29, '#');
  c.ground(1, 148, 22);
  // dziedziniec: żaluzja bramy
  c.rect(41, 3, 41, 17, '#'); c.rect(41, 18, 41, 21, '1');
  // odlewnia: taśmy, rowy z kolcami, winda na kładkę
  for (let x = 44; x <= 56; x++) c.set(x, 22, '>');
  for (let x = 70; x <= 82; x++) c.set(x, 22, '<');
  c.rect(60, 22, 62, 22, '.'); c.rect(60, 23, 62, 23, '^');
  c.rect(90, 22, 92, 22, '.'); c.rect(90, 23, 92, 23, '^');
  c.rect(65, 14, 85, 14, '='); c.ladder(86, 14, 21);
  // drzwi areny
  c.rect(101, 3, 101, 17, '#'); c.rect(101, 18, 101, 21, '2');
  // wieże-suwnice: płyty (wiersze 14–17), pod nimi przejścia; drabiny przy arenie
  c.rect(104, 14, 111, 17, '#'); c.ladder(112, 14, 21);
  c.rect(134, 14, 141, 17, '#'); c.ladder(133, 14, 21);
  c.rect(142, 3, 150, 21, '#');
  c.rect(131, 14, 132, 14, '=');           // wylot toru wagonika nad areną (dok)

  c.set(3, 21, 'S'); c.set(38, 21, 'K'); c.set(63, 21, 'K'); c.set(104, 21, 'K');
  c.set(6, 0, '?'); c.set(66, 0, '?'); c.set(105, 0, '?');
  for (const [x, y] of [[8, 21], [20, 21], [30, 21], [50, 21], [58, 21], [76, 13], [82, 13], [95, 21], [136, 21], [110, 21]]) c.set(x, y, 'p');
  for (const [x, y] of [[6, 21], [12, 21], [18, 21], [24, 21], [46, 21], [52, 21], [68, 13], [74, 13], [80, 13], [94, 21], [135, 21], [140, 21], [108, 13], [136, 13], [140, 13], [102, 21], [103, 21], [45, 21]]) c.set(x, y, 'k');
  c.set(34, 21, 'T'); c.set(78, 13, 'T'); c.set(138, 21, 'T');
  c.set(36, 21, 'W'); c.set(84, 13, 'A'); c.set(97, 21, 'Q'); c.set(106, 13, 'U'); c.set(138, 13, 'V');
  for (const [x, y] of [[26, 21], [55, 21], [87, 21]]) c.set(x, y, 'a');
  for (const [x, y] of [[32, 21], [79, 13]]) c.set(x, y, 'z');

  const room = new AuthoredRoom('W2-L4:main', c.rows(), { name: 'main', world: 2, bossArena: { x0: 113, x1: 133 } });
  room.push({ t: 'gate', id: 'g1', cells: room.gateCells.get('g1') ?? [], need: 1 });
  room.push({ t: 'gate', id: 'g2', cells: room.gateCells.get('g2') ?? [], need: 2 });
  const sw = (id: string, ch: string, gate: string, style: 'lever' | 'relay', sym: number): void => { const m = room.at(ch); room.push({ t: 'switch', id, x: cx(m.tx), y: feet(m.ty), gate, style, symbol: sym }); };
  sw('W2-L4:w', 'W', 'g1', 'lever', 0); sw('W2-L4:a', 'A', 'g2', 'relay', 1); sw('W2-L4:b', 'Q', 'g2', 'relay', 2);
  sw('W2-L4:c1', 'U', 'crane', 'lever', 3); sw('W2-L4:c2', 'V', 'crane', 'lever', 4);
  for (const [x, y] of [[14, 21], [48, 21], [72, 21]]) room.push({ t: 'enemy', k: 'slimorog', x: cx(x), y: feet(y) });
  // winda na kładkę odlewni
  room.push({ t: 'platform', x: 66 * TILE, y: 14 * TILE, w: 3, mode: 'v', range: 8 * TILE, speed: 70, offset: 0, dwell: 1.5 });
  // wagonik suwnicy nad areną
  room.push({ t: 'platform', x: 110 * TILE, y: 14 * TILE, w: 3, mode: 'h', range: 21 * TILE, speed: 100, offset: 0, dwell: 1 });
  room.push({ t: 'boss', k: 'zlomotaur', x: cx(122), y: feet(21) });
  room.autoSpecs('W2-L4', ['W2-L4-S1', 'W2-L4-S2', 'W2-L4-S3']);
  return assemble({ id: 'W2-L4', world: 2, stage: 4, boss: 'zlomotaur', residents: 3, hints: ['hint.switch', 'hint.ladder', 'bosshint.zlomotaur'], budget: { pet: 10, cans: 18, golden: 0 } }, [room]);
}
