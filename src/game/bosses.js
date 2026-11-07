// game/bosses.js · Kara Koru
// Boss saldırı profilleri ve boss kaynaklı bölgeler. bossTick her kare boss için çağrılır;
// bzUpd oyuncuya etki eden bölgeleri (bataklık kum, alev gölü) işler.

import { inc } from '../data/content.js';
import { $G } from '../core/store.js';
import { THREE } from '../engine/three.js';
import { sfx, sfxAt } from '../audio/engine.js';
import { kill, toast } from '../core/helpers.js';
import { rn } from '../core/util.js';
import { mk, sc } from '../engine/renderer.js';
import { VFX, eShot, gCirc, puff } from '../engine/vfx.js';
import { hurtP, spawn, killE } from './enemies.js';
import { DMK } from './stats.js';
import { bolt3 } from './weapons.js';
import { groundAt, pushOut } from '../world/terrain.js';

const LASER_M = new THREE.MeshBasicMaterial({ color: 0xff3a3a });

function zone(x, z, R, kind, l, col) {
  const y = groundAt(x, z, 1e9) + .12,
    m = mk(gCirc, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .4, depthWrite: false }), x, y, z);
  m.rotation.x = -Math.PI / 2;
  m.scale.setScalar(R);
  $G.BZ.push({ m, x, z, y, R, kind, l });
}

// Direk doldurma: oyuncu bir direğin 4.5 m içinde 3 saniye durunca direk dolar. Dolmamış direk sayısını döndürür.
function pylonTick(e, dt) {
  const P = $G.P;
  let n = 0;
  for (const o of $G.E) {
    if (o.dead || !o.kd || !o.kd.fx || !o.kd.fx.pylon) continue;
    const op = o.m.position;
    // direk yerinden oynamaz: itme gücü olan silahlar onu arena duvarının dışına itebiliyor, o zaman doldurulamıyordu
    if (o.ax != null) {
      op.x = o.ax;
      op.z = o.az;
      o.kx = o.kz = 0;
    }
    if (Math.hypot(op.x - P.x, op.z - P.z) < 4.5 && Math.abs(op.y - P.y) < 5) {
      o.chg = (o.chg || 0) + dt;
      if (Math.random() < dt * 8) VFX.mote(op.x, op.y + 2, op.z, 0x6ad6f0, 2.2);
      if (o.chg >= 3) {
        o.hp = 0;
        o.nodrop = 1;
        killE(o);
        inc('pylon');
        toast('Direk doldu');
        continue;
      }
    }
    n++;
  }
  e.pyInv = n > 0;
  if (n) e.hp = Math.min(e.mh, e.hp + e.mh * .01 * n * dt);
  return n;
}

function pylonsSpawn(q) {
  for (let i = 0; i < 3; i++) {
    const an = i / 3 * 6.28 + rn(-.3, .3);
    let x = q.x + Math.cos(an) * 12,
      z = q.z + Math.sin(an) * 12;
    // direk mühür duvarının dışına düşmesin: oyuncu arenadan çıkamaz, dışarıdaki direk doldurulamaz ve boss sonsuza dek korunur
    const d = Math.hypot(x, z),
      mx = ($G.ARENA || 1e9) - 4;
    if (d > mx) {
      x *= mx / d;
      z *= mx / d;
    }
    spawn('direk', { x, z, hk: 1e9, nodrop: 1 });
    // sabitleme noktası: önce kaya ve ağaç gibi engellerin dışına çıkarılır (yoksa direk engelin içinde kalır ve
    // oyuncu 4.5 m'ye yaklaşamaz), sonra duvarın içine alınır
    const pe = $G.E[$G.E.length - 1],
      pp = pe.m.position;
    for (let k = 0; k < 4; k++) pushOut(pp, pe.r * .7 + .8);
    const d2 = Math.hypot(pp.x, pp.z);
    if (d2 > mx) {
      pp.x *= mx / d2;
      pp.z *= mx / d2;
    }
    pp.y = groundAt(pp.x, pp.z, pp.y + 5);
    pe.ax = pp.x;
    pe.az = pp.z;
  }
}

export function bossTick(e, dt, d, dx, dz) {
  const P = $G.P,
    pr = e.bp;
  if (!pr) return;
  const q = e.m.position;
  e.bt = e.bt || {};
  const T = e.bt;
  // Final arenası (Megabonk): yalnız başlangıç silahıyla girilir; %75/50/25'te boss dokunulmaz olur, üç direk dikilir,
  // dolunca bir silah geri verilir. Üç evre sonra bütün silahlar elde.
  if (e.boss && $G.ARENA) {
    if (e.ph == null) {
      e.ph = 0;
      P.wdis = 1;
      toast('Final: yalnız ilk silahın çalışıyor. Her evrede direkleri doldur, bir silahın geri gelsin.');
    }
    const TH = [.75, .5, .25];
    if (e.ph < 3 && !e.pyInv && e.hp <= e.mh * TH[e.ph]) {
      e.ph++;
      e.pyInv = 1;
      pylonsSpawn(q);
      toast(`Evre ${e.ph}: boss korunuyor, üç direği doldur.`);
      sfx('boss');
    }
    if (e.pyInv) {
      const n = pylonTick(e, dt);
      if (!n) {
        P.wdis = P.wdis + 1 >= P.W.length ? 0 : P.wdis + 1;
        toast(P.wdis ? 'Bir silahın geri geldi.' : 'Bütün silahların geri geldi.');
        sfx('shrine');
      }
    }
  }
  for (const a of pr.p) {
    if ($G.ARENA && (a == 'pylons' || a == 'disable')) continue; // arenada evre makinesi yönetir
    if (a == 'charge') {
      T.ch = (T.ch == null ? 5 : T.ch) - dt;
      if (T.chT > 0) {
        T.chT -= dt;
        e.spm = 4;
        e.cdir = [T.cdx, T.cdz];
        if (T.chT <= 0) e.spm = 1;
      } else if (T.ch <= 0 && d < 40) {
        T.ch = 6;
        T.chT = 1.2;
        T.cdx = dx / d;
        T.cdz = dz / d;
        sfxAt('growl', q.x, q.z, 3);
        puff(q.x, q.y + 1, q.z, 0x8a6a4a, 10);
      }
    } else if (a == 'laser') {
      T.la = (T.la || 0) + dt * .9;
      T.lv = (T.lv || 0) - dt;
      const L = 22;
      for (let i = 0; i < 2; i++) {
        const an = T.la + i * Math.PI,
          ux = Math.sin(an), uz = Math.cos(an);
        if (T.lv <= 0) bolt3(q.x, q.y + 3, q.z, q.x + ux * L, q.y + 1, q.z + uz * L, 1, .22);
        // oyuncu ışın çizgisinde mi
        const px = P.x - q.x, pz = P.z - q.z,
          along = px * ux + pz * uz;
        if (along > 0 && along < L && Math.abs(px * uz - pz * ux) < 1.3 && Math.abs(P.y - q.y) < 5) hurtP(12 * DMK(), e);
      }
      if (T.lv <= 0) T.lv = .12;
    } else if (a == 'pylons') {
      // aşama boss'u: bir kez üç direk; dolana kadar hasar almaz ve iyileşir
      if (!T.pyDone) {
        T.pyDone = 1;
        pylonsSpawn(q);
        toast('Boss üç direkle korunuyor. Her direğin yanında durup doldur.');
        sfx('boss');
      }
      pylonTick(e, dt);
    } else if (a == 'disable') {
      P.wdis = 1;
    } else if (a == 'summon') {
      T.sm = (T.sm == null ? 10 : T.sm) - dt;
      if (T.sm <= 0) {
        T.sm = 20;
        for (let i = 0; i < 4; i++) {
          const an = i / 4 * 6.283;
          spawn('akrep', { x: q.x + Math.cos(an) * 6, z: q.z + Math.sin(an) * 6 });
        }
        sfxAt('growl', q.x, q.z, 5);
      }
    } else if (a == 'sand') {
      T.sd = (T.sd == null ? 6 : T.sd) - dt;
      if (T.sd <= 0) {
        T.sd = 12;
        for (let i = 0; i < 3; i++) zone(P.x + rn(-9, 9), P.z + rn(-9, 9), 4, 'sand', 15, 0xc8a060);
        toast('Bataklık kum: içine basan yavaşlar.');
      }
    } else if (a == 'ice') {
      T.ic = (T.ic == null ? 3 : T.ic) - dt;
      if (T.ic <= 0 && d < 34) {
        T.ic = 4;
        $G.EB.push({ m: eShot(q.x, q.y + 2, q.z, 'i'), vx: dx / d * 18, vz: dz / d * 18, vy: (P.y - (q.y + 2)) / (d / 18), l: 3.5, ice: 1 });
        sfxAt('ice', q.x, q.z);
      }
    } else if (a == 'ghosts') {
      T.gh = (T.gh == null ? 4 : T.gh) - dt;
      if (T.gh <= 0) {
        T.gh = 5;
        for (let i = 0; i < 3; i++) {
          const an = rn(0, 6.28);
          $G.EB.push({ m: eShot(q.x + Math.cos(an) * 2, q.y + 2.5, q.z + Math.sin(an) * 2, 'h'), vx: Math.cos(an) * 10, vz: Math.sin(an) * 10, vy: 0, l: 6, home: 1 });
        }
        sfxAt('growl', q.x, q.z, 1);
      }
    } else if (a == 'lava') {
      T.lv2 = (T.lv2 == null ? 7 : T.lv2) - dt;
      if (T.lv2 <= 0) {
        T.lv2 = 10;
        for (let i = 0; i < 3; i++) zone(P.x + rn(-10, 10), P.z + rn(-10, 10), 3.5, 'lava', 12, 0xff5a1a);
        toast('Alev gölleri açıldı. Üstünde durma.');
      }
    }
  }
}

// boss ölünce silah kilidi kalkar, direkler ölür
export function bossDied(e) {
  if (!e.bp) return;
  if ($G.ARENA) $G.P.wdis = 0;
  if (e.bp.p.includes('disable') && !$G.E.some(o => o !== e && !o.dead && o.bp && o.bp.p.includes('disable'))) {
    $G.P.wdis = 0;
    toast('Silahların yeniden uyandı.');
  }
  for (const o of $G.E) if (!o.dead && o.kd && o.kd.fx && o.kd.fx.pylon) o.hp = 0;
}

export function bzUpd(dt) {
  const P = $G.P;
  for (const z of $G.BZ) {
    z.l -= dt;
    z.m.material.opacity = Math.min(.4, z.l * .3);
    const inside = Math.hypot(P.x - z.x, P.z - z.z) < z.R && Math.abs(P.y - 1 - z.y) < 3;
    if (inside) {
      if (z.kind == 'sand') P.slowT = Math.max(P.slowT || 0, .3);
      else if (z.kind == 'lava') {
        P.lavaA = (P.lavaA || 0) + dt;
        if (P.lavaA > .5) {
          P.lavaA = 0;
          P.inv = 0;
          hurtP(6 * DMK());
        }
        if (Math.random() < dt * 8) VFX.emit(VFX.ADD, P.x, P.y - .5, P.z, { n: 1, sp: [0, 1], up: 3, life: [.3, .5], s: [.3, .5], s1: .2, c: 0xff8a3a });
      }
    }
    if (z.kind == 'lava' && Math.random() < dt * 3) VFX.emit(VFX.ADD, z.x + rn(-z.R, z.R), z.y + .2, z.z + rn(-z.R, z.R), { n: 1, sp: [0, .5], up: 2, life: [.4, .7], s: [.3, .6], s1: .2, c: 0xff6a2a });
    if (z.l <= 0) kill(z.m);
  }
  $G.BZ = $G.BZ.filter(z => z.l > 0);
}

export function __init_63b() {
  $G.BZ = [];
}
