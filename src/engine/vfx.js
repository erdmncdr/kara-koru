// engine/vfx.js · Kara Koru
// Bu dosya tek dosyalık sürümden (v22) otomatik ayrıldı. Ortak oyun durumu core/store.js içindeki $G nesnesinde.

import { iskinFlash } from './iskin.js';
import { $G } from '../core/store.js';
import { THREE } from './three.js';
import { SET } from '../core/settings.js';
import { rn } from '../core/util.js';
import { BM, FLMS, cam, glow, mk, sc } from './renderer.js';
import { TELM } from '../game/creatures.js';

export let VFX, shad, gBl, mBolt, mEB, gEB, gXp, gCoin, gHeart, mGem, mGold, mSilv, mHeal, mFire, mZap, mIce, gRing, gCirc, gIce, FLM, DN, tv;

export function __init_51() {
  // ---- efekt sistemi: kameraya bakan yumuşak parçacıklar, kıvılcım izleri, sekip duran kırıntılar, ışık sütunları
  VFX = (() => {
    const mkTex = (w, h, fn) => {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const x = c.getContext('2d');
      if (!x) return null;
      fn(x, w, h);
      return new THREE.CanvasTexture(c);
    };
    const rg = (x, cx, cy, r, st) => {
      const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
      for (const [o, a] of st) g.addColorStop(o, 'rgba(255,255,255,' + a + ')');
      x.fillStyle = g;
      x.fillRect(0, 0, x.canvas.width, x.canvas.height);
    };
    const tSoft = mkTex(64, 64, x => rg(x, 32, 32, 32, [[0, 1], [.25, .85], [.6, .25], [1, 0]]));
    const tPuff = mkTex(64, 64, x => {
      let s = 7;
      const r = () => {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280;
      };
      for (let i = 0; i < 8; i++) {
        const cx = 18 + r() * 28,
          cy = 18 + r() * 28,
          rr = 9 + r() * 13,
          g = x.createRadialGradient(cx, cy, 0, cx, cy, rr);
        g.addColorStop(0, 'rgba(255,255,255,.5)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        x.fillStyle = g;
        x.fillRect(0, 0, 64, 64);
      }
    });
    const tSpk = mkTex(16, 64, x => {
      const g = x.createLinearGradient(0, 0, 0, 64);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(.35, 'rgba(255,255,255,1)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g;
      x.fillRect(0, 0, 16, 64);
      x.globalCompositeOperation = 'destination-in';
      const h = x.createLinearGradient(0, 0, 16, 0);
      h.addColorStop(0, 'rgba(0,0,0,0)');
      h.addColorStop(.5, 'rgba(0,0,0,1)');
      h.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = h;
      x.fillRect(0, 0, 16, 64);
    });
    const tStar = mkTex(64, 64, x => {
      rg(x, 32, 32, 14, [[0, 1], [1, 0]]);
      x.globalCompositeOperation = 'lighter';
      for (const [w, h] of [[3, 30], [30, 3]]) {
        const g = x.createRadialGradient(32, 32, 0, 32, 32, 30);
        g.addColorStop(0, 'rgba(255,255,255,1)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        x.fillStyle = g;
        x.fillRect(32 - w, 32 - h, w * 2, h * 2);
      }
    });
    const D = new THREE.Object3D(),
      C = new THREE.Color(),
      Z = new THREE.Vector3(0, 0, 1),
      qz = new THREE.Quaternion();
    const pools = [];
    function pool(n, tex, add, op, geo, mat) {
      const m = mat || new THREE.MeshBasicMaterial({
          map: tex,
          transparent: true,
          depthWrite: false,
          blending: add ? THREE.AdditiveBlending : THREE.NormalBlending,
          opacity: op,
          fog: !add
        }),
        im = new THREE.InstancedMesh(geo || new THREE.PlaneGeometry(1, 1), m, n);
      im.frustumCulled = false;
      im.op0 = op;
      for (let i = 0; i < n; i++) {
        im.setColorAt(i, C.setRGB(1, 1, 1));
        D.position.set(0, -999, 0);
        D.updateMatrix();
        im.setMatrixAt(i, D.matrix);
      }
      im.count = 0;
      sc.add(im);
      const p = {
        im,
        n,
        a: 0,
        add,
        P: new Float32Array(n * 3),
        V: new Float32Array(n * 3),
        L: new Float32Array(n),
        ML: new Float32Array(n),
        S0: new Float32Array(n),
        S1: new Float32Array(n),
        C0: new Float32Array(n * 3),
        C1: new Float32Array(n * 3),
        G: new Float32Array(n),
        Dr: new Float32Array(n),
        R: new Float32Array(n * 3),
        W: new Float32Array(n * 3),
        GY: new Float32Array(n),
        K: new Uint8Array(n)
      };
      pools.push(p);
      return p;
    }
    const ADD = pool(900, tSoft, 1, 1),
      SPK = pool(500, tSpk, 1, 1),
      STR = pool(220, tStar, 1, 1),
      ALP = pool(520, tPuff, 0, .9),
      DEB = pool(260, null, 0, 1, new THREE.IcosahedronGeometry(1, 0), new THREE.MeshStandardMaterial({
        flatShading: true,
        roughness: .75,
        metalness: 0
      }));
    const r = (a, b) => a + Math.random() * (b - a),
      hx = h => [(h >> 16 & 255) / 255, (h >> 8 & 255) / 255, (h & 255) / 255],
      lin3 = c => c.map(v => v <= .04045 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4));
    const HC = {};
    const col = h => HC[h] || (HC[h] = lin3(hx(h)));
    // o: n, sp:[a,b] hız, up: yukarı ek, dir:[x,y,z] yön, cone, life:[a,b], s:[a,b] başlangıç boyu, s1: bitiş çarpanı, c, c1, g, d(sürtünme), k(tür)
    function emit(p, x, y, z, o) {
      const n = Math.max(1, Math.round((o.n || 1) * (SET.pd == null ? 1 : SET.pd))),
        c0 = col(o.c == null ? 0xffffff : o.c),
        c1 = o.c1 == null ? p.add ? [0, 0, 0] : c0 : col(o.c1);
      for (let k = 0; k < n; k++) {
        if (p.a >= p.n) return;
        const i = p.a++,
          j = i * 3;
        let vx = r(-1, 1),
          vy = r(-1, 1),
          vz = r(-1, 1);
        const l = Math.hypot(vx, vy, vz) || 1;
        vx /= l;
        vy /= l;
        vz /= l;
        if (o.dir) {
          const cn = o.cone == null ? .5 : o.cone;
          vx = o.dir[0] + vx * cn;
          vy = o.dir[1] + vy * cn;
          vz = o.dir[2] + vz * cn;
          const m = Math.hypot(vx, vy, vz) || 1;
          vx /= m;
          vy /= m;
          vz /= m;
        }
        if (o.flat) {
          vy = Math.abs(vy) * o.flat;
        }
        const s = o.sp ? r(o.sp[0], o.sp[1]) : 3,
          rad = o.rad || 0;
        p.P[j] = x + vx * rad;
        p.P[j + 1] = y + (o.flat ? 0 : vy * rad);
        p.P[j + 2] = z + vz * rad;
        p.V[j] = vx * s;
        p.V[j + 1] = vy * s + (o.up || 0) + (o.upr ? r(0, o.upr) : 0);
        p.V[j + 2] = vz * s;
        const lf = o.life ? r(o.life[0], o.life[1]) : .6;
        p.L[i] = p.ML[i] = lf;
        const s0 = o.s ? r(o.s[0], o.s[1]) : .3;
        p.S0[i] = s0;
        p.S1[i] = s0 * (o.s1 == null ? p.add ? .2 : 1.6 : o.s1);
        for (let q = 0; q < 3; q++) {
          p.C0[j + q] = c0[q] * (o.br || 1);
          p.C1[j + q] = c1[q];
        }
        p.G[i] = o.g == null ? 0 : o.g;
        p.Dr[i] = o.d == null ? 1.5 : o.d;
        p.GY[i] = o.gy == null ? -1e9 : o.gy;
        p.K[i] = o.k || 0;
        p.R[j] = r(0, 6.28);
        p.R[j + 1] = r(0, 6.28);
        p.R[j + 2] = r(0, 6.28);
        p.W[j] = r(-12, 12);
        p.W[j + 1] = r(-12, 12);
        p.W[j + 2] = r(-12, 12);
      }
    }
    const mv = (p, a, b) => {
      const ja = a * 3,
        jb = b * 3;
      for (const k of ['P', 'V', 'C0', 'C1', 'R', 'W']) for (let q = 0; q < 3; q++) p[k][jb + q] = p[k][ja + q];
      for (const k of ['L', 'ML', 'S0', 'S1', 'G', 'Dr', 'GY', 'K']) p[k][b] = p[k][a];
    };
    const BM_ = [];
    let boomT = -1;
    function upd(dt) {
      const cq = cam.quaternion,
        e = cam.matrixWorld.elements,
        rx = e[0],
        ry = e[1],
        rz = e[2],
        ux = e[4],
        uy = e[5],
        uz = e[6];
      for (const p of pools) {
        p.im.count = p.n;
        let w = 0;
        for (let i = 0; i < p.a; i++) {
          p.L[i] -= dt;
          if (p.L[i] <= 0) continue;
          if (w != i) mv(p, i, w);
          const j = w * 3,
            dr = Math.exp(-p.Dr[w] * dt);
          p.V[j + 1] -= p.G[w] * dt;
          p.V[j] *= dr;
          p.V[j + 1] *= dr;
          p.V[j + 2] *= dr;
          p.P[j] += p.V[j] * dt;
          p.P[j + 1] += p.V[j + 1] * dt;
          p.P[j + 2] += p.V[j + 2] * dt;
          if (p.P[j + 1] < p.GY[w]) {
            p.P[j + 1] = p.GY[w];
            if (p.V[j + 1] < -1.5) {
              p.V[j + 1] *= -.38;
              p.V[j] *= .6;
              p.V[j + 2] *= .6;
              for (let q = 0; q < 3; q++) p.W[j + q] *= .5;
            } else {
              p.V[j + 1] = 0;
              p.V[j] *= .8;
              p.V[j + 2] *= .8;
              for (let q = 0; q < 3; q++) p.W[j + q] *= .8;
            }
          }
          const t = 1 - p.L[w] / p.ML[w];
          let s = p.S0[w] + (p.S1[w] - p.S0[w]) * t;
          if (p === DEB) {
            for (let q = 0; q < 3; q++) p.R[j + q] += p.W[j + q] * dt;
            if (t > .75) s *= 1 - (t - .75) / .25;
            D.position.set(p.P[j], p.P[j + 1], p.P[j + 2]);
            D.rotation.set(p.R[j], p.R[j + 1], p.R[j + 2]);
            D.scale.set(s, s * .7, s * .85);
          } else {
            D.position.set(p.P[j], p.P[j + 1], p.P[j + 2]);
            D.quaternion.copy(cq);
            if (p === SPK) {
              const sx = p.V[j] * rx + p.V[j + 1] * ry + p.V[j + 2] * rz,
                sy = p.V[j] * ux + p.V[j + 1] * uy + p.V[j + 2] * uz,
                sl = Math.hypot(sx, sy);
              qz.setFromAxisAngle(Z, Math.atan2(sy, sx) - Math.PI / 2);
              D.quaternion.multiply(qz);
              D.scale.set(s * .35, s * (1 + sl * .09), 1);
            } else {
              if (p === STR) {
                qz.setFromAxisAngle(Z, p.R[j] + t * 2);
                D.quaternion.multiply(qz);
              }
              if (!p.add && t < .12) s *= t / .12;
              D.scale.set(s, s, 1);
            }
          }
          D.updateMatrix();
          p.im.setMatrixAt(w, D.matrix);
          const f = p.add ? (1 - t) * (1 - t * .3) : t > .6 ? 1 - (t - .6) / .4 * .85 : 1;
          C.setRGB((p.C0[j] + (p.C1[j] - p.C0[j]) * t) * f, (p.C0[j + 1] + (p.C1[j + 1] - p.C0[j + 1]) * t) * f, (p.C0[j + 2] + (p.C1[j + 2] - p.C0[j + 2]) * t) * f);
          p.im.setColorAt(w, C);
          w++;
        }
        p.a = w;
        p.im.count = w;
        p.im.instanceMatrix.needsUpdate = true;
        if (p.im.instanceColor) p.im.instanceColor.needsUpdate = true;
      }
      for (const b of BM_) {
        b.t += dt;
        const k = b.t / b.l;
        b.m.scale.set(b.w * (1 - k * .6), b.h * (.6 + k * .8), b.w * (1 - k * .6));
        b.m.material.opacity = b.o * Math.sin(Math.min(1, k * 3) * Math.PI * .5) * (1 - k);
        if (k >= 1) {
          sc.remove(b.m);
          b.m.material.dispose();
        }
      }
      for (let i = BM_.length - 1; i >= 0; i--) if (BM_[i].t >= BM_[i].l) BM_.splice(i, 1);
    }
    // ışık sütunu
    const tBeam = mkTex(8, 64, x => {
        const g = x.createLinearGradient(0, 64, 0, 0);
        g.addColorStop(0, 'rgba(255,255,255,1)');
        g.addColorStop(.6, 'rgba(255,255,255,.35)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        x.fillStyle = g;
        x.fillRect(0, 0, 8, 64);
      }),
      gBeam = new THREE.CylinderGeometry(1, 1, 1, 24, 1, true);
    gBeam.translate && gBeam.translate(0, .5, 0);
    function beam(x, y, z, c, w, h, l, o = .9) {
      if (BM_.length > 8) return;
      const m = new THREE.Mesh(gBeam, new THREE.MeshBasicMaterial({
        map: tBeam,
        color: c,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: 2,
        opacity: 0
      }));
      m.position.set(x, y, z);
      sc.add(m);
      BM_.push({
        m,
        t: 0,
        l,
        w,
        h,
        o
      });
    }
    const BLD = [0x4a5a2a, 0x5a1a24, 0xff7a2a, 0x6a1a10, 0xe8e0c8, 0x3a2a1e],
      BLD2 = [0x23301a, 0x2a0a10, 0x4a4440, 0x2a0805, 0xb8b098, 0x1a120c];
    const api = {
      clear() {
        for (const p of pools) {
          p.a = 0;
          p.im.count = 0;
        }
        for (const b of BM_) {
          sc.remove(b.m);
          b.m.material.dispose();
        }
        BM_.length = 0;
      },
      upd,
      emit,
      setOp(k) {
        for (const p of [ADD, SPK, STR, ALP, DEB]) { const m = p && p.im ? p.im : p; if (m && m.material) m.material.opacity = (m.op0 == null ? 1 : m.op0) * k; }
      },
      ADD,
      SPK,
      STR,
      ALP,
      DEB,
      beam,
      puff(x, y, z, c, n = 8) {
        emit(ALP, x, y, z, {
          n: Math.ceil(n * .8),
          sp: [1.5, 5],
          up: 2,
          life: [.45, .9],
          s: [.35, .7],
          s1: 1.9,
          c,
          g: 3,
          d: 2.5
        });
        if (n > 6) emit(DEB, x, y, z, {
          n: Math.min(6, n >> 2),
          sp: [3, 7],
          up: 4,
          life: [.6, 1],
          s: [.06, .13],
          s1: 1,
          c,
          g: 26,
          d: .5,
          gy: y - .5
        });
      },
      dust(x, y, z, n = 4, c = 0x8a7a62, sp = 2) {
        emit(ALP, x, y, z, {
          n,
          sp: [sp * .5, sp],
          flat: .25,
          up: .6,
          life: [.4, .8],
          s: [.3, .55],
          s1: 2.2,
          c,
          g: -.3,
          d: 3
        });
      },
      trail(x, y, z, c, s = .5, l = .25) {
        emit(ADD, x, y, z, {
          n: 1,
          sp: [0, .4],
          life: [l * .7, l],
          s: [s * .8, s],
          s1: .1,
          c
        });
      },
      hit(x, y, z, c, t, dx, dz, cr) {
        const d = [dx || 0, .35, dz || 0];
        emit(SPK, x, y, z, {
          n: cr ? 8 : 4,
          sp: [7, 16],
          dir: d,
          cone: .9,
          life: [.12, .25],
          s: [.35, .6],
          s1: .3,
          c: c || 0xfff2c8,
          br: 1.2,
          g: 8,
          d: 4
        });
        emit(ADD, x, y, z, {
          n: 1,
          sp: [0, 0],
          life: [.07, .09],
          s: [cr ? 1.3 : .8, cr ? 1.5 : 1],
          s1: .4,
          c: c || 0xffe0a8,
          br: cr ? .75 : .5
        });
        if (t != null) emit(ALP, x, y, z, {
          n: 3,
          sp: [2, 5],
          dir: d,
          cone: 1,
          up: 1,
          life: [.35, .6],
          s: [.18, .32],
          s1: 1.3,
          c: BLD[t],
          c1: BLD2[t],
          g: 14,
          d: 2
        });
      },
      die(x, y, z, t, r, big) {
        const k = big ? 2.2 : 1;
        emit(ADD, x, y + r * .8, z, {
          n: 1,
          sp: [0, 0],
          life: [.14, .16],
          s: [r * 3 * k, r * 3.2 * k],
          s1: .2,
          c: 0xffe8b0
        });
        emit(ALP, x, y + r * .8, z, {
          n: Math.round(9 * k),
          sp: [3, 9 * k],
          up: 3,
          life: [.4, .8],
          s: [.25, .5],
          s1: 1.4,
          c: BLD[t],
          c1: BLD2[t],
          g: 16,
          d: 1.6
        });
        emit(DEB, x, y + r * .8, z, {
          n: Math.round((t == 2 ? 9 : t == 4 ? 7 : 4) * k),
          sp: [4, 10 * k],
          up: 6,
          life: [.9, 1.5],
          s: t == 2 ? [.12, .26] : [.05, .11],
          s1: 1,
          c: t == 2 ? 0x6e6964 : t == 4 ? 0xd2c8ae : BLD[t],
          g: 28,
          d: .4,
          gy: y + .05
        });
        emit(STR, x, y + r, z, {
          n: Math.round(5 * k),
          sp: [2, 5],
          up: 4,
          life: [.5, .9],
          s: [.35, .6],
          s1: .3,
          c: 0xffd36a,
          g: 5,
          d: 2
        });
      },
      boom(x, y, z, R) {
        // art arda patlamalar (çoklu Ateş Topu, Havai Fişek) yığılmasın: 0.3 sn içinde gelenler yarı parçacıkla çizilir
        const now = $G.P && $G.P.tt || 0,
          gap = now - boomT,
          m = gap >= 0 && gap < .3 ? .5 : 1; // koşu saati; gap < 0: yeni koşuda saat başa döndü
        boomT = now;
        emit(ADD, x, y, z, {
          n: 1,
          sp: [0, 0],
          life: [.16, .18],
          s: [R * 1.1, R * 1.25],
          s1: .5,
          c: 0xffd8a0,
          br: .7
        });
        emit(ADD, x, y, z, {
          n: 12 * m,
          sp: [R * 1.5, R * 4],
          up: 1,
          life: [.25, .55],
          s: [.8, 1.6],
          s1: .3,
          c: 0xffc04a,
          c1: 0x6a1004,
          d: 3.5
        });
        emit(ALP, x, y, z, {
          n: 6 * m,
          sp: [R * .6, R * 1.6],
          up: 2.5,
          life: [.7, 1.2],
          s: [.7, 1.1],
          s1: 2.2,
          c: 0x4a4038,
          c1: 0x2a2622,
          g: -1.5,
          d: 2
        });
        emit(SPK, x, y, z, {
          n: 8 * m,
          sp: [10, 22],
          up: 4,
          life: [.3, .6],
          s: [.4, .7],
          s1: .2,
          c: 0xffb04a,
          br: 1.5,
          g: 18,
          d: 1.2
        });
        emit(DEB, x, y, z, {
          n: 5,
          sp: [5, 11],
          up: 6,
          life: [.8, 1.2],
          s: [.06, .12],
          s1: 1,
          c: 0x2a2018,
          g: 28,
          d: .4,
          gy: y - .6
        });
      },
      zap(x, y, z) {
        emit(ADD, x, y, z, {
          n: 1,
          sp: [0, 0],
          life: [.1, .12],
          s: [1.4, 1.6],
          s1: .3,
          c: 0xc4e2ff,
          br: .7
        });
        emit(SPK, x, y, z, {
          n: 6,
          sp: [8, 16],
          up: 2,
          life: [.12, .25],
          s: [.3, .5],
          s1: .2,
          c: 0xbfe9ff,
          br: 1.6,
          g: 4,
          d: 3
        });
      },
      ice(x, y, z) {
        emit(STR, x, y, z, {
          n: 4,
          sp: [2, 5],
          life: [.25, .45],
          s: [.3, .5],
          s1: .2,
          c: 0xdff8ff
        });
        emit(DEB, x, y, z, {
          n: 3,
          sp: [3, 6],
          up: 3,
          life: [.4, .7],
          s: [.05, .09],
          s1: 1,
          c: 0xbff2ff,
          g: 20,
          d: .5,
          gy: y - 1
        });
      },
      pick(x, y, z, c) {
        emit(STR, x, y, z, {
          n: 1,
          sp: [0, .5],
          life: [.22, .3],
          s: [.7, .9],
          s1: .2,
          c
        });
        emit(ADD, x, y, z, {
          n: 3,
          sp: [1.5, 3.5],
          life: [.2, .35],
          s: [.15, .25],
          s1: .1,
          c
        });
      },
      lvl(x, y, z) {
        beam(x, y - 1, z, 0xa8e3d6, 1.3, 14, 1.1);
        emit(STR, x, y, z, {
          n: 18,
          sp: [1, 4],
          up: 6,
          life: [.7, 1.3],
          s: [.3, .6],
          s1: .2,
          c: 0xc8fff0,
          g: -1,
          d: 1.2,
          rad: 1.2
        });
        emit(ADD, x, y - .8, z, {
          n: 24,
          sp: [5, 9],
          flat: .05,
          life: [.35, .6],
          s: [.3, .5],
          s1: .1,
          c: 0xa8e3d6
        });
      },
      chest(x, y, z, rr) {
        const cc = [0xd8dccf, 0x7fe06a, 0x5aa8ff, 0xc880ff, 0xffb84a][rr | 0];
        beam(x, y, z, cc, .9 + rr * .25, 9 + rr * 4, 1.3 + rr * .25, .75 + rr * .06);
        emit(DEB, x, y + 1, z, {
          n: 14 + rr * 6,
          sp: [4, 9],
          up: 9,
          life: [1, 1.6],
          s: [.05, .1],
          s1: 1,
          c: cc,
          g: 20,
          d: .6,
          gy: y + .05
        });
        emit(DEB, x, y + 1, z, {
          n: 8,
          sp: [3, 8],
          up: 8,
          life: [1, 1.6],
          s: [.05, .1],
          s1: 1,
          c: 0xffd36a,
          g: 20,
          d: .6,
          gy: y + .05
        });
        emit(STR, x, y + 1.2, z, {
          n: 10 + rr * 4,
          sp: [2, 6],
          up: 3,
          life: [.6, 1.1],
          s: [.4, .8],
          s1: .2,
          c: cc,
          g: 2,
          d: 1.5
        });
        emit(ADD, x, y + 1, z, {
          n: 1,
          sp: [0, 0],
          life: [.2, .22],
          s: [5, 5.5],
          s1: .4,
          c: cc
        });
      },
      shrine(x, y, z, c) {
        beam(x, y, z, c, 1.6, 12, 1.3);
        emit(STR, x, y + 1, z, {
          n: 16,
          sp: [1, 4],
          up: 4,
          life: [.7, 1.2],
          s: [.4, .7],
          s1: .2,
          c,
          g: -1,
          d: 1.2,
          rad: 1.5
        });
      },
      mote(x, y, z, c, R) {
        emit(ADD, x, y, z, {
          n: 1,
          sp: [0, .3],
          up: 1.6,
          upr: 1,
          life: [.6, 1],
          s: [.16, .28],
          s1: .1,
          c,
          rad: R,
          flat: 0
        });
      },
      bubble(x, y, z, c, R) {
        emit(ALP, x + r(-R, R) * .7, y, z + r(-R, R) * .7, {
          n: 1,
          sp: [0, .2],
          up: 1.2,
          life: [.5, .9],
          s: [.12, .25],
          s1: 1.5,
          c,
          g: -.4,
          d: 1
        });
      }
    };
    return api;
  })();
}

export function puff(x, y, z, c, n = 8) {
  VFX.puff(x, y, z, c, n);
}

// ---- elle kurulan üçgen ağları (ganimet ve düşman atışları): dizinsiz, köşe renkli
const C3 = h => {
  const c = new THREE.Color(h);
  return [c.r, c.g, c.b];
};
function triGeo() {
  const P = [],
    C = [];
  // sh: yüz normaline göre sahte gölge (ışıksız malzemede hacim okunsun); out: yüzü merkezden dışarı baktır
  const tri = (a, b, c, ca, cb, cc, sh, out) => {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2],
      vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2],
      nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx,
      l = Math.hypot(nx, ny, nz) || 1;
    if (out && nx * (a[0] + b[0] + c[0]) + ny * (a[1] + b[1] + c[1]) + nz * (a[2] + b[2] + c[2]) < 0) return tri(a, c, b, ca, cc, cb, sh);
    const f = sh ? .5 + .5 * ((nx * .36 + ny * .84 + nz * .4) / l * .5 + .5) : 1;
    P.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    C.push(ca[0] * f, ca[1] * f, ca[2] * f, cb[0] * f, cb[1] * f, cb[2] * f, cc[0] * f, cc[1] * f, cc[2] * f);
  };
  return {
    tri,
    geo() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
      g.computeVertexNormals();
      return g;
    }
  };
}
// Dönel gövde, yerel Z ekseni boyunca. pr = [[z, yarıçap, renk], ...] arkadan öne sıralanır (yüzler dışarı bakar);
// n kenar, M yerleştirme matrisi, inv ters sarım (dış çizgi kabuğu), a0 başlangıç açısı
function lathe(T, pr, n, M, sh, inv, a0 = 0) {
  const v = new THREE.Vector3();
  const pt = (k, i) => {
    const a = a0 + i / n * 6.28318;
    v.set(Math.cos(a) * pr[k][1], Math.sin(a) * pr[k][1], pr[k][0]);
    if (M) v.applyMatrix4(M);
    return [v.x, v.y, v.z];
  };
  for (let k = 0; k < pr.length - 1; k++) for (let i = 0; i < n; i++) {
    const a = pt(k, i), b = pt(k, i + 1), c = pt(k + 1, i + 1), d = pt(k + 1, i),
      c0 = pr[k][2], c1 = pr[k + 1][2];
    if (pr[k][1] > 0) inv ? T.tri(a, d, b, c0, c1, c0, sh) : T.tri(a, b, d, c0, c0, c1, sh);
    if (pr[k + 1][1] > 0) inv ? T.tri(b, d, c, c0, c1, c1, sh) : T.tri(b, c, d, c0, c1, c1, sh);
  }
}
// Düşman atışı gövdesi: parçalar + koyu dış çizgi kabuğu (ters sarımlı, şişirilmiş kopya; tek geometri, tek çizim).
// Koyu kenar atışı parlak zeminde de seçtirir ve oyuncunun açık renkli, kenarsız mermilerinden ayırır.
function shotGeo(parts, hc, e = .085) {
  const T = triGeo();
  for (const [pr, n, M, a0] of parts) {
    lathe(T, pr, n, M, 1, 0, a0);
    const L = pr.length - 1;
    lathe(T, pr.map(([z, r], k) => [z + (k == 0 ? -e * 1.6 : k == L ? e * 1.6 : 0), r > 0 ? r + e : 0, hc]), n, M, 0, 1, a0);
  }
  return T.geo();
}
function ebGeos() {
  const M4 = () => new THREE.Matrix4(),
    Zv = new THREE.Vector3(0, 0, 1),
    q = new THREE.Quaternion(),
    dir = (x, y, z) => M4().makeRotationFromQuaternion(q.setFromUnitVectors(Zv, new THREE.Vector3(x, y, z).normalize()));
  // kor diken: basık dört yüzlü mızrak ucu, ucu sıcak sarı, kuyruğu koyu kızıl
  const n = shotGeo([[[[-1.4, 0, C3(0x5a0a06)], [-.55, .13, C3(0xc01c0a)], [-.2, .36, C3(0xff3a12)], [.2, .27, C3(0xff7a1e)], [.9, 0, C3(0xffdc8a)]], 4, M4().makeScale(1.12, .78, 1), 0]], C3(0x2a0303));
  // buz kıymığı: altıgen kristal ve iki yan kıymık
  const ice = [[-1.05, 0, C3(0x1a3aa8)], [-.5, .2, C3(0x2468dc)], [.12, .31, C3(0x3fa4ff)], [.5, .23, C3(0x86d8ff)], [1.05, 0, C3(0xe4f8ff)]],
    side = s => M4().makeTranslation(s * .36, 0, -.3).multiply(M4().makeRotationY(s * .62)).multiply(M4().makeScale(.62, .62, .62));
  const i = shotGeo([[ice, 6, null, 0], [ice, 6, side(1), .5], [ice, 6, side(-1), .5]], C3(0x06123a));
  // güdümlü ruh yıldızı: açık çekirdek, altı uzun ve sekiz kısa mor diken
  const cr = C3(0xfbd8ff), md = C3(0xc058ff), tp = C3(0x6a22c0),
    long = [[.04, .22, cr], [.36, .13, md], [.78, 0, tp]],
    short = [[.06, .15, cr], [.5, 0, md]],
    parts = [[[[-.24, 0, cr], [0, .24, cr], [.24, 0, cr]], 4, null, .785]];
  for (const d of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) parts.push([long, 4, dir(...d), .785]);
  for (let k = 0; k < 8; k++) parts.push([short, 3, dir(k & 1 ? 1 : -1, k & 2 ? 1 : -1, k & 4 ? 1 : -1), 0]);
  const h = shotGeo(parts, C3(0x1a0632), .07);
  return { n, i, h };
}
// tür → parıltı (renk, boyut) ve iz parçacığı (sabit nesneler: kare başına bellek ayrılmaz)
const EBS = {
  n: { g: 0xff5a1e, gs: 1.7, tr: { n: 1, dir: [0, 0, 1], cone: .05, sp: [2.5, 4], life: [.18, .26], s: [.75, .95], s1: .45, c: 0xff7a2a, c1: 0x7a0c00 } },
  i: { g: 0x2f86ff, gs: 1.9, tr: { n: 1, dir: [0, 0, 1], cone: .05, sp: [2.5, 4], life: [.18, .26], s: [.75, .95], s1: .45, c: 0x7fc8ff, c1: 0x1040a0 } },
  h: { g: 0xb060ff, gs: 2.3, tr: { n: 1, sp: [0, .7], life: [.32, .48], s: [.46, .62], s1: .25, c: 0xc27aff, c1: 0x3a0e7a } }
};
// Düşman atışı: k = 'n' kor diken, 'i' buz kıymığı (dondurur), 'h' güdümlü ruh yıldızı. Geometri ve malzemeler ortaktır.
export function eShot(x, y, z, k) {
  const s = EBS[k] || EBS.n,
    m = mk(gEB[k] || gEB.n, mEB, x, y, z);
  m.rotation.order = 'YXZ';
  glow(s.g, s.gs, m, .5);
  return m;
}
// Her kare: atışı hızına çevirir (güdümlü yıldız yuvarlanır) ve kısa bir iz bırakır.
export function ebFx(b, dt) {
  const m = b.m,
    k = b.home ? 'h' : b.ice ? 'i' : 'n';
  if ($G.P.frz > 0) dt = 0;
  if (k == 'h') {
    m.rotation.x += dt * 3.1;
    m.rotation.y += dt * 4.3;
  } else {
    m.rotation.y = Math.atan2(b.vx, b.vz);
    m.rotation.x = b.gnd ? 0 : -Math.atan2(b.vy || 0, Math.hypot(b.vx, b.vz));
  }
  b.tr = (b.tr || 0) - dt;
  if (b.tr <= 0 && dt > 0) {
    b.tr = .04;
    // iz kuyruktan çıkar (yıldızda merkezden)
    const q = m.position,
      t = EBS[k].tr;
    if (k == 'h') VFX.emit(VFX.ADD, q.x, q.y, q.z, t);
    else {
      // uçuş yönünde uzayan kıvılcım çizgisi, kuyruktan çıkar
      const l = Math.hypot(b.vx, b.vz) || 1,
        d = t.dir;
      d[0] = b.vx / l;
      d[2] = b.vz / l;
      VFX.emit(VFX.SPK, q.x - d[0] * .9, q.y, q.z - d[2] * .9, t);
    }
  }
}

// ---- ganimet geometrileri ve malzemeleri
// 64 px matcap: sol üstten ışık, dar parlama, kenar ışığı. Sahne ışığından bağımsızdır (gece de okunur),
// en parlak değeri 1'i aşmaz; yani ışıma eşiğinin (BLOOM_TH) altında kalır, beyaza patlamaz.
function matcap(sh, mid, hi, spec, rim) {
  const N = 64,
    c = document.createElement('canvas');
  c.width = c.height = N;
  const x = c.getContext('2d');
  if (!x) return null;
  const im = x.createImageData(N, N),
    d = im.data,
    A = [sh, mid, hi, spec, rim].map(h => [h >> 16 & 255, h >> 8 & 255, h & 255]),
    mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t],
    ss = (a, b, v) => {
      const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
  for (let py = 0; py < N; py++) for (let px = 0; px < N; px++) {
    let nx = (px + .5) / N * 2 - 1,
      ny = 1 - (py + .5) / N * 2;
    const r = Math.hypot(nx, ny);
    if (r > 1) {
      nx /= r;
      ny /= r;
    }
    const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny)),
      dif = nx * -.44 + ny * .62 + nz * .65,
      sp = Math.pow(Math.max(0, nx * -.24 + ny * .34 + nz * .91), 26),
      t = ss(-.45, .9, dif);
    let col = t < .5 ? mix(A[0], A[1], t * 2) : mix(A[1], A[2], t * 2 - 1);
    col = mix(col, A[4], Math.pow(1 - nz, 2.5) * .6 * ss(-.6, .5, ny));
    col = mix(col, A[3], Math.min(1, sp * 1.15));
    const j = (py * N + px) * 4;
    d[j] = col[0];
    d[j + 1] = col[1];
    d[j + 2] = col[2];
    d[j + 3] = 255;
  }
  x.putImageData(im, 0, 0);
  const tx = new THREE.CanvasTexture(c);
  tx.colorSpace = THREE.SRGBColorSpace;
  return tx;
}
const lootMat = (...a) => new THREE.MeshMatcapMaterial({ matcap: matcap(...a), flatShading: true, vertexColors: true });
// tecrübe kristali: dik duran, hafif yatık, uzun altıgen çift piramit
function crystalGeo() {
  const T = triGeo(),
    M = new THREE.Matrix4().makeRotationZ(.2).multiply(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
  lathe(T, [[-.5, 0, [.72, .86, .92]], [-.08, .31, [.92, .98, 1]], [.14, .31, [1, 1, 1]], [.82, 0, [1, 1, 1]]], 6, M);
  return T.geo();
}
// sikke: kalın disk, kabarık kenar çemberi, iki yüzünde kabartma dört kollu yıldız. Ekseni Z'dir (dik durur, Y çevresinde döner).
function coinGeo() {
  const T = triGeo(),
    f = [.8, .8, .8], w = [1, 1, 1], e = [.9, .9, .9], st = [1, 1, 1], N = 16;
  lathe(T, [[-.05, 0, f], [-.05, .29, f], [-.09, .33, w], [-.09, .42, w], [-.05, .46, e], [.05, .46, e], [.09, .42, w], [.09, .33, w], [.05, .29, f], [.05, 0, f]], N);
  for (const s of [1, -1]) for (let i = 0; i < 8; i++) {
    const p = k => {
      const a = k / 8 * 6.28318, r = k & 1 ? .095 : .25;
      return [Math.cos(a) * r, Math.sin(a) * r, s * .05];
    };
    T.tri([0, 0, s * .1], p(i), p(i + 1), w, st, st, 0, 1);
  }
  return T.geo();
}
// can: yastık gibi kabarık, yontulmuş kalp. +Z öne bakar.
function heartGeo() {
  const T = triGeo(),
    N = 20, o = [],
    L = [[1, 0, [.86, .86, .86]], [.8, .14, [1, 1, 1]], [.42, .215, [1, 1, 1]]];
  for (let i = 0; i < N; i++) {
    const t = i / N * 6.28318, s = Math.sin(t);
    o.push([16 * s * s * s / 29, (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t) + 2.5) / 29]);
  }
  for (const sd of [1, -1]) for (let i = 0; i < N; i++) {
    const a = o[i], b = o[(i + 1) % N],
      p = (q, l) => [q[0] * l[0], q[1] * l[0], sd * l[1]];
    for (let k = 0; k < L.length - 1; k++) {
      T.tri(p(a, L[k]), p(b, L[k]), p(b, L[k + 1]), L[k][2], L[k][2], L[k + 1][2], 0, 1);
      T.tri(p(a, L[k]), p(b, L[k + 1]), p(a, L[k + 1]), L[k][2], L[k + 1][2], L[k + 1][2], 0, 1);
    }
    T.tri(p(a, L[2]), p(b, L[2]), [0, 0, sd * .235], L[2][2], L[2][2], L[2][2], 0, 1);
  }
  return T.geo();
}

export function __init_52() {
  shad = mk(new THREE.CircleGeometry(1, 16), new THREE.MeshBasicMaterial({
    color: 0,
    transparent: true,
    opacity: .3
  }), 0, 0, 0);
  shad.rotation.x = -Math.PI / 2;
  gBl = new THREE.SphereGeometry(.4, 8, 6);
  mBolt = BM(0xd6ecff);
  // düşman atışları: renk köşelerde, tek ışıksız malzeme
  mEB = new THREE.MeshBasicMaterial({ vertexColors: true });
  gEB = ebGeos();
  gXp = crystalGeo();
  gCoin = coinGeo();
  gHeart = heartGeo();
  // matcap(gölge, orta, açık, parlama, kenar ışığı)
  mGem = lootMat(0x147a78, 0x3fd6c0, 0xa8fff0, 0xffffff, 0xd8fff8);
  mGold = lootMat(0x7a4406, 0xe09a14, 0xffd24a, 0xfff6cc, 0xffe08a);
  mSilv = lootMat(0x4a5868, 0xa8b6c6, 0xe6eef6, 0xffffff, 0xf2f8ff);
  mHeal = lootMat(0x8a061c, 0xe6142c, 0xff4a5a, 0xffdfe4, 0xff8a98);
  mFire = BM(0xff7a1a);
  mZap = BM(0xbfe9ff);
  mIce = BM(0xbff2ff);
  gRing = new THREE.RingGeometry(.92, 1, 48);
  gCirc = new THREE.CircleGeometry(1, 16);
  gIce = new THREE.OctahedronGeometry(.4);
  FLM = BM(0xffffff);
  DN = [];
  tv = new THREE.Vector3();
}

export function dmgNum(q, d, r, ct) {
  if (DN.length > 28 || SET.dn == 0 && d > 0) return null;
  const el = document.createElement('div');
  el.className = ct ? 'dnum c' : 'dnum'; // 'dn' tamamlandı işaretiyle çakışıyordu
  el.textContent = String(Math.max(1, Math.round(d)));
  document.body.appendChild(el);
  DN.push({
    el,
    x: q.x + rn(-.6, .6),
    y: q.y + r * 2,
    z: q.z,
    l: .7
  });
  return el;
}

export function dnUpd(dt) {
  for (const n of DN) {
    n.l -= dt;
    n.y += dt * 3;
    tv.set(n.x, n.y, n.z).project(cam);
    n.el.style.left = (tv.x * .5 + .5) * innerWidth + 'px';
    n.el.style.top = (-tv.y * .5 + .5) * innerHeight + 'px';
    n.el.style.opacity = Math.min(1, n.l * 2.5);
    n.el.style.display = tv.z > 1 ? 'none' : 'block';
    if (n.l <= 0) n.el.remove();
  }
  for (let i = DN.length - 1; i >= 0; i--) if (DN[i].l <= 0) DN.splice(i, 1);
}

export function flash(e) {
  if (e.fl) return;
  e.fl = 1;
  if (e.u && e.u.inst) iskinFlash(e.u, 1);
  e.m.traverse(o => {
    if (o.isMesh && o.material !== TELM) {
      if (!o.userData.m0) o.userData.m0 = o.material;
      o.material = o.isSkinnedMesh ? FLMS : FLM;
    }
  });
}

export function unflash(e) {
  if (!e.fl) return;
  e.fl = 0;
  if (e.u && e.u.inst) iskinFlash(e.u, 0);
  e.m.traverse(o => {
    if (o.isMesh && o.userData.m0) o.material = o.userData.m0;
  });
}

export function ringFx(x, y, z, col, mx, s) {
  const o = mk(gRing, new THREE.MeshBasicMaterial({
    color: col,
    transparent: true,
    side: 2
  }), x, y, z);
  o.rotation.x = -Math.PI / 2;
  $G.FXR.push({
    m: o,
    r: .6,
    mx,
    s
  });
}

// ---- build hesapları
