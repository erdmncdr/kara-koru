// Meshy denemesi: kodla kurulmuş Alp ile Meshy Alp'i aynı açıdan çeker (seçim ekranı, oyunda durma ve koşma),
// kare hızını ölçer. node tools/meshy-karsilastir.mjs <url> <klasör>   (CHROME ortam değişkeni Chrome yolunu verir)
import { chromium } from 'playwright';
import fs from 'node:fs';
const [url, out] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const br = await chromium.launch({ executablePath: process.env.CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const errs = [];
for (const [ad, q] of [['eski', '?eski'], ['meshy', '']]) {
  const pg = await br.newPage({ viewport: { width: 1280, height: 720 } });
  pg.on('pageerror', e => errs.push(ad + ': ' + e.message));
  pg.on('console', m => { if (m.type() == 'warning' || m.type() == 'error') errs.push(ad + ' konsol: ' + m.text().slice(0, 160)); });
  await pg.addInitScript(() => {
    Element.prototype.requestPointerLock = function () {};
    localStorage.setItem('kk_set', JSON.stringify({ q: 1, bl: 0 })); localStorage.setItem('kk_tut', '1'); localStorage.setItem('kk_ci', '0');
  });
  await pg.goto(url + q, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await pg.waitForFunction(() => typeof S !== 'undefined' && S === 'menu', null, { timeout: 90000 });
  await pg.addStyleTag({ content: '#tip{display:none!important}' });
  await pg.evaluate(() => { menuPage('kahraman'); selC(1, 1); selC(0, 1) });
  await sleep(6000);
  await pg.screenshot({ path: `${out}/${ad}_secim.png`, clip: { x: 660, y: 150, width: 460, height: 560 } });
  await pg.evaluate(() => { start(); P.inv = 1e9 });
  await sleep(6000); await pg.evaluate(() => { if (S === 'ready') goReady() }); await sleep(2500);
  await pg.screenshot({ path: `${out}/${ad}_oyun_dur.png`, clip: { x: 440, y: 200, width: 400, height: 380 } });
  await pg.evaluate(() => { K.w = 1 }); await sleep(1500);
  await pg.screenshot({ path: `${out}/${ad}_oyun_kos.png`, clip: { x: 440, y: 200, width: 400, height: 380 } });
  await sleep(4000);
  const fps = await pg.evaluate(() => PERF && PERF.lastFps);
  console.log(ad, 'kare/sn (başsız, yazılım GPU):', fps && fps.toFixed(1));
  await pg.close();
}
console.log('uyarı/hata:', errs.length ? errs.slice(0, 6) : 'yok');
await br.close();
