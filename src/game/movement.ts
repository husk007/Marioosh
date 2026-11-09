/**
 * Czysty (bez DOM) kontroler ruchu braci — model v0.4 „platformówka w skali człowieka” (docs/design/08, 11):
 *  - po ziemi: chód i bieg z krótkim rozpędem, kucanie, automatyczny stopień ≤ 0,3 m, poślizg na lodzie/oleju, piasek, taśmociągi (bez sił od stoków);
 *  - skok o stałej wysokości zależnej od planety (h = v²/2g), coyote 0,08 s, bufor 0,10 s, krótszy skok po puszczeniu przycisku, słaba kontrola w powietrzu;
 *  - wysokość: schody (auto-stopień), przeskok przeszkody 0,3–1,0 m, chwyt krawędzi i podciąganie (do 1,7 m), drabiny, windy i platformy (świat);
 *  - upadki: < 1,2 m bez skutków, 1,2–2,4 m potknięcie, ≥ 2,4 m obrażenia; amortyzacja po lądowaniu;
 *  - woda: wolne pływanie w 8 kierunkach bez zrywu.
 * Brak: toczenia, szybowania, odbicia od ściany, uderzenia w ziemię, sprężyn, sił od stoków, formy „big”.
 * Grawitacja przekazywana w `env.g` (px/s², patrz PLANET_PHYSICS). Testy: tests/movement.test.ts.
 */
import {
  AUTO_STEP, BASE_GRAVITY, BROTHERS, CONVEYOR_SPEED, COYOTE, FALL_DAMAGE, FALL_STUMBLE, HERO_MAX_FALL, JUMP_BUFFER, LEDGE_REACH, PULLUP_TIME, STUMBLE_TIME, TILE,
  VAULT_MAX, VAULT_TIME, type Brother,
} from './constants';
import { hitsSolid, isSolidTile, moveBody, slopeAngle, tileAt, touchesTile, type Body, type Grid } from './physics';
import { T } from './types';

export interface MoveInput { left: boolean; right: boolean; up: boolean; down: boolean; jumpHeld: boolean; jumpPressed: boolean; run: boolean; downPressed?: boolean }
export type ClimbKind = '' | 'ladder';
export type LandKind = '' | 'soft' | 'stumble' | 'damage';
export interface LedgeAnim { kind: 'pull' | 'vault'; t: number; dur: number; x0: number; y0: number; x1: number; y1: number }
export interface MoveState {
  body: Body; brother: Brother; face: 1 | -1;
  coyote: number; jumpBuf: number; jumping: boolean; dropT: number;
  climbing: boolean; climbKind: ClimbKind; swimming: boolean; slow: number; jumpMul: number; speedMul: number;
  wasGround: boolean; landed: boolean; jumped: boolean;
  /** rodzaj lądowania w tej klatce (''|'soft'|'stumble'|'damage') i długość upadku (px) */
  landKind: LandKind; fallDist: number;
  /** wysokość stóp w najwyższym punkcie lotu / ostatnio stabilnego podłoża (px) */
  peakFeet: number; groundFeet: number;
  /** maks. prędkość pozioma w powietrzu (px/s) ustalana przy odbiciu */
  airMax: number;
  angle: number;            // kąt podłoża pod stopami (rad) — tylko do rysowania
  duck: boolean;
  hang: { side: 1 | -1; tx: number; ty: number; t: number } | null;
  ledge: LedgeAnim | null;
  lock: number; cushion: number; regrab: number;
}

export function bodyDims(brother: Brother, duck: boolean): { w: number; h: number } {
  const p = BROTHERS[brother];
  return { w: p.hitW, h: duck ? p.crouchH : p.hitH };
}

export function newMove(brother: Brother, x: number, y: number): MoveState {
  const { w, h } = bodyDims(brother, false);
  return {
    body: { x: x - w / 2, y: y - h, w, h, vx: 0, vy: 0, onGround: false, hitWall: 0, hitCeil: false, groundTile: 0, ridingId: -1 }, brother, face: 1,
    coyote: 0, jumpBuf: 0, jumping: false, dropT: 0, climbing: false, climbKind: '', swimming: false, slow: 1, jumpMul: 1, speedMul: 1,
    wasGround: false, landed: false, jumped: false, landKind: '', fallDist: 0, peakFeet: y, groundFeet: y, airMax: BROTHERS[brother].walk,
    angle: 0, duck: false, hang: null, ledge: null, lock: 0, cushion: 0, regrab: 0,
  };
}

function applyDims(m: MoveState): void {
  const { w, h } = bodyDims(m.brother, m.duck); const b = m.body;
  if (b.w === w && b.h === h) return;
  const cx = b.x + b.w / 2, bottom = b.y + b.h; b.w = w; b.h = h; b.x = cx - w / 2; b.y = bottom - h;
}

/** czy mamy miejsce, żeby wstać z kucania */
function canStand(m: MoveState, g: Grid): boolean {
  const full = bodyDims(m.brother, false); const b = m.body;
  return !hitsSolid(g, b.x + (b.w - full.w) / 2, b.y + b.h - full.h, full.w, full.h - 1);
}

const sgn = (v: number): number => (v > 0 ? 1 : v < 0 ? -1 : 0);
const clampN = (v: number, a: number, b: number): number => Math.max(a, Math.min(b, v));
const approach = (v: number, target: number, d: number): number => (v < target ? Math.min(target, v + d) : Math.max(target, v - d));

/** rodzaj podłoża → mnożniki (przyspieszenie, hamowanie, prędkość maks.) */
function surface(tile: number): { acc: number; fric: number; top: number } {
  if (tile === T.ICE) return { acc: 0.28, fric: 0.12, top: 1 };
  if (tile === T.OIL) return { acc: 0.12, fric: 0.05, top: 1 };
  if (tile === T.SAND) return { acc: 0.75, fric: 1.6, top: 0.75 };
  return { acc: 1, fric: 1, top: 1 };
}

function wallProbe(g: Grid, b: Body, side: 1 | -1): boolean {
  const x = side > 0 ? b.x + b.w : b.x - 2;
  return hitsSolid(g, x, b.y + 3, 2, Math.max(4, b.h - 12));
}

/** drabina w kolumnie ciała (lub tuż pod stopami przy zejściu ze szczytu) */
function ladderAt(g: Grid, b: Body, below: boolean): { ok: boolean; cx: number } {
  const cx = Math.floor((b.x + b.w / 2) / TILE) * TILE + TILE / 2;
  if (touchesTile(g, b.x + 4, b.y + 4, b.w - 8, b.h - 8, T.LADDER)) return { ok: true, cx };
  if (below) { const tx = Math.floor(cx / TILE); const ty = Math.floor((b.y + b.h + 3) / TILE); if (tileAt(g, tx, ty) === T.LADDER) return { ok: true, cx }; }
  return { ok: false, cx };
}

export interface MoveEnv { water?: boolean; currentX?: number; currentY?: number; g?: number }

/** Czy z miejsca przed ciałem da się przeskoczyć przeszkodę (0,3–1,0 m)? Zwraca cel (x1,y1) lub null. */
function findVault(g: Grid, m: MoveState, side: 1 | -1): { x1: number; y1: number } | null {
  const b = m.body; const feet = b.y + b.h;
  const cx = side > 0 ? Math.floor((b.x + b.w + 2) / TILE) : Math.floor((b.x - 2) / TILE);
  let ty = Math.floor((feet - 2) / TILE);
  if (!isSolidTile(tileAt(g, cx, ty))) return null;
  while (isSolidTile(tileAt(g, cx, ty - 1)) && feet - (ty - 1) * TILE <= 200) ty--;
  const top = ty * TILE, h = feet - top;
  if (h <= AUTO_STEP + 4 || h > VAULT_MAX) return null;
  const t0 = tileAt(g, cx, ty);
  if (t0 === T.CRUMBLE || t0 === T.GATE) return null;
  const sx = side > 0 ? cx * TILE + 2 : (cx + 1) * TILE - 2 - b.w;
  const full = bodyDims(m.brother, false);
  if (hitsSolid(g, sx, top - full.h, b.w, full.h - 1)) return null;
  return { x1: sx, y1: top - b.h };
}

export function stepMovement(m: MoveState, inp: MoveInput, g: Grid, dt: number, env: MoveEnv = {}): void {
  const p = BROTHERS[m.brother], b = m.body; const G = env.g ?? BASE_GRAVITY;
  m.landed = false; m.jumped = false; m.landKind = '';
  const dirRaw = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
  let dir = dirRaw;
  if (inp.jumpPressed) m.jumpBuf = JUMP_BUFFER; else m.jumpBuf = Math.max(0, m.jumpBuf - dt);
  m.dropT = Math.max(0, m.dropT - dt); m.lock = Math.max(0, m.lock - dt); m.regrab = Math.max(0, m.regrab - dt); m.cushion = Math.max(0, m.cushion - dt);
  const slow = m.slow * m.speedMul;
  if (m.lock > 0) dir = 0;
  if (dir && !m.hang && !m.ledge) m.face = dir as 1 | -1;

  // ---- podciąganie / przeskok (animacja)
  if (m.ledge) {
    const L = m.ledge; L.t += dt; const k = clampN(L.t / L.dur, 0, 1);
    // najpierw w górę, potem w bok
    const split = L.kind === 'vault' ? 0.55 : 0.7;
    const e = k < split ? { x: 0, y: k / split } : { x: (k - split) / (1 - split), y: 1 };
    b.x = L.x0 + (L.x1 - L.x0) * e.x; b.y = L.y0 + (L.y1 - L.y0) * e.y; b.vx = b.vy = 0;
    if (k >= 1) { b.x = L.x1; b.y = L.y1; m.ledge = null; b.onGround = true; m.wasGround = true; m.coyote = COYOTE; m.groundFeet = b.y + b.h; m.peakFeet = m.groundFeet; }
    return;
  }

  // ---- wisi na krawędzi
  if (m.hang) {
    const H = m.hang; H.t += dt; b.vx = b.vy = 0; m.face = H.side; m.peakFeet = b.y + b.h;
    if (!(tileAt(g, H.tx, H.ty) !== T.EMPTY)) { m.hang = null; }       // krawędź zniknęła (kruszy się itp.)
    else if (inp.down || (dirRaw === -H.side && !inp.up)) { m.hang = null; m.regrab = 0.3; }
    else if (inp.up || m.jumpBuf > 0 || (dirRaw === H.side && H.t > 0.12)) {
      const sx = H.side > 0 ? H.tx * TILE + 2 : (H.tx + 1) * TILE - 2 - b.w;
      m.ledge = { kind: 'pull', t: 0, dur: PULLUP_TIME, x0: b.x, y0: b.y, x1: sx, y1: H.ty * TILE - b.h };
      m.jumpBuf = 0; m.hang = null; return;
    } else return;
  }

  // ---- drabina
  const lad = ladderAt(g, b, inp.down && b.onGround);
  if (!m.climbing && m.regrab <= 0 && lad.ok && (inp.up || inp.down) && !m.swimming) {
    m.climbing = true; m.climbKind = 'ladder'; m.jumping = false; m.duck = false; applyDims(m); b.vx = 0; b.vy = 0; m.peakFeet = b.y + b.h;
  }
  if (m.climbing) {
    m.climbKind = 'ladder';
    if (!lad.ok) {
      // wyjście górą: stań na szczycie drabiny
      const tx = Math.floor(lad.cx / TILE), ty = Math.floor((b.y + b.h + 4) / TILE);
      if (b.vy <= 0 && tileAt(g, tx, ty) === T.LADDER && tileAt(g, tx, ty - 1) !== T.LADDER) { b.y = ty * TILE - b.h; b.onGround = true; m.wasGround = true; m.groundFeet = b.y + b.h; }
      m.climbing = false; m.climbKind = ''; b.vy = 0; b.vx = 0;
      return;
    }
    const vyDir = (inp.down ? 1 : 0) - (inp.up ? 1 : 0);
    b.x += clampN(lad.cx - (b.x + b.w / 2), -240 * dt, 240 * dt);
    b.vx = 0; b.vy = vyDir < 0 ? -p.ladder * slow : vyDir > 0 ? p.ladder * 1.15 : 0;
    if (m.jumpBuf > 0 && dirRaw !== 0) { m.climbing = false; m.climbKind = ''; b.vy = p.jump * 0.7 * m.jumpMul; b.vx = dirRaw * p.walk * 0.8; m.airMax = p.walk * 0.8; m.jumpBuf = 0; m.jumped = true; m.jumping = true; m.regrab = 0.25; m.peakFeet = b.y + b.h; }
    else if (dirRaw) m.face = dirRaw as 1 | -1;
    moveBody(g, b, dt, { dropThrough: true });
    m.wasGround = b.onGround; m.angle = 0;
    if (b.onGround && vyDir >= 0) { m.climbing = false; m.climbKind = ''; m.groundFeet = b.y + b.h; m.peakFeet = m.groundFeet; }
    return;
  }
  m.climbKind = '';

  // ---- pływanie (8 kierunków, wolne, bez zrywu)
  m.swimming = !!env.water;
  if (m.swimming) {
    m.duck = false; applyDims(m); m.peakFeet = b.y + b.h;
    let ix = dirRaw, iy = (inp.down ? 1 : 0) - (inp.up ? 1 : 0);
    const len = Math.hypot(ix, iy) || 1; ix /= len; iy /= len;
    const sp = p.swim * slow; const a = (ix || iy ? 260 : 160) * dt;
    b.vx = approach(b.vx, ix * sp, a); b.vy = approach(b.vy, iy ? iy * sp : p.sink, a * (iy ? 1 : 0.5));
    if (m.jumpBuf > 0) { m.jumpBuf = 0; m.jumped = true; if (!iy) b.vy = -sp * 0.8; }
    b.vx += (env.currentX ?? 0) * dt; b.vy += (env.currentY ?? 0) * dt;
    b.vx = clampN(b.vx, -160, 160); b.vy = clampN(b.vy, -160, 160);
    if (ix) m.face = ix > 0 ? 1 : -1;
    moveBody(g, b, dt); m.wasGround = b.onGround; m.angle = 0; return;
  }

  // ---- stoimy na ziemi (z poprzedniej klatki)?
  let grounded = b.onGround && b.vy > -1;
  if (grounded) { m.coyote = COYOTE; m.groundFeet = b.y + b.h; m.peakFeet = m.groundFeet; } else m.coyote = Math.max(0, m.coyote - dt);

  // kucanie
  if (grounded) {
    const want = inp.down && !inp.up;
    if (want && !m.duck) { m.duck = true; applyDims(m); }
    else if (!want && m.duck && canStand(m, g)) { m.duck = false; applyDims(m); }
  } else if (m.duck && canStand(m, g)) { m.duck = false; applyDims(m); }

  // ---- przeskok przeszkody 0,3–1,0 m
  if (grounded && !m.duck && dir !== 0 && (m.jumpBuf > 0 || inp.up) && wallProbe(g, b, dir as 1 | -1)) {
    const v = findVault(g, m, dir as 1 | -1);
    if (v) { m.ledge = { kind: 'vault', t: 0, dur: VAULT_TIME, x0: b.x, y0: b.y, x1: v.x1, y1: v.y1 }; m.jumpBuf = 0; b.vx = 0; m.face = dir as 1 | -1; return; }
  }

  // ---- skok
  if (m.jumpBuf > 0 && m.coyote > 0 && !(m.duck && !canStand(m, g))) {
    if (inp.down && b.groundTile === T.ONEWAY) { m.dropT = 0.25; b.vy = 0; m.jumpBuf = 0; m.coyote = 0; grounded = false; b.onGround = false; }
    else {
      b.vy = p.jump * m.jumpMul;
      m.airMax = Math.max(p.walk * slow, Math.abs(b.vx));
      m.coyote = 0; m.jumpBuf = 0; m.jumping = true; m.jumped = true; grounded = false; b.onGround = false;
      if (m.duck && canStand(m, g)) { m.duck = false; applyDims(m); }
    }
  }

  if (grounded) groundStep(m, inp, g, dt, dir, slow);
  else airStep(m, inp, g, dt, dir, dirRaw, slow, G, env);
  m.wasGround = b.onGround;
}

// ======================================================================= po ziemi
function groundStep(m: MoveState, inp: MoveInput, g: Grid, dt: number, dir: number, slow: number): void {
  const p = BROTHERS[m.brother], b = m.body;
  const sf = surface(b.groundTile);
  m.jumping = false; m.hang = null;
  const top = (m.duck ? p.crouch : inp.run ? p.run : p.walk) * slow * sf.top * (m.cushion > 0 ? 0.55 : 1);
  let vx = b.vx;
  if (dir) {
    if (vx !== 0 && sgn(vx) !== dir) vx += dir * Math.max(p.decel * sf.fric, 40) * dt;                  // hamowanie / zawracanie
    else if (Math.abs(vx) < top) { vx += dir * p.accel * sf.acc * dt; if (Math.abs(vx) > top) vx = dir * top; }
    else vx -= sgn(vx) * Math.min(Math.abs(vx) - top, p.decel * 0.8 * dt);                                // nadmiar prędkości powoli maleje
  } else vx -= sgn(vx) * Math.min(Math.abs(vx), p.decel * sf.fric * dt);
  vx = clampN(vx, -p.run * 1.2, p.run * 1.2);
  if (Math.abs(vx) < 1 && !dir) vx = 0;
  const conv = b.groundTile === T.CONVL ? -CONVEYOR_SPEED : b.groundTile === T.CONVR ? CONVEYOR_SPEED : 0;
  b.vx = vx + conv; b.vy = 0;
  moveBody(g, b, dt, { step: AUTO_STEP });
  if (b.hitWall) vx = 0;
  b.vx = vx;
  m.angle = b.onGround ? slopeAngle(b.groundTile) : m.angle;
  if (!b.onGround) { m.wasGround = false; m.peakFeet = b.y + b.h; }     // zszedł z krawędzi: zaczyna się lot
  if (b.hitCeil) b.vy = 0;
}

// ======================================================================= w powietrzu
function airStep(m: MoveState, inp: MoveInput, g: Grid, dt: number, dir: number, dirRaw: number, slow: number, G: number, env: MoveEnv): void {
  const p = BROTHERS[m.brother], b = m.body;
  m.peakFeet = Math.min(m.peakFeet, b.y + b.h);
  // --- chwyt krawędzi: szczyt krawędzi blisko wysokości głowy, w zasięgu rąk (≤ 1,7 m od podłoża, z którego odbito)
  const wL = wallProbe(g, b, -1), wR = wallProbe(g, b, 1);
  const wallSide: 0 | 1 | -1 = wR ? 1 : wL ? -1 : 0;
  if (!m.hang && m.regrab <= 0 && dirRaw !== 0 && wallSide === dirRaw && !inp.down) {
    const side = wallSide as 1 | -1;
    const cx = side > 0 ? Math.floor((b.x + b.w + 1.5) / TILE) : Math.floor((b.x - 1.5) / TILE);
    for (let ty = Math.floor((b.y - 12) / TILE); ty <= Math.floor((b.y + 8) / TILE); ty++) {
      const top = ty * TILE; const t0 = tileAt(g, cx, ty), tUp = tileAt(g, cx, ty - 1);
      if (!(isSolidTile(t0) && t0 !== T.CRUMBLE && t0 !== T.GATE && !isSolidTile(tUp) && b.y >= top - 12 && b.y <= top + 6)) continue;
      if (m.groundFeet - top > LEDGE_REACH) continue;
      if (b.y + b.h - m.groundFeet > 24) continue;      // krawędź łapie się tylko w okolicy wysokości odbicia (nie podczas spadania w przepaść)
      const sx = side > 0 ? cx * TILE + 2 : (cx + 1) * TILE - 2 - b.w;
      if (hitsSolid(g, sx, top - b.h, b.w, b.h - 1)) continue;
      m.hang = { side, tx: cx, ty, t: 0 }; b.x = side > 0 ? cx * TILE - b.w : (cx + 1) * TILE; b.y = top + 6; b.vx = b.vy = 0; m.face = side; m.jumping = false; return;
    }
  }
  // --- ruch poziomy: słaba kontrola, pęd zachowany
  if (dir !== 0 && m.lock <= 0) { const tgt = dir * Math.max(m.airMax, p.walk * slow * 0.6); b.vx = approach(b.vx, tgt, p.airCtl * dt); }
  // --- pion
  let gr = G;
  if (m.jumping && b.vy < 0 && !inp.jumpHeld) gr *= p.jumpCut;                 // puszczony skok: krótszy
  b.vy += gr * dt;
  if (b.vy > HERO_MAX_FALL) b.vy = HERO_MAX_FALL;
  if (env.currentX || env.currentY) { b.vx += (env.currentX ?? 0) * dt * 0.45; b.vy += (env.currentY ?? 0) * dt * 0.45; }
  // korekta narożnika głowy (maks. 8 px)
  if (b.vy < 0) {
    const ny = b.y + b.vy * dt;
    if (hitsSolid(g, b.x, ny, b.w, 2)) {
      for (let k = 1; k <= 8; k++) { let done = false; for (const s of [1, -1]) { if (!hitsSolid(g, b.x + s * k, ny, b.w, 2) && !hitsSolid(g, b.x + s * k, b.y, b.w, b.h - 4)) { b.x += s * k; done = true; break; } } if (done) break; }
    }
  }
  const n = Math.max(1, Math.ceil((Math.max(Math.abs(b.vx), Math.abs(b.vy)) * dt) / 6)); const sdt = dt / n;
  for (let i = 0; i < n; i++) {
    const vy0 = b.vy;
    moveBody(g, b, sdt, { dropThrough: m.dropT > 0 || (inp.down && inp.jumpHeld) });
    if (b.onGround) {
      m.angle = slopeAngle(b.groundTile); m.jumping = false;
      const feet = b.y + b.h; m.fallDist = feet - m.peakFeet; m.groundFeet = feet; m.peakFeet = feet;
      m.landed = vy0 > 60;
      if (m.landed) {
        if (m.fallDist >= FALL_DAMAGE) { m.landKind = 'damage'; m.lock = STUMBLE_TIME; b.vx = 0; }
        else if (m.fallDist >= FALL_STUMBLE) { m.landKind = 'stumble'; m.lock = STUMBLE_TIME; b.vx = 0; }
        else { m.landKind = 'soft'; if (m.fallDist >= 16) m.cushion = p.cushion; b.vx *= 0.7; }
      }
      break;
    }
    if (b.hitCeil) b.vy = 0;
  }
}
