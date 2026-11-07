# Ilustracje HD — fala 1 (wektorowe, gładkie 2D)

Ten katalog zawiera 12 **nowych plików SVG**, nie sprite sheety. Obejmuje Rogusia, Pszczółroga, Gekoroga, Bazaliska, Rogopłetwa, Ośmioroga, Kakturożca, Rogopnącze, Ślimoroga, Rogoskoczka, Kamienioroga i małego drona Rogodrona.

## Integracja
- Pliki są w `public/art/hd/enemies/*.svg`.
- `src/sprites/hd.ts` wstępnie wczytuje każdy plik i rasteruje do kanwy 4x większej niż rozmiar logiczny.
- `src/sprites/art.ts` wybiera plik HD, jeśli został prawidłowo wczytany; w przeciwnym razie używa starego rysunku proceduralnego.
- `src/main.ts` wczytuje grafiki przed otwarciem ekranu tytułowego.

## Ograniczenia tej partii
To pierwsze **grywalne warianty wektorowe**, a nie finalne ręcznie malowane grafiki z ilustracji referencyjnych. Każdy wróg ma jedną klatkę nieruchomą. Animacje ruchu, skamienienia i ataku oraz integracja oryginalnych przesłanych portretów HD wymagają dalszych prac. Bossowie i bohaterowie pozostają na dotychczasowym rendererze, aby nie wprowadzać niezgodnych proporcji.

Zachowujemy osiem nazw światów i dwunożnych bossów, bez zastępowania ich cudzymi postaciami.

## Fala 2 – tła planet HD

Dodano dziewięć autorskich, pełnoekranowych teł SVG (planety 0–8) w `public/art/hd/worlds/`. Wczytywane są do Canvas z dwukrotnym supersamplingiem przez `src/sprites/hd.ts`. Scena gry wykorzystuje nowe tło przed trzema starymi warstwami paralaksy; na błędzie pobierania wraca do wygenerowanego nieba. Każdy świat ma własne barwy i charakterystyczne detale. Tła są ilustracyjnym pierwszym przebiegiem, wciąż wymagają dalszego dopracowania grafiki koncepcyjnej i warstw paralaksy.

## Generator grafik (OpenAI)
`tools/gen-art.mjs` generuje PNG-i z biblioteki promptów (`tools/art-prompts.json`, 629 assetów) przez OpenAI Images API do `public/art/gen/<kategoria>/<ID>.png`. Klucz tylko z `OPENAI_API_KEY` (lokalnie lub sekret GitHub Actions — workflow „Generuj grafiki (OpenAI)”). Pliki z `public/art/gen/` nie są jeszcze wpięte w grę.
