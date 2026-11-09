/**
 * W7-L4 „Hala Rogodrona” (docs/design/09 §28, 11): hala testów dronów na Ferroksie (1,06 g) → arena Rogodrona. Wyjście = pokonanie bossa (brak znacznika X).
 *  1. Hala wejściowa (x 0–44): drony-strażnicy ujawniają rytm ataku (błysk 0,8 s → nurkowanie → lądowanie); galeria z dźwignią testu obwodu 1 otwiera drzwi A (x 44).
 *  2. Hale napraw (x 45–99): galeria z dźwignią obwodu 2 (drzwi B, x 74) i galeria z dźwignią obwodu 3 (szkło bezpieczeństwa, x 100) — każdy obwód da się sprawdzić bez walki. Sekret: półka z EcoPortem nad galerią (x 98–104).
 *  3. Za szkłem: punkt kontrolny (x 104) i korytarz do areny.
 *  4. Arena (x 125–163, dwupoziomowa): dwa podesty operatora (x 125–137 i 151–163, wysokość 4 wierszy) z generatorami 1 i 2, środkowa platforma (też 4 wiersze) z generatorem 3.
 *     Rogodron krąży pod sufitem, zrzuca złom i wypuszcza drony. Wszystkie trzy generatory włączone w oknie 28 s odsłaniają rdzeń na 7 s — zejdź na podłogę i uderz kluczem. Brak skakania po głowie.
 */
import { AuthoredRoom, Canvas, assemble, cx, feet } from '../authored';
import type { LevelData } from '../types';

export function buildW7L4(): LevelData {
  const c = new Canvas(165, 36, '#');
  c.rect(1, 8, 123, 27, '.'); c.rect(124, 4, 163, 27, '.');            // hala i arena
  const F = 28;                                                          // podłoga: wiersz 28 (stoi się w 27)
  // drzwi A i B, szkło bezpieczeństwa
  c.rect(44, 8, 44, 27, '1'); c.rect(74, 8, 74, 27, '2'); c.rect(100, 8, 100, 27, '3');
  // galerie z dźwigniami (wiersz 20) i drabiny (8 wierszy)
  c.rect(30, 20, 43, 20, '='); c.ladder(29, 20, 27);
  c.rect(55, 20, 70, 20, '='); c.ladder(54, 20, 27);
  c.rect(80, 20, 97, 20, '='); c.ladder(79, 20, 27);
  // sekret: półka z EcoPortem
  c.ladder(97, 14, 19); c.rect(98, 14, 104, 14, '=');
  // arena: podesty operatora (wiersz 24), platforma środkowa (wiersz 24)
  c.rect(125, 24, 137, 24, '='); c.ladder(138, 24, 27);
  c.rect(151, 24, 163, 24, '='); c.ladder(150, 24, 27);
  c.rect(141, 24, 147, 24, '='); c.ladder(140, 24, 27); c.ladder(148, 24, 27);
  void F;

  c.set(3, 27, 'S'); c.set(104, 27, 'K');
  c.set(6, 0, '?'); c.set(40, 0, '?'); c.set(122, 0, '?');
  c.set(30, 27, 'T'); c.set(86, 27, 'T'); c.set(109, 27, 'T');
  c.set(36, 19, 'Q'); c.set(62, 19, 'R'); c.set(88, 19, 'U');
  c.set(131, 23, 'V'); c.set(144, 23, 'W'); c.set(157, 23, 'Z');
  c.set(101, 13, 'E');
  // PET (9)
  for (const [x, y] of [[8, 27], [22, 27], [34, 19], [58, 19], [68, 19], [84, 19], [92, 19], [112, 27], [127, 23]]) c.set(x, y, 'p');
  // puszki (12)
  for (const [x, y] of [[14, 27], [26, 27], [50, 27], [66, 27], [80, 27], [96, 27], [108, 27], [116, 27], [154, 23], [160, 23], [42, 19], [66, 19]]) c.set(x, y, 'k');

  const room = new AuthoredRoom('W7-L4:main', c.rows(), { name: 'main', world: 7, bossArena: { x0: 125, x1: 163 } });
  for (const [id, need] of [['g1', 1], ['g2', 1], ['g3', 1]] as const) room.push({ t: 'gate', id, cells: room.gateCells.get(id) ?? [], need });
  const sw = (id: string, ch: string, gate: string, sym: number, style: 'lever' | 'relay'): void => { const m = room.at(ch); room.push({ t: 'switch', id, x: cx(m.tx), y: feet(m.ty), gate, style, symbol: sym }); };
  sw('W7-L4:t1', 'Q', 'g1', 0, 'lever'); sw('W7-L4:t2', 'R', 'g2', 1, 'lever'); sw('W7-L4:t3', 'U', 'g3', 2, 'lever');
  sw('W7-L4:gen1', 'V', 'gen', 0, 'relay'); sw('W7-L4:gen2', 'W', 'gen', 1, 'relay'); sw('W7-L4:gen3', 'Z', 'gen', 2, 'relay');
  // Kamienioróg 5, Żukoróg 3, drony-strażnicy 6
  for (const x of [18, 52, 78, 106, 114]) room.push({ t: 'enemy', k: 'kamienirog', x: cx(x), y: feet(27) });
  for (const x of [10, 60, 92]) room.push({ t: 'enemy', k: 'zukorog', x: cx(x), y: feet(27) });
  for (const x of [26, 56, 66, 84, 108, 117]) room.push({ t: 'enemy', k: 'dron', x: cx(x), y: feet(23) });
  room.push({ t: 'boss', k: 'rogodron', x: cx(144), y: feet(27) });
  room.autoSpecs('W7-L4', ['W7-L4-S1', 'W7-L4-S2', 'W7-L4-S3']);
  return assemble({ id: 'W7-L4', world: 7, stage: 4, boss: 'rogodron', residents: 3, hints: ['hint.dron', 'hint.switch', 'bosshint.rogodron'], budget: { pet: 9, cans: 12, golden: 0 } }, [room]);
}
