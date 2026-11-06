/**
 * „Stylizator”: zamienia sprite narysowany pikselowo (1×) na obraz ilustrowany w podwójnej rozdzielczości:
 *  1) wygładzanie krawędzi algorytmem Scale2x (bez rozmywania wnętrza),
 *  2) światło z lewej-góry (fazowanie krawędzi), łagodny gradient pionowy i ciepły refleks,
 *  3) delikatnie zmiękczony kontur.
 */
import { SS, makeCanvas, type Img } from '../engine/gfx';

export function stylize(src: Img, opt: { bevel?: number; soft?: boolean } = {}): Img {
  const W = src.width, H = src.height, W2 = W * SS, H2 = H * SS;
  const sg = src.getContext('2d', { willReadFrequently: true })!;
  const s32 = new Uint32Array(sg.getImageData(0, 0, W, H).data.buffer.slice(0));
  const C = (x: number, y: number): number => (x < 0 || y < 0 || x >= W || y >= H ? 0 : s32[y * W + x]);
  const o32 = new Uint32Array(W2 * H2);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const P = C(x, y), A = C(x, y - 1), B = C(x + 1, y), L = C(x - 1, y), D = C(x, y + 1);
    const i = y * 2 * W2 + x * 2;
    o32[i] = L === A && L !== D && A !== B ? A : P;
    o32[i + 1] = A === B && A !== L && B !== D ? B : P;
    o32[i + W2] = D === L && D !== B && L !== A ? L : P;
    o32[i + W2 + 1] = B === D && B !== A && D !== L ? D : P;
  }
  const px = new Uint8ClampedArray(o32.buffer);
  // maska alfa i jej rozmycie (do oświetlenia krawędzi)
  const a = new Float32Array(W2 * H2); for (let i = 0; i < a.length; i++) a[i] = px[i * 4 + 3] > 8 ? 1 : 0;
  const bl = new Float32Array(W2 * H2); const R = 2;
  for (let y = 0; y < H2; y++) for (let x = 0; x < W2; x++) { let s = 0, n = 0; for (let dy = -R; dy <= R; dy++) { const yy = y + dy; if (yy < 0 || yy >= H2) { n += 2 * R + 1; continue; } for (let dx = -R; dx <= R; dx++) { const xx = x + dx; n++; if (xx >= 0 && xx < W2) s += a[yy * W2 + xx]; } } bl[y * W2 + x] = s / n; }
  const k = opt.bevel ?? 0.55;
  for (let y = 0; y < H2; y++) for (let x = 0; x < W2; x++) {
    const i = y * W2 + x; if (!a[i]) continue;
    const j = i * 4;
    const isOutline = px[j] < 40 && px[j + 1] < 32 && px[j + 2] < 50;
    if (isOutline) { px[j + 3] = 230; continue; }
    const tl = bl[Math.max(0, y - 2) * W2 + Math.max(0, x - 2)], br = bl[Math.min(H2 - 1, y + 2) * W2 + Math.min(W2 - 1, x + 2)];
    let m = 1 + Math.max(-0.28, Math.min(0.3, (br - tl) * k));         // br>tl: krawędź zwrócona do światła
    m *= 1.07 - 0.14 * (y / H2);
    px[j] = Math.max(0, Math.min(255, px[j] * m + (m > 1 ? (m - 1) * 40 : 0)));
    px[j + 1] = Math.max(0, Math.min(255, px[j + 1] * m + (m > 1 ? (m - 1) * 34 : 0)));
    px[j + 2] = Math.max(0, Math.min(255, px[j + 2] * m * (m < 1 ? 1.02 : 1)));
  }
  const out = makeCanvas(W2, H2) as Img; out.ss = SS;
  const og = out.getContext('2d')!;
  og.putImageData(new ImageData(px, W2, H2), 0, 0);
  if (opt.soft !== false && 'filter' in og) {
    const t = makeCanvas(W2, H2); const tg = t.getContext('2d')!;
    (tg as CanvasRenderingContext2D & { filter: string }).filter = 'blur(0.45px)'; tg.drawImage(out, 0, 0);
    og.clearRect(0, 0, W2, H2); og.drawImage(t, 0, 0);
  }
  return out;
}
