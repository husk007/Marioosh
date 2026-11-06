/** Metadane ośmiu światów (+ planeta 0) — nazwy w i18n, tutaj palety z Biblii graficznej. */
export interface WorldTheme {
  id: number; key: string; dominant: string; secondary: string; accent: string; sky: string; sky2: string;
  dark: boolean; underwater: boolean; ground: string; groundTop: string; deco: string;
}
export const WORLDS: WorldTheme[] = [
  { id: 0, key: 'prad',  dominant: '#8c8f98', secondary: '#c8b560', accent: '#ffd23f', sky: '#2a2640', sky2: '#4a4466', dark: false, underwater: false, ground: '#5d5a66', groundTop: '#9b97a8', deco: 'plant' },
  { id: 1, key: 'lum',   dominant: '#71C878', secondary: '#7BCEEC', accent: '#F5C04A', sky: '#7BCEEC', sky2: '#d6f3d0', dark: false, underwater: false, ground: '#7a5a3c', groundTop: '#71C878', deco: 'forest' },
  { id: 2, key: 'zlo',   dominant: '#9EA7B2', secondary: '#D6A16A', accent: '#F0E14C', sky: '#a9b6c4', sky2: '#e6d3b8', dark: false, underwater: false, ground: '#6b6f78', groundTop: '#9EA7B2', deco: 'scrap' },
  { id: 3, key: 'flo',   dominant: '#2D9B73', secondary: '#E8B65E', accent: '#F46C7E', sky: '#8fd9a8', sky2: '#f6e7a8', dark: false, underwater: false, ground: '#4a6b3a', groundTop: '#2D9B73', deco: 'jungle' },
  { id: 4, key: 'aqu',   dominant: '#2D80B4', secondary: '#75D4E7', accent: '#FFD166', sky: '#2a6fa0', sky2: '#75D4E7', dark: false, underwater: true,  ground: '#2c4f6b', groundTop: '#75D4E7', deco: 'ocean' },
  { id: 5, key: 'ska',   dominant: '#A58F79', secondary: '#D8BC87', accent: '#A65CDB', sky: '#e5b78a', sky2: '#f4dcae', dark: false, underwater: false, ground: '#7d6a58', groundTop: '#D8BC87', deco: 'mountain' },
  { id: 6, key: 'ves',   dominant: '#29345E', secondary: '#6979B2', accent: '#FFE58A', sky: '#141a3a', sky2: '#2c3870', dark: true,  underwater: false, ground: '#232c52', groundTop: '#6979B2', deco: 'city' },
  { id: 7, key: 'fer',   dominant: '#5C7381', secondary: '#7FB6B1', accent: '#FF8C58', sky: '#4a5b66', sky2: '#8aa2ad', dark: false, underwater: false, ground: '#3c4a54', groundTop: '#7FB6B1', deco: 'factory' },
  { id: 8, key: 'kat',   dominant: '#332B3B', secondary: '#695361', accent: '#DB4269', sky: '#3a0f1c', sky2: '#6a1f33', dark: false, underwater: false, ground: '#2a2230', groundTop: '#695361', deco: 'horns' },
];

export const BOSS_BY_WORLD = ['', 'rogomir', 'zlomotaur', 'kaktogor', 'rogopletw', 'ceratopsor', 'krukorog', 'rogodron', 'katoblepas'] as const;
export type BossId = typeof BOSS_BY_WORLD[number];
