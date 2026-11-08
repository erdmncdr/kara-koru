// Meshy Alp denetimi: eski ve yeni Alp'i aynı anlarda çeker (seçim, bekleme, yürüme, saldırı sağ/sol, zıplama,
// kayma, atılma, darbe), kostüm ve şapkayı dener, hepsini tek karşılaştırma görüntüsünde birleştirir.
// node tools/meshy-alp.mjs <url> <klasör>   (CHROME ortam değişkeni Chrome yolunu verir)
import { chromium } from 'playwright';
import fs from 'node:fs';
const [url, out] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const br = await chromium.launch({ executablePath: process.env.CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const errs = [];
const ANLAR = [
  ['bekle', {}], ['yuru', { vx: 0, vz: 4 }], ['saldiri_sag', { at: .45, side: 0 }], ['saldiri_sol', { at: .45, side: 1 }],
  ['zipla', { tus: ' ' }], ['kay', { tus: 'c' }], ['atil', { dsh: .2, vz: 14 }], ['darbe', { hit: .3 }]
];
const kareler = {};
for (const [ad, q] of [['eski', '?eski'], ['meshy', '']]) {
  const pg = await br.newPage({ viewport: { width: 1280, height: 720 } });
  pg.on('pageerror', e => errs.push(ad + ': ' + e.message));
  pg.on('console', m => { if (/Meshy modeli/.test(m.text())) errs.push(ad + ': ' + m.text()); });
  await pg.addInitScript(() => {
    Element.prototype.requestPointerLock = function () {};
    localStorage.setItem('kk_set', JSON.stringify({ q: 1, bl: 0 })); localStorage.setItem('kk_tut', '1'); localStorage.setItem('kk_ci', '0');
    let s = 4242; Math.random = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 };
  });
  await pg.goto(url + q, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await pg.waitForFunction(() => typeof S !== 'undefined' && S === 'menu', null, { timeout: 90000 });
  await pg.addStyleTag({ content: '#tip{display:none!important}' });
  await pg.evaluate(() => { menuPage('kahraman'); selC(1, 1); selC(0, 1) });
  await sleep(6000);
  const sec = `${out}/${ad}_secim.png`; await pg.screenshot({ path: sec, clip: { x: 700, y: 170, width: 420, height: 520 } }); kareler[ad + '_secim'] = sec;
  // kostüm ve şapka (yalnız seçim ekranında)
  for (const [kad, sk] of [['altin', 'gold'], ['kara', 'dark'], ['alev', 'fire']]) {
    await pg.evaluate(sk => { META.skin.cur0 = sk; META.hat.kurbaga1 = 1; META.hat.cur = sk == 'fire' ? 'kurbaga1' : ''; selC(0, 1, 1) }, sk);
    await sleep(3500);
    const f = `${out}/${ad}_kostum_${kad}.png`; await pg.screenshot({ path: f, clip: { x: 700, y: 170, width: 420, height: 520 } }); kareler[ad + '_kostum_' + kad] = f;
  }
  await pg.evaluate(() => { META.skin.cur0 = ''; META.hat.cur = ''; selC(0, 1, 1); start(); P.inv = 1e9 });
  await sleep(6000); await pg.evaluate(() => { if (S === 'ready') goReady() }); await sleep(2500);
  for (const [an, o] of ANLAR) {
    if (o.tus) {
      // gerçek tuşlarla: ileri koş, sonra zıpla ya da kay; kare ortasında çek
      await pg.evaluate(() => { window.__an && cancelAnimationFrame(window.__an); K.w = 1; P.inv = 1e9 });
      await sleep(900);
      await pg.evaluate(t => { K[t] = 1 }, o.tus);
      await sleep(o.tus == ' ' ? 220 : 420);
      const f = `${out}/${ad}_${an}.png`; await pg.screenshot({ path: f, clip: { x: 470, y: 230, width: 340, height: 330 } }); kareler[ad + '_' + an] = f;
      await pg.evaluate(t => { K[t] = 0; K.w = 0 }, o.tus); await sleep(900);
      await pg.evaluate(() => { window.__p0 && ([P.x, P.y, P.z] = window.__p0, P.vx = P.vz = 0) }); await sleep(600);
      continue;
    }
    // her karede oyunun hesapladığı değerleri bu anın değerleriyle ez
    await pg.evaluate(o => {
      window.__an && cancelAnimationFrame(window.__an);
      window.__p0 = window.__p0 || [P.x, P.y, P.z];
      const f = () => { for (const [k, v] of Object.entries(o)) P[k] = v; [P.x, P.y, P.z] = window.__p0; if (!('air' in o)) P.air = 0; window.__an = requestAnimationFrame(f); };
      f();
    }, o);
    await sleep(1600);
    const f = `${out}/${ad}_${an}.png`; await pg.screenshot({ path: f, clip: { x: 470, y: 230, width: 340, height: 330 } }); kareler[ad + '_' + an] = f;
  }
  await pg.close();
}
// karşılaştırma görüntüsü: her satır bir an, solda eski, sağda Meshy
const pg = await br.newPage({ viewport: { width: 1500, height: 900 } });
const b64 = f => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');
const hucre = (f, t, w) => `<div style="position:relative"><img src="${b64(f)}" style="width:${w}px;display:block"><b style="position:absolute;left:6px;top:4px;color:#fff;font:bold 14px sans-serif;text-shadow:0 0 3px #000,0 0 3px #000">${t}</b></div>`;
const anlar = ANLAR.map(a => a[0]);
await pg.setContent(`<body style="margin:0;background:#1b1b1b;padding:6px;font:13px sans-serif;color:#ccc">
<div style="display:flex;gap:6px;flex-wrap:wrap">${['secim', 'kostum_altin', 'kostum_kara', 'kostum_alev'].map(n => hucre(kareler['eski_' + n], 'eski · ' + n, 175) + hucre(kareler['meshy_' + n], 'Meshy · ' + n, 175)).join('')}</div>
<div style="display:grid;grid-template-columns:repeat(8,1fr);gap:6px;margin-top:6px">${anlar.map(n => hucre(kareler['eski_' + n], 'eski · ' + n, 180)).join('')}${anlar.map(n => hucre(kareler['meshy_' + n], 'Meshy · ' + n, 180)).join('')}</div></body>`);
await pg.screenshot({ path: `${out}/karsilastirma.png`, fullPage: true });
console.log('hata:', errs.length ? errs.slice(0, 6) : 'yok');
await br.close();
