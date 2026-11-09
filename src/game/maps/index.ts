/** Rejestr ręcznie projektowanych poziomów v0.4. Poziomy spoza rejestru są jeszcze w przebudowie (WIP) i nie można ich uruchomić. */
import type { LevelData } from '../types';
import { buildW1L1 } from './w1l1';
import { buildW1L2 } from './w1l2';
import { buildW1L4 } from './w1l4';
import { buildW4L1 } from './w4l1';
import { buildW4L2 } from './w4l2';
import { buildW4L3 } from './w4l3';
import { buildW4L4 } from './w4l4';
import { buildW5L1, buildW6L1 } from './proto';

export const AUTHORED: Record<string, () => LevelData> = {
  'W1-L1': buildW1L1,
  'W1-L2': buildW1L2,
  'W1-L4': buildW1L4,
  'W4-L1': buildW4L1,
  'W4-L2': buildW4L2,
  'W4-L3': buildW4L3,
  'W4-L4': buildW4L4,
  'W5-L1': buildW5L1,
  'W6-L1': buildW6L1,
};
export const isPorted = (id: string): boolean => id in AUTHORED;
