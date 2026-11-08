/**
 * Bohaterowie w grafice „ilustrowanej” (wektor, supersampling ×2, gradienty), zgodnie z Biblią graficzną:
 *  - Marioosh: pomarańczowy kombinezon z odblaskiem, niebieski kask, grafitowe buty i rękawice, duży klucz, szeroka sylwetka,
 *  - Darioosh: niebieski kombinezon, żółty kask, torba z narzędziami, smukła sylwetka, mały klucz.
 * Rysowane na kanwie 40×48 jednostek logicznych (stopy na dolnej krawędzi), postać zwrócona w prawo.
 */
import { hiCanvas, shade, type Img } from '../engine/gfx';

export type HeroFrame = 'idle' | 'walk0' | 'walk1' | 'jump' | 'attack' | 'climb0' | 'climb1' | 'swim' | 'hurt' | 'fall' | 'crouch' | 'victory'
  | 'glide' | 'hang' | 'wall' | 'pound' | 'roll0' | 'roll1' | 'roll2' | 'roll3';
/** pozy bez własnego rysunku proceduralnego korzystają z najbliższej istniejącej */
const ALIAS: Partial<Record<HeroFrame, HeroFrame>> = { glide: 'jump', hang: 'climb0', wall: 'climb1', pound: 'fall', roll0: 'crouch', roll1: 'crouch', roll2: 'crouch', roll3: 'crouch' };
export const HERO_W = 40, HERO_H = 48;

interface Pal {
  coat: string; coatHi: string; coatLo: string; helm: string; helmHi: string; helmLo: string;
  boots: string; glove: string; refl: string; hair: string; skin: string; skinLo: string; trim: string;
}
const PAL: Record<'M' | 'D', Pal> = {
  M: { coat: '#F28A2B', coatHi: '#ffb95e', coatLo: '#b85a14', helm: '#2D6FB7', helmHi: '#7fb4ee', helmLo: '#17406f', boots: '#2E3940', glove: '#3c4a54', refl: '#e8eef2', hair: '#4a2c1c', skin: '#f3c39c', skinLo: '#d99a72', trim: '#ffd23f' },
  D: { coat: '#246CB4', coatHi: '#62a6e6', coatLo: '#15457f', helm: '#F8CC3F', helmHi: '#fff08a', helmLo: '#c89412', boots: '#5a6c78', glove: '#8a9aa6', refl: '#e8eef2', hair: '#b9702a', skin: '#f6cba6', skinLo: '#dca37c', trim: '#ffffff' },
};
const NIGHT: Partial<Pal> = { coat: '#2a3350', coatHi: '#4a5a8a', coatLo: '#161c33', trim: '#6ef0ff', refl: '#6ef0ff' };
const OUTC = 'rgba(22,14,32,0.82)';

interface Pose { bob: number; lean: number; nearLeg: [number, number, number, number]; farLeg: [number, number, number, number]; nearArm: [number, number, number]; farArm: [number, number, number]; wrench: 'belt' | 'held'; wAng: number; face: 'ok' | 'hurt' | 'open'; }
/** nogi: [kolanoX, kolanoY, stopaX, stopaY] jako ułamki długości nogi LL (Y) i jednostki (X); ramiona: [kąt°, zgięcie, —] (0° = w dół, 90° = do przodu, 180° = w górę) */
function pose(f0: HeroFrame, LL: number): Pose {
  const f = ALIAS[f0] ?? f0;
  const L = (y: number) => y * LL;
  switch (f) {
    case 'walk0': return { bob: 0.5, lean: 0.8, nearLeg: [2.2, L(0.52), 4.6, L(1) - 0.2], farLeg: [-1.6, L(0.5), -4.4, L(1) - 2.2], nearArm: [-38, 1.2, 0], farArm: [40, 1.5, 0], wrench: 'belt', wAng: 0, face: 'ok' };
    case 'walk1': return { bob: 0.5, lean: 0.8, nearLeg: [-1.8, L(0.5), -4.6, L(1) - 2.0], farLeg: [2.0, L(0.52), 4.4, L(1) - 0.2], nearArm: [40, 1.5, 0], farArm: [-38, 1.2, 0], wrench: 'belt', wAng: 0, face: 'ok' };
    case 'jump': return { bob: 0, lean: 1, nearLeg: [4, L(0.38), 3, L(0.9) - 1.5], farLeg: [-1, L(0.46), -4, L(0.95) - 1.5], nearArm: [150, 1, 0], farArm: [-160, 1, 0], wrench: 'belt', wAng: 0, face: 'open' };
    case 'fall': return { bob: 0, lean: 0.6, nearLeg: [3.2, L(0.5), 4.4, L(0.98) - 0.6], farLeg: [-2.6, L(0.5), -3.6, L(0.98) - 0.8], nearArm: [135, 1, 0], farArm: [-135, 1, 0], wrench: 'belt', wAng: 0, face: 'open' };
    case 'victory': return { bob: 0, lean: 0, nearLeg: [2.3, L(0.5), 2.6, L(1)], farLeg: [-2.2, L(0.5), -2.6, L(1)], nearArm: [128, 0.5, 0], farArm: [-30, 1, 0], wrench: 'belt', wAng: 0, face: 'open' };
    case 'crouch': return { bob: 5, lean: 1, nearLeg: [5, L(0.36), 5.4, L(0.78)], farLeg: [-3, L(0.36), -4.6, L(0.78)], nearArm: [50, 1, 0], farArm: [-40, 1, 0], wrench: 'belt', wAng: 0, face: 'ok' };
    case 'swim': return { bob: 0, lean: 1.5, nearLeg: [-1.5, L(0.5), -4.2, L(0.95) - 2.2], farLeg: [0.5, L(0.5), -1.6, L(1) - 0.8], nearArm: [118, 1.5, 0], farArm: [62, 1.5, 0], wrench: 'belt', wAng: 0, face: 'ok' };
    case 'attack': return { bob: 0, lean: 2.2, nearLeg: [3.6, L(0.5), 5.4, L(1)], farLeg: [-2.2, L(0.5), -4.4, L(1)], nearArm: [92, 0, 0], farArm: [-48, 1, 0], wrench: 'held', wAng: -0.25, face: 'open' };
    case 'climb0': return { bob: 0, lean: 0, nearLeg: [1.5, L(0.42), 1.5, L(0.95) - 3.5], farLeg: [-1.5, L(0.5), -1.5, L(1)], nearArm: [168, 1, 0], farArm: [128, 2, 0], wrench: 'belt', wAng: 0, face: 'ok' };
    case 'climb1': return { bob: 0, lean: 0, nearLeg: [1.5, L(0.5), 1.5, L(1)], farLeg: [-1.5, L(0.42), -1.5, L(0.95) - 3.5], nearArm: [128, 2, 0], farArm: [168, 1, 0], wrench: 'belt', wAng: 0, face: 'ok' };
    case 'hurt': return { bob: 0, lean: -2.2, nearLeg: [3.4, L(0.5), 5.2, L(1)], farLeg: [-2.6, L(0.5), -5, L(1)], nearArm: [-146, 1, 0], farArm: [-112, 1, 0], wrench: 'belt', wAng: 0, face: 'hurt' };
    default: return { bob: 0, lean: 0, nearLeg: [2.3, L(0.5), 2.4, L(1)], farLeg: [-2.2, L(0.5), -2.4, L(1)], nearArm: [9, 1, 0], farArm: [-9, 1, 0], wrench: 'belt', wAng: 0, face: 'ok' };
  }
}

type G = CanvasRenderingContext2D;
function limb(g: G, pts: [number, number][], w: number, fill: string, hi?: string): void {
  g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.strokeStyle = OUTC; g.lineWidth = w + 1.1; g.stroke();
  g.strokeStyle = fill; g.lineWidth = w; g.stroke();
  if (hi) { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x - w * 0.18, y - w * 0.12) : g.moveTo(x - w * 0.18, y - w * 0.12))); g.strokeStyle = hi; g.globalAlpha = 0.55; g.lineWidth = Math.max(0.5, w * 0.3); g.stroke(); g.globalAlpha = 1; }
}
function arm(g: G, sx: number, sy: number, AL: number, [deg, bend]: [number, number, number], sleeve: string, sleeveHi: string, glove: string): [number, number] {
  const a = (deg * Math.PI) / 180; const hx = sx + Math.sin(a) * AL, hy = sy + Math.cos(a) * AL;
  const mx = (sx + hx) / 2 + Math.cos(a) * bend, my = (sy + hy) / 2 - Math.sin(a) * bend;
  limb(g, [[sx, sy], [mx, my], [hx - Math.sin(a) * 1.6, hy - Math.cos(a) * 1.6]], 2.7, sleeve, sleeveHi);
  g.fillStyle = OUTC; g.beginPath(); g.arc(hx, hy, 2.15, 0, 7); g.fill();
  g.fillStyle = glove; g.beginPath(); g.arc(hx, hy, 1.7, 0, 7); g.fill();
  return [hx, hy];
}
function leg(g: G, hx: number, hy: number, [kx, ky, fx, fy]: [number, number, number, number], w: number, P: Pal, shadeK: number): void {
  limb(g, [[hx + kx * 0.2, hy], [hx + kx, hy + ky], [hx + fx, hy + fy - 1.6]], w, shade(P.coat, shadeK), P.coatHi);
  // but
  const bx = hx + fx, by = hy + fy;
  g.fillStyle = OUTC; g.beginPath(); g.ellipse(bx + 1.2, by - 1.1, 3.6, 2.3, 0, 0, 7); g.fill();
  const grd = g.createLinearGradient(0, by - 3, 0, by + 0.6); grd.addColorStop(0, '#59606e'); grd.addColorStop(1, P.boots);
  g.fillStyle = grd; g.beginPath(); g.ellipse(bx + 1.2, by - 1.1, 3.1, 1.8, 0, 0, 7); g.fill();
}

function wrench(g: G, x: number, y: number, ang: number, len: number, w: number): void {
  g.save(); g.translate(x, y); g.rotate(ang);
  const grd = g.createLinearGradient(0, -w, 0, w); grd.addColorStop(0, '#f1f5f9'); grd.addColorStop(0.55, '#b4bcc7'); grd.addColorStop(1, '#707a88');
  g.lineCap = 'round';
  g.beginPath(); g.moveTo(0, 0); g.lineTo(len, 0); g.strokeStyle = OUTC; g.lineWidth = w + 1.1; g.stroke();
  g.strokeStyle = grd; g.lineWidth = w; g.stroke();
  // łeb klucza z rozwarciem
  g.fillStyle = OUTC; g.beginPath(); g.arc(len, 0, w * 1.25 + 0.55, 0, 7); g.fill();
  g.fillStyle = grd; g.beginPath(); g.arc(len, 0, w * 1.25, 0, 7); g.fill();
  g.fillStyle = '#2a2236'; g.beginPath(); g.moveTo(len + w * 0.2, -w * 0.55); g.lineTo(len + w * 1.5, -w * 0.55); g.lineTo(len + w * 1.5, w * 0.55); g.lineTo(len + w * 0.2, w * 0.55); g.closePath(); g.fill();
  g.restore();
}

export function drawHero(brother: 'M' | 'D', frame: HeroFrame, big: boolean, night: boolean): Img {
  const { c, g } = hiCanvas(HERO_W, HERO_H);
  const P: Pal = { ...PAL[brother], ...(night ? NIGHT : {}) };
  const M = brother === 'M';
  const LL = (big ? 12.5 : 8.2) + (M ? -0.9 : 0.5), TL = (big ? 14 : 9.6) + (M ? -0.6 : 0.8), headH = (big ? 13 : 12.4) + (M ? 0.6 : 0);
  const tw = (M ? 7.3 : 4.7) + (big ? 0.5 : 0), lw = M ? 4.7 : 3.0;
  const po = pose(frame, LL);
  const cx = HERO_W / 2 + po.lean * 0.3, hipY = HERO_H - LL - 0.2 - (frame === 'walk0' || frame === 'walk1' ? 0 : 0);
  const topY = hipY - TL + po.bob;                    // linia barków
  const climbing = frame === 'climb0' || frame === 'climb1';

  // cień kontaktowy
  if (frame !== 'jump' && !climbing && frame !== 'swim') { g.fillStyle = 'rgba(0,0,0,0.22)'; g.beginPath(); g.ellipse(cx + 0.5, HERO_H - 0.6, 8.5, 1.5, 0, 0, 7); g.fill(); }

  // tylna ręka i noga
  arm(g, cx - 0.5, topY + 1.8, TL * 0.82, po.farArm, shade(P.coat, 0.78), P.coatHi, shade(P.glove, 0.8));
  leg(g, cx, hipY, po.farLeg, lw, P, 0.78);

  // torba z narzędziami (Darioosh) — za tułowiem, dynamicznie z boku
  if (!M) {
    const bx = cx - tw - 1.2, by = hipY - 2.2 + po.bob * 0.5;
    g.fillStyle = OUTC; g.beginPath(); g.roundRect(bx - 0.6, by - 0.6, 6.6, 7.8, 1.6); g.fill();
    const bg = g.createLinearGradient(bx, by, bx, by + 7); bg.addColorStop(0, '#b27b44'); bg.addColorStop(1, '#6f4524');
    g.fillStyle = bg; g.beginPath(); g.roundRect(bx, by, 5.6, 6.6, 1.2); g.fill();
    g.fillStyle = '#3d2614'; g.fillRect(bx, by + 1.6, 5.6, 0.9);
    g.fillStyle = '#d6dde5'; g.fillRect(bx + 1.2, by - 1.6, 1, 2); g.fillStyle = '#e8503a'; g.fillRect(bx + 3.2, by - 1.1, 1.1, 1.6);   // narzędzia wystające z torby
    g.fillStyle = OUTC; g.beginPath(); g.roundRect(bx + 4.4, by + 1.4, 3.4, 4.0, 0.9); g.fill(); g.fillStyle = '#5a6c78'; g.beginPath(); g.roundRect(bx + 4.8, by + 1.8, 2.6, 3.2, 0.7); g.fill(); g.fillStyle = '#7fe8c8'; g.fillRect(bx + 5.2, by + 2.2, 1.8, 1.1);   // miernik
  }

  // tułów
  g.save(); g.translate(0, po.bob);
  const hipW = tw * 0.9;
  const body = new Path2D();
  body.moveTo(cx - tw, topY + 1); body.quadraticCurveTo(cx - tw - 0.2, topY - 0.7, cx - tw + 2, topY - 0.7); body.lineTo(cx + tw - 2, topY - 0.7); body.quadraticCurveTo(cx + tw + 0.2, topY - 0.7, cx + tw, topY + 1);
  body.lineTo(cx + hipW, hipY + 1); body.lineTo(cx - hipW, hipY + 1); body.closePath();
  g.fillStyle = OUTC; g.save(); g.translate(0, 0); g.lineWidth = 1.2; g.strokeStyle = OUTC; g.stroke(body); g.restore();
  const tg = g.createLinearGradient(cx - tw, 0, cx + tw, 0); tg.addColorStop(0, P.coatLo); tg.addColorStop(0.3, P.coat); tg.addColorStop(0.62, P.coatHi); tg.addColorStop(1, P.coat);
  g.fillStyle = tg; g.fill(body);
  g.save(); g.clip(body);
  // odblaskowe pasy
  g.fillStyle = P.refl; g.globalAlpha = 0.92; g.fillRect(cx - tw - 1, topY + TL * 0.62, tw * 2 + 2, 1.35); g.fillRect(cx - tw - 1, topY + TL * 0.82, tw * 2 + 2, 0.8); g.globalAlpha = 1;
  g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(cx - tw - 1, topY + TL * 0.62 + 1.35, tw * 2 + 2, 0.7);
  // pas i klamra
  g.fillStyle = '#2f2a3a'; g.fillRect(cx - tw - 1, hipY - 1.7, tw * 2 + 2, 1.7);
  g.fillStyle = P.trim; g.fillRect(cx - 0.2, hipY - 1.7, M ? 3.2 : 1.8, 1.5); if (M) { g.fillStyle = '#2f2a3a'; g.beginPath(); g.moveTo(cx + 1.7, hipY - 1.6); g.lineTo(cx + 0.6, hipY - 0.7); g.lineTo(cx + 1.4, hipY - 0.7); g.lineTo(cx + 0.9, hipY - 0.1); g.lineTo(cx + 2.4, hipY - 1.0); g.lineTo(cx + 1.6, hipY - 1.0); g.closePath(); g.fill(); }
  // zamek
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(cx + 1.2, topY + 0.5, 0.6, TL * 0.62);
  // kołnierz
  g.fillStyle = P.coatLo; g.beginPath(); g.moveTo(cx - 2.6, topY - 0.7); g.lineTo(cx + 2.6, topY - 0.7); g.lineTo(cx, topY + 2.6); g.closePath(); g.fill();
  // identyfikator
  g.fillStyle = '#f4f7fa'; g.fillRect(cx + tw * 0.28, topY + 2.4, 2.8, 3.1); g.fillStyle = M ? '#2f6fd6' : '#f7c826'; g.fillRect(cx + tw * 0.28, topY + 2.4, 2.8, 0.9);
  g.restore();
  g.restore();

  // przednia noga
  g.save(); g.translate(0, 0);
  leg(g, cx, hipY, po.nearLeg, lw, P, 1);
  g.restore();

  // przednie ramię (+ klucz)
  g.save(); g.translate(0, po.bob);
  const WL = M ? 11.5 : 9.2, WW = M ? 1.9 : 1.5;
  if (po.wrench === 'belt') {
    wrench(g, cx + tw * 0.65, hipY - 0.6, 1.9 + (frame === 'walk0' ? 0.12 : frame === 'walk1' ? -0.12 : 0), WL * 0.62, WW * 0.9);
  }
  const hand = arm(g, cx + 0.5, topY + 1.8, TL * 0.82, po.nearArm, P.coat, P.coatHi, P.glove);
  if (po.wrench === 'held') wrench(g, hand[0] - 1, hand[1], po.wAng - 0.05, WL * 1.2, WW);
  g.restore();

  // głowa
  g.save(); g.translate(po.lean * 0.15, po.bob);
  const hy = topY - headH / 2 + 2.4, hr = M ? 7.3 : 6.4, hry = headH / 2 - 0.4;
  // włosy z tyłu
  g.fillStyle = OUTC; g.beginPath(); g.ellipse(cx - 1.8, hy + 1.3, hr + 0.7, hry + 0.4, 0, 0, 7); g.fill();
  g.fillStyle = P.hair; g.beginPath(); g.ellipse(cx - 2.2, hy + 1.3, hr - 0.4, hry - 0.5, 0, 0, 7); g.fill();
  // twarz
  g.fillStyle = OUTC; g.beginPath(); g.ellipse(cx + 0.9, hy + 1.6, hr - 0.6 + 0.6, hry - 0.9 + 0.6, 0, 0, 7); g.fill();
  const fg = g.createRadialGradient(cx + 2.4, hy + 0.4, 0.8, cx + 1, hy + 1.8, hr + 1); fg.addColorStop(0, shade(P.skin, 1.12)); fg.addColorStop(0.7, P.skin); fg.addColorStop(1, P.skinLo);
  g.fillStyle = fg; g.beginPath(); g.ellipse(cx + 0.9, hy + 1.6, hr - 0.6, hry - 0.9, 0, 0, 7); g.fill();
  // ucho
  g.fillStyle = P.skinLo; g.beginPath(); g.ellipse(cx - 3.4, hy + 2, 1.1, 1.6, 0, 0, 7); g.fill();
  // oczy
  const ex = cx + 3.3, ey = hy + 1.5;
  if (po.face === 'hurt') {
    g.strokeStyle = '#2a1f2e'; g.lineWidth = 0.8; g.lineCap = 'round';
    g.beginPath(); g.moveTo(ex - 1.4, ey - 1); g.lineTo(ex + 0.6, ey + 0.3); g.lineTo(ex - 1.4, ey + 1.2); g.stroke();
    g.beginPath(); g.moveTo(ex + 3.9, ey - 1); g.lineTo(ex + 2, ey + 0.3); g.lineTo(ex + 3.9, ey + 1.2); g.stroke();
  } else {
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(ex, ey, 1.35, 1.8, 0, 0, 7); g.ellipse(ex + 3.3, ey, 1.25, 1.7, 0, 0, 7); g.fill();
    g.fillStyle = '#1d1626'; g.beginPath(); g.ellipse(ex + 0.5, ey + 0.2, 0.8, 1.2, 0, 0, 7); g.ellipse(ex + 3.7, ey + 0.2, 0.75, 1.15, 0, 0, 7); g.fill();
    g.fillStyle = '#fff'; g.fillRect(ex + 0.2, ey - 0.6, 0.45, 0.45); g.fillRect(ex + 3.4, ey - 0.6, 0.45, 0.45);
  }
  // brwi
  g.strokeStyle = P.hair; g.lineWidth = M ? 1.0 : 0.8; g.lineCap = 'round';
  g.beginPath(); g.moveTo(ex - 1.6, ey - 2.2 + (po.face === 'hurt' ? 0.8 : 0)); g.lineTo(ex + 1.4, ey - 2.6 - (po.face === 'hurt' ? 0.8 : 0)); g.stroke();
  g.beginPath(); g.moveTo(ex + 2, ey - 2.6); g.lineTo(ex + 4.7, ey - 2.2 + (po.face === 'hurt' ? 0.8 : 0)); g.stroke();
  // nos
  g.fillStyle = shade(P.skin, 0.9); g.beginPath(); g.ellipse(cx + (M ? 7.8 : 7.0), hy + 3.1, M ? 2.0 : 1.2, M ? 1.7 : 1.0, 0, 0, 7); g.fill(); if (M) { g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.ellipse(cx + 7.4, hy + 2.5, 0.7, 0.5, 0, 0, 7); g.fill(); }
  // usta / zarost / okulary
  if (po.face === 'hurt' || po.face === 'open') { g.fillStyle = '#6e2030'; g.beginPath(); g.ellipse(cx + 5.2, hy + 5.4, 1.3, po.face === 'hurt' ? 1.5 : 1.0, 0, 0, 7); g.fill(); }
  else { g.strokeStyle = '#8c4a42'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(cx + 3.8, hy + 5.4); g.quadraticCurveTo(cx + 5.3, hy + 6.3, cx + 6.5, hy + 5.2); g.stroke(); }
  if (M) { g.fillStyle = 'rgba(74,44,28,0.55)'; g.beginPath(); g.ellipse(cx + 3.4, hy + 6.4, 4.4, 1.7, 0.1, 0, Math.PI); g.fill(); }
  else { g.fillStyle = 'rgba(214,120,100,0.35)'; g.beginPath(); g.ellipse(ex + 0.6, ey + 3.2, 1.4, 0.9, 0, 0, 7); g.fill(); g.strokeStyle = P.hair; g.lineWidth = 0.9; g.lineCap = 'round'; g.beginPath(); g.moveTo(ex + 2.2, ey - 3.3); g.quadraticCurveTo(ex + 3.8, ey - 4.7, ex + 5.4, ey - 3.0); g.stroke(); }  // uniesiona, ciekawska brew
  // kask roboczy: kopuła z dwoma żebrami, opaska i rondo dookoła, mały daszek z przodu
  const hrx = hr + 1.5, hTop = hy - hry + 1.9;
  const dome = (r: number, k: number) => { g.beginPath(); g.moveTo(cx + 0.2 - hrx * k, hTop + 2.2); g.bezierCurveTo(cx + 0.2 - hrx * k, hTop - 6.2 * k, cx + 0.2 + hrx * k, hTop - 6.2 * k, cx + 0.2 + hrx * k, hTop + 2.2); g.closePath(); void r; };
  g.fillStyle = OUTC; dome(0, 1.1); g.fill();
  const hg = g.createLinearGradient(cx - hrx, hTop - 4.5, cx + hrx, hTop + 2); hg.addColorStop(0, P.helmLo); hg.addColorStop(0.22, P.helm); hg.addColorStop(0.5, P.helmHi); hg.addColorStop(1, P.helm);
  g.fillStyle = hg; dome(0, 1); g.fill();
  g.save(); dome(0, 1); g.clip();
  g.fillStyle = shade(P.helm, 0.72); g.fillRect(cx - 0.6, hTop - 7, 1.5, 12); g.fillRect(cx - 3.6, hTop - 6, 1.0, 12); g.fillRect(cx + 2.9, hTop - 6, 1.0, 12);   // żebra
  g.fillStyle = 'rgba(255,255,255,0.42)'; g.beginPath(); g.ellipse(cx - 2.2, hTop - 1.6, 1.0, 2.6, -0.5, 0, 7); g.fill();                                  // odblask
  g.fillStyle = shade(P.helm, 0.66); g.fillRect(cx - hrx - 1, hTop + 0.4, hrx * 2 + 2, 1.5);                                                           // opaska
  g.restore();
  // rondo dookoła + daszek
  g.fillStyle = OUTC; g.beginPath(); g.roundRect(cx - hrx - 1.5, hTop + 1.1, hrx * 2 + 7.2, 3.0, 1.4); g.fill();
  const rg = g.createLinearGradient(0, hTop + 1.2, 0, hTop + 3.8); rg.addColorStop(0, P.helmHi); rg.addColorStop(0.5, P.helm); rg.addColorStop(1, P.helmLo);
  g.fillStyle = rg; g.beginPath(); g.roundRect(cx - hrx - 0.9, hTop + 1.6, hrx * 2 + 6, 1.9, 0.9); g.fill();
  g.restore();
  return c;
}

export { shade };
