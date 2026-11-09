/**
 * Ręcznie projektowane poziomy v0.4 (docs/design/09, 10): graf pokoi opisanych ASCII-art + logika w kodzie.
 * Jedna litera = jeden kafel (32 px = 0,8 m). Zasada: geometria w ASCII, zachowania (przełączniki, bramy, windy, drzwi) w kodzie mapy.
 *
 * Kafle:  # lity · = platforma jednokierunkowa · H drabina · ^ kolce · C pękająca ściana (klucz Marioosha) · i lód · o olej · n piasek
 *         < > taśmociąg · ( ) rampa 26° w prawo (dolna/górna połowa) · [ ] rampa 26° w lewo (górna/dolna połowa) · ~ woda · 1–9 komórki bramy
 * Znaczniki (puste kafle z pozycją): S start · K checkpoint · X wyjście · p PET · k puszka · * złota puszka · r Roguś · z Żukoróg · a Baranitor
 *         m Ćmoróg · T posąg mieszkańca · E EcoPort · pozostałe litery — własne (odczyt przez room.at('A'))
 * Wysokości liczymy od podłoża: jeden wiersz = 0,8 m; hitbox dorosłego ≈ 2,2 wiersza.
 */
import { TILE } from './constants';
import { T, type EnemyKind, type ItemKind, type LevelData, type Room, type Spec } from './types';
import type { BossId } from '../data/worlds';

const TILE_CHARS: Record<string, number> = {
  '#': T.SOLID, '=': T.ONEWAY, H: T.LADDER, '^': T.HAZARD, C: T.CRACKED, i: T.ICE, o: T.OIL, n: T.SAND, '<': T.CONVL, '>': T.CONVR,
  '(': T.SL_R26A, ')': T.SL_R26B, '[': T.SL_L26A, ']': T.SL_L26B,
};
const ENEMY_CHARS: Record<string, EnemyKind> = { r: 'rogus', z: 'zukorog', a: 'baranitor', m: 'cmorog', y: 'bykobieg' };
const ITEM_CHARS: Record<string, ItemKind> = { p: 'pet', k: 'can', '*': 'golden', B: 'battery', x: 'xl' };

export interface Mark { tx: number; ty: number }
export interface RoomOpts { name?: string; world: number; /** prostokąty wody [x0,y0,x1,y1] (kafle, włącznie): woda we wszystkich kaflach niebędących litą skałą, także w drabinach i pustce */ wet?: [number, number, number, number][]; dark?: boolean; bossArena?: { x0: number; x1: number }; wrapDeath?: boolean }

/** środek kafla (px) */
export const cx = (tx: number): number => tx * TILE + TILE / 2;
/** dolna krawędź kafla = poziom stóp stojącego w tym kaflu */
export const feet = (ty: number): number => (ty + 1) * TILE;

export class AuthoredRoom {
  w: number; h: number; tiles: Uint8Array; water: Uint8Array;
  specs: Spec[] = []; marks = new Map<string, Mark[]>();
  /** komórki bramek wg cyfry */
  gateCells = new Map<string, [number, number][]>();
  constructor(public id: string, rows: string[], public opts: RoomOpts) {
    this.h = rows.length; this.w = Math.max(...rows.map((r) => r.length));
    this.tiles = new Uint8Array(this.w * this.h); this.water = new Uint8Array(this.w * this.h);
    rows.forEach((row, ty) => {
      for (let tx = 0; tx < this.w; tx++) {
        const ch = row[tx] ?? '.';
        if (ch in TILE_CHARS) this.tiles[ty * this.w + tx] = TILE_CHARS[ch];
        else if (ch === '~') this.water[ty * this.w + tx] = 1;
        else if (ch >= '1' && ch <= '9') { this.tiles[ty * this.w + tx] = T.GATE; const k = 'g' + ch; this.gateCells.set(k, [...(this.gateCells.get(k) ?? []), [tx, ty]]); }
        else if (ch !== '.' && ch !== ' ') { const a = this.marks.get(ch) ?? []; a.push({ tx, ty }); this.marks.set(ch, a); }
      }
    });
    for (const [x0, y0, x1, y1] of opts.wet ?? []) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const t = this.tiles[y * this.w + x]; if (t === T.EMPTY || t === T.LADDER) this.water[y * this.w + x] = 1; }
  }
  /** i-te wystąpienie znacznika (błąd, jeśli brak) */
  at(ch: string, i = 0): Mark { const m = this.marks.get(ch)?.[i]; if (!m) throw new Error(`${this.id}: brak znacznika '${ch}'[${i}]`); return m; }
  all(ch: string): Mark[] { return this.marks.get(ch) ?? []; }
  push(...s: Spec[]): this { this.specs.push(...s); return this; }
  /** drzwi/terminal pełnej wielkości (≥ 90 px wysokości) */
  door(id: string, m: Mark, color: 'blue' | 'green' | 'yellow' | 'red' | 'purple', dest: { room: number; x: number; y: number } | null, extra: { warp?: string; locked?: boolean; hidden?: boolean } = {}): this {
    return this.push({ t: 'cable', id, color, x: cx(m.tx), y: feet(m.ty), face: 'door', dest: dest ?? undefined, ...extra });
  }
  /** wspólne znaczniki: przedmioty, wrogowie, start, checkpoint, wyjście, posągi */
  autoSpecs(tag: string, statues: string[] = []): this {
    let n = 0, s = 0;
    for (const [ch, list] of this.marks) {
      for (const m of list) {
        if (ch in ITEM_CHARS) this.specs.push({ t: 'item', k: ITEM_CHARS[ch], x: cx(m.tx), y: m.ty * TILE + 16, id: `${tag}:${this.opts.name ?? 'main'}:${ch}${n++}` });
        else if (ch in ENEMY_CHARS) this.specs.push({ t: 'enemy', k: ENEMY_CHARS[ch], x: cx(m.tx), y: feet(m.ty) });
        else if (ch === 'K') this.specs.push({ t: 'checkpoint', x: cx(m.tx), y: feet(m.ty) });
        else if (ch === 'X') this.specs.push({ t: 'exit', x: cx(m.tx), y: feet(m.ty) });
        else if (ch === 'T') { this.specs.push({ t: 'statue', idx: s, x: cx(m.tx), y: feet(m.ty), id: statues[s] ?? `${tag}-S${s + 1}` }); s++; }
        else if (ch === 'E') this.specs.push({ t: 'ecoport', x: cx(m.tx), y: feet(m.ty), broken: false, id: `${tag}:eco`, fuses: [] });
      }
    }
    return this;
  }
  toRoom(): Room {
    const sp = this.marks.get('S')?.[0];
    const spawn = sp ? { x: cx(sp.tx), y: feet(sp.ty) } : { x: 3 * TILE, y: 3 * TILE };
    return { w: this.w, h: this.h, tiles: this.tiles, water: this.water, specs: this.specs, world: this.opts.world, dark: !!this.opts.dark, name: this.opts.name ?? 'main', spawn, bossArena: this.opts.bossArena, wrapDeath: this.opts.wrapDeath };
  }
}

export interface AuthoredMeta {
  id: string; world: number; stage: number; planet?: number;
  boss?: BossId; residents?: number; budget?: { pet: number; cans: number; golden: number };
  /** prototyp / fragment testowy (nie wchodzi do głównej ścieżki) */
  proto?: boolean; hints?: string[];
}

export function assemble(meta: AuthoredMeta, rooms: AuthoredRoom[]): LevelData {
  const rr = rooms.map((r) => r.toRoom());
  const main = rooms[0];
  const cp = main.marks.get('K')?.[0] ?? main.marks.get('S')![0];
  const ex = main.marks.get('X')?.[0] ?? cp;
  const hints = meta.hints ?? [];
  hints.forEach((key, i) => { const m = main.marks.get('?')?.[i]; if (m) rr[0].specs.push({ t: 'hint', x: m.tx * TILE, y: 0, w: TILE * 5, key }); });
  const n = meta.residents ?? 0;
  return {
    id: meta.id, world: meta.world, stage: meta.stage, planet: meta.planet, titleKey: 'lvl.' + meta.id, timeLimit: 0, mode: meta.boss ? 'boss' : 'run', rooms: rr,
    boss: meta.boss, checkpointPx: { x: cx(cp.tx), y: feet(cp.ty) }, exitPx: { x: cx(ex.tx), y: feet(ex.ty) },
    residents: Array.from({ length: n }, (_, i) => `${meta.id}-S${i + 1}`),
    budget: meta.budget ?? { pet: 0, cans: 0, golden: 0 }, hints,
  };
}

/** Płótno do składania pokoi z prymitywów (prostokąty, schody-rampy, drabiny) — wynik to ASCII zgodne z legendą powyżej. */
export class Canvas {
  cells: string[][];
  constructor(public w: number, public h: number, fill = '.') { this.cells = Array.from({ length: h }, () => Array.from({ length: w }, () => fill)); }
  set(x: number, y: number, ch: string): this { if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.cells[y][x] = ch; return this; }
  get(x: number, y: number): string { return x >= 0 && y >= 0 && x < this.w && y < this.h ? this.cells[y][x] : '#'; }
  /** prostokąt włącznie z obiema krawędziami */
  rect(x0: number, y0: number, x1: number, y1: number, ch: string): this { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.set(x, y, ch); return this; }
  /** podłoże: lity blok od wiersza `row` do dołu w kolumnach x0..x1 */
  ground(x0: number, x1: number, row: number): this { return this.rect(x0, row, x1, this.h - 1, '#'); }
  /** schody-rampa w prawo: podłoga `floor` (wiersz powierzchni) wznosi się o `rise` kafli na 2·rise kolumnach; zwraca kolumnę pierwszej kolumny górnej podłogi */
  rampUp(x: number, floor: number, rise: number): number {
    for (let i = 0; i < rise; i++) {
      const r = floor - 1 - i; this.set(x + 2 * i, r, '(').set(x + 2 * i + 1, r, ')');
      for (const c of [x + 2 * i, x + 2 * i + 1]) for (let y = r + 1; y < this.h; y++) if (this.get(c, y) === '.') this.set(c, y, '#');
    }
    return x + 2 * rise;
  }
  /** rampa w dół (w prawo): podłoga `floor` opada o `drop` kafli na 2·drop kolumnach; zwraca pierwszą kolumnę dolnej podłogi */
  rampDown(x: number, floor: number, drop: number): number {
    for (let i = 0; i < drop; i++) {
      const r = floor + i; this.set(x + 2 * i, r, '[').set(x + 2 * i + 1, r, ']');
      for (const c of [x + 2 * i, x + 2 * i + 1]) for (let y = r + 1; y < this.h; y++) this.set(c, y, '#');
    }
    return x + 2 * drop;
  }
  /** rampa w górę w lewo (lustro rampUp): zwraca kolumnę, od której (w lewo) zaczyna się górna podłoga */
  rampUpLeft(x: number, floor: number, rise: number): number {
    for (let i = 0; i < rise; i++) {
      const r = floor - 1 - i; const cc = x - 2 * i;
      this.set(cc - 1, r, '[').set(cc, r, ']');
      for (const c of [cc - 1, cc]) for (let y = r + 1; y < this.h; y++) if (this.get(c, y) === '.') this.set(c, y, '#');
    }
    return x - 2 * rise;
  }
  ladder(x: number, y0: number, y1: number): this { return this.rect(x, y0, x, y1, 'H'); }
  rows(): string[] { return this.cells.map((r) => r.join('')); }
}
