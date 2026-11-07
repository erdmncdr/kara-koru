import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// npm run build        -> dist/ (normal web sitesi)
// npm run build:single -> dist-single/index.html (paylaşmak için tek HTML dosyası)
export default defineConfig(({ mode }) => ({
  base: './',
  build: {
    target: 'es2022',
    outDir: mode === 'single' ? 'dist-single' : 'dist',
    chunkSizeWarningLimit: 2000,
  },
  plugins: mode === 'single' ? [viteSingleFile()] : [],
}));
