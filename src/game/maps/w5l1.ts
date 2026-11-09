/**
 * W5-L1 „Kamienne Wydmy” (docs/design/09 §17, 11): dolina skalna na Skaltrii (1,14 g). Główna mechanika: OSUWY SKALNE ze ścisłym ostrzeżeniem (dźwięk, kurz, drżenie, 1,8 s).
 * Kamienie spadają na całym odcinku strefy; chroni tylko lity NAWIS — wszystkie nawisy są niewielkimi „łukami” (płyta 2 wiersze + zwisające końce, pod spodem 4 wiersze przejścia).
 *  Strefa A (3 nawisy co ~16 kafli, osuw co 8 s) — nauka rytmu: biegnij od nawisu do nawisu; Strefa B (krótsze nawisy, osuw co 7 s z przesunięciem) — dochodzą Baranitory.
 *  Alternatywa: dolny TUNEL pod doliną (drabina na początku i na końcu, ~95 kafli), w którym nic nie spada, ale patrolują Baranitory i dwa Bazalisk (osłony: skały 2 wiersze); są tam ukryte PET, puszki i posąg.
 * Plac między strefami (punkt kontrolny, posąg), potem podejście tarasami do wyjścia na wyżynie. Gekorogi chodzą po dnie doliny i na tarasach.
 */
import { AuthoredRoom, Canvas, assemble, cx, feet } from '../authored';
import type { LevelData } from '../types';
import { TILE } from '../constants';

export function buildW5L1(): LevelData {
  const c = new Canvas(172, 38);
  c.rect(0, 0, 171, 1, '#'); c.rect(0, 2, 0, 37, '#'); c.rect(171, 2, 171, 37, '#');
  // dno doliny i tarasy (profil z rampami 26°)
  c.profile(1, [[14, 28], [8, 26], [100, 28], [8, 26], [8, 24], [12, 22]]);
  c.rect(12, 26, 13, 27, '#');                                  // głaz 2 wiersze (przeskok / chwyt)
  c.rect(84, 26, 85, 27, '#');                                  // ławica na placu
  // dolny tunel (6 wierszy), drabiny na obu końcach, osłony przed Bazaliskami
  c.rect(32, 30, 129, 35, '.'); c.ladder(32, 28, 35); c.ladder(129, 28, 35);
  for (const x of [57, 74, 93, 110]) c.rect(x, 34, x + 1, 35, '#');
  // nawisy (łuki): płyta rzędy 20–21, zwisające końce rzędy 22–23; pod spodem 4 wiersze
  const arch = (x0: number, w: number): void => { c.rect(x0, 20, x0 + w - 1, 21, '#'); c.rect(x0, 22, x0, 23, '#'); c.rect(x0 + w - 1, 22, x0 + w - 1, 23, '#'); };
  for (const x of [37, 53, 69]) arch(x, 8);
  for (const x of [98, 111]) arch(x, 6);

  c.set(3, 27, 'S'); c.set(33, 27, 'K'); c.set(92, 27, 'K'); c.set(136, 25, 'K'); c.set(168, 21, 'X');
  c.set(8, 0, '?'); c.set(32, 0, '?'); c.set(90, 0, '?');
  for (const [x, y] of [[4, 27], [7, 27], [10, 27], [24, 25], [48, 27], [50, 27], [64, 27], [66, 27], [91, 27], [107, 27], [120, 27], [138, 25], [150, 23], [164, 21],
    [38, 35], [54, 35], [86, 35], [106, 35]]) c.set(x, y, 'p');
  for (const [x, y] of [[9, 27], [26, 25], [40, 27], [57, 27], [73, 27], [84, 25], [100, 27], [113, 27], [152, 23], [165, 21],
    [44, 35], [62, 35], [90, 35], [112, 35]]) c.set(x, y, 'k');
  c.set(20, 25, 'T'); c.set(88, 27, 'T'); c.set(80, 35, 'T');

  const room = new AuthoredRoom('W5-L1:main', c.rows(), { name: 'main', world: 5 });
  // osuwy: strefa A (nawisy 37–76) i B (98–116)
  room.push({ t: 'slide', x0: 34 * TILE, x1: 81 * TILE, y: 6 * TILE, interval: 8, warn: 1.8 });
  room.push({ t: 'slide', x0: 96 * TILE, x1: 118 * TILE, y: 6 * TILE, interval: 7, warn: 1.8, offset: 3 });
  for (const [x, y] of [[10, 27], [23, 25], [49, 27], [65, 27], [88, 27], [108, 27], [140, 25]]) room.push({ t: 'enemy', k: 'gekorog', x: cx(x), y: feet(y) });
  for (const [x, y] of [[106, 27], [120, 27], [46, 35], [84, 35]]) room.push({ t: 'enemy', k: 'baranitor', x: cx(x), y: feet(y) });
  for (const [x, y] of [[66, 35], [102, 35]]) room.push({ t: 'enemy', k: 'bazalisk', x: cx(x), y: feet(y) });
  room.autoSpecs('W5-L1', ['W5-L1-S1', 'W5-L1-S2', 'W5-L1-S3']);
  return assemble({ id: 'W5-L1', world: 5, stage: 1, residents: 3, hints: ['hint.vault', 'hint.slide', 'hint.ladder'], budget: { pet: 18, cans: 14, golden: 0 } }, [room]);
}
