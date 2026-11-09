/**
 * W8-L2 „Wielki Przewód” (docs/design/09 §30, 11): logiczna SIEĆ TELEPORTACJI (jak mapa metra) — inna mechanika niż wcześniejsze światy.
 * Pokoje (indeksy):
 *  0 korytarz główny (x 0–209): hala wejściowa (x 1–58) → WĘZEŁ SIECI (x 59–117: trzy portale ze znakami błyskawica/księżyc/liść, tablica sieci, punkt kontrolny) →
 *     grodź przeciwpożarowa (x 118–121, pełna wysokość, nie da się jej ominąć) → hala wyjściowa (x 122–208, wyjście X).
 *  1 stacja bezpieczna: dokąd cofa BŁĘDNY portal (żadnego labiryntu — jedne drzwi z powrotem do węzła).
 *  2 stacja pośrednia (księżyc): trzy wyjścia — powrót, liść (→ stacja bezpieczna), gwiazda na galerii (→ rozdzielnia).
 *  3 ślepa stacja (liść): zamknięta wnęka z zapasami, jedne drzwi z powrotem.
 *  4 rozdzielnia: cztery przekaźniki ustawione NIE po kolei (liść, gwiazda, błyskawica, księżyc) — włączaj w kolejności z tablicy: błyskawica → księżyc → liść → gwiazda.
 *     Pomyłka zeruje wszystkie. Komplet odblokowuje zamknięte drzwi do hali wyjściowej (brama „ord:warpgate”).
 */
import { AuthoredRoom, Canvas, assemble, cx, feet } from '../authored';
import type { LevelData, Spec } from '../types';

type DoorColor = 'blue' | 'green' | 'yellow' | 'red' | 'purple';

function station(w: number, h: number, floor: number): Canvas {
  const c = new Canvas(w, h, '#');
  c.rect(1, 3, w - 2, floor - 1, '.');                         // wnętrze: wiersze 3…floor-1 (stoi się w wierszu floor-1)
  return c;
}

export function buildW8L2(): LevelData {
  // ------------------------------------------------------------------ pokój 0: korytarz główny
  const c = new Canvas(210, 36, '#');
  c.rect(1, 17, 117, 28, '.');                                 // hala wejściowa + węzeł (powierzchnia podłogi: wiersz 29)
  c.rect(62, 11, 114, 16, '.');                                // kopuła węzła
  c.rect(122, 17, 208, 28, '.');                               // hala wyjściowa
  for (const x of [10, 32, 46, 134, 150, 168, 186]) c.rect(x, 27, x + 1, 28, '#');   // głazy 2 wiersze (do przeskoku)
  c.rect(15, 22, 27, 22, '='); c.ladder(14, 22, 28);           // galeria 1 (hala wejściowa)
  c.rect(141, 22, 150, 22, '='); c.ladder(140, 22, 28);        // galeria 2 (hala wyjściowa)
  c.rect(177, 22, 186, 22, '='); c.ladder(176, 22, 28);        // galeria 3

  c.set(3, 28, 'S'); c.set(106, 28, 'K'); c.set(128, 28, 'K'); c.set(205, 28, 'X');
  c.set(6, 0, '?'); c.set(66, 0, '?');
  c.set(38, 28, 'T'); c.set(112, 28, 'T'); c.set(166, 28, 'T');
  // PET (8)
  for (const [x, y] of [[12, 28], [34, 28], [44, 28], [66, 28], [104, 28], [140, 28], [160, 28], [190, 28]]) c.set(x, y, 'p');
  // puszki (10)
  for (const [x, y] of [[8, 28], [18, 21], [22, 21], [40, 28], [52, 28], [62, 28], [116, 28], [130, 28], [144, 21], [196, 28]]) c.set(x, y, 'k');

  const room = new AuthoredRoom('W8-L2:main', c.rows(), { name: 'main', world: 8 });
  // tablica sieci (znak księżyca) i portale węzła
  room.push({ t: 'sign', x: cx(74), y: feet(28), symbol: 1 });
  const door = (r: AuthoredRoom, id: string, x: number, row: number, color: DoorColor, sym: number | undefined, dest: { room: number; x: number; y: number }, locked = false): void => {
    const s: Spec = { t: 'cable', id, color, x: cx(x), y: feet(row), face: 'door', dest, ...(locked ? { locked: true } : {}), ...(sym !== undefined ? { symbol: sym } : {}) };
    r.push(s);
  };
  door(room, 'W8-L2:p0', 82, 28, 'blue', 0, { room: 1, x: cx(7), y: feet(11) });      // błyskawica → stacja bezpieczna (błędny)
  door(room, 'W8-L2:p1', 90, 28, 'green', 1, { room: 2, x: cx(7), y: feet(18) });     // księżyc → stacja pośrednia (właściwy)
  door(room, 'W8-L2:p2', 98, 28, 'yellow', 2, { room: 3, x: cx(7), y: feet(11) });    // liść → ślepa stacja (błędny)
  for (const x of [8, 60, 100, 120, 126, 200]) room.push({ t: 'lamp', x: cx(x), y: feet(28) });
  // Kamienioróg 5, Gekoróg 4, Bazalisk 4
  for (const x of [18, 42, 70, 132, 176]) room.push({ t: 'enemy', k: 'kamienirog', x: cx(x), y: feet(28) });
  for (const x of [30, 56, 150, 190]) room.push({ t: 'enemy', k: 'gekorog', x: cx(x), y: feet(28) });
  for (const x of [52, 140, 168, 194]) room.push({ t: 'enemy', k: 'bazalisk', x: cx(x), y: feet(28) });
  room.autoSpecs('W8-L2');

  // ------------------------------------------------------------------ pokój 1: stacja bezpieczna
  const c1 = station(22, 13, 12);
  for (const [x, y] of [[10, 11]]) c1.set(x, y, 'p');
  c1.set(14, 11, 'k');
  const safe = new AuthoredRoom('W8-L2:safe', c1.rows(), { name: 'safe', world: 8 });
  door(safe, 'W8-L2:s0', 3, 11, 'blue', 0, { room: 0, x: cx(76), y: feet(28) });
  safe.push({ t: 'lamp', x: cx(11), y: feet(11) });
  safe.autoSpecs('W8-L2:safe');

  // ------------------------------------------------------------------ pokój 2: stacja pośrednia (księżyc)
  const c2 = station(44, 20, 19);
  c2.rect(29, 13, 40, 13, '='); c2.ladder(28, 13, 18);         // galeria z portalem gwiazdy
  c2.set(12, 18, 'p'); c2.set(33, 12, 'p'); c2.set(18, 18, 'k'); c2.set(36, 12, 'k');
  const mid = new AuthoredRoom('W8-L2:mid', c2.rows(), { name: 'mid', world: 8 });
  door(mid, 'W8-L2:m0', 3, 18, 'green', 1, { room: 0, x: cx(94), y: feet(28) });        // powrót do węzła
  door(mid, 'W8-L2:m1', 22, 18, 'yellow', 2, { room: 1, x: cx(7), y: feet(11) });       // liść → stacja bezpieczna (błędny)
  door(mid, 'W8-L2:m2', 38, 12, 'red', 3, { room: 4, x: cx(5), y: feet(11) });          // gwiazda → rozdzielnia (właściwy)
  mid.push({ t: 'sign', x: cx(11), y: feet(18), symbol: 3 });                          // tablica sieci: znak gwiazdy
  mid.push({ t: 'hint', x: 6 * 32, y: 0, w: 32 * 8, key: 'hint.station' });
  for (const x of [8, 30]) mid.push({ t: 'lamp', x: cx(x), y: feet(18) });
  for (const x of [26, 36]) mid.push({ t: 'enemy', k: 'kamienirog', x: cx(x), y: feet(18) });
  mid.push({ t: 'enemy', k: 'gekorog', x: cx(32), y: feet(18) });
  mid.autoSpecs('W8-L2:mid');

  // ------------------------------------------------------------------ pokój 3: ślepa stacja (liść)
  const c3 = station(26, 13, 12);
  for (const x of [9, 13, 17]) c3.set(x, 11, 'p');
  for (const x of [11, 15]) c3.set(x, 11, 'k');
  const blind = new AuthoredRoom('W8-L2:blind', c3.rows(), { name: 'blind', world: 8 });
  door(blind, 'W8-L2:b0', 3, 11, 'yellow', 2, { room: 0, x: cx(104), y: feet(28) });
  blind.push({ t: 'lamp', x: cx(12), y: feet(11) });
  for (const x of [20, 23]) blind.push({ t: 'enemy', k: 'gekorog', x: cx(x), y: feet(11) });
  blind.autoSpecs('W8-L2:blind');

  // ------------------------------------------------------------------ pokój 4: rozdzielnia
  const c4 = station(40, 13, 12);
  c4.set(6, 11, 'Q'); c4.set(11, 11, 'R'); c4.set(27, 11, 'U'); c4.set(32, 11, 'V');
  const hub = new AuthoredRoom('W8-L2:hub', c4.rows(), { name: 'hub', world: 8 });
  hub.push({ t: 'gate', id: 'ord:warpgate', cells: [], need: 4 });
  // przekaźniki: znak = miejsce w kolejności (0 błyskawica, 1 księżyc, 2 liść, 3 gwiazda); rozmieszczone NIE po kolei
  const rel: [string, string, number][] = [['Q', 'leaf', 2], ['R', 'star', 3], ['U', 'bolt', 0], ['V', 'moon', 1]];
  for (const [ch, nm, sym] of rel) { const m = hub.at(ch); hub.push({ t: 'switch', id: `W8-L2:r-${nm}`, x: cx(m.tx), y: feet(m.ty), gate: 'ord:warpgate', style: 'relay', symbol: sym }); hub.push({ t: 'sign', x: cx(m.tx + 2), y: feet(m.ty), symbol: sym }); }
  [0, 1, 2, 3].forEach((s, i) => hub.push({ t: 'sign', x: cx(17 + 2 * i), y: feet(11), symbol: s }));   // tablica sieci: kolejność
  door(hub, 'W8-L2:h0', 3, 11, 'red', 3, { room: 2, x: cx(36), y: feet(12) });                     // powrót na galerię stacji pośredniej
  door(hub, 'W8-L2:out', 37, 11, 'purple', undefined, { room: 0, x: cx(124), y: feet(28) }, true);   // zamknięte do czasu kompletu przekaźników
  hub.push({ t: 'hint', x: 4 * 32, y: 0, w: 32 * 8, key: 'hint.relays' });
  for (const x of [15, 24]) hub.push({ t: 'lamp', x: cx(x), y: feet(11) });

  return assemble({ id: 'W8-L2', world: 8, stage: 2, residents: 3, hints: ['hint.sequence', 'hint.network'], budget: { pet: 14, cans: 15, golden: 0 } }, [room, safe, mid, blind, hub]);
}
