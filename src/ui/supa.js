// ui/supa.js · Kara Koru
// Claude dışında ortak sıralama: Supabase REST (PostgREST). Paket kullanmaz, fetch ile iki uç: tablo okuma ve kk_skor_gonder.
// Adres ve anahtar derleme anında gelir (.env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY); yoksa ortak sıralama ve hesaplar kapalı kalır.
// Şema ve güvenlik kuralları: supabase/siralama.sql. Anahtar herkese açık olacak biçimde tasarlandı; yazma giriş yapmış
// oyuncunun kendi satırına, sunucudaki fonksiyonla olur. Oturum ui/hesap.js'te; buraya supaAuth ile bağlanır.

const URL0 = (import.meta.env && import.meta.env.VITE_SUPABASE_URL) || '',
  KEY = (import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || '',
  BASE = String(URL0).replace(/\/+$/, '');

export const supaOn = !!(BASE && KEY && /^(https:\/\/|http:\/\/(localhost|127\.0\.0\.1)[:/])/.test(BASE + "/"));
export const supaCfg = { base: BASE, key: KEY };

// oturum sağlayıcı (ui/hesap.js): { id, ad } ve geçerli erişim belirteci
let who = () => null,
  token = async () => null;
export function supaAuth(w, t) {
  who = w;
  token = t;
}

// tok verilirse oyuncunun belirteciyle (Authorization), yoksa yalnız herkese açık anahtarla
export async function supaReq(path, opt = {}, tok = null) {
  const ctl = typeof AbortController != 'undefined' ? new AbortController() : null,
    to = ctl ? setTimeout(() => ctl.abort(), 10000) : 0;
  try {
    const r = await fetch(BASE + path, {
      ...opt,
      keepalive: !!opt.keepalive,
      headers: { apikey: KEY, Authorization: 'Bearer ' + (tok || KEY), 'Content-Type': 'application/json' },
      signal: ctl ? ctl.signal : undefined
    });
    const t = await r.text();
    let j = null;
    try {
      j = t ? JSON.parse(t) : null;
    } catch (e) {}
    if (!r.ok) {
      const e = /** @type {any} */ (new Error('supabase ' + r.status + (j && j.message ? ' ' + j.message : '')));
      e.status = r.status;
      e.code = j && j.code;
      throw e;
    }
    return j;
  } finally {
    if (to) clearTimeout(to);
  }
}

const rnd = n => {
  const a = new Uint8Array(n);
  crypto.getRandomValues(a);
  return [...a].map(b => b.toString(16).padStart(2, '0')).join('');
};

// oyuncunun kimliği ve adı (hesap); giriş yoksa null
export function supaIdent() {
  return who();
}

export function supaName() {
  const w = who();
  return w ? w.ad : '';
}

const num = (v, mx) => (typeof v == 'number' && isFinite(v) ? Math.max(0, Math.min(mx, Math.floor(v))) : 0);

// kahraman başına rekorlar: yalnız 0-63 anahtarlı, sayısal k/s/t alanlı girdiler kalır (bozuk satır arayüzü kırmasın)
export function cleanCh(ch) {
  const o = {};
  if (!ch || typeof ch != 'object' || Array.isArray(ch)) return o;
  for (const c of Object.keys(ch)) {
    const x = ch[c];
    if (!/^\d{1,2}$/.test(c) || +c > 63 || !x || typeof x != 'object' || typeof x.k != 'number' || !isFinite(x.k)) continue;
    o[c] = { k: num(x.k, 1e7), s: num(x.s, 20), t: num(x.t, 86400) };
  }
  return o;
}

const row = r => ({ id: r.id, ad: typeof r.ad == 'string' ? r.ad.slice(0, 20) : '', k: num(r.k, 1e7), c: num(r.c, 63), s: num(r.s, 20), t: num(r.t, 86400), lv: num(r.lv, 1e5), at: Date.parse(r.at) || 0, ch: cleanCh(r.ch) });

// en iyi 200 satır
export async function supaRows() {
  const a = await supaReq('/rest/v1/kk_skor?select=id,ad,k,c,s,t,lv,at,ch&order=k.desc&limit=200');
  return (Array.isArray(a) ? a : []).filter(r => r && typeof r.id == 'string').map(row);
}

// oyuncunun kendi satırı (ilk 200'ün dışında olabilir). Okuma hatası fırlatır; satır yoksa null.
export async function supaMine() {
  const w = who();
  if (!w) return null;
  const a = await supaReq('/rest/v1/kk_skor?select=id,ad,k,c,s,t,lv,at,ch&id=eq.' + encodeURIComponent(w.id) + '&limit=1');
  return Array.isArray(a) && a[0] ? row(a[0]) : null;
}

async function submit(doc) {
  const tok = await token();
  if (!tok) throw new Error('oturum yok');
  await supaReq('/rest/v1/rpc/kk_skor_gonder', {
    method: 'POST',
    body: JSON.stringify({ p_k: doc.k, p_c: doc.c, p_s: doc.s, p_t: doc.t, p_lv: doc.lv, p_ch: doc.ch })
  }, tok);
}

// ---- giden kutusu: henüz sunucuda olmayan rekorlar. Genel en iyi ve kahraman başına en iyi birlikte tutulur;
// her gönderimde sunucudaki güncel satırla birleştirilir, böylece hiçbir rekor başka bir gönderimle silinmez.
// Gönderimler sekme içinde sıralıdır; kutu yalnız gönderilen sürüm (rev) değişmediyse boşaltılır.
// Kutu hesabın kaydına girer (ui/hesap.js), çıkışta temizlenir.
const OUT = 'kk_lbpend';
// outFail: son yazım başarısızsa (kota, engelli depolama) bellekteki kopya geçerlidir, diskteki eski değer okunmaz
let outMem = null, outFail = false, chain = Promise.resolve(), timer = 0;

function outGet() {
  let o = outMem;
  if (!outFail) {
    try {
      const t = localStorage.getItem(OUT);
      o = t ? JSON.parse(t) : null; // başka sekmenin yazdığı da görülür
    } catch (e) {
      o = outMem;
    }
  }
  return o && typeof o == 'object' ? { ...o, ch: cleanCh(o.ch) } : null;
}

function outSet(o) {
  outMem = o;
  try {
    if (o) localStorage.setItem(OUT, JSON.stringify(o));
    else localStorage.removeItem(OUT);
    outFail = false;
  } catch (e) {
    outFail = true;
  }
}

// sürüm belirteci: sekmeler arasında da benzersiz
const tok = () => Date.now().toString(36) + rnd(6);

// iki kaydı birleştirir: daha yüksek genel skorun alanları ve her kahraman için en yüksek rekor
function merge(a, b) {
  const base = !a ? b : !b ? a : b.k > a.k ? b : a,
    ch = { ...(a ? a.ch : {}) };
  if (b) for (const c in b.ch) if (!ch[c] || b.ch[c].k > ch[c].k) ch[c] = b.ch[c];
  return { k: base.k, c: base.c, s: base.s, t: base.t, lv: base.lv, ch };
}

const same = (a, b) => a && b && a.k == b.k && JSON.stringify(Object.entries(a.ch).sort()) == JSON.stringify(Object.entries(b.ch).sort());

// koşu sonu: rekoru kutuya ekler ve göndermeyi dener
export function supaRecord(r, onSent) {
  const run = { k: num(r.k, 1e7), c: num(r.c, 63), s: num(r.s, 20), t: num(r.t, 86400), lv: num(r.lv, 1e5), ch: { [num(r.c, 63)]: { k: num(r.k, 1e7), s: num(r.s, 20), t: num(r.t, 86400) } } };
  outSet({ ...merge(outGet(), run), rev: tok() });
  return supaFlush(onSent);
}

// kutudakini gönderir. allow(): yükleme izni (ayar); kapalıysa kutu silinir, hiçbir şey gönderilmez.
let allow = () => true;
export function supaAllow(f) {
  allow = f;
}

export function supaFlush(onSent) {
  chain = chain.then(async () => {
    const o = outGet();
    if (!o || !who()) return;
    if (!allow()) return outSet(null);
    let srv;
    try {
      srv = await supaMine();
    } catch (e) {
      return later(onSent, 20000); // sunucudaki satır okunamadan gönderilmez (rekorlar silinmesin)
    }
    if (!allow()) return outSet(null); // okuma sürerken yükleme kapatıldıysa gönderme
    const doc = merge(srv, o);
    if (srv && same(doc, srv)) return dropIf(o.rev);
    try {
      await submit(doc);
    } catch (e) {
      return later(onSent, 16000); // 15 sn sınırı ya da ağ: sonra yeniden
    }
    dropIf(o.rev);
    if (onSent) onSent();
  }).catch(() => {});
  return chain;
}

// kutu yalnız gönderilen sürüm hâlâ oradaysa boşaltılır; arada yeni rekor geldiyse o kalır
function dropIf(rev) {
  const o = outGet();
  if (o && o.rev == rev) outSet(null);
}

function later(onSent, ms) {
  clearTimeout(timer);
  timer = setTimeout(() => supaFlush(onSent), ms);
}
