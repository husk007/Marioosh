# Testowanie

```bash
npm run typecheck                   # tsc --noEmit
npm test                            # Vitest — cały zestaw, ≈ 1 godz. (patrz niżej)
npx vitest run tests/movement.test.ts tests/world.test.ts   # wybrane pliki (sekundy)
npm run build && npm run test:e2e   # Playwright (Chromium) — zrzuty w e2e/out/
```
Własna przeglądarka dla e2e: `PW_CHROMIUM=/ścieżka/do/chrome npm run test:e2e`; w CI: `npx playwright-core install --with-deps chromium`.

**Czas:** pełny `npm test` trwa **ok. godziny**, bo analizator przejezdności (`tests/reach.ts`) liczy graf stanów dla każdego poziomu i każdego brata (kilkanaście–kilkadziesiąt sekund na parę), a `authored-negative` powtarza to dla wariantów „bez drabiny / windy / przełącznika”. Szybka pętla: uruchamiaj pliki dotyczące tego, co zmieniasz (`movement`, `world`, `boss`, `arc`, `water`, …), a pełny zestaw puszczaj w tle (`nohup npx vitest run > /tmp/full.txt &`) i nie edytuj w tym czasie źródeł. Jeden poziom: `LVL=W8-L3 npx vitest run tests/lvl.test.ts` (wynik w `/tmp/lvl.txt`).

## Co pokrywają testy (v0.4)
| Plik | Zakres |
|---|---|
| `movement.test.ts` | kontroler w skali ludzkiej (33 testy): chód/bieg, skok 0,6–0,9 m dla obu braci, coyote i bufor, auto-krok, przeskok, chwyt i wciągnięcie, drabina, kucanie, progi upadków, grawitacja planet |
| `authored.test.ts` | **przejezdność 32 ręcznych poziomów bez trybu god, osobno Marioosh i Darioosh** (checkpointy, wyjście, przełączniki, posągi, wszystkie opakowania) + budżet PET/puszek z `levels.json` |
| `authored-negative.test.ts` | analizator nie jest zbyt łaskawy: bez drabiny / windy / przełącznika / klucza poziom przestaje być przejezdny; dodatnie warianty (np. portale i kolejność przekaźników W8-L2) |
| `arc.test.ts` | mechaniki światów 7–8: tłoki i prasy, dron-strażnik, burza, reaktor (most na czas, przekaźniki w kolejności), deszcz kamieni, sieć portali (W8-L2), obwody i uwolnieni mieszkańcy (W8-L3), trzy fazy Katoblepasa (W8-L4) |
| `boss.test.ts` | walki z bossami v0.4 (bez skoków po głowie): Rogomir, Rogopłetw Wielki, Złomotaur, Kaktogór, Ceratopsor, Krukoróg Królewski, Rogodron |
| `water.test.ts`, `lift.test.ts`, `slide.test.ts`, `boulder.test.ts`, `lamp.test.ts`, `beam.test.ts`, `crates.test.ts` | pojedyncze mechaniki: pływanie i powietrze, windy zasilane, zjazd i lód, głazy, lampy i ptaki, wiązki i lustra, skrzynki |
| `world.test.ts` | tarcza, HP i respawn, przepaść, skamienienie, co-op |
| `session.test.ts` | licznik opakowań i antyduplikacja, kaucja, punkty; zapis/odczyt/migracja/uszkodzony JSON; odblokowania |
| `hints.test.ts` | podpowiedzi do mechanik istnieją w 6 językach; poziom uczy mechaniki raz |
| `i18n.test.ts` | 6 języków: komplet kluczy, brak pustych wpisów, zgodne `{parametry}`, RTL tylko arabski |
| `enemy-flicker.test.ts` | **regresja:** żaden mob w żadnym z 32 poziomów nie zmienia kierunku w serii co kilka klatek (30 s symulacji) |
| `hero-frames.test.ts` | dobór pozy bohatera: pływanie, drabina, rampa pod górę / z góry, lądowania, podciąganie |
| `levelgen.test.ts` | generator v0.3 (legacy; sprawdza wciąż istniejący kod `levelgen*.ts`) |
| `lvl.test.ts`, `dump.test.ts` | **narzędzia**, nie testy jakości: raport analizatora jednego poziomu (`LVL=`), zrzut ASCII |
| `e2e/smoke.mjs` | build w Chromium: tytuł w 6 językach, menu → sloty → tryb → intro → mapa → gra, kilka sekund biegu, brak błędów w konsoli |

Pomocnicze: `tests/reach.ts` (analizator), `tests/bot.ts` (atrapa audio i sterowanie), `tests/helpers.ts`. Testy v0.3 (bot „god”, wieża, zbocza, sekrety, wspinaczka) są w `tests/legacy/` i **nie są uruchamiane** (`vite.config.ts` → `exclude`).

## Analizator przejezdności (`tests/reach.ts`)
BFS po stanach; krawędzie to **makra wykonywane prawdziwym `stepMovement`** (chód, bieg + skok z rozbiegu, zeskok przez platformę, drabina, pływanie 8-kierunkowe z rachunkiem powietrza — ścieżki pod wodą dłuższe niż 15 s są odrzucane) oraz przejścia abstrakcyjne: drzwi i portale (także między pokojami), windy (także zasilane), przełączniki → bramy (iteracyjnie; bramy uporządkowane `ord…`, odblokowujące drzwi `…:warpgate`, otwierane uwolnionymi posągami `free…`). Bez trybu god: kolce, wypadnięcie z poziomu i upadek ≥ 2,4 m kończą krawędź. Analizator **nie ocenia przyjemności ani balansu** — to robi człowiek.

## Czego nie testowano
Natywnych paczek (Electron, Android, iOS), urządzeń dotykowych, padów, dźwięku (słuchowo — zarówno muzyki, jak i efektów), balansu trudności i tempa wrogów (Etap D), pełnego przejścia gry przez człowieka. Testy bossów sprawdzają reguły i przebieg fazy w symulacji, nie „czucie” walki.

## Tryb testera (ręczne sprawdzenie poziomów)
- **Web:** otwórz grę z `?debug=1` (np. `http://localhost:5173/?debug=1`) albo 5× dotknij/kliknij numer wersji w prawym dolnym rogu ekranu tytułowego (powtórzenie wyłącza tryb). W konsoli: `window.__play('W8-L4')`.
- **Android:** `Marioosh-android-tester.apk` z wydania/CI ma tryb włączony od początku (build bez keystore).
- Na ekranie tytułowym pojawia się pozycja **TESTER: wybór poziomów (god mode)** → mapa z odblokowanymi wszystkimi poziomami i Prądowem. Dane idą do osobnego slotu 9 (nie ruszają zapisów gracza).
- „God mode” (domyślnie włączony): wrogowie, pociski i bossowie nie ranią; kolce i przepaście nadal zabijają. Przełącznik w menu pauzy — do oceny walk i wrogów wyłącz.
- **Do sprawdzenia ręcznie (v0.4):** czucie skoku, przeskoku i chwytu krawędzi; szarża Rogomira i okno generatorów; pływanie i oddech (Aqualis); czytelność telegrafów wrogów; kamera przy wspinaniu; sterowanie dotykowe (ruch, skok, interakcja, kucanie); sekwencje zagadek (W7-L3, W8-L2). Szukaj: miejsc bez wyjścia, niemożliwych skoków, bram bez dostępnego przełącznika, braku checkpointu, błędów kamery. Zgłaszaj id poziomu + pozycję (kafelek x).
- Diagnostyka: `npx tsx tools/ascii-level.ts W1-L1 0 120` (ASCII planszy), `node tools/shot-at.mjs` (zrzuty w wybranych miejscach, `e2e/out/at-*.png`), `node e2e/shot.mjs` (zrzuty poziomu: zmienne `LVL`, `SPOTS`, `WAIT`).
