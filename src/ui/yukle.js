// ui/yukle.js · Kara Koru
// Açılış yüklemesi. Simgeler (166 resim), Alp'in modelleri ve yazı tipleri eskiden ekranda ilk göründükleri anda isteniyordu:
// kartlar, menü ve kahraman ilk açılışta boş gelip sonradan doluyordu. Artık hepsi oyun açılmadan indirilir; ilerleme
// index.html içindeki #yuk ekranında gösterilir (ekran JS inmeden önce de görünür, o sırada çubuk belirsiz akar).
// Akış (main.js): yukBasla() indirmeyi hemen başlatır, giriş ekranı açıksa indirme onun arkasında sürer;
// yukBekle() bitince modüller kurulur, yukBitir() ekranı kaldırır.
// Takılan ağ oyunu kilitlemez: 12 sn hiçbir dosya inmezse ya da toplam 40 sn geçerse beklenmeden devam edilir;
// kalan dosyalar arkada inmeye devam eder (eskisi gibi göründükçe dolar).
import { ART_URLS } from './icons.js';
import { glbOnYukle } from '../engine/glbhero.js';

const el = document.getElementById('yuk'),
  cub = document.getElementById('yukc'),
  yaz = document.getElementById('yukt');
const TUT = []; // çözülmüş resimler bellekte kalsın: ilk gösterimde yeniden çözülmesin
const SESSIZ = 12000, UST = 40000;

let inen = 0, toplam = 0, kalan = 0, son = 0, bitis = null, coz = null;

function ciz() {
  if (!el) return;
  const o = toplam ? Math.min(1, inen / toplam) : 0;
  el.classList.remove('bel');
  if (cub) cub.style.transform = `scaleX(${o.toFixed(3)})`;
  if (yaz) yaz.textContent = 'Yükleniyor… %' + Math.round(o * 100);
}
// bir iş: bitince (başarılı ya da değil) ağırlığı kadar ilerletir
function is(p, agirlik) {
  toplam += agirlik;
  kalan++;
  const tamam = () => {
    inen += agirlik;
    kalan--;
    son = performance.now();
    ciz();
    if (!kalan && coz) coz();
  };
  p.then(tamam, tamam);
}
const sure = (p, ms) => Promise.race([p, new Promise(r => setTimeout(r, ms))]);

// resim: indirilir ve çözülür; hata olursa bir kez daha denenir. Çözme (decode) arka sekmede bekleyebilir:
// dosya indikten 300 ms sonra çözme bitmese de iş tamam sayılır
function resim(u, yine = 1) {
  return new Promise((res, rej) => {
    const im = new Image();
    im.decoding = 'async';
    im.onload = () => {
      TUT.push(im);
      setTimeout(res, 300);
      im.decode().then(res, res);
    };
    im.onerror = () => (yine ? setTimeout(() => resim(u, yine - 1).then(res, rej), 500) : rej(new Error('resim: ' + u)));
    im.src = u;
  });
}
// yazı tipleri: Türkçe harfler ayrı alt kümede (latin-ext), o da istenir. Google'a ulaşılamazsa 5 sn'de bırakılır
function yazilar() {
  const F = document.fonts;
  if (!F || !F.load) return Promise.resolve();
  const TR = 'Kara Koru şğıİöüç 0123';
  return sure(
    Promise.all([
      F.load('400 20px "Alfa Slab One"', TR),
      ...[400, 500, 600, 700].map(w => F.load(w + ' 16px "Signika"', TR)),
      F.load('16px "Noto Sans Old Turkic"', '𐱅𐰭𐰼𐰃'),
    ]),
    5000
  );
}

export function yukBasla() {
  if (bitis) return;
  son = performance.now();
  bitis = new Promise(r => (coz = r));
  is(yazilar(), 8);
  for (const u of ART_URLS) is(resim(u), 1);
  // modeller dosya boyutuna yakın ağırlıkta: çubuk sonda uzun süre takılmasın
  glbOnYukle().forEach((p, i) => is(p, i ? 45 : 60));
  ciz();
  if (!kalan) coz();
}

// hepsi inince (ya da ağ takılınca) çözülür. Dönen değer: true hepsi indi, false beklenmeden geçildi
export function yukBekle() {
  if (!bitis) yukBasla();
  // toplam süre bu çağrıdan sayılır: giriş ekranında geçen zaman sayılmaz (o sırada indirme zaten sürüyordu)
  const b0 = performance.now();
  return new Promise(res => {
    let t = 0;
    const son2 = v => {
      clearInterval(t);
      res(v);
    };
    bitis.then(() => son2(true));
    t = setInterval(() => {
      const s = performance.now();
      if (s - son > SESSIZ || s - b0 > UST) son2(false);
    }, 500);
  });
}

// aşama yazısı; ekrana çizilmesi için bir iki kare beklenir (arka sekmede kare gelmez: kısa süre sonra yine devam)
export function yukAsama(t) {
  if (yaz) yaz.textContent = t;
  if (cub) cub.style.transform = 'scaleX(1)';
  return sure(new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))), 150);
}

export function yukBitir() {
  if (!el || el.classList.contains('git')) return;
  el.classList.add('git');
  setTimeout(() => el.remove(), 450);
}
