# Lokalizacja

Języki: `pl` (źródłowy), `en`, `zh` (chiński uproszczony), `es`, `sw` (suahili), `ar` (arabski, **RTL**). Autodetekcja z `navigator.language`, zmiana w menu głównym (◀ ▶) i w ustawieniach.

- Słowniki: `src/data/i18n/<lang>.ts`; typ `Dict` (z `pl.ts`) wymusza komplet kluczy, a `tests/i18n.test.ts` — brak pustych wpisów i zgodność `{parametrów}`.
- Dodanie języka: nowy plik słownika, wpis w `LANGS`/`DICTS` (`src/engine/i18n.ts`), czcionka (jeśli inne pismo) w `scripts/build-fonts.mjs` i `gfx.ts`, ewentualnie `RTL_LANGS`.
- **Czcionki:** Press Start 2P (pl/en/es/sw), Noto Sans SC (zh), Noto Sans Arabic (ar) — podzbiory WOFF2 generowane z używanych znaków (`npm run fonts`). Nowy tekst chiński/arabski z nowymi znakami jest automatycznie uwzględniany przy kolejnym `npm run fonts`.
- **RTL (arabski):** wyrównanie, kolejność menu i znaczniki ◀ ▶ są odwracane w `gfx.ts`; cyfry pozostają łacińskie.
- **Jakość tłumaczeń:** teksty przygotowano bez udziału tłumaczy rodzimych. Zalecana weryfikacja, zwłaszcza **suahili**, **arabskiego** (rejestr, kształty liter, nazwy własne) i **chińskiego** (nazwy wrogów/planet). Nazwy własne (Marioosh, Darioosh, Katoblepas) pozostają w oryginale w nagłówkach.
- Podgląd: `e2e/out/title-<lang>.png` po `npm run test:e2e`.
