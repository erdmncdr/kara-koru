// Hareket kliplerini bir iskeletten başka bir iskelete çevirir (Meshy iskeletinde üretilmiş klipler → Tripo iskeletli model).
// İki servisin iskeletleri dinlenme duruşunda farklı kurulu (kemiklerin yerel eksenleri ve kolların açısı): klipteki yerel dönüşler
// başka iskelette anlamsız. Çeviri dünya uzayında yapılır:
//   D(t)  = kaynak kemiğin dünya dönüşü(t) × kaynak dinlenme dünya dönüşünün tersi       (kemik dinlenmeden ne kadar döndü)
//   Wh(t) = D(t) × C × hedef dinlenme dünya dönüşü                                         (aynı dönüş hedef kemiğe)
//   C: hedef kemiğin dinlenme yönünü (kemik → çocuk) kaynağınkine çeviren düzeltme; iki dinlenme duruşunda kolların, bacakların
//      açısı farklıysa kapatır. Çocuğu eşleşmeyen kemik (el, parmak ucu) ebeveyninin düzeltmesini alır.
//   yerel(t) = hedef ebeveynin dünya dönüşünün tersi × Wh(t)
// Kalça konumu: kaynaktaki dünya yer değiştirmesi iki iskeletin kalça yüksekliği oranıyla ölçeklenir.
// Hedef modelde kemik adları kaynağınkilerle aynı olmalı ve model aynı yöne (+Z) bakmalı: Tripo modeli önce tools/tripo-ad.mjs'ten geçer.
// Hedefte olup kaynakta olmayan kemikler (parmaklar) dinlenme duruşunda kalır.
//
//   GLTFT=<@gltf-transform node_modules> node tools/klip-aktar.mjs <hedef model.glb> <kaynak dinlenme iskeleti.glb> <çıkış.glb> <klip.glb[=ad:yeniAd,ad2:yeniAd2]> ...
//   kaynak dinlenme iskeleti: Meshy'nin iskeletli ham modeli (rigged_character.glb). Çıkış: hedef iskelet + çevrilmiş klipler (ağ yok).
//   Klip dosyasından sonra = ile yalnız adı verilen klipler alınır ve yeniden adlandırılır (* dosyadaki her klip).
import { createRequire } from 'node:module';
import path from 'node:path';

const kok = process.env.GLTFT;
if (!kok) { console.error('GLTFT ortam değişkeni gerekli'); process.exit(2); }
const { NodeIO } = createRequire(path.join(path.resolve(kok), 'x.js'))('@gltf-transform/core');
globalThis.self = globalThis;
const T = await import('three'), { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
const [hedefYol, kaynakYol, cikis, ...klipler] = process.argv.slice(2);
const FPS = 30, io = new NodeIO();

// yalnız iskelet: ağ, deri, malzeme ve doku atılır (three Node'da doku açamaz)
async function iskelet(yol, klipKalsin) {
  const d = await io.read(yol), r = d.getRoot();
  for (const n of r.listNodes()) { n.setMesh(null); n.setSkin(null); }
  for (const x of [...r.listMeshes(), ...r.listSkins(), ...r.listMaterials(), ...r.listTextures()]) x.dispose();
  if (!klipKalsin) for (const a of r.listAnimations()) a.dispose();
  return d;
}
const yukle = async d => { const b = await io.writeBinary(d); return new Promise((res, rej) => new GLTFLoader().parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), '', res, rej)); };

const hDoc = await iskelet(hedefYol), hS = (await yukle(hDoc)).scene, kS = (await yukle(await iskelet(kaynakYol))).scene;
hS.updateMatrixWorld(true); kS.updateMatrixWorld(true);

// kemik → yönü belirleyen çocuk; null: ebeveynin düzeltmesini al
const COCUK = { Hips: 'Spine02', Spine02: 'Spine01', Spine01: 'Spine', Spine: 'neck', neck: 'Head', Head: 'head_end', head_end: null };
for (const y of ['Left', 'Right']) Object.assign(COCUK, { [y + 'Shoulder']: y + 'Arm', [y + 'Arm']: y + 'ForeArm', [y + 'ForeArm']: y + 'Hand', [y + 'Hand']: null, [y + 'UpLeg']: y + 'Leg', [y + 'Leg']: y + 'Foot', [y + 'Foot']: y + 'ToeBase', [y + 'ToeBase']: null });
const wq = o => o.getWorldQuaternion(new T.Quaternion()), wp = o => o.getWorldPosition(new T.Vector3());
const B = []; // hedef sırasıyla (ebeveyn önce) eşleşen kemikler
hS.traverse(h => { if (!(h.name in COCUK)) return; const k = kS.getObjectByName(h.name); if (k) B.push({ ad: h.name, h, k }); });
const bul = ad => B.find(b => b.ad == ad);
for (const b of B) {
  b.hr = wq(b.h); b.kri = wq(b.k).invert();
  const cocuk = COCUK[b.ad], hc = cocuk && hS.getObjectByName(cocuk), kc = cocuk && kS.getObjectByName(cocuk);
  if (hc && kc) {
    const dh = wp(hc).sub(wp(b.h)).normalize(), dk = wp(kc).sub(wp(b.k)).normalize();
    b.C = new T.Quaternion().setFromUnitVectors(dh, dk);
    b.aci = Math.round(dh.angleTo(dk) * 57.3);
  }
}
for (const b of B) if (!b.C) { let p = b.h.parent; while (p && !(bul(p.name) && bul(p.name).C)) p = p.parent; b.C = p ? bul(p.name).C.clone() : new T.Quaternion(); b.aci = 'ebeveyn'; }
for (const b of B) b.taban = b.C.clone().multiply(b.hr); // C × hedef dinlenme

// bakış yönü: iki iskelette sağ kalça → sol kalça aynı yöne bakmalı
{ const yon = S => wp(S.getObjectByName('LeftUpLeg')).sub(wp(S.getObjectByName('RightUpLeg'))).setY(0).normalize(), sapma = yon(hS).angleTo(yon(kS)) * 57.3; if (sapma > 20) { console.error(`hedef model kaynağa göre ${sapma.toFixed(0)}° dönük: önce tools/tripo-ad.mjs`); process.exit(1); } }
const kalca = bul('Hips'), yuk = S => wp(S.getObjectByName('Hips')).y - Math.min(wp(S.getObjectByName('LeftToeBase') || S.getObjectByName('LeftFoot')).y, wp(S.getObjectByName('RightToeBase') || S.getObjectByName('RightFoot')).y);
const hKalca0 = wp(kalca.h), hYuk = yuk(hS), hDin = B.map(b => b.h.quaternion.clone()), hPos = kalca.h.position.clone();
console.log(`eşleşen kemik ${B.length}; dinlenme yön farkı (derece): ${B.map(b => b.ad + ' ' + b.aci).join(', ')}`);

const hNode = new Map(hDoc.getRoot().listNodes().map(n => [n.getName(), n])), buf = hDoc.getRoot().listBuffers()[0] || hDoc.createBuffer(), q = new T.Quaternion(), v = new T.Vector3();
for (const kl of klipler) {
  const [klipYol, es = ''] = kl.split('='), ad = es ? Object.fromEntries(es.split(',').map(x => x.split(':'))) : null;
  const klipG = await yukle(await iskelet(klipYol, true)), cS = klipG.scene;
  cS.updateMatrixWorld(true);
  // kalça: iki iskeletin ayak tabanına göre kalça yüksekliği oranı (klip dosyasının kendi iskeleti)
  for (const b of B) { b.c = cS.getObjectByName(b.ad); if (!b.c) throw new Error(klipYol + ': kemik yok ' + b.ad); }
  const oran = hYuk / yuk(cS), cKalca0 = wp(kalca.c), mixer = new T.AnimationMixer(cS);
  console.log(`${path.basename(klipYol)}: kalça yüksekliği oranı ${oran.toFixed(4)}`);
  for (const klip of klipG.animations) {
    const yeni = ad ? ad[klip.name] || ad['*'] : klip.name;
    if (!yeni) continue;
    // hedef iskelet dinlenmeye: kalça oranı ve ebeveyn dönüşleri önceki klipten etkilenmesin
    B.forEach((b, j) => b.h.quaternion.copy(hDin[j])); kalca.h.position.copy(hPos); hS.updateMatrixWorld(true);
  mixer.stopAllAction();
  const a = mixer.clipAction(klip); a.play();
  const n = Math.max(2, Math.round(klip.duration * FPS) + 1), zaman = new Float32Array(n), R = B.map(() => new Float32Array(n * 4)), P = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const t = Math.min(klip.duration - 1e-4, i / (n - 1) * klip.duration);
    zaman[i] = i / (n - 1) * klip.duration;
    a.time = t; mixer.update(0); cS.updateMatrixWorld(true);
    B.forEach((b, j) => {
      // D × taban, sonra hedef ebeveynin (az önce yazılan) dünya dönüşüne göre yerel
      const W = wq(b.c).multiply(b.kri).multiply(b.taban), pi = b.h.parent.getWorldQuaternion(q).invert();
      b.h.quaternion.copy(pi.multiply(W)).normalize();
      // önceki kareyle aynı yarımküre: aradeğerleme uzun yoldan dönmesin
      if (i) { const o = R[j], k = (i - 1) * 4; if (o[k] * b.h.quaternion.x + o[k + 1] * b.h.quaternion.y + o[k + 2] * b.h.quaternion.z + o[k + 3] * b.h.quaternion.w < 0) b.h.quaternion.set(-b.h.quaternion.x, -b.h.quaternion.y, -b.h.quaternion.z, -b.h.quaternion.w); }
      b.h.quaternion.toArray(R[j], i * 4);
      if (b === kalca) {
        v.copy(wp(b.c)).sub(cKalca0).multiplyScalar(oran).add(hKalca0);
        b.h.parent.updateWorldMatrix(true, false);
        b.h.parent.worldToLocal(v).toArray(P, i * 3);
        b.h.position.copy(v);
      }
      b.h.updateWorldMatrix(true, false);
    });
  }
  const y = hDoc.createAnimation(yeni), giris = hDoc.createAccessor().setType('SCALAR').setArray(zaman).setBuffer(buf);
  const iz = (dugum, yol, tip, dizi) => { const s = hDoc.createAnimationSampler().setInput(giris).setOutput(hDoc.createAccessor().setType(tip).setArray(dizi).setBuffer(buf)).setInterpolation('LINEAR'); y.addSampler(s).addChannel(hDoc.createAnimationChannel().setTargetNode(dugum).setTargetPath(yol).setSampler(s)); };
  B.forEach((b, j) => iz(hNode.get(b.ad), 'rotation', 'VEC4', R[j]));
  iz(hNode.get('Hips'), 'translation', 'VEC3', P);
  console.log(`  ${yeni} ${klip.duration.toFixed(2)} sn, ${n} kare`);
}
}
await io.write(cikis, hDoc);
console.log('→', cikis);
