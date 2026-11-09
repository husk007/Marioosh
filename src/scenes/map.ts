import type { App, Scene } from '../app';
import type { Gfx } from '../engine/gfx';
import { t } from '../engine/i18n';
import { WORLDS } from '../data/worlds';
import { VH, VW } from '../game/constants';
import { LEVEL_JSON, isPorted, levelId, parseId } from '../game/levels';
import { PlayScene } from './play';
import { JournalScene } from './menus';
import { TitleScene } from './title';
import { panel, skyBackdrop, title } from './ui';
import { completion } from '../game/save';
import { heroSprite } from '../sprites/art';

export class MapScene implements Scene {
  world = 1; stage = 1; tt = 0; msg = 0;
  constructor(id?: string) { if (id) { const p = parseId(id); this.world = p.world; this.stage = Math.max(1, p.stage); } }
  enter(app: App): void {
    app.audio.music('map'); const s = app.session!;
    if (this.world > s.data.unlockedWorld && this.world !== 0) this.world = s.data.unlockedWorld;
    s.data.currentLevel = levelId(this.world, this.stage);
  }
  private worlds(app: App): number[] { const s = app.session!; const a = s.data.pradowoUnlocked ? [0] : []; for (let w = 1; w <= 8; w++) a.push(w); return a; }
  update(app: App, dt: number): void {
    this.tt += dt; const m = app.input.menu; const s = app.session!;
    const ws = this.worlds(app);
    if (m.back) { s.persist(); app.setScene(new TitleScene()); return; }
    if (m.pause) { app.setScene(new JournalScene(() => new MapScene(levelId(this.world, this.stage)))); return; }
    const wi = ws.indexOf(this.world);
    if (m.up && wi > 0) { this.world = ws[wi - 1]; this.stage = 1; app.audio.sfx('menu'); }
    if (m.down && wi < ws.length - 1) { this.world = ws[wi + 1]; this.stage = 1; app.audio.sfx('menu'); }
    if (this.world === 0) this.stage = 1;
    else {
      if (m.left && this.stage > 1) { this.stage--; app.audio.sfx('menu'); }
      if (m.right && this.stage < 4) { this.stage++; app.audio.sfx('menu'); }
    }
    if (m.tap) {
      const t0 = m.tap;
      if (t0.x < 70 && t0.y < 40) { s.persist(); app.setScene(new TitleScene()); return; }
      if (t0.x > VW - 90 && t0.y < 40) { app.setScene(new JournalScene(() => new MapScene(levelId(this.world, this.stage)))); return; }
      const px0 = VW / 2 - 150; ws.forEach((w, i) => { const x = 40 + i * (VW - 80) / Math.max(1, ws.length - 1); if (Math.abs(t0.x - x) < 24 && Math.abs(t0.y - 74) < 24) { this.world = w; this.stage = 1; } });
      for (let st = 1; st <= 4; st++) { const x = px0 + (st - 1) * 100 + 20; if (Math.abs(t0.x - x) < 32 && Math.abs(t0.y - 230) < 40) { if (this.stage === st) m.ok = true; this.stage = st; } }
    }
    if (m.ok) this.enterLevel(app);
    s.data.currentLevel = this.world === 0 ? 'W0' : levelId(this.world, this.stage);
  }
  private unlocked(app: App): boolean {
    const s = app.session!;
    if (this.world === 0) return false;       // Prądowo (bonus) wróci razem z mapami W0
    return isPorted(levelId(this.world, this.stage)) && s.isLevelUnlocked(this.world, this.stage);
  }
  private enterLevel(app: App): void {
    if (!this.unlocked(app)) { app.audio.sfx('warn'); return; }
    app.audio.sfx('select'); app.setScene(new PlayScene(this.world === 0 ? 'W0' : levelId(this.world, this.stage)));
  }
  draw(app: App, g: Gfx): void {
    const s = app.session!; const ws = this.worlds(app);
    skyBackdrop(g, this.tt, this.world === 6 ? 6 : this.world === 8 ? 8 : this.world === 2 ? 2 : 1);
    title(g, t('map.title'), 8, 11);
    g.text('◀ ' + t('menu.back'), 10, 10, { size: 7, color: '#c8c8d8' });
    g.text(t('journal.title') + ' ▶', VW - 10, 10, { size: 7, color: '#c8c8d8', align: 'right' });
    // pasek planet
    ws.forEach((w, i) => {
      const x = 40 + i * (VW - 80) / Math.max(1, ws.length - 1); const th = WORLDS[w]; const lock = w !== 0 && w > s.data.unlockedWorld; const sel = w === this.world;
      const r = sel ? 20 : 14;
      g.ctx.globalAlpha = lock ? 0.35 : 1; g.ctx.fillStyle = th.dominant; g.ctx.beginPath(); g.ctx.arc(x, 74, r, 0, Math.PI * 2); g.ctx.fill();
      g.ctx.fillStyle = th.accent; g.ctx.beginPath(); g.ctx.arc(x - r * 0.3, 74 - r * 0.3, r * 0.3, 0, Math.PI * 2); g.ctx.fill(); g.ctx.globalAlpha = 1;
      if (sel) { g.ctx.strokeStyle = '#ffd23f'; g.ctx.lineWidth = 2; g.ctx.beginPath(); g.ctx.arc(x, 74, r + 4, 0, Math.PI * 2); g.ctx.stroke(); }
      if (lock) g.text('🔒'.length ? '×' : '', x, 68, { size: 10, align: 'center', color: '#fff' });
    });
    const th = WORLDS[this.world];
    const wl = this.world !== 0 && this.world > s.data.unlockedWorld;
    g.text(t(`world.${this.world}`), VW / 2, 108, { size: 12, align: 'center', color: '#fff3a0' });
    g.text(t(`world.${this.world}s`), VW / 2, 128, { size: 8, align: 'center', color: '#e8e8f0' });
    if (wl) g.text(t('map.locked'), VW / 2, 150, { size: 8, align: 'center', color: '#ff8a7a' });
    if (this.world > 0 && this.world > 1 && this.world <= s.data.unlockedWorld && !s.data.levels[levelId(this.world - 1, 4)]?.done) g.text(t('map.warp'), VW / 2, 150, { size: 7, align: 'center', color: '#8aff9a' });
    // ścieżka poziomów
    const px0 = VW / 2 - 150; const nodes = this.world === 0 ? 1 : 4;
    g.srect(px0 + 20, 230 - 1, (nodes - 1) * 100, 3, th.accent, 0.8);
    for (let st = 1; st <= nodes; st++) {
      const x = px0 + (st - 1) * 100 + 20; const id = this.world === 0 ? 'W0' : levelId(this.world, st);
      const open = this.world === 0 ? s.data.pradowoUnlocked : s.isLevelUnlocked(this.world, st); const rec = s.data.levels[id]; const sel = st === this.stage;
      g.ctx.fillStyle = !open ? '#3a3a4a' : rec?.done ? '#3fbf5a' : th.accent; g.ctx.beginPath(); g.ctx.arc(x, 230, sel ? 17 : 12, 0, Math.PI * 2); g.ctx.fill();
      g.ctx.strokeStyle = sel ? '#fff' : '#0c0a18'; g.ctx.lineWidth = 2; g.ctx.stroke();
      g.text(this.world === 0 ? '0' : st === 4 ? '★' : String(st), x, 223, { size: 9, align: 'center', color: open ? '#0c0a18' : '#8a8a9a', shadow: null });
      if (sel && open) g.spr(heroSprite(s.data.brother, 'idle', false), x - 20, 230 - 48 - 14 + Math.sin(this.tt * 4) * 2, { screen: true });
    }
    // opis wybranego poziomu
    const id = this.world === 0 ? 'W0' : levelId(this.world, this.stage); const rec = s.data.levels[id];
    panel(g, VW / 2 - 230, 262, 460, 84);
    const open = this.unlocked(app);
    const wip = !isPorted(id);
    g.text(open ? t('lvl.' + id) : wip ? t('lvl.' + id) : t('map.locked'), VW / 2, 270, { size: 10, align: 'center', color: open ? '#ffd23f' : '#8a8a9a' });
    const j = LEVEL_JSON.find((l) => l.level_id === id);
    if (wip) g.text(t('map.wip'), VW / 2, 290, { size: 8, align: 'center', color: '#ffb36a' });
    else if (j && open) g.text(`PET ${j.collectibles.pet} · ${t('item.can')} ${j.collectibles.cans}`, VW / 2, 290, { size: 7, align: 'center', color: '#c8c8d8' });
    if (rec?.done) g.text(`${t('map.best')}: ${rec.bestScore} · ${rec.freed}/3`, VW / 2, 306, { size: 7, align: 'center', color: '#8aff9a' });
    g.text(t('map.hint'), VW / 2, 326, { size: 6, align: 'center', color: '#c8c8d8', shadow: null });
    g.text(`${completion(s.data)}%`, VW - 10, VH - 14, { size: 7, align: 'right', color: '#c8c8d8' });
  }
}
