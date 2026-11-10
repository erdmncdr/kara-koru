// Unity portu için silah görseli karşılaştırması (web tarafı): tests/wfx.mjs ile aynı sahne (sabit düşman dizilişi, sabit
// kamera, kare adımlı zaman), ama telefon ayarında: orta kalite (SET.q = 1), 874×402 görünüm, 3× piksel oranı (2622×1206).
// Her silah 6., 12. ve 48. karede fotoğraflanır. Unity tarafı KORU_SILAHTUR yapısıyla aynı karelerde donar
// (KaraKoruUnity/araclar/silah-tur.sh), iki taraf araclar/silah-karsilastir.py ile yan yana dizilir.
// Fotoğraftan önce altı kare ve kısa bir bekleme: iki karelik bekleme bu çözünürlükte bir önceki adımın görüntüsünü veriyordu.
// node tools/unity-silah-tur.mjs <url> <klasör> [silah,silah,...]
import { chromium } from 'playwright';
import fs from 'node:fs';
const url = process.argv[2] || 'http://localhost:4173/', out = process.argv[3] || 'test-results/wfx';
const only = process.argv[4] ? process.argv[4].split(',') : null;
fs.mkdirSync(out, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
// Çizici: WFX_SW=1 ya da Linux'ta yazılım (SwiftShader), macOS'ta gerçek GPU (Metal). CHROME ile ikili seçilir.
const MAC = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const exe = process.env.CHROME || ['/usr/bin/google-chrome', MAC].find(p => fs.existsSync(p));
const sw = process.env.WFX_SW || process.platform != 'darwin';
const br = await chromium.launch({ executablePath: exe, headless: true, args: sw ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : ['--use-angle=metal', '--ignore-gpu-blocklist', '--enable-gpu'] });
const W = 874, H = 402;
const F0 = +process.env.WFX_F0 || 4; // ilk kare; 0.18 sn'lik titreşen şimşekler 4. karede gizli kalır, WFX_F0=3 ile bakılır
const pg = await br.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 3 });
await pg.addInitScript(() => {
  // Başsız Chrome'da bile fare kilidi (pointer lock) kullanıcının gerçek imlecini yakalayabiliyor; testler imlece dokunmasın
  Element.prototype.requestPointerLock = function () { return Promise.resolve(); };
  localStorage.setItem('kk_set', JSON.stringify({ q: 1, dn: 0 })); localStorage.setItem('kk_tut', '1');
  let s = 4242; Math.random = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 };
});
const errs = []; pg.on('pageerror', e => errs.push(e.message));
await pg.route('**/*', r => { const u = r.request().url(); if (u.startsWith('file:') || u.includes('localhost')) return r.continue(); return r.abort() });
await pg.goto(url);
await pg.waitForFunction(() => typeof S !== 'undefined' && S === 'menu', null, { timeout: 90000 });
await sleep(3000);
await pg.evaluate(() => { start() });
await pg.waitForFunction(() => S === 'play', null, { timeout: 60000 });
await sleep(1500);
const frame = async () => { await pg.evaluate(() => new Promise(r => { let n = 0; const f = () => ++n >= 6 ? r() : requestAnimationFrame(f); requestAnimationFrame(f) })); await sleep(180) };
const keys = await pg.evaluate(() => {
  // sahne: açık alan arayıp oyuncuyu oraya taşı (kamera -z yönüne bakar)
  P.inv = 1e9; K = {};
  let best = null;
  for (let i = 0; i < 400; i++) {
    const x = P.x + rn(-120, 120), z = P.z + rn(-120, 120);
    let ok = 1, dy = 0; const y0 = groundAt(x, z, 50);
    for (const [dx, dz] of [[0, -4], [0, -8], [0, -12], [3, -8], [-3, -8], [0, 4], [0, 10]]) { const y = groundAt(x + dx, z + dz, 50); if (Math.abs(y - y0) > 1.2 || solidAt(x + dx, y + 1, z + dz)) ok = 0; dy += Math.abs(y - y0) }
    if (ok && (!best || dy < best.dy)) best = { x, z, dy };
  }
  if (best) { P.x = best.x; P.z = best.z; P.y = groundAt(best.x, best.z, 50) + .1; P.vx = P.vz = P.vy = 0; FX = P.x; FZ = P.z; FY = P.y }
  yaw = yawT = 0; pit = pitT = .42; P.need = 1e12;
  const st = document.createElement('style'); st.textContent = '#tt{display:none!important}'; document.head.appendChild(st);
  for (const e of E.slice()) { e.hp = 0; killE(e) } E = E.filter(e => !e.dead);
  S = 'pause';
  return Object.keys(WD);
});
const gpu = await pg.evaluate(() => { const g = document.createElement('canvas').getContext('webgl2'), x = g && g.getExtension('WEBGL_debug_renderer_info'); return x ? g.getParameter(x.UNMASKED_RENDERER_WEBGL) : '?' });
console.log('çizici:', gpu);
console.log('silahlar:', keys.length);
const LAY = [[0, -5], [2.6, -6.5], [-2.6, -7.5], [1, -9.5], [-1.5, -11], [4.4, -8.5], [-4.6, -9.5], [.5, -13], [-3.2, -4.8], [3.6, -11.5], [6.5, -6], [-6.5, -7]];
// düşmanlar bir kez doğar, ölümsüz; her silah için yerine konur (doğuş/ölüm efekti karışmasın)
await pg.evaluate(LAY => {
  for (const d of DY) d.t = 0; S = 'play'; upd(1 / 60); S = 'pause';
  LAY.forEach(([dx, dz], i) => { spawn(i % 4 == 1 ? 'bocek' : i % 4 == 3 ? 'hortlak' : 'gulyabani', { x: P.x + dx, z: P.z + dz }); const e = E[E.length - 1]; e.mh = e.hp = 1e9 });
  S = 'play'; for (let i = 0; i < 30; i++) upd(1 / 60); S = 'pause';
}, LAY);
const setup = (k, boost) => pg.evaluate(([k, boost, LAY]) => {
  for (const d of DY) d.t = 0;
  for (const a of [B, B2, AX, BO, FB, PZ, ZN2, NV, VXS, FXR]) { for (const o of a) kill(o.m); a.length = 0 } for (const o of SLS) kill(o.m); SLS = [];
  for (const o of ZP) kill(o.m); ZP = []; for (const o of OB) kill(o.m); OB.length = 0; if (AUm) AUm.visible = false; if (ICm) ICm.visible = false;
  VFX.clear(); P.xp = 0; P.stT = 1; P.hp = P.mh; FX = P.x; FZ = P.z; FY = P.y; yaw = yawT = 0; pit = pitT = .5;
  LAY.forEach(([dx, dz], i) => { const e = E[i]; if (!e) return; e.m.position.set(P.x + dx, groundAt(P.x + dx, P.z + dz, P.y + 5), P.z + dz); e.hp = e.mh = 1e9; e.slow = 0; e.kx = e.kz = e.vy = 0; e.burnT = e.frzT = e.poiT = e.bloodT = e.curseT = e.stunT = 0; e.poiN = 0; e.iceN = 0; e.oh = 0; unflash(e) });
  P.C.enSp = .08; P.W = [newW(k)]; const w = P.W[0]; w.t = 0;
  if (boost) { const u = WD[k].u || {}; for (const s in u) w.s[s] = (w.s[s] || 0) + u[s] * 4; }
  if (k == 'aegis') { w.ch = (w.s.cnt || 1) + P.C.cnt; }
  return { s: w.s, hp: P.hp, x: +P.x.toFixed(1), z: +P.z.toFixed(1) };
}, [k, boost, LAY]);
const step = (n, k) => pg.evaluate(([n, k]) => {
  S = 'play'; if (k == 'poi' || k == 'korizi' || k == 'mines') K.w = 1;
  for (let i = 0; i < n; i++) { upd(1 / 60); animH(1 / 60); P.xp = 0; if (S === 'choice') back(); if (S !== 'play') S = 'play'; if (k == 'aegis' && i == 2) { P.inv = 0; hurtP(40, E[0]); P.inv = 1e9 } }
  K.w = 0; S = 'pause';
  return { b: B.length + B2.length, sl: SLS.length, fb: FB.length, nv: NV.length, zn: ZN2.length + PZ.length + VXS.length, ax: AX.length + BO.length, part: [VFX.ADD, VFX.SPK, VFX.STR, VFX.ALP, VFX.DEB].map(p => p.a) };
}, [n, k]);
const rep = {};
const sheet = await br.newPage({ viewport: { width: W * 2, height: H * 3 } });
await sheet.setContent('<canvas id=c width=' + W * 2 + ' height=' + H * 3 + ' style="display:block"></canvas>');
for (const k of keys) {
  if (only && !only.includes(k)) continue;
  const shots = [], info = [];
  for (const boost of [0]) {
    const st = await setup(k, boost);
    let f = 0;
    for (const n of [6, 12, 48]) {
      const r = await step(n - f, k); f = n;
      await frame();
      const buf = await pg.screenshot({ type: 'png' });
      const name = k + (boost ? '_b' : '') + '_' + String(n).padStart(2, '0') + '.png';
      fs.writeFileSync(out + '/' + name, buf);
      shots.push({ b64: buf.toString('base64'), label: (boost ? 'güçlü ' : 'taban ') + k + '  kare ' + n + ' (' + (n / 60).toFixed(2) + ' s)' });
      info.push({ boost, n, ...r });
    }
    rep[k + (boost ? '_b' : '')] = { s: st.s, frames: info.filter(i => i.boost == boost) };
  }
  await sheet.evaluate(async ([shots, W, H]) => {
    const c = document.getElementById('c'), x = c.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, c.width, c.height);
    for (let i = 0; i < shots.length; i++) {
      const im = new Image(); im.src = 'data:image/png;base64,' + shots[i].b64; await im.decode();
      const cx = (i % 2) * W, cy = Math.floor(i / 2) * H; x.drawImage(im, cx, cy, W, H);
      x.fillStyle = 'rgba(0,0,0,.6)'; x.fillRect(cx, cy, 420, 26); x.fillStyle = '#fff'; x.font = '16px sans-serif'; x.fillText(shots[i].label, cx + 8, cy + 19);
    }
  }, [shots, W, H]);
  await sheet.screenshot({ path: out + '/sheet_' + k + '.png', type: 'png' });
  console.log(k, JSON.stringify(rep[k].frames.map(f => [f.n, f.b, f.sl, f.fb, f.nv, f.zn, f.ax, f.part.join('/')])));
}
fs.writeFileSync(out + '/rapor.json', JSON.stringify(rep, null, 1));
fs.writeFileSync(out + '/log.txt', [...new Set(errs)].join('\n'));
console.log('hata:', [...new Set(errs)].length);
await br.close();
