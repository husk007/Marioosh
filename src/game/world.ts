/** Świat gry: runtime poziomu — gracze, wrogowie, przedmioty, przewody, bossowie, kamera. Logika w stałym kroku 60 Hz. */
import { traceBeams } from './beam';
import type { AudioEngine, SfxName } from '../engine/audio';
import type { PlayerInput } from '../engine/input';
import { Rng } from '../engine/rng';
import type { Settings } from '../engine/settings';
import { BOSS_BY_WORLD } from '../data/worlds';
import { BossCtx, bossHarmful, hitBoss, makeBoss, updateBoss } from './bosses';
import {
  BROTHERS, INVULN_AFTER_HIT, KEY_ACTIVE, KEY_WINDUP, PETRIFY_DECAY, PETRIFY_DELAY, PETRIFY_MAX, PETRIFY_RATE, PETRIFY_TIER1, PETRIFY_TIER2,
  PICKUP_RADIUS, SPARK_BOUNCES, SPARK_LIFE, SPARK_MAX, SPARK_SPEED, STATUE_TIME_COOP, TELEPORT_TIME, MAX_HP, effectiveGravity, TILE, TIME_EXTENDER, TIME_GLOVES,
  TIME_MAGNET, TIME_STAR, VH, VW, AIR_MAX, AIR_WARN, AIR_REFILL, DROWN_INTERVAL, type Brother,
} from './constants';
import {
  Beam, Crate, Current, Decor, EcoEnt, Enemy, GateEnt, Hint, Item, LanternEnt, Particle, Plat, PlayerEnt, Projectile, RoomRT, StatueEnt, SwitchEnt, noUpgrades,
} from './entities';
import { AICtx, harmful, hitEnemy, makeEnemy, stompable, updateEnemy, STATS } from './enemies';
import { hitsSolid, moveBody, touchesTile, tileAt, type Grid } from './physics';
import { newMove, stepMovement, type MoveInput } from './movement';
import type { Session } from './session';
import { T, rectsOverlap, type Dest, type EnemyKind, type LevelData, type Room } from './types';

export type WorldEvent =
  | { t: 'toast'; key: string; params?: Record<string, string | number> }
  | { t: 'caption'; key: string }
  | { t: 'clear'; timeLeft: number }
  | { t: 'gameover' }
  | { t: 'warp'; level: string }
  | { t: 'checkpoint' }
  | { t: 'bossStart'; id: string }
  | { t: 'bossDown'; id: string }
  | { t: 'save' };

export interface WorldOpts { audio: AudioEngine; settings: Settings; night: boolean }

const px = (b: { x: number; w: number }) => b.x + b.w / 2;
const py = (b: { y: number; h: number }) => b.y + b.h / 2;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export class World {
  level: LevelData; session: Session; opts: WorldOpts;
  rooms: RoomRT[] = []; ri = 0;
  players: PlayerEnt[] = [];
  projs: Projectile[] = []; parts: Particle[] = []; beams: Beam[] = [];
  events: WorldEvent[] = [];
  time = 0; timeLeft: number; state: 'play' | 'clear' | 'over' = 'play';
  cam = { x: 0, y: 0 }; shakeT = 0; shakeA = 0; flash = 0;
  platsOffT = 0; endT = 0; bossDeadHandled = false; fixedStart = 0;
  /** grawitacja planety (px/s²) — patrz PLANET_PHYSICS */
  g: number;
  rng: Rng; speedMul: number; lightsOn = true; deathCount = 0; bossIntroShown = false; bossFails = 0;
  readyT = 1.4;

  constructor(level: LevelData, session: Session, opts: WorldOpts) {
    this.level = level; this.session = session; this.opts = opts; this.rng = new Rng('w:' + level.id);
    this.timeLeft = 0;   // v0.4: brak globalnego licznika czasu
    this.g = effectiveGravity(level.planet ?? level.world);
    this.speedMul = opts.night ? 1.12 : 1;
    this.rooms = level.rooms.map((r) => this.buildRoom(r));
    session.beginLevel();
    const main = this.rooms[0];
    const cp = level.checkpointPx;
    void cp;
    const brothers: Brother[] = session.coop ? [session.data.brother, session.data.brother === 'M' ? 'D' : 'M'] : [session.data.brother];
    brothers.forEach((b, i) => this.players.push(this.newPlayer(i as 0 | 1, b, main.room.spawn.x + i * 26, main.room.spawn.y)));
    this.snapCamera();
    for (const e of main.enemies) void e;
    if (main.boss) this.say('bosshint.' + main.boss.id);
  }

  // ------------------------------------------------------------------ budowa
  private buildRoom(room: Room): RoomRT {
    const tiles = room.tiles.slice();
    const grid: Grid = { w: room.w, h: room.h, tiles };
    const rt: RoomRT = {
      room, tiles, grid, enemies: [], items: [], crates: [], cables: [], statues: [], switches: [], gates: [], plats: [], checkpoints: [], exits: [], ecos: [],
      lamps: [], lanterns: [], hints: [], currents: [], rains: [], decor: [], signs: [], crumble: new Map(), boss: null,
      water: room.water.slice(), floods: [], spans: [],
    };
    const S = this.session;
    for (const s of room.specs) {
      switch (s.t) {
        case 'enemy': rt.enemies.push(makeEnemy(s.k, s.x, s.y)); break;
        case 'item': rt.items.push({ id: s.id, kind: s.k, x: s.x, y: s.y, vy: 0, taken: false, ghost: this.persistent(s.k) && S.collected.has(s.id), t: 0, popT: 0, fixed: true }); break;
        case 'crate': {
          const tx = Math.floor(s.x / TILE), ty = Math.floor(s.y / TILE);
          const used = this.persistent(s.k) && S.collected.has(s.id);
          rt.crates.push({ id: s.id, k: s.k, tx, ty, hidden: s.hidden, revealed: used || !s.hidden, used, bump: 0 });
          if (!s.hidden || used) tiles[ty * room.w + tx] = T.SOLID;
          break;
        }
        case 'cable': {
          const tx = Math.floor(s.x / TILE), ty = Math.floor((s.face === 'door' ? s.y - 1 : s.y) / TILE); if (s.face !== 'door') tiles[ty * room.w + tx] = T.CABLE;
          rt.cables.push({ id: s.id, color: s.color, tx, ty, face: s.face, dest: s.dest, warp: s.warp, locked: !!s.locked, hidden: !!s.hidden, revealed: !s.hidden, symbol: s.symbol });
          break;
        }
        case 'statue': rt.statues.push({ id: s.id, idx: s.idx, x: s.x, y: s.y, freed: S.freed.has(s.id), t: 0, ghost: S.freed.has(s.id) }); break;
        case 'switch': rt.switches.push({ id: s.id, x: s.x, y: s.y, gate: s.gate, style: s.style, symbol: s.symbol, on: false, latch: 0 }); break;
        case 'gate': rt.gates.push({ id: s.id, cells: s.cells, need: s.need, open: false, openT: 0 }); break;
        case 'platform': rt.plats.push({ x: s.x, y: s.y, w: s.w * TILE, mode: s.mode, range: s.range, speed: s.speed, offset: s.offset, dwell: s.dwell, x0: s.x, y0: s.y, dx: 0, dy: 0, solid: true, t: 0, fall: 0, warn: false }); break;
        case 'checkpoint': rt.checkpoints.push({ x: s.x, y: s.y, on: false }); break;
        case 'exit': rt.exits.push({ x: s.x, y: s.y }); break;
        case 'ecoport': rt.ecos.push({ id: s.id, x: s.x, y: s.y, broken: s.broken, fuses: s.fuses, used: false, flash: 0 }); break;
        case 'lamp': rt.lamps.push({ x: s.x, y: s.y }); break;
        case 'lantern': rt.lanterns.push({ id: s.id, x: s.x, y: s.y, lit: false }); break;
        case 'hint': rt.hints.push({ x: s.x, w: s.w, key: s.key, shown: false }); break;
        case 'rain': rt.rains.push({ x0: s.x0, x1: s.x1, interval: s.interval }); break;
        case 'span': rt.spans.push({ gate: s.gate, cells: s.cells, done: false }); break;
        case 'flood': rt.floods.push({ x0: s.x0, x1: s.x1, y0: s.y0 ?? 0, y1: s.y1 ?? 9999, from: s.from, to: s.to, speed: s.speed, gate: s.gate, cur: s.from }); break;
        case 'current': rt.currents.push({ x: s.x, y: s.y, w: s.w, h: s.h, fx: s.fx, fy: s.fy }); break;
        case 'decor': rt.decor.push({ k: s.k, x: s.x, y: s.y, hits: 0, state: 0 }); break;
        case 'sign': rt.signs.push({ x: s.x, y: s.y, symbol: s.symbol }); break;
        case 'boss': {
          const a = room.bossArena ?? { x0: 0, x1: room.w };
          rt.boss = makeBoss(s.k, s.x, s.y, a.x0 * TILE, a.x1 * TILE); break;
        }
      }
    }
    return rt;
  }
  /** przedmioty zapamiętywane w zapisie (unikalne); power-upy odnawiają się przy każdym podejściu */
  private persistent(k: string): boolean { return ['pet', 'can', 'golden', 'battery', 'crystal', 'shard', 'signet', 'note'].includes(k); }

  private newPlayer(idx: 0 | 1, brother: Brother, x: number, y: number): PlayerEnt {
    const mv = newMove(brother, x, y);
    return {
      idx, brother, mv, upg: { M: noUpgrades(), D: noUpgrades() }, invuln: 0, dead: false, deadT: 0, downed: false,
      atk: { phase: 'none', t: 0, cd: 0, swing: 0, hitList: new Set() }, sparks: 0, petrify: 0, petDelay: 0, statue: 0, tele: null, anim: 0, hurtT: 0, face: 1,
      respawn: { x, y }, trail: [], bounceHold: false, spawnProtect: 1.0, hp: MAX_HP, safe: { x, y }, air: AIR_MAX, drownT: 0,
    };
  }

  get rt(): RoomRT { return this.rooms[this.ri]; }
  get grid(): Grid { return this.rt.grid; }
  get activePlayers(): PlayerEnt[] { return this.players.filter((p) => !p.dead && !p.downed); }

  // ------------------------------------------------------------------ pomocnicze
  say(key: string, params?: Record<string, string | number>): void { this.events.push({ t: 'toast', key, params }); }
  sfx = (n: SfxName): void => { this.opts.audio.sfx(n); };
  shake(a: number): void { if (this.opts.settings.reduceShake) return; this.shakeT = 0.3; this.shakeA = Math.max(this.shakeA, a); }
  burst(x: number, y: number, color: string, n = 8, speed = 120, grav = 400): void {
    for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, s = speed * (0.4 + Math.random() * 0.8); this.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, life: 0.5 + Math.random() * 0.4, max: 0.9, color, size: 2 + (Math.random() * 2) | 0, grav }); }
  }
  waterAt(x: number, y: number): boolean {
    const r = this.rt.room; const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
    return tx >= 0 && ty >= 0 && tx < r.w && ty < r.h && this.rt.water[ty * r.w + tx] === 1;
  }
  private aiCtx(): AICtx & BossCtx {
    const self = this;
    return {
      grid: this.grid, players: this.activePlayers, time: this.time,
      proj: (p) => { this.projs.push({ life: 3, bounces: 0, owner: -1, r: 6, grav: 0, ...p }); },
      beam: (b) => { this.beams.push(b); }, sfx: this.sfx, water: (x, y) => this.waterAt(x, y),
      switchesFor: (g) => self.rt.switches.filter((s) => s.gate === g),
      decorOf: (k) => self.rt.decor.filter((d) => d.k === k),
      spawnEnemy: (k, x, y) => { const e = makeEnemy(k, x, y); e.b.y = y - e.b.h / 2; e.hy = e.b.y; self.rt.enemies.push(e); },
      enemyCount: (k) => self.rt.enemies.filter((e) => e.kind === k && !e.dead).length,
      shake: (a) => this.shake(a), platsOff: (s) => { this.platsOffT = s; }, say: (k, p) => this.say(k, p),
      breakPillar: (i) => { const d = self.rt.decor.filter((x) => x.k === 'pillar')[i]; if (d) this.burst(d.x, d.y - 40, '#8d93a0', 18, 160); },
    };
  }

  // ------------------------------------------------------------------ krok
  update(dt: number, inputs: PlayerInput[]): void {
    this.time += dt; this.lastInputs = inputs;
    if (this.flash > 0) this.flash -= dt;
    if (this.shakeT > 0) this.shakeT -= dt;
    for (const pt of this.parts) { pt.life -= dt; pt.vy += pt.grav * dt; pt.x += pt.vx * dt; pt.y += pt.vy * dt; }
    this.parts = this.parts.filter((p) => p.life > 0);
    if (this.state !== 'play') { if (this.state === 'clear') this.endT += dt; return; }
    if (this.readyT > 0) { this.readyT -= dt; this.updateCamera(dt); if (this.readyT > 0.2) return; }
    this.session.run.time += dt;
    const rt = this.rt; const ctx = this.aiCtx();
    this.updatePlatforms(dt);
    this.updateSwitchesGates(dt); this.updateFloods(dt);
    this.updateCrumble(dt);
    this.players.forEach((p, i) => this.updatePlayer(p, inputs[i] ?? inputs[0], dt));
    this.coopSafety();
    // wrogowie
    for (const e of rt.enemies) {
      if (e.dead) { updateEnemy(e, dt, ctx); continue; }
      if (e.stun > 0) { e.stun -= dt; e.b.vx = 0; if (!e.flying) { e.b.vy += 1150 * dt; moveBody(rt.grid, e.b, dt); } continue; }
      // symulacja uproszczona daleko od kamery
      if (Math.abs(px(e.b) - (this.cam.x + VW / 2)) > VW * 1.1 && !['rogoroza', 'bazalisk'].includes(e.kind)) continue;
      updateEnemy(e, dt, ctx);
    }
    rt.enemies = rt.enemies.filter((e) => !(e.dead && e.deadT <= 0));
    for (const p of this.players) this.enemyContacts(p);
    // boss
    if (rt.boss) {
      const b = rt.boss;
      if (!b.started && this.activePlayers.some((p) => p.mv.body.x > b.x0 + 120)) { b.started = true; this.events.push({ t: 'bossStart', id: b.id }); this.opts.audio.music('boss'); this.say('boss.' + b.id); }
      if (b.started) updateBoss(b, dt, ctx);
      this.bossContacts();
      if (b.dead && !this.bossDeadHandled) this.onBossDead();
      if (b.dead && b.deadT <= 0 && this.state === 'play') this.finishLevel();
    }
    this.updateProjectiles(dt);
    this.updateBeams(dt);
    this.updateItems(dt);
    if (this.platsOffT > 0) this.platsOffT -= dt;
    this.updateCamera(dt);
  }

  // ------------------------------------------------------------------ platformy / mechanizmy
  private updatePlatforms(dt: number): void {
    for (const pl of this.rt.plats) {
      const ox = pl.x, oy = pl.y; pl.t += dt;
      if (pl.dwell !== undefined && (pl.mode === 'h' || pl.mode === 'v')) {
        // winda / ruchomy pomost: ruch ze stałą prędkością, postój na obu końcach
        const mv = pl.range / pl.speed, cyc = 2 * (mv + pl.dwell); const u = ((pl.t + pl.offset * cyc) % cyc + cyc) % cyc;
        const k = u < pl.dwell ? 0 : u < pl.dwell + mv ? (u - pl.dwell) / mv : u < 2 * pl.dwell + mv ? 1 : 1 - (u - 2 * pl.dwell - mv) / mv;
        if (pl.mode === 'v') pl.y = pl.y0 + pl.range * k; else pl.x = pl.x0 + pl.range * k;
      }
      else if (pl.mode === 'h') { pl.x = pl.x0 + pl.range * (0.5 + 0.5 * Math.sin((pl.t * pl.speed) / pl.range * Math.PI + pl.offset * Math.PI * 2)); }
      else if (pl.mode === 'v') { pl.y = pl.y0 + pl.range * (0.5 + 0.5 * Math.sin((pl.t * pl.speed) / pl.range * Math.PI + pl.offset * Math.PI * 2)); }
      else if (pl.mode === 'phase') {
        const cyc = pl.speed, ph = ((pl.t / cyc + pl.offset) % 1 + 1) % 1;
        pl.solid = ph < 0.62; pl.warn = ph >= 0.52 && ph < 0.62;
      } else if (pl.mode === 'crumble') {
        if (pl.fall > 0) { pl.fall -= dt; if (pl.fall <= 0) { pl.solid = false; pl.fall = -3; } }
        else if (pl.fall < 0) { pl.fall += dt; if (pl.fall >= 0) { pl.solid = true; pl.fall = 0; } }
      }
      if (this.platsOffT > 0 && (pl.mode === 'phase')) pl.solid = false;
      pl.dx = pl.x - ox; pl.dy = pl.y - oy;
    }
    // półki bossa „Rogodrona” znikają na czas wyłączenia platform
    if (this.rt.boss?.id === 'rogodron') {
      const off = this.platsOffT > 0;
      for (let x = 0; x < this.grid.w; x++) for (let y = 0; y < this.grid.h; y++) {
        const i = y * this.grid.w + x;
        if (off && this.grid.tiles[i] === T.ONEWAY && y < this.grid.h - 4) { this.grid.tiles[i] = 20; }
        else if (!off && this.grid.tiles[i] === 20) this.grid.tiles[i] = T.ONEWAY;
      }
    }
  }
  /** powietrze: głowa pod wodą → ubywa; nad wodą / w suchej komorze → szybko przybywa; po wyczerpaniu obrażenia co DROWN_INTERVAL */
  private updateAir(p: PlayerEnt, head: boolean, dt: number): void {
    if (head) {
      p.air = Math.max(0, p.air - dt);
      if (p.air <= 0) { p.drownT -= dt; if (p.drownT <= 0) { p.drownT = DROWN_INTERVAL; this.sfx('hit'); this.hurtPlayer(p, px(p.mv.body), true); } }
      else p.drownT = 0.4;
      if (Math.random() < dt * 1.6) this.parts.push({ x: px(p.mv.body) + (Math.random() - 0.5) * 8, y: p.mv.body.y + 8, vx: 0, vy: -50, life: 0.9, max: 0.9, color: '#bfe6f6', size: 2, grav: -30 });
    } else { p.air = Math.min(AIR_MAX, p.air + dt * AIR_REFILL); p.drownT = 0.4; }
  }
  private updateFloods(dt: number): void {
    const rt = this.rt;
    for (const sp of rt.spans) {
      if (sp.done) continue; const sw = rt.switches.filter((s) => s.gate === sp.gate);
      if (sw.length && sw.every((s) => s.on)) { sp.done = true; for (const [x, y] of sp.cells) if (rt.tiles[y * rt.grid.w + x] === T.EMPTY) rt.tiles[y * rt.grid.w + x] = T.ONEWAY; this.say('toast.bridge'); this.sfx('switch'); this.shake(3); }
    }
    if (!rt.floods.length) return;
    for (const f of rt.floods) {
      const sw = rt.switches.filter((s) => s.gate === f.gate); const open = sw.length > 0 && sw.every((s) => s.on);
      if (open && !f.open) { f.open = true; this.say('toast.valve'); this.sfx('switch'); }
      const target = open ? f.to : f.from;
      const d = target - f.cur; if (d === 0 && f.applied) continue;
      f.cur += Math.sign(d) * Math.min(Math.abs(d), f.speed * dt); f.applied = true;
      const top = Math.ceil(f.cur - 1e-6);
      for (let y = Math.max(0, f.y0); y <= Math.min(rt.grid.h - 1, f.y1); y++) for (let x = f.x0; x <= f.x1; x++) rt.water[y * rt.grid.w + x] = y >= top ? 1 : 0;
    }
  }
  private updateSwitchesGates(dt: number): void {
    const rt = this.rt;
    if (rt.decor.some((d) => d.k.startsWith('sun_'))) {   // promień światła: panel słoneczny włącza się, gdy dosięgnie go promień
      const bm = traceBeams({ w: rt.grid.w, h: rt.grid.h, tiles: rt.tiles, decor: rt.decor }); rt.beamCells = bm.cells;
      for (const s of rt.switches) if (s.id.endsWith(':sun') && !s.on && bm.hit.has(Math.floor((s.y - 1) / 32) * rt.grid.w + Math.floor(s.x / 32))) this.activateSwitch(s);
    }
    for (const s of rt.switches) if (s.on && s.latch > 0) { s.latch -= dt; if (s.latch <= 0) s.on = false; }
    for (const g of rt.gates) {
      if (g.open) continue;
      const n = rt.switches.filter((s) => s.gate === g.id && s.on).length;
      if (n >= g.need) {
        g.open = true; for (const [cx, cy] of g.cells) { if (rt.tiles[cy * rt.grid.w + cx] === T.GATE) rt.tiles[cy * rt.grid.w + cx] = T.EMPTY; }
        this.say('toast.gateOpen'); this.sfx('switch'); this.shake(3);
        if (g.id.endsWith(':warpgate')) for (const c of rt.cables) if (c.locked) c.locked = false;
      }
    }
    for (const e of rt.ecos) if (e.broken) {
      const f = rt.switches.filter((s) => e.fuses.includes(s.id));
      if (f.length && f.every((s) => s.on)) { e.broken = false; this.say('toast.ecoFixed'); this.sfx('powerup'); }
    }
  }
  private updateCrumble(dt: number): void {
    const rt = this.rt;
    for (const [i, c] of rt.crumble) {
      c.t -= dt;
      if (!c.gone && c.t <= 0) { rt.tiles[i] = T.EMPTY; c.gone = true; c.t = 3; this.sfx('break'); }
      else if (c.gone && c.t <= 0) {
        const tx = i % rt.grid.w, ty = Math.floor(i / rt.grid.w);
        if (!this.players.some((p) => rectsOverlap(p.mv.body.x, p.mv.body.y, p.mv.body.w, p.mv.body.h, tx * TILE, ty * TILE, TILE, TILE))) { rt.tiles[i] = T.CRUMBLE; rt.crumble.delete(i); }
        else c.t = 0.4;
      }
    }
  }

  // ------------------------------------------------------------------ gracz
  private inputFor(p: PlayerEnt, inp: PlayerInput): MoveInput {
    const h = inp.held, pr = inp.pressed;
    return { left: h.left, right: h.right, up: h.up, down: h.down, jumpHeld: h.jump, jumpPressed: pr.jump, run: h.run, downPressed: pr.down };
  }

  private updatePlayer(p: PlayerEnt, inp: PlayerInput, dt: number): void {
    const rt = this.rt; const mv = p.mv; const b = mv.body; const U = p.upg[p.brother]; const prm = BROTHERS[p.brother];
    if (p.invuln > 0) p.invuln -= dt;
    if (p.spawnProtect > 0) p.spawnProtect -= dt;
    if (p.hurtT > 0) p.hurtT -= dt;
    p.anim += dt;
    if (p.dead || p.downed) { this.updateDead(p, dt); return; }
    if (p.tele) { this.updateTeleport(p, dt); return; }
    if (p.statue > 0) { this.updateStatue(p, dt, inp); return; }
    if (U.magnet > 0) U.magnet -= dt; if (U.extender > 0) U.extender -= dt; if (U.gloves > 0) U.gloves -= dt; if (U.star > 0) U.star -= dt;
    // solo: zamiana braci
    if (!this.session.coop && inp.pressed.switch && p.atk.phase === 'none') this.switchBrother(p);
    // skamienienie
    this.updatePetrify(p, dt);
    mv.slow = p.petrify >= PETRIFY_TIER2 ? 0.75 : 1; mv.jumpMul = p.petrify >= PETRIFY_TIER2 ? 0.8 : 1; mv.speedMul = this.speedMul;
    // jazda na platformie
    this.carryOnPlatforms(p);
    const mi = this.inputFor(p, inp);
    if (p.atk.phase === 'wind' || p.atk.phase === 'active') { mi.left = mi.right = false; }
    const cxm = px(b), cym = py(b);
    const env = { water: this.waterAt(cxm, cym), head: this.waterAt(cxm, b.y + 6), lip: !this.waterAt(cxm, b.y - 12), currentX: 0, currentY: 0, g: this.g };
    for (const c of rt.currents) if (cxm > c.x && cxm < c.x + c.w && cym > c.y && cym < c.y + c.h) { env.currentX += c.fx; env.currentY += c.fy; }
    const preVy = b.vy; const prevBottom = b.y + b.h;
    stepMovement(mv, mi, rt.grid, dt, env);
    this.landOnPlatforms(p, prevBottom, preVy);
    this.updateAir(p, env.head, dt);
    if (mv.jumped) { this.sfx('jump'); }
    if (mv.landed) this.sfx('land');
    if (mv.landKind === 'stumble') { this.sfx('hit'); this.burst(px(b), b.y + b.h, '#c8b89a', 6, 60, 120); }
    else if (mv.landKind === 'damage') { this.sfx('hit'); this.shake(3); this.burst(px(b), b.y + b.h, '#c8b89a', 10, 80, 160); this.hurtPlayer(p, px(b), true); }
    if (b.onGround && !mv.hang && !mv.ledge && !mv.climbing && (b.groundTile === T.SOLID || b.groundTile === T.ONEWAY) && !this.waterAt(cxm, cym)) p.safe = { x: px(b), y: b.y + b.h };
    p.face = mv.face; p.bounceHold = inp.held.jump;
    // crumble tiles
    if (b.onGround && b.groundTile === T.CRUMBLE) {
      const ty = Math.floor((b.y + b.h + 1) / TILE);
      for (let tx = Math.floor(b.x / TILE); tx <= Math.floor((b.x + b.w - 1) / TILE); tx++) { const i = ty * rt.grid.w + tx; if (rt.tiles[i] === T.CRUMBLE && !rt.crumble.has(i)) rt.crumble.set(i, { t: 0.5, gone: false }); }
    }
    // uderzenie głową w skrzynkę
    if (b.hitCeil) this.bumpCrates(p);
    this.revealHiddenCrates(p, preVy);
    // atak kluczem
    this.updateAttack(p, inp, dt, prm);
    // interakcje
    if (inp.pressed.interact || (inp.pressed.down && b.onGround)) this.tryInteract(p, inp);
    // zagrożenia kafelkowe
    if (touchesTile(rt.grid, b.x + 3, b.y + 3, b.w - 6, b.h - 4, T.HAZARD) && U.star <= 0 && U.gloves <= 0) this.hurtPlayer(p, px(b) + (this.rng.chance(0.5) ? 1 : -1), true);
    // przepaść
    if (b.y > rt.grid.h * TILE + 90) { this.fallIntoPit(p); return; }
    // strefy, checkpointy, wyjście, lampy
    this.zones(p);
    // ślad dla towarzysza
    p.trail.push({ x: b.x + b.w / 2, y: b.y + b.h }); if (p.trail.length > 40) p.trail.shift();
    // przedmioty (zbieranie w updateItems)
  }

  private switchBrother(p: PlayerEnt): void {
    const nb: Brother = p.brother === 'M' ? 'D' : 'M';
    const old = p.mv.body; const next = newMove(nb, px(old), old.y + old.h);
    next.body.vx = old.vx; next.body.vy = old.vy; next.face = p.mv.face;
    p.brother = nb; p.mv = next; this.session.data.brother = nb; this.sfx('select'); this.burst(px(old), old.y + old.h / 2, '#fff', 8, 90, 0);
    p.invuln = Math.max(p.invuln, 0.3);
  }

  private updatePetrify(p: PlayerEnt, dt: number): void {
    const b = p.mv.body; let inBeam = false;
    const U = p.upg[p.brother];
    for (const be of this.beams) {
      if (be.warn || be.owner === -2) continue;
      const x0 = be.dir > 0 ? be.x : be.x - be.len; const y0 = be.y - 8;
      if (rectsOverlap(b.x, b.y, b.w, b.h, x0, y0, be.len, 16)) inBeam = true;
    }
    if (inBeam && U.star <= 0) { p.petrify = Math.min(PETRIFY_MAX, p.petrify + PETRIFY_RATE * dt); p.petDelay = PETRIFY_DELAY; if (this.time % 1 < dt) this.events.push({ t: 'caption', key: 'caption.petrify' }); }
    else if (p.petDelay > 0) p.petDelay -= dt;
    else p.petrify = Math.max(0, p.petrify - PETRIFY_DECAY * dt);
    // Lampa Odklęcia: w solo automatycznie zeruje miernik
    if (p.petrify > 0 && !this.session.coop) for (const l of this.rt.lamps) if (Math.abs(l.x - px(b)) < 70 && Math.abs(l.y - (b.y + b.h)) < 70) { p.petrify = 0; this.say('toast.revived'); }
    if (p.petrify >= PETRIFY_MAX) {
      p.petrify = PETRIFY_MAX; this.sfx('petrify'); this.burst(px(b), py(b), '#9a9aa6', 14, 100);
      if (this.session.coop && this.activePlayers.length > 1) { p.statue = STATUE_TIME_COOP; this.say('toast.coopRescue'); }
      else { this.killPlayer(p); }
    }
  }
  private updateStatue(p: PlayerEnt, dt: number, inp: PlayerInput): void {
    p.statue -= dt; p.mv.body.vx = 0; p.mv.body.vy += 1150 * dt; moveBody(this.grid, p.mv.body, dt);
    for (const o of this.players) if (o !== p && !o.dead && o.statue <= 0 && Math.abs(px(o.mv.body) - px(p.mv.body)) < 44 && Math.abs(py(o.mv.body) - py(p.mv.body)) < 40) {
      const pad = this.players.indexOf(o); const oin = pad >= 0 ? this.lastInputs[pad] : null;
      if (oin && (oin.pressed.interact || oin.pressed.attack)) { p.statue = 0; p.petrify = 0; p.invuln = INVULN_AFTER_HIT; this.say('toast.revived'); this.sfx('free'); this.burst(px(p.mv.body), py(p.mv.body), '#fff3a0', 14, 140, 0); }
    }
    void inp;
    if (p.statue <= 0 && p.petrify >= PETRIFY_MAX) { p.petrify = 0; this.killPlayer(p); }
  }
  lastInputs: PlayerInput[] = [];

  private carryOnPlatforms(p: PlayerEnt): void {
    const b = p.mv.body;
    for (const pl of this.rt.plats) {
      if (!pl.solid) continue;
      if (b.onGround && b.vy >= 0 && Math.abs(b.y + b.h - pl.y) < 3 && b.x + b.w > pl.x && b.x < pl.x + pl.w) {
        b.x += pl.dx; b.y += pl.dy;
        if (pl.mode === 'crumble' && pl.fall === 0) pl.fall = 0.55;
      }
    }
  }
  private landOnPlatforms(p: PlayerEnt, prevBottom: number, preVy: number): void {
    const b = p.mv.body;
    for (const pl of this.rt.plats) {
      if (!pl.solid) continue;
      const top = pl.y; const bottom = b.y + b.h;
      if (b.x + b.w > pl.x + 1 && b.x < pl.x + pl.w - 1 && b.vy >= -1 && prevBottom <= top + 6 + Math.max(0, pl.dy) && bottom >= top && bottom <= top + 14 && !(p.mv.dropT > 0)) {
        b.y = top - b.h; b.vy = 0; b.onGround = true; b.groundTile = T.ONEWAY; p.mv.wasGround = true;
        if (pl.mode === 'crumble' && pl.fall === 0) pl.fall = 0.55;
      }
    }
    void preVy;
  }

  // ------------------------------------------------------------------ atak
  private updateAttack(p: PlayerEnt, inp: PlayerInput, dt: number, prm: typeof BROTHERS.M): void {
    const a = p.atk; const b = p.mv.body; const U = p.upg[p.brother];
    if (a.cd > 0) a.cd -= dt;
    if (a.phase === 'none' && inp.pressed.attack && a.cd <= 0 && !p.mv.climbing) { a.phase = 'wind'; a.t = KEY_WINDUP; a.swing++; a.hitList.clear(); this.sfx('swing'); }
    else if (a.phase === 'wind') { a.t -= dt; if (a.t <= 0) { a.phase = 'active'; a.t = KEY_ACTIVE; if (U.coil && p.sparks < SPARK_MAX) this.fireSpark(p); } }
    else if (a.phase === 'active') {
      a.t -= dt;
      const range = U.extender > 0 ? 4 * TILE : prm.keyRange;
      const x0 = p.mv.face > 0 ? b.x + b.w - 2 : b.x - range + 2; const y0 = b.y - 2; const w = range, h = b.h + 4;
      this.keyStrike(p, x0, y0, w, h, prm, U.extender > 0);
      if (a.t <= 0) { a.phase = 'none'; a.cd = prm.keyCooldown - KEY_WINDUP - KEY_ACTIVE; }
    }
  }
  private keyStrike(p: PlayerEnt, x0: number, y0: number, w: number, h: number, prm: typeof BROTHERS.M, stun: boolean): void {
    const rt = this.rt; const hl = p.atk.hitList;
    for (const e of rt.enemies) {
      if (e.dead || hl.has(e.id)) continue;
      if (!rectsOverlap(x0, y0, w, h, e.b.x, e.b.y, e.b.w, e.b.h)) continue;
      hl.add(e.id);
      const behind = (px(p.mv.body) < px(e.b) ? 1 : -1) !== e.dir ? true : false;
      const r = hitEnemy(e, 'key', prm.keyDamage, behind);
      if (stun && r === 'block' && !e.dead) { e.stun = 1.5; this.sfx('hit'); }
      this.afterEnemyHit(e, r, p);
    }
    const bs = rt.boss;
    if (bs && !hl.has(-1) && rectsOverlap(x0, y0, w, h, bs.b.x, bs.b.y, bs.b.w, bs.b.h)) {
      hl.add(-1);
      if (hitBoss(bs, 'key')) { this.sfx('bossHit'); this.shake(6); this.burst(px(bs.b), py(bs.b), '#fff3a0', 16, 180); this.events.push({ t: 'caption', key: 'caption.bossHit' }); }
      else this.sfx('hit');
    }
    // kafelki: pęknięte ściany, skrzynki, przełączniki, ukryte przewody, korzenie, lustra
    const tx0 = Math.floor(x0 / TILE), tx1 = Math.floor((x0 + w) / TILE), ty0 = Math.floor(y0 / TILE), ty1 = Math.floor((y0 + h) / TILE);
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
      if (tileAt(rt.grid, tx, ty) === T.CRACKED) {
        if (p.brother === 'M') { rt.tiles[ty * rt.grid.w + tx] = T.EMPTY; this.burst(tx * TILE + 16, ty * TILE + 16, '#9a8a78', 12, 140); this.sfx('break'); }
        else if (!hl.has(-5)) { hl.add(-5); this.say('toast.needMarioosh'); this.sfx('hit'); }
      }
      for (const c of rt.crates) if (c.tx === tx && c.ty === ty && !c.used && !hl.has(1000 + ty * 500 + tx)) { hl.add(1000 + ty * 500 + tx); this.openCrate(c, p); }
      for (const c of rt.cables) if (c.hidden && !c.revealed && Math.abs(c.tx * TILE + 16 - px(p.mv.body)) < 80 && Math.abs(c.ty * TILE - p.mv.body.y) < 120) this.revealCable(c);
    }
    for (const s of rt.switches) if (!s.on && !hl.has(2000 + rt.switches.indexOf(s)) && rectsOverlap(x0, y0, w, h, s.x - 14, s.y - 34, 28, 34)) { hl.add(2000 + rt.switches.indexOf(s)); this.activateSwitch(s); }
    for (const d of rt.decor) {
      if (d.k === 'root' && d.state === 0 && !hl.has(3000 + rt.decor.indexOf(d)) && rectsOverlap(x0, y0, w, h, d.x - 18, d.y - 50, 36, 50)) {
        hl.add(3000 + rt.decor.indexOf(d)); d.hits++; this.sfx('hit'); this.burst(d.x, d.y - 24, '#3e8f4a', 8, 100);
        if (d.hits >= 2) { d.state = 1; this.say('toast.root'); this.sfx('break'); this.shake(4); }
      }
    }
    for (const l of rt.lanterns) if (!l.lit && Math.abs(l.x - px(p.mv.body)) < 70) { l.lit = true; this.say('toast.light'); this.sfx('switch'); }
  }
  private fireSpark(p: PlayerEnt): void {
    const b = p.mv.body; p.sparks++;
    this.projs.push({ kind: 'spark', x: px(b) + p.mv.face * 14, y: b.y + b.h * 0.45, vx: p.mv.face * SPARK_SPEED, vy: -40, life: SPARK_LIFE, bounces: 0, owner: p.idx, r: 6, grav: 500 });
    this.sfx('spark');
  }
  private afterEnemyHit(e: Enemy, r: ReturnType<typeof hitEnemy>, p: PlayerEnt): void {
    if (r === 'none') return;
    if (r === 'block') { this.sfx('hit'); this.burst(px(e.b), py(e.b), '#c9ced6', 4, 80); return; }
    this.sfx(r === 'kill' ? 'stomp' : 'hit'); this.burst(px(e.b), py(e.b), r === 'kill' ? '#ffd23f' : '#fff', r === 'kill' ? 14 : 6, 130);
    if (r === 'kill') { this.session.addScore(STATS[e.kind].score); this.session.data.enemiesDefeated++; }
    void p;
  }

  // ------------------------------------------------------------------ interakcje
  private tryInteract(p: PlayerEnt, inp: PlayerInput): void {
    const rt = this.rt; const b = p.mv.body; const cx = px(b), feet = b.y + b.h;
    const wantsDown = inp.pressed.down || inp.pressed.interact, wantsUp = inp.pressed.up || inp.pressed.interact;
    // przełącznik w zasięgu ma pierwszeństwo przed przewodem, gdy gracz naciska „użyj”
    if (inp.pressed.interact && !inp.pressed.down) for (const s of rt.switches) if (Math.abs(s.x - cx) < 34 && Math.abs(s.y - feet) < 44 && (!s.on || s.latch > 0)) { this.activateSwitch(s); return; }
    // przewody
    for (const c of rt.cables) {
      if (c.hidden && !c.revealed) { if (inp.pressed.interact && Math.abs(c.tx * TILE + 16 - cx) < 56 && Math.abs(c.ty * TILE - feet) < 80) this.revealCable(c); continue; }
      const ccx = c.tx * TILE + 16;
      if (c.face === 'door') {   // drzwi pełnej wielkości: stań przed nimi i naciśnij ↑ / „użyj”
        if (Math.abs(ccx - cx) > 26 || Math.abs(feet - (c.ty + 1) * TILE) > 8 || !(inp.pressed.up || inp.pressed.interact)) continue;
        if (c.locked || c.color === 'black') { this.say('toast.locked'); this.sfx('warn'); return; }
        this.enterCable(p, c.dest ?? null, c.warp ?? null); return;
      }
      if (Math.abs(ccx - cx) > 18) continue;
      const okUp = c.face === 'up' && Math.abs(feet - c.ty * TILE) < 6 && wantsDown;
      const okDown = c.face === 'down' && Math.abs(b.y - (c.ty + 1) * TILE) < 6 && wantsUp;
      if (!okUp && !okDown) continue;
      if (c.locked || c.color === 'black') { this.say('toast.locked'); this.sfx('warn'); return; }
      this.enterCable(p, c.dest ?? null, c.warp ?? null); return;
    }
    // posągi mieszkańców
    for (const s of rt.statues) if (!s.freed && Math.abs(s.x - cx) < 44 && Math.abs(s.y - feet) < 50 && inp.pressed.interact) { this.freeStatue(s, p); return; }
    // przełączniki, lustra, EcoPort, latarnie
    for (const s of rt.switches) if (!s.id.endsWith(':sun') && Math.abs(s.x - cx) < 34 && Math.abs(s.y - feet) < 44 && inp.pressed.interact) { if (!s.on || s.latch > 0) this.activateSwitch(s); return; }
    for (const d of rt.decor) if (d.k === 'lmirror' && Math.abs(d.x - cx) < 46 && Math.abs(d.y - feet) < 50 && inp.pressed.interact) { d.state = d.state ? 0 : 1; this.sfx('switch'); this.say('toast.lmirror'); return; }
    for (const d of rt.decor) if (d.k === 'mirror' && Math.abs(d.x - cx) < 46 && Math.abs(d.y - feet) < 50 && inp.pressed.interact) { d.state = d.state ? 0 : 1; this.sfx('switch'); if (d.state) this.say('toast.mirror'); return; }
    for (const e of rt.ecos) if (Math.abs(e.x - cx) < 46 && Math.abs(e.y - feet) < 60 && inp.pressed.interact) { this.useEcoport(e); return; }
    for (const l of rt.lanterns) if (!l.lit && Math.abs(l.x - cx) < 50 && Math.abs(l.y - feet) < 70 && inp.pressed.interact) { l.lit = true; this.sfx('switch'); this.say('toast.light'); return; }
  }
  private activateSwitch(s: SwitchEnt): void {
    s.on = true; this.sfx('switch'); this.say('toast.switchOn'); this.burst(s.x, s.y - 20, '#ffd23f', 8, 90, 0);
    if (s.gate === 'crane') s.latch = 14; else if (s.gate === 'spot') s.latch = 7; else if (s.gate === 'gen') s.latch = 28; else if (s.gate.startsWith('pool')) s.latch = 16;
  }
  private revealCable(c: { hidden: boolean; revealed: boolean; tx: number; ty: number; id: string }): void {
    if (c.revealed) return; c.revealed = true; this.sfx('crate'); this.say('toast.secret'); this.session.secrets.add(c.id);
    this.burst(c.tx * TILE + 16, c.ty * TILE + 16, '#f0c030', 14, 140, 0);
  }
  private useEcoport(e: EcoEnt): void {
    if (e.broken) { this.say('toast.ecoBroken'); this.sfx('warn'); return; }
    const gr = this.session.deposit(); e.flash = 1;
    this.sfx('ecoport');
    if (!e.used) { e.used = true; this.session.addScore(500); }
    this.say('toast.eco', { n: (gr / 100).toFixed(2) });
  }
  private freeStatue(s: StatueEnt, p: PlayerEnt): void {
    s.freed = true; s.t = 0; this.sfx('free'); this.events.push({ t: 'caption', key: 'caption.free' });
    this.burst(s.x, s.y - 22, '#fff3a0', 22, 170, 0);
    if (this.session.freeResident(s.id)) { this.say('toast.freed', { n: this.session.freed.size }); }
    void p;
  }
  private enterCable(p: PlayerEnt, dest: Dest | null, warp: string | null): void {
    for (const q of this.players) if (!q.dead && !q.downed) { q.tele = { t: TELEPORT_TIME, dest, warp }; q.invuln = TELEPORT_TIME + 0.6; q.atk.phase = 'none'; }
    p.tele = { t: TELEPORT_TIME, dest, warp };
    this.sfx('teleport'); this.events.push({ t: 'caption', key: 'caption.teleport' });
  }
  private updateTeleport(p: PlayerEnt, dt: number): void {
    const t = p.tele!; t.t -= dt;
    if (t.t > 0) return;
    // tylko pierwszy gracz wykonuje przejście
    const leader = this.players.find((q) => q.tele) ?? p;
    if (leader !== p) { p.tele = null; return; }
    for (const q of this.players) q.tele = null;
    if (t.warp) { this.state = 'over'; this.events.push({ t: 'warp', level: t.warp }); this.state = 'clear'; this.endT = -999; return; }
    if (t.dest) {
      this.changeRoom(t.dest.room);
      this.players.forEach((q, i) => {
        if (q.dead || q.downed) return;
        const b = q.mv.body; b.x = t.dest!.x - b.w / 2 + (i ? 22 : 0); b.y = t.dest!.y - b.h; b.vx = b.vy = 0;
        q.respawn = { x: t.dest!.x, y: t.dest!.y };
      });
      this.snapCamera();
    }
  }
  private changeRoom(i: number): void {
    if (i === this.ri || i < 0 || i >= this.rooms.length) return;
    this.ri = i; this.projs = []; this.beams = [];
    this.opts.audio.music(this.rooms[i].room.name === 'main' ? this.musicForWorld() : this.musicForWorld());
    if (this.rt.room.name === 'scarlet') this.say('hint.statue');
  }
  musicForWorld(): string { return this.rt.boss?.started ? 'boss' : 'w' + this.level.world; }

  // ------------------------------------------------------------------ skrzynki / przedmioty
  private bumpCrates(p: PlayerEnt): void {
    const b = p.mv.body; const ty = Math.floor((b.y - 2) / TILE);
    for (let tx = Math.floor((b.x + 2) / TILE); tx <= Math.floor((b.x + b.w - 2) / TILE); tx++) {
      for (const c of this.rt.crates) if (c.tx === tx && c.ty === ty && !c.used) this.openCrate(c, p);
    }
  }
  private revealHiddenCrates(p: PlayerEnt, preVy: number): void {
    const b = p.mv.body;
    for (const c of this.rt.crates) {
      if (!c.hidden || c.revealed || c.used) continue;
      const bottom = (c.ty + 1) * TILE;
      if (b.vy <= 0 && preVy < 0 && b.x + b.w > c.tx * TILE + 3 && b.x < (c.tx + 1) * TILE - 3 && b.y < bottom && b.y > bottom - 22 + (preVy * 0.016)) {
        c.revealed = true; this.rt.tiles[c.ty * this.rt.grid.w + c.tx] = T.SOLID; b.y = bottom; b.vy = 40; this.sfx('crate'); this.session.secrets.add(c.id);
        this.openCrate(c, p);
      }
    }
  }
  private openCrate(c: Crate, p: PlayerEnt): void {
    if (c.used) return; c.used = true; c.revealed = true; c.bump = 0.2;
    this.rt.tiles[c.ty * this.rt.grid.w + c.tx] = T.SOLID;
    this.sfx('crate'); this.burst(c.tx * TILE + 16, c.ty * TILE + 6, '#d89a3a', 8, 110);
    const ghost = this.persistent(c.k) && this.session.collected.has(c.id);
    // przedmiot wyskakuje ze skrzynki w bok i spada na ziemię obok — inaczej leżałby na wiszącej skrzynce, poza zasięgiem skoku
    const g = this.rt.grid; const sup = (tx: number, row: number): boolean => { for (let r = row; r < g.h; r++) { const t = tileAt(g, tx, r); if (t === T.SOLID || t === T.ONEWAY || t === T.CONVL || t === T.CONVR) return true; if (t !== T.EMPTY && t !== T.LADDER && t !== T.CABLE && t !== T.GATE) return false; } return false; }; // tylko trwałe podłoże (kruche mosty, kolce i pęknięte bloki nie liczą się)
    const open = (dir: number): boolean => { const t = tileAt(g, c.tx + dir, c.ty); return t !== T.SOLID && t !== T.CRACKED && sup(c.tx + dir, c.ty + 1); };
    const pref = px(p.mv.body) < c.tx * TILE + 16 ? 1 : -1;      // odlatuje od strony, z której uderzono
    const dir = open(pref) ? pref : open(-pref) ? -pref : 0;
    this.rt.items.push({ id: c.id, kind: c.k, x: c.tx * TILE + 16, y: c.ty * TILE - 8, vy: dir ? -230 : -150, vx: dir * 110, taken: false, ghost, t: 0, popT: 0.35, fixed: false, home: { x: c.tx * TILE + 16, y: c.ty * TILE - 10 } });
  }

  private updateItems(dt: number): void {
    const rt = this.rt;
    for (const it of rt.items) {
      if (it.taken) continue; it.t += dt;
      const above = !!it.home && !!it.vx && Math.abs(it.x - it.home.x) < 17 && it.y <= it.home.y + 6; // jeszcze nad własną skrzynką
      if (!it.fixed && it.vx) { const nx = it.x + it.vx * dt; const wall = above ? T.EMPTY : tileAt(rt.grid, Math.floor((nx + Math.sign(it.vx) * 8) / TILE), Math.floor(it.y / TILE)); if (wall === T.SOLID || wall === T.CRACKED) it.vx = 0; else it.x = nx; it.vx *= Math.exp(-3 * dt); }
      if (!it.fixed && it.home && it.y > rt.grid.h * TILE + 40) { it.x = it.home.x; it.y = it.home.y; it.vy = 0; it.vx = 0; it.fixed = true; }   // zabezpieczenie: nigdy nie gub przedmiotu w przepaści
      if (!it.fixed) { it.vy += 700 * dt; it.y += it.vy * dt; const t = tileAt(rt.grid, Math.floor(it.x / TILE), Math.floor((it.y + 10) / TILE)); if (it.vy > 0 && !above && (t === T.SOLID || t === T.ONEWAY || t === T.CRACKED || t === T.CRUMBLE || t === T.CONVL || t === T.CONVR)) { it.y = Math.floor((it.y + 10) / TILE) * TILE - 10; it.vy = 0; it.vx = 0; it.fixed = true; } }
      if (it.popT > 0) { it.popT -= dt; continue; }
      for (const p of this.players) {
        if (p.dead || p.downed || p.tele) continue; const b = p.mv.body; const U = p.upg[p.brother];
        let dx = px(b) - it.x, dy = py(b) - it.y;
        if (U.magnet > 0 && ['pet', 'can', 'golden'].includes(it.kind) && !it.ghost && Math.hypot(dx, dy) < 96 && Math.hypot(dx, dy) > PICKUP_RADIUS) { it.x += (dx / Math.hypot(dx, dy)) * 240 * dt; it.y += (dy / Math.hypot(dx, dy)) * 240 * dt; dx = px(b) - it.x; dy = py(b) - it.y; }
        if (Math.hypot(dx, dy) < PICKUP_RADIUS && !it.ghost) { this.collect(it, p); break; }
      }
    }
    rt.items = rt.items.filter((i) => !i.taken);
  }
  private collect(it: Item, p: PlayerEnt): void {
    const S = this.session; const U = p.upg[p.brother]; it.taken = true;
    this.burst(it.x, it.y, '#fff', 5, 90, 0);
    switch (it.kind) {
      case 'pet': case 'can': case 'golden': {
        const r = S.collectPackage(it.id, it.kind, p.idx);
        if (r.counted) this.sfx(it.kind === 'golden' ? 'golden' : it.kind === 'pet' ? 'pet' : 'can');
        this.events.push({ t: 'caption', key: it.kind === 'pet' ? 'caption.pet' : 'caption.can' });
        break;
      }
      case 'battery': if (S.collectUnique(it.id)) { if (p.hp < MAX_HP) p.hp++; else S.addScore(500); this.say('toast.life'); this.sfx('oneup'); } break;
      case 'crystal': if (S.collectUnique(it.id)) { S.addScore(1000); this.sfx('powerup'); } break;
      case 'shard': if (S.collectUnique(it.id)) { S.shards.add(it.id); this.say('toast.shard', { n: S.shards.size }); this.sfx('powerup'); S.addScore(2000); this.session.persist(); } break;
      case 'note': if (S.collectUnique(it.id)) { S.notes.add(it.id); this.say('toast.note', { n: S.notes.size }); this.sfx('powerup'); S.addScore(500); } break;
      case 'signet': if (S.collectUnique(it.id)) { S.addScore(1500); this.say('toast.secret'); this.sfx('powerup'); } break;
      case 'xl': if (U.shield) S.addScore(1000); else { U.shield = true; this.say('toast.shield'); } this.sfx('powerup'); break;
      case 'coil': if (!U.shield) { U.shield = true; this.say('toast.shield'); } else if (!U.coil) { U.coil = true; this.say('item.coil'); } else S.addScore(1000); this.sfx('powerup'); break;
      case 'magnet': U.magnet = TIME_MAGNET; this.say('item.magnet'); this.sfx('powerup'); break;
      case 'extender': U.extender = TIME_EXTENDER; this.say('item.extender'); this.sfx('powerup'); break;
      case 'gloves': U.gloves = TIME_GLOVES; this.say('item.gloves'); this.sfx('powerup'); break;
      case 'star': U.star = TIME_STAR; this.say('item.star'); this.sfx('star'); this.opts.audio.sfx('star'); break;
    }
  }

  // ------------------------------------------------------------------ strefy
  private zones(p: PlayerEnt): void {
    const rt = this.rt; const b = p.mv.body; const cx = px(b);
    for (const h of rt.hints) if (!h.shown && cx > h.x && cx < h.x + h.w) { h.shown = true; this.say(h.key); }
    for (const c of rt.checkpoints) if (!c.on && Math.abs(c.x - cx) < 36 && Math.abs(c.y - (b.y + b.h)) < 70) {
      c.on = true; for (const q of this.players) { q.respawn = { x: c.x, y: c.y }; q.hp = MAX_HP; }
      for (const o of rt.checkpoints) if (o !== c) o.on = false;
      this.say('toast.checkpoint'); this.sfx('checkpoint'); this.events.push({ t: 'checkpoint' }); this.events.push({ t: 'caption', key: 'caption.checkpoint' });
      this.session.persist(this.session.run.time); this.burst(c.x, c.y - 40, '#8aff9a', 14, 120, 0);
    }
    if (this.level.mode !== 'boss' && this.level.stage !== 4) for (const ex of rt.exits) {
      if (Math.abs(ex.x - cx) < 36 && Math.abs(ex.y - (b.y + b.h)) < 80 && this.state === 'play') this.finishLevel();
    }
  }
  finishLevel(): void {
    if (this.state !== 'play') return;
    this.state = 'clear'; this.endT = 0; this.sfx('clear');
    this.events.push({ t: 'clear', timeLeft: Math.max(0, Math.floor(this.timeLeft)) });
  }
  private onBossDead(): void {
    const bs = this.rt.boss!; this.bossDeadHandled = true;
    this.events.push({ t: 'bossDown', id: bs.id }); this.say('boss.defeated'); this.sfx('bossDie'); this.shake(12); this.flash = 0.6;
    this.session.addScore(3000); this.burst(px(bs.b), py(bs.b), '#ffd23f', 40, 220);
    const wi = this.level.world;
    if (wi >= 1 && wi <= 7) this.rt.items.push({ id: `shard:${wi}`, kind: 'shard', x: px(bs.b), y: py(bs.b) - 20, vy: -200, taken: false, ghost: this.session.collected.has(`shard:${wi}`), t: 0, popT: 0.5, fixed: false });
    this.opts.audio.music(null);
  }

  // ------------------------------------------------------------------ kontakty z wrogami / pociskami
  private enemyContacts(p: PlayerEnt): void {
    if (p.dead || p.downed || p.tele || p.statue > 0) return;
    const b = p.mv.body; const U = p.upg[p.brother];
    for (const e of this.rt.enemies) {
      if (e.dead) continue;
      if (!rectsOverlap(b.x, b.y, b.w, b.h, e.b.x + 2, e.b.y + 2, e.b.w - 4, e.b.h - 3)) continue;
      if (U.star > 0) { e.dead = true; e.deadT = 0.8; e.b.vy = -200; this.session.addScore(STATS[e.kind].score); this.sfx('stomp'); this.burst(px(e.b), py(e.b), '#ffd23f', 12, 150); continue; }
      // v0.4: żadnego skakania po głowach — dotknięcie groźnego wroga rani, wróg w fazie „ostrzeżenia/odpoczynku” nie atakuje (harmful)
      if (harmful(e) && p.invuln <= 0) this.hurtPlayer(p, px(e.b));
    }
  }
  private bossContacts(): void {
    const bs = this.rt.boss; if (!bs || !bs.started || bs.dead) return;
    for (const p of this.players) {
      if (p.dead || p.downed || p.tele || p.statue > 0) continue; const b = p.mv.body;
      if (!rectsOverlap(b.x, b.y, b.w, b.h, bs.b.x + 4, bs.b.y + 4, bs.b.w - 8, bs.b.h - 6)) continue;
      if (bossHarmful(bs) && p.invuln <= 0 && p.upg[p.brother].star <= 0) this.hurtPlayer(p, px(bs.b));
    }
  }

  /** Tryb testowy: wrogowie i pociski nie ranią (kolce i przepaście nadal tak). */
  god = false;
  hurtPlayer(p: PlayerEnt, fromX: number, env = false): void {
    if (p.dead || p.invuln > 0 || p.tele || (this.god && !env)) return;
    const U = p.upg[p.brother]; const b = p.mv.body;
    if (U.star > 0) return;
    const away = px(b) < fromX ? -1 : 1;
    p.invuln = INVULN_AFTER_HIT; p.hurtT = 0.4; p.mv.lock = 0.25; b.vx = away * 70; b.vy = -90;
    this.flashHit(); this.burst(px(b), py(b), U.shield ? '#7fd6ff' : '#ff6a5a', 10, 110);
    if (U.shield) {   // tarcza (XL) pochłania jedno trafienie i nie jest już formą „big”
      U.shield = false; U.coil = false; this.sfx('hit'); this.say('toast.shieldLost'); this.events.push({ t: 'caption', key: 'caption.hit' }); return;
    }
    p.hp = Math.max(0, p.hp - 1);
    this.sfx('hit'); this.events.push({ t: 'caption', key: 'caption.hit' });
    if (p.hp <= 0) this.killPlayer(p);
  }
  private flashHit(): void { if (!this.opts.settings.reduceFlashes) this.flash = 0.15; }

  /** upadek w przepaść: −1 HP i powrót na ostatnie bezpieczne miejsce; przy 0 HP — od checkpointu */
  private fallIntoPit(p: PlayerEnt): void {
    if (p.dead) return;
    p.hp = Math.max(0, p.hp - 1); this.sfx('hit'); this.events.push({ t: 'caption', key: 'caption.hit' });
    if (p.hp <= 0) { this.killPlayer(p); return; }
    const m = p.mv; const b = m.body;
    b.x = p.safe.x - b.w / 2; b.y = p.safe.y - b.h; b.vx = b.vy = 0; m.climbing = false; m.hang = null; m.ledge = null; m.lock = 0.3;
    p.invuln = 1.5; this.snapCamera();
  }

  /** utrata wszystkich HP: powrót do ostatniego checkpointu (bez żyć, bez game over) */
  killPlayer(p: PlayerEnt): void {
    if (p.dead) return;
    p.dead = true; p.deadT = 1.2; p.atk.phase = 'none'; p.tele = null; p.statue = 0; p.hp = 0;
    p.mv.body.vy = -160; p.mv.body.vx = 0; this.sfx('die'); this.burst(px(p.mv.body), py(p.mv.body), '#ff6a5a', 14, 150);
    this.deathCount++; this.session.data.deaths++;
    p.upg[p.brother].shield = false; p.upg[p.brother].coil = false;
    if (this.rt.boss?.started) this.bossFails++;
  }
  private updateDead(p: PlayerEnt, dt: number): void {
    const b = p.mv.body;
    if (p.downed) { p.downed = false; }
    p.deadT -= dt; b.vy += 600 * dt; b.y += b.vy * dt; b.x += b.vx * dt;
    if (p.deadT > 0) return;
    this.respawnPlayer(p);
  }
  private respawnPlayer(p: PlayerEnt): void {
    p.dead = false; p.downed = false; p.petrify = 0; p.invuln = 2; p.spawnProtect = 1.5; p.hp = MAX_HP; p.air = AIR_MAX; p.drownT = 0;
    const rp = p.respawn; const nb = newMove(p.brother, rp.x + (p.idx ? 18 : 0), rp.y);
    p.mv = nb; p.safe = { x: rp.x, y: rp.y };
    if (this.rt.boss) { const bs = this.rt.boss; const fresh = makeBoss(bs.id, (bs.x0 + bs.x1) / 2 + (bs.x1 - bs.x0) * 0.3, bs.floorY, bs.x0, bs.x1); this.rt.boss = fresh; this.beams = []; this.projs = []; for (const s of this.rt.switches) s.on = false; for (const d of this.rt.decor) { d.state = 0; d.hits = 0; } this.opts.audio.music('w' + this.level.world); }
    this.snapCamera();
  }
  private coopSafety(): void {
    if (!this.session.coop) return;
    const a = this.activePlayers; if (a.length < 2) return;
    const d = Math.abs(px(a[0].mv.body) - px(a[1].mv.body));
    if (d > 14 * TILE) { const lead = a[0].mv.body.x > a[1].mv.body.x ? a[0] : a[1]; const far = lead === a[0] ? a[1] : a[0]; far.mv.body.x = lead.mv.body.x - 30 * lead.face; far.mv.body.y = lead.mv.body.y - 4; far.mv.body.vx = far.mv.body.vy = 0; far.invuln = 1; this.sfx('teleport'); }
  }

  // ------------------------------------------------------------------ pociski
  private updateProjectiles(dt: number): void {
    const rt = this.rt;
    for (const pr of this.projs) {
      pr.life -= dt; pr.vy += pr.grav * dt; pr.x += pr.vx * dt; const ny = pr.y + pr.vy * dt;
      const solid = hitsSolid(rt.grid, pr.x - pr.r / 2, ny - pr.r / 2, pr.r, pr.r);
      if (pr.kind === 'spark') {
        if (solid) {
          const wall = hitsSolid(rt.grid, pr.x - pr.r / 2, pr.y - pr.r / 2, pr.r, pr.r);
          if (wall || pr.bounces >= SPARK_BOUNCES) { pr.life = 0; this.burst(pr.x, pr.y, '#7fd6ff', 6, 90, 0); } else { pr.vy = -Math.abs(pr.vy) * 0.8 - 80; pr.bounces++; }
        } else pr.y = ny;
        for (const e of rt.enemies) if (!e.dead && rectsOverlap(pr.x - 5, pr.y - 5, 10, 10, e.b.x, e.b.y, e.b.w, e.b.h)) {
          const r = hitEnemy(e, 'spark', 1, false); pr.life = 0; if (r === 'block') this.sfx('hit'); else this.afterEnemyHit(e, r, this.players[0]);
          if (r !== 'none') this.burst(pr.x, pr.y, '#7fd6ff', 6, 90, 0);
        }
        const bs = rt.boss; if (bs && rectsOverlap(pr.x - 5, pr.y - 5, 10, 10, bs.b.x, bs.b.y, bs.b.w, bs.b.h)) { pr.life = 0; if (hitBoss(bs, 'spark')) { this.sfx('bossHit'); this.shake(5); } }
        if (pr.life <= 0) { const o = this.players[pr.owner]; if (o) o.sparks = Math.max(0, o.sparks - 1); }
        continue;
      }
      pr.y = ny;
      if (pr.kind === 'gust') { for (const p of this.activePlayers) if (rectsOverlap(p.mv.body.x, p.mv.body.y, p.mv.body.w, p.mv.body.h, pr.x - 200, pr.y - 120, 400, 160)) p.mv.body.x += Math.sign(pr.vx) * 120 * dt; continue; }
      if ((pr.kind === 'rock' || pr.kind === 'scrap' || pr.kind === 'needle') && solid && pr.vy > 0) { pr.life = 0; this.burst(pr.x, pr.y, '#8a8a92', 6, 90); if (pr.kind !== 'needle') this.shake(2); continue; }
      if (pr.kind === 'pulse' && solid) { pr.life = 0; continue; }
      if (pr.kind === 'wave') { const g = tileAt(rt.grid, Math.floor(pr.x / TILE), Math.floor((pr.y + 20) / TILE)); if (!(g === T.SOLID || g === T.ONEWAY)) pr.life = 0; }
      for (const p of this.activePlayers) {
        const b = p.mv.body; const U = p.upg[p.brother];
        const hit = pr.kind === 'wave' ? rectsOverlap(b.x, b.y, b.w, b.h, pr.x - pr.r, pr.y - 14, pr.r * 2, 28) : rectsOverlap(b.x, b.y, b.w, b.h, pr.x - pr.r, pr.y - pr.r, pr.r * 2, pr.r * 2);
        if (hit && p.invuln <= 0) { if (pr.kind === 'pulse' && U.gloves > 0) { pr.life = 0; this.burst(pr.x, pr.y, '#e8a03a', 6, 80, 0); continue; } pr.life = 0; this.hurtPlayer(p, pr.x); }
      }
    }
    this.projs = this.projs.filter((p) => p.life > 0 && p.y < 40 * TILE);
  }
  private updateBeams(dt: number): void {
    for (const be of this.beams) {
      be.t -= dt;
      if (be.owner === -2 && !be.warn) for (const p of this.activePlayers) { const x0 = be.dir > 0 ? be.x : be.x - be.len; if (rectsOverlap(p.mv.body.x, p.mv.body.y, p.mv.body.w, p.mv.body.h, x0, be.y - 8, be.len, 16)) this.hurtPlayer(p, be.x); }
      // wiązka zatrzymuje się na ścianie (skrócenie)
      if (!be.warn && be.len > 0) { const step = 12; let L = 0; while (L < be.len && !hitsSolid(this.grid, be.x + be.dir * L - 1, be.y - 1, 2, 2)) L += step; be.len = Math.min(be.len, Math.max(24, L)); }
    }
    this.beams = this.beams.filter((b) => b.t > 0);
  }

  // ------------------------------------------------------------------ kamera
  snapCamera(): void { this.updateCamera(1, true); }
  private camLook = 0; private camLa = 0; private camFocus = 230;
  /**
   * Kamera v0.4 (docs/design/08): martwa strefa ≈25% szerokości i 20% wysokości, wyprzedzenie 60–100 px wg prędkości,
   * łagodne podążanie; w powietrzu kamera stoi, dopóki postać nie wyjdzie poza okno.
   */
  private updateCamera(dt: number, snap = false): void {
    const r = this.rt.room; const alive = this.players.filter((p) => !p.dead || p.deadT > 0.6);
    const list = alive.length ? alive : this.players;
    const maxX = Math.max(0, r.w * TILE - VW), maxY = Math.max(0, r.h * TILE - VH);
    let cx = 0, fy = 0, cyc = 0, grounded = true, speedLook = 0, climbing = false, falling = 0;
    for (const p of list) {
      const b = p.mv.body; cx += px(b); fy += b.y + b.h; cyc += py(b);
      speedLook += clamp(b.vx / 170, -1, 1);
      if (!b.onGround) grounded = false;
      if (b.vy > falling) falling = b.vy;
      if (p.mv.climbing || p.mv.hang || p.mv.ledge) climbing = true;
    }
    const n = list.length; cx /= n; fy /= n; cyc /= n; speedLook /= n;
    const hold = list[0];
    // ręczne rozglądanie: ↑/↓ na stojąco po 0,5 s
    const inp = this.lastInputs?.[0]; const still = !!hold && hold.mv.body.onGround && Math.abs(hold.mv.body.vx) < 8;
    if (inp && still && (inp.held.up || inp.held.down) && !hold.mv.duck && !hold.mv.climbing) this.camLook += dt; else this.camLook = Math.max(0, this.camLook - dt * 3);
    const look = this.camLook > 0.5 && inp ? (inp.held.up ? -90 : 90) : 0;
    this.camLa += (speedLook * 80 - this.camLa) * (snap ? 1 : 1 - Math.exp(-4 * dt));
    // ---- poziomo: martwa strefa ±80 px wokół punktu (postać + wyprzedzenie)
    const wantX = cx + this.camLa - VW / 2;
    let tx = snap ? wantX : clamp(this.cam.x, wantX - 80, wantX + 80);
    // ---- pionowo: stopy na wysokości focus; martwa strefa ±36 px; w powietrzu okno
    const wantFocus = climbing ? 250 : falling > 300 ? 130 : 230;
    this.camFocus += (wantFocus - this.camFocus) * (snap ? 1 : 1 - Math.exp(-5 * dt));
    let ty: number;
    const wantY = fy - this.camFocus + look;
    if (snap) ty = wantY;
    else if (grounded || climbing) ty = clamp(this.cam.y, wantY - 36, wantY + 36);
    else { const winTop = cyc - 250, winBot = cyc - 90; ty = clamp(this.cam.y, winTop, winBot); if (falling > 300) ty = Math.max(ty, cyc - 170); }
    tx = clamp(tx, 0, maxX); ty = clamp(ty, 0, maxY);
    if (this.rt.boss?.started && this.rt.room.bossArena) { tx = clamp(tx, Math.max(0, this.rt.boss.x0 - 40), Math.min(maxX, this.rt.boss.x1 - VW + 40)); }
    if (snap) { this.cam.x = tx; this.cam.y = ty; return; }
    const kx = 1 - Math.exp(-7 * dt), ky = 1 - Math.exp(-(grounded ? 6 : 10) * dt);
    this.cam.x += clamp((tx - this.cam.x) * kx, -700 * dt, 700 * dt);
    this.cam.y += clamp((ty - this.cam.y) * ky, -600 * dt, 600 * dt);
    // zasada bezpieczeństwa: postać zawsze w [60, 300] px od góry ekranu
    const sy = cyc - this.cam.y; if (sy < 60) this.cam.y = clamp(cyc - 60, 0, maxY); else if (sy > 300) this.cam.y = clamp(cyc - 300, 0, maxY);
  }

  // ------------------------------------------------------------------ API dla scen
  /** poziom ukończony — przekazuje wyniki do sesji */
  result(): { time: number; bonus: number; pets: number; cans: number; golden: number; freed: number; noDeath: boolean; allResidents: boolean } {
    const bonus = 0;   // v0.4: brak premii za czas
    const freedHere = [1, 2, 3].filter((n) => this.session.freed.has(`${this.level.id}-S${n}`)).length;
    return { time: this.session.run.time, bonus, pets: this.session.run.pets, cans: this.session.run.cans, golden: this.session.run.golden, freed: freedHere, noDeath: this.deathCount === 0, allResidents: freedHere === 3 };
  }
  /** wraca do ostatniego punktu kontrolnego (z menu pauzy) */
  retryFromCheckpoint(): void {
    for (const p of this.players) if (!p.dead) { this.killPlayer(p); }
  }
  bossHp(): { hp: number; max: number; name: string } | null {
    const b = this.rt.boss; if (!b || !b.started) return null; return { hp: Math.max(0, b.hp), max: b.maxHp, name: b.id };
  }
  bossIdForWorld(): string { return BOSS_BY_WORLD[this.level.world] ?? ''; }
  enemiesLeft(k?: EnemyKind): number { return this.rt.enemies.filter((e) => !e.dead && (!k || e.kind === k)).length; }
  currentOf(): Current[] { return this.rt.currents; }
  decorList(): Decor[] { return this.rt.decor; }
  gateList(): GateEnt[] { return this.rt.gates; }
  hintList(): Hint[] { return this.rt.hints; }
  lanternList(): LanternEnt[] { return this.rt.lanterns; }
}
