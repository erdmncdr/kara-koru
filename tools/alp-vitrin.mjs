// Alp vitrini: yüksek kalitede yakın tanıtım kareleri (ön, 360° dönüş, kostümler, oyun içi aksiyon) ve kısa bir video.
// node tools/alp-vitrin.mjs <url> <klasör>   (CHROME ortam değişkeni Chrome yolunu verir)
import { chromium } from 'playwright';
import fs from 'node:fs';
const [url, out] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const br = await chromium.launch({ executablePath: process.env.CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await br.newContext({ viewport: { width: 1280, height: 720 } });
const pg = await ctx.newPage();
const errs = []; pg.on('pageerror', e => errs.push(e.message));
await pg.addInitScript(() => {
  Element.prototype.requestPointerLock = function () {};
  localStorage.setItem('kk_set', JSON.stringify({ q: 2, bl: 1, cd: 9 })); localStorage.setItem('kk_tut', '1'); localStorage.setItem('kk_ci', '0');
  let s = 99; Math.random = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 };
});
await pg.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
await pg.waitForFunction(() => typeof S !== 'undefined' && S === 'menu', null, { timeout: 90000 });
await pg.waitForFunction(() => window.__glb, null, { timeout: 60000 });
await pg.addStyleTag({ content: '#tip{display:none!important}' });
const kayitBasla = () => pg.evaluate(() => {
  const cv = document.querySelector('canvas'), st = cv.captureStream(30), rec = new MediaRecorder(st, { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 6e6 });
  window.__parca = []; rec.ondataavailable = e => e.data.size && window.__parca.push(e.data); rec.start(250); window.__rec = rec;
});
const kayitBitir = async ad => { const b64 = await pg.evaluate(() => new Promise(res => { window.__rec.onstop = async () => { const b = new Blob(window.__parca, { type: 'video/webm' }); const u = new Uint8Array(await b.arrayBuffer()); let s = ''; for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode.apply(null, u.subarray(i, i + 8192)); res(btoa(s)); }; window.__rec.stop(); })); fs.writeFileSync(`${out}/${ad}`, Buffer.from(b64, 'base64')); };
// 1) kahraman seçim ekranı, arayüzle
await pg.evaluate(() => menuPage('kahraman')); await sleep(4000);
await pg.screenshot({ path: `${out}/01_secim_ekrani.png` });
// 2) arayüzsüz yakın: model döner, dört açı
await pg.addStyleTag({ content: '#ov{opacity:0!important}' });
const yakin = { x: 760, y: 120, width: 460, height: 600 };
for (const [i, a] of [[0, 0], [1, Math.PI / 2], [2, Math.PI], [3, -Math.PI * .75]]) {
  await pg.evaluate(a => { H.g.rotation.y = a; window.__sabit = setInterval(() => { H.g.rotation.y = a }, 5) }, a);
  await sleep(1200);
  await pg.screenshot({ path: `${out}/02_donus_${i}.png`, clip: yakin });
  await pg.evaluate(() => clearInterval(window.__sabit));
}
// 2b) yavaş 360° dönüş videosu (yalnız oyun tuvali)
await kayitBasla();
await pg.evaluate(() => { const t0 = performance.now(); window.__sabit = setInterval(() => { H.g.rotation.y = (performance.now() - t0) / 6000 * Math.PI * 2 }, 16) });
await sleep(6200);
await pg.evaluate(() => clearInterval(window.__sabit));
await kayitBitir('alp_donus.webm');
// 3) kostümler
for (const [ad, sk] of [['altin', 'gold'], ['kara', 'dark'], ['alev', 'fire'], ['asit', 'acid']]) {
  await pg.evaluate(sk => { META.skin.cur0 = sk; selC(0, 1, 1); }, sk);
  await sleep(3500);
  await pg.evaluate(() => { H.g.rotation.y = -.35; window.__sabit = setInterval(() => { H.g.rotation.y = -.35 }, 5) });
  await sleep(600);
  await pg.screenshot({ path: `${out}/03_kostum_${ad}.png`, clip: yakin });
  await pg.evaluate(() => clearInterval(window.__sabit));
}
await pg.evaluate(() => { META.skin.cur0 = ''; selC(0, 1, 1) });
await sleep(3000);
// 4) oyun içi: koş, saldır, zıpla, takla, kay, atıl; yanında düşmanlar
await pg.evaluate(() => { start(); P.inv = 1e9 });
await sleep(6000); await pg.evaluate(() => { if (S === 'ready') goReady() });
await pg.waitForFunction(() => window.__glb && __glb.H === H, null, { timeout: 30000 });
await pg.evaluate(() => { SET.cd = 6.5; P.W = [newW('slash'), newW('fire')]; calc(); P.xp = 0; P.need = 1e9; run('dogur gulyabani 10'); yawT = yaw = yaw + 2.4 });
await sleep(1500);
await kayitBasla();
const ak = async (ad, f, bekle) => { await pg.evaluate(f); await sleep(bekle); await pg.screenshot({ path: `${out}/04_${ad}.png` }); };
await ak('kos', () => { K.w = 1; K.d = 1 }, 1600);
await ak('saldiri', () => { P.at = 0; P.atT = T; P.side = 0 }, 170);
await ak('zipla', () => { K[' '] = 1; setTimeout(() => K[' '] = 0, 120) }, 260);
await pg.evaluate(() => { K[' '] = 1; setTimeout(() => K[' '] = 0, 120) }); await sleep(200); await pg.screenshot({ path: `${out}/04_takla.png` });
await sleep(1200);
await ak('kay', () => { K.c = 1; setTimeout(() => K.c = 0, 500) }, 380);
await sleep(700);
await ak('atil', () => { K.Shift = 1; setTimeout(() => K.Shift = 0, 100) }, 110);
await sleep(600);
await ak('savas_durusu', () => { K.w = 0; K.d = 0 }, 1800);
// video için biraz daha oyun
await pg.evaluate(() => { K.w = 1; K.a = 1 }); await sleep(1500); await pg.evaluate(() => { K.a = 0; K.d = 1 }); await sleep(1500); await pg.evaluate(() => { K.d = 0; K[' '] = 1; setTimeout(() => K[' '] = 0, 150) }); await sleep(1500);
await pg.evaluate(() => { K.w = 0 }); await sleep(800);
await kayitBitir('alp_oyun.webm');
await ctx.close();
console.log('hata:', errs.length ? errs.slice(0, 5) : 'yok');
await br.close();
