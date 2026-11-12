// game/heroes.js · Kara Koru
// Karakterler, rütbe, kostüm ve şapka sistemi.
//
// CR: 21 girdi, etkin kadro 8 (alp, kam, golge, bahadir, kemik, anka, cali, tulpar). k anahtar, w başlangıç silahı,
// b taban statlar, pr rütbe başına stat, lock kilit anahtarı (META.l), cost gümüş, ud açılış koşulu metni, sc model
// ölçeği, hat şapka bağlanır. off: 1 kadrodan kaldırılmış karakter: dizide kalır, çünkü indeksler kayıtlarda geçer
// (kc/wc/k3c/fast6c/crypt sayaçları, META.skin 'cur'+ci, kk_ci, sıralama r.c). Menüler heroIdx() / heroOn() kullanır.
// Pasif davranışlar HH[k] altında (kancalar items.js fireHook ile aynı adları kullanır), hesap
// kancası hc(L, rank, c1). Rütbe: o karakterle kazanılan tecrübe META.rank[k], rankOf ile 1-100.

import { tgts } from './weapons.js';
import { hurtE } from './enemies.js';
import { VFX } from '../engine/vfx.js';
import { $G } from '../core/store.js';
import { THREE } from '../engine/three.js';
import { sfx, sfxAt } from '../audio/engine.js';
import { toast } from '../core/helpers.js';
import { rn } from '../core/util.js';
import { SBD, cnt, inc } from '../data/content.js';
import { addStats } from '../data/stats.js';
import { BM, BMc, mk, sc, skData, skInst } from '../engine/renderer.js';
import { puff, ringFx } from '../engine/vfx.js';
import { MODELS } from '../geo/models.js';
import { ACC, attachAcc } from '../geo/accessories.js';
import { killE } from './enemies.js';
import { aoe } from './items.js';
import { mkChest } from './objects.js';
import { calc } from './stats.js';
import { addStatus } from './status.js';

export let CR;

export function __init_29() {
  // ---- karakterler
  CR = [{
    k: 'alp', n: 'Alp', d: 'Ağır zırhlı savaşçı. Yakın dövüşte sağlam durur.', w: 'slash',
    p: '%25 hasar, +50 can, %15 zırh, −%2 hız', ps: 'Demir deri: her rütbede +%1 zırh',
    b: { dmg: .25, hp: 50, arm: .15, spd: -.02 }, pr: { arm: .01 }
  }, {
    k: 'kam', n: 'Kam', d: 'Ateş çağıran şaman. Kalabalığı uzaktan yakar.', w: 'fire',
    p: '%5 kaçınma, %4 hız, %10 zıplama, %40 toplama, %15 şans', ps: 'Fal: her rütbede +%1.5 şans',
    b: { eva: .05, spd: .04, jmp: .1, mag: .4, luck: .15 }, pr: { luck: .015 }
  }, {
    k: 'golge', n: 'Gölge', d: 'Hafif ve hızlı bir suikastçı. Kaçmakta ustadır.', w: 'katana',
    p: '%25 hasar, %5 kaçınma, %15 hız, %20 zıplama, yarı düşme hasarı, havada çift zıplama', ps: 'Gölge adımı: kaçındığın saldırıyı yapan düşman infaz edilir. Tavşan sıçraması: yere değer değmez zıplarsan her sıçrama %8 hız katar; her rütbede +%0.5 kaçınma',
    b: { dmg: .25, eva: .05, spd: .15, jmp: .2, fall: .5, mag: .3, air: 1 }, pr: { eva: .005 }, lock: 'golge', cost: 32, ud: 'Kızıl Bozkır’ın boss’unu devir ve Yatağan’ı aç.'
  }, {
    k: 'bahadir', n: 'Bahadır', d: 'Bozkırın baltacısı. Ganimet biriktirdikçe güçlenir.', w: 'axe',
    p: '%10 hasar, +40 can, %5 zırh, −%6 hız, −%1 şans', ps: 'Ganimet: cebindeki her 10 altın %1 hasar verir, en çok %60; her rütbede +%1.5 hasar',
    b: { dmg: .1, hp: 40, arm: .05, spd: -.06, jmp: .035, luck: -.01 }, pr: { dmg: .015 }, lock: 'bahadir', cost: 12, ud: '15.000 Gulyabani öldür ve Balta’yı aç.'
  }, {
    k: 'boru', off: 1, n: 'Börü', d: 'Kurt postlu bozkır savaşçısı. Kan kokusu aldıkça azar.', w: 'blood',
    p: '%5 kaçınma, %5 can çalma, %4 hız, %20 zıplama', ps: 'Kan kokusu: her rütbede +%1 can çalma; her 100 öldürme %1 hasar, en çok %50',
    b: { eva: .05, ls: .05, spd: .04, jmp: .2, mag: .5 }, pr: { ls: .01 }, lock: 'boru', cost: 32, ud: 'Kızıl Bozkır’da Erlik’i devir ve Kan Büyüsü’nü aç.'
  }, {
    k: 'ayaz', off: 1, n: 'Ayaz', d: 'Kuzeyin buz şamanı. Düşmanı yavaşlatıp parçalar.', w: 'ice',
    p: '%5 kaçınma, %7.5 hız, %30 zıplama, %50 toplama', ps: 'Dondurucu: yavaşlayan düşmanlara %30 fazla hasar; her rütbede +%0.75 alan',
    b: { eva: .05, spd: .075, jmp: .3, mag: .5 }, pr: { size: .0075 }, lock: 'ayaz', cost: 20, ud: 'Cadı kazanında 3 kez Buz Kristali çoğalt ve Ayaz silahını aç.'
  }, {
    k: 'karahan', off: 1, n: 'Kara Han', d: 'Erlik’e and içmiş bir han. Lanet onu güçlendirir.', w: 'corrupt',
    p: '+50 can, %20 zırh, −%3 hız, %10 zorluk', ps: 'Lanetli kan: her rütbede +%1 zorluk',
    b: { hp: 50, arm: .2, spd: -.03, diff: .1 }, pr: { diff: .01 }, lock: 'karahan', cost: 33, ud: 'Kademe 3’ü bitir ve Erlik Kılıcı’nı aç.'
  }, {
    k: 'tunc', off: 1, n: 'Tunç', d: 'Bakırdan dövülmüş bir otomaton. Gözü keskin, eli titremez.', w: 'rifle',
    p: '−60 can, 50 kalkan, %7 hız, %20 zıplama, yarı düşme hasarı', ps: 'Keskin göz: her rütbede +%1 kritik şansı',
    b: { hp: -60, shield: 50, spd: .07, jmp: .2, fall: .5, mag: .3 }, pr: { crit: .01 }, lock: 'tunc', cost: 14, ud: 'Kademe 1’i bitir ve Tüfek’i aç.'
  }, {
    k: 'kemik', n: 'Kemik', d: 'Mezardan kalkmış bir iskelet. Durmadıkça hızlanır.', w: 'bone',
    p: '%15 hız, %15 zıplama, %30 toplama', ps: 'Hız şeytanı: hızın zamanla %60’a kadar artar, vurulunca dörtte biri gider; hızın yarısı hasara döner; her rütbede +%0.75 hasar',
    b: { spd: .15, jmp: .15, mag: .3 }, pr: { dmg: .0075 }, sc: .95, lock: 'kemik', cost: 9, ud: '1.000 İskelet okçu öldür.'
  }, {
    k: 'pehlivan', off: 1, n: 'Pehlivan', d: 'Yağlı güreşin ustası. Kasınca kimse yanına yaklaşamaz.', w: 'aura',
    p: '+20 can, −%5 hız, %10 zıplama', ps: 'Kasma: her 8 saniyede bir kasılır; o an hasar almaz, yakınındakiler sersemler, kalıcı +%2.5 hasar kazanır',
    b: { hp: 20, spd: -.05, jmp: .1 }, pr: { hp: 1 }, sc: 1.12, lock: 'pehlivan', cost: 10, ud: 'Güç Tomu’nu 7. seviyeye çıkar ve Kor Halkası’nı aç.'
  }, {
    k: 'yaban', off: 1, n: 'Yaban', d: 'Dağların yabani adamı. Kayalara tırmanır, yüksekten atlar.', w: 'boom',
    p: '%15 hasar, +35 can, %20 zıplama, çeyrek düşme hasarı', ps: 'Tırmanış: her rütbede +2 azami can',
    b: { dmg: .15, hp: 35, jmp: .2, fall: .25, air: 1 }, pr: { hp: 2 }, lock: 'yaban', cost: 18, ud: 'Korudaki kafesi Kafes Anahtarı ile aç.'
  }, {
    k: 'haydut', off: 1, n: 'Haydut', d: 'Bozkırın eşkıyası. Elleri hızlı, vicdanı yok.', w: 'dexe',
    p: '%10 kaçınma, %5 hız, %10 zıplama, %40 toplama', ps: 'Akış: her rütbede +%1 saldırı hızı',
    b: { eva: .1, spd: .05, jmp: .1, mag: .4 }, pr: { aspd: .01 }, lock: 'haydut', cost: 30, ud: 'Kara Haydut’u yen.'
  }, {
    k: 'umay', off: 1, n: 'Umay', d: 'Koruyucu tanrıça. Dikenli kalkanıyla saldırganı cezalandırır.', w: 'aegis',
    p: '+25 can, %15 zırh, +5 diken', ps: 'Koruma: her rütbede +2 diken; canın azaldıkça hasarın artar',
    b: { hp: 25, arm: .15, thorns: 5 }, pr: { thorns: 2 }, lock: 'umay', cost: 16, ud: 'Diken Tomu’nu 9. seviyeye çıkar ve Kalkan’ı aç.'
  }, {
    k: 'asikci', off: 1, n: 'Aşıkçı', d: 'Aşık kemiği atan bir kumarbaz. Her seviye bir zar.', w: 'dice',
    p: '%5 kritik, %5 kaçınma, %50 toplama, %5 altın', ps: 'Kumar: her seviyede rastgele bir stat kazanır',
    b: { crit: .05, eva: .05, mag: .5, gold: .05 }, pr: { luck: .005 }, lock: 'asikci', cost: 25, ud: '100 görev tamamla ve Aşık Kemiği’ni aç.'
  }, {
    k: 'gokce', off: 1, n: 'Gökçe', d: 'Gök gezgini. Yıldızların arasından düştü, girdabı yanında getirdi.', w: 'vortex',
    p: '+10 can, %50 toplama, %5 tecrübe, düşme hasarı yok', ps: 'Yıldız tozu: her rütbede +%1 tecrübe',
    b: { hp: 10, mag: .5, xp: .05, fall: 1 }, pr: { xp: .01 }, lock: 'gokce', cost: 28, ud: 'Girdap’ı aç ve 6 meydan okuma tamamla.'
  }, {
    k: 'sahmeran', off: 1, n: 'Şahmeran', d: 'Yılanların kraliçesi. Zehri yayıldıkça büyür.', w: 'flask',
    p: '%20 alan, %20 süre, +30 can, %10 zırh, %50 toplama', ps: 'Veba: her rütbede +%1 zehir hasarı ve +%0.5 saldırı alanı',
    b: { size: .2, dur: .2, hp: 30, arm: .1, mag: .5 }, pr: { poison: .01 }, lock: 'sahmeran', cost: 26, ud: 'Küflü Peynir ile 50.000 düşman zehirle ve Zehir Şişesi’ni aç.'
  }, {
    k: 'anka', n: 'Anka', d: 'Zümrüdüanka. Havada süzülür, yükseklerden vurur.', w: 'tornado',
    p: '%5 hız, %20 zıplama, %50 toplama, havada süzülme', ps: 'Süzülme: zıplama basılıyken yavaş düşersin; havadayken her rütbede +%1 hasar',
    b: { spd: .05, jmp: .2, mag: .5, air: 1 }, pr: {}, lock: 'anka', cost: 20, ud: 'Havadayken 100 düşman öldür ve Hortum’u aç.'
  }, {
    k: 'cali', n: 'Çalı', d: 'Yürüyen bir çalı. Kimse onu göremez, o herkesi görür.', w: 'sniper',
    p: '%10 kaçınma, %60 toplama', ps: 'Tam isabet: rastgele bir düşmanı nişangâhla işaretler; işaretliye vurunca çevresi patlar. Her rütbede +%1 kritik hasarı, işaretler sıklaşır',
    b: { eva: .1, mag: .6 }, pr: { critd: .01 }, lock: 'cali', cost: 21, ud: 'Korudaki şüpheli çalıyı dürt, Çalı’yı yen ve Uzun Menzilli’yi aç.'
  }, {
    k: 'tulpar', n: 'Tulpar', d: 'Kanatlı at. Ruh kristalleri onun için birer ok.', w: 'dagger',
    p: '−30 can, 10 kalkan, %30 hız, %30 zıplama, düşme hasarı yok', ps: 'Kristal yağmuru: topladığın her kristal çevresindeki düşmanları keser; her rütbede +%2 toplama alanı',
    b: { hp: -30, shield: 10, spd: .3, jmp: .3, fall: 1, mag: .3 }, pr: { mag: .02 }, lock: 'tulpar', cost: 19, ud: 'Uçan Hançer’i aç ve 2 meydan okuma tamamla.'
  }, {
    k: 'okcu', off: 1, n: 'Okçu', d: 'Bozkırın okçusu. Altını uzaktan görür.', w: 'bolt',
    p: '%7.5 hız, %30 zıplama, çeyrek düşme hasarı, %5 altın', ps: 'Kâr: her rütbede +%1 altın',
    b: { spd: .075, jmp: .3, fall: .25, mag: .3, gold: .05 }, pr: { gold: .01 }, lock: 'okcu', cost: 18, ud: 'Kademe 2’yi bitir.'
  }, {
    k: 'orakci', off: 1, n: 'Orakçı', d: 'Tırpanıyla ruh biçer. Hayaletler ona armağan getirir.', w: 'scythe',
    p: '%15 kaçınma, %4 hız, %20 zıplama, %40 toplama', ps: 'Hayalet armağanı: her 60-120 saniyede yanında ücretsiz bir sandık belirir',
    b: { eva: .15, spd: .04, jmp: .2, mag: .4 }, pr: { hp: .5 }, lock: 'orakci', cost: 37, ud: 'Tırpan’ı aç ve Mezarlık’ta Kara Kefen’i infazla öldür.'
  }];
}

// Etkin kadronun CR indeksleri (kaldırılanlar hariç), sırayla
export function heroIdx() {
  return CR.reduce((a, c, i) => (c.off || a.push(i), a), []);
}

// ci etkin kadroda mı
export function heroOn(ci) {
  return !!CR[ci] && !CR[ci].off;
}

export const SKINS = [
  { k: 'gold', n: 'Altın', d: 'Rütbe 100', cost: 4, f: ci => rankOf(ci) >= 100 },
  { k: 'dark', n: 'Kara', d: 'Bu karakterle 15.000 öldürme', cost: 1, f: ci => cnt('kc' + ci) >= 15000 },
  { k: 'fire', n: 'Alev', d: 'Bu karakterle Kademe 3’te Dev Hortlak’ı devir', cost: 4, f: ci => cnt('k3c' + ci) >= 1 },
  { k: 'acid', n: 'Asit', d: 'Bu karakterle ilk boss’u 6 dakikadan önce devir', cost: 4, f: ci => cnt('fast6c' + ci) >= 1 },
  { k: 'crypt', n: 'Mahzen', d: 'Bu karakterle Mezarlık’ın ilk Mahzen’ini süre eşiğinden önce aç', cost: 4, f: ci => cnt('crypt' + ci) >= 1 },
  // Kızıl ve Beyaz eskiden yalnız Şahmeran'ındı; Şahmeran kadrodan çıkınca Anka'ya geçti
  { k: 'red', n: 'Kızıl', d: 'Anka ile 50.000 öldürme', cost: 4, only: 'anka', f: ci => cnt('kc' + ci) >= 50000 },
  { k: 'white', n: 'Beyaz', d: 'Anka ile 100.000 öldürme', cost: 4, only: 'anka', f: ci => cnt('kc' + ci) >= 100000 },
  // Kemik'in ayrı modelli kostümleri (engine/glbhero.js URLS.kemik.kostum): renk değişimi değil, başka gövde
  { k: 'ayaz', n: 'Ayaz', d: 'Kemik ile 2.500 öldürme', cost: 6, only: 'kemik', f: ci => cnt('kc' + ci) >= 2500 },
  { k: 'akinci', n: 'Ölü Akıncı', d: 'Kemik ile 7.500 öldürme', cost: 6, only: 'kemik', f: ci => cnt('kc' + ci) >= 7500 },
  { k: 'saman', n: 'Kam İskelet', d: 'Kemik ile rütbe 10', cost: 6, only: 'kemik', f: ci => rankOf(ci) >= 10 },
  { k: 'erlik', n: 'Erlik Elçisi', d: 'Kemik ile rütbe 25', cost: 6, only: 'kemik', f: ci => rankOf(ci) >= 25 }
];

// Mahzen kostümü saniye eşikleri (Megabonk crypt skins)
export const CRYPT_N = { tulpar: 16, kemik: 18, yaban: 18, ayaz: 19, orakci: 19, anka: 20, golge: 20, sahmeran: 21, haydut: 21, tunc: 21, asikci: 21, okcu: 21, cali: 22, kam: 22, pehlivan: 22, boru: 22, umay: 23, bahadir: 23, karahan: 24, alp: 24, gokce: 24 };

// Şapkalar: başarımla açılır (QD içindeki h_* görevleri META.l['hat_<k>'] açar), kozmetik.
export const HATS = [
  { k: 'kurbaga1', n: 'Yeşil Kurbağa', d: 'Kara Koru’daki gizli kurbağayı yakala' },
  { k: 'kurbaga2', n: 'Mavi Kurbağa', d: 'Kızıl Bozkır’daki gizli kurbağayı yakala' },
  { k: 'kurbaga3', n: 'Kızıl Kurbağa', d: 'Mühürlü Mahzen’deki gizli kurbağayı yakala' },
  { k: 'tuccar', n: 'Kara Tüccar Şapkası', d: 'Sıradan tüccardan 100 eşya al' },
  { k: 'tuccar2', n: 'Mavi Tüccar Şapkası', d: 'Seçkin tüccardan 80 eşya al' },
  { k: 'tuccar3', n: 'Mor Tüccar Şapkası', d: 'Destansı tüccardan 60 eşya al' },
  { k: 'tuccar4', n: 'Sarı Tüccar Şapkası', d: 'Efsanevi tüccardan 50 eşya al' },
  { k: 'kazanh', n: 'Kazan Şapkası', d: '50 kazanı son kullanımına kadar tüket' },
  { k: 'takke', n: 'Keloğlan Takkesi', d: 'Keloğlan ile 100.000 kez yumruk ye' },
  { k: 'tac', n: 'Taç', d: 'Her karakterde rütbe 100' },
  { k: 'kulah', n: 'Kam Külahı', d: 'Kam Külahı eşyasıyla bir koşu bitir' },
  { k: 'soytari', n: 'Soytarı Şapkası', d: 'Kam ile Şaman Maskesi takarken 500 öldür' },
  { k: 'peynir', n: 'Peynir Şapkası', d: '8 Küflü Peynir ve 1 Yılan taşırken Kademe 3’te Dev Hortlak’ı devir' },
  { k: 'fes', n: 'Uzun Fes', d: 'Kara Koru’da tek koşuda 300.000 öldürme' },
  { k: 'silindir', n: 'Silindir Şapka', d: 'Kara Koru’da tek koşuda 100.000 öldürme' },
  { k: 'comlek', n: 'Çömlek', d: 'Kemik ile bir koşuda 4 Kazan taşı' },
  { k: 'baret', n: 'Baret', d: 'Bahadır ile bir koşuda 20 sandık aç' },
  { k: 'tolga', n: 'Demir Tolga', d: 'Alp ile Kılıç, Alp Kılıcı, Erlik Kılıcı ve Tırpan taşırken Kademe 3’te Dev Hortlak’ı devir' },
  { k: 'noel', n: 'Noel Başlığı', d: 'Kara Koru’daki gizli hediyeyi aç' },
  { k: 'gunes', n: 'Güneş Gözlüğü', d: 'Kemik ile Dev Hortlak’ı 60 saniyede devir' },
  { k: 'serif', n: 'Şerif Şapkası', d: 'Çalı ile bir boss ya da ara bossu 1 saniyede devir' },
  { k: 'pilot', n: 'Pilot Miğferi', d: 'Anka ile havadayken Kapan ile 1.000 düşman öldür' },
  { k: 'kavuk', n: 'Kavuk', d: 'Tulpar ile Kademe 3’ü bitir' },
  { k: 'migfer', n: 'Boynuzlu Miğfer', d: 'Bahadır ile tek koşuda 10.000 düşman öldür' },
  { k: 'sarik', n: 'Sarık', d: 'Kam ile Ateş Topu, Yıldırım ve Kan Büyüsü’nü 40. seviyeye çıkar' },
  { k: 'bork', n: 'Börk', d: 'Alp ile can çalmayla toplam 10.000 can iyileş' },
  { k: 'kalpak', n: 'Kalpak', d: 'Gölge ile Kızıl Bozkır 1. aşamayı en az 2 Kara sunak açıkken bitir' },
  { k: 'tulbent', n: 'Tülbent', d: 'Gölge ile 500 düşman dondur' }
];

// ---- rütbe: 1-100, gereken tecrübe rütbeyle büyür
export function rankXp(ci) {
  return $G.META.rank[CR[ci].k] || 0;
}

export function rankNeed(r) {
  return Math.round(20 * Math.pow(r, 1.5));
}

export function rankOf(ci) {
  let xp = rankXp(ci), r = 1;
  while (r < 100 && xp >= rankNeed(r)) {
    xp -= rankNeed(r);
    r++;
  }
  return r;
}

export function rankProg(ci) {
  let xp = rankXp(ci), r = 1;
  while (r < 100 && xp >= rankNeed(r)) {
    xp -= rankNeed(r);
    r++;
  }
  return r >= 100 ? [1, 1] : [xp, rankNeed(r)];
}

export function curRank() {
  return rankOf($G.CI);
}

export function __init_29b() {
  $G.CRK = () => CR[$G.CI].k;
}

// ---- Çalı: Tam isabet (Megabonk Bush "Bullseye")
// Rastgele bir düşman nişangâhla işaretlenir; işaretliye gelen ilk silah vuruşu çevresinde patlar, yarıçap Boyut ile ölçeklenir.
// Bekleme 5 sn, her 10 rütbede 0.4 sn kısalır, en az 1 sn (resmî yama notu v1.0.12); patlama boyutu Boyut ile ölçeklenir
// (v1.0.17); aynı anda en çok 20 işaret (decompile MAX_MARKERS). Kaynaklarda olmayanlar tahmin (6 Kasım 2026'da yeniden
// arandı, değerler decompile'da silinmiş): patlama hasarı (tetikleyen vuruş kadar), işaret ömrü 10 sn, seçim menzili 24 m.
const BULL = [];
let bullMat = null;

function bullSprite() {
  if (!bullMat) {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const x = c.getContext('2d');
    if (x) {
      x.strokeStyle = '#fff';
      x.lineWidth = 5;
      x.beginPath();
      x.arc(32, 32, 20, 0, 6.283);
      x.stroke();
      x.lineWidth = 4;
      for (const [ax, ay, bx, by] of [[32, 2, 32, 20], [32, 44, 32, 62], [2, 32, 20, 32], [44, 32, 62, 32]]) {
        x.beginPath();
        x.moveTo(ax, ay);
        x.lineTo(bx, by);
        x.stroke();
      }
    }
    // glow() ile aynı shader programı (dokulu, sisli sprite); karışım normal, ışımaya girmez
    bullMat = new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), color: 0xff5a3a, transparent: true, opacity: .9, depthWrite: false, depthTest: false, fog: true });
  }
  const o = new THREE.Sprite(bullMat);
  sc.add(o);
  return o;
}

export function bullClear() {
  for (const b of BULL) sc.remove(b.s);
  BULL.length = 0;
}

function bullTick(dt, r) {
  const P = $G.P;
  for (let i = BULL.length - 1; i >= 0; i--) {
    const b = BULL[i],
      e = b.e;
    b.l -= dt;
    if (e.dead || b.l <= 0 || !$G.E.includes(e)) {
      sc.remove(b.s);
      BULL.splice(i, 1);
      continue;
    }
    const q = e.m.position,
      k = Math.max(1.3, e.r * 1.7) * (1 + .08 * Math.sin(b.l * 9));
    b.s.position.set(q.x, q.y + e.r, q.z);
    b.s.scale.set(k, k, 1);
  }
  P.bullT = (P.bullT == null ? 1.5 : P.bullT) - dt;
  if (P.bullT > 0 || BULL.length >= 20) return; // decompile: MAX_MARKERS = 20
  const c = $G.E.filter(e => !e.dead && Math.hypot(e.m.position.x - P.x, e.m.position.z - P.z) < 24 && !BULL.some(b => b.e === e));
  if (!c.length) return;
  P.bullT = Math.max(1, 5 - .4 * Math.floor(r / 10));
  BULL.push({ e: c[Math.random() * c.length | 0], s: bullSprite(), l: 10 });
}

function bullHit(c) {
  if (c.again || !BULL.length) return;
  const i = BULL.findIndex(b => b.e === c.e);
  if (i < 0) return;
  sc.remove(BULL[i].s);
  BULL.splice(i, 1);
  const q = c.e.m.position,
    R = 3.5 * $G.P.C.size;
  // src: patlama yeni vuruş kancası tetiklemez (zincirleme olmaz)
  for (const o of $G.E) {
    if (o.dead || o === c.e) continue;
    const p = o.m.position;
    if (Math.hypot(p.x - q.x, p.z - q.z) < R + o.r * .5 && Math.abs(p.y - q.y) < 4) hurtE(o, c.d, 0, { src: 'item' });
  }
  inc('bull');
  ringFx(q.x, q.y + .1, q.z, 0xff7a3a, R, 30);
  VFX.emit(VFX.ADD, q.x, q.y + c.e.r, q.z, { n: 1, sp: [0, 0], life: [.13, .15], s: [R * .9, R], s1: .5, c: 0xffc890, br: .6 });
  VFX.emit(VFX.SPK, q.x, q.y + c.e.r, q.z, { n: 6, sp: [8, 16], up: 3, life: [.2, .4], s: [.35, .6], s1: .2, c: 0xffb04a, g: 14, d: 1.5 });
  sfxAt('boom', q.x, q.z);
  $G.shk = Math.max($G.shk, .1);
}

// ---- pasif davranışlar
export const HH = {
  cali: {
    tick(c, r) { bullTick(c.dt, r); },
    hit(c) { bullHit(c); }
  },
  golge: {
    evade(c) { const e = c.src; if (e && !e.dead && e.t != 3 && !e.mini) { e.hp = 0; killE(e); puff(e.m.position.x, e.m.position.y + 1, e.m.position.z, 0x9fe8d8, 10); } }
  },
  kemik: {
    tick(c) { const P = $G.P; P.hs = Math.min(.6, (P.hs || 0) + .01 * c.dt); if (((P.hsT = (P.hsT || 0) + c.dt)) > 1) { P.hsT = 0; calc(); } },
    hurt() { $G.P.hs = ($G.P.hs || 0) * .75; calc(); }, // vurulunca momentumun dörtte biri gider (v1.0.41)
    hc(L) { const hs = $G.P.hs || 0; addStats(L, { spd: hs, dmg: hs * .5 }); }
  },
  pehlivan: {
    tick(c) { const P = $G.P; P.flexT = (P.flexT == null ? 8 : P.flexT) - c.dt; if (P.flexT <= 0) { P.flexT = 8; P.inv = Math.max(P.inv, 1); for (const e of $G.E) { const p = e.m.position; if (!e.dead && Math.hypot(p.x - P.x, p.z - P.z) < 4 + e.r) addStatus(e, 'stun', { t: 1.5 }); } P.SB.dmg = (P.SB.dmg || 0) + .025; calc(); ringFx(P.x, P.y - .6, P.z, 0xffd36a, 4, 14); sfx('deny'); } }
  },
  umay: {
    hit(c) { if (!c.again) c.d *= 1 + .5 * Math.max(0, 1 - $G.P.hp / $G.P.mh); },
    // Athena v1.0.4: Kalkan'ın kalkanı yokken +%150 saldırı hızı
    tick(c) { const w = $G.P.W.find(x => x.k == 'aegis'), on = w ? !(w.ch > 0) : 0; if (on != ($G.P.umayS || 0)) { $G.P.umayS = on; calc(); } },
    hc(L) { if ($G.P.umayS) addStats(L, { 'aspd*': 1.5 }); }
  },
  asikci: {
    level() { const [k, v] = SBD.filter(x => x[0] != 'curse' && x[0] != 'diff')[Math.random() * (SBD.length - 2) | 0]; $G.P.SB[k] = ($G.P.SB[k] || 0) + v; calc(); toast('Kumar: rastgele stat ' + k); }
  },
  anka: {
    tick() { const P = $G.P; if (P.air && $G.K[' '] && P.vy < -3) P.vy = -3; },
    hit(c, r) { if (!c.again && $G.P.air) c.d *= 1 + .01 * r; }
  },
  tulpar: {
    // Tony McZoom Zap: hareket ettikçe dolan elektrik saldırısı; her 30 m'de en yakın 5 düşmana yıldırım
    tick(c) { const P = $G.P, d = P.c && P.c.dist || 0; if (P.tulD == null) P.tulD = d; if (d - P.tulD >= 30) { P.tulD = d; const ts = tgts(16, 5); for (const e of ts) { hurtE(e, 20 * P.C.dmg, 0, { el: 'zap', src: 'item' }); VFX.zap(e.m.position.x, e.m.position.y + 1, e.m.position.z); } if (ts.length) sfx('zap'); } }
  },
  orakci: {
    tick(c) { const P = $G.P; P.ghCh = (P.ghCh == null ? rn(60, 120) : P.ghCh) - c.dt; if (P.ghCh <= 0) { P.ghCh = rn(60, 120); const a = rn(0, 6.28); mkChest({ x: P.x + Math.cos(a) * 4, z: P.z + Math.sin(a) * 4, free: 1 }); toast('Hayalet armağanı: yanında ücretsiz bir sandık belirdi'); } }
  }
};

export function heroHook(name, ctx) {
  const cr = CR[$G.CI],
    h = HH[cr.k];
  if (name == 'tick' && BULL.length && cr.k != 'cali') bullClear(); // kahraman değiştiyse eski işaretler kalmasın
  if (h && h[name]) h[name](ctx, rankOf($G.CI));
}

export function heroCalc(L, c1) {
  const cr = CR[$G.CI],
    h = HH[cr.k];
  if (h && h.hc) h.hc(L, rankOf($G.CI), c1);
}

// ---- kostüm: köşe renklerini dönüştürür (doğrusal uzay)
export const SKINF = {
  gold: (r, g, b) => { const l = .3 * r + .59 * g + .11 * b; return [l * .4 + .55 * (.6 + l * .5), l * .4 + .4 * (.5 + l * .5), l * .2 + .08]; },
  dark: (r, g, b) => [r * .3 + .02, g * .22 + .01, b * .38 + .05],
  fire: (r, g, b) => { const l = .3 * r + .59 * g + .11 * b; return [Math.min(1, r * .5 + .55 + l * .3), g * .35 + .12 * l, b * .15]; },
  acid: (r, g, b) => { const l = .3 * r + .59 * g + .11 * b; return [r * .3 + .1 * l, Math.min(1, g * .4 + .45 + l * .4), b * .25 + .05]; },
  red: (r, g, b) => { const l = .3 * r + .59 * g + .11 * b; return [Math.min(1, r * .4 + .5 + l * .3), g * .25 + .05, b * .25 + .05]; },
  white: (r, g, b) => { const l = .3 * r + .59 * g + .11 * b; return [.55 + l * .45, .55 + l * .45, .6 + l * .4]; },
  crypt: (r, g, b) => { const l = .3 * r + .59 * g + .11 * b; return [r * .35 + .2 * l + .08, g * .3 + .1 * l, Math.min(1, b * .5 + .35 + l * .3)]; }
};

export function applySkin(geo, skin) {
  const f = SKINF[skin];
  if (!f) return;
  const a = geo.attributes.color.array;
  for (let i = 0; i < a.length; i += 3) {
    const [r, g, b] = f(a[i], a[i + 1], a[i + 2]);
    a[i] = r;
    a[i + 1] = g;
    a[i + 2] = b;
  }
  geo.attributes.color.needsUpdate = true;
}

// ---- şapkalar: baş kemiğine bağlanan küçük modeller
function hatMesh(k) {
  const g = new THREE.Group(),
    cone = (c, r, h, y) => { const m = mk(new THREE.ConeGeometry(r, h, 10), BM(c), 0, y, 0, g); m.geometry.userData.own = 1; return m; },
    cyl = (c, r0, r1, h, y) => { const m = mk(new THREE.CylinderGeometry(r0, r1, h, 12), BM(c), 0, y, 0, g); m.geometry.userData.own = 1; return m; },
    sph = (c, r, x, y, z) => { const m = mk(new THREE.SphereGeometry(r, 10, 8), BM(c), x, y, z, g); m.geometry.userData.own = 1; return m; };
  switch (k) {
    case 'kurbaga1': case 'kurbaga2': case 'kurbaga3': {
      const c = k == 'kurbaga1' ? 0x5aa83a : k == 'kurbaga2' ? 0x3a7ad8 : 0xd83a3a;
      sph(c, .2, 0, .08, 0).scale.set(1, .7, 1);
      sph(0xffffff, .06, -.1, .2, .1); sph(0xffffff, .06, .1, .2, .1); sph(0x111111, .03, -.1, .2, .15); sph(0x111111, .03, .1, .2, .15);
      break; }
    case 'tuccar': cyl(0x2a2420, .3, .3, .03, .02); cyl(0x2a2420, .17, .15, .2, .13); break;
    case 'tuccar2': cyl(0x2a66d8, .3, .3, .03, .02); cyl(0x2a66d8, .17, .15, .2, .13); break;
    case 'tuccar3': cyl(0x8a3ad8, .3, .3, .03, .02); cyl(0x8a3ad8, .17, .15, .2, .13); break;
    case 'tuccar4': cyl(0xffd040, .3, .3, .03, .02); cyl(0xffd040, .17, .15, .2, .13); break;
    case 'silindir': cyl(0x1a1a1e, .28, .28, .03, .02); cyl(0x1a1a1e, .16, .16, .3, .18); break;
    case 'gunes': cyl(0x101014, .22, .22, .06, .12).rotation.x = 1.57; sph(0x101014, .07, -.1, .12, .2); sph(0x101014, .07, .1, .12, .2); break;
    case 'serif': cyl(0x8a6a3a, .34, .34, .03, .02); cyl(0x8a6a3a, .15, .13, .18, .12); sph(0xe0c060, .04, 0, .14, .16); break;
    case 'pilot': sph(0x6a5a40, .21, 0, .04, 0).scale.set(1, .8, 1); cyl(0x3a2a1a, .22, .22, .05, -.02); sph(0x9fe8ff, .09, 0, .1, .18); break;
    case 'kazanh': cyl(0x3a3a3a, .16, .13, .18, .12); cyl(0x8a5ad6, .14, .14, .02, .22); break;
    case 'takke': sph(0xc8a060, .19, 0, .02, 0).scale.set(1, .6, 1); break;
    case 'tac': cyl(0xe0c060, .17, .17, .1, .08); for (let i = 0; i < 5; i++) { const a = i / 5 * 6.283, m = cone(0xe0c060, .04, .12, .18); m.position.set(Math.cos(a) * .15, .18, Math.sin(a) * .15); } break;
    case 'kulah': cone(0x3a2a6a, .2, .55, .3); sph(0xffd36a, .04, 0, .58, 0); break;
    case 'soytari': [[-.14, 0], [.14, 0], [0, -.14]].forEach(([x, z], i) => { const m = cone([0xd83a3a, 0x3a7ad8, 0xe0c040][i], .09, .3, .18); m.position.x = x; m.position.z = z; m.rotation.z = -x * 2; m.rotation.x = z * 2; }); break;
    case 'peynir': { const m = mk(new THREE.BoxGeometry(.34, .14, .34), BM(0xf0c040), 0, .08, 0, g); m.geometry.userData.own = 1; m.rotation.y = .6; break; }
    case 'fes': cyl(0xb8261e, .14, .17, .5, .27); break;
    case 'comlek': cyl(0x8a5a32, .16, .12, .22, .13); break;
    case 'baret': sph(0xf0c030, .2, 0, .04, 0).scale.set(1, .65, 1); cyl(0xf0c030, .24, .24, .02, .01); break;
    case 'tolga': sph(0x7a8088, .2, 0, .02, 0).scale.set(1, .75, 1); cyl(0x7a8088, .02, .02, .22, -.05).position.z = .16; break;
    case 'noel': cone(0xd83a3a, .2, .45, .25); sph(0xffffff, .06, 0, .48, 0); cyl(0xffffff, .21, .21, .05, .03); break;
    case 'kavuk': sph(0xf0ead8, .25, 0, .08, 0).scale.set(1, .8, 1); cyl(0xb8261e, .1, .1, .12, .3); break;
    case 'migfer': sph(0x3a3a44, .2, 0, .02, 0).scale.set(1, .7, 1); [-1, 1].forEach(s => { const m = cone(0xe8e0d0, .05, .3, .1); m.position.x = s * .2; m.rotation.z = -s * .9; }); break;
    case 'sarik': sph(0xf0f0f0, .24, 0, .05, 0).scale.set(1, .7, 1); sph(0xf0f0f0, .18, 0, .18, 0).scale.set(1, .6, 1); break;
    case 'bork': cyl(0x5a3e28, .2, .18, .2, .1); cyl(0x8a6a4a, .22, .22, .06, .02); break;
    case 'kalpak': cyl(0x1a1614, .17, .19, .26, .14); break;
    case 'tulbent': cyl(0xf0f0f0, .21, .19, .08, .04); break;
    default: break;
  }
  return g;
}

export function hatName(k) {
  const h = HATS.find(x => x.k == k);
  return h ? h.n : '';
}

// Karakter modeli: varyant + kostüm + şapka
export function hero(k, skin, hat) {
  const ci = k,
    sk = skin != null ? skin : $G.META.skin['cur' + ci] || '',
    ht = hat != null ? hat : $G.META.hat.cur || '',
    key = 'h' + ci + (sk ? ':' + sk : '');
  const d = skData(key, () => MODELS.hero(CR[ci] ? CR[ci].k : ci), 1); // anahtarla: kadro sırası değişse de doğru gövde
  if (sk && !d.skinned) {
    applySkin(d.g, sk);
    d.skinned = 1;
  }
  const u = skInst(d);
  u.g.rotation.order = 'YXZ';
  if (CR[ci] && ACC.hero[CR[ci].k]) attachAcc(u, d.bones, ACC.hero[CR[ci].k]);
  const sc = CR[ci] && CR[ci].sc || 1;
  if (sc != 1) u.g.scale.setScalar(sc);
  if (ht && $G.META.hat[ht] && u.b.hd) {
    const hb = d.bones.find(b => b.n == 'hd'),
      top = Math.max(...d.eyes.map(e => e.p[1]), hb ? hb.h[1] : 2.5) + .22,
      m = hatMesh(ht);
    m.position.set(0, top - (hb ? hb.h[1] : 0), 0);
    u.b.hd.add(m);
    u.hat = m;
  }
  return u;
}
// ---- yaratıklar
