/**
 * W3-L2 „Kaktusowy Kanion” (docs/design/09 §10, 11): ZYGZAK PIĘTER — cztery tarasy skalne jeden nad drugim, połączone drewnianym rusztowaniem (drabiny ≤ 10 wierszy) na przemian po wschodniej i zachodniej stronie.
 *  Taras 1 (dół): łagodne serpentyny 26°, Kakturożce, szyb z drabiną do sekretnej oazy pod ziemią (10 PET + puszki).
 *  Taras 2: kolczasta brama G1 zamknięta dźwignią zza osłony skalnej, na patrolu dwa Kakturożce.  Taras 3: Rogoskoczki skaczące po półce, bez bram.
 *  Taras 4: druga kolczasta brama G2 i wyjście; skała obserwacyjna z drabiną (puszki). Płyty tarasów są cienkie, więc nad każdym tarasem jest wolna przestrzeń ≥ 4 wiersze.
 * Brak ramp do wielkich skoków: między tarasami tylko drabiny, a upadek na niższy taras oznacza powrót do poprzedniego odcinka trasy.
 */
import { AuthoredRoom, Canvas, assemble, cx, feet } from '../authored';
import type { LevelData } from '../types';

export function buildW3L2(): LevelData {
  const c = new Canvas(73, 52);
  c.rect(0, 0, 72, 2, '#'); c.rect(0, 3, 0, 51, '#'); c.rect(72, 3, 72, 51, '#');
  // taras 1: serpentyny i szyb do oazy
  c.profile(1, [[12, 44], [10, 42], [10, 44], [10, 41], [8, 43]]); c.ground(67, 70, 43);
  c.rect(3, 47, 22, 50, '.'); c.ladder(10, 44, 50);
  // taras 2, 3, 4: cienkie płyty i drabiny na przemian po stronach
  c.rect(19, 34, 66, 36, '#'); c.ladder(67, 34, 42);
  c.rect(20, 24, 67, 26, '#'); c.ladder(19, 24, 33);
  c.rect(20, 14, 66, 16, '#'); c.ladder(67, 14, 23);
  // bramy kolczaste i osłony
  c.rect(40, 27, 40, 29, '#'); c.rect(40, 30, 40, 33, '1');
  c.rect(35, 3, 35, 9, '#'); c.rect(35, 10, 35, 13, '2');
  c.rect(52, 32, 53, 33, '#'); c.rect(56, 12, 57, 13, '#');
  // skała obserwacyjna
  c.rect(44, 6, 47, 9, '#'); c.ladder(43, 6, 13);       // nad szlakiem (4 wiersze przejścia pod spodem)

  c.set(3, 43, 'S'); c.set(35, 43, 'K'); c.set(63, 33, 'K'); c.set(24, 23, 'K'); c.set(64, 13, 'K'); c.set(22, 13, 'X');
  c.set(8, 0, '?'); c.set(30, 0, '?'); c.set(58, 0, '?');
  for (const [x, y] of [[4, 50], [6, 50], [8, 50], [12, 50], [14, 50], [16, 50], [18, 50], [20, 50], [21, 50], [22, 50],
    [6, 43], [20, 41], [34, 43], [37, 43], [50, 40], [62, 42], [62, 33], [50, 33], [46, 33], [30, 33], [24, 33],
    [26, 23], [30, 23], [38, 23], [46, 23], [54, 23], [60, 23], [66, 23], [64, 13], [50, 13], [30, 13], [26, 13], [24, 13], [45, 5]]) c.set(x, y, 'p');
  for (const [x, y] of [[44, 5], [46, 5], [47, 5], [13, 50], [15, 50], [19, 50], [22, 41], [32, 43], [48, 33], [42, 23]]) c.set(x, y, 'k');
  c.set(26, 41, 'T'); c.set(36, 33, 'T'); c.set(33, 23, 'T');
  c.set(57, 33, 'Q'); c.set(60, 13, 'R');
  for (const [x, y] of [[9, 43], [44, 23], [52, 13]]) c.set(x, y, 'r');

  const room = new AuthoredRoom('W3-L2:main', c.rows(), { name: 'main', world: 3 });
  room.push({ t: 'gate', id: 'g1', cells: room.gateCells.get('g1') ?? [], need: 1 });
  room.push({ t: 'gate', id: 'g2', cells: room.gateCells.get('g2') ?? [], need: 1 });
  const sw = (id: string, ch: string, gate: string, sym: number): void => { const m = room.at(ch); room.push({ t: 'switch', id, x: cx(m.tx), y: feet(m.ty), gate, style: 'lever', symbol: sym }); };
  sw('W3-L2:l1', 'Q', 'g1', 0); sw('W3-L2:l2', 'R', 'g2', 1);
  for (const [x, y] of [[39, 43], [63, 42], [50, 33], [30, 33], [55, 13], [40, 13], [28, 13]]) room.push({ t: 'enemy', k: 'kakturozec', x: cx(x), y: feet(y) });
  for (const [x, y] of [[28, 23], [40, 23], [52, 23], [62, 23]]) room.push({ t: 'enemy', k: 'rogoskoczek', x: cx(x), y: feet(y) });
  room.autoSpecs('W3-L2', ['W3-L2-S1', 'W3-L2-S2', 'W3-L2-S3']);
  return assemble({ id: 'W3-L2', world: 3, stage: 2, residents: 3, hints: ['hint.ladder', 'hint.switch', 'hint.gate2'], budget: { pet: 34, cans: 10, golden: 0 } }, [room]);
}
