# Zmiany

## 0.1.1
- **Tryb testera** (do ręcznego sprawdzenia 7 poziomów poza zasięgiem bota): `?debug=1` w adresie albo 5× dotknięcie numeru wersji na ekranie tytułowym → pozycja „TESTER” w menu → mapa ze wszystkimi poziomami odblokowanymi i „god mode” (przełącznik w pauzie). Dane testera idą do osobnego slotu 9. APK z CI bez keystore ma tryb testera włączony domyślnie (`Marioosh-android-tester.apk`).
- Poprawka: w buildzie produkcyjnym klawisz F (atak) przełączał pełny ekran (wykrywanie sceny po nazwie klasy psuło minifikacja).

## 0.1.0 — pierwsze wydanie
- Pełna implementacja projektu z etapu 2 jako gra 2D: 32 poziomy / 8 światów, 19 wrogów, 8 bossów, przewody i warpy, kaucja i licznik opakowań, skamienienie, co-op lokalny, 3 sloty zapisu.
- Platformy: www/PWA, Windows, Linux (Electron), Android, iOS (Capacitor); CI (testy + e2e), GitHub Pages, Release po tagu.
- Języki: pl, en, zh, es, sw, ar (RTL).
- Testy: 309 jednostkowych, bot osiągalności (25/32 poziomów), e2e w Chromium.
- Znane ograniczenia: patrz README → „Stan i ograniczenia”.
