import { ACTIONS, Action, Settings } from './settings';
import { VH, VW } from '../game/constants';
import type { Gfx } from './gfx';

export type PadState = Record<Action, boolean> & { pause: boolean };
export interface PlayerInput {
  held: Record<Action, boolean>;
  pressed: Record<Action, boolean>;   // zbocze narastające od ostatniego kroku logiki
  released: Record<Action, boolean>;
}
const blank = (): Record<Action, boolean> => ({ left: false, right: false, up: false, down: false, jump: false, run: false, attack: false, interact: false, switch: false });
const newPI = (): PlayerInput => ({ held: blank(), pressed: blank(), released: blank() });

export interface TouchButton { id: string; action: Action | 'pause'; x: number; y: number; w: number; h: number; label: string; }

/** Menu: logiczne akcje nawigacyjne */
export interface MenuInput { up: boolean; down: boolean; left: boolean; right: boolean; ok: boolean; back: boolean; pause: boolean; tap: { x: number; y: number } | null; }

export class Input {
  players: [PlayerInput, PlayerInput] = [newPI(), newPI()];
  menu: MenuInput = { up: false, down: false, left: false, right: false, ok: false, back: false, pause: false, tap: null };
  keys = new Set<string>();
  private edge = new Set<string>();
  private prevHeld: [Record<Action, boolean>, Record<Action, boolean>] = [blank(), blank()];
  private prevMenu = { up: false, down: false, left: false, right: false, ok: false, back: false, pause: false };
  private pendingTap: { x: number; y: number } | null = null;
  touchActive = false; touchSeen = false;
  private touches = new Map<number, { x: number; y: number }>();
  touchButtons: TouchButton[] = [];
  lastKeyCode: string | null = null;     // do przypisywania klawiszy
  anyActivity = false;
  padCount = 0;
  coop = false;

  constructor(private settings: Settings, private gfx: Gfx, private onFirstGesture: () => void) {
    window.addEventListener('keydown', (e) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();
      if (!this.keys.has(e.code)) this.edge.add(e.code);
      this.keys.add(e.code); this.lastKeyCode = e.code; this.anyActivity = true; this.onFirstGesture();
    });
    window.addEventListener('keyup', (e) => { this.keys.delete(e.code); });
    window.addEventListener('blur', () => { this.keys.clear(); this.touches.clear(); });
    const cv = gfx.canvas;
    const ptr = (e: PointerEvent, down: boolean) => {
      this.onFirstGesture();
      const v = gfx.toVirtual(e.clientX, e.clientY);
      if (e.pointerType === 'touch') { this.touchSeen = true; this.touchActive = true; }
      if (down) { this.touches.set(e.pointerId, v); this.pendingTap = v; try { cv.setPointerCapture(e.pointerId); } catch { /* */ } }
      else this.touches.delete(e.pointerId);
      this.anyActivity = true;
    };
    cv.addEventListener('pointerdown', (e) => ptr(e, true));
    cv.addEventListener('pointermove', (e) => { if (this.touches.has(e.pointerId)) this.touches.set(e.pointerId, gfx.toVirtual(e.clientX, e.clientY)); });
    cv.addEventListener('pointerup', (e) => ptr(e, false));
    cv.addEventListener('pointercancel', (e) => ptr(e, false));
    cv.addEventListener('contextmenu', (e) => e.preventDefault());
    this.layoutTouch();
  }

  setSettings(s: Settings): void { this.settings = s; this.layoutTouch(); }

  get touchEnabled(): boolean {
    const t = this.settings.touch;
    return t === 'on' || (t === 'auto' && (this.touchSeen || (typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches)));
  }

  layoutTouch(): void {
    const s = this.settings.touchSize;
    const b = (id: string, action: Action | 'pause', x: number, y: number, w: number, h: number, label: string): TouchButton => ({ id, action, x, y, w, h, label });
    const u = 44 * s;
    this.touchButtons = [
      b('l', 'left', 8, VH - u - 14, u, u, '◀'), b('r', 'right', 8 + u + 8, VH - u - 14, u, u, '▶'),
      b('u', 'up', 8 + (u + 8) / 2, VH - u * 2 - 22, u, u * 0.8, '▲'), b('d', 'down', 8 + (u + 8) / 2, VH - 12 - u * 0.1 + 4, u, u * 0.4, '▼'),
      b('j', 'jump', VW - u * 1.5 - 10, VH - u * 1.5 - 12, u * 1.5, u * 1.5, 'A'),
      b('a', 'attack', VW - u * 2.6 - 18, VH - u - 14, u, u, 'B'),
      b('run', 'run', VW - u * 1.5 - 10 - u - 8, VH - u * 2.1 - 16, u * 0.9, u * 0.9, 'R'),
      b('i', 'interact', VW - u * 0.9 - 8, VH - u * 1.5 - 12 - u * 0.9 - 8, u * 0.9, u * 0.9, 'E'),
      b('s', 'switch', VW - u * 1.8 - 14, 8, u * 0.9, u * 0.7, '⇄'),
      b('p', 'pause', VW - u * 0.9 - 8, 8, u * 0.9, u * 0.7, 'II'),
    ];
  }

  private touchHeld(): Record<string, boolean> {
    const out: Record<string, boolean> = {};
    if (!this.touchEnabled) return out;
    for (const t of this.touches.values()) for (const b of this.touchButtons) {
      if (t.x >= b.x - 6 && t.x <= b.x + b.w + 6 && t.y >= b.y - 6 && t.y <= b.y + b.h + 6) out[b.action] = true;
    }
    return out;
  }

  private kd(code: string): boolean { return this.keys.has(code) || this.edge.has(code); }

  private pads(): Gamepad[] {
    try { return [...(navigator.getGamepads?.() ?? [])].filter((g): g is Gamepad => !!g && g.connected); } catch { return []; }
  }

  /** wywoływane raz na krok logiki, PRZED aktualizacją sceny */
  poll(): void {
    const pads = this.pads(); this.padCount = pads.length;
    const th = this.touchHeld();
    const padStates: Record<string, boolean>[] = pads.map((g) => {
      const ax = g.axes[0] ?? 0, ay = g.axes[1] ?? 0, bt = (i: number) => !!g.buttons[i]?.pressed;
      return {
        left: ax < -0.4 || bt(14), right: ax > 0.4 || bt(15), up: ay < -0.6 || bt(12), down: ay > 0.6 || bt(13),
        jump: bt(0), run: bt(1) || bt(7) || bt(5), attack: bt(2), interact: bt(3), switch: bt(4) || bt(6), pause: bt(9),
      };
    });
    const k = this.settings.keys;
    for (let p = 0 as 0 | 1; p < 2; p = (p + 1) as 0 | 1) {
      const held = blank();
      for (const a of ACTIONS) {
        const solo = !this.coop;
        let v = this.kd(k[p][a]) || (solo && p === 0 && this.kd(k[1][a]));
        const pad = this.coop ? padStates[p] ?? (p === 0 && padStates.length === 1 ? undefined : undefined) : (p === 0 ? padStates[0] : undefined);
        if (pad?.[a]) v = true;
        if (p === 0 && th[a]) v = true;
        held[a] = v;
      }
      const pi = this.players[p], prev = this.prevHeld[p];
      for (const a of ACTIONS) {
        pi.pressed[a] = pi.pressed[a] || (held[a] && !prev[a]);   // zostaje do skonsumowania w tym kroku
        pi.released[a] = pi.released[a] || (!held[a] && prev[a]);
        pi.held[a] = held[a];
      }
      this.prevHeld[p] = held;
    }
    // menu
    const m = { up: false, down: false, left: false, right: false, ok: false, back: false, pause: false };
    const anyKey = (...codes: string[]) => codes.some((c) => this.keys.has(c));
    const pd = padStates;
    m.up = anyKey('ArrowUp', 'KeyW') || pd.some((p) => p.up);
    m.down = anyKey('ArrowDown', 'KeyS') || pd.some((p) => p.down);
    m.left = anyKey('ArrowLeft', 'KeyA') || pd.some((p) => p.left);
    m.right = anyKey('ArrowRight', 'KeyD') || pd.some((p) => p.right);
    m.ok = anyKey('Enter', 'Space', 'NumpadEnter') || pd.some((p) => p.jump);
    m.back = anyKey('Escape', 'Backspace') || pd.some((p) => p.run);
    m.pause = anyKey('Escape', 'KeyP') || pd.some((p) => p.pause) || !!th.pause;
    const pm = this.prevMenu;
    this.menu = {
      up: m.up && !pm.up, down: m.down && !pm.down, left: m.left && !pm.left, right: m.right && !pm.right,
      ok: m.ok && !pm.ok, back: m.back && !pm.back, pause: m.pause && !pm.pause, tap: this.pendingTap,
    };
    this.prevMenu = m;
    this.pendingTap = null;
  }

  /** po kroku logiki czyścimy zbocza */
  endStep(): void {
    for (const pi of this.players) for (const a of ACTIONS) { pi.pressed[a] = false; pi.released[a] = false; }
    this.edge.clear(); this.lastKeyCode = this.lastKeyCode && this.keys.has(this.lastKeyCode) ? this.lastKeyCode : null;
  }
  /** pauza wymaga osobnego zbocza (Esc / P / Start / przycisk dotykowy) */
  get pausePressed(): boolean { return this.menu.pause; }
}
