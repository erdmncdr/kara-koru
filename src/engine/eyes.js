// engine/eyes.js · Kara Koru
// Yaratık ve kahraman gözleri ayrı mesh yerine renk başına tek InstancedMesh ile çizilir.
// skInst göz tanımlarını u.eyes içinde tutar; eyeSync her kare kemik dünya matrisinden
// göz matrisini üretir. Parıltılı gözler renk başına tek Points nesnesiyle çizilir.

import { $G } from '../core/store.js';
import { THREE } from './three.js';
import { BMc, HALO, gEye, sc } from './renderer.js';

const CAP = 2400;
const EI = {}, EG = {};
const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), P = new THREE.Vector3(), S = new THREE.Vector3();
let cnt = {}, gcnt = {};

function inst(c) {
  let m = EI[c];
  if (!m) {
    m = new THREE.InstancedMesh(gEye, BMc(c), CAP);
    m.frustumCulled = false;
    m.count = 0;
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    sc.add(m);
    EI[c] = m;
  }
  return m;
}

function glowP(c) {
  let p = EG[c];
  if (!p) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(CAP * 3), 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('size', new THREE.Float32BufferAttribute(new Float32Array(CAP), 1).setUsage(THREE.DynamicDrawUsage));
    g.setDrawRange(0, 0);
    p = new THREE.Points(g, new THREE.PointsMaterial({
      map: HALO,
      color: c,
      size: 1,
      transparent: true,
      opacity: .7,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      fog: true
    }));
    // nokta başına boyut: shader'a attribute olarak gir
    p.material.onBeforeCompile = sh => {
      sh.vertexShader = sh.vertexShader.replace('uniform float size;', 'attribute float size;');
    };
    p.frustumCulled = false;
    sc.add(p);
    EG[c] = p;
  }
  return p;
}

function put(u) {
  if (!u || !u.eyes || !u.g.visible) return;
  for (const e of u.eyes) {
    const m = inst(e.c),
      i = cnt[e.c] || 0;
    if (i >= CAP) continue;
    cnt[e.c] = i + 1;
    P.set(e.q[0], e.q[1], e.q[2]);
    S.set(e.r, e.r * e.sq, e.r);
    M.compose(P, Q, S).premultiply(e.bone.matrixWorld);
    m.setMatrixAt(i, M);
    if (e.glow) {
      const p = glowP(e.c),
        j = gcnt[e.c] || 0;
      if (j < CAP) {
        gcnt[e.c] = j + 1;
        const a = p.geometry.attributes.position.array;
        P.set(e.q[0], e.q[1], e.q[2]).applyMatrix4(e.bone.matrixWorld);
        a[j * 3] = P.x;
        a[j * 3 + 1] = P.y;
        a[j * 3 + 2] = P.z;
        // kemik ölçeğini parıltı boyutuna yansıt
        p.geometry.attributes.size.array[j] = e.glow * 1.6 * S.setFromMatrixScale(e.bone.matrixWorld).x;
      }
    }
  }
}

// Sahne matrisleri güncel olmalı; loop içinde sc.updateMatrixWorld(true) sonrasında çağrılır.
export function eyeSync() {
  cnt = {};
  gcnt = {};
  if ($G.H) put($G.H);
  if ($G.E) for (const e of $G.E) if (!e.dead) put(e.u);
  if ($G.DY) for (const d of $G.DY) put(d.u);
  for (const c in EI) {
    EI[c].count = cnt[c] || 0;
    EI[c].instanceMatrix.needsUpdate = true;
  }
  for (const c in EG) {
    const n = gcnt[c] || 0,
      g = EG[c].geometry;
    g.setDrawRange(0, n);
    g.attributes.position.needsUpdate = true;
    g.attributes.size.needsUpdate = true;
  }
}
