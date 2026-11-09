import { it } from 'vitest';
import { writeFileSync } from 'fs';
import { getLevel } from '../src/game/levels';
import { analyze } from './reach';
it('d', () => {
  const id = process.env.LVL ?? 'W3-L1'; const x0 = +(process.env.X0 ?? 0), x1 = +(process.env.X1 ?? 999), br = (process.env.BR ?? 'M') as 'M' | 'D';
  const L = getLevel(id); const a = analyze(L, br); const r = L.rooms[0];
  const m = new Map<number, number[]>();
  for (const p of a.points) if (p.x >= x0 * 32 && p.x <= x1 * 32) { const row = Math.round(p.fy / 32); const v = m.get(row) ?? []; v.push(p.x / 32); m.set(row, v); }
  const rows = [...m.entries()].sort((p, q) => p[0] - q[0]).map(([row, v]) => `${row}: ${Math.min(...v).toFixed(1)}..${Math.max(...v).toFixed(1)} (${v.length})`);
  const y0 = +(process.env.Y0 ?? 0), y1 = +(process.env.Y1 ?? r.h - 1); const map: string[] = [];
  for (let y = y0; y <= y1; y++) { let s = String(y).padStart(2) + ' '; for (let x = Math.max(0, x0); x <= Math.min(r.w - 1, x1); x++) s += '.#=^HcPCoin<>()[]g'[0] === undefined ? '' : (['.', '#', '=', '^', 'H', 'c', '~', '~', '<', '>', 'g'][r.tiles[y * r.w + x]] ?? 'x'); map.push(s); }
  writeFileSync('/tmp/dbg.txt', rows.join('\n') + '\n' + map.join('\n'));
}, 200000);
