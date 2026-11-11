# Audio i wideo — czego potrzebuje gra i jak to zdobyć

**Stan na v0.4 (listopad 2026):**
- **Muzyka — dostarczona i podpięta:** 13 utworów (`title`, `map`, `w0`…`w8`, `boss`, `star`) leży w `public/audio/music/<klucz>.m4a` (AAC, ok. 20 MB razem) i jest ładowana przez `src/engine/audio.ts`. Gdy plik nie jest dostępny albo nie da się go odtworzyć, ta sama muzyka jest grana z syntezatora WebAudio (zawsze działa). Hosty, które nie serwują `.m4a` (np. podgląd w artefakcie), mogą wystawić te same pliki jako `.mp4` i ustawić `window.__MUSIC_EXT = 'mp4'` przed startem gry; `window.__NO_FILE_MUSIC = true` wyłącza pliki. **Ocena słuchowa (głośność, pętle, dobór do światów) jest jeszcze do zrobienia.**
- **Efekty dźwiękowe:** nadal w całości syntezowane w kodzie; wymiana na pliki jest opcjonalna (sekcja 2).
- **Wideo (intro, zakończenia, game over, tło tytułu, wejścia bossów):** nie ma jeszcze — intro to statyczne strony z tekstem. Sekcja 3 to instrukcja produkcji.
- Sekcje 1 i 2 poniżej zachowano jako **specyfikację** (prompty Suno, lista kluczy) na wypadek wymiany lub uzupełnienia utworów; nazwy plików to klucze z tabeli. Nowy klucz muzyczny wymaga wpisu w `FILE_MUSIC` w `audio.ts`.

---------------------------------------------------------------------------------------------------

## 1. MUZYKA (Suno)

Gra wywołuje 13 utworów (klucze `title`, `map`, `w0`…`w8`, `boss`, `star`). Zasady dla wszystkich:
- **Instrumental**, bez wokalu; długość 60–120 s; w prompcie dopisz: `seamless loop, no fade-out, no long intro, consistent loudness`.
- Suno nie zapętla — wybierz fragment, który kończy się na akordzie początkowym, albo użyj *Extend* i utnij w Audacity na granicy taktu. Jeśli utwór kończy się wyciszeniem, to też nic: zrobię w grze płynne przejście końca w początek.
- Pobieraj **WAV (najlepiej) lub MP3**; nazwij plik kluczem z tabeli (np. `w3.mp3`). Ja zamienię na OGG/M4A (≈1,2–1,5 MB na utwór → ~18 MB razem).
- Licencja: komercyjne użycie utworów z Suno obejmuje tylko plan płatny aktywny w chwili tworzenia — sprawdź swój plan i aktualny regulamin, zanim wydasz grę publicznie. Zachowaj daty tworzenia.

| Klucz | Gdzie gra | Pole „Style" w Suno (po angielsku) |
|---|---|---|
| `title` | ekran tytułowy, intro | `epic heroic adventure theme, 16-bit chiptune blended with orchestra, brass fanfare, driving drums, playful, 120 bpm, instrumental` |
| `map` | mapa planet | `light travel theme, curious and relaxed, glockenspiel, plucked strings, soft chiptune bass, 100 bpm, instrumental, loop` |
| `w0` | Pradowo (samouczek) | `friendly tutorial level, simple cheerful melody, ukulele, marimba, light chiptune, 110 bpm, instrumental, loop` |
| `w1` | Lumenia (zielona planeta, las) | `bright sunny forest planet, bouncy platformer music, flute, marimba, pizzicato strings, 125 bpm, instrumental, loop` |
| `w2` | Złomaria (złomowisko) | `industrial junkyard funk, metal percussion, clanking anvils, slap bass, gritty synth, quirky, 115 bpm, instrumental, loop` |
| `w3` | Florion (dżungla) | `lush alien jungle, tribal percussion, log drums, marimba, mysterious flutes, rhythmic, 118 bpm, instrumental, loop` |
| `w4` | Aqualis (podwodny) | `underwater dreamy platformer, soft synth pads, bubbly arpeggios, slow tempo, calm and mysterious, 85 bpm, instrumental, loop` |
| `w5` | Skaltria (pustynne skały) | `dusty desert canyon, oud, hand drums, twangy guitar, warm and adventurous, 105 bpm, instrumental, loop` |
| `w6` | Vespera (nocne miasto, ciemno) | `neon night city synthwave, dark and tense, pulsing bass, shimmering arps, moody, 100 bpm, instrumental, loop` |
| `w7` | Ferroks (fabryka) | `industrial factory techno, machine rhythms, conveyor belt beat, metallic hits, relentless, 128 bpm, instrumental, loop` |
| `w8` | Katoblis (planeta tyrana) | `dark gothic fortress, church organ, low choir pads, heavy war drums, ominous and epic, 90 bpm, instrumental, loop` |
| `boss` | walki z bossami | `intense boss battle, fast orchestral rock, aggressive strings, double-kick drums, brass stabs, 160 bpm, instrumental, loop` |
| `star` | gwiazda (nietykalność, ~20 s) | `hyper 8-bit invincibility theme, rapid arpeggios, bright square leads, euphoric, 170 bpm, instrumental, short loop` |

Opcjonalnie (dorzucę do kodu): `ending` (finał, ciepły i triumfalny, 60 s), `katoblepas` (osobny motyw ostatecznego bossa), jingle `clear` (4 s) i `gameover` (4 s — Suno zwykle robi z nich za długie, wtedy utnij).

---------------------------------------------------------------------------------------------------

## 2. DŹWIĘKI (SFX)

Obecne dźwięki z kodu są kompletne i działają — wymieniaj tylko te, które słychać najczęściej. Kolejność ważności:
`jump, land, swing (klucz), hit, stomp, pet (butelka), can (puszka), powerup, teleport, bossHit, bossDie, switch, break, crate, checkpoint, clear, gameover, die, oneup`.
Pozostałe (`warn, spark, beam, rock, star, free, ecoport, petrify, select, menu, golden, hurt, flash`) zostaw z kodu.

**Gdzie brać (wszystko darmowe):**
- **jsfxr** (sfxr.me) — generator retro w przeglądarce, przyciski Jump / Hit / Pickup / Powerup / Explosion; eksport WAV. Najszybsze i bez problemów licencyjnych (dźwięki są Twoje). Pasuje do stylu 16-bit.
- **Kenney.nl → Audio** (CC0) — gotowe paczki: Impact Sounds, Interface Sounds, Digital Audio, RPG Audio.
- **Freesound.org** — filtruj licencję **Creative Commons 0** (inne wymagają podania autora).
- **OpenGameArt.org** — filtr CC0.
- **Pixabay → Sound effects** — licencja Pixabay pozwala na użycie w grach bez podawania autora (sprawdź aktualny regulamin).
- Wideo z Veo (punkt 3) ma własną ścieżkę dźwiękową — ambience i odgłosy teleportacji można z niej wyciąć.

Wymagania: WAV lub MP3, krótko (0,1–1,5 s; `teleport`, `bossDie`, `clear` do 3 s), bez ciszy na początku, głośność podobna w całym zestawie. Nazwa pliku = klucz (`jump.wav`). Zapisuj, skąd pochodzi każdy plik (do `docs/LICENSES.md`).

---------------------------------------------------------------------------------------------------

## 3. WIDEO

Czego potrzeba, od najważniejszego:

| # | Film | Długość | Zastosowanie | Klatka startowa + obrazy referencyjne |
|---|---|---|---|---|
| 1 | Intro, część 1 — warsztat i przewód | 8 s | zastępuje intro.1–2 | `01-intro-warsztat.png` lub `02-intro-przewod.png`; ref: `marioosh`, `darioosh`, `przewod-fioletowy` |
| 2 | Intro, część 2 — teleportacja | 6–8 s | intro.3 i pierwsze wejście w przewód | `03-teleportacja.png`; ref: `marioosh`, `darioosh`, `przewod-fioletowy` |
| 3 | Intro, część 3 — Lumenia, posągi | 8 s | intro.4 | `04-lumenia-posagi.png`; ref: `marioosh`, `darioosh`, `posag-lumenianin` |
| 4 | Porwanie Scarlet | 8 s | intro.5 | `05-porwanie-scarlet.png`; ref: `katoblepas`, `scarlet` |
| 5 | Efekt teleportacji (nakładka) | 3–4 s | po każdym wejściu w przewód | bez klatki; ref: `przewod-fioletowy` |
| 6 | Zakończenie | 8 s | po pokonaniu Katoblepasa | `06-zakonczenie.png`; ref: `marioosh`, `darioosh`, `scarlet`, `lumenianie-uwolnieni` |
| 7 | Game Over — bracia w kamień | 5–6 s | ekran końca gry | `07-game-over-posagi.png` |
| 8 | Tło ekranu tytułowego (pętla) | 8 s | `title` | `08-tytul-katoblepas.png`; ref: `katoblepas` |
| 9 | Wejścia bossów ×8 (opcja) | 4–6 s | przed walką | `09-boss-N-….png`; ref: odpowiedni boss + `marioosh` |

### Jak wygenerować (Gemini → Veo, tryb „Obraz → wideo")
1. Wybierz wideo i proporcje **16:9**, wgraj **klatkę startową** z folderu `klatki-startowe/`. Jeśli narzędzie ma pole „obrazy referencyjne / składniki" — dorzuć wskazane postacie z `postacie/` (przezroczyste PNG).
2. Wklej prompt poniżej (po angielsku generuje lepiej). Za każdym razem dopisz **sufiks stylu**:
   `Stylized 2D painterly cartoon game cutscene, keep the exact character designs and colors from the reference image, consistent faces and outfits, no text, no subtitles, no logos, smooth natural motion.`
3. Dostępność i limity Veo zależą od Twojego planu Gemini — sprawdź w aplikacji. Jeśli nie ma wideo, ten sam prompt zadziała w innym generatorze wideo, o ile przyjmuje obraz startowy.
4. Wybierz najlepsze ujęcie, pobierz **MP4**. Nazwy: `intro1.mp4`, `intro2.mp4`, … `title.mp4`.

### Prompty
**1 · Intro, część 1** (klatka `01`/`02`):
`The two brothers, Marioosh in the orange work overall with a blue helmet and Darioosh in the blue uniform with a yellow helmet, stand in their small workshop at dusk. A purple teleport conduit begins to glow and hum next to them; sparks and soft purple light spill across the floor. They look at it, surprised, then Marioosh steps forward and points at the glowing pipe. Slow camera push-in, warm workshop light mixed with purple glow.`

**2 · Teleportacja** (klatka `03`):
`The two brothers stand in front of a glowing purple conduit. A swirling purple and cyan energy vortex pulls them in; their clothes and hair whip toward the pipe, sparks and light streaks spiral, they are sucked into the conduit and a bright white flash fills the screen. Dynamic camera push toward the vortex, ends on the flash.`

**3 · Lumenia — posągi** (klatka `04`):
`The brothers arrive on a sunny green forest planet and look around. Stone-statue villagers stand frozen in the grass, frozen mid-gesture with fear on their faces. Marioosh slowly walks up and touches one statue; the camera pans slowly across the silent frozen crowd, soft wind moves the leaves, a sad hopeful mood.`

**4 · Porwanie Scarlet** (klatka `05`):
`Night, a ruined city. The huge dark purple stone bull Katoblepas with glowing red eyes and glowing purple crystals stomps forward and looks down at the red-haired princess Scarlet, who raises a glowing cyan crystal to protect herself. The bull's red gaze flashes, a wave of purple energy washes over her, and she is lifted away in a swirl of purple light as the bull roars. Dramatic low camera, strong rim lighting.`

**5 · Efekt teleportacji** (bez klatki; z `przewod-fioletowy` jako referencją) — kluczowe: **czarne tło**, bo w grze nałożę go trybem „screen" (czerń zniknie):
`A swirling magical teleportation vortex of purple and cyan light and sparks on a pure solid black background, centered, expanding spiral rings and star particles, loopable, camera completely static, no objects, no characters, no floor, nothing but the glowing effect on pure black.`

**6 · Zakończenie** (klatka `06`):
`Victory in the sunny green valley. Marioosh and Darioosh stand together with Princess Scarlet and the freed villagers, who cheer and hug as confetti-like glowing petals and light particles float in the air. Scarlet smiles and thanks the brothers, Marioosh and Darioosh give each other a fist bump. Warm golden sunset light, slow crane camera rising up and away.`

**7 · Game Over** (klatka `07`):
`The two brothers stand in a dark cursed fortress as a cold purple-red light washes over them. Their bodies slowly turn into grey stone from the feet upward, cracks spread, their expressions freeze in surprise. The camera slowly pulls back leaving two stone statues, fading toward darkness.`

**8 · Tło tytułu — pętla** (klatka `08`):
`The huge dark stone bull Katoblepas looms in the center of a dark crimson sky, glowing red eyes pulsing slowly, purple crystals glimmering on its back, embers and ash drifting upward, slow subtle breathing movement. Camera almost static with a very slow zoom, calm menacing mood, loopable.`

**9 · Wejście bossa** (klatka `09-boss-N`):
`<NAZWA BOSSA> enters the arena and roars at the small worker hero in orange, who braces himself; dust and debris fly, the ground shakes, the boss slams the floor and the camera shakes slightly, then holds on the boss's glaring face. Dramatic low angle, short and punchy.`

### Wymagania techniczne
- MP4 (H.264), 1280×720, do 8 s, 24–30 fps, docelowo **1–3 MB** na plik (po konwersji zrobię WebM/MP4 i przycinanie). Zestaw 1–8 to ok. 15–20 MB.
- Filmy będą odtwarzane z przyciskiem „pomiń"; w podglądzie jednoplikowym (artefakt) ich nie będzie — tylko w wydaniach (web/Android/iOS/Windows/Linux).
- Pętla tytułu: odtworzę w tę i z powrotem (ping-pong), więc wystarczy jedno 8-sekundowe ujęcie.
- Film z efektem (nr 5) nie ma kanału alfa — dlatego czarne tło i tryb „screen".
- Postaci z klatek może trochę „płynąć" w ruchu. Jeśli twarze się rozjeżdżają, skróć prompt, opisz mniej ruchów albo wygeneruj ponownie — zwykle 2–3 próby wystarczą.

---------------------------------------------------------------------------------------------------

## 4. Jak mi to przekazać
- Muzykę (wymiana/uzupełnienie) i dźwięki wrzuć do repo w `audio-inbox/` (katalog nie istnieje, dopóki nie jest potrzebny; albo załącz plik w rozmowie): `music/<klucz>.mp3`, `sfx/<klucz>.wav` — konwersja do M4A i podpięcie robi się w `public/audio/music/`.
- Filmy: `video-inbox/<nazwa>.mp4`.
- Dalej: konwersja, ładowanie z fallbackiem na dźwięk z kodu (muzyka już tak działa), podpięcie filmów do intro/zakończenia/game over/tytułu i robię nowe wydanie.
