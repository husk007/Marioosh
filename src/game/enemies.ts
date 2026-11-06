/** Przeciwnicy: parametry z bestiary + maszyny stanów. Każdy groźny atak ma sygnał (windup). */
import { LOOK } from '../sprites/art';
import { GRAVITY } from './constants';
import { isSolidTile, moveBody, newBody, tileAt, type Grid } from './physics';
import { ENEMY_CLASS, T, type EnemyKind } from './types';
import type { Beam, Enemy, PlayerEnt, Projectile } from './entities';
import type { SfxName } from '../engine/audio';
import { TILE } from './constants';

export const STATS: Record<EnemyKind, { hp: number; speed: number; score: number }> = {
  rogus: { hp: 1, speed: 55, score: 100 }, baranitor: { hp: 2, speed: 45, score: 250 }, bykobieg: { hp: 3, speed: 40, score: 400 },
  zukorog: { hp: 2, speed: 43, score: 250 }, cmorog: { hp: 1, speed: 70, score: 150 }, pszczolrog: { hp: 1, speed: 95, score: 200 },
  rogowrobel: { hp: 1, speed: 82, score: 150 }, krukorog: { hp: 2, speed: 68, score: 350 }, gekorog: { hp: 1, speed: 75, score: 200 },
  bazalisk: { hp: 2, speed: 37, score: 500 }, rogopletw: { hp: 1, speed: 95, score: 200 }, osmiorog: { hp: 2, speed: 58, score: 300 },
  kakturozec: { hp: 2, speed: 32, score: 300 }, rogopnacze: { hp: 2, speed: 0, score: 250 }, rogoroza: { hp: 2, speed: 0, score: 350 },
  slimorog: { hp: 2, speed: 42, score: 250 }, rogoskoczek: { hp: 1, speed: 85, score: 200 }, kamienirog: { hp: 3, speed: 40, score: 450 },
  dron: { hp: 1, speed: 90, score: 150 },
};

export interface AICtx {
  grid: Grid; players: PlayerEnt[]; time: number;
  proj(p: Pick<Projectile, 'kind' | 'x' | 'y' | 'vx' | 'vy'> & Partial<Projectile>): void;
  beam(b: Beam): void; sfx(n: SfxName): void; water(x: number, y: number): boolean;
}

let nextId = 1;
export function makeEnemy(kind: EnemyKind, cx: number, groundY: number): Enemy {
  const L = LOOK[kind]; const w = L.w - 4, h = L.h - 2; const cls = ENEMY_CLASS[kind];
  const flying = cls === 'air' || cls === 'water';
  const b = newBody(cx - w / 2, flying ? groundY - h - 56 : groundY - h, w, h);
  const st = STATS[kind];
  const e: Enemy = {
    id: nextId++, kind, b, hp: st.hp, maxHp: st.hp, dir: -1, st: 'patrol', t: 0, f: 0, hx: cx, hy: b.y,
    stun: 0, dead: false, deadT: 0, hornsUp: false, flip: false, hurt: 0, a: 0, c: 0, d: 0, lastSwing: -1, grounded: false, flying,
  };
  if (kind === 'kakturozec' || kind === 'zukorog' || kind === 'slimorog') e.hornsUp = true;
  if (kind === 'rogopnacze') { e.st = 'down'; e.t = 1.2; b.y = groundY - h; }
  if (kind === 'rogoroza') { e.st = 'closed'; e.t = 1.5; }
  if (kind === 'kakturozec') { e.st = 'patrol'; e.t = 3; }
  if (kind === 'rogoskoczek') { e.st = 'idle'; e.t = 0.6; }
  if (kind === 'kamienirog') { e.st = 'patrol'; e.t = 2.5; e.hornsUp = true; }
  if (kind === 'bazalisk') { e.hornsUp = true; }
  return e;
}

const nearest = (e: Enemy, ctx: AICtx): PlayerEnt | null => {
  let best: PlayerEnt | null = null, bd = 1e9;
  for (const p of ctx.players) { if (p.dead || p.tele || p.statue > 0) continue; const d = Math.abs(p.mv.body.x - e.b.x) + Math.abs(p.mv.body.y - e.b.y) * 0.5; if (d < bd) { bd = d; best = p; } }
  return best;
};
const cx = (b: { x: number; w: number }) => b.x + b.w / 2;
const cy = (b: { y: number; h: number }) => b.y + b.h / 2;

function ledgeAhead(e: Enemy, g: Grid): boolean {
  const fx = e.dir > 0 ? e.b.x + e.b.w + 3 : e.b.x - 3; const ty = Math.floor((e.b.y + e.b.h + 4) / TILE);
  const t = tileAt(g, Math.floor(fx / TILE), ty);
  return !(isSolidTile(t) || t === T.ONEWAY);
}
function gravity(e: Enemy, g: Grid, dt: number): void {
  e.b.vy = Math.min(700, e.b.vy + GRAVITY * dt);
  moveBody(g, e.b, dt);
}
/** Idzie w kierunku e.dir; zawraca na ścianie / krawędzi / poza zasięgiem patrolu. Zwraca true, jeśli zawrócił. */
function walk(e: Enemy, spd: number, g: Grid, dt: number, range = 150, turnLedge = true): boolean {
  e.b.vx = e.dir * spd; gravity(e, g, dt); let turned = false;
  if (e.b.hitWall) { e.dir = (e.dir * -1) as 1 | -1; turned = true; }
  else if (e.b.onGround && turnLedge && ledgeAhead(e, g)) { e.dir = (e.dir * -1) as 1 | -1; turned = true; }
  else if (Math.abs(cx(e.b) - e.hx) > range && Math.sign(e.hx - cx(e.b)) === e.dir) { e.dir = (e.dir * -1) as 1 | -1; turned = true; }
  return turned;
}
const sees = (e: Enemy, p: PlayerEnt | null, rx: number, ry: number, front = true): boolean => {
  if (!p) return false;
  const dx = cx(p.mv.body) - cx(e.b), dy = cy(p.mv.body) - cy(e.b);
  return Math.abs(dx) < rx && Math.abs(dy) < ry && (!front || Math.sign(dx) === e.dir);
};
const faceTo = (e: Enemy, p: PlayerEnt | null) => { if (p) e.dir = cx(p.mv.body) >= cx(e.b) ? 1 : -1; };

export function updateEnemy(e: Enemy, dt: number, ctx: AICtx): void {
  if (e.dead) { e.deadT -= dt; e.b.vy += GRAVITY * dt * 0.8; e.b.y += e.b.vy * dt; e.b.x += e.b.vx * dt; return; }
  e.f += dt; if (e.hurt > 0) e.hurt -= dt; if (e.stun > 0) e.stun -= dt;
  e.t -= dt;
  const g = ctx.grid, S = STATS[e.kind].speed, p = nearest(e, ctx);
  switch (e.kind) {
    case 'rogus': {
      if (e.st === 'patrol') { e.hornsUp = false; walk(e, S, g, dt, 140); if (e.t <= 0 && sees(e, p, 150, 50)) { e.st = 'alert'; e.t = 0.3; e.hornsUp = true; e.b.vx = 0; ctx.sfx('warn'); } }
      else if (e.st === 'alert') { e.b.vx = 0; gravity(e, g, dt); if (e.t <= 0) { e.st = 'lunge'; e.t = 0.45; } }
      else if (e.st === 'lunge') { e.b.vx = e.dir * 135; gravity(e, g, dt); if (e.b.hitWall || e.t <= 0) { e.st = 'patrol'; e.t = 1.2; e.hornsUp = false; } }
      break;
    }
    case 'gekorog': {
      if (e.st === 'patrol') { e.hornsUp = false; walk(e, S, g, dt, 160); if (e.t <= 0) { e.st = 'rest'; e.t = 1.0; e.hornsUp = true; ctx.sfx('warn'); } }
      else { e.hornsUp = true; e.b.vx = 0; gravity(e, g, dt); if (e.t <= 0) { e.st = 'patrol'; e.t = 2.2; if (p) faceTo(e, p); } }
      break;
    }
    case 'rogoskoczek': {
      if (e.st === 'idle') { e.hornsUp = false; e.b.vx = 0; gravity(e, g, dt); if (e.t <= 0 && e.b.onGround) { faceTo(e, p); e.st = 'hop'; e.hornsUp = true; e.b.vy = -330; e.b.vx = e.dir * 95; e.t = 0.15; } }
      else { gravity(e, g, dt); if (e.b.hitWall) e.dir = (e.dir * -1) as 1 | -1; if (e.t <= 0 && e.b.onGround) { e.st = 'idle'; e.t = 0.9; e.b.vx = 0; e.hornsUp = false; } }
      break;
    }
    case 'baranitor': case 'bykobieg': {
      const charge = e.kind === 'bykobieg' ? 240 : 200, stunT = e.kind === 'bykobieg' ? 1.7 : 1.4;
      if (e.st === 'patrol') { e.hornsUp = false; walk(e, S, g, dt, 170); if (e.t <= 0 && sees(e, p, 260, 40)) { e.st = 'alert'; e.t = 0.6; e.hornsUp = true; e.b.vx = 0; ctx.sfx('warn'); } }
      else if (e.st === 'alert') { e.b.vx = 0; gravity(e, g, dt); if (e.t <= 0) { e.st = 'charge'; e.t = 1.6; } }
      else if (e.st === 'charge') { e.b.vx = e.dir * charge; gravity(e, g, dt); if (e.b.hitWall) { e.st = 'stun'; e.t = stunT; e.hornsUp = false; ctx.sfx('rock'); e.b.vx = 0; } else if (e.t <= 0 || (e.b.onGround && ledgeAhead(e, g))) { e.st = 'patrol'; e.t = 1.5; e.hornsUp = false; } }
      else if (e.st === 'stun') { e.b.vx = 0; gravity(e, g, dt); if (e.t <= 0) { e.st = 'patrol'; e.t = 1.0; e.dir = (e.dir * -1) as 1 | -1; } }
      break;
    }
    case 'zukorog': case 'slimorog': {
      if (e.st === 'flipped') { e.b.vx = 0; gravity(e, g, dt); e.hornsUp = false; if (e.t <= 0) { e.st = 'patrol'; e.flip = false; e.hornsUp = true; } }
      else { e.hornsUp = true; walk(e, S, g, dt, 120); }
      break;
    }
    case 'kakturozec': {
      if (e.st === 'patrol') { e.hornsUp = true; walk(e, S, g, dt, 110); if (e.t <= 0) { e.st = 'retract'; e.t = 1.2; e.hornsUp = false; e.b.vx = 0; } }
      else { e.b.vx = 0; gravity(e, g, dt); if (e.t <= 0) { e.st = 'patrol'; e.t = 3; e.hornsUp = true; } }
      break;
    }
    case 'kamienirog': {
      if (e.st === 'patrol') { e.hornsUp = true; walk(e, S, g, dt, 150); if (e.t <= 0) { e.st = 'alert'; e.t = 0.5; faceTo(e, p); ctx.sfx('warn'); } }
      else if (e.st === 'alert') { e.b.vx = 0; gravity(e, g, dt); if (e.t <= 0) { e.st = 'dash'; e.t = 0.8; } }
      else if (e.st === 'dash') { e.b.vx = e.dir * 175; gravity(e, g, dt); if (e.b.hitWall || e.t <= 0) { e.st = 'shellOff'; e.t = 1.6; e.hornsUp = false; e.b.vx = 0; ctx.sfx('break'); } }
      else if (e.st === 'shellOff') { e.b.vx = 0; gravity(e, g, dt); if (e.t <= 0) { e.st = 'patrol'; e.t = 2.6; e.hornsUp = true; } }
      break;
    }
    case 'bazalisk': {
      if (e.st === 'patrol') { walk(e, S, g, dt, 120); e.hornsUp = true; if (e.t <= 0 && sees(e, p, 280, 56)) { e.st = 'flash'; e.t = 0.9; e.b.vx = 0; ctx.sfx('warn'); ctx.beam({ x: cx(e.b), y: e.b.y + 6, dir: e.dir, len: 240, t: 0.9, warn: true, owner: e.id }); } }
      else if (e.st === 'flash') { e.b.vx = 0; gravity(e, g, dt); if (e.t <= 0) { e.st = 'beam'; e.t = 1.2; ctx.sfx('beam'); ctx.beam({ x: cx(e.b), y: e.b.y + 6, dir: e.dir, len: 240, t: 1.2, warn: false, owner: e.id }); } }
      else if (e.st === 'beam') { e.b.vx = 0; gravity(e, g, dt); if (e.t <= 0) { e.st = 'rest'; e.t = 1.7; e.hornsUp = false; } }
      else if (e.st === 'rest') { e.b.vx = 0; gravity(e, g, dt); if (e.t <= 0) { e.st = 'patrol'; e.t = 1.5; e.hornsUp = true; } }
      break;
    }
    // ----- latające
    case 'cmorog': {
      if (e.st === 'patrol') {
        e.hornsUp = true; e.b.x += e.dir * S * 0.7 * dt; e.b.y = e.hy + Math.sin(e.f * 2.4) * 14;
        if (Math.abs(cx(e.b) - e.hx) > 120) e.dir = (e.dir * -1) as 1 | -1;
        if (e.t <= 0 && p && Math.abs(cx(p.mv.body) - cx(e.b)) < 130 && p.mv.body.y > e.b.y) { e.st = 'alert'; e.t = 0.4; faceTo(e, p); ctx.sfx('warn'); }
      } else if (e.st === 'alert') { if (e.t <= 0) { e.st = 'dive'; e.t = 1.4; } }
      else if (e.st === 'dive') {
        e.b.vx = e.dir * 150; e.b.vy = 210; moveBody(g, e.b, dt);
        if (e.b.onGround || e.t <= 0) { e.st = 'land'; e.t = 1.1; e.hornsUp = false; e.b.vx = 0; }
      } else if (e.st === 'land') { e.b.vx = 0; gravity(e, g, dt); if (e.t <= 0) { e.st = 'rise'; } }
      else if (e.st === 'rise') { e.b.vy = -110; e.b.vx = 0; e.b.y += e.b.vy * dt; if (e.b.y <= e.hy) { e.b.y = e.hy; e.st = 'patrol'; e.t = 2; } }
      break;
    }
    case 'pszczolrog': {
      e.hornsUp = true;
      if (sees(e, p, 230, 140, false) && p) { const dx = cx(p.mv.body) - cx(e.b), dy = cy(p.mv.body) - cy(e.b) + Math.sin(e.f * 6) * 24; const d = Math.hypot(dx, dy) || 1; e.b.x += (dx / d) * S * dt; e.b.y += (dy / d) * S * dt; e.dir = dx >= 0 ? 1 : -1; }
      else { e.b.x += e.dir * S * 0.5 * dt; e.b.y = e.hy + Math.sin(e.f * 5) * 18; if (Math.abs(cx(e.b) - e.hx) > 100) e.dir = (e.dir * -1) as 1 | -1; }
      break;
    }
    case 'rogowrobel': {
      if (e.st === 'patrol') { e.hornsUp = true; e.b.x += e.dir * S * 0.7 * dt; e.b.y = e.hy + Math.sin(e.f * 4) * 10; if (Math.abs(cx(e.b) - e.hx) > 110) e.dir = (e.dir * -1) as 1 | -1; if (e.t <= 0) { e.st = 'down'; } }
      else if (e.st === 'down') { e.b.vy = 160; e.b.vx = 0; moveBody(g, e.b, dt); if (e.b.onGround) { e.st = 'land'; e.t = 1.3; e.hornsUp = false; } }
      else if (e.st === 'land') { e.b.vx = 0; gravity(e, g, dt); if (e.t <= 0) e.st = 'rise'; }
      else if (e.st === 'rise') { e.b.y -= 120 * dt; if (e.b.y <= e.hy) { e.st = 'patrol'; e.t = 3.2; e.hornsUp = true; } }
      break;
    }
    case 'krukorog': {
      if (e.st === 'patrol') { e.hornsUp = true; e.b.x += e.dir * S * dt; e.b.y = e.hy + Math.sin(e.f * 1.6) * 20; if (Math.abs(cx(e.b) - e.hx) > 160) e.dir = (e.dir * -1) as 1 | -1; if (e.t <= 0 && sees(e, p, 250, 260, false)) { e.st = 'alert'; e.t = 0.5; faceTo(e, p); ctx.sfx('warn'); } }
      else if (e.st === 'alert') { if (e.t <= 0) { e.st = 'swoop'; e.t = 1.5; } }
      else if (e.st === 'swoop') { e.b.vx = e.dir * 185; e.b.vy = 170; moveBody(g, e.b, dt); if (e.b.onGround || e.t <= 0) { e.st = 'land'; e.t = 1.5; e.hornsUp = false; e.b.vx = 0; } }
      else if (e.st === 'land') { e.b.vx = 0; gravity(e, g, dt); if (e.t <= 0) e.st = 'rise'; }
      else if (e.st === 'rise') { e.b.y -= 110 * dt; if (e.b.y <= e.hy) { e.st = 'patrol'; e.t = 2.6; } }
      break;
    }
    case 'dron': {
      e.hornsUp = false;
      if (p) { const dx = cx(p.mv.body) - cx(e.b), dy = cy(p.mv.body) - cy(e.b) - 30 + Math.sin(e.f * 3) * 20; const d = Math.hypot(dx, dy) || 1; e.b.x += (dx / d) * S * dt; e.b.y += (dy / d) * S * dt; e.dir = dx >= 0 ? 1 : -1; }
      break;
    }
    // ----- woda
    case 'rogopletw': {
      e.hornsUp = true;
      if (e.st === 'patrol') { e.b.x += e.dir * S * 0.5 * dt; e.b.y = e.hy + Math.sin(e.f * 2) * 12; if (Math.abs(cx(e.b) - e.hx) > 150) e.dir = (e.dir * -1) as 1 | -1; if (e.t <= 0 && sees(e, p, 230, 120, false)) { e.st = 'alert'; e.t = 0.4; faceTo(e, p); ctx.sfx('warn'); } }
      else if (e.st === 'alert') { if (e.t <= 0) { e.st = 'dash'; e.t = 0.6; if (p) { const dx = cx(p.mv.body) - cx(e.b), dy = cy(p.mv.body) - cy(e.b); const d = Math.hypot(dx, dy) || 1; e.b.vx = (dx / d) * 200; e.b.vy = (dy / d) * 200; } } }
      else if (e.st === 'dash') { e.b.x += e.b.vx * dt; e.b.y += e.b.vy * dt; if (e.t <= 0) { e.st = 'patrol'; e.t = 1.6; e.hy = e.b.y; e.hx = cx(e.b); } }
      break;
    }
    case 'osmiorog': {
      e.hornsUp = false;
      if (p && sees(e, p, 260, 160, false)) { const dx = cx(p.mv.body) - cx(e.b), dy = cy(p.mv.body) - cy(e.b); const d = Math.hypot(dx, dy) || 1; e.b.x += (dx / d) * S * dt; e.b.y += (dy / d) * S * 0.7 * dt; e.dir = dx >= 0 ? 1 : -1; }
      else { e.b.x += e.dir * 30 * dt; e.b.y = e.hy + Math.sin(e.f * 1.5) * 10; if (Math.abs(cx(e.b) - e.hx) > 120) e.dir = (e.dir * -1) as 1 | -1; }
      break;
    }
    // ----- rośliny
    case 'rogopnacze': {
      if (e.st === 'down') { e.hornsUp = false; if (e.t <= 0) { e.st = 'up'; e.t = 1.7; e.hornsUp = true; ctx.sfx('warn'); } }
      else { e.hornsUp = true; if (e.t <= 0) { e.st = 'down'; e.t = 1.4; e.hornsUp = false; } }
      break;
    }
    case 'rogoroza': {
      if (e.st === 'closed') { e.hornsUp = false; if (e.t <= 0 && p && Math.abs(cx(p.mv.body) - cx(e.b)) < 280) { e.st = 'open'; e.t = 0.8; e.hornsUp = true; ctx.sfx('warn'); faceTo(e, p); } else if (e.t <= 0) e.t = 0.5; }
      else if (e.st === 'open') { if (e.t <= 0) { e.st = 'fire'; e.t = 0.9; const tx = p ? cx(p.mv.body) : cx(e.b) + e.dir * 100, ty = p ? cy(p.mv.body) : cy(e.b); const base = Math.atan2(ty - (e.b.y + 10), tx - cx(e.b)); for (let i = -1; i <= 1; i++) ctx.proj({ kind: 'pulse', x: cx(e.b), y: e.b.y + 10, vx: Math.cos(base + i * 0.28) * 150, vy: Math.sin(base + i * 0.28) * 150, life: 2.4 }); ctx.sfx('spark'); } }
      else if (e.st === 'fire') { if (e.t <= 0) { e.st = 'closed'; e.t = 2.3; e.hornsUp = false; } }
      break;
    }
  }
  // wypadnięcie poza świat
  if (e.b.y > 40 * TILE) { e.dead = true; e.deadT = 0; }
}

/** Czy można nadepnąć przeciwnika (rogi mają pierwszeństwo)? */
export function stompable(e: Enemy): boolean {
  if (e.dead || e.hornsUp) return false;
  switch (e.kind) {
    case 'pszczolrog': case 'rogopletw': case 'osmiorog': case 'rogopnacze': case 'rogoroza': case 'kakturozec': case 'kamienirog': case 'bykobieg': return false;
    case 'cmorog': case 'rogowrobel': case 'krukorog': return e.st === 'land';
    case 'baranitor': return e.st !== 'charge' && e.st !== 'alert';
    default: return true;
  }
}
export type HitKind = 'key' | 'spark' | 'stomp' | 'env';
export type HitResult = 'none' | 'block' | 'flip' | 'hurt' | 'kill';

/** Zadaje obrażenia wg reguł z bestiariusza. fromBehind: atakujący stoi z tyłu przeciwnika. */
export function hitEnemy(e: Enemy, how: HitKind, dmg: number, fromBehind: boolean): HitResult {
  if (e.dead) return 'none';
  let ok = true; const k = e.kind;
  if (how === 'key' || how === 'spark' || how === 'env') {
    switch (k) {
      case 'krukorog': ok = e.st === 'land'; break;
      case 'baranitor': ok = e.st === 'stun' || fromBehind; break;
      case 'bykobieg': ok = e.st === 'stun'; break;
      case 'kamienirog': ok = e.st === 'shellOff'; break;
      case 'kakturozec': ok = (e.st === 'retract' && how !== 'spark') || how === 'env'; break;
      case 'bazalisk': ok = e.st === 'rest'; break;
      case 'rogoroza': ok = e.st === 'closed'; break;
      case 'zukorog': case 'slimorog':
        if (e.st !== 'flipped') { if (how === 'key') { e.st = 'flipped'; e.flip = true; e.t = 4; e.hornsUp = false; e.hurt = 0.2; return 'flip'; } return 'block'; }
        break;
    }
  }
  if (!ok) { return 'block'; }
  e.hp -= how === 'key' ? dmg : 1; e.hurt = 0.25;
  if (e.hp <= 0) { e.dead = true; e.deadT = 0.8; e.b.vy = -240; e.b.vx = 0; return 'kill'; }
  return 'hurt';
}

/** Czy dotknięcie boku rani gracza? */
export function harmful(e: Enemy): boolean {
  if (e.dead) return false;
  if (e.hornsUp) return true;
  return !['stun', 'flipped', 'rest', 'closed', 'retract', 'shellOff'].includes(e.st);
}
