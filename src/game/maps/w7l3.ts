/**
 * W7-L3 „Reaktor Bez Dna” (docs/design/09 §27, 11): wnętrze reaktora na Ferroksie (1,06 g), WIELKIE PRZEPAŚCI bez dna (upadek = −1 HP i powrót) oraz rdzeń z pierścieniami-antresolami.
 * Główne mechaniki: MOST NA CZAS (przekaźnik opuszcza go na 8 s, ostrzeżenie 2 s przed schowaniem — trzeba biec) i TRZY PRZEKAŹNIKI W KOLEJNOŚCI (od najniższego piętra; zła kolejność zeruje komplet) uruchamiające windę.
 *  1. (x 0–59) lewy brzeg → most na czas nad przepaścią 22 kafli (dźwignia x 17) → prawy brzeg.
 *  2. (x 59–118) trzy wyspy-stacje stabilizacji: przekaźnik wyspy zasila ruchomy pomost nad kolejną przepaścią (3 × 10 kafli), po każdym skoku stacja.
 *  3. (x 118–176) rdzeń reaktora: trzy pierścienie po lewej (drabiny po 9 wierszy) z przekaźnikami 1–2–3; po komplecie rusza winda w szybie za rdzeniem (zejście na parter, potem tunel). Punkt kontrolny x 129. Winda skraca też drogę powrotną.
 *  4. (x 176–235) dwa mosty na czas (dźwignie x 190 i x 217), Baranitory na brzegach; rozdzielnia (X) bez wymuszonej walki. Sekret: złota puszka na półce nad wyspą.
 */
import { AuthoredRoom, Canvas, assemble, cx, feet } from '../authored';
import type { LevelData } from '../types';

export function buildW7L3(): LevelData {
  const c = new Canvas(235, 48);
  c.rect(0, 0, 0, 47, '#'); c.rect(234, 0, 234, 47, '#');
  c.ground(1, 233, 41);                                                // powierzchnia: wiersz 41 (stoi się w 40)
  // ---- przepaści bez dna
  c.rect(20, 41, 41, 47, '.');
  c.rect(66, 41, 76, 47, '.'); c.rect(85, 41, 95, 47, '.'); c.rect(104, 41, 114, 47, '.');
  for (const x of [66, 85, 104]) c.set(x, 41, '=');                    // doki ruchomych pomostów
  c.rect(193, 41, 212, 47, '.'); c.rect(220, 41, 229, 47, '.');
  // ---- rdzeń reaktora (x 140–155), pierścienie po lewej, szyb windy (x 156–158) i tunel
  c.rect(140, 14, 155, 47, '#'); c.rect(159, 0, 175, 47, '#'); c.rect(159, 37, 175, 40, '.');
  c.rect(156, 14, 158, 14, '=');                                         // kładka nad szybem (górny przystanek windy)
  c.rect(122, 32, 139, 32, '='); c.rect(126, 23, 139, 23, '='); c.rect(130, 14, 139, 14, '=');
  c.ladder(121, 32, 40); c.ladder(125, 23, 31); c.ladder(129, 14, 22);
  // ---- półka ze złotą puszką nad wyspą (S4)
  c.rect(215, 32, 219, 32, '='); c.ladder(214, 32, 40);

  c.set(3, 40, 'S'); c.set(129, 40, 'K'); c.set(232, 40, 'X');
  c.set(6, 0, '?'); c.set(62, 0, '?'); c.set(120, 0, '?');
  c.set(48, 40, 'T'); c.set(122, 40, 'T'); c.set(186, 40, 'T');
  c.set(17, 40, 'Q'); c.set(63, 40, 'A'); c.set(82, 40, 'N'); c.set(124, 31, 'R'); c.set(130, 22, 'U'); c.set(134, 13, 'V'); c.set(190, 40, 'W'); c.set(217, 40, 'Z');
  c.set(217, 31, '*');
  // PET (10)
  for (const [x, y] of [[6, 40], [50, 40], [80, 40], [99, 40], [127, 31], [127, 22], [137, 13], [148, 13], [168, 40], [218, 40]]) c.set(x, y, 'p');
  // puszki (27)
  for (const [x, y] of [[10, 40], [14, 40], [26, 40], [34, 40], [40, 40], [52, 40], [58, 40], [60, 40], [79, 40], [83, 40], [98, 40], [102, 40], [118, 40], [125, 40], [134, 40],
    [130, 31], [136, 31], [134, 22], [136, 13], [146, 13], [150, 13], [165, 40], [170, 40], [180, 40], [184, 40], [200, 40], [206, 40]]) c.set(x, y, 'k');

  const room = new AuthoredRoom('W7-L3:main', c.rows(), { name: 'main', world: 7 });
  for (const id of ['tb1', 'tb2', 'tb3', 'p1', 'p2', 'p3']) room.push({ t: 'gate', id, cells: [], need: 1 });
  room.push({ t: 'gate', id: 'ordA', cells: [], need: 3 });
  const sw = (id: string, ch: string, gate: string, sym: number, style: 'lever' | 'relay'): void => { const m = room.at(ch); room.push({ t: 'switch', id, x: cx(m.tx), y: feet(m.ty), gate, style, symbol: sym }); };
  sw('W7-L3:tb1', 'Q', 'tb1', 0, 'lever'); sw('W7-L3:tb2', 'W', 'tb2', 0, 'lever'); sw('W7-L3:tb3', 'Z', 'tb3', 0, 'lever');
  sw('W7-L3:p1', 'A', 'p1', 0, 'relay'); sw('W7-L3:p2', 'N', 'p2', 1, 'relay');
  room.push({ t: 'switch', id: 'W7-L3:p3', x: cx(101), y: feet(40), gate: 'p3', style: 'relay', symbol: 2 });
  sw('W7-L3:o1', 'R', 'ordA', 0, 'relay'); sw('W7-L3:o2', 'U', 'ordA', 1, 'relay'); sw('W7-L3:o3', 'V', 'ordA', 2, 'relay');
  const span = (gate: string, x0: number, x1: number): void => { room.push({ t: 'span', gate, timed: true, cells: Array.from({ length: x1 - x0 + 1 }, (_, i) => [x0 + i, 41] as [number, number]) }); };
  span('tb1', 20, 41); span('tb2', 193, 212); span('tb3', 220, 229);
  // ruchome pomosty (zasilane stacjami) i winda szybu (zasilana kompletem przekaźników)
  [['p1', 66], ['p2', 85], ['p3', 104]].forEach(([g, x]) => room.push({ t: 'platform', x: (x as number) * 32, y: 41 * 32, w: 3, mode: 'h', range: 10 * 32, speed: 60, offset: 0, dwell: 1.5, power: g as string }));
  room.push({ t: 'platform', x: 156 * 32, y: 14 * 32, w: 3, mode: 'v', range: 27 * 32, speed: 80, offset: 0, dwell: 2, power: 'ordA' });
  // Kamienioróg 8, Baranitor 4, Rogodron-minion 6
  for (const [x, y] of [[12, 40], [54, 40], [100, 40], [78, 40], [126, 40], [146, 13], [170, 40], [208 - 30, 40]]) room.push({ t: 'enemy', k: 'kamienirog', x: cx(x), y: feet(y) });
  for (const x of [118, 182, 188, 216]) room.push({ t: 'enemy', k: 'baranitor', x: cx(x), y: feet(40) });
  for (const x of [48, 80, 99, 128, 183, 216]) room.push({ t: 'enemy', k: 'dron', x: cx(x), y: feet(34) });
  room.autoSpecs('W7-L3');
  return assemble({ id: 'W7-L3', world: 7, stage: 3, residents: 3, hints: ['hint.timed', 'hint.switch', 'hint.order'], budget: { pet: 10, cans: 27, golden: 1 } }, [room]);
}
