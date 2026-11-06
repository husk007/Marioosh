# Platformy: stan i uwagi

| Platforma | Sposób | Zweryfikowane lokalnie przez autora | Do zrobienia przez właściciela |
|---|---|---|---|
| www / PWA | Vite build, `public/sw.js`, manifest | ✅ build, test e2e w Chromium (6 języków, wejście do gry, brak błędów konsoli) | włączyć GitHub Pages |
| Windows | Electron + electron-builder (NSIS, zip) | ❌ nie uruchamiano (brak Windows/Electron w środowisku) — konfiguracja w `desktop/`, budowana w CI | opcjonalnie podpisać kod (certyfikat) |
| Linux | Electron (AppImage, deb, tar.gz) | ❌ nie uruchamiano powłoki Electron; ten sam build webowy działa w Chromium | — |
| Android | Capacitor 7, projekt `mobile/android` (pozioma orientacja) | ❌ nie budowano (brak Android SDK); projekt wygenerowany przez `cap add android` | keystore + Google Play; test na urządzeniu |
| iOS | Capacitor 7, projekt `mobile/ios` | ❌ nie budowano (brak macOS/Xcode); CI buduje symulator bez podpisu | konto Apple Developer, podpis, TestFlight/App Store |

## Uwagi techniczne
- **Dźwięk** wymaga gestu użytkownika (polityka przeglądarek/WebView) — ekran tytułowy czeka na pierwsze naciśnięcie.
- **Dotyk:** przyciski ekranowe pojawiają się automatycznie po wykryciu dotyku (`pointer: coarse`); wielodotyk obsługiwany; rozmiar w ustawieniach.
- **Pełny ekran:** przeglądarka — `F`/przycisk w menu (Fullscreen API); Electron — `F11`; Android/iOS — zawsze (ukryty pasek stanu).
- **Zapisy:** `localStorage` — w przeglądarce per-origin, w Electronie per-profil, w Capacitorze per-aplikacja. Brak synchronizacji w chmurze.
- **Ikony/splash:** ikona SVG (`public/icon.svg`) i PNG 512 dla Electrona; aplikacje mobilne mają **domyślne ikony Capacitora** — podmień je (`npx @capacitor/assets generate`) przed publikacją w sklepach.
- **Sklepy:** nie przygotowano grafik sklepowych, polityki prywatności ani deklaracji wiekowych (gra nie zbiera żadnych danych i nie używa sieci).
