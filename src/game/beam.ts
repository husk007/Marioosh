/**
 * Promień światła (W3-L3 „Słoneczne Ogrody”): źródło `sun_r/l/u/d` wysyła promień po siatce kafli; lustro `lmirror`
 * (stan 0 = „/”, stan 1 = „\”) zawraca go o 90°. Promień przechodzi przez puste kafle, półki jednokierunkowe i drabiny,
 * kończy się na litym kaflu lub zamkniętej bramie. Czysta funkcja (bez zależności od świata), więc testy mogą szukać rozwiązań.
 */
import { T } from './types';

export interface BeamIn { w: number; h: number; tiles: ArrayLike<number>; decor: { k: string; x: number; y: number; state: number }[] }
export interface BeamOut { cells: [number, number, number, number][]; hit: Set<number> }

const DIRS: Record<string, [number, number]> = { sun_r: [1, 0], sun_l: [-1, 0], sun_u: [0, -1], sun_d: [0, 1] };
const PASS = new Set<number>([T.EMPTY, T.ONEWAY, T.LADDER, T.CLIMB, T.ROPE]);

/** kafel (kolumna, wiersz), którego dotyczy element: źródło stoi w swoim kaflu, lustro zajmuje kafel nad kaflem „stóp” */
export const decorCell = (d: { k: string; x: number; y: number }): [number, number] => [Math.floor(d.x / 32), Math.floor((d.y - 1) / 32) - (d.k === 'lmirror' ? 1 : 0)];

export function traceBeams(b: BeamIn): BeamOut {
  const mir = new Map<number, number>();
  for (const d of b.decor) if (d.k === 'lmirror') { const [x, y] = decorCell(d); mir.set(y * b.w + x, d.state); }
  const cells: [number, number, number, number][] = []; const hit = new Set<number>();
  for (const d of b.decor) {
    const dir = DIRS[d.k]; if (!dir) continue;
    let [x, y] = decorCell(d); let [dx, dy] = dir;
    for (let step = 0; step < 400; step++) {
      if (x < 0 || y < 0 || x >= b.w || y >= b.h || !PASS.has(b.tiles[y * b.w + x])) break;
      const k = y * b.w + x; cells.push([x, y, dx, dy]); hit.add(k);
      const m = mir.get(k);
      if (m !== undefined) [dx, dy] = m === 0 ? [-dy, -dx] : [dy, dx];
      x += dx; y += dy;
    }
  }
  return { cells, hit };
}
