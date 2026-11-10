import { describe, expect, it } from 'vitest';
import { heroFrameFor } from '../src/game/worldDraw';
import { FALL_DAMAGE } from '../src/game/constants';
import type { PlayerEnt } from '../src/game/entities';

type Over = { body?: Partial<PlayerEnt['mv']['body']>; mv?: Record<string, unknown>; p?: Record<string, unknown> };
const mk = (o: Over): PlayerEnt => ({
  dead: false, hurtT: 0, atk: { phase: 'none' }, anim: 0.0,
  mv: { hang: null, ledge: null, climbing: false, swimming: false, duck: false, lock: 0, fallDist: 0, angle: 0, body: { vx: 0, vy: 0, onGround: true, ...o.body }, ...o.mv },
  ...o.p,
}) as unknown as PlayerEnt;

describe('dobór pozy bohatera (v0.4)', () => {
  it('pływanie: tread / dive / swimUp / swim / wade', () => {
    expect(heroFrameFor(mk({ mv: { swimming: true }, body: { onGround: false } }))).toBe('tread');
    expect(heroFrameFor(mk({ mv: { swimming: true }, body: { onGround: false, vy: 100 } }))).toBe('dive');
    expect(heroFrameFor(mk({ mv: { swimming: true }, body: { onGround: false, vy: -100 } }))).toBe('swimUp');
    expect(heroFrameFor(mk({ mv: { swimming: true }, body: { onGround: false, vx: 90 } }))).toBe('swim');
    expect(heroFrameFor(mk({ mv: { swimming: true }, body: { onGround: true, vx: 40 } }))).toMatch(/^wade/);
  });
  it('drabina: stoi / w górę / w dół', () => {
    expect(heroFrameFor(mk({ mv: { climbing: true } }))).toBe('ladIdle');
    expect(heroFrameFor(mk({ mv: { climbing: true }, body: { vy: -80 } }))).toMatch(/^ladUp/);
    expect(heroFrameFor(mk({ mv: { climbing: true }, body: { vy: 90 } }))).toMatch(/^ladDn/);
  });
  it('rampa: pod górę i z góry zależy od kierunku ruchu względem nachylenia', () => {
    expect(heroFrameFor(mk({ mv: { angle: 0.46 }, body: { vx: 70 } }))).toMatch(/^up/);
    expect(heroFrameFor(mk({ mv: { angle: 0.46 }, body: { vx: -70 } }))).toMatch(/^down/);
    expect(heroFrameFor(mk({ mv: { angle: -0.46 }, body: { vx: 70 } }))).toMatch(/^down/);
    expect(heroFrameFor(mk({ body: { vx: 170 } }))).toMatch(/^run/);
  });
  it('lądowanie, podciąganie i przeskok', () => {
    expect(heroFrameFor(mk({ mv: { lock: 0.3, fallDist: 60 } }))).toBe('stumble');
    expect(heroFrameFor(mk({ mv: { lock: 0.3, fallDist: FALL_DAMAGE + 4 } }))).toBe('hardLand');
    expect(heroFrameFor(mk({ mv: { ledge: { kind: 'vault' } } }))).toBe('vault');
    expect(heroFrameFor(mk({ mv: { ledge: { kind: 'pull' } } }))).toBe('pullUp');
    expect(heroFrameFor(mk({ mv: { hang: { side: 1 } } }))).toBe('hang');
  });
});
