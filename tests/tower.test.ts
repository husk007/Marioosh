import { describe, expect, it } from 'vitest';
import { getLevel } from '../src/game/levels';
import { TOWER_STAGES, type TowerStage } from '../src/game/levelgen';
import { newMove, stepMovement } from '../src/game/movement';
import type { Grid } from '../src/game/physics';
import type { Brother } from '../src/game/constants';
import { DT, noInput } from './helpers';

/**
 * Wieża (W6-L2): trasa to ciąg etapów — schody z platform, wspinaczka po kratce (Marioosh męczy się po ok. 3 s,
 * Darioosh nie), sprężyna. Każdy etap symulujemy prawdziwą fizyką dla OBU braci: start na poprzedniej półce,
 * cel — stanąć na następnej.
 */
const ID = 'W6-L2';
const room = () => getLevel(ID).rooms[0];

function runStage(br: Brother, i: number, over?: TowerStage): { ok: boolean; t: number; y: number } {
  const r = room(); const g: Grid = { w: r.w, h: r.h, tiles: r.tiles.slice() };
  const st = TOWER_STAGES.get(ID)!; const s = over ?? st[i];
  const prev = over ? st[st.length - 1] : i === 0 ? { x0: 2, w: r.w - 4, row: r.h - 3 } : st[i - 1];
  const sx = s.kind === 'stairs' ? Math.min(prev.x0 + prev.w - 1, Math.max(prev.x0 + 1, s.x0 + s.w / 2)) : (s.xg ?? prev.x0 + 1);
  const m = newMove(br, sx * 32 + 8, prev.row * 32);
  const tx = (s.x0 + s.w / 2) * 32;
  let climbT = 0;
  for (let f = 0; f < 60 * 14; f++) {
    const inp = noInput();
    const feet = m.body.y + m.body.h, cx = m.body.x + m.body.w / 2;
    if (s.kind === 'stairs') {
      inp.right = cx < tx - 6; inp.left = cx > tx + 6; inp.jumpHeld = true;
      if (m.climbing) inp.jumpPressed = true;        // przypadkowo złapana kratka — odbicie
      if (m.body.onGround && feet > s.row * 32 + 4) inp.jumpPressed = true;
    } else if (s.kind === 'climb') {
      const gx = (s.xg! + 0.5) * 32;
      if (m.climbing) { inp.up = true; climbT++; if (feet <= s.row * 32 - 24) { inp.right = cx < tx; inp.left = cx > tx; } }
      else if (feet < s.fromRow! * 32 - 100 && feet > s.row * 32 + 4) { inp.right = cx < tx; inp.left = cx > tx; inp.jumpPressed = true; inp.jumpHeld = true; }
      else if (feet > s.row * 32 + 4 && Math.abs(cx - gx) > 3) { inp.right = cx < gx; inp.left = cx > gx; }
      else if (feet > s.row * 32 + 4) inp.up = true;
      else { inp.right = cx < tx; inp.left = cx > tx; }
    } else {
      const gx = (s.xg! + 0.5) * 32;
      if (m.body.onGround) { inp.right = cx < gx - 4; inp.left = cx > gx + 4; }
      else { inp.right = cx < tx - 6; inp.left = cx > tx + 6; }
    }
    stepMovement(m, inp, g, DT);
    if (m.body.onGround && m.body.y + m.body.h <= s.row * 32 + 1.5 && cx > 32 && cx < (r.w - 1) * 32) return { ok: true, t: f / 60, y: m.body.y };
  }
  return { ok: false, t: 14, y: m.body.y };
}

describe('wieża W6-L2: etapy dla obu braci', () => {
  getLevel(ID);
  const stages = TOWER_STAGES.get(ID)!;
  it('ma schody, wspinaczkę po kratce i sprężyny', () => {
    const kinds = new Set(stages.map((s) => s.kind));
    expect([...kinds].sort()).toEqual(['climb', 'spring', 'stairs']);
    expect(stages.length).toBeGreaterThan(15);
  });
  for (let i = 0; i < stages.length; i++) for (const br of ['M', 'D'] as Brother[]) {
    it(`etap ${i} (${stages[i].kind}) ${br === 'M' ? 'Marioosh' : 'Darioosh'}`, () => {
      const r = runStage(br, i); expect(r.ok, JSON.stringify({ ...stages[i], ...r })).toBe(true);
    });
  }
  for (const br of ['M', 'D'] as Brother[]) it(`szczyt z metą: ostatnia półka → podłoga szczytu (${br === 'M' ? 'Marioosh' : 'Darioosh'})`, () => {
    const last = stages[stages.length - 1]; const r = room();
    const top: TowerStage = { kind: 'stairs', x0: 1, w: r.w - 2, row: last.row - 3 };
    const out = runStage(br, stages.length, top); expect(out.ok, JSON.stringify({ last, ...out })).toBe(true);
  });
});
