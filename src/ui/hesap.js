// ui/hesap.js · Kara Koru
// Oyuncu hesabı: kullanıcı adı + şifre (Supabase Auth), giriş zorunlu. Oyunun bütün kaydı (ilerleme, rekorlar, ayarlar)
// hesapta durur; tarayıcıdaki kopya önbellektir.
//
// Akış (main.js): hesapKapisi() oyun yüklenmeden önce çalışır. Geçerli oturum yoksa giriş/kayıt ekranı gelir.
// Girişten sonra hesabın kaydı indirilip tarayıcıya yazılır, oyun ancak ondan sonra yüklenir (modüller kaydı
// açılışta okur). Oyun sürerken kayıt anahtarları birkaç saniyede bir yoklanır, değiştiyse hesaba gönderilir.
//
// Kullanıcı adı e-posta biçimine çevrilir (Supabase Auth e-posta ister): adın küçük harfli UTF-8 baytları onaltılık
// yazılır. E-posta gönderilmez; Supabase panelinde "Confirm email" kapalı olmalıdır. Şifre sıfırlama yok.
// Adres ve anahtar yoksa (yerel geliştirme, Claude içinde) hesap sistemi kapalıdır, oyun eskisi gibi tarayıcıda kaydeder.

import { supaAuth, supaCfg, supaOn, supaReq } from './supa.js';

// giriş ekranının sahnesi: boyalı arka plan (varsa), sis, ruh ışığı sütunları ve yükselen korlar. Yalnız CSS animasyonu.
const GA = import.meta.glob('../assets/giris/*.webp', { eager: true, query: '?url', import: 'default' });
const ARKA = /** @type {string|undefined} */ (Object.values(GA)[0]);
function sahne() {
  let kor = '';
  for (let i = 0; i < 26; i++) {
    const x = (i * 37 + 11) % 100, d = 9 + ((i * 7) % 8), dl = -((i * 13) % 17), s = 2 + (i % 3);
    kor += `<i style="--x:${x}%;--d:${d}s;--dl:${dl}s;--s:${s}px;--k:${(i % 5) - 2}"></i>`;
  }
  const isik = [34, 43, 52, 63, 71].map((x, i) => `<b style="--x:${x}%;--dl:${-i * 1.7}s;--w:${8 + (i % 3) * 5}px"></b>`).join('');
  return `<div class="gfx${ARKA ? ' res' : ''}" aria-hidden=true><div class=gbg${ARKA ? ` style="background-image:url('${ARKA}')"` : ''}></div><div class=gdag></div><div class=gisik>${isik}</div><div class=gsis></div><div class=gsis2></div><div class=gkor>${kor}</div><div class=gkarart></div></div>`;
}

const OTURUM = 'kk_oturum',
  BULUT = 'kk_bulut';
// hesaba giren tarayıcı anahtarları; çıkışta silinir
export const HESAP_ANAHTAR = ['kk_meta', 'kk_set', 'kk_lb', 'kk_bestk', 'kk_ci', 'kk_map', 'kk_tips', 'kk_tut', 'kk_lbpend', 'nb_best'];
export const AD_RE = /^[A-Za-z0-9_çğıöşüÇĞİÖŞÜ]{3,15}$/;

let OT = null; // { at, rt, exp, id, ad }

// okuma: değer ya da null. Yazma/silme: başarılıysa true (kota dolu ya da depolama kapalıysa false)
function ls(k, v) {
  try {
    if (v === undefined) return localStorage.getItem(k);
    if (v === null) localStorage.removeItem(k);
    else localStorage.setItem(k, v);
    return true;
  } catch (e) {}
  return v === undefined ? null : false;
}

const jget = k => {
  try {
    return JSON.parse(/** @type {string} */ (ls(k)) || 'null');
  } catch (e) {
    return null;
  }
};

export function hesapAktif() {
  return supaOn;
}

// giriş yapmış oyuncu: { id, ad } ya da null
export function hesap() {
  return OT ? { id: OT.id, ad: OT.ad } : null;
}

export function adEposta(ad) {
  const b = new TextEncoder().encode(String(ad).toLocaleLowerCase('tr-TR'));
  return 'u' + [...b].map(x => x.toString(16).padStart(2, '0')).join('') + '@oyuncu.kara-koru.app';
}

// ---- Supabase Auth uçları
async function authReq(path, body, tok) {
  let r;
  try {
    r = await fetch(supaCfg.base + '/auth/v1/' + path, {
      method: 'POST',
      headers: { apikey: supaCfg.key, 'Content-Type': 'application/json', ...(tok ? { Authorization: 'Bearer ' + tok } : {}) },
      body: JSON.stringify(body || {})
    });
  } catch (e) {
    const x = /** @type {any} */ (new Error('ag'));
    x.ag = 1;
    throw x;
  }
  const t = await r.text();
  let j = null;
  try {
    j = t ? JSON.parse(t) : null;
  } catch (e) {}
  if (!r.ok) {
    const x = /** @type {any} */ (new Error((j && (j.msg || j.message || j.error_description)) || 'http ' + r.status));
    x.status = r.status;
    x.code = (j && (j.error_code || j.code || j.error)) || '';
    throw x;
  }
  return j;
}

function oturumYaz(j) {
  if (!j || !j.access_token || !j.user) throw new Error('oturum yok');
  const um = j.user.user_metadata || {};
  OT = {
    at: j.access_token,
    rt: j.refresh_token,
    exp: j.expires_at ? j.expires_at * 1000 : Date.now() + (j.expires_in || 3600) * 1000,
    id: j.user.id,
    ad: typeof um.ad == 'string' ? um.ad : OT && OT.id == j.user.id ? OT.ad : ''
  };
  ls(OTURUM, JSON.stringify(OT));
}

let yenileP = null;
// oturum bütün sekmelerde ortaktır (localStorage). Başka sekme belirteci yenilediyse onunki alınır: yenileme belirteçleri
// tek kullanımlıktır, eskisiyle yenilemek reddedilir ve bütün sekmelerin oturumunu düşürürdü.
function ortakOturum() {
  const o = jget(OTURUM);
  return o && OT && o.id == OT.id && o.at && o.rt ? o : null;
}

// geçerli erişim belirteci; süresi dolmak üzereyse yenilenir. Oturum kesin olarak geçersizse (yenileme reddedildi) null;
// ağ hatası ya da hız sınırında (429, 5xx) oturum korunur, hata fırlatılır.
export async function belirtec() {
  if (!OT) return null;
  const o = ortakOturum();
  if (o && o.exp > OT.exp) OT = o;
  if (OT.exp - Date.now() > 60000) return OT.at;
  if (!yenileP) {
    const rt = OT.rt;
    yenileP = authReq('token?grant_type=refresh_token', { refresh_token: rt })
      .then(j => (oturumYaz(j), OT.at))
      .catch(e => {
        const o2 = ortakOturum();
        if (o2 && o2.rt != rt) return (OT = o2), OT.at; // başka sekme bu arada yeniledi
        if (!e.ag && (e.status == 400 || e.status == 401 || e.status == 403)) {
          // yenileme belirteci geçersiz: oturum biter (depodaki hâlâ aynıysa silinir)
          const d = jget(OTURUM);
          if (d && d.rt == rt) ls(OTURUM, null);
          OT = null;
          yaz = false;
          if (acik) bildir('Oturumun sona erdi; bu cihazdaki ilerlemen duruyor. Kaydetmeye devam etmek için yeniden giriş yap.', 'Giriş yap');
          return null;
        }
        throw e;
      })
      .finally(() => (yenileP = null));
  }
  return yenileP;
}

supaAuth(hesap, () => belirtec().catch(() => null));

// ---- kayıt eşitleme
function topla() {
  const o = {};
  for (const k of HESAP_ANAHTAR) {
    const v = ls(k);
    if (v != null) o[k] = v;
  }
  return o;
}

// sıralamadan bağımsız kısa özet (değişiklik yoklaması için)
function ozet(o) {
  const s = JSON.stringify(Object.keys(o).sort().map(k => [k, o[k]]));
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36) + ':' + s.length;
}

function temizle() {
  for (const k of HESAP_ANAHTAR) ls(k, null);
}

// hesabın kaydını tarayıcıya yazar; bir anahtar bile yazılamazsa (kota) hata: eksik kayıt sonradan hesaba yüklenmesin
function uygula(veri) {
  temizle();
  for (const k of HESAP_ANAHTAR)
    if (typeof veri[k] == 'string' && !ls(k, veri[k])) {
      ls(BULUT, null);
      throw Object.assign(new Error('depo'), { depo: 1 });
    }
}

// tarayıcıdaki kayıt hesapla son eşitlemeden beri değişti mi
function kirliMi() {
  const s = jget(BULUT);
  return !(OT && s && s.id == OT.id && s.h == ozet(topla()));
}

async function satirGetir() {
  const tok = await belirtec();
  if (!tok) throw Object.assign(new Error('oturum'), { oturum: 1 });
  const a = await supaReq('/rest/v1/kk_hesap?select=ad,veri,guncel&id=eq.' + OT.id, {}, tok);
  return Array.isArray(a) && a[0] ? a[0] : null;
}

// yazma izni: yalnız hesabın kaydı indirilip uzlaştırıldıktan sonra. Önbellek hesabın gerçek kaydının yerine geçmesin
// (ilk indirme başarısızken boş önbellek yüklenip hesaptaki ilerlemeyi silmesin).
let yaz = false,
  acik = false, // oyun açıldı (giriş kapısı geçildi)
  SRV = null, // hesabın bilinen son sunucu zamanı (guncel, ham dizge): kk_kaydet bununla eşzamanlılığı denetler
  gonderP = null,
  sonGonder = 0;

// bu sekmenin oturumu hâlâ depodaki oturum mu (başka sekmede çıkış ya da hesap değişimi)
function sahipMi() {
  const o = jget(OTURUM);
  return !!(OT && o && o.id == OT.id);
}

function sekmeDegisti() {
  yaz = false;
  OT = null;
  location.reload();
}

// tarayıcıdaki kaydı hesaba yazar; keepalive sayfa kapanırken de gitsin diye
export async function hesapKaydet(keepalive) {
  if (!OT || !yaz) return false;
  if (!sahipMi()) {
    sekmeDegisti();
    return false;
  }
  if (gonderP) return gonderP;
  if (!etkinMi()) return false;
  const v = topla(),
    h = ozet(v),
    id = OT.id;
  gonderP = (async () => {
    try {
      const tok = await belirtec();
      if (!tok || !OT || OT.id != id) return false;
      gonderilen.add(h);
      const t = await supaReq('/rest/v1/rpc/kk_kaydet', { method: 'POST', body: JSON.stringify({ p_veri: v, p_onceki: SRV }), keepalive }, tok);
      SRV = t;
      gonderilen.clear();
      ls(BULUT, JSON.stringify({ id, h, t: Date.parse(t) || Date.now() }));
      return true;
    } catch (e) {
      if (e.status == 409 || e.code == 'PT409') await cakisma(id);
      return false;
    } finally {
      sonGonder = Date.now();
      gonderP = null;
    }
  })();
  return gonderP;
}

// yanıtı kaybolan gönderimler (ağ hatası sunucu yazdıktan sonra da olabilir): özetleri tutulur
const gonderilen = new Set();

// 409: hesap son bilinen sürümden beri yazılmış. Sunucudaki kayıt yanıtı kaybolan kendi gönderimimizse çakışma yoktur,
// sürüm alınır ve kayıt sürer; değilse başka cihaz yazmıştır: bu cihazdaki hâl hesabın yerine yazılmaz, oyuncu
// yenileyince hesabın kaydı gelir.
async function cakisma(id) {
  try {
    const r = await satirGetir();
    if (r && OT && OT.id == id && r.veri && gonderilen.has(ozet(r.veri))) {
      SRV = r.guncel;
      ls(BULUT, JSON.stringify({ id, h: ozet(r.veri), t: Date.parse(r.guncel) || Date.now() }));
      gonderilen.clear();
      return;
    }
  } catch (e) {
    return; // okunamadı: yazma açık kalır, sonraki denemede yine sorulur
  }
  yaz = false;
  bildir('Hesabın başka bir cihazda güncellendi. Bu cihazda kaydetmeye devam etmek için sayfayı yenile; hesaptaki kayıt gelir.', 'Yenile');
}

// ---- tek etkin sekme: aynı tarayıcıda oyun yalnız bir sekmede çalışır. Sekmeler kaydı (localStorage) paylaştığı için
// eski bellekle çalışan bir sekme yenisinin ilerlemesini ezip hesaba yükleyebilirdi. Etkin sekme 2 sn'de bir imza atar;
// açılışta taze imza başka sekmeninse oyun yüklenmez, "Burada oyna" ile devralınır, eski sekme yeniden yüklenip bekler.
const ETKIN = 'kk_etkin',
  SEKME = Math.random().toString(36).slice(2) + Date.now().toString(36);
let etkinT = 0;
function etkinMi() {
  const e = jget(ETKIN);
  return !!(e && e.id == SEKME);
}
function baskaEtkin() {
  const e = jget(ETKIN);
  return !!(e && e.id != SEKME && Date.now() - (e.t || 0) < 6000);
}
function etkinOl() {
  const imza = () => ls(ETKIN, JSON.stringify({ id: SEKME, t: Date.now() }));
  imza();
  clearInterval(etkinT);
  etkinT = window.setInterval(() => {
    if (etkinMi()) imza();
  }, 2000);
  window.addEventListener('storage', e => {
    if (e.key == ETKIN && !etkinMi()) {
      yaz = false;
      location.reload();
    }
  });
  // kapanırken önce son kayıt (kilit bu sekmedeyken), sonra kilit bırakılır
  window.addEventListener('pagehide', () => {
    if (OT && yaz && kirliMi()) hesapKaydet(true);
    if (etkinMi()) ls(ETKIN, null);
  });
  // geri/ileri önbelleğinden dönen sayfa: kilidi bırakmıştı, yeniden yüklenip baştan alır
  window.addEventListener('pageshow', e => {
    if (e.persisted) location.reload();
  });
}

// bekleyen gönderim bittikten sonra kalan değişiklik de gönderilir; dönüş: tarayıcıdaki son hâl hesapta mı
async function hepsiniKaydet() {
  for (let i = 0; i < 4; i++) {
    if (gonderP) await gonderP;
    if (!kirliMi()) return true;
    if (!(await hesapKaydet())) return false;
  }
  return !kirliMi();
}

// girişten sonra, oyun yüklenmeden: hesabın kaydı ile tarayıcıdakini uzlaştırır.
// Sunucuya ulaşılamazsa: tarayıcıda bu hesabın önbelleği varsa onunla oynanır (yazma kapalı, arka planda yeniden
// denenir); yoksa hata fırlatılır, giriş tamamlanmaz.
async function esitle() {
  const sahip = jget(BULUT);
  let r;
  try {
    r = await satirGetir();
  } catch (e) {
    if (e.oturum) throw e;
    if (sahip && sahip.id == OT.id) {
      sonraUzlas();
      return;
    }
    throw Object.assign(new Error('ag'), { ag: 1 });
  }
  // indirme sürerken başka sekmede hesap değiştiyse ya da oyun başka sekmeye geçtiyse bu yanıt uygulanmaz
  if (!sahipMi() || !etkinMi()) throw Object.assign(new Error('sekme'), { sekme: 1 });
  SRV = r ? r.guncel : null;
  uzlas(r, sahip);
  yaz = true;
  // boş kayıt gönderilmez: hesabın sürümünü boşuna ilerletir, aynı anda açılan öbür cihazın yazmasını çakışmaya düşürürdü
  if (Object.keys(topla()).length && kirliMi()) await hesapKaydet();
}

// r: hesabın satırı. Hesap boşsa tarayıcıdaki sahipsiz ilerleme (hesaplardan önceki oyun) hesaba geçer, başka hesabın
// verisi geçmez. Tarayıcıda gönderilmemiş değişiklik varken hesap son eşitlemeden beri başka yerde değişmediyse
// tarayıcıdaki kazanır; aksi hâlde hesabın kaydı tarayıcıya yazılır. Dönüş: tarayıcıdaki kayıt değişti mi.
function uzlas(r, sahip) {
  if (r && typeof r.ad == 'string' && r.ad != OT.ad) {
    OT.ad = r.ad;
    ls(OTURUM, JSON.stringify(OT));
  }
  const veri = r && r.veri && typeof r.veri == 'object' ? r.veri : {},
    srvT = r ? Date.parse(r.guncel) || 0 : 0,
    ayni = sahip && sahip.id == OT.id;
  if (!Object.keys(veri).length) {
    if (sahip && !ayni) temizle();
    // tarayıcıdaki kayıt artık bu hesabın; ilk gönderim olmadıysa kirli kalır (özet boş), sonra gönderilir
    if (!ayni) ls(BULUT, JSON.stringify({ id: OT.id, h: '', t: srvT }));
    return false;
  }
  if (ayni && sahip.h != ozet(topla()) && srvT <= (sahip.t || 0)) return false;
  uygula(veri);
  ls(BULUT, JSON.stringify({ id: OT.id, h: ozet(topla()), t: srvT }));
  return true;
}

// çevrimdışı açılış: bağlantı gelince uzlaşılır. Hesap bu arada başka yerde değiştiyse oyundaki hâl hesabın yerine
// yazılmaz; oyuncuya yenilemesi söylenir (yenileyince hesabın kaydı gelir).
let uzlasT = 0;
function sonraUzlas() {
  clearTimeout(uzlasT);
  uzlasT = window.setTimeout(async () => {
    if (!OT || yaz) return;
    let r;
    try {
      r = await satirGetir();
    } catch (e) {
      if (!e.oturum) sonraUzlas();
      return;
    }
    if (!sahipMi()) return sekmeDegisti();
    const sahip = jget(BULUT),
      srvT = r ? Date.parse(r.guncel) || 0 : 0;
    if (!r || !Object.keys(r.veri || {}).length || (sahip && sahip.id == OT.id && srvT <= (sahip.t || 0))) {
      SRV = r ? r.guncel : null;
      yaz = true;
      hesapKaydet();
    } else bildir('Hesabın başka bir cihazda güncellendi. Güncel kaydı almak için sayfayı yenile.', 'Yenile');
  }, 15000);
}

// oyun içi uyarı; düğme sayfayı yeniler (giriş ekranı ya da hesabın güncel kaydı gelir)
function bildir(m, dugme) {
  let el = document.querySelector('#hesapuyari');
  if (!el) {
    el = document.createElement('div');
    el.id = 'hesapuyari';
    el.setAttribute('role', 'status');
    document.body.appendChild(el);
  }
  el.innerHTML = '<span></span>' + (dugme ? '<button type=button></button>' : '');
  el.querySelector('span').textContent = m;
  const b = el.querySelector('button');
  if (b) {
    b.textContent = dugme;
    b.addEventListener('click', () => location.reload());
  }
}

let yoklaT = 0;
function otoKayit() {
  if (yoklaT) return;
  // birkaç saniyede bir: kayıt değiştiyse ve son gönderimden 8 sn geçtiyse gönder
  yoklaT = window.setInterval(() => {
    if (!OT || !yaz || gonderP || Date.now() - sonGonder < 8000) return;
    if (kirliMi()) hesapKaydet();
  }, 3000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState == 'hidden' && OT && yaz && kirliMi()) hesapKaydet(true);
  });
}

// başka sekmede çıkış ya da başka hesapla giriş: bu sekme yazmayı bırakıp yeniden yüklenir; yenilenen belirteç alınır.
// Giriş kapısının başında kurulur (kayıt indirilirken de geçerli).
let dinle = false;
function sekmeDinle() {
  if (dinle) return;
  dinle = true;
  window.addEventListener('storage', e => {
    if (e.key != OTURUM && e.key !== null) return;
    if (!OT) return;
    const o = jget(OTURUM);
    if (!o || o.id != OT.id) sekmeDegisti();
    else if (o.exp > OT.exp) OT = o;
  });
}

// ---- çıkış
export async function hesapCik() {
  if (!OT) return;
  const not = document.querySelector('#hesapnot');
  if (not) not.textContent = 'Kayıt gönderiliyor…';
  const ok = yaz && (await hepsiniKaydet());
  if (!ok) {
    if (not) not.textContent = 'Sunucuya ulaşılamadı, kayıt gönderilemedi. Çıkış yapılmadı.';
    return;
  }
  yaz = false;
  try {
    await authReq('logout', {}, OT.at);
  } catch (e) {}
  OT = null;
  ls(OTURUM, null);
  ls(BULUT, null);
  temizle();
  location.reload();
}

// ---- giriş / kayıt ekranı
const hata = e => {
  if (e.ag) return 'Sunucuya ulaşılamadı. Bağlantını kontrol et.';
  const c = String(e.code || ''),
    m = String(e.message || '');
  if (c == 'invalid_credentials' || /invalid login/i.test(m)) return 'Kullanıcı adı ya da şifre yanlış.';
  if (c == 'user_already_exists' || c == 'email_exists' || /already registered/i.test(m) || /database error saving new user/i.test(m)) return 'Bu kullanıcı adı alınmış.';
  if (c == 'weak_password' || /password should be/i.test(m)) return 'Şifre en az 6 karakter olmalı.';
  if (e.status == 429 || /rate limit/i.test(c + m)) return 'Çok fazla deneme. Biraz bekleyip yeniden dene.';
  if (c == 'email_not_confirmed') return 'Hesap doğrulanmamış (sunucu ayarı). Yöneticiye bildir.';
  return 'Bir sorun çıktı (' + (c || e.status || m) + '). Yeniden dene.';
};

// msg: formun altında gösterilecek ilk not. yeniden: giriş yapılmış ama kayıt indirilemedi; yalnız yeniden deneme ekranı
function ekran(msg = '', yeniden = 0) {
  return new Promise(res => {
    let kayit = false;
    const el = document.createElement('div');
    el.id = 'giris';
    if (yeniden) {
      el.innerHTML = sahne() + `<div class=gk><h1>Kara Koru</h1><p class=gnot role=status>${msg}</p><button class="act gbt" type=button>${yeniden == 2 ? 'Burada oyna' : 'Yeniden dene'}</button>${yeniden == 2 ? '' : '<button class=glink type=button>Başka hesapla gir</button>'}</div>`;
      document.body.appendChild(el);
      const bt = /** @type {HTMLButtonElement} */ (el.querySelector('.gbt'));
      bt.focus();
      bt.addEventListener('click', () => {
        // devralma: öbür sekme imzayı görünce yeniden yüklenir ve bekler
        if (yeniden == 2) ls(ETKIN, JSON.stringify({ id: SEKME, t: Date.now() }));
        el.remove();
        res(null);
      });
      if (yeniden == 2) return;
      el.querySelector('.glink').addEventListener('click', () => {
        OT = null;
        ls(OTURUM, null);
        el.remove();
        res(null);
      });
      return;
    }
    el.innerHTML = sahne() + `<form class=gk novalidate>
 <p class=ins aria-hidden=true>𐱅𐰭𐰼𐰃⁚𐰴𐰺𐰀⁚𐱅𐰇𐰼𐰜</p><h1>Kara Koru</h1>
 <div class=gsek role=tablist><button type=button role=tab data-m=g class=on aria-selected=true>Giriş yap</button><button type=button role=tab data-m=k aria-selected=false>Kayıt ol</button></div>
 <label>Kullanıcı adı<input name=ad autocomplete=username maxlength=15 spellcheck=false autocapitalize=off required></label>
 <label>Şifre<input name=s type=password autocomplete=current-password minlength=6 maxlength=72 required></label>
 <label class=k2 hidden>Şifre (tekrar)<input name=s2 type=password autocomplete=new-password minlength=6 maxlength=72></label>
 <p class=gnot role=status aria-live=polite></p>
 <button class="act gbt" type=submit>Giriş yap</button>
 <p class=gip>Kullanıcı adı 3–15 harf, rakam ya da _ olabilir. Şifreni unutursan geri alınamaz; bir yere not et. İlerlemen, rekorların ve ayarların hesabında saklanır.</p>
</form>`;
    document.body.appendChild(el);
    const f = /** @type {HTMLFormElement} */ (el.querySelector('form')),
      inAd = /** @type {HTMLInputElement} */ (f.elements.namedItem('ad')),
      inS = /** @type {HTMLInputElement} */ (f.elements.namedItem('s')),
      inS2 = /** @type {HTMLInputElement} */ (f.elements.namedItem('s2')),
      not = el.querySelector('.gnot'),
      bt = /** @type {HTMLButtonElement} */ (el.querySelector('.gbt'));
    const mod = k => {
      kayit = k;
      el.querySelectorAll('.gsek button').forEach(b => {
        const on = (b.getAttribute('data-m') == 'k') == k;
        b.classList.toggle('on', on);
        b.setAttribute('aria-selected', String(on));
      });
      /** @type {HTMLElement} */ (el.querySelector('.k2')).hidden = !k;
      inS.autocomplete = k ? 'new-password' : 'current-password';
      bt.textContent = k ? 'Kayıt ol' : 'Giriş yap';
      not.textContent = '';
    };
    el.querySelectorAll('.gsek button').forEach(b => b.addEventListener('click', () => mod(b.getAttribute('data-m') == 'k')));
    f.addEventListener('submit', async ev => {
      ev.preventDefault();
      const ad = inAd.value.trim(),
        s = inS.value;
      if (!AD_RE.test(ad)) return (not.textContent = 'Kullanıcı adı 3–15 karakter olmalı; harf, rakam ve _ kullanılabilir.');
      if (s.length < 6) return (not.textContent = 'Şifre en az 6 karakter olmalı.');
      if (kayit && s != inS2.value) return (not.textContent = 'Şifreler aynı değil.');
      bt.disabled = true;
      not.textContent = kayit ? 'Hesap açılıyor…' : 'Giriş yapılıyor…';
      try {
        const e = adEposta(ad);
        const j = kayit ? await authReq('signup', { email: e, password: s, data: { ad } }) : await authReq('token?grant_type=password', { email: e, password: s });
        if (!j || !j.access_token) throw Object.assign(new Error('dogrulama'), { code: 'email_not_confirmed' });
        oturumYaz(j);
        if (!OT.ad) OT.ad = ad;
        not.textContent = 'Kayıt indiriliyor…';
        el.remove();
        res(null);
      } catch (e) {
        not.textContent = hata(e);
        bt.disabled = false;
      }
    });
    not.textContent = msg;
    inAd.focus();
  });
}

// oyun yüklenmeden önce çağrılır: giriş yapılıp kayıt indirilene kadar bekler
export async function hesapKapisi() {
  if (!supaOn) return;
  // aynı tarayıcıda oyun başka sekmede açıksa burada yüklenmez (kayıt indirilmeden önce: etkin sekmenin kaydını ezmesin)
  while (baskaEtkin()) await ekran('Oyun bu tarayıcıda başka bir sekmede açık. Kaydın karışmaması için aynı anda tek sekmede oynanır.', 2);
  // kilit kayıt indirilmeden alınır: aynı anda açılan iki sekmeden yalnız biri kaydı yazar, öbürü yeniden yüklenip bekler
  etkinOl();
  OT = jget(OTURUM);
  if (OT && !(OT.at && OT.rt && OT.id)) OT = null;
  if (OT) {
    try {
      await belirtec(); // reddedilirse OT null olur; ağ hatasında önbellekle devam
    } catch (e) {}
  }
  sekmeDinle();
  let msg = '';
  for (;;) {
    if (!OT) await ekran(msg);
    try {
      await esitle();
      break;
    } catch (e) {
      if (e.sekme) return sekmeDegisti(), new Promise(() => {});
      if (e.depo) {
        await ekran('Hesabın kaydı bu tarayıcıya yazılamadı (depolama dolu ya da kapalı). Yer açıp yeniden dene.', 1);
        continue;
      }
      if (e.ag) {
        // ilk indirme olmadan oyun açılmaz (yoksa boş kayıt hesabın üstüne yazılabilirdi); oturum korunur, yeniden denenir
        await ekran('Hesabın kaydı indirilemedi. Bağlantını kontrol edip yeniden dene.', 1);
        continue;
      }
      // oturum eşitleme sırasında geçersizleşti: yeniden giriş
      OT = null;
      ls(OTURUM, null);
      msg = 'Oturumun sona erdi. Yeniden giriş yap.';
    }
  }
  if (!etkinMi()) return sekmeDegisti(), new Promise(() => {});
  acik = true;
  otoKayit();
}
