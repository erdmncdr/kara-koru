// engine/iskin.js · Kara Koru
// Instanced skinning: aynı model ve malzemeyi paylaşan düşmanlar tek çizim çağrısında çizilir.
// Her düşman yine kendi kemik hiyerarşisini taşır (anim.js kemikleri döndürür), ama SkinnedMesh
// yerine bir "batch" içinde bir yuva alır. Her kare her yuva için kök-yerel kemik matrisleri tek
// bir float dokuya yazılır; vertex shader gl_InstanceID satırından okur. Vuruş flaşı yuva başına
// bir attribute (iFl). Gölge için aynı deformasyonu yapan özel derinlik malzemesi.
//
// Batch anahtarı: model anahtarı + malzeme. Yuvalar sıkışık tutulur (silinen yuvaya sonuncu taşınır).

import { THREE } from './three.js';
import { $G } from '../core/store.js';
import { R, sc } from './renderer.js';

const B = new Map(), ALL = [];
const ZERO = new Float32Array(16), M4 = [], TMP = new THREE.Matrix4();
for (let i = 0; i < 48; i++) M4.push(new THREE.Matrix4());

const VERT_HEAD = `
uniform highp sampler2D iBoneTex;
attribute vec4 skinIndex;
attribute vec4 skinWeight;
attribute float iFl;
varying float vFl;
mat4 iBone(float j) {
  int x = int(j) * 4;
  return mat4(texelFetch(iBoneTex, ivec2(x, gl_InstanceID), 0), texelFetch(iBoneTex, ivec2(x + 1, gl_InstanceID), 0), texelFetch(iBoneTex, ivec2(x + 2, gl_InstanceID), 0), texelFetch(iBoneTex, ivec2(x + 3, gl_InstanceID), 0));
}
mat4 iS;
`;
const VERT_NORMAL = `
#include <beginnormal_vertex>
iS = iBone(skinIndex.x) * skinWeight.x + iBone(skinIndex.y) * skinWeight.y + iBone(skinIndex.z) * skinWeight.z + iBone(skinIndex.w) * skinWeight.w;
objectNormal = normalize(mat3(iS) * objectNormal);
vFl = iFl;
`;
const VERT_POS = `
#include <begin_vertex>
transformed = (iS * vec4(transformed, 1.0)).xyz;
`;
// derinlik malzemesinde normal bloğu yok: iS burada hesaplanır
const VERT_POS_D = `
#include <begin_vertex>
iS = iBone(skinIndex.x) * skinWeight.x + iBone(skinIndex.y) * skinWeight.y + iBone(skinIndex.z) * skinWeight.z + iBone(skinIndex.w) * skinWeight.w;
transformed = (iS * vec4(transformed, 1.0)).xyz;
`;
const FRAG_HEAD = 'varying float vFl;\n';
// Vuruş flaşı ışıma eşiğinin (BLOOM_TH) altında kalır: beyaz + 1.4 ışıma her vuruşta gövdeyi beyaz bir ışıma topuna çeviriyordu
const FRAG_COL = '#include <color_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0, .95, .86), vFl * .75);\n';
const FRAG_EM = '#include <emissivemap_fragment>\ntotalEmissiveRadiance += vec3(vFl * .28);\n';

function injectV(sh, uTex, depth) {
  sh.uniforms.iBoneTex = uTex;
  sh.vertexShader = VERT_HEAD + sh.vertexShader.replace('#include <beginnormal_vertex>', VERT_NORMAL).replace('#include <begin_vertex>', depth ? VERT_POS_D : VERT_POS);
  if (!depth) sh.fragmentShader = FRAG_HEAD + sh.fragmentShader.replace('#include <color_fragment>', FRAG_COL).replace('#include <emissivemap_fragment>', FRAG_EM);
}

function mkMat(base, uTex) {
  const m = base.clone(), own = base.onBeforeCompile !== THREE.Material.prototype.onBeforeCompile ? base.onBeforeCompile : null,
    ownKey = base.customProgramCacheKey !== THREE.Material.prototype.customProgramCacheKey ? base.customProgramCacheKey() : '';
  m.onBeforeCompile = sh => {
    if (own) own(sh);
    injectV(sh, uTex, 0);
  };
  m.customProgramCacheKey = () => 'iskin' + ownKey;
  const d = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
  d.onBeforeCompile = sh => injectV(sh, uTex, 1);
  d.customProgramCacheKey = () => 'iskinD';
  return { m, d };
}

// Bağlama pozu tersleri (kök-yerel): kemik zinciri h konumlarından, dönüş yok
function binv(d) {
  if (d.binv) return d.binv;
  const chain = [], out = [];
  d.bones.forEach((x, i) => {
    const p = x.pi < 0 ? [0, 0, 0] : d.bones[x.pi].h,
      L = new THREE.Matrix4().makeTranslation(x.h[0] - p[0], x.h[1] - p[1], x.h[2] - p[2]);
    chain[i] = x.pi < 0 ? L : new THREE.Matrix4().multiplyMatrices(chain[x.pi], L);
    out[i] = chain[i].clone().invert();
  });
  return d.binv = out;
}

function mkTex(w, h) {
  const t = new THREE.DataTexture(new Float32Array(w * h * 4), w, h, THREE.RGBAFormat, THREE.FloatType);
  t.magFilter = t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.needsUpdate = true;
  return t;
}

function build(b, cap) {
  const im = new THREE.InstancedMesh(b.geo, b.mat, cap);
  im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  im.frustumCulled = false;
  im.matrixAutoUpdate = false;
  im.castShadow = b.shadow;
  im.receiveShadow = false;
  im.customDepthMaterial = b.dep;
  im.count = 0;
  // iFl attribute'u paylaşılan geometriye değil, batch'in kendi kopyasına eklenir
  const fl = new THREE.InstancedBufferAttribute(new Float32Array(cap), 1);
  fl.setUsage(THREE.DynamicDrawUsage);
  b.fl = fl;
  const g2 = b.geo.clone();
  g2.setAttribute('iFl', fl);
  g2.userData.shared = 1;
  im.geometry = g2;
  if (b.im) {
    sc.remove(b.im);
    b.im.geometry.dispose();
    b.tex.dispose();
  }
  b.im = im;
  b.cap = cap;
  b.tex = mkTex(b.boneN * 4, cap);
  b.uTex.value = b.tex;
  sc.add(im);
}

function batch(key, mat, d, t) {
  const k = key + '|' + mat.uuid;
  let b = B.get(k);
  if (b) return b;
  const uTex = { value: null }, mm = mkMat(mat, uTex);
  b = { k, key, geo: d.g, base: mat, mat: mm.m, dep: mm.d, uTex, boneN: d.bones.length, binv: binv(d), pi: d.bones.map(x => x.pi), list: [], n: 0, shadow: t >= 2 && !mat.transparent, im: null, tex: null, cap: 0, fl: null };
  build(b, 64);
  B.set(k, b);
  ALL.push(b);
  return b;
}

// u: skInst(d, 1) sonucu (kemikler u.g altında, SkinnedMesh yok). key havuz anahtarı, t taban sınıf.
export function iskinAdd(u, key, mat, d, t) {
  if (u.inst) iskinRelease(u);
  const b = batch(key, mat, d, t);
  if (b.n >= b.cap) build(b, b.cap * 2);
  const i = b.n++;
  b.list[i] = u;
  b.fl.array[i] = 0;
  u.inst = { b, i };
  if (!u.bs) throw new Error('iskin: kemik listesi yok (skInst(d, 1) kullan)');
}

export function iskinRelease(u) {
  const s = u.inst;
  if (!s) return;
  const b = s.b, last = b.n - 1;
  if (s.i != last) {
    const o = b.list[last];
    b.list[s.i] = o;
    o.inst.i = s.i;
    b.fl.array[s.i] = b.fl.array[last];
  }
  b.list[last] = null;
  b.n = last;
  u.inst = null;
}

export function iskinMat(u, mat, t) {
  const s = u.inst;
  if (!s || s.b.base === mat) return;
  const key = s.b.key, d = u.d;
  iskinRelease(u);
  iskinAdd(u, key, mat, d, t);
}

export function iskinFlash(u, v) {
  const s = u.inst;
  if (!s) return;
  s.b.fl.array[s.i] = v;
  s.b.fl.needsUpdate = true;
}

// Her kare, sahne matrisleri güncellendikten sonra: yuva matrisleri ve kemik dokusu
export function iskinUpd() {
  for (const b of ALL) {
    const n = b.n;
    if (!n && !b.warm) {
      b.im.count = 0;
      continue;
    }
    const W = b.boneN * 16, A = b.im.instanceMatrix.array, T = b.tex.image.data, pi = b.pi, inv = b.binv;
    for (let i = 0; i < n; i++) {
      const u = b.list[i], g = u.g;
      if (!g.visible || !g.parent) {
        A.set(ZERO, i * 16);
        continue;
      }
      A.set(g.matrixWorld.elements, i * 16);
      const bs = u.bs, off = i * W;
      for (let j = 0; j < bs.length; j++) {
        const p = pi[j];
        if (p < 0) M4[j].copy(bs[j].matrix);else M4[j].multiplyMatrices(M4[p], bs[j].matrix);
        TMP.multiplyMatrices(M4[j], inv[j]);
        T.set(TMP.elements, off + j * 16);
      }
    }
    if (b.warm && !n) A.set(ZERO, 0);
    b.im.count = n || (b.warm ? 1 : 0);
    b.im.instanceMatrix.needsUpdate = true;
    b.fl.needsUpdate = true;
    b.tex.needsUpdate = true;
  }
}

// Biyom değişince kullanılmayan anahtarların batch'leri bırakılır
export function iskinPrune(keep) {
  for (const b of ALL.slice()) {
    if (keep(b.key) || b.n) continue;
    sc.remove(b.im);
    b.im.geometry.dispose();
    b.tex.dispose();
    b.mat.dispose();
    b.dep.dispose();
    B.delete(b.k);
    ALL.splice(ALL.indexOf(b), 1);
  }
}

// Shader ön-derleme: her malzeme için bir batch (yuva yok, bir kare sıfır matrisli kukla)
export function iskinWarm(key, mats, d, t, on) {
  for (const m of mats) {
    const b = batch(key, m, d, t);
    b.warm = on ? 1 : 0;
  }
}

export function iskinStats() {
  return { batches: ALL.length, live: ALL.reduce((a, b) => a + b.n, 0), caps: ALL.reduce((a, b) => a + b.cap, 0) };
}
