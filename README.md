# Marioosh & Darioosh: Klątwa Katoblepasa

Dwuwymiarowa platformówka o dwóch braciach, ośmiu planetach, jednym przedłużaczu i kaucji, której nie wolno zmarnować. *(Gałąź `v0.4-human-scale`: skala człowieka, realistyczny ruch, 32 ręczne poziomy.)*
**Platformy:** przeglądarka (www/PWA) · Windows · Linux · Android · iOS — jeden kod źródłowy (TypeScript + Canvas 2D).
**Języki w grze:** polski, English, 中文 (简体), español, Kiswahili, العربية (z układem od prawej do lewej).

> *A 2D platformer about two brothers, eight planets, one extension cord and a deposit you must not waste.
> One TypeScript code base ships to web, Windows, Linux, Android and iOS; the game is fully localised in Polish, English, Chinese, Spanish, Swahili and Arabic (RTL).*

![menu](docs/art/tla.png)

## Spis treści
- [Co jest w grze](#co-jest-w-grze) · [Sterowanie](#sterowanie) · [Uruchomienie](#uruchomienie) · [Wydania](#wydania-i-platformy)
- [Testy](#testy) · [Struktura repozytorium](#struktura-repozytorium) · [Dokumentacja](#dokumentacja) · [Stan i ograniczenia](#stan-i-ograniczenia) · [English summary](#english-summary)

## Co jest w grze
Opis dotyczy gałęzi **`v0.4-human-scale`** („platformer w ludzkiej skali”, niewydana). `main` i wydanie 0.3.0 to starsza wersja z generowanymi, wysokimi planszami — zob. [Stan i ograniczenia](#stan-i-ograniczenia).
- **32 ręcznie projektowane poziomy** w 8 światach (po 4: trzy poziomy + walka z bossem). Każdy świat ma inny charakter i inną mechanikę (Lumenia — stacja, windy i przewody-drzwi; Złomaria — taśmy i dźwigi; Florion — światło i lustra; Aqualis — woda i powietrze; Skaltria — głazy na torach; Vespera — lampy i ptaki; Ferroks — burza, tłoki i maszyny; Katoblis — sieć portali, posągi i obwody), różna grawitacja planet (0,86–1,14 g). Poziom bonusowy Prądowo.
- **Skala człowieka (40 px = 1 m) i realistyczny ruch:** chód/bieg, skok ≤ 0,9 m, auto-krok 0,3 m, przeskok i chwyt krawędzi, drabiny, kucanie, rampy 26°, pływanie z oddechem (powietrze 20 s). Upadki mają progi (miękko / potknięcie / rana). Bez szybowania, toczenia, odbicia od ściany, sprężyn i skakania po głowach.
- **Zasady:** 3 serca + tarcza, **bez żyć, game over i zegara**; przepaść = −1 HP i powrót na ostatnie bezpieczne miejsce; checkpointy; opakowania to wartość kaucji (PET 100 pkt / 0,50 zł, puszka 150 pkt / 0,50 zł, złota puszka 750 pkt / 2,50 zł), EcoPort wypłaca kaucję.
- **19 gatunków wrogów (z telegrafami ataku) i 8 bossów** rozwiązywanych mechaniką otoczenia i narzędziem, nie skokiem na głowę (np. Rogomir — generatory i pomost-schron, Katoblepas — filary → lustra → węzły energii).
- **Dwaj bracia:** Marioosh (siła, klucz 2 obrażenia) i Darioosh (zwinność, klucz 1 obrażenie, krótszy cooldown); tryb solo (przełączanie) i **co-op na jednej klawiaturze** (ratowanie partnera). Każdy poziom jest weryfikowany pod kątem przejezdności osobno dla każdego z braci.
- Skamienienie (miernik), ulepszenia czasowe, cewka iskier, tarcza, ciemne pokoje z latarniami, bramy/przełączniki/przekaźniki/portale, windy.
- 96 mieszkańców do uwolnienia, 8 fragmentów kryształu, zapiski, zakończenie zwykłe i prawdziwe (wymaga wszystkich 8 fragmentów).
- 3 sloty zapisu (zapis atomowy, migracja starych zapisów), ustawienia (głośność, napisy, ograniczenie błysków/trzęsienia, przypisanie klawiszy), pad, sterowanie dotykowe.
- **Muzyka:** 13 utworów (tytuł, mapa, światy 0–8, boss, gwiazda) w `public/audio/music/*.m4a`; gdy plik nie jest dostępny, gra używa muzyki syntezowanej w WebAudio (efekty dźwiękowe są zawsze syntezowane). Zob. [`docs/PRODUKCJA_AUDIO_WIDEO.md`](docs/PRODUKCJA_AUDIO_WIDEO.md).
- **Grafika HD:** biblioteka obrazów generowanych przez AI (`public/art/game`, 162 pliki: bracia, wrogowie, bossowie, przedmioty, kafle) + 12 SVG wrogów i 9 teł planet; brakujące pozy i elementy rysowane są proceduralnie. Produkcja kolejnych grafik: **Art Station** — [`docs/ART_PIPELINE.md`](docs/ART_PIPELINE.md).

## Sterowanie
| Akcja | Gracz 1 (solo: oba zestawy działają) | Gracz 2 (co-op) | Pad |
|---|---|---|---|
| Ruch | `A` `D` / `W` `S` | strzałki | lewa gałka / D-pad |
| Skok | `Spacja` | `.` | A (dół) |
| Bieg | `Shift` | `,` | B / spusty |
| Klucz (atak) | `F` | `/` | X |
| Użyj (przewód, przełącznik, posąg) | `E` (lub `S` na przewodzie) | `'` | Y |
| Zmiana brata (solo) | `Q` | `;` | LB |
| Pauza | `Esc` / `P` | | Start |
| Pełny ekran | `F` w menu / `F11` (desktop) | | |

**Ruch (v0.4, skala ludzka):** niskie progi (do 0,3 m) pokonujesz sam; wyższą krawędź przeskakujesz albo chwytasz i wciągasz się (skok przy krawędzi); `↑`/`↓` na drabinie; `↓` — kucanie (niskie tunele); `↑`/`E` przy drzwiach, terminalach i portalach; w wodzie pływasz we wszystkich kierunkach (bez powietrza tracisz serce co 1,6 s — wynurzaj się lub szukaj komór z powietrzem). Nie ma szybowania, toczenia, odbicia od ściany, uderzenia w ziemię, sprężyn ani skakania po głowach wrogów — wrogów obserwuj i omijaj, klucz służy do obrony.

Na telefonach pojawiają się przyciski dotykowe (rozmiar w ustawieniach). Klawisze można przypisać w *Ustawienia → Klawisze*.

## Uruchomienie
Wymagany Node.js ≥ 20.
```bash
npm ci
npm run dev        # serwer deweloperski (http://localhost:5173)
npm run build      # produkcyjny build do dist/ (≈ 300 KB + czcionki)
npm run preview    # podgląd builda
```
Gotowy build webowy działa z dowolnego hostingu statycznego (ścieżki względne) oraz offline jako PWA.
Szczegóły i budowanie na wszystkie platformy: [`docs/BUILDING.md`](docs/BUILDING.md).

## Wydania i platformy
Po wypchnięciu tagu `vX.Y.Z` workflow **Release** buduje i dołącza do wydania na GitHubie:

| Platforma | Artefakt | Uwagi |
|---|---|---|
| www | `Marioosh-web-vX.Y.Z.zip` + GitHub Pages | PWA, offline |
| Windows | `Marioosh-<ver>-win-x64.exe` (NSIS) + `.zip` | niepodpisany (SmartScreen ostrzeże) |
| Linux | `.AppImage`, `.deb`, `.tar.gz` | x64 |
| Android | `Marioosh-android-tester.apk` (z wyborem poziomów; bez keystore) lub podpisany `.apk`/`.aab` (z sekretami keystore) | Android 7+ (WebView) |
| iOS | `Marioosh-ios-simulator.zip` | build bez podpisu; **IPA do App Store/TestFlight wymaga konta Apple Developer** — patrz [`docs/PLATFORMS.md`](docs/PLATFORMS.md) |

## Testy
```bash
npm run check      # typecheck + testy jednostkowe (pełny przebieg ≈ 1 godz., zob. docs/TESTING.md)
npx vitest run tests/movement.test.ts tests/world.test.ts   # pojedyncze pliki
npm run test:e2e   # test dymny w przeglądarce (zrzuty w e2e/out/), wymaga wcześniejszego npm run build
```
Zakres (v0.4): kontroler ruchu w skali ludzkiej, **przejezdność wszystkich 32 poziomów osobno dla Marioosha i Darioosha bez trybu god** (analizator `tests/reach.ts`) wraz z testami negatywnymi (analizator odrzuca niedozwolone trasy), mechaniki światów (`arc`, `water`, `lift`, `beam`, `boulder`, `lamp`, `slide`), bossowie (Rogomir, Katoblepas i in.), rachunek opakowań, zapis/migracja, komplet i spójność 6 tłumaczeń, regresje (moby nie migają: `enemy-flicker`; dobór póz bohatera: `hero-frames`), e2e w Chromium. Szczegóły: [`docs/TESTING.md`](docs/TESTING.md).

## Struktura repozytorium
```
src/engine/   wejście, grafika (Canvas), dźwięk (WebAudio), i18n, ustawienia, zapis
src/game/     fizyka, ruch (movement), świat, wrogowie, bossowie, sesja i zapis; maps/ — 32 ręczne poziomy (authored.ts); levelgen*.ts — generator v0.3 (legacy)
src/sprites/  renderer hybrydowy: obrazy HD (genmap/gen) + SVG HD + grafika proceduralna (fallback)
src/scenes/   tytuł, menu, mapa, rozgrywka, fabuła
src/data/     poziomy i bestiariusz (JSON z projektu), słowniki 6 języków
docs/design/  projekt: etap 1–2 (koncepcja, GDD, atlas, bestiariusz, biblia graficzna) i v0.3–v0.4 (00–12)
docs/art/     eksport grafik (PNG)    docs/*.md  dokumentacja techniczna
desktop/      powłoka Electron        mobile/    Capacitor (Android + iOS)
tests/ e2e/   testy                   .github/    CI, Pages, Release, grafiki
public/       art/ (obrazy HD), audio/music/ (muzyka), fonts/, sw.js
tools/        potok grafik i Art Station (gen-art, art-roadmap, build-station…), narzędzia diagnostyczne
art-tasks/    kolejka produkcji grafik (ROADMAP, okna, Art Station)   art-inbox/  wpływające obrazy
```

## Dokumentacja
[Architektura](docs/ARCHITECTURE.md) · [Budowanie](docs/BUILDING.md) · [Platformy](docs/PLATFORMS.md) · [Testowanie](docs/TESTING.md) · [Lokalizacja](docs/LOCALIZATION.md) · [Potok grafik i Art Station](docs/ART_PIPELINE.md) · [Audio i wideo](docs/PRODUKCJA_AUDIO_WIDEO.md) · [Stan implementacji v0.4](docs/design/12_IMPLEMENTACJA_v0_4.md) · [Licencje](docs/LICENSES.md) · [Zmiany](CHANGELOG.md) · [Projekt gry (GDD itd.)](docs/design/README.md)

## Stan i ograniczenia
**Gałąź `v0.4-human-scale` (prototyp do oceny, niewydany):** wszystkie 32 poziomy w 8 światach są zbudowane ręcznie i przechodzą testy przejezdności (osobno M i D, bez trybu god); `main` pozostaje wersją **0.3.0** do czasu akceptacji prototypu. Szczegóły, odstępstwa od specyfikacji i kolejne kroki: [`docs/design/12_IMPLEMENTACJA_v0_4.md`](docs/design/12_IMPLEMENTACJA_v0_4.md); lista zmian: [`CHANGELOG.md`](CHANGELOG.md).

Uczciwie, czego jeszcze nie ma / co wymaga człowieka:
- **Czucie gry nie było sprawdzone przez człowieka na wszystkich poziomach.** Testy dowodzą przejezdności i działania mechanik, nie przyjemności; wartości w `constants.ts`, `bosses.ts` i `enemies.ts` (prędkości, telegrafy, okna czasowe) to nastawy startowe. Wrogowie mają przeskalowany rozmiar, ale ich zasięgi i tempo nie są jeszcze przestrojone (Etap D).
- **Grafika:** bracia, wrogowie i bossowie mają obrazy bazowe (+ pozy idle/walk dla części); pozostałe pozy (pływanie, drabina, rampy, lądowania, podciąganie…) i nowe elementy v0.4 są w kolejce Art Station — do czasu ich powstania gra używa obecnych póz i grafiki proceduralnej. Wnętrza (stacje, hale, podziemia) używają teł i kafli światów zewnętrznych.
- **Muzyka:** 13 utworów w repozytorium; ich jakość i głośność wymagają oceny słuchowej. Efekty dźwiękowe są syntezowane; filmów intro/zakończeń nie ma.
- Paczki Windows/Linux/Android/iOS **kompilują się w CI**, ale **nie były uruchamiane** na docelowych systemach/urządzeniach; uruchomiono i przetestowano wersję web (Chromium, e2e).
- Tryb *Night Shift* działa tylko na poziomach generowanych (v0.3); na poziomach ręcznych nie ma sensu bez zegara — do decyzji projektowej.
- Tłumaczenia wykonane maszynowo/redakcyjnie — zalecana weryfikacja przez rodzimych użytkowników (zwłaszcza suahili i arabski). Zob. [`docs/LOCALIZATION.md`](docs/LOCALIZATION.md).
- **Wersja 0.3.0 (`main`):** poziomy generowane proceduralnie z blueprintu (`src/data/levels.json`), wysokie plansze, szybowanie/toczenie/sprężyny, życia za 100 opakowań; opisana w `docs/design/07_PRZEBUDOWA_PIONOWA_v0_3.md` i historii zmian.

## English summary
**Marioosh & Darioosh: The Curse of Katoblepas** is a 2D platformer for two brothers (solo or local co-op). Branch `v0.4-human-scale` (prototype) rebuilds it at human scale (40 px = 1 m) with realistic movement — walking, a modest jump, vaulting and ledge grabs, ladders, ramps, swimming with an air meter — and 32 hand-designed levels across 8 distinct worlds with different gravity (0.86–1.14 g), 19 enemy kinds and 8 bosses beaten by mechanics instead of stomping. 3 hearts + shield, no lives or timer; the bottle-deposit economy (PET/can/golden can) is kept as score and deposit value. Every level is verified reachable by both brothers without god mode. Music is delivered as 13 tracks (with a WebAudio fallback); art is a mix of AI-generated HD images and procedural fallbacks, produced through the "Art Station" queue (see `docs/ART_PIPELINE.md`).

```bash
npm ci && npm run dev        # play in the browser
npm run check                # typecheck + unit tests (full run takes about an hour)
npm run build && npm run test:e2e
```
Releases (tag `vX.Y.Z`) are built by GitHub Actions for web, Windows, Linux, Android and iOS (unsigned simulator build — signing needs your Apple/Android credentials). See [`docs/PLATFORMS.md`](docs/PLATFORMS.md). Known gaps: feel and balance have not been playtested by a human on every level, enemy tuning is pending, many poses/props are still waiting in the art queue, and native binaries have not been run on physical devices.

Licence: code MIT (see `LICENSE`), fonts SIL OFL 1.1 — see [`docs/LICENSES.md`](docs/LICENSES.md).
