// ui/menus.js · Kara Koru
// Bu dosya tek dosyalık sürümden (v22) otomatik ayrıldı. Ortak oyun durumu core/store.js içindeki $G nesnesinde.

import { $G } from '../core/store.js';
import { aVol, sfx } from '../audio/engine.js';
import { ov, skFree, toast } from '../core/helpers.js';
import { $ } from '../core/util.js';
import { VFX } from '../engine/vfx.js';
import { SET, saveSet } from '../core/settings.js';
import { OV, fmt } from '../core/state.js';
import { ACHD, ACHM, ITD, MAPS, ML, MU, QD, RAR, STATS, TDF, TY, WD, cnt, fmtC, fmtS, fmtU, inc, mu, saveMeta, stl, unl } from '../data/content.js';
import { BOSSP, KINDS } from '../data/enemies.js';
import { mapOf, mapOpen, selChal, selMap, tierOpen } from '../game/run.js';
import { A, call } from './actions.js';
import { CHAL } from '../data/challenges.js';
import { chalCount, chalDone, chalOf, chalSilver } from '../game/challenge.js';
import { swT } from '../game/stats.js';
import { sc } from '../engine/renderer.js';
import { qCheck, resetRun, start, achCheck } from '../game/flow.js';
import { CR, HATS, SKINS, hatName, hero, heroIdx, rankOf, rankProg } from '../game/heroes.js';
import { calc, newW } from '../game/stats.js';
import { back, buildHTML, hudItems, hudSlots, STI } from './cards.js';
import { goal } from './hud.js';
import { svg, iconCol, IC } from './icons.js';
import { glSubmit, lbAdd, lbSonuc } from './leaderboard.js';
import { hesap } from './hesap.js';
import { BIO } from '../world/terrain.js';

export let SFM;
const CLK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.500 2"/></svg>',
  COIN = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#e2b04a" stroke="#8a5a14" stroke-width="2"/><circle cx="12" cy="12" r="5.500" fill="none" stroke="#fff0b0" stroke-width="1.800"/></svg>',
  SILV = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#cfd6e6" stroke="#6f7a90" stroke-width="2"/><circle cx="12" cy="12" r="5.500" fill="none" stroke="#fff" stroke-width="1.800"/></svg>',
  LOCK = '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M4.500 7V5a3.500 3.500 0 0 1 7 0v2h.800c.400 0 .700.300.700.700v5.600c0 .400-.300.700-.700.700H3.700a.700.700 0 0 1-.700-.700V7.700c0-.400.300-.700.700-.700Zm1.800 0h3.400V5a1.700 1.700 0 0 0-3.400 0Z"/></svg>';
export { CLK, COIN, SILV, LOCK };

export function menu(kb) {
  if (!$G.P || $G.P.tt > 0) resetRun();
  $G.S = 'menu';
  $G.menuPg = 'ana';
  document.body.classList.remove('on');
  renderMenu(kb);
}

// Menü sayfaları: ana → kahraman → harita. Enter ileri, Esc geri götürür (input.js).
export function menuPage(k) {
  if (k == 'harita' && !unl(CR[$G.CI].lock)) {
    sfx('deny');
    return;
  }
  $G.menuPg = k;
  sfx('ui');
  renderMenu(1);
}

function selSum() {
  const c = CR[$G.CI],
    m = MAPS.find(x => x.k == $G.MSEL.map) || MAPS[0],
    ch = $G.MSEL.chal;
  return `${c.n} · ${m.n} K${$G.MSEL.tier}${ch ? ' · ' + chalOf(ch).n : ''}`;
}

export function mapHTML() {
  return `<div class=mg role=group aria-label="Harita ve kademe">${MAPS.map(m => {
    const open = mapOpen(m),
      sel = $G.MSEL.map == m.k,
      best = $G.META.tier[m.k] || 0,
      ts = m.tiers || 3;
    return `<div class="mc${sel ? ' on' : ''}${open ? '' : ' lk'}"><div class=mch><b>${m.n}</b><small>${open ? best ? `en yüksek kademe ${best}` : 'henüz bitirilmedi' : 'kilitli'}</small></div><p>${open ? m.d : 'Açmak için: ' + m.ud}</p>${open ? `<span class=tiers>${Array.from({ length: ts }, (_, i) => i + 1).map(t => `<button class="tb${sel && $G.MSEL.tier == t ? ' on' : ''}" ${tierOpen(m.k, t) ? '' : 'disabled'} ${A('pickMap', m.k, t)} title="${tierOpen(m.k, t) ? (t == 1 ? '1 aşama + boss' : t + ' aşama, son boss ' + (t == 3 ? 'arenada' : 'kapıda')) : 'Önce Kademe ' + (t - 1) + ' bitirilmeli'}">Kademe ${t}</button>`).join('')}</span>` : ''}</div>`;
  }).join('')}</div>`;
}

// Seçili karakter için kostüm ve şapka seçici
export function custHTML() {
  const ci = $G.CI,
    r = rankOf(ci),
    [cur, need] = rankProg(ci),
    skCur = $G.META.skin['cur' + ci] || '',
    sk = [`<button class="tb${skCur ? '' : ' on'}" ${A('selSkin', ci, '')}>Varsayılan</button>`].concat(SKINS.filter(s => !s.only || s.only == CR[ci].k).map(s => {
      const own = $G.META.skin[ci + ':' + s.k],
        ok = s.f(ci);
      return `<button class="tb${skCur == s.k ? ' on' : ''}" ${own || ok ? '' : 'disabled'} title="${s.d}${own ? '' : ok ? ` · ${s.cost} gümüş` : ''}" ${own ? A('selSkin', ci, s.k) : A('buySkin', ci, s.k)}>${s.n}${own ? '' : ok ? ` <small>${s.cost}</small>` : ''}</button>`;
    })).join(''),
    hatCur = $G.META.hat.cur || '',
    owned = HATS.filter(h => $G.META.hat[h.k]),
    buyable = HATS.filter(h => !$G.META.hat[h.k] && $G.META.l['hat_' + h.k]),
    hatCost = h => h.k == 'noel' ? 18 : 15,
    ht = owned.length || buyable.length ? [`<button class="tb${hatCur ? '' : ' on'}" ${A('selHat', '')}>Yok</button>`].concat(owned.map(h => `<button class="tb${hatCur == h.k ? ' on' : ''}" ${A('selHat', h.k)}>${h.n}</button>`), buyable.map(h => `<button class="tb" title="${h.d} · ${hatCost(h)} gümüş" ${A('buyHat', h.k)}>${h.n} <small>${hatCost(h)}</small></button>`)).join('') : '<small class=dim>Şapkalar başarımlarla açılır, gümüşle alınır. Otağ’daki görev listesine bak.</small>';
  return `<div class=cust><div class=rk><b>Rütbe ${r}</b><i><em style="width:${r >= 100 ? 100 : Math.min(100, cur / need * 100)}%"></em></i><small>${r >= 100 ? 'En yüksek' : cur + ' / ' + need + ' tecrübe'}</small></div><div class=crow><span>Kostüm</span><span class=tiers>${sk}</span></div><div class=crow><span>Şapka</span><span class=tiers>${ht}</span></div></div>`;
}

export function selSkin(ci, k) {
  if (k && !$G.META.skin[ci + ':' + k]) return;
  $G.META.skin['cur' + ci] = k;
  saveMeta();
  sfx('ui');
  selC(ci, 1, 1);
}

export function buySkin(ci, k) {
  const s = SKINS.find(x => x.k == k);
  if (!s || !s.f(ci) || $G.META.s < s.cost) {
    sfx('deny');
    return;
  }
  $G.META.s -= s.cost;
  $G.META.skin[ci + ':' + k] = 1;
  $G.META.skin['cur' + ci] = k;
  saveMeta();
  sfx('chest');
  selC(ci, 1, 1);
}

export function buyHat(k) {
  const h = HATS.find(x => x.k == k),
    cost = k == 'noel' ? 18 : 15;
  if (!h || $G.META.hat[k] || !$G.META.l['hat_' + k] || $G.META.s < cost) {
    sfx('deny');
    return;
  }
  $G.META.s -= cost;
  $G.META.hat[k] = 1;
  $G.META.hat.cur = k;
  saveMeta();
  sfx('chest');
  selC($G.CI, 1, 1);
}

export function selHat(k) {
  if (k && !$G.META.hat[k]) return;
  $G.META.hat.cur = k;
  saveMeta();
  sfx('ui');
  selC($G.CI, 1, 1);
}

export function buyChar(k) {
  const c = CR.find(x => x.k == k);
  if (!c || !c.lock || $G.META.l[c.lock] || !$G.META.l['q_' + c.lock] || $G.META.s < (c.cost || 0)) {
    sfx('deny');
    return;
  }
  $G.META.s -= c.cost || 0;
  $G.META.l[c.lock] = 1;
  saveMeta();
  sfx('chest');
  toast(c.n + ' açıldı');
  otag('kilit');
}

export function chalHTML() {
  const cur = $G.MSEL.chal || '',
    m = $G.MSEL.map, t = $G.MSEL.tier,
    done = CHAL.filter(c => chalDone(c, m, t)).length;
  return `<details class=chd2 ${cur ? 'open' : ''}><summary>Meydan okuma (isteğe bağlı): <b>${cur ? chalOf(cur).n + ' ×' + chalOf(cur).m : 'Yok'}</b> <small>${done}/${CHAL.length} tamam · toplam ${chalCount()}, kalıcı gümüş +%${chalCount()}</small></summary><p class=chdesc>Koşuyu zorlaştırır, gümüş çarpanı verir. Her harita ve kademede ayrı sayılır.</p><div class=chl>${CHAL.map(c => `<button class="tb${cur == c.k ? ' on' : ''}${chalDone(c, m, t) ? ' dn' : ''}" title="${c.d}" ${A('pickChal', c.k)}>${chalDone(c, m, t) ? '✓ ' : ''}${c.n} <small>×${c.m}</small></button>`).join('')}</div>${cur ? `<p class=chdesc>${chalOf(cur).d} Gümüş ×${chalOf(cur).m}. Sıralamaya yüklenmez.</p>` : ''}</details>`;
}

// düğme eylemleri (ui/actions.js data-act): bileşik tıklamalar ve ayar denetimleri
export function pickMap(k, t) {
  selMap(k, t);
  renderMenu();
}

export function pickChal(k) {
  selChal(k);
  renderMenu();
}

// ayar geri çağrısı dizgesinden ('applyQ();') işlev adı
// yalnız düz işlev adı geçerli ('applyQ();' → 'applyQ'); argümanlı çağrı için ayrı bir dışa aktarım yaz (opApply gibi)
const cbName = cb => {
  const n = String(cb).replace(/[();\s]/g, '');
  if (!/^[A-Za-z_$][\w$]*$/.test(n)) console.warn('Kara Koru: geri çağrı işlev adı olmalı', cb);
  return n;
};

function setCb(el) {
  if (el.dataset.cb) call(el.dataset.cb);
}

export function setRange(el) {
  const k = el.dataset.k, mn = +el.dataset.mn, mx = +el.dataset.mx, v = +el.value;
  SET[k] = v;
  setCb(el);
  el.style.setProperty('--v', (v - mn) / (mx - mn) * 100 + '%');
  const b = el.parentNode.querySelector('b');
  if (b) b.textContent = SFM[el.dataset.f](v);
}

export function setCheck(el) {
  SET[el.dataset.k] = el.checked ? 1 : 0;
  setCb(el);
}

// parçacık ve mermi saydamlığı kaydırıcısının geri çağrısı
export function opApply() {
  VFX.setOp(SET.po);
}

export function setSeg(k, v, cb) {
  SET[k] = v;
  if (cb) call(cb);
  settings(1);
}

export function renderMenu(kb) {
  const pg = $G.menuPg || 'ana';
  if (pg == 'kahraman') return heroPage(kb);
  if (pg == 'harita') return mapPage();
  ov(`<div class="mn2 home"><p class=ins aria-hidden=true>𐱅𐰭𐰼𐰃⁚𐰴𐰺𐰀⁚𐱅𐰇𐰼𐰜</p><h1>Kara Koru</h1><p class=lead>Türk mitolojisinden bir hayatta kalma oyunu.</p>
 <nav class=mnav2>
  <button class="mi pri" ${A('menuPage', 'kahraman')} autofocus><b>Oyna</b><small>${selSum()}</small></button>
  <button class=mi ${A('otag')}><b>Otağ</b><small>${$G.META.s} gümüş</small></button>
  <button class=mi ${A('lbOpen')}><b>Sıralama</b>${$G.bestK ? `<small>rekor ${$G.bestK}</small>` : ''}</button>
  <button class=mi ${A('settings')}><b>Ayarlar</b></button>
  <button class=mi ${A('showHelp')}><b>Nasıl oynanır</b><small>F1</small></button>
  ${hesap() ? `<button class=mi ${A('hesapCik')}><b>Çıkış yap</b><small>${hesap().ad.replace(/[&<>"']/g, '')}</small></button>` : ''}
 </nav>
 ${hesap() ? '<p class=sub id=hesapnot role=status aria-live=polite></p>' : ''}
 <p class=tch>Sol yarıda sürükleyerek yürü, sağ yarıda kamerayı çevir. Sandık, sunak ve kapılar yanına gelince açılır.</p></div>`, sideCls('ana'));
  const b = OV.querySelector('.mi');
  b && kb && b.focus();
}

// Aynı sayfa yeniden çizilirken (kahraman, kostüm, kademe seçimi) giriş animasyonu yeniden oynamaz
function sideCls(pg) {
  const same = $G.menuPgDrawn == pg && OV.className.startsWith('side');
  $G.menuPgDrawn = pg;
  return same ? 'side noan' : 'side';
}

// 1/2: kahraman seçimi. Üstte portre karoları, altında seçilenin künyesi, rütbe ve kostüm; sağda 3B model.
function heroPage(kb) {
  const c = CR[$G.CI],
    lk = !unl(c.lock),
    rdy = lk && $G.META.l['q_' + c.lock],
    stat = (c.p || '').split(/,\s*/).filter(Boolean).map(x => `<i>${x}</i>`).join(''),
    HI = heroIdx();
  ov(`<div class="mn2 pg"><header class=mph><span class=stp aria-label="Adım 1 / 2"><i class=on></i><i></i></span><h2>Kahraman</h2><span class=cur>${HI.filter(i => unl(CR[i].lock)).length} / ${HI.length} açık</span></header>
 <div class=hg2 role=radiogroup aria-label="Karakter">${HI.map(i => {
    const c = CR[i],
      l = !unl(c.lock);
    return `<button class="hc${i == $G.CI ? ' on' : ''}${l ? ' lk' : ''}${l && $G.META.l['q_' + c.lock] ? ' rdy' : ''}" role=radio aria-checked=${i == $G.CI} ${A('selC', i)} title="${c.n}${l ? ' (kilitli)' : ', Rütbe ' + rankOf(i)}"><span class=cw>${svg(IC['h_' + c.k] ? 'h_' + c.k : WD[c.w].ic, iconCol('h', c.k))}</span><b>${c.n}</b></button>`;
  }).join('')}</div>
 <section class=hinf>
  <div class=hdt><h3>${c.n}</h3>${lk ? '<span class="tag lk">Kilitli</span>' : `<span class=tag>Rütbe ${rankOf($G.CI)}</span>`}</div>
  <p class=hdd>${c.d}</p>
  <div class=hdk><span class="ic w">${svg(WD[c.w].ic, iconCol('w', c.w))}</span><span><small>Başlangıç silahı</small><b>${WD[c.w].n}</b></span><span class=hds>${stat}</span></div>
  <p class=hdp>${c.ps}</p>
  ${lk ? `<p class=hdl>Açmak için: ${c.ud || ''}${rdy ? ` Koşul tamam, Otağ’da ${c.cost} gümüşle satın al.` : ''}</p>` : ''}
 </section>
 ${lk ? '' : custHTML()}
 <footer class=row><button class="act alt" ${A('menuPage', 'ana')}>Geri <kbd>Esc</kbd></button><button class=act ${A('menuPage', 'harita')} ${lk ? 'disabled' : ''}>Devam: harita seç <kbd>Enter</kbd></button></footer></div>`, sideCls('kahraman'));
  if (kb) {
    const b = OV.querySelector('.hc.on');
    b && b.focus();
  }
}

// 2/2: harita, kademe ve isteğe bağlı meydan okuma
function mapPage() {
  const c = CR[$G.CI];
  ov(`<div class="mn2 pg"><header class=mph><span class=stp aria-label="Adım 2 / 2"><i class=on></i><i class=on></i></span><h2>Harita</h2><span class=cur>${c.n}</span></header>
 ${mapHTML()}
 <p class=hint>Kademe N, aynı haritada art arda N aşamadır. Her aşamada Boss Kapısı’nı bul, boss’u devir, açılan geçitten bir sonraki aşamaya geç. Son aşamanın boss’u devrilince kademe biter ve bir üst kademe açılır. Diğer haritalar ayrı koşudur, görevlerle açılır.</p>
 ${chalHTML()}
 <footer class=row><button class="act alt" ${A('menuPage', 'kahraman')}>Geri <kbd>Esc</kbd></button><button class=act ${A('start')}>Koruya gir <small>${selSum()}</small> <kbd>Enter</kbd></button></footer></div>`, sideCls('harita'));
}

export function selC(i, kb, keep) {
  if (i == $G.CI && !kb) return;
  // Klavye/kumanda i = CI ± 1 ile gezer: etkin kadro içinde sarar, kaldırılan karakterleri (off) atlar
  const HI = heroIdx();
  if (!HI.includes(i)) {
    const p = HI.indexOf($G.CI), d = i < $G.CI ? -1 : 1;
    i = p < 0 ? HI[0] : HI[(p + d + HI.length) % HI.length];
  }
  $G.CI = i;
  try {
    localStorage.setItem('kk_ci', $G.CI);
  } catch (e) {}
  if ($G.H) {
    sc.remove($G.H.g);
    skFree($G.H);
  }
  ;
  $G.H = hero($G.CI);
  $G.H.g.traverse(o => o.castShadow = true);
  sc.add($G.H.g);
  $G.P.W = [newW(CR[$G.CI].w)];
  calc();
  $G.P.hp = $G.P.mh;
  sfx('ui');
  renderMenu(kb);
}

// Otağ simgeleri: stat yükseltmeleri STI'den, diğerleri bu tablodan
const MUI = { rr: 'dice', sk: 'run', bn: 'skull', ws: 'sword', ts: 'scroll', tg: 'wrench', bb: 'orb', sg: 'coin', sv: 'silver' },
  muIcon = u => `<span class=ic style="--ik:${iconCol('s', u.k)}">${svg(MUI[u.k] || STI[u.st] || 'star', iconCol('s', u.k))}</span>`,
  mlIcon = u => `<span class=ic style="--ik:${iconCol('i', u.k)}">${svg(WD[u.k] ? WD[u.k].ic : u.k == 'win' ? 'star' : u.k == 'boss' ? 'skull' : u.k == 'shop' ? 'coin' : u.k == 'kazan' ? 'pot' : u.k == 'leg' ? 'gem' : u.k == 'mezar' ? 'ghost2' : u.k == 'kos' ? 'orb' : 'key', iconCol('i', u.k))}</span>`;

export function otag(tab = 'guc') {
  const again = $G.S == 'otag';
  $G.S = 'otag';
  $G.otagTab = tab;
  const pip = (l, m) => `<i class=pb><em style="width:${l / m * 100}%"></em></i><small>${l}/${m}</small>`;
  const ur = MU.map(u => {
    const l = mu(u.k),
      c = muCost(u, l),
      mx = l >= u.m;
    const locked = muLocked(u),
      qd = Object.keys($G.META.q).length;
    return `<div class=mrow>${muIcon(u)}<div><b>${u.n}</b><span>${fmtU(u)}${u.qn ? (qx => ` <em class=qn>(${qx} görev gerekir, ${Math.min(qd, qx)}/${qx})</em>`)(Array.isArray(u.qn) ? u.qn[Math.min(u.qn.length - 1, l)] : u.qn) : ''}${u.unl ? ` <em class=qn>(${u.unl} kilit gerekir, ${Math.min(unlCount(), u.unl)}/${u.unl})</em>` : ''}</span></div><span class=pips>${pip(l, u.m)}</span>${locked && !mx ? `<span class=lkx>${LOCK}Kilitli</span>` : `<button class="act alt sm${mx ? ' mx' : ''}" ${A('buyMU', u.k)} ${mx || $G.META.s < c ? 'disabled' : ''}>${mx ? 'En üst' : c + ' gümüş'}</button>`}</div>`;
  }).join('');
  const lr = heroIdx().map(i => CR[i]).filter(c => c.lock).map(c => {
    const h = $G.META.l[c.lock],
      q = $G.META.l['q_' + c.lock];
    return `<div class=mrow><span class=ic style="--ik:${iconCol('h', c.k)}">${svg('h_' + c.k, iconCol('h', c.k))}</span><div><b>${c.n}</b><span>${h ? c.d : q ? 'Koşul tamam. ' + c.d : c.ud}</span></div><span></span><button class="act alt sm" ${A('buyChar', c.k)} ${h || !q || $G.META.s < (c.cost || 0) ? 'disabled' : ''}>${h ? 'Açık' : (c.cost || 0) + ' gümüş'}</button></div>`;
  }).join('') + ML.map(u => {
    const h = $G.META.l[u.k];
    return `<div class=mrow>${mlIcon(u)}<div><b>${u.n}</b><span>${u.d}</span></div><span></span><button class="act alt sm" ${A('buyML', u.k)} ${h || $G.META.s < u.c ? 'disabled' : ''}>${h ? 'Açık' : u.c + ' gümüş'}</button></div>`;
  }).join('');
  // görevler: sürenler ilerlemeye göre üstte (en yakını başta), bitenler katlanmış listede
  const qrow = q => {
    const dn = $G.META.q[q.k],
      [c, m] = q.f();
    return `<div class="mrow q${dn ? ' dn' : ''}"><span class="ic q${dn ? ' ok' : ''}">${svg(dn ? 'star' : 'scroll', dn ? '#f0c45a' : '#a0978a')}</span><div><b>${q.n}</b><span>${dn ? 'Tamamlandı' : Math.min(c, m).toLocaleString('tr') + ' / ' + m.toLocaleString('tr')}</span><i class=qb><em style="width:${Math.min(100, c / m * 100)}%"></em></i></div><span></span><span class=rw>+${q.r} gümüş</span></div>`;
  };
  const qOpen = QD.filter(q => !$G.META.q[q.k]).map(q => { const [c, m] = q.f(); return { q, p: m ? c / m : 0 }; }).sort((x, y) => y.p - x.p),
    qDone = QD.filter(q => $G.META.q[q.k]),
    QN = 40;
  const qr = `<p class=osub>${qOpen.length} görev sürüyor, ${qDone.length} tamamlandı. Bitmeye en yakın olanlar üstte.</p>
 ${qOpen.slice(0, QN).map(x => qrow(x.q)).join('')}${qOpen.length > QN ? `<details class=omore><summary>Kalan ${qOpen.length - QN} görev</summary>${qOpen.slice(QN).map(x => qrow(x.q)).join('')}</details>` : ''}
 ${qDone.length ? `<details class=omore><summary>Tamamlananlar ${qDone.length}</summary>${qDone.map(qrow).join('')}</details>` : ''}
 <details class=omore><summary>Başarımlar ${ACHM.concat(ACHD).filter(a => $G.META.achv[a.k]).length} / ${ACHM.length + ACHD.length}</summary>${achHTML()}</details>`;
  if (tab == 'basarim') tab = 'gorev';
  if (tab == 'bestiyer') tab = 'koleksiyon';
  if (tab == 'havuz' && !mu('tg')) tab = 'guc';
  $G.otagTab = tab;
  const tabs = [['guc', 'Güçler'], ['kilit', 'Kilitler'], ['gorev', `Görevler <small>${qDone.length}/${QD.length}</small>`], ['koleksiyon', 'Koleksiyon']].concat(mu('tg') ? [['havuz', 'Havuz']] : []),
    body = tab == 'guc' ? ur : tab == 'kilit' ? lr : tab == 'gorev' ? qr : tab == 'havuz' ? poolHTML() : collHTML() + bestHTML();
  ov(`<div class="sx otag"><header class=sxh><div><p class=kk>Kalıcı güçler, kilitler, görevler</p><h2>Otağ</h2></div><div class=mt><span class="chip sv">${SILV}${$G.META.s} gümüş</span></div></header>
 <div class=tabs>${tabs.map(([k, n]) => `<button class="tb${tab == k ? ' on' : ''}" ${A('otag', k)}>${n}</button>`).join('')}</div>
 <div class=mone>${body}</div><footer class=sxf><button class=act ${A('menu')}>Geri dön <kbd>Esc</kbd></button></footer></div>`, again && OV.querySelector('.otag') ? 'mid noan' : 'mid');
}

export function muCost(u, l) {
  return Array.isArray(u.c) ? u.c[Math.min(l, u.c.length - 1)] : u.c * (l + 1);
}

// açılan kilit sayısı (görev uygunluğu ve şapkalar sayılmaz)
export function unlCount() {
  return Object.keys($G.META.l).filter(k => !k.startsWith('q_') && !k.startsWith('hat_')).length;
}

export function muLocked(u) {
  if (u.need && !$G.META.l[u.need]) return true;
  if (u.win && $G.META.st.w < u.win) return true; // bir kademe zaferi gerekir (Gümüş kesesi)
  const qn = Array.isArray(u.qn) ? u.qn[Math.min(u.qn.length - 1, mu(u.k))] : u.qn;
  if (qn && Object.keys($G.META.q).length < qn) return true;
  if (u.unl && unlCount() < u.unl) return true;
  return false;
}

// Toggler: havuzdan çıkarma
export function toggleOpt(k) {
  if (!mu('tg')) {
    sfx('deny');
    return;
  }
  if ($G.META.opt[k]) delete $G.META.opt[k];else $G.META.opt[k] = 1;
  saveMeta();
  sfx('ui');
  otag('havuz');
}

export function poolHTML() {
  const row = (pre, k, n, lk) => unl(lk) ? `<button class="tb${$G.META.opt[pre + k] ? ' off' : ' on'}" ${A('toggleOpt', pre + k)} title="${$G.META.opt[pre + k] ? 'Havuzda değil' : 'Havuzda'}">${n}</button>` : '';
  return `<p class=sub>${mu('tg') ? 'Açık içeriği havuzdan çıkarıp geri alabilirsin. Üstü çizili olanlar seviye ve sandık seçeneklerine girmez.' : 'Toggler Otağ’da satın alınınca burası açılır.'}</p>
 <h3>Silahlar</h3><div class=tiers>${Object.keys(WD).map(k => row('w_', k, WD[k].n, WD[k].lock)).join('')}</div>
 <h3>Tomlar</h3><div class=tiers>${Object.keys(TDF).map(k => row('t_', k, TDF[k].n, TDF[k].lock)).join('')}</div>
 <h3>Eşyalar</h3><div class=tiers>${Object.keys(ITD).filter(k => !ITD[k].q).map(k => row('i_', k, ITD[k].n, ITD[k].lock)).join('')}</div>`;
}

export function collHTML() {
  const cell = (ok, ic, col, n, title, kind) => `<div class="ci${ok ? '' : ' off'}" title="${title}"><span class=ic style="--ik:${col}">${svg(ic, col, kind)}</span><small>${n}</small></div>`,
    sw = Object.keys(WD).map(k => cell(unl(WD[k].lock), WD[k].ic, iconCol('w', k), WD[k].n, WD[k].d)).join(''),
    st = Object.keys(TDF).map(k => cell(unl(TDF[k].lock), TDF[k].ic, iconCol('t', k), TDF[k].n, TDF[k].s, 't')).join(''),
    si = Object.keys(ITD).filter(k => !ITD[k].q).map(k => cell(unl(ITD[k].lock), ITD[k].ic, RAR[ITD[k].cor ? 5 : ITD[k].r].c, ITD[k].n, ITD[k].d)).join(''),
    se = Object.keys(KINDS).map(k => `<span class="tb${cnt('k_kind_' + k) > 0 || KINDS[k].hp == null && !KINDS[k].tint ? '' : ' off'}" title="${KINDS[k].n}">${KINDS[k].n}${cnt('k_kind_' + k) ? ` <small>${cnt('k_kind_' + k)}</small>` : ''}</span>`).join(''),
    nW = Object.keys(WD).filter(k => unl(WD[k].lock)).length, nT = Object.keys(TDF).filter(k => unl(TDF[k].lock)).length, nI = Object.keys(ITD).filter(k => !ITD[k].q && unl(ITD[k].lock)).length;
  return `<p class=osub>Soluk olanlar henüz açılmadı.</p><h3>Silahlar ${nW}/${Object.keys(WD).length}</h3><div class=cg>${sw}</div><h3>Tomlar ${nT}/${Object.keys(TDF).length}</h3><div class=cg>${st}</div><h3>Eşyalar ${nI}/${Object.keys(ITD).filter(k => !ITD[k].q).length}</h3><div class=cg>${si}</div>`;
}

export function bestHTML() {
  const cls = ['Yürüyen', 'Uçan', 'Dev', 'Boss', 'Okçu', 'Hücumcu'],
    fxn = { poi: 'temasta zehir', burn: 'temasta yanma', frz: 'temasta yavaşlatma', static: 'yerinden kımıldamaz', roll: 'düz hatta yuvarlanır', gold: 'bol altın bırakır', pylon: 'boss’u iyileştirir', kefen: 'ölümsüz avcı', zones: 'alan kapatır' },
    all = Object.keys(KINDS).filter(k => !KINDS[k].hide), unseen = all.filter(k => !(cnt('k_kind_' + k) > 0)).length,
    rows = all.filter(k => cnt('k_kind_' + k) > 0).map(k => {
      const d = KINDS[k], t = TY[d.t], n = cnt('k_kind_' + k), seen = n > 0,
        hp = d.hp != null ? d.hp : t.hp, sp = d.sp != null ? d.sp : t.sp, dm = d.d != null ? d.d : t.d,
        fx = d.fx ? Object.keys(d.fx).map(f => fxn[f] || f).join(', ') : '';
      return `<div class="mrow q${seen ? ' dn' : ''}"><div><b>${seen ? d.n : '???'}</b><span>${seen ? `${cls[d.t]} · can ${hp} · hız ${sp} · hasar ${dm}${d.ghost ? ' · hayalet' : ''}${fx ? ' · ' + fx : ''}` : 'Henüz görülmedi'}</span></div><span></span><span class=rw>${seen ? n + ' öldürme' : ''}</span></div>`;
    }).join(''),
    bosses = Object.entries(BOSSP).flatMap(([m, l]) => l.map((b, i) => `<div class="mrow q${cnt('bossk_' + m + i) ? ' dn' : ''}"><div><b>${b.n}</b><span>${(MAPS.find(x => x.k == m) || { n: m }).n} · Kademe ${i + 1}${b.p.length ? ' · ' + b.p.map(p => ({ charge: 'hücum', laser: 'dönen lazer', pylons: 'iyileştiren direkler', disable: 'silah kilidi', summon: 'akrep çağırır', sand: 'bataklık kum', ice: 'donduran mermi', ghosts: 'güdümlü hayalet', lava: 'alev gölü' })[p]).join(', ') : ''}</span></div><span></span><span class=rw>${cnt('bossk_' + m + i) ? cnt('bossk_' + m + i) + ' kez devrildi' : ''}</span></div>`)).join('');
  return `<h3>Düşmanlar ${all.length - unseen}/${all.length}</h3>${rows ? `<div class=achl>${rows}</div>` : ''}${unseen ? `<p class=osub>${unseen} tür henüz görülmedi.</p>` : ''}<h3>Bosslar</h3><div class=achl>${bosses}</div>`;
}

export function achHTML() {
  achCheck();
  const mk = L => L.map(a => { const [c, m] = a.f(), t = $G.META.achv[a.k]; return { k: a.k, n: a.n, t, c: Math.min(c, m), m }; }),
    row = a => `<div class="mrow q${a.t ? ' dn' : ''}"><div><b>${a.n}</b><span>${a.t ? new Date(a.t).toLocaleDateString('tr') : a.m > 1 ? `${a.c.toLocaleString('tr')} / ${a.m.toLocaleString('tr')}` : ''}</span></div><span></span><span class=rw></span></div>`,
    srt = L => L.sort((a, b) => (b.t || 0) - (a.t || 0) || b.c / b.m - a.c / a.m),
    rowsM = mk(ACHM), rowsD = mk(ACHD),
    dnM = rowsM.filter(a => a.t).length, dn = rowsD.filter(a => a.t).length,
    tbl = `<div class=achl>${srt(rowsM).map(row).join('')}</div>${ACHD.length ? `<h3>Kara Koru başarımları ${dn} / ${ACHD.length}</h3><div class=achl>${srt(rowsD).map(row).join('')}</div>` : ''}`;
  return tbl;
}

export function buyMU(k) {
  const u = MU.find(x => x.k == k),
    l = mu(k),
    c = muCost(u, l);
  if (l >= u.m || $G.META.s < c || muLocked(u)) {
    sfx('deny');
    return;
  }
  $G.META.s -= c;
  $G.META.u[k] = l + 1;
  saveMeta();
  sfx('buy');
  calc();
  otag('guc');
}

export function buyML(k) {
  const u = ML.find(x => x.k == k);
  if ($G.META.l[k] || $G.META.s < u.c) {
    sfx('deny');
    return;
  }
  $G.META.s -= u.c;
  $G.META.l[k] = 1;
  saveMeta();
  sfx('chest');
  otag('kilit');
}

export function __init_59() {
  SFM = {
    x: v => v.toFixed(2) + 'x',
    p: v => '%' + Math.round(v * 100),
    d: v => Math.round(v) + '°',
    m: v => (+v).toFixed(1)
  };
}

export function setTab(k) {
  $G.setPg = k;
  sfx('ui');
  settings(1);
}

export function settings(re) {
  if (!re) $G.prevS = $G.S;
  $G.S = 'set';
  // eski sekme anahtarları (Arayüz, Gelişmiş) birleşik sekmelere yönlenir
  if ($G.setPg == 'arayuz') $G.setPg = 'goruntu';
  if ($G.setPg == 'gelismis') $G.setPg = 'oyun';
  const tab = $G.setPg || 'oyun',
    sl = (lab, key, mn, mx, st, f, cb) => `<label class=sset><span>${lab}</span><input type=range min=${mn} max=${mx} step=${st} value=${SET[key]} style="--v:${((SET[key] - mn) / (mx - mn) * 100).toFixed(1)}%" data-in=setRange data-k=${key} data-mn=${mn} data-mx=${mx} data-f=${f}${cb ? ` data-cb=${cbName(cb)}` : ''}><b>${SFM[f](SET[key])}</b></label>`,
    ck = (lab, key, on, cb) => `<label class=chk><input type=checkbox ${on ? 'checked' : ''} data-ch=setCheck data-k=${key}${cb ? ` data-cb=${cbName(cb)}` : ''}>${lab}</label>`,
    seg = (lab, key, opts, cb) => `<div class=sset><span>${lab}</span><div class=seg>${opts.map(([v, n, dis]) => `<button class="${SET[key] == v ? 'on' : ''}" ${dis ? 'disabled' : ''} ${A('setSeg', key, v, cb ? cbName(cb) : '')}>${n}</button>`).join('')}</div></div>`,
    tabs = [['oyun', 'Oyun'], ['goruntu', 'Görüntü'], ['ses', 'Ses'], ['kontrol', 'Kontroller']],
    body = {
      oyun: `${seg('Hedefleme', 'aim', [[0, 'En yakın düşman'], [1, 'Baktığın yön']])}
 <p class=hint>Silahlar yalnızca menzildeki ve görüş hattındaki düşmanlara ateş eder. Baktığın yön seçiliyken kameranın döndüğü taraftaki düşmanlar önceliklidir.</p>
 ${sl('Rastgele hedef ağırlığı', 'rtw', 0, 1, .1, 'p')}
 <p class=hint>Sıfırda silahlar her zaman en uygun hedefe gider; artırdıkça hedef seçimine rastgelelik karışır.</p>
 ${ck('Seviye kartlarını 1, 2, 3 tuşuyla seç', 'nk', SET.nk !== 0)}
 ${ck('Otomatik seviye: seviye ekranında ilk tom kartı kendiliğinden seçilir', 'al', SET.al)}
 ${ck('Hızlı yeniden başlat: oyunda ya da duraklatmada R’ye 1.2 saniye basılı tut', 'qr', SET.qr !== 0)}
 ${ck('Bağlamsal ipuçları (ilk sandık, ocak, boss kapısı...)', 'tips', SET.tips !== 0)}
 <div class=row><button class="act alt sm" ${A('tipsReset')}>İpuçlarını baştan göster</button></div>
 <h3>Gelişmiş</h3>
 ${ck('Skoru ortak sıralamaya yükle', 'lbu', SET.lbu !== 0)}
 ${ck('Ortak sıralamayı göster', 'lbv', SET.lbv !== 0)}
 ${ck('Komut konsolu (oyunda ters tırnak ya da F10)', 'con', SET.con !== 0)}`,
      goruntu: `${seg('Grafik kalitesi', 'q', [[0, 'Düşük'], [1, 'Orta'], [2, 'Yüksek']], 'applyQ();')}
 <p class=hint>Düşük: gölge kapalı, standart çözünürlük, seyrek süs bitkileri. Orta: gölgeler açık, süs bitkileri biraz seyrek (yeni haritada). Yüksek: yumuşak gölgeler, ışıma ve yüksek çözünürlük. Oyun takılıyorsa ya da cihaz ısınıyorsa kaliteyi düşür.</p>
 ${seg('FPS sınırı', 'fps', [[30, '30'], [60, '60'], [0, 'Sınırsız']])}
 <p class=hint>Isınma ve pil için 60 önerilir; 30 en serinidir. Sınırsız, 120 Hz ekranlarda iki kat kare çizer.</p>
 ${ck('Gölgeler', 'shd', SET.shd !== 0, 'applyQ()')}
 ${ck('Işıma ve renk düzenleme (yalnızca yüksek kalitede; kapatmak ekran kartı yükünü belirgin azaltır)', 'bl', SET.bl !== 0)}
 ${ck('Hareket bulanıklığı (yalnızca yüksek kalite ve ışıma açıkken)', 'mb', SET.mb, 'mbApply()')}
 ${sl('Görüş açısı (FOV)', 'fov', 60, 100, 1, 'd')}${sl('Kamera uzaklığı', 'cd', 9, 20, .5, 'm')}${sl('Bakış yumuşatma', 'sm', 0, .9, .05, 'p')}
 ${sl('Parçacık yoğunluğu', 'pd', 0, 1, .1, 'p')}${sl('Parçacık ve mermi saydamlığı', 'po', .2, 1, .1, 'p', 'opApply')}
 <h3>Arayüz</h3>
 ${ck('Hasar sayıları', 'dn', SET.dn !== 0)}
 ${ck('Hasar flaşı', 'fl', SET.fl !== 0)}
 ${ck('Düşük can vinyeti', 'vg', SET.vg !== 0, 'applyUI()')}
 ${ck('Ekran sarsıntısı', 'sh', SET.sh !== 0)}
 ${seg('Can rengi', 'hpc', [[0, 'Kızıl'], [1, 'Yeşil'], [2, 'Mavi']], 'applyUI();')}
 ${sl('Mini harita boyutu', 'mms', .6, 1.6, .1, 'x', 'applyUI()')}
 ${ck('Mini harita bakış yönüyle döner', 'mr', SET.mr !== 0)}
 ${sl('Büyük harita saydamlığı', 'mo', .3, 1, .05, 'p')}`,
      ses: `${sl('Ses efektleri', 'sfx', 0, 1, .05, 'p', 'aVol()')}${sl('Müzik', 'mus', 0, 1, .05, 'p', 'aVol()')}
 ${seg('Müzik makamı', 'mk', [['auto', 'Haritaya göre'], ['hicaz', 'Hicaz'], ['huseyni', 'Hüseyni'], ['nihavend', 'Nihavend'], ['rast', 'Rast'], ['segah', 'Segâh']], 'makamPrev();')}
 <p class=hint>Her makamın karar perdesi, temposu ve ezgisi ayrıdır; seçince dizisi çalınır. Haritaya göre: Kara Koru Hicaz, Kızıl Bozkır Rast, Mezarlık Nihavend. Oyunda M sesi kapatır.</p>`,
      kontrol: `${sl('Fare hassasiyeti', 'sens', .3, 2.5, .05, 'x')}
 ${ck('Fareyle yukarı ve aşağı bakışı ters çevir', 'inv', SET.inv)}
 <div class=keys><kbd>W A S D</kbd><span>Koş</span><kbd>Fare</kbd><span>Kamera</span><kbd>Boşluk</kbd><span>Zıpla, havada bir daha; duvarda sıçra</span><kbd>Shift</kbd><span>Atıl (sağ tık da olur)</span><kbd>Ctrl</kbd><span>Kay, yokuşta hızlanır</span><kbd>E</kbd><span>Sandık, sunak, kapı</span><kbd>Tab</kbd><span>Basılı tut: büyük harita</span><kbd>Esc</kbd><span>Duraklat, build</span><kbd>M</kbd><span>Sesi kapat</span><kbd>F1</kbd><span>Yardım</span></div>
 <div class=row><button class="act alt sm" ${A('showHelp')}>Tüm kısayollar <kbd>F1</kbd></button></div>`
    }[tab];
  // pencere sabit boyutlu: sekme ya da seçenek değişince büyüyüp küçülmez, giriş animasyonu yeniden oynamaz, kaydırma yeri korunur
  const sg0 = re && OV.querySelector('.setg'), top = sg0 && $G.setPgLast == tab ? sg0.scrollTop : 0;
  $G.setPgLast = tab;
  ov(`<div class="pz narrow setp"><h2>Ayarlar</h2>
 <div class=tabs>${tabs.map(([k, n]) => `<button class="tb${tab == k ? ' on' : ''}" ${A('setTab', k)}>${n}</button>`).join('')}</div>
 <div class=setg>${body}</div>
 <div class="row setf"><button class=act ${A('closeSet')}>Kaydet ve dön</button></div></div>`, re ? 'mid noan' : 'mid');
  if (top) OV.querySelector('.setg').scrollTop = top;
}

// arayüz ayarlarını uygula: mini harita boyutu, can rengi, vinyet
export function applyUI() {
  document.documentElement.style.setProperty('--mms', SET.mms || 1);
  document.documentElement.style.setProperty('--hpc', ['var(--blood)', '#4fb36a', '#4a90d8'][SET.hpc || 0]);
  document.body.classList.toggle('novg', SET.vg === 0);
}

export function closeSet() {
  saveSet();
  aVol();
  applyUI();
  if ($G.prevS == 'pause') pause();else {
    $G.S = 'menu';
    renderMenu();
  }
}

export function over(w) {
  if ($G.S == 'over') return;
  qCheck();
  $G.S = 'over';
  document.body.classList.remove('on');
  const n = $G.kills > $G.bestK && !$G.P.con,
    tm = [1, 1.1, 1.2][$G.P.tier - 1] || 1,
    // Son Dalga'da kalınan her 90 sn gümüş çarpanını 1 artırır (en çok 16x)
    swm = $G.P.won ? 1 + Math.min(7, Math.floor(swT() / 90)) : 1, // Son Dalga gümüş çarpanı en çok 8× (Megabonk yama notu)
    sv = {
      k: Math.round($G.kills / 12 * swm),
      t: Math.round($G.P.tt / 6),
      b: $G.P.bosses * 40,
      st: $G.P.stage * 60,
      w: $G.P.won ? 60 * $G.P.tier : 0,
      s: $G.P.silv | 0
    };
  sv.cm = $G.P.chal ? $G.P.chal.m : 1;
  sv.all = Math.round((sv.k + sv.t + sv.b + sv.st + sv.w + sv.s) * tm * ($G.P.C.silver || 1) * sv.cm * chalSilver());
  sv.swm = swm;
  $G.META.s += sv.all;
  inc('silverT', sv.all);
  $G.META.st.k += $G.kills;
  if (!$G.P.won && !$G.P.exited) inc('deaths');
  if ($G.P.won) inc('wc' + $G.CI);
  if ($G.P.exited) inc('exit');
  if ($G.P.W.some(w => w.lv >= 40)) inc('w40');
  if ($G.P.T.some(t => t.lv >= 99)) inc('t99');
  if (Object.keys($G.P.I).length >= 20) inc('i20');
  if ($G.P.lv >= 50) inc('lv50');
  if ($G.P.lv >= 60) inc('lv60');
  if (($G.P.goldT || 0) >= 10000) inc('gold10k');
  if (($G.P.ot || 0) >= 600) inc('ot600');
  if ($G.P.fallDead) inc('falldeath');
  $G.META.st.r++;
  $G.META.st.w += $G.P.won ? 1 : 0;
  $G.META.st.b += $G.P.bosses;
  for (const k in $G.P.c) $G.META.st.c[k] = ($G.META.st.c[k] || 0) + $G.P.c[k];
  if ($G.P.I.kulah) $G.META.st.c.hat_kulah = ($G.META.st.c.hat_kulah || 0) + 1;
  // rütbe: bu karakterle kazanılan tecrübe
  {
    const ck = CR[$G.CI].k,
      r0 = rankOf($G.CI);
    $G.META.rank[ck] = ($G.META.rank[ck] || 0) + Math.round($G.P.xpT || 0);
    const r1 = rankOf($G.CI);
    if (r1 > r0) setTimeout(() => toast(`${CR[$G.CI].n} rütbe ${r1} oldu`), 1200);
    sv.rk = r1;
  }
  $G.P.banked = 1;
  // koşu sonunda işlenen değerlere (koşu, zafer, rütbe, ölüm sayaçları) bağlı görevler hemen tamamlansın;
  // baştaki denetim bunları göremiyor, ödül bir sonraki koşunun ilk seviye atlamasına kalıyordu
  qCheck();
  saveMeta();
  if (n) {
    $G.bestK = $G.kills;
    try {
      localStorage.setItem('kk_bestk', $G.bestK);
    } catch (e) {}
  }
  const rec = {
    k: $G.kills,
    c: $G.CI,
    m: $G.P.map,
    tr: $G.P.tier,
    w: $G.P.won ? 1 : 0,
    s: $G.P.stage,
    t: Math.round($G.P.tt),
    lv: $G.P.lv,
    d: Date.now()
  };
  // meydan okumalı ve konsol kullanılan koşu sıralamaya girmez; menüde konsolla gümüş ya da kilit alan profil ortak sıralamaya yüklemez
  const lbOk = !$G.P.chal && !$G.P.con,
    lbs = lbOk && !$G.META.con ? lbSonuc($G.kills) : ''; // gönderimden önceki tabloya göre: yükseliş görünsün
  if (lbOk) {
    lbAdd(rec);
    if (!$G.META.con) glSubmit(rec);
  }
  const kpm = $G.P.tt > 5 ? Math.round($G.kills / ($G.P.tt / 60)) : 0;
  const svr = [['Öldürmeler' + (sv.swm > 1 ? ' ×' + sv.swm : ''), sv.k], ['Hayatta kalma', sv.t], ['Boss', sv.b], ['Aşama', sv.st], ['Kademe zaferi', sv.w], ['Toplanan gümüş', sv.s]].filter(x => x[1]).map(([a, b]) => `<span>${a} <b>+${b}</b></span>`).join('') + (sv.cm > 1 ? `<span>${$G.P.chal.n} <b>×${sv.cm}</b></span>` : '') + (chalCount() ? `<span>Meydan okuma bonusu <b>+%${chalCount()}</b></span>` : '');
  const wd = Object.entries($G.P.wdmg || {}).sort((a, b) => b[1] - a[1]),
    wmax = wd.length ? wd[0][1] : 1,
    chart = wd.length ? `<div class=wdc>${wd.slice(0, 6).map(([k, v]) => `<div class=wdr><span>${WD[k] ? WD[k].n : k}</span><i><em style="width:${Math.max(2, v / wmax * 100)}%"></em></i><b>${v >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : v >= 1e3 ? (v / 1e3).toFixed(1) + 'K' : Math.round(v)}</b></div>`).join('')}</div>` : '',
    unlocked = $G.P.qDone.filter(q => q.ul).map(q => q.ul.startsWith('q_') ? 'satın alınabilir: ' + (CR.find(c => c.lock == q.ul.slice(2)) || { n: q.ul.slice(2) }).n : q.ul.startsWith('hat_') ? 'şapka: ' + hatName(q.ul.slice(4)) : (WD[q.ul] || TDF[q.ul.replace(/^t_/, '')] || ITD[q.ul] || { n: q.ul }).n);
  const mp = mapOf(),
    qd = $G.P.qDone,
    head = $G.P.exited ? 'Korudan çıktın' : 'Öldün';
  if ($('tip')) $('tip').classList.remove('on'); // koşu sonunda ipucu kutusu ekranı kapatmasın
  ov(`<div class="mn2 ovr"><p class=kk>${mp.n} K${$G.P.tier} · ${$G.P.stage + 1}/${$G.P.tier}. aşama${$G.P.won ? ' · kademe tamamlandı' : ''} · ${CR[$G.CI].n} rütbe ${sv.rk}</p>
 <h1>${head}</h1>
 <p class=orec>${n ? '<b>Yeni öldürme rekoru.</b>' : 'Rekorun ' + $G.bestK + ' öldürme.'}${$G.P.con ? ' <i class=lbno>Konsol kullanıldı: sıralamaya girmedi.</i>' : $G.P.chal ? ' <i class=lbno>Meydan okumalı koşu sıralamaya girmez.</i>' : $G.META.con ? ' <i class=lbno>Bu profilde konsolla gümüş ya da kilit alındı: ortak sıralamaya yüklenmez.</i>' : ''}</p>${lbs}
 <div class=ost><div><span>Öldürülen</span><b>${$G.kills}</b></div><div><span>Süre</span><b>${fmt($G.P.tt)}</b></div><div><span>Seviye</span><b>${$G.P.lv}</b></div><div><span>Dakikada</span><b>${kpm}</b></div></div>
 <div class=svb><b class=sv>${SILV}+${sv.all} gümüş</b><div class=svr>${svr}</div></div>
 ${unlocked.length ? `<div class=oul><h3>Yeni açılanlar</h3><div>${unlocked.map(u => `<span class="chip au">${u}</span>`).join('')}</div></div>` : ''}
 ${qd.length ? `<div class=oq><h3>Tamamlanan görevler <small>${qd.length}</small></h3><ul>${qd.slice(0, 4).map(q => `<li><span>${q.n}</span><b>+${q.r}</b></li>`).join('')}</ul>${qd.length > 4 ? `<p>ve ${qd.length - 4} görev daha, toplam +${qd.slice(4).reduce((a, q) => a + q.r, 0)} gümüş. Hepsi Otağ’daki görev listesinde.</p>` : ''}</div>` : ''}
 ${chart ? `<div class=owd><h3>Silah hasarı</h3>${chart}</div>` : ''}
 <footer class=ofb><button class=act ${A('start')}>Tekrar dene <kbd>R</kbd></button><button class="act alt" ${A('menu')}>Karakter seç</button><button class="act alt" ${A('otag')}>Otağ <small>${$G.META.s}</small></button><button class="act alt" ${A('lbOpen')}>Sıralama</button></footer></div>`, 'side');
  // odak bilerek verilmez: ölürken zıplama tuşuna basmaya devam eden oyuncu sonucu görmeden yeniden başlamasın (R kısayolu var)
}
// ---- düşmanlar

// ---- kısayollar ve komutlar (F1)
export function helpHTML() {
  const keys = [['W A S D', 'Koş'], ['Fare', 'Kamera'], ['Boşluk', 'Zıpla; havada bir daha; iner inmez zıpla: hız birikir'], ['Shift / sağ tık', 'Atıl: 0.22 sn hamle, 1.6 sn bekleme, kısa dokunulmazlık'], ['Ctrl', 'Kay; yokuşta hızlanır (C de olur)'], ['E', 'Sandık, sunak, kapı, tüccar'], ['Tab', 'Basılı tut: büyük harita'], ['1 2 3', 'Seviye ekranında kart seç'], ['R', 'Seviye ekranında yenile; oyunda basılı tut: yeniden başla'], ['Esc / P', 'Duraklat, build'], ['M', 'Sesi kapat'], ['F1 / ?', 'Bu pencere'], ['` / F10', 'Komut konsolu']];
  return `<div class="pz narrow"><h2>Kısayollar</h2><div class=keys>${keys.map(([k, d]) => `<kbd>${k}</kbd><span>${d}</span>`).join('')}</div>
 <details class=omore><summary>Komut konsolu (geliştirici aracı)</summary><p class=sub>Ters tırnak ya da F10 açar. Oyunu etkileyen bir komut kullanılan koşu sıralamaya girmez.</p>
 <div class=keys><kbd>altin N · gumus N · seviye N</kbd><span>Kaynak</span><kbd>esya · silah · tom · dogur</kbd><span>İçerik ekle (Tab ile anahtar)</span><kbd>boss · asama · zaman N · kapi</kbd><span>Koşu akışı</span><kbd>kilit · achepsi · gorevler</kbd><span>Kilitler</span><kbd>perf · fps · temizle · olumsuz</kbd><span>Araçlar</span></div></details>
 <h3>Dokunmatik ve kumanda</h3><p class=sub>Sol yarıda sürükle: yürü; sağ yarıda: kamera. Kumanda: sol çubuk yürü, sağ çubuk kamera, A zıpla, X etkileşim, B kay, RB ya da RT atıl, Start duraklat, Select harita. Menülerde yön tuşları ya da sol çubukla gez, A ile seç, B ile geri dön; kaydırıcıda sağ ve sol değeri değiştirir.</p>
 <div class=row style="justify-content:center;margin-top:18px"><button class=act ${A('closeHelp')}>Kapat <kbd>Esc</kbd></button></div></div>`;
}

export function showHelp() {
  // yalnız geri dönülebilen durumlardan açılır (kart seçimi, sandık, koşu sonu gibi ekranların üstüne açılmaz)
  if (!['play', 'pause', 'set', 'menu'].includes($G.S)) return;
  $G.helpPrev = $G.S;
  $G.S = 'help';
  ov(helpHTML(), 'mid');
}

export function closeHelp() {
  if ($G.S != 'help') return;
  const p = $G.helpPrev;
  $G.helpPrev = null;
  if (p == 'pause') pause();else if (p == 'set') settings(1);else if (p == 'menu') {
    // ana menüden açıldıysa menüye döner; eskiden back() oyunu start() çağırmadan 'play' durumuna sokuyordu
    $G.S = 'menu';
    renderMenu();
  } else back();
}

export function tipsReset() {
  localStorage.removeItem('kk_tips');
  $G.TIPS = {};
  toast('İpuçları baştan gösterilecek');
}

export function pause() {
  $G.S = 'pause';
  const C = $G.P.C,
    rows = Object.keys(STATS).filter(k => STATS[k].show || Math.abs(C[k] - STATS[k].b) > 1e-9).map(k => `<div class=sr><span>${STATS[k].n}</span><b>${fmtC(k, C[k])}</b></div>`).join('');
  const wd = $G.P.W.map((w, i) => `<div class="wdt${w.off ? ' off' : ''}"><div class=hd><span class="ic w">${svg(WD[w.k].ic, iconCol('w', w.k))}</span><div><div class=n>${WD[w.k].n}</div><div class=lv>Seviye ${w.lv} · <button class="tb sm" ${A('toggleW', i)}>${w.off ? 'Kapalı, aç' : 'Açık, kapat'}</button></div></div></div>${Object.keys(w.s).map(k => `<div class=sr><span>${stl(w.k, k)}</span><b>${fmtS(k, w.s[k])}</b></div>`).join('')}</div>`).join('');
  const g = goal();
  ov(`<div class="sx pzx">
 <aside class=pmn><p class=kk>Duraklatıldı</p><h2>${BIO[$G.BI].n}</h2>
  <div class=pmt><span class=chip title="Aşama süresi">${CLK}${fmt($G.P.stT)}</span><span class=chip>SVY ${$G.P.lv}</span><span class="chip au">${COIN}${$G.P.gold}</span><span class=chip>${$G.P.stage + 1}/${$G.P.tier}. aşama</span></div>
  ${g ? `<p class=pgo>${g}</p>` : ''}
  <nav class=mnav2>
   <button class="mi pri" ${A('resume')}><b>Devam et</b><small>Esc · P</small></button>
   <button class=mi ${A('settings')}><b>Ayarlar</b></button>
   <button class=mi ${A('showHelp')}><b>Kısayollar</b><small>F1</small></button>
   <button class="mi dz" ${A('menu')}><b>Koşuyu bırak</b></button>
  </nav></aside>
 <section class=pbd>
  <div class=pbs><div><h3>Silah ve tomlar</h3>${hudSlots()}</div>${Object.keys($G.P.I).length ? `<div><h3>Eşyalar</h3><div class=pbi>${hudItems()}</div></div>` : ''}</div>
  <h3>${CR[$G.CI].n}</h3><p class=psv>${CR[$G.CI].ps}</p>
  <h3>Silahlar</h3><div class=wgrid>${wd}</div>
  <h3>İstatistikler</h3><div class=sgrid>${rows}</div>
 </section></div>`, 'mid');
  const f = OV.querySelector('.mi.pri');
  f && f.focus({ preventScroll: true });
}

export function resume() {
  if ($G.S == 'pause') back();
}

export function toggleW(i) {
  const w = $G.P.W[i];
  if (!w) return;
  w.off = w.off ? 0 : 1;
  sfx('ui');
  pause();
}
