// ui/cards.js · Kara Koru
// Bu dosya tek dosyalık sürümden (v22) otomatik ayrıldı. Ortak oyun durumu core/store.js içindeki $G nesnesinde.

import { mkChest, spot } from '../game/objects.js';
import { toast, tip } from '../core/helpers.js';
import { $G } from '../core/store.js';
import { sfx } from '../audio/engine.js';
import { lockP, ov } from '../core/helpers.js';
import { OV } from '../core/state.js';
import { SET } from '../core/settings.js';
import { A } from './actions.js';
import { CS, ITD, RAR, SBD, TDF, WD, fmtC, fmtS, inc, stl, unl } from '../data/content.js';
import { addItem, extraLines, heal, shrineReward } from '../game/items.js';
import { calc, newW, rollR } from '../game/stats.js';
import { iconCol, ikon } from './icons.js';

// Ocak ve Denge taşı stat kartları: stat anahtarı → simge
// Kartta statın alındıktan sonraki değeri. Kaçınma azalan getirili: iç değere eklenip yeniden dönüştürülür (bkz. calc).
function nxtC(k, dv) {
  const C = $G.P.C;
  if (k != 'eva') return C[k] + dv;
  const r = (C.evaR ?? C.eva) + dv;
  return r > 0 ? r / (1 + r) : r;
}

export const STI = { dmg: 'sword', aspd: 'zap', size: 'expand', crit: 'target', critd: 'claw2', hp: 'heart', regen: 'plus', arm: 'shield', spd: 'run', mag: 'magnet', xp: 'star', gold: 'coin', luck: 'clover', pspd: 'pspd', dur: 'dur', kb: 'kb', shield: 'shieldt', eva: 'eva', ls: 'drop', thorns: 'thorns', curse: 'skull', diff: 'chaos', jmp: 'feather', fall: 'boot', effdur: 'hourglass', heal: 'potion', elspawn: 'ghost3', cnt: 'dots', silver: 'silver' };

// ---- seçenek kartları
export function wSample(pool, n) {
  const out = [],
    p = pool.slice();
  while (out.length < n && p.length) {
    let s = p.reduce((a, o) => a + o.w, 0),
      r = Math.random() * s,
      i = 0;
    for (; i < p.length; i++) {
      r -= p[i].w;
      if (r <= 0) break;
    }
    out.push(p.splice(Math.min(i, p.length - 1), 1)[0]);
  }
  return out;
}

export function luOpts() {
  const o = [];
  for (const w of $G.P.W) if (!$G.P.ban.has(w.k) && w.lv < $G.P.wmax) o.push({
    t: 'wu',
    k: w.k,
    w: 3
  });
  if ($G.P.W.length < $G.P.ws) for (const k in WD) if (!$G.P.W.find(w => w.k == k) && !$G.P.ban.has(k) && unl(WD[k].lock) && !$G.META.opt['w_' + k]) o.push({
    t: 'wn',
    k,
    w: 1.2
  });
  for (const t of $G.P.T) if (!$G.P.ban.has('t_' + t.k) && t.lv < $G.P.tmax) o.push({
    t: 'tu',
    k: t.k,
    w: 2
  });
  if ($G.P.T.length < $G.P.ts) for (const k in TDF) if (!$G.P.T.find(t => t.k == k) && !$G.P.ban.has('t_' + k) && unl(TDF[k].lock) && !$G.META.opt['t_' + k]) o.push({
    t: 'tn',
    k,
    w: k == 'curse' ? .25 : .5
  });
  return wSample(o, 3).map(mkOpt);
}

export function mkOpt(o) {
  if (o.t == 'wn') {
    const d = WD[o.k];
    return {
      key: o.k,
      rar: null,
      kind: 'Silah',
      ic: d.ic,
      cls: 'w',
      name: d.n,
      lvl: 'Boş bir silah slotuna yerleşir',
      rows: Object.keys(d.b).filter(k => d.b[k]).map(k => [stl(o.k, k), '', fmtS(k, d.b[k])]),
      desc: d.d,
      apply: () => {
        $G.P.W.push(newW(o.k));
      }
    };
  }
  if (o.t == 'wu') {
    const w = $G.P.W.find(x => x.k == o.k),
      d = WD[o.k],
      r = rollR(),
      m = RAR[r].m,
      ks = Object.keys(d.u).sort(() => Math.random() - .5).slice(0, Math.max(1, r == 0 ? (Math.random() < .5 ? 1 : 2) : r) + extraLines()), // satır sayısı nadirliğe eşit (decompile)
      ns = {
        ...w.s
      };
    for (const k of ks) {
      if (k == 'cd') ns.cd *= 1 - d.u.cd * m;else if (k == 'cnt' || k == 'prc') ns[k] += Math.max(1, Math.round(d.u[k] * m));else if (k == 'dur') ns.dur += d.b.dur * d.u.dur * m;else ns[k] += d.u[k] * m;
    }
    return {
      key: o.k,
      rar: r,
      kind: 'Silah yükseltmesi',
      ic: d.ic,
      cls: 'w',
      name: d.n,
      lvl: `Seviye ${w.lv} → ${w.lv + 1}`,
      rows: ks.map(k => [stl(o.k, k), fmtS(k, w.s[k]), fmtS(k, ns[k])]),
      apply: () => {
        w.s = ns;
        w.lv++;
        if (w.lv > 40 && $G.CRK && $G.CRK() == 'kam') inc('over40_kam'); // Kam Külahı (eskiden Börü)
      }
    };
  }
  const d = TDF[o.k];
  if (d.fxl) {
    // seviye başına sabit stat paketi (Denge, İstifçi, Kumar)
    const t = $G.P.T.find(x => x.k == o.k),
      r = t ? rollR() : null,
      m = t ? RAR[r].m : 1,
      ks = Object.keys(d.fxl);
    return {
      key: 't_' + o.k,
      rar: r,
      kind: t ? 'Tom yükseltmesi' : 'Tom',
      ic: d.ic,
      cls: 't',
      name: d.n,
      lvl: t ? `Seviye ${t.lv} → ${t.lv + 1}` : 'Boş bir tom slotuna yerleşir',
      rows: ks.slice(0, 4).map(k => { const b = k.replace(/[*%+]$/, ''); return CS[b] ? [CS[b][0], fmtC(b, $G.P.C[b]), (d.fxl[k] >= 0 ? '+' : '') + (k.endsWith('*') ? '%' + Math.round(d.fxl[k] * m * 100) : fmtC(b, nxtC(b, d.fxl[k] * m)))] : [k, '', '']; }),
      desc: d.d,
      apply: () => {
        if (t) {
          // çarpan katmanı ('hp*') seviyeler arasında bileşik işler: Kumar'ın −%5 canı her seviyede kalan candan düşer.
          // Eskiden toplanıyordu; 20. seviyede azami can sıfıra iniyordu (tom sınırı 99)
          for (const k of ks) t.fx[k] = k.endsWith('*') ? (1 + (t.fx[k] || 0)) * (1 + d.fxl[k] * m) - 1 : (t.fx[k] || 0) + d.fxl[k] * m;
          t.lv++;
        } else $G.P.T.push({ k: o.k, lv: 1, v: 0, fx: Object.fromEntries(ks.map(k => [k, d.fxl[k]])) });
        if (o.k == 'istif') {
          const [x, z] = spot(0, 0, 20, 200, 10);
          mkChest({ x, z, y: $G.HT(x, z), free: 1 });
          toast('İstifçi Tomu: haritada bir sandık belirdi');
        }
      }
    };
  }
  if (d.rand) {
    // Kaos Tomu: her seviye rastgele bir stat
    const t = $G.P.T.find(x => x.k == o.k),
      r = t ? rollR() : null,
      m = t ? RAR[r].m : 1,
      [ck, cv] = SBD.filter(x => x[0] != 'curse' && x[0] != 'diff')[Math.random() * (SBD.length - 2) | 0],
      dv = cv * m;
    return {
      key: 't_' + o.k,
      rar: r,
      kind: t ? 'Tom yükseltmesi' : 'Tom',
      ic: d.ic,
      cls: 't',
      name: d.n,
      lvl: t ? `Seviye ${t.lv} → ${t.lv + 1}` : 'Boş bir tom slotuna yerleşir',
      rows: [[CS[ck][0], fmtC(ck, $G.P.C[ck]), fmtC(ck, nxtC(ck, dv))]],
      desc: d.d,
      apply: () => {
        if (t) {
          t.fx[ck] = (t.fx[ck] || 0) + dv;
          t.lv++;
        } else $G.P.T.push({ k: o.k, lv: 1, v: 0, fx: { [ck]: dv } });
      }
    };
  }
  if (o.t == 'tn') return {
    key: 't_' + o.k,
    rar: null,
    kind: 'Tom',
    ic: d.ic,
    cls: 't',
    name: d.n,
    lvl: 'Boş bir tom slotuna yerleşir',
    rows: [[d.s, fmtC(o.k, $G.P.C[o.k]), fmtC(o.k, nxtC(o.k, d.v))]],
    desc: d.d || 'Tomlar karakterini güçlendirir, bütün silahlarına etki eder.',
    apply: () => {
      $G.P.T.push({
        k: o.k,
        lv: 1,
        v: d.v
      });
    }
  };
  const t = $G.P.T.find(x => x.k == o.k),
    r = rollR(),
    dv = d.f == 'i' ? Math.max(1, Math.round(d.v * RAR[r].m)) : d.v * RAR[r].m;
  return {
    key: 't_' + o.k,
    rar: r,
    kind: 'Tom yükseltmesi',
    ic: d.ic,
    cls: 't',
    name: d.n,
    lvl: `Seviye ${t.lv} → ${t.lv + 1}`,
    rows: [[d.s, fmtC(o.k, $G.P.C[o.k]), fmtC(o.k, nxtC(o.k, dv))]],
    apply: () => {
      t.v += dv;
      t.lv++;
    }
  };
}

export function itemOpt(k, sg = 1) {
  const d = ITD[k],
    C = $G.P.C,
    rows = [];
  for (const s in d.fx) {
    const v = d.fx[s] * sg,
      bs = s.replace(/[*%+]$/, '');
    if (CS[s]) rows.push([CS[s][0], fmtC(s, C[s]), fmtC(s, nxtC(s, v))]);else if (bs != s && CS[bs]) rows.push([CS[bs][0], fmtC(bs, C[bs]), (v >= 0 ? '+' : '') + '%' + Math.round(v * 100)]);else if (s == 'block') rows.push(['Darbe engelleme', C.block ? 'Var' : 'Yok', C.block + v > 0 ? '10 sn’de bir' : 'Yok']);else if (s == 'expl') rows.push(['Ölümde patlama', '%' + Math.round(C.expl * 100), '%' + Math.round((C.expl + v) * 100)]);else if (s == 'revive') rows.push(['Diriliş', C.revive ? C.revive + ' kez' : 'Yok', C.revive + v + ' kez']);else if (s == 'air') rows.push(['Havada zıplama', '' + C.air, '' + (C.air + v)]);
  }
  return {
    key: 'i_' + k,
    rar: d.cor ? 5 : d.r,
    kind: 'Eşya',
    ic: d.ic,
    cls: 'i',
    name: d.n,
    lvl: d.u ? 'Tekil, bir kez alınır' : $G.P.I[k] ? `Elinde ${$G.P.I[k]} tane var, etkisi üst üste biner` : 'Slot kullanmaz, üst üste biner',
    rows,
    desc: d.d,
    apply: () => {
      addItem(k);
    }
  };
}

export function sbOpt(k, v, hi) {
  const r = hi ? Math.random() < .4 ? 4 : 3 : rollR(),
    dv = v * RAR[r].m * shrineReward();
  return {
    key: 's_' + k,
    rar: r,
    kind: hi ? 'Altın ocak gücü' : 'Ocak gücü',
    ic: STI[k] || (TDF[k] ? TDF[k].ic : 'plus'),
    cls: 't',
    name: CS[k][0],
    lvl: 'Kalıcı, slot kullanmaz',
    rows: [[CS[k][0], fmtC(k, $G.P.C[k]), fmtC(k, nxtC(k, dv))]],
    apply: () => {
      $G.P.SB[k] = ($G.P.SB[k] || 0) + dv;
    }
  };
}

export function card(o, i, click, ban, foot, dis) {
  const r = o.rar != null ? RAR[o.rar] : null;
  return `<div class="cd${dis ? ' dis' : ''}" role="button" tabindex="0" style="--rc:${r ? r.c : '#ddd3bc'}" ${A(...click)}>
 <div class=rb><span class=rn>${r ? r.n : 'Yeni'}</span><span>${o.kind}</span></div>
 <div class=hd><span class="ic ${o.cls}" style="--ik:${iconCol(o.cls, o.key)}">${ikon(o.cls == "w" ? "w_" + o.key : o.key, o.ic, iconCol(o.cls, o.key), o.cls)}</span><div><div class=n>${o.name}</div><div class=lv>${o.lvl}</div></div></div>
 <div class=rows>${o.rows.map(([a, b, c]) => `<div class=sr><span>${a}</span><b>${b !== '' ? `<i>${b}</i> → ` : ''}<em>${c}</em></b></div>`).join('')}</div>
 <p class=d>${o.desc || ''}</p>
 <div class=ft>${i >= 0 ? `<kbd>${i + 1}</kbd>` : ''}${foot || ''}${ban ? `<button class=ban ${A('banOpt', i)}>Bu koşudan çıkar</button>` : ''}</div></div>`;
}

// HUD: etiketsiz silah ve tom sıraları; eşyalar ayrı (alt sol, biriktikçe)
export function hudSlots() {
  const ws = [0, 1, 2, 3].map(i => {
    const w = $G.P.W[i];
    return w ? `<div class=sl style="--ik:${iconCol('w', w.k)}" title="${WD[w.k].n}">${ikon("w_" + w.k, WD[w.k].ic, iconCol("w", w.k))}<b>${w.lv}</b></div>` : i < $G.P.ws ? '<div class="sl e"></div>' : '<div class="sl e lk"></div>';
  }).join('');
  const ts = [0, 1, 2, 3].map(i => {
    const t = $G.P.T[i];
    return t ? `<div class="sl tm" style="--ik:${iconCol('t', t.k)}" title="${TDF[t.k].n}">${ikon("t_" + t.k, TDF[t.k].ic, iconCol("t", t.k), "t")}<b>${t.lv}</b></div>` : i < $G.P.ts ? '<div class="sl tm e"></div>' : '<div class="sl tm e lk"></div>';
  }).join('');
  return `<div class=hr>${ws}</div><div class="hr tr">${ts}</div>`;
}
export function hudItems() {
  return Object.keys($G.P.I).map(k => `<div class=it style="--rc:${RAR[ITD[k].cor ? 5 : ITD[k].r].c}" title="${ITD[k].n}">${ikon("i_" + k, ITD[k].ic, iconCol("i", k))}${$G.P.I[k] > 1 ? `<b>${$G.P.I[k]}</b>` : ''}</div>`).join('');
}

export function buildHTML() {
  const ws = [0, 1, 2, 3].map(i => {
    const w = $G.P.W[i];
    return w ? `<div class=sl style="--ik:${iconCol('w', w.k)}" title="${WD[w.k].n}">${ikon("w_" + w.k, WD[w.k].ic, iconCol("w", w.k))}<b>${w.lv}</b></div>` : i < $G.P.ws ? '<div class="sl e"></div>' : '<div class="sl e lk" title="Otağ’dan açılır"></div>';
  }).join('');
  const ts = [0, 1, 2, 3].map(i => {
    const t = $G.P.T[i];
    return t ? `<div class="sl tm" style="--ik:${iconCol('t', t.k)}" title="${TDF[t.k].n}">${ikon("t_" + t.k, TDF[t.k].ic, iconCol("t", t.k), "t")}<b>${t.lv}</b></div>` : i < $G.P.ts ? '<div class="sl tm e"></div>' : '<div class="sl tm e lk" title="Otağ’dan açılır"></div>';
  }).join('');
  const it = Object.keys($G.P.I).map(k => `<div class=it style="--rc:${RAR[ITD[k].cor ? 5 : ITD[k].r].c}" title="${ITD[k].n}">${ikon("i_" + k, ITD[k].ic, iconCol("i", k))}${$G.P.I[k] > 1 ? `<b>${$G.P.I[k]}</b>` : ''}</div>`).join('');
  return `<div class=bld><div class=bg><span class=bl>Silahlar ${$G.P.W.length}/${$G.P.ws}</span><div class=br>${ws}</div></div><div class=bg><span class=bl>Tomlar ${$G.P.T.length}/${$G.P.ts}</span><div class=br>${ts}</div></div>${it ? `<div class=bg><span class=bl>Eşyalar</span><div class=br>${it}</div></div>` : ''}</div>`;
}

export function choose(mode, opts) {
  if (mode == 'level' && !opts.length) {
    // sunulacak yükseltme kalmadı: boş ekranda takılmak yerine küçük bir şifa
    heal($G.P.mh * .1);
    toast('Yükseltme kalmadı: can yenilendi');
    return;
  }
  if (mode == 'level' && SET.al && opts.length) {
    // Otomatik seviye (Megabonk Auto Leveling): ilk tom kartı, yoksa ilk kart
    const i = Math.max(0, opts.findIndex(o => o.key && o.key.startsWith('t_')));
    opts[i].apply();
    calc();
    toast('Otomatik seviye: ' + opts[i].name);
    return;
  }
  if (mode == 'lv') tip('level', 'Seviye', 'Üç karttan birini seç: 1-2-3 tuşları. R yeniler, atla ve çıkar hakları Otağ’dan alınır. Kart rengi nadirlik; nadir kartlar daha güçlü satırlar getirir.');
  $G.S = 'choice';
  $G.CHM = mode;
  $G.CHO = opts;
  renderChoice();
  for (let i = 0; i < opts.length; i++) sfx('card', i);
}

export function renderChoice() {
  const lvl = $G.CHM == 'level',
    t = {
      level: `Seviye ${$G.P.lv}`,
      item3: 'Balbal taşı',
      shrine: 'Ocak doldu',
      gshrine: 'Altın ocak doldu'
    }[$G.CHM],
    sub = {
      level: 'Bir yükseltme seç. Seçtiğin her şey build’ine eklenir ve koşu sonuna kadar kalır.',
      item3: 'Atalar sana bir eşya sunuyor. Birini al.',
      shrine: 'Kalıcı bir güç seç. Ocak güçleri slot kullanmaz.',
      gshrine: 'Altın ocak yalnızca destansı ve efsanevi güç sunar. Birini seç.'
    }[$G.CHM];
  ov(`<div class=lu><h2>${t}</h2><p class=sub>${sub}</p><div class=cs>${$G.CHO.map((o, i) => card(o, i, ['chPick', i], lvl && $G.P.bn > 0)).join('')}</div>
 ${lvl ? `<div class=ctl><button class="act alt" ${A('reroll')} ${$G.P.rr ? '' : 'disabled'}>Seçenekleri yenile <kbd>R</kbd> <span>${$G.P.rr} hak</span></button><button class="act alt" ${A('skipLv')} ${$G.P.sk ? '' : 'disabled'}>Bu seviyeyi geç <kbd>G</kbd> <span>${$G.P.sk} hak</span></button>${$G.P.bn ? `<span class=hint>“Bu koşudan çıkar” istemediğin seçeneği bir daha göstermez. ${$G.P.bn} hak.</span>` : ''}</div>` : ''}
 ${lvl ? `<div class=chb><span>Şu an</span>${hudSlots()}</div>` : ''}</div>`, 'mid');
}

export function back() {
  $G.S = 'play';
  OV.classList.add('h');
  lockP();
}

export function chPick(i) {
  if ($G.S != 'choice' || !$G.CHO[i]) return;
  if ($G.CHO[i].rar == 4) $G.P.legs++;
  $G.CHO[i].apply();
  calc();
  sfx('pick');
  back();
}

export function reroll() {
  if ($G.S == 'choice' && $G.CHM == 'level' && $G.P.rr > 0) {
    $G.P.rr--;
    $G.CHO = luOpts();
    if (!$G.CHO.length) return back();
    renderChoice();
    for (let i = 0; i < $G.CHO.length; i++) sfx('card', i);
  }
}

export function skipLv() {
  if ($G.S == 'choice' && $G.CHM == 'level' && $G.P.sk > 0) {
    $G.P.sk--;
    back();
  }
}

export function banOpt(i) {
  if ($G.S != 'choice' || $G.P.bn <= 0 || !$G.CHO[i]) return;
  $G.P.bn--;
  $G.P.ban.add($G.CHO[i].key);
  $G.CHO = luOpts();
  if (!$G.CHO.length) return back(); // son seçenek de çıkarıldı: boş ekranda kalınmaz
  renderChoice();
}

export function showItem(o, title) {
  $G.S = 'item';
  ov(`<div class=lu><h2>${title}</h2><p class=sub>Eşyalar slot kullanmaz ve aynı eşyadan tekrar gelirse etkisi üst üste biner.</p><div class="cs rev">${card(o, -1, ['closeItem'], 0)}</div><div class=ctl><button class=act ${A('closeItem')}>Devam et <kbd>E</kbd></button></div>${buildHTML()}</div>`, 'mid');
}

export function closeItem() {
  if ($G.S == 'item') back();
}

export function closeOv() {
  if ($G.S != 'shop' && $G.S != 'kazan' && $G.S != 'chalsh') return;
  if ($G.shopN) $G.shopN.lock = 1;
  if ($G.kz) $G.kz.n.lock = 1;
  $G.shopN = null;
  $G.kz = null;
  back();
}

// ---- dünya nesneleri
