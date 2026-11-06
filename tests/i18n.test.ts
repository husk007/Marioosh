import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DICTS, LANGS, RTL_LANGS, setLang, t } from '../src/engine/i18n';

const ref = DICTS.pl;
const keys = Object.keys(ref);
const ph = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');

describe('i18n: 6 języków', () => {
  it('obsługuje dokładnie pl, en, zh, es, sw, ar (ar = RTL)', () => {
    expect([...LANGS]).toEqual(['pl', 'en', 'zh', 'es', 'sw', 'ar']);
    expect([...RTL_LANGS]).toEqual(['ar']);
  });
  for (const l of LANGS) {
    describe(l, () => {
      const d = DICTS[l];
      it('ma komplet kluczy (bez braków i nadmiarowych)', () => {
        expect(keys.filter((k) => !(k in d)), 'brakujące').toEqual([]);
        expect(Object.keys(d).filter((k) => !(k in ref)), 'nadmiarowe').toEqual([]);
      });
      it('nie ma pustych tłumaczeń', () => { expect(keys.filter((k) => !String(d[k]).trim())).toEqual([]); });
      it('zachowuje te same znaczniki {param} co wersja polska', () => {
        expect(keys.filter((k) => ph(d[k] ?? '') !== ph(ref[k])).map((k) => `${k}: ${ph(ref[k])} vs ${ph(d[k] ?? '')}`)).toEqual([]);
      });
    });
  }
  it('t() podstawia parametry i przełącza język', () => {
    setLang('en'); expect(t('slots.slot', { n: 2 })).toBe('Slot 2');
    setLang('pl'); expect(t('slots.slot', { n: 3 })).toContain('3');
    setLang('pl');
  });
  it('chińskie i arabskie teksty zawierają właściwe pismo (nie łacińskie placeholdery)', () => {
    expect(/[一-鿿]/.test(DICTS.zh['menu.play'])).toBe(true);
    expect(/[؀-ۿ]/.test(DICTS.ar['menu.play'])).toBe(true);
  });
  it('tłumaczenia nie są kopią angielskiego (poza nazwami własnymi)', () => {
    for (const l of ['pl', 'zh', 'es', 'sw', 'ar'] as const) {
      const same = keys.filter((k) => DICTS[l][k] === DICTS.en[k] && DICTS.en[k].length > 24);
      expect(same.length, `${l}: ${same.slice(0, 5).join(', ')}`).toBeLessThan(keys.length * 0.03);
    }
  });
});

describe('parametry komunikatów', () => {
  it('toast.eco przyjmuje {n} we wszystkich językach (regresja „n+”)', () => {
    for (const l of LANGS) {
      setLang(l);
      const out = t('toast.eco', { n: '1.50' });
      expect(out, l).toContain('1.50');
      expect(out, l).not.toContain('{');
    }
    setLang('pl');
  });
  it('parametry przekazywane w say(...) zgadzają się z placeholderami w słowniku', () => {
    const src = ['world.ts', 'bosses.ts'].map((f) => readFileSync(join(__dirname, '../src/game', f), 'utf8')).join('\n');
    const re = /say\('([\w.]+)',\s*\{([^}]*)\}\)/g; let m: RegExpExecArray | null; let n = 0;
    while ((m = re.exec(src))) {
      const names = [...m[2].matchAll(/(\w+)\s*:/g)].map((x) => x[1]).sort().join(',');
      for (const l of LANGS) for (const need of ph(DICTS[l][m[1]] ?? '').split(',').filter(Boolean)) expect(names.split(','), `${l}:${m[1]}`).toContain(need);
      n++;
    }
    expect(n).toBeGreaterThan(3);
  });
});
