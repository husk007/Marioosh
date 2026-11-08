// Składa art-tasks/station/index.html (Art Station) z szablonu i art-tasks/station-data.json.
// Użycie: node tools/build-station.mjs   (wywoływane też przez tools/art-roadmap.mjs)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(readFileSync(join(root, 'art-tasks', 'station-data.json'), 'utf8'));
const tpl = readFileSync(join(root, 'tools', 'station.template.html'), 'utf8');
const json = JSON.stringify(data).replace(/</g, '\\u003c').split(String.fromCharCode(0x2028)).join(' ').split(String.fromCharCode(0x2029)).join(' ');
mkdirSync(join(root, 'art-tasks', 'station'), { recursive: true });
writeFileSync(join(root, 'art-tasks', 'station', 'index.html'), tpl.replace('/*__DATA__*/null', () => json));
console.log(`STATION: ${data.length} pozycji → art-tasks/station/index.html`);
