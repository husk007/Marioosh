/**
 * Scenografia w grafice „ilustrowanej” (supersampling ×2, gradienty, światło): kafelki, niebo, warstwy tła, chmury.
 * Wszystko generowane w kodzie i cache'owane; deterministyczne (ziarno z nazwy świata).
 */
import { hiCanvas, shade, mix, type Img } from '../engine/gfx';
import { Rng } from '../engine/rng';
import { WORLDS, type WorldTheme } from '../data/worlds';
import { VH, VW } from '../game/constants';

type G = CanvasRenderingContext2D;
const TAU = Math.PI * 2;
const OUT = 'rgba(20,12,30,0.8)';

/** Dodatkowy margines nad górnym kafelkiem (źdźbła trawy, nity ponad krawędzią). */
export const TOP_PAD = 8;

export interface TileSet { top: Img[]; fill: Img[]; oneway: Img; hazard: Img[]; ladder: Img; crumble: Img; cracked: Img; conv: [Img[], Img[]]; gate: Img; bgBlock: Img; cableBase: Img; }
const tileCache = new Map<number, TileSet>();

function vgrad(g: G, y0: number, y1: number, ...stops: string[]): CanvasGradient {
  const gr = g.createLinearGradient(0, y0, 0, y1); stops.forEach((s, i) => gr.addColorStop(stops.length === 1 ? 0 : i / (stops.length - 1), s)); return gr;
}
/** rysuje element także przesunięty o okres, aby kafelek łączył się bezszwowo */
function wrap32(fn: (dx: number, dy: number) => void, x: number, y: number, r: number, tw = 32, th = 32): void {
  for (const dx of [-tw, 0, tw]) for (const dy of [-th, 0, th]) { if (x + dx + r < 0 || x + dx - r > tw || y + dy + r < 0 || y + dy - r > th) continue; fn(dx, dy); }
}
function stone(g: G, x: number, y: number, rx: number, ry: number, base: string, a = 1): void {
  g.globalAlpha = a;
  const gr = g.createRadialGradient(x - rx * 0.35, y - ry * 0.4, 0.2, x, y, Math.max(rx, ry) * 1.1);
  gr.addColorStop(0, shade(base, 1.28)); gr.addColorStop(0.6, base); gr.addColorStop(1, shade(base, 0.68));
  g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(15,8,20,0.28)'; g.lineWidth = 0.4; g.stroke(); g.globalAlpha = 1;
}

// --------------------------------------------------------------------------- wypełnienie gruntu
function fillTile(g: G, t: WorldTheme, rng: Rng, y0 = 0): void {
  const base = t.ground;
  g.fillStyle = base; g.fillRect(0, y0, 32, 32 - y0);
  const deco = t.deco;
  if (deco === 'scrap' || deco === 'factory' || deco === 'city' || t.id === 0) {
    // płyty z nitami
    const plate = deco === 'factory' ? '#46586a' : deco === 'city' ? '#2b3560' : deco === 'scrap' ? '#7a6a60' : '#6a6876';
    for (let py = 0; py < 32; py += 16) for (let px = 0; px < 32; px += 16) {
      g.fillStyle = vgrad(g, py, py + 16, shade(plate, 1.12), plate, shade(plate, 0.78)); g.fillRect(px + 0.5, py + 0.5, 15, 15);
      g.strokeStyle = 'rgba(10,8,20,0.55)'; g.lineWidth = 0.8; g.strokeRect(px + 0.5, py + 0.5, 15, 15);
      g.fillStyle = 'rgba(255,255,255,0.16)'; g.fillRect(px + 1, py + 1, 14, 0.8);
      for (const [bx, by] of [[3, 3], [13, 3], [3, 13], [13, 13]]) { g.fillStyle = shade(plate, 0.6); g.beginPath(); g.arc(px + bx, py + by, 0.9, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(px + bx - 0.4, py + by - 0.5, 0.5, 0.5); }
      if (rng.chance(0.5)) { g.fillStyle = deco === 'scrap' ? 'rgba(160,80,30,0.35)' : 'rgba(0,0,0,0.18)'; g.beginPath(); g.ellipse(px + rng.int(3, 12), py + rng.int(4, 13), rng.int(2, 5), rng.int(1, 3), 0, 0, TAU); g.fill(); }
    }
    if (deco === 'factory') { g.fillStyle = 'rgba(127,182,177,0.55)'; g.fillRect(1, 15.4, 30, 1.1); g.fillStyle = 'rgba(200,255,250,0.6)'; g.fillRect(1, 15.4, 30, 0.4); }
    if (deco === 'city') { g.fillStyle = 'rgba(255,229,138,0.35)'; for (let i = 0; i < 3; i++) g.fillRect(rng.int(2, 26), rng.int(2, 28), 3, 1.5); }
    return;
  }
  // grunt/skała: warstwy + kamienie
  const cnt = deco === 'mountain' ? 5 : 8;
  if (deco === 'mountain') {
    for (let i = 0; i < 5; i++) { const y = 3 + i * 6 + rng.range(-1, 1); g.fillStyle = i % 2 ? 'rgba(255,240,200,0.16)' : 'rgba(80,50,30,0.16)'; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= 32; x += 4) g.lineTo(x, y + Math.sin((x / 32) * TAU + i) * 1.2); g.lineTo(32, y + 3.5); g.lineTo(0, y + 3.5); g.closePath(); g.fill(); }
  }
  for (let i = 0; i < cnt; i++) {
    const x = rng.range(1, 31), y = rng.range(Math.max(2, y0 + 2), 30), rx = rng.range(1.6, 4.2), ry = rng.range(1.2, 3);
    const col = shade(base, rng.chance(0.5) ? 1.22 : 0.78);
    wrap32((dx, dy) => stone(g, x + dx, y + dy, rx, ry, col, 0.85), x, y, 5);
  }
  for (let i = 0; i < 26; i++) { g.fillStyle = rng.chance(0.5) ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.14)'; g.fillRect(rng.range(0, 31), rng.range(y0, 31), 0.8, 0.8); }
  if (deco === 'forest' || deco === 'jungle') {        // korzenie
    g.strokeStyle = 'rgba(40,24,12,0.28)'; g.lineWidth = 0.8; g.lineCap = 'round';
    for (let i = 0; i < 1; i++) { const x = rng.range(4, 28), y = rng.range(Math.max(6, y0 + 4), 26); wrap32((dx, dy) => { g.beginPath(); g.moveTo(x + dx, y + dy - 6); g.bezierCurveTo(x + dx + 4, y + dy - 2, x + dx - 4, y + dy + 2, x + dx + 1, y + dy + 7); g.stroke(); }, x, y, 9); }
  }
  if (deco === 'ocean') { g.strokeStyle = 'rgba(210,245,255,0.35)'; g.lineWidth = 0.7; for (let i = 0; i < 2; i++) { const x = rng.range(6, 26), y = rng.range(8, 26); g.beginPath(); g.arc(x, y, 2.5, 0, 4.7); g.arc(x, y, 1.1, 0, 4.7); g.stroke(); } }
  if (deco === 'horns') { g.strokeStyle = 'rgba(219,66,105,0.75)'; g.lineWidth = 0.9; g.shadowColor = '#ff4a7a'; g.shadowBlur = 3; for (let i = 0; i < 2; i++) { const x = rng.range(4, 28), y = rng.range(Math.max(4, y0 + 2), 22); g.beginPath(); g.moveTo(x, y); g.lineTo(x + rng.range(-5, 5), y + 4); g.lineTo(x + rng.range(-4, 4), y + 9); g.stroke(); } g.shadowBlur = 0; }
  if (deco === 'mountain') { g.strokeStyle = 'rgba(60,35,20,0.4)'; g.lineWidth = 0.7; const x = rng.range(6, 26), y = rng.range(Math.max(4, y0 + 2), 20); g.beginPath(); g.moveTo(x, y); g.lineTo(x + 3, y + 5); g.lineTo(x - 1, y + 9); g.stroke(); }
}

/** nakładka „czapy” gruntu u góry kafelka (y0 = górna krawędź powierzchni w kanwie z marginesem) */
function cap(g: G, t: WorldTheme, rng: Rng, v: number, y0: number): void {
  const top = t.groundTop, deco = t.deco;
  if (deco === 'forest' || deco === 'jungle' || deco === 'ocean' || deco === 'mountain') {
    const depth = deco === 'mountain' ? 6 : 9;
    const wave = (x: number) => Math.sin((x / 32) * TAU * 2 + v * 1.7) * 1.1 + Math.sin((x / 32) * TAU * 3 + v) * 0.8;
    g.beginPath(); g.moveTo(0, y0); g.lineTo(32, y0);
    for (let x = 32; x >= 0; x -= 2) g.lineTo(x, y0 + depth + wave(x) + (x % 8 < 4 ? 1.5 : 0));
    g.closePath();
    g.fillStyle = vgrad(g, y0, y0 + depth + 3, shade(top, 1.28), top, shade(top, 0.72)); g.fill();
    g.strokeStyle = 'rgba(20,12,30,0.35)'; g.lineWidth = 0.7; g.beginPath(); for (let x = 0; x <= 32; x += 2) g.lineTo(x, y0 + depth + wave(x) + (x % 8 < 4 ? 1.5 : 0)); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.4)'; g.fillRect(0, y0, 32, 0.9);
    if (deco === 'forest' || deco === 'jungle') {           // źdźbła trawy ponad krawędzią
      for (let i = 0; i < 12; i++) {
        const x = (i * 32) / 12 + rng.range(-1, 1), h = rng.range(2.5, TOP_PAD - 1.5), lean = rng.range(-1.6, 1.6);
        const bl = (dx: number) => { g.fillStyle = vgrad(g, y0 - h, y0 + 1, shade(top, 1.35), top); g.beginPath(); g.moveTo(x + dx - 1.3, y0 + 1); g.quadraticCurveTo(x + dx + lean * 0.4, y0 - h * 0.5, x + dx + lean, y0 - h); g.quadraticCurveTo(x + dx + 0.2, y0 - h * 0.45, x + dx + 1.3, y0 + 1); g.closePath(); g.fill(); };
        bl(0); if (x < 2) bl(32); if (x > 30) bl(-32);
      }
      if (v === 1) { const fx = 10 + v * 3; for (const [dx, col] of [[0, t.accent], [9, '#fff']] as [number, string][]) { g.fillStyle = '#3a6a30'; g.fillRect(fx + dx - 0.2, y0 - 3.5, 0.5, 4); g.fillStyle = col; g.beginPath(); g.arc(fx + dx, y0 - 4, 1.2, 0, TAU); g.fill(); g.fillStyle = '#ffe27a'; g.beginPath(); g.arc(fx + dx, y0 - 4, 0.45, 0, TAU); g.fill(); } }
    }
    if (deco === 'ocean') { g.fillStyle = 'rgba(255,255,255,0.5)'; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(rng.range(2, 30), y0 + rng.range(1, 6), rng.range(0.5, 1.1), 0, TAU); g.fill(); } if (v === 2) { g.strokeStyle = '#ff8aa0'; g.lineWidth = 1; g.lineCap = 'round'; g.beginPath(); g.moveTo(22, y0); g.lineTo(22, y0 - 4); g.moveTo(22, y0 - 2); g.lineTo(24.5, y0 - 5); g.moveTo(22, y0 - 2.5); g.lineTo(19.5, y0 - 5); g.stroke(); } }
    if (deco === 'mountain') { g.fillStyle = 'rgba(120,80,50,0.35)'; for (let i = 0; i < 3; i++) g.fillRect(rng.range(2, 28), y0 + rng.range(2, 5), rng.range(2, 5), 0.8); }
    return;
  }
  // płyty metalowe/betonowe
  const plateH = 8;
  g.fillStyle = vgrad(g, y0, y0 + plateH, shade(top, 1.3), top, shade(top, 0.68)); g.beginPath(); g.roundRect(0, y0, 32, plateH, [0, 0, 2, 2]); g.fill();
  g.strokeStyle = 'rgba(12,8,20,0.6)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(0, y0 + plateH); g.lineTo(32, y0 + plateH); g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.45)'; g.fillRect(0, y0, 32, 0.9);
  for (const bx of [4, 28]) { g.fillStyle = shade(top, 0.55); g.beginPath(); g.arc(bx, y0 + 4.2, 1.1, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(bx - 0.5, y0 + 3.4, 0.7, 0.6); }
  if (deco === 'scrap' || t.id === 0) {                      // pasy ostrzegawcze
    if (v !== 1) { g.save(); g.beginPath(); g.rect(9, y0 + 2, 14, 4); g.clip(); for (let x = 6; x < 28; x += 6) { g.fillStyle = '#f2cf2e'; g.beginPath(); g.moveTo(x, y0 + 6.5); g.lineTo(x + 3, y0 + 6.5); g.lineTo(x + 6, y0 + 1.5); g.lineTo(x + 3, y0 + 1.5); g.fill(); } g.restore(); }
  }
  if (deco === 'factory') { g.fillStyle = '#7fe8df'; g.shadowColor = '#7fe8df'; g.shadowBlur = 3; g.fillRect(8, y0 + 3.4, 16, 1.2); g.shadowBlur = 0; }
  if (deco === 'city') { g.fillStyle = '#ffe58a'; g.shadowColor = '#ffe58a'; g.shadowBlur = 3; g.fillRect(2, y0 + 0.2, 28, 0.9); g.shadowBlur = 0; }
  if (deco === 'horns') { g.fillStyle = '#ff5a86'; g.shadowColor = '#ff2a60'; g.shadowBlur = 3; g.fillRect(0, y0 + 0.1, 32, 0.9); g.shadowBlur = 0; }
}

function makeTop(t: WorldTheme, rng: Rng, v: number): Img {
  const { c, g } = hiCanvas(32, 32 + TOP_PAD);
  g.translate(0, TOP_PAD);
  fillTile(g, t, rng, 6);
  cap(g, t, rng, v, 0);
  // przycieniowanie pod czapą (ambient occlusion)
  g.fillStyle = vgrad(g, 8, 18, 'rgba(0,0,0,0.30)', 'rgba(0,0,0,0)'); g.fillRect(0, 8, 32, 10);
  return c;
}

export function tileset(world: number): TileSet {
  const hit = tileCache.get(world); if (hit) return hit;
  const t = WORLDS[world] ?? WORLDS[1]; const rng = new Rng('tiles2:' + world);
  const top: Img[] = [], fill: Img[] = [];
  for (let v = 0; v < 3; v++) {
    const f = hiCanvas(32, 32); fillTile(f.g, t, rng); fill.push(f.c);
    top.push(makeTop(t, rng, v));
  }
  const wood = t.deco === 'forest' || t.deco === 'jungle' || t.deco === 'ocean' || t.deco === 'mountain';
  // platforma jednokierunkowa
  const ow = hiCanvas(32, 32);
  { const g = ow.g; const col = wood ? '#a67c4a' : shade(t.groundTop, 1.05);
    g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(0, 9, 32, 3);
    g.fillStyle = vgrad(g, 0, 9, shade(col, 1.35), col, shade(col, 0.62)); g.beginPath(); g.roundRect(0, 0.5, 32, 8.5, 2); g.fill();
    g.strokeStyle = OUT; g.lineWidth = 0.8; g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.4)'; g.fillRect(1, 1, 30, 0.9);
    for (let x = 4; x < 32; x += 8) { g.fillStyle = wood ? '#5a3c1e' : shade(col, 0.5); g.beginPath(); g.arc(x, 5, 0.9, 0, TAU); g.fill(); }
    g.fillStyle = shade(col, 0.55); for (const x of [3, 27]) g.fillRect(x, 9, 2, 3); }
  // zagrożenia
  const hz: Img[] = [];
  for (let f = 0; f < 2; f++) {
    const h = hiCanvas(32, 32); const g = h.g;
    const electric = t.deco === 'factory' || t.deco === 'city' || t.id === 0;
    g.fillStyle = vgrad(g, 26, 32, '#5a5468', '#2a2636'); g.fillRect(0, 26, 32, 6);
    g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(0, 26, 32, 0.8);
    if (electric) {
      g.lineCap = 'round'; g.lineJoin = 'round';
      for (let i = 0; i < 3; i++) {
        const x = 5 + i * 10 + (f ? 1.5 : 0);
        g.shadowColor = '#7fd6ff'; g.shadowBlur = 5; g.strokeStyle = '#7fd6ff'; g.lineWidth = 2.2;
        g.beginPath(); g.moveTo(x, 26); g.lineTo(x + 4, 20); g.lineTo(x - 2, 15); g.lineTo(x + 3, 9 - f * 2); g.stroke();
        g.shadowBlur = 0; g.strokeStyle = '#fff'; g.lineWidth = 0.9; g.stroke();
      }
    } else {
      for (let i = 0; i < 4; i++) {
        const x0 = i * 8; const gr = g.createLinearGradient(x0, 0, x0 + 8, 0); gr.addColorStop(0, '#f4f6fa'); gr.addColorStop(0.5, '#b4bcc8'); gr.addColorStop(1, '#5c6474');
        g.fillStyle = gr; g.beginPath(); g.moveTo(x0 + 0.5, 27); g.lineTo(x0 + 4, 10); g.lineTo(x0 + 7.5, 27); g.closePath(); g.fill();
        g.strokeStyle = OUT; g.lineWidth = 0.7; g.stroke();
      }
    }
    hz.push(h.c);
  }
  // drabina
  const ld = hiCanvas(32, 32);
  { const g = ld.g; const rail = (x: number) => { const gr = g.createLinearGradient(x, 0, x + 3, 0); gr.addColorStop(0, '#d9ad6e'); gr.addColorStop(1, '#8a6232'); g.fillStyle = gr; g.fillRect(x, 0, 3, 32); g.strokeStyle = OUT; g.lineWidth = 0.6; g.strokeRect(x, -1, 3, 34); };
    rail(6); rail(23);
    for (let y = 4; y < 32; y += 8) { g.fillStyle = vgrad(g, y, y + 3, '#e3bd80', '#8a6232'); g.fillRect(8.5, y, 15, 2.6); g.strokeStyle = OUT; g.lineWidth = 0.5; g.strokeRect(8.5, y, 15, 2.6); } }
  // kruszejąca płyta
  const cr = hiCanvas(32, 32);
  { const g = cr.g; const col = shade(t.groundTop, 0.9);
    g.fillStyle = vgrad(g, 0, 12, shade(col, 1.2), col, shade(col, 0.6)); g.beginPath(); g.roundRect(0, 0, 32, 12, [0, 0, 3, 3]); g.fill();
    g.strokeStyle = OUT; g.lineWidth = 0.9; g.stroke();
    g.strokeStyle = 'rgba(0,0,0,0.55)'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(6, 0); g.lineTo(10, 5); g.lineTo(7, 12); g.moveTo(20, 0); g.lineTo(17, 6); g.lineTo(23, 12); g.moveTo(27, 3); g.lineTo(30, 8); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(1, 1, 30, 0.8); }
  // pęknięty mur
  const ck = hiCanvas(32, 32);
  { const g = ck.g; fillTile(g, t, new Rng('ck' + world)); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 0, 32, 32);
    g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = '#0c0814'; g.lineWidth = 2.4;
    const crack = () => { g.beginPath(); g.moveTo(6, 0); g.lineTo(14, 16); g.lineTo(8, 32); g.moveTo(14, 16); g.lineTo(26, 12); g.lineTo(30, 20); g.moveTo(26, 12); g.lineTo(22, 2); };
    crack(); g.stroke(); g.strokeStyle = t.accent; g.shadowColor = t.accent; g.shadowBlur = 3; g.lineWidth = 0.8; crack(); g.stroke(); g.shadowBlur = 0;
    g.strokeStyle = OUT; g.lineWidth = 0.9; g.strokeRect(0.5, 0.5, 31, 31); }
  // taśmociągi
  const conv: [Img[], Img[]] = [[], []];
  for (let d = 0; d < 2; d++) for (let f = 0; f < 2; f++) {
    const p = hiCanvas(32, 32); const g = p.g;
    g.fillStyle = vgrad(g, 3, 16, '#8f95a4', '#5a5a68', '#3a3a48'); g.beginPath(); g.roundRect(0, 4, 32, 12, 3); g.fill(); g.strokeStyle = OUT; g.lineWidth = 0.9; g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(2, 4.6, 28, 0.8);
    g.save(); g.beginPath(); g.rect(1, 6, 30, 8); g.clip();
    for (let x = -8; x < 40; x += 8) { const xx = x + (f ? 4 : 0); g.fillStyle = '#ffd23f'; g.beginPath(); if (d === 0) { g.moveTo(xx + 6, 7.5); g.lineTo(xx + 1, 10); g.lineTo(xx + 6, 12.5); g.lineTo(xx + 4.5, 10); } else { g.moveTo(xx, 7.5); g.lineTo(xx + 5, 10); g.lineTo(xx, 12.5); g.lineTo(xx + 1.5, 10); } g.closePath(); g.fill(); }
    g.restore();
    for (const x of [4, 28]) { const gr = g.createRadialGradient(x - 1, 20, 0.5, x, 21, 6); gr.addColorStop(0, '#7a7a8c'); gr.addColorStop(1, '#2a2638'); g.fillStyle = gr; g.beginPath(); g.arc(x, 21, 5.4, 0, TAU); g.fill(); g.strokeStyle = OUT; g.lineWidth = 0.8; g.stroke(); g.fillStyle = '#c9ced6'; g.beginPath(); g.arc(x, 21, 1.6, 0, TAU); g.fill(); }
    conv[d].push(p.c);
  }
  // brama
  const gt = hiCanvas(32, 32);
  { const g = gt.g; const gr = g.createLinearGradient(2, 0, 30, 0); gr.addColorStop(0, '#6a647a'); gr.addColorStop(0.5, '#4a4458'); gr.addColorStop(1, '#2e2a3a'); g.fillStyle = gr; g.fillRect(2, 0, 28, 32);
    for (let y = 0; y < 32; y += 6) { g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(2, y, 28, 1.6); g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(2, y + 1.6, 28, 0.6); }
    g.fillStyle = '#ff8c58'; g.shadowColor = '#ff8c58'; g.shadowBlur = 4; g.fillRect(14, 0, 4, 32); g.shadowBlur = 0; g.fillStyle = '#ffd0a0'; g.fillRect(15.3, 0, 1.4, 32);
    g.strokeStyle = OUT; g.lineWidth = 0.9; g.strokeRect(2.5, -1, 27, 34); }
  const bg = hiCanvas(32, 32); { bg.g.fillStyle = shade(t.ground, 0.55); bg.g.fillRect(0, 0, 32, 32); bg.g.fillStyle = 'rgba(0,0,0,0.2)'; bg.g.fillRect(0, 0, 32, 1.5); }
  const cb = hiCanvas(32, 32); { fillTile(cb.g, t, new Rng('cb' + world)); cb.g.fillStyle = 'rgba(0,0,0,0.12)'; cb.g.fillRect(0, 0, 32, 32); }
  const set: TileSet = { top, fill, oneway: ow.c, hazard: hz, ladder: ld.c, crumble: cr.c, cracked: ck.c, conv, gate: gt.c, bgBlock: bg.c, cableBase: cb.c };
  tileCache.set(world, set); return set;
}

// --------------------------------------------------------------------------- niebo, chmury, paralaksa
const cache = new Map<string, Img>();
function memo(key: string, make: () => Img): Img { let v = cache.get(key); if (!v) { v = make(); cache.set(key, v); } return v; }

function glowDot(g: G, x: number, y: number, r: number, col: string, a = 1): void {
  const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.globalAlpha = a; g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.globalAlpha = 1;
}
function cloud(g: G, x: number, y: number, s: number, col = '#ffffff', a = 0.8): void {
  g.globalAlpha = a;
  const blobs: [number, number, number][] = [[0, 0, 15], [14, -5, 13], [28, 0, 14], [-12, 4, 10], [40, 4, 10], [14, 6, 14]];
  for (const [bx, by, br] of blobs) { const gr = g.createRadialGradient(x + bx * s, y + (by - 4) * s, 1, x + bx * s, y + by * s, br * s); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x + bx * s, y + by * s, br * s, 0, TAU); g.fill(); }
  g.globalAlpha = 1;
}

export function skyImage(world: number, dark: boolean): Img {
  return memo(`sky2:${world}:${dark ? 1 : 0}`, () => {
    const t = WORLDS[world] ?? WORLDS[1]; const rng = new Rng('sky:' + world);
    const { c, g } = hiCanvas(VW, VH);
    g.fillStyle = vgrad(g, 0, VH, t.sky, mix(t.sky, t.sky2, 0.6), t.sky2); g.fillRect(0, 0, VW, VH);
    switch (t.deco) {
      case 'forest': case 'jungle': case 'mountain': case 'scrap': case 'factory': {
        const sx = t.deco === 'mountain' ? 470 : 130; glowDot(g, sx, 70, 220, 'rgba(255,248,210,0.85)'); glowDot(g, sx, 70, 60, 'rgba(255,255,240,1)');
        g.fillStyle = '#fffbe8'; g.beginPath(); g.arc(sx, 70, 15, 0, TAU); g.fill();
        if (t.deco === 'factory' || t.deco === 'scrap') { g.fillStyle = 'rgba(70,60,50,0.18)'; g.fillRect(0, 0, VW, VH); }
        break;
      }
      case 'ocean': {
        for (let i = 0; i < 6; i++) { const x = 60 + i * 110 + rng.range(-20, 20); g.save(); g.globalAlpha = 0.13; const gr = g.createLinearGradient(x, 0, x + 80, VH); gr.addColorStop(0, '#fff'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 40, 0); g.lineTo(x + 130, VH); g.lineTo(x + 40, VH); g.closePath(); g.fill(); g.restore(); }
        break;
      }
      case 'city': {
        for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(255,255,230,${rng.range(0.25, 0.9)})`; const s = rng.chance(0.15) ? 1.3 : 0.7; g.beginPath(); g.arc(rng.range(0, VW), rng.range(0, 190), s, 0, TAU); g.fill(); }
        glowDot(g, 520, 70, 120, 'rgba(255,238,170,0.6)'); g.fillStyle = '#fff6d0'; g.beginPath(); g.arc(520, 70, 18, 0, TAU); g.fill(); g.fillStyle = 'rgba(41,52,94,0.55)'; g.beginPath(); g.arc(527, 66, 16, 0, TAU); g.fill();
        break;
      }
      case 'horns': {
        glowDot(g, 330, 120, 280, 'rgba(219,66,105,0.55)'); g.fillStyle = '#7a1a30'; g.beginPath(); g.arc(330, 120, 40, 0, TAU); g.fill(); glowDot(g, 330, 120, 46, 'rgba(255,120,150,0.8)');
        for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(255,${rng.int(90, 160)},90,${rng.range(0.2, 0.7)})`; g.beginPath(); g.arc(rng.range(0, VW), rng.range(60, VH - 60), rng.range(0.5, 1.4), 0, TAU); g.fill(); }
        break;
      }
      default: glowDot(g, 320, 60, 200, 'rgba(255,210,63,0.25)');
    }
    if (['forest', 'jungle', 'mountain'].includes(t.deco)) { g.fillStyle = vgrad(g, 190, 300, 'rgba(255,255,255,0)', 'rgba(255,255,255,0.28)'); g.fillRect(0, 190, VW, 110); }
    return c;
  });
}

/** warstwa chmur o szerokości 640 (kafelkowana poziomo); null, gdy świat nie ma chmur */
export function cloudLayer(world: number): Img | null {
  const t = WORLDS[world] ?? WORLDS[1];
  if (!['forest', 'jungle', 'mountain', 'scrap', 'factory'].includes(t.deco)) return null;
  return memo(`cloud:${world}`, () => {
    const rng = new Rng('cl:' + world); const { c, g } = hiCanvas(VW, 220);
    const smog = t.deco === 'factory' || t.deco === 'scrap';
    for (let i = 0; i < 7; i++) { const x = (i * VW) / 7 + rng.range(-20, 20), y = rng.range(22, 150), s = rng.range(0.9, 1.7); for (const dx of [-VW, 0, VW]) cloud(g, x + dx, y, s, smog ? '#e9e4de' : '#ffffff', smog ? 0.4 : 0.7); }
    return c;
  });
}

// ---------- warstwy paralaksy
function ridge(g: G, y0: number, amp: number, top: string, bot: string, seed: number, extra = 0): void {
  const f = (x: number) => y0 + Math.sin((x / VW) * TAU * 1 + seed) * amp + Math.sin((x / VW) * TAU * 3 + seed * 2.1) * amp * 0.45 + Math.sin((x / VW) * TAU * 7 + seed * 3.3) * amp * 0.18;
  g.beginPath(); g.moveTo(0, VH + 40); for (let x = 0; x <= VW; x += 4) g.lineTo(x, f(x)); g.lineTo(VW, VH + 40); g.closePath();
  g.fillStyle = vgrad(g, y0 - amp - extra, VH + 40, top, bot); g.fill();
}
function orb(g: G, x: number, y: number, r: number, col: string, hi = 1.3, lo = 0.7): void {
  const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r); gr.addColorStop(0, shade(col, hi)); gr.addColorStop(0.65, col); gr.addColorStop(1, shade(col, lo));
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
}

export function parallaxLayer(world: number, layer: 0 | 1 | 2): Img {
  return memo(`bg2:${world}:${layer}`, () => {
    const t = WORLDS[world] ?? WORLDS[1]; const base = new Rng(`bg2:${world}:${layer}`); let rng = base;
    const { c, g } = hiCanvas(VW, VH + 40);
    const haze = [0.62, 0.34, 0.08][layer];
    const tone = (col: string, dk = 1) => mix(shade(col, dk), t.sky2, haze);
    const horizon = [206, 258, 300][layer];
    const sc = [0.8, 1, 1.25][layer];
    const place = (fn: (x: number) => void, step: number, jitter: number) => { for (let x = -step; x < VW + step; x += step) { const xx = x + base.range(0, jitter); const seed = `bg2:${world}:${layer}:${Math.round(x)}`; rng = new Rng(seed); fn(xx); if (xx > VW - 140) { rng = new Rng(seed); fn(xx - VW); } if (xx < 140) { rng = new Rng(seed); fn(xx + VW); } } rng = base; };
    switch (t.deco) {
      case 'forest': case 'jungle': {
        const jungle = t.deco === 'jungle';
        ridge(g, horizon + 20, 14 * sc, tone(t.dominant, 1.05), tone(t.dominant, 0.7), world + layer);
        place((x) => {
          const h = rng.range(60, 120) * sc, w = rng.range(5, 9) * sc;
          const tg = g.createLinearGradient(x, 0, x + w, 0); tg.addColorStop(0, tone('#6b4a2a', 1.1)); tg.addColorStop(1, tone('#3f2a16', 0.8));
          g.fillStyle = tg; g.beginPath(); g.moveTo(x, horizon + 14); g.lineTo(x + w * 0.3, horizon - h); g.lineTo(x + w * 0.7, horizon - h); g.lineTo(x + w, horizon + 14); g.fill();
          const cr = rng.range(22, 34) * sc;
          if (jungle) { for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + (k - 2.5) * 0.55; g.strokeStyle = tone(t.dominant, 0.9 + (k % 2) * 0.25); g.lineWidth = 5 * sc; g.lineCap = 'round'; g.beginPath(); g.moveTo(x + w / 2, horizon - h); g.quadraticCurveTo(x + w / 2 + Math.cos(a) * cr * 0.8, horizon - h + Math.sin(a) * cr * 0.8 - 8, x + w / 2 + Math.cos(a) * cr * 1.5, horizon - h + Math.sin(a) * cr * 1.2 + 14); g.stroke(); } }
          else { orb(g, x + w / 2, horizon - h, cr, tone(t.dominant, 1.1)); orb(g, x + w / 2 - cr * 0.7, horizon - h + cr * 0.4, cr * 0.7, tone(t.dominant, 1.0)); orb(g, x + w / 2 + cr * 0.7, horizon - h + cr * 0.35, cr * 0.75, tone(t.dominant, 0.95)); }
        }, [90, 62, 46][layer], 24);
        g.fillStyle = vgrad(g, horizon + 10, VH, tone(t.dominant, 0.8), tone(t.dominant, 0.55)); g.fillRect(0, horizon + 10, VW, VH + 40);
        break;
      }
      case 'scrap': case 'factory': {
        const fac = t.deco === 'factory';
        place((x) => {
          const w = rng.range(26, 54) * sc, h = rng.range(40, 120) * sc;
          g.fillStyle = vgrad(g, horizon - h, horizon, tone(t.dominant, 1.15), tone(t.dominant, 0.7)); g.fillRect(x, horizon - h, w, h + 4);
          g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(x + w * 0.6, horizon - h, w * 0.4, h + 4);
          if (rng.chance(0.55)) { const cw = rng.range(6, 10) * sc; g.fillStyle = tone(t.dominant, 0.8); g.fillRect(x + w * 0.2, horizon - h - 26 * sc, cw, 26 * sc); g.fillStyle = tone('#f2cf2e', 0.9); g.fillRect(x + w * 0.2, horizon - h - 26 * sc, cw, 3); for (let k = 0; k < 3; k++) { g.fillStyle = `rgba(230,230,235,${0.32 - k * 0.08})`; g.beginPath(); g.arc(x + w * 0.2 + cw / 2 + k * 6, horizon - h - 34 * sc - k * 14, 8 + k * 5, 0, TAU); g.fill(); } }
          if (fac && rng.chance(0.5)) { g.strokeStyle = tone(t.secondary, 1.1); g.lineWidth = 2; g.beginPath(); g.arc(x + w / 2, horizon - h * 0.55, 11 * sc, 0, TAU); g.stroke(); for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU; g.beginPath(); g.moveTo(x + w / 2 + Math.cos(a) * 11 * sc, horizon - h * 0.55 + Math.sin(a) * 11 * sc); g.lineTo(x + w / 2 + Math.cos(a) * 15 * sc, horizon - h * 0.55 + Math.sin(a) * 15 * sc); g.stroke(); } }
          for (let wy = horizon - h + 8; wy < horizon - 8; wy += 12) for (let wx = x + 5; wx < x + w - 6; wx += 9) if (rng.chance(0.45)) { g.fillStyle = tone(t.accent, 1.0); g.globalAlpha = 0.55; g.fillRect(wx, wy, 4, 5); g.globalAlpha = 1; }
        }, [70, 52, 42][layer], 20);
        g.fillStyle = vgrad(g, horizon, VH, tone(t.dominant, 0.8), tone(t.dominant, 0.5)); g.fillRect(0, horizon, VW, VH + 40);
        break;
      }
      case 'ocean': {
        ridge(g, horizon + 14, 10 * sc, tone(t.dominant, 1.1), tone(t.dominant, 0.6), world + layer);
        place((x) => {
          const h = rng.range(50, 130) * sc;
          if (layer === 0) { g.fillStyle = vgrad(g, horizon - h, horizon, tone(t.secondary, 1.1), tone(t.dominant, 0.9)); g.beginPath(); g.moveTo(x, horizon + 10); g.quadraticCurveTo(x + 6, horizon - h * 0.5, x + 18, horizon - h); g.quadraticCurveTo(x + 24, horizon - h * 0.4, x + 40, horizon + 10); g.fill(); }
          else { g.strokeStyle = tone('#2fa56a', layer === 1 ? 1.0 : 0.85); g.lineWidth = 3.4 * sc; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, horizon + 14); for (let k = 1; k <= 6; k++) g.lineTo(x + Math.sin(k * 1.1 + x) * 7 * sc, horizon + 14 - (h * k) / 6); g.stroke(); }
        }, [60, 44, 34][layer], 18);
        if (layer < 2) for (let i = 0; i < 14; i++) { g.fillStyle = tone('#ffffff', 1); g.globalAlpha = 0.25; g.beginPath(); g.arc(rng.range(0, VW), rng.range(40, horizon), rng.range(1.5, 4), 0, TAU); g.fill(); g.globalAlpha = 1; }
        g.fillStyle = vgrad(g, horizon + 10, VH, tone(t.dominant, 0.8), tone(t.dominant, 0.45)); g.fillRect(0, horizon + 10, VW, VH + 40);
        break;
      }
      case 'mountain': {
        place((x) => {
          const h = rng.range(60, 140) * sc, w = rng.range(50, 90) * sc;
          const col = tone(t.dominant, 0.95 + rng.range(0, 0.2));
          g.fillStyle = vgrad(g, horizon - h, horizon + 10, shade(col, 1.25), col, shade(col, 0.7));
          g.beginPath(); g.moveTo(x - w, horizon + 12); g.lineTo(x - w * 0.15, horizon - h); g.lineTo(x + w * 0.1, horizon - h + 4); g.lineTo(x + w, horizon + 12); g.closePath(); g.fill();
          g.fillStyle = 'rgba(0,0,0,0.16)'; g.beginPath(); g.moveTo(x + w * 0.1, horizon - h + 4); g.lineTo(x + w, horizon + 12); g.lineTo(x + w * 0.1, horizon + 12); g.closePath(); g.fill();
          g.fillStyle = 'rgba(255,245,225,0.4)'; g.beginPath(); g.moveTo(x - w * 0.15, horizon - h); g.lineTo(x - w * 0.02, horizon - h + 6); g.lineTo(x - w * 0.3, horizon - h + 18); g.closePath(); g.fill();
        }, [110, 80, 60][layer], 30);
        g.fillStyle = vgrad(g, horizon + 8, VH, tone(t.dominant, 0.85), tone(t.dominant, 0.55)); g.fillRect(0, horizon + 8, VW, VH + 40);
        break;
      }
      case 'city': {
        place((x) => {
          const w = rng.range(24, 50) * sc, h = rng.range(50, 150) * sc;
          g.fillStyle = vgrad(g, horizon - h, horizon, tone(t.secondary, 0.8), tone(t.dominant, 0.7)); g.fillRect(x, horizon - h, w, h + 6);
          if (rng.chance(0.4)) { g.fillRect(x + w * 0.45, horizon - h - 22 * sc, 1.5, 22 * sc); g.fillStyle = '#ff5a5a'; g.beginPath(); g.arc(x + w * 0.45 + 0.7, horizon - h - 22 * sc, 1.6, 0, TAU); g.fill(); }
          for (let wy = horizon - h + 6; wy < horizon - 6; wy += 9) for (let wx = x + 4; wx < x + w - 5; wx += 7) if (rng.chance(0.52)) { g.fillStyle = tone(t.accent, 1.0); g.globalAlpha = layer === 2 ? 0.95 : 0.65; g.fillRect(wx, wy, 3.2, 4); g.globalAlpha = 1; }
          if (layer === 2 && rng.chance(0.25)) { g.fillStyle = '#ff6ad0'; g.shadowColor = '#ff6ad0'; g.shadowBlur = 5; g.fillRect(x + 3, horizon - h * 0.5, w - 6, 2); g.shadowBlur = 0; }
        }, [58, 44, 36][layer], 16);
        g.fillStyle = vgrad(g, horizon, VH, tone(t.dominant, 0.7), tone(t.dominant, 0.4)); g.fillRect(0, horizon, VW, VH + 40);
        break;
      }
      case 'horns': {
        place((x) => {
          const h = rng.range(60, 170) * sc, w = rng.range(10, 22) * sc, lean = rng.range(-14, 14);
          const col = tone(t.dominant, 0.9);
          g.fillStyle = vgrad(g, horizon - h, horizon, shade(col, 1.5), col, shade(col, 0.6));
          g.beginPath(); g.moveTo(x - w, horizon + 10); g.quadraticCurveTo(x - w * 0.4, horizon - h * 0.6, x + lean, horizon - h); g.quadraticCurveTo(x + w * 0.5, horizon - h * 0.5, x + w, horizon + 10); g.closePath(); g.fill();
          g.strokeStyle = tone(t.accent, 1.2); g.globalAlpha = layer === 2 ? 0.8 : 0.45; g.lineWidth = 1.4; g.shadowColor = t.accent; g.shadowBlur = layer === 2 ? 5 : 0; g.beginPath(); g.moveTo(x - w * 0.5, horizon); g.quadraticCurveTo(x - w * 0.15, horizon - h * 0.55, x + lean, horizon - h); g.stroke(); g.shadowBlur = 0; g.globalAlpha = 1;
        }, [76, 54, 42][layer], 28);
        g.fillStyle = vgrad(g, horizon, VH, tone(t.dominant, 0.7), tone('#0c0610', 1)); g.fillRect(0, horizon, VW, VH + 40);
        break;
      }
      default: {     // Prądowo: wieże i linie energetyczne
        ridge(g, horizon + 14, 8 * sc, tone(t.dominant, 1.1), tone(t.dominant, 0.6), layer);
        place((x) => {
          const h = rng.range(70, 130) * sc; g.strokeStyle = tone('#2a2836', 1); g.lineWidth = 2 * sc;
          g.beginPath(); g.moveTo(x - 10 * sc, horizon + 6); g.lineTo(x, horizon - h); g.lineTo(x + 10 * sc, horizon + 6); g.moveTo(x - 7 * sc, horizon - h * 0.4); g.lineTo(x + 7 * sc, horizon - h * 0.4); g.moveTo(x - 12 * sc, horizon - h * 0.8); g.lineTo(x + 12 * sc, horizon - h * 0.8); g.stroke();
          g.strokeStyle = tone(t.secondary, 1); g.lineWidth = 1; g.beginPath(); g.moveTo(x + 12 * sc, horizon - h * 0.8); g.quadraticCurveTo(x + 40 * sc, horizon - h * 0.8 + 14, x + 68 * sc, horizon - h * 0.8); g.stroke();
        }, [130, 100, 80][layer], 20);
        g.fillStyle = vgrad(g, horizon, VH, tone(t.dominant, 0.7), tone(t.dominant, 0.45)); g.fillRect(0, horizon, VW, VH + 40);
      }
    }
    return c;
  });
}

export function glowTexture(): Img {
  return memo('glow2', () => { const { c, g } = hiCanvas(160, 160); const gr = g.createRadialGradient(80, 80, 2, 80, 80, 80); gr.addColorStop(0, 'rgba(255,240,170,0.95)'); gr.addColorStop(0.35, 'rgba(255,235,150,0.45)'); gr.addColorStop(1, 'rgba(255,240,170,0)'); g.fillStyle = gr; g.fillRect(0, 0, 160, 160); return c; });
}
