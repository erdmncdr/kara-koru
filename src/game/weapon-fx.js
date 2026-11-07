// game/weapon-fx.js · Kara Koru
// Bu dosya tek dosyalık sürümden (v22) otomatik ayrıldı. Ortak oyun durumu core/store.js içindeki $G nesnesinde.

import { $G } from '../core/store.js';
import { THREE } from '../engine/three.js';
import { sfxAt } from '../audio/engine.js';
import { mk, sc } from '../engine/renderer.js';
import { VFX, ringFx } from '../engine/vfx.js';
import { KBM, hurtE } from './enemies.js';
import { groundAt } from '../world/terrain.js';

export let gSlash, VTX, gVc, gVr;

export function __init_68() {
  // ---- kılıç savuruşu: parlayan hilal
  gSlash = (() => {
    const g = new THREE.BufferGeometry(),
      N = 26,
      A = 1.25,
      p = [],
      c = [],
      ix = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N * 2 - 1,
        th = t * A,
        w = .22 * (1 - t * t) + .03,
        e = Math.max(0, 1 - Math.pow(Math.abs(t), 3)),
        cs = Math.cos(th),
        sn = Math.sin(th);
      p.push(cs, 0, sn, cs * (1 - w), 0, sn * (1 - w));
      c.push(e, e * .9, e * .72, .08 * e, .06 * e, .04 * e);
    }
    for (let i = 0; i < N; i++) {
      const a = i * 2;
      ix.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3));
    g.setIndex(ix);
    return g;
  })();
}

export function mkSlash(a, Rr, d, t0, sg) {
  const m = new THREE.Mesh(gSlash, new THREE.MeshBasicMaterial({
    vertexColors: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: 2,
    opacity: 1
  }));
  m.visible = false;
  sc.add(m);
  return {
    m,
    a,
    R: Rr,
    d,
    t: t0,
    sg,
    h: 0
  };
}

export function slUpd(dt) {
  // aynı anda çok savuruş (güçlenmiş seviye) üst üste binip beyaza patlamasın: opaklık paylaşılır
  const sop = .55 / Math.sqrt(Math.max(1, $G.SLS.length * .5));
  for (const s of $G.SLS) {
    s.t += dt;
    if (s.t < 0) continue;
    const k = s.t / .24,
      m = s.m,
      gr = .85 + .2 * Math.min(1, k * 3);
    m.visible = true;
    m.position.set($G.P.x, $G.P.y - .2, $G.P.z);
    m.rotation.y = s.a - Math.PI / 2 + (k - .5) * .9 * s.sg;
    m.scale.set(s.R * gr, 1, s.R * gr);
    m.material.opacity = sop * Math.max(0, 1 - k * k);
    if (!s.h) {
      s.h = 1;
      for (const e of $G.E) {
        if (e.dead) continue;
        const p = e.m.position,
          dx = p.x - $G.P.x,
          dz = p.z - $G.P.z,
          d = Math.hypot(dx, dz);
        if (d > s.R + e.r * .6 || Math.abs(p.y + e.r - $G.P.y) > 3.2) continue;
        let da = Math.atan2(dx, dz) - s.a;
        da = Math.atan2(Math.sin(da), Math.cos(da));
        if (Math.abs(da) < (s.arc || 1.3) || d < e.r + .8) hurtE(e, s.d, 0, s.o || null);
      }
      for (let i = 0; i < 4; i++) {
        const aa = s.a + (i / 3 - .5) * (s.arc ? s.arc * 1.8 : 2.3),
          rr = s.R * .86;
        VFX.emit(VFX.SPK, $G.P.x + Math.sin(aa) * rr, $G.P.y - .1, $G.P.z + Math.cos(aa) * rr, {
          n: 1,
          sp: [3, 7],
          dir: [Math.sin(aa), .25, Math.cos(aa)],
          cone: .4,
          life: [.12, .22],
          s: [.3, .5],
          s1: .2,
          c: 0xfff2c8,
          br: 1,
          g: 4
        });
      }
    }
    if (k >= 1) {
      sc.remove(m);
      m.material.dispose();
      s.done = 1;
    }
  }
  if ($G.SLS.length) $G.SLS = $G.SLS.filter(s => !s.done);
}
// ---- girdap: çeker, ezer, patlar

export function __init_69() {
  // ---- girdap: çeker, ezer, patlar
  VTX = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const x = c.getContext('2d');
    if (!x) return null;
    x.translate(64, 64);
    for (let arm = 0; arm < 3; arm++) for (let i = 0; i < 70; i++) {
      const t = i / 70,
        a = arm * 2.094 + t * 5.8,
        r = 7 + t * 55;
      x.fillStyle = 'rgba(255,255,255,' + (.5 * (1 - t) + .06).toFixed(3) + ')';
      x.beginPath();
      x.arc(Math.cos(a) * r, Math.sin(a) * r, 2 + t * 7, 0, 6.283);
      x.fill();
    }
    return new THREE.CanvasTexture(c);
  })();
  gVc = new THREE.CircleGeometry(1, 28);
  gVr = new THREE.RingGeometry(.2, 1, 40, 1);
}

export function mkVortex(x, z, Rr, d, l) {
  const y = groundAt(x, z, $G.P.y + 2) + .12,
    g = new THREE.Group();
  g.position.set(x, y, z);
  const c = mk(gVc, new THREE.MeshBasicMaterial({
    color: 0x07030c,
    transparent: true,
    opacity: 0,
    depthWrite: false
  }), 0, .03, 0, g);
  c.rotation.x = -Math.PI / 2;
  c.scale.setScalar(.42);
  const r1 = mk(gVr, new THREE.MeshBasicMaterial({
    map: VTX,
    color: 0xb47aff,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: 2,
    opacity: 0
  }), 0, .06, 0, g);
  r1.rotation.x = -Math.PI / 2;
  const r2 = mk(gVr, new THREE.MeshBasicMaterial({
    map: VTX,
    color: 0x5a3cff,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: 2,
    opacity: 0
  }), 0, .1, 0, g);
  r2.rotation.x = -Math.PI / 2;
  r2.scale.setScalar(.68);
  sc.add(g);
  return {
    m: g,
    c,
    r1,
    r2,
    x,
    z,
    y,
    R: Rr,
    d,
    l,
    L: l,
    tk: .2
  };
}

export function vxUpd(dt) {
  for (const v of $G.VXS) {
    v.l -= dt;
    const fi = Math.min(1, (v.L - v.l) * 4),
      fo = Math.min(1, Math.max(0, v.l) * 3),
      a = fi * fo;
    v.m.scale.setScalar(v.R * (.55 + .45 * fi));
    v.c.material.opacity = .8 * a;
    v.r1.material.opacity = .95 * a;
    v.r2.material.opacity = .75 * a;
    v.r1.rotation.z += dt * 5;
    v.r2.rotation.z -= dt * 8;
    v.tk -= dt;
    const tick = v.tk <= 0;
    if (tick) v.tk = .4;
    for (const e of $G.E) {
      if (e.dead || e.t == 3) continue;
      const p = e.m.position,
        dx = v.x - p.x,
        dz = v.z - p.z,
        d = Math.hypot(dx, dz) || 1;
      if (d < v.R * 1.8 && Math.abs(p.y - v.y) < 5) {
        const pk = KBM[e.t] * (e.mini ? .3 : 1) * 85 * dt * (1.3 - d / (v.R * 1.8));
        if (d > .6) {
          e.kx = (e.kx || 0) + dx / d * pk;
          e.kz = (e.kz || 0) + dz / d * pk;
        }
        if (d < v.R * 1.3) e.slow = Math.max(e.slow, .12);
        if (tick && d < v.R) hurtE(e, v.d, true, { w: 'vortex' }); // silah anahtarı: koşu sonu hasar grafiği ve öldürme sayacı
      }
    }
    for (let i = 0; i < 3; i++) {
      const an = Math.random() * 6.283,
        rr = v.R * (.55 + Math.random() * .6),
        px = v.x + Math.cos(an) * rr,
        pz = v.z + Math.sin(an) * rr;
      VFX.emit(VFX.ADD, px, v.y + .25 + Math.random() * .7, pz, {
        n: 1,
        sp: [v.R * 1.4, v.R * 2.2],
        dir: [-Math.sin(an) * 1.5 - Math.cos(an), .05, Math.cos(an) * 1.5 - Math.sin(an)],
        cone: 0,
        life: [.3, .5],
        s: [.18, .32],
        s1: .1,
        c: 0xc090ff,
        d: 1.5
      });
    }
    if (v.l <= 0) {
      for (const e of $G.E) {
        if (e.dead) continue;
        const p = e.m.position;
        if (Math.hypot(p.x - v.x, p.z - v.z) < v.R * 1.15 && Math.abs(p.y - v.y) < 5) hurtE(e, v.d * 3, 0, { w: 'vortex' });
      }
      VFX.emit(VFX.ADD, v.x, v.y + .6, v.z, {
        n: 1,
        sp: [0, 0],
        life: [.16, .18],
        s: [v.R * 2.4, v.R * 2.6],
        s1: .5,
        c: 0xd8b0ff
      });
      VFX.emit(VFX.ADD, v.x, v.y + .4, v.z, {
        n: 26,
        sp: [v.R * 2, v.R * 4],
        flat: .08,
        life: [.3, .5],
        s: [.4, .7],
        s1: .2,
        c: 0xb47aff,
        c1: 0x2a0a5a,
        d: 3
      });
      ringFx(v.x, v.y + .1, v.z, 0xb47aff, v.R * 1.2, 20);
      sfxAt('boom', v.x, v.z);
      $G.shk = Math.max($G.shk, .15);
      sc.remove(v.m);
      v.c.material.dispose();
      v.r1.material.dispose();
      v.r2.material.dispose();
      v.done = 1;
    }
  }
  if ($G.VXS.length) $G.VXS = $G.VXS.filter(v => !v.done);
}
// ---- güncelleme
