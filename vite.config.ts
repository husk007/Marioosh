import { defineConfig } from 'vite';

// base './' => działa z GitHub Pages (podkatalog), z file:// w Electronie i w Capacitorze.
export default defineConfig({
  base: './',
  build: { target: 'es2022', outDir: 'dist', sourcemap: false, chunkSizeWarningLimit: 900 },
  test: { include: ['tests/**/*.test.ts'], environment: 'node' },
} as any);
