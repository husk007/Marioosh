# Architektura

## Wybór technologii
Roadmapa (`docs/design/06_ROADMAP_v0_2.md`) sugerowała Godot 4.x jako punkt startowy, ale zostawiała wybór otwarty. Wymaganie „jeden projekt → Android, iOS, www, Windows, Linux, 6 języków, testy i releasy w jednym repo” przesądziło o **TypeScript + Canvas 2D**:
- jedna baza kodu uruchamiana natywnie w przeglądarce (www/PWA), a w powłokach **Electron** (Windows/Linux) i **Capacitor** (Android/iOS);
- logika gry jest czysta (bez DOM) i testowalna w Node (Vitest) — także bot przechodzący poziomy;
- zero zależności uruchomieniowych (build ≈ 300 KB), CI bez licencji i bez eksportu silnika;
- czcionki CJK/arabskie osadzane jako podzbiory WOFF2 (`scripts/build-fonts.mjs`).

Kompromis: Canvas 2D/WebView ma niższy sufit wydajności niż silnik natywny; przy rozdzielczości wirtualnej 640×360 i grafice pikselowej to wystarcza (60 Hz stałego kroku).

## Warstwy
```
main.ts → App (pętla, skalowanie, nakładka dotykowa, przełączanie scen)
  ├─ engine/   input.ts (klawiatura/pad/dotyk, bufor zboczy) · gfx.ts (Canvas, tekst, RTL, wrap)
  │            audio.ts (synteza WebAudio: muzyka + SFX) · i18n.ts · settings.ts · storage.ts · rng.ts
  ├─ scenes/   title · menus (sloty, tryb, ustawienia, klawisze, dziennik) · map · story · gameover · play (HUD)
  └─ game/     world.ts (stan i reguły) · worldDraw.ts (rysowanie) · entities.ts · enemies.ts · bosses.ts
               physics.ts (AABB, kafelki, platformy jednostronne) · movement.ts (tabela z GDD B)
               levelgen.ts (generator z blueprintu JSON) · levels.ts · session.ts · save.ts · constants.ts
  sprites/art.ts   proceduralne sprite'y, kafelki, tła (Pix: prosty rasteryzator pikseli z konturem)
```
Zależności idą tylko w dół: `game/*` nie zna DOM-u; audio jest wstrzykiwane (`AudioEngine`), więc testy używają atrapy.

## Pętla i fizyka
- Rozdzielczość wirtualna **640×360**, skalowanie całkowite z letterboxem; stały krok **60 Hz** (akumulator) niezależny od odświeżania ekranu.
- `moveBody`: ruch osiami osobno, kolizje z kafelkami (pełne, jednostronne, kolce, drabiny, taśmy, kruszące, bramy) oraz ruchomymi platformami (`carryOnPlatforms`/`landOnPlatforms`).
- Ruch zgodny z GDD: coyote 0,1 s, bufor skoku, skok o zmiennej wysokości (puszczenie przycisku zwiększa grawitację), woda, drabiny.
- Wejście: `poll()` raz na krok; zbocza (`pressed`) są zatrzaskiwane do skonsumowania, więc krótkie tapnięcia nie giną (w tym w menu).

## Poziomy
`src/data/levels.json` (z paczki projektu) opisuje 32 poziomy: tryb (bieg/woda/wieża/boss), długość, budżety obiektów, sekrety. `levelgen.ts` zamienia wpis w tilemapę **deterministycznie** (ziarno = id poziomu): segmenty (płasko, przepaść, schody, kolce, ściany z przewodem, ruchome/znikające platformy, taśmy, zagadki), pokoje bonusowe/sekretne, posągi, bramy z przełącznikami, checkpointy, EcoPort, wyjście lub arenę bossa. Testy (`tests/levelgen.test.ts`) pilnują m.in. maksymalnej przepaści, budżetów, unikalnych id i obecności wymaganych obiektów.

## Dane i zapis
- Zapis: `marioosh.save.v1.slotN` (JSON z polem `v`), zapis atomowy (`.tmp` → właściwy klucz), `migrate()` naprawia/odrzuca dane. Ustawienia: `marioosh.settings.v1`.
- `localStorage` jest opakowany (`storage.ts`) z pamięcią zastępczą (tryb prywatny/testy).
- Wszystkie napisy w `src/data/i18n/*.ts`, typ `Dict` wymusza ten sam zestaw kluczy; testy sprawdzają komplet i zgodność `{parametrów}`.

## Grafika i dźwięk
Brak plików zasobów: sprite'y rysuje `Pix` na offscreen-canvasach i memoizuje; muzyka i efekty są syntezowane w WebAudio (oscylatory + szum, sekwencer). Eksport PNG do dokumentacji: `node tools/art-export.mjs` → `docs/art/`.
