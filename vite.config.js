import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        lusion: resolve(import.meta.dirname, 'lusion.html'),
      },
      output: {
        manualChunks(id) {
          if (id.includes('three')) {
            return 'three';
          }
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
