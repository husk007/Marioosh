
# Plan wdrożenia nowej koncepcji v0.4 — instrukcja dla Claude / Codex
**Data:** 2026-11-09. Ten dokument i GDD v0.4 są *specyfikacją zmian*, nie informacją o zaimplementowaniu. Nie wykonywać automatycznego merge zmian mechaniki, zanim nie przejdzie grywalny prototyp.

## 1. Co jest nie tak w obecnym kodzie
- docs/design/07_PRZEBUDOWA_PIONOWA_v0_3.md zawiera kierunek Sonic/Rayman; należy go uznać za historyczny i nie rozwijać.
- src/game/constants.ts: walk 300/340, run 420/520 px/s, jump -600/-680 px/s, grawitacja 1600 px/s², sprężyna -1150 px/s — wielokrotnie ponad nową skalą, nawet jeśli stopniowo zwalniać kamerę.
- src/game/movement.ts: rolling, glide, wall slide, wall jump, pound, spring launch, air dash w wodzie i automatyczne lewitowanie nie odpowiadają animacjom i fizyce ludzkiej.
- src/game/levelgen2.ts: generator losuje obowiązkowe wzgórza, rampy, loft, vaultD, vaultM, spring. Nowe parametry postaci sprawią, że mapy v0.3 przestaną być przechodnie. **Nie wolno zmieniać tylko constants.ts.**
- src/game/physics.ts: kolizje i auto step na stokach były dobierane pod małą postać i dużą szybkość; trzeba zmienić rozmiary hitboxów i kolizje ścian/krawędzi.
- src/sprites/hero.ts i art-tasks: część póz dotyczy toczenia, szybowania, odbijania i skoków ze sprężyn — oznaczyć jako legacy. Nie zastępować zatwierdzonych projektów postaci innymi.
- src/game/world.ts, src/game/worldDraw.ts, src/scenes/play.ts: kamera, zagrożenia, HUD, timer, licznik żyć i checkpointy wymagają dopasowania do nowej pętli gry.

## 2. Plan wykonania bez ryzyka zniszczenia obecnej gry
**Gałąź robocza:** osobna feature branch dla zmian w silniku. Main pozostaje z wersją v0.3 do chwili testów.

### Etap A — ruch człowieka (oddzielny PR)
- Przerobić BrotherParams według tabeli GDD v0.4; skala = 40px/m, g=392.
- Wyłączyć rolling, gliding, wallJump, wallSlide jako sposób zejścia po ścianie, pounding, super-sprężyny i dash w wodzie.
- Wprowadzić idle/walk/run, crouch, jump z variable height, controlled air correction, vault, ledge grab/pull-up, ladder, hop down i bezpieczne lądowanie.
- Animacje mogą początkowo być stand-in, ale muszą odpowiadać działaniu człowieka, bez komicznych salt.
- Zastąpić zmiany rozmiaru po „XL” samą osłoną.
- Wprowadzić progi drop damage i proste odzyskiwanie kontroli, bez losowych kar.
- Test jednostkowy obu braci na płaskiej powierzchni; wszystkie wyniki i tolerancje jawnie policzone.

### Etap B — autorski generator/edytor map (oddzielny PR)
- Zbudować model pokoju/kompleksu jako grafu połączonych pomieszczeń, a nie linii elementów losowanych wagą. Każdy pokój ma floor polygons / tile collision, wejścia, wyjścia, węzły zasilania, trasę główną, punkt kontrolny, sekret.
- Stworzyć bibliotekę ręcznie złożonych prefabów: hallway, yard, mezzanine, switchboard, shaft, staircase, ladder, cargoLift, bridge, serviceTunnel, door, portal, rooftop, cave, floodedRoom.
- Zostawić deterministyczny RNG tylko dla dekoracji, rozstawienia nieobowiązkowych opakowań i miękkich wariantów spotkań.
- Zapisy i identyfikatory 32 poziomów zachować; stary generator nie jest fallbackiem dla nowych parametrów ruchu.
- Test osiągalności bez „god mode”: obie postacie, wszystkie wymagane drzwi i windy, zero softlocków i obowiązkowych skoków > 80 px. Test osobno dla zwykłego stanu i braku przedmiotów dodatkowych.
- Projektant każdej mapy podaje checklistę: 3 pasma, co najmniej jedna pętla, zasadne połączenia pionowe, jeden zrozumiały motyw urządzenia, min. 2 checkpointy.

### Etap C — pionowy wycinek gry (grywalna wersja do oceny)
- W1-L1: leśna stacja, pierwsza naprawa, ruch, schody, vault, ukryty tunel.
- W1-L2: podziemia i platformy serwisowe, winda, przewody teleportacyjne i rozdzielnice.
- W1-L4: boss Rogomir i system osłon/odłączników.
- 2–3 graczy testowych: ocena naturalności ruchu (bez superakrobacji), czytelności przeszkód, satysfakcji z używania narzędzi.
- Dopiero po akceptacji prowadzić port pozostałych 29 map w kolejności światów.

### Etap D — walka, przedmioty, HUD i dostępność
- Usunąć „stomp na głowę” jako podstawowy atak. Obserwacja ostrzeżenia przeciwnika i obrona narzędziem / odklęcie.
- Zamienić licznik żyć i globalny timer na checkpointy, zdrowie i lokalne zdarzenia na czas. Migracja zapisu ma mieć domyślne wartości dla starego save.
- Umieścić PET/puszki w wiarygodnych miejscach. Rozdzielnia na końcu powinna uruchamiać prawdziwą maszynę lub transport.
- Do pracy w wodzie wprowadzić sprzęt oddechowy i komory powietrza; nie karać nadmiernie gracza.
- Dopasować HUD desktop, mobilny i gamepad. Mobilny przycisk: ruch, skok, interakcja i przysiad; bieg jako toggle lub przycisk.

### Etap E — oprawa i wydania
- Zachować zatwierdzone obrazy ludzi i dwunożnych bossów. Assety przygotować w kilku stanach, prawy profil, skala 68–72 px hitboxu i gładkie 2D HD.
- Tła: czytelne warstwy paralaksy, ręcznie ilustrowane obiekty; nie przypadkowe platformy.
- Na końcu testy wydajności przeglądarka/PWA/Android/Windows/Linux/iOS, bez zmian technologii TypeScript + Canvas 2D.

## 3. Testy i warunki ukończenia
- Testy dla wartości: g=392, M.jump=-140, D.jump=-150, dopuszczalna wysokość stóp < 0,9m; opadanie po czasie; zachowanie po puszczeniu skoku.
- Testy kolizji z drabiną, windą, krawędzią, wąskim przejściem, ruchomym mostem, poślizgiem i swobodnym spadaniem.
- Testy prowadzenia kamery, czy cel przy wspinaniu jest widoczny, ostrzeżenie zagrożenia >=0,8s.
- Deterministyczny test osiągalności W1-L1/W1-L2/W1-L4 z M i D, bez supermocy i bez narzędzi opcjonalnych.
- Test spójności wielkości elementów: wrota >=90px, wystarczająca wysokość drzwi, brak blokujących bez ostrzeżenia schodów.
- 32 mapy przechodnie z osobna i ciągły przebieg całej kampanii; zero przypadkowych zależności od generatora.
- Nie uznawać za zakończone, jeśli testy CI są zielone, ale gra nadal pozwala toczyć się, szybować, zjeżdżać jak Sonic lub zmusza do nieludzkich skoków. Potrzebna ocena grywalności w przeglądarce.

## 4. Przekaz do agenta implementującego
> **Uważaj: użytkownik odrzuca kierunek Sonic/Rayman.** Nie interpretuj sformułowania „dynamiczna platformówka 2D” jako pozwolenia na rolling, parkour po ścianach, double jump, sprężyny i podbijanie bohaterów. Najpierw opracuj ruch i trzy ręcznie projektowane mapy; nie poprawiaj wyglądu starego generatora na siłę. Każda wysoka platforma musi mieć realną drogę dostępu. W razie kolizji v0.3 z v0.4 pierwszeństwo ma ten dokument i GDD v0.4.
