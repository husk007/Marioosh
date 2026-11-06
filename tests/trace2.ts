import { runBot } from './bot';
const id = process.argv[2] ?? 'W2-L2'; const x0 = +process.argv[3], x1 = +process.argv[4]; let n = 0;
runBot(id, 40, 0, (w, t) => {
  const b = w.players[0].mv.body; const tx = b.x / 32;
  if (tx > x0 && tx < x1 && n++ % 6 === 0) console.log(t.toFixed(2), 'x', tx.toFixed(2), 'feet', (b.y + b.h).toFixed(0), 'vx', b.vx | 0, 'vy', b.vy | 0, b.onGround ? 'G' : 'A', 'ri', w.ri, w.rt.cables.filter(c => Math.abs(c.tx - tx) < 6).map(c => `${c.color}@${c.tx},${c.ty}`).join(' '));
});
