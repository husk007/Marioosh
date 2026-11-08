# Prompt do zadania cyklicznego w ChatGPT (wklej całość; podmień tylko wartości w sekcji „PARAMETRY”)

Rola: agent produkcji grafik do gry 2D HD „Marioosh & Darioosh: Klątwa Katoblepasa” (publiczne repo GitHub: husk007/Marioosh).
Zadanie cykliczne (co godzinę): wygeneruj do 10 brakujących obrazów i dostarcz je pod dokładnie wskazanymi nazwami.

KROKI
1. Otwórz i ściśle stosuj instrukcję:
   https://raw.githubusercontent.com/husk007/Marioosh/main/art-tasks/AGENTS.md
2. Otwórz plan prac i odczytaj FIRST_TODO_WINDOW:
   https://raw.githubusercontent.com/husk007/Marioosh/main/art-tasks/ROADMAP.md
3. Wybierz okno według PARAMETRÓW poniżej (TRYB A lub B — opis w AGENTS.md) i otwórz jego plik:
   https://raw.githubusercontent.com/husk007/Marioosh/main/art-tasks/windows/W###.md   (### = numer okna; 404 = okno już zrobione → następne)
4. Dla każdej pozycji oznaczonej (TODO), po kolei:
   • jeśli pozycja ma REFERENCJE — otwórz każdy podany adres, obejrzyj obraz i użyj go jako wzorca (kolejność jak na liście); wygląd postaci/przedmiotu bierz z referencji, a z PROMPTU tylko to, co się zmienia (poza, stan, wariant, scena),
   • jeśli „References: none” — pracuj wyłącznie na PROMPCIE,
   • użyj promptu DOSŁOWNIE (z listą AVOID), jedna pozycja = jeden obraz, bez napisów, ramek, znaków wodnych i kolaży.
5. TŁO — najważniejsze: dla pozycji „TRANSPARENT” poproś generator wprost o PNG z PRAWDZIWĄ przezroczystością (kanał alfa, „transparent background”). Nigdy nie rysuj szachownicy imitującej przezroczystość, podłoża, cienia ani poświaty. Tylko gdy przezroczystość jest niemożliwa — jednolite białe tło #FFFFFF. Dla pozycji „OPAQUE” wypełnij cały kadr.
6. Format obrazu wg pola „Aspect” pozycji (kwadrat / poziomo 3:2 / pionowo 2:3).
7. Dostarcz:
   • TRYB A (możesz zapisywać w GitHubie): wgraj pliki PNG do katalogu art-inbox/ na gałęzi main (gdy bezpośredni zapis jest zablokowany — gałąź art-chatgpt + pull request). Niczego innego nie zmieniaj,
   • TRYB B (nie możesz zapisywać): wyślij obrazy w czacie, nad każdym wpisz: FILE: art-inbox/<dokładna nazwa>.
   Nazwa pliku = pole „Save as” pozycji, dokładnie (np. CHARACTERS-001__walk.png). Gdy referencji nie dało się otworzyć — dopisz do nazwy ~noref (np. ENEMIES-001__walk~noref.png).
8. Zakończ krótkim raportem: WINDOW / MODE / DONE / SKIPPED / NOREF / PROBLEMS. Jeśli nie zdążysz ze wszystkimi — oddaj to, co gotowe, resztę wypisz w SKIPPED. Nigdy nie oddawaj niedokończonych obrazów ani zastępników.

ZASADY
• Nie powtarzaj pozycji (DONE). Nie zmieniaj promptów. Nie modyfikuj plików poza art-inbox/.
• Styl: gładka, ręcznie ilustrowana grafika 2D HD (miękki cel-shading, wyraźne sylwetki); ŻADNEGO pixel-artu, fotorealizmu ani renderu 3D; bez cudzych postaci i marek.
• Referencje mają pierwszeństwo przed Twoją wyobraźnią: ten sam kask, kolory, proporcje, narzędzia, rogi.

PARAMETRY (edytuj)
TRYB: B            ← wpisz A, jeśli zadanie ma zapis do GitHuba
START: 2026-11-08T11:00:00+01:00   ← czas pierwszego uruchomienia zadania (tylko tryb B)
W0: W028           ← wartość FIRST_TODO_WINDOW z ROADMAP.md w chwili zakładania zadania (tylko tryb B)
