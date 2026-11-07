// audio/synth.js · Kara Koru
// Bu dosya tek dosyalık sürümden (v22) otomatik ayrıldı. Ortak oyun durumu core/store.js içindeki $G nesnesinde.

import { $G } from '../core/store.js';

export let SND;

export function SNDSRC() {
  // ---- ses tasarımı: saf DSP (tarayıcı + Node), örnekler oyun başında bir kez üretilir
  const DSP = (() => {
    let SR = 32000,
      _s = 1;
    const setSR = v => {
        SR = v;
      },
      sr = () => SR,
      seed = v => {
        _s = v >>> 0 || 1;
      };
    const R = () => {
      _s ^= _s << 13;
      _s >>>= 0;
      _s ^= _s >>> 17;
      _s ^= _s << 5;
      _s >>>= 0;
      return _s / 4294967296;
    };
    const rr = (a, b) => a + (b - a) * R(),
      ri = (a, b) => Math.floor(a + (b - a + 1) * R()),
      pk = a => a[Math.floor(R() * a.length)];
    const B = s => new Float32Array(Math.max(1, Math.ceil(s * SR))),
      N = s => Math.max(1, Math.ceil(s * SR));
    // gürültüler
    function white(s) {
      const n = N(s),
        o = new Float32Array(n);
      for (let i = 0; i < n; i++) o[i] = R() * 2 - 1;
      return o;
    }
    function pink(s) {
      const n = N(s),
        o = new Float32Array(n);
      let b0 = 0,
        b1 = 0,
        b2 = 0,
        b3 = 0,
        b4 = 0,
        b5 = 0,
        b6 = 0;
      for (let i = 0; i < n; i++) {
        const w = R() * 2 - 1;
        b0 = .99886 * b0 + w * .0555179;
        b1 = .99332 * b1 + w * .0750759;
        b2 = .969 * b2 + w * .153852;
        b3 = .8665 * b3 + w * .3104856;
        b4 = .55 * b4 + w * .5329522;
        b5 = -.7616 * b5 - w * .016898;
        o[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * .5362) * .11;
        b6 = w * .115926;
      }
      return o;
    }
    function brown(s) {
      const n = N(s),
        o = new Float32Array(n);
      let l = 0;
      for (let i = 0; i < n; i++) {
        l = (l + .02 * (R() * 2 - 1)) / 1.02;
        o[i] = l * 3.5;
      }
      return o;
    }
    // yumuşak rastgele kıpırtı: rate Hz, ortalama 0, tepe ~1
    function wob(s, rate) {
      const n = N(s),
        o = new Float32Array(n),
        st = Math.max(1, Math.floor(SR / rate));
      let a = R() * 2 - 1,
        b = R() * 2 - 1;
      for (let i = 0; i < n; i++) {
        const k = i % st;
        if (k == 0) {
          a = b;
          b = R() * 2 - 1;
        }
        const u = k / st,
          e = u * u * (3 - 2 * u);
        o[i] = a + (b - a) * e;
      }
      return o;
    }
    // durum değişkenli filtre (TPT); f ve q sabit ya da t->değer fonksiyonu
    /** @param {any} f @param {any} [q] */
    function svf(x, mode, f, q = .707) {
      const n = x.length,
        o = new Float32Array(n),
        ff = typeof f == 'function',
        qf = typeof q == 'function';
      let ic1 = 0,
        ic2 = 0,
        g = 0,
        k = 1,
        a1 = 0,
        a2 = 0,
        a3 = 0;
      const co = i => {
        const fc = Math.min(SR * .45, Math.max(8, ff ? f(i / SR) : f));
        g = Math.tan(Math.PI * fc / SR);
        k = 1 / Math.max(.1, qf ? q(i / SR) : q);
        a1 = 1 / (1 + g * (g + k));
        a2 = g * a1;
        a3 = g * a2;
      };
      co(0);
      const dyn = ff || qf;
      for (let i = 0; i < n; i++) {
        if (dyn && (i & 7) == 0) co(i);
        const v0 = x[i],
          v3 = v0 - ic2,
          v1 = a1 * ic1 + a2 * v3,
          v2 = ic2 + a2 * ic1 + a3 * v3;
        ic1 = 2 * v1 - ic1;
        ic2 = 2 * v2 - ic2;
        o[i] = mode == 'lp' ? v2 : mode == 'bp' ? v1 * k : mode == 'hp' ? v0 - k * v1 - v2 : v0 - k * v1;
      }
      return o;
    }
    const lp = (x, f, q) => svf(x, 'lp', f, q),
      hp = (x, f, q) => svf(x, 'hp', f, q),
      bp = (x, f, q) => svf(x, 'bp', f, q);
    function lp1(x, f) {
      const a = Math.exp(-2 * Math.PI * f / SR),
        o = new Float32Array(x.length);
      let y = 0;
      for (let i = 0; i < x.length; i++) {
        y = x[i] + (y - x[i]) * a;
        o[i] = y;
      }
      return o;
    }
    function hp1(x, f) {
      const l = lp1(x, f);
      for (let i = 0; i < x.length; i++) l[i] = x[i] - l[i];
      return l;
    }
    // RBJ tepe/raf eşitleyici
    function eq(x, f, q, db, ty) {
      const A = Math.pow(10, db / 40),
        w = 2 * Math.PI * Math.min(f, SR * .45) / SR,
        c = Math.cos(w),
        sn = Math.sin(w),
        al = sn / (2 * q);
      let b0, b1, b2, a0, a1, a2;
      if (ty == 'ls' || ty == 'hs') {
        const sA = 2 * Math.sqrt(A) * al,
          s = ty == 'ls' ? 1 : -1;
        b0 = A * (A + 1 - s * (A - 1) * c + sA);
        b1 = s * 2 * A * (A - 1 - s * (A + 1) * c);
        b2 = A * (A + 1 - s * (A - 1) * c - sA);
        a0 = A + 1 + s * (A - 1) * c + sA;
        a1 = -s * 2 * (A - 1 + s * (A + 1) * c);
        a2 = A + 1 + s * (A - 1) * c - sA;
      } else {
        b0 = 1 + al * A;
        b1 = -2 * c;
        b2 = 1 - al * A;
        a0 = 1 + al / A;
        a1 = -2 * c;
        a2 = 1 - al / A;
      }
      b0 /= a0;
      b1 /= a0;
      b2 /= a0;
      a1 /= a0;
      a2 /= a0;
      const o = new Float32Array(x.length);
      let x1 = 0,
        x2 = 0,
        y1 = 0,
        y2 = 0;
      for (let i = 0; i < x.length; i++) {
        const y = b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
        x2 = x1;
        x1 = x[i];
        y2 = y1;
        y1 = y;
        o[i] = y;
      }
      return o;
    }
    // osilatörler (polyBLEP), f sabit ya da t->Hz
    function blep(t, dt) {
      if (t < dt) {
        t /= dt;
        return t + t - t * t - 1;
      }
      if (t > 1 - dt) {
        t = (t - 1) / dt;
        return t * t + t + t + 1;
      }
      return 0;
    }
    function osc(s, ty, f, o = {}) {
      const n = N(s),
        out = new Float32Array(n),
        ff = typeof f == 'function',
        pw = o.pw || .5;
      let p = o.ph != null ? o.ph : R();
      for (let i = 0; i < n; i++) {
        const fr = ff ? f(i / SR) : f,
          dt = Math.min(.45, fr / SR);
        let v;
        if (ty == 'sin') v = Math.sin(6.283185307 * p);else if (ty == 'saw') v = 2 * p - 1 - blep(p, dt);else if (ty == 'sq') {
          v = (p < pw ? 1 : -1) + blep(p, dt) - blep((p + 1 - pw) % 1, dt);
        } else v = 1 - 4 * Math.abs(p - .5);
        out[i] = v;
        p += dt;
        if (p >= 1) p -= 1;
      }
      return out;
    }
    // tok vuruş: üstel perde düşüşlü sinüs
    function thud(s, f0, f1, tp, ta, at = .0015) {
      const n = N(s),
        o = new Float32Array(n);
      let ph = 0;
      for (let i = 0; i < n; i++) {
        const t = i / SR,
          f = f1 + (f0 - f1) * Math.exp(-t / tp);
        ph += 6.283185307 * f / SR;
        o[i] = Math.sin(ph) * Math.min(1, t / at) * Math.exp(-t / ta);
      }
      return o;
    }
    // zarflar
    function env(x, a, d, hold = 0, cv = 1) {
      const n = x.length;
      for (let i = 0; i < n; i++) {
        const t = i / SR;
        let e = t < a ? Math.pow(t / a, cv) : t < a + hold ? 1 : Math.exp(-(t - a - hold) / d);
        x[i] *= e;
      }
      return x;
    }
    function envF(x, fn) {
      for (let i = 0; i < x.length; i++) x[i] *= fn(i / SR);
      return x;
    }
    function pts(p) {
      return t => {
        if (t <= p[0][0]) return p[0][1];
        for (let i = 1; i < p.length; i++) if (t <= p[i][0]) {
          const a = p[i - 1],
            b = p[i],
            u = (t - a[0]) / (b[0] - a[0]);
          return a[1] + (b[1] - a[1]) * u;
        }
        return p[p.length - 1][1];
      };
    }
    // karışım
    function mix(d, s, at = 0, g = 1) {
      const o = Math.round(at * SR);
      for (let i = 0, L = s.length; i < L; i++) {
        const j = o + i;
        if (j >= d.length) break;
        if (j >= 0) d[j] += s[i] * g;
      }
      return d;
    }
    function mul(x, g) {
      for (let i = 0; i < x.length; i++) x[i] *= g;
      return x;
    }
    function sat(x, dr) {
      const k = Math.tanh(dr);
      for (let i = 0; i < x.length; i++) x[i] = Math.tanh(x[i] * dr) / k;
      return x;
    }
    function peak(x) {
      let m = 0;
      for (let i = 0; i < x.length; i++) {
        const a = Math.abs(x[i]);
        if (a > m) m = a;
      }
      return m;
    }
    function norm(x, p = .9) {
      const m = peak(x);
      if (m > 1e-9) mul(x, p / m);
      return x;
    }
    function fade(x, fi = .001, fo = .012) {
      const a = N(fi),
        b = N(fo),
        n = x.length;
      for (let i = 0; i < a && i < n; i++) x[i] *= i / a;
      for (let i = 0; i < b && i < n; i++) x[n - 1 - i] *= i / b;
      return x;
    }
    function dc(x) {
      return hp1(x, 22);
    }
    // modal rezonatör bankası: m=[[f,decay(sn),genlik],...], uyarı sinyali exc ile sürülür
    function modal(exc, m, s) {
      const n = N(s),
        o = new Float32Array(n),
        L = exc.length;
      for (const [f, d, a] of m) {
        if (f >= SR * .45 || f <= 0) continue;
        const w = 6.283185307 * f / SR,
          r = Math.exp(-1 / (d * SR)),
          c1 = 2 * r * Math.cos(w),
          c2 = -r * r,
          g = a * Math.sin(w);
        let y1 = 0,
          y2 = 0;
        const stop = Math.min(n, L + Math.ceil(d * SR * 7));
        for (let i = 0; i < stop; i++) {
          const y = c1 * y1 + c2 * y2 + (i < L ? exc[i] : 0);
          y2 = y1;
          y1 = y;
          o[i] += y * g;
        }
      }
      return o;
    }
    // vuruş uyarısı: tokmak sertliği (kısa=parlak)
    function mallet(dur, cut) {
      return env(lp(white(dur), cut), .0002, dur * .35);
    }
    // tel modeli (Karplus-Strong + kesirli gecikme), o: br parlaklık, t60, pick konumu, ex uyarı süresi
    function pluck(f, s, o = {}) {
      const n = N(s),
        out = new Float32Array(n),
        P = SR / f,
        S = .5 - .42 * (o.br != null ? o.br : .6),
        Nn = Math.max(2, Math.floor(P - S - .15)),
        D = P - S - Nn,
        C = (1 - D) / (1 + D),
        Lb = Nn + 3,
        dl = new Float32Array(Lb);
      const g = Math.pow(10, -3 / ((o.t60 || 1.5) * f)),
        exL = Math.max(8, Math.round(P * (o.ex || 1)));
      let exc = white(exL / SR);
      exc = lp(exc, o.ec || Math.min(SR * .4, 1500 + 9000 * (o.br != null ? o.br : .6)));
      const pkp = Math.round(P * (o.pick || .13));
      if (pkp > 1) {
        const e2 = new Float32Array(exc.length);
        for (let i = 0; i < exc.length; i++) e2[i] = exc[i] - (i >= pkp ? exc[i - pkp] : 0);
        exc = e2;
      }
      let w = 0,
        ax = 0,
        ay = 0;
      for (let i = 0; i < n; i++) {
        const d0 = dl[(w - Nn + Lb) % Lb],
          d1 = dl[(w - Nn - 1 + 2 * Lb) % Lb],
          l = (1 - S) * d0 + S * d1,
          a = C * l + ax - C * ay;
        ax = l;
        ay = a;
        const y = (i < exc.length ? exc[i] : 0) + g * a;
        dl[w] = y;
        w = (w + 1) % Lb;
        out[i] = y;
      }
      return out;
    }
    // gırtlak kaynağı + formantlar: canavar/insan sesi
    const VW = {
      a: [730, 1090, 2440, 3400],
      o: [570, 840, 2410, 3300],
      u: [300, 870, 2240, 3200],
      e: [530, 1840, 2480, 3500],
      i: [270, 2290, 3010, 3700],
      r: [620, 1200, 2500, 3500]
    };
    function voc(s, f0, vw, o = {}) {
      const n = N(s),
        sc = o.sc || 1,
        jt = o.jit || .03,
        jw = wob(s, o.jr || 22),
        src = new Float32Array(n),
        fz = typeof f0 == 'function';
      let p = R();
      const rgh = o.rough || 0,
        rr2 = o.rr || 28;
      let rp = R();
      for (let i = 0; i < n; i++) {
        const t = i / SR,
          fr = (fz ? f0(t) : f0) * (1 + jt * jw[i]),
          dt = Math.min(.45, fr / SR);
        let v = 2 * p - 1 - blep(p, dt);
        if (o.sub) {
          v += .5 * (p < .5 ? 1 : -1);
        }
        p += dt;
        if (p >= 1) p -= 1;
        rp += rr2 * (1 + .3 * jw[i]) / SR;
        if (rp >= 1) rp -= 1;
        src[i] = v * (1 - rgh * (.5 + .5 * Math.sin(6.283185 * rp)));
      }
      let x = lp1(src, o.gl || 2600);
      if (o.br) {
        const w = white(s);
        for (let i = 0; i < n; i++) x[i] += w[i] * o.br * .5;
      }
      const out = new Float32Array(n),
        am = o.fa || [1, .55, .28, .12],
        bw = o.bw || [80, 100, 150, 220],
        vf = typeof vw == 'function';
      for (let k = 0; k < 4; k++) {
        const F = /** @type {any} */ (vf ? t => vw(t)[k] * sc : (VW[vw] || vw)[k] * sc),
          y = bp(x, F, vf ? t => vw(t)[k] * sc / bw[k] : F / bw[k]);
        for (let i = 0; i < n; i++) out[i] += y[i] * am[k];
      }
      return out;
    }
    const vlerp = (a, b) => t => {
      const A = VW[a],
        Bv = VW[b];
      return [0, 1, 2, 3].map(k => A[k] + (Bv[k] - A[k]) * Math.min(1, Math.max(0, t)));
    };
    // döngüyü ek yerinden yumuşak birleştir
    function loopify(x, xf) {
      const L = x.length - N(xf),
        X = N(xf),
        o = new Float32Array(L);
      for (let i = 0; i < L; i++) o[i] = x[i];
      for (let i = 0; i < X; i++) {
        const u = i / X,
          a = Math.sin(u * 1.5708),
          b = Math.cos(u * 1.5708);
        o[i] = x[i] * a + x[L + i] * b;
      }
      return o;
    }
    // kabarcık (Minnaert): yükselen perde
    function bub(f0, tau, rise = .6) {
      const s = tau * 6,
        n = N(s),
        o = new Float32Array(n);
      let ph = 0;
      for (let i = 0; i < n; i++) {
        const t = i / SR;
        ph += 6.283185 * f0 * (1 + rise * t / tau * .15) / SR;
        o[i] = Math.sin(ph) * Math.exp(-t / tau) * Math.min(1, t / .0007);
      }
      return o;
    }
    // serpiştir: cnt adet tane, zaman fonksiyonu tf(i,u)->sn, tane fonksiyonu gf(i)->dizi, kazanç gn(i,t)
    function scat(d, cnt, tf, gf, gn) {
      for (let i = 0; i < cnt; i++) {
        const t = tf(i, R());
        mix(d, gf(i), t, gn ? gn(i, t) : 1);
      }
      return d;
    }
    return {
      setSR,
      sr,
      seed,
      R,
      rr,
      ri,
      pk,
      B,
      N,
      white,
      pink,
      brown,
      wob,
      svf,
      lp,
      hp,
      bp,
      lp1,
      hp1,
      eq,
      osc,
      thud,
      env,
      envF,
      pts,
      mix,
      mul,
      sat,
      peak,
      norm,
      fade,
      dc,
      modal,
      mallet,
      pluck,
      voc,
      vlerp,
      VW,
      loopify,
      bub,
      scat
    };
  })();

  // ---- ses tarifleri: her ad için n varyasyon; f(v) mono Float32Array ya da [L,R] döndürür
  const SREC = (() => {
    const D = DSP,
      {
        rr,
        ri,
        R,
        B,
        N,
        white,
        pink,
        brown,
        wob,
        svf,
        lp,
        hp,
        bp,
        lp1,
        hp1,
        eq,
        osc,
        thud,
        env,
        envF,
        pts,
        mix,
        mul,
        sat,
        norm,
        fade,
        modal,
        mallet,
        pluck,
        voc,
        vlerp,
        bub,
        scat,
        loopify
      } = D;
    // ortak parçalar
    const click = (cut = 3000, d = .002) => env(hp(white(d * 4), cut), .0001, d);
    const burst = (s, m, f, q, a, d) => env(svf(white(s), m, f, q), a, d),
      pburst = (s, m, f, q, a, d) => env(svf(pink(s), m, f, q), a, d);
    const stoneM = (f, k = 1) => [[f, .03 * k, 1], [f * 1.83, .022 * k, .7], [f * 2.71, .016 * k, .5], [f * 3.9, .012 * k, .35], [f * 5.1, .009 * k, .25]];
    const woodM = (f, k = 1) => [[f, .06 * k, 1], [f * 2.31, .04 * k, .6], [f * 3.92, .025 * k, .4], [f * 5.8, .015 * k, .25]];
    const barM = (f, k = 1) => [[f, .35 * k, 1], [f * 2.756, .2 * k, .5], [f * 5.404, .12 * k, .3], [f * 8.933, .08 * k, .15]];
    const glassM = (f, k = 1) => [[f, .25 * k, 1], [f * 2.32, .12 * k, .35], [f * 4.25, .07 * k, .18], [f * 6.63, .04 * k, .08]];
    const boneM = f => [[f, .025, 1], [f * 2.4, .015, .6], [f * 3.9, .01, .35], [f * 5.6, .007, .2]];
    const memM = (f, k = 1) => [1, 1.594, 2.136, 2.296, 2.653, 2.918, 3.156, 3.501].map((r, i) => [f * r, k * .5 / (1 + i * .6), 1 / (1 + i * .7)]);
    const stone = (f, k = 1) => modal(mallet(.0015, 6000), stoneM(f, k), .12 * k + .04);
    const bone = f => modal(mallet(.0008, 9000), boneM(f), .08);
    const wood = (f, k = 1, cut = 3500) => modal(mallet(.002, cut), woodM(f, k), .2 * k + .03);
    const metal = (f, k = 1) => modal(mallet(.001, 9000), barM(f, k), Math.min(1.6, .5 * k + .05));
    const glass = (f, k = 1) => modal(mallet(.0012, 8000), glassM(f, k), .6 * k + .05);
    const coin = f => modal(mallet(.0006, 12000), [1, 1.59, 2.14, 2.3, 2.65, 2.92, 3.16].map(k => [f * k * rr(.99, 1.01), rr(.06, .24), rr(.3, 1)]), .4);
    const rustle = (s, rate) => {
      const w = wob(s, rate);
      for (let i = 0; i < w.length; i++) {
        const v = Math.max(0, w[i]);
        w[i] = v * v * 1.6;
      }
      return w;
    };
    const amul = (x, a) => {
      for (let i = 0; i < x.length && i < a.length; i++) x[i] *= a[i];
      return x;
    };
    const bell = (c, w) => t => Math.exp(-Math.pow((t - c) / w, 2));
    const whoosh = (s, ft, q, et, src) => envF(svf(src || pink(s), 'bp', ft, q), et);
    const exs = (f, t) => Math.exp(-t / f);
    const st2 = fn => fn(0);
    const delay = (x, ms) => {
      const d = N(ms),
        o = new Float32Array(x.length);
      for (let i = d; i < x.length; i++) o[i] = x[i - d];
      return o;
    };
    const grains = (o, c, t0, t1, gf, g0, pow = 1.5) => scat(o, c, () => t0 + Math.pow(R(), pow) * (t1 - t0), gf, (i, t) => g0 * rr(.4, 1) * (1 - .6 * (t - t0) / (t1 - t0 + 1e-6)));
    // Hicaz (Re): derece -> Hz
    const HZ = [0, 1, 4, 5, 7, 8, 10],
      hz = (deg, base = 146.83) => base * Math.pow(2, (HZ[(deg % 7 + 7) % 7] + 12 * Math.floor(deg / 7)) / 12);

    // ---------- çalgılar
    function bag(f, v) {
      const s = 1.5,
        o = B(s),
        t60 = 1.9 * Math.pow(220 / f, .35),
        br = v ? .68 : .8,
        pick = v ? .17 : .11;
      mix(o, pluck(f, s, {
        br,
        t60,
        pick
      }), 0, 1);
      mix(o, pluck(f * Math.pow(2, rr(2, 5) / 1200), s, {
        br: br - .05,
        t60: t60 * .9,
        pick: pick + .03
      }), rr(.002, .006), .75);
      if (f < 200) mix(o, pluck(f * 2 * Math.pow(2, -rr(1, 4) / 1200), s, {
        br: .8,
        t60: t60 * .7,
        pick: .2
      }), .003, .45);
      mix(o, click(3500, .0015), 0, .18);
      let x = eq(o, 240, 1.2, 5);
      x = eq(x, 1150, 1.6, 3.5);
      x = eq(x, 3600, 1, 2.5);
      x = hp1(x, 70);
      return fade(x, .0005, .08);
    }
    function bass(f) {
      const s = 1.4;
      let x = pluck(f, s, {
        br: .32,
        t60: 2.2,
        pick: .22
      });
      mix(x, env(osc(s, 'sin', f), .004, .45), 0, .35);
      x = lp(x, 1400);
      x = eq(x, 110, 1, 3);
      return fade(x, .0005, .1);
    }
    function davG(v) {
      const f = rr(56, 64),
        o = B(1.1);
      mix(o, thud(1.05, f * 1.7, f, .018, .3), 0, 1);
      mix(o, modal(mallet(.006, 1800), memM(f * 1.12, .6), .9), 0, .35);
      mix(o, pburst(.06, 'lp', 900, .7, .001, .016), 0, .45);
      return fade(sat(o, 1.35), .0005, .1);
    }
    function davT(v) {
      const o = B(.4);
      mix(o, click(2500, .002), 0, .5);
      mix(o, modal(mallet(.001, 7000), memM(rr(205, 250), .22), .35), 0, .6);
      mix(o, burst(.14, 'bp', 3400, .7, .001, .035), 0, .45);
      return fade(o, .0003, .05);
    }
    function dkD(v) {
      const o = B(.6);
      mix(o, thud(.55, rr(150, 165), rr(92, 102), .012, .17), 0, 1);
      mix(o, modal(mallet(.003, 2600), memM(rr(98, 108), .35), .5), 0, .28);
      mix(o, click(1500, .002), 0, .15);
      return fade(o, .0003, .06);
    }
    function dkT(v) {
      const o = B(.3),
        f = rr(640, 700);
      mix(o, modal(mallet(.0007, 11000), [[f, .07, 1], [f * 2.18, .05, .6], [f * 3.33, .04, .5], [f * 5.1, .028, .35], [f * 7.2, .018, .2]], .3), 0, 1);
      mix(o, click(4000, .0015), 0, .4);
      return fade(o, .0003, .04);
    }
    function dkK(v) {
      const o = B(.22),
        f = rr(560, 620);
      mix(o, modal(mallet(.001, 8000), [[f, .045, 1], [f * 2.3, .035, .5], [f * 3.6, .025, .35]], .22), 0, .8);
      mix(o, click(3500, .0015), 0, .3);
      return fade(o, .0003, .04);
    }
    function kos(v) {
      const o = B(2.2),
        f = rr(38, 44);
      mix(o, thud(2.1, f * 2, f, .05, .65), 0, 1);
      mix(o, modal(mallet(.012, 1200), memM(f * 1.1, 1.4), 2.1), 0, .35);
      mix(o, pburst(.2, 'lp', 420, .7, .002, .05), 0, .4);
      return fade(sat(o, 1.7), .0005, .3);
    }
    function cym(v) {
      return st2(c => {
        const s = 2.6,
          o = B(s);
        mix(o, env(hp(white(s), 3200), .0008, .75), 0, .5);
        const m = [];
        for (let i = 0; i < 46; i++) m.push([rr(2800, 11000), rr(.25, 1.3), rr(.2, 1)]);
        mix(o, modal(mallet(.0008, 13000), m, s), 0, .5);
        return fade(eq(o, 7000, .7, 3, 'hs'), .0005, .4);
      });
    }
    function zil(v) {
      const o = B(.8),
        m = [];
      for (let i = 0; i < 9; i++) m.push([rr(3600, 9500), rr(.15, .5), rr(.3, 1)]);
      mix(o, modal(mallet(.0006, 13000), m, .8), 0, 1);
      mix(o, modal(mallet(.0006, 13000), m.map(a => [a[0] * rr(.98, 1.02), a[1], a[2]]), .8), rr(.012, .03), .6);
      return fade(o, .0003, .15);
    }
    function ney(f) {
      const s = 1.9,
        n = N(s),
        o = new Float32Array(n);
      let p1 = 0;
      const sr = D.sr();
      for (let i = 0; i < n; i++) {
        const t = i / sr,
          vib = 1 + .006 * Math.sin(6.283 * 5.2 * t) * Math.min(1, Math.max(0, (t - .32) / .4)),
          fr = f * (1 - .014 * Math.exp(-t / .06)) * vib;
        p1 += fr / sr;
        o[i] = Math.sin(6.283 * p1) + .26 * Math.sin(12.566 * p1 + .3) + .09 * Math.sin(18.85 * p1 + .9) + .04 * Math.sin(25.13 * p1);
      }
      const ae = t => (t < .11 ? Math.pow(t / .11, 1.6) : 1) * (t > 1.55 ? Math.max(0, 1 - (t - 1.55) / .3) : 1) * (1 - .12 * t / 1.9);
      envF(o, ae);
      const br = pink(s);
      let b = bp(br, f, 5);
      mix(o, envF(b, ae), 0, .5);
      let air = bp(pink(s), 2600, .8);
      mix(o, envF(air, ae), 0, .12);
      mix(o, pburst(.12, 'bp', f * 2, 3, .004, .045), 0, .35);
      return fade(lp(o, 5200), .002, .05);
    }
    function zur(f) {
      const s = 1.25,
        sr = D.sr();
      const fr = t => f * (1 - .024 * Math.exp(-t / .035)) * (1 + .008 * Math.sin(6.283 * 6.1 * t) * Math.min(1, t / .25));
      const a = osc(s, 'sq', fr, {
          pw: .32
        }),
        b = osc(s, 'saw', fr);
      for (let i = 0; i < a.length; i++) a[i] = a[i] * .6 + b[i] * .5;
      let x = B(s);
      mix(x, bp(a, 1150, 2.6), 0, 1);
      mix(x, bp(a, 2750, 3.5), 0, .65);
      mix(x, lp(a, 3800), 0, .28);
      mix(x, hp(white(s), 3500), 0, .035);
      envF(x, t => (t < .025 ? t / .025 : 1) * (1 - .15 * t / s) * (t > 1.1 ? Math.max(0, 1 - (t - 1.1) / .15) : 1));
      return fade(sat(x, 1.5), .001, .05);
    }
    function choir(f, s = 2.2) {
      const o = B(s);
      for (let k = 0; k < 3; k++) {
        const d = 1 + (k - 1) * .004;
        mix(o, voc(s, t => f * d * (1 + .005 * Math.sin(6.283 * (4.6 + k * .4) * t + k)), 'a', {
          br: .12,
          jit: .008,
          sc: 1.05,
          jr: 6
        }), 0, 1);
      }
      return fade(envF(o, t => Math.min(1, Math.pow(t / .45, 1.5)) * (t > s - .9 ? Math.max(0, (s - t) / .9) : 1)), .005, .05);
    }
    // dron döngüleri
    function droneK(c) {
      const s = 9,
        o = B(s),
        f = 73.42;
      for (const [fq, g] of [[f, 1], [f * 1.4983, .55], [f * 2, .25]]) {
        const vb = wob(s, .7);
        const src = osc(s, 'saw', t => fq * (1 + .0025 * Math.sin(6.283 * 4.8 * t + c * 2)));
        for (let i = 0; i < src.length; i++) src[i] *= 1 + .12 * vb[i];
        mix(o, src, 0, g);
      }
      let x = eq(o, 330, 2, 6);
      x = eq(x, 920, 2.2, 4);
      x = eq(x, 2800, 2, 2);
      x = lp(x, 1800);
      const sw = wob(s, .18);
      for (let i = 0; i < x.length; i++) x[i] *= .75 + .25 * sw[i];
      return loopify(x, 1);
    }
    function droneT(c) {
      const s = 9,
        f = 73.42,
        seq = [8, 9, 10, 9, 8, 12, 10, 9, 8, 6],
        sr = D.sr();
      const hf = t => {
        const u = t / s * seq.length,
          i = Math.floor(u) % seq.length,
          j = (i + 1) % seq.length,
          fr = u - Math.floor(u),
          e = fr < .75 ? 0 : (fr - .75) / .25;
        return f * (seq[i] + (seq[j] - seq[i]) * e * e * (3 - 2 * e));
      };
      const src = voc(s, t => f * (1 + .002 * Math.sin(6.283 * .3 * t)), 'o', {
        br: .04,
        jit: .004,
        jr: 5,
        gl: 4000,
        fa: [1, .6, .3, .1]
      });
      const ov = svf(osc(s, 'saw', f), 'bp', hf, 32);
      const o = B(s);
      mix(o, src, 0, .8);
      mix(o, ov, 0, 2.4);
      return loopify(lp(o, 4000), 1);
    }
    // ---------- ortam döngüleri
    function ambF(c) {
      const s = 11,
        o = B(s),
        gu = wob(s, .1);
      const lv = lp(bp(pink(s), 700, .8), 1600);
      for (let i = 0; i < lv.length; i++) {
        const g = Math.max(0, gu[i]);
        lv[i] *= g * g * 1.4;
      }
      mix(o, lv, 0, .5);
      const lw = lp(brown(s), 180);
      for (let i = 0; i < lw.length; i++) lw[i] *= .5 + .5 * (.5 + .5 * gu[i]);
      mix(o, lw, 0, .6);
      return loopify(o, 1);
    }
    function ambD(c) {
      const s = 11,
        o = B(s),
        gu = wob(s, .08);
      const h1 = svf(brown(s), 'bp', t => 320 + 90 * Math.sin(6.283 * .06 * t + c * 3), 5);
      for (let i = 0; i < h1.length; i++) {
        const g = Math.max(0, .3 + .7 * gu[i]);
        h1[i] *= g;
      }
      mix(o, h1, 0, .8);
      const lw = lp(brown(s), 160);
      mix(o, lw, 0, .5);
      return loopify(lp(o, 1200), 1);
    }
    function ambW(c) {
      const s = 7,
        o = B(s);
      const n0 = bp(pink(s), 1250, .5),
        am = wob(s, 5);
      for (let i = 0; i < n0.length; i++) n0[i] *= .7 + .3 * am[i];
      mix(o, n0, 0, .45);
      scat(o, 260, () => rr(0, s - .3), () => bub(rr(320, 1500), rr(.008, .035), rr(.3, 1)), () => rr(.04, .22));
      mix(o, hp(white(s), 4200), 0, .04);
      return loopify(o, .8);
    }
    function ambFire(c) {
      const s = 6.6,
        o = B(s),
        am = wob(s, .9);
      const rb = lp(brown(s), 380);
      for (let i = 0; i < rb.length; i++) rb[i] *= .6 + .4 * am[i];
      mix(o, rb, 0, .7);
      scat(o, 95, () => rr(0, s - .1), () => env(bp(white(.02), rr(1300, 5200), rr(.8, 2)), .0001, rr(.0008, .004)), () => Math.pow(R(), 2.2) * 1.1);
      scat(o, 10, () => rr(0, s - .2), () => thud(.04, rr(300, 500), 200, .01, .008), () => rr(.1, .3));
      return loopify(o, .6);
    }
    function ambStorm(c) {
      const s = 8.6,
        o = B(s),
        gu = wob(s, .35);
      const a = bp(white(s), 650, .5),
        h = svf(white(s), 'bp', t => 350 + 200 * Math.sin(6.283 * .11 * t + c * 2), 6),
        hs = hp(white(s), 3800);
      for (let i = 0; i < a.length; i++) {
        const g = .45 + .55 * (.5 + .5 * gu[i]);
        a[i] *= g;
        h[i] *= g;
        hs[i] *= g * g;
      }
      mix(o, a, 0, .7);
      mix(o, h, 0, .6);
      mix(o, hs, 0, .25);
      return loopify(o, .6);
    }
    function ambSlide() {
      const s = 2.4,
        o = B(s);
      mix(o, bp(pink(s), 1050, .7), 0, .6);
      scat(o, 150, () => rr(0, s - .05), () => click(rr(2500, 5000), rr(.0007, .0015)), () => rr(.05, .3));
      mix(o, lp(brown(s), 200), 0, .4);
      return loopify(o, .4);
    }
    function ambHorde() {
      const s = 6.6,
        o = B(s);
      scat(o, 140, () => rr(0, s - .1), () => env(bp(pink(.08), rr(500, 1500), rr(.7, 1.4)), .002, rr(.012, .035)), () => rr(.08, .4));
      for (let k = 0; k < 7; k++) {
        const d = rr(.5, .9),
          f = rr(105, 165);
        mix(o, env(voc(d, t => f * (1 - .2 * t / d), D.pk(['u', 'o', 'a']), {
          br: .75,
          rough: .5,
          rr: rr(22, 32),
          jit: .07,
          sc: rr(.8, .95)
        }), .12, d * .35), rr(0, s - 1), rr(.12, .3));
      }
      return loopify(lp(o, 1100), .6);
    }
    function orbL() {
      const s = 2.2,
        o = B(s);
      for (let k = 0; k < 8; k++) {
        const c = k * .25 + .12;
        mix(o, envF(svf(white(.3), 'bp', t => 700 + 1900 * bell(.15, .045)(t), 2.2), bell(.15, .045)), c - .15, .8);
        mix(o, env(D.osc(.15, 'sin', rr(2900, 3300)), .004, .05), c, .02);
      }
      return loopify(o, .2);
    }
    function ambTor(c) {
      const s = 6.5,
        o = B(s);
      const sw = svf(white(s), 'bp', t => 520 + 380 * Math.sin(6.283 * 2.1 * t), 2.4);
      mix(o, sw, 0, .8);
      mix(o, lp(brown(s), 160), 0, .7);
      return loopify(o, .5);
    }
    // ---------- ortam tek seslik: kuşlar, kartal, baykuş, karga, ağaçkakan
    function chirp(o, t0, f0, f1, d, g, fm = 0, fr = 0) {
      const n = N(d),
        x = new Float32Array(n),
        sr = D.sr();
      let p = 0;
      for (let i = 0; i < n; i++) {
        const t = i / sr,
          u = t / d,
          f = f0 + (f1 - f0) * u + fm * Math.sin(6.283 * fr * t);
        p += f / sr;
        x[i] = (Math.sin(6.283 * p) + .12 * Math.sin(12.566 * p)) * Math.sin(Math.PI * u);
      }
      mix(o, x, t0, g);
    }
    function birdA(v) {
      const o = B(1.6);
      let t = 0;
      const k = ri(5, 9),
        b = rr(2800, 4200);
      for (let i = 0; i < k; i++) {
        const ty = ri(0, 2),
          d = rr(.04, .09);
        if (ty == 0) chirp(o, t, b * 1.35, b * .85, d, 1);else if (ty == 1) chirp(o, t, b * .8, b * 1.25, d, .8);else chirp(o, t, b, b * .95, d * 1.4, .7, b * .08, rr(28, 40));
        t += d + rr(.02, .06);
      }
      return fade(o, .001, .05);
    }
    function birdB(v) {
      const o = B(1.4),
        f = rr(640, 720);
      for (const [t, k] of [[0, 1], [.36, .8]]) {
        const s = .26,
          x = env(D.osc(s, 'sin', t2 => f * k * (1 - .03 * t2)), .03, .09);
        mix(o, lp(x, 2000), t, 1);
        mix(o, env(bp(pink(s), f * k, 4), .03, .08), t, .25);
      }
      return o;
    }
    function crow(v) {
      const o = B(1.1);
      for (let k = 0, K = ri(2, 3); k < K; k++) {
        const s = .32;
        mix(o, voc(s, t => rr(480, 540) * (1 - .15 * t), 'a', {
          sc: 1.5,
          br: .35,
          rough: .55,
          rr: 55,
          jit: .05,
          jr: 40
        }), k * .42, 1);
      }
      envF(o, t => {
        const u = t % .42 / .32;
        return u < 1 ? Math.min(1, u * 12) * Math.max(0, 1 - u * .6) : 0;
      });
      return fade(o, .001, .05);
    }
    function pecker(v) {
      const o = B(1.2),
        f = rr(900, 1200);
      let t = 0,
        dt = rr(.05, .06);
      for (let i = 0, K = ri(12, 18); i < K; i++) {
        mix(o, wood(f, .4, 5000), t, 1 - i / K * .5);
        t += dt;
        dt *= rr(.97, 1.01);
      }
      return lp(o, 3500);
    }
    function owl(v) {
      const o = B(1.6),
        f = rr(360, 400);
      for (const [t, d, k] of [[0, .28, 1], [.42, .16, .96], [.66, .55, .98]]) {
        const x = env(D.osc(d + .1, 'sin', t2 => f * k * (1 - .04 * t2)), .05, d * .5);
        mix(o, x, t, 1);
        mix(o, env(bp(pink(d + .1), f * k, 3), .05, d * .4), t, .3);
      }
      return lp(o, 1600);
    }
    function hawk(v) {
      const s = 1,
        o = B(s);
      const f = t => 2900 - 700 * t + 80 * Math.sin(6.283 * 42 * t);
      const x = env(D.osc(s, 'sin', f), .05, .28);
      mix(o, x, 0, 1);
      mix(o, env(D.osc(s, 'sin', t => 2 * f(t)), .05, .25), 0, .25);
      mix(o, env(hp(white(s), 3000), .05, .2), 0, .06);
      return fade(o, .002, .15);
    }
    function trickle(v) {
      const o = B(1.6);
      scat(o, 90, () => Math.pow(R(), .7) * 1.4, () => click(rr(3000, 7000), .0007), () => rr(.05, .25));
      return lp(o, 6000);
    }

    // ---------- oyun efektleri
    const steps = {
      G: () => {
        const o = B(.24);
        const one = (t0, g) => {
          mix(o, thud(.08, rr(90, 110), 55, .02, .022), t0, .35 * g);
          mix(o, burst(.04, 'bp', rr(1800, 2600), 1.2, .002, rr(.008, .014)), t0 + rr(0, .01), .25 * g);
          mix(o, pburst(.08, 'lp', 900, .7, .002, .028), t0, .55 * g);
        };
        one(0, 1);
        one(rr(.04, .065), .55);
        return o;
      },
      S: () => {
        const o = B(.26);
        const one = (t0, g) => {
          mix(o, pburst(.14, 'lp', rr(900, 1300), .7, .008, .035), t0, .8 * g);
          mix(o, thud(.06, 80, 55, .02, .02), t0, .22 * g);
        };
        one(0, 1);
        one(rr(.05, .075), .6);
        return o;
      },
      R: () => {
        const o = B(.24);
        const one = (t0, g) => {
          mix(o, click(2000, .0015), t0, .6 * g);
          mix(o, stone(rr(650, 1100), .8), t0, .5 * g);
          mix(o, thud(.07, 120, 70, .015, .025), t0, .4 * g);
          mix(o, burst(.04, 'bp', 3200, 1, .002, .012), t0 + rr(.01, .03), .25 * g);
        };
        one(0, 1);
        one(rr(.035, .06), .6);
        return o;
      },
      W: () => {
        const o = B(.3),
          f = rr(150, 210);
        const one = (t0, g) => {
          mix(o, wood(f * rr(.95, 1.05)), t0, .75 * g);
          mix(o, click(2500, .001), t0, .35 * g);
          mix(o, thud(.06, 110, 70, .015, .02), t0, .3 * g);
        };
        one(0, 1);
        one(rr(.04, .06), .55);
        return o;
      },
      A: () => {
        const o = B(.4);
        mix(o, burst(.12, 'bp', rr(1100, 2200), .8, .002, .04), 0, .7);
        scat(o, ri(3, 5), () => rr(.01, .15), () => bub(rr(600, 1500), rr(.008, .02)), () => rr(.15, .35));
        mix(o, pburst(.3, 'lp', 2600, .7, .01, .07), 0, .35);
        return o;
      }
    };
    const hits = {
      0: () => {
        const o = B(.17);
        mix(o, thud(.16, rr(140, 175), rr(52, 66), .015, .042), 0, 1);
        mix(o, pburst(.05, 'lp', 700, .7, .001, .018), 0, .25);
        mix(o, click(1800, .002), 0, .12);
        return sat(o, 1.4);
      },
      1: () => {
        const o = B(.12);
        mix(o, burst(.04, 'bp', rr(1200, 1800), 1, .001, .01), 0, .45);
        mix(o, thud(.07, rr(200, 240), 120, .01, .025), 0, .7);
        return o;
      },
      2: () => {
        const o = B(.2);
        mix(o, click(1500, .002), 0, .35);
        mix(o, stone(rr(700, 1100)), 0, .75);
        mix(o, thud(.1, rr(120, 140), 80, .02, .04), 0, .7);
        return o;
      },
      4: () => {
        const o = B(.14);
        mix(o, bone(rr(1400, 2100)), 0, .8);
        mix(o, bone(rr(1500, 2300)), rr(.012, .028), .45);
        mix(o, click(3000, .001), 0, .15);
        mix(o, thud(.06, 180, 120, .01, .022), 0, .45);
        return o;
      },
      5: () => {
        const o = B(.17);
        mix(o, thud(.16, rr(120, 150), rr(48, 58), .018, .05), 0, 1);
        mix(o, pburst(.06, 'lp', 550, .7, .002, .022), 0, .3);
        return sat(o, 1.4);
      }
    };
    const kills = {
      0: () => {
        const o = B(.75);
        mix(o, thud(.3, 125, 48, .03, .09), 0, .85);
        mix(o, voc(.5, t => rr(190, 220) * (1 - .45 * t), vlerp('a', 'u'), {
          br: .18,
          rough: .45,
          rr: 34,
          jit: .05,
          sc: .92
        }), .02, .45);
        envF(o, t => t < .02 ? 1 : Math.exp(-(t - .02) / .18));
        mix(o, burst(.08, 'bp', 700, 2, .002, .04), 0, .3);
        return sat(o, 1.4);
      },
      1: () => {
        const o = B(.3);
        mix(o, amul(svf(white(.15), 'bp', t => 4200 - 1700 * t / .15, 10), wob(.15, 70).map(v => .6 + .4 * v)), 0, 1);
        envF(o, t => Math.exp(-t / .06));
        const b = svf(white(.12), 'bp', t => 3800 - 1500 * t / .12, 10);
        mix(o, env(b, .002, .04), .06, .5);
        mix(o, burst(.04, 'bp', 1200, .8, .001, .012), 0, .35);
        mix(o, burst(.04, 'bp', 1200, .8, .001, .012), .06, .25);
        return o;
      },
      2: () => {
        const o = B(1.3);
        mix(o, thud(.9, 90, 34, .04, .25), 0, 1);
        grains(o, 34, .02, 1, () => stone(rr(450, 2600), rr(.4, .9)), .5, 1.8);
        mix(o, env(lp(brown(1.2), 220), .02, .35), 0, .7);
        mix(o, env(hp(pink(1), 3000), .01, .3), 0, .12);
        return sat(o, 1.3);
      },
      4: () => {
        const o = B(.9);
        let t = 0;
        for (let p = 0; p < 3; p++) {
          let tt = rr(0, .04),
            dt = rr(.06, .1),
            g = 1;
          for (let i = 0; i < 5; i++) {
            mix(o, bone(rr(1200, 2400)), tt, g * rr(.5, .9));
            tt += dt;
            dt *= .72;
            g *= .75;
          }
        }
        mix(o, thud(.12, 170, 90, .015, .04), 0, .4);
        return o;
      },
      5: () => {
        const o = B(1);
        mix(o, voc(.7, t => rr(90, 100) * (1 - .35 * t), vlerp('o', 'u'), {
          br: .3,
          rough: .6,
          rr: 27,
          jit: .05,
          sc: .74,
          sub: 1
        }), 0, .6);
        envF(o, t => t < .03 ? t / .03 : Math.exp(-(t - .03) / .25));
        mix(o, thud(.5, 100, 38, .04, .15), .14, 1);
        mix(o, pburst(.15, 'bp', 900, .7, .003, .06), .12, .3);
        return sat(o, 1.6);
      },
      3: () => {
        const o = B(2.8);
        for (const [f, g] of [[68, 1], [86, .7], [136, .4]]) mix(o, voc(1.7, t => f * (1 - .32 * t / 1.7) * (1 + .05 * Math.sin(6.283 * 3 * t)), vlerp('a', 'u'), {
          br: .25,
          rough: .65,
          rr: 22,
          jit: .05,
          sc: .7,
          sub: 1
        }), 0, g);
        envF(o, t => t < .08 ? t / .08 : Math.exp(-(t - .08) / .7));
        mix(o, thud(1.4, 60, 22, .06, .45), 1, 1.2);
        grains(o, 30, 1.02, 2.4, () => stone(rr(400, 2200), rr(.5, 1)), .4, 1.6);
        mix(o, env(lp(brown(1.6), 160), .05, .5), 1, .8);
        return sat(o, 1.8);
      }
    };
    const growls = {
      0: () => {
        const s = .8,
          o = B(s);
        mix(o, voc(s, t => rr(150, 170) * (1 + .08 * Math.sin(6.283 * 1.3 * t)), vlerp('u', 'a'), {
          br: .25,
          rough: .35,
          rr: 26,
          jit: .06,
          sc: .95
        }), 0, 1);
        return fade(env(o, .12, .3), .002, .1);
      },
      1: () => {
        const o = B(.35);
        for (let k = 0, K = ri(2, 3); k < K; k++) {
          const s = .035;
          mix(o, env(svf(white(s), 'bp', t => 4800 - 1200 * t / s, 12), .002, .012), k * rr(.05, .07), 1);
        }
        return o;
      },
      2: () => {
        const s = 1.1,
          o = B(s);
        mix(o, env(lp(brown(s), 300), .15, .4), 0, .8);
        grains(o, 24, 0, .9, () => stone(rr(300, 900), .6), .25, 1);
        mix(o, voc(s, t => 55 * (1 + .03 * Math.sin(6.283 * 2 * t)), 'o', {
          br: .2,
          rough: .5,
          rr: 18,
          sc: .65,
          sub: 1
        }), 0, .35);
        return fade(env(o, .15, .45), .002, .15);
      },
      4: () => {
        const o = B(.45);
        let t = 0;
        for (let i = 0, K = ri(6, 8); i < K; i++) {
          mix(o, bone(rr(1600, 2300)), t, rr(.5, 1));
          t += rr(.028, .045);
        }
        return o;
      },
      5: () => {
        const s = .9,
          o = B(s);
        mix(o, voc(s, t => 88 * (1 + .18 * Math.sin(Math.PI * t / s)), 'a', {
          br: .35,
          rough: .7,
          rr: 30,
          jit: .06,
          sc: .8,
          sub: 1
        }), 0, 1);
        return fade(sat(env(o, .05, .35), 2.2), .002, .1);
      },
      9: () => {
        const s = 2.1,
          o = B(s);
        for (const [f, g] of [[64, 1], [81, .7], [129, .45], [33, .4]]) mix(o, voc(s, t => f * (1 + .12 * Math.sin(Math.PI * Math.min(1, t / 1.4))) * (1 - .08 * t), vlerp('o', 'a'), {
          br: .3,
          rough: .7,
          rr: 21,
          jit: .05,
          sc: .68,
          sub: 1
        }), 0, g);
        envF(o, t => t < .25 ? Math.pow(t / .25, 1.5) : Math.exp(-(t - .25) / .75));
        mix(o, env(lp(brown(s), 200), .2, .6), 0, .4);
        return fade(sat(o, 2.4), .003, .2);
      }
    };

    // stingler: müzikal anlar (çalgı örneklerinden)
    function strum(o, t0, fs, gap, g, v = 0) {
      fs.forEach((f, i) => mix(o, bag(f, v), t0 + i * gap, g * (1 - i * .08)));
    }
    const REC = {
      // hareket
      stepG: {
        n: 6,
        f: steps.G
      },
      stepS: {
        n: 6,
        f: steps.S
      },
      stepR: {
        n: 5,
        f: steps.R
      },
      stepW: {
        n: 4,
        f: steps.W
      },
      stepA: {
        n: 4,
        f: steps.A
      },
      jump: {
        n: 3,
        f: () => {
          const o = B(.3);
          mix(o, thud(.1, 95, 62, .012, .035), 0, .5);
          mix(o, amul(env(lp(bp(pink(.22), 1100, 1.4), 2500), .01, .06), rustle(.22, 30)), 0, .35);
          mix(o, whoosh(.25, t => 420 + 500 * t / .25, 2.5, t => Math.min(1, t / .03) * Math.exp(-t / .07)), 0, .3);
          return o;
        }
      },
      ajump: {
        n: 3,
        f: () => {
          const o = B(.45);
          for (const t0 of [0, .075]) mix(o, envF(svf(pink(.2), 'bp', t => 520 + 900 * t / .2, 1.4), t => Math.min(1, t / .02) * Math.exp(-t / .05)), t0, t0 ? .6 : 1);
          mix(o, thud(.12, 100, 60, .02, .04), 0, .3);
          return o;
        }
      },
      land: {
        n: 3,
        f: () => {
          const o = B(.4);
          mix(o, thud(.25, 95, 44, .018, .065), 0, 1);
          mix(o, pburst(.1, 'lp', 900, .7, .001, .05), 0, .6);
          mix(o, modal(mallet(.001, 7000), [[rr(700, 900), .05, 1], [1450, .04, .6], [2300, .03, .4]], .12), .01, .08);
          return sat(o, 1.4);
        }
      },
      dash: {
        n: 3,
        f: () => {
          const s = .5,
            o = B(s);
          mix(o, lp(whoosh(s, t => t < .09 ? 280 + 1100 * t / .09 : 1380 - 900 * Math.min(1, (t - .09) / .3), 2.6, t => Math.min(1, t / .02) * (t < .07 ? 1 : Math.exp(-(t - .07) / .11))), 2600), 0, .8);
          mix(o, thud(.2, 130, 70, .02, .07), 0, .6);
          mix(o, env(osc(.2, 'sin', t => 220 + 260 * Math.exp(-t / .05)), .004, .05), 0, .08);
          return o;
        }
      },
      slide: {
        n: 1,
        f: ambSlide
      },
      splash: {
        n: 3,
        f: () => {
          const o = B(.9);
          mix(o, burst(.1, 'bp', 1400, .7, .0005, .03), 0, .7);
          const sh = lp(white(.6), 3500),
            am = wob(.6, 40);
          for (let i = 0; i < sh.length; i++) sh[i] *= .5 + .5 * Math.abs(am[i]);
          mix(o, env(sh, .01, .18), 0, .55);
          scat(o, 10, () => .03 + Math.pow(R(), 1.5) * .5, () => bub(rr(500, 1600), rr(.015, .05)), () => rr(.1, .35));
          scat(o, 4, () => rr(.3, .8), () => bub(rr(1500, 2600), rr(.008, .02)), () => rr(.05, .12));
          return o;
        }
      },
      // dövüş
      hit0: {
        n: 5,
        f: hits[0]
      },
      hit1: {
        n: 3,
        f: hits[1]
      },
      hit2: {
        n: 4,
        f: hits[2]
      },
      hit4: {
        n: 4,
        f: hits[4]
      },
      hit5: {
        n: 4,
        f: hits[5]
      },
      crit: {
        n: 4,
        f: () => {
          const o = B(.5);
          mix(o, thud(.3, rr(165, 185), 46, .02, .08), 0, 1);
          mix(o, pburst(.08, 'lp', 1100, .7, .001, .03), 0, .5);
          mix(o, metal(rr(2200, 2800), .5), .004, .16);
          mix(o, env(hp(white(.05), 5000), .002, .015), 0, .12);
          return sat(o, 1.5);
        }
      },
      bonk: {
        n: 4,
        f: () => {
          const o = B(.55);
          mix(o, thud(.35, rr(170, 200), rr(48, 56), .028, .09), 0, 1);
          mix(o, modal(mallet(.004, 4000), [[rr(300, 360), .08, 1], [rr(460, 520), .05, .55], [rr(680, 760), .03, .3]], .25), 0, .45);
          mix(o, click(2500, .003), 0, .25);
          mix(o, whoosh(.3, t => 1100 - 700 * t / .3, 1.4, t => Math.min(1, t / .03) * Math.exp(-t / .1)), .03, .1);
          return sat(o, 1.5);
        }
      },
      kill0: {
        n: 3,
        f: kills[0]
      },
      kill1: {
        n: 3,
        f: kills[1]
      },
      kill2: {
        n: 2,
        f: kills[2]
      },
      kill4: {
        n: 3,
        f: kills[4]
      },
      kill5: {
        n: 2,
        f: kills[5]
      },
      kill3: {
        n: 1,
        f: kills[3]
      },
      growl0: {
        n: 3,
        f: growls[0]
      },
      growl1: {
        n: 3,
        f: growls[1]
      },
      growl2: {
        n: 2,
        f: growls[2]
      },
      growl4: {
        n: 3,
        f: growls[4]
      },
      growl5: {
        n: 3,
        f: growls[5]
      },
      growl9: {
        n: 2,
        f: growls[9]
      },
      // oyuncuya darbe: kısa, yuvarlak bir "tok". Eskisi metalik çınlama + doygunluktu ve sık darbede baş ağrıtıyordu.
      hurt: {
        n: 3,
        f: () => {
          const o = B(.35);
          mix(o, thud(.22, 190, 62, .018, .055), 0, 1);
          mix(o, wood(rr(300, 360), .7, 2200), .002, .5);
          mix(o, pburst(.05, 'lp', 900, .7, .001, .025), 0, .3);
          return lp(o, 3200);
        }
      },
      heart: {
        n: 1,
        f: () => {
          const o = B(.6);
          mix(o, thud(.15, 66, 48, .01, .05), 0, 1);
          mix(o, env(lp(pink(.1), 150), .002, .04), 0, .4);
          mix(o, thud(.12, 72, 52, .01, .04), .26, .65);
          return lp(o, 220);
        }
      },
      slam: {
        n: 2,
        f: () => {
          const o = B(2.4);
          mix(o, thud(1.6, 62, 22, .1, .45), 0, 1);
          mix(o, click(600, .012), 0, .8);
          mix(o, env(svf(brown(.8), 'lp', t => 1200 * Math.exp(-t / .15) + 120, .8), .001, .35), 0, .9);
          grains(o, 30, .05, 1.7, () => stone(rr(380, 2400), rr(.5, 1)), .35, 1.6);
          mix(o, env(lp(brown(1.8), 140), .1, .7), 0, .6);
          return fade(sat(o, 2.2), .0005, .3);
        }
      },
      // silahlar
      shoot: {
        n: 4,
        f: () => {
          const o = B(.36);
          let tw = pluck(rr(98, 118), .3, {
            br: .4,
            t60: .3,
            pick: .3
          });
          tw = lp(hp1(tw, 70), 3200);
          mix(o, tw, 0, .75);
          mix(o, thud(.06, 150, 95, .01, .03), 0, .35);
          mix(o, lp(whoosh(.14, t => 2000 - 1100 * t / .14, 3, t => Math.min(1, t / .006) * Math.exp(-t / .045)), 3500), .004, .22);
          mix(o, modal(mallet(.001, 6000), [[rr(1500, 1700), .1, 1], [2400, .07, .4]], .25), .01, .05);
          return o;
        }
      },
      ice: {
        n: 4,
        f: () => {
          const o = B(.5);
          mix(o, modal(hp(mallet(.002, 9000), 2000), [1, 1.414, 2.31, 3.17, 4.12].map((k, i) => [rr(2000, 2600) * k, [.14, .1, .07, .05, .04][i], [1, .6, .5, .3, .2][i]]), .4), 0, .16);
          mix(o, whoosh(.2, t => 6000 - 3500 * t / .2, 1.2, t => Math.min(1, t / .005) * Math.exp(-t / .08), white(.2)), 0, .4);
          scat(o, 8, () => rr(0, .1), () => click(5000, .001), () => rr(.1, .3));
          mix(o, env(hp(pink(.3), 4000), .02, .15), 0, .15);
          return o;
        }
      },
      fire: {
        n: 4,
        f: () => {
          const o = B(.7);
          mix(o, envF(svf(pink(.6), 'lp', t => t < .08 ? 400 + 2000 * t / .08 : 2400 - 1500 * Math.min(1, (t - .08) / .4), .9), t => Math.min(1, t / .03) * (t < .08 ? 1 : Math.exp(-(t - .08) / .2))), 0, 1);
          mix(o, env(lp(brown(.5), 500), .02, .25), 0, .6);
          scat(o, 15, () => rr(.03, .45), () => env(bp(white(.01), rr(1500, 4000), 1.5), .0001, .002), () => rr(.1, .4));
          mix(o, thud(.15, 90, 60, .02, .08), 0, .3);
          return sat(o, 1.3);
        }
      },
      boom: {
        n: 4,
        f: () => {
          const o = B(1.7);
          mix(o, thud(1.1, rr(70, 85), rr(28, 34), .08, .35), 0, 1);
          mix(o, click(800, .006), 0, .7);
          mix(o, env(svf(pink(.9), 'lp', t => 3500 * Math.exp(-t / .18) + 250, .8), .002, .25), 0, .9);
          grains(o, 18, .1, 1.3, () => {
            const g = B(.1);
            mix(g, stone(rr(800, 3000), .5), 0, 1);
            mix(g, click(4000, .001), 0, .5);
            return g;
          }, .25, 1.5);
          mix(o, env(lp(brown(1.2), 160), .05, .6), 0, .5);
          return fade(sat(o, 2.5), .0005, .25);
        }
      },
      nova: {
        n: 3,
        f: () => {
          const o = B(.9);
          mix(o, thud(.7, 110, 40, .06, .24), 0, 1);
          mix(o, env(osc(.7, 'sin', t => 70 + 90 * Math.min(1, t / .35)), .02, .22), 0, .35);
          mix(o, lp(whoosh(.6, t => 200 + 700 * Math.min(1, t / .4), 3, t => Math.min(1, t / .02) * Math.exp(-t / .18)), 1800), 0, .3);
          return sat(o, 1.4);
        }
      },
      zap: {
        n: 4,
        f: () => {
          const o = B(1.1);
          let t = 0;
          for (let k = 0, K = ri(2, 3); k < K; k++) {
            mix(o, env(lp(hp(white(.004), 700), 6000), .0001, rr(.0008, .002)), t, 1 - k * .2);
            t += rr(.005, .012);
          }
          mix(o, env(bp(osc(.12, 'sq', rr(85, 110)), 900, 2), .001, .03), 0, .35);
          mix(o, thud(.2, 160, 70, .01, .06), 0, .5);
          const th = lp(brown(.9), 200),
            ro = wob(.9, 4);
          for (let i = 0; i < th.length; i++) th[i] *= .5 + .5 * Math.abs(ro[i]);
          mix(o, env(th, .06, .3), rr(.05, .12), .4);
          return fade(o, .0002, .15);
        }
      },
      throw: {
        n: 4,
        f: () => {
          const s = .55,
            o = B(s);
          const x = svf(pink(s), 'bp', 900, 2);
          const sp = rr(14, 18);
          let p = 0;
          const sr = D.sr();
          for (let i = 0; i < x.length; i++) {
            const t = i / sr;
            p += (sp - 6 * t) / sr;
            const a = Math.sin(Math.PI * p);
            x[i] *= a * a * Math.min(1, t / .03) * Math.exp(-t / .25);
          }
          mix(o, x, 0, 1);
          return o;
        }
      },
      shing: {
        n: 4,
        f: () => {
          const o = B(.3);
          mix(o, metal(rr(3000, 3800), .25), 0, .18);
          mix(o, whoosh(.08, t => 4000 - 2000 * t / .08, 1, t => Math.exp(-t / .025), white(.08)), 0, .6);
          mix(o, thud(.04, 160, 90, .008, .015), 0, .3);
          return o;
        }
      },
      coin: {
        n: 4,
        f: () => {
          const o = B(.35);
          mix(o, coin(rr(2700, 3300)), 0, 1);
          mix(o, coin(rr(2800, 3400)), rr(.04, .07), .4);
          return lp(o, 6000);
        }
      },
      swish: {
        n: 4,
        f: () => {
          const s = .32,
            o = B(s),
            c = rr(.08, .1);
          mix(o, lp(envF(svf(pink(s), 'bp', t => 380 + 1500 * bell(c, .05)(t), 4), bell(c, .045)), 3000), 0, 1);
          mix(o, thud(.08, 140, 90, .01, .025), c, .15);
          return o;
        }
      },
      vortex: {
        n: 2,
        f: () => st2(c => {
          const s = 1.6,
            o = B(s);
          const rot = t => 2 + 3 * t / s;
          let ph = c * Math.PI;
          const sw = svf(pink(s), 'bp', t => {
            ph += 6.283 * rot(t) / D.sr() * 8;
            return 400 + 900 * (.5 + .5 * Math.sin(ph));
          }, 3);
          mix(o, sw, 0, 1);
          mix(o, lp(brown(s), 180), 0, .6);
          envF(o, t => Math.min(1, t / .2) * (t > 1 ? Math.exp(-(t - 1) / .25) : 1) * (.6 + .4 * Math.sin(6.283 * rot(t) * t + c * Math.PI)));
          return o;
        })
      },
      tornado: {
        n: 2,
        f: () => st2(c => {
          const s = 2.2,
            o = B(s);
          mix(o, svf(white(s), 'bp', t => 300 + 220 * t / s, 9), 0, .8);
          mix(o, svf(white(s), 'bp', t => 640 + 140 * t / s, 7), 0, .5);
          mix(o, svf(pink(s), 'bp', t => 900 + 700 * Math.sin(Math.PI * t / s), .8), 0, .7);
          return envF(o, t => Math.min(1, t / .4) * (t > 1.4 ? Math.exp(-(t - 1.4) / .3) : 1));
        })
      },
      // toplama, ödül
      // tecrübe: kısa, yumuşak bir marimba tıkı (eskisi uzun çınlayan cam sesiydi, yüzlerce toplamada yoruyordu)
      xp: {
        n: 3,
        f: () => {
          const o = B(.22),
            f = 784 * rr(.996, 1.004);
          mix(o, modal(lp(mallet(.002, 5000), 6000), woodM(f, .9), .18), 0, 1);
          mix(o, env(osc(.12, 'sin', f * 2), .002, .045), 0, .22);
          return fade(lp(o, 5000), .001, .03);
        }
      },
      // altın: iki kısa, sıcak şıngırtı (eskisi 3 kHz üstünde uzun çınlıyordu)
      gold: {
        n: 4,
        f: () => {
          const o = B(.3),
            cl = f => modal(mallet(.0008, 7000), [[f, .09, 1], [f * 2.01, .05, .45], [f * 3.03, .03, .2]], .22);
          mix(o, cl(rr(1500, 1620)), 0, 1);
          mix(o, cl(rr(2000, 2150)), rr(.04, .055), .7);
          return fade(lp(o, 5500), .001, .04);
        }
      },
      // ocak dolumu: yumuşak kalimba notası; dolum ilerledikçe pentatonik dizide yükselerek çalınır
      chg: {
        n: 2,
        f: () => {
          const o = B(.8),
            f = 392 * rr(.998, 1.002);
          mix(o, modal(lp(mallet(.002, 3500), 4500), [[f, .45, 1], [f * 2, .22, .28], [f * 3.01, .1, .1], [f * 5.4, .04, .05]], .75), 0, 1);
          mix(o, env(osc(.5, 'sin', f), .004, .22), 0, .25);
          return fade(lp(o, 5000), .002, .12);
        }
      },
      loot: {
        n: 2,
        f: () => {
          const o = B(.8);
          scat(o, ri(8, 12), () => Math.pow(R(), 1.3) * .5, () => coin(rr(2400, 3800)), () => rr(.25, .7));
          mix(o, thud(.08, 140, 90, .01, .03), 0, .4);
          mix(o, pburst(.06, 'lp', 800, .7, .001, .03), 0, .3);
          return lp(o, 6000);
        }
      },
      buy: {
        n: 2,
        f: () => {
          const o = B(.6);
          mix(o, thud(.08, 125, 85, .01, .035), 0, .5);
          mix(o, pburst(.06, 'lp', 900, .7, .001, .03), 0, .4);
          scat(o, 4, () => rr(.01, .2), () => coin(rr(2500, 3500)), () => rr(.3, .6));
          return lp(o, 6000);
        }
      },
      pot: {
        n: 4,
        f: () => {
          const o = B(.6);
          mix(o, modal(mallet(.001, 8000), [1, 1.62, 2.47, 3.3, 4.4].map((k, i) => [rr(800, 1100) * k, [.06, .04, .03, .02, .015][i], [1, .7, .5, .35, .2][i]]), .15), 0, .8);
          mix(o, lp(burst(.08, 'bp', 2000, .7, .0005, .025), 5000), 0, .35);
          grains(o, 7, .03, .4, () => modal(mallet(.0005, 9000), [[rr(1800, 3500), rr(.01, .025), 1]], .05), .25, 2);
          mix(o, thud(.07, 130, 80, .01, .03), 0, .45);
          return o;
        }
      },
      chest: {
        n: 5,
        f: v => st2(c => {
          const s = 1.6 + v * .4,
            o = B(s);
          D.seed(9001 + v * 7);
          const sr = D.sr();
          // gıcırtı (yapış-kay), mandal, kapak
          let t = 0;
          while (t < .36) {
            const rate = 26 + 50 * t / .36 + rr(-6, 6);
            mix(o, modal(mallet(.0004, 6000), woodM(rr(320, 420), .35), .06), t, .25 * Math.sin(Math.PI * t / .36) + .05);
            t += 1 / rate;
          }
          mix(o, modal(mallet(.001, 9000), [[rr(880, 950), .03, 1], [2300, .025, .6]], .08), .02, .4);
          mix(o, click(2500, .002), .02, .3);
          mix(o, thud(.15, 115, 72, .015, .07), .42, .75);
          mix(o, wood(rr(160, 190), 1.2), .42, .5);
          // nadirliğe göre parıltı
          const t0 = .46,
            F = [hz(0, 146.83), hz(4, 146.83), hz(7, 146.83), hz(11, 146.83)];
          if (v == 0) {
            mix(o, bag(hz(7), 0), t0, .35);
            mix(o, bag(hz(11), 0), t0 + .12, .3);
          } else strum(o, t0, v >= 2 ? [F[0], F[1], F[2], F[3]] : [F[1], F[2], F[3]], .022, .32, c);
          if (v >= 1) mix(o, modal(mallet(.0012, 9000), glassM(hz(14), 1.6), 1.2), t0 + .02, .18);
          if (v >= 2) {
            mix(o, davG(0), t0, .45);
            mix(o, modal(mallet(.0012, 9000), glassM(hz(18), 1.4), 1.2), t0 + .09, .12);
          }
          if (v >= 3) mix(o, choir(hz(0, 146.83), s - t0), t0, .32 * (v - 1.8));
          if (v >= 4) {
            mix(o, kos(0), t0, .5);
            mix(o, cym(0), t0, .25);
            scat(o, 24, () => t0 + .1 + Math.pow(R(), 1.5) * (s - t0 - .3), () => modal(mallet(.0006, 12000), [[rr(3000, 7000), rr(.05, .15), 1]], .3), () => rr(.03, .09));
          }
          return fade(o, .001, .15);
        })
      },
      lvl: {
        n: 1,
        f: () => st2(c => {
          const s = 2.4,
            o = B(s),
            t0 = .42;
          const rs = osc(t0 + .05, 'tri', t => 293.66 * (1 + .5 * t / t0));
          envF(rs, t => Math.pow(Math.min(1, t / t0), 2) * .6);
          mix(o, lp(rs, 2000), 0, .18);
          mix(o, davG(0), t0, .8);
          strum(o, t0, [hz(-7, 146.83), hz(-3, 146.83), hz(0, 146.83), hz(4, 146.83)], .014, .4, c);
          mix(o, modal(mallet(.0012, 9000), glassM(hz(7) * 2, 2.6), 1.6), t0 + .01, .22);
          mix(o, env(lp(osc(1.4, 'saw', 73.42 * (c ? 1.002 : .998)), 700), .06, .5), t0, .12);
          scat(o, 20, () => t0 + .08 + Math.pow(R(), 1.4) * 1.4, () => modal(mallet(.0005, 12000), [[rr(3000, 6500), rr(.04, .12), 1]], .25), () => rr(.02, .06));
          return fade(o, .001, .2);
        })
      },
      quest: {
        n: 1,
        f: () => st2(c => {
          const s = 1.9,
            o = B(s),
            sr = D.sr();
          const horn = (f0, f1, tsw, len, g, t0) => {
            const x = osc(len, 'saw', t => (t < tsw ? f0 : f1) * (1 - .035 * Math.exp(-(t < tsw ? t : t - tsw) / .05)) * (1 + .004 * Math.sin(6.283 * 5 * t) * Math.min(1, t / .3)));
            const ae = t => Math.min(1, t / .06) * (t > len - .25 ? Math.max(0, (len - t) / .25) : 1);
            envF(x, ae);
            const y = svf(x, 'lp', t => 400 + 2600 * ae(t) * (t < tsw ? 1 : .85), .9);
            mix(o, eq(y, 1100, 1.4, 4), t0, g);
          };
          horn(220, 293.66, .42, 1.3, .6, 0);
          horn(110, 146.83, .42, 1.3, .3, .01);
          mix(o, davG(0), .42, .35);
          return fade(o, .002, .2);
        })
      },
      shrine: {
        n: 1,
        f: () => st2(c => {
          const s = 3.2,
            o = B(s),
            f0 = rr(212, 224);
          const m = [];
          [[1, 2.6, 1], [2.76, 1.7, .5], [5.22, 1.1, .25], [8.3, .65, .1]].forEach(([k, d, a]) => {
            m.push([f0 * k, d, a]);
            m.push([f0 * k + rr(.4, .9) * (c ? 1 : -1), d, a * .8]);
          });
          mix(o, modal(lp(white(.012), 1500), m, s), 0, 1);
          mix(o, choir(146.83, s), 0, .12);
          return fade(o, .005, .3);
        })
      },
      portal: {
        n: 1,
        f: () => st2(c => {
          const s = 2.3,
            o = B(s);
          mix(o, env(svf(brown(s), 'lp', t => 200 + 1000 * t / s, .8), .8, .6), 0, .6);
          for (let k = 0; k < 12; k++) {
            const f = hz(ri(7, 16)) * rr(.998, 1.002);
            mix(o, env(osc(s - .2, 'sin', t => f * (1 + .004 * Math.sin(6.283 * rr(4, 6) * t))), .6, .8), rr(0, .4), .03);
          }
          mix(o, envF(svf(pink(s), 'bp', t => 300 + 2200 * Math.min(1, t / 1.1), 1.4), t => t < 1.1 ? Math.pow(t / 1.1, 2) : Math.exp(-(t - 1.1) / .08)), 0, .5);
          mix(o, env(osc(s, 'sin', 45), .5, .6), 0, .4);
          return fade(o, .005, .2);
        })
      },
      boss: {
        n: 1,
        f: () => st2(c => {
          const s = 3.4,
            o = B(s);
          const horn = (f, t0, len, g) => {
            const x = osc(len, 'saw', t => f * (1 - .05 * Math.exp(-t / .08)) * (1 + .006 * Math.sin(6.283 * 5.5 * t)));
            const ae = t => Math.min(1, t / .12) * (t > len - .4 ? Math.max(0, (len - t) / .4) : 1);
            envF(x, ae);
            mix(o, eq(svf(x, 'lp', t => 300 + 1500 * ae(t), .8), 700, 1.2, 4), t0, g);
          };
          horn(73.42, 0, 1.6, .5);
          horn(110, .02, 1.6, .3);
          horn(77.78, 1.5, 1.7, .5);
          horn(116.5, 1.52, 1.7, .3);
          [0, .5, 1.5].forEach(t => mix(o, kos(0), t, .7));
          mix(o, growls[9](), .6, .35);
          return fade(sat(o, 1.4), .002, .3);
        })
      },
      power: {
        n: 2,
        f: () => {
          const o = B(1);
          mix(o, whoosh(.4, t => 300 + 2700 * t / .4, 1.5, t => Math.pow(Math.min(1, t / .25), 2) * (t > .25 ? Math.exp(-(t - .25) / .06) : 1)), 0, .5);
          [hz(7), hz(11), hz(14)].forEach((f, i) => mix(o, modal(mallet(.0012, 9000), glassM(f * 2, 1.6), .9), .25 + i * .02, .2));
          mix(o, thud(.2, 120, 60, .015, .07), .25, .45);
          return o;
        }
      },
      freeze: {
        n: 1,
        f: () => st2(c => {
          const s = 1.8,
            o = B(s),
            t0 = .35;
          const rs = envF(svf(white(t0), 'hp', t => 3000 + 5000 * t / t0, .8), t => Math.pow(t / t0, 2.5));
          mix(o, rs, 0, .35);
          mix(o, click(1500, .008), t0, .6);
          const m = [];
          for (let i = 0; i < 14; i++) m.push([rr(1800, 6000), rr(.3, .9), rr(.3, 1)]);
          mix(o, modal(mallet(.001, 10000), m, 1.4), t0, .35);
          mix(o, env(osc(1.3, 'sin', t => 55 * (1 - .1 * t)), .03, .6), t0, .35);
          mix(o, env(hp(pink(1.3), 4000), .05, .5), t0, .12);
          return fade(o, .002, .2);
        })
      },
      pad: {
        n: 2,
        f: () => {
          const o = B(.9);
          mix(o, thud(.4, 130, 55, .03, .1), 0, .8);
          mix(o, whoosh(.6, t => 280 * Math.pow(11, Math.min(1, t / .45)), 1.6, t => Math.min(1, t / .15) * (t > .15 ? Math.exp(-(t - .15) / .2) : 1)), 0, .7);
          mix(o, env(osc(.5, 'sin', 220), .01, .25), 0, .08);
          mix(o, env(osc(.5, 'sin', 330), .01, .2), 0, .06);
          return o;
        }
      },
      // arayüz
      ui: {
        n: 3,
        f: () => {
          const o = B(.08);
          mix(o, env(bp(white(.03), 2400, 5), .0002, .01), 0, .7);
          mix(o, modal(mallet(.0006, 7000), [[rr(820, 900), .015, 1], [1950, .01, .5]], .06), 0, .5);
          return o;
        }
      },
      deny: {
        n: 1,
        f: () => {
          const o = B(.3);
          for (const t of [0, .09]) mix(o, modal(mallet(.003, 1600), woodM(190, .8), .18), t, t ? .7 : 1);
          return lp(o, 1500);
        }
      },
      card: {
        n: 3,
        f: () => {
          const o = B(.14);
          mix(o, lp(whoosh(.1, t => 1600 - 700 * t / .1, 2, t => Math.min(1, t / .01) * Math.exp(-t / .03)), 3500), 0, .4);
          mix(o, modal(mallet(.0006, 6000), [[rr(900, 1000), .02, 1]], .05), .07, .4);
          return o;
        }
      },
      pick: {
        n: 2,
        f: () => {
          const o = B(.9);
          mix(o, thud(.12, 140, 72, .012, .05), 0, .6);
          mix(o, metal(rr(1750, 1850), 1.2), .005, .25);
          mix(o, bag(hz(7), 0), .01, .3);
          mix(o, bag(hz(4), 0), .03, .25);
          return o;
        }
      },
      // ortam tek seslik
      birdA: {
        n: 4,
        f: birdA
      },
      birdB: {
        n: 2,
        f: birdB
      },
      crow: {
        n: 2,
        f: crow
      },
      pecker: {
        n: 2,
        f: pecker
      },
      owl: {
        n: 1,
        f: owl
      },
      hawk: {
        n: 2,
        f: hawk
      },
      trickle: {
        n: 2,
        f: trickle
      },
      // döngüler
      ambF: {
        n: 1,
        f: () => st2(ambF)
      },
      ambD: {
        n: 1,
        f: () => st2(ambD)
      },
      ambW: {
        n: 1,
        f: () => st2(ambW)
      },
      ambFire: {
        n: 1,
        f: ambFire
      },
      ambStorm: {
        n: 1,
        f: () => st2(ambStorm)
      },
      ambTor: {
        n: 1,
        f: ambTor
      },
      ambHorde: {
        n: 1,
        f: ambHorde
      },
      orbL: {
        n: 1,
        f: orbL
      },
      // müzik
      droneK: {
        n: 1,
        f: () => st2(droneK)
      },
      droneT: {
        n: 1,
        f: () => st2(c => droneT(c))
      },
      davG: {
        n: 3,
        f: davG
      },
      davT: {
        n: 3,
        f: davT
      },
      dkD: {
        n: 3,
        f: dkD
      },
      dkT: {
        n: 4,
        f: dkT
      },
      dkK: {
        n: 3,
        f: dkK
      },
      kos: {
        n: 2,
        f: kos
      },
      cym: {
        n: 1,
        f: cym
      },
      zil: {
        n: 3,
        f: zil
      }
    };
    // çalgı notaları: Hicaz dereceleri
    for (let d = -7; d <= 7; d++) REC['bag' + d] = {
      n: 1,
      f: () => bag(hz(d, 293.66), 0)
    };
    for (let d = -7; d <= 0; d++) REC['bas' + d] = {
      n: 1,
      f: () => bass(hz(d, 146.83))
    };
    for (let d = 0; d <= 7; d++) {
      REC['ney' + d] = {
        n: 1,
        f: () => ney(hz(d, 293.66))
      };
      REC['zur' + d] = {
        n: 1,
        f: () => zur(hz(d, 293.66))
      };
    }
    return {
      REC,
      hz,
      bag,
      ney,
      zur,
      choir
    };
  })();
  // isimden tohum
  function sHash(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  // bir varyasyonu üret: normalize edilmiş [L] ya da [L,R]
  function sRender(name, v) {
    const r = SREC.REC[name];
    DSP.seed(sHash(name) + v * 7919 + 1);
    let x = r.f(v);
    if (!Array.isArray(x)) x = [x];
    let m = 0;
    for (const c of x) m = Math.max(m, DSP.peak(c));
    const g = m > 1e-9 ? .89 / m : 1,
      lo = /^(amb|drone|slide)/.test(name);
    return x.map(c => {
      DSP.mul(c, g);
      if (lo) return c;
      c = DSP.dc(c);
      let e = c.length - 1;
      while (e > 0 && Math.abs(c[e]) < .0012) e--;
      const pad = Math.ceil(DSP.sr() * .01);
      c = c.slice(0, Math.min(c.length, e + pad));
      return DSP.fade(c, .0004, .008);
    });
  }
  return {
    DSP,
    SREC,
    sRender
  };
}

export function __init_41() {
  SND = SNDSRC();
}
