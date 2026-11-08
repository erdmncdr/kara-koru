// El yakın planı: Meshy Alp'in duruşunu dondurur, ayrı bir kamerayla sağ ele (kılıç) ve sol ele (kalkan) çok yakından,
// altı açıdan bakar; birkaç duruşta tekrarlar. Oyunun kendi kamerasına dokunmaz (sahne ayrı kamerayla çizilip okunur).
// node tools/el-yakin.mjs <url> <çıkış.png> [el: sag|sol]
import { chromium } from 'playwright';
import fs from 'node:fs';
const [url, out, el = 'sag'] = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const br = await chromium.launch({ executablePath: process.env.CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await br.newPage({ viewport: { width: 900, height: 700 } });
const errs = []; pg.on('pageerror', e => errs.push(e.message));
await pg.addInitScript(() => {
  Element.prototype.requestPointerLock = function () {};
  localStorage.setItem('kk_set', JSON.stringify({ q: 1, bl: 0 })); localStorage.setItem('kk_tut', '1'); localStorage.setItem('kk_ci', '0');
});
await pg.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
await pg.waitForFunction(() => typeof S !== 'undefined' && S === 'menu', null, { timeout: 90000 });
await pg.waitForFunction(() => window.__glb, null, { timeout: 60000 }); await sleep(1500);
const DURUS = [['savas', 'combat', .6], ['bekle', 'idle', 1.2], ['kos', 'run', .15], ['sag_savurus', 'slashR', .55]];
const resimler = await pg.evaluate(async ([DURUS, el, uzak]) => {
  const G = window.__glb, T = cam.constructor, V = cam.position.constructor;
  G.dondur = 1;
  const kemik = G.root.getObjectByName(el == 'sag' ? 'RightHand' : 'LeftHand');
  const kol = G.root.getObjectByName(el == 'sag' ? 'RightForeArm' : 'LeftForeArm');
  const c2 = new T(28, 1, .01, 100), out = [];
  const cv = document.querySelector('canvas'), W = cv.width, H2 = cv.height;
  for (const [ad, k, t] of DURUS) {
    for (const a of Object.values(G.A)) a.setEffectiveWeight(0);
    const ust = ['slashR', 'slashL', 'hit'].includes(k);
    if (ust) { G.A.combat.setEffectiveWeight(1); G.A.combat.time = .6; }
    G.A[k].setEffectiveWeight(1); G.A[k].time = t; if (G.A[k + '_u']) { G.A[k + '_u'].setEffectiveWeight(1); G.A[k + '_u'].time = t; }
    G.mixer.update(0); H.g.updateMatrixWorld(true);
    const p = kemik.getWorldPosition(new V()), q = kol.getWorldPosition(new V()), ek = p.clone().sub(q).normalize();
    const mrk = p.clone().addScaledVector(ek, G.h0 * .03);
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3, r = G.h0 * uzak;
      c2.position.set(mrk.x + Math.sin(a) * r, mrk.y + (i % 2 ? .25 : -.1) * r, mrk.z + Math.cos(a) * r);
      c2.aspect = W / H2; c2.updateProjectionMatrix(); c2.lookAt(mrk);
      R.render(sc, c2);
      out.push([ad + ' · ' + (i * 60) + '°', cv.toDataURL('image/jpeg', .85)]);
    }
  }
  G.dondur = 0;
  return out;
}, [DURUS, el, +(process.env.UZAK || .33)]);
const p2 = await br.newPage({ viewport: { width: 1500, height: 900 } });
await p2.setContent(`<body style="margin:0;background:#111;display:grid;grid-template-columns:repeat(6,1fr);gap:3px;padding:3px">${resimler.map(([t, u]) => `<div style="position:relative;overflow:hidden;aspect-ratio:1"><img src="${u}" style="position:absolute;left:50%;top:50%;height:${process.env.UZAK ? 100 : 150}%;transform:translate(-50%,-50%)"><b style="position:absolute;left:4px;top:2px;color:#fff;font:bold 12px sans-serif;text-shadow:0 0 3px #000,0 0 3px #000">${t}</b></div>`).join('')}</body>`);
await p2.screenshot({ path: out, fullPage: true });
console.log('hata:', errs.length ? errs : 'yok');
await br.close();
