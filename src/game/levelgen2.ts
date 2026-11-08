/**
 * Generator poziomów pionowych (v0.3): wysoki pokój (44 wiersze), trasa główna, która wspina się i opada
 * (zbocza 45° i 26°, ściany ze wspinaczką, sprężyny, zrzuty), trasy górne (loft ze sprężyną) oraz sekrety zależne od brata:
 *  – szyb do odbijania od ścian (tylko Darioosh) z nagrodą na półce,
 *  – kapsuła pod pękniętym podłożem (tylko Marioosh — uderzenie w ziemię) ze sprężyną powrotną.
 * Każdy poziom da się przejść obydwoma braćmi trasą główną; sekrety są opcjonalne.
 * Deterministyczny (ziarno = level_id). Stare umieszczanie wrogów, przedmiotów, sekretów i przewodów jest wspólne z levelgen.ts.
 */
import { Rng } from '../engine/rng';
import type { BossId } from '../data/worlds';
import { T, type Room, type Spec } from './types';
import { TILE } from './constants';
import {
  OPS_MAX_BY_WORLD, RoomB, arenaSpecs, hallOfStatues, hubMaze, placeEnemies, placePickups, placePowerups, placeSecrets, placeWarps,
  type GenOpts, type Style,
} from './levelgen';
import type { LevelJson } from './types';

const P = (t: number) => t * TILE;
export const TALL = 46;
/** najwyższy dozwolony wiersz powierzchni trasy głównej (zostaje ≥ 18 wierszy nad głową na lofty i sprężyny) */
const TOP_GY = 18;

type Piece = (x: number, room: number) => number;       // zwraca liczbę zajętych kolumn; −1 = nie da się tu zbudować

/** krótki „program nauczania” poziomu 1-1: kolejne elementy wprowadzają mechaniki po kolei */
const PLAN: Record<string, string[]> = {
  'W1-L1': ['hill', 'climb', 'vaultM', 'loft', 'vaultD', 'drop', 'slide', 'ramp', 'spring'],
};

/** wagi elementów wg świata (dodawane do wag bazowych) */
const NEW_BASE: Record<string, number> = { flat: 1, gap: 2.5, stairs: 0.5, hill: 4, ramp: 3, slide: 3, climb: 4, spring: 3.5, drop: 3.5, pit: 1, haz: 0, wall: 1, moving: 1, puzzle: 1, crumble: 0, phase: 0, conv: 0, ice: 0, sand: 0, oil: 0, loft: 1.2, vaultD: 0.7, vaultM: 0.7 };
const NEW_WORLD: Record<number, Record<string, number>> = {
  0: { conv: 1, puzzle: 1 },
  1: { hill: 4, climb: 2, puzzle: 1 },
  2: { conv: 2, moving: 2, oil: 2, slide: 3, haz: 1 },
  3: { haz: 2, pit: 2, spring: 2.5, climb: 2.5 },
  4: { gap: 2, hill: 3, drop: 3, ramp: 3 },
  5: { crumble: 3, gap: 3, ice: 2, sand: 2, haz: 1, drop: 3 },
  6: { gap: 3, climb: 3, stairs: 2, pit: 2, spring: 2 },
  7: { phase: 3, moving: 2, haz: 2, ice: 2.5, puzzle: 2 },
  8: { crumble: 1, phase: 1, haz: 2, moving: 1, puzzle: 2, gap: 3, spring: 3, climb: 3, oil: 1.5 },
};

/** wzmocnienia wybranych poziomów (odpowiedniki starych przeróbek wag) */
const LEVEL_BOOST: Record<string, Record<string, number>> = {
  'W7-L2': { phase: 5, gap: 2 }, 'W2-L2': { conv: 4, puzzle: 2 }, 'W2-L3': { moving: 3, gap: 4, pit: 2 },
  'W3-L3': { puzzle: 3 }, 'W6-L3': { pit: 4, gap: 3 }, 'W7-L3': { phase: 4, moving: 3 },
};

export interface Reward { kind: 'loft' | 'vaultD' | 'vaultM'; /** początek elementu (kolumna) i wiersz podłoża */ x: number; gy: number; x0: number; x1: number; slots: { x: number; y: number }[] }
/** zbudowane nagrody wg poziomu (do testów osiągalności sekretów) */
export const REWARDS = new Map<string, Reward[]>();
/** wiersz powierzchni trasy głównej w każdej kolumnie (do testów i narzędzi) */
export const ROUTES = new Map<string, Int16Array>();
/** kolejność użytych elementów (do diagnostyki) */
export const PIECES = new Map<string, string[]>();

export function buildRun2(j: LevelJson, rng: Rng, style: Style, boss: BossId | undefined, opts: GenOpts) {
  const W = j.width_tiles, id = j.level_id, world = j.world;
  const H = TALL, base = H - 4;
  const b = new RoomB(W, H);
  const rooms: Room[] = [];
  const water = !!style.water;
  const arenaW = boss ? (id === 'W8-L4' ? 40 : 34) : 0;
  const arenaX0 = boss ? W - arenaW : W;
  const endX = boss ? arenaX0 - 8 : W;

  // --- kotwice (start, posągi, checkpoint, meta/arena) — płaskie, bezpieczne odcinki
  interface Anchor { x0: number; x1: number; kind: string }
  const anchors: Anchor[] = [{ x0: 0, x1: 10, kind: 'spawn' }];
  j.petrified_residents_x_tile.forEach((x) => anchors.push({ x0: x - 3, x1: x + 4, kind: 'statue' }));
  anchors.push({ x0: j.checkpoint_x_tile - 3, x1: j.checkpoint_x_tile + 4, kind: 'cp' });
  if (boss) anchors.push({ x0: arenaX0 - 6, x1: W, kind: 'arena' }); else anchors.push({ x0: W - 10, x1: W, kind: 'exit' });
  const hubX = Math.round(W * 0.35);
  if (id === 'W8-L2') anchors.push({ x0: hubX - 6, x1: hubX + 4 * 18 + 16, kind: 'hub' });      // sala przewodów: płaska, na poziomie bazowym
  anchors.sort((a, c) => a.x0 - c.x0);
  const merged: Anchor[] = [];
  for (const a of anchors) { const l = merged[merged.length - 1]; if (l && a.x0 <= l.x1 + 2) { l.x1 = Math.max(l.x1, a.x1); l.kind += '+' + a.kind; } else merged.push({ ...a }); }

  // --- profil wysokości: lista celów (w wierszach) rozmieszczona wzdłuż poziomu
  const nWay = 6, way: number[] = [base - 2];
  // na przemian wysoko i nisko: duże wahania wysokości, jak w Sonicu (wzgórza, doliny, wieże)
  for (let i = 1; i < nWay; i++) way.push(i % 2 === 1 ? rng.int(TOP_GY + 1, TOP_GY + 9) : rng.int(base - 10, base - 3));
  way.push(boss ? base : rng.int(TOP_GY + 1, TOP_GY + 7));
  // strefa „na poziomie bazowym”: dojście do areny bossa / sali przewodów (trasa musi tam zejść na dno)
  const baseAnchor = merged.find((a) => a.kind.includes('arena') || a.kind.includes('hub'));
  const baseFrom = baseAnchor ? baseAnchor.x0 - 34 : Infinity;
  const baseTo = id === 'W8-L2' && baseAnchor ? baseAnchor.x1 : Infinity;
  const inBase = (x: number) => x > baseFrom && x < baseTo;
  const target = (x: number): number => {
    if (inBase(x)) return base;
    const f = Math.min(0.999, Math.max(0, x / Math.max(1, endX))) * (way.length - 1), i = Math.floor(f);
    return way[i] + (way[i + 1] - way[i]) * (f - i);
  };

  let gy = base - 2;                                   // start 2 wiersze nad dnem bazowym: pod podłogą jest miejsce na kapsuły
  const diffAt = (x: number) => Math.min(3, Math.floor((x / W) * 4));
  let ops = 0; const opsMax = OPS_MAX_BY_WORLD(world); let swId = 0;
  const rewards: Reward[] = [];
  const reserve = (x0: number, x1: number) => { for (let x = Math.max(0, x0); x < Math.min(W, x1); x++) b.reserved[x] = 1; };
  const CLIMBT = [1, 3, 4].includes(world) ? T.ROPE : T.CLIMB;

  const flat = (x0: number, x1: number) => { b.ground(x0, x1, gy); for (let x = x0; x < x1; x++) b.route[x] = gy; };
  const patch = (x0: number, x1: number, tile: number) => { for (let x = x0; x < x1; x++) b.set(x, gy, tile); };
  /** słup stoku: lity od `solidFrom` w dół, kafel stoku w wierszu `row` */
  const slopeCol = (x: number, row: number, tile: number) => { b.col(x, 0, H - 1, T.EMPTY); b.col(x, row + 1, H - 1, T.SOLID); b.set(x, row, tile); b.route[x] = row; };

  const pieces: Record<string, Piece> = {
    flat: (x, room) => { const n = rng.int(3, 6); flat(x, x + n); return Math.min(n, room); },
    gap: (x) => {
      const d = diffAt(x); const w = d === 0 ? 2 : d === 1 ? rng.int(2, 3) : rng.int(2, 4);
      if (water) { const n = w + 3; const g0 = gy; gy = Math.min(base, gy + 2); b.ground(x, x + n, gy); for (let q = x; q < x + n; q++) b.route[q] = gy; void g0; return n; }
      b.gap(x, x + w); return w;
    },
    stairs: (x) => {
      let up = gy > TOP_GY + 4 ? rng.chance(0.55) : false; if (gy >= base - 2) up = true;
      const steps = rng.int(2, 3); let cx = x;
      for (let i = 0; i < steps; i++) { gy += up ? -1 : 1; gy = Math.max(TOP_GY, Math.min(base, gy)); flat(cx, cx + 2); cx += 2; }
      return cx - x;
    },
    /** wzgórze: stok 45° w górę, płaskowyż, stok w dół — bez zmiany poziomu */
    hill: (x) => {
      const h = rng.pick([2, 3, 4]); if (gy - h < TOP_GY) return -1;
      let cx = x; for (let i = 0; i < h; i++) slopeCol(cx++, gy - 1 - i, T.SL_R45);
      const top = gy - h, n = rng.int(3, 6); b.ground(cx, cx + n, top); for (let q = cx; q < cx + n; q++) b.route[q] = top; cx += n;
      for (let i = 0; i < h; i++) slopeCol(cx++, top + i, T.SL_L45);
      return cx - x;
    },
    /** łagodny stok 26° na wyższy poziom (każdy 1 wiersz = 2 kafle) */
    ramp: (x) => {
      const r = rng.int(1, 3); if (gy - r < TOP_GY) return -1;
      let cx = x; for (let k = 0; k < r; k++) { const row = gy - 1 - k; slopeCol(cx++, row, T.SL_R26A); slopeCol(cx++, row, T.SL_R26B); }
      gy -= r; return cx - x;
    },
    /** zjazd ze stoku 45° w dół (rozpęd) i płaski wybieg */
    slide: (x) => {
      const d = rng.int(3, 5); if (gy + d > base) return -1;
      let cx = x; for (let i = 0; i < d; i++) slopeCol(cx++, gy + i, T.SL_L45);
      gy += d; flat(cx, cx + 6); return cx + 6 - x;
    },
    /** ściana (5–10 wierszy) z kratką lub liną: wspinaczka w górę; nad ścianą płaskowyż */
    climb: (x) => {
      const hmax = Math.min(gy - TOP_GY, 10); const hs = water ? [6, 8, 10, 12] : [5, 6, 8, 10]; const opts = hs.filter((v) => v <= (water ? gy - TOP_GY : hmax));
      if (!opts.length) return -1; const h = rng.chance(0.6) ? Math.max(...opts) : rng.pick(opts);
      flat(x, x + 4);
      if (!water) for (let r = gy - h; r < gy; r++) b.set(x + 3, r, CLIMBT);
      const top = gy - h; b.ground(x + 4, x + 10, top); for (let q = x + 4; q < x + 10; q++) b.route[q] = top;
      gy = top; return 10;
    },
    /** sprężyna pod ścianą 9–11 wierszy (apex ≈ 12,9 kafla) */
    spring: (x) => {
      if (water) return -1;
      const h = rng.chance(0.6) ? 11 : rng.pick([9, 10, 11]); if (gy - h < TOP_GY) return -1;
      flat(x, x + 3); b.set(x + 1, gy - 1, T.SPRING_U); reserve(x + 1, x + 2);
      const top = gy - h; b.ground(x + 3, x + 9, top); for (let q = x + 3; q < x + 9; q++) b.route[q] = top;
      gy = top; return 9;
    },
    /** zrzut w dół o 5–9 wierszy */
    drop: (x) => {
      const feas = [5, 7, 9].filter((v) => gy + v <= base); if (!feas.length) return -1; const d = rng.chance(0.6) ? Math.max(...feas) : rng.pick(feas);
      flat(x, x + 2); gy += d; flat(x + 2, x + 8); return 8;
    },
    pit: (x) => {
      const total = rng.int(7, 10); const n = Math.max(2, Math.floor(total / 3)); let cx = x + 1, row = gy;
      b.gap(x, x + total);
      for (let i = 0; i < n; i++) { row = Math.max(gy - 2, Math.min(gy, row + rng.pick([-1, 0, 1]))); b.oneway(cx, 3, row); cx += 4; if (cx > x + total - 2) break; }
      return total;
    },
    haz: (x) => { const w = rng.int(2, 3); flat(x, x + w); for (let i = 0; i < w; i++) b.set(x + i, gy, T.HAZARD); return w; },
    wall: (x) => {
      const h = 5; const enterX = x + 1, exitX = x + 6;
      flat(x, x + 8); b.block(x + 3, gy - h, 2, h);
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
    puzzle: (x, room) => {
      const nOps = Math.min(opsMax - ops, world <= 2 ? 2 : rng.int(2, 3)); if (nOps < 1) return pieces.flat(x, room);
      const len = 6 + nOps * 3; flat(x, x + len);
      const gid = `${id}:g${x}`; const cells: [number, number][] = [];
      const gx = x + len - 2; for (let r = gy - 6; r < gy; r++) { b.set(gx, r, T.GATE); cells.push([gx, r]); }
      b.specs.push({ t: 'gate', id: gid, cells, need: nOps });
      for (let i = 0; i < nOps; i++) {
        const sx = x + 3 + i * 3; const hi = world >= 3 && i % 2 === 1;
        if (hi) b.oneway(sx - 1, 3, gy - 2);
        b.specs.push({ t: 'switch', id: `${gid}:s${i}`, x: P(sx) + 16, y: P(hi ? gy - 2 : gy), gate: gid, style: style.switchStyle, symbol: swId++ % 4 });
      }
      ops += nOps; return len;
    },
    crumble: (x) => { const total = rng.int(6, 9); b.gap(x, x + total); for (let i = 0; i < total; i++) b.set(x + i, gy, T.CRUMBLE); return total; },
    phase: (x) => {
      const total = 9; b.gap(x, x + total);
      for (let i = 0; i < 3; i++) b.specs.push({ t: 'platform', x: P(x + 1 + i * 3), y: P(gy - (i % 2)), w: 2, mode: 'phase', range: 0, speed: 3.2, offset: i * 0.33 });
      return total;
    },
    conv: (x) => { const n = 8; flat(x, x + n); const dir = rng.chance(0.5) ? T.CONVL : T.CONVR; patch(x, x + n, dir); return n; },
    ice: (x) => { const n = rng.int(7, 9); flat(x, x + n); patch(x, x + n, T.ICE); return n; },
    sand: (x) => { const n = rng.int(7, 9); flat(x, x + n); patch(x, x + n, T.SAND); return n; },
    oil: (x) => { const n = rng.int(6, 8); flat(x, x + n); patch(x, x + n, T.OIL); return n; },
    /** trasa górna: sprężyna wyrzuca na długą półkę 9 wierszy wyżej (opcjonalna nagroda) */
    loft: (x) => {
      if (water || x < 12) return -1;
      const n = 19; flat(x, x + n); b.set(x + 2, gy - 1, T.SPRING_U);
      const row = gy - 9; b.oneway(x + 1, 16, row); reserve(x + 1, x + 4);
      const slots: { x: number; y: number }[] = []; for (let i = 0; i < 8; i++) slots.push({ x: P(x + 3 + i) + 16, y: P(row - 1) + 8 - (i % 2) * 4 });
      rewards.push({ kind: 'loft', x, gy, x0: x + 3, x1: x + 17, slots });
      return n;
    },
    /** szyb 3-kafelkowy dla Dariooosha: odbijanie od ścian, nagroda na półce 9 wierszy nad ziemią */
    vaultD: (x) => {
      if (water || x < 12) return -1;
      const n = 14; flat(x, x + n);
      // ściany wiszą nad trasą (2 wiersze prześwitu na przejście), szyb jest otwarty od dołu — Darioosh wskakuje i odbija się w górę
      const top = gy - 9; b.block(x + 4, top, 1, 7); b.block(x + 8, top, 4, 7);
      reserve(x + 3, x + 13);
      rewards.push({ kind: 'vaultD', x, gy, x0: x + 8, x1: x + 12, slots: [0, 1, 2, 3].map((i) => ({ x: P(x + 8 + i) + 16, y: P(top - 1) + 8 })) });
      return n;
    },
    /** kapsuła pod pękniętą posadzką dla Marioosha: uderzenie w ziemię, w środku sprężyna powrotna */
    vaultM: (x) => {
      if (water || gy > base - 2 || x < 12) return -1;
      const n = 12; flat(x, x + n);
      for (let cx = x + 4; cx <= x + 6; cx++) { b.col(cx, gy + 1, gy + 4, T.EMPTY); b.set(cx, gy, T.CRACKED); }
      b.set(x + 5, gy + 4, T.SPRING_U); reserve(x + 3, x + 8);
      rewards.push({ kind: 'vaultM', x, gy, x0: x + 4, x1: x + 7, slots: [[4, 3], [6, 3], [4, 2], [5, 2], [6, 2]].map(([cx, cy]) => ({ x: P(x + cx) + 16, y: P(gy + cy) + 8 })) });
      return n;
    },
  };

  const needW: Record<string, number> = { flat: 4, gap: 7, stairs: 9, hill: 17, ramp: 12, slide: 15, climb: 13, spring: 12, drop: 11, pit: 11, haz: 6, wall: 8, moving: 6, puzzle: 16, crumble: 9, phase: 9, conv: 8, ice: 10, sand: 10, oil: 9, loft: 20, vaultD: 14, vaultM: 15 };
  const UP = new Set(['climb', 'spring', 'ramp']), DOWN = new Set(['drop', 'slide']);
  const allowed = (name: string, d: number): boolean => {
    if (water && ['moving', 'crumble', 'phase', 'conv', 'wall', 'haz', 'ice', 'sand', 'oil', 'pit', 'spring', 'loft', 'vaultD', 'vaultM', 'puzzle'].includes(name)) return false;
    if (name === 'puzzle' && ops >= opsMax) return false;
    if (['pit', 'moving', 'crumble', 'phase', 'wall', 'haz'].includes(name) && d < 1) return false;
    if (['loft', 'vaultD', 'vaultM'].includes(name) && d < 1) return false;
    return true;
  };

  const plan = [...(PLAN[id] ?? [])];
  const log: string[] = []; PIECES.set(id, log);
  const done = new Set<string>(); const tries: Record<string, number> = {};
  const MUST: [number, string][] = [[0.1, 'hill'], [0.2, 'climb'], [0.3, 'vaultM'], [0.5, 'loft'], [0.68, 'vaultD']];
  const fillSpan = (a: number, c: number) => {
    let x = a;
    while (x < c) {
      const room = c - x;
      if (room < 8) { flat(x, c); x = c; break; }
      const d = diffAt(x);
      let pick = 'flat';
      const forced = plan[0]; let planned = false;
      if (forced && (needW[forced] ?? 6) + 3 <= room) { pick = plan.shift()!; planned = true; }
      else if (forced) pick = 'flat';
      else {
        const names = Object.keys(pieces).filter((n) => allowed(n, d));
        const want = gy - target(x + 10);                                  // > 0: za nisko, trzeba w górę
        const weights = names.map((n) => {
          let wgt = Math.max(0, LEVEL_BOOST[id]?.[n] ?? NEW_WORLD[world]?.[n] ?? NEW_BASE[n] ?? 0);
          if (want > 3) { if (UP.has(n)) wgt *= 5; if (DOWN.has(n)) wgt *= 0.1; }
          else if (want < -3) { if (DOWN.has(n)) wgt *= 5; if (UP.has(n)) wgt *= 0.1; }
          return wgt;
        });
        const tot = weights.reduce((s, v) => s + v, 0);
        if (tot > 0) { let r = rng.next() * tot; for (let i = 0; i < names.length; i++) { r -= weights[i]; if (r <= 0) { pick = names[i]; break; } } }
      }
      // obowiązkowe sekrety (po jednym na poziom): kapsuła Marioosha, trasa górna, szyb Dariooosha — próbujemy po kolei, aż któryś się zmieści
      let used = -2;
      if (!forced && !water && !inBase(x + 6)) {
        for (const [f, k] of MUST) {
          if (x < f * endX || done.has(k) || !allowed(k, 1) || needW[k] + 3 > room) continue;
          const u = pieces[k](x, room); if (u >= 0) { used = u; pick = k; done.add(k); break; }
        }
      }
      if (used === -2) {
        if (inBase(x) && gy < base - 1) pick = rng.pick(['drop', 'slide']);
        if ((needW[pick] ?? 6) + 3 > room) pick = 'flat';
        used = pieces[pick](x, room);
        if (used < 0) { if (planned && (tries[pick] = (tries[pick] ?? 0) + 1) < 4) plan.push(pick); used = pieces.flat(x, room); pick = 'flat'; } else done.add(pick);
      }
      log.push(`${pick}@${x}/${gy}`);
      if (x + used > c - 1) used = Math.min(used, c - x);
      x += used;
      if (pick !== 'flat' && x < c) { const tail = Math.min(UP.has(pick) || DOWN.has(pick) || pick === 'hill' ? rng.int(2, 3) : rng.int(3, 4), c - x); flat(x, x + tail); x += tail; }
    }
  };

  let cursor = 0;
  for (const a of merged) {
    if (a.x0 > cursor) fillSpan(cursor, a.x0);
    const x0 = Math.max(cursor, a.x0);
    if (a.kind.includes('hub')) { let cx = x0; while (gy < base && cx < a.x1 - 2) { flat(cx, cx + 2); cx += 2; gy = Math.min(base, gy + 2); } flat(cx, a.x1); cursor = a.x1; continue; }
    if (a.kind.includes('arena')) {
      // sprowadź teren do wiersza areny schodkami co 2 wiersze (zapas na wypadek, gdyby trasa jeszcze nie opadła)
      let cx = x0; while (gy < base && cx < arenaX0 - 2) { flat(cx, cx + 2); cx += 2; gy = Math.min(base, gy + 2); }
      flat(cx, arenaX0); gy = base; b.ground(arenaX0, W, base); for (let q = arenaX0; q < W; q++) b.route[q] = base; cursor = a.x1; continue;
    }
    flat(x0, a.x1); cursor = a.x1;
  }
  if (cursor < W) fillSpan(cursor, W);
  b.col(0, 0, H - 1); b.col(W - 1, 0, H - 1);

  const specs = b.specs;
  if (boss) { b.ground(arenaX0, W, base); b.col(W - 1, 0, H - 1); arenaSpecs(b, boss, arenaX0, W, base, id); }

  // --- jaskinia / woda: sufit podąża za terenem (zawsze ≥ 13 wierszy nad trasą, żeby zmieścił się skok ze sprężyny)
  if (style.cave || water) {
    const lo = 12, hi = endX - 12;
    for (let x = 0; x < W; x++) {
      if (x < lo || x >= hi) { b.col(x, 0, 1); continue; }
      let m = 99; for (let q = Math.max(0, x - 8); q <= Math.min(W - 1, x + 8); q++) if (b.route[q] >= 0) m = Math.min(m, b.route[q]);
      const c = Math.max(1, m - 13 - rng.int(0, 2)); b.col(x, 0, c, T.SOLID);
    }
  }
  if (water) for (let i = 0; i < b.water.length; i++) b.water[i] = 1;

  // --- podpowiedzi do nowych mechanik: przy pierwszym wystąpieniu danego elementu na trasie (raz na poziom)
  const HINT_OF: Record<string, string> = { hill: 'hint.slope', ramp: 'hint.slope', slide: 'hint.slope', climb: 'hint.climb', spring: 'hint.spring', loft: 'hint.spring', vaultM: 'hint.pound', vaultD: 'hint.walljump', gap: 'hint.glide', ice: 'hint.ice', sand: 'hint.sand', oil: 'hint.oil' };
  { const seen = new Set<string>(); const lastX = new Set<number>();
    for (const e of log) {
      const m = /^(\w+)@(\d+)/.exec(e); if (!m) continue; const key = HINT_OF[m[1]]; if (!key || seen.has(key)) continue;
      let hx = Math.max(2, +m[2] - 5); while (lastX.has(hx)) hx += 5;      // dwie podpowiedzi nigdy w tym samym miejscu
      seen.add(key); lastX.add(hx); b.specs.push({ t: 'hint', x: P(hx), y: 0, w: P(5), key });
    }
  }

  // --- posągi, checkpoint, wyjście
  j.petrified_residents_x_tile.forEach((sx, i) => { const s = b.surface(sx); specs.push({ t: 'statue', idx: i, x: P(sx) + 16, y: P(s < 0 ? gy : s), id: `${id}-S${i + 1}` }); });
  const cpS = b.surface(j.checkpoint_x_tile); specs.push({ t: 'checkpoint', x: P(j.checkpoint_x_tile) + 16, y: P(cpS) });
  let exitPx: { x: number; y: number };
  if (!boss) { const es = b.surface(W - 5); specs.push({ t: 'exit', x: P(W - 5), y: P(es) }); exitPx = { x: P(W - 5), y: P(es) }; }
  else { exitPx = { x: P(W - 6), y: P(base) }; specs.push({ t: 'exit', x: P(W - 6), y: P(base) }); }
  const spawnRow = b.surface(3);

  // --- wrogowie, przedmioty, skrzynki, sekrety
  placeEnemies(b, rng, j, style, endX, opts);
  const skip: [number, number][] = boss ? [[arenaX0 - 6, W]] : [];
  for (let x = 0; x < W; x++) if (b.reserved[x]) skip.push([x, x]);
  const goldSlots: { x: number; y: number }[] = [];
  const order: Reward['kind'][] = ['vaultD', 'vaultM', 'loft'];
  const byKind = [...rewards].sort((p, q) => order.indexOf(p.kind) - order.indexOf(q.kind));
  for (let i = 0; i < j.collectibles.golden_cans && byKind.length; i++) { const r = byKind[i % byKind.length]; goldSlots.push(r.slots[(Math.floor(i / byKind.length)) % r.slots.length]); }
  placePickups(b, rng, j, id, skip, goldSlots.length ? goldSlots : undefined);
  // nagrody w trasach górnych i kapsułach: przenosimy tam część zwykłych opakowań (budżet się nie zmienia)
  const loose = specs.filter((s): s is Extract<Spec, { t: 'item' }> => s.t === 'item' && (s.k === 'pet' || s.k === 'can'));
  const used = new Set<string>();
  for (const r of rewards) {
    const slots = r.kind === 'vaultD' ? r.slots.slice(0, 3) : r.slots;
    let k = 0;
    const cand = loose.filter((it) => !used.has(it.id)).sort((p, q) => Math.abs(p.x - P(r.x0)) - Math.abs(q.x - P(r.x0)));
    for (const it of cand) { if (k >= slots.length) break; if (Math.abs(it.x - P(r.x0)) > P(60)) break; it.x = slots[k].x; it.y = slots[k].y; used.add(it.id); k++; }
  }
  // wrogowie nie mogą startować w litej skale (lot nad ścianą, sufit jaskini)
  for (let i = specs.length - 1; i >= 0; i--) {
    const sp = specs[i]; if (sp.t !== 'enemy') continue;
    const tx = Math.floor(sp.x / TILE); let ty = Math.floor((sp.y - 20) / TILE); let n = 0;
    const solid = (q: number) => { const t = b.get(tx, q); return t !== T.EMPTY && t !== T.CLIMB && t !== T.ROPE && t !== T.SPRING_U; };
    while (ty > 0 && solid(ty) && n < 14) { ty--; n++; }
    if (solid(ty)) specs.splice(i, 1); else if (n) sp.y = P(ty + 1);
  }
  placePowerups(b, rng, j, id, world, endX);
  placeSecrets(b, rng, j, id, world, rooms, style, endX);
  placeWarps(b, rng, j, id, world, gy);
  if (style.rain) specs.push({ t: 'rain', x0: P(12), x1: P(endX - 4), interval: style.rain });
  if (style.dark) for (let x = 14; x < W - 6; x += 22) { const s = b.surface(x); if (s > 0) specs.push({ t: 'lantern', x: P(x) + 16, y: P(s), id: `${id}-L${x}` }); }
  if (world === 5 || world === 8) for (let x = 52; x < endX - 2; x += 56) { const s = b.surface(x); if (s > 0) specs.push({ t: 'lamp', x: P(x) + 16, y: P(s) }); }
  if (id === 'W2-L2') {
    const s = b.surface(100); specs.push({ t: 'ecoport', x: P(100), y: P(s), broken: true, id: 'W2-L2-ECO', fuses: ['W2-L2-F1', 'W2-L2-F2'] });
    specs.push({ t: 'switch', id: 'W2-L2-F1', x: P(95), y: P(b.surface(95)), gate: 'eco', style: 'relay', symbol: 0 });
    specs.push({ t: 'switch', id: 'W2-L2-F2', x: P(105), y: P(b.surface(105)), gate: 'eco', style: 'relay', symbol: 1 });
  }
  if (id === 'W8-L2') hubMaze(b, rng, j);
  if (id === 'W8-L3') hallOfStatues(b, rng, j);

  REWARDS.set(id, rewards); ROUTES.set(id, b.route);
  const main = b.toRoom(world, 'main', !!style.dark, { x: P(3) + 16, y: P(spawnRow) });
  main.bossArena = boss ? { x0: arenaX0, x1: W } : undefined;
  const allRooms = (b as unknown as { _rooms?: Room[] })._rooms; if (allRooms) rooms.push(...allRooms);
  return { main, rooms, spawn: { x: P(3) + 16, y: P(spawnRow) }, cp: { x: P(j.checkpoint_x_tile) + 16, y: P(cpS) }, exit: exitPx, rewards };
}
