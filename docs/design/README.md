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
8. `07_PRZEBUDOWA_PIONOWA_v0_3.md` – **v0.3:** przebudowa na wysoki, pionowy platformer (zbocza, wspinaczka, sprężyny, sekrety zależne od brata); uzupełnia i w razie sprzeczności zastępuje fizykę z GDD v0.2. **Od v0.4 dokument historyczny.**

## Ustalenia wymagające dalszego testowania

- Wszystkie prędkości, czasy i statystyki wrogów są propozycją startową do balansowania.
- Długości plansz w kafelkach oraz pozycje posągów są orientacyjnym blueprintem.
- Docelowy silnik i platformy wydania należy wybrać przed utworzeniem kodu, choć Godot 4.x jest dobrym punktem startowym.
- Do **pierwszej grywalnej wersji** wystarczy 1-1, 1-2 i 1-4 oraz minimalna grafika zastępcza.

## Spójność z pierwotną historią

Osiem planet i ośmiu bossów pozostaje bez zmian. Siedem fragmentów kryształu pochodzi od strażników, ósmy z 8-3. Skróty działają, a pełne zakończenie wymaga wrócenia po pominięte znajdźki. Złota puszka warta 5 zwykłych pod względem kaucji, lecz fizycznie jest jednym opakowaniem przy naliczaniu +1 życia za 100 sztuk.
9. `08_NOWA_KONCEPCJA_FIZYKA_v0_4.md` – **v0.4 „platformer w ludzkiej skali”:** skala 40 px = 1 m, fizyka ruchu, zasady gry (HP, brak żyć/zegara/stompa). **Obowiązuje** zamiast 01 (fizyka) i 07.
10. `09_ATLAS_32_POZIOMOW_v0_4.md` – atlas 32 ręcznie projektowanych poziomów v0.4.
11. `10_ROADMAP_MIGRACJI_v0_4.md` – plan migracji w etapach A–F.
12. `11_PLANETY_GRAWITACJA_I_ROZNORODNOSC_v0_4.md` – grawitacja i różnorodność planet.
13. `12_IMPLEMENTACJA_v0_4.md` – **stan implementacji v0.4** (co jest zrobione, odstępstwa od specyfikacji, co czeka).
