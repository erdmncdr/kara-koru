// data/ayar-sema.js · Kara Koru
// Uzaktan ayarlanabilen denge sabitlerinin şeması. Oyun (core/ayar.js) ve yönetim paneli (yonetim/) birlikte kullanır;
// bu yüzden oyun modüllerini içe aktarmaz, yalnız veri.
//   id    : sunucudaki `denge` ayarının anahtarı (supabase/liveops.sql kk_ayar)
//   vars  : oyunun koddaki değeri. Sunucuda satır yoksa ya da ulaşılamazsa bu geçerlidir. Koddaki sabitle AYNI olmalı
//           (core/ayar.js test derlemesinde karşılaştırır, tests/smoke.mjs denetler).
//   min, max: oyun gelen değeri bu aralığa sıkıştırır (yanlış girilen bir sayı oyunu kilitlemesin).
// Yeni ayar: buraya satır, core/ayar.js HEDEF'e yazıcı, Unity'de KoruAyar.cs'e aynı kimlik.
export const GRUPLAR = [
  { k: 'seviye', ad: 'Seviye ve tecrübe', acik: 'Oyuncunun ne kadar hızlı seviye atladığı.' },
  { k: 'zorluk', ad: 'Düşman gücü', acik: 'Sıradan düşmanların canı ve vuruşu; kademe farkları.' },
  { k: 'boss', ad: 'Bosslar', acik: 'Aşama bosslarının canı ve geç çağrıldığında ne kadar güçlendikleri.' },
  { k: 'kazanc', ad: 'Kazanç', acik: 'Kalıcı kazanç çarpanları. Süreli artışlar için Etkinlikler sayfasını kullan.' },
  { k: 'sinir', ad: 'Üst sınırlar', acik: 'Bir koşuda silah ve tomların çıkabileceği en yüksek seviye.' }
];

export const SEMA = [
  { id: 'sv_kir', grup: 'seviye', ad: 'Dikleşme başlangıcı', birim: 'seviye', min: 20, max: 300, adim: 1, vars: 60, acik: 'Bu seviyeden sonra her seviyenin tecrübe gereği katlanarak artar. Öncesi değişmez.' },
  { id: 'sv_kat', grup: 'seviye', ad: 'Seviye başına artış', birim: '×', min: 1, max: 1.15, adim: 0.005, vars: 1.03, acik: 'Başlangıçtan sonra her seviye bir öncekinin bu katı kadar tecrübe ister. 1 = dikleşme yok.' },
  { id: 'sv_odul', grup: 'seviye', ad: 'Tam seviye ödülü sınırı', birim: 'seviye', min: 10, max: 300, adim: 1, vars: 60, acik: 'Mavi İskelet ve gümüş iskelet en çok bu seviyenin gereği kadar tecrübe verir.' },

  { id: 'dusman_can', grup: 'zorluk', ad: 'Düşman canı', birim: '×', min: 0.5, max: 3, adim: 0.05, vars: 1, acik: 'Sıradan düşmanların canı (bosslar hariç).' },
  { id: 'dusman_hasar', grup: 'zorluk', ad: 'Düşman hasarı', birim: '×', min: 0.5, max: 3, adim: 0.05, vars: 1, acik: 'Sıradan düşmanların vuruşu (boss darbeleri hariç).' },
  { id: 'tierm_1', grup: 'zorluk', ad: 'Kademe 1 çarpanı', birim: '×', min: 0.5, max: 6, adim: 0.05, vars: 1, acik: 'Kademe çarpanı düşman canını doğrudan, hasarını karekökle çarpar.' },
  { id: 'tierm_2', grup: 'zorluk', ad: 'Kademe 2 çarpanı', birim: '×', min: 0.5, max: 6, adim: 0.05, vars: 1.6, acik: '' },
  { id: 'tierm_3', grup: 'zorluk', ad: 'Kademe 3 çarpanı', birim: '×', min: 0.5, max: 6, adim: 0.05, vars: 2.15, acik: '' },

  { id: 'boss_st_1', grup: 'boss', ad: '1. aşama boss canı', birim: '×', min: 0.25, max: 30, adim: 0.25, vars: 1, acik: 'Boss profil canının çarpanı (Tepegöz).' },
  { id: 'boss_st_2', grup: 'boss', ad: '2. aşama boss canı', birim: '×', min: 0.25, max: 30, adim: 0.25, vars: 5, acik: 'Erlik.' },
  { id: 'boss_st_3', grup: 'boss', ad: '3. aşama boss canı', birim: '×', min: 0.25, max: 30, adim: 0.25, vars: 6, acik: 'Dev Hortlak.' },
  { id: 'boss_t_adim', grup: 'boss', ad: 'Güçlenme adımı', birim: 'sn', min: 30, max: 600, adim: 10, vars: 150, acik: 'Aşamanın başından beri geçen her bu kadar saniye boss canına +1 kat ekler. Küçültmek geç çağrılan boss’u güçlendirir.' },
  { id: 'boss_t_ust', grup: 'boss', ad: 'Güçlenme tavanı', birim: '×', min: 1, max: 30, adim: 0.5, vars: 6, acik: 'Süreyle gelen kat en çok bu kadar olur.' },

  { id: 'xp_k', grup: 'kazanc', ad: 'Tecrübe', birim: '×', min: 0.25, max: 5, adim: 0.05, vars: 1, acik: 'Toplanan bütün tecrübe.' },
  { id: 'altin_k', grup: 'kazanc', ad: 'Altın', birim: '×', min: 0.25, max: 5, adim: 0.05, vars: 1, acik: 'Koşu içinde toplanan altın.' },
  { id: 'gumus_k', grup: 'kazanc', ad: 'Gümüş', birim: '×', min: 0.25, max: 5, adim: 0.05, vars: 1, acik: 'Koşu sonunda kazanılan gümüş (kalıcı para).' },

  { id: 'wmax', grup: 'sinir', ad: 'Silah seviye sınırı', birim: 'seviye', min: 10, max: 99, adim: 1, vars: 40, acik: 'Eşyalar (Kazan) bunun üstüne ekler.' },
  { id: 'tmax', grup: 'sinir', ad: 'Tom seviye sınırı', birim: 'seviye', min: 10, max: 200, adim: 1, vars: 99, acik: 'Eşyalar (Külah) bunun üstüne ekler.' }
];

// gelen değer şemaya uydurulur: sayı değilse varsayılan, aralık dışıysa sınıra çekilir
export function semaDeger(s, v) {
  if (typeof v != 'number' || !isFinite(v)) return s.vars;
  return Math.max(s.min, Math.min(s.max, v));
}

// etkinlik çarpanları: anahtar → ad. Oyun 0.25-5 arasına sıkıştırır.
export const CARPANLAR = [
  { k: 'xp', ad: 'Tecrübe' },
  { k: 'altin', ad: 'Altın' },
  { k: 'gumus', ad: 'Gümüş' }
];
