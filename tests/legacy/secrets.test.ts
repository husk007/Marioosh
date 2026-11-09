import { describe, expect, it } from 'vitest';
import { LEVEL_IDS, getLevel } from '../src/game/levels';
import { REWARDS } from '../src/game/levelgen2';
import { newMove, stepMovement, type MoveInput } from '../src/game/movement';
import type { Grid } from '../src/game/physics';
import type { Brother } from '../src/game/constants';
import { DT, noInput } from './helpers';

const gridOf = (id: string): Grid => { const r = getLevel(id).rooms[0]; return { w: r.w, h: r.h, tiles: r.tiles.slice() }; };
const sim = (m: ReturnType<typeof newMove>, g: Grid, frames: number, f: (i: number, inp: MoveInput) => boolean | void) => { for (let i = 0; i < frames; i++) { const inp = noInput(); if (f(i, inp)) return true; stepMovement(m, inp, g, DT); } return false; };

/** wszystkie nagrody ze wszystkich poziomów (poza wieżą i wodą) */
const all: { id: string; r: ReturnType<typeof REWARDS.get> extends (infer T)[] | undefined ? T : never }[] = [];
for (const id of LEVEL_IDS) { getLevel(id); for (const r of REWARDS.get(id) ?? []) all.push({ id, r }); }

describe('sekrety zależne od brata', () => {
  it('każdy zwykły poziom (poza wodnym, wieżą i bossami) ma kapsułę Marioosha, trasę górną i szyb Dariooosha', () => {
    for (const id of LEVEL_IDS) {
      const L = getLevel(id); if (L.mode !== 'run' || id === 'W8-L2') continue;     // W8-L2: sala przewodów zajmuje większość poziomu
      const k = new Set((REWARDS.get(id) ?? []).map((r) => r.kind));
      expect([...k].sort(), id).toEqual(['loft', 'vaultD', 'vaultM']);
    }
  });
  it('trasa górna: sprężyna wynosi obu braci na półkę', () => {
    const lofts = all.filter((a) => a.r.kind === 'loft');
    expect(lofts.length).toBeGreaterThan(10);
    for (const { id, r } of lofts) for (const br of ['M', 'D'] as Brother[]) {
      const g = gridOf(id); const m = newMove(br, (r.x - 3) * 32 + 8, r.gy * 32);
      const row = r.gy - 9; let ok = false;
      sim(m, g, 60 * 5, (i, inp) => { inp.right = true; if (m.body.onGround && Math.abs(m.body.y + m.body.h - row * 32) < 1 && m.body.x > (r.x + 1) * 32 && m.body.x < (r.x + 17) * 32) { ok = true; return true; } });
      expect(ok, `${id} ${br} loft @${r.x}`).toBe(true);
    }
  });
  it('szyb: Darioosh wskakuje na półkę odbijając się od ścian, Marioosh nie', () => {
    const vs = all.filter((a) => a.r.kind === 'vaultD'); expect(vs.length).toBeGreaterThan(10);
    for (const { id, r } of vs) {
      const top = r.gy - 9;
      const attempt = (br: Brother) => {
        const g = gridOf(id); const m = newMove(br, (r.x + 6) * 32 + 16 - 10, r.gy * 32); let want: 1 | -1 = 1; let ok = false;
        sim(m, g, 60 * 14, (i, inp) => {
          inp.jumpHeld = true;
          if (m.body.y + m.body.h < top * 32 + 8) { inp.jumpHeld = false; inp.right = m.body.x < (r.x + 9) * 32; } else { inp.right = want === 1; inp.left = want === -1; if (m.body.onGround || m.wallSlide) inp.jumpPressed = true; if (m.walljumped) want = want === 1 ? -1 : 1; }
          if (m.body.onGround && Math.abs(m.body.y + m.body.h - top * 32) < 1 && m.body.x > (r.x + 8) * 32 - 4) { ok = true; return true; }
        });
        return ok;
      };
      expect(attempt('D'), `${id} D vaultD @${r.x}`).toBe(true);
      expect(attempt('M'), `${id} M vaultD @${r.x}`).toBe(false);
    }
  });
  it('kapsuła: Marioosh rozbija posadzkę uderzeniem i sprężyna odsyła go z powrotem; Darioosh nie wejdzie', () => {
    const vs = all.filter((a) => a.r.kind === 'vaultM'); expect(vs.length).toBeGreaterThan(10);
    for (const { id, r } of vs) {
      const g = gridOf(id); const m = newMove('M', (r.x + 5) * 32 + 16 - 11, (r.gy - 4) * 32); let inside = false, out = false, pounded = false;
      // start 4 kafle nad podłogą dokładnie nad środkiem kapsuły: uderzenie w ziemię → rozbija pęknięty kafel pod stopami (jak w World.groundPound)
      sim(m, g, 60 * 6, (i, inp) => {
        if (i === 2) inp.downPressed = true;
        if (m.pounded && !pounded) { pounded = true; const ty = Math.floor((m.body.y + m.body.h + 1) / 32); for (let tx = Math.floor((m.body.x - 4) / 32); tx <= Math.floor((m.body.x + m.body.w + 4) / 32); tx++) { if (g.tiles[ty * g.w + tx] === 8) g.tiles[ty * g.w + tx] = 0; } }
        if (m.body.y > (r.gy + 1) * 32) inside = true;
        if (inside && m.body.y + m.body.h < r.gy * 32 - 64) { out = true; return true; }
      });
      expect(pounded && inside && out, `${id} M vaultM @${r.x} pounded=${pounded} inside=${inside} out=${out}`).toBe(true);
    }
  });
});
