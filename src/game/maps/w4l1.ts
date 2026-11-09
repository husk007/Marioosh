/**
 * W4-L1 „Mosty Nad Oceanem” (docs/design/09 §13, 11): archipelag portowy. Wyspy są litymi blokami do dna, a między nimi leżą baseny
 * (nie ma ciągłego morza, więc nie da się „przepłynąć” trasy) — z wody wychodzi się wyłącznie drabinami przy pomostach.
 * Główna mechanika poziomu: OBSŁUGA MOSTÓW — dźwignia na wyspie A opuszcza most zwodzony nad zatoką, dźwignia na szczycie latarni opuszcza
 * drugi most; ostatni basen przecina ruchomy pomost. Podpokład (hala łodzi wewnątrz wyspy B) skrywa puszki.
 * Woda tu jest przeszkodą i lekcją oddychania: upadek do basenu nie zabija, wystarczy dopłynąć do drabiny (≤ 7 s pod wodą).
 */
import { AuthoredRoom, Canvas, assemble, cx, feet } from '../authored';
import type { LevelData } from '../types';
import { TILE } from '../constants';

export function buildW4L1(): LevelData {
  const c = new Canvas(183, 20);
  const isle = (x0: number, x1: number) => c.rect(x0, 10, x1, 19, '#');
  c.rect(0, 0, 0, 19, '#'); c.rect(182, 0, 182, 19, '#'); c.rect(1, 19, 181, 19, '#');
  isle(1, 22);            // nabrzeże (start)
  isle(35, 46);           // wyspa A (dźwignia mostu 1)
  isle(59, 84);           // wyspa B (hala łodzi pod pokładem)
  isle(92, 94); isle(101, 103); isle(110, 112);   // pale mostów
  isle(119, 140);         // wyspa latarni
  isle(153, 157);         // skała R
  isle(170, 181);         // wyspa końcowa z rozdzielnią
  // most 1: deski nad zatoką 1 z dziurą (2 kafle)
  c.rect(24, 10, 33, 10, '='); c.set(28, 10, '.'); c.set(29, 10, '.');
  c.ladder(23, 10, 17); c.ladder(34, 10, 17);
  // zatoka 2 (most zwodzony 1): drabina tylko przy wyspie A
  c.ladder(47, 10, 17);
  // hala łodzi: komora w wyspie B (stropu 2 kafle), dwa szyby z drabinami
  c.rect(63, 12, 78, 17, '.'); c.ladder(62, 10, 17); c.ladder(79, 10, 17);
  // trzy wąskie mostki z palami + czwarty do latarni
  c.rect(85, 10, 91, 10, '='); c.rect(95, 10, 100, 10, '='); c.rect(104, 10, 109, 10, '='); c.rect(113, 10, 118, 10, '=');
  for (const x of [85, 95, 104, 113]) c.ladder(x, 10, 17);
  // zatoka 3 (most zwodzony 2): drabina przy wyspie latarni
  c.ladder(141, 10, 17);
  // zatoka 4: doki ruchomego pomostu i drabina przy skale R
  c.rect(158, 10, 160, 10, '='); c.rect(167, 10, 169, 10, '='); c.ladder(158, 10, 17);
  // latarnia: wieża 8×9, przejście przez wieżę (3 kafle) od zachodu na wschód, galeria na wierszu 5 z szybem drabiny
  c.rect(128, 1, 135, 1, '#'); c.rect(128, 2, 128, 6, '#'); c.rect(135, 2, 135, 6, '#');
  c.rect(129, 5, 134, 5, '#'); c.ladder(131, 5, 9);
  // znaczniki
  c.set(3, 9, 'S'); c.set(121, 9, 'K'); c.set(180, 9, 'X');
  for (const x of [18, 38, 86]) c.set(x, 0, '?');
  for (const x of [5, 9, 13, 26, 31, 38, 41, 66, 76, 123, 126, 156, 175]) c.set(x, 9, 'p');
  for (const x of [74, 75, 76]) c.set(x, 17, 'p');
  for (const x of [17, 19, 44, 89, 98, 107, 116, 137, 147, 178]) c.set(x, 9, 'k');
  for (let x = 65; x <= 72; x++) c.set(x, 17, 'k');
  c.set(20, 9, 'T'); c.set(102, 9, 'T'); c.set(154, 9, 'T');
  c.set(14, 9, 'r'); c.set(40, 9, 'r'); c.set(70, 9, 'r');
  c.set(43, 9, 'W'); c.set(133, 4, 'V');

  const room = new AuthoredRoom('W4-L1:main', c.rows(), {
    name: 'main', world: 4,
    wet: [[23, 16, 34, 18], [47, 16, 58, 18], [85, 16, 91, 18], [95, 16, 100, 18], [104, 16, 109, 18], [113, 16, 118, 18], [141, 16, 152, 18], [158, 16, 169, 18]],
  });
  const W = room.at('W'), V = room.at('V');
  room.push({ t: 'switch', id: 'W4-L1:l1', x: cx(W.tx), y: feet(W.ty), gate: 'br1', style: 'lever', symbol: 0 });
  room.push({ t: 'switch', id: 'W4-L1:l2', x: cx(V.tx), y: feet(V.ty), gate: 'br2', style: 'lever', symbol: 1 });
  const span = (gate: string, x0: number, x1: number): void => { room.push({ t: 'span', gate, cells: Array.from({ length: x1 - x0 + 1 }, (_, i) => [x0 + i, 10] as [number, number]) }); };
  span('br1', 48, 58); span('br2', 142, 152);
  // ruchomy pomost nad ostatnim basenem: doki z desek na obu końcach
  room.push({ t: 'platform', x: 158 * TILE, y: 10 * TILE, w: 3, mode: 'h', range: 9 * TILE, speed: 60, offset: 0, dwell: 1.2 });
  // ryby w basenach (pływają tylko w wodzie — grożą wpadającym)
  for (const x of [28, 52, 88, 97, 106, 115, 146, 163]) room.push({ t: 'enemy', k: 'rogopletw', x: cx(x), y: feet(17) });
  // ptaki nad mostkami nurkują na deski
  for (const x of [88, 98, 107, 116]) room.push({ t: 'enemy', k: 'rogowrobel', x: cx(x), y: feet(7) });
  room.autoSpecs('W4-L1', ['W4-L1-S1', 'W4-L1-S2', 'W4-L1-S3']);
  return assemble({ id: 'W4-L1', world: 4, stage: 1, residents: 3, hints: ['hint.air', 'hint.switch', 'hint.ladder'], budget: { pet: 16, cans: 18, golden: 0 } }, [room]);
}
