/** Bossowie w grafice „ilustrowanej”: każdy ma własną sylwetkę (wektor, supersampling ×2). Postać zwrócona w prawo. */
import { hiCanvas, shade, type Img } from '../engine/gfx';
import type { BossId } from '../data/worlds';

type G = CanvasRenderingContext2D;
const TAU = Math.PI * 2;
const OUTC = 'rgba(22,14,32,0.88)';
export const BOSS_SIZE: Record<BossId, { w: number; h: number }> = {
  '': { w: 0, h: 0 }, rogomir: { w: 72, h: 64 }, zlomotaur: { w: 80, h: 72 }, kaktogor: { w: 72, h: 80 }, rogopletw: { w: 84, h: 56 },
  ceratopsor: { w: 88, h: 64 }, krukorog: { w: 84, h: 70 }, rogodron: { w: 80, h: 64 }, katoblepas: { w: 90, h: 72 },
};

function lin(g: G, x0: number, y0: number, x1: number, y1: number, ...c: string[]): CanvasGradient { const gr = g.createLinearGradient(x0, y0, x1, y1); c.forEach((s, i) => gr.addColorStop(c.length === 1 ? 0 : i / (c.length - 1), s)); return gr; }
function rad(g: G, x: number, y: number, r: number, ...c: string[]): CanvasGradient { const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.4, r * 0.1, x, y, r); c.forEach((s, i) => gr.addColorStop(i / (c.length - 1), s)); return gr; }
function shape(g: G, fill: string | CanvasGradient, path: () => void, lw = 1.3): void { g.beginPath(); path(); g.fillStyle = fill; g.fill(); g.strokeStyle = OUTC; g.lineWidth = lw; g.lineJoin = 'round'; g.stroke(); }
function glow(g: G, x: number, y: number, r: number, col: string, a = 0.7): void { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.globalAlpha = a; g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.globalAlpha = 1; }
/** zakrzywiony róg: od podstawy (x,y) do czubka (tx,ty), z wybrzuszeniem bend */
function horn(g: G, x: number, y: number, tx: number, ty: number, thick: number, col: string, bend = 6): void {
  const mx = (x + tx) / 2 + bend, my = (y + ty) / 2 - Math.abs(bend) * 0.4;
  shape(g, lin(g, x, y, tx, ty, shade(col, 0.7), col, shade(col, 1.45)), () => { g.moveTo(x - thick, y); g.quadraticCurveTo(mx - thick * 0.5, my, tx, ty); g.quadraticCurveTo(mx + thick * 0.6, my + 2, x + thick, y); g.closePath(); }, 1.1);
}
function eye(g: G, x: number, y: number, r: number, iris: string, hurt: boolean, angry = true): void {
  shape(g, hurt ? '#ffdede' : '#fffbe8', () => { g.ellipse(x, y, r, r * 0.9, 0, 0, TAU); }, 0.9);
  g.fillStyle = hurt ? '#c01010' : iris; g.beginPath(); g.ellipse(x + r * 0.25, y + r * 0.05, r * 0.55, r * 0.7, 0, 0, TAU); g.fill();
  g.fillStyle = '#12091a'; g.beginPath(); g.ellipse(x + r * 0.3, y + r * 0.05, r * 0.25, r * 0.4, 0, 0, TAU); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.9)'; g.fillRect(x + r * 0.05, y - r * 0.4, r * 0.28, r * 0.28);
  if (angry) { g.strokeStyle = OUTC; g.lineWidth = 1.6; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - r * 1.2, y - r * 1.5); g.lineTo(x + r * 1.1, y - r * 0.5); g.stroke(); }
}
function leg(g: G, x: number, y: number, w: number, h: number, col: string, swing: number): void {
  shape(g, lin(g, x, 0, x + w, 0, shade(col, 0.7), col, shade(col, 1.2)), () => { g.roundRect(x + swing, y, w, h, 3); }, 1.2);
}

export function drawBoss(id: BossId, f: number, mode: number): Img {
  const { w, h } = BOSS_SIZE[id]; const { c, g } = hiCanvas(w, h);
  const hurt = mode === 1, exposed = mode === 2; const step = f & 1 ? 2.5 : 0;
  g.lineCap = 'round'; g.lineJoin = 'round';
  const tint = (col: string) => (hurt ? shade(col, 1.5) : col);
  switch (id) {
    case 'rogomir': {            // purpurowy buhaj-ogrodnik ze złotymi rogami i kolczykiem w nosie
      const body = tint('#7b5a9a');
      leg(g, 10, h - 17, 11, 17 - step, shade(body, 0.8), 0); leg(g, 30, h - 17, 11, 17, shade(body, 0.8), 0); leg(g, 22, h - 17, 11, 17, body, step); leg(g, 44, h - 17, 11, 17 - step * 0.6, body, 0);
      shape(g, rad(g, 30, 34, 34, shade(body, 1.4), body, shade(body, 0.62)), () => { g.moveTo(6, 38); g.bezierCurveTo(4, 14, 24, 8, 40, 14); g.bezierCurveTo(54, 18, 58, 36, 54, 48); g.lineTo(10, 50); g.closePath(); });
      shape(g, lin(g, 0, 28, 0, 52, '#d9c1ec', '#b08ccc'), () => { g.ellipse(32, 44, 20, 8, 0, 0, TAU); }, 0.9);
      g.fillStyle = 'rgba(30,10,50,0.35)'; for (let i = 0; i < 5; i++) { g.beginPath(); g.ellipse(14 + i * 7, 16 + (i % 2) * 3, 4, 7, 0.2, 0, TAU); g.fill(); }       // grzywa
      shape(g, rad(g, 56, 28, 17, shade(body, 1.35), body, shade(body, 0.65)), () => { g.moveTo(44, 24); g.bezierCurveTo(46, 8, 66, 10, 70, 24); g.bezierCurveTo(72, 34, 66, 42, 56, 42); g.bezierCurveTo(46, 40, 42, 32, 44, 24); });
      horn(g, 48, 14, 40, -2, 3.4, '#f2c940', -5); horn(g, 62, 13, 69, -3, 3.2, '#f2c940', 6);
      shape(g, lin(g, 0, 32, 0, 42, '#e0c6f0', '#a07cc0'), () => { g.ellipse(64, 34, 6, 5, 0, 0, TAU); }, 0.9);
      g.fillStyle = OUTC; g.beginPath(); g.ellipse(66, 33, 1, 1.4, 0, 0, TAU); g.fill();
      g.strokeStyle = '#ffd23f'; g.lineWidth = 1.2; g.beginPath(); g.arc(64, 40, 2.4, 0, TAU); g.stroke();
      eye(g, 56, 24, 3.4, '#ff7a1a', hurt);
      if (exposed) glow(g, 30, 30, 14, 'rgba(255,230,100,0.9)', 0.9);
      break;
    }
    case 'zlomotaur': {          // złomowy minotaur z blach i tłoków
      const body = tint('#8a929e');
      leg(g, 12, h - 18, 13, 18 - step, '#5c6470', 0); leg(g, 54, h - 18, 13, 18, '#5c6470', 0); leg(g, 28, h - 18, 13, 18, '#6c7482', step);
      shape(g, lin(g, 0, 14, 0, 58, shade(body, 1.3), body, shade(body, 0.55)), () => { g.roundRect(6, 16, 62, 44, 10); });
      for (let i = 0; i < 4; i++) { g.strokeStyle = 'rgba(15,10,25,0.5)'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(10 + i * 15, 18); g.lineTo(10 + i * 15, 58); g.stroke(); for (const y of [22, 52]) { g.fillStyle = '#4a4f5a'; g.beginPath(); g.arc(13 + i * 15, y, 1.2, 0, TAU); g.fill(); } }
      g.fillStyle = 'rgba(190,100,40,0.45)'; for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse(14 + i * 9, 30 + (i * 7) % 20, 4, 2.4, 0, 0, TAU); g.fill(); }       // rdza
      // koło zębate na grzbiecie
      g.save(); g.translate(26, 14); g.rotate(f * 0.4); shape(g, '#b87333', () => { for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU, r = i % 2 ? 9 : 12; g[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); }, 1); g.fillStyle = '#3a2a1a'; g.beginPath(); g.arc(0, 0, 3.4, 0, TAU); g.fill(); g.restore();
      shape(g, lin(g, 0, 8, 0, 40, shade(body, 1.35), body, shade(body, 0.6)), () => { g.roundRect(48, 10, 24, 30, 7); });
      horn(g, 54, 12, 46, -2, 4, '#c0c6d0', -6);   // róg z rury
      g.fillStyle = '#d9a040'; g.beginPath(); g.moveTo(66, 12); g.lineTo(70, 3); g.lineTo(72, 14); g.closePath(); g.fill(); g.strokeStyle = OUTC; g.lineWidth = 1; g.stroke();   // złamany róg
      shape(g, '#3a3f4a', () => { g.roundRect(58, 28, 14, 10, 3); }, 1); g.fillStyle = '#e08a3a'; for (let i = 0; i < 3; i++) g.fillRect(60 + i * 4, 31, 2, 4);
      g.shadowColor = '#ff8c28'; g.shadowBlur = 5; eye(g, 60, 20, 3.4, '#ff7a1a', hurt); g.shadowBlur = 0;
      // tłok
      shape(g, '#aab2c0', () => { g.roundRect(2, 34, 6, 12, 2); }, 1); g.fillStyle = '#5a606c'; g.fillRect(3.6, 44 + step * 0.4, 2.8, 8);
      if (exposed) { glow(g, 36, 38, 14, 'rgba(255,160,60,0.95)', 0.9); g.fillStyle = '#fff0b0'; g.beginPath(); g.arc(36, 38, 4, 0, TAU); g.fill(); }
      break;
    }
    case 'kaktogor': {           // kaktusowy golem z różowymi kwiatami i kolcami
      const body = tint('#3e9a52');
      leg(g, 20, h - 14, 14, 14 - step, shade(body, 0.7), 0); leg(g, 40, h - 14, 14, 14, shade(body, 0.7), step);
      shape(g, lin(g, 14, 0, 58, 0, shade(body, 0.6), body, shade(body, 1.4), body, shade(body, 0.6)), () => { g.roundRect(16, 18, 40, 52, 16); });
      for (let i = 0; i < 4; i++) { g.strokeStyle = 'rgba(10,50,25,0.45)'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(26 + i * 6, 22); g.quadraticCurveTo(24 + i * 6, 44, 26 + i * 6, 66); g.stroke(); }
      shape(g, lin(g, 0, 36, 0, 48, shade(body, 1.3), body), () => { g.roundRect(2, 34, 20, 9, 4.5); g.roundRect(2, 20, 9, 22, 4.5); });     // lewa ręka
      shape(g, lin(g, 0, 36, 0, 48, shade(body, 1.3), body), () => { g.roundRect(50, 40, 20, 9, 4.5); g.roundRect(61, 24, 9, 24, 4.5); });
      g.fillStyle = '#f4f0d0'; for (let i = 0; i < 26; i++) { const x = 8 + ((i * 29) % 58), y = 10 + ((i * 17) % 60); if (x > 14 && x < 58 && y > 20) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + 1.2, y - 3.6); g.lineTo(x + 2.4, y); g.fill(); } }
      for (const [x, y] of [[36, 12], [28, 16], [45, 15]]) { g.fillStyle = '#e8508a'; for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU; g.beginPath(); g.arc(x + Math.cos(a) * 3.4, y + Math.sin(a) * 3.4, 2.6, 0, TAU); g.fill(); } g.fillStyle = '#ffe27a'; g.beginPath(); g.arc(x, y, 2.4, 0, TAU); g.fill(); }
      horn(g, 30, 22, 22, 4, 2.4, '#f8c0d8', -4); horn(g, 46, 22, 54, 4, 2.4, '#f8c0d8', 4);
      eye(g, 44, 31, 3.2, '#e83a7a', hurt);
      g.strokeStyle = OUTC; g.lineWidth = 1.2; g.beginPath(); g.moveTo(38, 42); g.quadraticCurveTo(44, 46, 50, 41); g.stroke();
      if (exposed) glow(g, 36, 50, 14, 'rgba(255,230,120,0.9)', 0.9);
      break;
    }
    case 'rogopletw': {          // niebiesko-turkusowy wieloryb z rogiem narwala
      const body = tint('#2f77c0');
      shape(g, lin(g, 0, 40, 0, 6, shade(body, 0.6), body, shade(body, 1.4)), () => { g.moveTo(10, 28); g.bezierCurveTo(14, 8, 52, 4, 68, 22); g.bezierCurveTo(74, 30, 68, 46, 50, 48); g.bezierCurveTo(30, 52, 8, 44, 10, 28); });
      shape(g, '#cfeaff', () => { g.moveTo(24, 40); g.bezierCurveTo(36, 50, 60, 46, 68, 34); g.bezierCurveTo(56, 40, 36, 42, 24, 40); }, 0.8);
      shape(g, lin(g, 0, 20, 0, 46, shade(body, 1.2), shade(body, 0.6)), () => { g.moveTo(10, 28); g.quadraticCurveTo(-2, 10 + step, 2, 6); g.quadraticCurveTo(12, 14, 20, 24); g.closePath(); g.moveTo(10, 30); g.quadraticCurveTo(-2, 46 - step, 4, 52); g.quadraticCurveTo(14, 42, 20, 34); g.closePath(); });   // płetwy ogonowe
      shape(g, shade(body, 0.7), () => { g.moveTo(34, 10); g.quadraticCurveTo(38, -2, 46, 8); g.quadraticCurveTo(42, 12, 34, 10); });
      // róg narwala, spiralny
      const hh = lin(g, 70, 20, 84, 8, '#fff6dc', '#e8d49a'); shape(g, hh, () => { g.moveTo(66, 16); g.lineTo(84, 6); g.lineTo(68, 24); g.closePath(); }, 1);
      g.strokeStyle = 'rgba(140,110,50,0.55)'; g.lineWidth = 0.9; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(68 + i * 4, 21 - i * 3.4); g.lineTo(71 + i * 4, 17 - i * 3.4); g.stroke(); }
      eye(g, 58, 24, 3.2, '#2fe0d0', hurt);
      g.fillStyle = '#fff'; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(52 + i * 3.6, 36); g.lineTo(53.6 + i * 3.6, 40); g.lineTo(55.2 + i * 3.6, 36); g.fill(); }
      g.fillStyle = 'rgba(255,255,255,0.55)'; g.beginPath(); g.arc(8, 12, 1.4, 0, TAU); g.arc(14, 4, 1, 0, TAU); g.fill();
      if (exposed) glow(g, 36, 26, 13, 'rgba(255,240,120,0.95)', 0.9);
      break;
    }
    case 'ceratopsor': {         // pustynny ceratops z kryształową kryzą
      const body = tint('#b09a82');
      leg(g, 12, h - 16, 12, 16 - step, shade(body, 0.7), 0); leg(g, 28, h - 16, 12, 16, shade(body, 0.75), step); leg(g, 50, h - 16, 12, 16 - step * 0.5, shade(body, 0.7), 0);
      shape(g, lin(g, 0, 18, 0, 54, shade(body, 1.3), body, shade(body, 0.6)), () => { g.moveTo(4, 40); g.bezierCurveTo(2, 20, 30, 14, 48, 20); g.bezierCurveTo(60, 24, 62, 44, 54, 50); g.lineTo(10, 52); g.closePath(); });
      g.fillStyle = 'rgba(80,50,30,0.3)'; for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse(10 + i * 8, 28 + (i % 2) * 8, 4, 2.6, 0, 0, TAU); g.fill(); }
      // kryza z kryształami
      shape(g, lin(g, 40, 0, 62, 40, '#7a4aa8', '#b57ae0'), () => { g.moveTo(44, 28); g.quadraticCurveTo(40, 2, 58, 0); g.quadraticCurveTo(70, 8, 66, 30); g.closePath(); }, 1.3);
      for (let i = 0; i < 5; i++) { const a = -2.6 + i * 0.5; const x = 56 + Math.cos(a) * 12, y = 20 + Math.sin(a) * 18; shape(g, '#e2c0ff', () => { g.moveTo(x, y - 4); g.lineTo(x + 3, y); g.lineTo(x, y + 4); g.lineTo(x - 3, y); g.closePath(); }, 0.8); }
      shape(g, rad(g, 68, 36, 14, shade(body, 1.3), body, shade(body, 0.62)), () => { g.moveTo(54, 34); g.bezierCurveTo(56, 22, 78, 24, 84, 38); g.bezierCurveTo(84, 48, 70, 50, 60, 48); g.closePath(); });
      horn(g, 66, 28, 60, 8, 3, '#f3e6c4', -4); horn(g, 76, 30, 84, 12, 3, '#f3e6c4', 4); horn(g, 82, 38, 88, 36, 2.6, '#f3e6c4', 2);
      eye(g, 68, 33, 3, '#a65cdb', hurt);
      if (exposed) glow(g, 36, 34, 13, 'rgba(210,160,255,0.95)', 0.9);
      break;
    }
    case 'krukorog': {           // olbrzymi kruk z rogami, skrzydła w ruchu
      const body = tint('#2e3050'); const up = f & 1 ? -10 : 8;
      shape(g, lin(g, 0, 0, 0, 40, shade(body, 1.6), body, shade(body, 0.55)), () => { g.moveTo(34, 26); g.bezierCurveTo(14, 4 + up, 0, 6 + up, 2, 12 + up); g.bezierCurveTo(14, 18 + up, 20, 34, 30, 40); g.closePath(); });   // dalsze skrzydło
      shape(g, lin(g, 0, 20, 0, 60, shade(body, 1.4), body, shade(body, 0.55)), () => { g.moveTo(14, 34); g.bezierCurveTo(8, 18, 30, 12, 46, 20); g.bezierCurveTo(60, 26, 62, 46, 48, 54); g.bezierCurveTo(36, 60, 18, 56, 14, 34); });
      shape(g, lin(g, 0, 0, 0, 40, shade(body, 1.6), body, shade(body, 0.55)), () => { g.moveTo(40, 28); g.bezierCurveTo(54, 6 + up, 76, 2 + up, 82, 8 + up); g.bezierCurveTo(70, 18 + up, 62, 34, 52, 44); g.closePath(); });
      g.strokeStyle = 'rgba(180,190,255,0.35)'; g.lineWidth = 0.9; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(46 + i * 7, 26 + up * 0.5); g.lineTo(50 + i * 8, 14 + up + i); g.stroke(); }
      shape(g, shade(body, 0.7), () => { g.moveTo(14, 44); g.lineTo(0, 54 + step); g.lineTo(2, 46); g.lineTo(-2, 50 + step); g.lineTo(16, 36); g.closePath(); });   // ogon
      shape(g, rad(g, 54, 36, 11, shade(body, 1.6), body, shade(body, 0.55)), () => { g.arc(54, 36, 11, 0, TAU); });
      shape(g, lin(g, 0, 34, 0, 44, '#ffe58a', '#e0a82a'), () => { g.moveTo(63, 33); g.lineTo(78, 40); g.lineTo(63, 44); g.closePath(); }, 1.1);
      horn(g, 50, 27, 44, 12, 2.6, '#e8e0cc', -3); horn(g, 58, 27, 64, 12, 2.6, '#e8e0cc', 3);
      g.shadowColor = '#ffe58a'; g.shadowBlur = 4; eye(g, 58, 34, 2.9, '#ffe58a', hurt); g.shadowBlur = 0;
      g.fillStyle = '#ffe58a'; g.fillRect(22, 56, 8, 2); g.fillRect(34, 57, 7, 2);
      if (exposed) glow(g, 36, 40, 12, 'rgba(255,240,150,0.95)', 0.9);
      break;
    }
    case 'rogodron': {           // dron z wirnikami i antenami-rogami
      const body = tint('#6a8190');
      const rot = f & 1 ? 1 : -1;
      for (const x of [14, 62]) { g.fillStyle = 'rgba(200,220,240,0.45)'; g.beginPath(); g.ellipse(x, 10, 18, 2.4 + (f & 1), 0, 0, TAU); g.fill(); g.strokeStyle = OUTC; g.lineWidth = 1; g.beginPath(); g.moveTo(x - 18 * rot, 10); g.lineTo(x + 18 * rot, 10); g.stroke(); g.fillStyle = '#4a5560'; g.fillRect(x - 1, 10, 2, 14); }
      shape(g, lin(g, 0, 20, 0, 54, shade(body, 1.4), body, shade(body, 0.55)), () => { g.roundRect(8, 22, 62, 30, 14); });
      g.fillStyle = 'rgba(0,0,0,0.2)'; g.beginPath(); g.roundRect(10, 40, 58, 10, 6); g.fill();
      for (let i = 0; i < 5; i++) { g.fillStyle = '#ff8c58'; g.globalAlpha = 0.5 + 0.5 * (((i + f) & 1)); g.fillRect(14 + i * 8, 46, 5, 2.4); g.globalAlpha = 1; }
      shape(g, '#2a3038', () => { g.roundRect(46, 24, 28, 20, 8); }, 1.2);
      g.shadowColor = '#ff8c58'; g.shadowBlur = 7; g.fillStyle = hurt ? '#ffd0c0' : '#ff7a2a'; g.beginPath(); g.arc(62, 34, 6.4, 0, TAU); g.fill(); g.shadowBlur = 0; g.fillStyle = '#ffd8a8'; g.beginPath(); g.arc(63, 33, 2.4, 0, TAU); g.fill(); g.fillStyle = '#120a14'; g.beginPath(); g.arc(63, 34, 1.2, 0, TAU); g.fill();
      g.strokeStyle = OUTC; g.lineWidth = 1.5; g.beginPath(); g.moveTo(50, 22); g.lineTo(58, 17); g.stroke();
      horn(g, 52, 24, 46, 6, 2.4, '#d9dde4', -3); horn(g, 66, 24, 74, 8, 2.4, '#d9dde4', 4);
      g.fillStyle = '#ffd23f'; g.beginPath(); g.arc(46, 6, 1.5, 0, TAU); g.arc(74, 8, 1.5, 0, TAU); g.fill();
      if (exposed) glow(g, 30, 38, 13, 'rgba(255,180,80,0.95)', 0.9);
      break;
    }
    case 'katoblepas': {         // ostateczny tyran: czarny byk z pękniętymi rogami i purpurowym światłem
      const body = tint('#2d1f3a');
      leg(g, 12, h - 20, 14, 20 - step, '#1d1228', 0); leg(g, 30, h - 20, 14, 20, '#251830', step); leg(g, 54, h - 20, 14, 20 - step, '#1d1228', 0);
      shape(g, lin(g, 0, 12, 0, 56, '#5a4270', body, '#160d20'), () => { g.moveTo(4, 50); g.bezierCurveTo(0, 20, 22, 6, 44, 14); g.bezierCurveTo(60, 20, 66, 40, 58, 54); g.lineTo(8, 56); g.closePath(); });
      g.strokeStyle = 'rgba(219,66,105,0.85)'; g.lineWidth = 1.1; g.shadowColor = '#ff4a7a'; g.shadowBlur = 4; for (let i = 0; i < 4; i++) { const x = 14 + i * 11; g.beginPath(); g.moveTo(x, 24 + (i % 2) * 6); g.lineTo(x + 3, 32 + (i % 2) * 6); g.lineTo(x - 1, 42); g.stroke(); } g.shadowBlur = 0;
      shape(g, rad(g, 68, 34, 17, '#6a5082', body, '#140a1e'), () => { g.moveTo(52, 28); g.bezierCurveTo(54, 10, 78, 12, 86, 28); g.bezierCurveTo(90, 42, 76, 50, 62, 48); g.bezierCurveTo(50, 44, 50, 34, 52, 28); });
      horn(g, 58, 16, 46, -2, 4.4, '#d8cfe0', -8); g.strokeStyle = 'rgba(160,80,255,0.9)'; g.lineWidth = 1; g.shadowColor = '#a050ff'; g.shadowBlur = 4; g.beginPath(); g.moveTo(54, 10); g.lineTo(51, 5); g.stroke(); g.shadowBlur = 0;   // popękany lewy
      horn(g, 74, 15, 86, 4, 3.4, '#d8cfe0', 8); g.fillStyle = '#d8cfe0'; g.beginPath(); g.moveTo(80, 10); g.lineTo(84, 0); g.lineTo(86, 12); g.closePath(); g.fill();
      g.shadowColor = '#ff2a60'; g.shadowBlur = 7; eye(g, 70, 27, 3.8, '#ff2a50', hurt); g.shadowBlur = 0;
      g.fillStyle = '#3a2a48'; g.beginPath(); g.ellipse(80, 40, 6, 4.4, 0, 0, TAU); g.fill(); g.strokeStyle = OUTC; g.lineWidth = 1; g.stroke();
      g.fillStyle = '#e8d8ff'; g.beginPath(); g.moveTo(70, 46); g.lineTo(72, 51); g.lineTo(74, 46); g.moveTo(76, 47); g.lineTo(78, 52); g.lineTo(80, 47); g.fill();
      // pierścień Kamienizatora
      g.strokeStyle = 'rgba(219,66,105,0.7)'; g.lineWidth = 1.6; g.shadowColor = '#db4269'; g.shadowBlur = 5; g.beginPath(); g.arc(34, 34, 18, 0, TAU); g.stroke(); g.shadowBlur = 0;
      if (exposed) glow(g, 34, 34, 14, 'rgba(255,100,150,0.95)', 0.9);
      break;
    }
  }
  return c;
}
