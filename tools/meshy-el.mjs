// Meshy Alp el denetimi: seçim ekranında modeli dört yönden, bekleme ve hareket anlarında çeker; kalkan ve kılıç elinin yakın planı.
// node tools/meshy-el.mjs <url> <çıkış.png>   (CHROME ortam değişkeni Chrome yolunu verir)
// HERO=kam: başka bir Meshy kahramanı (daha geniş kare; saldırı anları kahramanın saldırı aralığının ortasından). GPU=1: gerçek ekran kartı.
import { chromium } from 'playwright';
import fs from 'node:fs';
const [url, out] = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const HERO = process.env.HERO || 'alp', GENIS = HERO != 'alp';
const br = await chromium.launch({ executablePath: process.env.CHROME, headless: true, args: process.env.GPU ? ['--use-angle=metal', '--ignore-gpu-blocklist'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await br.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: +process.env.OLCEK || 1 }); // OLCEK=2: yakın inceleme için iki kat çözünürlük
const errs = []; pg.on('pageerror', e => errs.push(e.message));
await pg.addInitScript(() => {
  Element.prototype.requestPointerLock = function () {};
  localStorage.setItem('kk_set', JSON.stringify({ q: 1, bl: 0 })); localStorage.setItem('kk_tut', '1'); localStorage.setItem('kk_ci', '0');
});
await pg.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
await pg.waitForFunction(() => typeof S !== 'undefined' && S === 'menu', null, { timeout: 90000 });
await pg.addStyleTag({ content: '#ov,#tip{display:none!important}' });
await pg.evaluate(([h, sk]) => { const i = CR.findIndex(c => c.k == h); if (sk) { META.skin[i + ':' + sk] = 1; META.skin['cur' + i] = sk; } menuPage('kahraman'); selC(i ? 0 : 1, 1); selC(i, 1); }, [HERO, process.env.SKIN || '']); // SKIN=ayaz: kostümle
await pg.waitForFunction(h => window.__glb && window.__glb.H === H && CR[CI].k == h, HERO, { timeout: 60000 }); await sleep(1500);
const ANLAR = [['bekle', 'idle', 1.2], ['savas', 'combat', .6], ['sag_savurus', 'atkR', .55], ['sol_savurus', 'atkL', .75], ['yuru', 'walk', .3], ['kos', 'run', .15], ['zipla', 'jump', .8], ['takla', 'flip', 1.6], ['atil', 'dash', .45], ['kay', 'slide', .3], ['darbe', 'hit', .5]];
const YON = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
const kareler = [];
for (const [ad, k, t] of ANLAR) for (const y of YON) {
  await pg.evaluate(([k, t, y]) => {
    const G = window.__glb; G.dondur = 1;
    for (const a of Object.values(G.A)) a.setEffectiveWeight(0);
    const tum = ['atkR', 'atkL', 'hit'].includes(k);
    // üst gövde kliplerinde bacaklar bekleme duruşunda
    if (tum) { G.A.combat.setEffectiveWeight(1); G.A.combat.time = .6; }
    if (tum && k != 'hit' && G.sal && G.sal[k]) t = (G.sal[k][0] + G.sal[k][1]) / 2;
    G.A[k].setEffectiveWeight(1); G.A[k].time = t; if (G.A[k + '_u']) { G.A[k + '_u'].setEffectiveWeight(1); G.A[k + '_u'].time = t; }
    for (const a of Object.values(G.A)) a.paused = false;
    H.g.rotation.y = y; H.g.updateMatrixWorld(true);
    G.mixer.update(0);
    // asayı tutan kol (glbhero.js asaTut) dondurulmuş duruşta da uygulansın
    if (G.asaTut) { G.w = { [k]: 1 }; G.wu = tum ? 1 : 0; G.ust = tum ? k : null; G.asaTut(); }
  }, [k, t, y]);
  await sleep(450);
  const f = out.replace(/\.png$/, `_${ad}_${YON.indexOf(y)}.png`);
  await pg.screenshot({ path: f, clip: GENIS ? { x: 640, y: 90, width: 560, height: 620 } : { x: 740, y: 220, width: 360, height: 400 } });
  kareler.push([f, ad + ' · ' + ['ön', 'sağ', 'arka', 'sol'][YON.indexOf(y)]]);
}
const p2 = await br.newPage({ viewport: { width: 1460, height: 1300 } });
const b64 = f => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');
await p2.setContent(`<body style="margin:0;background:#1b1b1b;display:grid;grid-template-columns:repeat(8,1fr);gap:4px;padding:4px">${kareler.map(([f, t]) => `<div style="position:relative"><img src="${b64(f)}" style="width:100%;display:block"><b style="position:absolute;left:4px;top:2px;color:#fff;font:bold 12px sans-serif;text-shadow:0 0 3px #000">${t}</b></div>`).join('')}</body>`);
await p2.screenshot({ path: out, fullPage: true });
if (!process.env.KEEP) for (const [f] of kareler) fs.rmSync(f);
console.log('hata:', errs.length ? errs : 'yok');
await br.close();
