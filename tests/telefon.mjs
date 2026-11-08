// Telefon oynanış kontrolü: birkaç ekran boyutunda (dikey, yatay, tablet) gerçek dokunma olaylarıyla
// sanal çubuk, düğme boyutları, çakışmalar, ekran dışına taşma, görüş açısı, Kullan parlaması, duraklat ve büyük harita.
// node tests/telefon.mjs <url> [görüntü klasörü]   (CHROME ortam değişkeni Chrome yolunu verir)
import { chromium } from 'playwright';
import fs from 'node:fs';
const [url, out] = process.argv.slice(2);
if (out) fs.mkdirSync(out, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const br = await chromium.launch({ executablePath: process.env.CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const AYG = [
  ['se_dikey', 375, 667], ['orta_dikey', 390, 844], ['buyuk_dikey', 430, 932],
  ['se_yatay', 667, 375], ['orta_yatay', 844, 390], ['buyuk_yatay', 932, 430], ['tablet', 820, 1180]
];
let hata = 0;
const ok = (ad, kosul, bilgi) => { console.log((kosul ? 'GEÇTİ ' : 'KALDI ') + ad, bilgi === undefined ? '' : JSON.stringify(bilgi)); if (!kosul) hata++; };
const errs = [];
for (const [ad, w, h] of AYG) {
  const ctx = await br.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const pg = await ctx.newPage();
  await pg.addInitScript(() => {
    Element.prototype.requestPointerLock = function () {};
    localStorage.setItem('kk_set', JSON.stringify({ q: 1, bl: 0 })); localStorage.setItem('kk_tut', '1');
    let s = 777; Math.random = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 };
  });
  pg.on('pageerror', e => errs.push(ad + ': ' + e.message));
  await pg.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await pg.waitForFunction(() => typeof S !== 'undefined' && S === 'menu', null, { timeout: 90000 });
  await pg.addStyleTag({ content: '#tip{display:none!important}' });
  await pg.evaluate(() => { start(); P.inv = 1e9 });
  await sleep(6000); await pg.evaluate(() => { if (S === 'ready') goReady() }); await sleep(2500);
  await pg.evaluate(() => {
    for (let i = 0; i < 4; i++) { choose('level', luOpts()); chPick(i % 3); }
    for (const k of ['kimiz', 'nazar', 'kalp', 'post', 'yonca', 'kumsaati', 'tuy', 'pusula']) addItem(k);
    P.xp = 0; P.need = 1e9; back();
  });
  await sleep(600);
  const cdp = await ctx.newCDPSession(pg);
  const jx = Math.round(w * .22), jy = Math.round(h * .72);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: jx, y: jy, id: 1 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: jx + 30, y: jy - 30, id: 1 }] });
  await sleep(350);
  const m = await pg.evaluate(() => {
    const r = id => { const e = document.getElementById(id); if (!e) return null; const b = e.getBoundingClientRect(); const v = getComputedStyle(e).display != 'none' && getComputedStyle(e).visibility != 'hidden'; return v ? { x: b.left, y: b.top, w: b.width, h: b.height } : null; };
    // içerikli kutular: sol sütunun dolu kısmı (slotlar dahil), sağ sütun, orta, eşya şeridi
    const box = sel => { const es = [...document.querySelectorAll(sel)].filter(e => { const b = e.getBoundingClientRect(); return b.width && b.height && getComputedStyle(e).visibility != 'hidden'; }); if (!es.length) return null; const bs = es.map(e => e.getBoundingClientRect()); const x = Math.min(...bs.map(b => b.left)), y = Math.min(...bs.map(b => b.top)); return { x, y, w: Math.max(...bs.map(b => b.right)) - x, h: Math.max(...bs.map(b => b.bottom)) - y }; };
    return {
      mb: Object.fromEntries(['bj', 'bs', 'bc', 'be', 'bp'].map(k => [k, r(k)])),
      joy: r('joy'), J: { x: J.x, y: J.y },
      itr: box('#itr > *'), lt: box('#lt > *:not(:empty)'), rt: box('#rt > *'), ct: box('#tmr, #yol'),
      fov: cam.fov, aspect: cam.aspect, W: innerWidth, H: innerHeight
    };
  });
  if (out) await pg.screenshot({ path: `${out}/${ad}_oyun.png` });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await sleep(150);
  const sonra = await pg.evaluate(() => ({ joy: document.getElementById('joy').classList.contains('on'), J: J.x + J.y }));
  const kes = (a, b) => a && b && a.x < b.x + b.w - 1 && b.x < a.x + a.w - 1 && a.y < b.y + b.h - 1 && b.y < a.y + a.h - 1;
  const ic = a => a && a.x >= 0 && a.y >= 0 && a.x + a.w <= m.W + .5 && a.y + a.h <= m.H + .5;
  const dug = Object.entries(m.mb);
  ok(`${ad}: dört oyun düğmesi ve duraklat görünüyor`, dug.every(([, b]) => b), Object.keys(m.mb).filter(k => !m.mb[k]));
  ok(`${ad}: düğmeler en az 44 px`, dug.every(([, b]) => b && b.w >= 44 && b.h >= 44), dug.map(([k, b]) => k + ':' + (b && Math.round(b.w))).join(' '));
  ok(`${ad}: düğmeler ekranın içinde`, dug.every(([, b]) => ic(b)));
  const cak = [];
  for (let i = 0; i < dug.length; i++) for (let j = i + 1; j < dug.length; j++) if (kes(dug[i][1], dug[j][1])) cak.push(dug[i][0] + '-' + dug[j][0]);
  for (const [k, b] of dug) for (const [n, z] of [['eşya', m.itr], ['sol', m.lt], ['sağ', m.rt], ['orta', m.ct]]) if (kes(b, z)) cak.push(k + '/' + n);
  ok(`${ad}: düğmeler birbirine ve HUD'a binmiyor`, !cak.length, cak);
  ok(`${ad}: sanal çubuk dokunulan yerde görünüyor ve yürütüyor`, !!m.joy && Math.abs(m.joy.x + m.joy.w / 2 - jx) < 3 && m.J.x > .3 && m.J.y < -.3, { joy: m.joy, J: m.J });
  ok(`${ad}: parmak kalkınca çubuk gizlenir ve durur`, !sonra.joy && sonra.J == 0);
  const yatayFov = 2 * Math.atan(Math.tan(m.fov * Math.PI / 360) * m.aspect) * 180 / Math.PI;
  ok(`${ad}: yatay görüş açısı en az 44°`, yatayFov >= 44, { dikeyFov: Math.round(m.fov), yatayFov: Math.round(yatayFov), en_boy: +m.aspect.toFixed(2) });
  if (ad == 'orta_dikey' || ad == 'orta_yatay') {
    // Kullan parlaması: sandığın yanına ışınla
    const be = await pg.evaluate(async () => {
      const c = CH[0].m.position; P.x = c.x + 1.5; P.z = c.z; P.y = c.y;
      await new Promise(r => setTimeout(r, 1500)); return document.getElementById("be").classList.contains('on');
    });
    ok(`${ad}: sandık yanındayken Kullan parlıyor`, be);
    if (out) await pg.screenshot({ path: `${out}/${ad}_kullan.png` });
    // büyük harita: mini haritaya basılı tut
    const mm = await pg.evaluate(() => { const b = document.getElementById('mm').getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: mm[0], y: mm[1], id: 2 }] });
    await sleep(300);
    const bm = await pg.evaluate(() => BMV === 1);
    if (out) await pg.screenshot({ path: `${out}/${ad}_harita.png` });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    ok(`${ad}: mini haritaya basılı tutunca büyük harita açılıyor`, bm === true, bm);
    // duraklat düğmesi
    const bp = await pg.evaluate(() => { const b = document.getElementById('bp').getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: bp[0], y: bp[1], id: 3 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await sleep(400);
    ok(`${ad}: duraklat düğmesi duraklatıyor`, await pg.evaluate(() => S === 'pause'));
    const gizli = await pg.evaluate(() => ['bj', 'bs', 'bc', 'be', 'bp'].every(k => getComputedStyle(document.getElementById(k)).display == 'none'));
    ok(`${ad}: duraklatmada dokunmatik düğmeler gizli`, gizli);
  }
  await ctx.close();
}
ok('sayfa hatası yok', !errs.length, errs.slice(0, 5));
console.log(hata ? `${hata} kontrol kaldı` : 'Tüm telefon kontrolleri geçti');
await br.close();
process.exit(hata ? 1 : 0);
