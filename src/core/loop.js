// core/loop.js · Kara Koru
// Bu dosya tek dosyalık sürümden (v22) otomatik ayrıldı. Ortak oyun durumu core/store.js içindeki $G nesnesinde.

import { $G } from './store.js';
import { ambTick } from '../audio/ambience.js';
import { musTick } from '../audio/music.js';
import { SET } from './settings.js';
import { RM } from '../data/content.js';
import { gfxRender } from '../engine/gfx.js';
import { DRS, cam, dl, rs, sc } from '../engine/renderer.js';
import { eyeSync } from '../engine/eyes.js';
import { dnUpd } from '../engine/vfx.js';
import { featTick } from '../game/features.js';
import { animH } from '../game/hero-anim.js';
import { glbTick } from '../engine/glbhero.js';
import { upd } from '../game/update.js';
import { padTick } from '../input/gamepad.js';
import { bigDraw } from '../ui/bigmap.js';
import { hud, wlUpd } from '../ui/hud.js';
import { ovUpd } from '../ui/screenfx.js';
import { ffUpd, mapUpd, pl } from '../world/ambient.js';
import { camHit, groundTop, skyD } from '../world/terrain.js';
import { OKL } from '../engine/realtrees.js';
import { conOpen } from '../ui/console.js';
import { start } from '../game/flow.js';
import { toast } from './helpers.js';
import { warmTick } from '../engine/warm.js';
import { iskinUpd } from '../engine/iskin.js';

export function __init_78() {
  $G.last = 0;
}

export function loop(t) {
  requestAnimationFrame(loop);
  // kare sınırı: oyunda ayar (varsayılan 60); menü ve hazır ekranında 30, diğer kaplamalarda (duraklatma, kartlar,
  // Otağ, sıralama, ayarlar) 20 kare yeter: sahne arkada durur, tam hızda çizmek yalnız ısıtır
  const cap = $G.S == 'play' ? SET.fps : Math.min(SET.fps || 1e3, $G.S == 'menu' || $G.S == 'ready' || $G.S == 'trans' ? 30 : 20);
  if (cap > 0 && t - $G.last < 1000 / cap - 1.5) return;
  const raw = (t - $G.last) / 1000 || 0,
    dt = Math.min(.05, raw);
  $G.last = t;
  {
    // kare süresi izleme: 5 saniyelik pencerede en uzun kare ve 50 ms üstü kare sayısı
    const pf = $G.PERF;
    pf.n++;
    pf.t += raw;
    if (raw > pf.max) pf.max = raw;
    if (raw > .05) pf.over++;
    if (pf.t > 5) {
      pf.lastMax = pf.max;
      pf.lastOver = pf.over;
      pf.lastFps = pf.n / pf.t;
      pf.max = pf.over = pf.n = pf.t = 0;
    }
  }
  // hızlı yeniden başlat: R basılı
  if (SET.qr !== 0 && $G.K.r && ($G.S == 'play' || $G.S == 'pause') && !conOpen()) {
    $G.qrT = ($G.qrT || 0) + dt;
    if ($G.qrT > 1.2) {
      $G.qrT = 0;
      $G.K = {};
      toast('Yeniden başlatıldı');
      start();
    }
  } else $G.qrT = 0;
  $G.T += dt;
  padTick(dt);
  featTick(dt);
  if ($G.BMV && Math.floor($G.T * 10) != Math.floor(($G.T - dt) * 10)) bigDraw();
  dnUpd(dt);
  const mn = $G.S == 'menu';
  if ($G.S == 'play') {
    const ds = $G.HS > 0 ? dt * .08 : dt;
    $G.HS = Math.max(0, $G.HS - dt);
    upd(ds);
    if ($G.S != 'over' && $G.P) hud();
  } else if (mn) {
    $G.yaw = $G.yawT = 0;
    $G.pit = $G.pitT = .16;
    $G.H.g.rotation.y += dt * .35;
  }
  musTick(dt, $G.S == 'play' && ($G.P.swarm || $G.P.akin > 0 || $G.E.some(e => e.t == 3)));
  ambTick(dt, $G.P ? Math.hypot($G.P.vx, $G.P.vz) : 0);
  ovUpd();
  mapUpd($G.S == 'play' ? dt : dt * .5);
  {
    const lr = Math.min(1, dt * (6 + 34 * (1 - (SET.sm || 0))));
    $G.yaw += ($G.yawT - $G.yaw) * lr;
    $G.pit += ($G.pitT - $G.pit) * lr;
  }
  if ($G.P) {
    if ($G.S == 'play' || mn) animH($G.HS > 0 ? dt * .08 : dt), glbTick($G.HS > 0 ? dt * .08 : dt);
    $G.FX += ($G.P.x - $G.FX) * Math.min(1, dt * 22);
    $G.FZ += ($G.P.z - $G.FZ) * Math.min(1, dt * 22);
    $G.FY += ($G.P.y - $G.FY) * Math.min(1, dt * 9);
    let d = mn ? 7.2 : SET.cd || 14,
      ty = mn ? 1.35 : 1.8,
      ox = mn && innerWidth > 760 ? 2.3 : 0,
      tx = $G.FX - Math.cos($G.yaw) * ox,
      tz = $G.FZ + Math.sin($G.yaw) * ox,
      cx = tx + Math.sin($G.yaw) * Math.cos($G.pit) * d,
      cz = tz + Math.cos($G.yaw) * Math.cos($G.pit) * d,
      ly = $G.FY + ty;
    let cy2 = Math.max(ly + Math.sin($G.pit) * d, groundTop(cx, cz) + (mn ? .6 : 2.2));
    if (!mn) for (let f = .3; f < 1; f += .23) {
      const h = groundTop(tx + (cx - tx) * f, tz + (cz - tz) * f) + 1.2,
        yl = ly + (cy2 - ly) * f;
      if (yl < h) cy2 = Math.max(cy2, ly + (h - ly) / f);
    }
    // kamera kolu: karakterle kamera arasında ağaç gövdesi ya da kaya varsa kamera hemen öne çekilir (en az 3 birim),
    // yol açılınca yavaşça geri gider. Yapraklar için kamera oynamaz, yapraklar saydamlaşır (OKL, aşağıda)
    if (!mn) {
      const k = camHit(tx, ly, tz, cx, cy2, cz),
        hd = Math.max(Math.min(1, 3 / d), k),
        ck = $G.camK == null ? 1 : $G.camK;
      $G.camK = hd < ck ? hd : ck + (hd - ck) * Math.min(1, dt * 2.5);
      if ($G.camK < .999) {
        cx = tx + (cx - tx) * $G.camK;
        cz = tz + (cz - tz) * $G.camK;
        cy2 = Math.max(ly + (cy2 - ly) * $G.camK, groundTop(cx, cz) + .8);
      }
    }
    cam.position.set(cx, cy2, cz);
    if (!RM) {
      {
        const sk = $G.shk * (SET.sh == 0 ? 0 : 1);
        cam.position.x += Math.sin($G.T * 47) * sk * .5;
        cam.position.y += Math.cos($G.T * 39) * sk * .5;
      }
    }
    $G.shk = Math.max(0, $G.shk - dt * 3);
    cam.lookAt(tx, ly, tz);
    cam.fov += ((mn ? 45 : (SET.fov || 70) + (cam.aspect < 1 ? Math.min(18, (1 - cam.aspect) * 30) : 0) + Math.min(16, Math.hypot($G.P.vx, $G.P.vz) * .4) + ($G.P.dsh > 0 ? 8 : 0)) - cam.fov) * Math.min(1, dt * 8);
    cam.updateProjectionMatrix();
    // yaprak saydamlığı: karakterin başının görüş uzayındaki konumu
    cam.updateMatrixWorld();
    OKL.uOkl.value = mn ? 0 : 1;
    if (!mn) OKL.uHeroV.value.set($G.P.x, $G.P.y + .6, $G.P.z).applyMatrix4(cam.matrixWorldInverse);
    skyD.position.copy(cam.position);
    $G.sunM.position.set($G.P.x + 250, 180, $G.P.z - 250);
    if ($G.moonM) {
      $G.moonM.position.set($G.P.x - 230, 165, $G.P.z + 210);
      $G.moonG.position.copy($G.moonM.position);
    }
    skyD.material.uniforms.t.value = $G.T;
    $G.stars.position.set($G.P.x, 0, $G.P.z);
    pl.position.set($G.P.x, $G.P.y + 3, $G.P.z);
    ffUpd();
    dl.target.position.set($G.P.x, 0, $G.P.z);
    dl.position.set($G.P.x + 50, $G.P.y + 36, $G.P.z - 50);
  }
  wlUpd();
  // Matrisler burada bir kez güncellenir; renderer (matrixWorldAutoUpdate=false) bir daha gezmez.
  sc.updateMatrixWorld();
  iskinUpd();
  eyeSync();
  gfxRender(dt);
  warmTick();
  if ($G.S == 'play') {
    DRS.ema += (dt - DRS.ema) * .05;
    DRS.t += dt;
    if (DRS.t > 4) {
      DRS.t = 0;
      const k0 = $G.DRK;
      // her adım render hedeflerini yeniden ayırır (kısa takılma): az adım, seyrek
      // eşikler hedef kare süresine göre (60'ta 27 / 15.5 ms): 30 FPS sınırındaki oyuncu yavaş sanılıp çözünürlüğü düşmesin
      const hk = 1 / (SET.fps > 0 ? Math.min(60, SET.fps) : 60);
      if (DRS.ema > hk * 1.62 && $G.DRK > .6) $G.DRK = Math.max(.6, $G.DRK - .2);else if (DRS.ema < hk * .93 && $G.DRK < 1) $G.DRK = Math.min(1, $G.DRK + .2);
      if ($G.DRK != k0) rs();
    }
  }
}

// ---- girdi
