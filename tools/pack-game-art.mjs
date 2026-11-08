// Pakuje grafiki HD używane w grze: public/art/gen (źródło, 768 px) -> public/art/game (przycięte, zmniejszone) + index.json.
// Użycie: node tools/pack-game-art.mjs
import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const gen = join(root, 'public', 'art', 'gen'), out = join(root, 'public', 'art', 'game');
const manifest = JSON.parse(readFileSync(join(gen, 'manifest.json'), 'utf8'));
rmSync(out, { recursive: true, force: true }); mkdirSync(out, { recursive: true });

const num = (id) => +id.split('-')[1];
// Kafle planet: 16 sztuk na planetę (Lumenia=świat 1 ... Katoblis=8, Pradowo=0)
const TILE_K = { solid: 1, top: 2, oneway: 12, moving: 13, breakable: 15, hidden: 16 };
// reguły: [kategoria, funkcja wyboru, maks. dłuższy bok, przycinanie do alfa]
const rules = [
  ['characters', () => true, 512, true], ['bosses', () => true, 512, true], ['boss-variants', () => true, 512, true],
  ['enemies', () => true, 384, true], ['enemy-variants', () => true, 384, true], ['civilians', () => true, 320, true],
  ['character-variants', () => true, 384, true],
  ['collectibles', () => true, 160, true],
  ['conduits', (a) => [1, 6, 11, 16, 21, 26].includes(num(a.asset_id)), 224, true],
  ['interactables', (a) => [1, 2, 3, 4, 5, 7, 11, 14, 18, 20, 30].includes(num(a.asset_id)), 320, true],
  ['planet-tiles', (a) => Object.values(TILE_K).includes(((num(a.asset_id) - 1) % 16) + 1), 288, false],
];
const index = {}; let bytes = 0, n = 0;
for (const [key, m] of Object.entries(manifest)) {
  const rule = rules.find((r) => r[0] === m.category); if (!rule || !rule[1](m)) continue;
  const src = join(gen, key); if (!existsSync(src)) continue;
  let img = sharp(src).ensureAlpha();
  if (rule[3]) img = sharp(await img.trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 8 }).toBuffer());
  const buf = await img.resize({ width: rule[2], height: rule[2], fit: 'inside', withoutEnlargement: true }).webp({ quality: 84, alphaQuality: 90, effort: 5 }).toBuffer({ resolveWithObject: true });
  const name = `${m.asset_id}__${m.state}`;
  writeFileSync(join(out, name + '.webp'), buf.data); bytes += buf.data.length; n++;
  index[name] = { f: name + '.webp', w: buf.info.width, h: buf.info.height };
}
writeFileSync(join(out, 'index.json'), JSON.stringify(index));
console.log(`game art: ${n} plików, ${(bytes / 1048576).toFixed(2)} MB → public/art/game`);
