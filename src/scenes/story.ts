import type { App, Scene } from '../app';
import type { Gfx } from '../engine/gfx';
import { t } from '../engine/i18n';
import { VH, VW } from '../game/constants';
import { heroSprite, itemSprite, cableSprite, statueSprite, scarletSprite } from '../sprites/art';
import { MapScene } from './map';
import { TitleScene } from './title';
import { panel, skyBackdrop, title } from './ui';
import { SLOTS, readSlot, writeSlot } from '../game/save';

/** Strona fabularna: ilustracja + maszynowy tekst. */
class PagesScene implements Scene {
  i = 0; tt = 0; shown = 0;
  constructor(public pages: { text: () => string; art: (g: Gfx, tt: number) => void; bg?: number }[], public done: (app: App) => void, public music: string | null = null) {}
  enter(app: App): void { if (this.music) app.audio.music(this.music); }
  update(app: App, dt: number): void {
    this.tt += dt; const m = app.input.menu; const full = this.pages[this.i].text().length;
    this.shown = Math.min(full, this.shown + dt * 38);
    if (m.back) { this.done(app); return; }
    if (m.ok || m.tap) {
      if (this.shown < full) { this.shown = full; return; }
      app.audio.sfx('select'); this.i++; this.shown = 0; this.tt = 0;
      if (this.i >= this.pages.length) this.done(app);
    }
  }
  draw(app: App, g: Gfx): void {
    const p = this.pages[Math.min(this.i, this.pages.length - 1)];
    skyBackdrop(g, this.tt, p.bg ?? 1);
    p.art(g, this.tt);
    panel(g, 30, 232, VW - 60, 104, 0.85);
    const txt = p.text(); const chars = [...txt]; const part = chars.slice(0, Math.floor(this.shown)).join('');
    g.wrap(txt, VW - 100, 8).forEach((ln, i) => {
      const start = g.wrap(txt, VW - 100, 8).slice(0, i).join('').length; void start;
    });
    // maszynowy tekst: zawijamy pełny tekst, odsłaniamy znaki
    let left = Math.floor(this.shown);
    g.wrap(txt, VW - 100, 8).forEach((ln, i) => { const chs = [...ln]; const shown = chs.slice(0, Math.max(0, left)).join(''); left -= chs.length + 1; if (shown) g.text(shown, g.font.rtl ? VW - 50 : 50, 244 + i * g.lineH(8), { size: 8, align: g.font.rtl ? 'right' : 'left' }); });
    void part;
    g.text(`${this.i + 1}/${this.pages.length}`, VW - 40, VH - 22, { size: 6, align: 'right', color: '#c8c8d8', shadow: null });
    g.text('▶', VW - 56, 322, { size: 9, color: '#ffd23f', alpha: this.shown >= [...txt].length ? 0.5 + 0.5 * Math.sin(app.time * 8) : 0 });
  }
}

const heroes = (g: Gfx, x: number, y: number, tt: number, flipD = false) => {
  g.spr(heroSprite('M', 'idle', false), x, y + Math.sin(tt * 3) * 2, { w: 80, h: 96, screen: true });
  g.spr(heroSprite('D', 'idle', false), x + 70, y - Math.sin(tt * 3) * 2, { w: 80, h: 96, screen: true, flip: flipD });
};
const floor = (g: Gfx, col = '#2b1f2e') => { g.srect(0, 200, VW, 40, col); g.srect(0, 200, VW, 5, '#8d93a0'); };
const swirl = (g: Gfx, cx: number, cy: number, tt: number) => { for (let i = 0; i < 40; i++) { const a = tt * 3 + i * 0.5, r = 6 + i * 3; g.srect(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.6, 4, 4, i % 2 ? '#7fd6ff' : '#ffd23f', 1 - i / 45); } };

export class IntroScene extends PagesScene {
  constructor() {
    super([
      { text: () => t('intro.1'), art: (g, tt) => { floor(g); heroes(g, 220, 104, tt); g.srect(60, 80, 90, 120, '#4a4a5a'); g.srect(70, 90, 70, 20, '#3fbf5a'); } },
      { text: () => t('intro.2'), art: (g, tt) => { floor(g); heroes(g, 140, 104, tt); g.spr(cableSprite('purple', 'up', Math.floor(tt * 4)), 380, 168, { w: 64, h: 64, screen: true }); swirl(g, 412, 150, tt * 0.3); } },
      { text: () => t('intro.3'), art: (g, tt) => { swirl(g, VW / 2, 110, tt); heroes(g, VW / 2 - 66, 60 + Math.sin(tt * 2) * 8, tt); } },
      { text: () => t('intro.4'), art: (g, tt) => { floor(g, '#2b3a2e'); for (let i = 0; i < 5; i++) g.spr(statueSprite(false, i), 60 + i * 110, 156, { w: 48, h: 66, screen: true }); heroes(g, 250, 100, tt);  g.spr(scarletSprite(1, 0), VW - 110, 118, { w: 60, h: 88, screen: true });} },
      { text: () => t('intro.5'), art: (g, tt) => { g.spr(scarletSprite(2, Math.floor(tt * 3)), VW / 2 - 40, 70 + Math.sin(tt * 2) * 4, { w: 80, h: 116, screen: true }); for (let i = 0; i < 8; i++) { g.ctx.fillStyle = i % 2 ? '#ffd23f' : '#7fd6ff'; g.ctx.beginPath(); g.ctx.arc(70 + i * 72, 120 + Math.sin(tt * 2 + i) * 14, 14, 0, Math.PI * 2); g.ctx.fill(); } },bg: 6 },
      { text: () => t('intro.6'), art: (g, tt) => { floor(g); heroes(g, 160, 104, tt); for (let i = 0; i < 6; i++) g.spr(itemSprite(i % 2 ? 'can' : 'pet', Math.floor(tt * 4)), 380 + i * 30, 160 + Math.sin(tt * 3 + i) * 6, { w: 30, h: 30, screen: true }); } },
    ], (app) => app.setScene(new MapScene('W1-L1')), 'title');
  }
}

export class EndingScene extends PagesScene {
  constructor() {
    const sc = (app: { session: { shards: Set<string> } | null }) => (app.session?.shards.size ?? 0) >= 8;
    void sc;
    super([], () => {}, 'map');
  }
  override enter(app: App): void {
    const s = app.session!; const secret = s.shards.size >= 8;
    type Pg = { text: () => string; art: (g: Gfx, tt: number) => void; bg?: number };
    const base: Pg[] = [1, 2, 3, 4, 5, 6].map((n) => ({ text: () => t('end.' + n), art: (g: Gfx, tt: number) => { floor(g, '#2b3a2e'); heroes(g, 180, 104, tt); g.spr(scarletSprite(3, Math.floor(tt * 2)), 360, 112, { w: 66, h: 96, screen: true }); for (let i = 0; i < 10; i++) g.srect((i * 71 + tt * 30) % VW, 20 + (i * 37) % 80, 3, 3, '#ffd23f'); } }));
    base.push({ text: () => `${t('end.final')}\n${t('end.stats', { r: s.freed.size, s: s.shards.size, n: s.notes.size })}\n${t('end.unlock')}`, art: (g, tt) => { floor(g, '#2b3a2e'); heroes(g, 220, 104, tt); } });
    if (secret) for (const k of ['end.s1', 'end.s2', 'end.s3', 'end.s4', 'end.tbc']) base.push({ text: () => t(k), art: (g, tt) => { floor(g, '#1b1c2a'); g.spr(cableSprite('purple', 'up', Math.floor(tt * 4)), 300, 168, { w: 64, h: 64, screen: true }); swirl(g, 332, 150, tt * 0.3); }, bg: 6 });
    this.pages = base;
    this.done = (a: App) => {
      s.data.endingSeen = true; if (secret) s.data.trueEndingSeen = true; s.data.night = s.data.night; s.persist();
      for (let i = 0; i < SLOTS; i++) { const d = readSlot(i); if (d && i === s.slot) { d.endingSeen = true; writeSlot(i, d); } }
      a.setScene(new TitleScene());
    };
    app.audio.music('w0'); void title; void VH;
  }
}
