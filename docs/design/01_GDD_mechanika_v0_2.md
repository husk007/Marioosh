# MARIOOSH & DARIOOSH: KLĄTWA KATOBLEPASA

> **Status (v0.4): dokument historyczny — fizyka, życia, zegar, stomp i szybowanie zostały zastąpione przez `08_NOWA_KONCEPCJA_FIZYKA_v0_4.md`. Nadal aktualne: skamienienie, przewody, opakowania i kooperacja (ze zmianami opisanymi w 08 §6 i `12_IMPLEMENTACJA_v0_4.md`).**
## Game Design Document (GDD), wersja 0.2 – systemy i parametry

**Status:** dokument projektowy do budowy prototypu; wartości liczbowe są założeniami do testów, nie wynikami gotowego balansu.  
**Gatunek:** zręcznościowa platformówka 2D z eksploracją, zagadkami energetycznymi i lokalną kooperacją.  
**Scenariusz:** dwaj bracia elektrycy Marioosh i Darioosh trafiają przez międzyplanetarny przewód na Lumenię. Aby uwolnić księżniczkę Scarlet i pokonać bykopodobnego Katoblepasa, przemierzają osiem planet, uwalniają skamieniałych mieszkańców oraz zbierają butelki PET i puszki.  
**Pełna kampania:** osiem światów × cztery poziomy = 32 plansze; planeta 0 „Prądowo” jako dodatkowa, opcjonalna. Ośmiu bossów, z czego siedmiu strażników planet i finałowy Katoblepas.  
**Docelowi odbiorcy:** dzieci od około 8 lat, rodziny oraz miłośnicy platformówek retro. Ton humorystyczny; bez brutalności i realistycznej elektrotechniki.

---

## A. Zasady nadrzędne i spójność fabularna

1. Każdy poziom musi dać się ukończyć w trybie solo, nawet jeśli pozwala na skróty kooperacyjne. W solo gracz może przełączać aktywnego brata; nieaktywny jest bezpiecznym towarzyszem, a akcje wymagające dwóch osób mają automatyczny odpowiednik.
2. Żaden przedmiot opcjonalny (np. Magnetyczna Wtyczka) nie jest wymagany do ukończenia głównej trasy. W trudniejszych zagadkach istnieje podstawowy przełącznik, alternatywny przewód albo przedmiot zapewniony lokalnie.
3. Skróty między światami są prawdziwymi skrótami. Pominięte fragmenty Kryształu Życia i mieszkańców można później odzyskać poprzez powrót do wcześniejszych planet.
4. **Siedem fragmentów** zdobywa się u bossów światów 1–7; **ósmy** ukryła Scarlet w Sali Tysiąca Posągów (8-3). Zbiór wszystkich ośmiu, ośmiu zapisków Scarlet oraz uwolnienie wszystkich 96 mieszkańców daje pełne sekretne zakończenie. Walkę finałową i podstawowe zakończenie można ukończyć także ze skrótami – urządzenia na arenie można tymczasowo aktywować niezależnie od liczby fragmentów.
5. Katoblepas i jego słudzy stosują **fantastyczną magię skamienienia**. Zagadki z prądem są umowne, a gra nie instruuje gracza w pracach przy instalacjach pod napięciem.
6. „Butelka PET = 0,50 zł, puszka = 0,50 zł” to waluta humorystycznego świata gry, a nie mechanizm prawdziwego zwrotu dowolnego opakowania. W interfejsie nie należy sugerować, że każda znaleziona butelka w rzeczywistym świecie podlega kaucji.

## B. Perspektywa, płynność, sterowanie

- Rendering: grafika 2D o czytelnych pikselowych kształtach i płynnych animacjach; wirtualny obraz 640 × 360 px, skalowany całkowitoliczbowo z letterboxem.
- Kafelek mapy: **32 × 32 px**. Cała geometria, punkty spawnu i strefy kolizji zapisane są w jednostkach świata (px), a narzędzia projektowe prezentują je również w kafelkach.
- Fizyka: **stały krok 60 Hz**, logika niezależna od liczby wyświetlanych klatek. Interpolacja wizualna może działać częściej.
- Kamera: poziom 1-1 prowadzi gracza od lewej do prawej, ale w późniejszych poziomach można się cofać. Wyjątki (ucieczka przed lawą, pościg) są jawnie sygnalizowane.
- Sterowanie: kierunek, skok, bieg, atak, interakcja, kucanie/wejście w przewód, przełączenie brata, pauza. Możliwość zmiany przypisań klawiszy i padów. W grze solo drugi brat może zostać przełączony bez utraty położenia i postępu.
- Responsywność: *coyote time* 100 ms; bufor skoku 120 ms; zmienna wysokość skoku przez wcześniejsze puszczenie przycisku; priorytet ręcznego sterowania nad kontekstowymi akcjami.

### Parametry ruchu – wersja startowa

| Parametr | Marioosh | Darioosh | Uwagi |
|---|---:|---:|---|
| Prędkość chodzenia | 150 px/s | 165 px/s | Docelowa po rozpędzeniu |
| Maksymalna prędkość biegu | 235 px/s | 255 px/s | Z przyciskiem biegu |
| Przyspieszenie na ziemi | 1100 px/s² | 1300 px/s² | Płynne startowanie |
| Przyspieszenie w powietrzu | 650 px/s² | 780 px/s² | Kontrola skoku |
| Hamowanie na ziemi | 1350 px/s² | 1500 px/s² | Zmiana kierunku ma bezwładność |
| Impuls skoku | −420 px/s | −455 px/s | Oś Y dodatnia w dół |
| Grawitacja | 1150 px/s² | 1150 px/s² | Podstawowa |
| Mnożnik grawitacji po puszczeniu skoku podczas wznoszenia | 1,8 | 1,8 | Krótszy skok |
| Maksymalna prędkość spadania | 700 px/s | 700 px/s | Ograniczenie |
| Odbicie po pokonaniu wroga od góry | −310 px/s | −325 px/s | Może być wzmacniane przytrzymaniem skoku |
| Obszar kolizji przy braku osłony | 22 × 30 px | 20 × 30 px | Rozmiar grafiki większy niż hitbox |
| Obszar kolizji z Bezpiecznikiem XL | 24 × 42 px | 22 × 40 px | Większa sylwetka |

**Weryfikacja ruchu:** bez biegu początkujący powinien łatwo przeskoczyć przerwę 2-kafelkową; z rozpędu oba charaktery muszą pokonać na płaskim terenie przerwę 4-kafelkową. Darioosh nie może automatycznie ominąć połowy planszy dzięki skokom, a Marioosh musi nadal docierać do wszystkich obowiązkowych platform. Każdy skok oznaczony jako obowiązkowy testujemy oboma braćmi i na klawiaturze oraz padzie.

### Kamera i punkt kontrolny

- Kamera wyprzedza postać w kierunku ruchu o ok. 64 px; przy pionowych poziomach śledzi także Y.
- Ukończenie odcinka > 45% poziomu uruchamia zwykle jeden checkpoint; w trudnych światach mogą być dwa, jeśli testy wykażą potrzebę. Checkpointy nie zmieniają licznika ukończonych sekretów.
- W trybie dwuosobowym gracze korzystają ze wspólnej kamery. Przy oddaleniu powyżej 11 kafelków kamera zwalnia i pojawia się wskaźnik kierunku; po 14 kafelkach drugi gracz jest bezpiecznie przenoszony w pobliże partnera, a nie zabijany.
- Każdy boss ma checkpoint bezpośrednio przed areną. W trybie podstawowym przegrana w walce zaczyna ją od pierwszej fazy.

## C. Zasady kolizji i obrażeń

**Warstwy kolizji:** 1) twarde podłoże i ściany, 2) platformy jednokierunkowe, 3) gracz, 4) przeciwnicy, 5) pociski graczy, 6) pociski przeciwników, 7) interakcje, 8) promienie skamienienia, 9) opakowania/przedmioty. Elementy ozdobne nie kolidują.

1. **Stomp, czyli pokonanie z góry:** skuteczny tylko jeśli gracz opada z prędkością co najmniej +80 px/s, stopa gracza przecina górną strefę przeciwnika w tej klatce, przeciwnik jest w stanie podatnym na nadepnięcie, a w punkcie styku nie ma aktywnej strefy rogów/kolców.
2. **Rogi:** każdy wróg posiada logiczną strefę *horn_hurtbox*. Przy rogach skierowanych do góry nadepnięcie powoduje obrażenia, chyba że jego opis wskazuje chwilowe schowanie rogów. Strefy z rogami mają pierwszeństwo przed zwykłym stompingiem.
3. **Atak kluczem:** krótkie aktywne okno 0,12 s po fazie przygotowania 0,08 s; zasięg Marioosha 46 px, Darioosha 40 px; czas odnowienia odpowiednio 0,44 s i 0,33 s. Nie „przechodzi” przez ściany.
4. **Pocisk Cewki Iskrowej:** prędkość 310 px/s, do trzech aktywnych na gracza, lot maks. 1,6 s, do dwóch odbić od ziemi; znika przy ścianie lub wrogu. Stwory opancerzone i elektryczne mogą być odporne.
5. **Trafienie gracza:** bez osłony – utrata życia. Z aktywnym Bezpiecznikiem XL – utrata osłony i Cewki Iskrowej, pozostaje podstawowy klucz; 1,3 s nietykalności po trafieniu.
6. **Kontakt z przepaścią / granicą dolną:** natychmiastowa utrata życia. Nie da się jej anulować nietykalnością Gwiazdy Napięcia.
7. **Zderzenia graczy w co-op:** brak blokowania ruchu, aby uniknąć przypadkowego spadania; Braterskie Podbicie działa wyłącznie po wciśnięciu dedykowanej akcji w pobliżu partnera.
8. **Przedmioty:** dotykają ich oba identyczne obszary zbierania 24 px wokół gracza; przeciwnicy nie zbierają ich, poza zaprogramowanym zachowaniem kradnących Krukorogów.

## D. System życia, transformacji i mocy

- Każdy gracz: **3 życia na starcie**. W solo rezerwa żyć wspólna dla obu braci; w lokalnym co-op każdy ma oddzielne życie, ale może być ożywiany kosztem baterii lub partnera. Stan ulepszeń jest oddzielny dla postaci.
- **Bezpiecznik XL**: +1 „warstwa ochronna”; kolejny Bezpiecznik XL przy już aktywnej ochronie daje 1000 punktów, nie kumuluje nieskończonych pancerzy.
- **Cewka Iskrowa**: aktywowana w stanie z Bezpiecznikiem XL; podniesiona bez osłony najpierw zapewnia osłonę, a dopiero następny egzemplarz Cewki daje strzały. Po trafieniu osłona i Cewka znikają.
- **Magnetyczna Wtyczka**: dodatkowe narzędzie z czasem działania 20 s; przyciąga wybrane puszki i żelazne obiekty w promieniu 3 kafelków oraz aktywuje magnetyczne uchwyty. Dostępne obejścia bez narzędzia.
- **Przedłużacz Bojowy**: 15 s, zasięg 4 kafelków; ogłusza wybrane stworzenia na 1,5 s i zaczepia się o oznaczone uchwyty. Nie staje się obowiązkowym narzędziem fabularnym.
- **Rękawice Izolacyjne**: 12 s; ochrona wyłącznie przed oznaczonymi fantastycznymi polami energii.
- **Gwiazda Napięcia**: 12 s nietykalności na standardowych wrogów i promienie; nie chroni przed przepaścią, timerem lub blokadami fabularnymi.
- **Zielona Bateria Życia**: +1 życie do maks. 99; nadmiar zamienia się na 2000 punktów.
- **Lampa Odklęcia**: przedmiot fabularny, dostępny w wyznaczonych stacjach; w solo automatycznie resetuje skamienienie, w co-op gracz może wycelować w skamieniałego partnera.

### Skamienienie: miernik 0–100

- Kontakt z aktywnym promieniem: **+45 pkt/s**. Nie ma natychmiastowego paraliżu po pojedynczej klatce.
- Po wyjściu ze strefy promienia: 0,5 s opóźnienia, następnie −30 pkt/s do zera.
- Przy 35 pkt: pierwsze wizualne ślady kamienia. Przy 65 pkt: −25% prędkości i −20% wysokości skoku. Przy 100 pkt: pełne skamienienie.
- W solo pełne skamienienie kosztuje życie; w kooperacji gracz staje się posągiem na **4 sekundy**, w których partner może go uwolnić. Po upływie 4 s traci życie.
- Po uratowaniu: miernik 0, nietykalność 1,3 s. Gwiazda Napięcia zatrzymuje narastanie miernika.

## E. Ekonomia, punkty i kolekcjonowanie

- **Butelka PET:** 100 pkt i 0,50 zł wyświetlanej kaucji; **puszka:** 150 pkt i 0,50 zł.
- **Złota puszka:** 750 pkt i 2,50 zł; liczy się jako **jedno fizyczne opakowanie** do progu dodatkowego życia (nie pięć). Trzymamy rozdzielone liczniki `package_count`, `deposit_pln_grosze` i `score`.
- **Co 100 fizycznych opakowań** gracz zdobywa +1 życie. Licznik sumaryczny jest trwały, a przekroczenia progu 100, 200, 300 itd. uruchamiają bonus dokładnie jeden raz.
- Opakowania nie są wydawane w sklepie. **EcoPort** „przyjmuje” zawartość plecaka, zwiększa licznik zrealizowanej kaucji i może dać jednorazowy bonus, lecz łączna wartość nie znika ze statystyk gry; do bonusu za 100 liczą się przedmioty kiedykolwiek zebrane.
- Na poziomie standardowym docelowo 20–60 opakowań, w bonusowym 10–30, w bossowym mniej; liczby szczegółowe zawiera atlas 32 plansz.
- **Mieszkańcy:** trzech unikalnych skamieniałych mieszkańców w każdej z 32 głównych plansz = **96** łącznie. Wymagają aktywacji Latarni Scarlet lub lokalnego mikro-obwodu; powtórne przejście nie nalicza już uratowanych osób.
- **Zapiski Scarlet:** po jednym na planetę (8), odkrywane w opcjonalnych komnatach. Do podstawowego zwycięstwa nie są konieczne.
- **Fragmenty Kryształu Życia:** 7 z bossów 1-4…7-4 oraz ósmy z 8-3. Pełne zakończenie wymaga wszystkich.
- Życia, zebrane unikatowe znajdźki i checkpointy zapisujemy atomowo. Nie tracimy postępu kolekcjonerskiego po przegranej walce, ale punkty z nieukończonego fragmentu poziomu wymagają reguły antyduplikacji.

## F. Przewody, sieć i zagadki

### Kolory przewodów

| Kolor | Funkcja | Warunek aktywacji |
|---|---|---|
| Niebieski | Transport w obrębie etapu | Dotarcie do wejścia; kierunek + interakcja |
| Zielony | Komnata bonusowa | Zwykle wejście dostępne od razu, czasami ukryte |
| Żółty | Sekret, rzadkie ulepszenia | Niewidoczna skrzynka lub prosta zagadka |
| Czerwony | Trasa ryzyka | Zwykle dodatkowa nagroda, więcej zagrożeń |
| Fioletowy | Przejście między planetami / Warp Zone | Znalezienie gniazda i uruchomienie obwodu |
| Czarny | Blokada Katoblepasa | Boss, pieczęć lub specjalny węzeł |

- Każdy przewód ma identyfikator źródła i `destination_id`, stan blokady, znacznik jedno-/dwukierunkowy i animację transportu 0,55 s. Podczas teleportu postać nie otrzymuje obrażeń i nie można ponownie wywołać teleportu.
- Wejścia wymagają świadomej interakcji: nie można przypadkowo wpaść w przewód, idąc po podłodze.
- Każdy obwód ma od dwóch do pięciu elementów: źródło, przewody, przekaźniki/zwrotnice, odbiornik. Kolory i symbole wspólnie oznaczają stan (nie polegamy tylko na barwie).
- Zagadki na głównej drodze: maksymalnie trzy operacje w światach 1–2, do pięciu w światach 3–6, do siedmiu w światach 7–8. Porażka nie niszczy wymaganych części ani nie tworzy miękkiego zablokowania (*softlock*).
- Inna postać może przytrzymać przełącznik w co-op, ale w solo przełącznik ma zatrzask czasowy albo towarzysz aktywuje go po interakcji kontekstowej.

## G. AI przeciwników – wspólny kontrakt

Wszystkie stworzenia używają maszyny stanów: `idle/patrol → alert → windup → attack → recovery → patrol`; w razie potrzeby także `stunned`, `shell`, `petrifying`, `defeated`. Każdy niebezpieczny atak posiada widoczny sygnał przed aktywacją: animację, błysk, dźwięk i ruch rogów. Przeciwnicy daleko poza kamerą mogą przechodzić w uproszczoną symulację, ale nie wolno im teleportować się do gracza bez sygnalizacji.

Wstępne wartości liczbowe i zasady odporności wszystkich 18 podstawowych przeciwników znajdują się w **03_BESTIARIUSZ_parametry_v0_2.json**. Główna reguła: wrogowie z rogami skierowanymi do góry nie są podatni na nadepnięcie; pozostałych można pokonywać skokiem, jeśli mają aktywną strefę słabości.

**Przykłady interakcji:** Baranitor szarżuje w Rogusie i strąca go z platformy; Żukoróg, trafiony od spodu, przewraca się i można go odepchnąć jak pocisk; Krukoróg zabiera pozostawioną puszkę do gniazda; Bazalisk ostrzega błyskiem oczu przed promieniem; Kakturożec odbija standardową Cewkę, ale może zostać pokonany przez odbity pocisk środowiskowy.

## H. Bossowie i scenariusze walk

| Boss | Arena i fazy | Logika pokonania |
|---|---|---|
| Rogomir (1-4) | Szarża → wbicie rogów w osłonę → 2 s odsłoniętego brzucha | Trzy cykle trafienia w brzuch; po każdym rośnie tempo |
| Złomotaur (2-4) | Opancerzona szarża, zrzucanie złomu, magnes | Aktywować dwa dźwigi (nie jednocześnie), zerwać pancerz i trzykrotnie trafić pieczęć |
| Kaktogór (3-4) | Ciernie i pnącza, trzy korzenie | Odłączyć trzy korzenie; trafić odsłonięty rdzeń trzykrotnie |
| Rogopłetw Wielki (4-4) | Podwodny promień, wiry i śluzy | Ustawić lustra, odbić trzy promienie w kamienne oko |
| Ceratopsor (5-4) | Szarża, fale od tupnięć, głazy | Trzy razy zwabić we wzmocnioną ścianę, zaatakować odkryty bok |
| Krukoróg Królewski (6-4) | Podmuchy, zrzuty kamieni, lot ponad areną | Włączyć reflektory w odpowiednim momencie; po lądowaniu trzykrotnie trafić znamię |
| Rogodron (7-4) | Lot, drony, okresowe wyłączenie platform | Wyłączyć trzy generatory; zniszczyć rdzeń w krótkim oknie odsłonięcia |
| Katoblepas (8-4) | Faza 1: szarża/filary; 2: spojrzenie/lustra; 3: maszyna/8 węzłów | Rozbić filary, odbić trzy promienie, aktywować osiem węzłów i uwolnić Scarlet |

**Dostępność:** po trzech przegranych przy konkretnym bossie pojawia się opcjonalna wskazówka, a po pięciu – opcjonalny trening jego pierwszego ataku. Nie zmienia to wyniku ani klasycznego trybu trudności.

## I. Tryby gry i zasady powrotu

**Solo:** gracz kontroluje jednego brata, drugi jest „towarzyszem technicznym”; w czasie zmiany postaci towarzysz zajmuje bezpieczne sąsiednie miejsce. Jest nienarażony na losowe obrażenia i nie może blokować przejść. Mapa prowadzi do tych samych zakończeń co kooperacja.

**Co-op lokalny:** dwie osoby w jednej sesji i na jednym ekranie; obaj aktywni. Wspólne: opakowania, postęp, uwolnieni mieszkańcy i fragmenty. Osobne: liczba żyć i bieżące ulepszenia. Ożywienie partnera po zwykłej utracie życia przy najbliższym punkcie kontrolnym kosztuje jedno życie jego puli lub zapasową baterię drugiego gracza; brak trwałego utknięcia.

**Zapis:** po ukończeniu poziomu, odkryciu przewodu i checkpointach (stan bieżącej planszy). Trzy sloty. Dziennik sekretów i procent ukończenia planet. Żadnej płatnej waluty, mikropłatności ani losowych skrzynek.

**Zakończenie zwykłe:** pokonany Katoblepas, uratowana Scarlet, powrót do elektrowni. **Sekretne:** wszystkie 96 posągów uwolnione + 8 zapisków Scarlet + 8 fragmentów kryształu; dodatkowa scena z wiadomością Scarlet. **Nocna Zmiana:** tryb odblokowany po pierwszym ukończeniu gry, szybsze AI, trudniejsze rozmieszczenie przeciwników, ale bez sztucznego wydłużenia animacji.

## J. Oprawa, HUD, komunikaty

- Forma: oryginalne, czytelne sylwetki 2D; nie kopiować bohaterów, znaków, melodii ani układów plansz z chronionych gier. Motyw przewodów, transformatorów i rogatych ekosystemów ma budować własną rozpoznawalność.
- Marioosh: pomarańczowy kombinezon, niebieski kask, masywna sylwetka, klucz; Darioosh: niebieski kombinezon, żółty kask, smukła sylwetka, torba narzędziowa.
- HUD: góra lewa – aktywny brat i życia; góra środek – licznik czasu; góra prawa – PET, puszki, wartość kaucji, punkty. Przy promieniu pojawia się osobny miernik skamienienia. W co-op dwa portrety i dwa paski stanu.
- Priorytet animacji: ruch (idle 6, bieg 8, skok 2, spadanie 2), klucz 5, teleport 8, trafienie 4, skamienienie 6, radość po poziomie 6. Te liczby są celami produkcyjnymi, nie ograniczeniami silnika.
- Audio: każda planeta własny krótki motyw, boss osobny wariant, odnajdywanie sekretów krótki fanfarowy akcent, puszka metaliczna, butelka plastikowa, przewód – puls elektroniczny. Kompozycje oryginalne.
- Dodatkowe ustawienia: wyłączenie błysków, redukcja drgań kamery, rozróżnienie typów przedmiotów również ikoną i kształtem, regulacja głośności SFX/muzyki, napisy, remap klawiszy.

Pełny art brief znajduje się w **04_BIBLIA_GRAFICZNA_v0_2.md**.

## K. Techniczna struktura scen i danych (propozycja)

Projekt można realizować w **Godot 4.x** lub równoważnym silniku 2D. Ten dokument nie narzuca sztywno silnika; kluczowa jest separacja danych plansz, jednostek AI i stanu gry.

Struktura logiczna:

- `GameSession`: stan slotu, świat, poziom, punkty, kaucja, uratowani mieszkańcy, fragmenty, ustawienia trudności.
- `PlayerController`: sterowanie, fizyka, zmiana rozmiaru, atak, wskaźnik skamienienia.
- `PlayerEquipment`: bezpiecznik, cewka, przedłużacz, rękawice, gwiazda, lampa.
- `EnemyController`: wspólna maszyna stanów i indywidualne akcje sterowane danymi bestiariusza.
- `CableTransport`: walidacja przewodu, docelowy punkt spawnu, animacja, zabezpieczenie przed pętlą.
- `CircuitPuzzle`: węzły, źródła, przełączniki, odbiorniki, sygnalizacja rozwiązania.
- `CollectibleManager`: unikalne identyfikatory znajdziek, antyduplikacja, próg 100 opakowań.
- `LevelDirector`: spawny, punkty kontrolne, trzy posągi, bonusy, wyjście, wyzwania.
- `BossDirector`: fazy, checkpoint przed walką, wyraźne telegraphy ataków.
- `HUD` i `SaveManager`: spójne wyświetlanie oraz atomowy zapis, z obsługą starszych formatów zapisów.

Identyfikatory poziomów: `W1-L1`…`W8-L4`; sekretna planeta: `W0`. Każdy wpis w danych poziomu ma unikalny `level_id`, długość w kafelkach, segmenty, listę przeciwników, trzy statuy, wejścia/wyjścia przewodów, checkpointy, skrytkę i warunek ukończenia. **02_ATLAS_32_POZIOMOW_v0_2.md** opisuje komplet 32 poziomów; **05_LEVELS_v0_2.json** daje szkielet danych do edytora poziomów, ale nie jest jeszcze pełną tilemapą.

## L. Definicja ukończenia / kryteria akceptacji

1. Wszystkie 32 poziomy dają się ukończyć dowolnym z dwóch braci w trybie solo bez wymaganego przedmiotu opcjonalnego.
2. Każda z 96 statuetek ma unikalny identyfikator i daje się uwolnić tylko jeden raz na zapis gry.
3. Każdy z 18 typów przeciwników sygnalizuje niebezpieczny atak i respektuje reguły hitboxów, odporności i skamienienia.
4. Każde przejście przewodem ma poprawny punkt docelowy, możliwość powrotu, jeśli wymaga tego poziom, oraz zabezpieczenie przed zakleszczeniem w geometrii.
5. Licznik PET/puszek, punktów, kaucji i fizycznych opakowań nie ulega podwójnemu naliczaniu przy checkpointach, śmierci lub wczytaniu gry.
6. Co-op działa z dwiema klawiaturami / klawiaturą i padem / dwoma padami w docelowej konfiguracji, bez zabijania graczy przez kamerę.
7. Bossa da się pokonać zgodnie z widoczną wskazówką i czytelną telemetrią, bez przypadkowego trafienia spoza kadru.
8. Pełne i zwykłe zakończenie dają się uzyskać zgodnie z warunkami, w tym po użyciu Warp Zone i późniejszym powrocie do pominiętych światów.
9. Gra utrzymuje docelową płynność na sprzęcie docelowym, ma skalowalną grafikę i remap sterowania.

## M. Następny krok implementacyjny

Najpierw wykonać **vertical slice 1-1 + 1-2 + boss 1-4**: dwie postacie, ruch, kolizje, jeden rodzaj teleportu, PET/puszka, Żukoróg/Roguś, jedno uwolnienie posągu, zapis, prosty system walki i trzy cykle Rogomira. Rozszerzenie do 32 plansz następuje dopiero po potwierdzeniu, że skok, kamera i walka są satysfakcjonujące. Lista prac jest w **06_ROADMAP_v0_2.md**.
