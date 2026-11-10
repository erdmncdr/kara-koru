import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// npm run build        -> dist/ (normal web sitesi)
// npm run build:single -> dist-single/index.html (paylaşmak için tek HTML dosyası)
// __KOPRU__: geliştirme sunucusunda ve test derlemesinde (VITE_KOPRU=1, npm run build:test) true. Yayın derlemesinde false:
// test köprüsü (main.js) ve komut konsolu (ui/console.js) pakete hiç girmez.
export default defineConfig(({ mode, command }) => ({
  base: './',
  define: { __KOPRU__: JSON.stringify(command === 'serve' || !!process.env.VITE_KOPRU) },
  build: {
    target: 'es2022',
    outDir: mode === 'single' ? 'dist-single' : 'dist',
    chunkSizeWarningLimit: 2000,
  },
  plugins: mode === 'single' ? [viteSingleFile()] : [],
}));
