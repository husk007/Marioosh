/** Ośmiu bossów wg tabeli H z GDD — każdy ma czytelne fazy, sygnał przed atakiem i warunek pokonania. */
import { BOSS_SIZE } from '../sprites/art';
import { BOSS_SCALE, GRAVITY, TILE } from './constants';
import { moveBody, newBody } from './physics';
import type { BossId } from '../data/worlds';
import type { BossRT, Decor, SwitchEnt } from './entities';
import type { AICtx } from './enemies';
import type { EnemyKind } from './types';

export interface BossCtx extends AICtx {
  switchesFor(gate: string): SwitchEnt[];
  decorOf(k: string): Decor[];
  spawnEnemy(kind: EnemyKind, x: number, y: number): void;
  enemyCount(kind: EnemyKind): number;
  shake(a: number): void;
  platsOff(sec: number): void;
  say(key: string, params?: Record<string, string | number>): void;
  breakPillar(i: number): void;
}

export const BOSS_HITS: Record<BossId, number> = { '': 0, rogomir: 3, zlomotaur: 3, kaktogor: 6, rogopletw: 3, ceratopsor: 3, krukorog: 3, rogodron: 3, katoblepas: 14 };

export function makeBoss(id: BossId, cx: number, groundY: number, x0: number, x1: number): BossRT {
  const s = BOSS_SIZE[id]; const w = Math.round(s.w * 0.78 * BOSS_SCALE), h = Math.round(s.h * 0.86 * BOSS_SCALE);
  const flying = id === 'krukorog' || id === 'rogodron';
  const b = newBody(cx - w / 2, flying ? groundY - h - 150 : groundY - h, w, h);
  return {
    id, b, hp: BOSS_HITS[id], maxHp: BOSS_HITS[id], st: 'intro', t: 1.2, dir: -1, phase: 1, hurt: 0, dead: false, deadT: 0, stun: 0, f: 0,
    x0, x1, floorY: groundY, data: {}, armor: id === 'zlomotaur' || id === 'rogodron' || id === 'kaktogor' || id === 'rogomir', flying, cycle: 0, started: false, hint: '',
  };
}

const bx = (b: BossRT) => b.b.x + b.b.w / 2;
const by = (b: BossRT) => b.b.y + b.b.h / 2;
const px = (c: BossCtx) => { let best = c.players[0]; for (const p of c.players) if (!p.dead && (!best || p.dead)) best = p; return best; };

function grav(b: BossRT, c: BossCtx, dt: number) { b.b.vy = Math.min(700, b.b.vy + GRAVITY * dt); moveBody(c.grid, b.b, dt); }
function clampArena(b: BossRT) {
  if (b.b.x < b.x0) { b.b.x = b.x0; b.b.hitWall = -1; }
  if (b.b.x + b.b.w > b.x1) { b.b.x = b.x1 - b.b.w; b.b.hitWall = 1; }
}
function faceP(b: BossRT, c: BossCtx) { const p = px(c); if (p) b.dir = p.mv.body.x + p.mv.body.w / 2 >= bx(b) ? 1 : -1; }

/** Czy kontakt rani gracza? */
export function bossHarmful(b: BossRT): boolean {
  if (b.dead || b.st === 'intro') return false;
  if (['stuck', 'recover', 'landed', 'dazed', 'stranded', 'crouch'].includes(b.st)) return false;
  return true;
}
/** Czy można trafić bossa (kluczem/iskrą)? */
export function bossVulnerable(b: BossRT): boolean {
  if (b.dead || b.hurt > 0) return false;
  switch (b.id) {
    case 'rogomir': return b.st === 'stuck' && !b.armor;
    case 'ceratopsor': return b.st === 'stuck';
    case 'zlomotaur': return b.st === 'stuck' && !b.armor;
    case 'kaktogor': return b.data.roots >= 3 && b.armor === false;
    case 'krukorog': return b.st === 'landed';
    case 'rogodron': return b.st === 'exposed';
    case 'rogopletw': return b.st === 'stranded';
    default: return false;     // katoblepas — tylko mechanika węzłów
  }
}

export function hitBoss(b: BossRT, how: 'key' | 'spark' | 'stomp'): boolean {
  if (!bossVulnerable(b)) return false;
  if (how === 'stomp' && b.id !== 'krukorog') return false;
  b.hp -= 1; b.hurt = 0.9; b.stun = 0.4;
  if (b.hp <= 0) { b.dead = true; b.deadT = 2.4; }
  else if (b.st === 'stuck') { b.st = 'recover'; b.t = 1.0; b.cycle++; }
  else if (b.st === 'landed') { b.st = 'rise'; b.t = 1; b.cycle++; }
  else if (b.st === 'exposed') { b.st = 'cover'; b.t = 1.5; }
  else if (b.st === 'stranded') { b.st = 'flee'; b.t = 3; b.cycle++; }
  return true;
}

function chargeLike(b: BossRT, c: BossCtx, dt: number, base: number, stuckT: number, onStuck?: () => void, windupT = 0.75, chargeT = 3, ramp = 35) {
  switch (b.st) {
    case 'intro': grav(b, c, dt); if (b.t <= 0) { b.st = 'idle'; b.t = 1.2; } break;
    case 'idle': b.b.vx = 0; grav(b, c, dt); faceP(b, c); if (b.t <= 0) { b.st = 'windup'; b.t = windupT; c.sfx('warn'); } break;
    case 'windup': b.b.vx = 0; grav(b, c, dt); if (b.t <= 0) { b.st = 'charge'; b.t = chargeT; } break;
    case 'charge': b.b.vx = b.dir * (base + b.cycle * ramp); grav(b, c, dt); clampArena(b);
      if (b.b.hitWall || b.t <= 0) { b.st = 'stuck'; b.t = stuckT; b.b.vx = 0; c.shake(5); c.sfx('rock'); onStuck?.(); } break;
    case 'stuck': b.b.vx = 0; grav(b, c, dt); if (b.t <= 0) { b.st = 'recover'; b.t = 0.6; b.cycle++; } break;
    case 'recover': b.b.vx = 0; grav(b, c, dt); if (b.t <= 0) { b.st = 'idle'; b.t = 0.9; } break;
  }
}

export function updateBoss(b: BossRT, dt: number, c: BossCtx): void {
  b.f += dt; b.t -= dt; if (b.hurt > 0) b.hurt -= dt;
  if (b.dead) { b.deadT -= dt; b.b.vx = 0; if (Math.random() < 0.3) c.shake(2); return; }
  const g = c.grid;
  switch (b.id) {
    case 'rogomir': {
      // v0.4: trzy generatory zasilają pancerz. Odłączone naraz (okno czasowe) zdejmują go; trafienie kluczem podłącza je z powrotem.
      const gens = c.switchesFor('gen'); const live = gens.filter((s) => s.on).length;
      if (b.armor && gens.length && live >= gens.length) { b.armor = false; c.say('toast.armor'); c.sfx('break'); c.shake(6); }
      else if (!b.armor && live < gens.length && b.data.hp0 === b.hp) { b.armor = true; }   // okno się skończyło — pancerz wraca
      if (b.data.hp0 === undefined) b.data.hp0 = b.hp;
      if (b.hp < b.data.hp0) { b.data.hp0 = b.hp; for (const s of gens) { s.on = false; s.latch = 0; } b.armor = true; }
      chargeLike(b, c, dt, 150, 5.5, undefined, 0.95, 14, 8);   // szarża zawsze kończy się na ścianie areny; po utknięciu 5,5 s na zejście drabiną (ok. 2,4 s) i cios
      break;
    }
    case 'ceratopsor': {
      if (b.st === 'idle' && b.t <= 0 && b.cycle % 2 === 1 && b.data.slam !== b.cycle) {
        b.data.slam = b.cycle; b.st = 'slam'; b.t = 0.9; c.sfx('warn');
      } else if (b.st === 'slam') {
        b.b.vx = 0; grav(b, c, dt);
        if (b.t <= 0.45 && b.data.slamDone !== b.cycle) { b.data.slamDone = b.cycle; b.b.vy = -300; }
        if (b.t <= 0 ) { b.st = 'idle'; b.t = 0.5; c.shake(7); c.sfx('rock'); for (const d of [-1, 1]) c.proj({ kind: 'wave', x: bx(b) + d * 30, y: b.floorY - 14, vx: d * 170, vy: 0, life: 3.2, r: 12 }); b.cycle++; }
      } else chargeLike(b, c, dt, 230, 2.4, () => { for (let i = 0; i < 4; i++) c.proj({ kind: 'rock', x: b.x0 + Math.random() * (b.x1 - b.x0), y: b.floorY - 330, vx: 0, vy: 0, life: 4, grav: 600, r: 9 }); });
      break;
    }
    case 'zlomotaur': {
      // v0.4: dwa pulpity suwnicy (po jednym na wieżach) włączone w jednym oknie zdejmują pancerz; trafienie przywraca pancerz i wyłącza pulpity.
      const cr = c.switchesFor('crane'); const live = cr.filter((s) => s.on).length;
      if (b.data.hp0 === undefined) b.data.hp0 = b.hp;
      if (b.armor && cr.length && live >= cr.length) { b.armor = false; c.say('toast.armor'); c.sfx('break'); c.shake(8); }
      else if (!b.armor && live < cr.length && b.data.hp0 === b.hp) b.armor = true;       // okno się skończyło — pancerz wraca
      if (b.hp < b.data.hp0) { b.data.hp0 = b.hp; for (const s of cr) { s.on = false; s.latch = 0; } b.armor = true; }
      b.data.scrap = (b.data.scrap ?? 2.5) - dt;
      if (b.data.scrap <= 0 && b.st !== 'intro') { b.data.scrap = 3.6; c.proj({ kind: 'scrap', x: b.x0 + 40 + Math.random() * (b.x1 - b.x0 - 80), y: b.floorY - 340, vx: 0, vy: 0, life: 4, grav: 700, r: 10 }); c.sfx('warn'); }
      chargeLike(b, c, dt, 150, 5.5, undefined, 0.95, 14, 8);   // szarża kończy się na ścianie areny (przy drabinie wieży); utknięcie 5,5 s
      break;
    }
    case 'kaktogor': {
      const roots = c.decorOf('root'); b.data.roots = roots.filter((r) => r.state === 1).length;
      if (b.armor && b.data.roots >= 3) { b.armor = false; c.say('toast.root'); c.sfx('break'); }
      grav(b, c, dt);
      b.data.shoot = (b.data.shoot ?? 1.5) - dt;
      if (b.data.shoot <= 0 && b.st !== 'intro') {
        b.data.shoot = b.armor ? 2.2 : 1.6; const p = px(c);
        if (p) { const dx = p.mv.body.x - bx(b); for (let i = -1; i <= 1; i++) c.proj({ kind: 'needle', x: bx(b) - 20, y: by(b) - 12, vx: dx / 1.3 + i * 55, vy: -300 + Math.abs(i) * 30, life: 3, grav: 650, r: 5 }); c.sfx('spark'); }
      }
      if (b.st === 'intro' && b.t <= 0) b.st = 'idle';
      b.data.coreOpen = b.armor ? 0 : 1;
      if (!b.armor && b.st === 'idle') b.st = 'open';
      break;
    }
    case 'rogopletw': {
      // v0.4: Rogopłetw Wielki brodzi po dnie basenów pod pomostem. Ochrania go woda — dopóki stoi w wodzie, jest nietykalny.
      // Zawory na pomoście SPUSZCZAJĄ wodę z wybranego basenu (na ~16 s); osuszony boss zostaje unieruchomiony na dnie i można go uderzyć.
      // Ataki: skok na pomost (zapowiedź: przykucnięcie 0,9 s) i szarża po dnie. Trafiony ucieka do basenu z wodą.
      const secs = 3; const sw = (b.x1 - b.x0) / secs; const secC = (i: number) => b.x0 + sw * (i + 0.5);
      const wetSec = (i: number) => c.water(secC(i), b.floorY - 20);
      const here = (): number => Math.max(0, Math.min(secs - 1, Math.floor((bx(b) - b.x0) / sw)));
      b.b.vx = 0;
      if (b.st === 'intro') { if (b.t <= 0) { b.st = 'swim'; b.t = 2.5; b.data.sec = 1; } b.b.y = b.floorY - b.b.h; break; }
      const grounded = b.st !== 'leap';
      if (grounded) b.b.y = b.floorY - b.b.h;
      const inWater = c.water(bx(b), b.floorY - 20);
      if (b.st === 'swim') {
        if (!inWater) { b.st = 'stranded'; b.t = 0; c.sfx('warn'); }
        else {
          // wędrówka po dnie ku wybranemu basenowi z wodą
          const want = b.data.sec ?? 1; const tx = secC(want);
          if (Math.abs(tx - bx(b)) > 8) { b.dir = tx > bx(b) ? 1 : -1; b.b.x += b.dir * 70 * dt; }
          if (b.t <= 0) {
            const p = px(c); const onWalk = !!p && p.mv.body.y + p.mv.body.h < b.floorY - 110; const dx = p ? Math.abs(p.mv.body.x - bx(b)) : 999;
            if (p && onWalk && dx < 280) { b.st = 'crouch'; b.t = 0.9; faceP(b, c); c.sfx('warn'); }
            else if (p && !onWalk && dx < 360) { b.st = 'dash'; b.t = 0.9; faceP(b, c); c.sfx('warn'); }
            else { const opts = [0, 1, 2].filter((i) => wetSec(i)); if (opts.length) b.data.sec = opts[Math.floor(Math.random() * opts.length)]; b.t = 3.4; }
          }
        }
      } else if (b.st === 'crouch') {
        if (b.t <= 0) { const p = px(c); const tx = p ? p.mv.body.x + p.mv.body.w / 2 : bx(b); b.b.vy = -430; b.b.vx = Math.max(-190, Math.min(190, (tx - bx(b)) * 0.9)); b.st = 'leap'; b.t = 0; c.sfx('beam'); }
      } else if (b.st === 'leap') {
        b.b.vy += 620 * dt; b.b.x += b.b.vx * dt; b.b.y += b.b.vy * dt;
        if (b.b.y >= b.floorY - b.b.h && b.b.vy > 0) { b.b.y = b.floorY - b.b.h; b.b.vy = 0; b.st = 'swim'; b.t = 3.0; c.shake(5); c.sfx('land'); }
      } else if (b.st === 'dash') {
        if (b.t > 0.35) { /* zapowiedź */ } else { b.b.x += b.dir * 230 * dt; }
        if (b.t <= 0) { b.st = 'swim'; b.t = 2.4; }
        if (!inWater) { b.st = 'stranded'; }
      } else if (b.st === 'stranded') {
        // unieruchomiony na suchym dnie; gdy woda wróci (zawór zamknięty), wstaje wściekły
        if (inWater) { b.st = 'swim'; b.t = 1.5; }
      } else if (b.st === 'flee') {
        const opts = [0, 1, 2].filter((i) => wetSec(i)); const cur = here();
        const tgt = opts.length ? opts.reduce((a, i) => Math.abs(secC(i) - bx(b)) < Math.abs(secC(a) - bx(b)) ? i : a, opts[0]) : cur;
        const tx = secC(tgt); b.dir = tx > bx(b) ? 1 : -1; b.b.x += b.dir * 190 * dt;
        if (Math.abs(tx - bx(b)) < 14 || (inWater && b.t <= 0)) { b.st = 'swim'; b.t = 3.0; b.data.sec = tgt; }
      }
      break;
    }
    case 'krukorog': {
      const spots = c.switchesFor('spot');
      b.b.vx = 0; b.b.vy = 0;
      if (b.st === 'intro') { if (b.t <= 0) { b.st = 'fly'; b.t = 2; } break; }
      if (b.st === 'fly') {
        const targetX = (b.x0 + b.x1) / 2 + Math.sin(b.f * 0.6) * (b.x1 - b.x0) * 0.32;
        b.b.x += (targetX - bx(b)) * 1.2 * dt; b.b.y = b.floorY - b.b.h - 160 + Math.sin(b.f * 1.5) * 14; faceP(b, c);
        b.data.rock = (b.data.rock ?? 1.5) - dt;
        if (b.data.rock <= 0) { b.data.rock = 2.2; const p = px(c); c.proj({ kind: 'rock', x: p ? p.mv.body.x : bx(b), y: b.b.y + 40, vx: 0, vy: 0, life: 3, grav: 700, r: 9 }); }
        b.data.gust = (b.data.gust ?? 5) - dt;
        if (b.data.gust <= 0) { b.data.gust = 7; b.st = 'gust'; b.t = 1.8; b.data.gd = b.dir; c.sfx('warn'); }
        if (spots.length && spots.every((s) => s.on)) { b.st = 'dazed'; b.t = 0.8; c.say('toast.light'); c.sfx('bossHit'); }
      } else if (b.st === 'gust') {
        if (b.t < 1.2) c.proj({ kind: 'gust', x: bx(b), y: b.floorY - 40, vx: b.data.gd * 260, vy: 0, life: 0.1, r: 20 });
        if (b.t <= 0) { b.st = 'fly'; b.t = 1; }
      } else if (b.st === 'dazed') {
        const ty = b.floorY - b.b.h; b.b.y += Math.min(260 * dt, Math.max(0, ty - b.b.y));
        if (b.b.y >= ty - 1 || b.t <= -1.2) { b.st = 'landed'; b.t = 3.4; b.b.y = ty; for (const s of spots) { s.on = false; } }
      } else if (b.st === 'landed') { if (b.t <= 0) { b.st = 'rise'; b.t = 1; } }
      else if (b.st === 'rise') { b.b.y -= 150 * dt; if (b.t <= 0 || b.b.y < b.floorY - b.b.h - 150) { b.st = 'fly'; b.t = 3; } }
      break;
    }
    case 'rogodron': {
      const gens = c.switchesFor('gen'); b.b.vx = 0; b.b.vy = 0;
      if (b.st === 'intro') { if (b.t <= 0) { b.st = 'fly'; b.t = 2; } break; }
      b.data.drone = (b.data.drone ?? 4) - dt;
      if (b.data.drone <= 0 && b.st === 'fly') { b.data.drone = 5; if (c.enemyCount('dron') < 3) c.spawnEnemy('dron', bx(b), by(b) + 30); }
      b.data.plat = (b.data.plat ?? 6) - dt;
      if (b.data.plat <= 0 && b.st === 'fly') { b.data.plat = 10; c.platsOff(3); c.say('boss.warn'); c.sfx('warn'); }
      const allOn = gens.length > 0 && gens.every((s) => s.on);
      if (b.st === 'fly') {
        const targetX = (b.x0 + b.x1) / 2 + Math.sin(b.f * 0.5) * (b.x1 - b.x0) * 0.3;
        b.b.x += (targetX - bx(b)) * 1.1 * dt; b.b.y = b.floorY - b.b.h - 170 + Math.sin(b.f * 1.2) * 16;
        if (allOn) { b.st = 'exposed'; b.t = 5.5; b.armor = false; c.say('toast.gen'); c.sfx('break'); }
      } else if (b.st === 'exposed') {
        const ty = b.floorY - b.b.h - 20; b.b.y += (ty - b.b.y) * 2 * dt; if (b.t <= 0) { b.st = 'cover'; b.t = 1.5; }
      } else if (b.st === 'cover') { b.b.y -= 100 * dt; if (b.t <= 0) { b.st = 'fly'; b.t = 2; b.armor = true; for (const s of gens) s.on = false; } }
      break;
    }
    case 'katoblepas': {
      b.data.petrify = 0;
      const pillars = c.decorOf('pillar'); const mirrors = c.decorOf('mirror'); const nodes = c.switchesFor('node');
      const broken = pillars.filter((p) => p.state === 1).length;
      if (b.phase === 1) {
        b.hp = b.maxHp - broken;
        chargeLike(b, c, dt, 200, 2.0);
        if (b.st === 'charge') {
          for (let i = 0; i < pillars.length; i++) { const pl = pillars[i]; if (pl.state === 0 && Math.abs(pl.x - bx(b)) < 40) { pl.state = 1; c.breakPillar(i); b.st = 'stuck'; b.t = 2; b.b.vx = 0; c.shake(9); c.sfx('break'); c.say('toast.pillar'); } }
        }
        if (broken >= 3) { b.phase = 2; b.st = 'swim'; b.t = 2; b.data.stage = 0; c.say('boss.phase', { n: 2 }); b.b.vx = 0; }
      } else if (b.phase === 2) {
        grav(b, c, dt); b.b.vx = 0;
        const hits2 = b.data.hits2 ?? 0; b.hp = b.maxHp - 3 - hits2;
        if (b.st === 'swim') { if (b.t <= 0) { b.data.m = Math.floor(Math.random() * 3); b.st = 'aim'; b.t = 2.8; c.sfx('warn'); c.say('toast.mirror'); } }
        else if (b.st === 'aim') {
          if (b.t <= 0) {
            const m = mirrors[b.data.m]; b.st = 'fire'; b.t = 0.8; c.sfx('beam');
            if (m && m.state === 1) { b.data.hits2 = hits2 + 1; b.data.reflect = 0.8; m.state = 0; b.hurt = 1; c.shake(6); c.sfx('bossHit'); if (hits2 + 1 >= 3) { b.phase = 3; b.st = 'p3'; b.t = 2; c.say('boss.phase', { n: 3 }); } }
            else { b.data.reflect = 0; if (m) c.beam({ x: bx(b) - 20, y: by(b) - 4, dir: -1, len: Math.max(30, bx(b) - m.x), t: 0.8, warn: false, owner: -3 }); const p = px(c); if (p) c.beam({ x: bx(b), y: by(b), dir: p.mv.body.x < bx(b) ? -1 : 1, len: 220, t: 0.8, warn: false, owner: -3 }); }
          }
        } else if (b.st === 'fire') { if (b.t <= 0) { b.st = 'swim'; b.t = 1.6; } }
      } else {
        grav(b, c, dt); b.b.vx = 0; const on = nodes.filter((s) => s.on).length; b.hp = Math.max(0, 8 - on) * 0; b.hp = Math.max(1, b.maxHp - 6 - on);
        b.data.p3 = (b.data.p3 ?? 2) - dt;
        if (b.data.p3 <= 0) {
          b.data.p3 = 2.4; const p = px(c);
          if (p) { const base = Math.atan2(p.mv.body.y - by(b), p.mv.body.x - bx(b)); for (let i = -1; i <= 1; i++) c.proj({ kind: 'pulse', x: bx(b), y: by(b), vx: Math.cos(base + i * 0.3) * 170, vy: Math.sin(base + i * 0.3) * 170, life: 3 }); c.sfx('spark');
            if (Math.random() < 0.4) { c.sfx('warn'); c.beam({ x: bx(b), y: by(b) - 10, dir: p.mv.body.x < bx(b) ? -1 : 1, len: 260, t: 1.1, warn: true, owner: -3 }); b.data.gaze = 1.1; } }
        }
        if (b.data.gaze > 0) { b.data.gaze -= dt; if (b.data.gaze <= 0) { const p = px(c); c.sfx('beam'); c.beam({ x: bx(b), y: by(b) - 10, dir: p && p.mv.body.x < bx(b) ? -1 : 1, len: 260, t: 1.0, warn: false, owner: -3 }); } }
        if (nodes.length && nodes.every((s) => s.on)) { b.hp = 0; b.dead = true; b.deadT = 3; }
      }
      break;
    }
  }
  if (b.id !== 'rogopletw') clampArena(b);
  b.b.x = Math.max(b.x0 - 2, Math.min(b.x1 - b.b.w + 2, b.b.x));
  void TILE; void g;
}
