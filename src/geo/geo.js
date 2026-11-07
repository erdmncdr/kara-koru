// geo/geo.js · Kara Koru
// Bu dosya tek dosyalık sürümden (v22) otomatik ayrıldı. Ortak oyun durumu core/store.js içindeki $G nesnesinde.

import { $G } from '../core/store.js';

export let GEO;

export function __init_2() {
  // ---- organik geometri (three.js'ten bağımsız)
  GEO = (() => {
    const TAU = Math.PI * 2;
    let Q = 1;
    const q = (n, m) => Math.max(m, Math.round(n * Q));
    function hsh(i, j, k) {
      let h = Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(k, 1442695041) | 0;
      h = Math.imul(h ^ h >>> 13, 1274126177);
      h ^= h >>> 16;
      return (h >>> 0) / 4294967295;
    }
    function vn(x, y, z) {
      const xi = Math.floor(x),
        yi = Math.floor(y),
        zi = Math.floor(z),
        xf = x - xi,
        yf = y - yi,
        zf = z - zi,
        u = xf * xf * (3 - 2 * xf),
        v = yf * yf * (3 - 2 * yf),
        w = zf * zf * (3 - 2 * zf);
      let r = 0;
      for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) for (let c = 0; c < 2; c++) r += hsh(xi + a, yi + b, zi + c) * (a ? u : 1 - u) * (b ? v : 1 - v) * (c ? w : 1 - w);
      return r * 2 - 1;
    }
    function fbm(x, y, z, o = 3) {
      let s = 0,
        a = 1,
        f = 1,
        t = 0;
      for (let i = 0; i < o; i++) {
        s += vn(x * f, y * f, z * f) * a;
        t += a;
        a *= .5;
        f *= 2.03;
      }
      return s / t;
    }
    let RMP = null;
    const hex = h => {
      if (RMP) {
        const r = RMP[h];
        if (r != null) h = r;
      }
      return [(h >> 16 & 255) / 255, (h >> 8 & 255) / 255, (h & 255) / 255];
    };
    const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
    const shade = (c, k) => [Math.min(1, c[0] * k), Math.min(1, c[1] * k), Math.min(1, c[2] * k)];
    const C = c => typeof c == 'number' ? hex(c) : c;
    function colAt(col, x, y, z, u, v) {
      if (typeof col == 'function') return C(col(x, y, z, u, v));
      return C(col);
    }
    function smoothN(g) {
      const acc = new Map(),
        key = i => Math.round(g.p[i * 3] * 1e4) + '_' + Math.round(g.p[i * 3 + 1] * 1e4) + '_' + Math.round(g.p[i * 3 + 2] * 1e4),
        nv = g.p.length / 3,
        ks = new Array(nv);
      for (let i = 0; i < nv; i++) {
        ks[i] = key(i);
        if (!acc.has(ks[i])) acc.set(ks[i], [0, 0, 0]);
      }
      for (let f = 0; f < g.i.length; f += 3) {
        const a = g.i[f] * 3,
          b = g.i[f + 1] * 3,
          c = g.i[f + 2] * 3,
          ux = g.p[b] - g.p[a],
          uy = g.p[b + 1] - g.p[a + 1],
          uz = g.p[b + 2] - g.p[a + 2],
          vx = g.p[c] - g.p[a],
          vy = g.p[c + 1] - g.p[a + 1],
          vz = g.p[c + 2] - g.p[a + 2],
          nx = uy * vz - uz * vy,
          ny = uz * vx - ux * vz,
          nz = ux * vy - uy * vx;
        for (const q of [g.i[f], g.i[f + 1], g.i[f + 2]]) {
          const s = acc.get(ks[q]);
          s[0] += nx;
          s[1] += ny;
          s[2] += nz;
        }
      }
      g.n = [];
      for (let i = 0; i < nv; i++) {
        const s = acc.get(ks[i]),
          l = Math.hypot(s[0], s[1], s[2]) || 1;
        g.n.push(s[0] / l, s[1] / l, s[2] / l);
      }
      return g;
    }
    function orient(g) {
      let cx = 0,
        cy = 0,
        cz = 0;
      const nv = g.p.length / 3;
      for (let i = 0; i < nv; i++) {
        cx += g.p[i * 3];
        cy += g.p[i * 3 + 1];
        cz += g.p[i * 3 + 2];
      }
      cx /= nv;
      cy /= nv;
      cz /= nv;
      let s = 0;
      for (let i = 0; i < nv; i++) s += (g.p[i * 3] - cx) * g.n[i * 3] + (g.p[i * 3 + 1] - cy) * g.n[i * 3 + 1] + (g.p[i * 3 + 2] - cz) * g.n[i * 3 + 2];
      if (s < 0) {
        for (let f = 0; f < g.i.length; f += 3) {
          const t = g.i[f + 1];
          g.i[f + 1] = g.i[f + 2];
          g.i[f + 2] = t;
        }
        for (let i = 0; i < g.n.length; i++) g.n[i] = -g.n[i];
      }
      return g;
    }
    function grid(nu, nv, fn, col) {
      const g = {
        p: [],
        n: [],
        c: [],
        i: []
      };
      for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
        const u = i / nu,
          v = j / nv,
          P = fn(u, v);
        g.p.push(P[0], P[1], P[2]);
        const c = colAt(col, P[0], P[1], P[2], u, v);
        g.c.push(c[0], c[1], c[2]);
      }
      const W = nu + 1;
      for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
        const a = j * W + i,
          b = a + 1,
          c = a + W,
          d = c + 1;
        g.i.push(a, b, c, b, d, c);
      }
      return smoothN(g);
    }
    // dönme yüzeyi: profil [[r,y],...] yukarıdan aşağıya
    function resample(pr, k) {
      if (k <= 1 || pr.length < 3) return pr;
      const out = [];
      for (let i = 0; i < pr.length - 1; i++) {
        const p0 = pr[Math.max(0, i - 1)],
          p1 = pr[i],
          p2 = pr[i + 1],
          p3 = pr[Math.min(pr.length - 1, i + 2)];
        for (let s = 0; s < k; s++) {
          const t = s / k,
            t2 = t * t,
            t3 = t2 * t;
          out.push([0, 1].map(j => .5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)).map((v, j) => j == 0 ? Math.max(0, v) : v));
        }
      }
      out.push(pr[pr.length - 1]);
      return out;
    }
    function lathe(prof, col, seg = 18, o = {}) {
      if (prof[0][1] < prof[prof.length - 1][1]) prof = prof.slice().reverse();
      prof = resample(prof, q(o.res || 3, 1));
      seg = q(seg, 6);
      const n = prof.length - 1,
        sx = o.sx || 1,
        sz = o.sz || 1,
        d = o.disp;
      return grid(seg, n, (u, v) => {
        const j = Math.round(v * n),
          a = u * TAU,
          r = prof[j][0];
        let x = Math.cos(a) * r * sx,
          y = prof[j][1],
          z = Math.sin(a) * r * sz;
        if (d && r > 1e-4) {
          const k = 1 + d(x, y, z);
          x *= k;
          z *= k;
        }
        return [x, y, z];
      }, col);
    }
    function ellip(rx, ry, rz, col, o = {}) {
      const ws = q(o.ws || 18, 6),
        hs = q(o.hs || 12, 4),
        d = o.disp;
      return grid(ws, hs, (u, v) => {
        const a = u * TAU,
          t = v * Math.PI,
          nx = Math.sin(t) * Math.cos(a),
          ny = Math.cos(t),
          nz = Math.sin(t) * Math.sin(a);
        let k = 1;
        if (d) k += d(nx, ny, nz);
        return [nx * rx * k, ny * ry * k, nz * rz * k];
      }, col);
    }
    // incelen tüp: noktalar ve yarıçaplar, Catmull-Rom ile pürüzsüz
    function cr(p0, p1, p2, p3, t) {
      const t2 = t * t,
        t3 = t2 * t;
      return [0, 1, 2].map(i => .5 * (2 * p1[i] + (-p0[i] + p2[i]) * t + (2 * p0[i] - 5 * p1[i] + 4 * p2[i] - p3[i]) * t2 + (-p0[i] + 3 * p1[i] - 3 * p2[i] + p3[i]) * t3));
    }
    function tube(pts, rads, col, o = {}) {
      const rad = q(o.rad || 10, 4),
        per = q(o.seg || 6, 2),
        P = [],
        Rr = [];
      const n = pts.length;
      for (let k = 0; k < n - 1; k++) {
        const p0 = pts[Math.max(0, k - 1)],
          p1 = pts[k],
          p2 = pts[k + 1],
          p3 = pts[Math.min(n - 1, k + 2)];
        for (let s = 0; s < per; s++) {
          const t = s / per;
          P.push(cr(p0, p1, p2, p3, t));
          Rr.push(rads[k] + (rads[k + 1] - rads[k]) * t);
        }
      }
      P.push(pts[n - 1].slice());
      Rr.push(rads[n - 1]);
      const m = P.length,
        T = [];
      for (let i = 0; i < m; i++) {
        const a = P[Math.max(0, i - 1)],
          b = P[Math.min(m - 1, i + 1)],
          d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]],
          l = Math.hypot(...d) || 1;
        T.push(d.map(x => x / l));
      }
      let up = Math.abs(T[0][1]) < .9 ? [0, 1, 0] : [1, 0, 0];
      const cx = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
        nr = a => {
          const l = Math.hypot(...a) || 1;
          return a.map(x => x / l);
        };
      let N = nr(cx(cx(T[0], up), T[0]));
      const Ns = [],
        Bs = [];
      for (let i = 0; i < m; i++) {
        if (i > 0) {
          const B0 = cx(T[i], N);
          N = nr(cx(B0, T[i]));
        }
        Ns.push(N);
        Bs.push(nr(cx(T[i], N)));
      }
      const g = grid(rad, m - 1, (u, v) => {
        const i = Math.round(v * (m - 1)),
          a = u * TAU,
          r = Rr[i],
          c = Math.cos(a),
          s = Math.sin(a),
          Nn = Ns[i],
          B = Bs[i];
        let rr = r;
        if (o.disp) rr *= 1 + o.disp(P[i][0] + c, P[i][1], P[i][2] + s, u, v);
        return [P[i][0] + (Nn[0] * c + B[0] * s) * rr, P[i][1] + (Nn[1] * c + B[1] * s) * rr, P[i][2] + (Nn[2] * c + B[2] * s) * rr];
      }, (x, y, z, u, v) => colAt(col, x, y, z, u, v));
      const caps = [],
        cq = Q;
      Q = 1;
      if (Rr[0] > .028 && !o.noCap0) caps.push(ellip(Rr[0], Rr[0], Rr[0], colAt(col, ...P[0], 0, 0), {
        ws: rad,
        hs: Math.max(3, Math.round(rad / 2))
      }), [P[0]]);
      if (Rr[m - 1] > .028) caps.push(ellip(Rr[m - 1], Rr[m - 1], Rr[m - 1], colAt(col, ...P[m - 1], 0, 1), {
        ws: rad,
        hs: Math.max(3, Math.round(rad / 2))
      }), [P[m - 1]]);
      Q = cq;
      let out = g;
      for (let i = 0; i < caps.length; i += 2) out = merge(out, tf(caps[i], {
        t: caps[i + 1][0]
      }));
      return out;
    }
    // gürültülü yuvarlak (kaya, yaprak kümesi)
    function blob(r, col, o = {}) {
      const amp = o.amp == null ? .25 : o.amp,
        fr = o.fr || 1.6,
        sd = o.seed || 0;
      return ellip(r * (o.sx || 1), r * (o.sy || 1), r * (o.sz || 1), col, {
        ws: o.ws || 16,
        hs: o.hs || 11,
        disp: (x, y, z) => amp * fbm(x * fr + sd, y * fr + sd * 1.7, z * fr - sd, o.oct || 3) + (o.flat && y < -.2 ? (y + .2) * o.flat : 0)
      });
    }
    // düz levha: dışbükey çokgen, kalınlık z boyunca
    function slab(poly, th, col) {
      const g = {
          p: [],
          n: [],
          c: [],
          i: []
        },
        c = C(col),
        n = poly.length;
      let cx = 0,
        cy = 0;
      poly.forEach(p => {
        cx += p[0] / n;
        cy += p[1] / n;
      });
      const face = (z, s) => {
        const b = g.p.length / 3;
        g.p.push(cx, cy, z);
        g.n.push(0, 0, s);
        g.c.push(...c);
        poly.forEach(p => {
          g.p.push(p[0], p[1], z);
          g.n.push(0, 0, s);
          g.c.push(...c);
        });
        for (let i = 0; i < n; i++) {
          const a = b + 1 + i,
            d = b + 1 + (i + 1) % n;
          if (s > 0) g.i.push(b, a, d);else g.i.push(b, d, a);
        }
      };
      face(th / 2, 1);
      face(-th / 2, -1);
      for (let i = 0; i < n; i++) {
        const p = poly[i],
          q = poly[(i + 1) % n],
          ex = q[0] - p[0],
          ey = q[1] - p[1],
          l = Math.hypot(ex, ey) || 1,
          nx = ey / l,
          ny = -ex / l,
          b = g.p.length / 3;
        [[p, th / 2], [q, th / 2], [q, -th / 2], [p, -th / 2]].forEach(([v, z]) => {
          g.p.push(v[0], v[1], z);
          g.n.push(nx, ny, 0);
          g.c.push(...c);
        });
        g.i.push(b, b + 3, b + 1, b + 1, b + 3, b + 2);
      }
      return orient(g);
    }
    // iki yüzlü yaprak/zar: fn(u,v)->[x,y,z]
    function sheet(nu, nv, fn, col) {
      const a = grid(nu, nv, fn, col),
        b = grid(nu, nv, fn, col);
      for (let i = 0; i < b.p.length; i++) b.p[i] -= a.n[i] * .012;
      for (let f = 0; f < b.i.length; f += 3) {
        const t = b.i[f + 1];
        b.i[f + 1] = b.i[f + 2];
        b.i[f + 2] = t;
      }
      for (let i = 0; i < b.n.length; i++) b.n[i] = -b.n[i];
      return merge(a, b);
    }
    // süper-elips kesitli gövde: rings [{y,rx,rz,cx,cz,n}] (uçlarda rx:0 ile kapanır)
    const crs = (a, b, c, d, t) => {
      const t2 = t * t,
        t3 = t2 * t;
      return .5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
    };
    function loft(rings, col, o = {}) {
      const seg = q(o.seg || 20, 8),
        res = q(o.res || 3, 1),
        K = ['y', 'rx', 'rz', 'cx', 'cz', 'n'],
        gv = (r, k) => r[k] == null ? k == 'n' ? 2 : 0 : r[k];
      let R = rings.slice();
      if (R[0].y < R[R.length - 1].y) R.reverse();
      const S = [];
      for (let i = 0; i < R.length - 1; i++) {
        const a = R[Math.max(0, i - 1)],
          b = R[i],
          c = R[i + 1],
          d = R[Math.min(R.length - 1, i + 2)];
        for (let s = 0; s < res; s++) {
          const t = s / res,
            r = {};
          for (const k of K) r[k] = crs(gv(a, k), gv(b, k), gv(c, k), gv(d, k), t);
          r.rx = Math.max(0, r.rx);
          r.rz = Math.max(0, r.rz);
          S.push(r);
        }
      }
      {
        const r = {},
          l = R[R.length - 1];
        for (const k of K) r[k] = gv(l, k);
        S.push(r);
      }
      const nr = S.length;
      return grid(seg, nr - 1, (u, v) => {
        const r = S[Math.round(v * (nr - 1))],
          a = u * TAU,
          c = Math.cos(a),
          s = Math.sin(a),
          e = 2 / (r.n || 2),
          ex = Math.sign(c) * Math.pow(Math.abs(c), e),
          ez = Math.sign(s) * Math.pow(Math.abs(s), e);
        let x = ex * r.rx,
          z = ez * r.rz;
        if (o.disp) {
          const k = 1 + o.disp(r.cx + x, r.y, r.cz + z, u, v);
          x *= k;
          z *= k;
        }
        return [r.cx + x, r.y, r.cz + z];
      }, col);
    }
    // profil yarıçaplı uzuv: pts yol, prof [[t,rn,rb,on]] (rn: ileri ipucu yönünde, rb: yan, on: ileri kaydırma)
    function limb(pts, prof, col, o = {}) {
      const rad = q(o.rad || 12, 6),
        per = q(o.seg || 6, 2),
        P = [],
        n = pts.length;
      for (let k = 0; k < n - 1; k++) {
        const p0 = pts[Math.max(0, k - 1)],
          p1 = pts[k],
          p2 = pts[k + 1],
          p3 = pts[Math.min(n - 1, k + 2)];
        for (let s = 0; s < per; s++) P.push(cr(p0, p1, p2, p3, s / per));
      }
      P.push(pts[n - 1].slice());
      const m = P.length,
        L = [0];
      for (let i = 1; i < m; i++) L.push(L[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1], P[i][2] - P[i - 1][2]));
      const tot = L[m - 1] || 1;
      const pf = t => {
        let i = 0;
        while (i < prof.length - 2 && prof[i + 1][0] < t) i++;
        const a = prof[i],
          b = prof[i + 1] || a,
          u = b[0] > a[0] ? Math.max(0, Math.min(1, (t - a[0]) / (b[0] - a[0]))) : 0,
          w = u * u * (3 - 2 * u);
        return [1, 2, 3].map(j => (a[j] || 0) + ((b[j] || 0) - (a[j] || 0)) * w);
      };
      const hint = o.fwd || [0, 0, 1],
        cx = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
        nr = a => {
          const l = Math.hypot(...a) || 1;
          return a.map(x => x / l);
        },
        F = [];
      for (let i = 0; i < m; i++) {
        const a = P[Math.max(0, i - 1)],
          b = P[Math.min(m - 1, i + 1)],
          T = nr([b[0] - a[0], b[1] - a[1], b[2] - a[2]]);
        let h = hint,
          d = h[0] * T[0] + h[1] * T[1] + h[2] * T[2];
        if (Math.abs(d) > .95) {
          h = [0, 1, 0];
          d = T[1];
        }
        const N = nr([h[0] - d * T[0], h[1] - d * T[1], h[2] - d * T[2]]),
          B = cx(T, N);
        F.push([N, B]);
      }
      const e = 2 / (o.n || 2);
      const g = grid(rad, m - 1, (u, v) => {
        const i = Math.round(v * (m - 1)),
          [rn, rb, on] = pf(L[i] / tot),
          a = u * TAU,
          c = Math.cos(a),
          s = Math.sin(a),
          ec = Math.sign(c) * Math.pow(Math.abs(c), e),
          es = Math.sign(s) * Math.pow(Math.abs(s), e),
          [N, B] = F[i];
        let k = 1;
        if (o.disp) k += o.disp(P[i][0], P[i][1], P[i][2], u, v);
        return [0, 1, 2].map(j => P[i][j] + N[j] * (on + ec * rn * k) + B[j] * es * rb * k);
      }, (x, y, z, u, v) => colAt(col, x, y, z, u, v));
      let out = g;
      if (o.cap !== 0) {
        const cq = Q;
        Q = 1;
        for (const [i, t] of [[0, 0], [m - 1, 1]]) {
          if (o.cap === 1 && i == 0) continue;
          if (o.cap === -1 && i == m - 1) continue;
          const [rn, rb, on] = pf(t);
          if (Math.min(rn, rb) < .012) continue;
          const [N, B] = F[i],
            T = cx(N, B);
          const cp = ellip(rb, Math.min(rn, rb) * .8, rn, colAt(col, ...P[i], 0, t), {
              ws: rad,
              hs: Math.max(3, rad >> 1)
            }),
            M = v => [B[0] * v[0] + T[0] * v[1] + N[0] * v[2], B[1] * v[0] + T[1] * v[1] + N[1] * v[2], B[2] * v[0] + T[2] * v[1] + N[2] * v[2]];
          for (let j = 0; j < cp.p.length; j += 3) {
            const w = M([cp.p[j], cp.p[j + 1], cp.p[j + 2]]),
              nn = M([cp.n[j], cp.n[j + 1], cp.n[j + 2]]);
            cp.p[j] = w[0] + P[i][0] + N[0] * on;
            cp.p[j + 1] = w[1] + P[i][1] + N[1] * on;
            cp.p[j + 2] = w[2] + P[i][2] + N[2] * on;
            cp.n[j] = nn[0];
            cp.n[j + 1] = nn[1];
            cp.n[j + 2] = nn[2];
          }
          out = merge(out, cp);
        }
        Q = cq;
      }
      return out;
    }
    function rot(v, r) {
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
    function tf(g, o) {
      const s = o.s == null ? [1, 1, 1] : typeof o.s == 'number' ? [o.s, o.s, o.s] : o.s,
        r = o.r || [0, 0, 0],
        t = o.t || [0, 0, 0],
        h = {
          p: [],
          n: [],
          c: g.c.slice(),
          i: g.i.slice()
        };
      if (g.si) {
        h.si = g.si.slice();
        h.sw = g.sw.slice();
      }
      for (let i = 0; i < g.p.length; i += 3) {
        const p = rot([g.p[i] * s[0], g.p[i + 1] * s[1], g.p[i + 2] * s[2]], r);
        h.p.push(p[0] + t[0], p[1] + t[1], p[2] + t[2]);
        let n = rot([g.n[i] / s[0], g.n[i + 1] / s[1], g.n[i + 2] / s[2]], r);
        const l = Math.hypot(...n) || 1;
        h.n.push(n[0] / l, n[1] / l, n[2] / l);
      }
      if (s[0] * s[1] * s[2] < 0) {
        for (let f = 0; f < h.i.length; f += 3) {
          const q = h.i[f + 1];
          h.i[f + 1] = h.i[f + 2];
          h.i[f + 2] = q;
        }
      }
      return h;
    }
    function merge(...gs) {
      const L = gs.flat().filter(Boolean),
        sk = L.some(a => a.si),
        g = {
          p: [],
          n: [],
          c: [],
          i: []
        };
      if (sk) {
        g.si = [];
        g.sw = [];
      }
      for (const a of L) {
        const o = g.p.length / 3;
        for (const v of a.p) g.p.push(v);
        for (const v of a.n) g.n.push(v);
        for (const v of a.c) g.c.push(v);
        for (const k of a.i) g.i.push(k + o);
        if (sk) {
          const nv = a.p.length / 3;
          if (a.si) {
            for (const v of a.si) g.si.push(v);
            for (const v of a.sw) g.sw.push(v);
          } else for (let j = 0; j < nv; j++) {
            g.si.push(0, 0, 0, 0);
            g.sw.push(1, 0, 0, 0);
          }
        }
      }
      return g;
    }
    function paint(g, fn) {
      for (let i = 0; i < g.p.length; i += 3) {
        const c = C(fn(g.p[i], g.p[i + 1], g.p[i + 2], g.c.slice(i, i + 3), g.n[i], g.n[i + 1], g.n[i + 2]));
        g.c[i] = c[0];
        g.c[i + 1] = c[1];
        g.c[i + 2] = c[2];
      }
      return g;
    }
    return {
      setQ: v => {
        Q = v;
      },
      setRemap: m => {
        RMP = m;
      },
      loft,
      limb,
      grid,
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
      vn,
      hex,
      mixc,
      shade,
      smoothN,
      orient,
      C
    };
  })();
}
