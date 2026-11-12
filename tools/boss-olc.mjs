// Boss'un yürüyüşünde ve hücumunda ayak kaymasını ölçer: boss uzakta doğar, oyuncuya yürür; her karede iki ayağın dünya konumu
// okunur. Yere basan (alçaktaki) ayağın yatay hızı ideal durumda sıfırdır; oran = o hız / boss'un hızı (0 kaymıyor, 1 buz pateni).
// Ayrıca ayağın yerden yüksekliği (batma ya da havada kalma) ve oynatma hızı raporlanır.
// node tools/boss-olc.mjs <url> [harita=koru]   (CHROME; test derlemesi VITE_KOPRU=1; YURU=0.355 KOS=2.69: klip hızını dener)
import { chromium } from 'playwright';
const [url, harita = 'koru'] = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const br = await chromium.launch({ executablePath: process.env.CHROME, headless: true, args: ['--use-angle=metal', '--ignore-gpu-blocklist'] });
const pg = await br.newPage({ viewport: { width: 900, height: 600 } });
const errs = []; pg.on('pageerror', e => errs.push(e.message));
await pg.addInitScript(() => { Element.prototype.requestPointerLock = function () {}; localStorage.setItem('kk_tut', '1'); localStorage.setItem('kk_set', JSON.stringify({ q: 0, bl: 0 })); });
await pg.goto(url, { waitUntil: 'domcontentloaded' });
await pg.waitForFunction(() => typeof S !== 'undefined' && S === 'menu' && !!window.MSEL, null, { timeout: 90000 });
await pg.evaluate(() => { start(); P.inv = 1e9; });
await sleep(2000);
await pg.evaluate(h => { for (const e of E) if (!e.boss) e.hp = 0; const fx = -Math.sin(yaw), fz = -Math.cos(yaw), pr = BOSSP[h][0]; spawn(3, { x: P.x + fx * 60, z: P.z + fz * 60, boss: 1, kind: pr.k, bp: pr }); window.__b = E[E.length - 1]; window.__b.st2 = 999; window.__b.sh = 999; }, harita);
await pg.waitForFunction(() => window.__b.u.glb && !window.__b.u.glb.bekliyor, null, { timeout: 60000 });
if (process.env.YURU) await pg.evaluate(v => { window.__bossAN.yuru.hiz = v; }, +process.env.YURU);
if (process.env.KOS) await pg.evaluate(v => { window.__bossAN.kos.hiz = v; }, +process.env.KOS);
await sleep(3200); // kükreme bitsin
const olc = (sn, ad) => pg.evaluate(async ([sn, ad]) => {
  const b = window.__b, G = b.u.glb, T = window.__T3, L = G.root.getObjectByName('LeftFoot'), R = G.root.getObjectByName('RightFoot'), v = new T.Vector3();
  const al = () => { G.root.updateMatrixWorld(true); const l = L.getWorldPosition(v).clone(), r = R.getWorldPosition(v).clone(); return { l, r, bx: b.m.position.x, bz: b.m.position.z, by: b.fy, t: performance.now() / 1000 }; };
  let o = al(), kay = 0, yol = 0, n = 0, enAlt = 9, enUst = -9; const t0 = o.t;
  while (o.t - t0 < sn) {
    await new Promise(r => requestAnimationFrame(r));
    const y = al(), dt = y.t - o.t; if (dt <= 0) continue;
    // yerdeki ayak: iki karede de daha alçakta olan
    const sol = o.l.y < o.r.y && y.l.y < y.r.y, sag = o.r.y < o.l.y && y.r.y < y.l.y, a0 = sol ? o.l : sag ? o.r : null, a1 = sol ? y.l : sag ? y.r : null;
    if (a0) { kay += Math.hypot(a1.x - a0.x, a1.z - a0.z); yol += Math.hypot(y.bx - o.bx, y.bz - o.bz); n++; const h = a1.y - y.by; enAlt = Math.min(enAlt, h); enUst = Math.max(enUst, h); }
    o = y;
  }
  return { ad, kare: n, bossHizi: +(yol / sn).toFixed(2), oran: +(kay / Math.max(1e-6, yol)).toFixed(3), ayakYerden: [+enAlt.toFixed(2), +enUst.toFixed(2)], oynatma: +G.A[ad == 'hücum' ? 'kos' : 'yuru'].timeScale.toFixed(2), boy: +(G.h * b.ba).toFixed(1) };
}, [sn, ad]);
console.log(JSON.stringify(await olc(4, 'yürüyüş')));
// hücum: hücum eden kademe (Ulu Tepegöz) doğar, sayacı sıfırlanır; boss gerçekten hızlanınca ölçülür
if (!process.env.YALNIZ_YURU) {
  await pg.evaluate(() => { hurtE(window.__b, 1e12, 1); });
  for (let i = 0; i < 14; i++) { await pg.evaluate(() => { if (S == 'choice') chPick(0); }); await sleep(400); }
  await pg.evaluate(() => { const fx = -Math.sin(yaw), fz = -Math.cos(yaw), pr = BOSSP.koru[1]; spawn(3, { x: P.x + fx * 38, z: P.z + fz * 38, boss: 1, kind: pr.k, bp: pr }); window.__b = E[E.length - 1]; window.__b.st2 = 999; window.__b.sh = 999; });
  await pg.waitForFunction(() => window.__b.u.glb && !window.__b.u.glb.bekliyor, null, { timeout: 60000 });
  await sleep(3000);
  await pg.evaluate(() => { const b = window.__b; b.bt = b.bt || {}; b.bt.ch = 0; });
  await pg.waitForFunction(() => window.__b.spm > 1.5, null, { timeout: 15000 }).catch(() => errs.push('hücum başlamadı'));
  console.log(JSON.stringify(await olc(.9, 'hücum')));
}
console.log('hata:', errs.length ? [...new Set(errs)].join(' ; ').slice(0, 300) : 'yok');
await br.close();
