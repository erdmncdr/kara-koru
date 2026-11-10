// game/enemies.js · Kara Koru
// Bu dosya tek dosyalık sürümden (v22) otomatik ayrıldı. Ortak oyun durumu core/store.js içindeki $G nesnesinde.

import { $G } from '../core/store.js';
import { SET } from '../core/settings.js';
import { THREE } from '../engine/three.js';
import { sfx, sfxAt } from '../audio/engine.js';
import { rmE, toast, tip } from '../core/helpers.js';
import { $, cl, rn } from '../core/util.js';
import { TY, saveMeta } from '../data/content.js';
import { critMul } from '../data/stats.js';
import { EL_CLS, STATUS, addStatus, stInit } from './status.js';
import { fireHook, heal } from './items.js';

// element → gösterilecek durum rengi
const EL_ST = { fire: 'burn', ice: 'frz', poison: 'poi', curse: 'curse' };
import { BMc, mk, sc } from '../engine/renderer.js';
import { VFX, dmgNum, flash, gRing, puff, unflash, ringFx } from '../engine/vfx.js';
import { NOM, mkE } from './creatures.js';
import { iskinMat } from '../engine/iskin.js';
import { graveDone } from './features.js';
import { BDMAT, GDMAT, GHM2, GHM3, GHMAT, SVMAT, drop, mkChest } from './objects.js';
import { BN, DMK, MBN, diff, diffMul, ghostHp, svOdul, xpK } from './stats.js';
import { BOSS_ST, TIERM, bossIdx, bossTime, isLast, stLen, winRun } from './run.js';
import { CR } from './heroes.js';
import { KINDS, ROSTER } from '../data/enemies.js';
import { bossDied } from './bosses.js';
import { guardMul, gyKill } from './graveyard.js';
import { chalFlag } from './challenge.js';
import { aegisHit } from './weapons2.js';
import { inc } from '../data/content.js';
import { over } from '../ui/menus.js';
import { groundTop } from '../world/terrain.js';

export let KBM;

// ---- düşmanlar
// Haritanın listesinden, aşama saatine göre açılmış türlerden ağırlıklı seçim
export function pickType() {
  const t = $G.P.stT + $G.P.stage * 240,
    // Son Dalga'da Mavi İskelet doğmaz: her biri tam bir seviye veriyor, dakikada binlerce öldürmede seviye 10 dakikada
    // 124'ten 483'e çıkıyor ve hasar Albastıların canını geçiyordu (sıralama build'i değil süreyi ölçüyordu)
    r = (ROSTER[$G.P.map] || ROSTER.koru).filter(e => t >= e.at && !($G.P.swarm && KINDS[e.k] && KINDS[e.k].fx && KINDS[e.k].fx.xpdrop)),
    s = r.reduce((a, e) => a + e.w, 0);
  let x = Math.random() * s;
  for (const e of r) {
    x -= e.w;
    if (x <= 0) return e.k;
  }
  return r[0] ? r[0].k : 'gulyabani';
}

// t: taban sınıf (0-5) ya da tür anahtarı (KINDS); o.kind görünüm türü
export function spawn(t, o = {}) {
  let kd = null;
  if (typeof t == 'string') {
    kd = KINDS[t] || KINDS.gulyabani;
    t = kd.t;
  } else if (o.kind) kd = KINDS[o.kind] || null;
  if (kd && !o.nm && (o.mini || kd.fx && kd.fx.kefen)) o.nm = kd.n;
  const a = Math.random() * 6.283,
    d = t == 3 ? 55 : rn(55, 70);
  let x = o.x != null ? o.x : $G.P.x + Math.cos(a) * d,
    z = o.z != null ? o.z : $G.P.z + Math.sin(a) * d;
  if (Math.abs(x) > 270) x = $G.P.x - Math.cos(a) * d;
  if (Math.abs(z) > 270) z = $G.P.z - Math.sin(a) * d;
  x = cl(x);
  z = cl(z);
  const y = kd && kd.hp != null && !o.boss ? { ...TY[t], ...kd } : TY[t],
    gm = o.ghost || kd && kd.ghost || 0,
    el = !o.ghost && !o.thief && !(kd && kd.fx && (kd.fx.pylon || kd.fx.static)) && (o.el || t < 3 && $G.P.stT + $G.P.stage * 240 > 60 && Math.random() < .006 * ($G.P.C.elspawn || 1)),
    sc2 = (o.mini ? 1.9 : el ? 1.5 : o.fin ? 1.15 : 1) * (kd && kd.sc || 1) * ($G.P.C.enSz || 1),
    r = y.r * sc2,
    u = mkE(t, o.fin, kd);
  u.g.rotation.order = 'YXZ';
  u.g.position.set(x, $G.HT(x, z), z);
  u.g.scale.setScalar(r / NOM[t]);
  if (el && !o.mini) tip('elite', 'Elit düşman', 'Altın halkalı ve taçlı: canı 6 kat, hasarı 1.5 kat, tecrübesi 10 kat. Öldürünce bazen sandık bırakır.');
  if (el || o.mini) {
    const rg = mk($G.gElR || ($G.gElR = new THREE.TorusGeometry(1.3, .08, 6, 20)), BMc(0xc9a24a), 0, .2, 0, u.g);
    rg.rotation.x = Math.PI / 2;
    rg.userData.ring = 'el';
    if (el && u.b && u.b.hd) {
      // elit tacı (Megabonk crown marker)
      const hb = u.b.hd, cr = mk($G.gElC || ($G.gElC = new THREE.CylinderGeometry(.26, .2, .16, 6, 1, true)), BMc(0xffd040), 0, .32, 0, hb);
      cr.userData.ring = 'el';
      u.g.userData.crown = cr;
    }
  }
  u.g.traverse(m => m.castShadow = t >= 2 && !gm);
  if (gm || o.thief || o.bandit) {
    const mt = gm ? [GHMAT, GHMAT, GHM2, GHM3][gm] || GHMAT : o.thief ? o.silv ? SVMAT : GDMAT : BDMAT;
    u.g.traverse(m => {
      if (m.isSkinnedMesh) m.material = mt;
    });
    if (u.inst) iskinMat(u, mt, t);
  }
  sc.add(u.g);
  if (o.boss && !o.twin) {
    toast(BN() + ' geldi. Devirirsen kapıda geçit açılır.');
    sfx('boss');
    // geliş: kamera sarsıntısı, yerde genişleyen halka ve toz; kısa bir an yavaşlama
    $G.shk = Math.max($G.shk, 1.1);
    $G.HS = Math.max($G.HS, .18);
    const gy = $G.HT(o.x, o.z);
    ringFx(o.x, gy + .15, o.z, 0xff7a3a, 14, 22);
    VFX.dust(o.x, gy + .2, o.z, 26, $G.BI ? 0xb08a6a : 0x7a6e58, 9);
  }
  if (o.mini) {
    tip('mini', 'Ara boss', 'Mini haritada kuru kafayla görünür. Öldürürsen sandık düşürür; 25 saniyede devirirsen Kartal Gözü görevi sayılır.');
    toast((o.nm || (o.bandit ? 'Kara Haydut' : MBN[t])) + (o.grave ? ' mezardan kalktı. Devirirsen ruh huzura erer.' : ' geliyor. Öldürürsen sandık düşürür.'));
    sfx('growl');
  }
  const D = diff() * (chalFlag('scale') || 1),
    bhp = o.boss && o.bp && o.bp.hp ? o.bp.hp : o.bandit ? 11000 : o.mini && kd && kd.bhp ? kd.bhp : 0,
    bd = o.boss && o.bp && o.bp.d ? o.bp.d : o.bandit ? 50 : o.mini && kd && kd.bd ? kd.bd : 0,
    dsc = 1 + (diffMul() - 1) * .5, // zorluk hasara yarı oranda işler
    hp = bhp ? bhp * (o.boss && o.bp && o.bp.hp ? BOSS_ST[Math.min(2, $G.P.stage)] * bossTime() : 1) * (o.keyDrop ? guardMul() : 1) * diffMul() * ($G.P.C.enHp || 1) * ($G.P.C.enScale || 1) * (o.twin ? .6 : 1) * (o.boss ? chalFlag('bossHp') || 1 : 1) * (o.hk && o.hk < 100 ? o.hk : 1) : ($G.P.C.enHp || 1) * ($G.P.C.enScale || 1) * (t == 3 ? (2200 + $G.P.stT * 4) * (1 + $G.P.stage * 1.8) * Math.pow(1.35, Math.max(0, $G.P.stage - 1)) * (TIERM[$G.P.tier - 1] || 1) * diffMul() * (o.twin ? .6 : 1) * (o.boss ? chalFlag('bossHp') || 1 : 1) * (o.hk || 1) : y.hp * D * (o.mini ? o.bandit ? 20 : 14 : el ? 6 : o.ghost ? 10 * [1, 1, 2, 4][o.ghost | 0] * ghostHp() : o.thief ? 4 : 1) * (o.hk || 1)),
    dmg = bd ? ($G.P.C.enDmg || 1) * bd * dsc * (1 + $G.P.C.curse * .5) : ($G.P.C.enDmg || 1) * y.d * DMK() * dsc * (o.dk || 1) * (el ? 1.5 : 1) * (o.mini ? 1.4 : 1) * (o.ghost ? 2.2 * [1, 1, 1.4, 2][o.ghost | 0] : 1) * (o.thief ? 0 : 1) * (1 + $G.P.C.curse * .5);
  const en = {
    m: u.g,
    u,
    t,
    hp,
    mh: hp,
    dmg,
    r,
    f: 0,
    oh: 0,
    s: rn(0, 6),
    sh: 2,
    st2: 3,
    sm: 8,
    slam: 0,
    ba: r / NOM[t],
    el,
    fin: o.fin,
    boss: o.boss,
    mini: o.mini,
    tag: o.tag,
    ghost: o.ghost,
    thief: o.thief,
    silv: o.silv,
    bandit: o.bandit,
    twin: o.twin,
    nm: o.nm,
    grave: o.grave,
    kd,
    kind: kd ? kd.k : null,
    yd: y,
    bp: o.bp || null,
    keyDrop: o.keyDrop,
    nodrop: o.nodrop,
    spm: 1,
    life: o.thief ? 24 : 0,
    fy: groundTop(x, z),
    vy: 0,
    jt: 0,
    slow: 0,
    cs: 0,
    cc: rn(1, 3),
    ct: 0,
    spawnT: $G.P.tt
  };
  stInit(en);
  $G.E.push(en);
}

export function __init_63() {
  $G.gElR = null;
  KBM = [1, 1.25, .3, 0, 1, .55];
}

// e: düşman, d: ham hasar, noNum: sayı ve itme gösterme, o: { el: element, dot: zamanla hasar }
export function hurtE(e, d, noNum, o) {
  if (e.dead) return;
  if (e.pyInv) {
    // direkler dolmadan boss hasar almaz
    if (!noNum && Math.random() < .08) { const n = dmgNum(e.m.position, 0, e.r, 0); if (n) n.textContent = 'Korunuyor'; }
    return;
  }
  const C = $G.P.C,
    el = o && o.el,
    dot = o && o.dot;
  if (el && C[el] != null) d *= C[el];
  if (e.el || e.mini || e.t == 3) d *= C.elite;
  if (e.bloodT > 0) d *= 1.2;
  const hooks = !dot && !(o && o.src);
  // silah ve element kancadan önce yazılır: kanca hedefi öldürürse öldürme o silaha sayılır (k_<silah> görevleri)
  if (o && o.w) e.lastW = o.w;
  if (el) e.lastEl = el;
  // Megabonk Lifesteal: hasarın yüzdesi değil, vuruş başına 1 can iyileşme şansı.
  // %100 ve üstü 1 canı garanti eder, artan pay ikinci can için şanstır (megabonk.wiki Bloody Tome, megabonk.org Stats).
  const steal = () => {
    if (!(C.ls > 0) || dot) return;
    const h = Math.floor(C.ls) + (Math.random() < C.ls % 1 ? 1 : 0);
    if (h) {
      heal(h);
      inc('lsheal', h);
      inc('lsheal_' + CR[$G.CI].k, h);
    }
  };
  if (hooks) d = fireHook('hit', { e, d, el }).d;
  if (e.dead) {
    // kanca hedefi öldürdü: vuruşun oyuncu tarafındaki etkileri (hasar hanesi, can çalma) yine işler, gerisi atlanır
    if (o && o.w) $G.P.wdmg[o.w] = ($G.P.wdmg[o.w] || 0) + d;
    steal();
    return;
  }
  if (o && o.w) e.lastW = o.w;
  if (el) e.lastEl = el;
  const cm = dot ? 1 : critMul(o && (o.wc || o.wcd) ? { crit: C.crit + (o.wc || 0), critd: C.critd + (o.wcd || 0) } : C),
    ct = cm > 1;
  if (ct) {
    d *= cm;
    if (hooks) d = fireHook('crit', { e, d, cm }).d;
    if (!dot) inc('crit');
  }
  if (CR[$G.CI].k == 'ayaz') d *= 1 + .015 * ($G.frzN || 0); // Noelle: donmuş düşman başına +%1.5 hasar
  // Yankı: yıldırım kritikleri yankı bırakır; yankılı düşmana gelen darbelerin %30'u yarım saniye sonra tekrar vurur
  if (ct && el == 'zap' && !dot && !(e.echoT > 0)) addStatus(e, 'echo', { t: 3 });
  if (e.echoT > 0 && !dot) e.echoQ += d * .3;
  if (!noNum || (dot || o && o.num) && Math.random() < .35) { // num: alan tikleri itmesiz ama ara sıra sayı gösterir
    const n = dmgNum(e.m.position, d, e.r, ct);
    if (n && el && EL_CLS[el]) n.classList.add(EL_CLS[el]);
  }
  steal();
  if (o && o.w) $G.P.wdmg[o.w] = ($G.P.wdmg[o.w] || 0) + d;
  if (!dot) {
    if (C.burn > 0 && Math.random() < C.burn) addStatus(e, 'burn'); // hasar formülü status.js'de
    if (C.freeze > 0 && Math.random() < C.freeze) addStatus(e, 'frz');
  }
  if (e.kd && e.kd.fx && e.kd.fx.arm && !dot) d *= 1 - e.kd.fx.arm; // zırhlı: düz hasarın yarısı
  const q = e.m.position,
    dx = q.x - $G.P.x,
    dz = q.z - $G.P.z,
    dl = Math.hypot(dx, dz) || 1,
    ov = d - e.hp;
  e.hp -= d;
  if (e.kd && e.kd.fx && e.kd.fx.flee) e.fleeT = 3; // kaçan: vurulunca uzaklaşır
  e.f = .1;
  e.hr = .2;
  e.sq = .14;
  flash(e);
  const ms = e.ghost ? 0 : KBM[e.t] * (e.mini ? .35 : e.el ? .6 : 1); // Albastılar geri itilmez
  if (ms > 0 && !noNum) {
    const k = ms * (4 + 16 * Math.min(1, d / e.mh)) * C.kb * (o && o.kb || 1);
    e.kx = (e.kx || 0) + dx / dl * k;
    e.kz = (e.kz || 0) + dz / dl * k;
  }
  if (!noNum || !dot && Math.random() < .25) VFX.hit(q.x, q.y + e.r * 1.05, q.z, ct ? 0xffd36a : el && STATUS[EL_ST[el]] ? STATUS[EL_ST[el]].c : null, e.t, dx / dl, dz / dl, ct);
  if (!dot) sfxAt(ct ? 'crit' : 'hit', q.x, q.z, e.t);
  if (e.hp <= 0) {
    e.ov = ov;
    killE(e);
  }
}

export function die(e) {
  unflash(e);
  if (e.u.tel) e.u.tel.visible = false;
  e.m.scale.setScalar(e.ba);
  const q = e.m.position;
  if ($G.DY.length >= 45) {
    rmE(e.m, e.u);
    return;
  }
  if (e.t != 3 && !e.mini) {
    // minimal ölüm: gövde yerinde kalır, kısa geri sarsılır, 0.4 sn'de erir; birkaç kül zerresi
    const dx = q.x - $G.P.x,
      dz = q.z - $G.P.z,
      dl = Math.hypot(dx, dz) || 1;
    $G.DY.push({
      m: e.m,
      u: e.u,
      ty: e.t,
      t: .55,
      d0: .55,
      melt: 1,
      s: e.ba,
      vx: dx / dl * 2.5,
      vz: dz / dl * 2.5
    });
    VFX.emit(VFX.ALP, q.x, q.y + e.r * .6, q.z, { n: 6, sp: [.5, 2], up: 1.5, life: [.5, .9], s: [.08, .16], s1: .3, c: $G.BI == 2 ? 0x9a8ad0 : 0x4a3a30, g: 1, d: 1 });
  } else $G.DY.push({
    m: e.m,
    t: e.boss ? 2.6 : 1.1,
    d0: e.boss ? 2.6 : 1.1,
    s: e.ba,
    u: e.u,
    ty: e.t,
    big: 1
  });
}

export function killE(e) {
  // bir vuruş kancası (Buz Küpü, infaz eşyası) hedefi öldürdükten sonra dıştaki vuruş onu ikinci kez öldürmesin:
  // öldürme sayısı, ganimet, tecrübe ve Mahzen anahtarı çiftleniyordu
  if (e.dead) return;
  e.dead = 1;
  $G.kills++;
  gyKill(e);
  bossDied(e);
  if ($G.P.pgT > 0) {
    $G.P.gold++;
    $G.P.goldT++;
  }
  if ($G.P.torT) inc('tork');
  if (e.mini && $G.P.tt - (e.spawnT || 0) < 25) inc('minifast');
  if ((e.mini || e.boss) && $G.P.tt - (e.spawnT || 0) < 1 && CR[$G.CI].k == 'cali') inc('sheriff'); // Şerif Şapkası (eskiden Tunç)
  if (e.lastW == 'mines' && $G.P.air && CR[$G.CI].k == 'anka') inc('pilot');
  if (Math.hypot($G.P.vx, $G.P.vz) < .5 && !$G.P.air) inc('stillk');
  if (e.lastEl) inc('k_el_' + e.lastEl);
  inc('kmap_' + $G.P.map);
  if (e.kind) {
    inc('k_kind_' + e.kind);
    if (e.el) inc('k_el');
    if (e.ghost) inc('k_ghost');
    if (e.kind == 'ruhalevi' && CR[$G.CI].k == 'kam') inc('kam_ruhalevi');
    if (e.kd.fx && e.kd.fx.xpdrop) {
      // Mavi İskelet: bir seviye atlatacak kadar ruh kristali; `SVD.odul` seviyesinden sonra o seviyenin gereği kadar
      // (stats.js svOdul). Kristal değeri bütün tecrübe çarpanlarına (Lanet payı, etkinlik) bölünür: eskiden Lanet'in payı
      // bölünmüyordu ve lanetli build'de tek Mavi İskelet birkaç seviye veriyordu.
      const q = e.m.position, sv = svOdul(), tam = sv >= $G.P.need;
      for (let i = 0; i < 6; i++) drop(q.x + rn(-2, 2), q.z + rn(-2, 2), 'xp', Math.ceil(sv / 6 / Math.max(.01, $G.P.C.xp * xpK())), e.fy);
      toast(tam ? 'Mavi İskelet seviye bıraktı' : 'Mavi İskelet tecrübe bıraktı');
    }
    if (e.lastW == 'thorns' && e.kind == 'kaktus') inc('thorn_kaktus');
    if (e.kd.fx && e.kd.fx.frog) {
      inc('frog' + Math.min(2, $G.P.stage));
      toast(['Yeşil', 'Mavi', 'Kızıl'][Math.min(2, $G.P.stage)] + ' Kurbağa yakalandı: şapkası Otağ’da');
    }
  }
  if (e.bloodT > 0) heal($G.P.mh * .02);
  if (e.lastW) inc('k_' + e.lastW);
  inc('kc' + $G.CI);
  inc('kt' + e.t);
  if ($G.P.air) inc('airk');
  if (CR[$G.CI].k == 'kam' && $G.P.I.maske) inc('maskk'); // Soytarı Şapkası (eskiden Umay)
  if (e.el || e.mini) $G.P.scyC = 1;
  if (e.mini) inc('mbk');
  if (Math.random() < .0001 && !$G.META.l.t_luck) inc('lucky');
  // konum kopyalanır: ölüm listesi doluyken die() modeli havuza hemen iade eder ve konumunu (0, -10000, 0) yapar;
  // ganimet ve sandık o zaman haritanın merkezinin altına düşüyordu
  const q = e.m.position.clone(),
    y = e.yd || TY[e.t],
    fy = e.fy;
  $G.DSRC = {
    x: q.x,
    y: q.y + e.r * 1.2,
    z: q.z
  };
  VFX.die(q.x, q.y, q.z, e.t, e.r, e.t == 3 || e.mini || e.el);
  die(e);
  sfxAt(e.t != 3 && e.t != 2 && !e.mini ? 'bonk' : 'kill', q.x, q.z, e.t);
  if (e.t != 3 && e.t != 2 && !e.mini && Math.random() < .3) sfxAt('kill', q.x, q.z, e.t);
  if (e.t == 3) {
    $G.HS = Math.max($G.HS, .3);
    $G.shk = Math.max($G.shk, .8);
  } else if (e.mini || e.el) {
    $G.HS = Math.max($G.HS, .07);
    $G.shk = Math.max($G.shk, .22);
  }
  if (e.t == 3) {
    for (let i = 0; i < 30; i++) drop(q.x + rn(-5, 5), q.z + rn(-5, 5), 'xp', 6 + $G.P.stage * 4, fy);
    for (let i = 0; i < 12; i++) drop(q.x + rn(-4, 4), q.z + rn(-4, 4), 'au', 6 + $G.P.stage * 4, fy);
    $G.DSRC = null;
    sfx('loot');
    mkChest({
      x: q.x,
      z: q.z,
      y: fy,
      free: 1,
      gold: e.mini ? 1 : 0
    });
    if (e.boss) for (const o of $G.G) o.pull = 1; // Megabonk: boss sandığı haritadaki bütün tecrübeyi çeker
    $G.P.hp = Math.min($G.P.mh, $G.P.hp + 40);
    $G.shk = Math.max($G.shk, e.boss ? 1.6 : .7);
    if (e.boss) {
      // ölüm vuruşu: yarım saniye yavaş çekim, iki halka, kıvılcım
      $G.HS = Math.max($G.HS, .55);
      ringFx(q.x, fy + .15, q.z, 0xffd36a, 18, 26);
      setTimeout(() => ringFx(q.x, fy + .15, q.z, 0xff7a3a, 24, 30), 180);
      VFX.emit(VFX.ADD, q.x, q.y + e.r, q.z, { n: 40, sp: [6, 16], up: 4, life: [.6, 1.2], s: [.25, .5], s1: .1, c: 0xffd36a, g: 18, d: 1 });
      $G.P.bosses++;
      // süreli sayaçlar saat ileri alınmadan önce ölçülür (yoksa 'fast' ve 'boss30' hiç sayılmıyordu)
      const bossEl = $G.P.stT - ($G.P.stS || 0);
      // Kara sunak kopyası yaşıyorsa saat ileri alınmaz: Hızlı Koşucu'da kapı hâlâ kapalıyken süre dolmuş sayılıp koşu bitiyordu
      const others = $G.E.some(o => o !== e && o.boss && !o.dead);
      if (!others && !$G.P.final && !$G.ARENA && $G.P.stT < stLen() - 10) {
        // Megabonk: boss ölünce kalan süre gider, 10 saniye sonra Son Dalga başlar
        $G.P.stT = stLen() - 10;
        if (!isLast()) toast('Boss devrildi: 10 saniye sonra Uzatma. Geçit açık, sonraki diyara geç.');
      }
      inc('bossk_' + $G.P.map + bossIdx());
      if (!Object.keys($G.P.I).length && !$G.P.puN && !$G.P.shUsed) inc('pure');
      if (bossEl < 300) inc('fast');
      if (bossEl < 30) inc('boss30');
      if ($G.P.hp < $G.P.mh * .1) inc('bosslow');
      if (e.lastW == 'aegis' && CR[$G.CI].k == 'alp') inc('aegisboss_alp'); // Şaman Maskesi (eskiden Umay)
      if (e.kind == 'hortlakboss' && e.lastW == 'hortlakfener') inc('lampboss');
      if (e.kind == 'hortlakboss' && CR[$G.CI].k == 'kemik' && $G.P.tt - ($G.P.bossT0 || 0) < 60) inc('sunglasses');
      if ($G.P.bosses == 1 && $G.P.tt < 360) inc('fast6c' + $G.CI);
      if (!$G.P.stDmg) inc('bossclean');
      inc('boss_' + CR[$G.CI].k);
      for (let i = 0; i < 3 + $G.P.stage; i++) drop(q.x + rn(-3, 3), q.z + rn(-3, 3), 'sv', 1 + Math.floor($G.P.stage / 2), fy);
      if ($G.E.some(o => o !== e && !o.dead && o.boss)) toast('Bir ' + BN() + ' daha ayakta');else if (isLast()) winRun();else if ($G.GATE) {
        $G.GATE.st = 2;
        $G.GATE.por.visible = $G.GATE.sw.visible = true;
        $G.GATE.rn.material = BMc(0x9fe8d8);
        toast(BN() + ' devrildi. Kapıda sonraki aşamanın geçidi açıldı.');
        sfx('portal');
      }
    }
    return;
  }
  if (e.thief && e.silv) {
    $G.P.svk = ($G.P.svk || 0) + 1;
    for (let i = 0; i < 16; i++) drop(q.x + rn(-3, 3), q.z + rn(-3, 3), 'xp', 3 + $G.P.stage * 2, fy);
    $G.P.xp = Math.max($G.P.xp, Math.min($G.P.need, $G.P.xp + svOdul())); // tam seviye, en çok svOdul kadar
    drop(q.x, q.z, 'sv', 1 + $G.P.stage, fy);
    $G.DSRC = null;
    toast($G.P.xp >= $G.P.need ? 'Gümüş iskeleti yakaladın: seviye atlıyorsun' : 'Gümüş iskeleti yakaladın: tecrübe kazandın');
    sfx('loot');
    return;
  }
  if (e.thief) {
    $G.P.thf = ($G.P.thf || 0) + 1;
    for (let i = 0; i < 14; i++) drop(q.x + rn(-3, 3), q.z + rn(-3, 3), 'au', 4 + $G.P.stage * 3, fy);
    drop(q.x, q.z, 'sv', 2 + $G.P.stage, fy);
    $G.DSRC = null;
    mkChest({
      x: q.x,
      z: q.z,
      y: fy,
      free: 1
    });
    toast('Altın yarasayı yakaladın');
    sfx('loot');
    return;
  }
  if (e.nodrop) {
    $G.DSRC = null;
    return;
  }
  drop(q.x + rn(-1.4, 1.4), q.z + rn(-1.4, 1.4), 'xp', y.xp * (e.el ? 10 : e.mini ? 12 : 1), fy);
  if (e.kd && e.kd.fx && e.kd.fx.gold) for (let i = 0; i < 5; i++) drop(q.x + rn(-2, 2), q.z + rn(-2, 2), 'au', 3 + $G.P.stage * 2, fy);
  if (e.el || e.mini || Math.random() < .35) {
    sfxAt('loot', q.x, q.z);
    drop(q.x + rn(-2, 2), q.z + rn(-2, 2), 'au', e.mini ? 25 : e.el ? 15 : y.au * (1 + Math.floor($G.P.stT / 120) + $G.P.stage), fy);
  }
  if (Math.random() < .025) drop(q.x - .8, q.z, 'hl', 0, fy);
  $G.DSRC = null;
  // sandık düşürme: elit %0.2, sıradan %0.1, düşmedikçe artan zaman çarpanı (P.chF), Sandık düşme statı
  if (e.mini || !e.tag && Math.random() < (e.el ? .002 : .001) * (1 + ($G.P.chF || 0)) * ($G.P.C.chest || 1)) {
    $G.P.chF = 0;
    mkChest({
      x: q.x,
      z: q.z,
      y: fy,
      free: 1
    });
    toast(e.mini ? (e.nm || (e.bandit ? 'Kara Haydut' : MBN[e.t])) + ' bir sandık düşürdü' : e.el ? 'Seçkin düşman bir sandık düşürdü' : 'Düşman bir sandık düşürdü');
  }
  if (e.mini) drop(q.x + 1, q.z, 'sv', e.bandit ? 8 : 3, fy);
  if (e.grave) graveDone(e);
  if (e.bandit) {
    // Eskiden burada Börü bedelsiz açılıyordu (Megabonk eşlemesinden önceki tasarımın kalıntısı); Börü'nün artık kendi
    // koşul görevi (Bozkır Kademe 2 + Kan Büyüsü) ve 32 gümüşlük bedeli var, bu yol ikisini de atlatıyordu.
    $G.P.band = 1;
  }
  if (e.tag) {
    e.tag.left--;
    if (e.tag.left <= 0) {
      const s = e.tag.m.position;
      mkChest({
        x: s.x + 3,
        z: s.z,
        free: 1,
        gold: 1
      });
      toast('Kan sunağı tamamlandı. Altın sandık seni bekliyor.');
    }
  }
  fireHook('kill', { e, q });
}

// d: ham hasar, src: vuran düşman (diken ve Kalkan engellemesi için).
// sure: durum etkisinin (zehir, yanma) bitirdiği ya da kuralın zorladığı ölüm; kaçınma ve engelleme işlemez.
export function hurtP(d, src, sure) {
  if ($G.P.inv > 0 || $G.P.shieldT > 0 || $G.S != 'play') return;
  if (src && !src.dead && $G.P.C.thorns > 0) hurtE(src, $G.P.C.thorns, 1, { src: 'thorns', dot: 1, w: 'thorns' });
  if (!sure && Math.random() < $G.P.C.eva) {
    const el = dmgNum({
      x: $G.P.x,
      y: $G.P.y,
      z: $G.P.z
    }, 0, .5, 0);
    if (el) el.textContent = 'Kaçındın';
    $G.P.inv = .3;
    sfx('jump');
    fireHook('evade', { src });
    inc('evade');
    return;
  }
  if (!sure && $G.P.C.block && $G.P.blockT <= 0) {
    $G.P.blockT = 10 / $G.P.C.block;
    $G.P.inv = .5;
    inc('tblock');
    puff($G.P.x, $G.P.y + .5, $G.P.z, 0xd9b26a, 12);
    sfx('deny');
    return;
  }
  if (!sure && aegisHit(src)) return;
  // boss darbesi zırhın yarısını, final boss dörtte üçünü deler; 'Alınan hasar' çarpanı en sonda.
  // Son Dalga'da bütün darbeler (mermiler dahil) yarısını deler: sandıklarla zırhı %100'e çıkan build Son Dalga'da
  // hiç hasar almadan 40 dakikayı dolduruyordu.
  const pen = src && src.t == 3 ? src.boss && $G.P.final ? .75 : .5 : $G.P.swarm ? .5 : 0,
    armE = $G.P.C.armE * (1 - pen);
  let dd = Math.max(armE >= 1 ? 0 : 1, d * (1 - armE) * ($G.P.C.dmgred || 1));
  if (CR[$G.CI].k == 'alp') inc('armblk', d - dd);
  if (dd <= 0) {
    $G.P.inv = .3;
    sfx('deny');
    fireHook('hurt', { d, shield: 1 });
    return;
  }
  $G.P.noDmgT = 0;
  // kalkan puanı önce erir
  if ($G.P.shd > 0) {
    const a = Math.min($G.P.shd, dd);
    $G.P.shd -= a;
    dd -= a;
    if (dd <= 0) {
      $G.P.inv = .5;
      sfx('deny');
      fireHook('hurt', { d, shield: 1 });
      return;
    }
  }
  if (src && src.kd && src.kd.fx) {
    const f = src.kd.fx;
    if (f.poi) $G.P.poiT = Math.max($G.P.poiT || 0, 4);
    if (f.burn) $G.P.burnT = Math.max($G.P.burnT || 0, 3);
    if (f.frz) $G.P.slowT = Math.max($G.P.slowT || 0, 2);
    // boss zehri: daha ağır, sönmeyen (Megabonk BossPoison)
    if (f.poi && src.t == 3) $G.P.bpoiT = Math.max($G.P.bpoiT || 0, 6);
  }
  if (src && src.kind == 'karakoncolos_dev') $G.P.slowT = Math.max($G.P.slowT || 0, 2); // Dev Karakoncolos: 2 sn yavaşlatma
  // haydut darbesi kanatır (Megabonk Bleed): 4 saniye boyunca saniyede azami canın %2'si
  if (src && src.bandit) $G.P.bleedT = Math.max($G.P.bleedT || 0, 4);
  // Zaman Mührü: öldürecek darbede bir kez kurtarır, zaman 15 sn durur
  if ($G.P.I.muhur && !($G.P.IS && $G.P.IS.muhUsed) && $G.P.hp - dd <= 0) {
    ($G.P.IS || ($G.P.IS = {})).muhUsed = 1;
    dd = Math.max(0, $G.P.hp - 1);
    $G.P.frz = Math.max($G.P.frz || 0, 15);
    sfx('freeze');
    toast('Zaman Mührü kırıldı: zaman 15 saniye durdu');
  }
  // koşu özeti için son darbenin kaynağı (ui/menus.js over): tür anahtarı, boss ise 'boss:' önekiyle
  $G.P.sonV = src ? (src.boss ? 'boss:' : src.mini ? 'ara:' : '') + (src.kind || 't' + src.t) : 'cevre';
  $G.P.hp -= dd;
  $G.P.stDmg = 1;
  if ($G.P.fallHit && $G.P.hp <= 0) $G.P.fallDead = 1;
  inc('hurt');
  if (chalFlag('fragile')) $G.P.hp = 0;
  fireHook('hurt', { d, src });
  $G.P.hit = .45;
  $G.P.inv = .15 * ($G.P.C.hurtcd || 1); // decompile: damageCooldownTime 0.15
  $G.shk = Math.max($G.shk, .45);
  sfx('hurt');
  $G.HS = Math.max($G.HS, .06);
  VFX.emit(VFX.ALP, $G.P.x, $G.P.y, $G.P.z, {
    n: 7,
    sp: [2, 5],
    up: 2,
    life: [.3, .6],
    s: [.2, .35],
    s1: 1.3,
    c: 0x8a1a10,
    c1: 0x3a0805,
    g: 14
  });
  if (SET.fl !== 0) {
    $('fl').style.opacity = .35;
    setTimeout(() => $('fl').style.opacity = 0, 120);
  }
  if ($G.P.hp <= 0) {
    if ($G.P.C.revive > $G.P.revived) {
      $G.P.revived++;
      $G.P.hp = $G.P.mh * .5;
      $G.P.inv = 2.5;
      toast('Simurg Tüyü seni diriltti');
      puff($G.P.x, $G.P.y, $G.P.z, 0xeda93a, 30);
      return;
    }
    over();
  }
}

export function bossSlam(e) {
  const q = e.m.position,
    o = mk(gRing, new THREE.MeshBasicMaterial({
      color: 0xff6a3a,
      transparent: true,
      side: 2,
      opacity: .85
    }), q.x, e.fy + .35, q.z);
  o.rotation.x = -Math.PI / 2;
  $G.SW.push({
    m: o,
    x: q.x,
    z: q.z,
    y: e.fy,
    r: 2,
    mx: 34,
    hit: 0
  });
  $G.shk = Math.max($G.shk, .6);
  sfx('slam');
  puff(q.x, e.fy + .5, q.z, 0x8a6a4a, 24);
  if (!$G.P.slamHint) {
    $G.P.slamHint = 1;
    toast('Şok dalgası geliyor. Üstünden zıpla ya da bir platforma çık.');
  }
}

// ---- etkileşim
