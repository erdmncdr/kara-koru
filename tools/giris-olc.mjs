// Elde taşınanların (kılıç, kalkan, asa) gövdenin içinden geçip geçmediğini ölçer. Kahraman sayfasında modeli her duruşun birkaç
// anında dondurur, gövdenin derili ağını o duruşta düz ağa çevirir ve eldeki her nesnenin köşelerinden ışın atar: ışın gövde
// yüzeyini tek sayıda keserse köşe gövdenin içindedir. Tutulan yerin (yumruk, ön kol) yakınındaki köşeler sayılmaz.
// node tools/giris-olc.mjs <url>   (HERO=kam; GPU=1; CHROME ortam değişkeni Chrome yolunu verir; AYR=1: içerideki köşelerin en yakın kemiği ve örnek anı başına sayısı)
// Çıktı: duruş × nesne için içeride kalan köşe yüzdesi ve en derin giriş (boyun yüzdesi). Hepsi 0 ise hiçbir şey gövdeye girmiyor.
import { chromium } from 'playwright';
const [url] = process.argv.slice(2), HERO = process.env.HERO || 'alp';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const br = await chromium.launch({ executablePath: process.env.CHROME, headless: true, args: process.env.GPU ? ['--use-angle=metal', '--ignore-gpu-blocklist'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await br.newPage({ viewport: { width: 900, height: 600 } });
const errs = []; pg.on('pageerror', e => errs.push(e.message));
await pg.addInitScript(() => { Element.prototype.requestPointerLock = function () {}; localStorage.setItem('kk_set', JSON.stringify({ q: 0, bl: 0 })); localStorage.setItem('kk_tut', '1'); localStorage.setItem('kk_ci', '0'); });
await pg.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
await pg.waitForFunction(() => typeof S !== 'undefined' && S === 'menu' && !!window.MSEL, null, { timeout: 90000 });
await pg.evaluate(h => { const i = CR.findIndex(c => c.k == h); menuPage('kahraman'); selC(i ? 0 : 1, 1); selC(i, 1); }, HERO);
await pg.waitForFunction(h => window.__glb && window.__glb.H === H && CR[CI].k == h, HERO, { timeout: 60000 }); await sleep(1200);
// duruş, klip, örnek anları (sn). Saldırılar kahramanın saldırı aralığına (G.sal) yayılır
const ANLAR = [['bekle', 'idle', [.2, 1.2, 2.4, 3.6]], ['savas', 'combat', [.1, .6, 1.1, 1.6]], ['sag_savurus', 'atkR', [0, .25, .5, .75, 1]], ['sol_savurus', 'atkL', [0, .25, .5, .75, 1]],
  ['yuru', 'walk', [0, .15, .3, .45, .6, .75, .9]], ['kos', 'run', [0, .08, .16, .24, .32, .4, .48]], ['zipla', 'jump', [.5, .8, 1.1]], ['takla', 'flip', [1.3, 1.6]], ['atil', 'dash', [.2, .45, .7]], ['kay', 'slide', [.2, .37]], ['darbe', 'hit', [.2, .5, .8]]];
const son = await pg.evaluate(async ([ANLAR, AYR]) => {
  const G = window.__glb, T = window.__T, T3 = T.Vector3, h0 = G.h0;
  G.dondur = 1;
  // eldeki nesneler: bir kemiğe bağlı, derisiz ağlar (kemiğin doğrudan çocuğu olan kap başına bir nesne)
  const nes = [], sk = [];
  G.root.traverse(o => { if (o.isSkinnedMesh) sk.push(o); });
  G.root.traverse(o => {
    if (!o.isBone) return;
    for (const c of o.children) {
      if (c.isBone) continue;
      const ag = []; c.traverse(m => { if (m.isMesh && !m.isSkinnedMesh && m.visible) ag.push(m); });
      if (ag.length) nes.push({ ad: o.name, kemik: o, ag });
    }
  });
  // gövdenin düz kopyası (her duruşta köşeleri yeniden yazılır)
  const s0 = sk[0], g0 = s0.geometry, n = g0.attributes.position.count, dz = new T.BufferGeometry(), pa = new Float32Array(n * 3);
  dz.setAttribute('position', new T.BufferAttribute(pa, 3));
  dz.setIndex(g0.index);
  const duz = new T.Mesh(dz, new T.MeshBasicMaterial({ side: T.DoubleSide })), v = new T3(), rc = new T.Raycaster();
  const yon = [new T3(.31, .9, .29).normalize(), new T3(-.52, .33, .79).normalize()];
  const icte = p => { for (const d of yon) { rc.set(p, d); const h = rc.intersectObject(duz, false); let k = 0, e = -1; for (const x of h) { if (x.distance - e > 1e-5) k++; e = x.distance; } if (k % 2 == 0) return 0; } return 1; };
  // en yakın yüzeye uzaklık (kabaca): altı yönde ışın, en kısa çıkış
  const eks = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].map(a => new T3(...a));
  const derin = p => { let m = 1e9; for (const d of eks) { rc.set(p, d); const h = rc.intersectObject(duz, false); if (h[0]) m = Math.min(m, h[0].distance); } return m; };
  const kemikler = []; G.root.traverse(b => { if (b.isBone) kemikler.push(b); });
  const out = [];
  for (const [ad, k, anlar] of ANLAR) {
    const tum = ['atkR', 'atkL', 'hit'].includes(k), sat = { ad, nes: {} };
    for (let t of anlar) {
      for (const a of Object.values(G.A)) a.setEffectiveWeight(0);
      if (tum) { G.A.combat.setEffectiveWeight(1); G.A.combat.time = .6; }
      if (tum && k != 'hit' && G.sal && G.sal[k]) t = G.sal[k][0] + (G.sal[k][1] - G.sal[k][0]) * t;
      G.A[k].setEffectiveWeight(1); G.A[k].time = t; if (G.A[k + '_u']) { G.A[k + '_u'].setEffectiveWeight(1); G.A[k + '_u'].time = t; }
      for (const a of Object.values(G.A)) a.paused = false;
      G.mixer.update(0);
      if (G.tut) { G.w = tum ? { combat: 1 } : { [k]: 1 }; G.wu = tum ? 1 : 0; G.ust = tum ? k : null; G.tut(); }
      G.root.updateMatrixWorld(true);
      for (let i = 0; i < n; i++) { s0.getVertexPosition(i, v).applyMatrix4(s0.matrixWorld); pa[i * 3] = v.x; pa[i * 3 + 1] = v.y; pa[i * 3 + 2] = v.z; }
      dz.attributes.position.needsUpdate = true; dz.computeBoundingSphere(); dz.computeBoundingBox();
      for (const o of nes) {
        const kp = o.kemik.getWorldPosition(new T3()), cc = o.kemik.children.find(c => c.isBone), uc = cc ? cc.getWorldPosition(new T3()) : kp.clone();
        const r = sat.nes[o.ad] || (sat.nes[o.ad] = { top: 0, ic: 0, derin: 0, kem: {} });
        const ic0 = r.ic;
        for (const m of o.ag) {
          const p = m.geometry.attributes.position, adim = Math.max(1, Math.floor(p.count / 220));
          for (let i = 0; i < p.count; i += adim) {
            v.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld);
            // tutulan yerin çevresi: kemikten çocuğuna uzanan doğru parçasına yakın köşeler sayılmaz
            const ab = uc.clone().sub(kp), tt = ab.lengthSq() > 1e-9 ? Math.max(0, Math.min(1.6, v.clone().sub(kp).dot(ab) / ab.lengthSq())) : 0;
            if (v.distanceTo(kp.clone().addScaledVector(ab, tt)) < h0 * .075) continue;
            r.top++;
            if (!icte(v)) continue;
            // giren köşenin en yakın kemiği: tutan kemik ya da onun eli ise tutuşun kendisidir (kabza yumruğun içinde), sayılmaz
            let en = '', ed = 1e9; for (const b of kemikler) { const d = b.getWorldPosition(new T3()).distanceTo(v); if (d < ed) ed = d, en = b.name; }
            if (en == o.ad || (cc && en == cc.name)) { r.top--; continue; }
            r.ic++; r.derin = Math.max(r.derin, derin(v) / h0); r.kem[en] = (r.kem[en] || 0) + 1;
          }
        }
        (r.an || (r.an = [])).push(r.ic - ic0);
      }
    }
    out.push(sat);
  }
  return out;
}, [ANLAR, !!process.env.AYR]).catch(e => ({ hata: e.message }));
if (son.hata) { console.log('hata:', son.hata, errs); await br.close(); process.exit(1); }
let kotu = 0;
for (const s of son) {
  const p = Object.entries(s.nes).map(([ad, r]) => { if (r.ic) kotu++; return `${ad} %${(100 * r.ic / Math.max(1, r.top)).toFixed(1)} (derin %${(100 * r.derin).toFixed(1)})` + (process.env.AYR && r.ic ? ' ' + JSON.stringify(r.kem) + ' anlar ' + r.an.join(',') : ''); });
  console.log(s.ad.padEnd(12), p.join('   '));
}
console.log(kotu ? `${kotu} duruş-nesne çiftinde gövdeye giriş var` : 'gövdeye giriş yok', errs.length ? errs.slice(0, 3) : '');
await br.close();
