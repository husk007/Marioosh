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
        const canvas = makeCanvas(w * ss, h * ss);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(im, 0, 0, canvas.width, canvas.height);
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
