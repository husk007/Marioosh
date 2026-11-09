/**
 * W7-L1 „Fabryka Rogatych Maszyn” (docs/design/09 §25, 11): hala fabryczna na Ferroksie (1,06 g), TRZY RÓWNOLEGŁE PASMA SERWISOWE: parter (wiersz 30), antresola (21), galeria (12).
 * Główna mechanika: MASZYNY W RYTMIE (tłoki i prasy: `arc`, czerwone światło ostrzega) + PRZEŁĄCZANIE PASM (drabiny ≤ 9 wierszy).
 *  1. (x 0–52) taśmy i tłoki na parterze ALBO antresola z Kamienorogami — oba pasma schodzą się przy drabinie x 51.
 *  2. (x 52–105) otwarta przepaść prasy (x 58–99): wyłącznie antresola (albo galeria nad nią); drony-strażnicy patrolują pod sufitem i nurkują na sygnał.
 *  3. (x 105–158) hala montażowa: antresola kończy się przy x 120 (zejście drabiną x 114) — dalej tylko parter, łańcuch: przekaźnik 1 (antresola) → brama g1 → przekaźnik 2 (kieszeń parteru) → brama g2. Punkt kontrolny (x 118).
 *  4. (x 158–209) końcowy przenośnik z prasami: albo rytm na parterze, albo odłącznik na galerii (zatrzymuje prasy), albo antresola; wyjście = Główna Rozdzielnia (X).
 */
import { AuthoredRoom, Canvas, assemble, cx, feet } from '../authored';
import type { LevelData } from '../types';

export function buildW7L1(): LevelData {
  const c = new Canvas(210, 34, '#');
  c.rect(1, 4, 208, 29, '.');                                       // hala
  const F = 30, M = 21, G = 12;                                      // powierzchnie: parter, antresola, galeria (stoi się o wiersz wyżej)
  // ---- przepaść prasy (S2)
  c.rect(58, 30, 99, 33, '.');
  // ---- taśmy (parter): kierunek na zmianę
  c.rect(6, F, 15, F, '>'); c.rect(16, F, 27, F, '<'); c.rect(28, F, 37, F, '>'); c.rect(38, F, 51, F, '<');
  c.rect(160, F, 208, F, '<');
  // ---- antresola i galeria
  c.rect(6, M, 120, M, '='); c.rect(158, M, 207, M, '=');                 // w hali montażowej (121–157) antresoli nie ma: łańcuch bram idzie parterem
  c.rect(55, G, 101, G, '='); c.rect(161, G, 180, G, '=');
  // ---- drabiny: parter ↔ antresola, antresola ↔ galeria
  c.ladder(5, M, 29); c.ladder(51, M, 29);
  c.ladder(54, G, 20); c.ladder(102, G, 20);
  c.ladder(114, M, 29);
  c.ladder(159, M, 29); c.ladder(204, M, 29);
  c.ladder(160, G, 20);
  // ---- ściany i bramy hali montażowej
  c.rect(121, 4, 121, 29, '1');                                     // g1 (parter, na całą wysokość)
  c.rect(140, 4, 140, 29, '2');                                     // g2 (parter, za kieszenią z przekaźnikiem 2)

  // ---- znaczniki
  c.set(3, 29, 'S'); c.set(118, 29, 'K'); c.set(206, 29, 'X');
  c.set(6, 0, '?'); c.set(56, 0, '?'); c.set(106, 0, '?');
  c.set(38, 20, 'T'); c.set(109, 29, 'T'); c.set(166, 29, 'T');
  c.set(110, 20, 'Q'); c.set(130, 29, 'R'); c.set(174, 11, 'U');
  // PET (14)
  for (const [x, y] of [[10, 29], [24, 29], [40, 29], [14, 20], [30, 20], [70, 20], [84, 20], [66, 11], [90, 11], [124, 29], [128, 29], [145, 29], [170, 11], [195, 29]]) c.set(x, y, 'p');
  // puszki (29)
  for (const [x, y] of [[8, 29], [14, 29], [29, 29], [33, 29], [44, 29], [10, 20], [22, 20], [35, 20], [46, 20],
    [55, 29], [57, 29], [101, 29], [103, 29], [62, 20], [74, 20], [80, 20], [96, 20], [58, 11], [72, 11], [80, 11], [98, 11],
    [112, 29], [117, 29], [126, 29], [105, 20], [150, 29], [180, 29], [190, 29], [176, 11]]) c.set(x, y, 'k');

  const room = new AuthoredRoom('W7-L1:main', c.rows(), { name: 'main', world: 7 });
  room.push({ t: 'gate', id: 'g1', cells: room.gateCells.get('g1') ?? [], need: 1 });
  room.push({ t: 'gate', id: 'g2', cells: room.gateCells.get('g2') ?? [], need: 1 });
  room.push({ t: 'gate', id: 'stp', cells: [], need: 1 });
  const sw = (id: string, ch: string, gate: string, sym: number, style: 'lever' | 'relay'): void => { const m = room.at(ch); room.push({ t: 'switch', id, x: cx(m.tx), y: feet(m.ty), gate, style, symbol: sym }); };
  sw('W7-L1:r1', 'Q', 'g1', 0, 'relay'); sw('W7-L1:r2', 'R', 'g2', 1, 'relay'); sw('W7-L1:stop', 'U', 'stp', 2, 'lever');
  // tłoki parteru S1 (zwisają spod antresoli) i prasy końcowego przenośnika (wyłączane odłącznikiem)
  const piston = (x: number, off: number, stop?: string): void => { room.push({ t: 'arc', x0: x * 32, y0: 22 * 32, x1: (x + 2) * 32, y1: 30 * 32, period: 4.4, on: 0.9, warn: 1.0, offset: off, stop, kind: 'piston' }); };
  piston(22, 0); piston(34, 1.4); piston(46, 2.8);
  piston(176, 0, 'stp'); piston(186, 1.5, 'stp'); piston(196, 3, 'stp');
  // drony-strażnicy i maszyny
  for (const x of [44, 66, 88]) room.push({ t: 'enemy', k: 'dron', x: cx(x), y: feet(x < 60 ? 16 : 16) });
  for (const x of [118, 168]) room.push({ t: 'enemy', k: 'dron', x: cx(x), y: feet(25) });
  for (const [x, y] of [[20, 20], [50, 20], [76, 20], [118, 20], [172, 20]]) room.push({ t: 'enemy', k: 'kamienirog', x: cx(x), y: feet(y) });
  for (const [x, y] of [[12, 29], [32, 29], [110, 29], [127, 29], [186, 29], [200, 29]]) room.push({ t: 'enemy', k: 'zukorog', x: cx(x), y: feet(y) });
  room.autoSpecs('W7-L1');
  return assemble({ id: 'W7-L1', world: 7, stage: 1, residents: 3, hints: ['hint.arc', 'hint.dron', 'hint.switch'], budget: { pet: 14, cans: 29, golden: 0 } }, [room]);
}
