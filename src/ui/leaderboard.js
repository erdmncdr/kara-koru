// ui/leaderboard.js · Kara Koru
// Bu dosya tek dosyalık sürümden (v22) otomatik ayrıldı. Ortak oyun durumu core/store.js içindeki $G nesnesinde.

import { $G } from '../core/store.js';
import { SET } from '../core/settings.js';
import { ov } from '../core/helpers.js';
import { OV, fmt } from '../core/state.js';
import { CR, heroIdx, heroOn } from '../game/heroes.js';
import { MAPS, WD } from '../data/content.js';
import { A } from './actions.js';
import { IC, iconCol, svg } from './icons.js';
import { cleanCh, supaAllow, supaFlush, supaIdent, supaMine, supaName, supaOn, supaRecord, supaRename, supaRows } from './supa.js';

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
    rows: [],
    ok: 0,
    mine: null
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
          GL.me = supaIdent().id;
          supaAllow(() => SET.lbu !== 0);
          supaLoad();
          supaFlush(() => supaLoad(1)); // önceki oturumdan kalan gönderilmemiş rekor
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
// Supabase tablosunu yeniden okur (en çok 15 saniyede bir, zorla değilse); kendi satırı ilk 200'ün dışındaysa ayrıca okunur
export async function supaLoad(force) {
  if (GL.kind != 'supa' || (!force && Date.now() - supaT < 15000)) return;
  supaT = Date.now();
  try {
    GL.rows = (await supaRows()).map(r => glRow(r.id, r));
    const m = GL.rows.find(x => x.id == GL.me) || await supaMine().catch(() => null);
    if (m) GL.mine = glRow(m.id, m);
    GL.ok = 1;
    $G.hk = '';
  } catch (e) {
    if (GL.ok != 1) GL.ok = 3;
  }
  lbRefresh();
}

export async function glSubmit(r) {
  if (!GL.db || !GL.me || SET.lbu === 0) return;
  // Supabase: rekor giden kutusuna girer, sunucudaki satırla birleştirilip sırayla gönderilir (ui/supa.js)
  if (GL.kind == 'supa') return supaRecord(r, () => supaLoad(1));
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
}

export function klTarget() {
  if (GL.db && GL.ok == 1 && GL.rows.length) {
    const ab = GL.rows.filter(x => x.id != GL.me && x.k >= $G.kills);
    if (!ab.length) return 'Sıralamada 1.';
    const nx = ab.reduce((a, b) => b.k < a.k ? b : a);
    return ab.length + 1 + '. sıradasın, üst sıraya ' + (nx.k - $G.kills + 1);
  }
  return $G.bestK ? 'Rekor ' + $G.bestK : '';
}

export function lbRows() {
  const c = $G.LBT;
  return GL.rows.map(r => {
    if (c < 0) return r;
    const x = r.ch && r.ch[c];
    return x ? {
      id: r.id,
      ad: r.ad,
      k: Math.max(0, +x.k | 0),
      c,
      s: +x.s | 0,
      t: +x.t | 0
    } : null;
  }).filter(r => r && r.k > 0).sort((a, b) => b.k - a.k).slice(0, 30);
}

export function lbTab(i) {
  $G.LBT = i;
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

export function lbRender() {
  if ($G.LBT >= 0 && !heroOn($G.LBT)) $G.LBT = -1; // seçili sekme kadrodan çıkan karakterse Genel
  const tabs = [-1, ...heroIdx()].map(i => `<button class="${i == $G.LBT ? 'on' : ''}" role=tab aria-selected=${i == $G.LBT} ${A('lbTab', i)} title="${i < 0 ? 'Bütün kahramanlar' : CR[i].n}">${i < 0 ? '<span class="cw all">Σ</span>' : `<span class=cw>${svg(IC['h_' + CR[i].k] ? 'h_' + CR[i].k : WD[CR[i].w].ic, iconCol('h', CR[i].k))}</span>`}<b>${i < 0 ? 'Genel' : CR[i].n}</b></button>`).join('');
  const ln = r => `<span class=x>${CR[r.c] ? CR[r.c].n : ''} · ${r.m ? (MAPS.find(m => m.k == r.m) || { n: r.m }).n + ' K' + (r.tr || 1) + ' · ' : ''}${(r.s | 0) + 1}. aşama${r.w ? ' ✓' : ''} · ${fmt(r.t | 0)}</span>`,
    rows = lbRows(),
    loc = $G.LB.filter(r => $G.LBT < 0 || r.c == $G.LBT);
  const gl = SET.lbv === 0 ? '<p class=sub>Ortak sıralama ayarlardan gizlendi.</p>' : !GL.db ? '<p class=sub>Ortak sıralama bu sürümde kapalı. Sayfayı Claude içinde açınca ya da Supabase ayarlı bir yayında diğer oyuncularla yarışırsın.</p>' : GL.ok == 0 ? '<p class=sub>Sıralama yükleniyor.</p>' : GL.ok == 3 ? '<p class=sub>Sıralamaya şu an ulaşılamıyor.</p>' : rows.length ? `<div class=lbl>${rows.map((r, i) => `<span class=rk>${i + 1}</span>${GL.kind == 'supa' ? '<span></span>' : `<img class=av data-u="${r.id}" alt="">`}<span class="nm${r.id == GL.me ? ' me' : ''}" data-u="${r.id}">${r.id == GL.me ? 'Sen' : GL.kind == 'supa' ? esc(r.ad || 'Savaşçı') : 'Savaşçı'}</span><span class=k>${r.k}</span>${ln(r)}`).join('')}</div>` : '<p class=sub>Henüz kimse sıralamaya girmedi. İlk sen ol.</p>';
  const lc = loc.length ? `<div class=lbl>${loc.map((r, i) => `<span class=rk>${i + 1}</span><span></span><span class=nm>${new Date(r.d || 0).toLocaleDateString('tr-TR')}</span><span class=k>${r.k | 0}</span>${ln(r)}`).join('')}</div>` : '<p class=sub>Henüz koşu yok.</p>';
  // ad kutusundaki yazılmamış taslak ve imleç yeniden çizimde korunur (yükleme ya da gönderim bitince ekran yenilenir)
  const pin = /** @type {HTMLInputElement} */ (OV.querySelector('#lbad')),
    draft = pin ? pin.value : null,
    foc = pin && document.activeElement === pin,
    sel = pin ? [pin.selectionStart, pin.selectionEnd] : null;
  const nmForm = GL.kind == 'supa' && SET.lbv !== 0 ? `<form class=lbad><label for=lbad>Sıralamadaki adın</label><input id=lbad maxlength=20 autocomplete=off value="${esc(draft != null ? draft : supaName())}"><button class="act sm" type=submit>Kaydet</button>${GL.note ? `<p class=sub>${esc(GL.note)}</p>` : ''}</form>` : '';
  ov(`<div class="sx lbx"><header class=sxh><div><p class=kk>Tek koşuda en çok öldürme</p><h2>Sıralama</h2></div><div class=mt><span class=chip>${$G.LBT < 0 ? 'Bütün kahramanlar' : CR[$G.LBT].n}</span></div></header><div class=lbt2 role=tablist aria-label="Kahraman">${tabs}</div><div class=mcols><section><h3>Ortak sıralama</h3>${nmForm}${gl}</section><section><h3>Senin rekorların</h3>${lc}</section></div><footer class=sxf><span class=fnote>✓ çıkış geçidinden çıkan koşu. Meydan okumalı koşular yüklenmez.</span><button class=act ${A('menu')}>Geri dön <kbd>Esc</kbd></button></footer></div>`, OV.querySelector('.lbx') ? 'mid noan' : 'mid');
  const f = OV.querySelector('form.lbad');
  if (f && foc) {
    const ni = /** @type {HTMLInputElement} */ (f.querySelector('input'));
    ni.focus();
    try {
      ni.setSelectionRange(sel[0], sel[1]);
    } catch (e) {}
  }
  if (f) f.addEventListener('submit', async ev => {
    ev.preventDefault();
    const i = f.querySelector('input');
    i.value = supaRename(i.value, () => supaLoad(1));
    GL.note = 'Ad kaydedildi.';
    lbRefresh();
  });
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
