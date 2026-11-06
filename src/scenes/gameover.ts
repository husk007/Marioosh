import type { App, Scene } from '../app';
import type { Gfx } from '../engine/gfx';
import { t } from '../engine/i18n';
import { VW } from '../game/constants';
import { levelId, parseId } from '../game/levels';
import { MapScene } from './map';
import { TitleScene } from './title';
import { Menu, skyBackdrop, title } from './ui';

export class GameOverScene implements Scene {
  menu!: Menu; tt = 0;
  constructor(public levelIdStr: string) {}
  enter(app: App): void {
    const s = app.session!; app.audio.music(null); app.audio.sfx('gameover');
    this.menu = new Menu([
      { label: () => t('gameover.continue'), action: () => { s.data.lives = [3, 3]; const w = Math.max(1, parseId(this.levelIdStr).world); s.persist(); app.setScene(new MapScene(levelId(w, 1))); } },
      { label: () => t('gameover.menu'), action: () => { s.data.lives = [3, 3]; s.persist(); app.setScene(new TitleScene()); } },
    ]);
  }
  update(app: App, dt: number): void { this.tt += dt; if (this.tt > 1) this.menu.update(app); }
  draw(_app: App, g: Gfx): void {
    skyBackdrop(g, this.tt, 8);
    title(g, t('gameover.title'), 80, 16, '#ff6a5a');
    g.text(t('gameover.sub'), VW / 2, 120, { size: 10, align: 'center', color: '#fff3a0' });
    if (this.tt > 1) this.menu.draw(g, VW / 2, 190, 32, 420, 9);
  }
}
