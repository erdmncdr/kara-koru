// game/weapons2.js · Kara Koru
// Faz 2 silahları. weapons() bilmediği anahtarları fire2'ye verir; w2Upd genel mermi (B2) ve
// bölge (ZN2) listelerini işler. Yeni silah eklerken: data/content.js içine WD satırı, buraya
// fire2 içinde bir dal. Mermiler mkProj ile üretilir ve bayraklarla davranış kazanır:
//   home hedefe yönelir · bnc sekme · prc delme · exec infaz · bm kan büyüsü · boomR patlama
//   decay mesafeyle zayıflar · grav yerçekimi, yere düşünce zone üretir · el element · w silah anahtarı

import { $G } from '../core/store.js';
import { THREE } from '../engine/three.js';
import { sfx, sfxAt } from '../audio/engine.js';
import { kill, toast } from '../core/helpers.js';
import { SET } from '../core/settings.js';
import { rn } from '../core/util.js';
import { BM, BMc, glow, mk, sc, sp } from '../engine/renderer.js';
import { VFX, gCirc, gRing, puff, ringFx } from '../engine/vfx.js';
import { inc } from '../data/content.js';
import { hurtE, killE } from './enemies.js';
import { atkG } from './hero-anim.js';
import { calc } from './stats.js';
import { addStatus } from './status.js';
import { mkSlash } from './weapon-fx.js';
import { bolt3, near, tgt, tgts, trailDrop } from './weapons.js';
import { groundAt, los, solidAt } from '../world/terrain.js';

// Cellat Palası'nın boss ve ara bossta infaz tutma şansı (mermi başına)
export const EXEC_BOSS = .02;
export const W2 = new Set(['bone', 'rifle', 'aegis', 'rocket', 'tornado', 'dexe', 'sniper', 'noodle', 'dragon', 'mines', 'flask', 'katana', 'blood', 'dagger', 'dice', 'hero', 'corrupt', 'shotgun', 'scythe', 'korizi']);
const MATS = {};
let gTorW = null, gMine = null, mMineRing = null;

function pm(c) {
  return MATS[c] || (MATS[c] = BM(c));
}

// Genel mermi. o: { c renk, sz boyut, long uzun mermi }
export function mkProj(x, y, z, o, b) {
  const g = new THREE.Group(),
    s = o.sz || 1;
  if (o.long) {
    const m = mk(new THREE.BoxGeometry(.16, .16, 1.3), pm(o.c), 0, 0, 0, g);
    m.scale.setScalar(s);
    m.geometry.userData.own = 1;
  } else sp(pm(o.c), .3 * s, 0, 0, 0, g);
  glow(o.c, 1.6 * s, g, .65);
  g.position.set(x, y, z);
  sc.add(g);
  b.m = g;
  b.hit = b.hit || new Set();
  b.r = b.r || .7 * s;
  b.c = o.c;
  if ($G.P.C.bounce > 0 && !b.zone) b.bnc = (b.bnc || 0) + Math.round($G.P.C.bounce); // 'Sekme' statı
  $G.B2.push(b);
  inc('shots');
  return b;
}

function dirTo(t) {
  const q = t.m.position,
    dx = q.x - $G.P.x,
    dy = q.y + t.r - ($G.P.y + .6),
    dz = q.z - $G.P.z,
    L = Math.hypot(dx, dy, dz) || 1;
  return [dx / L, dy / L, dz / L];
}

function facing() {
  return [-Math.sin($G.yaw), 0, -Math.cos($G.yaw)];
}

function rotY(v, a) {
  const c = Math.cos(a),
    s = Math.sin(a);
  return [v[0] * c + v[2] * s, v[1], -v[0] * s + v[2] * c];
}

function wopt(w, s, extra) {
  return { w: w.k, wc: s.crit || 0, wcd: s.critd || 0, ...extra };
}

// Ejder Nefesi konisi: base yönünde ±0,55 rad, R menzil; ağzın dibindekiler de yanar
function dragonCone(w, s, dm, base, R) {
  const P = $G.P;
  for (const e of $G.E) {
    if (e.dead) continue;
    const p = e.m.position,
      dx = p.x - P.x, dz = p.z - P.z,
      dd = Math.hypot(dx, dz);
    if (dd > R + e.r) continue;
    let da = Math.atan2(dx, dz) - base;
    da = Math.atan2(Math.sin(da), Math.cos(da));
    if (Math.abs(da) < .55 || dd < e.r + .8) {
      hurtE(e, s.dmg * dm, 0, wopt(w, s, { el: 'fire' }));
      if (!e.dead && Math.random() < .35) addStatus(e, 'burn', { d: Math.max(2, s.dmg * dm * .2) });
    }
  }
}

export function fire2(w, s, C, dm, dt, vm) {
  const P = $G.P,
    k = w.k,
    ps = C.pspd,
    n = (s.cnt || 1) + C.cnt,
    sz = (s.sz || 1) * C.size;
  if (k == 'aegis') {
    // şarj biriktirir; darbe gelince aegisHit kullanır
    if (w.ch == null) w.ch = n;
    if (w.ch < n && w.t <= 0) {
      w.ch++;
      w.t = s.cd / C.aspd;
    }
    return;
  }
  if (k == 'korizi') {
    if (trailDrop(w, 2.2 * sz)) {
      const o = mk(gCirc, new THREE.MeshBasicMaterial({ color: 0xff7a2a, transparent: true, opacity: .35 }), P.x, groundAt(P.x, P.z, P.y - 1) + .15, P.z);
      o.rotation.x = -Math.PI / 2;
      o.scale.setScalar(2.2 * sz);
      $G.PZ.push({ m: o, l: s.dur * C.dur, t: 0, d: s.dmg * dm, el: 'fire', burn: 1, w: k, tr: 1, c: 0xff9a3a });
    }
    return;
  }
  if (k == 'mines') {
    if (w.t <= 0 && $G.ZN2.filter(z => z.mine).length < 6 + n) {
      w.t = s.cd / C.aspd;
      if (!gMine) gMine = new THREE.CylinderGeometry(.5, .6, .25, 10);
      // Halka kökün çocuğu; geometri ve malzeme tüm mayınlarda ortak kalır.
      if (!mMineRing) mMineRing = new THREE.MeshBasicMaterial({ color: 0xf05a32, transparent: true, opacity: .28, side: 2, depthWrite: false });
      const y = groundAt(P.x, P.z, P.y - 1) + .15,
        m = mk(gMine, pm(0x4a3a2a), P.x, y, P.z);
      m.scale.setScalar(sz);
      const ring = mk(gRing, mMineRing, 0, .02, 0, m);
      ring.rotation.x = -Math.PI / 2;
      ring.scale.setScalar(2.2);
      glow(0xff4a2a, 1.2, m, .5).position.y = .2;
      $G.ZN2.push({ m, x: P.x, y, z: P.z, l: s.dur * C.dur, mine: 1, R: 2.2 * sz, BR: 3.8 * sz, d: s.dmg * dm, kb: (s.kb || 1) * C.kb, w: k });
    }
    return;
  }
  if (k == 'dragon' && w.bn > 0) {
    // taşan süre korunur; uzun bir karede birden fazla dalga gecikmişse hepsi çıkar
    w.bt -= dt;
    while (w.bn > 0 && w.bt <= 0) {
      w.bn--;
      w.bt += w.bs || .14;
      dragonCone(w, s, dm, w.bb, w.bR);
    }
  }
  if (w.t > 0) return;
  if (k == 'bone' || k == 'rifle' || k == 'dexe' || k == 'blood' || k == 'dagger' || k == 'dice') {
    const rng = k == 'rifle' ? 22 : 26,
      ts = tgts(rng, n);
    if (!ts.length) return;
    w.t = s.cd / C.aspd;
    for (let i = 0; i < n; i++) {
      const t = ts[i % ts.length];
      let d = dirTo(t);
      if (i >= ts.length) d = rotY(d, (i % 2 ? 1 : -1) * (.14 + .1 * Math.floor((i - ts.length) / 2)));
      const v = (k == 'rifle' ? 60 : k == 'dagger' ? 34 : 44) * ps;
      let dmg = s.dmg * dm;
      if (k == 'dice') {
        const roll = 1 + Math.floor(Math.random() * 6);
        dmg = s.dmg * dm * roll / 3.5; // ortalama zar silahın hasarını verir; 1 zayıf, 6 neredeyse iki katı
        if (roll == 6) {
          P.SB.crit = (P.SB.crit || 0) + .005;
          calc();
        }
      }
      mkProj(P.x, P.y + .6, P.z, { c: k == 'bone' ? 0xe8e0c8 : k == 'rifle' ? 0xffd27a : k == 'dexe' ? 0xc8d0e0 : k == 'blood' ? 0xc4302b : k == 'dagger' ? 0xa8e0ff : 0xf0e6c0, sz: k == 'rifle' ? .55 : .8, long: k == 'dexe' || k == 'dagger' }, {
        vx: d[0] * v, vy: d[1] * v, vz: d[2] * v, l: (rng + 10) / v, d: dmg, prc: s.prc || 0, bnc: s.bnc || 0,
        home: k == 'dagger' ? t : null, exec: k == 'dexe' ? .12 : 0, bm: k == 'blood' ? 1 : 0, el: k == 'dagger' ? 'zap' : null,
        kb: (s.kb || 1) * C.kb, o: wopt(w, s)
      });
    }
    sfx(k == 'rifle' ? 'shoot' : k == 'dagger' ? 'swish' : 'throw');
    atkG();
    return;
  }
  if (k == 'rocket') {
    const ts = tgts(28, n);
    if (!ts.length) return;
    w.t = s.cd / C.aspd;
    for (let i = 0; i < n; i++) {
      const t = ts[i % ts.length],
        d = rotY(dirTo(t), (i - (n - 1) / 2) * .3),
        v = 22 * ps;
      mkProj(P.x, P.y + .8, P.z, { c: 0xffb04a, sz: .9, long: 1 }, { vx: d[0] * v, vy: d[1] * v + 3, vz: d[2] * v, l: 2.4, d: s.dmg * dm, home: t, turn: 3.5, boomR: 3.5 * sz, kb: (s.kb || 1) * C.kb, smoke: 1, o: wopt(w, s) });
    }
    sfx('throw');
    atkG();
    return;
  }
  if (k == 'sniper') {
    // En uzak hedefler. 'Baktığın yön' hedeflemesinde önce bakılan yöndeki (±35°) hedefler seçilir; önde kimse yoksa
    // çevredekilere döner. Eskiden bu ayarda hep kameranın baktığı yöne kör atış yapıyordu: kaçarken her atış boşa gidiyordu.
    let ts = [];
    if (SET.aim == 1) {
      // önce bütün sürüden öndekiler (aday sınırından önce süzülür; yoksa arkadaki 14 yakın düşman öndekini dışarıda bırakır)
      const fx = -Math.sin($G.yaw), fz = -Math.cos($G.yaw), c = [];
      for (const e of $G.E) {
        if (e.dead) continue;
        const q = e.m.position, dx = q.x - P.x, dz = q.z - P.z, d = Math.hypot(dx, dz) || 1;
        if (d <= 42 + e.r && dx * fx + dz * fz > .82 * d) c.push([d, e]);
      }
      c.sort((a, b) => b[0] - a[0]); // en uzaktan başla, sınır yakınları kessin
      for (let i = 0; i < c.length && ts.length < 14 && i < 24; i++) { const e = c[i][1], q = e.m.position; if (los(P.x, P.y + .6, P.z, q.x, q.y + e.r, q.z)) ts.push(e) }
      ts.reverse(); // atış döngüsü sondan (en uzaktan) tüketir
    }
    if (!ts.length) ts = tgts(42, 14);
    if (!ts.length) return;
    const v = 90 * ps;
    w.t = s.cd / C.aspd;
    for (let i = 0; i < n; i++) {
      const t = ts[ts.length - 1 - (i % ts.length)];
      let d = dirTo(t);
      if (i >= ts.length) d = rotY(d, (i % 2 ? 1 : -1) * .06 * Math.ceil(i / 2));
      mkProj(P.x, P.y + .6, P.z, { c: 0xfff0c0, sz: .6, long: 1 }, { vx: d[0] * v, vy: d[1] * v, vz: d[2] * v, l: 52 / v, d: s.dmg * dm, prc: s.prc || 0, kb: (s.kb || 1) * C.kb, o: wopt(w, s) });
    }
    sfx('shoot');
    atkG();
    return;
  }
  if (k == 'shotgun') {
    const t = near(14),
      base = t ? dirTo(t) : facing();
    if (!t && SET.aim != 1) return;
    w.t = s.cd / C.aspd;
    for (let i = 0; i < n; i++) {
      const d = rotY(base, (i - (n - 1) / 2) * .16 + rn(-.05, .05)),
        v = 42 * ps;
      mkProj(P.x, P.y + .6, P.z, { c: 0xffc26a, sz: .5 }, { vx: d[0] * v, vy: d[1] * v, vz: d[2] * v, l: 14 / v, d: s.dmg * dm, decay: 1, prc: s.prc || 0, kb: (s.kb || 1) * C.kb, o: wopt(w, s) });
    }
    sfx('shoot');
    atkG();
    return;
  }
  if (k == 'flask') {
    const ts = tgts(22, n);
    if (!ts.length) return;
    w.t = s.cd / C.aspd;
    for (let i = 0; i < n; i++) {
      const t = ts[i % ts.length],
        q = t.m.position,
        dx = q.x - P.x,
        dz = q.z - P.z,
        L = Math.hypot(dx, dz) || 1,
        fl = .8;
      mkProj(P.x, P.y + .8, P.z, { c: 0x8fe06a, sz: .8 }, { vx: dx / fl, vy: 7 + (q.y - P.y) / fl, vz: dz / fl, l: 3, d: s.dmg * dm, grav: 1, zone: { R: 2.6 * sz, l: s.dur * C.dur, poi: 1, c: 0x7fae4a }, o: wopt(w, s) });
    }
    sfx('throw');
    atkG();
    return;
  }
  if (k == 'tornado') {
    const t = tgt(20),
      base = t ? dirTo(t) : facing();
    if (!t) return;
    w.t = s.cd / C.aspd;
    if (!gTorW) gTorW = new THREE.CylinderGeometry(1.2, .25, 4.5, 12, 3, true);
    for (let i = 0; i < n; i++) {
      const d = rotY(base, (i - (n - 1) / 2) * .5),
        m = mk(gTorW, new THREE.MeshBasicMaterial({ color: 0xcfe0e8, transparent: true, opacity: 0, side: 2, depthWrite: false }), P.x, P.y + 1.2, P.z);
      m.scale.setScalar(sz);
      $G.ZN2.push({ m, x: P.x, z: P.z, l: s.dur * C.dur, t: 0, ft: 0, R: 2.2 * sz, d: s.dmg * dm, kb: (s.kb || 1) * C.kb, mv: [d[0], d[2]], spd: 9, tor: 1, w: k });
    }
    sfx('nova');
    atkG();
    return;
  }
  if (k == 'noodle') {
    // Hüzme hedefte durmaz, menzilin sonuna kadar uzanır; her adet ayrı bir hedefe ayrı hüzme çeker.
    const ts = tgts(26, n);
    if (!ts.length) return;
    w.t = s.cd / C.aspd;
    const ax = P.x, ay = P.y + .9, az = P.z, hit = new Set();
    // hüzmeler hasardan önce kurulur: önceki hüzmenin öldürüp havuza döndürdüğü hedefin konumu okunmasın
    const beams = ts.slice(0, n).map(t => {
      const q = t.m.position,
        L0 = Math.hypot(q.x - ax, q.z - az) || 1;
      return [(q.x - ax) / L0, (q.z - az) / L0, Math.max(L0, 26), q.y + t.r];
    });
    for (const [ux, uz, L, by] of beams) {
      // uç, hedefin yüksekliğinde kalır (eğim uzatılınca hüzme yerin altına inmesin); hasar şeridi de yataydır
      bolt3(ax, ay, az, ax + ux * L, by, az + uz * L, 2, .22 * sz);
      for (const e of $G.E) {
        if (e.dead || hit.has(e)) continue;
        const p = e.m.position,
          px = p.x - ax, pz = p.z - az,
          along = px * ux + pz * uz;
        if (along < -1 || along > L + e.r) continue;
        if (Math.abs(px * uz - pz * ux) < .9 * sz + e.r) {
          hit.add(e);
          hurtE(e, s.dmg * dm, 0, wopt(w, s, { el: 'zap' }));
        }
      }
    }
    sfx('zap');
    atkG();
    return;
  }
  if (k == 'dragon') {
    const f = facing(),
      t = near(8 * sz),
      d = t ? dirTo(t) : f;
    if (!t && SET.aim != 1) return;
    w.t = s.cd / C.aspd;
    const R = 7 * sz,
      base = Math.atan2(d[0], d[2]);
    // Nefes tek darbe değil: 0,28 sn içinde üç dalga (ilk dalga şimdi, iki dalga w.bn sayacıyla)
    // dalga aralığı saldırı aralığının üçte birini geçmez: yüksek saldırı hızında yeni nefes bekleyen dalgaları ezmesin
    while (w.bn > 0) { w.bn--; dragonCone(w, s, dm, w.bb, w.bR) } // önceki nefesin kalan dalgaları düşmez
    w.bn = 2; w.bs = Math.min(.14, w.t / 3); w.bt = w.bs; w.bb = base; w.bR = R;
    dragonCone(w, s, dm, base, R);
    // Alev püskürmesi: ağızdan çıkıp koni boyunca ilerleyen, giderek büyüyüp koyulaşan parçacıklar.
    // Gövde normal karışımlı (üst üste binince beyaza çıkmaz), ağızda kısa ömürlü sarı çekirdek, uçta is.
    const fs = Math.min(sz, 1.6),
      fx = P.x, fy = P.y + .7, fz = P.z;
    for (let i = 0; i < 26; i++) {
      const a = base + rn(-.5, .5), r0 = rn(.5, R * .35);
      VFX.emit(VFX.ALP, fx + Math.sin(a) * r0, fy + rn(-.1, .3) * fs, fz + Math.cos(a) * r0, { n: 1, sp: [R * .5, R * 3], dir: [Math.sin(a), .06, Math.cos(a)], cone: .1, up: .5, life: [.32, .52], s: [.4 * fs, .65 * fs], s1: 2.3, c: 0xffa436, c1: 0x8a2408, d: 2.6 }); // hız aralığı geniş: yavaşlar ağızda kalır, hızlılar uca varır, koni boşluksuz dolar
    }
    for (let i = 0; i < 10; i++) {
      const a = base + rn(-.35, .35);
      VFX.emit(VFX.ADD, fx + Math.sin(a) * .8, fy, fz + Math.cos(a) * .8, { n: 1, sp: [R * 1.8, R * 2.8], dir: [Math.sin(a), .04, Math.cos(a)], cone: .08, life: [.16, .28], s: [.28 * fs, .45 * fs], s1: .3, c: 0xffd070, c1: 0xff5a10, br: .6, d: 3 });
    }
    for (let i = 0; i < 5; i++) {
      const a = base + rn(-.45, .45), r0 = rn(R * .55, R * .95);
      VFX.emit(VFX.ALP, fx + Math.sin(a) * r0, fy + .4, fz + Math.cos(a) * r0, { n: 1, sp: [.3, 1], dir: [Math.sin(a), .5, Math.cos(a)], cone: .3, up: 1.2, life: [.5, .8], s: [.4 * fs, .6 * fs], s1: 2, c: 0x3a3028, c1: 0x2a2622, g: -1, d: 2 });
    }
    sfx('fire');
    atkG();
    return;
  }
  if (k == 'katana' || k == 'hero' || k == 'corrupt' || k == 'scythe') {
    const Rr = (k == 'katana' ? 3.4 : k == 'scythe' ? 4.6 : 4.2) * sz,
      t = tgt(Rr + 2.5);
    if (!t && k != 'scythe') return;
    if (k == 'scythe' && !near(Rr + 1)) return;
    w.t = s.cd / C.aspd;
    const q = t ? t.m.position : null,
      base = q ? Math.atan2(q.x - P.x, q.z - P.z) : $G.yaw + Math.PI;
    let d = s.dmg * dm;
    if (k == 'corrupt') d *= 1 + Math.max(0, 1 - P.hp / P.mh);
    if (k == 'scythe' && P.scyC) {
      d *= 3;
      P.scyC = 0;
      toast('Tırpan: biriken güç boşaldı');
    }
    const cnt2 = k == 'scythe' ? 1 : n;
    for (let i = 0; i < cnt2; i++) {
      const a = k == 'corrupt' ? base + (i % 2 ? Math.PI : 0) + Math.floor(i / 2) * .6 : base + Math.floor(i / 2) * (i % 4 < 2 ? .75 : -.75) + (i % 2 ? Math.PI : 0) * (k == 'katana' ? 0 : 1),
        sl = mkSlash(a, Rr, d, -i * .08, i % 2 ? -1 : 1);
      sl.arc = k == 'katana' ? .8 : k == 'scythe' ? Math.PI : 1.3;
      sl.o = wopt(w, s, { kb: (s.kb || 1) * C.kb });
      $G.SLS.push(sl);
      // Erlik Kılıcı her savuruşta arkayı da keser
      if (k == 'corrupt') {
        const sl2 = mkSlash(a + Math.PI, Rr, d, -i * .08 - .05, i % 2 ? 1 : -1);
        sl2.arc = 1.3;
        sl2.o = sl.o;
        $G.SLS.push(sl2);
      }
    }
    // Alp Kılıcı: savuruşla birlikte kesik mermisi
    if (k == 'hero') {
      const v = 26 * ps;
      mkProj(P.x, P.y + .6, P.z, { c: 0xfff2c8, sz: 1.3, long: 1 }, { vx: Math.sin(base) * v, vy: 0, vz: Math.cos(base) * v, l: 16 / v, d: d * .7, prc: 2, r: 1.3 * sz, kb: (s.kb || 1) * C.kb, o: wopt(w, s) });
    }
    sfx('swish');
    atkG();
  }
}

// Kalkan silahı darbeyi engeller ve şok dalgası yayar. Dönüş: engellendi mi.
export function aegisHit(src) {
  const w = $G.P.W.find(x => x.k == 'aegis');
  if (!w || !(w.ch > 0)) return false;
  // kapatılmış silah (final evreleri wdis, Toggler off) darbe engellemez
  if (w.off || $G.P.wdis && $G.P.W.indexOf(w) >= $G.P.wdis) return false;
  w.ch--;
  const C = $G.P.C,
    s = w.s,
    o = mk(gRing, new THREE.MeshBasicMaterial({ color: 0xd9b26a, transparent: true, side: 2 }), $G.P.x, $G.P.y - .6, $G.P.z);
  o.rotation.x = -Math.PI / 2;
  $G.NV.push({ m: o, r: 1, mx: 7 * (s.sz || 1) * C.size, h: new Set(), d: s.dmg * C.dmg + C.thorns, kb: (s.kb || 1) * C.kb * 2, w: 'aegis' });
  inc('blk');
  $G.P.inv = Math.max($G.P.inv, .4);
  sfx('deny');
  puff($G.P.x, $G.P.y + .5, $G.P.z, 0xd9b26a, 4);
  return true;
}

export function w2Upd(dt) {
  const P = $G.P;
  for (const b of $G.B2) {
    const q = b.m.position;
    b.l -= dt;
    if (b.home && !b.home.dead) {
      const t = b.home.m.position,
        dx = t.x - q.x, dy = t.y + b.home.r - q.y, dz = t.z - q.z,
        L = Math.hypot(dx, dy, dz) || 1,
        v = Math.hypot(b.vx, b.vy, b.vz),
        k = Math.min(1, (b.turn || 6) * dt);
      b.vx += (dx / L * v - b.vx) * k;
      b.vy += (dy / L * v - b.vy) * k;
      b.vz += (dz / L * v - b.vz) * k;
    } else if (b.home) b.home = null;
    if (b.grav) b.vy -= 22 * dt;
    const spd = Math.hypot(b.vx, b.vy, b.vz),
      ns = Math.max(1, Math.ceil(spd * dt / .9));
    if (b.smoke && Math.random() < .35) VFX.emit(VFX.ALP, q.x, q.y, q.z, { n: 1, sp: [0, .4], life: [.3, .6], s: [.3, .5], s1: 1.6, c: 0x5a5048 });
    else if (Math.random() < .6) VFX.trail(q.x, q.y, q.z, b.c, .45, .16);
    if (b.decay) b.d *= Math.exp(-dt * 2.2);
    if (b.long) b.m.lookAt(q.x + b.vx, q.y + b.vy, q.z + b.vz);
    for (let k = 0; k < ns && b.l > 0; k++) {
      q.x += b.vx * dt / ns;
      q.y += b.vy * dt / ns;
      q.z += b.vz * dt / ns;
      if (b.grav && q.y <= groundAt(q.x, q.z, q.y) + .4) {
        b.l = 0;
        break;
      }
      for (const e of $G.E) {
        if (b.l <= 0 || e.dead || b.hit.has(e)) continue;
        const p = e.m.position;
        if (Math.hypot(p.x - q.x, p.y + e.r - q.y, p.z - q.z) < e.r + b.r) {
          b.hit.add(e);
          if (b.grav || b.boomR) {
            b.l = 0;
            break;
          }
          hurtE(e, b.d, 0, { ...b.o, el: b.el, kb: b.kb });
          if (!e.dead && b.exec) {
            if (e.t != 3 && !e.mini && e.hp < e.mh * b.exec) {
              e.hp = 0;
              inc('exec');
              killE(e);
              VFX.hit(p.x, p.y + e.r, p.z, 0xc4302b, e.t, 0, 0, 1);
            } else if ((e.t == 3 || e.mini) && !(b.xh && b.xh.has(e))) {
              // Boss ve ara boss infaz edilmez; infaz tutarsa (%2 şans, mermi başına bir zar) azami canının %2'sini kaybeder
              // (Megabonk Dexecutioner). Eskiden her mermi kesin %2 veriyordu: canı ne olursa olsun her boss 50 mermide ölüyordu.
              (b.xh || (b.xh = new Set())).add(e);
              if (Math.random() < EXEC_BOSS) {
                hurtE(e, e.mh * .02, 1, { src: 'exec', dot: 1 });
                VFX.hit(p.x, p.y + e.r, p.z, 0xc4302b, e.t, 0, 0, 1);
              }
            }
          }
          if (e.dead && b.bm && Math.random() < .05) {
            P.SB.hp = (P.SB.hp || 0) + 2;
            inc('bloodhp');
            calc();
            VFX.pick(p.x, p.y + 1, p.z, 0xc4302b);
          }
          if (b.bnc > 0) {
            b.bnc--;
            b.d *= .9; // her sekme %10 zayıflar: mermi ve sekme sayısı birlikte artınca vuruş sayısı karesel büyümesin (Kemik)
            inc('bounces');
            let bn = null, bd = 14 * 14;
            for (const o of $G.E) {
              if (o.dead || b.hit.has(o)) continue;
              const a = o.m.position,
                dd = (a.x - q.x) ** 2 + (a.z - q.z) ** 2;
              if (dd < bd) {
                bd = dd;
                bn = o;
              }
            }
            if (bn) {
              const a = bn.m.position,
                dx = a.x - q.x, dy = a.y + bn.r - q.y, dz = a.z - q.z,
                L = Math.hypot(dx, dy, dz) || 1;
              b.vx = dx / L * spd;
              b.vy = dy / L * spd;
              b.vz = dz / L * spd;
              b.l = Math.max(b.l, L / spd + .1);
              continue;
            }
          }
          if (b.prc-- > 0) continue;
          b.l = 0;
        }
      }
      if (b.l > 0 && solidAt(q.x, q.y, q.z)) {
        b.l = 0;
        if (!b.boomR && !b.grav) puff(q.x, q.y, q.z, 0x8a8070, 4);
      }
    }
    if (b.l <= 0) {
      if (b.boomR) {
        for (const e of $G.E) {
          const p = e.m.position;
          if (!e.dead && Math.hypot(p.x - q.x, p.z - q.z) < b.boomR + e.r) hurtE(e, b.d, 0, { ...b.o, kb: b.kb });
        }
        VFX.boom(q.x, q.y, q.z, b.boomR);
        ringFx(q.x, q.y - .5, q.z, 0xffa040, b.boomR, 30);
        sfxAt('boom', q.x, q.z);
        $G.shk = Math.max($G.shk, .15);
      }
      if (b.zone) {
        const y = groundAt(q.x, q.z, q.y) + .15,
          o = mk(gCirc, new THREE.MeshBasicMaterial({ color: b.zone.c, transparent: true, opacity: .35 }), q.x, y, q.z);
        o.rotation.x = -Math.PI / 2;
        o.scale.setScalar(b.zone.R);
        $G.PZ.push({ m: o, l: b.zone.l, t: 0, d: b.d, el: 'poison', poi: b.zone.poi, w: b.o && b.o.w, c: 0x9fd05a });
        puff(q.x, y + .5, q.z, 0x8fe06a, 10);
        sfxAt('pot', q.x, q.z);
      }
      kill(b.m);
    }
  }
  $G.B2 = $G.B2.filter(b => b.l > 0);
  const torN = Math.max(1, $G.ZN2.filter(z => z.tor && z.l > 0).length);
  for (const z of $G.ZN2) {
    z.l -= dt;
    const q = z.m.position;
    if (z.tor) {
      z.x += z.mv[0] * z.spd * dt;
      z.z += z.mv[1] * z.spd * dt;
      q.set(z.x, groundAt(z.x, z.z, q.y) + 2.2 * z.m.scale.x, z.z);
      z.m.rotation.y += dt * 9;
      // Doğuş ve bitiş kısa solar; çoklu hortumlarda saydamlık korunur.
      z.ft += dt;
      z.m.material.opacity = .14 / Math.sqrt(torN) * Math.max(0, Math.min(1, z.ft / .12, z.l / .22));
      z.t -= dt;
      if (Math.random() < .2) VFX.dust(z.x, q.y - 1.5, z.z, 1, 0xc8c0b0, 2);
      if (z.t <= 0) {
        z.t = .3;
        for (const e of $G.E) {
          if (e.dead) continue;
          const p = e.m.position,
            dx = p.x - z.x, dz = p.z - z.z,
            d = Math.hypot(dx, dz) || 1;
          if (d < z.R + e.r) {
            hurtE(e, z.d, 1, { w: z.w, kb: z.kb });
            if (e.t != 3) {
              e.kx = (e.kx || 0) + dx / d * 9 * z.kb;
              e.kz = (e.kz || 0) + dz / d * 9 * z.kb;
              if (e.t != 1 && e.vy <= 0) e.vy = 7;
            }
          }
        }
      }
      if (z.l <= 0 || solidAt(z.x, q.y, z.z)) z.l = 0;
    } else if (z.mine) {
      let hit = 0;
      for (const e of $G.E) {
        if (e.dead) continue;
        const p = e.m.position;
        if (Math.hypot(p.x - z.x, p.z - z.z) < z.R + e.r * .5 && Math.abs(p.y - z.y) < 3) {
          hit = 1;
          break;
        }
      }
      if (hit || z.l <= 0 && z.l > -1) {
        for (const e of $G.E) {
          if (e.dead) continue;
          const p = e.m.position,
            dx = p.x - z.x, dz = p.z - z.z,
            d = Math.hypot(dx, dz) || 1;
          if (d < z.BR + e.r) {
            hurtE(e, z.d, 0, { w: z.w, kb: z.kb });
            if (e.t != 3) {
              e.kx = (e.kx || 0) + dx / d * 6 * z.kb;
              e.kz = (e.kz || 0) + dz / d * 6 * z.kb;
            }
          }
        }
        VFX.boom(z.x, z.y + .3, z.z, z.BR);
        ringFx(z.x, z.y + .1, z.z, 0xff6a2a, z.BR, 28);
        sfxAt('boom', z.x, z.z);
        z.l = 0;
      }
    }
    if (z.l <= 0) kill(z.m);
  }
  $G.ZN2 = $G.ZN2.filter(z => z.l > 0);
}

export function __init_65b() {
  $G.B2 = [];
  $G.ZN2 = [];
}
