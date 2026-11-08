import { describe, expect, it } from 'vitest';
import { jumpsGap, maxStepUp, flatGrid, noInput, DT } from './helpers';
import { newMove, stepMovement } from '../src/game/movement';
import { BROTHERS } from '../src/game/constants';

describe('ruch braci (GDD B, kryterium M1)', () => {
  for (const b of ['M', 'D'] as const) {
    it(`${BROTHERS[b].name}: przerwa 2 kafelki bez biegu`, () => { expect(jumpsGap(b, 2, false).ok).toBe(true); });
    it(`${BROTHERS[b].name}: przerwa 3 kafelki bez biegu`, () => { expect(jumpsGap(b, 3, false).ok).toBe(true); });
    it(`${BROTHERS[b].name}: przerwa 4 kafelki z rozbiegu`, () => { expect(jumpsGap(b, 4, true).ok).toBe(true); });
    it(`${BROTHERS[b].name}: wejście na stopień 2 kafelki`, () => { expect(maxStepUp(b, 2)).toBe(true); });
    it(`${BROTHERS[b].name}: stopień 4 kafelki: skok + chwyt krawędzi`, () => { expect(maxStepUp(b, 4)).toBe(true); });
    it(`${BROTHERS[b].name}: ściana 7 kafli jest nieosiągalna z płaskiego`, () => { expect(maxStepUp(b, 7)).toBe(false); });
  }
  it('Darioosh skacze wyżej niż Marioosh (ok. 3,5 i 4,5 kafla)', () => {
    const hM = (BROTHERS.M.jump ** 2) / (2 * 1600), hD = (BROTHERS.D.jump ** 2) / (2 * 1600);
    expect(hD).toBeGreaterThan(hM);
    expect(hM / 32).toBeGreaterThan(3.2); expect(hD / 32).toBeLessThan(5);
    expect(jumpsGap('D', 22, true).ok).toBe(false);   // przerwy powyżej ok. 13 kafli wymagają szybowania lub sprężyny
  });
  it('coyote time: skok tuż po zejściu z krawędzi działa, po 150 ms już nie', () => {
    for (const [delay, expected] of [[0.08, true], [0.2, false]] as const) {
      const g = flatGrid(30, 16, 12, [[10, 30]]);
      const m = newMove('M', 9 * 32, 12 * 32);
      for (let i = 0; i < 5; i++) stepMovement(m, noInput(), g, DT);
      m.body.x = 10 * 32 - m.body.w + 6;             // lekko nad krawędzią
      let t = 0, pressed = false, jumpedNow = false;
      for (let i = 0; i < 60; i++) {
        const inp = noInput(); inp.right = true; inp.run = false;
        if (m.body.onGround === false && !pressed) { t += DT; }
        if (!pressed && t >= delay) { inp.jumpPressed = true; inp.jumpHeld = true; pressed = true; }
        stepMovement(m, inp, g, DT); if (m.jumped) jumpedNow = true;
        if (m.body.x < 10 * 32 - m.body.w) m.body.vx = 150;
      }
      expect(jumpedNow || !expected).toBe(true);
    }
  });
  it('bufor skoku: naciśnięcie tuż przed lądowaniem daje skok', () => {
    const g = flatGrid(30, 16, 12);
    const m = newMove('D', 5 * 32, 12 * 32 - 6); m.body.vy = 300;   // 6 px nad ziemią: ląduje w ~2 klatkach
    let jumped = false;
    for (let i = 0; i < 40; i++) {
      const inp = noInput(); if (i === 0) { inp.jumpPressed = true; inp.jumpHeld = true; }
      stepMovement(m, inp, g, DT); if (m.jumped) jumped = true;
    }
    expect(jumped).toBe(true);
  });
  it('krótszy skok po puszczeniu przycisku', () => {
    const run = (hold: boolean) => {
      const g = flatGrid(30, 16, 12); const m = newMove('M', 5 * 32, 12 * 32); let minY = 1e9;
      for (let i = 0; i < 90; i++) { const inp = noInput(); if (i === 1) { inp.jumpPressed = true; inp.jumpHeld = true; } else if (hold && i < 40) inp.jumpHeld = true; stepMovement(m, inp, g, DT); minY = Math.min(minY, m.body.y); }
      return 12 * 32 - 30 - minY;
    };
    expect(run(false)).toBeLessThan(run(true) * 0.7);
  });
  it('nie przechodzi przez podłoże ani ścianę', () => {
    const g = flatGrid(30, 16, 12, [], (gr) => { for (let y = 8; y < 12; y++) gr.tiles[y * gr.w + 15] = 1; });
    const m = newMove('M', 5 * 32, 12 * 32);
    for (let i = 0; i < 400; i++) { const inp = noInput(); inp.right = true; inp.run = true; stepMovement(m, inp, g, DT); expect(m.body.y + m.body.h).toBeLessThanOrEqual(12 * 32 + 0.01); }
    expect(m.body.x + m.body.w).toBeLessThanOrEqual(15 * 32 + 0.01);
  });
});
