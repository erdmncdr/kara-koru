// Tripo'nun iskeletsiz modelini oyunun uçan düşman iskeletine bağlar (geo/models.js creature t == 1: hip, hd, wa0, wb0, wa1, wb1).
// Yürüyenlerden (tools/dusman-aktar.mjs) farkı: Tripo'nun otomatik iskeleti insan biçimli, kanatlıya uymaz; burada iskelet istenmez,
// ağırlıklar oyundaki yarasanın kuralıyla konumdan hesaplanır: gövde yarı genişliğinin dışında kalan köşeler kanada geçer, kanadın iç
// yarısı wa, dış yarısı wb kemiğine (geçişler yumuşak). Kanatsız türlerde (alev, hayalet) yan çıkıntılar aynı kuralla kol gibi çırpar.
// Model dik çizilir (önden bakış, kanatlar iki yana açık); en geniş yatay ekseni x'e, yüzü +z'ye getirilir.
//   GLTFT=<@gltf-transform node_modules> node tools/dusman-ucan.mjs <tripo model.glb> <çıkış.glb>
//   GEN=3.2   kanat açıklığı (oyun birimi)  ya da  BOY=1.4  gövde boyu; verilmezse GEN=3.2
//   GOVDE=.2  gövde yarı genişliği, kanat açıklığının yarısına oranla (bundan içerisi hip kemiğinde kalır)
//   DON=180   y ekseninde ek dönüş (model arkası dönük çıktıysa)
import { createRequire } from 'node:module';
import path from 'node:path';

const kok = process.env.GLTFT;
if (!kok) { console.error('GLTFT ortam değişkeni gerekli'); process.exit(2); }
const req = createRequire(path.join(path.resolve(kok), 'x.js')), { NodeIO, Document } = req('@gltf-transform/core');
const T = await import('three');
const [giris, cikis] = process.argv.slice(2), io = new NodeIO(), doc = await io.read(giris), root = doc.getRoot();
const ag = root.listNodes().find(n => n.getMesh()), prim = ag.getMesh().listPrimitives()[0];
const P = prim.getAttribute('POSITION'), N = prim.getAttribute('NORMAL'), UV = prim.getAttribute('TEXCOORD_0'), IX = prim.getIndices(), n = P.getCount();
const agM = new T.Matrix4().fromArray(ag.getWorldMatrix()), e3 = [0, 0, 0], v = new T.Vector3();
const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3);
const kutu = () => { const b = new T.Box3(); for (let i = 0; i < n; i++) b.expandByPoint(v.fromArray(pos, i * 3)); return b; };
{ const nm = new T.Matrix3().getNormalMatrix(agM);
  for (let i = 0; i < n; i++) { P.getElement(i, e3); v.fromArray(e3).applyMatrix4(agM).toArray(pos, i * 3); N.getElement(i, e3); v.fromArray(e3).applyMatrix3(nm).normalize().toArray(nor, i * 3); } }
// en geniş yatay eksen x olsun, sonra istenen ek dönüş
let b = kutu(), don = (b.max.z - b.min.z > b.max.x - b.min.x ? 90 : 0) + +(process.env.DON || 0);
if (don) { const R = new T.Matrix4().makeRotationY(don * Math.PI / 180); for (const a of [pos, nor]) for (let i = 0; i < n; i++) v.fromArray(a, i * 3).applyMatrix4(R).toArray(a, i * 3); b = kutu(); }
// ölçek ve yer: gövde ortası (0, 1.8, 0)
const s = process.env.BOY ? +process.env.BOY / (b.max.y - b.min.y) : +(process.env.GEN || 3.2) / (b.max.x - b.min.x), o = b.getCenter(new T.Vector3());
for (let i = 0; i < n; i++) { pos[i * 3] = (pos[i * 3] - o.x) * s; pos[i * 3 + 1] = (pos[i * 3 + 1] - o.y) * s + 1.8; pos[i * 3 + 2] = (pos[i * 3 + 2] - o.z) * s; }
b = kutu();
// ağırlık: d = |x| − gövde; oyundaki kural (.12 geçiş, .42–.84 arası wa → wb), kanat boyuna ölçekli
const yari = b.max.x, gv = yari * +(process.env.GOVDE || .2), k = (yari - gv) / 1.33, smt = x => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
const AD = ['hip', 'hd', 'wa0', 'wb0', 'wa1', 'wb1'], ji = new Uint8Array(n * 4), jw = new Float32Array(n * 4);
// eklem yüksekliği: o dilimdeki köşelerin ortalaması (kanat nereden çıkıyorsa oradan bükülsün)
const ort = (x0, x1) => { let t = 0, c = 0; for (let i = 0; i < n; i++) { const x = Math.abs(pos[i * 3]); if (x >= x0 && x < x1) { t += pos[i * 3 + 1]; c++; } } return c ? t / c : 1.8; };
const ya = ort(gv, gv + .2 * k), yb = ort(gv + .53 * k, gv + .73 * k);
for (let i = 0; i < n; i++) {
  const x = pos[i * 3], d = Math.abs(x) - gv, r = 1 - smt(d / (.12 * k)), tt = smt((d - .42 * k) / (.42 * k)), y = x > 0 ? 1 : 0;
  const w = [[0, r], [2 + y * 2, (1 - r) * (1 - tt)], [3 + y * 2, (1 - r) * tt]].filter(e => e[1] > 1e-4);
  const top = w.reduce((a, e) => a + e[1], 0);
  w.forEach(([j, a], q) => { ji[i * 4 + q] = j; jw[i * 4 + q] = a / top; });
}
const H = { hip: [0, 1.8, -.3], hd: [0, b.max.y - .25 * (b.max.y - b.min.y), .1], wa0: [-gv, ya, 0], wb0: [-(gv + .63 * k), yb, 0], wa1: [gv, ya, 0], wb1: [gv + .63 * k, yb, 0] }, PI = [-1, 0, 0, 2, 0, 4];

const d2 = new Document(), buf = d2.createBuffer(), sahne = d2.createScene('dusman'), kokD = d2.createNode('dusman');
sahne.addChild(kokD);
const dug = AD.map(a => d2.createNode(a));
AD.forEach((a, i) => { const p = PI[i] < 0 ? [0, 0, 0] : H[AD[PI[i]]]; dug[i].setTranslation(H[a].map((x, j) => x - p[j])); (PI[i] < 0 ? kokD : dug[PI[i]]).addChild(dug[i]); });
const ibm = new Float32Array(16 * AD.length);
AD.forEach((a, i) => new T.Matrix4().makeTranslation(-H[a][0], -H[a][1], -H[a][2]).toArray(ibm, i * 16));
const sk = d2.createSkin('dusman').setInverseBindMatrices(d2.createAccessor().setType('MAT4').setArray(ibm).setBuffer(buf));
dug.forEach(x => sk.addJoint(x)); sk.setSkeleton(dug[0]);
const mat0 = prim.getMaterial(), tex0 = mat0 && mat0.getBaseColorTexture(), mt = d2.createMaterial('dusman').setMetallicFactor(0).setRoughnessFactor(.8).setDoubleSided(false);
if (tex0) mt.setBaseColorTexture(d2.createTexture('renk').setImage(tex0.getImage()).setMimeType(tex0.getMimeType()));
const uv = new Float32Array(n * 2); for (let i = 0; i < n; i++) { UV.getElement(i, e3); uv[i * 2] = e3[0]; uv[i * 2 + 1] = e3[1]; }
const A = (tip, dizi) => d2.createAccessor().setType(tip).setArray(dizi).setBuffer(buf);
const pr = d2.createPrimitive().setAttribute('POSITION', A('VEC3', pos)).setAttribute('NORMAL', A('VEC3', nor)).setAttribute('TEXCOORD_0', A('VEC2', uv)).setAttribute('JOINTS_0', A('VEC4', ji)).setAttribute('WEIGHTS_0', A('VEC4', jw)).setIndices(A('SCALAR', new Uint32Array(IX.getArray()))).setMaterial(mt);
kokD.addChild(d2.createNode('ag').setMesh(d2.createMesh('dusman').addPrimitive(pr)).setSkin(sk));
await io.write(cikis, d2);
console.log(`→ ${cikis}: ${n} köşe, ${IX.getCount() / 3} üçgen; dönüş ${don}°, ölçek ${s.toFixed(3)}, kutu ${b.min.toArray().map(x => x.toFixed(2))} … ${b.max.toArray().map(x => x.toFixed(2))}, gövde ±${gv.toFixed(2)}, kanat eklemi y ${ya.toFixed(2)} / ${yb.toFixed(2)}`);
