# Marioosh & Darioosh – dokumentacja etapu 2

Ten pakiet rozszerza koncepcję gry „Klątwa Katoblepasa” do postaci dokumentacji do zbudowania prototypu. To **projekt**, nie gotowa grywalna aplikacja.

## Kolejność czytania

1. `01_GDD_mechanika_v0_2.md` – fizyka, walka, kolizje, skamienienie, opakowania, kooperacja, przewody, bossowie.
2. `02_ATLAS_32_POZIOMOW_v0_2.md` – szczegółowe scenariusze wszystkich 32 poziomów i wzorcowe rozmieszczenie obiektów dla 1-1.
3. `03_BESTIARIUSZ_opis_v0_2.md` – komplet zasad 18 gatunków wrogów.
4. `03_BESTIARIUSZ_parametry_v0_2.json` – dane parametrów wrogów do przepisania do silnika gry.
5. `04_BIBLIA_GRAFICZNA_v0_2.md` – wygląd postaci i planet, palety, sprite'y, dźwięk, HUD.
6. `05_LEVELS_v0_2.json` – ustrukturyzowane wpisy 32 poziomów, cztery sekcje każdego etapu, budżety i sekrety; **to nie jest kompletna tilemapa**.
7. `06_ROADMAP_v0_2.md` – kolejność implementacji i kryteria odbioru.

## Ustalenia wymagające dalszego testowania

- Wszystkie prędkości, czasy i statystyki wrogów są propozycją startową do balansowania.
- Długości plansz w kafelkach oraz pozycje posągów są orientacyjnym blueprintem.
- Docelowy silnik i platformy wydania należy wybrać przed utworzeniem kodu, choć Godot 4.x jest dobrym punktem startowym.
- Do **pierwszej grywalnej wersji** wystarczy 1-1, 1-2 i 1-4 oraz minimalna grafika zastępcza.

## Spójność z pierwotną historią

Osiem planet i ośmiu bossów pozostaje bez zmian. Siedem fragmentów kryształu pochodzi od strażników, ósmy z 8-3. Skróty działają, a pełne zakończenie wymaga wrócenia po pominięte znajdźki. Złota puszka warta 5 zwykłych pod względem kaucji, lecz fizycznie jest jednym opakowaniem przy naliczaniu +1 życia za 100 sztuk.
