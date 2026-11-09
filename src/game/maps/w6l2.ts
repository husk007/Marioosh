/**
 * W6-L2 „Wieża Chmur” (docs/design/09 §22, 11): wysoka wieża w przekroju (Vespera 0,86 g). Główna mechanika: WINDA W CENTRALNYM SZYBIE I JEJ NAPRAWA.
 * Wieża ma osiem poziomów (hale 12 wierszy wysokości), szyb centralny (x 26–33) przecięty kładkami na kolejnych piętrach oraz dwie połowy hal.
 *  Parter → piętro 2: winda E1 (zawsze działa; przystanki tylko na końcach). Parter ↔ piętro 1: drabiny z półką (dolne warsztaty z bezpiecznikiem nr 1 i ukrytymi puszkami).
 *  Piętro 2 → 3: drabiny z półką; 3 → 4: rampa-schody i galeria + drabina; 4 → 5: drabiny; 5 → 6: rampa-schody i galeria + drabina. Punkt kontrolny na piętrze 4 (platforma serwisowa).
 *  Winda E3 (piętro 6 → szczyt) stoi BEZ PRĄDU: zasila ją dwa bezpieczniki — nr 1 w warsztacie przy parterze, nr 2 przy punkcie kontrolnym. Bez nich na szczyt nie ma drogi (szyb 12 wierszy).
 *  Opcjonalne boczne piętro (annex) na rusztowaniu przy ścianie wieży na piętrze 2: dwie drabiny z półką, schowek z PET i puszkami — bez wspinania po ścianach.
 */
import { AuthoredRoom, Canvas, assemble, cx, feet } from '../authored';
import type { LevelData } from '../types';
import { TILE } from '../constants';

export function buildW6L2(): LevelData {
  const c = new Canvas(68, 104, '#');
  const F = [100, 88, 76, 64, 52, 40, 28, 16];                     // powierzchnie podłóg (stoi się w wierszu F-1)
  for (let k = 0; k < 7; k++) c.rect(3, F[k + 1] + 2, 56, F[k] - 1, '.');   // hale (powietrze)
  c.rect(3, 5, 56, 15, '.');                                       // hala szczytowa
  c.rect(26, 5, 33, 99, '.');                                      // szyb centralny
  for (const y of [76, 64, 52, 40, 28, 16]) c.rect(26, y, 33, y, '=');   // kładki / doki nad szybem

  /** rampa-schody w prawo: jak Canvas.rampUp, ale wypełnienie tylko do podłogi hali (nie psuje niższych pięter) */
  const stairs = (x: number, floor: number, rise: number): void => {
    for (let i = 0; i < rise; i++) { const r = floor - 1 - i; c.set(x + 2 * i, r, '(').set(x + 2 * i + 1, r, ')'); for (const cc of [x + 2 * i, x + 2 * i + 1]) for (let y = r + 1; y < floor; y++) c.set(cc, y, '#'); }
  };
  // drabiny z półką: parter → 1 (obie połowy), 2 → 3, 4 → 5 (lewa)
  c.ladder(6, 94, 99); c.rect(7, 94, 10, 94, '='); c.ladder(10, 88, 93);
  c.ladder(52, 94, 99); c.rect(49, 94, 51, 94, '='); c.ladder(49, 88, 93);
  c.ladder(6, 70, 75); c.rect(7, 70, 10, 70, '='); c.ladder(10, 64, 69);
  c.ladder(6, 46, 51); c.rect(7, 46, 10, 46, '='); c.ladder(10, 40, 45);
  // piętro 3 → 4: rampa (prawa), galeria, drabina; piętro 5 → 6: rampa (prawa), galeria, drabina
  stairs(40, 64, 6); c.rect(52, 58, 56, 59, '#'); c.ladder(55, 52, 57);
  stairs(36, 40, 6); c.rect(48, 34, 56, 35, '#'); c.ladder(52, 28, 33);
  // boczne piętro: otwór w ścianie, rusztowanie i schowek
  c.rect(57, 72, 58, 75, '.'); c.rect(59, 66, 62, 75, '.');
  c.ladder(62, 70, 75); c.rect(59, 70, 61, 70, '='); c.ladder(59, 64, 69);
  c.rect(59, 54, 65, 63, '.');

  // znaczniki
  c.set(5, 99, 'S'); c.set(47, 51, 'K'); c.set(45, 15, 'X');
  c.set(6, 0, '?'); c.set(29, 0, '?');
  c.set(46, 27, 'T'); c.set(16, 63, 'T'); c.set(14, 87, 'T');
  c.set(22, 87, 'Q'); c.set(45, 51, 'R');
  // PET (18)
  for (const [x, y] of [[8, 99], [48, 99], [5, 87], [20, 87], [40, 87], [54, 87], [14, 75], [48, 75], [20, 63], [36, 63],
    [18, 51], [40, 51], [22, 39], [14, 27], [38, 27], [62, 63], [12, 15], [40, 15]]) c.set(x, y, 'p');
  // puszki (20)
  for (const [x, y] of [[14, 99], [20, 99], [38, 99], [44, 99], [10, 87], [44, 87], [20, 75], [42, 75], [30, 63], [14, 63],
    [24, 51], [52, 51], [14, 39], [30, 39], [22, 27], [54, 27], [60, 63], [64, 63], [50, 15], [20, 15]]) c.set(x, y, 'k');
  // Ćmorogi (8)
  for (const [x, y] of [[30, 99], [54, 99], [8, 75], [54, 75], [12, 51], [18, 39], [8, 27], [28, 15]]) c.set(x, y, 'm');

  const room = new AuthoredRoom('W6-L2:main', c.rows(), { name: 'main', world: 6 });
  room.push({ t: 'gate', id: 'pw', cells: [], need: 2 });
  for (const [ch, id] of [['Q', 'f1'], ['R', 'f2']] as const) { const m = room.at(ch); room.push({ t: 'switch', id: `W6-L2:${id}`, x: cx(m.tx), y: feet(m.ty), gate: 'pw', style: 'relay', symbol: 0 }); }
  // windy: E1 zawsze działa (parter ↔ piętro 2), E3 zasilana bezpiecznikami (piętro 6 ↔ szczyt)
  room.push({ t: 'platform', x: 29 * TILE, y: 76 * TILE, w: 3, mode: 'v', range: 24 * TILE, speed: 80, offset: 0, dwell: 2 });
  room.push({ t: 'platform', x: 29 * TILE, y: 16 * TILE, w: 3, mode: 'v', range: 12 * TILE, speed: 70, offset: 0, dwell: 2, power: 'pw' });
  // Rogowróbel (6) i Pszczółrog (4)
  for (const [x, y] of [[36, 99], [50, 87], [44, 51], [50, 15], [40, 27], [22, 63]]) room.push({ t: 'enemy', k: 'rogowrobel', x: cx(x), y: feet(y) });
  for (const [x, y] of [[24, 75], [8, 51], [48, 39], [30, 15]]) room.push({ t: 'enemy', k: 'pszczolrog', x: cx(x), y: feet(y) });
  room.autoSpecs('W6-L2');
  return assemble({ id: 'W6-L2', world: 6, stage: 2, residents: 3, hints: ['hint.ladder', 'hint.power'], budget: { pet: 18, cans: 20, golden: 0 } }, [room]);
}
