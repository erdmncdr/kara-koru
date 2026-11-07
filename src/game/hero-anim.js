// game/hero-anim.js · Kara Koru
// Bu dosya tek dosyalık sürümden (v22) otomatik ayrıldı. Ortak oyun durumu core/store.js içindeki $G nesnesinde.

import { $G } from '../core/store.js';
import { sfx } from '../audio/engine.js';
import { VFX, shad } from '../engine/vfx.js';
import { ANIM } from '../geo/anim.js';
import { groundAt } from '../world/terrain.js';

export let GPK;

export function __init_77() {
  GPK = [3.4, 0, 2.6, 3.4, 3.2, 2.8];
}

export function atkG() {
  if ($G.T - ($G.P.atT || -9) > .7) {
    $G.P.at = 0;
    $G.P.atT = $G.T;
    $G.P.side = ($G.P.side | 0) ^ 1;
  }
}

export function animH(dt) {
  const u = $G.H,
    pl = $G.S == 'play',
    vm = pl ? Math.hypot($G.P.vx, $G.P.vz) : 0,
    mv = vm > 1.2;
  if (mv && !$G.P.air) $G.ph += dt * (4.4 + vm * .6);
  let tr = 0;
  if (mv) {
    let d = Math.atan2($G.P.vx, $G.P.vz) - u.g.rotation.y;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    const k = d * Math.min(1, dt * 10);
    u.g.rotation.y += k;
    tr = dt > 0 ? k / dt : 0;
  }
  u.trn = (u.trn || 0) + (tr - (u.trn || 0)) * Math.min(1, dt * 6);
  if (!$G.P.air || !pl) $G.P.flip = 0;
  if ($G.P.flip > 0) $G.P.flip = Math.max(0, $G.P.flip - dt * 2.1);
  if (u.wa && !$G.P.air && pl) u.land = 1;
  u.wa = pl && $G.P.air;
  u.land = Math.max(0, (u.land || 0) - dt * 4.5);
  if ($G.P.at == null) $G.P.at = 1;
  if ($G.P.at < 1) $G.P.at = Math.min(1, $G.P.at + dt / .42);
  const st = u.st || (u.st = {});
  st.v = vm;
  st.ph = $G.ph;
  st.air = pl && $G.P.air ? 1 : 0;
  st.vy = $G.P.vy;
  st.sl = pl && $G.P.sl ? 1 : 0;
  st.dsh = pl && $G.P.dsh > 0 ? 1 : 0;
  st.t = $G.T;
  st.turn = u.trn;
  st.hit = pl && $G.P.hit > 0 ? $G.P.hit / .45 : 0;
  st.at = pl ? $G.P.at : 1;
  st.side = $G.P.side | 0;
  st.flip = $G.P.flip > 0 ? 1 - $G.P.flip : 0;
  st.land = u.land;
  ANIM.hero(u, st, dt);
  if (pl && !$G.P.air && !$G.P.sl && vm > 2.5) {
    const fs = Math.floor(($G.ph - 1.5708) / Math.PI);
    if (fs != u.fs) {
      u.fs = fs;
      const sd = fs & 1 ? 1 : -1,
        an = u.g.rotation.y,
        fx2 = $G.P.x + Math.cos(an) * .22 * sd,
        fz2 = $G.P.z - Math.sin(an) * .22 * sd;
      VFX.dust(fx2, $G.P.y - .95, fz2, vm > 14 ? 3 : 2, $G.BI ? 0xb08a6a : 0x7a6e58, 1.6);
      sfx('step', fs & 1);
    }
  }
  const fa = $G.P.flip > 0 ? (1 - $G.P.flip) * Math.PI * 2 : 0,
    yw = u.g.rotation.y,
    cy = 1.15,
    oz = -Math.sin(fa) * cy,
    oy = cy * (1 - Math.cos(fa));
  u.g.rotation.x = fa;
  u.g.rotation.z += (Math.max(-.1, Math.min(.1, -u.trn * .022 * Math.min(1, vm / 12))) - u.g.rotation.z) * Math.min(1, dt * 6);
  u.g.position.set($G.P.x + Math.sin(yw) * oz, $G.P.y - 1 + oy, $G.P.z + Math.cos(yw) * oz);
  u.g.visible = !($G.P.hit > 0 && Math.floor($G.T * 12) % 2);
  const sg = groundAt($G.P.x, $G.P.z, $G.P.y - 1);
  shad.position.set($G.P.x, sg + .1, $G.P.z);
  shad.scale.setScalar(Math.max(.4, 1.1 - ($G.P.y - 1 - sg) * .08));
}
