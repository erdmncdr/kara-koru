// input/input.js · Kara Koru
// Bu dosya tek dosyalık sürümden (v22) otomatik ayrıldı. Ortak oyun durumu core/store.js içindeki $G nesnesinde.

import { $G } from '../core/store.js';
import { aInit, aVol } from '../audio/engine.js';
import { lockP, toast } from '../core/helpers.js';
import { SET } from '../core/settings.js';
import { $, c1, clamp } from '../core/util.js';
import { R } from '../engine/renderer.js';
import { goReady, start } from '../game/flow.js';
import { buy, interact, kzPick } from '../game/interact.js';
import { bigMap } from '../ui/bigmap.js';
import { chPick, closeItem, closeOv, reroll, skipLv } from '../ui/cards.js';
import { menu, menuPage, pause, resume, selC } from '../ui/menus.js';
import { heroIdx } from '../game/heroes.js';
import { conOpen, conToggle } from '../ui/console.js';
import { closeHelp, showHelp } from '../ui/menus.js';

export let key, TT, tend;

export function __init_79() {
  // ---- girdi
  key = e => e.key.length == 1 ? e.key.toLocaleLowerCase('tr').replace('ı', 'i') : e.key;
  addEventListener('keydown', e => {
    const k = key(e);
    if (e.target && /** @type {HTMLElement} */ (e.target).tagName == 'INPUT') return;
    $G.K[k] = 1;
    if (k == ' ' || k.startsWith('Arrow') || k == 'Tab') e.preventDefault();
    // Ctrl kayma tuşu: oyundayken Ctrl+S, Ctrl+D gibi tarayıcı kısayolları tetiklenmesin (Ctrl+W engellenemez, aşağıda çıkış onayı var)
    if (e.ctrlKey && k != 'Control' && $G.S == 'play') e.preventDefault();
    if (e.repeat) return;
    if ((e.key == '`' || e.key == 'F10') && SET.con !== 0 && ($G.S == 'play' || $G.S == 'pause')) {
      e.preventDefault();
      conToggle();
      return;
    }
    if (e.key == 'F1' || (e.key == '?' && ($G.S == 'play' || $G.S == 'pause' || $G.S == 'help'))) {
      e.preventDefault();
      if ($G.S == 'help') closeHelp();else if ($G.S == 'play' || $G.S == 'pause') showHelp();
      return;
    }
    if ($G.S == 'help' && k == 'Escape') {
      closeHelp();
      return;
    }
    if (k == 'Escape' && $('tip') && $('tip').classList.contains('on')) {
      $('tip').classList.remove('on'); // açık ipucunu kapat, duraklatma
      return;
    }
    if (conOpen()) return;
    aInit();
    if (k == 'm') {
      $G.muted = $G.muted ? 0 : 1;
      aVol();
      toast($G.muted ? 'Ses kapalı' : 'Ses açık');
    }
    if ($G.S == 'lb' || $G.S == 'otag') {
      if (k == 'Escape') menu();
    } else if ($G.S == 'menu') {
      const pg = $G.menuPg || 'ana';
      if (pg == 'kahraman') {
        if ('123456789'.includes(k) && heroIdx()[+k - 1] != null) selC(heroIdx()[+k - 1], 1); // rakam: etkin kadrodaki sıra
        if (k == 'ArrowDown' || k == 'ArrowRight') selC($G.CI + 1, 1);
        if (k == 'ArrowUp' || k == 'ArrowLeft') selC($G.CI - 1, 1);
      }
      if (k == 'Enter' && (e.target == document.body || /** @type {HTMLElement} */ (e.target).classList.contains('hc'))) pg == 'ana' ? menuPage('kahraman') : pg == 'kahraman' ? menuPage('harita') : start();
      if (k == 'Escape' && pg != 'ana') menuPage(pg == 'harita' ? 'kahraman' : 'ana');
    } else if ($G.S == 'choice') {
      if ('123'.includes(k) && SET.nk !== 0) chPick(+k - 1);
      if (k == 'r') reroll();
      if (k == 'g') skipLv();
    } else if ($G.S == 'item') {
      if (k == 'e' || k == 'Enter' && e.target == document.body) closeItem();
    } else if ($G.S == 'shop') {
      if ('123'.includes(k)) buy(+k - 1);
      if (k == 'e' || k == 'Escape') closeOv();
    } else if ($G.S == 'kazan') {
      if ('123456789'.includes(k)) kzPick(+k - 1);
      if (k == 'e' || k == 'Escape') closeOv();
    } else if ($G.S == 'chalsh') {
      if (k == 'e' || k == 'Escape') closeOv();
    } else if ($G.S == 'ready') {
      if (k == 'e' || k == 'Enter' || k == ' ') goReady();
    } else if ($G.S == 'play') {
      if (k == 'e' || k == 'f') interact();
      if (k == 'p' || k == 'Escape') pause();
      if (k == 'Tab') bigMap(1);
    } else if ($G.S == 'pause') {
      if (k == 'p' || k == 'Escape') resume();
    } else if ($G.S == 'over') {
      if (k == 'r') start();
    }
  });
  addEventListener('keyup', e => {
    $G.K[key(e)] = 0;
    if (e.key == 'Shift') $G.K.Shift = 0;
    if (e.key == 'Tab') bigMap(0);
  });
  addEventListener('blur', () => {
    $G.K = {};
    bigMap(0);
  });
  // Windows ve Linux'ta kayarken ileri basmak Ctrl+W eder ve sekmeyi kapatır; koşu sürerken Ctrl basılıysa tarayıcı onay sorsun
  addEventListener('beforeunload', e => {
    if ($G.S == 'play' && $G.K.Control) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
  $G.PLK = 0;
  document.addEventListener('pointerlockchange', () => {
    const l = !!document.pointerLockElement;
    // Kilidi biz bıraktıysak (ov) bu kayıp duraklatma değildir; yoksa Esc ile çıkıştır.
    if (!l && $G.PLK && $G.S == 'play' && !$G.PLX) pause();
    if (!l) $G.PLX = 0;
    $G.PLK = l;
  });
  addEventListener('wheel', e => {
    if ($G.S == 'play' && document.pointerLockElement) {
      $G.K[' '] = 1;
      setTimeout(() => $G.K[' '] = 0, 70);
    }
  }, {
    passive: true
  });
  addEventListener('pointerdown', aInit, {
    once: true
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && $G.AC) aInit();
  });
  try {
    document.fonts && document.fonts.load('26px "Noto Sans Old Turkic"', '\u{10C45}').then(() => {
      if (document.fonts.check('26px "Noto Sans Old Turkic"', '\u{10C45}')) document.body.classList.add('runes');
    }).catch(() => {});
  } catch (e) {}
  R.domElement.addEventListener('contextmenu', e => e.preventDefault());
  R.domElement.addEventListener('mousedown', e => {
    $G.md = 1;
    if (e.button == 2) $G.K.rmb = $G.K.Shift = 1; // sağ tık = atılma
    if ($G.S == 'play') lockP();
  });
  addEventListener('mouseup', e => {
    $G.md = 0;
    if (e.button == 2) $G.K.rmb = $G.K.Shift = 0;
  });
  addEventListener('mousemove', e => {
    if ($G.S == 'play' && (document.pointerLockElement || $G.md)) {
      const s = .0028 * SET.sens;
      $G.yawT -= clamp(e.movementX, -90, 90) * s;
      $G.pitT = clamp($G.pitT + clamp(e.movementY, -90, 90) * s * (SET.inv ? -1 : 1), .12, 1.2);
    }
  });
  TT = {};
  addEventListener('touchstart', e => {
    for (const t of e.changedTouches) {
      const tg = /** @type {HTMLElement} */ (t.target);
      if (tg.closest && tg.closest('.mb,#ov')) continue;
      TT[t.identifier] = {
        s: t.clientX < innerWidth / 2 ? 'j' : 'l',
        x: t.clientX,
        y: t.clientY,
        ox: t.clientX,
        oy: t.clientY
      };
    }
  }, {
    passive: true
  });
  addEventListener('touchmove', e => {
    for (const t of e.changedTouches) {
      const o = TT[t.identifier];
      if (!o) continue;
      if (o.s == 'j') {
        $G.J.x = c1((t.clientX - o.ox) / 50);
        $G.J.y = c1((t.clientY - o.oy) / 50);
      } else {
        $G.yawT -= (t.clientX - o.x) * .007 * SET.sens;
        $G.pitT = clamp($G.pitT + (t.clientY - o.y) * .005 * SET.sens * (SET.inv ? -1 : 1), .12, 1.2);
        o.x = t.clientX;
        o.y = t.clientY;
      }
    }
  }, {
    passive: true
  });
  tend = e => {
    for (const t of e.changedTouches) {
      const o = TT[t.identifier];
      if (o && o.s == 'j') $G.J.x = $G.J.y = 0;
      delete TT[t.identifier];
    }
  };
  addEventListener('touchend', tend);
  addEventListener('touchcancel', tend);
  $('bj').addEventListener('touchstart', e => {
    e.preventDefault();
    $G.K[' '] = 1;
  });
  $('bj').addEventListener('touchend', () => $G.K[' '] = 0);
  $('bc').addEventListener('touchstart', e => {
    e.preventDefault();
    $G.K.c = 1;
  });
  // Kullan: otomatik etkileşimin bilerek atladığı şeyler (boss kapısı, tabut, Kara sunak, Kan sunağı, haydut taşı, çalı)
  // dokunmatikte başka yolla tetiklenemiyordu; boss çağrılamıyor, Mezarlık bitirilemiyordu
  $('be').addEventListener('touchstart', e => {
    e.preventDefault();
    interact();
  });
  $('bs').addEventListener('touchstart', e => {
    e.preventDefault();
    $G.K.Shift = 1;
    setTimeout(() => $G.K.Shift = 0, 120);
  });
  $('bc').addEventListener('touchend', () => $G.K.c = 0);

}
