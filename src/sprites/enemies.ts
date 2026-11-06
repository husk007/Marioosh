/** Wrogowie (19 gatunków z rogami) w grafice „ilustrowanej”. Zwróceni w prawo; kanwa = (w+6)×(h+6). */
import { hiCanvas, shade, type Img } from '../engine/gfx';
import type { EnemyKind } from '../game/types';

type G = CanvasRenderingContext2D;
const TAU = Math.PI * 2;
const OUTC = 'rgba(22,14,32,0.88)';

export interface EnemyLook { body: string; belly: string; horn: string; w: number; h: number; arch: 'quad' | 'beetle' | 'fly' | 'swim' | 'plant' | 'snail' | 'rock' | 'hop'; }
export const LOOK: Record<EnemyKind, EnemyLook> = {
  rogus:       { body: '#9a6b3f', belly: '#d9b98a', horn: '#f4ecd0', w: 26, h: 22, arch: 'quad' },
  baranitor:   { body: '#d8d2c4', belly: '#f2efe6', horn: '#8a7b5a', w: 32, h: 28, arch: 'quad' },
  bykobieg:    { body: '#7a3a34', belly: '#c47a5a', horn: '#f0e6c8', w: 40, h: 30, arch: 'quad' },
  zukorog:     { body: '#2e6f5b', belly: '#9ad0b0', horn: '#f4ecd0', w: 28, h: 20, arch: 'beetle' },
  cmorog:      { body: '#a58bc6', belly: '#e6dcf2', horn: '#f4ecd0', w: 28, h: 20, arch: 'fly' },
  pszczolrog:  { body: '#f0c43a', belly: '#4a3a1a', horn: '#fff6d0', w: 24, h: 18, arch: 'fly' },
  rogowrobel:  { body: '#8a6a52', belly: '#d8c0a0', horn: '#fff6d0', w: 22, h: 18, arch: 'fly' },
  krukorog:    { body: '#2a2a3a', belly: '#4a4a6a', horn: '#d8d0c0', w: 34, h: 28, arch: 'fly' },
  gekorog:     { body: '#4aa05a', belly: '#b6e0a0', horn: '#f4ecd0', w: 28, h: 18, arch: 'quad' },
  bazalisk:    { body: '#6b8f3a', belly: '#c8d890', horn: '#f0e6c8', w: 38, h: 26, arch: 'quad' },
  rogopletw:   { body: '#3a8ac2', belly: '#bfe6f6', horn: '#f4ecd0', w: 30, h: 20, arch: 'swim' },
  osmiorog:    { body: '#b8506a', belly: '#e8a0b0', horn: '#f4ecd0', w: 34, h: 30, arch: 'swim' },
  kakturozec:  { body: '#3e8f4a', belly: '#9ad08a', horn: '#f4d0e0', w: 28, h: 34, arch: 'plant' },
  rogopnacze:  { body: '#2f7a3c', belly: '#7fc060', horn: '#f4ecd0', w: 24, h: 40, arch: 'plant' },
  rogoroza:    { body: '#2f7a3c', belly: '#e0507a', horn: '#f4ecd0', w: 28, h: 34, arch: 'plant' },
  slimorog:    { body: '#c8a04a', belly: '#e8d090', horn: '#f4ecd0', w: 28, h: 22, arch: 'snail' },
  rogoskoczek: { body: '#7a9a3a', belly: '#d8e090', horn: '#f4ecd0', w: 22, h: 20, arch: 'hop' },
  kamienirog:  { body: '#7a7a82', belly: '#a0a0aa', horn: '#d8d0c0', w: 38, h: 32, arch: 'rock' },
  dron:        { body: '#8d93a0', belly: '#ffcc40', horn: '#ff6a5a', w: 20, h: 16, arch: 'fly' },
};

function shape(g: G, fill: string | CanvasGradient, path: () => void, lw = 1): void { g.beginPath(); path(); g.fillStyle = fill; g.fill(); g.strokeStyle = OUTC; g.lineWidth = lw; g.lineJoin = 'round'; g.stroke(); }
function blob(g: G, cx: number, cy: number, rx: number, ry: number, col: string, lw = 1): void {
  const gr = g.createRadialGradient(cx - rx * 0.35, cy - ry * 0.5, Math.min(rx, ry) * 0.1, cx, cy, Math.max(rx, ry) * 1.15);
  gr.addColorStop(0, shade(col, 1.38)); gr.addColorStop(0.55, col); gr.addColorStop(1, shade(col, 0.6));
  shape(g, gr, () => { g.ellipse(cx, cy, rx, ry, 0, 0, TAU); }, lw);
}
function horn(g: G, x: number, y: number, tx: number, ty: number, th: number, col: string, bend = 2): void {
  const mx = (x + tx) / 2 + bend, my = (y + ty) / 2;
  const gr = g.createLinearGradient(x, y, tx, ty); gr.addColorStop(0, shade(col, 0.7)); gr.addColorStop(0.6, col); gr.addColorStop(1, shade(col, 1.4));
  shape(g, gr, () => { g.moveTo(x - th, y); g.quadraticCurveTo(mx - th * 0.4, my, tx, ty); g.quadraticCurveTo(mx + th * 0.6, my + 1, x + th, y); g.closePath(); }, 0.9);
}
function eye(g: G, x: number, y: number, r: number, stunned: boolean, angry = true): void {
  if (stunned) { g.strokeStyle = '#2a1f2e'; g.lineWidth = 0.9; g.lineCap = 'round'; g.beginPath(); g.arc(x, y, r * 0.55, 0, 4.6); g.arc(x, y, r * 0.2, 0, 4.6); g.stroke(); return; }
  shape(g, '#fffdf0', () => { g.ellipse(x, y, r, r * 1.05, 0, 0, TAU); }, 0.8);
  g.fillStyle = '#16101e'; g.beginPath(); g.ellipse(x + r * 0.3, y + r * 0.1, r * 0.52, r * 0.7, 0, 0, TAU); g.fill();
  g.fillStyle = '#fff'; g.fillRect(x + r * 0.05, y - r * 0.45, r * 0.32, r * 0.32);
  if (angry) { g.strokeStyle = OUTC; g.lineWidth = 1.2; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - r * 1.1, y - r * 1.45); g.lineTo(x + r * 0.9, y - r * 0.6); g.stroke(); }
}
function leg(g: G, x: number, y: number, w: number, h: number, col: string): void {
  shape(g, shade(col, 0.72), () => { g.roundRect(x, y, w, h, Math.min(w, h) * 0.45); }, 0.9);
}
function spark(g: G, x: number, y: number): void { g.fillStyle = '#ffe14a'; g.beginPath(); for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU - Math.PI / 2, r = i % 2 ? 0.9 : 2.2; g[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath(); g.fill(); }

export function drawEnemy(kind: EnemyKind, f: number, state: number): Img {
  const L = LOOK[kind]; const w = L.w, h = L.h; const { c, g } = hiCanvas(w + 6, h + 6);
  g.translate(3, 3); g.lineCap = 'round'; g.lineJoin = 'round';
  const body = L.body, belly = L.belly, dark = shade(body, 0.7); const st = state === 1; const a = f & 1;
  switch (kind) {
    case 'rogus': case 'bykobieg': case 'baranitor': {
      const big = kind === 'bykobieg', ram = kind === 'baranitor';
      leg(g, 3, h - 7 + (a ? 0 : 1.5), 5, 7, body); leg(g, w - 14, h - 7 + (a ? 1.5 : 0), 5, 7, body);
      if (ram) {      // runo
        for (let i = 0; i < 9; i++) { const ang = (i / 9) * TAU; blob(g, w / 2 - 3 + Math.cos(ang) * (w / 2 - 8), h / 2 + 1 + Math.sin(ang) * (h / 2 - 8), 6, 6, '#f2efe6', 0.8); }
        blob(g, w / 2 - 3, h / 2 + 1, w / 2 - 6, h / 2 - 6, '#e6e0d2', 0.8);
      } else blob(g, w / 2 - 2, h / 2 + 2, w / 2 - 2, h / 2 - 3, body);
      if (!ram) { g.fillStyle = belly; g.globalAlpha = 0.85; g.beginPath(); g.ellipse(w / 2 - 2, h / 2 + 5, w / 3, h / 5, 0, 0, TAU); g.fill(); g.globalAlpha = 1; }
      if (big) { blob(g, w / 2 - 6, 7, 8, 6, shade(body, 1.1)); }
      leg(g, 7, h - 8, 5, 8, shade(body, 0.9)); leg(g, w - 19, h - 8, 5, 8, shade(body, 0.9));
      const hx = w - 8, hy = h / 2 - 3;
      blob(g, hx, hy, ram ? 7 : 8, ram ? 6.4 : 7, ram ? '#4a3a32' : body);
      if (ram) { shape(g, '#a08a5a', () => { g.arc(hx - 5, hy - 2, 5, Math.PI * 0.2, Math.PI * 1.6); g.arc(hx - 5, hy - 2, 2.6, Math.PI * 1.6, Math.PI * 0.2, true); }, 0.9); }
      else if (st) { horn(g, hx - 5, hy - 5, hx - 9, hy + 1, 2, L.horn, -2); horn(g, hx + 2, hy - 5, hx + 6, hy + 1, 2, L.horn, 2); }
      else { horn(g, hx - 4, hy - 5, hx - 6, hy - (big ? 15 : 12), 2, L.horn, -2); horn(g, hx + 2, hy - 5, hx + 6, hy - (big ? 15 : 12), 2, L.horn, 2); }
      eye(g, hx - 1, hy - 1, 2.1, st);
      g.fillStyle = shade(body, 0.55); g.beginPath(); g.ellipse(hx + 6.4, hy + 2.4, 2.4, 1.8, 0, 0, TAU); g.fill();
      if (big && !st) { g.fillStyle = 'rgba(255,255,255,0.55)'; g.beginPath(); g.arc(w - 1, hy + 1, 1.6 + a, 0, TAU); g.fill(); }
      if (st) { spark(g, hx - 6, hy - 11); spark(g, hx + 3, hy - 12); }
      break;
    }
    case 'gekorog': case 'bazalisk': case 'rogoskoczek': {
      const hop = kind === 'rogoskoczek', bas = kind === 'bazalisk';
      if (hop) { shape(g, shade(body, 0.8), () => { g.ellipse(4, h - 4, 5, 3.6, 0, 0, TAU); g.ellipse(w - 8, h - 4, 5, 3.6, 0, 0, TAU); }, 0.9); }
      else { leg(g, 4, h - 6 + (a ? 0 : 1.5), 4, 6, body); leg(g, w - 12, h - 6 + (a ? 1.5 : 0), 4, 6, body); }
      if (!hop) { g.strokeStyle = OUTC; g.lineWidth = 3.4; g.beginPath(); g.moveTo(5, h - 7); g.quadraticCurveTo(-3, h - 8, 0, h - 14); g.stroke(); g.strokeStyle = body; g.lineWidth = 2.2; g.stroke(); }
      blob(g, w / 2 - 2, h / 2 + 1, w / 2 - 3, h / 2 - 3, body); g.fillStyle = belly; g.globalAlpha = 0.85; g.beginPath(); g.ellipse(w / 2 - 2, h / 2 + 4, w / 3, h / 5, 0, 0, TAU); g.fill(); g.globalAlpha = 1;
      if (bas) { for (let i = 0; i < 6; i++) { const x = 6 + i * 4.6; shape(g, '#d8a838', () => { g.moveTo(x, 5); g.lineTo(x + 2.4, 0); g.lineTo(x + 4.4, 5); g.closePath(); }, 0.8); } }
      leg(g, 8, h - 6, 4, 6, shade(body, 0.9)); leg(g, w - 17, h - 6, 4, 6, shade(body, 0.9));
      const hx = w - 8, hy = h / 2 - 3; blob(g, hx, hy, 7, 6, body);
      if (st) { horn(g, hx - 4, hy - 4, hx - 8, hy + 1, 1.8, L.horn, -2); horn(g, hx + 2, hy - 4, hx + 6, hy + 1, 1.8, L.horn, 2); }
      else { horn(g, hx - 3, hy - 4, hx - 5, hy - 10, 1.8, L.horn, -2); horn(g, hx + 2, hy - 4, hx + 5, hy - 10, 1.8, L.horn, 2); }
      if (!bas) { eye(g, hx - 3, hy - 3, 2.4, st); eye(g, hx + 2.6, hy - 3, 2.1, st, false); } else { g.shadowColor = '#ffe14a'; g.shadowBlur = 4; eye(g, hx, hy - 1, 2.3, st); g.shadowBlur = 0; }
      if (st) { spark(g, hx - 5, hy - 11); }
      break;
    }
    case 'zukorog': {
      if (st) {      // przewrócony na grzbiet
        blob(g, w / 2, h / 2 + 2, w / 2 - 1, h / 2 - 3, belly); blob(g, w / 2, h / 2 + 3, w / 3, h / 4, '#fff', 0.6);
        const t = a ? 3 : -3; g.strokeStyle = dark; g.lineWidth = 1.8; g.beginPath(); g.moveTo(4, h - 4); g.lineTo(1, h - 9 + t); g.moveTo(w - 5, h - 4); g.lineTo(w - 1, h - 9 - t); g.moveTo(w / 2, h - 3); g.lineTo(w / 2 - 2, h - 9 + t); g.stroke();
        horn(g, w - 7, h / 2 + 2, w + 1, h / 2 - 6, 2.2, L.horn, 2); spark(g, w / 2, 2); break;
      }
      g.strokeStyle = dark; g.lineWidth = 1.8; g.beginPath(); g.moveTo(5, h - 2); g.lineTo(3, h + (a ? 2 : 0)); g.moveTo(w - 9, h - 2); g.lineTo(w - 7, h + (a ? 0 : 2)); g.moveTo(w / 2 - 2, h - 2); g.lineTo(w / 2 - 4, h + 1); g.stroke();
      shape(g, (() => { const gr = g.createRadialGradient(w / 2 - 8, 6, 1, w / 2 - 2, h / 2 + 2, w / 2); gr.addColorStop(0, '#86e8c4'); gr.addColorStop(0.5, body); gr.addColorStop(1, shade(body, 0.55)); return gr; })(), () => { g.ellipse(w / 2 - 2, h / 2 + 2, w / 2 - 2, h / 2 - 2, 0, 0, TAU); }, 1);
      g.strokeStyle = 'rgba(8,40,30,0.55)'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(w / 2 - 3, 4); g.lineTo(w / 2 - 3, h - 2); g.stroke(); g.fillStyle = 'rgba(255,255,255,0.45)'; g.beginPath(); g.ellipse(w / 2 - 9, 6, 4, 1.6, -0.4, 0, TAU); g.fill();
      blob(g, w - 6, h / 2, 5.4, 6, shade(body, 0.85)); horn(g, w - 6, h / 2 - 5, w - 1, h / 2 - 14, 2.4, L.horn, 3); eye(g, w - 8, h / 2 - 2, 2, false);
      break;
    }
    case 'cmorog': case 'pszczolrog': case 'rogowrobel': case 'krukorog': case 'dron': {
      const wing = a ? -6 : 4; const cx = w / 2, cy = h / 2 + 2;
      if (kind === 'dron') {
        g.fillStyle = 'rgba(210,225,240,0.5)'; g.beginPath(); g.ellipse(cx, 3, 12, 1.6 + a, 0, 0, TAU); g.fill();
        shape(g, '#5a6270', () => { g.roundRect(cx - 1, 3, 2, 5, 0.8); }, 0.7);
        shape(g, (() => { const gr = g.createLinearGradient(0, 4, 0, h - 2); gr.addColorStop(0, '#d0d6e0'); gr.addColorStop(0.5, '#8d93a0'); gr.addColorStop(1, '#4a5260'); return gr; })(), () => { g.roundRect(2, 5, w - 4, h - 8, 7); }, 1);
        g.fillStyle = '#ffcc40'; g.fillRect(5, h - 7, w - 10, 1.4);
        g.shadowColor = '#ff3a3a'; g.shadowBlur = 5; g.fillStyle = '#ff4a3a'; g.beginPath(); g.arc(w - 6, h / 2 + 1, 3.2, 0, TAU); g.fill(); g.shadowBlur = 0; g.fillStyle = '#ffd0c0'; g.beginPath(); g.arc(w - 5.4, h / 2 + 0.4, 1.1, 0, TAU); g.fill();
        horn(g, 7, 6, 4, -2, 1.6, L.horn, -2); horn(g, w - 9, 6, w - 6, -2, 1.6, L.horn, 2); break;
      }
      const wc = kind === 'cmorog' ? '#efe6fa' : kind === 'pszczolrog' ? 'rgba(220,240,255,0.8)' : shade(body, 0.8);
      const wingShape = (dx: number, sgn: number) => { shape(g, wc, () => { g.moveTo(cx + dx, 6); g.quadraticCurveTo(cx + dx + sgn * 10, wing - 3, cx + dx + sgn * (kind === 'cmorog' ? 14 : 11), wing + 5); g.quadraticCurveTo(cx + dx + sgn * 4, 8, cx + dx + sgn * 1, 9); g.closePath(); }, 0.9); };
      wingShape(-3, -1);
      if (kind === 'krukorog') { g.strokeStyle = OUTC; g.lineWidth = 4; g.beginPath(); g.moveTo(5, cy); g.lineTo(-1, cy + 6); g.stroke(); g.strokeStyle = shade(body, 0.8); g.lineWidth = 2.6; g.stroke(); }
      blob(g, cx, cy, w / 2 - 4, h / 2 - 5, body);
      if (kind === 'pszczolrog') { g.save(); g.beginPath(); g.ellipse(cx, cy, w / 2 - 4, h / 2 - 5, 0, 0, TAU); g.clip(); g.fillStyle = '#2a1f10'; g.fillRect(cx - 8, 0, 3.2, h); g.fillRect(cx - 1, 0, 3.2, h); g.restore(); g.fillStyle = '#2a1f10'; g.beginPath(); g.moveTo(4, cy); g.lineTo(-1, cy + 1); g.lineTo(4, cy + 2); g.fill(); }
      g.fillStyle = belly; g.globalAlpha = 0.55; g.beginPath(); g.ellipse(cx, cy + 3, w / 3 - 1, h / 5, 0, 0, TAU); g.fill(); g.globalAlpha = 1;
      wingShape(2, 1);
      if (kind === 'cmorog') { g.fillStyle = 'rgba(120,80,170,0.55)'; g.beginPath(); g.arc(cx + 9, wing + 4, 2, 0, TAU); g.arc(cx - 9, wing + 4, 2, 0, TAU); g.fill(); }
      const hx = w - 7; blob(g, hx, cy - 1, 5.4, 5.2, body);
      if (kind === 'krukorog' || kind === 'rogowrobel') shape(g, '#f0c040', () => { g.moveTo(hx + 4, cy - 2); g.lineTo(hx + 9.6, cy + 0.6); g.lineTo(hx + 4, cy + 2.4); g.closePath(); }, 0.8);
      horn(g, hx - 3, cy - 5, hx - 4, cy - 12, 1.7, L.horn, -2); horn(g, hx + 1.5, cy - 5, hx + 4, cy - 11, 1.7, L.horn, 2);
      eye(g, hx - 0.6, cy - 1.6, 1.9, false);
      if (kind === 'cmorog') { g.strokeStyle = '#d8c8f0'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(hx + 2, cy - 5); g.quadraticCurveTo(hx + 8, cy - 11, hx + 11, cy - 7); g.stroke(); }
      break;
    }
    case 'rogopletw': {
      const t = a ? 3 : -3;
      shape(g, (() => { const gr = g.createLinearGradient(0, h, 0, 0); gr.addColorStop(0, shade(body, 0.6)); gr.addColorStop(0.5, body); gr.addColorStop(1, shade(body, 1.5)); return gr; })(), () => { g.ellipse(w / 2, h / 2, w / 2 - 2, h / 2 - 3, 0, 0, TAU); }, 1);
      g.fillStyle = belly; g.globalAlpha = 0.9; g.beginPath(); g.ellipse(w / 2 + 1, h / 2 + 4, w / 3, h / 5, 0, 0, TAU); g.fill(); g.globalAlpha = 1;
      shape(g, shade(body, 0.7), () => { g.moveTo(3, h / 2); g.quadraticCurveTo(-3, h / 2 - 8 + t, 1, h / 2 - 8); g.quadraticCurveTo(6, h / 2 - 2, 8, h / 2 - 1); g.closePath(); g.moveTo(3, h / 2); g.quadraticCurveTo(-3, h / 2 + 8 - t, 1, h / 2 + 8); g.quadraticCurveTo(6, h / 2 + 2, 8, h / 2 + 1); g.closePath(); }, 0.9);
      shape(g, shade(body, 0.75), () => { g.moveTo(w / 2 - 4, 3); g.quadraticCurveTo(w / 2, -2, w / 2 + 6, 3); g.closePath(); }, 0.8);
      horn(g, w - 11, 5, w - 8, -2, 2, L.horn, 2); eye(g, w - 9, h / 2 - 3, 2.2, false);
      g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.arc(w + 1, h / 2 - 6 - a * 2, 1, 0, TAU); g.fill();
      break;
    }
    case 'osmiorog': {
      const t = a ? 3 : -3;
      for (let i = 0; i < 6; i++) { const x0 = 7 + i * 3.9; g.strokeStyle = OUTC; g.lineWidth = 3.8; g.beginPath(); g.moveTo(x0, h / 2 + 4); g.quadraticCurveTo(x0 + (i % 2 ? t : -t), h - 8, x0 - 2 + i * 0.8 + (i % 2 ? -t : t), h - 1); g.stroke(); g.strokeStyle = shade(body, 0.85); g.lineWidth = 2.6; g.stroke(); g.strokeStyle = 'rgba(255,200,215,0.7)'; g.lineWidth = 0.7; g.setLineDash([0.1, 2.2]); g.stroke(); g.setLineDash([]); }
      blob(g, w / 2, h / 2 - 3, 11.5, 11.5, body);
      horn(g, w / 2 - 7, 3, w / 2 - 9, -3, 1.8, L.horn, -2); horn(g, w / 2 + 3, 3, w / 2 + 6, -3, 1.8, L.horn, 2);
      eye(g, w / 2 - 5, h / 2 - 5, 2.6, false); eye(g, w / 2 + 3.5, h / 2 - 5, 2.6, false, false);
      g.strokeStyle = '#7a2a40'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(w / 2 - 3, h / 2 + 2); g.quadraticCurveTo(w / 2, h / 2 + 4, w / 2 + 3, h / 2 + 2); g.stroke();
      break;
    }
    case 'kakturozec': {
      const sway = a ? 1 : -1;
      shape(g, (() => { const gr = g.createLinearGradient(2, 0, w - 2, 0); gr.addColorStop(0, shade(body, 0.6)); gr.addColorStop(0.45, shade(body, 1.35)); gr.addColorStop(1, shade(body, 0.7)); return gr; })(), () => { g.roundRect(5, 4, w - 10, h - 4, 10); }, 1);
      shape(g, shade(body, 1.0), () => { g.roundRect(0.5, h / 2 - 3 + sway, 8, 5, 2.5); g.roundRect(0.5, h / 2 - 11 + sway, 5, 10, 2.5); }, 0.9);
      shape(g, shade(body, 1.0), () => { g.roundRect(w - 8.5, h / 2 - 1 - sway, 8, 5, 2.5); g.roundRect(w - 5.5, h / 2 - 9 - sway, 5, 10, 2.5); }, 0.9);
      if (!st) { g.fillStyle = '#f4f0d0'; for (let i = 0; i < 11; i++) { const x = 8 + (i % 3) * 6, y = 8 + Math.floor(i / 3) * 6.4; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 0.9, y - 3); g.lineTo(x + 1.8, y); g.fill(); } }
      shape(g, '#e8507a', () => { for (let k = 0; k < 6; k++) { const aa = (k / 6) * TAU; g.moveTo(w / 2 + Math.cos(aa) * 2.6 + 2.2, 3 + Math.sin(aa) * 2.6); g.arc(w / 2 + Math.cos(aa) * 2.6, 3 + Math.sin(aa) * 2.6, 2.2, 0, TAU); } }, 0.6);
      g.fillStyle = '#ffe27a'; g.beginPath(); g.arc(w / 2, 3, 1.8, 0, TAU); g.fill();
      horn(g, w / 2 - 6, 6, w / 2 - 9, -1, 1.5, L.horn, -2); horn(g, w / 2 + 4, 6, w / 2 + 7, -1, 1.5, L.horn, 2);
      eye(g, w / 2 - 2, h / 2 - 1, 2.6, st);
      break;
    }
    case 'rogopnacze': {
      const sway = a ? 1 : -1; const ext = st ? 4 : 0;
      for (let i = 0; i < 6; i++) blob(g, w / 2 + (i % 2 ? sway : -sway), h - 4 - i * 6 - ext, 4.4, 4.2, i % 2 ? body : shade(body, 1.15), 0.8);
      shape(g, shade(body, 0.7), () => { g.ellipse(w / 2, h - 3, 9, 4, 0, 0, TAU); }, 0.9);
      for (const sgn of [-1, 1]) shape(g, '#3fa04e', () => { g.moveTo(w / 2, h - 12); g.quadraticCurveTo(w / 2 + sgn * 10, h - 20, w / 2 + sgn * 11, h - 12); g.quadraticCurveTo(w / 2 + sgn * 6, h - 10, w / 2, h - 12); }, 0.8);
      const hy = 6 + (st ? 6 : 0); blob(g, w / 2, hy, 6.4, 6.4, shade(body, 1.2));
      horn(g, w / 2 - 5, hy - 4, w / 2 - 6, hy - 10, 1.6, L.horn, -2); horn(g, w / 2 + 2, hy - 4, w / 2 + 5, hy - 10, 1.6, L.horn, 2); eye(g, w / 2 - 1.5, hy - 0.5, 2.2, false);
      break;
    }
    case 'rogoroza': {
      shape(g, lg(g, w / 2 - 1.5, w / 2 + 2, '#1f5a2a', '#46a85a'), () => { g.roundRect(w / 2 - 2, h - 15, 4, 15, 1.5); }, 0.9);
      shape(g, '#3fa04e', () => { g.moveTo(w / 2, h - 9); g.quadraticCurveTo(w / 2 - 12, h - 20, 2, h - 14); g.quadraticCurveTo(w / 2 - 8, h - 8, w / 2, h - 9); }, 0.8);
      if (st) { shape(g, shade(belly, 0.7), () => { g.ellipse(w / 2, 13, 8, 10, 0, 0, TAU); }, 1); for (let i = 0; i < 4; i++) horn(g, 7 + i * 4.6, 6, 7 + i * 4.6, 0, 1.3, L.horn, 0); }
      else {
        for (let i = 0; i < 8; i++) { const aa = (i / 8) * TAU; blob(g, w / 2 + Math.cos(aa) * 8, 12 + Math.sin(aa) * 8, 4.6, 4.6, belly, 0.8); }
        blob(g, w / 2, 12, 5.6, 5.6, '#ffd05a', 0.8); eye(g, w / 2 - 0.5, 11, 2.3, false);
        horn(g, w / 2 - 4, 6, w / 2 - 6, -1, 1.4, L.horn, -1); horn(g, w / 2 + 3, 6, w / 2 + 5, -1, 1.4, L.horn, 1);
      }
      break;
    }
    case 'slimorog': {
      shape(g, (() => { const gr = g.createLinearGradient(0, h - 12, 0, h); gr.addColorStop(0, belly); gr.addColorStop(1, shade(belly, 0.7)); return gr; })(), () => { g.ellipse(w / 2 - 3, h - 6, w / 2 - 2, 5.6, 0, 0, TAU); g.ellipse(w - 5, h - 9, 4.6, 6, 0, 0, TAU); }, 1);
      blob(g, 11, 10, 10, 10, body); g.strokeStyle = shade(body, 0.55); g.lineWidth = 1.2; g.beginPath(); g.arc(11, 10, 6.4, 0.4, 5.4); g.arc(11, 10, 3.2, 0.4, 5.4); g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.ellipse(7, 5.6, 3, 1.4, -0.5, 0, TAU); g.fill();
      if (!st) { for (const dx of [-3, 2]) { g.strokeStyle = OUTC; g.lineWidth = 3; g.beginPath(); g.moveTo(w - 6 + dx, h - 14); g.lineTo(w - 4 + dx * 1.6, h - 21); g.stroke(); g.strokeStyle = L.horn; g.lineWidth = 1.7; g.stroke(); } }
      eye(g, w - 6, h - 12, 2.1, st);
      break;
    }
    case 'kamienirog': {
      leg(g, 4, h - 7, 9, 7, body); leg(g, w - 14, h - 7 + (a ? 0 : 1), 9, 7, body);
      shape(g, (() => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, shade(st ? belly : body, 1.5)); gr.addColorStop(0.5, st ? belly : body); gr.addColorStop(1, shade(body, 0.55)); return gr; })(), () => { g.moveTo(2, h - 6); g.lineTo(5, 7); g.lineTo(13, 1.5); g.lineTo(w - 9, 2); g.lineTo(w - 2, h - 9); g.lineTo(w - 4, h - 5); g.closePath(); }, 1.1);
      if (!st) { g.strokeStyle = 'rgba(30,30,42,0.7)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(10, 6); g.lineTo(14, 16); g.lineTo(11, 22); g.moveTo(22, 5); g.lineTo(20, 18); g.stroke(); g.fillStyle = 'rgba(255,255,255,0.3)'; g.beginPath(); g.moveTo(6, 10); g.lineTo(14, 3); g.lineTo(14, 7); g.closePath(); g.fill(); g.fillStyle = '#6ea84a'; g.globalAlpha = 0.6; g.beginPath(); g.ellipse(17, 3.4, 6, 1.6, 0, 0, TAU); g.fill(); g.globalAlpha = 1; }
      blob(g, w - 8, h / 2, 7.4, 7, belly); horn(g, w - 12, h / 2 - 5, w - 13, h / 2 - 14, 2.2, L.horn, -2); horn(g, w - 5, h / 2 - 5, w - 2, h / 2 - 14, 2.2, L.horn, 2); eye(g, w - 10, h / 2 - 2, 2.3, st);
      break;
    }
  }
  return c;
}
function lg(g: G, x0: number, x1: number, a: string, b: string): CanvasGradient { const gr = g.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(0, a); gr.addColorStop(1, b); return gr; }
