/** Bezpieczny wrapper localStorage (z pamięcią zastępczą w trybie prywatnym / testach). */
const mem = new Map<string, string>();
export const storage = {
  get(k: string): string | null {
    try { return globalThis.localStorage?.getItem(k) ?? mem.get(k) ?? null; } catch { return mem.get(k) ?? null; }
  },
  set(k: string, v: string): void {
    mem.set(k, v);
    try { globalThis.localStorage?.setItem(k, v); } catch { /* ignoruj */ }
  },
  remove(k: string): void {
    mem.delete(k);
    try { globalThis.localStorage?.removeItem(k); } catch { /* ignoruj */ }
  },
};
