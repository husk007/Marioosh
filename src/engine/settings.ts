import { storage } from './storage';

export type Action = 'left' | 'right' | 'up' | 'down' | 'jump' | 'run' | 'attack' | 'interact' | 'switch';
export const ACTIONS: Action[] = ['left', 'right', 'up', 'down', 'jump', 'run', 'attack', 'interact', 'switch'];

export interface Settings {
  lang: string;
  music: number; sfx: number; voice: number;       // 0..1
  reduceFlashes: boolean; reduceShake: boolean; captions: boolean;
  touch: 'auto' | 'on' | 'off'; touchSize: number;  // 0.8..1.4
  outfit: 'classic' | 'night';
  keys: [Record<Action, string>, Record<Action, string>];
}

export const DEFAULT_KEYS: [Record<Action, string>, Record<Action, string>] = [
  { left: 'KeyA', right: 'KeyD', up: 'KeyW', down: 'KeyS', jump: 'Space', run: 'ShiftLeft', attack: 'KeyF', interact: 'KeyE', switch: 'KeyQ' },
  { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown', jump: 'Period', run: 'Comma', attack: 'Slash', interact: 'Quote', switch: 'Semicolon' },
];

const KEY = 'marioosh.settings.v1';

export function defaultSettings(): Settings {
  const nav = typeof navigator !== 'undefined' ? navigator.language.toLowerCase() : 'pl';
  const lang = ['pl', 'en', 'zh', 'es', 'sw', 'ar'].find((l) => nav.startsWith(l)) ?? 'pl';
  return {
    lang, music: 0.6, sfx: 0.8, voice: 0.8, reduceFlashes: false, reduceShake: false, captions: false,
    touch: 'auto', touchSize: 1, outfit: 'classic',
    keys: [{ ...DEFAULT_KEYS[0] }, { ...DEFAULT_KEYS[1] }],
  };
}

export function loadSettings(): Settings {
  const d = defaultSettings();
  try {
    const raw = storage.get(KEY);
    if (!raw) return d;
    const o = JSON.parse(raw) as Partial<Settings>;
    const keys: Settings['keys'] = [{ ...d.keys[0], ...(o.keys?.[0] ?? {}) }, { ...d.keys[1], ...(o.keys?.[1] ?? {}) }];
    return { ...d, ...o, keys };
  } catch { return d; }
}
export function saveSettings(s: Settings): void { storage.set(KEY, JSON.stringify(s)); }
