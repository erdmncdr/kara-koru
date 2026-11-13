// engine/glbdusman.js · Kara Koru
// Sıradan düşmanların Tripo modelleri. Boss'lardan farklı bir yol: düşmanlar yüzlercesi tek çizim çağrısında çizilir (engine/iskin.js)
// ve hareketleri kodla üretilir (geo/anim.js), model başına klip oynatılamaz. Model, oyunun on dört kemikli düşman iskeletine
// aktarılmış hâlde gelir (tools/dusman-aktar.mjs: ağırlıklar on dört kemiğe toplanmış, duruş oyunun dinlenme duruşuna getirilmiş, boy
// eşlenmiş). Burada yalnız geometri ve iskelet verisi (skData biçimi: { g, bones, eyes, info }) ile dokulu malzeme kurulur; iskelet
// örneği, toplu çizim, hareket, havuz ve vuruş flaşı aynen eski yoldan sürer. Dosya inmemişse ya da tür desteklenmiyorsa kodla kurulan
// gövde kullanılır (game/creatures.js mkE).
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as T from 'three';
import { meshyOn } from './glbhero.js';
import { RIMU } from './renderer.js';

const U = n => new URL(`../assets/model/${n}.glb`, import.meta.url).href;
// taban sınıf (data/enemies.js t) → model
const URLS = { 0: U('d_gulyabani'), 2: U('d_tasdev'), 4: U('d_okcu'), 5: U('d_karakoncolos') };
const LD = new GLTFLoader(), ham = {}, bekle = {}, veri = {};

// aşama kurulurken çağrılır: dosyalar arkada iner
export function glbDusmanHazirla() {
  if (!meshyOn()) return;
  for (const t of Object.keys(URLS)) {
    if (ham[t] || bekle[t]) continue;
    bekle[t] = LD.loadAsync(URLS[t]).then(g => {
      let ag = null;
      g.scene.updateMatrixWorld(true);
      g.scene.traverse(o => { if (o.isSkinnedMesh && !ag) ag = o; });
      if (ag) ham[t] = ag;
    }).catch(e => { delete bekle[t]; console.warn('Düşman modeli yüklenemedi', t, e); });
  }
}

// dosyaların inmesini bekler (dışa aktarım aracı: tools/unity-yaratik.mjs)
export const glbDusmanBekle = () => Promise.all(Object.values(bekle));

function malzeme(map, renk) {
  const m = new T.MeshStandardMaterial({ map, vertexColors: false, roughness: .78, metalness: 0 });
  m.color.setRGB(1.1, 1.1, 1.1);
  if (renk) m.color.multiply(renk);
  m.emissiveMap = map;
  m.emissive.setRGB(1, 1, 1);
  m.emissiveIntensity = .14;
  // kenar ışığı (renderer.js rimify ile aynı terim)
  m.onBeforeCompile = sh => {
    sh.uniforms.rimCol = RIMU;
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 rimCol;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n{float rimF=1.0-clamp(dot(normal,normalize(vViewPosition)),0.0,1.0);totalEmissiveRadiance+=rimCol*(rimF*rimF*rimF);}');
  };
  m.customProgramCacheKey = () => 'dusrim';
  return m;
}

// key: havuz anahtarı (tür çeşitlemesi başına ayrı veri: renk malzemede). info0: kodla kurulan gövdenin hareket bilgisi (yürüyüş ölçüleri);
// bacak ölçüleri yeni iskeletten yeniden hesaplanır. tint: [renk, oran] (data/enemies.js; eski gövdede köşe rengine işleniyordu)
export function glbDusman(t, key, info0, tint) {
  if (veri[key]) return veri[key];
  const ag = ham[t];
  if (!ag) return null;
  const g0 = ag.geometry, g = new T.BufferGeometry(), n = g0.attributes.position.count;
  // dosyada köşe verileri iç içe (interleaved) durur: ham tampon değil, öğe öğe okunur
  const kop = (ad, k) => { const a = g0.attributes[ad], d = new Float32Array(n * k); for (let i = 0; i < n; i++) for (let j = 0; j < k; j++) d[i * k + j] = a.getComponent(i, j); return new T.Float32BufferAttribute(d, k); };
  g.setAttribute('position', kop('position', 3));
  g.setAttribute('normal', kop('normal', 3));
  g.setAttribute('uv', kop('uv', 2));
  if (g0.index) g.setIndex(g0.index);
  g.setAttribute('skinIndex', kop('skinIndex', 4));
  g.setAttribute('skinWeight', kop('skinWeight', 4));
  // hayalet, altın, gümüş gibi durum malzemeleri köşe rengiyle çizer: beyaz
  g.setAttribute('color', new T.Float32BufferAttribute(new Float32Array(n * 3).fill(1), 3));
  const ks = ag.skeleton.bones, v = new T.Vector3(),
    bones = ks.map(b => ({ n: b.name, pi: ks.indexOf(b.parent), h: b.getWorldPosition(v).toArray() })),
    H = Object.fromEntries(bones.map(b => [b.n, b.h]));
  // bacak ölçüleri (geo/models.js S.info.leg): kalça eklemine göre diz, dize göre bilek, bileğe göre topuk ve parmak ucu ([y, z])
  let topuk = 0, uc = 0;
  { const p = g0.attributes.position, si = g0.attributes.skinIndex, sw = g0.attributes.skinWeight, fi = bones.findIndex(b => b.n == 'ft0');
    for (let i = 0; i < n; i++) for (let j = 0; j < 4; j++) if (si.getComponent(i, j) == fi && sw.getComponent(i, j) > .5) { const z = p.getZ(i) - H.ft0[2]; topuk = Math.min(topuk, z); uc = Math.max(uc, z); } }
  const info = { ...info0, hy0: H.hip[1], leg: { k: [H.sh0[1] - H.th0[1], H.sh0[2] - H.th0[2]], a: [H.ft0[1] - H.sh0[1], H.ft0[2] - H.sh0[2]], h: [-H.ft0[1], topuk], t: [-H.ft0[1], uc], hjy: H.th0[1], s0: 0 } };
  const renk = tint ? new T.Color(1, 1, 1).lerp(new T.Color(tint[0]), tint[1] * .8) : null;
  return (veri[key] = { g, bones, eyes: [], info, mat: malzeme(ag.material.map, renk), glb: 1 });
}
