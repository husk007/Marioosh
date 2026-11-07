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
