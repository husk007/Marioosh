# Testowanie

```bash
npm run typecheck      # tsc --noEmit
npm test               # Vitest (jednostkowe + generator + bot osiągalności) ≈ 2 s
npm run build && npm run test:e2e   # Playwright (Chromium) — zrzuty w e2e/out/
```
Własna przeglądarka dla e2e: `PW_CHROMIUM=/ścieżka/do/chrome npm run test:e2e`; w CI: `npx playwright-core install --with-deps chromium`.

## Co pokrywają testy
| Plik | Zakres |
|---|---|
| `tests/movement.test.ts` | kontroler ruchu: skok ≥ 2 i 4 kafelki (kryterium M1) dla obu braci, coyote, bufor skoku, przepaść 8 kafli w biegu, kolizje |
| `tests/levelgen.test.ts` | 32 poziomy × kontrole: wymiary, spawn, wyjście/arena, budżety (PET/puszki/mieszkańcy), brak przepaści > 6 kafli (z platformami), unikalne id, przewody mają cel w istniejącym pokoju |
| `tests/session.test.ts` | licznik opakowań 99/100/101, antyduplikacja, złota puszka, kaucja, limit żyć; zapis/odczyt/migracja/uszkodzony JSON; odblokowania i rekordy |
| `tests/world.test.ts` | tarcza i nietykalność, śmierć/respawn, stomp, skamienienie (miernik, opóźnienie, zanik, śmierć/posąg), co-op |
| `tests/i18n.test.ts` | 6 języków: komplet kluczy, brak pustych, zgodne `{parametry}`, RTL tylko arabski, właściwe pismo |
| `tests/reach.test.ts` | **bot osiągalności**: przechodzi poziom lub dociera do areny bossa (tryb „god”: wrogowie nie ranią; kolce i przepaście tak) |
| `e2e/smoke.mjs` | build w Chromium: tytuł w 6 językach (obraz niepusty), przejście menu → sloty → tryb → intro → mapa → gra, kilka sekund biegu, brak błędów w konsoli |

## Bot osiągalności i jego granice
Bot (`tests/bot.ts`) biegnie w prawo, skacze przez przeszkody/przepaści, włącza przełączniki, używa przewodów, a w zagadce W8-L2 wybiera właściwy przewód. Przechodzi **25 z 32** poziomów. Pozostałe **7** są jawnie oznaczone jako `skip` w `tests/reach.test.ts` z powodem:
`W3-L4` (lądowanie na wysepce), `W6-L2` (tryb wieży), `W7-L1…L4`, `W8-L4`. To granice *bota*, nie dowód, że poziom jest nieprzejezdny — **wymagają testu ręcznego** (zalecane: grać je z włączonym kodem `god` w konsoli: `__app` → scena rozgrywki → `world.god = true`).
Narzędzia diagnostyczne: `npx vite-node tools/trace.ts W2-L1 60`, `tools/dbg.ts` (ASCII-dump planszy: `npx vite-node tools/dbg.ts W2-L1 30 80`).

## Czego nie testowano
Natywnych paczek (Electron, Android, iOS), urządzeń dotykowych, padów, dźwięku (słuchowo), balansu trudności, pełnego przejścia gry przez człowieka, walk z bossami (poza dotarciem do areny i testami jednostkowymi reguł).
