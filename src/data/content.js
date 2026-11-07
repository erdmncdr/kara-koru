// data/content.js · Kara Koru
// Bu dosya tek dosyalık sürümden (v22) otomatik ayrıldı. Ortak oyun durumu core/store.js içindeki $G nesnesinde.

import { $G } from '../core/store.js';
import { diffPct, swT } from '../game/stats.js';
import { CHAL } from './challenges.js';
import { CR, heroIdx, rankOf } from '../game/heroes.js';
import { BASE, CS } from './stats.js';
export { BASE, CS, STATS } from './stats.js';
import { ITD } from './items.js';
export { ITD } from './items.js';

export let MAPS, TOUCH, RM, STL, RAR, SN, WD, TDF, SBD, SHD, SHC, PUD, TY, EN, MU, ML, QD, ACHD, ACHM, mu, unl, fmtC, fmtS, stl, fmtU;

export function __init_37() {
  // ---- veri
  TOUCH = matchMedia('(pointer:coarse)').matches;
  RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  STL = 600;
  // Haritalar. bi: biyom, tiers: kademe sayısı, lock: META.l anahtarı, ud: açılış koşulu metni
  MAPS = [{
    k: 'koru',
    n: 'Kara Koru',
    bi: 0,
    tiers: 3,
    d: 'Tepeler, harabe kuleler, çamur ve su.'
  }, {
    k: 'bozkir',
    n: 'Kızıl Bozkır',
    bi: 1,
    tiers: 3,
    lock: 'bozkir',
    d: 'Açık düzlük, hortumlar, kum fırtınası.',
    ud: 'Kara Koru Kademe 2’de 2. aşamaya geç.'
  }, {
    k: 'mezarlik',
    n: 'Mezarlık',
    bi: 2,
    tiers: 1,
    lock: 'mezarlik',
    d: 'Mühürlü mahzen, dört tabut, Dev Hortlak. Tek kademe.',
    ud: 'Kemik ile Kızıl Bozkır’da dört mezarı huzura erdir ve Kemik’in Babası’nı devir.'
  }];
  RAR = [{
    n: 'Sıradan',
    c: '#b4b6ac',
    m: 1
  }, {
    n: 'Seçkin',
    c: '#72c25e',
    m: 1.2
  }, {
    n: 'Nadir',
    c: '#4f97ea',
    m: 1.4
  }, {
    n: 'Destansı',
    c: '#b770e6',
    m: 1.6
  }, {
    n: 'Efsanevi',
    c: '#eda93a',
    m: 2
  }, {
    n: 'Lanetli',
    c: '#b45cff',
    m: 1
  }];
  SN = {
    dmg: 'Hasar',
    cnt: 'Mermi',
    cd: 'Bekleme',
    prc: 'Delme',
    sz: 'Boyut',
    spd: 'Dönüş hızı',
    kb: 'İtme',
    dur: 'Süre',
    crit: 'Kritik şansı',
    critd: 'Kritik hasarı',
    bnc: 'Sekme'
  };
  WD = {
    bolt: {
      n: 'Ruh Okları',
      ic: 'bolt',
      d: 'En yakın düşmana ok atar. Delme arttıkça oklar düşmanların içinden geçer.',
      b: { dmg: 9, cnt: 1, cd: .75, prc: 0, crit: 0, critd: 0 },
      u: { dmg: 2.6, cnt: 1, crit: .08, critd: .18 }
    },
    orbit: {
      n: 'Dönen Kılıçlar',
      ic: 'orbit',
      d: 'Etrafında dönen kılıçlar değdiği düşmanı keser.',
      b: { dmg: 12, cnt: 2, sz: 1, spd: 1 },
      u: { dmg: 3, cnt: 1, sz: .2, spd: .27 },
      sn: {
        cnt: 'Kılıç'
      }
    },
    nova: {
      n: 'Şok Dalgası',
      ic: 'nova',
      d: 'Düşmanları geri iten ve düşman mermilerini silen bir halka yayar.',
      b: {
        dmg: 9,
        sz: 1,
        cd: 3,
        kb: 1
      },
      u: {
        dmg: 4,
        sz: .15,
        kb: .5
      },
      lock: 'nova'
    },
    zap: {
      n: 'Yıldırım',
      el: 'zap',
      ic: 'zap',
      d: 'Yakındaki rastgele bir düşmana gökten yıldırım düşürür; yıldırım sıradaki düşmanlara zincirlenir, çarptığı yerin çevresini de çarpar.',
      b: { dmg: 9, cnt: 1, cd: 1.1 },
      u: { dmg: 3, cnt: 1 },
      sn: {
        cnt: 'Hedef'
      }
    },
    fire: {
      n: 'Ateş Topu',
      el: 'fire',
      ic: 'fire',
      d: 'Hedefte patlayıp çevresindeki herkese hasar veren ateş topu atar.',
      b: { dmg: 10, cnt: 1, sz: 1, cd: 2.4 },
      u: { dmg: 2.5, cnt: 1, sz: .16 }
    },
    poi: {
      n: 'Zehir İzi',
      el: 'poison',
      ic: 'poi',
      d: 'Geçtiğin yere zehirli bir iz bırakır, dururken ayağının dibinde göllenir. İzdeki düşmanlar zehirlenir; zehir izden çıkınca da işler.',
      b: {
        dmg: 3,
        sz: 1,
        dur: 3
      },
      u: {
        dmg: 1,
        sz: .15,
        dur: .3
      },
      lock: 'poi'
    },
    axe: {
      n: 'Balta',
      ic: 'axe',
      lock: 'axe',
      d: 'Havaya kavisli baltalar fırlatır. Düşerken değdiği herkesi keser.',
      b: { dmg: 6, cnt: 2, cd: 1.7, sz: 1 },
      u: { dmg: 1.5, cnt: 1, sz: .1 },
      sn: {
        cnt: 'Balta'
      }
    },
    aura: {
      n: 'Kor Halkası',
      ic: 'aura',
      lock: 'aura',
      d: 'Etrafında yanan bir halka, içine giren düşmanları sürekli yakar.',
      b: { dmg: 6, sz: 1, cd: .5 },
      u: { dmg: 1.4, sz: .14 },
      sn: {
        sz: 'Alan',
        cd: 'Yakma aralığı'
      }
    },
    ice: {
      n: 'Ayaz',
      el: 'ice',
      ic: 'ice',
      d: 'Çevrende buz aurası. İçindekiler yavaşlar, üçüncü darbede donar.',
      b: { dmg: 9, cnt: 2, cd: 1, dur: 1.6, sz: 1 },
      u: { dmg: 2, dur: .12, sz: .1 },
      lock: 'ice',
      sn: {
        dur: 'Yavaşlatma'
      }
    },
    slash: {
      n: 'Kılıç Savuruşu',
      ic: 'slash',
      d: 'Önündeki düşmanlara geniş bir yay çizerek kılıç savurur. Savuruş sayısı arttıkça arkana ve yanlara da keser.',
      b: { dmg: 11, cnt: 1, cd: 1.15, sz: 1 },
      u: { dmg: 2, cnt: 1, sz: .2 },
      sn: {
        cnt: 'Savuruş',
        sz: 'Menzil'
      }
    },
    vortex: {
      n: 'Girdap',
      ic: 'vortex',
      lock: 'vortex',
      d: 'Düşmanların en kalabalık olduğu yere bir girdap açar. İçine çektiği düşmanları ezer, sonunda patlar.',
      b: { dmg: 4, sz: 1, cd: 5.5, dur: 2 },
      u: { dmg: 1.3, sz: .13, dur: .12 },
      sn: {
        sz: 'Alan',
        dur: 'Süre'
      }
    },
    boom: {
      n: 'Kemik Bumerang',
      lock: 'boom',
      ic: 'boom',
      d: 'Fırlatılan bumerang gidip geri döner, iki yönde de keser.',
      b: { dmg: 9, cnt: 1, cd: 1.5, sz: 1 },
      u: { dmg: 2, cnt: 1, sz: .14 },
      sn: {
        sz: 'Menzil',
        cnt: 'Bumerang'
      }
    },
    bone: {
      n: 'Kemik',
      ic: 'bone',
      d: 'Düşmana kemik fırlatır, kemik vurduğu düşmandan bir sonrakine seker.',
      b: { dmg: 11, cnt: 1, cd: 1, bnc: 1, kb: 1.3 },
      u: { dmg: 2.5, cnt: 1, bnc: 1, kb: .3 }
    },
    rifle: {
      n: 'Tüfek',
      ic: 'rifle',
      d: 'Fitilli tüfek: en yakın düşmanlara altı mermi birden. Kritik vuruşu sever.',
      b: { dmg: 5, cnt: 6, cd: 1.3, crit: .05, critd: 0 },
      u: { dmg: 2.5, cnt: 1, crit: .1, critd: .2 },
      lock: 'rifle'
    },
    aegis: {
      n: 'Kalkan',
      ic: 'aegis',
      d: 'Gelen darbeleri engeller ve her engellemede bir şok dalgası yayar. Diken statı dalganın hasarına eklenir.',
      b: { dmg: 10, cnt: 2, cd: 3, sz: 1, kb: 3 },
      u: { dmg: 2, cnt: 1, sz: .15, kb: .8 },
      lock: 'aegis',
      sn: { cnt: 'Şarj', cd: 'Şarj süresi', sz: 'Dalga alanı' }
    },
    rocket: {
      n: 'Havai Fişek',
      ic: 'rocket',
      d: 'Hedefi izleyen bir fişek fırlatır, değince patlar.',
      b: { dmg: 11, cnt: 1, cd: 2, sz: 1, kb: 2 },
      u: { dmg: 2, cnt: 1 },
      lock: 'rocket',
      sn: { sz: 'Patlama alanı' }
    },
    tornado: {
      n: 'Hortum',
      ic: 'tornado',
      d: 'Düşmana doğru ilerleyen bir hortum salar; içine giren düşmanları savurur ve havaya kaldırır.',
      b: { dmg: 8, cnt: 1, cd: 3, sz: 1, dur: 3, kb: 3 },
      u: { dmg: 2, cnt: 1, sz: .14, kb: .6 },
      lock: 'tornado',
      sn: { cnt: 'Hortum' }
    },
    dexe: {
      n: 'Cellat Palası',
      ic: 'dexe',
      d: 'Düşmanları delip geçen bir pala fırlatır. Canı azalmış düşmanı tek vuruşta infaz eder; boss ve ara bossta %2 şansla azami canın %2’sini götürür.',
      b: { dmg: 9, cnt: 1, cd: 1.1, prc: 3, crit: 0 },
      u: { dmg: 2, cnt: 1, crit: .05 },
      lock: 'dexe'
    },
    sniper: {
      n: 'Uzun Menzilli',
      ic: 'sniper',
      d: 'En uzaktaki düşmanlara delici atışlar; her adet ayrı bir hedefe. Yavaş ama çok sert vurur.',
      b: { dmg: 22, cnt: 1, cd: 2.6, prc: 6, crit: .05, critd: 0 },
      u: { dmg: 6, cnt: 1 },
      lock: 'sniper'
    },
    noodle: {
      n: 'Işık Hüzmesi',
      ic: 'noodle',
      d: 'Hedefe menzilin sonuna kadar uzanan bir ışık hüzmesi çeker; hattaki her düşman çarpılır. Her adet ayrı bir hüzme.',
      b: { dmg: 10, cnt: 1, cd: 1.1, sz: 1 },
      u: { dmg: 2.5, cnt: 1, sz: .15 },
      lock: 'noodle',
      el: 'zap',
      sn: { sz: 'Hüzme kalınlığı' }
    },
    dragon: {
      n: 'Ejder Nefesi',
      ic: 'dragon',
      d: 'Önüne üç dalga hâlinde bir alev konisi püskürtür, düşmanları tutuşturur.',
      b: { dmg: 12, cd: 1.6, sz: 1 },
      u: { dmg: 3, sz: .15 },
      lock: 'dragon',
      el: 'fire',
      sn: { sz: 'Koni' }
    },
    mines: {
      n: 'Kapan',
      ic: 'mines',
      d: 'Geçtiğin yere kapan bırakır. Düşman basınca patlar ve çevresini savurur.',
      b: { dmg: 10, cnt: 1, cd: 1.4, sz: 1, dur: 4, kb: 4 },
      u: { dmg: 3, cnt: 1, sz: .15, dur: .4 },
      lock: 'mines',
      sn: { cnt: 'Ek kapan', dur: 'Ömür' }
    },
    flask: {
      n: 'Zehir Şişesi',
      ic: 'flask',
      d: 'Hedefe bir şişe fırlatır; kırıldığı yerde düşmanları zehirleyen bir gölcük kalır.',
      b: { dmg: 1, cnt: 1, cd: 1.8, sz: 1, dur: 3 },
      u: { dmg: .5, cnt: 1, sz: .15, dur: 1 },
      lock: 'flask',
      el: 'poison'
    },
    katana: {
      n: 'Yatağan',
      ic: 'katana',
      d: 'En yakın düşmana hızlı ve dar bir kesik.',
      b: { dmg: 11, cnt: 1, cd: .7, sz: 1, crit: 0, critd: 0 },
      u: { dmg: 2.2, cnt: 1, sz: .2, crit: .08, critd: .2 },
      lock: 'katana',
      sn: { cnt: 'Kesik', sz: 'Menzil' }
    },
    blood: {
      n: 'Kan Büyüsü',
      ic: 'blood',
      d: 'Düşmanları delip geçen kan mermisi fırlatır. Öldürdüğü düşmanların bir kısmı azami canını kalıcı artırır.',
      b: { dmg: 10, cnt: 1, cd: 1, prc: 2 },
      u: { dmg: 3, cnt: 1 },
      lock: 'blood'
    },
    dagger: {
      n: 'Uçan Hançer',
      ic: 'dagger',
      d: 'Hedefi kovalayan yıldırım yüklü hançerler.',
      b: { dmg: 9, cnt: 1, cd: .9, bnc: 1 },
      u: { dmg: 2, cnt: 1, bnc: 1 },
      lock: 'dagger',
      el: 'zap'
    },
    dice: {
      n: 'Aşık Kemiği',
      ic: 'dice',
      d: 'Aşık atar, aşık bir düşmandan ötekine seker. Hasar zara göre: 1 zayıf, 6 neredeyse iki kat; altı gelirse kritik şansın kalıcı olarak artar.',
      b: { dmg: 9, cnt: 1, cd: 1.1, bnc: 1, crit: .17, critd: 0, kb: 2.5 },
      u: { dmg: 2, cnt: 1, crit: .1, critd: .2 },
      lock: 'dice'
    },
    hero: {
      n: 'Alp Kılıcı',
      ic: 'hero',
      d: 'Kesikle birlikte ileri uçan bir kesik dalgası salar.',
      b: { dmg: 11, cnt: 1, cd: 1.1, sz: 1, kb: 2 },
      u: { dmg: 2, cnt: 1, sz: .15 },
      lock: 'hero',
      sn: { cnt: 'Savuruş', sz: 'Menzil' }
    },
    corrupt: {
      n: 'Erlik Kılıcı',
      ic: 'corrupt',
      d: 'Her savuruşta önünü ve arkanı keser. Canın azaldıkça daha sert vurur.',
      b: { dmg: 12, cnt: 1, cd: 1.15, sz: 1, kb: 2 },
      u: { dmg: 4, cnt: 1, sz: .14 },
      lock: 'corrupt',
      sn: { cnt: 'Savuruş', sz: 'Menzil' }
    },
    shotgun: {
      n: 'Çakaralmaz',
      ic: 'shotgun',
      d: 'Saçma yayar; her saçma bir düşmanı delip geçer. Yakında çok, uzakta az hasar. Fareyle nişan alırsan baktığın yöne sıkar.',
      b: { dmg: 9, cnt: 5, cd: 1.25, prc: 1, crit: .05, critd: 0, kb: 2.5 },
      u: { dmg: 4, cnt: 1, crit: .07, kb: .4 },
      lock: 'shotgun',
      sn: { cnt: 'Saçma' }
    },
    scythe: {
      n: 'Tırpan',
      ic: 'scythe',
      d: 'Çevrende tam bir daire çizer. Bir elit ya da ara boss öldürdükten sonraki savuruş üç kat vurur.',
      b: { dmg: 11, cd: 1.3, sz: 1, crit: 0 },
      u: { dmg: 4, sz: .15, crit: .04 },
      lock: 'scythe',
      sn: { sz: 'Menzil' }
    },
    korizi: {
      n: 'Kor İzi',
      ic: 'korizi',
      d: 'Geçtiğin yere düşmanları yakan bir kor izi bırakır, dururken ayağının dibinde yanar.',
      b: { dmg: 5, sz: 1, dur: 1.5 },
      u: { dmg: 2, sz: .15, dur: .18 },
      el: 'fire'
    }
  };
  TDF = {
    dmg: { n: 'Güç Tomu', ic: 'sword', s: 'Tüm silahların hasarı', v: .08 },
    bounce: { n: 'Sekme Tomu', ic: 'dots', s: 'Mermiler ek sekme yapar', v: 1, f: 'i', lock: 't_bounce', d: 'Her seviye bütün mermilere bir sekme ekler.' },
    aspd: { n: 'Hız Tomu', ic: 'chev', s: 'Tüm silahların saldırı hızı', v: .075 },
    cnt: { n: 'Çokluk Tomu', ic: 'dots', s: 'Ek mermi, kılıç ve hedef', v: 1, f: 'i', lock: 't_cnt' },
    size: { n: 'Boyut Tomu', ic: 'expand', s: 'Saldırı alanı', v: .1 },
    crit: { n: 'Keskinlik Tomu', ic: 'target', s: 'Kritik vuruş şansı', v: .07 },
    hp: { n: 'Can Tomu', ic: 'heart', s: 'Azami can', v: 25 },
    regen: { n: 'Yenilenme Tomu', ic: 'plus', s: 'Can yenilenmesi', v: .67 },
    arm: { n: 'Zırh Tomu', ic: 'shield', s: 'Zırh', v: .12, lock: 't_arm' },
    spd: { n: 'Çeviklik Tomu', ic: 'run', s: 'Hareket hızı', v: .15 },
    mag: { n: 'Mıknatıs Tomu', ic: 'magnet', s: 'Toplama alanı', v: .75, lock: 't_mag' },
    xp: { n: 'Bilgelik Tomu', ic: 'star', s: 'Tecrübe kazancı', v: .09, lock: 't_xp' },
    gold: { n: 'Altın Tomu', ic: 'coin', s: 'Altın kazancı', v: .12 },
    luck: { n: 'Şans Tomu', ic: 'clover', s: 'Nadir seçenek ve eşya şansı', v: .07, lock: 't_luck' },
    ls: { n: 'Kan Tomu', ic: 'drop', s: 'Can çalma: vuruş başına 1 can iyileşme şansı', v: .1, lock: 't_ls', d: 'Her seviye vuruş başına 1 can iyileşme şansını %10 artırır. %100 üstü ikinci can için şans verir.' },
    kb: { n: 'İtme Tomu', ic: 'kb', s: 'Vuruşların itme gücü', v: .2 },
    pspd: { n: 'Mermi Hızı Tomu', ic: 'pspd', s: 'Mermi hızı', v: .15 },
    dur: { n: 'Süre Tomu', ic: 'dur', s: 'Alan ve etki süresi', v: .15, lock: 't_dur' },
    eva: { n: 'Kaçınma Tomu', ic: 'eva', s: 'Kaçınma şansı', v: .1 },
    shield: { n: 'Kalkan Tomu', ic: 'shieldt', s: 'Kalkan puanı: hasar önce kalkanı eritir, vurulmayınca dolar', v: 25 },
    thorns: { n: 'Diken Tomu', ic: 'thorns', s: 'Diken: sana değen düşman hasar alır', v: 15, lock: 't_thorns' },
    silver: { n: 'Gümüş Tomu', ic: 'silver', s: 'Koşu sonu gümüş kazancı', v: .12 },
    curse: { n: 'Lanet Tomu', ic: 'skull', s: 'Lanet', v: .035, lock: 't_curse', d: 'Her seviyede zorluk %3.5 artar, buna karşılık altın ve tecrübe daha bol gelir.' },
    denge: { n: 'Denge Tomu', ic: 'expand', s: 'Her statta küçük bir artış', v: 1, fxl: { dmg: .02, aspd: .02, size: .02, crit: .01, hp: 5, regen: .1, arm: .015, spd: .015, mag: .1, xp: .02, gold: .02, luck: .015 }, d: 'Her seviye bütün temel statlara küçük bir pay ekler.' },
    istif: { n: 'İstifçi Tomu', ic: 'coin', s: 'Her seviyede haritada açık bir sandık belirir', v: 1, fxl: { chest: .01 }, d: 'Her seviye haritada rastgele bir yerde ücretsiz bir sandık belirir.' },
    kumar: { n: 'Kumar Tomu', ic: 'dice', s: 'Ya hep ya hiç', v: 1, fxl: { dmg: .15, 'hp*': -.05 }, d: 'Her seviye +%15 hasar; azami can %5 azalır (kalan candan, bileşik).' },
    chaos: { n: 'Kaos Tomu', ic: 'chaos', s: 'Her seviyede rastgele bir stat', v: 1, rand: 1, lock: 't_chaos', d: 'Her seviye rastgele bir statı yükseltir. Ne geleceğini bilemezsin.' }
  };
  SBD = [['dmg', .12], ['aspd', .06], ['size', .08], ['crit', .05], ['hp', 15], ['regen', .33], ['arm', .05], ['spd', .08], ['mag', .2], ['xp', .075], ['gold', .075], ['luck', .05], ['pspd', .1], ['dur', .08], ['kb', .1], ['shield', 5], ['eva', .05], ['ls', .06], ['thorns', 5], ['curse', .08], ['diff', .08], ['critd', .1], ['jmp', .08], ['fall', .1], ['effdur', .08], ['heal', .08], ['elspawn', .1]]; // Ocak havuzu (survivorsdb)
  SHD = [{
    n: 'Ocak',
    h: 'İçinde dur, kalıcı bir güç seç'
  }, {
    n: 'Balbal taşı',
    h: 'ücretsiz bir eşya seç'
  }, {
    n: 'Rüzgâr taşı',
    h: 'haritadaki tüm kristalleri çek'
  }, {
    n: 'Kan sunağı',
    h: '4 seçkin düşman çağır, altın sandık kazan'
  }, {
    n: 'Açgözlülük taşı',
    h: 'zorluk +%5, 25-30 altın'
  }, {
    n: 'Altın ocak',
    h: 'İçinde dur, destansı ya da efsanevi güç seç'
  }, {
    n: 'Kara sunak',
    h: 'sonraki boss ikiz gelir, her biri altın sandık düşürür'
  }, {
    n: 'Haydut taşı',
    h: 'Kara Haydut’u çağır, yenersen bol gümüş ve sandık düşürür'
  }, {
    n: 'Meydan okuma sunağı',
    h: 'bu koşu için bir meydan okuma seç (gümüş çarpanı)'
  }, {
    n: 'Mezar taşı',
    h: 'tecrübe +%10, zorluk +%5'
  }, {
    n: 'Tabut',
    h: 'aç: içinden bir ara boss çıkar, anahtar düşürür'
  }, {
    n: 'Kafes',
    h: 'Kafes Anahtarı ile aç, içindeki tutsak ruhu kurtar; ruh bedava bir sandık bırakır'
  }, {
    n: 'Şüpheli çalı',
    h: 'dürt: bir şey kıpırdıyor'
  }, {
    n: 'Denge taşı',
    h: 'bir statını ikiye katlar, bir başkasını yarıya indirir (kalıcı)'
  }, {
    n: 'Hediye',
    h: 'aç: Noel Başlığı'
  }, {
    n: 'Parlak Muz',
    h: 'al: Kemik Bumerang açılır'
  }, {
    n: 'Yumurta',
    h: 'kır: içinden ne çıkacağı belli olmaz'
  }, {
    n: 'İskelet Kralı heykeli',
    h: 'uyandır: İskelet Kralı gelir, öldürürsen sandık düşürür'
  }, {
    n: 'Eski Maske',
    h: 'al: Eski Maske eşyası açılır'
  }, {
    n: 'Yılan yuvası',
    h: 'al: Yılan eşyası açılır'
  }];
  SHC = [0xe2702c, 0x9fe8d8, 0x8fd6c8, 0xc4302b, 0xd9b26a, 0xffc84a, 0xb8263a, 0x8a74d8, 0x6ad6f0, 0xff9a4a, 0x8a74d8, 0xc8a060, 0x6aa04a, 0xd8d8e8, 0xd83a3a, 0xffe040, 0xf0e8d0, 0xe8e0d0, 0xb89a6a, 0x6ad06a];
  // güçler (power-up): potlardan düşer, Güç düşme şansı ve Güç etkisi statlarıyla ölçeklenir
  PUD = {
    heal: { n: 'Lahmacun', c: 0xff6a5a, d: 'canının %8’i artı 10', item: 1 }, // güç değil, Lahmacun eşyasının bıraktığı yiyecek
    bolt: { n: 'Mor Yıldırım', c: 0xb070ff, d: '15 sn 1.5 kat hasar, 2 kat saldırı hızı' },
    gold: { n: 'Altın', c: 0xffd36a, d: '15 sn her öldürme +1 altın' },
    shield: { n: 'Kalkan', c: 0xd9b26a, d: '15 sn hasar almazsın' },
    clock: { n: 'Saat', c: 0x9fd8ff, d: '12 sn düşmanlar donar' },
    mag: { n: 'Mıknatıs', c: 0x8fd6c8, d: 'bütün kristaller sana gelir' },
    nuke: { n: 'Tengri Ateşi', c: 0xffe08a, d: '15 m içindeki her şey kül olur, boss %10 hasar alır' }
  };
  TY = [{
    hp: 4,
    sp: 6,
    r: 1,
    d: 7,
    xp: 1,
    au: 1
  }, {
    hp: 3,
    sp: 11,
    r: .9,
    d: 6,
    xp: 1,
    au: 1
  }, {
    hp: 30,
    sp: 4,
    r: 1.6,
    d: 14,
    xp: 6,
    au: 4
  }, {
    hp: 0,
    sp: 5,
    r: 5,
    d: 24,
    xp: 0,
    au: 0
  }, {
    hp: 7,
    sp: 5,
    r: .9,
    d: 6,
    xp: 3,
    au: 2
  }, {
    hp: 16,
    sp: 6.5,
    r: 1.3,
    d: 15,
    xp: 5,
    au: 3
  }];
  EN = ['Gulyabani', 'Yarasa', 'Taş dev', 'Tepegöz', 'İskelet okçu', 'Karakoncolos'];
  // kalıcı ilerleme
  MU = [{
    k: 'dmg',
    n: 'Keskin demir',
    st: 'dmg',
    v: .01,
    m: 20,
    c: [8, 11, 18, 25, 32, 40, 49, 59, 70, 82, 97, 113, 133, 156, 184, 217, 258, 307, 368, 442],
    qn: 10
  }, {
    k: 'hp',
    n: 'Kalın deri',
    st: 'hp',
    v: 2,
    m: 20,
    c: [8, 11, 18, 25, 32, 40, 49, 59, 70, 82, 97, 113, 133, 156, 184, 217, 258, 307, 368, 442],
    qn: 15
  }, {
    k: 'spd',
    n: 'Hafif adım',
    st: 'spd',
    v: .01,
    m: 20,
    c: [8, 11, 18, 25, 32, 40, 49, 59, 70, 82, 97, 113, 133, 156, 184, 217, 258, 307, 368, 442],
    qn: 20
  }, {
    k: 'luck',
    n: 'Nazarlık',
    st: 'luck',
    v: .01,
    m: 20,
    c: [8, 11, 18, 25, 32, 40, 49, 59, 70, 82, 97, 113, 133, 156, 184, 217, 258, 307, 368, 442],
    qn: 25
  }, {
    k: 'mag',
    n: 'Mıknatıs taşı',
    st: 'mag',
    v: .05,
    m: 20,
    c: [8, 11, 18, 25, 32, 40, 49, 59, 70, 82, 97, 113, 133, 156, 184, 217, 258, 307, 368, 442],
    qn: 30
  }, {
    k: 'gold',
    n: 'Kese',
    st: 'gold',
    v: .02,
    m: 20,
    c: [8, 11, 18, 25, 32, 40, 49, 59, 70, 82, 97, 113, 133, 156, 184, 217, 258, 307, 368, 442],
    qn: 35
  }, {
    k: 'xp',
    n: 'Ata bilgisi',
    st: 'xp',
    v: .02,
    m: 20,
    c: [8, 11, 18, 25, 32, 40, 49, 59, 70, 82, 97, 113, 133, 156, 184, 217, 258, 307, 368, 442],
    qn: 45
  }, {
    k: 'regen',
    n: 'Şifalı ot',
    st: 'regen',
    v: .1,
    m: 20,
    c: [8, 11, 18, 25, 32, 40, 49, 59, 70, 82, 97, 113, 133, 156, 184, 217, 258, 307, 368, 442],
    qn: 50
  }, {
    k: 'sv',
    n: 'Gümüş kesesi',
    st: 'silver',
    v: .025,
    win: 1,
    m: 20,
    c: [8, 11, 18, 25, 32, 40, 49, 59, 70, 82, 97, 113, 133, 156, 184, 217, 258, 307, 368, 442]
  }, {
    k: 'rr',
    n: 'Fal taşı',
    d: 'Seviye ekranında +1 yenileme hakkı (ilk hak bedava)',
    m: 6,
    c: [8, 15, 24, 33, 43, 55],
    qn: 20
  }, {
    k: 'sk',
    n: 'Atlama',
    d: 'Seviye ekranında +1 atlama hakkı',
    m: 6,
    c: [8, 15, 24, 33, 43, 55],
    qn: 30
  }, {
    k: 'bn',
    n: 'Kara liste',
    d: 'Seviye ekranında +1 çıkarma hakkı',
    m: 6,
    c: [8, 15, 24, 33, 43, 55],
    qn: 40
  }, {
    k: 'ws',
    n: 'Silah slotu',
    d: '+1 silah slotu (2 → 4)',
    m: 2,
    c: [25, 125],
    qn: [25, 45]
  }, {
    k: 'ts',
    n: 'Tom slotu',
    d: '+1 tom slotu (2 → 4)',
    m: 2,
    c: [35, 135],
    qn: [35, 55]
  }, {
    k: 'tg',
    n: 'Toggler',
    d: 'Açtığın silah, tom ve eşyaları havuzdan çıkarabilirsin. 40 kilit açınca satın alınır',
    m: 1,
    c: [50],
    unl: 40
  }, {
    k: 'bb',
    n: 'Davul',
    d: 'Kös takımı, Otağ’ın hatırası. Kara Koru’da üç kösü de çalınca açılır. Makam seçimi ayarlarda herkese açıktır',
    m: 1,
    c: [5],
    need: 'boombox'
  }, {
    k: 'sg',
    n: 'Miras',
    d: 'Koşuya +20 altınla başla',
    m: 10,
    c: [8, 11, 18, 25, 32, 40, 49, 59, 70, 82],
    qn: 12
  }];
  ML = [{
    k: 'ice',
    n: 'Ayaz silahı (gümüşle)',
    d: 'Düşmanları yavaşlatan buz silahı seviye seçeneklerine girer. Görev yoluyla da açılır.',
    c: 120
  }, {
    k: 'boom',
    n: 'Kemik Bumerang',
    d: 'Gidip gelen bumerang silahı seviye seçeneklerine girer',
    c: 120
  }];
  // Koşu bittiğinde over() değerleri META'ya işler; o andan sonra tekrar sayılmasın.
  const runK = () => $G.P && !$G.P.banked ? $G.kills : 0,
    runV = k => $G.P && !$G.P.banked ? $G.P[k] : 0,
    runC = k => $G.P && !$G.P.banked && $G.P.c ? $G.P.c[k] || 0 : 0,
    tomLv = k => $G.P ? Math.max(0, ...$G.P.T.filter(t => t.k == k).map(t => t.lv)) : 0,
    wLv = k => $G.P ? Math.max(0, ...$G.P.W.filter(w => w.k == k).map(w => w.lv)) : 0;
  QD = [{
    k: 'k500',
    n: 'Toplam 500 düşman öldür',
    r: 50,
    f: () => [$G.META.st.k + runK(), 500]
  }, {
    k: 'boss',
    n: 'Tepegöz’ü devir',
    r: 80,
    f: () => [$G.META.st.b + runV('bosses'), 1]
  }, {
    k: 'st2',
    n: 'Kızıl Bozkır’ı aç',
    r: 60,
    f: () => [$G.META.l.bozkir ? 1 : 0, 1]
  }, {
    k: 'mezar',
    n: 'Dört mezarın ruhunu huzura erdir',
    r: 70,
    f: () => [$G.P && $G.P.mzD ? 1 : 0, 1]
  }, {
    k: 'kos',
    n: 'Bir aşamada üç kösü de çal',
    r: 40,
    f: () => [$G.P && $G.P.kosB ? 1 : 0, 1]
  }, {
    k: 'ch5',
    n: 'Bir koşuda 5 sandık aç',
    r: 40,
    f: () => [$G.P ? $G.P.chests : 0, 5]
  }, {
    k: 'lv15',
    n: 'Bir koşuda 15. seviyeye ulaş',
    r: 50,
    f: () => [$G.P ? $G.P.lv : 0, 15]
  }, {
    k: 'sh3',
    n: 'Bir koşuda 3 sunak kullan',
    r: 40,
    f: () => [$G.P ? $G.P.shUsed : 0, 3]
  }, {
    k: 'shop',
    n: 'Gezgin tüccardan bir eşya al',
    r: 30,
    f: () => [$G.P ? $G.P.bought : 0, 1]
  }, {
    k: 'kazan',
    n: 'Cadı kazanında bir eşya çoğalt',
    r: 40,
    f: () => [$G.P ? $G.P.duped : 0, 1]
  }, {
    k: 'g300',
    n: 'Cebinde aynı anda 300 altın biriktir',
    r: 40,
    f: () => [$G.P ? $G.P.gold : 0, 300]
  }, {
    k: 'leg',
    n: 'Efsanevi bir yükseltme seç',
    r: 50,
    f: () => [$G.P ? $G.P.legs : 0, 1]
  }, {
    k: 'win',
    n: 'Bir kademeyi tamamla',
    r: 150,
    f: () => [$G.META.st.w + runV('won'), 1]
  }, {
    k: 'k3000',
    n: 'Toplam 3000 düşman öldür',
    r: 120,
    f: () => [$G.META.st.k + runK(), 3000]
  }, {
    k: 'st3',
    n: 'Herhangi bir haritada Kademe 3’ü bitir',
    r: 100,
    f: () => [Object.values($G.META.tier).some(t => t >= 3) ? 1 : 0, 1]
  }, {
    k: 'band',
    n: 'Kara Haydut’u yen',
    r: 60,
    f: () => [$G.P ? $G.P.band || 0 : 0, 1]
  }, {
    k: 'k1000r',
    n: 'Tek koşuda 1000 düşman öldür',
    r: 80,
    f: () => [$G.kills, 1000]
  }, {
    k: 'sw5',
    n: 'Son dalgada 5 dakika dayan',
    r: 90,
    f: () => [$G.P && $G.P.swarm ? Math.floor(swT() / 60) : 0, 5]
  }, {
    k: 'thief',
    n: 'Altın yarasayı kaçmadan yakala',
    r: 40,
    f: () => [$G.P ? $G.P.thf || 0 : 0, 1]
  }, {
    k: 'silv',
    n: 'Gümüş iskeleti yakala',
    r: 40,
    f: () => [$G.P ? $G.P.svk || 0 : 0, 1]
  }, {
    k: 'akin',
    n: 'Bir aşamada iki akını da atlat',
    r: 45,
    f: () => [$G.P ? ($G.P.akN || 0) >= 2 && $G.P.akin <= 0 ? 2 : 0 : 0, 2]
  }, {
    k: 'ghost3',
    n: 'Kızıl Albastıları gör',
    r: 120,
    f: () => [$G.P ? ($G.P.ghW || 0) >= 3 ? 1 : 0 : 0, 1]
  }, {
    k: 'k5000r',
    n: 'Tek koşuda 5000 düşman öldür',
    r: 200,
    f: () => [$G.kills, 5000]
  }, {
    k: 'k10k',
    n: 'Toplam 10000 düşman öldür',
    r: 200,
    f: () => [$G.META.st.k + runK(), 10000]
  }, // ---- silah kilitleri (Megabonk koşulları; henüz var olmayan içerik yerine geçici hedefler)
  { k: 'w_axe', n: 'Kılıç Savuruşu ile 2.000 düşman öldür. Balta açılır', r: 40, ul: 'axe', f: () => [cnt('k_slash'), 2000] },
  { k: 'w_aura', n: 'Üst üste 2 dakika hasar alma. Kor Halkası açılır', r: 40, ul: 'aura', f: () => [$G.P && $G.P.noDmgMax >= 120 ? 1 : 0, 1] },
  { k: 'w_rifle', n: 'Toplam 7.500 düşman öldür. Tüfek açılır', r: 50, ul: 'rifle', f: () => [$G.META.st.k + runK(), 7500] },
  { k: 'w_aegis', n: 'Alp ile zırhla 500 hasar engelle. Kalkan açılır', r: 50, ul: 'aegis', f: () => [Math.floor(cnt('armblk')), 500] },
  { k: 'w_tornado', n: 'Kum fırtınasında 5 ocak doldur. Hortum açılır', r: 50, ul: 'tornado', f: () => [cnt('storm'), 5] },
  { k: 'w_dexe', n: 'Kılıç Savuruşu ile 12.500 düşman öldür. Cellat Palası açılır', r: 60, ul: 'dexe', f: () => [cnt('k_slash'), 12500] },
  { k: 'w_sniper', n: 'Keskinlik Tomu’nu 10. seviyeye çıkar. Uzun Menzilli açılır', r: 50, ul: 'sniper', f: () => [tomLv('crit'), 10] },
  { k: 'w_ice', n: 'Buz Küpü ile düşmanları 1.000 kez dondur. Ayaz silahı açılır', r: 50, ul: 'ice', f: () => [cnt('frz_buzkup'), 1000] },
  { k: 'w_noodle', n: 'Tulpar ile Kızıl Bozkır Kademe 2’yi bitir. Işık Hüzmesi açılır', r: 60, ul: 'noodle', f: () => [cnt('win_bozkir2_tulpar'), 1] },
  { k: 'w_dragon', n: 'Kam ile 1.000 Ruh Alevi öldür. Ejder Nefesi açılır', r: 50, ul: 'dragon', f: () => [cnt('kam_ruhalevi'), 1000] },
  { k: 'w_mines', n: 'Havai Fişek ile 7.500 düşman öldür. Kapan açılır', r: 60, ul: 'mines', f: () => [cnt('k_rocket'), 7500] },
  { k: 'w_flask', n: 'Akrep Ana’yı 3 kez öldür. Zehir Şişesi açılır', r: 40, ul: 'flask', f: () => [cnt('k_kind_akrepana'), 3] },
  { k: 'w_vortex', n: 'İtme Tomu’nu 10. seviyeye çıkar. Girdap açılır', r: 50, ul: 'vortex', f: () => [tomLv('kb'), 10] },
  { k: 'w_katana', n: 'Kızıl Bozkır 1. aşamada bir çalı yumağından düşen Yatağan’ı bul (%5). Yatağan açılır', r: 50, ul: 'katana', f: () => [cnt('drop_katana'), 1] },
  { k: 'w_blood', n: 'Kan Tomu’nu 12. seviyeye çıkar. Kan Büyüsü açılır', r: 50, ul: 'blood', f: () => [tomLv('ls'), 12] },
  { k: 'w_dagger', n: 'Yıldırım’ı 15. seviyeye çıkar. Uçan Hançer açılır', r: 50, ul: 'dagger', f: () => [wLv('zap'), 15] },
  { k: 'w_dice', n: 'Şans Tomu’nu 12. seviyeye çıkar. Aşık Kemiği açılır', r: 50, ul: 'dice', f: () => [tomLv('luck'), 12] },
  { k: 'w_hero', n: 'Eşyasız, güçsüz ve sunaksız bir aşama boss’u devir. Alp Kılıcı açılır', r: 60, ul: 'hero', f: () => [runC('pure'), 1] },
  { k: 'w_corrupt', n: 'Lanet Tomu’nu 10 dakika içinde 20. seviyeye çıkar. Erlik Kılıcı açılır', r: 80, ul: 'corrupt', f: () => [$G.P && tomLv('curse') >= 20 && $G.P.tt < 600 ? 1 : 0, 1] },
  { k: 'w_shotgun', n: 'Kızıl Bozkır 2. aşamada (Kademe 2+) bir çalı yumağından düşen Çakaralmaz’ı bul (%5). Çakaralmaz açılır', r: 60, ul: 'shotgun', f: () => [cnt('drop_shotgun'), 1] },
  // ---- tom kilitleri
  { k: 't_cnt', n: '5.000 mermi at. Çokluk Tomu açılır', r: 40, ul: 't_cnt', f: () => [cnt('shots'), 5000] },
  { k: 't_arm', n: 'Alp ile 5.000 düşman öldür. Zırh Tomu açılır', r: 50, ul: 't_arm', f: () => [cnt('kc0'), 5000] },
  { k: 't_dur', n: 'Balta’yı 10. seviyeye çıkar. Süre Tomu açılır', r: 40, ul: 't_dur', f: () => [wLv('axe'), 10] },
  { k: 't_mag', n: '8 Rüzgâr taşı kullan. Mıknatıs Tomu açılır', r: 40, ul: 't_mag', f: () => [cnt('wind'), 8] },
  { k: 't_luck', n: 'Bir düşmanın düşürdüğü Şans Tomu’nu bul (%0.01). Şans Tomu açılır', r: 40, ul: 't_luck', f: () => [cnt('lucky'), 1] },
  { k: 't_xp', n: 'Bir koşuda 20 pot kır. Bilgelik Tomu açılır', r: 40, ul: 't_xp', f: () => [runC('pots'), 20] },
  { k: 't_ls', n: 'Toplam 12.500 düşman öldür. Kan Tomu açılır', r: 80, ul: 't_ls', f: () => [$G.META.st.k + runK(), 12500] },
  { k: 't_thorns', n: 'Kalkan ile 250 darbe engelle. Diken Tomu açılır', r: 50, ul: 't_thorns', f: () => [cnt('blk'), 250] },
  { k: 't_curse', n: 'Bir aşama boss’unu aşamanın 5. dakikasından önce devir. Lanet Tomu açılır', r: 60, ul: 't_curse', f: () => [cnt('fast'), 1] },
  { k: 't_chaos', n: 'Kademe 3’te üç aşamada da bütün ocakları, alanından hiç çıkmadan doldur. Kaos Tomu açılır', r: 80, ul: 't_chaos', f: () => [$G.P && $G.P.tier >= 3 ? [0, 1, 2].filter(i => runC('chgall' + i)).length : 0, 3] },
  // ---- karakter koşulları: tamamlanınca Otağ'da gümüşle satın alınır (ul: q_<karakter>)
  { k: 'c_golge', n: 'Kızıl Bozkır Kademe 1’i bitir ve Yatağan’ı aç. Gölge satın alınabilir', r: 40, ul: 'q_golge', f: () => [($G.META.tier.bozkir >= 1 ? 1 : 0) + ($G.META.l.katana ? 1 : 0), 2] },
  { k: 'c_bahadir', n: '15.000 Gulyabani öldür ve Balta’yı aç. Bahadır satın alınabilir', r: 40, ul: 'q_bahadir', f: () => [Math.min(cnt('kt0'), 15000) + ($G.META.l.axe ? 1 : 0), 15001] },
  { k: 'c_boru', n: 'Kızıl Bozkır Kademe 2’yi bitir ve Kan Büyüsü’nü aç', r: 50, f: () => [($G.META.tier.bozkir >= 2 ? 1 : 0) + ($G.META.l.blood ? 1 : 0), 2] },
  { k: 'c_ayaz', n: 'Cadı kazanında 3 kez Buz Kristali çoğalt ve Ayaz silahını aç', r: 40, f: () => [Math.min(3, cnt('kz3_buzkristal') ? 3 : $G.P && $G.P.IS && $G.P.IS.kzLast == 'buzkristal' ? $G.P.IS.kzRun : 0) + ($G.META.l.ice ? 1 : 0), 4] },
  { k: 'c_karahan', n: 'Kara Koru Kademe 3’ü bitir ve Erlik Kılıcı’nı aç', r: 60, f: () => [($G.META.tier.koru >= 3 ? 1 : 0) + ($G.META.l.corrupt ? 1 : 0), 2] },
  { k: 'c_tunc', n: 'Kara Koru Kademe 1’i bitir ve Tüfek’i aç', r: 30, f: () => [($G.META.tier.koru >= 1 ? 1 : 0) + ($G.META.l.rifle ? 1 : 0), 2] },
  { k: 'c_kemik', n: '1.000 İskelet okçu öldür. Kemik satın alınabilir', r: 30, ul: 'q_kemik', f: () => [cnt('kt4'), 1000] },
  { k: 'c_pehlivan', n: 'Güç Tomu’nu 7. seviyeye çıkar ve Kor Halkası’nı aç', r: 30, f: () => [Math.min(7, tomLv('dmg')) + ($G.META.l.aura ? 1 : 0), 8] },
  { k: 'c_yaban', n: 'Korudaki kafesi Kafes Anahtarı ile aç', r: 40, f: () => [cnt('cage'), 1] },
  { k: 'c_umay', n: 'Diken Tomu’nu 9. seviyeye çıkar ve Kalkan’ı aç', r: 40, f: () => [Math.min(9, tomLv('thorns')) + ($G.META.l.aegis ? 1 : 0), 10] },
  { k: 'c_asikci', n: '100 görev tamamla ve Aşık Kemiği’ni aç', r: 60, f: () => [Math.min(100, Object.keys($G.META.q).length) + ($G.META.l.dice ? 1 : 0), 101] },
  { k: 'c_gokce', n: 'Girdap’ı aç ve 6 meydan okuma tamamla', r: 40, f: () => [Math.min(6, Object.keys($G.META.chal).length) + ($G.META.l.vortex ? 1 : 0), 7] },
  { k: 'c_sahmeran', n: 'Küflü Peynir ile 50.000 düşman zehirle ve Zehir Şişesi’ni aç', r: 60, f: () => [Math.min(50000, cnt('poisoned')) + ($G.META.l.flask ? 1 : 0), 50001] },
  { k: 'c_anka', n: 'Bozkır hortumuyla havadayken 100 düşman öldür ve Hortum’u aç. Anka satın alınabilir', r: 40, ul: 'q_anka', f: () => [Math.min(100, cnt('tork')) + ($G.META.l.tornado ? 1 : 0), 101] },
  { k: 'm_mezarlik', n: 'Kemik ile Kızıl Bozkır’da dört mezarı huzura erdir ve Kemik’in Babası’nı devir. Mezarlık haritası açılır', r: 80, ul: 'mezarlik', f: () => [cnt('baba'), 1] },
  { k: 'w_scythe2', n: 'Mezarlık’ta Dev Hortlak’ı devir. Tırpan açılır', r: 60, ul: 'scythe', f: () => [cnt('hortlak'), 1] },
  { k: 'w_boom', n: 'Kara Koru’da gizli Parlak Muz’u bul. Kemik Bumerang açılır', r: 40, ul: 'boom', f: () => [cnt('banana'), 1] },
  { k: 'w_nova', n: 'Dönen Kılıçlar ile 3.000 düşman öldür. Şok Dalgası açılır', r: 40, ul: 'nova', f: () => [cnt('k_orbit'), 3000] },
  { k: 'w_poi', n: '5.000 düşman zehirle. Zehir İzi açılır', r: 40, ul: 'poi', f: () => [cnt('poisoned'), 5000] },
  { k: 'w_rocket', n: 'Çalı ile 15.000 düşman öldür. Havai Fişek açılır', r: 60, ul: 'rocket', f: () => [cnt('kc' + CR.findIndex(c => c.k == 'cali')), 15000] },
  { k: 'c_cali', n: 'Korudaki şüpheli çalıyı dürt ve Çalı’yı yen, Uzun Menzilli’yi aç. Çalı satın alınabilir', r: 30, ul: 'q_cali', f: () => [Math.min(1, cnt('cali')) + ($G.META.l.sniper ? 1 : 0), 2] },
  { k: 'c_tulpar', n: 'Uçan Hançer’i aç ve 2 meydan okuma tamamla. Tulpar satın alınabilir', r: 40, ul: 'q_tulpar', f: () => [($G.META.l.dagger ? 1 : 0) + Math.min(2, Object.keys($G.META.chal).length), 3] },
  { k: 'c_okcu', n: 'Kara Koru Kademe 2’yi bitir', r: 30, f: () => [$G.META.tier.koru || 0, 2] },
  { k: 'c_orakci', n: 'Tırpan’ı aç ve Mezarlık’ta Kara Kefen’i infazla öldür', r: 60, f: () => [($G.META.l.scythe ? 1 : 0) + Math.min(1, cnt('k_kind_kefen')), 2] },
  // ---- şapkalar (ul: hat_<k>)
  { k: 'h_kurbaga1', n: 'Kara Koru 1. aşamadaki gizli kurbağayı yakala. Yeşil Kurbağa şapkası', r: 10, ul: 'hat_kurbaga1', f: () => [cnt('frog0'), 1] },
  { k: 'h_kurbaga2', n: 'Kara Koru 2. aşamadaki gizli kurbağayı yakala. Mavi Kurbağa şapkası', r: 10, ul: 'hat_kurbaga2', f: () => [cnt('frog1'), 1] },
  { k: 'h_kurbaga3', n: 'Kara Koru 3. aşamadaki gizli kurbağayı yakala. Kızıl Kurbağa şapkası', r: 10, ul: 'hat_kurbaga3', f: () => [cnt('frog2'), 1] },
  { k: 'h_tuccar', n: 'Sıradan tüccardan 100 eşya al. Kara Tüccar Şapkası', r: 10, ul: 'hat_tuccar', f: () => [cnt('buyT0'), 100] },
  { k: 'h_tuccar2', n: 'Seçkin tüccardan 80 eşya al. Mavi Tüccar Şapkası', r: 10, ul: 'hat_tuccar2', f: () => [cnt('buyT2'), 80] },
  { k: 'h_tuccar3', n: 'Destansı tüccardan 60 eşya al. Mor Tüccar Şapkası', r: 10, ul: 'hat_tuccar3', f: () => [cnt('buyT3'), 60] },
  { k: 'h_tuccar4', n: 'Efsanevi tüccardan 50 eşya al. Sarı Tüccar Şapkası', r: 10, ul: 'hat_tuccar4', f: () => [cnt('buyT4'), 50] },
  { k: 'h_kazanh', n: '50 kazanı son kullanımına kadar tüket. Kazan Şapkası', r: 10, ul: 'hat_kazanh', f: () => [cnt('kzboom'), 50] },
  { k: 'h_takke', n: 'Keloğlan ile 100.000 kez yumruk ye. Keloğlan Takkesi', r: 10, ul: 'hat_takke', f: () => [cnt('kevin'), 100000] },
  { k: 'h_tac', n: 'Her karakterde rütbe 100’e ulaş. Taç', r: 50, ul: 'hat_tac', f: () => [heroIdx().filter(i => rankOf(i) >= 100).length, heroIdx().length] },
  { k: 'h_kulah', n: 'Kam Külahı eşyasıyla bir koşu bitir. Kam Külahı şapkası', r: 10, ul: 'hat_kulah', f: () => [cnt('hat_kulah'), 1] },
  { k: 'h_soytari', n: 'Kam ile Şaman Maskesi takarken 500 düşman öldür. Soytarı Şapkası', r: 10, ul: 'hat_soytari', f: () => [cnt('maskk'), 500] },
  { k: 'h_peynir', n: '8 Küflü Peynir ve 1 Yılan taşırken bir Kademe 3 final boss’u devir. Peynir Şapkası', r: 20, ul: 'hat_peynir', f: () => [cnt('cheesy'), 1] },
  { k: 'h_fes', n: 'Kara Koru’da tek koşuda 300.000 düşman öldür. Uzun Fes', r: 40, ul: 'hat_fes', f: () => [$G.P && $G.P.map == 'koru' ? runK() : 0, 300000] },
  { k: 'h_silindir', n: 'Kara Koru’da tek koşuda 100.000 düşman öldür. Silindir Şapka', r: 30, ul: 'hat_silindir', f: () => [$G.P && $G.P.map == 'koru' ? runK() : 0, 100000] },
  { k: 'h_comlek', n: 'Kemik ile bir koşuda 4 Kazan taşı. Çömlek', r: 10, ul: 'hat_comlek', f: () => [$G.P && CR_K() == 'kemik' ? $G.P.I.kazan || 0 : 0, 4] },
  { k: 'h_baret', n: 'Bahadır ile bir koşuda 20 sandık aç. Baret', r: 20, ul: 'hat_baret', f: () => [$G.P && CR_K() == 'bahadir' ? $G.P.chests : 0, 20] },
  { k: 'h_tolga', n: 'Alp ile Kılıç, Alp Kılıcı, Erlik Kılıcı ve Tırpan taşırken Kara Koru Kademe 3 final boss’unu devir. Demir Tolga', r: 30, ul: 'hat_tolga', f: () => [cnt('ironhelm'), 1] },
  { k: 'h_gunes', n: 'Kemik ile Mezarlık final boss’unu 60 saniyede devir. Güneş Gözlüğü', r: 20, ul: 'hat_gunes', f: () => [cnt('sunglasses'), 1] },
  { k: 'h_serif', n: 'Çalı ile bir boss ya da ara bossu 1 saniyede devir. Şerif Şapkası', r: 20, ul: 'hat_serif', f: () => [cnt('sheriff'), 1] },
  { k: 'h_pilot', n: 'Anka ile havadayken Kapan ile 1.000 düşman öldür. Pilot Miğferi', r: 20, ul: 'hat_pilot', f: () => [cnt('pilot'), 1000] },
  { k: 'h_noel', n: 'Kara Koru’daki gizli hediyeyi aç. Noel Başlığı', r: 10, ul: 'hat_noel', f: () => [cnt('present'), 1] },
  { k: 'h_kavuk', n: 'Tulpar ile Kızıl Bozkır Kademe 3 final boss’unu devir. Kavuk', r: 30, ul: 'hat_kavuk', f: () => [cnt('win_bozkir3_tulpar'), 1] },
  { k: 'h_migfer', n: 'Bahadır ile tek koşuda 10.000 düşman öldür. Boynuzlu Miğfer', r: 20, ul: 'hat_migfer', f: () => [$G.P && CR_K() == 'bahadir' ? runK() : 0, 10000] },
  { k: 'h_sarik', n: 'Kam ile Ateş Topu, Yıldırım ve Kan Büyüsü’nü 40. seviyeye çıkar. Sarık', r: 30, ul: 'hat_sarik', f: () => [$G.P && CR_K() == 'kam' ? ['fire', 'zap', 'blood'].filter(k => wLv(k) >= 40).length : 0, 3] },
  { k: 'h_bork', n: 'Alp ile can çalmayla toplam 10.000 can iyileş. Börk', r: 20, ul: 'hat_bork', f: () => [Math.floor(cnt('lsheal_alp')), 10000] },
  { k: 'h_kalpak', n: 'Gölge ile Kızıl Bozkır 1. aşamayı en az 2 Kara sunak açıkken bitir. Kalpak', r: 20, ul: 'hat_kalpak', f: () => [cnt('headset'), 1] },
  { k: 'h_tulbent', n: 'Gölge ile 500 düşman dondur. Tülbent', r: 20, ul: 'hat_tulbent', f: () => [cnt('frz_golge'), 500] },
  // ---- eşya kilitleri (ul: eşya anahtarı)
  { k: 'i_serbet', n: 'Toplam 100 kritik vur. Yasak Şerbet açılır', r: 20, ul: 'serbet', f: () => [cnt('crit'), 100] },
  { k: 'i_erlikbicak', n: 'Can çalmayla 350 can iyileş. Erlik Bıçağı açılır', r: 20, ul: 'erlikbicak', f: () => [Math.floor(cnt('lsheal')), 350] },
  { k: 'i_tonik', n: 'Uzun Menzilli ile 3.000 düşman öldür. Nine Toniği açılır', r: 30, ul: 'tonik', f: () => [cnt('k_sniper'), 3000] },
  { k: 'i_gulle', n: 'Havai Fişek ile 5.000 düşman öldür. Top Güllesi açılır', r: 30, ul: 'gulle', f: () => [cnt('k_rocket'), 5000] },
  { k: 'i_yildirimkure', n: 'Yıldırım ile 3.000 düşman öldür. Yıldırım Küresi açılır', r: 30, ul: 'yildirimkure', f: () => [cnt('k_zap'), 3000] },
  { k: 'i_satir', n: 'Bahadır ile 50. seviyeye ulaş. Kanlı Satır açılır', r: 60, ul: 'satir', f: () => [$G.P && CR_K() == 'bahadir' ? $G.P.lv : 0, 50] },
  { k: 'i_kartalpence', n: 'Anka ile 10.000 düşman öldür. Kartal Pençesi açılır', r: 30, ul: 'kartalpence', f: () => [cnt('kc' + CR.findIndex(c => c.k == 'anka')), 10000] },
  { k: 'i_cellathancer', n: 'Cellat Palası ile 10.000 düşman öldür. Cellat Hançeri açılır', r: 50, ul: 'cellathancer', f: () => [cnt('k_dexe'), 10000] },
  // Kaval varsayılan açık: büyüleyen tek kaynak Kaval'ın kendisi olduğu için kilit görevi hiç tamamlanamıyordu
  { k: 'i_kaval', n: 'Kaval ile 20 düşmanı büyüle', r: 20, f: () => [cnt('charm'), 20] },
  { k: 'i_bebek', n: '10 kez öl. Lanetli Bebek açılır', r: 30, ul: 'bebek', f: () => [cnt('deaths'), 10] },
  { k: 'i_zehireldiven', n: 'Cadı kazanında 3 kez üst üste Küflü Peynir çoğalt. Zehir Eldiveni açılır', r: 30, ul: 'zehireldiven', f: () => [Math.min(3, cnt('kz3_peynir') ? 3 : $G.P && $G.P.IS && $G.P.IS.kzLast == 'peynir' ? $G.P.IS.kzRun : 0), 3] },
  { k: 'i_lanetlieldiven', n: 'Bir koşuda Lanet Tomu’nu 10. seviyeye çıkar. Lanetli Eldiven açılır', r: 30, ul: 'lanetlieldiven', f: () => [Math.max(tomLv('curse'), cnt('curse10') ? 10 : 0), 10] },
  { k: 't_bounce', n: 'Mermiler 1.000 kez seksin. Sekme Tomu açılır', r: 40, ul: 't_bounce', f: () => [cnt('bounces'), 1000] },
  // meydan okuma görevleri (Megabonk Challenges kategorisi): her meydan okuma bir kez tamamlansın
  ...CHAL.map(c => ({ k: 'ch_' + c.k, n: `“${c.n}” meydan okumasını tamamla`, r: 25, f: () => [Object.keys($G.META.chal).some(x => x.split(':')[0] == c.k) ? 1 : 0, 1] })),
  // kostüm görevleri (Megabonk Skins kategorisi): etkin kadrodaki her karakterle bir Kademe 3 final boss'u devir
  ...heroIdx().map(i => ({ k: 's_' + CR[i].k, n: `${CR[i].n} ile bir Kademe 3 final boss’u devir. Alev kostümü satın alınabilir`, r: 20, f: () => [cnt('k3c' + i), 1] })),
  // genel ekler
  { k: 'g_k100k', n: 'Toplam 100.000 düşman öldür', r: 100, f: () => [$G.META.st.k + runK(), 100000] },
  { k: 'g_k250k', n: 'Toplam 250.000 düşman öldür', r: 150, f: () => [$G.META.st.k + runK(), 250000] },
  { k: 'g_pots1k', n: '1.000 pot kır', r: 30, f: () => [cnt('pots'), 1000] },
  { k: 'g_buy50', n: 'Gezgin tüccardan 50 eşya al', r: 40, f: () => [cnt('buy'), 50] },
  { k: 'g_chest200', n: '200 sandık satın al', r: 40, f: () => [cnt('chestbuy'), 200] },
  { k: 'g_exec100', n: '100 düşman infaz et', r: 30, f: () => [cnt('exec'), 100] },
  { k: 'g_fall', n: '10 kez düşme hasarı al', r: 10, f: () => [cnt('fall'), 10] },
  { k: 'g_balance', n: 'Denge taşını 5 kez kullan', r: 20, f: () => [cnt('balance'), 5] },
  { k: 'g_present', n: 'Bir hediye aç', r: 15, f: () => [cnt('present'), 1] },
  { k: 'g_echo', n: '500 düşmanı yankıla', r: 25, f: () => [cnt('echo'), 500] },
  { k: 'g_deaths50', n: '50 kez öl', r: 30, f: () => [cnt('deaths'), 50] },
  { k: 'i_kemikbacak', n: 'Bir koşuda zorluğu +%40’a çıkar. Kemik Bacak açılır', r: 20, ul: 'kemikbacak', f: () => [Math.min(40, Math.max(cnt('diff40') ? 40 : 0, $G.P && !$G.P.banked ? diffPct() : 0)), 40] },
  { k: 'i_korcekirdek', n: 'Final boss’u 2 kez devir. Kor Çekirdek açılır', r: 30, ul: 'korcekirdek', f: () => [$G.META.st.w, 2] },
  { k: 'i_hortlak', n: 'Son Dalga’da 2 dakika dayan. Hortlak açılır', r: 20, ul: 'hortlak', f: () => [Math.max(cnt('sw120') ? 120 : 0, $G.P && $G.P.swarm ? Math.floor(swT()) : 0), 120] },
  { k: 'i_albasti', n: 'Son Dalga’da 60 saniye dayan. Albastı Sürüsü açılır', r: 50, ul: 'albasti', f: () => [Math.max(cnt('sw60') ? 60 : 0, $G.P && $G.P.swarm ? Math.floor(swT()) : 0), 60] },
  { k: 'i_bicici', n: 'Son Dalga’da 6 dakika dayan. Ruh Biçici açılır', r: 50, ul: 'bicici', f: () => [Math.max(cnt('sw360') ? 360 : 0, $G.P && $G.P.swarm ? Math.floor(swT()) : 0), 360] },
  { k: 'i_ors', n: '3 meydan okuma tamamla. Örs açılır', r: 60, ul: 'ors', f: () => [Object.keys($G.META.chal).length, 3] },
  { k: 'i_kazan', n: 'Mezarlık’ın ilk Mahzen’indeki bütün sandık ve potları aç. Kazan açılır', r: 40, ul: 'kazan', f: () => [cnt('mzclean'), 1] },
  { k: 'i_kulah', n: 'Kam ile Kazan kullanarak bir silahı 40. seviyenin üstüne çıkar. Kam Külahı açılır', r: 50, ul: 'kulah', f: () => [cnt('over40_kam'), 1] },
  { k: 'i_kitap', n: 'Bir aşamanın boss’unu hiç hasar almadan devir. Kutsal Kitap açılır', r: 60, ul: 'kitap', f: () => [cnt('bossclean'), 1] },
  { k: 'i_maske', n: 'Alp ile bir aşama boss’unu Kalkan darbesiyle bitir. Şaman Maskesi açılır', r: 30, ul: 'maske', f: () => [cnt('aegisboss_alp'), 1] },
  { k: 'i_gazmaske', n: 'Kemik ile 5.000 düşman öldür. Gaz Maskesi açılır', r: 40, ul: 'gazmaske', f: () => [cnt('kc' + CR.findIndex(c => c.k == 'kemik')), 5000] },
  { k: 'i_bukuk', n: 'Bir aşamada Kara sunağı iki kez kullan. Zaman Büküğü açılır', r: 50, ul: 'bukuk', f: () => [cnt('bc2'), 1] },
  { k: 'i_keloglan', n: 'Aynı koşuda 3 Sülük Taşı taşı. Keloğlan açılır', r: 40, ul: 'keloglan', f: () => [$G.P ? $G.P.I.suluk || 0 : 0, 3] },
  { k: 'i_paten', n: 'Bir koşuda Hız Tomu ve Çeviklik Tomu’nu birlikte 5. seviyeye çıkar. Paten açılır', r: 20, ul: 'paten', f: () => [Math.min(5, tomLv('aspd')) + Math.min(5, tomLv('spd')), 10] },
  { k: 'i_carik', n: '150 pot kır. Altın Çarık açılır', r: 20, ul: 'carik', f: () => [cnt('pots'), 150] },
  { k: 'i_yanki', n: 'Bilgelik Tomu’nu 8. seviyeye çıkar. Yankı Kıymığı açılır', r: 20, ul: 'yanki', f: () => [tomLv('xp'), 8] },
  { k: 'i_bilgelik', n: 'Mıknatıs Tomu’nu 8. seviyeye çıkar. Kırık Bilgelik açılır', r: 20, ul: 'bilgelik', f: () => [tomLv('mag'), 8] },
  { k: 'i_hortumtas', n: 'Bir aşamadaki bütün ocakları doldur. Hortum Taşı açılır', r: 50, ul: 'hortumtas', f: () => [cnt('allcharge'), 1] },
  // Megabonk'ta koşul Big Bob'u arenadaki lamba patlamasıyla bitirmek; bizde arena lambası yok ve eski koşul (boss'u Hortlak
  // Feneri eşyasıyla öldürmek) eşyanın kendisini gerektirdiği için hiç sağlanamıyordu. Dev Hortlak'ı devirmek yeter.
  { k: 'i_hortlakfener', n: 'Mezarlık’ta Dev Hortlak’ı devir. Hortlak Feneri açılır', r: 40, ul: 'hortlakfener', f: () => [Math.max(cnt('hortlak'), cnt('lampboss')), 1] },
  { k: 'i_kartalgoz', n: 'Bir ara boss’u gelişinden 25 saniye içinde devir. Kartal Gözü açılır', r: 30, ul: 'kartalgoz', f: () => [cnt('minifast'), 1] },
  { k: 'i_kiris', n: 'Hız Tomu’nu 5. seviyeye çıkar. Yay Kirişi açılır', r: 20, ul: 'kiris', f: () => [tomLv('aspd'), 5] },
  { k: 'i_erlikruh', n: 'Kemik ile 30. seviyeye ulaş. Erlik Ruhu açılır', r: 40, ul: 'erlikruh', f: () => [$G.P && CR_K() == 'kemik' ? $G.P.lv : 0, 30] },
  { k: 'i_erlikkan', n: 'Kan Büyüsü ile azami canını 400 kez artır. Erlik Kanı açılır', r: 30, ul: 'erlikkan', f: () => [cnt('bloodhp'), 400] },
  { k: 'i_cizme', n: 'Çeviklik Tomu’nu 5. seviyeye çıkar. Deri Çizme açılır', r: 5, ul: 'cizme', f: () => [tomLv('spd'), 5] },
  { k: 'i_pence', n: 'Toplam 2.000 kritik vur. Kızıl Pençe açılır', r: 30, ul: 'pence', f: () => [cnt('crit'), 2000] },
  { k: 'i_pul', n: 'Gölge ile 10.000 düşman öldür. Şahmeran Pulu açılır', r: 50, ul: 'pul', f: () => [cnt('kc' + CR.findIndex(c => c.k == 'golge')), 10000] },
  { k: 'i_nazar', n: '500 darbeden kaçın. Nazar Boncuğu açılır', r: 20, ul: 'nazar', f: () => [cnt('evade'), 500] },
  { k: 'i_kalkan', n: 'Kalkan Tomu’nu 8. seviyeye çıkar. Tunç Kalkan açılır', r: 30, ul: 'kalkan', f: () => [tomLv('shield'), 8] },
  { k: 'i_simurg', n: 'Anka ile bir kademe zaferi kazan. Simurg Tüyü açılır', r: 50, ul: 'simurg', f: () => [cnt('wc' + CR.findIndex(c => c.k == 'anka')), 1] },
  { k: 'i_kalp', n: 'Bir koşuda 60. seviyeye ulaş. Ejder Kalbi açılır', r: 50, ul: 'kalp', f: () => [Math.max(cnt('lv60') ? 60 : 0, $G.P && !$G.P.banked ? $G.P.lv : 0), 60] },
  { k: 'i_post', n: 'Tulpar ile 15.000 düşman öldür. Kurt Postu açılır', r: 40, ul: 'post', f: () => [cnt('kc' + CR.findIndex(c => c.k == 'tulpar')), 15000] },
  { k: 'i_devavci', n: 'Bir aşama boss’unu 30 saniyede devir. Dev Avcısı açılır', r: 20, ul: 'devavci', f: () => [cnt('boss30'), 1] },
  { k: 'i_anahtar', n: '25 ücretli sandık al. Demir Anahtar açılır', r: 20, ul: 'anahtar', f: () => [cnt('chestbuy'), 25] },
  { k: 'i_buzkristal', n: 'Ayaz silahıyla 50 düşman öldür. Buz Kristali açılır', r: 20, ul: 'buzkristal', f: () => [cnt('k_ice'), 50] },
  { k: 'i_kaktus', n: 'Diken hasarıyla 100 Kaktüs öldür. Kaktüs açılır', r: 20, ul: 'kaktus', f: () => [cnt('thorn_kaktus'), 100] },
  { k: 'i_yumruk', n: 'Kılıç Savuruşu ile 5.000 düşman öldür. Demir Yumruk açılır', r: 20, ul: 'yumruk', f: () => [cnt('k_slash'), 5000] },
  { k: 'i_sabir', n: 'Yerinden kımıldamadan 500 düşman öldür. Sabır Şerbeti açılır', r: 20, ul: 'sabir', f: () => [cnt('stillk'), 500] },
  { k: 'i_suluk', n: 'Yenilenme Tomu’nu 8. seviyeye çıkar. Sülük Taşı açılır', r: 20, ul: 'suluk', f: () => [tomLv('regen'), 8] },
  { k: 'i_fici', n: 'Zehir hasarıyla 2.000 düşman öldür. Zehir Fıçısı açılır', r: 20, ul: 'fici', f: () => [cnt('k_el_poison'), 2000] },
  { k: 'i_gozluk', n: 'Bir aşama boss’unu canın %10’un altındayken devir. Nazar Gözlüğü açılır', r: 30, ul: 'gozluk', f: () => [cnt('bosslow'), 1] },
  { k: 'i_ejderates', n: 'Ateş hasarıyla 4.000 düşman öldür. Ejder Ateşi açılır', r: 20, ul: 'ejderates', f: () => [cnt('k_el_fire'), 4000] },
  { k: 'i_eskimaske', n: 'Mezarlık’ta Eski Maske’yi bul. Eski Maske açılır', r: 20, ul: 'eskimaske', f: () => [cnt('oldmask'), 1] },
  { k: 'i_yilan', n: 'Mezarlık Mahzen’indeki gizli odada Yılan’ı bul. Yılan açılır', r: 30, ul: 'yilan', f: () => [cnt('snek'), 1] },
  { k: 'i_balkabagi', n: 'Anka ile Mezarlık’taki bütün kabakları kır. Balkabağı açılır', r: 20, ul: 'balkabagi', f: () => [cnt('allpumpkin'), 1] },
  { k: 'g_ws2', n: '45 görev tamamla. İkinci silah slotu satın alınabilir', r: 30, f: () => [Object.keys($G.META.q).length, 45] },
  { k: 'g_ts2', n: '55 görev tamamla. İkinci tom slotu satın alınabilir', r: 30, f: () => [Object.keys($G.META.q).length, 55] },
  { k: 'g_wallhug', n: 'Duvara yaslanarak 10 kez düşme hasarından kurtul', r: 20, f: () => [cnt('wallhug'), 10] },
  { k: 'g_ch5', n: '5 meydan okuma tamamla', r: 30, f: () => [Object.keys($G.META.chal).length, 5] },
  { k: 'g_ch10', n: '10 meydan okuma tamamla', r: 40, f: () => [Object.keys($G.META.chal).length, 10] },
  { k: 'g_ch20', n: '20 meydan okuma tamamla', r: 60, f: () => [Object.keys($G.META.chal).length, 20] },
  { k: 'g_ch30', n: '30 meydan okuma tamamla', r: 100, f: () => [Object.keys($G.META.chal).length, 30] },
  { k: 'i_gogusluk', n: 'Azami canını 500’e çıkar. Demir Göğüslük açılır', r: 30, ul: 'gogusluk', f: () => [Math.max(cnt('mh500') ? 500 : 0, $G.P ? $G.P.mh : 0), 500] }];
  // Başarımlar (Megabonk'un Steam listesine karşılık ayrık tablo): k anahtar, n ad, f → [ilerleme, hedef]
  {
    const tot = () => $G.META.st.k + runK(), A = [],
      add = (k, n, f) => A.push({ k, n, f });
    for (const [n, lbl] of [[100, 'İlk Yüz'], [1000, 'Bin'], [5000, 'Beş Bin'], [10000, 'On Bin'], [25000, 'Yirmi Beş Bin'], [50000, 'Elli Bin'], [100000, 'Yüz Bin'], [250000, 'Çeyrek Milyon'], [500000, 'Yarım Milyon'], [1000000, 'Milyon']]) add('a_k' + n, `${lbl}: toplam ${n.toLocaleString('tr')} düşman öldür`, () => [tot(), n]);
    for (const n of [1, 5, 10, 25, 50, 100]) add('a_b' + n, `${n} boss devir`, () => [$G.META.st.b + ($G.P && !$G.P.banked ? $G.P.bosses : 0), n]);
    for (const n of [1, 10, 50, 100, 250]) add('a_r' + n, `${n} koşu tamamla`, () => [$G.META.st.r, n]);
    for (const n of [1, 5, 10, 25, 50]) add('a_w' + n, `${n} kademe zaferi`, () => [$G.META.st.w, n]);
    for (const m of MAPS) for (let t = 1; t <= m.tiers; t++) add(`a_m_${m.k}${t}`, `${m.n} Kademe ${t}’yi bitir`, () => [($G.META.tier[m.k] || 0) >= t ? 1 : 0, 1]);
    // karakter başına başarımlar yalnız etkin kadro üzerinden (kaldırılanlar CR'de off: 1 ile durur)
    const HI = heroIdx();
    for (const i of HI) add('a_c_' + CR[i].k, `${CR[i].n} ile bir kademe zaferi`, () => [cnt('wc' + i), 1]);
    add('a_allc', 'Bütün kahramanları aç', () => [HI.filter(i => unl(CR[i].lock)).length, HI.length]);
    add('a_rank50', 'Bir kahramanı 50. rütbeye çıkar', () => [Math.max(0, ...HI.map(i => rankOf(i))), 50]);
    add('a_rank100', 'Bir kahramanı 100. rütbeye çıkar', () => [Math.max(0, ...HI.map(i => rankOf(i))), 100]);
    add('a_rank3', 'Üç kahramanı 50. rütbeye çıkar', () => [HI.filter(i => rankOf(i) >= 50).length, 3]);
    add('a_w40', 'Bir silahı 40. seviyeye çıkar', () => [cnt('w40'), 1]);
    add('a_t99', 'Bir tomu 99. seviyeye çıkar', () => [cnt('t99'), 1]);
    add('a_allw', 'Bütün silahları aç', () => [Object.keys(WD).filter(k => unl(WD[k].lock)).length, Object.keys(WD).length]);
    add('a_allt', 'Bütün tomları aç', () => [Object.keys(TDF).filter(k => unl(TDF[k].lock)).length, Object.keys(TDF).length]);
    add('a_alli', 'Bütün eşyaları aç', () => [Object.keys(ITD).filter(k => !ITD[k].q && unl(ITD[k].lock)).length, Object.keys(ITD).filter(k => !ITD[k].q).length]);
    add('a_i20', 'Bir koşuda 20 farklı eşya taşı', () => [Math.max(cnt('i20') ? 20 : 0, $G.P && !$G.P.banked ? Object.keys($G.P.I).length : 0), 20]);
    add('a_lv50', 'Bir koşuda 50. seviyeye ulaş', () => [Math.max(cnt('lv50') ? 50 : 0, $G.P && !$G.P.banked ? $G.P.lv : 0), 50]);
    add('a_diff100', 'Bir koşuda zorluğu +%100’e çıkar', () => [cnt('diff100') ? 100 : Math.min(99, $G.P && !$G.P.banked ? diffPct() : 0), 100]);
    for (const n of [25, 50, 100, 150, 200]) add('a_q' + n, `${n} görev tamamla`, () => [Object.keys($G.META.q).length, n]);
    for (const n of [1, 5, 10, 20, 30]) add('a_ch' + n, `${n} meydan okuma tamamla`, () => [Object.keys($G.META.chal).length, n]);
    add('a_chall', 'Her meydan okumayı en az bir kez tamamla', () => [new Set(Object.keys($G.META.chal).map(x => x.split(':')[0])).size, CHAL.length]);
    for (const n of [1, 5, 21]) add('a_h' + n, `${n} şapka edin`, () => [Object.keys($G.META.hat).filter(k => k != 'cur' && $G.META.hat[k] === 1).length, n]);
    for (const n of [1, 10]) add('a_s' + n, `${n} kostüm satın al`, () => [Object.keys($G.META.skin).filter(k => k.includes(':')).length, n]);
    for (const n of [100, 1000]) add('a_sh' + n, `${n} sunak kullan`, () => [cnt('charge') + cnt('shrineAll') + cnt('wind') + cnt('cage') + cnt('balance'), n]);
    for (const n of [1000, 10000]) add('a_p' + n, `${n} pot kır`, () => [cnt('pots'), n]);
    for (const n of [100, 1000]) add('a_cb' + n, `${n} sandık satın al`, () => [cnt('chestbuy'), n]);
    for (const n of [100, 1000]) add('a_e' + n, `${n} elit öldür`, () => [cnt('k_el'), n]);
    for (const n of [1000, 10000]) add('a_g' + n, `${n} hayalet öldür`, () => [cnt('k_ghost'), n]);
    add('a_ot10', 'Uzatmada 10 dakika hayatta kal', () => [cnt('ot600'), 1]);
    for (const n of [1, 10]) add('a_x' + n, `Çıkış Geçidi’nden ${n} kez çık`, () => [cnt('exit'), n]);
    for (const n of [10, 50, 100]) add('a_d' + n, `${n} kez öl`, () => [cnt('deaths'), n]);
    add('a_fall', 'Düşerek öl', () => [cnt('falldeath'), 1]);
    add('a_exec', '1.000 düşman infaz et', () => [cnt('exec'), 1000]);
    add('a_crit', '10.000 kritik vur', () => [cnt('crit'), 10000]);
    add('a_evade', '1.000 darbeden kaçın', () => [cnt('evade'), 1000]);
    add('a_buy', 'Gezgin tüccardan 100 eşya al', () => [cnt('buy'), 100]);
    add('a_kz', 'Cadı kazanını 50 kez kullan', () => [cnt('kz_dupe') + cnt('dupe'), 50]);
    add('a_pu', '500 güç topla', () => [cnt('pu'), 500]);
    add('a_mz', 'Mahzeni 10 kez aç', () => [cnt('mzopen'), 10]);
    add('a_present', 'Bir hediye aç', () => [cnt('present'), 1]);
    add('a_bal', 'Denge taşını 25 kez kullan', () => [cnt('balance'), 25]);
    add('a_fast', 'İlk boss’u 5 dakikadan önce devir', () => [cnt('fast'), 1]);
    add('a_pure', 'Hiç hasar almadan bir boss devir', () => [cnt('pure'), 1]);
    add('a_silver', 'Toplam 10.000 gümüş kazan', () => [cnt('silverT'), 10000]);
    add('a_gold', 'Bir koşuda 10.000 altın biriktir', () => [Math.max(cnt('gold10k') ? 10000 : 0, $G.P && !$G.P.banked ? $G.P.goldT || 0 : 0), 10000]);
    add('a_mu', 'Bütün kalıcı güçleri en üst kademeye çıkar', () => [MU.filter(u => mu(u.k) >= u.m).length, MU.length]);
    // Kara Koru'ya özgü eşik başarımları Megabonk kalıbında birer görev: gümüş ödülü hedefe göre
    for (const a of A) QD.push({ k: a.k, n: a.n, r: a.k.startsWith('a_c_') || a.k.startsWith('a_m_') ? 30 : /k1000000|k500000/.test(a.k) ? 200 : /k250000|k100000|r250|q200|ch30|allc|allw|alli|allt|a_mu|rank100/.test(a.k) ? 100 : /k50000|k25000|r100|w50|q150|q100|ch20|rank50|rank3/.test(a.k) ? 50 : 20, f: a.f });
    ACHD = [];
    // Megabonk Steam başarımlarının aynası: her kilit görevi (silah, tom, karakter, eşya, şapka, harita) bir başarım;
    // artı dükkân kapıları ve meydan okuma sayıları. Kendi başarım tablomuz ACHD ayrı listelenir.
    const qk = k => QD.find(q => q.k == k);
    ACHM = QD.filter(q => /^(w_|t_|c_|i_|h_|m_|g_|a_|k500|boss$|win$)/.test(q.k)).map(q => ({ k: 'm_' + q.k, n: q.n, f: q.f }));
    for (const [k, n, qn] of [['rr', 'Yenile', 20], ['ws', 'Silah slotu', 25], ['sk', 'Atla', 30], ['ts', 'Tom slotu', 35], ['bn', 'Çıkar', 40]]) ACHM.push({ k: 'm_shop_' + k, n: `${qn} görev tamamla: ${n} satın alınabilir`, f: () => [Object.keys($G.META.q).length, qn] });
    ACHM.push({ k: 'm_shop_tg', n: '40 kilit aç: Toggler satın alınabilir', f: () => [Object.keys($G.META.l).filter(k => !k.startsWith('q_') && !k.startsWith('hat_')).length, 40] });
    ACHM.push({ k: 'm_shop_bb', n: 'Kara Koru’da üç kösü de çal: Davul satın alınabilir', f: () => [$G.META.l.boombox ? 1 : 0, 1] });
    void qk;
  }
  const CR_K = () => $G.CRK ? $G.CRK() : '';
  // rütbe (heroes.js ile aynı formül; döngüsel import olmadan)
  const rankFromXp = xp => { let r = 1; while (r < 100 && xp >= Math.round(20 * Math.pow(r, 1.5))) { xp -= Math.round(20 * Math.pow(r, 1.5)); r++; } return r; };
  $G.META = metaDefault();
  try {
    const m = JSON.parse(localStorage.getItem('kk_meta') || 'null');
    if (m && typeof m == 'object') $G.META = migrateMeta(m);
  } catch (e) {}
}

// Kalıcı kayıt şeması. Yeni alan eklerken buraya varsayılanını koy ve META_V'yi artır;
// migrateMeta eski kayıtları bozmadan tamamlar.
export const META_V = 6;

export function metaDefault() {
  return {
    v: META_V,
    s: 0, // gümüş
    u: {}, // kalıcı yükseltmeler: anahtar → kademe
    l: {}, // kilitler: anahtar → 1
    q: {}, // tamamlanan görevler
    st: { k: 0, r: 0, w: 0, b: 0, c: {} }, // toplam öldürme, koşu, zafer, boss; c: adlı sayaçlar
    rank: {}, // kahraman → biriken tecrübe (rütbe)
    skin: {}, // kahraman → seçili kostüm; 'kahraman:kostüm' → 1 sahiplik
    hat: {}, // şapka anahtarı → 1; cur: takılı şapka
    ach: {}, // başarım anahtarı → zaman damgası
    chal: {}, // meydan okuma anahtarı → 1
    opt: {}, // havuzdan kapatılan içerik (toggler): anahtar → 1
    tier: {}, // harita → tamamlanan en yüksek kademe
    achv: {} // başarım tablosu (ACHD): anahtar → zaman damgası
  };
}

export function migrateMeta(m) {
  const d = metaDefault(),
    out = { ...d, ...m };
  for (const k of ['u', 'l', 'q', 'st', 'rank', 'skin', 'hat', 'ach', 'chal', 'opt', 'tier', 'achv']) out[k] = { ...d[k], ...(m[k] && typeof m[k] == 'object' ? m[k] : {}) };
  // v1 → v2: alanlar yukarıda tamamlandı, sayısal alanlar doğrulanır
  if (typeof out.s != 'number' || !isFinite(out.s)) out.s = 0;
  if (!out.st.c || typeof out.st.c != 'object') out.st.c = {};
  // v6: Gölge eskiden kilitsizdi; sürüm 6'dan önceki, koşu yapmış kayıtlarda açık kalır. Bu denetim eskiden her
  // açılışta yapılıyordu ve ilk koşusunu bitiren her yeni oyuncuya da Gölge'yi bedelsiz açıyordu.
  if ((+m.v || 0) < 6 && out.l.golge == null && out.st.r > 0 && !out.l.q_golge) out.l.golge = 1;
  out.v = META_V;
  return out;
}

// Adlı sayaçlar: koşu içinde P.c, koşu sonunda META.st.c'ye işlenir. cnt toplamı verir.
export function inc(k, n = 1) {
  if ($G.P && $G.P.c) $G.P.c[k] = ($G.P.c[k] || 0) + n;
}

export function cnt(k) {
  return ($G.META.st.c[k] || 0) + ($G.P && !$G.P.banked && $G.P.c ? $G.P.c[k] || 0 : 0);
}

export function saveMeta() {
  try {
    localStorage.setItem('kk_meta', JSON.stringify($G.META));
  } catch (e) {}
}

export function __init_38() {
  mu = k => $G.META.u[k] || 0;
  unl = k => !k || !!$G.META.l[k];
  fmtC = (k, v) => {
    const f = CS[k] ? CS[k][1] : 'n';
    return f == 'x' || f == 'p' ? '%' + Math.round(v * 100) : f == 'i' ? '+' + Math.round(v) : f == 'r' ? v.toFixed(1) + '/sn' : f == 's' ? v.toFixed(1) + ' sn' : '' + Math.round(v);
  };
  fmtS = (k, v) => k == 'dmg' ? v < 10 ? v.toFixed(1) : '' + Math.round(v) : k == 'cnt' || k == 'prc' || k == 'bnc' ? '' + Math.round(v) : k == 'cd' ? v.toFixed(2) + ' sn' : k == 'dur' ? v.toFixed(1) + ' sn' : k == 'critd' ? '+%' + Math.round(v * 100) : '%' + Math.round(v * 100);
  stl = (w, k) => WD[w].sn && WD[w].sn[k] || SN[k];
  fmtU = u => u.st ? (CS[u.st][1] == 'n' ? '+' + u.v + ' ' + CS[u.st][0].toLocaleLowerCase('tr') : CS[u.st][1] == 'r' ? '+' + u.v + '/sn can yenilenmesi' : '+%' + Math.round(u.v * 100) + ' ' + CS[u.st][0].toLocaleLowerCase('tr')) + ', her seviyede' : u.d;
}
