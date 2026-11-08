/**
 * Czysty (bez DOM) kontroler ruchu braci — model „Sonic + Rayman”:
 *  - po ziemi: prędkość wzdłuż podłoża (ground speed), stoki 45° i ~26°, rozpęd z górki, toczenie, poślizg na lodzie/oleju, taśmociągi;
 *  - w powietrzu: skok o zmiennej wysokości, coyote time, bufor skoku, korekta narożników, szybowanie, ślizg po ścianie, odbicie od ściany (Darioosh),
 *    chwyt krawędzi i podciąganie, uderzenie w ziemię (Marioosh), sprężyny;
 *  - wspinaczka: drabiny, liny/łańcuchy (tylko pion), kratki na ścianach (kierunki, z wytrzymałością Marioosha);
 *  - woda: pływanie w 8 kierunkach.
 * Stałe w constants.ts (BROTHERS). Testy: tests/movement.test.ts, tests/slopes.test.ts, tests/traversal.test.ts.
 */
import { BROTHERS, COYOTE, HERO_GRAVITY, HERO_MAX_FALL, JUMP_BUFFER, JUMP_CUT, MAX_SPEED, SLOPE_ACC, SPRING_H, SPRING_V, TILE, WALL_JUMP_LOCK, type Brother } from './constants';
import { hitsSolid, isSolidTile, moveBody, slopeAngle, tileAt, touchesTile, type Body, type Grid } from './physics';
import { T } from './types';

export interface MoveInput { left: boolean; right: boolean; up: boolean; down: boolean; jumpHeld: boolean; jumpPressed: boolean; run: boolean; downPressed?: boolean }
export type ClimbKind = '' | 'ladder' | 'rope' | 'grate';
export interface MoveState {
  body: Body; brother: Brother; face: 1 | -1; big: boolean;
  coyote: number; jumpBuf: number; jumping: boolean; dropT: number;
  climbing: boolean; climbKind: ClimbKind; swimming: boolean; slow: number; jumpMul: number; wasGround: boolean; landed: boolean; jumped: boolean; speedMul: number;
  // nowe stany
  angle: number;            // kąt podłoża pod stopami (rad, + = wznosi się w prawo)
  duck: boolean; rolling: boolean;
  gliding: boolean; wallSlide: 0 | 1 | -1; wallT: number; wallDir: 0 | 1 | -1;
  hang: { side: 1 | -1; tx: number; ty: number; t: number } | null;
  ledge: { t: number; x0: number; y0: number; x1: number; y1: number } | null;
  stamina: number; regrab: number;
  pounding: boolean; pounded: boolean; sprung: boolean; walljumped: boolean; springCd: number;
  lock: number; wjLock: number; wjDir: 1 | -1; launched: boolean; dash: number;
}

export function bodyDims(brother: Brother, big: boolean, duck: boolean): { w: number; h: number } {
  const p = BROTHERS[brother]; const w = big ? p.bigW : p.hitW, h = big ? p.bigH : p.hitH;
  return { w, h: duck ? Math.round(h * 0.62) : h };
}

export function newMove(brother: Brother, x: number, y: number, big = false): MoveState {
  const { w, h } = bodyDims(brother, big, false);
  return {
    body: { x: x - w / 2, y: y - h, w, h, vx: 0, vy: 0, onGround: false, hitWall: 0, hitCeil: false, groundTile: 0, ridingId: -1 }, brother, face: 1, big,
    coyote: 0, jumpBuf: 0, jumping: false, dropT: 0, climbing: false, climbKind: '', swimming: false, slow: 1, jumpMul: 1, wasGround: false, landed: false, jumped: false, speedMul: 1,
    angle: 0, duck: false, rolling: false, gliding: false, wallSlide: 0, wallT: 0, wallDir: 0, hang: null, ledge: null, stamina: 1, regrab: 0,
    pounding: false, pounded: false, sprung: false, walljumped: false, springCd: 0, lock: 0, wjLock: 0, wjDir: 1, launched: false, dash: 0,
  };
}

function applyDims(m: MoveState): void {
  const { w, h } = bodyDims(m.brother, m.big, m.duck); const b = m.body;
  if (b.w === w && b.h === h) return;
  const cx = b.x + b.w / 2, bottom = b.y + b.h; b.w = w; b.h = h; b.x = cx - w / 2; b.y = bottom - h;
}
export function setBig(m: MoveState, big: boolean): void { m.big = big; applyDims(m); }

/** czy mamy miejsce, żeby wstać z kucania/toczenia */
function canStand(m: MoveState, g: Grid): boolean {
  const full = bodyDims(m.brother, m.big, false); const b = m.body;
  return !hitsSolid(g, b.x + (b.w - full.w) / 2, b.y + b.h - full.h, full.w, full.h - 1);
}

const sgn = (v: number): number => (v > 0 ? 1 : v < 0 ? -1 : 0);
const clampN = (v: number, a: number, b: number): number => Math.max(a, Math.min(b, v));
const approach = (v: number, target: number, d: number): number => (v < target ? Math.min(target, v + d) : Math.max(target, v - d));

/** rodzaj podłoża → mnożniki (przyspieszenie, hamowanie, prędkość maks.) */
function surface(tile: number): { acc: number; fric: number; top: number } {
  if (tile === T.ICE) return { acc: 0.28, fric: 0.12, top: 1 };
  if (tile === T.OIL) return { acc: 0.12, fric: 0.05, top: 1 };
  if (tile === T.SAND) return { acc: 0.75, fric: 1.6, top: 0.8 };
  return { acc: 1, fric: 1, top: 1 };
}

function wallProbe(g: Grid, b: Body, side: 1 | -1): boolean {
  const x = side > 0 ? b.x + b.w : b.x - 2;
  return hitsSolid(g, x, b.y + 3, 2, Math.max(4, b.h - 12));
}

function climbableAt(g: Grid, b: Body): { kind: ClimbKind; cx: number } {
  const x = b.x + 4, y = b.y + 4, w = b.w - 8, h = b.h - 8;
  const cx = Math.floor((b.x + b.w / 2) / TILE) * TILE + TILE / 2;
  if (touchesTile(g, x, y, w, h, T.ROPE)) return { kind: 'rope', cx };
  if (touchesTile(g, x, y, w, h, T.CLIMB)) return { kind: 'grate', cx };
  if (touchesTile(g, x, y, w, h, T.LADDER)) return { kind: 'ladder', cx };
  return { kind: '', cx };
}

export interface MoveEnv { water?: boolean; currentX?: number; currentY?: number }

export function stepMovement(m: MoveState, inp: MoveInput, g: Grid, dt: number, env: MoveEnv = {}): void {
  const p = BROTHERS[m.brother], b = m.body;
  m.landed = false; m.jumped = false; m.sprung = false; m.walljumped = false; m.pounded = false;
  const dirRaw = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
  let dir = dirRaw;
  if (inp.jumpPressed) m.jumpBuf = JUMP_BUFFER; else m.jumpBuf = Math.max(0, m.jumpBuf - dt);
  m.dropT = Math.max(0, m.dropT - dt); m.lock = Math.max(0, m.lock - dt); m.wjLock = Math.max(0, m.wjLock - dt);
  m.regrab = Math.max(0, m.regrab - dt); m.springCd = Math.max(0, m.springCd - dt); m.wallT = Math.max(0, m.wallT - dt); m.dash = Math.max(0, m.dash - dt);
  const slow = m.slow * m.speedMul;
  if (m.lock > 0) dir = 0;
  if (m.wjLock > 0) dir = m.wjDir;
  if (dir && !m.hang && !m.ledge) m.face = dir as 1 | -1;

  // ---- podciąganie na krawędź (animacja)
  if (m.ledge) {
    const L = m.ledge; L.t += dt; const k = clampN(L.t / 0.26, 0, 1);
    // najpierw w górę, potem w bok
    const e = k < 0.65 ? { x: 0, y: k / 0.65 } : { x: (k - 0.65) / 0.35, y: 1 };
    b.x = L.x0 + (L.x1 - L.x0) * e.x; b.y = L.y0 + (L.y1 - L.y0) * e.y; b.vx = b.vy = 0;
    if (k >= 1) { b.x = L.x1; b.y = L.y1; m.ledge = null; b.onGround = true; m.wasGround = true; m.coyote = COYOTE; }
    return;
  }

  // ---- wisi na krawędzi
  if (m.hang) {
    const H = m.hang; H.t += dt; b.vx = b.vy = 0; m.face = H.side;
    if (!(tileAt(g, H.tx, H.ty) !== T.EMPTY)) { m.hang = null; }       // krawędź zniknęła (kruszy się itp.)
    else if (inp.down || (dirRaw === -H.side && !inp.up)) { m.hang = null; m.regrab = 0.3; }
    else if (inp.up || m.jumpBuf > 0 || (dirRaw === H.side && H.t > 0.12)) {
      const sx = H.side > 0 ? H.tx * TILE + 2 : (H.tx + 1) * TILE - 2 - b.w;
      m.ledge = { t: 0, x0: b.x, y0: b.y, x1: sx, y1: H.ty * TILE - b.h };
      m.jumpBuf = 0; m.hang = null; return;
    } else return;
  }

  // ---- wspinaczka
  const cl = climbableAt(g, b);
  if (!m.climbing && m.regrab <= 0 && cl.kind) {
    const air = !b.onGround;
    const grab = cl.kind === 'grate' ? (inp.up || (inp.down && air) || (air && dirRaw !== 0 && !m.jumpBuf) || (air && b.vy > 0 && inp.up)) : (inp.up || (inp.down && air));
    if (grab && (cl.kind !== 'grate' || m.stamina > 0.02 || p.stamina >= 99)) { m.climbing = true; m.climbKind = cl.kind; m.gliding = false; m.wallSlide = 0; m.pounding = false; }
  }
  if (m.climbing && !cl.kind) {
    // wyjście z strefy: górą — małe podskoczenie na krawędź
    m.climbing = false; m.climbKind = '';
    if (inp.up) { b.vy = -250; b.vx = m.face * 70; m.regrab = 0.25; }
  }
  if (m.climbing) {
    const kind = cl.kind || m.climbKind; m.climbKind = kind;
    const upS = kind === 'grate' ? p.climbUp : p.climbUp * 0.9, dnS = p.climbDown;
    const vyDir = (inp.down ? 1 : 0) - (inp.up ? 1 : 0);
    if (kind === 'rope') { b.x += clampN(cl.cx - (b.x + b.w / 2), -300 * dt, 300 * dt); b.vx = 0; }
    else b.vx = dirRaw * (kind === 'grate' ? 120 : 80) * slow;
    b.vy = vyDir < 0 ? -upS * slow : vyDir > 0 ? dnS : 0;
    // wytrzymałość (kratki): Marioosh męczy się szybciej niż Darioosh
    if (kind === 'grate' && p.stamina < 99) {
      const use = (vyDir < 0 || dirRaw !== 0) ? 1 / p.stamina : vyDir > 0 ? 0 : 0.1 / p.stamina;
      m.stamina -= use * dt;
      if (m.stamina <= 0) { m.stamina = 0; m.climbing = false; m.regrab = 0.5; b.vy = 90; }
    }
    if (m.jumpBuf > 0) { m.climbing = false; m.climbKind = ''; b.vy = p.jump * 0.8 * m.jumpMul; b.vx = (dirRaw || m.face) * p.walk; m.jumpBuf = 0; m.jumped = true; m.jumping = true; m.regrab = 0.2; }
    if (dirRaw && kind !== 'rope') m.face = dirRaw as 1 | -1;
    moveBody(g, b, dt); m.wasGround = b.onGround;
    if (b.onGround && inp.down) { m.climbing = false; m.climbKind = ''; }
    return;
  }
  m.climbKind = '';

  // ---- pływanie (8 kierunków)
  m.swimming = !!env.water;
  if (m.swimming) {
    m.gliding = false; m.pounding = false; m.wallSlide = 0; m.duck = false; m.rolling = false; applyDims(m);
    let ix = dirRaw, iy = (inp.down ? 1 : 0) - (inp.up ? 1 : 0);
    const len = Math.hypot(ix, iy) || 1; ix /= len; iy /= len;
    const sp = p.swim * slow * (m.dash > 0 ? 1.7 : 1);
    const a = (ix || iy ? 700 : 420) * dt;
    b.vx = approach(b.vx, ix * sp, a); b.vy = approach(b.vy, iy ? iy * sp : p.sink, a * (iy ? 1 : 0.5));
    if (m.jumpBuf > 0) { m.jumpBuf = 0; m.jumped = true; m.dash = 0.3; if (!ix && !iy) { b.vy = -sp * 1.3; } else { b.vx = ix * sp * 1.7; b.vy = iy * sp * 1.7; } }
    b.vx += (env.currentX ?? 0) * dt; b.vy += (env.currentY ?? 0) * dt;
    b.vx = clampN(b.vx, -420, 420); b.vy = clampN(b.vy, -420, 420);
    if (ix) m.face = ix > 0 ? 1 : -1;
    moveBody(g, b, dt); m.wasGround = b.onGround; m.angle = 0; return;
  }

  // ---- czy stoimy na ziemi (z poprzedniej klatki) i czy coś nas właśnie wyrzuciło w górę
  let grounded = b.onGround && b.vy > -1;
  if (grounded) m.coyote = COYOTE; else m.coyote = Math.max(0, m.coyote - dt);
  if (!grounded) { /* w powietrzu kąt podłoża nie ma znaczenia */ }

  // kucanie / toczenie
  if (grounded) {
    const want = inp.down && !inp.up && !m.hang;
    if (want && !m.duck) { m.duck = true; applyDims(m); }
    else if (!want && m.duck && canStand(m, g)) { m.duck = false; applyDims(m); }
  } else if (m.duck && canStand(m, g)) { m.duck = false; applyDims(m); }

  // ---- skok
  if (m.jumpBuf > 0 && m.coyote > 0) {
    if (inp.down && b.groundTile === T.ONEWAY) { m.dropT = 0.25; b.vy = 0; m.jumpBuf = 0; m.coyote = 0; grounded = false; b.onGround = false; }
    else {
      const j = -p.jump * m.jumpMul;      // wartość dodatnia
      if (grounded) {
        const a = m.angle, gs = b.vx / Math.cos(a);
        b.vx = gs * Math.cos(a) - j * Math.sin(a); b.vy = -gs * Math.sin(a) - j * Math.cos(a);
        if (Math.abs(a) < 0.01) b.vy = -j;
      } else b.vy = -j;
      m.coyote = 0; m.jumpBuf = 0; m.jumping = true; m.jumped = true; grounded = false; b.onGround = false; m.launched = false;
      if (m.duck && canStand(m, g)) { m.duck = false; applyDims(m); }
    }
  }

  if (grounded) groundStep(m, inp, g, dt, dir, slow);
  else airStep(m, inp, g, dt, dir, dirRaw, slow, env);
  m.wasGround = b.onGround;
  if (b.onGround) m.stamina = Math.min(1, m.stamina + dt / 1.5);

  // ---- sprężyny
  if (m.springCd <= 0) {
    const cx = Math.floor((b.x + b.w / 2) / TILE), mid = Math.floor((b.y + b.h / 2) / TILE), low = Math.floor((b.y + b.h - 2) / TILE);
    const tu = tileAt(g, cx, low), tm = tileAt(g, cx, mid);
    if (tu === T.SPRING_U) { b.vy = -SPRING_V; b.onGround = false; m.sprung = true; m.launched = true; m.jumping = false; m.springCd = 0.25; m.lock = 0.12; m.wasGround = false; m.pounding = false; }
    else if (tm === T.SPRING_R || tm === T.SPRING_L) { const s = tm === T.SPRING_R ? 1 : -1; b.vx = s * SPRING_H; b.vy = Math.min(b.vy, -180); b.onGround = false; m.sprung = true; m.launched = true; m.springCd = 0.3; m.lock = 0.35; m.face = s as 1 | -1; m.wasGround = false; }
  }
}

// ======================================================================= po ziemi
function groundStep(m: MoveState, inp: MoveInput, g: Grid, dt: number, dir: number, slow: number): void {
  const p = BROTHERS[m.brother], b = m.body;
  const a = m.angle, ca = Math.cos(a), sa = Math.sin(a);
  let gsp = b.vx / ca;
  const sf = surface(b.groundTile);
  m.gliding = false; m.wallSlide = 0; m.pounding = false; m.launched = false; m.hang = null;
  const ducking = m.duck;
  m.rolling = ducking && (Math.abs(gsp) > (m.rolling ? 60 : 150));
  const baseTop = (inp.run ? p.run : p.walk) * slow * sf.top * (ducking && !m.rolling ? 0.4 : 1);
  if (m.rolling) {
    // toczenie: prawie bez tarcia, kierunek nie zmienia pędu (można lekko hamować)
    if (dir && Math.sign(gsp) !== dir) gsp -= sgn(gsp) * Math.min(Math.abs(gsp), 260 * dt);
    else gsp -= sgn(gsp) * Math.min(Math.abs(gsp), 70 * sf.fric * dt);
  } else if (dir) {
    if (gsp !== 0 && sgn(gsp) !== dir) gsp += dir * Math.max(p.decel * sf.fric, 120) * dt;                // hamowanie / kontra
    else if (Math.abs(gsp) < baseTop) { gsp += dir * p.accel * sf.acc * dt; if (Math.abs(gsp) > baseTop) gsp = dir * baseTop; }
    else gsp -= sgn(gsp) * Math.min(Math.abs(gsp) - baseTop, 380 * dt);                                  // nadmiar prędkości (z górki) powoli maleje
  } else {
    gsp -= sgn(gsp) * Math.min(Math.abs(gsp), p.fric * sf.fric * dt);
  }
  // siła stoku
  const slopeF = SLOPE_ACC * sa * (m.rolling && sgn(gsp) === sgn(sa) ? 0.62 : 1);
  gsp -= slopeF * dt;
  // taśmociąg
  if (b.groundTile === T.CONVL || b.groundTile === T.CONVR) gsp += (b.groundTile === T.CONVL ? -1 : 1) * 420 * dt;
  gsp = clampN(gsp, -MAX_SPEED, MAX_SPEED);
  if (Math.abs(gsp) < 2 && !dir && Math.abs(slopeF) < 1) gsp = 0;
  // ruch po podłożu podkrokami (stoki, wąskie przeszkody przy dużej prędkości)
  const n = Math.max(1, Math.ceil((Math.abs(gsp) * dt) / 6)); const sdt = dt / n;
  let airborne = false;
  for (let i = 0; i < n; i++) {
    const cur = Math.cos(m.angle);
    b.vx = gsp * cur; b.vy = 0;
    moveBody(g, b, sdt);
    m.angle = b.onGround ? slopeAngle(b.groundTile) : m.angle;
    if (b.hitWall) { gsp = 0; break; }
    if (!b.onGround) { airborne = true; b.vx = gsp * Math.cos(m.angle); b.vy = -gsp * Math.sin(m.angle); break; }
  }
  if (!airborne) {
    b.vx = gsp * Math.cos(m.angle); b.vy = 0;
    // ostry stok i mała prędkość bez ruchu: zsuwa się (siła stoku to załatwia); odrywanie od ściany nie dotyczy tego modelu (stoki ≤ 45°)
  } else { m.jumping = false; m.wasGround = false; }
  if (b.hitCeil) b.vy = 0;
}

// ======================================================================= w powietrzu
function airStep(m: MoveState, inp: MoveInput, g: Grid, dt: number, dir: number, dirRaw: number, slow: number, env: MoveEnv): void {
  const p = BROTHERS[m.brother], b = m.body;
  m.rolling = false;
  // --- ściany
  const wL = wallProbe(g, b, -1), wR = wallProbe(g, b, 1);
  const wallSide: 0 | 1 | -1 = wR ? 1 : wL ? -1 : 0;
  if (wallSide) { m.wallDir = wallSide; m.wallT = 0.12; }
  const pushing = wallSide !== 0 && dirRaw === wallSide;
  m.wallSlide = pushing && b.vy > 0 && !m.pounding ? wallSide : 0;
  // odbicie od ściany (Darioosh): także tuż po odejściu od ściany
  if (p.wallJump && m.jumpBuf > 0 && (m.wallSlide || m.wallT > 0) && m.coyote <= 0) {
    const side = (wallSide || m.wallDir) as 1 | -1;
    b.vx = -side * 520; b.vy = p.jump * 0.86 * m.jumpMul;
    m.wjDir = (-side) as 1 | -1; m.wjLock = WALL_JUMP_LOCK; m.face = m.wjDir; m.jumpBuf = 0; m.jumped = true; m.walljumped = true; m.jumping = true; m.gliding = false; m.wallSlide = 0; m.wallT = 0;
  }
  // --- chwyt krawędzi
  if (!m.hang && m.regrab <= 0 && b.vy >= -40 && !m.pounding && dirRaw !== 0 && wallSide === dirRaw && !inp.down) {
    const side = wallSide as 1 | -1;
    const cx = side > 0 ? Math.floor((b.x + b.w + 1.5) / TILE) : Math.floor((b.x - 1.5) / TILE);
    for (const ty of [Math.floor((b.y + 5) / TILE) + 1, Math.floor((b.y + 5) / TILE)]) {
      const top = ty * TILE; const t0 = tileAt(g, cx, ty), tUp = tileAt(g, cx, ty - 1);
      if (!(isSolidTile(t0) && t0 !== T.CRUMBLE && t0 !== T.GATE && !isSolidTile(tUp) && b.y >= top - 14 && b.y <= top + 4)) continue;
      const sx = side > 0 ? cx * TILE + 2 : (cx + 1) * TILE - 2 - b.w;
      if (hitsSolid(g, sx, top - b.h, b.w, b.h - 1)) continue;
      m.hang = { side, tx: cx, ty, t: 0 }; b.x = side > 0 ? cx * TILE - b.w : (cx + 1) * TILE; b.y = top - 3; b.vx = b.vy = 0; m.gliding = false; m.wallSlide = 0; m.face = side; return;
    }
  }
  // --- szybowanie: ponowne naciśnięcie skoku w powietrzu i trzymanie
  if (inp.jumpPressed && !m.jumped && m.coyote <= 0 && p.glideFall > 0 && !m.wallSlide && !m.pounding && b.vy > -200 && !(p.wallJump && m.wallT > 0)) { m.gliding = true; }
  if (!inp.jumpHeld || b.onGround || m.wallSlide) { if (!inp.jumpHeld || m.wallSlide) m.gliding = false; }
  // --- uderzenie w ziemię
  if (p.pound && inp.downPressed && !m.pounding && !m.gliding && !m.wallSlide) { m.pounding = true; b.vx = 0; b.vy = 900; m.gliding = false; }
  // --- ruch poziomy
  const maxV = (inp.run ? p.run : p.walk) * slow * (m.gliding ? 1.05 : 1);
  if (m.pounding) { b.vx = approach(b.vx, 0, 2400 * dt); }
  else if (dir !== 0 && m.lock <= 0) {
    const aA = p.airAccel * (m.gliding ? 1.3 : 1); const tgt = dir * maxV;
    if (Math.abs(b.vx) > maxV && sgn(b.vx) === dir) b.vx -= sgn(b.vx) * 140 * dt * 0.5;   // zachowaj rozpęd ponad prędkość maks.
    else b.vx = approach(b.vx, tgt, aA * dt);
  } else if (m.lock <= 0) b.vx = approach(b.vx, 0, 140 * dt);
  // --- pion
  if (!m.pounding) {
    let gr = HERO_GRAVITY;
    if (m.jumping && !m.launched && !inp.jumpHeld && b.vy < -JUMP_CUT) b.vy = -JUMP_CUT;      // puszczony skok: obcięcie
    else if (b.vy < 0 && inp.jumpHeld && Math.abs(b.vy) < 130 && m.jumping) gr *= 0.55;       // połowa grawitacji na szczycie
    b.vy += gr * dt;
    if (m.gliding && b.vy > p.glideFall) b.vy = approach(b.vy, p.glideFall, 2600 * dt);
    else if (b.vy > HERO_MAX_FALL) b.vy = HERO_MAX_FALL;
    if (m.wallSlide) b.vy = Math.min(b.vy, p.wallSlide);
    // prądy powietrzne (wiatr, noszenie przy szybowaniu)
    if (env.currentX || env.currentY) { const k = m.gliding ? 1 : 0.45; b.vx += (env.currentX ?? 0) * dt * k; b.vy += (env.currentY ?? 0) * dt * k; }
  }
  // korekta narożnika głowy: ucieka z uderzenia w róg o max 12 px
  if (b.vy < 0) {
    const ny = b.y + b.vy * dt;
    if (hitsSolid(g, b.x, ny, b.w, 2)) {
      for (let k = 1; k <= 12; k++) { let done = false; for (const s of [1, -1]) { if (!hitsSolid(g, b.x + s * k, ny, b.w, 2) && !hitsSolid(g, b.x + s * k, b.y, b.w, b.h - 4)) { b.x += s * k; done = true; break; } } if (done) break; }
    }
  }
  const vx0 = b.vx, n = Math.max(1, Math.ceil((Math.max(Math.abs(b.vx), Math.abs(b.vy)) * dt) / 6)); const sdt = dt / n;
  for (let i = 0; i < n; i++) {
    const vy0 = b.vy, vxs = b.vx;
    moveBody(g, b, sdt, { dropThrough: m.dropT > 0 || (inp.down && inp.jumpHeld) });
    if (b.onGround) {
      const a = slopeAngle(b.groundTile); m.angle = a;
      let gs = vxs * Math.cos(a) - vy0 * Math.sin(a);
      if (Math.abs(a) < 0.01) gs = vxs;
      b.vx = gs * Math.cos(a); b.vy = 0;
      m.jumping = false; m.gliding = false; m.launched = false; m.wallSlide = 0;
      if (m.pounding) { m.pounding = false; m.pounded = true; }
      m.landed = vy0 > 120;
      break;
    }
    if (b.hitCeil) { b.vy = 0; m.pounding = false; }
  }
  void vx0;
}
