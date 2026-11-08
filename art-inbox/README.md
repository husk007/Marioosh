Wlot na gotowe obrazy (PNG/WebP/JPG) z zewnątrz, np. z zadania ChatGPT. Nazwa pliku: `ASSET-ID__poza.png` (np. `CHARACTERS-001__walk.png`, `ENEMIES-004__base.png`).
Po wrzuceniu do tego katalogu GitHub Action „Wczytaj grafiki z art-inbox” wycina tło, zamienia na WebP w `public/art/gen/`, aktualizuje manifest i `art-tasks/ROADMAP.md`, po czym usuwa pliki z wlotu.
Sufiks `~noref` (np. `ENEMIES-001__walk~noref.png`) oznacza obraz zrobiony bez wymaganej referencji — zostanie później poprawiony.
