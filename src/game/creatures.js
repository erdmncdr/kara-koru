// game/creatures.js · Kara Koru
// Bu dosya tek dosyalık sürümden (v22) otomatik ayrıldı. Ortak oyun durumu core/store.js içindeki $G nesnesinde.

import { $G } from '../core/store.js';
import { SET } from '../core/settings.js';
import { THREE } from '../engine/three.js';
import { BMc, SKMAT, bx, skData, skInst } from '../engine/renderer.js';
import { skFree } from '../core/helpers.js';
import { ACC, attachAcc, bakeAcc } from '../geo/accessories.js';
import { iskinAdd, iskinPrune, iskinRelease } from '../engine/iskin.js';
import { MODELS } from '../geo/models.js';

export let EYa, EYr, EMB, EYy, TELM, NOM, ASP;

export function __init_30() {
  // ---- yaratıklar
  EYa = BMc(0xffa63a);
  EYr = BMc(0xff3a22);
  EMB = BMc(0xff6a2a);
  EYy = BMc(0xffe14a);
  TELM = new THREE.MeshBasicMaterial({
    color: 0xff3a22,
    transparent: true,
    opacity: .45
  });
  NOM = [1, .9, 1.6, 1.8, 1, 1.3];
  ASP = [7, 14, 4, 3, 6, 6];
}

// Düşman modelleri havuzlanır: iskelet, kemik dokusu ve göz meshleri her doğuşta yeniden
// kurulmaz. freeE geri verir, mkE havuzdan alır, pruneE biyom değişince eskileri bırakır.
const POOL = {};
const POOL_MAX = 96;

// Köşe renklerini boyar: c = karışım(c, renk × parlaklık, oran)
export function tintGeo(g, hex, amt) {
  const a = g.attributes.color.array,
    r = (hex >> 16 & 255) / 255, gg = (hex >> 8 & 255) / 255, b = (hex & 255) / 255;
  for (let i = 0; i < a.length; i += 3) {
    const l = .3 * a[i] + .59 * a[i + 1] + .11 * a[i + 2],
      k = .35 + l * .9;
    a[i] += (r * k - a[i]) * amt;
    a[i + 1] += (gg * k - a[i + 1]) * amt;
    a[i + 2] += (b * k - a[i + 2]) * amt;
  }
  g.attributes.color.needsUpdate = true;
}

export function mkE(t, fin, kd) {
  const key = 'e' + t + (fin ? 'f' : '') + ($G.BI == 1 ? 'd' : '') + (kd && (kd.tint || ACC.kind[kd.k]) ? ':' + kd.k : ''),
    p = POOL[key];
  if (p && p.length) {
    const u = p.pop();
    u.g.visible = true;
    iskinAdd(u, key, SKMAT, u.d, t);
    return u;
  }
  const d = skData(key, () => MODELS.creature(t, {
    fin,
    desert: $G.BI == 1
  }), (t == 0 || t == 1 || t == 4 ? .36 : .46) + (SET.q > 0 ? .09 : 0)); // düşük kalitede ~%22 daha az üçgen
  if (kd && kd.tint && !d.tinted) {
    tintGeo(d.g, kd.tint[0], kd.tint[1]);
    d.tinted = 1;
  }
  if (kd && ACC.kind[kd.k] && !d.accBaked) {
    // mat parçalar geometriye kemik ağırlığıyla gömülür (tek çizim); saydam parçalar ve parıltılar kemik çocuğu kalır
    bakeAcc(d, ACC.kind[kd.k]);
    d.accBaked = 1;
  }
  const u = skInst(d, 1);
  u.key = key;
  u.d = d;
  u.t = t;
  if (kd && ACC.kind[kd.k]) attachAcc(u, d.bones, ACC.kind[kd.k], 1);
  iskinAdd(u, key, SKMAT, d, t);
  if (t == 5) {
    u.tel = bx(TELM, .9, .05, 12, 0, .15, 6.5, u.g);
    u.tel.visible = false;
  }
  return u;
}

// Kullanılmış modeli sıfırlayıp havuza koyar. Havuz doluysa iskeleti bırakır.
export function freeE(u) {
  if (!u) return;
  if (!u.key) {
    skFree(u);
    return;
  }
  const g = u.g;
  g.position.set(0, -1e4, 0);
  g.rotation.set(0, 0, 0);
  g.scale.setScalar(1);
  g.visible = false;
  for (let i = g.children.length - 1; i >= 0; i--) if (g.children[i].userData.ring == 'el') g.remove(g.children[i]);
  if (g.userData.crown) {
    g.userData.crown.parent && g.userData.crown.parent.remove(g.userData.crown);
    delete g.userData.crown;
  }
  g.traverse(m => {
    if (!m.isMesh) return;
    delete m.userData.m0;
    if (m.isSkinnedMesh) m.material = SKMAT;
    m.castShadow = false;
  });
  iskinRelease(u);
  if (u.tel) u.tel.visible = false;
  u.st = null;
  const p = POOL[u.key] || (POOL[u.key] = []);
  if (p.length >= POOL_MAX) skFree(u);else p.push(u);
}

export function pruneE(keep) {
  iskinPrune(keep);
  for (const k in POOL) {
    if (keep(k)) continue;
    for (const u of POOL[k]) skFree(u);
    delete POOL[k];
  }
}

export function poolStats() {
  const o = {};
  for (const k in POOL) o[k] = POOL[k].length;
  return o;
}
// ---- etkileşim modelleri
