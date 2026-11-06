/** Scena rozgrywki: świat + HUD + pauza + wyniki. */
import type { App, Scene } from '../app';
import type { Gfx } from '../engine/gfx';
import { t } from '../engine/i18n';
import { VH, VW } from '../game/constants';
import { getLevel, nextLevelId, parseId } from '../game/levels';
import { World } from '../game/world';
import { drawWorld } from '../game/worldDraw';
import { heartIcon, itemSprite } from '../sprites/art';
import { Menu, panel, title } from './ui';
import { MapScene } from './map';
import { GameOverScene } from './gameover';
import { EndingScene } from './story';
import { TitleScene } from './title';
import { ACTIONS } from '../engine/settings';

interface Toast { text: string; t: number; max: number }

export class PlayScene implements Scene {
  touchUI = true;
  world!: World; toasts: Toast[] = []; caption: Toast | null = null;
  paused = false; pauseMenu!: Menu; helpOpen = false;
  result: { lines: [string, string][]; t: number; scarlet?: string; next: () => void } | null = null;
  banner = 3; lastMusic = ''; lastBossFails = 0; ended = false;

  constructor(public levelId: string) {}

  enter(app: App): void {
    const s = app.session!;
    if (s.data.lives[0] <= 0) s.data.lives[0] = 3;
    if (s.coop && s.data.lives[1] <= 0) s.data.lives[1] = 3;
    const night = s.data.night;
    this.world = new World(getLevel(this.levelId, night), s, { audio: app.audio, settings: app.settings, night });
    app.input.coop = s.coop;
    this.pauseMenu = new Menu([
      { label: () => t('pause.resume'), action: () => { this.paused = false; } },
      { label: () => t('pause.checkpoint'), action: () => { this.paused = false; this.world.retryFromCheckpoint(); } },
      { label: () => t('pause.help'), action: () => { this.helpOpen = true; } },
      { label: () => t('pause.map'), action: () => { s.persist(s.run.time); app.setScene(new MapScene(this.levelId)); } },
      { label: () => t('pause.menu'), action: () => { s.persist(s.run.time); app.setScene(new TitleScene()); } },
    ]);
    this.setMusic(app);
  }
  leave(app: App): void { app.input.coop = false; }

  private setMusic(app: App): void {
    const w = this.world; let m = 'w' + w.level.world;
    if (w.rt.boss?.started && !w.rt.boss.dead) m = 'boss';
    if (w.players.some((p) => p.upg[p.brother].star > 0)) m = 'star';
    if (w.rt.boss?.dead) m = '';
    if (m !== this.lastMusic) { this.lastMusic = m; app.audio.music(m || null); }
  }

  update(app: App, dt: number): void {
    const inp = app.input; const w = this.world;
    if (this.result) { this.result.t += dt; if (this.result.t > 0.6 && (inp.menu.ok || inp.menu.tap)) { app.audio.sfx('select'); this.result.next(); } return; }
    if (this.paused) {
      if (this.helpOpen) { if (inp.menu.back || inp.menu.ok || inp.menu.tap || inp.menu.pause) this.helpOpen = false; return; }
      if (inp.menu.pause || inp.menu.back) { this.paused = false; return; }
      this.pauseMenu.update(app); return;
    }
    if (inp.menu.pause) { this.paused = true; this.pauseMenu.sel = 0; app.audio.sfx('menu'); return; }
    if (document.hidden) { this.paused = true; return; }
    w.update(dt, [inp.players[0], inp.players[1]]);
    this.setMusic(app);
    this.banner -= dt;
    for (const e of w.events.splice(0)) this.onEvent(app, e);
    if (w.bossFails === 3 && this.lastBossFails < 3 && w.rt.boss) { this.lastBossFails = 3; this.pushToast('bosshint.' + w.rt.boss.id, undefined, 7); }
    if (w.bossFails > 3) this.lastBossFails = w.bossFails;
    for (const x of this.toasts) x.t -= dt; this.toasts = this.toasts.filter((x) => x.t > 0);
    if (this.caption) { this.caption.t -= dt; if (this.caption.t <= 0) this.caption = null; }
  }

  private pushToast(key: string, params?: Record<string, string | number>, secs = 2.6): void {
    const text = t(key, params); if (this.toasts.some((x) => x.text === text)) return;
    this.toasts.push({ text, t: secs, max: secs }); if (this.toasts.length > 3) this.toasts.shift();
  }

  private onEvent(app: App, e: ReturnType<World['events']['splice']>[number]): void {
    const s = app.session!;
    switch (e.t) {
      case 'toast': this.pushToast(e.key, e.params, e.key.startsWith('bosshint') ? 7 : 2.6); break;
      case 'caption': if (app.settings.captions) this.caption = { text: t(e.key), t: 1.4, max: 1.4 }; break;
      case 'warp': {
        const { world } = parseId(e.level); if (world > 0) s.unlockWorld(world); if (e.level === 'W0') s.data.pradowoUnlocked = true;
        s.persist(s.run.time); app.setScene(new PlayScene(e.level)); break;
      }
      case 'gameover': s.persist(s.run.time); app.setScene(new GameOverScene(this.levelId)); break;
      case 'clear': this.onClear(app, e.timeLeft); break;
      case 'bossDown': break;
      case 'save': s.persist(s.run.time); break;
    }
  }

  private onClear(app: App, _timeLeft: number): void {
    if (this.ended) return; this.ended = true;
    const s = app.session!; const w = this.world; const r = w.result();
    const rec = s.completeLevel(this.levelId, Math.round(r.time), r.bonus);
    void rec;
    const { world, stage } = parseId(this.levelId);
    let scarlet: string | undefined;
    if (stage === 4 && world < 8) { s.unlockWorld(world + 1); scarlet = t('scarlet.' + world); }
    if (this.levelId === 'W0') s.data.pradowoUnlocked = true;
    s.persist(r.time);
    const zl = (s.data.depositGrosze / 100).toFixed(2);
    const lines: [string, string][] = [
      [t('result.time'), '+' + r.bonus],
      [t('result.packages'), `PET ${r.pets} · ${t('item.can')} ${r.cans}${r.golden ? ' · ★' + r.golden : ''}`],
      [t('result.deposit'), `${zl} ${t('hud.zl')}`],
      [t('result.residents'), `${r.freed}/3`],
    ];
    if (r.noDeath) lines.push([t('result.noDeath'), '✓']);
    if (r.allResidents) lines.push([t('result.allResidents'), '✓']);
    lines.push([t('result.score'), String(s.score)]);
    const next = () => {
      if (this.levelId === 'W8-L4') { app.setScene(new EndingScene()); return; }
      const nid = this.levelId === 'W0' ? 'W1-L1' : nextLevelId(this.levelId);
      s.data.currentLevel = nid ?? this.levelId; s.persist();
      app.setScene(new MapScene(nid ?? this.levelId));
    };
    this.result = { lines, t: 0, scarlet, next };
    app.audio.music(null);
  }

  draw(app: App, g: Gfx): void {
    drawWorld(this.world, g);
    this.drawHud(app, g);
    if (this.paused) this.drawPause(app, g);
    if (this.result) this.drawResult(app, g);
  }

  // ------------------------------------------------------------------ HUD
  private drawHud(app: App, g: Gfx): void {
    const w = this.world; const s = app.session!; const ctx = g.ctx;
    g.srect(0, 0, VW, 30, '#000', 0.35);
    // życia
    w.players.forEach((p, i) => {
      const li = s.coop ? i : 0; const x = i === 0 ? 8 : 8 + 120;
      ctx.drawImage(heartIcon('life', p.brother), x, 4);
      g.text('×' + s.data.lives[li], x + 20, 7, { size: 8, color: p.dead ? '#ff6a5a' : '#fff' });
      const U = p.upg[p.brother]; let ix = x + 58;
      if (U.shield) { ctx.drawImage(heartIcon('shield'), ix, 4); ix += 17; }
      if (U.coil) { ctx.drawImage(heartIcon('coil'), ix, 4); ix += 17; }
      for (const [k, v, max] of [['magnet', U.magnet, 20], ['extender', U.extender, 15], ['gloves', U.gloves, 12], ['star', U.star, 12]] as const) {
        if (v > 0) { ctx.drawImage(itemSprite(k), ix, 4, 14, 14); g.srect(ix, 20, 14 * (v / max), 2, '#ffd23f'); ix += 17; }
      }
      if (p.petrify > 0) { g.text(t('hud.petrify'), x, 20, { size: 6, color: '#c8c8d8', shadow: null }); g.srect(x + 40, 21, 60, 5, '#2a2c3a'); g.srect(x + 40, 21, 60 * (p.petrify / 100), 5, p.petrify >= 65 ? '#e0443a' : '#c8c8d8'); }
    });
    // czas
    const tl = Math.max(0, Math.ceil(w.timeLeft));
    g.text(t('hud.time'), VW / 2, 3, { size: 6, align: 'center', color: '#c8c8d8', shadow: null });
    g.text(String(tl), VW / 2, 12, { size: 10, align: 'center', color: tl < 30 && Math.floor(w.time * 4) % 2 === 0 ? '#ff6a5a' : '#fff' });
    // opakowania, kaucja, punkty
    const rx = VW - 8;
    ctx.drawImage(heartIcon('pet'), rx - 236, 3); g.text(String(s.run.pets), rx - 218, 7, { size: 8 });
    ctx.drawImage(heartIcon('can'), rx - 186, 3); g.text(String(s.run.cans), rx - 168, 7, { size: 8 });
    g.text(`${(s.data.depositGrosze / 100).toFixed(2)} ${t('hud.zl')}`, rx - 142, 4, { size: 7, color: '#8aff9a' });
    g.text(String(s.score).padStart(7, '0'), rx, 4, { size: 7, align: 'right' });
    g.text(`${s.packages % 100}/100`, rx, 16, { size: 6, align: 'right', color: '#c8c8d8', shadow: null });
    // boss
    const bh = w.bossHp();
    if (bh) {
      const bw = 220; const x = VW / 2 - bw / 2;
      g.text(t('boss.' + bh.name), VW / 2, 36, { size: 7, align: 'center', color: '#ffd23f' });
      g.srect(x, 48, bw, 8, '#2a0a14'); g.srect(x, 48, bw * (bh.hp / bh.max), 8, '#e0443a'); g.srect(x, 48, bw, 1, '#fff', 0.5);
    }
    // toasty
    let y = bh ? 62 : 40;
    for (const x of this.toasts) {
      const a = Math.min(1, x.t / 0.4); const lines = g.wrap(x.text, 420, 8);
      lines.forEach((ln, i) => g.text(ln, VW / 2, y + i * g.lineH(8), { size: 8, align: 'center', alpha: a, color: '#fff7c0' }));
      y += lines.length * g.lineH(8) + 2;
    }
    if (this.caption) g.text(this.caption.text, VW / 2, VH - 24, { size: 7, align: 'center', color: '#fff', alpha: 0.9 });
    // GOTOWE / baner
    if (w.readyT > 0) { g.text(t('hud.ready'), VW / 2, VH / 2 - 20, { size: 18, align: 'center', color: '#ffd23f' }); }
    else if (this.banner > 0 && this.banner < 2.6) {
      const a = Math.min(1, this.banner);
      panel(g, VW / 2 - 190, VH / 2 - 70, 380, 44, 0.6 * a);
      g.text(`${w.level.id}`, VW / 2, VH / 2 - 64, { size: 7, align: 'center', color: '#ffd23f', alpha: a });
      g.text(t(w.level.titleKey), VW / 2, VH / 2 - 50, { size: 10, align: 'center', alpha: a });
    }
  }

  private drawPause(app: App, g: Gfx): void {
    g.srect(0, 0, VW, VH, '#000', 0.6);
    if (this.helpOpen) {
      panel(g, 40, 30, VW - 80, VH - 60); title(g, t('pause.help'), 40, 12);
      const k = app.settings.keys;
      const rows = ACTIONS.length; const cols = app.session!.coop ? 2 : 1;
      for (let c = 0; c < cols; c++) {
        const x0 = cols === 1 ? VW / 2 - 130 : 70 + c * 270;
        g.text(c === 0 ? t('coop.p1') : t('coop.p2'), x0, 66, { size: 8, color: '#ffd23f' });
        ACTIONS.forEach((a, i) => { g.text(t('act.' + a), x0, 86 + i * 20, { size: 8, color: '#c8c8d8' }); g.text(keyName(k[cols === 1 ? 0 : c][a]), x0 + 180, 86 + i * 20, { size: 8, align: 'right' }); });
      }
      void rows; return;
    }
    panel(g, VW / 2 - 190, 70, 380, 220); title(g, t('pause.title'), 82, 14);
    this.pauseMenu.draw(g, VW / 2, 124, 30, 340, 9);
  }

  private drawResult(app: App, g: Gfx): void {
    const r = this.result!; g.srect(0, 0, VW, VH, '#000', 0.55);
    const h = 70 + r.lines.length * 22 + (r.scarlet ? 60 : 0);
    panel(g, VW / 2 - 210, 40, 420, Math.min(VH - 60, h + 40)); title(g, t('result.title'), 52, 12);
    r.lines.forEach(([a, b], i) => {
      if (r.t < 0.25 * (i + 1)) return;
      g.text(a, VW / 2 - 190, 92 + i * 22, { size: 8, color: '#c8c8d8', align: g.font.rtl ? 'right' : 'left' });
      g.text(b, VW / 2 + 190, 92 + i * 22, { size: 8, align: 'right' });
    });
    if (r.scarlet) { const y = 96 + r.lines.length * 22; g.wrap(r.scarlet, 380, 7).forEach((ln, i) => g.text(ln, VW / 2, y + i * g.lineH(7), { size: 7, align: 'center', color: '#ffb0c0' })); }
    if (r.t > 0.8) g.text(t('result.next'), VW / 2, VH - 36, { size: 8, align: 'center', color: '#ffd23f', alpha: 0.6 + 0.4 * Math.sin(app.time * 6) });
  }
}

export function keyName(code: string): string {
  return code.replace(/^Key/, '').replace(/^Digit/, '').replace('Arrow', '').replace('ShiftLeft', 'Shift').replace('ShiftRight', 'R-Shift').replace('Period', '.').replace('Comma', ',').replace('Slash', '/').replace('Semicolon', ';').replace('Quote', "'");
}
