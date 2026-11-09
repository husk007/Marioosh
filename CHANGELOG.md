# Zmiany

## Niewydane — v0.4 „platformer w ludzkiej skali” (prototyp, gałąź `v0.4-human-scale`)
- **Nowa skala i fizyka:** 40 px = 1 m, skok 0,6–0,9 m, auto-krok 0,3 m, przeskok i chwyt krawędzi, drabiny, upadki z progami (potknięcie / rana), kucanie. Usunięto szybowanie, odbicie od ściany, toczenie, uderzenie w ziemię i sprężyny.
- **Grawitacja per planeta** (0,86–1,14 g, `PLANET_PHYSICS`).
- **Zasady gry:** HP 3 + tarcza, **bez żyć, game over i zegara**, bez przeskoku na głowę wrogów; przepaść = −1 HP i powrót na ostatnie bezpieczne miejsce; kaucja tylko z opakowań. HUD z trzema sercami.
- **Poziomy projektowane ręcznie** (ASCII + logika): drzwi i terminale pełnej wielkości, windy z postojem, schody 26°. Gotowe: **W1-L1…L4**, cały świat **Złomaria (W2-L1…L4)**, cały świat **Florion (W3-L1…L4)**, cały świat **Skaltria (W5-L1…L4)**, cały świat **Ferroks (W7-L1…L4)**, cały świat **Vespera (W6-L1…L4)** cały świat **Aqualis (W4-L1…L4)** oraz cały świat **Katoblis (W8-L1…L4)** — wszystkie 32 poziomy v0.4 są grywalne.
- **Rogomir** przeprojektowany: trzy generatory zdejmują pancerz, szarża wolniejsza od biegu, ciągły pomost-schron (przejście nad bossem, drabiny przy ścianach, utknięcie 5,5 s), skala ×1,5.
- **Woda (Aqualis):** prawdziwe pływanie z wyporem (bez sterowania unosisz się ku powierzchni, po dnie się nie chodzi), **powietrze 20 s** z paskiem pęcherzyków w HUD (≤ 6 s miga na czerwono, po wyczerpaniu −1 HP co 1,6 s), wyskok z wody na pomost, drabiny w wodzie, „dzwony” i suche komory z powietrzem, zawory zmieniające poziom wody (`flood`) i opuszczane mosty (`span`).
- **W1-L3 „Mosty Wysokiego Napięcia”:** kanion o trzech mostach na różnych wysokościach; każdy działa inaczej (wciągarka na pomoście pod mostem, wagonik linowy, rozdzielnica na szczycie słupa).
- **Złomaria — cztery różne poziomy:** W2-L1 tarasowe wzgórza z dwiema równoległymi trasami (dół: tunel z Baranitorami i niszami; góra: deskowy chodnik), W2-L2 trzypiętrowa sortownia (prasa blokuje tunel, dźwignia na dachu, pomost inspekcyjny, trzy zwrotnice naprawiają butelkomat i otwierają skarbiec), W2-L3 magazyn belek (trzy przepaście, trzy sposoby ułożenia belki), W2-L4 fort z bossem **Złomotaurem** (dwa pulpity suwnicy w oknie 14 s, wagonik, bez skakania po głowie).
- **Aqualis — cztery różne poziomy:** W4-L1 archipelag z mostami zwodzonymi, W4-L2 zatopiony dworzec (komory powietrzne, trzy bezpieczniki), W4-L3 zakład pomp (zawory spuszczają/napełniają zbiorniki), W4-L4 latarnia i nowy boss **Rogopłetw Wielki** (woda go chroni; zawór osusza basen, w którym stoi).
- **Florion — cztery różne poziomy:** W3-L1 pętla przez korony drzew (pnącza, kruszące się gałęzie, korzenie), W3-L2 zygzak czterech tarasów kanionu z kolczastymi bramami, W3-L3 trzykondygnacyjna szklarnia z **promieniem światła** (okno w dachu → trzy obrotowe lustra, E → panel słoneczny otwiera bramę; druga droga: korba na dachu; kanał z pływaniem i podziemny ogród ze złotą puszką), W3-L4 pierścień oranżerii z galeriami i kolczastymi dołami. Nowy moduł `src/game/beam.ts` (tor promienia, czysta funkcja) i test rozwiązywalności zagadki (dokładnie jedno ustawienie luster).
- **Kaktogór** przeprojektowany: trzy korzenie (dwa przy ziemi, jeden na półce) odcięte kluczem zdejmują pancerz; trafienie w serce sprawia, że korzenie odrastają (3 trafienia, bez skakania po głowie).
- **Skaltria — trzy różne poziomy:** W5-L1 dolina z osuwami skalnymi (ostrzeżenie 1,8 s, chroni nawis; dolny tunel jako alternatywa), W5-L2 jaskinie ze wspólnym węzłem i trzema odnogami (brama wymaga dwóch zasilań z trzech; kolejka kopalniana, galeria), W5-L3 kopalnia z kulami na torach (zwrotnica na tarasie kieruje kulę na rumowisko — jej uderzenie otwiera bramę; półki-schrony nad drogą). Nowe elementy silnika: `slide` (osuw) i `boulder` (kula na torze).
- **Skaltria — czwarty poziom:** W5-L4 Twierdza Ceratopsora (dźwignia pieczęci na galerii zdejmuje pancerz, boss utyka w kolumnach i dopiero wtedy jest podatny; bez skakania po głowie).
- **Ferroks — cztery różne poziomy (1,06 g):** W7-L1 Fabryka Rogatych Maszyn (hala o trzech pasmach serwisowych — parter z taśmami i **tłokami w rytmie**, antresola, galeria; przepaść prasy zmusza do antresoli, hala montażowa to łańcuch dwóch przekaźników i bram, odłącznik zatrzymuje końcowe prasy), W7-L2 Burza Energetyczna (**teren otwarty**: dziedzińce, osłonięte stacje, **wysuwane mosty** na dźwignię, wyładowania z ostrzeżeniem 1,5 s i przerwą ≥ 4 s, dolna trasa pod burzą albo górna kładka), W7-L3 Reaktor Bez Dna (przepaście bez dna, **most na czas 8 s** z ostrzeżeniem, ruchome pomosty zasilane stacjami, rdzeń z pierścieniami i **trzema przekaźnikami w kolejności** uruchamiającymi windę), W7-L4 Hala Rogodrona (dwa podesty operatora i platforma środkowa, trzy generatory w oknie 28 s, boss krąży pod sufitem, zrzuca złom i wypuszcza drony, rdzeń odsłania się na 7 s). Nowe elementy silnika: cykliczne zagrożenia `arc` (tłok / prasa / błyskawica, ostrzeżenie, wyłączanie odłącznikiem), most na czas (`span.timed`), przekaźniki w kolejności (`gate` o nazwie `ord…`), drony-strażnicy (patrol → sygnał → nurkowanie → lądowanie).
- **Vespera — cztery różne poziomy:** W6-L1 Nocne Dachy (**światło jako strefa bezpieczeństwa**: ptaki nie nurkują na kogoś w poświacie lampy lub zapalonej latarni; ulice, trzy kamienice, trasa dolna przez mieszkania i górna po dachach i pomostach), W6-L2 Wieża Chmur (przekrój wieży, **zasilana winda** w szybie centralnym — dwa bezpieczniki; boczne piętro na rusztowaniu), W6-L3 Gniazda Rogoptaków (niebo nad miastem: zadaszenia na mostach, trzy pętle z różnym wejściem na dach — winda, rampa + ruchomy pomost, kruche konary; nieczynna latarnia ze złotą puszką), W6-L4 Obserwatorium Krukoroga (trzy reflektory w oknie 8 s oślepiają bossa, trzy trafienia kluczem). Nowe elementy silnika: `lit` (strefy światła w AI ptaków), winda z zasilaniem (`power`)."
- **Katoblis — cztery różne poziomy (0,95 g):** W8-L1 Deszcz Kamieni (kamienne miasto: **głazy spadające w kolumnach** z cieniem i pyłem 1,2 s przed uderzeniem — łuki i zadaszenia są schronami; zawór w piwnicy otwiera zawaloną ulicę; kule na ulicy), W8-L2 Wielki Przewód (**sieć teleportacji** z 5 pokoi: trzy portale ze znakami, błędny portal wraca do bezpiecznej stacji albo do ślepej stacji z zapasami; cztery przekaźniki w kolejności ⚡ → ☾ → liść → ★ odblokowują drzwi do hali wyjściowej), W8-L3 Sala Tysiąca Posągów (trzy odcinki: nawa, sala balkonów z windą serwisową i drabinami, taras z Wielką Latarnią Scarlet; **trzy obwody** i **brama otwierana uwolnieniem wszystkich trzech mieszkańców-posągów**; archiwum z ósmym fragmentem kryształu), W8-L4 Tron Katoblepasa (dziedziniec, dwupiętrowa rozdzielnia, Galeria Luster z Bazaliskami — balkon jest poza ich strefą rażenia — i arena: trzy filary, trzy lustra, osiem Węzłów Energii na czterech galeriach; boss bez ciosów kluczem).
- **Silnik (świat 8):** rodzaj `rock` w `arc`, bramy `free…` (otwierane uwolnionymi mieszkańcami), przekaźniki w kolejności (`ord…`) z zerowaniem przy pomyłce, drzwi zamknięte odblokowywane bramą `…:warpgate`, znaki portali nad drzwiami (⚡/☾/liść/★), **↑ wchodzi w drzwi pełnej wielkości** (zgodnie z podpowiedzią — wcześniej tylko „użyj”/↓).
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
