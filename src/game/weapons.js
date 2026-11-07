// game/weapons.js · Kara Koru
// Bu dosya tek dosyalık sürümden (v22) otomatik ayrıldı. Ortak oyun durumu core/store.js içindeki $G nesnesinde.

import { $G } from '../core/store.js';
import { THREE } from '../engine/three.js';
import { sfx, sfxAt } from '../audio/engine.js';
import { kill, ownG } from '../core/helpers.js';
import { SET } from '../core/settings.js';
import { clamp, rn } from '../core/util.js';
import { BM, GW, VMAT, bx, gB, glow, mk, sc, sp } from '../engine/renderer.js';
import { VFX, gCirc, gIce, gRing, mBolt, mFire, mIce, puff, ringFx } from '../engine/vfx.js';
import { hurtE } from './enemies.js';
import { atkG } from './hero-anim.js';
import { gdm } from './stats.js';
import { mkSlash, mkVortex } from './weapon-fx.js';
import { groundAt, los, solidAt } from '../world/terrain.js';
import { inc } from '../data/content.js';
import { addStatus } from './status.js';
import { W2, fire2, w2Upd } from './weapons2.js';

export let tgt, mTrB, mTrI, mGlow, mBoltZ;

// ---- silahlar
export function weapons(dt, vm) {
  const C = $G.P.rage > 0 ? { ...$G.P.C, aspd: $G.P.C.aspd * 2 } : $G.P.C,
    dm = C.dmg * ($G.P.rage > 0 ? 1.5 : 1) * gdm();
  let orb = /** @type {any} */ (0),
    aura = /** @type {any} */ (0),
    iceR = 0;
  for (const w of $G.P.W) {
    const s = w.s;
    w.t -= dt;
    // boss ikincil silahları kapattıysa yalnızca ilk silah çalışır
    if ($G.P.wdis && $G.P.W.indexOf(w) >= $G.P.wdis) continue; // wdis: açık silah sayısı (final evreleri)
    if (w.off) continue;
    if (W2.has(w.k)) {
      fire2(w, s, C, dm, dt, vm);
      continue;
    }
    if (w.k == 'ice') {
      // Ayaz: oyuncu çevresinde buz aurası; vurduğunu yavaşlatır, bir süre sonra dondurur
      const R = 4.1 * (s.sz || 1) * C.size;
      iceR = R;
      if (w.t <= 0) {
        w.t = s.cd / C.aspd;
        let any = 0;
        for (const e of $G.E) {
          const p = e.m.position;
          if (e.dead || Math.hypot(p.x - $G.P.x, p.z - $G.P.z) >= R + e.r * .5 || Math.abs(p.y + e.r - $G.P.y) > 4) continue;
          hurtE(e, s.dmg * dm, 0, { el: 'ice', w: 'ice', wc: s.crit || 0, wcd: s.critd || 0 });
          e.slow = Math.max(e.slow, s.dur * C.dur);
          e.iceN = (e.iceN || 0) + 1;
          if (e.iceN >= 3 && !e.dead) {
            e.iceN = 0;
            addStatus(e, 'frz', { t: .9 * s.dur * C.dur * .5 });
          }
          any = 1;
        }
        if (any) sfx('ice');
        ringFx($G.P.x, $G.P.y - .6, $G.P.z, 0xbff2ff, R, 10);
      }
      continue;
    }
    if ((w.k == 'bolt' || w.k == 'ice') && w.t <= 0) {
      const ice = w.k == 'ice',
        n = s.cnt + C.cnt,
        RG = ice ? 24 : 26,
        ts = tgts(RG, n);
      if (ts.length) {
        w.t = s.cd / C.aspd;
        const sz = Math.sqrt(C.size),
          v = (ice ? 40 : 52) * C.pspd;
        for (let i = 0; i < n; i++) {
          const t = ts[i % ts.length],
            q = t.m.position,
            ox = $G.P.x,
            oy = $G.P.y + .6,
            oz = $G.P.z;
          let dx = q.x - ox,
            dy = q.y + t.r - oy,
            dz = q.z - oz;
          const L2 = Math.hypot(dx, dy, dz) || 1;
          dx /= L2;
          dy /= L2;
          dz /= L2;
          if (i >= ts.length) {
            const k = i - ts.length,
              an = (k % 2 ? 1 : -1) * (.12 + .1 * Math.floor(k / 2)),
              c = Math.cos(an),
              sn = Math.sin(an),
              nx = dx * c + dz * sn;
            dz = -dx * sn + dz * c;
            dx = nx;
          }
          const b = mkShot(ice, sz);
          b.position.set(ox, oy, oz);
          b.lookAt(ox + dx, oy + dy, oz + dz);
          $G.B.push({
            m: b,
            vx: dx * v,
            vy: dy * v,
            vz: dz * v,
            l: (RG + 8) / v,
            d: s.dmg * dm,
            p: s.prc || 0,
            hit: new Set(),
            r: .7 * sz,
            ice: ice ? s.dur * C.dur : 0,
            o: { w: w.k, wc: s.crit || 0, wcd: s.critd || 0 }
          });
        }
        sfx(ice ? 'ice' : 'shoot');
        atkG();
      }
    }
    if (w.k == 'orbit') orb = {
      n: s.cnt + C.cnt,
      R: 3.8 * s.sz * C.size,
      sp: 2.6 * s.spd,
      d: s.dmg * dm,
      sc: Math.sqrt(s.sz * C.size)
    };
    if (w.k == 'aura') {
      aura = {
        R: 4.2 * s.sz * C.size
      };
      if (w.t <= 0) {
        w.t = s.cd / C.aspd;
        for (const e of $G.E) {
          const p = e.m.position;
          if (!e.dead && Math.hypot(p.x - $G.P.x, p.z - $G.P.z) < aura.R + e.r * .5 && Math.abs(p.y + e.r - $G.P.y) < 4) hurtE(e, s.dmg * dm, 0, { w: 'aura' });
        }
      }
    }
    if (w.k == 'nova' && w.t <= 0) {
      w.t = s.cd / C.aspd;
      const o = mk(gRing, new THREE.MeshBasicMaterial({
        color: 0xa8e3d6,
        transparent: true,
        side: 2
      }), $G.P.x, $G.P.y - .6, $G.P.z);
      o.rotation.x = -Math.PI / 2;
      $G.NV.push({
        m: o,
        r: 1,
        mx: 12 * s.sz * C.size,
        h: new Set(),
        d: s.dmg * dm,
        kb: 4 * s.kb * C.kb
      });
      sfx('nova');
      VFX.emit(VFX.ADD, $G.P.x, $G.P.y - .6, $G.P.z, {
        n: 34,
        sp: [20, 26],
        flat: .02,
        life: [.3, .5],
        s: [.5, .8],
        s1: .2,
        c: 0xa8e3d6,
        d: 2
      });
      atkG();
    }
    if (w.k == 'zap' && w.t <= 0) {
      // ilk hedef menzildeki en yakın 8 aday arasından rastgele: hep en yakına düşünce öbür silahların zaten
      // öldürdüğü düşmana boşa çarpıyordu (açıklama da "rastgele düşmanlar" diyor)
      const cs = tgts(22, 8),
        f = cs.length ? cs[Math.floor(Math.random() * cs.length)] : null;
      if (f) {
        w.t = s.cd / C.aspd;
        const n = s.cnt + C.cnt,
          hit = [f];
        let cur = f;
        while (hit.length < n) {
          let bn = null,
            bd = 72;
          const b0 = cur.m.position;
          for (const e of $G.E) {
            if (e.dead || hit.includes(e)) continue;
            const a = e.m.position,
              d = (a.x - b0.x) ** 2 + (a.z - b0.z) ** 2;
            if (d < bd) {
              bd = d;
              bn = e;
            }
          }
          if (!bn) break;
          hit.push(bn);
          cur = bn;
        }
        const q0 = f.m.position;
        bolt3(q0.x + rn(-3, 3), q0.y + 18, q0.z + rn(-3, 3), q0.x, q0.y + f.r, q0.z, 7, .32);
        for (let i = 1; i < hit.length; i++) {
          const a = hit[i - 1].m.position,
            b = hit[i].m.position;
          bolt3(a.x, a.y + hit[i - 1].r, a.z, b.x, b.y + hit[i].r, b.z, 4, .2);
        }
        // her çarpma noktasında küçük bir boşalma: zincirde olmayan yakındakiler %60 hasar alır (Boyut alanı büyütür)
        const SR = 2.3 * Math.sqrt(C.size),
          spl = new Set();
        for (const e of hit) {
          const q = e.m.position;
          VFX.zap(q.x, q.y + 1, q.z);
          for (const o of $G.E) {
            if (o.dead || o === e || hit.includes(o) || spl.has(o)) continue;
            const p = o.m.position;
            if (Math.hypot(p.x - q.x, p.z - q.z) < SR + o.r * .5 && Math.abs(p.y - q.y) < 3) spl.add(o);
          }
          hurtE(e, s.dmg * dm, 0, { el: 'zap', w: 'zap' });
        }
        for (const o of spl) hurtE(o, s.dmg * dm * .6, 0, { el: 'zap', w: 'zap' });
        sfx('zap');
        atkG();
      }
    }
    if (w.k == 'fire' && w.t <= 0) {
      const ts = tgts(28, s.cnt + C.cnt);
      if (ts.length) {
        w.t = s.cd / C.aspd;
        for (const t of ts) {
          const q = t.m.position,
            ox = $G.P.x,
            oy = $G.P.y + .8,
            oz = $G.P.z,
            dx = q.x - ox,
            dy = q.y + t.r - oy,
            dz = q.z - oz,
            L3 = Math.hypot(dx, dy, dz) || 1,
            m = mkFire();
          m.position.set(ox, oy, oz);
          $G.FB.push({
            m,
            vx: dx / L3 * 30,
            vy: dy / L3 * 30,
            vz: dz / L3 * 30,
            l: 34 / 30,
            R: 5 * s.sz * C.size,
            d: s.dmg * dm,
            w: 'fire'
          });
        }
        sfx('fire');
        atkG();
      }
    }
    if (w.k == 'slash' && w.t <= 0) {
      const sz = s.sz * C.size,
        Rr = 4.2 * sz,
        t = tgt(Rr + 2.5);
      if (t) {
        w.t = s.cd / C.aspd;
        const q = t.m.position,
          base = Math.atan2(q.x - $G.P.x, q.z - $G.P.z),
          n = s.cnt + C.cnt;
        for (let i = 0; i < n; i++) {
          const a = base + (i % 2 ? Math.PI : 0) + Math.floor(i / 2) * (i % 4 < 2 ? .75 : -.75);
          const sl = mkSlash(a, Rr, s.dmg * dm, -i * .09, i % 2 ? -1 : 1);
          sl.o = { w: 'slash', kb: (s.kb || 1) * C.kb };
          $G.SLS.push(sl);
        }
        sfx('swish');
        atkG();
      }
    }
    if (w.k == 'vortex' && w.t <= 0) {
      const sz = s.sz * C.size,
        Rr = 3.4 * sz;
      let bp = null,
        bc = 0;
      for (const c of tgts(26, 12)) {
        const p = c.m.position;
        let n = 0;
        for (const e of $G.E) {
          if (e.dead) continue;
          const q = e.m.position;
          if ((q.x - p.x) ** 2 + (q.z - p.z) ** 2 < Rr * Rr * 2.2) n++;
        }
        if (n > bc) {
          bc = n;
          bp = p;
        }
      }
      if (bp) {
        w.t = s.cd / C.aspd;
        $G.VXS.push(mkVortex(bp.x, bp.z, Rr, s.dmg * dm, s.dur * C.dur));
        sfxAt('vortex', bp.x, bp.z);
        atkG();
      }
    }
    if (w.k == 'poi' && trailDrop(w, 2.2 * s.sz * C.size)) {
      const o = mk(gCirc, new THREE.MeshBasicMaterial({
        color: 0x7fae4a,
        transparent: true,
        opacity: .35
      }), $G.P.x, groundAt($G.P.x, $G.P.z, $G.P.y - 1) + .15, $G.P.z);
      o.rotation.x = -Math.PI / 2;
      o.scale.setScalar(2.2 * s.sz * C.size);
      $G.PZ.push({
        m: o,
        l: s.dur * C.dur,
        t: 0,
        d: s.dmg * dm,
        el: 'poison',
        w: 'poi',
        poi: 1,
        pd: .8, // iz tik başına bir kez vurduğu için yığın daha sert (koşarken eski hasarı korur)
        tr: 1,
        c: 0x9fd05a
      });
    }
    if (w.k == 'axe' && w.t <= 0) {
      const n = s.cnt + C.cnt,
        ts = tgts(20, n),
        sz = s.sz * C.size;
      if (ts.length) w.t = s.cd / C.aspd;
      for (let i = 0; i < n && ts.length; i++) {
        const t = ts[i % ts.length],
          q = t.m.position,
          dd = Math.hypot(q.x - $G.P.x, q.z - $G.P.z),
          a = Math.atan2(q.x - $G.P.x, q.z - $G.P.z) + (i >= ts.length ? (i - ts.length) % 2 ? .35 : -.35 : 0),
          vh = clamp(dd / .73, 6, 26),
          g = new THREE.Group();
        mk(GW.axe(), VMAT, 0, 0, 0, g).scale.setScalar(sz);
        g.position.set($G.P.x, $G.P.y + .8, $G.P.z);
        g.rotation.y = a;
        sc.add(g);
        $G.AX.push({
          m: g,
          vx: Math.sin(a) * vh,
          vz: Math.cos(a) * vh,
          vy: 11,
          l: 2.6,
          d: s.dmg * dm,
          hit: new Set(),
          r: 1.3 * Math.sqrt(sz),
          w: 'axe'
        });
      }
      if (ts.length) {
        sfx('throw');
        atkG();
      }
    }
    if (w.k == 'boom' && w.t <= 0) {
      const sz = s.sz * C.size,
        t = tgt(14 * sz + 2);
      if (t) {
        w.t = s.cd / C.aspd;
        const n = s.cnt + C.cnt,
          base = Math.atan2(t.m.position.x - $G.P.x, t.m.position.z - $G.P.z);
        for (let i = 0; i < n; i++) {
          const a = base + (i - (n - 1) / 2) * .5,
            g = new THREE.Group();
          mk(GW.boom(), VMAT, 0, 0, 0, g);
          g.scale.setScalar(Math.sqrt(sz));
          g.position.set($G.P.x, $G.P.y + .4, $G.P.z);
          sc.add(g);
          $G.BO.push({
            m: g,
            dx: Math.sin(a),
            dz: Math.cos(a),
            tr: 0,
            R: 14 * sz,
            out: 1,
            d: s.dmg * dm,
            hit: new Set(),
            r: 1.3 * Math.sqrt(sz),
            w: 'boom'
          });
        }
        sfx('throw');
        atkG();
      }
    }
  }
  const on = orb ? orb.n : 0;
  while ($G.OB.length < on) {
    const g = new THREE.Group();
    mk(GW.sword(), VMAT, 0, 0, 0, g);
    sc.add(g);
    $G.OB.push({
      m: g
    });
  }
  while ($G.OB.length > on) sc.remove($G.OB.pop().m);
  if (orb) {
    // Yörünge 3 sn'lik bir nefesle içe çekilip açılır (R × 0.45 ↔ R). Sabit yarıçapta dibe sokulan düşman kılıçların
    // iç tarafında kalıyor, hiç kesilmiyordu; Boyut büyüdükçe bu boşluk da büyüyordu.
    const a0 = $G.P.oa,
      da = orb.sp * dt;
    $G.P.oa += da;
    $G.P.ob = (($G.P.ob || 0) + dt) % 3;
    const Rr = orb.R * (.725 + .275 * Math.cos($G.P.ob / 3 * 6.283)),
      // kılıç yörüngeye teğet uzanır (rotation.y = −a, model yerel Z boyunca): sap dönüşün arkasında, uç önünde
      bk = 1.2 * orb.sc / Math.max(Rr, 1),
      fw = 1.15 * orb.sc / Math.max(Rr, 1);
    $G.OB.forEach((o, i) => {
      const off = i * 6.283 / on,
        a = $G.P.oa + off,
        x = $G.P.x + Math.cos(a) * Rr,
        z = $G.P.z + Math.sin(a) * Rr;
      o.m.position.set(x, $G.P.y, z);
      o.m.rotation.y = -a;
      o.m.scale.setScalar(orb.sc);
      if (Math.random() < .7) VFX.trail(x, $G.P.y, z, 0xdfe8ff, .5 * orb.sc, .16);
      // süpürme testi: bu karede kılıcın (saptan uca) taradığı açı dilimine giren düşman kesilir (hızlı dönüşte araya düşen kaçmaz).
      // Her kılıç kendi isabet kaydını tutar; eskiden düşman başına tek bekleme vardı, ikinci kılıç aynı düşmana değemiyordu.
      const h = o.h || (o.h = new Map()),
        s0 = a0 + off;
      for (const e of $G.E) {
        if (e.dead) continue;
        const p = e.m.position,
          ex = p.x - $G.P.x,
          ez = p.z - $G.P.z,
          er = Math.hypot(ex, ez);
        if (Math.abs(er - Rr) > e.r + .35 * orb.sc || Math.abs(p.y + e.r - $G.P.y) > e.r + 1.6) continue;
        const me = e.r / Math.max(er, 1),
          rel = ((Math.atan2(ez, ex) - s0 + bk + me) % 6.283 + 6.283) % 6.283;
        if (rel > da + bk + fw + 2 * me) continue;
        const t = h.get(e);
        if (t != null && $G.P.tt < t) continue;
        h.set(e, $G.P.tt + .3);
        hurtE(e, orb.d, 0, { w: 'orbit' });
        sfxAt('shing', p.x, p.z);
      }
      if (h.size > 120) for (const [e] of h) if (e.dead) h.delete(e);
    });
  }
  if (aura) {
    if (!$G.AUm) {
      $G.AUm = new THREE.Group();
      const r1 = mk(ownG(new THREE.RingGeometry(.15, 1, 40)), new THREE.MeshBasicMaterial({
        color: 0xff7a2a,
        transparent: true,
        opacity: .16,
        side: 2
      }), 0, 0, 0, $G.AUm);
      r1.rotation.x = -Math.PI / 2;
      const r2 = mk(ownG(new THREE.RingGeometry(.94, 1, 40)), new THREE.MeshBasicMaterial({
        color: 0xffa04a,
        transparent: true,
        opacity: .6,
        side: 2
      }), 0, .02, 0, $G.AUm);
      r2.rotation.x = -Math.PI / 2;
      sc.add($G.AUm);
    }
    $G.AUm.visible = true;
    $G.AUm.position.set($G.P.x, groundAt($G.P.x, $G.P.z, $G.P.y - 1) + .12, $G.P.z);
    if (Math.random() < .7) {
      const a = Math.random() * 6.283,
        rr = Math.sqrt(Math.random()) * aura.R;
      VFX.emit(VFX.ADD, $G.P.x + Math.cos(a) * rr, $G.AUm.position.y + .2, $G.P.z + Math.sin(a) * rr, {
        n: 1,
        sp: [0, .2],
        up: 2,
        upr: 1.5,
        life: [.5, .9],
        s: [.15, .3],
        s1: .1,
        c: 0xff8a3a
      });
    }
    $G.AUm.scale.set(aura.R, 1, aura.R);
    $G.AUm.rotation.y += dt * .8;
  } else if ($G.AUm) $G.AUm.visible = false;
  // Ayaz: menzil vuruşlar arasında da okunsun diye soluk, kalıcı bir halka (Kor Halkası'nınki gibi, daha silik)
  if (iceR) {
    if (!$G.ICm) {
      $G.ICm = new THREE.Group();
      const r1 = mk(gCirc, new THREE.MeshBasicMaterial({ color: 0xbff2ff, transparent: true, opacity: .05, depthWrite: false }), 0, 0, 0, $G.ICm);
      r1.rotation.x = -Math.PI / 2;
      const r2 = mk(gRing, new THREE.MeshBasicMaterial({ color: 0xbff2ff, transparent: true, opacity: .26, side: 2, depthWrite: false }), 0, .02, 0, $G.ICm);
      r2.rotation.x = -Math.PI / 2;
      sc.add($G.ICm);
    }
    $G.ICm.visible = true;
    $G.ICm.position.set($G.P.x, groundAt($G.P.x, $G.P.z, $G.P.y - 1) + .12, $G.P.z);
    $G.ICm.scale.set(iceR, 1, iceR);
  } else if ($G.ICm) $G.ICm.visible = false;
  for (const b of $G.B) {
    const q = b.m.position,
      ns = Math.max(1, Math.ceil(Math.hypot(b.vx, b.vy, b.vz) * dt / .9));
    b.l -= dt;
    VFX.trail(q.x, q.y, q.z, b.ice ? 0xbff2ff : 0x9fe8d8, .6 * Math.sqrt(b.r / .7), .22);
    for (let k = 0; k < ns && b.l > 0; k++) {
      q.x += b.vx * dt / ns;
      q.y += b.vy * dt / ns;
      q.z += b.vz * dt / ns;
      for (const e of $G.E) {
        if (b.l <= 0 || e.dead || b.hit.has(e)) continue;
        const p = e.m.position;
        if (Math.hypot(p.x - q.x, p.y + e.r - q.y, p.z - q.z) < e.r + b.r) {
          b.hit.add(e);
          if (b.ice) {
            e.slow = b.ice;
            VFX.ice(q.x, q.y, q.z);
          }
          hurtE(e, b.d, 0, { ...(b.o || {}), el: b.ice ? 'ice' : null });
          if (b.p-- > 0) continue;
          b.l = 0;
        }
      }
      if (b.l > 0 && solidAt(q.x, q.y, q.z)) {
        b.l = 0;
        puff(q.x, q.y, q.z, 0x8a8070, 5);
      }
    }
    if (b.l <= 0) sc.remove(b.m);
  }
  $G.B = $G.B.filter(b => b.l > 0);
  for (const a of $G.AX) {
    const q = a.m.position;
    a.vy -= 30 * dt;
    if (Math.random() < .6) VFX.trail(q.x, q.y, q.z, 0xd8d0c0, .45, .14);
    q.x += a.vx * dt;
    q.y += a.vy * dt;
    q.z += a.vz * dt;
    a.m.rotation.x += 14 * dt;
    a.l -= dt;
    for (const e of $G.E) {
      if (e.dead || a.hit.has(e)) continue;
      const p = e.m.position;
      if (Math.hypot(p.x - q.x, p.y + e.r - q.y, p.z - q.z) < e.r + a.r) {
        a.hit.add(e);
        hurtE(e, a.d, 0, { w: 'axe' });
      }
    }
    if (a.l > 0 && a.vy < 0 && solidAt(q.x, q.y - .3, q.z)) {
      a.l = 0;
      puff(q.x, q.y, q.z, 0x8a7a5a, 8);
      sfx('pot');
    }
    if (a.l <= 0) sc.remove(a.m);
  }
  $G.AX = $G.AX.filter(a => a.l > 0);
  for (const b of $G.BO) {
    const q = b.m.position;
    b.m.rotation.y += 16 * dt;
    if (Math.random() < .6) VFX.trail(q.x, q.y, q.z, 0xe8dcc0, .5, .14);
    if (b.out) {
      const st = 30 * dt;
      q.x += b.dx * st;
      q.z += b.dz * st;
      q.y += ($G.P.y + .4 - q.y) * Math.min(1, dt * 4);
      b.tr += st;
      if (b.tr >= b.R || solidAt(q.x, q.y, q.z)) {
        if (b.tr < b.R) puff(q.x, q.y, q.z, 0x8a8070, 4);
        b.out = 0;
        b.hit = new Set();
      }
    } else {
      const dx = $G.P.x - q.x,
        dz = $G.P.z - q.z,
        dy = $G.P.y + .4 - q.y,
        d = Math.hypot(dx, dz) || 1,
        st = 34 * dt;
      q.x += dx / d * st;
      q.z += dz / d * st;
      q.y += dy * Math.min(1, dt * 6);
      if (d < 1.6) b.done = 1;
    }
    for (const e of $G.E) {
      if (e.dead || b.hit.has(e)) continue;
      const p = e.m.position;
      if (Math.hypot(p.x - q.x, p.y + e.r - q.y, p.z - q.z) < e.r + b.r) {
        b.hit.add(e);
        hurtE(e, b.d, 0, { w: 'boom' });
      }
    }
    if (b.done) sc.remove(b.m);
  }
  $G.BO = $G.BO.filter(b => !b.done);
  for (const n of $G.NV) {
    n.r += 40 * dt;
    n.m.scale.setScalar(n.r);
    n.m.material.opacity = Math.max(0, 1 - n.r / n.mx);
    const x = n.m.position.x,
      z = n.m.position.z;
    for (const e of $G.E) {
      const p = e.m.position;
      if (!e.dead && !n.h.has(e) && Math.hypot(p.x - x, p.z - z) < n.r + e.r) {
        n.h.add(e);
        hurtE(e, n.d, 0, { w: n.w || 'nova' }); // Kalkan dalgası 'aegis' etiketi taşır (Şaman Maskesi görevi buna bakar)
        if (e.t != 3) {
          const a = Math.atan2(p.z - z, p.x - x);
          p.x += Math.cos(a) * n.kb;
          p.z += Math.sin(a) * n.kb;
        }
      }
    }
    for (const b of $G.EB) if (Math.hypot(b.m.position.x - x, b.m.position.z - z) < n.r) b.l = 0;
    if (n.r >= n.mx) kill(n.m);
  }
  $G.NV = $G.NV.filter(n => n.r < n.mx);
  for (const f of $G.FB) {
    const q = f.m.position,
      ns = Math.max(1, Math.ceil(30 * dt / .9));
    f.l -= dt;
    for (let k = 0; k < ns && f.l > 0; k++) {
      q.x += f.vx * dt / ns;
      q.y += f.vy * dt / ns;
      q.z += f.vz * dt / ns;
      if (solidAt(q.x, q.y, q.z)) f.l = 0;else for (const e of $G.E) {
        const p = e.m.position;
        if (!e.dead && Math.hypot(p.x - q.x, p.y + e.r - q.y, p.z - q.z) < e.r + .6) {
          f.l = 0;
          break;
        }
      }
    }
    f.m.scale.setScalar(.9 + Math.sin($G.T * 30) * .12);
    VFX.emit(VFX.ADD, q.x, q.y, q.z, {
      n: 2,
      sp: [0, 1.5],
      up: 1,
      life: [.22, .38],
      s: [.55, .85],
      s1: .2,
      c: 0xffb040,
      c1: 0x601004
    });
    if (Math.random() < .3) VFX.emit(VFX.ALP, q.x, q.y, q.z, {
      n: 1,
      sp: [0, .5],
      up: 1.4,
      life: [.5, .8],
      s: [.3, .5],
      s1: 2,
      c: 0x3a3430,
      g: -1
    });
    if (f.l <= 0) {
      for (const e of $G.E) {
        const p = e.m.position;
        if (!e.dead && Math.hypot(p.x - q.x, p.z - q.z) < f.R + e.r) hurtE(e, f.d, 0, { el: 'fire', w: f.w });
      }
      VFX.boom(q.x, q.y, q.z, f.R);
      ringFx(q.x, q.y - .5, q.z, 0xff7a1a, f.R, 30);
      $G.shk = Math.max($G.shk, .2);
      sfxAt('boom', q.x, q.z);
      sc.remove(f.m);
    }
  }
  $G.FB = $G.FB.filter(f => f.l > 0);
  for (const z of $G.PZ) {
    z.l -= dt;
    z.t -= dt;
    if (Math.random() < .35) {
      const q = z.m.position;
      VFX.bubble(q.x, q.y, q.z, z.c || 0x9fd05a, z.m.scale.x);
    }
    z.m.material.opacity = Math.min(.35, z.l * .25);
    if (z.t <= 0) {
      z.t = .3;
      const q = z.m.position,
        r = z.m.scale.x,
        gk = 'pz_' + z.w;
      for (const e of $G.E) {
        const p = e.m.position;
        if (!e.dead && Math.hypot(p.x - q.x, p.z - q.z) < r + e.r * .5) {
          // iz silahının (tr) üst üste binen gölcükleri tik başına bir kez vurur: hasar koşma hızına ve iz sıklığına bağlı kalmasın
          if (z.tr) {
            if (e[gk] > $G.P.tt) continue;
            e[gk] = $G.P.tt + .28;
          }
          hurtE(e, z.d, 1, { el: z.el || 'poison', w: z.w, num: 1 });
          if (!e.dead && z.poi) addStatus(e, 'poi', { n: 1, d: Math.max(.5, z.d * (z.pd || .4)), t: 3 }); // pd: yığın başına hasar oranı
          if (!e.dead && z.burn && Math.random() < .3) addStatus(e, 'burn', { d: Math.max(2, z.d) });
        }
      }
    }
    if (z.l <= 0) kill(z.m);
  }
  $G.PZ = $G.PZ.filter(z => z.l > 0);
  for (const z of $G.ZP) {
    z.l -= dt;
    if (z.l <= 0) sc.remove(z.m);
  }
  $G.ZP = $G.ZP.filter(z => z.l > 0);
  w2Upd(dt);
}

// İz silahları (Zehir İzi, Kor İzi): koşarken iz yarıçapı kadar yol aldıkça bir gölcük, dururken ayağının dibine
// 1 sn'de bir. Eskiden 0.4 sn'de bir düşüyordu ve yalnız koşarken: dururken silah hiç çalışmıyor, hız değişince iz delik deşik oluyordu.
export function trailDrop(w, R) {
  const P = $G.P,
    dd = w.lx == null ? 1e9 : Math.hypot(P.x - w.lx, P.z - w.lz);
  if (dd < R && w.t > -1) return false;
  w.lx = P.x;
  w.lz = P.z;
  w.t = 0;
  return true;
}

export function tgts(range, n) {
  const ax = $G.P.x,
    ay = $G.P.y + .6,
    az = $G.P.z,
    fx = -Math.sin($G.yaw),
    fz = -Math.cos($G.yaw),
    c = [];
  for (const e of $G.E) {
    if (e.dead) continue;
    const q = e.m.position,
      dx = q.x - ax,
      dz = q.z - az,
      d = Math.hypot(dx, dz);
    if (d > range + e.r) continue;
    let s = d;
    if (SET.aim == 1 && d > 3) s = d * (1.55 - .55 * (dx * fx + dz * fz) / d);
    if (SET.rtw > 0) s *= 1 + SET.rtw * Math.random() * 2;
    c.push([s, e]);
  }
  c.sort((a, b) => a[0] - b[0]);
  const out = [];
  for (let i = 0; i < c.length && out.length < n && i < 14; i++) {
    const e = c[i][1],
      q = e.m.position;
    if (los(ax, ay, az, q.x, q.y + e.r, q.z)) out.push(e);
  }
  return out;
}

export function __init_65() {
  tgt = r => tgts(r, 1)[0] || null;
  mTrB = new THREE.MeshBasicMaterial({
    color: 0x9fe8d8,
    transparent: true,
    opacity: .45
  });
  mTrI = new THREE.MeshBasicMaterial({
    color: 0xbff2ff,
    transparent: true,
    opacity: .4
  });
  mGlow = new THREE.MeshBasicMaterial({
    color: 0xff9a3a,
    transparent: true,
    opacity: .35
  });
  mBoltZ = BM(0xe6f6ff);
}

export function mkShot(ice, sz) {
  inc('shots');
  const g = new THREE.Group();
  glow(ice ? 0xbff2ff : 0x9fe8d8, 1.8 * sz, g, .7);
  if (ice) {
    const c = mk(gIce, mIce, 0, 0, 0, g);
    c.scale.set(.32 * sz, .32 * sz, 1.5 * sz);
    bx(mTrI, .1 * sz, .1 * sz, 1.8 * sz, 0, 0, -1.4 * sz, g);
  } else {
    const c = mk(gIce, mBolt, 0, 0, 0, g);
    c.scale.set(.24 * sz, .24 * sz, 1.1 * sz);
    bx(mTrB, .12 * sz, .12 * sz, 2.4 * sz, 0, 0, -1.5 * sz, g);
  }
  sc.add(g);
  return g;
}

export function mkFire() {
  const g = new THREE.Group();
  sp(mFire, .42, 0, 0, 0, g);
  sp(mGlow, .8, 0, 0, 0, g);
  glow(0xff8a3a, 3.4, g, .8);
  sc.add(g);
  return g;
}

export function bolt3(ax, ay, az, bx2, by, bz, n, w) {
  let px = ax,
    py = ay,
    pz = az;
  for (let i = 1; i <= n; i++) {
    const f = i / n,
      j = i < n ? 1 : 0,
      x = ax + (bx2 - ax) * f + rn(-.9, .9) * j,
      y = ay + (by - ay) * f + rn(-.5, .5) * j,
      z = az + (bz - az) * f + rn(-.9, .9) * j,
      len = Math.hypot(x - px, y - py, z - pz) || .01,
      m = mk(gB, mBoltZ, (px + x) / 2, (py + y) / 2, (pz + z) / 2);
    m.lookAt(x, y, z);
    m.scale.set(w, w, len);
    $G.ZP.push({
      m,
      l: .26
    });
    px = x;
    py = y;
    pz = z;
  }
}

export function near(r) {
  let b = null,
    bd = r * r;
  for (const e of $G.E) {
    const q = e.m.position,
      d = (q.x - $G.P.x) ** 2 + (q.z - $G.P.z) ** 2;
    if (!e.dead && d < bd) {
      bd = d;
      b = e;
    }
  }
  return b;
}

// ---- çöl hortumları: oyuncuyu havaya fırlatır, düşmanları savurur
