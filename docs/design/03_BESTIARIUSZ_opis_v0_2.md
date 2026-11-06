# MARIOOSH & DARIOOSH – BESTIARIUSZ
## Parametry 18 podstawowych przeciwników, wersja 0.2

Wartości są startowe; każda istota musi mieć rozpoznawalny sygnał przed atakiem. Na planszy nie spawnować wrogów bezpośrednio na graczu.

## EN01. Roguś
**Typ:** ssak / fantastyczne stworzenie · **HP:** 1 · **Prędkość:** 55 px/s · **Punkty:** 100 · **Światy:** 1, 2, 3
**AI i ataki:** Patroluje 4–10 kafelków; przy ścianie zawraca, gdy wyczuje gracza może przyspieszyć do 85 px/s.
**Zapowiedź ataku:** Unosi rogi i prycha przed krótkim doskokiem. (czas przygotowania 0,3 s)
**Nadepnięcie:** tak, gdy rogi są odchylone na boki. **Klucz:** 1 trafienie. **Cewka:** 1 trafienie.
**Stany AI:** patrol → alert → lunge → defeated.
**Ważna reguła:** Pierwszy przeciwnik do nauki ataku kluczem i skoku.

## EN02. Baranitor
**Typ:** ssak · **HP:** 2 · **Prędkość:** 45 px/s · **Punkty:** 250 · **Światy:** 2, 5, 7
**AI i ataki:** Widzi gracza w linii 7 kafelków; po ostrzeżeniu szarża 235 px/s przez maksymalnie 7 kafelków; po uderzeniu w ścianę 1,5 s ogłuszenia.
**Zapowiedź ataku:** Kopie kopytem i odchyla głowę na 0,55 s przed szarżą. (czas przygotowania 0,55 s)
**Nadepnięcie:** nie podczas szarży; tak podczas ogłuszenia. **Klucz:** od tyłu lub ogłuszony, 2 trafienia. **Cewka:** 1 trafienie od tyłu po szarży.
**Stany AI:** patrol → alert → charge → stunned → recovery.
**Ważna reguła:** Może rozbić kruchą ścianę lub wbiec w innych wrogów.

## EN03. Bykobieg
**Typ:** ssak · **HP:** 3 · **Prędkość:** 40 px/s · **Punkty:** 400 · **Światy:** 5, 8
**AI i ataki:** Ciężka szarża 250 px/s, niszczy kruche przeszkody; po zderzeniu ze ścianą pada na kolano na 2 s.
**Zapowiedź ataku:** Głośny ryk, kurz spod kopyt i ostrzeżenie strzałką szarży. (czas przygotowania 0,7 s)
**Nadepnięcie:** nie. **Klucz:** od boku podczas ogłuszenia, 3 trafienia. **Cewka:** tylko odsłonięty bok po kolizji.
**Stany AI:** patrol → windup → charge → stunned → recovery.
**Ważna reguła:** Służy do zagadek niszczenia ścian, nie jako zwykły mur HP.

## EN04. Żukoróg
**Typ:** owad · **HP:** 2 · **Prędkość:** 43 px/s · **Punkty:** 250 · **Światy:** 1, 2, 7
**AI i ataki:** Pełznie po powierzchni; po trafieniu w pancerz przewraca się na 2,3 s, można odepchnąć jako pocisk 280 px/s.
**Zapowiedź ataku:** Staje na tylnych odnóżach i pochyla pancerz. (czas przygotowania 0,4 s)
**Nadepnięcie:** nie przy aktywnym rogu; tak po odwróceniu. **Klucz:** najpierw przewrócenie, potem trafienie w brzuch. **Cewka:** 2 trafienia w odsłonięty brzuch.
**Stany AI:** patrol → defend → flipped → shell_slide → defeated.
**Ważna reguła:** Pancerz może pokonywać wrogów, ale odbity zagraża braciom.

## EN05. Ćmoróg
**Typ:** owad · **HP:** 1 · **Prędkość:** 70 px/s · **Punkty:** 150 · **Światy:** 1, 3, 6
**AI i ataki:** Lata sinusoidalnie wokół światła, co 3,8 s wykonuje nurkowanie w kierunku gracza.
**Zapowiedź ataku:** Zmienia kolor skrzydeł i zatrzymuje lot na 0,45 s. (czas przygotowania 0,45 s)
**Nadepnięcie:** tak po lądowaniu; nie w nurkowaniu. **Klucz:** 1 trafienie w zasięgu. **Cewka:** 1 trafienie.
**Stany AI:** fly → windup → dive → land → defeated.
**Ważna reguła:** W ciemności sygnalizowany kontrastową obwódką.

## EN06. Pszczółrog
**Typ:** owad · **HP:** 1 · **Prędkość:** 95 px/s · **Punkty:** 200 · **Światy:** 2, 3, 6, 7
**AI i ataki:** Patrol w ósemkę, 0,5 s zawieszenia i atak w linii 130 px/s; odpoczywa 0,8 s.
**Zapowiedź ataku:** Buczenie wzmacnia się, a żądło błyska. (czas przygotowania 0,5 s)
**Nadepnięcie:** nie, kolec na grzbiecie. **Klucz:** 1 trafienie przy odpoczynku. **Cewka:** 1 trafienie.
**Stany AI:** patrol → windup → dash → rest → defeated.
**Ważna reguła:** Przyciąga wzrok, nie wolno robić kilku ataków bez przerwy.

## EN07. Rogowróbel
**Typ:** ptak · **HP:** 1 · **Prędkość:** 82 px/s · **Punkty:** 150 · **Światy:** 1, 4, 6
**AI i ataki:** Krąży między punktami i nurkuje z góry przy wejściu gracza w strefę 5 kafelków.
**Zapowiedź ataku:** Krótko skrzeczy i składa skrzydła. (czas przygotowania 0,45 s)
**Nadepnięcie:** tak po lądowaniu, gdy chowa rogi. **Klucz:** 1 trafienie. **Cewka:** 1 trafienie.
**Stany AI:** fly → prepare_dive → dive → land → defeated.
**Ważna reguła:** Obowiązuje minim. 1 s przerwy między nurkowaniami.

## EN08. Krukoróg
**Typ:** ptak · **HP:** 2 · **Prędkość:** 68 px/s · **Punkty:** 350 · **Światy:** 6
**AI i ataki:** Lata nad półkami; zrzuca kamień co 4 s; może zabrać 1 niepodniesioną puszkę do lokalnego gniazda.
**Zapowiedź ataku:** Krąży dwa razy, po czym głośno kracze; cień kamienia pada 0,6 s przed uderzeniem. (czas przygotowania 0,6 s)
**Nadepnięcie:** tylko po lądowaniu. **Klucz:** 2 trafienia po lądowaniu. **Cewka:** 2 trafienia.
**Stany AI:** patrol → pickup → drop_rock → land → defeated.
**Ważna reguła:** Skradziona puszka zawsze zostaje do odzyskania; nie znika bezpowrotnie.

## EN09. Gekoróg
**Typ:** gad · **HP:** 1 · **Prędkość:** 75 px/s · **Punkty:** 200 · **Światy:** 5, 8
**AI i ataki:** Porusza się po ścianach i sufitach, co 2–5 s przechodzi na sąsiednią powierzchnię.
**Zapowiedź ataku:** Na moment zmienia kolor grzbietu przed zejściem na ziemię. (czas przygotowania 0,35 s)
**Nadepnięcie:** tak tylko na ziemi po schowaniu rogów. **Klucz:** 1 trafienie. **Cewka:** 1 trafienie.
**Stany AI:** climb → transition → ground → defeated.
**Ważna reguła:** Nie odrywa się od powierzchni bez widocznej animacji.

## EN10. Bazalisk
**Typ:** gad · **HP:** 2 · **Prędkość:** 37 px/s · **Punkty:** 500 · **Światy:** 4, 5, 8
**AI i ataki:** Wykrywa gracza w stożku 6 kafelków; po 0,65 s rzuca promień przez 1,4 s, potem 2,2 s odpoczynku; promień daje +45 skamienienia/s.
**Zapowiedź ataku:** Oczy żółkną i słychać niskie syczenie na 0,65 s przed promieniem. (czas przygotowania 0,65 s)
**Nadepnięcie:** nie, ma rogi na głowie. **Klucz:** 2 trafienia w czasie odpoczynku. **Cewka:** 2 trafienia w czasie odpoczynku.
**Stany AI:** patrol → aim → beam → cooldown → defeated.
**Ważna reguła:** Promień jest blokowany przez pełne osłony; nie przechodzi przez solidne ściany.

## EN11. Rogopłetw
**Typ:** ryba · **HP:** 1 · **Prędkość:** 95 px/s · **Punkty:** 200 · **Światy:** 4
**AI i ataki:** Pływa poziomo lub wyskakuje na łuku; przed skokiem tworzy falę na powierzchni wody.
**Zapowiedź ataku:** Pojawia się biały krąg na wodzie przed wyskokiem. (czas przygotowania 0,5 s)
**Nadepnięcie:** nie, rogi aktywne na głowie. **Klucz:** tylko 1 trafienie w trakcie wyskoku. **Cewka:** impuls podwodny, 1 trafienie.
**Stany AI:** swim → windup → jump → swim_back → defeated.
**Ważna reguła:** Nie może pojawić się znikąd poniżej gracza bez ostrzeżenia.

## EN12. Ośmioróg
**Typ:** mięczak · **HP:** 2 · **Prędkość:** 58 px/s · **Punkty:** 300 · **Światy:** 4
**AI i ataki:** Płynie zygzakiem, wyrzuca macki na zasięg 2 kafelków i chwyta na 1 s.
**Zapowiedź ataku:** Macki skręcają się w spiralę na 0,55 s przed chwytem. (czas przygotowania 0,55 s)
**Nadepnięcie:** nie w wodzie. **Klucz:** 1 trafienie w odsłoniętą głowę po chwycie. **Cewka:** 2 trafienia w głowę.
**Stany AI:** swim → windup → grapple → release → defeated.
**Ważna reguła:** Schwytany gracz może wydostać się po trzech naciśnięciach kierunku.

## EN13. Kakturożec
**Typ:** roślina · **HP:** 2 · **Prędkość:** 32 px/s · **Punkty:** 300 · **Światy:** 3
**AI i ataki:** Porusza się na korzeniach, wyrzuca jeden cierń co 3,5 s; kolce na głowie zawsze aktywne.
**Zapowiedź ataku:** Pęcznieje i zmienia odcień na 0,55 s przed wyrzutem. (czas przygotowania 0,55 s)
**Nadepnięcie:** nie, kolce. **Klucz:** 2 trafienia z boku gdy kolce boczne są schowane. **Cewka:** odporny na zwykły impuls, działa odbity pocisk środowiskowy.
**Stany AI:** patrol → inflate → shoot → recover → defeated.
**Ważna reguła:** Zawsze ma alternatywną drogę lub dostępny element środowiskowy.

## EN14. Rogopnącze
**Typ:** roślina · **HP:** 2 · **Prędkość:** 0 px/s · **Punkty:** 250 · **Światy:** 3
**AI i ataki:** Nieruchomy korzeń; łodyga wysuwa się do 2,5 kafelków i na 0,8 s chwyta po zbliżeniu.
**Zapowiedź ataku:** Liście trzepoczą, a korzeń podświetla się przed wyciągnięciem łodygi. (czas przygotowania 0,5 s)
**Nadepnięcie:** nie. **Klucz:** 2 uderzenia w korzeń, gdy łodyga wysunięta. **Cewka:** 2 trafienia w korzeń.
**Stany AI:** hidden → windup → grab → recover → defeated.
**Ważna reguła:** Na głównej drodze nie wolno blokować jedynego wyjścia nieprzerwanym chwytem.

## EN15. Rogoróża
**Typ:** roślina · **HP:** 2 · **Prędkość:** 0 px/s · **Punkty:** 350 · **Światy:** 3, 8
**AI i ataki:** Zamyka płatki, gromadzi pociski, a potem wyrzuca trzy ciernie wachlarzem.
**Zapowiedź ataku:** Płatki najpierw czerwienieją i wykonują falujący ruch. (czas przygotowania 0,65 s)
**Nadepnięcie:** nie. **Klucz:** 2 trafienia gdy kwiat zamknięty po salwie. **Cewka:** 2 trafienia po salwie.
**Stany AI:** closed → prepare → shoot → recover → defeated.
**Ważna reguła:** Kolejne salwy oddziela przerwa 2,0 s.

## EN16. Ślimoróg
**Typ:** mięczak · **HP:** 2 · **Prędkość:** 42 px/s · **Punkty:** 250 · **Światy:** 2
**AI i ataki:** Patroluje powoli, w niebezpieczeństwie chowa się do metalowej skorupy i można ją odepchnąć z prędkością 270 px/s.
**Zapowiedź ataku:** Rogi chowa do pancerza po ostrzegawczym dźwięku. (czas przygotowania 0,4 s)
**Nadepnięcie:** nie, aktywne rogi. **Klucz:** 1 uderzenie przewraca, drugie niszczy. **Cewka:** 1 trafienie po przewróceniu.
**Stany AI:** patrol → withdraw → shell → shell_slide → defeated.
**Ważna reguła:** Skorupa odbija się maks. trzykrotnie, potem zatrzymuje; da się ją wypchnąć z pułapki.

## EN17. Rogoskoczek
**Typ:** płaz · **HP:** 1 · **Prędkość:** 85 px/s · **Punkty:** 200 · **Światy:** 3
**AI i ataki:** Co 1,7 s wykonuje skok do 2,5 kafelka, językiem potrafi zabrać PET i po trafieniu go wypuszcza.
**Zapowiedź ataku:** Przykuca, a oko powiększa się na pół sekundy przed skokiem. (czas przygotowania 0,5 s)
**Nadepnięcie:** tak po lądowaniu i złożeniu rogów. **Klucz:** 1 trafienie. **Cewka:** 1 trafienie.
**Stany AI:** idle → windup → leap → land → defeated.
**Ważna reguła:** Ukradziony PET zostaje odzyskany bez straty w ekonomii.

## EN18. Kamienioróg
**Typ:** kamienny strażnik · **HP:** 3 · **Prędkość:** 40 px/s · **Punkty:** 450 · **Światy:** 5, 7, 8
**AI i ataki:** Wolny patrol, potrafi wykonać krótkie uderzenie ręką; ochrona kamienna znika na 5 s po użyciu lokalnego przekaźnika.
**Zapowiedź ataku:** Ziemia drży, a na rogach pojawiają się pęknięcia przed ciosem. (czas przygotowania 0,6 s)
**Nadepnięcie:** nie. **Klucz:** 3 trafienia tylko przy zdjętym pancerzu. **Cewka:** 3 trafienia tylko przy zdjętym pancerzu.
**Stany AI:** patrol → windup → slam → shield_down → defeated.
**Ważna reguła:** Nigdy nie blokuje jedynego przejścia, jeśli nie ma działającego przekaźnika.

## Przeciwnik pomocniczy

**Rogodron-minion:** Leci poziomo; na polecenie Rogodrona nurkuje po 0,45 s przygotowania. Atak kluczem przy lądowaniu albo 1 impuls; nie liczy się do 18 podstawowych gatunków.

## Wspólne testy AI

- Każdy przeciwnik może zostać pokonany lub ominięty na trasie obowiązkowej.
- Strefa rogów lub kolców wygrywa z obliczeniem nadepnięcia, chyba że aktualny stan mówi, że rogi są schowane.
- Stwory przywoływane nie przekraczają limitu zagęszczenia na ekranie; maksymalnie sześć wrogów aktywnie atakujących na jednej kamerze w podstawowym trybie trudności.
- Wrogowie są dezaktywowani przed ich widocznym pojawieniem się poza kamerą; brak obrażeń z obszarów niewidocznych.
- Skorupy i odbite pociski oddziałują na przeciwników, ale nie przechodzą przez solidne ściany.
- Każdy wróg ma przewidywalną fazę odzyskiwania równowagi, bez ciągłego stun-locku gracza.
