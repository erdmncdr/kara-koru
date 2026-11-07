// core/boot.js · Kara Koru
// Bu dosya tek dosyalık sürümden (v22) otomatik ayrıldı. Ortak oyun durumu core/store.js içindeki $G nesnesinde.

import { $G } from './store.js';
import { applyUI } from '../ui/menus.js';
import { VFX } from '../engine/vfx.js';
import { SET } from './settings.js';
import { loop } from './loop.js';
import { mkE } from '../game/creatures.js';
import { hero } from '../game/heroes.js';
import { menu } from '../ui/menus.js';
import { warmShaders } from '../engine/warm.js';

export function __init_80() {
  applyUI();
  VFX.setOp(SET.po == null ? 1 : SET.po);
  menu();
  requestAnimationFrame(loop);
  // shader'lar menüde derlensin, oyun ortasında değil
  setTimeout(() => warmShaders(), 60);
  {
    let i = 0;
    const pre = [() => hero(0), () => hero(1), () => hero(2), () => hero(3), ...[0, 1, 2, 3, 4, 5].map(t => () => mkE(t, 0)), () => mkE(3, 1)];
    const step = () => {
      if (i < pre.length) {
        try {
          pre[i++]();
        } catch (e) {}
        setTimeout(step, 30);
      }
    };
    setTimeout(step, 300);
  }
}
