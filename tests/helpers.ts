import { newMove, stepMovement, type MoveEnv, type MoveInput, type MoveState } from '../src/game/movement';
import type { Grid } from '../src/game/physics';
import { T, type Room } from '../src/game/types';
import { BASE_GRAVITY, type Brother } from '../src/game/constants';

export const DT = 1 / 60;
export const noInput = (): MoveInput => ({ left: false, right: false, up: false, down: false, jumpHeld: false, jumpPressed: false, run: false });

export function flatGrid(w: number, h: number, groundRow: number, gaps: [number, number][] = [], extra: (g: Grid) => void = () => {}): Grid {
  const g: Grid = { w, h, tiles: new Uint8Array(w * h) };
  for (let x = 0; x < w; x++) { if (gaps.some(([a, b]) => x >= a && x < b)) continue; for (let y = groundRow; y < h; y++) g.tiles[y * w + x] = T.SOLID; }
  extra(g); return g;
}
export function roomGrid(r: Room): Grid { return { w: r.w, h: r.h, tiles: r.tiles.slice(), }; }

/** biegnie/idzie w prawo i skacze na krawędzi przepaści; zwraca true, jeśli ląduje po drugiej stronie */
export function jumpsGap(brother: Brother, gap: number, run: boolean, g0 = BASE_GRAVITY): { ok: boolean; maxReach: number } {
  const g = flatGrid(60, 16, 12, [[20, 20 + gap]]);
  const m = newMove(brother, 5 * 32, 12 * 32);
  const env: MoveEnv = { g: g0 };
  let jumped = false, landedAfter = false;
  for (let i = 0; i < 60 * 10; i++) {
    const inp = noInput(); inp.right = true; inp.run = run;
    const edge = (20 * 32) - (m.body.x + m.body.w);
    if (!jumped && edge <= 3 && m.body.onGround) { inp.jumpPressed = true; inp.jumpHeld = true; jumped = true; }
    else if (jumped && m.body.vy < 0) inp.jumpHeld = true;
    stepMovement(m, inp, g, DT, env);
    if (jumped && m.body.onGround && m.body.x > (20 + gap) * 32) landedAfter = true;
    if (m.body.y > 16 * 32) break;
  }
  return { ok: landedAfter, maxReach: m.body.x };
}

/** idzie do ściany o wysokości `rows` kafli i próbuje na nią wejść (przeskok / chwyt krawędzi + podciągnięcie) */
export function climbsWall(brother: Brother, rows: number, g0 = BASE_GRAVITY): boolean {
  const g = flatGrid(40, 16, 12, [], (gr) => { for (let x = 20; x < 40; x++) for (let y = 12 - rows; y < 12; y++) gr.tiles[y * gr.w + x] = T.SOLID; });
  const m = newMove(brother, 10 * 32, 12 * 32);
  const env: MoveEnv = { g: g0 };
  for (let i = 0; i < 60 * 8; i++) {
    const inp = noInput(); inp.right = true;
    const dist = 20 * 32 - (m.body.x + m.body.w);
    if (dist <= 14) { inp.jumpHeld = true; inp.jumpPressed = i % 20 === 0; }
    stepMovement(m, inp, g, DT, env);
    if (m.body.x > 21 * 32 && m.body.onGround && Math.abs(m.body.y + m.body.h - (12 - rows) * 32) < 1) return true;
  }
  return false;
}
export type { MoveState };
