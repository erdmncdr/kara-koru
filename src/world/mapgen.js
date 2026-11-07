// world/mapgen.js · Kara Koru
// Bu dosya tek dosyalık sürümden (v22) otomatik ayrıldı. Ortak oyun durumu core/store.js içindeki $G nesnesinde.

import { $G } from '../core/store.js';

export let MAPGEN;

export function __init_5() {
  // ---- harita üretici (three.js'ten bağımsız): yükseklik ızgarası, su, yollar, simge yapı yerleri, zemin renkleri
  MAPGEN = (() => {
    const N = 240,
      S = 2.5,
      O = 300,
      NN = N + 1;
    function rng(a) {
      return () => {
        a |= 0;
        a = a + 0x6D2B79F5 | 0;
        let t = Math.imul(a ^ a >>> 15, 1 | a);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
      };
    }
    function h2(i, j, s) {
      let h = Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(s, 982451653) | 0;
      h = Math.imul(h ^ h >>> 13, 1274126177);
      h ^= h >>> 16;
      return (h >>> 0) / 4294967295;
    }
    function vn2(x, z, s) {
      const xi = Math.floor(x),
        zi = Math.floor(z),
        xf = x - xi,
        zf = z - zi,
        u = xf * xf * (3 - 2 * xf),
        v = zf * zf * (3 - 2 * zf),
        a = h2(xi, zi, s),
        b = h2(xi + 1, zi, s),
        c = h2(xi, zi + 1, s),
        d = h2(xi + 1, zi + 1, s);
      return (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v) * 2 - 1;
    }
    function fb(x, z, o, s) {
      let t = 0,
        a = 1,
        f = 1,
        n = 0;
      for (let i = 0; i < o; i++) {
        t += vn2(x * f, z * f, s + i * 17) * a;
        n += a;
        a *= .5;
        f *= 2.07;
      }
      return t / n;
    }
    function rid(x, z, o, s) {
      let t = 0,
        a = 1,
        f = 1,
        n = 0;
      for (let i = 0; i < o; i++) {
        t += (1 - Math.abs(vn2(x * f, z * f, s + i * 31))) * a;
        n += a;
        a *= .5;
        f *= 2.1;
      }
      return t / n;
    }
    const sm = (a, b, x) => {
        const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
        return t * t * (3 - 2 * t);
      },
      mix = (a, b, t) => a + (b - a) * t;
    function dseg(px, pz, ax, az, bx, bz) {
      const dx = bx - ax,
        dz = bz - az,
        l = dx * dx + dz * dz;
      let t = l > 0 ? ((px - ax) * dx + (pz - az) * dz) / l : 0;
      t = Math.max(0, Math.min(1, t));
      return Math.hypot(px - ax - dx * t, pz - az - dz * t);
    }
    function dpoly(px, pz, P) {
      let m = 1e9;
      for (let i = 0; i < P.length - 1; i++) m = Math.min(m, dseg(px, pz, P[i][0], P[i][1], P[i + 1][0], P[i + 1][1]));
      return m;
    }
    const LR = {
      temple: 18,
      stones: 12,
      camp: 15,
      tower: 9,
      bigtree: 13,
      wall: 8,
      pond: 19,
      caravan: 23,
      kurgan: 17,
      skeleton: 18,
      oasis: 20,
      obelisk: 9,
      mesa: 19,
      lostcaravan: 14
    };
    const LN = {
      temple: 'Eski Tapınak',
      stones: 'Balbal Çemberi',
      camp: 'Otağ Kampı',
      tower: 'Gözcü Kulesi',
      bigtree: 'Ulu Kayın',
      wall: 'Yıkık Sur',
      pond: 'Ayna Göl',
      bridge: 'Eski Köprü',
      caravan: 'Kervansaray',
      kurgan: 'Kurgan',
      skeleton: 'Dev İskeleti',
      oasis: 'Vaha',
      obelisk: 'Dikilitaşlar',
      mesa: 'Kızıl Yayla',
      lostcaravan: 'Kayıp Kervan'
    };
    function gen(bi, seed) {
      const R = rng(seed),
        r = (a, b) => a + R() * (b - a),
        sd = seed % 9973 + bi * 101,
        H = new Float32Array(NN * NN),
        PM = new Float32Array(NN * NN),
        M = {
          bi,
          N,
          S,
          O,
          NN,
          H,
          PM,
          WL: 0,
          lm: [],
          paths: [],
          river: null,
          canyon: null,
          seed
        };
      // akarsu / kanyon yolu
      const curve = (z0, a1, a2, f1, f2, p1, p2) => {
        const P = [];
        for (let x = -320; x <= 320; x += 8) P.push([x, z0 + a1 * Math.sin(x / f1 + p1) + a2 * Math.sin(x / f2 + p2)]);
        return P;
      };
      const side = R() < .5 ? -1 : 1;
      if (bi != 1) M.river = curve(side * r(70, 110), r(30, 45), r(12, 20), r(70, 95), r(26, 36), r(0, 6), r(0, 6));else M.canyon = curve(side * r(75, 115), r(25, 40), r(10, 16), r(60, 85), r(24, 32), r(0, 6), r(0, 6));
      const flow = bi != 1 ? M.river : M.canyon;
      // simge yapı yerleri
      const types = bi == 0 ? ['temple', 'camp', 'bigtree', 'pond', 'stones', 'tower', 'wall', 'wall', 'wall'] : bi == 2 ? ['temple', 'stones', 'tower', 'kurgan', 'kurgan', 'skeleton', 'obelisk', 'pond', 'wall', 'wall'] : ['caravan', 'oasis', 'kurgan', 'skeleton', 'mesa', 'mesa', 'mesa', 'obelisk', 'lostcaravan', 'wall'];
      for (const t of types) {
        const rad = t == 'mesa' ? r(16, 24) : LR[t];
        let ok = 0;
        for (let k = 0; k < 400 && !ok; k++) {
          const a = r(0, 6.283),
            d = r(t == 'wall' ? 40 : 58, t == 'mesa' ? 205 : 192),
            x = Math.cos(a) * d,
            z = Math.sin(a) * d;
          if (Math.abs(x) > 205 || Math.abs(z) > 205) continue;
          if (dpoly(x, z, flow) < rad + (bi != 1 ? 44 : 16)) continue;
          if (M.lm.some(o => Math.hypot(o.x - x, o.z - z) < o.r + rad + 14)) continue;
          M.lm.push({
            t,
            x,
            z,
            r: rad,
            n: LN[t],
            ry: Math.floor(r(0, 4)) * Math.PI / 2
          });
          ok = 1;
        }
      }
      // köprü: ırmağın üstünde, merkeze yakın
      if (bi != 1) {
        let best = null;
        for (let x = -110; x <= 110; x += 4) {
          const z = flow.reduce((m, p) => Math.abs(p[0] - x) < Math.abs(m[0] - x) ? p : m)[1];
          const dd = Math.hypot(x, z);
          if (M.lm.some(o => Math.hypot(o.x - x, o.z - z) < o.r + 16)) continue;
          if (!best || dd < best.d) best = {
            x,
            z,
            d: dd
          };
        }
        if (best) M.lm.push({
          t: 'bridge',
          x: best.x,
          z: best.z,
          r: 6,
          n: LN.bridge,
          ry: 0
        });
      }
      // yollar: başlangıçtan simge yapılara
      for (const o of M.lm) {
        if (o.t == 'wall' || o.t == 'mesa' || o.t == 'pond') continue;
        const P = [],
          n = 18,
          px = -o.z,
          pz = o.x,
          pl = Math.hypot(px, pz) || 1,
          A = r(-16, 16),
          ph = r(0, 6.28),
          fq = r(1.5, 3);
        for (let i = 0; i <= n; i++) {
          const t = i / n,
            w = Math.sin(t * Math.PI) * (A + 5 * Math.sin(t * fq * 6.28 + ph));
          P.push([o.x * t * (1 - (o.r + 2) / Math.hypot(o.x, o.z) * t) + px / pl * w, o.z * t * (1 - (o.r + 2) / Math.hypot(o.x, o.z) * t) + pz / pl * w]);
        }
        M.paths.push(P);
      }
      // kayılacak büyük tepeler
      M.hills = [];
      for (let k = 0; k < (bi == 0 ? 4 : 3); k++) {
        for (let t = 0; t < 200; t++) {
          const x = r(-190, 190),
            z = r(-190, 190),
            R0 = r(34, 56);
          if (Math.hypot(x, z) < R0 + 30 || dpoly(x, z, flow) < R0 + 30 || M.lm.some(o => Math.hypot(o.x - x, o.z - z) < o.r + R0 + 10) || M.hills.some(h => Math.hypot(h.x - x, h.z - z) < h.R + R0)) continue;
          M.hills.push({
            x,
            z,
            R: R0,
            A: r(9, 16)
          });
          break;
        }
      }
      // akış eğrisi: her sütun için z ve eğim (hızlı uzaklık)
      const FZ = new Float32Array(NN),
        FS = new Float32Array(NN);
      for (let i = 0; i < NN; i++) {
        const x = i * S - O;
        let k = 0;
        while (k < flow.length - 2 && flow[k + 1][0] < x) k++;
        const a = flow[k],
          b = flow[k + 1],
          t = (x - a[0]) / (b[0] - a[0]);
        FZ[i] = a[1] + (b[1] - a[1]) * t;
        FS[i] = (b[1] - a[1]) / (b[0] - a[0]);
      }
      // yükseklik
      const ws = r(0, 6.283);
      for (let j = 0; j < NN; j++) for (let i = 0; i < NN; i++) {
        const x = i * S - O,
          z = j * S - O;
        let h;
        if (bi == 0) {
          h = 7 + 8 * fb(x / 125, z / 125, 4, sd) + 2.6 * fb(x / 38, z / 38, 3, sd + 5) + .5 * fb(x / 9, z / 9, 2, sd + 9);
        } else if (bi == 2) {
          // mezarlık: alçak dalgalı toprak, seyrek sırtlar, ince tümsekler
          const rg = rid(x / 90, z / 90, 2, sd + 6);
          h = 6 + 4.5 * fb(x / 130, z / 130, 4, sd) + 2.2 * fb(x / 34, z / 34, 3, sd + 5) + 2.5 * rg * rg * rg + .45 * fb(x / 8, z / 8, 2, sd + 9);
        } else {
          const du = Math.pow(Math.abs(Math.sin((x * Math.cos(ws) + z * Math.sin(ws)) / 15 + 2.2 * fb(x / 70, z / 70, 2, sd + 3))), 1.6);
          h = 6 + 5 * fb(x / 150, z / 150, 3, sd) + 2.3 * du + .35 * fb(x / 7, z / 7, 2, sd + 8);
        }
        for (const hl of M.hills) {
          const d = Math.hypot(x - hl.x, z - hl.z);
          if (d < hl.R * 2.2) h += hl.A * Math.exp(-Math.pow(d / hl.R, 2)) * (1 + .25 * fb(x / 20, z / 20, 2, sd + 31));
        }
        // başlangıç düzlüğü
        const d0 = Math.hypot(x, z);
        h = mix(h, bi == 0 ? 7 : 6.5, 1 - sm(16, 40, d0));
        // simge yapılar
        for (const o of M.lm) {
          const d = Math.hypot(x - o.x, z - o.z);
          if (d > o.r + 40) continue;
          if (o.t == 'mesa') {
            const dn = d / o.r + .13 * fb(x / 14, z / 14, 2, sd + o.x | 0);
            if (o.top == null) o.top = r(10, 14.5);
            const c = 1 - sm(.9, 1.04, dn);
            if (c > 0) {
              const tt = o.top + .25 * fb(x / 6, z / 6, 1, sd + 2);
              const st = Math.floor(c * 4) / 4;
              h = Math.max(h, mix(h, tt, Math.max(c > .97 ? 1 : st * .85 + c * .15, 0)));
            }
            continue;
          }
          if (o.t == 'kurgan') {
            h = mix(h, o.base == null ? o.base = h : o.base, 1 - sm(o.r - 2, o.r + 12, d));
            h += 6.5 * Math.exp(-Math.pow(d / (o.r * .55), 2));
            continue;
          }
          if (o.t == 'pond' || o.t == 'oasis') continue;
          if (o.base == null) o.base = h;
          h = mix(h, o.base, 1 - sm(o.r, o.r + 14, d));
        }
        // ırmak / kanyon / gölet
        const df = Math.abs(z - FZ[i]) / Math.sqrt(1 + FS[i] * FS[i]);
        if (bi != 1) {
          const w = 6.5 + 2.5 * Math.sin(x / 47);
          if (df < w + 34) {
            const tgt = df < w ? -1.25 * (1 - df / w * (df / w)) : (df - w) * .09;
            h = mix(h, tgt, 1 - sm(w, w + 34, df));
          }
        } else {
          const w = 8 + 3 * Math.sin(x / 39);
          if (df < w + 6) {
            const fl = h - 7.5 - .4 * fb(x / 9, z / 9, 2, sd + 4),
              k = 1 - sm(w * .75, w + 4, df);
            h = mix(h, fl, k);
          }
        }
        for (const o of M.lm) if (o.t == 'pond' || o.t == 'oasis') {
          const d = Math.hypot(x - o.x, z - o.z) / (o.r * (1 + .15 * fb(x / 12, z / 12, 2, sd + 7)));
          if (d < 2.6) {
            const tgt = d < 1 ? -1.3 * (1 - d * d) : (d - 1) * 1.1;
            h = mix(h, tgt, 1 - sm(1, 2.6, d));
          }
        }
        // su dışında su seviyesinin üstünde kal
        const wet = bi != 1 && df < 12 || M.lm.some(o => (o.t == 'pond' || o.t == 'oasis') && Math.hypot(x - o.x, z - o.z) < o.r * 1.25);
        if (!wet) h = Math.max(h, .7);
        // kenar dağları
        const r0 = Math.max(Math.abs(x), Math.abs(z)),
          rr = r0 < 200 ? r0 : r0 + 9 * fb(x / 50, z / 50, 2, sd + 11), // iç bölgede gürültü hesaplanmaz
          e = sm(212, 272, rr);
        if (e > 0) h += Math.pow(e, 1.35) * (bi == 0 ? 34 : 28) * (.6 + .55 * rid(x / 48, z / 48, 3, sd + 13)) + e * 6 * fb(x / 14, z / 14, 2, sd + 14);
        H[j * NN + i] = h;
      }
      // yol maskesi
      for (const P of M.paths) for (let k = 0; k < P.length - 1; k++) {
        const [ax, az] = P[k],
          [bx, bz] = P[k + 1],
          x0 = Math.min(ax, bx) - 6,
          x1 = Math.max(ax, bx) + 6,
          z0 = Math.min(az, bz) - 6,
          z1 = Math.max(az, bz) + 6;
        for (let j = Math.max(0, Math.floor((z0 + O) / S)); j <= Math.min(N, Math.ceil((z1 + O) / S)); j++) for (let i = Math.max(0, Math.floor((x0 + O) / S)); i <= Math.min(N, Math.ceil((x1 + O) / S)); i++) {
          const x = i * S - O,
            z = j * S - O,
            d = dseg(x, z, ax, az, bx, bz),
            v = 1 - sm(1.6, 3.6, d + 1.2 * fb(x / 5, z / 5, 1, sd + 21));
          if (v > PM[j * NN + i]) PM[j * NN + i] = v;
        }
      }
      M.ht = (x, z) => {
        const fx = (x + O) / S,
          fz = (z + O) / S;
        let i = Math.floor(fx),
          j = Math.floor(fz);
        if (i < 0) i = 0;
        if (j < 0) j = 0;
        if (i > N - 1) i = N - 1;
        if (j > N - 1) j = N - 1;
        const u = Math.min(1, Math.max(0, fx - i)),
          v = Math.min(1, Math.max(0, fz - j)),
          a = H[j * NN + i],
          b = H[j * NN + i + 1],
          c = H[(j + 1) * NN + i],
          d = H[(j + 1) * NN + i + 1];
        return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
      };
      M.pm = (x, z) => {
        const i = Math.round((x + O) / S),
          j = Math.round((z + O) / S);
        return i < 0 || j < 0 || i > N || j > N ? 0 : PM[j * NN + i];
      };
      // akış mesafesi: sütun tabanlı yaklaşık (gen içindeki df ile aynı); dpoly 81 parçayı tarıyordu, 58k köşe × 10 çağrı = kurulumun yarısı
      M.FZ = FZ;
      M.FS = FS;
      M.flowD = (x, z) => {
        const i = Math.max(0, Math.min(N, Math.round((x + O) / S)));
        return Math.abs(z - FZ[i]) / Math.sqrt(1 + FS[i] * FS[i]);
      };
      for (const o of M.lm) {
        o.y = M.ht(o.x, o.z);
      }
      return M;
    }
    // zemin renkleri (sRGB 0..1), eğim, yol, su, gürültü
    function colors(M) {
      const {
          H,
          NN,
          S,
          O,
          bi
        } = M,
        C = new Float32Array(NN * NN * 3),
        sd = M.seed % 9973;
      const hx = h => [(h >> 16 & 255) / 255, (h >> 8 & 255) / 255, (h & 255) / 255],
        mx3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
      const P = bi == 2 ? {
        g1: hx(0x4d5244),
        g2: hx(0x5c6650),
        g3: hx(0x6e6a5a),
        fl: hx(0x2c2a2e),
        dirt: hx(0x4a4038),
        sand: hx(0x66625a),
        rock: hx(0x5c5a66),
        rock2: hx(0x44424e),
        bed: hx(0x262a30),
        snow: hx(0x80848c)
      } : bi == 0 ? {
        g1: hx(0x4f7a34),
        g2: hx(0x6a8c3a),
        g3: hx(0x8a9a48),
        fl: hx(0x4a4a2a),
        dirt: hx(0x7a6244),
        sand: hx(0xa8946a),
        rock: hx(0x6e6a68),
        rock2: hx(0x58545a),
        bed: hx(0x4a5a4a),
        snow: hx(0x8a8e80)
      } : {
        g1: hx(0xc08a5c),
        g2: hx(0xd09a68),
        g3: hx(0xb07850),
        fl: hx(0x8a4a32),
        dirt: hx(0xa86c48),
        sand: hx(0xd8b080),
        rock: hx(0x9a5a40),
        rock2: hx(0x7a4230),
        bed: hx(0x6a3a2a),
        snow: hx(0xb08060)
      };
      for (let j = 0; j < NN; j++) for (let i = 0; i < NN; i++) {
        const k = j * NN + i,
          x = i * S - O,
          z = j * S - O,
          h = H[k],
          hl = H[k - (i > 0 ? 1 : 0)],
          hr = H[k + (i < NN - 1 ? 1 : 0)],
          hd = H[k - (j > 0 ? NN : 0)],
          hu = H[k + (j < NN - 1 ? NN : 0)],
          sl = Math.hypot(hr - hl, hu - hd) / (2 * S);
        const n1 = fb(x / 40, z / 40, 3, sd + 40),
          n2 = fb(x / 9, z / 9, 2, sd + 41);
        let c;
        if (bi != 1) {
          c = mx3(P.g1, P.g2, Math.max(0, Math.min(1, .5 + n1)));
          c = mx3(c, P.g3, Math.max(0, n2 * .8 - .15));
          const gr = Math.max(0, fb(x / 55, z / 55, 2, sd + 42));
          c = mx3(c, P.fl, gr * (bi == 2 ? .7 : .55));
          if (bi == 0) c = mx3(c, hx(0x5e4426), sm(.12, .42, fb(x / 70, z / 70, 2, sd + 50)) * .5); // koru içi: yaprak döküntüsü, build.js grove maskesiyle aynı gürültü
        } else {
          c = mx3(P.g1, P.g2, Math.max(0, Math.min(1, .5 + n1)));
          c = mx3(c, P.g3, Math.max(0, n2 * .9));
          const cr = Math.max(0, fb(x / 30, z / 30, 2, sd + 43) - .15) * (.5 + .5 * Math.abs(fb(x / 3, z / 3, 2, sd + 44)));
          c = mx3(c, P.fl, Math.min(.55, cr * 2.2));
          c = mx3(c, P.sand, sm(.15, .6, fb(x / 18, z / 18, 2, sd + 45)) * .55); // açık kum sürüklenmeleri
          c = mx3(c, P.rock2, sm(.3, .7, fb(x / 36, z / 36, 2, sd + 46)) * .3); // koyu kaya döşemesi
          if (M.FZ) {
            const cd = Math.abs(z - M.FZ[i]) / Math.sqrt(1 + M.FS[i] * M.FS[i]);
            if (cd < 10) c = mx3(c, [.5, .33, .2], .55 * (1 - cd / 10)); // kanyon tabanı: kuru dere yatağı
          }
        }
        const pm = M.PM[k];
        if (pm > 0) c = mx3(c, P.dirt, pm * .85);
        if (h < 1.6) c = mx3(c, P.sand, sm(1.6, .6, h));
        if (h < -.1) c = mx3(c, P.bed, sm(-.1, -.9, h));
        const rk = sm(.42, .75, sl);
        if (rk > 0) {
          let rc = mx3(P.rock, P.rock2, .5 + .5 * Math.sin(h * (bi == 1 ? 2.2 : 1.3) + n2 * 2));
          c = mx3(c, rc, rk);
        }
        if (h > 26) c = mx3(c, P.snow, sm(26, 40, h) * .6);
        const sh = .92 + .12 * n2;
        C[k * 3] = c[0] * sh;
        C[k * 3 + 1] = c[1] * sh;
        C[k * 3 + 2] = c[2] * sh;
      }
      return C;
    }
    return {
      gen,
      colors,
      fb,
      rid,
      vn2,
      sm,
      rng,
      dpoly,
      LR,
      LN
    };
  })();
}
