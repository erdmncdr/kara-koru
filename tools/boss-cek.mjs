// Boss'u oyunda yakından çeker: oyuncunun önüne doğurur, durumlarını (geliş kükremesi, yürüme, yere vurma, yakın vuruş, hücum,
// ölüm) sırayla dondurup kare alır. node tools/boss-cek.mjs <url> <klasör> [harita=koru] [kademe sırası=0]
// (CHROME: Chrome yolu; test derlemesi VITE_KOPRU=1). Çıktı: <klasör>/<harita>_<durum>.png ve ölçüler.
import { chromium } from 'playwright';
import fs from 'node:fs';
const [url, out, harita = 'koru', sira = '0'] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const br = await chromium.launch({ executablePath: process.env.CHROME, headless: true, args: ['--use-angle=metal', '--ignore-gpu-blocklist'] });
const pg = await br.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() == 'warning' && /Boss/.test(m.text())) errs.push(m.text()); });
await pg.addInitScript(() => { Element.prototype.requestPointerLock = function () {}; localStorage.setItem('kk_tut', '1'); localStorage.setItem('kk_set', JSON.stringify({ q: 2, bl: 1 })); });
await pg.goto(url, { waitUntil: 'domcontentloaded' });
await pg.waitForFunction(() => typeof S !== 'undefined' && S === 'menu' && !!window.MSEL, null, { timeout: 90000 });
await pg.evaluate(() => { start(); P.inv = 1e9; });
await sleep(2500);
await pg.addStyleTag({ content: '#hud,#tip,#tt,.wl,#bossbar{display:none!important}' });
// boss oyuncunun 15 birim önünde doğar; sıradan düşmanlar ve boss mermileri temizlenir
const dog = () => pg.evaluate(([h, i]) => { for (const e of E) if (!e.boss) e.hp = 0; const fx = -Math.sin(yaw), fz = -Math.cos(yaw), pr = BOSSP[h][i]; spawn(3, { x: P.x + fx * 15, z: P.z + fz * 15, boss: 1, kind: pr.k, bp: pr }); window.__b = E[E.length - 1]; window.__b.st2 = 99; window.__b.sh = 99; }, [harita, +sira]);
await dog();
await pg.waitForFunction(() => window.__b.u.glb && !window.__b.u.glb.bekliyor, null, { timeout: 60000 }).catch(() => errs.push('model 60 sn içinde gelmedi'));
const kare = ad => pg.screenshot({ path: `${out}/${harita}_${ad}.png` });
console.log('ölçü', JSON.stringify(await pg.evaluate(() => { const b = window.__b, G = b.u.glb; return G && !G.bekliyor ? { yaricap: +b.r.toFixed(2), olcek: +b.ba.toFixed(2), boy: +(G.h * b.ba).toFixed(2), oyuncu: 2.9, klipler: Object.keys(G.A).join(',') } : null; })));
await sleep(900); await kare('1_kukre');
await sleep(2600); await kare('2_yuru');
await pg.evaluate(() => { window.__b.slam = .9; }); await sleep(450); await kare('3_slam_kalkis'); await sleep(520); await kare('4_slam_vurus');
await sleep(1500);
await pg.evaluate(() => { const b = window.__b; b.ak = 1e-4; b.akH = 0; b.akC = 9; }); await sleep(330); await kare('5_vurus_kalkis'); await sleep(300); await kare('6_vurus_inis');
await sleep(1500);
await pg.evaluate(() => { const b = window.__b, fx = -Math.sin(yaw), fz = -Math.cos(yaw); b.m.position.x = P.x + fx * 26; b.m.position.z = P.z + fz * 26; b.spm = 4; }); await sleep(500); await kare('7_hucum');
await pg.evaluate(() => { const b = window.__b; b.spm = 1; hurtE(b, 1e12, 1); }); await sleep(700); await kare('8_olum_1'); await sleep(900); await kare('9_olum_2');
await sleep(2500);
for (let i = 0; i < 12; i++) { await pg.evaluate(() => { if (S == 'choice') chPick(0); }); await sleep(450); } // boss tecrübesi seviye ekranı açar: oyun onlar kapanınca sürer
console.log('ölümden sonra', JSON.stringify(await pg.evaluate(() => ({ S, glb: !!window.__b.u.glb, sahnede: !!window.__b.m.parent, gorunur: window.__b.u.g.visible }))), 'hata:', errs.length ? [...new Set(errs)].join(' ; ').slice(0, 400) : 'yok');
await br.close();
