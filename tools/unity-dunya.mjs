// Unity için dünya dışa aktarımı: oyunu tarayıcıda sabit tohumla açar, dünya grubunu (arazi, ağaçlar, kayalar, yapılar,
// su, ateşler) GLB'ye, oyun verisini (engeller, platformlar, zıplama pedleri, su seviyesi) JSON'a yazar.
// Çoklu kopyalar EXT_mesh_gpu_instancing ile gider. Özel shader eklemeleri (rüzgâr, arazi deseni vb.) GLB'ye girmez;
// Unity tarafında ayrıca taşınır, malzeme adına türü yazılır.
// node tools/unity-dunya.mjs <oyun url> <çıktı klasörü> [biyom=0] [tohum=1]
import { chromium } from 'playwright';
import fs from 'node:fs';
const [url, out, bi = '0', tohum = '1'] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const br = await chromium.launch({ executablePath: process.env.CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await br.newPage({ viewport: { width: 960, height: 540 } });
const errs = []; pg.on('pageerror', e => errs.push(e.message));
await pg.addInitScript(t => {
  Element.prototype.requestPointerLock = function () {};
  localStorage.setItem('kk_tut', '1'); localStorage.setItem('kk_ci', '0');
  let s = t >>> 0; Math.random = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 };
}, +tohum);
await pg.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
await pg.waitForFunction(() => typeof S !== 'undefined' && S === 'menu', null, { timeout: 90000 });
await pg.evaluate(async b => { const { $G } = await import('/src/core/store.js'); if (b) $G.BI = b; start(); P.inv = 1e9 }, +bi);
await pg.waitForFunction(() => S === 'ready' || S === 'play', null, { timeout: 60000 });
await new Promise(r => setTimeout(r, 3000));
const res = await pg.evaluate(async () => {
  const { GLTFExporter } = await import('/@id/three/examples/jsm/exporters/GLTFExporter.js');
  const T = await import('/src/world/terrain.js');
  const { $G } = await import('/src/core/store.js');
  const WG = T.WG;
  // malzeme türü: özel shader eklemesinin imzasından (Unity'de hangi gölgelendiriciyle çizileceği)
  const tur = mt => {
    const s = mt.onBeforeCompile ? mt.onBeforeCompile.toString() : '';
    if (s.includes('uDry')) return 'arazi';
    if (s.includes('wShore')) return 'su';
    if (s.includes('VMATT')) return 'yaprak';
    if (s.includes('VMATG')) return 'ortu';
    if (s.includes('GU.t') && s.includes('uT')) return 'ruzgar';
    if (s.includes('vWP')) return 'tas';
    if (mt.type == 'MeshBasicMaterial') return mt.blending == 2 ? 'isik' : 'temel';
    return 'duz';
  };
  const turler = {};
  WG.traverse(o => {
    if (!o.isMesh) return;
    for (const mt of Array.isArray(o.material) ? o.material : [o.material]) {
      const t = tur(mt);
      mt.name = 'kk_' + t + (mt.name ? '_' + mt.name : '');
      turler[t] = (turler[t] || 0) + 1;
    }
  });
  const ex = new GLTFExporter();
  const glb = await ex.parseAsync(WG, { binary: true, onlyVisible: true, maxTextureSize: 2048 });
  const u = new Uint8Array(glb); let s = '';
  for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode.apply(null, u.subarray(i, i + 8192));
  // yükseklik ızgarası: -R..R, 1 m aralık, Float32 (nehir yatakları ve düzlemeler dahil, $G.HT)
  const R = 272, N = R * 2 + 1, hg = new Float32Array(N * N);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) hg[j * N + i] = $G.HT(i - R, j - R);
  const hu = new Uint8Array(hg.buffer); let hs = '';
  for (let i = 0; i < hu.length; i += 8192) hs += String.fromCharCode.apply(null, hu.subarray(i, i + 8192));
  // platform üstleri (köprü, yapı): groundAt bunları kullanır
  const pset = new Set();
  for (const a of $G.PG.values()) for (const p of a) pset.add(p);
  const veri = {
    R, PL: [...pset].map(p => ({ x0: p.x0, x1: p.x1, z0: p.z0, z1: p.z1, top: p.top })),
    BI: $G.BI, WLV: $G.WLV,
    OBS: OBS.map(o => ({ x: o.x, z: o.z, r: o.r, b: o.b, t: o.t > 1e8 ? 1e9 : o.t, nm: !!o.nm })),
    PLF: ($G.PLF || []).map(p => ({ x: p.x, z: p.z, w: p.w, d: p.d, y: p.y, h: p.h, b: p.b })),
    JP: ($G.JP || []).map(p => ({ x: p.x, y: p.y, z: p.z })),
    spawn: { x: P.x, y: P.y, z: P.z }
  };
  return { b64: btoa(s), hb64: btoa(hs), veri, turler, bytes: u.length };
});
const ad = `dunya_${bi}_${tohum}`;
fs.writeFileSync(`${out}/${ad}.glb`, Buffer.from(res.b64, 'base64'));
fs.writeFileSync(`${out}/${ad}.json`, JSON.stringify(res.veri));
fs.writeFileSync(`${out}/${ad}_yukseklik.bytes`, Buffer.from(res.hb64, 'base64'));
console.log(ad, (res.bytes / 1e6).toFixed(1) + ' MB', 'OBS', res.veri.OBS.length, 'PLF', res.veri.PLF.length, 'JP', res.veri.JP.length, 'WLV', res.veri.WLV, 'platform', res.veri.PL.length, JSON.stringify(res.turler));
console.log('hata:', errs.length ? errs.slice(0, 3) : 'yok');
await br.close();
