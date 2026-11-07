// world/terrain.js · Kara Koru
// Bu dosya tek dosyalık sürümden (v22) otomatik ayrıldı. Ortak oyun durumu core/store.js içindeki $G nesnesinde.

import { $G } from '../core/store.js';
import { ownG } from '../core/helpers.js';
import { THREE } from '../engine/three.js';
import { clamp, rn } from '../core/util.js';
import { lin, setLin } from '../engine/color.js';
import { BMc, L, VMAT, bx, cy, envG, gB, glow, mk, sc, sp } from '../engine/renderer.js';
import { MAPM } from './mapm.js';

export let BIO, WG, ck, cell, groundTop, inPlat, FN, skyG, skyD;

export function __init_17() {
  // ---- biyomlar
  BIO = [{
    n: 'Kara Koru',
    sky: 0x6b78a6,
    zen: 0x151c44,
    fog: [70, 265],
    hemi: [0x9fb2e2, 0x3a3326, .9],
    sun: 0xffc48e,
    sunI: 2.0,
    disc: 0xffb878,
    cloud: 0x8a86a8,
    mote: 0xc6ffd8,
    band: 0xd07a52,
    halo: 1.2,
    moon: 1,
    tint: [1, 1, 1],
    starA: .85,
    stone: [0x6b6a78, 0x58576a, 0x4c4b5c],
    trim: 0x7d7b88,
    h: (x, z) => 4.5 * Math.sin(x * .045) * Math.cos(z * .04) + 2 * Math.sin(x * .1 + z * .07) + .8 * Math.sin(z * .2),
    rock: 0x6f6c74,
    col: (c, y, n, s) => {
      if (n > 1.05) c.setHex(0x6e5638);else c.setHSL(.26 + n * .025, .46 + n * .05, .27 + y * .009 + n * .035);
    }
  }, {
    n: 'Kızıl Bozkır',
    sky: 0xc77a58,
    zen: 0x2a1430,
    fog: [60, 245],
    hemi: [0xffc2a2, 0x5a2a1a, .85],
    sun: 0xffb070,
    sunI: 2.2,
    disc: 0xffa060,
    cloud: 0xa86a5a,
    mote: 0xffb060,
    band: 0xffb866,
    halo: 1.6,
    moon: 0,
    tint: [1.05, .97, .9],
    starA: .3,
    stone: [0x8a5a46, 0x7a4a3a, 0x9a6a50],
    trim: 0xa87a5e,
    h: (x, z) => {
      const b = 5.5 * Math.sin(x * .032 + 1) * Math.cos(z * .028) + 2.6 * Math.sin(x * .075 - z * .06) + 1.2 * Math.cos(z * .13 + x * .02),
        s = 2.4,
        t = Math.floor(b / s) * s,
        f = (b - t) / s;
      return t + (f < .7 ? f * .3 / .7 : .3 + (f - .7) / .3 * .7) * s;
    },
    rock: 0x7a3e2c,
    col: (c, y, n, s) => {
      if (n > 1) c.setHex(0x8a5a3a);else c.setHSL(.055 + n * .012, .5, .4 + y * .008 + n * .03);
    }
  }, {
    n: 'Mezarlık',
    sky: 0x3a3a52,
    zen: 0x0c0c18,
    fog: [52, 195],
    hemi: [0x8a94c4, 0x202028, .78],
    sun: 0xc4ccf0,
    sunI: 1.35,
    disc: 0xd8dcee,
    cloud: 0x4a4a5e,
    mote: 0xb8a8ff,
    band: 0x4a3a7a,
    halo: .5,
    moon: 1,
    tint: [.92, .95, 1.08],
    starA: 1,
    stone: [0x62626e, 0x4e4e5a, 0x72727e],
    trim: 0x6e6c7a,
    h: (x, z) => 2.2 * Math.sin(x * .05) * Math.cos(z * .045) + 1.2 * Math.sin(x * .12 + z * .09),
    rock: 0x4e4c58,
    col: (c, y, n, s) => {
      if (n > 1.05) c.setHex(0x44403a);else c.setHSL(.62 + n * .02, .1 + n * .04, .21 + y * .006 + n * .03);
    }
  }];
  $G.BI = 0;
  $G.HT = BIO[0].h;
  WG = new THREE.Group();
  sc.add(WG);
  $G.OBS = [];
  $G.OG = new Map();
  $G.PLF = [];
  $G.PG = new Map();
  $G.JP = [];
  $G.RW = [];
  ck = (i, j) => (i + 40) * 100 + j + 40;
}

export function gridAdd(G, o, x0, x1, z0, z1) {
  for (let i = Math.floor(x0 / 10); i <= Math.floor(x1 / 10); i++) for (let j = Math.floor(z0 / 10); j <= Math.floor(z1 / 10); j++) {
    const k = ck(i, j);
    if (!G.has(k)) G.set(k, []);
    G.get(k).push(o);
  }
}

export function __init_18() {
  cell = (G, x, z) => G.get(ck(Math.floor(x / 10), Math.floor(z / 10)));
}

export function addObs(o) {
  if (o.b == null) o.b = -1e9;
  if (o.t == null) o.t = 1e9;
  $G.OBS.push(o);
  gridAdd($G.OG, o, o.x - o.r - 2.5, o.x + o.r + 2.5, o.z - o.r - 2.5, o.z + o.r + 2.5);
}

export function rmObs(o) {
  const i = $G.OBS.indexOf(o);
  if (i >= 0) $G.OBS.splice(i, 1);
  for (const a of $G.OG.values()) {
    const j = a.indexOf(o);
    if (j >= 0) a.splice(j, 1);
  }
}

export function pushOut(p, r) {
  const a = cell($G.OG, p.x, p.z);
  if (!a) return;
  for (const o of a) {
    if (o.nm) continue;
    const dx = p.x - o.x,
      dz = p.z - o.z,
      d = Math.hypot(dx, dz),
      m = o.r + r;
    if (d < m && d > 1e-4) {
      p.x += dx / d * (m - d);
      p.z += dz / d * (m - d);
    }
  }
}

export function groundAt(x, z, fy) {
  let g = $G.HT(x, z);
  const a = cell($G.PG, x, z);
  if (a) for (const p of a) if (x >= p.x0 && x <= p.x1 && z >= p.z0 && z <= p.z1 && p.top <= fy + .65 && p.top > g) g = p.top;
  return g;
}

export function __init_19() {
  groundTop = (x, z) => groundAt(x, z, 1e9);
}

export function solidAt(x, y, z) {
  if (y < $G.HT(x, z) + .05) return 1;
  const a = cell($G.PG, x, z);
  if (a) for (const p of a) if (x >= p.x0 && x <= p.x1 && z >= p.z0 && z <= p.z1 && y <= p.top + .1 && y >= p.bot) return 2;
  const b = cell($G.OG, x, z);
  if (b) for (const o of b) if (y < o.t && y > o.b && (x - o.x) ** 2 + (z - o.z) ** 2 < o.r * o.r * .8) return 3;
  return 0;
}

export function los(ax, ay, az, bx, by, bz) {
  const dx = bx - ax,
    dy = by - ay,
    dz = bz - az,
    L = Math.hypot(dx, dy, dz),
    n = Math.ceil(L / 1);
  for (let i = 1; i < n; i++) {
    const f = i / n;
    if (solidAt(ax + dx * f, ay + dy * f, az + dz * f)) return false;
  }
  return true;
}

export function pushPlat(o, r, fy) {
  let bt = -1e9;
  const a = cell($G.PG, o.x, o.z);
  if (!a) return bt;
  for (const p of a) {
    if (fy >= p.top - .6) continue;
    const cx = clamp(o.x, p.x0, p.x1),
      cz = clamp(o.z, p.z0, p.z1),
      dx = o.x - cx,
      dz = o.z - cz,
      d = Math.hypot(dx, dz);
    if (d >= r) continue;
    if (d > 1e-4) {
      o.x += dx / d * (r - d);
      o.z += dz / d * (r - d);
    } else {
      const l = o.x - p.x0,
        rr = p.x1 - o.x,
        b = o.z - p.z0,
        f = p.z1 - o.z,
        m = Math.min(l, rr, b, f);
      if (m == l) o.x = p.x0 - r;else if (m == rr) o.x = p.x1 + r;else if (m == b) o.z = p.z0 - r;else o.z = p.z1 + r;
    }
    bt = Math.max(bt, p.top);
  }
  return bt;
}

export function __init_20() {
  inPlat = (x, z, pad) => $G.PLF.some(p => x >= p.x0 - pad && x <= p.x1 + pad && z >= p.z0 - pad && z <= p.z1 + pad) || typeof $G.ZN != 'undefined' && $G.ZN.some(o => Math.hypot(x - o.x, z - o.z) < o.r + pad) || $G.HT(x, z) < $G.WLV + .4;
}

export function inst(g, m, arr, fn, col) {
  if (!arr.length) return;
  const im = new THREE.InstancedMesh(g, m, arr.length),
    d = new THREE.Object3D(),
    c = new THREE.Color();
  arr.forEach((p, i) => {
    d.rotation.set(0, rn(0, 6.28), 0);
    d.scale.set(1, 1, 1);
    fn(d, p, i);
    d.updateMatrix();
    im.setMatrixAt(i, d.matrix);
    if (col) setLin(c, col[Math.floor(Math.random() * col.length)]);else c.setRGB(1, 1, 1);
    im.setColorAt(i, c);
  });
  im.receiveShadow = true;
  im.castShadow = true;
  WG.add(im);
}

export function plat(x, z, w, d, h, base, B) {
  const p = {
    x0: x - w / 2,
    x1: x + w / 2,
    z0: z - d / 2,
    z1: z + d / 2,
    top: base + h,
    bot: base - 2.5
  };
  $G.PLF.push(p);
  gridAdd($G.PG, p, p.x0 - 4, p.x1 + 4, p.z0 - 4, p.z1 + 4);
  const m = mk(gB, L(B.stone[Math.random() * 3 | 0]), x, (p.top + p.bot) / 2, z, WG);
  m.scale.set(w, p.top - p.bot, d);
  m.castShadow = m.receiveShadow = true;
  const t = mk(gB, L(B.trim), x, p.top + .07, z, WG);
  t.scale.set(w + .25, .14, d + .25);
  t.receiveShadow = true;
  return p;
}

export function column(x, z, y, h, B) {
  const c = cy(L(B.stone[1]), .55, h, x, y + h / 2, z, WG);
  c.castShadow = true;
  bx(L(B.trim), 1.4, .3, 1.4, x, y + h + .15, z, WG);
  addObs({
    x,
    z,
    r: .75,
    t: y + h + .4
  });
}

export function pad(x, z) {
  const y = groundTop(x, z);
  $G.JP.push({
    x,
    z,
    y
  });
  const g = new THREE.Group();
  g.position.set(x, y, z);
  WG.add(g);
  {
    const pm = new THREE.Mesh(envG('pad' + $G.BI, () => MAPM.padG($G.BI == 1), 1), VMAT);
    pm.receiveShadow = true;
    g.add(pm);
  }
  const r = mk(ownG(new THREE.RingGeometry(.7, 1.25, 24)), new THREE.MeshBasicMaterial({
    color: 0x9fe8d8,
    side: 2
  }), 0, .37, 0, g);
  r.rotation.x = -Math.PI / 2;
  sp(BMc(0x9fe8d8), .25, 0, .45, 0, g);
  glow(0x9fe8d8, 3.2, g).position.y = .7;
}

export function ruins(B) {
  const cs = [];
  let tries = 0;
  while (cs.length < 10 && tries++ < 600) {
    const a = rn(0, 6.28),
      d = rn(24, 230),
      x = Math.cos(a) * d,
      z = Math.sin(a) * d;
    if (Math.abs(x) > 238 || Math.abs(z) > 238 || cs.some(c => Math.hypot(c[0] - x, c[1] - z) < 46)) continue;
    cs.push([x, z]);
  }
  cs.forEach(([x, z], i) => {
    let base = 1e9;
    for (const [dx, dz] of [[-9, -9], [9, -9], [-9, 9], [9, 9], [0, 0]]) base = Math.min(base, $G.HT(x + dx, z + dz));
    base -= .3;
    const ty = i % 3;
    if (ty == 0) {
      plat(x, z, 13, 13, 1.7, base, B);
      plat(x + 1, z - 1, 8.5, 8.5, 3.4, base, B);
      plat(x + 2, z - 2, 4.6, 4.6, 5.1, base, B);
      $G.RW.push({
        x: x + 2,
        z: z - 2,
        y: base + 5.1,
        t: 'chest'
      });
      [[-5.5, 5.5], [5.5, 5.5], [-5.5, -5.5]].forEach(([a, b]) => column(x + a, z + b, base + 1.7, 2.6, B));
    }
    if (ty == 1) {
      plat(x, z, 16, 2.6, 3.6, base, B);
      plat(x - 5, z + 3.4, 4, 4, 1.8, base, B);
      plat(x + 5.5, z - 3.4, 3.2, 3.2, 1.8, base, B);
      $G.RW.push({
        x: x + 6,
        z,
        y: base + 3.6,
        t: 'pot'
      });
      $G.RW.push({
        x: x - 6,
        z,
        y: base + 3.6,
        t: 'pot'
      });
      [[-9, -5], [9, 4], [0, 6]].forEach(([a, b]) => column(x + a, z + b, $G.HT(x + a, z + b) - .2, rn(2.5, 5), B));
    }
    if (ty == 2) {
      plat(x, z, 6.5, 6.5, 6.6, base, B);
      plat(x - 5.4, z + 2.2, 3.2, 3.2, 1.9, base, B);
      plat(x - 5.4, z - 1.6, 3, 3, 3.9, base, B);
      $G.RW.push({
        x,
        z,
        y: base + 6.6,
        t: 'chest'
      });
      pad(x + 6.4, z + .5);
    }
  });
  for (let i = 0; i < 7; i++) {
    let x,
      z,
      k = 0;
    do {
      const a = rn(0, 6.28),
        d = rn(30, 220);
      x = Math.cos(a) * d;
      z = Math.sin(a) * d;
      k++;
    } while (k < 40 && inPlat(x, z, 6));
    pad(x, z);
  }
}

export function __init_21() {
  $G.sunM = undefined;
  $G.stars = undefined;
  $G.FF = undefined;
  $G.ffo = undefined;
  $G.ffp = undefined;
  FN = 260;
  skyG = new THREE.SphereGeometry(430, 24, 14);
  // gökyüzü: zirve→ufuk geçişi, ufuk ışık bandı, güneş halesi, ay halesi, hafif pus gürültüsü
  skyD = new THREE.Mesh(skyG, new THREE.ShaderMaterial({
    uniforms: {
      zen: { value: new THREE.Color(0x151c44) },
      hor: { value: new THREE.Color(0x6b78a6) },
      band: { value: new THREE.Color(0xd07a52) },
      sunCol: { value: new THREE.Color(0xffb878) },
      moonCol: { value: new THREE.Color(0x000000) },
      sunDir: { value: new THREE.Vector3(250, 180, -250).normalize() },
      moonDir: { value: new THREE.Vector3(-230, 165, 210).normalize() },
      t: { value: 0 }
    },
    vertexShader: 'varying vec3 vD;void main(){vD=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'uniform vec3 zen,hor,band,sunCol,moonCol,sunDir,moonDir;uniform float t;varying vec3 vD;float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}float vnz(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x),mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x),f.y);}void main(){vec3 d=normalize(vD);float h=d.y;vec3 c=mix(hor,zen,pow(clamp(h,0.,1.),.5));c=mix(c,hor*.8,smoothstep(0.,-.3,h));float az=atan(d.z,d.x);c+=band*exp(-h*h*40.)*(.55+.45*vnz(vec2(az*2.5+t*.01,h*18.)));float s=max(dot(d,sunDir),0.);c+=sunCol*(pow(s,5.)*.3+pow(s,50.)*.8);float m=max(dot(d,moonDir),0.);c+=moonCol*(pow(m,16.)*.22+pow(m,90.)*.5);c*=1.+.06*(vnz(vec2(az*4.,h*5.)+t*.004)-.5);float m1=.085+.05*vnz(vec2(az*3.2,1.))+.03*vnz(vec2(az*9.,3.)),m2=.05+.03*vnz(vec2(az*4.6,7.))+.015*vnz(vec2(az*13.,5.));vec3 mc1=mix(hor*.55,zen*.9,.35),mc2=mix(hor*.75,zen,.25);c=mix(c,mc1,smoothstep(m1+.004,m1-.004,h)*smoothstep(-.02,.0,h)*.9);c=mix(c,mc2,smoothstep(m2+.004,m2-.004,h)*smoothstep(-.02,.0,h)*.95);gl_FragColor=vec4(c,1.);\n#include <colorspace_fragment>\n}',
    side: THREE.BackSide,
    fog: false,
    depthWrite: false
  }));
  skyD.renderOrder = -1;
  sc.add(skyD);
}

export function paintSky(B) {
  const u = skyD.material.uniforms;
  setLin(u.zen.value, B.zen);
  setLin(u.hor.value, B.sky);
  setLin(u.band.value, B.band == null ? B.sky : B.band);
  setLin(u.sunCol.value, B.disc);
  u.sunCol.value.multiplyScalar(B.halo == null ? 1 : B.halo);
  if (B.moon) setLin(u.moonCol.value, 0xc8d0f0);else u.moonCol.value.setRGB(0, 0, 0);
}
// ---- harita kurulumu (three.js tarafı)
