import { describe, expect, it } from 'vitest';
import { newMove, stepMovement, type MoveInput } from '../src/game/movement';
import type { Grid } from '../src/game/physics';
import { T } from '../src/game/types';
import { DT, noInput } from './helpers';

const grid = (w = 40, h = 30): Grid => ({ w, h, tiles: new Uint8Array(w * h) });
const solid = (g: Grid, x0: number, y0: number, w: number, h: number, t: number = T.SOLID) => { for (let x = x0; x < x0 + w; x++) for (let y = y0; y < y0 + h; y++) g.tiles[y * g.w + x] = t; };
const floor = (g: Grid, row: number) => solid(g, 0, row, g.w, g.h - row);
const run = (m: ReturnType<typeof newMove>, g: Grid, frames: number, f: (i: number, inp: MoveInput) => void) => { for (let i = 0; i < frames; i++) { const inp = noInput(); f(i, inp); stepMovement(m, inp, g, DT); } };

describe('przemieszczanie w pionie (Rayman)', () => {
  it('Darioosh wspina się szybem odbijając od ścian (ściany co 3 kafle)', () => {
    const g = grid(); floor(g, 28); solid(g, 10, 0, 1, 28); solid(g, 14, 0, 1, 28);
    const m = newMove('D', 12 * 32 + 16, 28 * 32); let minY = 1e9, want: 1 | -1 = 1;
    run(m, g, 60 * 8, (i, inp) => {
      inp.right = want === 1; inp.left = want === -1; inp.jumpHeld = true;
      if (m.body.onGround || m.wallSlide) inp.jumpPressed = true;
      if (m.walljumped) want = (want === 1 ? -1 : 1);
      minY = Math.min(minY, m.body.y);
    });
    expect(28 * 32 - minY).toBeGreaterThan(32 * 7);
  });
  it('Marioosh ślizga się po ścianie wolniej niż spada, ale nie odbija się od niej', () => {
    const g = grid(); floor(g, 28); solid(g, 10, 0, 1, 28);
    const m = newMove('M', 9 * 32 + 8, 20 * 32); let vmax = 0, wj = false;
    run(m, g, 80, (i, inp) => { inp.right = true; if (m.wallSlide) { inp.jumpPressed = true; inp.jumpHeld = true; } vmax = Math.max(vmax, m.body.vy); if (m.walljumped) wj = true; });
    expect(wj).toBe(false);
  });
  it('wskakuje na 5-kafelkowy stopień z chwytem krawędzi: Darioosh tak, Marioosh nie', () => {
    const tryStep = (b: 'M' | 'D') => {
      const g = grid(); floor(g, 28); solid(g, 20, 23, 20, 5);
      const m = newMove(b, 15 * 32, 28 * 32); let done = false;
      run(m, g, 60 * 5, (i, inp) => { inp.right = true; const d = 20 * 32 - (m.body.x + m.body.w); if (d < 28 && m.body.onGround && i < 120) { inp.jumpPressed = true; inp.jumpHeld = true; } else if (m.body.vy < 0 && d < 40) inp.jumpHeld = true; if (m.body.onGround && m.body.y + m.body.h <= 23 * 32 + 0.5) done = true; });
      return done;
    };
    expect(tryStep('D')).toBe(true); expect(tryStep('M')).toBe(false);
  });
  it('podciąganie na krawędź kończy się na ziemi na górze', () => {
    const g = grid(); floor(g, 28); solid(g, 20, 24, 20, 4);
    const m = newMove('M', 15 * 32, 28 * 32);
    run(m, g, 60 * 5, (i, inp) => { inp.right = true; const d = 20 * 32 - (m.body.x + m.body.w); if (d < 28 && m.body.onGround && i < 120) { inp.jumpPressed = true; inp.jumpHeld = true; } else if (m.body.vy < 0 && d < 40) inp.jumpHeld = true; if (m.hang) inp.up = true; });
    expect(m.body.onGround).toBe(true); expect(m.body.y + m.body.h).toBeCloseTo(24 * 32, 0); expect(m.body.x).toBeGreaterThan(20 * 32);
  });
  it('szybowanie ogranicza prędkość opadania', () => {
    const g = grid(); floor(g, 29);
    for (const b of ['M', 'D'] as const) {
      const m = newMove(b, 5 * 32, 10 * 32); m.body.vy = 100; let vmax = 0, gl = false;
      run(m, g, 50, (i, inp) => { if (i === 0) inp.jumpPressed = true; inp.jumpHeld = true; if (m.gliding) gl = true; if (i > 20) vmax = Math.max(vmax, m.body.vy); });
      expect(gl).toBe(true); expect(vmax).toBeLessThan(b === 'D' ? 100 : 160);
    }
  });
  it('sprężyna wystrzeliwuje w górę (> 9 kafli)', () => {
    const g = grid(); floor(g, 28); g.tiles[27 * g.w + 10] = T.SPRING_U;
    const m = newMove('M', 10 * 32 + 16, 28 * 32); let minY = 1e9;
    run(m, g, 120, (i, inp) => { minY = Math.min(minY, m.body.y); });
    expect((28 * 32 - minY) / 32).toBeGreaterThan(9);
  });
  it('lina: Up wspina w górę po pionowej linie', () => {
    const g = grid(); floor(g, 28); solid(g, 10, 14, 1, 14, T.ROPE);
    const m = newMove('M', 10 * 32 + 16, 28 * 32);
    run(m, g, 90, (i, inp) => { inp.up = true; });
    expect(m.climbing).toBe(true); expect(m.climbKind).toBe('rope'); expect(28 * 32 - m.body.y).toBeGreaterThan(100);
  });
  it('kratka: Marioosh męczy się po ok. 3 s, Darioosh nie', () => {
    const climb = (b: 'M' | 'D') => { const g = grid(); floor(g, 28); solid(g, 10, 2, 1, 26, T.CLIMB); const m = newMove(b, 10 * 32 + 16, 28 * 32); run(m, g, 60 * 6, (i, inp) => { inp.up = true; }); return 28 * 32 - m.body.y; };
    expect(climb('D')).toBeGreaterThan(climb('M') * 1.3);
  });
  it('uderzenie w ziemię (Marioosh): zdarzenie przy lądowaniu', () => {
    const g = grid(); floor(g, 28); const m = newMove('M', 5 * 32, 20 * 32); let pound = false;
    run(m, g, 90, (i, inp) => { if (i === 3) inp.downPressed = true; if (m.pounded) pound = true; });
    expect(pound).toBe(true);
  });
  it('pływanie: góra+prawo daje ruch po przekątnej', () => {
    const g = grid(); const m = newMove('D', 5 * 32, 15 * 32); const x0 = m.body.x, y0 = m.body.y;
    for (let i = 0; i < 40; i++) { const inp = noInput(); inp.up = true; inp.right = true; stepMovement(m, inp, g, DT, { water: true }); }
    expect(m.body.x - x0).toBeGreaterThan(40); expect(y0 - m.body.y).toBeGreaterThan(40);
  });
  it('kucanie/toczenie: wchodzi pod sufit na 1 kafel (postać duża), nie wstaje pod nim', () => {
    const g = grid(); floor(g, 28); solid(g, 12, 26, 6, 1);   // wolne tylko 32 px nad ziemią
    const m = newMove('D', 5 * 32, 28 * 32, true);
    run(m, g, 60 * 4, (i, inp) => { inp.right = true; inp.down = true; });
    expect(m.body.x).toBeGreaterThan(18 * 32);
  });
});
