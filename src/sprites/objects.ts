/** Przedmioty, skrzynki, przewody i ikony HUD w grafice „ilustrowanej” (wektor, supersampling ×2). */
import { hiCanvas, shade, type Img } from '../engine/gfx';
import type { CableColor, ItemKind } from '../game/types';

type G = CanvasRenderingContext2D;
const TAU = Math.PI * 2;
const OUTC = 'rgba(22,14,32,0.85)';
export const ITEM_SIZE = 20;
export const CABLE_COL: Record<CableColor, string> = { blue: '#3a8de0', green: '#3fbf5a', yellow: '#f0c030', red: '#e0443a', purple: '#9a5ad8', black: '#3a3446' };

function lin(g: G, x0: number, y0: number, x1: number, y1: number, ...c: string[]): CanvasGradient { const gr = g.createLinearGradient(x0, y0, x1, y1); c.forEach((s, i) => gr.addColorStop(c.length === 1 ? 0 : i / (c.length - 1), s)); return gr; }
function glow(g: G, x: number, y: number, r: number, col: string, a = 0.6): void { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.globalAlpha = a; g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.globalAlpha = 1; }
function outlined(g: G, fill: string | CanvasGradient, path: () => void, lw = 0.9): void { g.beginPath(); path(); g.fillStyle = fill; g.fill(); g.strokeStyle = OUTC; g.lineWidth = lw; g.lineJoin = 'round'; g.stroke(); }
function sparkle(g: G, x: number, y: number, r: number, a = 1): void { g.globalAlpha = a; g.fillStyle = '#fff'; g.beginPath(); g.moveTo(x, y - r); g.quadraticCurveTo(x, y, x + r, y); g.quadraticCurveTo(x, y, x, y + r); g.quadraticCurveTo(x, y, x - r, y); g.quadraticCurveTo(x, y, x, y - r); g.fill(); g.globalAlpha = 1; }

export function drawItem(kind: ItemKind, f: number): Img {
  const { c, g } = hiCanvas(ITEM_SIZE, ITEM_SIZE); const s = f & 1;
  g.lineCap = 'round'; g.lineJoin = 'round';
  switch (kind) {
    case 'pet': {
      outlined(g, lin(g, 6, 0, 14, 0, '#9fe8d8', '#6fcfba', '#3fa592'), () => { g.moveTo(8, 3.6); g.lineTo(12, 3.6); g.lineTo(12, 6); g.quadraticCurveTo(15.2, 7.6, 15, 11); g.lineTo(15, 16.2); g.quadraticCurveTo(15, 18.4, 12.8, 18.4); g.lineTo(7.2, 18.4); g.quadraticCurveTo(5, 18.4, 5, 16.2); g.lineTo(5, 11); g.quadraticCurveTo(4.8, 7.6, 8, 6); g.closePath(); });
      g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(5.4, 12.6, 9.2, 1); g.fillStyle = '#2f9e8a'; g.fillRect(5, 10, 10, 3.4);
      g.fillStyle = '#f3fbff'; g.fillRect(5, 10.8, 10, 0.9);
      outlined(g, lin(g, 7.6, 0, 12.4, 0, '#6aa6ff', '#2f6fd6'), () => { g.roundRect(7.6, 1.2, 4.8, 2.6, 0.8); });
      g.fillStyle = 'rgba(255,255,255,0.8)'; g.beginPath(); g.ellipse(7.1, 11.5, 0.8, 3.4, 0, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.arc(11.5 + s, 15.5, 0.7, 0, TAU); g.fill();
      sparkle(g, s ? 15.8 : 4.4, s ? 6 : 8, 1.6, 0.9);
      break;
    }
    case 'can': case 'golden': {
      const gold = kind === 'golden';
      const body = gold ? ['#8a5a0a', '#ffd84a', '#fff3a8', '#e0a420', '#8a5a0a'] : ['#7d8696', '#d5dbe4', '#ffffff', '#b4bcc9', '#6c7484'];
      if (gold) glow(g, 10, 10, 11, 'rgba(255,225,110,0.9)', 0.55 + 0.2 * s);
      outlined(g, lin(g, 4.6, 0, 15.4, 0, ...body), () => { g.moveTo(5, 4.6); g.lineTo(5, 16.6); g.quadraticCurveTo(10, 18.8, 15, 16.6); g.lineTo(15, 4.6); g.quadraticCurveTo(10, 6.4, 5, 4.6); g.closePath(); });
      outlined(g, lin(g, 5, 0, 15, 0, ...body), () => { g.ellipse(10, 4, 5, 1.7, 0, 0, TAU); });
      g.fillStyle = gold ? '#fff7c8' : '#9aa3b2'; g.beginPath(); g.ellipse(10, 4, 3.6, 1.1, 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(11.3, 3.8, 0.9, 0.35, 0, 0, TAU); g.fill();
      g.save(); g.beginPath(); g.moveTo(5, 7.6); g.lineTo(15, 7.6); g.lineTo(15, 14); g.quadraticCurveTo(10, 15.6, 5, 14); g.closePath(); g.clip();
      g.fillStyle = gold ? lin(g, 0, 7, 0, 15, '#c8301a', '#e8503a') : lin(g, 0, 7, 0, 15, '#e0584a', '#b02a28'); g.fillRect(4, 7, 12, 8);
      g.fillStyle = 'rgba(255,255,255,0.9)'; g.beginPath(); g.moveTo(5, 10.4); g.quadraticCurveTo(10, 12.2, 15, 10.4); g.lineTo(15, 11.4); g.quadraticCurveTo(10, 13.2, 5, 11.4); g.fill();
      g.restore();
      g.fillStyle = 'rgba(255,255,255,0.8)'; g.beginPath(); g.ellipse(6.9, 11, 0.7, 4.8, 0, 0, TAU); g.fill();
      if (gold) { sparkle(g, s ? 3.2 : 16.8, s ? 4 : 13, 2.3, 1); sparkle(g, s ? 16.5 : 3.5, s ? 13 : 5, 1.5, 0.9); }
      break;
    }
    case 'battery': {
      outlined(g, '#9aa3b2', () => { g.roundRect(7.8, 1, 4.4, 3.2, 0.8); });
      outlined(g, lin(g, 4, 0, 16, 0, '#1f7a38', '#43c862', '#8af0a4', '#2fa84e', '#1a6a30'), () => { g.roundRect(4, 3.6, 12, 14.8, 2); });
      g.fillStyle = '#e8ffe0'; g.beginPath(); g.moveTo(11.4, 7); g.lineTo(7.6, 11.4); g.lineTo(9.8, 11.4); g.lineTo(8.6, 15.4); g.lineTo(12.6, 10.4); g.lineTo(10.4, 10.4); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(5.2, 5, 1, 11);
      break;
    }
    case 'crystal': {
      glow(g, 10, 10, 10, 'rgba(138,214,255,0.8)', 0.5);
      outlined(g, '#8ad6ff', () => { g.moveTo(10, 1); g.lineTo(16.5, 7); g.lineTo(10, 19); g.lineTo(3.5, 7); g.closePath(); });
      g.fillStyle = '#5aa8e6'; g.beginPath(); g.moveTo(10, 1); g.lineTo(10, 19); g.lineTo(3.5, 7); g.closePath(); g.fill();
      g.fillStyle = '#c8efff'; g.beginPath(); g.moveTo(10, 1); g.lineTo(16.5, 7); g.lineTo(10, 7); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 0.5; g.beginPath(); g.moveTo(3.5, 7); g.lineTo(16.5, 7); g.stroke();
      sparkle(g, s ? 14 : 6, s ? 4 : 5, 1.8, 0.95);
      break;
    }
    case 'shard': {
      glow(g, 10, 10, 10, 'rgba(255,90,130,0.8)', 0.5);
      outlined(g, '#e8406a', () => { g.moveTo(10, 1); g.lineTo(16, 10); g.lineTo(12, 19); g.lineTo(6, 12.5); g.lineTo(4, 6); g.closePath(); });
      g.fillStyle = '#a82a50'; g.beginPath(); g.moveTo(10, 1); g.lineTo(12, 19); g.lineTo(6, 12.5); g.closePath(); g.fill();
      g.fillStyle = '#ffb0c0'; g.beginPath(); g.moveTo(10, 1); g.lineTo(4, 6); g.lineTo(8.4, 8); g.closePath(); g.fill();
      sparkle(g, s ? 13.5 : 7, s ? 7 : 4, 1.7, 0.9);
      break;
    }
    case 'signet': {
      outlined(g, lin(g, 2, 2, 18, 18, '#fff0a0', '#c8a050', '#7a5a1a'), () => { g.arc(10, 10, 8, 0, TAU); });
      outlined(g, '#6a1f33', () => { g.arc(10, 10, 5, 0, TAU); }, 0.7);
      g.fillStyle = '#ffd070'; g.fillRect(9.2, 6.4, 1.6, 7.2); g.fillRect(6.4, 9.2, 7.2, 1.6);
      g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.ellipse(6.4, 5.6, 2.4, 1, -0.6, 0, TAU); g.fill();
      break;
    }
    case 'note': {
      g.save(); g.translate(10, 10); g.rotate(-0.06); g.translate(-10, -10);
      outlined(g, lin(g, 0, 2, 0, 18, '#fff8dc', '#eadfb4'), () => { g.roundRect(3, 2, 14, 16, 1.2); });
      g.strokeStyle = '#8a7a5a'; g.lineWidth = 0.7; for (const y of [5.4, 8, 10.6]) { g.beginPath(); g.moveTo(5, y); g.lineTo(y > 10 ? 11 : 15, y); g.stroke(); }
      g.restore();
      outlined(g, '#d6403a', () => { g.arc(14, 14.4, 2.4, 0, TAU); }, 0.6); g.fillStyle = '#ff8c80'; g.beginPath(); g.arc(13.4, 13.7, 0.8, 0, TAU); g.fill();
      break;
    }
    case 'xl': {                      // Bezpiecznik XL: szklana wkładka z żarnikiem i mosiężnymi końcówkami
      glow(g, 10, 10, 11, 'rgba(120,200,255,0.9)', 0.5 + 0.2 * s);
      outlined(g, lin(g, 0, 7, 0, 13, 'rgba(210,240,255,0.95)', 'rgba(150,200,235,0.9)'), () => { g.roundRect(4.6, 6.2, 10.8, 7.6, 3); });
      g.strokeStyle = '#ffd23f'; g.lineWidth = 1; g.beginPath(); g.moveTo(6, 10); g.bezierCurveTo(8, 7.6, 9, 12.4, 10, 10); g.bezierCurveTo(11, 7.6, 12, 12.4, 14, 10); g.stroke();
      g.shadowColor = '#ffd23f'; g.shadowBlur = 3; g.stroke(); g.shadowBlur = 0;
      for (const x of [1.6, 15.2]) outlined(g, lin(g, x, 0, x + 3.2, 0, '#fff0b0', '#d9a830', '#8f6618'), () => { g.roundRect(x, 5.4, 3.2, 9.2, 1); }, 0.8);
      g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillRect(6, 7, 7, 0.8);
      sparkle(g, s ? 16.4 : 3.6, s ? 3.4 : 4.4, 1.8, 0.9);
      break;
    }
    case 'coil': {
      outlined(g, lin(g, 8, 0, 12, 0, '#6c7484', '#d5dbe4', '#6c7484'), () => { g.roundRect(8, 1.4, 4, 17.4, 1); });
      for (let i = 0; i < 4; i++) { const y = 3.4 + i * 3.9; outlined(g, lin(g, 0, y, 0, y + 2.6, '#ffc060', '#d9821a', '#8f4f0c'), () => { g.roundRect(4.6, y, 10.8, 2.8, 1.4); }, 0.7); }
      g.fillStyle = '#9fe0ff'; g.shadowColor = '#7fd6ff'; g.shadowBlur = 4; g.beginPath(); g.arc(10, 1.2, 1.5, 0, TAU); g.fill(); g.shadowBlur = 0;
      g.strokeStyle = '#bfeaff'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(11.4, 1.2); g.lineTo(s ? 14 : 13, s ? 3 : 0.6); g.lineTo(s ? 16 : 15, s ? 1.6 : 2.4); g.stroke();
      break;
    }
    case 'magnet': {
      g.lineCap = 'butt';
      const arc = () => { g.beginPath(); g.moveTo(4.8, 17); g.lineTo(4.8, 9); g.arc(10, 9, 5.2, Math.PI, 0); g.lineTo(15.2, 17); };
      arc(); g.strokeStyle = OUTC; g.lineWidth = 5.6; g.stroke();
      arc(); g.strokeStyle = lin(g, 3, 0, 17, 0, '#8f1f1f', '#e0443a', '#ff8a7a', '#c02a2a'); g.lineWidth = 4.2; g.stroke();
      for (const x of [4.8, 15.2]) { g.fillStyle = OUTC; g.fillRect(x - 2.6, 13.6, 5.2, 4.2); g.fillStyle = lin(g, 0, 14, 0, 17.4, '#ffffff', '#b4bcc9'); g.fillRect(x - 2.1, 14.1, 4.2, 3.2); }
      g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 0.8; g.beginPath(); g.arc(10, 9, 4.6, Math.PI * 1.05, Math.PI * 1.5); g.stroke();
      break;
    }
    case 'extender': {                // stoper z plusem: wydłuża czas
      outlined(g, lin(g, 3, 3, 17, 17, '#fffbe8', '#e8dfc0', '#b8ae88'), () => { g.arc(10, 11, 7.4, 0, TAU); });
      outlined(g, '#7a8494', () => { g.roundRect(8.4, 1.2, 3.2, 2.6, 0.6); }, 0.6);
      g.strokeStyle = '#2a2236'; g.lineWidth = 1.1; g.beginPath(); g.moveTo(10, 11); g.lineTo(10, 6.6); g.moveTo(10, 11); g.lineTo(13, 12.6); g.stroke();
      g.fillStyle = '#2f9ae0'; g.fillRect(9.4, 14.2, 1.2, 2.8); g.fillRect(8.6, 15, 2.8, 1.2);
      break;
    }
    case 'gloves': {
      g.save(); g.translate(10, 10); g.rotate(0.12); g.translate(-10, -10);
      const col = lin(g, 4, 0, 16, 0, '#c8701a', '#ffa83a', '#ffd070', '#e8841f');
      outlined(g, col, () => { g.moveTo(5.4, 9); g.lineTo(5.4, 5.2); g.quadraticCurveTo(5.4, 3.4, 7, 3.4); g.quadraticCurveTo(8.6, 3.4, 8.6, 5); g.lineTo(8.8, 3); g.quadraticCurveTo(8.8, 1.6, 10.2, 1.6); g.quadraticCurveTo(11.6, 1.6, 11.6, 3); g.lineTo(11.8, 4); g.quadraticCurveTo(11.8, 2.6, 13.2, 2.8); g.quadraticCurveTo(14.4, 3, 14.4, 4.4); g.lineTo(14.4, 5.6); g.quadraticCurveTo(15.6, 5.2, 15.8, 6.6); g.lineTo(15.4, 11); g.quadraticCurveTo(15.2, 14.4, 12.4, 15); g.lineTo(7.8, 15); g.quadraticCurveTo(5.4, 14, 5.4, 11); g.closePath(); });
      outlined(g, lin(g, 0, 14.6, 0, 18.4, '#aab2c0', '#6c7484'), () => { g.roundRect(5, 14.6, 11, 3.8, 1); }, 0.7);
      g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(6.4, 6.4, 1, 5);
      g.restore();
      break;
    }
    case 'star': {                    // Gwiazda Napięcia: ośmioramienna iskra z piorunem
      glow(g, 10, 10, 11, s ? 'rgba(255,240,120,0.95)' : 'rgba(120,230,255,0.9)', 0.7);
      outlined(g, lin(g, 0, 0, 20, 20, s ? '#fff6a0' : '#ffe14a', '#ffb62a'), () => { for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU - Math.PI / 2, r = i % 2 ? 4.4 : 9; g[i ? 'lineTo' : 'moveTo'](10 + Math.cos(a) * r, 10 + Math.sin(a) * r); } g.closePath(); });
      g.fillStyle = '#2f8cff'; g.beginPath(); g.moveTo(11.4, 5); g.lineTo(7.4, 10.8); g.lineTo(9.8, 10.8); g.lineTo(8.6, 15.4); g.lineTo(12.8, 9.4); g.lineTo(10.4, 9.4); g.closePath(); g.fill();
      g.fillStyle = '#fff'; g.globalAlpha = 0.7; g.beginPath(); g.moveTo(11, 6.2); g.lineTo(9, 9.6); g.lineTo(10.2, 9.6); g.closePath(); g.fill(); g.globalAlpha = 1;
      break;
    }
  }
  return c;
}

/** Skrzynka „rozdzielnica”: metalowa szafka z żółtym trójkątem ostrzegawczym; ukryta = fioletowa z gwiazdką. */
export function drawCrate(hidden: boolean, used: boolean): Img {
  const { c, g } = hiCanvas(32, 32);
  const base = used ? '#5b5568' : hidden ? '#7a5cc8' : '#6d7a8c';
  outlined(g, lin(g, 0, 0, 32, 32, shade(base, 1.35), base, shade(base, 0.62)), () => { g.roundRect(1, 1, 30, 30, 3.5); }, 1.1);
  g.fillStyle = 'rgba(255,255,255,0.22)'; g.beginPath(); g.roundRect(2.2, 2.2, 27.6, 3, 1.5); g.fill();
  // panel
  g.fillStyle = used ? 'rgba(0,0,0,0.35)' : lin(g, 0, 6, 0, 28, shade(base, 0.8), shade(base, 0.55));
  g.beginPath(); g.roundRect(5, 7, 22, 19, 2); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.45)'; g.lineWidth = 0.8; g.stroke();
  for (const [x, y] of [[3.6, 3.6], [28.4, 3.6], [3.6, 28.4], [28.4, 28.4]]) { g.fillStyle = shade(base, 0.5); g.beginPath(); g.arc(x, y, 1.1, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,0.55)'; g.fillRect(x - 0.5, y - 0.6, 0.7, 0.6); }
  if (!used) {
    const warn = hidden ? '#d8b8ff' : '#ffd23f';
    glow(g, 16, 16.5, 12, hidden ? 'rgba(190,150,255,0.8)' : 'rgba(255,210,63,0.7)', 0.45);
    g.fillStyle = warn; g.strokeStyle = OUTC; g.lineWidth = 0.9; g.lineJoin = 'round'; g.beginPath(); g.moveTo(16, 9.2); g.lineTo(23.6, 23); g.lineTo(8.4, 23); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = hidden ? '#3a2a6a' : '#2a2236';
    if (hidden) { g.beginPath(); for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU - Math.PI / 2, r = i % 2 ? 1.7 : 4; g[i ? 'lineTo' : 'moveTo'](16 + Math.cos(a) * r, 17.4 + Math.sin(a) * r); } g.closePath(); g.fill(); }
    else { g.beginPath(); g.moveTo(17.2, 12.4); g.lineTo(13.4, 18.4); g.lineTo(15.6, 18.4); g.lineTo(14.6, 21.8); g.lineTo(18.8, 16.6); g.lineTo(16.4, 16.6); g.closePath(); g.fill(); }
  } else { g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(8, 12); g.lineTo(24, 12); g.moveTo(8, 17); g.lineTo(24, 17); g.moveTo(8, 22); g.lineTo(24, 22); g.stroke(); }
  return c;
}

/** Gniazdo przewodu 32×32: metalowa obudowa na kołnierzu, kolorowy pierścień z portem i gruby kabel; ikona na tabliczce. */
export function drawCable(color: CableColor, face: 'up' | 'down', pulse: number): Img {
  const { c, g } = hiCanvas(32, 32); const col = CABLE_COL[color];
  if (face === 'down') { g.translate(0, 32); g.scale(1, -1); }
  g.lineCap = 'round'; g.lineJoin = 'round';
  // kabel wychodzący z boku obudowy i zanurzający się w ziemię
  const cab = () => { g.beginPath(); g.moveTo(24, 20); g.bezierCurveTo(31, 18, 32, 27, 28, 31); };
  cab(); g.strokeStyle = OUTC; g.lineWidth = 5.4; g.stroke();
  cab(); g.strokeStyle = lin(g, 22, 0, 32, 0, shade(col, 0.7), col, shade(col, 1.4)); g.lineWidth = 4; g.stroke();
  cab(); g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 0.9; g.stroke();
  // kołnierz
  outlined(g, lin(g, 0, 26, 0, 32, '#8d95a6', '#4a5060'), () => { g.roundRect(1, 26.4, 30, 5.6, [2, 2, 0, 0]); }, 1);
  for (const x of [4.4, 27.6]) { g.fillStyle = '#2a2e3a'; g.beginPath(); g.arc(x, 29.2, 1.1, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(x - 0.5, 28.5, 0.7, 0.6); }
  // obudowa (ośmiokątny walec)
  outlined(g, lin(g, 5, 0, 27, 0, '#3e4454', '#6e778a', '#a8b0c0', '#6e778a', '#383e4c'), () => { g.moveTo(6.4, 26.6); g.lineTo(5, 23); g.lineTo(5, 14); g.lineTo(7, 11.4); g.lineTo(25, 11.4); g.lineTo(27, 14); g.lineTo(27, 23); g.lineTo(25.6, 26.6); g.closePath(); }, 1);
  g.fillStyle = 'rgba(255,255,255,0.28)'; g.fillRect(7.4, 12, 1.4, 14);
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(22, 12, 3, 14.4);
  // tabliczka z ikoną
  g.fillStyle = col; g.beginPath(); g.roundRect(10.6, 15.4, 10.8, 9, 1.8); g.fill(); g.strokeStyle = OUTC; g.lineWidth = 0.7; g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.9)'; g.strokeStyle = 'rgba(255,255,255,0.95)'; g.lineWidth = 1.1;
  const cx = 16, cy = 20;
  switch (color) {
    case 'blue': g.beginPath(); g.arc(cx, cy, 2.6, 0, TAU); g.stroke(); g.beginPath(); g.arc(cx, cy, 0.8, 0, TAU); g.fill(); break;
    case 'green': g.beginPath(); g.moveTo(cx - 2.8, cy + 2.2); g.quadraticCurveTo(cx - 2.4, cy - 2.8, cx + 3, cy - 2.4); g.quadraticCurveTo(cx + 2.6, cy + 2.8, cx - 2.8, cy + 2.2); g.fill(); break;
    case 'yellow': g.beginPath(); g.arc(cx - 0.8, cy - 0.8, 2.1, 0, TAU); g.stroke(); g.beginPath(); g.moveTo(cx + 0.8, cy + 0.8); g.lineTo(cx + 3.2, cy + 3.2); g.stroke(); break;
    case 'red': g.beginPath(); g.moveTo(cx, cy - 3); g.lineTo(cx + 3.2, cy + 2.6); g.lineTo(cx - 3.2, cy + 2.6); g.closePath(); g.stroke(); g.fillRect(cx - 0.4, cy - 1, 0.8, 2); break;
    case 'purple': g.beginPath(); for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU - Math.PI / 2, r = i % 2 ? 1.3 : 3.2; g[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * r, cy + Math.sin(a) * r); } g.closePath(); g.fill(); break;
    case 'black': g.strokeStyle = '#ff5a86'; g.beginPath(); g.moveTo(cx - 2.6, cy - 2.6); g.lineTo(cx - 0.4, cy); g.lineTo(cx - 2.2, cy + 2.6); g.moveTo(cx + 2.6, cy - 2.6); g.lineTo(cx + 0.4, cy); g.lineTo(cx + 2.2, cy + 2.6); g.stroke(); break;
  }
  // górny pierścień z portem
  outlined(g, lin(g, 0, 6, 0, 12.4, shade(col, 1.5), col, shade(col, 0.6)), () => { g.roundRect(3.4, 6.4, 25.2, 6.4, 3); }, 1);
  g.fillStyle = 'rgba(255,255,255,0.55)'; g.fillRect(5, 7.1, 22, 0.9);
  g.fillStyle = '#0b0812'; g.beginPath(); g.ellipse(16, 8.4, 9, 1.7, 0, 0, TAU); g.fill();
  if (pulse & 1) { g.fillStyle = shade(col, 1.5); g.shadowColor = col; g.shadowBlur = 5; g.globalAlpha = 0.9; g.beginPath(); g.ellipse(16, 8.5, 6.4, 0.95, 0, 0, TAU); g.fill(); g.globalAlpha = 1; g.shadowBlur = 0; }
  return c;
}

export function drawIcon(kind: 'life' | 'pet' | 'can' | 'coil' | 'shield', alt: string): Img {
  const { c, g } = hiCanvas(16, 16); g.lineCap = 'round'; g.lineJoin = 'round';
  switch (kind) {
    case 'life': {
      const M = alt === 'M'; const helm = M ? '#2f6fd6' : '#f7c826', helmHi = M ? '#7fb0ff' : '#fff08a';
      outlined(g, lin(g, 0, 3, 0, 15, '#ffd9b8', '#f0b48c'), () => { g.ellipse(8, 9.4, 5.6, 5.6, 0, 0, TAU); }, 0.8);
      outlined(g, lin(g, 0, 1, 0, 8, helmHi, helm, shade(helm, 0.7)), () => { g.moveTo(2, 8); g.quadraticCurveTo(2, 1.2, 8, 1.2); g.quadraticCurveTo(14, 1.2, 14, 8); g.closePath(); }, 0.8);
      g.fillStyle = shade(helm, 0.75); g.beginPath(); g.roundRect(7, 6.6, 8.4, 2, 1); g.fill();
      g.fillStyle = '#1d1626'; g.beginPath(); g.ellipse(7.6, 11, 0.8, 1.2, 0, 0, TAU); g.ellipse(11, 11, 0.8, 1.2, 0, 0, TAU); g.fill();
      if (!M) { g.strokeStyle = '#2a2036'; g.lineWidth = 0.5; g.beginPath(); g.arc(7.6, 11, 1.7, 0, TAU); g.arc(11, 11, 1.7, 0, TAU); g.stroke(); }
      else { g.fillStyle = 'rgba(74,44,28,0.6)'; g.beginPath(); g.ellipse(9.4, 13.4, 3.4, 1.2, 0, 0, Math.PI); g.fill(); }
      break;
    }
    case 'pet': return drawItem('pet', 0);
    case 'can': return drawItem('can', 0);
    case 'coil': return drawItem('coil', 0);
    case 'shield': {
      outlined(g, lin(g, 0, 1, 0, 15, '#e8fbff', '#7fd6ff', '#2f8cd0'), () => { g.moveTo(8, 1); g.quadraticCurveTo(13, 2.4, 14, 3.6); g.quadraticCurveTo(14.4, 10, 8, 15); g.quadraticCurveTo(1.6, 10, 2, 3.6); g.quadraticCurveTo(3, 2.4, 8, 1); g.closePath(); });
      g.fillStyle = 'rgba(255,255,255,0.8)'; g.beginPath(); g.moveTo(9, 4); g.lineTo(6, 8.4); g.lineTo(8, 8.4); g.lineTo(7.2, 11.6); g.lineTo(10.4, 7.4); g.lineTo(8.4, 7.4); g.closePath(); g.fill();
      break;
    }
  }
  return c;
}
