// game/graveyard.js · Kara Koru
// Mezarlık haritası akışı: Mahzen (mühürlü başlangıç), dört tabut ve anahtarlar, Kara Kefen,
// Kızıl Bozkır'daki iskelet heykeli olayı (Kemik'in Babası) ve Kara Koru'daki kafes ile Çalı.

import { $G } from '../core/store.js';
import { sfx } from '../audio/engine.js';
import { toast } from '../core/helpers.js';
import { rn } from '../core/util.js';
import { inc, saveMeta } from '../data/content.js';
import { spawn } from './enemies.js';
import { CR, CRYPT_N } from './heroes.js';
import { mkChest } from './objects.js';
import { arenaBuild, arenaClear, mapOf } from './run.js';

export const MZ_NEED = 30;
export const MZ_TIME = 120;

export function gyInit() {
  const P = $G.P;
  P.mz = null;
  if (mapOf().k != 'mezarlik') return;
  P.mz = { t: MZ_TIME, kills: 0, need: MZ_NEED, open: 0, keys: 0, coffins: 0, kefen: 0 };
  arenaBuild(30, 0x8a74d8);
  toast('Mahzen mühürlü. ' + MZ_NEED + ' düşman devir ya da süre dolmadan önce mührü kır; yoksa Kara Kefen uyanır.');
}

export function gyTick(dt) {
  const mz = $G.P.mz;
  if (!mz) return;
  if (!mz.open) {
    mz.t -= dt;
    if (mz.kills >= mz.need) {
      inc('mzopen');
      // Mahzen kostümü (Megabonk crypt skin): karaktere göre saniye eşiği
      if (120 - mz.t < (CRYPT_N[CR[$G.CI].k] || 22)) inc('crypt' + $G.CI);
      gyOpen('Mühür kırıldı. Mezarlık açıldı; dört tabutu bul.');
    }
    else if (mz.t <= 0) {
      gyOpen('Süre doldu. Kara Kefen uyandı: ölümsüz, yavaş, affetmez.');
      gyKefen();
    }
  }
}

function gyOpen(msg) {
  $G.P.mz.open = 1;
  arenaClear();
  toast(msg);
  sfx('portal');
}

export function gyKefen() {
  const mz = $G.P.mz;
  if (!mz || mz.kefen) return;
  mz.kefen = 1;
  const a = rn(0, 6.28);
  spawn('kefen', { x: $G.P.x + Math.cos(a) * 70, z: $G.P.z + Math.sin(a) * 70, hk: 1e7, dk: 30, nm: 'Kara Kefen', mini: 1, nodrop: 1 });
  sfx('boss');
}

// Tabut bekçisinin canı, tabutun açıldığı ana göre büyür: (aşama süresi / 4 dk)³, en az 1, en çok 60.
// Sabit canla (1.100-9.000) bekçiler geç açıldığında yarım saniyede ölüyordu (tests/denge.mjs). Megabonk'ta
// bekçilerin giderek güçlendiği yazılı, sayı yok; eğri ölçümle seçildi.
export function guardMul() {
  return Math.max(1, Math.min(60, Math.pow($G.P.stT / 240, 3)));
}

// tabut: ara boss çıkar, ölünce anahtar düşürür
export function coffinUse(s) {
  const mz = $G.P.mz;
  if (!mz) return;
  mz.coffins++;
  const k = 'tabut' + Math.min(4, mz.coffins),
    q = s.m.position;
  spawn(k, { el: 1, mini: 1, x: q.x + 6, z: q.z, keyDrop: 1 });
  toast('Tabut açıldı. ' + (mz.coffins) + '/4');
}

export function gyKill(e) {
  const P = $G.P,
    mz = P.mz;
  if (mz) {
    mz.kills++;
    if (e.keyDrop) {
      mz.keys++;
      toast(`Mahzen anahtarı düştü. ${mz.keys}/4`);
      sfx('quest');
    }
    if (e.boss && e.bp && e.bp.n == 'Dev Hortlak') inc('hortlak');
  }
  if (e.kind == 'baba' && !$G.META.l.mezarlik) {
    $G.META.l.mezarlik = 1;
    saveMeta();
    inc('baba');
    setTimeout(() => toast('Mezarlık haritası açıldı. Menüden seçebilirsin.'), 1200);
  }
  if (e.kind == 'cali') {
    inc('cali');
    mkChest({ x: e.m.position.x, z: e.m.position.z, free: 1 });
  }
}

export function gyKeysOk() {
  const mz = $G.P.mz;
  return !mz || mz.keys >= 4;
}

// Kızıl Bozkır: dört mezar huzura erince, Kemik oynuyorsa iskelet heykeli babayı çağırır
export function dadEvent() {
  if (mapOf().k != 'bozkir' || CR[$G.CI].k != 'kemik' || !$G.MZC) return;
  const c = $G.MZC;
  spawn('baba', { el: 1, mini: 1, x: c.x + 6, z: c.z, hk: 2.5, nm: 'Kemik’in Babası' });
  setTimeout(() => toast('İskelet heykeli titredi. Kemik’in Babası mezardan kalktı.'), 1600);
}

// Kara Koru: kafes ve Çalı
export function cageUse(s) {
  if (!$G.P.I.kafesanahtar) {
    toast('Kafes kilitli. Anahtarı haritada bir yerde parlıyor.');
    sfx('deny');
    return false;
  }
  delete $G.P.I.kafesanahtar;
  inc('cage');
  // Kafesin içindeki Yaban kadrodan çıktı; kurtarılan ruh artık bedava bir sandık bırakır
  const q = s.m.position;
  mkChest({ x: q.x + 2.5, z: q.z, free: 1 });
  toast('Kafes açıldı. Tutsak ruh özgür kaldı, sana bir sandık bıraktı.');
  sfx('quest');
  return true;
}

export function bushUse(s) {
  const q = s.m.position;
  spawn('cali', { el: 1, mini: 1, x: q.x + 5, z: q.z, hk: 2, nm: 'Çalı' });
  toast('Çalı kıpırdadı. Meğer canlıymış.');
  return true;
}
