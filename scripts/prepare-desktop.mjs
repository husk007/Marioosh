// Kopiuje dist/ do desktop/app i rasteryzuje ikonę (icon.svg -> desktop/icon.png 512x512), jeśli dostępny jest Playwright.
import { cpSync, rmSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
if (!existsSync(join(root, 'dist', 'index.html'))) { console.error('Brak dist/ — uruchom najpierw: npm run build'); process.exit(1); }
rmSync(join(root, 'desktop', 'app'), { recursive: true, force: true });
cpSync(join(root, 'dist'), join(root, 'desktop', 'app'), { recursive: true });
const png = join(root, 'desktop', 'icon.png');
if (!existsSync(png)) {
  const { chromium } = await import('playwright-core');
  const svg = readFileSync(join(root, 'public', 'icon.svg'), 'utf8');
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 512, height: 512 } });
  await p.setContent(`<body style="margin:0;background:transparent">${svg.replace('<svg', '<svg width="512" height="512"')}</body>`);
  writeFileSync(png, await p.screenshot({ omitBackground: true })); await b.close();
}
mkdirSync(join(root, 'desktop'), { recursive: true });
console.log('[desktop] gotowe: desktop/app + desktop/icon.png');
