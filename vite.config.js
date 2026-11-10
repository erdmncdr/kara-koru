import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { readFileSync } from 'node:fs';

const SURUM = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')).version;

// npm run build        -> dist/ (normal web sitesi)
// npm run build:single -> dist-single/index.html (paylaşmak için tek HTML dosyası)
// __KOPRU__: geliştirme sunucusunda ve test derlemesinde (VITE_KOPRU=1, npm run build:test) true. Yayın derlemesinde false:
// test köprüsü (main.js) ve komut konsolu (ui/console.js) pakete hiç girmez.
export default defineConfig(({ mode, command }) => ({
  base: './',
  // __SURUM__: package.json sürümü (koşu özetinde sunucuya bildirilir)
  define: { __KOPRU__: JSON.stringify(command === 'serve' || !!process.env.VITE_KOPRU), __SURUM__: JSON.stringify(SURUM) },
  build: {
    target: 'es2022',
    outDir: mode === 'single' ? 'dist-single' : 'dist',
    chunkSizeWarningLimit: 2000,
    // yönetim paneli ayrı sayfa ve ayrı paket (yonetim.html): oyunun paketine girmez. Tek dosya derlemesinde yok.
    rollupOptions: mode === 'single' ? {} : { input: { index: 'index.html', yonetim: 'yonetim.html' } },
  },
  plugins: mode === 'single' ? [viteSingleFile()] : [],
}));
