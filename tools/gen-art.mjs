// Generator grafik z biblioteki promptów przez OpenAI Images API
//   tools/art-prompts.json = 629 assetów (postacie, bossowie, wrogowie, przedmioty, kafelki podłoża, rekwizyty, paralaksa, tła poziomów, menu/interfejs, ilustracje fabularne)
//   tools/art-poses.json   = 599 póz (stany animacji)
// Klucz WYŁĄCZNIE ze zmiennej środowiskowej OPENAI_API_KEY (nigdy w pliku/repo).
//
//   node tools/gen-art.mjs --category all --mode base            # 1) wszystkie BAZY (najpierw podstawowe, potem zależne od nich)
//   node tools/gen-art.mjs --category all --mode poses           # 2) wszystkie POZY (z bazami postaci/przedmiotów jako referencjami)
//   node tools/gen-art.mjs --ids CHARACTERS-001 --mode both --states idle,walk --dry
//   node tools/gen-art.mjs --list-categories                     # kategorie w kolejności produkcji
//   node tools/gen-art.mjs --recut                               # ponowne wycięcie tła ze wszystkich PNG
// Opcje: --limit N (assetów)  --quality low|medium|high  --model ...  --concurrency N  --force  --dry
//
// REFERENCJE (obrazy wejściowe dla /images/edits — kolejność = numeracja „Image 1, 2…” w prompcie):
//   baza wariantu/mieszkańca  ← baza „rodzica” (reference_asset_id z biblioteki)
//   wariant z przedmiotem     ← + baza przedmiotu (cewka, magnes, gwiazda, latarnia…)
//   poza postaci/wroga/bossa  ← baza tej postaci (+ przedmiot/obiekt, którego użycie pokazuje poza: panel, blok, przewód, brat…)
//   kafelki, rekwizyty, paralaksa, tła poziomów ← kafelek wzorcowy planety („solid-center”) jako próbka palety/materiału
//   ilustracje fabularne, portrety, menu ← bazy bohaterów/Katoblepasa wymienionych w opisie
// Nazewnictwo: public/art/gen/<kategoria>/<ID>_<slug>__<poza>.png  (poza „base” = neutralna referencja). manifest.json zapisuje użyte referencje.
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, renameSync, unlinkSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cutout } from './cutout.mjs';
import sharp from 'sharp';

let ingesting = false;
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf('--' + n); return i < 0 ? d : (args[i + 1] !== undefined && !args[i + 1].startsWith('--') && args[i + 1] !== '' ? args[i + 1] : true); };
const list_ = (v) => String(v === true ? '' : v).split(',').filter(Boolean);
const categories = list_(opt('category', '')).filter((c) => c !== 'all'), ids = list_(opt('ids', '')), states = list_(opt('states', ''));
const limit = Number(opt('limit', 0)) || Infinity, quality = String(opt('quality', 'medium')), force = !!opt('force', false), dry = !!opt('dry', false), recut = !!opt('recut', false);
const mode = String(opt('mode', 'base')), model = String(opt('model', 'gpt-image-2')), conc = Math.max(1, Number(opt('concurrency', 2)));
const base = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
const key = process.env.OPENAI_API_KEY;

const assets = JSON.parse(readFileSync(join(root, 'tools', 'art-prompts.json'), 'utf8'));
const poseJobs = JSON.parse(readFileSync(join(root, 'tools', 'art-poses.json'), 'utf8'));
const byId = Object.fromEntries(assets.map((a) => [a.asset_id, a]));
const outDir = join(root, 'public', 'art', 'gen');
const slug = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l').replace(/Ł/g, 'L').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
const origDir = process.env.ART_ORIGINALS_DIR || join(root, 'art-originals');   // pełna rozdzielczość (poza repo; workflow wrzuca jako artefakt)
const fileOf = (a, state) => join(outDir, a.category, `${a.asset_id}_${slug(a.name)}__${state}.webp`);
const origOf = (a, state) => join(origDir, a.category, `${a.asset_id}_${slug(a.name)}__${state}.webp`);
// do repo trafia pomniejszone WebP (dłuższy bok: duże tła/ilustracje 1280 px, reszta 768 px); pełna wersja idzie do art-originals/
const BIG = (a) => ['level-backgrounds', 'parallax', 'story-illustrations'].includes(a.category) || (a.category === 'interface' && /Background|Map Card/i.test(a.name));
async function encode(a, png) {
  const m = BIG(a) ? 1280 : 768;
  const full = await sharp(png).webp({ quality: 95, alphaQuality: 100 }).toBuffer();
  const small = await sharp(png).resize({ width: m, height: m, fit: 'inside', withoutEnlargement: true }).webp({ quality: 88, alphaQuality: 100 }).toBuffer();
  return { full, small };
}
const toPng = (buf) => sharp(buf).png().toBuffer();   // referencje wysyłamy do API jako PNG
const keyOf = (a, state) => `${a.category}/${basename(fileOf(a, state))}`;

// kolejność produkcji: najpierw to, na czym opiera się reszta
const PRIORITY = ['characters', 'bosses', 'enemies', 'collectibles', 'interactables', 'conduits', 'planet-tiles', 'mechanics', 'civilians', 'planet-props', 'parallax', 'level-backgrounds', 'character-variants', 'boss-variants', 'enemy-variants', 'interface', 'story-illustrations', 'effects'];
const rank = (c) => { const i = PRIORITY.indexOf(c); return i < 0 ? 99 : i; };
if (opt('list-categories', false)) { console.log(PRIORITY.filter((c) => assets.some((a) => a.category === c)).join(',')); process.exit(0); }
if (!key && !dry && !recut && !opt('migrate', false) && !opt('plan', false) && !opt('ingest', false)) { console.error('Brak OPENAI_API_KEY w środowisku.'); process.exit(2); }

// --- reguły referencji ---------------------------------------------------------------------------
const anchorOf = (planet) => assets.find((x) => x.category === 'planet-tiles' && x.planet === planet && /solid-center$/i.test(x.name));
const HEROES = { Marioosh: 'CHARACTERS-001', Darioosh: 'CHARACTERS-002', Scarlet: 'CHARACTERS-003', Katoblepas: 'BOSSES-001' };
const ITEM_FOR_VARIANT = { coil_equipped: 'COLLECTIBLES-007', magnet_equipped: 'COLLECTIBLES-008', invincible: 'COLLECTIBLES-011', uncursed: 'COLLECTIBLES-017', shielded: 'INTERACTABLES-020' };
const POSE_EXTRAS = {   // poza → dodatkowy obiekt/postać, którego użycie poza pokazuje
  'CHARACTERS-001': { interact_panel: ['INTERACTABLES-006', 'item'], push: ['INTERACTABLES-009', 'item'], climb_wire: ['CONDUITS-003', 'item'], teleport_entry: ['CONDUITS-001', 'item'], revive_brother: ['CHARACTERS-002', 'character'] },
  'CHARACTERS-002': { interact_panel: ['INTERACTABLES-006', 'item'], push: ['INTERACTABLES-009', 'item'], climb_wire: ['CONDUITS-003', 'item'], teleport_entry: ['CONDUITS-001', 'item'], revive_brother: ['CHARACTERS-001', 'character'] },
};
// nowe pozy pionowej przebudowy: referencje do elementów mechanik (tools/add-vertical-art.mjs → art-mechanics.json)
try {
  const MK = JSON.parse(readFileSync(join(root, 'tools', 'art-mechanics.json'), 'utf8'));
    for (const [state, id] of Object.entries(MK.pose_refs ?? {})) for (const c of ['CHARACTERS-001', 'CHARACTERS-002']) POSE_EXTRAS[c][state] = [id, 'item'];   // v0.4: drabina / winda / drzwi
} catch { /* biblioteka bez mechanics */ }
const ICON_REFS = { 'PET Counter Icon': 'COLLECTIBLES-001', 'Can Counter Icon': 'COLLECTIBLES-003', 'Lives Icon': 'COLLECTIBLES-012' };
function mentioned(a) {   // bohaterowie wymienieni w opisie (dla ilustracji fabularnych i menu)
  const brief = (a.prompt_en.split('SUBJECT:')[1] || '').split('PALETTE:')[0];
  const out = new Set();
  for (const [n, id] of Object.entries(HEROES)) if (new RegExp(n, 'i').test(brief) && id !== a.asset_id) out.add(id);
  if (/brothers|two electricians|both heroes|the heroes/i.test(brief)) { out.add('CHARACTERS-001'); out.add('CHARACTERS-002'); }
  if (/tiny bull/i.test(brief)) out.add('CHARACTERS-004');
  return [...out].slice(0, 4);
}
/** [{id, role}] — referencje dla BAZY assetu */
function baseRefs(a) {
  const r = [];
  if (a.reference_asset_id) r.push({ id: a.reference_asset_id, role: 'model' });
  if (a.category === 'character-variants') { const v = (a.name.split(' - ')[1] || '').trim(); if (ITEM_FOR_VARIANT[v]) r.push({ id: ITEM_FOR_VARIANT[v], role: 'item' }); }
  if (['planet-tiles', 'planet-props', 'parallax', 'level-backgrounds', 'mechanics'].includes(a.category) && a.planet) { const an = anchorOf(a.planet); if (an && an.asset_id !== a.asset_id) r.push({ id: an.asset_id, role: 'style' }); }
  if (a.category === 'interface' || a.category === 'story-illustrations') {
    if (ICON_REFS[a.name]) r.push({ id: ICON_REFS[a.name], role: 'item' });
    const pl = /^Planet (\S+) Icon$/.exec(a.name); if (pl) { const an = anchorOf(assets.find((x) => x.planet && slug(x.planet) === slug(pl[1]))?.planet); if (an) r.push({ id: an.asset_id, role: 'style' }); }
    for (const id of mentioned(a)) if (!r.some((x) => x.id === id)) r.push({ id, role: 'character' });
  }
  return r.filter((x) => byId[x.id] && x.id !== a.asset_id);
}
/** referencje dla POZY: baza własna + obiekt użyty w pozie */
function poseRefs(a, state) {
  const r = [{ id: a.asset_id, role: 'model' }];
  const ex = POSE_EXTRAS[a.asset_id]?.[state]; if (ex && byId[ex[0]]) r.push({ id: ex[0], role: ex[1] });
  return r;
}
const ROLE = {
  model: 'approved model of the SAME subject: keep identical design, proportions, colors, costume, tools, horns and line style',
  item: 'approved model of this exact item/object: reproduce it exactly as drawn (same shape, colors, details)',
  character: 'approved model of a character that appears in the image: reproduce faithfully (same face, costume, colors)',
  style: 'approved sample of this world: match its palette, materials, surface texture and line style, but do NOT copy its composition or content',
};
function refPrompt(refs) {
  if (!refs.length) return '';
  return 'ATTACHED REFERENCE IMAGES (in order):\n' + refs.map((r, i) => `Image ${i + 1} — ${byId[r.id].name}: ${ROLE[r.role]}.`).join('\n') + '\nChange ONLY what the task below describes. Same side-facing direction and feet baseline for characters. Plain flat white background around isolated sprites.\n';
}

// --- parametry obrazu ----------------------------------------------------------------------------
function sizeFor(a) {   // gpt-image: 1024x1024, 1536x1024, 1024x1536
  if (a.category === 'interface' && OPAQUE_NAMES.test(a.name)) return '1536x1024';   // tła menu/ładowania/mapy: szeroki kadr
  const m = /(\d+)x(\d+)/.exec(a.source_size || ''); if (!m) return '1024x1024';
  const r = Number(m[1]) / Number(m[2]);
  return r > 1.15 ? '1536x1024' : r < 0.87 ? '1024x1536' : '1024x1024';
}
const OPAQUE_NAMES = /Title Primary Background|Loading Background|World Map Card|sky layer/i;
const wantsAlpha = (a) => !(a.category === 'level-backgrounds' || a.category === 'story-illustrations' || OPAQUE_NAMES.test(a.name));
const AVOID = (a) => `\nAVOID (must not appear): ${a.negative_prompt_en}`;

// --- API -----------------------------------------------------------------------------------------
async function call(a, prompt, refPngs) {
  const body = { model, prompt: prompt.slice(0, 30000), size: sizeFor(a), quality, n: 1, output_format: 'png' };
  if (wantsAlpha(a) && !refPngs.length) body.background = 'transparent';
  let last = '';
  for (let t = 0; t < 5; t++) {
    let r;
    if (refPngs.length) {
      const fd = new FormData();
      for (const [k, v] of Object.entries(body)) fd.append(k, String(v));
      refPngs.forEach((png, i) => fd.append('image[]', new Blob([png], { type: 'image/png' }), `reference${i + 1}.png`));
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

// --- manifest, migracja --------------------------------------------------------------------------
const manifestPath = join(outDir, 'manifest.json');
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {};
const save = () => { mkdirSync(outDir, { recursive: true }); writeFileSync(manifestPath, JSON.stringify(manifest, null, 1)); };
const recorded = (k) => { const m = manifest[k]; return m ? (m.refs ?? (m.reference ? [m.reference] : [])).map((x) => x.replace(/\.png$/, '.webp')) : null; };
if (recut) {
  let n = 0;
  for (const c of readdirSync(outDir, { withFileTypes: true }).filter((e) => e.isDirectory())) for (const f of readdirSync(join(outDir, c.name)).filter((f) => f.endsWith('.webp'))) {
    const fp = join(outDir, c.name, f), r = cutout(await toPng(readFileSync(fp)), null);
    if (r.mode !== 'none') { writeFileSync(fp, await sharp(r.buf).webp({ quality: 88, alphaQuality: 100 }).toBuffer()); n++; }
  }
  console.log('Ponownie wycięto tło w', n, 'plikach'); process.exit(0);
}
// migracja: wcześniejsze pełne PNG -> pomniejszone WebP (+ pełna wersja w art-originals), bez ponownego generowania
async function migratePng() {
  let n = 0;
  if (!existsSync(outDir)) return;
  const byFile = new Map(); for (const a of assets) for (const st of ['base', ...new Set(poseJobs.filter((j) => j.asset_id === a.asset_id).map((j) => j.state))]) byFile.set(basename(fileOf(a, st)).replace(/\.webp$/, '.png'), [a, st]);
  for (const c of readdirSync(outDir, { withFileTypes: true }).filter((e) => e.isDirectory())) for (const f of readdirSync(join(outDir, c.name)).filter((f) => f.endsWith('.png'))) {
    const hit = byFile.get(f); const fp = join(outDir, c.name, f);
    if (!hit) { console.log('migracja: pomijam nieznany plik', f); continue; }
    const [a, st] = hit, png = readFileSync(fp), { full, small } = await encode(a, png);
    mkdirSync(dirname(origOf(a, st)), { recursive: true }); writeFileSync(origOf(a, st), full); writeFileSync(fileOf(a, st), small);
    unlinkSync(fp); n++;
  }
  for (const [k, v] of Object.entries(manifest)) { if (k.endsWith('.png')) { delete manifest[k]; manifest[k.replace(/\.png$/, '.webp')] = v; } if (v.refs) v.refs = v.refs.map((x) => x.replace(/\.png$/, '.webp')); }
  if (n) { console.log('migracja PNG → WebP:', n, 'plików'); save(); }
}
await migratePng();
if (opt('migrate', false)) process.exit(0);
// --- „nieświeżość”: plik istnieje, ale powstał bez wymaganych dziś referencji -------------------------
const expectedBase = (a) => baseRefs(a).map((r) => basename(fileOf(byId[r.id], 'base')));
const expectedPose = (a, s) => poseRefs(a, s).map((r) => basename(fileOf(byId[r.id], 'base')));
const same = (x, y) => JSON.stringify(x) === JSON.stringify(y);
const baseNeeded = (a) => force || !existsSync(fileOf(a, 'base')) || !same(recorded(keyOf(a, 'base')) ?? [], expectedBase(a));
const poseNeeded = (a, s) => force || !existsSync(fileOf(a, s)) || !same(recorded(keyOf(a, s)) ?? [], expectedPose(a, s));


const isAnchor = (a) => a.category === 'planet-tiles' && /solid-center$/i.test(a.name);
// --- --plan: pełna kolejka produkcji (JSON) dla ROADMAP / zadania w ChatGPT ----------------------------
const RAW = 'https://raw.githubusercontent.com/husk007/Marioosh/main/public/art/gen/';
if (opt('plan', false)) {
  const ordered = [...assets].sort((x, y) => rank(x.category) - rank(y.category) || (isAnchor(y) ? 1 : 0) - (isAnchor(x) ? 1 : 0));
  const items = [];
  const refInfo = (rs) => rs.map((r) => { const ra = byId[r.id], f = `${ra.category}/${basename(fileOf(ra, 'base'))}`; return { id: r.id, name: ra.name, role: r.role, file: f, url: RAW + f, ready: existsSync(fileOf(ra, 'base')) }; });
  const scope = existsSync(join(root, 'art-tasks', 'scope.json')) ? JSON.parse(readFileSync(join(root, 'art-tasks', 'scope.json'), 'utf8')) : {};
  const skipped = (a, state) => (scope.skip_categories || []).includes(a.category) || (state !== 'base' && (scope.skip_pose_categories || []).includes(a.category)) || (scope.skip_ids || []).includes(a.asset_id) || (state !== 'base' && (scope.skip_states || []).includes(state));
  const push = (a, state, refs, text, frames, done) => items.push({ skip: !done && skipped(a, state), seq: items.length + 1, kind: state === 'base' ? 'base' : 'pose', asset_id: a.asset_id, name: a.name, category: a.category, state, frames, inbox_name: `${a.asset_id}__${state}.png`, repo_file: `${a.category}/${basename(fileOf(a, state))}`, size: sizeFor(a), transparent: wantsAlpha(a), refs: refInfo(refs), done, prompt: refPrompt(refs) + text + AVOID(a) });
  for (const a of ordered) push(a, 'base', baseRefs(a), a.prompt_en, 1, !baseNeeded(a));
  for (const a of ordered) for (const j of poseJobs.filter((j) => j.asset_id === a.asset_id)) push(a, j.state, poseRefs(a, j.state), j.prompt_en, j.target_frames, !poseNeeded(a, j.state));
  // v0.4: najpierw pozy braci (definiują skalę i animację całej gry), potem elementy human-scale (mechanics), reszta bez zmian
  const tier = (i) => (i.kind === 'pose' && (i.asset_id === 'CHARACTERS-001' || i.asset_id === 'CHARACTERS-002') ? 0 : i.category === 'mechanics' ? 1 : 2);
  items.sort((x, y) => tier(x) - tier(y) || x.seq - y.seq); items.forEach((it, i) => { it.seq = i + 1; });
  writeFileSync(String(opt('plan', '')), JSON.stringify(items));
  console.log(`Plan: ${items.length} pozycji, gotowych ${items.filter((i) => i.done).length}`); process.exit(0);
}

// --- --ingest <katalog>: PNG/WebP/JPG z zewnątrz (np. zadanie ChatGPT) -> wycięcie tła, WebP, manifest -------------
if (opt('ingest', false)) {
  ingesting = true; let n = 0, bad = 0;
  const dir = String(opt('ingest', ''));
  const NAME = /^([A-Z_]+-\d+)(?:_[a-z0-9-]+)?__([a-z0-9_]+?)(~noref)?\.(png|webp|jpe?g)$/i;
  for (const f of existsSync(dir) ? readdirSync(dir) : []) {
    const m = NAME.exec(f); if (!m) { if (!/^\.|README/i.test(f)) { console.log('pomijam (zła nazwa):', f); bad++; } continue; }
    const a = byId[m[1].toUpperCase()], state = m[2].toLowerCase(), noref = !!m[3];
    const job = poseJobs.find((j) => j.asset_id === a?.asset_id && j.state === state);
    if (!a || (state !== 'base' && !job)) { console.log('pomijam (nieznany asset/poza):', f); bad++; continue; }
    const refs = state === 'base' ? baseRefs(a) : poseRefs(a, state);
    try {
      await finish(a, state, await sharp(readFileSync(join(dir, f))).png().toBuffer(), noref ? [] : refs, state === 'base' ? 1 : job.target_frames, noref ? { refs_missing: true } : undefined);
      unlinkSync(join(dir, f)); n++; console.log('ingest ok', f, '→', keyOf(a, state));
    } catch (e) { console.log('FAIL', f, e.message); bad++; }
  }
  console.log(`Wczytano: ${n}, odrzucono: ${bad}`); process.exit(0);
}

// --- plan ----------------------------------------------------------------------------------------
const doBase = mode === 'base' || mode === 'both', doPoses = mode === 'poses' || mode === 'both';
let selected = assets.filter((a) => (!categories.length || categories.includes(a.category)) && (!ids.length || ids.includes(a.asset_id)));
selected.sort((x, y) => rank(x.category) - rank(y.category) || (isAnchor(y) ? 1 : 0) - (isAnchor(x) ? 1 : 0));
const jobsOf = (a) => poseJobs.filter((j) => j.asset_id === a.asset_id && (!states.length || states.includes(j.state)));
selected = selected.filter((a) => (doBase && baseNeeded(a)) || (doPoses && jobsOf(a).some((j) => poseNeeded(a, j.state)))).slice(0, limit);
const nBase = doBase ? selected.filter(baseNeeded).length : 0;
const poseTasks = doPoses ? selected.flatMap((a) => jobsOf(a).filter((j) => poseNeeded(a, j.state)).map((j) => ({ a, j }))) : [];
console.log(`Assetów: ${selected.length}, obrazów do wygenerowania: ${nBase + poseTasks.length} (baz: ${nBase}, póz: ${poseTasks.length}; tryb ${mode}, model ${model}, jakość ${quality})`);

// --- generowanie ---------------------------------------------------------------------------------
async function finish(a, state, png, refs, frames, extraMeta) {
  let cut = 'n/a';
  if (wantsAlpha(a)) { const r = cutout(png, null); png = r.buf; cut = r.mode; if (r.mode === 'none') console.log('  uwaga: nie wykryto tła do wycięcia (kafelek/pełny kadr?):', a.asset_id, state); }
  const { full, small } = await encode(a, png);
  const fp = fileOf(a, state); mkdirSync(dirname(fp), { recursive: true }); writeFileSync(fp, small);
  mkdirSync(dirname(origOf(a, state)), { recursive: true }); writeFileSync(origOf(a, state), full);
  manifest[keyOf(a, state)] = { asset_id: a.asset_id, name: a.name, category: a.category, state, target_frames: frames, refs: refs.map((r) => basename(fileOf(byId[r.id], 'base'))), size: sizeFor(a), quality: ingesting ? 'chatgpt' : quality, model: ingesting ? 'chatgpt-task' : model, cutout: cut, ...(extraMeta || {}) };
  save(); return small;
}
let ok = 0, fail = 0, stop = false;
const baseMemo = new Map();
/** Zwraca PNG bazy; generuje ją (po wcześniejszym zapewnieniu baz-referencji), jeśli brakuje lub jest nieświeża. */
function getBase(a) {
  if (baseMemo.has(a.asset_id)) return baseMemo.get(a.asset_id);
  const p = (async () => {
    const fp = fileOf(a, 'base'), refs = baseRefs(a);
    if (!(selectedIds.has(a.asset_id) ? baseNeeded(a) && doBase : (!existsSync(fp)))) return readFileSync(fp);
    if (dry) { console.log(`[dry] baza ${a.asset_id} ${a.name} ${sizeFor(a)} refs=[${refs.map((r) => r.id + ':' + r.role).join(', ')}]`); return Buffer.alloc(0); }
    const refPngs = []; for (const r of refs) refPngs.push(await toPng(await getBase(byId[r.id])));
    const png = await finish(a, 'base', await call(a, refPrompt(refs) + a.prompt_en + AVOID(a), refPngs), refs, 1);
    ok++; console.log('ok  ', a.asset_id, a.name, 'base', refs.length ? `(refs: ${refs.map((r) => r.id).join(', ')})` : ''); return png;
  })();
  baseMemo.set(a.asset_id, p); return p;
}
const selectedIds = new Set(selected.map((a) => a.asset_id));
async function pool(items, fn) { let i = 0; await Promise.all(Array.from({ length: conc }, async () => { while (i < items.length && !stop) await fn(items[i++]); })); }
const guard = (e, what) => { fail++; console.log('FAIL', what, '-', e.message); if (/HTTP 40[13]|BRAK ŚRODKÓW/.test(e.message)) stop = true; };

if (doBase) await pool(selected.filter(baseNeeded), async (a) => { try { await getBase(a); } catch (e) { guard(e, a.asset_id + ' base'); } });
if (doPoses && !stop) await pool(poseTasks, async ({ a, j }) => {
  try {
    const refs = poseRefs(a, j.state), refPngs = []; for (const r of refs) refPngs.push(await toPng(await getBase(byId[r.id])));
    if (dry) { console.log(`[dry] poza ${a.asset_id} ${a.name} ${j.state} (klatek ${j.target_frames}) refs=[${refs.map((r) => r.id + ':' + r.role).join(', ')}]`); return; }
    await finish(a, j.state, await call(a, refPrompt(refs) + j.prompt_en + AVOID(a), refPngs), refs, j.target_frames); ok++; console.log('ok  ', a.asset_id, a.name, j.state);
  } catch (e) { guard(e, `${a.asset_id} ${j.state}`); }
});
console.log(`Gotowe: ${ok} ok, ${fail} błędów`);
process.exit(fail && !ok ? 1 : 0);
