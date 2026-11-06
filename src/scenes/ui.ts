/** Wspólne elementy interfejsu: panele, menu z obsługą klawiatury/pada/dotyku, tytuły. */
import type { App } from '../app';
import type { Gfx } from '../engine/gfx';
import { VH, VW } from '../game/constants';

export function panel(g: Gfx, x: number, y: number, w: number, h: number, alpha = 0.78): void {
  g.srect(x, y, w, h, '#0c0a18', alpha); g.srect(x, y, w, 2, '#ffd23f', 0.9); g.srect(x, y + h - 2, w, 2, '#ffd23f', 0.5);
  g.srect(x, y, 2, h, '#ffd23f', 0.5); g.srect(x + w - 2, y, 2, h, '#ffd23f', 0.5);
}
export function title(g: Gfx, str: string, y: number, size = 16, color = '#ffd23f'): void {
  g.text(str, VW / 2 + 2, y + 2, { size, align: 'center', color: '#b8281a', shadow: null });
  g.text(str, VW / 2, y, { size, align: 'center', color, shadow: '#1b1424' });
}

export interface MenuItem { label: () => string; action: (dir?: number) => void; enabled?: () => boolean; hint?: () => string; slider?: () => number; fontLang?: () => string; }

export class Menu {
  sel = 0; rects: { x: number; y: number; w: number; h: number }[] = [];
  constructor(public items: MenuItem[]) {}
  private enabled(i: number): boolean { return this.items[i].enabled ? this.items[i].enabled!() : true; }
  move(d: number): void { for (let k = 0; k < this.items.length; k++) { this.sel = (this.sel + d + this.items.length) % this.items.length; if (this.enabled(this.sel)) break; } }
  update(app: App): boolean {
    const m = app.input.menu; let acted = false;
    if (m.up) { this.move(-1); app.audio.sfx('menu'); }
    if (m.down) { this.move(1); app.audio.sfx('menu'); }
    if (m.left && this.items[this.sel]) { this.items[this.sel].action(-1); acted = true; }
    if (m.right && this.items[this.sel]) { this.items[this.sel].action(1); acted = true; }
    if (m.ok && this.enabled(this.sel)) { app.audio.sfx('select'); this.items[this.sel].action(0); acted = true; }
    if (m.tap) {
      const t = m.tap;
      for (let i = 0; i < this.rects.length; i++) {
        const r = this.rects[i];
        if (t.x >= r.x && t.x <= r.x + r.w && t.y >= r.y && t.y <= r.y + r.h && this.enabled(i)) {
          this.sel = i; app.audio.sfx('select');
          const it = this.items[i];
          if (it.slider) { const rel = (t.x - (r.x + r.w * 0.55)) / (r.w * 0.4); if (rel < 0) it.action(-1); else if (rel > 0.5 || rel > 0) it.action(1); } else it.action(0);
          acted = true; break;
        }
      }
    }
    return acted;
  }
  draw(g: Gfx, cx: number, y0: number, lineH = 26, width = 340, size = 10): void {
    this.rects = [];
    this.items.forEach((it, i) => {
      const y = y0 + i * lineH; const en = this.enabled(i); const sel = i === this.sel;
      this.rects.push({ x: cx - width / 2, y: y - 4, w: width, h: lineH - 2 });
      if (sel) { g.srect(cx - width / 2, y - 4, width, lineH - 3, '#ffd23f', 0.18); g.srect(cx - width / 2, y - 4, 3, lineH - 3, '#ffd23f', 1); g.srect(cx + width / 2 - 3, y - 4, 3, lineH - 3, '#ffd23f', 1); }
      const col = !en ? '#6a6a7a' : sel ? '#fff27a' : '#e8e8f0';
      if (it.slider) {
        g.text(it.label(), cx - width / 2 + 10, y, { size, color: col, align: g.font.rtl ? 'right' : 'left' });
        const bw = width * 0.34, bx = cx + width / 2 - bw - 14; const v = it.slider();
        g.srect(bx, y + 3, bw, 6, '#2a2c3a'); g.srect(bx, y + 3, bw * v, 6, sel ? '#ffd23f' : '#8aff9a'); g.srect(bx + bw * v - 2, y, 4, 12, '#fff');
      } else if (it.fontLang) { const old = g.lang; g.lang = it.fontLang(); g.text(it.label(), cx, y, { size, color: col, align: 'center' }); g.lang = old; }
      else g.text(it.label(), cx, y, { size, color: col, align: 'center' });
    });
  }
}

export function backTap(app: App): boolean {
  // lewy górny róg = „wstecz” dla dotyku
  const t = app.input.menu.tap; return !!t && t.x < 70 && t.y < 40;
}
export function drawBack(g: Gfx, label: string): void {
  g.text('◀ ' + label, 10, 10, { size: 8, color: '#c8c8d8' });
}

export function skyBackdrop(g: Gfx, t: number, world = 1): void {
  const c = g.ctx; const grad = c.createLinearGradient(0, 0, 0, VH);
  const pal: Record<number, [string, string]> = { 1: ['#1c2a5a', '#71c878'], 2: ['#2a2c3a', '#9ea7b2'], 6: ['#0a0e2a', '#29345e'], 8: ['#2a0a14', '#db4269'] };
  const [a, b] = pal[world] ?? pal[1]; grad.addColorStop(0, a); grad.addColorStop(1, b); c.fillStyle = grad; c.fillRect(0, 0, VW, VH);
  c.fillStyle = '#fff'; for (let i = 0; i < 50; i++) { const x = (i * 83 + t * (4 + (i % 5))) % VW, y = (i * 47) % (VH * 0.7); c.globalAlpha = 0.3 + 0.4 * ((Math.sin(t * 2 + i) + 1) / 2); c.fillRect(Math.round(x), Math.round(y), 1 + (i % 3 === 0 ? 1 : 0), 1); }
  c.globalAlpha = 1;
}
