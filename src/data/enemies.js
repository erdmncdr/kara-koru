// data/enemies.js · Kara Koru
// Düşman türleri (KINDS), harita listeleri (ROSTER), ara bosslar (MINIS) ve boss profilleri (BOSSP).
//
// Her tür bir taban sınıfa (t: 0 yürüyen, 1 uçan, 2 dev, 3 boss, 4 okçu, 5 hücumcu) bağlıdır; model,
// animasyon ve itme o sınıftan gelir. tint: [renk, oran] köşe renklerini boyar; ghost: hayalet malzemesi
// (1 beyaz, 2 mor, 3 kızıl). fx: ek davranış bayrakları:
//   poi/burn/frz temasta oyuncuya zehir/yanma/yavaşlama · static yerinden oynamaz · roll düz hatta
//   yuvarlanır · gold ölünce bol altın · pylon boss'u iyileştiren direk · kefen ölümsüz avcı

export const KINDS = {
  // ---- Kara Koru
  gulyabani: { n: 'Gulyabani', t: 0, hp: 7, sp: 5, d: 15, xp: 2, au: 1 },
  yarasa: { n: 'Yarasa', t: 1, hp: 8, sp: 12, d: 12, xp: 2, au: 1 },
  tasdev: { n: 'Taş dev', t: 2, hp: 20, sp: 5, d: 20, xp: 5, au: 3 },
  okcu: { n: 'İskelet okçu', t: 4, hp: 14, sp: 5, d: 20, xp: 3, au: 2 },
  karakoncolos: { n: 'Karakoncolos', t: 5 },
  bocek: { n: 'Böcek', t: 0, sc: .75, hp: 6, sp: 6.5, d: 8, xp: 2, au: 1, tint: [0x3a5a2a, .6] },
  ari: { n: 'Arı', t: 1, sc: .7, hp: 10, sp: 6.5, d: 15, xp: 2, au: 1, tint: [0xe0c030, .7] },
  hortlak: { n: 'Hortlak', t: 0, sc: 1.15, hp: 9, sp: 9, d: 12, xp: 3, au: 2, tint: [0x6a8a6a, .6] },
  gucluguly: { n: 'Güçlü Gulyabani', t: 0, sc: 1.15, hp: 15, sp: 5.5, d: 25, xp: 3, au: 2, tint: [0x7a4a2a, .6] },
  gulyabanitank: { n: 'Gulyabani Tankı', t: 2, sc: .85, hp: 40, sp: 5, d: 30, xp: 6, au: 4, tint: [0x5a3a2a, .6] },
  patlayan: { n: 'Patlayan', t: 0, sc: 1.05, hp: 18, sp: 6, d: 30, xp: 4, au: 2, tint: [0xd84a2a, .7], fx: { boom: 1 } },
  zirhliiskelet: { n: 'Zırhlı İskelet', t: 0, sc: 1.1, hp: 30, sp: 4, d: 25, xp: 5, au: 3, tint: [0x7a7a8a, .8], fx: { arm: .5 } },
  // gizli kurbağalar (Megabonk Frog): Kara Koru'da aşama başına bir tane, öldürünce şapka
  kurbaga: { n: 'Kurbağa', t: 0, sc: .55, hp: 1000, sp: 9.5, d: 1, xp: 30, au: 10, tint: [0x3aa03a, .9], fx: { frog: 1, flee: 1 } },
  maviiskelet: { n: 'Mavi İskelet', t: 4, hp: 50, sp: 6, d: 25, xp: 3, au: 3, tint: [0x4a8ae0, .8], fx: { xpdrop: 1, flee: 1 } },
  // ---- Kızıl Bozkır
  akrep: { n: 'Akrep', t: 5, sc: .75, hp: 16, sp: 7, d: 20, xp: 3, au: 2, tint: [0x6a3a1a, .5], fx: { poi: 1 } },
  kaktus: { n: 'Kaktüs', t: 4, sc: 1, hp: 15, sp: 5, d: 30, xp: 4, au: 3, tint: [0x3a8a3a, .7] }, // Megabonk Cactus Shooter: uzaktan atar, yavaş yürür
  kemikyumagi: { n: 'Kemik Yumağı', t: 2, sc: .6, hp: 7, sp: 11, d: 9, xp: 4, au: 2, tint: [0xe8e0d0, .7], fx: { roll: 1 } },
  mumya: { n: 'Mumya', t: 0, hp: 8, sp: 5, d: 13, xp: 2, au: 2, tint: [0xc8b890, .6] },
  kadimmumya: { n: 'Kadim Mumya', t: 2, sc: 1.1, hp: 70, sp: 3.5, d: 30, xp: 8, au: 5, tint: [0xb8a070, .6] },
  altiniskelet: { n: 'Altın İskelet', t: 4, hp: 50, sp: 6, d: 25, xp: 3, au: 12, tint: [0xe0b040, .8], fx: { gold: 1, flee: 1 } },
  ruhalevi: { n: 'Ruh Alevi', t: 1, sc: .8, hp: 8, sp: 7.5, d: 13, xp: 2, au: 1, tint: [0xff7a2a, .8], fx: { burn: 1 } },
  mumyatank: { n: 'Mumya Tankı', t: 2, sc: .85, hp: 45, sp: 5, d: 30, xp: 7, au: 4, tint: [0xa89870, .6] },
  buyukakrep: { n: 'Büyük Akrep', t: 5, sc: 1.05, hp: 30, sp: 6.5, d: 30, xp: 6, au: 3, tint: [0x4a2a10, .6], fx: { poi: 1 } },
  tozluiskelet: { n: 'Tozlu İskelet', t: 0, hp: 16, sp: 6.5, d: 22, xp: 3, au: 2, tint: [0xc8b89a, .8] },
  zirhlitozlu: { n: 'Zırhlı Tozlu İskelet', t: 0, sc: 1.1, hp: 25, sp: 4.5, d: 16, xp: 4, au: 3, tint: [0x8a7a6a, .8], fx: { arm: .5 } },
  // ---- Mezarlık
  hayalet: { n: 'Hayalet', t: 1, hp: 10, sp: 6, d: 10, xp: 2, au: 1, ghost: 1 },
  morhayalet: { n: 'Mor Hayalet', t: 1, sc: 1.1, hp: 40, sp: 8, d: 20, xp: 6, au: 3, ghost: 2 },
  kizilhayalet: { n: 'Kızıl Hayalet', t: 1, sc: 1.2, hp: 100, sp: 10, d: 30, xp: 10, au: 4, ghost: 3 },
  karahayalet: { n: 'Kara Hayalet', t: 1, sc: 1.2, hp: 20, sp: 7, d: 13, xp: 5, au: 2, tint: [0x101018, .9] },
  iskelet: { n: 'İskelet', t: 0, hp: 20, sp: 5.5, d: 20, xp: 3, au: 2, tint: [0xe8e0d0, .8] },
  kafa: { n: 'Uçan Kafa', t: 1, sc: .75, hp: 12, sp: 7, d: 8, xp: 3, au: 2, tint: [0xe0d8c8, .8] },
  zombi: { n: 'Zombi', t: 0, sc: 1.1, hp: 12, sp: 6.5, d: 20, xp: 3, au: 2, tint: [0x5a7a5a, .6] },
  // ---- ara bosslar ve olay düşmanları
  karakoncolos_dev: { n: 'Dev Karakoncolos', t: 5 , bhp: 250, bd: 40 },
  kayadevi: { n: 'Kaya Devi', t: 2 , bhp: 250, bd: 40 },
  okcubasi: { n: 'Kemik Okçu Başı', t: 4 , bhp: 250, bd: 40 },
  kumdevi: { n: 'Kum Devi', t: 2, tint: [0xc8a060, .7], fx: { zones: 1 } , bhp: 250, bd: 40 },
  akrepana: { n: 'Akrep Ana', t: 5, tint: [0x5a2a10, .6], fx: { poi: 1 } , bhp: 250, bd: 35 },
  hayaletbeyi: { n: 'Hayalet Beyi', t: 1, sc: 1.2, ghost: 2 , bhp: 320, bd: 45 },
  tabut1: { n: 'Cemil', t: 4, tint: [0x8a8a9a, .6] , bhp: 1100, bd: 20 },
  tabut2: { n: 'Mahmut', t: 5, tint: [0x8a8a9a, .6] , bhp: 2250, bd: 25 },
  tabut3: { n: 'Tahir', t: 2, tint: [0x8a8a9a, .6] , bhp: 5500, bd: 30 },
  tabut4: { n: 'Garip', t: 0, tint: [0x8a8a9a, .6] , bhp: 9000, bd: 35 },
  iskeletkrali: { n: 'İskelet Kralı', t: 4, sc: 1.35, sp: 8, tint: [0xe8e0d0, .8], bhp: 320, bd: 40 },
  baba: { n: 'Kemik’in Babası', t: 4, sc: 1.3, tint: [0xf0f0e0, .8] , bhp: 320, bd: 40 },
  cali: { n: 'Çalı', t: 2, tint: [0x2a7a2a, .8] , bhp: 10000, bd: 45 },
  direk: { n: 'Direk', t: 2, sc: .9, hp: 1, sp: 0, d: 0, xp: 0, au: 0, tint: [0x6ad6f0, .9], fx: { static: 1, pylon: 1 }, hide: 1 }, // boss direği: yanında durup doldur, boss o zaman hasar alır
  kefen: { n: 'Kara Kefen', t: 3, sc: 1.2, tint: [0x0a0a10, .95], fx: { kefen: 1 } },
  // boss görünümleri
  tepegoz: { n: 'Tepegöz', t: 3 },
  erlik: { n: 'Erlik', t: 3, tint: [0x6a3aa0, .6] },
  hortlakboss: { n: 'Dev Hortlak', t: 3, tint: [0xd8d8e8, .5] }
};

for (const k in KINDS) KINDS[k].k = k;

// Harita listeleri: at = aşama saati (sn) eşiği, w = ağırlık
export const ROSTER = {
  koru: [
    { k: 'gulyabani', at: 0, w: 40 }, { k: 'bocek', at: 10, w: 14 }, { k: 'yarasa', at: 20, w: 20 }, { k: 'ari', at: 30, w: 10 },
    { k: 'okcu', at: 45, w: 14 }, { k: 'tasdev', at: 70, w: 8 }, { k: 'hortlak', at: 90, w: 10 }, { k: 'karakoncolos', at: 180, w: 5 },
    { k: 'iskelet', at: 60, w: 10 }, { k: 'gucluguly', at: 120, w: 10 }, { k: 'patlayan', at: 150, w: 6 }, { k: 'gulyabanitank', at: 240, w: 5 }, { k: 'zirhliiskelet', at: 300, w: 5 }, { k: 'maviiskelet', at: 200, w: 1 }
  ],
  bozkir: [
    { k: 'mumya', at: 0, w: 36 }, { k: 'akrep', at: 15, w: 18 }, { k: 'kaktus', at: 25, w: 16 }, { k: 'ruhalevi', at: 35, w: 14 },
    { k: 'kemikyumagi', at: 60, w: 8 }, { k: 'kadimmumya', at: 90, w: 7 }, { k: 'altiniskelet', at: 120, w: 3 },
    { k: 'tozluiskelet', at: 100, w: 12 }, { k: 'buyukakrep', at: 150, w: 6 }, { k: 'mumyatank', at: 200, w: 5 }, { k: 'zirhlitozlu', at: 260, w: 5 }, { k: 'maviiskelet', at: 200, w: 1 }
  ],
  mezarlik: [
    { k: 'iskelet', at: 0, w: 34 }, { k: 'hayalet', at: 10, w: 22 }, { k: 'karahayalet', at: 60, w: 10 }, { k: 'morhayalet', at: 120, w: 10 },
    { k: 'kizilhayalet', at: 300, w: 8 },
    { k: 'zombi', at: 20, w: 14 }, { k: 'hortlak', at: 30, w: 10 }, { k: 'kafa', at: 40, w: 10 }, { k: 'zirhliiskelet', at: 150, w: 6 }, { k: 'maviiskelet', at: 200, w: 1 }
  ]
};

export const MINIS = {
  koru: ['karakoncolos_dev', 'kayadevi', 'okcubasi'],
  bozkir: ['kumdevi', 'akrepana'],
  // Megabonk Graveyard: Calcium's Dad ve Ghostham the Dead 13:00 / 9:00 / 3:00 kala dönüşümlü gelir, ilk gelen üçüncüde tekrarlar
  // (megabonk.wiki Graveyard). Hangisinin önce geldiği kaynaklarda yok; wiki'nin sıralamasına göre Kemik'in Babası.
  // İskelet Kralı ayrıca heykelden çağrılır.
  mezarlik: ['baba', 'hayaletbeyi']
};

// Boss profilleri: n ad, k görünüm türü, p saldırı listesi
//   charge hücum · laser dönen ışın · pylons iyileştiren direkler · disable ikincil silahlar kapanır
//   summon akrep çağırır · sand bataklık kum · ice donduran mermi · ghosts güdümlü hayalet · lava alev gölleri
export const BOSSP = {
  koru: [
    { n: 'Tepegöz', k: 'tepegoz', p: [], hp: 9000, d: 40 },
    { n: 'Ulu Tepegöz', k: 'tepegoz', p: ['charge'], hp: 8000, d: 40 },
    { n: 'Kadim Tepegöz', k: 'tepegoz', p: ['disable', 'pylons'], hp: 10000, d: 22, sp: .6 }
  ],
  bozkir: [
    { n: 'Küçük Erlik', k: 'erlik', p: ['laser'], hp: 8000, d: 40 },
    { n: 'Erlik', k: 'erlik', p: ['laser', 'summon', 'sand'], hp: 8000, d: 40 },
    { n: 'Yargıç Erlik', k: 'erlik', p: ['disable', 'pylons', 'ice'], hp: 8000, d: 40, sp: .6 }
  ],
  mezarlik: [
    { n: 'Dev Hortlak', k: 'hortlakboss', p: ['ghosts', 'lava'], hp: 130000, d: 40 } // süre çarpanıyla (tabutlar dahil) 5. dk ~510 bin, 8. dk ~590 bin, en çok 780 bin; eski sabit değer 500 bin
  ]
};
