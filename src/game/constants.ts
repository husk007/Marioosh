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
  walk: number; run: number; accel: number; airAccel: number; decel: number; fric: number;
  jump: number; stompBounce: number; hitW: number; hitH: number; bigW: number; bigH: number;
  keyRange: number; keyCooldown: number; keyDamage: number; name: string;
  /** szybowanie: maks. prędkość opadania (px/s); 0 = brak */
  glideFall: number;
  /** ślizg po ścianie: maks. prędkość opadania; odbicie od ściany tylko gdy wallJump */
  wallSlide: number; wallJump: boolean;
  /** uderzenie w ziemię (rozbija pęknięte podłoża, ogłusza wrogów) */
  pound: boolean;
  /** wytrzymałość na kratkach/pnączach w sekundach (99 = bez limitu) */
  stamina: number;
  swim: number; sink: number; climbUp: number; climbDown: number;
}

/** Tabela parametrów ruchu (px, s). Oś Y dodatnia w dół. Marioosh: silny, ciężki (uderzenie w ziemię); Darioosh: szybki, zwinny (odbicie od ściany, długie szybowanie). */
export const BROTHERS: Record<Brother, BrotherParams> = {
  M: { walk: 300, run: 420, accel: 800, airAccel: 600, decel: 3200, fric: 1000, jump: -600, stompBounce: -440, hitW: 22, hitH: 30, bigW: 24, bigH: 42,
       keyRange: 46, keyCooldown: 0.44, keyDamage: 2, name: 'Marioosh', glideFall: 140, wallSlide: 200, wallJump: false, pound: true, stamina: 3, swim: 150, sink: 90, climbUp: 130, climbDown: 230 },
  D: { walk: 340, run: 520, accel: 950, airAccel: 700, decel: 3600, fric: 1100, jump: -680, stompBounce: -470, hitW: 20, hitH: 30, bigW: 22, bigH: 40,
       keyRange: 40, keyCooldown: 0.33, keyDamage: 1, name: 'Darioosh', glideFall: 85, wallSlide: 110, wallJump: true, pound: false, stamina: 99, swim: 190, sink: 40, climbUp: 150, climbDown: 250 },
};

/** grawitacja bohaterów (wrogowie i bossowie używają GRAVITY) */
export const HERO_GRAVITY = 1600;
export const HERO_MAX_FALL = 960;
/** po puszczeniu skoku prędkość wznoszenia jest obcinana do tej wartości (px/s) */
export const JUMP_CUT = 320;
export const SLOPE_ACC = 900;
export const MAX_SPEED = 1100;
export const SPRING_V = 1150;
export const SPRING_H = 900;
export const GRAVITY = 1150;
export const RISE_RELEASE_GRAVITY_MULT = 1.8;
export const MAX_FALL = 700;
export const COYOTE = 0.1;
export const JUMP_BUFFER = 0.12;
export const WALL_JUMP_LOCK = 0.16;
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
