/** Grafika proceduralna: wszystkie sprite'y są rysowane w kodzie (Pix) i cache'owane. Bez plików graficznych. */
import { Img, Pix, makeCanvas, shade, mix } from '../engine/gfx';
import { Rng } from '../engine/rng';
import { WORLDS, type WorldTheme } from '../data/worlds';
import type { BossId } from '../data/worlds';
import type { CableColor, EnemyKind, ItemKind, SwitchStyle } from '../game/types';
import { VH, VW } from '../game/constants';
import { drawHero, type HeroFrame } from './hero';
import { stylize } from './style';
import { drawItem, drawCrate, drawCable, drawIcon } from './objects';
import { drawBoss } from './bosses';
import { drawEnemy } from './enemies';
import { hdEnemySprite } from './hd';
import { genBoss, genCable, genCheckpoint, genCrate, genEcoport, genEnemy, genExit, genFreed, genHero, genIcon, genItem, genScarlet, genStatue, genSwitch } from './genmap';
import { drawBubble, drawCheckpoint, drawCompanion, drawEcoport, drawExit, drawFreed, drawLamp, drawLantern, drawPulse, drawRock, drawScarlet, drawSign, drawSpark, drawStatue, drawSwitch } from './props';

const cache = new Map<string, Img>();
function memo(key: string, make: () => Img): Img {
  let v = cache.get(key);
  if (!v) { v = make(); cache.set(key, v); }
  return v;
}

/** jak memo, ale wynik przechodzi przez stylizator (wygładzenie + światło, podwójna rozdzielczość) */
function memoHi(key: string, make: () => Img): Img { return memo(key, () => stylize(make())); }

export const OUT = '#1b1424';
const SKIN = '#f2c29b';

// --------------------------------------------------------------------------- bohaterowie (patrz hero.ts)
export { HERO_W, HERO_H, type HeroFrame } from './hero';
export function heroSprite(brother: 'M' | 'D', frame: HeroFrame, big: boolean, night = false): Img {
  return genHero(brother, frame, big, night) ?? memo(`hero:${brother}:${frame}:${big ? 1 : 0}:${night ? 1 : 0}`, () => drawHero(brother, frame, big, night));
}

// --------------------------------------------------------------------------- towarzysz (Bateria-Sprzężenie → latająca żarówka)
export function companionSprite(f: number): Img { return memo('comp2:' + (f & 1), () => drawCompanion(f)); }
// --------------------------------------------------------------------------- wrogowie
export { LOOK, type EnemyLook } from './enemies';
export function enemySprite(kind: EnemyKind, f: number, state: number): Img { return genEnemy(kind, f, state) ?? hdEnemySprite(kind) ?? memo(`en2:${kind}:${f & 1}:${state}`, () => drawEnemy(kind, f, state)); }

// --------------------------------------------------------------------------- bossowie
export { BOSS_SIZE } from './bosses';
export function bossSprite(id: BossId, f: number, mode: number): Img { return genBoss(id, f, mode) ?? memo(`boss2:${id}:${f & 1}:${mode}`, () => drawBoss(id, f, mode)); }

// --------------------------------------------------------------------------- przedmioty
export { ITEM_SIZE } from './objects';
export function itemSprite(kind: ItemKind, f = 0): Img { return genItem(kind, f) ?? memo(`item2:${kind}:${f & 1}`, () => drawItem(kind, f)); }

// --------------------------------------------------------------------------- obiekty
export function crateSprite(hidden: boolean, used: boolean): Img { return genCrate(hidden, used) ?? memo(`crate2:${hidden ? 1 : 0}:${used ? 1 : 0}`, () => drawCrate(hidden, used)); }
export { CABLE_COL } from './objects';
export function cableSprite(color: CableColor, face: 'up' | 'down', pulse: number): Img { return genCable(color, face, pulse) ?? memo(`cable2:${color}:${face}:${pulse & 1}`, () => drawCable(color, face, pulse)); }
export function statueSprite(cracked: boolean, idx: number): Img { return genStatue(cracked, idx) ?? memo(`statue2:${cracked ? 1 : 0}:${idx % 3}`, () => drawStatue(cracked, idx)); }
export function scarletSprite(state: number, f = 0): Img { return genScarlet(state) ?? memo(`scarlet:${state}:${f & 1}`, () => drawScarlet(state, f)); }
export function freedSprite(): Img { return genFreed() ?? memo('freed2', () => drawFreed()); }
export function checkpointSprite(on: boolean, f: number): Img { return genCheckpoint(on, f) ?? memo(`cp2:${on ? 1 : 0}:${f & 1}`, () => drawCheckpoint(on, f)); }
export function exitSprite(on: boolean, f: number): Img { return genExit(on, f) ?? memo(`exit2:${on ? 1 : 0}:${f & 1}`, () => drawExit(on, f)); }
export function switchSprite(style: SwitchStyle, on: boolean): Img { return genSwitch(style, on) ?? memo(`sw2:${style}:${on ? 1 : 0}`, () => drawSwitch(style, on)); }
export function ecoportSprite(broken: boolean, f: number): Img { return genEcoport(broken, f) ?? memo(`eco2:${broken ? 1 : 0}:${f & 1}`, () => drawEcoport(broken, f)); }
export function lampSprite(f: number): Img { return memo('lamp2:' + (f & 1), () => drawLamp(f)); }
export function lanternSprite(lit: boolean): Img { return memo('lantern2:' + (lit ? 1 : 0), () => drawLantern(lit)); }
export function signSprite(symbol: number): Img { return memo('sign2:' + symbol, () => drawSign(symbol)); }
export function sparkSprite(f: number): Img { return memo('spark2:' + (f & 3), () => drawSpark(f)); }
export function pulseSprite(): Img { return memo('pulse2', () => drawPulse()); }
export function bubbleSprite(): Img { return memo('bubble2', () => drawBubble()); }
export function rockSprite(): Img { return memo('rock2', () => drawRock()); }
export function shieldSprite(): Img { return memo('shield', () => { const p = new Pix(40, 52); for (let y = 0; y < 52; y++) { const t = Math.sin((y / 52) * Math.PI); const r = Math.round(18 * t) + 2; p.r(20 - r, y, 1, 1, '#7fd6ff').r(20 + r - 1, y, 1, 1, '#7fd6ff'); } p.e(20, 26, 17, 24, '#7fd6ff'); const g = p.g; g.globalCompositeOperation = 'destination-out'; p.e(20, 26, 15, 22, '#000'); g.globalCompositeOperation = 'source-over'; return p.c; }); }
export function heartIcon(kind: 'life' | 'pet' | 'can' | 'coil' | 'shield', alt = 'M'): Img { return genIcon(kind, alt) ?? memo(`icon2:${kind}:${alt}`, () => drawIcon(kind, alt)); }

// --------------------------------------------------------------------------- kafelki i tła (patrz scenery.ts)
export { tileset, skyImage, parallaxLayer, cloudLayer, TOP_PAD, type TileSet } from './scenery';

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
