import { getLevel } from '../src/game/levels';
const [id, x0, x1] = [process.argv[2], +process.argv[3], +process.argv[4]];
const r: any = getLevel(id).rooms[0];
for (let y = 0; y < Math.min(r.h, +(process.argv[5] ?? 16)); y++) { let s = String(y).padStart(2) + ' '; for (let x = x0; x <= x1; x++) s += '.#=!HC><X+G'[r.tiles[y * r.w + x]] ?? '?'; console.log(s); }
console.log(r.specs.filter((s: any) => s.t === 'item' && s.x / 32 >= x0 && s.x / 32 <= x1 + 1).map((s: any) => `${s.k}@${Math.floor(s.x / 32)},${(s.y / 32).toFixed(2)}`).join(' '));
