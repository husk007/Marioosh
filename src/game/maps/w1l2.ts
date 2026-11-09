/**
 * W1-L2 „Podziemna Kablownia” (docs/design/09 §2): dwupoziomowy tunel techniczny.
 * Trasa: tunel dolny → (drabina 1) galeria górna z przekaźnikiem A → schody na pomost serwisowy z przekaźnikiem B → brama otwarta
 * dwoma przekaźnikami → kieszeń z windą technicznej → górny chodnik → drabina 2 → magazyn dolny (puszki, pomost, wyjście).
 * Skrytki: dwa pełnowymiarowe terminale-portale za drzwiami (dolny przy starcie, górny w połowie chodnika).
 * Wysokości: tunel dolny 5,2 m·0,8… kondygnacje 6 kafli (4,8 m); winda wjeżdża przez przesłony „=” w stropie.
 */
import { AuthoredRoom, Canvas, assemble, cx, feet } from '../authored';
import type { LevelData } from '../types';
import { TILE } from '../constants';

function secret(id: string, name: string, statue = false): AuthoredRoom {
  const b = new Canvas(16, 10);
  b.rect(0, 0, 15, 2, '#'); b.ground(0, 15, 8); b.rect(0, 3, 0, 7, '#'); b.rect(15, 3, 15, 7, '#');
  b.set(3, 7, 'S'); b.set(2, 7, 'D');
  for (const x of [5, 6, 7, 8]) b.set(x, 7, 'k');
  for (const x of [9, 10, 11, 12]) b.set(x, 7, 'p');
  if (statue) b.set(13, 7, 'T');
  return new AuthoredRoom(id, b.rows(), { name, world: 1 });
}

export function buildW1L2(): LevelData {
  const c = new Canvas(120, 20);
  c.rect(0, 0, 119, 2, '#');                 // strop
  c.ground(0, 119, 17);                      // podłoga tunelu dolnego (powierzchnia: wiersz 17)
  c.rect(0, 9, 119, 10, '#');                // podłoga galerii górnej (powierzchnia: wiersz 9)
  c.rect(0, 3, 0, 16, '#'); c.rect(119, 3, 119, 16, '#');
  c.ladder(26, 9, 16);                       // szyb 1: tunel ↔ galeria zachodnia
  c.ladder(100, 9, 16);                      // szyb 2: chodnik ↔ magazyn
  c.rect(50, 3, 51, 8, '#');                 // ściana oddzielająca galerię zachodnią od chodnika
  // pomost serwisowy: schody 26° o 3 kafle w górę i półka
  const top = c.rampUp(34, 17, 3);           // → 40
  c.rect(top, 14, 45, 14, '=');
  c.rect(46, 11, 46, 16, '1');               // brama (dwa przekaźniki)
  // winda techniczna: słup przy kolumnach 55–57, przesłony w stropie górnej podłogi
  c.rect(55, 9, 57, 9, '=');                 // przesłona (winda przejeżdża od dołu)
  c.rect(55, 10, 57, 10, '.');
  c.rect(60, 11, 63, 16, '#');               // rumowisko — dolny tunel zamknięty, dalej tylko górą
  // magazyn: skrzynie (próg 0,8 m) i pomost serwisowy 2
  c.set(70, 16, '#'); c.set(71, 16, '#'); c.set(82, 16, '#');
  const top2 = c.rampUp(88, 17, 3);          // → 94
  c.rect(top2, 14, 99, 14, '=');

  // znaczniki
  c.set(3, 16, 'S'); c.set(14, 16, 'D'); c.set(72, 8, 'D');
  for (const x of [12, 24, 38]) c.set(x, 0, '?');
  for (const x of [6, 8, 10]) c.set(x, 16, 'p');
  for (const x of [18, 19, 20]) c.set(x, 16, 'k');
  c.set(22, 16, 'T'); c.set(32, 16, 'r');
  for (const x of [30, 31]) c.set(x, 16, 'k');
  c.set(6, 8, 'W');                                   // przekaźnik A (galeria zachodnia)
  for (const x of [8, 10, 12, 14]) c.set(x, 8, 'p');
  for (const x of [20, 22]) c.set(x, 8, 'k');
  c.set(44, 13, 'V');                                 // przekaźnik B (pomost serwisowy)
  for (const x of [41, 42, 43]) c.set(x, 13, 'p');
  c.set(48, 16, 'K'); c.set(50, 16, 'p');
  for (const x of [49, 51, 52]) c.set(x, 16, 'k');
  c.set(53, 16, 'T');
  c.set(60, 8, 'p'); c.set(62, 8, 'p'); c.set(78, 8, 'p'); c.set(66, 8, 'z'); c.set(84, 8, 'r');
  for (const x of [90, 92]) c.set(x, 8, 'k');
  c.set(76, 16, 'z'); c.set(80, 16, 'T'); c.set(90, 16, 'r');
  for (const x of [96, 97]) c.set(x, 13, 'p');
  for (const x of [108, 110]) c.set(x, 16, 'k');
  c.set(104, 16, 'K'); c.set(114, 16, 'X');

  const main = new AuthoredRoom('W1-L2:main', c.rows(), { name: 'main', world: 1 });
  const sa = secret('W1-L2:a', 'secretA'), sb = secret('W1-L2:b', 'secretB');

  const d0 = main.at('D', 0), d1 = main.at('D', 1);
  const back = (m: { tx: number; ty: number }) => ({ room: 0, x: cx(m.tx) + 40, y: feet(m.ty) });
  main.door('W1-L2:ta', d0, 'blue', { room: 1, x: cx(3), y: feet(7) });
  main.door('W1-L2:tb', d1, 'purple', { room: 2, x: cx(3), y: feet(7) });
  sa.door('W1-L2:ta2', sa.at('D'), 'blue', back(d0));
  sb.door('W1-L2:tb2', sb.at('D'), 'purple', back(d1));

  const W = main.at('W'), V = main.at('V');
  main.push({ t: 'gate', id: 'g1', cells: main.gateCells.get('g1') ?? [], need: 2 });
  main.push({ t: 'switch', id: 'W1-L2:ra', x: cx(W.tx), y: feet(W.ty), gate: 'g1', style: 'lever', symbol: 0 });
  main.push({ t: 'switch', id: 'W1-L2:rb', x: cx(V.tx), y: feet(V.ty), gate: 'g1', style: 'lever', symbol: 1 });
  // winda: góra (y=9·32) ↔ dół (powierzchnia podłogi tunelu), postój 1,6 s na końcach
  main.push({ t: 'platform', x: 55 * TILE, y: 9 * TILE, w: 3, mode: 'v', range: 8 * TILE, speed: 70, offset: 0, dwell: 1.6 });

  main.autoSpecs('W1-L2', ['W1-L2-S1', 'W1-L2-S2', 'W1-L2-S3']);
  sa.autoSpecs('W1-L2:a'); sb.autoSpecs('W1-L2:b');
  return assemble({ id: 'W1-L2', world: 1, stage: 2, residents: 3, hints: ['hint.door', 'hint.ladder', 'hint.gate2'], budget: { pet: 24, cans: 22, golden: 0 } }, [main, sa, sb]);
}
