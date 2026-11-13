// engine/glbprop.js · Kara Koru
// Dünya nesnelerinin modelleri. Meshy: sandık, altın sandık, Ocak, Balbal, Boss Kapısı, cadı kazanı, tüccar. Tripo (13 Kasım 2026): kan sunağı,
// kara sunak, açgözlülük taşı, tabut, çömlek. Çizim Codex; tek resimden model, iskelet yok. Tripo modelinin önü +X'e bakar (don ile +Z'ye çevrilir). Oyun nesneyi hâlâ eski koduyla kurar (yeri, etkileşimi, ışıması ona bağlı);
// model inince eski ağ gizlenir ve GLB aynı yere, eski ağın boyuna göre ölçeklenip takılır. Yüklenemezse eski ağ kalır.
// Her model bir kez indirilip ayrıştırılır; sahnedeki kopyalar geometri ve malzemeyi paylaşır.
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as T from 'three';
import { meshyOn } from './glbhero.js';

const U = n => new URL(`../assets/model/${n}.glb`, import.meta.url).href;
const TRIPO_ON = -Math.PI / 2;
// boy: eski ağın yüksekliğinin katı. don: y ekseninde dönüş (radyan; Meshy modelin önünü resimdeki bakışa göre kurar).
// yer: yerden pay (eski ağın boyunun oranı). gen: boy yerine genişliğe göre eşle (kapı: açıklık geçide uysun)
export const PROP = {
  sandik: { url: U('n_sandik'), boy: 1.25, don: 0, yer: 0 },
  altinsandik: { url: U('n_altinsandik'), boy: 1.3, don: 0, yer: 0 },
  ocak: { url: U('n_ocak'), boy: 2.3, don: 0, yer: 0 }, // eski ağ alçak bir taş kaideydi: aynı boyda model oyuncunun dizinde kalıyordu
  balbal: { url: U('n_balbal'), boy: 1, don: 0, yer: 0 },
  kapi: { url: U('n_kapi'), boy: 1, don: 0, yer: 0 },
  kazan: { url: U('n_kazan'), boy: 1, don: 0, yer: 0 },
  tuccar: { url: U('n_tuccar'), boy: 1.45, don: 0, yer: 0 }, // eski gövde ayakta duran bir adamdı; tezgâh ondan uzun
  kansunak: { url: U('n_kansunak'), boy: 1.25, don: TRIPO_ON, yer: 0 },
  karasunak: { url: U('n_karasunak'), boy: 1.25, don: TRIPO_ON, yer: 0 },
  acgozluluk: { url: U('n_acgozluluk'), boy: 1.6, don: TRIPO_ON, yer: 0 },
  tabut: { url: U('n_tabut'), boy: .9, don: TRIPO_ON, yer: 0 }
};
// çömlek: yüzlercesi tek çizim çağrısı (InstancedMesh; game/objects.js potsBuild). Model inince ağ ve malzeme yerinde değiştirilir:
// geometri eski çömleğin kutusuna oturtulur (boyu POT.boy katı), örneklerin yeri, ölçeği ve gümüş rengi aynen kalır
export const POT = { url: U('n_comlek'), boy: 1.25 };
let potP = null, potH = null; // potH: hazırlanmış geometri ve malzeme (bir kez; bütün aşamalar paylaşır)
export function glbPot(inst) {
  if (!meshyOn() || !inst) return;
  const eski = inst.geometry, tak = () => { if (inst.geometry === eski) { inst.geometry = potH.geo; inst.material = potH.mat; } };
  // hazırsa hemen: aşama yeniden kurulurken eski ağ bir kare bile görünmesin
  if (potH) return tak();
  if (!potP) potP = LD.loadAsync(POT.url).catch(e => { potP = null; throw e; });
  potP.then(g => {
    if (!potH) {
      g.scene.updateMatrixWorld(true);
      const aglar = [];
      g.scene.traverse(o => { if (o.isMesh) aglar.push(o); });
      const ag = aglar[0];
      if (!ag) return;
      malzeme(ag);
      eski.computeBoundingBox();
      const geo = ag.geometry.clone().applyMatrix4(ag.matrixWorld);
      geo.rotateY(TRIPO_ON);
      geo.computeBoundingBox();
      const b0 = eski.boundingBox, b1 = geo.boundingBox, s = (b0.max.y - b0.min.y) / Math.max(1e-4, b1.max.y - b1.min.y) * POT.boy;
      geo.translate(-(b1.min.x + b1.max.x) / 2, -b1.min.y, -(b1.min.z + b1.max.z) / 2).scale(s, s, s).translate((b0.min.x + b0.max.x) / 2, b0.min.y, (b0.min.z + b0.max.z) / 2);
      potH = { geo, mat: ag.material };
    }
    tak();
  }).catch(e => console.warn('Çömlek modeli yüklenemedi', e));
}

const LD = new GLTFLoader(), cache = {};
function malzeme(o) {
  if (!o.isMesh) return;
  const mt = o.material;
  mt.metalness = 0;
  mt.roughness = .8;
  mt.color.multiplyScalar(1.1);
  if (mt.map) {
    mt.emissiveMap = mt.map;
    mt.emissive.setRGB(1, 1, 1);
    mt.emissiveIntensity = .16;
  }
}
function yukle(k) {
  if (!cache[k]) {
    cache[k] = LD.loadAsync(PROP[k].url).then(g => {
      g.scene.traverse(malzeme);
      g.scene.updateMatrixWorld(true);
      const b = new T.Box3().setFromObject(g.scene);
      return { scene: g.scene, b };
    }).catch(e => {
      delete cache[k];
      throw e;
    });
  }
  return cache[k];
}
export function glbPropHazirla(...ks) {
  if (!meshyOn()) return;
  for (const k of ks) if (PROP[k]) yukle(k).catch(() => {});
}

// grup: nesnenin grubu; eski: gizlenecek eski ağ(lar); k: PROP anahtarı. sonra: model takılınca çağrılır (kopya, ölçek)
export function glbProp(grup, eski, k, sonra) {
  if (!meshyOn() || !PROP[k] || !grup) return;
  const L = Array.isArray(eski) ? eski : [eski], p = PROP[k];
  // eski ağın yerel kutusu (grubun uzayında): boy ve taban
  const b0 = new T.Box3();
  grup.updateMatrixWorld(true);
  const ters = new T.Matrix4().copy(grup.matrixWorld).invert();
  for (const m of L) { if (!m) continue; const bb = new T.Box3().setFromObject(m); if (!bb.isEmpty()) b0.union(bb.applyMatrix4(ters)); }
  if (b0.isEmpty()) return;
  yukle(k).then(M => {
    if (!grup.parent && !grup.userData.glbBekle) return; // bu arada kaldırıldı
    const kop = M.scene.clone(true), h0 = b0.max.y - b0.min.y, h1 = Math.max(1e-4, M.b.max.y - M.b.min.y),
      w0 = Math.max(b0.max.x - b0.min.x, b0.max.z - b0.min.z), w1 = Math.max(M.b.max.x - M.b.min.x, M.b.max.z - M.b.min.z),
      s = (p.gen ? w0 / Math.max(1e-4, w1) : h0 / h1) * p.boy;
    kop.scale.setScalar(s);
    kop.rotation.y = p.don;
    // taban eski ağın tabanına, yatayda eski ağın ortasına
    const ox = (M.b.min.x + M.b.max.x) / 2, oz = (M.b.min.z + M.b.max.z) / 2, c = Math.cos(p.don), sn = Math.sin(p.don);
    kop.position.set((b0.min.x + b0.max.x) / 2 - (ox * c + oz * sn) * s, b0.min.y - M.b.min.y * s + p.yer * h0, (b0.min.z + b0.max.z) / 2 - (-ox * sn + oz * c) * s);
    kop.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    kop.userData.glbprop = k;
    for (const m of L) if (m) m.visible = false;
    grup.add(kop);
    if (sonra) sonra(kop, s, h0);
  }).catch(e => console.warn('Nesne modeli yüklenemedi', k, e));
}
