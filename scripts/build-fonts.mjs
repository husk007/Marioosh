// Generuje fonty w public/fonts:
//  - Press Start 2P (łacińskie: pl/en/es/sw) — kopiowane z @fontsource,
//  - Noto Sans SC Bold i Noto Sans Arabic Bold — przycinane (subset) do znaków użytych w tłumaczeniach.
// Wszystkie fonty na licencji SIL OFL 1.1 (zob. docs/LICENSES.md). Pliki binarne nie są commitowane.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import subsetFont from 'subset-font';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'public', 'fonts');
mkdirSync(out, { recursive: true });

for (const f of ['press-start-2p-latin-400-normal.woff2', 'press-start-2p-latin-ext-400-normal.woff2']) {
  copyFileSync(join(root, 'node_modules/@fontsource/press-start-2p/files', f), join(out, f));
}

const i18nDir = join(root, 'src/data/i18n');
const text = (lang) => readFileSync(join(i18nDir, `${lang}.ts`), 'utf8');
const uniq = (s) => [...new Set([...s])].join('');
const ascii = Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)).join('');

const jobs = [
  { lang: 'zh', ttf: '@expo-google-fonts/noto-sans-sc/700Bold/NotoSansSC_700Bold.ttf', name: 'noto-sans-sc-subset.woff2', extra: '，。！？：；、（）《》“”‘’—…·' },
  { lang: 'ar', ttf: '@expo-google-fonts/noto-sans-arabic/700Bold/NotoSansArabic_700Bold.ttf', name: 'noto-sans-arabic-subset.woff2', extra: '،؛؟ـ٠١٢٣٤٥٦٧٨٩' },
];
for (const j of jobs) {
  const src = readFileSync(join(root, 'node_modules', j.ttf));
  const chars = uniq(ascii + j.extra + text(j.lang) + text('en'));
  const buf = await subsetFont(src, chars, { targetFormat: 'woff2' });
  writeFileSync(join(out, j.name), buf);
  console.log(`[fonts] ${j.name}: ${chars.length} znaków, ${(buf.length / 1024).toFixed(1)} KB`);
}
console.log('[fonts] gotowe:', readdirSync(out).join(', '));
