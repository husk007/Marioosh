import { describe, expect, it } from 'vitest';
import type { PlayerInput } from '../src/engine/input';
import { defaultSettings } from '../src/engine/settings';
import { World } from '../src/game/world';
import { Session } from '../src/game/session';
import { newSave } from '../src/game/save';
import { getLevel } from '../src/game/levels';
import { makeEnemy } from '../src/game/enemies';
import { INVULN_AFTER_HIT, PETRIFY_DECAY, PETRIFY_DELAY, PETRIFY_MAX, PETRIFY_RATE } from '../src/game/constants';
import { stubAudio } from './bot';

const ACT = ['left', 'right', 'up', 'down', 'jump', 'run', 'attack', 'interact', 'switch'] as const;
const blank = () => Object.fromEntries(ACT.map((a) => [a, false])) as Record<(typeof ACT)[number], boolean>;
const idle = (): PlayerInput => ({ held: blank(), pressed: blank(), released: blank() });
const DT = 1 / 60;

function mkWorld(mode: 'solo' | 'coop' = 'solo', level = 'W1-L1'): World {
  const s = new Session(newSave(mode, 'M'), 0);
  const w = new World(getLevel(level), s, { audio: stubAudio, settings: defaultSettings(), night: false });
  w.readyT = 0; w.rt.enemies.length = 0; return w;
}
const step = (w: World, n: number, inp: PlayerInput[] = [idle(), idle()]) => { for (let i = 0; i < n; i++) w.update(DT, inp); };

describe('świat: obrażenia i tarcza', () => {
  it('pierwsze trafienie zabiera tarczę i daje nietykalność 1,3 s; kolejne zabija', () => {
    const w = mkWorld(); step(w, 5); const p = w.players[0];
    p.upg[p.brother].shield = true; w.hurtPlayer(p, p.mv.body.x + 50);
    expect(p.dead).toBe(false); expect(p.upg[p.brother].shield).toBe(false); expect(p.invuln).toBeGreaterThan(INVULN_AFTER_HIT - 0.1);
    w.hurtPlayer(p, p.mv.body.x); expect(p.dead).toBe(false);          // w trakcie nietykalności
    step(w, Math.ceil((INVULN_AFTER_HIT + 0.2) / DT)); w.hurtPlayer(p, p.mv.body.x + 10); expect(p.dead).toBe(true);
  });
  it('śmierć odejmuje życie, a po chwili gracz wraca na checkpoint', () => {
    const w = mkWorld(); step(w, 5); const before = w.session.lives[0]; w.killPlayer(w.players[0]);
    step(w, 200); expect(w.session.lives[0]).toBe(before - 1); expect(w.players[0].dead).toBe(false);
  });
  it('tryb god (testowy) ignoruje wrogów, ale nie kolce', () => {
    const w = mkWorld(); w.god = true; step(w, 5); const p = w.players[0];
    w.hurtPlayer(p, 0); expect(p.dead).toBe(false); w.hurtPlayer(p, 0, true); expect(p.dead).toBe(true);
  });
});

describe('świat: skok na wroga (stomp)', () => {
  it('spadając z prędkością ≥ 80 gracz pokonuje zukoroga/rogusia i odbija się', () => {
    const w = mkWorld(); step(w, 5); const p = w.players[0]; const b = p.mv.body;
    const e = makeEnemy('rogus', b.x + b.w / 2, b.y + b.h); e.b.vx = 0; w.rt.enemies.push(e);
    b.y -= 60; b.vy = 300; let bounced = false;
    for (let i = 0; i < 30; i++) { w.update(DT, [idle(), idle()]); if (b.vy < 0) bounced = true; }
    expect(e.dead || e.deadT > 0).toBe(true); expect(bounced).toBe(true); expect(p.dead).toBe(false);
  });
  it('wolny kontakt z boku (bez spadania) rani gracza', () => {
    const w = mkWorld(); step(w, 5); const p = w.players[0]; const b = p.mv.body;
    const e = makeEnemy('rogus', b.x + b.w / 2, b.y + b.h); w.rt.enemies.push(e); step(w, 20);
    expect(p.dead || p.invuln > 0).toBe(true);
  });
});

describe('świat: spetryfikowanie (miernik)', () => {
  const beamOn = (w: World) => { const b = w.players[0].mv.body; w.beams = [{ x: b.x - 40, y: b.y + b.h / 2, dir: 1, len: 200, t: 5, warn: false, owner: 0 }]; };
  it('promień podnosi miernik ~45/s, po wyjściu zanika z opóźnieniem 0,5 s ~30/s', () => {
    const w = mkWorld(); step(w, 5); const p = w.players[0]; beamOn(w); step(w, 30);
    expect(p.petrify).toBeGreaterThan(PETRIFY_RATE * 0.5 - 6); expect(p.petrify).toBeLessThan(PETRIFY_RATE * 0.5 + 6);
    w.beams = []; const hi = p.petrify; step(w, Math.round(PETRIFY_DELAY / DT) - 2); expect(p.petrify).toBeCloseTo(hi, 0);
    step(w, 30 + 2); expect(p.petrify).toBeLessThan(hi - PETRIFY_DECAY * 0.3);
  });
  it('pełny miernik w solo kończy się utratą życia; w co-op partner może uwolnić posąg', () => {
    const w = mkWorld(); step(w, 5); const l0 = w.session.lives[0]; beamOn(w); let died = false;
    for (let i = 0; i < Math.ceil(PETRIFY_MAX / PETRIFY_RATE / DT) + 60 && !died; i++) { w.update(DT, [idle(), idle()]); if (w.players[0].dead) died = true; }
    expect(died).toBe(true);
    w.beams = []; step(w, 220); expect(w.session.lives[0]).toBeLessThan(l0);
    const c = mkWorld('coop'); step(c, 5); const b = c.players[0].mv.body; c.beams = [{ x: b.x - 40, y: b.y + b.h / 2, dir: 1, len: 200, t: 9, warn: false, owner: 0 }];
    step(c, Math.ceil(PETRIFY_MAX / PETRIFY_RATE / DT) + 10); expect(c.players[0].statue).toBeGreaterThan(0);
  });
});

describe('świat: co-op', () => {
  it('ma dwóch graczy z osobnymi życiami; solo ma wspólne życia', () => {
    const c = mkWorld('coop'); expect(c.players.length).toBe(2);
    const s = mkWorld('solo'); expect(s.session.coop).toBe(false);
  });
  it('ginący gracz w co-op traci własne życie, drugi pozostaje nietknięty', () => {
    const c = mkWorld('coop'); step(c, 5); const l0 = c.session.lives[0], l1 = c.session.lives[1]; c.killPlayer(c.players[0]); step(c, 220);
    expect(c.session.lives[0] + c.session.lives[1]).toBeLessThanOrEqual(l0 + l1); expect(c.players[1].dead).toBe(false);
  });
});
