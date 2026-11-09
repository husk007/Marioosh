/**
 * W3-L1 „Las Rogopnączy” (docs/design/09 §9, 11): PĘTLA PRZEZ KORONY — dołem przez korzenie na wschód, na szczyt wielkiego drzewa po pnączach (drabinach) z półkami-odpoczynkami,
 * potem górą z powrotem na zachód: kładka botaników, kruche konary (opadają 0,5 s po stanięciu), drugie drzewo i drugi most. Wyjście wisi wysoko nad startem.
 * Dziupla w pniu (wejście z drabiny) kryje posąg. Rogopnącza to nieruchome pułapki (podnoszą rogi, zanim chwycą) — omijaj, nie skacz po nich.
 * Pnącza działają jak drabiny tylko tam, gdzie są narysowane; spadek z koron kończy się bolesnym upadkiem (barier nie ma, ale kładki są szerokie i bez przeskoków powyżej 3 kafli).
 */
import { AuthoredRoom, Canvas, assemble, cx, feet } from '../authored';
import type { LevelData } from '../types';

export function buildW3L1(): LevelData {
  const c = new Canvas(150, 40);
  c.rect(0, 0, 149, 2, '#'); c.rect(0, 3, 0, 39, '#'); c.rect(149, 3, 149, 39, '#');
  c.profile(1, [[10, 36], [8, 34], [8, 36], [8, 33], [8, 35], [10, 36]]);     // korzenie: wzgórki 26°
  c.ground(73, 148, 36);
  // drzewo 1: pień z pnączem na zachodniej ścianie (x89), półki-odpoczynki, dziupla
  c.rect(90, 16, 101, 35, '#'); c.ladder(89, 16, 35);
  c.rect(84, 30, 88, 30, '='); c.rect(84, 23, 88, 23, '=');
  c.rect(90, 26, 96, 28, '.');
  // korona: most A (kładka) → przerwa 3 → kruchy konar → drzewo 2 (pień z pnączem na wschodniej ścianie, x60) → przerwa 3 → most C → wyspa wyjściowa
  c.rect(72, 16, 88, 16, '=');
  c.rect(61, 16, 68, 16, 'c');
  c.rect(48, 16, 59, 35, '#'); c.ladder(60, 16, 35);
  c.rect(30, 16, 44, 16, '=');
  c.rect(8, 16, 29, 20, '#');

  c.set(3, 35, 'S'); c.set(30, 35, 'K'); c.set(95, 15, 'K'); c.set(54, 15, 'K'); c.set(14, 15, 'X');
  c.set(8, 0, '?'); c.set(62, 0, '?'); c.set(88, 0, '?');
  for (const [x, y] of [[4, 35], [8, 35], [18, 33], [21, 33], [31, 35], [44, 32], [46, 32], [55, 34], [66, 35], [70, 35], [86, 29], [86, 22], [92, 27], [94, 27],
    [74, 15], [77, 15], [80, 15], [83, 15], [86, 15], [63, 15], [66, 15], [50, 15], [53, 15], [56, 15], [33, 15], [36, 15], [39, 15], [42, 15], [10, 15], [18, 15]]) c.set(x, y, 'p');
  for (const [x, y] of [[5, 35], [17, 33], [32, 35], [45, 32], [58, 34], [71, 35], [85, 29], [98, 15], [92, 15], [81, 15], [65, 15], [52, 15], [38, 15], [95, 27]]) c.set(x, y, 'k');
  c.set(93, 27, 'T'); c.set(58, 15, 'T'); c.set(20, 33, 'T');
  for (const [x, y] of [[7, 35], [28, 35], [43, 32], [84, 15]]) c.set(x, y, 'r');
  for (const [x, y] of [[66, 12], [52, 12], [35, 12]]) c.set(x, y, 'm');

  const room = new AuthoredRoom('W3-L1:main', c.rows(), { name: 'main', world: 3 });
  for (const [x, y] of [[9, 35], [22, 33], [34, 35], [48, 32], [57, 34], [69, 35], [78, 15], [40, 15]]) room.push({ t: 'enemy', k: 'rogopnacze', x: cx(x), y: feet(y) });
  room.autoSpecs('W3-L1', ['W3-L1-S1', 'W3-L1-S2', 'W3-L1-S3']);
  return assemble({ id: 'W3-L1', world: 3, stage: 1, residents: 3, hints: ['hint.ladder', 'hint.crumble', 'hint.fall'], budget: { pet: 30, cans: 14, golden: 0 } }, [room]);
}
