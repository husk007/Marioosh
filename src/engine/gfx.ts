import { VH, VW } from '../game/constants';

export type Img = HTMLCanvasElement;

export function makeCanvas(w: number, h: number): Img {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  return c;
}

/** Mały „malarz pikseli” — rysuje bez antyaliasingu na kanwie 1:1. */
export class Pix {
  readonly c: Img;
  readonly g: CanvasRenderingContext2D;
  constructor(public w: number, public h: number) {
    this.c = makeCanvas(w, h);
    this.g = this.c.getContext('2d', { willReadFrequently: true })!;
    this.g.imageSmoothingEnabled = false;
  }
  r(x: number, y: number, w: number, h: number, col: string): this {
    this.g.fillStyle = col; this.g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); return this;
  }
  p(x: number, y: number, col: string): this { return this.r(x, y, 1, 1, col); }
  /** wypełniona elipsa, krawędzie pikselowe */
  e(cx: number, cy: number, rx: number, ry: number, col: string): this {
    this.g.fillStyle = col;
    for (let y = -Math.floor(ry); y <= Math.floor(ry); y++) {
      const t = 1 - (y * y) / (ry * ry + 0.0001);
      if (t < 0) continue;
      const hw = Math.round(rx * Math.sqrt(t));
      this.g.fillRect(Math.round(cx - hw), Math.round(cy + y), hw * 2 + 1, 1);
    }
    return this;
  }
  l(x0: number, y0: number, x1: number, y1: number, col: string, th = 1): this {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.r(x0, y0, th, th, col);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
    return this;
  }
  /** wielokąt wypełniony (scanline) */
  poly(pts: [number, number][], col: string): this {
    this.g.fillStyle = col;
    const ys = pts.map((p) => p[1]);
    const y0 = Math.floor(Math.min(...ys)), y1 = Math.ceil(Math.max(...ys));
    for (let y = y0; y <= y1; y++) {
      const xs: number[] = [];
      for (let i = 0; i < pts.length; i++) {
        const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
        if ((ay <= y + 0.5 && by > y + 0.5) || (by <= y + 0.5 && ay > y + 0.5)) {
          xs.push(ax + ((y + 0.5 - ay) / (by - ay)) * (bx - ax));
        }
      }
      xs.sort((a, b) => a - b);
      for (let i = 0; i + 1 < xs.length; i += 2) this.g.fillRect(Math.round(xs[i]), y, Math.max(1, Math.round(xs[i + 1]) - Math.round(xs[i])), 1);
    }
    return this;
  }
  /** 1-pikselowy kontur wokół nieprzezroczystych pikseli (czytelność na każdym tle) */
  outline(col: string): this {
    const img = this.g.getImageData(0, 0, this.w, this.h);
    const d = img.data, W = this.w, H = this.h;
    const [rr, gg, bb] = hexToRgb(col);
    const mark: number[] = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (d[(y * W + x) * 4 + 3] > 0) continue;
      const nb = (xx: number, yy: number) => xx >= 0 && yy >= 0 && xx < W && yy < H && d[(yy * W + xx) * 4 + 3] > 0;
      if (nb(x - 1, y) || nb(x + 1, y) || nb(x, y - 1) || nb(x, y + 1)) mark.push(y * W + x);
    }
    for (const m of mark) { d[m * 4] = rr; d[m * 4 + 1] = gg; d[m * 4 + 2] = bb; d[m * 4 + 3] = 255; }
    this.g.putImageData(img, 0, 0);
    return this;
  }
  fillAll(col: string): this { return this.r(0, 0, this.w, this.h, col); }
}

export function hexToRgb(h: string): [number, number, number] {
  if (h.startsWith('rgb')) { const m = h.match(/[\d.]+/g) ?? ['0', '0', '0']; return [Math.round(+m[0]), Math.round(+m[1]), Math.round(+m[2])]; }
  const s = h.replace('#', '');
  const n = parseInt(s.length === 3 ? s.split('').map((c) => c + c).join('') : s, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
/** Mnożnik jasności: f < 1 przyciemnia (np. 0.7), f > 1 rozjaśnia w stronę bieli (np. 1.25 = +25%). */
export function shade(h: string, f: number): string {
  const [r, g, b] = hexToRgb(h);
  const m = (v: number) => Math.max(0, Math.min(255, Math.round(f >= 1 ? v + (255 - v) * (f - 1) : v * f)));
  return `rgb(${m(r)},${m(g)},${m(b)})`;
}
export function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a), [r2, g2, b2] = hexToRgb(b);
  return `rgb(${Math.round(r1 + (r2 - r1) * t)},${Math.round(g1 + (g2 - g1) * t)},${Math.round(b1 + (b2 - b1) * t)})`;
}

export function flipped(src: Img): Img {
  const c = makeCanvas(src.width, src.height);
  const g = c.getContext('2d')!;
  g.translate(src.width, 0); g.scale(-1, 1); g.drawImage(src, 0, 0);
  return c;
}

export function tinted(src: Img, color: string, alpha: number): Img {
  const c = makeCanvas(src.width, src.height);
  const g = c.getContext('2d')!;
  g.drawImage(src, 0, 0);
  g.globalCompositeOperation = 'source-atop';
  g.globalAlpha = alpha; g.fillStyle = color; g.fillRect(0, 0, c.width, c.height);
  return c;
}

export interface LangFont { family: string; scale: number; rtl: boolean; }
export const LANG_FONTS: Record<string, LangFont> = {
  pl: { family: 'PS2P', scale: 1, rtl: false }, en: { family: 'PS2P', scale: 1, rtl: false },
  es: { family: 'PS2P', scale: 1, rtl: false }, sw: { family: 'PS2P', scale: 1, rtl: false },
  zh: { family: 'NotoSC', scale: 1.45, rtl: false }, ar: { family: 'NotoAR', scale: 1.45, rtl: true },
};

export interface TextOpts {
  size?: number; color?: string; align?: 'left' | 'center' | 'right'; shadow?: string | null; alpha?: number; maxW?: number; baseline?: CanvasTextBaseline;
}

export class Gfx {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  scale = 1; ox = 0; oy = 0; devW = 0; devH = 0; dpr = 1;
  camX = 0; camY = 0;
  lang = 'pl';
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.resize();
  }
  get font(): LangFont { return LANG_FONTS[this.lang] ?? LANG_FONTS.en; }

  resize(): boolean {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const cw = Math.max(1, Math.floor(window.innerWidth)), ch = Math.max(1, Math.floor(window.innerHeight));
    const W = Math.floor(cw * dpr), H = Math.floor(ch * dpr);
    if (W === this.devW && H === this.devH) return false;
    this.devW = W; this.devH = H; this.dpr = dpr;
    this.canvas.width = W; this.canvas.height = H;
    this.canvas.style.width = cw + 'px'; this.canvas.style.height = ch + 'px';
    const fit = Math.min(W / VW, H / VH);
    const integer = Math.floor(fit);
    // preferuj skalowanie całkowitoliczbowe, chyba że marnuje > 20% ekranu
    this.scale = integer >= 1 && integer / fit >= 0.8 ? integer : fit;
    this.ox = Math.floor((W - VW * this.scale) / 2);
    this.oy = Math.floor((H - VH * this.scale) / 2);
    return true;
  }

  begin(): void {
    const c = this.ctx;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = '#000'; c.fillRect(0, 0, this.devW, this.devH);
    c.setTransform(this.scale, 0, 0, this.scale, this.ox, this.oy);
    c.imageSmoothingEnabled = false;
    c.beginPath(); c.rect(0, 0, VW, VH); c.save(); c.clip();
    this.camX = 0; this.camY = 0;
  }
  end(): void { this.ctx.restore(); }

  /** współrzędne ekranu (client px) → współrzędne wirtualne */
  toVirtual(clientX: number, clientY: number): { x: number; y: number } {
    const r = this.canvas.getBoundingClientRect();
    const dx = (clientX - r.left) * (this.devW / r.width), dy = (clientY - r.top) * (this.devH / r.height);
    return { x: (dx - this.ox) / this.scale, y: (dy - this.oy) / this.scale };
  }

  rect(x: number, y: number, w: number, h: number, color: string, alpha = 1): void {
    const c = this.ctx; c.globalAlpha = alpha; c.fillStyle = color;
    c.fillRect(Math.round(x - this.camX), Math.round(y - this.camY), Math.round(w), Math.round(h)); c.globalAlpha = 1;
  }
  /** prostokąt w przestrzeni ekranu (bez kamery) */
  srect(x: number, y: number, w: number, h: number, color: string, alpha = 1): void {
    const c = this.ctx; c.globalAlpha = alpha; c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); c.globalAlpha = 1;
  }
  spr(img: Img, x: number, y: number, o: { flip?: boolean; alpha?: number; w?: number; h?: number; screen?: boolean; rot?: number; ax?: number; ay?: number } = {}): void {
    const c = this.ctx;
    const px = Math.round(x - (o.screen ? 0 : this.camX)), py = Math.round(y - (o.screen ? 0 : this.camY));
    const w = o.w ?? img.width, h = o.h ?? img.height;
    if (px > VW + 4 || py > VH + 4 || px + w < -4 || py + h < -4) return;
    if (o.alpha !== undefined) c.globalAlpha = o.alpha;
    if (o.flip || o.rot) {
      c.save(); c.translate(px + (o.ax ?? w / 2), py + (o.ay ?? h / 2));
      if (o.rot) c.rotate(o.rot);
      if (o.flip) c.scale(-1, 1);
      c.drawImage(img, -(o.ax ?? w / 2), -(o.ay ?? h / 2), w, h); c.restore();
    } else c.drawImage(img, px, py, w, h);
    if (o.alpha !== undefined) c.globalAlpha = 1;
  }
  /** wycinek atlasu */
  sub(img: Img, sx: number, sy: number, sw: number, sh: number, x: number, y: number, o: { flip?: boolean; alpha?: number } = {}): void {
    const c = this.ctx; const px = Math.round(x - this.camX), py = Math.round(y - this.camY);
    if (px > VW || py > VH || px + sw < 0 || py + sh < 0) return;
    if (o.alpha !== undefined) c.globalAlpha = o.alpha;
    if (o.flip) { c.save(); c.translate(px + sw, py); c.scale(-1, 1); c.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh); c.restore(); }
    else c.drawImage(img, sx, sy, sw, sh, px, py, sw, sh);
    if (o.alpha !== undefined) c.globalAlpha = 1;
  }

  setFont(size: number, bold = false): void {
    const f = this.font;
    this.ctx.font = `${bold ? 'bold ' : ''}${Math.round(size * f.scale)}px ${f.family}, "Noto Sans", sans-serif`;
  }
  measure(str: string, size = 8): number {
    this.setFont(size);
    return this.ctx.measureText(str).width;
  }
  /** tekst w przestrzeni ekranu; size w jednostkach „łacińskich” (8 = natywny rozmiar fontu pikselowego) */
  text(str: string, x: number, y: number, o: TextOpts = {}): void {
    const c = this.ctx; const size = o.size ?? 8;
    this.setFont(size);
    c.textBaseline = o.baseline ?? 'top';
    const rtl = this.font.rtl;
    c.direction = rtl ? 'rtl' : 'ltr';
    const al = o.align ?? 'left';
    // 'left'/'right' w RTL oznaczają fizyczne strony; ustawiamy wprost
    c.textAlign = al;
    c.globalAlpha = o.alpha ?? 1;
    const yy = Math.round(y - (this.font.scale > 1 ? (size * (this.font.scale - 1)) / 2 : 0));
    if (o.shadow !== null) { c.fillStyle = o.shadow ?? '#000'; c.fillText(str, Math.round(x) + 1, yy + 1); }
    c.fillStyle = o.color ?? '#fff';
    c.fillText(str, Math.round(x), yy);
    c.globalAlpha = 1;
  }
  /** zawijanie tekstu do szerokości */
  wrap(str: string, maxW: number, size = 8): string[] {
    this.setFont(size);
    const out: string[] = [];
    const cjk = this.lang === 'zh';
    for (const para of str.split('\n')) {
      const tokens = cjk ? [...para] : para.split(' ');
      let line = '';
      for (const tk of tokens) {
        const test = line ? (cjk ? line + tk : line + ' ' + tk) : tk;
        if (this.ctx.measureText(test).width > maxW && line) { out.push(line); line = tk; } else line = test;
      }
      out.push(line);
    }
    return out;
  }
  lineH(size = 8): number { return Math.round(size * this.font.scale * 1.35) + (this.font.scale === 1 ? 3 : 1); }
}

/** Czeka aż fonty gry zostaną załadowane (z limitem czasu). */
export async function loadFonts(): Promise<void> {
  if (!('fonts' in document)) return;
  const jobs = [
    document.fonts.load('16px PS2P', 'Ąęółżź abc'),
    document.fonts.load('bold 16px NotoSC', '中文'),
    document.fonts.load('bold 16px NotoAR', 'عربي'),
  ];
  await Promise.race([Promise.allSettled(jobs), new Promise((r) => setTimeout(r, 4000))]);
}
