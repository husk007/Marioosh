import { describe, expect, it } from 'vitest';
import type { PlayerInput } from '../src/engine/input';
import { defaultSettings } from '../src/engine/settings';
import { World } from '../src/game/world';
import { Session } from '../src/game/session';
import { newSave } from '../src/game/save';
import { getLevel } from '../src/game/levels';
import { bossHarmful, bossVulnerable, hitBoss } from '../src/game/bosses';
import { MAX_HP, TILE } from '../src/game/constants';
import { stubAudio } from './bot';

const ACT = ['left', 'right', 'up', 'down', 'jump', 'run', 'attack', 'interact', 'switch'] as const;
const blank = () => Object.fromEntries(ACT.map((a) => [a, false])) as Record<(typeof ACT)[number], boolean>;
const idle = (): PlayerInput => ({ held: blank(), pressed: blank(), released: blank() });
const DT = 1 / 60;
const step = (w: World, n: number) => { for (let i = 0; i < n; i++) w.update(DT, [idle(), idle()]); };

function arena(): World {
  const s = new Session(newSave('solo', 'M'), 0);
  const w = new World(getLevel('W1-L4'), s, { audio: stubAudio, settings: defaultSettings(), night: false });
  w.readyT = 0; w.rt.enemies.length = 0; step(w, 3); return w;
}
const gens = (w: World) => w.rt.switches.filter((s) => s.gate === 'gen');
const connectAll = (w: World) => gens(w).forEach((s) => { s.on = true; s.latch = 28; });

describe('Rogomir v0.4 (bez skakania po głowie)', () => {
  it('ma ≈ 2,1 m wysokości i pancerz na starcie; trzy generatory', () => {
    const w = arena(); const b = w.rt.boss!;
    expect(b.b.h).toBeGreaterThan(75); expect(b.b.h).toBeLessThan(95);
    expect(b.armor).toBe(true); expect(gens(w).length).toBe(3);
  });
  it('z pancerzem nie da się go trafić nawet gdy utknął; po odłączeniu wszystkich generatorów — da się, a trafienie przywraca pancerz i generatory', () => {
    const w = arena(); const b = w.rt.boss!; b.started = true; b.st = 'stuck'; b.t = 5;
    expect(bossVulnerable(b)).toBe(false); expect(hitBoss(b, 'key')).toBe(false); expect(b.hp).toBe(3);
    gens(w)[0].on = true; gens(w)[1].on = true; step(w, 2); expect(b.armor).toBe(true);
    b.st = 'stuck'; b.t = 5; connectAll(w); step(w, 2);
    expect(b.armor).toBe(false); expect(bossVulnerable(b)).toBe(true);
    b.hurt = 0; expect(hitBoss(b, 'key')).toBe(true); expect(b.hp).toBe(2); step(w, 2);
    expect(b.armor).toBe(true); expect(gens(w).every((s) => !s.on)).toBe(true);
  });
  it('skok na głowę (stomp) nie rani; kontakt poza stanem „utknął” zawsze rani', () => {
    const w = arena(); const b = w.rt.boss!; b.started = true; b.st = 'charge'; expect(bossHarmful(b)).toBe(true);
    connectAll(w); step(w, 2); b.st = 'stuck'; expect(hitBoss(b, 'stomp')).toBe(false);
  });
  it('okno 28 s: po upływie zatrzasku generatory wracają, a pancerz z nimi', () => {
    const w = arena(); const b = w.rt.boss!; b.started = true; connectAll(w); step(w, 2); expect(b.armor).toBe(false);
    for (const s of gens(w)) s.latch = 0.05; step(w, 10); expect(gens(w).every((s) => !s.on)).toBe(true); expect(b.armor).toBe(true);
  });
  it('trzy trafienia (z ponownym odłączaniem generatorów) pokonują bossa', () => {
    const w = arena(); const b = w.rt.boss!; b.started = true;
    for (let i = 0; i < 3; i++) { connectAll(w); step(w, 2); b.st = 'stuck'; b.t = 5; b.hurt = 0; expect(hitBoss(b, 'key')).toBe(true); step(w, 2); }
    expect(b.dead).toBe(true);
  });
  it('gracz na pomoście jest bezpieczny: 25 s szarż Rogomira pod pomostem nie ranią', () => {
    const w = arena(); const p = w.players[0]; const b = w.rt.boss!; const m = p.mv.body;
    m.x = 64.5 * TILE - m.w / 2; m.y = 11 * TILE - m.h; m.vx = m.vy = 0; p.safe = { x: m.x + m.w / 2, y: 11 * TILE };
    b.started = true; b.b.x = 90 * TILE; step(w, 60 * 25);
    expect(p.hp).toBe(MAX_HP); expect(p.dead).toBe(false);
    expect(b.cycle).toBeGreaterThan(0);            // faktycznie szarżował
    expect(m.y + m.h).toBeCloseTo(11 * TILE, 0);   // nadal stoi na pomoście
  });
  it('szarża jest wolniejsza od biegu Marioosha (można uciec do drabiny)', () => {
    const w = arena(); const b = w.rt.boss!; b.started = true; b.b.x = 100 * TILE; b.st = 'idle'; b.t = 0;
    let vmax = 0; for (let i = 0; i < 400; i++) { w.update(DT, [idle(), idle()]); vmax = Math.max(vmax, Math.abs(b.b.vx)); }
    expect(vmax).toBeGreaterThan(100); expect(vmax).toBeLessThan(168);
  });
  it('pomost jest ciągły: można przebiec nad bossem przez całą arenę (z lewej na prawą) bez obrażeń', () => {
    const w = arena(); const p = w.players[0]; const b = w.rt.boss!; const m = p.mv.body;
    m.x = 61 * TILE; m.y = 11 * TILE - m.h; p.safe = { x: m.x + m.w / 2, y: 11 * TILE };
    b.started = true; b.b.x = 90 * TILE;
    const inp = idle(); inp.held.right = true; inp.held.run = true;
    for (let i = 0; i < 60 * 14; i++) w.update(DT, [inp, idle()]);
    expect(m.x).toBeGreaterThan(105 * TILE); expect(p.hp).toBe(MAX_HP); expect(m.y + m.h).toBeCloseTo(11 * TILE, 0);
  });
  it('szarża kończy się zawsze przy ścianie areny, a utknięcie trwa ≥ 5,5 s (czas na zejście drabiną i cios)', () => {
    const w = arena(); const p = w.players[0]; const b = w.rt.boss!; const m = p.mv.body;
    m.x = 70 * TILE; m.y = 11 * TILE - m.h; p.safe = { x: m.x + m.w / 2, y: 11 * TILE };
    b.started = true; b.b.x = 90 * TILE;
    let stuckStart = -1; const stuckAt: number[] = []; const lens: number[] = [];
    for (let i = 0; i < 60 * 40; i++) {
      w.update(DT, [idle(), idle()]);
      if (b.st === 'stuck' && stuckStart < 0) { stuckStart = i; stuckAt.push(b.b.x); }
      if (b.st !== 'stuck' && stuckStart >= 0) { lens.push((i - stuckStart) * DT); stuckStart = -1; }
    }
    expect(stuckAt.length).toBeGreaterThanOrEqual(2);
    for (const x of stuckAt) expect(x < 58 * TILE + 4 || x + b.b.w > 111 * TILE - 4).toBe(true);
    for (const l of lens) expect(l).toBeGreaterThan(5.4);
  });
  it('zejście drabiną z pomostu na podłogę arony trwa < 3,5 s (zostaje ≥ 2 s okna utknięcia bossa na cios)', () => {
    const w = arena(); const p = w.players[0]; const m = p.mv.body; w.rt.boss!.started = false;
    m.x = 62.5 * TILE - m.w / 2; m.y = 11 * TILE - m.h; m.vx = m.vy = 0; step(w, 3);
    const inp = idle(); inp.held.down = true; let t = 0;
    while (t < 5 && !(m.onGround && m.y + m.h > 14 * TILE)) { w.update(DT, [inp, idle()]); t += DT; }
    expect(m.y + m.h).toBeCloseTo(15 * TILE, 0); expect(t).toBeLessThan(3.5);
  });
});
