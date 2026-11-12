// Gerçek koşuda boss dövüşü: oyuncu Boss Kapısı'na götürülür, boss kapıdan çağrılır (oyunun kendi summonBoss'u), oyuncu boss'un
// çevresinde koşturulur; 1,5 saniyede bir kare alınır, boss'un durumu ve hatalar yazılır. Sonra boss öldürülür ve geçidin açıldığı
// denetlenir. node tools/boss-dovus.mjs <url> <klasör> [süre sn=18]   (CHROME; test derlemesi VITE_KOPRU=1)
import { chromium } from 'playwright';
import fs from 'node:fs';
const [url, out, sure = '18'] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const br = await chromium.launch({ executablePath: process.env.CHROME, headless: true, args: ['--use-angle=metal', '--ignore-gpu-blocklist'] });
const pg = await br.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (/Boss modeli/.test(m.text())) errs.push(m.text()); });
await pg.addInitScript(() => { Element.prototype.requestPointerLock = function () {}; localStorage.setItem('kk_tut', '1'); localStorage.setItem('kk_set', JSON.stringify({ q: 2, bl: 1, al: 1 })); });
await pg.goto(url, { waitUntil: 'domcontentloaded' });
await pg.waitForFunction(() => typeof S !== 'undefined' && S === 'menu' && !!window.MSEL, null, { timeout: 90000 });
await pg.evaluate(() => { start(); P.inv = 1e9; });
await sleep(9500); // aşama başladıktan 8 sn sonra boss modeli arkada iner
const g = await pg.evaluate(() => { if (!GATE) return null; P.x = GATE.x + Math.sin(GATE.ry) * 26; P.z = GATE.z + Math.cos(GATE.ry) * 26; P.y = HT(P.x, P.z) + 1; yaw = Math.atan2(P.x - GATE.x, P.z - GATE.z); summonBoss(); const b = E.find(e => e.boss); window.__b = b; return { kapi: GATE.st, boss: !!b, ad: b && b.bp.n, hazir: !!(b && b.u.glb && !b.u.glb.bekliyor) }; });
console.log('çağrı', JSON.stringify(g));
const N = Math.round(+sure / 1.5); let eskiGorundu = 0;
for (let i = 0; i < N; i++) {
  // oyuncu boss'un çevresinde döner (15 birim uzakta), kamera boss'a bakar
  await pg.evaluate(i => { const b = window.__b, a = i * .5, q = b.m.position; P.x = q.x + Math.sin(a) * 15; P.z = q.z + Math.cos(a) * 15; P.y = HT(P.x, P.z) + 1; yaw = Math.atan2(P.x - q.x, P.z - q.z); if (S == 'choice') chPick(0); }, i);
  await sleep(1500);
  const d = await pg.evaluate(() => { const b = window.__b, G = b.u.glb; return { model: !!(G && !G.bekliyor), can: Math.round(b.hp / b.mh * 100), slam: +b.slam.toFixed(2), sh: +b.sh.toFixed(1), hiz: b.spm, w: G && G.w ? Object.entries(G.w).filter(x => x[1] > .05).map(x => x[0] + ':' + x[1].toFixed(2)).join(' ') : '', S }; });
  if (!d.model) eskiGorundu++;
  console.log(String(i).padStart(2), JSON.stringify(d));
  await pg.screenshot({ path: `${out}/d${String(i).padStart(2, '0')}.png` });
}
await pg.evaluate(() => { hurtE(window.__b, 1e12, 1); });
for (let i = 0; i < 16; i++) { await pg.evaluate(() => { if (S == 'choice') chPick(0); }); await sleep(400); if (i == 2) await pg.screenshot({ path: `${out}/olum.png` }); }
console.log('bitiş', JSON.stringify(await pg.evaluate(() => ({ S, kapi: GATE && GATE.st, bossKaldi: E.some(e => e.boss && !e.dead), glb: !!window.__b.u.glb }))), 'model gelmeden görünen kare:', eskiGorundu, 'hata:', errs.length ? [...new Set(errs)].join(' ; ').slice(0, 400) : 'yok');
await br.close();
