import type { BossId } from '../data/worlds';

/** Rodzaje kafelków */
export const T = {
  EMPTY: 0, SOLID: 1, ONEWAY: 2, HAZARD: 3, LADDER: 4, CRUMBLE: 5, CONVL: 6, CONVR: 7, CRACKED: 8, CABLE: 9, GATE: 10,
  // stoki (powierzchnia pochyła, pod nią stoi lity kafel): R = wznosi się w prawo, L = w lewo; 45° i ~26,6° (dwa kafle: A = niższa połowa, B = wyższa)
  SL_R45: 11, SL_L45: 12, SL_R26A: 13, SL_R26B: 14, SL_L26A: 15, SL_L26B: 16,
  SPRING_U: 17, SPRING_R: 18, SPRING_L: 19,
  // 20 zarezerwowane (półki bossa Rogodrona)
  CLIMB: 21,      // kratka/pnącze na ścianie: wspinaczka we wszystkich kierunkach
  ROPE: 22,       // lina/łańcuch/rura pionowa: wspinaczka tylko w pionie, skok w bok
  ICE: 23,        // lity, śliski (lód)
  OIL: 24,        // lity, bardzo śliski (olej)
  SAND: 25,       // lity, wolny/tłumiący (piasek)
  PLATFORM_BREAK: 26, // kruszy się po uderzeniu w ziemię (Marioosh) — jak CRACKED, ale tylko od góry
} as const;
export type TileId = (typeof T)[keyof typeof T];

export type EnemyKind =
  | 'rogus' | 'baranitor' | 'bykobieg' | 'zukorog' | 'cmorog' | 'pszczolrog' | 'rogowrobel' | 'krukorog' | 'gekorog'
  | 'bazalisk' | 'rogopletw' | 'osmiorog' | 'kakturozec' | 'rogopnacze' | 'rogoroza' | 'slimorog' | 'rogoskoczek' | 'kamienirog' | 'dron';

export const ENEMY_BY_NAME: Record<string, EnemyKind> = {
  'Roguś': 'rogus', 'Baranitor': 'baranitor', 'Bykobieg': 'bykobieg', 'Żukoróg': 'zukorog', 'Ćmoróg': 'cmorog', 'Pszczółrog': 'pszczolrog',
  'Rogowróbel': 'rogowrobel', 'Krukoróg': 'krukorog', 'Gekoróg': 'gekorog', 'Bazalisk': 'bazalisk', 'Rogopłetw': 'rogopletw', 'Ośmioróg': 'osmiorog',
  'Kakturożec': 'kakturozec', 'Rogopnącze': 'rogopnacze', 'Rogoróża': 'rogoroza', 'Ślimoróg': 'slimorog', 'Rogoskoczek': 'rogoskoczek',
  'Kamienioróg': 'kamienirog', 'Rogodron-minion': 'dron',
};
export const ENEMY_CLASS: Record<EnemyKind, 'ground' | 'air' | 'water' | 'plant'> = {
  rogus: 'ground', baranitor: 'ground', bykobieg: 'ground', zukorog: 'ground', slimorog: 'ground', kakturozec: 'ground', kamienirog: 'ground',
  gekorog: 'ground', bazalisk: 'ground', rogoskoczek: 'ground', cmorog: 'air', pszczolrog: 'air', rogowrobel: 'air', krukorog: 'air', dron: 'air',
  rogopletw: 'water', osmiorog: 'water', rogopnacze: 'plant', rogoroza: 'plant',
};
/** identyfikator w bestiary.json */
export const ENEMY_JSON_ID: Record<EnemyKind, string> = {
  rogus: 'EN01', baranitor: 'EN02', bykobieg: 'EN03', zukorog: 'EN04', cmorog: 'EN05', pszczolrog: 'EN06', rogowrobel: 'EN07', krukorog: 'EN08', gekorog: 'EN09',
  bazalisk: 'EN10', rogopletw: 'EN11', osmiorog: 'EN12', kakturozec: 'EN13', rogopnacze: 'EN14', rogoroza: 'EN15', slimorog: 'EN16', rogoskoczek: 'EN17', kamienirog: 'EN18', dron: 'AUX01',
};

export type ItemKind =
  | 'pet' | 'can' | 'golden' | 'battery' | 'crystal' | 'shard' | 'signet' | 'note'
  | 'xl' | 'coil' | 'magnet' | 'extender' | 'gloves' | 'star';

export type CableColor = 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'black';
export interface Dest { room: number; x: number; y: number }

export type SwitchStyle = 'lever' | 'valve' | 'mirror' | 'relay' | 'lamp' | 'rune';

export type Spec =
  | { t: 'enemy'; k: EnemyKind; x: number; y: number }
  | { t: 'item'; k: ItemKind; x: number; y: number; id: string }
  | { t: 'crate'; k: ItemKind; x: number; y: number; hidden: boolean; id: string }
  | { t: 'cable'; id: string; color: CableColor; x: number; y: number; face: 'up' | 'down' | 'door'; dest?: Dest; warp?: string; locked?: boolean; hidden?: boolean; symbol?: number }
  | { t: 'statue'; idx: number; x: number; y: number; id: string }
  | { t: 'switch'; id: string; x: number; y: number; gate: string; style: SwitchStyle; symbol: number }
  | { t: 'gate'; id: string; cells: [number, number][]; need: number }
  | { t: 'platform'; x: number; y: number; w: number; mode: 'h' | 'v' | 'phase' | 'crumble'; range: number; speed: number; offset: number; /** winda: postój na każdym końcu (s); ruch ze stałą prędkością `speed` px/s */ dwell?: number }
  | { t: 'checkpoint'; x: number; y: number }
  | { t: 'exit'; x: number; y: number }
  | { t: 'ecoport'; x: number; y: number; broken: boolean; id: string; fuses: string[] }
  | { t: 'lamp'; x: number; y: number }
  | { t: 'lantern'; x: number; y: number; id: string }
  | { t: 'hint'; x: number; y: number; w: number; key: string }
  | { t: 'rain'; x0: number; x1: number; interval: number }
  /** osuw skalny: co `interval` s (z ostrzeżeniem `warn` s) z wysokości `y` spadają kamienie na odcinku x0..x1 (px); chroni nawis (lity kafel nad graczem) */
  /** kula kamienna na torze (punkty w px — środek kuli): co `every` s (zapowiedź `warn` s) wtacza się po `path`; na punkcie `fork.i` zwrotnica (wszystkie przełączniki bramy `fork.select` włączone) kieruje ją po `fork.alt`.
   *  Kula, która dotoczy się do końca `alt`, otwiera bramę `hit`. Rani graczy, z którymi się zetknie. */
  | { t: 'boulder'; r: number; path: [number, number][]; fork?: { i: number; alt: [number, number][]; select: string }; speed: number; every: number; offset?: number; warn?: number; hit?: string }
  | { t: 'slide'; x0: number; x1: number; y: number; interval: number; warn?: number; offset?: number }
  | { t: 'span'; gate: string; cells: [number, number][] }
  | { t: 'flood'; x0: number; x1: number; /** opcjonalne ograniczenie wierszy [y0,y1] */ y0?: number; y1?: number; from: number; to: number; speed: number; gate: string }
  | { t: 'current'; x: number; y: number; w: number; h: number; fx: number; fy: number }
  | { t: 'boss'; k: BossId; x: number; y: number }
  | { t: 'decor'; k: string; x: number; y: number }
  | { t: 'sign'; x: number; y: number; symbol: number };

export interface Room {
  w: number; h: number;
  tiles: Uint8Array;
  water: Uint8Array;           // 1 = woda
  specs: Spec[];
  world: number;               // motyw wizualny
  dark: boolean;
  name: string;                // 'main' | 'bonus' | 'secret' | 'scarlet'
  spawn: { x: number; y: number };
  bossArena?: { x0: number; x1: number };
  wrapDeath?: boolean;
}

export type LevelMode = 'run' | 'tower' | 'water' | 'boss';

export interface LevelData {
  id: string;
  world: number; stage: number;
  /** nadpisanie profilu fizyki (id planety 0–8); domyślnie = world */
  planet?: number;
  titleKey: string;
  timeLimit: number;
  mode: LevelMode;
  rooms: Room[];
  boss?: BossId;
  checkpointPx: { x: number; y: number };
  exitPx: { x: number; y: number };
  residents: string[];         // identyfikatory posągów: W1-L1-S1…
  budget: { pet: number; cans: number; golden: number };
  hints: string[];
}

export interface LevelJson {
  level_id: string; planet: string; world: number; stage: number; title: string; width_tiles: number; time_limit_seconds: number;
  collectibles: { pet: number; cans: number; golden_cans: number };
  enemy_budget: Record<string, number>;
  sections: { section: number; x_tiles: [number, number]; beat: string }[];
  checkpoint_x_tile: number; petrified_residents_x_tile: number[]; secret: string; completion: string; special: string;
}

export const rectsOverlap = (ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number): boolean =>
  ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
