// ui/screenfx.js · Kara Koru
// Bu dosya tek dosyalık sürümden (v22) otomatik ayrıldı. Ortak oyun durumu core/store.js içindeki $G nesnesinde.

import { $G } from '../core/store.js';
import { R } from '../engine/renderer.js';

export let SPL, SPX, LHV, FZV;

export function __init_67() {
  // ---- ekran katmanları: hız çizgileri, düşük can, donma
  SPL = document.createElement('canvas');
  SPX = SPL.getContext('2d');
  LHV = document.createElement('div');
  FZV = document.createElement('div');
  SPL.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none';
  LHV.style.cssText = 'position:fixed;inset:0;pointer-events:none;opacity:0;background:radial-gradient(ellipse at center,transparent 48%,rgba(140,8,6,.62))';
  FZV.style.cssText = 'position:fixed;inset:0;pointer-events:none;opacity:0;transition:opacity .35s;background:radial-gradient(ellipse at center,rgba(150,210,255,.05) 35%,rgba(120,190,255,.4))';
  R.domElement.after(SPL, LHV, FZV);
  $G.splOn = 0;
}

export function ovUpd() {
  const pl = $G.S == 'play' && $G.P,
    vm = pl ? Math.hypot($G.P.vx, $G.P.vz) : 0,
    k = pl ? Math.max(0, Math.min(1, (vm - 16) / 24)) : 0;
  if (SPX && (k > 0 || $G.splOn)) {
    const W = innerWidth >> 1,
      Hh = innerHeight >> 1;
    if (SPL.width != W || SPL.height != Hh) {
      SPL.width = W;
      SPL.height = Hh;
    }
    SPX.clearRect(0, 0, W, Hh);
    $G.splOn = k > 0;
    if (k > 0) {
      const cx = W / 2,
        cy = Hh / 2,
        dg = Math.hypot(W, Hh) / 2;
      SPX.strokeStyle = 'rgba(236,244,255,' + (.1 + .28 * k) + ')';
      SPX.lineWidth = 1;
      SPX.beginPath();
      for (let i = 0; i < 10 + 30 * k; i++) {
        const a = Math.random() * 6.283,
          r0 = dg * (.58 + Math.random() * .32),
          ln = dg * (.08 + .22 * k * Math.random());
        SPX.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
        SPX.lineTo(cx + Math.cos(a) * (r0 + ln), cy + Math.sin(a) * (r0 + ln));
      }
      SPX.stroke();
    }
  }
  const hr = pl ? $G.P.hp / $G.P.mh : 1;
  LHV.style.opacity = hr < .35 && hr > 0 ? ((1 - hr / .35) * (.55 + .45 * Math.sin($G.T * 7))).toFixed(3) : '0';
  FZV.style.opacity = pl && $G.P.frz > 0 ? '1' : '0';
}
// ---- kılıç savuruşu: parlayan hilal
