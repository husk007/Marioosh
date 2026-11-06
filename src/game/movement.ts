/**
 * Czysty (bez DOM) kontroler ruchu braci — zgodny z tabelą z GDD (sekcja B).
 * Testy jednostkowe (tests/movement.test.ts) sprawdzają skoki na 2 i 4 kafelki dla obu postaci (kryterium M1).
 */
import { BROTHERS, COYOTE, GRAVITY, JUMP_BUFFER, MAX_FALL, RISE_RELEASE_GRAVITY_MULT, TILE, type Brother } from './constants';
import { moveBody, touchesTile, type Body, type Grid } from './physics';
import { T } from './types';

export interface MoveInput { left: boolean; right: boolean; up: boolean; down: boolean; jumpHeld: boolean; jumpPressed: boolean; run: boolean; }
export interface MoveState {
  body: Body; brother: Brother; face: 1 | -1;
  coyote: number; jumpBuf: number; jumping: boolean; dropT: number;
  climbing: boolean; swimming: boolean; slow: number; jumpMul: number; wasGround: boolean; landed: boolean; jumped: boolean; speedMul: number;
}

export function newMove(brother: Brother, x: number, y: number, big = false): MoveState {
  const p = BROTHERS[brother];
  const w = big ? p.bigW : p.hitW, h = big ? p.bigH : p.hitH;
  return { body: { x: x - w / 2, y: y - h, w, h, vx: 0, vy: 0, onGround: false, hitWall: 0, hitCeil: false, groundTile: 0, ridingId: -1 }, brother, face: 1, coyote: 0, jumpBuf: 0, jumping: false, dropT: 0, climbing: false, swimming: false, slow: 1, jumpMul: 1, wasGround: false, landed: false, jumped: false, speedMul: 1 };
}

export function setBig(m: MoveState, big: boolean): void {
  const p = BROTHERS[m.brother]; const w = big ? p.bigW : p.hitW, h = big ? p.bigH : p.hitH;
  const b = m.body; if (b.w === w && b.h === h) return;
  const cx = b.x + b.w / 2, bottom = b.y + b.h; b.w = w; b.h = h; b.x = cx - w / 2; b.y = bottom - h;
}

export function stepMovement(m: MoveState, inp: MoveInput, g: Grid, dt: number, env: { water?: boolean; currentX?: number; currentY?: number } = {}): void {
  const p = BROTHERS[m.brother], b = m.body;
  m.landed = false; m.jumped = false;
  const dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
  if (dir) m.face = dir as 1 | -1;
  if (inp.jumpPressed) m.jumpBuf = JUMP_BUFFER; else m.jumpBuf = Math.max(0, m.jumpBuf - dt);
  if (m.dropT > 0) m.dropT -= dt;
  const slow = m.slow * m.speedMul;
  // ---- drabina / winorośl
  const onLadder = touchesTile(g, b.x + 4, b.y + 4, b.w - 8, b.h - 8, T.LADDER);
  if (!m.climbing && onLadder && (inp.up || (inp.down && !b.onGround))) m.climbing = true;
  if (m.climbing && !onLadder) m.climbing = false;
  m.swimming = !!env.water && !m.climbing;
  if (m.climbing) {
    b.vx = dir * 70 * slow; b.vy = ((inp.down ? 1 : 0) - (inp.up ? 1 : 0)) * 90;
    if (m.jumpBuf > 0) { m.climbing = false; b.vy = p.jump * 0.8; m.jumpBuf = 0; m.jumped = true; b.vx = dir * p.walk; }
    moveBody(g, b, dt); m.wasGround = b.onGround; return;
  }
  if (m.swimming) {
    const maxX = p.walk * 0.75 * slow;
    const tgt = dir * maxX; b.vx += Math.sign(tgt - b.vx) * Math.min(Math.abs(tgt - b.vx), 900 * dt);
    b.vy += 340 * dt; if (b.vy > 120) b.vy = 120;
    if (inp.up) b.vy -= 520 * dt; if (inp.down) b.vy += 420 * dt;
    if (m.jumpBuf > 0) { b.vy = -190; m.jumpBuf = 0; m.jumped = true; }
    if (b.vy < -230) b.vy = -230;
    b.vx += (env.currentX ?? 0) * dt; b.vy += (env.currentY ?? 0) * dt;
    moveBody(g, b, dt); m.wasGround = b.onGround; return;
  }
  // ---- poziomo
  const maxV = (inp.run ? p.run : p.walk) * slow;
  const target = dir * maxV;
  const ground = b.onGround;
  if (dir !== 0) {
    const turning = Math.sign(b.vx) !== 0 && Math.sign(b.vx) !== dir;
    const a = ground ? (turning ? p.decel : p.accel) : p.airAccel;
    if (Math.abs(b.vx) > maxV && Math.sign(b.vx) === dir) { b.vx -= Math.sign(b.vx) * (ground ? p.decel : 120) * dt * 0.5; if (Math.abs(b.vx) < maxV) b.vx = target; }
    else b.vx += Math.sign(target - b.vx) * Math.min(Math.abs(target - b.vx), a * dt);
  } else if (ground) {
    const d = p.decel * dt; b.vx = Math.abs(b.vx) <= d ? 0 : b.vx - Math.sign(b.vx) * d;
  } else {
    const d = 160 * dt; b.vx = Math.abs(b.vx) <= d ? 0 : b.vx - Math.sign(b.vx) * d;
  }
  if (ground && (b.groundTile === T.CONVL || b.groundTile === T.CONVR)) b.vx += (b.groundTile === T.CONVL ? -1 : 1) * 70 * dt * 6;
  // ---- skok
  if (ground) m.coyote = COYOTE; else m.coyote = Math.max(0, m.coyote - dt);
  if (m.jumpBuf > 0 && m.coyote > 0) {
    b.vy = p.jump * m.jumpMul; m.coyote = 0; m.jumpBuf = 0; m.jumping = true; m.jumped = true;
    if (inp.down && b.groundTile === T.ONEWAY) { m.dropT = 0.25; b.vy = 0; m.jumped = false; m.jumping = false; }
  }
  // ---- grawitacja
  let gMul = 1; if (b.vy < 0 && !inp.jumpHeld) gMul = RISE_RELEASE_GRAVITY_MULT;
  b.vy += GRAVITY * gMul * dt; if (b.vy > MAX_FALL) b.vy = MAX_FALL;
  const wasAir = !m.wasGround;
  moveBody(g, b, dt, { dropThrough: m.dropT > 0 || (inp.down && inp.jumpHeld) });
  if (b.onGround) { m.jumping = false; if (wasAir && b.vy === 0) m.landed = true; }
  m.wasGround = b.onGround;
  void TILE;
}
