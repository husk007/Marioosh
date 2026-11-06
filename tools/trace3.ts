import { runBot } from '../tests/bot';
const id = process.argv[2], T0 = +process.argv[3]; let done = false;
runBot(id, T0 + 1, 0, (w, t) => {
  if (!done && t > T0) { done = true; const b = w.players[0].mv.body;
    console.log('body', JSON.stringify(b));
    console.log('enemies', w.rt.enemies.filter(e => Math.abs(e.b.x - b.x) < 250).map(e => `${e.kind}@${(e.b.x/32).toFixed(1)},${(e.b.y/32).toFixed(1)} ${e.b.w}x${e.b.h} dead=${e.dead}`));
    console.log('plats', w.rt.plats.filter(p => Math.abs(p.x - b.x) < 300).map(p => `${p.x|0},${p.y|0} w${p.w} solid=${p.solid}`));
    console.log('gates', w.rt.gates.map(g => `${g.id} open=${g.open}`));
  }
});
