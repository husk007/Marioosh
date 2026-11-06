import { describe, expect, it } from 'vitest';
import { LEVEL_IDS, getLevel } from '../src/game/levels';
import { runBot } from './bot';

/**
 * Regresja osiągalności: prosty bot (tests/bot.ts, tryb „god” — wrogowie nie ranią, kolce i przepaście tak)
 * musi dotrzeć do wyjścia lub areny bossa. Bot jest prosty i NIE potrafi wszystkiego — poziomy poniżej
 * są znane jako „poza zasięgiem bota” i wymagają testu ręcznego (patrz docs/TESTING.md).
 * Lista jest celowo jawna: usuwaj wpisy, gdy bot się poprawi.
 */
const BOT_LIMITS: Record<string, string> = {
  'W3-L4': 'lądowanie na 3-kafelkowej wysepce po skoku z platformy (bot nie hamuje w powietrzu)',
  'W6-L2': 'tryb wieży (pionowy) — bot biegnie tylko poziomo',
  'W7-L1': 'kombinacje przepaść+kolce+ruchome platformy (bot ginie w pętli)',
  'W7-L2': 'jw.',
  'W7-L3': 'jw. (poziom z częścią pionową)',
  'W7-L4': 'jw. (arena bossa)',
  'W8-L4': 'finałowy poziom z zagadką — bot nie rozwiązuje',
};

describe('osiągalność poziomów (bot)', () => {
  for (const id of LEVEL_IDS) {
    const L = getLevel(id);
    const name = `${id} (${L.mode})`;
    if (BOT_LIMITS[id]) { it.skip(`${name} — poza zasięgiem bota: ${BOT_LIMITS[id]}`, () => {}); continue; }
    it(name, () => {
      const r = runBot(id, 400);
      const ok = r.cleared || r.reachedArena;
      if (!ok) console.log(id, JSON.stringify(r));
      expect(ok, JSON.stringify(r)).toBe(true);
    }, 120000);
  }
});
