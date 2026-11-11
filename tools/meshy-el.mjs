// Meshy Alp el denetimi: seçim ekranında modeli dört yönden, bekleme ve hareket anlarında çeker; kalkan ve kılıç elinin yakın planı.
// node tools/meshy-el.mjs <url> <çıkış.png>   (CHROME ortam değişkeni Chrome yolunu verir)
import { chromium } from 'playwright';
import fs from 'node:fs';
const [url, out] = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const br = await chromium.launch({ executablePath: process.env.CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await br.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; pg.on('pageerror', e => errs.push(e.message));
await pg.addInitScript(() => {
  Element.prototype.requestPointerLock = function () {};
  localStorage.setItem('kk_set', JSON.stringify({ q: 1, bl: 0 })); localStorage.setItem('kk_tut', '1'); localStorage.setItem('kk_ci', '0');
});
await pg.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
await pg.waitForFunction(() => typeof S !== 'undefined' && S === 'menu', null, { timeout: 90000 });
await pg.addStyleTag({ content: '#ov,#tip{display:none!important}' });
await pg.evaluate(() => { menuPage('kahraman'); selC(1, 1); selC(0, 1) });
await pg.waitForFunction(() => window.__glb, null, { timeout: 60000 }); await sleep(1500);
const ANLAR = [['bekle', 'idle', 1.2], ['savas', 'combat', .6], ['sag_savurus', 'atkR', .55], ['sol_savurus', 'atkL', .75], ['yuru', 'walk', .3], ['kos', 'run', .15], ['zipla', 'jump', .8], ['takla', 'flip', 1.6], ['atil', 'dash', .45], ['darbe', 'hit', .5]];
const YON = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
const kareler = [];
for (const [ad, k, t] of ANLAR) for (const y of YON) {
  await pg.evaluate(([k, t, y]) => {
    const G = window.__glb; G.dondur = 1;
    for (const a of Object.values(G.A)) a.setEffectiveWeight(0);
    const tum = ['atkR', 'atkL', 'hit'].includes(k);
    // üst gövde kliplerinde bacaklar bekleme duruşunda
    if (tum) { G.A.combat.setEffectiveWeight(1); G.A.combat.time = .6; }
    G.A[k].setEffectiveWeight(1); G.A[k].time = t; if (G.A[k + '_u']) { G.A[k + '_u'].setEffectiveWeight(1); G.A[k + '_u'].time = t; }
    for (const a of Object.values(G.A)) a.paused = false;
    G.mixer.update(0);
    H.g.rotation.y = y;
  }, [k, t, y]);
  await sleep(450);
  const f = out.replace(/\.png$/, `_${ad}_${YON.indexOf(y)}.png`);
  await pg.screenshot({ path: f, clip: { x: 740, y: 220, width: 360, height: 400 } });
  kareler.push([f, ad + ' · ' + ['ön', 'sağ', 'arka', 'sol'][YON.indexOf(y)]]);
}
const p2 = await br.newPage({ viewport: { width: 1460, height: 1300 } });
const b64 = f => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');
await p2.setContent(`<body style="margin:0;background:#1b1b1b;display:grid;grid-template-columns:repeat(8,1fr);gap:4px;padding:4px">${kareler.map(([f, t]) => `<div style="position:relative"><img src="${b64(f)}" style="width:100%;display:block"><b style="position:absolute;left:4px;top:2px;color:#fff;font:bold 12px sans-serif;text-shadow:0 0 3px #000">${t}</b></div>`).join('')}</body>`);
await p2.screenshot({ path: out, fullPage: true });
if (!process.env.KEEP) for (const [f] of kareler) fs.rmSync(f);
console.log('hata:', errs.length ? errs : 'yok');
await br.close();
