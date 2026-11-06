import { App } from './app';
import { loadFonts } from './engine/gfx';
import { TitleScene } from './scenes/title';

async function boot(): Promise<void> {
  const canvas = document.getElementById('game') as HTMLCanvasElement;
  try { await loadFonts(); } catch { /* użyj czcionki zapasowej */ }
  const app = new App(canvas);
  (window as unknown as { __app: App }).__app = app;      // hak dla testów e2e
  app.setScene(new TitleScene());
  document.getElementById('boot')?.remove();
  canvas.focus();
  app.start();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http') && !location.hostname.match(/^(localhost|127\.)/)) {
    navigator.serviceWorker.register('./sw.js').catch(() => { /* PWA opcjonalne */ });
  }
}
boot();
