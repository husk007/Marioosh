// Składa jeden samodzielny plik HTML z dist/ (CSS, czcionki, JS, grafiki jako data: URI) — do podglądu w przeglądarce lub jako artefakt.
// Użycie: npm run build && node scripts/make-single-html.mjs [wyjście.html]   (domyślnie dist-single/Marioosh.html)
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';

const dist = join(process.cwd(), 'dist'), outFile = process.argv[2] || join(process.cwd(), 'dist-single', 'Marioosh.html');
const MIME = { '.woff2': 'font/woff2', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.png': 'image/png' };
const uri = (f) => `data:${MIME[extname(f)]};base64,${readFileSync(f).toString('base64')}`;
const walk = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; });

let html = readFileSync(join(dist, 'index.html'), 'utf8');
// czcionki w CSS -> data URI
html = html.replace(/url\(\.\/(fonts\/[^)]+?\.woff2)\)/g, (_, f) => `url(${uri(join(dist, f))})`);
html = html.replace(/<link rel="(manifest|icon)"[^>]*>\s*/g, '');
// grafiki: pakiet gry (po nazwie pliku) i SVG HD (po ścieżce, przez podmianę Image.src)
const gen = {}; for (const f of walk(join(dist, 'art', 'game'))) if (f.endsWith('.webp')) gen[f.split('/').pop()] = uri(f);
const svg = {}; for (const f of existsSync(join(dist, 'art', 'hd')) ? walk(join(dist, 'art', 'hd')) : []) if (f.endsWith('.svg')) svg[f.slice(dist.length + 1)] = uri(f);
const prelude = `window.__MARIOOSH_DEBUG=true;window.__NO_FILE_MUSIC=true;window.__GENMAP=${JSON.stringify(gen)};(function(){var M=${JSON.stringify(svg)},d=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');Object.defineProperty(HTMLImageElement.prototype,'src',{configurable:true,get:function(){return d.get.call(this)},set:function(v){var s=String(v),i=s.indexOf('art/hd/');d.set.call(this,i>=0&&M[s.slice(i)]?M[s.slice(i)]:v)}})})();\n`;
const m = /<script type="module" crossorigin src="\.\/(assets\/[^"]+\.js)"><\/script>/.exec(html);
if (!m) throw new Error('nie znaleziono skryptu modułu w dist/index.html');
const js = readFileSync(join(dist, m[1]), 'utf8').replace(/<\/script/gi, '<\\/script');
html = html.replace(m[0], '').replace('</body>', `<script type="module">${prelude}${js}</script>\n</body>`);
mkdirSync(dirname(outFile), { recursive: true }); writeFileSync(outFile, html);
console.log(`single html: ${(html.length / 1048576).toFixed(2)} MB → ${outFile}`);
