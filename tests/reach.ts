/**
 * Analiza osiągalności poziomów v0.4 BEZ trybu god: przeszukiwanie grafu stanów z użyciem prawdziwego kontrolera ruchu (stepMovement).
 * Węzły = miejsca, w których postać stoi na podłożu; krawędzie = makra (chód, skok z rozbiegu, drabina, zeskok przez platformę),
 * a poza nimi: drzwi/portale, windy i ruchome pomosty (krawędzie abstrakcyjne między końcami ruchu) oraz przełączniki, które otwierają bramy.
 * Przejście z obrażeniami upadku (≥ 2,4 m) i kolce nie są dopuszczalne na trasie głównej.
 */
import { newMove, stepMovement, type MoveInput, type MoveState } from '../src/game/movement';
import { BROTHERS, TILE, effectiveGravity, type Brother } from '../src/game/constants';
import { T, type LevelData, type Spec } from '../src/game/types';
import { touchesTile, type Grid } from '../src/game/physics';

const DT = 1 / 60;
const blank = (): MoveInput => ({ left: false, right: false, up: false, down: false, jumpHeld: false, jumpPressed: false, run: false });

interface Node { ri: number; x: number; fy: number }
interface Pt { ri: number; x: number; fy: number }

export interface Analysis {
  nodes: Node[]; points: Pt[]; openGates: Set<string>; switchesOn: Set<string>;
  reaches(ri: number, x: number, fy: number, dx?: number, dy?: number): boolean;
  /** czy środek postaci mógł znaleźć się w odległości `r` od punktu (np. przedmiot) */
  touches(ri: number, x: number, y: number, r: number): boolean;
}

export function analyze(level: LevelData, brother: Brother, opt: { maxNodes?: number } = {}): Analysis {
  const g0 = effectiveGravity(level.planet ?? level.world);
  const bp = BROTHERS[brother];
  const rooms = level.rooms;
  const openGates = new Set<string>(); const switchesOn = new Set<string>();
  const maxNodes = opt.maxNodes ?? 30000;
  let nodes: Node[] = []; let points: Pt[] = []; let ptKeys = new Set<string>();

  const gridOf = (ri: number): Grid => {
    const r = rooms[ri]; const tiles = r.tiles.slice();
    for (const s of r.specs) if (s.t === 'gate' && openGates.has(`${ri}:${s.id}`)) for (const [x, y] of s.cells) tiles[y * r.w + x] = T.EMPTY;
    for (const s of r.specs) if (s.t === 'crate') { /* skrzynki pomijamy */ }
    return { w: r.w, h: r.h, tiles };
  };

  const run = (): void => {
    nodes = []; points = []; ptKeys = new Set();
    const grids = rooms.map((_, i) => gridOf(i));
    const seen = new Set<string>(); const queue: Node[] = [];
    const key = (n: Node) => `${n.ri}:${Math.round(n.x / 8)}:${Math.round(n.fy)}`;
    const addNode = (n: Node): boolean => { const k = key(n); if (seen.has(k)) return false; seen.add(k); nodes.push(n); queue.push(n); return true; };
    const addPt = (ri: number, x: number, fy: number) => { const k = `${ri}:${Math.round(x / 6)}:${Math.round(fy / 6)}`; if (ptKeys.has(k)) return; ptKeys.add(k); points.push({ ri, x, fy }); };

    const start = rooms[0].spawn; addNode({ ri: 0, x: start.x, fy: start.y });

    const mk = (n: Node): MoveState => { const m = newMove(brother, n.x, n.fy); for (let i = 0; i < 4; i++) stepMovement(m, blank(), grids[n.ri], DT, { g: g0 }); return m; };

    /** wykonuje plan; zwraca węzeł końcowy (stoi na ziemi) lub null (przepaść, kolce, obrażenia, nie wylądował) */
    const sim = (n: Node, plan: { pre?: { dir: -1 | 1; frames: number; run: boolean }; dir: -1 | 0 | 1; run?: boolean; jump?: boolean; hold?: number; drop?: boolean; maxFrames?: number; holdDir?: boolean }): Node | null => {
      const g = grids[n.ri]; const m = mk(n); const b = m.body; const room = rooms[n.ri];
      const rec = () => addPt(n.ri, b.x + b.w / 2, b.y + b.h);
      let frames = 0;
      const step = (inp: MoveInput): boolean => {
        stepMovement(m, inp, g, DT, { g: g0 }); frames++; rec();
        if (b.y > room.h * TILE + 40) return false;
        if (touchesTile(g, b.x + 3, b.y + 3, b.w - 6, b.h - 4, T.HAZARD)) return false;
        if (m.landKind === 'damage') return false;
        return true;
      };
      if (plan.pre) { for (let i = 0; i < plan.pre.frames; i++) { const inp = blank(); if (plan.pre.dir > 0) inp.right = true; else inp.left = true; inp.run = plan.pre.run; if (!step(inp)) return null; } }
      if (plan.jump || plan.drop) {
        let held = 0; let airborne = false; let after = 0;
        const maxF = plan.maxFrames ?? 260;
        for (let i = 0; i < maxF; i++) {
          const inp = blank();
          if (plan.dir > 0) inp.right = true; else if (plan.dir < 0) inp.left = true;
          inp.run = !!plan.run && !airborne;
          if (i === 0) { inp.jumpPressed = true; inp.jumpHeld = true; if (plan.drop) inp.down = true; }
          else if (held < (plan.hold ?? 45)) inp.jumpHeld = true;
          if (plan.drop && i < 14) inp.down = true;
          held++;
          if (!step(inp)) return null;
          if (!b.onGround) airborne = true;
          if (airborne && (b.onGround || m.climbing) && !m.ledge && !m.hang) { after++; if (after > 3) break; } else after = 0;
          if (i === maxF - 1) return null;
        }
        if (!b.onGround) return null;
        return { ri: n.ri, x: b.x + b.w / 2, fy: b.y + b.h };
      }
      // chód: zwracamy listę węzłów przez zapis do kolejki
      return null;
    };

    const walk = (n: Node, dir: -1 | 1, run: boolean, release: boolean): void => {
      const g = grids[n.ri]; const m = mk(n); const b = m.body; const room = rooms[n.ri];
      let lastX = b.x; let frames = 0; let left = false;
      while (frames < 1800) {
        const inp = blank(); if (dir > 0) inp.right = true; else inp.left = true; inp.run = run;
        if (left && release) { inp.right = inp.left = false; }
        stepMovement(m, inp, g, DT, { g: g0 }); frames++;
        addPt(n.ri, b.x + b.w / 2, b.y + b.h);
        if (b.y > room.h * TILE + 40) return;
        if (touchesTile(g, b.x + 3, b.y + 3, b.w - 6, b.h - 4, T.HAZARD)) return;
        if (m.landKind === 'damage') return;
        if (!b.onGround) left = true;
        if (b.onGround && !m.ledge) {
          if (Math.abs(b.x - lastX) >= 6 || left) { lastX = b.x; addNode({ ri: n.ri, x: b.x + b.w / 2, fy: b.y + b.h }); left = false; if (release) { /* zeskok pionowy zapisany */ } }
          if (b.hitWall && Math.abs(b.vx) < 0.5) return;
        }
        if (m.climbing) return;
      }
    };

    const climb = (n: Node, up: boolean): void => {
      const g = grids[n.ri]; const m = mk(n); const b = m.body; let climbed = false;
      for (let i = 0; i < 700; i++) {
        const inp = blank(); if (up) inp.up = true; else inp.down = true;
        stepMovement(m, inp, g, DT, { g: g0 }); addPt(n.ri, b.x + b.w / 2, b.y + b.h);
        if (m.climbing) climbed = true;
        if (climbed && !m.climbing && b.onGround) { addNode({ ri: n.ri, x: b.x + b.w / 2, fy: b.y + b.h }); return; }
        if (!climbed && i > 20) return;
      }
    };

    const doors: { ri: number; x: number; fy: number; dest: { room: number; x: number; y: number } | null; locked?: boolean }[] = [];
    rooms.forEach((r, ri) => r.specs.forEach((s: Spec) => { if (s.t === 'cable' && s.face === 'door' && s.dest && !s.locked) doors.push({ ri, x: s.x, fy: s.y, dest: s.dest }); }));
    const lifts: { ri: number; x0: number; y0: number; x1: number; y1: number; w: number }[] = [];
    rooms.forEach((r, ri) => r.specs.forEach((s: Spec) => {
      if (s.t === 'platform' && (s.mode === 'v' || s.mode === 'h')) {
        const w = s.w * TILE;
        if (s.mode === 'v') lifts.push({ ri, x0: s.x + w / 2, y0: s.y, x1: s.x + w / 2, y1: s.y + s.range, w });
        else lifts.push({ ri, x0: s.x + w / 2, y0: s.y, x1: s.x + s.range + w / 2, y1: s.y, w });
      }
    }));

    let head = 0;
    while (head < queue.length && nodes.length < maxNodes) {
      const n = queue[head++];
      // chód
      for (const dir of [-1, 1] as const) { walk(n, dir, false, false); walk(n, dir, true, false); walk(n, dir, false, true); }
      // skoki
      for (const dir of [-1, 1] as const) {
        for (const [pf, pr] of [[0, false], [14, false], [34, true], [60, true]] as const) {
          for (const hold of [45, 12]) {
            const pre = pf ? { dir, frames: pf, run: pr } : undefined;
            const e = sim(n, { pre, dir, run: pr, jump: true, hold });
            if (e) addNode(e);
          }
        }
      }
      for (const hold of [45, 12]) { const e = sim(n, { dir: 0, jump: true, hold }); if (e) addNode(e); }
      for (const dir of [-1, 0, 1] as const) { const e = sim(n, { dir, jump: true, drop: true, hold: 1 }); if (e) addNode(e); }
      // drabiny
      climb(n, true); climb(n, false);
      // drzwi
      for (const d of doors) if (d.ri === n.ri && Math.abs(d.x - n.x) < 26 && Math.abs(d.fy - n.fy) < 8 && d.dest) addNode({ ri: d.dest.room, x: d.dest.x, fy: d.dest.y });
      // windy: koniec ruchu osiągalny z drugiego końca
      for (const l of lifts) if (l.ri === n.ri) {
        const onA = Math.abs(n.x - l.x0) < l.w / 2 + 14 && Math.abs(n.fy - l.y0) < 6, onB = Math.abs(n.x - l.x1) < l.w / 2 + 14 && Math.abs(n.fy - l.y1) < 6;
        if (onA) addNode({ ri: l.ri, x: l.x1, fy: l.y1 });
        if (onB) addNode({ ri: l.ri, x: l.x0, fy: l.y0 });
      }
    }
  };

  // iteruj: przełączniki osiągalne → bramy otwarte → ponowna analiza
  for (let it = 0; it < 6; it++) {
    run();
    let changed = false;
    rooms.forEach((r, ri) => {
      for (const s of r.specs) if (s.t === 'switch' && !switchesOn.has(`${ri}:${s.id}`)) {
        if (points.some((p) => p.ri === ri && Math.abs(p.x - s.x) < 34 && Math.abs(p.fy - s.y) < 44)) { switchesOn.add(`${ri}:${s.id}`); changed = true; }
      }
      for (const s of r.specs) if (s.t === 'gate' && !openGates.has(`${ri}:${s.id}`)) {
        const n = r.specs.filter((q) => q.t === 'switch' && q.gate === s.id && switchesOn.has(`${ri}:${q.id}`)).length;
        if (n >= s.need) { openGates.add(`${ri}:${s.id}`); changed = true; }
      }
    });
    if (!changed) break;
  }
  return {
    nodes, points, openGates, switchesOn,
    reaches: (ri, x, fy, dx = 36, dy = 24) => points.some((p) => p.ri === ri && Math.abs(p.x - x) < dx && Math.abs(p.fy - fy) < dy),
    touches: (ri, x, y, r) => points.some((p) => p.ri === ri && Math.hypot(p.x - x, p.fy - bp.hitH / 2 - y) < r),
  };
}
