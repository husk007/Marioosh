/**
 * W7-L2 „Burza Energetyczna” (docs/design/09 §26, 11): otwarty teren pod burzą na Ferroksie (1,06 g) — inna architektura niż hala W7-L1: dziedzińce, osłonięte stacje i mosty nad przepaścią.
 * Główna mechanika: CYKL WYŁADOWAŃ (`arc` rodzaj „bolt”: żółte światło i iskry ostrzegają ~1,5 s, potem błyskawica) + WYSUWANY MOST (dźwignia na brzegu).
 *  1. (x 0–55) dziedziniec generatorów: dwa odkryte odcinki (x 14–26, 37–49) rozdzielone stacją (x 28–35); dźwignia mostu na brzegu (x 52).
 *  2. (x 55–110) przepaść 44 kafli: most 1 (x 56–76) wysuwa dźwignia z brzegu, wyspa-stacja (x 77–82) z dźwigniami mostu 2 i „ciszy” (zatrzymuje burzę nad mostem 2).
 *  3. (x 110–165) prawy brzeg: stacja z punktem kontrolnym (x 118–125), dwa odkryte odcinki (x 128–139 i 146–159) co 7 s, stacja pośrodku.
 *  4. (x 165–220) dwie trasy: DOLNA pod burzą (trzy odcinki o przesuniętym rytmie) albo GÓRNA po kładce na wysokości (ruchomy pomost, wyładowania jej nie sięgają); wyjście: rozdzielnia (X).
 */
import { AuthoredRoom, Canvas, assemble, cx, feet } from '../authored';
import type { LevelData } from '../types';

export function buildW7L2(): LevelData {
  const c = new Canvas(220, 40);
  c.rect(0, 0, 0, 39, '#'); c.rect(219, 0, 219, 39, '#');
  c.ground(1, 218, 30);                                                  // powierzchnia: wiersz 30 (stoi się w 29)
  c.rect(56, 30, 99, 39, '.');                                           // przepaść
  c.rect(77, 30, 82, 39, '#');                                           // wyspa
  const arch = (x0: number, w: number): void => { c.rect(x0, 22, x0 + w - 1, 23, '#'); c.rect(x0, 24, x0, 25, '#'); c.rect(x0 + w - 1, 24, x0 + w - 1, 25, '#'); };
  arch(4, 8); arch(28, 8); arch(77, 6); arch(118, 8); arch(140, 6); arch(212, 7);
  // trasa górna (S4): kładka (wiersz 22), ruchomy pomost, zejście
  c.rect(168, 22, 179, 22, '='); c.rect(189, 22, 211, 22, '=');
  c.ladder(164, 22, 29); c.rect(165, 22, 167, 22, '='); c.ladder(213, 22, 29);

  c.set(3, 29, 'S'); c.set(121, 29, 'K'); c.set(217, 29, 'X');
  c.set(6, 0, '?'); c.set(54, 0, '?'); c.set(150, 0, '?');
  c.set(40, 29, 'T'); c.set(114, 29, 'T'); c.set(174, 29, 'T');
  c.set(52, 29, 'Q'); c.set(79, 29, 'R'); c.set(81, 29, 'U');
  // PET (14)
  for (const [x, y] of [[8, 29], [30, 29], [46, 29], [78, 29], [82, 29], [105, 29], [122, 29], [126, 29], [143, 29], [176, 29], [190, 29], [172, 21], [194, 21], [204, 21]]) c.set(x, y, 'p');
  // puszki (21)
  for (const [x, y] of [[18, 29], [22, 29], [34, 29], [42, 29], [50, 29], [62, 29], [68, 29], [80, 29], [90, 29], [95, 29], [112, 29], [130, 29], [136, 29], [150, 29], [155, 29],
    [172, 29], [186, 29], [198, 29], [208, 29], [192, 21], [200, 21]]) c.set(x, y, 'k');

  const room = new AuthoredRoom('W7-L2:main', c.rows(), { name: 'main', world: 7 });
  room.push({ t: 'gate', id: 'b1', cells: [], need: 1 });
  room.push({ t: 'gate', id: 'b2', cells: [], need: 1 });
  room.push({ t: 'gate', id: 'calm', cells: [], need: 1 });
  const sw = (id: string, ch: string, gate: string, sym: number): void => { const m = room.at(ch); room.push({ t: 'switch', id, x: cx(m.tx), y: feet(m.ty), gate, style: 'lever', symbol: sym }); };
  sw('W7-L2:b1', 'Q', 'b1', 0); sw('W7-L2:b2', 'R', 'b2', 1); sw('W7-L2:calm', 'U', 'calm', 2);
  const span = (gate: string, x0: number, x1: number): void => { room.push({ t: 'span', gate, cells: Array.from({ length: x1 - x0 + 1 }, (_, i) => [x0 + i, 30] as [number, number]) }); };
  span('b1', 56, 76); span('b2', 83, 99);
  // wyładowania: [x0, x1, offset, stop, od wiersza]
  const bolt = (x0: number, x1: number, off: number, stop?: string, row = 2): void => { room.push({ t: 'arc', x0: x0 * 32, y0: row * 32, x1: (x1 + 1) * 32, y1: 30 * 32, period: 7, on: 0.6, warn: 1.5, offset: off, stop, kind: 'bolt' }); };
  bolt(14, 26, 0); bolt(37, 49, 3.5); bolt(57, 71, 1); bolt(85, 98, 4, 'calm');
  bolt(128, 139, 0); bolt(146, 159, 3.5);
  bolt(168, 179, 0, undefined, 23); bolt(182, 193, 2.3, undefined, 23); bolt(196, 209, 4.6, undefined, 23);
  room.push({ t: 'platform', x: 179 * 32, y: 22 * 32, w: 3, mode: 'h', range: 9 * 32, speed: 60, offset: 0, dwell: 1.5 });
  // przeciwnicy: Kamienioróg 5, Pszczółrog 7, drony 4
  for (const x of [20, 46, 108, 150, 190]) room.push({ t: 'enemy', k: 'kamienirog', x: cx(x), y: feet(29) });
  for (const x of [32, 52, 112, 134, 160, 178, 205]) room.push({ t: 'enemy', k: 'pszczolrog', x: cx(x), y: feet(26) });
  for (const x of [26, 142, 172, 200]) room.push({ t: 'enemy', k: 'dron', x: cx(x), y: feet(23) });
  room.autoSpecs('W7-L2');
  return assemble({ id: 'W7-L2', world: 7, stage: 2, residents: 3, hints: ['hint.storm', 'hint.bridge', 'hint.switch'], budget: { pet: 14, cans: 21, golden: 0 } }, [room]);
}
