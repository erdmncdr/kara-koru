// core/util.js · Kara Koru
// Bu dosya tek dosyalık sürümden (v22) otomatik ayrıldı. Ortak oyun durumu core/store.js içindeki $G nesnesinde.

import { $G } from './store.js';

export let $, cl, c1, rn, clamp;

export function __init_1() {
  $ = i => document.getElementById(i);
  cl = v => {
    const r = $G.ARENA || 270;
    return Math.max(-r, Math.min(r, v));
  };
  c1 = v => Math.max(-1, Math.min(1, v));
  rn = (a, b) => a + Math.random() * (b - a);
  clamp = (v, a, b) => Math.max(a, Math.min(b, v));
}
