/**
 * Grafiki HD z biblioteki wygenerowanej (public/art/game, pakowane przez tools/pack-game-art.mjs).
 * Moduł wczytuje obrazy raz, a potem dopasowuje je do rozmiarów logicznych gry (przycięcie do alfy, wpisanie bez rozciągania,
 * stopy na dolnej krawędzi, opcjonalne odbicie/pochylenie/barwa). Brak pliku = zwraca undefined, a gra używa sprite'a proceduralnego.
 */
import { makeCanvas, type Img } from '../engine/gfx';
import packed from '../../public/art/game/index.json';

interface Entry { f: string; w: number; h: number }
declare global { interface Window { __GENMAP?: Record<string, string> } }

const index: Record<string, Entry> = {};
const imgs = new Map<string, HTMLImageElement>();
const cache = new Map<string, Img | null>();

const url = (f: string): string => window.__GENMAP?.[f] ?? new URL('art/game/' + f, document.baseURI).toString();

function loadImage(key: string, e: Entry): Promise<void> {
  return new Promise((resolve) => {
    const im = new Image();
    im.onload = () => { imgs.set(key, im); resolve(); };
    im.onerror = () => resolve();
    im.src = url(e.f);
  });
}

/** Wczytuje wszystkie obrazy z indeksu (wbudowanego w paczkę JS, bo fetch nie działa na file://); błędy sieci nie blokują startu gry. */
export async function preloadGen(): Promise<void> {
  Object.assign(index, packed as Record<string, Entry>);
  await Promise.all(Object.entries(index).map(([k, e]) => loadImage(k, e)));
}

export const hasGen = (key: string): boolean => imgs.has(key);
/** pierwszy istniejący klucz z listy (np. poza, a gdy jej brak — poza bazowa) */
export function firstGen(...keys: string[]): string | undefined { return keys.find((k) => imgs.has(k)); }

export interface FitOpt {
  /** odbij w poziomie (dla grafik zwróconych w lewo) */
  flip?: boolean;
  /** supersampling kanwy wynikowej (domyślnie 3) */
  ss?: number;
  /** wycinek źródła w ułamkach {x,y,w,h} (np. połowa obrazu ze stanem „wł.”) */
  crop?: { x: number; y: number; w: number; h: number };
  /** obrót w stopniach przed dopasowaniem */
  rot?: number;
  /** skala dodatkowa po dopasowaniu (np. przysiad, puls) */
  sx?: number; sy?: number;
  /** mnożnik dozwolonej szerokości (rośliny mogą wystawać) */
  wf?: number;
  /** zabarwienie: kolor + siła 0..1 (tylko piksele obrazu) */
  tint?: [string, number];
  /** kotwica pionowa: 'bottom' (domyślnie) lub 'center' */
  anchor?: 'bottom' | 'center';
  /** bez przycinania do alfy (kafle nieprzezroczyste) */
  noTrim?: boolean;
  /** rozciągnij na całe pole (kafle, platformy) zamiast wpisywać */
  stretch?: boolean;
}

function trimBox(c: HTMLCanvasElement): { x: number; y: number; w: number; h: number } {
  const g = c.getContext('2d'); if (!g) return { x: 0, y: 0, w: c.width, h: c.height };
  try {
    const d = g.getImageData(0, 0, c.width, c.height).data;
    let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 14) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 >= x0 && y1 >= y0) return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  } catch { /* brak dostępu do pikseli */ }
  return { x: 0, y: 0, w: c.width, h: c.height };
}

/** Dopasowuje obraz `key` do pola w×h (jednostki logiczne gry). Wynik jest keszowany. */
export function genFit(key: string, w: number, h: number, o: FitOpt = {}): Img | undefined {
  const ck = `${key}|${w}x${h}|${JSON.stringify(o)}`;
  const hit = cache.get(ck); if (hit !== undefined) return hit ?? undefined;
  const im = imgs.get(key); if (!im) { cache.set(ck, null); return undefined; }
  const ss = o.ss ?? 3;
  // 1) wycinek źródła (+ obrót) do kanwy roboczej
  const cr = o.crop ?? { x: 0, y: 0, w: 1, h: 1 };
  const sx = cr.x * im.naturalWidth, sy = cr.y * im.naturalHeight, sw = cr.w * im.naturalWidth, sh = cr.h * im.naturalHeight;
  let work = makeCanvas(Math.max(1, Math.round(sw)), Math.max(1, Math.round(sh)));
  work.getContext('2d')?.drawImage(im, sx, sy, sw, sh, 0, 0, work.width, work.height);
  if (o.rot) {
    const a = (o.rot * Math.PI) / 180, D = Math.ceil(Math.hypot(work.width, work.height));
    const r = makeCanvas(D, D), rg = r.getContext('2d');
    if (rg) { rg.translate(D / 2, D / 2); rg.rotate(a); rg.drawImage(work, -work.width / 2, -work.height / 2); work = r; }
  }
  // 2) przycięcie do przezroczystego marginesu
  const bb = o.noTrim ? { x: 0, y: 0, w: work.width, h: work.height } : trimBox(work);
  // 3) wpisanie w pole
  const out = makeCanvas(Math.round(w * ss), Math.round(h * ss)) as Img; out.ss = ss;
  const g = out.getContext('2d'); if (!g) { cache.set(ck, null); return undefined; }
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  const sxk = o.sx ?? 1, syk = o.sy ?? 1;
  let dw: number, dh: number;
  if (o.stretch) { dw = out.width * sxk; dh = out.height * syk; }
  else { const k = Math.min((w * (o.wf ?? 1) * ss) / bb.w, (h * ss) / bb.h); dw = bb.w * k * sxk; dh = bb.h * k * syk; }
  const dx = (out.width - dw) / 2, dy = o.stretch ? (out.height - dh) / 2 : o.anchor === 'center' ? (out.height - dh) / 2 : out.height - dh;
  if (o.flip) { g.translate(out.width, 0); g.scale(-1, 1); }
  g.drawImage(work, bb.x, bb.y, bb.w, bb.h, dx, dy, dw, dh);
  if (o.tint) { g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-atop'; g.globalAlpha = o.tint[1]; g.fillStyle = o.tint[0]; g.fillRect(0, 0, out.width, out.height); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  cache.set(ck, out); return out;
}

// --------------------------------------------------------------------------- kafle planet (16 sztuk na świat)
/** numer pliku kafla dla świata (Lumenia=1 … Katoblis=8, Pradowo=0) i rodzaju (1..16) */
const tileKey = (world: number, k: number): string => `PLANET_TILES-${String(((world === 0 ? 8 : world - 1) * 16) + k).padStart(3, '0')}__base`;
export const TILE_KIND = { solid: 1, top: 2, oneway: 12, moving: 13, breakable: 15, hidden: 16 } as const;
export const hasTiles = (world: number): boolean => hasGen(tileKey(world, TILE_KIND.solid));

/** siatka 4×4 wycinków wypełnienia (32×32 każdy) — razem tworzą jeden obraz 128×128, więc faktura jest ciągła */
export function tileFillGrid(world: number): Img[] | undefined {
  const im = imgs.get(tileKey(world, TILE_KIND.solid)); if (!im) return undefined;
  const out: Img[] = [];
  for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) {
    const c = makeCanvas(64, 64) as Img; c.ss = 2; const g = c.getContext('2d'); if (!g) return undefined;
    g.imageSmoothingQuality = 'high';
    g.drawImage(im, (i * im.naturalWidth) / 4, (j * im.naturalHeight) / 4, im.naturalWidth / 4, im.naturalHeight / 4, 0, 0, 64, 64);
    out.push(c);
  }
  return out;
}
/** cztery paski górnej krawędzi (32 × (32+pad)); źródło: kafel „top-center”, jeśli go nie ma — undefined */
export function tileTopStrips(world: number, pad: number): Img[] | undefined {
  const im = imgs.get(tileKey(world, TILE_KIND.top)); if (!im) return undefined;
  const probe = makeCanvas(im.naturalWidth, im.naturalHeight); const pg = probe.getContext('2d'); if (!pg) return undefined;
  pg.drawImage(im, 0, 0);
  const bb = trimBox(probe);
  const scale = 128 / im.naturalWidth, srcH = (32 + pad) / scale;
  const out: Img[] = [];
  for (let i = 0; i < 4; i++) {
    const c = makeCanvas(64, (32 + pad) * 2) as Img; c.ss = 2; const g = c.getContext('2d'); if (!g) return undefined;
    g.imageSmoothingQuality = 'high';
    g.drawImage(im, (i * im.naturalWidth) / 4, bb.y, im.naturalWidth / 4, srcH, 0, 0, c.width, c.height);
    out.push(c);
  }
  return out;
}
/** pojedynczy kafel nieprzezroczysty 32×32 z całego obrazu (np. „breakable-ground”) */
export function tileWhole(world: number, kind: number, w = 32, h = 32): Img | undefined { return genFit(tileKey(world, kind), w, h, { stretch: true, noTrim: true, ss: 2 }); }
/** pas platformy (jednostronnej / ruchomej) rozciągany do dowolnej szerokości */
export function tilePlatform(world: number, kind: number, w: number, h: number): Img | undefined { return genFit(tileKey(world, kind), w, h, { stretch: true, ss: 2 }); }
export { tileKey };
