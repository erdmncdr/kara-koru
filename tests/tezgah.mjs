// Silah tezgâhı: her silah tek başına, aynı düşman sürüsüne karşı; silahlar arası karşılaştırma ve okçu isabeti için.
// Oyun mantığı el ile adımlanır (upd(1/60)); oyuncu ölümsüz, düşmanlar gerçek hızda kovalar, ölen yerine halka dışından yenisi doğar.
//   dur: 24 düşman, oyuncu yerinde, 20 sn · koş: aynı sürü, oyuncu daire çizerek koşar (iz silahları için)
//   okcu: 6 İskelet okçu 20 m'de, silah yok, oyuncu daire çizer 30 sn; atılan ve isabet eden ok sayılır
// Silah, seviye satırları (u) boost kez eklenmiş hâliyle denenir. HP=<can> sürünün canını değiştirir (varsayılan 60;
// 3000 dibe sokulan dayanıklı sürü). Hasar sayısı aşırı vuruşu da sayar, durum etkilerinin (zehir, yanma) zamanla verdiğini
// saymaz; öldürme sayısı ikisini de dengeler. Kalkan ölçülmez (darbe almadan tetiklenmez).
//   npx vite build && npx vite preview --port 4173
//   node tests/tezgah.mjs http://localhost:4173/ [all | silah,silah | okcu] [boost=4]
import { chromium } from 'playwright';
import fs from 'node:fs';
const url = process.argv[2] || 'http://localhost:4173/';
const only = process.argv[3] && process.argv[3] != 'all' ? process.argv[3].split(',') : null;
const boost = +(process.argv[4] || 4);
const MAC = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const br = await chromium.launch({ executablePath: process.env.CHROME || ['/usr/bin/google-chrome', MAC].find(p => fs.existsSync(p)), headless: true, args: ['--use-angle=metal', '--ignore-gpu-blocklist'] });
const pg = await br.newPage({ viewport: { width: 640, height: 360 } });
await pg.addInitScript(() => {
  Element.prototype.requestPointerLock = function () { return Promise.resolve(); };
  localStorage.setItem('kk_set', JSON.stringify({ q: 0, bl: 1, dn: 0 })); localStorage.setItem('kk_tut', '1');
  let s = 4242; Math.random = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 };
});
const errs = []; pg.on('pageerror', e => errs.push(e.message));
await pg.goto(url);
await pg.waitForFunction(() => typeof S !== 'undefined' && S === 'menu', null, { timeout: 90000 });
await pg.evaluate(() => start());
await pg.waitForFunction(() => S === 'play', null, { timeout: 60000 });
const keys = await pg.evaluate(() => {
  P.inv = 1e9; K = {}; P.need = 1e12;
  let best = null;
  for (let i = 0; i < 600; i++) {
    const x = rn(-150, 150), z = rn(-150, 150), y0 = groundAt(x, z, 50);
    let ok = 1, dy = 0;
    for (let a = 0; a < 12; a++) for (const r of [6, 14, 22]) { const xx = x + Math.cos(a / 2) * r, zz = z + Math.sin(a / 2) * r, y = groundAt(xx, zz, 50); if (Math.abs(y - y0) > 2 || solidAt(xx, y + 1, zz)) ok = 0; dy += Math.abs(y - y0) }
    if (ok && (!best || dy < best.dy)) best = { x, z, dy };
  }
  window.__home = best || { x: P.x, z: P.z };
  S = 'pause';
  return Object.keys(WD);
});
const run = (k, mode) => pg.evaluate(([k, mode, boost, HP]) => {
  window.__HP = HP;
  const h = window.__home;
  for (const a of [B, B2, AX, BO, FB, PZ, ZN2, NV, VXS, EB]) { for (const o of a) kill(o.m); a.length = 0 }
  for (const e of E.slice()) { e.nodrop = 1; e.hp = 0; killE(e) } E = E.filter(e => !e.dead);
  for (const o of G) kill(o.m); G.length = 0;
  P.x = h.x; P.z = h.z; P.y = groundAt(h.x, h.z, 50) + 1; P.vx = P.vz = P.vy = 0; yaw = yawT = 0;
  P.stT = 30; P.tt = 30; P.hp = P.mh; P.wdmg = {}; P.inv = 1e9;
  P.W = k ? [newW(k)] : []; if (k) { const w = P.W[0]; w.t = 0; const u = WD[k].u || {}; for (const s in u) w.s[s] = (w.s[s] || 0) + u[s] * boost; if (k == 'aegis') w.ch = (w.s.cnt || 1) + P.C.cnt }
  const k0 = kills, N = mode == 'okcu' ? 6 : 24;
  // tür kotası sabit: her türden 6 (ölen hangi türse yerine o doğar)
  const KS = ['gulyabani', 'hortlak', 'bocek', 'tasdev'];
  const sp = kk => { const a = Math.random() * 6.283, r = mode == 'okcu' ? 20 : 10 + Math.random() * 14; spawn(kk, { x: P.x + Math.cos(a) * r, z: P.z + Math.sin(a) * r }); const e = E[E.length - 1]; e.tzk = kk; if (mode != 'okcu') e.hp = e.mh = +(window.__HP || 60); else e.hp = e.mh = 1e9; e.nodrop = 1 };
  for (let i = 0; i < N; i++) sp(mode == 'okcu' ? 'okcu' : KS[i % 4]);
  let shots = 0, hits = 0;
  S = 'play'; spT = 1e9; P.thT = 1e9;
  const T = mode == 'okcu' ? 30 : 20;
  for (let f = 0; f < T * 60; f++) {
    if (mode != 'dur') { K = { w: 1 }; yaw = yawT = yaw + .55 / 60 } else K = {};
    // okçu isabeti: ok listesinden düşüp oyuncuya yakın olanlar
    const before = new Set(EB);
    upd(1 / 60);
    for (const b of EB) if (!before.has(b)) shots++;
    for (const b of before) if (!EB.includes(b) && Math.hypot(b.m.position.x - P.x, b.m.position.y - P.y, b.m.position.z - P.z) < 2.2) hits++;
    if (S === 'choice' || S === 'level') back();
    if (S !== 'play') S = 'play';
    P.hp = P.mh; P.xp = 0;
    spT = 1e9; P.thT = 1e9; // oyunun kendi doğuşu ve hırsızlar kapalı: yalnız tezgâhın sürüsü
    if (mode != 'okcu') for (const kk of KS) { let n = E.filter(e => !e.dead && e.tzk == kk).length; while (n++ < 6) sp(kk) }
    else while (E.filter(e => !e.dead).length < N) sp('okcu');
  }
  K = {}; S = 'pause';
  const dmg = Object.values(P.wdmg).reduce((a, b) => a + b, 0);
  return { k, mode, dps: +(dmg / T).toFixed(1), kills: kills - k0, shots, hits };
}, [k, mode, boost, process.env.HP || 60]);
const out = [];
if (only && only[0] == 'okcu') {
  const r = await run('', 'okcu'); console.log('okçu', JSON.stringify(r)); out.push(r);
} else for (const k of keys) {
  if (only && !only.includes(k)) continue;
  if (k == 'aegis') { console.log('aegis    ölçülmez: oyuncu ölümsüz, darbe almadan Kalkan tetiklenmez'); continue }
  const a = await run(k, 'dur'), b = await run(k, 'kos');
  console.log(k.padEnd(8), 'dur dps', String(a.dps).padStart(7), 'öldürme', String(a.kills).padStart(4), '| koş dps', String(b.dps).padStart(7), 'öldürme', String(b.kills).padStart(4));
  out.push(a, b);
}
const OUT = process.env.OUT || 'test-results/tezgah.json';
fs.mkdirSync(OUT.replace(/[^/]*$/, '') || '.', { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log('hata:', [...new Set(errs)].slice(0, 5));
await br.close();
