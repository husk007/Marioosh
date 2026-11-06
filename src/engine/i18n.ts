import pl from '../data/i18n/pl';
import en from '../data/i18n/en';
import es from '../data/i18n/es';
import sw from '../data/i18n/sw';
import zh from '../data/i18n/zh';
import ar from '../data/i18n/ar';

export const LANGS = ['pl', 'en', 'zh', 'es', 'sw', 'ar'] as const;
export type Lang = (typeof LANGS)[number];
export type Key = keyof typeof pl;

export const DICTS: Record<Lang, Record<string, string>> = { pl, en, zh, es, sw, ar };
export const RTL_LANGS: readonly string[] = ['ar'];

let current: Lang = 'pl';
const listeners: Array<(l: Lang) => void> = [];

export function setLang(l: string): void {
  current = (LANGS as readonly string[]).includes(l) ? (l as Lang) : 'pl';
  if (typeof document !== 'undefined') {
    document.documentElement.lang = current;
    document.documentElement.dir = RTL_LANGS.includes(current) ? 'rtl' : 'ltr';
  }
  listeners.forEach((f) => f(current));
}
export function getLang(): Lang { return current; }
export function isRtl(): boolean { return RTL_LANGS.includes(current); }
export function onLangChange(f: (l: Lang) => void): void { listeners.push(f); }

export function t(key: Key | string, params?: Record<string, string | number>): string {
  let s = DICTS[current][key] ?? DICTS.en[key] ?? DICTS.pl[key] ?? key;
  if (params) for (const [k, v] of Object.entries(params)) s = s.split(`{${k}}`).join(String(v));
  return s;
}
export function has(key: string): boolean { return key in DICTS[current]; }
