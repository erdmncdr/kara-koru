// game/loot.js · Kara Koru
// Toplanabilirler (kristal, altın, gümüş, can) tek tek mesh yerine türe göre InstancedMesh ile çizilir,
// parıltıları tek Points nesnesiyle. $G.G içindeki her kayıt hafif bir m nesnesi taşır
// ({ position, rotation, scale }); gSync her kare bunları instance matrislerine yazar.

import { $G } from '../core/store.js';
import { THREE } from '../engine/three.js';
import { HALO, sc } from '../engine/renderer.js';
import { gCoin, gHeart, gXp, mGem, mGold, mHeal, mSilv } from '../engine/vfx.js';

export const G_CAP = 320;
const TYPES = ['xp', 'au', 'sv', 'hl'];
// tür → temel ölçek ve parıltı (renk, boyut, saydamlık)
const SPEC = {
  xp: { s: 1, gc: 0x7fe8d6, gs: 1.5, go: .5 },
  au: { s: 1, gc: 0xf0b040, gs: 1.3, go: .45 },
  sv: { s: .85, gc: 0xdfeaff, gs: 1.3, go: .4 },
  hl: { s: 1, gc: 0xff8a9c, gs: 1.8, go: .5 }
};
let IM = null, GLOW = null;
const dummy = new THREE.Object3D();

export function __init_59b() {
  IM = {};
  const geo = { xp: gXp, au: gCoin, sv: gCoin, hl: gHeart },
    mat = { xp: mGem, au: mGold, sv: mSilv, hl: mHeal };
  for (const t of TYPES) {
    const m = new THREE.InstancedMesh(geo[t], mat[t], G_CAP);
    m.frustumCulled = false;
    m.castShadow = false;
    m.count = 0;
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    sc.add(m);
    IM[t] = m;
  }
  GLOW = {};
  for (const t of TYPES) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(G_CAP * 3), 3).setUsage(THREE.DynamicDrawUsage));
    g.setDrawRange(0, 0);
    const p = new THREE.Points(g, new THREE.PointsMaterial({
      map: HALO,
      color: SPEC[t].gc,
      size: SPEC[t].gs * 1.6,
      transparent: true,
      opacity: SPEC[t].go,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      fog: true
    }));
    p.frustumCulled = false;
    sc.add(p);
    GLOW[t] = p;
  }
}

// Sahneye girmeyen hafif dönüşüm nesnesi
export function fakeM(x, y, z) {
  return {
    position: new THREE.Vector3(x, y, z),
    rotation: new THREE.Euler(),
    scale: new THREE.Vector3(1, 1, 1)
  };
}

export function gSync() {
  if (!IM) return;
  const n = { xp: 0, au: 0, sv: 0, hl: 0 };
  for (const o of $G.G) {
    if (o.c) continue;
    const t = o.ty == 'ky' ? 'au' : SPEC[o.ty] ? o.ty : 'hl',
      i = n[t];
    if (i >= G_CAP) continue;
    n[t] = i + 1;
    const m = o.m,
      s = SPEC[t].s;
    dummy.position.copy(m.position);
    dummy.rotation.copy(m.rotation);
    dummy.scale.set(m.scale.x * s, m.scale.y * s, m.scale.z * s);
    if (t == 'hl' && !o.air) {
      // kalp dönmez: yüzü kameraya bakar, hafifçe salınır ve kalp atışıyla büyür; biçimi her an okunur
      const ph = $G.T * 5 + m.position.x,
        k = s * (1 + .1 * Math.max(0, Math.sin(ph)) ** 6 + .06 * Math.max(0, Math.sin(ph - .9)) ** 6);
      dummy.rotation.set(0, $G.yaw + Math.sin($G.T * 1.7 + m.position.z) * .4, 0);
      dummy.scale.set(m.scale.x * k, m.scale.y * k, m.scale.z * k);
    }
    dummy.updateMatrix();
    IM[t].setMatrixAt(i, dummy.matrix);
    const gl = GLOW[t];
    if (gl) {
      const a = gl.geometry.attributes.position.array;
      a[i * 3] = m.position.x;
      a[i * 3 + 1] = m.position.y;
      a[i * 3 + 2] = m.position.z;
    }
  }
  for (const t of TYPES) {
    IM[t].count = n[t];
    IM[t].instanceMatrix.needsUpdate = true;
    const gl = GLOW[t];
    if (gl) {
      gl.geometry.setDrawRange(0, n[t]);
      gl.geometry.attributes.position.needsUpdate = true;
    }
  }
}
