// Ateş ve el efektleri yakın plan: kendiliğinden düşman doğması durdurulur, önüne ölümsüz düşmanlar konur (ganimet
// düşmez), yakın kamerayla seçilen silahların efekti zaman içinde dört karede çekilir. Eski ve yeni Alp yan yana.
// node tools/ates-yakin.mjs <url> <çıkış.png>
import { chromium } from 'playwright';
import fs from 'node:fs';
const [url, out] = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const br = await chromium.launch({ executablePath: process.env.CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const SIL = ['fire', 'dragon', 'aura', 'korizi', 'slash', 'hero', 'orbit', 'zap'];
const errs = [], kare = {};
for (const [ad, q] of [['ESKİ', '?eski'], ['YENİ', '']]) {
  const pg = await br.newPage({ viewport: { width: 1280, height: 720 } });
  pg.on('pageerror', e => errs.push(e.message));
  await pg.addInitScript(() => {
    Element.prototype.requestPointerLock = function () {};
    localStorage.setItem('kk_set', JSON.stringify({ q: 1, bl: 0, cd: 6 })); localStorage.setItem('kk_tut', '1'); localStorage.setItem('kk_ci', '0');
    let s = 31; Math.random = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 };
  });
  await pg.goto(url + q, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await pg.waitForFunction(() => typeof S !== 'undefined' && S === 'menu', null, { timeout: 90000 });
  await pg.addStyleTag({ content: '#tip,#hud,#wls,.mb,#joy,#tt{display:none!important}' });
  await pg.evaluate(() => { start(); P.inv = 1e9 });
  await sleep(6000); await pg.evaluate(() => { if (S === 'ready') goReady() });
  if (!q) await pg.waitForFunction(() => window.__glb && __glb.H === H, null, { timeout: 30000 });
  await pg.evaluate(() => { setInterval(() => { spT = 1e9 }, 50); for (const e of E) e.hp = 0 });
  await sleep(1500);
  for (const k of SIL) {
    await pg.evaluate(k => {
      for (const e of E) e.hp = 0;
      P.W = [newW(k)]; calc(); P.xp = 0; P.need = 1e9; P.hp = P.mh;
      run('dogur gulyabani 3');
      const yon = H.g.rotation.y; let i = 0;
      for (const e of E) { if (e.hp <= 0) continue; e.hp = e.mh = 1e9; const a = yon + (i - 1) * .5; e.m.position.x = P.x + Math.sin(a) * 4.5; e.m.position.z = P.z + Math.cos(a) * 4.5; i++; }
    }, k);
    for (let j = 0; j < 4; j++) {
      await sleep(j ? 260 : 900);
      const f = `${out}.${ad}_${k}_${j}.png`;
      await pg.screenshot({ path: f, clip: { x: 390, y: 150, width: 500, height: 450 } });
      (kare[k] = kare[k] || []).push([f, ad + ' ' + k + ' ' + j]);
    }
  }
  await pg.close();
}
const p2 = await br.newPage({ viewport: { width: 1600, height: 900 } });
const b64 = f => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');
const hucre = ([f, t]) => `<div style="position:relative"><img src="${b64(f)}" style="width:100%;display:block"><b style="position:absolute;left:4px;top:2px;color:#fff;font:bold 12px sans-serif;text-shadow:0 0 3px #000,0 0 3px #000">${t}</b></div>`;
for (let s = 0; s < SIL.length; s += 4) {
  const ks = SIL.slice(s, s + 4);
  // her satır: bir silahın eski 4 karesi + yeni 4 karesi
  await p2.setContent(`<body style="margin:0;background:#1b1b1b;display:grid;grid-template-columns:repeat(8,1fr);gap:3px;padding:3px">${ks.map(k => kare[k].map(hucre).join('')).join('')}</body>`);
  await p2.screenshot({ path: out.replace(/\.png$/, `_${s / 4 + 1}.png`), fullPage: true });
}
for (const v of Object.values(kare)) for (const [f] of v) fs.rmSync(f);
console.log('hata:', errs.length ? errs.slice(0, 5) : 'yok');
await br.close();
