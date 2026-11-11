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
  └─ game/     world.ts (stan i reguły) · worldDraw.ts (rysowanie, dobór pozy bohatera) · entities.ts · enemies.ts · bosses.ts
               physics.ts (AABB, kafelki, platformy jednostronne, zbocza) · movement.ts (kontroler braci, GDD v0.4 §2)
               authored.ts + maps/ (32 ręczne poziomy) · beam.ts (wiązki i lustra) · levels.ts (rejestr) · session.ts · save.ts · constants.ts
               levelgen.ts / levelgen2.ts (generator v0.3 — legacy, nieużywany przez poziomy ręczne)
  sprites/   art.ts (hybrydowy renderer) · genmap.ts + gen.ts (obrazy AI z public/art/game, zamienniki póz) · hd.ts (SVG HD)
             hero.ts · enemies.ts · bosses.ts · objects.ts · props.ts · scenery.ts (proceduralne fallbacki)
```
Zależności idą tylko w dół: `game/*` nie zna DOM-u; audio jest wstrzykiwane (`AudioEngine`), więc testy używają atrapy.

## v0.4 (gałąź `v0.4-human-scale`)
Skala 40 px = 1 m (`constants.ts`), grawitacja = `BASE_GRAVITY × PLANET_PHYSICS[świat]` (0,86–1,14 g). Kontroler bohaterów (`movement.ts`, `stepMovement`) to maszyna stanów: chód/bieg, skok o zmiennej wysokości, auto-krok, przeskok i chwyt krawędzi (wciągnięcie), drabina, kucanie, pływanie (wypór, powietrze liczone po stronie świata — `updateAir`), upadki z progami (<1,2 m miękko, 1,2–2,4 m potknięcie, ≥2,4 m rana). Zasady świata (`world.ts`): HP 3 + tarcza, bez żyć i zegara, przepaść = −1 HP i powrót na ostatnie bezpieczne miejsce, ↑/E otwiera drzwi i portale.

**Poziomy:** wszystkie 32 są ręcznie projektowane (`maps/wXlY.ts`): plansza ASCII budowana przez `authored.ts` (`Canvas`, `rect/ground/ladder/rampUp/rampDown`, `AuthoredRoom`, `assemble`) + specyfikacje obiektów w kodzie (przełączniki, bramy, windy, kable-drzwi z `dest`, wrogowie, lampy, dekoracje). Rejestr `AUTHORED` (`maps/index.ts`) ma pierwszeństwo przed generatorem v0.3. Poziom może mieć wiele pokoi (portale, stacje W8-L2); stan wykonawczy (`rt`) jest per pokój. Konwencje bram (`gate.id`): `ord…` — przekaźniki w kolejności (zła kolejność zeruje), `…:warpgate` — odblokowuje zamknięte drzwi w pokoju, `free…` — otwiera się po uwolnieniu `need` posągów, `pool…` — zawór basenu, `pwX` — zasilanie windy. Zagrożenia cykliczne to spec `arc` (m.in. `rock`, tłoki, burza).

**Wrogowie i bossowie** (`enemies.ts`, `bosses.ts`): stany z telegrafami; chodzenie przez wspólną funkcję `walk` (zawrót na ścianie / krawędzi / poza zasięgiem patrolu z przerwą `turnCd` 0,4 s — zapobiega miganiu lewo-prawo). Bossowie bez ciosów „skok na głowę”: generatory, pomosty, filary → lustra → węzły itd.

**Przejezdność:** `tests/reach.ts` — analizator oparty na prawdziwym `stepMovement` (zob. `docs/TESTING.md`). **Grafika:** `heroFrameFor` wybiera klatkę, `genmap.ts` mapuje ją na obraz z zamiennikami (zob. `docs/ART_PIPELINE.md`).

## Pętla i fizyka
- Rozdzielczość wirtualna **640×360**, skalowanie całkowite z letterboxem; stały krok **60 Hz** (akumulator) niezależny od odświeżania ekranu.
- `moveBody` (wrogowie, bossowie): ruch osiami osobno, kolizje z kafelkami (pełne, jednostronne, **zbocza z profilem wysokości**, kolce, drabiny/kratki/liny, taśmy, kruszące, bramy) oraz ruchomymi platformami (`carryOnPlatforms`/`landOnPlatforms`).
- Ruch bohaterów (`movement.ts`, v0.4): coyote 0,08 s, bufor skoku 0,10 s, skok o zmiennej wysokości, auto-krok 0,3 m, rampy 26°, przeskok i chwyt krawędzi, drabiny, kucanie, pływanie. (Toczenie, szybowanie, ślizg/odbicie od ściany, uderzenie w ziemię i sprężyny z v0.3 usunięto.)
- Wejście: `poll()` raz na krok; zbocza (`pressed`) są zatrzaskiwane do skonsumowania, więc krótkie tapnięcia nie giną (w tym w menu).

## Poziomy
Opis v0.4 — wyżej. **Legacy (v0.3, `main`):** `src/data/levels.json` (z paczki projektu) opisuje 32 poziomy (tryb, długość, budżety, sekrety); `levelgen.ts` / `levelgen2.ts` zamieniają wpis w tilemapę deterministycznie (ziarno = id poziomu). Budżety opakowań z `levels.json` wciąż obowiązują poziomy ręczne (sprawdza je `tests/authored.test.ts`). Zasady v0.3: `docs/design/07_PRZEBUDOWA_PIONOWA_v0_3.md` (dokument historyczny).

## Dane i zapis
- Zapis: `marioosh.save.v1.slotN` (JSON z polem `v`), zapis atomowy (`.tmp` → właściwy klucz), `migrate()` naprawia/odrzuca dane. Ustawienia: `marioosh.settings.v1`.
- `localStorage` jest opakowany (`storage.ts`) z pamięcią zastępczą (tryb prywatny/testy).
- Wszystkie napisy w `src/data/i18n/*.ts`, typ `Dict` wymusza ten sam zestaw kluczy; testy sprawdzają komplet i zgodność `{parametrów}`.

## Grafika i dźwięk
Hybrydowy rendering: (1) **obrazy HD generowane przez AI** (`public/art/game/*.webp` + `index.json`) wczytuje `sprites/gen.ts`; `genmap.ts` mapuje klatki bohatera/wrogów/bossów na pliki `ASSET-ID__stan` z listą zamienników, gdy konkretnej pozy nie ma; (2) **SVG HD** (`public/art/hd/`, `sprites/hd.ts`) — 12 wrogów i 9 teł, rasteryzowane do offscreen-canvasów; (3) **proceduralne sprite'y** jako ostateczny fallback. Produkcja i kolejka obrazów: `docs/ART_PIPELINE.md`.

Dźwięk: efekty zawsze syntezowane w WebAudio; **muzyka** — 13 plików `public/audio/music/<klucz>.m4a` (`title`, `map`, `w0`…`w8`, `boss`, `star`; AAC, zapętlane), a gdy plik nie jest dostępny lub nie da się go odtworzyć, ta sama muzyka grana jest z syntezatora (`audio.ts`, `FILE_MUSIC`). Hosty, które nie serwują `.m4a`, mogą wystawić ten sam kontener jako `.mp4` i ustawić `window.__MUSIC_EXT = 'mp4'` przed startem; `window.__NO_FILE_MUSIC = true` wymusza syntezator. Eksport podglądowy PNG grafik proceduralnych: `node tools/art-export.mjs` → `docs/art/`.

Kierunek artystyczny: gładka ilustracja 2D HD, bez pixel artu (`docs/design/04_BIBLIA_GRAFICZNA_v0_2.md`, skala i pozy: `docs/design/08` §9).
