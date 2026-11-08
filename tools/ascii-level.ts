/** Podgląd poziomu jako ASCII: npx tsx tools/ascii-level.ts W1-L1 [x0] [szerokość] */
import { getLevel } from '../src/game/levels';
import { T } from '../src/game/types';

const CH: Record<number, string> = {
  [T.EMPTY]: ' ', [T.SOLID]: '#', [T.ONEWAY]: '=', [T.HAZARD]: 'x', [T.LADDER]: 'H', [T.CRUMBLE]: 'c', [T.CONVL]: '<', [T.CONVR]: '>', [T.CRACKED]: 'C', [T.CABLE]: 'Y', [T.GATE]: '!',
  [T.SL_R45]: '/', [T.SL_L45]: '\\', [T.SL_R26A]: '/', [T.SL_R26B]: '/', [T.SL_L26A]: '\\', [T.SL_L26B]: '\\', [T.SPRING_U]: '^', [T.SPRING_R]: '}', [T.SPRING_L]: '{',
  [T.CLIMB]: '%', [T.ROPE]: '|', [T.ICE]: 'i', [T.OIL]: 'o', [T.SAND]: 's', [T.PLATFORM_BREAK]: 'b',
};
export function ascii(id: string, x0 = 0, wd = 120, room = 0): string {
  const L = getLevel(id); const r = L.rooms[room];
  const rows: string[][] = [];
  for (let y = 0; y < r.h; y++) { const row: string[] = []; for (let x = x0; x < Math.min(r.w, x0 + wd); x++) row.push(CH[r.tiles[y * r.w + x]] ?? '?'); rows.push(row); }
  const put = (px: number, py: number, c: string) => { const x = Math.floor(px / 32) - x0, y = Math.floor((py - 1) / 32); if (rows[y] && x >= 0 && x < wd) rows[y][x] = c; };
  for (const s of r.specs) {
    if (s.t === 'statue') put(s.x, s.y - 4, 'S'); else if (s.t === 'checkpoint') put(s.x, s.y - 4, 'K'); else if (s.t === 'exit') put(s.x, s.y - 4, 'E');
    else if (s.t === 'enemy') put(s.x, s.y - 4, 'e'); else if (s.t === 'item') put(s.x, s.y, s.k === 'golden' ? 'G' : '*'); else if (s.t === 'crate') put(s.x + 8, s.y + 8, 'B');
    else if (s.t === 'platform') put(s.x, s.y, 'P');
  }
  return rows.map((r2, i) => String(i).padStart(2) + ' ' + r2.join('').replace(/\s+$/, '')).join('\n');
}
if (process.argv[1]?.endsWith('ascii-level.ts')) {
  const [id, a, b] = process.argv.slice(2); console.log(ascii(id, +(a ?? 0), +(b ?? 120)));
}
