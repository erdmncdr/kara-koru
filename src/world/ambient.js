// world/ambient.js · Kara Koru
// Bu dosya tek dosyalık sürümden (v22) otomatik ayrıldı. Ortak oyun durumu core/store.js içindeki $G nesnesinde.

import { $G } from '../core/store.js';
import { THREE } from '../engine/three.js';
import { sfx, sfxAt } from '../audio/engine.js';
import { toast } from '../core/helpers.js';
import { cl, rn } from '../core/util.js';
import { lin, setLin } from '../engine/color.js';
import { HALO, RIMU, cam, dl, glow, hemi, sc, sp, toBG } from '../engine/renderer.js';
import { VFX, puff } from '../engine/vfx.js';
import { drop } from '../game/objects.js';
import { GEO } from '../geo/geo.js';
import { MODELS } from '../geo/models.js';
import { WTEX, buildMap } from './build.js';
import { MAPGEN } from './mapgen.js';
import { BIO, FN, WG, paintSky } from './terrain.js';

export let pl, gPot;

export function __init_26() {
  // ---- harita güncelleme: su, ateş, kuş, bulut, yaprak, toz, yuvarlanan çalı, kum fırtınası, keşif
  $G.leafT = 0;
  $G.dustT = 0;
  $G.fireL = null;
  $G.smvT = 0;
}

export function mapUpd(dt) {
  if ($G.stars) $G.stars.material.opacity = (BIO[$G.BI].starA == null ? .85 : BIO[$G.BI].starA) * (.85 + .15 * Math.sin($G.T * 1.7)); // yıldız parıltısı
  if (!$G.MAP) return;
  $G.smvT -= dt;
  if ($G.smvT <= 0 && typeof cam != 'undefined') {
    $G.smvT = .25;
    const cx = cam.position.x,
      cz = cam.position.z;
    for (const m of $G.SMV) {
      const b = m.geometry.boundingSphere;
      m.visible = Math.hypot(b.center.x - cx, b.center.z - cz) < b.radius + 25;
    }
  }
  const pl = $G.S == 'play' && $G.P;
  if (WTEX) {
    WTEX.offset.x += dt * .012;
    WTEX.offset.y += dt * .007;
  }
  let nf = null,
    nd = 1e9;
  for (const f of $G.FIRES) {
    f.t += dt;
    const fl = .85 + .15 * Math.sin(f.t * 13) + .1 * Math.sin(f.t * 7.3);
    f.gl.scale.setScalar((f.k == 0 ? 4.5 : f.k == 2 ? 6 : 2.4) * fl);
    if (f.fl) f.fl.forEach((c, i) => {
      c.scale.y = (1.1 - i * .2) * (.8 + .35 * Math.sin(f.t * (11 + i * 3) + i));
    });
    if ($G.P) {
      const d = Math.hypot(f.x - $G.P.x, f.z - $G.P.z);
      if (d < nd && f.k != 2) {
        nd = d;
        nf = f;
      }
      if (d < 60 && Math.random() < dt * (f.k == 0 ? 14 : f.k == 2 ? 5 : 3)) VFX.emit(f.k == 2 ? VFX.ADD : VFX.ADD, f.x + rn(-.3, .3), f.y + .2, f.z + rn(-.3, .3), {
        n: 1,
        sp: [0, .5],
        up: f.k == 2 ? 1 : 2.6,
        upr: 1.5,
        life: [.6, 1.2],
        s: [.08, .16],
        s1: .2,
        c: f.k == 2 ? 0x9ff8e0 : 0xffb050,
        g: -.4,
        d: 1.2
      });
    }
  }
  if (!$G.fireL) {
    $G.fireL = new THREE.PointLight(new THREE.Color().setHex(0xff9a4a, THREE.LinearSRGBColorSpace), 0, 20, 1);
    sc.add($G.fireL);
  }
  if (nf && nd < 30) {
    $G.fireL.position.set(nf.x, nf.y + 1, nf.z);
    $G.fireL.intensity = Math.PI * (nf.k == 0 ? 1.6 : .8) * (1 - nd / 30) * (.85 + .15 * Math.sin($G.T * 13));
  } else $G.fireL.intensity = 0;
  for (const b of $G.BIRDS) {
    b.a += dt * b.s;
    const x = b.cx + Math.cos(b.a) * b.R,
      z = b.cz + Math.sin(b.a) * b.R;
    b.b.position.set(x, b.h + Math.sin($G.T * .7 + b.ph) * 1.5, z);
    b.b.rotation.y = -b.a + (b.s > 0 ? 0 : Math.PI);
    const w = Math.sin($G.T * 9 + b.ph) * .6;
    b.l.rotation.z = w;
    b.r.rotation.z = -w;
  }
  for (const f of $G.FLAGS) {
    f.t += dt;
    const pa = f.m.geometry.attributes.position, b = f.base;
    for (let i = 0; i < pa.count; i++) {
      const x = b[i * 3], y = b[i * 3 + 1];
      pa.setZ(i, Math.sin(x * 2.4 - f.t * 6 + y) * .12 * x + Math.sin(x * 5 - f.t * 9) * .04 * x);
    }
    pa.needsUpdate = true;
  }
  // Mezarlık: gezinen ruh ışıkları (will-o'-wisp), oyuncuya yaklaşınca kaçar
  if ($G.BI == 2 && $G.P) {
    if (!$G.WISP) $G.WISP = [...Array(14)].map(() => ({ x: rn(-200, 200), z: rn(-200, 200), a: rn(0, 6.28), t: rn(0, 6), g: null }));
    for (const w of $G.WISP) {
      w.t += dt;
      w.a += Math.sin(w.t * .7) * dt * .8;
      const pd = Math.hypot(w.x - $G.P.x, w.z - $G.P.z);
      if (pd < 6) w.a = Math.atan2(w.z - $G.P.z, w.x - $G.P.x);
      const sp = pd < 6 ? 9 : 2.2;
      w.x = cl(w.x + Math.cos(w.a) * sp * dt);
      w.z = cl(w.z + Math.sin(w.a) * sp * dt);
      if (!w.g) {
        w.g = glow(0xb8a8ff, 2.6, sc, .55);
      }
      w.g.position.set(w.x, $G.HT(w.x, w.z) + 1.6 + Math.sin(w.t * 2) * .35, w.z);
      w.g.material.opacity = .35 + .25 * Math.sin(w.t * 3.1);
      if (pd < 70 && Math.random() < dt * 4) VFX.emit(VFX.ADD, w.x, $G.HT(w.x, w.z) + 1.6, w.z, { n: 1, sp: [0, .4], life: [.6, 1.1], s: [.12, .2], s1: .2, c: 0xc8b8ff, g: -.3, d: 1 });
    }
  } else if ($G.WISP) {
    for (const w of $G.WISP) if (w.g) sc.remove(w.g);
    $G.WISP = null;
  }
  for (const c of $G.CLOUDS) {
    c.position.x += dt * 2.2;
    if (c.position.x > 340) c.position.x = -340;
  }
  if (!pl) return;
  // yapraklar / toz
  $G.leafT -= dt;
  if ($G.BI == 0 && $G.leafT <= 0) {
    $G.leafT = .12;
    const a = rn(0, 6.28),
      r = rn(4, 22),
      x = $G.P.x + Math.cos(a) * r,
      z = $G.P.z + Math.sin(a) * r;
    if (MAPGEN.fb(x / 70, z / 70, 2, $G.MAP.seed % 9973 + 50) > .05) VFX.emit(VFX.ALP, x, $G.HT(x, z) + rn(5, 9), z, {
      n: 1,
      sp: [0, .6],
      life: [3, 4.5],
      s: [.12, .2],
      s1: 1,
      c: [0xc8902a, 0x9aa83a, 0xd8b04a, 0x6a8a2a][Math.random() * 4 | 0],
      g: .5,
      d: 1.8
    });
  }
  if ($G.BI == 2 && $G.leafT <= 0) {
    // mezarlık: ağır süzülen kül ve soluk ruh zerreleri
    $G.leafT = .16;
    const a = rn(0, 6.28),
      r = rn(3, 24),
      x = $G.P.x + Math.cos(a) * r,
      z = $G.P.z + Math.sin(a) * r;
    VFX.emit(VFX.ALP, x, $G.HT(x, z) + rn(.5, 6), z, {
      n: 1,
      sp: [0, .35],
      life: [4, 6.5],
      s: [.07, .13],
      s1: 1,
      c: [0xb8a8ff, 0x8a8aa0, 0xd0d0e0, 0x6a6a80][Math.random() * 4 | 0],
      g: .04,
      d: 1
    });
  }
  $G.dustT -= dt;
  if ($G.BI == 1 && $G.dustT <= 0) {
    $G.dustT = $G.STORM.on ? .03 : .35;
    const a = rn(0, 6.28),
      r = rn(3, $G.STORM.on ? 14 : 26),
      x = $G.P.x + Math.cos(a) * r,
      z = $G.P.z + Math.sin(a) * r;
    VFX.emit(VFX.ALP, x, $G.HT(x, z) + rn(.3, $G.STORM.on ? 4 : 1.5), z, {
      n: 1,
      dir: [1, .05, .35],
      cone: .3,
      sp: [$G.STORM.on ? 14 : 4, $G.STORM.on ? 24 : 8],
      life: [1, 1.8],
      s: [.5, 1],
      s1: 2.4,
      c: 0xc89a6a,
      d: .6
    });
  }
  // yuvarlanan çalılar
  for (const t of $G.TUMB) {
    const q = t.m.position;
    if (Math.hypot(q.x - $G.P.x, q.z - $G.P.z) > 90) {
      const a = Math.atan2(-.35, -1) + rn(-.6, .6);
      q.x = cl($G.P.x + Math.cos(a) * 70);
      q.z = cl($G.P.z + Math.sin(a) * 70);
      q.y = $G.HT(q.x, q.z) + 1;
    }
    const wv = $G.STORM.on ? 13 : 5;
    t.vx += (wv - t.vx) * dt * .8;
    t.vz += (wv * .35 - t.vz) * dt * .8;
    t.vy -= 24 * dt;
    q.x = cl(q.x + t.vx * dt);
    q.z = cl(q.z + t.vz * dt);
    q.y += t.vy * dt;
    const g = $G.HT(q.x, q.z) + .6 * t.s;
    if (q.y < g) {
      q.y = g;
      t.vy = rn(3, 7);
    }
    t.m.rotation.z -= t.vx * dt / (.7 * t.s);
    t.m.rotation.x += t.vz * dt / (.7 * t.s);
    t.m.scale.setScalar(t.s);
    if ($G.S == 'play' && Math.hypot(q.x - $G.P.x, q.z - $G.P.z) < 1.2 + t.s * .8 && Math.abs(q.y - $G.P.y) < 2.6) {
      try {
        puff(q.x, q.y, q.z, 0xc8a060, 16);
        sfxAt('swish', q.x, q.z);
        $G.DSRC = {
          x: q.x,
          y: q.y,
          z: q.z
        };
        const fy = $G.HT(q.x, q.z);
        if (Math.random() < .68) {
          const n = 2 + (Math.random() * 2 | 0);
          for (let i = 0; i < n; i++) drop(q.x + rn(-1.5, 1.5), q.z + rn(-1.5, 1.5), 'au', 1 + $G.P.stage, fy);
        } else for (let i = 0; i < 3; i++) drop(q.x + rn(-1.5, 1.5), q.z + rn(-1.5, 1.5), 'xp', 2 + $G.P.stage, fy);
        if (Math.random() < .03) drop(q.x, q.z, 'sv', 1, fy);
        $G.DSRC = null;
        $G.P.tmb = ($G.P.tmb || 0) + 1;
      } catch (e) {}
      const a = Math.atan2(-.35, -1) + rn(-.6, .6);
      q.x = cl($G.P.x + Math.cos(a) * 70);
      q.z = cl($G.P.z + Math.sin(a) * 70);
      q.y = $G.HT(q.x, q.z) + 1;
    }
  }
  // kum fırtınası
  if ($G.BI == 1) {
    $G.STORM.t -= dt;
    if (!$G.STORM.on && $G.STORM.t <= 0) {
      $G.STORM.on = 1;
      $G.STORM.t = 20;
      toast('Kum fırtınası çıktı. Görüş daraldı.');
      sfx('tornado');
    } else if ($G.STORM.on && $G.STORM.t <= 0) {
      $G.STORM.on = 0;
      $G.STORM.t = 130 + Math.random() * 60;
    }
    $G.STORM.k += (($G.STORM.on ? 1 : 0) - $G.STORM.k) * Math.min(1, dt * .7);
    const B = BIO[1];
    sc.fog.near = B.fog[0] + (10 - B.fog[0]) * $G.STORM.k;
    sc.fog.far = B.fog[1] + (62 - B.fog[1]) * $G.STORM.k;
    if ($G.STORM.k > .01) {
      const c = lin(B.sky).lerp(lin(0xc8905a), $G.STORM.k);
      sc.fog.color.copy(c);
      sc.background.copy(c);
    }
  }
  // keşif
  for (const l of $G.LMS) {
    if (l.f) continue;
    if (Math.hypot($G.P.x - l.x, $G.P.z - l.z) < l.r + 2) {
      l.f = 1;
      toast(l.n + ' keşfedildi');
      sfx('quest');
      $G.DSRC = {
        x: $G.P.x,
        y: $G.P.y + 1.5,
        z: $G.P.z
      };
      for (let i = 0; i < 4; i++) drop($G.P.x + rn(-2, 2), $G.P.z + rn(-2, 2), 'xp', 2 + $G.P.stage * 2, $G.P.y - 1);
      $G.DSRC = null;
    }
  }
}

export function buildWorld(bi) {
  $G.BI = bi;
  const B = $G.P && $G.P.chal && $G.P.chal.fl && $G.P.chal.fl.fog ? { ...BIO[bi], fog: [12, 60] } : BIO[bi];
  while (WG.children.length) {
    const o = WG.children.pop();
    // InstancedMesh.dispose() instanceMatrix/instanceColor GPU tamponlarını bırakır;
    // geometriyi yalnızca bu yapının sahip olduğu (paylaşılmayan) meshlerde sil.
    o.traverse(c => {
      if (c.isInstancedMesh) c.dispose();
      const g = c.geometry;
      if ((c.isInstancedMesh || c.userData.own || g && g.userData && g.userData.own) && g && g.dispose) g.dispose();
    });
  }
  $G.OBS = [];
  $G.OG = new Map();
  $G.PLF = [];
  $G.PG = new Map();
  $G.JP = [];
  $G.RW = [];
  setLin(sc.background, B.sky);
  setLin(sc.fog.color, B.sky);
  sc.fog.near = B.fog[0];
  sc.fog.far = B.fog[1];
  setLin(hemi.color, B.hemi[0]);
  RIMU.value.copy(lin(bi == 1 ? 0x9a6a4a : 0x6a6a8a)).multiplyScalar(.4);
  setLin(hemi.groundColor, B.hemi[1]);
  hemi.intensity = B.hemi[2] * Math.PI;
  setLin(dl.color, B.sun);
  dl.intensity = B.sunI * Math.PI;
  buildMap(bi);
  paintSky(B);
  if ($G.GRP && $G.GRP.uniforms.uTint) $G.GRP.uniforms.uTint.value.fromArray(B.tint || [1, 1, 1]);
  if ($G.moonM) $G.moonM.visible = $G.moonG.visible = !!B.moon;
  setLin($G.sunM.material.color, B.disc);
  setLin($G.FF.material.color, B.mote);
}

export function __init_27() {
  $G.sunM = sp(new THREE.MeshBasicMaterial({
    color: 0xff8a3a,
    fog: false
  }), 34, 0, 0, 0);
  {
    const g = new THREE.BufferGeometry(),
      pp = [];
    for (let i = 0; i < 500; i++) {
      const a = rn(0, 6.28),
        e = rn(.15, 1.4);
      pp.push(Math.cos(a) * Math.cos(e) * 380, Math.sin(e) * 380, Math.sin(a) * Math.cos(e) * 380);
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(pp, 3));
    $G.stars = new THREE.Points(g, new THREE.PointsMaterial({
      color: 0xffffff,
      size: 2.6,
      fog: false,
      map: HALO,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    sc.add($G.stars);
  }
  // hilal: kanvas doku, arkasında yumuşak hale; Koru ve Mezarlık'ta görünür
  {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 128;
    const x = cv.getContext('2d');
    if (x) {
      x.fillStyle = '#fff8e8';
      x.beginPath();
      x.arc(64, 64, 50, 0, 6.283);
      x.fill();
      x.globalCompositeOperation = 'destination-out';
      x.beginPath();
      x.arc(84, 52, 46, 0, 6.283);
      x.fill();
    }
    const tx = new THREE.CanvasTexture(cv);
    $G.moonM = new THREE.Sprite(new THREE.SpriteMaterial({
      map: tx,
      transparent: true,
      depthWrite: false,
      fog: false,
      rotation: -.5
    }));
    $G.moonM.scale.set(30, 30, 1);
    sc.add($G.moonM);
    $G.moonG = glow(0xb8c4f0, 95, sc, .22);
  }
  $G.ffp = new Float32Array(FN * 3);
  $G.ffo = Array.from({
    length: FN
  }, () => [rn(-270, 270), rn(-270, 270), rn(0, 6.28)]);
  $G.FF = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({
    color: 0xaaffcc,
    size: 1.1,
    transparent: true,
    opacity: .9,
    map: HALO,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  }));
  $G.FF.geometry.setAttribute('position', new THREE.BufferAttribute($G.ffp, 3));
  $G.FF.frustumCulled = false;
  sc.add($G.FF);
}

export function ffUpd() {
  for (let i = 0; i < FN; i++) {
    const o = $G.ffo[i];
    $G.ffp[i * 3] = o[0] + Math.sin($G.T * .6 + o[2]) * 2;
    $G.ffp[i * 3 + 1] = $G.HT(o[0], o[1]) + 1.6 + Math.sin($G.T * 1.3 + o[2] * 3) * .8;
    $G.ffp[i * 3 + 2] = o[1] + Math.cos($G.T * .5 + o[2]) * 2;
  }
  $G.FF.geometry.attributes.position.needsUpdate = true;
}

export function __init_28() {
  pl = new THREE.PointLight(new THREE.Color().setHex(0xffb27a, THREE.LinearSRGBColorSpace), 1.2 * Math.PI, 26, 1);
  sc.add(pl);
  GEO.setQ(.8);
  gPot = toBG(MODELS.vase());
  GEO.setQ(1);

  // ---- karakterler
}
