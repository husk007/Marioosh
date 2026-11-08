import { describe, expect, it } from 'vitest';
import { LEVEL_IDS, getLevel } from '../src/game/levels';
import { runBot } from './bot';

/**
 * Regresja osiągalności: bot (tests/bot.ts, tryb „god” — wrogowie nie ranią, kolce i przepaście tak) musi
 * dotrzeć do wyjścia lub areny bossa — OSOBNO jako Marioosh i jako Darioosh, po trasie głównej, którą generator
 * gwarantuje obu braciom. Wieża (W6-L2, tryb pionowy) ma własne testy etapów w tests/tower.test.ts.
 * Lista wyjątków jest jawna: usuwaj wpisy, gdy bot się poprawi.
 */
const BOT_LIMITS: Record<string, string> = {
  'W6-L2': 'tryb wieży (pionowy) — testowany etapami w tests/tower.test.ts',
};
const only = process.env.LV?.split(',');

describe('osiągalność poziomów (bot)', () => {
  for (const id of LEVEL_IDS) {
    if (only && !only.includes(id)) continue;
    const L = getLevel(id);
    for (const br of ['M', 'D'] as const) {
      const name = `${id} (${L.mode}) ${br === 'M' ? 'Marioosh' : 'Darioosh'}`;
      if (BOT_LIMITS[id]) { it.skip(`${name} — ${BOT_LIMITS[id]}`, () => {}); continue; }
      it(name, () => {
        const r = runBot(id, 300, 0, undefined, true, br);
        const ok = r.cleared || r.reachedArena;
        if (!ok) console.log(id, br, JSON.stringify(r));
        expect(ok, JSON.stringify(r)).toBe(true);
      }, 200000);
    }
  }
});
