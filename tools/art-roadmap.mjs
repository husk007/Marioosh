// Buduje art-tasks/ROADMAP.md oraz art-tasks/windows/W###.md (po 10 pozycji) z kolejki produkcji.
// Użycie:  node tools/art-roadmap.mjs        (sam wywołuje: node tools/gen-art.mjs --plan <tmp>)
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tmp = join(tmpdir(), 'art-plan.json');
execFileSync('node', [join(root, 'tools', 'gen-art.mjs'), '--plan', tmp], { stdio: 'inherit' });
const items = JSON.parse(readFileSync(tmp, 'utf8'));
const W = 10, wid = (seq) => Math.floor((seq - 1) / W) + 1, wname = (n) => 'W' + String(n).padStart(3, '0');
const wins = new Map(); for (const it of items) { const k = wid(it.seq); (wins.get(k) ?? wins.set(k, []).get(k)).push(it); }
const todoWins = [...wins].filter(([, v]) => v.some((i) => !i.done));
const dir = join(root, 'art-tasks', 'windows'); mkdirSync(dir, { recursive: true });
for (const f of readdirSync(dir)) unlinkSync(join(dir, f));   // okna w pełni gotowe znikają
const ASPECT = { '1024x1024': 'square 1:1 (1024x1024)', '1536x1024': 'landscape 3:2 (1536x1024)', '1024x1536': 'portrait 2:3 (1024x1536)' };
const ROLE = { model: 'same subject — keep identical design', item: 'item/object — reproduce exactly', character: 'character — reproduce faithfully', style: 'world style sample — match palette/materials, do NOT copy composition' };
for (const [n, list] of todoWins) {
  const out = [`# Window ${wname(n)} — items ${list[0].seq}–${list[list.length - 1].seq}`, '', `Generate every item below whose status is **TODO** (skip DONE). Follow \`art-tasks/AGENTS.md\`.`, ''];
  for (const it of list) {
    out.push(`## [${it.seq}] ${it.asset_id} — ${it.name} — \`${it.state}\`  (${it.done ? 'DONE' : 'TODO'})`);
    if (it.done) { out.push('', '_already exists — skip_', ''); continue; }
    out.push('', `- Save as: \`art-inbox/${it.inbox_name}\``, `- Aspect: ${ASPECT[it.size] || it.size}`, `- Background: ${it.transparent ? 'TRANSPARENT (isolated sprite; if transparency is impossible use flat pure white #FFFFFF, no floor shadow)' : 'OPAQUE full-frame scene (no transparency)'}`, `- Frames this pose stands for: ${it.frames} (draw ONE key pose)`);
    if (it.refs.length) { out.push('- **References (open each URL and use the image as visual reference, in this order):**'); it.refs.forEach((r, i) => out.push(`  ${i + 1}. [${r.role}] ${r.name} — ${r.ready ? '' : '(NOT READY YET — if you cannot open it, mark the file name with ~noref) '}${r.url}   — _${ROLE[r.role]}_`)); }
    else out.push('- References: none (prompt only)');
    out.push('', '**PROMPT**', '```text', it.prompt, '```', '');
  }
  writeFileSync(join(dir, wname(n) + '.md'), out.join('\n'));
}
const cats = new Map(); for (const it of items) { const c = cats.get(it.category) ?? { base: [0, 0], pose: [0, 0] }; c[it.kind][1]++; if (it.done) c[it.kind][0]++; cats.set(it.category, c); }
const first = todoWins[0]?.[0] ?? null, done = items.filter((i) => i.done).length;
const md = ['# ROADMAP — grafiki HD (Marioosh & Darioosh)', '', `_Wygenerowano automatycznie (\`node tools/art-roadmap.mjs\`) — nie edytuj ręcznie._`, '',
  `**Postęp: ${done} / ${items.length}** (${Math.round((100 * done) / items.length)}%) · pozycji do zrobienia: ${items.length - done}`, '',
  `**FIRST_TODO_WINDOW: ${first ? wname(first) : 'NONE — wszystko zrobione'}**   · okien z pracą: ${todoWins.length} (po ${W} pozycji, numeracja stała)`, '',
  '## Kategorie', '', '| Kategoria | Bazy | Pozy |', '|---|---|---|', ...[...cats].map(([c, v]) => `| ${c} | ${v.base[0]}/${v.base[1]} | ${v.pose[0]}/${v.pose[1]} |`), '',
  '## Okna do zrobienia', '', 'Plik okna: `art-tasks/windows/W###.md`. Kolejność produkcji: najpierw wszystkie bazy, potem pozy.', '', '| Okno | Pozycje | TODO | Zawartość |', '|---|---|---|---|',
  ...todoWins.map(([n, list]) => `| ${wname(n)} | ${list[0].seq}–${list[list.length - 1].seq} | ${list.filter((i) => !i.done).length} | ${[...new Set(list.filter((i) => !i.done).map((i) => i.category + (i.kind === 'pose' ? ' (pozy)' : '')))].join(', ')} |`), ''];
writeFileSync(join(root, 'art-tasks', 'ROADMAP.md'), md.join('\n'));
console.log(`ROADMAP: ${done}/${items.length} gotowe, okien z pracą: ${todoWins.length}, pierwsze: ${first ? wname(first) : '-'}`);
