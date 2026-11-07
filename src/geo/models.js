// geo/models.js · Kara Koru
// Bu dosya tek dosyalık sürümden (v22) otomatik ayrıldı. Ortak oyun durumu core/store.js içindeki $G nesnesinde.

import { $G } from '../core/store.js';
import { GEO } from './geo.js';

export let MODELS;

export function __init_3() {
  // ---- modeller. Karakterler iskeletli: {geo(si,sw ile), bones:[{n,pi,h}], eyes:[{p,r,c,bone,glow,sq}], info}
  MODELS = (() => {
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
      shade
    } = GEO;
    const P2 = Math.PI / 2;
    const at = (g, x, y, z, r, s) => tf(g, {
      t: [x, y, z],
      r,
      s
    });
    const atv = (g, v) => tf(g, {
      t: v
    });
    const nzc = (c, k = .12, f = 6) => (x, y, z) => shade(hex(c), 1 + k * .5 * fbm(x * f, y * f, z * f, 2));
    function blade(len, w, th, col) {
      return slab([[-w, 0], [w, 0], [w * .8, len * .88], [0, len], [-w * .8, len * .88]], th, col);
    }
    const fwd = g => tf(g, {
      r: [P2, 0, 0]
    }); // +y -> +z
    const V = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
    function rotP(v, r) {
      let [x, y, z] = v;
      if (r[0]) {
        const c = Math.cos(r[0]),
          s = Math.sin(r[0]);
        [y, z] = [y * c - z * s, y * s + z * c];
      }
      if (r[1]) {
        const c = Math.cos(r[1]),
          s = Math.sin(r[1]);
        [x, z] = [x * c + z * s, -x * s + z * c];
      }
      if (r[2]) {
        const c = Math.cos(r[2]),
          s = Math.sin(r[2]);
        [x, y] = [x * c - y * s, x * s + y * c];
      }
      return [x, y, z];
    }
    const about = (g, pt, r) => tf(tf(g, {
      t: [-pt[0], -pt[1], -pt[2]]
    }), {
      r,
      t: pt
    }); // pt etrafında döndür
    const aboutP = (p, pt, r) => V(rotP([p[0] - pt[0], p[1] - pt[1], p[2] - pt[2]], r), pt);
    function cape(w0, w1, len, col, o = {}) {
      return sheet(10, 14, (u, v) => {
        const x = (u * 2 - 1) * (w0 + (w1 - w0) * v);
        let y = -v * len,
          z = -.04 - .14 * v * v + .04 * Math.sin(u * 14) * v;
        if (o.rag) y -= v > .85 ? .12 * Math.abs(Math.sin(u * 23)) : 0;
        return [x, y, z];
      }, (x, y, z, u, v) => shade(hex(col), 1 - .28 * v));
    }

    // ---------- iskelet ve deri ağırlıkları
    const smt = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
    function segd(p, a, b) {
      const e0 = b[0] - a[0],
        e1 = b[1] - a[1],
        e2 = b[2] - a[2],
        q0 = p[0] - a[0],
        q1 = p[1] - a[1],
        q2 = p[2] - a[2],
        l2 = e0 * e0 + e1 * e1 + e2 * e2;
      let t = l2 > 1e-9 ? (q0 * e0 + q1 * e1 + q2 * e2) / l2 : 0;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      return Math.hypot(q0 - e0 * t, q1 - e1 * t, q2 - e2 * t);
    }
    function SK(defs) {
      const B = [],
        ix = {};
      for (const [n, par, h, t] of defs) {
        ix[n] = B.length;
        B.push({
          n,
          pi: par == null ? -1 : ix[par],
          h,
          t: t || h
        });
      }
      return {
        B,
        ix,
        info: {}
      };
    }
    // zarf ağırlığı: kemik parçasına uzaklığın ters kuvveti
    function envW(S, names, p, pw = 6) {
      const L = names.map(n => {
        const b = S.B[S.ix[n]];
        if (!b) throw new Error('kemik yok: ' + n);
        return [n, 1 / Math.pow(segd(p, b.h, b.t) + .02, pw)];
      });
      let s = 0;
      for (const a of L) s += a[1];
      return L.map(([n, w]) => [n, w / s]);
    }
    function bind(S, g, spec) {
      const nv = g.p.length / 3;
      g.si = new Array(nv * 4).fill(0);
      g.sw = new Array(nv * 4).fill(0);
      for (let i = 0; i < nv; i++) {
        const p = [g.p[i * 3], g.p[i * 3 + 1], g.p[i * 3 + 2]];
        let L = typeof spec == 'string' ? [[spec, 1]] : Array.isArray(spec) ? envW(S, spec, p, /** @type {any} */ (spec).pw || 6) : spec(p[0], p[1], p[2]);
        const m = {};
        for (const [n, w] of L) m[n] = (m[n] || 0) + w;
        L = Object.entries(m);
        let s = 0;
        for (const a of L) s += a[1];
        L = L.map(([n, w]) => [n, w / (s || 1)]).filter(a => a[1] > .025).sort((a, b) => b[1] - a[1]).slice(0, 4);
        s = 0;
        for (const a of L) s += a[1];
        L.forEach(([n, w], k) => {
          const j = S.ix[n];
          if (j == null) throw new Error('kemik yok: ' + n);
          g.si[i * 4 + k] = j;
          g.sw[i * 4 + k] = w / s;
        });
      }
      return g;
    }
    // etek/cüppe: belin üstü gövdeyle, aşağısı giderek uyluklarla döner
    const skirtW = (S, top, bot, mx, xw = .24, tor = ['hip', 'sp', 'ch']) => (x, y, z) => {
      const h = smt((top - y) / (top - bot)) * mx,
        s = smt((x + xw) / (2 * xw));
      return [...envW(S, tor, [x, y, z]).map(([n, w]) => [n, w * (1 - h)]), ['th0', h * (1 - s)], ['th1', h * s]];
    };
    const capeB = /** @type {any} */ (['c0', 'c1', 'c2', 'c3']);
    capeB.pw = 3;
    // insansı iskelet: indeks 0 = -x tarafı
    function humSK(o) {
      const d = [['hip', null, o.hip, o.sp], ['sp', 'hip', o.sp, o.ch], ['ch', 'sp', o.ch, o.nk], ['hd', 'ch', o.nk, o.hdT]];
      for (const s of [0, 1]) {
        const sx = s ? 1 : -1,
          mx = a => [a[0] * sx, a[1], a[2]];
        const sh = mx(o.sh),
          el = V(sh, mx(o.el)),
          wr = V(sh, mx(o.wr));
        d.push(['ua' + s, 'ch', sh, el], ['fa' + s, 'ua' + s, el, wr]);
        const hj = mx(o.hj),
          kn = V(hj, o.kn),
          an = V(hj, o.an),
          to = V(hj, [0, o.sole, o.toe]);
        d.push(['th' + s, 'hip', hj, kn], ['sh' + s, 'th' + s, kn, an], ['ft' + s, 'sh' + s, an, to]);
      }
      if (o.cape) {
        const [x, y, z, len] = o.cape,
          f = k => [x, y - len * k / 4, z - .04 - .14 * (k / 4) ** 2];
        for (let i = 0; i < 4; i++) d.push(['c' + i, i ? 'c' + (i - 1) : 'ch', f(i), f(i + 1)]);
      }
      const S = SK(d);
      S.info.leg = {
        k: [o.kn[1], o.kn[2]],
        a: [o.an[1] - o.kn[1], o.an[2] - o.kn[2]],
        h: [o.sole - o.an[1], o.heel - o.an[2]],
        t: [o.sole - o.an[1], o.toe - o.an[2]],
        hjy: o.hj[1],
        s0: o.hj[1] + o.sole
      };
      S.info.hy0 = o.hip[1];
      return S;
    }
    function skRig(S, pieces, eyes, extra) {
      const gs = [];
      for (const [g, spec] of pieces) for (const x of [g].flat()) gs.push(bind(S, x, spec));
      return {
        geo: merge(...gs),
        bones: S.B.map(b => ({
          n: b.n,
          pi: b.pi,
          h: b.h
        })),
        eyes: (eyes || []).map(e => ({
          ...e,
          bone: e.bone || 'hd'
        })),
        info: {
          ...S.info,
          ...(extra || {})
        }
      };
    }
    // uzuv parçaları (omuz/kalça yerel koordinatında)
    function armP(s, o) {
      return {
        up: tube([[0, 0, 0], [s * .02, -.4, .03], [0, -.8, .08]], [o.r0, o.r1, o.r2], o.col, {
          rad: 10,
          seg: 7
        }),
        hand: at(ellip(o.hr || .1, o.hr || .1, (o.hr || .1) * 1.15, o.hand), 0, -.88, .1),
        pad: o.pad ? at(ellip(.21, .15, .22, o.pad), s * .04, .02, 0, [0, 0, s * -.25]) : null
      };
    }
    function legP(o) {
      return {
        tube: tube([[0, 0, 0], [0, -.48, .03], [0, -.95, 0]], [o.r0, o.r1, o.r2], o.col, {
          rad: 10,
          seg: 7
        }),
        boot: at(ellip(o.fw || .12, .09, o.fl || .22, o.boot), 0, -1.02, .07),
        knee: o.knee ? at(ellip(.12, .1, .12, o.knee), 0, -.47, .06) : null
      };
    }
    // iki kol + iki bacak parçalarını iskelete bağla
    function limbs(S, o, armFn, legFn) {
      const out = [];
      for (const s of [0, 1]) {
        const sx = s ? 1 : -1,
          sh = [o.sh[0] * sx, o.sh[1], o.sh[2]],
          hj = [o.hj[0] * sx, o.hj[1], o.hj[2]];
        const a = armFn(sx, s);
        out.push([atv(a.up, sh), ['ua' + s, 'fa' + s]]);
        if (a.hand) out.push([atv(a.hand, sh), 'fa' + s]);
        if (a.pad) out.push([atv(a.pad, sh), 'ua' + s]);
        for (const x of a.fa || []) out.push([atv(x, sh), 'fa' + s]);
        for (const x of a.ua || []) out.push([atv(x, sh), 'ua' + s]);
        if (a.env) for (const x of a.env) out.push([atv(x, sh), ['ua' + s, 'fa' + s]]);
        const l = legFn(sx, s);
        out.push([atv(l.tube, hj), l.tb || ['th' + s, 'sh' + s]]);
        if (l.boot) out.push([atv(l.boot, hj), 'ft' + s]);
        if (l.knee) out.push([atv(l.knee, hj), 'sh' + s]);
        for (const x of l.th || []) out.push([atv(x, hj), 'th' + s]);
        for (const x of l.extra || []) out.push([atv(x, hj), 'sh' + s]);
      }
      return out;
    }

    // ---------- kahramanlar
    const HLEG = {
      kn: [0, -.48, .03],
      an: [0, -.95, 0],
      sole: -1.11,
      heel: -.13,
      toe: .29
    };
    // ---------- yeni kahramanlar: kahramanca oranlar, şekilli gövde, kaslı uzuvlar, parmaklı eller
    const {
      loft,
      limb
    } = GEO;
    const HBASE = {
      hip: [0, 1.32, 0],
      sp: [0, 1.6, 0],
      ch: [0, 1.95, 0],
      nk: [0, 2.34, 0],
      hdT: [0, 2.95, .02],
      sh: [.42, 2.2, 0],
      el: [.03, -.44, 0],
      wr: [0, -.85, .05],
      hj: [.15, 1.3, 0],
      kn: [0, -.58, .035],
      an: [0, -1.15, -.01],
      sole: -1.3,
      heel: -.12,
      toe: .27
    };
    const ang = (x, z) => Math.atan2(x, z); // önden (+z) ölçülen açı
    function legH(o) {
      const k = o.k || 1,
        c = o.col;
      return {
        tube: limb([[0, .08, 0], [0, -.28, .025], [0, -.58, .035], [0, -.87, 0], [0, -1.15, -.01]], [[0, .165 * k, .165 * k], [.12, .16 * k, .165 * k], [.32, .135 * k, .142 * k], [.47, .104 * k, .108 * k], [.55, .105 * k, .112 * k], [.66, .11 * k, .124 * k, -.012], [.82, .084 * k, .09 * k], [1, .07 * k, .074 * k]], c, {
          rad: 12,
          seg: 5,
          cap: 0,
          disp: o.disp
        }),
        boot: limb([[0, -1.2, -.11], [0, -1.215, .04], [0, -1.25, .2], [0, -1.268, .27]], [[0, .075 * k, .072 * k], [.3, .078 * k, .084 * k], [.72, .055 * k, .08 * k], [1, .03 * k, .052 * k]], o.shoe, {
          fwd: [0, 1, 0],
          rad: 10,
          seg: 4
        })
      };
    }
    function bootShaft(top, k, col, cuff) {
      const g = [limb([[0, top, .04], [0, (top - 1.17) / 2, .012], [0, -1.17, -.01]], [[0, .123 * k, .127 * k], [.25, .118 * k, .122 * k], [1, .093 * k, .097 * k]], col, {
        rad: 12,
        seg: 4,
        cap: 0
      })];
      if (cuff) g.push(limb([[0, top + .05, .042], [0, top - .04, .04]], [[0, .138 * k, .142 * k], [1, .13 * k, .134 * k]], cuff, {
        rad: 12,
        seg: 2
      }));
      return g;
    }
    function armH(sx, o) {
      const k = o.k || 1;
      return limb([[0, .06, 0], [sx * .01, -.2, -.005], [sx * .03, -.44, 0], [sx * .018, -.64, .03], [0, -.85, .05]], [[0, .125 * k, .13 * k], [.15, .12 * k, .125 * k], [.32, .1 * k, .098 * k, .012], [.5, .084 * k, .084 * k], [.58, .086 * k, .088 * k], [.7, .09 * k, .09 * k], [1, .058 * k, .062 * k]], o.col, {
        rad: 12,
        seg: 5,
        cap: 0,
        disp: o.disp
      });
    }
    function handH(sx, col, k = 1) {
      const W = [0, -.85, .05];
      return [at(ellip(.036 * k, .07 * k, .058 * k, col), 0, -.07 * k, .012), limb([[0, -.11 * k, .022], [0, -.165 * k, .042], [0, -.2 * k, .078]], [[0, .052 * k, .027 * k], [.6, .048 * k, .025 * k], [1, .04 * k, .021 * k]], col, {
        rad: 8,
        seg: 3
      }), limb([[sx * -.02, -.05 * k, .05], [sx * -.035, -.09 * k, .088], [sx * -.03, -.125 * k, .104]], [[0, .022 * k, .022 * k], [1, .017 * k, .017 * k]], col, {
        rad: 6,
        seg: 3
      })].map(g => atv(g, W));
    }
    function cape2(w0, w1, len, colf, o = {}) {
      return sheet(12, 16, (u, v) => {
        const x = (u * 2 - 1) * (w0 + (w1 - w0) * v);
        let y = -v * len,
          z = -.03 - .16 * v * v + (o.fold || .045) * Math.sin(u * Math.PI * (o.nf || 6)) * v;
        if (o.rag) y -= v > .8 ? o.rag * Math.abs(Math.sin(u * 23)) : 0;
        return [x, y, z];
      }, colf);
    }
    // kaftan eteği paneli: a açısı önden, v aşağı
    function panel(a0, a1, y0, y1, r0, r1, colf, o = {}) {
      return sheet(Math.max(4, Math.round((a1 - a0) * 7)), 12, (u, v) => {
        const a = a0 + (a1 - a0) * u,
          y = y0 + (y1 - y0) * v,
          r = (r0 + (r1 - r0) * v) * (1 + (o.fold || .04) * Math.sin(a * (o.nf || 9)) * v);
        return [Math.sin(a) * r, y, Math.cos(a) * r * (o.sz || .74) + (o.cz || 0)];
      }, colf);
    }
    function skirtSet(S, top, bot, r0, r1, colf, o = {}) {
      const sw = skirtW(S, top, bot, o.mx || .9, o.xw || .24),
        g = o.gap || .06,
        sd = o.slit || 1.5;
      return [[panel(-sd, -g, top, bot, r0, r1, (x, y, z, u, v) => colf(x, y, z, 1 - u, v), o), sw], [panel(g, sd, top, bot, r0, r1, colf, o), sw], [panel(sd + .04, Math.PI * 2 - sd - .04, top, bot, r0, r1, (x, y, z, u, v) => colf(x, y, z, Math.min(u, 1 - u) * 3, v), o), sw]];
    }
    function shag(x, y, z, f = 7, a = .25) {
      return a * Math.max(0, fbm(x * f, y * f, z * f, 2)) + a * .15 * fbm(x * 3, y * 3, z * 3, 2);
    }

    // ----- ALP: Türk alpı
    function hAlp() {
      const st = 0xa8aeb6,
        sd = 0x5c626b,
        rd = 0x8e1f1f,
        rdk = 0x5e1414,
        gd = 0xc9a24a,
        lt = 0x3a2618,
        bt = 0x2a201b,
        dk = 0x22252a,
        sk = 0xc49270;
      const o = {
          ...HBASE,
          sh: [.44, 2.2, 0],
          cape: [0, 2.21, -.22, 1.55]
        },
        S = humSK(o);
      const lam = (x, y, z) => {
        const rw = (y - 1.665) / .072,
          fy = rw - Math.floor(rw),
          a = ang(x, z),
          s = fy * fy * (3 - 2 * fy);
        return shade(hex(st), .58 + .5 * (1 - s) + .07 * Math.sin(a * 26 + Math.floor(rw) * 1.7));
      };
      const torC = (x, y, z) => {
        if (y > 2.21) return y > 2.255 ? hex(rd) : hex(gd);
        if (y >= 1.665) {
          if (y < 1.69 || y > 2.17) return hex(gd);
          return lam(x, y, z);
        }
        if (y >= 1.555) {
          const a = ang(x, z),
            pl = Math.abs((a * 6 / Math.PI % 1 + 1) % 1 - .5) < .16 && y > 1.575 && y < 1.645;
          return pl ? hex(gd) : hex(lt);
        }
        return shade(hex(rd), .88 + .12 * Math.sin(ang(x, z) * 8));
      };
      const torso = loft([{
        y: 1.18,
        rx: 0,
        rz: 0
      }, {
        y: 1.22,
        rx: .18,
        rz: .14
      }, {
        y: 1.32,
        rx: .28,
        rz: .18
      }, {
        y: 1.46,
        rx: .285,
        rz: .18
      }, {
        y: 1.58,
        rx: .27,
        rz: .176
      }, {
        y: 1.63,
        rx: .278,
        rz: .182
      }, {
        y: 1.76,
        rx: .312,
        rz: .2,
        cz: .012
      }, {
        y: 1.94,
        rx: .36,
        rz: .226,
        cz: .026,
        n: 2.3
      }, {
        y: 2.08,
        rx: .385,
        rz: .21,
        cz: .015,
        n: 2.5
      }, {
        y: 2.2,
        rx: .33,
        rz: .175,
        n: 2.3
      }, {
        y: 2.28,
        rx: .2,
        rz: .14
      }, {
        y: 2.33,
        rx: .12,
        rz: .11
      }, {
        y: 2.35,
        rx: 0,
        rz: 0
      }], torC, {
        seg: 44,
        res: 6
      });
      const skC = (x, y, z, u, v) => v > .9 || u < .06 ? hex(gd) : shade(hex(rd), .82 + .16 * Math.sin(ang(x, z) * 9) - .1 * v);
      // baş: yüz bandı, sivri miğfer, zincir perde, püskül
      const head = at(ellip(.152, .19, .168, sk), 0, 2.6, .02),
        eyeA = [-1, 1].flatMap(s => [at(ellip(.027, .015, .012, 0xe8e0d0), s * .056, 2.583, .172), at(ellip(.012, .012, .008, 0x140c08), s * .056, 2.583, .181), at(ellip(.04, .011, .016, 0x2a1a12), s * .058, 2.605, .17, [0, 0, s * -.12])]);
      const helm = loft([{
        y: 3.03,
        rx: 0,
        rz: 0
      }, {
        y: 3.0,
        rx: .025,
        rz: .025
      }, {
        y: 2.9,
        rx: .095,
        rz: .1
      }, {
        y: 2.78,
        rx: .162,
        rz: .172
      }, {
        y: 2.69,
        rx: .195,
        rz: .205
      }, {
        y: 2.64,
        rx: .205,
        rz: .215
      }, {
        y: 2.615,
        rx: .208,
        rz: .218
      }, {
        y: 2.6,
        rx: 0,
        rz: 0
      }], (x, y, z) => y < 2.665 ? hex(gd) : shade(hex(st), .8 + .35 * (y - 2.65) + .12 * Math.sin(ang(x, z) * 16)), {
        seg: 32,
        res: 4,
        disp: (x, y, z) => y > 2.67 && y < 2.99 ? .025 * Math.sin(Math.atan2(x, z) * 16) : 0
      });
      const nasal = limb([[0, 2.67, .222], [0, 2.6, .226], [0, 2.53, .222]], [[0, .012, .022], [1, .01, .028]], st, {
        fwd: [0, 0, 1],
        rad: 6,
        seg: 2
      });
      const aven = sheet(44, 14, (u, v) => {
        const a = (u - .5) * 2 * Math.PI,
          fr = Math.pow(Math.max(0, Math.cos(a)), 4),
          top = 2.618 - .083 * fr,
          y = top - v * (top - 2.32),
          r = 1 + v * v * .28 + .04 * fr * (1 - v);
        return [Math.sin(a) * .178 * r, y, Math.cos(a) * .19 * r + .02 + .012 * fr];
      }, (x, y, z, u, v) => v > .9 || v < .08 && u > .4 && u < .6 ? hex(gd) : shade(hex(0x7a8088), .62 + .22 * Math.abs(Math.sin(y * 190)) + .15 * hsh2(x, y, z) - .12 * v));
      const fin = at(ellip(.035, .03, .035, gd), 0, 3.03, 0),
        tug = limb([[0, 3.05, 0], [0, 3.12, -.06], [0, 3.02, -.26], [0, 2.78, -.36], [0, 2.58, -.37]], [[0, .03, .03], [.2, .06, .065], [.6, .055, .06], [1, .018, .02]], (x, y, z) => shade(hex(0x9a1c18), .7 + .25 * fbm(x * 30, y * 12, z * 30, 2)), {
          rad: 10,
          seg: 4,
          disp: (x, y, z, u, v) => .09 * fbm(u * 20, v * 3, 0, 2)
        });
      const clasp = [-1, 1].map(s => at(ellip(.045, .045, .02, gd), s * .2, 2.19, .165));
      // kılıç ve kalkan
      const hp = [0, -.92, .1];
      const sword = [limb([[0, 0, .13], [0, .014, .5], [0, .05, .88], [0, .11, 1.24]], [[0, .013, .045], [.75, .011, .04], [.93, .008, .026], [1, .002, .004]], (x, y, z, u) => u > .35 && u < .65 ? hex(0xf2f5f8) : hex(0xc8ced6), {
        fwd: [1, 0, 0],
        rad: 8,
        seg: 4,
        cap: 0
      }), limb([[-.1, 0, .1], [0, 0, .11], [.1, 0, .1]], [[0, .02, .02], [.5, .03, .026], [1, .02, .02]], gd, {
        fwd: [0, 1, 0],
        rad: 7,
        seg: 3
      }), limb([[0, 0, .08], [0, 0, -.12]], [[0, .03, .03], [1, .028, .028]], lt, {
        rad: 7,
        seg: 2
      }), at(ellip(.04, .04, .04, gd), 0, 0, -.15)].map(g => about(atv(g, hp), hp, [.55, 0, 0]));
      const shield = at(lathe([[0, .07], [.08, .066], [.16, .05], [.26, .028], [.31, .008], [.32, -.01], [.28, -.02], [0, -.02]], (x, y, z) => {
        const r = Math.hypot(x, z),
          a = Math.atan2(z, x);
        if (r < .075) return shade(hex(st), 1.1);
        if (r > .285) return hex(gd);
        if (Math.abs(((a * 3 + r * 18) % (Math.PI * .666) + Math.PI * .666) % (Math.PI * .666) - .33) < .07) return hex(gd);
        return shade(hex(rd), .85 + .3 * (1 - r * 2));
      }, 26, {
        res: 2
      }), -.15, -.64, .06, [0, 0, P2]);
      const pau = s => [0, 1, 2].map(i => at(lathe([[0, .055], [.1, .047], [.17, .024], [.205, -.006], [.195, -.022], [.1, .006], [0, .018]], (x, y, z) => Math.hypot(x, z) > .18 ? hex(gd) : shade(hex(st), .75 + 3.5 * y), 22, {
        sz: .95
      }), s * (.03 + .055 * i), .06 - .08 * i, 0, [0, 0, s * -(.55 + .28 * i)]));
      const vamb = s => limb([[s * .03, -.47, 0], [s * .018, -.64, .03], [0, -.81, .05]], [[0, .098, .1], [.45, .1, .1], [1, .076, .08]], (x, y, z) => shade(hex(st), .8 + .4 * Math.max(0, z * 4)), {
        rad: 12,
        seg: 3,
        n: 2.2,
        cap: 0
      });
      const legC = (x, y, z) => shade(hex(0x3c2a26), .9 + .12 * fbm(x * 9, y * 9, z * 9, 2));
      return skRig(S, [[torso, ['hip', 'sp', 'ch']], ...skirtSet(S, 1.6, .76, .3, .43, skC), [[head, ...eyeA, helm, nasal, fin, tug], 'hd'], [aven, (x, y, z) => y > 2.42 ? [['hd', 1]] : [['hd', .5], ['ch', .5]]], [clasp, 'ch'], [atv(cape2(.36, .62, 1.55, (x, y, z, u, v) => u < .04 || u > .96 || v > .96 ? hex(gd) : shade(hex(rd), 1 - .3 * v)), [0, 2.21, -.22]), capeB], ...limbs(S, o, (sx, s) => ({
        up: armH(sx, {
          col: (x, y, z) => y > -.44 ? shade(hex(rd), .92 + .1 * Math.sin(y * 40)) : hex(lt)
        }),
        fa: [...handH(sx, lt), vamb(sx), at(ellip(.07, .065, .06, st), sx * .035, -.45, -.05), ...(s ? sword : [shield])],
        ua: pau(sx)
      }), sx => {
        const l = legH({
          col: legC,
          shoe: bt
        });
        l.th = [];
        l.knee = at(paint(ellip(.085, .08, .06, st), (x, y, z) => shade(hex(st), .85 + 2 * z)), 0, -.57, .1);
        l.extra = bootShaft(-.62, 1, bt, rdk);
        return l;
      })], [], {
        gait: {
          st: .78,
          kn: 1.35,
          ln: 1,
          ar: .75,
          el: [.8, 1.05],
          hy: 1
        }
      });
    }
    // uzun kenarlı üçgenleri at (kesik açıklıklar için)
    function dropLong(g, mx) {
      const I = [],
        P = g.p,
        d = (a, b) => Math.hypot(P[a * 3] - P[b * 3], P[a * 3 + 1] - P[b * 3 + 1], P[a * 3 + 2] - P[b * 3 + 2]);
      for (let f = 0; f < g.i.length; f += 3) {
        const a = g.i[f],
          b = g.i[f + 1],
          c = g.i[f + 2];
        if (Math.max(d(a, b), d(b, c), d(a, c)) < mx) I.push(a, b, c);
      }
      g.i = I;
      return g;
    }
    // küçük gürültü (zincir zırh benekleri)
    function hsh2(x, y, z) {
      const v = Math.sin(x * 91.7 + y * 313.1 + z * 57.3) * 43758.5453;
      return v - Math.floor(v);
    }

    // ----- GÖLGE: kukuletalı suikastçı
    function hGolge() {
      const cl = 0x34525e,
        ch = 0x343943,
        dk = 0x0d0e12,
        lt = 0x5a3e2a,
        ld = 0x352419,
        st = 0xc0c7cf,
        rd = 0x9a2424,
        wr = 0x5c574e,
        hd = 0x3b5560;
      const o = {
          ...HBASE,
          sh: [.38, 2.18, 0],
          hj: [.14, 1.3, 0],
          cape: [0, 2.3, -.17, 1.3]
        },
        S = humSK(o);
      const torC = (x, y, z) => {
        if (y < 1.585 && y > 1.5) {
          const bk = z > .1 && Math.abs(x) < .045 && y > 1.515 && y < 1.57;
          return bk ? hex(st) : hex(ld);
        }
        if (y <= 1.5) return hex(ch);
        const a = ang(x, z);
        if (z > 0 && Math.abs(x + (y - 1.9) * .35) < .012) return hex(0x1a2228);
        return shade(hex(cl), .85 + .15 * Math.abs(Math.sin(a * 5)) + .1 * (y - 1.6));
      };
      const torso = loft([{
        y: 1.18,
        rx: 0,
        rz: 0
      }, {
        y: 1.22,
        rx: .16,
        rz: .125
      }, {
        y: 1.32,
        rx: .245,
        rz: .158
      }, {
        y: 1.46,
        rx: .24,
        rz: .152
      }, {
        y: 1.58,
        rx: .225,
        rz: .148
      }, {
        y: 1.74,
        rx: .26,
        rz: .172,
        cz: .01
      }, {
        y: 1.92,
        rx: .305,
        rz: .19,
        cz: .02,
        n: 2.2
      }, {
        y: 2.06,
        rx: .32,
        rz: .176,
        n: 2.3
      }, {
        y: 2.17,
        rx: .27,
        rz: .15
      }, {
        y: 2.26,
        rx: .16,
        rz: .12
      }, {
        y: 2.32,
        rx: .1,
        rz: .09
      }, {
        y: 2.34,
        rx: 0,
        rz: 0
      }], torC, {
        seg: 32,
        res: 4
      });
      const strapF = limb([[-.21, 2.13, .165], [-.08, 1.99, .212], [.08, 1.82, .205], [.2, 1.67, .168], [.25, 1.58, .12]], [[0, .011, .034], [1, .011, .034]], lt, {
          fwd: [0, 0, 1],
          rad: 6,
          seg: 4,
          cap: 0
        }),
        strapB = limb([[-.21, 2.13, -.15], [0, 1.86, -.19], [.25, 1.58, -.13]], [[0, .011, .034], [1, .011, .034]], lt, {
          fwd: [0, 0, -1],
          rad: 6,
          seg: 4,
          cap: 0
        });
      const knives = [[-.1, 2.0], [.02, 1.88], [.13, 1.75]].map(([x, y]) => at(slab([[-.018, 0], [.018, 0], [.012, .15], [0, .18], [-.012, .15]], .012, st), x, y - .02, .222, [0, 0, .75]));
      const pouch = [-1, 1].map(s => at(blob(.065, lt, {
        sx: 1.1,
        sy: 1,
        sz: .7,
        amp: .06,
        fr: 3
      }), s * .19, 1.5, -.13));
      const sash = [0, 1].map(i => sheet(2, 8, (u, v) => [-.25 - .03 * i + (u - .5) * .07, 1.53 - v * (.55 - .08 * i), .04 - .05 * i + .03 * Math.sin(v * 4)], (x, y, z, u, v) => shade(hex(rd), 1 - .3 * v)));
      const capelet = sheet(36, 8, (u, v) => {
        const a = u * Math.PI * 2,
          y = 2.3 - v * (.3 + .07 * Math.abs(Math.sin(u * Math.PI * 7))),
          r = .16 + v * .29;
        return [Math.sin(a) * r * 1.12, y, Math.cos(a) * r * .82 - .02];
      }, (x, y, z, u, v) => shade(hex(0x2e3e46), .78 + .25 * (1 - v) + .08 * Math.sin(u * 40)));
      // kukuleta: yüz açıklığı bırakan iki kabuk
      const AO = .62,
        HR = (a, v) => {
          const ao = v < .3 ? 0 : v < .8 ? AO : AO * Math.max(0, 1 - (v - .8) / .15),
            aa = Math.abs(a) < ao ? Math.sign(a || 1) * ao : a,
            fr = Math.max(0, Math.cos(aa));
          let r, y;
          if (v < .55) {
            const f = v / .55 * Math.PI / 2;
            r = Math.sin(f);
            y = 2.62 + Math.cos(f) * .3;
          } else {
            const t = (v - .55) / .45;
            r = 1 + .62 * t * t + .25 * t;
            y = 2.62 - t * .4;
          }
          const pk = .07 * fr * fr * Math.max(0, 1 - Math.abs(v - .34) / .18);
          return [Math.sin(aa) * r * .25, y + .02 * fr * (v < .4 ? 1 : 0), Math.cos(aa) * r * .265 - .03 + pk];
        };
      const hoodC = (x, y, z, u, v) => shade(hex(hd), .7 + .38 * (y - 2.3) + .05 * Math.sin(u * 34));
      const hood = dropLong(sheet(40, 22, (u, v) => HR((u - .5) * Math.PI * 2, v), hoodC), .16);
      const rim = limb([...Array(13)].map((_, i) => {
        const t = i / 12;
        if (t < .35) {
          const v = .8 - t / .35 * .5;
          return HR(-AO, v);
        }
        if (t > .65) {
          const v = .3 + (t - .65) / .35 * .5;
          return HR(AO, v);
        }
        const a = -AO + (t - .35) / .3 * 2 * AO;
        return HR(a, .3);
      }).map(p => [p[0] * .985, p[1], p[2] + .005]), [[0, .016, .02], [1, .016, .02]], 0x22323a, {
        rad: 6,
        seg: 2,
        cap: 0
      });
      const tip = limb([[0, 2.84, -.2], [0, 2.74, -.4], [0, 2.56, -.52]], [[0, .09, .09], [.6, .05, .05], [1, .012, .012]], hd, {
        rad: 8,
        seg: 4
      });
      const face = at(ellip(.14, .18, .15, dk), 0, 2.6, -.015),
        mask = at(paint(ellip(.148, .1, .153, 0x2a2e36), (x, y, z) => shade(hex(0x2a2e36), .8 + .3 * Math.max(0, z * 5))), 0, 2.525, -.008);
      const legC = (x, y, z) => {
        if (y < -.62) {
          const w = ((y * 28 + Math.atan2(x, z) * .8) % 1 + 1) % 1;
          return w < .5 ? hex(wr) : hex(0x3a3834);
        }
        return shade(hex(ch), .9 + .1 * fbm(x * 9, y * 9, z * 9, 2));
      };
      const brC = (x, y, z) => Math.abs((y * 22 % 1 + 1) % 1 - .5) < .12 ? hex(0x6a4c34) : hex(lt);
      const dag = s => {
        const hp = [0, -.9, .1];
        return [limb([[0, 0, .14], [0, .01, .36], [0, .04, .56], [0, .08, .68]], [[0, .01, .03], [.8, .008, .026], [1, .002, .004]], (x, y, z, u) => u > .38 && u < .62 ? hex(0xf0f4f8) : hex(st), {
          fwd: [1, 0, 0],
          rad: 8,
          seg: 3,
          cap: 0
        }), limb([[0, -.06, .11], [0, .06, .11]], [[0, .018, .018], [1, .018, .018]], ld, {
          rad: 6,
          seg: 2
        }), limb([[0, 0, .1], [0, 0, -.1]], [[0, .026, .026], [1, .024, .024]], dk, {
          rad: 6,
          seg: 2
        })].map(g => about(about(atv(g, hp), hp, [-1.25, 0, 0]), hp, [0, 0, s * .18]));
      };
      const xb = s => at(fwd(blade(.95, .05, .02, st)), s * .05, 1.6, -.24, [0, 0, s * .55]);
      const tails = [[.95, Math.PI - .12], [Math.PI + .12, Math.PI * 2 - .95]].map(([a0, a1]) => [panel(a0, a1, 1.56, .78, .26, .36, (x, y, z, u, v) => v > .93 ? hex(0x1f2b31) : shade(hex(0x2e4650), .85 - .2 * v + .06 * Math.sin(u * 12)), {
        fold: .05,
        nf: 7,
        sz: .72
      }), skirtW(S, 1.52, .8, .9, .22)]);
      return skRig(S, [[torso, ['hip', 'sp', 'ch']], ...tails, [[strapF, strapB, ...knives], 'ch'], [pouch, 'hip'], ...sash.map(g => [g, skirtW(S, 1.5, 1.0, .7, .24)]), [capelet, 'ch'], [[xb(-1), xb(1)], 'ch'], [[hood, rim, tip, face, mask], 'hd'], [atv(cape2(.09, .13, 1.3, (x, y, z, u, v) => shade(hex(rd), 1 - .35 * v), {
        fold: .02,
        nf: 3,
        rag: .08
      }), [0, 2.3, -.17]), capeB], ...limbs(S, o, sx => ({
        up: armH(sx, {
          k: .88,
          col: (x, y, z) => hex(ch)
        }),
        fa: [...handH(sx, 0x3b3c42, .95), limb([[sx * .026, -.5, .005], [sx * .016, -.66, .03], [0, -.8, .05]], [[0, .088, .09], [.5, .09, .09], [1, .07, .072]], brC, {
          rad: 10,
          seg: 3,
          cap: 0
        }), ...dag(sx)]
      }), () => {
        const l = legH({
          k: .88,
          col: legC,
          shoe: 0x1e1a18
        });
        l.knee = at(ellip(.075, .085, .05, lt), 0, -.56, .095);
        l.extra = bootShaft(-1.0, .88, 0x1e1a18);
        return l;
      })], [{
        p: [-.055, 2.615, .125],
        r: .024,
        c: 0x9fe8d8,
        glow: .55
      }, {
        p: [.055, 2.615, .125],
        r: .024,
        c: 0x9fe8d8,
        glow: .55
      }], {
        gait: {
          st: .9,
          kn: 1.55,
          ln: 2.1,
          ar: .25,
          el: [.25, .25],
          hy: .8,
          ninja: 1
        }
      });
    }

    // ----- BAHADIR: bozkır savaşçısı
    function hBahadir() {
      const kf = 0x2a4656,
        tr = 0xc8862a,
        rd = 0x9a3a22,
        fu = 0x6e5236,
        fd = 0x4a3624,
        sk = 0xc49270,
        bd = 0x24180f,
        lt = 0x5a3e28,
        bt = 0x3a2a1e,
        st = 0xa8aeb6,
        gd = 0xc9a24a;
      const o = {
          ...HBASE,
          sh: [.49, 2.2, 0],
          hj: [.17, 1.3, 0],
          cape: [0, 2.2, -.27, 1.3]
        },
        S = humSK(o);
      const xl = y => -.24 + (2.2 - y) * .85;
      const torC = (x, y, z) => {
        if (y < 1.64 && y > 1.48) {
          if (z > .15 && Math.abs(x) < .05 && y > 1.5 && y < 1.6) return hex(gd);
          return y > 1.53 && y < 1.6 ? hex(lt) : hex(rd);
        }
        return shade(hex(kf), .85 + .15 * Math.sin(ang(x, z) * 7) + .08 * (y - 1.6));
      };
      const torso = loft([{
        y: 1.16,
        rx: 0,
        rz: 0
      }, {
        y: 1.2,
        rx: .2,
        rz: .15
      }, {
        y: 1.3,
        rx: .32,
        rz: .21
      }, {
        y: 1.46,
        rx: .33,
        rz: .215
      }, {
        y: 1.58,
        rx: .325,
        rz: .212
      }, {
        y: 1.74,
        rx: .36,
        rz: .234,
        cz: .015
      }, {
        y: 1.92,
        rx: .42,
        rz: .255,
        cz: .03,
        n: 2.2
      }, {
        y: 2.06,
        rx: .45,
        rz: .236,
        cz: .015,
        n: 2.4
      }, {
        y: 2.18,
        rx: .38,
        rz: .2
      }, {
        y: 2.27,
        rx: .22,
        rz: .15
      }, {
        y: 2.33,
        rx: .13,
        rz: .12
      }, {
        y: 2.35,
        rx: 0,
        rz: 0
      }], torC, {
        seg: 36,
        res: 5
      });
      const skC = (x, y, z, u, v) => v > .88 || u < .07 ? hex(tr) : shade(hex(kf), .8 + .16 * Math.sin(ang(x, z) * 9) - .1 * v);
      const mirror = at(lathe([[0, .04], [.07, .034], [.12, .017], [.135, 0], [.13, -.01], [0, -.01]], (x, y, z) => Math.hypot(x, z) > .112 ? hex(gd) : shade(hex(0xb8c2cc), 1.0 - Math.hypot(x, z) * 2.2), 20, {
        res: 2
      }), .02, 1.93, .268, [P2 - .12, 0, 0]);
      const trim = limb([[-.24, 2.2, .17], [-.08, 2.02, .27], [.1, 1.82, .262], [.24, 1.67, .19], [.29, 1.6, .13]], [[0, .012, .04], [1, .012, .04]], (x, y, z) => shade(hex(tr), .9 + .25 * Math.abs(Math.sin(y * 70))), {
        fwd: [0, 0, 1],
        rad: 6,
        seg: 5,
        cap: 0
      });
      const mantle = tf(limb([...Array(15)].map((_, i) => {
        const a = .42 + i / 14 * (Math.PI * 2 - .84);
        return [Math.sin(a) * .37, 2.19 + .05 * Math.cos(a), Math.cos(a) * .25 - .02];
      }), [[0, .02, .02], [.14, .14, .13], [.5, .17, .16], [.86, .14, .13], [1, .02, .02]], (x, y, z) => shade(mixc(hex(fd), hex(0x9a7a52), Math.max(0, fbm(x * 11, y * 11, z * 11, 2) + .2)), .8 + .17 * fbm(x * 25, y * 25, z * 25, 1)), {
        fwd: [0, 1, 0],
        rad: 12,
        seg: 4,
        disp: (x, y, z) => .9 * shag(x, y, z, 10, .35) + .25 * Math.max(0, fbm(x * 25, y * 25, z * 25, 1))
      }), {});
      const sashT = [0, 1].map(i => sheet(2, 8, (u, v) => [.22 + .06 * i + (u - .5) * .1, 1.52 - v * (.62 - .1 * i), .25 - .06 * i + .02 * Math.sin(v * 5)], (x, y, z, u, v) => shade(hex(rd), 1 - .3 * v)));
      // baş
      const hc = [0, 2.6, .03];
      const head = at(ellip(.16, .2, .18, (x, y, z) => shade(hex(sk), .92 + .12 * Math.max(0, z * 4)), {
        disp: (nx, ny, nz) => ny < -.25 ? -.08 * (-ny - .25) * Math.abs(nx) * 2 : 0
      }), ...hc);
      const nose = limb([[0, 2.63, .17], [0, 2.58, .205], [0, 2.555, .21]], [[0, .026, .024], [1, .033, .03]], shade(hex(sk), 1.04), {
        rad: 8,
        seg: 3
      });
      const brows = [-1, 1].map(s => at(ellip(.065, .022, .03, bd), s * .062, 2.66, .165, [0, 0, s * -.15]));
      const eyesG = [-1, 1].flatMap(s => [at(ellip(.024, .016, .012, 0xe6ddd0), s * .06, 2.627, .168), at(ellip(.011, .011, .008, 0x120a06), s * .06, 2.627, .177)]);
      const ears = [-1, 1].map(s => at(ellip(.025, .05, .04, shade(hex(sk), .92)), s * .162, 2.6, .02));
      const beard = at(blob(.17, (x, y, z) => shade(hex(bd), .8 + .17 * fbm(x * 20, y * 12, z * 20, 2)), {
        sx: 1,
        sy: 1.15,
        sz: .75,
        amp: .2,
        fr: 4.5
      }), 0, 2.43, .11);
      const mous = [-1, 1].map(s => limb([[s * .02, 2.555, .205], [s * .08, 2.53, .2], [s * .13, 2.47, .17], [s * .145, 2.37, .15]], [[0, .022, .026], [.5, .02, .022], [1, .008, .01]], bd, {
        rad: 7,
        seg: 3
      }));
      const braid = limb([[0, 2.6, -.17], [0, 2.45, -.22], [0, 2.3, -.24], [0, 2.15, -.25]], [[0, .04, .04], [1, .022, .022]], (x, y, z) => shade(hex(bd), .8 + .3 * Math.abs(Math.sin(y * 60))), {
        rad: 7,
        seg: 4
      });
      const fur = tube([...Array(17)].map((_, i) => {
        const a = i / 16 * Math.PI * 2;
        return [Math.sin(a) * .195, 2.745, Math.cos(a) * .21 + .02];
      }), Array(17).fill(.062), (x, y, z) => shade(mixc(hex(fd), hex(0x9a7a52), Math.max(0, fbm(x * 14, y * 14, z * 14, 2) + .2)), .8 + .15 * fbm(x * 30, y * 30, z * 30, 1)), {
        rad: 10,
        disp: (x, y, z) => .9 * shag(x, y, z, 16, .35)
      });
      const crown = loft([{
        y: 3.1,
        rx: 0,
        rz: 0,
        cz: -.12
      }, {
        y: 3.06,
        rx: .04,
        rz: .04,
        cz: -.1
      }, {
        y: 2.95,
        rx: .11,
        rz: .11,
        cz: -.04
      }, {
        y: 2.82,
        rx: .165,
        rz: .175,
        cz: 0
      }, {
        y: 2.74,
        rx: .175,
        rz: .185,
        cz: .02
      }, {
        y: 2.72,
        rx: 0,
        rz: 0,
        cz: .02
      }], (x, y, z) => Math.abs(x) < .012 && z > 0 ? hex(gd) : shade(hex(rd), .8 + .3 * (y - 2.75)), {
        seg: 24,
        res: 3
      });
      const gem = at(ellip(.03, .04, .02, 0x3aa0c8), 0, 2.8, .22);
      // balta
      const hp = [0, -.92, .1],
        axe = [limb([[0, 0, -.36], [0, 0, .35], [0, 0, 1.0]], [[0, .042, .042], [1, .038, .038]], (x, y, z) => shade(hex(0x5a3e28), .85 + .25 * Math.abs(Math.sin(z * 30))), {
          rad: 8,
          seg: 3
        }), at(paint(slab([[-.11, .11], [.11, .11], [.16, -.05], [.36, -.42], [.08, -.38], [-.14, -.1]], .04, st), (x, y) => x > .2 || y < -.3 ? hex(0xe6eaee) : shade(hex(st), .85)), 0, 0, .84, [0, -P2, 0]), limb([[0, .08, .84], [0, .27, .87]], [[0, .04, .04], [1, .004, .004]], st, {
          rad: 6,
          seg: 2
        }), at(ellip(.06, .075, .07, 0x6a7078), 0, 0, .84)].map(g => about(atv(g, hp), hp, [.5, 0, 0]));
      const legC = (x, y, z) => shade(hex(0x5a4c3e), .85 + .18 * Math.sin(Math.atan2(x, z) * 5 + y * 8));
      return skRig(S, [[torso, ['hip', 'sp', 'ch']], [trim, ['sp', 'ch']], [mirror, 'ch'], ...skirtSet(S, 1.62, .82, .34, .47, skC, {
        gap: .05,
        slit: 1.45
      }), [mantle, 'ch'], ...sashT.map(g => [g, skirtW(S, 1.5, 1.0, .7, .24)]), [[head, nose, ...brows, ...eyesG, ...ears, beard, ...mous, braid, fur, crown, gem], 'hd'], [atv(paint(cape2(.42, .58, 1.3, (x, y, z, u, v) => shade(hex(fu), .95 - .3 * v), {
        rag: .12,
        nf: 5
      }), (x, y, z, c) => shade(c, 1 + .15 * fbm(x * 12, y * 12, z * 12, 2))), [0, 2.2, -.27]), capeB], ...limbs(S, o, (sx, s) => ({
        up: armH(sx, {
          k: 1.18,
          col: (x, y, z) => y > -.4 ? y > -.46 + .02 ? shade(hex(kf), .95) : hex(tr) : shade(hex(sk), .95 + .1 * Math.max(0, z * 5))
        }),
        fa: [...handH(sx, sk, 1.15), limb([[sx * .026, -.6, .025], [sx * .012, -.72, .04], [0, -.8, .05]], [[0, .105, .108], [1, .082, .086]], (x, y, z) => hex(lt), {
          rad: 10,
          seg: 2,
          cap: 0
        }), limb([[sx * .03, -.53, .015], [sx * .028, -.56, .02]], [[0, .11, .112], [1, .11, .112]], gd, {
          rad: 10,
          seg: 1,
          cap: 0
        }), ...(s ? axe : [])]
      }), () => {
        const l = legH({
          k: 1.14,
          col: legC,
          shoe: bt,
          disp: (x, y, z, u, v) => .05 * Math.sin(u * 6.283 * 4 + v * 10) * (v < .5 ? 1 : 0)
        });
        l.extra = bootShaft(-.58, 1.14, bt, null);
        l.th = [limb([[0, -.53, .045], [0, -.62, .04]], [[0, .165, .17], [1, .155, .16]], (x, y, z) => shade(hex(fu), .8 + .20 * fbm(x * 14, y * 14, z * 14, 2)), {
          rad: 12,
          seg: 2,
          disp: (x, y, z) => .4 * shag(x, y, z, 12, .3)
        })];
        return l;
      })], [], {
        gait: {
          st: .72,
          kn: 1.2,
          ln: .9,
          ar: .7,
          el: [.8, 1.0],
          hy: 1.2
        }
      });
    }

    // ----- KAM: bozkır şamanı (saçaklı başlık, boynuzlar, kurdeleli cüppe, tüngür, alevli asa)
    function hKam() {
      const rb = 0x4e3a2a,
        rl = 0x6a4c34,
        rk = 0x2a2018,
        fr = 0x9a8a6a,
        fd = 0x6e5c44,
        bn = 0xd8cdb2,
        br = 0xb08a3a,
        r1 = 0x8a3a24,
        r2 = 0x2e5a7a,
        r3 = 0xd8c8a0,
        sk = 0xb88a68,
        hb = 0x8c8a84,
        wd = 0x4a3424,
        ey = 0xff8a3a;
      const o = {
          ...HBASE,
          sh: [.41, 2.19, 0],
          cape: [0, 2.2, -.24, 1.4]
        },
        S = humSK(o);
      const torC = (x, y, z) => {
        if (y < 1.6 && y > 1.49) {
          if (z > .15 && Math.abs(x) < .05 && y > 1.51 && y < 1.58) return hex(br);
          return shade(hex(rk), .9 + .2 * Math.abs(Math.sin(ang(x, z) * 20)));
        }
        if (y >= 1.6 && z > 0 && Math.abs(x + (1.98 - y) * .42) < .02) return hex(fd);
        return shade(hex(rb), .82 + .12 * Math.sin(ang(x, z) * 6) + .1 * (y - 1.6) + .07 * fbm(x * 14, y * 14, z * 14, 2));
      };
      const torso = loft([{
        y: 1.18,
        rx: 0,
        rz: 0
      }, {
        y: 1.22,
        rx: .17,
        rz: .135
      }, {
        y: 1.32,
        rx: .255,
        rz: .17
      }, {
        y: 1.46,
        rx: .25,
        rz: .165
      }, {
        y: 1.58,
        rx: .24,
        rz: .16
      }, {
        y: 1.74,
        rx: .272,
        rz: .178,
        cz: .01
      }, {
        y: 1.92,
        rx: .315,
        rz: .198,
        cz: .02,
        n: 2.2
      }, {
        y: 2.06,
        rx: .335,
        rz: .188,
        n: 2.3
      }, {
        y: 2.17,
        rx: .285,
        rz: .158
      }, {
        y: 2.26,
        rx: .17,
        rz: .13
      }, {
        y: 2.32,
        rx: .1,
        rz: .09
      }, {
        y: 2.34,
        rx: 0,
        rz: 0
      }], torC, {
        seg: 36,
        res: 5
      });
      const skC = (x, y, z, u, v) => v > .93 ? shade(hex(r1), .9 + .2 * Math.abs(Math.sin(ang(x, z) * 30))) : v > .89 ? hex(br) : shade(hex(rb), .78 + .14 * Math.sin(ang(x, z) * 11) - .12 * v + .07 * fbm(x * 9, y * 9, z * 9, 2));
      // bel kurdeleleri (çaput) ve deri şeritler
      const rr = y => (.27 + .25 * Math.max(0, 1.56 - y) / 1.06) * 1.05 + .015;
      const rib = (a, len, w, col) => sheet(2, 9, (u, v) => {
        const y = 1.5 - v * len,
          r = rr(y),
          aa = a + (u - .5) * w / r;
        return [Math.sin(aa) * r, y, Math.cos(aa) * r * .74 + .012 * Math.sin(v * 7 + a * 3)];
      }, (x, y, z, u, v) => shade(hex(col), 1 - .32 * v + .05 * Math.sin(v * 30)));
      const RC = [r1, r2, r3, rl, r1, fd, r2, r3];
      const ribs = [];
      for (let i = 0; i < 16; i++) {
        const a = .32 + i / 15 * (Math.PI * 2 - .64);
        ribs.push(rib(a, .5 + .32 * Math.abs(Math.sin(i * 2.7)), .05 + .02 * (i % 3), RC[i % RC.length]));
      }
      // kemerden sarkan çıngıraklar ve küzgü (ayna)
      const bell = c => lathe([[0, .045], [.018, .04], [.032, .008], [.036, -.012], [.03, -.016], [0, -.012]], c, 10, {
        res: 2
      });
      const charms = [[-.7, 1.43], [-.35, 1.4], [.35, 1.4], [.7, 1.43]].map(([a, y], i) => at(i % 2 ? bell(br) : paint(lathe([[0, .012], [.05, .008], [.055, -.004], [0, -.006]], br, 14, {
        res: 2
      }), (x, y2, z) => Math.hypot(x, z) > .044 ? hex(br) : shade(hex(0xdfe4ea), 1.05)), Math.sin(a) * .29, y, Math.cos(a) * .215 + .02, i % 2 ? null : [P2, 0, 0]));
      // kürk yaka ve kemik boncuk kolye
      const collar = limb([...Array(15)].map((_, i) => {
        const a = .5 + i / 14 * (Math.PI * 2 - 1);
        return [Math.sin(a) * .3, 2.2 + .04 * Math.cos(a), Math.cos(a) * .205 - .01];
      }), [[0, .02, .02], [.15, .1, .09], [.5, .115, .1], [.85, .1, .09], [1, .02, .02]], (x, y, z) => shade(mixc(hex(fd), hex(fr), Math.max(0, fbm(x * 12, y * 12, z * 12, 2) + .25)), .8 + .15 * fbm(x * 26, y * 26, z * 26, 1)), {
        fwd: [0, 1, 0],
        rad: 10,
        seg: 4,
        disp: (x, y, z) => .8 * shag(x, y, z, 12, .3)
      });
      const beads = [...Array(11)].map((_, i) => {
        const t = (i - 5) / 5,
          x = t * .17,
          y = 2.0 + .12 * t * t,
          z = .205 + .02 * (1 - t * t);
        return at(ellip(i % 3 == 1 ? .024 : .016, i % 3 == 1 ? .03 : .016, .014, i % 3 == 1 ? br : bn), x, y, z);
      });
      // baş: yaşlı yüz, gri sakal, saçaklı başlık, boynuzlar, tüyler
      const hc = [0, 2.6, .02];
      const head = at(ellip(.15, .19, .17, (x, y, z) => shade(hex(sk), .9 + .12 * Math.max(0, z * 4)), {
        disp: (nx, ny, nz) => ny < -.25 ? -.07 * (-ny - .25) * Math.abs(nx) * 2 : 0
      }), ...hc);
      const nose = limb([[0, 2.63, .16], [0, 2.585, .196], [0, 2.56, .2]], [[0, .024, .022], [1, .031, .028]], shade(hex(sk), 1.03), {
        rad: 8,
        seg: 3
      });
      const brows = [-1, 1].map(s => at(ellip(.06, .02, .028, hb), s * .058, 2.665, .152, [0, 0, s * -.22]));
      const sock = [-1, 1].map(s => at(ellip(.03, .02, .012, 0x1a120c), s * .056, 2.618, .158));
      const ears = [-1, 1].map(s => at(ellip(.024, .048, .038, shade(hex(sk), .9)), s * .152, 2.6, .02));
      const hbC = (x, y, z) => shade(mixc(hex(hb), hex(0xd8d6d0), Math.max(0, fbm(x * 40, y * 8, z * 40, 2) + .15)), .72 + .4 * Math.abs(Math.sin(x * 90 + fbm(x * 10, y * 10, z * 10, 1) * 3)));
      const beard = [at(blob(.15, hbC, {
        sx: 1.05,
        sy: 1.15,
        sz: .68,
        amp: .22,
        fr: 5
      }), 0, 2.44, .1), limb([[0, 2.38, .14], [0, 2.28, .17], [0, 2.18, .175], [0, 2.08, .16]], [[0, .085, .055], [.5, .065, .045], [1, .012, .012]], hbC, {
        rad: 10,
        seg: 5,
        disp: (x, y, z) => .5 * shag(x, y, z, 26, .3)
      })];
      const mous = [-1, 1].map(s => limb([[s * .02, 2.55, .198], [s * .07, 2.528, .19], [s * .1, 2.47, .17], [s * .11, 2.38, .15]], [[0, .018, .022], [.5, .016, .018], [1, .006, .008]], hb, {
        rad: 7,
        seg: 3
      }));
      const cap = loft([{
        y: 2.98,
        rx: 0,
        rz: 0,
        cz: -.04
      }, {
        y: 2.95,
        rx: .07,
        rz: .07,
        cz: -.03
      }, {
        y: 2.88,
        rx: .15,
        rz: .155,
        cz: -.01
      }, {
        y: 2.8,
        rx: .178,
        rz: .19,
        cz: .0
      }, {
        y: 2.7,
        rx: .182,
        rz: .196,
        cz: .01
      }, {
        y: 2.68,
        rx: 0,
        rz: 0,
        cz: .01
      }], (x, y, z) => y < 2.77 ? shade(hex(rk), .9 + .25 * Math.abs(Math.sin(ang(x, z) * 14))) : shade(hex(fd), .85 + .15 * fbm(x * 20, y * 20, z * 20, 2)), {
        seg: 28,
        res: 4,
        disp: (x, y, z) => y > 2.78 ? .6 * shag(x, y, z, 14, .2) : 0
      });
      const discs = [-.9, -.45, 0, .45, .9].map(a => at(lathe([[0, .006], [.028, .004], [.03, -.003], [0, -.004]], br, 12, {
        res: 2
      }), Math.sin(a) * .188, 2.735, Math.cos(a) * .2 + .012, [P2, 0, -a]));
      const fringe = [];
      for (let i = 0; i < 11; i++) {
        const a = (i - 5) / 5 * .95,
          x0 = Math.sin(a) * .19,
          z0 = Math.cos(a) * .205 + .014,
          len = .15 + .05 * Math.cos(a * 2),
          y0 = 2.69;
        fringe.push(limb([[x0, y0, z0], [x0 * 1.02, y0 - len * .5, z0 + .012], [x0 * 1.03, y0 - len, z0 + .018]], [[0, .004, .004], [1, .004, .004]], rk, {
          rad: 4,
          seg: 3,
          cap: 0
        }));
        for (let k = 1; k <= 3; k++) fringe.push(at(ellip(.011, .011, .011, k == 3 ? r1 : (i + k) % 2 ? bn : br), x0 * 1.02, y0 - len * k / 3, z0 + .006 * k));
      }
      const antler = s => [limb([[s * .12, 2.86, -.03], [s * .22, 3.02, -.05], [s * .31, 3.2, -.1], [s * .33, 3.38, -.17], [s * .29, 3.52, -.24]], [[0, .032, .032], [.5, .024, .024], [1, .008, .008]], (x, y, z) => shade(hex(bn), .8 + .3 * (y - 2.8)), {
        rad: 7,
        seg: 5
      }), limb([[s * .24, 3.07, -.06], [s * .36, 3.12, .02], [s * .43, 3.2, .05]], [[0, .018, .018], [1, .005, .005]], bn, {
        rad: 6,
        seg: 3
      }), limb([[s * .315, 3.24, -.11], [s * .43, 3.31, -.08], [s * .48, 3.4, -.08]], [[0, .016, .016], [1, .004, .004]], bn, {
        rad: 6,
        seg: 3
      }), limb([[s * .325, 3.36, -.16], [s * .4, 3.46, -.12], [s * .42, 3.54, -.12]], [[0, .012, .012], [1, .003, .003]], bn, {
        rad: 5,
        seg: 3
      })];
      const feath = [[-.07, -.35, .7], [.07, .35, .75], [0, 0, .82]].map(([x0, yaw, ln], i) => sheet(4, 12, (u, v) => {
        const L = .42 * ln,
          w = .07 * Math.pow(Math.sin(Math.PI * Math.min(1, v * 1.08 + .04)), .7),
          c = Math.cos(.75),
          sn = Math.sin(.75),
          y = 2.84 + v * L * c,
          z = -.15 - v * L * sn - .06 * v * v,
          x = x0 + Math.sin(yaw) * v * L * .3 + (u - .5) * w;
        return [x, y, z + .012 * Math.sin(u * Math.PI)];
      }, (x2, y, z, u, v) => Math.abs(u - .5) < .07 ? hex(bn) : v > .78 ? shade(hex(0x1c1a18), .9) : shade(hex(i == 2 ? r1 : 0xc8bfae), .75 + .3 * v + .08 * Math.sin(u * 40))));
      // sırtta tüngür (davul)
      const drum = at(lathe([[0, .035], [.27, .035], [.3, .03], [.31, 0], [.3, -.03], [.27, -.035], [0, -.035]], (x, y, z) => {
        const r = Math.hypot(x, z);
        if (r > .27) return shade(hex(rk), .9);
        if (Math.abs(y) < .03) return hex(rk);
        const a = Math.atan2(z, x),
          ring = Math.abs(r - .2) < .012,
          ray = r < .19 && r > .05 && Math.abs((a * 8 / Math.PI % 1 + 1) % 1 - .5) > .45,
          dot = Math.hypot(x - .08, z - .06) < .03 || Math.hypot(x + .1, z + .05) < .025;
        return ring || ray || dot ? hex(r1) : shade(hex(0xc8b48a), .9 + .07 * fbm(x * 12, y * 12, z * 12, 2));
      }, 28, {
        res: 2
      }), 0, 1.88, -.33, [P2 - .25, 0, .12]);
      const dbells = [-.5, 0, .5].map(a => at(bell(br), Math.sin(a) * .3, 1.88 - Math.cos(a) * .3 * Math.cos(.25) - .03, -.33 - .06, [0, 0, 0]));
      // asa: dönen tepe, kurdeleler, çıngıraklar (önkol ≈-1.3 eğilince dik durur)
      const grip = [0, -.92, .12],
        SR = [1.3, 0, 0];
      const staff = [limb([[0, -1.62, .12], [0, -.5, .13], [0, .5, .12], [0, 1.45, .11], [0, 1.6, .1]], [[0, .026, .026], [.5, .033, .033], [1, .03, .03]], (x, y, z) => shade(hex(wd), .75 + .35 * Math.abs(Math.sin(y * 14 + Math.atan2(x, z) * 2))), {
        rad: 8,
        seg: 6
      }), limb([[0, 1.58, .1], [.08, 1.72, .12], [.075, 1.88, .16], [-.02, 1.96, .19], [-.1, 1.9, .17], [-.11, 1.8, .14]], [[0, .03, .03], [1, .01, .01]], wd, {
        rad: 7,
        seg: 6
      }), ...[[r1, .05], [r2, -.04], [r3, .0]].map(([c, dx]) => sheet(2, 7, (u, v) => [dx + (u - .5) * .035, 1.5 - v * .42, .135 + .035 * Math.sin(v * 5 + dx * 20) + .02 * v], (x, y, z, u, v) => shade(hex(c), 1 - .3 * v))), ...[-1, 1].map(s => at(bell(br), s * .05, 1.42, .12))].map(g => about(at(g, 0, -.92, 0), grip, SR));
      const orb = V(aboutP([-.01, -.92 + 1.84, .165], grip, SR), [o.sh[0], o.sh[1], o.sh[2]]);
      const legC = (x, y, z) => shade(hex(rk), .9 + .12 * fbm(x * 9, y * 9, z * 9, 2));
      return skRig(S, [[torso, ['hip', 'sp', 'ch']], ...skirtSet(S, 1.56, .5, .27, .52, skC, {
        gap: .05,
        slit: 1.3,
        fold: .06,
        nf: 11
      }), ...ribs.map(g => [g, skirtW(S, 1.5, .62, .9, .24)]), [charms, 'hip'], [collar, 'ch'], [beads, 'ch'], [[drum, ...dbells], 'ch'], [[head, nose, ...brows, ...sock, ...ears, ...beard, ...mous, cap, ...discs, ...fringe, ...antler(-1), ...antler(1), ...feath], 'hd'], [atv(cape2(.3, .44, 1.4, (x, y, z, u, v) => v > .9 ? hex(r1) : shade(hex(rl), .95 - .35 * v + .08 * fbm(x * 12, y * 12, z * 12, 2)), {
        rag: .14,
        nf: 7,
        fold: .05
      }), [0, 2.2, -.24]), capeB], ...limbs(S, o, (sx, s) => ({
        up: armH(sx, {
          k: .96,
          col: (x, y, z) => shade(hex(rb), .85 + .1 * Math.sin(y * 30))
        }),
        fa: [...handH(sx, sk, .96), limb([[sx * .026, -.46, .005], [sx * .016, -.64, .03], [0, -.79, .05]], [[0, .1, .1], [.55, .12, .12], [1, .15, .14]], (x, y, z, u) => u > .85 ? hex(r1) : shade(hex(rb), .85 + .1 * Math.sin(y * 30)), {
          rad: 12,
          seg: 4,
          cap: 0
        }), ...(s ? staff : [])]
      }), () => {
        const l = legH({
          k: .95,
          col: legC,
          shoe: rk
        });
        l.extra = bootShaft(-.66, .95, rk, fd);
        return l;
      })], [{
        p: [-.056, 2.618, .166],
        r: .02,
        c: ey,
        glow: .28
      }, {
        p: [.056, 2.618, .166],
        r: .02,
        c: ey,
        glow: .28
      }, {
        p: orb,
        r: .12,
        c: ey,
        bone: 'fa1',
        glow: 2.2
      }], {
        gait: {
          st: .62,
          kn: 1.0,
          ln: .8,
          ar: .5,
          el: [.6, 1.1],
          hy: .9,
          staff: 1
        }
      });
    }

    // ---------- ayrı türden kahraman gövdeleri (Kemik, Anka, Çalı, Tulpar)
    // Hepsi humSK iskeletini (aynı kemik adları) kullanır; koşu, zıplama, kayma ve saldırı animasyonu ortak.
    const mid3 = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
    // y yüksekliğine göre gövde kemikleri arasında yumuşak geçiş
    const trunkW = (y, a, b, y0, y1) => {
      const t = smt((y - y0) / (y1 - y0));
      return [[a, 1 - t], [b, t]];
    };
    // tüy kanat: iki yüzlü levha, arka kenarı sivri tüy uçlu. s taraf (-1/1)
    // yerel düzlem: x açıklık (dışa), y yukarı; tüyler ön kenardan aşağı ve uca doğru dışa yelpazelenir
    function fWing(s, o) {
      const g = sheet(o.nu || 56, 7, (u, v) => {
        const th = o.fan * u,
          L = (o.ch0 + (o.ch1 - o.ch0) * u * u) * (1 - o.rag * Math.abs(Math.sin(u * Math.PI * o.nf))),
          x = o.span * u + Math.sin(th) * v * L,
          y = o.up * Math.sin(u * Math.PI * .6) - Math.cos(th) * v * L,
          z = -.06 * Math.sin(Math.PI * v) - o.cup * u * u;
        return [s * x, y, z];
      }, (x, y, z, u, v) => o.col(u, v));
      return at(g, s * o.root[0], o.root[1], o.root[2], [o.rx || 0, s * o.ry, s * (o.rz || 0)]);
    }

    // ----- KEMİK: mezardan kalkmış iskelet. Açık kaburga kafesi, ince kemik uzuvlar, yırtık bel bezi
    function hKemik() {
      const bn = 0xe2d6bc,
        bd = 0xa8987a,
        so = 0x140e0a,
        rg = 0x4e3e2c,
        rs = 0x7a4a2a,
        ey = 0x7ff0d0;
      const o = {
          ...HBASE,
          sh: [.36, 2.2, 0],
          hj: [.13, 1.3, 0]
        },
        S = humSK(o);
      const bc = (x, y, z) => shade(hex(bn), .84 + .2 * fbm(x * 13, y * 13, z * 13, 2));
      // uçları topuzlu uzun kemik
      const lb = (a, b, r, k = 1.6) => limb([a, mid3(a, b), b], [[0, r * k, r * k], [.16, r, r], [.84, r * 1.05, r * 1.05], [1, r * k, r * k]], bc, {
        rad: 8,
        seg: 3
      });
      const torW = ['hip', 'sp', 'ch'];
      // leğen
      const pelvis = [at(ellip(.17, .09, .11, bc), 0, 1.35, -.01), ...[-1, 1].map(s => at(ellip(.12, .13, .04, bc), s * .13, 1.44, -.03, [0, s * .5, s * .35]))];
      // omurga: bel öne, sırt geriye kavisli
      const spine = [];
      for (let i = 0; i < 12; i++) {
        const y = 1.4 + i * .085,
          z = -.03 - .11 * smt((y - 1.55) / .4) + .06 * smt((y - 2.2) / .2);
        spine.push(at(ellip(.042, .03, .042, bc), 0, y, z), at(ellip(.014, .024, .035, bd), 0, y, z - .05));
      }
      // kaburgalar: omurgadan öne kıvrılır, göğüste boşluk; alt ikisi kısa
      const ribs = [];
      for (let i = 0; i < 6; i++) {
        const y = 2.14 - i * .085,
          rx = .25 - .016 * Math.abs(i - 2),
          rz = .18,
          fl = i > 3;
        for (const s of [-1, 1]) {
          const A = [Math.PI - .2, 2.4, 1.65, 1.0, fl ? .62 : .32];
          ribs.push(tube(A.map((a, j) => [s * Math.sin(a) * rx, y - .09 * j / 4, Math.cos(a) * rz - .01]), [.022, .02, .019, .017, .014], bc, {
            rad: 6,
            seg: 4
          }));
        }
      }
      const stern = limb([[0, 2.2, .17], [0, 2.02, .18], [0, 1.84, .16]], [[0, .018, .04], [.6, .018, .034], [1, .014, .016]], bc, {
          rad: 6,
          seg: 3
        }),
        clav = [-1, 1].map(s => tube([[s * .03, 2.22, .16], [s * .18, 2.25, .12], [s * .33, 2.24, .02]], [.022, .02, .024], bc, {
          rad: 6,
          seg: 3
        })),
        scap = [-1, 1].map(s => at(ellip(.1, .13, .022, bc), s * .17, 2.08, -.18, [0, s * -.3, 0]));
      // boyun omurları ve kafatası
      const neck = [0, 1, 2].map(i => at(ellip(.036, .028, .036, bc), 0, 2.36 + i * .055, -.05 + i * .02));
      const skull = [at(ellip(.158, .16, .178, bc), 0, 2.72, -.02), at(ellip(.13, .12, .125, bc), 0, 2.62, .05), ...[-1, 1].map(s => at(ellip(.048, .044, .03, so), s * .06, 2.645, .162)), at(slab([[-.022, 0], [.022, 0], [0, .055]], .03, so), 0, 2.56, .168), ...[-1, 1].map(s => at(ellip(.035, .03, .06, bc), s * .115, 2.6, .07)), at(ellip(.095, .045, .1, bc), 0, 2.495, .07), ...[-1, 1].map(s => at(ellip(.025, .06, .03, bc), s * .09, 2.53, 0))];
      const teeth = [...Array(7)].map((_, i) => {
        const a = (i - 3) * .2;
        return at(ellip(.015, .02, .012, 0xf2ecda), Math.sin(a) * .105, 2.54, .055 + Math.cos(a) * .105);
      });
      // yırtık bel bezi ve ip kemer (pelerin/cüppe yok)
      const ragC = (x, y, z, u, v) => shade(hex(rg), .95 - .35 * v + .18 * fbm(x * 18, y * 18, z * 18, 2));
      const rag = (a0, a1, len) => sheet(12, 8, (u, v) => {
        const a = a0 + (a1 - a0) * u,
          r = .2 + .08 * v,
          y = 1.47 - v * len * (1 - .25 * Math.abs(Math.sin(u * 13 + a0 * 3)));
        return [Math.sin(a) * r, y, Math.cos(a) * r * .82];
      }, ragC);
      const belt = tube([...Array(17)].map((_, i) => {
        const a = i / 16 * Math.PI * 2;
        return [Math.sin(a) * .205, 1.48 + .012 * Math.sin(a * 3), Math.cos(a) * .17];
      }), Array(17).fill(.022), 0x5a4630, {
        rad: 6,
        seg: 2
      });
      const skW = skirtW(S, 1.47, .95, .9, .2);
      // paslı tek omuzluk
      const rustC = (x, y, z) => shade(mixc(hex(0x6a6a70), hex(rs), smt(.5 + 1.8 * fbm(x * 14 + 2, y * 14, z * 14, 2))), .8 + .3 * fbm(x * 30, y * 30, z * 30, 2));
      // kemik topuz (uyluk kemiği) sağ elde
      const hp = [0, -.92, .08];
      const club = [lb([0, -.92, -.1], [0, -.92, .62], .034, 1.4), at(ellip(.06, .055, .06, bc), .035, -.92, .66), at(ellip(.06, .055, .06, bc), -.035, -.92, .66), at(ellip(.055, .05, .05, bc), 0, -.92, -.13)].map(g => about(g, hp, [.55, 0, 0]));
      const arm = (sx, s) => {
        const el = [sx * .03, -.44, 0];
        return {
          up: lb([0, -.03, 0], el, .03),
          ua: [at(ellip(.055, .05, .055, bc), 0, -.01, 0)],
          pad: s ? null : at(lathe([[0, .07], [.08, .062], [.14, .038], [.18, 0], [.185, -.02], [.16, -.012], [0, .02]], rustC, 20), sx * .04, .03, 0, [0, 0, sx * -.5]),
          fa: [lb([el[0] - .02, -.47, 0], [-.02, -.84, .05], .017), lb([el[0] + .02, -.47, 0], [.02, -.84, .05], .02), at(ellip(.045, .04, .03, bc), 0, -.89, .06), ...[-1.5, -.5, .5, 1.5].map(k => tube([[k * .02, -.91, .065], [k * .024, -.98, .085], [k * .024, -1.03, .12]], [.011, .01, .008], bc, {
            rad: 5,
            seg: 2
          })), tube([[sx * -.035, -.88, .08], [sx * -.055, -.94, .11]], [.011, .009], bc, {
            rad: 5,
            seg: 2
          }), ...(s ? club : [])]
        };
      };
      const leg = (sx, s) => ({
        tube: lb([0, .02, 0], [0, -.55, .035], .036),
        tb: 'th' + s,
        knee: at(ellip(.045, .05, .03, bc), 0, -.58, .08),
        extra: [lb([0, -.61, .04], [0, -1.1, -.01], .03), lb([sx * .035, -.63, 0], [sx * .03, -1.08, -.02], .016)],
        boot: merge(at(ellip(.045, .04, .06, bc), 0, -1.2, -.06), at(ellip(.055, .03, .09, bc), 0, -1.23, .06), ...[-1.5, -.5, .5, 1.5].map(k => tube([[k * .022, -1.24, .12], [k * .028, -1.28, .2], [k * .03, -1.29, .26]], [.014, .012, .01], bc, {
          rad: 5,
          seg: 2
        })))
      });
      return skRig(S, [[pelvis, 'hip'], [spine, torW], [ribs, ['sp', 'ch']], [[stern, ...clav, ...scap], 'ch'], [neck, (x, y, z) => y > 2.42 ? [['hd', 1]] : [['hd', .5], ['ch', .5]]], [[...skull, ...teeth], 'hd'], [rag(-.75, .75, .5), skW], [rag(Math.PI - .8, Math.PI + .8, .42), skW], [belt, torW], ...limbs(S, o, arm, leg)], [{
        p: [-.06, 2.645, .19],
        r: .022,
        c: ey,
        glow: .5
      }, {
        p: [.06, 2.645, .19],
        r: .022,
        c: ey,
        glow: .5
      }], {
        gait: {
          st: .85,
          kn: 1.4,
          ln: 1.2,
          ar: .85,
          el: [.7, .9],
          hy: 1.1
        }
      });
    }

    // ----- ANKA: zümrüdüanka kuş-insan. Gagalı baş, tüy ibik, geniş ateş kanatları, tüy kuyruk, pençe ayaklar
    function hAnka() {
      const rd = 0xb8261a,
        or = 0xf06a1c,
        gd = 0xffc23a,
        yl = 0xffeccc,
        ch = 0xf28a34,
        cu = 0xfaa64c, // göğüs: kehribar (malzeme bunu altın metal saymasın diye parlaklık sınırlı)
        bk = 0xe8b030,
        tl = 0x2a1a10,
        lg = 0xd8902a,
        ey = 0xfff07a;
      const o = {
          ...HBASE,
          sh: [.37, 2.18, 0],
          cape: [0, 1.5, -.25, 1.25]
        },
        S = humSK(o);
      const fire = t => (t = Math.max(0, Math.min(1, t)), t < .5 ? mixc(hex(rd), hex(or), t * 2) : mixc(hex(or), hex(gd), t * 2 - 1));
      // tüy pulları: satır satır kaydırılmış yarım daireler
      const scl = (x, y, z) => .93 + .09 * Math.abs(Math.sin(y * 26 + .6 * Math.abs(Math.sin(ang(x, z) * 5))));
      const torC = (x, y, z) => shade(mixc(fire(.1 + .3 * (y - 1.2)), mixc(hex(ch), hex(cu), Math.min(1, Math.max(0, (y - 1.4) * 1.2))), smt(z / .28 + .2)), scl(x, y, z));
      const torso = loft([{
        y: 1.12,
        rx: 0,
        rz: 0
      }, {
        y: 1.18,
        rx: .17,
        rz: .15
      }, {
        y: 1.3,
        rx: .27,
        rz: .23
      }, {
        y: 1.5,
        rx: .31,
        rz: .27,
        cz: .02
      }, {
        y: 1.75,
        rx: .33,
        rz: .29,
        cz: .05
      }, {
        y: 1.97,
        rx: .34,
        rz: .28,
        cz: .06
      }, {
        y: 2.14,
        rx: .31,
        rz: .23,
        cz: .04
      }, {
        y: 2.27,
        rx: .21,
        rz: .17,
        cz: .02
      }, {
        y: 2.37,
        rx: .13,
        rz: .12,
        cz: .02
      }, {
        y: 2.42,
        rx: 0,
        rz: 0
      }], torC, {
        seg: 40,
        res: 5
      });
      // boyun tüy yakası (dikenli)
      const ruff = at(ellip(.2, .1, .19, (x, y, z) => mixc(hex(rd), hex(or), smt(.5 - y * 5)), {
        ws: 36,
        hs: 8,
        disp: (x, y, z) => .6 * Math.pow(Math.max(0, Math.sin(Math.atan2(x, z) * 12)), 2) * Math.max(0, .3 - y)
      }), 0, 2.38, .02);
      const neck = limb([[0, 2.3, 0], [0, 2.45, .02], [0, 2.58, .04]], [[0, .12, .12], [1, .1, .1]], or, {
        rad: 10,
        seg: 3
      });
      // baş: arka kırmızı, yüz altın; kancalı gaga
      const head = at(ellip(.165, .17, .185, (x, y, z) => shade(mixc(hex(rd), hex(gd), smt((z + .02) / .2)), .9 + .12 * fbm(x * 20, y * 20, z * 20, 2))), 0, 2.66, .04);
      const beak = [limb([[0, 2.67, .17], [0, 2.66, .29], [0, 2.62, .39], [0, 2.55, .44], [0, 2.5, .43]], [[0, .065, .07], [.35, .045, .045], [.7, .03, .026], [1, .006, .006]], (x, y, z, u, v) => shade(hex(bk), 1.05 - .45 * v), {
        fwd: [0, 1, 0],
        rad: 10,
        seg: 4
      }), limb([[0, 2.6, .16], [0, 2.585, .27], [0, 2.575, .33]], [[0, .04, .05], [1, .008, .01]], 0xc89028, {
        fwd: [0, 1, 0],
        rad: 8,
        seg: 3
      })];
      const eyeR = [-1, 1].map(s => at(ellip(.02, .045, .045, 0x3a0e08), s * .128, 2.705, .132, [0, -s * .64, 0]));
      // ibik: ortası en uzun beş tüy, geriye kıvrık. Tepenin arkasından çıkar ki şapka önüne otursun (eskiden şapkanın içinden geçiyordu)
      const crest = [-2, -1, 0, 1, 2].map(k => {
        const h = 1 - .14 * Math.abs(k);
        return limb([[k * .03, 2.78, -.07], [k * .07, 2.78 + .17 * h, -.17], [k * .12, 2.78 + .31 * h, -.33], [k * .15, 2.78 + .4 * h, -.5]], [[0, .018, .03], [.4, .022, .055], [.85, .016, .05], [1, .004, .01]], (x, y, z, u, v) => v > .8 ? hex(yl) : fire(.2 + v * .8), {
          fwd: [0, 0, 1],
          rad: 8,
          seg: 4
        });
      });
      // geniş, yana açılan ateş kanatları
      const wingC = (u, v) => shade(v > .7 ? mixc(fire(.55 + .4 * u), hex(yl), (v - .7) / .3) : fire(.05 + .55 * u + .25 * v), .82 + .22 * Math.abs(Math.sin(u * Math.PI * 14)));
      const wings = [-1, 1].map(s => fWing(s, {
        root: [.14, 2.2, -.2],
        span: .72,
        up: .5,
        ch0: .5,
        ch1: .82,
        fan: .95,
        rag: .3,
        nf: 7,
        cup: .1,
        ry: .45,
        col: wingC
      }));
      // ateş kuyruğu: beş uzun tüy, uçlarında altın göz
      const tail = [-2, -1, 0, 1, 2].map(k => {
        const e = 1 - .12 * Math.abs(k);
        return limb([[k * .04, 1.48, -.24], [k * .1, 1.05, -.36], [k * .16, .65 + .35 * (1 - e), -.5], [k * .2, .25 + .5 * (1 - e), -.62]], [[0, .02, .05], [.4, .025, .08], [.78, .02, .1], [.92, .02, .11], [1, .005, .02]], (x, y, z, u, v) => v > .86 ? hex(Math.abs(v - .93) < .025 ? rd : yl) : fire(v * .9), {
          fwd: [0, 0, 1],
          rad: 8,
          seg: 4
        });
      });
      // kollar: tüylü, arkasında tüy saçağı; pençe eller
      const armC = (x, y, z) => shade(fire(.3), .88 + .16 * fbm(x * 12, y * 12, z * 12, 2));
      const fringe = sx => sheet(30, 4, (u, v) => {
        const p = u < .5 ? [sx * .06 * u, -.88 * u, 0] : [sx * .03 * (2 - u * 2), -.44 - .41 * (u * 2 - 1), .05 * (u * 2 - 1)],
          L = (.14 + .14 * u) * (1 - .35 * Math.abs(Math.sin(u * Math.PI * 6)));
        return [p[0] + sx * (.06 + .25 * v * L), p[1] - .02 - .3 * v * L, p[2] - .06 - .9 * v * L];
      }, (x, y, z, u, v) => v > .7 ? hex(gd) : fire(.15 + .5 * v));
      const talon = sx => [at(ellip(.05, .06, .05, armC), 0, -.91, .06), ...[-1, 0, 1].map(k => limb([[k * .03, -.95, .07], [k * .04, -1.03, .1], [k * .04, -1.08, .15]], [[0, .02, .02], [1, .004, .004]], tl, {
        rad: 6,
        seg: 3
      })), limb([[sx * -.04, -.92, .08], [sx * -.07, -.97, .12]], [[0, .018, .018], [1, .004, .004]], tl, {
        rad: 6,
        seg: 3
      })];
      const legC = (x, y, z) => shade(hex(lg), .78 + .28 * Math.abs(Math.sin(y * 60)));
      const leg = (sx, s) => ({
        tube: limb([[0, -.5, .03], [0, -.85, 0], [0, -1.15, -.01]], [[0, .06, .06], [.5, .045, .045], [1, .042, .042]], legC, {
          rad: 8,
          seg: 4
        }),
        tb: 'sh' + s,
        // tüylü pantolon
        th: [at(ellip(.17, .3, .17, (x, y, z) => fire(.12 + .45 * (.3 - y) / .6), {
          disp: (x, y, z) => .18 * Math.max(0, -y) * Math.abs(Math.sin(Math.atan2(x, z) * 8))
        }), 0, -.24, .02)],
        boot: merge(at(ellip(.06, .05, .07, legC), 0, -1.2, 0), ...[-1, 0, 1].map(k => limb([[0, -1.2, .02], [k * .07, -1.26, .14], [k * .1, -1.28, .24]], [[0, .035, .035], [1, .022, .022]], legC, {
          rad: 6,
          seg: 3
        })), ...[-1, 0, 1].map(k => limb([[k * .1, -1.27, .24], [k * .11, -1.27, .3], [k * .11, -1.3, .33]], [[0, .02, .02], [1, .003, .003]], tl, {
          rad: 6,
          seg: 3
        })), limb([[0, -1.2, -.02], [0, -1.27, -.13], [0, -1.3, -.16]], [[0, .025, .025], [1, .004, .004]], tl, {
          rad: 6,
          seg: 3
        }))
      });
      return skRig(S, [[torso, ['hip', 'sp', 'ch']], [ruff, 'ch'], [neck, (x, y, z) => trunkW(y, 'ch', 'hd', 2.32, 2.5)], [[head, ...beak, ...eyeR, ...crest], 'hd'], [wings, 'ch'], [tail, capeB], ...limbs(S, o, (sx, s) => ({
        up: armH(sx, {
          k: .92,
          col: armC
        }),
        env: [fringe(sx)],
        fa: talon(sx)
      }), leg)], [{
        p: [-.135, 2.705, .14],
        r: .026,
        c: ey,
        glow: .45
      }, {
        p: [.135, 2.705, .14],
        r: .026,
        c: ey,
        glow: .45
      }], {
        gait: {
          st: .8,
          kn: 1.3,
          ln: 1.1,
          ar: .6,
          el: [.9, .9],
          hy: 1.1
        }
      });
    }

    // ----- ÇALI: yürüyen çalı. Yaprak yumağı gövde, dal kollar, kök ayaklar, kovuktan parlayan gözler
    function hCali() {
      const l1 = 0x2a5620,
        l2 = 0x4e8a2c,
        l3 = 0x8ab840,
        bk = 0x5a3e24,
        hl = 0x0e0703,
        ey = 0xe8ff6a,
        br = 0xc8302a;
      const o = {
          hip: [0, .95, 0],
          sp: [0, 1.25, 0],
          ch: [0, 1.62, 0],
          nk: [0, 2.08, 0],
          hdT: [0, 2.45, 0],
          sh: [.56, 1.6, 0],
          el: [.06, -.3, .02],
          wr: [.02, -.62, .08],
          hj: [.2, .95, 0],
          kn: [0, -.42, .03],
          an: [0, -.82, -.01],
          sole: -.95,
          heel: -.14,
          toe: .26
        },
        S = humSK(o);
      const leafP = (lo, hi) => (x, y, z) => {
        const n = fbm(x * 7 + 3, y * 7, z * 7, 3);
        return shade(mixc(hex(lo), hex(hi), smt(.5 + n * 1.6)), .7 + .38 * smt((y - .9) / 1.3));
      };
      const barkC = (x, y, z) => shade(hex(bk), .72 + .3 * Math.abs(Math.sin(ang(x, z) * 5 + y * 9)) + .1 * fbm(x * 15, y * 15, z * 15, 2));
      // gövde ağırlığı: alt kalçayla, orta göğüsle, tepe başla döner
      const bushW = (x, y, z) => y > 1.95 ? trunkW(y, 'ch', 'hd', 1.95, 2.2) : y > 1.3 ? trunkW(y, 'sp', 'ch', 1.3, 1.6) : trunkW(y, 'hip', 'sp', 1.0, 1.3);
      // ana yaprak yumağı: yüz bölgesi daha düz bırakılır
      const bush = paint(at(ellip(.66, .64, .6, l2, {
        ws: 30,
        hs: 22,
        disp: (x, y, z) => {
          const f = z > .5 && Math.abs(y - .2) < .45 && Math.abs(x) < .55 ? .25 : 1;
          return f * (.2 * fbm(x * 2.6 + 1, y * 2.6, z * 2.6, 3) + .07 * fbm(x * 9, y * 9, z * 9, 2));
        }
      }), 0, 1.56, 0), leafP(l1, l2));
      // yüzeyde yaprak kümeleri
      const clumps = [];
      for (let i = 0; i < 30; i++) {
        const t = i * 2.39996,
          yy = 1 - 2 * (i + .5) / 30,
          r = Math.sqrt(1 - yy * yy),
          nx = Math.cos(t) * r,
          nz = Math.sin(t) * r;
        if (nz > .55 && yy > -.3 && yy < .62 && Math.abs(nx) < .6) continue;
        if (yy < -.8) continue;
        const k = .8 + .4 * ((i * 7) % 5) / 5;
        clumps.push(paint(at(ellip(.19 * k, .16 * k, .19 * k, l2, {
          ws: 10,
          hs: 7,
          disp: (x, y, z) => .3 * fbm(x * 3 + i, y * 3, z * 3, 2)
        }), nx * .64, 1.56 + yy * .62, nz * .58), leafP(l2, l3)));
      }
      // tepeden çıkan dallar, uçlarında yaprak; kırmızı yemişler
      const twigs = [[-.15, .3], [.14, -.22], [.32, .12], [-.3, -.12], [.02, .02]].flatMap(([x, z], i) => {
        const tip = [x * 1.7 + .04, 2.46 + i % 3 * .06, z * 1.5];
        return [limb([[x * .8, 2.0, z * .8], [x * 1.2, 2.28 + i % 2 * .06, z * 1.2], tip], [[0, .032, .032], [1, .009, .009]], barkC, {
          rad: 6,
          seg: 3
        }), at(ellip(.07, .045, .07, l3), tip[0], tip[1], tip[2], [0, i, .4])];
      });
      const berries = [[.4, 1.9, .38], [-.46, 1.75, .36], [.55, 1.4, .25], [-.25, 2.12, .3], [.2, 1.18, .5], [-.5, 1.3, .3], [.15, 2.15, -.35]].map(p => at(ellip(.045, .045, .045, br), ...p));
      // kovuk: kabuk halka, karanlık oyuk, ağız yarığı
      const rim = tube([...Array(19)].map((_, i) => {
        const a = i / 18 * Math.PI * 2;
        return [Math.cos(a) * .19, 1.72 + Math.sin(a) * .14, .565 + .03 * Math.sin(a * 3)];
      }), Array(19).fill(.045), barkC, {
        rad: 7,
        seg: 2
      });
      const hollow = at(ellip(.18, .135, .07, hl), 0, 1.72, .54),
        mouth = [at(ellip(.1, .035, .05, hl), 0, 1.47, .6, [0, 0, .08]), tube([[-.12, 1.46, .6], [0, 1.43, .64], [.12, 1.48, .6]], [.025, .03, .025], barkC, {
          rad: 6,
          seg: 3
        })];
      // dal kollar, üç dal parmak
      const arm = (sx, s) => {
        const el = [sx * .06, -.3, .02],
          wr = [sx * .02, -.62, .08];
        return {
          up: limb([[sx * -.12, .08, 0], [0, 0, 0], el, wr], [[0, .08, .08], [.3, .065, .065], [.65, .05, .05], [1, .04, .04]], barkC, {
            rad: 8,
            seg: 4,
            disp: (x, y, z) => .12 * fbm(x * 14, y * 14, z * 14, 2)
          }),
          ua: [paint(at(ellip(.13, .1, .13, l2, {
            ws: 10,
            hs: 7,
            disp: (x, y, z) => .3 * fbm(x * 3, y * 3 + s, z * 3, 2)
          }), sx * .06, -.18, .02), leafP(l2, l3))],
          fa: [-1, 0, 1].flatMap(k => {
            const tip = [wr[0] + sx * k * .09, -.86, .14 + (1 - Math.abs(k)) * .04];
            return [limb([wr, [wr[0] + sx * k * .05, -.75, .11], tip], [[0, .03, .03], [1, .008, .008]], barkC, {
              rad: 6,
              seg: 3
            }), at(ellip(.05, .035, .05, l3), tip[0], tip[1] - .01, tip[2], [0, k, .5])];
          })
        };
      };
      // kök ayaklar
      const leg = (sx, s) => ({
        tube: limb([[0, .05, 0], [0, -.2, .02], [0, -.42, .03], [0, -.65, .01], [0, -.82, -.01]], [[0, .12, .12], [.4, .1, .1], [.75, .095, .095], [1, .12, .12]], barkC, {
          rad: 10,
          seg: 3,
          disp: (x, y, z) => .1 * fbm(x * 12, y * 12, z * 12, 2)
        }),
        boot: merge(...[-.9, -.3, .3, .9, Math.PI].map(a => {
          const L = a == Math.PI ? .2 : .27;
          return limb([[0, -.8, 0], [Math.sin(a) * L * .45, -.9, Math.cos(a) * L * .5], [Math.sin(a) * L, -.95, Math.cos(a) * L]], [[0, .06, .06], [.5, .04, .04], [1, .012, .012]], barkC, {
            rad: 6,
            seg: 3
          });
        }))
      });
      return skRig(S, [[[bush, ...clumps, ...berries], bushW], [twigs, 'hd'], [[rim, hollow, ...mouth], 'ch'], ...limbs(S, o, arm, leg)], [{
        p: [-.07, 1.735, .6],
        r: .036,
        c: ey,
        bone: 'ch',
        glow: .8
      }, {
        p: [.07, 1.735, .6],
        r: .036,
        c: ey,
        bone: 'ch',
        glow: .8
      }], {
        gait: {
          st: .6,
          kn: 1.1,
          ln: .5,
          ar: .9,
          el: [.5, .5],
          hy: 1.5
        }
      });
    }

    // ----- TULPAR: kanatlı at. At başı ve yele, dik ak kanatlar, at kuyruğu, toynak ayaklar
    function hTulpar() {
      const wh = 0xfcfaf6,
        mn = 0xd0e2fa,
        mb = 0x8aaed4,
        hf = 0x3a3e48,
        gd = 0xd8b050,
        cl = 0x2e4a7a,
        sk = 0x9a7a6a,
        ey = 0x9fd8ff;
      const o = {
          ...HBASE,
          sh: [.42, 2.2, 0],
          cape: [0, 1.45, -.22, 1.15]
        },
        S = humSK(o);
      const coat = (x, y, z) => shade(hex(wh), .96 + .04 * fbm(x * 10, y * 10, z * 10, 2));
      const coatL = coat;
      const torso = loft([{
        y: 1.18,
        rx: 0,
        rz: 0
      }, {
        y: 1.22,
        rx: .18,
        rz: .14
      }, {
        y: 1.32,
        rx: .27,
        rz: .18
      }, {
        y: 1.46,
        rx: .275,
        rz: .18
      }, {
        y: 1.6,
        rx: .27,
        rz: .18
      }, {
        y: 1.78,
        rx: .31,
        rz: .21,
        cz: .015
      }, {
        y: 1.95,
        rx: .36,
        rz: .24,
        cz: .03,
        n: 2.3
      }, {
        y: 2.09,
        rx: .39,
        rz: .22,
        cz: .015,
        n: 2.5
      }, {
        y: 2.2,
        rx: .33,
        rz: .18,
        n: 2.3
      }, {
        y: 2.28,
        rx: .22,
        rz: .16
      }, {
        y: 2.36,
        rx: 0,
        rz: 0
      }], coat, {
        seg: 40,
        res: 5
      });
      const ring = (y, rx, rz, r, col) => tube([...Array(17)].map((_, i) => {
        const a = i / 16 * Math.PI * 2;
        return [Math.sin(a) * rx, y, Math.cos(a) * rz];
      }), Array(17).fill(r), col, {
        rad: 6,
        seg: 2
      });
      const belt = ring(1.5, .285, .195, .035, 0x5a3e28),
        buckle = at(ellip(.06, .05, .025, gd), 0, 1.5, .22),
        torc = ring(2.27, .21, .17, .03, gd);
      const skC = (x, y, z, u, v) => v > .88 || u < .06 ? hex(gd) : shade(hex(cl), .85 + .12 * Math.sin(ang(x, z) * 9) - .15 * v);
      // uzun at boynu ve başı
      const neck = limb([[0, 2.18, -.03], [0, 2.42, 0], [0, 2.62, .03], [0, 2.78, .04]], [[0, .17, .19], [.4, .14, .15], [1, .12, .12]], coat, {
        rad: 14,
        seg: 4,
        cap: 0
      });
      const muz = (x, y, z) => z > .4 ? mixc(hex(wh), hex(0x8a6a6a), smt((z - .4) / .1)) : coat(x, y, z);
      const head = [limb([[0, 2.86, -.04], [0, 2.84, .08], [0, 2.76, .26], [0, 2.66, .42], [0, 2.62, .5]], [[0, .13, .125], [.25, .145, .13], [.55, .11, .1], [.85, .095, .085], [1, .09, .08]], muz, {
        fwd: [0, 1, 0],
        rad: 16,
        seg: 4
      }), at(ellip(.12, .1, .13, coat), 0, 2.72, .06), ...[-1, 1].map(s => at(ellip(.022, .016, .016, 0x1a1a22), s * .045, 2.64, .575)), ...[-1, 1].map(s => at(ellip(.015, .04, .04, 0x1a2230), s * .122, 2.82, .16, [0, -s * .5, 0]))];
      const ears = [-1, 1].map(s => limb([[s * .07, 2.95, -.02], [s * .1, 3.08, -.03], [s * .11, 3.2, -.06]], [[0, .03, .05], [.5, .028, .045], [1, .003, .004]], (x, y, z) => z > -.02 ? hex(0xd8a8a8) : hex(wh), {
        fwd: [0, 0, 1],
        rad: 8,
        seg: 3
      }));
      // yele: alından enseye, omuza dek dalgalı tutamlar; perçem öne düşer
      const maneC = (x, y, z, u, v) => shade(mixc(hex(mn), hex(mb), v * .85), .92 + .12 * Math.sin(u * 25));
      const manePts = [[0, 3.0, .0], [0, 2.95, -.1], [0, 2.84, -.16], [0, 2.7, -.19], [0, 2.56, -.2], [0, 2.43, -.21], [0, 2.32, -.2]];
      const mane = [limb([[0, 2.98, .08], [0, 2.96, .2], [0, 2.86, .25]], [[0, .04, .06], [1, .008, .012]], maneC, {
        rad: 8,
        seg: 3
      }), ...manePts.map((p, i) => {
        const sd = i % 2 ? 1 : -1,
          L = .3 + .04 * (i % 3);
        return limb([p, [sd * .05, p[1] - .05, p[2] - .12], [sd * .09, p[1] - L * .6, p[2] - .2], [sd * .08, p[1] - L, p[2] - .18]], [[0, .05, .06], [.5, .045, .065], [1, .006, .01]], maneC, {
          rad: 8,
          seg: 3
        });
      })];
      // dik, geriye süpürülmüş ak kanatlar
      const wingC = (u, v) => shade(mixc(hex(wh), hex(mb), Math.min(1, smt((v - .55) / .45) * .8 + u * .1)), .95 + .06 * Math.abs(Math.sin(u * Math.PI * 12)));
      const wings = [-1, 1].map(s => fWing(s, {
        root: [.14, 2.26, -.2],
        span: .55,
        up: .85,
        ch0: .36,
        ch1: .72,
        fan: .45,
        rag: .22,
        nf: 6,
        cup: .1,
        ry: .8,
        col: wingC
      }));
      // at kuyruğu
      const tail = [-2, -1, 0, 1, 2].map(k => limb([[k * .03, 1.5, -.2], [k * .05, 1.4, -.38], [k * .09, 1.02, -.5], [k * .12, .58, -.55], [k * .1, .32, -.5]], [[0, .05, .06], [.2, .07, .08], [.7, .06, .07], [1, .01, .02]], maneC, {
        rad: 8,
        seg: 4
      }));
      const vamb = sx => limb([[sx * .03, -.47, 0], [sx * .018, -.64, .03], [0, -.8, .05]], [[0, .098, .1], [.45, .1, .1], [1, .078, .08]], (x, y, z) => shade(hex(gd), .8 + .4 * Math.max(0, z * 4)), {
        rad: 12,
        seg: 3,
        n: 2.2,
        cap: 0
      });
      const leg = (sx, s) => {
        const l = legH({
          col: coatL,
          shoe: hf
        });
        // toynak: aşağı genişleyen koyu boynuz, üstünde tüylü bilek
        l.boot = at(lathe([[0, -1.1], [.085, -1.11], [.1, -1.18], [.118, -1.27], [.112, -1.3], [0, -1.3]], (x, y, z) => y < -1.285 ? hex(0x24262c) : shade(hex(hf), .85 + 1.2 * (y + 1.3)), 16), 0, 0, .05);
        l.extra = [at(ellip(.13, .1, .13, mn, {
          disp: (x, y, z) => .35 * Math.max(0, -y) * Math.abs(Math.sin(Math.atan2(x, z) * 7))
        }), 0, -1.05, .02)];
        return l;
      };
      return skRig(S, [[torso, ['hip', 'sp', 'ch']], [[belt, buckle], ['hip', 'sp']], ...skirtSet(S, 1.5, .98, .29, .38, skC), [torc, 'ch'], [neck, (x, y, z) => trunkW(y, 'ch', 'hd', 2.3, 2.55)], [[...head, ...ears], 'hd'], [mane, (x, y, z) => y > 2.5 ? [['hd', 1]] : trunkW(y, 'ch', 'hd', 2.3, 2.5)], [wings, 'ch'], [tail, capeB], ...limbs(S, o, (sx, s) => ({
        up: armH(sx, {
          col: coatL
        }),
        pad: at(ellip(.17, .11, .17, (x, y, z) => shade(hex(gd), .8 + 1.2 * Math.max(0, y))), sx * .04, .04, 0, [0, 0, sx * -.3]),
        fa: [...handH(sx, sk), vamb(sx)]
      }), leg)], [{
        p: [-.128, 2.82, .165],
        r: .026,
        c: ey,
        glow: .35
      }, {
        p: [.128, 2.82, .165],
        r: .026,
        c: ey,
        glow: .35
      }], {
        gait: {
          st: .95,
          kn: 1.6,
          ln: 1.3,
          ar: .7,
          el: [.7, .9],
          hy: 1.25
        }
      });
    }

    // palet varyantları: aynı iskelet, farklı kahraman (Börü <- Bahadır, Ayaz <- Kam, Kara Han <- Alp)
    const HVAR = {
      4: {
        b: 3,
        m: {
          0x2a4656: 0x3a3632,
          0xc8862a: 0x8c9096,
          0x9a3a22: 0x5a1c16,
          0x6e5236: 0x8e8c88,
          0x4a3624: 0x5c5a58,
          0x24180f: 0x5e5c5a,
          0x5a3e28: 0x3e3028,
          0x3a2a1e: 0x28221c,
          0xc9a24a: 0xa0a6ae,
          0x3aa0c8: 0xe0a030,
          0x9a7a52: 0x7a7672,
          0x5a4c3e: 0x4a4846
        }
      },
      5: {
        b: 1,
        m: {
          0x4e3a2a: 0x3a5674,
          0x6a4c34: 0x56748e,
          0x2a2018: 0x1c2a38,
          0x9a8a6a: 0xdde6ec,
          0x6e5c44: 0xa8b6c2,
          0xd8cdb2: 0xc9d3d7,
          0xb08a3a: 0xb8c8d6,
          0x8a3a24: 0x6fcbe6,
          0x2e5a7a: 0x2a4a6a,
          0xd8c8a0: 0xccd3d7,
          0xb88a68: 0xc8aa94,
          0x8c8a84: 0xc5cace,
          0x4a3424: 0x5e7282,
          0xff8a3a: 0x9fe8ff,
          0xc8b48a: 0xd8e6ee
        }
      },
      6: {
        b: 0,
        m: {
          0xa8aeb6: 0x45444e,
          0x5c626b: 0x2a2a32,
          0x7a8088: 0x3a3a44,
          0xc8ced6: 0x5a5866,
          0x8e1f1f: 0x4c2468,
          0x5e1414: 0x2c1640,
          0x9a1c18: 0x5a2a7a,
          0xc9a24a: 0x9a3a2a,
          0x3a2618: 0x241a14,
          0xe8e0d0: 0xb8a8c8,
          0xf2f5f8: 0xd8c8f0
        }
      },
      // ---- Faz 4 karakterleri: taban model + palet
      7: { b: 0, m: { 0xa8aeb6: 0xb8783a, 0x5c626b: 0x6e4620, 0x7a8088: 0x8a5a2a, 0xc8ced6: 0xd8a060, 0x8e1f1f: 0x3a4a52, 0x5e1414: 0x24323a, 0x9a1c18: 0x2a6a7a, 0xc9a24a: 0xe0c060, 0x3a2618: 0x2a2420, 0xe8e0d0: 0x9fe8d8, 0xf2f5f8: 0xc89040, 0x140c08: 0x1a6a6a } },
      9: { b: 3, m: { 0x2a4656: 0x8a2a1e, 0xc8862a: 0xd8b060, 0x9a3a22: 0x6a1a12, 0x6e5236: 0xa05a3a, 0x4a3624: 0x8a4a2a, 0xc49270: 0xd0a070, 0x24180f: 0x2a1810, 0x5a3e28: 0x3a2a1e, 0x3a2a1e: 0x2a1a12, 0xc9a24a: 0xffd36a, 0x3aa0c8: 0xffd36a, 0x9a7a52: 0xb07a4a, 0x5a4c3e: 0x4a3a2a } },
      10: { b: 3, m: { 0x2a4656: 0x3a4a2a, 0xc8862a: 0x6a8a3a, 0x9a3a22: 0x5a4a2a, 0x6e5236: 0x4a3a22, 0x4a3624: 0x2e2416, 0xc49270: 0xb08060, 0x24180f: 0x1a1208, 0x5a3e28: 0x3a2e1a, 0x3a2a1e: 0x2a2014, 0xc9a24a: 0x7a6a3a, 0x3aa0c8: 0x8fd06a, 0x9a7a52: 0x5a6a3a, 0x5a4c3e: 0x3a4a2a } },
      11: { b: 2, m: { 0x34525e: 0x2a2428, 0x343943: 0x1a1618, 0x0d0e12: 0x0a0808, 0x5a3e2a: 0x4a3020, 0x352419: 0x2a1a10, 0xc0c7cf: 0x8a8a8a, 0x9a2424: 0xb8261e, 0x5c574e: 0x3a3632, 0x2a2e36: 0xb8261e, 0x1f2b31: 0x1a1618, 0x2e4650: 0x2a2426, 0x6a4c34: 0x5a4030 } },
      12: { b: 1, m: { 0x4e3a2a: 0xf0ead8, 0x6a4c34: 0xe8dcc0, 0x2a2018: 0xb8a890, 0x9a8a6a: 0xdbdbdb, 0x6e5c44: 0xd8d0b8, 0xd8cdb2: 0xd5d1c7, 0xb08a3a: 0xe0c060, 0x8a3a24: 0xffd36a, 0x2e5a7a: 0xc8a040, 0xd8c8a0: 0xdbd5c7, 0xb88a68: 0xe8c8a0, 0x8c8a84: 0xcecece, 0x4a3424: 0xc0a060, 0xff8a3a: 0xfff0a0, 0xc8b48a: 0xf0e8d0 } },
      13: { b: 1, m: { 0x4e3a2a: 0x6a2a5a, 0x6a4c34: 0x8a3a7a, 0x2a2018: 0x3a1830, 0x9a8a6a: 0xe8d060, 0x6e5c44: 0xb8a040, 0xd8cdb2: 0xf0e8d8, 0xb08a3a: 0x40a0c0, 0x8a3a24: 0xff6a8a, 0x2e5a7a: 0x4a2a6a, 0xd8c8a0: 0xf8e8a0, 0xb88a68: 0xd0a0c0, 0x8c8a84: 0xc0b0c8, 0x4a3424: 0x5a3050, 0xff8a3a: 0xffe060, 0xc8b48a: 0xe0c8a0 } },
      14: { b: 0, m: { 0xa8aeb6: 0x4a6a9a, 0x5c626b: 0x2a3a5a, 0x7a8088: 0x3a5a8a, 0xc8ced6: 0x9fd8ff, 0x8e1f1f: 0x1a2a4a, 0x5e1414: 0x101a30, 0x9a1c18: 0x9fe8ff, 0xc9a24a: 0xd8e8ff, 0x3a2618: 0x2a2a3a, 0xe8e0d0: 0xdbdbdb, 0xf2f5f8: 0xbfe8ff, 0x140c08: 0x2a3a6a } },
      15: { b: 1, m: { 0x4e3a2a: 0x2a5a3a, 0x6a4c34: 0x3a7a4a, 0x2a2018: 0x1a3020, 0x9a8a6a: 0x8ac060, 0x6e5c44: 0x5a8a40, 0xd8cdb2: 0xd8e8b0, 0xb08a3a: 0xe0c040, 0x8a3a24: 0x8fe06a, 0x2e5a7a: 0x1a4a2a, 0xd8c8a0: 0xe8f0c0, 0xb88a68: 0xa0c080, 0x8c8a84: 0xb0c8a0, 0x4a3424: 0x2a4a28, 0xff8a3a: 0xa8ff6a, 0xc8b48a: 0xc8e0a0 } },
      19: { b: 2, m: { 0x34525e: 0x3a6a3a, 0x343943: 0x2a3a24, 0x0d0e12: 0x141a10, 0x5a3e2a: 0x6a4a2a, 0x352419: 0x3a2a18, 0xc0c7cf: 0xc0c7cf, 0x9a2424: 0x4a8a3a, 0x5c574e: 0x5a5a4a, 0x2a2e36: 0x3a4a2a, 0x1f2b31: 0x1a2a18, 0x2e4650: 0x2a4a2a, 0x6a4c34: 0x5a4030 } },
      20: { b: 0, m: { 0xa8aeb6: 0x3a3a3a, 0x5c626b: 0x202020, 0x7a8088: 0x2a2a2a, 0xc8ced6: 0x5a5a5a, 0x8e1f1f: 0x1a1a22, 0x5e1414: 0x0e0e14, 0x9a1c18: 0x8a9aa0, 0xc9a24a: 0x6a6a6a, 0x3a2618: 0x1a1614, 0xe8e0d0: 0xff4040, 0xf2f5f8: 0xb0b8c0, 0x140c08: 0x300000 } }
    };
    // kahraman anahtarı -> taban indeks (kadro sırası değişse de doğru gövde seçilsin)
    const HKEY = ['alp', 'kam', 'golge', 'bahadir', 'boru', 'ayaz', 'karahan', 'tunc', 'kemik', 'pehlivan', 'yaban', 'haydut', 'umay', 'asikci', 'gokce', 'sahmeran', 'anka', 'cali', 'tulpar', 'okcu', 'orakci'];
    // kendi gövdesi olan kahramanlar (renk varyantı değil)
    const HOWN = {
      8: hKemik,
      16: hAnka,
      17: hCali,
      18: hTulpar
    };
    function hero(k) {
      if (typeof k == 'string') {
        const i = HKEY.indexOf(k);
        k = i < 0 ? 0 : i;
      }
      if (HOWN[k]) return HOWN[k]();
      if (k >= 4 && HVAR[k]) {
        const v = HVAR[k];
        GEO.setRemap(v.m);
        let r;
        try {
          r = hero(v.b);
        } finally {
          GEO.setRemap(null);
        }
        r.eyes = r.eyes.map(e => ({
          ...e,
          c: v.m[e.c] != null ? v.m[e.c] : e.c
        }));
        return r;
      }
      if (k == 0) return hAlp();
      if (k == 1) return hKam();
      if (k == 2) return hGolge();
      if (k == 3) return hBahadir();
      if (k == 1) {
        const rb = 0x5a4632,
          rk = 0x3a2c20,
          fr = 0x9a8a6a,
          bn = 0xd8cdb2,
          sk = 0x8a6a50,
          wd = 0x4a3424;
        const o = {
            hip: [0, 1.15, 0],
            sp: [0, 1.5, 0],
            ch: [0, 1.85, 0],
            nk: [0, 2.25, 0],
            hdT: [0, 2.9, 0],
            sh: [.52, 2.12, 0],
            el: [.02, -.4, .03],
            wr: [0, -.8, .08],
            hj: [.18, 1.15, 0],
            ...HLEG,
            cape: [0, 2.2, -.25, 1.35]
          },
          S = humSK(o);
        const robe = lathe([[.16, 2.2], [.36, 2.08], [.42, 1.8], [.4, 1.5], [.44, 1.2], [.52, .8], [.6, .36], [.64, .22], [0, .2]], (x, y, z) => {
          if (y > .3 && y < .4) return hex(0x8a3a24);
          if (y > 1.2 && y < 1.3) return hex(0x8a3a24);
          const a = Math.atan2(z, x);
          return shade(hex(rb), .88 + .14 * Math.sin(a * 9) + .1 * (y - .2));
        }, 24, {
          sz: .82,
          res: 4
        });
        const mantle = tube([...Array(13)].map((_, i) => {
          const a = i / 12 * Math.PI * 2;
          return [Math.cos(a) * .36, 2.1, Math.sin(a) * .3];
        }), Array(13).fill(.15), nzc(fr, .3, 9), {
          rad: 10,
          disp: (x, y, z) => .17 * fbm(x * 9, y * 9, z * 9, 2)
        });
        const head = at(ellip(.21, .25, .22, sk), 0, 2.44, 0),
          hood = at(ellip(.25, .24, .26, rk), 0, 2.55, -.05);
        const mask = at(ellip(.19, .23, .09, (x, y, z) => Math.abs(Math.abs(x) - .07) < .035 && Math.abs(y - .04) < .03 ? hex(0x120a08) : hex(bn)), 0, 2.44, .17);
        const ant = s => [tube([[s * .13, 2.66, 0], [s * .26, 2.95, -.02], [s * .32, 3.2, -.08], [s * .3, 3.42, -.16]], [.045, .04, .028, .01], bn, {
          rad: 7
        }), tube([[s * .26, 2.95, -.02], [s * .4, 3.06, .05], [s * .48, 3.13, .08]], [.03, .02, .006], bn, {
          rad: 6
        }), tube([[s * .31, 3.18, -.07], [s * .43, 3.32, -.03], [s * .47, 3.4, -.02]], [.025, .016, .005], bn, {
          rad: 6
        })];
        const charms = [-.14, 0, .14].map((x, i) => at(ellip(.04, .06, .03, bn), x, 1.12 - i % 2 * .05, .4));
        // asa bilekte: önkol ileri bükülünce (≈-1.3) dik durur
        const grip = [0, -.9, .16],
          SR = [1.3, 0, 0];
        const staff = [tube([[0, -1.55, .2], [0, 0, .21], [0, 1.0, .2], [0, 1.72, .17]], [.035, .042, .04, .03], wd, {
          rad: 7
        }), ...[0, 1, 2].map(i => {
          const a = i / 3 * Math.PI * 2;
          return tube([[0, 1.68, .17], [Math.cos(a) * .13, 1.8, .17 + Math.sin(a) * .13], [Math.cos(a) * .06, 1.98, .17 + Math.sin(a) * .06]], [.022, .016, .006], bn, {
            rad: 5
          });
        })].map(g => about(at(g, 0, -.9, 0), grip, SR));
        const orb = V(aboutP([0, -.9 + 1.86, .17], grip, SR), [o.sh[0], o.sh[1], o.sh[2]]);
        const sleeve = s => ({
          up: tube([[0, 0, 0], [s * .02, -.45, .04], [0, -.8, .1]], [.14, .17, .21], rb, {
            rad: 12,
            seg: 7
          }),
          hand: at(ellip(.08, .09, .1, sk), 0, -.9, .12)
        });
        return skRig(S, [[robe, skirtW(S, 1.25, .3, .9, .26)], [mantle, 'ch'], [[head, hood, mask, ...ant(-1), ...ant(1)], 'hd'], [charms, skirtW(S, 1.25, .3, .9, .26)], [atv(cape(.32, .4, 1.35, rk, {
          rag: 1
        }), [0, 2.2, -.25]), capeB], ...limbs(S, o, (sx, s) => {
          const a = sleeve(sx);
          if (s) a.fa = staff;
          return a;
        }, () => legP({
          r0: .11,
          r1: .1,
          r2: .09,
          col: rk,
          boot: wd
        }))], [{
          p: [-.07, 2.48, .26],
          r: .025,
          c: 0xff8a3a
        }, {
          p: [.07, 2.48, .26],
          r: .025,
          c: 0xff8a3a
        }, {
          p: orb,
          r: .12,
          c: 0xff8a3a,
          bone: 'fa1',
          glow: 2.2
        }], {
          gait: {
            st: .48,
            kn: .75,
            ln: .6,
            ar: .5,
            el: [.6, 1.3],
            hy: .7,
            staff: 1
          }
        });
      }
    }

    // ---------- yaratıklar
    function creature(t, o = {}) {
      const ds = o.desert,
        fin = o.fin;
      if (t == 0) {
        const sk = ds ? 0x8a7a64 : 0x7a806a,
          dk = ds ? 0x5a4a3a : 0x4a5040,
          cw = 0xc9bfa4;
        const q = {
            hip: [0, .9, -.05],
            sp: [0, 1.18, .08],
            ch: [0, 1.42, .27],
            nk: [0, 1.52, .45],
            hdT: [0, 1.64, .88],
            sh: [.38, 1.45, .36],
            el: [.08, -.4, .02],
            wr: [0, -1.08, .3],
            hj: [.2, .85, 0],
            kn: [0, -.38, .16],
            an: [0, -.62, -.04],
            sole: -.86,
            heel: -.06,
            toe: .28
          },
          S = humSK(q);
        const spine = tube([[0, .9, -.06], [0, 1.18, .08], [0, 1.42, .27], [0, 1.56, .46]], [.22, .27, .24, .13], (x, y, z) => shade(hex(sk), .85 + .15 * fbm(x * 7, y * 7, z * 7, 2)), {
          rad: 12,
          seg: 8,
          disp: (x, y, z, u, v) => .07 * Math.max(0, Math.sin(v * 40)) * (Math.sin(u * 6.28) > -.2 ? 1 : 0)
        });
        const pel = at(ellip(.24, .16, .19, dk), 0, .9, -.05),
          head = at(ellip(.19, .17, .26, sk), 0, 1.6, .63),
          jaw = at(ellip(.15, .07, .2, dk), 0, 1.49, .7),
          brow = at(ellip(.17, .05, .1, dk), 0, 1.68, .8);
        const ears = [-1, 1].map(s => tube([[s * .13, 1.66, .5], [s * .26, 1.78, .4], [s * .32, 1.85, .33]], [.05, .025, .003], sk, {
          rad: 6
        }));
        const teeth = [-.08, -.03, .03, .08].map(x => tube([[x, 1.5, .86], [x, 1.44, .87]], [.018, .001], 0xe8e0c8, {
          rad: 4
        }));
        const bumps = [0, 1, 2, 3].map(i => at(ellip(.05, .05, .06, dk), 0, 1.2 + i * .11, -.12 + i * .16));
        const armG = s => ({
          up: tube([[0, 0, 0], [s * .08, -.4, .02], [s * .05, -.78, .22], [0, -1.08, .3]], [.09, .07, .06, .05], sk, {
            rad: 8,
            seg: 6
          }),
          hand: at(ellip(.08, .05, .11, sk), 0, -1.13, .34),
          fa: [-.05, 0, .05].map(x => tube([[x, -1.14, .4], [x, -1.22, .5], [x, -1.27, .53]], [.022, .012, .001], cw, {
            rad: 5
          }))
        });
        const legG = () => ({
          tube: tube([[0, 0, 0], [0, -.38, .16], [0, -.62, -.04], [0, -.8, .05]], [.11, .08, .06, .05], dk, {
            rad: 8,
            seg: 6
          }),
          tb: null,
          boot: at(ellip(.07, .04, .15, dk), 0, -.82, .12)
        });
        return skRig(S, [[spine, ['hip', 'sp', 'ch']], [pel, 'hip'], [[head, jaw, brow, ...ears, ...teeth], 'hd'], [bumps, ['sp', 'ch']], ...limbs(S, q, armG, (sx, s) => {
          const l = legG();
          l.tb = ['th' + s, 'sh' + s, 'ft' + s];
          return l;
        })], [{
          p: [-.08, 1.64, .84],
          r: .035,
          c: 0xffa63a,
          glow: .45
        }, {
          p: [.08, 1.64, .84],
          r: .035,
          c: 0xffa63a,
          glow: .45
        }], {
          kind: 'bi'
        });
      }
      if (t == 1) {
        const fu = ds ? 0x4a2c26 : 0x3a2c32,
          mb = ds ? 0x8a4a3a : 0x6e4458,
          bn = 0x6b5a50;
        const S = SK([['hip', null, [0, 1.8, -.3], [0, 1.8, .3]], ['hd', 'hip', [0, 1.86, .28], [0, 1.92, .62]], ['wa0', 'hip', [-.22, 1.86, 0], [-.82, 1.9, .11]], ['wb0', 'wa0', [-.82, 1.9, .11], [-1.77, 1.48, .02]], ['wa1', 'hip', [.22, 1.86, 0], [.82, 1.9, .11]], ['wb1', 'wa1', [.82, 1.9, .11], [1.77, 1.48, .02]]]);
        const body = blob(.27, nzc(fu, .25, 14), {
            sx: 1,
            sy: .9,
            sz: 1.55,
            amp: .05,
            fr: 5
          }),
          head = at(ellip(.18, .16, .18, fu), 0, .1, .42),
          snout = at(ellip(.08, .07, .1, shade(hex(fu), 1.2)), 0, .06, .58);
        const ears = [-1, 1].map(s => tube([[s * .09, .2, .42], [s * .15, .36, .38], [s * .17, .45, .35]], [.065, .04, .002], fu, {
            rad: 7
          })),
          fangs = [-1, 1].map(s => tube([[s * .03, .0, .64], [s * .03, -.07, .65]], [.014, .001], 0xe8e0c8, {
            rad: 4
          }));
        const wing = s => {
          const lead = u => .18 - .1 * u,
            trail = u => -.8 * (1 - u * .5) + .18 * Math.abs(Math.sin(u * Math.PI * 3));
          const mem = sheet(16, 6, (u, v) => {
            const x = s * u * 1.55,
              z = lead(u) + (trail(u) - lead(u)) * v,
              y = .12 * u - .3 * u * u - .05 * v + .04 * Math.sin(v * 3.1);
            return [x, y, z];
          }, (x, y, z, u, v) => shade(hex(mb), .95 + .35 * v));
          const bones = [tube([[0, 0, .13], [s * .6, .04, .11], [s * 1.1, -.12, .07], [s * 1.55, -.38, .02]], [.04, .03, .02, .006], bn, {
            rad: 6
          }), ...[.33, .66, 1].map(u => tube([[s * .6, .04, .11], [s * u * 1.45, -.16 * u * u, trail(u) * .9]], [.018, .004], bn, {
            rad: 5
          }))];
          return [mem, ...bones];
        };
        const wW = s => (x, y, z) => {
          const d = Math.abs(x) - .22,
            r = 1 - smt(d / .12),
            tt = smt((d - .42) / .42),
            i = s > 0 ? 1 : 0;
          return [['hip', r], ['wa' + i, (1 - r) * (1 - tt)], ['wb' + i, (1 - r) * tt]];
        };
        return skRig(S, [[at(body, 0, 1.8, 0), 'hip'], [[head, snout, ...ears, ...fangs].map(g => at(g, 0, 1.8, 0)), 'hd'], [wing(-1).map(g => at(g, -.22, 1.86, 0)), wW(-1)], [wing(1).map(g => at(g, .22, 1.86, 0)), wW(1)]], [{
          p: [-.07, 1.94, .57],
          r: .03,
          c: 0xff3a22,
          glow: .35
        }, {
          p: [.07, 1.94, .57],
          r: .03,
          c: 0xff3a22,
          glow: .35
        }], {
          kind: 'bat',
          hy0: 1.8
        });
      }
      if (t == 2) {
        const s1 = ds ? 0x8a5a46 : 0x6e6964,
          s2 = ds ? 0x6a4436 : 0x4e4a46,
          em = 0xff6a2a;
        const q = {
            hip: [0, 1.15, 0],
            sp: [0, 1.6, 0],
            ch: [0, 2.3, 0],
            nk: [0, 2.75, .15],
            hdT: [0, 3.4, .35],
            sh: [1.05, 2.5, 0],
            el: [0, -.85, .05],
            wr: [0, -1.75, .18],
            hj: [.45, 1.15, 0],
            kn: [0, -.6, .05],
            an: [0, -.95, .15],
            sole: -1.2,
            heel: -.25,
            toe: .5
          },
          S = humSK(q);
        const rock = (r, sd, o2 = {}) => paint(blob(r, s1, {
          amp: .13,
          fr: 2.4,
          seed: sd,
          ...o2
        }), (x, y, z, c, nx, ny) => {
          const f = fbm(x * 2.6 + sd, y * 2.6, z * 2.6, 3);
          if (f > .38) return mixc(hex(em), hex(0xffb050), Math.min(1, (f - .38) * 4));
          let k = .9 + .12 * fbm(x * 5, y * 5, z * 5, 2);
          if (ny > .65) return shade(hex(ds ? 0x9a6a50 : 0x6a7a5a), k);
          return shade(hex(f < -.2 ? s2 : s1), k);
        });
        const armG = s => {
          const sd = s < 0 ? 10 : 20;
          return {
            up: at(rock(.36, sd), 0, -.5, 0),
            fa: [at(rock(.4, sd + 1, {
              sy: 1.3
            }), 0, -1.15, .12), at(rock(.44, sd + 2), 0, -1.75, .18)],
            hand: null
          };
        };
        const legG = s => {
          const sd = s < 0 ? 30 : 40;
          return {
            tube: at(rock(.4, sd, {
              sy: 1.2
            }), 0, -.4, 0),
            tb: 'th' + (s < 0 ? 0 : 1),
            boot: at(rock(.42, sd + 1, {
              sy: .6
            }), 0, -.95, .15)
          };
        };
        const L = limbs(S, q, armG, legG).map(([g, sp]) => Array.isArray(sp) && sp[0].startsWith('ua') ? [g, sp[0]] : [g, sp]);
        return skRig(S, [[at(rock(.95, 1, {
          sz: .8
        }), 0, 2.05, 0), 'sp'], [at(rock(.65, 2), 0, 1.05, 0), 'hip'], [at(rock(.42, 3), 0, 3.05, .3), 'hd'], [[at(rock(.5, 4), -1.0, 2.62, 0), at(rock(.5, 5), 1.0, 2.62, 0)], 'ch'], ...L], [{
          p: [-.14, 3.08, .68],
          r: .07,
          c: 0xff7a3a,
          glow: .8,
          sq: .45
        }, {
          p: [.14, 3.08, .68],
          r: .07,
          c: 0xff7a3a,
          glow: .8,
          sq: .45
        }], {
          kind: 'bi'
        });
      }
      if (t == 3) {
        const sk = fin ? 0x7a5444 : 0x9a7a5c,
          sd = fin ? 0x5a3a30 : 0x7a5a42,
          fu = 0x4a3424,
          bn = 0xd8cdb2,
          wd = 0x4a3424;
        const q = {
            hip: [0, 1.45, 0],
            sp: [0, 2.1, 0],
            ch: [0, 2.8, 0],
            nk: [0, 3.35, .15],
            hdT: [0, 4.3, .4],
            sh: [1.12, 3.15, 0],
            el: [.05, -.75, .05],
            wr: [0, -1.38, .15],
            hj: [.5, 1.2, 0],
            kn: [0, -.55, .05],
            an: [0, -1.0, 0],
            sole: -1.27,
            heel: -.27,
            toe: .58
          },
          S = humSK(q);
        const belly = lathe([[0, 3.45], [.5, 3.4], [.86, 3.15], [.98, 2.7], [1.02, 2.3], [.92, 1.9], [.72, 1.55], [.6, 1.4], [0, 1.38]], (x, y, z) => shade(hex(sk), .85 + .12 * (y - 1.4) + .08 * fbm(x * 4, y * 4, z * 4, 2)), 24, {
          sz: .84
        });
        const cloth = lathe([[.72, 1.7], [.82, 1.45], [.9, 1.05], [.86, .92], [.6, .92]], (x, y, z) => y > 1.55 ? hex(0x3a2a1c) : shade(hex(fu), 1 + .15 * fbm(x * 8, y * 8, z * 8, 2)), 22, {
          sz: .86,
          res: 4,
          disp: (x, y, z) => y < 1.5 ? .06 * fbm(x * 6, y * 6, z * 6, 2) : 0
        });
        const head = at(ellip(.62, .56, .6, sk), 0, 3.75, .25),
          brow = at(ellip(.52, .15, .28, sd), 0, 3.98, .6),
          mouth = at(ellip(.36, .09, .14, 0x2a1410), 0, 3.48, .66);
        const tusk = [-1, 1].map(s => tube([[s * .2, 3.45, .72], [s * .25, 3.62, .85], [s * .3, 3.78, .86]], [.06, .04, .002], bn, {
          rad: 7
        }));
        const horn = [-1, 1].map(s => tube([[s * .4, 4.12, .1], [s * .75, 4.45, 0], [s * .95, 4.85, -.25], [s * .9, 5.12, -.48]], [.15, .11, .07, .008], (x, y) => shade(hex(bn), .75 + .15 * (y - 4)), {
          rad: 9
        }));
        const eye = at(ellip(.25, .21, .13, 0xe8e2d0), 0, 3.82, .78);
        const crown = fin ? [0, 1, 2, 3, 4].map(i => {
          const a = (i / 4 - .5) * 1.6;
          return tube([[Math.sin(a) * .42, 4.18, .25 + Math.cos(a) * .3], [Math.sin(a) * .5, 4.6, .25 + Math.cos(a) * .34]], [.07, .003], bn, {
            rad: 6
          });
        }) : [];
        const club = [tube([[0, -1.5, 0], [0, -1.75, .9], [0, -1.95, 1.9]], [.1, .18, .32], nzc(wd, .2, 6), {
          rad: 10
        }), ...[...Array(7)].map((_, i) => {
          const a = i / 7 * 6.283,
            c = [0, -1.9, 1.7];
          return tube([[c[0] + Math.cos(a) * .25, c[1] + Math.sin(a) * .25, c[2]], [c[0] + Math.cos(a) * .55, c[1] + Math.sin(a) * .55, c[2] + .05]], [.07, .002], bn, {
            rad: 5
          });
        })];
        const armG = (s, i) => ({
          ua: [at(ellip(.42, .38, .42, sk), 0, 0, 0)],
          up: tube([[0, -.1, 0], [s * .05, -.75, .05], [0, -1.38, .15]], [.36, .32, .3], sk, {
            rad: 12,
            seg: 7
          }),
          fa: [tube([[0, -1.0, .1], [0, -1.3, .14]], [.33, .32], (x, y, z) => shade(hex(fu), 1 + .15 * fbm(x * 8, y * 8, z * 8, 2)), {
            rad: 12
          }), at(blob(.36, sk, {
            amp: .05,
            fr: 2,
            seed: s * 7
          }), 0, -1.55, .2), ...(i ? club : [])]
        });
        const legG = () => ({
          tube: tube([[0, 0, 0], [0, -.55, .05], [0, -1.0, 0]], [.36, .3, .27], sk, {
            rad: 12,
            seg: 7
          }),
          boot: at(ellip(.32, .17, .44, sd), 0, -1.1, .15)
        });
        return skRig(S, [[belly, ['hip', 'sp', 'ch']], [cloth, skirtW(S, 1.62, .92, .8, .5, ['hip', 'sp'])], [[head, brow, mouth, ...tusk, ...horn, eye, ...crown], 'hd'], ...limbs(S, q, armG, legG)], [{
          p: [0, 3.82, .88],
          r: .12,
          c: 0xff3a22,
          glow: 1.6
        }, {
          p: [0, 3.82, .97],
          r: .055,
          c: 0x120808
        }], {
          kind: 'bi'
        });
      }
      if (t == 4) {
        const bo = 0xd2c8ae,
          bd = 0x9a907a,
          cl = ds ? 0x4a3020 : 0x3a3530,
          wd = 0x4a3424;
        const q = {
            hip: [0, 1.12, 0],
            sp: [0, 1.45, -.06],
            ch: [0, 1.85, -.03],
            nk: [0, 2.18, 0],
            hdT: [0, 2.62, .05],
            sh: [.3, 2.08, 0],
            el: [0, -.42, .02],
            wr: [0, -.82, .08],
            hj: [.13, 1.05, 0],
            kn: [0, -.5, .02],
            an: [0, -.98, 0],
            sole: -1.07,
            heel: -.06,
            toe: .17
          },
          S = humSK(q);
        const pelvis = at(ellip(.2, .1, .13, bo), 0, 1.12, 0),
          spine = tube([[0, 1.15, -.02], [0, 1.5, -.07], [0, 1.85, -.03], [0, 2.14, 0]], [.045, .04, .04, .035], bd, {
            rad: 7
          });
        const ribs = [0, 1, 2, 3].flatMap(i => {
          const y = 1.58 + i * .12,
            w = .2 - i * .012;
          return [-1, 1].map(s => tube([[0, y, -.05], [s * w * .9, y - .02, .0], [s * w * .7, y - .05, .16], [0, y - .07, .2]], [.022, .022, .02, .015], bo, {
            rad: 5
          }));
        });
        const skull = at(ellip(.16, .18, .17, (x, y, z) => z > .08 && Math.abs(Math.abs(x) - .06) < .04 && Math.abs(y - .03) < .035 ? hex(0x120c08) : hex(bo)), 0, 2.38, .03),
          jaw = at(ellip(.11, .055, .11, bd), 0, 2.22, .08);
        const hood = at(ellip(.24, .26, .23, shade(hex(cl), .9)), 0, 2.46, -.09),
          cloak = paint(sheet(10, 12, (u, v) => {
            const a = (u - .5) * 2.4;
            return [Math.sin(a) * (.28 + .12 * v), 2.2 - v * 1.25 - (v > .8 ? .1 * Math.abs(Math.sin(u * 25)) : 0), -Math.cos(a) * (.22 + .1 * v) - .02];
          }, cl), (x, y, z, c) => shade(c, .8 + .25 * (y - 1)));
        // yay elde, yatay; kol öne kalkınca dikleşir
        const hp = [0, -.88, .1],
          bow = [tube([[0, hp[1] + .3, hp[2] - .8], [0, hp[1] + .08, hp[2] - .42], [0, hp[1], hp[2]], [0, hp[1] + .08, hp[2] + .42], [0, hp[1] + .3, hp[2] + .8]], [.015, .03, .035, .03, .015], wd, {
            rad: 6
          }), tube([[0, hp[1] + .3, hp[2] - .8], [0, hp[1] + .3, hp[2] + .8]], [.006, .006], 0xd8d0c0, {
            rad: 4
          })];
        const armG = (s, i) => ({
          up: tube([[0, 0, 0], [0, -.42, .02], [0, -.82, .08]], [.035, .03, .028], bo, {
            rad: 6,
            seg: 6
          }),
          env: [at(ellip(.045, .045, .045, bd), 0, -.42, .02)],
          hand: at(ellip(.05, .035, .08, bo), 0, -.88, .1),
          fa: i ? [] : bow
        });
        const legG = () => ({
          tube: tube([[0, 0, 0], [0, -.5, .02], [0, -.98, 0]], [.04, .035, .03], bo, {
            rad: 6,
            seg: 6
          }),
          knee: at(ellip(.05, .05, .05, bd), 0, -.5, .03),
          boot: at(ellip(.05, .03, .12, bo), 0, -1.02, .06)
        });
        return skRig(S, [[pelvis, 'hip'], [spine, ['hip', 'sp', 'ch']], [ribs, 'ch'], [[skull, jaw, hood], 'hd'], [cloak, skirtW(S, 1.2, .9, .5, .2)], ...limbs(S, q, armG, legG)], [{
          p: [-.06, 2.41, .18],
          r: .028,
          c: 0xffa63a,
          glow: .35
        }, {
          p: [.06, 2.41, .18],
          r: .028,
          c: 0xffa63a,
          glow: .35
        }], {
          kind: 'bi'
        });
      }
      const fu = ds ? 0x5a4434 : 0x4a3a2e,
        fd = ds ? 0x3a2a1e : 0x2a221c,
        hn = 0xb8ab90,
        cw = 0xd8cdb2;
      const q = {
          hip: [0, 1.2, 0],
          sp: [0, 1.7, 0],
          ch: [0, 2.25, .05],
          nk: [0, 2.38, .35],
          hdT: [0, 2.55, .95],
          sh: [.72, 2.25, .2],
          el: [.05, -.9, .1],
          wr: [0, -1.85, .25],
          hj: [.34, 1.15, 0],
          kn: [0, -.5, .05],
          an: [0, -.9, 0],
          sole: -1.05,
          heel: -.18,
          toe: .42
        },
        S = humSK(q);
      const shag = (x, y, z) => .13 * Math.max(0, fbm(x * 7, y * 7, z * 7, 2)) + .04 * fbm(x * 3, y * 3, z * 3, 2);
      const body = at(ellip(.78, .82, .62, nzc(fu, .3, 8), {
          ws: 26,
          hs: 18,
          disp: shag
        }), 0, 1.95, .05),
        head = at(ellip(.38, .34, .38, nzc(fu, .25, 8), {
          ws: 20,
          hs: 14,
          disp: (x, y, z) => .6 * shag(x, y, z)
        }), 0, 2.42, .6),
        snout = at(ellip(.2, .14, .2, fd), 0, 2.32, .86);
      const horns = [-1, 1].map(s => tube([[s * .2, 2.68, .55], [s * .3, 2.85, .45], [s * .32, 2.95, .3]], [.07, .045, .003], hn, {
          rad: 7
        })),
        teeth = [-.07, 0, .07].map(x => tube([[x, 2.24, .98], [x, 2.16, 1.0]], [.02, .001], cw, {
          rad: 4
        }));
      const armG = s => ({
        up: tube([[0, 0, 0], [s * .05, -.6, .05], [0, -1.25, .15], [0, -1.85, .25]], [.24, .2, .17, .14], nzc(fu, .3, 8), {
          rad: 12,
          seg: 6,
          disp: (x, y, z) => .8 * shag(x, y, z)
        }),
        hand: at(blob(.16, fd, {
          amp: .15,
          fr: 4
        }), 0, -1.95, .28),
        fa: [-.07, 0, .07].map(x => tube([[x, -2.0, .36], [x, -2.12, .46], [x, -2.2, .48]], [.03, .015, .001], cw, {
          rad: 5
        }))
      });
      const legG = () => ({
        tube: tube([[0, 0, 0], [0, -.5, .05], [0, -.9, 0]], [.3, .26, .2], nzc(fu, .3, 8), {
          rad: 12,
          seg: 7,
          disp: (x, y, z) => .7 * shag(x, y, z)
        }),
        boot: at(ellip(.2, .1, .3, fd), 0, -.95, .12)
      });
      return skRig(S, [[body, ['hip', 'sp', 'ch']], [[head, snout, ...horns, ...teeth], 'hd'], ...limbs(S, q, armG, legG)], [{
        p: [-.13, 2.5, .88],
        r: .06,
        c: 0xffe14a,
        glow: .55
      }, {
        p: [.13, 2.5, .88],
        r: .06,
        c: 0xffe14a,
        glow: .55
      }], {
        kind: 'bi'
      });
    }
    function rig(root, parts, eyes) {
      return {
        root: merge(...[root].flat()),
        parts: Object.fromEntries(Object.entries(parts).map(([k, v]) => [k, {
          p: v.p,
          g: merge(...[v.g].flat())
        }])),
        eyes: eyes || []
      };
    }
    // ---------- NPC'ler
    function merchant() {
      const rb = 0x4a3a2c,
        dk = 0x0e0c0a,
        bag = 0x6a5034,
        wd = 0x4a3424;
      const robe = lathe([[.15, 2.2], [.32, 2.0], [.42, 1.6], [.5, 1.0], [.58, .4], [.6, .1], [0, .08]], (x, y, z) => {
        const a = Math.atan2(z, x);
        return shade(hex(rb), .9 + .12 * Math.sin(a * 7) + .08 * y);
      }, 22);
      const hood = at(ellip(.3, .33, .32, (x, y, z) => z > .2 && Math.abs(x) < .17 && y > -.18 && y < .14 ? hex(dk) : shade(hex(rb), .8)), 0, 2.38, -.02);
      const pack = at(blob(.45, nzc(bag, .15, 6), {
          sx: .95,
          sy: 1.2,
          sz: .7,
          amp: .08,
          fr: 2
        }), 0, 1.65, -.5),
        roll = tube([[-.4, 2.28, -.5], [.4, 2.28, -.5]], [.13, .13], 0x9a8a6a, {
          rad: 10
        }),
        straps = [-1, 1].map(s => tube([[s * .18, 2.15, .2], [s * .2, 1.7, .3], [s * .18, 1.25, .18]], [.03, .03, .03], 0x2a2018, {
          rad: 5
        }));
      const stick = tube([[.55, .05, .35], [.56, 1.2, .36], [.55, 2.0, .35], [.5, 2.3, .3]], [.035, .035, .03, .025], wd, {
          rad: 6
        }),
        lamp = at(lathe([[0, .2], [.08, .16], [.1, .04], [.08, -.1], [0, -.12]], 0x3a3a3a, 10), .5, 2.12, .42);
      const goods = [[-.42, 1.3, -.55, 0x8a4a2a], [.42, 1.4, -.5, 0x4a6a8a], [.38, 1.0, -.45, 0x7a6a3a]].map(([x, y, z, c]) => at(lathe([[0, .15], [.06, .13], [.1, .0], [.07, -.1], [0, -.12]], c, 10), x, y, z));
      return rig([robe, hood, pack, roll, ...straps, stick, lamp, ...goods], {}, [{
        p: [-.07, 2.42, .29],
        r: .022,
        c: 0xe2b04a
      }, {
        p: [.07, 2.42, .29],
        r: .022,
        c: 0xe2b04a
      }, {
        p: [.5, 2.12, .42],
        r: .07,
        c: 0xffc46a,
        glow: 1.6
      }]);
    }
    function cauldron() {
      const ir = 0x2a2a2e;
      const pot = lathe([[.95, 1.9], [1.12, 1.76], [1.22, 1.45], [1.16, 1.05], [.92, .76], [.5, .62], [0, .6]], (x, y, z) => shade(hex(ir), .85 + .15 * fbm(x * 5, y * 5, z * 5, 2)), 24);
      const rim = tube([...Array(17)].map((_, i) => {
        const a = i / 16 * Math.PI * 2;
        return [Math.cos(a) * .98, 1.9, Math.sin(a) * .98];
      }), Array(17).fill(.07), 0x3a3a40, {
        rad: 8
      });
      const legs = [0, 1, 2].map(i => {
        const a = i / 3 * Math.PI * 2 + .5,
          c = Math.cos(a),
          s = Math.sin(a);
        return tube([[c * .8, .9, s * .8], [c * .95, .4, s * .95], [c * 1.05, 0, s * 1.05]], [.09, .07, .06], ir, {
          rad: 6
        });
      });
      return rig([pot, rim, ...legs], {}, []);
    }

    // ---------- çevre (örnekli)
    function pine(sd) {
      const gs = [tube([[0, 0, 0], [.06, 1.6, .03], [0, 3.2, 0], [0, 6.6, 0]], [.3, .22, .15, .03], nzc(0x5a3a24, .25, 10), {
        rad: 9
      })];
      const n = 5;
      for (let k = 0; k < n; k++) {
        const r = 2.5 - k * .42,
          top = 2.1 + k * 1.15 + 1.5,
          h = 1.6,
          f = k / (n - 1);
        gs.push(lathe([[0, top], [r * .32, top - h * .32], [r * .78, top - h * .78], [r, top - h], [r * .72, top - h - .14], [0, top - h + .05]], (x, y, z) => {
          const d = Math.hypot(x, z) / r;
          return shade(mixc(hex(0x24563a), hex(0x3e8050), Math.min(1, d * .8 + f * .3)), .85 + .10 * fbm(x * 3 + sd, y * 3, z * 3, 2));
        }, 16, {
          disp: (x, y, z) => {
            const a = Math.atan2(z, x);
            return .3 * (Math.pow(Math.abs(Math.sin(a * (3.5 + k % 2) + k * 1.3 + sd)), .6) - .55) + .09 * fbm(x * 1.8 + sd * 3 + k, y * 1.8, z * 1.8 + sd, 3);
          }
        }));
      }
      return merge(...gs);
    }
    function oak(sd) {
      const bk = nzc(0x5a4230, .25, 8),
        lf = (x, y, z, c, nx, ny) => shade(mixc(hex(0x2e6038), hex(0x5a9048), .5 + .5 * ny), .85 + .12 * fbm(x * 2 + sd, y * 2, z * 2, 2));
      const tr = [tube([[0, 0, 0], [.1, 1.4, .05], [-.05, 2.6, .1], [.05, 3.4, 0]], [.42, .32, .26, .18], bk, {
        rad: 10
      }), tube([[.05, 2.4, .05], [.7, 3.2, .3], [1.3, 3.8, .4]], [.18, .12, .06], bk, {
        rad: 7
      }), tube([[0, 2.7, .05], [-.8, 3.4, -.3], [-1.4, 4.0, -.4]], [.16, .11, .05], bk, {
        rad: 7
      })];
      const cl = [[0, 4.3, 0, 1.9], [1.3, 4.0, .4, 1.4], [-1.3, 4.1, -.4, 1.45], [.3, 5.1, -.3, 1.3], [-.4, 3.9, 1.0, 1.2]].map(([x, y, z, r], i) => paint(at(blob(r, 0x3a7040, {
        amp: .3,
        fr: 1.3,
        seed: sd + i * 3,
        sy: .85
      }), x, y, z), lf));
      return merge(...tr, ...cl);
    }
    function deadTree(sd) {
      const bk = (x, y, z) => shade(hex(0x6a5040), .8 + .15 * fbm(x * 6, y * 6 + sd, z * 6, 2));
      return merge(tube([[0, 0, 0], [.25, 1.2, .1], [.05, 2.4, -.12], [.3, 3.5, .05], [.2, 4.0, .1]], [.3, .22, .16, .08, .02], bk, {
        rad: 8
      }), tube([[.1, 2.2, -.1], [.7, 2.9, .2], [1.2, 3.1, .45]], [.1, .06, .01], bk, {
        rad: 6
      }), tube([[.2, 3.0, 0], [-.4, 3.6, -.3], [-.7, 4.2, -.35]], [.08, .05, .01], bk, {
        rad: 6
      }), tube([[.15, 1.5, .05], [-.5, 2.0, .3], [-.9, 2.1, .6]], [.09, .05, .01], bk, {
        rad: 6
      }));
    }
    function rock(sd, ds) {
      return paint(blob(1, ds ? 0x8a5a46 : 0x6e6c74, {
        amp: .42,
        fr: 1.5,
        seed: sd,
        flat: .6,
        sy: .75,
        oct: 4,
        ws: 18,
        hs: 12
      }), (x, y, z, c, nx, ny) => {
        const k = .85 + .12 * fbm(x * 4 + sd, y * 4, z * 4, 2);
        if (!ds && ny > .55) return shade(mixc(hex(0x6e6c74), hex(0x4e6a3e), Math.min(1, (ny - .55) * 2.5)), k);
        if (ds) return shade(hex([0x8a5a46, 0x7a4a38, 0x9a6a50][Math.floor((y + 2) * 3) % 3]), k);
        return shade(c, k);
      });
    }
    function spire(sd) {
      const h = 7 + sd % 3,
        cols = [0x8a5a46, 0x7a4a38, 0x9a6a50, 0xa87a5e];
      const body = lathe([[0, h + .15], [.7, h], [1.25, h - .35], [1.1, h - .75], [.62, h - 1.1], [.68, h * .62], [.95, h * .38], [1.2, h * .15], [1.55, 0], [1.2, -.4], [0, -.5]], (x, y, z) => shade(hex(cols[Math.floor(y * 1.6 + fbm(x, y * .2, z, 1) * 1.5 + 8) % 4]), .85 + .10 * fbm(x * 4, y * 4, z * 4, 2)), 18, {
        disp: (x, y, z) => .11 * fbm(x * 1.4 + sd, y * .9, z * 1.4 - sd, 3)
      });
      const cap = paint(at(blob(1.25, 0x6a3e30, {
        amp: .25,
        fr: 1.5,
        seed: sd + 3,
        sy: .45
      }), 0, h + .05, 0), (x, y, z) => shade(hex(0x6a3e30), .85 + .12 * fbm(x * 4, y * 4, z * 4, 2)));
      return merge(body, cap);
    }
    function bush(sd, ds) {
      const c = ds ? 0x7a6a3a : 0x2f6a3e;
      return merge(...[[0, .35, 0, .6], [.45, .3, .15, .45], [-.4, .3, -.1, .5], [.05, .6, -.25, .4]].map(([x, y, z, r], i) => paint(at(blob(r, c, {
        amp: .3,
        fr: 2.2,
        seed: sd + i
      }), x, y, z), (xx, yy, zz, cc, nx, ny) => shade(hex(c), .75 + .3 * ny + .07 * fbm(xx * 5, yy * 5, zz * 5, 2)))));
    }
    function grass(sd, ds) {
      const gs = [];
      for (let i = 0; i < 5; i++) {
        const a = i / 5 * 6.283 + sd,
          dx = Math.cos(a) * .18,
          dz = Math.sin(a) * .18,
          h = .45 + (i * 37 + sd * 11) % 7 / 20,
          c = ds ? [0x9a8452, 0x8a7444, 0xa89060][i % 3] : [0x3e6a3a, 0x4a7a40, 0x5a8a44][i % 3];
        gs.push(sheet(1, 4, (u, v) => {
          const w = .05 * (1 - v);
          return [dx * v * v + (u - .5) * w * Math.cos(a + 1.57) * 2, h * v, dz * v * v + (u - .5) * w * Math.sin(a + 1.57) * 2];
        }, (x, y, z, u, v) => shade(hex(c), .7 + .45 * v)));
      }
      return merge(...gs);
    }
    function vase() {
      return lathe([[.32, .7], [.36, .66], [.26, .55], [.3, .35], [.5, .05], [.52, -.2], [.42, -.55], [.3, -.7], [0, -.7]], (x, y, z) => y > .12 && y < .2 ? hex(0x5a2e18) : y < -.3 && y > -.38 ? hex(0x5a2e18) : shade(hex(0xa0602a), .85 + .1 * fbm(x * 6, y * 6, z * 6, 2)), 16);
    }
    // ---------- fırlatılan silahlar
    function wAxe() {
      const wd = 0x5a3e28,
        st = 0xa8aeb6,
        dk = 0x2e2218;
      const haft = tube([[0, -.62, 0], [.02, -.1, .02], [0, .52, 0]], [.05, .046, .042], nzc(wd, .2, 10), {
          rad: 8
        }),
        wrap = tube([[0, -.64, 0], [0, -.36, 0]], [.058, .058], dk, {
          rad: 8
        });
      const head = at(slab([[0, -.1], [.14, -.12], [.3, -.24], [.44, -.14], [.47, .08], [.38, .26], [.2, .17], [0, .12]], .05, st), 0, .38, 0, [0, -P2, 0]);
      paint(head, (x, y, z) => z > .37 ? hex(0xe2e7ec) : shade(hex(st), .9 + .4 * (y - .38)));
      const poll = at(ellip(.06, .09, .1, st), 0, .38, -.07),
        cap = at(ellip(.05, .04, .05, dk), 0, .54, 0);
      return merge(haft, wrap, head, poll, cap);
    }
    function wBoom() {
      const c = 0xc9b48a;
      const arc = [[.98, 0, -.04], [.62, 0, .04], [.22, 0, .2], [.04, 0, .62], [-.04, 0, .98]];
      return paint(tf(tube(arc, [.07, .12, .15, .12, .07], c, {
        rad: 10,
        seg: 6
      }), {
        s: [1, .38, 1]
      }), (x, y, z, cc) => {
        const d = Math.hypot(x, z);
        return Math.abs(d - .55) < .06 || Math.abs(d - .85) < .05 ? hex(0x7a2a1e) : shade(hex(c), .85 + .2 * y * 4);
      });
    }
    function wSword() {
      const bl = 0xdde2e8,
        gd = 0xb08a40,
        lt = 0x3a2b20;
      return merge(at(paint(fwd(blade(2.25, .08, .03, bl)), (x, y, z) => Math.abs(x) < .014 ? hex(0xf6f8fa) : hex(bl)), 0, 0, -1.12, [0, 0, P2]), tube([[0, -.28, -1.15], [0, 0, -1.17], [0, .28, -1.15]], [.04, .05, .04], gd, {
        rad: 7
      }), tube([[0, 0, -1.18], [0, 0, -1.55]], [.045, .04], lt, {
        rad: 7
      }), at(ellip(.06, .06, .06, gd), 0, 0, -1.6));
    }
    return {
      wAxe,
      wBoom,
      wSword,
      hero,
      creature,
      merchant,
      cauldron,
      pine,
      oak,
      deadTree,
      rock,
      spire,
      bush,
      grass,
      vase
    };
  })();
}
