# MARIOOSH & DARIOOSH – BIBLIA GRAFICZNA I DŹWIĘKOWA
## Art direction, zestaw assetów i zasady czytelności, wersja 0.2

## 1. Założenie artystyczne

**Styl:** autorski, barwny pixel art 2D, inspirowany ogólną estetyką gier arcade z końca lat 80. i początku 90., ale bez przejmowania rozpoznawalnych wzorów postaci, ikon, melodii, fontów ani układów poziomów istniejących marek. Kamera boczna. Fantastyka technologiczna z polskim humorem. Wizerunek świata ma być czytelny z normalnej odległości od monitora i na ekranie niewielkiego urządzenia.

**Temat przewodni wizualny:** kable i wtyczki jako fantastyczne drogi, słupy energii jako punkty orientacyjne, zdeformowane rogi jako znak przekleństwa Katoblepasa, butelki PET i puszki jako błyszczące znajdźki. Kolor pomaga, ale nie jest jedyną informacją o funkcji obiektu.

**Proporcje:** kafelek 32 × 32 px, postacie w klatce roboczej ok. 32 × 48 px, zwykli wrogowie 24–48 px, bossowie od ok. 128 do 256 px w zależności od fazy. Wirtualna rozdzielczość 640 × 360; pixel-perfect na skalowaniu całkowitoliczbowym; sprite'y w jednej perspektywie, bez generatywnego rozmycia krawędzi.

## 2. Główni bohaterowie

### Marioosh

- Sylwetka: nieco kwadratowa, szerokie barki, ciężkie buty, większy klucz; przy biegu ramiona pracują energicznie.
- Strój: **pomarańczowy kombinezon** z odblaskowym szwem, **niebieski kask**, grafitowe buty i rękawice. Mały prostokątny identyfikator przy piersi bez marek firmowych.
- Charakter animacji: szybki zryw, lekka bezwładność, wyraźne przygotowanie mocnego uderzenia; celebracja triumfu poprzez obrót kluczem.
- Emocje: pewność siebie przy wejściu, komiczne zdziwienie przy teleportacji, zaciśnięte usta przy rozwiązywaniu zagadki.
- Kształt rozpoznawczy: większy klucz, szerszy kask i pomarańczowy kontur nawet w sylwetce czarnej.

### Darioosh

- Sylwetka: smukła, wyższe kolana przy biegu, większa dynamika skoku, mniejszy klucz; torba z narzędziami porusza się wtórnie.
- Strój: **niebieski kombinezon**, **żółty kask**, jasne wstawki i grafitowe buty; torba narzędziowa na pasku.
- Charakter animacji: sprężysty skok, szybkie krótkie uderzenia, analiza rozdzielni z komicznym przechyleniem głowy.
- Kształt rozpoznawczy: torba, węższy korpus, charakterystyczna żółta plama kasku.

### Osłona i ulepszenia

- Bezpiecznik XL: świecąca ramka błękitno-żółta, ale bez zakrywania koloru stroju. Wersja „osłona” zwiększa grafikę postaci, nie zasłania jej twarzy.
- Cewka: mały generator na ramieniu i niebiesko-białe iskry w dłoni. Kolor ataku musi pozostać odmienny od czerwonego promienia skamienienia.
- Gwiazda Napięcia: pulsujący obrys i krótkie klatki zmian nasycenia zamiast mocnego migotania, które utrudnia widzenie.
- Skamienienie: szary nalot w fazie I, pęknięcia i zwolnienie w fazie II, pełna rzeźba w fazie III. Wskaźnik HUD zawsze pokazuje etap niezależnie od kolorystyki sceny.

## 3. Postacie fabularne

**Scarlet:** księżniczka Lumenii nie musi nosić typowej balowej sukni. Proponowany strój to biało-bordowy płaszcz technomantki, ozdobny pierścień przewodzący światło i kryształowe detale na rękawach. Sylwetka stabilna, wyrazista; nie wymaga agresywnych stereotypów „księżniczki do uratowania”. W finale sama aktywuje osłony i naprawia część sieci. Kolory: karmin, jasny złoty, perłowa biel.

**Katoblepas:** masywny, przygarbiony bykopodobny tyran. Rogi asymetryczne, w kilku miejscach popękane i ze smugami fioletowego światła. Skóra czarna jak wulkaniczny kamień. Oczy czerwone. Mimo grozy powinien być czytelny dla dzieci: brak krwi, realistycznych obrażeń i skrajnie przerażających detali. W fazie III łączy się z mechanicznym pierścieniem Wielkiego Kamienizatora; osiem świecących węzłów musi być jednoznacznie widocznych.

## 4. Przeciwnicy – wspólna zasada graficzna

Każdy sługus ma dwie czytelne cechy: **naturalny kształt gatunku** oraz **przeklęty róg/kolczasty narost**. Atak na słabą strefę ujawnia jej kontrastowy kolor. Przy szarży przeciwnik nie może zmieniać kierunku o 180° bez uprzedniego wyhamowania lub animacji zwrotu. W animacji ostrzegawczej ruch rogów sygnalizuje ryzyko nadepnięcia.

| Stworzenia | Wyróżnik sylwetki | Telegraph ataku |
|---|---|---|
| Roguś, Baranitor, Bykobieg | Nisko osadzony środek ciężkości, masywne rogi | Kopanie ziemi, opuszczanie głowy, kurz |
| Żukoróg, Pszczółrog, Ćmoróg | Pancerz lub skrzydła, zawsze wyraźny punkt wrażliwy | Błysk pancerza albo zmiana ruchu skrzydeł |
| Rogowróbel, Krukoróg | Szerokie skrzydła i rogate czoło | Przerwanie lotu, cień na ziemi |
| Gekoróg, Bazalisk | Wydłużone ciało, łapy do przywierania / świecące oczy | Skurcz tułowia lub narastanie blasku oczu |
| Rogopłetw, Ośmioróg | Wyraźnie odcięty kontur na tle wody | Fala na wodzie albo spiralny ruch macek |
| Kakturożec, Rogopnącze, Rogoróża | Mocne kształty korzeni i cierni | Naprężenie łodygi, rozkwit koloru |
| Ślimoróg, Rogoskoczek, Kamienioróg | Spiralna skorupa, sprężyste nogi, ciężki kamienny korpus | Schowanie rogów, przysiad, pęknięcia |

## 5. Palety światów (proponowane kolory bazowe)

Wartości HEX są propozycją roboczą do art testów; nie stanowią obowiązku kolorystycznego dla każdego piksela.

| Świat | Kolor dominujący | Kolor pomocniczy | Akcent / zagrożenie | Czytelność |
|---|---|---|---|---|
| Lumenia | `#71C878` soczysta zieleń | `#7BCEEC` niebo | `#F5C04A` energia | Świetne rozróżnienie pomarańczu Marioosha i błękitu Darioosha |
| Złomaria | `#9EA7B2` stal | `#D6A16A` rdza | `#F0E14C` magnetyzm | Wrogowie mają ciemniejsze kontury niż tło |
| Florion | `#2D9B73` dżungla | `#E8B65E` piasek | `#F46C7E` ciernie | Rogi nie giną wśród liści – jasna obwódka |
| Aqualis | `#2D80B4` ocean | `#75D4E7` płycizna | `#FFD166` obwody | Kontur pływających wrogów z jasnym pasem |
| Skaltria | `#A58F79` skała | `#D8BC87` pustynia | `#A65CDB` skamienienie | Kamieniorogi odróżnia animowany blask |
| Vespera | `#29345E` granat | `#6979B2` dachy | `#FFE58A` latarnie | Każdy wróg otrzymuje kontrastowy obrys |
| Ferroks | `#5C7381` stal | `#7FB6B1` obwody | `#FF8C58` burza | Zagrożenia odcinają się kształtem od urządzeń |
| Katoblis | `#332B3B` ciemna skała | `#695361` ruiny | `#DB4269` spojrzenie | Każdy bezpieczny grunt ma wyraźną krawędź |

## 6. Świat, tilesety i parallax

- Każda planeta: zestaw 32-pikselowych kafelków podłoża (minimum 24 warianty), trzy zestawy platform, 4–6 elementów interaktywnych, jeden motyw przewodu, 8–12 drobnych dekoracji, 3 warstwy tła.
- Warstwy parallaxu: daleki horyzont (0,2× kamery), budynki/drzewa (0,5×), elementy bliskie (0,8×). Nie przekraczają kontrastu krawędzi kolidujących obiektów.
- **Podłoże grywalne:** czytelna górna krawędź; **platformy jednokierunkowe:** specjalne podparcia / dolny cień; **zagrożenia:** oznaczenie migającym symbolem, nie wyłącznie czerwienią.
- Przewód niebieski: gładki z widocznymi ringami; zielony: liściaste oznaczenia; żółty: symbol lupy; czerwony: znaki ostrzegawcze; fioletowy: gwiazdy i iskry; czarny: spękana osłona z rogami. Wszystkie wejścia o zbliżonych rozmiarach i jednoznacznym kierunku.
- Zwykła rozdzielnia wyjściowa: większa bryła, dźwignia i zielona lampka po aktywacji. Checkpoint: mała skrzynka z błyskiem i zapaloną diodą.

## 7. Efekty i animacje

| Obiekt | Minimalne stany | Minimalna liczba klatek do planowania |
|---|---|---|
| Każdy brat | idle, start, walk/run, hamowanie, skok, spadanie, klucz, trafienie, osłona, skamienienie, teleport, zwycięstwo | ok. 55–75 klatek łącznie / brat |
| Roguś | patrol, ostrzeżenie, doskok, pokonanie | 12–18 |
| Żukoróg | patrol, przewrócenie, ślizg, uderzenie, pokonanie | 18–24 |
| Pozostałe 16 podstawowych wrogów | patrol, ostrzeżenie, atak, przerwa, reakcja | 12–30 / wróg |
| Boss zwykły | oczekiwanie, kilka ataków, odsłonięta słabość, trafienie, pokonanie | 45–90 / boss |
| Katoblepas | faza I, faza II, faza III, finał | osobny plan animacyjny 120–200 |
| PET, puszka, złota puszka | spoczynek, błysk, podniesienie | 4–8 / obiekt |
| Kabel | wyłączony, otwarty, wejście postaci, przejście, blokada | 10–20 / typ |

**Uwaga art-tech:** liczby są orientacyjnymi budżetami. Reużycie części animacji między stanami jest dozwolone, ale każda odmiana wroga musi być rozpoznawalna podczas ruchu. Zbyt ciężkie animacje pierwszych bossów nie mogą opóźniać prac nad fizyką.

## 8. Interfejs i czytelność

Układ 640 × 360 px:

- x=16, y=12: portret i liczba żyć aktywnego brata.
- x=194, y=12: ikona czasu i licznik w sekundach.
- x=308, y=12: PET, puszki oraz łączna liczba opakowań (małe ikony plastik/metal).
- x=484, y=12: kaucja w złotych i punkty (na zmianę przy małym ekranie lub jeden wiersz skrócony).
- Miernik skamienienia: bezpośrednio nad portretem postaci albo w dolnym rogu; zawsze ma numeryczne / graficzne trzy progi.
- Po zebraniu 100 opakowań: krótka animacja dodatkowego życia oraz informacja „100 OPAKOWAŃ = +1 ŻYCIE”, bez blokowania ruchu.
- Tryb kooperacji: dwa portrety po lewej i prawej, wspólna kaucja pośrodku, osobne wskaźniki kamienienia.
- Dialogi z mieszkańcami: jedna krótka dymkowa kwestia na ekran, dodatkowy opis w dzienniku; gracze mogą szybko pominąć animację.

## 9. Efekty dźwiękowe i muzyka

**Oryginalna ścieżka audio**, bez adaptacji melodii istniejących gier. W klimacie chiptune + delikatne syntetyczne akcenty, różne instrumenty cyfrowe dla każdej planety. Melodie zapętlane bez trzasków. Lista zdarzeń audio:

- PET: delikatny plastikowy „klik” + wysoki przyrost tonalny przy serii; puszka: krótki metaliczny „ping”.
- 1-Up: osobna krótka fanfara, inna niż sygnał zwykłego przedmiotu.
- Klucz: swish + stłumione uderzenie; Cewka: krótki puls bez drażniącego piszczenia.
- Teleport: narastające „zzzip” i wyjście wyższą nutą.
- Miernik skamienienia >65: głuchy, powtarzany impuls nie częściej niż raz na sekundę.
- Otwarcie rozdzielni: klik stycznika i krótka sekwencja 3–4 własnych dźwięków.
- Wszyscy bossowie: motyw podstawowy z odmianą przy spadku HP / zmianie fazy.
- Opcje: niezależna głośność muzyki, efektów, dialogów; wyciszenie muzyki w tle i redukcja wysokich częstotliwości.

## 10. Lista referencyjnych assetów do zamówienia lub wykonania

**P0 dla prototypu:** dwa spritesheety braci (idle, bieg, skok, atak, trafienie); Roguś, Żukoróg i Rogomir; 12 podstawowych kafelków Lumenii; PET, puszka, Bezpiecznik XL, Cewka, Zielona Bateria; niebieski, zielony i fioletowy przewód; checkpoint i rozdzielnia; jeden bezpieczny punkt świetlny odklęcia; proste HUD; dziewięć podstawowych dźwięków.

**P1 dla demonstratora:** pełny pierwszy świat (cztery plansze), wszystkie typy podstawowych interakcji, boss z telegraphami, sekretny przewód i komplet trzy posągi/poziom.

**P2 dla kampanii:** osobne tilesety siedmiu kolejnych planet, 16 dalszych wrogów podstawowych, siedmiu bossów, pełne efekty skamienienia i animacje Scarlet oraz Katoblepasa.

## 11. Kryteria odbioru grafiki

1. Wrogowie z rogiem i bez aktywnego rogu są rozróżnialni przy normalnym tempie rozgrywki.
2. Kluczowe obiekty pozostają czytelne na ekranie 1280 × 720 i na ekranie o szerokości 7–8 cali.
3. Żaden pixel-artowy asset nie ma rozmytego konturu po skalowaniu.
4. Kolory przewodów mają także unikalną ikonę, wzór lub teksturę.
5. Kamienne Spojrzenie jest widoczne na tle wszystkich ośmiu planet i nie przesłania przeszkód.
6. Efekty świetlne mają ustawienie ograniczenia błysków; animacje nie wymagają intensywnego migotania.
7. Wszystkie postacie, tła, ikony i muzyka są oryginalne i nie kopiują cudzej własności intelektualnej.
