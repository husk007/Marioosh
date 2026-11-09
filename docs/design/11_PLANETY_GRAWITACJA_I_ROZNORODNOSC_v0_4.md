
# Marioosh & Darioosh — Planety, grawitacja i różnorodność 32 etapów (v0.4)

**Data:** 2026-11-09. **Status:** obowiązujący kierunek do implementacji, nie gotowa funkcja. Dokument uzupełnia GDD v0.4, Atlas 32 poziomów v0.4 oraz plan migracji v0.4.

## 1. Decyzja: osiem planet ma osiem innych doświadczeń

W grze nie wystarczy zamienić palety i nazwy tła. Każda planeta musi mieć własną architekturę, ukształtowanie, materiały, światło, akustykę, rytm eksploracji, mechanizm techniczny i cechy przeciwników. W obrębie jednej planety cztery etapy mają być odróżnialne po budowie przestrzeni, nie wyłącznie po wystroju. Rezygnujemy z jednego szablonu: wzgórza, seria platform, skocznia, przepaść, boss.

Nie wracać do modelu Sonic/Rayman. Bracia są ludźmi-elektrykami: nie toczą się, nie szybują, nie wykonują wall-jumpów, nie odbijają się od magicznych sprężyn. Pionowość wyjaśniają schody, windy, drabiny, podciąganie na krawędziach, rusztowania, mechanizmy, rzeczywista architektura oraz teleportacja przewodowa.

## 2. Grawitacja planet

Bazowa skala: 40 px = 1 metr; referencyjna grawitacja Ziemi 9,8 m/s² = 392 px/s², skok Marioosha z -140 px/s, Darioosha z -150 px/s. Na danej planecie grawitacja jest **stała i przewidywalna**; wartości są kompromisem realizmu i grywalności, nie pomiarami rzeczywistych planet.

| Planeta | g względem Ziemi | g px/s² | Skok Marioosha | Skok Darioosha | Odczucie |
|---|---:|---:|---:|---:|---|
| Lumenia | 0,98 | 384,2 | 0,64 m | 0,73 m | prawie ziemska |
| Złomaria | 1,09 | 427,3 | 0,57 m | 0,66 m | cięższe lądowanie |
| Florion | 0,91 | 356,7 | 0,69 m | 0,79 m | nieco dłuższy lot |
| Aqualis | 1,02 | 399,8 | 0,61 m | 0,70 m | bliska ziemskiej; w wodzie wyporność |
| Skaltria | 1,14 | 446,9 | 0,55 m | 0,63 m | największy ciężar |
| Vespera | 0,86 | 337,1 | 0,73 m | 0,83 m | lekki, płynniejszy skok |
| Ferroks | 1,06 | 415,5 | 0,59 m | 0,68 m | lekko cięższy ruch |
| Katoblis | 0,95 | 372,4 | 0,66 m | 0,76 m | trochę lżejszy ruch |
| Prądowo (bonus) | 1,00 | 392,0 | 0,63 m | 0,72 m | ziemski punkt odniesienia |

Wzory: h = v0² / (2 × 392 × mnożnik g) / 40 metrów; lot na równym terenie = 2 × |v0| / (392 × mnożnik g). Na Vesperze Darioosh przebywa w powietrzu około 0,89 s, na Skaltrii około 0,67 s. **Żaden standardowy skok nie przekracza 0,9 m**, mimo zmian między planetami.

Grawitacja wpływa na wysokość skoku, czas lotu, tempo opadania, amortyzację i siłę upadku. **Nie** należy mnożyć nią prędkości biegu ani przyspieszenia w poziomie wprost jeden do jednego, bo sterowanie stałoby się irytujące. Może subtelnie zmieniać wrażenie przyczepności. Zmiana planety nie powinna powodować odruchu ponownej nauki całego sterowania.

Aqualis: osobny model wody (wypór, opór, prąd, aparaty oddechowe i komory z powietrzem); podwodny ruch nie może być po prostu skokiem przy mniejszym g.

Wymogi osiągalności: obie postacie bez ulepszeń, przy lokalnym g, na każdej planszy. Obowiązkowe skoki preferencyjnie 1,2–1,8 m, przy dobrej widoczności. Obowiązkowy skok 2,0 m dopuszczalny jedynie z wyraźnym rozbiegiem i zapasem czasu; dalsze luki wymagają pomostu lub obejścia. Każde piętro >1,7 m ponad stopy ma schody, drabinę, podest, windę, podciągnięcie lub portal. Nie dodawać sztucznej siły wyrzucającej człowieka 10 m w górę.

## 3. Język wizualny i unikalny sposób gry każdego świata

| Świat | Konstrukcja i widok | Kolory i materiały | Dominująca czynność | To NIE jest… |
|---|---|---|---|---|
| Lumenia | świetlisty las i małe przyjazne rozdzielnie, drewniane domy i kładki | jasnozielony, bursztynowy, cyjan; mech, drewno, ceramika | odkrycie, podłączanie obwodów | Florionem: roślinność nie poluje na gracza |
| Złomaria | stare analogowe sortownie, hałdy, suwnice, złomowiska | rdza, ochra, grafit; blacha, stare pasy | sortowanie i odbudowa mostów z belki | Ferroks: tu wszystko jest zużyte, ręcznie naprawiane |
| Florion | agresywna roślinna dżungla, suchy kanion, ogrody i oranżeria | nasycona zieleń, amarant, złoto; liście, kora, pnącza | sterowanie światłem i oczyszczanie korzeni | Lumenią: natura jest dynamiczna i niebezpieczna |
| Aqualis | wyspy, port, zatopione komory, zbiorniki pomp, spiralna latarnia | turkus, granat, koral; mokry kamień, mosiądz | śluzy i poziom wody | ciągiem tych samych podwodnych korytarzy |
| Skaltria | skalna pustynia, jaskinie, kamieniołom, wykuta twierdza | piaskowiec, ochra, bazalt; skały, żwir, pylące osłony | osłony, przekierowywanie głazów, geologia | Złomarią: to naturalna skała, nie odpad |
| Vespera | nocne miasto, wieża, gniazda na dachach, obserwatorium | indygo, srebro, ciepłe lampy; cegła i szkło | światło, ukrywanie, obserwacja lotu | Ferroks: cicha noc, a nie przemysł |
| Ferroks | precyzyjna fabryka, osłonięte pomosty, reaktor, hala Rogodrona | stalowy niebieski, cyjan, miedź; kompozyt i serwa | synchronizacja maszyn i odłączanie zasilania | Złomarią: nowoczesna automatyka, nie złom |
| Katoblis | ruiny wielkiego miasta, przewodowy węzeł, monumentalna galeria i tron | popiół, fiolet klątwy, rubin; popękany kamień | odklęcie mieszkańców i węzły energii | Skaltrią: tu skamienienie to tragedia cywilizacji |

Każda planeta ma osobny daleki landmark: drzewa Lumenii, kominy Złomarii, korony Florionu, latarnia Aqualis, strome bazalty Skaltrii, księżyc Vespery, reaktor Ferroksu i tron Katoblisu. Nie robić tego samego krajobrazu w ośmiu kolorach. Osobne odgłosy kroków, wiatr, pogłos, odległe maszyny, dźwięki roślin i wody. Charakterystyka światła różni się tak samo jak geometria.

## 4. Unikalny układ przestrzenny każdego z 32 etapów

| Poziom | Architektura/topologia | Charakter etapu |
|---|---|---|
| W1-L1 | jasna dolina z dwoma rozwidleniami | pierwsze odłączniki, łagodna eksploracja |
| W1-L2 | ciasna sieć tuneli z pętlami i szybami | nawigacja i teleporty |
| W1-L3 | ciąg mostów nad otwartą doliną | obsługa mechanizmu mostu |
| W1-L4 | centralna hala i trzy boczne generatory | Rogomir, sterowanie osłonami |
| W2-L1 | tarasowe składowisko i serpentyny transportowe | odzyskiwanie i krótkie zagrożenia |
| W2-L2 | trzykondygnacyjny obieg sortowania | zwrotnice i taśmy |
| W2-L3 | otwarty plac wokół głównej suwnicy | ustawianie stalowych belek |
| W2-L4 | dwie równoległe drogi dźwigowe do jednej hali | zdejmowanie pancerza Złomotaura |
| W3-L1 | górna pętla w koronie gigantycznych drzew | wspinanie, pnącza i mostki |
| W3-L2 | wąski serpentynowy kanion z oazą | osłony przed kaktusami |
| W3-L3 | promienisty ogród z centrum świetlnym | regulacja kilku luster |
| W3-L4 | pierścieniowa oranżeria z rdzeniem | odcinanie korzeni Kaktogóra |
| W4-L1 | połączone wyspy i pomosty | port, most zwodzony |
| W4-L2 | zatopiony dworzec, pętle suchych komór | woda i kieszenie powietrza |
| W4-L3 | trzy wielkie zbiorniki połączone śluzami | zmienny poziom wody |
| W4-L4 | spiralna latarnia, galeria wokół rdzenia | Rogopłetw i ciśnienie wody |
| W5-L1 | dwie rozgałęzione ścieżki doliny | lawina i schronienia |
| W5-L2 | groty z centralnym skrzyżowaniem trzech odgałęzień | Bazalisk i osłony przed wzrokiem |
| W5-L3 | otwarta misa kamieniołomu otoczona kolejką | kierowanie głazami |
| W5-L4 | podkowiasta skalna twierdza i dziedziniec | Ceratopsor i zasuwy |
| W6-L1 | sieć ulic + dostępne schodami dachy | światło lamp i patrole ptaków |
| W6-L2 | wysoka wieża z centralnym szybem | naprawa windy i wspinanie |
| W6-L3 | kilka zamkniętych pętli dachów i gniazd | odzysk puszek i ostrożne przejścia |
| W6-L4 | koliste obserwatorium z obwodową galerią | reflektory Krukoroga |
| W7-L1 | długa hala z trzema równoległymi pasmami serwisowymi | zasilanie maszyn |
| W7-L2 | sieć krótkich korytarzy i osłoniętych mostów | burza i cykle elektryczne |
| W7-L3 | pierścienie wokół pionowego rdzenia reaktora | trzy przekaźniki i winda |
| W7-L4 | duża hala prób z bocznymi stanowiskami | trzy rdzenie Rogodrona |
| W8-L1 | porozbijana siatka ulic i piwnic | schronienia przed kamiennym deszczem |
| W8-L2 | centralny węzeł i odnogi terminali | logiczna sieć teleportacji |
| W8-L3 | monumentalna galeria z atrium i balkonami | uwalnianie posągów |
| W8-L4 | sekwencja zamkowych komnat, finałowy tron | osłony, lustra, osiem węzłów Katoblepasa |

**Ważne:** nie narzucać wszystkim etapom mechanicznie trzech pasm (dolna, środkowa, górna). Niektóre będą pierścieniem, inne spiralą, siecią tuneli, wieżą, otwartym placem lub połączonymi dachami. Pionowość ma powód architektoniczny. Różnorodność ma dotyczyć także rytmu gry, rodzajów pomieszczeń i kadrów, nie tylko nazw mechanik.

Sekwencja 4 etapów świata ma zmieniać funkcję: pokazanie tożsamości miejsca, opanowanie jego systemu, odmienne wykorzystanie systemu w nowej przestrzeni, boss łączący wcześniejsze doświadczenia. Nie powtarzać identycznego zestawu elementów w podobnej kolejności.

## 5. Kontrakt dla implementacji i testów

- Jeden profil per world id 0–8, w rodzaju PLANET_PHYSICS[world].gravityMultiplier; BASE_GRAVITY = 392; effectiveGravity = BASE_GRAVITY * gravityMultiplier.
- World / Room przekazuje grawitację do stepMovement; nie ma kilku niezależnych stałych g w różnych funkcjach. Aktualizować ją przy wejściu do świata lub teleportacji, nie w środku skoku.
- Wrogowie i bossowie korzystają z g planety dla ruchu naziemnego; specjalne loty i ataki nie mogą unieważniać jej przyczynowości.
- Skala gracza 68–70 px, przejście portalu 90 px, krótki skok do 0,9 m, dystanse między krawędziami obliczane osobno na planetę.
- Automatycznie: test grawitacji 0–8, maksymalnych skoków M/D, lądowania, upadków, przechodniości 32 map na danej g i braku softlocku w teleportach.
- Manualnie: rozpoznawalność świata ze zrzutu ekranu bez HUD; czy dwa kolejne etapy różnią się architekturą i czynnością; czy na Vesperze czuć niższą g, na Skaltrii wyższą, bez nadludzkich ruchów. Wymagane rozpoznanie minimum 7 z 8 planet w kontroli artystycznej.
- W pionowym prototypie obok W1-L1/W1-L2 sprawdzić skrajne g: mały fragment Vespery 0,86g i Skaltrii 1,14g.
- Przebudowy map nie łączyć z automatyczną aktualizacją old levelgen2: stary generator jest projektowany dla super-skoku i nie może definiować nowego układu.

**Kryterium ukończenia:** osiem różnych planet, 32 rozpoznawalne typy plansz i ani jedna postać tocząca się jak Sonic lub wyskakująca jak gumowa piłka. Sama zmiana mnożników i palet nie realizuje zadania.
