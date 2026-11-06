import type { App, Scene } from '../app';
import type { Gfx } from '../engine/gfx';
import { LANGS, t } from '../engine/i18n';
import { ACTIONS, DEFAULT_KEYS, type Action } from '../engine/settings';
import { VH, VW } from '../game/constants';
import { SLOTS, completion, deleteSlot, newSave, readSlot, writeSlot } from '../game/save';
import { Session } from '../game/session';
import bestiary from '../data/bestiary.json';
import { WORLDS } from '../data/worlds';
import { Menu, backTap, drawBack, panel, skyBackdrop, title } from './ui';
import { MapScene } from './map';
import { IntroScene } from './story';
import { TitleScene } from './title';
import { keyName } from './play';

// ---------------------------------------------------------------- sloty
export class SlotScene implements Scene {
  menu!: Menu; confirm = -1; tt = 0;
  enter(app: App): void {
    this.menu = new Menu(Array.from({ length: SLOTS }, (_, i) => ({
      label: () => { const d = readSlot(i); return d ? `${t('slots.slot', { n: i + 1 })} — ${t('slots.info', { p: completion(d), s: d.score, c: d.packageCount })}` : `${t('slots.slot', { n: i + 1 })} — ${t('slots.empty')}`; },
      action: (dir = 0) => {
        const d = readSlot(i);
        if (dir === -1) { if (!d) return; if (this.confirm === i) { deleteSlot(i); this.confirm = -1; app.audio.sfx('break'); } else { this.confirm = i; app.audio.sfx('warn'); } return; }
        this.confirm = -1;
        if (!d) { app.setScene(new ModeScene(i)); return; }
        app.session = new Session(d, i); app.setScene(new MapScene(d.currentLevel));
      },
    })));
  }
  update(app: App, dt: number): void {
    this.tt += dt;
    if (app.input.menu.back || backTap(app)) { app.setScene(new TitleScene()); return; }
    this.menu.update(app);
  }
  draw(_app: App, g: Gfx): void {
    skyBackdrop(g, this.tt, 1); title(g, t('slots.title'), 30, 12); drawBack(g, t('menu.back'));
    this.menu.draw(g, VW / 2, 110, 46, 520, 8);
    if (this.confirm >= 0) g.text(t('slots.confirm'), VW / 2, 270, { size: 8, align: 'center', color: '#ff8a7a' });
    else g.text(`◀ ${t('slots.delete')}`, VW / 2, 290, { size: 7, align: 'center', color: '#c8c8d8', shadow: null });
  }
}

// ---------------------------------------------------------------- tryb
export class ModeScene implements Scene {
  menu!: Menu; tt = 0; step = 0; coop = false; night = false;
  constructor(public slot: number) {}
  enter(app: App): void { this.build(app); }
  private anyEnding(): boolean { for (let i = 0; i < SLOTS; i++) if (readSlot(i)?.endingSeen) return true; return false; }
  private start(app: App, brother: 'M' | 'D'): void {
    const d = newSave(this.coop ? 'coop' : 'solo', brother); d.night = this.night; writeSlot(this.slot, d);
    app.session = new Session(d, this.slot); app.setScene(new IntroScene());
  }
  private build(app: App): void {
    if (this.step === 0) {
      const items = [
        { label: () => t('mode.solo'), action: () => { this.coop = false; this.step = 1; this.build(app); } },
        { label: () => t('mode.coop'), action: () => { this.coop = true; this.start(app, 'M'); } },
      ];
      if (this.anyEnding()) items.push({ label: () => `${this.night ? t('mode.night') : t('mode.classic')}  ◀▶`, action: () => { this.night = !this.night; } });
      this.menu = new Menu(items);
    } else {
      this.menu = new Menu([
        { label: () => 'Marioosh', action: () => this.start(app, 'M') },
        { label: () => 'Darioosh', action: () => this.start(app, 'D') },
      ]);
    }
  }
  update(app: App, dt: number): void {
    this.tt += dt;
    if (app.input.menu.back || backTap(app)) { if (this.step === 1) { this.step = 0; this.build(app); } else app.setScene(new SlotScene()); return; }
    this.menu.update(app);
  }
  draw(_app: App, g: Gfx): void {
    skyBackdrop(g, this.tt, 1); title(g, t('mode.title'), 30, 12); drawBack(g, t('menu.back'));
    this.menu.draw(g, VW / 2, 110, 38, 420, 10);
    const sel = this.menu.sel; const key = this.step === 0 ? (sel === 0 ? 'mode.soloDesc' : sel === 1 ? 'mode.coopDesc' : 'mode.nightDesc') : sel === 0 ? 'bro.m1' : 'bro.d1';
    g.wrap(t(key), 440, 8).forEach((ln, i) => g.text(ln, VW / 2, 260 + i * g.lineH(8), { size: 8, align: 'center', color: '#fff3a0' }));
  }
}

// ---------------------------------------------------------------- ustawienia
export class SettingsScene implements Scene {
  menu!: Menu; tt = 0;
  constructor(public back: () => Scene) {}
  enter(app: App): void {
    const S = app.settings;
    const sl = (key: 'music' | 'sfx' | 'voice') => ({ label: () => t('settings.' + key), slider: () => S[key], action: (d = 0) => { S[key] = Math.max(0, Math.min(1, +(S[key] + (d || 0.1) * 0.1).toFixed(2))); app.applySettings(); app.audio.sfx('pet'); } });
    const tg = (key: 'reduceFlashes' | 'reduceShake' | 'captions', k: string) => ({ label: () => `${t(k)}: ${S[key] ? t('settings.on') : t('settings.off')}`, action: () => { S[key] = !S[key]; app.applySettings(); } });
    this.menu = new Menu([
      sl('music'), sl('sfx'), sl('voice'),
      { label: () => `${t('settings.lang')}: ${t('lang.name')}`, fontLang: () => S.lang, action: (d = 1) => { const i = LANGS.indexOf(S.lang as never); S.lang = LANGS[(i + (d || 1) + LANGS.length) % LANGS.length]; app.applySettings(); } },
      tg('reduceFlashes', 'settings.flashes'), tg('reduceShake', 'settings.shake'), tg('captions', 'settings.captions'),
      { label: () => `${t('settings.touch')}: ${S.touch === 'auto' ? t('settings.auto') : S.touch === 'on' ? t('settings.on') : t('settings.off')}`, action: () => { S.touch = S.touch === 'auto' ? 'on' : S.touch === 'on' ? 'off' : 'auto'; app.applySettings(); } },
      { label: () => t('settings.touchSize'), slider: () => (S.touchSize - 0.8) / 0.6, action: (d = 0) => { S.touchSize = Math.max(0.8, Math.min(1.4, +(S.touchSize + (d || 1) * 0.1).toFixed(2))); app.applySettings(); } },
      { label: () => t('settings.keys', { n: 1 }), action: () => app.setScene(new KeysScene(0, this.back)) },
      { label: () => t('settings.keys', { n: 2 }), action: () => app.setScene(new KeysScene(1, this.back)) },
      {
        label: () => `${t('settings.outfit')}: ${S.outfit === 'night' ? t('settings.outfitNight').replace(/\s*\(.*\)/, '') : t('settings.outfitClassic')}`,
        enabled: () => { for (let i = 0; i < SLOTS; i++) if (readSlot(i)?.endingSeen) return true; return false; },
        action: () => { S.outfit = S.outfit === 'night' ? 'classic' : 'night'; app.applySettings(); },
      },
      { label: () => t('menu.back'), action: () => app.setScene(this.back()) },
    ]);
  }
  update(app: App, dt: number): void { this.tt += dt; if (app.input.menu.back || backTap(app)) { app.setScene(this.back()); return; } this.menu.update(app); }
  draw(_app: App, g: Gfx): void { skyBackdrop(g, this.tt, 2); title(g, t('settings.title'), 10, 12); this.menu.draw(g, VW / 2, 42, 24, 520, 8); }
}

export class KeysScene implements Scene {
  noFsKey = true;
  menu!: Menu; waiting = -1; tt = 0;
  constructor(public player: 0 | 1, public back: () => Scene) {}
  enter(app: App): void {
    const keys = app.settings.keys[this.player];
    const items = ACTIONS.map((a: Action, i) => ({ label: () => `${t('act.' + a)}   [ ${this.waiting === i ? t('settings.remap') : keyName(keys[a])} ]`, action: () => { this.waiting = i; app.input.lastKeyCode = null; } }));
    items.push({ label: () => t('settings.reset'), action: () => { app.settings.keys[this.player] = { ...DEFAULT_KEYS[this.player] }; app.applySettings(); this.enter(app); } });
    items.push({ label: () => t('menu.back'), action: () => app.setScene(new SettingsScene(this.back)) });
    this.menu = new Menu(items);
  }
  update(app: App, dt: number): void {
    this.tt += dt;
    if (this.waiting >= 0) {
      const code = app.input.lastKeyCode;
      if (code && app.input.keys.has(code)) {
        if (code !== 'Escape') { app.settings.keys[this.player][ACTIONS[this.waiting]] = code; app.applySettings(); }
        this.waiting = -1; app.input.lastKeyCode = null; app.audio.sfx('select');
      }
      return;
    }
    if (app.input.menu.back) { app.setScene(new SettingsScene(this.back)); return; }
    this.menu.update(app);
  }
  draw(_app: App, g: Gfx): void { skyBackdrop(g, this.tt, 2); title(g, t('settings.keys', { n: this.player + 1 }), 8, 11); this.menu.draw(g, VW / 2, 36, 26, 420, 8); }
}

// ---------------------------------------------------------------- dziennik
export class JournalScene implements Scene {
  tt = 0;
  constructor(public back: () => Scene) {}
  update(app: App, dt: number): void { this.tt += dt; const m = app.input.menu; if (m.back || m.ok || m.pause || m.tap) app.setScene(this.back()); }
  draw(app: App, g: Gfx): void {
    const s = app.session!; const d = s.data;
    skyBackdrop(g, this.tt, 6); title(g, t('journal.title'), 8, 12);
    panel(g, 24, 34, VW - 48, 150);
    const rows: [string, string][] = [
      [t('journal.completion'), `${completion(d)}%`],
      [t('journal.residents'), `${s.freed.size}/96`], [t('journal.shards'), `${s.shards.size}/8`], [t('journal.notes'), `${s.notes.size}/8`],
      [t('journal.packages'), String(d.packageCount)], [t('journal.deposit'), `${(d.depositGrosze / 100).toFixed(2)} ${t('hud.zl')}`],
      [t('journal.secrets'), String(s.secrets.size)], [t('hud.score'), String(d.score)],
    ];
    rows.forEach(([a, b], i) => { const col = i % 2, row = Math.floor(i / 2); const x = 40 + col * 290; g.text(a, x, 46 + row * 32, { size: 7, color: '#c8c8d8' }); g.text(b, x, 60 + row * 32, { size: 9, color: '#ffd23f' }); });
    // planety
    for (let w = 1; w <= 8; w++) {
      const done = [1, 2, 3, 4].filter((st) => d.levels[`W${w}-L${st}`]?.done).length; const x = 40 + (w - 1) * 72;
      g.ctx.fillStyle = w <= d.unlockedWorld ? WORLDS[w].dominant : '#3a3a4a'; g.ctx.beginPath(); g.ctx.arc(x + 14, 218, 13, 0, Math.PI * 2); g.ctx.fill();
      g.text(`${done}/4`, x + 14, 236, { size: 7, align: 'center' });
    }
    // bestiariusz
    panel(g, 24, 256, VW - 48, 90);
    g.text(t('journal.bestiary'), 36, 262, { size: 7, color: '#ffd23f' });
    const en = (bestiary as unknown as { enemies: { name: string; planets: number[] }[] }).enemies;
    en.forEach((e, i) => { const seen = e.planets.some((p) => p <= d.unlockedWorld); const col = i % 3, row = Math.floor(i / 3); g.text(seen ? e.name : t('journal.unknown'), 36 + col * 190, 278 + row * 11, { size: 6, color: seen ? '#e8e8f0' : '#6a6a7a', shadow: null }); });
    void VH;
  }
}
