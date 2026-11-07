// world/props.js · Kara Koru
// Bu dosya tek dosyalık sürümden (v22) otomatik ayrıldı. Ortak oyun durumu core/store.js içindeki $G nesnesinde.

import { $G } from '../core/store.js';
import { THREE } from '../engine/three.js';
import { BMc, VMAT, bx, cn, cy, envG, glow, mk, rigData, rigInst } from '../engine/renderer.js';
import { MODELS } from '../geo/models.js';
import { MAPM } from './mapm.js';

// ---- etkileşim modelleri
export function mkMerchant() {
  const u = rigInst(rigData('npc_shop', () => MODELS.merchant(), .85));
  u.g.traverse(m => m.castShadow = true);
  return u.g;
}

export function mkCauldron() {
  const u = rigInst(rigData('npc_kz', () => MODELS.cauldron(), .85)),
    g = u.g,
    liq = cy(BMc(0x8a5ad6), .95, .06, 0, 1.87, 0, g);
  glow(0xb070ff, 3, g, .5).position.set(0, 2.2, 0);
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * 6.283;
    cn(BMc(0xff7a2a), .18, .6, Math.cos(a) * .35, .3, Math.sin(a) * .35, g);
  }
  glow(0xff8a3a, 2.4, g, .6).position.set(0, .45, 0);
  g.traverse(m => m.castShadow = m !== liq);
  return {
    g,
    liq
  };
}

export function mkGate() {
  const g = new THREE.Group(),
    ru = BMc(0xd0453a),
    gm = new THREE.Mesh(envG('gate' + $G.BI, () => MAPM.gate($G.BI == 1), 1), VMAT);
  gm.receiveShadow = true;
  g.add(gm);
  const rn2 = bx(ru, 1.4, .5, .06, 0, 9.75, 1.18, g);
  const por = mk(new THREE.CircleGeometry(3.4, 32), new THREE.MeshBasicMaterial({
    color: 0x9fe8d8,
    transparent: true,
    opacity: .75,
    side: 2
  }), 0, 4.2, 0, g);
  por.scale.set(1, 1.15, 1);
  por.visible = false;
  const sw = mk(new THREE.RingGeometry(1.2, 3.3, 6, 1), new THREE.MeshBasicMaterial({
    color: 0xddfff4,
    transparent: true,
    opacity: .35,
    side: 2
  }), 0, 4.2, .05, g);
  sw.visible = false;
  g.traverse(m => {
    if (m !== por && m !== sw) m.castShadow = true;
  });
  return {
    g,
    por,
    sw,
    rn: rn2
  };
}

// ---- three.js r128 son işleme örnekleri (MIT lisansı, three.js yazarları)
