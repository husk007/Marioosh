/**
 * Generator poziomów: zamienia szkielet z 05_LEVELS_v0_2.json (sekcje, budżety, posągi, checkpoint)
 * w pełną mapę kafelków. Generacja jest deterministyczna (ziarno = level_id), więc poziom jest taki sam
 * za każdym razem, a testy mogą go weryfikować. Poziom 1-1 jest zbudowany ręcznie wg tabeli z atlasu.
 */
import { Rng } from '../engine/rng';
import { BOSS_BY_WORLD, WORLDS, type BossId } from '../data/worlds';
import {
  ENEMY_BY_NAME, ENEMY_CLASS, T, type CableColor, type EnemyKind, type ItemKind, type LevelData, type LevelJson, type LevelMode, type Room, type Spec, type SwitchStyle,
} from './types';
import { TILE } from './constants';

const P = (t: number) => t * TILE;
export const ROWS = 16;

// ---------------------------------------------------------------- stół budowniczego
class RoomB {
  tiles: Uint8Array; water: Uint8Array; specs: Spec[] = [];
  constructor(public w: number, public h: number) { this.tiles = new Uint8Array(w * h); this.water = new Uint8Array(w * h); }
  inb(x: number, y: number) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
  set(x: number, y: number, t: number) { if (this.inb(x, y)) this.tiles[y * this.w + x] = t; }
  get(x: number, y: number) { return this.inb(x, y) ? this.tiles[y * this.w + x] : (y < 0 ? 0 : 1); }
  col(x: number, from: number, to = this.h - 1, t: number = T.SOLID) { for (let y = from; y <= to; y++) this.set(x, y, t); }
  ground(x0: number, x1: number, gy: number) { for (let x = x0; x < x1; x++) { this.col(x, 0, this.h - 1, T.EMPTY); this.col(x, gy, this.h - 1); } }
  gap(x0: number, x1: number) { for (let x = x0; x < x1; x++) this.col(x, 0, this.h - 1, T.EMPTY); }
  block(x0: number, y0: number, w: number, h: number, t: number = T.SOLID) { for (let x = x0; x < x0 + w; x++) for (let y = y0; y < y0 + h; y++) this.set(x, y, t); }
  oneway(x0: number, w: number, row: number) { for (let x = x0; x < x0 + w; x++) this.set(x, row, T.ONEWAY); }
  /** wiersz powierzchni (pierwszy kafelek lity lub jednokierunkowy od rows ≥ from) */
  surface(x: number, from = 7): number { for (let y = from; y < this.h; y++) { const t = this.get(x, y); if (t === T.SOLID || t === T.ONEWAY || t === T.CRUMBLE || t === T.CONVL || t === T.CONVR || t === T.CABLE || t === T.GATE || t === T.CRACKED) return y; } return -1; }
  toRoom(world: number, name: string, dark: boolean, spawn: { x: number; y: number }): Room {
    return { w: this.w, h: this.h, tiles: this.tiles, water: this.water, specs: this.specs, world, dark, name, spawn };
  }
}

export interface GenOpts { night?: boolean }

// ---------------------------------------------------------------- tabela stylów poziomów
interface Style { mode: LevelMode; dark?: boolean; water?: boolean; weights: Record<string, number>; switchStyle: SwitchStyle; cave?: boolean; rain?: number; hazardTop?: boolean }
const BASE: Record<string, number> = { flat: 3, gap: 3, stairs: 2, pit: 1, haz: 0, wall: 1, moving: 1, puzzle: 1, crumble: 0, phase: 0, conv: 0 };
const WORLD_WEIGHTS: Record<number, Partial<Record<string, number>>> = {
  1: { haz: 0, puzzle: 1, wall: 1 },
  2: { haz: 1, conv: 2, moving: 2 },
  3: { haz: 2, pit: 2, puzzle: 1 },
  4: { pit: 3, moving: 1, gap: 2, haz: 0 },
  5: { crumble: 3, gap: 3, haz: 1 },
  6: { gap: 4, stairs: 3, pit: 2, haz: 0 },
  7: { phase: 3, moving: 2, haz: 2, puzzle: 2 },
  8: { crumble: 1, phase: 1, haz: 2, moving: 1, puzzle: 2, gap: 3 },
};
const SWITCH_BY_WORLD: Record<number, SwitchStyle> = { 0: 'lever', 1: 'lever', 2: 'relay', 3: 'mirror', 4: 'valve', 5: 'rune', 6: 'lamp', 7: 'relay', 8: 'rune' };

function styleFor(id: string, world: number, stage: number): Style {
  const weights: Record<string, number> = { ...BASE, ...((WORLD_WEIGHTS[world] ?? {}) as Record<string, number>) };
  let mode: LevelMode = stage === 4 ? 'boss' : 'run';
  const s: Style = { mode, weights, switchStyle: SWITCH_BY_WORLD[world] ?? 'lever' };
  if (world === 6) s.dark = true;
  if (id === 'W4-L2' || id === 'W4-L3') { s.mode = 'water'; s.water = true; }
  if (id === 'W4-L4') { s.water = false; }
  if (id === 'W6-L2') s.mode = 'tower';
  if (id === 'W5-L2' || id === 'W8-L3' || id === 'W1-L2' || id === 'W7-L3') s.cave = true;
  if (id === 'W5-L3' || id === 'W8-L1') s.rain = id === 'W8-L1' ? 1.5 : 2.2;
  if (id === 'W7-L2') { s.weights = { ...weights, phase: 5, gap: 2 }; }
  if (id === 'W2-L2') { s.weights = { ...weights, conv: 4, puzzle: 2 }; }
  if (id === 'W2-L3') { s.weights = { ...weights, moving: 3, gap: 4, pit: 2 }; }
  if (id === 'W3-L3') { s.weights = { ...weights, puzzle: 3 }; }
  if (id === 'W6-L3') { s.weights = { ...weights, pit: 4, gap: 3 }; }
  if (id === 'W7-L3') { s.weights = { ...weights, phase: 4, moving: 3 }; }
  return s;
}

/** wskazówki — krótkie, jednorazowe podpowiedzi (klucze i18n) */
const HINTS: Record<string, { x: number; key: string }[]> = {
  'W1-L1': [{ x: 3, key: 'hint.move' }, { x: 20, key: 'hint.attack' }, { x: 33, key: 'hint.stomp' }, { x: 36, key: 'hint.cable' }, { x: 26, key: 'hint.statue' }, { x: 56, key: 'hint.hiddenBox' }, { x: 66, key: 'hint.horns' }, { x: 100, key: 'hint.run' }, { x: 148, key: 'hint.exit' }],
  'W1-L2': [{ x: 4, key: 'hint.cable' }, { x: 60, key: 'hint.switch' }],
  'W2-L2': [{ x: 100, key: 'hint.eco' }], 'W2-L4': [{ x: 100, key: 'bosshint.zlomotaur' }], 'W1-L4': [{ x: 99, key: 'bosshint.rogomir' }],
  'W3-L4': [{ x: 100, key: 'bosshint.kaktogor' }], 'W3-L3': [{ x: 6, key: 'hint.switch' }],
  'W4-L1': [{ x: 4, key: 'hint.water' }], 'W4-L2': [{ x: 4, key: 'hint.water' }], 'W4-L4': [{ x: 100, key: 'bosshint.rogopletw' }],
  'W5-L1': [{ x: 4, key: 'hint.crumble' }], 'W5-L2': [{ x: 6, key: 'hint.beam' }], 'W5-L3': [{ x: 4, key: 'hint.rock' }], 'W5-L4': [{ x: 100, key: 'bosshint.ceratopsor' }],
  'W6-L1': [{ x: 4, key: 'hint.dark' }], 'W6-L4': [{ x: 100, key: 'bosshint.krukorog' }],
  'W7-L4': [{ x: 100, key: 'bosshint.rogodron' }],
  'W8-L1': [{ x: 4, key: 'hint.rock' }], 'W8-L2': [{ x: 4, key: 'hint.sequence' }], 'W8-L4': [{ x: 150, key: 'bosshint.katoblepas' }],
};

/** skróty (purpurowe przewody) wg atlasu: [x kafelka, poziom docelowy, ukryty?, wymagane przełączniki] */
const WARPS: Record<string, { x: number; to: string; hidden?: boolean; ops?: number }[]> = {
  'W1-L2': [{ x: 174, to: 'W2-L1' }, { x: 182, to: 'W3-L1' }, { x: 151, to: 'W0', hidden: true }],
  'W4-L2': [{ x: 177, to: 'W6-L1' }],
  'W6-L3': [{ x: 166, to: 'W7-L1' }, { x: 195, to: 'W8-L1', ops: 2 }],
};

export const OPS_MAX_BY_WORLD = (w: number) => (w <= 2 ? 3 : w <= 6 ? 5 : 7);

// ---------------------------------------------------------------- publiczne API
export function buildLevel(j: LevelJson, opts: GenOpts = {}): LevelData {
  const id = j.level_id;
  const rng = new Rng('lvl:' + id);
  const world = j.world, stage = j.stage;
  const style = styleFor(id, world, stage);
  const bossId: BossId | undefined = stage === 4 ? BOSS_BY_WORLD[world] : undefined;
  let main: Room; let rooms: Room[] = []; let spawn: { x: number; y: number };
  let checkpointPx = { x: P(j.checkpoint_x_tile), y: P(12) }; let exitPx = { x: P(j.width_tiles - 5), y: P(12) };

  if (id === 'W1-L1') { const r = hand11(j, rng); main = r.main; rooms = r.rooms; spawn = r.spawn; checkpointPx = r.cp; exitPx = r.exit; }
  else if (style.mode === 'tower') { const r = buildTower(j, rng, style); main = r.main; rooms = r.rooms; spawn = r.spawn; checkpointPx = r.cp; exitPx = r.exit; }
  else { const r = buildRun(j, rng, style, bossId, opts); main = r.main; rooms = r.rooms; spawn = r.spawn; checkpointPx = r.cp; exitPx = r.exit; }

  rooms.unshift(main);
  main.spawn = spawn;
  for (const s of main.specs) if (s.t === 'cable' && s.dest && s.dest.room < 0) s.dest = { ...s.dest, room: 0 };
  const hints = HINTS[id] ?? [];
  for (const h of hints) main.specs.push({ t: 'hint', x: P(h.x), y: 0, w: P(5), key: h.key });

  const residents = j.petrified_residents_x_tile.map((_, i) => `${id}-S${i + 1}`);
  return {
    id, world, stage, titleKey: 'lvl.' + id, timeLimit: j.time_limit_seconds, mode: style.mode === 'boss' ? 'boss' : style.mode,
    rooms, boss: bossId, checkpointPx, exitPx, residents,
    budget: { pet: j.collectibles.pet, cans: j.collectibles.cans, golden: j.collectibles.golden_cans },
    hints: hints.map((h) => h.key),
  };
}

/** Planeta 0 — Prądowo (opcjonalna) */
export function buildPradowo(): LevelData {
  const j: LevelJson = {
    level_id: 'W0', planet: 'Prądowo', world: 0, stage: 1, title: 'Prądowo', width_tiles: 200, time_limit_seconds: 480,
    collectibles: { pet: 70, cans: 80, golden_cans: 2 }, enemy_budget: { 'Roguś': 6, 'Żukoróg': 4 },
    sections: [], checkpoint_x_tile: 110, petrified_residents_x_tile: [], secret: '', completion: '', special: '',
  };
  const rng = new Rng('lvl:W0');
  const style: Style = { mode: 'run', weights: { ...BASE, flat: 4, puzzle: 2, conv: 2, moving: 2 }, switchStyle: 'lever' };
  const r = buildRun(j, rng, style, undefined, {});
  r.main.specs.push({ t: 'ecoport', x: P(190), y: P(12), broken: false, id: 'W0-ECO', fuses: [] });
  r.main.specs.push({ t: 'cable', id: 'W0-BACK', color: 'purple', x: P(5), y: P(11), face: 'up', warp: 'W1-L2' });
  const main = r.main; main.spawn = r.spawn;
  return { id: 'W0', world: 0, stage: 1, titleKey: 'lvl.W0', timeLimit: 480, mode: 'run', rooms: [main, ...r.rooms], checkpointPx: r.cp, exitPx: r.exit, residents: [], budget: { pet: 70, cans: 80, golden: 2 }, hints: [] };
}

// ---------------------------------------------------------------- poziom 1-1 (ręczny, wg tabeli z atlasu)
function hand11(j: LevelJson, rng: Rng) {
  const W = j.width_tiles, b = new RoomB(W, ROWS), gy = 12;
  b.ground(0, W, gy);
  b.gap(105, 107); b.gap(132, 134);                         // dwie przepaści po 2 kafelki
  // schody 1, 2, 3 kafelki w górę i w dół (x=41–50) — brak „ślepych” skoków
  for (const [sx, h, w] of [[41, 1, 2], [43, 2, 2], [45, 3, 2], [47, 3, 2], [49, 2, 1], [50, 1, 1]]) b.block(sx, gy - h, w, h);
  // kamień nad ukrytą skrzynką (x=61, y=7) oraz boczna półka z mieszkańcem #3 (x=126)
  b.block(60, 9, 3, 1); b.oneway(124, 5, 9); b.col(0, 0, ROWS - 1); b.col(W - 1, 0, ROWS - 1);
  const sp = b.specs, id = j.level_id;
  const bonus = bonusRoom(rng, 18, 'W1-L1', { x: 0, y: 0 }, 1, 0, id);
  b.set(40, gy - 1, T.CABLE); b.set(52, gy - 1, T.CABLE);
  sp.push({ t: 'cable', id: 'C-green-1', color: 'green', x: P(40), y: P(gy - 1), face: 'up', dest: { room: 1, x: P(3) + 16, y: P(12) } });
  sp.push({ t: 'cable', id: 'C-green-1r', color: 'green', x: P(52), y: P(gy - 1), face: 'up', dest: { room: 1, x: P(3) + 16, y: P(12) } });
  bonus.specs.push({ t: 'cable', id: 'C-green-1b', color: 'green', x: P(2), y: P(11), face: 'up', dest: { room: 0, x: P(52) + 16, y: P(gy - 1) } });
  sp.push({ t: 'crate', k: 'xl', x: P(18), y: P(8), hidden: false, id: 'W1-L1-X' });
  sp.push({ t: 'crate', k: 'battery', x: P(61), y: P(7), hidden: true, id: 'W1-L1-B' });
  sp.push({ t: 'crate', k: 'coil', x: P(100), y: P(9), hidden: false, id: 'W1-L1-C' });
  for (const [ex, k] of [[27, 'rogus'], [36, 'rogus'], [72, 'zukorog'], [110, 'zukorog'], [140, 'rogus'], [150, 'rogus']] as [number, EnemyKind][]) sp.push({ t: 'enemy', k, x: P(ex) + 16, y: P(gy) });
  j.petrified_residents_x_tile.forEach((sx, i) => sp.push({ t: 'statue', idx: i, x: P(sx) + 16, y: P(i === 2 ? 9 : gy), id: `${id}-S${i + 1}` }));
  sp.push({ t: 'checkpoint', x: P(88) + 16, y: P(gy) });
  sp.push({ t: 'exit', x: P(156), y: P(gy) });
  placePickups(b, rng, j, 'W1-L1', []);
  const main = b.toRoom(1, 'main', false, { x: P(3), y: P(gy) });
  return { main, rooms: [bonus], spawn: { x: P(3) + 16, y: P(gy) }, cp: { x: P(88) + 16, y: P(gy) }, exit: { x: P(156), y: P(gy) } };
}

// ---------------------------------------------------------------- komory dodatkowe
function bonusRoom(rng: Rng, cans: number, levelId: string, _from: { x: number; y: number }, world: number, idx: number, tag: string): Room {
  const W = 30, b = new RoomB(W, ROWS);
  b.ground(0, W, 12);
  b.block(0, 0, 1, 12); b.block(W - 1, 0, 1, 12);
  for (let i = 0; i < cans; i++) {
    const x = 5 + (i % 20), row = 10 - Math.floor(Math.sin((i % 20) / 20 * Math.PI) * 3) - (i >= 20 ? 3 : 0);
    b.specs.push({ t: 'item', k: i % 3 === 0 ? 'pet' : 'can', x: P(x) + 16, y: P(row) + 8, id: `${tag}:bonus${idx}:${i}` });
  }
  b.specs.push({ t: 'ecoport', x: P(26), y: P(12), broken: false, id: `${tag}:eco${idx}`, fuses: [] });
  void levelId; void rng;
  return b.toRoom(world, 'bonus', false, { x: P(3), y: P(12) });
}

function secretRoom(world: number, tag: string, idx: number, withNote: boolean, cans: number): Room {
  const W = 24, b = new RoomB(W, ROWS);
  b.ground(0, W, 12); b.block(0, 0, 1, 12); b.block(W - 1, 0, 1, 12);
  for (let i = 0; i < cans; i++) b.specs.push({ t: 'item', k: i % 5 === 0 ? 'pet' : 'can', x: P(4 + (i % 16)) + 16, y: P(9 - Math.floor(i / 16)) + 8, id: `${tag}:sec${idx}:${i}` });
  if (withNote) {
    b.specs.push({ t: 'item', k: 'note', x: P(12) + 16, y: P(10) + 8, id: `note:${world}` });
    b.specs.push({ t: 'item', k: 'signet', x: P(16) + 16, y: P(10) + 8, id: `signet:${world}` });
  }
  return b.toRoom(world, withNote ? 'scarlet' : 'secret', false, { x: P(3), y: P(12) });
}

// ---------------------------------------------------------------- pozostałe poziomy: run / water / boss
interface Anchor { x0: number; x1: number; kind: string }

function buildRun(j: LevelJson, rng: Rng, style: Style, boss: BossId | undefined, opts: GenOpts) {
  const W = j.width_tiles, id = j.level_id, world = j.world;
  const b = new RoomB(W, ROWS);
  const rooms: Room[] = [];
  const arenaW = boss ? (id === 'W8-L4' ? 40 : 34) : 0;
  const arenaX0 = boss ? W - arenaW : W;
  const anchors: Anchor[] = [{ x0: 0, x1: 10, kind: 'spawn' }];
  j.petrified_residents_x_tile.forEach((x) => anchors.push({ x0: x - 3, x1: x + 4, kind: 'statue' }));
  anchors.push({ x0: j.checkpoint_x_tile - 3, x1: j.checkpoint_x_tile + 4, kind: 'cp' });
  if (boss) anchors.push({ x0: arenaX0 - 6, x1: W, kind: 'arena' }); else anchors.push({ x0: W - 10, x1: W, kind: 'exit' });
  anchors.sort((a, c) => a.x0 - c.x0);
  // scal nakładające się kotwice
  const merged: Anchor[] = [];
  for (const a of anchors) { const l = merged[merged.length - 1]; if (l && a.x0 <= l.x1 + 2) { l.x1 = Math.max(l.x1, a.x1); l.kind += '+' + a.kind; } else merged.push({ ...a }); }

  let gy = 12;
  const water = !!style.water;
  const diffAt = (x: number) => Math.min(3, Math.floor((x / W) * 4));
  const occupied: { x0: number; x1: number; gy: number; kind: string }[] = [];   // przedziały "bezpiecznych płaskich" dla wrogów
  let ops = 0; const opsMax = OPS_MAX_BY_WORLD(world); const gateIds: string[] = [];
  let swId = 0;

  const flat = (x0: number, x1: number, kind = 'flat') => { b.ground(x0, x1, gy); occupied.push({ x0, x1, gy, kind }); };

  const pieces: Record<string, (x: number, room: number) => number> = {
    flat: (x, room) => { const n = rng.int(4, 8); flat(x, x + n); return Math.min(n, room); },
    gap: (x) => {
      const d = diffAt(x); const w = d === 0 ? 2 : d === 1 ? rng.int(2, 3) : rng.int(2, 4);
      if (water) { const n = w + 3; b.ground(x, x + n, gy + 2); occupied.push({ x0: x, x1: x + n, gy: gy + 2, kind: 'basin' }); return n; }
      b.gap(x, x + w); return w;
    },
    stairs: (x) => {
      let up = gy > 10 ? rng.chance(0.55) : false; if (gy >= 13) up = true;
      const steps = rng.int(2, 3); let cx = x;
      for (let i = 0; i < steps; i++) { gy += up ? -1 : 1; gy = Math.max(9, Math.min(13, gy)); flat(cx, cx + 2, 'step'); cx += 2; }
      return cx - x;
    },
    pit: (x) => {
      const total = rng.int(7, 10); const n = Math.max(2, Math.floor(total / 3)); let cx = x + 1, row = gy;
      b.gap(x, x + total);
      for (let i = 0; i < n; i++) {
        row = Math.max(gy - 2, Math.min(gy, row + rng.pick([-1, 0, 1])));
        const wdt = 3; b.oneway(cx, wdt, row);
        cx += wdt + 1; if (cx > x + total - 2) break;
      }
      return total;
    },
    haz: (x) => {
      const w = rng.int(2, 3);
      b.ground(x, x + w, gy);
      for (let i = 0; i < w; i++) b.set(x + i, gy, T.HAZARD);
      return w;
    },
    wall: (x) => {
      const h = 5; const enterX = x + 1, exitX = x + 6;
      b.ground(x, x + 8, gy); occupied.push({ x0: x, x1: x + 8, gy, kind: 'wall' });
      b.block(x + 3, gy - h, 2, h);
      b.set(enterX, gy - 1, T.CABLE); b.set(exitX, gy - 1, T.CABLE);
      const cid = `${id}:w${x}`;
      b.specs.push({ t: 'cable', id: cid + 'a', color: 'blue', x: P(enterX), y: P(gy - 1), face: 'up', dest: { room: -1, x: P(exitX) + 16, y: P(gy - 1) } });
      b.specs.push({ t: 'cable', id: cid + 'b', color: 'blue', x: P(exitX), y: P(gy - 1), face: 'up', dest: { room: -1, x: P(enterX) + 16, y: P(gy - 1) } });
      return 8;
    },
    moving: (x) => {
      const total = 6; b.gap(x, x + total);
      b.specs.push({ t: 'platform', x: P(x), y: P(gy), w: 2, mode: 'h', range: P(4), speed: 55 + diffAt(x) * 8, offset: rng.next() });
      return total;
    },
    puzzle: (x) => {
      const nOps = Math.min(opsMax - ops, world <= 2 ? 2 : rng.int(2, 3)); if (nOps < 1) return pieces.flat(x, 8);
      const len = 6 + nOps * 3; b.ground(x, x + len, gy); occupied.push({ x0: x, x1: x + len, gy, kind: 'puzzle' });
      const gid = `${id}:g${x}`; const cells: [number, number][] = [];
      const gx = x + len - 2; for (let r = gy - 6; r < gy; r++) { b.set(gx, r, T.GATE); cells.push([gx, r]); }
      b.specs.push({ t: 'gate', id: gid, cells, need: nOps });
      for (let i = 0; i < nOps; i++) {
        const sx = x + 3 + i * 3; const hi = world >= 3 && i % 2 === 1;
        if (hi) { b.oneway(sx - 1, 3, gy - 2); }
        b.specs.push({ t: 'switch', id: `${gid}:s${i}`, x: P(sx) + 16, y: P(hi ? gy - 2 : gy), gate: gid, style: style.switchStyle, symbol: swId++ % 4 });
      }
      ops += nOps; gateIds.push(gid);
      return len;
    },
    crumble: (x) => {
      const total = rng.int(6, 9); b.gap(x, x + total);
      for (let i = 0; i < total; i++) b.set(x + i, gy, T.CRUMBLE);
      return total;
    },
    phase: (x) => {
      const total = 9; b.gap(x, x + total);
      for (let i = 0; i < 3; i++) b.specs.push({ t: 'platform', x: P(x + 1 + i * 3), y: P(gy - (i % 2)), w: 2, mode: 'phase', range: 0, speed: 3.2, offset: i * 0.33 });
      return total;
    },
    conv: (x) => {
      const n = 8; b.ground(x, x + n, gy);
      const dir = rng.chance(0.5) ? T.CONVL : T.CONVR; for (let i = 0; i < n; i++) b.set(x + i, gy, dir);
      occupied.push({ x0: x, x1: x + n, gy, kind: 'conv' });
      return n;
    },
  };
  // w wodzie ograniczamy przeszkody które nie mają sensu
  const allowed = (name: string, d: number): boolean => {
    if (water && ['moving', 'crumble', 'phase', 'conv', 'wall', 'haz'].includes(name)) return false;
    if (name === 'puzzle' && ops >= opsMax) return false;
    if (name === 'pit' && d < 1) return false;
    if (name === 'moving' && d < 1) return false;
    if (name === 'crumble' && d < 1) return false;
    if (name === 'phase' && d < 1) return false;
    if (name === 'wall' && d < 1) return false;
    if (name === 'haz' && d < 1) return false;
    return true;
  };

  const fillSpan = (a: number, c: number) => {
    let x = a;
    while (x < c) {
      const room = c - x;
      if (room < 8) { flat(x, c); x = c; break; }
      const d = diffAt(x);
      const names = Object.keys(pieces).filter((n) => allowed(n, d));
      const weights = names.map((n) => Math.max(0, style.weights[n] ?? 0));
      let tot = weights.reduce((s, v) => s + v, 0); let pick = 'flat';
      if (tot > 0) { let r = rng.next() * tot; for (let i = 0; i < names.length; i++) { r -= weights[i]; if (r <= 0) { pick = names[i]; break; } } }
      const need: Record<string, number> = { flat: 4, gap: 7, stairs: 9, pit: 11, haz: 6, wall: 8, moving: 6, puzzle: 16, crumble: 9, phase: 9, conv: 8 };
      if ((need[pick] ?? 6) + 3 > room) pick = 'flat';
      const gy0 = gy;
      let used = pieces[pick](x, room);
      if (x + used > c - 1) { used = Math.min(used, c - x); }
      const startGy = gy;
      x += used;
      // krótki płaski ogon po każdej przeszkodzie (bezpieczne lądowanie)
      if (pick !== 'flat' && x < c) { const tail = Math.min(rng.int(3, 4), c - x); flat(x, x + tail); x += tail; }
      void gy0; void startGy;
    }
  };

  let cursor = 0;
  for (const a of merged) {
    if (a.x0 > cursor) fillSpan(cursor, a.x0);
    const x0 = Math.max(cursor, a.x0);
    if (a.kind.includes('arena')) {
      // wyrównaj teren do poziomu areny (12) schodkami co 1 kafelek
      let cx = x0; while (gy !== 12 && cx < arenaX0 - 2) { flat(cx, cx + 2, 'step'); cx += 2; gy += gy < 12 ? 1 : -1; }
      flat(cx, arenaX0); gy = 12; b.ground(arenaX0, W, 12); cursor = a.x1; continue;
    }
    flat(x0, a.x1, a.kind); cursor = a.x1;
  }
  if (cursor < W) fillSpan(cursor, W);
  b.col(0, 0, ROWS - 1); b.col(W - 1, 0, ROWS - 1);    // ściany krańcowe poziomu

  // ściany areny
  const specs = b.specs;
  const arenaFloor = 12;
  if (boss) {
    b.ground(arenaX0, W, arenaFloor);
    b.col(W - 1, 0, ROWS - 1);
    // zabezpieczenie przed cofnięciem: po wejściu zamykamy bramę (runtime)
    arenaSpecs(b, boss, arenaX0, W, arenaFloor, id);
    // pod arenę zawsze wracamy do poziomu 12 — upewnij się, że kotwica przed areną jest na poziomie 12 (schody w dół/górę)
  }

  // sufity w jaskiniach
  if (style.cave) for (let x = 12; x < (boss ? arenaX0 - 8 : W - 12); x++) { if (rng.chance(0.55)) { b.col(x, 0, rng.int(2, 4)); } else b.col(x, 0, 1); }
  if (water) {
    b.col(0, 0, 1); for (let x = 0; x < W; x++) { b.col(x, 0, 0); if (x > 14 && x < W - 14 && rng.chance(0.18)) b.col(x, 0, rng.int(2, 6)); }
    for (let i = 0; i < b.water.length; i++) b.water[i] = 1;
  }

  // posągi, checkpoint, wyjście
  j.petrified_residents_x_tile.forEach((sx, i) => {
    const s = b.surface(sx);
    specs.push({ t: 'statue', idx: i, x: P(sx) + 16, y: P(s < 0 ? gy : s), id: `${id}-S${i + 1}` });
  });
  const cpS = b.surface(j.checkpoint_x_tile); specs.push({ t: 'checkpoint', x: P(j.checkpoint_x_tile) + 16, y: P(cpS) });
  let exitPx = { x: P(W - 5), y: P(12) };
  if (!boss) { const es = b.surface(W - 5); specs.push({ t: 'exit', x: P(W - 5), y: P(es) }); exitPx = { x: P(W - 5), y: P(es) }; }
  else { exitPx = { x: P(W - 6), y: P(12) }; specs.push({ t: 'exit', x: P(W - 6), y: P(12) }); }

  // dekoracje i wskazówki są dodawane w warstwie renderowania; tu: wrogowie, przedmioty, sekrety
  placeEnemies(b, rng, j, style, boss ? arenaX0 - 8 : W, opts);
  placePickups(b, rng, j, id, boss ? [[arenaX0 - 6, W]] : []);
  placePowerups(b, rng, j, id, world, boss ? arenaX0 - 8 : W);
  const extra = placeSecrets(b, rng, j, id, world, rooms, style, boss ? arenaX0 - 8 : W);
  void extra;
  placeWarps(b, rng, j, id, world, gy);
  if (style.rain) specs.push({ t: 'rain', x0: P(12), x1: P(boss ? arenaX0 - 8 : W - 12), interval: style.rain });
  if (style.dark) for (let x = 14; x < W - 6; x += 22) { const s = b.surface(x); if (s > 0) specs.push({ t: 'lantern', x: P(x) + 16, y: P(s), id: `${id}-L${x}` }); }
  if (world === 5 || world === 8) {
    for (let x = 52; x < (boss ? arenaX0 - 10 : W - 14); x += 56) { const s = b.surface(x); if (s > 0) specs.push({ t: 'lamp', x: P(x) + 16, y: P(s) }); }
  }
  if (id === 'W2-L2') { const s = b.surface(100); specs.push({ t: 'ecoport', x: P(100), y: P(s), broken: true, id: 'W2-L2-ECO', fuses: ['W2-L2-F1', 'W2-L2-F2'] }); specs.push({ t: 'switch', id: 'W2-L2-F1', x: P(95), y: P(b.surface(95)), gate: 'eco', style: 'relay', symbol: 0 }); specs.push({ t: 'switch', id: 'W2-L2-F2', x: P(105), y: P(b.surface(105)), gate: 'eco', style: 'relay', symbol: 1 }); }
  if (id === 'W8-L2') hubMaze(b, rng, j);
  if (id === 'W8-L3') hallOfStatues(b, rng, j);

  const main = b.toRoom(world, 'main', !!style.dark, { x: P(3) + 16, y: P(12) });
  main.bossArena = boss ? { x0: arenaX0, x1: W } : undefined;
  // rooms of secrets collected via placeSecrets are stored on the main room's dest indices
  const allRooms = (b as any)._rooms as Room[] | undefined;
  if (allRooms) rooms.push(...allRooms);
  return { main, rooms, spawn: { x: P(3) + 16, y: P(12) }, cp: { x: P(j.checkpoint_x_tile) + 16, y: P(cpS) }, exit: exitPx };
}

// ---------------------------------------------------------------- areny bossów
function arenaSpecs(b: RoomB, boss: BossId, x0: number, x1: number, fy: number, id: string) {
  const sp = b.specs, mid = Math.floor((x0 + x1) / 2);
  sp.push({ t: 'boss', k: boss, x: P(x1 - 8), y: P(fy) });
  switch (boss) {
    case 'rogomir': case 'ceratopsor':
      sp.push({ t: 'decor', k: 'guard', x: P(x0 + 2), y: P(fy) }); sp.push({ t: 'decor', k: 'guard', x: P(x1 - 3), y: P(fy) }); break;
    case 'zlomotaur':
      sp.push({ t: 'switch', id: id + ':crane1', x: P(x0 + 3), y: P(fy), gate: 'crane', style: 'relay', symbol: 0 });
      sp.push({ t: 'switch', id: id + ':crane2', x: P(x1 - 4), y: P(fy), gate: 'crane', style: 'relay', symbol: 1 });
      b.oneway(mid - 4, 4, fy - 3); b.oneway(mid + 2, 4, fy - 3); break;
    case 'kaktogor':
      for (let i = 0; i < 3; i++) sp.push({ t: 'decor', k: 'root', x: P(x0 + 6 + i * 10), y: P(fy) });
      b.oneway(mid - 3, 6, fy - 3); break;
    case 'rogopletw':
      for (let y = 0; y < ROWS; y++) for (let x = x0; x < x1; x++) b.water[y * b.w + x] = 1;
      for (let i = 0; i < 3; i++) sp.push({ t: 'decor', k: 'mirror', x: P(x0 + 6 + i * 10), y: P(fy) });
      b.oneway(mid - 3, 6, fy - 4); break;
    case 'krukorog':
      for (let i = 0; i < 3; i++) sp.push({ t: 'switch', id: `${id}:spot${i}`, x: P(x0 + 5 + i * 11), y: P(fy), gate: 'spot', style: 'lamp', symbol: i });
      break;
    case 'rogodron':
      for (let i = 0; i < 3; i++) { const gx = x0 + 5 + i * 11; b.oneway(gx - 1, 4, fy - 4); sp.push({ t: 'switch', id: `${id}:gen${i}`, x: P(gx + 1) + 16, y: P(fy - 4), gate: 'gen', style: 'relay', symbol: i }); }
      break;
    case 'katoblepas':
      for (let i = 0; i < 3; i++) sp.push({ t: 'decor', k: 'pillar', x: P(x0 + 8 + i * 12), y: P(fy) });
      for (let i = 0; i < 3; i++) sp.push({ t: 'decor', k: 'mirror', x: P(x0 + 6 + i * 13), y: P(fy) });
      for (let i = 0; i < 8; i++) { const nx = x0 + 3 + (i % 4) * 9, ny = fy - 3 - Math.floor(i / 4) * 3; b.oneway(nx, 3, ny); sp.push({ t: 'switch', id: `${id}:node${i}`, x: P(nx + 1) + 16, y: P(ny), gate: 'node', style: 'rune', symbol: i % 4 }); }
      break;
  }
}

// ---------------------------------------------------------------- wrogowie
function placeEnemies(b: RoomB, rng: Rng, j: LevelJson, style: Style, endX: number, opts: GenOpts) {
  const list: EnemyKind[] = [];
  for (const [name, n] of Object.entries(j.enemy_budget)) { const k = ENEMY_BY_NAME[name]; if (k) for (let i = 0; i < n; i++) list.push(k); }
  if (!list.length) return;
  // rozkładamy równomiernie wzdłuż poziomu, omijając strefy startu, checkpointu, posągów i mety
  const forbid: [number, number][] = [[0, 14], [j.checkpoint_x_tile - 4, j.checkpoint_x_tile + 5], [endX - 4, b.w]];
  j.petrified_residents_x_tile.forEach((x) => forbid.push([x - 2, x + 3]));
  const lo = 14, hi = Math.max(lo + 10, endX - 6);
  // sort by class to interleave
  const order = list.map((k, i) => ({ k, i, r: rng.next() })).sort((a, c) => a.r - c.r).map((o) => o.k);
  order.forEach((k, i) => {
    const cls = ENEMY_CLASS[k];
    const target = lo + ((i + 0.5) / order.length) * (hi - lo);
    let placed = false;
    for (let d = 0; d < 40 && !placed; d++) {
      const x = Math.round(target + (d % 2 ? d : -d) * 0.5 + rng.range(-1, 1));
      if (x < lo || x > hi || forbid.some(([a, c]) => x >= a && x <= c)) continue;
      const s = b.surface(x);
      if (cls === 'water' && !style.water) {
        if (s >= 0 || x < lo || x > hi) continue;
        b.specs.push({ t: 'enemy', k, x: P(x) + 16, y: P(ROWS - 1) }); placed = true; continue;
      }
      if (s < 0) continue;
      const flatOK = [-2, -1, 0, 1, 2].every((dx) => b.surface(x + dx) === s);
      if (cls === 'ground' || cls === 'plant') {
        if (!flatOK) continue;
        const t0 = b.get(x, s); if (t0 === T.CRUMBLE || t0 === T.CABLE || t0 === T.GATE || t0 === T.ONEWAY) continue;
        if ([-1, 0, 1].some((dx) => b.get(x + dx, s - 1) === T.HAZARD || b.get(x + dx, s) === T.HAZARD)) continue;
        b.specs.push({ t: 'enemy', k, x: P(x) + 16, y: P(s) }); placed = true;
      } else if (cls === 'air') {
        b.specs.push({ t: 'enemy', k, x: P(x) + 16, y: P(Math.max(3, s - rng.int(4, 6))) }); placed = true;
      } else if (cls === 'water') {
        b.specs.push({ t: 'enemy', k, x: P(x) + 16, y: P(Math.max(3, s - rng.int(3, 6))) }); placed = true;
      }
    }
    void opts;
  });
}

// ---------------------------------------------------------------- opakowania
function placePickups(b: RoomB, rng: Rng, j: LevelJson, id: string, skip: [number, number][]) {
  const total = j.collectibles.pet + j.collectibles.cans;
  const bag: ItemKind[] = [];
  for (let i = 0; i < j.collectibles.pet; i++) bag.push('pet');
  for (let i = 0; i < j.collectibles.cans; i++) bag.push('can');
  for (let i = bag.length - 1; i > 0; i--) { const k = rng.int(0, i); [bag[i], bag[k]] = [bag[k], bag[i]]; }
  const start = id === 'W1-L1' ? 7 : 12, end = b.w - 12;
  const groups: number[] = []; let cnt = 0;
  while (cnt < total) { const g = Math.min(rng.int(3, 5), total - cnt); groups.push(g); cnt += g; }
  const stride = (end - start) / Math.max(1, groups.length); let n = 0, g = 0;
  groups.forEach((size, gi) => {
    const gx = Math.round(start + gi * stride + rng.range(0, Math.max(0, stride - size - 1)));
    for (let i = 0; i < size; i++) {
      const xi = gx + i; if (skip.some(([a, c]) => xi >= a && xi <= c)) { continue; }
      const s0 = b.surface(xi); let row: number;
      if (s0 < 0) {            // przepaść: łuk
        let l = xi, r = xi; while (l > 0 && b.surface(l) < 0) l--; while (r < b.w - 1 && b.surface(r) < 0) r++;
        const ref = Math.min(b.surface(l) < 0 ? 12 : b.surface(l), b.surface(r) < 0 ? 12 : b.surface(r));
        row = ref - 2 - Math.sin(((xi - l) / Math.max(1, r - l)) * Math.PI) * 1.5;
      } else row = s0 - 2 - (gi % 3 === 2 && id !== 'W1-L1' ? 1 : 0);
      b.specs.push({ t: 'item', k: bag[n++], x: P(xi) + 16, y: Math.round(P(row)) + 8, id: `${id}:i${g++}` });
    }
  });
  // opakowania, które trafiły w strefy pominięte — dokładamy na początku poziomu, by budżet się zgadzał
  let fx = start;
  while (n < total) { const s1 = b.surface(fx); if (s1 > 0 && !skip.some(([a, c]) => fx >= a && fx <= c)) b.specs.push({ t: 'item', k: bag[n++], x: P(fx) + 16, y: P(s1 - 2) + 8, id: `${id}:i${g++}` }); fx++; if (fx > b.w - 14) fx = start; if (g > total * 6) break; }
  // złote puszki
  for (let i = 0; i < j.collectibles.golden_cans; i++) {
    const m = /x=(\d+)/.exec(j.special + ' ' + j.secret); const gx = m ? parseInt(m[1], 10) : Math.round(b.w * 0.7);
    let sx = Math.min(b.w - 12, Math.max(12, gx)); const rowS = b.surface(sx);
    if (rowS > 0) { b.oneway(sx - 1, 2, rowS - 2); b.specs.push({ t: 'item', k: 'golden', x: P(sx) + 16, y: P(rowS - 3) + 8, id: `${id}:g${i}` }); }
    else b.specs.push({ t: 'item', k: 'golden', x: P(sx) + 16, y: P(9), id: `${id}:g${i}` });
  }
}

// ---------------------------------------------------------------- ulepszenia (skrzynki)
function placePowerups(b: RoomB, rng: Rng, j: LevelJson, id: string, world: number, endX: number) {
  const place = (k: ItemKind, x: number, hidden: boolean, tag: string) => {
    const s = b.surface(x); if (s < 0) return; if (b.get(x, s - 4) !== T.EMPTY || b.get(x, s - 3) !== T.EMPTY) return;
    if (b.specs.some((q) => q.t === 'cable' && Math.abs(q.x / TILE - x) < 3)) return;
    b.specs.push({ t: 'crate', k, x: P(x), y: P(s - 4), hidden, id: `${id}:${tag}` });
  };
  place('xl', 17 + rng.int(0, 4), false, 'xl');
  place('coil', Math.round(b.w * 0.42) + rng.int(0, 5), false, 'coil');
  if (world === 2 || id === 'W2-L3') place('magnet', Math.round(b.w * 0.3), false, 'mag');
  if (world === 4 || world === 6) place('extender', Math.round(b.w * 0.35), false, 'ext');
  if (world === 7) place('gloves', Math.round(b.w * 0.3), false, 'glv');
  if (world >= 3) place('xl', Math.round(b.w * 0.68), false, 'xl2');
  void j; void endX;
}

// ---------------------------------------------------------------- sekrety: zielony kabel (bonus), żółty (sekret), niewidoczna skrzynka, komnata Scarlet
function placeSecrets(b: RoomB, rng: Rng, j: LevelJson, id: string, world: number, rooms: Room[], style: Style, endX: number) {
  const rs: Room[] = ((b as any)._rooms = (b as any)._rooms ?? []);
  const nums = [...j.secret.matchAll(/x=(\d+)/g)].map((m) => parseInt(m[1], 10));
  const flatNear = (x: number, span = 4) => { for (let d = 0; d < 30; d++) for (const sgn of [1, -1]) { const xx = x + sgn * d; if (xx < 16 || xx > endX - 10) continue; const s = b.surface(xx); if (s < 0) continue; if ([0, 1, 2].every((k) => b.surface(xx + k) === s) && b.get(xx, s - 1) === T.EMPTY && b.get(xx, s - 2) === T.EMPTY && !b.specs.some((q) => (q.t === 'cable' || q.t === 'statue' || q.t === 'checkpoint') && Math.abs(q.x / TILE - xx) < span)) return xx; } return -1; };
  const addCable = (color: CableColor, x: number, roomIdx: number, hidden: boolean, tag: string): boolean => {
    const xx = flatNear(x); if (xx < 0) return false; const s = b.surface(xx);
    b.set(xx, s - 1, T.CABLE);
    b.specs.push({ t: 'cable', id: `${id}:${tag}`, color, x: P(xx), y: P(s - 1), face: 'up', dest: { room: roomIdx + 1, x: P(3) + 16, y: P(12) }, hidden });
    const room = rs[roomIdx];
    room.specs.push({ t: 'cable', id: `${id}:${tag}b`, color, x: P(2), y: P(11), face: 'up', dest: { room: 0, x: P(xx) + 16, y: P(s - 1) } });
    return true;
  };
  const noWater = !style.water;
  // bonus (zielony): zawsze
  if (noWater) {
    const x = nums[0] && /zielon/i.test(j.secret) ? nums[0] : Math.round(b.w * 0.24);
    rs.push(bonusRoom(rng, 14 + (world % 3) * 4, id, { x: 0, y: 0 }, world, rs.length, id));
    if (!addCable('green', x, rs.length - 1, false, 'green')) rs.pop();
  }
  // sekret (żółty): komora z 15 puszkami lub komnata Scarlet (stage 3) z notatką
  if (noWater) {
    const withNote = j.stage === 3;
    const yx = /Żółty|żółty/.test(j.secret) && nums.length ? nums[0] : Math.round(b.w * (withNote ? 0.55 : 0.62));
    rs.push(secretRoom(world, id, rs.length, withNote, withNote ? 6 : 15));
    if (!addCable('yellow', yx, rs.length - 1, true, 'yellow')) rs.pop();
  }
  // niewidoczna skrzynka (1UP lub ulepszenie)
  const hid = /Niewidoczn/i.test(j.secret) && nums.length ? nums[0] : Math.round(b.w * 0.5) + rng.int(-4, 4);
  const hs = b.surface(hid); if (hs > 3 && b.get(hid, hs - 4) === T.EMPTY && b.get(hid, hs - 3) === T.EMPTY) b.specs.push({ t: 'crate', k: /Gwiazd/.test(j.secret) ? 'star' : /Bezpiecznik/.test(j.secret) ? 'xl' : 'battery', x: P(hid), y: P(hs - 4), hidden: true, id: `${id}:hid` });
  else { const alt = flatNear(Math.round(b.w * 0.5)); if (alt > 0) b.specs.push({ t: 'crate', k: 'battery', x: P(alt), y: P(b.surface(alt) - 4), hidden: true, id: `${id}:hid` }); }
  // Gwiazda Napięcia w 1-3 oraz wybranych poziomach — jako dodatkowa widoczna skrzynka
  if (/Gwiazd/.test(j.secret)) { const sx = nums[0] ?? Math.round(b.w * 0.58); const ss = b.surface(sx); if (ss > 3) b.specs.push({ t: 'crate', k: 'star', x: P(sx), y: P(ss - 4), hidden: false, id: `${id}:star` }); }
  // 8. fragment kryształu — ukryty w 8-3 (Sala Tysiąca Posągów)
  if (id === 'W8-L3') { const sx = flatNear(Math.round(b.w * 0.8)); if (sx > 0) b.specs.push({ t: 'item', k: 'shard', x: P(sx) + 16, y: P(b.surface(sx) - 2) + 8, id: 'shard:8' }); }
  void world;
}

function placeWarps(b: RoomB, rng: Rng, j: LevelJson, id: string, world: number, gy: number) {
  void rng; void world; void gy;
  const list = WARPS[id]; if (!list) return;
  list.forEach((w, i) => {
    let x = w.x; if (x > b.w - 12) x = b.w - 12 - i * 6;
    for (let d = 0; d < 20; d++) {
      const xx = x - d; const s = b.surface(xx);
      if (s > 0 && b.surface(xx + 1) === s && b.get(xx, s - 1) === T.EMPTY && !b.specs.some((q) => (q.t === 'cable' || q.t === 'exit' || q.t === 'checkpoint') && Math.abs(q.x / TILE - xx) < 3)) {
        b.set(xx, s - 1, T.CABLE);
        b.specs.push({ t: 'cable', id: `${id}:warp${i}`, color: 'purple', x: P(xx), y: P(s - 1), face: 'up', warp: w.to, hidden: !!w.hidden, locked: !!w.ops });
        if (w.ops) {                                             // dwa przełączniki otwierają gniazdo (8-ty świat)
          const gid = `${id}:warpgate`; b.specs.push({ t: 'gate', id: gid, cells: [], need: w.ops });
          for (let k = 0; k < w.ops; k++) { const sx = xx - 6 - k * 4; const ss = b.surface(sx); if (ss > 0) b.specs.push({ t: 'switch', id: `${gid}:s${k}`, x: P(sx) + 16, y: P(ss), gate: gid, style: 'rune', symbol: k }); }
        }
        break;
      }
    }
  });
  void j;
}

// ---------------------------------------------------------------- 8-2: Wielki Przewód — sekwencja symboli
function hubMaze(b: RoomB, rng: Rng, j: LevelJson) {
  // cztery stanowiska z sześcioma przewodami; poprawna kolejność: błyskawica(0) → księżyc(1) → liść(2) → gwiazda(3)
  void rng; void j;
  const base = Math.round(b.w * 0.35);
  const hubs: number[] = [];
  for (let i = 0; i < 4; i++) {
    const x0 = base + i * 18; hubs.push(x0);
    b.ground(x0, x0 + 16, 12); b.block(x0 - 1, 4, 1, 8); b.block(x0 + 16, 4, 1, 8);
    b.ground(x0 - 1, x0, 12);
  }
  hubs.forEach((x0, i) => {
    const symbols = [0, 1, 2, 3, 0, 1].map((s, k) => (k < 4 ? s : (s + 2) % 4));
    for (let k = 0; k < 4; k++) {
      const cx = x0 + 2 + k * 3; b.set(cx, 11, T.CABLE);
      const correct = k === i;
      const dest = correct ? (i === 3 ? { room: -1, x: P(base + 4 * 18 + 3) + 16, y: P(11) } : { room: -1, x: P(hubs[i + 1] + 2) + 16, y: P(11) }) : { room: -1, x: P(hubs[0] + 1) + 16, y: P(11) };
      b.specs.push({ t: 'cable', id: `W8-L2:hub${i}:${k}`, color: 'purple', x: P(cx), y: P(11), face: 'up', dest: { ...dest, room: 0 }, symbol: symbols[k] });
    }
    b.specs.push({ t: 'sign', x: P(x0 + 1) + 16, y: P(12), symbol: i });
  });
  const end = base + 4 * 18;
  b.ground(end, end + 8, 12);
  for (let x = hubs[3] + 17; x < end; x++) b.ground(x, x + 1, 12);
}

// ---------------------------------------------------------------- 8-3: ożywione posągi
function hallOfStatues(b: RoomB, rng: Rng, j: LevelJson) {
  void j;
  for (let x = 20; x < b.w - 28; x += rng.int(5, 9)) {
    const s = b.surface(x); if (s > 0) b.specs.push({ t: 'decor', k: 'statue', x: P(x) + 16, y: P(s) });
  }
}

// ---------------------------------------------------------------- wieża (6-2): poziom pionowy
function buildTower(j: LevelJson, rng: Rng, style: Style) {
  const id = j.level_id, W = 30, H = 100; const b = new RoomB(W, H);
  b.block(0, 0, 1, H); b.block(W - 1, 0, 1, H);
  const base = H - 3; b.ground(1, W - 1, base); b.col(0, 0, H - 1); b.col(W - 1, 0, H - 1);
  const plats: { x0: number; w: number; row: number }[] = [];
  let row = base, x0 = 12, n = 0;
  while (row > 16) {
    row -= 2;                                             // 64 px różnicy — osiągalne dla obu braci
    const w = rng.int(4, 5);
    x0 = Math.max(2, Math.min(W - 2 - w, x0 + rng.int(-6, 6)));
    if (n % 7 === 6) { b.specs.push({ t: 'platform', x: P(x0), y: P(row), w, mode: 'phase', range: 0, speed: 3.6, offset: 0 }); }
    else b.oneway(x0, w, row);
    plats.push({ x0, w, row }); n++;
  }
  // szczyt: szeroka półka z metą
  const summit = row - 2; b.block(1, summit, W - 2, 3);
  const frac = (tx: number) => Math.min(0.97, Math.max(0.03, tx / j.width_tiles));
  const at = (f: number) => plats[Math.min(plats.length - 1, Math.floor(f * plats.length))];
  j.petrified_residents_x_tile.forEach((tx, i) => { const p = at(frac(tx)); b.specs.push({ t: 'statue', idx: i, x: P(p.x0 + 2) + 16, y: P(p.row), id: `${id}-S${i + 1}` }); });
  const cpP = at(frac(j.checkpoint_x_tile)); b.specs.push({ t: 'checkpoint', x: P(cpP.x0 + 1) + 16, y: P(cpP.row) });
  b.specs.push({ t: 'exit', x: P(W - 7), y: P(summit) });
  plats.forEach((p, i) => { if (i % 6 === 3) b.specs.push({ t: 'lantern', x: P(p.x0) + 16, y: P(p.row), id: `${id}-L${i}` }); });
  const total = j.collectibles.pet + j.collectibles.cans; let placed = 0;
  for (let i = 0; placed < total; i++) {
    const p = plats[i % plats.length]; const off = Math.floor(i / plats.length);
    b.specs.push({ t: 'item', k: placed % 2 ? 'can' : 'pet', x: P(p.x0 + 1 + (off % Math.max(1, p.w - 1))) + 16, y: P(p.row - 1) + 8, id: `${id}:i${placed}` }); placed++;
  }
  if (j.collectibles.golden_cans) { const p = at(0.7); b.specs.push({ t: 'item', k: 'golden', x: P(p.x0 + 1) + 16, y: P(p.row - 3) + 8, id: `${id}:g0` }); }
  b.specs.push({ t: 'crate', k: 'xl', x: P(6), y: P(base - 4), hidden: false, id: `${id}:xl` });
  b.specs.push({ t: 'crate', k: 'battery', x: P(W - 3), y: P(plats[Math.floor(plats.length / 2)].row - 4), hidden: true, id: `${id}:hid` });
  b.specs.push({ t: 'platform', x: P(W - 5), y: P(base), w: 2, mode: 'v', range: P(30), speed: 55, offset: 0 });
  for (const [name, cnt] of Object.entries(j.enemy_budget)) {
    const k = ENEMY_BY_NAME[name]; if (!k) continue;
    for (let i = 0; i < cnt; i++) { const p = plats[Math.min(plats.length - 3, 4 + Math.floor(((i + 0.5) / cnt) * (plats.length - 8)))]; b.specs.push({ t: 'enemy', k: ENEMY_CLASS[k] === 'air' ? k : 'cmorog', x: P(p.x0 + 2), y: P(p.row - 4) }); }
  }
  void style;
  const main = b.toRoom(6, 'main', true, { x: P(3) + 16, y: P(base) });
  return { main, rooms: [] as Room[], spawn: { x: P(3) + 16, y: P(base) }, cp: { x: P(cpP.x0 + 1) + 16, y: P(cpP.row) }, exit: { x: P(W - 7), y: P(summit) } };
}
