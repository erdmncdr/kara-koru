// geo/accessories.js · Kara Koru
// Ayırt edici aksesuarlar: kahraman, düşman türü ve boss modellerine kemik bazlı küçük parçalar.
// Taban model + palet varyantlarını birbirinden görsel olarak ayırır. Parçalar iskelet kemiğine
// (hip, sp, ch, hd ...) bağlanır; o kemik yoksa kök gruba. Konumlar model uzayında (ölçek öncesi).
//
// Parça: { b kemik, s şekil (box sph cone cyl tor plane oct), c renk, p [x,y,z], sc [sx,sy,sz], r [rx,ry,rz], gl parıltı boyutu, op saydamlık }

import { THREE } from '../engine/three.js';
import { BM, BMc, glow, mk } from '../engine/renderer.js';

const G = {};
function geo(s) {
  if (G[s]) return G[s];
  const g = s == 'box' ? new THREE.BoxGeometry(1, 1, 1) : s == 'sph' ? new THREE.SphereGeometry(1, 10, 8) : s == 'cone' ? new THREE.ConeGeometry(1, 1, 10) : s == 'cyl' ? new THREE.CylinderGeometry(1, 1, 1, 10) : s == 'tor' ? new THREE.TorusGeometry(1, .14, 6, 16) : s == 'oct' ? new THREE.OctahedronGeometry(1) : new THREE.PlaneGeometry(1, 1);
  G[s] = g;
  return g;
}
const MATS = {};
function mat(c, op) {
  const k = c + ':' + (op || 1);
  if (!MATS[k]) {
    MATS[k] = op != null && op < 1 ? new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: op, side: 2, depthWrite: false }) : BM(c);
    if (MATS[k].side != null && op == null) MATS[k].side = 2;
  }
  return MATS[k];
}

const wings = (c, w = .55, h = .75, y = 2.05, z = -.25, op = .85) => [-1, 1].map(s => ({ b: 'ch', s: 'plane', c, p: [s * .34, y, z], sc: [w, h, 1], r: [.2, s * .9, s * .35], op: Math.min(op, .72) }));
const horns = (c, y = 2.78, x = .12, l = .32) => [-1, 1].map(s => ({ b: 'hd', s: 'cone', c, p: [s * x, y, .1], sc: [l * .14, l, l * .14], r: [0, 0, -s * .55] }));

export const ACC = {
  hero: {
    tunc: [{ b: 'hd', s: 'box', c: 0x1a6a6a, p: [0, 2.56, .19], sc: [.26, .07, .05], gl: .35 }, { b: 'ch', s: 'tor', c: 0xd8a060, p: [0, 2.05, -.3], sc: [.22, .22, .22], r: [0, 0, 0] }, ...[-1, 1].map(s => ({ b: 'ch', s: 'box', c: 0xb8783a, p: [s * .36, 2.3, 0], sc: [.18, .12, .26] }))],
    pehlivan: [{ b: 'hip', s: 'tor', c: 0xb8261e, p: [0, 1.32, 0], sc: [.36, .36, .5], r: [1.57, 0, 0] }, { b: 'hd', s: 'cyl', c: 0x2a1810, p: [0, 2.7, 0], sc: [.17, .06, .17] }],
    yaban: [{ b: 'hd', s: 'sph', c: 0x4a3a22, p: [0, 2.68, -.08], sc: [.26, .22, .28] }, { b: 'ch', s: 'cyl', c: 0x5a3e28, p: [.2, 2.0, -.3], sc: [.06, 1.1, .06], r: [.3, 0, .5] }, { b: 'ch', s: 'sph', c: 0x4a3020, p: [.46, 2.5, -.36], sc: [.14, .12, .14] }],
    haydut: [{ b: 'hd', s: 'tor', c: 0xb8261e, p: [0, 2.62, 0], sc: [.17, .17, .35], r: [1.57, 0, 0] }, { b: 'ch', s: 'box', c: 0x3a2a1e, p: [0, 2.05, .2], sc: [.08, .7, .05], r: [0, 0, .6] }, ...[0, 1, 2].map(i => ({ b: 'ch', s: 'cyl', c: 0xd8b060, p: [-.14 + i * .14, 2.2 - i * .1, .24], sc: [.025, .08, .025] }))],
    umay: [...wings(0xd8d4c8, .6, .85, 2.1, -.22, .9), { b: 'hd', s: 'tor', c: 0xffd36a, p: [0, 2.95, 0], sc: [.2, .2, .2], r: [1.57, 0, 0], gl: .6 }],
    asikci: [{ b: 'hip', s: 'sph', c: 0x6a2a5a, p: [-.3, 1.3, .1], sc: [.12, .14, .12] }, { b: 'ch', s: 'cyl', c: 0xe8d060, p: [0, 2.15, .2], sc: [.09, .02, .09], r: [1.57, 0, 0], gl: .3 }, ...[-1, 1].map(s => ({ b: 'hd', s: 'box', c: 0xf0e8d8, p: [s * .1, 2.72, .18], sc: [.06, .06, .06] }))],
    gokce: [...[0, 1, 2].map(i => ({ b: 'hd', s: 'cone', c: 0xd8e8ff, p: [(i - 1) * .13, 2.84, 0], sc: [.045, .16 + (i == 1 ? .08 : 0), .045] })), { b: 'ch', s: 'sph', c: 0x9fe8ff, p: [.42, 2.35, .12], sc: [.09, .09, .09], gl: .45 }],
    sahmeran: [...[0, 1, 2, 3].map(i => ({ b: 'hip', s: 'sph', c: 0x3a7a4a, p: [-.1 - i * .12, 1.2 - i * .12, -.25 - i * .14], sc: [.12 - i * .02, .12 - i * .02, .12 - i * .02] })), { b: 'hd', s: 'cone', c: 0x2a5a3a, p: [0, 2.85, -.02], sc: [.2, .3, .2] }],
    okcu: [{ b: 'ch', s: 'cyl', c: 0x5a3e28, p: [-.2, 2.1, -.28], sc: [.07, .6, .07], r: [.2, 0, .25] }, { b: 'ch', s: 'tor', c: 0x8a6a4a, p: [.1, 2.0, -.3], sc: [.5, .5, .25], r: [0, 1.4, .3] }, ...[0, 1, 2].map(i => ({ b: 'ch', s: 'cyl', c: 0xe8e0d0, p: [-.2 + (i - 1) * .04, 2.42, -.26], sc: [.012, .14, .012], r: [.2, 0, .25] }))],
    orakci: [{ b: 'hd', s: 'cone', c: 0x1a1a22, p: [0, 2.72, -.04], sc: [.24, .4, .24] }, { b: 'ch', s: 'cyl', c: 0x3a2a1e, p: [.25, 2.0, -.3], sc: [.04, 1.4, .04], r: [0, 0, .25] }, { b: 'ch', s: 'box', c: 0xb0b8c0, p: [.45, 2.62, -.3], sc: [.5, .05, .03], r: [0, 0, -.5] }, { b: 'hd', s: 'sph', c: 0xff4040, p: [0, 2.56, .14], sc: [.06, .04, .04], gl: .25 }]
  },
  // Düşman sınıfı model ölçüleri (model uzayı, dünya = model × ölçek):
  //  t0 yürüyen: boy 1.85, hd [0,1.52,.45], ch [0,1.42,.27], hip [0,.9,-.05]
  //  t1 uçan:    boy 2.25, hd [0,1.86,.28], hip [0,1.8,-.3] (kemikler: hip, hd, kanatlar)
  //  t2 dev:     boy 3.44, hd [0,2.75,.15], ch [0,2.3,0],  hip [0,1.15,0]
  //  t3 boss:    boy 5.13, hd [0,3.35,.15], ch [0,2.8,0],  hip [0,1.45,0]
  //  t4 okçu:    boy 2.72, hd [0,2.18,0],   ch [0,1.85,0],  hip [0,1.12,0]
  //  t5 hücumcu: boy 2.95, hd [0,2.38,.35], ch [0,2.25,.05], hip [0,1.2,0]
  kind: {
    // t0
    bocek: [...[-1, 1].map(s => ({ b: 'hd', s: 'cyl', c: 0x2a3a1a, p: [s * .1, 1.9, .6], sc: [.02, .36, .02], r: [-.7, 0, s * .35] })), ...[-1, 1].map(s => ({ b: 'hd', s: 'sph', c: 0x4a6a2a, p: [s * .2, 2.04, .72], sc: [.05, .05, .05] }))],
    hortlak: [{ b: 'ch', s: 'box', c: 0x4a5a4a, p: [.1, 1.3, .42], sc: [.34, .07, .05], r: [0, 0, .45] }, { b: 'hd', s: 'box', c: 0x3a4a3a, p: [-.12, 1.62, .55], sc: [.14, .05, .04], r: [0, 0, -.3] }],
    mumya: [...[0, 1, 2].map(i => ({ b: 'ch', s: 'box', c: 0xd8c8a0, p: [0, 1.0 + i * .18, .4], sc: [.6, .06, .05], r: [0, 0, (i % 2 ? 1 : -1) * .3] })), { b: 'hd', s: 'box', c: 0xd8c8a0, p: [0, 1.58, .62], sc: [.4, .06, .04], r: [0, 0, .2] }, { b: 'hip', s: 'box', c: 0xc8b890, p: [.3, .8, .2], sc: [.08, .5, .05], r: [0, 0, .3] }],
    iskelet: [{ b: 'ch', s: 'tor', c: 0xe8e0d0, p: [0, 1.25, .25], sc: [.3, .25, .25], r: [1.57, 0, 0] }, { b: 'ch', s: 'tor', c: 0xe8e0d0, p: [0, 1.08, .2], sc: [.32, .25, .25], r: [1.57, 0, 0] }],
    tabut4: [{ b: 'hd', s: 'box', c: 0x4a4a5a, p: [0, 1.82, .4], sc: [.5, .14, .3] }],
    // t1
    ari: [...[-1, 1].map(s => ({ b: 'hip', s: 'plane', c: 0xf0f0c0, p: [s * .9, 2.1, -.2], sc: [1.0, .55, 1], r: [1.57, 0, s * .2], op: .55 })), ...[0, 1, 2].map(i => ({ b: 'hip', s: 'tor', c: 0x1a1a1a, p: [0, 1.75, -.5 - i * .3], sc: [.5 - i * .06, .5 - i * .06, .5], r: [0, 0, 0] })), { b: 'hip', s: 'cone', c: 0x1a1a1a, p: [0, 1.7, -1.5], sc: [.12, .4, .12], r: [-1.57, 0, 0] }],
    ruhalevi: [{ b: 'hd', s: 'cone', c: 0xffa040, p: [0, 2.5, .2], sc: [.45, .9, .45], gl: .45 }, { b: 'hd', s: 'cone', c: 0xffe080, p: [0, 2.4, .2], sc: [.25, .6, .25] }],
    karahayalet: [...[-1, 1].map(s => ({ b: 'hd', s: 'sph', c: 0xff3a3a, p: [s * .2, 2.0, .62], sc: [.08, .06, .05], gl: .3 })), { b: 'hd', s: 'cone', c: 0x0a0a12, p: [0, 2.35, .2], sc: [.42, .7, .42] }],
    morhayalet: [{ b: 'hd', s: 'cone', c: 0x8a5ad0, p: [0, 2.32, .2], sc: [.4, .62, .4] }, ...[-1, 1].map(s => ({ b: 'hd', s: 'sph', c: 0xf0d0ff, p: [s * .17, 1.98, .62], sc: [.07, .06, .05] })), ...[0, 1, 2].map(i => ({ b: 'hip', s: 'cone', c: 0x7a4ac0, p: [(i - 1) * .3, 1.35, -.2], sc: [.1, .5, .1], r: [3.14, 0, (i - 1) * .3] }))],
    kizilhayalet: [...horns(0xff6a5a, 2.3, .2, .5), ...[-1, 1].map(s => ({ b: 'hd', s: 'sph', c: 0xfff0a0, p: [s * .18, 1.98, .62], sc: [.08, .07, .05] })), ...[0, 1, 2, 3].map(i => ({ b: 'hip', s: 'cone', c: 0xe04040, p: [Math.cos(i * 1.57) * .45, 1.9, -.3 + Math.sin(i * 1.57) * .3], sc: [.08, .38, .08], r: [-.6, 0, Math.cos(i * 1.57) * .7] }))],
    hayaletbeyi: [{ b: 'hd', s: 'cyl', c: 0xc8a8ff, p: [0, 2.35, .25], sc: [.4, .2, .4], gl: .5 }, ...[0, 1, 2, 3].map(i => ({ b: 'hd', s: 'cone', c: 0xe0d0ff, p: [Math.cos(i * 1.57) * .34, 2.55, .25 + Math.sin(i * 1.57) * .34], sc: [.06, .2, .06] }))],
    // t2
    kemikyumagi: [...[0, 1, 2, 3, 4].map(i => ({ b: 'ch', s: 'tor', c: 0xe8e0d0, p: [0, 2.0, 0], sc: [1.6, 1.6, 1.6], r: [i * .63, i * .4 + .3, i * .2] })), ...[0, 1, 2, 3].map(i => ({ b: 'ch', s: 'sph', c: 0xf0ead8, p: [Math.cos(i * 1.57) * 1.3, 2.0 + (i % 2) * .6, Math.sin(i * 1.57) * 1.3], sc: [.3, .34, .28] }))],
    kadimmumya: [...[0, 1, 2, 3, 4].map(i => ({ b: i > 2 ? 'ch' : 'hip', s: 'box', c: 0xc8b080, p: [0, 1.0 + i * .45, .95], sc: [1.6, .1, .06], r: [0, 0, (i % 2 ? 1 : -1) * .22] })), { b: 'hd', s: 'cyl', c: 0xe0c060, p: [0, 3.45, .15], sc: [.55, .22, .55] }, { b: 'hd', s: 'cone', c: 0x3a8ad0, p: [0, 3.6, .68], sc: [.12, .3, .12], r: [.5, 0, 0] }],
    kumdevi: [...[0, 1, 2, 3, 4, 5].map(i => ({ b: i % 2 ? 'ch' : 'hip', s: 'box', c: 0x7a5a30, p: [Math.cos(i * 1.05) * 1.3, 1.5 + (i % 3) * .6, Math.sin(i * 1.05) * 1.1], sc: [.16, .9, .16], r: [.2, i * .5, .3] })), { b: 'hd', s: 'box', c: 0x9a7a40, p: [0, 3.5, .15], sc: [.9, .3, .9], r: [0, .6, 0] }],
    cali: [...[[0, 2.4, 1.3], [1.3, 2.0, .6], [-1.3, 2.2, .4], [.8, 3.3, -.4], [-.8, 3.1, -.6], [0, 1.4, 1.2], [1.2, 1.2, -1.0], [-1.1, 1.0, -.6], [0, 3.6, .3], [1.4, 2.9, .9], [-1.5, 2.6, 1.0]].map(p => ({ b: p[1] > 2.1 ? 'ch' : 'hip', s: 'sph', c: 0x3a8a3a, p, sc: [.75, .62, .75] })), ...[[.6, 2.9, 1.5], [-.5, 2.2, 1.6]].map(p => ({ b: 'ch', s: 'sph', c: 0xd03a3a, p, sc: [.16, .16, .16] }))],
    direk: [{ b: 'root', s: 'oct', c: 0x6ad6f0, p: [0, 4.4, 0], sc: [.8, 1.3, .8], gl: .8 }, ...[0, 1, 2, 3].map(i => ({ b: 'root', s: 'box', c: 0x2a4a7a, p: [Math.cos(i * 1.57) * 1.2, 1.2, Math.sin(i * 1.57) * 1.2], sc: [.3, 2.4, .3], r: [0, i * 1.57, 0] }))],
    tabut3: [{ b: 'hd', s: 'tor', c: 0x4a4a5a, p: [0, 3.3, .15], sc: [.55, .55, .55], r: [1.57, 0, 0] }],
    // t4
    kaktus: [...[[.35, 1.9, .2], [-.35, 1.6, .2], [0, 2.3, .25], [.3, 1.3, -.2], [-.3, 2.1, -.25]].map(p => ({ b: 'ch', s: 'cone', c: 0xe8e0c0, p, sc: [.05, .3, .05], r: [p[2] > 0 ? -1.3 : 1.3, 0, p[0] * 1.2] })), { b: 'hd', s: 'sph', c: 0xff6a8a, p: [0, 2.55, 0], sc: [.14, .12, .14] }],
    altiniskelet: [{ b: 'hd', s: 'cyl', c: 0xffd040, p: [0, 2.5, 0], sc: [.24, .12, .24], gl: .4 }, ...[0, 1, 2, 3].map(i => ({ b: 'hd', s: 'cone', c: 0xffd040, p: [Math.cos(i * 1.57) * .2, 2.64, Math.sin(i * 1.57) * .2], sc: [.04, .14, .04] })), { b: 'ch', s: 'tor', c: 0xffd040, p: [0, 1.95, .05], sc: [.3, .3, .3], r: [1.57, 0, 0] }],
    tabut1: [{ b: 'hd', s: 'cyl', c: 0x4a4a5a, p: [0, 2.5, 0], sc: [.25, .14, .25] }],
    iskeletkrali: [{ b: 'hd', s: 'cyl', c: 0xffd040, p: [0, 2.55, 0], sc: [.26, .12, .26], gl: .4 }, ...[0, 1, 2, 3, 4].map(i => ({ b: 'hd', s: 'cone', c: 0xffd040, p: [Math.cos(i * 1.26) * .22, 2.7, Math.sin(i * 1.26) * .22], sc: [.04, .14, .04] })), { b: 'ch', s: 'cyl', c: 0x3a2a4a, p: [.5, 1.9, .2], sc: [.05, 1.6, .05] }],
    baba: [{ b: 'hd', s: 'sph', c: 0xf8f4e8, p: [0, 2.3, .1], sc: [.4, .46, .38] }, ...[-1, 1].map(s => ({ b: 'hd', s: 'sph', c: 0x1a0a0a, p: [s * .14, 2.36, .42], sc: [.09, .1, .06] })), { b: 'hd', s: 'box', c: 0x1a0a0a, p: [0, 2.08, .42], sc: [.22, .06, .06] }, { b: 'ch', s: 'tor', c: 0xd8d0c0, p: [0, 1.7, 0], sc: [.3, .3, .3], r: [1.57, 0, 0] }],
    // t5
    akrep: [...[0, 1, 2, 3].map(i => ({ b: 'hip', s: 'sph', c: 0x5a2a10, p: [0, 1.1 + i * .3, -.5 - i * .28], sc: [.2, .2, .2] })), { b: 'hip', s: 'cone', c: 0x1a0a04, p: [0, 2.3, -1.5], sc: [.12, .45, .12], r: [1.0, 0, 0] }, ...[-1, 1].map(s => ({ b: 'hd', s: 'box', c: 0x6a3a18, p: [s * .5, 2.2, .7], sc: [.14, .14, .4], r: [0, s * .5, 0] }))],
    akrepana: [...[0, 1, 2, 3, 4].map(i => ({ b: 'hip', s: 'sph', c: 0x3a1a08, p: [0, 1.1 + i * .35, -.5 - i * .32], sc: [.26 - i * .02, .26 - i * .02, .26 - i * .02] })), { b: 'hip', s: 'cone', c: 0x6ad64a, p: [0, 2.7, -2.0], sc: [.16, .6, .16], r: [1.0, 0, 0], gl: .4 }, ...[-1, 1].map(s => ({ b: 'hd', s: 'box', c: 0x4a2a10, p: [s * .55, 2.2, .8], sc: [.18, .18, .55], r: [0, s * .5, 0] }))],
    tabut2: [{ b: 'hd', s: 'cone', c: 0x4a4a5a, p: [0, 2.8, .3], sc: [.28, .4, .28] }],
    // ---- yalnız renk varyantı olan türler: silüet ayrımı (hepsi mat, geometriye gömülür)
    // t0
    gucluguly: [...horns(0x5a3a1a, 1.86, .17, .42), ...[-1, 1].map(s => ({ b: 'ch', s: 'cone', c: 0x3a2a1a, p: [s * .42, 1.52, .3], sc: [.06, .22, .06], r: [0, 0, -s * .9] })), { b: 'ch', s: 'tor', c: 0x2a1a10, p: [0, 1.45, .36], sc: [.26, .26, .3], r: [1.4, 0, 0] }],
    patlayan: [{ b: 'ch', s: 'sph', c: 0xff6a20, p: [0, 1.18, .42], sc: [.24, .22, .2], gl: .5 }, ...[-1, 1].map(s => ({ b: 'ch', s: 'sph', c: 0xffb040, p: [s * .22, 1.32, .4], sc: [.1, .1, .09] })), { b: 'hd', s: 'cyl', c: 0x3a2a1a, p: [0, 1.82, .5], sc: [.03, .22, .03], r: [.3, 0, .2] }, { b: 'hd', s: 'sph', c: 0xffe060, p: [.04, 1.94, .53], sc: [.06, .06, .06] }],
    zirhliiskelet: [{ b: 'hd', s: 'cyl', c: 0x6a6a7a, p: [0, 1.74, .46], sc: [.21, .12, .22] }, { b: 'hd', s: 'box', c: 0x5a5a6a, p: [0, 1.64, .64], sc: [.3, .08, .08] }, ...[-1, 1].map(s => ({ b: 'ch', s: 'sph', c: 0x6a6a7a, p: [s * .42, 1.5, .3], sc: [.17, .1, .17] })), { b: 'ch', s: 'box', c: 0x5e5e6e, p: [0, 1.26, .3], sc: [.44, .4, .1], r: [.35, 0, 0] }],
    zirhlitozlu: [{ b: 'hd', s: 'cyl', c: 0x8a7a5a, p: [0, 1.74, .46], sc: [.21, .12, .22] }, ...[-1, 1].map(s => ({ b: 'ch', s: 'sph', c: 0x8a7a5a, p: [s * .42, 1.5, .3], sc: [.17, .1, .17] })), { b: 'ch', s: 'box', c: 0x7a6a4a, p: [0, 1.26, .3], sc: [.44, .4, .1], r: [.35, 0, 0] }, { b: 'hip', s: 'box', c: 0x9a8a6a, p: [0, .76, .02], sc: [.5, .3, .08], r: [0, 0, .15] }],
    kurbaga: [...[-1, 1].map(s => ({ b: 'hd', s: 'sph', c: 0xf0e040, p: [s * .15, 1.8, .6], sc: [.14, .14, .13] })), ...[-1, 1].map(s => ({ b: 'hd', s: 'sph', c: 0x101008, p: [s * .15, 1.82, .72], sc: [.06, .07, .04] })), ...[[0, 1.36, .25], [.2, 1.2, .15], [-.22, 1.28, .2]].map(p => ({ b: 'ch', s: 'sph', c: 0x1a6a1a, p, sc: [.09, .06, .09] }))],
    tozluiskelet: [{ b: 'hd', s: 'box', c: 0xa09070, p: [0, 1.66, .5], sc: [.36, .09, .3], r: [0, 0, .1] }, { b: 'hip', s: 'box', c: 0xa09070, p: [0, .78, .02], sc: [.52, .34, .1], r: [0, 0, -.12] }, { b: 'hip', s: 'box', c: 0x8a7a5a, p: [.12, .62, 0], sc: [.2, .28, .1], r: [0, 0, .3] }],
    zombi: [{ b: 'ch', s: 'tor', c: 0xc8c0a8, p: [0, 1.22, .3], sc: [.28, .22, .22], r: [1.57, 0, 0] }, { b: 'ch', s: 'tor', c: 0xc8c0a8, p: [0, 1.08, .26], sc: [.3, .22, .22], r: [1.57, 0, 0] }, { b: 'fa0', s: 'box', c: 0x8a6a5a, p: [-.46, 1.1, .36], sc: [.12, .3, .12], r: [0, 0, .2] }, ...[-1, 1].map(s => ({ b: 'hd', s: 'sph', c: 0xa0ff60, p: [s * .13, 1.74, .68], sc: [.05, .05, .04] }))],
    // t1
    kafa: [...[-1, 1].map(s => ({ b: 'hd', s: 'sph', c: 0xff3a2a, p: [s * .16, 1.95, .58], sc: [.07, .07, .05], gl: .3 })), ...horns(0x3a2a22, 2.1, .16, .3), ...[-1, 1].map(s => ({ b: 'hd', s: 'cone', c: 0xf0ead8, p: [s * .08, 1.72, .62], sc: [.03, .12, .03], r: [3.14, 0, 0] }))],
    maviiskelet: [{ b: 'hd', s: 'oct', c: 0x6ac8ff, p: [0, 2.52, 0], sc: [.16, .26, .16], gl: .45 }, ...[-1, 1].map(s => ({ b: 'ch', s: 'oct', c: 0x4a8ae0, p: [s * .4, 1.95, 0], sc: [.08, .14, .08], gl: .2 }))],
    // t2
    gulyabanitank: [{ b: 'hd', s: 'cyl', c: 0x4a3a2a, p: [0, 2.95, .1], sc: [.5, .22, .5] }, ...[-1, 1].map(s => ({ b: 'ch', s: 'box', c: 0x4a3a2a, p: [s * .95, 2.25, .5], sc: [.5, 1.0, .12], r: [0, s * .3, 0] })), ...[-1, 1].map(s => ({ b: 'ch', s: 'cone', c: 0x2a1a10, p: [s * 1.1, 2.9, 0], sc: [.1, .4, .1], r: [0, 0, -s * .6] }))],
    mumyatank: [...[0, 1, 2, 3].map(i => ({ b: i > 1 ? 'ch' : 'hip', s: 'box', c: 0xb8a070, p: [0, 1.1 + i * .5, .95], sc: [1.7, .12, .06], r: [0, 0, (i % 2 ? 1 : -1) * .2] })), { b: 'hd', s: 'box', c: 0x2a2018, p: [0, 2.8, .62], sc: [.7, .16, .1] }, { b: 'hd', s: 'box', c: 0xb8a070, p: [0, 3.05, .4], sc: [.9, .16, .9] }],
    kayadevi: [...[[0, 2.9, -.3], [.6, 2.6, -.5], [-.6, 2.7, -.45], [.3, 3.2, -.1], [-.4, 2.2, -.6]].map(p => ({ b: 'ch', s: 'cone', c: 0x5a5a52, p, sc: [.18, .6, .18], r: [-.7, 0, p[0] * .5] })), ...[[.9, 1.6, .5], [-.8, 1.4, .6]].map(p => ({ b: 'hip', s: 'oct', c: 0x8ad0ff, p, sc: [.18, .28, .18], gl: .3 }))],
    // t4
    okcubasi: [{ b: 'hd', s: 'cone', c: 0x3a2a2a, p: [0, 2.5, 0], sc: [.3, .4, .3] }, { b: 'hd', s: 'tor', c: 0xc8a040, p: [0, 2.32, 0], sc: [.26, .26, .3], r: [1.57, 0, 0] }, ...[-1, 1].map(s => ({ b: 'ch', s: 'sph', c: 0xe8e0d0, p: [s * .4, 1.98, 0], sc: [.16, .12, .16] })), { b: 'ch', s: 'box', c: 0x8a2020, p: [0, 1.6, -.25], sc: [.7, .9, .05] }],
    // t5
    buyukakrep: [...[0, 1, 2, 3, 4].map(i => ({ b: 'hip', s: 'sph', c: 0x3a1a08, p: [0, 1.1 + i * .33, -.5 - i * .3], sc: [.28 - i * .02, .28 - i * .02, .28 - i * .02] })), { b: 'hip', s: 'cone', c: 0x1a0a04, p: [0, 2.6, -1.95], sc: [.16, .55, .16], r: [1.0, 0, 0] }, { b: 'hip', s: 'sph', c: 0x8aff40, p: [0, 2.78, -2.15], sc: [.08, .08, .08], gl: .3 }, ...[-1, 1].map(s => ({ b: 'hd', s: 'cone', c: 0x3a1a08, p: [s * .5, 2.15, .85], sc: [.16, .6, .12], r: [1.57, 0, s * .4] })), ...[-1, 1].map(s => ({ b: 'hd', s: 'sph', c: 0x4a2a10, p: [s * .48, 2.15, .55], sc: [.2, .18, .2] })), ...[[.5, 2.0, -.2], [-.5, 2.1, -.3], [0, 2.4, -.5]].map(p => ({ b: 'ch', s: 'cone', c: 0x2a1a08, p, sc: [.08, .3, .08], r: [-.6, 0, p[0]] }))],
    karakoncolos_dev: [...horns(0x2a1a0a, 2.72, .3, .85), ...[[0, 2.6, -.4], [.4, 2.4, -.5], [-.4, 2.45, -.5], [.2, 2.1, -.6], [-.2, 2.0, -.6]].map(p => ({ b: 'ch', s: 'cone', c: 0x1a1008, p, sc: [.1, .4, .1], r: [-.8, 0, p[0] * .6] })), { b: 'ch', s: 'tor', c: 0x3a2a1a, p: [0, 2.25, .1], sc: [.5, .5, .4], r: [1.5, 0, 0] }],
    // t3 bosslar (ölçek 2.8-3.3: parçalar model uzayında küçük tutulur)
    kefen: [...[0, 1, 2, 3, 4, 5].map(i => ({ b: 'root', s: 'plane', c: 0x0a0a10, p: [Math.cos(i * 1.05) * 1.9, 2.4, Math.sin(i * 1.05) * 1.9], sc: [1.3, 4.6, 1], r: [0, -i * 1.05 + 1.57, 0], op: .75 })), ...[-1, 1].map(s => ({ b: 'hd', s: 'sph', c: 0xff2020, p: [s * .3, 3.9, .75], sc: [.14, .1, .1], gl: .5 }))],
    erlik: [...horns(0x2a1a3a, 4.3, .55, 1.4), { b: 'ch', s: 'cyl', c: 0x3a2a4a, p: [1.5, 2.6, .3], sc: [.1, 3.8, .1] }, { b: 'ch', s: 'oct', c: 0xb070ff, p: [1.5, 4.7, .3], sc: [.35, .55, .35], gl: .8 }, { b: 'ch', s: 'tor', c: 0x6a4a9a, p: [0, 2.4, 0], sc: [1.3, 1.3, 1.6], r: [1.57, 0, 0] }],
    hortlakboss: [{ b: 'hd', s: 'cyl', c: 0xd8d8e8, p: [0, 4.6, .15], sc: [.7, .3, .7], gl: .6 }, ...[0, 1, 2, 3, 4, 5].map(i => ({ b: 'hd', s: 'cone', c: 0xe8e8f0, p: [Math.cos(i * 1.05) * .6, 4.9, .15 + Math.sin(i * 1.05) * .6], sc: [.1, .35, .1] })), ...[0, 1, 2].map(i => ({ b: 'ch', s: 'tor', c: 0xe8e8f0, p: [0, 2.3 + i * .5, .35], sc: [1.3 - i * .12, 1.0, 1.0], r: [1.57, 0, 0] }))]
  }
};

// Mat parçaları iskeletli geometriye gömer: her parça kendi kemiğine tam ağırlıkla bağlanır,
// böylece instanced çizimde ek çizim çağrısı yok. Saydam parçalar attachAcc(..., 1) ile ayrı kalır.
export function bakeAcc(d, specs) {
  const g = d.g, ps = [], ns = [], cs = [], si = [], sw = [], ix = [],
    bi = {};
  d.bones.forEach((b, i) => bi[b.n] = i);
  const root = d.bones.findIndex(b => b.pi < 0);
  const E = new THREE.Euler(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S = new THREE.Vector3(), M = new THREE.Matrix4(), NM = new THREE.Matrix3(), C = new THREE.Color();
  let base = g.attributes.position.count, n = 0;
  for (const s of specs) {
    if (s.op != null && s.op < 1) continue;
    const j = s.b != 'root' && bi[s.b] != null ? bi[s.b] : root,
      src = geo(s.s);
    E.set(s.r ? s.r[0] : 0, s.r ? s.r[1] : 0, s.r ? s.r[2] : 0);
    M.compose(V.set(s.p[0], s.p[1], s.p[2]), Q.setFromEuler(E), S.set(s.sc[0], s.sc[1], s.sc[2]));
    NM.getNormalMatrix(M);
    C.set(s.c);
    const P = src.attributes.position, N = src.attributes.normal, I = src.index, cnt = P.count;
    for (let k = 0; k < cnt; k++) {
      V.fromBufferAttribute(P, k).applyMatrix4(M);
      ps.push(V.x, V.y, V.z);
      V.fromBufferAttribute(N, k).applyMatrix3(NM).normalize();
      ns.push(V.x, V.y, V.z);
      cs.push(C.r, C.g, C.b);
      si.push(j, 0, 0, 0);
      sw.push(1, 0, 0, 0);
    }
    if (I) for (let k = 0; k < I.count; k++) ix.push(base + I.getX(k));else for (let k = 0; k < cnt; k++) ix.push(base + k);
    base += cnt;
    n++;
  }
  if (!n) return;
  const cat = (name, arr, sz) => {
    const old = g.attributes[name].array, out = new Float32Array(old.length + arr.length);
    out.set(old);
    out.set(arr, old.length);
    g.setAttribute(name, new THREE.Float32BufferAttribute(out, sz));
  };
  cat('position', ps, 3);
  cat('normal', ns, 3);
  cat('color', cs, 3);
  cat('skinIndex', si, 4);
  cat('skinWeight', sw, 4);
  const oi = g.index ? Array.from(g.index.array) : [];
  g.setIndex(oi.concat(ix));
  g.computeBoundingSphere();
  g.userData.accN = (g.userData.accN || 0) + n;
}

// u: skInst sonucu ({ g, b, ... }), bones: skData kemik listesi (h konumları), specs: parça listesi
// onlyTr: yalnızca saydam parçalar ve parıltılar (mat parçalar bakeAcc ile geometride)
export function attachAcc(u, bones, specs, onlyTr) {
  if (!specs || !specs.length) return;
  const hb = {};
  for (const b of bones) hb[b.n] = b.h;
  const root = new THREE.Group();
  let rootUsed = 0;
  for (const s of specs) {
    const tr = s.op != null && s.op < 1;
    if (onlyTr && !tr && !s.gl) continue;
    if (onlyTr && !tr && s.gl) {
      // parça geometride; yalnız parıltısı eklenir
      const bone = s.b != 'root' && u.b[s.b] ? u.b[s.b] : null,
        h = bone ? hb[s.b] || [0, 0, 0] : [0, 0, 0];
      glow(s.c, s.gl, bone || root, .7).position.set(s.p[0] - h[0], s.p[1] - h[1], s.p[2] - h[2]);
      if (!bone) rootUsed = 1;
      continue;
    }
    const bone = s.b != 'root' && u.b[s.b] ? u.b[s.b] : null,
      h = bone ? hb[s.b] || [0, 0, 0] : [0, 0, 0],
      m = mk(geo(s.s), mat(s.c, s.op), s.p[0] - h[0], s.p[1] - h[1], s.p[2] - h[2], bone || root);
    m.scale.set(s.sc[0], s.sc[1], s.sc[2]);
    if (s.r) m.rotation.set(s.r[0], s.r[1], s.r[2]);
    m.castShadow = false;
    m.userData.acc = 1;
    if (s.gl) glow(s.c, s.gl, bone || root, .7).position.copy(m.position);
    if (!bone) rootUsed = 1;
  }
  if (rootUsed) u.g.add(root);
  u.acc = 1;
}
