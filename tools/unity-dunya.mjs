// Unity için dünya dışa aktarımı: oyunu tarayıcıda sabit tohumla açar, dünya grubunu (arazi, ağaçlar, kayalar, yapılar,
// su, ateşler) GLB'ye, oyun verisini (engeller, platformlar, zıplama pedleri, su seviyesi) JSON'a yazar.
// Çoklu kopyalar EXT_mesh_gpu_instancing ile gider. Özel shader eklemeleri (rüzgâr, arazi deseni vb.) GLB'ye girmez;
// Unity tarafında ayrıca taşınır, malzeme adına türü yazılır.
// node tools/unity-dunya.mjs <oyun url> <çıktı klasörü> [aşama=0 (biyomu da belirler: 0 Kara Koru, 1 Kızıl Bozkır, 2 Mezarlık)] [tohum=1]
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
  window.__tohum = v => { s = v >>> 0; };
}, +tohum);
await pg.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
await pg.waitForFunction(() => typeof S !== 'undefined' && S === 'menu', null, { timeout: 90000 });
// harita, tohum oyun başlarken sıfırlanarak üretilir (menüdeki rastgele sayı tüketimi sonucu değiştirmesin)
await pg.evaluate(async ([b, t]) => { window.__tohum(t); start(); P.inv = 1e9 }, [+bi, +tohum]);
await pg.waitForFunction(() => S === 'ready' || S === 'play', null, { timeout: 60000 });
// aşama 2-3 (biyom 1-2): web'in nextStage'i gibi aşama ve harita değişir, tohum sıfırlanıp setupStage yeniden kurar
if (+bi > 0) await pg.evaluate(async ([n, t]) => { const { $G } = await import('/src/core/store.js'); const O = await import('/src/game/objects.js'); window.__tohum(t); $G.P.stage = n; $G.P.map = ['koru', 'bozkir', 'mezarlik'][n]; $G.P.stT = 0; O.setupStage(); }, [+bi, +tohum]);
await new Promise(r => setTimeout(r, 3000));
const res = await pg.evaluate(async () => {
  const { GLTFExporter } = await import('/@id/three/examples/jsm/exporters/GLTFExporter.js');
  const T = await import('/src/world/terrain.js');
  const { $G } = await import('/src/core/store.js');
  const WG = T.WG;
  // malzeme türü: oyunun kendi malzeme nesneleriyle ve özel shader imzasıyla (Unity'de hangi gölgelendiriciyle çizileceği)
  const G = await import('/src/engine/gfx.js');
  const tur = mt => {
    if (mt === G.VMATT) return 'svT';          // ağaç gövdesi salınımı (k2=0.0045)
    if (mt === G.VMATG) return 'svG';          // çim salınımı (k1=0.2)
    if (mt === G.VMATB) return 'svB';          // çalı salınımı (k1=0.025)
    if (mt.isShaderMaterial && mt.uniforms && mt.uniforms.op && mt.uniforms.col) return 'sis'; // yer sisi levhaları (gfx.js fogSheets)
    const s = mt.onBeforeCompile ? mt.onBeforeCompile.toString() : '';
    if (s.includes('uDry')) return 'arazi';
    if (s.includes('wShore')) return 'su';
    if (s.includes('VMATT')) return 'yaprak';  // yaprak kartı: ağaç salınımı + kameraya yakın seyreltme
    if (s.includes('VMATG')) return 'ortu';    // çim kartı: çim salınımı
    if (s.includes('vWP')) return 'tas';       // structify: taş blokları, ahşap damarı
    if (s.includes('GU.t')) return 'svX';
    if (mt.type == 'MeshBasicMaterial') return mt.blending == 2 ? 'isik' : 'temel';
    return 'duz';
  };
  const turler = {}, gorulen = new Set();
  WG.traverse(o => {
    if (!o.isMesh) return;
    for (const mt of Array.isArray(o.material) ? o.material : [o.material]) {
      if (gorulen.has(mt)) continue;
      gorulen.add(mt);
      const t = tur(mt);
      mt.name = 'kk_' + t;
      turler[t] = (turler[t] || 0) + 1;
    }
  });
  // GLTFExporter ShaderMaterial yazmaz (malzemesiz kalır, Unity'de beyaz çizilir): yer sisi levhalarına adlı yer tutucu
  {
    const THREE = await import('/@id/three');
    WG.traverse(o => { if (o.isMesh && o.material && o.material.isShaderMaterial && o.material.name == 'kk_sis') o.material = new THREE.MeshBasicMaterial({ name: 'kk_sis', transparent: true, opacity: .3, depthWrite: false }); });
  }
  const ex = new GLTFExporter(), ex0 = new GLTFExporter();
  const glb = await ex.parseAsync(WG, { binary: true, onlyVisible: true, maxTextureSize: 2048 });
  const u = new Uint8Array(glb); let s = '';
  for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode.apply(null, u.subarray(i, i + 8192));
  // yükseklik ızgarası: -R..R, 1 m aralık, Float32 (nehir yatakları ve düzlemeler dahil, $G.HT)
  const R = 272, N = R * 2 + 1, hg = new Float32Array(N * N);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) hg[j * N + i] = $G.HT(i - R, j - R);
  const hu = new Uint8Array(hg.buffer); let hs = '';
  for (let i = 0; i < hu.length; i += 8192) hs += String.fromCharCode.apply(null, hu.subarray(i, i + 8192));
  // patika maskesi (çim çıkmaz): $G.MAP.pm, aynı ızgara
  const pg2 = new Float32Array(N * N), pm = $G.MAP && $G.MAP.pm;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) pg2[j * N + i] = pm ? pm(i - R, j - R) : 0;
  const pu = new Uint8Array(pg2.buffer); let ps = '';
  for (let i = 0; i < pu.length; i += 8192) ps += String.fromCharCode.apply(null, pu.subarray(i, i + 8192));
  // oyuncuyu izleyen çim öbeği (gfx.js grassField): tek öbek modeli, malzemesiyle
  const RT = await import('/src/engine/realtrees.js'), THREE = await import('/@id/three');
  const kind = $G.BI == 1 ? 'dry' : $G.BI == 2 ? 'gray' : 'green', gg = RT.grassGeo($G.BI ? 5 : 3, kind);
  const gm = gg.userData.mat.clone(); gm.name = 'kk_cim';
  const cimG = await ex0.parseAsync(new THREE.Mesh(gg, gm), { binary: true });
  const cu8 = new Uint8Array(cimG); let cs = '';
  for (let i = 0; i < cu8.length; i += 8192) cs += String.fromCharCode.apply(null, cu8.subarray(i, i + 8192));
  // platform üstleri (köprü, yapı): groundAt bunları kullanır
  const pset = new Set();
  for (const a of $G.PG.values()) for (const p of a) pset.add(p);
  // bulutlar (Sprite: GLB'ye girmez): konum, boy; doku PNG
  const CL = ($G.CLOUDS || []).map(c => ({ x: c.position.x, y: c.position.y, z: c.position.z, w: c.scale.x, h: c.scale.y }));
  let cltex = '';
  if ($G.CLOUDS && $G.CLOUDS[0] && $G.CLOUDS[0].material.map) { const im = $G.CLOUDS[0].material.map.image; const cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height; cv.getContext('2d').drawImage(im, 0, 0); cltex = cv.toDataURL('image/png').split(',')[1]; }
  const veri = {
    CL,
    R, PL: [...pset].map(p => ({ x0: p.x0, x1: p.x1, z0: p.z0, z1: p.z1, top: p.top })),
    BI: $G.BI, WLV: $G.WLV,
    OBS: OBS.map(o => ({ x: o.x, z: o.z, r: o.r, b: o.b, t: o.t > 1e8 ? 1e9 : o.t, nm: !!o.nm })),
    PLF: ($G.PLF || []).map(p => ({ x: p.x, z: p.z, w: p.w, d: p.d, y: p.y, h: p.h, b: p.b })),
    JP: ($G.JP || []).map(p => ({ x: p.x, y: p.y, z: p.z })),
    spawn: { x: P.x, y: P.y, z: P.z }, yaw: $G.yaw, pit: $G.pit
  };
  return { b64: btoa(s), hb64: btoa(hs), pb64: btoa(ps), cb64: btoa(cs), cltex, veri, turler, bytes: u.length };
});
const ad = `dunya_${bi}_${tohum}`;
fs.writeFileSync(`${out}/${ad}.glb`, Buffer.from(res.b64, 'base64'));
fs.writeFileSync(`${out}/${ad}.json`, JSON.stringify(res.veri));
fs.writeFileSync(`${out}/${ad}_yukseklik.bytes`, Buffer.from(res.hb64, 'base64'));
fs.writeFileSync(`${out}/${ad}_patika.bytes`, Buffer.from(res.pb64, 'base64'));
fs.writeFileSync(`${out}/cim_${bi}.glb`, Buffer.from(res.cb64, 'base64'));
// mini harita arka planı (build.js MMBG), aşamaya göre
const mm = await pg.evaluate(async () => { const { $G } = await import('/src/core/store.js'); return $G.MMBG ? $G.MMBG.toDataURL('image/png').split(',')[1] : ''; });
if (mm) fs.writeFileSync(`${out}/minimap_${bi}.png`, Buffer.from(mm, 'base64'));
if (res.cltex) fs.writeFileSync(`${out}/bulut.png`, Buffer.from(res.cltex, 'base64'));
console.log(ad, (res.bytes / 1e6).toFixed(1) + ' MB', 'OBS', res.veri.OBS.length, 'PLF', res.veri.PLF.length, 'JP', res.veri.JP.length, 'WLV', res.veri.WLV, 'platform', res.veri.PL.length, 'bulut', res.veri.CL.length, JSON.stringify(res.turler));
console.log('hata:', errs.length ? errs.slice(0, 3) : 'yok');
await br.close();
