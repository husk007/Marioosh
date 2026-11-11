# MARIOOSH & DARIOOSH – ROADMAP PRODUKCJI

> **Status (v0.4): dokument historyczny — plan migracji v0.4 to `10_ROADMAP_MIGRACJI_v0_4.md`, a stan wykonania `12_IMPLEMENTACJA_v0_4.md`.**
## Prototyp → vertical slice → pełna kampania

**Cel projektu:** zbudować dopracowaną, oryginalną platformówkę 2D „Klątwa Katoblepasa”, zachowując spójność GDD, atlasu 32 poziomów, bestiariusza i biblii graficznej. Poniższe fazy nie oznaczają, że gra albo repozytorium już istnieją; to plan do wykonania po uruchomieniu projektu.

## M0. Fundament repozytorium i automatyzacji

- [ ] Utworzyć repozytorium gry oraz ustalić silnik, format tilemap, system kontroli wersji i docelowe platformy (PC jako punkt startowy; pozostałe później).
- [ ] Dodać dokumenty `01_GDD...`, `02_ATLAS...`, `03_BESTIARIUSZ...`, `04_BIBLIA...`, `05_LEVELS...` jako źródło wymagań.
- [ ] Skonfigurować scenę startową, prosty system menu, placeholdery grafiki i ciągłą kontrolę jakości po każdym PR.
- [ ] Przewidzieć identyfikatory obiektów do zapisu i format `SaveGame` z numerem wersji.

**Kryterium odbioru:** czysta instalacja projektu uruchamia pusty poziom oraz prosty ekran menu, a repo ma opisane zasady pracy i testów.

## M1. Fizyka i sterowanie dwóch braci

- [ ] Zaimplementować ruch zgodny z GDD: przyspieszanie, bieg, hamowanie, skok, coyote time, jump buffer, krótszy skok przy puszczeniu.
- [ ] Zaimplementować różne parametry Marioosha i Darioosha oraz poprawną zmianę postaci w solo.
- [ ] Dodać kolizje kafelków, platform jednokierunkowych, przepaści, bezpieczny respawn i checkpoint.
- [ ] Uruchomić automatyczne testy skoku 2- i 4-kafelkowego, z testem każdego z braci.

**Kryterium odbioru:** bez wrogów da się przebiec testową mapę i wykonywać skoki w przewidywalny sposób; brak przechodzenia przez podłoże i utknięć w ścianach.

## M2. Podstawowa walka i zbiórka opakowań

- [ ] Klucz nastawny, trafienia, osłona Bezpiecznika XL, Cewka Iskrowa, spadek do podstawowej postaci.
- [ ] Roguś i Żukoróg z czytelną zapowiedzią ataku, strefą rogów, odwróceniem pancerza i zasadami punktów.
- [ ] PET, puszka, złota puszka, punkty, kaucja i osobny licznik fizycznych opakowań.
- [ ] Nagroda +1 życie za dokładne przekroczenie wielokrotności 100 fizycznych opakowań.
- [ ] HUD czasu, punktów i żyć oraz mały panel pomocy sterowania.

**Kryterium odbioru:** gracz może zabić Rogusia atakiem kluczem i pokonać Żukoroga zgodnie z regułami; 100 opakowań daje dokładnie jedno życie, nie więcej.

## M3. Grywalny vertical slice – 1-1, 1-2 i 1-4

- [ ] Zbudować szczegółowy układ 1-1 z atlasu, trzech mieszkańców i skrytkę z baterią.
- [ ] Zbudować 1-2 z niebieskim teleportem, żółtą skrytką, fioletową Warp Zone oraz powrotem z bonusu.
- [ ] Stworzyć boss arena 1-4 z Rogomirem: trzykrotna czytelna szarża i odsłonięty brzuch.
- [ ] Dodać pełny przepływ: menu → rozgrywka → checkpoint → Game Over → kontynuacja → poziom ukończony.
- [ ] Dodać pojedynczy system odklęcia mieszkańca, zapis i ponowne wczytanie stanu.

**Kryterium odbioru:** inna osoba, bez pomocy twórcy, może ukończyć 1-1, wejść do sekretnego przewodu w 1-2, pokonać Rogomira i odzyskać fragment I.

## M4. Cała Lumenia i lokalne co-op

- [ ] Dodać 1-3 z platformami, Rogowróblem i Ćmorogiem.
- [ ] Dodać przełączanie braci w solo oraz lokalny tryb dwóch graczy ze wspólną kamerą.
- [ ] Braterskie Podbicie i Podwójny Impuls jako akcje dobrowolne; AI towarzysza w solo nie może blokować gry.
- [ ] Przetestować odradzanie, podwójne podniesienie opakowania i checkpointy dwóch graczy.

**Kryterium odbioru:** cały świat 1 przechodzony osobno Mariooshem, Dariooshem oraz w dwuosobowym co-op, bez wymagania posiadania dwóch kontrolerów do ukończenia gry solo.

## M5. Powtarzalny system poziomów i światy 2–4

- [ ] Edytor wspierający dane `05_LEVELS_v0_2.json` i instancje obiektów.
- [ ] Złomaria: metal, przenośniki, magnesy, Ślimorogi, EcoPort i Złomotaur.
- [ ] Florion: rośliny, pnącza, słoneczne obwody i Kaktogór.
- [ ] Aqualis: pływanie, prądy, podwodne przełączniki i Rogopłetw Wielki.
- [ ] Cztery rodzaje teleportacji i zwrotne przejścia między planetami.

**Kryterium odbioru:** 16 poziomów (światy 1–4) przechodzonych od początku do końca, z wszystkimi trzema posągami na planszę.

## M6. Światy 5–8 i finał

- [ ] Skaltria: Bazaliski, promień skamienienia, osłony i Ceratopsor.
- [ ] Vespera: ciemne plansze, latarnie, lot ptaków i Krukoróg Królewski.
- [ ] Ferroks: generatory, okresowo aktywne platformy, Kamieniorogi i Rogodron.
- [ ] Katoblis: labirynt kabli, ósmy fragment z 8-3, trzy fazy Katoblepasa, Scarlet i oba zakończenia.
- [ ] Dodać planetę 0 – Prądowo jako opcjonalną, dopiero gdy główna kampania jest stabilna.

**Kryterium odbioru:** 32 główne poziomy, ośmiu bossów, komplet fragmentów, zwykłe zakończenie i sekretne zakończenie.

## M7. Balans, muzyka, testy i wydanie

- [ ] Uzupełnić wszystkie finalne animacje, efekty i oryginalną muzykę.
- [ ] Rozegrać każdy poziom minimum: solo Marioosh, solo Darioosh, co-op oraz po powrocie ze skrótu.
- [ ] Testy krańcowe: brak osłony i ulepszeń, zero żyć, pełne 99 żyć, 99/100/101 opakowań, pełne i zerowe skamienienie.
- [ ] Sprawdzić zapis po awaryjnym zakończeniu gry i po przełączeniu planety; brak podwójnej nagrody po wczytaniu.
- [ ] Udokumentować licencje elementów graficznych i dźwiękowych, uruchomić ustawienia dostępności.
- [ ] Przeprowadzić testy z osobami nieznającymi gry i zebrać informacje, gdzie pojawiają się nieczytelne zagrożenia.

**Kryterium odbioru:** stabilna kampania, reprodukowalne wyniki testów, nieblokujący postęp save, brak przepaści niemożliwych do pokonania dowolnym bratem.

---

## Backlog zgodnie z priorytetem

**P0 – krytyczne:** sterowanie, kolizje, dwie postacie, HP/osłona, przewód, poziom 1-1, PET/puszka, checkpoint, zapis.  
**P1 – przygotowanie demonstracji:** 1-2, 1-3, 1-4, Rogomir, odklęcie mieszkańców, HUD, dwaj gracze.  
**P2 – pełna kampania:** 32 poziomy, 18 gatunków wrogów, 8 bossów, unikalne środowiska, sekrety, dwa zakończenia.  
**P3 – dodatkowe:** planeta 0, Nocna Zmiana, rozszerzone rekordy, dodatkowe stroje i warianty wizualne.

## Testy regresyjne po każdym większym etapie

1. Skok z krawędzi i tuż po jej opuszczeniu; przerwy 2 i 4 kafelki; przełączenie brata podczas lotu.
2. Kontakt stopy z rogiem Żukoroga kontra odsłonięty brzuch; brak obrażeń podczas teleportacji.
3. Trafienie z osłoną, bez osłony oraz z aktywną Cewką Iskrową.
4. Trafienie promieniem Bazaliska przez 0,5 s, 1,5 s i powyżej wartości skamienienia.
5. Zbieranie fizycznych opakowań 99 → 100 → 101 i ponowne wczytanie save.
6. Podniesienie jednego PET przez obu graczy równocześnie (zaliczenie raz).
7. Teleport z gniazda do gniazda, wyjście z zamkniętego przewodu i powrót z Warp Zone.
8. Zapis i powrót do wszystkich ośmiu planet po ich wcześniejszym pominięciu skrótami.
9. Wykrycie wszystkich 96 posągów i odblokowanie sekretnego zakończenia tylko przy pełnym komplecie.

## Warunek do rozpoczęcia prac nad następnym światem

Nie zaczynamy masowej produkcji plansz, jeśli podstawowy ruch nie przeszedł testów. Każdy milestone kończy się prototypem możliwym do przejścia od początku do końca, testami i krótką listą znanych błędów. Mechanika ma pierwszeństwo przed masowym tworzeniem grafiki.
