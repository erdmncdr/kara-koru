// Efekt denetimi: Alp'e her silahı tek başına verir, etrafa düşman doğurur ve silahın efektini çeker; ardından oyuncu
// durum efektlerini (darbe, kalkan, öfke, hız, yavaşlama, seviye, iyileşme) çeker. Hepsini karşılaştırma tablolarında birleştirir.
// node tools/efekt-denetim.mjs <url> <klasör> [?eski]   (CHROME ortam değişkeni Chrome yolunu verir)
import { chromium } from 'playwright';
import fs from 'node:fs';
const [url, out, q = ''] = process.argv.slice(2);
const on = q ? 'eski_' : ''; fs.mkdirSync(out, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const br = await chromium.launch({ executablePath: process.env.CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await br.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; pg.on('pageerror', e => errs.push(e.message));
await pg.addInitScript(() => {
  Element.prototype.requestPointerLock = function () {};
  localStorage.setItem('kk_set', JSON.stringify({ q: 1, bl: 0, cd: 8 })); localStorage.setItem('kk_tut', '1'); localStorage.setItem('kk_ci', '0');
  let s = 777; Math.random = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 };
});
await pg.goto(url + q, { waitUntil: 'domcontentloaded', timeout: 90000 });
await pg.waitForFunction(() => typeof S !== 'undefined' && S === 'menu', null, { timeout: 90000 });
await pg.addStyleTag({ content: '#tip,#hud,#wls,.mb,#joy{display:none!important}' });
await pg.evaluate(() => { start(); P.inv = 1e9 });
await sleep(6000); await pg.evaluate(() => { if (S === 'ready') goReady() });
if (!q) await pg.waitForFunction(() => window.__glb && __glb.H === H, null, { timeout: 30000 });
await sleep(1500);
const kirp = { x: 340, y: 150, width: 600, height: 470 };
const silahlar = await pg.evaluate(() => Object.keys(WD).map(k => [k, WD[k].n]));
const kare = [];
for (const [k, n] of silahlar) {
  // önce temizle, sonra yeni silah ve önüne yakın 8 düşman
  await pg.evaluate(() => { for (const e of E) e.hp = 0; P.W = []; calc() });
  await sleep(700);
  await pg.evaluate(k => {
    P.W = [newW(k)]; calc(); P.xp = 0; P.need = 1e9; P.hp = P.mh;
    const ks = Object.keys(KINDS).filter(x => KINDS[x].t == 0).slice(0, 1);
    run('dogur ' + ks[0] + ' 4');
    // ölümsüz: ganimet düşüp kareyi kaplamasın
    for (const e of E) if (!e.dead && e.hp > 0) e.hp = e.mh = 1e9;
    const yon = H.g.rotation.y; let i = 0;
    for (const e of E) { if (e.dead || e.hp <= 0) continue; const a = yon + (i - 1.5) * .45, r = 5 + (i % 2) * 2; e.m.position.x = P.x + Math.sin(a) * r; e.m.position.z = P.z + Math.cos(a) * r; i++; }
  }, k);
  await sleep(1400);
  const f = `${out}/${on}s_${k}.png`; await pg.screenshot({ path: f, clip: kirp }); kare.push([f, n + ' (' + k + ')']);
}
// oyuncu durumları
const DUR = [
  ['darbe', () => { P.hit = .3 }], ['kalkan', () => { P.shd = P.mh * .5; P.shieldT = 3 }], ['ofke', () => { P.rage = 5 }],
  ['hiz', () => { P.puSpd = 5 }], ['yavas', () => { P.slowT = 3 }], ['seviye', () => { P.xp = P.need = 1; }], ['iyilesme', () => { P.hp = P.mh * .5; addItem('kimiz') }]
];
await pg.evaluate(() => { P.W = []; calc(); for (const e of E) e.hp = 0 });
await sleep(800);
for (const [ad, f] of DUR) {
  await pg.evaluate(`(${f.toString()})()`);
  await sleep(ad == 'darbe' ? 120 : 600);
  const p = `${out}/${on}d_${ad}.png`; await pg.screenshot({ path: p, clip: kirp }); kare.push([p, 'durum: ' + ad]);
  await pg.evaluate(() => { if (S == 'level') back(); P.hit = 0; P.rage = 0; P.puSpd = 0; P.slowT = 0; P.shieldT = 0 });
  await sleep(500);
}
const p2 = await br.newPage({ viewport: { width: 1500, height: 900 } });
const b64 = f => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');
for (let s = 0; s * 20 < kare.length; s++) {
  await p2.setContent(`<body style="margin:0;background:#1b1b1b;display:grid;grid-template-columns:repeat(5,1fr);gap:4px;padding:4px">${kare.slice(s * 20, s * 20 + 20).map(([f, t]) => `<div style="position:relative"><img src="${b64(f)}" style="width:100%;display:block"><b style="position:absolute;left:4px;top:2px;color:#fff;font:bold 13px sans-serif;text-shadow:0 0 3px #000,0 0 3px #000">${t}</b></div>`).join('')}</body>`);
  await p2.screenshot({ path: `${out}/${on}tablo_${s + 1}.png`, fullPage: true });
}
console.log('silah:', silahlar.length, '· hata:', errs.length ? errs.slice(0, 6) : 'yok');
await br.close();
