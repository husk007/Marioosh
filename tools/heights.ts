import { getLevel, LEVEL_IDS } from '../src/game/levels';
import { T } from '../src/game/types';
const SUP = new Set<number>([T.SOLID, T.ONEWAY, T.CRUMBLE, T.CONVL, T.CONVR, T.CRACKED]);
let worst: any[] = [];
for (const id of LEVEL_IDS) {
  const L: any = getLevel(id);
  L.rooms.forEach((r: any, ri: number) => {
    for (const s of r.specs) {
      if (s.t !== 'item' && s.t !== 'crate') continue;
      const cx = Math.floor(s.x / 32); const y0 = s.t === 'crate' ? s.y : s.y; // crate y = top-left? print both
      let best = 9999;
      for (const dx of [-1, 0, 1]) {
        const c = cx + dx; if (c < 0 || c >= r.w) continue;
        for (let row = Math.max(0, Math.floor(y0 / 32)); row < r.h; row++) {
          if (SUP.has(r.tiles[row * r.w + c])) { best = Math.min(best, row * 32 - y0); break; }
        }
      }
      worst.push({ id, ri, room: r.name, k: s.k, t: s.t, x: s.x, y: s.y, h: best });
    }
  });
}
worst.sort((a, b) => b.h - a.h);
const lim = Number(process.argv[2] ?? 110);
const bad = worst.filter((w) => w.h > lim && w.h < 9999 && w.t === 'item'); console.log('over gaps:', worst.filter((w) => w.h === 9999 && w.t === 'item').length);
console.log('items above', lim, ':', bad.length, 'of', worst.filter((w) => w.t === 'item').length);
const byLevel: Record<string, number> = {}; for (const b of bad) byLevel[b.id + ':' + b.room] = (byLevel[b.id + ':' + b.room] ?? 0) + 1;
console.log(byLevel);
console.log(bad.filter((b) => b.room === 'main').map((b) => `${b.id} ${b.k} x=${b.x} y=${b.y} h=${b.h}`).join('\n'));
const cr = worst.filter((w) => w.t === 'crate'); console.log('crate max', cr.slice(0, 3));
