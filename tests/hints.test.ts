import { describe, expect, it } from 'vitest';
import { LEVEL_IDS, getLevel } from '../src/game/levels';
import { DICTS, LANGS } from '../src/engine/i18n';

describe('podpowiedzi do mechanik', () => {
  it('każdy klucz podpowiedzi użyty w poziomach istnieje we wszystkich językach', () => {
    for (const id of LEVEL_IDS) for (const r of getLevel(id).rooms) for (const s of r.specs) if (s.t === 'hint') for (const l of LANGS) expect(DICTS[l][s.key], `${id} ${s.key} ${l}`).toBeTruthy();
  });
  it('pierwszy poziom uczy ruchu, progów, drzwi, drabiny i bramy — każdego raz', () => {
    const keys: string[] = []; for (const s of getLevel('W1-L1').rooms[0].specs) if (s.t === 'hint') keys.push(s.key);
    for (const k of ['hint.move', 'hint.vault', 'hint.door', 'hint.ladder', 'hint.gate2']) expect(keys.filter((x) => x === k), k).toHaveLength(1);
  });
});
