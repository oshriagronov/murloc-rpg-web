import { defineConfig } from 'vite';

// A relative base lets the built game be served from any folder.
export default defineConfig({
  base: './',
  server: { port: 5173, strictPort: true },
  build: { target: 'es2022', chunkSizeWarningLimit: 1500 },
});
