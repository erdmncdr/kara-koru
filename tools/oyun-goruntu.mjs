// Oyun içi görsel denetim: çok silahla, kalabalık düşmanla üç diyarda ve boss'la kare çeker.
// node tools/oyun-goruntu.mjs <url> <klasör>   (CHROME ortam değişkeni Chrome yolunu verir)
import { chromium } from 'playwright';
import fs from 'node:fs';
const [url, out] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const br = await chromium.launch({ executablePath: process.env.CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await br.newPage({ viewport: { width: 1280, height: 720 } });
await pg.addInitScript(() => {
  Element.prototype.requestPointerLock = function () {};
  localStorage.setItem('kk_set', JSON.stringify({ q: 1, bl: 0 })); localStorage.setItem('kk_tut', '1');
  let s = 99; Math.random = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 };
});
const errs = []; pg.on('pageerror', e => errs.push(e.message));
await pg.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
await pg.waitForFunction(() => typeof S !== 'undefined' && S === 'menu', null, { timeout: 90000 });
await pg.addStyleTag({ content: '#tip{display:none!important}' });
await pg.evaluate(() => { start(); P.inv = 1e9 });
await sleep(6000); await pg.evaluate(() => { if (S === 'ready') goReady() }); await sleep(2000);
// silahlar: farklı görsel efektli olanlar
await pg.evaluate(() => {
  for (const w of ['orbit', 'fire', 'zap', 'nova', 'aura', 'tornado', 'noodle']) run('silah ' + w);
  for (const k of ['kimiz', 'kalp', 'yildirimkure', 'ejderates']) addItem(k);
  P.xp = 0; P.need = 1e9;
});
const kare = async (ad, bekle = 2500) => { await sleep(bekle); await pg.screenshot({ path: `${out}/${ad}.png` }); };
for (const [i, ad] of [[0, 'korukara'], [1, 'bozkir'], [2, 'mahzen']]) {
  await pg.evaluate(() => { run('zaman 200'); const ks = Object.keys(KINDS); for (const k of ks.slice(0, 4)) run('dogur ' + k + ' 12'); });
  // karakter yürüsün: düşmanlar ve efektler ekranda
  await pg.evaluate(() => { $K = 1 }).catch(() => {});
  await kare(ad + '_kalabalik', 3500);
  await kare(ad + '_kalabalik2', 1500);
  if (i == 0) { await pg.evaluate(() => run('boss')); await kare(ad + '_boss', 4000); }
  if (i < 2) {
    await pg.evaluate(() => { run('asama') });
    await sleep(3500); await pg.evaluate(() => { if (S === 'ready') goReady(); if (typeof back == 'function' && S == 'level') back(); }); await sleep(1500);
  }
}
console.log('sayfa hatası:', errs.length ? errs.slice(0, 5) : 'yok');
await br.close();
