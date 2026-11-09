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
| Fragmenty grawitacji: **W5-L1** (Skaltria 1,14 g) i **W6-L1** (Vespera 0,86 g, opcjonalna wyspa za przerwą 5 kafli) | ✔ (prototypy, tylko tryb testera) | `maps/proto.ts`, `tests/authored-negative.test.ts` |
| Rogomir bez stompa: 3 generatory (okno 28 s), pancerz, szarża wolniejsza od biegu, pomosty-schrony, skala bossa ×1,5 | ✔ | `bosses.ts`, `maps/w1l4.ts`, `tests/boss.test.ts` |

## 2. Jak sprawdzono przejezdność
`tests/reach.ts` buduje graf stanów, w którym **krawędzie to makra symulowane prawdziwym `stepMovement`** (chód, bieg + skok z rozbiegu, zeskok przez platformę, drabina), a dodatkowo abstrakcyjne przejścia: drzwi, windy, przełączniki → bramy (iteracyjnie). Bez trybu „god”: kolce, wypadnięcie z poziomu i upadek ≥ 2,4 m kończą krawędź. `tests/authored.test.ts` wymaga, by **każdy brat osobno** dotarł do checkpointów, wyjścia, wszystkich przełączników, posągów i wszystkich opakowań oraz by budżet PET/puszek zgadzał się z `levels.json`. `tests/authored-negative.test.ts` dowodzi, że analizator nie jest zbyt łaskawy (bez drabiny/windy/przełącznika poziom przestaje być przejezdny).

## 3. Odstępstwa od specyfikacji / uproszczenia prototypu
- **Grafika kafli i tła** bez zmian (motyw lasu świata 1 także w „kablowni” i „przetwórni”) — oprawa podziemna/przemysłowa czeka na grafiki.
- Wrogowie mają przeskalowany hitbox i sprite (×1,4), ale **ich prędkości, zasięgi widzenia i wszystkie telegrafy (0,4–1,0 s) nie zostały jeszcze przestrojone** — to Etap D.
- Portal do skrytek to „drzwi pełnej wielkości” z interakcją (↑/E); bez animacji przejścia.
- W1-L2: „górny skrót” z atlasu nie jest osobną trasą — rolę skrótu pełni szyb 1 (galeria zachodnia) i drabina 2.
- Tryb „Nocna Zmiana” nie ma jeszcze sensu bez zegara (na poziomach ręcznych nie działa) — do decyzji projektowej.
- 29 pozostałych poziomów jest oznaczonych WIP na mapie i nie da się ich uruchomić do czasu akceptacji prototypu (zgodnie z `10_ROADMAP`). Fragmenty W5-L1 i W6-L1 są prototypami grawitacji (poza główną ścieżką; uruchamiane przez `?debug=1` + `window.__play('W6-L1')`).

## 4. Następne kroki
1. Ręczny playtest W1-L1/L2/L4 (czucie skoku, szarży Rogomira, 28 s okna generatorów) — wartości w `constants.ts` i `bosses.ts` to nastawy startowe.
2. Strojenie wrogów: prędkości, zasięgi, telegrafy (Etap D).
3. Po akceptacji: portowanie 29 pozostałych poziomów według atlasu.

## 5. Wnioski z pomiarów fizyki (analizator z chwytem krawędzi)
Maksymalna przerwa z rozbiegu (z chwytem krawędzi): 4 kafle wszędzie; 5 kafli — tylko Vespera (obaj) i Prądowo (tylko Darioosh); Skaltria — nigdy. Dlatego trasa główna używa przerw ≤ 3 kafle (2,4 m), a przerwy 5-kaflowe są wyłącznie opcjonalnym bonusem zależnym od planety.
