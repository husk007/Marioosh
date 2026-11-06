/** Grafika proceduralna: wszystkie sprite'y są rysowane w kodzie (Pix) i cache'owane. Bez plików graficznych. */
import { Img, Pix, makeCanvas, shade, mix } from '../engine/gfx';
import { Rng } from '../engine/rng';
import { WORLDS, type WorldTheme } from '../data/worlds';
import type { BossId } from '../data/worlds';
import type { CableColor, EnemyKind, ItemKind, SwitchStyle } from '../game/types';
import { VH, VW } from '../game/constants';

const cache = new Map<string, Img>();
function memo(key: string, make: () => Img): Img {
  let v = cache.get(key);
  if (!v) { v = make(); cache.set(key, v); }
  return v;
}

export const OUT = '#1b1424';
const SKIN = '#f2c29b';

// --------------------------------------------------------------------------- bohaterowie
export type HeroFrame = 'idle' | 'walk0' | 'walk1' | 'jump' | 'attack' | 'climb0' | 'climb1' | 'swim' | 'hurt';
export const HERO_W = 32, HERO_H = 48;

const HERO_COL = {
  M: { cap: '#d6403a', shirt: '#e9e2cf', overall: '#3a6fc2', hair: '#4a2e1f', letter: 'M', belt: '#f0c24a' },
  D: { cap: '#2f9e5a', shirt: '#f4c542', overall: '#7a3fb0', hair: '#c47a2c', letter: 'D', belt: '#e9e2cf' },
};

/** Rysuje bohatera. Stopy zawsze na dolnej krawędzi (y = HERO_H). */
export function heroSprite(brother: 'M' | 'D', frame: HeroFrame, big: boolean, night = false): Img {
  return memo(`hero:${brother}:${frame}:${big ? 1 : 0}:${night ? 1 : 0}`, () => {
    const c = HERO_COL[brother];
    const cap = night ? shade(c.cap, 0.45) : c.cap, overall = night ? '#222a44' : c.overall;
    const p = new Pix(HERO_W, HERO_H);
    const h = big ? 42 : 30;               // wysokość sylwetki
    const top = HERO_H - h;
    const cx = 16;
    const wide = brother === 'M' ? 1 : 0;  // M jest szerszy
    const bob = frame === 'walk0' ? 1 : 0;
    const legA = frame === 'walk0' ? 3 : frame === 'walk1' ? -3 : frame === 'jump' || frame === 'swim' ? 2 : 0;
    const bodyH = Math.round(h * 0.42), headH = Math.round(h * 0.34), legH = h - bodyH - headH;
    // nogi
    const legY = HERO_H - legH;
    const lw = 5 + wide;
    if (frame === 'climb0' || frame === 'climb1') {
      p.r(cx - lw - 1, legY + (frame === 'climb0' ? -2 : 1), lw, legH, overall).r(cx + 1, legY + (frame === 'climb0' ? 1 : -2), lw, legH, overall);
    } else {
      p.r(cx - lw - 1 + legA, legY - (legA > 0 ? 2 : 0), lw, legH + (legA > 0 ? 0 : 0), shade(overall, 0.85));
      p.r(cx + 1 - legA, legY - (legA < 0 ? 2 : 0), lw, legH, overall);
    }
    // buty
    p.r(cx - lw - 2 + legA, HERO_H - 4 - (legA > 0 ? 2 : 0), lw + 2, 4, '#3b2a22');
    p.r(cx + 1 - legA, HERO_H - 4 - (legA < 0 ? 2 : 0), lw + 3, 4, '#3b2a22');
    // tułów
    const by = HERO_H - legH - bodyH + bob;
    p.r(cx - 8 - wide, by, 16 + wide * 2, bodyH, overall);
    p.r(cx - 6 - wide, by, 12 + wide * 2, Math.round(bodyH * 0.45), c.shirt);
    p.r(cx - 8 - wide, by + bodyH - 4, 16 + wide * 2, 2, c.belt);
    p.r(cx - 4, by + 4, 2, 3, c.belt); p.r(cx + 2, by + 4, 2, 3, c.belt);       // guziki
    // ręce
    let armUp = false;
    if (frame === 'attack') {
      p.r(cx + 5, by + 2, 11, 4, SKIN);                         // wyciągnięta ręka
      p.r(cx + 15, by - 1, 12, 5, '#c9ced6'); p.r(cx + 24, by - 4, 5, 11, '#c9ced6'); p.r(cx + 26, by - 2, 3, 3, OUT); // klucz
      p.r(cx - 10 - wide, by + 3, 3, 8, SKIN);
    } else if (frame === 'jump' || frame === 'swim') { armUp = true; p.r(cx - 11 - wide, by - 3, 3, 9, SKIN).r(cx + 8 + wide, by - 3, 3, 9, SKIN); }
    else if (frame === 'climb0' || frame === 'climb1') { const up = frame === 'climb0'; p.r(cx - 11 - wide, by + (up ? -4 : 3), 3, 8, SKIN).r(cx + 8 + wide, by + (up ? 3 : -4), 3, 8, SKIN); }
    else if (frame === 'hurt') { p.r(cx - 12 - wide, by - 1, 3, 9, SKIN).r(cx + 9 + wide, by - 1, 3, 9, SKIN); }
    else { const sw = frame === 'walk0' ? 2 : frame === 'walk1' ? -2 : 0; p.r(cx - 11 - wide + sw, by + 2, 3, 9, SKIN).r(cx + 8 + wide - sw, by + 2, 3, 9, SKIN); }
    if (frame !== 'attack') p.r(cx + 8 + wide + (armUp ? 0 : 0), by + 10, 4, 3, '#c9ced6');   // klucz przy pasie (rączka)
    // głowa
    const hy = by - headH + 2;
    p.e(cx, hy + headH / 2, 8 + (big ? 1 : 0), headH / 2 + 1, SKIN);
    // czapka
    p.e(cx, hy + 2, 9, 5, cap).r(cx - 9, hy + 3, 18, 3, cap).r(cx + 3, hy + 3, 9, 3, shade(cap, 0.8));
    p.r(cx - 3, hy - 1, 6, 5, '#fff');
    // litera
    if (c.letter === 'M') { p.r(cx - 2, hy, 1, 4, cap).r(cx + 1, hy, 1, 4, cap).r(cx - 1, hy + 1, 2, 1, cap); }
    else { p.r(cx - 2, hy, 1, 4, cap).r(cx - 1, hy, 2, 1, cap).r(cx - 1, hy + 3, 2, 1, cap).r(cx + 1, hy + 1, 1, 2, cap); }
    // twarz
    const ey = hy + headH / 2 + 1;
    const dir = 1;
    if (frame === 'hurt') { p.r(cx - 1 + dir, ey - 1, 2, 2, OUT).r(cx + 3 + dir, ey - 1, 2, 2, OUT); p.r(cx + 1, ey + 3, 3, 2, '#7a2c2c'); }
    else { p.r(cx + 1 + dir, ey - 1, 2, 3, OUT).r(cx + 4 + dir, ey - 1, 2, 3, OUT); p.r(cx + 2, ey + 4, 3, 1, '#a0524a'); }
    p.r(cx + 6, ey + 1, 3, 3, mix(SKIN, '#d9826a', 0.6));    // nos
    // wąsy (M) / brwi (D)
    if (brother === 'M') p.r(cx, ey + 3, 8, 2, c.hair); else p.r(cx + 1, ey - 3, 7, 1, c.hair);
    p.r(cx - 9, hy + 4, 4, headH - 4, c.hair);
    p.outline(OUT);
    return p.c;
  });
}

// --------------------------------------------------------------------------- towarzysz (Bateria-Sprzężenie → latająca żarówka)
export function companionSprite(f: number): Img {
  return memo('comp:' + (f & 1), () => {
    const p = new Pix(16, 16);
    p.e(8, 7, 5, 5, '#fff3a0').e(8, 7, 3, 3, '#ffffff').r(6, 12, 4, 3, '#8d93a0');
    if (f & 1) { p.r(1, 6, 2, 2, '#ffe15a').r(13, 6, 2, 2, '#ffe15a'); } else { p.r(1, 4, 2, 2, '#ffe15a').r(13, 4, 2, 2, '#ffe15a'); }
    return p.outline(OUT).c;
  });
}

// --------------------------------------------------------------------------- wrogowie
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

function horn(p: Pix, x: number, y: number, dx: number, dy: number, col: string, s = 1): void {
  p.poly([[x, y], [x + 4 * s, y], [x + dx * s, y + dy * s]], col);
}

/** state: 0 = normalny, 1 = ogłuszony / odwrócony / schowany; f = klatka animacji (0/1) */
export function enemySprite(kind: EnemyKind, f: number, state: number): Img {
  return memo(`en:${kind}:${f & 1}:${state}`, () => {
    const L = LOOK[kind]; const p = new Pix(L.w + 6, L.h + 6); const ox = 3, oy = 3, w = L.w, h = L.h;
    const dark = shade(L.body, 0.7);
    const eye = (x: number, y: number, angry = true) => { p.r(x, y, 4, 4, '#fff').r(x + (angry ? 2 : 1), y + 1, 2, 3, OUT); if (angry) p.r(x - 1, y - 2, 6, 2, dark); };
    switch (L.arch) {
      case 'quad': case 'hop': {
        const leg = f & 1 ? 2 : 0;
        p.r(ox + 3, oy + h - 6 + leg, 5, 6 - leg, dark).r(ox + w - 9, oy + h - 6 + (leg ? 0 : 2), 5, 6 - (leg ? 0 : 2), dark);
        p.r(ox + 6, oy + h - 7, 5, 7, dark).r(ox + w - 12, oy + h - 7, 5, 7, dark);
        p.e(ox + w / 2 - 2, oy + h / 2 + 1, w / 2 - 2, h / 2 - 3, L.body).e(ox + w / 2 - 2, oy + h / 2 + 4, w / 3, h / 4, L.belly);
        p.e(ox + w - 8, oy + h / 2 - 3, 8, 7, L.body);
        if (state === 1) { horn(p, ox + w - 14, oy + 2, -3, 6, L.horn); horn(p, ox + w - 6, oy + 2, 3, 6, L.horn); }
        else { horn(p, ox + w - 13, oy + 6, 1, -8, L.horn, 1); horn(p, ox + w - 7, oy + 6, 3, -8, L.horn, 1); }
        eye(ox + w - 9, oy + h / 2 - 5);
        p.r(ox + w - 3, oy + h / 2, 3, 3, mix(L.body, '#000', 0.4));
        break;
      }
      case 'beetle': {
        if (state === 1) { p.e(ox + w / 2, oy + h / 2 + 2, w / 2 - 1, h / 2 - 3, L.belly).e(ox + w / 2, oy + h / 2 + 3, w / 3, h / 4, '#fff'); const t = f & 1 ? 3 : -3; p.l(ox + 4, oy + h - 4, ox + 1, oy + h - 8 + t, dark, 2).l(ox + w - 5, oy + h - 4, ox + w - 1, oy + h - 8 - t, dark, 2); horn(p, ox + 3, oy + h - 4, -2, 6, L.horn); }
        else {
          p.e(ox + w / 2 - 2, oy + h / 2 + 2, w / 2 - 2, h / 2 - 2, L.body).r(ox + w / 2 - 3, oy + 3, 1, h - 6, dark);
          p.l(ox + 5, oy + h - 2, ox + 3, oy + h + (f & 1 ? 2 : 0), dark, 2).l(ox + w - 9, oy + h - 2, ox + w - 7, oy + h + (f & 1 ? 0 : 2), dark, 2);
          p.e(ox + w - 5, oy + h / 2, 5, 6, shade(L.body, 0.85)); horn(p, ox + w - 6, oy + h / 2 - 6, 2, -10, L.horn, 1); eye(ox + w - 8, oy + h / 2 - 3);
        }
        break;
      }
      case 'fly': {
        const wing = f & 1 ? -5 : 4;
        p.e(ox + w / 2, oy + h / 2 + 2, w / 2 - 4, h / 2 - 5, L.body).e(ox + w / 2, oy + h / 2 + 4, w / 3 - 1, h / 4, L.belly);
        if (kind === 'pszczolrog') { p.r(ox + 8, oy + 5, 3, h - 10, '#3a2a10').r(ox + 14, oy + 5, 3, h - 10, '#3a2a10'); }
        p.poly([[ox + w / 2 - 3, oy + 5], [ox + w / 2 - 12, oy + wing], [ox + w / 2 + 1, oy + 8]], mix('#fff', L.body, 0.25));
        p.poly([[ox + w / 2 + 2, oy + 5], [ox + w / 2 + 12, oy + wing + 1], [ox + w / 2 + 6, oy + 9]], mix('#fff', L.body, 0.25));
        if (kind === 'krukorog') { p.r(ox + w - 7, oy + h / 2 - 1, 8, 3, '#e8c040'); p.poly([[ox + 2, oy + h / 2], [ox - 2, oy + h / 2 + 5], [ox + 6, oy + h / 2 + 4]], L.body); }
        if (kind === 'dron') { p.r(ox + 2, oy + h / 2 - 4, w - 4, 8, L.body).r(ox + w / 2 - 2, oy + h / 2 - 2, 4, 4, '#ff3a3a'); }
        p.e(ox + w - 7, oy + h / 2, 5, 5, L.body);
        if (kind !== 'dron') { horn(p, ox + w - 9, oy + h / 2 - 3, 0, -8, L.horn); horn(p, ox + w - 4, oy + h / 2 - 3, 3, -7, L.horn); eye(ox + w - 8, oy + h / 2 - 2); }
        break;
      }
      case 'swim': {
        const t = f & 1 ? 3 : -3;
        if (kind === 'osmiorog') {
          p.e(ox + w / 2, oy + h / 2 - 4, 11, 11, L.body);
          for (let i = 0; i < 6; i++) p.l(ox + 6 + i * 4, oy + h / 2 + 4, ox + 4 + i * 5 + (i % 2 ? t : -t), oy + h - 1, shade(L.body, 0.85), 3);
          horn(p, ox + w / 2 - 6, oy + 1, -2, -6, L.horn); horn(p, ox + w / 2 + 2, oy + 1, 2, -6, L.horn); eye(ox + w / 2 - 7, oy + h / 2 - 8); eye(ox + w / 2 + 1, oy + h / 2 - 8);
        } else {
          p.e(ox + w / 2, oy + h / 2, w / 2 - 2, h / 2 - 3, L.body).e(ox + w / 2 + 1, oy + h / 2 + 3, w / 3, h / 5, L.belly);
          p.poly([[ox + 1, oy + h / 2], [ox - 2, oy + h / 2 - 7 + t], [ox + 7, oy + h / 2 - 1]], dark).poly([[ox + 1, oy + h / 2], [ox - 2, oy + h / 2 + 7 - t], [ox + 7, oy + h / 2 + 1]], dark);
          horn(p, ox + w - 12, oy + 2, 2, -6, L.horn); eye(ox + w - 9, oy + h / 2 - 4);
        }
        break;
      }
      case 'plant': {
        const sway = f & 1 ? 1 : -1;
        if (kind === 'rogoroza') {
          p.r(ox + w / 2 - 2, oy + h - 14, 4, 14, L.body); p.poly([[ox + w / 2, oy + h - 8], [ox + 2, oy + h - 14], [ox + w / 2 - 3, oy + h - 5]], L.body);
          if (state === 1) { p.e(ox + w / 2, oy + 12, 9, 9, shade(L.belly, 0.7)); for (let i = 0; i < 4; i++) horn(p, ox + 4 + i * 5, oy + 4, 0, -4, L.horn); }
          else { for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2; p.e(ox + w / 2 + Math.cos(a) * 8, oy + 12 + Math.sin(a) * 8, 4, 4, L.belly); } p.e(ox + w / 2, oy + 12, 5, 5, '#ffd05a'); eye(ox + w / 2 - 3, oy + 10); }
        } else if (kind === 'rogopnacze') {
          const ext = state === 1 ? 4 : 0;
          for (let i = 0; i < 6; i++) p.e(ox + w / 2 + (i % 2 ? sway : -sway), oy + h - 4 - i * 6 - ext, 4, 4, L.body);
          p.e(ox + w / 2, oy + h - 4, 8, 4, shade(L.body, 0.7)); p.e(ox + w / 2, oy + 6 + (state === 1 ? 6 : 0), 6, 6, L.body); horn(p, ox + w / 2 - 6, oy + 4, -1, -6, L.horn); horn(p, ox + w / 2 + 1, oy + 4, 2, -6, L.horn); eye(ox + w / 2 - 3, oy + 5 + (state === 1 ? 6 : 0));
        } else {
          p.e(ox + w / 2, oy + h / 2 + 2, w / 2 - 3, h / 2 - 2, L.body); p.r(ox + 1, oy + h / 2 - 2 + sway, 4, 12, L.body).r(ox + w - 6, oy + h / 2 - 4 - sway, 4, 12, L.body);
          if (state === 0) for (let i = 0; i < 10; i++) p.r(ox + 5 + (i % 3) * 7, oy + 4 + Math.floor(i / 3) * 8, 2, 4, '#f4f0d0');
          horn(p, ox + w / 2 - 3, oy - 1, 0, -2, L.horn); p.e(ox + w / 2, oy + 1, 3, 3, '#e8507a'); eye(ox + w / 2 - 6, oy + h / 2 - 4);
        }
        break;
      }
      case 'snail': {
        p.e(ox + w / 2 - 4, oy + h - 7, w / 2 - 2, 6, L.belly).e(ox + 10, oy + 9, 9, 9, L.body).e(ox + 10, oy + 9, 5, 5, shade(L.body, 0.8));
        p.e(ox + w - 5, oy + h - 9, 5, 6, L.belly); eye(ox + w - 7, oy + h - 13, true);
        if (state === 1) { p.e(ox + w / 2, oy + h - 5, w / 2, 4, L.belly); } else { horn(p, ox + w - 8, oy + h - 17, 0, -7, L.horn); horn(p, ox + w - 3, oy + h - 17, 3, -7, L.horn); }
        break;
      }
      case 'rock': {
        p.r(ox + 4, oy + h - 6, 8, 6, dark).r(ox + w - 12, oy + h - 6 + (f & 1 ? 0 : 1), 8, 6, dark);
        p.poly([[ox + 2, oy + h - 6], [ox + 6, oy + 4], [ox + w - 8, oy + 2], [ox + w - 2, oy + h - 8], [ox + w - 4, oy + h - 5]], state === 1 ? L.belly : L.body);
        if (state === 0) { p.l(ox + 10, oy + 6, ox + 14, oy + 16, dark, 2).l(ox + 22, oy + 5, ox + 20, oy + 18, dark, 2); p.r(ox + 6, oy + 10, w - 14, 3, shade(L.body, 1.15)); }
        p.e(ox + w - 8, oy + h / 2, 7, 7, L.belly); horn(p, ox + w - 12, oy + h / 2 - 5, 0, -8, L.horn); horn(p, ox + w - 6, oy + h / 2 - 5, 3, -8, L.horn); eye(ox + w - 10, oy + h / 2 - 3);
        break;
      }
    }
    return p.outline(OUT).c;
  });
}

// --------------------------------------------------------------------------- bossowie
export const BOSS_SIZE: Record<BossId, { w: number; h: number }> = {
  '': { w: 0, h: 0 }, rogomir: { w: 72, h: 64 }, zlomotaur: { w: 80, h: 72 }, kaktogor: { w: 72, h: 80 }, rogopletw: { w: 84, h: 56 },
  ceratopsor: { w: 88, h: 64 }, krukorog: { w: 84, h: 70 }, rogodron: { w: 80, h: 64 }, katoblepas: { w: 90, h: 72 },
};
const BOSS_COL: Record<string, { body: string; accent: string }> = {
  rogomir: { body: '#7a5a8a', accent: '#f0d060' }, zlomotaur: { body: '#8a8f98', accent: '#e08a3a' }, kaktogor: { body: '#3e8f4a', accent: '#f06a9a' },
  rogopletw: { body: '#2f6fb0', accent: '#8ae6f0' }, ceratopsor: { body: '#a58f79', accent: '#a65cdb' }, krukorog: { body: '#2a2c4a', accent: '#ffe58a' },
  rogodron: { body: '#5c7381', accent: '#ff8c58' }, katoblepas: { body: '#4a1f33', accent: '#db4269' },
};
export function bossSprite(id: BossId, f: number, mode: number): Img {
  return memo(`boss:${id}:${f & 1}:${mode}`, () => {
    const { w, h } = BOSS_SIZE[id]; const c = BOSS_COL[id] ?? { body: '#888', accent: '#fff' };
    const p = new Pix(w, h); const dark = shade(c.body, 0.7), light = shade(c.body, 1.25);
    const step = f & 1 ? 3 : 0;
    const flying = id === 'krukorog' || id === 'rogodron';
    if (!flying) { p.r(8, h - 14, 14, 14 - step, dark).r(w - 30, h - 14, 14, 11 + step, dark).r(24, h - 14, 14, 14, dark); }
    p.e(w / 2 - 4, h / 2 + 2, w / 2 - 8, h / 2 - 12, c.body).e(w / 2 - 4, h / 2 + 8, w / 3, h / 5, light);
    p.e(w - 18, h / 2 - 6, 16, 16, c.body);
    // rogi
    const hs = mode === 2 ? 0.6 : 1;
    p.poly([[w - 30, h / 2 - 16], [w - 22, h / 2 - 16], [w - 28, Math.round(h / 2 - 16 - 26 * hs)]], c.accent);
    p.poly([[w - 16, h / 2 - 18], [w - 8, h / 2 - 16], [w - 8, Math.round(h / 2 - 16 - 24 * hs)]], c.accent);
    if (id === 'ceratopsor') p.e(w - 26, h / 2 - 12, 20, 18, shade(c.body, 0.9));
    if (id === 'zlomotaur' || id === 'rogodron') for (let i = 0; i < 5; i++) p.r(14 + i * 10, h / 2 - 8 + (i % 2) * 4, 6, 3, c.accent);
    if (id === 'kaktogor') for (let i = 0; i < 8; i++) p.r(10 + i * 7, 4 + (i % 3) * 6, 2, 5, '#f4f0d0');
    if (id === 'rogopletw') p.poly([[2, h / 2], [-2, 4], [14, h / 2 - 6]], dark).poly([[2, h / 2], [-2, h - 6], [14, h / 2 + 6]], dark);
    if (flying) { const wing = f & 1 ? -8 : 10; p.poly([[w / 2 - 14, h / 2 - 4], [w / 2 - 38, h / 2 - wing - 10], [w / 2 + 6, h / 2 + 4]], dark).poly([[w / 2 + 4, h / 2 - 4], [w / 2 + 30, h / 2 - wing - 10], [w / 2 + 14, h / 2 + 6]], dark); }
    // oko
    const hurt = mode === 1;
    p.r(w - 24, h / 2 - 8, 10, 10, hurt ? '#ffcccc' : '#fff').r(w - 20, h / 2 - 6, 5, 7, hurt ? '#a00' : OUT);
    p.r(w - 26, h / 2 - 12, 13, 3, dark);
    p.r(w - 12, h / 2 + 4, 10, 3, mix(c.body, '#000', 0.5));
    return p.outline(OUT).c;
  });
}

// --------------------------------------------------------------------------- przedmioty
export const ITEM_SIZE = 20;
export function itemSprite(kind: ItemKind, f = 0): Img {
  return memo(`item:${kind}:${f & 1}`, () => {
    const p = new Pix(ITEM_SIZE, ITEM_SIZE); const s = f & 1;
    switch (kind) {
      case 'pet': p.r(8, 1, 4, 3, '#dfe8f0').r(6, 4, 8, 14, '#7fd6c0').r(7, 6, 2, 10, '#d8fff6').r(6, 10, 8, 2, '#2f9e8a'); break;
      case 'can': p.r(5, 3, 10, 15, '#c9ced6').r(5, 3, 10, 2, '#8d93a0').r(5, 16, 10, 2, '#8d93a0').r(7, 6, 6, 7, '#e0584a').r(6, 5, 2, 12, '#f2f4f8'); break;
      case 'golden': p.r(5, 3, 10, 15, '#f0c030').r(5, 3, 10, 2, '#c8901a').r(5, 16, 10, 2, '#c8901a').r(7, 6, 6, 7, '#fff2a0').r(6, 5, 2, 12, '#fff8d0'); if (s) { p.r(1, 2, 2, 2, '#fff').r(17, 12, 2, 2, '#fff'); } else { p.r(16, 2, 2, 2, '#fff').r(2, 13, 2, 2, '#fff'); } break;
      case 'battery': p.r(4, 4, 12, 14, '#3fbf5a').r(8, 1, 4, 3, '#8d93a0').r(6, 7, 8, 2, '#d8ffd0').r(9, 10, 2, 5, '#d8ffd0').r(4, 4, 2, 14, '#2a8f40'); break;
      case 'crystal': p.poly([[10, 1], [17, 8], [10, 19], [3, 8]], '#8ad6ff').poly([[10, 1], [10, 19], [3, 8]], '#5aa8e6').r(8, 6, 2, 3, '#fff'); break;
      case 'shard': p.poly([[10, 1], [16, 10], [12, 19], [6, 12], [4, 6]], '#e8406a').poly([[10, 1], [12, 19], [6, 12]], '#a82a50').r(8, 6, 2, 3, '#ffb0c0'); break;
      case 'signet': p.e(10, 10, 8, 8, '#c8a050').e(10, 10, 5, 5, '#6a1f33').r(9, 7, 2, 6, '#ffd070').r(7, 9, 6, 2, '#ffd070'); break;
      case 'note': p.r(3, 2, 14, 16, '#f4ecd0').r(5, 5, 10, 1, '#8a7a5a').r(5, 8, 10, 1, '#8a7a5a').r(5, 11, 7, 1, '#8a7a5a').r(13, 13, 3, 3, '#d6403a'); break;
      case 'xl': p.e(10, 9, 8, 7, '#e8503a').r(5, 12, 10, 6, '#f4ecd0').r(7, 5, 3, 3, '#fff').r(12, 7, 3, 3, '#fff'); break;
      case 'coil': p.r(8, 1, 4, 18, '#8d93a0'); for (let i = 0; i < 4; i++) p.r(5, 3 + i * 4, 10, 2, '#e8a03a'); p.r(8, 0, 4, 2, '#7fd6ff'); if (s) p.r(14, 3, 3, 2, '#7fd6ff'); break;
      case 'magnet': p.r(3, 4, 5, 13, '#d6403a').r(12, 4, 5, 13, '#d6403a').r(3, 2, 14, 4, '#d6403a').r(3, 14, 5, 3, '#e8e8f0').r(12, 14, 5, 3, '#e8e8f0').r(8, 6, 4, 3, '#fff'); break;
      case 'extender': p.r(2, 8, 16, 4, '#c9ced6').r(2, 6, 3, 8, '#e8a03a').r(15, 6, 3, 8, '#e8a03a').r(8, 3, 4, 2, '#7fd6ff').r(8, 15, 4, 2, '#7fd6ff'); break;
      case 'gloves': p.r(5, 8, 10, 9, '#e8a03a').r(5, 4, 2, 5, '#e8a03a').r(8, 3, 2, 5, '#e8a03a').r(11, 3, 2, 5, '#e8a03a').r(14, 5, 2, 4, '#e8a03a').r(5, 15, 10, 3, '#8d93a0'); break;
      case 'star': p.poly([[10, 1], [12, 7], [19, 7], [13, 11], [16, 18], [10, 13], [4, 18], [7, 11], [1, 7], [8, 7]], s ? '#fff27a' : '#ffd23f').e(10, 10, 2, 2, '#fff'); break;
    }
    return p.outline(OUT).c;
  });
}

// --------------------------------------------------------------------------- obiekty
export function crateSprite(hidden: boolean, used: boolean): Img {
  return memo(`crate:${hidden ? 1 : 0}:${used ? 1 : 0}`, () => {
    const p = new Pix(32, 32); const c = used ? '#6a5a48' : hidden ? '#8c7ad0' : '#d89a3a';
    p.r(1, 1, 30, 30, c).r(1, 1, 30, 3, shade(c, 1.25)).r(1, 28, 30, 3, shade(c, 0.7)).r(1, 1, 3, 30, shade(c, 1.1));
    if (!used) { p.r(13, 8, 6, 3, '#fff').r(15, 11, 3, 4, '#fff').r(15, 17, 3, 3, '#fff'); } else p.r(6, 6, 20, 20, shade(c, 0.85));
    return p.outline(OUT).c;
  });
}
export const CABLE_COL: Record<CableColor, string> = { blue: '#3a8de0', green: '#3fbf5a', yellow: '#f0c030', red: '#e0443a', purple: '#9a5ad8', black: '#3a3446' };
export function cableSprite(color: CableColor, face: 'up' | 'down', pulse: number): Img {
  return memo(`cable:${color}:${face}:${pulse & 1}`, () => {
    const p = new Pix(32, 32); const c = CABLE_COL[color];
    p.r(2, 10, 28, 22, shade(c, 0.75)).r(2, 10, 28, 4, c).r(0, 6, 32, 6, c).r(0, 6, 32, 2, shade(c, 1.3));
    p.r(6, 12, 20, 6, '#0d0a14');                          // otwór
    p.r(5, 20, 3, 10, shade(c, 1.2)); p.r(24, 20, 3, 10, shade(c, 0.6));
    if (pulse & 1) { p.r(12, 13, 8, 2, '#fff7a0'); }
    if (face === 'down') { const q = new Pix(32, 32); q.g.translate(0, 32); q.g.scale(1, -1); q.g.drawImage(p.c, 0, 0); return q.c; }
    return p.outline(OUT).c;
  });
}
export function statueSprite(cracked: boolean, idx: number): Img {
  return memo(`statue:${cracked ? 1 : 0}:${idx % 3}`, () => {
    const p = new Pix(32, 44); const tone = cracked ? '#b8b0a0' : '#8f8f98';
    p.r(6, 38, 20, 6, '#6a6a72');
    p.e(16, 28, 9, 11, tone).e(16, 12, 8, 8, tone);
    p.poly([[10, 6], [13, 6], [11, 0]], '#d8d0c0').poly([[19, 6], [22, 6], [21, 0]], '#d8d0c0');
    p.r(11, 11, 3, 3, '#4a4a52').r(18, 11, 3, 3, '#4a4a52'); p.r(13, 17, 6, 2, '#4a4a52');
    p.r(4 + (idx % 3) * 2, 22, 5, 12, tone).r(23, 20, 5, 12, tone);
    p.l(14, 22, 18, 34, '#5a5a62').l(18, 34, 15, 38, '#5a5a62');
    if (cracked) p.l(12, 6, 20, 30, '#2a2a30', 2);
    return p.outline(OUT).c;
  });
}
export function freedSprite(): Img {
  return memo('freed', () => {
    const p = new Pix(32, 44);
    p.e(16, 28, 9, 11, '#e8b890').e(16, 12, 8, 8, '#e8b890'); p.poly([[10, 6], [13, 6], [11, 0]], '#f4ecd0').poly([[19, 6], [22, 6], [21, 0]], '#f4ecd0');
    p.r(11, 11, 3, 4, OUT).r(18, 11, 3, 4, OUT).r(13, 18, 6, 2, '#a0524a'); p.r(4, 22, 5, 12, '#e8b890').r(23, 18, 5, 14, '#e8b890'); p.r(8, 36, 6, 8, '#6a5a48').r(18, 36, 6, 8, '#6a5a48');
    return p.outline(OUT).c;
  });
}
export function checkpointSprite(on: boolean, f: number): Img {
  return memo(`cp:${on ? 1 : 0}:${f & 1}`, () => {
    const p = new Pix(24, 56); p.r(10, 8, 4, 48, '#8d93a0').r(8, 52, 8, 4, '#6a707c');
    p.poly([[14, 8], [14, 24], [on ? 26 : 24, 16]], on ? '#3fbf5a' : '#d6403a'); if (on && f & 1) p.r(18, 12, 3, 3, '#d8ffd0');
    p.e(12, 6, 4, 4, on ? '#fff27a' : '#6a707c');
    return p.outline(OUT).c;
  });
}
export function exitSprite(on: boolean, f: number): Img {
  return memo(`exit:${on ? 1 : 0}:${f & 1}`, () => {
    const p = new Pix(64, 84); p.r(4, 14, 56, 70, '#6a707c').r(10, 20, 44, 64, '#2a2c3a').r(4, 8, 56, 8, '#8d93a0');
    p.r(14, 26, 36, 6, on ? '#3fbf5a' : '#d6403a'); p.r(26, 40, 12, 40, on ? '#8aff9a' : '#4a2c3a');
    if (on) for (let i = 0; i < 5; i++) p.r(18 + i * 7, 42 + ((i + f) % 3) * 8, 3, 3, '#fff');
    p.r(24, 0, 16, 10, '#c9ced6').r(28, 2, 8, 4, on ? '#8aff9a' : '#ff6a5a');
    return p.outline(OUT).c;
  });
}
export function switchSprite(style: SwitchStyle, on: boolean): Img {
  return memo(`sw:${style}:${on ? 1 : 0}`, () => {
    const p = new Pix(28, 36); p.r(4, 24, 20, 12, '#6a707c').r(6, 22, 16, 4, '#8d93a0');
    switch (style) {
      case 'lever': p.l(14, 24, on ? 22 : 6, 6, '#c9ced6', 3).e(on ? 22 : 6, 6, 3, 3, on ? '#3fbf5a' : '#e0443a'); break;
      case 'valve': p.e(14, 14, 9, 9, '#c9ced6').e(14, 14, 5, 5, '#6a707c').r(13, 5, 2, 18, '#c9ced6').r(5, 13, 18, 2, '#c9ced6'); if (on) p.r(12, 12, 4, 4, '#3fbf5a'); break;
      case 'mirror': p.poly([[14, 4], [24, 14], [14, 24], [4, 14]], on ? '#bfe6f6' : '#7a8fa0'); p.l(14, 4, 14, 24, '#fff'); break;
      case 'relay': p.r(6, 6, 16, 16, '#3a3446').r(9, 9, 10, 4, on ? '#3fbf5a' : '#e0443a').r(9, 15, 10, 4, '#8d93a0'); break;
      case 'lamp': p.e(14, 12, 8, 8, on ? '#fff27a' : '#5a5a68').r(11, 18, 6, 6, '#8d93a0'); break;
      case 'rune': p.r(6, 4, 16, 18, '#4a4458').r(10, 7, 8, 2, on ? '#ffd23f' : '#8a7a9a').r(13, 7, 2, 12, on ? '#ffd23f' : '#8a7a9a').r(9, 15, 10, 2, on ? '#ffd23f' : '#8a7a9a'); break;
    }
    return p.outline(OUT).c;
  });
}
export function ecoportSprite(broken: boolean, f: number): Img {
  return memo(`eco:${broken ? 1 : 0}:${f & 1}`, () => {
    const p = new Pix(48, 64); p.r(4, 12, 40, 52, '#8d93a0').r(8, 16, 32, 44, '#2a2c3a').r(2, 6, 44, 8, '#c9ced6');
    p.e(24, 38, 11, 14, broken ? '#4a3a3a' : '#7fd6ff'); if (!broken && f & 1) p.e(24, 38, 6, 9, '#fff');
    if (broken) { p.l(14, 24, 34, 50, '#ffcc40', 2); p.r(18, 4, 4, 4, '#ff6a5a'); }
    return p.outline(OUT).c;
  });
}
export function lampSprite(f: number): Img {
  return memo('lamp:' + (f & 1), () => { const p = new Pix(16, 40); p.r(7, 8, 2, 32, '#6a707c').e(8, 6, 6, 6, '#fff3a0').e(8, 6, 3, 3, f & 1 ? '#fff' : '#ffe580'); return p.outline(OUT).c; });
}
export function lanternSprite(lit: boolean): Img {
  return memo('lantern:' + (lit ? 1 : 0), () => { const p = new Pix(20, 28); p.r(9, 0, 2, 5, '#6a707c').r(4, 5, 12, 3, '#8d93a0').r(5, 8, 10, 14, lit ? '#ffe580' : '#3a3a48').r(4, 22, 12, 3, '#8d93a0'); if (lit) p.r(8, 11, 4, 8, '#fff'); return p.outline(OUT).c; });
}
export function signSprite(symbol: number): Img {
  return memo('sign:' + symbol, () => {
    const p = new Pix(24, 32); p.r(11, 14, 3, 18, '#6a5a48').r(2, 2, 20, 16, '#4a4458').r(3, 3, 18, 14, '#6a6078');
    const gl = ['#ffd23f', '#7fd6ff', '#ff6a8a', '#8aff9a'][symbol % 4];
    if (symbol % 4 === 0) p.e(12, 10, 4, 4, gl); else if (symbol % 4 === 1) p.r(10, 5, 4, 10, gl).r(6, 8, 12, 4, gl); else if (symbol % 4 === 2) p.poly([[12, 4], [19, 15], [5, 15]], gl); else p.r(6, 5, 12, 10, gl).r(9, 8, 6, 4, '#6a6078');
    return p.outline(OUT).c;
  });
}
export function sparkSprite(f: number): Img {
  return memo('spark:' + (f & 3), () => { const p = new Pix(14, 14); p.e(7, 7, 5, 5, '#7fd6ff').e(7, 7, 3, 3, '#fff'); const k = f & 3; p.r(k < 2 ? 0 : 5, 6, 3, 2, '#bfe6ff').r(6, k % 2 ? 0 : 11, 2, 3, '#bfe6ff'); return p.c; });
}
export function pulseSprite(): Img { return memo('pulse', () => { const p = new Pix(12, 12); p.e(6, 6, 5, 5, '#ff8c58').e(6, 6, 3, 3, '#ffd0a0'); return p.outline(OUT).c; }); }
export function bubbleSprite(): Img { return memo('bubble', () => { const p = new Pix(10, 10); p.e(5, 5, 4, 4, '#bfe6f6'); p.r(3, 3, 2, 2, '#fff'); return p.c; }); }
export function rockSprite(): Img { return memo('rock', () => { const p = new Pix(18, 18); p.poly([[2, 14], [4, 4], [12, 2], [16, 10], [14, 16]], '#8a8a92').r(6, 6, 4, 3, '#b0b0ba'); return p.outline(OUT).c; }); }
export function shieldSprite(): Img { return memo('shield', () => { const p = new Pix(40, 52); for (let y = 0; y < 52; y++) { const t = Math.sin((y / 52) * Math.PI); const r = Math.round(18 * t) + 2; p.r(20 - r, y, 1, 1, '#7fd6ff').r(20 + r - 1, y, 1, 1, '#7fd6ff'); } p.e(20, 26, 17, 24, '#7fd6ff'); const g = p.g; g.globalCompositeOperation = 'destination-out'; p.e(20, 26, 15, 22, '#000'); g.globalCompositeOperation = 'source-over'; return p.c; }); }
export function heartIcon(kind: 'life' | 'pet' | 'can' | 'coil' | 'shield', alt = 'M'): Img {
  return memo(`icon:${kind}:${alt}`, () => {
    const p = new Pix(16, 16);
    switch (kind) {
      case 'life': p.e(8, 9, 6, 6, SKIN).e(8, 4, 7, 4, alt === 'M' ? '#d6403a' : '#2f9e5a').r(8, 5, 8, 2, alt === 'M' ? '#d6403a' : '#2f9e5a'); break;
      case 'pet': p.r(6, 1, 4, 2, '#dfe8f0').r(4, 3, 8, 12, '#7fd6c0'); break;
      case 'can': p.r(3, 2, 10, 13, '#c9ced6').r(5, 5, 6, 6, '#e0584a'); break;
      case 'coil': p.r(7, 1, 2, 14, '#8d93a0'); for (let i = 0; i < 3; i++) p.r(4, 3 + i * 4, 8, 2, '#e8a03a'); break;
      case 'shield': p.e(8, 8, 6, 7, '#7fd6ff').e(8, 8, 3, 4, '#fff'); break;
    }
    return p.outline(OUT).c;
  });
}

// --------------------------------------------------------------------------- kafelki
export interface TileSet { top: Img[]; fill: Img[]; oneway: Img; hazard: Img[]; ladder: Img; crumble: Img; cracked: Img; conv: [Img[], Img[]]; gate: Img; bgBlock: Img; cableBase: Img; }
const tileCache = new Map<number, TileSet>();

function rockFill(p: Pix, t: WorldTheme, rng: Rng, y0 = 0): void {
  const g = shade(t.ground, 1);
  p.r(0, y0, 32, 32 - y0, g);
  for (let i = 0; i < 9; i++) p.r(rng.int(0, 28), rng.int(y0, 28), rng.int(2, 5), rng.int(1, 3), shade(t.ground, rng.chance(0.5) ? 1.18 : 0.82));
}
export function tileset(world: number): TileSet {
  const hit = tileCache.get(world); if (hit) return hit;
  const t = WORLDS[world] ?? WORLDS[1]; const rng = new Rng('tiles:' + world);
  const top: Img[] = [], fill: Img[] = [];
  for (let v = 0; v < 3; v++) {
    const f = new Pix(32, 32); rockFill(f, t, rng); f.r(0, 0, 32, 1, shade(t.ground, 0.65)); fill.push(f.c);
    const q = new Pix(32, 32); rockFill(q, t, rng, 8);
    q.r(0, 0, 32, 9, t.groundTop).r(0, 7, 32, 3, shade(t.groundTop, 0.75));
    for (let x = 0; x < 32; x += 4) q.r(x, 9 + ((x / 4 + v) % 2) * 2, 3, 3 + (x % 8 ? 1 : 0), shade(t.groundTop, 0.75));
    for (let i = 0; i < 4; i++) q.r(rng.int(0, 28), rng.int(0, 5), rng.int(2, 4), 1, shade(t.groundTop, 1.3));
    if (t.deco === 'factory' || t.deco === 'scrap') { q.r(0, 0, 32, 3, shade(t.groundTop, 1.15)); q.r(4, 12, 3, 3, '#2a2c3a').r(25, 12, 3, 3, '#2a2c3a'); }
    top.push(q.c);
  }
  const ow = new Pix(32, 32); ow.r(0, 0, 32, 8, shade(t.groundTop, 1.05)).r(0, 7, 32, 2, shade(t.groundTop, 0.6)); for (let x = 2; x < 32; x += 8) ow.r(x, 9, 2, 3, '#0004'); ow.outline(OUT);
  const hz: Img[] = [];
  for (let f = 0; f < 2; f++) {
    const p = new Pix(32, 32);
    if (t.deco === 'factory' || t.deco === 'city' || t.id === 0) { p.r(0, 26, 32, 6, '#4a4458'); for (let i = 0; i < 4; i++) { const x = 3 + i * 8 + (f ? 1 : 0); p.l(x, 26, x + (i % 2 ? 4 : -2), 12 + (i % 2) * 6, '#7fd6ff', 2).l(x + (i % 2 ? 4 : -2), 12 + (i % 2) * 6, x + 3, 6 + f * 3, '#fff', 1); } }
    else { p.r(0, 28, 32, 4, '#5a5a62'); for (let i = 0; i < 4; i++) p.poly([[i * 8, 28], [i * 8 + 8, 28], [i * 8 + 4, 12]], '#c9ced6'); }
    hz.push(p.outline(OUT).c);
  }
  const ld = new Pix(32, 32); ld.r(6, 0, 3, 32, '#9a7a4a').r(23, 0, 3, 32, '#9a7a4a'); for (let y = 4; y < 32; y += 8) ld.r(6, y, 20, 3, '#b8945a'); ld.outline(OUT);
  const cr = new Pix(32, 32); cr.r(0, 0, 32, 12, shade(t.groundTop, 0.9)).r(0, 10, 32, 3, '#0005'); for (let x = 0; x < 32; x += 8) cr.l(x, 0, x + 4, 12, '#0006'); cr.outline(OUT);
  const ck = new Pix(32, 32); ck.r(0, 0, 32, 32, shade(t.ground, 0.9)); ck.l(6, 0, 14, 16, '#000', 2).l(14, 16, 8, 32, '#000', 2).l(24, 4, 20, 20, '#000', 2); ck.r(0, 0, 32, 1, OUT);
  const conv: [Img[], Img[]] = [[], []];
  for (let d = 0; d < 2; d++) for (let f = 0; f < 2; f++) {
    const p = new Pix(32, 32); p.r(0, 4, 32, 12, '#5a5a68').r(0, 4, 32, 3, '#8d93a0');
    for (let x = -4; x < 36; x += 8) { const xx = x + (f ? 4 : 0); p.poly(d === 0 ? [[xx + 6, 8], [xx + 1, 11], [xx + 6, 14]] : [[xx, 8], [xx + 5, 11], [xx, 14]], '#ffd23f'); }
    p.e(3, 22, 5, 5, '#3a3446').e(29, 22, 5, 5, '#3a3446'); conv[d].push(p.outline(OUT).c);
  }
  const gt = new Pix(32, 32); gt.r(2, 0, 28, 32, '#4a4458'); for (let y = 0; y < 32; y += 6) gt.r(2, y, 28, 2, '#2a2c3a'); gt.r(14, 0, 4, 32, '#ff8c58'); gt.outline(OUT);
  const bg = new Pix(32, 32); bg.r(0, 0, 32, 32, shade(t.ground, 0.55)); bg.r(0, 0, 32, 1, '#0003');
  const cb = new Pix(32, 32); cb.r(0, 0, 32, 32, shade(t.ground, 0.9));
  const set: TileSet = { top, fill, oneway: ow.c, hazard: hz, ladder: ld.c, crumble: cr.c, cracked: ck.c, conv, gate: gt.c, bgBlock: bg.c, cableBase: cb.c };
  tileCache.set(world, set); return set;
}

// --------------------------------------------------------------------------- tła (paralaksa)
export function skyImage(world: number, dark: boolean): Img {
  return memo(`sky:${world}:${dark ? 1 : 0}`, () => {
    const t = WORLDS[world] ?? WORLDS[1]; const p = new Pix(8, VH);
    for (let y = 0; y < VH; y++) p.r(0, y, 8, 1, mix(t.sky, t.sky2, y / VH));
    return p.c;
  });
}
export function parallaxLayer(world: number, layer: 0 | 1 | 2): Img {
  return memo(`bg:${world}:${layer}`, () => {
    const t = WORLDS[world] ?? WORLDS[1]; const rng = new Rng(`bg:${world}:${layer}`); const W = 640, H = VH; const p = new Pix(W + 120, H);
    const base = layer === 0 ? mix(t.sky2, t.dominant, 0.35) : layer === 1 ? mix(t.sky2, t.dominant, 0.6) : mix(t.sky2, shade(t.dominant, 0.5), 0.8);
    const horizon = layer === 0 ? 200 : layer === 1 ? 250 : 296;
    const deco = t.deco;
    // sylwety zależne od świata
    for (let x = 0; x < W; x += layer === 0 ? 64 : layer === 1 ? 40 : 28) {
      const hh = rng.int(layer === 0 ? 50 : 30, layer === 0 ? 110 : 80);
      const bx = x + rng.int(0, 16);
      switch (deco) {
        case 'forest': case 'jungle': p.r(bx + 8, horizon - hh + 8, 6, hh, shade(base, 0.8)); p.e(bx + 11, horizon - hh, 16 + layer * 2, 14 + layer * 2, base); break;
        case 'scrap': case 'factory': p.r(bx, horizon - hh, rng.int(20, 36), hh, base); if (rng.chance(0.4)) p.r(bx + 6, horizon - hh - 18, 6, 18, shade(base, 0.85)); p.r(bx + 3, horizon - hh + 6, 4, 4, shade(base, 1.2)); break;
        case 'ocean': p.e(bx + 10, horizon - hh / 2, 8 + layer * 3, hh / 2, base); p.r(bx + 9, horizon - 6, 3, 6, shade(base, 0.8)); break;
        case 'mountain': p.poly([[bx - 20, horizon], [bx + 14, horizon - hh - 20], [bx + 48, horizon]], base); p.poly([[bx + 14, horizon - hh - 20], [bx + 22, horizon - hh], [bx + 6, horizon - hh]], shade(base, 1.25)); break;
        case 'city': p.r(bx, horizon - hh - 20, rng.int(20, 34), hh + 20, base); for (let wy = horizon - hh - 14; wy < horizon - 6; wy += 10) for (let wx = bx + 4; wx < bx + 18; wx += 8) if (rng.chance(0.5)) p.r(wx, wy, 3, 4, t.accent); break;
        case 'horns': p.poly([[bx, horizon], [bx + 10, horizon - hh - 30], [bx + 22, horizon]], base); break;
        default: p.r(bx, horizon - hh / 2, 24, hh / 2, base);
      }
    }
    p.r(0, horizon, W + 120, H - horizon, layer === 2 ? shade(base, 0.9) : base);
    // szew: nadmiar za prawą krawędzią zawijamy na lewą stronę, by kafelkowanie było płynne
    const out = new Pix(W, H); out.g.drawImage(p.c, 0, 0); out.g.drawImage(p.c, W, 0, 120, H, 0, 0, 120, H);
    return out.c;
  });
}

export function vignette(): Img {
  return memo('vignette', () => {
    const c = makeCanvas(VW, VH), g = c.getContext('2d')!;
    const gr = g.createRadialGradient(VW / 2, VH / 2, VH * 0.35, VW / 2, VH / 2, VW * 0.62);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.55)'); g.fillStyle = gr; g.fillRect(0, 0, VW, VH); return c;
  });
}
export function glowImage(): Img {
  return memo('glow', () => {
    const c = makeCanvas(160, 160), g = c.getContext('2d')!;
    const gr = g.createRadialGradient(80, 80, 4, 80, 80, 80); gr.addColorStop(0, 'rgba(255,240,170,0.95)'); gr.addColorStop(1, 'rgba(255,240,170,0)'); g.fillStyle = gr; g.fillRect(0, 0, 160, 160); return c;
  });
}
export function titleLogo(w = 360): Img {
  return memo('logo' + w, () => {
    const p = new Pix(w, 70);
    p.r(0, 0, w, 70, 'rgba(0,0,0,0)');
    return p.c;
  });
}
