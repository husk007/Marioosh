> **DOKUMENT HISTORYCZNY (v0.3).** Zastąpiony przez v0.4 (`08_NOWA_KONCEPCJA_FIZYKA_v0_4.md`): szybowanie, odbicie od ściany, toczenie, uderzenie w ziemię, sprężyny i przeskok na głowę wrogów zostały usunięte. Kod v0.3 jest na gałęzi `main` / tagu v0.3.0; testy v0.3 w `tests/legacy/`.

# Przebudowa pionowa v0.3 — „Sonic / Rayman” dla Marioosha i Darioosha

Dokument opisuje, co zmieniło się względem GDD v0.2 (`01_GDD_mechanika_v0_2.md`): gra przestała być płaskim biegiem w prawo, a stała się wysokim, wielopoziomowym platformerem z ruchem w górę i w dół. Fizyka bohaterów pozostaje spójna z v0.2 (coyote 0,1 s, bufor skoku 0,12 s, skok o zmiennej wysokości, grawitacja bohatera 1600 px/s²).

## 1. Zasady projektu
1. **Pionowość jest trasą, nie ozdobą.** Główna trasa każdego poziomu wspina się i opada (wysokość pokoju 46 kafli; trasa mieści się w 10–20 wierszach różnicy, a droga ze zbaczaniem po sekretach to zwykle 20–40 wierszy).
2. **Bracia różnią się mechaniką, nie tylko statystykami.** Marioosh jest ciężki (uderzenie w ziemię, szybsze zmęczenie), Darioosh zwinny (odbicie od ściany, dłuższe szybowanie, brak zmęczenia).
3. **Każdy poziom ma sekret dla każdego z braci** i jedną trasę górną dla obu — to wymusza współpracę/powroty, ale nigdy nie blokuje trasy głównej.
4. **Trasa główna jest zawsze przejezdna dla każdego brata osobno** — pilnuje tego bot osiągalności (tryb „god”) osobno dla M i D na wszystkich poziomach.

## 2. Nowe mechaniki
| Mechanika | Marioosh | Darioosh | Uwagi |
|---|---|---|---|
| Zbocza 45° i 26° | tak | tak | rozpęd na zjeździe, wyjazd ze szczytu rampy wystrzeliwuje w górę (skocznia); toczenie (przysiad w biegu) przyspiesza zjazd |
| Wysokość skoku | ≈ 3,5 kafla | ≈ 4,5 kafla | |
| Szybowanie (skok w powietrzu) | opadanie 140 px/s | opadanie 85 px/s | dłuższe u Dariooosha |
| Ślizg po ścianie | tak (200 px/s) | tak (110 px/s) | |
| Odbicie od ściany (wall jump) | **nie** | **tak** | otwiera szyby dostępne tylko dla Darioosha |
| Łapanie krawędzi | tak | tak | automatyczne podciągnięcie przy zbliżeniu do krawędzi |
| Wspinaczka po kratce / linie | 3 s wytrzymałości (kratka) | bez limitu | lina i drabina bez limitu u obu |
| Uderzenie w ziemię (↓ w powietrzu) | **tak** — rozbija pęknięte posadzki | nie | otwiera kapsuły dostępne tylko dla Marioosha |
| Sprężyna | wyrzut ≈ 12,9 kafla (1150 px/s) | jw. | trasy górne i powroty z kapsuł |
| Pływanie | 8 kierunków, 150 px/s | 8 kierunków, 190 px/s | dash na skok |
| Lód / olej / piasek | ślisko / bardzo ślisko / wolno | jw. | współczynniki w `movement.ts` (`surface()`) |

Nie ma pełnych pętli 360° — najstromsze zbocze ma 45°. To świadome ograniczenie (stabilność kolizji w siatce kafli).

## 3. Generator poziomów (`levelgen2.ts`)
- Poziom to ciąg **elementów** (`pieces`: flat, gap, stairs, hill, ramp, slide, climb, spring, drop, pit, haz, wall, moving, puzzle, crumble, phase, conv, ice, sand, oil, loft, vaultD, vaultM). Każdy zwraca zajętą szerokość albo −1 (nie mieści się) i po nim jest płaski „ogon” 2–4 kafli.
- `route[x]` = wiersz powierzchni trasy głównej w kolumnie x. Punkty kotwiczące (spawn, posągi, checkpoint, wyjście/arena/hub) leżą na płaskim odcinku.
- **Profil wysokości** (naprzemienne wysokie i niskie punkty) skłania generator do elementów w górę (UP) lub w dół (DOWN).
- **Obowiązkowe sekrety** (po jednym na poziom): kapsuła Marioosha (`vaultM`), trasa górna (`loft`), szyb Dariooosha (`vaultD`), plus wzgórze i wspinaczka. Poziomy z wodą, bossowie na arenie i W8-L2 (sala przewodów) mają ograniczenia.
- Areny bossów i sala przewodów W8-L2 wymagają poziomu bazowego — generator wymusza zjazd/zrzut przed nimi.
- Nagrody w sekretach **przenoszą** zwykłe opakowania (budżet PET/puszek/złotych puszek się nie zmienia).
- Jaskinie i woda: sufit podąża za terenem (≥ 13 wierszy nad trasą, by zmieścić skok ze sprężyny).

### Sekrety zależne od brata
- **`vaultM` (kapsuła):** posadzka z pękniętych kafli nad pustą kieszenią i sprężyną. Marioosh uderza w ziemię, wpada do kieszeni, zbiera nagrodę, sprężyna odsyła go na trasę. Darioosh nie rozbije posadzki.
- **`vaultD` (szyb):** trzykafelkowy szyb z wiszącymi ścianami; platforma 9 wierszy nad podłożem osiągalna tylko przez serię odbić od ścian — Marioosh tam nie wejdzie.
- **`loft` (trasa górna):** sprężyna wyrzuca na jednostronną półkę z przedmiotami; dla obu braci.

### Wieża W6-L2
Wieża jest zbudowana z **etapów** (`TOWER_STAGES`): schody z półek (nachodzą na siebie ≥ 3 kafle), wspinaczka po kratce (kratka sięga o kafel ponad półkę, półka leży obok), sprężyna (11 wierszy). Szczyt to jednokierunkowa podłoga 3 wiersze nad ostatnią półką, z metą.

## 4. Podpowiedzi
Przy pierwszym wystąpieniu danego elementu na trasie pojawia się jednorazowa podpowiedź (`hint.slope`, `hint.climb`, `hint.spring`, `hint.pound`, `hint.walljump`, `hint.glide`, `hint.ice`, `hint.sand`, `hint.oil`) — we wszystkich 6 językach. Stare podpowiedzi o stałej pozycji (np. W1-L1) zostały zachowane tylko tam, gdzie nie zależą od układu.

## 5. Grafika (kolejka dla Art Station)
Biblioteka rozszerzona narzędziem `tools/add-vertical-art.mjs`:
- kategoria **mechanics** (MECHANICS-001…010): zbocze 45°, zbocze 26°, sprężyna, kratka, lina/łańcuch, lód, olej, piasek, nawiew, pęknięta posadzka — wszystkie ze wzorcem stylu Lumenii jako referencją;
- **16 nowych póz** braci: szybowanie, zwis na krawędzi, ślizg po ścianie, toczenie, wspinaczka po kratce, pływanie, wyrzut ze sprężyny (obaj), uderzenie w ziemię (M), odbicie od ściany (D).
Gra na razie rysuje te elementy proceduralnie; po wygenerowaniu grafik trzeba dopisać je do `sprites/art.ts` (pakiet `public/art/game` obejmie je automatycznie).

## 6. Znane ograniczenia
- Brak pełnych pętli, zbocza maks. 45°.
- Wieża ma własny, uproszczony test etapów (`tests/tower.test.ts`), a nie bota end-to-end.
- Balans (wytrzymałość kratki, siła sprężyn, czasy) to wartości startowe — wymagają testów z ludźmi.
- Pionowa kamera i D-pad dotykowy zweryfikowane w przeglądarce desktopowej; test na urządzeniach z dotykiem nadal do zrobienia.
