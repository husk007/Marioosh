/**
 * W4-L4 „Latarnia Rogopłetwa” (docs/design/09 §16, 11): spiralna latarnia. Droga: wnętrze wieży (drabina w szyb, hala pod halą, rampa w dół),
 * zalane ruiny u podstawy (komora, tunel z dzwonem, hala z pomostem) i arena z trzema basenami pod pomostem.
 * Boss Rogopłetw Wielki (dwunożny humanoid wodny) brodzi po dnie basenów; w wodzie jest nietykalny.
 * Zawory na pomoście spuszczają wodę z wybranego basenu na 16 s — osuszony boss zostaje na dnie i można go uderzyć (drabina z pomostu).
 * Zagrożenia: skok na pomost (zapowiedź przykucnięciem) i szarża po dnie. Trafiony ucieka do basenu z wodą. 3 trafienia.
 */
import { AuthoredRoom, Canvas, assemble, cx, feet } from '../authored';
import type { LevelData } from '../types';

export function buildW4L4(): LevelData {
  const c = new Canvas(136, 30, '#');
  const carve = (x0: number, y0: number, x1: number, y1: number) => c.rect(x0, y0, x1, y1, '.');
  // --- wieża: L1 (wiersz 8) → drabina w szyb → L2 (wiersz 14, pod L1) → rampa w dół → L3 (wiersz 20) → drzwi
  carve(1, 3, 43, 7); carve(28, 8, 43, 19); carve(1, 10, 27, 13);
  c.ladder(26, 8, 13);
  c.rampDown(28, 14, 6);
  carve(44, 17, 44, 19);
  // --- zalane ruiny: komora, tunel z dzwonem, hala z pomostem
  carve(45, 14, 60, 27); c.ladder(45, 20, 27);
  carve(61, 24, 72, 27); carve(64, 18, 67, 23);
  carve(73, 14, 90, 27); c.rect(76, 20, 90, 20, '#'); c.ladder(75, 20, 27);
  // --- arena: blok wejściowy, pomost nad trzema basenami, ławy na końcu
  carve(91, 12, 134, 27); c.rect(91, 20, 95, 27, '#'); c.rect(96, 20, 131, 20, '='); c.rect(132, 20, 134, 27, '#');
  for (const x of [100, 112, 124]) c.ladder(x, 20, 27);

  c.set(3, 7, 'S'); c.set(93, 19, 'K');
  c.set(6, 4, '?'); c.set(46, 16, '?'); c.set(92, 16, '?');
  for (const [x, y] of [[4, 7], [8, 7], [12, 7], [16, 7], [10, 13], [18, 13], [24, 13], [4, 13], [21, 13], [31, 14], [50, 25], [57, 25], [68, 26], [82, 19], [86, 19]]) c.set(x, y, 'p');
  for (const [x, y] of [[6, 7], [20, 7], [14, 13], [34, 16], [15, 13], [36, 17], [41, 19], [52, 26], [64, 22], [100, 19], [112, 19], [124, 19]]) c.set(x, y, 'k');
  c.set(22, 7, 'T'); c.set(42, 19, 'T'); c.set(84, 19, 'T');
  c.set(104, 19, 'A'); c.set(116, 19, 'Q'); c.set(128, 19, 'Z');

  const room = new AuthoredRoom('W4-L4:main', c.rows(), {
    name: 'main', world: 4, bossArena: { x0: 96, x1: 132 },
    wet: [[45, 22, 60, 27], [61, 24, 72, 27], [73, 22, 90, 27]],
  });
  const sw = (id: string, ch: string, gate: string, sym: number): void => { const m = room.at(ch); room.push({ t: 'switch', id, x: cx(m.tx), y: feet(m.ty), gate, style: 'valve', symbol: sym }); };
  sw('W4-L4:pa', 'A', 'poolA', 0); sw('W4-L4:pb', 'Q', 'poolB', 1); sw('W4-L4:pc', 'Z', 'poolC', 2);
  room.push({ t: 'flood', x0: 96, x1: 107, y0: 21, from: 23, to: 28, speed: 2.5, gate: 'poolA' });
  room.push({ t: 'flood', x0: 108, x1: 119, y0: 21, from: 23, to: 28, speed: 2.5, gate: 'poolB' });
  room.push({ t: 'flood', x0: 120, x1: 131, y0: 21, from: 23, to: 28, speed: 2.5, gate: 'poolC' });
  for (const [x, y] of [[50, 25], [55, 24], [68, 26], [80, 25], [86, 25]]) room.push({ t: 'enemy', k: 'rogopletw', x: cx(x), y: feet(y) });
  for (const [x, y] of [[52, 23], [78, 24], [84, 24]]) room.push({ t: 'enemy', k: 'osmiorog', x: cx(x), y: feet(y) });
  room.push({ t: 'enemy', k: 'bazalisk', x: cx(12), y: feet(13) }); room.push({ t: 'enemy', k: 'bazalisk', x: cx(14), y: feet(7) });
  room.push({ t: 'boss', k: 'rogopletw', x: cx(114), y: feet(27) });
  room.autoSpecs('W4-L4', ['W4-L4-S1', 'W4-L4-S2', 'W4-L4-S3']);
  return assemble({ id: 'W4-L4', world: 4, stage: 4, boss: 'rogopletw', residents: 3, hints: ['hint.air', 'hint.ladder', 'hint.valve'], budget: { pet: 15, cans: 12, golden: 0 } }, [room]);
}
