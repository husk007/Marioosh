import { it } from 'vitest';
import { runBot } from './bot';
for (const id of (process.env.LV ?? 'W1-L1').split(',')) for (const br of ['M', 'D'] as const) it(`${id} ${br}`, () => { const r = runBot(id, 300, 0, undefined, true, br); console.log(id, br, JSON.stringify(r)); }, 200000);
