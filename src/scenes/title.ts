import type { App, Scene } from '../app';
import type { Gfx } from '../engine/gfx';
import { LANGS, t } from '../engine/i18n';
import { VH, VW } from '../game/constants';
import { heroSprite, parallaxLayer } from '../sprites/art';
import { Menu, skyBackdrop, title } from './ui';
import { SlotScene, SettingsScene } from './menus';
import { setDebugEnabled } from '../app';
import { MapScene } from './map';
import { Session } from '../game/session';
import { TESTER_SLOT, testerSave } from '../game/save';
import { LEVEL_IDS } from '../game/levels';

export class TitleScene implements Scene {
  menu!: Menu; armed = false; t = 0; verTaps = 0; verT = 0;
  enter(app: App): void {
    this.menu = new Menu([
      { label: () => t('menu.play'), action: () => app.setScene(new SlotScene()) },
      { label: () => t('menu.settings'), action: () => app.setScene(new SettingsScene(() => new TitleScene())) },
      { label: () => t('menu.credits'), action: () => app.setScene(new CreditsScene()) },
      { label: () => t('menu.fullscreen'), action: () => app.toggleFullscreen() },
      ...(app.debug.enabled ? [{ label: () => 'TESTER: wybór poziomów (god mode)', action: () => { app.session = new Session(testerSave(LEVEL_IDS), TESTER_SLOT); app.input.menu.ok = false; app.setScene(new MapScene('W3-L4')); } }] : []),
      {
        label: () => `◀  ${t('lang.name')}  ▶`, fontLang: () => app.settings.lang,
        action: (d = 1) => { const i = LANGS.indexOf(app.settings.lang as never); app.settings.lang = LANGS[(i + (d || 1) + LANGS.length) % LANGS.length]; app.applySettings(); app.audio.sfx('menu'); },
      },
    ]);
    app.session = null; app.audio.music('title');
  }
  update(app: App, dt: number): void {
    this.t += dt; this.verT -= dt; if (this.verT <= 0) this.verTaps = 0;
    const tp = app.input.menu.tap;
    if (this.armed && tp && tp.x > VW - 90 && tp.y > VH - 28) { this.verTaps++; this.verT = 3; if (this.verTaps >= 5) { setDebugEnabled(!app.debug.enabled); app.debug.enabled = !app.debug.enabled; app.setScene(new TitleScene()); return; } }
    if (!this.armed) { if (app.input.anyActivity || app.input.menu.ok || app.input.menu.tap) { this.armed = true; app.unlockAudio(); app.audio.music('title'); app.audio.sfx('select'); app.input.anyActivity = false; } return; }
    if (app.input.menu.back) return;
    this.menu.update(app);
  }
  draw(app: App, g: Gfx): void {
    skyBackdrop(g, this.t, 1);
    const ctx = g.ctx;
    for (let l = 0; l < 3; l++) { const img = parallaxLayer(1, l as 0 | 1 | 2); const ox = -((this.t * (8 + l * 10)) % 640); ctx.globalAlpha = 0.9; ctx.drawImage(img, ox, 0, 640, 400); ctx.drawImage(img, ox + 640, 0, 640, 400); ctx.globalAlpha = 1; }
    g.srect(0, VH - 40, VW, 40, '#2b1f2e'); g.srect(0, VH - 40, VW, 6, '#71c878');
    const bob = Math.sin(this.t * 3) * 2;
    g.spr(heroSprite('M', 'idle', false), 70, VH - 40 - 96 + bob, { w: 80, h: 96, screen: true });
    g.spr(heroSprite('D', 'idle', false), VW - 140, VH - 40 - 96 - bob, { w: 80, h: 96, screen: true, flip: true });
    title(g, t('game.title'), 38, g.lang === 'zh' || g.lang === 'ar' ? 15 : 14);
    g.text(t('game.subtitle'), VW / 2, 70, { size: 10, align: 'center', color: '#fff3a0' });
    g.wrap(t('game.tagline'), 500, 7).forEach((ln, i) => g.text(ln, VW / 2, 92 + i * g.lineH(7), { size: 7, align: 'center', color: '#e8e8f0' }));
    if (!this.armed) g.text(app.input.touchEnabled ? t('press.tap') : t('press.start'), VW / 2, 190, { size: 9, align: 'center', color: '#ffd23f', alpha: 0.5 + 0.5 * Math.sin(this.t * 5) });
    else this.menu.draw(g, VW / 2, 146, 27, 280, 9);
    g.text('v0.3.0', VW - 6, VH - 12, { size: 6, align: 'right', color: '#c8c8d8', shadow: null });
    g.text(t('fs.hint'), 6, VH - 12, { size: 6, color: '#c8c8d8', shadow: null });
  }
}

export class CreditsScene implements Scene {
  t = 0;
  update(app: App, dt: number): void { this.t += dt; if (app.input.menu.back || app.input.menu.ok || app.input.menu.tap) app.setScene(new TitleScene()); }
  draw(_app: App, g: Gfx): void {
    skyBackdrop(g, this.t, 6);
    title(g, t('menu.credits'), 24, 12);
    const lines = g.wrap(t('credits.text'), 520, 7);
    lines.forEach((ln, i) => g.text(ln, VW / 2, 70 + i * g.lineH(7), { size: 7, align: 'center', color: '#e8e8f0' }));
    g.text('◀ ' + t('menu.back'), 10, 10, { size: 8, color: '#c8c8d8' });
  }
}
