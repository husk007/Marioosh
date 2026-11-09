import type { Body, Grid } from './physics';
import type { MoveState } from './movement';
import type { Brother } from './constants';
import type { BossId } from '../data/worlds';
import type { CableColor, Dest, EnemyKind, ItemKind, Room, SwitchStyle } from './types';

export interface Upgrades { shield: boolean; coil: boolean; magnet: number; extender: number; gloves: number; star: number }
export const noUpgrades = (): Upgrades => ({ shield: false, coil: false, magnet: 0, extender: 0, gloves: 0, star: 0 });

export interface PlayerEnt {
  idx: 0 | 1;
  brother: Brother;
  mv: MoveState;
  upg: Record<Brother, Upgrades>;
  invuln: number;
  dead: boolean; deadT: number; downed: boolean;
  atk: { phase: 'none' | 'wind' | 'active'; t: number; cd: number; swing: number; hitList: Set<number> };
  sparks: number;
  petrify: number; petDelay: number; statue: number;
  tele: { t: number; dest: Dest | null; warp: string | null } | null;
  anim: number; hurtT: number; face: 1 | -1;
  respawn: { x: number; y: number };
  trail: { x: number; y: number }[];
  bounceHold: boolean;
  spawnProtect: number;
  /** punkty życia (v0.4: 3 + tarcza) i ostatnie bezpieczne miejsce (powrót po upadku w przepaść) */
  hp: number; safe: { x: number; y: number };
  /** powietrze w płucach (s) i licznik utonięcia */
  air: number; drownT: number;
}

export interface Enemy {
  id: number; kind: EnemyKind; b: Body; hp: number; maxHp: number; dir: 1 | -1;
  st: string; t: number; f: number; hx: number; hy: number;
  stun: number; dead: boolean; deadT: number; hornsUp: boolean; flip: boolean; hurt: number;
  a: number; c: number; d: number; lastSwing: number; grounded: boolean; flying: boolean;
}

export interface Item { id: string; kind: ItemKind; x: number; y: number; vy: number; taken: boolean; ghost: boolean; t: number; popT: number; fixed: boolean; vx?: number; home?: { x: number; y: number } }
export interface Crate { id: string; k: ItemKind; tx: number; ty: number; hidden: boolean; revealed: boolean; used: boolean; bump: number }
export interface CableEnt { id: string; color: CableColor; tx: number; ty: number; face: 'up' | 'down' | 'door'; dest?: Dest; warp?: string; locked: boolean; gate?: string; hidden: boolean; revealed: boolean; symbol?: number }
export interface StatueEnt { id: string; idx: number; x: number; y: number; freed: boolean; t: number; ghost: boolean }
export interface SwitchEnt { id: string; x: number; y: number; gate: string; style: SwitchStyle; symbol: number; on: boolean; latch: number }
export interface GateEnt { id: string; cells: [number, number][]; need: number; open: boolean; openT: number }
export interface Plat { x: number; y: number; w: number; mode: 'h' | 'v' | 'phase' | 'crumble'; range: number; speed: number; offset: number; dwell?: number; x0: number; y0: number; dx: number; dy: number; solid: boolean; t: number; fall: number; warn: boolean }
export interface Point { x: number; y: number }
export interface EcoEnt { id: string; x: number; y: number; broken: boolean; fuses: string[]; used: boolean; flash: number }
export interface Hint { x: number; w: number; key: string; shown: boolean }
export interface Current { x: number; y: number; w: number; h: number; fx: number; fy: number }
export interface Decor { k: string; x: number; y: number; hits: number; state: number }
export interface LanternEnt { id: string; x: number; y: number; lit: boolean }

export interface Projectile {
  kind: 'spark' | 'pulse' | 'needle' | 'rock' | 'scrap' | 'drone' | 'wave' | 'gust';
  x: number; y: number; vx: number; vy: number; life: number; bounces: number; owner: number; r: number; grav: number;
}
export interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; size: number; grav: number }
export interface Beam { x: number; y: number; dir: 1 | -1; len: number; t: number; warn: boolean; owner: number; angle?: number }

export interface RoomRT {
  room: Room; tiles: Uint8Array; grid: Grid;
  enemies: Enemy[]; items: Item[]; crates: Crate[]; cables: CableEnt[]; statues: StatueEnt[]; switches: SwitchEnt[]; gates: GateEnt[]; plats: Plat[];
  checkpoints: { x: number; y: number; on: boolean }[]; exits: { x: number; y: number }[]; ecos: EcoEnt[]; lamps: Point[]; lanterns: LanternEnt[];
  hints: Hint[]; currents: Current[]; rains: { x0: number; x1: number; interval: number }[]; decor: Decor[]; signs: { x: number; y: number; symbol: number }[];
  crumble: Map<number, { t: number; gone: boolean }>;
  water: Uint8Array;
  /** mosty zwodzone / pomosty: kafle pojawiają się, gdy wszystkie przełączniki bramy `gate` są włączone */
  spans: { gate: string; cells: [number, number][]; done: boolean }[];
  floods: { x0: number; x1: number; y0: number; y1: number; from: number; to: number; speed: number; gate: string; cur: number; open?: boolean; applied?: boolean }[];
  boss: BossRT | null;
}

export interface BossRT {
  id: BossId; b: Body; hp: number; maxHp: number; st: string; t: number; dir: 1 | -1; phase: number; hurt: number; dead: boolean; deadT: number;
  stun: number; f: number; x0: number; x1: number; floorY: number; data: Record<string, number>; armor: boolean; flying: boolean; cycle: number; started: boolean; hint: string;
}
