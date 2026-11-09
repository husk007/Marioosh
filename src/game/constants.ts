/** Stałe silnika zgodne z GDD 0.2 (sekcja B). */
export const TILE = 32;
export const VW = 640; // wirtualna szerokość
export const VH = 360; // wirtualna wysokość
export const STEP = 1 / 60; // stały krok fizyki 60 Hz
export const MAX_LIVES = 99;
export const START_LIVES = 3;
export const PACKAGES_PER_LIFE = 100;

export type Brother = 'M' | 'D';

/** Skala v0.4: 40 px = 1 m (kafel 32 px = 0,8 m). Dorosły ≈ 68–72 px. */
export const PX_PER_M = 40;

export interface BrotherParams {
  /** chód / bieg / przyspieszenie / hamowanie (px/s, px/s²) */
  walk: number; run: number; accel: number; decel: number;
  /** kontrola w powietrzu (px/s²) */
  airCtl: number;
  /** prędkość początkowa skoku (px/s, ujemna = w górę); wysokość = v²/(2g) */
  jump: number;
  /** mnożnik grawitacji po puszczeniu przycisku skoku (krótszy skok) */
  jumpCut: number;
  /** drabina (góra/dół), kucanie, pływanie, opadanie w wodzie */
  ladder: number; crouch: number; swim: number; sink: number;
  /** hitbox stojący (px) i w kucaniu */
  hitW: number; hitH: number; crouchH: number;
  /** czas amortyzacji po lądowaniu (s) */
  cushion: number;
  keyRange: number; keyCooldown: number; keyDamage: number; name: string;
}

/**
 * Parametry ruchu v0.4 (docs/design/08, 11). Oś Y dodatnia w dół.
 * Marioosh: ciężki i stabilny (skok ≈25 px = 0,63 m); Darioosh: zwinniejszy (≈29 px = 0,72 m).
 * Żaden skok standardowy nie przekracza 0,9 m (36 px) na żadnej planecie.
 */
export const BROTHERS: Record<Brother, BrotherParams> = {
  M: { walk: 76, run: 168, accel: 520, decel: 620, airCtl: 120, jump: -140, jumpCut: 1.7, ladder: 48, crouch: 38, swim: 68, sink: -12,
       hitW: 26, hitH: 70, crouchH: 44, cushion: 0.13, keyRange: 40, keyCooldown: 0.55, keyDamage: 2, name: 'Marioosh' },
  D: { walk: 84, run: 184, accel: 600, decel: 700, airCtl: 145, jump: -150, jumpCut: 1.9, ladder: 54, crouch: 42, swim: 74, sink: -12,
       hitW: 24, hitH: 68, crouchH: 43, cushion: 0.09, keyRange: 36, keyCooldown: 0.42, keyDamage: 1, name: 'Darioosh' },
};

/** grawitacja bazowa (px/s²) = 9,8 m/s² × 40 px/m */
export const BASE_GRAVITY = 392;
export interface PlanetPhysics { name: string; gravityMultiplier: number }
/** profil fizyki na planetę (id świata 0–8): docs/design/11 */
export const PLANET_PHYSICS: Record<number, PlanetPhysics> = {
  0: { name: 'Prądowo', gravityMultiplier: 1.0 },
  1: { name: 'Lumenia', gravityMultiplier: 0.98 },
  2: { name: 'Złomaria', gravityMultiplier: 1.09 },
  3: { name: 'Florion', gravityMultiplier: 0.91 },
  4: { name: 'Aqualis', gravityMultiplier: 1.02 },
  5: { name: 'Skaltria', gravityMultiplier: 1.14 },
  6: { name: 'Vespera', gravityMultiplier: 0.86 },
  7: { name: 'Ferroks', gravityMultiplier: 1.06 },
  8: { name: 'Katoblis', gravityMultiplier: 0.95 },
};
/** grawitacja efektywna planety (px/s²) */
export const effectiveGravity = (world: number): number => BASE_GRAVITY * (PLANET_PHYSICS[world]?.gravityMultiplier ?? 1);
/** wysokość skoku (px) przy danej prędkości początkowej i grawitacji */
export const jumpHeight = (v0: number, g: number): number => (v0 * v0) / (2 * g);

export const HERO_MAX_FALL = 520;
/** automatyczny stopień (px) — 0,3 m; wyższe przeszkody wymagają przeskoku */
export const AUTO_STEP = 11;
/** przeskok przeszkody: 0,3–1,0 m */
export const VAULT_MIN = 14; export const VAULT_MAX = 40;
/** chwyt krawędzi: maks. wysokość (od podłoża) szczytu krawędzi, na którą można się podciągnąć (1,7 m) */
export const LEDGE_REACH = 68;
/** czasy animacji (s) */
export const PULLUP_TIME = 0.55; export const VAULT_TIME = 0.34;
/** progi upadku (px): <1,2 m bez skutków, 1,2–2,4 m potknięcie, ≥2,4 m obrażenia */
export const FALL_STUMBLE = 48; export const FALL_DAMAGE = 96;
export const STUMBLE_TIME = 0.55;
export const COYOTE = 0.08;
export const JUMP_BUFFER = 0.1;
/** czy taśmociąg: prędkość znoszenia (px/s) */
export const CONVEYOR_SPEED = 50;
export const MAX_SPEED = 400;
export const KEY_WINDUP = 0.1;
export const KEY_ACTIVE = 0.12;
export const INVULN_AFTER_HIT = 1.3;
/** punkty życia v0.4: 3 + tarcza */
export const MAX_HP = 3;
export const SPARK_SPEED = 310;
export const SPARK_MAX = 3;
export const SPARK_LIFE = 1.6;
export const SPARK_BOUNCES = 2;

// Skamienienie (GDD D)
export const PETRIFY_RATE = 45;
export const PETRIFY_DECAY = 30;
export const PETRIFY_DELAY = 0.5;
export const PETRIFY_TIER1 = 35;
export const PETRIFY_TIER2 = 65;
export const PETRIFY_MAX = 100;
export const STATUE_TIME_COOP = 4;

// Przedmioty czasowe (GDD D)
export const TIME_MAGNET = 20;
export const TIME_EXTENDER = 15;
export const TIME_GLOVES = 12;
export const TIME_STAR = 12;

/** grawitacja wrogów i bossów (px/s²) — skalowana do planety w World */
export const GRAVITY = 1150;
export const MAX_FALL = 700;

export const TELEPORT_TIME = 0.55;
export const PICKUP_RADIUS = 24;

/** boss w skali ludzkiej: hitbox i sprite ×1,5 względem v0.3 (Rogomir ≈ 2,1 m wysokości) */
export const BOSS_SCALE = 1.5;
/** wrogowie w skali ludzkiej: hitbox i sprite ×1,4 względem v0.3 (Roguś ≈ 1,1 m) */
export const ENEMY_SCALE = 1.4;

/** powietrze (s): pod wodą (głowa pod powierzchnią) ubywa, w suchej komorze / nad wodą przybywa AIR_REFILL razy szybciej; po 0 — obrażenie co DROWN_INTERVAL */
export const AIR_MAX = 20;
export const AIR_WARN = 6;
export const AIR_REFILL = 8;
export const DROWN_INTERVAL = 1.6;
/** margines bezpieczeństwa w testach osiągalności: odcinek pod wodą nie może trwać dłużej niż AIR_MAX − ten margines */
export const AIR_TEST_MARGIN = 5;
