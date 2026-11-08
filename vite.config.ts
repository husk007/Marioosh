import { defineConfig } from 'vite';
import { rmSync } from 'node:fs';

// base './' => działa z GitHub Pages (podkatalog), z file:// w Electronie i w Capacitorze.
/** źródłowa biblioteka grafik (public/art/gen, ~25 MB) nie jest potrzebna w grze — używamy spakowanych kopii z public/art/game */
const dropArtSources = { name: 'drop-art-sources', apply: 'build' as const, closeBundle() { rmSync('dist/art/gen', { recursive: true, force: true }); } };

export default defineConfig({
  plugins: [dropArtSources],
  base: './',
  build: { target: 'es2022', outDir: 'dist', sourcemap: false, chunkSizeWarningLimit: 900 },
  test: { include: ['tests/**/*.test.ts'], environment: 'node' },
} as any);
