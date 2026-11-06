// Test dymny e2e: serwuje dist/, otwiera grę w Chromium, sprawdza 6 języków, przechodzi menu i chwilę gra.
// Uruchom: npm run build && npm run test:e2e   (zrzuty ekranu: e2e/out/). PW_CHROMIUM=/ścieżka/do/chrome — własna przeglądarka.
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist'), out = join(root, 'e2e', 'out');
if (!existsSync(join(dist, 'index.html'))) { console.error('Brak dist/ — uruchom: npm run build'); process.exit(2); }
mkdirSync(out, { recursive: true });
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json', '.json': 'application/json', '.png': 'image/png' };
const server = createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const f = join(dist, p); if (!f.startsWith(dist) || !existsSync(f) || !statSync(f).isFile()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': MIME[extname(f)] ?? 'application/octet-stream' }); res.end(readFileSync(f));
});
await new Promise((r) => server.listen(0, r));
const base = `http://localhost:${server.address().port}/`;

const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined, args: ['--autoplay-policy=no-user-gesture-required'] });
const errors = []; let failed = 0;
const check = (ok, msg) => { console.log(`${ok ? 'OK  ' : 'FAIL'} ${msg}`); if (!ok) failed++; };

async function distinctColors(page) {
  return page.evaluate(() => {
    const c = document.getElementById('game'); const x = c.getContext('2d'); const d = x.getImageData(0, 0, c.width, c.height).data;
    const set = new Set(); for (let i = 0; i < d.length; i += 4 * 97) set.add((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]); return set.size;
  });
}
// nazwy klas są zminimalizowane w buildzie, więc rozpoznajemy scenę po polach
const scene = (page) => page.evaluate(() => { const s = window.__app.scene; return s.world && s.world.players ? 'PlayScene' : s.menu ? 'Menu:' + (s.menu.items?.length ?? '?') : 'Other:' + Object.keys(s).slice(0, 3).join(','); });

for (const lang of ['pl', 'en', 'zh', 'es', 'sw', 'ar']) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, locale: lang });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`[${lang}] ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`[${lang}] ${m.text()}`); });
  await page.addInitScript((l) => { try { localStorage.setItem('marioosh.settings.v1', JSON.stringify({ v: 1, lang: l })); } catch { /* */ } }, lang);
  await page.goto(base); await page.waitForFunction(() => window.__app && window.__app.scene, null, { timeout: 15000 });
  await page.waitForTimeout(600); await page.keyboard.press('Enter'); await page.waitForTimeout(500);
  check((await distinctColors(page)) > 12, `tytuł (${lang}) rysuje obraz`);
  await page.screenshot({ path: join(out, `title-${lang}.png`) });
  if (lang === 'ar') check(await page.evaluate(() => document.documentElement.dir === 'rtl' || window.__app.g.lang === 'ar'), 'arabski: tryb RTL aktywny');
  await ctx.close();
}

// przejście przez menu i krótka gra po angielsku
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`[play] ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`[play] ${m.text()}`); });
  await page.addInitScript(() => { try { localStorage.setItem('marioosh.settings.v1', JSON.stringify({ v: 1, lang: 'en' })); } catch { /* */ } });
  await page.goto(base); await page.waitForFunction(() => window.__app && window.__app.scene);
  await page.waitForTimeout(500);
  const seen = [await scene(page)];
  for (let i = 0; i < 60; i++) {
    await page.keyboard.press("Enter"); await page.waitForTimeout(350);
    const s = await scene(page); if (seen[seen.length - 1] !== s) seen.push(s);
    if (s === 'PlayScene') break;
  }
  console.log('sceny:', seen.join(' → '));
  check(seen.includes('PlayScene'), 'z menu da się wejść do rozgrywki');
  if (seen.includes('PlayScene')) {
    await page.waitForTimeout(2200);
    await page.keyboard.down('ArrowRight'); await page.keyboard.down('ShiftLeft');
    for (let i = 0; i < 6; i++) { await page.keyboard.press('Space'); await page.waitForTimeout(450); }
    await page.keyboard.up('ArrowRight'); await page.keyboard.up('ShiftLeft');
    await page.screenshot({ path: join(out, 'play-en.png') });
    check((await scene(page)) === 'PlayScene', 'gra działa po kilku sekundach biegu');
    check((await distinctColors(page)) > 20, 'plansza rysuje bogaty obraz');
  }
  await ctx.close();
}
await browser.close(); server.close();
check(errors.length === 0, `brak błędów w konsoli (${errors.length})`);
for (const e of errors.slice(0, 10)) console.log('  ', e);
process.exit(failed ? 1 : 0);
