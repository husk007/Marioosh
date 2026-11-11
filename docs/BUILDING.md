# Budowanie

Wymagania: Node.js ≥ 20 (CI używa 22), npm. Dla paczek natywnych dodatkowo: Electron/electron-builder (pobierane przez npm), JDK 21 + Android SDK (Android), macOS + Xcode (iOS).

## Web
```bash
npm ci
npm run dev                # http://localhost:5173 (generuje podzbiory czcionek do public/fonts)
npm run build              # dist/  (typecheck + vite build)
npm run preview
```
`dist/` można wgrać na dowolny hosting statyczny; `base: './'` pozwala na podkatalogi. Workflow **Pages** publikuje `dist/` na GitHub Pages po każdym pushu do `main` (włącz *Settings → Pages → Source: GitHub Actions* i ustaw zmienną repozytorium `PAGES_ENABLED=true`; bez tego job jest pomijany).

## Grafiki i muzyka
Obrazy i muzyka są plikami w repozytorium (`public/art/`, `public/audio/music/`) i trafiają do `dist/` zwykłym buildem (źródłowa biblioteka `public/art/gen` jest pomijana — gra używa spakowanych kopii z `public/art/game`). Po dodaniu nowych obrazów: `node tools/pack-game-art.mjs`; kolejka i Art Station: `node tools/art-roadmap.mjs` (zob. [`ART_PIPELINE.md`](ART_PIPELINE.md)). Muzyka: pliki `.m4a` w `public/audio/music/` — szczegóły w [`PRODUKCJA_AUDIO_WIDEO.md`](PRODUKCJA_AUDIO_WIDEO.md).

## Windows / Linux (Electron)
```bash
npm run build
node scripts/prepare-desktop.mjs       # kopiuje dist/ → desktop/app
cd desktop && npm install
npm run dist:linux                     # AppImage, deb, tar.gz  (na Linuksie)
npm run dist:win                       # NSIS + zip            (najlepiej na Windows; na Linuksie wymaga Wine)
```
Wynik: `desktop/out/`. Aplikacja bez menu, `F11` = pełny ekran, zapis w localStorage profilu Electrona.

## Android (Capacitor)
```bash
npm run build && node scripts/prepare-mobile.mjs
cd mobile && npm install && npx cap sync android
cd android && ./gradlew assembleDebug      # app/build/outputs/apk/debug/app-debug.apk
./gradlew assembleRelease bundleRelease    # niepodpisane; podpisz własnym keystore (apksigner / Play App Signing)
```
Orientacja wymuszona: pozioma. Wersję ustawia workflow Release na podstawie tagu.

## iOS (Capacitor)
```bash
npm run build && node scripts/prepare-mobile.mjs
cd mobile && npm install && npx cap sync ios && npx cap open ios
```
W Xcode wybierz *Team* i profil, ustaw Bundle Identifier (domyślnie `pl.husk007.marioosh`) i archiwizuj. CI buduje wyłącznie wersję na **symulator** bez podpisu.

## Wydanie
```bash
git tag vX.Y.Z && git push origin vX.Y.Z   # wersja z package.json; gałąź v0.4 wydawaj dopiero po akceptacji prototypu
```
Workflow **Release** zbuduje wszystkie platformy i utworzy wydanie z plikami. Opcjonalne sekrety repozytorium dla podpisanego Androida: `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`.
