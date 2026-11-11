# Potok grafik i Art Station

Jak w tym repozytorium powstają obrazy HD, jak trafiają do gry i skąd wiadomo, co jeszcze brakuje. Zasada nadrzędna: **gra zawsze działa bez nowych plików** — każdy brakujący obraz zastępuje grafika proceduralna lub najbliższa istniejąca poza.

## Przegląd
```
tools/art-prompts.json  (zasoby: opisy, prompty, referencje)   ┐
tools/art-poses.json    (pozy: stan + prompt + liczba klatek)  ├─ node tools/art-roadmap.mjs ─┬─ art-tasks/ROADMAP.md
tools/art-mechanics.json (identyfikatory elementów mechanik)   │                              ├─ art-tasks/windows/W###.md  (okna po 10 pozycji)
art-tasks/scope.json    (zakres: pominięte zasoby, SKIP)       ┘                              ├─ art-tasks/station-data.json
                                                                                               └─ art-tasks/station/index.html  (Art Station)
 generowanie obrazu (Gemini / ChatGPT, ręcznie lub zadaniem cyklicznym)
        ↓  pliki „ASSET-ID__stan.png"
 art-inbox/  ──(workflow „Wczytaj grafiki z art-inbox")──▶ public/art/gen/<kategoria>/…  (źródło, WebP z alfą)
        ↓  node tools/pack-game-art.mjs
 public/art/game/  (przycięte, zmniejszone; ładowane przez src/sprites/gen.ts + genmap.ts)
```

## Art Station
Samodzielna strona `art-tasks/station/index.html` (generowana, nie edytować ręcznie). Pokazuje kolejkę brakujących obrazów z kartami: nazwa pliku docelowego, referencje do dołączenia, przycisk **Kopiuj prompt**, strefa na gotowy obraz. Możesz pobrać referencje (ZIP), wrzucić kilka obrazów naraz i wyeksportować **ZIP do wysłania** do `art-inbox/`. Strona pobiera referencje i listę (`Odśwież listę`) z gałęzi `main` GitHuba — nowe zasoby widać więc po scaleniu zmian. Szukaj po nazwie, ID lub stanie (np. `swim`, `ladder`, `CHARACTERS-001`).

Kolejność w kolejce: zasoby bazowe wg kategorii, **od v0.4 jednak pozy Marioosha i Darioosha są pierwsze** (definiują skalę i animację całej gry), potem elementy human-scale (kategoria `mechanics`), potem reszta.

## Naming i dostarczanie
- Plik: `ASSET-ID__stan.png` (np. `CHARACTERS-001__swim_tread.png`; baza = `__base`). Brak referencji → sufiks `~noref`.
- Tło: PNG z prawdziwą przezroczystością (kanał alfa); workflow wycina resztki tła (`tools/cutout.mjs`, `tools/clean-art.mjs`).
- Obrazy trafiają do `art-inbox/` (pojedyncze pliki lub ZIP z Art Station) na `main` → workflow **Wczytaj grafiki z art-inbox** (`ingest-art.yml`) wycina tło, zamienia na WebP, aktualizuje manifest i `ROADMAP.md`.
- Instrukcja dla agenta generującego obrazy: [`art-tasks/AGENTS.md`](../art-tasks/AGENTS.md); gotowy prompt do zadania cyklicznego: [`art-tasks/TASK_PROMPT.md`](../art-tasks/TASK_PROMPT.md). Workflow `gen-art.yml` (API OpenAI) jest opcjonalny i wymaga płatnego klucza — **nie jest używany**; produkcja idzie przez subskrypcje Gemini/ChatGPT.

## Zestaw póz braci (v0.4)
Źródło prawdy: `tools/add-v04-art.mjs` (idempotentny; uruchom go i potem `node tools/art-roadmap.mjs`). Zestaw wynika z `docs/design/08_NOWA_KONCEPCJA_FIZYKA_v0_4.md` §9. Każdy brat ma ok. 50 póz:

| Grupa | Stany |
|---|---|
| Chód i bieg | `idle`, `walk`, `run`, `run_start`, `brake`, `turn`, `walk_uphill`, `walk_downhill`, `run_uphill`, `run_downhill` |
| Skok i upadek | `jump_takeoff`, `jump_rise`, `jump_apex`, `fall`, `fall_long`, `land`, `land_stumble`, `land_hard` |
| Przeszkody | `crouch`, `crawl`, `vault`, `ledge_hang`, `ledge_pull_up` |
| Drabina i winda | `ladder_idle`, `ladder_climb_up`, `ladder_climb_down`, `ladder_top_exit`, `ladder_jump_off`, `lift_ride` |
| Woda | `swim`, `swim_tread`, `swim_dive`, `swim_up`, `swim_gasp`, `swim_low_air`, `swim_drown`, `wade` |
| Interakcje i walka | `door_enter`, `teleport_entry`, `interact_panel`, `push`, `carry`, `wrench_light`, `wrench_heavy` (M) / `wrench_fast` (D), `tool_defense`, `hurt`, `downed`, `revive_brother`, `victory` |

Usunięte jako niezgodne z v0.4: `glide`, `wall_slide`, `wall_jump`, `roll`, `ground_pound`, `spring_launch`, `climb_grate`, `climb_wire`. Pominięte w zakresie zasoby mechanik v0.3 (sprężyna, kratka, łańcuch, wywietrznik, pęknięta posadzka) — `art-tasks/scope.json` → `skip_ids`.

Nowe elementy human-scale (kategoria `mechanics`): drabina, drzwi pełnej wielkości, platforma windy, przekaźnik (wyłączony / świecący), cztery znaki sieci (błyskawica, księżyc, liść, gwiazda), lustro, filar, węzeł energii, głaz-osłona, balkon z balustradą, pasek powierzchni wody, kieszeń powietrza, rampa 26°.

## Jak gra wybiera pozę
`heroFrameFor` (`src/game/worldDraw.ts`) zamienia stan kontrolera na klatkę (`HeroFrame`, `src/sprites/hero.ts`): rampa pod górę / z góry (znak kąta × kierunek ruchu), bieg, drabina (stoi / góra / dół), pływanie (`tread` / `dive` / `swimUp` / `swim`), brodzenie, lądowanie (`stumble` / `hardLand`), podciąganie i przeskok. `src/sprites/genmap.ts` mapuje klatkę na plik `ASSET-ID__stan`; **jeśli pliku nie ma, bierze kolejny zamiennik z listy** (np. `walk_uphill → run_uphill → walk → base`), więc nowe pozy włączają się same po dodaniu obrazu. Test: `tests/hero-frames.test.ts`.

## Typowe czynności
```bash
node tools/add-v04-art.mjs         # (jednorazowo) przebudowa definicji póz i elementów v0.4 — idempotentne
node tools/art-roadmap.mjs         # przelicz ROADMAP, okna, dane i stronę Art Station + spakuj grafiki gry
node tools/build-station.mjs       # tylko odbuduj stronę Art Station z station-data.json
node tools/pack-game-art.mjs       # public/art/gen → public/art/game (grafiki używane w grze)
node tools/art-export.mjs          # podgląd grafik proceduralnych → docs/art/*.png
node tools/preview.mjs heroes      # podgląd w powiększeniu → e2e/out/preview-*.png
node tools/make-video-kit.mjs out  # klatki startowe do generatora wideo (zob. PRODUKCJA_AUDIO_WIDEO.md)
```
Nowy zasób: dopisz do `tools/art-prompts.json` (prompt zgodny z biblią graficzną `docs/design/04` i skalą z `docs/design/08` §9), nową pozę do `tools/art-poses.json`, uruchom `art-roadmap.mjs`. Pamiętaj, by nowy stan dodać też do `genmap.ts`, jeśli gra ma go używać.
