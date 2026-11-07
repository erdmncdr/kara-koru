// input/gamepad.js · Kara Koru
// Bu dosya tek dosyalık sürümden (v22) otomatik ayrıldı. Ortak oyun durumu core/store.js içindeki $G nesnesinde.

import { $G } from '../core/store.js';
import { toast } from '../core/helpers.js';
import { SET } from '../core/settings.js';
import { OV } from '../core/state.js';
import { clamp } from '../core/util.js';
import { interact } from '../game/interact.js';
import { bigMap } from '../ui/bigmap.js';
import { closeOv } from '../ui/cards.js';
import { closeHelp, closeSet, menu, menuPage, pause, resume } from '../ui/menus.js';


// düğmenin eylem kimliği (ui/actions.js): yeniden çizimden sonra aynı düğmeyi bulmak için
const actKey = el => el && el.dataset && el.dataset.act ? el.dataset.act + '|' + (el.dataset.a || '') : null;
export let GP;

export function __init_75() {
  // ---- kumanda (Gamepad API): sol çubuk yürü, sağ çubuk kamera, A zıpla, B kay, X etkileşim, RB/RT atıl, Start duraklat, Select harita
  GP = {
    b: [],
    on: 0,
    dir: '',
    rep: 0
  };
  // fare ya da dokunuş gelince kumanda odak çerçevesi kalksın
  addEventListener('pointerdown', () => document.documentElement.classList.remove('pad'));
}

// menüde kumandayla gezilebilen denetimler: düğmeler, kartlar, açılır başlık, kaydırıcı ve onay kutuları
const PAD_SEL = 'button:not([disabled]),.cd,summary,input[type=range],input[type=checkbox]';

export function padItems() {
  return [...OV.querySelectorAll(PAD_SEL)].filter(e => e.offsetParent && (e.tagName == 'SUMMARY' || !e.closest('details:not([open])')));
}

function padFocus(e) {
  if (!e) return;
  document.documentElement.classList.add('pad');
  e.focus();
  if (e.scrollIntoView) e.scrollIntoView({ block: 'nearest' });
}

export function padTick(dt) {
  if (GP.off) return;
  let ps;
  try {
    ps = navigator.getGamepads ? navigator.getGamepads() : [];
  } catch (e) {
    GP.off = 1;
    return;
  }
  if (!ps) return;
  let g = null;
  for (const p of ps) if (p && p.connected) {
    g = p;
    break;
  }
  if (!g) {
    if (GP.on) {
      GP.on = 0;
      $G.J.x = $G.J.y = 0;
    }
    return;
  }
  if (!GP.on) {
    GP.on = 1;
    toast('Kumanda bağlandı');
  }
  const ax = i => {
      const v = g.axes[i] || 0;
      return Math.abs(v) < .15 ? 0 : v;
    },
    bt = i => !!(g.buttons[i] && g.buttons[i].pressed),
    pr = i => bt(i) && !GP.b[i];
  if ($G.S == 'play') {
    $G.J.x = ax(0);
    $G.J.y = ax(1);
    const rx = ax(2),
      ry = ax(3);
    $G.yawT -= rx * dt * 3.2 * SET.sens;
    $G.pitT = clamp($G.pitT + ry * dt * 2.2 * SET.sens * (SET.inv ? -1 : 1), .12, 1.2);
    $G.K[' '] = bt(0) ? 1 : 0;
    $G.K.c = bt(1) || bt(6) || bt(4) ? 1 : 0;
    $G.K.Shift = bt(5) || bt(7) ? 1 : 0;
    if (pr(2)) interact();
    if (pr(9)) pause();
    if (bt(8) != !!$G.BMV) bigMap(bt(8) ? 1 : 0);
    GP.dir = 'x'; // oyundan menüye basılı çubukla girilirse, çubuk bırakılana dek odak oynamaz
  } else {
    const items = padItems();
    // sol çubuk da yön tuşu sayılır; basılı tutunca tekrar eder (kaydırıcıyı adım adım tıklamak gerekmesin)
    const sx = ax(0),
      sy = ax(1),
      dir = bt(15) || sx > .6 ? 'r' : bt(14) || sx < -.6 ? 'l' : bt(13) || sy > .6 ? 'd' : bt(12) || sy < -.6 ? 'u' : '';
    let go = '';
    if (GP.dir == 'x') {
      if (!dir) GP.dir = '';
    } else if (dir != GP.dir) {
      GP.dir = dir;
      GP.rep = .4;
      go = dir;
    } else if (dir && (GP.rep -= dt) <= 0) {
      GP.rep = .09;
      go = dir;
    }
    if (items.length) {
      let i = items.indexOf(document.activeElement);
      const mv = d => {
        i = i < 0 ? 0 : (i + d + items.length) % items.length;
        padFocus(items[i]);
      };
      if (go) {
        const cur = items[i];
        if (cur && cur.type == 'range' && (go == 'l' || go == 'r')) {
          // kaydırıcı: sağ ve sol değeri değiştirir, yukarı ve aşağı öbür denetime geçer
          const v = cur.value;
          if (go == 'r') cur.stepUp();else cur.stepDown();
          if (cur.value != v) cur.dispatchEvent(new Event('input', { bubbles: true }));
        } else mv(go == 'r' || go == 'd' ? 1 : -1);
      }
      if (pr(0)) {
        const cur = items[i]; // yön ve A aynı karede gelirse yeni odaklanan denetim
        if (!cur) mv(0);else if (cur.type != 'range') {
          const key = actKey(cur);
          cur.click();
          // tıklama ekranı yeniden çizdiyse (sekme, seçenek, meydan okuma) odak kaybolmasın
          if (!cur.isConnected && key) {
            const nx = [...OV.querySelectorAll('button:not([disabled])')].find(e => actKey(e) == key),
              cl = nx && nx.closest('details:not([open])');
            if (nx) padFocus(cl ? cl.querySelector('summary') : nx);
          }
        }
      }
    }
    if (pr(9) && $G.S == 'pause') resume();
    // B geri götürür (klavyedeki Esc ile aynı yerler)
    if (pr(1)) {
      const pg = $G.menuPg || 'ana';
      if ($G.S == 'shop' || $G.S == 'kazan' || $G.S == 'chalsh') closeOv();else if ($G.S == 'set') closeSet();else if ($G.S == 'help') closeHelp();else if ($G.S == 'lb' || $G.S == 'otag') menu();else if ($G.S == 'menu' && pg != 'ana') menuPage(pg == 'harita' ? 'kahraman' : 'ana');
    }
  }
  GP.b = g.buttons.map(b => b.pressed);
}
