# Implementacja v0.4 — stan prac (gałąź `v0.4-human-scale`)

Dokument opisuje, co z `08–11` jest w kodzie, jak to sprawdzono i gdzie implementacja odbiega od specyfikacji. `main` pozostaje wersją v0.3.

## 1. Zrobione
| Obszar | Stan | Gdzie |
|---|---|---|
| Skala 40 px = 1 m, hitboksy M 26×70 / D 24×68, kucanie | ✔ | `constants.ts`, `movement.ts` |
| Ruch: chód/bieg, przyspieszenie, coyote 0,08 s, bufor 0,10 s, skok 0,6–0,9 m, auto-krok 0,3 m | ✔ | `movement.ts`, `tests/movement.test.ts` (33 testy) |
| Przeskok (vault 0,3–1 m), chwyt krawędzi i wciągnięcie, drabiny (szczyt = podłoga) | ✔ | `movement.ts` |
| Upadki: <1,2 m miękko, 1,2–2,4 m potknięcie, ≥2,4 m rana | ✔ | `movement.ts`, `world.ts` |
| Grawitacja planet (mnożniki 0,86–1,14 g) | ✔ | `PLANET_PHYSICS`, `LevelData.planet` |
| HP 3 + tarcza (XL), brak żyć, brak game over, respawn z pełnym HP, przepaść = −1 HP i powrót na ostatnie bezpieczne miejsce | ✔ | `world.ts` |
| Brak zegara i bonusu czasowego; kaucja tylko z opakowań | ✔ | `world.ts`, `session.ts`, `scenes/play.ts` |
| Brak przeskoku na głowę (kontakt z wrogiem ranią zawsze), brak toczenia/szybowania/odbicia/uderzenia w ziemię/sprężyn | ✔ | `world.ts`, `worldDraw.ts` |
| Kamera: martwa strefa ±80 / ±36 px, wyprzedzenie ≤ 80 px | ✔ | `world.ts` |
| HUD: 3 serca, bez zegara; ekran wyniku = czas przejścia | ✔ | `scenes/play.ts` |
| System poziomów ręcznych (ASCII + logika w kodzie): drzwi/terminale pełnej wielkości, windy z postojem, przełączniki/bramy w pokoju, rampy 26° jako schody | ✔ | `authored.ts`, `maps/` |
| **W1-L1, W1-L2, W1-L4** (z bossem Rogomirem) | ✔ | `maps/w1l1.ts`, `w1l2.ts`, `w1l4.ts` |
| Wrogowie ×1,4 (hitbox i sprite), telegrafy ataku 0,5 s (Roguś, Gekoróg-typ) | ✔ częściowo | `enemies.ts`, `worldDraw.ts` |
| Fragment grawitacji: Vespera 0,86 g, opcjonalna wyspa za przerwą 5 kafli (`buildW6Gravity`, tylko test) | ✔ (prototyp, tylko testy) | `maps/proto.ts`, `tests/authored-negative.test.ts` |
| **Światy 6–8** (Vespera, Ferroks, Katoblis): 12 poziomów z odrębnymi mechanikami — światło/ptaki, windy zasilane bezpiecznikami, tłoki i burza, przekaźniki w kolejności, mosty na czas, deszcz kamieni, sieć portali, bramy z uwolnionych posągów, boss Katoblepas (filary → lustra → węzły) | ✔ | `maps/w6l1.ts`…`w8l4.ts`, `tests/arc.test.ts`, `tests/authored-negative.test.ts` |
| Drzwi i portale: ↑ (obok `E`) otwiera drzwi, terminale i portale; symbol (błyskawica, księżyc, liść, gwiazda) nad drzwiami; teleport ustawia punkt odrodzenia | ✔ | `world.ts`, `worldDraw.ts`, `props.ts` |
| Mechaniki silnika dodane w światach 7–8: bramy uporządkowane `ord…` (zła kolejność zeruje), `…:warpgate` (odblokowuje zamknięte drzwi w pokoju), `free…` (otwiera się po uwolnieniu `need` posągów), `arc` rodzaju `rock`, windy zasilane (`power`) | ✔ | `world.ts`, `authored.ts`, `tests/arc.test.ts` |
| Naprawa AI wrogów: zawrót „poza zasięgiem patrolu” tylko przy oddalaniu się od punktu startu + przerwa `turnCd` 0,4 s (wcześniej moby migały lewo-prawo i zawieszały się przy ścianach) | ✔ | `enemies.ts` (`walk`, `awayFromHome`, `faceTo`), `tests/enemy-flicker.test.ts` |
| Dobór póz bohatera: rampa pod górę / z góry, bieg, drabina (stoi / góra / dół), pływanie (tread / dive / up), brodzenie, lądowania (potknięcie / twarde), podciąganie, przeskok — z zamiennikami, gdy obraz jeszcze nie istnieje | ✔ | `worldDraw.ts` (`heroFrameFor`), `sprites/genmap.ts`, `tests/hero-frames.test.ts` |
| Kolejka grafik pod v0.4 (Art Station): 49 póz na brata (29 nowych), 17 nowych elementów human-scale, usunięte pozy v0.3 | ✔ (kolejka; obrazy czekają na produkcję) | `tools/add-v04-art.mjs`, `docs/ART_PIPELINE.md` |
| Muzyka: 13 utworów w `public/audio/music`, ładowanie z fallbackiem na syntezator | ✔ (do oceny słuchowej) | `engine/audio.ts`, `docs/PRODUKCJA_AUDIO_WIDEO.md` |
| Rogomir bez stompa: 3 generatory (okno 28 s), pancerz, szarża wolniejsza od biegu, ciągły pomost-schron (przejście nad bossem, drabiny przy ścianach, utknięcie 5,5 s), skala bossa ×1,5 | ✔ | `bosses.ts`, `maps/w1l4.ts`, `tests/boss.test.ts` |

## 2. Jak sprawdzono przejezdność
`tests/reach.ts` buduje graf stanów, w którym **krawędzie to makra symulowane prawdziwym `stepMovement`** (chód, bieg + skok z rozbiegu, zeskok przez platformę, drabina), a dodatkowo abstrakcyjne przejścia: drzwi, windy, przełączniki → bramy (iteracyjnie). Bez trybu „god”: kolce, wypadnięcie z poziomu i upadek ≥ 2,4 m kończą krawędź. `tests/authored.test.ts` wymaga, by **każdy brat osobno** dotarł do checkpointów, wyjścia, wszystkich przełączników, posągów i wszystkich opakowań oraz by budżet PET/puszek zgadzał się z `levels.json`. `tests/authored-negative.test.ts` dowodzi, że analizator nie jest zbyt łaskawy (bez drabiny/windy/przełącznika poziom przestaje być przejezdny).

### 2a. Woda i powietrze (Aqualis)
- **Model pływania** (`movement.ts`): prędkość 68/74 px/s (M/D), wypór 12 px/s ku powierzchni gdy głowa pod wodą, przy powierzchni zawisasz (`env.head`), po dnie brodzisz 0,6×; **wyskok z wody** (`env.lip`: głowa ≤ 12 px pod lustrem) wyrzuca stopy ≈ 0,25 m ponad lustro, więc pomost równy z wodą da się wejść, ale wyższy brzeg wymaga drabiny. Drabiny działają w wodzie.
- **Powietrze** (`constants.ts`): `AIR_MAX` 20 s, `AIR_WARN` 6 s (miga HUD), `AIR_REFILL` 8× szybciej nad wodą, `DROWN_INTERVAL` 1,6 s (−1 HP; przy 0 HP powrót do checkpointu z pełnym powietrzem). Powietrze jest po stronie świata (`updateAir`), a „głowa w wodzie” to kafel wody 6 px pod czubkiem postaci.
- **Specyfikacje**: `flood` (poziom wody w kolumnach [x0,x1] i opcjonalnie wierszach [y0,y1]: `from` → `to` w kaflach, `speed` wiersz/s; otwiera go komplet przełączników o danym `gate`) i `span` (kafle pomostu pojawiają się po włączeniu wszystkich przełączników bramy). Zawory bossa (`gate` zaczynające się od `pool`) mają samoczynny powrót po 16 s.
- **Analizator**: węzły pływające (siatka 12 px), makra 8-kierunkowe po 0,4 s i wyskok z wody; każdy węzeł niesie rachunek powietrza identyczny jak w grze, a ścieżki dłuższe niż `AIR_MAX − AIR_TEST_MARGIN` (15 s) są odrzucane. Poziom wody zależy od otwartych zaworów (ostatni stan + suma punktów ze wszystkich stanów).
- **Różnorodność świata 4**: L1 = most zwodzony i baseny odcięte od siebie (wyjście z wody tylko drabiną), L2 = labirynt komór z powietrzem i „dzwonami”, L3 = zbiorniki z zaworami (spust / napełnianie, sekret dostępny tylko przy napełnionym B), L4 = latarnia i boss Rogopłetw (woda go chroni, zawór osusza basen, skok na pomost zapowiadany przykucnięciem).

## 3. Odstępstwa od specyfikacji / uproszczenia prototypu
- **Grafika kafli i tła** bez zmian (motyw lasu świata 1 także w „kablowni” i „przetwórni”) — oprawa podziemna/przemysłowa czeka na grafiki.
- Wrogowie mają przeskalowany hitbox i sprite (×1,4), ale **ich prędkości, zasięgi widzenia i wszystkie telegrafy (0,4–1,0 s) nie zostały jeszcze przestrojone** — to Etap D.
- Portal do skrytek to „drzwi pełnej wielkości” z interakcją (↑/E); bez animacji przejścia.
- W1-L2: „górny skrót” z atlasu nie jest osobną trasą — rolę skrótu pełni szyb 1 (galeria zachodnia) i drabina 2.
- Tryb „Nocna Zmiana” nie ma jeszcze sensu bez zegara (na poziomach ręcznych nie działa) — do decyzji projektowej.
- W Aqualis (W4) uproszczone względem atlasu: ryby nie wyskakują zza burty w L1 (pływają w basenach i grożą wpadającym), L2 nie ma „czterech przewodów” z przejściem na Vesperę (jest sekretna komora z 12 puszkami), prądów wodnych nie ma (L3 opiera się na poziomie wody), w L4 brak luster (zastąpione osuszaniem basenów).
- Wszystkie 32 poziomy są już grywalne. Fragment grawitacji Vespery jest tylko w testach (`maps/proto.ts`).
- W Katoblisie (W8) uproszczone względem atlasu: W8-L1 bez skarbca z kablem i czerwonego sekretu (bateria leży na górnej półce), Bykobieg nie rozbija rumowiska (tylko zawór); W8-L2 bez żółtego kabla ukrytego za symetryczną ścianą (ślepa stacja jest zwykłą odnogą sieci) i bez osobnych „fałszywych przewodów” w rozdzielni W8-L4 (ślepe odnogi to zwykłe korytarze); W8-L3 bez czwartego filaru energii i ukrytej notatki (jest jedna notatka w archiwum); W8-L4 bez niszy sekretnej (bateria na górnym balkonie), Scarlet nie pomaga w walce (fazy 1–3 są mechaniczne). Wnętrza W8 używają tła/kafli świata zewnętrznego (do wymiany na grafiki wnętrz).

## 4. Następne kroki
1. **Ręczny playtest** wszystkich poziomów (najpierw W1-L1/L2/L4: czucie skoku, szarża Rogomira, okno generatorów 28 s) — wartości w `constants.ts`, `bosses.ts`, `enemies.ts` to nastawy startowe. Ocena słuchowa muzyki.
2. **Strojenie wrogów** (Etap D): prędkości, zasięgi widzenia i telegrafy (0,4–1,0 s) po przeskalowaniu ×1,4.
3. **Grafika:** produkcja obrazów z kolejki Art Station (najpierw pozy braci), następnie elementy human-scale, wnętrza (stacje, hale, podziemia) i tła per świat; po powstaniu nowych póz — sprawdzić zamienniki w `genmap.ts`.
4. **HUD mobilny i dostępność** (Etap D/E): przyciski ruch / skok / interakcja / kucanie, bieg jako przełącznik; test na urządzeniach (Android/iOS) i padzie.
5. **Decyzje projektowe:** tryb „Nocna Zmiana” (bez zegara), opcjonalne wyspy zależne od grawitacji (poza prototypem Vespery), wideo intro/zakończeń.
6. Po akceptacji prototypu: aktualizacja wersji w `package.json` (obecnie 0.3.0), przegląd README i scalenie z `main`; osobny wpis w CHANGELOG jako wydanie.

## 5. Wnioski z pomiarów fizyki (analizator z chwytem krawędzi)
Maksymalna przerwa z rozbiegu (z chwytem krawędzi): 4 kafle wszędzie; 5 kafli — tylko Vespera (obaj) i Prądowo (tylko Darioosh); Skaltria — nigdy. Dlatego trasa główna używa przerw ≤ 3 kafle (2,4 m), a przerwy 5-kaflowe są wyłącznie opcjonalnym bonusem zależnym od planety.
