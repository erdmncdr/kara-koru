// core/ayar.js · Kara Koru
// Uzaktan ayar (LiveOps). Oyun açılışta sunucudan (supabase/liveops.sql: kk_ayar, kk_etkinlik; herkese açık okuma) şunları çeker:
//   denge    : denge sabitleri. Şema ve sınırlar data/ayar-sema.js'te; yönetim panelinden değiştirilir, yayın gerekmez.
//   bakim    : açıksa oyun açılmaz, mesaj gösterilir (ui/yukle.js yukBakim).
//   etkinlik : süreli duyurular ve kazanç çarpanları (çift tecrübe gibi). Menüde şerit olarak görünür.
// Sunucuya ulaşılamazsa son başarılı yanıt (tarayıcıda saklanır) kullanılır, o da yoksa koddaki değerler. Bakım yalnız taze
// yanıttan okunur (eski bir bakım kaydı oyunu kilitlemesin). Değerler açılışta uygulanır: ayar değişince oyuncu sayfayı
// yenilediğinde görür; etkinliklerin başlama ve bitme anı koşu sürerken de izlenir.
import { SEMA, semaDeger } from '../data/ayar-sema.js';
import { DNG, KZN } from '../data/denge.js';
import { SVD } from '../game/stats.js';
import { BOSS_ST, TIERM } from '../game/run.js';
import { supaCfg, supaOn } from '../ui/supa.js';

// kimlik → [oku, yaz]: sabitin oyundaki yeri
const HEDEF = {
  sv_kir: [() => SVD.kir, v => (SVD.kir = v)],
  sv_kat: [() => SVD.kat, v => (SVD.kat = v)],
  sv_odul: [() => SVD.odul, v => (SVD.odul = v)],
  dusman_can: [() => DNG.can, v => (DNG.can = v)],
  dusman_hasar: [() => DNG.hasar, v => (DNG.hasar = v)],
  tierm_1: [() => TIERM[0], v => (TIERM[0] = v)],
  tierm_2: [() => TIERM[1], v => (TIERM[1] = v)],
  tierm_3: [() => TIERM[2], v => (TIERM[2] = v)],
  boss_st_1: [() => BOSS_ST[0], v => (BOSS_ST[0] = v)],
  boss_st_2: [() => BOSS_ST[1], v => (BOSS_ST[1] = v)],
  boss_st_3: [() => BOSS_ST[2], v => (BOSS_ST[2] = v)],
  boss_t_adim: [() => DNG.bossAdim, v => (DNG.bossAdim = v)],
  boss_t_ust: [() => DNG.bossUst, v => (DNG.bossUst = v)],
  xp_k: [() => DNG.xp, v => (DNG.xp = v)],
  altin_k: [() => DNG.altin, v => (DNG.altin = v)],
  gumus_k: [() => DNG.gumus, v => (DNG.gumus = v)],
  wmax: [() => DNG.wmax, v => (DNG.wmax = v)],
  tmax: [() => DNG.tmax, v => (DNG.tmax = v)]
};

// şemadaki varsayılan koddaki sabitle aynı mı (test derlemesinde bakılır; tests/smoke.mjs __ayarFark boş olmalı)
if (__KOPRU__) {
  /** @type {any} */ (window).__ayarFark = SEMA.filter(s => !HEDEF[s.id] || HEDEF[s.id][0]() !== s.vars).map(s => s.id)
    .concat(Object.keys(HEDEF).filter(k => !SEMA.some(s => s.id == k)));
}

const ONBELLEK = 'kk_ayar';
// son durum: uygulanan denge (yalnız varsayılandan farklı olanlar), etkinlikler, bakım, yanıtın kaynağı
export const AYAR = { kaynak: 'kod', denge: {}, etkinlik: [], bakim: null };

function uygula(denge) {
  const d = denge && typeof denge == 'object' && !Array.isArray(denge) ? denge : {};
  AYAR.denge = {};
  for (const s of SEMA) {
    const v = semaDeger(s, d[s.id]);
    HEDEF[s.id][1](v);
    if (v !== s.vars) AYAR.denge[s.id] = v;
  }
}

const etkinlikTemiz = e => (Array.isArray(e) ? e : []).filter(x => x && typeof x.baslik == 'string').slice(0, 10).map(x => ({
  id: x.id, baslik: x.baslik.slice(0, 60), metin: typeof x.metin == 'string' ? x.metin.slice(0, 400) : '',
  tur: ['duyuru', 'etkinlik', 'uyari'].includes(x.tur) ? x.tur : 'duyuru',
  bas: Date.parse(x.bas) || 0, bit: x.bit ? Date.parse(x.bit) || 0 : 0,
  carpan: x.carpan && typeof x.carpan == 'object' ? x.carpan : {}
}));

// şu an geçerli etkinlikler (önce uyarı, sonra etkinlik, sonra duyuru)
export function etkinlikler(simdi = Date.now()) {
  const sira = { uyari: 0, etkinlik: 1, duyuru: 2 };
  return AYAR.etkinlik.filter(e => e.bas <= simdi && (!e.bit || e.bit > simdi)).sort((a, b) => sira[a.tur] - sira[b.tur] || b.bas - a.bas);
}

// kazanç çarpanları: kalıcı (denge) × geçerli etkinliklerin çarpımı; 0.25-5 arasına sıkıştırılır
export function kazancGuncelle() {
  const e = etkinlikler();
  for (const k of ['xp', 'altin', 'gumus']) {
    let c = DNG[k];
    for (const x of e) if (typeof x.carpan[k] == 'number' && isFinite(x.carpan[k]) && x.carpan[k] > 0) c *= x.carpan[k];
    KZN[k] = Math.max(.25, Math.min(5, c));
  }
}

async function getir(yol) {
  const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 2500);
  try {
    const r = await fetch(supaCfg.base + yol, { headers: { apikey: supaCfg.key, Authorization: 'Bearer ' + supaCfg.key }, signal: ctl.signal });
    if (!r.ok) throw new Error('ayar ' + r.status);
    return await r.json();
  } finally {
    clearTimeout(to);
  }
}

// açılışta bir kez. Dönüş: AYAR (bakim doluysa oyun açılmaz)
export async function ayarYukle() {
  let v = null, taze = false;
  if (supaOn) {
    try {
      const [a, e] = await Promise.all([
        getir('/rest/v1/kk_ayar?select=anahtar,deger'),
        getir('/rest/v1/kk_etkinlik?select=id,baslik,metin,tur,bas,bit,carpan&order=bas.desc&limit=10')
      ]);
      const ayar = {};
      for (const r of Array.isArray(a) ? a : []) if (r && typeof r.anahtar == 'string') ayar[r.anahtar] = r.deger;
      v = { ayar, etkinlik: Array.isArray(e) ? e : [] };
      taze = true;
      try {
        localStorage.setItem(ONBELLEK, JSON.stringify(v));
      } catch (x) {}
    } catch (x) {
      // sunucuya ulaşılamadı ya da tablolar henüz yok: son başarılı yanıt
      try {
        v = JSON.parse(localStorage.getItem(ONBELLEK) || 'null');
      } catch (y) {}
    }
  }
  const ayar = (v && v.ayar) || {};
  uygula(ayar.denge);
  AYAR.etkinlik = etkinlikTemiz(v && v.etkinlik);
  AYAR.kaynak = taze ? 'sunucu' : v ? 'onbellek' : 'kod';
  const b = taze ? ayar.bakim : null;
  AYAR.bakim = b && b.acik ? { mesaj: typeof b.mesaj == 'string' ? b.mesaj.slice(0, 300) : '' } : null;
  kazancGuncelle();
  setInterval(() => { kazancGuncelle(); duyuruCiz(); }, 30000); // etkinlik başlar ya da biterse
  return AYAR;
}

// ---- menüdeki duyuru şeridi: geçerli etkinlik ve duyurular. Yalnız menüde görünür (body.on = oyun sürüyor).
// Şerit tek satır; dokununca açılır ve hepsini metniyle gösterir. Yer kaplamaz: menünün üstünde sabit durur.
let kutu = null, acik = false;
const kalan = bit => {
  const s = Math.max(0, bit - Date.now()) / 1000;
  return s >= 2 * 86400 ? Math.floor(s / 86400) + ' gün' : s >= 3600 ? Math.floor(s / 3600) + ' saat' : Math.max(1, Math.floor(s / 60)) + ' dk';
};
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function duyuruCiz() {
  const e = etkinlikler();
  if (!kutu) {
    if (!e.length) return;
    const st = document.createElement('style');
    st.textContent = `#duyuru{position:fixed;z-index:60;top:max(10px,env(safe-area-inset-top));left:50%;transform:translateX(-50%);max-width:min(560px,calc(100vw - 24px));font:600 14px/1.25 "Signika","Trebuchet MS",sans-serif;color:#fff}
body.on #duyuru,#duyuru:empty{display:none}
#duyuru button{all:unset;box-sizing:border-box;display:flex;align-items:center;gap:8px;max-width:100%;padding:7px 14px 7px 10px;border:2px solid #000;border-radius:999px;background:rgba(34,24,18,.94);box-shadow:0 3px 0 rgba(0,0,0,.45);cursor:pointer}
#duyuru button:focus-visible{outline:2px solid #e3a93b;outline-offset:2px}
#duyuru i{flex:none;width:9px;height:9px;border-radius:50%;background:#e3a93b;box-shadow:0 0 0 3px rgba(227,169,59,.25)}
#duyuru .uyari i{background:#e2574c;box-shadow:0 0 0 3px rgba(226,87,76,.25)}
#duyuru .duyuru i{background:#9fe8d8;box-shadow:0 0 0 3px rgba(159,232,216,.22)}
#duyuru b{font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#duyuru small{flex:none;font-size:12px;color:#cfc6ba;font-variant-numeric:tabular-nums}
#duyuru ul{list-style:none;margin:6px 0 0;padding:6px;border:2px solid #000;border-radius:12px;background:rgba(24,17,13,.97);box-shadow:0 4px 0 rgba(0,0,0,.45);display:grid;gap:4px}
#duyuru li{display:grid;grid-template-columns:auto 1fr auto;gap:2px 8px;align-items:center;padding:7px 9px;border-radius:8px;background:rgba(255,255,255,.05)}
#duyuru li p{grid-column:2 / 4;margin:0;font-weight:500;color:#cfc6ba}
@media (prefers-reduced-motion:no-preference){#duyuru .etkinlik i{animation:duyuruN 1.6s ease-in-out infinite}}
@keyframes duyuruN{50%{box-shadow:0 0 0 6px rgba(227,169,59,0)}}`;
    document.head.appendChild(st);
    kutu = document.createElement('div');
    kutu.id = 'duyuru';
    kutu.addEventListener('click', () => { acik = !acik; duyuruCiz(); });
    document.body.appendChild(kutu);
  }
  if (!e.length) { kutu.innerHTML = ''; return; }
  const ilk = e[0], sure = x => (x.bit ? `<small>${kalan(x.bit)} kaldı</small>` : '<small></small>');
  kutu.innerHTML = `<button class="${ilk.tur}" aria-expanded="${acik}" aria-label="Duyurular: ${esc(ilk.baslik)}"><i></i><b>${esc(ilk.baslik)}</b>${ilk.bit ? sure(ilk) : ''}${e.length > 1 ? `<small>+${e.length - 1}</small>` : ''}</button>`
    + (acik ? `<ul>${e.map(x => `<li class="${x.tur}"><i></i><b>${esc(x.baslik)}</b>${sure(x)}${x.metin ? `<p>${esc(x.metin)}</p>` : ''}</li>`).join('')}</ul>` : '');
}
