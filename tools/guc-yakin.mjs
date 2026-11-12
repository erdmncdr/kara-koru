// Yerdeki bir gücü (ya da lahmacunu) oyunda yakından çeker: oyuncunun önüne dizilen örnekler, dönüşün dört anı.
// node tools/guc-yakin.mjs <url> <çıkış.png> [tür=heal]   (CHROME: Chrome yolu; test derlemesi VITE_KOPRU=1)
import { chromium } from 'playwright';
const [url, out, tur = 'heal'] = process.argv.slice(2);
const br = await chromium.launch({ executablePath: process.env.CHROME, headless: true, args: ['--use-angle=metal', '--ignore-gpu-blocklist'] });
const pg = await br.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 });
const errs = []; pg.on('pageerror', e => errs.push(e.message));
await pg.addInitScript(() => { Element.prototype.requestPointerLock = function () {}; localStorage.setItem('kk_tut', '1'); localStorage.setItem('kk_set', JSON.stringify({ q: 2, bl: 1 })); });
await pg.goto(url, { waitUntil: 'domcontentloaded' });
await pg.waitForFunction(() => typeof S !== 'undefined' && S === 'menu' && !!window.MSEL, null, { timeout: 90000 });
await pg.evaluate(() => { start(); P.inv = 1e9; });
await new Promise(r => setTimeout(r, 2500));
await pg.addStyleTag({ content: '#hud,#tip,#tt,.wl{display:none!important}' });
// kameranın baktığı yöne, oyuncunun 4-9 birim önüne beş örnek; bir kalp de karşılaştırma için
await pg.evaluate(t => { const fx = -Math.sin(yaw), fz = -Math.cos(yaw), sx = Math.cos(yaw), sz = -Math.sin(yaw); for (let i = 0; i < 5; i++) { const d = 4 + i * 1.3, k = (i - 2) * 1.6; const x = P.x + fx * d + sx * k, z = P.z + fz * d + sz * k; mkPU(x, z, t, groundAt(x, z, P.y + 3)); } drop(P.x + fx * 5 + sx * 4.5, P.z + fz * 5 + sz * 4.5, 'hl', 0, P.y); for (const e of E) e.hp = 0; }, tur);
await new Promise(r => setTimeout(r, 1200));
await pg.screenshot({ path: out, clip: { x: 240, y: 150, width: 800, height: 450 } });
console.log('hata:', errs.length ? [...new Set(errs)].join(' ; ') : 'yok');
await br.close();
