// game/run.js · Kara Koru
// Koşu yapısı: harita, kademe, aşama akışı, uzatma, final arenası, zafer ve çıkış.
//
// Kademe N = N aşama. Her aşamanın Boss Kapısı var; boss devrilince son aşama değilse
// Sonraki Aşama Geçidi (GATE.st 2), son aşamaysa zafer: Çıkış Geçidi (GATE.st 3) ve Son Dalga.
// Kademe 3'ün son aşaması küçük bir arenadır. Aşama sayacı dolarsa Uzatma: sonsuz uçan dalga.

import { $G } from '../core/store.js';
import { THREE } from '../engine/three.js';
import { sfx } from '../audio/engine.js';
import { kill, toast, tip } from '../core/helpers.js';
import { MAPS, STL, inc, saveMeta } from '../data/content.js';
import { CR } from './heroes.js';
import { BMc, mk, sc } from '../engine/renderer.js';
import { spawn } from './enemies.js';
import { summonBoss } from './interact.js';
import { chalKey } from './challenge.js';
import { over } from '../ui/menus.js';

// Kademe çarpanı: sıradan düşmanın canını doğrudan, hasarını karekökle çarpar.
// Karekökleri 1 / 1.27 / 1.47, yani Megabonk'un harita kademesi hasar çarpanlarının (0.75 / 0.95 / 1.1, decompile
// RunConfig::GetEnemyDamage) oranı. Can için kaynak yok; eski 2.2 / 5 kademe 3'te seviye atlamayı boğuyordu (tests/denge.mjs).
export const TIERM = [1, 1.6, 2.15];
// Aşama bossu canı aşamayla büyür (profil canı × bu çarpan). Megabonk'ta boss canı aşamadan aşamaya katlanır;
// değerler tests/denge.mjs ölçümüyle, her boss'un 60-120 sn'de düşmesi hedefiyle seçildi (aşama saati düzeltildikten
// sonra yeniden ölçüldü). Final çarpanı düşük görünür; o dövüş silah kilidi ve direk evreleriyle zaten uzar.
export const BOSS_ST = [1, 5, 6];
// Aşama bossu canı çağrıldığı ana göre de büyür (Megabonk: boss canı geçen süreyle ölçeklenir): aşamanın başından
// beri geçen her 150 sn için +1 kat, en çok 6 kat. Erken çağıran zayıf oyuncu zayıf, geç çağıran güçlü oyuncu güçlü
// boss bulur; sabit canla 5. dakikada çağrılan ilk boss 10-80 sn'de düşüyordu (tests/denge.mjs).
export function bossTime() {
  return Math.min(6, 1 + Math.max(0, $G.P.stT - ($G.P.stS || 0)) / 150);
}
export const ARENA_R = 40;

export function mapOf() {
  return MAPS.find(m => m.k == ($G.P ? $G.P.map : $G.MSEL.map)) || MAPS[0];
}

export function tierOpen(mk, t) {
  return t <= 1 || ($G.META.tier[mk] || 0) >= t - 1;
}

export function mapOpen(m) {
  return !m.lock || !!$G.META.l[m.lock];
}

export function __init_59c() {
  $G.MSEL = { map: 'koru', tier: 1, chal: '' };
  try {
    const m = JSON.parse(localStorage.getItem('kk_map') || 'null');
    if (m && MAPS.find(x => x.k == m.map)) $G.MSEL = { map: m.map, tier: Math.max(1, Math.min(3, m.tier | 0 || 1)), chal: m.chal || '' };
  } catch (e) {}
  const m = MAPS.find(x => x.k == $G.MSEL.map);
  if (!mapOpen(m)) $G.MSEL.map = 'koru';
  if (!tierOpen($G.MSEL.map, $G.MSEL.tier)) $G.MSEL.tier = 1;
}

export function selMap(k, t) {
  const m = MAPS.find(x => x.k == k);
  if (!m || !mapOpen(m) || !tierOpen(k, t)) {
    sfx('deny');
    return;
  }
  $G.MSEL = { map: k, tier: t, chal: $G.MSEL.chal || '' };
  try {
    localStorage.setItem('kk_map', JSON.stringify($G.MSEL));
  } catch (e) {}
  sfx('ui');
}

export function selChal(k) {
  $G.MSEL.chal = $G.MSEL.chal == k ? '' : k;
  try {
    localStorage.setItem('kk_map', JSON.stringify($G.MSEL));
  } catch (e) {}
  sfx('ui');
}

// ara boss zamanları (aşama sayacına göre, saniye)
// aşama süresi (Megabonk: 10 / 9 / 8 dk; meydan okuma kısaltabilir)
export function stLen() {
  if ($G.P.stl) return $G.P.stl;
  if ($G.ARENA) return 600; // final arenası 10 dk
  if ($G.P.map == 'mezarlik') return 900; // Mezarlık 15 dk
  return [600, 540, 480][Math.min(2, $G.P.stage)];
}

// ara boss zamanları: 1-2. aşamada 7:00 ve 2:00 kala, 3. aşamada 6:30 ve 1:30 kala
// (megabonk.wiki Bosses: "7:00 or 2:00 (6:30 or 1:30 for tier 3)"; eskiden 3:00 kalaydı, kaynaklar çelişiyordu)
export function MBT() {
  if ($G.P.map == 'mezarlik') return [120, 360, 720]; // 13:00, 9:00, 3:00 kala
  return [[180, 480], [120, 420], [90, 390]][Math.min(2, $G.P.stage)];
}

// akın zamanları: 1-2. aşamada 6:00 ve 3:00 kala, 3. aşamada 5:30 ve 4:00 kala
export function SWT() {
  if ($G.P.map == 'mezarlik') return [180, 420, 780]; // 12:00, 8:00, 2:00 kala
  return [[240, 420], [180, 360], [150, 240]][Math.min(2, $G.P.stage)];
}

export function isLast() {
  return $G.P.stage >= $G.P.tier - 1;
}

export function isArena() {
  return $G.P.tier >= 3 && isLast();
}

// Son aşamanın boss'u devrildi: kademe kaydedilir, Çıkış Geçidi açılır, Son Dalga başlar.
export function winRun() {
  const P = $G.P;
  P.won = 1;
  P.final = 1;
  const m = mapOf();
  $G.META.tier[m.k] = Math.max($G.META.tier[m.k] || 0, P.tier);
  if (P.tier >= 3) inc('k3c' + $G.CI);
  inc('win_' + m.k + P.tier + '_' + CR[$G.CI].k);
  const ck = CR[$G.CI].k;
  if (P.tier >= 3 && (P.I.peynir || 0) >= 8 && P.I.yilan) inc('cheesy'); // Peynir Şapkası: karaktersiz (eskiden Şahmeran)
  if (P.tier >= 3 && m.k == 'koru' && ck == 'alp' && ['slash', 'hero', 'corrupt', 'scythe'].every(w => P.W.some(x => x.k == w))) inc('ironhelm');
  if (P.chal) {
    const ck = chalKey(P.chal, m.k, P.tier);
    if (!$G.META.chal[ck]) {
      $G.META.chal[ck] = 1;
      $G.META.ach['ch_' + ck] = Date.now();
      setTimeout(() => toast(`Meydan okuma tamamlandı: ${P.chal.n}. Kalıcı +%1 gümüş.`), 2600);
    }
  }
  saveMeta();
  if ($G.GATE) {
    $G.GATE.st = 3;
    $G.GATE.por.visible = $G.GATE.sw.visible = true;
    $G.GATE.rn.material = BMc(0xeef4ff);
  }
  P.swarm = 1;
  tip('swarm', 'Son Dalga', 'Kademe zaferi sonrası sonsuz hayalet dalgası: 90 saniyede bir gümüş çarpanı +1 (en çok 8×). Dayanabildiğin kadar dayan, sonra Çıkış Geçidi’nden çık.');
  P.swT0 = P.stT;
  toast(`${m.n} Kademe ${P.tier} tamamlandı. Çıkış geçidi açıldı; kalırsan Son Dalga başlar, gümüş çarpanı büyür.`);
  sfx('portal');
}

export function exitRun() {
  if ($G.S != 'play' || !$G.P.final) return;
  $G.P.exited = 1;
  over(1);
}

// Uzatma: aşama sayacı dolunca başlar, uçan sürüler zamanla güçlenerek gelir.
export function otTick(dt) {
  const P = $G.P;
  if (P.swarm || P.final) return;
  if (P.stT < stLen()) return;
  if (!P.ot) {
    P.ot = 1e-6;
    P.otS = 0;
    toast('Uzatma. Uçan sürüler durmadan gelecek, kapıdaki boss’u devir.');
    tip('ot', 'Uzatma', 'Aşama saati bitti: hayalet sürüleri durmadan gelir ve 1., 6. ve 12. dakikada güçlenir. Kapıdaki boss’u devirip geçitten geç.');
    sfx('boss');
  }
  P.ot += dt;
  P.otS -= dt;
  if (P.otS <= 0 && $G.E.length < 230) {
    P.otS = Math.max(.6, 2.4 - P.ot / 120);
    const n = 4 + Math.floor(P.ot / 40),
      k = 1 + P.ot / 90;
    const gk = P.ot < 60 ? 'hayalet' : P.ot < 360 ? 'karahayalet' : P.ot < 720 ? 'morhayalet' : 'kizilhayalet';
    for (let i = 0; i < n; i++) spawn(gk, { hk: k, dk: Math.sqrt(k) });
  }
}

// Final arenası: yarıçap sınırı ve ışıyan mühür duvarı
export function arenaBuild(R = ARENA_R, col = 0xb8263a) {
  $G.ARENA = R;
  const g = new THREE.CylinderGeometry(R, R, 9, 48, 1, true),
    m = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .22, side: 2, depthWrite: false }),
    w = mk(g, m, 0, $G.HT(0, 0) + 4, 0);
  g.userData.own = 1;
  $G.ARW = w;
}

export function arenaClear() {
  $G.ARENA = 0;
  if ($G.ARW) {
    kill($G.ARW);
    $G.ARW = null;
  }
}

// Arena dışındaki nesneleri kaldır
export function arenaTrim() {
  const R2 = (($G.ARENA || ARENA_R) - 5) ** 2,
    far = q => q.x * q.x + q.z * q.z > R2;
  for (const a of [$G.CH, $G.SH, $G.NP, $G.MZ, $G.KS]) {
    for (const o of a) if (far(o.m.position)) {
      kill(o.m);
      o.d = 1;
      o.far = 1;
    }
    for (let i = a.length - 1; i >= 0; i--) if (a[i].far) a.splice(i, 1);
  }
  $G.MZC = null;
}

export function arenaTick(dt) {
  const P = $G.P;
  if (!$G.ARENA) return;
  // oyuncuyu daire içinde tut
  const d = Math.hypot(P.x, P.z);
  if (d > $G.ARENA - 1.2) {
    const k = ($G.ARENA - 1.2) / d;
    P.x *= k;
    P.z *= k;
  }
  if (P.arenaT > 0) {
    P.arenaT -= dt;
    if (P.arenaT <= 0 && $G.GATE && $G.GATE.st == 0) {
      toast('Mühür çözüldü. Final boss’u geliyor.');
      summonBoss();
    }
  }
}
