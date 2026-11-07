/** Rysowane ręcznie wektorowe HD assety. Brak pliku = dotychczasowy sprite proceduralny. */
import { makeCanvas, type Img } from '../engine/gfx';
import { LOOK } from './enemies';
import type { EnemyKind } from '../game/types';

const ART_IDS = ["rogus","pszczolrog","gekorog","bazalisk","rogopletw","osmiorog","kakturozec","rogopnacze","slimorog","rogoskoczek","kamienirog","dron"] as const;
const hdSprites = new Map<EnemyKind, Img>();

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
  await Promise.all(ART_IDS.map((id) => loadEnemy(id as EnemyKind)));
}

export function hdEnemySprite(kind: EnemyKind): Img | undefined {
  return hdSprites.get(kind);
}
