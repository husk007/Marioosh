/**
 * Fragmenty testowe grawitacji planet (docs/design/10 §prototyp): krótkie, ręcznie projektowane odcinki sprawdzające skrajne g.
 * Skaltria 1,14 g: przerwa 3 kafli (96 px) to wygodne maksimum, 5 kafli jest nie do przejścia; Vespera 0,86 g: przerwa 5 kafli (160 px) jest do pokonania przez obu braci,
 * a na Prądowie tylko przez Darioosha, na Skaltrii przez nikogo (pomiar analizatorem z chwytem krawędzi: 4 kafle da się wszędzie).
 */
import { AuthoredRoom, Canvas, assemble } from '../authored';
import type { LevelData } from '../types';

/** W6-L1 „Nocne Dachy” (fragment): dachy z przerwami 3 kafli (trasa główna), schody pożarowe oraz opcjonalna wyspa dachowa za przerwą 5 kafli (4 m) — do przeskoczenia tylko przy lekkiej grawitacji Vespery */
export function buildW6Gravity(): LevelData {
  const c = new Canvas(84, 18);
  c.ground(0, 20, 12);                                   // dach A
  c.ground(24, 40, 12);                                  // dach B (przerwa 3 kafli: 21–23)
  c.rampUp(41, 12, 3);                                   // schody pożarowe → 47
  c.ground(47, 58, 9);                                   // dach C
  c.ground(62, 71, 9);                                   // dach D (przerwa 3 kafli: 59–61)
  c.ground(77, 82, 9);                                   // wyspa dachowa (przerwa 5 kafli: 72–76) — bonus
  c.rect(0, 3, 0, 11, '#'); c.rect(83, 3, 83, 8, '#');
  c.set(3, 11, 'S'); c.set(68, 8, 'X'); c.set(30, 11, 'K');
  for (const x of [6, 10, 15]) c.set(x, 11, 'p');
  c.set(22, 9, 'p'); c.set(33, 11, 'k'); c.set(36, 11, 'k'); c.set(50, 8, 'p'); c.set(54, 8, 'k'); c.set(60, 8, 'k'); c.set(66, 8, 'p');
  c.set(79, 8, 'p'); c.set(80, 8, 'p'); c.set(78, 8, 'k');
  c.set(18, 11, 'r'); c.set(52, 8, 'r');
  const room = new AuthoredRoom('W6-L1:main', c.rows(), { name: 'main', world: 6 });
  room.autoSpecs('W6-L1');
  return assemble({ id: 'W6-L1', world: 6, stage: 1, proto: true, budget: { pet: 8, cans: 5, golden: 0 } }, [room]);
}
