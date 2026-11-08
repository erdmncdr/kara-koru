// Akıcı Alp videosu: oyunun kare döngüsü elle ilerletilir (her adım 1/30 sn oyun zamanı), her kare JPEG olarak saklanır,
// sonra kareler saniyede 30 kareyle bir tuvale oynatılıp tarayıcının kaydedicisiyle WebM'e yazılır. Yavaş (yazılım)
// çizimde bile video gerçek hızda ve takılmadan oynar. Kurulum gerektirmez.
// node tools/alp-video.mjs <url> <klasör>
import { chromium } from 'playwright';
import fs from 'node:fs';
const [url, out] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const br = await chromium.launch({ executablePath: process.env.CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await br.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; pg.on('pageerror', e => errs.push(e.message));
await pg.addInitScript(() => {
  Element.prototype.requestPointerLock = function () {};
  localStorage.setItem('kk_set', JSON.stringify({ q: 2, bl: 1, cd: 6.5 })); localStorage.setItem('kk_tut', '1'); localStorage.setItem('kk_ci', '0');
  let s = 99; Math.random = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 };
  // kare döngüsünü ele al: serbestken gerçek zamanla akar, elle kipinde yalnız __adim() ile ilerler
  const gercek = window.requestAnimationFrame.bind(window), q = [];
  let t = 0;
  window.__serbest = true;
  window.requestAnimationFrame = cb => { q.push(cb); return q.length; };
  window.cancelAnimationFrame = () => {};
  const bosalt = ts => { const c = q.splice(0); for (const f of c) f(ts); };
  const pompa = ts => { if (window.__serbest) { t = ts; bosalt(ts); } gercek(pompa); };
  gercek(pompa);
  window.__adim = () => { t += 1000 / 30; bosalt(t); };
  window.__gercekRAF = gercek;
});
await pg.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
await pg.waitForFunction(() => typeof S !== 'undefined' && S === 'menu', null, { timeout: 90000 });
await pg.waitForFunction(() => window.__glb, null, { timeout: 60000 });
await pg.addStyleTag({ content: '#tip,#hud,#wls,.mb,#joy,#tt,#ov{visibility:hidden!important}' });
await sleep(1500);

// kare alıcı: her adımdan hemen sonra oyun tuvali kırpılıp JPEG yapılır
await pg.evaluate(() => {
  window.__kare = [];
  window.__al = async (kirp, w, h) => {
    const gl = document.querySelector('canvas'), c = window.__kc || (window.__kc = document.createElement('canvas'));
    c.width = w; c.height = h;
    const sx = gl.width / innerWidth, sy = gl.height / innerHeight;
    c.getContext('2d').drawImage(gl, kirp[0] * sx, kirp[1] * sy, kirp[2] * sx, kirp[3] * sy, 0, 0, w, h);
    window.__kare.push(await new Promise(r => c.toBlob(r, 'image/jpeg', .9)));
  };
});
// sahne betiği: her kare için oyuna verilecek komut (kare numarası → işlev)
async function cek(ad, kareSay, kirp, w, h, betik) {
  await pg.evaluate(() => { window.__kare = []; window.__serbest = false; });
  for (let i = 0; i < kareSay; i++) {
    await pg.evaluate(([i, betik, kirp, w, h]) => { new Function('i', betik)(i); window.__adim(); return window.__al(kirp, w, h); }, [i, betik, kirp, w, h]);
  }
  // oynat ve kaydet
  const b64 = await pg.evaluate(([w, h]) => new Promise(async res => {
    const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
    const rec = new MediaRecorder(c.captureStream(30), { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 8e6 }), parca = [];
    rec.ondataavailable = e => e.data.size && parca.push(e.data);
    const bm = await Promise.all(window.__kare.slice(0, 8).map(b => createImageBitmap(b)));
    rec.start(200);
    const t0 = performance.now();
    for (let i = 0; i < window.__kare.length; i++) {
      if (!bm[i + 8] && window.__kare[i + 8]) bm[i + 8] = createImageBitmap(window.__kare[i + 8]);
      x.drawImage(await bm[i], 0, 0); bm[i] = null;
      const hedef = t0 + (i + 1) * 1000 / 30; await new Promise(r => setTimeout(r, Math.max(0, hedef - performance.now())));
    }
    rec.onstop = async () => { const u = new Uint8Array(await new Blob(parca, { type: 'video/webm' }).arrayBuffer()); let s = ''; for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode.apply(null, u.subarray(i, i + 8192)); res(btoa(s)); };
    rec.stop();
  }), [w, h]);
  fs.writeFileSync(`${out}/${ad}.webm`, Buffer.from(b64, 'base64'));
  // ilk ve orta kareden görüntü (kontrol için)
  for (const [k, j] of [['a', 0], ['b', Math.floor(kareSay / 2)]]) {
    const im = await pg.evaluate(async j => { const b = window.__kare[j]; const u = new Uint8Array(await b.arrayBuffer()); let s = ''; for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode.apply(null, u.subarray(i, i + 8192)); return btoa(s); }, j);
    fs.writeFileSync(`${out}/${ad}_${k}.jpg`, Buffer.from(im, 'base64'));
  }
  await pg.evaluate(() => { window.__kare = []; window.__serbest = true; });
}

// 1) seçim ekranında 6 saniyelik tam dönüş (bekleme hareketiyle), modelin çevresi kırpılır
await pg.evaluate(() => menuPage('kahraman')); await sleep(3500);
const ht = await pg.evaluate(() => { const v = new (cam.position.constructor)(); H.g.getWorldPosition(v); const ust = v.clone(); ust.y += __glb.h0 * 1.05; v.project(cam); ust.project(cam); return [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight, (1 - ust.y) / 2 * innerHeight]; });
const boy = (ht[1] - ht[2]) * 1.25, kirp1 = [ht[0] - boy * .5, ht[2] - boy * .1, boy, boy * 1.0];
await cek('alp_donus', 180, kirp1.map(Math.round), 720, 720, 'H.g.rotation.y = i / 180 * Math.PI * 2;');

// 2) oyun: koşu, zıplama, takla, kayma, atılma, savaş duruşu ve iki savuruş, tekrar koşu
await pg.evaluate(() => { start(); P.inv = 1e9 });
await sleep(6000); await pg.evaluate(() => { if (S === 'ready') goReady() });
await pg.waitForFunction(() => window.__glb && __glb.H === H, null, { timeout: 30000 }); await sleep(1500);
await pg.evaluate(() => { P.W = [newW('slash')]; calc(); P.xp = 0; P.need = 1e9; yawT = yaw = yaw + 2.4; });
const betik = `
  K.w = (i < 200 || i > 290) ? 1 : 0; K.d = (i < 200 || i > 290) ? 1 : 0;
  K[' '] = (i >= 40 && i < 44) || (i >= 52 && i < 55) ? 1 : 0;
  K.c = (i >= 110 && i < 135) ? 1 : 0;
  K.Shift = (i >= 160 && i < 163) ? 1 : 0;
  if (i == 220 || i == 250) { P.at = 0; P.atT = T; P.side = i == 250 ? 1 : 0; }
`;
await cek('alp_oyun', 330, [0, 0, 1280, 720], 1280, 720, betik);
await pg.evaluate(() => { K.w = K.d = 0 });
console.log('hata:', errs.length ? errs.slice(0, 5) : 'yok');
await br.close();
