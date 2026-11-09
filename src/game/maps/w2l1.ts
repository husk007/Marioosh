/**
 * W2-L1 „Aluminiowe Wzgórza” (docs/design/09 §5, 11): tarasowe składowisko złomu. Główna mechanika: DWIE RÓWNOLEGŁE TRASY nad jedną rzeźbą terenu.
 *  Dół: łagodne rampy 26°, krótkie rowy z kolcami blach, tunel w kopcu z dwoma Baranitorami i niszami-schowkami (drabina w wystającą wnękę).
 *  Góra: drabiną na szczyt kopca i dalej deskowym chodnikiem nad tarasami (więcej puszek, Ślimorogi na deskach).
 * Obie trasy schodzą się przed fosą ze złomem: przez nią przewozi wyłącznie żuraw (ruchomy hak z dokami).
 * Pierwszy EcoPort stoi tuż za pierwszym rowem — zdeponuj opakowania, zanim ruszysz dalej. Brak nart i zjazdów po stokach.
 */
import { AuthoredRoom, Canvas, assemble, cx, feet } from '../authored';
import type { LevelData } from '../types';
import { TILE } from '../constants';

export function buildW2L1(): LevelData {
  const c = new Canvas(170, 28);
  c.rect(0, 0, 169, 1, '#'); c.rect(0, 2, 0, 27, '#'); c.rect(169, 2, 169, 27, '#');
  c.profile(1, [[10, 22], [34, 20], [30, 18], [8, 15], [8, 17], [10, 13], [8, 16]]);
  c.ground(157, 168, 16);
  // rowy z kolcami
  c.rect(31, 20, 33, 20, '.'); c.rect(31, 21, 33, 21, '^');
  c.rect(103, 17, 105, 17, '.'); c.rect(103, 18, 105, 18, '^');
  // kopiec z tunelem: lite wiersze 8–13, tunel 14–17, nisze-schowki ze szczytem drabiny w podłodze wnęki (wiersz 13)
  c.rect(55, 8, 76, 13, '#');
  for (const x of [57, 66]) { c.rect(x - 1, 9, x + 1, 12, '.'); c.set(x, 13, 'H'); c.ladder(x, 13, 17); }
  c.ladder(54, 8, 17); c.ladder(77, 8, 17);
  // chodnik deskowy nad tarasami (wiersz 8) i zejście drabiną do żurawia
  c.rect(78, 8, 132, 8, '='); c.ladder(133, 8, 15);
  // fosa ze złomem i żuraw: doki z desek na obu brzegach
  c.rect(141, 16, 158, 27, '.'); c.rect(141, 25, 158, 25, '^'); c.rect(141, 26, 158, 27, '#');
  c.rect(141, 16, 146, 16, '='); c.rect(153, 16, 158, 16, '=');   // doki: hak zaczyna nad deskami x144–146 i kończy nad x153–155

  c.set(3, 21, 'S'); c.set(36, 19, 'K'); c.set(44, 19, 'E'); c.set(84, 17, 'K'); c.set(134, 15, 'K'); c.set(166, 15, 'X');
  c.set(6, 0, '?'); c.set(30, 0, '?'); c.set(52, 0, '?'); c.set(139, 0, '?');
  for (const [x, y] of [[8, 21], [20, 19], [26, 19], [40, 19], [60, 17], [70, 17], [93, 14], [124, 12], [137, 15], [160, 15], [164, 15], [109, 16]]) c.set(x, y, 'p');
  const cans: [number, number][] = [[5, 21], [7, 21], [17, 19], [22, 19], [24, 19], [38, 19], [42, 19], [46, 19], [56, 12], [58, 12], [65, 12], [67, 12],
    [60, 7], [63, 7], [66, 7], [70, 7], [73, 7], [80, 7], [83, 7], [86, 7], [90, 7], [94, 7], [98, 7], [102, 7], [106, 7], [110, 7], [114, 7], [118, 7], [122, 7], [126, 7], [130, 7], [91, 14], [95, 14], [108, 16]];
  for (const [x, y] of cans) c.set(x, y, 'k');
  c.set(57, 12, 'T'); c.set(100, 7, 'T'); c.set(120, 12, 'T');
  for (const [x, y] of [[9, 21], [23, 19], [118, 12], [162, 15]]) c.set(x, y, 'r');
  c.set(60, 17, 'a'); c.set(71, 17, 'a');

  const room = new AuthoredRoom('W2-L1:main', c.rows(), { name: 'main', world: 2 });
  for (const [x, y] of [[40, 19], [92, 7], [108, 7], [124, 7], [92, 14], [136, 15]]) room.push({ t: 'enemy', k: 'slimorog', x: cx(x), y: feet(y) });
  room.push({ t: 'platform', x: 144 * TILE, y: 16 * TILE, w: 3, mode: 'h', range: 9 * TILE, speed: 60, offset: 0, dwell: 1.4 });
  room.autoSpecs('W2-L1', ['W2-L1-S1', 'W2-L1-S2', 'W2-L1-S3']);
  return assemble({ id: 'W2-L1', world: 2, stage: 1, residents: 3, hints: ['hint.vault', 'hint.fall', 'hint.ladder', 'hint.eco'], budget: { pet: 12, cans: 34, golden: 0 } }, [room]);
}
