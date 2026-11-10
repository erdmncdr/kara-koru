// Unity için aşama nesneleri: setupStage'in sahneye koyduğu sandıklar, tapınaklar (sunaklar), tüccar/kazanlar, kapı,
// çömlekler, kırılabilirler, güçlendiriciler, Dört Mezar ve Kös davulları tek GLB'ye (ad: <tür>_<sıra>), etkileşim bilgileri JSON'a.
// Tohum dünya dışa aktarımıyla aynı sıfırlanır (tools/unity-dunya.mjs): konumlar o haritayla örtüşür.
// node tools/unity-asama.mjs <oyun url> <çıktı klasörü> [aşama=0 (biyomu da belirler: 0 Kara Koru, 1 Kızıl Bozkır, 2 Mezarlık)] [tohum=1]
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
await pg.evaluate(async ([b, t]) => { window.__tohum(t); start(); P.inv = 1e9 }, [+bi, +tohum]);
await pg.waitForFunction(() => S === 'ready' || S === 'play', null, { timeout: 60000 });
// aşama 2-3 (biyom 1-2): web'in nextStage'i gibi aşama ve harita değişir, tohum sıfırlanıp setupStage yeniden kurar
if (+bi > 0) await pg.evaluate(async ([n, t]) => { const { $G } = await import('/src/core/store.js'); const O = await import('/src/game/objects.js'); window.__tohum(t); $G.P.stage = n; $G.P.map = ['koru', 'bozkir', 'mezarlik'][n]; $G.P.stT = 0; O.setupStage(); }, [+bi, +tohum]);
await new Promise(r => setTimeout(r, 2000));
const res = await pg.evaluate(async () => {
  const { GLTFExporter } = await import('/@id/three/examples/jsm/exporters/GLTFExporter.js');
  const { $G } = await import('/src/core/store.js');
  const objs = [], veri = { CH: [], SH: [], NP: [], GATE: null, POT: [], PU: [], BRK: [], MZ: [], MZC: null, KS: [] };
  const ad = (o, n) => { o.name = n; objs.push(o); };
  const p3 = o => [+o.position.x.toFixed(3), +o.position.y.toFixed(3), +o.position.z.toFixed(3), +o.rotation.y.toFixed(4)];
  ($G.CH || []).forEach((c, i) => { ad(c.m, 'ch_' + i); veri.CH.push({ i, p: p3(c.m), free: !!c.free, gold: !!c.gold }); });
  ($G.SH || []).forEach((s, i) => { ad(s.m, 'sh_' + i); veri.SH.push({ i, p: p3(s.m), t: s.t, gold: !!s.gold }); });
  ($G.NP || []).forEach((n, i) => { ad(n.m, 'np_' + i); veri.NP.push({ i, p: p3(n.m), t: n.t, tier: n.tier || 0 }); });
  if ($G.GATE) { ad($G.GATE.m, 'gate'); veri.GATE = { x: $G.GATE.x, z: $G.GATE.z, ry: $G.GATE.ry }; }
  ($G.PU || []).forEach((u, i) => { ad(u.m, 'pu_' + i); veri.PU.push({ i, p: p3(u.m), t: u.t }); });
  // Dört Mezar (features.js mkGraves: dört mezar + ortadaki dikili taş, gi 9) ve Kös davulları (mkDrums)
  ($G.MZ || []).forEach((g, i) => { ad(g.m, 'mz_' + i); veri.MZ.push({ i, p: p3(g.m), gi: g.i }); });
  if ($G.MZC) veri.MZC = { x: $G.MZC.x, z: $G.MZC.z };
  ($G.KS || []).forEach((k, i) => { ad(k.m, 'ks_' + i); veri.KS.push({ i, p: p3(k.m) }); });
  // çömlekler ve kırılabilirler örnekli ağlar (objects.js potsBuild/brkBuild): her tür için geometri bir kez (geo_<tür>),
  // örnek dönüşümleri (konum, y dönüşü, ölçek) ve renkleri JSON'a
  const THREE = await import('/@id/three');
  const dec = (im, i) => { const M = new THREE.Matrix4(), p = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3(); im.getMatrixAt(i, M); M.decompose(p, q, sc); const e = new THREE.Euler().setFromQuaternion(q, 'YXZ'); return [+p.x.toFixed(3), +p.y.toFixed(3), +p.z.toFixed(3), +e.y.toFixed(4), +sc.x.toFixed(3)]; };
  if ($G.PINST) ad(new THREE.Mesh($G.PINST.geometry, $G.PINST.material), 'geo_pot');
  ($G.POT || []).forEach((p, i) => { const q = p.m.position; veri.POT.push({ i, p: [q.x, q.y, q.z], m: dec($G.PINST, p.i), big: p.big || 0, sv: p.sv || 0 }); });
  const gorTy = new Set();
  ($G.BRK || []).forEach((b, i) => {
    if (!gorTy.has(b.ty)) { gorTy.add(b.ty); ad(new THREE.Mesh(b.im.geometry, b.im.material), 'geo_' + b.ty); }
    const q = b.m.position; veri.BRK.push({ i, ty: b.ty, p: [q.x, q.y, q.z], m: dec(b.im, b.i) });
  });
  // malzeme türü adları (dünya dışa aktarımıyla aynı kural, kısaltılmış)
  const G = await import('/src/engine/gfx.js');
  const gor = new Set();
  for (const o of objs) o.traverse(m => {
    if (!m.isMesh) return;
    for (const mt of Array.isArray(m.material) ? m.material : [m.material]) {
      if (gor.has(mt)) continue; gor.add(mt);
      const s = mt.onBeforeCompile ? mt.onBeforeCompile.toString() : '';
      mt.name = 'kk_' + (s.includes('vWP') ? 'tas' : mt.type == 'MeshBasicMaterial' ? (mt.blending == 2 ? 'isik' : 'temel') : 'duz');
    }
  });
  const glb = await new GLTFExporter().parseAsync(objs, { binary: true, onlyVisible: false });
  const u = new Uint8Array(glb); let s = '';
  for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode.apply(null, u.subarray(i, i + 8192));
  return { b64: btoa(s), veri, n: objs.length };
});
const adn = `asama_${bi}_${tohum}`;
fs.writeFileSync(`${out}/${adn}.glb`, Buffer.from(res.b64, 'base64'));
fs.writeFileSync(`${out}/${adn}.json`, JSON.stringify(res.veri));
const v = res.veri;
console.log(adn, 'nesne', res.n, 'sandık', v.CH.length, 'tapınak', v.SH.length, 'tüccar/kazan', v.NP.length, 'kapı', v.GATE ? 'var' : 'yok', 'çömlek', v.POT.length, 'kırılabilir', v.BRK.length, 'güç', v.PU.length, 'mezar', v.MZ.length, 'kös', v.KS.length);
console.log('kırılabilir türleri', [...new Set(v.BRK.map(b => b.ty))].join(','), 'gümüş çömlek', v.POT.filter(p => p.sv).length, 'büyük', v.POT.filter(p => p.big).length);
console.log('tapınak türleri', [...new Set(v.SH.map(s => s.t))].join(','), 'NP', [...new Set(v.NP.map(n => n.t))].join(','));
console.log('hata:', errs.length ? errs.slice(0, 3) : 'yok');
await br.close();
