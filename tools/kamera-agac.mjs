// Kamera ve ağaç denetimi: karakteri koru içindeki ağaçların arasında dolaştırır (her ağacın çevresinde dört yönden
// geçer), her karede kameranın bir ağaç tacının ya da gövdesinin içinde olup olmadığını ve karakterle kamera
// arasındaki görüşün ağaçla kesilip kesilmediğini sayar. Oyun elle ilerletilir (1/30 sn), sonuç gerçek zamandan bağımsız.
// node tools/kamera-agac.mjs <url> [görüntü klasörü]
import { chromium } from 'playwright';
import fs from 'node:fs';
const [url, out] = process.argv.slice(2);
if (out) fs.mkdirSync(out, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const br = await chromium.launch({ executablePath: process.env.CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await br.newPage({ viewport: { width: 960, height: 540 } });
const errs = []; pg.on('pageerror', e => errs.push(e.message));
await pg.addInitScript(() => {
  Element.prototype.requestPointerLock = function () {};
  localStorage.setItem('kk_set', JSON.stringify({ q: 1, bl: 0 })); localStorage.setItem('kk_tut', '1'); localStorage.setItem('kk_ci', '0');
  let s = 5; Math.random = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 };
  const gercek = window.requestAnimationFrame.bind(window), q = []; let t = 0;
  window.__serbest = true;
  window.requestAnimationFrame = cb => { q.push(cb); return q.length; };
  const bosalt = ts => { const c = q.splice(0); for (const f of c) f(ts); };
  const pompa = ts => { if (window.__serbest) { t = ts; bosalt(ts); } gercek(pompa); };
  gercek(pompa);
  window.__adim = () => { t += 1000 / 30; bosalt(t); };
});
await pg.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
await pg.waitForFunction(() => typeof S !== 'undefined' && S === 'menu', null, { timeout: 90000 });
await pg.evaluate(() => { start(); P.inv = 1e9 });
await sleep(6000); await pg.evaluate(() => { if (S === 'ready') goReady() }); await sleep(1500);
const sonuc = await pg.evaluate(() => {
  window.__serbest = false;
  for (const e of E) e.hp = 0;
  spT = 1e9;
  // taçlar (nm) ve gövdeler; karaktere en yakın 12 ağaç
  const taclar = OBS.filter(o => o.nm), govde = OBS.filter(o => !o.nm && o.r < 1.2 && o.t < 1e8);
  const yakin = taclar.slice().sort((a, b) => Math.hypot(a.x - P.x, a.z - P.z) - Math.hypot(b.x - P.x, b.z - P.z)).slice(0, 12);
  const icinde = (x, y, z) => taclar.concat(govde).some(o => y > o.b - .2 && y < o.t + .2 && (x - o.x) ** 2 + (z - o.z) ** 2 < (o.r + .2) ** 2);
  const govdeIc = (x, y, z) => govde.some(o => y > o.b - .2 && y < o.t + .2 && (x - o.x) ** 2 + (z - o.z) ** 2 < (o.r + .2) ** 2);
  let govdeKesik = 0; const resim = [];
  let kare = 0, ic = 0, kesik = 0, minMesafe = 1e9, ornek = [];
  for (const a of yakin) for (let y = 0; y < 4; y++) {
    // ağacın 4.5 birim yanına koy; kamera ağacın arkasında kalsın (ağaç kamera ile karakter arasında), karakter ağaçtan uzaklaşsın
    const ang = y * Math.PI / 2;
    P.x = a.x + Math.sin(ang) * 4.5; P.z = a.z + Math.cos(ang) * 4.5; P.vx = P.vz = 0; P.y = HT(P.x, P.z) + 1;
    FX = P.x; FZ = P.z; FY = P.y;
    yaw = yawT = ang + Math.PI; pit = pitT = .45;
    K.w = 1;
    for (let i = 0; i < 45; i++) {
      window.__adim(); kare++;
      const c = cam.position;
      const d = Math.hypot(c.x - P.x, c.z - P.z); minMesafe = Math.min(minMesafe, d);
      if (icinde(c.x, c.y, c.z)) { ic++; if (ornek.length < 3 && i == 8) ornek.push([a.x, a.z, ang]); }
      // görüş: kameradan karakterin başına
      const hx = P.x, hy = P.y + .8, hz = P.z; let blok = 0;
      for (let f = .1; f < .95; f += .05) if (icinde(c.x + (hx - c.x) * f, c.y + (hy - c.y) * f, c.z + (hz - c.z) * f)) { blok = 1; break; }
      kesik += blok;
      { let gb = 0; for (let f = .1; f < .95; f += .05) if (govdeIc(c.x + (hx - c.x) * f, c.y + (hy - c.y) * f, c.z + (hz - c.z) * f)) { gb = 1; break; } govdeKesik += gb; }
      if (i == 8 && resim.length < 8) resim.push(document.querySelector('canvas').toDataURL('image/jpeg', .8));
    }
    K.w = 0;
  }
  window.__serbest = true;
  return { kare, kameraTacIcinde: ic, gorusKesik: kesik, govdeKesik, minYatayMesafe: +minMesafe.toFixed(2), resim };
});
const { resim } = sonuc; delete sonuc.resim;
console.log(JSON.stringify(sonuc));
if (out) resim.forEach((u, i) => fs.writeFileSync(`${out}/agac_${i}.jpg`, Buffer.from(u.split(',')[1], 'base64')));
console.log('hata:', errs.length ? errs.slice(0, 3) : 'yok');
await br.close();
