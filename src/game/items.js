// game/items.js · Kara Koru
// Eşya kanca sistemi. Veri (data/items.js) saf kalır; davranışlar burada eşya anahtarına göre tanımlanır.
//
// Kancalar (ctx, n) alır; n oyuncudaki yığın sayısı:
//   hit    { e, d, el, again } hasar uygulanmadan önce (kritikten önce); ctx.d değiştirilebilir.
//                            Tılsımlı Kandil varsa şans tabanlı kancalar again=1 ile bir kez daha çağrılır.
//   crit   { e, d, cm }      kritik hesaplandıktan sonra; ctx.d değiştirilebilir
//   kill   { e, q }          düşman ölünce
//   hurt   { d, src }        oyuncu hasar alınca (hasar düşüldükten sonra)
//   evade  { src }           oyuncu kaçınınca
//   pick   { ty, v }         kristal, altın, gümüş ya da can toplanırken; ctx.v değiştirilebilir
//   chest  { c, free, gold } sandık açılırken
//   shrine { s }             sunak kullanılınca
//   stage  { sh, pots }      aşama kurulurken; ek ocak ve pot sayısı
//   level  { lv }            seviye atlayınca
//   pot    { q }             pot kırılınca
//   tick   { dt }            her oyun karesi
//   calc   (L, n, c1)        stat hesabında; L katmanlar, c1 ilk çözüm
//
// Eşya durumu P.IS içinde (sayaçlar, bekleme süreleri). ITD[k].u = 1 tekil.

import { $G } from '../core/store.js';
import { THREE } from '../engine/three.js';
import { sfx, sfxAt } from '../audio/engine.js';
import { kill, toast } from '../core/helpers.js';
import { rn } from '../core/util.js';
import { ITD, inc } from '../data/content.js';
import { addStats } from '../data/stats.js';
import { glow, sc } from '../engine/renderer.js';
import { VFX, puff, ringFx } from '../engine/vfx.js';
import { hurtE, killE } from './enemies.js';
import { heroHook } from './heroes.js';
import { calc } from './stats.js';
import { addStatus, hasStatus } from './status.js';
import { mkProj } from './weapons2.js';
import { near, tgts } from './weapons.js';
import { groundAt } from '../world/terrain.js';
import { mkPU } from './objects.js';

const P = () => $G.P;
const C = () => $G.P.C;
const IS = () => $G.P.IS || ($G.P.IS = {});
// eşya hasar tabanı
const ib = () => 10 * $G.P.C.dmg;
const chance = p => Math.random() < p;
// Albastı Sürüsü: n hayalet mermisi yakın düşmanlara kilitlenir
function albSummon(n) {
  const ts = tgts(30, n);
  for (let i = 0; i < n; i++) if (ts.length) fireAt(ts[i % ts.length], ib() * .6, { c: 0xcfe0ff, home: 1, v: 22 });
}
// güç düşürme (lahmacun): yere güç bırakır
function dropPU(x, z, k) {
  mkPU(x, z, k, groundAt(x, z, $G.P.y));
}

export function hpCap() {
  return $G.P.mh * (1 + ($G.P.C.overheal || 0));
}

export function heal(v) {
  $G.P.hp = Math.min(hpCap(), $G.P.hp + v);
}

// yarıçap içindeki düşmanlara hasar
export function aoe(x, z, R, d, o, skip) {
  let n = 0;
  for (const e of $G.E) {
    if (e.dead || e === skip) continue;
    const p = e.m.position;
    if (Math.hypot(p.x - x, p.z - z) < R + e.r) {
      hurtE(e, d, 1, o);
      n++;
    }
  }
  return n;
}

function fireAt(t, d, o = {}) {
  if (!t) return;
  const q = t.m.position,
    dx = q.x - $G.P.x, dy = q.y + t.r - ($G.P.y + .6), dz = q.z - $G.P.z,
    L = Math.hypot(dx, dy, dz) || 1,
    v = o.v || 30;
  mkProj($G.P.x, $G.P.y + .6, $G.P.z, { c: o.c || 0xd8c8ff, sz: o.sz || .7 }, { vx: dx / L * v, vy: dy / L * v, vz: dz / L * v, l: 2, d, home: o.home ? t : null, boomR: o.boomR || 0, prc: o.prc || 0, el: o.el || null, o: { src: 'item' } });
}

// hız ve hasar patlamaları: IS.bT süre, IS.bS hız çarpanı, IS.bD hasar çarpanı
function burst(t, s, d) {
  const S = IS();
  S.bT = Math.max(S.bT || 0, t);
  S.bS = Math.max(S.bS || 1, s);
  S.bD = Math.max(S.bD || 1, d);
}

export function spdMul() {
  const S = $G.P.IS;
  return S && S.bT > 0 ? S.bS : 1;
}

function every(key, period, dt) {
  const S = IS();
  period = period / ($G.P.C.burst || 1); // 'Patlama beklemesi' statı: eşya tetik aralıkları
  S[key] = (S[key] == null ? period * .5 : S[key]) - dt;
  if (S[key] <= 0) {
    S[key] = period;
    return true;
  }
  return false;
}

export const IH = {
  // ---- hasar ve kritik
  atki: { hit(c, n) { if (!c.again && $G.P.air) c.d *= 1 + .5 * n; } },
  kartalgoz: { hit(c, n) { if (!c.again && c.e.hp > c.e.mh * .9) c.d *= 1 + .2 * n; } }, // sabit çarpan: Kandil'in ikinci geçişinde yeniden çarpmaz
  yumruk: { hit(c, n) { if (c.again) return; const p = c.e.m.position; if (Math.hypot(p.x - P().x, p.z - P().z) < 8) c.d *= 1 + .2 * n; } },
  kumsaati: {
    calc(L, n) { addStats(L, { dmg: .08 * n * Math.floor($G.P.tt / 60) }); },
    tick(c, n) { const S = IS(), m = Math.floor($G.P.tt / 60); if (S.ksM !== m) { S.ksM = m; calc(); } }
  },
  sabir: {
    tick(c, n) { const S = IS(), mv = Math.hypot($G.P.vx, $G.P.vz); S.idle = mv < .5 ? Math.min(1, (S.idle || 0) + .04 * n * c.dt) : 0; },
    hit(c) { if (!c.again && IS().idle > 0) c.d *= 1 + IS().idle; }
  },
  gozluk: { hit(c, n) { if (!c.again) c.d *= 1 + n * Math.max(0, 1 - $G.P.hp / $G.P.mh); } },
  erlikruh: { kill(c, n) { const S = IS(); S.dsoul = Math.min(1, (S.dsoul || 0) + .001 * n); if ((S.dsoulK = (S.dsoulK || 0) + 1) % 20 == 0) calc(); }, calc(L) { addStats(L, { dmg: IS().dsoul || 0 }); } },
  kizilkese: { calc(L, n) { addStats(L, { dmg: .025 * n * $G.P.opened }); } },
  catal: { crit(c, n) { if (chance(.14 * n)) { c.d *= 2; c.mega = 1; } } },
  erlikbicak: { crit(c, n) { if (chance(.25)) heal(Math.min(c.d * .25, $G.P.mh * .02 * n)); } },
  tonik: { crit(c, n) { if (!chance(.5)) return; const q = c.e.m.position; aoe(q.x, q.z, 3 + (n - 1), c.d * .5, { src: 'item', dot: 1 }, c.e); } },
  // ---- vuruş tetikleri
  // Tokmak (Big Bonk): yığın yalnız şansı artırır, çarpan sabit 20. Kandil'in ikinci denemesi yalnız ilk deneme tutmadıysa
  // işler. Eskiden çarpan yığınla büyüyordu (24 yığında ×250) ve Kandil iki kez çarpıyordu; Son Dalga'da Albastı canı
  // 40 dakikada milyon kat büyüse de bu build'ler onu yaklaşmadan siliyordu.
  tokmak: { hit(c, n) { if (c.tk) return; if (chance(.02 + .015 * (n - 1))) { c.tk = 1; const q = c.e.m.position; c.d *= 20; aoe(q.x, q.z, 3, c.d, { src: 'item' }, c.e); puff(q.x, q.y + 1, q.z, 0xffd36a, 14); $G.shk = Math.max($G.shk, .25); } } },
  kofte: { hit(c, n) { if (chance(.25)) { const q = c.e.m.position; aoe(q.x, q.z, 2.5, c.d * .65 * n, { src: 'item', dot: 1 }, c.e); if (chance(.3)) puff(q.x, q.y + 1, q.z, 0xff6a3a, 6); } } },
  gulle: { kill(c, n) { if (chance(.2)) { const t = tgts(24, 1)[0]; if (t) fireAt(t, ib() * (1 + .4 * (n - 1)), { c: 0xffb04a, boomR: 2.5, home: 1, v: 24 }); } } },
  yildirimkure: { hit(c, n) { if (chance(.25)) { const q = c.e.m.position; let b = null, bd = 36; for (const o of $G.E) { if (o.dead || o === c.e) continue; const p = o.m.position, dd = (p.x - q.x) ** 2 + (p.z - q.z) ** 2; if (dd < bd) { bd = dd; b = o; } } if (b) { hurtE(b, c.d * .4 * n, 0, { el: 'zap', src: 'item' }); if (chance(.25)) addStatus(b, 'stun', { t: .6 }); VFX.zap(b.m.position.x, b.m.position.y + 1, b.m.position.z); } } } },
  buzkup: { hit(c, n) { if (chance(.2)) { hurtE(c.e, c.d * (.8 + .4 * (n - 1)), 0, { el: 'ice', src: 'item', dot: 1 }); if (chance(.4)) { addStatus(c.e, 'frz'); inc('frz_buzkup'); } VFX.ice(c.e.m.position.x, c.e.m.position.y + 1, c.e.m.position.z); } } },
  peynir: { hit(c, n) { if (chance(.4)) addStatus(c.e, 'poi', { n, d: Math.max(.5, ib() * .05) }); } },
  yilan: { hit(c, n) { addStatus(c.e, 'poi', { n: 4 * n, d: Math.max(.5, ib() * .05) }); } },
  kararsizkan: { hit(c, n) { if (chance(.35)) addStatus(c.e, 'blood'); } },
  satir: { hit(c, n) { if (C().ls > 0 && chance(.5)) addStatus(c.e, 'blood'); } },
  kartalpence: { hit(c, n) { if (c.again) return; const e = c.e; const air = e.vy > 0 || e.fy > groundAt(e.m.position.x, e.m.position.z, e.fy) + 1; if (air) c.d *= 1.66; if (chance(.08 * n) && e.t != 3 && e.t != 1) e.vy = Math.max(e.vy, 9); } },
  cellathancer: {
    hit(c, n) { if (!c.e.dead && chance(.01 * n) && c.e.t != 3 && !c.e.mini) { const S = IS(), m = Math.floor($G.P.tt / 60); if (S.joeM != m) { S.joeM = m; S.joeG = 0; } if ((S.joeG || 0) < 2) { S.joeG = (S.joeG || 0) + .01; S.joe = (S.joe || 0) + .01; calc(); } c.e.hp = 0; killE(c.e); } },
    calc(L) { addStats(L, { dmg: IS().joe || 0 }); }
  },
  kaval: { hit(c, n) { if (chance(.02 * n)) addStatus(c.e, 'charm', { t: 1.5 }); } },
  bebek: { tick(c, n) { if (every('bebekT', 3, c.dt)) for (const e of tgts(14, n)) addStatus(e, 'curse', { d: .3, t: 3 }); } },
  gucelgiven: { hit(c, n) { if (chance(.08 * n) && c.e.t != 3) { const q = c.e.m.position, dx = q.x - P().x, dz = q.z - P().z, d = Math.hypot(dx, dz) || 1; c.e.kx = (c.e.kx || 0) + dx / d * 14; c.e.kz = (c.e.kz || 0) + dz / d * 14; } } },
  yildirimeldiven: { tick(c, n) { if (every('yeT', 10, c.dt)) { const k = aoe(P().x, P().z, 6, 3 * ib() * n, { el: 'zap', src: 'item' }); if (k) { ringFx(P().x, P().y - .6, P().z, 0xffe66a, 6, 18); sfx('zap'); } } } },
  zehireldiven: { tick(c, n) { if (every('zeT', 8.5, c.dt)) { for (const e of tgts(6, 40)) { hurtE(e, 1.5 * ib() * n, 1, { el: 'poison', src: 'item' }); addStatus(e, 'poi', { n: 3, d: Math.max(.5, ib() * .05) }); } ringFx(P().x, P().y - .6, P().z, 0x8fe06a, 6, 16); } } },
  kaneldiven: { tick(c, n) { if (every('keT', 9, c.dt)) { if (aoe(P().x, P().z, 6, 3.15 * ib() * n, { src: 'item' })) { heal($G.P.mh * .075); ringFx(P().x, P().y - .6, P().z, 0xc4302b, 6, 18); } } } },
  lanetlieldiven: { hit(c, n) { if (chance(.05 * n)) addStatus(c.e, 'curse', { d: .1, t: 3 }); } },
  pul: { kill(c) { const Cc = C(); if (!(Cc.expl > 0) || !chance(Cc.expl)) return; const q = c.q; puff(q.x, q.y + 1, q.z, 0x9fe8d8, 12); aoe(q.x, q.z, 5, 10 * Cc.dmg, { src: 'expl' }, c.e); } },
  // ---- mermi ve silah
  korcekirdek: { tick(c, n) { if (every('kcT', 4, c.dt)) { const ts = tgts(24, 4 + 2 * (n - 1)); for (let i = 0; i < 4 + 2 * (n - 1) && ts.length; i++) fireAt(ts[i % ts.length], ib() * .6, { c: 0xff8a3a, home: 1, v: 26 }); } } },
  cakmak: { hurt(c, n) { const ts = tgts(12, 15 + 4 * (n - 1)); for (const e of ts) { hurtE(e, ib() * .5, 0, { el: 'zap', src: 'item' }); addStatus(e, 'stun', { t: .4 }); VFX.zap(e.m.position.x, e.m.position.y + 1, e.m.position.z); } if (ts.length) sfx('zap'); } },
  hortlak: { tick(c, n) { const S = IS(), d = Math.hypot($G.P.vx, $G.P.vz) * c.dt; S.hortD = (S.hortD || 0) + d; if (S.hortD >= 14) { S.hortD = 0; for (let i = 0; i < n; i++) fireAt(near(26), ib(), { c: 0xb8c8ff, home: 1, v: 20, prc: 2 }); } } },
  albasti: { shrine(c, n) { albSummon(3 + n); }, chest(c, n) { albSummon(3 + n); }, pick(c, n) { if (c.shop) albSummon(3 + n); } },

  bicici: { kill(c, n) { const ts = tgts(26, 2); for (let i = 0; i < 2 && ts.length; i++) fireAt(ts[i % ts.length], ib() * .8 * n, { c: 0xb8a0ff, home: 1, v: 28 }); } },
  kaktus: { hurt(c, n) { const ts = tgts(16, 2 * n); for (let i = 0; i < 2 * n && ts.length; i++) fireAt(ts[i % ts.length], 5 * C().dmg, { c: 0x8fd06a, v: 34, sz: .5 }); } },
  fici: { hurt(c, n) { for (const e of tgts(7 + (n - 1), 60)) addStatus(e, 'poi', { n: 5, d: Math.max(.5, ib() * .05) }); puff(P().x, P().y + .5, P().z, 0x8fe06a, 12); } },
  kazan: { calc(L, n) { let w = 0; for (let i = 0; i < n; i++) w += Math.max(2, 10 - i); $G.P.wmax += w; } },
  kulah: { calc(L, n) { let t = 0; for (let i = 0; i < n; i++) t += Math.max(2, 10 - i); $G.P.tmax += t; } },
  ocakbasi: { tick(c, n) { if (Math.hypot($G.P.vx, $G.P.vz) < .5 && !$G.P.air) heal(18 * n * c.dt); } },
  // ---- can, zırh, savunma
  pehlivanyuzuk: { calc(L, n, c1) { addStats(L, { dmg: .2 * n * c1.hp / 100 }); } },
  lahmacun: { kill(c, n) { if (chance(.02 + .01 * (n - 1))) { const q = c.e.m.position; dropPU(q.x, q.z, 'heal'); } } },
  kitap: { tick(c, n) { if (every('kitapT', .5, c.dt)) { if (aoe(P().x, P().z, 4, ib() * .4 * n, { src: 'item', dot: 1 })) VFX.mote(P().x, P().y + 1, P().z, 0xfff0c0, 2); } } },
  dikenlikalkan: { calc(L, n, c1) { addStats(L, { thorns: 200 * c1.arm * n }); } },
  maske: { hurt(c, n) { if (c.src && C().thorns > 0) { const q = c.src.m.position; aoe(q.x, q.z, 3, C().thorns * .5, { src: 'thorns', dot: 1 }, c.src); } } },
  kefen: {
    evade(c, n) { const S = IS(); S.phN = Math.min(4, (S.phT > 0 ? S.phN || 0 : 0) + 1); S.phT = 5; burst(5, 1.1, 1); calc(); },
    calc(L) { const S = IS(); if (S.phT > 0 && S.phN) addStats(L, { 'aspd*': .25 * S.phN, 'dmg*': .5 * S.phN }); },
    tick(c) { const S = IS(); if (S.phT > 0) { S.phT -= c.dt; if (S.phT <= 0) { S.phN = 0; calc(); } } }
  },
  pelerin: { hurt(c, n) { const S = IS(); S.ccN = Math.min(2, (S.bT > 0 ? S.ccN || 0 : 0) + 1); burst(3, 1 + .3 * S.ccN, 1); } },
  ayna: { hurt(c, n) { const S = IS(); if ((S.aynaT || 0) > 0) return; S.aynaT = Math.max(4, 8 - (n - 1)); aoe(P().x, P().z, 5, c.d * (1 + .25 * n), { src: 'item' }); ringFx(P().x, P().y - .5, P().z, 0xcfe0ff, 5, 20); }, tick(c) { const S = IS(); if (S.aynaT > 0) S.aynaT -= c.dt; } },
  altinkalkan: { hurt(c, n) { const g = (6 + Math.min(20, $G.P.lv * .2)) * n; $G.P.gold += g; $G.P.goldT += g; } },
  gazmaske: {
    calc(L, n, c1) { let k = 0; for (const e of $G.E) if (!e.dead && hasStatus(e, 'poi')) k++; addStats(L, { arm: Math.min(.4, .005 * k * n), overheal: Math.min(.25, .005 * k * n) }); },
    tick(c) { if (every('gazT', 1, c.dt)) calc(); }
  },
  bukuk: {
    hurt(c, n) { const S = IS(); if ($G.P.hp < $G.P.mh * .5 && !(S.bukT > 0)) { S.bukT = 10; $G.P.frz = Math.max($G.P.frz || 0, Math.min(15, 8 + 2 * n)); burst(Math.min(15, 8 + 2 * n), 1, 2); sfx('freeze'); toast('Zaman büküldü'); } },
    tick(c) { const S = IS(); if (S.bukT > 0) S.bukT -= c.dt; }
  },
  // hp > 0 koşulu: öldürücü darbede canı 1'e çekip oyuncuyu diriltiyordu
  keloglan: { hurt(c, n) { if ($G.P.hp > 0 && chance(.25 * n)) { $G.P.hp = Math.max(1, $G.P.hp - $G.P.mh * .05); inc('kevin'); puff(P().x, P().y + 1.2, P().z, 0xffd36a, 6); } } },
  erlikkan: { kill(c, n) { const S = IS(); S.dblood = Math.min(100 * n, (S.dblood || 0) + .5 * n); if ((S.dbloodK = (S.dbloodK || 0) + 1) % 10 == 0) calc(); }, calc(L) { addStats(L, { hp: IS().dblood || 0 }); } },
  muhur: {
    hurt(c, n) { /* ölümcül darbe hurtP içinde yakalanır (muhurSave) */ },
    tick(c) { const S = IS(); if (S.muhT > 0) S.muhT -= c.dt; }
  },
  // ---- hareket
  paten: { calc(L, n, c1) { addStats(L, { aspd: Math.min(.4 * n, Math.max(0, c1.spd - 1) * .8) }); } },
  carik: { tick(c, n) { const S = IS(); S.carik = (S.carik || 0) + Math.hypot($G.P.vx, $G.P.vz) * c.dt * .1 * n; if (S.carik >= 1) { const g = Math.floor(S.carik); S.carik -= g; $G.P.gold += g; $G.P.goldT += g; } } },
  // ---- ekonomi, şans, tecrübe
  yesilkese: { calc(L, n) { addStats(L, { luck: .02 * n * $G.P.opened }); } },
  yanki: { pick(c, n) { if (c.ty == 'xp' && chance(.12 * n)) c.v *= 2; } },
  bilgelik: { pick(c, n) { if (c.ty == 'xp' && c.q) aoe(c.q.x, c.q.z, 3, ib() * .5 * n, { src: 'item', dot: 1 }); } },
  hortumtas: { tick(c, n) { if (every('htT', 30, c.dt)) { for (const o of $G.G) o.pull = 1; toast('Hortum Taşı: kristaller sana geliyor'); } } },
  cekic: {},
  fener: { stage(c, n) { c.sh += 2 * n; }, tick(c, n) { if (every('fenT', 1, c.dt)) for (const s of $G.SH) { if (!s.d || (s.t != 0 && s.t != 5)) continue; const q = s.m.position; if (Math.hypot(q.x - P().x, q.z - P().z) < 6) { heal($G.P.mh * .025 * n); break; } } } },
  balkabagi: { stage(c, n) { c.pots += 8 * n; } },
  hortlakfener: { tick(c, n) { if (every('hfT', Math.max(10, 45 - 3 * (n - 1)), c.dt)) { const R = 10 + 10 * (n - 1); aoe(P().x, P().z, R, 3 * ib(), { src: 'item', w: 'hortlakfener' }); ringFx(P().x, P().y - .5, P().z, 0xfff0b0, R, 30); sfx('nova'); } } }
};

// yardımcılar: diğer modüllerin okuduğu eşya etkileri
export function potMul() {
  return 1 + .18 * itemCount('balkabagi');
}

export function shrineRate() {
  return 1 + .04 * itemCount('cekic');
}

export function shrineReward() {
  return 1 + .075 * itemCount('cekic');
}

export function extraLines() {
  return itemCount('ors') ? 1 : 0;
}

export function itemCount(k) {
  return $G.P && $G.P.I[k] || 0;
}

// Eşya ekler, tekil sınırını uygular, statları yeniler. Dönüş: gerçekten eklenen adet.
export function addItem(k, n = 1) {
  const d = ITD[k];
  if (!d) return 0;
  const cur = $G.P.I[k] || 0,
    add = d.u ? Math.max(0, Math.min(n, 1 - cur)) : n;
  if (add > 0) {
    $G.P.I[k] = cur + add;
    calc();
  }
  return add;
}

export function remItem(k, n = 1) {
  const cur = $G.P.I[k] || 0;
  if (!cur) return 0;
  const rm = Math.min(n, cur);
  if (cur - rm <= 0) delete $G.P.I[k];else $G.P.I[k] = cur - rm;
  calc();
  return rm;
}

export function fireHook(name, ctx) {
  const I = $G.P && $G.P.I;
  if (!I) return ctx;
  for (const k in I) {
    const h = IH[k];
    if (h && h[name]) h[name](ctx, I[k]);
  }
  heroHook(name, ctx);
  // Tılsımlı Kandil: vuruş kancaları bir kez daha
  if (name == 'hit' && I.kandil) {
    ctx.again = 1;
    for (const k in I) {
      const h = IH[k];
      if (h && h.hit && k != 'kandil') h.hit(ctx, I[k]);
    }
    ctx.again = 0;
  }
  if (name == 'tick') {
    const S = $G.P.IS;
    if (S && S.bT > 0) {
      S.bT -= ctx.dt;
      if (S.bT <= 0) {
        S.bS = 1;
        S.bD = 1;
      }
    }
  }
  if (name == 'hit') {
    const S = $G.P.IS;
    if (S && S.bT > 0 && S.bD > 1) ctx.d *= S.bD;
  }
  return ctx;
}

// Stat hesabı sırasında eşya katkıları (calc kancaları)
export function itemCalc(L, c1) {
  const I = $G.P && $G.P.I;
  if (!I) return;
  for (const k in I) {
    const h = IH[k];
    if (h && h.calc) h.calc(L, I[k], c1);
  }
}

export function itemsClear() {
  const S = $G.P && $G.P.IS;
  if (S && S.gh) for (const g of S.gh) kill(g.m);
  if ($G.P) $G.P.IS = {};
}
