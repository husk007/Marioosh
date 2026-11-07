// Generator grafik z biblioteki promptów przez OpenAI Images API (tools/art-prompts.json = 629 assetów, tools/art-poses.json = 599 póz).
// Klucz WYŁĄCZNIE ze zmiennej środowiskowej OPENAI_API_KEY (nigdy w pliku/repo).
//
//   node tools/gen-art.mjs --category enemies --limit 3 --dry
//   node tools/gen-art.mjs --category characters,bosses --mode both            # baza + wszystkie pozy
//   node tools/gen-art.mjs --ids CHARACTERS-001 --mode poses --states idle,walk,jump_apex
//   node tools/gen-art.mjs --recut                                             # ponowne wycięcie tła z istniejących PNG
//
// --mode base (domyślnie) | poses | both     --states a,b,c (filtr póz)     --quality low|medium|high
// Nazewnictwo: public/art/gen/<kategoria>/<ID>_<slug>__<poza>.png   (poza „base” = neutralna referencja)
//   np. characters/CHARACTERS-001_marioosh__base.png, characters/CHARACTERS-001_marioosh__walk.png
// Pozy są rysowane z użyciem bazy jako obrazu referencyjnego (endpoint /images/edits), by postać była spójna.
// manifest.json: plik -> {asset_id, name, state, target_frames, reference, model, ...}. Istniejące pliki są pomijane (--force nadpisuje).
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, renameSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cutout } from './cutout.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf('--' + n); return i < 0 ? d : (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true); };
const list_ = (v) => String(v === true ? '' : v).split(',').filter(Boolean);
const categories = list_(opt('category', '')).filter((c) => c !== 'all'), ids = list_(opt('ids', '')), states = list_(opt('states', ''));
const limit = Number(opt('limit', 0)) || Infinity, quality = String(opt('quality', 'medium')), force = !!opt('force', false), dry = !!opt('dry', false), recut = !!opt('recut', false);
const mode = String(opt('mode', 'base')), model = String(opt('model', 'gpt-image-2')), conc = Math.max(1, Number(opt('concurrency', 2)));
const base = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
const key = process.env.OPENAI_API_KEY;
if (!key && !dry && !recut) { console.error('Brak OPENAI_API_KEY w środowisku.'); process.exit(2); }

const assets = JSON.parse(readFileSync(join(root, 'tools', 'art-prompts.json'), 'utf8'));
const poseJobs = JSON.parse(readFileSync(join(root, 'tools', 'art-poses.json'), 'utf8'));
const outDir = join(root, 'public', 'art', 'gen');
const slug = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l').replace(/Ł/g, 'L').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
const fileOf = (a, state) => join(outDir, a.category, `${a.asset_id}_${slug(a.name)}__${state}.png`);

function sizeFor(a) {   // gpt-image: 1024x1024, 1536x1024, 1024x1536
  const m = /(\d+)x(\d+)/.exec(a.source_size || ''); if (!m) return '1024x1024';
  const r = Number(m[1]) / Number(m[2]);
  return r > 1.15 ? '1536x1024' : r < 0.87 ? '1024x1536' : '1024x1024';
}
const OPAQUE = new Set(['level-backgrounds', 'story-illustrations']);
const wantsAlpha = (a) => !OPAQUE.has(a.category);
const AVOID = (a) => `\nAVOID (must not appear): ${a.negative_prompt_en}`;
const REFERENCE = 'REFERENCE IMAGE: the attached image is the approved model of this exact character/object. Keep identical design, proportions, colors, costume, horns, tools, line style and scale; change ONLY the pose/state described below. Same side-facing direction, same feet baseline, plain flat white background.\n';

// --- wywołania API z ponawianiem i adaptacją parametrów --------------------------------------
async function call(a, prompt, refPng) {
  const body = { model, prompt: prompt.slice(0, 30000), size: sizeFor(a), quality, n: 1, output_format: 'png' };
  if (wantsAlpha(a) && !refPng) body.background = 'transparent';
  let last = '';
  for (let t = 0; t < 5; t++) {
    let r;
    if (refPng) {
      const fd = new FormData();
      for (const [k, v] of Object.entries(body)) fd.append(k, String(v));
      fd.append('image[]', new Blob([refPng], { type: 'image/png' }), 'reference.png');
      r = await fetch(base + '/images/edits', { method: 'POST', headers: { Authorization: 'Bearer ' + key }, body: fd });
    } else {
      r = await fetch(base + '/images/generations', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key }, body: JSON.stringify(body) });
    }
    if (r.ok) { const j = await r.json(); const b64 = j.data?.[0]?.b64_json; if (!b64) throw new Error('brak b64_json'); return Buffer.from(b64, 'base64'); }
    const txt = (await r.text()).slice(0, 400); last = `HTTP ${r.status}: ${txt}`;
    if (/insufficient_quota|billing_hard_limit|exceeded your current quota/i.test(txt)) throw new Error(last + '  [BRAK ŚRODKÓW / LIMIT NA KONCIE — doładuj saldo w platform.openai.com → Billing]');
    if (r.status === 429 || r.status >= 500) { console.log(`  ponowienie ${t + 1}/5 po ${last.slice(0, 120)}`); await new Promise((s) => setTimeout(s, 2000 * 2 ** t)); continue; }
    if (r.status === 400) { const prm = /"param":\s*"([\w[\]]+)"/.exec(txt)?.[1]; if (prm && ['background', 'quality', 'output_format', 'size', 'n'].includes(prm) && prm in body) { console.log(`  model nie przyjmuje „${prm}” — pomijam i ponawiam`); delete body[prm]; t--; continue; } }
    throw new Error(last);
  }
  throw new Error('zbyt wiele ponowień; ostatni błąd: ' + last);
}

// --- manifest ----------------------------------------------------------------------------------
const manifestPath = join(outDir, 'manifest.json');
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {};
const save = () => { mkdirSync(outDir, { recursive: true }); writeFileSync(manifestPath, JSON.stringify(manifest, null, 1)); };

// --- migracja ze starego nazewnictwa (<ID>.png -> <ID>_<slug>__base.png) -----------------------
function migrate() {
  if (!existsSync(outDir)) return;
  for (const a of assets) {
    const old = join(outDir, a.category, a.asset_id + '.png');
    if (existsSync(old) && !existsSync(fileOf(a, 'base'))) { renameSync(old, fileOf(a, 'base')); console.log('przemianowano', a.asset_id + '.png →', fileOf(a, 'base').split('/').pop()); }
    if (manifest[a.asset_id]) { const m = manifest[a.asset_id]; delete manifest[a.asset_id]; manifest[`${a.category}/${fileOf(a, 'base').split('/').pop()}`] = { asset_id: a.asset_id, name: a.name, category: a.category, state: 'base', target_frames: 1, reference: null, size: m.size, quality: m.quality, model: m.model, cutout: m.cutout }; }
  }
}

if (recut) {
  let n = 0;
  for (const c of readdirSync(outDir, { withFileTypes: true }).filter((e) => e.isDirectory())) for (const f of readdirSync(join(outDir, c.name)).filter((f) => f.endsWith('.png'))) {
    const fp = join(outDir, c.name, f), r = cutout(readFileSync(fp), null);
    if (r.mode !== 'none') { writeFileSync(fp, r.buf); n++; }
  }
  console.log('Ponownie wycięto tło w', n, 'plikach'); process.exit(0);
}
migrate(); save();

// --- plan pracy ----------------------------------------------------------------------------------
const PRIORITY = ['characters', 'bosses', 'enemies', 'character-variants', 'boss-variants', 'enemy-variants', 'civilians'];
const rank = (c) => { const i = PRIORITY.indexOf(c); return i < 0 ? 99 : i; };
let todo = assets.filter((a) => (!categories.length || categories.includes(a.category)) && (!ids.length || ids.includes(a.asset_id)));
todo.sort((x, y) => rank(x.category) - rank(y.category));
const jobsOf = (a) => poseJobs.filter((j) => j.asset_id === a.asset_id && (!states.length || states.includes(j.state)));
const needBase = (a) => (mode === 'base' || mode === 'both') && (force || !existsSync(fileOf(a, 'base')));
const needPoses = (a) => (mode === 'poses' || mode === 'both') ? jobsOf(a).filter((j) => force || !existsSync(fileOf(a, j.state))) : [];
todo = todo.filter((a) => needBase(a) || needPoses(a).length).slice(0, limit);
const total = todo.reduce((n, a) => n + (needBase(a) ? 1 : 0) + needPoses(a).length, 0);
console.log(`Assetów: ${todo.length}, obrazów do wygenerowania: ${total} (tryb ${mode}, model ${model}, jakość ${quality})`);

async function finish(a, state, png, extra) {
  let cut = 'n/a';
  if (wantsAlpha(a)) { const r = cutout(png, null); png = r.buf; cut = r.mode; if (r.mode === 'none') console.log('  uwaga: nie wykryto tła do wycięcia (sprawdź ręcznie):', a.asset_id, state); }
  const fp = fileOf(a, state); mkdirSync(dirname(fp), { recursive: true }); writeFileSync(fp, png);
  manifest[`${a.category}/${fp.split('/').pop()}`] = { asset_id: a.asset_id, name: a.name, category: a.category, state, target_frames: extra.frames, reference: extra.ref, size: sizeFor(a), quality, model, cutout: cut };
  save();
  return png;
}

let ok = 0, fail = 0, stop = false, idx = 0;
async function doAsset(a) {
  let basePng = null;
  const bf = fileOf(a, 'base');
  if (needBase(a)) {
    if (dry) console.log(`[dry] ${a.asset_id} ${a.name} base ${sizeFor(a)}`);
    else try { basePng = await finish(a, 'base', await call(a, a.prompt_en + AVOID(a)), { frames: 1, ref: null }); ok++; console.log('ok  ', a.asset_id, a.name, 'base'); } catch (e) { fail++; console.log('FAIL', a.asset_id, 'base -', e.message); if (/HTTP 40[13]|BRAK ŚRODKÓW/.test(e.message)) stop = true; return; }
  } else if (existsSync(bf)) basePng = readFileSync(bf);
  for (const j of needPoses(a)) {
    if (stop) return;
    if (dry) { console.log(`[dry] ${a.asset_id} ${a.name} poza=${j.state} (klatek docelowo ${j.target_frames}) ref=${basePng || existsSync(bf) ? 'tak' : 'brak (zostanie wygenerowana wcześniej)'}`); continue; }
    try {
      const prompt = (basePng ? REFERENCE : '') + j.prompt_en + AVOID(a);
      await finish(a, j.state, await call(a, prompt, basePng), { frames: j.target_frames, ref: basePng ? bf.split('/').pop() : null }); ok++; console.log('ok  ', a.asset_id, a.name, j.state);
    } catch (e) { fail++; console.log('FAIL', a.asset_id, j.state, '-', e.message); if (/HTTP 40[13]|BRAK ŚRODKÓW/.test(e.message)) { stop = true; return; } }
  }
}
async function worker() { while (idx < todo.length && !stop) await doAsset(todo[idx++]); }
await Promise.all(Array.from({ length: conc }, worker));
console.log(`Gotowe: ${ok} ok, ${fail} błędów`);
process.exit(fail && !ok ? 1 : 0);
