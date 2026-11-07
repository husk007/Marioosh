// Wycinanie tła ze sprite'ów generowanych przez AI (model nie zwraca prawdziwej przezroczystości).
// Tryby wykrywane z rogów obrazu: (a) tło w kolorze klucza (płaski zielony/magenta), (b) „namalowana” szachownica (jasne, neutralne kwadraty).
// Flood-fill od krawędzi (wnętrze postaci jest chronione obrysem), potem miękka krawędź + despill koloru klucza.
import { PNG } from 'pngjs';

const dist = (r, g, b, k) => Math.hypot(r - k[0], g - k[1], b - k[2]);
const sat = (r, g, b) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b); return mx === 0 ? 0 : (mx - mn) / mx; };

export function cutout(buf, key /* [r,g,b] lub null */) {
  const png = PNG.sync.read(buf), { width: W, height: H, data: d } = png;
  const px = (x, y) => (y * W + x) * 4;
  // wykrycie trybu po rogach
  const corners = [[2, 2], [W - 3, 2], [2, H - 3], [W - 3, H - 3]].map(([x, y]) => d.slice(px(x, y), px(x, y) + 3));
  const nearKey = key && corners.filter((c) => dist(c[0], c[1], c[2], key) < 90).length >= 3;
  const checker = !nearKey && corners.every((c) => sat(c[0], c[1], c[2]) < 0.12 && Math.min(c[0], c[1], c[2]) > 205);
  if (!nearKey && !checker) return { buf, mode: 'none' };
  const isBg = nearKey
    ? (i) => dist(d[i], d[i + 1], d[i + 2], key) < 80
    : (i) => sat(d[i], d[i + 1], d[i + 2]) < 0.1 && Math.min(d[i], d[i + 1], d[i + 2]) > 205;
  const bg = new Uint8Array(W * H), st = [];
  const push = (x, y) => { const p = y * W + x; if (!bg[p] && isBg(p * 4)) { bg[p] = 1; st.push(p); } };
  for (let x = 0; x < W; x++) { push(x, 0); push(x, H - 1); }
  for (let y = 0; y < H; y++) { push(0, y); push(W - 1, y); }
  while (st.length) { const p = st.pop(), x = p % W, y = (p / W) | 0; if (x > 0) push(x - 1, y); if (x < W - 1) push(x + 1, y); if (y > 0) push(x, y - 1); if (y < H - 1) push(x, y + 1); }
  // zamknięte „dziury” w kolorze klucza (np. między rogami/nogami)
  if (nearKey) for (let p = 0; p < W * H; p++) if (!bg[p] && dist(d[p * 4], d[p * 4 + 1], d[p * 4 + 2], key) < 45) bg[p] = 1;
  // alfa: tło=0; piksele przy tle: miękka krawędź (1 px) + despill
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const p = y * W + x, i = p * 4;
    if (bg[p]) { d[i + 3] = 0; continue; }
    let near = false;
    for (let dy = -1; dy <= 1 && !near; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < W && yy < H && bg[yy * W + xx]) { near = true; break; } }
    if (near) {
      d[i + 3] = 170;
      if (nearKey) { // despill: wytnij nadmiar koloru klucza
        if (key[1] > key[0] && key[1] > key[2]) d[i + 1] = Math.min(d[i + 1], Math.max(d[i], d[i + 2]));
        else { const m = Math.min(d[i], d[i + 2]); d[i] = Math.min(d[i], Math.max(d[i + 1], m) + 20); d[i + 2] = Math.min(d[i + 2], Math.max(d[i + 1], m) + 20); }
      }
    }
  }
  return { buf: PNG.sync.write(png), mode: nearKey ? 'key' : 'checker' };
}
