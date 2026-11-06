import { App } from './app';
import { loadFonts } from './engine/gfx';
import { TitleScene } from './scenes/title';
import { PlayScene } from './scenes/play';
import { Session } from './game/session';
import { TESTER_SLOT, testerSave } from './game/save';
import { LEVEL_IDS } from './game/levels';

async function boot(): Promise<void> {
  const canvas = document.getElementById('game') as HTMLCanvasElement;
  try { await loadFonts(); } catch { /* użyj czcionki zapasowej */ }
  const app = new App(canvas);
  (window as unknown as { __app: App }).__app = app;      // hak dla testów e2e
  // hak dla tooli deweloperskich/e2e: od razu uruchamia poziom w trybie testera (tylko przy włączonym debugu)
  if (app.debug.enabled) (window as unknown as { __play: (id: string) => void }).__play = (id) => { app.session = new Session(testerSave(LEVEL_IDS), TESTER_SLOT); app.setScene(new PlayScene(id)); };
  app.setScene(new TitleScene());
  document.getElementById('boot')?.remove();
  canvas.focus();
  app.start();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http') && !location.hostname.match(/^(localhost|127\.)/)) {
    navigator.serviceWorker.register('./sw.js').catch(() => { /* PWA opcjonalne */ });
  }
}
boot();
