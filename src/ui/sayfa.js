// ui/sayfa.js · Kara Koru
// Oyunda kaydırma çubuğu yok: ekrana sığmayan liste sayfalara bölünür, panel ekrana sığmıyorsa küçültülür.
//
// Sayfalama: `<div data-sy="anahtar">…</div>` içindeki öğeler, kabın o anki yüksekliğine sığan sayfalara dağıtılır; geçiş
// `‹ 2 / 7 ›` denetimiyle (kabın ardına eklenir ya da `<span data-syn="anahtar">` neredeyse oraya), fare tekerleğiyle,
// PageUp / PageDown ve Q / E ile, dokunmatikte yana kaydırmayla. Sayfa numarası anahtarla hatırlanır (ekran yeniden çizilince korunur).
// Öğeler satır satır ölçülür (ızgarada aynı hizadakiler bir satır); sayfaya sığmayan tek öğe (uzun liste, ızgara) kendi
// satırlarına bölünür. Başlık (h3, açıklama) sayfanın son satırı olmaz; ipucu (.hint) önündeki denetimden ayrılmaz.
//
// Sığdırma: katmanın (#ov) içindeki panel ekrandan uzunsa `zoom` ile küçültülür. Sayfalı panel (`.syh`) ekranın tamamını
// kaplar: kabın yüksekliği panelden kalan yerdir.
import { $G } from '../core/store.js';
import { OV } from '../core/state.js';

const SY = Object.create(null); // anahtar → sayfa
const BAS = 'h3,h4,.osub,.sub,.syb'; // başlık: sayfanın son satırı olamaz
const YAP = '.hint,.syy'; // yapışık: önündeki öğeyle aynı sayfada kalır
const EN_AZ = 150; // sayfalı kabın en az yüksekliği (panel bundan fazlasını bırakamıyorsa küçültülür)
const EN_KUCUK = .5; // panel en fazla bu kadar küçültülür

const px = v => parseFloat(v) || 0;

// öğenin görünür çocukları, üst kenara göre satırlara
function satirlar(el) {
  const out = [];
  let cur = null;
  for (const c of /** @type {HTMLElement[]} */ ([...el.children])) {
    const r = c.getBoundingClientRect();
    if (!r.height && !r.width) continue;
    if (cur && Math.abs(r.top - cur.top) < 2) {
      cur.els.push(c);
      cur.bottom = Math.max(cur.bottom, r.bottom);
    } else out.push(cur = { els: [c], top: r.top, bottom: r.bottom, ust: null, bas: false, p: 0 });
  }
  for (const s of out) s.bas = s.els.length == 1 && s.els[0].matches(BAS);
  return out;
}

function birimler(kap, H) {
  const U = [];
  const ekle = s => {
    const son = U[U.length - 1];
    // yapışık öğe önceki birime katılır
    if (son && s.els.length == 1 && s.els[0].matches(YAP) && son.ust == s.ust) {
      son.els.push(...s.els);
      son.bottom = Math.max(son.bottom, s.bottom);
    } else U.push(s);
  };
  for (const s of satirlar(kap)) {
    const tek = s.els.length == 1 ? s.els[0] : null;
    if (tek && s.bottom - s.top > H && tek.children.length > 1 && !tek.matches('[data-sybol="0"]')) {
      for (const x of satirlar(tek)) {
        x.ust = tek;
        ekle(x);
      }
    } else ekle(s);
  }
  return U;
}

function dagit(U, H) {
  let p = 0, bas = U.length ? U[0].top : 0, ilk = 0;
  for (let i = 0; i < U.length; i++) {
    const u = U[i];
    if (u.bottom - bas > H && i > ilk) {
      p++;
      ilk = i;
      // başlık sayfanın sonunda kalmasın: yeni sayfaya geçer
      while (ilk - 1 >= 0 && U[ilk - 1].bas && U[ilk - 1].p == p - 1 && ilk - 2 >= 0 && U[ilk - 2].p == p - 1) {
        ilk--;
        U[ilk].p = p;
      }
      bas = U[ilk].top;
    }
    u.p = p;
  }
  return p + 1;
}

function goster(kap, U, p) {
  const ustler = new Map();
  for (const u of U) {
    const on = u.p == p;
    for (const e of u.els) e.classList.toggle('syg', !on);
    if (u.ust) ustler.set(u.ust, (ustler.get(u.ust) || false) || on);
  }
  for (const [e, on] of ustler) e.classList.toggle('syg', !on);
}

// geçiş denetiminin yeri: ölçümden ÖNCE kurulur (sonradan eklenirse kabı kısaltır, son sayfa taşar)
function denetimYeri(kap, key) {
  let d = /** @type {HTMLElement} */ (OV.querySelector(`[data-syn="${key}"]`));
  if (!d) {
    d = document.createElement('div');
    d.dataset.syn = key;
    d.className = 'syn tek';
    d.innerHTML = '<button class="tb syo">‹</button><span>1 / 1</span><button class="tb syo">›</button>';
    kap.after(d);
  }
  return d;
}
function denetim(kap, key, n, p) {
  const d = denetimYeri(kap, key);
  d.className = 'syn' + (n > 1 ? '' : ' tek');
  d.innerHTML = `<button class="tb syo" data-act="sySayfa" data-a='["${key}",-1]' ${p <= 0 ? 'disabled' : ''} aria-label="Önceki sayfa">‹</button><span aria-live=polite>${p + 1} / ${n}</span><button class="tb syo" data-act="sySayfa" data-a='["${key}",1]' ${p >= n - 1 ? 'disabled' : ''} aria-label="Sonraki sayfa">›</button>`;
}

function kur(kap) {
  const key = kap.dataset.sy;
  denetimYeri(kap, key);
  for (const e of kap.querySelectorAll('.syg')) e.classList.remove('syg');
  let H = kap.clientHeight - px(getComputedStyle(kap).paddingTop) - px(getComputedStyle(kap).paddingBottom), U = [], n = 1;
  if (H < 40) return void denetim(kap, key, 1, 0);
  // sayfanın başındaki öğenin üst boşluğu ölçüme girmez: taşan sayfa varsa pay bırakıp yeniden dağıtılır
  for (let tur = 0; tur < 6; tur++) {
    for (const e of kap.querySelectorAll('.syg')) e.classList.remove('syg');
    U = birimler(kap, H);
    n = dagit(U, H);
    let tasma = 0;
    for (let p = 0; p < n; p++) {
      goster(kap, U, p);
      tasma = Math.max(tasma, kap.scrollHeight - kap.clientHeight);
    }
    if (tasma <= 1) break;
    H -= tasma + 2;
    if (H < 40) break;
  }
  const p = Math.max(0, Math.min(n - 1, SY[key] | 0));
  SY[key] = p;
  /** @type {any} */ (kap)._sy = { U, n };
  goster(kap, U, p);
  denetim(kap, key, n, p);
}

// paneli ekrana sığdır: sayfalı panel ekranı kaplar, diğerleri uzunsa küçülür
function sigdir() {
  const cs = getComputedStyle(OV), aH = OV.clientHeight - px(cs.paddingTop) - px(cs.paddingBottom), aW = OV.clientWidth - px(cs.paddingLeft) - px(cs.paddingRight);
  if (aH < 50) return;
  for (const pn of /** @type {HTMLElement[]} */ ([...OV.children])) {
    pn.style.zoom = '';
    pn.style.removeProperty('--syh');
    if (!pn.offsetHeight) continue;
    const kaplar = /** @type {HTMLElement[]} */ ([...pn.querySelectorAll('[data-sy]')]);
    let z = 1;
    if (pn.classList.contains('syh') && kaplar.length) {
      // sayfalı kaplar yokken panelin yüksekliği: değişmeyen kısım
      for (const k of kaplar) k.style.display = 'none';
      pn.style.setProperty('--syh', 'auto');
      pn.style.alignSelf = 'flex-start'; // katman paneli kendi boyuna gerer: ölçerken gerilmesin
      const sabit = pn.offsetHeight, gen = pn.scrollWidth;
      pn.style.alignSelf = '';
      for (const k of kaplar) k.style.display = '';
      z = Math.max(EN_KUCUK, Math.min(1, aH / (sabit + EN_AZ), aW / Math.max(1, gen)));
      if (z < 1) pn.style.zoom = String(z);
      pn.style.setProperty('--syh', Math.floor(aH / z) + 'px');
    } else {
      for (let tur = 0; tur < 3; tur++) {
        // giriş animasyonu paneli birkaç piksel kaydırır: ölçümden düşülür (yoksa panel boşuna küçülür)
        const r = pn.getBoundingClientRect(), o = OV.getBoundingClientRect(), kay = new DOMMatrixReadOnly(getComputedStyle(pn).transform).m42 * z,
          tH = Math.max(r.height, pn.scrollHeight * z, r.bottom - kay - o.top - px(cs.paddingTop)), tW = Math.max(r.width, pn.scrollWidth * z); // scrollHeight: panelin kendi kutusundan taşan içerik de sayılır
        if (tH <= aH + 1 && tW <= aW + 1) break;
        z = Math.max(EN_KUCUK, z * Math.min(aH / tH, aW / tW) * .995);
        pn.style.zoom = String(z);
      }
    }
  }
}

let ro = null, roT = 0, roN = 0;
function olc() {
  if (!OV || OV.classList.contains('h')) return;
  sigdir();
  for (const kap of /** @type {HTMLElement[]} */ ([...OV.querySelectorAll('[data-sy]')])) kur(kap);
}
export function sayfala() {
  olc();
  // içerik sonradan büyürse (yazı tipi, resim, geç dolan liste) yeniden ölçülür; kendi değişikliğimiz döngüye sokmasın diye sayılı
  roN = 0;
  if (!ro && typeof ResizeObserver != 'undefined') {
    ro = new ResizeObserver(() => {
      if (roN > 6) return;
      clearTimeout(roT);
      roT = setTimeout(() => {
        roN++;
        olc();
      }, 60);
    });
  }
  if (ro) {
    ro.disconnect();
    for (const pn of OV.children) {
      ro.observe(pn);
      for (const c of pn.children) ro.observe(c);
    }
  }
}

// sayfa değiştir (d: -1 önceki, +1 sonraki); yapılabildiyse true
export function sySayfa(key, d) {
  const kap = /** @type {any} */ (OV.querySelector(`[data-sy="${key}"]`));
  if (!kap || !kap._sy) return false;
  const p = Math.max(0, Math.min(kap._sy.n - 1, (SY[key] | 0) + d));
  if (p == (SY[key] | 0)) return false;
  SY[key] = p;
  goster(kap, kap._sy.U, p);
  denetim(kap, key, kap._sy.n, p);
  return true;
}
// anahtarın sayfasını başa al (liste içeriği değişince)
export function syBas(key) {
  SY[key] = 0;
}
// ekrandaki ilk çok sayfalı kabı çevir
export function syCevir(d) {
  for (const kap of /** @type {any[]} */ ([...OV.querySelectorAll('[data-sy]')])) if (kap._sy && kap._sy.n > 1 && kap.offsetHeight) return sySayfa(kap.dataset.sy, d);
  return false;
}

export function __init_sayfa() {
  let t = 0, son = 0;
  addEventListener('resize', () => {
    clearTimeout(t);
    t = setTimeout(sayfala, 80);
  });
  const acik = () => $G.S != 'play' && !OV.classList.contains('h');
  addEventListener('wheel', e => {
    if (!acik() || Math.abs(e.deltaY) < 8) return;
    const el = /** @type {HTMLElement} */ (e.target);
    if (el && el.closest && el.closest('input[type=range],select,textarea')) return;
    const now = performance.now();
    if (now - son < 220) return;
    if (syCevir(e.deltaY > 0 ? 1 : -1)) son = now;
  }, { passive: true });
  addEventListener('keydown', e => {
    if (!acik() || e.ctrlKey || e.metaKey || e.altKey) return;
    const el = /** @type {HTMLElement} */ (e.target);
    if (el && el.matches && el.matches('input:not([type=range]):not([type=checkbox]),textarea,select')) return;
    const d = e.key == 'PageDown' || e.key == 'e' || e.key == 'E' ? 1 : e.key == 'PageUp' || e.key == 'q' || e.key == 'Q' ? -1 : 0;
    if (d && syCevir(d)) e.preventDefault();
  });
  // dokunmatik: yana kaydırma sayfa çevirir
  let x0 = 0, y0 = 0, izle = false;
  addEventListener('touchstart', e => {
    const el = /** @type {HTMLElement} */ (e.target);
    izle = acik() && e.touches.length == 1 && !(el && el.closest && el.closest('input[type=range]'));
    if (izle) x0 = e.touches[0].clientX, y0 = e.touches[0].clientY;
  }, { passive: true });
  addEventListener('touchend', e => {
    if (!izle) return;
    izle = false;
    const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) syCevir(dx < 0 ? 1 : -1);
  }, { passive: true });
}
