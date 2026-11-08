// Arayüz ekran görüntüleri: menü, kahraman, harita, Otağ, ayarlar, oyun içi HUD, seviye kartları, duraklatma, ölüm, telefon.
// node tools/arayuz-goruntu.mjs <url> <klasör>   (CHROME ortam değişkeni Chrome yolunu verir)
import { chromium } from 'playwright';
import fs from 'node:fs';
const [url, out] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const br = await chromium.launch({ executablePath: process.env.CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await br.newPage({ viewport: { width: 1280, height: 720 } });
await pg.addInitScript(() => {
  Element.prototype.requestPointerLock = function () {};
  localStorage.setItem('kk_set', JSON.stringify({ q: 1, bl: 0 })); localStorage.setItem('kk_tut', '1');
  let s = 12345; Math.random = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 };
});
const errs = []; pg.on('pageerror', e => errs.push(e.message));
await pg.goto(url);
await pg.waitForFunction(() => typeof S !== 'undefined' && S === 'menu', null, { timeout: 90000 });
await pg.addStyleTag({ content: '#tip{display:none!important}' });
const shot = async n => { await sleep(700); await pg.screenshot({ path: `${out}/${n}.png` }); };
await sleep(3000); await shot('01_menu');
await pg.evaluate(() => menuPage('kahraman')); await shot('02_kahraman');
await pg.evaluate(() => menuPage('harita')); await shot('03_harita');
await pg.evaluate(() => { menuPage('ana'); otag() }); await shot('04_otag');
await pg.evaluate(() => { otag('koleksiyon') }); await shot('05_koleksiyon');
await pg.evaluate(() => { menu(); settings() }); await shot('06_ayarlar');
await pg.evaluate(() => { closeSet(); start(); P.inv = 1e9 });
await sleep(7000); await pg.evaluate(() => { if (S === 'ready') goReady() });
await sleep(4000);
await pg.evaluate(() => {
  for (let i = 0; i < 5; i++) { choose('level', luOpts()); chPick(i % 3); }
  for (const k of ['kimiz', 'nazar', 'kalp', 'post', 'yonca', 'kumsaati']) addItem(k);
  P.xp = 0; P.need = 1e9; back();
});
await shot('07_oyun');
await pg.evaluate(() => choose('level', luOpts())); await shot('08_seviye');
await pg.evaluate(() => { back(); pause() }); await shot('09_duraklat');
await pg.evaluate(() => { resume(); over(false) }); await sleep(800); await shot('10_son');
await pg.setViewportSize({ width: 390, height: 844 }); await pg.evaluate(() => menu()); await shot('11_tel_menu');
console.log('sayfa hatası:', errs.length ? errs.slice(0, 5) : 'yok'); await br.close();
