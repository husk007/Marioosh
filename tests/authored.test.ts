import { describe, expect, it } from 'vitest';
import { AUTHORED } from '../src/game/maps';
import { getLevel } from '../src/game/levels';
import { TILE } from '../src/game/constants';
import { analyze } from './reach';

describe('poziomy v0.4: osiągalność bez trybu god (obaj bracia solo)', () => {
  for (const id of Object.keys(AUTHORED)) {
    describe(id, () => {
      const L = getLevel(id);
      it('ma unikalne identyfikatory przedmiotów i posągów, start i poprawne pokoje', () => {
        const ids = new Set<string>(); const dup: string[] = [];
        for (const r of L.rooms) for (const s of r.specs) { const k = s.t === 'item' || s.t === 'crate' || s.t === 'statue' || s.t === 'switch' ? s.id : null; if (k) { if (ids.has(k)) dup.push(k); ids.add(k); } }
        expect(dup).toEqual([]);
        for (const r of L.rooms) { expect(r.tiles.length).toBe(r.w * r.h); expect(r.spawn.x).toBeGreaterThan(0); }
      });
      for (const brother of ['M', 'D'] as const) {
        it(`${brother}: dociera do checkpointu, wyjścia/areny, wszystkich przełączników, posągów i opakowań`, () => {
          const a = analyze(L, brother);
          const missing: string[] = [];
          L.rooms.forEach((r, ri) => {
            for (const s of r.specs) {
              if (s.t === 'checkpoint' && !a.reaches(ri, s.x, s.y, 40, 10)) missing.push(`checkpoint@${s.x},${s.y} r${ri}`);
              if (s.t === 'exit' && !a.reaches(ri, s.x, s.y, 40, 10)) missing.push(`exit@${s.x},${s.y} r${ri}`);
              if (s.t === 'switch' && !a.switchesOn.has(`${ri}:${s.id}`)) missing.push(`switch ${s.id}`);
              if (s.t === 'statue' && !a.reaches(ri, s.x, s.y, 44, 12)) missing.push(`statue ${s.id}`);
              if (s.t === 'item' && ['pet', 'can', 'golden', 'battery', 'xl'].includes(s.k) && !a.touches(ri, s.x, s.y, 24)) missing.push(`item ${s.id}@${Math.round(s.x / TILE)},${Math.round(s.y / TILE)}`);
              if (s.t === 'gate' && !a.openGates.has(`${ri}:${s.id}`)) missing.push(`gate ${s.id}`);
            }
          });
          expect(missing).toEqual([]);
        }, 120000);
      }
      it('budżet opakowań zgodny z levels.json (PET/puszki/złote)', () => {
        let pet = 0, can = 0, gold = 0;
        for (const r of L.rooms) for (const s of r.specs) if (s.t === 'item') { if (s.k === 'pet') pet++; else if (s.k === 'can') can++; else if (s.k === 'golden') gold++; }
        expect({ pet, can, gold }).toEqual({ pet: L.budget.pet, can: L.budget.cans, gold: L.budget.golden });
      });
    });
  }
});
