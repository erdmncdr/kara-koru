// geo/anim.js · Kara Koru
// Bu dosya tek dosyalık sürümden (v22) otomatik ayrıldı. Ortak oyun durumu core/store.js içindeki $G nesnesinde.

import { $G } from '../core/store.js';

export let ANIM;

export function __init_4() {
  // ---- iskelet animasyonu: kemiklerin rotation/position alanlarını yazar (three.js'ten bağımsız)
  ANIM = (() => {
    const PI = Math.PI,
      sin = Math.sin,
      cos = Math.cos,
      mx = Math.max,
      mn = Math.min;
    const cl = (v, a, b) => v < a ? a : v > b ? b : v,
      sm = t => {
        t = cl(t, 0, 1);
        return t * t * (3 - 2 * t);
      },
      mix = (a, b, t) => a + (b - a) * t;
    const set3 = (a, x, y, z) => {
        a[0] = x;
        a[1] = y;
        a[2] = z;
      },
      lerp3 = (a, b, t) => {
        a[0] += (b[0] - a[0]) * t;
        a[1] += (b[1] - a[1]) * t;
        a[2] += (b[2] - a[2]) * t;
      };
    // hedef poz nesnesi: örnek başına bir kez ayrılır, her karede sıfırlanır
    function tp(u) {
      let p = u.tp;
      if (!p) {
        p = u.tp = {};
        for (const n of u.names) p[n] = [0, 0, 0];
      }
      for (const n of u.names) {
        const a = p[n];
        a[0] = a[1] = a[2] = 0;
      }
      p.off = 0;
      p.gw = 1;
      return p;
    }
    const rv = (v, a) => {
      const c = cos(a),
        s = sin(a);
      return [v[0] * c - v[1] * s, v[0] * s + v[1] * c];
    };
    function soleY(L, a1, a2, a3) {
      const k = rv(L.k, a1),
        a = rv(L.a, a2),
        h = rv(L.h, a3),
        t = rv(L.t, a3);
      return k[0] + a[0] + mn(h[0], t[0]);
    }
    // yere basma: en alttaki taban zemine değsin
    function gnd(u, c) {
      const L = u.info.leg;
      if (!L) return 0;
      let m = 1e9;
      for (const s of [0, 1]) {
        const a1 = c.hip[0] + c['th' + s][0],
          a2 = a1 + c['sh' + s][0],
          a3 = a2 + c['ft' + s][0];
        m = mn(m, soleY(L, a1, a2, a3) / cos(cl(c['th' + s][2], -.6, .6)));
      }
      return L.s0 - (L.hjy + m);
    }
    function apply(u, p, dt, rate) {
      const k = dt > 0 ? 1 - Math.exp(-dt * rate) : 1,
        B = u.b;
      let c = u.cur;
      if (!c) {
        c = u.cur = {
          off: p.off,
          gw: p.gw
        };
        for (const n of u.names) c[n] = p[n].slice();
      }
      for (const n of u.names) {
        const t = p[n],
          q = c[n];
        q[0] += (t[0] - q[0]) * k;
        q[1] += (t[1] - q[1]) * k;
        q[2] += (t[2] - q[2]) * k;
        B[n].rotation.set(q[0], q[1], q[2]);
      }
      c.off += (p.off - c.off) * k;
      c.gw += (p.gw - c.gw) * k;
      B.hip.position.y = u.info.hy0 + c.off + (c.gw > .001 ? c.gw * gnd(u, c) : 0);
    }
    // koşu/yürüme bacak döngüsü. ph: faz, A: uyluk genliği, K: diz bükümü, R: koşu ağırlığı
    function legs(p, ph, A, K, R, ks = .25) {
      for (const s of [0, 1]) {
        const q = ph + s * PI,
          sq = sin(q),
          cq = cos(q),
          sw = Math.pow(mx(0, cos(q + .25)), 1.6),
          stc = sm(-cq * 2.5);
        const th = -A * sq,
          kn = (.08 + ks * mx(0, -cq)) * R + K * sw,
          T = p['th' + s],
          S = p['sh' + s],
          F = p['ft' + s];
        T[0] += th;
        S[0] += kn;
        F[0] += -(th + kn + p.hip[0]) * stc * .9 + .3 * sw * R;
      }
    }

    // ---------- kahraman
    function hero(u, s, dt) {
      const G = u.info.gait,
        p = tp(u),
        R = sm(s.v / 9),
        id = 1 - R,
        t = s.t,
        br = sin(t * 2.2);
      // boşta: nefes, ağırlık aktarma, etrafa bakma
      p.ch[0] = .035 * br;
      p.hd[0] = .04 - .03 * br;
      p.hd[1] = .35 * sin(t * .41) * sin(t * .23) * id;
      set3(p.ua0, .04, 0, -.12 - .025 * br);
      set3(p.ua1, .04, 0, .12 + .025 * br);
      p.fa0[0] = p.fa1[0] = -.22;
      p.hip[2] = .035 * sin(t * .8) * id;
      p.sp[2] = -.03 * sin(t * .8) * id;
      p.th0[2] = -.045;
      p.th1[2] = .045;
      p.sh0[0] = p.sh1[0] = .05;
      if (G.staff) {
        set3(p.ua1, -.3, 0, .16);
        p.fa1[0] = -1.0;
      }
      if (G.ninja) {
        set3(p.ua0, .15, 0, -.16);
        set3(p.ua1, .15, 0, .16);
        p.fa0[0] = p.fa1[0] = -.5;
      }
      // koşu
      if (R > .002) {
        const ph = s.ph || 0,
          sn = sin(ph),
          ln = (.1 + .16 * R) * G.ln * R;
        p.hip[1] += .2 * G.hy * R * sn;
        p.ch[1] -= .3 * G.hy * R * sn;
        p.hip[2] += .04 * R * cos(ph * 2);
        p.sp[0] += ln * .55;
        p.ch[0] += ln * .45;
        p.hd[0] -= ln * .8;
        p.hd[1] -= (p.hip[1] + p.ch[1]) * .8;
        legs(p, ph, G.st * R, G.kn * R, R);
        if (G.ninja) {
          set3(p.ua0, mix(p.ua0[0], 1.05 + .12 * sn, R), -.3 * R, mix(-.16, -.32, R));
          set3(p.ua1, mix(p.ua1[0], 1.05 - .12 * sn, R), .3 * R, mix(.16, .32, R));
          p.fa0[0] = p.fa1[0] = mix(-.5, -.15, R);
        } else {
          const Aa = G.ar * R;
          p.ua0[0] += Aa * sn;
          p.ua0[2] = mix(p.ua0[2], -.17, R);
          p.fa0[0] = mix(p.fa0[0], -G.el[0] - .4 * mx(0, -sn), R);
          p.ua0[1] = -.15 * R * mx(0, -sn);
          if (G.staff) {
            p.ua1[0] = -.3 - .1 * sn * R;
            p.ua1[2] = .18;
          } else {
            p.ua1[0] -= Aa * sn;
            p.ua1[2] = mix(p.ua1[2], .17, R);
            p.fa1[0] = mix(p.fa1[0], -G.el[1] - .4 * mx(0, sn), R);
            p.ua1[1] = .15 * R * mx(0, sn);
          }
        }
        p.off = -.05 * R;
      }
      // kayma: ayaklar önde, gövde geride
      if (s.sl) {
        set3(p.hip, -.5, 0, 0);
        set3(p.sp, -.12, 0, 0);
        set3(p.ch, .05, 0, 0);
        set3(p.hd, .45, 0, 0);
        set3(p.th0, -.95, 0, -.05);
        set3(p.sh0, .12, 0, 0);
        set3(p.ft0, -.2, 0, 0);
        set3(p.th1, -.4, 0, .12);
        set3(p.sh1, 2.3, 0, 0);
        set3(p.ft1, 1.05, 0, 0);
        set3(p.ua0, .6, 0, -.55);
        p.fa0[0] = -.3;
        if (!G.staff) {
          set3(p.ua1, .6, 0, .55);
          p.fa1[0] = -.3;
        }
        p.gw = 0;
        p.off = -(u.info.hy0 - .38);
      }
      // hava: çıkarken diz yukarı, düşerken kollar açılır
      else if (s.air) {
        const up = cl(s.vy / 9, -1, 1),
          ru = mx(0, up),
          fl = mx(0, -up);
        set3(p.th0, -1.0 * ru - .3 * fl - .15, 0, -.06);
        set3(p.sh0, 1.35 * ru + .45 * fl + .35, 0, 0);
        set3(p.ft0, .35, 0, 0);
        set3(p.th1, .3 * ru + .08 * fl, 0, .06);
        set3(p.sh1, .75 * ru + .3 * fl + .25, 0, 0);
        set3(p.ft1, .45, 0, 0);
        if (G.ninja) {
          set3(p.ua0, .9, -.2, -.5 - .4 * fl);
          set3(p.ua1, .9, .2, .5 + .4 * fl);
        } else {
          set3(p.ua0, -.55 * ru - .1 * fl, 0, -.35 - .8 * fl);
          p.fa0[0] = -.7;
          if (!G.staff) {
            set3(p.ua1, .45 * ru - .1 * fl, 0, .35 + .8 * fl);
            p.fa1[0] = -.7;
          }
        }
        p.sp[0] = .12 * ru - .04 * fl;
        p.ch[0] = .05;
        p.hd[0] = -.12;
        p.hd[1] = 0;
        p.gw = 0;
        p.off = 0;
        if (s.flip > 0 && s.flip < 1) {
          const w = sin(PI * s.flip);
          for (const k of [0, 1]) {
            lerp3(p['th' + k], [-1.75, 0, k ? .15 : -.15], w);
            lerp3(p['sh' + k], [2.2, 0, 0], w);
          }
          lerp3(p.ua0, [-.9, 0, -.25], w);
          p.fa0[0] = mix(p.fa0[0], -1.5, w);
          if (!G.staff) {
            lerp3(p.ua1, [-.9, 0, .25], w);
            p.fa1[0] = mix(p.fa1[0], -1.5, w);
          }
          p.sp[0] += .35 * w;
          p.hd[0] += .3 * w;
        }
      }
      // atılma
      if (s.dsh) {
        p.sp[0] = mix(p.sp[0], .42, .9);
        p.ch[0] = .25;
        p.hd[0] = -.5;
        set3(p.ua0, 1.15, -.2, -.38);
        p.fa0[0] = -.15;
        if (!G.staff) {
          set3(p.ua1, 1.15, .2, .38);
          p.fa1[0] = -.15;
        }
        set3(p.th0, -1.0, 0, -.04);
        set3(p.sh0, .45, 0, 0);
        set3(p.ft0, -.1, 0, 0);
        set3(p.th1, .75, 0, .04);
        set3(p.sh1, 1.25, 0, 0);
        set3(p.ft1, .6, 0, 0);
      }
      // iniş: dizler bükülür
      if (s.land > 0 && !s.air) {
        const l = s.land;
        p.off -= .28 * l;
        for (const k of [0, 1]) {
          p['th' + k][0] -= .45 * l;
          p['sh' + k][0] += .9 * l;
          p['ft' + k][0] -= .3 * l;
        }
        p.sp[0] += .25 * l;
        p.ua0[2] -= .3 * l;
        p.ua1[2] += .3 * l;
      }
      // saldırı hareketi
      if (s.at < 1) {
        const a = s.at,
          w = sm(a / .12) * (1 - sm((a - .62) / .38));
        if (G.staff) {
          const k = sm((a - .15) / .3);
          lerp3(p.ua0, [-1.5, -.2, -.1], w);
          p.fa0[0] = mix(p.fa0[0], -.12, w);
          lerp3(p.ua1, [mix(-1.4, -.6, k), 0, .25], w);
          p.fa1[0] = mix(p.fa1[0], mix(-.5, -1.0, k), w);
          p.ch[1] += .3 * w;
          p.sp[0] += mix(-.1, .12, k) * w;
        } else {
          const sd = G.ninja ? s.side ? 1 : 0 : 1,
            sg = sd ? 1 : -1,
            U = p['ua' + sd],
            F = p['fa' + sd],
            wi = sm(a / .32),
            rl = sm((a - .32) / .2);
          lerp3(U, [mix(mix(-.2, -2.7, wi), .35, rl), 0, sg * mix(.3, .08, rl)], w);
          F[0] = mix(F[0], mix(mix(-.4, -1.55, wi), -.12, rl), w);
          p.ch[1] += sg * mix(.38 * wi, -.4, rl) * w;
          p.sp[0] += (.14 * rl - .06 * wi) * w;
          p.hd[1] -= p.ch[1] * .5 * w;
        }
      }
      // darbe
      if (s.hit > 0) {
        const h = s.hit;
        p.sp[0] -= .32 * h;
        p.hd[0] -= .35 * h;
        p.ch[1] += .2 * h;
        p.ua0[2] -= .35 * h;
        p.ua1[2] += .35 * h;
      }
      apply(u, p, dt, s.at < 1 ? 30 : s.air || s.dsh ? 22 : 16);
      cape(u, s, dt);
    }

    // ---------- pelerin: yaylı zincir
    function cape(u, s, dt) {
      const B = u.b;
      if (!B.c0) return;
      const c = u.cp || (u.cp = {
          a: [0, 0, 0, 0],
          v: [0, 0, 0, 0],
          z: [0, 0, 0, 0],
          w: [0, 0, 0, 0]
        }),
        cu = u.cur;
      const chP = cu ? cu.hip[0] + cu.sp[0] + cu.ch[0] : 0,
        sp = s.v || 0,
        fall = s.air ? cl(-s.vy / 12, 0, 1) : 0,
        rise = s.air ? cl(s.vy / 12, 0, 1) : 0,
        R = cl(sp / 11, 0, 1);
      let base = .05 + .6 * R + (s.dsh ? .55 : 0) + fall * .8 - rise * .15 + (s.sl ? .75 : 0);
      base = cl(base - chP * .55, -.15, 1.5);
      const fl = (.05 + .09 * R + .1 * fall) * (s.dsh ? 1.7 : 1),
        ph = u.cph || 0,
        st = [80, 62, 50, 42],
        dm = [11, 9.5, 8.5, 7.5];
      for (let i = 0; i < 4; i++) {
        const tg = (i ? base * .06 : base) + fl * sin(s.t * (7.5 + i * 1.3) - i * 1.2 + ph) * (i ? 1 : .35),
          tz = -cl((s.turn || 0) * .07, -.4, .4) * (i ? .45 : 1) + .05 * R * sin(s.t * 3.3 + i * 1.7 + ph);
        if (dt > 0) {
          const h = mn(dt, .034);
          c.v[i] += ((tg - c.a[i]) * st[i] - c.v[i] * dm[i]) * h;
          c.a[i] += c.v[i] * h;
          c.w[i] += ((tz - c.z[i]) * st[i] - c.w[i] * dm[i]) * h;
          c.z[i] += c.w[i] * h;
        } else {
          c.a[i] = tg;
          c.z[i] = tz;
        }
        B['c' + i].rotation.set(c.a[i], 0, c.z[i]);
      }
    }

    // ---------- yaratıklar
    const CG = [{
      st: .62,
      kn: 1.05,
      ar: .55,
      el: .35,
      ln: .12,
      hy: .25,
      hr: .04
    }, null, {
      st: .34,
      kn: .45,
      ar: .3,
      el: .2,
      ln: .05,
      hy: .15,
      hr: .11
    }, {
      st: .36,
      kn: .5,
      ar: .26,
      el: .25,
      ln: .06,
      hy: .14,
      hr: .09
    }, {
      st: .5,
      kn: .8,
      ar: .35,
      el: .3,
      ln: .06,
      hy: .2,
      hr: .03
    }, {
      st: .52,
      kn: .85,
      ar: .6,
      el: .25,
      ln: .25,
      hy: .2,
      hr: .06
    }];
    function cr(u, t, s, dt) {
      if (t == 1) return bat(u, s, dt);
      const G = CG[t],
        p = tp(u),
        m = s.m || 0,
        ph = s.ph || 0,
        sn = sin(ph),
        br = sin(s.t * 2 + (u.cph || 0));
      p.ch[0] = .04 * br;
      p.hd[0] = -.03 * br;
      set3(p.ua0, .05, 0, -.12);
      set3(p.ua1, .05, 0, .12);
      p.fa0[0] = p.fa1[0] = -.25;
      p.th0[2] = -.035;
      p.th1[2] = .035;
      p.hip[1] = G.hy * m * sn;
      p.hip[2] = -G.hr * m * cos(ph);
      p.ch[1] = -G.hy * 1.3 * m * sn;
      p.sp[2] = G.hr * .6 * m * cos(ph);
      p.sp[0] += G.ln * m;
      p.hd[0] -= G.ln * m * .6;
      p.hd[1] -= p.ch[1] * .6;
      legs(p, ph, G.st * m, G.kn * m, m);
      p.ua0[0] += G.ar * m * sn;
      p.ua1[0] -= G.ar * m * sn;
      p.fa0[0] -= G.el * m;
      p.fa1[0] -= G.el * m;
      p.off = -.04 * m;
      if (t == 0) {
        p.hd[0] += .1 * sin(ph * 2) * m;
        if (s.near) {
          const a = s.t * 6 + (u.cph || 0),
            k = sin(a);
          set3(p.ua0, -1.25 - .95 * k, 0, -.3);
          set3(p.ua1, -1.25 + .95 * k, 0, .3);
          p.fa0[0] = p.fa1[0] = -.55;
          p.sp[0] += .18;
          p.hd[0] -= .25;
        }
      }
      if (t == 2 || t == 3) p.hd[0] += .04 * sin(ph * 2) * m;
      if (t == 2 && (s.atk > 0 || s.near)) {
        // s.atk: oyundaki gerçek yumruk (0-1 ilerleme, inişi vuruş anına denk); yoksa yakınken süs döngüsü
        const a = s.atk > 0 ? s.atk : (s.t * 2.6 + (u.cph || 0)) % (2 * PI) / (2 * PI),
          up = sm(a / .6),
          dn = sm((a - .62) / .12);
        for (const k of [0, 1]) {
          const U = p['ua' + k];
          set3(U, mix(-2.5 * up, .15, dn), 0, k ? .2 : -.2);
        }
        p.fa0[0] = p.fa1[0] = mix(-.4, -.1, dn);
        p.sp[0] += mix(-.15 * up, .3, dn);
      }
      if (t == 3 && s.slam > 0) {
        const k = 1 - s.slam / .9,
          up = sm(k / .68),
          dn = sm((k - .76) / .12);
        set3(p.ua0, mix(-2.85 * up, .2, dn), 0, -.25);
        set3(p.ua1, mix(-2.85 * up, .2, dn), 0, .25);
        p.fa0[0] = p.fa1[0] = mix(-.55 * up, -.1, dn);
        p.sp[0] = mix(-.28 * up, .5, dn);
        p.ch[0] = mix(-.1 * up, .2, dn);
        p.hd[0] = mix(-.2 * up, .15, dn);
        p.off = mix(.04 * up, -.32, dn);
        set3(p.th0, -.2, 0, -.16);
        set3(p.th1, .2, 0, .16);
        p.sh0[0] = p.sh1[0] = .25 * up + .35 * dn;
      }
      if (t == 4 && s.aim > 0) {
        const w = s.aim;
        p.ch[1] = mix(p.ch[1], .75, w);
        p.hd[1] = mix(p.hd[1], -.7, w);
        lerp3(p.ua0, [-1.5, -.75, -.05], w);
        p.fa0[0] = mix(p.fa0[0], -.05, w);
        lerp3(p.ua1, [0, -.1, 1.45], w);
        p.fa1[0] = mix(p.fa1[0], -1.75, w);
      }
      if (t == 5) {
        if (s.cs == 1) {
          p.off -= .32;
          p.sp[0] += .5;
          p.ch[0] += .15;
          p.hd[0] -= .6;
          set3(p.ua0, .85, 0, -.35);
          set3(p.ua1, .85, 0, .35);
          for (const k of [0, 1]) {
            p['th' + k][0] -= .5;
            p['sh' + k][0] += .9;
            p['ft' + k][0] -= .35;
          }
        } else if (s.cs == 2) {
          p.sp[0] += .35;
          p.hd[0] -= .4;
          set3(p.ua0, -1.25 + .3 * sn, 0, -.3);
          set3(p.ua1, -1.25 - .3 * sn, 0, .3);
          p.fa0[0] = p.fa1[0] = -.35;
        } else if (s.cs == 3) {
          const k = sin(s.t * 14);
          set3(p.ua0, -1.25, .2, -.55 - .25 * k);
          set3(p.ua1, -1.25, -.2, .55 + .25 * k);
          p.fa0[0] = p.fa1[0] = -1.9;
          p.sp[0] -= .15;
          p.hd[0] -= .3;
        }
      }
      if (s.hit > 0) {
        const h = s.hit;
        p.sp[0] -= .3 * h;
        p.hd[0] -= .35 * h;
        p.ch[1] += .18 * h;
      }
      if (s.dead > 0 && s.fly) {
        const w = sin(s.t * 22 + (u.cph || 0)),
          v = sin(s.t * 17 + 1.3 + (u.cph || 0));
        set3(p.ua0, -2.3 + .5 * w, 0, -1.1 - .3 * v);
        set3(p.ua1, -2.1 - .5 * w, 0, 1.1 + .3 * v);
        p.fa0[0] = p.fa1[0] = -.3;
        set3(p.th0, -.7 + .4 * v, 0, -.5);
        set3(p.th1, .4 - .4 * v, 0, .5);
        p.sh0[0] = .7;
        p.sh1[0] = .5;
        p.sp[0] = -.35;
        p.hd[0] = -.4;
        p.gw = 0;
        p.off = 0;
      } else if (s.dead > 0) {
        const k = sm(s.dead);
        set3(p.th0, -1.1 * k, 0, -.15 * k);
        set3(p.th1, -.6 * k, 0, .15 * k);
        p.sh0[0] = 1.9 * k;
        p.sh1[0] = 1.6 * k;
        p.ft0[0] = p.ft1[0] = .4 * k;
        p.sp[0] = mix(p.sp[0], .55, k);
        p.ch[0] = mix(p.ch[0], .35, k);
        p.hd[0] = mix(p.hd[0], .5, k);
        lerp3(p.ua0, [.3, 0, -.6], k);
        lerp3(p.ua1, [.2, 0, .6], k);
        p.gw = 1 - k;
        p.off = -u.info.hy0 * .5 * k;
      }
      apply(u, p, dt, s.dead > 0 ? 14 : 15);
    }
    function bat(u, s, dt) {
      const p = tp(u),
        f = s.ph || 0,
        fl = sin(f),
        f2 = sin(f - 1.1),
        cf = cos(f);
      set3(p.wa0, .15 * cf, -.22 * cf, .58 * fl - .08);
      set3(p.wb0, 0, -.18 * cos(f - 1), .42 * f2 + .05);
      set3(p.wa1, .15 * cf, .22 * cf, -.58 * fl + .08);
      set3(p.wb1, 0, .18 * cos(f - 1), -.42 * f2 - .05);
      set3(p.hip, .12 * cf + .08, 0, 0);
      set3(p.hd, -.12 * cf, 0, 0);
      p.off = -.1 * fl;
      p.gw = 0;
      if (s.hit > 0) {
        p.hip[0] -= .4 * s.hit;
        p.hip[2] += .3 * s.hit;
      }
      if (s.dead > 0) {
        const k = sm(s.dead);
        set3(p.wa0, 0, -.4 * k, -1.1 * k);
        set3(p.wb0, 0, 0, -1.6 * k);
        set3(p.wa1, 0, .4 * k, 1.1 * k);
        set3(p.wb1, 0, 0, 1.6 * k);
        p.hip[0] = mix(p.hip[0], 1.1, k);
        p.off = -1.2 * k;
      }
      apply(u, p, dt, 60);
    }
    return {
      hero,
      cr,
      cape
    };
  })();
}
