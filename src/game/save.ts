/** Zapis gry: 3 sloty, wersjonowany format, zapis atomowy (kopia robocza → właściwy klucz). */
import { storage } from '../engine/storage';
import { START_LIVES } from './constants';

export const SAVE_VERSION = 1;

export interface LevelRecord { done: boolean; bestScore: number; bestTime: number; pets: number; cans: number; golden: number; freed: number }
export interface SaveData {
  v: number;
  created: number; updated: number; playSeconds: number;
  mode: 'solo' | 'coop';
  brother: 'M' | 'D';
  lives: [number, number];
  score: number;
  packageCount: number;          // fizyczne opakowania (PET + puszki + złote jako 1)
  depositGrosze: number;         // wyświetlana kaucja
  depositRealised: number;       // kaucja „przyjęta” przez EcoPort
  lifeMilestones: number;        // ile progów 100 opakowań już wypłacono
  collected: string[];           // unikalne id zebranych przedmiotów
  freed: string[];               // uwolnieni mieszkańcy (id posągów)
  shards: string[];              // fragmenty Kryształu Życia (id bossów)
  notes: string[];               // Zapiski Scarlet
  secrets: string[];             // odkryte sekrety (przewody, skrzynki)
  levels: Record<string, LevelRecord>;
  unlockedWorld: number;         // najwyższy odblokowany świat (1..8)
  currentLevel: string;          // ostatnio wybrany poziom na mapie
  pradowoUnlocked: boolean;
  endingSeen: boolean; trueEndingSeen: boolean;
  deaths: number; enemiesDefeated: number;
  night: boolean;                // tryb „Nocna Zmiana” (po finale)
}

export const SLOTS = 3;
const key = (i: number) => `marioosh.save.v${SAVE_VERSION}.slot${i}`;

export function newSave(mode: 'solo' | 'coop', brother: 'M' | 'D', now = Date.now()): SaveData {
  return {
    v: SAVE_VERSION, created: now, updated: now, playSeconds: 0, mode, brother,
    lives: [START_LIVES, START_LIVES], score: 0, packageCount: 0, depositGrosze: 0, depositRealised: 0, lifeMilestones: 0,
    collected: [], freed: [], shards: [], notes: [], secrets: [], levels: {}, unlockedWorld: 1, currentLevel: 'W1-L1', pradowoUnlocked: false,
    endingSeen: false, trueEndingSeen: false, deaths: 0, enemiesDefeated: 0, night: false,
  };
}

/** Migracja starszych/niepełnych zapisów do bieżącej wersji. Zwraca null dla uszkodzonych danych. */
export function migrate(raw: unknown): SaveData | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Partial<SaveData>;
  const base = newSave(o.mode === 'coop' ? 'coop' : 'solo', o.brother === 'D' ? 'D' : 'M', typeof o.created === 'number' ? o.created : Date.now());
  const num = (v: unknown, d: number) => (typeof v === 'number' && isFinite(v) ? v : d);
  const arr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
  const lv: Record<string, LevelRecord> = {};
  if (o.levels && typeof o.levels === 'object') for (const [k, r] of Object.entries(o.levels)) {
    const x = r as Partial<LevelRecord>;
    lv[k] = { done: !!x.done, bestScore: num(x.bestScore, 0), bestTime: num(x.bestTime, 0), pets: num(x.pets, 0), cans: num(x.cans, 0), golden: num(x.golden, 0), freed: num(x.freed, 0) };
  }
  return {
    ...base,
    updated: num(o.updated, base.updated), playSeconds: num(o.playSeconds, 0),
    lives: [Math.min(99, Math.max(0, num(o.lives?.[0], 3))), Math.min(99, Math.max(0, num(o.lives?.[1], 3)))],
    score: Math.max(0, num(o.score, 0)), packageCount: Math.max(0, num(o.packageCount, 0)), depositGrosze: Math.max(0, num(o.depositGrosze, 0)),
    depositRealised: Math.max(0, num(o.depositRealised, 0)), lifeMilestones: Math.max(0, num(o.lifeMilestones, Math.floor(num(o.packageCount, 0) / 100))),
    collected: arr(o.collected), freed: arr(o.freed), shards: arr(o.shards), notes: arr(o.notes), secrets: arr(o.secrets), levels: lv,
    unlockedWorld: Math.min(8, Math.max(1, num(o.unlockedWorld, 1))), currentLevel: typeof o.currentLevel === 'string' ? o.currentLevel : 'W1-L1',
    pradowoUnlocked: !!o.pradowoUnlocked, endingSeen: !!o.endingSeen, trueEndingSeen: !!o.trueEndingSeen,
    deaths: num(o.deaths, 0), enemiesDefeated: num(o.enemiesDefeated, 0), night: !!o.night,
  };
}

export function readSlot(i: number): SaveData | null {
  const s = storage.get(key(i)); if (!s) return null;
  try { return migrate(JSON.parse(s)); } catch { return null; }
}
export function writeSlot(i: number, d: SaveData): void {
  d.updated = Date.now();
  const json = JSON.stringify(d);
  storage.set(key(i) + '.tmp', json);    // zapis atomowy: najpierw kopia robocza
  storage.set(key(i), json);
  storage.remove(key(i) + '.tmp');
}
export function deleteSlot(i: number): void { storage.remove(key(i)); storage.remove(key(i) + '.tmp'); }

/** Procent ukończenia: poziomy 40%, mieszkańcy 30%, fragmenty 15%, zapiski 15%. */
export function completion(d: SaveData): number {
  const lv = Object.values(d.levels).filter((l) => l.done).length / 32;
  return Math.round((lv * 40 + (d.freed.length / 96) * 30 + (d.shards.length / 8) * 15 + (d.notes.length / 8) * 15));
}

/** Slot techniczny trybu testera (poza 3 zwykłymi slotami): wszystko odblokowane. */
export const TESTER_SLOT = 9;
export function testerSave(levelIds: string[]): SaveData {
  const d = newSave('solo', 'M'); d.unlockedWorld = 8; d.pradowoUnlocked = true; d.lives = [9, 9];
  for (const id of levelIds) d.levels[id] = { done: true, bestScore: 0, bestTime: 0, pets: 0, cans: 0, golden: 0, freed: 0 };
  d.currentLevel = levelIds[0] ?? 'W1-L1'; return d;
}
