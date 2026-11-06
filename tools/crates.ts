import { getLevel, LEVEL_IDS } from '../src/game/levels';
import { T } from '../src/game/types';
import { BROTHERS, GRAVITY, PICKUP_RADIUS } from '../src/game/constants';
const SUP = new Set<number>([T.SOLID, T.ONEWAY, T.CRUMBLE, T.CONVL, T.CONVR, T.CRACKED]);
const apex = BROTHERS.M.jump ** 2 / (2 * GRAVITY); const LIMIT = Math.floor(apex + BROTHERS.M.hitH / 2 + PICKUP_RADIUS) - 16;
console.log('apex', apex.toFixed(1), 'LIMIT', LIMIT);
let n = 0, bad = 0, badOpen = 0;
for (const id of LEVEL_IDS) (getLevel(id) as any).rooms.forEach((r: any, ri: number) => {
  for (const s of r.specs) { if (s.t !== 'crate') continue; n++;
    const tx = Math.floor(s.x / 32), ty = Math.floor(s.y / 32); const itemY = ty * 32 - 10;
    const below = (cols: number[], from: number, skipCrate: boolean) => { let best = Infinity; for (const c of cols) { if (c < 0 || c >= r.w) continue; for (let row = from; row < r.h; row++) { if (skipCrate && c === tx && row === ty) continue; if (SUP.has(r.tiles[row * r.w + c])) { best = Math.min(best, row * 32); break; } } } return best; };
    const open = below([tx], ty + 1, true) - (ty + 1) * 32;           // odległość od podłoża do spodu skrzynki
    const pick = below([tx - 1, tx, tx + 1], Math.floor(itemY / 32), true) - itemY;
    const flag = pick > LIMIT || open > 100;
    if (pick > LIMIT) bad++; if (open > 100) badOpen++;
    if (flag) console.log(`${id}#${ri} ${r.name} ${s.k}${s.hidden ? '(hid)' : ''} tx=${tx} ty=${ty} open=${open} pick=${pick}`);
  } });
console.log({ n, badPick: bad, badOpen });
