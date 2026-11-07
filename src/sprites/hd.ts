/** Rysowane ręcznie wektorowe HD assety. Brak pliku = dotychczasowy sprite proceduralny. */
import { makeCanvas, type Img } from '../engine/gfx';
import { LOOK } from './enemies';
import type { EnemyKind } from '../game/types';

const ART_IDS = ["rogus","pszczolrog","gekorog","bazalisk","rogopletw","osmiorog","kakturozec","rogopnacze","slimorog","rogoskoczek","kamienirog","dron"] as const;
const hdSprites = new Map<EnemyKind, Img>();
const hdSkies = new Map<number, Img>();
const SKY_IDS = [0,1,2,3,4,5,6,7,8] as const;

function loadSky(world: number): Promise<void> {
  return new Promise((resolve) => {
    const im = new Image();
    im.onload = () => {
      try {
        const canvas = makeCanvas(1280, 720);
        const ctx = canvas.getContext('2d');
        if (ctx) { ctx.drawImage(im, 0, 0, 1280, 720); canvas.ss = 2; hdSkies.set(world, canvas); }
      } catch { /* procedural fallback */ }
      resolve();
    };
    im.onerror = () => resolve();
    im.src = new URL('./art/hd/worlds/' + world + '.svg', document.baseURI).toString();
  });
}

export function hdBackground(world: number): Img | undefined { return hdSkies.get(world); }


function loadEnemy(kind: EnemyKind): Promise<void> {
  return new Promise((resolve) => {
    const im = new Image();
    im.onload = () => {
      try {
        const look = LOOK[kind];
        const w = look.w + 6, h = look.h + 6, ss = 4;
        // 1) raster SVG w dużej skali, 2) przytnij do przezroczystego marginesu, 3) wpisz proporcjonalnie (bez rozciągania), stopami do dołu
        const SRC = 4, sw = 160 * SRC, sh = 140 * SRC;
        const tmp = makeCanvas(sw, sh);
        const tctx = tmp.getContext('2d');
        const canvas = makeCanvas(w * ss, h * ss);
        const ctx = canvas.getContext('2d');
        if (tctx && ctx) {
          tctx.drawImage(im, 0, 0, sw, sh);
          let bx = 0, by = 0, bw = sw, bh = sh;
          try {
            const d = tctx.getImageData(0, 0, sw, sh).data;
            let x0 = sw, y0 = sh, x1 = -1, y1 = -1;
            for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) if (d[(y * sw + x) * 4 + 3] > 12) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
            if (x1 >= x0 && y1 >= y0) { bx = x0; by = y0; bw = x1 - x0 + 1; bh = y1 - y0 + 1; }
          } catch { /* bez przycinania */ }
          // rośliny są wysokie i wąskie w hitboxie, a ilustracje szerokie — pozwól im wystawać na boki, by zgadzała się wysokość
          const wf = look.arch === 'plant' ? 1.7 : 1;
          const k = Math.min(((look.w + 4) * wf * ss) / bw, ((look.h + 4) * ss) / bh);
          const dw = bw * k, dh = bh * k;
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(tmp, bx, by, bw, bh, (canvas.width - dw) / 2, canvas.height - 3 * ss - dh + ss, dw, dh);
          canvas.ss = ss;
          hdSprites.set(kind, canvas);
        }
      } catch { /* fallback to procedural sprite */ }
      resolve();
    };
    im.onerror = () => resolve();
    im.src = new URL('./art/hd/enemies/' + kind + '.svg', document.baseURI).toString();
  });
}

/** Preload once. On broken/offline image references, do not block game start. */
export async function preloadHDArt(): Promise<void> {
  await Promise.all([...ART_IDS.map((id) => loadEnemy(id as EnemyKind)), ...SKY_IDS.map((id) => loadSky(id))]);
}

export function hdEnemySprite(kind: EnemyKind): Img | undefined {
  return hdSprites.get(kind);
}
