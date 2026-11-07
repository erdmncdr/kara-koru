// ui/bigmap.js · Kara Koru
// Bu dosya tek dosyalık sürümden (v22) otomatik ayrıldı. Ortak oyun durumu core/store.js içindeki $G nesnesinde.

import { $G } from '../core/store.js';
import { SHC } from '../data/content.js';
import { SET } from '../core/settings.js';

export let BMC;

export function __init_74() {
  // ---- büyük harita (Tab basılıyken)
  $G.BMV = 0;
  BMC = document.createElement('canvas');
  BMC.id = 'bigm';
  BMC.width = BMC.height = 620;
  document.body.appendChild(BMC);
}

export function bigMap(on) {
  if (on && $G.P && $G.P.chal && $G.P.chal.fl && $G.P.chal.fl.nomap) on = 0;
  $G.BMV = on && $G.S == 'play' ? 1 : 0;
  BMC.classList.toggle('on', !!$G.BMV);
  BMC.style.opacity = SET.mo == null ? 1 : SET.mo;
  if ($G.BMV) bigDraw();
}

export function bigDraw() {
  if (!$G.BMV || !$G.P) return;
  const c = BMC.getContext('2d'),
    W = 620,
    k = W / 600,
    X = x => (x + 300) * k,
    Z = z => (z + 300) * k;
  c.clearRect(0, 0, W, W);
  if ($G.MMBG) {
    c.globalAlpha = .95;
    c.drawImage($G.MMBG, 0, 0, W, W);
    c.globalAlpha = 1;
  }
  // sis perdesi: gezilmemiş hücreler karanlık; yumuşak kenar için hücre arası geçiş
  if ($G.P.fog) {
    const F = $G.P.fog, N = 40, cs = W / N;
    c.fillStyle = 'rgba(8,6,10,.8)';
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if (!F[j * N + i]) {
      const nb = (i > 0 && F[j * N + i - 1]) + (i < N - 1 && F[j * N + i + 1]) + (j > 0 && F[(j - 1) * N + i]) + (j < N - 1 && F[(j + 1) * N + i]);
      c.globalAlpha = nb ? .55 : 1;
      c.fillRect(i * cs, j * cs, cs + .5, cs + .5);
    }
    c.globalAlpha = 1;
  }
  // glifler: mini haritayla aynı dil (koyu kontur + dolgu), etiketler konturlu
  c.lineJoin = 'round';
  const glyph = (col, path) => {
    c.beginPath();
    path();
    c.strokeStyle = '#140f0c';
    c.lineWidth = 3.5;
    c.stroke();
    c.fillStyle = col;
    c.fill();
  };
  const label = (t, x, z, col) => {
    c.font = '700 12px ' + getComputedStyle(document.body).fontFamily;
    c.textAlign = 'center';
    c.lineWidth = 3;
    c.strokeStyle = 'rgba(10,7,6,.9)';
    c.strokeText(t, x, z);
    c.fillStyle = col || '#efe3cb';
    c.fillText(t, x, z);
  };
  for (const l of $G.LMS) {
    const x = X(l.x), z = Z(l.z), r = Math.max(6, l.r * k * .6);
    c.strokeStyle = l.f ? 'rgba(227,169,59,.85)' : 'rgba(239,227,203,.45)';
    c.lineWidth = 1.5;
    c.setLineDash(l.f ? [] : [3, 3]);
    c.beginPath();
    c.arc(x, z, r, 0, 6.283);
    c.stroke();
    c.setLineDash([]);
    label(l.n, x, z - r - 5, l.f ? '#e3a93b' : '#d8ccb4');
  }
  for (const ch of $G.CH) {
    const x = X(ch.m.position.x), z = Z(ch.m.position.z), col = ch.free ? '#e2b85a' : '#c49a45';
    glyph(col, () => c.rect(x - 4.5, z - 3.5, 9, 8));
    c.fillStyle = '#1b1410';
    c.fillRect(x - 4.5, z - 1, 9, 1.4);
  }
  for (const sh of $G.SH) if (!sh.d) {
    const x = X(sh.m.position.x), z = Z(sh.m.position.z);
    glyph('#' + SHC[sh.t].toString(16).padStart(6, '0'), () => {
      c.moveTo(x, z - 6.5);
      c.lineTo(x + 5, z - 1);
      c.lineTo(x, z + 6.5);
      c.lineTo(x - 5, z - 1);
      c.closePath();
    });
  }
  for (const n of $G.NP) if (!n.d) {
    const x = X(n.m.position.x), z = Z(n.m.position.z);
    glyph(n.t == 'shop' ? '#efe3cb' : '#b770e6', () => {
      c.moveTo(x, z - 6.5);
      c.lineTo(x + 6, z + 4.5);
      c.lineTo(x - 6, z + 4.5);
      c.closePath();
    });
    if (n.t == 'shop') {
      c.fillStyle = '#1b1410';
      c.fillRect(x - 1.3, z + .5, 2.6, 4);
    }
    label(n.t == 'shop' ? 'Tüccar' : 'Kazan', x, z - 10);
  }
  for (const g of $G.MZ) if (g.st < 3) {
    const x = X(g.m.position.x), z = Z(g.m.position.z);
    glyph(g.st == 2 ? 'rgba(169,192,224,.4)' : g.st == 1 ? '#ff8a3a' : '#a9c0e0', () => {
      c.moveTo(x - 3.5, z + 5);
      c.lineTo(x - 3.5, z - 2);
      c.arc(x, z - 2, 3.5, Math.PI, 0);
      c.lineTo(x + 3.5, z + 5);
      c.closePath();
    });
  }
  if ($G.MZC && $G.MZ.some(g => g.st < 2)) label('Mezarlık', X($G.MZC.x), Z($G.MZC.z) - 14);
  for (const k of $G.KS) if (!k.d) {
    const x = X(k.m.position.x), z = Z(k.m.position.z);
    glyph('#d0453a', () => c.arc(x, z, 6, 0, 6.283));
    c.fillStyle = '#e8d8b0';
    c.fillRect(x - 3.5, z - 1.2, 7, 2.4);
    label('Kös', x, z - 11);
  }
  if ($G.GATE) {
    const x = X($G.GATE.x), z = Z($G.GATE.z), col = $G.GATE.st == 2 ? '#9fe8d8' : '#e2452c';
    const a = Math.atan2($G.GATE.z - $G.P.z, $G.GATE.x - $G.P.x);
    c.save();
    c.translate(x, z);
    c.rotate(a);
    glyph(col, () => {
      c.moveTo(9, 0);
      c.lineTo(-7, -7);
      c.lineTo(-3, 0);
      c.lineTo(-7, 7);
      c.closePath();
    });
    c.restore();
    label($G.GATE.st == 2 ? 'Geçit' : 'Boss kapısı', x, z - 13, col);
  }
  const px = X($G.P.x),
    pz = Z($G.P.z);
  c.save();
  c.translate(px, pz);
  c.rotate(-$G.yaw);
  glyph('#fff', () => {
    c.moveTo(0, -10);
    c.lineTo(-7, 7);
    c.lineTo(0, 4);
    c.lineTo(7, 7);
    c.closePath();
  });
  c.restore();
}
// ---- kumanda (Gamepad API): sol çubuk yürü, sağ çubuk kamera, A zıpla, B kay, X etkileşim, RB/RT atıl, Start duraklat, Select harita
