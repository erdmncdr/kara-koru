// Sıradan düşmanı oyunda yakından çeker ve kalabalıkta kare süresini ölçer (engine/glbdusman.js denetimi).
// node tools/dusman-cek.mjs <url> <klasör> [tür=gulyabani] [kalabalık=150]   (CHROME; test derlemesi VITE_KOPRU=1; adreste ?eski: eski gövdeler)
import { chromium } from 'playwright';
import fs from 'node:fs';
const [url, out, tur = 'gulyabani', kal = '150'] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const br = await chromium.launch({ executablePath: process.env.CHROME, headless: true, args: ['--use-angle=metal', '--ignore-gpu-blocklist'] });
const pg = await br.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (/yüklenemedi|iskin/.test(m.text())) errs.push(m.text()); });
await pg.addInitScript(() => { Element.prototype.requestPointerLock = function () {}; localStorage.setItem('kk_tut', '1'); localStorage.setItem('kk_set', JSON.stringify({ q: 2, bl: 1 })); });
await pg.goto(url, { waitUntil: 'domcontentloaded' });
await pg.waitForFunction(() => typeof S !== 'undefined' && S === 'menu' && !!window.MSEL, null, { timeout: 90000 });
await pg.evaluate(() => { start(); P.inv = 1e9; P.need = 1e12; });
await sleep(4000);
await pg.addStyleTag({ content: '#hud,#tip,#tt,.wl,#ov{display:none!important}' });
const temizle = () => pg.evaluate(() => { for (const e of E) { e.m.position.x += 600; e.hp = 0; } });
// 1) yakın: dört düşman oyuncunun önünde, yürürken ve vururken
await temizle();
await pg.evaluate(k => { const fx = -Math.sin(yaw), fz = -Math.cos(yaw); window.__d = []; for (let i = 0; i < 4; i++) { spawn(k, { x: P.x + fx * (5 + i * 1.6) + fz * (i - 1.5) * 1.8, z: P.z + fz * (5 + i * 1.6) - fx * (i - 1.5) * 1.8 }); window.__d.push(E[E.length - 1]); } }, tur);
await sleep(700); await pg.screenshot({ path: `${out}/1_yakin.png` });
await sleep(900); await pg.screenshot({ path: `${out}/2_yuru.png` });
await sleep(1200); await pg.screenshot({ path: `${out}/3_vur.png` });
console.log('model', JSON.stringify(await pg.evaluate(() => { const u = window.__d[0].u; return { anahtar: u.key, glb: !!u.d.glb, ucgen: u.d.g.index.count / 3, kemik: u.d.bones.length, hy0: +u.d.info.hy0.toFixed(2) }; })));
// 2) kalabalık: kare süresi
await temizle();
await pg.evaluate(([k, n]) => { for (let i = 0; i < n; i++) { const a = i / n * 6.283 * 3, r = 9 + i * .12; spawn(k, { x: P.x + Math.cos(a) * r, z: P.z + Math.sin(a) * r }); } }, [tur, +kal]);
await sleep(2500);
const olc = await pg.evaluate(() => new Promise(res => { const t = []; let son = performance.now(), n = 0; const f = () => { const s = performance.now(); t.push(s - son); son = s; P.inv = 1e9; if (++n < 180) requestAnimationFrame(f); else { t.sort((a, b) => a - b); res({ dusman: E.filter(e => e.hp > 0).length, ortMs: +(t.reduce((a, b) => a + b, 0) / t.length).toFixed(2), p95Ms: +t[Math.floor(t.length * .95)].toFixed(2), cizim: R.info.render.calls, ucgen: R.info.render.triangles }); } }; requestAnimationFrame(f); }));
await pg.screenshot({ path: `${out}/4_kalabalik.png` });
console.log('kalabalık', JSON.stringify(olc), 'hata:', errs.length ? errs.slice(0, 3) : 'yok');
await br.close();
