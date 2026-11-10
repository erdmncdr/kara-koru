// yonetim/yonetim.js · Kara Koru yönetim paneli ("Kurultay")
// Ayrı sayfa ve ayrı paket (yonetim.html); oyunun paketine girmez. Yönetici kendi oyun hesabıyla giriş yapar; her işlem
// sunucudaki kk_y_* işlevleriyle yapılır ve yetkiye orada bakılır (supabase/liveops.sql). Bu sayfada gizli anahtar yok:
// yönetici olmayan biri sayfayı açıp giriş yapsa da hiçbir şey okuyamaz.
// Oturum yalnız bu sekmede tutulur (sessionStorage) ve oyunun oturumundan ayrıdır.
import './yonetim.css';
import { CARPANLAR, GRUPLAR, SEMA, semaDeger } from '../data/ayar-sema.js';
import { BOSSP, KINDS } from '../data/enemies.js';
import { G1, G2, cizgi, cubuk, sayi, yatay } from './grafik.js';

const BASE = String((import.meta.env && import.meta.env.VITE_SUPABASE_URL) || '').replace(/\/+$/, ''),
  KEY = (import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || '';
const $ = id => document.getElementById(id);
const esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const KAHRAMAN = { 0: 'Alp', 1: 'Kam', 2: 'Gölge', 3: 'Bahadır', 8: 'Kemik', 16: 'Anka', 17: 'Çalı', 18: 'Tulpar' };
const kahraman = c => KAHRAMAN[c] || 'Kahraman ' + c;
const SAYFALAR = [['genel', 'Genel bakış'], ['denge', 'Denge'], ['etkinlik', 'Etkinlikler'], ['oyuncu', 'Oyuncular'], ['kosu', 'Koşular'], ['sezon', 'Sezon'], ['sistem', 'Sistem']];
const ASAMA = ['Kara Koru', 'Kızıl Bozkır', 'Mühürlü Mahzen', 'Bitirdi'];

// ---- biçim
const sure = t => (t >= 3600 ? Math.floor(t / 3600) + ' sa ' : '') + Math.floor(t % 3600 / 60) + ' dk' + (t < 3600 ? ' ' + String(Math.floor(t % 60)).padStart(2, '0') + ' sn' : '');
const tamTarih = iso => new Date(iso).toLocaleString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
function once(iso) {
  if (!iso) return 'hiç';
  const s = (Date.now() - Date.parse(iso)) / 1000;
  if (s < 0) { const k = -s; return k < 3600 ? Math.ceil(k / 60) + ' dk sonra' : k < 86400 ? Math.round(k / 3600) + ' sa sonra' : Math.round(k / 86400) + ' gün sonra'; }
  return s < 90 ? 'az önce' : s < 3600 ? Math.floor(s / 60) + ' dk önce' : s < 86400 ? Math.floor(s / 3600) + ' sa önce' : Math.floor(s / 86400) + ' gün önce';
}
const zaman = iso => `<span title="${esc(tamTarih(iso))}">${once(iso)}</span>`;
const ondalik = (v, adim) => v.toLocaleString('tr-TR', { maximumFractionDigits: adim < .01 ? 3 : adim < 1 ? 2 : 0 });
function nedenAd(nd) {
  if (!nd) return 'Bilinmiyor';
  if (nd == 'dusme') return 'Düşme';
  if (nd == 'cevre') return 'Çevre (ateş, tuzak, zehir)';
  const m = /^(boss|ara):(.*)$/.exec(nd), k = m ? m[2] : nd;
  let ad = (KINDS[k] && KINDS[k].n) || '';
  if (!ad) for (const l of Object.values(BOSSP)) for (const b of l) if (b.k == k) ad = ad || b.n;
  return (ad || k) + (m ? (m[1] == 'boss' ? ' (boss)' : ' (ara boss)') : '');
}

// ---- oturum ve istekler
const adEposta = ad => 'u' + [...new TextEncoder().encode(String(ad).toLocaleLowerCase('tr-TR'))].map(x => x.toString(16).padStart(2, '0')).join('') + '@oyuncu.kara-koru.app';
let OT = null;
try { OT = JSON.parse(sessionStorage.getItem('kk_yon') || 'null'); } catch (e) {}
const otYaz = j => {
  OT = j ? { at: j.access_token, rt: j.refresh_token, id: j.user.id, ad: (j.user.user_metadata || {}).ad || (OT && OT.ad) || '' } : null;
  try { OT ? sessionStorage.setItem('kk_yon', JSON.stringify(OT)) : sessionStorage.removeItem('kk_yon'); } catch (e) {}
};
async function ham(yol, opt = {}, tok = null) {
  let r;
  try {
    r = await fetch(BASE + yol, { ...opt, headers: { apikey: KEY, Authorization: 'Bearer ' + (tok || KEY), 'Content-Type': 'application/json', ...(opt.headers || {}) } });
  } catch (e) {
    throw Object.assign(new Error('Sunucuya ulaşılamadı. Bağlantını denetle.'), { ag: 1 });
  }
  const t = await r.text();
  let j = null;
  try { j = t ? JSON.parse(t) : null; } catch (e) {}
  if (!r.ok) throw Object.assign(new Error((j && (j.message || j.msg || j.error_description)) || 'Hata ' + r.status), { status: r.status, code: (j && (j.code || j.error_code)) || '' });
  return j;
}
// oturumlu istek: belirteç eskidiyse bir kez yenilenir
async function istek(yol, opt = {}) {
  try {
    return await ham(yol, opt, OT && OT.at);
  } catch (e) {
    if (e.status != 401 || !OT || !OT.rt) throw e;
    try {
      otYaz(await ham('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: JSON.stringify({ refresh_token: OT.rt }) }));
    } catch (x) {
      otYaz(null);
      ciz();
      throw new Error('Oturum süresi doldu, yeniden giriş yap.');
    }
    return ham(yol, opt, OT.at);
  }
}
const rpc = (ad, govde = {}) => istek('/rest/v1/rpc/' + ad, { method: 'POST', body: JSON.stringify(govde) });
const hataMetni = e => (e && e.code == '42501' ? 'Bu hesabın yönetici yetkisi yok.' : (e && e.message) || 'Bilinmeyen hata');

// ---- durum
const VARS = Object.fromEntries(SEMA.map(s => [s.id, s.vars]));
const D = {
  sayfa: 'genel', yonetici: false, hazir: false, hata: '', girisHata: '', bekle: false,
  gun: 14, ozet: null,
  yayin: { ...VARS }, taslak: { ...VARS }, gecmis: [], ayar: {},
  etkinlikler: null, duzen: null,
  oyuncular: null, ara: '', sira: 'son', secili: null, seciliKosu: null,
  kosular: null, filtre: 'hepsi', acikKosu: 0,
  sezon: null, gunluk: null
};
const degisen = () => SEMA.filter(s => D.taslak[s.id] !== D.yayin[s.id]);

function bildir(metin, kotu) {
  const d = document.createElement('div');
  d.textContent = metin;
  if (kotu) d.className = 'kotu';
  $('bildirim').appendChild(d);
  setTimeout(() => d.remove(), kotu ? 5000 : 2600);
}

// onay penceresi. yaz: bu sözcük yazılmadan onay düğmesi açılmaz. girdi: { etiket, deger } serbest metin. Dönüş: false ya da { girdi }
function sor({ baslik, metin = '', liste = [], onay = 'Tamam', tur = 'altin', yaz = '', girdi = null }) {
  return new Promise(res => {
    const dg = document.createElement('dialog');
    dg.innerHTML = `<form method="dialog"><h2>${esc(baslik)}</h2>${metin ? `<p>${esc(metin)}</p>` : ''}${liste.length ? `<ul>${liste.map(l => `<li><span>${esc(l[0])}</span><b>${l[1]}</b></li>`).join('')}</ul>` : ''}
${girdi ? `<label class="al">${esc(girdi.etiket)}<input class="girdi" name="g" value="${esc(girdi.deger || '')}" maxlength="300"></label>` : ''}
${yaz ? `<label class="al" style="margin-top:12px">Onaylamak için ${esc(yaz)} yaz<input class="girdi" name="y" autocomplete="off"></label>` : ''}
<div class="alt"><button class="dgm duz" value="hayir">Vazgeç</button><button class="dgm ${tur}" value="evet"${yaz ? ' disabled' : ''}>${esc(onay)}</button></div></form>`;
    document.body.appendChild(dg);
    const f = /** @type {any} */ (dg.querySelector('form')), ev = /** @type {HTMLButtonElement} */ (dg.querySelector('[value=evet]'));
    if (yaz) f.y.addEventListener('input', () => { ev.disabled = f.y.value.trim() != yaz; });
    dg.addEventListener('close', () => { const r = dg.returnValue == 'evet' ? { girdi: girdi ? f.g.value.trim() : '' } : false; dg.remove(); res(r); });
    dg.showModal();
  });
}

// ---- veri yükleme
async function yukle(sayfa = D.sayfa) {
  D.hata = '';
  try {
    if (sayfa == 'genel') D.ozet = await rpc('kk_y_ozet', { p_gun: D.gun });
    else if (sayfa == 'denge' || sayfa == 'sistem') {
      const [a, g, l] = await Promise.all([istek('/rest/v1/kk_ayar?select=anahtar,deger,guncel'), rpc('kk_y_ayar_gecmis', { p_limit: 30 }), sayfa == 'sistem' ? rpc('kk_y_gunluk_oku', { p_limit: 80 }) : null]);
      D.ayar = Object.fromEntries((a || []).map(r => [r.anahtar, r.deger]));
      const kirli = degisen().length; // yayınlanmamış taslak varsa korunur
      D.yayin = Object.fromEntries(SEMA.map(s => [s.id, semaDeger(s, (D.ayar.denge || {})[s.id])]));
      if (!kirli) D.taslak = { ...D.yayin };
      D.gecmis = g || [];
      if (l) D.gunluk = l;
    } else if (sayfa == 'etkinlik') D.etkinlikler = await rpc('kk_y_etkinlikler');
    else if (sayfa == 'oyuncu') D.oyuncular = await rpc('kk_y_oyuncular', { p_ara: D.ara, p_sira: D.sira, p_limit: 100 });
    else if (sayfa == 'kosu') D.kosular = await rpc('kk_y_kosular', { p_hesap: null, p_filtre: D.filtre, p_limit: 120 });
    else if (sayfa == 'sezon') D.sezon = await rpc('kk_y_sezonlar');
  } catch (e) {
    D.hata = hataMetni(e);
  }
}
async function git(sayfa) {
  D.sayfa = sayfa;
  D.secili = null;
  D.duzen = null;
  ciz();
  await yukle();
  ciz();
  window.scrollTo(0, 0);
}

// ---- sayfalar
const basHTML = (ad, metin, sag = '') => `<div class="bas"><h1>${ad}</h1><p>${metin}</p>${sag ? `<div class="sag">${sag}</div>` : ''}</div>`;
const secHTML = (act, deger, secenek) => `<div class="sec" role="group">${secenek.map(([k, ad]) => `<button data-a="${act}" data-d="${k}" aria-pressed="${String(k) == String(deger)}">${ad}</button>`).join('')}</div>`;

function genelHTML() {
  const o = D.ozet;
  if (!o) return basHTML('Genel bakış', 'Oyunun nabzı.') + '<div class="bos">Yükleniyor…</div>';
  const gk = g => new Date(g + 'T12:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  const kosuTop = o.kahraman.reduce((a, k) => a + k.kosu, 0) || 1, enK = Math.max(1, ...o.kahraman.map(k => k.kosu));
  const asama = [0, 1, 2, 3].map(s => ({ e: ASAMA[s], d: (o.asama.find(a => a.s == s) || { n: 0 }).n, renk: s == 3 ? G2 : G1 }));
  return basHTML('Genel bakış', `Son ${o.gun} günün koşu kayıtlarından. Reddedilen koşular dağılımlara girmez.`, secHTML('gun', D.gun, [[7, '7 gün'], [14, '14 gün'], [30, '30 gün']]))
    + `<div class="izg">
<div class="kutu nabiz">
  <div><b>${sayi(o.kosu_24)}</b><span>koşu</span><small>son 24 saat</small></div>
  <div><b>${sayi(o.oyuncu_24)}</b><span>oyuncu</span><small>son 24 saat</small></div>
  <div><b>${sayi(o.oyuncu_7)}</b><span>oyuncu</span><small>son 7 gün</small></div>
  <div><b>${sayi(o.hesap)}</b><span>hesap</span><small>${o.hesap_24 ? '+' + sayi(o.hesap_24) + ' son 24 saatte' : 'toplam'}</small></div>
  <div><b>${sure(o.sure).replace(/ \d+ sn$/, '')}</b><span>ortanca koşu süresi</span><small>son ${o.gun} gün</small></div>
  <div><b style="${o.ret ? 'color:var(--kor)' : ''}">${sayi(o.ret)}</b><span>reddedilen skor</span><small>${o.ret ? 'Koşular sayfasında incele' : 'şüpheli deneme yok'}</small></div>
</div>
<div class="izg iki">
  <div class="kutu"><h2>Günlük koşu</h2><p>Biten koşu sayısı (Türkiye saatiyle gün).</p>${cubuk(o.gunluk.map(g => ({ e: gk(g.gun), d: g.kosu, ip: gk(g.gun) + '\n' + sayi(g.kosu) + ' koşu' })), { ad: 'Günlük koşu sayısı' })}</div>
  <div class="kutu"><h2>Günlük oyuncu</h2><p>O gün en az bir koşu bitiren hesap; yeni kayıtlar ipucunda.</p>${cubuk(o.gunluk.map(g => ({ e: gk(g.gun), d: g.oyuncu, ip: gk(g.gun) + '\n' + sayi(g.oyuncu) + ' oyuncu\n' + sayi(g.yeni) + ' yeni hesap' })), { renk: G2, ad: 'Günlük oyuncu sayısı' })}</div>
</div>
<div class="kutu"><h2>Kahramanlar</h2><p>Hangi kahraman ne kadar oynanıyor ve ne kadar ileri gidiyor. Ortanca: koşuların yarısı bunun altında.</p>
  <div class="tk"><table class="tb"><thead><tr><th>Kahraman</th><th>Koşu</th><th class="s">Pay</th><th class="s">Ort. seviye</th><th class="s">Ortanca öldürme</th><th class="s">Ortanca süre</th><th class="s">Bitirme</th><th class="s">En yüksek skor</th><th class="s">En yüksek seviye</th></tr></thead><tbody>
  ${o.kahraman.map(k => `<tr><td><b>${esc(kahraman(k.c))}</b></td><td><i class="cb" style="width:${Math.max(3, k.kosu / enK * 120)}px"></i>${sayi(k.kosu)}</td><td class="s">%${Math.round(k.kosu / kosuTop * 100)}</td><td class="s">${sayi(k.lv)}</td><td class="s">${sayi(k.k)}</td><td class="s">${sure(k.t)}</td><td class="s">%${Math.round(k.zafer / Math.max(1, k.kosu) * 100)}</td><td class="s">${sayi(k.enk)}</td><td class="s">${sayi(k.enlv)}</td></tr>`).join('') || '<tr><td colspan="9" class="bos">Bu aralıkta koşu yok.</td></tr>'}
  </tbody></table></div></div>
<div class="izg uc">
  <div class="kutu"><h2>Koşu sonu seviyesi</h2><p>Koşular hangi seviyede bitiyor (onar seviyelik dilimler).</p>${cubuk(o.seviye.map(s => ({ e: String(s.b), d: s.n, ip: `Seviye ${s.b}–${s.b + 9}\n${sayi(s.n)} koşu` })), { yuk: 210, ad: 'Koşu sonu seviye dağılımı' })}</div>
  <div class="kutu"><h2>Koşular nerede bitiyor</h2><p>Koşunun bittiği aşama; son satır üç aşamayı da geçenler.</p>${yatay(asama)}</div>
  <div class="kutu"><h2>En çok öldürenler</h2><p>Ölümle biten koşularda son darbeyi vuran.</p>${o.neden.length ? yatay(o.neden.map(n => ({ e: nedenAd(n.nd), d: n.n }))) : '<div class="bos">Henüz ölüm nedeni kaydı yok.</div>'}</div>
</div>
<div class="izg iki">
  <div class="kutu"><h2>Kademeler</h2><p>Koşu sayısı; bitirme oranı satır sonunda.</p>${o.kademe.length ? `<ul class="ytl">${o.kademe.map(k => `<li><span class="ye">${k.kd ? 'Kademe ' + k.kd : 'Bilinmiyor'}</span><span class="yc"><i style="width:${Math.max(1.5, k.n / Math.max(1, ...o.kademe.map(x => x.n)) * 100)}%;background:${G1}"></i></span><b>${sayi(k.n)}</b><small>%${Math.round(k.zafer / Math.max(1, k.n) * 100)}</small></li>`).join('')}</ul>` : '<div class="bos">Kayıt yok.</div>'}</div>
  <div class="kutu"><h2>Platform</h2><p>Koşuların geldiği yer.</p>${o.plat.length ? yatay(o.plat.map(p => ({ e: p.p == 'ios' ? 'iOS' : p.p == 'web' ? 'Web' : 'Eski sürüm (bildirmiyor)', d: p.n, renk: p.p == 'ios' ? G2 : G1 }))) : '<div class="bos">Kayıt yok.</div>'}</div>
</div></div>`;
}

// ---- denge
const gerek = (l, kir, kat) => Math.floor((5 * l + .55 * l * l) * (l > kir ? Math.pow(kat, l - kir) : 1));
function egriHTML() {
  const N = 140, y = (kir, kat) => Array.from({ length: N }, (_, i) => gerek(i + 1, kir, kat));
  const a = y(D.yayin.sv_kir, D.yayin.sv_kat), b = y(D.taslak.sv_kir, D.taslak.sv_kat), fark = D.taslak.sv_kir !== D.yayin.sv_kir || D.taslak.sv_kat !== D.yayin.sv_kat;
  CZ.egri = { n: N, seriler: fark ? [['Taslak', b], ['Yayındaki', a]] : [['Yayındaki', a]], x: 'Seviye' };
  const ser = fark ? [{ ad: 'Yayındaki', renk: G2, kesik: 1, y: a }, { ad: 'Taslak', renk: G1, y: b }] : [{ ad: 'Yayındaki', renk: G2, y: a }];
  return cizgi(ser, { xAd: 'seviye', ad: 'Seviye başına gereken tecrübe', id: 'egri' })
    + `<div class="ref">${[60, 100, 140].map(l => `<div><span>${l}. seviye için</span><b>${sayi(b[l - 1])}</b><s>${fark && a[l - 1] != b[l - 1] ? sayi(a[l - 1]) : ''}</s></div>`).join('')}</div>`;
}
const ayrHTML = s => {
  const v = D.taslak[s.id], deg = v !== D.yayin[s.id];
  return `<div class="ayr${deg ? ' deg' : ''}" id="ayr_${s.id}"><span class="ad">${esc(s.ad)}${deg ? '<i title="Yayınlanmamış değişiklik"></i>' : ''}</span>
<input type="range" min="${s.min}" max="${s.max}" step="${s.adim}" value="${v}" data-ay="${s.id}" aria-label="${esc(s.ad)}">
<input type="number" class="girdi" min="${s.min}" max="${s.max}" step="${s.adim}" value="${v}" data-ay="${s.id}" aria-label="${esc(s.ad)} (${esc(s.birim)})">
${s.acik ? `<p>${esc(s.acik)}</p>` : '<p></p>'}<span class="kod">${v !== s.vars ? `koddaki değer ${ondalik(s.vars, s.adim)} · <button data-a="kod" data-d="${s.id}">geri al</button>` : 'koddaki değerde'}</span></div>`;
};
function yayinHTML() {
  const d = degisen();
  return d.length ? `<div class="yayin"><b>${d.length} değişiklik</b><span>${d.map(s => esc(s.ad)).join(', ')}</span><button class="dgm duz" data-a="vazgec">Vazgeç</button><button class="dgm altin" data-a="yayinla">Yayınla</button></div>` : '';
}
function gecmisHTML() {
  const g = D.gecmis.filter(x => x.anahtar == 'denge').slice(0, 8);
  if (!g.length) return '<div class="bos">Henüz yayınlanmış değişiklik yok; oyun koddaki değerlerle çalışıyor.</div>';
  return `<ul class="gcm">${g.map((x, i) => {
    const e = x.eski || {}, y = x.yeni || {}, f = SEMA.filter(s => semaDeger(s, e[s.id]) !== semaDeger(s, y[s.id]));
    return `<li><b>${f.length ? f.map(s => `${esc(s.ad)} ${ondalik(semaDeger(s, e[s.id]), s.adim)} → ${ondalik(semaDeger(s, y[s.id]), s.adim)}`).join(', ') : 'Değişiklik yok'}</b><small>${esc(x.ad)} · ${once(x.at)}</small>${i ? `<button class="dgm kck" data-a="don" data-d="${x.id}">Bu ayara dön</button>` : '<span class="rozet iyi">yayında</span>'}</li>`;
  }).join('')}</ul>`;
}
function dengeHTML() {
  return basHTML('Denge', 'Oyunun sayıları. Yayınladığın değer web ve iOS’ta aynı anda geçerli olur; oyuncu oyunu yeniden açtığında görür. Yayın ya da mağaza onayı gerekmez.',
    `<button class="dgm" data-a="kodadon"${SEMA.every(s => D.taslak[s.id] === s.vars) ? ' disabled' : ''}>Hepsini koddaki değere al</button>`)
    + `<div class="dng"><div>${GRUPLAR.map(g => `<section class="kutu grup"><h2>${esc(g.ad)}</h2><p>${esc(g.acik)}</p>${SEMA.filter(s => s.grup == g.k).map(ayrHTML).join('')}</section>`).join('')}</div>
<div class="yap"><div class="kutu"><h2>Seviye eğrisi</h2><p>Her seviye için gereken tecrübe. Kaydırıcıyı oynattıkça taslak çizgisi değişir.</p><div id="egriK">${egriHTML()}</div></div>
<div class="kutu"><h2>Yayın geçmişi</h2><p>Her yayın kayıtlı; eski bir ayara tek tıkla dönülür.</p>${gecmisHTML()}</div></div></div><div id="yayinK">${yayinHTML()}</div>`;
}
// kaydırıcı ya da sayı değişti: yalnız o satır, eğri ve yayın şeridi yenilenir (odak kaybolmasın)
function dengeDegis(id, ham_, kaynak) {
  const s = SEMA.find(x => x.id == id), v = semaDeger(s, parseFloat(ham_));
  if (!isFinite(parseFloat(ham_))) return;
  D.taslak[id] = Math.round(v / s.adim) * s.adim;
  D.taslak[id] = +D.taslak[id].toFixed(4);
  const satir = $('ayr_' + id);
  for (const i of satir.querySelectorAll('input')) if (i !== kaynak) i.value = String(D.taslak[id]);
  const deg = D.taslak[id] !== D.yayin[id];
  satir.classList.toggle('deg', deg);
  satir.querySelector('.ad').innerHTML = esc(s.ad) + (deg ? '<i title="Yayınlanmamış değişiklik"></i>' : '');
  satir.querySelector('.kod').innerHTML = D.taslak[id] !== s.vars ? `koddaki değer ${ondalik(s.vars, s.adim)} · <button data-a="kod" data-d="${s.id}">geri al</button>` : 'koddaki değerde';
  if (id == 'sv_kir' || id == 'sv_kat') $('egriK').innerHTML = egriHTML();
  $('yayinK').innerHTML = yayinHTML();
}
async function yayinla() {
  const d = degisen();
  if (!d.length) return;
  const ok = await sor({ baslik: 'Dengeyi yayınla', metin: 'Bu değerler web ve iOS’ta bütün oyunculara uygulanır. Sürmekte olan koşular etkilenmez.', liste: d.map(s => [s.ad, `<s>${ondalik(D.yayin[s.id], s.adim)}</s>${ondalik(D.taslak[s.id], s.adim)}`]), onay: 'Yayınla' });
  if (!ok) return;
  const obj = {};
  for (const s of SEMA) if (D.taslak[s.id] !== s.vars) obj[s.id] = D.taslak[s.id];
  try {
    await rpc('kk_y_ayar_yaz', { p_anahtar: 'denge', p_deger: Object.keys(obj).length ? obj : null });
    D.yayin = { ...D.taslak };
    bildir('Yayınlandı');
    await yukle('denge');
  } catch (e) { bildir(hataMetni(e), 1); }
  ciz();
}

// ---- etkinlikler
const yerel = iso => { if (!iso) return ''; const d = new Date(iso), p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; };
function etkDurum(e) {
  const s = Date.now();
  if (!e.aktif) return ['Kapalı', ''];
  if (Date.parse(e.bas) > s) return ['Planlı · ' + once(e.bas), 'ruh'];
  if (e.bit && Date.parse(e.bit) <= s) return ['Bitti', ''];
  return ['Yayında', 'iyi'];
}
const TUR = { duyuru: 'Duyuru', etkinlik: 'Etkinlik', uyari: 'Uyarı' };
function etkinlikHTML() {
  const l = D.etkinlikler;
  const liste = !l ? '<div class="bos">Yükleniyor…</div>' : !l.length ? '<div class="kutu bos">Henüz etkinlik ya da duyuru yok. Sağ üstten ilkini ekle: örneğin hafta sonu için çift tecrübe.</div>'
    : `<ul class="etk">${l.map(e => { const [d, c] = etkDurum(e), cr = CARPANLAR.filter(x => typeof e.carpan[x.k] == 'number' && e.carpan[x.k] != 1); return `<li class="kutu"><h3>${esc(e.baslik)} <span class="rozet ${c}">${d}</span><span class="rozet">${TUR[e.tur]}</span>${cr.map(x => `<span class="rozet altin">${x.ad} ×${ondalik(e.carpan[x.k], .05)}</span>`).join('')}</h3>${e.metin ? `<p>${esc(e.metin)}</p>` : ''}<small>${tamTarih(e.bas)} → ${e.bit ? tamTarih(e.bit) : 'süresiz'}</small><button class="dgm" data-a="etkduz" data-d="${e.id}">Düzenle</button></li>`; }).join('')}</ul>`;
  return basHTML('Etkinlikler', 'Oyunun menüsünde görünen duyurular ve süreli kazanç artışları. Zamanı gelince kendiliğinden başlar ve biter.',
    `<button class="dgm" data-a="etkhazir">Çift tecrübe hafta sonu</button><button class="dgm altin" data-a="etkyeni">Yeni ekle</button>`) + (D.duzen ? etkFormHTML() : '') + liste;
}
function etkFormHTML() {
  const e = D.duzen;
  return `<form class="kutu form" id="etkF" style="margin-bottom:16px"><h2>${e.id ? 'Düzenle' : 'Yeni'}</h2>
<div class="yan"><label class="al" style="grid-column:span 2">Başlık<input class="girdi" name="baslik" required maxlength="60" value="${esc(e.baslik)}" placeholder="Çift tecrübe hafta sonu"></label>
<label class="al">Tür<select class="girdi" name="tur">${Object.entries(TUR).map(([k, a]) => `<option value="${k}"${e.tur == k ? ' selected' : ''}>${a}</option>`).join('')}</select></label></div>
<label class="al">Açıklama <small>menüde şerit açılınca görünür</small><textarea class="girdi" name="metin" maxlength="400">${esc(e.metin)}</textarea></label>
<div class="yan"><label class="al">Başlangıç<input class="girdi" type="datetime-local" name="bas" required value="${yerel(e.bas)}"></label>
<label class="al">Bitiş <small>boş: süresiz</small><input class="girdi" type="datetime-local" name="bit" value="${yerel(e.bit)}"></label></div>
<div class="yan">${CARPANLAR.map(c => `<label class="al">${c.ad} çarpanı <small>1 = değişmez</small><input class="girdi" type="number" name="c_${c.k}" min="0.25" max="5" step="0.05" value="${e.carpan[c.k] ?? 1}"></label>`).join('')}</div>
<label class="anahtar"><input type="checkbox" name="aktif"${e.aktif ? ' checked' : ''}>Açık (kapalıysa zamanı gelse de görünmez)</label>
<div style="display:flex;gap:10px;flex-wrap:wrap"><button class="dgm altin">Kaydet</button><button type="button" class="dgm duz" data-a="etkiptal">Vazgeç</button>${e.id ? '<button type="button" class="dgm kor" data-a="etksil" style="margin-left:auto">Sil</button>' : ''}</div></form>`;
}
async function etkKaydet(f) {
  const carpan = {};
  for (const c of CARPANLAR) { const v = parseFloat(f['c_' + c.k].value); if (isFinite(v) && v != 1) carpan[c.k] = Math.max(.25, Math.min(5, v)); }
  const p = { baslik: f.baslik.value.trim(), metin: f.metin.value.trim(), tur: f.tur.value, bas: new Date(f.bas.value).toISOString(), bit: f.bit.value ? new Date(f.bit.value).toISOString() : null, aktif: f.aktif.checked, carpan };
  try {
    await rpc('kk_y_etkinlik_yaz', { p_id: D.duzen.id || null, p });
    D.duzen = null;
    bildir('Kaydedildi');
    await yukle('etkinlik');
  } catch (e) { bildir(e.message == 'bitis baslangictan once' ? 'Bitiş başlangıçtan önce olamaz.' : hataMetni(e), 1); }
  ciz();
}

// ---- oyuncular
const durumRozet = o => (o.yonetici ? '<span class="rozet altin">yönetici</span> ' : '') + (o.yasak ? '<span class="rozet kor">yasaklı</span> ' : o.gizli ? '<span class="rozet">gizli</span> ' : '');
function oyuncuTabloHTML() {
  const l = D.oyuncular;
  if (!l) return '<div class="bos">Yükleniyor…</div>';
  if (!l.length) return `<div class="bos">${D.ara ? '“' + esc(D.ara) + '” ile eşleşen oyuncu yok.' : 'Henüz hesap yok.'}</div>`;
  return `<div class="tk"><table class="tb"><thead><tr><th>Oyuncu</th><th class="s">En iyi skor</th><th class="s">Seviye</th><th>Kahraman</th><th class="s">Koşu</th><th class="s">Reddedilen</th><th>Son koşu</th><th>Kayıt</th></tr></thead><tbody>
${l.map(o => `<tr class="tik${D.secili && D.secili.id == o.id ? ' secili' : ''}" tabindex="0" data-a="oyuncu" data-d="${o.id}"><td><b>${esc(o.ad)}</b> ${durumRozet(o)}</td><td class="s">${o.k != null ? sayi(o.k) : '<span class="sol">yok</span>'}</td><td class="s">${o.k != null ? sayi(o.lv) : ''}</td><td>${o.k != null ? esc(kahraman(o.c)) : ''}</td><td class="s">${sayi(o.kosu)}</td><td class="s">${o.ret ? `<span class="rozet kor">${o.ret}</span>` : '0'}</td><td>${o.son ? zaman(o.son) : '<span class="sol">hiç</span>'}</td><td>${zaman(o.olus)}</td></tr>`).join('')}</tbody></table></div>`;
}
function oyuncuHTML() {
  return basHTML('Oyuncular', 'Hesapları ara, koşularına bak; sahte skoru sıralamadan kaldır.', '')
    + `<div class="kutu"><div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:14px"><input class="girdi" id="ara" style="max-width:280px" placeholder="Oyuncu adı ara" value="${esc(D.ara)}" aria-label="Oyuncu adı ara">
${secHTML('sira', D.sira, [['son', 'Son oynayan'], ['skor', 'En yüksek skor'], ['yeni', 'Yeni kayıt'], ['ret', 'Reddedilen']])}</div><div id="oyT">${oyuncuTabloHTML()}</div></div>` + (D.secili ? cekmeceHTML() : '');
}
const kosuSatir = (q, adli) => {
  const hiz = q.k / Math.max(1, q.t);
  return `<tr class="tik" tabindex="0" data-a="kosuac" data-d="${q.id}"><td>${zaman(q.at)}</td>${adli ? `<td><b>${esc(q.ad)}</b></td>` : ''}<td>${esc(kahraman(q.c))}</td><td class="s">${q.kademe || ''}</td><td class="s">${sayi(q.k)}</td><td class="s">${sayi(q.lv)}</td><td class="s">${sure(q.t)}</td><td class="s">${hiz.toFixed(1)}</td><td>${q.ret ? '<span class="rozet kor">reddedildi</span>' : q.sonuc == 'olum' ? esc(nedenAd(q.neden)) : q.sonuc == 'zafer' || q.sonuc == 'cikis' ? '<span class="rozet iyi">bitirdi</span>' : '<span class="sol">bilinmiyor</span>'}</td><td>${q.plat == 'ios' ? 'iOS' : q.plat == 'web' ? 'Web' : ''}</td></tr>`
    + (D.acikKosu == q.id ? `<tr class="ac"><td colspan="${adli ? 10 : 9}">Sunucuda geçen gerçek süre <b>${sure(q.gercek)}</b>, bildirilen <b>${sure(q.t)}</b>${q.ret ? ' · bu sürede en çok ' + sayi(60 + 150 * Math.min(q.gercek, q.t + 30)) + ' öldürme kabul edilir' : ''}. Sürüm ${esc(q.surum || '?')}.
${(q.ozet.w || []).length ? '<br>Silahlar: ' + q.ozet.w.map(w => `${esc(w[0])} ${w[1]}. sv (${sayi(w[2])} hasar)`).join(', ') : ''}${(q.ozet.tm || []).length ? '<br>Tomlar: ' + q.ozet.tm.map(t => `${esc(t[0])} ${t[1]}`).join(', ') : ''}${q.ozet.es != null ? `<br>${sayi(q.ozet.es)} eşya, ${sayi(q.ozet.au || 0)} altın` : ''}</td></tr>` : '');
};
const kosuBas = adli => `<thead><tr><th>Zaman</th>${adli ? '<th>Oyuncu</th>' : ''}<th>Kahraman</th><th class="s">Kademe</th><th class="s">Öldürme</th><th class="s">Seviye</th><th class="s">Süre</th><th class="s">Öld./sn</th><th>Sonuç</th><th>Platform</th></tr></thead>`;
function cekmeceHTML() {
  const o = D.secili, k = D.seciliKosu;
  return `<aside class="cek" aria-label="Oyuncu ayrıntısı"><div style="display:flex;justify-content:space-between;gap:10px;align-items:start"><h2>${esc(o.ad)} ${durumRozet(o)}</h2><button class="dgm duz" data-a="kapat" aria-label="Kapat">Kapat</button></div>
<div class="ozl"><div><span>En iyi skor</span><b>${o.k != null ? sayi(o.k) : 'yok'}</b></div><div><span>Koşu</span><b>${sayi(o.kosu)}</b></div><div><span>Reddedilen</span><b>${sayi(o.ret)}</b></div></div>
${o.not ? `<p style="color:var(--m2)">Not: ${esc(o.not)}</p>` : ''}
<div class="eyl">${o.yasak ? '<button class="dgm" data-a="yasakkaldir">Yasağı kaldır</button>' : `<button class="dgm kor" data-a="yasakla"${o.yonetici ? ' disabled' : ''}>Yasakla</button>`}
${o.k != null && !o.yasak ? `<button class="dgm" data-a="gizle">${o.gizli ? 'Sıralamada göster' : 'Sıralamadan gizle'}</button>` : ''}
${o.k != null ? '<button class="dgm" data-a="skorsil">Skorunu sil</button>' : ''}</div>
<p style="color:var(--m3);font-size:13.5px">Yasak: koşu başlatamaz, satırları sıralamada görünmez; kaldırınca geri gelir. Gizleme: oynamaya devam eder ama tabloda görünmez. Skor silme kalıcıdır.</p>
<h3 style="font:700 16px var(--yazi)">Son koşuları</h3>
<div class="tk">${!k ? '<div class="bos">Yükleniyor…</div>' : !k.length ? '<div class="bos">Kayıtlı koşusu yok.</div>' : `<table class="tb">${kosuBas(0)}<tbody>${k.map(q => kosuSatir(q, 0)).join('')}</tbody></table>`}</div></aside>`;
}
async function oyuncuSec(id) {
  D.secili = (D.oyuncular || []).find(o => o.id == id) || null;
  D.seciliKosu = null;
  D.acikKosu = 0;
  ciz();
  if (!D.secili) return;
  try { D.seciliKosu = await rpc('kk_y_kosular', { p_hesap: id, p_filtre: 'hepsi', p_limit: 40 }); } catch (e) { D.seciliKosu = []; bildir(hataMetni(e), 1); }
  ciz();
}
async function oyuncuIslem(ne) {
  const o = D.secili;
  if (!o) return;
  try {
    if (ne == 'yasakla') {
      const r = await sor({ baslik: o.ad + ' yasaklansın mı?', metin: 'Koşu başlatamaz ve sıralamada görünmez. İstediğin zaman kaldırabilirsin.', girdi: { etiket: 'Not (yalnız yöneticiler görür)', deger: o.not }, onay: 'Yasakla', tur: 'kor' });
      if (!r) return;
      await rpc('kk_y_yasak', { p_id: o.id, p_yasak: true, p_not: r.girdi });
      bildir(o.ad + ' yasaklandı');
    } else if (ne == 'yasakkaldir') {
      await rpc('kk_y_yasak', { p_id: o.id, p_yasak: false, p_not: null });
      bildir('Yasak kaldırıldı');
    } else if (ne == 'gizle') {
      await rpc('kk_y_gizle', { p_id: o.id, p_gizli: !o.gizli });
      bildir(o.gizli ? 'Sıralamada görünüyor' : 'Sıralamadan gizlendi');
    } else if (ne == 'skorsil') {
      const r = await sor({ baslik: o.ad + ' oyuncusunun skoru silinsin mi?', metin: `Tüm zamanlar ve haftalık tablodaki satırları kalıcı olarak silinir (en iyi skor ${sayi(o.k)}). Geri alınamaz; silinen satır işlem günlüğünde durur.`, yaz: o.ad, onay: 'Kalıcı olarak sil', tur: 'kor' });
      if (!r) return;
      await rpc('kk_y_skor_sil', { p_id: o.id });
      bildir('Skor silindi');
    }
    await yukle('oyuncu');
    D.secili = (D.oyuncular || []).find(x => x.id == o.id) || null;
  } catch (e) { bildir(hataMetni(e), 1); }
  ciz();
}

// ---- koşular
function kosuHTML() {
  const l = D.kosular;
  return basHTML('Koşular', 'Biten her koşunun kaydı. Sunucu, öldürme sayısı geçen gerçek süreye sığmayan skoru reddeder ve burada gösterir.', secHTML('filtre', D.filtre, [['hepsi', 'Hepsi'], ['ret', 'Reddedilen'], ['hizli', 'Çok hızlı']]))
    + `<div class="kutu" style="padding-bottom:16px"><h2>${{ hepsi: 'Son koşular', ret: 'Reddedilen skorlar', hizli: 'Saniyede 40’tan çok öldürme' }[D.filtre]}</h2><p>Satıra tıkla: silahlar, tomlar ve sunucunun ölçtüğü süre.</p>
<div class="tk">${!l ? '<div class="bos">Yükleniyor…</div>' : !l.length ? `<div class="bos">${D.filtre == 'hepsi' ? 'Henüz koşu kaydı yok. Oyuncular koşu bitirdikçe burada görünür.' : 'Bu süzgece uyan koşu yok.'}</div>` : `<table class="tb">${kosuBas(1)}<tbody>${l.map(q => kosuSatir(q, 1)).join('')}</tbody></table>`}</div></div>`;
}

// ---- sezon
function sezonHTML() {
  const z = D.sezon;
  if (!z) return basHTML('Sezon', 'Tüm zamanlar tablosunu arşivleyip sıfırla.') + '<div class="bos">Yükleniyor…</div>';
  return basHTML('Sezon', 'Büyük bir denge değişikliğinden sonra eski rekorlar ulaşılmaz kalabilir. Sezonu kapatınca tüm zamanlar tablosu arşive taşınır ve herkes sıfırdan başlar. Haftalık tablo etkilenmez.')
    + `<div class="izg iki"><form class="kutu form" id="sezF"><h2>Sezonu kapat</h2><p>Şu an tabloda <b style="color:var(--m)">${sayi(z.acik)}</b> oyuncu var.</p>
<label class="al">Kapanan sezonun adı<input class="girdi" name="ad" required maxlength="40" placeholder="Sezon ${z.sezonlar.length + 1}" value="Sezon ${z.sezonlar.length + 1}"></label>
<div><button class="dgm kor"${z.acik ? '' : ' disabled'}>Sezonu kapat</button></div></form>
<div class="kutu"><h2>Kapanmış sezonlar</h2><p>Arşiv herkese açık okunur; şampiyonlar burada kalır.</p>${z.sezonlar.length ? `<ul class="gcm">${z.sezonlar.map(s => `<li><b>${esc(s.ad)}</b><small>${tamTarih(s.kapanis)} · ${sayi(s.satir)} oyuncu${s.ilk ? ' · birinci ' + esc(s.ilk.ad) + ' (' + sayi(s.ilk.k) + ')' : ''}</small></li>`).join('')}</ul>` : '<div class="bos">Henüz kapanmış sezon yok.</div>'}</div></div>`;
}

// ---- sistem
const NE = { ayar: 'Ayar değişti', etkinlik: 'Etkinlik kaydedildi', etkinlik_sil: 'Etkinlik silindi', yasak: 'Yasakladı', yasak_kaldir: 'Yasağı kaldırdı', gizle: 'Sıralamadan gizledi', goster: 'Sıralamada gösterdi', skor_sil: 'Skor sildi', sezon_kapat: 'Sezonu kapattı' };
function sistemHTML() {
  const b = D.ayar.bakim || {}, s = D.ayar.surum || {}, l = D.gunluk;
  return basHTML('Sistem', 'Bakım modu, sürüm zorlaması ve yönetici işlemlerinin kaydı.')
    + `<div class="izg iki"><form class="kutu form" id="bakF"><h2>Bakım modu</h2><p>Açıkken oyun kimse için açılmaz; açılış ekranında aşağıdaki mesaj görünür. Sürmekte olan koşular kesilmez.</p>
<label class="anahtar"><input type="checkbox" name="acik"${b.acik ? ' checked' : ''}>Oyunu bakıma al ${b.acik ? '<span class="rozet kor">şu an kapalı</span>' : ''}</label>
<label class="al">Oyuncunun göreceği mesaj<textarea class="girdi" name="mesaj" maxlength="300" placeholder="Oyun kısa bir bakımda. Birazdan yeniden dene.">${esc(b.mesaj || '')}</textarea></label><div><button class="dgm altin">Kaydet</button></div></form>
<form class="kutu form" id="surF"><h2>iOS en düşük sürüm</h2><p>Bundan eski sürümü açan oyuncu güncellemeye yönlendirilir. Boş bırakırsan zorlama olmaz.</p>
<label class="al">En düşük sürüm<input class="girdi" name="ios_min" maxlength="12" pattern="[0-9]+(\\.[0-9]+){0,2}" placeholder="0.1.3" value="${esc(s.ios_min || '')}"></label>
<label class="al">Mesaj<input class="girdi" name="mesaj" maxlength="200" placeholder="Yeni sürüm çıktı, devam etmek için güncelle." value="${esc(s.mesaj || '')}"></label><div><button class="dgm altin">Kaydet</button></div></form></div>
<div class="kutu" style="margin-top:16px"><h2>İşlem günlüğü</h2><p>Bu panelden yapılan her değişiklik: kim, ne zaman, ne.</p><div class="tk">${!l ? '<div class="bos">Yükleniyor…</div>' : !l.length ? '<div class="bos">Henüz işlem yok.</div>' : `<table class="tb"><thead><tr><th>Zaman</th><th>Yönetici</th><th>İşlem</th><th>Ayrıntı</th></tr></thead><tbody>${l.map(g => `<tr><td>${zaman(g.at)}</td><td><b>${esc(g.ad)}</b></td><td>${esc(NE[g.ne] || g.ne)}</td><td class="sol">${esc(g.ayrinti.ad || g.ayrinti.baslik || g.ayrinti.anahtar || '')}${g.ayrinti.not ? ' · ' + esc(g.ayrinti.not) : ''}${g.ne == 'skor_sil' && g.ayrinti.skor ? ' · ' + esc(g.ayrinti.skor.ad) + ' ' + sayi(g.ayrinti.skor.k) : ''}</td></tr>`).join('')}</tbody></table>`}</div></div>`;
}

// ---- çizim
const SAYFA = { genel: genelHTML, denge: dengeHTML, etkinlik: etkinlikHTML, oyuncu: oyuncuHTML, kosu: kosuHTML, sezon: sezonHTML, sistem: sistemHTML };
function girisHTML() {
  return `<main class="giris"><form id="girF"><h1>Kurultay</h1><div class="rn" aria-hidden="true">𐱅𐰭𐰼𐰃</div><p>Kara Koru yönetimi. Yönetici oyun hesabınla gir.</p>
${!BASE || !KEY ? '<div class="hata">Bu derlemede sunucu adresi yok (VITE_SUPABASE_URL). Panel açılamaz.</div>' : ''}${D.girisHata ? `<div class="hata" role="alert">${esc(D.girisHata)}</div>` : ''}
<label class="al">Kullanıcı adı<input class="girdi" name="ad" required autocomplete="username" autocapitalize="none" spellcheck="false"></label>
<label class="al">Şifre<input class="girdi" name="sifre" type="password" required autocomplete="current-password"></label>
<button class="dgm altin"${D.bekle ? ' disabled' : ''}>${D.bekle ? 'Giriliyor…' : 'Giriş yap'}</button></form></main>`;
}
function ciz() {
  const u = $('uyg');
  if (!OT || !D.yonetici) { u.innerHTML = girisHTML(); return; }
  const kirli = degisen().length;
  u.innerHTML = `<div class="cer"><nav class="ray" aria-label="Bölümler"><div class="marka"><b>Kurultay</b><span aria-hidden="true">𐱅𐰭𐰼𐰃</span><small>Kara Koru yönetimi</small></div>
<div class="gez">${SAYFALAR.map(([k, ad]) => `<button data-a="git" data-d="${k}"${D.sayfa == k ? ' aria-current="page"' : ''}>${ad}${k == 'denge' && kirli ? `<em title="Yayınlanmamış değişiklik">${kirli}</em>` : ''}</button>`).join('')}</div>
<div class="kimlik"><span>Giriş yapan</span><b>${esc(OT.ad)}</b><button class="dgm kck" data-a="cikis">Çıkış</button></div></nav>
<main class="ic">${D.hata ? `<div class="hata" role="alert" style="margin-bottom:16px">${esc(D.hata)} <button class="dgm kck" data-a="yenile" style="margin-left:10px">Yeniden dene</button></div>` : ''}${SAYFA[D.sayfa]()}</main></div>`;
}

// ---- olaylar
const CZ = {};
document.addEventListener('click', async ev => {
  const b = /** @type {HTMLElement} */ (/** @type {HTMLElement} */ (ev.target).closest('[data-a]'));
  if (!b) return;
  const a = b.dataset.a, d = b.dataset.d;
  if (a == 'git') return git(d);
  if (a == 'yenile') { await yukle(); return ciz(); }
  if (a == 'cikis') { try { await ham('/auth/v1/logout', { method: 'POST' }, OT && OT.at); } catch (e) {} otYaz(null); D.yonetici = false; return ciz(); }
  if (a == 'gun') { D.gun = +d; D.ozet = null; ciz(); await yukle(); return ciz(); }
  if (a == 'kod') { const s = SEMA.find(x => x.id == d); D.taslak[d] = s.vars; return ciz(); }
  if (a == 'kodadon') { D.taslak = { ...VARS }; return ciz(); }
  if (a == 'vazgec') { D.taslak = { ...D.yayin }; return ciz(); }
  if (a == 'yayinla') return yayinla();
  if (a == 'don') { const g = D.gecmis.find(x => String(x.id) == d); if (g) { D.taslak = Object.fromEntries(SEMA.map(s => [s.id, semaDeger(s, (g.yeni || {})[s.id])])); ciz(); bildir('Taslağa alındı; yayınlamak için alttaki şeridi kullan'); } return; }
  if (a == 'etkyeni') { D.duzen = { id: 0, baslik: '', metin: '', tur: 'duyuru', bas: new Date().toISOString(), bit: null, aktif: true, carpan: {} }; return ciz(); }
  if (a == 'etkhazir') {
    // gelecek cumartesi 00:00'dan pazartesi 00:00'a (yerel saat)
    const c = new Date(); c.setHours(0, 0, 0, 0); c.setDate(c.getDate() + ((6 - c.getDay() + 7) % 7 || 7));
    const p = new Date(c); p.setDate(p.getDate() + 2);
    D.duzen = { id: 0, baslik: 'Çift tecrübe hafta sonu', metin: 'Pazar gece yarısına kadar bütün tecrübe iki katı.', tur: 'etkinlik', bas: c.toISOString(), bit: p.toISOString(), aktif: true, carpan: { xp: 2 } };
    return ciz();
  }
  if (a == 'etkduz') { const e = D.etkinlikler.find(x => String(x.id) == d); if (e) { D.duzen = JSON.parse(JSON.stringify(e)); ciz(); window.scrollTo(0, 0); } return; }
  if (a == 'etkiptal') { D.duzen = null; return ciz(); }
  if (a == 'etksil') {
    if (!(await sor({ baslik: 'Silinsin mi?', metin: `“${D.duzen.baslik}” kalıcı olarak silinir. Yalnız kapatmak istersen Açık anahtarını kapatıp kaydet.`, onay: 'Sil', tur: 'kor' }))) return;
    try { await rpc('kk_y_etkinlik_sil', { p_id: D.duzen.id }); D.duzen = null; bildir('Silindi'); await yukle('etkinlik'); } catch (e) { bildir(hataMetni(e), 1); }
    return ciz();
  }
  if (a == 'sira') { D.sira = d; D.oyuncular = null; ciz(); await yukle(); return ciz(); }
  if (a == 'oyuncu') return oyuncuSec(d);
  if (a == 'kapat') { D.secili = null; return ciz(); }
  if (['yasakla', 'yasakkaldir', 'gizle', 'skorsil'].includes(a)) return oyuncuIslem(a);
  if (a == 'filtre') { D.filtre = d; D.kosular = null; D.acikKosu = 0; ciz(); await yukle(); return ciz(); }
  if (a == 'kosuac') { D.acikKosu = D.acikKosu == +d ? 0 : +d; return ciz(); }
});
document.addEventListener('keydown', ev => {
  const t = /** @type {HTMLElement} */ (ev.target);
  if ((ev.key == 'Enter' || ev.key == ' ') && t.matches && t.matches('tr.tik')) { ev.preventDefault(); t.click(); }
  if (ev.key == 'Escape' && D.secili && !document.querySelector('dialog[open]')) { D.secili = null; ciz(); }
});
let araT = 0;
document.addEventListener('input', ev => {
  const t = /** @type {HTMLInputElement} */ (ev.target);
  if (t.dataset && t.dataset.ay) return dengeDegis(t.dataset.ay, t.value, t);
  if (t.id == 'ara') {
    D.ara = t.value;
    clearTimeout(araT);
    araT = setTimeout(async () => { await yukle('oyuncu'); if (D.sayfa == 'oyuncu' && $('oyT')) $('oyT').innerHTML = oyuncuTabloHTML(); }, 280);
  }
});
document.addEventListener('submit', async ev => {
  const f = /** @type {any} */ (ev.target);
  if (f.getAttribute('method') == 'dialog') return; // onay penceresi: tarayıcı kapatır (sor)
  ev.preventDefault();
  if (f.id == 'girF') {
    D.bekle = true; D.girisHata = ''; const ad = f.ad.value.trim(), sifre = f.sifre.value; ciz();
    try {
      otYaz(await ham('/auth/v1/token?grant_type=password', { method: 'POST', body: JSON.stringify({ email: adEposta(ad), password: sifre }) }));
      if (!OT.ad) OT.ad = ad;
      D.yonetici = (await rpc('kk_yonetici_mi')) === true;
      if (!D.yonetici) { otYaz(null); D.girisHata = 'Bu hesabın yönetici yetkisi yok.'; }
    } catch (e) {
      otYaz(null);
      D.girisHata = e.code == 'invalid_credentials' || e.status == 400 ? 'Kullanıcı adı ya da şifre yanlış.' : e.code == 'PGRST202' || e.status == 404 ? 'Sunucuda yönetim işlevleri kurulu değil (supabase/liveops.sql çalıştırılmalı).' : hataMetni(e);
    }
    D.bekle = false;
    if (D.yonetici) return git('genel');
    return ciz();
  }
  if (f.id == 'etkF') return etkKaydet(f);
  if (f.id == 'sezF') {
    const ad = f.ad.value.trim();
    if (!(await sor({ baslik: 'Sezon kapatılsın mı?', metin: `Tüm zamanlar tablosundaki ${sayi(D.sezon.acik)} oyuncu “${ad}” arşivine taşınır ve tablo sıfırlanır. Geri alınamaz.`, yaz: 'KAPAT', onay: 'Sezonu kapat', tur: 'kor' }))) return;
    try { const n = await rpc('kk_y_sezon_kapat', { p_ad: ad }); bildir(`${ad} kapandı: ${sayi(n)} oyuncu arşivlendi`); await yukle('sezon'); } catch (e) { bildir(hataMetni(e), 1); }
    return ciz();
  }
  if (f.id == 'bakF') {
    const acik = f.acik.checked, mesaj = f.mesaj.value.trim(), onceki = !!(D.ayar.bakim && D.ayar.bakim.acik);
    if (acik && !onceki && !(await sor({ baslik: 'Oyun bakıma alınsın mı?', metin: 'Oyunu açan herkes bakım mesajını görür ve oynayamaz. Kapatana kadar sürer.', onay: 'Bakıma al', tur: 'kor' }))) return;
    try { await rpc('kk_y_ayar_yaz', { p_anahtar: 'bakim', p_deger: acik || mesaj ? { acik, mesaj } : null }); bildir(acik ? 'Oyun bakımda' : 'Kaydedildi'); await yukle('sistem'); } catch (e) { bildir(hataMetni(e), 1); }
    return ciz();
  }
  if (f.id == 'surF') {
    const ios_min = f.ios_min.value.trim(), mesaj = f.mesaj.value.trim();
    try { await rpc('kk_y_ayar_yaz', { p_anahtar: 'surum', p_deger: ios_min ? { ios_min, mesaj } : null }); bildir('Kaydedildi'); await yukle('sistem'); } catch (e) { bildir(hataMetni(e), 1); }
    return ciz();
  }
});
// yayınlanmamış denge değişikliği varken sayfadan çıkılırsa tarayıcı sorar
window.addEventListener('beforeunload', ev => { if (D.yonetici && degisen().length) ev.preventDefault(); });

// ---- ipucu: [data-ip] işaretleri ve çizgi grafiğin imleci
const ip = $('ipucu');
function ipGoster(metin, x, y) {
  ip.textContent = metin;
  ip.hidden = false;
  const r = ip.getBoundingClientRect();
  ip.style.left = Math.max(6, Math.min(innerWidth - r.width - 6, x + 14)) + 'px';
  ip.style.top = Math.max(6, y - r.height - 12) + 'px';
}
document.addEventListener('mousemove', ev => {
  const t = /** @type {Element} */ (ev.target), g = t.closest && t.closest('[data-ip]'), cz = t.closest && t.closest('svg.czg');
  if (g) return ipGoster(g.getAttribute('data-ip'), ev.clientX, ev.clientY);
  if (cz && CZ[cz.id]) {
    const r = cz.getBoundingClientRect(), c = CZ[cz.id], W = +cz.getAttribute('data-w'), sol = +cz.getAttribute('data-sol'), iw = +cz.getAttribute('data-iw');
    const i = Math.max(0, Math.min(c.n - 1, Math.round(((ev.clientX - r.left) / r.width * W - sol) / iw * (c.n - 1)))), xx = sol + i / (c.n - 1) * iw;
    const im = cz.querySelector('.imlec');
    im.setAttribute('x1', String(xx)); im.setAttribute('x2', String(xx));
    return ipGoster(`${c.x} ${i + 1}\n` + c.seriler.map(s => `${s[0]}: ${sayi(s[1][i])}`).join('\n'), ev.clientX, ev.clientY);
  }
  ip.hidden = true;
});
document.addEventListener('focusin', ev => {
  const g = /** @type {Element} */ (ev.target).closest && /** @type {Element} */ (ev.target).closest('[data-ip]');
  if (g) { const r = g.getBoundingClientRect(); ipGoster(g.getAttribute('data-ip'), r.left + r.width / 2, r.top + 20); }
});
document.addEventListener('focusout', () => { ip.hidden = true; });

// ---- açılış: bu sekmede oturum varsa yetki yeniden sorulur
(async () => {
  ciz();
  if (!OT) return;
  try { D.yonetici = (await rpc('kk_yonetici_mi')) === true; } catch (e) { D.yonetici = false; }
  if (!D.yonetici) { otYaz(null); return ciz(); }
  git('genel');
})();
