// world/build.js · Kara Koru
// Bu dosya tek dosyalık sürümden (v22) otomatik ayrıldı. Ortak oyun durumu core/store.js içindeki $G nesnesinde.

import { $G } from '../core/store.js';
import { ownG } from '../core/helpers.js';
import { THREE } from '../engine/three.js';
import { SET } from '../core/settings.js';
import { rn } from '../core/util.js';
import { setLin } from '../engine/color.js';
import { GLSLN, GU, VEGM, fogSheets, grassField, lightShafts, terrHook } from '../engine/gfx.js';
import { bushGeo, grassGeo, rockGeo, treeGeo } from '../engine/realtrees.js';
import { BMc, DET, HALO, L, VMAT, cn, envG, glow, s2l, toBG } from '../engine/renderer.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { GEO } from '../geo/geo.js';
import { MODELS } from '../geo/models.js';
import { MAPGEN } from './mapgen.js';
import { MAPM } from './mapm.js';
import { BIO, WG, addObs, gridAdd, pad } from './terrain.js';

export let WTEX, CLTEX, P2h;

export function __init_22() {
  // ---- harita kurulumu (three.js tarafı)
  $G.MAP = null;
  $G.WLV = -99;
  $G.ZN = [];
  $G.LMS = [];
  $G.WATER = null;
  $G.MMBG = null;
  $G.FIRES = [];
  $G.BIRDS = [];
  $G.FLAGS = [];
  $G.CLOUDS = [];
  $G.TUMB = [];
  $G.STORM = {
    t: 120,
    on: 0,
    k: 0
  };
}

export function platC(x, z, w, d, top, bot) {
  const p = {
    x0: x - w / 2,
    x1: x + w / 2,
    z0: z - d / 2,
    z1: z + d / 2,
    top,
    bot
  };
  $G.PLF.push(p);
  gridAdd($G.PG, p, p.x0 - 4, p.x1 + 4, p.z0 - 4, p.z1 + 4);
  return p;
}

export function __init_23() {
  WTEX = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const x = c.getContext('2d');
    if (!x) return null;
    const im = x.createImageData(128, 128);
    for (let j = 0; j < 128; j++) for (let i = 0; i < 128; i++) {
      const v = .5 + .25 * Math.sin(i * .2 + Math.sin(j * .15) * 2) + .25 * Math.sin(j * .23 + Math.sin(i * .11) * 3),
        k = (j * 128 + i) * 4,
        b = Math.round(200 + 55 * v);
      im.data[k] = b;
      im.data[k + 1] = b;
      im.data[k + 2] = b;
      im.data[k + 3] = 255;
    }
    x.putImageData(im, 0, 0);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(40, 40);
    return t;
  })();
  CLTEX = (() => {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 128;
    const x = c.getContext('2d');
    if (!x) return null;
    let s = 3;
    const r = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
    for (let i = 0; i < 26; i++) {
      const cx = 40 + r() * 176,
        cy = 50 + r() * 40,
        rr = 18 + r() * 34,
        g = x.createRadialGradient(cx, cy, 0, cx, cy, rr);
      g.addColorStop(0, 'rgba(255,255,255,.55)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g;
      x.fillRect(0, 0, 256, 128);
    }
    return new THREE.CanvasTexture(c);
  })();
}

export function rotS(x, z, r) {
  const c = Math.cos(r),
    s = Math.sin(r);
  return [x * c + z * s, -x * s + z * c];
}

export function addMesh(geo, cast) {
  const m = new THREE.Mesh(toBG(geo), VMAT);
  m.castShadow = cast !== false;
  m.receiveShadow = true;
  m.userData.own = 1;
  WG.add(m);
  return m;
}

export function placeLM(o, M) {
  const ds = $G.BI == 1,
    ab = ['kurgan', 'mesa', 'oasis', 'pond', 'bridge'].includes(o.t);
  if (ab) o.ry = 0;
  o.seed = (Math.abs(o.x * 7 + o.z * 13) | 0) + 1;
  o.H = (dx, dz) => M.ht(o.x + dx, o.z + dz);
  const wat = o.t == 'pond' || o.t == 'oasis',
    base = wat ? $G.WLV : M.ht(o.x, o.z);
  o.base = base;
  let m,
    cx = o.x,
    cz = o.z;
  if (o.t == 'bridge') {
    let zA = o.z,
      zB = o.z;
    while (zA > o.z - 40 && M.ht(o.x, zA) < 1.1) zA -= .5;
    while (zB < o.z + 40 && M.ht(o.x, zB) < 1.1) zB += .5;
    const top = Math.max(M.ht(o.x, zA), M.ht(o.x, zB)) + .25;
    cz = (zA + zB) / 2;
    o.z = cz;
    m = MAPM.bridge(o, zB - zA + 3, top);
  } else {
    if (o.t == 'kurgan') {
      o.rimY = [...Array(12)].map((_, i) => o.H(Math.cos(i / 12 * 6.283) * 14, Math.sin(i / 12 * 6.283) * 14));
      o.topY = o.H(0, 0);
    }
    if (o.t == 'mesa') o.topY = o.H(0, 0);
    m = MAPM[o.t](o, ds);
  }
  const y0 = ab ? 0 : base,
    g = GEO.tf(m.g, {
      r: [0, o.ry, 0],
      t: [cx, y0, cz]
    });
  addMesh(g, true);
  for (const s of m.c) {
    if (s.p) {
      const [x, z, w, d, top, bot] = s.p,
        [rx, rz] = rotS(x, z, o.ry),
        sw = Math.round(o.ry / P2h) % 2 ? [d, w] : [w, d];
      platC(cx + rx, cz + rz, sw[0], sw[1], (ab ? 0 : y0) + top, bot == null ? y0 - 2.5 : (ab ? 0 : y0) + bot);
    }
    if (s.o) {
      const [x, z, r, t, b, nm] = s.o,
        [rx, rz] = rotS(x, z, o.ry),
        gx = cx + rx,
        gz = cz + rz,
        gy = ab ? M.ht(gx, gz) : y0;
      addObs({
        x: gx,
        z: gz,
        r,
        t: gy + t,
        b: b == null ? undefined : gy + b,
        nm: nm ? 1 : 0
      });
    }
    if (s.pad) {
      const [x, z] = s.pad,
        [rx, rz] = rotS(x, z, o.ry);
      pad(cx + rx, cz + rz);
    }
    if (s.rw) {
      let [x, z, y, k] = s.rw;
      if (s.ofs) {
        x += s.ofs[0];
        z += s.ofs[1];
      }
      const [rx, rz] = rotS(x, z, o.ry),
        gx = cx + rx,
        gz = cz + rz;
      $G.RW.push({
        x: gx,
        z: gz,
        y: ab ? s.gnd ? y : M.ht(gx, gz) + y : y0 + y,
        t: k
      });
    }
    if (s.sh) {
      const [rx, rz] = rotS(s.sh[0], s.sh[1], o.ry);
      $G.SHH.push([cx + rx, cz + rz]);
    }
    if (s.np) {
      const [rx, rz] = rotS(s.np[0], s.np[1], o.ry);
      $G.NPH.push([cx + rx, cz + rz]);
    }
    if (s.fire) {
      const [x, y, z, k] = s.fire,
        [rx, rz] = rotS(x, z, o.ry);
      mkHearth(cx + rx, (ab ? M.ht(cx + rx, cz + rz) : y0) + y, cz + rz, k || 0);
    }
  }
  // simge çevresi canlılığı: tapınak ve dikilitaş meşaleleri, kule ve kervansaray bayrağı, kamp ek ateşi
  if (o.t == 'temple' || o.t == 'obelisk' || o.t == 'caravan') for (let k = 0; k < 4; k++) {
    const a = k / 4 * 6.283 + .785, rr = o.r * .78, gx = cx + Math.cos(a) * rr, gz = cz + Math.sin(a) * rr;
    mkHearth(gx, M.ht(gx, gz), gz, 3);
  }
  if (o.t == 'tower' || o.t == 'caravan' || o.t == 'camp') mkFlag(cx + (o.t == 'tower' ? 1.2 : o.r * .55), o.t == 'tower' ? y0 + 9.2 : M.ht(cx + o.r * .55, cz + 2), cz + (o.t == 'tower' ? 0 : 2), ds ? 0xb9352a : 0x2a5a8a);
  $G.ZN.push({
    x: cx,
    z: cz,
    r: o.r
  });
  $G.LMS.push({
    n: o.n,
    t: o.t,
    x: cx,
    z: cz,
    r: o.r,
    f: 0
  });
}

export function __init_24() {
  P2h = Math.PI / 2;
  $G.SHH = [];
  $G.NPH = [];
}

// bayrak: rüzgârda dalgalanan kumaş (sheet), direk; FLAGS listesiyle her kare dalgalanır
let gPole = null, gTorch = null;
export function mkFlag(x, y, z, col) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  const pole = new THREE.Mesh(gPole || (gPole = ownG(new THREE.CylinderGeometry(.07, .09, 5, 6))), L(0x4a3426));
  pole.position.y = 2.5;
  pole.userData.own = 0; // paylaşılan direk geometrisi
  g.add(pole);
  const geo = ownG(new THREE.PlaneGeometry(2.2, 1.3, 8, 3));
  geo.translate(1.1, 0, 0);
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: col, side: THREE.DoubleSide, roughness: .8 }));
  m.userData.own = 1;
  m.position.set(.1, 4.3, 0);
  m.castShadow = true;
  g.add(m);
  WG.add(g);
  $G.FLAGS.push({ m, base: geo.attributes.position.array.slice(), t: Math.random() * 6 });
  return g;
}

// yerde ışık havuzu: ateş/fener altına sıcak radyal leke; hepsi tek mesh (çizim çağrısı +1)
const POOLS = [];
export function lightPool(x, y, z, r, col, op) {
  POOLS.push([x, y, z, r, col, op]);
}
export function flushPools() {
  if (!POOLS.length) return;
  const parts = [], m4 = new THREE.Matrix4(), c = new THREE.Color();
  for (const [x, y, z, r, col, op] of POOLS) {
    const g = new THREE.PlaneGeometry(r * 2, r * 2, 1, 1);
    g.rotateX(-Math.PI / 2);
    m4.makeTranslation(x, y + .06, z);
    g.applyMatrix4(m4);
    const n = g.attributes.position.count, cs = new Float32Array(n * 3);
    setLin(c, col);
    for (let i = 0; i < n; i++) {
      cs[i * 3] = c.r * op;
      cs[i * 3 + 1] = c.g * op;
      cs[i * 3 + 2] = c.b * op;
    }
    g.setAttribute('color', new THREE.BufferAttribute(cs, 3));
    parts.push(g);
  }
  POOLS.length = 0;
  const mg = mergeGeometries(parts, false);
  parts.forEach(p => p.dispose());
  const mat = new THREE.MeshBasicMaterial({
    map: HALO,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    fog: true,
    polygonOffset: true,
    polygonOffsetFactor: -2
  });
  mat.userData.own = 1;
  const m = new THREE.Mesh(mg, mat);
  m.userData.own = 1;
  m.renderOrder = 1;
  WG.add(m);
}

export function mkHearth(x, y, z, k) {
  if (k != 2) lightPool(x, y, z, k == 0 ? 5.5 : k == 3 ? 3.2 : 3, 0xff8a30, k == 0 ? .5 : .32);
  const g = new THREE.Group();
  g.position.set(x, y, z);
  WG.add(g);
  const col = k == 2 ? 0x7ae8d0 : 0xff9a3a,
    gl = glow(col, k == 0 ? 4.5 : k == 2 ? 6 : k == 3 ? 2.8 : 2.4, g, k == 2 ? .45 : .8);
  if (k == 3) gl.position.y = 1.7;
  let fl = null;
  if (k == 3) {
    // meşale: kısa direk + alev
    const st = new THREE.Mesh(gTorch || (gTorch = new THREE.CylinderGeometry(.06, .08, 1.6, 5)), L(0x4a3426));
    st.position.y = .8;
    g.add(st);
    fl = [0, 1].map(i => cn(BMc(i ? 0xffb040 : 0xff6a1a), .2 - i * .06, .7 - i * .15, 0, 1.6, 0, g));
  }
  if (k == 0) {
    fl = [0, 1, 2].map(i => {
      const c = cn(BMc(i ? 0xffb040 : 0xff6a1a), .32 - i * .07, 1.1 - i * .2, Math.cos(i * 2.1) * .15, .3, Math.sin(i * 2.1) * .15, g);
      return c;
    });
  }
  $G.FIRES.push({
    x,
    y,
    z,
    k,
    g,
    gl,
    fl,
    t: Math.random() * 9
  });
}

export function mkBirds(n, cx, cz, h) {
  const mat = new THREE.MeshBasicMaterial({
      color: 0x1a1618,
      side: 2
    }),
    wg = ownG(new THREE.BufferGeometry());
  wg.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, -.25, 0, 0, .25, 1.1, 0, .05], 3));
  for (let i = 0; i < n; i++) {
    const b = new THREE.Group(),
      l = new THREE.Mesh(wg, mat),
      r = new THREE.Mesh(wg, mat);
    r.scale.x = -1;
    b.add(l, r);
    WG.add(b);
    $G.BIRDS.push({
      b,
      l,
      r,
      cx,
      cz,
      h: h + Math.random() * 8,
      R: 18 + Math.random() * 16,
      a: Math.random() * 6.28,
      s: (.25 + Math.random() * .15) * (i % 2 ? 1 : -1),
      ph: Math.random() * 6
    });
  }
}
// bitki örtüsü: 200 birimlik parçalara bölünür; her parçanın kendi sınır küresi var (r128 örnekleri yalnız geometriye göre kırpar)

export function __init_25() {
  // bitki örtüsü: 200 birimlik parçalara bölünür; her parçanın kendi sınır küresi var (r128 örnekleri yalnız geometriye göre kırpar)
  $G.SMV = [];
}

export function vegInst(geo, arr, fn, cols, cast, small) {
  if (!arr.length) return;
  const d = new THREE.Object3D(),
    c = new THREE.Color(),
    bk = {};
  if (!geo.boundingSphere && geo.computeBoundingSphere) geo.computeBoundingSphere();
  const gs = geo.boundingSphere,
    gr = gs ? gs.radius + Math.hypot(gs.center.x, gs.center.y, gs.center.z) : 4;
  if (small == null) small = !cast && gr < 2.2 && arr.length > 40;
  const BK = 300; // daha az parça = daha az çizim çağrısı (perf ölçümü: tür başına 18 → ~8)
  arr.forEach((p, i) => {
    d.rotation.set(0, Math.random() * 6.283, 0);
    d.scale.set(1, 1, 1);
    fn(d, p, i);
    d.updateMatrix();
    const k = Math.floor((d.position.x + 300) / BK) * 16 + Math.floor((d.position.z + 300) / BK);
    (bk[k] || (bk[k] = [])).push([d.matrix.clone ? d.matrix.clone() : d.matrix, cols ? cols[Math.random() * cols.length | 0] : 0xffffff, d.position.x, d.position.y, d.position.z, Math.max(d.scale.x, d.scale.y, d.scale.z)]);
  });
  let last = null;
  for (const k in bk) {
    const Lk = bk[k];
    let g = geo;
    if (THREE.Sphere) {
      g = new THREE.BufferGeometry();
      for (const a in geo.attributes) g.setAttribute(a, geo.attributes[a]);
      if (geo.index) g.setIndex(geo.index);
      g.userData = geo.userData; // anahtar (VEGM seçimi ve testler için)
      let x0 = 1e9,
        x1 = -1e9,
        y0 = 1e9,
        y1 = -1e9,
        z0 = 1e9,
        z1 = -1e9,
        sm = 1;
      for (const e of Lk) {
        x0 = Math.min(x0, e[2]);
        x1 = Math.max(x1, e[2]);
        y0 = Math.min(y0, e[3]);
        y1 = Math.max(y1, e[3]);
        z0 = Math.min(z0, e[4]);
        z1 = Math.max(z1, e[4]);
        sm = Math.max(sm, e[5]);
      }
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), Math.hypot(x1 - x0, y1 - y0, z1 - z0) / 2 + gr * sm);
    }
    const im = new THREE.InstancedMesh(g, typeof VEGM == 'function' ? VEGM(geo) : VMAT, Lk.length);
    Lk.forEach((e, i) => {
      im.setMatrixAt(i, e[0]);
      setLin(c, e[1]);
      im.setColorAt(i, c);
    });
    if (!THREE.Sphere) im.frustumCulled = false;
    im.castShadow = !!cast;
    im.receiveShadow = true;
    WG.add(im);
    last = im;
    if (small && g.boundingSphere) $G.SMV.push(im);
  }
  return last;
}

export function buildMap(bi) {
  $G.SMV = [];
  const M = MAPGEN.gen(bi, Math.random() * 2e9 | 0),
    B = BIO[bi];
  $G.MAP = M;
  $G.WLV = M.WL;
  $G.HT = M.ht;
  $G.ZN = [];
  $G.LMS = [];
  $G.SHH = [];
  $G.NPH = [];
  $G.FIRES = [];
  $G.BIRDS = [];
  $G.CLOUDS = [];
  $G.TUMB = [];
  $G.STORM = {
    t: 110 + Math.random() * 60,
    on: 0,
    k: 0
  };
  // zemin
  const tg = new THREE.PlaneGeometry(600, 600, M.N, M.N);
  tg.rotateX(-Math.PI / 2);
  const pa = tg.attributes.position,
    C = MAPGEN.colors(M),
    cs = new Float32Array(pa.count * 3);
  for (let i = 0; i < pa.count; i++) {
    pa.setY(i, M.H[i]);
    cs[i * 3] = s2l(C[i * 3]);
    cs[i * 3 + 1] = s2l(C[i * 3 + 1]);
    cs[i * 3 + 2] = s2l(C[i * 3 + 2]);
  }
  tg.setAttribute('color', new THREE.Float32BufferAttribute(cs, 3));
  tg.computeVertexNormals();
  const tm = new THREE.Mesh(tg, new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: .93,
    metalness: 0,
    map: DET,
    bumpMap: DET,
    bumpScale: .35
  }));
  tm.receiveShadow = true;
  tm.userData.own = 1;
  WG.add(tm);
  if (typeof terrHook == 'function') terrHook(tm.material, bi);
  // su
  $G.WATER = new THREE.Mesh(new THREE.PlaneGeometry(600, 600, 1, 1), new THREE.MeshStandardMaterial({
    color: bi == 1 ? 0x3a8a8a : bi == 2 ? 0x2a3040 : 0x2e5e72,
    map: WTEX,
    transparent: true,
    opacity: .8,
    roughness: .75, // düşük pürüzlülük güneş yansımasını ışımayla dev beyaz lekeye çeviriyordu
    metalness: 0,
    depthWrite: false
  }));
  // su shader kancası: iki yönlü dalga normalleri, kıyıya yakın köpük, derinlik rengi
  {
    const wm = $G.WATER.material;
    wm.onBeforeCompile = sh => {
      sh.uniforms.wT = GU.t;
      sh.uniforms.wShore = { value: bi == 1 ? 0.7 : 1 };
      sh.vertexShader = 'varying vec3 vWP;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvWP=(modelMatrix*vec4(transformed,1.)).xyz;');
      sh.fragmentShader = 'varying vec3 vWP;uniform float wT;uniform float wShore;\n' + GLSLN + sh.fragmentShader
        .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n{vec2 p=vWP.xz;float a=vnz(p*.35+vec2(wT*.18,wT*.07)),b=vnz(p*.35+vec2(.07,0.)+vec2(wT*.18,wT*.07)),c2=vnz(p*.35+vec2(0.,.07)+vec2(wT*.18,wT*.07));float d=vnz(p*1.1-vec2(wT*.11,wT*.16)),e=vnz(p*1.1+vec2(.04,0.)-vec2(wT*.11,wT*.16)),f=vnz(p*1.1+vec2(0.,.04)-vec2(wT*.11,wT*.16));vec3 off=(viewMatrix*vec4((a-b)*5.+(d-e)*2.,0.,(a-c2)*5.+(d-f)*2.,0.)).xyz;normal=normalize(normal+off);}')
        .replace('#include <color_fragment>', '#include <color_fragment>\n{float n=vnz(vWP.xz*.9+vec2(wT*.05,-wT*.03));diffuseColor.rgb*=.9+.2*n;}');
    };
    wm.customProgramCacheKey = () => 'water' + bi;
  }
  $G.WATER.rotation.x = -Math.PI / 2;
  $G.WATER.position.y = $G.WLV - .02;
  $G.WATER.receiveShadow = true;
  $G.WATER.userData.own = 1;
  WG.add($G.WATER);
  // simge yapılar
  for (const o of M.lm) placeLM(o, M);
  // bitki örtüsü
  const sd = M.seed % 9973,
    fb = MAPGEN.fb,
    ok = (x, z, pad, wet) => {
      if (Math.hypot(x, z) < 16) return 0;
      if ($G.ZN.some(o => Math.hypot(x - o.x, z - o.z) < o.r + pad)) return 0;
      const h = M.ht(x, z);
      if (!wet && h < $G.WLV + .5) return 0;
      if (M.pm(x, z) > .15) return 0;
      return 1;
    };
  const slope = (x, z) => Math.hypot(M.ht(x + 1, z) - M.ht(x - 1, z), M.ht(x, z + 1) - M.ht(x, z - 1)) / 2,
    grove = (x, z) => MAPGEN.sm(-.08, .32, fb(x / 70, z / 70, 2, sd + 50));
  const pick = (n, fn, tries = n * 20) => {
    const a = [];
    for (let k = 0; k < tries && a.length < n; k++) {
      const x = rn(-262, 262),
        z = rn(-262, 262);
      if (fn(x, z)) a.push([x, z]);
    }
    return a;
  };
  const at2 = (d, p, y, s, sy) => {
    d.position.set(p[0], y, p[1]);
    d.scale.set(s, sy || s, s);
  };
  if (bi == 0) {
    const tr = pick(330, (x, z) => ok(x, z, 3) && slope(x, z) < 1.1 && Math.random() < .12 + .88 * grove(x, z)),
      edge = pick(130, (x, z) => {
        const r = Math.max(Math.abs(x), Math.abs(z));
        return r > 226 && ok(x, z, 2);
      });
    // ağaç türleri: iki çam, iki yeşil meşe, iki sonbahar meşesi (taç boyalı); 8 yuvanın 2'si sonbahar
    const autumn = (sd, col) => GEO.paint(MODELS.oak(sd), (x, y, z, c) => y > 2.3 ? GEO.mixc(c, GEO.hex(col), .6 + .2 * Math.sin(x * 3 + z * 2)) : c);
    const all = tr.concat(edge),
      ks = [['pine1', () => MODELS.pine(1)], ['pine2', () => MODELS.pine(2)], ['oak1', () => MODELS.oak(1)], ['oak2', () => MODELS.oak(5)], ['oak3', () => autumn(9, 0xd0862a)], ['oak4', () => autumn(13, 0xc8b030)]],
      slot = [0, 1, 2, 3, 2, 3, 4, 5],
      vs = ks.map(() => []);
    all.forEach((p, i) => vs[slot[(i * 7 + (p[0] * 3 | 0)) & 7]].push(p));
    // gerçekçi ağaçlar: gövde (kabuk) ve taç (yaprak kartları) ayrı instanced çizim; aynı konum ve dönüş
    const RK = [['pine', 1], ['pine', 2], ['broad', 1], ['broad', 5], ['autumn', 9], ['autumn2', 13]],
      rotOf = p => (Math.abs(p[0] * 73.1 + p[1] * 19.7) % 6.283),
      sclOf = p => .9 + (Math.abs(p[0] * 3.7 + p[1] * 11.3) % 1) * .8;
    RK.forEach(([kind, sd], j) => {
      const tg = treeGeo(kind, sd, 't'), lg = treeGeo(kind, sd, 'l');
      vegInst(lg, vs[j], (d, p) => {
        d.rotation.set(0, rotOf(p), 0);
        at2(d, p, M.ht(p[0], p[1]) - .15, sclOf(p));
      }, [0xffffff, 0xe8efe2, 0xf6fff0, 0xdde6d6], SET.q > 0); // düşük kalitede yaprak gölgesi yok (alfa kesimli gölge geçişi pahalı)
    });
    ks.forEach((k, j) => vegInst(treeGeo(RK[j][0], RK[j][1], 't'), vs[j], (d, p) => {
      const s = sclOf(p),
        hb = M.ht(p[0], p[1]),
        oak = j >= 2;
      d.rotation.set(0, rotOf(p), 0);
      at2(d, p, hb - .15, s);
      addObs({
        x: p[0],
        z: p[1],
        r: (oak ? .5 : .4) * s,
        t: hb + (oak ? 3.4 : 3) * s
      });
      addObs({
        x: p[0],
        z: p[1],
        r: (oak ? 2.4 : 2) * s,
        b: hb + (oak ? 2.6 : 1.6) * s,
        t: hb + (oak ? 6 : 8) * s,
        nm: 1
      });
    }, null, true));
    vegInst(bushGeo(1, 'broad'), pick(110, (x, z) => ok(x, z, 1)), (d, p) => at2(d, p, M.ht(p[0], p[1]) - .05, rn(.8, 1.5)), [0xffffff, 0xe0ecd6], true);
    // seyrek kuru ağaç siluetleri: orman kenarları ve tepe sırtları
    vegInst(treeGeo('dead', 1, 't'), pick(14, (x, z) => ok(x, z, 3) && grove(x, z) < .25), (d, p) => {
      const s = rn(1, 1.6),
        hb = M.ht(p[0], p[1]);
      at2(d, p, hb - .1, s);
      addObs({
        x: p[0],
        z: p[1],
        r: .4 * s,
        t: hb + 3.6 * s
      });
    }, [0x8a7a6a, 0x7a6a5c], true);
    // ırmak kıyısı sabah sisi ve koru içi ışık huzmeleri
    fogSheets(bi, M, WG);
    lightShafts(bi, M, WG, pick(26, (x, z) => ok(x, z, 1) && grove(x, z) > .45 && Math.hypot(x, z) > 24));
    // orman altı: ağaç diplerine çalı kümeleri
    const under = tr.filter(() => Math.random() < .4).map(([x, z]) => {
      const a = rn(0, 6.28),
        r = rn(2.2, 4.2);
      return [x + Math.cos(a) * r, z + Math.sin(a) * r];
    }).filter(([x, z]) => ok(x, z, .5));
    vegInst(bushGeo(2, 'broad'), under, (d, p) => at2(d, p, M.ht(p[0], p[1]) - .05, rn(.7, 1.3)), [0xffffff, 0xd8e6cc, 0xc8dcc0], false, true);
    // patika taşları: yollar boyunca yassı basamaklar
    const ps = [];
    for (const P of M.paths) for (let k = 0; k < P.length - 1; k++) {
      const [ax, az] = P[k],
        [bx, bz] = P[k + 1],
        L = Math.hypot(bx - ax, bz - az);
      for (let t = 0; t < L; t += 2.4) {
        const f = t / L,
          x = ax + (bx - ax) * f + rn(-.5, .5),
          z = az + (bz - az) * f + rn(-.5, .5);
        if (Math.hypot(x, z) > 10 && M.ht(x, z) > $G.WLV + .4 && !$G.ZN.some(o => Math.hypot(x - o.x, z - o.z) < o.r)) ps.push([x, z]);
      }
    }
    vegInst(envG('pstone', () => MAPM.pstone(1), .6), ps, (d, p) => at2(d, p, M.ht(p[0], p[1]) - .12, rn(.7, 1.1)), [0xffffff, 0xe0e0e8, 0xcfd0c8], false, true);
    vegInst(envG('fern', () => MAPM.fern(1), .8), pick(220, (x, z) => ok(x, z, 1) && grove(x, z) > .3), (d, p) => at2(d, p, M.ht(p[0], p[1]), rn(.8, 1.4)), [0xffffff, 0xd8e8c8]);
    for (let v = 0; v < 4; v++) vegInst(envG('flw' + v, () => MAPM.flower(v), .35), pick(70, (x, z) => ok(x, z, 1) && grove(x, z) < .2), (d, p) => at2(d, p, M.ht(p[0], p[1]), rn(.9, 1.4)));
    vegInst(envG('msh0', () => MAPM.mushroom(0), .4), pick(70, (x, z) => ok(x, z, 1) && grove(x, z) > .4), (d, p) => at2(d, p, M.ht(p[0], p[1]), rn(.8, 1.6)));
    const bt = $G.LMS.find(l => l.t == 'bigtree');
    if (bt) vegInst(envG('msh1', () => MAPM.mushroom(1), .4), [...Array(26)].map(() => {
      const a = rn(0, 6.28),
        r = rn(4, 12);
      return [bt.x + Math.cos(a) * r, bt.z + Math.sin(a) * r];
    }), (d, p) => at2(d, p, M.ht(p[0], p[1]), rn(1, 1.8)));
    const tp = $G.LMS.find(l => l.t == 'temple' || l.t == 'stones');
    if (tp) vegInst(envG('cry', () => MAPM.crystal(1), .8), [...Array(9)].map(() => {
      const a = rn(0, 6.28),
        r = rn(tp.r + 1, tp.r + 7);
      return [tp.x + Math.cos(a) * r, tp.z + Math.sin(a) * r];
    }), (d, p) => {
      at2(d, p, M.ht(p[0], p[1]) - .1, rn(.9, 1.6));
      addObs({
        x: p[0],
        z: p[1],
        r: .6,
        t: M.ht(p[0], p[1]) + 1.5
      });
    });
    vegInst(envG('stump', () => MAPM.stump(1), .8), pick(26, (x, z) => ok(x, z, 2)), (d, p) => {
      const s = rn(.8, 1.3);
      at2(d, p, M.ht(p[0], p[1]) - .05, s);
      addObs({
        x: p[0],
        z: p[1],
        r: .55 * s,
        t: M.ht(p[0], p[1]) + .7 * s
      });
    }, null, true);
    for (const p of pick(14, (x, z) => ok(x, z, 5) && slope(x, z) < .5)) {
      const f = MAPM.fallen(p[0] * 3 | 0),
        a = rn(0, 6.28),
        hb = M.ht(p[0], p[1]);
      const m = addMesh(GEO.tf(f.g, {
        r: [0, a, 0],
        t: [p[0], hb - .1, p[1]]
      }));
      for (let k = -1; k <= 1; k++) addObs({
        x: p[0] + Math.cos(a) * k * f.L * .33,
        z: p[1] - Math.sin(a) * k * f.L * .33,
        r: .55,
        t: hb + .9
      });
    }
    vegInst(envG('reed', () => MAPM.reed(1), .4), pick(110, (x, z) => {
      const d = M.flowD(x, z);
      return d > 5 && d < 10 && M.ht(x, z) < 2.2;
    }), (d, p) => at2(d, p, M.ht(p[0], p[1]) - .05, rn(.8, 1.3)), [0xffffff, 0xe8e0c8]);
    mkBirds(7, rn(-80, 80), rn(-80, 80), 34);
    mkBirds(6, rn(-120, 120), rn(-120, 120), 42);
  } else if (bi == 2) {
    // ---- MEZARLIK: ölü ağaçlar, mezar parselleri (taş sıraları + parmaklık + fener), türbeler, sazlık, karga
    const tr = pick(130, (x, z) => ok(x, z, 3) && slope(x, z) < 1);
    [['dead1', 1], ['dead2', 4]].forEach(([k, sd], j) => vegInst(treeGeo('dead', sd, 't'), tr.filter((_, i) => i % 2 == j), (d, p) => {
      const s = rn(1, 1.8),
        hb = M.ht(p[0], p[1]);
      at2(d, p, hb - .1, s);
      addObs({
        x: p[0],
        z: p[1],
        r: .45 * s,
        t: hb + 3.6 * s
      });
    }, [0xffffff, 0xd8d0e0, 0xc4c4d4], true));
    const plots = pick(14, (x, z) => ok(x, z, 12) && slope(x, z) < .35 && M.flowD(x, z) > 18),
      tombs = [[], [], []],
      fences = [],
      lamps = [];
    for (const [px, pz] of plots) {
      const a = rn(0, 6.28),
        ca = Math.cos(a),
        sa = Math.sin(a),
        rows = 2 + (Math.random() * 2 | 0),
        cols = 3 + (Math.random() * 3 | 0),
        W = (x, z) => [px + x * ca - z * sa, pz + x * sa + z * ca];
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        if (Math.random() < .15) continue;
        const [wx, wz] = W((c - (cols - 1) / 2) * 2.2 + rn(-.3, .3), (r - (rows - 1) / 2) * 2.6 + rn(-.3, .3));
        tombs[Math.random() < .55 ? 0 : Math.random() < .5 ? 1 : 2].push([wx, wz, a]);
      }
      const hw = cols * 1.1 + 1.4,
        hd = rows * 1.3 + 1.4;
      for (const sg of [-1, 1]) {
        for (let x = -hw + 1.5; x <= hw - 1.4; x += 3) if (Math.random() < .8) fences.push([...W(x, sg * hd), a]);
        for (let z = -hd + 1.5; z <= hd - 1.4; z += 3) if (Math.random() < .6) fences.push([...W(sg * hw, z), a + Math.PI / 2]);
      }
      lamps.push(W(hw + .6, hd + .6));
      $G.ZN.push({
        x: px,
        z: pz,
        r: Math.max(hw, hd) + 2
      });
    }
    tombs.forEach((arr, v) => vegInst(envG('tomb' + v, () => MAPM.tomb(v), .7), arr, (d, p) => {
      d.rotation.set(0, p[2] + Math.PI, 0);
      const hb = M.ht(p[0], p[1]);
      at2(d, p, hb - .03, rn(.85, 1.15));
      addObs({
        x: p[0],
        z: p[1],
        r: .35,
        t: hb + 1.2
      });
    }, [0xffffff, 0xe0e0ea, 0xcfd4cc], true));
    vegInst(envG('tomb2', () => MAPM.tomb(2), .7), pick(60, (x, z) => ok(x, z, 1)), (d, p) => at2(d, p, M.ht(p[0], p[1]) - .03, rn(.8, 1.2)), [0xffffff, 0xd8d8e0], true);
    vegInst(envG('fence', () => MAPM.fence(1), .7), fences, (d, p) => {
      d.rotation.set(0, p[2], 0);
      at2(d, p, M.ht(p[0], p[1]) - .02, 1);
    }, null, false);
    vegInst(envG('lantern', () => MAPM.lantern(1), .8), lamps.concat(pick(14, (x, z) => ok(x, z, 2))), (d, p) => {
      const hb = M.ht(p[0], p[1]);
      at2(d, p, hb - .02, 1);
      const gl = glow(0xffc070, 3.4, WG, .5);
      gl.position.set(p[0] + .55 * Math.cos(d.rotation.y), hb + 1.9, p[1] - .55 * Math.sin(d.rotation.y));
      lightPool(p[0] + .55 * Math.cos(d.rotation.y), hb, p[1] - .55 * Math.sin(d.rotation.y), 3.6, 0xffb060, .38);
      addObs({
        x: p[0],
        z: p[1],
        r: .18,
        t: hb + 2.2
      });
    }, null, true);
    for (const p of pick(5, (x, z) => ok(x, z, 7) && slope(x, z) < .22 && M.flowD(x, z) > 16)) {
      const a = Math.floor(rn(0, 4)) * Math.PI / 2,
        hb = M.ht(p[0], p[1]);
      addMesh(GEO.tf(MAPM.mausoleum(p[0] * 3 | 0), {
        r: [0, a, 0],
        t: [p[0], hb - .1, p[1]]
      }));
      addObs({
        x: p[0],
        z: p[1],
        r: 2.1,
        t: hb + 4
      });
      $G.ZN.push({
        x: p[0],
        z: p[1],
        r: 5
      });
    }
    vegInst(bushGeo(3, 'autumn2'), pick(90, (x, z) => ok(x, z, 1)), (d, p) => at2(d, p, M.ht(p[0], p[1]) - .05, rn(.6, 1.2), rn(.4, .8)), [0x8a8a96, 0x7a7e86, 0x9a9aa6], true);
    vegInst(envG('msh0', () => MAPM.mushroom(0), .4), pick(60, (x, z) => ok(x, z, 1)), (d, p) => at2(d, p, M.ht(p[0], p[1]), rn(.8, 1.6)), [0xb0b0c0, 0x9a9ab0]);
    for (let v = 0; v < 2; v++) vegInst(envG('bone' + v, () => MAPM.bones(v), .8), pick(12, (x, z) => ok(x, z, 1)), (d, p) => at2(d, p, M.ht(p[0], p[1]) - .02, rn(.9, 1.6)));
    vegInst(envG('reed', () => MAPM.reed(1), .4), pick(90, (x, z) => {
      const d = M.flowD(x, z);
      return d > 5 && d < 10 && M.ht(x, z) < 2.2;
    }), (d, p) => at2(d, p, M.ht(p[0], p[1]) - .05, rn(.8, 1.3)), [0x9aa08a, 0x8a9080]);
    fogSheets(bi, M, WG);
    lightShafts(bi, M, WG, pick(14, (x, z) => ok(x, z, 1) && Math.hypot(x, z) > 24));
    mkBirds(9, rn(-80, 80), rn(-80, 80), 30);
    mkBirds(7, rn(-120, 120), rn(-120, 120), 38);
  } else {
    const tr = pick(70, (x, z) => ok(x, z, 3) && slope(x, z) < 1);
    vegInst(treeGeo('dead', 1, 't'), tr.filter((_, i) => i % 2), (d, p) => {
      const s = rn(.9, 1.5),
        hb = M.ht(p[0], p[1]);
      at2(d, p, hb - .1, s);
      addObs({
        x: p[0],
        z: p[1],
        r: .45 * s,
        t: hb + 3.6 * s
      });
    }, [0xffffff, 0xeee2d6], true);
    vegInst(treeGeo('dead', 4, 't'), tr.filter((_, i) => !(i % 2)), (d, p) => {
      const s = rn(.9, 1.5),
        hb = M.ht(p[0], p[1]);
      at2(d, p, hb - .1, s);
      addObs({
        x: p[0],
        z: p[1],
        r: .45 * s,
        t: hb + 3.6 * s
      });
    }, [0xffffff, 0xeee2d6], true);
    vegInst(bushGeo(4, 'autumn'), pick(150, (x, z) => ok(x, z, 1)), (d, p) => at2(d, p, M.ht(p[0], p[1]) - .05, rn(.6, 1.2), rn(.4, .8)), [0xffffff, 0xe8d8c8], true);
    const sp = pick(30, (x, z) => ok(x, z, 6) && M.flowD(x, z) > 14);
    vegInst(envG('spire1', () => MODELS.spire(1)), sp, (d, p) => {
      const s = rn(.7, 1.35),
        hb = M.ht(p[0], p[1]);
      at2(d, p, hb - .3, s);
      addObs({
        x: p[0],
        z: p[1],
        r: 1.3 * s,
        t: hb + 8 * s
      });
    }, [0xffffff, 0xf0e0d6], true);
    for (let v = 0; v < 2; v++) vegInst(envG('bone' + v, () => MAPM.bones(v), .8), pick(18, (x, z) => ok(x, z, 1)), (d, p) => at2(d, p, M.ht(p[0], p[1]) - .02, rn(.9, 1.6)));
    // tabakalı kaya çıkıntıları: kanyon kenarı ve yamaçlar
    vegInst(envG('outcrop', () => MAPM.outcrop(1), .7), pick(44, (x, z) => ok(x, z, 3) && (M.flowD(x, z) > 11 && M.flowD(x, z) < 26 || slope(x, z) > .3)), (d, p) => {
      const s = rn(1.2, 2.6),
        hb = M.ht(p[0], p[1]);
      at2(d, p, hb - .2, s);
      addObs({
        x: p[0],
        z: p[1],
        r: 1.4 * s,
        t: hb + 2.2 * s
      });
    }, [0xffffff, 0xe8d8cc, 0xd8c0b0], true);
    // kanyon tabanı: kuru dere yatağında iri kayalar
    vegInst(rockGeo(3, 'red'), pick(55, (x, z) => ok(x, z, 1.5) && M.flowD(x, z) < 7), (d, p) => {
      const s = rn(.9, 2.4),
        hb = M.ht(p[0], p[1]);
      at2(d, p, hb - .2 * s, s);
      addObs({
        x: p[0],
        z: p[1],
        r: s * .9,
        t: hb + .8 * s
      });
    }, [0xffffff, 0xe0d0c0, 0xc8b8a8], true);
    // mesa etekleri: kaya çıkıntıları; mesa tepeleri: kaktüs ve agave
    const mesas = $G.LMS.filter(l => l.t == 'mesa'),
      ring = (l, n, r0, r1) => [...Array(n)].map(() => {
        const a = rn(0, 6.28),
          r = l.r * rn(r0, r1);
        return [l.x + Math.cos(a) * r, l.z + Math.sin(a) * r];
      });
    vegInst(envG('outcrop', () => MAPM.outcrop(1), .7), mesas.flatMap(l => ring(l, 5, 1.08, 1.35)).filter(([x, z]) => slope(x, z) < 1.2 && M.ht(x, z) > $G.WLV + .5), (d, p) => {
      const s = rn(1.4, 2.6),
        hb = M.ht(p[0], p[1]);
      at2(d, p, hb - .25, s);
      addObs({
        x: p[0],
        z: p[1],
        r: 1.4 * s,
        t: hb + 2.2 * s
      });
    }, [0xffffff, 0xe8d8cc], true);
    const mtop = mesas.flatMap(l => ring(l, 7, .1, .75)).filter(([x, z]) => slope(x, z) < .4 && Math.hypot(x, z) > 20);
    vegInst(envG('cactus', () => MAPM.cactus(1), .7), mtop.filter((_, i) => i % 2), (d, p) => at2(d, p, M.ht(p[0], p[1]) - .05, rn(.8, 1.3)), [0xffffff, 0xe6f0dc], true);
    vegInst(envG('agave', () => MAPM.agave(1), .7), mtop.filter((_, i) => !(i % 2)), (d, p) => at2(d, p, M.ht(p[0], p[1]) - .03, rn(.8, 1.3)), [0xffffff, 0xe6f0dc], false, true);
    // agave rozetleri
    vegInst(envG('agave', () => MAPM.agave(1), .7), pick(55, (x, z) => ok(x, z, 1) && M.flowD(x, z) > 12), (d, p) => at2(d, p, M.ht(p[0], p[1]) - .03, rn(.8, 1.4)), [0xffffff, 0xe6f0dc], false, true);
    // kaktüsler: açıklıklarda
    vegInst(envG('cactus', () => MAPM.cactus(1), .7), pick(70, (x, z) => ok(x, z, 1.5) && M.flowD(x, z) > 16 && slope(x, z) < .5), (d, p) => {
      const s = rn(.8, 1.4),
        hb = M.ht(p[0], p[1]);
      at2(d, p, hb - .05, s);
      addObs({
        x: p[0],
        z: p[1],
        r: .3 * s,
        t: hb + 2.6 * s
      });
    }, [0xffffff, 0xe6f0dc, 0xd0e0c8], true);
    const oa = $G.LMS.find(l => l.t == 'oasis');
    if (oa) {
      vegInst(envG('reed', () => MAPM.reed(1), .4), [...Array(36)].map(() => {
        const a = rn(0, 6.28),
          r = oa.r * rn(.85, 1.05);
        return [oa.x + Math.cos(a) * r, oa.z + Math.sin(a) * r];
      }), (d, p) => at2(d, p, M.ht(p[0], p[1]) - .05, rn(.8, 1.3)));
      const pal = [...Array(8)].map(() => {
        const a = rn(0, 6.28),
          r = oa.r * rn(1.3, 2.2);
        return [oa.x + Math.cos(a) * r, oa.z + Math.sin(a) * r];
      });
      // vaha çevresi yeşil çimen
      vegInst(grassGeo(11, 'green'), [...Array(90)].map(() => {
        const a = rn(0, 6.28),
          r = oa.r * rn(1.05, 2.4);
        return [oa.x + Math.cos(a) * r, oa.z + Math.sin(a) * r];
      }).filter(([x, z]) => M.ht(x, z) > $G.WLV + .3), (d, p) => at2(d, p, M.ht(p[0], p[1]) - .03, rn(1, 1.8), rn(.9, 1.5)), [0x9ad070, 0x7ab860, 0xb0d880]);
      pal.forEach((p, i) => {
        addMesh(GEO.tf(MAPM.palm(i + 20), {
          r: [0, rn(0, 6.28), 0],
          t: [p[0], M.ht(p[0], p[1]) - .1, p[1]]
        }));
        addObs({
          x: p[0],
          z: p[1],
          r: .45,
          t: M.ht(p[0], p[1]) + 6
        });
      });
    }
    const tgeo = toBG(MAPM.tumble(1));
    for (let i = 0; i < 13; i++) {
      const m = new THREE.Mesh(tgeo, VMAT);
      m.castShadow = true;
      WG.add(m);
      const x = rn(-150, 150),
        z = rn(-150, 150);
      m.position.set(x, M.ht(x, z) + .7, z);
      $G.TUMB.push({
        m,
        vx: 0,
        vz: 0,
        vy: 0,
        s: rn(.8, 1.3)
      });
    }
    mkBirds(5, rn(-80, 80), rn(-80, 80), 46);
    const skl = $G.LMS.find(l => l.t == 'skeleton' || l.t == 'lostcaravan');
    if (skl) mkBirds(6, skl.x, skl.z, 24); // leş üstünde dönen akbabalar
  }
  const RKK = bi == 0 ? 'moss' : bi == 1 ? 'red' : 'dark';
  vegInst(rockGeo(1, RKK), pick(bi == 1 ? 110 : 75, (x, z) => ok(x, z, 2)), (d, p) => {
    const s = rn(.8, 2.8),
      hb = M.ht(p[0], p[1]);
    at2(d, p, hb - .15 * s, s);
    addObs({
      x: p[0],
      z: p[1],
      r: s * .95,
      t: hb + .8 * s
    });
  }, null, true);
  vegInst(rockGeo(7, RKK), pick(30, (x, z) => ok(x, z, 2) && slope(x, z) > .45), (d, p) => {
    const s = rn(2, 4),
      hb = M.ht(p[0], p[1]);
    at2(d, p, hb - .2 * s, s);
    addObs({
      x: p[0],
      z: p[1],
      r: s * .95,
      t: hb + .8 * s
    });
  }, null, true);
  const gs = pick(SET.q == 0 ? 900 : 1200, (x, z) => ok(x, z, .5) && slope(x, z) < .8 && (bi || Math.random() < .35 + .65 * (1 - grove(x, z))));
  for (let v = 0; v < 3; v++) vegInst(grassGeo(v * 2 + 1, bi == 1 ? 'dry' : bi == 2 ? 'gray' : 'green'), gs.filter((_, i) => i % 3 == v), (d, p) => at2(d, p, M.ht(p[0], p[1]) - .03, rn(.8, 1.6), rn(.8, 1.4)), bi == 2 ? [0x8a9080, 0x7a8272, 0x6e766a] : [0xffffff, 0xeaf2e0, 0xdfe8d2, 0xf4ead8]);
  if (typeof grassField == 'function') grassField(bi);
  flushPools();
  // sıçrama pedleri: tepe eteklerinde ve açıklıklarda
  for (const p of pick(7, (x, z) => ok(x, z, 6) && slope(x, z) < .35 && Math.hypot(x, z) > 40)) pad(p[0], p[1]);
  // bulutlar
  for (let i = 0; i < 16; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: CLTEX,
      color: B.cloud,
      transparent: true,
      opacity: .75,
      depthWrite: false,
      fog: false
    }));
    const w = rn(90, 170);
    s.scale.set(w, w * .42, 1);
    s.position.set(rn(-320, 320), rn(95, 140), rn(-320, 320));
    WG.add(s);
    $G.CLOUDS.push(s);
  }
  // mini harita arka planı
  $G.MMBG = document.createElement('canvas');
  $G.MMBG.width = $G.MMBG.height = M.N + 1;
  const cx = $G.MMBG.getContext('2d');
  if (cx) {
    const im = cx.createImageData(M.N + 1, M.N + 1),
      NN = M.N + 1;
    for (let j = 0; j < NN; j++) for (let i = 0; i < NN; i++) {
      const k = j * NN + i,
        h = M.H[k],
        hx = M.H[Math.min(k + 1, NN * NN - 1)] - M.H[Math.max(k - 1, 0)],
        hz = M.H[Math.min(k + NN, NN * NN - 1)] - M.H[Math.max(k - NN, 0)],
        sh = Math.max(.35, Math.min(1.25, .85 - .12 * hx + .1 * hz));
      let r = C[k * 3] * sh,
        g = C[k * 3 + 1] * sh,
        b = C[k * 3 + 2] * sh;
      if (h < $G.WLV - .05) {
        r = .16;
        g = .34;
        b = .48;
      }
      im.data[k * 4] = r * 255;
      im.data[k * 4 + 1] = g * 255;
      im.data[k * 4 + 2] = b * 255;
      im.data[k * 4 + 3] = 255;
    }
    cx.putImageData(im, 0, 0);
  }
}
// ---- harita güncelleme: su, ateş, kuş, bulut, yaprak, toz, yuvarlanan çalı, kum fırtınası, keşif
