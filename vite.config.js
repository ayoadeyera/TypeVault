import { defineConfig } from 'vite';

export default defineConfig({
  // index.html is at the project root, which is Vite's default
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      input: 'index.html'
    }
  },
  server: {
    port: 5173,
    open: true
  },
  preview: {
    port: 4173
  }
});
