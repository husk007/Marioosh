import { getLevel } from '../src/game/levels';
const id = process.argv[2] ?? 'W2-L1'; const x0 = +(process.argv[3] ?? 30), x1 = +(process.argv[4] ?? 70);
const L = getLevel(id); const r = L.rooms[0];
const sym = ['.', '#', '=', '^', 'H', 'c', '<', '>', 'x', 'C', 'G'];
console.log(id, L.mode, 'w', r.w, 'h', r.h, 'spawn', r.spawn);
for (let y = 0; y < r.h; y++) { let s = String(y).padStart(2) + ' '; for (let x = x0; x < Math.min(r.w, x1); x++) { let ch = sym[r.tiles[y * r.w + x]] ?? '?'; for (const sp of r.specs) { if ('x' in sp && 'y' in sp) { const tx = Math.floor(sp.x / 32), ty = Math.floor((sp.y - (sp.t === 'enemy' || sp.t === 'statue' || sp.t === 'switch' || sp.t === 'checkpoint' || sp.t === 'exit' ? 1 : 0)) / 32); if (tx === x && ty === y) ch = sp.t === 'enemy' ? 'E' : sp.t === 'switch' ? 'S' : sp.t === 'statue' ? 'T' : sp.t === 'item' ? 'o' : sp.t === 'platform' ? 'P' : sp.t === 'cable' ? 'C' : sp.t === 'gate' ? 'G' : sp.t === 'checkpoint' ? 'K' : ch; } } if (r.water[y * r.w + x] && ch === '.') ch = '~'; s += ch; } console.log(s); }
console.log('x  ' + Array.from({ length: x1 - x0 }, (_, i) => ((x0 + i) % 10)).join(''));
console.log(r.specs.filter((s) => s.t === 'platform' || s.t === 'gate' || s.t === 'switch').map((s) => JSON.stringify(s)).slice(0, 12).join('\n'));
