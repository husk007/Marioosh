# Architektura

## Wybór technologii
Roadmapa (`docs/design/06_ROADMAP_v0_2.md`) sugerowała Godot 4.x jako punkt startowy, ale zostawiała wybór otwarty. Wymaganie „jeden projekt → Android, iOS, www, Windows, Linux, 6 języków, testy i releasy w jednym repo” przesądziło o **TypeScript + Canvas 2D**:
- jedna baza kodu uruchamiana natywnie w przeglądarce (www/PWA), a w powłokach **Electron** (Windows/Linux) i **Capacitor** (Android/iOS);
- logika gry jest czysta (bez DOM) i testowalna w Node (Vitest) — także bot przechodzący poziomy;
- zero zależności uruchomieniowych (build ≈ 300 KB), CI bez licencji i bez eksportu silnika;
- czcionki CJK/arabskie osadzane jako podzbiory WOFF2 (`scripts/build-fonts.mjs`).

Kompromis: Canvas 2D/WebView ma niższy sufit wydajności niż silnik natywny; przy rozdzielczości wirtualnej 640×360 i supersamplowanych zasobach SVG/Canvas to wystarcza (60 Hz stałego kroku).

## Warstwy
```
main.ts → App (pętla, skalowanie, nakładka dotykowa, przełączanie scen)
  ├─ engine/   input.ts (klawiatura/pad/dotyk, bufor zboczy) · gfx.ts (Canvas, tekst, RTL, wrap)
  │            audio.ts (synteza WebAudio: muzyka + SFX) · i18n.ts · settings.ts · storage.ts · rng.ts
  ├─ scenes/   title · menus (sloty, tryb, ustawienia, klawisze, dziennik) · map · story · gameover · play (HUD)
  └─ game/     world.ts (stan i reguły) · worldDraw.ts (rysowanie) · entities.ts · enemies.ts · bosses.ts
               physics.ts (AABB, kafelki, platformy jednostronne) · movement.ts (tabela z GDD B)
               levelgen.ts (generator z blueprintu JSON) · levels.ts · session.ts · save.ts · constants.ts
  sprites/art.ts   hybrydowy renderer: pliki SVG HD przez sprites/hd.ts + proceduralne fallbacki
```
Zależności idą tylko w dół: `game/*` nie zna DOM-u; audio jest wstrzykiwane (`AudioEngine`), więc testy używają atrapy.

## v0.4 (gałąź `v0.4-human-scale`)
Skala 40 px = 1 m (`constants.ts`), grawitacja = `BASE_GRAVITY × PLANET_PHYSICS[świat]`. Kontroler bohaterów (`movement.ts`) to maszyna stanów: chód/bieg, skok, auto-krok, przeskok/chwyt krawędzi, drabina, kucanie, pływanie, upadki z progami. Poziomy z `maps/` są ręcznie projektowane przez `authored.ts` (ASCII + specyfikacje w kodzie) i mają pierwszeństwo przed generatorem v0.3 (`levels.ts`); poziomy spoza rejestru `AUTHORED` są WIP. Poniższy opis pętli dotyczy też v0.4, ale fragment o ruchu bohaterów to v0.3.

## Pętla i fizyka
- Rozdzielczość wirtualna **640×360**, skalowanie całkowite z letterboxem; stały krok **60 Hz** (akumulator) niezależny od odświeżania ekranu.
- `moveBody` (wrogowie, bossowie): ruch osiami osobno, kolizje z kafelkami (pełne, jednostronne, **zbocza z profilem wysokości**, kolce, drabiny/kratki/liny, taśmy, kruszące, bramy) oraz ruchomymi platformami (`carryOnPlatforms`/`landOnPlatforms`).
- Ruch bohaterów (`movement.ts`, v0.3): coyote 0,1 s, bufor skoku, skok o zmiennej wysokości, rozpęd na zboczach (`slopeF`), toczenie, szybowanie, ślizg i odbicie od ściany (tylko Darioosh), łapanie krawędzi, wspinaczka z wytrzymałością, uderzenie w ziemię (tylko Marioosh), sprężyny, pływanie 8-kierunkowe.
- Wejście: `poll()` raz na krok; zbocza (`pressed`) są zatrzaskiwane do skonsumowania, więc krótkie tapnięcia nie giną (w tym w menu).

## Poziomy
`src/data/levels.json` (z paczki projektu) opisuje 32 poziomy: tryb (bieg/woda/wieża/boss), długość, budżety obiektów, sekrety. `levelgen.ts` zamienia wpis w tilemapę **deterministycznie** (ziarno = id poziomu) i dostarcza wspólne elementy (pickupy, wrogowie, areny bossów, skrzynki, pokoje bonusowe, wieżę). Trasę główną biegu buduje **`levelgen2.ts` (`buildRun2`)**: wysoki pokój (46 wierszy), ciąg elementów (zbocza, wspinaczka, sprężyny, zrzuty, sekrety…) z profilem wysokości; `route[x]` zapamiętuje wiersz trasy. Wieża W6-L2 to etapy (`TOWER_STAGES`). Zasady: `docs/design/07_PRZEBUDOWA_PIONOWA_v0_3.md`. Testy: `levelgen`, `secrets`, `tower`, `reach` (bot), `hints`.

## Dane i zapis
- Zapis: `marioosh.save.v1.slotN` (JSON z polem `v`), zapis atomowy (`.tmp` → właściwy klucz), `migrate()` naprawia/odrzuca dane. Ustawienia: `marioosh.settings.v1`.
- `localStorage` jest opakowany (`storage.ts`) z pamięcią zastępczą (tryb prywatny/testy).
- Wszystkie napisy w `src/data/i18n/*.ts`, typ `Dict` wymusza ten sam zestaw kluczy; testy sprawdzają komplet i zgodność `{parametrów}`.

## Grafika i dźwięk
Hybrydowy rendering HD: `src/sprites/hd.ts` asynchronicznie wczytuje SVG z `public/art/hd/` i rasteruje je do offscreen-canvasów 2× (tła) lub 4× (wrogowie), bez zmiany fizyki i wymiarów świata. Pozostałe sprite'y są tworzone proceduralnie i służą także jako fallback, jeśli obraz SVG się nie załaduje. Muzyka i SFX są syntezowane w WebAudio. Eksport podglądowy PNG: `node tools/art-export.mjs` → `docs/art/` (nie zawiera jeszcze wszystkich nowych SVG).

Nowy kierunek: gładka grafika ilustracyjna 2D HD, bez pixel artu. Wstępny zestaw opisano w `docs/art/HD_ASSET_PACK_WAVE1.md`.
