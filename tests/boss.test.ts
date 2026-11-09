import { describe, expect, it, vi } from 'vitest';
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

describe('Rogopłetw Wielki v0.4 (woda chroni, zawór osusza basen)', () => {
  function pool(): World {
    const s = new Session(newSave('solo', 'M'), 0);
    const w = new World(getLevel('W4-L4'), s, { audio: stubAudio, settings: defaultSettings(), night: false });
    w.readyT = 0; w.rt.enemies.length = 0;
    const b = w.players[0].mv.body; b.x = 93 * TILE; b.y = 20 * TILE - b.h; b.vx = b.vy = 0; w.players[0].invuln = 999;   // widz na bloku wejściowym
    w.rt.boss!.started = true; step(w, 3); return w;
  }
  const valve = (w: World, g: string) => w.rt.switches.find((s) => s.gate === g)!;
  const inWater = (w: World) => { const b = w.rt.boss!; return w.waterAt(b.b.x + b.b.w / 2, b.floorY - 20); };

  it('w wodzie jest nietykalny; po spuszczeniu wody z basenu, w którym stoi — unieruchomiony i podatny na cios', () => {
    const w = pool(); const b = w.rt.boss!; step(w, 60 * 2);
    expect(inWater(w)).toBe(true); expect(bossVulnerable(b)).toBe(false); expect(hitBoss(b, 'key')).toBe(false);
    const sec = Math.floor((b.b.x + b.b.w / 2 - b.x0) / ((b.x1 - b.x0) / 3));
    const g = ['poolA', 'poolB', 'poolC'][sec]; const v = valve(w, g); v.on = true; v.latch = 16;
    step(w, 60 * 4);
    expect(inWater(w)).toBe(false); expect(b.st).toBe('stranded'); expect(bossVulnerable(b)).toBe(true); expect(bossHarmful(b)).toBe(false);
  });
  it('trafiony ucieka do basenu z wodą i wraca do walki; po 3 trafieniach pada; woda wraca po zamknięciu zaworu (latch 16 s)', () => {
    const w = pool(); const b = w.rt.boss!; step(w, 60 * 2);
    for (let hit = 1; hit <= 3; hit++) {
      const secW = (b.x1 - b.x0) / 3;
      for (let i = 0; i < 60 * 10 && !(b.st === 'swim' && Math.abs(b.x0 + secW * ((b.data.sec ?? 1) + 0.5) - (b.b.x + b.b.w / 2)) < 10); i++) step(w, 1);   // czeka, aż boss dojdzie do celu
      const sec = Math.floor((b.b.x + b.b.w / 2 - b.x0) / secW);
      const v = valve(w, ['poolA', 'poolB', 'poolC'][sec]); v.on = true; v.latch = 16;
      for (let i = 0; i < 60 * 8 && b.st !== 'stranded'; i++) step(w, 1);
      expect(b.st, `hit ${hit}`).toBe('stranded');
      b.hurt = 0; expect(hitBoss(b, 'key')).toBe(true); expect(b.hp).toBe(3 - hit);
      if (hit < 3) { for (let i = 0; i < 60 * 8 && !(b.st === 'swim' || b.st === 'crouch' || b.st === 'dash'); i++) step(w, 1); expect(inWater(w), `after hit ${hit}`).toBe(true); step(w, 60 * 17); expect(w.waterAt((b.x0 + b.x1) / 2, b.floorY - 20)).toBe(true); }
    }
    expect(b.dead).toBe(true);
  });
  it('skok na pomost jest zapowiedziany (przykucnięcie, boss nieszkodliwy) i kończy się lądowaniem w basenie', () => {
    const w = pool(); const b = w.rt.boss!; const p = w.players[0]; step(w, 60 * 2);
    const bb = p.mv.body; bb.x = b.b.x + 10; bb.y = 20 * TILE - bb.h; bb.vx = bb.vy = 0;    // gracz na pomoście nad bossem
    let crouched = false, leaped = false, landed = false;
    for (let i = 0; i < 60 * 12 && !landed; i++) { step(w, 1); bb.x = b.b.x + 10; bb.y = 20 * TILE - bb.h; if (b.st === 'crouch') { crouched = true; expect(bossHarmful(b)).toBe(false); } if (b.st === 'leap') { leaped = true; expect(bossHarmful(b)).toBe(true); expect(b.b.y).toBeLessThan(b.floorY - b.b.h + 1); } if (leaped && b.st === 'swim') landed = true; }
    expect(crouched && leaped && landed).toBe(true); expect(b.b.y + b.b.h).toBeCloseTo(b.floorY, 0);
  });
});

describe('Złomotaur v0.4 (dwie suwnice, okno 14 s)', () => {
  const arenaZ = (): World => {
    const s = new Session(newSave('solo', 'M'), 0);
    const w = new World(getLevel('W2-L4'), s, { audio: stubAudio, settings: defaultSettings(), night: false });
    w.readyT = 0; w.rt.enemies.length = 0; step(w, 3); return w;
  };
  const cr = (w: World) => w.rt.switches.filter((s) => s.gate === 'crane');
  const on = (w: World) => cr(w).forEach((s) => { s.on = true; s.latch = 14; });
  it('pancerz na starcie, dwa pulpity; jeden pulpit nie wystarcza, oba zdejmują pancerz, a trafienie go przywraca i wyłącza pulpity', () => {
    const w = arenaZ(); const b = w.rt.boss!; b.started = true; b.st = 'stuck'; b.t = 5;
    expect(b.armor).toBe(true); expect(cr(w).length).toBe(2);
    cr(w)[0].on = true; cr(w)[0].latch = 14; step(w, 2); expect(b.armor).toBe(true); expect(hitBoss(b, 'key')).toBe(false);
    on(w); step(w, 2); expect(b.armor).toBe(false); b.st = 'stuck'; b.t = 5; b.hurt = 0;
    expect(hitBoss(b, 'key')).toBe(true); expect(b.hp).toBe(2); step(w, 2); expect(b.armor).toBe(true); expect(cr(w).every((s) => !s.on)).toBe(true);
  });
  it('trzy trafienia pokonują bossa; skok na głowę nie rani', () => {
    const w = arenaZ(); const b = w.rt.boss!; b.started = true;
    on(w); step(w, 2); b.st = 'stuck'; expect(hitBoss(b, 'stomp')).toBe(false);
    for (let i = 0; i < 3; i++) { on(w); step(w, 2); b.st = 'stuck'; b.t = 5; b.hurt = 0; expect(hitBoss(b, 'key')).toBe(true); step(w, 2); }
    expect(b.dead).toBe(true);
  });
  it('okno 14 s: po zatrzasku pulpity gasną, a pancerz wraca', () => {
    const w = arenaZ(); const b = w.rt.boss!; b.started = true; on(w); step(w, 2); expect(b.armor).toBe(false);
    for (const s of cr(w)) s.latch = 0.05; step(w, 10); expect(cr(w).every((s) => !s.on)).toBe(true); expect(b.armor).toBe(true);
  });
  it('gracz na płycie wieży jest bezpieczny przez 25 s szarż; szarża kończy się przy ścianie areny (obok drabiny), a utknięcie trwa ≥ 5,5 s', () => {
    const w = arenaZ(); const p = w.players[0]; const b = w.rt.boss!; const m = p.mv.body;
    m.x = 108.5 * TILE - m.w / 2; m.y = 14 * TILE - m.h; m.vx = m.vy = 0; p.safe = { x: m.x + m.w / 2, y: 14 * TILE };
    b.started = true; b.b.x = 125 * TILE; let stuck = 0, maxStuck = 0, xmin = 1e9, xmax = -1e9;
    for (let i = 0; i < 60 * 25; i++) { step(w, 1); if (b.st === 'stuck') { stuck += DT; maxStuck = Math.max(maxStuck, stuck); } else stuck = 0; xmin = Math.min(xmin, b.b.x); xmax = Math.max(xmax, b.b.x + b.b.w); }
    expect(p.hp).toBe(MAX_HP); expect(b.cycle).toBeGreaterThan(0);
    expect(xmin).toBeGreaterThanOrEqual(113 * TILE - 1); expect(xmax).toBeLessThanOrEqual(133 * TILE + 1);
    expect(maxStuck).toBeGreaterThan(5.4);
  });
  it('czas przejazdu wagonika między wieżami mieści się w oknie 14 s z zapasem', () => {
    const w = arenaZ(); const pl = w.rt.plats.find((q) => q.mode === 'h')!;
    expect(pl.range / pl.speed + 2 * (pl.dwell ?? 0)).toBeLessThan(11);
  });
});

describe('Kaktogór v0.4 (korzenie odrastają po każdym trafieniu)', () => {
  const arenaK = (): World => {
    const s = new Session(newSave('solo', 'M'), 0);
    const w = new World(getLevel('W3-L4'), s, { audio: stubAudio, settings: defaultSettings(), night: false });
    w.readyT = 0; w.rt.enemies.length = 0; step(w, 3); return w;
  };
  const roots = (w: World) => w.rt.decor.filter((d) => d.k === 'root');
  const cut = (w: World) => { for (const r of roots(w)) r.state = 1; };
  it('trzy korzenie (w tym jeden na półce); pancerz na starcie, dwa korzenie nie wystarczą, trzy zdejmują pancerz', () => {
    const w = arenaK(); const b = w.rt.boss!; b.started = true;
    expect(roots(w).length).toBe(3); expect(roots(w).some((r) => r.y < 25 * TILE)).toBe(true); expect(b.armor).toBe(true);
    roots(w)[0].state = 1; roots(w)[1].state = 1; step(w, 2); expect(b.armor).toBe(true); expect(hitBoss(b, 'key')).toBe(false);
    roots(w)[2].state = 1; step(w, 2); expect(b.armor).toBe(false); b.hurt = 0; expect(hitBoss(b, 'key')).toBe(true);
  });
  it('po trafieniu pancerz wraca, a korzenie odrastają; trzy trafienia pokonują bossa; skok na głowę nie rani', () => {
    const w = arenaK(); const b = w.rt.boss!; b.started = true; expect(b.hp).toBe(3);
    for (let i = 0; i < 3; i++) {
      cut(w); step(w, 2); expect(b.armor, 'pancerz zdjęty ' + i).toBe(false); expect(hitBoss(b, 'stomp')).toBe(false);
      b.hurt = 0; expect(hitBoss(b, 'key')).toBe(true); step(w, 2);
      if (i < 2) { expect(b.armor).toBe(true); expect(roots(w).every((r) => r.state === 0)).toBe(true); expect(hitBoss(b, 'key')).toBe(false); }
    }
    expect(b.dead).toBe(true);
  });
  it('korzenie po ścięciu w jednym cyklu nie dają drugiego trafienia bez ponownego odcięcia', () => {
    const w = arenaK(); const b = w.rt.boss!; b.started = true; cut(w); step(w, 2); b.hurt = 0; expect(hitBoss(b, 'key')).toBe(true); step(w, 2); b.hurt = 0;
    expect(hitBoss(b, 'key')).toBe(false); expect(b.hp).toBe(2);
  });
});

describe('Ceratopsor v0.4 (pieczęć, kolumny, galeria)', () => {
  const arenaC = (): World => {
    const s = new Session(newSave('solo', 'M'), 0);
    const w = new World(getLevel('W5-L4'), s, { audio: stubAudio, settings: defaultSettings(), night: false });
    w.readyT = 0; w.rt.enemies.length = 0; step(w, 3); return w;
  };
  const seal = (w: World) => w.rt.switches.filter((s) => s.gate === 'seal');
  const on = (w: World) => seal(w).forEach((s) => { s.on = true; s.latch = 16; });
  it('pancerz na starcie; bez pieczęci utknięty boss jest nietykalny, z pieczęcią — podatny; trafienie przywraca pancerz i pieczęć', () => {
    const w = arenaC(); const b = w.rt.boss!; b.started = true; b.st = 'stuck'; b.t = 5;
    expect(b.armor).toBe(true); expect(seal(w).length).toBe(1); expect(hitBoss(b, 'key')).toBe(false);
    on(w); step(w, 2); expect(b.armor).toBe(false); b.st = 'stuck'; b.t = 5; b.hurt = 0; expect(hitBoss(b, 'stomp')).toBe(false);
    expect(hitBoss(b, 'key')).toBe(true); expect(b.hp).toBe(2); step(w, 2); expect(b.armor).toBe(true); expect(seal(w).every((s) => !s.on)).toBe(true);
  });
  it('trzy trafienia pokonują bossa; poza utknięciem pieczęć nie wystarcza', () => {
    const w = arenaC(); const b = w.rt.boss!; b.started = true; on(w); step(w, 2); b.st = 'charge'; expect(hitBoss(b, 'key')).toBe(false);
    for (let i = 0; i < 3; i++) { on(w); step(w, 2); b.st = 'stuck'; b.t = 5; b.hurt = 0; expect(hitBoss(b, 'key')).toBe(true); step(w, 2); }
    expect(b.dead).toBe(true);
  });
  it('szarża zatrzymuje się na kolumnie: gracz w zachodnim pasie, boss we wschodnim — boss nie przechodzi kolumny, a gracz na galerii przez 25 s nie traci zdrowia', () => {
    const w = arenaC(); const p = w.players[0]; const b = w.rt.boss!; const m = p.mv.body;
    m.x = 18.5 * TILE - m.w / 2; m.y = 20 * TILE - m.h; m.vx = m.vy = 0; p.safe = { x: m.x + m.w / 2, y: 20 * TILE };
    b.started = true; b.b.x = 27 * TILE; let stuck = false, xmin = 1e9;
    const rnd = vi.spyOn(Math, 'random').mockReturnValue(0.99);   // kamienie sufitowe lecą na wschodni kraniec areny (deterministycznie)
    for (let i = 0; i < 60 * 25; i++) { step(w, 1); m.x = 18.5 * TILE - m.w / 2; m.vx = 0; if (b.st === 'stuck') stuck = true; xmin = Math.min(xmin, b.b.x); }
    rnd.mockRestore();
    expect(stuck).toBe(true); expect(p.hp).toBe(MAX_HP);
    expect(xmin).toBeGreaterThanOrEqual(24 * TILE - 2);       // nie przeszedł przez kolumnę (22–23)
  });
});

describe('Krukoróg Królewski v0.4 (trzy reflektory, lądowanie, trafienia kluczem)', () => {
  const arenaK = (): World => {
    const s = new Session(newSave('solo', 'M'), 0);
    const w = new World(getLevel('W6-L4'), s, { audio: stubAudio, settings: defaultSettings(), night: false });
    w.readyT = 0; w.rt.enemies.length = 0; step(w, 3); return w;
  };
  const spots = (w: World) => w.rt.switches.filter((s) => s.gate === 'spot');
  const lightAll = (w: World, n = 3) => spots(w).slice(0, n).forEach((s) => { s.on = true; s.latch = 8; });
  const safe = (w: World) => { const p = w.players[0]; const m = p.mv.body; m.x = 118.5 * TILE - m.w / 2; m.y = 25 * TILE - m.h; m.vx = m.vy = 0; p.safe = { x: m.x + m.w / 2, y: 25 * TILE }; };   // wysoko nad areną: nic nie dosięga
  it('trzy reflektory; boss nie ma pancerza i bez oślepienia jest nietykalny', () => {
    const w = arenaK(); const b = w.rt.boss!; b.started = true; step(w, 200);
    expect(spots(w).length).toBe(3); expect(b.armor).toBe(false); expect(bossVulnerable(b)).toBe(false); expect(hitBoss(b, 'key')).toBe(false);
  });
  it('dwa reflektory nie wystarczą: boss przez 20 s nie ląduje', () => {
    const w = arenaK(); const b = w.rt.boss!; b.started = true; step(w, 60); let landed = false;
    for (let i = 0; i < 60 * 20; i++) { lightAll(w, 2); safe(w); step(w, 1); if (b.st === 'landed' || b.st === 'dazed') landed = true; }
    expect(landed).toBe(false);
  });
  it('reflektor gaśnie po 8 s, więc trzeba zapalić wszystkie trzy w jednym oknie', () => {
    const w = arenaK(); const b = w.rt.boss!; b.started = true; step(w, 60); const s = spots(w);
    s[0].on = true; s[0].latch = 8; safe(w); step(w, 60 * 7); expect(s[0].on).toBe(true); step(w, 60 * 2); expect(s[0].on).toBe(false);
  });
  it('trzy reflektory → boss ląduje, jest podatny na klucz (nie na skok na głowę); trzy trafienia go pokonują, reflektory gasną po każdym lądowaniu', () => {
    const w = arenaK(); const b = w.rt.boss!; b.started = true; step(w, 60);
    for (let hit = 0; hit < 3; hit++) {
      let guard = 0; while (b.st !== 'landed' && guard++ < 60 * 25) { lightAll(w); safe(w); step(w, 1); }
      expect(b.st).toBe('landed'); expect(spots(w).every((s) => !s.on)).toBe(true);
      expect(bossHarmful(b)).toBe(false); expect(hitBoss(b, 'stomp')).toBe(false);
      b.hurt = 0; expect(hitBoss(b, 'key')).toBe(true); expect(b.hp).toBe(2 - hit); for (let i = 0; i < 180; i++) { safe(w); step(w, 1); }
    }
    expect(b.dead).toBe(true);
  });
});

describe('Rogodron v0.4 (trzy generatory, złom, drony, odsłonięty rdzeń)', () => {
  const arenaR = (): World => {
    const s = new Session(newSave('solo', 'M'), 0);
    const w = new World(getLevel('W7-L4'), s, { audio: stubAudio, settings: defaultSettings(), night: false });
    w.readyT = 0; w.rt.enemies.length = 0; step(w, 3); return w;
  };
  const gens = (w: World) => w.rt.switches.filter((s) => s.gate === 'gen');
  const onAll = (w: World, n = 3) => gens(w).slice(0, n).forEach((s) => { s.on = true; s.latch = 28; });
  const safe = (w: World) => { const p = w.players[0]; const m = p.mv.body; m.x = 127 * TILE - m.w / 2; m.y = 24 * TILE - m.h; m.vx = m.vy = 0; p.safe = { x: m.x + m.w / 2, y: 24 * TILE }; p.invuln = 5; };   // podest operatora, lewy kraniec
  it('trzy generatory (lewy podest, środek, prawy podest); boss w pancerzu jest nietykalny', () => {
    const w = arenaR(); const b = w.rt.boss!; b.started = true; step(w, 200);
    expect(gens(w).length).toBe(3); expect(b.armor).toBe(true); expect(hitBoss(b, 'key')).toBe(false);
  });
  it('dwa generatory nie wystarczą; trzy → boss schodzi nisko, nie rani dotykiem i da się go trafić kluczem (nie skokiem); trzy trafienia go pokonują', () => {
    const w = arenaR(); const b = w.rt.boss!; b.started = true; step(w, 60); let seen = false;
    for (let i = 0; i < 60 * 12; i++) { onAll(w, 2); safe(w); step(w, 1); if (b.st === 'exposed') seen = true; }
    expect(seen).toBe(false);
    for (let hit = 0; hit < 3; hit++) {
      let guard = 0; while (b.st !== 'exposed' && guard++ < 60 * 30) { onAll(w); safe(w); step(w, 1); }
      expect(b.st).toBe('exposed'); expect(b.armor).toBe(false); expect(bossHarmful(b)).toBe(false); expect(hitBoss(b, 'stomp')).toBe(false);
      b.hurt = 0; expect(hitBoss(b, 'key')).toBe(true); expect(b.hp).toBe(2 - hit); for (let i = 0; i < 240; i++) { safe(w); step(w, 1); }
    }
    expect(b.dead).toBe(true);
  });
  it('w locie boss nie sięga graczy na podestach i platformie środkowej (także w skoku), spada złom, a drony są ograniczone do 3', () => {
    const w = arenaR(); const b = w.rt.boss!; b.started = true; let maxDrones = 0, scrap = 0, touched = false;
    for (let i = 0; i < 60 * 25; i++) { safe(w); w.players[0].mv.body.x = (i % 600 < 300 ? 127 : 144) * TILE - w.players[0].mv.body.w / 2; step(w, 1); maxDrones = Math.max(maxDrones, w.rt.enemies.filter((e) => e.kind === 'dron' && !e.dead).length); scrap = Math.max(scrap, w.projs.filter((p) => p.kind === 'scrap').length); if (b.st === 'fly' && bossHarmful(b)) { const m = w.players[0].mv.body; if (m.x < b.b.x + b.b.w && m.x + m.w > b.b.x && m.y < b.b.y + b.b.h && m.y + m.h > b.b.y) touched = true; } }
    expect(touched).toBe(false); expect(scrap).toBeGreaterThan(0); expect(maxDrones).toBeLessThanOrEqual(3);
  });
});
