import { describe, expect, it } from 'vitest';
import { newMove, stepMovement } from '../src/game/movement';
import type { Grid } from '../src/game/physics';
import { moveBody, newBody } from '../src/game/physics';
import { T } from '../src/game/types';
import { DT, noInput } from './helpers';

const grid = (w = 60, h = 20): Grid => ({ w, h, tiles: new Uint8Array(w * h) });
const fillBelow = (g: Grid, x: number, row: number) => { for (let y = row; y < g.h; y++) g.tiles[y * g.w + x] = T.SOLID; };
/** płaska ziemia od wiersza `base`, a od x0 rampa 45° w górę (n kafli) lub w dół */
function ramp(g: Grid, base: number, x0: number, n: number, up: boolean, kind: 'x1' | 'x2' = 'x1') {
  for (let x = 0; x < g.w; x++) fillBelow(g, x, base);
  if (kind === 'x1') {
    for (let i = 0; i < n; i++) {
      const x = x0 + i, row = up ? base - 1 - i : base + i;     // górna powierzchnia stoku
      if (up) { g.tiles[row * g.w + x] = T.SL_R45; fillBelow(g, x, row + 1); }
      else { for (let y = base; y < row; y++) g.tiles[y * g.w + x] = T.EMPTY; g.tiles[row * g.w + x] = T.SL_L45; fillBelow(g, x, row + 1); }
    }
    // płaskowyż za rampą
    for (let x = x0 + n; x < g.w; x++) { for (let y = 0; y < g.h; y++) g.tiles[y * g.w + x] = T.EMPTY; fillBelow(g, x, up ? base - n : base + n); }
  }
}

describe('stoki i rozpęd (Sonic)', () => {
  it('biegnie pod górę stoku 45° na płaskowyż', () => {
    const g = grid(); ramp(g, 14, 12, 4, true);
    const m = newMove('M', 6 * 32, 14 * 32);
    for (let i = 0; i < 60 * 4; i++) { const inp = noInput(); inp.right = true; inp.run = true; stepMovement(m, inp, g, DT); }
    expect(m.body.onGround).toBe(true);
    expect(Math.abs(m.body.y + m.body.h - 10 * 32)).toBeLessThan(0.5);      // stoi na płaskowyżu 4 kafle wyżej
    expect(m.body.x).toBeGreaterThan(17 * 32);
  });
  it('zjazd ze stoku nie odrywa od podłoża i daje rozpęd ponad prędkość biegu', () => {
    const g = grid(); ramp(g, 8, 12, 4, false);
    const m = newMove('M', 6 * 32, 8 * 32);
    let air = 0, vmax = 0;
    for (let i = 0; i < 60 * 3; i++) { const inp = noInput(); inp.right = true; inp.run = true; stepMovement(m, inp, g, DT); if (!m.body.onGround && m.body.x > 12 * 32 && m.body.x < 16 * 32) air++; vmax = Math.max(vmax, m.body.vx); }
    expect(air).toBe(0);
    expect(vmax).toBeGreaterThan(430);       // > run (420)
  });
  it('wyjazd ze szczytu rampy w górę wystrzeliwuje w powietrze (skocznia)', () => {
    const g = grid(); ramp(g, 14, 12, 3, true);
    for (let x = 15; x < g.w; x++) { for (let y = 0; y < g.h; y++) g.tiles[y * g.w + x] = T.EMPTY; }   // koniec rampy = przepaść
    const m = newMove('D', 5 * 32, 14 * 32); let launched = false;
    for (let i = 0; i < 60 * 3; i++) { const inp = noInput(); inp.right = true; inp.run = true; stepMovement(m, inp, g, DT); if (!m.body.onGround && m.body.vy < -50 && m.body.x > 14 * 32) launched = true; }
    expect(launched).toBe(true);
  });
  it('stok 26° (dwa kafle) jest przejezdny', () => {
    const g = grid(); for (let x = 0; x < g.w; x++) fillBelow(g, x, 14);
    g.tiles[13 * g.w + 12] = T.SL_R26A; g.tiles[13 * g.w + 13] = T.SL_R26B; fillBelow(g, 12, 14); fillBelow(g, 13, 14);
    for (let x = 14; x < g.w; x++) { fillBelow(g, x, 13); }
    const m = newMove('D', 5 * 32, 14 * 32);
    for (let i = 0; i < 60 * 3; i++) { const inp = noInput(); inp.right = true; stepMovement(m, inp, g, DT); }
    expect(Math.abs(m.body.y + m.body.h - 13 * 32)).toBeLessThan(0.5);
  });
  it('lód: dłuższa droga hamowania niż na zwykłym podłożu', () => {
    const stop = (tile: number) => {
      const g = grid(); for (let x = 0; x < g.w; x++) { for (let y = 14; y < g.h; y++) g.tiles[y * g.w + x] = x > 8 ? tile : T.SOLID; }
      const m = newMove('M', 3 * 32, 14 * 32); let x0 = 0;
      for (let i = 0; i < 120; i++) { const inp = noInput(); if (i < 40) { inp.right = true; inp.run = true; } stepMovement(m, inp, g, DT); if (i === 39) x0 = m.body.x; }
      return m.body.x - x0;
    };
    expect(stop(T.ICE)).toBeGreaterThan(stop(T.SOLID) * 2);
  });
  it('wróg (moveBody) idzie po stoku i nie wpada w kafle', () => {
    const g = grid(); ramp(g, 14, 12, 4, true);
    const b = newBody(6 * 32, 14 * 32 - 24, 22, 24);
    for (let i = 0; i < 200; i++) { b.vx = 90; b.vy += 1150 * DT; moveBody(g, b, DT); }
    expect(b.onGround).toBe(true);
    expect(Math.abs(b.y + b.h - 10 * 32)).toBeLessThan(0.5);
  });
});
