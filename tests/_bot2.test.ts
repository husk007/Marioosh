import { it } from 'vitest';
import { runBot } from './bot';
it('trace', () => { runBot(process.env.LV ?? 'W1-L1', 300, 60, undefined, true, (process.env.BR as 'M' | 'D') ?? 'M'); }, 200000);
