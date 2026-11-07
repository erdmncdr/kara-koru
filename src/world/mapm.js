// world/mapm.js · Kara Koru
// Bu dosya tek dosyalık sürümden (v22) otomatik ayrıldı. Ortak oyun durumu core/store.js içindeki $G nesnesinde.

import { $G } from '../core/store.js';
import { GEO } from '../geo/geo.js';
import { MODELS } from '../geo/models.js';

export let MAPM;

export function __init_6() {
  // ---- harita modelleri: simge yapılar ve süs bitkileri (GEO ile). Yapılar {g, c:[çarpışma/işaret]} döndürür; koordinatlar yapı merkezine, y zemine göredir.
  MAPM = (() => {
    const {
      lathe,
      ellip,
      tube,
      blob,
      slab,
      sheet,
      tf,
      merge,
      paint,
      fbm,
      hex,
      mixc,
      shade,
      loft,
      limb
    } = GEO;
    const P2 = Math.PI / 2,
      at = (g, x, y, z, r, s) => tf(g, {
        t: [x, y, z],
        r,
        s
      });
    let RS = 1;
    const rr = () => {
        RS = RS * 16807 % 2147483647;
        return RS / 2147483647;
      },
      rn = (a, b) => a + rr() * (b - a);
    // taş blok: yuvarlatılmış kutu, gürültülü, üstü yosunlu
    function blk(w, h, d, base, sd, o = {}) {
      const b = Math.min(w, h, d) * (o.bv || .13),
        n = o.n || 4.5,
        g = loft([{
          y: h,
          rx: 0,
          rz: 0
        }, {
          y: h,
          rx: w / 2 - b,
          rz: d / 2 - b,
          n
        }, {
          y: h - b * .35,
          rx: w / 2 - b * .3,
          rz: d / 2 - b * .3,
          n
        }, {
          y: h - b,
          rx: w / 2,
          rz: d / 2,
          n
        }, {
          y: b * .5,
          rx: w / 2,
          rz: d / 2,
          n
        }, {
          y: 0,
          rx: w / 2 - b * .3,
          rz: d / 2 - b * .3,
          n
        }, {
          y: 0,
          rx: 0,
          rz: 0
        }], base, {
          seg: o.seg || 14,
          res: 1,
          disp: (x, y, z) => (o.dn == null ? .05 : o.dn) * fbm(x * 1.2 + sd, y * 1.2, z * 1.2 - sd, 2)
        });
      return paint(g, (x, y, z, c, nx, ny) => {
        let k = .82 + .28 * fbm(x * 2.2 + sd, y * 2.2, z * 2.2, 2),
          col = shade(hex(base), k);
        if (o.moss && ny > .5) col = mixc(col, hex(o.moss), Math.min(1, (ny - .5) * 2.6) * Math.max(0, .35 + .8 * fbm(x * .9 + sd, y, z * .9, 2)));
        if (o.brick) {
          const f = (y * (1 / o.brick) % 1 + 1) % 1;
          if (f < .09) col = shade(col, .72);
        }
        return col;
      });
    }
    const wood = (c, k = 1) => (x, y, z) => shade(hex(c), k * (.8 + .3 * Math.abs(Math.sin((x + z) * 9 + y * 2)) * .6 + .18 * fbm(x * 6, y * 1.5, z * 6, 2)));
    function log(p, q, r, c) {
      return limb([p, [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2], q], [[0, r, r], [1, r * .9, r * .9]], wood(c), {
        rad: 8,
        seg: 2
      });
    }
    function pillar(h, r, c, sd, broken, moss) {
      const g = lathe([[r * 1.05, h], [r * 1.35, h - .05], [r * 1.4, h - .3], [r * .95, h - .38], [r * .88, h * .55], [r, .42], [r * 1.4, .32], [r * 1.45, 0], [0, 0]], (x, y, z) => shade(hex(c), .82 + .25 * fbm(x * 3 + sd, y * 3, z * 3, 2) + .08 * Math.sin(Math.atan2(z, x) * 14)), 14, {
        res: 2,
        disp: broken ? (x, y, z) => y > h * .7 ? .25 * fbm(x * 4 + sd, y * 4, z * 4, 2) : 0 : null
      });
      if (broken) {
        for (let i = 0; i < g.p.length; i += 3) if (g.p[i + 1] > h * .72) g.p[i + 1] = h * .72 + (g.p[i + 1] - h * .72) * .4 + .35 * fbm(g.p[i] * 5 + sd, 0, g.p[i + 2] * 5, 2);
      }
      return moss ? paint(g, (x, y, z, cc, nx, ny) => ny > .5 ? mixc(cc, hex(moss), .6) : cc) : g;
    }
    function stela(h, c, face) {
      return paint(loft([{
        y: h + .28,
        rx: 0,
        rz: 0
      }, {
        y: h + .2,
        rx: .28,
        rz: .16
      }, {
        y: h,
        rx: .46,
        rz: .25,
        n: 3
      }, {
        y: h * .2,
        rx: .5,
        rz: .27,
        n: 3
      }, {
        y: 0,
        rx: .52,
        rz: .28,
        n: 3
      }, {
        y: -.3,
        rx: 0,
        rz: 0
      }], c, {
        seg: 14,
        res: 2,
        disp: (x, y, z) => .04 * fbm(x * 3, y * 3, z * 3, 2)
      }), (x, y, z, cc) => {
        if (face && z > .12) {
          const Y = y - h * .72;
          if (Math.abs(Y - .05) < .04 && Math.abs(Math.abs(x) - .15) < .11 || Math.abs(Y + .08) < .035 && Math.abs(Math.abs(x) - .13) < .05 || Math.abs(Y + .32) < .04 && Math.abs(x) < .2 && Math.abs(x) > .03 || Math.abs(x) < .03 && Y < 0 && Y > -.24) return shade(hex(c), .5);
        }
        return shade(hex(c), .82 + .28 * fbm(x * 3, y * 3, z * 3, 2));
      });
    }
    function fire() {
      const g = [];
      for (let i = 0; i < 8; i++) {
        const a = i / 8 * 6.283;
        g.push(at(blob(.28, 0x5c5a58, {
          amp: .2,
          fr: 3,
          seed: i
        }), Math.cos(a) * .9, .12, Math.sin(a) * .9));
      }
      for (let i = 0; i < 3; i++) {
        const a = i / 3 * 6.283;
        g.push(log([Math.cos(a) * .7, .1, Math.sin(a) * .7], [Math.cos(a + .3) * .1, .45, Math.sin(a + .3) * .1], .12, 0x3a2a1e));
      }
      return paint(merge(g), (x, y, z, c) => Math.hypot(x, z) < .4 ? mixc(c, hex(0x1a1210), .6) : c);
    }
    // ---------- ORMAN
    function temple(o) {
      RS = o.seed || 7;
      const S = 0x7d7c86,
        MO = 0x5a7a3e,
        g = [],
        c = [];
      const tier = (cx, cz, W, y0, y1, nb) => {
        const s = W / nb;
        for (let i = 0; i < nb; i++) for (let j = 0; j < nb; j++) g.push(at(blk(s - .07, y1 - y0 + rn(-.04, .08), s - .07, S, i * 7 + j * 3 + y0, {
          moss: MO,
          bv: .1
        }), cx - W / 2 + s * (i + .5), y0, cz - W / 2 + s * (j + .5)));
        c.push({
          p: [cx, cz, W, W, y1]
        });
      };
      tier(0, 0, 13, 0, 1.7, 3);
      tier(1, -1, 8.5, 1.7, 3.4, 2);
      tier(2, -2, 4.6, 3.4, 5.1, 1);
      const stp = (cx, z0, y0, y1) => {
        for (let k = 1; k <= 2; k++) {
          const h = y0 + (y1 - y0) * k / 3,
            z = z0 + .45 + (2 - k) * .9;
          g.push(at(blk(4, h - y0 + .02, .9, 0x86858e, k + y0, {
            moss: MO,
            bv: .08
          }), cx, y0, z));
          c.push({
            p: [cx, z, 4, .9, h]
          });
        }
      };
      stp(0, 6.5, 0, 1.7);
      stp(1, 3.25, 1.7, 3.4);
      stp(2, .3, 3.4, 5.1);
      [[-5.4, 5.4, 0], [5.4, 5.4, 1], [-5.4, -5.4, 1], [5.4, -5.4, 0]].forEach(([x, z, b], i) => {
        const h = b ? rn(1.2, 1.9) : 2.8;
        g.push(at(pillar(h, .45, 0x8a8994, i, b, MO), x, 1.7, z));
        c.push({
          o: [x, z, .65, 1.7 + h]
        });
      });
      g.push(at(blk(1.6, .7, 1.1, 0x6e6d78, 3, {
        moss: MO
      }), 2, 5.1, -3.4));
      g.push(at(lathe([[.5, .55], [.55, .5], [.35, .15], [.15, 0], [0, 0]], 0x4a4844, 10), 2, 5.8, -3.4));
      c.push({
        fire: [2, 6.25, -3.4]
      });
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * 6.283 + .3,
          x = Math.cos(a) * 6.4,
          z = Math.sin(a) * 6.4;
        if (z > 5) continue;
        g.push(limb([[x, 1.72, z], [x * 1.02, 1.1, z * 1.02], [x * 1.04, .4, z * 1.04]], [[0, .06, .06], [1, .03, .03]], 0x3a5a2a, {
          rad: 5,
          seg: 2
        }));
      }
      c.push({
        rw: [2, -2, 5.1, 'chest']
      }, {
        rw: [-4.5, 3, 1.7, 'pot']
      }, {
        rw: [4.6, -4.5, 1.7, 'pot']
      });
      return {
        g: merge(g),
        c
      };
    }
    function stones(o) {
      RS = o.seed || 11;
      const S = 0x8c8a84,
        g = [],
        c = [];
      const n = 9;
      for (let i = 0; i < n; i++) {
        const a = i / n * 6.283,
          x = Math.cos(a) * 7.5,
          z = Math.sin(a) * 7.5,
          h = rn(2, 2.9);
        g.push(tf(tf(stela(h, S, 1), {
          r: [rn(-.06, .06), 0, rn(-.06, .06)]
        }), {
          r: [0, Math.atan2(-x, -z), 0],
          t: [x, 0, z]
        }));
        c.push({
          o: [x, z, .6, h]
        });
      }
      g.push(lathe([[0, .18], [2.6, .16], [3, .05], [3.1, -.2], [0, -.2]], (x, y, z) => shade(hex(0x77757a), .8 + .25 * fbm(x * 2, y, z * 2, 2) + (Math.abs(Math.hypot(x, z) - 1.8) < .1 ? -.25 : 0)), 24, {
        res: 2
      }));
      c.push({
        sh: [0, 0]
      });
      return {
        g: merge(g),
        c
      };
    }
    function yurt(sd) {
      const fe = 0xd9ccb0,
        rd = 0x8e2a1e,
        bl = 0x2a4a6e,
        wd = 0x6a4a30;
      const wall = lathe([[3, 1.9], [3.06, 1.4], [3.06, .5], [3, 0], [0, 0]], (x, y, z) => {
        const a = Math.atan2(z, x);
        if (y > 1.55 && y < 1.72) return Math.abs(Math.sin(a * 12)) > .6 ? hex(rd) : hex(0xc8a24a);
        if (y < .32) return hex(bl);
        return shade(hex(fe), .86 + .12 * Math.abs(Math.sin(a * 30 + y * 8)) * .5 + .06 * fbm(x * 3, y * 3, z * 3, 2));
      }, 28, {
        res: 2
      });
      const roof = lathe([[.6, 3.4], [.62, 3.36], [1.3, 3.12], [2.3, 2.55], [3.2, 1.92], [3.15, 1.86], [0, 1.86]], (x, y, z) => {
        const a = Math.atan2(z, x);
        if (Math.abs(Math.sin(a * 8)) > .975) return hex(0x8a6a48);
        return shade(hex(fe), .82 + .1 * (y - 2) + .05 * fbm(x * 3, y * 3, z * 3, 2));
      }, 28, {
        res: 2
      });
      const crown = tube([...Array(13)].map((_, i) => {
        const a = i / 12 * 6.283;
        return [Math.cos(a) * .62, 3.42, Math.sin(a) * .62];
      }), Array(13).fill(.07), wd, {
        rad: 6
      });
      const door = at(paint(slab([[-.55, 0], [.55, 0], [.55, 1.55], [-.55, 1.55]], .08, 0xb0502a), (x, y) => Math.abs(x) < .03 || Math.abs(y - .78) < .03 ? hex(0xd8a84a) : shade(hex(0xb0502a), .9 + .2 * Math.sin(x * 20) * Math.sin(y * 20))), 0, 0, 3.04);
      return merge(wall, roof, crown, door);
    }
    function camp(o) {
      RS = o.seed || 13;
      const g = [],
        c = [];
      [0, 1, 2].forEach(i => {
        const a = i / 3 * 6.283 + .5,
          x = Math.cos(a) * 8.6,
          z = Math.sin(a) * 8.6;
        g.push(tf(yurt(i), {
          r: [0, Math.atan2(-x, -z), 0],
          t: [x, 0, z]
        }));
        c.push({
          o: [x, z, 3.25, 3.5]
        }, {
          rw: [x * .62 + Math.cos(a + 1.5) * 2.5, z * .62 + Math.sin(a + 1.5) * 2.5, 0, 'pot']
        });
      });
      g.push(fire());
      c.push({
        fire: [0, .55, 0]
      }, {
        o: [0, 0, 1, .6]
      });
      [0, 1, 2, 3].forEach(i => {
        const a = i / 4 * 6.283 + .25;
        g.push(log([Math.cos(a) * 2.6 - Math.sin(a) * .9, .28, Math.sin(a) * 2.6 + Math.cos(a) * .9], [Math.cos(a) * 2.6 + Math.sin(a) * .9, .28, Math.sin(a) * 2.6 - Math.cos(a) * .9], .26, 0x5a3e28));
      });
      [-1, 1].forEach(s => {
        const x = s * 2.2,
          z = 12;
        g.push(log([x, 0, z], [x, 4.2, z], .09, 0x4a3424), at(ellip(.12, .12, .12, 0xc9a24a), x, 4.3, z), limb([[x, 4.15, z], [x, 3.5, z + .15], [x, 2.6, z + .2]], [[0, .12, .12], [.4, .16, .16], [1, .05, .05]], (xx, yy, zz) => shade(hex(0x8a1a14), .75 + .4 * fbm(xx * 20, yy * 8, zz * 20, 2)), {
          rad: 8,
          seg: 3
        }));
        c.push({
          o: [x, z, .3, 4.2]
        });
      });
      c.push({
        np: [3.5, -2.5]
      });
      return {
        g: merge(g),
        c
      };
    }
    function tower(o) {
      const W = 0x6a4a30,
        D = 0x4a3220,
        g = [],
        c = [],
        L = 1.85,
        T = 7;
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        g.push(log([sx * (L + .25), -.3, sz * (L + .25)], [sx * L * .92, T + 2.1, sz * L * .92], .2, W));
        c.push({
          o: [sx * (L + .1), sz * (L + .1), .35, T]
        });
      }
      for (const s of [-1, 1]) {
        g.push(log([-L, 1, s * L], [L, 4.6, s * L], .09, D), log([L, 1, s * L], [-L, 4.6, s * L], .09, D), log([s * L, 1, -L], [s * L, 4.6, L], .09, D), log([s * L, 1, L], [s * L, 4.6, -L], .09, D));
      }
      g.push(at(paint(blk(4.7, .3, 4.7, 0x7a5a3a, 2, {
        n: 6,
        dn: .02
      }), (x, y, z, cc) => Math.abs((x * 2.2 % 1 + 1) % 1 - .5) > .45 ? shade(cc, .6) : cc), 0, T - .05, 0));
      c.push({
        p: [0, 0, 4.7, 4.7, T + .25, T - .6]
      });
      for (const [x0, z0, x1, z1] of [[-2.2, -2.2, 2.2, -2.2], [-2.2, -2.2, -2.2, 2.2], [2.2, -2.2, 2.2, 2.2]]) g.push(log([x0, T + 1.1, z0], [x1, T + 1.1, z1], .07, D), log([x0, T + .6, z0], [x1, T + .6, z1], .06, D));
      g.push(at(lathe([[0, 1.7], [.3, 1.55], [2.1, .3], [3.3, 0], [3.2, -.1], [0, -.1]], (x, y, z) => shade(hex(0x8a7a4a), .75 + .3 * Math.abs(Math.sin(Math.atan2(z, x) * 20)) * .5 + .1 * y), 4, {
        res: 1
      }), 0, T + 2.2, 0, [0, Math.PI / 4, 0]));
      for (let k = 0; k < 9; k++) {
        const y = .6 + k * .75;
        g.push(log([-.45, y, L + .3], [.45, y, L + .3], .05, D));
      }
      g.push(log([-.45, 0, L + .3], [-.45, T, L + .3], .06, D), log([.45, 0, L + .3], [.45, T, L + .3], .06, D));
      c.push({
        pad: [0, 4.6]
      }, {
        rw: [0, 0, T + .25, 'chest']
      }, {
        fire: [1.6, T + 1.2, -1.6, 1]
      });
      return {
        g: merge(g),
        c
      };
    }
    function bigtree(o) {
      RS = o.seed || 17;
      const g = [],
        c = [],
        bk = (x, y, z) => shade(hex(0x5a4432), .72 + .3 * Math.abs(Math.sin(Math.atan2(z, x) * 9 + y * .4)) * .6 + .15 * fbm(x * 2, y * .5, z * 2, 2));
      g.push(limb([[0, -1, 0], [.3, 4, .2], [-.2, 9, -.3], [.4, 14.5, .2]], [[0, 3, 3], [.2, 2.2, 2.2], [.5, 1.8, 1.8], [1, 1.2, 1.2]], bk, {
        rad: 16,
        seg: 5,
        disp: (x, y, z, u) => .12 * Math.sin(u * 6.283 * 7)
      }));
      for (let i = 0; i < 7; i++) {
        const a = i / 7 * 6.283 + rn(0, .4);
        g.push(limb([[Math.cos(a) * 1.6, 2.2, Math.sin(a) * 1.6], [Math.cos(a) * 3.6, .7, Math.sin(a) * 3.6], [Math.cos(a) * 6.2, -.1, Math.sin(a) * 6.2], [Math.cos(a) * 7.5, -.6, Math.sin(a) * 7.5]], [[0, .95, .95], [.4, .6, .6], [1, .12, .12]], bk, {
          rad: 10,
          seg: 4
        }));
      }
      const br = [];
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * 6.283 + .4,
          h = rn(10, 13.5),
          e = [Math.cos(a) * rn(6, 8), h + rn(2, 4), Math.sin(a) * rn(6, 8)];
        br.push(e);
        g.push(limb([[0, h, 0], [e[0] * .5, h + 1.4, e[2] * .5], e], [[0, .75, .75], [1, .2, .2]], bk, {
          rad: 9,
          seg: 4
        }));
      }
      const lf = (x, y, z, cc, nx, ny) => shade(mixc(hex(0xb88a2a), hex(0xe8c058), .5 + .5 * ny), .8 + .3 * fbm(x * .6, y * .6, z * .6, 2));
      for (let i = 0; i < 8; i++) {
        const a = i / 8 * 6.283,
          rad = i < 1 ? 0 : rn(4, 7);
        g.push(paint(at(blob(rn(4.2, 6), 0xc8a040, {
          amp: .32,
          fr: .5,
          seed: i * 5,
          sy: .72
        }), Math.cos(a) * rad, rn(15.5, 19.5), Math.sin(a) * rad), lf));
      }
      const cols = [0xc8302a, 0x2a6ac8, 0xe8e0d0, 0x3a9a4a, 0xe8b83a];
      for (let i = 0; i < 14; i++) {
        const b = br[i % br.length],
          t = rn(.35, .85),
          x = b[0] * t,
          y = 11 + t * 2.5,
          z = b[2] * t;
        g.push(sheet(1, 4, (u, v) => [x + (u - .5) * .16, y - v * rn(.9, 1.4), z + .06 * Math.sin(v * 4)], cols[i % 5]));
      }
      c.push({
        o: [0, 0, 3, 13]
      }, {
        o: [0, 0, 8, 24, 13.5, 1]
      }, {
        rw: [0, 0, 0, 'chest'],
        ofs: [0, 5.2]
      }, {
        fire: [0, 1.2, 4.4, 2]
      });
      return {
        g: merge(g),
        c
      };
    }
    function wall(o, ds) {
      RS = o.seed || 19;
      const S = ds ? 0xc28a5a : 0x80808a,
        MO = ds ? null : 0x5a7a3e,
        g = [],
        c = [],
        L = rn(9, 12),
        n = Math.round(L / 1.6);
      for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) {
        if (i > n - 3 && k >= n - i - 1) continue;
        if (rr() < .12 && k == 2) continue;
        g.push(at(blk(L / n - .05, .93, 1.35, S, i * 5 + k, {
          moss: MO,
          bv: .12,
          brick: ds ? .31 : 0
        }), -L / 2 + (i + .5) * L / n, k * .93, 0));
      }
      for (let i = 0; i < 5; i++) g.push(at(blob(rn(.3, .6), S, {
        amp: .3,
        fr: 2,
        seed: i,
        flat: 1
      }), L / 2 + rn(-.5, 2), .1, rn(-1.5, 1.5)));
      c.push({
        p: [-(1.6 / 2), 0, L - 1.6 * 2, 1.35, 2.79]
      }, {
        rw: [-L / 4, 0, 2.79, 'pot']
      }, {
        rw: [-L / 2 - 1.5, 1.5, 0, 'pot']
      });
      return {
        g: merge(g),
        c
      };
    }
    function bridge(o, L, top) {
      const W = 0x6a4a30,
        D = 0x4a3220,
        g = [],
        c = [],
        n = Math.round(L / .7);
      for (let i = 0; i < n; i++) {
        const z = -L / 2 + (i + .5) * L / n;
        g.push(at(blk(4.2, .22, L / n - .06, i % 3 ? 0x7a5a3a : 0x6a4c32, i, {
          n: 6,
          dn: .015,
          bv: .2
        }), 0, top - .22, z));
      }
      for (const s of [-1, 1]) {
        g.push(log([s * 2.15, top - .3, -L / 2], [s * 2.15, top - .3, L / 2], .14, D));
        for (let z = -L / 2; z <= L / 2 + .01; z += 2.6) {
          g.push(log([s * 2.15, top - 3.5, z], [s * 2.15, top + 1.15, z], .12, W));
        }
        const rp = [];
        for (let k = 0; k <= 24; k++) {
          const t = k / 24,
            z = -L / 2 + L * t;
          rp.push([s * 2.15, top + 1.05 - .28 * Math.sin(t * Math.PI * Math.ceil(L / 2.6)) ** 2, z]);
        }
        g.push(limb(rp, [[0, .04, .04], [1, .04, .04]], 0xa89a7a, {
          rad: 5,
          seg: 1,
          cap: 0
        }));
      }
      c.push({
        p: [0, 0, 4.3, L, top, top - .8]
      });
      return {
        g: merge(g),
        c
      };
    }
    function pond(o) {
      RS = o.seed || 23;
      const g = [],
        c = [],
        R = o.r;
      for (let i = 0; i < 14; i++) {
        const a = rn(0, 6.283),
          d = rn(.2, .8) * R;
        g.push(at(paint(lathe([[0, .02], [rn(.5, .9), .02], [rn(.5, .9), 0], [0, 0]], 0x3a7a3a, 10), (x, y, z) => Math.atan2(z, x) > 2.6 ? hex(0x2a4a2a) : shade(hex(0x4a8a3a), .85 + .2 * Math.sin(x * 9))), Math.cos(a) * d, .02, Math.sin(a) * d));
      }
      const dk = [R * .7, 0];
      for (let i = 0; i < 7; i++) g.push(at(blk(2.6, .2, .62, 0x7a5a3a, i, {
        n: 6,
        dn: .015
      }), dk[0] + i * .66, .55, 0, [0, P2, 0]));
      for (const s of [-1, 1]) for (let i = 0; i < 3; i++) g.push(log([dk[0] + i * 2, -1.6, s * 1.2], [dk[0] + i * 2, 1.1, s * 1.2], .1, 0x4a3220));
      c.push({
        p: [dk[0] + 2, 0, 4.6, 2.6, .75, -.2]
      }, {
        rw: [dk[0] + 3.8, 0, .75, 'pot']
      });
      return {
        g: merge(g),
        c,
        water: 1
      };
    }
    // ---------- BOZKIR
    function caravan(o) {
      RS = o.seed || 29;
      const A = 0xc89a6a,
        A2 = 0xb07a50,
        g = [],
        c = [],
        H = 4.2,
        T = 1.6,
        Wd = 28,
        h2 = Wd / 2 - T / 2;
      const seg = (x, z, w, d) => {
        const nx = Math.max(1, Math.round(w / 3)),
          nz = Math.max(1, Math.round(d / 3));
        for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) for (let k = 0; k < 2; k++) g.push(at(blk(w / nx - .05, H / 2, d / nz - .05, k ? A : A2, i * 3 + j + k * 7, {
          brick: .35,
          bv: .06,
          dn: .03
        }), x - w / 2 + (i + .5) * w / nx, k * H / 2, z - d / 2 + (j + .5) * d / nz));
        const m = Math.max(w, d),
          cnt = Math.floor(m / 1.6);
        for (let i = 0; i < cnt; i += 2) {
          const t = -m / 2 + (i + .5) * m / cnt;
          g.push(at(blk(.8, .6, .8, A, i, {
            bv: .1
          }), w > d ? x + t : x + (T / 2 - .4) * (i % 4 ? 1 : -1) * 0, H, w > d ? z : z + t));
        }
        c.push({
          p: [x, z, w, d, H]
        });
      };
      seg(0, -h2, Wd, T);
      seg(-h2, 0, T, Wd - 2 * T);
      seg(h2, 0, T, Wd - 2 * T);
      seg(-(Wd / 2 + 2.5) / 2, h2, Wd / 2 - 2.5, T);
      seg((Wd / 2 + 2.5) / 2, h2, Wd / 2 - 2.5, T);
      for (const [x, z] of [[-h2, -h2], [h2, -h2], [-h2, h2], [h2, h2]]) {
        g.push(at(paint(lathe([[2.5, 6.6], [2.5, 6], [2.3, 5.95], [2.3, 0], [0, 0]], (xx, y, zz) => y > 6.05 && Math.sin(Math.atan2(zz, xx) * 8) > 0 ? hex(A) : shade(hex(A), .85 + .08 * Math.sin(y * 18) + .1 * fbm(xx * 2, y * 2, zz * 2, 2)), 16, {
          res: 2,
          disp: (xx, y, zz) => y > 6.05 ? Math.sin(Math.atan2(zz, xx) * 8) > 0 ? 0 : -.25 : 0
        }), (xx, y, zz, cc) => cc), x, 0, z));
        c.push({
          p: [x, z, 4.6, 4.6, 6]
        });
      }
      g.push(limb([[-2.6, H, h2], [-2, H + 1.8, h2], [0, H + 2.5, h2], [2, H + 1.8, h2], [2.6, H, h2]], [[0, .7, .55], [1, .7, .55]], A, {
        rad: 8,
        seg: 4,
        n: 4,
        fwd: [0, 0, 1]
      }));
      for (let k = 1; k <= 7; k++) {
        const x = -9 + k * 1.05,
          h = k * .6;
        g.push(at(blk(1.05, h, 1.6, A2, k, {
          bv: .08,
          brick: .35
        }), x, 0, -h2 + T));
        c.push({
          p: [x, -h2 + T, 1.05, 1.6, h]
        });
      }
      g.push(lathe([[1.1, .9], [1.25, .85], [1.25, 0], [0, 0]], (x, y, z) => shade(hex(A2), .85 + .15 * Math.sin(Math.atan2(z, x) * 10)), 16, {
        res: 1
      }));
      g.push(at(ellip(1, .05, 1, 0x1a2a3a), 0, .82, 0));
      c.push({
        o: [0, 0, 1.3, 1]
      });
      c.push({
        rw: [h2, -h2, 6, 'chest']
      }, {
        rw: [-6, 6, 0, 'pot']
      }, {
        rw: [6, 6, 0, 'pot']
      }, {
        rw: [6, -6, 0, 'pot']
      }, {
        rw: [-8, -5, 0, 'pot']
      }, {
        np: [-5, 3]
      });
      return {
        g: merge(g),
        c
      };
    }
    function kurgan(o) {
      RS = o.seed || 31;
      const g = [],
        c = [];
      for (let i = 0; i < 12; i++) {
        const a = i / 12 * 6.283,
          x = Math.cos(a) * 14,
          z = Math.sin(a) * 14;
        g.push(at(blob(rn(.7, 1.1), 0x8a6a58, {
          amp: .3,
          fr: 2,
          seed: i,
          flat: .8
        }), x, o.rimY ? o.rimY[i] : 0, z));
        c.push({
          o: [x, z, 1, 1.5]
        });
      }
      g.push(at(stela(2.6, 0x9a7a68, 1), 0, o.topY || 6.5, 0));
      c.push({
        o: [0, 0, .6, (o.topY || 6.5) + 2.6]
      }, {
        rw: [0, 1.6, o.topY || 6.5, 'chest'],
        gnd: 1
      });
      return {
        g: merge(g),
        c,
        abs: 1
      };
    }
    function skeleton(o) {
      const B = 0xd8cdb2,
        g = [],
        c = [],
        bc = (x, y, z) => shade(hex(B), .82 + .2 * fbm(x * 2, y * 2, z * 2, 2));
      for (let x = -11; x <= 12; x += 1.5) g.push(at(blob(.75, bc, {
        amp: .2,
        fr: 2,
        seed: x * 3,
        sx: .8,
        sy: 1,
        sz: 1.1
      }), x, 6.2 + Math.sin(x * .15) * .3, 0));
      g.push(limb([[-11, 6.1, 0], [-14, 4, 0], [-17, 1.5, 0], [-20, .2, 0]], [[0, .6, .6], [1, .15, .15]], bc, {
        rad: 8,
        seg: 5
      }));
      for (let x = -7; x <= 7; x += 2.3) for (const s of [-1, 1]) g.push(limb([[x, 6.1, s * .5], [x + .2, 6, s * 3.2], [x + .5, 4.2, s * 5.4], [x + .6, 1.6, s * 6.2], [x + .4, -.4, s * 6]], [[0, .42, .42], [.5, .32, .32], [1, .2, .2]], bc, {
        rad: 8,
        seg: 4
      })), c.push({
        o: [x + .4, s * 6, .55, 2]
      });
      g.push(at(blob(3, (x, y, z) => {
        const d = Math.hypot(z - 1.3, y - .6),
          d2 = Math.hypot(z + 1.3, y - .6);
        if (x > 1.5 && (d < .7 || d2 < .7)) return hex(0x1a1410);
        return bc(x, y, z);
      }, {
        amp: .12,
        fr: 1,
        seed: 3,
        sx: 1.25,
        sy: .9,
        sz: .9
      }), 15, 4.6, 0));
      for (const s of [-1, 1]) g.push(limb([[14, 6.5, s * 1.4], [13, 8.5, s * 2.6], [11.5, 9.6, s * 2.4], [10.5, 9.2, s * 1.8]], [[0, .45, .45], [1, .08, .08]], bc, {
        rad: 8,
        seg: 4
      }), limb([[17.2, 2.8, s * .9], [18.5, 2.3, s * 1.1], [19.2, 3.2, s * 1]], [[0, .22, .22], [1, .04, .04]], bc, {
        rad: 6,
        seg: 3
      }));
      c.push({
        o: [15, 0, 3.4, 7]
      }, {
        p: [0, 0, 22, 1.6, 6.9, 5.6]
      }, {
        pad: [-14, 2.5]
      }, {
        rw: [0, 0, 0, 'chest'],
        ofs: [0, 3]
      }, {
        rw: [17, 4, 0, 'pot']
      }, {
        rw: [16, -4.5, 0, 'pot']
      }, {
        rw: [-4, 0, 6.9, 'pot']
      });
      return {
        g: merge(g),
        c
      };
    }
    function palm(sd) {
      RS = sd * 7 + 3;
      const g = [],
        h = rn(6, 8.5),
        lean = rn(.6, 1.6),
        tr = [];
      for (let i = 0; i <= 6; i++) {
        const t = i / 6;
        tr.push([lean * t * t, h * t, 0]);
      }
      g.push(limb(tr, [[0, .32, .32], [1, .2, .2]], (x, y, z) => shade(hex(0x7a5a3a), Math.abs((y * 2.6 % 1 + 1) % 1 - .5) < .12 ? .65 : 1), {
        rad: 8,
        seg: 3
      }));
      const top = tr[6];
      for (let i = 0; i < 8; i++) {
        const a = i / 8 * 6.283 + rn(0, .3),
          L = rn(2.6, 3.4);
        g.push(sheet(8, 2, (u, v) => {
          const t = u,
            w = (v - .5) * .55 * Math.sin(t * Math.PI) * 1.4;
          return [top[0] + Math.cos(a) * L * t - Math.sin(a) * w, top[1] + .6 * t - 1.8 * t * t + .1 * Math.abs(w), top[2] + Math.sin(a) * L * t + Math.cos(a) * w];
        }, (x, y, z, u, v) => shade(hex(0x4a7a2a), .8 + .3 * u + .1 * Math.abs(Math.sin(u * 30)))));
      }
      g.push(at(ellip(.35, .3, .35, 0x5a4a2a), top[0], top[1] - .1, top[2]));
      return merge(g);
    }
    function oasis(o) {
      RS = o.seed || 37;
      const g = [],
        c = [];
      for (let i = 0; i < 8; i++) {
        const a = i / 8 * 6.283 + rn(-.2, .2),
          d = o.r * rn(1.05, 1.25),
          x = Math.cos(a) * d,
          z = Math.sin(a) * d;
        g.push(at(tf(palm(i), {
          r: [0, rn(0, 6.28), 0]
        }), x, 0, z));
        c.push({
          o: [x, z, .45, 7],
          yr: 1
        });
      }
      for (let i = 0; i < 2; i++) {
        const a = i * 3.1 + .8,
          x = Math.cos(a) * (o.r + 5),
          z = Math.sin(a) * (o.r + 5);
        g.push(at(sheet(4, 4, (u, v) => [(u - .5) * 3.6, 2.6 - .25 * Math.sin(u * Math.PI) + (v - .5) * .6, (v - .5) * 3.2], (x2, y, z2, u, v) => Math.floor(u * 6) % 2 ? hex(0xc8a060) : hex(0x8a3a24)), x, 0, z), ...[[-1.7, -1.5], [1.7, -1.5], [-1.7, 1.5], [1.7, 1.5]].map(([a2, b2]) => log([x + a2, 0, z + b2], [x + a2, 2.5, z + b2], .06, 0x5a4030)));
        c.push({
          o: [x, z, 2, 2.6],
          yr: 1
        });
      }
      c.push({
        np: [o.r + 6, 0]
      }, {
        rw: [-(o.r + 4), 2, 0, 'pot']
      }, {
        rw: [0, o.r + 4, 0, 'pot']
      });
      return {
        g: merge(g),
        c,
        water: 1
      };
    }
    function obelisk(o) {
      RS = o.seed || 41;
      const g = [],
        c = [];
      for (let i = 0; i < 3; i++) {
        const a = i / 3 * 6.283 + .5,
          x = Math.cos(a) * 5,
          z = Math.sin(a) * 5,
          h = rn(8, 11);
        g.push(at(loft([{
          y: h + 1.1,
          rx: 0,
          rz: 0,
          n: 8
        }, {
          y: h,
          rx: .62,
          rz: .62,
          n: 8
        }, {
          y: h - .02,
          rx: .68,
          rz: .68,
          n: 8
        }, {
          y: .4,
          rx: .95,
          rz: .95,
          n: 8
        }, {
          y: .4,
          rx: 1.25,
          rz: 1.25,
          n: 8
        }, {
          y: 0,
          rx: 1.3,
          rz: 1.3,
          n: 8
        }, {
          y: 0,
          rx: 0,
          rz: 0
        }], (xx, y, zz) => y > h ? hex(0xd8b04a) : (y * 1.3 % 1 + 1) % 1 < .12 && y > 1 ? shade(hex(0x8a5a40), .7) : shade(hex(0xb07a52), .85 + .15 * fbm(xx * 2, y * 2, zz * 2, 2)), {
          seg: 16,
          res: 1
        }), x, 0, z, [0, a, 0]));
        c.push({
          o: [x, z, 1.2, h]
        });
      }
      c.push({
        sh: [0, 0]
      });
      return {
        g: merge(g),
        c
      };
    }
    function mesa(o) {
      RS = o.seed || 43;
      const g = [],
        c = [],
        top = o.topY || 12;
      for (let i = 0; i < 3; i++) {
        const a = i / 3 * 6.283 + rn(0, 1),
          d = o.r * .45;
        g.push(at(pillar(rn(1.4, 3), .45, 0xb07a52, i, i > 0), Math.cos(a) * d, top, Math.sin(a) * d));
        c.push({
          o: [Math.cos(a) * d, Math.sin(a) * d, .6, top + 3]
        });
      }
      for (let i = 0; i < 2; i++) {
        const a = i * 3.14 + rn(0, 1),
          d = o.r + 3.5;
        c.push({
          pad: [Math.cos(a) * d, Math.sin(a) * d]
        });
      }
      c.push({
        rw: [0, 0, top, 'chest'],
        gnd: 1
      });
      return {
        g: merge(g),
        c,
        abs: 1
      };
    }
    // ---------- sunaklar ve sıçrama pedi
    function shrine(t, ds) {
      const S = ds ? 0xb07a52 : 0x7d7c86,
        D = ds ? 0x8a5a40 : 0x5e5d68,
        MO = ds ? null : 0x5a7a3e,
        g = [];
      RS = t * 31 + 7;
      if (t == 0 || t == 5) {
        const SC = t == 5 ? 0xc9a24a : S;
        for (let i = 0; i < 7; i++) {
          const a = i / 7 * 6.283;
          g.push(at(blob(.42, SC, {
            amp: .25,
            fr: 2,
            seed: i + t * 9,
            sy: 1.3
          }), Math.cos(a) * 1.4, .35, Math.sin(a) * 1.4));
        }
        g.push(lathe([[0, .9], [.45, .88], [.55, .75], [.4, .6], [.45, .1], [.7, 0], [0, 0]], (x, y, z) => Math.abs(y - .75) < .06 ? hex(t == 5 ? 0xffd36a : 0x9fe8d8) : shade(hex(SC), .85 + .2 * fbm(x * 3, y * 3, z * 3, 2)), 14, {
          res: 2
        }));
      }
      if (t == 1) g.push(stela(3.2, S, 1), at(blk(1.5, .35, 1, D, 1, {
        moss: MO
      }), 0, -.05, 0));
      if (t == 2) {
        g.push(pillar(4, .32, S, 2, 0, MO));
        for (let i = 0; i < 3; i++) {
          const a = i / 3 * 6.283;
          g.push(limb([...Array(9)].map((_, k) => {
            const tt = k / 8,
              aa = a + tt * 5;
            return [Math.cos(aa) * .55, .6 + tt * 3.4, Math.sin(aa) * .55];
          }), [[0, .05, .05], [1, .02, .02]], 0xd8e8f0, {
            rad: 5,
            seg: 2
          }));
        }
      }
      if (t == 3) {
        g.push(blk(2.4, 1, 1.6, 0x3a3530, 3, {
          bv: .1
        }), at(blk(2.1, .1, 1.3, 0x6c1a14, 4, {
          bv: .2,
          dn: .01
        }), 0, 1, 0));
        for (const s of [-1, 1]) g.push(limb([[s * 1.1, .9, 0], [s * 1.6, 1.6, .1], [s * 1.5, 2.3, -.2]], [[0, .12, .12], [1, .02, .02]], 0xd8cdb2, {
          rad: 6,
          seg: 3
        }));
      }
      if (t == 4) {
        for (let i = 0; i < 9; i++) {
          const a = rn(0, 6.28),
            r = rn(0, .9);
          g.push(at(blob(rn(.25, .45), i % 3 ? 0xc9a24a : 0x8a6a3a, {
            amp: .2,
            fr: 2,
            seed: i
          }), Math.cos(a) * r, .2 + rn(0, .5), Math.sin(a) * r));
        }
        g.push(at(lathe([[.3, 1.3], [.42, 1.2], [.55, .8], [.45, .3], [.5, 0], [0, 0]], 0xb08a3a, 12, {
          res: 2
        }), 0, .2, 0));
      }
      // kara sunak: kan örtülü siyah taş, boynuzlar, kafatası, mumlar
      if (t == 6) {
        g.push(blk(2.4, 1.05, 1.6, 0x2a2428, 8, {
          bv: .1
        }), at(blk(2.7, .14, 1.9, 0x1a1618, 9, {
          bv: .15
        }), 0, -.08, 0), at(blk(2.2, .08, 1.4, 0x7a1420, 10, {
          bv: .2,
          dn: .01
        }), 0, 1.05, 0));
        for (const s of [-1, 1]) {
          g.push(limb([[s * 1, 1.05, 0], [s * 1.5, 1.7, .15], [s * 1.35, 2.5, -.1], [s * 1, 2.9, -.25]], [[0, .13, .13], [1, .02, .02]], 0x2a2224, {
            rad: 6,
            seg: 3
          }));
          g.push(at(lathe([[.07, .5], [.08, 0], [0, 0]], 0xd8cdb2, 8), s * .85, 1.12, .45), at(ellip(.05, .09, .05, 0xffb050), s * .85, 1.7, .45));
        }
        g.push(at(bones(1), 0, 1.12, -.2));
      }
      // haydut taşı: kayaya saplanmış çapraz kılıçlar, kara sancak, at kılı püskül
      if (t == 7) {
        g.push(at(blob(1, 0x4a4852, {
          amp: .3,
          fr: 1.6,
          seed: 21,
          sy: .6
        }), 0, .15, 0));
        for (const s of [-1, 1]) g.push(limb([[s * -.55, .55, .1], [s * .15, 1.6, .18], [s * .75, 2.6, .24]], [[0, .07, .018], [.92, .05, .014], [1, .006, .006]], 0xc8ced6, {
          rad: 4,
          seg: 3
        }), limb([[s * -.62, .45, .09], [s * -.85, .08, .06]], [[0, .045, .045], [1, .04, .04]], 0x3a2a1e, {
          rad: 5,
          seg: 1
        }), at(blk(.34, .07, .14, 0x8a6a3a, 13 + s, {
          bv: .3
        }), s * -.58, .52, .1, [0, 0, s * .83]));
        g.push(limb([[.05, 0, -.35], [0, 2, -.4], [-.05, 4.3, -.42]], [[0, .07, .07], [1, .05, .05]], 0x3a2a1e, {
          rad: 6,
          seg: 2
        }));
        g.push(paint(at(slab([[0, 0], [1.5, -.12], [1.25, -.5], [1.55, -.85], [1.2, -1.15], [0, -1.05]], .03, 0x16161a), .02, 4.15, -.42), (x, y, z, c) => y > 3.91 && y < 4.03 ? hex(0x7a1c16) : c));
        for (let k = 0; k < 7; k++) {
          const a = k / 7 * 6.283;
          g.push(limb([[0, 4.2, -.42], [Math.cos(a) * .18, 3.6, -.42 + Math.sin(a) * .18], [Math.cos(a) * .24, 3.2, -.42 + Math.sin(a) * .24]], [[0, .04, .04], [1, .012, .012]], 0x1e1a18, {
            rad: 4,
            seg: 2
          }));
        }
        g.push(at(blob(.14, 0xc8a24a, {
          amp: .1,
          fr: 2,
          seed: 3
        }), -.05, 4.35, -.42));
      }
      // ab-ı hayat pınarı: taş havuz, su, yosun, yazıtlı taş
      if (t == 8) {
        g.push(lathe([[1.42, .74], [1.62, .74], [1.68, .1], [1.8, 0], [0, 0]], (x, y, z) => shade(hex(S), .82 + .22 * fbm(x * 3, y * 3, z * 3, 2)), 20, {
          res: 2
        }), at(ellip(1.42, .04, 1.42, 0x3ab0d8), 0, .64, 0), at(stela(2.2, S, 5), 0, 0, -2));
        for (let i = 0; i < 7; i++) {
          const a = i / 7 * 6.283;
          g.push(at(blob(.24, ds ? 0x8a7a4a : 0x5a7a3e, {
            amp: .3,
            fr: 2,
            seed: i
          }), Math.cos(a) * 1.8, .12, Math.sin(a) * 1.8));
        }
      }
      return merge(g);
    }
    // altın damarı: altın lekeli kaya ve külçeler
    function ore(ds) {
      const g = [paint(blob(1, ds ? 0x8a5a46 : 0x6e6c74, {
        amp: .4,
        fr: 1.5,
        seed: 5,
        flat: .6,
        sy: .75,
        oct: 3,
        ws: 10,
        hs: 7
      }), (x, y, z, c) => {
        const v = fbm(x * 3.2 + 7, y * 3.2, z * 3.2, 2);
        return v > .3 ? hex(0xe2b04a) : v > .24 ? hex(0xa07a32) : c;
      })];
      RS = 77;
      for (let i = 0; i < 3; i++) {
        const a = rn(0, 6.28),
          r = rn(.8, 1.2);
        g.push(at(blob(rn(.12, .2), 0xe8b84a, {
          amp: .3,
          fr: 2,
          seed: i,
          ws: 8,
          hs: 6
        }), Math.cos(a) * r, rn(.05, .3), Math.sin(a) * r));
      }
      return merge(g);
    }
    function padG(ds) {
      const S = ds ? 0xb07a52 : 0x76747e;
      return lathe([[0, .36], [1.25, .36], [1.45, .3], [1.6, .12], [1.65, 0], [0, 0]], (x, y, z) => {
        const r = Math.hypot(x, z);
        if (y > .3 && r > .7 && r < 1.25 && Math.abs(Math.sin(Math.atan2(z, x) * 6)) > .5) return hex(0x9fe8d8);
        return shade(hex(S), .82 + .25 * fbm(x * 3, y * 3, z * 3, 2));
      }, 24, {
        res: 2
      });
    }
    // ---------- kapı (boss geçidi)
    function gate(ds) {
      const S = ds ? 0xb07a52 : 0x76747e,
        D = ds ? 0x8a5a40 : 0x5c5a66,
        g = [];
      for (const s of [-1, 1]) {
        for (let k = 0; k < 4; k++) g.push(at(blk(1.9 - k * .08, 2.1, 1.9 - k * .08, k % 2 ? S : D, k + s * 5, {
          bv: .12,
          moss: ds ? null : 0x5a7a3e
        }), s * 4.4, k * 2.12, 0));
        g.push(at(blk(2.5, .6, 2.5, D, s, {
          bv: .15
        }), s * 4.4, 0, 0));
      }
      g.push(limb([[-5.2, 8.7, 0], [-2.6, 9.7, 0], [0, 10.1, 0], [2.6, 9.7, 0], [5.2, 8.7, 0]], [[0, .75, 1.1], [.5, .85, 1.15], [1, .75, 1.1]], (x, y, z) => shade(hex(S), .85 + .2 * fbm(x * 2, y * 2, z * 2, 2)), {
        rad: 10,
        seg: 4,
        n: 4,
        fwd: [0, 1, 0]
      }));
      for (const s of [-1, 1]) for (let k = 0; k < 3; k++) g.push(at(slab([[-.22, 0], [.22, 0], [.12, .35], [-.12, .35]], .05, 0x3a1a14), s * 4.4, 2.4 + k * 1.6, .98));
      return merge(g);
    }
    // ---------- sandık
    function chest(kind) {
      const W = kind == 2 ? 0x8a6a2a : kind == 1 ? 0x4a4e56 : 0x6b4a2b,
        M = kind == 2 ? 0xe2b85a : kind == 1 ? 0x9aa3ad : 0x3a3a40,
        g = [];
      g.push(paint(blk(2, 1, 1.3, W, kind, {
        n: 6,
        bv: .08,
        dn: .02
      }), (x, y, z, c) => Math.abs((x * 3 % 1 + 1) % 1 - .5) > .46 ? shade(c, .7) : c));
      g.push(paint(at(loft([{
        y: .65,
        rx: 0,
        rz: 0
      }, {
        y: .64,
        rx: 1.0,
        rz: .4,
        n: 6
      }, {
        y: .45,
        rx: 1.02,
        rz: .6,
        n: 6
      }, {
        y: .1,
        rx: 1.03,
        rz: .66,
        n: 6
      }, {
        y: 0,
        rx: 1.02,
        rz: .66,
        n: 6
      }, {
        y: 0,
        rx: 0,
        rz: 0
      }], W, {
        seg: 20,
        res: 2
      }), 0, 1, 0), (x, y, z, c, nx, ny) => Math.abs(x) > .86 || Math.abs(x) < .12 ? hex(M) : shade(hex(W), .85 + .2 * ny)));
      for (const s of [-.86, .86]) g.push(at(blk(.2, 1.02, 1.36, M, s, {
        n: 6,
        bv: .15,
        dn: 0
      }), s, 0, 0));
      g.push(at(blk(.34, .42, .12, M, 3, {
        n: 4,
        bv: .2,
        dn: 0
      }), 0, .72, .66));
      return merge(g);
    }
    // ---------- süs bitkileri ve parçalar
    function flower(sd) {
      RS = sd * 13 + 5;
      const c = [0xe8d84a, 0xe86a8a, 0x8a6ae8, 0xf0f0f0, 0xe8803a][sd % 5],
        g = [];
      for (let i = 0; i < 5; i++) {
        const a = rn(0, 6.28),
          d = rn(0, .35),
          x = Math.cos(a) * d,
          z = Math.sin(a) * d,
          h = rn(.25, .5);
        g.push(limb([[x, 0, z], [x, h, z]], [[0, .012, .012], [1, .01, .01]], 0x3a6a2a, {
          rad: 4,
          seg: 1,
          cap: 0
        }), at(ellip(.07, .035, .07, c), x, h, z), at(ellip(.025, .03, .025, 0xe8c83a), x, h + .025, z));
      }
      return merge(g);
    }
    function mushroom(sd) {
      RS = sd * 17 + 1;
      const g = [],
        glow = sd % 2;
      for (let i = 0; i < 3; i++) {
        const x = rn(-.3, .3),
          z = rn(-.3, .3),
          s = rn(.6, 1.2);
        g.push(at(lathe([[.06, .3], [.05, .15], [.07, 0], [0, 0]], 0xe0d8c8, 8), x, 0, z, 0, s), at(lathe([[0, .46], [.16, .42], [.24, .33], [.22, .3], [0, .31]], (xx, y, zz) => glow ? hex(0x6ae8c8) : Math.sin(xx * 40) * Math.sin(zz * 40) > .6 ? hex(0xf0e8d8) : hex(0xb83a2a), 10), x, 0, z, 0, s));
      }
      return merge(g);
    }
    function fern(sd) {
      RS = sd * 19 + 7;
      const g = [];
      for (let i = 0; i < 7; i++) {
        const a = i / 7 * 6.283 + rn(0, .4),
          L = rn(.6, 1);
        g.push(sheet(6, 1, (u, v) => {
          const w = (v - .5) * .22 * Math.sin(u * Math.PI);
          return [Math.cos(a) * L * u - Math.sin(a) * w, .55 * u - .45 * u * u, Math.sin(a) * L * u + Math.cos(a) * w];
        }, (x, y, z, u) => shade(hex(0x3a6a2a), .75 + .4 * u)));
      }
      return merge(g);
    }
    function fallen(sd) {
      RS = sd * 23 + 3;
      const L = rn(5, 8),
        g = [log([-L / 2, .45, 0], [L / 2, .4, 0], .45, 0x5a4432)];
      g.push(at(ellip(.45, .45, .06, 0x8a6a48), L / 2, .4, 0, [0, P2, 0]));
      for (let i = 0; i < 3; i++) g.push(at(blob(.25, 0x4a7a3a, {
        amp: .4,
        fr: 3,
        seed: i
      }), rn(-L / 3, L / 3), .85, rn(-.2, .2)));
      return {
        g: merge(g),
        L
      };
    }
    function stump(sd) {
      return merge(limb([[0, 0, 0], [0, .7, 0]], [[0, .55, .55], [1, .45, .45]], wood(0x5a4432), {
        rad: 10,
        seg: 1
      }), at(ellip(.45, .04, .45, (x, y, z) => Math.sin(Math.hypot(x, z) * 40) > 0 ? hex(0xa8865a) : hex(0x8a6a48)), 0, .7, 0));
    }
    function tumble(sd) {
      RS = sd * 29 + 1;
      const g = [];
      for (let i = 0; i < 22; i++) {
        const a = rn(0, 6.28),
          b = rn(-1.4, 1.4),
          p = [Math.cos(a) * Math.cos(b) * .7, Math.sin(b) * .7, Math.sin(a) * Math.cos(b) * .7],
          q = [-p[0] * .6 + rn(-.2, .2), -p[1] * .6 + rn(-.2, .2), -p[2] * .6 + rn(-.2, .2)];
        g.push(limb([p, [(p[0] + q[0]) / 2 + rn(-.2, .2), (p[1] + q[1]) / 2 + rn(-.2, .2), (p[2] + q[2]) / 2], q], [[0, .025, .025], [1, .015, .015]], 0x9a7a4a, {
          rad: 4,
          seg: 2,
          cap: 0
        }));
      }
      return merge(g);
    }
    function bones(sd) {
      RS = sd * 31 + 9;
      const B = 0xd8cdb2,
        g = [];
      for (let i = 0; i < 4; i++) {
        const a = rn(0, 6.28),
          x = rn(-.8, .8),
          z = rn(-.8, .8);
        g.push(limb([[x - Math.cos(a) * .5, .08, z - Math.sin(a) * .5], [x + Math.cos(a) * .5, .08, z + Math.sin(a) * .5]], [[0, .07, .07], [.5, .05, .05], [1, .07, .07]], B, {
          rad: 6,
          seg: 2
        }));
      }
      if (sd % 2) g.push(at(blob(.35, (x, y, z) => x > .15 && Math.abs(Math.abs(z) - .13) < .08 && y > 0 ? hex(0x1a1410) : hex(B), {
        amp: .08,
        fr: 2,
        seed: sd,
        sx: 1.3,
        sz: 1
      }), 0, .25, 0), limb([[-.1, .3, .3], [-.4, .6, .55], [-.7, .7, .45]], [[0, .07, .07], [1, .015, .015]], B, {
        rad: 6,
        seg: 2
      }), limb([[-.1, .3, -.3], [-.4, .6, -.55], [-.7, .7, -.45]], [[0, .07, .07], [1, .015, .015]], B, {
        rad: 6,
        seg: 2
      }));
      return merge(g);
    }
    function reed(sd) {
      RS = sd * 37 + 3;
      const g = [];
      for (let i = 0; i < 9; i++) {
        const x = rn(-.4, .4),
          z = rn(-.4, .4),
          h = rn(1, 1.8),
          bx = rn(-.15, .15);
        g.push(limb([[x, 0, z], [x + bx * .5, h * .6, z], [x + bx, h, z]], [[0, .025, .025], [1, .008, .008]], 0x6a8a3a, {
          rad: 4,
          seg: 2,
          cap: 0
        }));
        if (i % 3 == 0) g.push(at(ellip(.04, .16, .04, 0x5a3a20), x + bx * .8, h * .85, z));
      }
      return merge(g);
    }
    function crystal(sd) {
      RS = sd * 41 + 2;
      const g = [];
      for (let i = 0; i < 5; i++) {
        const a = rn(0, 6.28),
          t = rn(.2, .6),
          h = rn(.8, 1.8);
        g.push(tf(loft([{
          y: h,
          rx: 0,
          rz: 0,
          n: 2
        }, {
          y: h * .8,
          rx: .16,
          rz: .16
        }, {
          y: 0,
          rx: .2,
          rz: .2
        }, {
          y: -.1,
          rx: 0,
          rz: 0
        }], (x, y, z) => mixc(hex(0x4ab8a8), hex(0xc8fff0), y / h), {
          seg: 6,
          res: 1
        }), {
          r: [Math.cos(a) * t, 0, Math.sin(a) * t],
          t: [Math.cos(a) * .25, 0, Math.sin(a) * .25]
        }));
      }
      return merge(g);
    }

    // kurgan mezarı: toprak tümsek, balbal mezar taşı, sunu çömleği, kemik ve mum
    function grave(ds, i) {
      RS = i * 41 + 7;
      const g = [],
        earth = ds ? 0x9a6a48 : 0x5a4632,
        stone = ds ? 0xb08a6a : 0x8a8478;
      g.push(at(blob(1.25, (x, y, z) => shade(hex(earth), .75 + .35 * fbm(x * 3, y * 3, z * 3, 2)), {
        sx: 1.05,
        sy: .26,
        sz: .8,
        amp: .12,
        fr: 3
      }), 0, -.05, .45));
      g.push(at(paint(stela(1.5, stone, 0), (x, y, z, c) => {
        const f = Math.abs(x) < .28 && y > .5 && y < 1.4 && z > .18,
          l = f && (Math.abs((y * 6 % 1 + 1) % 1 - .5) < .12 || Math.abs(x) < .03);
        return l ? shade(hex(stone), .5) : c;
      }), 0, 0, -.75, null, [1.05, 1.05, 1.05]));
      for (const [x, z, s] of [[-1.25, .2, .8], [1.3, -.2, .65], [1.1, 1.1, .5]]) g.push(at(lathe([[0, .38], [.12, .36], [.2, .25], [.22, .1], [.15, 0], [0, 0]], (x2, y, z2) => shade(hex(0x8a5a32), .8 + .4 * y), 10, {
        res: 2
      }), x, 0, z, null, [s * 1.6, s * 1.6, s * 1.6]));
      for (let k = 0; k < 3; k++) {
        const x = rn(-.6, .6);
        g.push(at(lathe([[0, .32], [.035, .32], [.04, 0], [0, 0]], 0xe8dcc0, 8, {
          res: 1
        }), x, .0, -.35 + rn(-.1, .1)));
      }
      g.push(at(limb([[-.5, .22, 1.0], [.4, .25, 1.15]], [[0, .05, .05], [1, .04, .04]], 0xd8cdb2, {
        rad: 6,
        seg: 2
      }), 0, 0, 0));
      g.push(at(ellip(.12, .1, .14, 0xd8cdb2), .5, .26, 1.17));
      return {
        g: merge(g),
        c: [{
          o: [0, -.9, .6, 1.8]
        }]
      };
    }
    // kös davulu: büyük savaş davulu, ayaklık, kızıl kurdeleler, tokmaklar
    function kos(ds) {
      RS = 77;
      const g = [],
        wd = 0x5a3a22,
        sk = 0xd8c8a0,
        rd = 0x9a2a22,
        br = 0xb08a3a;
      const body = lathe([[0, .95], [.95, .95], [1.0, .9], [1.1, .55], [1.12, .0], [1.1, -.55], [1.0, -.9], [.95, -.95], [0, -.95]], (x, y, z) => {
        const r = Math.hypot(x, z);
        if (Math.abs(y) > .92) return r < .9 ? shade(hex(sk), .92 + .1 * fbm(x * 4, y, z * 4, 2)) : hex(br);
        const a = Math.atan2(z, x);
        return Math.abs((a * 12 / Math.PI % 1 + 1) % 1 - .5) < .05 ? hex(br) : shade(hex(rd), .75 + .2 * fbm(x * 3, y * 3, z * 3, 2));
      }, 20, {
        res: 3
      });
      g.push(at(body, 0, 1.55, 0, [.25, 0, 0]));
      for (let k = 0; k < 3; k++) {
        const a = k / 3 * 6.283 + .5;
        g.push(limb([[Math.cos(a) * 1.25, 0, Math.sin(a) * 1.25], [Math.cos(a) * .8, 1.0, Math.sin(a) * .8], [Math.cos(a) * .65, 1.2, Math.sin(a) * .65]], [[0, .07, .07], [1, .06, .06]], wd, {
          rad: 7,
          seg: 3
        }));
      }
      for (const s of [-1, 1]) g.push(limb([[s * .5, 2.3, .9], [s * .8, 2.05, 1.3]], [[0, .04, .04], [1, .035, .035]], wd, {
        rad: 6,
        seg: 2
      }), at(ellip(.11, .11, .11, sk), s * .82, 2.03, 1.33));
      for (let k = 0; k < 5; k++) {
        const a = k / 5 * 6.283;
        g.push(sheet(2, 6, (u, v) => [Math.cos(a) * 1.12 + (u - .5) * .1, 1.2 - v * .7, Math.sin(a) * 1.12 * .97 + .06 * v], (x, y, z, u, v) => shade(hex(k % 2 ? rd : 0xe2b04a), 1 - .3 * v)));
      }
      return {
        g: merge(g),
        c: [{
          o: [0, 0, 1.35, 2.6]
        }]
      };
    }
    // ---------- MEZARLIK: mezar taşları, demir parmaklık, fener, türbe (hepsi instanced, y zemine göre)
    const mossy = (c, moss = 0x3e5a3a, k = 1) => (x, y, z) => shade(mixc(hex(c), hex(moss), Math.max(0, .6 - y * .5 * k) * Math.max(0, fbm(x * 4, y * 4, z * 4, 2) + .35)), .8 + .3 * fbm(x * 5, y * 5, z * 5, 2));
    function tomb(v) {
      RS = v * 53 + 11;
      const st = v == 1 ? 0x6e6e78 : 0x7a7a84;
      if (v == 0) {
        // sarıklı mezar taşı: dik levha, üstünde kavuk; ön yüzde yazı çizgileri
        const sl = paint(slab([[-.3, 0], [.3, 0], [.3, 1.3], [-.3, 1.3]], .16, st), (x, y, z, c) => z > .07 && Math.abs(x) < .2 && y > .35 && y < 1.1 && Math.abs((y * 7 % 1 + 1) % 1 - .5) < .1 ? shade(c, .55) : mossy(st)(x, y, z));
        return merge(sl, at(lathe([[0, .22], [.17, .2], [.2, .1], [.17, 0], [0, 0]], st, 10, {
          res: 2
        }), 0, 1.3, 0), at(ellip(.19, .16, .19, (x, y, z) => shade(hex(0xd8d0c0), .8 + .3 * fbm(x * 6, y * 6, z * 6, 2))), 0, 1.56, 0));
      }
      if (v == 1) {
        // kırık, yana yatmış levha
        return at(paint(slab([[-.32, 0], [.32, 0], [.28, .8], [-.1, 1.0], [-.32, .7]], .14, st), (x, y, z, c) => mossy(st, 0x3e5a3a, .8)(x, y, z)), 0, 0, 0, [0, 0, .22]);
      }
      // yuvarlak başlı küçük taş + taban levhası
      return merge(paint(stela(.75, st, 0), (x, y, z, c) => mossy(st)(x, y, z)), at(blk(.95, .12, .55, 0x5e5e68, 3, {
        bv: .2
      }), 0, 0, .25));
    }
    function fence(sd) {
      RS = sd * 17 + 5;
      const ir = (x, y, z) => shade(mixc(hex(0x2a2a30), hex(0x6a3a22), Math.max(0, fbm(x * 3 + sd, y * 5, z * 3, 2)) * .7), .9),
        g = [];
      for (const x of [-1.5, 1.5]) g.push(limb([[x, 0, 0], [x, 1.25, 0]], [[0, .07, .07], [1, .06, .06]], ir, {
        rad: 4,
        seg: 1
      }), at(lathe([[0, .22], [.09, .12], [.1, 0], [0, 0]], 0x2a2a30, 4, {
        res: 1
      }), x, 1.25, 0));
      for (const y of [.32, .92]) g.push(limb([[-1.5, y, 0], [1.5, y, 0]], [[0, .028, .028], [1, .028, .028]], ir, {
        rad: 3,
        seg: 1
      }));
      for (let k = 0; k < 5; k++) {
        const x = -1.0 + k * .5,
          h = 1.05 + rn(-.04, .04),
          lean = rn(-.03, .03);
        g.push(limb([[x, 0, 0], [x + lean, h, 0]], [[0, .022, .022], [1, .02, .02]], ir, {
          rad: 3,
          seg: 1
        }), at(lathe([[0, .14], [.045, .06], [.045, 0], [0, 0]], 0x2a2a30, 4, {
          res: 1
        }), x + lean, h, 0));
      }
      return merge(g);
    }
    function lantern(sd) {
      RS = sd * 23 + 3;
      const wd = wood(0x3a2e26),
        ir = 0x2a2a30,
        g = [];
      g.push(limb([[0, 0, 0], [.04, 2.3, .02]], [[0, .09, .09], [1, .07, .07]], wd, {
        rad: 7,
        seg: 2
      }), limb([[0, 2.2, 0], [.55, 2.35, 0]], [[0, .05, .05], [1, .04, .04]], wd, {
        rad: 5,
        seg: 1
      }), limb([[.55, 2.35, 0], [.55, 2.1, 0]], [[0, .012, .012], [1, .012, .012]], ir, {
        rad: 4,
        seg: 1
      }));
      // fener kafesi: altıgen gövde, koyu çerçeve, içinde sıcak sarı çekirdek
      g.push(at(lathe([[0, .28], [.14, .26], [.17, .18], [.17, -.1], [.12, -.16], [0, -.16]], (x, y, z) => Math.abs(y) < .13 && Math.abs(Math.atan2(z, x) * 3 / Math.PI % 1) > .12 ? hex(0xffe3a0) : hex(ir), 6, {
        res: 1
      }), .55, 1.88, 0));
      return merge(g);
    }
    function mausoleum(sd) {
      RS = sd * 31 + 13;
      const st = 0x6a6a76,
        dk = 0x4a4a56,
        g = [];
      g.push(at(blk(3.2, .35, 3.9, 0x5e5e6a, 1, {
        bv: .15
      }), 0, 0, 0));
      g.push(at(paint(blk(2.6, 2.3, 3.2, st, 2, {
        bv: .06
      }), (x, y, z, c) => mossy(st, 0x3a5236, .6)(x, y, z)), 0, .35, 0));
      // beşik çatı: üçgen prizma (z boyunca)
      g.push(at(paint(slab([[-1.55, 0], [1.55, 0], [0, 1.1]], 3.6, dk), (x, y, z, c) => shade(hex(dk), .75 + .35 * fbm(x * 4, y * 6, z * 4, 2))), 0, 2.65, 0));
      // kapı girintisi ve iki sütun
      g.push(at(blk(.9, 1.6, .2, 0x15141a, 4, {
        bv: .02
      }), 0, .4, 1.62));
      for (const x of [-.85, .85]) g.push(at(pillar(2.1, .16, st, sd + x, 0, 1), x, .35, 1.75));
      // çatı tepesinde hilal
      g.push(at(lathe([[0, .04], [.03, .04], [.03, 0], [0, 0]], 0xb8a060, 6, {
        res: 1
      }), 0, 3.75, 0), at(ellip(.16, .16, .03, 0xb8a060, {
        ws: 10,
        hs: 6
      }), 0, 3.95, 0));
      return merge(g);
    }
    // ---------- BOZKIR: Kayıp Kervan simgesi (devrik araba, kopuk tekerlekler, yırtık çadır, çömlek, deve kemiği)
    function wheel(r, c) {
      const g = [lathe([[r, .09], [r, -.09], [r - .14, -.09], [r - .14, .09]], c, 16, {
        res: 1
      })];
      for (let k = 0; k < 8; k++) {
        const a = k / 8 * 6.283;
        g.push(limb([[0, 0, 0], [Math.cos(a) * (r - .12), 0, Math.sin(a) * (r - .12)]], [[0, .035, .035], [1, .03, .03]], c, {
          rad: 5,
          seg: 1
        }));
      }
      g.push(at(lathe([[0, .14], [.16, .14], [.16, -.14], [0, -.14]], 0x4a3a2a, 8, {
        res: 1
      }), 0, 0, 0));
      return merge(g);
    }
    function lostcaravan(o) {
      RS = o.seed || 23;
      const wd = wood(0x7a5a3a),
        wd2 = wood(0x5a4030),
        g = [],
        c = [];
      // devrik araba: gövde yana yatık, bir tekerlek havada
      const cart = merge(at(blk(2.6, 1.0, 1.6, 0x8a6a46, 3, {
        bv: .05
      }), 0, .55, 0), limb([[-1.3, .3, 0], [-3.1, .9, .3]], [[0, .07, .07], [1, .05, .05]], wd, {
        rad: 6,
        seg: 2
      }), at(wheel(.8, wd2), 1.0, .8, -.95, [Math.PI / 2, 0, 0]), at(wheel(.8, wd2), 1.0, .8, .95, [Math.PI / 2, 0, .3]));
      g.push(at(cart, 2, .3, -3, [0, .4, .55]));
      c.push({
        o: [2, -3, 1.9, 2.4]
      });
      // yerde yatan kırık tekerlekler
      g.push(at(wheel(.75, wd2), -5, .1, 2, [0, rn(0, 6.28), 0]), at(wheel(.6, wd2), 4.5, .55, 4, [1.2, .3, 0]));
      // yırtık çadır: iki direk, gergin bez, kırılmış üçüncü direk
      g.push(limb([[-3, 0, -2], [-3.2, 2.4, -2.1]], [[0, .07, .07], [1, .05, .05]], wd, {
        rad: 6,
        seg: 1
      }), limb([[-7, 0, 1], [-6.8, 2.1, 1.1]], [[0, .07, .07], [1, .05, .05]], wd, {
        rad: 6,
        seg: 1
      }), limb([[-6, 0, -3.5], [-5.6, .9, -3.2]], [[0, .06, .06], [1, .04, .04]], wd, {
        rad: 5,
        seg: 1
      }));
      const tentF = (u, v) => [-3.2 + (-6.8 + 3.2) * u, 2.4 - .3 * u - v * (2.2 + 1.4 * Math.sin(u * 3.14)) + .25 * Math.sin(u * 9 + v * 4), -2.1 + 3.1 * u + v * 1.6 * (1 - u) - .9 * v],
        tentC = (x, y, z, u, v) => (u * 7 % 1 + 1) % 1 < .5 ? shade(hex(0xb8a080), .7 + .3 * v) : shade(hex(0x8a3a2a), .75 + .3 * v);
      g.push(sheet(8, 6, tentF, tentC), sheet(8, 6, (u, v) => tentF(1 - u, v), (x, y, z, u, v) => tentC(x, y, z, 1 - u, v))); // iki yüz: bez her iki taraftan görünür
      // sandıklar, çömlekler, deve kemiği, kum altında hazine
      for (const [x, z, s] of [[5, -1, .9], [5.8, .2, .7], [-1.5, 4.5, .8]]) g.push(at(blk(s, s * .8, s, 0x8a6a46, x | 0, {
        bv: .08
      }), x, 0, z, [0, rn(0, 6.28), 0]));
      for (const [x, z, s] of [[3.5, 2.6, 1], [-4.5, -1, .8], [.5, 5.5, .9]]) g.push(at(lathe([[0, .55], [.2, .5], [.3, .32], [.32, .1], [.22, 0], [0, 0]], (x2, y, z2) => shade(hex(0x9a5a32), .8 + .4 * y), 10, {
        res: 2
      }), x, 0, z, null, [s * 1.3, s * 1.3, s * 1.3]));
      g.push(at(bones(1), -1, 0, -6, null, [1.6, 1.6, 1.6]), at(bones(0), 6.5, 0, -4.5, null, [1.3, 1.3, 1.3]));
      // deve kafatası + kaburga yayı
      g.push(at(blob(.5, 0xd8cdb2, {
        amp: .12,
        fr: 2,
        seed: 5,
        sx: 1.6,
        sy: .8
      }), 7.5, .35, 1.5));
      for (let k = 0; k < 5; k++) g.push(limb([[7.5 + k * .55, .05, 2.4], [7.5 + k * .55, 1.1 + .15 * Math.sin(k), 3.3], [7.5 + k * .55, .1, 4.2]], [[0, .05, .05], [.5, .06, .06], [1, .04, .04]], 0xd8cdb2, {
        rad: 5,
        seg: 3
      }));
      c.push({
        o: [-5, 1, .9, .3]
      }, {
        o: [5.3, -.4, 1.1, .9]
      }, {
        rw: [-5, -5, 0, 'chest']
      }, {
        rw: [8, 6, 0, 'pot']
      }, {
        rw: [-8, 5, 0, 'pot']
      }, {
        sh: [0, 7]
      });
      return {
        g: merge(g),
        c
      };
    }
    // agave: dikenli yaprak rozeti
    function agave(sd) {
      RS = sd * 13 + 29;
      const g = [],
        n = 9 + Math.floor(rr() * 4);
      for (let k = 0; k < n; k++) {
        const a = k / n * 6.283 + rn(-.15, .15),
          L = rn(.9, 1.5),
          up = rn(.5, .95),
          cx = Math.cos(a),
          cz = Math.sin(a);
        g.push(limb([[cx * .1, .05, cz * .1], [cx * L * .55, up * L * .7, cz * L * .55], [cx * L, up * L, cz * L]], [[0, .09, .035], [.5, .11, .03], [1, .01, .01]], (x, y, z) => shade(mixc(hex(0x6a8a5a), hex(0x3a4a34), Math.min(1, Math.hypot(x, z) / L)), .8 + .3 * fbm(x * 4, y * 4, z * 4, 2)), {
          rad: 5,
          seg: 2
        }));
      }
      return merge(g);
    }
    // ---------- BOZKIR: kaktüs ve tabakalı kaya çıkıntısı
    function cactus(sd) {
      RS = sd * 19 + 7;
      const gc = (x, y, z) => shade(hex(0x4e7e3a), .72 + .3 * Math.abs(Math.sin(Math.atan2(z, x) * 7)) + .08 * fbm(x * 5, y * 2, z * 5, 2)),
        h = rn(2.2, 3.2),
        g = [limb([[0, 0, 0], [0, h * .6, 0], [0, h, 0]], [[0, .24, .24], [.8, .22, .22], [1, .1, .1]], gc, {
          rad: 10,
          seg: 2,
          cap: 1
        })];
      for (const s of [-1, 1]) if (rr() < .85) {
        const y0 = rn(.8, 1.5),
          ah = rn(.6, 1.2);
        g.push(limb([[s * .15, y0, 0], [s * .55, y0 + .1, .05], [s * .6, y0 + ah, .05]], [[0, .13, .13], [.4, .14, .14], [1, .08, .08]], gc, {
          rad: 8,
          seg: 2,
          cap: 1
        }));
      }
      if (rr() < .5) g.push(at(ellip(.1, .08, .1, 0xe85a8a), 0, h + .04, 0));
      return merge(g);
    }
    function outcrop(sd) {
      RS = sd * 43 + 9;
      const g = [],
        n = 3 + Math.floor(rr() * 3);
      let y = -.2;
      for (let k = 0; k < n; k++) {
        const c = k % 2 ? 0x9a4a32 : 0xb0674a,
          sx = rn(1.1, 1.6) * (1 - k * .08),
          sz = rn(.8, 1.2) * (1 - k * .08),
          th = rn(.28, .5);
        g.push(at(blob(1, (x, yy, z) => shade(hex(c), .78 + .3 * fbm(x * 3 + sd, yy * 9, z * 3, 2)), {
          sx,
          sy: th,
          sz,
          amp: .12,
          fr: 2.2,
          seed: sd + k
        }), rn(-.2, .2), y + th, rn(-.15, .15), [0, rn(-.2, .2), rn(-.05, .05)]));
        y += th * 1.8;
      }
      return merge(g);
    }
    // patika taşı: yassı basamak
    function pstone(sd) {
      return blob(.6, (x, y, z) => shade(hex(0x74727a), .8 + .3 * fbm(x * 4 + sd, y * 4, z * 4, 2)), {
        sy: .2,
        sx: rn(.8, 1.2),
        amp: .18,
        fr: 2.4,
        seed: sd
      });
    }
    return {
      grave,
      tomb,
      fence,
      lantern,
      mausoleum,
      cactus,
      outcrop,
      pstone,
      lostcaravan,
      agave,
      kos,
      ore,
      shrine,
      padG,
      blk,
      temple,
      stones,
      camp,
      tower,
      bigtree,
      wall,
      bridge,
      pond,
      caravan,
      kurgan,
      skeleton,
      oasis,
      obelisk,
      mesa,
      gate,
      chest,
      palm,
      flower,
      mushroom,
      fern,
      fallen,
      stump,
      tumble,
      bones,
      reed,
      crystal,
      stela,
      pillar
    };
  })();
}
