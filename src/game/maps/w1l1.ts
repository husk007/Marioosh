/**
 * W1-L1 „Pierwszy Kontakt” (docs/design/09 §1): leśna dolina z ruiną stacji transformatorowej.
 * Ścieżka: łąka → powalony pień (przeskok) → schody na kładkę serwisową → schody w dół → rampa do półotwartej komory (PET + posąg + odłącznik)
 * → drabina na taras → brama (otwarta dwoma odłącznikami) → wyjście. Skrytka: zielone drzwi w dolinie. Roguś i Żukoróg uczą obserwacji (bez skoku na wroga).
 */
import { AuthoredRoom, Canvas, assemble, cx, feet } from '../authored';
import type { LevelData } from '../types';

export function buildW1L1(): LevelData {
  const c = new Canvas(112, 16);
  c.ground(0, 111, 12);
  // powalony pień (przeskok 0,8 m)
  c.set(15, 11, '#');
  // schody (rampy 26°) na kładkę serwisową, wiersz 9 (2,4 m nad łąką)
  const top = c.rampUp(44, 12, 3);                  // → 50
  c.rect(top, 9, 72, 9, '=');
  const down = c.rampDown(73, 9, 3);                // → 79
  void down;
  // półotwarta komora (rów 1,6 m) z rampą w dół i drabiną na taras
  c.rect(84, 12, 101, 13, '.');
  c.rampDown(84, 12, 2);                            // → 88
  c.ladder(102, 9, 13);
  c.ground(103, 111, 9);
  // brama (6 kafli) — otwierana dwoma odłącznikami
  c.rect(107, 3, 107, 8, '1');
  // znaczniki
  c.set(3, 11, 'S');
  for (const x of [6, 8, 10]) c.set(x, 10, 'p');
  c.set(15, 10, 'p');
  for (const x of [18, 19, 20]) c.set(x, 11, 'k');
  c.set(26, 11, 'r'); c.set(31, 11, 'r');
  c.set(34, 11, 'D'); c.set(40, 11, 'T');
  for (const x of [52, 56, 58]) c.set(x, 8, 'p');
  c.set(53, 8, 'W'); c.set(64, 8, 'z'); c.set(70, 8, 'p');
  for (const x of [56, 60, 64]) c.set(x, 11, 'k');
  c.set(68, 11, 'r');
  for (const x of [80, 82]) c.set(x, 11, 'k');
  for (const x of [89, 91, 99]) c.set(x, 12, 'p');
  c.set(93, 13, 'V'); c.set(95, 13, 'r'); c.set(97, 13, 'T'); c.set(94, 12, 'p');
  for (const x of [1, 11, 31, 98, 105]) c.set(x, 0, '?');
  c.set(104, 8, 'K'); c.set(110, 8, 'X'); c.set(105, 7, 'p');

  const valley = new AuthoredRoom('W1-L1:valley', c.rows(), { name: 'main', world: 1 });
  const b = new Canvas(16, 10);
  b.rect(0, 0, 15, 2, '#'); b.ground(0, 15, 8); b.rect(0, 3, 0, 7, '#'); b.rect(15, 3, 15, 7, '#');
  b.set(3, 7, 'S'); b.set(2, 7, 'D');
  for (const x of [5, 6, 7, 8]) b.set(x, 6, 'k');
  for (const x of [10, 11, 12, 9, 4]) b.set(x, 6, 'p');
  b.set(13, 7, 'T');
  const bonus = new AuthoredRoom('W1-L1:bonus', b.rows(), { name: 'bonus', world: 1 });

  const d = valley.at('D'), bd = bonus.at('D');
  valley.door('W1-L1:green', d, 'green', { room: 1, x: cx(3), y: feet(7) });
  bonus.door('W1-L1:greenb', bd, 'green', { room: 0, x: cx(d.tx) + 40, y: feet(d.ty) });
  const gate = valley.gateCells.get('g1') ?? [];
  const W = valley.at('W'), V = valley.at('V');
  valley.push({ t: 'gate', id: 'g1', cells: gate, need: 2 });
  valley.push({ t: 'switch', id: 'W1-L1:sw1', x: cx(W.tx), y: feet(W.ty), gate: 'g1', style: 'lever', symbol: 0 });
  valley.push({ t: 'switch', id: 'W1-L1:sw2', x: cx(V.tx), y: feet(V.ty), gate: 'g1', style: 'lever', symbol: 1 });
  valley.autoSpecs('W1-L1', ['W1-L1-S1', 'W1-L1-S2']);
  bonus.autoSpecs('W1-L1:b', ['W1-L1-S3']);
  return assemble({ id: 'W1-L1', world: 1, stage: 1, residents: 3, hints: ['hint.move', 'hint.vault', 'hint.door', 'hint.ladder', 'hint.gate2'], budget: { pet: 18, cans: 12, golden: 0 } }, [valley, bonus]);
}
