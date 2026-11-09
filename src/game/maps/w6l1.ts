/**
 * W6-L1 „Nocne Dachy” (docs/design/09 §21, 11): wieczna noc na Vesperze (0,86 g). Główna mechanika: ŚWIATŁO jako bezpieczna strefa przed nurkującymi ptakami
 * (Ćmoróg, Rogowróbel, Krukoróg nie nurkują na kogoś stojącego w poświacie lampy ani na ulicy pod zapaloną latarnią — promień 120 px / 3,75 kafla).
 * Architektura: ULICE rozdzielone czterema kamienicami. Każda kamienica to trasa DOLNA (przez parter i mieszkania na piętrze — ukryte przed ptakami) albo GÓRNA
 * (zewnętrzne schody pożarowe = drabiny z balkonami → dach → pomost nad ulicą; dachy z kominami; poddasze z gniazdem).
 *  Ulica 0 (start): latarnie wejściowe, przemykanie między światłami. Kamienica 1: mieszkania (drabiny wewnętrzne). Ulica 1: długa ciemna ulica — DWIE LATARNIE DO ZAPALENIA.
 *  Kamienica 2: hol z punktem kontrolnym. Ulica 2: ciemny odcinek z zadaszeniami (łuki). Kamienica 3: hol, poddasze z tajnym gniazdem. Ulica 3: wielka latarnia i wyjście.
 */
import { AuthoredRoom, Canvas, assemble, cx, feet } from '../authored';
import type { LevelData } from '../types';

export function buildW6L1(): LevelData {
  const c = new Canvas(195, 34);
  c.rect(0, 0, 194, 1, '#'); c.rect(0, 2, 0, 33, '#'); c.rect(194, 2, 194, 33, '#');
  c.ground(1, 193, 28);                                           // ulica (powierzchnia: wiersz 28, stoi się w 27)

  // ---- kamienice: bryła od dachu do ulicy; parter (wiersze 24–27), piętro (17–21), stropy grubości 2
  const block = (x0: number, x1: number, roof: number, ladders: { ground: number[]; deck: number[] }): void => {
    c.rect(x0, roof, x1, 27, '#');
    c.rect(x0, 24, x1, 27, '.');                                  // parter przelotowy (otwarte końce)
    c.rect(x0 + 1, 17, x1 - 1, 21, '.');                          // mieszkania na piętrze (zamknięte ściany)
    for (const x of ladders.ground) c.ladder(x, 22, 27);          // parter ↔ piętro (górny kafel zlicowany z podłogą piętra)
    void ladders.deck;
  };
  // schody pożarowe dwustopniowe po LEWEJ ścianie (xw = pierwsza kolumna ściany): ulica → balkon (wiersz r1) → dach
  const escapeLeft = (xw: number, r1: number, roof: number): void => {
    c.ladder(xw - 4, r1, 27); c.rect(xw - 3, r1, xw - 2, r1, '=');             // drabina 1 + balkon
    c.ladder(xw - 1, roof, r1 - 1); c.set(xw - 1, r1, '=');                    // drabina 2 (szczyt zlicowany z dachem)
    c.rect(xw - 3, r1, xw - 2, r1, '=');
  };
  // po PRAWEJ ścianie (xw = ostatnia kolumna ściany): zejście z dachu na ulicę
  const escapeRight = (xw: number, r1: number, roof: number): void => {
    c.ladder(xw + 4, r1, 27); c.rect(xw + 2, r1, xw + 3, r1, '=');
    c.ladder(xw + 1, roof, r1 - 1); c.set(xw + 1, r1, '=');
    c.rect(xw + 2, r1, xw + 3, r1, '=');
  };

  // Kamienica 1 (45–76): dach 15
  block(45, 76, 15, { ground: [58, 71], deck: [] });
  c.rect(61, 23, 61, 27, '#');                                    // przegroda parteru
  c.rect(52, 20, 53, 21, '#'); c.rect(64, 20, 65, 21, '#');       // meble 2 wiersze (przeskok)
  escapeLeft(45, 22, 15);
  c.rect(55, 13, 56, 14, '#'); c.rect(68, 13, 69, 14, '#');       // kominy 2 wiersze
  // pomost nad ulicą 1 (wiersz 15) do dachu kamienicy 2 (wiersz 13)
  c.rect(77, 15, 99, 15, '='); c.ladder(100, 13, 14);

  // Kamienica 2 (101–130): dach 13
  block(101, 130, 13, { ground: [105, 126], deck: [] });
  c.rect(113, 27, 114, 27, '#'); c.rect(121, 27, 122, 27, '#');   // głazy w holu
  c.rect(110, 20, 111, 21, '#'); c.rect(119, 20, 120, 21, '#');
  c.rect(112, 11, 113, 12, '#'); c.rect(124, 11, 125, 12, '#');   // kominy
  // pomost nad ulicą 2 (wiersz 14) do dachu kamienicy 3 (wiersz 14)
  c.rect(131, 14, 150, 14, '=');

  // Ulica 2: zadaszenia (łuki jak nawisy) — płyta wiersze 20–21, końce 22–23, pod spodem 4 wiersze
  const arch = (x0: number, w: number): void => { c.rect(x0, 20, x0 + w - 1, 21, '#'); c.rect(x0, 22, x0, 23, '#'); c.rect(x0 + w - 1, 22, x0 + w - 1, 23, '#'); };
  arch(132, 8); arch(143, 8);

  // Kamienica 3 (151–182): dach 14, poddasze na dachu
  block(151, 182, 14, { ground: [157, 176], deck: [] });
  c.rect(163, 27, 164, 27, '#'); c.rect(172, 27, 173, 27, '#');
  c.rect(165, 20, 166, 21, '#'); c.rect(170, 20, 171, 21, '#');
  c.rect(160, 7, 171, 13, '#'); c.rect(162, 8, 169, 13, '.'); c.rect(160, 11, 161, 13, '.'); c.rect(170, 11, 171, 13, '.');   // poddasze (przelotowe)
  c.rect(166, 12, 167, 13, '#'); c.rect(163, 11, 165, 11, '=');   // stopień + półka do gniazda
  escapeRight(182, 22, 14);

  // ---- znaczniki
  c.set(3, 27, 'S'); c.set(107, 27, 'K'); c.set(191, 27, 'X');
  c.set(8, 0, '?'); c.set(86, 0, '?');
  c.set(35, 27, 'T'); c.set(99, 27, 'T'); c.set(154, 27, 'T');
  // PET (14)
  for (const [x, y] of [[12, 27], [29, 27], [50, 27], [66, 27], [54, 21], [74, 21], [60, 14], [88, 14], [107, 21], [116, 27], [128, 12], [145, 13], [164, 13], [164, 10]]) c.set(x, y, 'p');
  // puszki (22)
  for (const [x, y] of [[16, 27], [22, 27], [26, 27], [48, 27], [53, 27], [56, 27], [70, 27], [62, 21], [68, 21], [48, 21],
    [82, 27], [91, 27], [97, 27], [108, 27], [118, 27], [104, 21], [124, 21], [138, 27], [160, 27], [178, 27], [185, 27], [162, 13]]) c.set(x, y, 'k');
  // Ćmorogi (8) jako znaczniki — ulice i dach
  for (const [x, y] of [[17, 27], [25, 27], [84, 27], [90, 27], [96, 27], [140, 27], [142, 27], [175, 13]]) c.set(x, y, 'm');

  const room = new AuthoredRoom('W6-L1:main', c.rows(), { name: 'main', world: 6 });
  // światło: lampy stałe i dwie latarnie do zapalenia (ulica 1)
  for (const [x, y] of [[8, 27], [33, 27], [78, 27], [99, 27], [190, 27], [186, 27], [50, 14], [73, 14], [84, 14], [94, 14], [105, 12], [127, 12], [155, 13], [178, 13]]) room.push({ t: 'lamp', x: cx(x), y: feet(y) });
  for (const x of [87, 93]) room.push({ t: 'lantern', x: cx(x), y: feet(27), id: `W6-L1:lt${x}` });
  // Rogowróbel (7) i Krukoróg (2)
  for (const [x, y] of [[21, 27], [82, 27], [92, 27], [60, 14], [118, 12], [141, 27], [176, 13]]) room.push({ t: 'enemy', k: 'rogowrobel', x: cx(x), y: feet(y) });
  for (const [x, y] of [[186, 27], [154, 13]]) room.push({ t: 'enemy', k: 'krukorog', x: cx(x), y: feet(y) });
  room.autoSpecs('W6-L1');
  return assemble({ id: 'W6-L1', world: 6, stage: 1, residents: 3, hints: ['hint.lamp', 'hint.lantern'], budget: { pet: 14, cans: 22, golden: 0 } }, [room]);
}
