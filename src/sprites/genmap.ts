/**
 * Mapowanie obiektów gry na grafiki HD z biblioteki (patrz gen.ts). Każda funkcja zwraca undefined, gdy brak obrazu,
 * wtedy art.ts używa dotychczasowego sprite'a proceduralnego. Pozy, których jeszcze nie wygenerowano, są zastępowane
 * grafiką bazową z lekką deformacją (przysiad, rozciągnięcie, barwa), a po dodaniu pozy zaczynają jej używać automatycznie.
 */
import type { Img } from '../engine/gfx';
import type { BossId } from '../data/worlds';
import type { CableColor, EnemyKind, ItemKind } from '../game/types';
import { BOSS_SIZE } from './bosses';
import { LOOK } from './enemies';
import { HERO_H, HERO_W, type HeroFrame } from './hero';
import { ITEM_SIZE } from './objects';
import { firstGen, genFit, type FitOpt } from './gen';

const k = (id: string, state = 'base'): string => `${id}__${state}`;
const pad = (n: number): string => String(n).padStart(3, '0');

// --------------------------------------------------------------------------- bohaterowie
export function genHero(brother: 'M' | 'D', frame: HeroFrame, _big: boolean, night: boolean): Img | undefined {
  const id = brother === 'M' ? 'CHARACTERS-001' : 'CHARACTERS-002';
  const S = (...st: string[]): string | undefined => firstGen(...st.map((s) => k(id, s)));
  let key: string | undefined; const o: FitOpt = {};
  switch (frame) {
    case 'walk0': key = S('walk', 'base'); break;
    case 'walk1': key = S('idle', 'base'); o.sy = 0.985; break;
    case 'jump': key = S('jump_apex', 'jump_takeoff'); if (!key) { key = S('base'); o.sx = 0.95; o.sy = 1.04; } break;
    case 'fall': key = S('fall'); if (!key) { key = S('base'); o.sx = 0.95; o.sy = 1.04; } break;
    case 'attack': key = S('wrench_light', 'wrench_fast'); if (!key) { key = S('base'); o.rot = 7; } break;
    case 'climb0': key = S('climb_wire'); if (!key) { key = S('base'); } break;
    case 'climb1': key = S('climb_wire'); if (!key) { key = S('base'); } o.flip = true; break;
    case 'hurt': key = S('hurt'); if (!key) { key = S('base'); o.tint = ['#ff3a3a', 0.4]; } break;
    case 'crouch': key = S('crouch'); if (!key) { key = S('base'); o.sx = 1.1; o.sy = 0.84; } break;
    case 'victory': key = S('victory', 'base'); break;
    case 'swim': key = S('base'); o.rot = 72; break;
    case 'glide': key = S('glide', 'glide_umbrella'); if (!key) { key = S('base'); o.sx = 1.08; o.sy = 0.96; } break;
    case 'hang': key = S('ledge_hang', 'hang'); if (!key) { key = S('climb_wire', 'base'); } break;
    case 'wall': key = S('wall_slide'); if (!key) { key = S('base'); o.rot = -6; } break;
    case 'pound': key = S('ground_pound'); if (!key) { key = S('base'); o.sx = 0.92; o.sy = 1.12; } break;
    case 'roll0': case 'roll1': case 'roll2': case 'roll3': key = S('roll'); if (!key) { key = S('crouch', 'base'); o.sx = 1.18; o.sy = 0.62; o.rot = 0; } o.rot = (o.rot ?? 0) + (['roll0', 'roll1', 'roll2', 'roll3'].indexOf(frame)) * 90; break;
    default: key = S('idle', 'base');
  }
  if (!key) return undefined;
  if (night) o.tint = ['#2c3c78', 0.38];
  return genFit(key, HERO_W, HERO_H, { ss: 3, ...o });
}

export function genScarlet(state: number): Img | undefined {
  const st = ['idle', 'trapped', 'cast_shield', 'thank_you'][state] ?? 'idle';
  const key = firstGen(k('CHARACTERS-003', st), k('CHARACTERS-003', 'idle'), k('CHARACTERS-003'));
  return key ? genFit(key, 44, 64, { ss: 3 }) : undefined;
}

// --------------------------------------------------------------------------- wrogowie
const ENEMY_NO: Record<EnemyKind, number> = {
  rogus: 1, baranitor: 2, bykobieg: 3, zukorog: 4, cmorog: 5, pszczolrog: 6, rogowrobel: 7, krukorog: 8, gekorog: 9, bazalisk: 10, rogopletw: 11,
  osmiorog: 12, kakturozec: 13, rogopnacze: 14, rogoroza: 15, slimorog: 16, rogoskoczek: 17, kamienirog: 18, dron: 0,
};
/** grafiki zwrócone w lewo — odbijamy, bo gra zakłada postać zwróconą w prawo */
const ENEMY_LEFT = new Set<EnemyKind>(['bykobieg', 'pszczolrog', 'krukorog', 'slimorog']);
/** stan „unieruchomiony / schowany” ma własną grafikę tylko u trzech wrogów */
const ENEMY_STATE1: Partial<Record<EnemyKind, string>> = { zukorog: 'ENEMY_VARIANTS-001', slimorog: 'ENEMY_VARIANTS-004', rogoroza: 'ENEMY_VARIANTS-003' };

export function genEnemy(kind: EnemyKind, f: number, state: number): Img | undefined {
  const L = LOOK[kind], no = ENEMY_NO[kind];
  let key: string | undefined;
  if (kind === 'dron') key = firstGen(k('BOSSES-008'));
  else {
    const id = `ENEMIES-${pad(no)}`;
    if (state === 1 && ENEMY_STATE1[kind]) key = firstGen(k(ENEMY_STATE1[kind] as string));
    if (!key && kind === 'rogus') key = firstGen(k(id, f & 1 ? 'walk' : 'idle'));
    if (!key) key = firstGen(k(id));
  }
  if (!key) return undefined;
  const o: FitOpt = { ss: 3, flip: ENEMY_LEFT.has(kind) || (kind === 'dron'), wf: L.arch === 'plant' ? 1.7 : 1 };
  if (f & 1) { o.sx = 1.03; o.sy = 0.965; }
  if (state === 1 && !ENEMY_STATE1[kind] && kind !== 'rogus') { o.sy = 0.9; o.sx = 1.06; }
  return genFit(key, L.w + 6, L.h + 6, o);
}

// --------------------------------------------------------------------------- bossowie
const BOSS_NO: Record<Exclude<BossId, ''>, number> = { katoblepas: 1, rogomir: 2, zlomotaur: 3, kaktogor: 4, rogopletw: 5, ceratopsor: 6, krukorog: 7, rogodron: 8 };
const BOSS_EXPOSED: Partial<Record<BossId, string>> = { rogomir: 'BOSS_VARIANTS-003', zlomotaur: 'BOSS_VARIANTS-005', katoblepas: 'BOSS_VARIANTS-001' };

export function genBoss(id: BossId, f: number, mode: number): Img | undefined {
  if (!id) return undefined;
  let key: string | undefined;
  if (mode === 2 && BOSS_EXPOSED[id]) key = firstGen(k(BOSS_EXPOSED[id] as string));
  if (!key) key = firstGen(k(`BOSSES-${pad(BOSS_NO[id])}`));
  if (!key) return undefined;
  const S = BOSS_SIZE[id], o: FitOpt = { ss: 3, flip: id !== 'kaktogor', wf: 1.3 };
  if (f & 1) { o.sx = 1.02; o.sy = 0.97; }
  if (mode === 1) o.tint = ['#ffffff', 0.6];
  else if (mode === 2 && !BOSS_EXPOSED[id]) o.tint = ['#ffe27a', 0.25];
  return genFit(key, S.w, S.h, o);
}

// --------------------------------------------------------------------------- przedmioty i ikony
const ITEM_NO: Record<ItemKind, number> = {
  pet: 1, can: 3, golden: 5, xl: 6, coil: 7, magnet: 8, extender: 9, gloves: 10, star: 11, battery: 12, crystal: 13, shard: 14, signet: 15, note: 16,
};
export function genItem(kind: ItemKind, f: number): Img | undefined {
  const key = firstGen(k(`COLLECTIBLES-${pad(ITEM_NO[kind])}`)); if (!key) return undefined;
  return genFit(key, ITEM_SIZE, ITEM_SIZE, { ss: 4, anchor: 'center', ...(f & 1 ? { sx: 1.07, sy: 1.07 } : {}) });
}
export function genIcon(kind: 'life' | 'pet' | 'can' | 'coil' | 'shield', alt: string): Img | undefined {
  if (kind === 'life') {
    const key = firstGen(k(alt === 'M' ? 'CHARACTERS-001' : 'CHARACTERS-002', 'idle'), k(alt === 'M' ? 'CHARACTERS-001' : 'CHARACTERS-002'));
    return key ? genFit(key, 16, 16, { ss: 4, crop: { x: 0, y: 0, w: 1, h: 0.2 }, anchor: 'center' }) : undefined;
  }
  if (kind === 'shield') return undefined;
  return genItem(kind, 0);
}

// --------------------------------------------------------------------------- rekwizyty
const half = (i: 0 | 1, vertical: boolean): FitOpt['crop'] => (vertical ? { x: 0, y: i * 0.5, w: 1, h: 0.5 } : { x: i * 0.5, y: 0, w: 0.5, h: 1 });

export function genCheckpoint(on: boolean, f: number): Img | undefined {
  const key = firstGen(k('INTERACTABLES-002')); return key ? genFit(key, 24, 56, { ss: 3, crop: half(on ? 1 : 0, false), wf: 1.5, ...(on && f & 1 ? { sy: 1.02 } : {}) }) : undefined;
}
export function genExit(on: boolean, f: number): Img | undefined {
  const key = firstGen(k('INTERACTABLES-001')); return key ? genFit(key, 64, 84, { ss: 3, crop: half(on ? 1 : 0, true), wf: 1.9, ...(f & 1 ? { sy: 1.015 } : {}) }) : undefined;
}
export function genEcoport(broken: boolean, f: number): Img | undefined {
  const key = firstGen(k('INTERACTABLES-003')); return key ? genFit(key, 48, 64, { ss: 3, crop: half(broken ? 0 : 1, true), wf: 1.55, ...(f & 1 ? { sy: 1.015 } : {}) }) : undefined;
}
export function genSwitch(style: string, on: boolean): Img | undefined {
  if (style === 'lever') { const key = firstGen(k('INTERACTABLES-004')); return key ? genFit(key, 28, 36, { ss: 3, crop: half(on ? 0 : 1, true), wf: 1.4 }) : undefined; }
  if (style === 'mirror') { const key = firstGen(k('INTERACTABLES-018')); return key ? genFit(key, 28, 36, { ss: 3, ...(on ? {} : { tint: ['#20284a', 0.35] as [string, number] }) }) : undefined; }
  return undefined;
}
export function genStatue(cracked: boolean, idx: number): Img | undefined {
  const key = firstGen(k(`CIVILIANS-${pad(2 + 2 * (idx % 3))}`)); return key ? genFit(key, 32, 44, { ss: 3, ...(cracked ? { tint: ['#000000', 0.25] as [string, number] } : {}) }) : undefined;
}
export function genFreed(): Img | undefined { const key = firstGen(k('CIVILIANS-001', 'celebrate'), k('CIVILIANS-001', 'idle'), k('CIVILIANS-001')); return key ? genFit(key, 32, 44, { ss: 3 }) : undefined; }
export function genCrate(hidden: boolean, used: boolean): Img | undefined {
  const key = firstGen(k('INTERACTABLES-007')); return key ? genFit(key, 32, 32, { ss: 3, crop: half(hidden ? 0 : 1, false), anchor: 'center', ...(used ? { tint: ['#10121e', 0.55] as [string, number] } : {}) }) : undefined;
}
const CABLE_NO: Record<CableColor, number> = { blue: 1, green: 6, yellow: 11, red: 16, purple: 21, black: 26 };
export function genCable(color: CableColor, face: 'up' | 'down', pulse: number): Img | undefined {
  const key = firstGen(k(`CONDUITS-${pad(CABLE_NO[color])}`)); return key ? genFit(key, 36, 36, { ss: 3, rot: face === 'up' ? -90 : 90, ...(pulse & 1 ? { sx: 1.03 } : {}), anchor: face === 'up' ? 'bottom' : 'center' }) : undefined;
}
