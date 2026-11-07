// game/stats.js · Kara Koru
// Bu dosya tek dosyalık sürümden (v22) otomatik ayrıldı. Ortak oyun durumu core/store.js içindeki $G nesnesinde.

import { $G } from '../core/store.js';
import { ITD, MU, STL, WD, inc, mu, unl } from '../data/content.js';
import { chalStats } from './challenge.js';
import { addStats, newLayers, resolveStats } from '../data/stats.js';
import { CR, heroCalc, rankOf } from './heroes.js';
import { itemCalc } from './items.js';
import { TIERM } from './run.js';
import { BOSSP } from '../data/enemies.js';

export let need, newW, SF, swT, swK, ghostSp, ghostHp, DMK, BN, BOSSN, MBN, diff, diffMul, diffPct, bonus, gdm;

export function __init_53() {
  // ---- build hesapları
  need = l => Math.floor(5 * l + .55 * l * l);
  newW = k => ({
    k,
    lv: 1,
    s: {
      ...WD[k].b
    },
    t: .4
  });
}

// Oyuncu statlarını yeniden hesaplar. Kaynaklar sırayla katmanlara eklenir (bkz. data/stats.js),
// sonuç $G.P.C içine yazılır. Katmanlar $G.P.CL içinde kalır; arayüz "neden bu değer" için kullanabilir.
export function calc() {
  const L = newLayers(),
    add = (o, m = 1) => addStats(L, o, m);
  const cr = CR[$G.CI];
  add(cr.b);
  if (cr.pr) add(cr.pr, rankOf($G.CI));
  if (cr.pl) add(cr.pl, $G.P.lv);
  for (const u of MU) if (u.st) add({ [u.st]: u.v }, mu(u.k));
  for (const t of $G.P.T) if (t.fx) add(t.fx);else add({ [t.k]: t.v });
  for (const k in $G.P.I) add(ITD[k].fx, $G.P.I[k]);
  add($G.P.SB);
  if ($G.P.SB2) add($G.P.SB2); // Denge taşı çarpanları
  if ($G.P.kosB) add({ 'dmg*': .15 });
  chalStats(L);
  // eşya hesap kancaları ilk çözümü görür (zırha bağlı diken gibi), sonra yeniden çözülür
  $G.P.wmax = 40;
  $G.P.tmax = 99;
  const c1 = resolveStats(L);
  itemCalc(L, c1);
  heroCalc(L, c1);
  const c = resolveStats(L);
  if ($G.P.chal && $G.P.chal.fl && $G.P.chal.fl.noarm) {
    c.arm = 0;
    c.eva = 0;
  }
  // Kaçınma azalan getirili (Megabonk): gerçek şans = iç değer / (1 + iç değer); %10 → %9, %100 → %50, 15 → %94.
  // Eskiden iç değer doğrudan şanstı; Kaçınma Tomu ve eşyalarla 1'i aşınca oyuncu her darbeden kaçıyordu
  // ve Son Dalga hiç bitmiyordu. c.evaR iç değeri tutar.
  c.evaR = c.eva;
  if (c.eva > 0) c.eva = c.eva / (1 + c.eva);
  // Zırh doğrusal: hasar × (1 − zırh); %100 bağışıklık (Megabonk decompile). Boss darbeleri ve Son Dalga'daki bütün darbeler zırhın yarısını deler (hurtP).
  c.armE = Math.min(1, Math.max(0, c.arm));
  $G.P.CL = L;
  // azami can en az 1: yüzde cezalar (Kımız −%5, Lanetli Eldiven −%20) toplanarak birikir; 20 Kımız canı sıfıra indiriyordu
  const nm = Math.max(1, Math.round(c.hp)),
    d = nm - $G.P.mh;
  $G.P.mh = nm;
  if (nm >= 500 && !$G.P.m500) { $G.P.m500 = 1; inc('mh500'); }
  if (d > 0) $G.P.hp += d;
  // aşırı can (overheal) tavanı korunur; eskiden her yeniden hesap aşırı canı silip azami cana indiriyordu
  $G.P.hp = Math.min($G.P.hp, nm * (1 + Math.max(0, c.overheal || 0)));
  $G.P.C = c;
  $G.P.bv++;
}

export function __init_54() {
  SF = s => s <= 1 ? 1 + s * 3.2 : 4.2 * Math.pow(1.75, s - 1);
  swT = () => $G.P && $G.P.swarm ? Math.max(0, $G.P.stT - ($G.P.swT0 || 0)) : 0;
  swK = () => Math.pow(1.0025, swT()) - 1;
  // Albastı hızı: Son Dalga'nın başından itibaren artar (8 dakikada 2 kat). Eskiden 20. dakikaya kadar sabitti ve
  // oyuncudan yavaş kaldığı için kaçan oyuncuya hiç yetişemiyordu; sıralama build'i değil sabrı ölçüyordu.
  ghostSp = () => .95 * (1 + swT() / 480);
  // Albastı canı: normal düşman ölçeklenmesinin üstüne kübik bir çarpan (4 dk ×2, 8 dk ×9, 12 dk ×32, 16 dk ×75, 20 dk ×146).
  // Seviyeyle hem mermi hem sekme kazanan silahlar (Kemik gibi) hasarı seviyenin karesiyle büyütüyor ve Son Dalga'da
  // öldürdükçe seviye atlamaya devam ediliyor; çarpan olmadan güçlü build'ler Albastıları yaklaşmadan öldürüp 40 dakikayı aşıyordu.
  ghostHp = () => 1 + Math.pow(swT() / 240, 3);
  DMK = () => (1 + $G.P.stage * .5 + .12 * Math.pow($G.P.stage, 1.6)) * Math.sqrt(TIERM[$G.P.tier - 1] || 1) * ($G.P.swarm ? 1.5 + swK() * 1.2 : 1) * (1 + ($G.P.ot || 0) / 600);
  // boss adı harita profilinden
  BN = () => {
    const l = BOSSP[$G.P.map] || BOSSP.koru;
    return l[Math.min(l.length - 1, $G.P.stage)].n;
  };
  BOSSN = BOSSP;
  MBN = {
    5: 'Dev Karakoncolos',
    2: 'Kaya Devi',
    4: 'Kemik Okçu Başı'
  };
  // Zorluk çarpanı: açgözlülük ve ocak sunakları (greed), lanet tomu, zorluk statı
  diffMul = () => (1 + $G.P.greed + ($G.P.C.diff || 0)) * (1 + $G.P.C.curse);
  // HUD'da gösterilen zorluk yüzdesi: kaynaklar + zaman + kademe
  diffPct = () => Math.round((diffMul() * (1 + $G.P.stT / 900) * (TIERM[$G.P.tier - 1] || 1) * (1 + swK() * 2.2) - 1) * 100);
  diff = () => (SF($G.P.stage) + $G.P.stT / 150 * (1 + $G.P.stage * .6)) * (TIERM[$G.P.tier - 1] || 1) * (1 + swK() * 2.2) * diffMul() * (1 + ($G.P.ot || 0) / 300);
  bonus = () => 1 + $G.P.C.curse * 1.5;
  gdm = () => CR[$G.CI].k == 'okcu' ? 1 + Math.min(.6, $G.P.gold / 1000) : 1; // Okçu (Robinette Stonks): cebindeki altına göre hasar
}

// Nadirlik ağırlıkları. Şans arttıkça düşük kademeler 1.5 tabanlı üstel olarak seyrekleşir,
// en yüksek kademe sabit kalır (Megabonk Rarity::CalculateRarityWeights).
// Beş kademeli yükseltme teklifleri (ERarity) için taban ağırlık yayımlanmış değil; bu dizi
// eşya ağırlıklarından türetilmiş tahmindir: Sıradan 70, Seçkin 15, Nadir 6, Destansı 3, Efsanevi 1.5.
export const RW_BASE = [70, 15, 6, 3, 1.5];
// Sandık eşyası dört kademelidir (EItemRarity): Sıradan 70, Nadir 15, Destansı 6, Efsanevi 1.5.
// Şans yokken %75.7 / %16.2 / %6.5 / %1.6; %100 şansta Efsanevi %4.7 (topluluk kod analizi: megabonkinfo.org, megabonk.org).
export const IRW_BASE = [70, 15, 6, 1.5];

export function rarWeights(luck, base = RW_BASE) {
  const b = Math.log(Math.max(0, luck) + 1) * 1.5,
    n = base.length;
  return base.map((w, i) => w * Math.pow(1.5, -(n - i - 1) * b));
}

function pickW(w, r = Math.random()) {
  const s = w.reduce((a, b) => a + b, 0);
  r *= s;
  for (let i = 0; i < w.length; i++) {
    r -= w[i];
    if (r <= 0) return i;
  }
  return w.length - 1;
}

export function rollR(r) {
  return pickW(rarWeights($G.P.C.luck), r);
}

// Normal sandığın eşya ağırlıkları, eşya tablosunun nadirlik dizinlerine (0, 2, 3, 4) yerleştirilmiş hâlde.
// Eşya tablosunda Seçkin (1) kademe yok; o yuva sıfır kalır.
export function itemRarW(luck) {
  const w = rarWeights(luck, IRW_BASE);
  return [w[0], 0, w[1], w[2], w[3]];
}

// Eşya nadirliği: altın sandık ve ücretsiz seçimler sabit dağılım, normal sandık şansa bağlı.
export function rollItemR(gold, free, r) {
  const w = gold ? [0, 0, 30, 45, 25] : free ? [35, 0, 40, 20, 5] : itemRarW($G.P.C.luck);
  return pickW(w, r);
}

export function itemOf(r) {
  const ok = (k, opt) => !ITD[k].q && !(ITD[k].u && $G.P.I[k]) && unl(ITD[k].lock) && (opt || !$G.META.opt['i_' + k]),
    all = Object.keys(ITD),
    pick = ks => ks[Math.random() * ks.length | 0];
  // sırayla: istenen nadirlik, sıradan, herhangi bir nadirlik, Toggler yok sayılarak herhangi biri.
  // Eskiden sıradan havuz boşken (Toggler ile hepsi kapatılınca) itemOf(0) kendini sonsuza dek çağırıyordu.
  for (const ks of [all.filter(k => ITD[k].r == r && ok(k)), all.filter(k => ITD[k].r == 0 && ok(k)), all.filter(k => ok(k)), all.filter(k => ok(k, 1)), all.filter(k => !ITD[k].q)]) if (ks.length) return pick(ks);
  return all[0];
}

// ---- seçenek kartları
