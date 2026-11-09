/**
 * W5-L3 „Dolina Spadających Głazów” (docs/design/09 §19, 11): kopalnia odkrywkowa — droga w dole, masyw skalny z tunelem i tarasem na szczycie.
 * Główna mechanika: KULA KAMIENNA NA TORZE. Z bunkra przy wschodniej ścianie masywu co kilka sekund (dudnienie i kurz, 3 s ostrzeżenia) toczy się kula po torze wzdłuż drogi.
 *  Domyślnie kula wpada w studzienkę odpływową (x 119–120); ZWROTNICA na tarasie (dźwignia) kieruje ją dalej, na rumowisko zamykające drogę — jej uderzenie otwiera bramę.
 *  Lewa droga → winda na taras (zwrotnica, Gekorogi, Kamienioróg) lub tunel przez masyw (bezpieczny od kul) → prawa droga z półkami-schronami co ~10 kafli (drabiny 3 wiersze).
 * Kula toczy się po widocznych szynach; tor nie jest losowy i nie schodzi zza kamery.
 */
import { AuthoredRoom, Canvas, assemble, cx, feet } from '../authored';
import type { LevelData } from '../types';
import { TILE } from '../constants';

export function buildW5L3(): LevelData {
  const c = new Canvas(150, 44);
  c.rect(0, 0, 149, 1, '#'); c.rect(0, 2, 0, 43, '#'); c.rect(149, 2, 149, 43, '#');
  c.rect(1, 38, 148, 43, '#');                                 // droga (stoi się w wierszu 37)
  c.rect(34, 21, 80, 37, '#'); c.rect(34, 34, 80, 37, '.');    // masyw z tarasem (wiersz 21) i tunelem (4 wiersze)
  c.rect(30, 21, 33, 21, '=');                                 // dok windy na taras (szyb x 30–33)
  c.rect(29, 17, 29, 20, '#'); c.rect(81, 17, 81, 20, '#');    // poręcze tarasu
  c.rect(119, 38, 120, 39, '.'); c.rect(119, 40, 120, 40, '^'); // studzienka odpływowa
  for (const x of [90, 102, 110, 124, 132]) { c.rect(x, 35, x + 4, 35, '='); c.ladder(x - 1, 35, 37); }   // półki-schrony nad drogą
  c.rect(139, 3, 139, 29, '#'); c.rect(139, 30, 139, 37, '1');  // rumowisko (brama)

  c.set(3, 37, 'S'); c.set(28, 37, 'K'); c.set(116, 37, 'K'); c.set(145, 37, 'X');
  c.set(6, 0, '?'); c.set(40, 0, '?'); c.set(86, 0, '?');
  for (const [x, y] of [[4, 37], [10, 37], [18, 37], [40, 37], [52, 37], [66, 37], [38, 20], [46, 20], [70, 20], [76, 20],
    [92, 34], [104, 34], [112, 34], [126, 34], [86, 37], [96, 37], [132, 37]]) c.set(x, y, 'p');
  for (const [x, y] of [[6, 37], [14, 37], [24, 37], [44, 37], [56, 37], [62, 37], [72, 37], [36, 20], [42, 20], [50, 20], [66, 20], [74, 20],
    [90, 34], [94, 34], [102, 34], [106, 34], [114, 34], [88, 37], [128, 37]]) c.set(x, y, 'k');
  c.set(62, 20, '*');
  c.set(11, 37, 'T'); c.set(60, 37, 'T'); c.set(72, 20, 'T');
  c.set(78, 20, 'Q');

  const room = new AuthoredRoom('W5-L3:main', c.rows(), { name: 'main', world: 5 });
  room.push({ t: 'gate', id: 'g1', cells: room.gateCells.get('g1') ?? [], need: 99 });   // otwiera ją tylko kula
  const q = room.at('Q'); room.push({ t: 'switch', id: 'W5-L3:tz', x: cx(q.tx), y: feet(q.ty), gate: 'tz', style: 'lever', symbol: 0 });
  const R = 24, Y = 38 * TILE - R, sx = 81.5 * TILE;
  const common: [number, number][] = [[sx, Y], [118.5 * TILE, Y]];
  room.push({ t: 'boulder', r: R, path: [...common, [120 * TILE, Y]], fork: { i: 1, alt: [...common, [139 * TILE - R, Y]], select: 'tz' }, speed: 120, every: 8, offset: 3, warn: 3, hit: 'g1' });
  for (const [x, y] of [[14, 37], [22, 37], [100, 37]]) room.push({ t: 'enemy', k: 'bykobieg', x: cx(x), y: feet(y) });
  for (const [x, y] of [[44, 20], [66, 20], [58, 37], [96, 37], [126, 37]]) room.push({ t: 'enemy', k: 'kamienirog', x: cx(x), y: feet(y) });
  for (const [x, y] of [[40, 20], [56, 20], [70, 20], [8, 37], [108, 37], [134, 37]]) room.push({ t: 'enemy', k: 'gekorog', x: cx(x), y: feet(y) });
  // winda na taras (szyb x 30–33)
  room.push({ t: 'platform', x: 31 * TILE, y: 21 * TILE, w: 3, mode: 'v', range: 17 * TILE, speed: 70, offset: 0, dwell: 1.5 });
  room.autoSpecs('W5-L3', ['W5-L3-S1', 'W5-L3-S2', 'W5-L3-S3']);
  return assemble({ id: 'W5-L3', world: 5, stage: 3, residents: 3, hints: ['hint.ladder', 'hint.switch', 'hint.boulder'], budget: { pet: 17, cans: 19, golden: 1 } }, [room]);
}
