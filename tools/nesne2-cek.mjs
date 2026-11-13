// Tripo modelli dünya nesnelerini oyunda yakından çeker (tools/nesne-cek.mjs'in devamı): sunak türleri oyuncunun yakınına kurulur,
// kristal ve çömlek haritadan bulunur; sonra Mezarlık'a geçilir: kabak, mahzen, mezar taşı, İskelet Kralı heykeli.
// node tools/nesne2-cek.mjs <url> <klasör>   (CHROME; test derlemesi VITE_KOPRU=1)
import { chromium } from 'playwright';
import fs from 'node:fs';
const [url, out] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const br = await chromium.launch({ executablePath: process.env.CHROME, headless: true, args: ['--use-angle=metal', '--ignore-gpu-blocklist'] });
const pg = await br.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (/yüklenemedi/.test(m.text())) errs.push(m.text()); });
await pg.addInitScript(() => { Element.prototype.requestPointerLock = function () {}; localStorage.setItem('kk_tut', '1'); localStorage.setItem('kk_set', JSON.stringify({ q: 2, bl: 1 })); });
await pg.goto(url, { waitUntil: 'domcontentloaded' });
await pg.waitForFunction(() => typeof S !== 'undefined' && S === 'menu' && !!window.MSEL, null, { timeout: 90000 });
await pg.evaluate(() => { start(); P.inv = 1e9; P.need = 1e12; });
await sleep(3500);
await pg.addStyleTag({ content: '#hud,#tip,#tt,.wl,#ov{display:none!important}' });
const SUNAK = process.env.YENI ? { supheli: 12, denge: 13, hediye: 14, muz: 15, maske: 18, yilan: 19 } : { ruzgar: 2, kansunak: 3, acgozluluk: 4, karasunak: 6, haydut: 7, meydan: 8, mezartasi: 9, tabut: 10, kafes: 11, yumurta: 16, iskeletkral: 17 }; // YENI=1: 13 Kasım 2026'da eklenen altı sunak
const KORU = !process.env.MEZAR;
async function cek(hedef, D) {
  for (const [ad, h] of Object.entries(hedef)) {
    if (!h) { console.log(ad, 'yok'); continue; }
    await pg.evaluate(([h, d]) => { P.xp = 0; P.need = 1e12; P.inv = 1e9; S = 'play'; for (const e of E) e.m.position.x += 400; P.x = h.x + 2.2; P.z = h.z - d; P.y = HT(P.x, P.z) + 1; P.vx = P.vz = 0; yaw = 0; pit = .25; }, [h, D[ad] || 7]);
    await sleep(900);
    await pg.screenshot({ path: `${out}/${ad}.png` });
  }
}
// 1) Koru: sunaklar oyuncunun çevresine kurulur
const h1 = await pg.evaluate(SUNAK => {
  const r = {}; let i = 0;
  for (const [ad, t] of Object.entries(SUNAK)) { const a = i++ / Object.keys(SUNAK).length * 6.283, x = P.x + Math.cos(a) * 60, z = P.z + Math.sin(a) * 60; SHH.push([x, z]); mkSh(t); r[ad] = { x, z }; }
  const cr = BRK.find(b => b.ty == 'cr'), pot = POT.find(p => !p.big && !p.sv), ore = BRK.find(b => b.ty == 'ore');
  r.kristal = cr && { x: cr.m.position.x, z: cr.m.position.z }; r.comlek = pot && { x: pot.m.position.x, z: pot.m.position.z }; r.cevher = ore && { x: ore.m.position.x, z: ore.m.position.z };
  return r;
}, SUNAK);
await sleep(3000);
if (KORU) await cek(h1, { kristal: 8, comlek: 8, mezartasi: 7 });
console.log(JSON.stringify(await pg.evaluate(() => ({ sunak: SH.filter(s => s.m.children.some(c => c.userData.glbprop)).length + '/' + SH.length, kristal: BRK.find(b => b.ty == 'cr').im.geometry.attributes.position.count }))));
// 2) Mezarlık
const h2 = await pg.evaluate(() => { P.map = 'mezarlik'; setupStage(); S = 'play'; P.inv = 1e9; return BI; });
await sleep(1500);
await pg.evaluate(() => { if (P.mz) P.mz.kills = 999; }); // mühür kırılsın: oyuncu çemberin dışına çıkabilsin
await sleep(3000);
const h3 = await pg.evaluate(() => {
  const kb = BRK.find(b => b.ty == 'kb'), kbb = BRK.find(b => b.ty == 'kbb'); let mz = null; const v = new __T.Vector3();
  sc.traverse(o => { if (!mz && o.userData.glbprop == 'mahzen') { new __T.Box3().setFromObject(o).getCenter(v); mz = { x: v.x, z: v.z }; } });
  const yer = o => o && { x: o.m.position.x, z: o.m.position.z };
  return { kabak: yer(kb), buyukkabak: yer(kbb), mahzen: mz, mezartasi2: yer(SH.find(s => s.t == 9)), iskeletkral2: yer(SH.find(s => s.t == 17)), tabut2: yer(SH.find(s => s.t == 10)), kabakN: kb ? kb.im.geometry.attributes.position.count : 0 };
});
console.log('diyar', h2, 'kabak köşe', h3.kabakN); delete h3.kabakN;
await cek(h3, { kabak: 8, buyukkabak: 8, mahzen: -4, mezartasi2: 7 });
console.log('hata:', errs.length ? errs : 'yok');
await br.close();
