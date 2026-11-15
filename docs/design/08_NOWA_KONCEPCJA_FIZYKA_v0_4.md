
# Marioosh & Darioosh — NOWA KONCEPCJA v0.4
## Nowoczesna przygodowo-zręcznościowa platformówka 2D w ludzkiej skali
**Status:** projekt zmiany do implementacji. **Data:** 2026-11-09.
**Zastępuje kierunek mechaniczny opisany w:** 07_PRZEBUDOWA_PIONOWA_v0_3.md.
**Zachowuje:** historię, nazwy i wygląd zatwierdzonych postaci, braci-elektryków, księżniczkę Scarlet, Katoblepasa, 8 planet, 32 etapy, mieszkańców, kolekcjonowanie PET/puszek, przewody i 8 bossów.

**Obowiązuje równolegle:** [11_PLANETY_GRAWITACJA_I_ROZNORODNOSC_v0_4.md](11_PLANETY_GRAWITACJA_I_ROZNORODNOSC_v0_4.md) — planetarna grawitacja, odrębny charakter ośmiu światów, 32 odmienne topologie i testy balansu. W razie różnicy z wcześniejszymi szablonami poziomów pierwszeństwo mają reguły nowego dokumentu.

## 0. Decyzja projektowa
Marioosh i Darioosh są ludźmi, dobrymi elektrykami, nie superbohaterami. Nie toczą się jak kule; nie szybują w powietrzu; nie odbijają od pionowych ścian; nie wykonują „ground pound”; nie skaczą przez kilkanaście metrów po trampolinie. Poruszają się naturalnie i sprawnie: chodzą, biegną, skaczą, przyklękają, podciągają się na krawędziach, przechodzą po kładkach i wspinają po drabinach. Świat jest fantastyczny, a urządzenia nie, więc może zawierać teleportację, żywe rośliny i energię odklęcia — ale ciało elektryka podlega rozsądnej fizyce.

Gra nie jest symulatorem BHP i nie powinna być powolna. To **płynna, precyzyjna, współczesna platformówka 2D z eksploracją, walką i zagadkami środowiskowymi**. Gracz ma zdobywać wysokość *dzięki architekturze*, nie sztuczkom postaci. Poziomy opowiadają historię miejsca i mają powiązane przestrzennie pomieszczenia.

**Nie kopiować stylistyki poziomów ani mechanik Sonic, Rayman czy dawnych Mario.** Nie tworzyć odcinków do automatycznego sprintu, łańcuchów przedmiotów unoszących się w powietrzu, wyskoczni dających 10–13 kafli wysokości ani przypadkowych przepaści.

## 1. Skala świata i widok
- Kafelek logiczny: 32 × 32 px = 0,8 × 0,8 m umownej przestrzeni świata; 40 px = 1 m.
- Wzrost dorosłego człowieka w świecie: 68–72 px (1,70–1,80 m). Obecne 30–42 px było zbyt małe w stosunku do otoczenia. Rozmiar sylwetki graficznej może być nieco większy od hitboxu przez włosy i kask.
- Hitbox stojący Marioosha: 26 × 70 px; Darioosha 24 × 68 px. Tryb osłony nie zmienia rozmiaru ciała. Przysiad/przeciskanie przez tunel: wysokość ok. 43–45 px.
- Rozdzielczość logiczna może początkowo pozostać 640 × 360 px, z większymi sprite'ami i kamerą pokazującą około 16 × 9 m; przy wersji HD skalować render z odpowiednim filtrowaniem. Unikać sztucznej deformacji postaci.
- Typowa izba / pomieszczenie: 12–28 kafli szerokości, 10–22 kafli wysokości. Większy kompleks: 3–7 takich połączonych obszarów.
- Współczynnik paralaksy: daleki plan 0,1–0,2, środkowy 0,35–0,6, elementy rozgrywki 1,0. Dekoracja nie może wyglądać jak aktywna platforma, jeśli nie ma kolizji.

## 2. Docelowa fizyka gracza (60 Hz)
**Wszystkie wartości są pierwszym zestawem do strojenia w grywalnym prototypie.** Grawitacja 392 px/s² jest punktem odniesienia odpowiadającym Ziemi. W rozgrywce należy stosować mnożnik właściwy dla każdej planety z dokumentu 11. Nie są docelowymi pomiarami laboratoryjnymi, lecz spójną skalą gry.

| Parametr | Marioosh (M) | Darioosh (D) | Uzasadnienie |
|---|---:|---:|---|
| wysokość hitboxu | 70 px | 68 px | dorosły człowiek, a nie figurka jednego kafelka |
| szerokość hitboxu | 26 px | 24 px | różna budowa |
| szybki marsz | 76 px/s | 84 px/s | sprawne przemieszczanie się |
| bieg | 168 px/s | 184 px/s | około 4,2–4,6 m/s, bez superprędkości |
| przyspieszenie na ziemi | 520 px/s² | 600 px/s² | rozpęd około 0,31–0,32 s |
| hamowanie suche podłoże | 620 px/s² | 700 px/s² | reakcja czytelna, bez natychmiastowego stopu |
| korekta w powietrzu | 120 px/s² | 145 px/s² | ograniczona kontrola skoku, bez zmiany kierunku o 180° |
| prędkość skoku początkowa | -140 px/s | -150 px/s | jeden zwykły skok, bez wieloskoków |
| grawitacja | 392 px/s² | 392 px/s² | około 9,8 m/s² w przyjętej skali |
| wysokość normalnego skoku | około 25 px = 0,63 m | około 29 px = 0,72 m | wysokość stóp, nie głowy |
| lot przy maksymalnym skoku | około 0,71 s | około 0,77 s | płynne, ludzkie |
| wspinanie po drabinie | 48 px/s | 54 px/s | stosunkowo szybka gra, ale nie teleport |
| przysiad / przeciskanie | 38 px/s | 42 px/s | ograniczony ruch |
| coyote time | 0,08 s | 0,08 s | tolerancja sterowania |
| bufor skoku | 0,10 s | 0,10 s | przyjazność sterowania |

Wzory obowiązkowe: wysokość skoku h = v²/(2g); czas pełnego lotu na równym podłożu t = 2|v|/g. Oznacza to, że 13-kafelkowy wyskok obecnego silnika (ponad 10 m przy nowej skali) jest niedopuszczalny.

- Krótszy skok po wcześniejszym puszczeniu przycisku: podczas wznoszenia tymczasowo zwiększyć grawitację 1,7–1,9×. Nie zatrzymywać postaci w powietrzu, nie dopisywać szybowania.
- Przy lądowaniu wymagaj krótkiej amortyzacji 80–130 ms (animacja kolan), ale **nie blokuj** zwykłego sterowania przez długi czas.
- Minimalny przewidywalny automatyczny krok na nierówności: max 10–12 px (0,25–0,30 m), jeśli jest wolna przestrzeń nad głową. Większe przeszkody wymagają wspięcia.
- Przeskok typowej szczeliny na głównej trasie: zalecane max 64–80 px (1,6–2,0 m) z rozsądnym rozbiegiem; do 96 px (2,4 m) tylko jako wyraźnie opcjonalne wyzwanie z bezpiecznym obejściem. Nigdy nie projektować obowiązkowej luki na granicy matematycznego zasięgu.
- Nie ma automatycznego rozpędzania grawitacyjnego na stoku; bieg po lekkim spadku może dać max +10% prędkości, bez pędu-kuli.
- Powierzchnie: drewno/kamień/beton standardowe; lód mniejsze tarcie i dłuższy hamulec; olej wymusza ostrożny chód i może poślizgnąć, ale nie jest przyspieszaczem; piasek redukuje maksymalną prędkość o ok. 25%. Zbocza do 20–26° to chodzenie; bardziej strome to krawędź/teren wymagający uchwytów lub obejścia.
- Upadki: do ok. 1,2 m zwykłe lądowanie; 1,2–2,4 m krótkie potknięcie/utrata kontroli, od 2,4 m obrażenia; przy głębszych szybach ratunek przez checkpoint. Nie wymagać zeskakiwania z wysokości 4–8 m.
- Crouch/duck: schowanie się za osłoną, wejście w niski kanał, unik pod pociskiem; **nie uruchamia rolling**.
- Zamiast „big form” od Bezpiecznika XL osłona wokół bohatera; rozmiar, kolizja i zdolności poruszania bez zmian.

## 3. Realistyczna pionowość — siedem sposobów zdobywania wysokości
1. **Schody i pochylnie**: szerokie, osadzone w architekturze; przejście po 1–3 kondygnacjach.
2. **Drabiny i kratownice serwisowe**: logiczne miejsca — ściany rozdzielni, wieże, zbiorniki, suwnice; możliwość zejścia i wejścia.
3. **Podciąganie na krawędzi**: przytrzymanie akcji przy osiągalnym brzegu, jeśli są wolne dłonie. Top krawędzi najwyżej ok. 1,5–1,7 m nad stopami w momencie próby; animacja podciągania 0,45–0,65 s. Nie działa na gładką ścianę bez półki.
4. **Przeskakiwanie niskich przeszkód / vault**: podciągnięcie przez skrzynię, rurę, mur o wysokości 0,3–1 m — osobna animacja, bez „stomp”.
5. **Windy, platformy towarowe, podnośniki**: ruch 50–90 px/s, czytelny mechanizm i przystanki. Dźwignia wywołuje ruch; urządzenia mają podstawę fizyczną.
6. **Ruchome mosty, żurawie, kładki oraz krótkie tyrolki**: z kotwami i asekuracją, zwykle wymagają uruchomienia obwodu. Nigdy nie wyrzucają postaci balistycznie.
7. **Terminale przewodów**: teleportacja przez pełnowymiarowe wrota/gniazda przewodowe o wysokości >=90 px, z wyraźnym wejściem i miejscem wyjścia. Energia transportuje braci, nie wciskają się fizycznie w cienki przewód.

Wysoki świat jest logicznie połączoną budowlą. Pomiędzy dwiema kondygnacjami zawsze istnieje drabina, winda, schody, sprzęt do wejścia albo teleport. Nie układać na środku powietrza samotnych półek w odstępach 4 m.

## 4. Tożsamość i zdolności braci
**Marioosh:** mocniejszy, przydatny przy zablokowanych ręcznych zaworach, przepychaniu cięższych wózków, naprawie mechanicznych elementów, utrzymaniu dźwigni. Nie rozbija podłogi ciałem. Przy przenoszeniu dużego akumulatora zwalnia, nie może podciągać się za krawędź bez odłożenia ładunku.
**Darioosh:** bardziej zwinny, szybciej programuje przekaźniki, sprawdza sekwencje połączeń, posługuje się miernikiem, obsługuje małe drony serwisowe i manipulatory. Nie odbija się od ścian, nie szybuje.
**Obaj:** zwykły skok, drabina, podciągnięcie, niskie przejście, pływanie wyłącznie w odpowiednim sprzęcie, podstawowe panele, przesuwanie lekkich obiektów i bezpieczna obrona.

**Zasada dostępności:** obowiązkowa ścieżka jest przechodnia przez każdego brata samodzielnie. Wyjątkowy talent może skrócić drogę lub otworzyć sekret. W trybie solo przełączenie brata jest wygodne, ale nigdy nie powoduje softlocka; w co-op czynności mogą odbywać się równolegle, dając przewagę czasową, nie blokując postępu.

## 5. Walka i przeciwnicy
Bohaterowie to elektrycy, nie wojownicy. Standardowy przeciwnik ma czytelne trzy stany: **patrol → ostrzeżenie (0,4–1,0 s) → atak → odzyskiwanie równowagi**. Rogi, kolce, pazury mają sens. Nadepnięcie na rogate zwierzę NIE służy do ataku. Nie projektować systemu eliminacji „skacząc na głowy”.

- Klucz nastawny: krótki atak obronny, odrzucenie, przerwanie szarży po odczytaniu sygnału. Trafienie w skażony punkt może zdjąć skorupę.
- Cewka: fantastyczny impuls ogłuszający, ograniczona energia, regenerowana przez punkty ładowania; przy odpowiednim użyciu rozprasza magiczną klątwę. Nie jest to realistyczny poradnik porażania zwierząt prądem.
- Otoczenie: zasłony, drzwi, zwrotnice, zasuwy, wentylatory, reflektory, lustra i dźwigi mogą pomóc unieszkodliwić wroga.
- Opcja bez walki: część patroli można obejść górną kładką, tunelem lub przez odcięcie zasilania pułapki.
- Nadzór nad walką: maksimum 2–3 aktywne zagrożenia w podstawowym kadrze (poza kontrolowanym finałem); spójna animacja ostrzeżenia. Kamera nie powinna pokazywać wroga dopiero podczas trafienia.
- Kamienne Spojrzenie: działa przez wyraźnie zaznaczoną linię widzenia, można za nią schować się za fizyczną osłoną albo reflektorem. Tempo skamienienia rośnie wraz z poziomem trudności; kontrola zawsze pozostawia czas na reakcję.

## 6. Narzędzia, przedmioty, obrażenia, postęp
- Nie robić grzyba „powiększającego elektryka”. Bezpiecznik XL to osłona absorpcji jednego trafienia; nie zmienia gabarytów.
- Rękawice, magnes i cewka pomagają w zagadkach i obronie; wzmocnienia nie dają swobodnego lotu.
- PET i puszki są naturalnie umieszczone: w pojemnikach, magazynach, gniazdach, przy EcoPortach, w szczelinach wraków, nie w idealnych łukach nad przepaścią. Kaucja motywuje do eksploracji; nie narzuca drogi głównej. Podstawowe opakowania warte po 0,50 zł, złota puszka zostaje fantastycznym znaleziskiem.
- Zmienić archaiczne 100 opakowań = +1 życie na **wartość odzyskanej kaucji, wynik i zasoby do napraw**. EcoPort bankuje odzysk; opcjonalne premie: szybsze uzupełnienie energii, punkty, kosmetyka. Brak „kupowania życia”.
- Nowoczesny checkpoint: 3 punkty zdrowia (plus osłona), ponowienie od najbliższego bezpiecznego punktu, bez limitu klasycznych „żyć”. Minimalizować karę za eksplorację; utracone niezaksięgowane opakowania można odzyskać w miejscu niepowodzenia (lub nie odbierać ich w łatwym trybie). Każda plansza ma 2–3 bezpieczne checkpointy, przed bossem obowiązkowy.
- Nie wyświetlać globalnego odliczania czasu na zwykłych etapach. Tylko lokalne sekwencje (np. otwarty most przez 15 s), jasno zapowiedziane i z możliwością ponowienia.
- W wodzie wymagany jest moduł oddechowy albo bliskość kieszeni powietrznych; ruch powolny, bez podwodnego dasha. Wodny świat nie może trwać przez kilkanaście minut ciągłego nurkowania bez uzasadnienia.

## 7. Budowa nowoczesnej planszy — przestrzeń, nie tor przeszkód
**Zastępujemy generator przypadkowych sekwencji** modelem architektury reżyserowanej: każda plansza jest siecią 4–7 ręcznie zaprojektowanych mikroobszarów, połączonych wejściami, windami, drabinami, mostami i przewodami. Deterministyczne wariacje mogą rozmieszczać dekoracje i wybrane przedmioty, nie zmieniają głównego układu.

Plan każdej planszy musi zawierać:
1. **Motyw miejsca** — dlaczego w środku jest fabryka, most, kopalnia lub oranżeria? Jak wygląda jej konstrukcja?
2. **Cel** — co elektrycy mają naprawić/odłączyć, aby otworzyć dalszą drogę?
3. **Różne, uzasadnione architektonicznie topologie zamiast obowiązkowych trzech pasm**. Niektóre etapy mają antresole, inne pierścień wokół rdzenia, spiralę latarni, układ otwartych wysp, jaskiniowe odnogi lub siatkę dachów. Kondygnacje powinny wynikać z budowli i zróżnicować się między 32 etapami.
4. **Pętlę i rozgałęzienie** — przynajmniej jeden opcjonalny skrót lub sekret prowadzący z powrotem do głównej drogi, nie bezsensowny ślepy korytarz.
5. **Jedną nową zasadę** — zademonstrowaną bez ryzyka, potem używaną w wyzwaniu i zremiksowaną w końcówce.
6. **Realistyczne źródło wysokości** — schody, drzewa, klatki, platformy, windy, kotwy, przewody.
7. **Czytelność ryzyka** — szerokie pola widzenia, sygnały ostrzegawcze, brak ukrytych przepaści pod interfejsem i kolizji z dekoracją.
8. **Odwiedzalne miejsca mieszkańców** — osadzone fabularnie, nie losowo rozrzucone na wysokościach skoków.
9. **Punkt kontrolny i bezpieczne wyjście** — nie blokowane wymaganym przedmiotem z nieodwracalnego skrótu.

Sugerowany graf przestrzenny:
```
                           [GÓRNA KŁADKA / SEKRET]
                         ↗          ↓ [DRABINA]
[WEJŚCIE] → [DZIEDZINIEC] → [ROZDZIELNIA] → [MOST/BRAMA] → [CEL]
                    ↓              ↑
             [SERWIS / TUNELE] → [WINDA]
```
Każda gałąź ma powód istnienia. Pionowość nie wymaga przepaści w każdym kadrze: można wspinać się na dach rozdzielni, obejść poziom systemem serwisowym, zejść do tunelu i wrócić windą na górę.

**Zasady wymiarowania:** pomieszczenie ma >= 80 px wysokości nad drogą stojącego człowieka; niskie przejścia 43–55 px tylko z animacją przeciskania; odległość skoku głównego <= 80 px; półka oddzielona o piętro wymaga realnego połączenia; drzwi, windy i portale minimum 90 px wysokości. Miejsca kolizji i interakcji odznaczyć obrysem lub podświetleniem niezależnie od tła.

## 8. Kamera i tempo
- Kamera podąża płynnie, stabilizuje pion; środek kadru lekko przed bohaterem (lookahead ok. 60–100 px zgodnie z kierunkiem biegu).
- Martwa strefa ok. 25% szerokości / 20% wysokości. Dla wspinania lekkie oddalenie albo pionowe przesunięcie, aby zobaczyć kolejny podest i cel wejścia.
- Unikać drastycznych snapów, trzęsienia ekranu i gwałtownego zoomu; ustawienie dostępności ograniczające efekty.
- Przed pułapką zagwarantować widoczność i czas na reakcję co najmniej 0,8–1,2 s przy maksymalnym biegu.
- Gra ma rytm **zwiedzanie → obserwacja → manipulacja/krótka akcja → nagroda → kolejna przestrzeń**. Odcinki spokojne przeplatają się z dynamicznymi. Nie wymagać ciągłego sprintu przez całą planszę.
- Przewidywany czas pierwszego przejścia zwykłego etapu 6–12 min, etapu bossa 8–15 min; czas zależy od eksploracji, bez presji globalnego zegara.

## 9. Oprawa HD i animacje adekwatne do ruchu
Obowiązują zatwierdzone, oryginalne wizerunki Marioosha (pomarańczowy kombinezon, niebieski kask), Darioosha (niebieski kombinezon, żółty kask), Scarlet (rude włosy, białobordowy strój), Katoblepasa i dwunożnych bossów. Bez powrotu do pixel artu.

Utrzymać widok gry 2D side-on, gładką ilustrację ręcznie malowaną z miękkim cel-shadingiem. Warianty animacji obu braci: idle, walk, run, stop, change direction, takeoff, rise, apex, fall, landing knees, crouch/crawl, vault, ledge grab, pull-up, ladder, lift ride, interact panel, carry toolbox/battery, tool defense, recoil, petrify, rescue, victory. Nie generować rolling ball, gliding, ground pound, wall jump, high launch from spring.

Interaktywne tło jest związane konstrukcyjnie z otoczeniem. Wysokości, perspektywa i krawędzie przejść muszą pasować do stojącej postaci. Warstwy paralaksy tworzą głębię, ale nie są fałszywymi platformami.

## 10. Bossowie — starcie z maszyną/otoczeniem, nie skoki na głowę
Areny mają szerokość 18–30 m, przynajmniej jedną osłonę, jedną czytelną interakcję, punkt kontrolny przed wejściem i 2–3 logiczne fazy. Ruch bossów odpowiada ich sylwetkom, chociaż ich moce mogą być fantastyczne.

| Świat | Boss | Zwycięstwo oparte na scenografii i mechanizmie |
|---|---|---|
| 1 Lumenia | Rogomir (dwunożny rogat y żuk) | Odcinanie 3 zasilających przewodów, wyłączanie pola osłony, użycie przekaźnika |
| 2 Złomaria | Złomotaur (dwunożny metalowy byk) | Sterowanie suwnicą i magnesem, zdejmowanie pancerza, uziemienie pieczęci |
| 3 Florion | Kaktogór (roślinny humanoid) | Sterowanie światłem i wodą, usuwanie skażonych korzeni, odsłonięcie serca |
| 4 Aqualis | Rogopłetw Wielki (dwunożny humanoid wodny) | Wrota śluzowe, obieg ciśnienia, lustra chroniące przed spojrzeniem |
| 5 Skaltria | Ceratopsor (dwunożny rogat y gad) | Trwałe osłony, zwabienie szarży w przygotowaną kolumnę, wyłączenie pieczęci |
| 6 Vespera | Krukoróg Królewski (dwunożny ptasi władca) | Reflektory, sterowanie nawiewem, bezpieczne podejście do kryształu |
| 7 Ferroks | Rogodron (dwunożny mechaniczny owad z 4 skrzydłami) | Awaryjne odłączniki 3 generatorów, przerywanie ataku dronów, odblokowanie rdzenia |
| 8 Katoblis | Katoblepas | Osłony przeciw spojrzeniu, zwierciadła i aktywacja 8 Węzłów Energii |

## 11. Kryteria akceptacji nowego stylu rozgrywki
- Żaden brat na żadnej planecie nie wykonuje skoku > 0,9 m od ziemi bez urządzenia, a urządzenie nie zastępuje fizyki ludzkiej samym przyspieszeniem balistycznym.
- Nie ma rolling, gliding, wall-jump, ground-pound ani super-szybkich pętli.
- Główna trasa każdego etapu jest osiągalna bez ręcznego wybierania idealnego momentu na maksymalny skok.
- Każda obowiązkowa zmiana wysokości o > 1,7 m ma uzasadniony element dostępu.
- Gracz widzi zagrożenie z wyprzedzeniem; żadna niespodzianka z dekoracji nie powoduje natychmiastowego zgonu.
- Co najmniej jedna realna alternatywna trasa oraz jeden powrót/pętla w zwykłym poziomie.
- Dwa różne, ale pełnoprawne sposoby przejścia większości zadań: sprawna naprawa albo obejście.
- Każda grafika czynności postaci pasuje do jej anatomii i wyposażenia.
- Gra po 10 minutach ma być kojarzona z eksploracją, serwisem, przewodami i Katoblepasem — nie z bieganiem i skakaniem po cudzych schematach platformowych.

## 12. Definicja gotowego prototypu
Najpierw W1-L1, W1-L2, W1-L4 w nowym stylu. Wersję v0.3 utrzymywać na main, dopóki nowa gałąź nie przejdzie testów; nie zmieniać samej fizyki przy starych mapach, bo powstaną poziomy niemożliwe do przejścia.
