/** Rejestr ręcznie projektowanych poziomów v0.4. Poziomy spoza rejestru są jeszcze w przebudowie (WIP) i nie można ich uruchomić. */
import type { LevelData } from '../types';
import { buildW1L1 } from './w1l1';
import { buildW1L2 } from './w1l2';
import { buildW1L4 } from './w1l4';

export const AUTHORED: Record<string, () => LevelData> = {
  'W1-L1': buildW1L1,
  'W1-L2': buildW1L2,
  'W1-L4': buildW1L4,
};
export const isPorted = (id: string): boolean => id in AUTHORED;
