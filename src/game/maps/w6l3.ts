/**
 * W6-L3 „Gniazda Rogoptaków” (docs/design/09 §23, 11): niebo nad miastem na Vesperze (0,86 g) — wieże-gniazda połączone mostami, pod nimi pustka (upadek = −1 HP).
 * Główna mechanika: RYTM „UKRYCIE – PRZEBIEGNIĘCIE – WINDA”. Mosty mają zadaszenia (łuki): ptak nurkujący z góry ląduje na zadaszeniu, więc pod nim jest bezpiecznie; między nimi trzeba przebiec.
 *  Trzy zamknięte pętle o RÓŻNYCH sposobach wejścia na dach gniazda:
 *   A (x 0–56): most z zadaszeniem → winda towarowa na dach (albo klatka schodowa w wieży: tunel + dwie drabiny z półką, bezpieczna przed ptakami) → gniazdo z puszkami; klatka schodowa jest też drogą powrotną.
 *   B (x 57–110): most z zadaszeniem → schody zewnętrzne (rampa) na płaskowyż z gniazdem → ruchomy pomost nad przepaścią 9 kafli.
 *   C (x 111–204): wieża z tajną latarnią (drabina na wysoki pomost → złota puszka) → most z kruchych konarów → wieża → winda na szczyt, wyjście i ostatnie gniazdo.
 */
import { AuthoredRoom, Canvas, assemble, cx, feet } from '../authored';
import type { LevelData } from '../types';
import { TILE } from '../constants';

export function buildW6L3(): LevelData {
  const c = new Canvas(205, 48);
  c.rect(0, 0, 204, 1, '#'); c.rect(0, 2, 0, 47, '#'); c.rect(204, 2, 204, 47, '#');
  const tower = (x0: number, x1: number, roof: number): void => { c.rect(x0, roof, x1, 47, '#'); };
  const arch = (x0: number, w: number, floor: number): void => {      // zadaszenie: płyta 2 wiersze 8 nad podłogą, końce zwisają o 2 wiersze; pod spodem 4 wiersze
    const top = floor - 8; c.rect(x0, top, x0 + w - 1, top + 1, '#'); c.rect(x0, top + 2, x0, top + 3, '#'); c.rect(x0 + w - 1, top + 2, x0 + w - 1, top + 3, '#');
  };
  const nest = (x0: number, x1: number, roof: number): void => {       // gniazdo na dachu: kopuła 6 wierszy, przejście przelotowe (wejście i wyjście po 3 wiersze)
    c.rect(x0, roof - 6, x1, roof - 1, '#'); c.rect(x0 + 2, roof - 5, x1 - 1, roof - 1, '.'); c.rect(x0, roof - 3, x0 + 1, roof - 1, '.'); c.rect(x1 - 1, roof - 3, x1, roof - 1, '.');
  };

  // ---- pętla A
  tower(1, 14, 38); c.rect(15, 38, 31, 38, '='); arch(17, 8, 38);
  c.rect(29, 28, 31, 28, '='); tower(32, 56, 28); nest(46, 53, 28);
  c.rect(32, 35, 39, 37, '.'); c.rect(36, 29, 39, 33, '.');                    // tunel i szyb klatki schodowej
  c.ladder(36, 28, 33); c.rect(36, 34, 38, 34, '='); c.ladder(39, 34, 37);
  // ---- pętla B
  c.rect(57, 28, 70, 28, '='); arch(60, 8, 28); tower(71, 100, 28);
  c.rampUp(72, 28, 5); c.rect(82, 23, 100, 27, '#'); nest(90, 96, 23);
  c.set(101, 23, '=');                                                          // dok ruchomego pomostu (przepaść 9 kafli: 102–110)
  // ---- pętla C
  tower(111, 135, 23);
  c.rect(122, 14, 131, 14, '#'); c.ladder(126, 14, 22);                    // nieczynna latarnia: drabina z dachu na wysoki pomost
  c.rect(136, 23, 139, 23, '='); c.rect(140, 23, 143, 23, 'c'); c.rect(144, 23, 147, 23, '='); c.rect(148, 23, 151, 23, 'c'); c.rect(152, 23, 155, 23, '=');
  tower(156, 180, 23);
  c.rect(176, 13, 180, 13, '='); tower(181, 203, 13); nest(190, 203, 13);

  // ---- znaczniki
  c.set(3, 37, 'S'); c.set(120, 22, 'K'); c.set(187, 12, 'X');
  c.set(14, 0, '?'); c.set(36, 0, '?');
  c.set(11, 37, 'T'); c.set(86, 22, 'T'); c.set(168, 22, 'T');
  // PET (12)
  for (const [x, y] of [[8, 37], [16, 37], [34, 37], [37, 37], [48, 27], [63, 27], [85, 22], [88, 22], [99, 22], [146, 22], [165, 22], [195, 12]]) c.set(x, y, 'p');
  // puszki (31) i złota (1)
  for (const [x, y] of [[19, 37], [22, 37], [26, 37], [40, 27], [49, 27], [50, 27], [51, 27], [52, 27],
    [60, 27], [66, 27], [84, 22], [92, 22], [93, 22], [94, 22], [95, 22], [98, 22],
    [114, 22], [124, 13], [125, 13], [129, 13], [138, 22], [142, 22], [150, 22], [154, 22], [160, 22], [170, 22], [185, 12], [193, 12], [196, 12], [198, 12], [124, 22]]) c.set(x, y, 'k');
  c.set(127, 13, '*');
  for (const [x, y] of [[18, 37], [70, 27], [112, 22], [158, 22], [184, 12]]) c.set(x, y, 'm');   // Ćmorogi (5)

  const room = new AuthoredRoom('W6-L3:main', c.rows(), { name: 'main', world: 6 });
  // lampy (bezpieczne strefy) i nieczynna latarnia na szczycie półek
  for (const [x, y] of [[10, 37], [34, 27], [60, 27], [83, 22], [114, 22], [138, 22], [158, 22], [185, 12]]) room.push({ t: 'lamp', x: cx(x), y: feet(y) });
  room.push({ t: 'lantern', x: cx(130), y: feet(13), id: 'W6-L3:lt' });
  // windy: A (most → dach gniazda), ruchomy pomost B, C (wieża → szczyt)
  room.push({ t: 'platform', x: 29 * TILE, y: 28 * TILE, w: 3, mode: 'v', range: 10 * TILE, speed: 60, offset: 0, dwell: 1.5 });
  room.push({ t: 'platform', x: 101 * TILE, y: 23 * TILE, w: 3, mode: 'h', range: 9 * TILE, speed: 60, offset: 0, dwell: 1.5 });
  room.push({ t: 'platform', x: 176 * TILE, y: 13 * TILE, w: 3, mode: 'v', range: 10 * TILE, speed: 60, offset: 0, dwell: 1.5 });
  // Krukoróg (8), Rogowróbel (7)
  for (const [x, y] of [[38, 27], [64, 27], [86, 22], [124, 22], [145, 22], [166, 22], [186, 12], [120, 22]]) room.push({ t: 'enemy', k: 'krukorog', x: cx(x), y: feet(y) });
  for (const [x, y] of [[22, 37], [52, 27], [95, 22], [116, 22], [150, 22], [172, 22], [194, 12]]) room.push({ t: 'enemy', k: 'rogowrobel', x: cx(x), y: feet(y) });
  room.autoSpecs('W6-L3');
  return assemble({ id: 'W6-L3', world: 6, stage: 3, residents: 3, hints: ['hint.cover', 'hint.ladder'], budget: { pet: 12, cans: 31, golden: 1 } }, [room]);
}
