// game/flow.js · Kara Koru
// Bu dosya tek dosyalık sürümden (v22) otomatik ayrıldı. Ortak oyun durumu core/store.js içindeki $G nesnesinde.

import { $G } from '../core/store.js';
import { aInit, sfx } from '../audio/engine.js';
import { lockP, ov, skFree, toast } from '../core/helpers.js';
import { OV } from '../core/state.js';
import { ACHD, ACHM, QD, TOUCH, inc, mu, saveMeta, unl } from '../data/content.js';
import { mapOf } from './run.js';
import { itemsClear } from './items.js';
import { chalApply } from './challenge.js';
import { sc } from '../engine/renderer.js';
import { DN, VFX } from '../engine/vfx.js';
import { CR, bullClear, hero } from './heroes.js';
import { setupStage } from './objects.js';
import { bonus, calc, need, newW } from './stats.js';
import { back } from '../ui/cards.js';
import { BIO } from '../world/terrain.js';
import { clrTor } from '../world/tornado.js';
import { A } from '../ui/actions.js';

// ---- akış
export function resetRun() {
  bullClear(); // Çalı'nın nişangâh işaretleri sahnede kalmasın
  VFX.clear();
  clrTor();
  itemsClear();
  $G.HS = 0;
  if ($G.H) {
    sc.remove($G.H.g);
    skFree($G.H);
  }
  ;
  $G.H = hero($G.CI);
  $G.H.g.traverse(o => o.castShadow = true);
  sc.add($G.H.g);
  DN.forEach(n => n.el.remove());
  DN.length = 0;
  $G.P = {
    x: 0,
    z: 0,
    y: 3,
    vx: 0,
    vy: 0,
    vz: 0,
    hp: 1,
    mh: 1,
    xp: 0,
    lv: 1,
    need: need(1),
    inv: 0,
    hit: 0,
    sl: 0,
    cd: 0,
    dsh: 0,
    jc: 0,
    jr: 1,
    gold: 20 * mu('sg'),
    goldT: 0,
    opened: 0,
    chests: 0,
    shUsed: 0,
    map: $G.MSEL.map,
    tier: $G.MSEL.tier,
    rr: 1 + mu('rr'),
    bn: mu('bn'),
    sk: mu('sk'),
    ws: 2 + mu('ws'),
    ts: 2 + mu('ts'),
    final: 0,
    exited: 0,
    ot: 0,
    otS: 0,
    swT0: 0,
    chF: 0,
    arenaT: 0,
    ban: new Set(),
    bk: 0,
    bg: 0,
    W: [],
    T: [],
    I: {},
    SB: {},
    C: null,
    bv: 0,
    oa: 0,
    air: 0,
    air0: 0,
    ft: 0,
    pz: 0,
    rage: 0,
    shieldT: 0,
    blockT: 0,
    revived: 0,
    stage: 0,
    stT: 0,
    tt: 0,
    swarm: 0,
    silv: 0,
    band: 0,
    thf: 0,
    bossCur: 0,
    fount: 0,
    ghT: 0,
    ghW: 0,
    mbN: 0,
    bosses: 0,
    bought: 0,
    duped: 0,
    legs: 0,
    won: 0,
    greed: 0,
    hop: 0,
    landT: 0,
    qDone: [],
    qt: 1,
    mbT: 150,
    chT: 35,
    slamHint: 0,
    wmax: 40,
    tmax: 99,
    c: {},
    IS: {},
    xpT: 0,
    mz: null,
    wdis: 0,
    slowT: 0,
    poiT: 0,
    burnT: 0,
    puSpd: 0,
    pgT: 0,
    wdmg: {},
    stDmg: 0,
    stl: 0,
    shd: 0,
    noDmgT: 0,
    noDmgMax: 0,
    scyC: 0,
    puN: 0,
    stS: 0
  };
  $G.P.W.push(newW(CR[$G.CI].w));
  chalApply($G.P);
  calc();
  $G.P.hp = $G.P.mh;
  $G.kills = 0;
  $G.yaw = $G.yawT = 0;
  setupStage();
  $G.hk = '';
  $G.bk = '';
  $G.tk = '';
}

export function start() {
  if (!unl(CR[$G.CI].lock)) {
    sfx('deny');
    return;
  }
  aInit();
  if (!$G.P || $G.P.tt > 0 || $G.P.stage || $G.P.lv > 1 || $G.P.map != $G.MSEL.map || $G.P.tier != $G.MSEL.tier || ($G.P.chal ? $G.P.chal.k : '') != ($G.MSEL.chal || '')) resetRun();else {
    $G.P.gold = 20 * mu('sg');
    $G.P.rr = 1 + mu('rr');
    $G.P.bn = mu('bn');
    $G.P.sk = mu('sk');
    $G.P.ws = 2 + mu('ws');
    $G.P.ts = 2 + mu('ts');
    // meydan okumanın slot sınırı (Tek Silah, Tek Tom) burada da geçerli; yoksa menüden dönüp başlayınca kalkıyordu
    const cf = $G.P.chal && $G.P.chal.fl;
    if (cf && cf.ws) $G.P.ws = Math.min($G.P.ws, cf.ws);
    if (cf && cf.ts) $G.P.ts = Math.min($G.P.ts, cf.ts);
    calc();
    $G.P.hp = $G.P.mh;
  }
  OV.classList.add('h');
  $G.S = 'play';
  document.body.classList.add('on');
  sfx('ui');
  lockP();
  if (!$G.tutDone) toast('Ruh kristallerini topla, potları kır, sandık aç');
}

export function nextStage() {
  if ($G.S != 'play') return;
  $G.S = 'trans';
  for (const o of $G.G) {
    if (o.ty == 'xp') {
      $G.P.xp += o.v * $G.P.C.xp * bonus();
      $G.P.xpT += o.v * $G.P.C.xp * bonus();
    } else if (o.ty == 'au') $G.P.gold += Math.round(o.v * $G.P.C.gold * bonus());else if (o.ty == 'sv') $G.P.silv += o.v;
  }
  sfx('portal');
  const ns = $G.P.stage + 1,
    mp = mapOf(),
    bi = mp.bi,
    arena = $G.P.tier >= 3 && ns >= $G.P.tier - 1;
  // Kızıl Bozkır: Kara Koru Kademe 2'de 2. aşamaya geçince açılır
  if (mp.k == 'bozkir' && $G.P.stage == 0 && ($G.P.bossCurN || 0) >= 2 && CR[$G.CI].k == 'golge') inc('headset'); // bossCur boss çağrılınca sıfırlandığı için koşul hiç sağlanamıyordu
  if (mp.k == 'koru' && $G.P.tier >= 2 && ns >= 1 && !$G.META.l.bozkir) { // eskiden yalnız Tunç ile; Tunç kadrodan çıktı
    $G.META.l.bozkir = 1;
    saveMeta();
    setTimeout(() => toast('Kızıl Bozkır haritası açıldı. Menüden seçebilirsin.'), 3000);
  }
  ov(`<div class=trn><p>${mp.n} · Kademe ${$G.P.tier} · Aşama ${ns + 1} / ${$G.P.tier}</p><h2>${arena ? 'Final arenası' : BIO[bi].n}</h2><p class=sub>${arena ? 'Küçük bir mühür alanı. Final boss’u burada seni bekliyor; kaçacak yer yok.' : 'Düşmanlar daha güçlü, sandıklar daha değerli. Sayaç sıfırdan başlar; Boss Kapısı’nı bul ve boss’u devir.'}</p></div>`, 'mid');
  setTimeout(() => {
    $G.P.stage = ns;
    // Aşama saati her aşamada sıfırdan başlar. Eskiden birikiyordu ve boss ölünce stLen() − 10'a atlıyordu; 2. aşama
    // (540 sn) ilk saniyeden "süre doldu" sayılıyor, baştan sona Uzatma'da geçiyor, ara bosslar ve akınlar gelmiyordu.
    // Zorluk, doğuş hızı ve tür listesi aşamayı ayrıca hesaba katar (SF, stage × 240 ...), saat aşama içi süredir.
    $G.P.stT = 0;
    $G.P.kzN = 0;
    $G.P.kzQ = '';
    $G.P.swT0 = 0;
    $G.P.swarm = 0;
    $G.P.ghW = 0;
    $G.P.ghT = 0;
    setupStage();
    $G.hk = '';
    $G.bk = '';
    stageReady(bi);
  }, 2400);
}

export function stageReady(bi) {
  const arena = $G.P.tier >= 3 && $G.P.stage >= $G.P.tier - 1,
    m = arena ? 'Mühür birkaç saniye içinde çözülür ve boss gelir.' : 'Etraftaki kristaller ve altınlar seninle geldi. Yeni aşamanın sayacı başladı.';
  if (TOUCH) {
    $G.S = 'play';
    OV.classList.add('h');
    toast((arena ? 'Final arenası' : BIO[bi].n) + '. ' + m);
    return;
  }
  $G.S = 'ready';
  ov(`<div class=trn><p>Aşama ${$G.P.stage + 1} / ${$G.P.tier} hazır</p><h2>${arena ? 'Final arenası' : BIO[bi].n}</h2><p class=sub>${m}</p><div class=row style="justify-content:center"><button class=act ${A('goReady')}>Devam et <kbd>E</kbd></button></div></div>`, 'mid');
}

export function goReady() {
  if ($G.S == 'ready') back();
}

export function achCheck() {
  let n = 0;
  for (const a of ACHM.concat(ACHD)) {
    if ($G.META.achv[a.k]) continue;
    const [c, m] = a.f();
    if (c >= m) {
      $G.META.achv[a.k] = Date.now();
      n++;
      toast('Başarım: ' + a.n);
    }
  }
  if (n) saveMeta();
  return n;
}

export function qCheck() {
  achCheck();
  for (const q of QD) {
    if ($G.META.q[q.k]) continue;
    const [c, m] = q.f();
    if (c >= m) {
      $G.META.q[q.k] = 1;
      $G.META.ach[q.k] = Date.now();
      $G.META.s += q.r;
      if (q.ul && !$G.META.l[q.ul]) {
        $G.META.l[q.ul] = 1;
        // kahraman görevleri ul'yi 'q_<kilit>' olarak verir; karakter Otağ'da satın alınabilir hâle gelir
        const h = CR.find(c => !c.off && 'q_' + c.lock == q.ul);
        if (h) setTimeout(() => toast(`${h.n} Otağ’da satın alınabilir`), 1800);
      }
      $G.P.qDone.push(q);
      saveMeta();
      toast(`Görev tamamlandı: ${q.n}. +${q.r} gümüş`);
      sfx('quest');
    }
  }
}
// ---- öldürme sıralaması: yerel rekorlar + paylaşılan tablo (db/user yetenekleri varsa)
