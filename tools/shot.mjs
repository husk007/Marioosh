// Zrzuty rozgrywki do podglądu grafiki: node tools/shot.mjs W1-L1[,W3-L2...] [sekundy] [x_px] ; wymaga `npm run build`
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
const root = join(dirname(fileURLToPath(import.meta.url)), '..'); const dist = join(root, 'dist'); const out = join(root, 'e2e', 'out'); mkdirSync(out, { recursive: true });
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json', '.png': 'image/png' };
const server = createServer((req, res) => { let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html'; const f = join(dist, p); if (!existsSync(f) || !statSync(f).isFile()) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': MIME[extname(f)] ?? 'application/octet-stream' }); res.end(readFileSync(f)); });
await new Promise((r) => server.listen(0, r));
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined, args: ['--autoplay-policy=no-user-gesture-required'] });
const ids = (process.argv[2] ?? 'W1-L1').split(','); const secs = Number(process.argv[3] ?? 2);
for (const id of ids) {
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 })).newPage();
  page.on('pageerror', (e) => console.log('ERR', e.message));
  await page.goto(`http://localhost:${server.address().port}/?debug=1`); await page.waitForFunction(() => window.__app && window.__app.scene && window.__play);
  await page.evaluate((i) => window.__play(i), id); await page.waitForTimeout(500);
  await page.keyboard.press('Enter'); await page.keyboard.down('ArrowRight'); await page.keyboard.down('Shift'); await page.waitForTimeout(secs * 1000);
  await page.keyboard.up('ArrowRight'); await page.keyboard.up('Shift');
  await page.screenshot({ path: join(out, `play-${id}.png`) }); console.log('zrzut', id);
}
await browser.close(); server.close();
