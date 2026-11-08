// Arayüz ekran görüntüleri, ikinci set: sandık, tüccar, kazan, ocak, meydan okuma, boss, diyar geçişi, final,
// sıralama, yardım, klavye ve kumanda odağı, telefon HUD'u (dokunmatik).
// node tools/arayuz-goruntu2.mjs <url> <klasör>   (CHROME ortam değişkeni Chrome yolunu verir)
import { chromium } from 'playwright';
import fs from 'node:fs';
const [url, out] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const br = await chromium.launch({ executablePath: process.env.CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const init = () => {
  Element.prototype.requestPointerLock = function () {};
  localStorage.setItem('kk_set', JSON.stringify({ q: 1, bl: 0 })); localStorage.setItem('kk_tut', '1');
  let s = 4242; Math.random = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 };
};
const errs = [];
async function sayfa(opts) {
  const ctx = await br.newContext(opts); const pg = await ctx.newPage();
  await pg.addInitScript(init); pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 }); await pg.waitForFunction(() => typeof S !== 'undefined' && S === 'menu', null, { timeout: 90000 });
  await pg.addStyleTag({ content: '#tip{display:none!important}' });
  return pg;
}
const pg = await sayfa({ viewport: { width: 1280, height: 720 } });
const shot = async (p, n, w = 700) => { await sleep(w); await p.screenshot({ path: `${out}/${n}.png` }); };
// klavye odağı: ana menüde aşağı ok
await sleep(2500); await pg.keyboard.press('Tab'); await pg.keyboard.press('Tab'); await shot(pg, '20_klavye_odak');
// kumanda odağı: .pad sınıfı ve programla odak
await pg.evaluate(() => { document.body.classList.add('pad'); document.querySelectorAll('#ov button')[0].focus() }); await shot(pg, '21_kumanda_odak');
await pg.evaluate(() => { document.body.classList.remove('pad'); start(); P.inv = 1e9 });
await sleep(7000); await pg.evaluate(() => { if (S === 'ready') goReady() }); await sleep(3000);
await pg.evaluate(() => { P.gold = 1e5; P.xp = 0; P.need = 1e9; openChest(CH.find(c => !c.free) || CH[0]) }); await shot(pg, '22_sandik_acilis', 400); await shot(pg, '23_sandik_sonuc', 2500);
await pg.evaluate(() => { back(); openShop(NP.find(n => n.t == 'shop')) }); await shot(pg, '24_tuccar');
await pg.evaluate(() => { back(); openKazan(NP.find(n => n.t == 'kazan')) }); await shot(pg, '25_kazan');
await pg.evaluate(() => { back(); const s = SH.find(s => !s.d && s.t < 11); if (s) useShrine(s) }); await shot(pg, '26_ocak', 1500);
await pg.evaluate(() => { back(); openChalShrine() }); await shot(pg, '27_meydan_okuma');
await pg.evaluate(() => { back(); showHelp() }); await shot(pg, '28_yardim');
await pg.evaluate(() => { closeHelp(); back(); toast('Boss Kapısı açıldı: Tepegöz uyanıyor'); summonBoss() }); await shot(pg, '29_boss', 3500);
await pg.evaluate(() => { GATE.st = 2; nextStage() }); await shot(pg, '30_gecis', 1200);
await sleep(5000); await shot(pg, '31_hazir', 0);
await pg.evaluate(() => { if (S === 'ready') goReady(); else { back(); S = 'play' } P.inv = 1e9 }); await shot(pg, '32_bozkir', 4000);
await pg.evaluate(() => { GATE.st = 2; nextStage() }); await sleep(6500); await shot(pg, '33_final_hazir', 0);
await pg.evaluate(() => { if (S === 'ready') goReady(); else { back(); S = 'play' } P.inv = 1e9 }); await shot(pg, '34_mahzen', 4000);
await pg.evaluate(() => { pause(); }); await sleep(300); await pg.evaluate(() => { resume(); lbOpen() }); await shot(pg, '35_siralama', 1500);
// telefon: dokunmatik bağlam
const tel = await sayfa({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
await sleep(2000); await shot(tel, '36_tel_menu');
await tel.evaluate(() => { start(); P.inv = 1e9 }); await sleep(7000); await tel.evaluate(() => { if (S === 'ready') goReady() }); await sleep(3000);
await tel.evaluate(() => { for (let i = 0; i < 4; i++) { choose('level', luOpts()); chPick(i % 3) } for (const k of ['kimiz', 'nazar', 'kalp']) addItem(k); P.xp = 0; P.need = 1e9; back() }); await shot(tel, '37_tel_oyun');
await tel.evaluate(() => choose('level', luOpts())); await shot(tel, '38_tel_seviye');
await tel.evaluate(() => { back(); pause() }); await shot(tel, '39_tel_duraklat');
const yatay = await sayfa({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
await yatay.evaluate(() => { start(); P.inv = 1e9 }); await sleep(7000); await yatay.evaluate(() => { if (S === 'ready') goReady() }); await sleep(3000);
await shot(yatay, '40_yatay_oyun'); await yatay.evaluate(() => choose('level', luOpts())); await shot(yatay, '41_yatay_seviye');
console.log('sayfa hatası:', errs.length ? [...new Set(errs)].slice(0, 6) : 'yok'); await br.close();
