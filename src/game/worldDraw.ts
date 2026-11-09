/** Rysowanie świata gry (bez HUD). Wszystkie współrzędne w px świata, kamera w gfx.camX/camY. */
import { Gfx, Img, Pix, lh, lw, makeCanvas, tinted } from '../engine/gfx';
import { WORLDS } from '../data/worlds';
import { hdBackground } from '../sprites/hd';
import {
  BOSS_SIZE, HERO_H, HERO_W, LOOK, TOP_PAD, cloudLayer, OUT, bossSprite, bubbleSprite, cableSprite, checkpointSprite, companionSprite, crateSprite, ecoportSprite, enemySprite, exitSprite,
  freedSprite, glowImage, heroSprite, itemSprite, lampSprite, lanternSprite, parallaxLayer, pulseSprite, rockSprite, shieldSprite, signSprite, skyImage, sparkSprite,
  statueSprite, switchSprite, tileset, type HeroFrame,
} from '../sprites/art';
import { TILE, VH, VW } from './constants';
import type { Enemy, PlayerEnt } from './entities';
import { T } from './types';
import type { World } from './world';
import { isSlope, isSolidTile, slopeH, tileAt } from './physics';

const tintCache = new WeakMap<Img, Map<string, Img>>();
function tint(img: Img, color: string, a: number): Img {
  const q = Math.round(a * 6) / 6; const key = color + q;
  let m = tintCache.get(img); if (!m) { m = new Map(); tintCache.set(img, m); }
  let r = m.get(key); if (!r) { r = tinted(img, color, q); m.set(key, r); }
  return r;
}


// ---------------------------------------------------------------- nowe kafle: stoki, sprężyny, liny, kratki, lód/olej/piasek
const slopeCache = new Map<string, Img>();
/** kafel stoku: faktura wypełnienia przycięta do trójkąta/trapezu + kolorowa krawędź powierzchni */
function slopeImg(ts: { fill: Img[] }, t: number, v: number, world: number): Img {
  const key = `${world}:${t}:${v}`; const hit = slopeCache.get(key); if (hit) return hit;
  const c = makeCanvas(64, 64) as Img; c.ss = 2; const x = c.getContext('2d') as CanvasRenderingContext2D;
  const y0 = 64 - slopeH(t, 0) * 2, y1 = 64 - slopeH(t, TILE) * 2;
  x.save(); x.beginPath(); x.moveTo(0, 64); x.lineTo(0, y0); x.lineTo(64, y1); x.lineTo(64, 64); x.closePath(); x.clip();
  const f = ts.fill[v % ts.fill.length]; if (f) x.drawImage(f, 0, 0, 64, 64); else { x.fillStyle = WORLDS[world]?.ground ?? '#555'; x.fillRect(0, 0, 64, 64); }
  x.restore();
  const col = WORLDS[world]?.groundTop ?? '#9a9';
  x.strokeStyle = col; x.lineWidth = 6; x.lineCap = 'butt'; x.beginPath(); x.moveTo(0, y0 + 3); x.lineTo(64, y1 + 3); x.stroke();
  x.strokeStyle = 'rgba(255,255,255,0.35)'; x.lineWidth = 2; x.beginPath(); x.moveTo(0, y0 + 1); x.lineTo(64, y1 + 1); x.stroke();
  slopeCache.set(key, c); return c;
}
function drawSpring(g: Gfx, X: number, Y: number, dir: 'u' | 'r' | 'l', fr: number): void {
  const col = '#ffd23f', dark = '#7a6a2a', coil = '#d8d8e8';
  if (dir === 'u') {
    g.rect(X + 5, Y + 28, 22, 4, '#6a6a7a');
    for (let i = 0; i < 3; i++) g.rect(X + 8, Y + 14 + i * 4 + fr, 16, 2, coil);
    g.rect(X + 4, Y + 10 + fr, 24, 5, col); g.rect(X + 4, Y + 14 + fr, 24, 1, dark);
  } else {
    const s = dir === 'r' ? 1 : -1, bx = dir === 'r' ? X : X + 32;
    g.rect(dir === 'r' ? X : X + 28, Y + 6, 4, 20, '#6a6a7a');
    for (let i = 0; i < 3; i++) g.rect(bx + s * (6 + i * 4) - (s < 0 ? 2 : 0) + fr * s, Y + 10, 2, 12, coil);
    g.rect(bx + s * 18 - (s < 0 ? 5 : 0) + fr * s, Y + 6, 5, 20, col);
  }
}
function drawRope(g: Gfx, X: number, Y: number, world: number): void {
  const cx = X + 16;
  if (world === 7) { for (let i = 0; i < 4; i++) { g.rect(cx - 3, Y + i * 8 + 1, 6, 7, '#9aa4b0'); g.rect(cx - 1, Y + i * 8 + 3, 2, 3, '#3c4a54'); } }
  else if (world === 3) { g.rect(cx - 2, Y, 4, TILE, '#3a9a50'); g.rect(cx - 6, Y + 8, 5, 3, '#4db868'); g.rect(cx + 2, Y + 20, 5, 3, '#4db868'); }
  else { g.rect(cx - 2, Y, 4, TILE, '#b58a50'); for (let i = 0; i < 4; i++) g.rect(cx - 3, Y + i * 8 + 2, 6, 2, '#7a5a30'); }
}
function drawGrate(g: Gfx, X: number, Y: number, world: number): void {
  const c = world === 3 ? '#4db868' : world === 6 ? '#6979b2' : '#9aa0b0';
  g.rect(X + 2, Y, 3, TILE, c, 0.9); g.rect(X + 14, Y, 3, TILE, c, 0.9); g.rect(X + 26, Y, 3, TILE, c, 0.9);
  g.rect(X, Y + 3, TILE, 2, c, 0.9); g.rect(X, Y + 15, TILE, 2, c, 0.9); g.rect(X, Y + 27, TILE, 2, c, 0.9);
}

const decorCache = new Map<string, Img>();
function decorImg(k: string, state: number): Img | null {
  const key = k + state; const hit = decorCache.get(key); if (hit) return hit;
  let p: Pix | null = null;
  switch (k) {
    case 'root': p = new Pix(36, 52); if (state === 0) { p.r(14, 6, 8, 46, '#2f7a3c').e(18, 8, 14, 8, '#3e8f4a').r(4, 24, 12, 5, '#2f7a3c').r(22, 32, 12, 5, '#2f7a3c').e(18, 6, 4, 4, '#e8507a'); } else { p.r(10, 40, 16, 12, '#4a3a22').r(8, 46, 20, 6, '#2f7a3c'); } break;
    case 'mirror': p = new Pix(36, 52); p.r(16, 24, 4, 28, '#6a707c').r(8, 48, 20, 4, '#6a707c'); p.poly([[18, 2], [32, 20], [18, 40], [4, 20]], state ? '#bfe6f6' : '#6a8aa0'); p.l(18, 4, 18, 38, state ? '#ffffff' : '#a0c0d0'); if (state) p.e(18, 20, 4, 4, '#fff'); break;
    case 'pillar': p = new Pix(36, 96); if (state === 0) { p.r(6, 8, 24, 88, '#8a8498').r(2, 0, 32, 10, '#a09ab0').r(2, 86, 32, 10, '#a09ab0'); for (let y = 14; y < 84; y += 14) p.r(6, y, 24, 2, '#6a647a'); } else { p.r(2, 78, 32, 18, '#7a7488'); p.r(8, 70, 10, 10, '#8a8498').r(20, 74, 8, 8, '#6a647a'); } break;
    case 'guard': p = new Pix(28, 44); p.r(4, 38, 20, 6, '#6a6a72').e(14, 24, 8, 12, '#8f8f98').e(14, 10, 7, 7, '#8f8f98').poly([[8, 5], [11, 5], [9, -1]], '#d8d0c0'); break;
    case 'statue': p = new Pix(32, 44); p.r(6, 38, 20, 6, '#6a6a72').e(16, 26, 9, 12, '#7a7a84').e(16, 10, 8, 8, '#7a7a84').poly([[10, 6], [13, 6], [11, 0]], '#c0b8a8').poly([[19, 6], [22, 6], [21, 0]], '#c0b8a8'); break;
    default: return null;
  }
  p.outline(OUT); decorCache.set(key, p.c); return p.c;
}

let darkCanvas: HTMLCanvasElement | null = null;

export function drawWorld(w: World, g: Gfx): void {
  const rt = w.rt; const room = rt.room; const theme = WORLDS[room.world] ?? WORLDS[1]; const ts = tileset(room.world);
  const ctx = g.ctx;
  let sx = 0, sy = 0;
  if (w.shakeT > 0) { sx = (Math.random() - 0.5) * w.shakeA * 2; sy = (Math.random() - 0.5) * w.shakeA * 2; } else w.shakeA = 0;
  g.camX = Math.round(w.cam.x + sx); g.camY = Math.round(w.cam.y + sy);

  // niebo + paralaksa
  ctx.drawImage(hdBackground(room.world) ?? skyImage(room.world, room.dark), 0, 0, VW, VH);
  const clouds = cloudLayer(room.world);
  if (clouds && !room.dark) { const cw = lw(clouds); const ox = -((g.camX * 0.05 + w.time * 4) % cw + cw) % cw; for (const dx of [0, cw]) ctx.drawImage(clouds, Math.round(ox + dx), 10, cw, lh(clouds)); }
  const parF = [0.12, 0.25, 0.45];
  for (let l = 0; l < 3; l++) {
    const img = parallaxLayer(room.world, l as 0 | 1 | 2);
    const ox = -((g.camX * parF[l]) % 640 + 640) % 640; const oy = -Math.round(g.camY * 0.12 * (l + 1) / 3) - 6;
    ctx.globalAlpha = room.dark ? 0.55 : 0.9;
    const ih = lh(img); ctx.drawImage(img, Math.round(ox), oy, VW, ih); ctx.drawImage(img, Math.round(ox) + 640, oy, VW, ih); ctx.drawImage(img, Math.round(ox) - 640, oy, VW, ih);
    ctx.globalAlpha = 1;
  }

  // kafelki
  const tx0 = Math.max(0, Math.floor(g.camX / TILE) - 1), tx1 = Math.min(room.w - 1, Math.floor((g.camX + VW) / TILE) + 1);
  const ty0 = Math.max(0, Math.floor(g.camY / TILE) - 1), ty1 = Math.min(room.h - 1, Math.floor((g.camY + VH) / TILE) + 1);
  const fr = Math.floor(w.time * 6) & 1;
  for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
    const t = rt.tiles[ty * room.w + tx]; if (t === T.EMPTY || t === 20) continue;
    const v = ts.fill.length === 16 ? (tx & 3) + ((ty & 3) << 2) : (tx * 7 + ty * 13) % 3; const vt = ts.top.length === 4 ? tx & 3 : (tx * 7 + ty * 13) % 3; const X = tx * TILE, Y = ty * TILE;
    switch (t) {
      case T.SOLID: case T.ICE: case T.OIL: case T.SAND: case T.PLATFORM_BREAK: {
        const above = ty > 0 ? rt.tiles[(ty - 1) * room.w + tx] : T.SOLID;
        const covered = isSolidTile(above) || isSlope(above);
        if (t === T.PLATFORM_BREAK) { g.spr(ts.cracked, X, Y); break; }
        g.spr(covered ? ts.fill[v] : ts.top[vt], X, covered ? Y : Y - TOP_PAD);
        if (t === T.ICE) { g.rect(X, Y, TILE, TILE, '#bfe6ff', 0.34); if (!covered) g.rect(X, Y - 1, TILE, 3, '#e8f8ff', 0.9); g.rect(X + 6 + ((tx * 5) & 7), Y + 6, 8, 2, '#ffffff', 0.45); }
        else if (t === T.OIL) { g.rect(X, Y, TILE, TILE, '#1a1030', 0.55); if (!covered) { g.rect(X, Y - 1, TILE, 4, '#2a1a48', 0.95); g.rect(X + 4 + ((fr * 3 + tx * 5) & 15), Y, 6, 2, '#7fd6c8', 0.7); } }
        else if (t === T.SAND) { g.rect(X, Y, TILE, TILE, '#e6c88a', 0.5); if (!covered) g.rect(X, Y - 1, TILE, 3, '#f4dcae', 0.9); }
        break;
      }
      case T.SL_R45: case T.SL_L45: case T.SL_R26A: case T.SL_R26B: case T.SL_L26A: case T.SL_L26B: g.spr(slopeImg(ts, t, v, room.world), X, Y); break;
      case T.SPRING_U: drawSpring(g, X, Y, 'u', fr); break;
      case T.SPRING_R: drawSpring(g, X, Y, 'r', fr); break;
      case T.SPRING_L: drawSpring(g, X, Y, 'l', fr); break;
      case T.ROPE: drawRope(g, X, Y, room.world); break;
      case T.CLIMB: drawGrate(g, X, Y, room.world); break;
      case T.ONEWAY: g.spr(ts.oneway, X, Y); break;
      case T.HAZARD: g.spr(ts.hazard[fr], X, Y); break;
      case T.LADDER: g.spr(ts.ladder, X, Y); break;
      case T.CRUMBLE: { const c = rt.crumble.get(ty * room.w + tx); g.spr(ts.crumble, X + (c && !c.gone ? (Math.random() - 0.5) * 2 : 0), Y); break; }
      case T.CONVL: g.spr(ts.fill[v], X, Y); g.spr(ts.conv[0][fr], X, Y); break;
      case T.CONVR: g.spr(ts.fill[v], X, Y); g.spr(ts.conv[1][fr], X, Y); break;
      case T.CRACKED: g.spr(ts.cracked, X, Y); break;
      case T.CABLE: g.spr(ts.cableBase, X, Y); break;
      case T.GATE: g.spr(ts.gate, X, Y, { alpha: 0.95 }); break;
    }
  }

  // woda (pod postaciami)
  let hasWater = false;
  for (let ty = ty0; ty <= ty1 && !hasWater; ty++) for (let tx = tx0; tx <= tx1; tx++) if (room.water[ty * room.w + tx]) { hasWater = true; break; }
  if (hasWater) {
    for (let ty = ty0; ty <= ty1; ty++) {
      let run = -1;
      for (let tx = tx0; tx <= tx1 + 1; tx++) {
        const wet = tx <= tx1 && room.water[ty * room.w + tx] === 1;
        if (wet && run < 0) run = tx; else if (!wet && run >= 0) {
          g.rect(run * TILE, ty * TILE, (tx - run) * TILE, TILE, '#2d80b4', 0.32);
          if (ty === 0 || !room.water[(ty - 1) * room.w + run]) g.rect(run * TILE, ty * TILE, (tx - run) * TILE, 2, '#bfe6f6', 0.7);
          run = -1;
        }
      }
    }
  }

  // elementy tła
  for (const d of rt.decor) { const im = decorImg(d.k, d.state); if (im) g.spr(im, d.x - lw(im) / 2, d.y - lh(im)); }
  for (const s of rt.signs) g.spr(signSprite(s.symbol), s.x - 12, s.y - 32);
  for (const l of rt.lamps) g.spr(lampSprite(fr), l.x - 8, l.y - 40);
  for (const l of rt.lanterns) g.spr(lanternSprite(l.lit), l.x - 10, l.y - 28);
  for (const c of rt.checkpoints) g.spr(checkpointSprite(c.on, fr), c.x - 17, c.y - 80, { w: 34, h: 78 });
  for (const e of rt.exits) if (!rt.boss || rt.boss.dead) g.spr(exitSprite(true, fr), e.x - 40, e.y - 104, { w: 80, h: 104 });
  for (const e of rt.ecos) g.spr(ecoportSprite(e.broken, fr), e.x - 30, e.y - 80, { w: 60, h: 80 });
  for (const s of rt.statues) {
    if (s.freed) { if (s.t < 2.5) { s.t += 1 / 60; g.spr(freedSprite(), s.x - 24 + s.t * 40, s.y - 70, { w: 48, h: 70, alpha: Math.max(0, 1 - s.t / 2.5) }); } }
    else g.spr(statueSprite(false, s.idx), s.x - 24, s.y - 70, { w: 48, h: 70 });
  }
  for (const s of rt.switches) g.spr(switchSprite(s.style, s.on), s.x - 19, s.y - 48, { w: 38, h: 48 });
  for (const c of rt.cables) if (c.revealed) {
    if (c.face === 'door') { drawDoor(g, c.tx * TILE + 16, (c.ty + 1) * TILE, c.color, c.locked, w.time); continue; }
    g.spr(cableSprite(c.color, c.face, fr), c.tx * TILE, c.ty * TILE - (c.face === 'up' ? 6 : 0));
    if (c.symbol !== undefined) g.spr(signSprite(c.symbol), c.tx * TILE + 4, c.ty * TILE - 42, { w: 24, h: 32 });
    if (c.locked || c.color === 'black') { g.rect(c.tx * TILE + 12, c.ty * TILE - 14, 8, 8, '#e0443a'); }
  }
  for (const c of rt.crates) if (c.revealed) g.spr(crateSprite(c.hidden, c.used), c.tx * TILE, c.ty * TILE - (c.bump > 0 ? 5 : 0));
  for (const pl of rt.plats) {
    if (!pl.solid && pl.mode === 'phase') { g.rect(pl.x, pl.y, pl.w, 8, '#9ad0ff', 0.12); continue; }
    if (!pl.solid) continue;
    const blink = pl.warn && Math.floor(w.time * 14) % 2 === 0;
    if (ts.plat) { g.spr(ts.plat, pl.x, pl.y - 4, { w: pl.w, h: 18, alpha: blink ? 0.45 : 1 }); continue; }
    g.rect(pl.x, pl.y, pl.w, 10, blink ? '#fff' : '#8d93a0'); g.rect(pl.x, pl.y, pl.w, 3, '#c9ced6'); g.rect(pl.x, pl.y + 10, pl.w, 2, '#2a2c3a');
    for (let i = 6; i < pl.w; i += 14) g.rect(pl.x + i, pl.y + 4, 4, 3, '#ffd23f');
  }

  // przedmioty
  for (const it of rt.items) {
    const bob = it.fixed ? Math.sin(w.time * 4 + it.x * 0.1) * 2 : 0;
    g.spr(itemSprite(it.kind, Math.floor(w.time * 5)), it.x - 10, it.y - 10 + bob, { alpha: it.ghost ? 0.3 : 1 });
  }

  // wrogowie
  for (const e of rt.enemies) drawEnemy(g, e, w);
  // boss
  if (rt.boss) {
    const b = rt.boss; const S = BOSS_SIZE[b.id];
    const mode = b.hurt > 0 && Math.floor(w.time * 20) % 2 === 0 ? 1 : (b.st === 'stuck' || b.st === 'landed' || b.st === 'exposed' ? 2 : 0);
    if (!(b.dead && Math.floor(w.time * 18) % 2 === 0)) g.spr(bossSprite(b.id, Math.floor(b.f * 5), mode), b.b.x + b.b.w / 2 - S.w / 2, b.b.y + b.b.h - S.h, { flip: b.dir < 0, alpha: b.dead ? Math.max(0.2, b.deadT / 2.4) : 1 });
    if (b.st === 'windup' || b.st === 'aim') { g.rect(b.b.x - 4, b.b.y - 22, b.b.w + 8, 5, '#ff4a3a', 0.6 + 0.4 * Math.sin(w.time * 30)); }
  }

  // gracze
  const solo = !w.session.coop;
  if (solo) { const p = w.players[0]; const other = p.brother === 'M' ? 'D' : 'M'; const tr = p.trail[Math.max(0, p.trail.length - 28)]; if (tr && !p.dead) g.spr(heroSprite(other, 'idle', false, false), tr.x - HERO_W * HERO_SCALE / 2, tr.y - HERO_H * HERO_SCALE, { w: HERO_W * HERO_SCALE, h: HERO_H * HERO_SCALE, alpha: 0.55, flip: p.face < 0 }); const cmp = tr ? tr : null; if (cmp) g.spr(companionSprite(Math.floor(w.time * 8)), cmp.x - 8, cmp.y - 100 + Math.sin(w.time * 5) * 3); }
  for (const p of w.players) drawPlayer(g, p, w);

  // pociski, wiązki
  for (const pr of w.projs) {
    switch (pr.kind) {
      case 'spark': g.spr(sparkSprite(Math.floor(w.time * 20)), pr.x - 7, pr.y - 7); break;
      case 'pulse': g.spr(pulseSprite(), pr.x - 6, pr.y - 6); break;
      case 'needle': g.rect(pr.x - 2, pr.y - 2, 5, 5, '#f4f0d0'); g.rect(pr.x - 1, pr.y - 1, 3, 3, '#fff'); break;
      case 'rock': case 'scrap': g.spr(rockSprite(), pr.x - 9, pr.y - 9, { rot: w.time * 4 }); break;
      case 'wave': g.rect(pr.x - pr.r, pr.y - 12, pr.r * 2, 26, '#e8c070', 0.85); g.rect(pr.x - pr.r + 2, pr.y - 8, pr.r * 2 - 4, 8, '#fff3c0', 0.8); break;
      case 'gust': for (let i = 0; i < 6; i++) g.rect(pr.x + pr.vx * 0.02 * i * 3, pr.y - 30 + i * 9, 26, 2, '#dfe8f0', 0.5); break;
      default: g.spr(bubbleSprite(), pr.x - 5, pr.y - 5);
    }
  }
  for (const b of w.beams) {
    const x0 = b.dir > 0 ? b.x : b.x - b.len;
    if (b.warn) { if (Math.floor(w.time * 16) % 2 === 0) g.rect(x0, b.y - 1, b.len, 2, '#ff6a8a', 0.8); }
    else { const col = b.owner === -2 ? '#7fd6ff' : '#c8a0ff'; g.rect(x0, b.y - 7, b.len, 14, col, 0.35); g.rect(x0, b.y - 3, b.len, 6, '#fff', 0.85); }
  }
  for (const m of rt.decor) if (m.k === 'mirror' && m.state === 1) g.rect(m.x - 2, m.y - 60, 4, 4, '#fff', 0.8 + 0.2 * Math.sin(w.time * 10));
  for (const pt of w.parts) g.rect(pt.x, pt.y, pt.size, pt.size, pt.color, Math.min(1, pt.life / pt.max * 1.5));

  // deszcz
  for (const r of rt.rains) {
    const camMid = g.camX + VW / 2; if (camMid < r.x0 - VW / 2 || camMid > r.x1 + VW / 2) continue;
    ctx.globalAlpha = 0.55; ctx.fillStyle = '#cfe6ff';
    for (let i = 0; i < 70; i++) { const x = (i * 97 + (w.time * 40)) % VW, y = (w.time * 420 + i * 53) % VH; ctx.fillRect(Math.round(x), Math.round(y), 1, 7); }
    ctx.globalAlpha = 1;
  }

  // ciemność
  if (room.dark) drawDarkness(w, g);
  else if (w.opts.night) { ctx.globalAlpha = 0.22; ctx.fillStyle = '#0a1440'; ctx.fillRect(0, 0, VW, VH); ctx.globalAlpha = 1; }
  if (room.world === 4 || hasWater) { ctx.globalAlpha = 0.1; ctx.fillStyle = '#2d80b4'; ctx.fillRect(0, 0, VW, VH); ctx.globalAlpha = 1; }
  if (w.flash > 0) { ctx.globalAlpha = Math.min(0.5, w.flash * 2); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, VW, VH); ctx.globalAlpha = 1; }
  void theme; void LOOK; void tileAt;
}

function drawDarkness(w: World, g: Gfx): void {
  if (!darkCanvas) darkCanvas = makeCanvas(VW, VH);
  const d = darkCanvas.getContext('2d')!;
  d.globalCompositeOperation = 'source-over'; d.clearRect(0, 0, VW, VH);
  d.fillStyle = 'rgba(4,6,20,0.88)'; d.fillRect(0, 0, VW, VH);
  d.globalCompositeOperation = 'destination-out';
  const glow = glowImage();
  const light = (x: number, y: number, r: number, a = 1) => { d.globalAlpha = a; d.drawImage(glow, x - g.camX - r, y - g.camY - r, r * 2, r * 2); d.globalAlpha = 1; };
  for (const p of w.players) if (!p.dead) light(p.mv.body.x + p.mv.body.w / 2, p.mv.body.y + p.mv.body.h / 2, 120);
  for (const l of w.rt.lanterns) if (l.lit) light(l.x, l.y - 14, 150);
  for (const l of w.rt.lamps) light(l.x, l.y - 34, 120);
  for (const c of w.rt.checkpoints) if (c.on) light(c.x, c.y - 40, 90);
  for (const e of w.rt.exits) light(e.x, e.y - 40, 100);
  for (const it of w.rt.items) if (it.kind === 'star' || it.kind === 'golden') light(it.x, it.y, 50, 0.8);
  for (const p of w.projs) if (p.kind === 'spark' || p.kind === 'pulse') light(p.x, p.y, 50, 0.9);
  d.globalCompositeOperation = 'source-over';
  g.ctx.drawImage(darkCanvas, 0, 0);
}

function drawEnemy(g: Gfx, e: Enemy, w: World): void {
  const L = LOOK[e.kind]; const state = ['stun', 'flipped', 'shellOff', 'retract', 'closed', 'land', 'rest'].includes(e.st) || (e.kind === 'rogopnacze' && e.st === 'up') || (e.kind === 'rogoroza' && e.st === 'closed') ? 1 : 0;
  let img = enemySprite(e.kind, Math.floor(e.f * 6), state);
  if (e.hurt > 0 && Math.floor(w.time * 30) % 2 === 0) img = tint(img, '#ffffff', 0.9);
  if (e.stun > 0) img = tint(img, '#7fd6ff', 0.5);
  const x = e.b.x + e.b.w / 2 - lw(img) / 2, y = e.b.y + e.b.h - lh(img) + 3;
  g.spr(img, x, y, { flip: e.dir < 0, alpha: e.dead ? Math.max(0, e.deadT / 0.8) : 1, rot: e.dead ? e.deadT * 6 : 0 });
  if (e.st === 'alert' || e.st === 'flash' || e.st === 'open') g.rect(e.b.x + e.b.w / 2 - 2, y - 12, 4, 8, '#ff4a3a'), g.rect(e.b.x + e.b.w / 2 - 2, y - 2, 4, 3, '#ff4a3a');
  void L;
}

/** skala sprite’a bohatera względem v0.3 (hitbox 26×70 ≈ 1,75 m) */
export const HERO_SCALE = 1.55;

export function heroFrameFor(p: PlayerEnt): HeroFrame {
  const mv = p.mv, b = mv.body;
  if (p.dead || p.hurtT > 0) return 'hurt';
  if (p.atk.phase !== 'none') return 'attack';
  if (mv.hang || mv.ledge) return 'hang';
  if (mv.climbing) return Math.abs(b.vy) < 5 && Math.abs(b.vx) < 5 ? 'climb0' : Math.floor(p.anim * 7) % 2 ? 'climb1' : 'climb0';
  if (mv.swimming) return 'swim';
  if (!b.onGround) return b.vy > 90 ? 'fall' : 'jump';
  if (mv.duck) return 'crouch';
  if (Math.abs(b.vx) > 12) return Math.floor(p.anim * (Math.abs(b.vx) > 120 ? 9 : 6)) % 2 ? 'walk1' : 'walk0';
  return 'idle';
}

function drawPlayer(g: Gfx, p: PlayerEnt, w: World): void {
  if (p.downed || (p.tele && p.tele.t < 0.3)) return;
  const b = p.mv.body; const U = p.upg[p.brother];
  let img = heroSprite(p.brother, heroFrameFor(p), U.shield, w.opts.night);
  if (p.statue > 0 || p.petrify >= 100) img = tint(img, '#9a9aa6', 0.9);
  else if (p.petrify >= 35) img = tint(img, '#9a9aa6', Math.min(0.75, (p.petrify - 20) / 100));
  if (p.tele) img = tint(img, '#fff', 0.8);
  const blink = p.invuln > 0 && !p.tele && Math.floor(w.time * 20) % 2 === 0;
  const HW = HERO_W * HERO_SCALE, HH = HERO_H * HERO_SCALE;
  const x = b.x + b.w / 2 - HW / 2, y = b.y + b.h - HH;
  if (U.star > 0) { g.ctx.globalAlpha = 0.6; g.spr(glowImage(), x - 64 + 16, y - 56 + 24, { w: 160, h: 160, alpha: 0.5 + 0.3 * Math.sin(w.time * 14) }); g.ctx.globalAlpha = 1; }
  if (p.dead) g.spr(img, x, y, { w: HW, h: HH, rot: Math.min(1.6, (1.2 - p.deadT) * 3) * (p.face), alpha: 1 });
  else g.spr(img, x, y, { w: HW, h: HH, flip: p.face < 0, alpha: blink ? 0.35 : 1 });
  if (U.shield && !p.dead) g.spr(shieldSprite(), b.x + b.w / 2 - 34, b.y + b.h / 2 - 44, { w: 68, h: 88, alpha: 0.3 + 0.12 * Math.sin(w.time * 6) });
  if (U.coil && !p.dead) g.rect(b.x + b.w / 2 - 2, b.y - 8, 4, 4, '#7fd6ff');
  if (U.magnet > 0 && !p.dead) g.rect(b.x + b.w / 2 - 14, b.y - 12, 28, 2, '#d6403a', 0.8);
  if (w.session.coop) g.text(p.idx === 0 ? '1P' : '2P', b.x + b.w / 2 - g.camX, b.y - 16 - g.camY, { size: 6, align: 'center', color: p.idx === 0 ? '#ff8a7a' : '#8aff9a' });
}

const DOOR_COL: Record<string, string> = { blue: '#4aa3ff', green: '#5fe08a', yellow: '#ffd23f', red: '#e0443a', purple: '#b070ff', black: '#555a66' };
/** drzwi / terminal przewodowy pełnej wielkości (v0.4: ≥ 90 px wysokości, można w nie wejść) */
function drawDoor(g: Gfx, cx: number, feetY: number, color: string, locked: boolean, time: number): void {
  const col = DOOR_COL[color] ?? '#4aa3ff'; const x = cx - 26, y = feetY - 100;
  g.rect(x - 4, y - 4, 60, 104, '#20232e'); g.rect(x, y, 52, 100, '#343a4a');
  g.rect(x + 6, y + 6, 40, 88, '#10131c');
  const pulse = 0.55 + 0.25 * Math.sin(time * 3);
  g.rect(x + 8, y + 8, 36, 84, col, locked ? 0.18 : pulse * 0.55);
  g.rect(x + 8, y + 8, 4, 84, col, 0.9); g.rect(x + 40, y + 8, 4, 84, col, 0.9);
  g.rect(x + 10, y + 46, 32, 2, '#ffffff', 0.35);
  g.rect(x + 20, y - 10, 12, 6, col, 0.95);
  if (locked) { g.rect(x + 22, y + 40, 8, 8, '#e0443a'); }
}
