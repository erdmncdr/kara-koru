// Meshy Alp gerçek oyun denetimi: gerçek tuşlarla yürü, koş, dön, zıpla, çift zıpla (takla), kay, atıl, saldırı sırasında
// koş; her anda kare çeker. Ayak kaymasını ölçer: yerdeki ayağın dünya konumu adım boyunca ne kadar kayıyor.
// Telefon (dikey) görünümünde de bir kare. node tools/meshy-oyun.mjs <url> <klasör>   (KI=1: Kam; kahramanın kayıt sırası. GPU=1: gerçek ekran kartı)
import { chromium } from 'playwright';
import fs from 'node:fs';
const [url, out] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const br = await chromium.launch({ executablePath: process.env.CHROME, headless: true, args: process.env.GPU ? ['--use-angle=metal', '--ignore-gpu-blocklist'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const errs = [];
const init = ci => {
  Element.prototype.requestPointerLock = function () {};
  localStorage.setItem('kk_set', JSON.stringify({ q: 1, bl: 0 })); localStorage.setItem('kk_tut', '1'); localStorage.setItem('kk_ci', ci);
  let s = 4242; Math.random = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 };
};
async function oyun(opts) {
  const pg = await br.newPage(opts);
  pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (/Meshy/.test(m.text())) errs.push(m.text()); });
  await pg.addInitScript(init, process.env.KI || '0');
  await pg.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await pg.waitForFunction(() => typeof S !== 'undefined' && S === 'menu', null, { timeout: 90000 });
  await pg.addStyleTag({ content: '#tip{display:none!important}' });
  await pg.evaluate(() => { start(); P.inv = 1e9 });
  await sleep(6000); await pg.evaluate(() => { if (S === 'ready') goReady() });
  await pg.waitForFunction(() => window.__glb && __glb.H === H, null, { timeout: 30000 }); await sleep(1500);
  return pg;
}
const pg = await oyun({ viewport: { width: 1280, height: 720 } });
const W = 1280, H = 720, kirp = { x: 390, y: 170, width: 500, height: 450 };
const kare = async ad => pg.screenshot({ path: `${out}/${ad}.png`, clip: kirp });
// ayak kayması: oyunu saatten bağımsız 1/60 sn adımlarla yürütür (upd, animH, glbTick); her adımda destek ayağının
// dünya konumunun yatay kayması toplanır ve gövdenin aldığı yola bölünür. 0'a yakın: ayak yere basıyor; 1: buz pateni.
const olc = async (sn, ust = 99) => pg.evaluate(async ([sn, ust]) => {
  const G = window.__glb, L = G.root.getObjectByName('LeftFoot'), R = G.root.getObjectByName('RightFoot');
  const p = o => { o.updateWorldMatrix(true, false); const e = o.matrixWorld.elements; return { x: e[12], y: e[13], z: e[14] }; };
  const dt = 1 / 60, N = Math.round(sn / dt), iz = [];
  for (let i = 0; i < N; i++) {
    upd(dt); { const m = Math.hypot(P.vx, P.vz); if (m > ust) P.vx *= ust / m, P.vz *= ust / m; } animH(dt); G.tick(dt);
    iz.push({ l: p(L), r: p(R), v: Math.hypot(P.vx, P.vz), air: P.air, zy: P.y - 1 });
  }
  // yere değen ayak: zemine göre yüksekliği o ayağın en alçak değerine çok yakın olan kareler
  let kay = 0, yol = 0, n = 0, hiz = 0;
  const minL = Math.min(...iz.map(o => o.l.y - o.zy)), minR = Math.min(...iz.map(o => o.r.y - o.zy)), esik = G.h0 * .025;
  for (let i = 1; i < iz.length; i++) {
    const a = iz[i - 1], b = iz[i]; hiz += b.v / N; yol += b.v * dt;
    if (a.air || b.air) continue;
    for (const [k, mn] of [['l', minL], ['r', minR]]) if (a[k].y - a.zy < mn + esik && b[k].y - b.zy < mn + esik) { kay += Math.hypot(b[k].x - a[k].x, b[k].z - a[k].z) * dt / dt; n++; }
  }
  const temas = n * dt; // ayakların yerde geçirdiği toplam süre
  const yerYol = iz.slice(1).reduce((t, o) => t + o.v * dt, 0) * (n / Math.max(1, iz.length - 1)) / 2;
  // oran: yerdeki ayağın kayma hızı / gövde hızı (0 iyi, 1 buz pateni)
  return { yerdeKare: n, ayakKaymaHizi: +(kay / Math.max(dt, temas)).toFixed(2), govdeHizi: +hiz.toFixed(1), oran: +(kay / Math.max(dt, temas) / Math.max(.1, hiz)).toFixed(3) };
}, [sn, ust]);
const sonuc = {};
await pg.evaluate(() => { K.w = 1 }); await sleep(1500);
sonuc.kos = await olc(2); await kare('1_kos');
await pg.evaluate(() => { K.d = 1 }); await sleep(500); await kare('2_kos_don'); await pg.evaluate(() => { K.d = 0 });
await pg.evaluate(() => { P.at = 0; P.atT = T; P.side = 0 }); await sleep(150); await kare('3_kosarken_saldiri');
await pg.evaluate(() => { K[' '] = 1 }); await sleep(250); await kare('4_zipla'); await pg.evaluate(() => { K[' '] = 0 }); await sleep(80);
await pg.evaluate(() => { K[' '] = 1 }); await sleep(180); await kare('5_cift_zipla_takla'); await pg.evaluate(() => { K[' '] = 0 }); await sleep(1200);
await pg.evaluate(() => { K.c = 1 }); await sleep(380); await kare('6_kay'); await pg.evaluate(() => { K.c = 0 }); await sleep(600);
await pg.evaluate(() => { K.Shift = 1; setTimeout(() => K.Shift = 0, 100) }); await sleep(110); await kare('7_atil'); await sleep(800);
await pg.evaluate(() => { K.w = 0 }); await sleep(1500); await kare('8_savas_durus');
// yavaş yürüme: hızı düşür
await pg.evaluate(() => { window.__yv = setInterval(() => { const m = Math.hypot(P.vx, P.vz); if (m > 3.2) { P.vx *= 3.2 / m; P.vz *= 3.2 / m; } }, 4); K.w = 1 }); await sleep(1200);
sonuc.yuru = await olc(2, 3.2); await kare('9_yuru');
await pg.evaluate(() => { clearInterval(window.__yv); K.w = 0 });
sonuc.kareHizi = await pg.evaluate(async () => { await new Promise(r => setTimeout(r, 5200)); return PERF.lastFps && +PERF.lastFps.toFixed(1); });
await pg.close();
// telefon dikey
const tp = await oyun({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await tp.evaluate(() => { K.w = 1 }); await sleep(1200); await tp.screenshot({ path: `${out}/10_telefon.png` });
await tp.close();
// birleştir
const p2 = await br.newPage({ viewport: { width: 1520, height: 900 } });
const b64 = f => 'data:image/png;base64,' + fs.readFileSync(`${out}/${f}`).toString('base64');
const ks = fs.readdirSync(out).filter(f => /^\d_/.test(f)).sort();
await p2.setContent(`<body style="margin:0;background:#1b1b1b;display:flex;gap:4px;padding:4px"><div style="display:grid;grid-template-columns:repeat(3,370px);gap:4px">${ks.map(f => `<div style="position:relative"><img src="${b64(f)}" style="width:370px;display:block"><b style="position:absolute;left:5px;top:3px;color:#fff;font:bold 14px sans-serif;text-shadow:0 0 3px #000,0 0 3px #000">${f.replace('.png', '')}</b></div>`).join('')}</div><img src="${b64('10_telefon.png')}" style="height:890px"></body>`);
await p2.screenshot({ path: `${out}/oyun.png`, fullPage: true });
console.log(JSON.stringify(sonuc), 'hata:', errs.length ? errs.slice(0, 5) : 'yok');
await br.close();
