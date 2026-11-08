// Görsel denetim: bütün silah, tom ve eşya simgelerini adı ve açıklamasıyla tablo halinde, kahramanların 3B modellerini tek tek çeker.
// node tools/gorsel-denetim.mjs <url> <klasör>   (CHROME ortam değişkeni Chrome yolunu verir)
import { chromium } from 'playwright';
import fs from 'node:fs';
const [url, out] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const br = await chromium.launch({ executablePath: process.env.CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await br.newPage({ viewport: { width: 1280, height: 720 } });
await pg.addInitScript(() => {
  Element.prototype.requestPointerLock = function () {};
  localStorage.setItem('kk_set', JSON.stringify({ q: 2, bl: 0 })); localStorage.setItem('kk_tut', '1');
});
const errs = []; pg.on('pageerror', e => errs.push(e.message));
await pg.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
await pg.waitForFunction(() => typeof S !== 'undefined' && S === 'menu', null, { timeout: 90000 });
await sleep(2500);
// kahraman modelleri: kahraman sayfasında her kahramanı seç, sağdaki modeli çek
const hs = await pg.evaluate(() => heroIdx().map(i => [i, CR[i].k, CR[i].n]));
await pg.evaluate(() => menuPage('kahraman'));
for (const [i, k] of hs) {
  await pg.evaluate(i => selC(i), i); await sleep(1300);
  await pg.screenshot({ path: `${out}/model_${k}.png`, clip: { x: 640, y: 120, width: 520, height: 600 } });
}
await pg.screenshot({ path: `${out}/kahraman_sayfa.png` });
// simge tabloları
const gruplar = await pg.evaluate(() => {
  const g = [];
  for (const k of Object.keys(WD)) g.push(['w_' + k, WD[k].n, WD[k].d || '', 'Silah']);
  for (const k of Object.keys(TDF)) g.push(['t_' + k, TDF[k].n, TDF[k].s || TDF[k].d || '', 'Tom']);
  for (const k of Object.keys(ITD)) if (!ITD[k].q) g.push(['i_' + k, ITD[k].n, ITD[k].d || '', 'Eşya']);
  return g;
});
const SAY = 24;
for (let p = 0; p * SAY < gruplar.length; p++) {
  const dilim = gruplar.slice(p * SAY, (p + 1) * SAY);
  await pg.evaluate(dilim => {
    let d = document.getElementById('denetim');
    if (!d) { d = document.createElement('div'); d.id = 'denetim'; document.body.appendChild(d); }
    d.style.cssText = 'position:fixed;inset:0;z-index:999;background:#2a2a2e;display:grid;grid-template-columns:repeat(6,1fr);gap:6px;padding:8px;font:12px/1.25 sans-serif;color:#fff;overflow:hidden';
    d.innerHTML = dilim.map(([id, n, ds, t]) => `<div style="background:#111;border:1px solid #444;padding:4px;display:flex;flex-direction:column;align-items:center;text-align:center"><div style="width:84px;height:84px">${ikon(id, 'plus', '#fff', id.startsWith('t_') ? 't' : undefined).replace('class=ika', 'style="width:84px;height:84px"')}</div><b style="font-size:13px">${n}</b><small style="color:#9a9">${id} · ${t}</small><span style="color:#ccc;font-size:10.5px;max-height:40px;overflow:hidden">${ds}</span></div>`).join('');
  }, dilim);
  await sleep(500);
  await pg.screenshot({ path: `${out}/simge_${String(p + 1).padStart(2, '0')}.png` });
}
console.log('kahraman:', hs.map(h => h[1]).join(' '), '· simge:', gruplar.length, '· sayfa hatası:', errs.length ? errs.slice(0, 3) : 'yok');
await br.close();
