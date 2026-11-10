// ui/console-impl.js · Kara Koru
// Komut konsolu (geliştirici aracı). ` tuşu açar. Komutlar Türkçe; 'yardim' listeler.
// YALNIZ geliştirme sunucusunda ve test derlemesinde yüklenir (ui/console.js); yayın derlemesine girmez.

import { $G } from '../core/store.js';
import { $ } from '../core/util.js';
import { toast } from '../core/helpers.js';
import { ITD, QD, TDF, WD, saveMeta } from '../data/content.js';
import { KINDS } from '../data/enemies.js';
import { spawn } from '../game/enemies.js';
import { addItem } from '../game/items.js';
import { calc, newW } from '../game/stats.js';
import { summonBoss } from '../game/interact.js';
import { nextStage } from '../game/flow.js';
import { SET } from '../core/settings.js';
import { DRS, R } from '../engine/renderer.js';
import { iskinStats } from '../engine/iskin.js';
import { showHelp } from './menus.js';

/** @type {any} */
let el = null, inp = null, log = null, open = false, hi = -1;
const HIST = [];
// Tab tamamlama: komut adı, sonra komuta göre anahtar
function complete(v) {
  const parts = v.split(/\s+/), c = parts[0] || '';
  if (parts.length <= 1) {
    const ks = Object.keys(CMD).filter(k => k.startsWith(c));
    return ks.length == 1 ? ks[0] + ' ' : ks.length ? (out(ks.join('  ')), v) : v;
  }
  const pool = { esya: ITD, silah: WD, tom: TDF, dogur: KINDS, kilit: null }[c];
  const last = parts[parts.length - 1];
  const keys = pool ? Object.keys(pool) : c == 'kilit' ? Object.keys($G.META.l).concat(Object.keys(WD).map(k => WD[k].lock), Object.keys(ITD).map(k => ITD[k].lock)).filter(Boolean) : [];
  const ks = [...new Set(keys)].filter(k => k.startsWith(last));
  if (ks.length == 1) return parts.slice(0, -1).concat(ks[0]).join(' ') + ' ';
  if (ks.length > 1) out(ks.slice(0, 30).join('  ') + (ks.length > 30 ? ' …' : ''));
  return v;
}

function ensure() {
  if (el) return;
  el = document.createElement('div');
  el.id = 'con';
  el.innerHTML = '<div id=conl></div><input id=coni placeholder="komut yaz, yardim için: yardim" autocomplete=off>';
  document.body.appendChild(el);
  log = el.firstChild;
  inp = el.lastChild;
  inp.addEventListener('keydown', e => {
    e.stopPropagation();
    if (e.key == 'Enter') {
      const v = inp.value.trim();
      inp.value = '';
      hi = -1;
      if (v) {
        HIST.push(v);
        run(v);
      }
    } else if (e.key == 'Escape' || e.key == '`' || e.key == 'F10') {
      e.preventDefault();
      conToggle(0);
    } else if (e.key == 'ArrowUp' && HIST.length) {
      e.preventDefault();
      hi = hi < 0 ? HIST.length - 1 : Math.max(0, hi - 1);
      inp.value = HIST[hi];
    } else if (e.key == 'ArrowDown' && HIST.length) {
      e.preventDefault();
      hi = hi < 0 ? -1 : hi + 1;
      inp.value = hi >= HIST.length ? (hi = -1, '') : HIST[hi];
    } else if (e.key == 'Tab') {
      e.preventDefault();
      inp.value = complete(inp.value);
    }
  });
}

function out(s) {
  ensure();
  const d = document.createElement('div');
  d.textContent = s;
  log.appendChild(d);
  while (log.children.length > 14) log.removeChild(log.firstChild);
}

export function conToggle(on) {
  if (SET.con === 0) return;
  ensure();
  open = on == null ? !open : !!on;
  el.classList.toggle('on', open);
  if (open) {
    if (!log.children.length) out('Komut konsolu. yardim: komut listesi · Tab: tamamlama · ↑↓: geçmiş · F10 ya da ` kapatır');
    inp.focus();
    $G.K = {};
  } else inp.blur();
}

// açıklamalı yardım
const HELP = {
  yardim: 'yardim [komut]: komut listesi ya da bir komutun açıklaması',
  perf: 'perf: fps, en uzun kare, çizim ve program sayısı',
  fps: 'fps: köşede sürekli fps göstergesini aç/kapat',
  altin: 'altin N: N altın ekler (varsayılan 100)',
  gumus: 'gumus N: N gümüş ekler (menüde de çalışır)',
  seviye: 'seviye N: N seviye atlatır',
  can: 'can: canı doldurur',
  olumsuz: 'olumsuz: ölümsüzlüğü açar/kapar',
  esya: 'esya ANAHTAR [N]: eşya ekler (Tab anahtarları tamamlar)',
  silah: 'silah ANAHTAR: silah ekler',
  tom: 'tom ANAHTAR [N]: tom ekler ya da N seviye yükseltir',
  dogur: 'dogur TUR [N]: N düşman doğurur',
  boss: 'boss: kapıdaki boss’u çağırır',
  asama: 'asama: sonraki aşamaya geçer',
  zaman: 'zaman N: aşama saatini N saniyeye alır',
  temizle: 'temizle: bütün düşmanları öldürür',
  kapi: 'kapi: seni boss kapısına ışınlar',
  kilit: 'kilit ANAHTAR: bir kilidi açar (silah, tom, eşya, karakter, harita, şapka)',
  achepsi: 'achepsi: bütün kilitleri açar',
  gorevler: 'gorevler: bitmemiş ilk 8 görevi ilerlemesiyle listeler',
  turler: 'turler: düşman türü anahtarları',
  kisayollar: 'kisayollar: tuş kısayolları penceresi (F1)',
  ipuclari: 'ipuclari sifirla: ipuçlarını baştan göster'
};

export function conOpen() {
  return open;
}

const CMD = {
  yardim: a => { if (a && HELP[a]) return out(HELP[a]); out('Koşu: altin · gumus · seviye · can · olumsuz · esya · silah · tom · dogur · boss · asama · zaman · temizle · kapi'); out('Kilit: kilit · achepsi · gorevler · turler'); out('Araç: perf · fps · kisayollar · ipuclari sifirla · yardim KOMUT'); },
  fps: () => { let d = $('fpsl'); if (d) { d.remove(); clearInterval($G.fpsI); $G.fpsI = 0; return out('fps göstergesi kapandı'); } d = document.createElement('div'); d.id = 'fpsl'; document.body.appendChild(d); $G.fpsI = setInterval(() => { const pf = $G.PERF; d.textContent = `${(pf.lastFps || 0).toFixed(0)} fps · en uzun ${(pf.lastMax * 1000).toFixed(0)} ms · ${$G.E ? $G.E.length : 0} düşman · ${R.info.render.calls} çizim`; }, 500); out('fps göstergesi açık'); },
  kapi: () => { if (!$G.GATE) return out('kapı yok'); $G.P.x = $G.GATE.x + 4; $G.P.z = $G.GATE.z + 4; $G.P.y = $G.GATE.m.position.y + 2; $G.P.vx = $G.P.vz = 0; out('kapıya ışınlandın'); },
  kilit: a => { if (!a) return out('kilit ANAHTAR'); $G.META.l[a] = 1; saveMeta(); out('kilit açıldı: ' + a); },
  turler: () => out(Object.keys(KINDS).filter(k => !KINDS[k].hide).join(' ')),
  kisayollar: () => { conToggle(0); showHelp(); },
  ipuclari: a => { if (a == 'sifirla') { localStorage.removeItem('kk_tips'); $G.TIPS = {}; out('ipuçları sıfırlandı'); } else out('ipuclari sifirla'); },
  perf: () => { const pf = $G.PERF, i = R.info; out(`fps ${(pf.lastFps || 0).toFixed(0)} · en uzun kare ${(pf.lastMax * 1000).toFixed(0)} ms · 50 ms üstü ${pf.lastOver} kare/5 sn · çözünürlük ${($G.DRK * 100).toFixed(0)}% · düşman ${$G.E.length} · çizim ${i.render.calls} · program ${i.programs.length} · geometri ${i.memory.geometries} · doku ${i.memory.textures} · ön-derleme ${$G.warmMs == null ? 'yok' : $G.warmMs.toFixed(0) + ' ms'} · instanced batch ${iskinStats().batches} (${iskinStats().live} düşman)`); },
  altin: a => { $G.P.gold += +a || 100; out('altın: ' + $G.P.gold); },
  gumus: a => { $G.META.s += +a || 100; saveMeta(); out('gümüş: ' + $G.META.s); },
  seviye: a => { const n = +a || 1; for (let i = 0; i < n; i++) $G.P.xp += $G.P.need; out('tecrübe eklendi'); },
  can: () => { $G.P.hp = $G.P.mh; out('can doldu'); },
  olumsuz: () => { $G.P.inv = $G.P.inv > 1e8 ? 0 : 1e9; out('ölümsüzlük: ' + ($G.P.inv > 1e8 ? 'açık' : 'kapalı')); },
  esya: (a, b) => { if (!ITD[a]) return out('eşya yok: ' + a); addItem(a, +b || 1); out(ITD[a].n + ' eklendi'); },
  silah: a => { if (!WD[a]) return out('silah yok: ' + a); $G.P.W.push(newW(a)); calc(); out(WD[a].n + ' eklendi'); },
  tom: (a, b) => { if (!TDF[a]) return out('tom yok: ' + a); const n = +b || 1; const t = $G.P.T.find(x => x.k == a); if (t) { t.lv += n; t.v += TDF[a].v * n; } else $G.P.T.push({ k: a, lv: n, v: TDF[a].v * n }); calc(); out(TDF[a].n + ' +' + n); },
  dogur: (a, b) => { if (!KINDS[a]) return out('tür yok: ' + a + ' (örn. ' + Object.keys(KINDS).slice(0, 6).join(', ') + ')'); const n = +b || 1; for (let i = 0; i < n; i++) spawn(a); out(n + ' ' + KINDS[a].n); },
  boss: () => { if ($G.GATE) { $G.GATE.st = 0; summonBoss(); out('boss çağrıldı'); } },
  asama: () => { if ($G.GATE) { $G.GATE.st = 2; nextStage(); out('sonraki aşama'); } },
  zaman: a => { $G.P.stT = +a || 0; out('aşama saati ' + $G.P.stT); },
  temizle: () => { for (const e of $G.E) e.hp = 0; out('düşmanlar temizleniyor'); },
  achepsi: () => { for (const q of QD) if (q.ul) $G.META.l[q.ul] = 1; for (const k in WD) if (WD[k].lock) $G.META.l[WD[k].lock] = 1; for (const k in TDF) if (TDF[k].lock) $G.META.l[TDF[k].lock] = 1; for (const k in ITD) if (ITD[k].lock) $G.META.l[ITD[k].lock] = 1; saveMeta(); out('bütün kilitler açıldı'); },
  gorevler: () => { let n = 0; for (const q of QD) { const [c, m] = q.f(); if (c < m) { out(q.n + ': ' + Math.min(c, m) + '/' + m); if (++n >= 8) break; } } }
};

// sıralamayı etkilemeyen komutlar (bilgi ve görünüm)
const SAFE = new Set(['yardim', 'perf', 'fps', 'gorevler', 'turler', 'kisayollar', 'ipuclari']);

export function run(line) {
  const [c, ...a] = line.toLocaleLowerCase('tr').replace(/ı/g, 'i').split(/\s+/);
  if (!CMD[c]) return out('bilinmeyen komut: ' + c + ' (yardim)');
  if (!$G.P && !['gumus', 'achepsi', 'yardim', 'gorevler', 'kilit', 'turler', 'kisayollar', 'ipuclari', 'perf', 'fps'].includes(c)) return out('önce koşuya gir');
  // oyunu etkileyen komut kullanılan koşu sıralamaya girmez; menüde gümüş ya da kilit veren komutlar profili işaretler
  if (!SAFE.has(c)) {
    if ($G.P && $G.S != 'menu') {
      if (!$G.P.con) out('Bu koşu artık sıralamaya yüklenmeyecek (konsol kullanıldı).');
      $G.P.con = 1;
    }
    if (c == 'gumus' || c == 'kilit' || c == 'achepsi') {
      $G.META.con = 1;
      saveMeta();
    }
  }
  try {
    CMD[c](...a);
  } catch (e) {
    out('hata: ' + e.message);
  }
}
