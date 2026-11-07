// game/interact.js · Kara Koru
// Bu dosya tek dosyalık sürümden (v22) otomatik ayrıldı. Ortak oyun durumu core/store.js içindeki $G nesnesinde.

import { $G } from '../core/store.js';
import { sfx } from '../audio/engine.js';
import { ov, toast, tip } from '../core/helpers.js';
import { rn } from '../core/util.js';
import { ITD, PUD, RAR, SBD, SHC, STATS, inc, saveMeta } from '../data/content.js';
import { setLin } from '../engine/color.js';
import { BMc, sc } from '../engine/renderer.js';
import { VFX, puff, ringFx } from '../engine/vfx.js';
import { spawn } from './enemies.js';
import { hitKos, wakeGrave } from './features.js';
import { nextStage, qCheck } from './flow.js';
import { mkPU, price } from './objects.js';
import { BN, calc, itemOf, rollItemR } from './stats.js';
import { back, buildHTML, card, choose, itemOpt, mkOpt, sbOpt, showItem } from '../ui/cards.js';
import { rmObs } from '../world/terrain.js';
import { addItem, fireHook, remItem } from './items.js';
import { exitRun } from './run.js';
import { BOSSP } from '../data/enemies.js';
import { bushUse, cageUse, coffinUse, gyKeysOk } from './graveyard.js';
import { chalApply, chalDone, chalFlag } from './challenge.js';
import { CHAL } from '../data/challenges.js';
import { A } from '../ui/actions.js';

export let kzOk;

// ---- etkileşim
export function interact(auto) {
  if ($G.S != 'play') return;
  let bo = null,
    bd = auto ? 2.8 : 4.6;
  const cand = (q, f) => {
    const d = Math.hypot(q.x - $G.P.x, q.z - $G.P.z);
    if (d < bd && Math.abs(q.y - $G.P.y) < 5) {
      bd = d;
      bo = f;
    }
  };
  for (const c of $G.CH) cand(c.m.position, () => tryChest(c));
  for (const s of $G.SH) if (!s.d && s.t != 0 && s.t != 5 && !(auto && (s.t == 4 || s.t == 6 || s.t == 7 || s.t == 3 || s.t == 10 || s.t == 12))) cand(s.m.position, () => useShrine(s));
  for (const n of $G.NP) if (!n.d && !(auto && n.lock)) cand(n.m.position, () => n.t == 'shop' ? openShop(n) : openKazan(n));
  for (const g of $G.MZ) if (g.st == 0 && !(auto && $G.P.mzA)) cand(g.m.position, () => wakeGrave(g));
  for (const k of $G.KS) if (!k.d) cand(k.m.position, () => hitKos(k));
  if ($G.GATE && $G.GATE.st != 1 && !(auto && $G.GATE.st == 0)) {
    const d = Math.hypot($G.GATE.x - $G.P.x, $G.GATE.z - $G.P.z);
    if (d < (auto ? 3.5 : 7.5) && Math.abs($G.GATE.m.position.y - $G.P.y) < 6 && (!bo || d < bd + 2)) bo = () => {
      if ($G.GATE.st == 0) summonBoss();else if ($G.GATE.st == 3) exitRun();else nextStage();
    };
  }
  if (bo) bo();
}

export function tryChest(c) {
  tip('chest', 'Sandık', `Ücretli sandıklar ${price()} altın, her açılışta pahalanır. Altın sandık daha nadir eşya verir. Demir Anahtar eşyası bazen bedava açar.`);
  const pr = price();
  if (!c.free && $G.P.gold < pr) {
    if (!c.w) {
      c.w = 1;
      toast(`Bu sandık ${pr} altın. ${pr - $G.P.gold} altın daha topla.`);
      sfx('deny');
    }
    return;
  }
  openChest(c);
}

export function openChest(c) {
  const pr = price(),
    q = c.m.position;
  if (!c.free) {
    if (Math.random() < ($G.P.C.key || 0)) {
      toast('Demir anahtar sandığı bedava açtı');
      puff(q.x, q.y + 1, q.z, 0xd9d0b0, 14);
    } else $G.P.gold -= pr;
    $G.P.opened++;
  }
  $G.P.chests++;
  if (c.mz) $G.P.mzOpened = ($G.P.mzOpened || 0) + 1;
  if (!c.free) inc('chestbuy');
  fireHook('chest', { c, free: c.free, gold: c.gold });
  sc.remove(c.m);
  if (chalFlag('noItems')) {
    $G.CH.splice($G.CH.indexOf(c), 1);
    const g = Math.round((40 + 20 * $G.P.stage) * $G.P.C.gold);
    $G.P.gold += g;
    $G.P.goldT += g;
    ringFx(q.x, q.y + .2, q.z, 0xe2b04a, 6, 14);
    toast(`Çıplak: sandıktan ${g} altın çıktı`);
    sfx('gold');
    return;
  }
  $G.CH.splice($G.CH.indexOf(c), 1);
  ringFx(q.x, q.y + .2, q.z, 0xe2b04a, 6, 14);
  const k = itemOf(rollItemR(c.gold, c.free)),
    o = itemOpt(k),
    rr = ITD[k] ? ITD[k].r : 0;
  VFX.chest(q.x, q.y, q.z, rr);
  sfx('chest', rr);
  o.apply();
  calc();
  showItem(o, c.gold ? 'Altın sandık açıldı' : 'Sandık açıldı');
}

export function useShrine(s) {
  if (s.t == 11 && !cageUse(s)) return;
  if (s.t == 12 && !bushUse(s)) return;
  s.d = 1;
  $G.P.shUsed++;
  setLin(s.o.material.color, 0x555566);
  if (s.gl) s.gl.visible = false;
  s.m.traverse(m => {
    if (m.userData.ring) m.visible = false;
  });
  sfx('shrine');
  fireHook('shrine', { s });
  if ($G.SH.every(x => x.d)) inc('shrineAll');
  if (s.t == 0 || s.t == 5) inc('charge');
  const q = s.m.position;
  VFX.shrine(q.x, q.y, q.z, SHC[s.t] || 0xa8e3d6);
  ringFx(q.x, q.y + .3, q.z, SHC[s.t], 8, 16);
  if (s.t == 0 || s.t == 5) {
    // Ocak: zorluk da seçeneklerden biri (Megabonk Charge Shrine: Difficulty 8/9.6/11.2/12.8/16 nadirliğe göre)
    if ($G.STORM && $G.STORM.on) inc('storm');
    inc('chg' + $G.P.stage);
    // aşamadaki bütün ocaklar, hiçbirinin alanından çıkmadan dolduysa (Kaos Tomu)
    if ($G.SH.filter(x => x.t == 0 || x.t == 5).every(x => x.d)) {
      inc('allcharge');
      if (!$G.SH.some(x => (x.t == 0 || x.t == 5) && x.lft)) inc('chgall' + $G.P.stage);
    }
    const ks = SBD.slice().sort(() => Math.random() - .5).slice(0, 3);
    choose(s.t == 5 ? 'gshrine' : 'shrine', ks.map(([k, v]) => sbOpt(k, v, s.t == 5)));
  }
  if (s.t == 1) {
    const ks = [];
    let g = 0;
    while (ks.length < 3 && g++ < 50) {
      const k = itemOf(s.gold ? 4 : rollItemR(0, 1));
      if (!ks.includes(k)) ks.push(k);
    }
    if (s.gold) inc('goldmoai');
    choose('item3', ks.map(k => itemOpt(k)));
  }
  if (s.t == 2) {
    inc('wind');
    for (const o of $G.G) o.pull = 1;
    toast('Rüzgâr taşı haritadaki bütün kristalleri ve altınları sana çekiyor');
  }
  if (s.t == 3) {
    s.left = 4;
    for (let i = 0; i < 4; i++) {
      const a = i / 4 * 6.283;
      spawn(i % 2 ? 4 : 0, {
        el: 1,
        tag: s,
        x: q.x + Math.cos(a) * 14,
        z: q.z + Math.sin(a) * 14
      });
    }
    toast('4 seçkin düşman geldi. Hepsini öldür, altın sandık kazan.');
  }
  if (s.t == 4) {
    // Açgözlülük taşı: +25-30 altın, zorluk +%5
    const g = Math.round(rn(25, 30) * $G.P.C.gold);
    $G.P.gold += g;
    $G.P.goldT += g;
    $G.P.greed += .05;
    toast(`Açgözlülük taşı: +${g} altın, zorluk %5 arttı`);
  }
  if (s.t == 6) {
    $G.P.bossCur = ($G.P.bossCur || 0) + 1;
    $G.P.bossCurN = ($G.P.bossCurN || 0) + 1; // aşama boyunca toplam; bossCur boss çağrılınca sıfırlanır
    if ($G.P.bossCurN >= 2) inc('bc2');
    toast('Kara sunak: sonraki boss ' + ($G.P.bossCur + 1) + ' kişi gelecek. Her biri altın sandık düşürür.');
  }
  if (s.t == 7) {
    const a = rn(0, 6.28);
    spawn(5, {
      el: 1,
      mini: 1,
      bandit: 1,
      x: q.x + Math.cos(a) * 16,
      z: q.z + Math.sin(a) * 16
    });
  }
  if (s.t == 8) {
    tip('chal', 'Meydan okuma sunağı', 'Koşu için bir meydan okuma seçersin: koşu zorlaşır, gümüş çarpanı artar; tamamlarsan kalıcı +%1 gümüş.');
    // Meydan okuma sunağı (Megabonk Challenge Shrine): koşunun başında bir meydan okuma seçilir
    openChalShrine();
  }
  if (s.t == 9) {
    // Mezar taşı (Megabonk Gravestone): tecrübe +%10, zorluk +%5
    $G.P.SB.xp = ($G.P.SB.xp || 0) + .1;
    $G.P.greed += .05;
    calc();
    inc('gravestone');
    toast('Mezar taşı: tecrübe +%10, zorluk +%5');
  }
  if (s.t == 10) coffinUse(s);
  if (s.t == 13) {
    // Denge taşı (Megabonk Shrine of Balance): bir stat ikiye katlanır, bir başkası yarıya iner; koşu boyunca kalıcı
    const ks = SBD.map(x => x[0]).filter(k => k != 'curse' && k != 'diff').sort(() => Math.random() - .5),
      up = ks[0], dn = ks[1],
      B = $G.P.SB2 || ($G.P.SB2 = {});
    B[up + '*'] = (B[up + '*'] || 0) + 1;
    B[dn + '*'] = (B[dn + '*'] || 0) - .5;
    calc();
    inc('balance');
    toast(`Denge taşı: ${STATS[up].n} iki kat, ${STATS[dn].n} yarı`);
  }
  if (s.t == 16) {
    // Yumurta (Megabonk Egg "Break egg"): etkisi kaynaklarda yok; üç güç bırakır (tahmin)
    const q = s.m.position, ks = Object.keys(PUD).filter(k => !PUD[k].item);
    for (let i = 0; i < 3; i++) mkPU(q.x + rn(-2, 2), q.z + rn(-2, 2), ks[Math.random() * ks.length | 0], q.y);
    inc('egg');
    toast('Yumurta kırıldı: üç güç çıktı');
  }
  if (s.t == 17) {
    // İskelet Kralı heykeli (Megabonk Skeleton King Statue): ara boss çağırır
    const q = s.m.position;
    spawn('iskeletkrali', { el: 1, mini: 1, x: q.x + 6, z: q.z, nm: 'İskelet Kralı' });
    inc('skking');
  }
  if (s.t == 18 || s.t == 19) {
    // Eski Maske ve Yılan yuvası: bulununca eşya kalıcı olarak açılır
    const [lk, ck, nm] = s.t == 18 ? ['eskimaske', 'oldmask', 'Eski Maske'] : ['yilan', 'snek', 'Yılan'];
    if (!$G.META.l[lk]) {
      $G.META.l[lk] = 1;
      saveMeta();
    }
    inc(ck);
    qCheck(); // görev hemen kaydedilir: nesne bir daha çıkmayacağı için sayaç koşu yarıda kalırsa kaybolmamalı
    toast(nm + ' bulundu: eşya açıldı');
    sfx('chest');
  }
  if (s.t == 15) {
    // Parlak Muz (Megabonk Shiny Banana): Kemik Bumerang açılır
    if (!$G.META.l.boom) {
      $G.META.l.boom = 1;
      saveMeta();
    }
    inc('banana');
    qCheck(); // aynı nedenle: Parlak Muz da kilit açıldıktan sonra bir daha çıkmaz
    toast('Parlak Muz: Kemik Bumerang açıldı');
    sfx('chest');
  }
  if (s.t == 14) {
    // Hediye: Noel Başlığı ve üç eşya
    if (!$G.META.l.hat_noel) {
      $G.META.l.hat_noel = 1;
      saveMeta();
      toast('Hediye: Noel Başlığı açıldı (Otağ → karakter → şapka)');
    }
    inc('present');
    sfx('chest');
  }
}

// Meydan okuma sunağı: listeden seç, anında uygulanır
export function openChalShrine() {
  if ($G.P.chal) {
    toast('Bu koşuda zaten bir meydan okuma var: ' + $G.P.chal.n);
    return;
  }
  $G.S = 'chalsh';
  const m = $G.P.map, t = $G.P.tier;
  ov(`<div class="sx chx"><header class=sxh><div><p class=kk>Bu koşu için bir zorluk seç</p><h2>Meydan okuma sunağı</h2></div><div class=mt><span class=chip>Tamamlarsan kalıcı +%1 gümüş</span></div></header><div class=chg2>${CHAL.map(c => `<button class="chc${chalDone(c, m, t) ? ' dn' : ''}" ${A('chalShrinePick', c.k)}><b>${c.n}</b><i>×${c.m}</i><span>${c.d}</span></button>`).join('')}</div><footer class=sxf><span class=fnote>✓ bu harita ve kademede tamamlanmış. Meydan okumalı koşu sıralamaya yüklenmez.</span><button class="act alt" ${A('closeOv')}>Vazgeç <kbd>E</kbd></button></footer></div>`, 'mid');
}

export function chalShrinePick(k) {
  if ($G.S != 'chalsh') return;
  $G.MSEL.chal = k;
  chalApply($G.P);
  calc();
  inc('chalshrine');
  sfx('shrine');
  back();
  toast('Meydan okuma: ' + ($G.P.chal ? $G.P.chal.n : k));
}

export function summonBoss() {
  if (!$G.GATE || $G.GATE.st != 0) return;
  if (!gyKeysOk()) {
    toast(`Mühürlü kapı: ${$G.P.mz.keys}/4 mahzen anahtarı. Tabutları aç.`);
    sfx('deny');
    return;
  }
  $G.GATE.st = 1;
  $G.P.bossT0 = $G.P.tt;
  $G.GATE.rn.material = BMc(0xff7a3a);
  const fin = $G.P.stage >= 1,
    bl = BOSSP[$G.P.map] || BOSSP.koru,
    pr = bl[Math.min(bl.length - 1, $G.P.stage)];
  spawn(3, {
    x: $G.GATE.x + Math.sin($G.GATE.ry) * 10,
    z: $G.GATE.z + Math.cos($G.GATE.ry) * 10,
    fin,
    boss: 1,
    kind: pr.k,
    bp: pr
  });
  for (let i = 0; i < ($G.P.bossCur || 0); i++) {
    const a = $G.GATE.ry + (i % 2 ? 1.2 : -1.2) * (1 + Math.floor(i / 2) * .5);
    spawn(3, {
      x: $G.GATE.x + Math.sin(a) * 14,
      z: $G.GATE.z + Math.cos(a) * 14,
      fin,
      boss: 1,
      twin: 1,
      kind: pr.k,
      bp: pr
    });
  }
  if ($G.P.bossCur) toast('Kara sunağın laneti: ' + ($G.P.bossCur + 1) + ' ' + BN() + ' birden geldi');
  $G.P.bossCur = 0;
  $G.shk = Math.max($G.shk, .5);
}

export function openShop(n) {
  tip('shop', 'Gezgin tüccar', 'Şapkasının rengi nadirlik kademesini gösterir: kara sıradan, mavi seçkin, mor destansı, sarı efsanevi. Bir satıştan sonra gider.');
  $G.S = 'shop';
  $G.shopN = n;
  if (!n.offer) {
    n.offer = [];
    for (let i = 0; i < 3; i++) {
      let k,
        g = 0;
      do {
        // kademe tüccarın şapkasıyla belli; şans işlemez
        k = itemOf(n.tier || 0);
      } while (n.offer.some(x => x.k == k) && g++ < 20);
      n.offer.push({
        k,
        pr: Math.max(5, Math.round([25, 0, 55, 100, 170][ITD[k].r] * (1 + $G.P.stage * .6) * Math.max(.2, 1 - ($G.P.C.shopp || 0)) / 5) * 5)
      });
    }
  }
  renderShop();
}

export function renderShop() {
  const n = $G.shopN;
  ov(`<div class=lu><h2>Gezgin tüccar${n.tier ? ` <small style="color:${RAR[n.tier].c}">${RAR[n.tier].n}</small>` : ''}</h2><p class=sub>Bir eşya seç. Tüccar bir satıştan sonra yoluna devam eder. Cebinde <b class=au>${$G.P.gold} altın</b> var.</p><div class=cs>${n.offer.map((o, i) => card(itemOpt(o.k), i, ['buy', i], 0, `<span class="pr${$G.P.gold >= o.pr ? '' : ' no'}">${o.pr} altın</span>`, $G.P.gold < o.pr)).join('')}</div><div class=ctl><button class="act alt" ${A('closeOv')}>Vazgeç <kbd>E</kbd></button></div>${buildHTML()}</div>`, 'mid');
}

export function buy(i) {
  const n = $G.shopN;
  if ($G.S != 'shop' || !n || !n.offer[i]) return;
  const o = n.offer[i];
  // tekil eşya teklif görüldükten sonra başka yerden alınmışsa altın kesilip hiçbir şey verilmiyordu
  if (chalFlag('noItems') || ITD[o.k].u && $G.P.I[o.k]) {
    toast(chalFlag('noItems') ? 'Çıplak: bu koşuda eşya alınamaz' : 'Bu eşyadan zaten var');
    sfx('deny');
    return;
  }
  if ($G.P.gold < o.pr) {
    sfx('deny');
    return;
  }
  $G.P.gold -= o.pr;
  addItem(o.k);
  $G.P.bought++;
  inc('buy');
  inc('buyT' + (n.tier || 0));
  n.d = 1;
  const q = n.m.position;
  puff(q.x, q.y + 1.5, q.z, 0x6a5034, 20);
  sc.remove(n.m);
  if (n.ob) rmObs(n.ob);
  sfx('buy');
  $G.shopN = null;
  back();
  toast(`${ITD[o.k].n} satın alındı. Tüccar yoluna devam etti.`);
}

export function __init_64() {
  // çoğaltılacak eşya tekil olamaz; feda edilecek eşya aynı nadirlikte başka bir eşya olmalı
  kzOk = a => !ITD[a].u && Object.keys($G.P.I).some(b => b != a && ITD[b].r == ITD[a].r);
}

export function openKazan(n) {
  tip('kazan', 'Cadı kazanı', 'Bir eşyanı çoğaltır, karşılığında aynı nadirlikten rastgele bir eşyanı eritir ve sandık fiyatının %34’ü kadar altın ister. Sıvının rengi kalan kullanım kademesi.');
  const ks = Object.keys($G.P.I).filter(kzOk);
  if (!ks.length) {
    if (!n.lock) {
      toast('Kazan için aynı nadirlikte iki farklı eşya gerekiyor');
      sfx('deny');
    }
    n.lock = 1;
    return;
  }
  $G.S = 'kazan';
  $G.kz = {
    n,
    a: null
  };
  renderKazan();
}

export function kzCost() {
  return Math.max(5, Math.round(price() * .34 / 5) * 5);
}

export function renderKazan() {
  const n = $G.kz.n,
    ks = Object.keys($G.P.I).filter(kzOk),
    c = kzCost();
  ov(`<div class=lu><h2>Cadı kazanı${n.tier ? ` <small style="color:${RAR[n.tier].c}">${RAR[n.tier].n}</small>` : ''}</h2><p class=sub>Çoğaltmak istediğin eşyayı seç. Kazan aynı nadirlikte rastgele bir eşyanı eritir ve <b class=au>${c} altın</b> ister (sandık fiyatının %34’ü). Kalan kullanım: ${n.uses}. Cebinde <b class=au>${$G.P.gold} altın</b> var.</p><div class=cs>${ks.map((k, i) => card(itemOpt(k, 1), i, ['kzPick', i], 0, `<span class="pr${$G.P.gold >= c ? '' : ' no'}">${c} altın</span>`, $G.P.gold < c)).join('')}</div><div class=ctl><button class="act alt" ${A('closeOv')}>Vazgeç <kbd>E</kbd></button></div>${buildHTML()}</div>`, 'mid');
  $G.kz.ks = ks;
}

export function kzPick(i) {
  if ($G.S != 'kazan' || !$G.kz || !$G.kz.ks[i]) return;
  const a = $G.kz.ks[i],
    c = kzCost(),
    n = $G.kz.n,
    pool = Object.keys($G.P.I).filter(b => b != a && ITD[b].r == ITD[a].r);
  if ($G.P.gold < c || !pool.length) {
    sfx('deny');
    return;
  }
  const k = pool[Math.random() * pool.length | 0];
  $G.P.gold -= c;
  remItem(k);
  addItem(a);
  $G.P.duped++;
  inc('dupe');
  inc('kz_' + a);
  {
    // üst üste aynı eşyayı çoğaltma sayısı (Megabonk "3 times in a row")
    const S = $G.P.IS || ($G.P.IS = {});
    S.kzRun = S.kzLast == a ? (S.kzRun || 0) + 1 : 1;
    S.kzLast = a;
    if (S.kzRun >= 3) inc('kz3_' + a);
  }
  const q = n.m.position;
  puff(q.x, q.y + 2, q.z, 0x8a5ad6, 24);
  sfx('chest');
  n.uses--;
  $G.kz = null;
  back();
  toast(`${ITD[a].n} çoğaltıldı, ${ITD[k].n} kazanda eridi`);
  if (n.uses <= 0) {
    n.d = 1;
    if (n.liq) n.liq.material = BMc(0x3a3a3a);
    inc('kzboom');
    puff(q.x, q.y + 2.5, q.z, 0x3a3a3a, 30);
  }
}

// ---- silahlar
