// data/denge.js · Kara Koru
// Uzaktan ayarlanabilen, başka modülün sabiti olmayan denge değerleri (core/ayar.js yazar, oyun okur).
// Varsayılanlar data/ayar-sema.js ile aynı olmalı. Hiçbir şeyi içe aktarmaz (döngüsel bağımlılık olmasın).
export const DNG = {
  can: 1, // sıradan düşman canı çarpanı
  hasar: 1, // sıradan düşman hasarı çarpanı
  bossAdim: 150, // boss canı: aşama başından beri her bu kadar saniye +1 kat
  bossUst: 6, // en çok bu kat
  xp: 1, // kalıcı kazanç çarpanları
  altin: 1,
  gumus: 1,
  wmax: 40, // silah ve tom seviye sınırı
  tmax: 99
};
// süreli etkinliklerin çarpanları (core/ayar.js olayCarpan günceller): kalıcı çarpanla çarpılmış son değer
export const KZN = { xp: 1, altin: 1, gumus: 1 };
