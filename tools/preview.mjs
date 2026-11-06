// Podgląd wybranych grafik w dużym powiększeniu: node tools/preview.mjs heroes|tiles|items|enemies  → e2e/out/preview-*.png
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..'); const out = join(root, 'e2e', 'out'); mkdirSync(out, { recursive: true });
const what = process.argv[2] ?? 'heroes';
const server = await createServer({ root, server: { port: 5198, strictPort: true }, logLevel: 'error' }); await server.listen();
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
page.on('pageerror', (e) => console.log('ERR', e.message));
await page.goto('http://localhost:5198/'); await page.waitForFunction(() => window.__app, null, { timeout: 20000 });
const data = await page.evaluate(async (what) => {
  const art = await import('/src/sprites/art.ts');
  const cv = document.createElement('canvas'); cv.width = 1400; cv.height = 900; const x = cv.getContext('2d'); x.fillStyle = '#7fb6d8'; x.fillRect(0, 0, 1400, 900); x.fillStyle = '#5aa05a'; x.fillRect(0, 700, 1400, 200);
  const put = (img, px, py, k, label) => { const s = (img.ss ?? 1); x.imageSmoothingEnabled = k > 3; x.drawImage(img, px, py, img.width / s * k, img.height / s * k); if (label) { x.fillStyle = '#000'; x.font = '12px monospace'; x.fillText(label, px, py - 4); } };
  if (what === 'heroes') {
    const fr = ['idle', 'walk0', 'walk1', 'jump', 'attack', 'climb0', 'climb1', 'swim', 'hurt'];
    ['M', 'D'].forEach((b, r) => fr.forEach((f, i) => put(art.heroSprite(b, f, false), 20 + i * 150, 30 + r * 230, 4.2, b + ':' + f)));
    ['M', 'D'].forEach((b, i) => put(art.heroSprite(b, 'idle', true), 20 + i * 150, 480, 4.2, b + ' big'));
    ['M', 'D'].forEach((b, i) => put(art.heroSprite(b, 'idle', false), 420 + i * 70, 560, 1, '1x'));
    ['M', 'D'].forEach((b, i) => put(art.heroSprite(b, 'walk0', false, true), 620 + i * 150, 480, 4.2, 'night'));
  } else if (what === 'items') {
    const kinds = ['pet','can','golden','battery','crystal','shard','signet','note','xl','coil','magnet','extender','gloves','star'];
    kinds.forEach((k, i) => put(art.itemSprite(k, 0), 20 + (i % 7) * 190, 40 + Math.floor(i / 7) * 150, 6, k));
    put(art.crateSprite(false, false), 20, 340, 4, 'crate'); put(art.crateSprite(true, false), 200, 340, 4, 'hid'); put(art.crateSprite(false, true), 380, 340, 4, 'used');
    ['blue','green','yellow','red','purple','black'].forEach((c, i) => put(art.cableSprite(c, 'up', 0), 20 + i * 150, 520, 4, c));
  } else if (what === 'objs') {
    const L = [['eco0', art.ecoportSprite(false, 0)], ['ecoBroken', art.ecoportSprite(true, 0)], ['cp0', art.checkpointSprite(false, 0)], ['cp1', art.checkpointSprite(true, 0)], ['exit', art.exitSprite(true, 0)], ['sw', art.switchSprite('lever', false)], ['swOn', art.switchSprite('lever', true)], ['lamp', art.lampSprite(0)], ['lantern', art.lanternSprite(true)], ['sign', art.signSprite(1)], ['statue', art.statueSprite(false, 0)], ['freed', art.freedSprite()], ['comp', art.companionSprite(0)]];
    L.forEach(([n, im], i) => put(im, 20 + (i % 7) * 190, 40 + Math.floor(i / 7) * 250, 3, n));
    ['rogomir','zlomotaur','kaktogor','rogopletw','ceratopsor','krukorog','rogodron','katoblepas'].forEach((b, i) => { try { const im = art.bossSprite(b, 0, 0); put(im, 10 + (i % 4) * 340, 380 + Math.floor(i / 4) * 160, 3, b); } catch (e) {} });
  } else if (what === 'enemies') {
    const k = ['rogus','baranitor','bykobieg','zukorog','cmorog','pszczolrog','rogowrobel','krukorog','gekorog','bazalisk','rogopletw','osmiorog','kakturozec','rogopnacze','rogoroza','slimorog','rogoskoczek','kamienirog','dron'];
    k.forEach((e, i) => put(art.enemySprite(e, 0, 0), 20 + (i % 7) * 190, 40 + Math.floor(i / 7) * 170, 4, e));
  }
  return cv.toDataURL('image/png');
}, what);
writeFileSync(join(out, `preview-${what}.png`), Buffer.from(data.split(',')[1], 'base64'));
await browser.close(); await server.close(); console.log('ok', what);
