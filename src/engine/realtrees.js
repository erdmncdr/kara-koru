// engine/realtrees.js · Kara Koru
// Gerçekçi ağaçlar: kanvasla üretilen kabuk (albedo + kabartma) ve yaprak kartı dokuları (alfa kesimli),
// gövde/dallar UV'li silindirler, taç yaprak kümeleri. Hepsi instanced; VEGM geometri üstündeki mat'ı seçer.

import { THREE } from './three.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { VMATG, VMATT } from './gfx.js';
import { SET } from '../core/settings.js';
const LOW = () => SET.q == 0; // düşük kalite: daha az kart

const RC = {};
let seed = 1;
const rr = () => (seed = seed * 16807 % 2147483647) / 2147483647,
  rn = (a, b) => a + rr() * (b - a);

/** @returns {[HTMLCanvasElement, CanvasRenderingContext2D]} */
function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')];
}
function tex(c, srgb) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
// değer gürültüsü (kanvas için)
function vn(x, y, s) {
  const h = (i, j) => {
    let n = (i * 374761393 + j * 668265263 + s * 982451653) | 0;
    n = Math.imul(n ^ n >>> 13, 1274126177);
    return ((n ^ n >>> 16) >>> 0) / 4294967295;
  };
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  return h(xi, yi) * (1 - u) * (1 - v) + h(xi + 1, yi) * u * (1 - v) + h(xi, yi + 1) * (1 - u) * v + h(xi + 1, yi + 1) * u * v;
}
const fbm = (x, y, s, o = 4) => { let t = 0, a = 1, f = 1, n = 0; for (let i = 0; i < o; i++) { t += vn(x * f, y * f, s + i * 7) * a; n += a; a *= .5; f *= 2; } return t / n; };

// ---- kabuk: dikey çatlaklı, lekeli; kabartma haritası aynı çatlakların yükseklik değeri
export function barkMaps(kind) {
  const key = 'bark' + kind;
  if (RC[key]) return RC[key];
  const W = 256, H = 512, [c, x] = canvas(W, H), [cb, xb] = canvas(W, H),
    im = x.createImageData(W, H), ib = xb.createImageData(W, H),
    base = kind == 'birch' ? [214, 208, 196] : kind == 'pine' ? [96, 66, 44] : kind == 'dead' ? [120, 108, 96] : [92, 70, 48],
    dark = kind == 'birch' ? [40, 36, 34] : kind == 'pine' ? [38, 24, 14] : kind == 'dead' ? [58, 50, 44] : [36, 26, 16];
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const u = i / W, v = j / H,
      ridge = Math.pow(Math.abs(Math.sin((u * 14 + fbm(u * 3, v * 6, 11) * 1.6) * Math.PI)), .35), // dikey oluklar
      n1 = fbm(u * 8, v * 16, 3), n2 = fbm(u * 30, v * 60, 5, 3),
      crack = kind == 'birch' ? (fbm(u * 2, v * 40, 9) > .62 ? 0 : 1) : 1,
      h = Math.min(1, Math.max(0, ridge * .7 + n1 * .25 + n2 * .15)),
      k = (j * W + i) * 4, m = (.45 + .55 * h) * crack + (1 - crack) * .25;
    im.data[k] = base[0] * m + dark[0] * (1 - m);
    im.data[k + 1] = base[1] * m + dark[1] * (1 - m);
    im.data[k + 2] = base[2] * m + dark[2] * (1 - m);
    im.data[k + 3] = 255;
    const hb = Math.round(h * 255 * crack);
    ib.data[k] = ib.data[k + 1] = ib.data[k + 2] = hb;
    ib.data[k + 3] = 255;
  }
  x.putImageData(im, 0, 0);
  xb.putImageData(ib, 0, 0);
  const map = tex(c, 1), bump = tex(cb, 0);
  map.repeat.set(1, 2);
  bump.repeat.set(1, 2);
  return RC[key] = { map, bump };
}

// ---- yaprak kartı: saydam zemin üstüne yaprak kümesi (ya da iğne yelpazesi)
export function leafMap(kind) {
  const key = 'leaf' + kind;
  if (RC[key]) return RC[key];
  const S = 256, [c, x] = canvas(S, S);
  x.clearRect(0, 0, S, S);
  seed = kind == 'needle' ? 7 : kind == 'autumn' ? 13 : kind == 'autumn2' ? 17 : 3;
  if (kind == 'needle') {
    for (let k = 0; k < 220; k++) {
      const cx = rn(20, S - 20), cy = rn(20, S - 20), a = rn(0, 6.28), L = rn(22, 40), g = rn(70, 120);
      x.strokeStyle = `rgba(${g * .45 | 0},${g | 0},${g * .55 | 0},.95)`;
      x.lineWidth = rn(1.4, 2.4);
      x.lineCap = 'round';
      for (let n = -2; n <= 2; n++) {
        const b = a + n * .22;
        x.beginPath();
        x.moveTo(cx, cy);
        x.lineTo(cx + Math.cos(b) * L, cy + Math.sin(b) * L);
        x.stroke();
      }
    }
  } else {
    const pal = kind == 'autumn' ? [[200, 110, 30], [226, 150, 40], [168, 70, 30]] : kind == 'autumn2' ? [[196, 170, 44], [226, 196, 70], [150, 120, 30]] : [[46, 96, 42], [74, 136, 56], [32, 70, 34]];
    for (let k = 0; k < 60; k++) {
      const cx = rn(24, S - 24), cy = rn(24, S - 24), a = rn(0, 6.28), L = rn(22, 34), Wd = L * rn(.45, .62), col = pal[k % 3];
      const sh = rn(.75, 1.15);
      x.save();
      x.translate(cx, cy);
      x.rotate(a);
      const gr = x.createLinearGradient(-L, 0, L, 0);
      gr.addColorStop(0, `rgba(${col[0] * sh * .7 | 0},${col[1] * sh * .7 | 0},${col[2] * sh * .7 | 0},1)`);
      gr.addColorStop(1, `rgba(${Math.min(255, col[0] * sh * 1.15) | 0},${Math.min(255, col[1] * sh * 1.15) | 0},${col[2] * sh | 0},1)`);
      x.fillStyle = gr;
      x.beginPath();
      x.moveTo(-L, 0);
      x.quadraticCurveTo(0, -Wd, L, 0);
      x.quadraticCurveTo(0, Wd, -L, 0);
      x.fill();
      x.strokeStyle = 'rgba(0,0,0,.28)';
      x.lineWidth = 1;
      x.beginPath();
      x.moveTo(-L * .9, 0);
      x.lineTo(L * .85, 0);
      x.stroke();
      x.restore();
    }
  }
  const t = tex(c, 1);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return RC[key] = t;
}

// çift yüzlü kart: three arka yüzde normali ters çevirir, kart kararır; köşe normalini olduğu gibi kullan
const noFlip = sh => {
  sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_begin>', '#include <normal_fragment_begin>\nnormal=normalize(vNormal);nonPerturbedNormal=normal;');
};
// ---- malzemeler
export function barkMat(kind) {
  const key = 'bm' + kind;
  if (RC[key]) return RC[key];
  const { map, bump } = barkMaps(kind);
  const m = new THREE.MeshStandardMaterial({ map, bumpMap: bump, bumpScale: .9, roughness: .95, metalness: 0 });
  return RC[key] = m;
}
export function leafMat(kind) {
  const key = 'lm' + kind;
  if (RC[key]) return RC[key];
  const m = new THREE.MeshStandardMaterial({ map: leafMap(kind), alphaTest: .45, side: THREE.DoubleSide, roughness: .85, metalness: 0, vertexColors: true });
  m.onBeforeCompile = sh => {
    if (VMATT && VMATT.onBeforeCompile) VMATT.onBeforeCompile(sh); // rüzgâr salınımı
    noFlip(sh);
  };
  m.customProgramCacheKey = () => 'leaf' + kind;
  return RC[key] = m;
}

// ---- geometri yardımcıları
function limbGeo(p0, p1, r0, r1, seg = 7) {
  const d = new THREE.Vector3().subVectors(p1, p0), L = d.length();
  const g = new THREE.CylinderGeometry(r1, r0, L, seg, 1, true);
  g.translate(0, L / 2, 0);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
  g.applyQuaternion(q);
  g.translate(p0.x, p0.y, p0.z);
  // UV: çevre boyunca u, uzunluk boyunca v (kabuk tekrarı)
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) * L * .35);
  return g;
}
function card(center, normal, w, h, tint) {
  const g = new THREE.PlaneGeometry(w, h);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal.clone().normalize());
  g.applyQuaternion(q);
  g.translate(center.x, center.y, center.z);
  const n = g.attributes.position.count, col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { col[i * 3] = tint[0]; col[i * 3 + 1] = tint[1]; col[i * 3 + 2] = tint[2]; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}
// kart normallerini küme merkezinden dışa doğru yumuşat (düz kart aydınlatması yerine hacim hissi)
function softNormals(g, c, up = .45) {
  const p = g.attributes.position, n = g.attributes.normal, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.set(p.getX(i) - c.x, p.getY(i) - c.y, p.getZ(i) - c.z).normalize();
    v.y += up;
    v.normalize();
    n.setXYZ(i, v.x, v.y, v.z);
  }
  return g;
}

// ---- ağaçlar: {trunk, leaves} BufferGeometry; kök (0,0,0), y yukarı
export function pineTree(sd) {
  seed = sd * 31 + 5;
  const V = THREE.Vector3, H = rn(7, 9.5), bend = rn(-.12, .12);
  const trunk = [limbGeo(new V(0, -.2, 0), new V(bend, H * .55, 0), .34, .2), limbGeo(new V(bend, H * .55, 0), new V(bend * 1.6, H, 0), .2, .03)];
  const leaves = [];
  const tiers = 6;
  for (let t = 0; t < tiers; t++) {
    const f = t / (tiers - 1), y = H * .22 + f * H * .72, r = (1 - f) * 2.6 + .5, cnt = LOW() ? 5 : 7;
    for (let k = 0; k < cnt; k++) {
      const a = k / cnt * 6.283 + t * .7 + rn(-.2, .2), cx = bend * f + Math.cos(a) * r * .5, cz = Math.sin(a) * r * .5;
      const nrm = new V(Math.cos(a), .55, Math.sin(a)); // kart dışa ve hafif yukarı bakar
      const g = card(new V(cx, y - r * .25, cz), nrm, r * 1.3, r * 1.1, [1, 1, 1]);
      g.rotateY(0);
      leaves.push(softNormals(g, new V(bend * f, y, 0), .6));
    }
    // üst halka: aşağı eğik kartlar (dalların sarkışı)
    for (let k = 0; k < (LOW() ? 2 : 4); k++) {
      const a = k / 4 * 6.283 + t * 1.1, cx = bend * f + Math.cos(a) * r * .35, cz = Math.sin(a) * r * .35;
      leaves.push(softNormals(card(new V(cx, y + .2, cz), new V(Math.cos(a) * .6, 1, Math.sin(a) * .6), r * 1.1, r * .9, [.95, 1, .95]), new V(bend * f, y, 0), .6));
    }
  }
  const lv = mergeGeometries(leaves, false), tk = mergeGeometries(trunk, false);
  return { trunk: tk, leaves: lv };
}

export function oakTree(sd, kind = 'broad') {
  seed = sd * 47 + 3;
  const V = THREE.Vector3, H = rn(4.2, 5.4);
  const trunk = [limbGeo(new V(0, -.2, 0), new V(rn(-.15, .15), H * .55, rn(-.15, .15)), .42, .26, 9)];
  const tops = [], nB = 4;
  for (let b = 0; b < nB; b++) {
    const a = b / nB * 6.283 + rn(-.3, .3), L = rn(1.6, 2.6),
      p0 = new V(0, H * .5, 0), p1 = new V(Math.cos(a) * L, H * .55 + rn(.8, 1.6), Math.sin(a) * L);
    trunk.push(limbGeo(p0, p1, .18, .07, 6));
    tops.push(p1);
  }
  tops.push(new V(0, H * .92, 0));
  const leaves = [];
  for (const c of tops) {
    const R = rn(1.5, 2.1);
    for (let k = 0; k < (LOW() ? 7 : 12); k++) {
      const u = rr() * 2 - 1, th = rr() * 6.283, rad = Math.sqrt(1 - u * u) * R * rn(.5, 1),
        pos = new V(c.x + Math.cos(th) * rad, c.y + u * R * .65 + .3, c.z + Math.sin(th) * rad),
        nrm = new V(pos.x - c.x, pos.y - c.y + .5, pos.z - c.z);
      leaves.push(softNormals(card(pos, nrm, rn(1.5, 2.1), rn(1.3, 1.8), [rn(.85, 1), rn(.9, 1), rn(.85, 1)]), c, .5));
    }
  }
  return { trunk: mergeGeometries(trunk, false), leaves: mergeGeometries(leaves, false), kind };
}

export function deadTree(sd) {
  seed = sd * 19 + 11;
  const V = THREE.Vector3, H = rn(3.6, 4.6), g = [limbGeo(new V(0, -.2, 0), new V(rn(-.2, .2), H, rn(-.2, .2)), .3, .05, 7)];
  for (let b = 0; b < 4; b++) {
    const a = b / 4 * 6.283 + rn(-.4, .4), y0 = H * rn(.4, .8), L = rn(.9, 1.7);
    g.push(limbGeo(new V(0, y0, 0), new V(Math.cos(a) * L, y0 + rn(.5, 1.2), Math.sin(a) * L), .09, .015, 5));
  }
  return { trunk: mergeGeometries(g, false) };
}

// önbellekli geometri: anahtar, kısım ('t' gövde | 'l' yaprak), mat ekli
export function treeGeo(kind, sd, part) {
  const key = 'rt_' + kind + sd + part + (LOW() ? 'q' : '');
  if (RC[key]) return RC[key];
  const bk = kind == 'pine' ? 'pine' : kind == 'dead' ? 'dead' : kind == 'birch' ? 'birch' : 'oak';
  const t = kind == 'pine' ? pineTree(sd) : kind == 'dead' ? deadTree(sd) : oakTree(sd, kind);
  const tg = t.trunk; tg.userData = { key: 'rt_' + kind + sd, mat: barkMat(bk) };
  RC['rt_' + kind + sd + 't' + (LOW() ? 'q' : '')] = tg;
  if (t.leaves) {
    const lk = kind == 'pine' ? 'needle' : kind == 'autumn' || kind == 'autumn2' ? kind : 'broad';
    t.leaves.userData = { key: 'rl_' + kind + sd, mat: leafMat(lk) };
    RC['rt_' + kind + sd + 'l' + (LOW() ? 'q' : '')] = t.leaves;
  }
  return RC[key];
}

// ================= KAYA: ikosahedron + gürültü yer değiştirmesi, küresel UV, kanvas granit dokusu + kabartma
export function rockMaps(kind) {
  const key = 'rock' + kind;
  if (RC[key]) return RC[key];
  const S = 256, [c, x] = canvas(S, S), [cb, xb] = canvas(S, S), im = x.createImageData(S, S), ib = xb.createImageData(S, S),
    base = kind == 'red' ? [168, 92, 64] : kind == 'dark' ? [78, 76, 88] : [116, 112, 112],
    dark = kind == 'red' ? [92, 44, 30] : kind == 'dark' ? [36, 34, 42] : [58, 56, 58],
    moss = [78, 122, 60];
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
    const u = i / S, v = j / S,
      n1 = fbm(u * 6, v * 6, 21), n2 = fbm(u * 24, v * 24, 23, 3), grain = fbm(u * 90, v * 90, 25, 2),
      crack = Math.pow(Math.abs(fbm(u * 5, v * 5, 27) - .5) * 2, .5), // çatlak ağı
      h = Math.min(1, Math.max(0, n1 * .5 + n2 * .3 + grain * .2)) * (.55 + .45 * crack),
      m = .35 + .65 * h, k = (j * S + i) * 4,
      mz = kind == 'moss' ? Math.max(0, fbm(u * 4, v * 4, 29) - .45) * 2.4 * (v < .5 ? 1 : .2) : 0;
    im.data[k] = (base[0] * m + dark[0] * (1 - m)) * (1 - mz) + moss[0] * mz;
    im.data[k + 1] = (base[1] * m + dark[1] * (1 - m)) * (1 - mz) + moss[1] * mz;
    im.data[k + 2] = (base[2] * m + dark[2] * (1 - m)) * (1 - mz) + moss[2] * mz;
    im.data[k + 3] = 255;
    const hb = Math.round(h * 255);
    ib.data[k] = ib.data[k + 1] = ib.data[k + 2] = hb;
    ib.data[k + 3] = 255;
  }
  x.putImageData(im, 0, 0);
  xb.putImageData(ib, 0, 0);
  const map = tex(c, 1), bump = tex(cb, 0);
  map.repeat.set(2, 1);
  bump.repeat.set(2, 1);
  return RC[key] = { map, bump };
}
export function rockMat(kind) {
  const key = 'rm' + kind;
  if (RC[key]) return RC[key];
  const { map, bump } = rockMaps(kind);
  return RC[key] = new THREE.MeshStandardMaterial({ map, bumpMap: bump, bumpScale: 1.2, roughness: .92, metalness: 0 });
}
export function rockGeo(sd, kind) {
  const key = 'rk_' + kind + sd;
  if (RC[key]) return RC[key];
  seed = sd * 23 + 17;
  const sx = rn(.8, 1.3), sy = rn(.65, 1), sz = rn(.8, 1.3), amp = rn(.3, .45), ph = rn(0, 9);
  const g = new THREE.IcosahedronGeometry(1, 3), p = g.attributes.position, v = new THREE.Vector3();
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    v.set(p.getX(i), p.getY(i), p.getZ(i));
    const d = 1 + amp * (fbm(v.x * 1.4 + ph, v.y * 1.4 + v.z, 31, 3) - .5) * 2 + .12 * (fbm(v.x * 4 + ph, v.y * 4 + v.z * 3, 33, 2) - .5) + .05 * (fbm(v.x * 11, v.y * 9 + v.z * 7, 35, 2) - .5);
    const f = v.y < -.25 ? 1 + (v.y + .25) * .9 : 1; // taban yassı
    p.setXYZ(i, v.x * d * sx, v.y * d * sy * f, v.z * d * sz);
    uv[i * 2] = (Math.atan2(v.z, v.x) / 6.283 + .5);
    uv[i * 2 + 1] = Math.acos(Math.max(-1, Math.min(1, v.y))) / Math.PI;
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.computeVertexNormals();
  g.userData = { key, mat: rockMat(kind) };
  return RC[key] = g;
}

// ================= ÇİMEN: alfa kesimli üç çapraz kart, kanvas çimen tutamı dokusu
export function grassMap(kind) {
  const key = 'grs' + kind;
  if (RC[key]) return RC[key];
  const S = 256, [c, x] = canvas(S, S);
  x.clearRect(0, 0, S, S);
  seed = kind == 'dry' ? 41 : 43;
  const pal = kind == 'dry' ? [[150, 128, 70], [172, 150, 92], [120, 104, 58]] : kind == 'gray' ? [[110, 118, 96], [130, 138, 118], [86, 94, 78]] : [[52, 108, 42], [78, 140, 58], [40, 84, 36]];
  x.lineCap = 'round';
  for (let k = 0; k < 110; k++) {
    const bx = rn(10, S - 10), top = rn(10, 120), col = pal[k % 3], sh = rn(.8, 1.2), w = rn(2.2, 4.2), bend = rn(-40, 40);
    const gr = x.createLinearGradient(0, S, 0, top);
    gr.addColorStop(0, `rgb(${col[0] * sh * .55 | 0},${col[1] * sh * .55 | 0},${col[2] * sh * .55 | 0})`);
    gr.addColorStop(1, `rgb(${Math.min(255, col[0] * sh * 1.2) | 0},${Math.min(255, col[1] * sh * 1.2) | 0},${col[2] * sh | 0})`);
    x.strokeStyle = gr;
    x.lineWidth = w;
    x.beginPath();
    x.moveTo(bx, S);
    x.quadraticCurveTo(bx + bend * .3, (S + top) / 2, bx + bend, top);
    x.stroke();
  }
  const t = tex(c, 1);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return RC[key] = t;
}
export function grassMat(kind) {
  const key = 'gm' + kind;
  if (RC[key]) return RC[key];
  const m = new THREE.MeshStandardMaterial({ map: grassMap(kind), alphaTest: .4, side: THREE.DoubleSide, roughness: .9, metalness: 0, vertexColors: true });
  m.onBeforeCompile = sh => {
    if (VMATG && VMATG.onBeforeCompile) VMATG.onBeforeCompile(sh);
    noFlip(sh);
  };
  m.customProgramCacheKey = () => 'grass' + kind;
  return RC[key] = m;
}
export function grassGeo(sd, kind) {
  const key = 'rg_' + kind + sd + (LOW() ? 'q' : '');
  if (RC[key]) return RC[key];
  seed = sd * 13 + 1;
  const w = rn(1, 1.3), h = rn(.75, 1.05), gs = [];
  for (let k = 0; k < (LOW() ? 2 : 3); k++) {
    const g = new THREE.PlaneGeometry(w, h);
    g.translate(0, h / 2, 0);
    g.rotateY(k * Math.PI / 3 + rn(-.2, .2));
    const n = g.attributes.position.count, col = new Float32Array(n * 3), sh = rn(.85, 1.05);
    for (let i = 0; i < n; i++) { col[i * 3] = sh; col[i * 3 + 1] = sh; col[i * 3 + 2] = sh; }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    // normal yukarı: çimen zeminle birlikte aydınlansın
    const nr = g.attributes.normal;
    for (let i = 0; i < nr.count; i++) nr.setXYZ(i, 0, 1, 0);
    gs.push(g);
  }
  const g = mergeGeometries(gs, false);
  g.userData = { key: 'rg_' + kind + sd, mat: grassMat(kind) };
  return RC[key] = g;
}

// ================= ÇALI: alçak yaprak kartı kümesi
export function bushGeo(sd, kind) {
  const key = 'rb_' + kind + sd + (LOW() ? 'q' : '');
  if (RC[key]) return RC[key];
  seed = sd * 29 + 7;
  const V = THREE.Vector3, leaves = [], c = new V(0, .45, 0), R = rn(.7, .95);
  for (let k = 0; k < (LOW() ? 8 : 14); k++) {
    const u = rr() * 1.6 - .6, th = rr() * 6.283, rad = Math.sqrt(Math.max(0, 1 - u * u)) * R * rn(.5, 1),
      pos = new V(Math.cos(th) * rad, .45 + u * R * .6, Math.sin(th) * rad),
      nrm = new V(pos.x, pos.y - .2 + .4, pos.z);
    leaves.push(softNormals(card(pos, nrm, rn(.8, 1.2), rn(.7, 1), [rn(.85, 1), rn(.9, 1), rn(.85, 1)]), c, .5));
  }
  const g = mergeGeometries(leaves, false);
  g.userData = { key: 'rb_' + kind + sd, mat: leafMat(kind) };
  return RC[key] = g;
}
