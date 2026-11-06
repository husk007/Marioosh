import { describe, expect, it } from 'vitest';
import { LEVEL_IDS, getLevel } from '../src/game/levels';
import { runBot } from './bot';

// Regresja osiągalności: prosty bot musi dotrzeć do wyjścia (lub areny bossa) na każdym poziomie biegowym.
describe('osiągalność poziomów (bot)', () => {
  for (const id of LEVEL_IDS) {
    const L = getLevel(id);
    it(`${id} (${L.mode})`, () => {
      const r = runBot(id, 400);
      const ok = r.cleared || r.reachedArena;
      if (!ok) console.log(id, JSON.stringify(r));
      expect(ok, JSON.stringify(r)).toBe(true);
    }, 120000);
  }
});
