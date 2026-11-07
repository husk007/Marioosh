// Generator grafik z biblioteki promptów (tools/art-prompts.json) przez OpenAI Images API.
// Klucz WYŁĄCZNIE ze zmiennej środowiskowej OPENAI_API_KEY (nigdy w pliku/repo).
//   OPENAI_API_KEY=sk-... node tools/gen-art.mjs --category enemies --limit 3 --quality low
//   node tools/gen-art.mjs --ids ENEMIES-001,CHARACTERS-001 --quality medium
//   node tools/gen-art.mjs --category parallax --dry          (bez sieci: pokazuje, co zostałoby wysłane)
// Wynik: public/art/gen/<kategoria>/<ASSET_ID>.png  + manifest.json. Istniejące pliki są pomijane (--force nadpisuje).
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf('--' + n); return i < 0 ? d : (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true); };
const category = opt('category', ''), ids = String(opt('ids', '')).split(',').filter(Boolean);
const limit = Number(opt('limit', 0)) || Infinity, quality = String(opt('quality', 'medium')), force = !!opt('force', false), dry = !!opt('dry', false);
const model = String(opt('model', 'gpt-image-1')), conc = Math.max(1, Number(opt('concurrency', 2)));
const base = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
const key = process.env.OPENAI_API_KEY;
if (!key && !dry) { console.error('Brak OPENAI_API_KEY w środowisku.'); process.exit(2); }

const all = JSON.parse(readFileSync(join(root, 'tools', 'art-prompts.json'), 'utf8'));
let list = all.filter((a) => (!category || a.category === category) && (!ids.length || ids.includes(a.asset_id)));
const outDir = join(root, 'public', 'art', 'gen');
const pathOf = (a) => join(outDir, a.category, a.asset_id + '.png');
if (!force) list = list.filter((a) => !existsSync(pathOf(a)));
list = list.slice(0, limit);

// rozmiar API (gpt-image-1: 1024x1024, 1536x1024, 1024x1536) wg proporcji źródłowego rozmiaru z biblioteki
function sizeFor(a) {
  const m = /(\d+)x(\d+)/.exec(a.source_size || ''); if (!m) return '1024x1024';
  const r = Number(m[1]) / Number(m[2]);
  return r > 1.15 ? '1536x1024' : r < 0.87 ? '1024x1536' : '1024x1024';
}
const OPAQUE = new Set(['level-backgrounds', 'story-illustrations']);
const bg = (a) => (OPAQUE.has(a.category) ? 'opaque' : 'transparent');
const promptOf = (a) => `${a.prompt_en}\nAVOID (must not appear): ${a.negative_prompt_en}`.slice(0, 30000);

async function gen(a) {
  const body = { model, prompt: promptOf(a), size: sizeFor(a), quality, n: 1, background: bg(a), output_format: 'png' };
  if (dry) { console.log(`[dry] ${a.asset_id} ${a.name} ${body.size} bg=${body.background} q=${quality} prompt=${body.prompt.length}zn`); return null; }
  let last = '';
  for (let t = 0; t < 5; t++) {
    const r = await fetch(base + '/images/generations', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key }, body: JSON.stringify(body) });
    if (r.ok) { const j = await r.json(); const b64 = j.data?.[0]?.b64_json; if (!b64) throw new Error('brak b64_json'); return Buffer.from(b64, 'base64'); }
    const txt = (await r.text()).slice(0, 400);
    last = `HTTP ${r.status}: ${txt}`;
    // 429 z insufficient_quota/billing = brak środków na koncie: ponawianie nic nie da
    if (/insufficient_quota|billing_hard_limit|exceeded your current quota/i.test(txt)) throw new Error(last + '  [BRAK ŚRODKÓW / LIMIT NA KONCIE — doładuj saldo w platform.openai.com → Billing]');
    if (r.status === 429 || r.status >= 500) { console.log(`  ponowienie ${t + 1}/5 po ${last}`); await new Promise((s) => setTimeout(s, 2000 * 2 ** t)); continue; }
    throw new Error(last);   // 400/401/403: nie ponawiaj (np. weryfikacja organizacji, zły klucz, polityka treści)
  }
  throw new Error('zbyt wiele ponowień; ostatni błąd: ' + last);
}

const manifestPath = join(outDir, 'manifest.json');
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {};
let ok = 0, fail = 0, i = 0;
console.log(`Do wygenerowania: ${list.length} (model ${model}, jakość ${quality})`);
async function worker() {
  while (i < list.length) {
    const a = list[i++];
    try {
      const png = await gen(a); if (!png) continue;
      mkdirSync(dirname(pathOf(a)), { recursive: true }); writeFileSync(pathOf(a), png);
      manifest[a.asset_id] = { name: a.name, category: a.category, size: sizeFor(a), quality, model, file: `${a.category}/${a.asset_id}.png` };
      ok++; console.log('ok  ', a.asset_id, a.name);
    } catch (e) { fail++; console.log('FAIL', a.asset_id, a.name, '-', e.message); if (/HTTP 40[13]|BRAK ŚRODKÓW/.test(e.message)) { i = list.length; } }
  }
}
await Promise.all(Array.from({ length: conc }, worker));
if (!dry && ok) { mkdirSync(outDir, { recursive: true }); writeFileSync(manifestPath, JSON.stringify(manifest, null, 1)); }
console.log(`Gotowe: ${ok} ok, ${fail} błędów`);
process.exit(fail && !ok ? 1 : 0);
