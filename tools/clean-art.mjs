// Czyści tła w gotowych WebP (public/art/gen): usuwa jasne, neutralne obszary połączone z krawędzią
// oraz "zamknięte" szachownice (dziury w pierścieniach, uchwytach, szybach), które API zostawia zamiast przezroczystości.
// Użycie:
//   node tools/clean-art.mjs --report                # tylko raport (ile pikseli tła zostało w każdym pliku)
//   node tools/clean-art.mjs --apply [--only ID,ID]  # nadpisuje pliki (z alfą), dopisuje cutout:"post" w manifeście
//   node tools/clean-art.mjs --preview <dir>         # zapisuje "przed/po" jako PNG do podglądu
import sharp from 'sharp';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const gen = join(root, 'public', 'art', 'gen');
const manPath = join(gen, 'manifest.json');
const manifest = JSON.parse(readFileSync(manPath, 'utf8'));
const argv = process.argv.slice(2);
const has = (f) => argv.includes(f), val = (f) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : null; };
const only = val('--only') ? new Set(val('--only').split(',')) : null;
const MIN_LIGHT = 200, MAX_SPREAD = 16;

function labelComps(mask, w, h, px) {
  const n = w * h, lab = new Int32Array(n), comps = [], stack = [];
  for (let s0 = 0; s0 < n; s0++) {
    if (!mask[s0] || lab[s0]) continue;
    const id = comps.length + 1; let area = 0, edge = false, white = 0, grey = 0; stack.push(s0); lab[s0] = id;
    while (stack.length) {
      const p = stack.pop(); area++; const x = p % w, y = (p / w) | 0;
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) edge = true;
      if (px[p * 4] >= 249) white++; else grey++;
      if (x > 0 && mask[p - 1] && !lab[p - 1]) { lab[p - 1] = id; stack.push(p - 1); }
      if (x < w - 1 && mask[p + 1] && !lab[p + 1]) { lab[p + 1] = id; stack.push(p + 1); }
      if (y > 0 && mask[p - w] && !lab[p - w]) { lab[p - w] = id; stack.push(p - w); }
      if (y < h - 1 && mask[p + w] && !lab[p + w]) { lab[p + w] = id; stack.push(p + w); }
    }
    comps.push({ id, area, edge, white, grey });
  }
  return { lab, comps };
}
// Zwraca maskę pikseli do usunięcia: (1) jasne neutralne obszary połączone z krawędzią,
// (2) "zamknięte" szachownice rozpoznane po dwóch płaskich poziomach jasności (biel ~252 i szarość ~236).
function analyse(px, w, h) {
  const n = w * h, light = new Uint8Array(n), chk = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const r = px[i * 4], g = px[i * 4 + 1], b = px[i * 4 + 2], a = px[i * 4 + 3];
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    const neutral = a > 200 && mx - mn <= MAX_SPREAD;
    light[i] = neutral && mn >= MIN_LIGHT ? 1 : 0;
    chk[i] = neutral && (mn >= 249 || (mn >= 232 && mx <= 241)) ? 1 : 0;
  }
  const kill = new Uint8Array(n); let edgeR = 0, inner = 0;
  const E = labelComps(light, w, h, px);
  for (const c of E.comps) if (c.edge && c.area >= 30) { edgeR += c.area; for (let i = 0; i < n; i++) if (E.lab[i] === c.id) kill[i] = 1; }
  const C = labelComps(chk, w, h, px), seed = new Uint8Array(n);
  for (const c of C.comps) if (!c.edge && c.area >= 220 && c.white >= 0.2 * c.area && c.grey >= 0.2 * c.area) for (let i = 0; i < n; i++) if (C.lab[i] === c.id) seed[i] = 1;
  // rozszerz o 3 px w obrębie jasnych neutralnych pikseli (antyaliasing krawędzi pól szachownicy)
  let cur = seed;
  for (let it = 0; it < 3; it++) {
    const nx = Uint8Array.from(cur);
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const i = y * w + x; if (!nx[i] && light[i] && (cur[i - 1] || cur[i + 1] || cur[i - w] || cur[i + w])) nx[i] = 1; }
    cur = nx;
  }
  for (let i = 0; i < n; i++) if (cur[i] && !kill[i]) { kill[i] = 1; inner++; }
  return { kill, edgeR, inner };
}

async function load(file) { const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true }); return { px: data, w: info.width, h: info.height }; }

const files = Object.entries(manifest).filter(([, m]) => !only || only.has(m.asset_id) || only.has(m.asset_id + '__' + m.state));
const report = [];
for (const [key, m] of files) {
  const file = join(gen, key); if (!existsSync(file)) continue;
  const { px, w, h } = await load(file); const { kill, edgeR, inner } = analyse(px, w, h);
  const removed = edgeR + inner;
  report.push({ key, cat: m.category, id: m.asset_id, state: m.state, pct: +(100 * removed / (w * h)).toFixed(2), edgeR, inner });
  if (has('--apply') && removed >= 1500) {
    const out = Buffer.from(px);
    for (let i = 0; i < w * h; i++) if (kill[i]) out[i * 4 + 3] = 0;
    // zmiękczenie krawędzi: piksel sąsiadujący z usuniętym i jasny/neutralny dostaje częściową alfę
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      const i = y * w + x; if (out[i * 4 + 3] === 0) continue;
      if (out[(i - 1) * 4 + 3] && out[(i + 1) * 4 + 3] && out[(i - w) * 4 + 3] && out[(i + w) * 4 + 3]) continue;
      const r = out[i * 4], g = out[i * 4 + 1], b = out[i * 4 + 2], mn = Math.min(r, g, b);
      if (mn > 170 && Math.max(r, g, b) - mn <= 30) out[i * 4 + 3] = Math.round(out[i * 4 + 3] * 0.35);
    }
    await sharp(out, { raw: { width: w, height: h, channels: 4 } }).webp({ quality: 90, alphaQuality: 100, effort: 5 }).toFile(file + '.tmp');
    (await import('node:fs')).renameSync(file + '.tmp', file);
    manifest[key].cutout = 'post';
    if (val('--preview')) { mkdirSync(val('--preview'), { recursive: true }); await sharp(out, { raw: { width: w, height: h, channels: 4 } }).png().toFile(join(val('--preview'), key.replace(/\//g, '_').replace('.webp', '.png'))); }
  }
}
if (has('--apply')) writeFileSync(manPath, JSON.stringify(manifest, null, 1));
report.sort((a, b) => b.pct - a.pct);
if (has('--report') || !has('--apply')) { for (const r of report.filter((r) => r.pct > 0)) console.log(`${String(r.pct).padStart(6)}%  krawędź ${String(r.edgeR).padStart(7)}  wnętrze ${String(r.inner).padStart(6)}  ${r.id} ${r.state}  (${r.cat})`); console.log(`plików z tłem do usunięcia: ${report.filter((r) => r.pct > 0).length} / ${report.length}`); }
else console.log(`oczyszczono: ${report.filter((r) => r.pct > 0).length} plików`);
