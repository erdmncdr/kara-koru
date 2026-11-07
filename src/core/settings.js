// core/settings.js · Kara Koru
// Bu dosya tek dosyalık sürümden (v22) otomatik ayrıldı. Ortak oyun durumu core/store.js içindeki $G nesnesinde.

import { $G } from './store.js';

export let SET;

export function __init_7() {
  // ---- ayarlar
  SET = {
    sens: 1,
    inv: 0,
    sfx: .8,
    mus: .5,
    q: 2,
    aim: 1,
    fov: 70,
    cd: 14,
    sm: .3,
    sh: 1,
    dn: 1,
    mr: 1,
    bl: 1,
    fps: 60, // 0 sınırsız, 30, 60 (varsayılan 60: 120 Hz ekranlarda iki kat kare çizip ısıtmasın)
    shd: 1, // gölgeler
    pd: 1, // parçacık yoğunluğu
    po: 1, // parçacık ve mermi saydamlığı
    fl: 1, // hasar flaşı
    vg: 1, // düşük can vinyeti
    mms: 1, // mini harita boyutu
    hpc: 0, // can rengi: 0 kızıl, 1 yeşil, 2 mavi
    nk: 1, // sayı tuşuyla seçim
    rtw: 0, // rastgele hedef ağırlığı
    qr: 1, // hızlı yeniden başlat (R basılı tut)
    lbu: 1, // sıralamaya yükle
    lbv: 1, // sıralamayı göster
    con: 1, // komut konsolu (ters tırnak ya da F10)
    tips: 1, // bağlamsal ipuçları
    al: 0, // otomatik seviye: seviye ekranında ilk tom kartı kendiliğinden seçilir
    mb: 0, // hareket bulanıklığı (yalnızca yüksek kalitede)
    mo: 1, // büyük harita saydamlığı (0.3-1)
    mk: 'auto' // makam: auto, hicaz, huseyni, nihavend, rast, segah
  };
  const dok = typeof matchMedia == 'function' && matchMedia('(pointer:coarse)').matches;
  let kayit = null;
  try {
    kayit = JSON.parse(localStorage.getItem('kk_set') || 'null');
  } catch (e) {}
  if (kayit && typeof kayit == 'object') Object.assign(SET, kayit);
  // telefon ve tablet: ilk açılışta orta kalite (ışıma yok, çözünürlük en çok 1.5x)
  if (!kayit && dok) SET.q = 1;
  // ayar sürümü 2 (7 Kasım 2026): ısınma şikâyeti. Kayıtlı "sınırsız" FPS 60'a, dokunmatikte yüksek kalite ortaya iner; bir kez.
  if (!(SET.sv >= 2)) {
    if (kayit) {
      if (!SET.fps) SET.fps = 60;
      if (dok && SET.q == 2) SET.q = 1;
    }
    SET.sv = 2;
    if (kayit) saveSet();
  }
}

export function saveSet() {
  try {
    localStorage.setItem('kk_set', JSON.stringify(SET));
  } catch (e) {}
}
// ---- renk yönetimi: tasarım renkleri sRGB, hesaplama doğrusal
