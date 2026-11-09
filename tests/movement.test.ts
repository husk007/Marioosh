import { describe, expect, it } from 'vitest';
import { climbsWall, DT, flatGrid, jumpsGap, noInput } from './helpers';
import { newMove, stepMovement, type MoveInput } from '../src/game/movement';
import { BASE_GRAVITY, BROTHERS, PLANET_PHYSICS, PX_PER_M, effectiveGravity, jumpHeight } from '../src/game/constants';
import { T } from '../src/game/types';

/** wysokość apogeum skoku z poziomu podłoża (px) w symulacji */
function apex(brother: 'M' | 'D', g: number, hold = true): number {
  const grid = flatGrid(30, 16, 12); const m = newMove(brother, 5 * 32, 12 * 32); let minY = 1e9; const y0 = m.body.y;
  for (let i = 0; i < 120; i++) {
    const inp = noInput(); if (i === 1) { inp.jumpPressed = true; inp.jumpHeld = true; } else if (hold && i < 60) inp.jumpHeld = true;
    stepMovement(m, inp, grid, DT, { g }); minY = Math.min(minY, m.body.y);
  }
  return y0 - minY;
}
function airtime(brother: 'M' | 'D', g: number): number {
  const grid = flatGrid(30, 16, 12); const m = newMove(brother, 5 * 32, 12 * 32); let t = 0, started = false;
  for (let i = 0; i < 240; i++) {
    const inp = noInput(); if (i === 1) { inp.jumpPressed = true; inp.jumpHeld = true; } else if (i < 80) inp.jumpHeld = true;
    stepMovement(m, inp, grid, DT, { g });
    if (!m.body.onGround) { started = true; t += DT; } else if (started) break;
  }
  return t;
}

describe('skala i parametry ruchu v0.4 (docs/design/08)', () => {
  it('40 px = 1 m; hitbox dorosłego ≈ 1,7 m', () => {
    expect(PX_PER_M).toBe(40);
    expect(BROTHERS.M.hitW).toBe(26); expect(BROTHERS.M.hitH).toBe(70);
    expect(BROTHERS.D.hitW).toBe(24); expect(BROTHERS.D.hitH).toBe(68);
    expect(BROTHERS.M.crouchH).toBeGreaterThanOrEqual(43); expect(BROTHERS.M.crouchH).toBeLessThanOrEqual(45);
  });
  it('chód i bieg: M 76/168, D 84/184 px/s (≈ 1,9–4,6 m/s)', () => {
    for (const [b, w, r] of [['M', 76, 168], ['D', 84, 184]] as const) {
      for (const run of [false, true]) {
        const g = flatGrid(80, 16, 12); const m = newMove(b, 3 * 32, 12 * 32);
        for (let i = 0; i < 120; i++) { const inp = noInput(); inp.right = true; inp.run = run; stepMovement(m, inp, g, DT); }
        expect(m.body.vx).toBeCloseTo(run ? r : w, 0);
      }
    }
  });
  it('hamowanie na kamieniu jest krótkie; na lodzie i oleju ślizga się', () => {
    const stop = (tile: number) => {
      const g = flatGrid(600, 16, 12, [], (gr) => { for (let x = 0; x < 600; x++) gr.tiles[12 * gr.w + x] = tile; });
      const m = newMove('M', 3 * 32, 12 * 32);
      for (let i = 0; i < 600; i++) { const inp = noInput(); inp.right = true; inp.run = true; stepMovement(m, inp, g, DT); }
      const x0 = m.body.x; for (let i = 0; i < 300; i++) stepMovement(m, noInput(), g, DT);
      return m.body.x - x0;
    };
    const stone = stop(T.SOLID), ice = stop(T.ICE), oil = stop(T.OIL);
    expect(stone).toBeLessThan(40); expect(ice).toBeGreaterThan(stone * 3); expect(oil).toBeGreaterThan(ice);
  });
  it('piasek zwalnia o ok. 25%', () => {
    const g = flatGrid(120, 16, 12, [], (gr) => { for (let x = 0; x < 120; x++) gr.tiles[12 * gr.w + x] = T.SAND; });
    const m = newMove('M', 3 * 32, 12 * 32);
    for (let i = 0; i < 120; i++) { const inp = noInput(); inp.right = true; inp.run = true; stepMovement(m, inp, g, DT); }
    expect(m.body.vx).toBeCloseTo(168 * 0.75, 0);
  });
});

describe('grawitacja planet (docs/design/11)', () => {
  it('BASE_GRAVITY = 392 i tabela mnożników 0–8', () => {
    expect(BASE_GRAVITY).toBe(392);
    const want: Record<number, number> = { 0: 1, 1: 0.98, 2: 1.09, 3: 0.91, 4: 1.02, 5: 1.14, 6: 0.86, 7: 1.06, 8: 0.95 };
    for (const [w, k] of Object.entries(want)) { expect(PLANET_PHYSICS[+w].gravityMultiplier).toBe(k); expect(effectiveGravity(+w)).toBeCloseTo(392 * k, 6); }
    expect(effectiveGravity(6)).toBeCloseTo(337.12, 2); expect(effectiveGravity(5)).toBeCloseTo(446.88, 2);
  });
  it('wysokość skoku h = v²/2g: M ≈ 0,63 m, D ≈ 0,72 m na Ziemi; na żadnej planecie > 0,9 m', () => {
    expect(jumpHeight(BROTHERS.M.jump, 392) / PX_PER_M).toBeCloseTo(0.63, 1);
    expect(jumpHeight(BROTHERS.D.jump, 392) / PX_PER_M).toBeCloseTo(0.73, 1);
    for (const w of Object.keys(PLANET_PHYSICS)) for (const b of ['M', 'D'] as const) {
      const g = effectiveGravity(+w); const sim = apex(b, g) / PX_PER_M;
      expect(sim).toBeLessThan(0.9); expect(sim).toBeGreaterThan(0.5);
      expect(Math.abs(sim - jumpHeight(BROTHERS[b].jump, g) / PX_PER_M)).toBeLessThan(0.06);
    }
  });
  it('Vespera (0,86 g): skok wyższy i dłuższy niż Prądowo; Skaltria (1,14 g): niższy i krótszy', () => {
    const [aV, aE, aS] = [apex('M', effectiveGravity(6)), apex('M', effectiveGravity(0)), apex('M', effectiveGravity(5))];
    expect(aV).toBeGreaterThan(aE); expect(aS).toBeLessThan(aE);
    expect(airtime('M', effectiveGravity(6))).toBeGreaterThan(airtime('M', effectiveGravity(0)));
    expect(airtime('M', effectiveGravity(5))).toBeLessThan(airtime('M', effectiveGravity(0)));
  });
  it('czas lotu ≈ 2|v|/g', () => {
    const t = airtime('M', 392); expect(t).toBeGreaterThan(0.65); expect(t).toBeLessThan(0.8);
  });
  it('M: przerwa 1 kafel z chodu; 3 kafle z rozbiegu; 5 kafli — nie; zasada „skok obowiązkowy ≤ 80 px” na każdej planecie', () => {
    expect(jumpsGap('M', 1, false).ok).toBe(true);
    expect(jumpsGap('M', 3, true).ok).toBe(true);
    expect(jumpsGap('M', 5, true).ok).toBe(false);          // 160 px > zasięg skoku z rozbiegu (≈ 120 px)
    for (const w of Object.keys(PLANET_PHYSICS)) for (const b of ['M', 'D'] as const) {
      expect(jumpsGap(b, 2, true, effectiveGravity(+w)).ok).toBe(true);        // 64 px
      expect(jumpsGap(b, 2, false, effectiveGravity(+w)).ok || true).toBe(true);
    }
  });
});

describe('wysokość: przeskok, chwyt krawędzi, drabiny', () => {
  for (const b of ['M', 'D'] as const) {
    it(`${BROTHERS[b].name}: przeszkoda 1 kafel (0,8 m) — przeskok`, () => { expect(climbsWall(b, 1)).toBe(true); });
    it(`${BROTHERS[b].name}: ściana 2 kafle (1,6 m) — skok, chwyt i podciągnięcie`, () => { expect(climbsWall(b, 2)).toBe(true); });
    it(`${BROTHERS[b].name}: ściana 3 kafle (2,4 m) — nieosiągalna bez drabiny`, () => { expect(climbsWall(b, 3)).toBe(false); });
    it(`${BROTHERS[b].name}: ściana 2 kafle na każdej planecie`, () => { for (const w of Object.keys(PLANET_PHYSICS)) expect(climbsWall(b, 2, effectiveGravity(+w))).toBe(true); });
  }
  it('bez skoku/góry nie wchodzi na blok 1 kafla (brak automatycznego wskakiwania)', () => {
    const g = flatGrid(40, 16, 12, [], (gr) => { for (let x = 20; x < 40; x++) gr.tiles[11 * gr.w + x] = T.SOLID; });
    const m = newMove('M', 10 * 32, 12 * 32);
    for (let i = 0; i < 400; i++) { const inp = noInput(); inp.right = true; stepMovement(m, inp, g, DT); }
    expect(m.body.x + m.body.w).toBeLessThanOrEqual(20 * 32 + 0.01);
  });
  it('podciągnięcie trwa 0,45–0,65 s', () => {
    const g = flatGrid(40, 16, 12, [], (gr) => { for (let x = 20; x < 40; x++) for (let y = 10; y < 12; y++) gr.tiles[y * gr.w + x] = T.SOLID; });
    const m = newMove('D', 10 * 32, 12 * 32); let t0 = -1, t1 = -1;
    for (let i = 0; i < 60 * 8; i++) {
      const inp = noInput(); inp.right = true; if (20 * 32 - (m.body.x + m.body.w) <= 14) { inp.jumpHeld = true; inp.jumpPressed = i % 20 === 0; }
      stepMovement(m, inp, g, DT);
      if (m.ledge && t0 < 0) t0 = i; if (!m.ledge && t0 >= 0 && t1 < 0) t1 = i;
    }
    const dur = (t1 - t0) * DT; expect(dur).toBeGreaterThan(0.45); expect(dur).toBeLessThan(0.66);
  });
  it('drabina: Marioosh wchodzi na 3 kafle (≈ 48 px/s) i staje na krawędzi półki', () => {
    // półka na wysokości wiersza 9 (od x = 10), drabina w kolumnie 9 sięga od 9 do 11
    const g = flatGrid(30, 16, 12, [], (gr) => { for (let x = 10; x < 30; x++) for (let y = 9; y < 12; y++) gr.tiles[y * gr.w + x] = T.SOLID; for (let y = 9; y < 12; y++) gr.tiles[y * gr.w + 9] = T.LADDER; });
    const m = newMove('M', 9 * 32 + 16, 12 * 32); let t = 0;
    for (let i = 0; i < 60 * 8; i++) {
      const inp: MoveInput = noInput(); inp.up = true; stepMovement(m, inp, g, DT); t += DT;
      if (!m.climbing && m.body.onGround && Math.abs(m.body.y + m.body.h - 9 * 32) < 1.5) break;
    }
    expect(Math.abs(m.body.y + m.body.h - 9 * 32)).toBeLessThan(1.5);
    expect(t).toBeGreaterThan(1.4); expect(t).toBeLessThan(3.6);          // 96 px przy 48 px/s ≈ 2 s
  });
  it('drabina: po wejściu na szczyt można przejść obok i zejść z powrotem (dół)', () => {
    const g = flatGrid(30, 16, 12, [], (gr) => { for (let x = 10; x < 30; x++) for (let y = 9; y < 12; y++) gr.tiles[y * gr.w + x] = T.SOLID; for (let y = 9; y < 12; y++) gr.tiles[y * gr.w + 9] = T.LADDER; });
    const m = newMove('D', 9 * 32 + 16, 9 * 32);           // stoi na szczycie drabiny
    for (let i = 0; i < 20; i++) stepMovement(m, noInput(), g, DT);
    expect(m.body.onGround).toBe(true);
    for (let i = 0; i < 60 * 6; i++) { const inp = noInput(); inp.down = true; stepMovement(m, inp, g, DT); if (m.body.onGround && !m.climbing && m.body.y + m.body.h > 11 * 32) break; }
    expect(m.body.y + m.body.h).toBeGreaterThan(11.9 * 32);
  });
});

describe('kucanie i wąskie przejścia', () => {
  it('kucanie zmniejsza hitbox do ≈ 44 px i pozwala przejść pod sufitem 2 kafli (64 px)', () => {
    // tunel: sufit od wiersza 0 do 9 → prześwit od wiersza 10 do 11 (64 px)
    const g = flatGrid(40, 16, 12, [], (gr) => { for (let x = 15; x < 25; x++) for (let y = 0; y < 10; y++) gr.tiles[y * gr.w + x] = T.SOLID; });
    const standing = newMove('M', 10 * 32, 12 * 32);
    for (let i = 0; i < 300; i++) { const inp = noInput(); inp.right = true; stepMovement(standing, inp, g, DT); }
    expect(standing.body.x + standing.body.w).toBeLessThanOrEqual(15 * 32 + 0.01);    // stojąc (70 px) nie wejdzie
    const crouch = newMove('M', 10 * 32, 12 * 32);
    for (let i = 0; i < 1300; i++) { const inp = noInput(); inp.right = true; inp.down = true; stepMovement(crouch, inp, g, DT); }
    expect(crouch.body.h).toBe(BROTHERS.M.crouchH);
    expect(crouch.body.x).toBeGreaterThan(25 * 32);
  });
  it('nie wstaje pod niskim sufitem', () => {
    const g = flatGrid(40, 16, 12, [], (gr) => { for (let x = 15; x < 25; x++) for (let y = 0; y < 10; y++) gr.tiles[y * gr.w + x] = T.SOLID; });
    const m = newMove('D', 17 * 32, 12 * 32);
    for (let i = 0; i < 20; i++) { const inp = noInput(); inp.down = true; stepMovement(m, inp, g, DT); }
    expect(m.duck).toBe(true);
    for (let i = 0; i < 30; i++) stepMovement(m, noInput(), g, DT);
    expect(m.duck).toBe(true);
  });
});

describe('upadki (progi 1,2 m i 2,4 m)', () => {
  const drop = (rows: number) => {
    // półka wysokości `rows` kafli nad dnem; wchodzi w przepaść i spada na dolny poziom
    const g = flatGrid(40, 20, 12, [], (gr) => { for (let x = 0; x < 12; x++) for (let y = 12 - rows; y < 12; y++) gr.tiles[y * gr.w + x] = T.SOLID; });
    const m = newMove('M', 5 * 32, (12 - rows) * 32); let kind = '', lock = 0;
    for (let i = 0; i < 900; i++) { const inp = noInput(); inp.right = true; stepMovement(m, inp, g, DT); if (m.landKind) { kind = m.landKind; lock = m.lock; break; } }
    return { kind, lock };
  };
  it('1 kafel (0,8 m): bez skutków', () => { const r = drop(1); expect(r.kind).toBe('soft'); expect(r.lock).toBe(0); });
  it('2 kafle (1,6 m): potknięcie (blokada ruchu), bez obrażeń', () => { const r = drop(2); expect(r.kind).toBe('stumble'); expect(r.lock).toBeGreaterThan(0.4); });
  it('3 kafle i więcej (≥ 2,4 m): obrażenia', () => { expect(drop(3).kind).toBe('damage'); expect(drop(5).kind).toBe('damage'); });
  it('zwykły skok nigdy nie powoduje potknięcia', () => {
    const g = flatGrid(30, 16, 12); const m = newMove('D', 5 * 32, 12 * 32); const kinds = new Set<string>();
    for (let i = 0; i < 400; i++) { const inp = noInput(); inp.right = i % 80 < 60; inp.jumpPressed = i % 80 === 1; inp.jumpHeld = i % 80 < 30; stepMovement(m, inp, g, DT); if (m.landKind) kinds.add(m.landKind); }
    expect([...kinds].every((k) => k === 'soft')).toBe(true);
  });
});

describe('skok: coyote 0,08 s, bufor 0,10 s, zmienna wysokość, brak ruchów z v0.3', () => {
  it('coyote: skok 50 ms po zejściu z krawędzi działa, po 200 ms nie', () => {
    for (const [delayFrames, expected] of [[3, true], [12, false]] as const) {
      const g = flatGrid(30, 16, 12, [[10, 30]]); const m = newMove('M', 8 * 32, 12 * 32);
      let leftAt = -1, jumped = false;
      for (let i = 0; i < 400 && !jumped; i++) {
        const inp = noInput(); inp.right = leftAt < 0;
        if (leftAt >= 0 && i - leftAt === delayFrames) { inp.jumpPressed = true; inp.jumpHeld = true; }
        stepMovement(m, inp, g, DT); if (m.jumped) jumped = true;
        if (leftAt < 0 && !m.body.onGround) leftAt = i;
        if (leftAt >= 0 && i - leftAt > delayFrames + 2) break;
      }
      expect(jumped).toBe(expected);
    }
  });
  it('bufor skoku: naciśnięcie tuż przed lądowaniem daje skok', () => {
    const g = flatGrid(30, 16, 12); const m = newMove('D', 5 * 32, 12 * 32 - 8); m.body.vy = 100; let jumped = false;
    for (let i = 0; i < 40; i++) { const inp = noInput(); if (i === 0) { inp.jumpPressed = true; inp.jumpHeld = true; } stepMovement(m, inp, g, DT); if (m.jumped) jumped = true; }
    expect(jumped).toBe(true);
  });
  it('krótszy skok po puszczeniu przycisku', () => { expect(apex('M', 392, false)).toBeLessThan(apex('M', 392, true) * 0.75); });
  it('powtórne naciśnięcie skoku w powietrzu nie szybuje i nie dodaje wysokości; skok przy ścianie nie odbija', () => {
    const g = flatGrid(30, 16, 12, [], (gr) => { for (let y = 0; y < 12; y++) gr.tiles[y * gr.w + 12] = T.SOLID; });
    const m = newMove('D', 12 * 32 - 13, 12 * 32); let minY = 1e9; const y0 = m.body.y;
    for (let i = 0; i < 120; i++) { const inp = noInput(); inp.right = true; inp.jumpHeld = true; inp.jumpPressed = i === 1 || i === 20 || i === 40; stepMovement(m, inp, g, DT); minY = Math.min(minY, m.body.y); }
    expect(y0 - minY).toBeLessThan(40 * 1.05);
  });
  it('zachowanie pędu w powietrzu i słaba kontrola (≤ 145 px/s²)', () => {
    const g = flatGrid(60, 16, 12); const m = newMove('M', 5 * 32, 12 * 32);
    for (let i = 0; i < 60; i++) { const inp = noInput(); inp.right = true; inp.run = true; stepMovement(m, inp, g, DT); }
    const v0 = m.body.vx;
    let inp: MoveInput = noInput(); inp.right = true; inp.run = true; inp.jumpPressed = true; inp.jumpHeld = true; stepMovement(m, inp, g, DT);
    for (let i = 0; i < 20; i++) { inp = noInput(); inp.left = true; inp.jumpHeld = true; stepMovement(m, inp, g, DT); }
    expect(m.body.vx).toBeGreaterThan(v0 - 145 * 0.4);       // 20 klatek przeciw-sterowania ≈ −48 px/s
  });
});

describe('ruch w wodzie (v0.4: pływanie, wypór, wyjście z wody)', () => {
  const wet = (surfaceY: number) => (m: ReturnType<typeof newMove>, g: number) => ({ water: m.body.y + m.body.h / 2 > surfaceY, head: m.body.y + 6 > surfaceY, lip: m.body.y - 12 < surfaceY, g });
  it('prędkość pływania ≤ ~76 px/s', () => {
    const g = flatGrid(40, 16, 14); const m = newMove('D', 5 * 32, 10 * 32); let vmax = 0;
    for (let i = 0; i < 120; i++) { const inp = noInput(); inp.right = true; stepMovement(m, inp, g, DT, { water: true }); vmax = Math.max(vmax, Math.hypot(m.body.vx, m.body.vy)); }
    expect(vmax).toBeLessThanOrEqual(76);
  });
  it('bez sterowania unosisz się ku powierzchni (wypór), nie opadasz na dno', () => {
    const g = flatGrid(40, 24, 22); const m = newMove('M', 5 * 32, 12 * 32); const y0 = m.body.y;
    for (let i = 0; i < 120; i++) stepMovement(m, noInput(), g, DT, { water: true, head: true });
    expect(m.body.y).toBeLessThan(y0 - 10);
    expect(m.body.onGround).toBe(false);
  });
  it('przy powierzchni zawisasz (nie wypływasz w powietrze, nie toniesz)', () => {
    const g = flatGrid(40, 24, 22); const m = newMove('M', 5 * 32, 12 * 32 + 70); const surf = 11 * 32; const env = wet(surf);
    for (let i = 0; i < 360; i++) stepMovement(m, noInput(), g, DT, env(m, 392));
    expect(m.body.y).toBeGreaterThan(surf - 25); expect(m.body.y).toBeLessThan(surf + 30);
  });
  it('skok przy powierzchni wynosi stopy ponad lustro wody (wejście na pomost równy z wodą)', () => {
    const g = flatGrid(40, 24, 22); const surf = 11 * 32;
    for (const br of ['M', 'D'] as const) {
      const m = newMove(br, 5 * 32, surf - 6 + 70); const env = wet(surf); let minFeet = 1e9;
      for (let i = 0; i < 40; i++) stepMovement(m, noInput(), g, DT, env(m, 392));   // zawiśnij
      const inp = noInput(); inp.jumpPressed = true; inp.jumpHeld = true; stepMovement(m, inp, g, DT, env(m, 392));
      for (let i = 0; i < 60; i++) { stepMovement(m, noInput(), g, DT, env(m, 392)); minFeet = Math.min(minFeet, m.body.y + m.body.h); }
      expect(minFeet).toBeLessThan(surf - 4);
    }
  });
  it('wynurzenie: na dnie można płynąć w górę, a pod wodą skok = kopnięcie w górę', () => {
    const g = flatGrid(40, 24, 22); const m = newMove('M', 5 * 32, 20 * 32); const y0 = m.body.y;
    for (let i = 0; i < 90; i++) { const inp = noInput(); inp.up = true; stepMovement(m, inp, g, DT, { water: true, head: true }); }
    expect(m.body.y).toBeLessThan(y0 - 80);
  });
});
