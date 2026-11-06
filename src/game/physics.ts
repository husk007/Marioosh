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
export const isSolidTile = (t: number): boolean => t === T.SOLID || t === T.CRACKED || t === T.CABLE || t === T.GATE || t === T.CRUMBLE || t === T.CONVL || t === T.CONVR;

/** Przesuwa ciało z kolizjami osiami X i Y. one-way: tylko z góry. */
export function moveBody(g: Grid, b: Body, dt: number, opt: { dropThrough?: boolean } = {}): void {
  b.hitWall = 0; b.hitCeil = false; b.onGround = false; b.groundTile = 0;
  // ---- oś X
  let nx = b.x + b.vx * dt;
  if (b.vx !== 0) {
    const top = Math.floor((b.y + 0.01) / TILE), bot = Math.floor((b.y + b.h - 0.01) / TILE);
    if (b.vx > 0) {
      const tx = Math.floor((nx + b.w - 0.001) / TILE);
      for (let ty = top; ty <= bot; ty++) if (isSolidTile(tileAt(g, tx, ty))) { nx = tx * TILE - b.w; b.vx = 0; b.hitWall = 1; break; }
    } else {
      const tx = Math.floor(nx / TILE);
      for (let ty = top; ty <= bot; ty++) if (isSolidTile(tileAt(g, tx, ty))) { nx = (tx + 1) * TILE; b.vx = 0; b.hitWall = -1; break; }
    }
  }
  b.x = nx;
  // ---- oś Y
  const prevBottom = b.y + b.h;
  let ny = b.y + b.vy * dt;
  const l = Math.floor((b.x + 0.01) / TILE), r = Math.floor((b.x + b.w - 0.01) / TILE);
  if (b.vy >= 0) {
    const ty = Math.floor((ny + b.h - 0.001) / TILE);
    if (ny + b.h > prevBottom - 0.001 || b.vy === 0) {
      for (let tx = l; tx <= r; tx++) {
        const t = tileAt(g, tx, ty);
        const solid = isSolidTile(t) || (t === T.ONEWAY && !opt.dropThrough && prevBottom <= ty * TILE + 0.5);
        if (solid && ny + b.h > ty * TILE) { ny = ty * TILE - b.h; b.vy = 0; b.onGround = true; b.groundTile = t; break; }
      }
    }
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
