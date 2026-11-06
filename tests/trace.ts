import { runBot } from './bot';
const id = process.argv[2] ?? 'W2-L1';
let lastRi = 0;
const r = runBot(id, +(process.argv[3] ?? 60), +(process.argv[4] ?? 0), (w, t) => {
  if (w.ri !== lastRi) { const b = w.players[0].mv.body; console.log('ROOM', lastRi, '->', w.ri, 't', t.toFixed(1), 'x', (b.x/32).toFixed(1), 'y', (b.y/32).toFixed(1)); lastRi = w.ri; }
});
console.log(JSON.stringify(r));
