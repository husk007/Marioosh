# Zmiany

## 0.2.0 (wstępne wydanie HD)
- **Gra korzysta z biblioteki grafik HD** (wygenerowanych w `public/art/gen`): bracia (Marioosh, Darioosh), Scarlet, wszyscy wrogowie (18 + dron), ośmiu bossów wraz z pozami „odsłonięty / ogłuszony”, przedmioty i ikony HUD, posągi i uwolnieni mieszkańcy, rury (kolory), checkpoint, wyjście, EcoPort, dźwignie, skrzynie oraz kafle gruntu i platformy ośmiu planet (wypełnienie, górna krawędź, platformy jednostronne, kruszące się bloki).
- Pozy bez własnej grafiki (skok, upadek, przysiad, ból, pływanie) używają grafiki bazowej z lekką deformacją; po wygenerowaniu pozy gra użyje jej automatycznie.
- Stare sprite'y proceduralne zostają jako awaryjny zapas, gdy brakuje pliku.
- Nowy pakiet gry `public/art/game` (162 pliki, ok. 3 MB; narzędzie `tools/pack-game-art.mjs`) zamiast całej biblioteki; build nie zawiera już źródłowych 25 MB.
- Czyszczenie biblioteki: usunięto 5 błędnych grafik (zła postać Marioosha, dwa kafle-sceny, tło wklejone w kafel, kafel izometryczny), naprawiono tła w 48 plikach (`tools/clean-art.mjs`).
- Znane ograniczenia: statyczne pozy (brak klatek animacji), tła i paralaksa nadal z SVG/kodu, kafle nie są w pełni bezszwowe (widoczne powtarzanie co 128 px), część rekwizytów (lampy, znaki, pociski) wciąż proceduralna.

## 0.1.6
- **Grafika HD (fala 1):** 12 ilustracji SVG wrogów i 9 teł planet wczytywanych jako gładka grafika HD (z awaryjnym powrotem do rysunku proceduralnego).
- Poprawka integracji: sprite'y HD są przycinane do widocznej zawartości, skalowane z zachowaniem proporcji (koniec ze ściśniętymi roślinami) i stoją stopami na ziemi (wcześniej część wrogów lewitowała nad podłożem).
- Znane ograniczenia: wrogowie HD mają jedną klatkę (bez animacji chodu i bez osobnej pozy ogłuszenia); bracia, bossowie i pozostałe wrogowie nadal rysowani proceduralnie.

## 0.1.5
- **Grafika wg „Biblii HD v0.3”:** bracia przerysowani zgodnie z opisami (Marioosh — pomarańczowy kombinezon, niebieski kask, krępa sylwetka; Darioosh — niebieski kombinezon, żółty kask, smukły, z miernikiem), nowe pozy: spadanie, kucanie, zwycięstwo.
- **Scarlet** (opiekunka / królowa): nowy portret w intro, w niewoli, przy rzucaniu zaklęcia i w zakończeniach oraz na ekranie wyniku.
- **Wrogowie:** palety, cechy szczególne i detale dla wszystkich 19 typów według opisów (m.in. Żukoróg w obsydianowej zieleni, Krukoróg w granacie, Kamienioróg z lawendowymi szwami, Rogoskoczek z kropkami, Gekoróg z pomarańczowym pasem).
- **Bossowie:** Rogomir (trzyrogi szmaragdowy żuk) i Rogodron (mechaniczna osa-żuk) przerysowani wg opisów.
- Nowy silnik muzyki (akordy, pady, pogłos, delay, kompresor).

## 0.1.4
- **Skrzynki nad kruchymi mostami (np. W5-L1):** przedmiot mógł wylądować na znikającym moście albo obok niego i wpaść w przepaść. Skrzynki stawiane są teraz tylko nad trwałym podłożem (z trwałym podłożem także po obu stronach), a przedmiot wyskakuje wyłącznie na stałą ziemię. Test sprawdza to dla wszystkich 128 skrzynek.

## 0.1.3
- **Skrzynki:** przedmiot wybity ze skrzynki zostawał na wiszącej skrzynce (~138 px nad ziemią, poza zasięgiem skoku). Teraz wyskakuje w bok i spada na ziemię obok; skrzynki ukryte i w wieży (W6-L2) są umieszczone tak, by dało się je uderzyć. Test symuluje otwarcie każdej z 114 skrzynek.

## 0.1.2
- **Skoki a bonusy:** wszystkie przedmioty są teraz w zasięgu skoku obu braci (fizyka bez zmian — poprawiono rozmieszczenie: niższe łuki, pokoje bonusowe i tajne). Test jednostkowy pilnuje tego dla wszystkich 32 poziomów.
- **Poprawka:** przy oddawaniu butelek w EcoPorcie zamiast kwoty pojawiało się „n+” (zła nazwa parametru tłumaczenia). Dodano testy parametrów komunikatów we wszystkich 6 językach.
- **Nowa oprawa graficzna** (koniec z 8-bitami): bracia według Biblii graficznej (pomarańczowy i niebieski kombinezon), ilustrowane tła z paralaksą i chmurami, kafelki z oświetleniem, przedmioty, skrzynie, bossowie, rekwizyty i wszyscy 19 wrogów rysowani wektorowo w podwójnej rozdzielczości; nowy pasek HUD.
- **Muzyka:** spokojniejsze tempo, miękkie brzmienia (dzwonki, flet), pad z akordami, delikatne arpeggio, pogłos i echo, łagodniejsza perkusja.
- Odświeżone grafiki w `docs/art/`.

## 0.1.1
- **Tryb testera** (do ręcznego sprawdzenia 7 poziomów poza zasięgiem bota): `?debug=1` w adresie albo 5× dotknięcie numeru wersji na ekranie tytułowym → pozycja „TESTER” w menu → mapa ze wszystkimi poziomami odblokowanymi i „god mode” (przełącznik w pauzie). Dane testera idą do osobnego slotu 9. APK z CI bez keystore ma tryb testera włączony domyślnie (`Marioosh-android-tester.apk`).
- Poprawka: w buildzie produkcyjnym klawisz F (atak) przełączał pełny ekran (wykrywanie sceny po nazwie klasy psuło minifikacja).

## 0.1.0 — pierwsze wydanie
- Pełna implementacja projektu z etapu 2 jako gra 2D: 32 poziomy / 8 światów, 19 wrogów, 8 bossów, przewody i warpy, kaucja i licznik opakowań, skamienienie, co-op lokalny, 3 sloty zapisu.
- Platformy: www/PWA, Windows, Linux (Electron), Android, iOS (Capacitor); CI (testy + e2e), GitHub Pages, Release po tagu.
- Języki: pl, en, zh, es, sw, ar (RTL).
- Testy: 309 jednostkowych, bot osiągalności (25/32 poziomów), e2e w Chromium.
- Znane ograniczenia: patrz README → „Stan i ograniczenia”.
