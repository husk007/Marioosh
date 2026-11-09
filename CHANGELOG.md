# Zmiany

## Niewydane — v0.4 „platformer w ludzkiej skali” (prototyp, gałąź `v0.4-human-scale`)
- **Nowa skala i fizyka:** 40 px = 1 m, skok 0,6–0,9 m, auto-krok 0,3 m, przeskok i chwyt krawędzi, drabiny, upadki z progami (potknięcie / rana), kucanie. Usunięto szybowanie, odbicie od ściany, toczenie, uderzenie w ziemię i sprężyny.
- **Grawitacja per planeta** (0,86–1,14 g, `PLANET_PHYSICS`).
- **Zasady gry:** HP 3 + tarcza, **bez żyć, game over i zegara**, bez przeskoku na głowę wrogów; przepaść = −1 HP i powrót na ostatnie bezpieczne miejsce; kaucja tylko z opakowań. HUD z trzema sercami.
- **Poziomy projektowane ręcznie** (ASCII + logika): drzwi i terminale pełnej wielkości, windy z postojem, schody 26°. Gotowe: **W1-L1…L4**, cały świat **Złomaria (W2-L1…L4)** oraz cały świat **Aqualis (W4-L1…L4)**. Pozostałe 20 oznaczonych WIP na mapie.
- **Rogomir** przeprojektowany: trzy generatory zdejmują pancerz, szarża wolniejsza od biegu, ciągły pomost-schron (przejście nad bossem, drabiny przy ścianach, utknięcie 5,5 s), skala ×1,5.
- **Woda (Aqualis):** prawdziwe pływanie z wyporem (bez sterowania unosisz się ku powierzchni, po dnie się nie chodzi), **powietrze 20 s** z paskiem pęcherzyków w HUD (≤ 6 s miga na czerwono, po wyczerpaniu −1 HP co 1,6 s), wyskok z wody na pomost, drabiny w wodzie, „dzwony” i suche komory z powietrzem, zawory zmieniające poziom wody (`flood`) i opuszczane mosty (`span`).
- **W1-L3 „Mosty Wysokiego Napięcia”:** kanion o trzech mostach na różnych wysokościach; każdy działa inaczej (wciągarka na pomoście pod mostem, wagonik linowy, rozdzielnica na szczycie słupa).
- **Złomaria — cztery różne poziomy:** W2-L1 tarasowe wzgórza z dwiema równoległymi trasami (dół: tunel z Baranitorami i niszami; góra: deskowy chodnik), W2-L2 trzypiętrowa sortownia (prasa blokuje tunel, dźwignia na dachu, pomost inspekcyjny, trzy zwrotnice naprawiają butelkomat i otwierają skarbiec), W2-L3 magazyn belek (trzy przepaście, trzy sposoby ułożenia belki), W2-L4 fort z bossem **Złomotaurem** (dwa pulpity suwnicy w oknie 14 s, wagonik, bez skakania po głowie).
- **Aqualis — cztery różne poziomy:** W4-L1 archipelag z mostami zwodzonymi, W4-L2 zatopiony dworzec (komory powietrzne, trzy bezpieczniki), W4-L3 zakład pomp (zawory spuszczają/napełniają zbiorniki), W4-L4 latarnia i nowy boss **Rogopłetw Wielki** (woda go chroni; zawór osusza basen, w którym stoi).
- **Testy:** analizator przejezdności z pływaniem i rachunkiem powietrza (limit 15 s pod wodą z rzędu), testy negatywne mechanik wody (bez zaworu/dźwigni/bezpiecznika wyjście niedostępne), testy walki z Rogopłetwem. Nowy analizator przejezdności oparty na prawdziwym kontrolerze ruchu (bez trybu „god”) dla obu braci, testy negatywne, testy walki z Rogomirem; testy v0.3 przeniesione do `tests/legacy/`.
- Dokumentacja: `docs/design/08–12` (specyfikacja v0.4 i stan implementacji), `07` oznaczony jako historyczny.

## 0.3.0 — przebudowa pionowa („Sonic / Rayman”)
- **Płaski bieg w prawo zastąpiono wysokimi poziomami z ruchem w górę i w dół.** Wszystkie 32 poziomy zaprojektowano od nowa nowym generatorem (`levelgen2.ts`): zbocza 45° i 26°, rozpęd i skocznie, wspinaczka po kratkach i linach, sprężyny, zrzuty i zjazdy, lód/olej/piasek, trasy górne.
- **Nowa fizyka braci:** szybowanie, ślizg po ścianie, łapanie krawędzi, toczenie, pływanie w 8 kierunkach, pionowa kamera. Marioosh: uderzenie w ziemię (rozbija pęknięte posadzki), kratka męczy go po ok. 3 s. Darioosh: odbicie od ściany, dłuższe szybowanie, kratka bez limitu.
- **Sekrety zależne od brata** w każdym poziomie biegu: kapsuła tylko dla Marioosha, szyb tylko dla Dariooosha, trasa górna dla obu.
- **Wieża W6-L2** przebudowana na etapy (schody, kratka, sprężyna) z testami dla obu braci.
- **Podpowiedzi** do nowych mechanik (6 języków), pokazywane przy pierwszym napotkaniu elementu.
- **Testy:** bot osiągalności przechodzi 31 poziomów osobno jako Marioosh i Darioosh (62 testy); testy sekretów, zboczy, wieży, podpowiedzi — łącznie ponad 410 testów.
- **Art Station / grafika:** nowa kategoria „mechanics” (10 zasobów) i 16 nowych póz braci w kolejce produkcji; opis w `docs/design/07_PRZEBUDOWA_PIONOWA_v0_3.md`.
- Znane ograniczenia: brak pełnych pętli (zbocza do 45°), wieża testowana etapami (nie botem end-to-end), nowe elementy rysowane proceduralnie do czasu wygenerowania grafik, balans do sprawdzenia w grze.

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
