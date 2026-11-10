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

// ---- hafta: Pazartesi 00:00, Türkiye saati (UTC+3, yaz saati yok). Sunucudaki kk_bu_hafta() ile aynı hesap.
const TR = 3 * 3600e3, GUN = 864e5;
export function haftaBasi(ms = Date.now()) {
  const d = new Date(ms + TR);
  d.setUTCDate(d.getUTCDate() - (d.getUTCDay() + 6) % 7);
  return d.toISOString().slice(0, 10);
}
// haftanın bittiği an (ms); h verilmezse bu hafta
export function haftaSonu(h = haftaBasi()) {
  return Date.parse(h + 'T00:00:00Z') - TR + 7 * GUN;
}
export const gecenHafta = () => haftaBasi(Date.now() - 7 * GUN);

// tablo: tüm zamanlar (kk_skor) ya da verilen haftanın satırları (kk_hafta). Eşit skorda önce ulaşan üstte.
const SEL = 'select=id,ad,k,c,s,t,lv,at,ch',
  yol = hf => hf ? '/rest/v1/kk_hafta?' + SEL + '&hafta=eq.' + hf : '/rest/v1/kk_skor?' + SEL;

// en iyi n satır (en çok 200)
export async function supaRows(hf, n = 200) {
  const a = await supaReq(yol(hf) + '&order=k.desc,at.asc&limit=' + n);
  return (Array.isArray(a) ? a : []).filter(r => r && typeof r.id == 'string').map(row);
}

// oyuncunun kendi satırı (ilk 200'ün dışında olabilir). Okuma hatası fırlatır; satır yoksa null.
export async function supaMine(hf) {
  const w = who();
  if (!w) return null;
  const a = await supaReq(yol(hf) + '&id=eq.' + encodeURIComponent(w.id) + '&limit=1');
  return Array.isArray(a) && a[0] ? row(a[0]) : null;
}

// satır sayısı (k verilirse ondan yüksek skorlu satırlar): yarışan oyuncu sayısı ve ilk 200 dışındaki sıra için
export async function supaCount(hf, k) {
  const ctl = typeof AbortController != 'undefined' ? new AbortController() : null,
    to = ctl ? setTimeout(() => ctl.abort(), 10000) : 0;
  try {
    const r = await fetch(BASE + (hf ? '/rest/v1/kk_hafta?select=id&hafta=eq.' + hf : '/rest/v1/kk_skor?select=id') + (k != null ? '&k=gt.' + (k | 0) : ''), {
      method: 'HEAD',
      headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, Prefer: 'count=exact', Range: '0-0' },
      signal: ctl ? ctl.signal : undefined
    });
    const m = /\/(\d+)$/.exec(r.headers.get('content-range') || '');
    return m ? +m[1] : null;
  } catch (e) {
    return null;
  } finally {
    if (to) clearTimeout(to);
  }
}

// ---- koşu belirteci: skor ancak sunucunun başlattığı bir koşuya yazılır (supabase/siralama.sql kk_kosu_basla / kk_kosu_bitir).
// Sunucu belirteci verdiği andan beri geçen gerçek süreye bakar: o sürede mümkün olandan fazla öldürme kabul edilmez,
// belirteç tek kullanımlıktır. İstemci yalnız biten koşunun kendi sonucunu gönderir; birleştirmeyi (en iyi, kahraman başına,
// haftalık) sunucu yapar. Böylece tabloya elle uydurulmuş bir "en iyi" yazılamaz.
export async function supaKosu() {
  const tok = await token();
  if (!tok) throw new Error('oturum yok');
  const id = await supaReq('/rest/v1/rpc/kk_kosu_basla', { method: 'POST', body: '{}' }, tok);
  if (typeof id != 'string') throw new Error('belirtec yok');
  return id;
}

// ---- giden kutusu: bitmiş ama henüz sunucuya yazılmamış koşular (en çok 5). Her biri kendi belirteciyle gönderilir.
// Kutu hesabın kaydına girer (ui/hesap.js), çıkışta temizlenir. Eski biçim (tek birleşik kayıt) atılır: belirteçsiz gönderilemez.
const OUT = 'kk_lbpend';
// outFail: son yazım başarısızsa (kota, engelli depolama) bellekteki kopya geçerlidir, diskteki eski değer okunmaz
let outMem = [], outFail = false, chain = Promise.resolve(), timer = 0;

function outGet() {
  let o = outMem;
  if (!outFail) {
    try {
      const t = localStorage.getItem(OUT);
      o = t ? JSON.parse(t) : []; // başka sekmenin yazdığı da görülür
    } catch (e) {
      o = outMem;
    }
  }
  return (Array.isArray(o) ? o : []).filter(r => r && typeof r.kosu == 'string' && typeof r.k == 'number').slice(-5);
}

function outSet(o) {
  outMem = o;
  try {
    if (o.length) localStorage.setItem(OUT, JSON.stringify(o));
    else localStorage.removeItem(OUT);
    outFail = false;
  } catch (e) {
    outFail = true;
  }
}

// koşu sonu: koşuyu belirteciyle kutuya ekler ve göndermeyi dener. Belirteç yoksa (koşu boyunca sunucuya ulaşılamadı)
// koşu yalnız bu cihazın rekorlarında kalır.
export function supaRecord(r, onSent) {
  if (typeof r.kosu != 'string' || !r.kosu) return chain;
  const o = outGet();
  o.push({ kosu: r.kosu, k: num(r.k, 1e7), c: num(r.c, 63), s: num(r.s, 20), t: num(r.t, 86400), lv: num(r.lv, 1e5) });
  outSet(o.slice(-5));
  return supaFlush(onSent);
}

// kutudakileri gönderir. allow(): yükleme izni (ayar); kapalıysa kutu silinir, hiçbir şey gönderilmez.
let allow = () => true;
export function supaAllow(f) {
  allow = f;
}

export function supaFlush(onSent) {
  chain = chain.then(async () => {
    let sent = 0;
    for (;;) {
      const o = outGet();
      if (!o.length || !who()) break;
      if (!allow()) return outSet([]);
      const r = o[0],
        tok = await token();
      if (!tok) break;
      try {
        await supaReq('/rest/v1/rpc/kk_kosu_bitir', {
          method: 'POST',
          body: JSON.stringify({ p_kosu: r.kosu, p_k: r.k, p_c: r.c, p_s: r.s, p_t: r.t, p_lv: r.lv })
        }, tok);
        sent++;
      } catch (e) {
        // kalıcı ret (belirteç geçersiz ya da kullanılmış, skor olanaksız, hesap yasaklı): kayıt atılır. Ağ, hız sınırı ya da
        // sunucu hatası: sonra yeniden denenir.
        const st = /** @type {any} */ (e).status;
        if (!(st >= 400 && st < 500 && st != 401 && st != 408 && st != 429)) {
          later(onSent, 20000);
          break;
        }
      }
      outSet(outGet().filter(x => x.kosu != r.kosu));
    }
    if (sent && onSent) onSent();
  }).catch(() => {});
  return chain;
}

function later(onSent, ms) {
  clearTimeout(timer);
  timer = setTimeout(() => supaFlush(onSent), ms);
}
