import { describe, expect, it } from 'vitest';
import type { PlayerInput } from '../src/engine/input';
import { defaultSettings } from '../src/engine/settings';
import { World } from '../src/game/world';
import { Session } from '../src/game/session';
import { newSave } from '../src/game/save';
import { getLevel } from '../src/game/levels';
import { hitEnemy } from '../src/game/enemies';
import { BROTHERS, MAX_HP, TILE } from '../src/game/constants';
import { stubAudio } from './bot';

const ACT = ['left', 'right', 'up', 'down', 'jump', 'run', 'attack', 'interact', 'switch'] as const;
const blank = () => Object.fromEntries(ACT.map((a) => [a, false])) as Record<(typeof ACT)[number], boolean>;
const idle = (): PlayerInput => ({ held: blank(), pressed: blank(), released: blank() });
const step = (w: World, n: number) => { for (let i = 0; i < n; i++) w.update(1 / 60, [idle(), idle()]); };
const mk = (id: string, keepEnemies = false): World => {
  const w = new World(getLevel(id), new Session(newSave('solo', 'M'), 0), { audio: stubAudio, settings: defaultSettings(), night: false });
  w.readyT = 0; if (!keepEnemies) w.rt.enemies.length = 0; step(w, 3); return w;
};
const put = (w: World, tx: number, row: number) => { const p = w.players[0], b = p.mv.body; b.x = tx * TILE + TILE / 2 - b.w / 2; b.y = (row + 1) * TILE - b.h; b.vx = b.vy = 0; p.safe = { x: b.x + b.w / 2, y: (row + 1) * TILE }; };

describe('tłoki i prasy (arc)', () => {
  it('cykl: przerwa → ostrzeżenie (czerwone światło) ≥ 1 s → uderzenie; pod uderzeniem gracz traci 1 HP, poza strefą nie', () => {
    const w = mk('W7-L1'); const a = w.rt.arcs[0]; expect(w.rt.arcs.length).toBe(6);
    put(w, 5, 29);                                                                // poza strefą
    let warnT = 0, liveT = 0, sawWarnBeforeLive = false, prevWarn = false;
    for (let i = 0; i < 60 * 12; i++) { step(w, 1); put(w, 5, 29); if (a.warning) warnT += 1 / 60; if (a.live) { liveT += 1 / 60; if (prevWarn) sawWarnBeforeLive = true; } prevWarn = a.warning; }
    expect(sawWarnBeforeLive).toBe(true); expect(warnT).toBeGreaterThan(1.8); expect(liveT).toBeGreaterThan(1.5); expect(w.players[0].hp).toBe(MAX_HP);
    // wejście w strefę w momencie uderzenia
    const ax = Math.floor(a.x0 / TILE); let hit = false;
    for (let i = 0; i < 60 * 12 && !hit; i++) { step(w, 1); if (a.live) { put(w, ax, 29); step(w, 2); hit = w.players[0].hp < MAX_HP; } else put(w, 5, 29); }
    expect(hit).toBe(true);
  });
  it('przerwa jest przechodnia: w oknie bez ostrzeżenia i uderzenia strefa 2 kafli nie rani (bieg ≥ 0,5 s)', () => {
    for (const id of ['W7-L1']) for (const a of mk(id).rt.arcs) expect(a.period - a.on - a.warn, id).toBeGreaterThanOrEqual(2);
  });
  it('odłącznik (brama stp) zatrzymuje prasy końcowego przenośnika na stałe; tłoki S1 pracują dalej', () => {
    const w = mk('W7-L1'); const stopped = w.rt.arcs.filter((a) => a.stop === 'stp'); expect(stopped.length).toBe(3);
    const sw = w.rt.switches.find((s) => s.gate === 'stp')!; sw.on = true; step(w, 5);
    for (let i = 0; i < 60 * 12; i++) { step(w, 1); for (const a of stopped) { expect(a.live).toBe(false); expect(a.warning).toBe(false); } }
    let live = false; for (let i = 0; i < 60 * 8; i++) { step(w, 1); if (w.rt.arcs.filter((a) => !a.stop).some((a) => a.live)) live = true; } expect(live).toBe(true);
  });
});

describe('dron-strażnik (W7)', () => {
  it('patroluje, po sygnale (0,8 s) nurkuje w miejsce gracza, ląduje, wtedy kluczem da się go pokonać, a w locie nie; potem wraca pod sufit', () => {
    const w = mk('W7-L1', true); w.rt.enemies = w.rt.enemies.filter((e) => e.kind === 'dron' && Math.abs(e.hx - 66 * TILE) < 2 * TILE);
    const d = w.rt.enemies[0]; expect(d.kind).toBe('dron'); expect(d.st).toBe('patrol');
    const seen = new Set<string>(); put(w, 66, 20);
    for (let i = 0; i < 60 * 10; i++) { step(w, 1); put(w, 66, 20); w.players[0].invuln = 5; seen.add(d.st); if (d.st === 'dive') expect(hitEnemy(d, 'key', 1, false)).toBe('block'); }
    expect([...seen]).toEqual(expect.arrayContaining(['patrol', 'alert', 'dive', 'land', 'rise']));
    d.st = 'land'; d.dead = false; expect(hitEnemy(d, 'key', 1, false)).toBe('kill');
  });
});

describe('burza (W7-L2)', () => {
  it('odkryte odcinki mają przerwę ≥ 4 s bez wyładowania, ostrzeżenie 1,5 s; cisza (dźwignia) wyłącza tylko burzę nad mostem 2', () => {
    const w = mk('W7-L2'); const bolts = w.rt.arcs.filter((a) => a.kind === 'bolt'); expect(bolts.length).toBe(9);
    for (const a of bolts) { expect(a.period - a.on - a.warn).toBeGreaterThanOrEqual(4); expect(a.warn).toBeGreaterThanOrEqual(1.5); expect((a.x1 - a.x0) / TILE).toBeLessThanOrEqual(15); }
    const calm = bolts.filter((a) => a.stop === 'calm'); expect(calm.length).toBe(1);
    w.rt.switches.find((s) => s.gate === 'calm')!.on = true; step(w, 5);
    let others = false; for (let i = 0; i < 60 * 9; i++) { step(w, 1); expect(calm[0].live).toBe(false); if (bolts.some((a) => a !== calm[0] && a.live)) others = true; }
    expect(others).toBe(true);
  });
  it('wyładowanie rani na odkrytym odcinku, a stacja (poza zasięgiem) jest bezpieczna', () => {
    const w = mk('W7-L2'); const z = w.rt.arcs[0]; let hit = false;
    for (let i = 0; i < 60 * 9 && !hit; i++) { step(w, 1); if (z.live) { put(w, 20, 29); step(w, 2); hit = w.players[0].hp < MAX_HP; } else put(w, 5, 29); }
    expect(hit).toBe(true);
    const w2 = mk('W7-L2'); for (let i = 0; i < 60 * 30; i++) { step(w2, 1); put(w2, 31, 29); w2.players[0].invuln = 0; } expect(w2.players[0].hp).toBe(MAX_HP);
  });
});

describe('reaktor (W7-L3): most na czas i przekaźniki w kolejności', () => {
  it('most opuszcza się na 8 s, ostrzega 2 s przed końcem i chowa się; ponowne użycie dźwigni znów go opuszcza', () => {
    const w = mk('W7-L3'); const sp = w.rt.spans.find((q) => q.gate === 'tb1')!; const [x, y] = sp.cells[5]; const tile = () => w.rt.tiles[y * w.rt.grid.w + x];
    expect(sp.timed).toBe(true); expect(tile()).toBe(0);
    const sw = w.rt.switches.find((q) => q.gate === 'tb1')!; sw.on = true; sw.latch = 8; step(w, 3); expect(sp.done).toBe(true); expect(tile()).not.toBe(0);
    step(w, 60 * 5); expect(sp.done).toBe(true); step(w, 60 * 1.5); expect(sp.warned).toBe(true); expect(sp.done).toBe(true);
    step(w, 60 * 2); expect(sp.done).toBe(false); expect(tile()).toBe(0);
    sw.on = true; sw.latch = 8; step(w, 3); expect(sp.done).toBe(true);
  });
  it('każdy most na czas da się przebiec z zapasem ≥ 2 s (bieg słabszego brata + 1,5 s reakcji ≤ 6 s)', () => {
    const w = mk('W7-L3');
    for (const sp of w.rt.spans) { const t = sp.cells.length * TILE / BROTHERS.M.run + 1.5; expect(t, sp.gate).toBeLessThanOrEqual(6); }
  });
  it('przekaźniki rdzenia: zła kolejność zeruje komplet, dobra otwiera bramę windy; winda stoi do tego czasu', () => {
    const w = mk('W7-L3'); const o = w.rt.switches.filter((q) => q.gate === 'ordA').sort((a, b) => a.symbol - b.symbol); expect(o.length).toBe(3);
    const lift = w.rt.plats.find((q) => q.power === 'ordA')!; const y0 = lift.y; step(w, 60 * 6); expect(lift.y).toBe(y0);
    const press = (q: (typeof o)[number]) => { const p = w.players[0], b = p.mv.body; b.x = q.x - b.w / 2; b.y = q.y - b.h; b.vx = b.vy = 0; p.safe = { x: q.x, y: q.y }; const i = idle(); i.pressed.interact = true; w.update(1 / 60, [i, idle()]); };
    press(o[2]); step(w, 2); expect(o.every((q) => !q.on)).toBe(true);
    press(o[0]); step(w, 2); press(o[2]); step(w, 2); expect(o.every((q) => !q.on)).toBe(true);
    press(o[0]); step(w, 2); press(o[1]); step(w, 2); expect(o[0].on && o[1].on).toBe(true); press(o[2]); step(w, 5);
    expect(w.rt.gates.find((g) => g.id === 'ordA')!.open).toBe(true); step(w, 60 * 6); expect(lift.y).toBeGreaterThan(y0);
  });
});

describe('deszcz kamieni (W8-L1)', () => {
  it('14 kolumn upadku z ostrzeżeniem 1,2 s (cień) i przerwą ≥ 2,5 s; głaz rani w kolumnie, a pod łukiem-schronem (x 34–41) i w schronie z punktem kontrolnym gracz przez 40 s nie traci zdrowia', () => {
    const w = mk('W8-L1'); const rocks = w.rt.arcs.filter((a) => a.kind === 'rock'); expect(rocks.length).toBe(14);
    for (const a of rocks) { expect(a.warn).toBeGreaterThanOrEqual(1.2); expect(a.period - a.on - a.warn).toBeGreaterThanOrEqual(2.5); }
    let hit = false; const z = rocks[0];
    for (let i = 0; i < 60 * 10 && !hit; i++) { step(w, 1); if (z.live) { put(w, Math.floor(z.x0 / TILE), 28); step(w, 2); hit = w.players[0].hp < MAX_HP; } else put(w, 3, 28); }
    expect(hit).toBe(true);
    for (const tx of [37, 133]) { const w2 = mk('W8-L1'); for (let i = 0; i < 60 * 40; i++) { step(w2, 1); put(w2, tx, 28); w2.players[0].invuln = 0; } expect(w2.players[0].hp, 'x' + tx).toBe(MAX_HP); }
  });
  it('kule na ulicy ostrzegają 3 s i mają schronienie na półkach (3 drabiny)', () => {
    const w = mk('W8-L1'); expect(w.rt.boulders.length).toBe(2); for (const b of w.rt.boulders) expect(b.spec.warn).toBeGreaterThanOrEqual(3);
  });
});

describe('Wielki Przewód (W8-L2): sieć portali i kolejność przekaźników', () => {
  const goto = (w: World, i: number) => { (w as unknown as { changeRoom(i: number): void }).changeRoom(i); step(w, 2); };
  it('pięć pokoi; błędne portale prowadzą do pokoi z JEDNYMI drzwiami z powrotem (bez labiryntu), właściwe — po kolei: węzeł → stacja pośrednia → rozdzielnia', () => {
    const L = getLevel('W8-L2'); expect(L.rooms.length).toBe(5);
    const doors = (ri: number) => L.rooms[ri].specs.filter((s) => s.t === 'cable' && s.face === 'door') as Extract<(typeof L.rooms)[0]['specs'][number], { t: 'cable' }>[];
    expect(doors(0).map((d) => d.dest!.room)).toEqual([1, 2, 3]);
    expect(doors(1).length).toBe(1); expect(doors(1)[0].dest!.room).toBe(0);
    expect(doors(3).length).toBe(1); expect(doors(3)[0].dest!.room).toBe(0);
    expect(doors(2).map((d) => d.dest!.room).sort()).toEqual([0, 1, 4]);
    expect(doors(4).map((d) => d.dest!.room).sort()).toEqual([0, 2]);
    // znaki na portalach węzła: błyskawica, księżyc, liść
    expect(doors(0).map((d) => d.symbol)).toEqual([0, 1, 2]);
  });
  it('tablica rozdzielni pokazuje znaki w kolejności błyskawica → księżyc → liść → gwiazda, a przekaźniki stoją w innej kolejności', () => {
    const L = getLevel('W8-L2'); const signs = L.rooms[4].specs.filter((s) => s.t === 'sign') as { x: number; symbol: number }[];
    const board = signs.filter((s) => s.x > 15 * TILE && s.x < 25 * TILE).sort((a, b) => a.x - b.x).map((s) => s.symbol); expect(board).toEqual([0, 1, 2, 3]);
    const sw = L.rooms[4].specs.filter((s) => s.t === 'switch') as { x: number; symbol: number }[];
    const spatial = [...sw].sort((a, b) => a.x - b.x).map((s) => s.symbol); expect(spatial).not.toEqual([0, 1, 2, 3]); expect(spatial.slice().sort()).toEqual([0, 1, 2, 3]);
  });
  it('zła kolejność zeruje komplet; dobra otwiera bramę i odblokowuje drzwi do hali wyjściowej (przedtem „zablokowane”)', () => {
    const w = mk('W8-L2'); goto(w, 4);
    const sw = w.rt.switches.slice().sort((a, b) => a.symbol - b.symbol); expect(sw.length).toBe(4);
    const door = w.rt.cables.find((c) => c.id === 'W8-L2:out')!; expect(door.locked).toBe(true);
    const press = (q: (typeof sw)[number]) => { const p = w.players[0], b = p.mv.body; b.x = q.x - b.w / 2; b.y = q.y - b.h; b.vx = b.vy = 0; p.safe = { x: q.x, y: q.y }; const i = idle(); i.pressed.interact = true; w.update(1 / 60, [i, idle()]); step(w, 2); };
    press(sw[1]); expect(sw.every((q) => !q.on)).toBe(true);                       // księżyc przed błyskawicą
    press(sw[0]); press(sw[1]); press(sw[3]); expect(sw.every((q) => !q.on)).toBe(true);   // gwiazda przed liściem
    press(sw[0]); press(sw[1]); press(sw[2]); expect(door.locked).toBe(true); press(sw[3]); step(w, 3);
    expect(sw.every((q) => q.on)).toBe(true); expect(w.rt.gates.find((g) => g.id === 'ord:warpgate')!.open).toBe(true); expect(door.locked).toBe(false);
  });
  it('wejście w portal przenosi do właściwego pokoju (księżyc → stacja pośrednia), a błędny portal ze stacji (liść) wraca do stacji bezpiecznej', () => {
    const w = mk('W8-L2'); put(w, 90, 28); const i = idle(); i.pressed.up = true; w.update(1 / 60, [i, idle()]); step(w, 60);
    expect((w as unknown as { ri: number }).ri).toBe(2);
    put(w, 22, 18); const j = idle(); j.pressed.up = true; w.update(1 / 60, [j, idle()]); step(w, 60);
    expect((w as unknown as { ri: number }).ri).toBe(1);
  });
});
