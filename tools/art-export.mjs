// Eksport grafik (generowanych proceduralnie w kodzie) do PNG w docs/art/. Uruchom: node tools/art-export.mjs
// Wymaga: npm i (vite, playwright-core) oraz przeglądarki (npx playwright install chromium) lub PW_CHROMIUM=/ścieżka.
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'docs', 'art'); mkdirSync(out, { recursive: true });
const server = await createServer({ root, server: { port: 5199, strictPort: true }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
await page.goto('http://localhost:5199/');
await page.waitForFunction(() => window.__app, null, { timeout: 20000 });

async function sheet(name, fn, args = {}) {
  const data = await page.evaluate(async ({ fnSrc, args }) => {
    const art = await import('/src/sprites/art.ts');
    const types = await import('/src/game/types.ts');
    const worlds = await import('/src/data/worlds.ts');
    const f = new Function('art', 'types', 'worlds', 'args', `return (${fnSrc})(art, types, worlds, args);`);
    const cv = f(art, types, worlds, args); return cv.toDataURL('image/png');
  }, { fnSrc: fn.toString(), args });
  writeFileSync(join(out, name), Buffer.from(data.split(',')[1], 'base64')); console.log('[art]', name);
}

// generyczna siatka: rysuje listę obrazków z podpisami
const GRID = `function grid(items, cols, cell, scale, bg) {
  const rows = Math.ceil(items.length / cols); const cv = document.createElement('canvas'); cv.width = cols * cell; cv.height = rows * (cell + 14);
  const x = cv.getContext('2d'); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; x.fillStyle = bg || '#2a2440'; x.fillRect(0, 0, cv.width, cv.height);
  items.forEach((it, i) => { const cx = (i % cols) * cell, cy = Math.floor(i / cols) * (cell + 14); const ss = it.img.ss || 1; const w = it.img.width / ss * scale, h = it.img.height / ss * scale; const k = Math.min(1, (cell - 8) / w, (cell - 8) / h);
    x.drawImage(it.img, cx + (cell - w * k) / 2, cy + 4 + (cell - 8 - h * k), w * k, h * k); x.fillStyle = '#d8d0f0'; x.font = '10px monospace'; x.textAlign = 'center'; x.fillText(it.label, cx + cell / 2, cy + cell + 8); });
  return cv; }`;

await sheet('bracia.png', new Function('return ' + `(art) => { ${GRID}
  const items = []; for (const b of ['M','D']) for (const fr of ['idle','walk0','walk1','jump','attack','climb0','climb1','swim','hurt']) { try { items.push({ img: art.heroSprite(b, fr, false), label: b + ':' + fr }); } catch {} }
  for (const b of ['M','D']) { try { items.push({ img: art.heroSprite(b, 'idle', true), label: b + ':duży' }); } catch {} }
  items.push({ img: art.companionSprite(0), label: 'towarzysz' });
  return grid(items, 9, 110, 2.2); }`)());

await sheet('wrogowie.png', new Function('return ' + `(art, types) => { ${GRID}
  const items = Object.keys(types.ENEMY_CLASS).map((k) => ({ img: art.enemySprite(k, 0, 0), label: k }));
  return grid(items, 7, 110, 2.6); }`)());

await sheet('bossowie.png', new Function('return ' + `(art, types, worlds) => { ${GRID}
  const items = Object.keys(art.BOSS_SIZE).filter((k) => k).map((k) => ({ img: art.bossSprite(k, 0, 0), label: k }));
  return grid(items, 4, 190, 2); }`)());

await sheet('przedmioty.png', new Function('return ' + `(art) => { ${GRID}
  const kinds = ['pet','can','golden','battery','crystal','shard','signet','note','xl','coil','magnet','extender','gloves','star'];
  const items = kinds.map((k) => ({ img: art.itemSprite(k, 0), label: k }));
  items.push({ img: art.crateSprite(false, false), label: 'skrzynka' }, { img: art.checkpointSprite(true, 0), label: 'checkpoint' }, { img: art.exitSprite(true, 0), label: 'wyjście' }, { img: art.ecoportSprite(false, 0), label: 'EcoPort' }, { img: art.lampSprite(0), label: 'lampa' }, { img: art.statueSprite(false, 0), label: 'posąg' }, { img: art.freedSprite(), label: 'uwolniony' });
  for (const c of ['blue','green','yellow','red','purple','black']) items.push({ img: art.cableSprite(c, 'up', 0), label: 'przewód ' + c });
  return grid(items, 8, 96, 3); }`)());

await sheet('kafelki.png', new Function('return ' + `(art) => {
  const cv = document.createElement('canvas'); cv.width = 8 * 4 * 36 + 10; cv.height = 8 * 40 + 20; const x = cv.getContext('2d'); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; x.fillStyle = '#1b1830'; x.fillRect(0, 0, cv.width, cv.height);
  for (let w = 0; w <= 8; w++) { const ts = art.tileset(w); const row = [ts.top[0], ts.top[1], ts.fill[0], ts.oneway, ts.hazard[0], ts.ladder, ts.crumble, ts.cracked, ts.conv[0][0], ts.gate];
    row.forEach((im, i) => x.drawImage(im, 6 + i * 36, 6 + w * 40 - (w > 7 ? 0 : 0), 32, 32)); x.fillStyle = '#d8d0f0'; x.font = '10px monospace'; x.fillText('W' + w, 6 + 10 * 36 + 6, 26 + w * 40); }
  const c2 = document.createElement('canvas'); c2.width = 10 * 36 + 50; c2.height = 9 * 40 + 12; const y = c2.getContext('2d'); y.imageSmoothingEnabled = false; y.drawImage(cv, 0, 0); return c2; }`)());

await sheet('tla.png', new Function('return ' + `(art) => {
  const cv = document.createElement('canvas'); cv.width = 4 * 322; cv.height = 2 * 182; const x = cv.getContext('2d'); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
  for (let w = 1; w <= 8; w++) { const ox = ((w - 1) % 4) * 322 + 1, oy = Math.floor((w - 1) / 4) * 182 + 1; x.save(); x.beginPath(); x.rect(ox, oy, 320, 180); x.clip(); x.translate(ox, oy); x.scale(0.5, 0.5);
    x.drawImage(art.skyImage(w, false), 0, 0, 640, 360); for (const l of [0, 1, 2]) x.drawImage(art.parallaxLayer(w, l), 0, 0); x.restore(); x.fillStyle = '#fff'; x.font = '12px monospace'; x.fillText('Świat ' + w, ox + 6, oy + 16); }
  return cv; }`)());

await browser.close(); await server.close();
