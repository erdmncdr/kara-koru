// game/status.js · Kara Koru
// Düşman üzerindeki durum efektleri: yanma, donma, zehir, kan izi, lanet, sersemleme, büyülenme.
// Durumlar düşman nesnesinde alan olarak tutulur (burnT, frzT, poiN ...), her kare stTick ile işlenir.
// Hasar uygulayan durumlar hurtE üzerinden geçer; böylece can çalma, patlama ve sayaçlar aynı yoldan işler.

import { $G } from '../core/store.js';
import { VFX } from '../engine/vfx.js';
import { hurtE } from './enemies.js';
import { inc } from '../data/content.js';
import { CR } from './heroes.js';

export const STATUS = {
  burn: { n: 'Yanma', c: 0xff7a2a, el: 'fire' },
  frz: { n: 'Donma', c: 0x9fd8ff, el: 'ice' },
  poi: { n: 'Zehir', c: 0x8fe06a, el: 'poison' },
  blood: { n: 'Kan izi', c: 0xc4302b },
  curse: { n: 'Lanet', c: 0xb89cff },
  stun: { n: 'Sersemleme', c: 0xffe08a },
  echo: { n: 'Yankı', c: 0xd8c0ff },
  charm: { n: 'Büyülenme', c: 0xf08ad8 }
};

// Element hasar sayıları için renk sınıfı
export const EL_CLS = { fire: 'fire', ice: 'ice', zap: 'zap', poison: 'poison', curse: 'curse' };

export function stInit(e) {
  e.burnT = e.burnD = e.burnA = 0;
  e.frzT = 0;
  e.poiN = e.poiT = e.poiD = e.poiA = 0;
  e.bloodT = e.curseT = e.curseD = e.curseA = 0;
  e.stunT = e.charmT = e.charmA = 0;
  e.echoT = e.echoQ = e.echoA = 0;
  e.ccN = 0;
  e.slow = 0;
}

// Durum ekler. o: { t: süre, d: tik başına / saniyede hasar, n: yığın }
export function addStatus(e, k, o = {}) {
  if (!e || e.dead) return;
  // Albastılar donmaz, sersemlemez, yavaşlamaz, büyülenmez; yanma, zehir gibi hasar etkileri işler
  if (e.ghost && (k == 'frz' || k == 'stun' || k == 'slow' || k == 'charm')) return;
  const C = $G.P ? $G.P.C : null,
    du = (o.t != null ? o.t : 3) * (C ? C.effdur : 1),
    // kontrol sınırı (Megabonk CC cap): bir düşman en çok 15 kez donar ya da sersemler; 20. dakikadan sonra sınır dakikada bir azalır (en az 1)
    ccCap = $G.P ? Math.max(1, 15 - Math.max(0, Math.floor(($G.P.tt - 1200) / 60))) : 15;
  if ((k == 'frz' || k == 'stun') && (e.ccN || 0) >= ccCap) return;
  if (k == 'frz' || k == 'stun') e.ccN = (e.ccN || 0) + 1;
  switch (k) {
    case 'burn':
      // 3 sn boyunca saniyede d hasar; yeni yanma süreyi tazeler, hasarı büyüğe çeker
      e.burnT = Math.max(e.burnT, du);
      e.burnD = Math.max(e.burnD, o.d != null ? o.d : (C ? C.dmg : 1) * ($G.P.lv || 1) * .5 + 1); // Megabonk: hasar × seviye × 0.5 + 1 /sn
      break;
    case 'frz':
      if (!(e.frzT > 0)) {
        inc('frz');
        if ($G.P) inc('frz_' + CR[$G.CI].k);
      }
      e.frzT = Math.max(e.frzT, o.t != null ? o.t * (C ? C.effdur : 1) : 3 * (C ? C.effdur : 1)); // decompile: 3 sn
      e.slow = Math.max(e.slow, e.frzT + 1.5);
      break;
    case 'poi':
      // yığınlar toplanır (en çok 20), her yığın saniyede d hasar, süre tazelenir
      if (!(e.poiN > 0)) {
        inc('poisoned');
        if ($G.P && CR[$G.CI].k == 'sahmeran') inc('sahpoi');
      }
      e.poiN = Math.min(20, e.poiN + (o.n || 1));
      e.poiT = Math.max(e.poiT, du);
      e.poiD = Math.max(e.poiD, o.d != null ? o.d : 1);
      break;
    case 'blood':
      e.bloodT = Math.max(e.bloodT, o.t != null ? o.t : 6);
      break;
    case 'curse':
      // saniyede azami canın d oranı kadar hasar
      e.curseT = Math.max(e.curseT, du);
      e.curseD = Math.max(e.curseD, o.d != null ? o.d : .1);
      break;
    case 'stun':
      e.stunT = Math.max(e.stunT, o.t != null ? o.t * (C ? C.effdur : 1) : 3 * (C ? C.effdur : 1)); // decompile: 3 sn
      break;
    case 'echo':
      if (!(e.echoT > 0)) inc('echo');
      e.echoT = Math.max(e.echoT, du);
      break;
    case 'charm':
      if (!(e.charmT > 0)) inc('charm');
      e.charmT = Math.max(e.charmT, o.t != null ? o.t * (C ? C.effdur : 1) : 1.5);
      break;
  }
}

export function hasStatus(e, k) {
  return k == 'burn' ? e.burnT > 0 : k == 'echo' ? e.echoT > 0 : k == 'frz' ? e.frzT > 0 : k == 'poi' ? e.poiN > 0 : k == 'blood' ? e.bloodT > 0 : k == 'curse' ? e.curseT > 0 : k == 'stun' ? e.stunT > 0 : k == 'charm' ? e.charmT > 0 : false;
}

// Hareket çarpanı: donmuş ya da sersemlemiş düşman durur, yavaşlamış yarı hızda, büyülenmiş ters yöne.
export function stMove(e) {
  if (e.ghost) return 1; // Albastı: yavaşlatma ve dondurma işlemez (silahların doğrudan yavaşlatması dahil)
  if (e.frzT > 0 || e.stunT > 0) return 0;
  const s = e.slow > 0 ? .5 : 1;
  return e.charmT > 0 ? -s : s;
}

export function stActs(e) {
  if (e.ghost) return true;
  return !(e.frzT > 0 || e.stunT > 0 || e.charmT > 0);
}

// Her kare: süreleri azaltır, zamanla hasar veren durumları uygular, parçacık gösterir.
export function stTick(e, dt) {
  if (e.dead) return;
  const q = e.m.position,
    C = $G.P.C;
  if (e.burnT > 0) {
    e.burnT -= dt;
    e.burnA += dt;
    if (e.burnA >= .5 - 1e-6) {
      e.burnA -= .5;
      hurtE(e, e.burnD * .5 * C.fire, 1, { el: 'fire', dot: 1 });
      if (e.dead) return;
    }
    if (Math.random() < dt * 6) VFX.mote(q.x, q.y + e.r, q.z, STATUS.burn.c, 1.6);
    if (e.burnT <= 0) e.burnD = e.burnA = 0;
  }
  if (e.poiN > 0) {
    e.poiT -= dt;
    e.poiA += dt;
    if (e.poiA >= .5 - 1e-6) {
      e.poiA -= .5;
      hurtE(e, e.poiN * e.poiD * .5 * C.poison, 1, { el: 'poison', dot: 1 });
      if (e.dead) return;
    }
    if (Math.random() < dt * 4) VFX.mote(q.x, q.y + e.r * .6, q.z, STATUS.poi.c, 1.4);
    if (e.poiT <= 0) e.poiN = e.poiD = e.poiA = 0;
  }
  if (e.curseT > 0) {
    e.curseT -= dt;
    e.curseA += dt;
    if (e.curseA >= .5 - 1e-6) {
      e.curseA -= .5;
      hurtE(e, e.mh * e.curseD * .5, 1, { el: 'curse', dot: 1 });
      if (e.dead) return;
    }
    if (Math.random() < dt * 5) VFX.mote(q.x, q.y + e.r * 1.4, q.z, STATUS.curse.c, 1.5);
  }
  if (e.frzT > 0) {
    e.frzT -= dt;
    if (Math.random() < dt * 5) VFX.mote(q.x, q.y + e.r, q.z, STATUS.frz.c, 1.8);
  }
  if (e.bloodT > 0) e.bloodT -= dt;
  if (e.echoT > 0) {
    e.echoT -= dt;
    e.echoA -= dt;
    if (e.echoQ > 0 && e.echoA <= 0) {
      const q2 = e.echoQ;
      e.echoQ = 0;
      e.echoA = .5;
      hurtE(e, q2, 0, { el: 'zap', src: 'echo', dot: 1 });
      if (e.dead) return;
      VFX.mote(q.x, q.y + e.r * 1.6, q.z, STATUS.echo.c, 1.5);
    }
  }
  if (e.stunT > 0) {
    e.stunT -= dt;
    if (Math.random() < dt * 6) VFX.mote(q.x, q.y + e.r * 2, q.z, STATUS.stun.c, 1.2);
  }
  if (e.charmT > 0) {
    e.charmT -= dt;
    e.charmA -= dt;
    if (Math.random() < dt * 4) VFX.mote(q.x, q.y + e.r * 2, q.z, STATUS.charm.c, 1.2);
    // büyülenmiş düşman değdiği düşmanlara kendi hasarını verir
    if (e.charmA <= 0) {
      for (const o of $G.E) {
        if (o === e || o.dead) continue;
        const p = o.m.position;
        if (Math.hypot(p.x - q.x, p.z - q.z) < e.r + o.r && Math.abs(p.y - q.y) < 3) {
          hurtE(o, e.dmg, 0, { el: null, src: 'charm' });
          e.charmA = .4;
        }
      }
    }
  }
}
