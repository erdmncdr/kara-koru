// game/features.js · Kara Koru
// Bu dosya tek dosyalık sürümden (v22) otomatik ayrıldı. Ortak oyun durumu core/store.js içindeki $G nesnesinde.

import { $G } from '../core/store.js';
import { dadEvent } from './graveyard.js';
import { saveMeta } from '../data/content.js';
import { THREE } from '../engine/three.js';
import { sfx, sfxAt } from '../audio/engine.js';
import { toast } from '../core/helpers.js';
import { rn } from '../core/util.js';
import { VMAT, envG, glow, sc } from '../engine/renderer.js';
import { puff, ringFx } from '../engine/vfx.js';
import { hurtE, spawn } from './enemies.js';
import { drop, mkChest, spot } from './objects.js';
import { calc } from './stats.js';
import { MAPM } from '../world/mapm.js';
import { addObs } from '../world/terrain.js';

// ---- Dört Mezar: her mezar bir ruh bekçisi çıkarır, dördü de huzura erince altın sandık
export function drySpot(a0, a1, sep, pad) {
  for (let k = 0; k < 30; k++) {
    const p = spot(0, 0, a0, a1, sep),
      ok = (x, z) => $G.HT(x, z) > $G.WLV + .6 && !$G.LMS.some(l => Math.hypot(l.x - x, l.z - z) < l.r + pad);
    if (ok(p[0], p[1]) && ok(p[0] + pad * .7, p[1]) && ok(p[0] - pad * .7, p[1]) && ok(p[0], p[1] + pad * .7) && ok(p[0], p[1] - pad * .7)) return p;
  }
  return spot(0, 0, a0, a1, sep);
}

export function mkGraves() {
  const [cx, cz] = drySpot(70, 205, 34, 15),
    a0 = rn(0, 6.283),
    ds = $G.BI == 1;
  $G.MZC = {
    x: cx,
    z: cz
  };
  for (let i = 0; i < 4; i++) {
    const a = a0 + (i - 1.5) * .5,
      x = cx + Math.cos(a) * 11,
      z = cz + Math.sin(a) * 11,
      y = $G.HT(x, z),
      g = new THREE.Group(),
      ry = Math.atan2(cx - x, cz - z);
    g.position.set(x, y - .05, z);
    g.rotation.y = ry;
    sc.add(g);
    const m = new THREE.Mesh(envG('grave' + i % 2 + $G.BI, () => MAPM.grave(ds, i % 2).g, 1), VMAT);
    m.castShadow = m.receiveShadow = true;
    g.add(m);
    const gl = glow(0x9fc0e8, 1.6, g, .55);
    gl.position.set(0, 1.9, -.75);
    addObs({
      x: x - Math.sin(ry) * .75,
      z: z - Math.cos(ry) * .75,
      r: .5,
      t: y + 1.5
    });
    $G.MZ.push({
      m: g,
      i,
      st: 0,
      gl
    });
  }
  const st = new THREE.Mesh(envG('mzs' + $G.BI, () => MAPM.stela(2.2, ds ? 0xa88a6a : 0x7a7468, 1), 1), VMAT);
  st.castShadow = true;
  st.position.set(cx, $G.HT(cx, cz) - .05, cz);
  st.rotation.y = a0 + Math.PI / 2;
  sc.add(st);
  $G.MZ.push({
    m: st,
    i: 9,
    st: 3
  });
  addObs({
    x: cx,
    z: cz,
    r: .6,
    t: $G.HT(cx, cz) + 2.2
  });
}

export function wakeGrave(g) {
  if ($G.P.mzA) {
    toast('Önceki ruh hâlâ dolaşıyor. Önce onu devir.');
    sfx('deny');
    return;
  }
  const n = $G.P.mzN || 0,
    tier = [1, 1, 2, 3][n],
    q = g.m.position,
    ry = g.m.rotation.y;
  g.st = 1;
  $G.P.mzA = g;
  g.gl.visible = false;
  puff(q.x, q.y + 1, q.z, 0x9fb8d8, 22);
  ringFx(q.x, q.y + .2, q.z, 0x9fb8d8, 7, 10);
  sfxAt('growl9', q.x, q.z);
  $G.shk = Math.max($G.shk, .25);
  spawn(1, {
    x: q.x + Math.sin(ry) * 2.6,
    z: q.z + Math.cos(ry) * 2.6,
    ghost: tier,
    mini: 1,
    grave: g,
    nm: ['Mezar ruhu', 'İkinci mezar ruhu', 'Yaşlı mezar ruhu', 'Mezarlık bekçisi'][n],
    hk: [3, 4.5, 6.5, 9][n],
    dk: [.45, .45, .45, .5][n]
  });
}

export function graveDone(e) {
  const g = e.grave;
  g.st = 2;
  $G.P.mzA = null;
  $G.P.mzN = ($G.P.mzN || 0) + 1;
  const q = g.m.position;
  ringFx(q.x, q.y + .2, q.z, 0xe2c56a, 6, 12);
  if ($G.P.mzN >= 4 && $G.MZC) {
    $G.P.mzD = 1;
    const c = $G.MZC,
      fy = $G.HT(c.x, c.z);
    mkChest({
      x: c.x + 2.5,
      z: c.z,
      free: 1,
      gold: 1
    });
    for (let i = 0; i < 3 + $G.P.stage; i++) drop(c.x + rn(-2, 2), c.z + rn(-2, 2), 'sv', 1, fy);
    setTimeout(() => {
      toast('Dört mezar da huzura erdi. Mezarlığın ortasında altın sandık belirdi.');
      sfx('quest');
    }, 1400);
    dadEvent();
  } else setTimeout(() => toast(`Ruh huzura erdi. ${4 - $G.P.mzN} mezar kaldı.`), 1400);
}
// ---- Kös davulları: her vuruş yakın düşmanları sarsar ve yenilerini çağırır; üçü de çalınınca aşama boyunca hasar artar

// ---- Kös davulları: her vuruş yakın düşmanları sarsar ve yenilerini çağırır; üçü de çalınınca aşama boyunca hasar artar
export function mkDrums() {
  for (let i = 0; i < 3; i++) {
    const [x, z] = drySpot(45, 215, 40, 4),
      y = $G.HT(x, z),
      g = new THREE.Group();
    g.position.set(x, y - .05, z);
    g.rotation.y = rn(0, 6.283);
    sc.add(g);
    const m = new THREE.Mesh(envG('kos', () => MAPM.kos($G.BI == 1).g, 1), VMAT);
    m.castShadow = m.receiveShadow = true;
    g.add(m);
    const gl = glow(0xe2b04a, 2.2, g, .45);
    gl.position.set(0, 3.1, 0);
    addObs({
      x,
      z,
      r: 1.35,
      t: y + 2.6
    });
    $G.KS.push({
      m: g,
      b: m,
      gl,
      d: 0,
      w: 0
    });
  }
}

export function hitKos(k) {
  if ($G.KS.filter(x => x.d).length >= $G.KS.length - 1 && !$G.META.l.boombox) {
    $G.META.l.boombox = 1;
    saveMeta();
    setTimeout(() => toast('Üç kös de çalındı. Otağ’da Davul açılabilir.'), 1200);
  }
  if (k.d) return;
  k.d = 1;
  k.w = .8;
  k.gl.visible = false;
  $G.P.kosN = ($G.P.kosN || 0) + 1;
  const q = k.m.position;
  sfxAt('kos', q.x, q.z);
  ringFx(q.x, q.y + 1.6, q.z, 0xd9b26a, 14, 22);
  ringFx(q.x, q.y + .3, q.z, 0xd9b26a, 10, 16);
  $G.shk = Math.max($G.shk, .35);
  for (const o of $G.E) {
    const p = o.m.position;
    if (!o.dead && o.t != 3 && Math.hypot(p.x - q.x, p.z - q.z) < 12) hurtE(o, 25 * $G.P.C.dmg * (1 + $G.P.stage), 1);
  }
  const n = 6 + $G.P.stage * 3;
  for (let i = 0; i < n; i++) {
    const a = i / n * 6.283;
    spawn(i % 3 == 2 ? 1 : 0, {
      x: q.x + Math.cos(a) * 24,
      z: q.z + Math.sin(a) * 24
    });
  }
  if ($G.P.kosN >= 3) {
    $G.P.kosB = 1;
    calc();
    for (let i = 0; i < 2 + $G.P.stage; i++) drop(q.x + rn(-2, 2), q.z + rn(-2, 2), 'sv', 1, q.y);
    toast('Üç kös de çalındı. Bu aşama boyunca hasarın %15 arttı.');
    setTimeout(() => sfx('quest'), 500);
  } else toast(`Kös çalındı, düşmanlar sese geliyor. ${3 - $G.P.kosN} kös kaldı.`);
}

export function featTick(dt) {
  if ($G.S != 'play') return;
  for (const g of $G.MZ) if (g.st == 0 && g.gl) g.gl.position.y = 1.9 + Math.sin($G.T * 2.2 + g.i) * .18;
  for (const k of $G.KS) {
    if (k.w > 0) {
      k.w = Math.max(0, k.w - dt);
      const s = 1 + .07 * Math.sin(k.w * 38) * k.w;
      k.b.scale.set(s, 1 / s, s);
    } else if (!k.d) k.gl.material.opacity = .3 + .2 * Math.sin($G.T * 3);
  }
  if ($G.P.mzA && Math.floor($G.T) != Math.floor($G.T - dt) && !$G.E.some(e => e.grave === $G.P.mzA && !e.dead)) {
    $G.P.mzA.st = 0;
    $G.P.mzA.gl.visible = true;
    $G.P.mzA = null;
  }
}
