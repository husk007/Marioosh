/**
 * W6-L4 „Obserwatorium Krukoroga” (docs/design/09 §24, 11): kopuła obserwatorium na Vesperze (0,86 g), boss Krukoróg Królewski. Wyjście = pokonanie bossa (brak znacznika X).
 *  1. Most do obserwatorium (x 10–37): ptaki, lampa; z tyłu zamknięta nisza (x 2–8) — reflektor ćwiczebny (przełącznik) otwiera jej bramę (g1) i oświetla ukryte opakowania.
 *  2. Hala kopuły (x 38–75): przepaść z wyspą (x 50–71), przez którą kursują DWA ruchome pomosty (przęsła po 7–9 kafli — bez skoku) — zrzut = −1 HP.
 *  3. Hala sterowni (x 76–111): piwnica sterowni (drabina, bezpiecznik 1), dźwig serwisowy na galerię (bezpiecznik 2 + taras z zieloną baterią), punkt kontrolny (x 108). Dwa bezpieczniki zasilają bramę areny (g2).
 *  4. Arena (x 113–148, solidna posadzka): trzy reflektory na posadzce (x 118, 131, 144), każdy świeci 8 s. Zapal wszystkie trzy naraz — oślepiony Krukoróg ląduje na 3,4 s;
 *     trzy trafienia kluczem w znamię. Krukoróg rzuca kamienie w miejsce gracza i wzbudza podmuchy. Galerie (drabiny 4 wiersze) są schronem z opakowaniami. Bez skakania po głowie.
 */
import { AuthoredRoom, Canvas, assemble, cx, feet } from '../authored';
import type { LevelData } from '../types';
import { TILE } from '../constants';

export function buildW6L4(): LevelData {
  const c = new Canvas(150, 42, '#');
  const carve = (x0: number, y0: number, x1: number, y1: number) => c.rect(x0, y0, x1, y1, '.');
  carve(10, 2, 37, 34);                                    // most (pod gołym niebem)
  carve(2, 31, 8, 34);                                     // nisza ćwiczebna (brama g1 w kolumnie 9)
  c.rect(9, 31, 9, 34, '1');
  carve(38, 20, 75, 34);                                   // hala kopuły
  carve(50, 35, 71, 41); c.rect(61, 35, 63, 41, '#');      // przepaść z wyspą (x 61–63)
  for (const x of [51, 59, 71]) c.set(x, 35, '=');           // dojścia (po jednym kaflu) pod punktami postoju pomostów
  carve(76, 20, 111, 34);                                  // hala sterowni
  carve(78, 36, 92, 40); c.ladder(80, 35, 40);             // piwnica sterowni (drabina 6 wierszy)
  c.rect(93, 27, 99, 27, '#'); c.rect(90, 27, 92, 27, '=');   // galeria nad dźwigiem
  c.rect(100, 25, 105, 25, '#');                           // taras (stopień 2 wiersze od galerii) z baterią
  c.rect(112, 24, 112, 34, '2');                           // brama areny g2
  carve(113, 20, 148, 34);                                 // arena (kopuła)
  c.rect(114, 31, 122, 31, '='); c.ladder(123, 31, 34);    // galeria lewa
  c.rect(140, 31, 148, 31, '='); c.ladder(139, 31, 34);    // galeria prawa

  c.set(12, 34, 'S'); c.set(108, 34, 'K');
  c.set(14, 0, '?'); c.set(80, 0, '?'); c.set(110, 0, '?');
  c.set(27, 34, 'T'); c.set(78, 34, 'T'); c.set(99, 34, 'T');
  c.set(14, 34, 'Q'); c.set(90, 40, 'R'); c.set(98, 26, 'U');
  c.set(103, 24, 'B');                                     // zielona bateria (sekret: taras)
  c.set(118, 34, 'V'); c.set(131, 34, 'W'); c.set(144, 34, 'Z');
  // PET (12)
  for (const [x, y] of [[3, 34], [5, 34], [7, 34], [16, 34], [32, 34], [62, 34], [86, 34], [105, 34], [82, 40], [86, 40], [118, 30], [144, 30]]) c.set(x, y, 'p');
  // puszki (11)
  for (const [x, y] of [[4, 34], [20, 34], [26, 34], [44, 34], [47, 34], [72, 34], [90, 34], [96, 26], [102, 34], [120, 34], [142, 34]]) c.set(x, y, 'k');
  // Ćmorogi (5)
  for (const [x, y] of [[18, 34], [34, 34], [42, 34], [84, 34], [96, 34]]) c.set(x, y, 'm');

  const room = new AuthoredRoom('W6-L4:main', c.rows(), { name: 'main', world: 6, bossArena: { x0: 113, x1: 148 } });
  room.push({ t: 'gate', id: 'g1', cells: room.gateCells.get('g1') ?? [], need: 1 });
  room.push({ t: 'gate', id: 'g2', cells: room.gateCells.get('g2') ?? [], need: 2 });
  const sw = (id: string, ch: string, gate: string, sym: number, style: 'lever' | 'relay' | 'lamp'): void => { const m = room.at(ch); room.push({ t: 'switch', id, x: cx(m.tx), y: feet(m.ty), gate, style, symbol: sym }); };
  sw('W6-L4:pr', 'Q', 'g1', 0, 'lamp'); sw('W6-L4:f1', 'R', 'g2', 1, 'relay'); sw('W6-L4:f2', 'U', 'g2', 2, 'relay');
  sw('W6-L4:s1', 'V', 'spot', 0, 'lamp'); sw('W6-L4:s2', 'W', 'spot', 1, 'lamp'); sw('W6-L4:s3', 'Z', 'spot', 2, 'lamp');
  // ruchome pomosty nad przepaścią i dźwig serwisowy
  room.push({ t: 'platform', x: 50 * TILE, y: 35 * TILE, w: 3, mode: 'h', range: 8 * TILE, speed: 55, offset: 0, dwell: 1.2 });
  room.push({ t: 'platform', x: 62 * TILE, y: 35 * TILE, w: 3, mode: 'h', range: 8 * TILE, speed: 55, offset: 0, dwell: 1.2 });
  room.push({ t: 'platform', x: 90 * TILE, y: 27 * TILE, w: 3, mode: 'v', range: 8 * TILE, speed: 60, offset: 0, dwell: 1.5 });
  for (const x of [11, 36, 70, 94, 110]) room.push({ t: 'lamp', x: cx(x), y: feet(34) });
  // Krukoróg (5), Rogowróbel (3)
  for (const [x, y] of [[24, 34], [40, 34], [72, 34], [88, 34], [104, 34]]) room.push({ t: 'enemy', k: 'krukorog', x: cx(x), y: feet(y) });
  for (const [x, y] of [[22, 34], [68, 34], [100, 34]]) room.push({ t: 'enemy', k: 'rogowrobel', x: cx(x), y: feet(y) });
  room.push({ t: 'boss', k: 'krukorog', x: cx(131), y: feet(34) });
  room.autoSpecs('W6-L4', ['W6-L4-S1', 'W6-L4-S2', 'W6-L4-S3']);
  return assemble({ id: 'W6-L4', world: 6, stage: 4, boss: 'krukorog', residents: 3, hints: ['hint.switch', 'hint.ladder', 'bosshint.krukorog'], budget: { pet: 12, cans: 11, golden: 0 } }, [room]);
}
