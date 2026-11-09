import { T } from './types';
import { TILE } from './constants';

/** Dostęp do siatki kafelków (może to być kopia z modyfikacjami w czasie gry). */
export interface Grid { w: number; h: number; tiles: Uint8Array; }

export interface Body {
  x: number; y: number; w: number; h: number; vx: number; vy: number;
  onGround: boolean; hitWall: number; hitCeil: boolean; groundTile: number;
  ridingId: number;
}

export const newBody = (x: number, y: number, w: number, h: number): Body => ({ x, y, w, h, vx: 0, vy: 0, onGround: false, hitWall: 0, hitCeil: false, groundTile: 0, ridingId: -1 });

export const tileAt = (g: Grid, tx: number, ty: number): number => {
  if (tx < 0 || tx >= g.w) return T.SOLID;       // krańce poziomu są ścianami
  if (ty < 0) return T.EMPTY;
  if (ty >= g.h) return T.EMPTY;                 // pod poziomem — przepaść
  return g.tiles[ty * g.w + tx];
};
export const isSolidTile = (t: number): boolean => t === T.SOLID || t === T.CRACKED || t === T.CABLE || t === T.GATE || t === T.CRUMBLE || t === T.CONVL || t === T.CONVR || t === T.ICE || t === T.OIL || t === T.SAND || t === T.PLATFORM_BREAK;

// ---------------------------------------------------------------- stoki (kafle z profilem wysokości)
export const isSlope = (t: number): boolean => t >= T.SL_R45 && t <= T.SL_L26B;
/** wysokość powierzchni stoku nad dolną krawędzią kafla (0..32) w kolumnie lx (0..32 px od lewej krawędzi) */
export function slopeH(t: number, lx: number): number {
  switch (t) {
    case T.SL_R45: return lx;
    case T.SL_L45: return TILE - lx;
    case T.SL_R26A: return lx / 2;
    case T.SL_R26B: return TILE / 2 + lx / 2;
    case T.SL_L26A: return TILE - lx / 2;
    case T.SL_L26B: return TILE / 2 - lx / 2;
    default: return -1;
  }
}
/** kąt stoku w radianach (dodatni = wznosi się w prawo, oś Y w dół) */
export function slopeAngle(t: number): number {
  switch (t) {
    case T.SL_R45: return Math.PI / 4;
    case T.SL_L45: return -Math.PI / 4;
    case T.SL_R26A: case T.SL_R26B: return Math.atan(0.5);
    case T.SL_L26A: case T.SL_L26B: return -Math.atan(0.5);
    default: return 0;
  }
}
export interface Floor { y: number; tile: number; angle: number }
/**
 * Powierzchnia, na której można stanąć w kolumnie x: pierwsza (od góry) w przedziale [yRef-up, yRef+down].
 * `oneWay`: czy kafle jednokierunkowe się liczą (tylko gdy stopy są nad nimi).
 */
export function floorAt(g: Grid, x: number, yRef: number, up: number, down: number, oneWay = true): Floor | null {
  const tx = Math.floor(x / TILE); const lx = x - tx * TILE;
  const r0 = Math.floor((yRef - up) / TILE), r1 = Math.floor((yRef + down) / TILE);
  for (let ty = r0; ty <= r1; ty++) {
    const t = tileAt(g, tx, ty); if (t === T.EMPTY) continue;
    if (isSlope(t)) { const sy = ty * TILE + TILE - slopeH(t, lx); if (sy >= yRef - up - 0.001 && sy <= yRef + down + 0.001) return { y: sy, tile: t, angle: slopeAngle(t) }; continue; }
    const sy = ty * TILE;
    if (sy < yRef - up - 0.001 || sy > yRef + down + 0.001) continue;
    if (isSolidTile(t)) return { y: sy, tile: t, angle: 0 };
    if (t === T.ONEWAY && oneWay && sy >= yRef - 0.5) return { y: sy, tile: t, angle: 0 };
    // szczyt drabiny to powierzchnia, na której można stanąć (v0.4)
    if (t === T.LADDER && oneWay && tileAt(g, tx, ty - 1) !== T.LADDER && sy >= yRef - 0.5) return { y: sy, tile: T.ONEWAY, angle: 0 };
  }
  return null;
}

/**
 * Przesuwa ciało z kolizjami osiami X i Y (wrogowie, bossowie, przedmioty). Obsługuje stoki: ciało idące po podłożu
 * „przykleja się” do powierzchni (w górę i w dół stoku), a w powietrzu ląduje na powierzchni pochyłej.
 * one-way: tylko z góry.
 */
export function moveBody(g: Grid, b: Body, dt: number, opt: { dropThrough?: boolean; step?: number } = {}): void {
  const wasGround = b.onGround;
  b.hitWall = 0; b.hitCeil = false; b.onGround = false; b.groundTile = 0;
  const adx = Math.abs(b.vx * dt);
  const stepUp = (wasGround ? (opt.step ?? 4) : 1) + adx * 1.15;     // tyle „schodka” (lub stoku) pokonujemy bez zatrzymania
  // ---- oś X
  let nx = b.x + b.vx * dt;
  if (b.vx !== 0) {
    const top = Math.floor((b.y + 0.01) / TILE), bot = Math.floor((b.y + b.h - 0.01) / TILE);
    const feet = b.y + b.h;
    if (b.vx > 0) {
      const tx = Math.floor((nx + b.w - 0.001) / TILE);
      for (let ty = top; ty <= bot; ty++) if (isSolidTile(tileAt(g, tx, ty)) && !(ty * TILE >= feet - stepUp)) { nx = tx * TILE - b.w; b.vx = 0; b.hitWall = 1; break; }
    } else {
      const tx = Math.floor(nx / TILE);
      for (let ty = top; ty <= bot; ty++) if (isSolidTile(tileAt(g, tx, ty)) && !(ty * TILE >= feet - stepUp)) { nx = (tx + 1) * TILE; b.vx = 0; b.hitWall = -1; break; }
    }
  }
  b.x = nx;
  // ---- oś Y
  const prevBottom = b.y + b.h;
  let ny = b.y + b.vy * dt;
  const l = Math.floor((b.x + 0.01) / TILE), r = Math.floor((b.x + b.w - 0.01) / TILE);
  if (b.vy >= 0) {
    const nb = ny + b.h;
    const up = stepUp, down = Math.max(0, nb - prevBottom) + (wasGround ? 3 + adx * 1.15 : 0);
    // stopa: najwyższa powierzchnia spośród trzech próbek (lewa, środek, prawa)
    let best: Floor | null = null;
    for (const sx of [b.x + 1, b.x + b.w / 2, b.x + b.w - 1]) {
      const f = floorAt(g, sx, prevBottom, up, down, !opt.dropThrough && true);
      if (f && (f.tile !== T.ONEWAY || prevBottom <= f.y + 0.5) && (!best || f.y < best.y)) best = f;
    }
    if (best && (nb >= best.y - 0.001 || wasGround)) { ny = best.y - b.h; if (b.vy > 0 || wasGround) b.vy = 0; b.onGround = true; b.groundTile = best.tile; }
  } else {
    const ty = Math.floor(ny / TILE);
    for (let tx = l; tx <= r; tx++) if (isSolidTile(tileAt(g, tx, ty))) { ny = (ty + 1) * TILE; b.vy = 0; b.hitCeil = true; break; }
  }
  b.y = ny;
}

/** Czy prostokąt dotyka kafelka danego typu? */
export function touchesTile(g: Grid, x: number, y: number, w: number, h: number, type: number): boolean {
  const l = Math.floor(x / TILE), r = Math.floor((x + w - 0.01) / TILE), t = Math.floor(y / TILE), bt = Math.floor((y + h - 0.01) / TILE);
  for (let ty = t; ty <= bt; ty++) for (let tx = l; tx <= r; tx++) if (tileAt(g, tx, ty) === type) return true;
  return false;
}
/** Czy prostokąt przecina cokolwiek stałego? */
export function hitsSolid(g: Grid, x: number, y: number, w: number, h: number): boolean {
  const l = Math.floor(x / TILE), r = Math.floor((x + w - 0.01) / TILE), t = Math.floor(y / TILE), bt = Math.floor((y + h - 0.01) / TILE);
  for (let ty = t; ty <= bt; ty++) for (let tx = l; tx <= r; tx++) if (isSolidTile(tileAt(g, tx, ty))) return true;
  return false;
}
/** Linia widzenia (kafelkowa) pomiędzy punktami — do promieni i widzenia wrogów. */
export function lineBlocked(g: Grid, x0: number, y0: number, x1: number, y1: number): boolean {
  const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 8);
  for (let i = 1; i < n; i++) { const t = i / n; if (isSolidTile(tileAt(g, Math.floor((x0 + (x1 - x0) * t) / TILE), Math.floor((y0 + (y1 - y0) * t) / TILE)))) return true; }
  return false;
}
