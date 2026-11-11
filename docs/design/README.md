# Marioosh & Darioosh – dokumentacja projektowa

Pakiet projektowy gry „Klątwa Katoblepasa”: etap 1–2 (00–06), przebudowa pionowa v0.3 (07, historyczna) i **obowiązująca koncepcja v0.4 (08–12)**. Gra jest zaimplementowana (zob. [`12_IMPLEMENTACJA_v0_4.md`](12_IMPLEMENTACJA_v0_4.md) — co jest zrobione i co czeka); dokumenty poniżej to źródło projektu, nie opis kodu.

**Które dokumenty obowiązują:** koncepcja, fizyka, zasady i poziomy — **08–12** (w razie sprzeczności mają pierwszeństwo przed 01, 02, 06 i 07). Fabuła, bestiariusz (03), kierunek artystyczny (04), dane poziomów (05) i skamienienie/przewody/opakowania z 01 pozostają źródłem. Dokumentacja techniczna (architektura, testy, grafiki, audio): katalog [`docs/`](../) — w szczególności [`ART_PIPELINE.md`](../ART_PIPELINE.md).

## Kolejność czytania

1. `01_GDD_mechanika_v0_2.md` – fizyka, walka, kolizje, skamienienie, opakowania, kooperacja, przewody, bossowie.
2. `02_ATLAS_32_POZIOMOW_v0_2.md` – szczegółowe scenariusze wszystkich 32 poziomów i wzorcowe rozmieszczenie obiektów dla 1-1.
3. `03_BESTIARIUSZ_opis_v0_2.md` – komplet zasad 18 gatunków wrogów.
4. `03_BESTIARIUSZ_parametry_v0_2.json` – dane parametrów wrogów do przepisania do silnika gry.
5. `04_BIBLIA_GRAFICZNA_v0_2.md` – wygląd postaci i planet, palety, sprite'y, dźwięk, HUD.
6. `05_LEVELS_v0_2.json` – ustrukturyzowane wpisy 32 poziomów, cztery sekcje każdego etapu, budżety i sekrety; **to nie jest kompletna tilemapa**.
7. `06_ROADMAP_v0_2.md` – kolejność implementacji i kryteria odbioru.
8. `07_PRZEBUDOWA_PIONOWA_v0_3.md` – **v0.3:** przebudowa na wysoki, pionowy platformer (zbocza, wspinaczka, sprężyny, sekrety zależne od brata); uzupełnia i w razie sprzeczności zastępuje fizykę z GDD v0.2. **Od v0.4 dokument historyczny.**

## Ustalenia wymagające dalszego testowania (etap 2 — zachowane historycznie)

- Wszystkie prędkości, czasy i statystyki wrogów są propozycją startową do balansowania.
- Długości plansz w kafelkach oraz pozycje posągów są orientacyjnym blueprintem.
- Silnik: wybrano TypeScript + Canvas 2D (uzasadnienie w `docs/ARCHITECTURE.md`); Godot nie jest używany.
- Pierwszy grywalny wycinek (W1-L1, L2, L4) został zbudowany i rozszerzony do wszystkich 32 poziomów.

## Spójność z pierwotną historią

Osiem planet i ośmiu bossów pozostaje bez zmian. Siedem fragmentów kryształu pochodzi od strażników, ósmy z 8-3. Skróty działają, a pełne zakończenie wymaga wrócenia po pominięte znajdźki. Złota puszka warta 5 zwykłych pod względem kaucji, lecz fizycznie jest jednym opakowaniem przy naliczaniu +1 życia za 100 sztuk.
9. `08_NOWA_KONCEPCJA_FIZYKA_v0_4.md` – **v0.4 „platformer w ludzkiej skali”:** skala 40 px = 1 m, fizyka ruchu, zasady gry (HP, brak żyć/zegara/stompa). **Obowiązuje** zamiast 01 (fizyka) i 07.
10. `09_ATLAS_32_POZIOMOW_v0_4.md` – atlas 32 ręcznie projektowanych poziomów v0.4.
11. `10_ROADMAP_MIGRACJI_v0_4.md` – plan migracji w etapach A–F.
12. `11_PLANETY_GRAWITACJA_I_ROZNORODNOSC_v0_4.md` – grawitacja i różnorodność planet.
13. `12_IMPLEMENTACJA_v0_4.md` – **stan implementacji v0.4** (co jest zrobione, odstępstwa od specyfikacji, co czeka).
