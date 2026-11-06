import { describe, expect, it } from 'vitest';
import type { PlayerInput } from '../src/engine/input';
import { defaultSettings } from '../src/engine/settings';
import { World } from '../src/game/world';
import { Session } from '../src/game/session';
import { newSave } from '../src/game/save';
import { getLevel, LEVEL_IDS } from '../src/game/levels';
import { BROTHERS, GRAVITY, PICKUP_RADIUS } from '../src/game/constants';
import { T } from '../src/game/types';
import { stubAudio } from './bot';

const ACT = ['left', 'right', 'up', 'down', 'jump', 'run', 'attack', 'interact', 'switch'] as const;
const blank = () => Object.fromEntries(ACT.map((a) => [a, false])) as Record<(typeof ACT)[number], boolean>;
const idle = (): PlayerInput => ({ held: blank(), pressed: blank(), released: blank() });
const SUP = new Set<number>([T.SOLID, T.ONEWAY, T.CRUMBLE, T.CONVL, T.CONVR, T.CRACKED]);
// Marioosh (słabszy skok) stoi na podłożu: sięga środkiem ciała do apex + hitH/2, a przedmiot łapie w promieniu PICKUP_RADIUS
const REACH = Math.floor(BROTHERS.M.jump ** 2 / (2 * GRAVITY) + BROTHERS.M.hitH / 2 + PICKUP_RADIUS) - 16;

describe('przedmioty wybite ze skrzynek', () => {
  it('po otwarciu skrzynki przedmiot ląduje w zasięgu skoku ze stałego podłoża (wszystkie poziomy)', () => {
    const bad: string[] = []; let crates = 0;
    for (const id of LEVEL_IDS) {
      const w = new World(getLevel(id), new Session(newSave('solo', 'M'), 0), { audio: stubAudio, settings: defaultSettings(), night: false });
      w.readyT = 0; w.god = true;
      for (let ri = 0; ri < w.rooms.length; ri++) {
        (w as any).changeRoom(ri); w.rt.enemies.length = 0;
        for (const c of w.rt.crates.slice()) {
          crates++;
          const g = w.rt.grid; let ground = -1;
          for (let r = c.ty + 1; r < g.h; r++) if (SUP.has(g.tiles[r * g.w + c.tx])) { ground = r * 32; break; }
          if (ground < 0) { bad.push(`${id}#${ri} skrzynka ${c.id} bez podłoża`); continue; }
          if (ground - (c.ty + 1) * 32 > 100) bad.push(`${id}#${ri} skrzynka ${c.id} za wysoko do uderzenia (${ground - (c.ty + 1) * 32}px)`);
          (w as any).openCrate(c, w.players[0]);
          for (let i = 0; i < 240; i++) { w.players[0].mv.body.x = -500; w.update(1 / 60, [idle(), idle()]); }
          const it = w.rt.items.find((q) => q.id === c.id);
          if (!it) { bad.push(`${id}#${ri} ${c.id}: przedmiot zniknął`); continue; }
          // gracz może stanąć na powierzchni, na której leży przedmiot, albo na niższej (schodek z belek) w pobliżu i skoczyć
          const y0 = it.y + 10, itx = Math.floor(it.x / 32); let ok = false;
          for (let dx = -3; dx <= 3 && !ok; dx++) for (let r = Math.max(0, Math.floor(y0 / 32)); r < g.h; r++) {
            if (!SUP.has(g.tiles[r * g.w + itx + dx])) continue;
            if (r * 32 - it.y <= REACH - 10 && r * 32 >= y0 - 4) ok = true; break;
          }
          const under = g.tiles[Math.floor((it.y + 12) / 32) * g.w + itx];
          if (under !== T.SOLID && under !== T.ONEWAY && under !== T.CONVL && under !== T.CONVR) bad.push(`${id}#${ri} ${c.id}: przedmiot leży na nietrwałym podłożu (kafel ${under})`);
          const own = g.tiles[(ground / 32) * g.w + c.tx];
          if (own !== T.SOLID && own !== T.ONEWAY && own !== T.CONVL && own !== T.CONVR) bad.push(`${id}#${ri} ${c.id}: pod skrzynką nietrwałe podłoże (kafel ${own})`);
          if (!it.fixed || !ok) bad.push(`${id}#${ri} ${c.id}: przedmiot na ${Math.round(it.y)} bez stojalnej powierzchni w zasięgu skoku`);
        }
      }
    }
    expect(crates).toBeGreaterThan(100);
    expect(bad).toEqual([]);
  }, 120000);
});
