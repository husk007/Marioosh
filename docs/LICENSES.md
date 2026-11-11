# Licencje

| Składnik | Licencja |
|---|---|
| Kod gry, narzędzia, dokumentacja, **grafiki proceduralne i efekty dźwiękowe generowane w kodzie** | MIT (plik `LICENSE`), © 2026 Erwin Słabuszewski |
| **Obrazy HD** (`public/art/`) wygenerowane narzędziami AI (Gemini / ChatGPT) na podstawie projektów autora | prawa wg regulaminów tych usług i planów autora — **do potwierdzenia przed publikacją w sklepach** |
| **Muzyka** (`public/audio/music/*.m4a`, 13 utworów) wygenerowana przez autora w Suno | zależy od planu Suno aktywnego w chwili tworzenia (komercyjne użycie wymaga planu płatnego) — **do potwierdzenia przed wydaniem**; zachowaj daty tworzenia |
| Czcionka **Press Start 2P** (CodeMan38; pakiet `@fontsource/press-start-2p`) | SIL Open Font License 1.1 |
| Czcionka **Noto Sans SC** (Google; `@expo-google-fonts/noto-sans-sc`) | SIL Open Font License 1.1 |
| Czcionka **Noto Sans Arabic** (Google; `@expo-google-fonts/noto-sans-arabic`) | SIL Open Font License 1.1 |
| Zależności deweloperskie (Vite, Vitest, TypeScript, Playwright, Electron, Capacitor, electron-builder) | MIT / Apache-2.0 / BSD (nie są dystrybuowane w buildzie webowym) |

Czcionki OFL są osadzane jako podzbiory (zmodyfikowane pliki WOFF2, bez zmiany nazwy rodziny w UI gry); pełne teksty licencji znajdują się w pakietach npm w `node_modules/@fontsource/*` i `node_modules/@expo-google-fonts/*`. Electron zawiera Chromium (licencje w pliku `LICENSES.chromium.html` w paczce desktopowej).
Efekty dźwiękowe są syntezowane w locie (brak próbek zewnętrznych); muzyka jest zapasowo syntezowana, gdy brakuje plików. Postacie i świat pochodzą z projektu autora (`docs/design/`).
