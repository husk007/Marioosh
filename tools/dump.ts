import { getLevel } from '../src/game/levels';
const l: any = getLevel(process.argv[2] ?? 'W2-L3');
l.rooms.forEach((r: any, i: number) => { console.log(i, r.id ?? r.kind, r.w, r.h, 'bossArena', !!r.bossArena); for (const s of r.specs ?? r.objects ?? []) if (s.t === 'cable') console.log('  cable', JSON.stringify(s)); });
