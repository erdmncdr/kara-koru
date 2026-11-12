// Dünya nesnelerini oyunda yakından çeker: oyuncu sırayla sandığın, altın sandığın, Ocak'ın, Balbal'ın, Boss Kapısı'nın ve cadı
// kazanının yanına götürülür, kamera nesneye çevrilir. node tools/nesne-cek.mjs <url> <klasör> [uzaklık çarpanı=1]
// (CHROME; test derlemesi VITE_KOPRU=1). Her nesne için iki açı: önden ve çaprazdan.
import { chromium } from 'playwright';
import fs from 'node:fs';
const [url, out, uz = '1'] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const br = await chromium.launch({ executablePath: process.env.CHROME, headless: true, args: ['--use-angle=metal', '--ignore-gpu-blocklist'] });
const pg = await br.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (/Nesne modeli/.test(m.text())) errs.push(m.text()); });
await pg.addInitScript(() => { Element.prototype.requestPointerLock = function () {}; localStorage.setItem('kk_tut', '1'); localStorage.setItem('kk_set', JSON.stringify({ q: 2, bl: 1 })); });
await pg.goto(url, { waitUntil: 'domcontentloaded' });
await pg.waitForFunction(() => typeof S !== 'undefined' && S === 'menu' && !!window.MSEL, null, { timeout: 90000 });
await pg.evaluate(() => { start(); P.inv = 1e9; P.need = 1e12; });
await sleep(3000);
await pg.addStyleTag({ content: '#hud,#tip,#tt,.wl{display:none!important}' });
// altın sandık haritada olmayabilir: oyuncunun yakınına bir tane kurulur
const hedef = await pg.evaluate(() => {
  mkChest({ x: P.x + 30, z: P.z + 30, gold: 1 });
  const yer = o => o && { x: o.m ? o.m.position.x : o.x, z: o.m ? o.m.position.z : o.z, glb: !!(o.m || o.g || o).children && (o.m || o.g).children.some(c => c.userData.glbprop) };
  return { sandik: yer(CH.find(c => !c.gold)), altinsandik: yer(CH.find(c => c.gold)), ocak: yer(SH.find(s => s.t == 0)), balbal: yer(SH.find(s => s.t == 1)), kapi: GATE && { x: GATE.x, z: GATE.z, ry: GATE.ry }, kazan: yer(NP.find(n => n.t != 'shop')) };
});
// oyuncunun nesnenin arkasındaki uzaklığı (kamera oyuncunun ~13 birim gerisinde: nesne kameraya 13 - d kadar yakın)
const D = { sandik: 6, altinsandik: 6, ocak: 3, balbal: 2, kapi: -6, kazan: 4 };
for (const [ad, h] of Object.entries(hedef)) {
  if (!h) { console.log(ad, 'haritada yok'); continue; }
  for (const [i, aci] of [[0, 0], [1, .9]]) {
    await pg.evaluate(([h, d, aci]) => { const a = (h.ry || 0) + aci; P.xp = 0; P.need = 1e12; for (const e of E) { e.m.position.x += 400; } P.x = h.x - Math.sin(a) * d; P.z = h.z - Math.cos(a) * d; P.y = HT(P.x, P.z) + 1; P.vx = P.vz = 0; yaw = a; pit = .25; }, [h, D[ad] * +uz, aci]);
    for (let k = 0; k < 4; k++) { await pg.evaluate(() => { if (S == 'choice') chPick(0); else if (S != 'play') closeOv(); }); await sleep(250); }
    await sleep(500);
    await pg.screenshot({ path: `${out}/${ad}_${i}.png` });
  }
  console.log(ad, 'çekildi', JSON.stringify(h));
}
console.log('model takılı:', JSON.stringify(await pg.evaluate(() => { const v = g => !!g && g.children.some(c => c.userData.glbprop); return { sandik: CH.filter(c => v(c.m)).length + '/' + CH.length, sunak: SH.filter(s => v(s.m)).length + '/' + SH.filter(s => s.t == 0 || s.t == 1 || s.t == 5).length, kapi: v(GATE && GATE.g || GATE && GATE.m), kazan: NP.filter(n => v(n.m)).length }; })), 'hata:', errs.length ? [...new Set(errs)].join(' ; ').slice(0, 300) : 'yok');
await br.close();
