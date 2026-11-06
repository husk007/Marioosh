// Kopiuje dist/ do mobile/www (webDir Capacitora).
import { cpSync, rmSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
if (!existsSync(join(root, 'dist', 'index.html'))) { console.error('Brak dist/ — uruchom najpierw: npm run build'); process.exit(1); }
rmSync(join(root, 'mobile', 'www'), { recursive: true, force: true });
cpSync(join(root, 'dist'), join(root, 'mobile', 'www'), { recursive: true });
console.log('[mobile] gotowe: mobile/www');
