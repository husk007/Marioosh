# Testowanie

```bash
npm run typecheck      # tsc --noEmit
npm test               # Vitest (jednostkowe + generator + bot osiągalności) ≈ 2 s
npm run build && npm run test:e2e   # Playwright (Chromium) — zrzuty w e2e/out/
```
Własna przeglądarka dla e2e: `PW_CHROMIUM=/ścieżka/do/chrome npm run test:e2e`; w CI: `npx playwright-core install --with-deps chromium`.

## v0.4 (gałąź `v0.4-human-scale`)
Testy v0.3 (bot „god”, generator, wieża, zbocza, sekrety) są w `tests/legacy/` i **nie są uruchamiane** (`vite.config.ts` → `exclude`). Aktualne: `movement` (kontroler w skali ludzkiej), `authored` (przejezdność ręcznych poziomów **bez trybu god**, osobno M i D, plus budżet opakowań), `authored-negative` (analizator odrzuca niedozwolone trasy), `boss` (walka z Rogomirem), `world`, `session`, `hints`, `i18n`. Analizator: `tests/reach.ts` (BFS po stanach z makrami wykonywanymi przez prawdziwy `stepMovement`, ok. 30 s na poziom i brata). Tabela poniżej opisuje v0.3.

## Co pokrywają testy
| Plik | Zakres |
|---|---|
| `tests/movement.test.ts` | kontroler ruchu: skok ≥ 2 i 4 kafelki (kryterium M1) dla obu braci, coyote, bufor skoku, przepaść 8 kafli w biegu, kolizje |
| `tests/levelgen.test.ts` | 32 poziomy × kontrole: wymiary, spawn, wyjście/arena, budżety (PET/puszki/mieszkańcy), brak przepaści > 6 kafli (z platformami), unikalne id, przewody mają cel w istniejącym pokoju |
| `tests/session.test.ts` | licznik opakowań 99/100/101, antyduplikacja, złota puszka, kaucja, limit żyć; zapis/odczyt/migracja/uszkodzony JSON; odblokowania i rekordy |
| `tests/world.test.ts` | tarcza i nietykalność, śmierć/respawn, stomp, skamienienie (miernik, opóźnienie, zanik, śmierć/posąg), co-op |
| `tests/i18n.test.ts` | 6 języków: komplet kluczy, brak pustych, zgodne `{parametry}`, RTL tylko arabski, właściwe pismo |
| `tests/reach.test.ts` | **bot osiągalności**: osobno jako Marioosh i Darioosh przechodzi poziom lub dociera do areny bossa (tryb „god”: wrogowie nie ranią; kolce i przepaście tak) — 31 poziomów × 2 braci |
| `tests/secrets.test.ts` | sekrety zależne od brata: trasa górna (obaj), szyb (tylko Darioosh), kapsuła (tylko Marioosh) — symulacja prawdziwej fizyki |
| `tests/slopes.test.ts` | zbocza 45°/26°, rozpęd, skocznia, lód, wróg na zboczu |
| `tests/traversal.test.ts` | wspinaczka, szybowanie, odbicie od ściany, łapanie krawędzi, uderzenie w ziemię, sprężyny |
| `tests/tower.test.ts` | wieża W6-L2: każdy etap (schody/kratka/sprężyna) i wejście na szczyt dla obu braci |
| `tests/hints.test.ts` | podpowiedzi do mechanik: klucze istnieją w 6 językach, pierwszy poziom uczy każdej mechaniki raz |
| `e2e/smoke.mjs` | build w Chromium: tytuł w 6 językach (obraz niepusty), przejście menu → sloty → tryb → intro → mapa → gra, kilka sekund biegu, brak błędów w konsoli |

## Bot osiągalności i jego granice
Bot (`tests/bot.ts`) steruje prawdziwym `World` (tryb „god”): biegnie, skacze, wspina się po kratkach, odbija od sprężyn, pływa, włącza przełączniki, używa przewodów, a w zagadce W8-L2 wybiera właściwy przewód. Uruchamiany jest osobno dla Marioosha i Dariooosha (trasa główna musi być przejezdna dla każdego z nich). Przechodzi **wszystkie poziomy w trybie biegu/wody/bossa (31)**; wieża W6-L2 ma osobne testy etapów (`tests/tower.test.ts`).
Bot nie sprawdza sekretów (to robi `tests/secrets.test.ts`), balansu ani tego, czy poziom jest *przyjemny*. Pojedyncze poziomy: `LV=W1-L1,W4-L3 npx vitest run tests/reach.test.ts`.
Narzędzia diagnostyczne: `npx tsx tools/ascii-level.ts W1-L1 0 120` (ASCII planszy), `node tools/shot-at.mjs` (zrzuty w wybranych miejscach, `e2e/out/at-*.png`), `?debug=1` + `window.__play('W1-L1')`.

## Czego nie testowano
Natywnych paczek (Electron, Android, iOS), urządzeń dotykowych, padów, dźwięku (słuchowo), balansu trudności, pełnego przejścia gry przez człowieka, walk z bossami (poza dotarciem do areny i testami jednostkowymi reguł).

## Tryb testera (ręczne sprawdzenie poziomów)
- **Web:** otwórz grę z `?debug=1` (np. `http://localhost:5173/?debug=1`) albo 5× dotknij/kliknij numer wersji w prawym dolnym rogu ekranu tytułowego (powtórzenie wyłącza tryb).
- **Android:** `Marioosh-android-tester.apk` z wydania/CI ma tryb włączony od początku (build bez keystore).
- Na ekranie tytułowym pojawia się pozycja **TESTER: wybór poziomów (god mode)** → mapa z odblokowanymi wszystkimi poziomami i Pradowem. Dane idą do osobnego slotu 9 (nie ruszają zapisów gracza).
- „God mode” (domyślnie włączony): wrogowie, pociski i bossowie nie ranią; kolce i przepaście nadal zabijają. Przełącznik w menu pauzy.
- Do sprawdzenia ręcznie (v0.3): **czucie nowej fizyki** (zbocza, szybowanie, odbicie od ściany, wytrzymałość kratki), **wieża W6-L2** na dotyku, kamera pionowa, D-pad dotykowy oraz sekrety w kilku poziomach. Szukaj: miejsc bez wyjścia, niemożliwych skoków, zablokowanych bram bez dostępnego przełącznika, braku checkpointu, błędów kamery. Zgłaszaj id poziomu + pozycję (kafelek x) — bot daje ją przez `npx vite-node tools/trace.ts <id>`.
