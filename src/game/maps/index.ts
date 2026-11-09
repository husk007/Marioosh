/** Rejestr ręcznie projektowanych poziomów v0.4. Poziomy spoza rejestru są jeszcze w przebudowie (WIP) i nie można ich uruchomić. */
import type { LevelData } from '../types';
import { buildW1L1 } from './w1l1';

export const AUTHORED: Record<string, () => LevelData> = {
  'W1-L1': buildW1L1,
};
export const isPorted = (id: string): boolean => id in AUTHORED;
