/** Stałe silnika zgodne z GDD 0.2 (sekcja B). */
export const TILE = 32;
export const VW = 640; // wirtualna szerokość
export const VH = 360; // wirtualna wysokość
export const STEP = 1 / 60; // stały krok fizyki 60 Hz
export const MAX_LIVES = 99;
export const START_LIVES = 3;
export const PACKAGES_PER_LIFE = 100;

export type Brother = 'M' | 'D';

export interface BrotherParams {
  walk: number; run: number; accel: number; airAccel: number; decel: number;
  jump: number; stompBounce: number; hitW: number; hitH: number; bigW: number; bigH: number;
  keyRange: number; keyCooldown: number; keyDamage: number; name: string;
}

/** Tabela parametrów ruchu (GDD B). Oś Y dodatnia w dół. */
export const BROTHERS: Record<Brother, BrotherParams> = {
  M: { walk: 150, run: 235, accel: 1100, airAccel: 650, decel: 1350, jump: -420, stompBounce: -310,
       hitW: 22, hitH: 30, bigW: 24, bigH: 42, keyRange: 46, keyCooldown: 0.44, keyDamage: 2, name: 'Marioosh' },
  D: { walk: 165, run: 255, accel: 1300, airAccel: 780, decel: 1500, jump: -455, stompBounce: -325,
       hitW: 20, hitH: 30, bigW: 22, bigH: 40, keyRange: 40, keyCooldown: 0.33, keyDamage: 1, name: 'Darioosh' },
};

export const GRAVITY = 1150;
export const RISE_RELEASE_GRAVITY_MULT = 1.8;
export const MAX_FALL = 700;
export const COYOTE = 0.1;
export const JUMP_BUFFER = 0.12;
export const KEY_WINDUP = 0.08;
export const KEY_ACTIVE = 0.12;
export const STOMP_MIN_VY = 80;
export const INVULN_AFTER_HIT = 1.3;
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

export const TELEPORT_TIME = 0.55;
export const PICKUP_RADIUS = 24;
