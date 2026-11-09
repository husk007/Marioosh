/**
 * W3-L4 „Oranżeria Kaktogóra” (docs/design/09 §12, 11): wielka szklarnia przechodzona jak PIERŚCIEŃ — dolny korytarz, galeria nad nim i druga galeria wyżej, na końcu arena.
 * Dolny korytarz (palmiarnia): Kakturożce; drabina w górę na galerię z dźwignią L1 (Rogoróże na galerii) i z powrotem.
 * Ogród kolców: doły z kolcami, pomost na drabinach i wysoka półka z dźwignią L2 (dwie drabiny, Rogoróża na pomoście). Brama g1 do areny wymaga obu dźwigni.
 * Arena: Kaktogór stoi w środku i obrzuca kolcami (z ostrzeżeniem). Trzy korzenie (dwa przy ziemi, jeden na półce z drabiną) odcięte kluczem zdejmują pancerz;
 * wtedy trzeba uderzyć w serce kwiatu. Po każdym trafieniu korzenie odrastają. Brak skakania po głowie.
 */
import { AuthoredRoom, Canvas, assemble, cx, feet } from '../authored';
import type { LevelData } from '../types';

export function buildW3L4(): LevelData {
  const c = new Canvas(130, 34);
  c.rect(0, 0, 129, 2, '#'); c.rect(0, 3, 0, 33, '#'); c.rect(129, 3, 129, 33, '#');
  c.ground(1, 128, 29);
  // galeria 1 (nad palmiarnią) i drabiny
  c.rect(22, 20, 58, 20, '='); c.ladder(21, 20, 28); c.ladder(59, 20, 28);
  // ogród kolców: doły z kolcami, pomost, półka z dźwignią L2
  c.rect(64, 29, 66, 29, '.'); c.rect(64, 30, 66, 30, '^'); c.rect(76, 29, 78, 29, '.'); c.rect(76, 30, 78, 30, '^');
  c.rect(70, 24, 90, 24, '='); c.ladder(69, 24, 28);
  c.rect(80, 16, 92, 16, '='); c.ladder(79, 16, 23);
  c.rect(50, 26, 51, 28, '#');                                // żywopłot (3 wiersze) — trzeba go obejść górą (galeria) albo przeskoczyć z chwytem
  // brama do areny g1
  c.rect(98, 3, 98, 19, '#'); c.rect(98, 20, 98, 28, '1');
  // arena: półka z korzeniem i drabina
  c.rect(108, 20, 118, 20, '='); c.ladder(107, 20, 28);

  c.set(3, 28, 'S'); c.set(45, 28, 'K'); c.set(100, 28, 'K');
  c.set(6, 0, '?'); c.set(66, 0, '?'); c.set(100, 0, '?');
  for (const [x, y] of [[6, 28], [10, 28], [14, 28], [18, 28], [24, 19], [30, 19], [46, 19], [52, 19], [56, 28], [62, 28], [72, 28], [82, 28], [90, 28], [96, 28],
    [72, 23], [78, 23], [84, 23], [82, 15], [88, 15], [110, 19]]) c.set(x, y, 'p');
  for (const [x, y] of [[8, 28], [16, 28], [44, 19], [48, 19], [58, 28], [86, 28], [80, 23], [90, 15]]) c.set(x, y, 'k');
  c.set(26, 19, 'T'); c.set(74, 23, 'T'); c.set(92, 15, 'T');
  c.set(40, 19, 'Q'); c.set(85, 15, 'R');

  const room = new AuthoredRoom('W3-L4:main', c.rows(), { name: 'main', world: 3, bossArena: { x0: 99, x1: 128 } });
  room.push({ t: 'gate', id: 'g1', cells: room.gateCells.get('g1') ?? [], need: 2 });
  const sw = (id: string, ch: string, sym: number): void => { const m = room.at(ch); room.push({ t: 'switch', id, x: cx(m.tx), y: feet(m.ty), gate: 'g1', style: 'lever', symbol: sym }); };
  sw('W3-L4:l1', 'Q', 0); sw('W3-L4:l2', 'R', 1);
  for (const [x, y] of [[20, 28], [53, 28], [88, 28]]) room.push({ t: 'enemy', k: 'kakturozec', x: cx(x), y: feet(y) });
  for (const [x, y] of [[36, 19], [54, 19], [87, 23]]) room.push({ t: 'enemy', k: 'rogoroza', x: cx(x), y: feet(y) });
  for (const [x, y] of [[13, 28], [34, 28], [60, 28], [70, 28], [94, 28]]) room.push({ t: 'enemy', k: 'rogopnacze', x: cx(x), y: feet(y) });
  // korzenie Kaktogóra: dwa przy ziemi, jeden na półce
  room.push({ t: 'decor', k: 'root', x: cx(103), y: feet(28) }); room.push({ t: 'decor', k: 'root', x: cx(123), y: feet(28) }); room.push({ t: 'decor', k: 'root', x: cx(113), y: feet(19) });
  room.push({ t: 'boss', k: 'kaktogor', x: cx(113), y: feet(28) });
  room.autoSpecs('W3-L4', ['W3-L4-S1', 'W3-L4-S2', 'W3-L4-S3']);
  return assemble({ id: 'W3-L4', world: 3, stage: 4, boss: 'kaktogor', residents: 3, hints: ['hint.ladder', 'hint.gate2', 'bosshint.kaktogor'], budget: { pet: 20, cans: 8, golden: 0 } }, [room]);
}
