import { getLevel } from '../src/game/levels';
const l: any = getLevel(process.argv[2] ?? 'W2-L3');
const x0 = +process.argv[3], x1 = +process.argv[4];
for (const s of l.rooms[0].specs ?? []) if (s.x >= x0 * 32 && s.x <= x1 * 32 && s.t !== 'enemy' && s.t !== 'item') console.log(JSON.stringify(s));
