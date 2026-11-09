/** Rejestr ręcznie projektowanych poziomów v0.4. Poziomy spoza rejestru są jeszcze w przebudowie (WIP) i nie można ich uruchomić. */
import type { LevelData } from '../types';
import { buildW1L1 } from './w1l1';
import { buildW1L2 } from './w1l2';
import { buildW1L3 } from './w1l3';
import { buildW1L4 } from './w1l4';
import { buildW2L1 } from './w2l1';
import { buildW2L2 } from './w2l2';
import { buildW2L3 } from './w2l3';
import { buildW2L4 } from './w2l4';
import { buildW3L1 } from './w3l1';
import { buildW3L2 } from './w3l2';
import { buildW3L3 } from './w3l3';
import { buildW3L4 } from './w3l4';
import { buildW4L1 } from './w4l1';
import { buildW4L2 } from './w4l2';
import { buildW4L3 } from './w4l3';
import { buildW4L4 } from './w4l4';
import { buildW5L1 } from './w5l1';
import { buildW5L2 } from './w5l2';
import { buildW5L3 } from './w5l3';
import { buildW5L4 } from './w5l4';
import { buildW6L1 } from './w6l1';
import { buildW6L2 } from './w6l2';
import { buildW6L3 } from './w6l3';
import { buildW6L4 } from './w6l4';
import { buildW7L1 } from './w7l1';
import { buildW7L2 } from './w7l2';
import { buildW7L3 } from './w7l3';
import { buildW7L4 } from './w7l4';
import { buildW8L1 } from './w8l1';
import { buildW8L2 } from './w8l2';

export const AUTHORED: Record<string, () => LevelData> = {
  'W1-L1': buildW1L1,
  'W1-L2': buildW1L2,
  'W1-L3': buildW1L3,
  'W1-L4': buildW1L4,
  'W2-L1': buildW2L1,
  'W2-L2': buildW2L2,
  'W2-L3': buildW2L3,
  'W2-L4': buildW2L4,
  'W3-L1': buildW3L1,
  'W3-L2': buildW3L2,
  'W3-L3': buildW3L3,
  'W3-L4': buildW3L4,
  'W4-L1': buildW4L1,
  'W4-L2': buildW4L2,
  'W4-L3': buildW4L3,
  'W4-L4': buildW4L4,
  'W5-L1': buildW5L1,
  'W5-L2': buildW5L2,
  'W5-L3': buildW5L3,
  'W5-L4': buildW5L4,
  'W6-L1': buildW6L1,
  'W6-L2': buildW6L2,
  'W6-L3': buildW6L3,
  'W6-L4': buildW6L4,
  'W7-L1': buildW7L1,
  'W7-L2': buildW7L2,
  'W7-L3': buildW7L3,
  'W7-L4': buildW7L4,
  'W8-L1': buildW8L1,
  'W8-L2': buildW8L2,
};
export const isPorted = (id: string): boolean => id in AUTHORED;
