/** Rekwizyty poziomu (EcoPort, checkpoint, rozdzielnia, przełączniki, latarnie, posągi, pociski) — grafika „ilustrowana”. */
import { hiCanvas, shade, type Img } from '../engine/gfx';
import type { SwitchStyle } from '../game/types';

type G = CanvasRenderingContext2D;
const TAU = Math.PI * 2;
const OUTC = 'rgba(22,14,32,0.85)';
function lin(g: G, x0: number, y0: number, x1: number, y1: number, ...c: string[]): CanvasGradient { const gr = g.createLinearGradient(x0, y0, x1, y1); c.forEach((s, i) => gr.addColorStop(c.length === 1 ? 0 : i / (c.length - 1), s)); return gr; }
function shape(g: G, fill: string | CanvasGradient, path: () => void, lw = 1): void { g.beginPath(); path(); g.fillStyle = fill; g.fill(); g.strokeStyle = OUTC; g.lineWidth = lw; g.lineJoin = 'round'; g.stroke(); }
function glow(g: G, x: number, y: number, r: number, col: string, a = 0.6): void { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.globalAlpha = a; g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.globalAlpha = 1; }
function metal(g: G, x0: number, x1: number, base = '#8d95a6'): CanvasGradient { return lin(g, x0, 0, x1, 0, shade(base, 0.62), shade(base, 1.0), shade(base, 1.4), shade(base, 0.85), shade(base, 0.55)); }
function bolt(g: G, x: number, y: number, r = 0.9): void { g.fillStyle = '#2a2e3a'; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(x - r * 0.5, y - r * 0.6, r * 0.7, r * 0.5); }

/** EcoPort (butelkomat) 48×64 */
export function drawEcoport(broken: boolean, f: number): Img {
  const { c, g } = hiCanvas(48, 64); const s = f & 1;
  shape(g, lin(g, 0, 10, 0, 64, '#d6dce6', '#9aa3b4', '#5f6878'), () => { g.roundRect(4, 10, 40, 53, 4); }, 1.2);
  g.fillStyle = 'rgba(255,255,255,0.3)'; g.fillRect(6, 12, 2, 48);
  // daszek z logo
  shape(g, lin(g, 0, 2, 0, 12, broken ? '#8a8f9a' : '#5fd08a', broken ? '#5a606a' : '#2a9a58'), () => { g.roundRect(2, 3, 44, 9, 3); }, 1.2);
  g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.lineWidth = 1.2; g.beginPath(); g.arc(10, 7.5, 2.6, 0.4, 5.6); g.stroke(); g.beginPath(); g.moveTo(11.6, 4.2); g.lineTo(13.4, 5.8); g.lineTo(10.4, 6.2); g.closePath(); g.fill();
  g.font = 'bold 6px sans-serif'; g.fillStyle = '#fff'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('EcoPort', 16, 8);
  // ekran
  shape(g, '#0c1420', () => { g.roundRect(9, 15, 30, 15, 2); }, 1);
  if (!broken) {
    g.fillStyle = s ? '#7fe8ff' : '#4fc8f0'; g.shadowColor = '#7fd6ff'; g.shadowBlur = 4; g.fillRect(12, 18, 12, 2); g.fillRect(12, 22, 8, 2); g.shadowBlur = 0;
    g.fillStyle = '#8aff9a'; g.fillRect(28, 18, 8, 7); g.fillStyle = '#0c1420'; g.fillRect(30, 20, 4, 3);
  } else { g.strokeStyle = '#ffcc40'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(14, 18); g.lineTo(34, 27); g.moveTo(34, 18); g.lineTo(14, 27); g.stroke(); }
  // otwór na opakowania z gumowymi klapkami
  shape(g, '#10141c', () => { g.ellipse(24, 40, 12, 9, 0, 0, TAU); }, 1.2);
  g.fillStyle = broken ? '#3a2e30' : '#1a2a3a'; g.beginPath(); g.ellipse(24, 41, 9.6, 6.8, 0, 0, TAU); g.fill();
  if (!broken) { glow(g, 24, 41, 11, 'rgba(127,214,255,0.9)', 0.5 + 0.3 * s); g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.ellipse(21, 38, 4, 2, -0.3, 0, TAU); g.fill(); }
  g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 0.9; for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(24 + i * 3.4, 34.5); g.lineTo(24 + i * 3.4, 47); g.stroke(); }
  // wylot paragonu + diody
  shape(g, '#2a2e3a', () => { g.roundRect(14, 53, 20, 4, 1); }, 0.8);
  g.fillStyle = broken ? '#ff4a3a' : '#3fe06a'; g.shadowColor = g.fillStyle as string; g.shadowBlur = 4; g.beginPath(); g.arc(40, 22 + 0, 0.01, 0, 0); g.arc(8.2, 33.5, 1.4, 0, TAU); g.fill(); g.shadowBlur = 0;
  for (const [x, y] of [[7, 13], [41, 13], [7, 60], [41, 60]]) bolt(g, x, y);
  if (broken) { g.fillStyle = '#ff6a5a'; g.shadowColor = '#ff6a5a'; g.shadowBlur = 5; g.beginPath(); g.arc(24, 2, 1.8, 0, TAU); g.fill(); g.shadowBlur = 0; g.strokeStyle = '#ffe14a'; g.lineWidth = 1.1; g.beginPath(); g.moveTo(40, 36); g.lineTo(44, 40); g.lineTo(41, 42); g.lineTo(45, 47); g.stroke(); }
  return c;
}

/** Checkpoint 24×56: skrzynka zasilania z masztem i iskrzącą kulą (bez flagi) */
export function drawCheckpoint(on: boolean, f: number): Img {
  const { c, g } = hiCanvas(24, 56); const s = f & 1;
  shape(g, metal(g, 11, 13, '#7c8494'), () => { g.roundRect(11, 8, 2.6, 28, 1); }, 0.9);
  shape(g, metal(g, 3, 21, '#858da0'), () => { g.roundRect(3, 34, 18, 20, 3); }, 1.1);
  shape(g, lin(g, 0, 50, 0, 56, '#666e7e', '#3e4452'), () => { g.roundRect(1, 51, 22, 5, 2); }, 1);
  g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.roundRect(6, 38, 12, 8, 1.5); g.fill();
  const col = on ? '#47e070' : '#ff4a3a';
  glow(g, 12, 42, 9, on ? 'rgba(71,224,112,0.9)' : 'rgba(255,74,58,0.7)', on ? 0.8 : 0.45);
  g.fillStyle = col; g.shadowColor = col; g.shadowBlur = 5; g.beginPath(); g.arc(12, 42, 2.4, 0, TAU); g.fill(); g.shadowBlur = 0;
  g.fillStyle = 'rgba(255,255,255,0.8)'; g.beginPath(); g.arc(11.2, 41.2, 0.8, 0, TAU); g.fill();
  bolt(g, 5.6, 36.6); bolt(g, 18.4, 36.6);
  // kula na szczycie
  if (on) glow(g, 12, 6, 12, 'rgba(160,230,255,0.9)', 0.7);
  shape(g, on ? lin(g, 8, 2, 16, 10, '#ffffff', '#8fe0ff', '#3fa8e0') : lin(g, 8, 2, 16, 10, '#c8ced8', '#7a8292', '#4a5262'), () => { g.arc(12, 6.4, 4.4, 0, TAU); }, 1);
  if (on) { g.strokeStyle = '#d8f6ff'; g.lineWidth = 0.9; g.lineCap = 'round'; g.beginPath(); g.moveTo(16, 4); g.lineTo(s ? 20 : 19, s ? 2 : 6); g.lineTo(s ? 22 : 20, s ? 6 : 4); g.stroke(); g.beginPath(); g.moveTo(8, 8); g.lineTo(s ? 4 : 5, s ? 10 : 6); g.stroke(); }
  return c;
}

/** Główna Rozdzielnia 64×84 */
export function drawExit(on: boolean, f: number): Img {
  const { c, g } = hiCanvas(64, 84); const s = f & 1;
  // maszty
  for (const x of [10, 54]) { shape(g, metal(g, x - 1.5, x + 1.5, '#8a92a2'), () => { g.roundRect(x - 1.5, 2, 3, 20, 1); }, 0.9); }
  g.strokeStyle = on ? '#bfe8ff' : '#7a8294'; g.lineWidth = 1; g.beginPath(); g.moveTo(10, 4); g.quadraticCurveTo(32, 14, 54, 4); g.stroke();
  // korpus
  shape(g, lin(g, 0, 14, 0, 84, '#8a93a4', '#5d6676', '#454c5a'), () => { g.roundRect(3, 14, 58, 70, 4); }, 1.3);
  g.fillStyle = 'rgba(255,255,255,0.22)'; g.fillRect(5, 16, 54, 2);
  shape(g, lin(g, 0, 6, 0, 16, '#c9d0dc', '#8d96a8'), () => { g.roundRect(1, 8, 62, 9, 3); }, 1.2);
  // pasy ostrzegawcze
  g.save(); g.beginPath(); g.rect(4, 74, 56, 8); g.clip(); g.fillStyle = '#f2cf2e'; g.fillRect(4, 74, 56, 8); g.fillStyle = '#1e1a26'; for (let x = -4; x < 64; x += 10) { g.beginPath(); g.moveTo(x, 82); g.lineTo(x + 5, 82); g.lineTo(x + 11, 74); g.lineTo(x + 6, 74); g.closePath(); g.fill(); } g.restore();
  // drzwi
  shape(g, '#14182a', () => { g.roundRect(10, 22, 44, 52, 3); }, 1.2);
  const col = on ? '#47e070' : '#ff4a3a';
  g.fillStyle = col; g.shadowColor = col; g.shadowBlur = on ? 7 : 3; g.beginPath(); g.roundRect(15, 27, 34, 5, 2); g.fill(); g.shadowBlur = 0;
  if (on) {
    glow(g, 32, 56, 22, 'rgba(140,255,160,0.9)', 0.8);
    shape(g, lin(g, 0, 36, 0, 74, '#e6ffe8', '#8aff9a', '#3fd070'), () => { g.roundRect(24, 36, 16, 38, 2); }, 0.9);
    for (let i = 0; i < 6; i++) { g.fillStyle = '#fff'; g.globalAlpha = 0.9; g.beginPath(); g.arc(18 + i * 5.6, 40 + ((i * 7 + f * 9) % 30), 0.9, 0, TAU); g.fill(); g.globalAlpha = 1; }
  } else {
    shape(g, lin(g, 0, 36, 0, 74, '#4a2c3a', '#2a1a28'), () => { g.roundRect(24, 36, 16, 38, 2); }, 0.9);
    g.strokeStyle = '#ffcc40'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(21, 50); g.lineTo(43, 62); g.moveTo(43, 50); g.lineTo(21, 62); g.stroke();
  }
  // dźwignia bocznie + lampa
  shape(g, '#c9d0dc', () => { g.roundRect(49, 40, 8, 3, 1.4); }, 0.8);
  shape(g, lin(g, 24, 0, 40, 0, '#f2f6fa', '#a8b0c0'), () => { g.roundRect(25, 0, 14, 10, 3); }, 1);
  g.fillStyle = col; g.shadowColor = col; g.shadowBlur = on ? 6 : 2; g.beginPath(); g.arc(32, 4.6, 2.8 + (on ? 0.4 * s : 0), 0, TAU); g.fill(); g.shadowBlur = 0;
  for (const [x, y] of [[6, 20], [58, 20], [6, 70], [58, 70]]) bolt(g, x, y);
  return c;
}

/** Przełączniki 28×36 */
export function drawSwitch(style: SwitchStyle, on: boolean): Img {
  const { c, g } = hiCanvas(28, 36); g.lineCap = 'round'; g.lineJoin = 'round';
  const col = on ? '#47e070' : '#ff4a3a';
  shape(g, lin(g, 0, 22, 0, 36, '#8a93a4', '#4a5262'), () => { g.roundRect(3, 24, 22, 12, 2.5); }, 1.1);
  g.fillStyle = 'rgba(255,255,255,0.3)'; g.fillRect(5, 25, 18, 1);
  bolt(g, 6.4, 33); bolt(g, 21.6, 33);
  const led = (x: number, y: number) => { g.fillStyle = col; g.shadowColor = col; g.shadowBlur = 4; g.beginPath(); g.arc(x, y, 1.6, 0, TAU); g.fill(); g.shadowBlur = 0; };
  switch (style) {
    case 'lever': {
      shape(g, '#2c3040', () => { g.roundRect(8, 18, 12, 8, 2); }, 0.9);
      const x = on ? 22 : 6; g.strokeStyle = OUTC; g.lineWidth = 4.4; g.beginPath(); g.moveTo(14, 22); g.lineTo(x, 6); g.stroke(); g.strokeStyle = lin(g, 6, 6, 22, 22, '#f4f7fa', '#9aa4b4'); g.lineWidth = 3; g.beginPath(); g.moveTo(14, 22); g.lineTo(x, 6); g.stroke();
      shape(g, on ? '#47e070' : '#e0443a', () => { g.arc(x, 5.6, 3.2, 0, TAU); }, 0.9); break;
    }
    case 'valve': {
      shape(g, '#5a6272', () => { g.roundRect(11, 16, 6, 9, 1); }, 0.9);
      g.save(); g.translate(14, 12); g.rotate(on ? 0.8 : 0); shape(g, lin(g, -9, 0, 9, 0, '#e8edf4', '#9aa4b4'), () => { g.arc(0, 0, 8.6, 0, TAU); g.arc(0, 0, 5.4, 0, TAU, true); }, 1); g.strokeStyle = '#c0c8d6'; g.lineWidth = 2; g.beginPath(); g.moveTo(-8, 0); g.lineTo(8, 0); g.moveTo(0, -8); g.lineTo(0, 8); g.stroke(); g.restore(); led(14, 12); break;
    }
    case 'mirror': {
      shape(g, '#5a6272', () => { g.roundRect(12, 18, 4, 7, 1); }, 0.9);
      shape(g, on ? lin(g, 4, 4, 24, 24, '#ffffff', '#9ad8f6', '#d8f4ff') : lin(g, 4, 4, 24, 24, '#b8c6d4', '#7a8fa0', '#a0b0c0'), () => { g.moveTo(14, 2); g.lineTo(25, 13); g.lineTo(14, 24); g.lineTo(3, 13); g.closePath(); }, 1.2);
      g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 1; g.beginPath(); g.moveTo(8, 9); g.lineTo(13, 4); g.stroke(); if (on) glow(g, 14, 13, 14, 'rgba(160,225,255,0.9)', 0.6); break;
    }
    case 'relay': {
      shape(g, lin(g, 0, 4, 0, 24, '#4a4258', '#2a2434'), () => { g.roundRect(5, 4, 18, 20, 3); }, 1.1);
      shape(g, '#10141c', () => { g.roundRect(8, 7, 12, 6, 1.4); }, 0.7); g.fillStyle = col; g.shadowColor = col; g.shadowBlur = 4; g.fillRect(9.4, 8.6, 9.2, 2.8); g.shadowBlur = 0;
      for (let i = 0; i < 3; i++) { g.fillStyle = '#d98a2a'; g.fillRect(8 + i * 4.2, 16, 3, 5); } break;
    }
    case 'lamp': {
      glow(g, 14, 12, on ? 16 : 4, 'rgba(255,240,130,0.95)', on ? 0.8 : 0.1);
      shape(g, on ? lin(g, 6, 4, 22, 20, '#ffffff', '#fff27a', '#f2c030') : lin(g, 6, 4, 22, 20, '#7a7a88', '#5a5a68'), () => { g.arc(14, 12, 8, 0, TAU); }, 1.1);
      shape(g, lin(g, 0, 17, 0, 25, '#aab2c0', '#6a7282'), () => { g.roundRect(10, 18, 8, 6, 1.5); }, 0.9); break;
    }
    case 'rune': {
      shape(g, lin(g, 0, 3, 0, 24, '#6a627a', '#3e384c'), () => { g.roundRect(6, 3, 16, 21, 4); }, 1.2);
      const rc = on ? '#ffd23f' : '#8a7a9a'; g.strokeStyle = rc; g.lineWidth = 1.5; if (on) { g.shadowColor = '#ffd23f'; g.shadowBlur = 5; }
      g.beginPath(); g.moveTo(10, 7); g.lineTo(18, 7); g.moveTo(14, 7); g.lineTo(14, 20); g.moveTo(10, 15); g.lineTo(18, 15); g.stroke(); g.shadowBlur = 0; break;
    }
  }
  return c;
}

export function drawLamp(f: number): Img {
  const { c, g } = hiCanvas(16, 40);
  glow(g, 8, 6, 12, 'rgba(255,240,150,0.95)', 0.7 + 0.15 * (f & 1));
  shape(g, metal(g, 6.6, 9.4, '#7a8294'), () => { g.roundRect(6.6, 8, 2.8, 32, 1); }, 0.9);
  shape(g, lin(g, 0, 0, 0, 12, '#ffffff', '#fff3a0', '#f2c840'), () => { g.arc(8, 6, 5.6, 0, TAU); }, 1);
  g.fillStyle = 'rgba(255,255,255,0.9)'; g.beginPath(); g.arc(6.4, 4.4, 1.6, 0, TAU); g.fill();
  shape(g, '#5a6272', () => { g.roundRect(4, 35, 8, 5, 1.5); }, 0.9);
  return c;
}
export function drawLantern(lit: boolean): Img {
  const { c, g } = hiCanvas(20, 28);
  if (lit) glow(g, 10, 14, 16, 'rgba(255,225,120,0.95)', 0.7);
  g.strokeStyle = '#6a7282'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(10, 0); g.lineTo(10, 5); g.stroke();
  shape(g, lin(g, 0, 4, 0, 9, '#b4bccb', '#6a7282'), () => { g.moveTo(3, 8); g.lineTo(6, 4.6); g.lineTo(14, 4.6); g.lineTo(17, 8); g.closePath(); }, 1);
  shape(g, lit ? lin(g, 0, 8, 0, 22, '#fff8c0', '#ffe27a', '#f0b83a') : lin(g, 0, 8, 0, 22, '#4a4a5a', '#2e2e3c'), () => { g.roundRect(4.4, 8, 11.2, 14, 1.5); }, 1);
  if (lit) { g.fillStyle = '#fff'; g.beginPath(); g.ellipse(10, 15, 2, 4.5, 0, 0, TAU); g.fill(); }
  g.strokeStyle = 'rgba(30,20,10,0.45)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(10, 8); g.lineTo(10, 22); g.stroke();
  shape(g, lin(g, 0, 21, 0, 26, '#b4bccb', '#5a6272'), () => { g.roundRect(3, 21.6, 14, 4.4, 1.4); }, 1);
  return c;
}
export function drawSign(symbol: number): Img {
  const { c, g } = hiCanvas(24, 32);
  shape(g, lin(g, 11, 0, 14, 0, '#8a6a48', '#c09a68', '#6a4a2c'), () => { g.roundRect(10.6, 14, 3.2, 18, 1); }, 0.9);
  shape(g, lin(g, 0, 2, 0, 18, '#6a6082', '#3a3450'), () => { g.roundRect(2, 2, 20, 16, 3); }, 1.2);
  g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 0.7; g.strokeRect(3.6, 3.6, 16.8, 12.8);
  const gl = ['#ffd23f', '#7fd6ff', '#ff6a8a', '#8aff9a'][symbol % 4]; g.fillStyle = gl; g.strokeStyle = gl; g.lineWidth = 1.8; g.shadowColor = gl; g.shadowBlur = 4;
  switch (symbol % 4) {
    case 0: g.beginPath(); g.arc(12, 10, 3.8, 0, TAU); g.fill(); break;
    case 1: g.beginPath(); g.moveTo(12, 5); g.lineTo(12, 15); g.moveTo(7, 10); g.lineTo(17, 10); g.stroke(); break;
    case 2: g.beginPath(); g.moveTo(12, 4.6); g.lineTo(18.6, 15); g.lineTo(5.4, 15); g.closePath(); g.fill(); break;
    default: g.beginPath(); g.roundRect(6.4, 5.6, 11.2, 8.8, 1.2); g.fill(); g.shadowBlur = 0; g.fillStyle = '#3a3450'; g.fillRect(10, 8.6, 4, 3); break;
  }
  g.shadowBlur = 0; return c;
}

/** posąg skamieniałego mieszkańca 32×44 */
export function drawStatue(cracked: boolean, idx: number): Img {
  const { c, g } = hiCanvas(32, 44); g.lineCap = 'round'; g.lineJoin = 'round';
  const tone = cracked ? '#c2b8a4' : '#9a9aa6';
  shape(g, lin(g, 0, 36, 0, 44, '#8a8a96', '#54545e'), () => { g.roundRect(4, 37, 24, 7, 2); }, 1.1);
  const bodyG = lin(g, 6, 0, 26, 0, shade(tone, 0.6), shade(tone, 1.1), shade(tone, 1.4), shade(tone, 0.8));
  // nogi + tułów
  shape(g, bodyG, () => { g.roundRect(9, 30, 6, 8, 1.5); g.roundRect(17, 30, 6, 8, 1.5); });
  shape(g, bodyG, () => { g.moveTo(8, 32); g.bezierCurveTo(6, 22, 9, 17, 16, 17); g.bezierCurveTo(23, 17, 26, 22, 24, 32); g.closePath(); });
  // ręce (poza zależna od idx)
  const up = idx % 3;
  shape(g, bodyG, () => { g.roundRect(3.4 + up, 20 - up * 2, 5, 12, 2.5); }); shape(g, bodyG, () => { g.roundRect(23.6, up === 1 ? 14 : 20, 5, 12, 2.5); });
  // głowa i rogi
  shape(g, shade(tone, 1.2), () => { g.moveTo(9.6, 9); g.quadraticCurveTo(8, 3, 11, 0); g.lineTo(13, 6); g.closePath(); g.moveTo(22.4, 9); g.quadraticCurveTo(24, 3, 21, 0); g.lineTo(19, 6); g.closePath(); }, 1);
  shape(g, lin(g, 8, 5, 24, 19, shade(tone, 1.4), tone, shade(tone, 0.65)), () => { g.ellipse(16, 12.4, 8, 7.6, 0, 0, TAU); });
  g.fillStyle = 'rgba(40,40,50,0.7)'; g.beginPath(); g.ellipse(12.8, 12, 1.5, 1.9, 0, 0, TAU); g.ellipse(19.2, 12, 1.5, 1.9, 0, 0, TAU); g.fill(); g.fillRect(13.4, 17, 5.2, 1.1);
  g.strokeStyle = 'rgba(40,40,52,0.35)'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(16, 21); g.lineTo(17, 31); g.stroke();
  if (cracked) { g.strokeStyle = '#2a2a34'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(12, 6); g.lineTo(16, 16); g.lineTo(14, 24); g.lineTo(20, 32); g.stroke(); g.strokeStyle = '#ffe48a'; g.lineWidth = 0.7; g.shadowColor = '#ffe48a'; g.shadowBlur = 4; g.stroke(); g.shadowBlur = 0; }
  return c;
}
export function drawFreed(): Img {
  const { c, g } = hiCanvas(32, 44); g.lineCap = 'round'; g.lineJoin = 'round';
  const skin = lin(g, 6, 0, 26, 0, '#c8946a', '#f0c49a', '#ffe0c0', '#e0aa7e');
  glow(g, 16, 24, 20, 'rgba(255,240,170,0.9)', 0.5);
  shape(g, '#5a4a3c', () => { g.roundRect(9, 34, 6, 9, 2); g.roundRect(17, 34, 6, 9, 2); });
  shape(g, lin(g, 6, 0, 26, 0, '#3a8ac8', '#62b0f0', '#3a8ac8'), () => { g.moveTo(8, 36); g.bezierCurveTo(5, 22, 9, 17, 16, 17); g.bezierCurveTo(23, 17, 27, 22, 24, 36); g.closePath(); });
  shape(g, skin, () => { g.roundRect(2.6, 19, 5, 13, 2.5); }); shape(g, skin, () => { g.roundRect(24.4, 13, 5, 14, 2.5); });
  shape(g, '#f4ecd0', () => { g.moveTo(9.6, 9); g.quadraticCurveTo(8, 3, 11, 0); g.lineTo(13, 6); g.closePath(); g.moveTo(22.4, 9); g.quadraticCurveTo(24, 3, 21, 0); g.lineTo(19, 6); g.closePath(); }, 1);
  shape(g, skin, () => { g.ellipse(16, 12.4, 8, 7.6, 0, 0, TAU); });
  g.fillStyle = '#1d1626'; g.beginPath(); g.ellipse(12.8, 12, 1.3, 1.8, 0, 0, TAU); g.ellipse(19.2, 12, 1.3, 1.8, 0, 0, TAU); g.fill();
  g.strokeStyle = '#a0524a'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(12.6, 16.4); g.quadraticCurveTo(16, 19.4, 19.4, 16.4); g.stroke();
  return c;
}
export function drawCompanion(f: number): Img {
  const { c, g } = hiCanvas(16, 16);
  glow(g, 8, 7, 9, 'rgba(255,245,170,0.95)', 0.8);
  shape(g, lin(g, 3, 2, 13, 12, '#ffffff', '#fff3a0', '#f2c830'), () => { g.arc(8, 7, 5, 0, TAU); }, 1);
  shape(g, lin(g, 0, 11, 0, 15, '#aab2c0', '#6a7282'), () => { g.roundRect(5.6, 11.4, 4.8, 3.4, 1); }, 0.8);
  g.fillStyle = '#1d1626'; g.beginPath(); g.ellipse(6.6, 7, 0.7, 1, 0, 0, TAU); g.ellipse(9.8, 7, 0.7, 1, 0, 0, TAU); g.fill();
  g.fillStyle = '#ffe15a'; const w = f & 1 ? 0 : 2; g.beginPath(); g.ellipse(2, 5 + w * 0.4, 1.8, 0.9, -0.5, 0, TAU); g.ellipse(14, 5 + w * 0.4, 1.8, 0.9, 0.5, 0, TAU); g.fill();
  return c;
}
export function drawSpark(f: number): Img {
  const { c, g } = hiCanvas(14, 14); const k = f & 3;
  glow(g, 7, 7, 8, 'rgba(127,214,255,0.95)', 0.9);
  g.fillStyle = '#e8f8ff'; g.beginPath(); g.arc(7, 7, 3.2, 0, TAU); g.fill();
  g.strokeStyle = '#bfeaff'; g.lineWidth = 1; g.lineCap = 'round'; g.beginPath(); for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + k * 0.4; g.moveTo(7 + Math.cos(a) * 3.6, 7 + Math.sin(a) * 3.6); g.lineTo(7 + Math.cos(a) * 6.4, 7 + Math.sin(a) * 6.4); } g.stroke();
  return c;
}
export function drawPulse(): Img {
  const { c, g } = hiCanvas(12, 12); glow(g, 6, 6, 7, 'rgba(255,140,88,0.95)', 0.9);
  g.fillStyle = lin(g, 2, 2, 10, 10, '#ffe0b0', '#ff8c58'); g.beginPath(); g.arc(6, 6, 3.8, 0, TAU); g.fill(); g.strokeStyle = OUTC; g.lineWidth = 0.7; g.stroke(); return c;
}
export function drawBubble(): Img {
  const { c, g } = hiCanvas(10, 10); g.fillStyle = 'rgba(191,230,246,0.35)'; g.beginPath(); g.arc(5, 5, 4, 0, TAU); g.fill(); g.strokeStyle = 'rgba(220,245,255,0.95)'; g.lineWidth = 0.9; g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.9)'; g.beginPath(); g.ellipse(3.6, 3.4, 1.2, 0.8, -0.6, 0, TAU); g.fill(); return c;
}
export function drawRock(): Img {
  const { c, g } = hiCanvas(18, 18);
  shape(g, lin(g, 2, 2, 16, 16, '#c8c8d2', '#8a8a94', '#54545e'), () => { g.moveTo(2.4, 13); g.lineTo(4, 4.4); g.lineTo(10, 1.6); g.lineTo(15.6, 6); g.lineTo(15, 14); g.lineTo(8, 16.4); g.closePath(); }, 1);
  g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(5, 5); g.lineTo(10, 3); g.stroke(); g.strokeStyle = 'rgba(30,30,40,0.5)'; g.beginPath(); g.moveTo(9, 7); g.lineTo(11, 12); g.stroke(); return c;
}
