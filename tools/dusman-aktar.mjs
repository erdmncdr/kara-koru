// Tripo'nun iskeletli (Mixamo adlı, 65 kemik) modelini oyunun düşman iskeletine aktarır.
// Sıradan düşmanlar yüzlercesi tek çizim çağrısıyla çizilir (engine/iskin.js) ve hareketleri kodla üretilir (geo/anim.js): on dört
// kemik (hip, sp, ch, hd, ua0/fa0, th0/sh0/ft0, ua1/fa1, th1/sh1/ft1), dinlenmede dönüşsüz, dünya eksenlerine hizalı. Boss'lardaki
// gibi model başına klip oynatılamaz. Bu araç yeni ağı o on dört kemiğe bağlar; oyun tarafında iskelet, hareket ve toplu çizim aynı kalır:
//   1. Mixamo kemikleri on dört kemiğe eşlenir, köşe ağırlıkları toplanır (parmaklar ön kola, ayak ucu ayağa ...).
//   2. Model, oyunun dinlenme duruşuna getirilir: her kemik, çocuğuna bakan yönü oyun iskeletindekiyle aynı olacak biçimde döndürülür
//      (Tripo A duruşunda kollar 45° açık, oyunda aşağı sarkık; gulyabani öne eğik) ve ağ bu duruşta yeniden hesaplanır.
//   3. Boy, oyun gövdesinin boyuna ölçeklenir; ayak tabanı y = 0'a, kalça x/z = oyun kalçasına gelir.
// Çıkış: düz GLB. Tek ağ (POSITION, NORMAL, TEXCOORD_0, JOINTS_0, WEIGHTS_0), on dört eklemli deri (eklem düğümleri oyun adlarıyla,
// dünya konumu = yeni dinlenme eklem yeri), yalnız renk dokusu.
//   GLTFT=<@gltf-transform node_modules> node tools/dusman-aktar.mjs <tripo model.glb> <oyun iskeleti.json> <çıkış.glb>
//   oyun iskeleti.json: { boy, kemik: [{ n, pi, h:[x,y,z] }] }  (oyundan dökülür: tools/dusman-iskelet.mjs)
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';

const kok = process.env.GLTFT;
if (!kok) { console.error('GLTFT ortam değişkeni gerekli'); process.exit(2); }
const req = createRequire(path.join(path.resolve(kok), 'x.js')), { NodeIO, Document } = req('@gltf-transform/core');
const T = await import('three');
const [giris, iskYol, cikis] = process.argv.slice(2), io = new NodeIO(), doc = await io.read(giris), root = doc.getRoot();
const OY = JSON.parse(fs.readFileSync(iskYol, 'utf8')), OK = OY.kemik, oyAd = OK.map(k => k.n);

// Mixamo kemiği → oyun kemiği (0 sol: oyunun ua0'ı -x'te). Tripo modelinde hangi yan -x'te kalıyorsa o yan 0 olur (aşağıda ölçülür)
const ad = n => n.getName().replace(/^mixamorig:/, '');
function hedef(a, sol0) {
  const y = /^Left/.test(a) ? (sol0 ? 0 : 1) : /^Right/.test(a) ? (sol0 ? 1 : 0) : -1, g = a.replace(/^(Left|Right)/, '');
  if (a == 'Hips') return 'hip';
  if (a == 'Spine') return 'sp';
  if (a == 'Spine1' || a == 'Spine2') return 'ch';
  if (/^(Neck|Head)/.test(a)) return 'hd';
  if (g == 'Shoulder' || g == 'Arm') return 'ua' + y;
  if (g == 'ForeArm' || /^Hand/.test(g)) return 'fa' + y;
  if (g == 'UpLeg') return 'th' + y;
  if (g == 'Leg') return 'sh' + y;
  if (g == 'Foot' || /^Toe/.test(g)) return 'ft' + y;
  return null;
}

// ---- iskelet: deri, eklemler, dünya matrisleri
const ag = root.listNodes().find(n => n.getMesh() && n.getSkin()), deri = ag.getSkin(), eklem = deri.listJoints(), prim = ag.getMesh().listPrimitives()[0];
const M = n => new T.Matrix4().fromArray(n.getWorldMatrix()), W0 = eklem.map(M), wp = i => new T.Vector3().setFromMatrixPosition(W0[i]);
const bul = a => eklem.findIndex(n => ad(n) == a);
// model hangi yöne bakıyor: kalça eksenine dik yön (ayak ucu açık basabildiği için yalnız işareti verir); +z'ye çevrilir
const yan0 = wp(bul('LeftUpLeg')).sub(wp(bul('RightUpLeg'))).setY(0).normalize(), ileri0 = new T.Vector3(-yan0.z, 0, yan0.x), uc0 = wp(bul('LeftToeBase')).sub(wp(bul('LeftFoot'))).setY(0);
if (ileri0.dot(uc0) < 0) ileri0.negate(); // kalça eksenine dik iki yönden ayak ucunun baktığı
const don = Math.atan2(ileri0.x, ileri0.z);
const R0 = new T.Matrix4().makeRotationY(-don); // modeli +z'ye çevirir
for (const m of W0) m.premultiply(R0);
const sol0 = wp(bul('LeftUpLeg')).x < 0; // Left -x'te mi (oyunun 0 yanı)
const harita = eklem.map(n => hedef(ad(n), sol0));
console.log(`eklem ${eklem.length}, eşlenmeyen: ${eklem.filter((n, i) => !harita[i]).map(ad).join(',') || 'yok'}; model ${(don * 57.3).toFixed(0)}° döndü; Left ${sol0 ? '-x (0)' : '+x (1)'}`);

// ---- 2. duruş düzeltmesi: oyun kemiğinin çocuğuna yönü ↔ Tripo'da aynı zincirin yönü
// zincir: oyun kemiği → (Tripo başlangıç eklemi, Tripo bitiş eklemi)
const Y = y => (sol0 ? ['Left', 'Right'] : ['Right', 'Left'])[y];
const ZINCIR = { hip: ['Hips', 'Neck'], sp: ['Spine', 'Spine1'], ch: ['Spine1', 'Neck'], hd: ['Neck', 'HeadTop_End'] };
for (const y of [0, 1]) Object.assign(ZINCIR, { ['ua' + y]: [Y(y) + 'Arm', Y(y) + 'ForeArm'], ['fa' + y]: [Y(y) + 'ForeArm', Y(y) + 'Hand'], ['th' + y]: [Y(y) + 'UpLeg', Y(y) + 'Leg'], ['sh' + y]: [Y(y) + 'Leg', Y(y) + 'Foot'], ['ft' + y]: [Y(y) + 'Foot', Y(y) + 'ToeBase'] });
// oyun kemiğinin yönü: ilk çocuğuna (yoksa null: ebeveynin düzeltmesi sürer)
const oyYon = {}, oyH = Object.fromEntries(OK.map(k => [k.n, new T.Vector3(...k.h)]));
for (const k of OK) { const c = OK.find(x => x.pi == OK.indexOf(k) && !/^(ua|th)/.test(x.n)) || (k.n == 'ch' ? OK.find(x => x.n == 'hd') : null); oyYon[k.n] = c ? oyH[c.n].clone().sub(oyH[k.n]).normalize() : null; }
// gövde: tek eğim (kalça → göğüs). Omurga kemikleri ayrı ayrı eşlenmez: oyunda baş eklemi öne çıkık durur (boyun payı), göğüs → baş yönü
// eşlenince model 70° bükülüp yere bakıyordu. Baş, eğimin BAS_GERI kadarını geri alır (öne baksın)
oyYon.hip = oyH.ch.clone().sub(oyH.hip).normalize(); oyYon.sp = null; oyYon.ch = null;
const BAS_GERI = +(process.env.BAS_GERI || .75);
// oyun kemiği başına dünya dönüşü düzeltmesi (hiyerarşik: çocuk, ebeveynin düzeltmesini devralır, üstüne kendi farkını ekler)
const duz = {}, sira = ['hip', 'sp', 'ch', 'hd', 'ua0', 'fa0', 'ua1', 'fa1', 'th0', 'sh0', 'ft0', 'th1', 'sh1', 'ft1'];
const ebeveyn = n => { const k = OK.find(x => x.n == n); return k.pi < 0 ? null : OK[k.pi].n; };
for (const n of sira) {
  const p = ebeveyn(n), Q = p ? duz[p].clone() : new T.Quaternion(), [a, b] = ZINCIR[n];
  const ia = bul(a), ib = bul(b);
  if (oyYon[n] && ia >= 0 && ib >= 0) {
    const d = wp(ib).sub(wp(ia)).normalize().applyQuaternion(Q); // ebeveynin düzeltmesinden sonraki yön
    // ayak: yalnız yatay yön düzeltilir (taban yerde kalsın); baş: düzeltilmez (ebeveyninki)
    Q.premultiply(new T.Quaternion().setFromUnitVectors(d, oyYon[n]));
    console.log(`  ${n}: ${(wp(ib).sub(wp(ia)).normalize().angleTo(oyYon[n]) * 57.3).toFixed(0)}°`);
  }
  if (n == 'hd') Q.copy(new T.Quaternion().slerp(duz.ch, 1 - BAS_GERI)); // gövde eğiminin bir kısmı
  duz[n] = Q;
}
// yeni duruşta eklem dünya matrisleri: her oyun kemiğinin Tripo başlangıç eklemi, ebeveyn zincirinden yerine konur
// P'(eklem) = P'(ebeveyn oyun kemiğinin ekleminin yeni yeri) + Qebeveyn × (P − Pebeveyn)
const yeniP = {}, basla = n => bul(ZINCIR[n][0]);
for (const n of sira) { const p = ebeveyn(n); yeniP[n] = p ? yeniP[p].clone().add(wp(basla(n)).sub(wp(basla(p))).applyQuaternion(duz[p])) : wp(basla(n)); }
// köşe dönüşümü: v' = yeniP[k] + Q[k] × (v − P[k]), ağırlıkla karışır
const P = prim.getAttribute('POSITION'), N = prim.getAttribute('NORMAL'), UV = prim.getAttribute('TEXCOORD_0'), J = prim.getAttribute('JOINTS_0'), Wg = prim.getAttribute('WEIGHTS_0'), IX = prim.getIndices();
const agM = M(ag).premultiply(R0), nm = new T.Matrix3().getNormalMatrix(agM);
const n = P.getCount(), pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), ji = new Uint8Array(n * 4), jw = new Float32Array(n * 4);
const v = new T.Vector3(), vn = new T.Vector3(), t = new T.Vector3(), tn = new T.Vector3(), a4 = [0, 0, 0, 0], w4 = [0, 0, 0, 0], e3 = [0, 0, 0];
const P0 = Object.fromEntries(sira.map(k => [k, wp(basla(k))]));
let bos = 0;
for (let i = 0; i < n; i++) {
  P.getElement(i, e3); v.fromArray(e3).applyMatrix4(agM); N.getElement(i, e3); vn.fromArray(e3).applyMatrix3(nm).normalize();
  J.getElement(i, a4); Wg.getElement(i, w4);
  const top = {};
  for (let k = 0; k < 4; k++) { if (w4[k] <= 0) continue; const h = harita[a4[k]] || 'hip'; top[h] = (top[h] || 0) + w4[k]; }
  if (!Object.keys(top).length) { top.hip = 1; bos++; } // ağırlıksız köşe: toplu çizimde sıfır matris normali bozar (NaN, ekran kararır)
  const e = Object.entries(top).sort((x, y) => y[1] - x[1]).slice(0, 4), s = e.reduce((x, y) => x + y[1], 0) || 1;
  t.set(0, 0, 0); tn.set(0, 0, 0);
  e.forEach(([h, w], k) => {
    w /= s; ji[i * 4 + k] = oyAd.indexOf(h); jw[i * 4 + k] = w;
    t.addScaledVector(v.clone().sub(P0[h]).applyQuaternion(duz[h]).add(yeniP[h]), w);
    tn.addScaledVector(vn.clone().applyQuaternion(duz[h]), w);
  });
  t.toArray(pos, i * 3); tn.normalize().toArray(nor, i * 3);
}
// ---- 3. ölçek ve yer: boy oyun gövdesinin boyuna, taban y = 0, kalça x = 0
let y0 = 1e9, y1 = -1e9; for (let i = 0; i < n; i++) { y0 = Math.min(y0, pos[i * 3 + 1]); y1 = Math.max(y1, pos[i * 3 + 1]); }
const s = OY.boy / (y1 - y0), kx = yeniP.hip.x, kz = yeniP.hip.z - oyH.hip.z / s;
for (let i = 0; i < n; i++) { pos[i * 3] = (pos[i * 3] - kx) * s; pos[i * 3 + 1] = (pos[i * 3 + 1] - y0) * s; pos[i * 3 + 2] = (pos[i * 3 + 2] - kz) * s; }
const H = Object.fromEntries(sira.map(k => [k, new T.Vector3((yeniP[k].x - kx) * s, (yeniP[k].y - y0) * s, (yeniP[k].z - kz) * s)]));
console.log(`ölçek ${s.toFixed(3)}, boy ${OY.boy}; eklemler (yeni / oyun): ${OK.map(k => `${k.n} ${H[k.n].toArray().map(x => x.toFixed(2)).join('/')} | ${k.h.join('/')}`).join('; ')}`);

// ---- çıkış belgesi
const d2 = new Document(), buf = d2.createBuffer(), sahne = d2.createScene('dusman'), kokD = d2.createNode('dusman');
sahne.addChild(kokD);
const dug = OK.map(k => d2.createNode(k.n));
OK.forEach((k, i) => { const p = k.pi < 0 ? new T.Vector3() : H[OK[k.pi].n]; dug[i].setTranslation(H[k.n].clone().sub(p).toArray()); (k.pi < 0 ? kokD : dug[k.pi]).addChild(dug[i]); });
const ibm = new Float32Array(16 * OK.length);
OK.forEach((k, i) => new T.Matrix4().makeTranslation(-H[k.n].x, -H[k.n].y, -H[k.n].z).toArray(ibm, i * 16));
const sk = d2.createSkin('dusman').setInverseBindMatrices(d2.createAccessor().setType('MAT4').setArray(ibm).setBuffer(buf));
dug.forEach(x => sk.addJoint(x)); sk.setSkeleton(dug[0]);
const mat0 = prim.getMaterial(), tex0 = mat0 && mat0.getBaseColorTexture(), mt = d2.createMaterial('dusman').setMetallicFactor(0).setRoughnessFactor(.8).setDoubleSided(false);
if (tex0) mt.setBaseColorTexture(d2.createTexture('renk').setImage(tex0.getImage()).setMimeType(tex0.getMimeType()));
const uv = new Float32Array(n * 2); for (let i = 0; i < n; i++) { UV.getElement(i, e3); uv[i * 2] = e3[0]; uv[i * 2 + 1] = e3[1]; }
const A = (tip, dizi) => d2.createAccessor().setType(tip).setArray(dizi).setBuffer(buf);
const pr = d2.createPrimitive().setAttribute('POSITION', A('VEC3', pos)).setAttribute('NORMAL', A('VEC3', nor)).setAttribute('TEXCOORD_0', A('VEC2', uv)).setAttribute('JOINTS_0', A('VEC4', ji)).setAttribute('WEIGHTS_0', A('VEC4', jw)).setIndices(A('SCALAR', new Uint32Array(IX.getArray()))).setMaterial(mt);
kokD.addChild(d2.createNode('ag').setMesh(d2.createMesh('dusman').addPrimitive(pr)).setSkin(sk));
await io.write(cikis, d2);
let bozuk = 0; for (const x of pos) if (x !== x) bozuk++; for (const x of nor) if (x !== x) bozuk++;
console.log(`→ ${cikis}: ${n} köşe, ${IX.getCount() / 3} üçgen; ağırlıksız köşe ${bos}, bozuk değer ${bozuk}`);
