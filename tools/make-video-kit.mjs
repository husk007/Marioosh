// Przygotowuje „zestaw wideo": klatki startowe 1280x720 (tło świata + postacie) i pojedyncze postacie PNG z alfą
// do wgrania do generatora wideo (Gemini/Veo, ChatGPT itp.). Użycie: node tools/make-video-kit.mjs <katalog-wyjściowy>
import sharp from 'sharp';
import { readFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const gen = join(root, 'public', 'art', 'gen'), worlds = join(root, 'public', 'art', 'hd', 'worlds');
const out = process.argv[2] || join(root, 'video-kit'); const W = 1280, H = 720;
mkdirSync(join(out, 'postacie'), { recursive: true }); mkdirSync(join(out, 'klatki-startowe'), { recursive: true });
const man = JSON.parse(readFileSync(join(gen, 'manifest.json'), 'utf8'));
const find = (id, state = 'base') => { const k = Object.keys(man).find((k) => man[k].asset_id === id && man[k].state === state); return k && existsSync(join(gen, k)) ? join(gen, k) : null; };
const trimmed = async (file, h, tint) => {
  let s = sharp(file).ensureAlpha(); s = sharp(await s.trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 8 }).toBuffer());
  if (tint) s = sharp(await s.grayscale().modulate({ brightness: 0.85 }).toBuffer());
  return s.resize({ height: h, width: Math.round(h * 1.6), fit: 'inside' }).png().toBuffer({ resolveWithObject: true });
};
const bg = async (n) => sharp(join(worlds, `${n}.svg`), { density: 96 }).resize(W, H, { fit: 'cover' }).flatten({ background: '#202030' }).png().toBuffer();

// 1) pojedyncze postacie (przezroczyste, maks. 1024 px) — jako „obrazy referencyjne"
const refs = { 'marioosh': 'CHARACTERS-001', 'darioosh': 'CHARACTERS-002', 'scarlet': 'CHARACTERS-003', 'katoblepas': 'BOSSES-001', 'katoblepas-faza2-spojrzenie': ['BOSS_VARIANTS-001'],
  'rogomir': 'BOSSES-002', 'zlomotaur': 'BOSSES-003', 'kaktogor': 'BOSSES-004', 'rogopletw-wielki': 'BOSSES-005', 'ceratopsor': 'BOSSES-006', 'krukorog-krolewski': 'BOSSES-007', 'rogodron': 'BOSSES-008',
  'przewod-fioletowy': 'CONDUITS-021', 'przewod-niebieski': 'CONDUITS-001', 'ekoport': 'INTERACTABLES-003', 'cel-poziomu': 'INTERACTABLES-001', 'posag-lumenianin': 'CIVILIANS-002', 'lumenianie-uwolnieni': 'CIVILIANS-001' };
for (const [name, ids] of Object.entries(refs)) { const f = find([].concat(ids)[0]); if (!f) { console.log('brak', name); continue; } await sharp(f).ensureAlpha().resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true }).png().toFile(join(out, 'postacie', name + '.png')); }

// 2) klatki startowe: [nazwa, tło, [[id, x-środek, wysokość, dół-y, tint?]...]]
const FRAMES = [
  ['01-intro-warsztat', 0, [['CHARACTERS-001', 470, 430, 640], ['CHARACTERS-002', 800, 430, 640]]],
  ['02-intro-przewod', 0, [['CHARACTERS-001', 330, 420, 650], ['CHARACTERS-002', 560, 420, 650], ['CONDUITS-021', 980, 300, 650]]],
  ['03-teleportacja', 0, [['CHARACTERS-001', 540, 380, 560], ['CHARACTERS-002', 740, 380, 560], ['CONDUITS-021', 640, 220, 330]]],
  ['04-lumenia-posagi', 1, [['CIVILIANS-002', 200, 330, 660], ['CIVILIANS-002', 1040, 330, 660], ['CHARACTERS-001', 470, 420, 670], ['CHARACTERS-002', 700, 420, 670]]],
  ['05-porwanie-scarlet', 6, [['BOSSES-001', 380, 520, 620], ['CHARACTERS-003', 880, 400, 600]]],
  ['06-zakonczenie', 1, [['CHARACTERS-001', 400, 430, 660], ['CHARACTERS-003', 640, 470, 660], ['CHARACTERS-002', 880, 430, 660], ['CIVILIANS-001', 1100, 300, 660]]],
  ['07-game-over-posagi', 8, [['CHARACTERS-001', 520, 420, 650, 1], ['CHARACTERS-002', 760, 420, 650, 1]]],
  ['08-tytul-katoblepas', 8, [['BOSSES-001', 640, 560, 640]]],
];
for (let i = 1; i <= 8; i++) { const id = `BOSSES-00${i}`; const ent = Object.values(man).find((m) => m.asset_id === id); if (ent) FRAMES.push([`09-boss-${i}-${ent.name.toLowerCase().replace(/ł/g, 'l').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-')}`, i, [[id, 760, 520, 640], ['CHARACTERS-001', 300, 330, 650]]]); }
for (const [name, bn, items] of FRAMES) {
  const layers = [];
  for (const [id, cx, h, bottom, tint] of items) { const f = find(id); if (!f) continue; const { data, info } = await trimmed(f, h, tint); layers.push({ input: data, left: Math.max(0, Math.round(cx - info.width / 2)), top: Math.max(0, Math.round(bottom - info.height)) }); }
  await sharp(await bg(bn)).composite(layers).png().toFile(join(out, 'klatki-startowe', name + '.png'));
}
console.log('zestaw wideo →', out);
