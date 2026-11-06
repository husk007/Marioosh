import levelsJson from '../data/levels.json';
import { buildLevel, buildPradowo } from './levelgen';
import type { LevelData, LevelJson } from './types';

export const LEVEL_JSON: LevelJson[] = (levelsJson as unknown as { levels: LevelJson[] }).levels;
export const LEVEL_IDS: string[] = LEVEL_JSON.map((l) => l.level_id);
const cache = new Map<string, LevelData>();

export function getLevel(id: string, night = false): LevelData {
  const key = id + (night ? ':n' : '');
  let l = cache.get(key);
  if (!l) {
    if (id === 'W0') l = buildPradowo();
    else { const j = LEVEL_JSON.find((x) => x.level_id === id); if (!j) throw new Error('Nieznany poziom ' + id); l = buildLevel(j, { night }); }
    cache.set(key, l);
  }
  // poziom jest mutowany tylko w kopii (World kopiuje kafelki), ale specyfikacje bywają współdzielone — zwracamy głęboką kopię specyfikacji
  return l;
}
export function parseId(id: string): { world: number; stage: number } {
  const m = /^W(\d)(?:-L(\d))?$/.exec(id); return { world: m ? +m[1] : 1, stage: m && m[2] ? +m[2] : 1 };
}
export function nextLevelId(id: string): string | null {
  const i = LEVEL_IDS.indexOf(id); return i >= 0 && i + 1 < LEVEL_IDS.length ? LEVEL_IDS[i + 1] : null;
}
export function levelId(world: number, stage: number): string { return `W${world}-L${stage}`; }
