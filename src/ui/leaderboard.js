// ui/leaderboard.js · Kara Koru
// Bu dosya tek dosyalık sürümden (v22) otomatik ayrıldı. Ortak oyun durumu core/store.js içindeki $G nesnesinde.

import { $G } from '../core/store.js';
import { SET } from '../core/settings.js';
import { ov } from '../core/helpers.js';
import { OV, fmt } from '../core/state.js';
import { CR, heroIdx, heroOn } from '../game/heroes.js';
import { MAPS, WD } from '../data/content.js';
import { A } from './actions.js';
import { IC, iconCol, ikon } from './icons.js';
import { cleanCh, gecenHafta, haftaBasi, haftaSonu, supaAllow, supaCount, supaFlush, supaIdent, supaKosu, supaMine, supaName, supaOn, supaRecord, supaRows } from './supa.js';

const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export let GL, glRow, glRank;

export function __init_60() {
  // ---- öldürme sıralaması: yerel rekorlar + paylaşılan tablo (db/user yetenekleri varsa)
  $G.LB = [];
  $G.LBT = -1;
  try {
    const a = JSON.parse(localStorage.getItem('kk_lb') || '[]');
    if (Array.isArray(a)) $G.LB = a.filter(r => r && typeof r.k == 'number').slice(0, 10);
  } catch (e) {}
}

export function lbAdd(r) {
  $G.LB.push(r);
  $G.LB.sort((a, b) => b.k - a.k);
  $G.LB = $G.LB.slice(0, 10);
  try {
    localStorage.setItem('kk_lb', JSON.stringify($G.LB));
  } catch (e) {}
}

export function __init_61() {
  GL = {
    kind: '', // 'claude' (paylaşılan tablo) ya da 'supa' (Supabase); boşsa yalnız yerel rekorlar
    db: null,
    user: null,
    me: null,
    rows: [], // tüm zamanlar
    ok: 0,
    mine: null,
    tot: 0, // tablodaki oyuncu sayısı (bilinmiyorsa 0)
    mrk: 0, // kendi satırı ilk 200'ün dışındaysa sunucudan sayılan sırası
    // haftalık (yalnız Supabase): bu haftanın satırları, kendi satırı, geçen haftanın ilk üçü
    hf: '',
    wrows: [],
    wmine: null,
    wtot: 0,
    wmrk: 0,
    prev: []
  };
  glRow = (id, x) => ({
    id,
    k: Math.max(0, +x.k | 0),
    c: Math.max(0, +x.c | 0),
    s: Math.max(0, +x.s | 0),
    t: Math.max(0, +x.t | 0),
    lv: +x.lv | 0,
    at: +x.at || 0,
    ch: cleanCh(x.ch),
    ad: typeof x.ad == 'string' ? x.ad.slice(0, 20) : ''
  });
  (async () => {
    try {
      const wc = /** @type {any} */ (window).claude,
        cl = wc && wc.use ? await wc.use('db') : null;
      if (!cl) {
        // Claude dışında: Supabase yapılandırıldıysa ortak tablo oradan
        if (supaOn) {
          GL.kind = 'supa';
          GL.db = 'supa';
          GL.me = (supaIdent() || {}).id || null; // giriş yapmış oyuncunun hesabı (ui/hesap.js)
          supaAllow(() => SET.lbu !== 0);
          supaLoad();
          supaFlush(() => supaLoad(1)); // önceki oturumdan kalan gönderilmemiş koşu
          // koşu başında belirteç alınamadıysa (ağ yok) koşu sürerken yeniden denenir
          setInterval(() => { if ($G.S == 'play') kosuBasla(); }, 30000);
        }
        return;
      }
      const db = cl;
      GL.kind = 'claude';
      const user = await wc.use('user');
      GL.db = db;
      GL.user = user;
      GL.me = user ? await user.id() : null;
      if (GL.me) {
        try {
          const d = await db.doc('skor/' + GL.me).get();
          if (d.exists) GL.mine = glRow(GL.me, JSON.parse(JSON.stringify(d.data() || {})));
        } catch (e) {}
      }
      const to = setTimeout(() => {
        GL.ok = GL.ok || 2;
        lbRefresh();
      }, 10000);
      db.collection('skor').orderBy('k', 'desc').limit(200).onSnapshot(s => {
        if (!s.metadata || !s.metadata.fromCache) clearTimeout(to);
        GL.rows = s.docs.filter(d => d.exists).map(d => glRow(d.id, d.data() || {}));
        GL.ok = 1;
        $G.hk = '';
        lbRefresh();
      }, e => {
        clearTimeout(to);
        GL.ok = 3;
        lbRefresh();
      });
    } catch (e) {}
  })();
}

let supaT = 0;
// Supabase tablolarını yeniden okur (en çok 15 saniyede bir, zorla değilse): tüm zamanlar, bu hafta, geçen haftanın ilk üçü.
// Kendi satırı ilk 200'ün dışındaysa ayrıca okunur ve sırası sayılır.
export async function supaLoad(force) {
  if (GL.kind != 'supa' || (!force && Date.now() - supaT < 15000)) return;
  supaT = Date.now();
  const hf = haftaBasi();
  try {
    // haftalık okunamazsa tüm zamanlar yine gösterilir
    const [rows, wrows, prev, tot, wtot] = await Promise.all([supaRows(), supaRows(hf).catch(() => []), supaRows(gecenHafta(), 3).catch(() => []), supaCount(), supaCount(hf)]);
    const kendi = async (rs, h) => {
      const m = rs.find(x => x.id == GL.me) || (GL.me ? await supaMine(h).catch(() => null) : null);
      return [m ? glRow(m.id, m) : null, m && !rs.includes(m) && rs.length >= 200 ? await supaCount(h, m.k).then(n => n == null ? 0 : n + 1) : 0];
    };
    [GL.mine, GL.mrk] = await kendi(rows, '');
    [GL.wmine, GL.wmrk] = await kendi(wrows, hf);
    GL.rows = rows.map(r => glRow(r.id, r));
    GL.wrows = wrows.map(r => glRow(r.id, r));
    GL.prev = prev.map(r => glRow(r.id, r));
    GL.tot = tot || rows.length;
    GL.wtot = wtot || wrows.length;
    GL.hf = hf;
    GL.ok = 1;
    $G.hk = '';
  } catch (e) {
    if (GL.ok != 1) GL.ok = 3;
  }
  lbRefresh();
}

// koşu başında sunucudan koşu belirteci istenir (ui/supa.js): skor yalnız bu belirteçle, geçen gerçek süreyle orantılı yazılır.
// Meydan okumalı ve konsol kullanılan koşu sıralamaya girmediği için belirteç de almaz.
export function kosuBasla() {
  const P = $G.P;
  if (GL.kind != 'supa' || !GL.me || SET.lbu === 0 || !P || P.kosu || P.kosuP || P.chal || P.con || $G.META.con) return;
  P.kosuP = 1;
  supaKosu().then(id => { P.kosu = id; }).catch(() => {}).then(() => { P.kosuP = 0; });
}

export async function glSubmit(r) {
  if (!GL.db || !GL.me || SET.lbu === 0) return;
  // Supabase: rekor giden kutusuna girer, sunucudaki satırla birleştirilip sırayla gönderilir (ui/supa.js)
  if (GL.kind == 'supa') return supaRecord({ ...r, kosu: $G.P && $G.P.kosu }, () => supaLoad(1));
  const cur = GL.mine || GL.rows.find(x => x.id == GL.me) || {
      k: 0,
      ch: {}
    },
    ch = JSON.parse(JSON.stringify(cur.ch || {})),
    pc = ch[r.c];
  let chg = 0;
  if (!pc || r.k > (+pc.k | 0)) {
    ch[r.c] = {
      k: r.k,
      s: r.s,
      t: r.t
    };
    chg = 1;
  }
  const nb = r.k > (cur.k | 0);
  if (!nb && !chg) return;
  const doc = nb ? {
    k: r.k,
    c: r.c,
    s: r.s,
    t: r.t,
    lv: r.lv,
    at: Date.now(),
    ch
  } : {
    k: cur.k | 0,
    c: cur.c | 0,
    s: cur.s | 0,
    t: cur.t | 0,
    lv: cur.lv | 0,
    at: cur.at || Date.now(),
    ch
  };
  try {
    await GL.db.doc('skor/' + GL.me).set(doc);
    GL.mine = glRow(GL.me, doc);
  } catch (e) {}
}


export function __init_62() {
  glRank = k => GL.db && GL.ok == 1 ? 1 + GL.rows.filter(x => x.id != GL.me && x.k > k).length : 0;
  $G.LBM = 'h'; // sıralama görünümü: 'h' bu hafta, 't' tüm zamanlar (haftalık yalnız Supabase'de)
}

// haftalık görünüm bu yayında var mı ve seçili mi
const haftalik = () => GL.kind == 'supa' && $G.LBM == 'h';
// seçili görünümün kaynağı: satırlar, kendi satırı, oyuncu sayısı, ilk 200 dışındaki sıra
const kaynak = h => h ? { rows: GL.wrows, mine: GL.wmine, tot: GL.wtot, mrk: GL.wmrk } : { rows: GL.rows, mine: GL.mine, tot: GL.tot, mrk: GL.mrk };

// koşu sırasında sağ üstteki hedef: haftalık tablo doluysa onda, değilse tüm zamanlarda bir üst sıra
export function klTarget() {
  const h = GL.kind == 'supa' && GL.hf == haftaBasi() && GL.wrows.length > 0,
    rows = h ? GL.wrows : GL.rows;
  if (GL.db && GL.ok == 1 && rows.length) {
    const ab = rows.filter(x => x.id != GL.me && x.k >= $G.kills);
    if (!ab.length) return (h ? 'Bu hafta ' : 'Sıralamada ') + '1.';
    const nx = ab.reduce((a, b) => b.k < a.k ? b : a);
    return (h ? 'Bu hafta ' : '') + (ab.length + 1) + '. sıradasın, üst sıraya ' + (nx.k - $G.kills + 1);
  }
  return $G.bestK ? 'Rekor ' + $G.bestK : '';
}

// koşu sonu ekranı: bu koşunun sıralamadaki yeri ve yükselişi (gönderimden önce, eski tabloya göre hesaplanır)
export function lbSonuc(k) {
  if (!GL.db || GL.ok != 1 || !GL.me || SET.lbu === 0 || k <= 0) return '';
  const bir = (rows, mine, ad) => {
    // tahtadaki sırayla aynı: eşit skorda önce ulaşan üstte (yeni koşu herkesten sonra)
    const old = mine ? mine.k : 0,
      at = r => 1 + rows.filter(x => x.id != GL.me && (x.k > r || x.k == r && (r != old || !mine || x.at <= mine.at))).length;
    if (k <= old) return `<span class=olbc><small>${ad}</small><b>${at(old)}.</b><em>en iyin ${old}</em></span>`;
    const yeni = at(k),
      eski = mine && (rows.includes(mine) || rows.some(x => x.id == GL.me) || rows.length < 200) ? at(old) : 0;
    return `<span class="olbc up"><small>${ad}</small><b>${yeni}.</b><em>${eski > yeni ? `↑ ${eski - yeni} sıra yükseldin` : eski ? 'yerini korudun' : 'sıralamaya girdin'}</em></span>`;
  };
  return `<div class=olb>${GL.kind == 'supa' && GL.hf == haftaBasi() ? bir(GL.wrows, GL.wmine, 'Bu hafta') : ''}${bir(GL.rows, GL.mine, 'Tüm zamanlar')}</div>`;
}

// seçili kahramana göre süzülmüş, sıralı satırlar (kahraman sekmesinde o kahramanın rekoru)
export function lbRows(h = haftalik(), c = $G.LBT) {
  return kaynak(h).rows.map(r => {
    if (c < 0) return r;
    const x = r.ch && r.ch[c];
    return x ? {
      id: r.id,
      ad: r.ad,
      k: Math.max(0, +x.k | 0),
      c,
      s: +x.s | 0,
      t: +x.t | 0,
      at: r.at
    } : null;
  }).filter(r => r && r.k > 0).sort((a, b) => b.k - a.k || a.at - b.at);
}

export function lbTab(i) {
  $G.LBT = i;
  lbRender();
}

export function lbMode(m) {
  $G.LBM = m;
  lbRender();
}

export function lbOpen() {
  $G.S = 'lb';
  lbRender();
  supaLoad();
}

export function lbRefresh() {
  if ($G.S == 'lb') lbRender();
}

// boyalı portre; yoksa eski çizim
const heroSvg = c => CR[c] ? ikon('h_' + CR[c].k, IC['h_' + CR[c].k] ? 'h_' + CR[c].k : WD[CR[c].w].ic, iconCol('h', CR[c].k)) : '';
const adi = r => r.id == GL.me ? esc(supaName() || 'Sen') : GL.kind == 'supa' ? esc(r.ad || 'Savaşçı') : 'Savaşçı';
const ayr = r => `${CR[r.c] ? CR[r.c].n : ''} · ${(r.s | 0) + 1}. aşama · ${fmt(r.t | 0)}`;
// kalan süre: "2 gün 6 saat", son gün "5 saat 12 dk"
function kalan(ms) {
  const d = Math.max(0, ms) / 6e4 | 0, g = d / 1440 | 0, sa = d % 1440 / 60 | 0, dk = d % 60;
  return g ? g + ' gün ' + sa + ' saat' : sa ? sa + ' saat ' + dk + ' dk' : dk + ' dk';
}

export function lbRender() {
  if ($G.LBT >= 0 && !heroOn($G.LBT)) $G.LBT = -1; // seçili sekme kadrodan çıkan karakterse Genel
  const h = haftalik(),
    src = kaynak(h);
  const tabs = [-1, ...heroIdx()].map(i => `<button class="${i == $G.LBT ? 'on' : ''}" role=tab aria-selected=${i == $G.LBT} ${A('lbTab', i)} title="${i < 0 ? 'Bütün kahramanlar' : CR[i].n}">${i < 0 ? '<span class="cw all">Σ</span>' : `<span class=cw>${heroSvg(i)}</span>`}<b>${i < 0 ? 'Genel' : CR[i].n}</b></button>`).join('');
  const modes = GL.kind == 'supa' && SET.lbv !== 0 ? `<div class="tabs lbmd" role=tablist aria-label="Dönem">${[['h', 'Bu hafta'], ['t', 'Tüm zamanlar']].map(([k, n]) => `<button class="tb${$G.LBM == k ? ' on' : ''}" role=tab aria-selected=${$G.LBM == k} ${A('lbMode', k)}>${n}</button>`).join('')}</div>` : '';
  const rows = lbRows(h),
    top = rows.slice(0, 30),
    meI = rows.findIndex(r => r.id == GL.me),
    mine = $G.LBT < 0 ? src.mine : src.mine && src.mine.ch[$G.LBT] ? { ...src.mine, ...src.mine.ch[$G.LBT], c: $G.LBT } : null,
    rank = meI >= 0 ? meI + 1 : mine && $G.LBT < 0 ? src.mrk : 0,
    tot = $G.LBT < 0 ? Math.max(src.tot, rows.length) : rows.length;

  // ortak tablo: ilk üç podyumda, sonrası liste; kendi satırın listede yoksa altta sabit
  let gl;
  if (SET.lbv === 0) gl = '<p class=sub>Ortak sıralama ayarlardan gizlendi.</p>';
  else if (!GL.db) gl = '<p class=sub>Ortak sıralama bu sürümde kapalı. Sayfayı Claude içinde açınca ya da Supabase ayarlı bir yayında diğer oyuncularla yarışırsın.</p>';
  else if (GL.ok == 0) gl = '<p class=sub>Sıralama yükleniyor.</p>';
  else if (GL.ok == 3) gl = '<p class=sub>Sıralamaya şu an ulaşılamıyor.</p>';
  else if (!rows.length) gl = `<div class=lbbos><b>${h ? 'Bu hafta tahta boş.' : 'Henüz kimse sıralamaya girmedi.'}</b><span>İlk koşuyu bitiren zirveye yerleşir.</span></div>`;
  else {
    const pod = [1, 0, 2].map(i => top[i] ? `<div class="pc p${i + 1}${top[i].id == GL.me && supaName() ? ' me' : ''}"><span class=md>${i + 1}</span><span class=hi>${heroSvg(top[i].c)}</span><b class=pn data-u="${top[i].id}">${adi(top[i])}</b><span class=pk>${top[i].k}</span><small>${ayr(top[i])}</small></div>` : '<div class="pc bos"></div>').join('');
    const satir = (r, i) => `<div class="lr${r.id == GL.me ? ' me' : ''}${i < 10 ? ' t10' : ''}"><span class=rk>${i + 1}</span><span class=hi>${heroSvg(r.c)}</span><span class=nm data-u="${r.id}">${adi(r)}${r.id == GL.me && supaName() ? '<em>sen</em>' : ''}</span><span class=x>${ayr(r)}</span><b class=k>${r.k}</b></div>`;
    const alt = meI >= 30 ? `<div class=lgap>···</div>${satir(rows[meI], meI)}` : meI < 0 && mine && rank ? `<div class=lgap>···</div>${satir(mine, rank - 1)}` : '';
    gl = `<div class=pod>${pod}</div>${top.length ? `<div class=lbl data-sy="lb-g${$G.LBT}${$G.LBM || ''}">${top.slice(0, 3).map((r, i) => satir(r, i).replace('class="lr', 'class="lr ilk3')).join('')}${top.slice(3).map((r, i) => satir(r, i + 3)).join('')}${alt}</div>` : alt ? `<div class=lbl>${alt}</div>` : ''}`;
  }
  const bilgi = GL.db && GL.ok == 1 && SET.lbv !== 0 ? `<p class=lbi>${h ? `<span>Yeni haftaya <b>${kalan(haftaSonu() - Date.now())}</b></span>` : '<span>Her oyuncunun en iyi koşusu</span>'}${tot ? `<span><b>${tot}</b> savaşçı</span>` : ''}</p>` : '';
  const sampiyon = h && $G.LBT < 0 && GL.prev.length && SET.lbv !== 0 ? `<p class=lbch><span>Geçen haftanın şampiyonları</span>${GL.prev.map((r, i) => `<b class=m${i + 1}>${adi(r)} <small>${r.k}</small></b>`).join('')}</p>` : '';

  // senin yerin: sıra, fark, hedef
  let yer = '';
  if (GL.db && GL.ok == 1 && SET.lbv !== 0 && GL.me) {
    const ad = GL.kind == 'supa' && supaName() ? `<b>${esc(supaName())}</b> adıyla yarışıyorsun.` : '';
    if (!mine || !rank) {
      const esik = rows.length >= 10 ? rows[9].k + 1 : 1;
      yer = `<section class=lbme><h3>Senin yerin</h3><p class=lbmb>${((h ? 'Bu hafta ' : '') + ($G.LBT >= 0 ? CR[$G.LBT].n + ' ile ' : '') + (h ? 'henüz koşmadın.' : 'henüz sıralamada yoksun.')).replace(/^./, c => c.toLocaleUpperCase('tr-TR'))}</p><p class=lbmt>${rows.length >= 10 ? `İlk 10'a girmek için <b>${esik}</b> öldürme yeter.` : 'Bir koşu bitir, tahtaya adını yaz.'}</p><p class=lbmn>${ad}</p></section>`;
    } else {
      const ust = meI > 0 ? rows[meI - 1] : null,
        ilk = rows[0],
        pct = tot >= 5 && rank / tot <= .5 ? Math.max(1, Math.ceil(rank / tot * 100)) : 0, // yalnız üst yarıda: "ilk %92" övünülecek bir şey değil
        hedef = rank == 1 ? (rows[1] ? `Zirvedesin. İkinciyle aranda <b>${mine.k - rows[1].k}</b> öldürme var.` : 'Zirvedesin.') : ust ? `Bir üst sıraya <b>${ust.k - mine.k + 1}</b> öldürme (${rank - 1}. <b>${adi(ust)}</b>).` : '',
        on = rank > 10 && rows[9] ? `İlk 10'a <b>${rows[9].k - mine.k + 1}</b> öldürme.` : rank > 2 && ilk ? `Zirveye <b>${ilk.k - mine.k + 1}</b> öldürme.` : '';
      yer = `<section class="lbme${rank <= 3 ? ' m' + rank : ''}"><h3>Senin yerin</h3><div class=lbmr><b>${rank}.</b><span><i><b>${mine.k}</b> öldürme</i>${pct ? `<small>ilk %${pct}</small>` : ''}</span></div>${pct ? `<i class=lbmp><em style="width:${100 - pct + 1}%"></em></i>` : ''}<p class=lbmt>${hedef}${on ? ' ' + on : ''}</p><p class=lbmn>${ad}</p></section>`;
    }
  }
  const loc = $G.LB.filter(r => $G.LBT < 0 || r.c == $G.LBT),
    lc = loc.length ? `<div class=lbl data-sy="lb-l${$G.LBT}">${loc.map((r, i) => `<div class=lr><span class=rk>${i + 1}</span><span class=hi>${heroSvg(r.c)}</span><span class=nm>${new Date(r.d || 0).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}${r.w ? ' ✓' : ''}</span><span class=x>${r.m ? (MAPS.find(m => m.k == r.m) || { n: r.m }).n + ' K' + (r.tr || 1) + ' · ' : ''}${(r.s | 0) + 1}. aşama · ${fmt(r.t | 0)}</span><b class=k>${r.k | 0}</b></div>`).join('')}</div>` : '<p class=sub>Henüz koşu yok.</p>';
  const st = 0; // kaydırma yok: listeler sayfalı (ui/sayfa.js)
  ov(`<div class="sx lbx syh"><header class=sxh><div><p class=kk>Tek koşuda en çok öldürme</p><h2>Sıralama</h2></div><div class=mt>${modes || `<span class=chip>${$G.LBT < 0 ? 'Bütün kahramanlar' : CR[$G.LBT].n}</span>`}</div></header><div class=lbt2 role=tablist aria-label="Kahraman">${tabs}</div><div class=lbg><section class=lbm>${bilgi}${gl}${sampiyon}</section><aside>${yer}<section class=lbloc><h3>Senin rekorların <small>bu cihaz</small></h3>${lc}</section></aside></div><footer class=sxf><span class=fnote><b class=ck>✓</b> İşaretli koşular çıkış geçidinden çıktı. Meydan okumalı koşular yüklenmez.</span><button class=act ${A('menu')}>Geri dön <kbd>Esc</kbd></button></footer></div>`, st ? 'mid noan' : OV.querySelector('.lbx') ? 'mid noan' : 'mid');
  lbNames();
}

export async function lbNames() {
  if (!GL.user) return;
  const els = [...OV.querySelectorAll('[data-u]')],
    ids = [...new Set(els.map(e => e.dataset.u))];
  if (!ids.length) return;
  let ps;
  try {
    ps = await GL.user.profiles(ids);
  } catch (e) {
    return;
  }
  for (const e of els) {
    const p = ps && ps[e.dataset.u];
    if (!p) continue;
    if (e.tagName == 'IMG') {
      if (p.avatarUrl) e.src = p.avatarUrl;
    } else if (e.dataset.u != GL.me) e.textContent = p.name || 'Adsız savaşçı';
  }
}
