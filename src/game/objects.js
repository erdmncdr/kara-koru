// game/objects.js · Kara Koru
// Bu dosya tek dosyalık sürümden (v22) otomatik ayrıldı. Ortak oyun durumu core/store.js içindeki $G nesnesinde.

import { $G } from '../core/store.js';
import { THREE } from '../engine/three.js';
import { clr, freeG, kill, ownG } from '../core/helpers.js';
import { pruneE, tintGeo } from './creatures.js';
import { fakeM, gSync } from './loot.js';
import { fireHook } from './items.js';
import { arenaBuild, arenaClear, arenaTrim, isArena, mapOf } from './run.js';
import { gyInit } from './graveyard.js';
import { chalFlag } from './challenge.js';
import { clamp, rn } from '../core/util.js';
import { PUD, SHC } from '../data/content.js';
import { spawn } from './enemies.js';
import { chestBeam } from '../engine/gfx.js';
import { BM, BMc, VMAT, envG, gCn, gSp, glow, mk, sc } from '../engine/renderer.js';
import { gCoin, gPU, gXp, mGem, mGold, mHeal } from '../engine/vfx.js';
import { mkDrums, mkGraves } from './features.js';
import { calc } from './stats.js';
import { buildWorld, gPot } from '../world/ambient.js';
import { MAPM } from '../world/mapm.js';
import { mkCauldron, mkGate, mkMerchant } from '../world/props.js';
import { addObs, groundAt, groundTop, inPlat } from '../world/terrain.js';

export let price, PD, WHC, SVC, mSil, GHMAT, GDMAT, SVMAT, GHM2, GHM3, BDMAT;

export function __init_55() {
  // ---- dünya nesneleri
  // Ücretli sandık 30 altından başlar, her satın almada artar, tavanı yok (Megabonk)
  price = () => Math.max(1, Math.round(30 * Math.pow(1.25, $G.P.opened) * ($G.P.C ? $G.P.C.chestp : 1) * (chalFlag('chestp') || 1)));
}

export function spot(cx, cz, a0, a1, sep) {
  for (let k = 0; k < 90; k++) {
    const a = rn(0, 6.28),
      d = rn(a0, a1),
      x = clamp(cx + Math.cos(a) * d, -245, 245),
      z = clamp(cz + Math.sin(a) * d, -245, 245);
    if (inPlat(x, z, 3)) continue;
    if (sep && [...$G.SH, ...$G.NP, ...$G.CH, ...$G.MZ, ...$G.KS].some(o => Math.hypot(o.m.position.x - x, o.m.position.z - z) < sep)) continue;
    if ($G.GATE && Math.hypot($G.GATE.x - x, $G.GATE.z - z) < 16) continue;
    return [x, z];
  }
  return [clamp(cx + rn(-30, 30), -245, 245), clamp(cz + rn(-30, 30), -245, 245)];
}
// ---- Dört Mezar: her mezar bir ruh bekçisi çıkarır, dördü de huzura erince altın sandık

export function mkChest(o) {
  const {
      x,
      z,
      free,
      gold
    } = o,
    y = o.y != null ? o.y : $G.HT(x, z),
    c = new THREE.Group(),
    col = gold ? 0xc49a45 : free ? 0x5a6068 : 0x6b4a2b;
  c.position.set(x, y, z);
  sc.add(c);
  {
    const cm = new THREE.Mesh(envG('chest' + (gold ? 2 : free ? 1 : 0), () => MAPM.chest(gold ? 2 : free ? 1 : 0), 1), VMAT);
    cm.receiveShadow = true;
    c.add(cm);
  }
  c.traverse(m => m.castShadow = true);
  chestBeam(gold ? 0xe2b85a : free ? 0x9aa3ad : 0xd9b26a, c);
  const r = {
    m: c,
    free,
    gold
  };
  $G.CH.push(r);
  return r;
}

export function __init_56() {
  $G.s_gl = undefined;
}

export function mkSh(t) {
  const [x, z] = $G.SHH.length ? $G.SHH.shift() : spot(0, 0, 35, 175, 25),
    g = new THREE.Group();
  g.position.set(x, $G.HT(x, z), z);
  sc.add(g);
  const c = SHC[t];
  let o;
  {
    const mt = t >= 9 ? [0, 3, 7, 2, 1, 4, 1, 1, 6, 1, 1][t - 9] : t,
      bm = new THREE.Mesh(envG('shr' + mt + $G.BI, () => MAPM.shrine(mt, $G.BI == 1), 1), VMAT);
    bm.castShadow = bm.receiveShadow = true;
    g.add(bm);
  }
  if (t == 0 || t == 5) {
    o = mk(ownG(new THREE.OctahedronGeometry(.7)), BM(c), 0, 1.95, 0, g);
    const rg = mk(ownG(new THREE.RingGeometry(5.7, 6, 48)), new THREE.MeshBasicMaterial({
      color: c,
      transparent: true,
      opacity: .5,
      side: 2
    }), 0, .25, 0, g);
    rg.rotation.x = -Math.PI / 2;
    rg.userData.ring = 1;
  }
  if (t == 1) {
    [-.15, .15].forEach(x2 => {
      const e = mk(gSp, BMc(0x9fe8d8), x2, 2.36 + .03, .28, g);
      e.scale.set(.06, .035, .03);
    });
    o = mk(ownG(new THREE.OctahedronGeometry(.35)), BM(c), 0, 4.1, 0, g);
  }
  if (t == 2) o = mk(ownG(new THREE.OctahedronGeometry(.6)), BM(c), 0, 4.9, 0, g);
  if (t == 3) o = mk(ownG(new THREE.OctahedronGeometry(.55)), BM(c), 0, 2, 0, g);
  if (t == 4) {
    o = mk(gCoin, BM(c), 0, 2.6, 0, g);
    o.scale.setScalar(1.6);
  }
  if (t == 6) o = mk(ownG(new THREE.OctahedronGeometry(.5)), BM(c), 0, 2.5, 0, g);
  if (t == 7) o = mk(ownG(new THREE.OctahedronGeometry(.42)), BM(c), 0, 4.75, 0, g);
  if (t == 8) o = mk(ownG(new THREE.OctahedronGeometry(.45)), BM(c), 0, 2.45, 0, g);
  if (t >= 9) o = mk(ownG(new THREE.OctahedronGeometry(.45)), BM(c), 0, t >= 18 ? 2.2 : [2.0, 2.2, 4.75, 4.9][t - 9], 0, g);
  $G.s_gl = glow(c, 3.2, o, .6);
  const gold = t == 1 && Math.random() < .2; // altın Balbal (Megabonk Golden Moai): üç efsanevi eşya
  if (gold) g.traverse(m => { if (m.isMesh && m.material === VMAT) m.material = BMc(0xffd040); });
  $G.SH.push({
    m: g,
    t,
    o,
    p: 0,
    d: 0,
    left: 0,
    gold,
    gl: $G.s_gl
  });
}

export function mkNPC(t) {
  const [x, z] = $G.NPH.length ? $G.NPH.shift() : spot(0, 0, 40, 190, 25);
  let g,
    liq = null;
  let tier = 0;
  if (t == 'shop') {
    // tüccar kademesi (Megabonk Shady Guy): kara / mavi / mor / sarı şapka = sıradan / seçkin / destansı / efsanevi
    const r = Math.random();
    tier = r < .55 ? 0 : r < .85 ? 2 : r < .96 ? 3 : 4;
    g = mkMerchant();
    const hc = [0x1a1a1a, 0, 0x2a66d8, 0x8a3ad8, 0xffd040][tier],
      hat = mk(gCn, BMc(hc), 0, 2.55, 0, g);
    hat.scale.set(.42, .5, .42);
  } else {
    const c = mkCauldron();
    g = c.g;
    liq = c.liq;
    // kazan kademesi (Megabonk Microwave): sıradan 3, seçkin/destansı 2, efsanevi 1 kullanım; sıvı rengi kademeyi gösterir
    const r = Math.random();
    tier = r < .55 ? 0 : r < .85 ? 2 : r < .96 ? 3 : 4;
    liq.material = BMc([0x8a5ad6, 0, 0x2a66d8, 0x8a3ad8, 0xffd040][tier]);
  }
  g.position.set(x, $G.HT(x, z), z);
  g.rotation.y = rn(0, 6.28);
  sc.add(g);
  const ob = {
    x,
    z,
    r: 1.1,
    t: $G.HT(x, z) + 2.6
  };
  addObs(ob);
  $G.NP.push({
    m: g,
    ob,
    t,
    tier,
    uses: t == 'kazan' ? [3, 0, 2, 2, 1][tier] : 0,
    d: 0,
    lock: 0,
    liq
  });
}

export function setupGate() {
  let x = 0,
    z = 0;
  for (let k = 0; k < 200; k++) {
    const a = rn(0, 6.28),
      d = rn(95, 165);
    x = clamp(Math.cos(a) * d, -235, 235);
    z = clamp(Math.sin(a) * d, -235, 235);
    if (!inPlat(x, z, 14)) break;
  }
  const gt = mkGate(),
    ry = Math.atan2(-x, -z);
  gt.g.position.set(x, $G.HT(x, z) - .2, z);
  gt.g.rotation.y = ry;
  sc.add(gt.g);
  [-1, 1].forEach(s => addObs({
    x: x + Math.cos(ry) * 4.4 * s,
    z: z - Math.sin(ry) * 4.4 * s,
    r: 1.3,
    t: $G.HT(x, z) + 8.5
  }));
  $G.GATE = {
    m: gt.g,
    x,
    z,
    ry,
    st: 0,
    por: gt.por,
    sw: gt.sw,
    rn: gt.rn
  };
}

export function mkPots(pl, extra = 0) {
  // Megabonk pot tablosu: 40 küçük + 15 büyük + 6 küçük gümüş + 1 büyük gümüş; Mezarlık'ta kabaklar pot yerine geçer, gümüş potlar 8 + 1
  const mz = mapOf().k == 'mezarlik',
    types = mz ? [[8, 0, 1], [1, 1, 1]] : [[40 + extra, 0, 0], [15, 1, 0], [6, 0, 1], [1, 1, 1]];
  for (const [n, big, sv] of types) for (let i = 0; i < n; i++) {
    const x = rn(-265, 265),
      z = rn(-265, 265);
    if (Math.hypot(x, z) < 10 || inPlat(x, z, 1)) continue;
    pl.push({
      x,
      y: $G.HT(x, z) + .7,
      z,
      big,
      sv
    });
  }
  for (const l of $G.LMS) for (let k = 0; k < 3; k++) {
    const a = rn(0, 6.28),
      r = l.r + rn(2, 5),
      x = l.x + Math.cos(a) * r,
      z = l.z + Math.sin(a) * r;
    if (!inPlat(x, z, 1) && $G.HT(x, z) > $G.WLV + .3) pl.push({
      x,
      y: $G.HT(x, z) + .7,
      z
    });
  }
}
// örneklenmiş potlar ve kırılabilir taşlar: yüzlercesi tek çizim çağrısı

export function __init_57() {
  // örneklenmiş potlar ve kırılabilir taşlar: yüzlercesi tek çizim çağrısı
  $G.PINST = null;
  $G.BINST = [];
  $G.BRK = [];
  PD = new THREE.Object3D();
  WHC = new THREE.Color(1, 1, 1);
  SVC = new THREE.Color(.7, .78, .9);
}

export function potsBuild(pl) {
  if ($G.PINST) {
    sc.remove($G.PINST);
    $G.PINST = null;
  }
  if (!pl.length) return;
  $G.PINST = new THREE.InstancedMesh(gPot, VMAT, pl.length);
  $G.PINST.castShadow = $G.PINST.receiveShadow = true;
  $G.PINST.frustumCulled = false;
  pl.forEach((p, i) => {
    PD.position.set(p.x, p.y, p.z);
    PD.rotation.set(0, rn(0, 6.28), 0);
    PD.scale.setScalar(p.big ? 1.5 : rn(.9, 1.15));
    PD.updateMatrix();
    $G.PINST.setMatrixAt(i, PD.matrix);
    $G.PINST.setColorAt(i, p.sv ? SVC : WHC);
    $G.POT.push({
      m: {
        position: {
          x: p.x,
          y: p.y,
          z: p.z
        }
      },
      i,
      big: p.big || 0,
      sv: p.sv || 0
    });
  });
  $G.PINST.instanceMatrix.needsUpdate = true;
  sc.add($G.PINST);
}

export function instHide(im, i) {
  if (!im) return;
  PD.position.set(0, -999, 0);
  PD.rotation.set(0, 0, 0);
  PD.scale.setScalar(0);
  PD.updateMatrix();
  im.setMatrixAt(i, PD.matrix);
  im.instanceMatrix.needsUpdate = true;
}

export function brkBuild() {
  $G.BINST.forEach(m => sc.remove(m));
  $G.BINST = [];
  $G.BRK.length = 0;
  const bi = $G.BI == 1,
    /** @type {[string, string, () => any, number][]} */
    list = [['cr', 'brk_cr', () => MAPM.crystal(2), 22], ['ore', 'brk_ore' + $G.BI, () => MAPM.ore(bi), bi ? 24 : 16]];
  if ($G.BI == 2) list.push(['kb', 'brk_kb', () => MAPM.ore(false), 50], ['kbb', 'brk_kbb', () => MAPM.ore(false), 20]); // kabaklar: 50 küçük, 20 büyük
  if ($G.BI == 1) list.push(['tw', 'brk_tw', () => MAPM.crystal(5), 18]); // çalı yumağı (Megabonk Tumbleweed)
  for (const [ty, key, fn, n] of list) {
    const g = envG(key, fn, 1),
      pts = [];
    if ((ty == 'kb' || ty == 'kbb' || ty == 'tw') && !g.userData.tinted) {
      tintGeo(g, ty == 'kb' ? 0xff8a2a : 0xb08a4a, .85);
      g.userData.tinted = 1;
    }
    for (let k = 0; k < n * 4 && pts.length < n; k++) {
      const [x, z] = spot(0, 0, 30, 235, 12);
      if (inPlat(x, z, 2) || $G.HT(x, z) < $G.WLV + .4 || pts.some(p => Math.hypot(p[0] - x, p[1] - z) < 14)) continue;
      pts.push([x, z]);
    }
    if (!pts.length) continue;
    const im = new THREE.InstancedMesh(g, VMAT, pts.length);
    im.castShadow = im.receiveShadow = true;
    im.frustumCulled = false;
    pts.forEach(([x, z], i) => {
      const y = $G.HT(x, z);
      PD.position.set(x, y - .05, z);
      PD.rotation.set(0, rn(0, 6.28), 0);
      PD.scale.setScalar(ty == 'cr' ? rn(1.1, 1.5) : ty == 'kbb' ? rn(1.6, 1.9) : rn(.9, 1.25));
      PD.updateMatrix();
      im.setMatrixAt(i, PD.matrix);
      im.setColorAt(i, WHC);
      $G.BRK.push({
        ty,
        i,
        im,
        m: {
          position: {
            x,
            y: y + .8,
            z
          }
        }
      });
    });
    im.instanceMatrix.needsUpdate = true;
    sc.add(im);
    $G.BINST.push(im);
  }
}

export function mkPU(x, z, t, fy) {
  const m = mk(gPU, BMc(PUD[t].c), x, fy + 1.2, z);
  glow(PUD[t].c, 3, m, .6);
  $G.PU.push({
    m,
    t,
    by: fy
  });
}

export function __init_58() {
  mSil = BM(0xe6edf4);
  GHMAT = new THREE.MeshStandardMaterial({
    vertexColors: true,
    transparent: true,
    opacity: .5,
    depthWrite: false,
    color: 0xbff4ff,
    emissive: 0x1d5a66,
    roughness: .4
  });
  GDMAT = new THREE.MeshStandardMaterial({
    vertexColors: true,
    color: 0xffd27a,
    emissive: 0x4a3000,
    metalness: .8,
    roughness: .3
  });
  SVMAT = new THREE.MeshStandardMaterial({
    vertexColors: true,
    color: 0xdfe8f2,
    emissive: 0x203040,
    metalness: .9,
    roughness: .25
  });
  GHM2 = new THREE.MeshStandardMaterial({
    vertexColors: true,
    transparent: true,
    opacity: .55,
    depthWrite: false,
    color: 0xd8a8ff,
    emissive: 0x3a1260,
    roughness: .4
  });
  GHM3 = new THREE.MeshStandardMaterial({
    vertexColors: true,
    transparent: true,
    opacity: .6,
    depthWrite: false,
    color: 0xff9a8a,
    emissive: 0x6a0c08,
    roughness: .4
  });
  BDMAT = new THREE.MeshStandardMaterial({
    vertexColors: true,
    color: 0x8a7080,
    emissive: 0x2a0606,
    roughness: .55,
    metalness: .25
  });
}

// yerde çok kristal varsa yenisi en yakınına eklenir (çizim yükü sabit kalır)
export function drop(x, z, ty, v, fy) {
  if (ty == 'au' && chalFlag('nogold')) return;
  if ((ty == 'xp' || ty == 'au') && $G.G.length > 170) {
    let b = null,
      bd = 196;
    for (const o of $G.G) {
      if (o.ty != ty || o.air || o.pull || o.c) continue;
      const q = o.m.position,
        dd = (q.x - x) ** 2 + (q.z - z) ** 2;
      if (dd < bd) {
        bd = dd;
        b = o;
      }
    }
    if (b) {
      b.v += v;
      b.mg = (b.mg || 1) + 1;
      b.m.scale.setScalar(Math.min(2.2, 1 + Math.log2(b.mg) * .3));
      return;
    }
  }
  const by = groundAt(x, z, fy == null ? 1e9 : fy + .1),
    o = fakeM(x, by + .9, z);
  const g = {
    m: o,
    ty,
    v,
    by
  };
  if ($G.DSRC) {
    const s = $G.DSRC,
      a = rn(0, 6.283),
      sp = rn(1.5, 4.5),
      fl = .62;
    o.position.set(s.x, Math.max(s.y, by + .9), s.z);
    g.vx = (x - s.x) / fl + Math.cos(a) * sp;
    g.vz = (z - s.z) / fl + Math.sin(a) * sp;
    g.vy = rn(8, 12.5);
    g.air = 1;
    g.bc = 0;
  }
  $G.G.push(g);
}

export function setupStage() {
  [$G.E, $G.B, $G.B2, $G.ZN2, $G.EB, $G.G, $G.CH, $G.OB, $G.PT, $G.ZP, $G.SH, $G.POT, $G.BRK, $G.FB, $G.PU, $G.AX, $G.BO, $G.SW, $G.DY, $G.NP, $G.FXR, $G.SLS, $G.VXS, $G.MZ, $G.KS].forEach(clr);
  $G.MZC = null;
  // boss bölgeleri (lav, kum, buz): temizlenmezse eski koşunun bölgeleri yeni oyuncuyu yakar
  for (const z of $G.BZ || []) kill(z.m);
  $G.BZ = [];
  [$G.NV, $G.PZ].forEach(a => {
    a.forEach(o => kill(o.m));
    a.length = 0;
  });
  if ($G.AUm) {
    sc.remove($G.AUm);
    freeG($G.AUm);
    $G.AUm = null;
  }
  if ($G.ICm) {
    sc.remove($G.ICm);
    freeG($G.ICm);
    $G.ICm = null;
  }
  if ($G.GATE) {
    sc.remove($G.GATE.m);
    $G.GATE = null;
  }
  arenaClear();
  buildWorld(mapOf().bi);
  pruneE(k => k.endsWith('d') == ($G.BI == 1));
  gSync();
  $G.P.x = $G.P.z = 0;
  $G.P.y = groundTop(0, 0) + 1;
  $G.P.vx = $G.P.vy = $G.P.vz = 0;
  $G.FX = $G.FZ = 0;
  $G.FY = $G.P.y;
  const pl = [],
    sh = fireHook('stage', { sh: 0, pots: 0 });
  mkPots(pl, sh.pots);
  if (mapOf().k == 'mezarlik') for (let i = 0; i < 8; i++) {
    // Mahzen içi potlar (Megabonk: ilk mahzendeki her sandık ve pot)
    const a = i / 8 * 6.283 + rn(-.3, .3), r = rn(7, 20), x = Math.cos(a) * r, z = Math.sin(a) * r;
    pl.push({ x, y: $G.HT(x, z) + .7, z });
  }
  setupGate();
  for (const r of $G.RW) {
    if (r.t == 'pot') pl.push({
      x: r.x,
      y: r.y + .7,
      z: r.z
    });else mkChest({
      x: r.x,
      z: r.z,
      y: r.y
    });
  }
  potsBuild(pl);
  brkBuild();
  for (let i = 0; i < 20 + 2 * Math.min(3, $G.P.stage); i++) {
    const [x, z] = spot(0, 0, 22, 215, 9);
    mkChest({
      x,
      z
    });
  }
  const mk2 = mapOf().k,
    st = [...Array(15).fill(0), 1, 1, 1, 2, 3, 3, ...Array(8).fill(4), 6]; // 15 Ocak, 8 Açgözlülük (Fextralife)
  // Her aşamada iki Kara sunak: Zaman Büküğü (aynı aşamada iki kez) ve Kalpak (Bozkır'da iki sunak açıkken) görevleri
  // tek sunakla sağlanamıyordu; Mezarlık'ta ortak sunak havuzu iki kat olduğu için zaten iki tane var.
  if (mk2 == 'mezarlik') st.push(1, 1, 1, 2, 3, 3, 6);else st.push(6);
  if ($G.P.stage == 0 && !$G.P.chal) st.push(8);
  if (Math.random() < .35 + $G.P.stage * .3) st[1] = 5;
  if (mk2 == 'bozkir' && (!$G.META.l.haydut || Math.random() < .4)) st.push(7);
  if (mk2 == 'koru') {
    st.push(11); // kafes her aşamada (eskiden Yaban açılana dek; Yaban kadrodan çıktı, kafes artık sandık verir)
    if (Math.random() < .6) st.push(12);
  }
  if (mk2 == 'mezarlik') st.push(10, 10, 10, 10, ...Array(15).fill(9));
  // Denge taşı (Megabonk Balance Shrine) yalnız Mezarlık'ta, iki tane; Hediye (Christmas Present) ve Parlak Muz Kara Koru'da gizli
  if (mk2 == 'mezarlik') st.push(13, 13);
  if (mk2 == 'koru' && Math.random() < ($G.META.l.hat_noel ? .08 : .25)) st.push(14);
  if (mk2 == 'koru' && !$G.META.l.boom && Math.random() < .5) st.push(15);
  if (Math.random() < .3) st.push(16); // Yumurta (Megabonk Egg)
  if (mk2 == 'mezarlik') st.push(17); // İskelet Kralı heykeli
  if (chalFlag('noshrine')) {
    // sunaksız meydan okuma: zorunlu tabutlar kalır, yoksa Mezarlık'ta anahtar üretilemez ve boss hiç çağrılamaz
    const keep = st.filter(t => t == 10);
    st.length = 0;
    st.push(...keep);
  }
  st.forEach(mkSh);
  // Mezarlık'ın iki gizli nesnesi (Megabonk Old Mask ve Snek): görevleri vardı ama haritada karşılıkları yoktu,
  // Eski Maske ve Yılan hiç açılamıyordu. Maske haritada bir yerde, Yılan yuvası Mahzen'in içinde.
  if (mk2 == 'mezarlik' && !chalFlag('noshrine')) {
    if (!$G.META.l.eskimaske) mkSh(18);
    if (!$G.META.l.yilan) {
      $G.SHH.unshift(spot(0, 0, 10, 24, 6));
      mkSh(19);
    }
  }
  for (let i = 0; i < sh.sh; i++) mkSh(0);
  // Kara Koru: kafes anahtarı haritada bir yerde
  if (mk2 == 'koru') {
    const [kx, kz] = spot(0, 0, 60, 200, 10);
    drop(kx, kz, 'ky', 1);
  }
  if (!$G.META.l['hat_kurbaga' + (Math.min(2, $G.P.stage) + 1)]) { // her diyarda bir gizli kurbağa
    // gizli kurbağa (Megabonk Frog): uzak bir köşede, yaklaşınca zıplayarak kaçar
    const [fx2, fz2] = spot(0, 0, 120, 225, 10);
    spawn('kurbaga', { x: fx2, z: fz2, nodrop: 1 });
  }
  mkNPC('shop');
  mkNPC('shop');
  for (let i = 0, n = mk2 == 'mezarlik' ? 3 + (Math.random() * 3 | 0) : 1 + (Math.random() * 2 | 0); i < n; i++) mkNPC('kazan'); // 1-2, Mezarlık 3-5
  if ($G.P.stage >= 1) mkNPC('shop');
  mkGraves();
  mkDrums();
  $G.P.mzN = 0;
  $G.P.mzA = null;
  $G.P.kosN = 0;
  if ($G.P.kosB) {
    $G.P.kosB = 0;
    calc();
  }
  $G.P.mbT = 150;
  $G.P.mbN = 0;
  $G.P.chT = 35;
  $G.P.thT = rn(50, 90);
  $G.P.akin = 0;
  $G.P.akN = 0;
  $G.P.ot = 0;
  $G.P.chF = 0;
  $G.P.stS = $G.P.stT;
  $G.P.stDmg = 0;
  $G.P.bossCur = 0; // Kara sunak sayacı aşama başına (Megabonk)
  $G.P.bossCurN = 0;
  $G.P.fog = null;
  $G.P.mbN = 0;
  $G.spT = 0;
  gyInit();
  if ($G.P.mz) {
    for (let i = 0; i < 2; i++) {
      const a = rn(0, 6.283), r = rn(9, 22);
      mkChest({ x: Math.cos(a) * r, z: Math.sin(a) * r, free: 1 });
    }
    for (const p of $G.POT) if (Math.hypot(p.m.position.x, p.m.position.z) < 28) p.mz = 1;
    for (const c of $G.CH) if (Math.hypot(c.m.position.x, c.m.position.z) < 28) c.mz = 1;
    $G.P.mzK = { pots: $G.POT.filter(p => p.mz), ch: $G.CH.filter(c => c.mz).length };
    $G.P.mzOpened = 0;
  }
  if (isArena()) {
    // final arenası: mühür duvarı, dışarıdaki nesneler kaldırılır, kapı merkeze yakın, boss otomatik gelir
    arenaBuild();
    arenaTrim();
    if ($G.GATE) {
      const x = 0, z = -26, ry = Math.atan2(-x, -z);
      $G.GATE.m.position.set(x, $G.HT(x, z) - .2, z);
      $G.GATE.m.rotation.y = ry;
      $G.GATE.x = x;
      $G.GATE.z = z;
      $G.GATE.ry = ry;
    }
    $G.P.arenaT = 4;
  }
}
// ---- akış
