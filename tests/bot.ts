/** Prosty bot do testów osiągalności: biegnie w prawo, skacze przez przeszkody, bije wrogów, włącza przełączniki. */
import type { PlayerInput } from '../src/engine/input';
import { defaultSettings } from '../src/engine/settings';
import { World, type WorldEvent } from '../src/game/world';
import { Session } from '../src/game/session';
import { newSave } from '../src/game/save';
import { getLevel } from '../src/game/levels';
import { T } from '../src/game/types';
import { isSolidTile, tileAt } from '../src/game/physics';
import { stompable } from '../src/game/enemies';
import type { AudioEngine } from '../src/engine/audio';

const ACT = ['left', 'right', 'up', 'down', 'jump', 'run', 'attack', 'interact', 'switch'] as const;
const blank = () => Object.fromEntries(ACT.map((a) => [a, false])) as Record<(typeof ACT)[number], boolean>;
export const stubAudio = { sfx() {}, music() {}, duck() {}, unlock() {}, setVolumes() {} } as unknown as AudioEngine;

export interface BotResult { cleared: boolean; time: number; deaths: number; maxX: number; reachedArena: boolean; events: string[]; stuckAt?: { x: number; y: number } }

export function runBot(levelId: string, maxSeconds = 420, trace = 0, probe?: (w: World, t: number) => void): BotResult {
  const session = new Session(newSave('solo', 'M'), 0); session.data.lives = [99, 99];
  const w = new World(getLevel(levelId), session, { audio: stubAudio, settings: defaultSettings(), night: false });
  w.readyT = 0;
  const DT = 1 / 60; let maxX = 0, lastProg = 0, t = 0, jumpHold = 0, frame = 0, cleared = false;
  const events: string[] = []; const arena = w.rt.room.bossArena;
  let reachedArena = false; let stuckMode = 0; let cabT = 0;
  while (t < maxSeconds && w.state === 'play') {
    const p = w.players[0]; const b = p.mv.body; const g = w.grid; const held = blank(), pressed = blank();
    frame++; if (probe) probe(w, t);
    if (trace && frame % trace === 0) console.log(t.toFixed(1), 'x', (b.x / 32).toFixed(1), 'y', (b.y / 32).toFixed(1), 'vx', b.vx | 0, 'vy', b.vy | 0, p.dead ? 'DEAD' : '', b.onGround ? 'G' : 'A', 'stuck', stuckMode);
    if (!p.dead && !p.tele) {
      if (w.ri !== 0 && !w.rt.room.bossArena && w.rt.cables.length) {
        const c = w.rt.cables[0]; const dx = c.tx * 32 + 16 - (b.x + b.w / 2);
        held.left = dx < -6; held.right = dx > 6; if (Math.abs(dx) <= 10 && b.onGround) pressed.down = true;
        if (dx > 40 && b.onGround && frame % 50 === 0) pressed.jump = true;
        const inp0: PlayerInput = { held, pressed, released: blank() }; w.update(DT, [inp0, inp0]);
        for (const e of w.events.splice(0) as WorldEvent[]) { events.push(e.t); if (e.t === 'clear') cleared = true; }
        t += DT; continue;
      }
      const feetRow = Math.floor((b.y + b.h - 1) / 32); const ahead = b.x + b.w + 8; const aTx = Math.floor(ahead / 32);
      held.right = true; held.run = stuckMode !== 2;
      if (stuckMode === 1) { held.right = false; held.left = true; }
      // ściana / zagrożenie z przodu
      let wallH = 0; for (let r = feetRow; r >= feetRow - 4; r--) { const tt = tileAt(g, aTx, r); if (isSolidTile(tt) || tt === T.HAZARD) wallH++; else break; }
      const hazardNear = [0, 1, 2].some((k) => tileAt(g, aTx + k - 0, feetRow) === T.HAZARD || tileAt(g, aTx + k, feetRow + 1) === T.HAZARD);
      const groundAt = (x: number) => { const tx = Math.floor(x / 32); for (let r = feetRow + 1; r <= feetRow + 2; r++) { const tt = tileAt(g, tx, r); if (isSolidTile(tt) || tt === T.ONEWAY) return true; } for (const pl of w.rt.plats) if (pl.solid && x >= pl.x - 4 && x <= pl.x + pl.w + 4 && Math.abs(pl.y - (b.y + b.h)) < 40) return true; return false; };
      const gapAhead = b.onGround && !groundAt(ahead) && !groundAt(ahead + 32);
      let jump = false;
      if (b.onGround && (wallH > 0 && wallH <= 3 || hazardNear)) jump = true;
      if (gapAhead) jump = true;
      // wróg
      for (const e of w.rt.enemies) {
        if (e.dead) continue; const dx = e.b.x + e.b.w / 2 - (b.x + b.w / 2), dy = e.b.y - b.y;
        if (dx > -10 && dx < 64 && Math.abs(dy) < 50) pressed.attack = true;
        if (dx > 0 && dx < 90 && Math.abs(dy) < 50 && stompable(e) && b.onGround) jump = true;
        if (dx > 20 && dx < 110 && !stompable(e) && b.onGround && ['zukorog', 'slimorog', 'kakturozec', 'rogopnacze', 'rogoroza', 'bazalisk', 'kamienirog'].includes(e.kind) && Math.abs(dy) < 40 && frame % 7 === 0) jump = true;
      }
      // przełączniki / bramy — szukaj
      const closed = w.rt.gates.filter((gt) => !gt.open && gt.cells.length && gt.cells[0][0] * 32 > b.x - 64 && gt.cells[0][0] * 32 < b.x + 520);
      let seek: { x: number; y: number } | null = null;
      if (closed.length) { const sw = w.rt.switches.filter((s) => !s.on && closed.some((gt) => s.gate === gt.id)); if (sw.length) { sw.sort((a, c) => Math.abs(a.x - b.x) - Math.abs(c.x - b.x)); seek = sw[0]; } }
      if (seek) {
        const dx = seek.x - (b.x + b.w / 2); held.left = dx < -12; held.right = dx > 12; held.run = false;
        if (Math.abs(dx) < 26 && Math.abs(seek.y - (b.y + b.h)) < 44) { pressed.interact = frame % 6 === 0; held.left = held.right = false; }
        else if (seek.y < b.y + b.h - 40 && b.onGround && Math.abs(dx) < 70) jump = true;
        else if (wallH > 0 && wallH <= 3 && b.onGround) jump = true;
      } else if (frame % 40 === 0 && w.rt.switches.some((s) => !s.on && Math.abs(s.x - (b.x + b.w / 2)) < 30 && Math.abs(s.y - (b.y + b.h)) < 44)) pressed.interact = true;
      // przewód niebieski, gdy zablokowany
      if (wallH >= 4) cabT = 2.5; else if (cabT > 0) cabT -= DT;
      if (cabT > 0 || stuckMode === 3) {
        for (const c of w.rt.cables) if ((c.color === 'blue' || c.color === 'purple') && c.revealed && Math.abs(c.tx * 32 + 16 - (b.x + b.w / 2)) < 14 && Math.abs(c.ty * 32 - (b.y + b.h)) < 6) { pressed.down = true; pressed.interact = true; }
        if (cabT > 0) { const c = w.rt.cables.find((cc) => cc.color === 'blue' && cc.face === 'up' && cc.tx * 32 > b.x - 200 && cc.tx * 32 < b.x + 200); if (c) { const dx = c.tx * 32 + 16 - (b.x + b.w / 2); held.left = dx < -8; held.right = dx > 8; held.run = Math.abs(dx) > 60; if (Math.abs(dx) < 44 && Math.abs(dx) > 6 && b.onGround && b.y + b.h > c.ty * 32 + 10 && frame % 20 === 0) { pressed.jump = true; jumpHold = 0.35; } } }
      }
      if (jump || stuckMode === 2) { pressed.jump = true; jumpHold = 0.5; }
      if (jumpHold > 0) { held.jump = true; jumpHold -= DT; }
    }
    // postęp / zacięcie
    if (b.x > maxX + 8) { maxX = b.x; lastProg = t; stuckMode = 0; }
    if (t - lastProg > 4 && t - lastProg <= 8) stuckMode = 2;
    else if (t - lastProg > 8 && t - lastProg <= 10) stuckMode = 1;
    else if (t - lastProg > 10 && t - lastProg <= 14) stuckMode = 3;
    else if (t - lastProg > 14) { lastProg = t; stuckMode = 0; }
    if (arena && b.x / 32 > arena.x0 + 2) reachedArena = true;
    const inp: PlayerInput = { held, pressed, released: blank() };
    if (trace < 0 && (pressed.interact || pressed.down)) console.log('INTERACT', t.toFixed(2), 'stuck', stuckMode, 'ri', w.ri, (b.x/32).toFixed(1));
    w.update(DT, [inp, inp]);
    for (const e of w.events.splice(0) as WorldEvent[]) { events.push(e.t); if (e.t === 'clear') cleared = true; }
    if (reachedArena && w.level.stage === 4) break;
    t += DT;
  }
  return { cleared, time: t, deaths: w.deathCount, maxX: Math.round(maxX / 32), reachedArena, events: events.slice(-6), stuckAt: cleared ? undefined : { x: Math.round(w.players[0].mv.body.x / 32), y: Math.round(w.players[0].mv.body.y / 32) } };
}
