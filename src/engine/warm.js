// engine/warm.js · Kara Koru
// Shader ön-derleme. three.js her malzeme/nesne bileşimi için (iskeletli, saydam, çift yüzlü,
// hayalet, zemin kancası...) ilk çizimde ayrı bir program derler; bu derleme eşzamanlıdır ve
// oyun ortasında ilk patlama, ilk hayalet, ilk boss göründüğünde kareyi dondurur. Burada
// oyunda görülebilecek her bileşimden birer temsilî nesne görünmez boyutta sahneye konur,
// compileAsync (KHR_parallel_shader_compile) ile ileri programlar arka planda derlenir ve
// iki kare sahnede kalıp gölge derinlik programlarını da derledikten sonra kaldırılır.

import { THREE } from './three.js';
import { $G } from '../core/store.js';
import { BM, DET, HALO, L, R, RC, SKMAT, cam, gB, glow, mk, sc, skData, skInst, envG } from './renderer.js';
import { terrHook } from './gfx.js';
import { barkMaps, grassMap, leafMap, rockGeo, rockMaps, treeGeo } from './realtrees.js';
import { MAPM } from '../world/mapm.js';
import { BDMAT, GDMAT, GHM2, GHM3, GHMAT, SVMAT } from '../game/objects.js';
import { TELM } from '../game/creatures.js';
import { MODELS } from '../geo/models.js';
import { iskinWarm } from './iskin.js';

let own = [];
function add(grp, o) {
  o.frustumCulled = false;
  grp.add(o);
  return o;
}

// kanvas dokular ve ağır süs geometrileri ilk yüklemede üretilir; aşama başı takılma kalmaz
export function warmAssets() {
  for (const k of ['pine', 'oak', 'dead', 'birch']) barkMaps(k);
  for (const k of ['moss', 'red', 'dark']) rockMaps(k);
  for (const k of ['needle', 'broad', 'autumn', 'autumn2']) leafMap(k);
  for (const k of ['green', 'dry', 'gray']) grassMap(k);
  for (const [k, sd] of [['pine', 1], ['pine', 2], ['broad', 1], ['broad', 5], ['autumn', 9], ['autumn2', 13], ['dead', 1], ['dead', 4]]) treeGeo(k, sd, 't');
  for (const [k, sd] of [['moss', 1], ['moss', 7], ['red', 1], ['red', 3], ['red', 7], ['dark', 1], ['dark', 7]]) rockGeo(sd, k);
  for (const k of ['outcrop', 'cactus', 'agave', 'tomb0', 'tomb1', 'tomb2', 'fence', 'lantern']) envG(k, () => k == 'outcrop' ? MAPM.outcrop(1) : k == 'cactus' ? MAPM.cactus(1) : k == 'agave' ? MAPM.agave(1) : k == 'fence' ? MAPM.fence(1) : k == 'lantern' ? MAPM.lantern(1) : MAPM.tomb(+k[4]), .7);
}

export function warmBuild() {
  warmAssets();
  const grp = new THREE.Group();
  grp.name = 'warm';
  const hx = $G.H && $G.H.g ? $G.H.g.position : { x: 0, y: 0, z: 0 };
  grp.position.set(hx.x, hx.y + 1, hx.z);
  grp.scale.setScalar(.001);
  // iskeletli: normal, hayalet (3 kademe), hırsız altın/gümüş, haydut
  const d = RC.e0 || skData('e0', () => MODELS.creature(0, { fin: 0, desert: false }), .36);
  iskinWarm('e2', [SKMAT, GHMAT, GHM2, GHM3, GDMAT, SVMAT, BDMAT], RC.e2 || skData('e2', () => MODELS.creature(2, { fin: 0, desert: false }), .46), 2, 1);
  for (const m of [SKMAT, GHMAT, GHM2, GHM3, GDMAT, SVMAT, BDMAT]) {
    const u = skInst(d);
    u.m.material = m;
    u.m.castShadow = true;
    u.g.traverse(o => o.frustumCulled = false);
    grp.add(u.g);
    own.push(u);
  }
  // düz malzemeler: mat, saydam, saydam çift yüzlü, mat çift yüzlü, sis kapalı
  const dbl = BM(0xffffff);
  dbl.side = 2;
  const tr2 = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .5, side: 2, depthWrite: false });
  const nf = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false });
  const nft = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false, transparent: true, opacity: .5 });
  const bvc = new THREE.MeshBasicMaterial({ vertexColors: true });
  const bmap = new THREE.MeshBasicMaterial({ map: HALO, transparent: true, depthWrite: false });
  const bmapA = new THREE.MeshBasicMaterial({ map: HALO, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  for (const m of [BM(0xffffff), TELM, tr2, dbl, nf, nft, bvc, bmap, bmapA]) add(grp, mk(gB, m, 0, 0, 0, grp)).castShadow = true;
  // standart: düz gölgeli (L), saydam, çift yüzlü, köşe renkli, zemin kancası (3 biyom), su
  const sdv = new THREE.MeshStandardMaterial({ vertexColors: true, transparent: true, opacity: .5, depthWrite: false, side: 2 });
  const sem = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x333333, transparent: true, opacity: .5 });
  const sfl = new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, transparent: true, opacity: .5 });
  const water = new THREE.MeshStandardMaterial({ color: 0xffffff, map: DET, transparent: true, opacity: .8, depthWrite: false });
  for (const m of [L(0xffffff), sdv, sem, sfl, water]) add(grp, mk(gB, m, 0, 0, 0, grp)).castShadow = true;
  for (let bi = 0; bi < 3; bi++) {
    const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .93, metalness: 0, map: DET });
    terrHook(m, bi);
    const g = new THREE.BoxGeometry(1, 1, 1);
    g.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 3).fill(1), 3));
    g.userData.own = 1;
    add(grp, mk(g, m, 0, 0, 0, grp)).receiveShadow = true;
  }
  // instanced: köşe renkli + renkli instance, iskeletsiz derinlik
  const ig = new THREE.BoxGeometry(1, 1, 1);
  ig.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(ig.attributes.position.count * 3).fill(1), 3));
  ig.userData.own = 1;
  const im = new THREE.InstancedMesh(ig, new THREE.MeshStandardMaterial({ vertexColors: true }), 2);
  im.setColorAt(0, new THREE.Color(1, 1, 1));
  im.setColorAt(1, new THREE.Color(1, 1, 1));
  im.castShadow = true;
  add(grp, im);
  const im2 = new THREE.InstancedMesh(ig, L(0xffffff), 2);
  im2.castShadow = true;
  add(grp, im2);
  // sprite ve nokta
  glow(0xffffff, 1, grp, .7);
  const ps = new THREE.BufferGeometry();
  ps.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(3), 3));
  ps.userData.own = 1;
  add(grp, new THREE.Points(ps, new THREE.PointsMaterial({ map: HALO, size: 1, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true })));
  add(grp, new THREE.Points(ps, new THREE.PointsMaterial({ color: 0xffffff, size: 1, sizeAttenuation: false, fog: false })));
  return grp;
}

export function warmFree() {
  const g = $G.WARMG;
  if (!g) return;
  iskinWarm('e2', [SKMAT, GHMAT, GHM2, GHM3, GDMAT, SVMAT, BDMAT], RC.e2, 2, 0);
  sc.remove(g);
  g.traverse(o => {
    if (o.geometry && o.geometry.userData.own) o.geometry.dispose();
  });
  own.length = 0;
  $G.WARMG = null;
}

// Sahneye koyar, ileri programları arka planda derler; loop iki kare sonra kaldırır.
export async function warmShaders() {
  if ($G.WARMG || $G.warmDone) return;
  $G.warmDone = 1;
  const t0 = performance.now();
  try {
    const grp = warmBuild();
    $G.WARMG = grp;
    grp.userData.frames = 2;
    sc.add(grp);
    if (R.compileAsync) await R.compileAsync(sc, cam);else R.compile(sc, cam);
  } catch (e) {
    console.warn('shader ön-derleme:', e);
    warmFree();
  }
  $G.warmMs = performance.now() - t0;
}

export function warmTick() {
  const g = $G.WARMG;
  if (g && g.userData.frames != null && --g.userData.frames < 0 && $G.warmMs != null) warmFree();
}
