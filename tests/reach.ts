/**
 * Analiza osiągalności poziomów v0.4 BEZ trybu god: przeszukiwanie grafu stanów z użyciem prawdziwego kontrolera ruchu (stepMovement).
 * Węzły = miejsca, w których postać stoi na podłożu (lub pływa); krawędzie = makra (chód, skok z rozbiegu, drabina, zeskok przez platformę,
 * pływanie 8-kierunkowe, wyskok z wody), a poza nimi: drzwi/portale, windy i ruchome pomosty (krawędzie abstrakcyjne między końcami ruchu)
 * oraz przełączniki, które otwierają bramy i zmieniają poziom wody (`flood`).
 * Powietrze: każdy węzeł niesie `wet` = ile sekund „zapasu” już zużyto (jak w grze: pod wodą +1 s/s, nad wodą −AIR_REFILL s/s);
 * ścieżki przekraczające AIR_MAX − AIR_TEST_MARGIN są odrzucane. Przejście z obrażeniami upadku (≥ 2,4 m) i kolce nie są dopuszczalne na trasie głównej.
 */
import { newMove, stepMovement, type MoveInput, type MoveState } from '../src/game/movement';
import { AIR_MAX, AIR_REFILL, AIR_TEST_MARGIN, BROTHERS, TILE, effectiveGravity, type Brother } from '../src/game/constants';
import { T, type LevelData, type Spec } from '../src/game/types';
import { touchesTile, type Grid } from '../src/game/physics';

const DT = 1 / 60;
const WET_LIMIT = AIR_MAX - AIR_TEST_MARGIN;
const blank = (): MoveInput => ({ left: false, right: false, up: false, down: false, jumpHeld: false, jumpPressed: false, run: false });

interface Node { ri: number; x: number; fy: number; wet: number; sw?: boolean }
interface Pt { ri: number; x: number; fy: number }

export interface Analysis {
  nodes: Node[]; points: Pt[]; openGates: Set<string>; switchesOn: Set<string>; openFloods?: Set<string>;
  reaches(ri: number, x: number, fy: number, dx?: number, dy?: number): boolean;
  /** czy środek postaci mógł znaleźć się w odległości `r` od punktu (np. przedmiot) */
  touches(ri: number, x: number, y: number, r: number): boolean;
  /** największe zużycie powietrza (s) na jakimkolwiek węźle trasy (0 = poziom bez zanurzeń) */
  maxWet: number;
}

export function analyze(level: LevelData, brother: Brother, opt: { maxNodes?: number } = {}): Analysis {
  const g0 = effectiveGravity(level.planet ?? level.world);
  const bp = BROTHERS[brother];
  const rooms = level.rooms;
  const openGates = new Set<string>(); const switchesOn = new Set<string>(); const openFloods = new Set<string>();
  const maxNodes = opt.maxNodes ?? 30000;
  let nodes: Node[] = []; let points: Pt[] = []; let ptKeys = new Set<string>(); let maxWet = 0;

  const gridOf = (ri: number): Grid => {
    const r = rooms[ri]; const tiles = r.tiles.slice();
    for (const s of r.specs) if (s.t === 'gate' && openGates.has(`${ri}:${s.id}`)) for (const [x, y] of s.cells) tiles[y * r.w + x] = T.EMPTY;
    for (const s of r.specs) if (s.t === 'span' && openFloods.has(`${ri}:${s.gate}`)) for (const [x, y] of s.cells) if (tiles[y * r.w + x] === T.EMPTY) tiles[y * r.w + x] = T.ONEWAY;
    return { w: r.w, h: r.h, tiles };
  };
  const waterOf = (ri: number): Uint8Array => {
    const r = rooms[ri]; const w = r.water.slice();
    for (const s of r.specs) if (s.t === 'flood') {
      const row = openFloods.has(`${ri}:${s.gate}`) ? s.to : s.from; const top = Math.ceil(row - 1e-6);
      for (let y = Math.max(0, s.y0 ?? 0); y <= Math.min(r.h - 1, s.y1 ?? 9999); y++) for (let x = s.x0; x <= s.x1; x++) w[y * r.w + x] = y >= top ? 1 : 0;
    }
    return w;
  };

  const run = (): void => {
    nodes = [];
    const grids = rooms.map((_, i) => gridOf(i)); const waters = rooms.map((_, i) => waterOf(i));
    const hasWater = rooms.map((_, i) => waters[i].some((v) => v === 1));
    const seen = new Map<string, number>(); const queue: Node[] = [];
    const key = (n: Node) => n.sw ? `s${n.ri}:${Math.round(n.x / 12)}:${Math.round(n.fy / 12)}` : `${n.ri}:${Math.round(n.x / 8)}:${Math.round(n.fy)}`;
    const addNode = (n: Node): boolean => {
      if (n.wet > WET_LIMIT) return false;
      const k = key(n); const prev = seen.get(k);
      if (prev !== undefined && n.wet >= prev - (n.sw ? 2.5 : 1)) return false;
      seen.set(k, n.wet); nodes.push(n); queue.push(n); if (n.wet > maxWet) maxWet = n.wet; return true;
    };
    const addPt = (ri: number, x: number, fy: number) => { const k = `${ri}:${Math.round(x / 6)}:${Math.round(fy / 6)}`; if (ptKeys.has(k)) return; ptKeys.add(k); points.push({ ri, x, fy }); };

    const start = rooms[0].spawn; addNode({ ri: 0, x: start.x, fy: start.y, wet: 0 });

    const envOf = (ri: number, m: MoveState) => {
      const r = rooms[ri]; const w = waters[ri]; const b = m.body; const cx = b.x + b.w / 2;
      const at = (x: number, y: number) => { const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE); return tx >= 0 && ty >= 0 && tx < r.w && ty < r.h && w[ty * r.w + tx] === 1; };
      return { g: g0, water: at(cx, b.y + b.h / 2), head: at(cx, b.y + 6), lip: !at(cx, b.y - 12) };
    };
    /** krok symulacji z rachunkiem powietrza; zwraca false, gdy zapas powietrza przekroczony */
    const stepW = (m: MoveState, inp: MoveInput, ri: number, st: { wet: number }): boolean => {
      const env = envOf(ri, m);
      stepMovement(m, inp, grids[ri], DT, env);
      st.wet = env.head ? st.wet + DT : Math.max(0, st.wet - AIR_REFILL * DT);
      return st.wet <= WET_LIMIT;
    };
    const mk = (n: Node, st: { wet: number }): MoveState => {
      const m = newMove(brother, n.x, n.fy); st.wet = n.wet;
      for (let i = 0; i < 4; i++) stepMovement(m, blank(), grids[n.ri], DT, envOf(n.ri, m));
      return m;
    };
    const endNode = (ri: number, m: MoveState, st: { wet: number }): Node => { const b = m.body; return { ri, x: b.x + b.w / 2, fy: b.y + b.h, wet: st.wet, sw: !b.onGround && m.swimming }; };

    /** wykonuje plan; zwraca węzeł końcowy (stoi na ziemi / pływa) lub null (przepaść, kolce, obrażenia, nie wylądował) */
    const sim = (n: Node, plan: { pre?: { dir: -1 | 1; frames: number; run: boolean }; dir: -1 | 0 | 1; run?: boolean; jump?: boolean; hold?: number; drop?: boolean; maxFrames?: number }): Node | null => {
      const st = { wet: 0 }; const g = grids[n.ri]; const m = mk(n, st); const b = m.body; const room = rooms[n.ri];
      const rec = () => addPt(n.ri, b.x + b.w / 2, b.y + b.h);
      const step = (inp: MoveInput): boolean => {
        if (!stepW(m, inp, n.ri, st)) return false; rec();
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
          if (airborne && m.swimming && !b.onGround && i > 10) return endNode(n.ri, m, st);     // wpadł do wody
          if (airborne && (b.onGround || m.climbing) && !m.ledge && !m.hang) { after++; if (after > 3) break; } else after = 0;
          if (i === maxF - 1) return null;
        }
        if (!b.onGround) return null;
        return endNode(n.ri, m, st);
      }
      return null;
    };

    const walk = (n: Node, dir: -1 | 1, run: boolean, release: boolean): void => {
      const st = { wet: 0 }; const g = grids[n.ri]; const m = mk(n, st); const b = m.body; const room = rooms[n.ri];
      let lastX = b.x; let frames = 0; let left = false;
      while (frames < 1800) {
        const inp = blank(); if (dir > 0) inp.right = true; else inp.left = true; inp.run = run;
        if (left && release) { inp.right = inp.left = false; }
        if (!stepW(m, inp, n.ri, st)) return; frames++;
        addPt(n.ri, b.x + b.w / 2, b.y + b.h);
        if (b.y > room.h * TILE + 40) return;
        if (touchesTile(g, b.x + 3, b.y + 3, b.w - 6, b.h - 4, T.HAZARD)) return;
        if (m.landKind === 'damage') return;
        if (!b.onGround) left = true;
        if (m.swimming && !b.onGround && frames > 6 && left) { addNode(endNode(n.ri, m, st)); return; }     // zszedł do wody — dalej płynie
        if (b.onGround && !m.ledge) {
          if (Math.abs(b.x - lastX) >= 6 || left) { lastX = b.x; addNode(endNode(n.ri, m, st)); left = false; }
          if (b.hitWall && Math.abs(b.vx) < 0.5) return;
        }
        if (m.climbing) return;
      }
    };

    const climb = (n: Node, up: boolean): void => {
      const st = { wet: 0 }; const g = grids[n.ri]; void g; const m = mk(n, st); const b = m.body; let climbed = false;
      for (let i = 0; i < 700; i++) {
        const inp = blank(); if (up) inp.up = true; else inp.down = true;
        if (!stepW(m, inp, n.ri, st)) return; addPt(n.ri, b.x + b.w / 2, b.y + b.h);
        if (m.climbing) climbed = true;
        if (climbed && !m.climbing && b.onGround) { addNode(endNode(n.ri, m, st)); return; }
        if (!climbed && i > 20) return;
      }
    };

    /** pływanie: 8 kierunków po 0,4 s od zerowej prędkości (konserwatywnie) + dryf w górę */
    const SWIM_DIRS: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1], [0, 0]];
    const swim = (n: Node): void => {
      for (const [dx, dy] of SWIM_DIRS) {
        const st = { wet: 0 }; const m = mk(n, st); const b = m.body; const room = rooms[n.ri]; let ok = true;
        for (let i = 0; i < 24; i++) {
          const inp = blank(); inp.left = dx < 0; inp.right = dx > 0; inp.up = dy < 0; inp.down = dy > 0;
          if (!stepW(m, inp, n.ri, st)) { ok = false; break; }
          addPt(n.ri, b.x + b.w / 2, b.y + b.h);
          if (b.y > room.h * TILE + 40 || touchesTile(grids[n.ri], b.x + 3, b.y + 3, b.w - 6, b.h - 4, T.HAZARD)) { ok = false; break; }
        }
        if (ok) addNode(endNode(n.ri, m, st));
      }
    };
    /** wyskok z wody przy powierzchni (opcjonalnie z kierunkiem) — kończy na stałym gruncie */
    const surfaceJump = (n: Node, dir: -1 | 0 | 1): void => {
      const st = { wet: 0 }; const m = mk(n, st); const b = m.body; const room = rooms[n.ri];
      if (!envOf(n.ri, m).lip) return;
      for (let i = 0; i < 150; i++) {
        const inp = blank(); if (dir > 0) inp.right = true; else if (dir < 0) inp.left = true;
        if (i === 0) { inp.jumpPressed = true; inp.jumpHeld = true; } else if (i < 30) inp.jumpHeld = true;
        if (!stepW(m, inp, n.ri, st)) return; addPt(n.ri, b.x + b.w / 2, b.y + b.h);
        if (b.y > room.h * TILE + 40 || touchesTile(grids[n.ri], b.x + 3, b.y + 3, b.w - 6, b.h - 4, T.HAZARD) || m.landKind === 'damage') return;
        if (i > 10 && b.onGround && !m.swimming && !m.ledge && !m.hang) { addNode(endNode(n.ri, m, st)); return; }
      }
    };

    const nearLadder = (n: Node): boolean => {
      const r = rooms[n.ri]; const tx0 = Math.floor((n.x - 40) / TILE), tx1 = Math.floor((n.x + 40) / TILE), ty0 = Math.floor((n.fy - 90) / TILE), ty1 = Math.floor(n.fy / TILE);
      for (let y = Math.max(0, ty0); y <= Math.min(r.h - 1, ty1); y++) for (let x = Math.max(0, tx0); x <= Math.min(r.w - 1, tx1); x++) if (r.tiles[y * r.w + x] === T.LADDER) return true;
      return false;
    };
    const nearWater = (n: Node): boolean => {
      const r = rooms[n.ri]; const w = waters[n.ri]; const tx0 = Math.floor((n.x - 70) / TILE), tx1 = Math.floor((n.x + 70) / TILE), ty0 = Math.floor((n.fy - 110) / TILE), ty1 = Math.floor((n.fy + 20) / TILE);
      for (let y = Math.max(0, ty0); y <= Math.min(r.h - 1, ty1); y++) for (let x = Math.max(0, tx0); x <= Math.min(r.w - 1, tx1); x++) if (w[y * r.w + x]) return true;
      return false;
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
      if (n.sw) {
        // węzeł pływający: tylko pływanie, wyskok z wody i drabiny
        swim(n); for (const dir of [-1, 0, 1] as const) surfaceJump(n, dir);
        if (nearLadder(n)) climb(n, true);
        continue;
      }
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
      if (nearLadder(n)) { climb(n, true); climb(n, false); }
      // pływanie z miejsca stania w wodzie (brodzenie) lub na brzegu
      if (hasWater[n.ri] && nearWater(n)) { swim(n); for (const dir of [-1, 0, 1] as const) surfaceJump(n, dir); }
      // drzwi
      for (const d of doors) if (d.ri === n.ri && Math.abs(d.x - n.x) < 26 && Math.abs(d.fy - n.fy) < 8 && d.dest) addNode({ ri: d.dest.room, x: d.dest.x, fy: d.dest.y, wet: 0 });
      // windy: koniec ruchu osiągalny z drugiego końca
      for (const l of lifts) if (l.ri === n.ri) {
        const onA = Math.abs(n.x - l.x0) < l.w / 2 + 22 && Math.abs(n.fy - l.y0) < 6, onB = Math.abs(n.x - l.x1) < l.w / 2 + 22 && Math.abs(n.fy - l.y1) < 6;
        if (onA) addNode({ ri: l.ri, x: l.x1, fy: l.y1, wet: n.wet });
        if (onB) addNode({ ri: l.ri, x: l.x0, fy: l.y0, wet: n.wet });
      }
    }
  };

  // iteruj: przełączniki osiągalne → bramy otwarte / zawory przełączone → ponowna analiza
  for (let it = 0; it < 8; it++) {
    run();
    let changed = false;
    rooms.forEach((r, ri) => {
      for (const s of r.specs) if (s.t === 'switch' && !s.id.endsWith(':sun') && !switchesOn.has(`${ri}:${s.id}`)) {
        if (points.some((p) => p.ri === ri && Math.abs(p.x - s.x) < 34 && Math.abs(p.fy - s.y) < 44)) { switchesOn.add(`${ri}:${s.id}`); changed = true; }
      }
      for (const s of r.specs) if (s.t === 'gate' && !openGates.has(`${ri}:${s.id}`)) {
        const n = r.specs.filter((q) => q.t === 'switch' && q.gate === s.id && switchesOn.has(`${ri}:${q.id}`)).length;
        if (n >= s.need) { openGates.add(`${ri}:${s.id}`); changed = true; }
      }
      for (const s of r.specs) if ((s.t === 'flood' || s.t === 'span') && !openFloods.has(`${ri}:${s.gate}`)) {
        const all = r.specs.filter((q): q is Extract<Spec, { t: 'switch' }> => q.t === 'switch' && q.gate === s.gate);
        if (all.length && all.every((q) => switchesOn.has(`${ri}:${q.id}`))) { openFloods.add(`${ri}:${s.gate}`); changed = true; }
      }
    });
    if (!changed) break;
  }
  return {
    nodes, points, openGates, switchesOn, openFloods, maxWet,
    reaches: (ri, x, fy, dx = 36, dy = 24) => points.some((p) => p.ri === ri && Math.abs(p.x - x) < dx && Math.abs(p.fy - fy) < dy),
    touches: (ri, x, y, r) => points.some((p) => p.ri === ri && Math.hypot(p.x - x, p.fy - bp.hitH / 2 - y) < r),
  };
}
