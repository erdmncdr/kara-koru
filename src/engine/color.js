// engine/color.js · Kara Koru
// Bu dosya tek dosyalık sürümden (v22) otomatik ayrıldı. Ortak oyun durumu core/store.js içindeki $G nesnesinde.

import { $G } from '../core/store.js';
import { THREE } from './three.js';

export let lin, setLin;

export function __init_8() {
  // ---- renk yönetimi: tasarım renkleri sRGB, hesaplama doğrusal.
  // three.js r152 ve sonrası hex renkleri (malzeme, ışık, sis) otomatik olarak doğrusal
  // çalışma uzayına çevirir. Köşe renkleri ise elle çevrilir (toBG içindeki s2l).
  lin = h => new THREE.Color(h);
  setLin = (c, h) => c.setHex(h);
}
