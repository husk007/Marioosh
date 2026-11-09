import { it, expect } from 'vitest';
import { getLevel } from '../src/game/levels';
import { traceBeams, decorCell } from '../src/game/beam';
import { T, type Spec } from '../src/game/types';
import { analyze } from './reach';

/** W3-L3: zagadka promienia — dokładnie jedno ustawienie luster zapala panel, wyjściowe go nie zapala, a lustra są osiągalne dla obu braci */
function setup() {
  const L = structuredClone(getLevel('W3-L3')); const r = L.rooms[0];
  const tiles = r.tiles.slice(); // bramy zamknięte, jak na starcie
  const decor = r.specs.filter((s): s is Extract<Spec, { t: 'decor' }> => s.t === 'decor').map((s) => ({ k: s.k, x: s.x, y: s.y, state: 0 }));
  const panel = r.specs.find((s): s is Extract<Spec, { t: 'switch' }> => s.t === 'switch' && s.id.endsWith(':sun'))!;
  const cell = Math.floor((panel.y - 1) / 32) * r.w + Math.floor(panel.x / 32);
  const mirrors = decor.filter((d) => d.k === 'lmirror');
  const lit = (d: typeof decor) => traceBeams({ w: r.w, h: r.h, tiles, decor: d }).hit.has(cell);
  return { L, r, decor, mirrors, lit, panel };
}

it('W3-L3: promień nie trafia w panel przy stanie początkowym, a jedno ustawienie luster go zapala', () => {
  const { decor, mirrors, lit } = setup();
  expect(mirrors.length).toBe(3);
  expect(lit(decor)).toBe(false);
  const sol: number[][] = [];
  for (let m = 0; m < 8; m++) { mirrors.forEach((d, i) => { d.state = (m >> i) & 1; }); if (lit(decor)) sol.push(mirrors.map((d) => d.state)); }
  expect(sol).toEqual([[1, 1, 1]]);
});

it('W3-L3: bez któregokolwiek z luster promień nie dosięga panelu', () => {
  for (let skip = 0; skip < 3; skip++) {
    const { decor, mirrors, lit } = setup();
    const kept = decor.filter((d) => d !== mirrors[skip]);
    let any = false;
    for (let m = 0; m < 4; m++) { const ms = kept.filter((d) => d.k === 'lmirror'); ms.forEach((d, i) => { d.state = (m >> i) & 1; }); if (lit(kept)) any = true; }
    expect(any, 'bez lustra ' + skip).toBe(false);
  }
});

it('W3-L3: lustra osiągalne dla Marioosha i Darioosha, a brama g1 otwiera się korbą na dachu; bez korby i bez drabiny na dach — nie', () => {
  const { L, mirrors } = setup();
  for (const b of ['M', 'D'] as const) {
    const a = analyze(L, b);
    for (const m of mirrors) expect(a.points.some((p) => p.ri === 0 && Math.abs(p.x - m.x) < 46 && Math.abs(p.fy - m.y) < 50), `${b} lustro @${decorCell(m)}`).toBe(true);
    expect(a.openGates.has('0:g1'), b).toBe(true);
  }
  const L2 = structuredClone(L); L2.rooms[0].specs = L2.rooms[0].specs.filter((s) => !(s.t === 'switch' && s.id.endsWith(':crank')));
  const a2 = analyze(L2, 'M'); const ex = L2.rooms[0].specs.find((s) => s.t === 'exit')!;
  expect(a2.openGates.has('0:g1')).toBe(false); expect(a2.reaches(0, ex.x, ex.y, 40, 10)).toBe(false);
  const L3 = structuredClone(L); const r = L3.rooms[0]; for (let y = 10; y <= 19; y++) r.tiles[y * r.w + 98] = T.EMPTY;
  const a3 = analyze(L3, 'D'); expect(a3.openGates.has('0:g1')).toBe(false);
}, 400000);
