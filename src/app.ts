/** Aplikacja: pętla, sceny, ustawienia, pełny ekran. */
import { AudioEngine } from './engine/audio';
import { Gfx } from './engine/gfx';
import { Input } from './engine/input';
import { setLang } from './engine/i18n';
import { Settings, loadSettings, saveSettings } from './engine/settings';
import type { Session } from './game/session';
import { STEP, VH, VW } from './game/constants';

export interface Scene {
  enter?(app: App): void;
  update(app: App, dt: number): void;
  draw(app: App, g: Gfx): void;
  leave?(app: App): void;
  /** czy rysować przyciski dotykowe */
  touchUI?: boolean;
  /** scena, w której klawisz F nie przełącza pełnego ekranu (np. F = atak) */
  noFsKey?: boolean;
}

function readDebug(): boolean {
  if ((globalThis as { __MARIOOSH_DEBUG?: boolean }).__MARIOOSH_DEBUG === true) return true;   // wymuszenie przez stronę-hosta (np. strona testera)
  if ((import.meta as { env?: Record<string, string> }).env?.VITE_DEBUG === '1') return true;
  try {
    const q = new URLSearchParams(location.search).get('debug');
    if (q === '1') localStorage.setItem('marioosh.debug', '1'); else if (q === '0') localStorage.removeItem('marioosh.debug');
    return localStorage.getItem('marioosh.debug') === '1';
  } catch { return false; }
}
export function setDebugEnabled(on: boolean): void { try { if (on) localStorage.setItem('marioosh.debug', '1'); else localStorage.removeItem('marioosh.debug'); } catch { /* */ } }

export class App {
  g: Gfx; input: Input; audio = new AudioEngine(); settings: Settings = loadSettings();
  session: Session | null = null;
  /** tryb testera (ukryty): wybór dowolnego poziomu, opcjonalny „god mode”; włączany ?debug=1 lub 5× dotknięciem numeru wersji */
  debug = { enabled: readDebug(), god: true };
  scene!: Scene; time = 0; private acc = 0; private last = 0; tapFx: { x: number; y: number; t: number } | null = null;
  private unlocked = false;

  constructor(canvas: HTMLCanvasElement) {
    this.g = new Gfx(canvas);
    this.input = new Input(this.settings, this.g, () => this.unlockAudio());
    this.applySettings();
    window.addEventListener('resize', () => this.g.resize());
    window.addEventListener('orientationchange', () => setTimeout(() => this.g.resize(), 200));
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyF' && !e.repeat && this.allowFsKey()) this.toggleFullscreen();
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.audio.duck(true); else this.audio.duck(false); });
  }
  private allowFsKey(): boolean { return !this.scene?.noFsKey; }

  unlockAudio(): void { if (!this.unlocked) { this.unlocked = true; this.audio.unlock(); } }

  applySettings(save = true): void {
    setLang(this.settings.lang); this.g.lang = this.settings.lang;
    this.audio.setVolumes(this.settings.music, this.settings.sfx);
    this.input.setSettings(this.settings);
    if (save) saveSettings(this.settings);
  }

  setScene(s: Scene): void { this.scene?.leave?.(this); this.scene = s; s.enter?.(this); }

  toggleFullscreen(): void {
    try {
      const d = document as Document & { webkitFullscreenElement?: Element; webkitExitFullscreen?: () => void };
      const el = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => void };
      if (document.fullscreenElement || d.webkitFullscreenElement) { (document.exitFullscreen ?? d.webkitExitFullscreen)?.call(document); }
      else (el.requestFullscreen ?? el.webkitRequestFullscreen)?.call(el);
    } catch { /* ignoruj */ }
  }

  start(): void {
    const loop = (ts: number) => {
      const now = ts / 1000; let dt = now - (this.last || now); this.last = now;
      if (dt > 0.25) dt = 0.25;
      this.acc += dt;
      let steps = 0;
      while (this.acc >= STEP && steps < 5) {
        this.input.poll();
        if (this.input.menu.tap) this.tapFx = { x: this.input.menu.tap.x, y: this.input.menu.tap.y, t: 0.25 };
        this.scene.update(this, STEP);
        this.input.endStep();
        this.acc -= STEP; this.time += STEP; steps++;
      }
      if (steps === 5) this.acc = 0;
      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  render(): void {
    const g = this.g; g.resize();
    g.begin();
    this.scene.draw(this, g);
    if (this.scene.touchUI && this.input.touchEnabled) this.drawTouch();
    g.end();
  }

  private drawTouch(): void {
    const g = this.g, c = g.ctx;
    for (const b of this.input.touchButtons) {
      if (b.action === 'switch' && this.session?.coop) continue;
      if (b.action === 'switch' && !this.session) continue;
      c.globalAlpha = 0.28; c.fillStyle = '#000'; c.beginPath(); c.arc(b.x + b.w / 2, b.y + b.h / 2, Math.min(b.w, b.h) / 2, 0, Math.PI * 2); c.fill();
      c.globalAlpha = 0.6; c.strokeStyle = '#fff'; c.lineWidth = 2; c.stroke(); c.globalAlpha = 1;
      g.text(b.label, b.x + b.w / 2, b.y + b.h / 2 - 5, { size: 10, align: 'center', alpha: 0.9, shadow: null });
    }
  }
}
void VW; void VH;
