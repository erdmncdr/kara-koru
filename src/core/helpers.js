// core/helpers.js · Kara Koru
// Bu dosya tek dosyalık sürümden (v22) otomatik ayrıldı. Ortak oyun durumu core/store.js içindeki $G nesnesinde.

import { $G } from './store.js';
import { SET } from './settings.js';
import { freeE } from '../game/creatures.js';
import { OV } from './state.js';
import { sayfala } from '../ui/sayfa.js';
import { $ } from './util.js';
import { TOUCH } from '../data/content.js';
import { R, sc } from '../engine/renderer.js';
import { iskinRelease } from '../engine/iskin.js';

export function __init_49() {
  // ---- yardımcılar
  $G.tto = undefined;
}

// Bağlamsal ipucu: her anahtar bir kez gösterilir (kk_tips), ayardan kapatılabilir
export function tip(k, title, text) {
  if (SET.tips === 0) return;
  if (!$G.TIPS) {
    try { $G.TIPS = JSON.parse(localStorage.getItem('kk_tips') || '{}'); } catch (e) { $G.TIPS = {}; }
  }
  if ($G.TIPS[k]) return;
  $G.TIPS[k] = 1;
  try { localStorage.setItem('kk_tips', JSON.stringify($G.TIPS)); } catch (e) {}
  let d = $('tip');
  if (!d) {
    d = document.createElement('div');
    d.id = 'tip';
    document.body.appendChild(d);
  }
  // dokunmatikte klavye tuşu yok: metindeki "E ile" Kullan düğmesine çevrilir, ipucu dokununca kapanır
  if (TOUCH) {
    text = text.replace(/E ile/g, 'Kullan düğmesiyle');
    d.style.pointerEvents = 'auto';
    d.onclick = () => d.classList.remove('on');
  }
  d.innerHTML = `<b>${title}</b><span>${text}</span><i>${TOUCH ? 'Dokununca kapanır' : 'Esc kapatır'} · Ayarlar’dan kapatılabilir</i>`;
  d.classList.add('on');
  clearTimeout($G.tipo);
  $G.tipo = setTimeout(() => d.classList.remove('on'), 9000);
}

export function toast(t) {
  $('tt').textContent = t;
  clearTimeout($G.tto);
  $G.tto = setTimeout(() => $('tt').textContent = '', 2800);
}

export function ov(h, c) {
  OV.className = c || 'mid';
  OV.innerHTML = h;
  OV.scrollTop = 0;
  sayfala(); // kaydırma yok: uzun listeler sayfalanır, panel ekrana sığdırılır (ui/sayfa.js)
  clearTimeout($G.tto);
  $('tt').textContent = '';
  if (document.pointerLockElement) {
    $G.PLX = 1;
    document.exitPointerLock();
  }
}

export function __init_50() {
  $G.NOLK = 0;
  let nolkT = 0, told = 0;
  // Tarayıcı Esc'den hemen sonra ya da kullanıcı hareketi olmadan gelen istekleri
  // reddedebilir. Bu kalıcı bir yasak değil: kısa süre sürükleme moduna geç, sonra yeniden dene.
  document.addEventListener('pointerlockerror', () => {
    $G.NOLK = 1;
    document.body.classList.add('nolk');
    clearTimeout(nolkT);
    nolkT = setTimeout(() => {
      $G.NOLK = 0;
      document.body.classList.remove('nolk');
    }, 2500);
    if (!told) {
      told = 1;
      setTimeout(() => {
        if ($G.S == 'play') toast('Fare kilidi şimdilik verilmedi. Kamerayı çevirmek için fareyi basılı tutup sürükle ya da tekrar tıkla.');
      }, 400);
    }
  });
}

export function lockP() {
  if (TOUCH || $G.NOLK) return;
  try {
    const p = R.domElement.requestPointerLock();
    p && p.catch && p.catch(() => {});
  } catch (e) {}
}

// Nesne başına üretilmiş (paylaşılmayan) geometriler geometry.userData.own ile işaretlenir
// ve nesne sahneden çıkınca GPU tamponları burada bırakılır.
export function ownG(g) {
  g.userData.own = 1;
  return g;
}

export function freeG(o) {
  if (!o || !o.traverse) return;
  o.traverse(c => {
    if (c.isInstancedMesh) c.dispose();
    const g = c.geometry;
    if (g && g.userData && g.userData.own && g.dispose) g.dispose();
  });
}

export function kill(o) {
  sc.remove(o);
  freeG(o);
  o.material && o.material.dispose && o.material.dispose();
}

export function skFree(u) {
  try {
    if (u && u.inst) iskinRelease(u);
    if (u && u.m && u.m.skeleton) u.m.skeleton.dispose();
  } catch (e) {}
}

export function rmE(m, u) {
  sc.remove(m);
  freeE(u);
}

export function clr(a) {
  a.forEach(o => {
    sc.remove(o.m);
    freeG(o.m);
    freeE(o.u);
  });
  a.length = 0;
}
// ---- efekt sistemi: kameraya bakan yumuşak parçacıklar, kıvılcım izleri, sekip duran kırıntılar, ışık sütunları
