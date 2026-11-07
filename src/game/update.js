// game/update.js · Kara Koru
// Bu dosya tek dosyalık sürümden (v22) otomatik ayrıldı. Ortak oyun durumu core/store.js içindeki $G nesnesinde.

import { $G } from '../core/store.js';
import { sfx, sfxAt } from '../audio/engine.js';
import { kill, rmE, toast, tip } from '../core/helpers.js';
import { cl, rn } from '../core/util.js';
import { PUD, SHC, STL, TOUCH, TY, inc } from '../data/content.js';
const runC = k => $G.P && $G.P.c ? $G.P.c[k] || 0 : 0;
import { cam, mk, sc } from '../engine/renderer.js';
import { VFX, dmgNum, eShot, ebFx, puff, ringFx, unflash } from '../engine/vfx.js';
import { ASP } from './creatures.js';
import { stActs, stMove, stTick } from './status.js';
import { fireHook, hpCap, potMul, shrineRate, spdMul } from './items.js';
import { gSync } from './loot.js';
import { bossSlam, hurtP, pickType, spawn } from './enemies.js';
import { MBT, arenaTick, otTick, SWT, stLen } from './run.js';
import { CR } from './heroes.js';
import { MINIS } from '../data/enemies.js';
import { bossTick, bzUpd } from './bosses.js';
import { gyTick } from './graveyard.js';
import { addItem } from './items.js';
import { hurtE, killE } from './enemies.js';
import { chalFlag } from './challenge.js';
import { qCheck } from './flow.js';
import { GPK } from './hero-anim.js';
import { interact, useShrine } from './interact.js';
import { drop, instHide, mkChest, mkPU, spot } from './objects.js';
import { DMK, KZ_ADIM, bonus, calc, diffMul, diffPct, ghostSp, kzK, need, swT } from './stats.js';
import { slUpd, vxUpd } from './weapon-fx.js';
import { weapons } from './weapons.js';
import { ANIM } from '../geo/anim.js';
import { choose, luOpts } from '../ui/cards.js';
import { cell, groundAt, groundTop, los, pushOut, pushPlat, solidAt } from '../world/terrain.js';
import { torUpd } from '../world/tornado.js';

// Düşmanları birbirinden iter. 6 birimlik hücre ızgarası: her çift yalnızca bir kez,
// yalnızca komşu hücrelerde incelenir (400 düşmanda ~2k kontrol, n² yerine).
const SEP = new Map();
function separate(E) {
  SEP.clear();
  const CS = 6;
  for (let i = 0; i < E.length; i++) {
    const a = E[i];
    if (a.dead) continue;
    const p = a.m.position,
      k = (Math.floor(p.x / CS) + 4096) * 8192 + Math.floor(p.z / CS) + 4096;
    let c = SEP.get(k);
    if (!c) SEP.set(k, c = []);
    c.push(a);
  }
  const pair = (a, b) => {
    const p = a.m.position,
      q = b.m.position,
      dx = q.x - p.x,
      dz = q.z - p.z;
    if (Math.abs(dx) > 6 || Math.abs(dz) > 6) return;
    const d = Math.hypot(dx, dz),
      m2 = (a.r + b.r) * .8;
    if (d < m2 && d > 0 && Math.abs(a.fy - b.fy) < 2) {
      const k = (m2 - d) * .5 / d;
      p.x -= dx * k;
      p.z -= dz * k;
      q.x += dx * k;
      q.z += dz * k;
    }
  };
  // komşu hücreler: yarım düzlem (her çift tek yönden)
  const NB = [[1, -1], [1, 0], [1, 1], [0, 1]];
  for (const [k, c] of SEP) {
    for (let i = 0; i < c.length; i++) for (let j = i + 1; j < c.length; j++) pair(c[i], c[j]);
    const cx = Math.floor(k / 8192),
      cz = k % 8192;
    for (const [ox, oz] of NB) {
      const n = SEP.get((cx + ox) * 8192 + cz + oz);
      if (!n) continue;
      for (const a of c) for (const b of n) pair(a, b);
    }
  }
}

// Sis perdesi: 40×40 hücre, oyuncunun 42 m çevresi gezilmiş sayılır
export function fogMark() {
  const P = $G.P, N = 40, cs = 600 / N;
  if (!P.fog) P.fog = new Uint8Array(N * N);
  const ci = Math.floor((P.x + 300) / cs), cj = Math.floor((P.z + 300) / cs), R = 3;
  for (let j = cj - R; j <= cj + R; j++) for (let i = ci - R; i <= ci + R; i++) if (i >= 0 && j >= 0 && i < N && j < N && (i - ci) ** 2 + (j - cj) ** 2 <= R * R + 1) P.fog[j * N + i] = 1;
}

// yumruk atmayan devler: sabit direk, yuvarlanan Kemik Yumağı (temasla vurmaya devam eder)
function gSlamOff(e) {
  const f = e.kd && e.kd.fx;
  return !!(f && (f.static || f.pylon || f.roll));
}

// ---- güncelleme
export function upd(dt) {
  $G.FRC++;
  const C = $G.P.C;
  $G.P.stT += dt;
  $G.P.tt += dt;
  if ($G.P.frzP > 0) $G.P.frzP -= dt;
  const afk = chalFlag('afk') && !$G.P.swarm || $G.P.frzP > 0,
    ix = afk ? 0 : ($G.K.d || $G.K.ArrowRight ? 1 : 0) - ($G.K.a || $G.K.ArrowLeft ? 1 : 0) + $G.J.x,
    iz = afk ? 0 : ($G.K.w || $G.K.ArrowUp ? 1 : 0) - ($G.K.s || $G.K.ArrowDown ? 1 : 0) - $G.J.y,
    l = Math.hypot(ix, iz),
    nx = l > 1 ? ix / l : ix,
    nz = l > 1 ? iz / l : iz;
  const fx = -Math.sin($G.yaw),
    fz = -Math.cos($G.yaw),
    rx = Math.cos($G.yaw),
    rz = -Math.sin($G.yaw),
    mx = rx * nx + fx * nz,
    mz = rz * nx + fz * nz;
  $G.P.cd -= dt;
  $G.P.inv -= dt;
  $G.P.dsh -= dt;
  $G.P.hit -= dt;
  $G.P.rage -= dt;
  $G.P.shieldT -= dt;
  $G.P.blockT -= dt;
  if (l > .1) {
    $G.pmx = mx;
    $G.pmz = mz;
  }
  // atılma (Shift, sağ tık, kumanda RB/RT): 0.22 sn hızlı hamle, 1.6 sn bekleme, kısa dokunulmazlık
  if ($G.K.Shift && !afk && $G.P.cd <= 0) {
    const dx = l > .1 ? mx : $G.pmx || fx,
      dz = l > .1 ? mz : $G.pmz || fz,
      n = Math.hypot(dx, dz) || 1;
    $G.P.vx = dx / n * 34;
    $G.P.vz = dz / n * 34;
    $G.P.dsh = .22;
    $G.P.cd = 1.6 / (C.dashcd || 1);
    $G.P.inv = Math.max($G.P.inv, .3);
    inc('dash');
    sfx('dash');
  }
  const gf0 = groundAt($G.P.x, $G.P.z, $G.P.y - 1),
    onG = $G.P.y - 1 <= gf0 + .2,
    spd = 11 * Math.min(4, Math.max(1, 1 + (C.spd - 1) * .375)) * spdMul() * ($G.P.slowT > 0 ? .5 : 1) * ($G.P.puSpd > 0 ? 1.8 : 1) * (1 + (CR[$G.CI].k == 'golge' ? .08 : .04) * $G.P.hop) * ($G.P.y - 1 < $G.WLV - .3 ? .72 : 1);
  $G.P.sl = ($G.K.Control || $G.K.c) && onG && $G.P.dsh <= 0 ? 1 : 0; // kayma: Ctrl (Megabonk varsayılanı), C de çalışır; kumandada B/LB/LT. Shift ve sağ tık atılma
  $G.P.frz = ($G.P.frz || 0) - dt;
  $G.P.slc = ($G.P.slc || 0) - dt;
  if ($G.P.sl && !$G.P.sl0 && $G.P.slc <= 0) {
    const cu = Math.hypot($G.P.vx, $G.P.vz),
      ddx = l > .1 ? mx : cu > 1 ? $G.P.vx / cu : fx,
      ddz = l > .1 ? mz : cu > 1 ? $G.P.vz / cu : fz,
      tv = Math.max(cu, spd * 1.35);
    $G.P.vx = ddx * tv;
    $G.P.vz = ddz * tv;
    $G.P.slc = 1.1;
    VFX.dust($G.P.x, gf0 + .1, $G.P.z, 8, $G.BI ? 0xb08a6a : 0x8a7a62, 4);
    sfx('dash');
  }
  $G.P.sl0 = $G.P.sl;
  if ($G.P.sl) {
    const e = .8,
      gx = ($G.HT($G.P.x + e, $G.P.z) - $G.HT($G.P.x - e, $G.P.z)) / (2 * e),
      gz = ($G.HT($G.P.x, $G.P.z + e) - $G.HT($G.P.x, $G.P.z - e)) / (2 * e),
      fr = Math.exp(-.5 * dt);
    $G.P.vx = ($G.P.vx - gx * 60 * dt) * fr;
    $G.P.vz = ($G.P.vz - gz * 60 * dt) * fr;
    if (Math.hypot($G.P.vx, $G.P.vz) < spd * .9) {
      $G.P.vx += mx * dt * 8;
      $G.P.vz += mz * dt * 8;
    }
  } else if ($G.P.dsh <= 0) {
    const cu = Math.hypot($G.P.vx, $G.P.vz),
      inp = l > .1,
      al = cu > .1 ? ($G.P.vx * mx + $G.P.vz * mz) / cu : 1;
    if (onG) {
      const ex = cu > spd * 1.02;
      if (ex && inp && al > -.3) {
        const top = $G.P.landT < .14 ? cu : Math.max(spd, cu * Math.exp(-3.2 * dt)),
          a = 1 - Math.exp(-9 * dt);
        let nx2 = $G.P.vx / cu + (mx - $G.P.vx / cu) * a,
          nz2 = $G.P.vz / cu + (mz - $G.P.vz / cu) * a;
        const nl = Math.hypot(nx2, nz2) || 1;
        $G.P.vx = nx2 / nl * top;
        $G.P.vz = nz2 / nl * top;
      } else {
        const a = 1 - Math.exp(-14 * dt);
        $G.P.vx += (mx * spd - $G.P.vx) * a;
        $G.P.vz += (mz * spd - $G.P.vz) * a;
      }
    } else if (cu > spd) {
      if (inp && al > -.5) {
        const an = Math.atan2($G.P.vx, $G.P.vz);
        let dA = Math.atan2(mx, mz) - an;
        dA = Math.atan2(Math.sin(dA), Math.cos(dA));
        const mT = 2.8 * dt;
        dA = Math.max(-mT, Math.min(mT, dA));
        const c2 = cu * Math.exp(-.1 * dt);
        $G.P.vx = Math.sin(an + dA) * c2;
        $G.P.vz = Math.cos(an + dA) * c2;
      } else {
        const a = 1 - Math.exp(-(inp ? 2.5 : .25) * dt);
        $G.P.vx += ((inp ? mx * spd : $G.P.vx * (spd / cu)) - $G.P.vx) * a;
        $G.P.vz += ((inp ? mz * spd : $G.P.vz * (spd / cu)) - $G.P.vz) * a;
      }
    } else {
      const a = 1 - Math.exp(-6 * dt);
      $G.P.vx += (mx * spd - $G.P.vx) * a;
      $G.P.vz += (mz * spd - $G.P.vz) * a;
    }
  }
  let vm = Math.hypot($G.P.vx, $G.P.vz);
  if (vm > 56) {
    $G.P.vx *= 56 / vm;
    $G.P.vz *= 56 / vm;
    vm = 56;
  }
  const ox = $G.P.x,
    oz = $G.P.z;
  $G.P.x = cl($G.P.x + $G.P.vx * dt);
  $G.P.z = cl($G.P.z + $G.P.vz * dt);
  pushOut($G.P, .8);
  pushPlat($G.P, .8, $G.P.y - 1);
  // duvar koşusu (Megabonk): yüksek bir duvara doğru koşarken 1 sn'e kadar dikey tırmanış; boşluk tuşu duvardan sıçratır
  {
    const ix = $G.P.vx * dt, iz = $G.P.vz * dt, il2 = ix * ix + iz * iz,
      ax = $G.P.x - ox, az = $G.P.z - oz,
      blocked = il2 > 16 * dt * dt && (ax * ix + az * iz) / il2 < .35 && l > .1;
    if ($G.P.wrT == null) $G.P.wrT = 1;
    let wr = 0;
    if (blocked && !afk && !$G.P.sl && $G.P.wrT > 0) {
      const il = Math.sqrt(il2), nx = ix / il, nz = iz / il;
      const sa = solidAt($G.P.x + nx * 1.3, $G.P.y + 1.2, $G.P.z + nz * 1.3),
        sx = $G.P.x + nx * 1.3,
        sz = $G.P.z + nz * 1.3,
        big = sa && (sa != 3 || (cell($G.OG, sx, sz) || []).some(o => o.r >= 1.1 && !o.nm && Math.hypot(o.x - sx, o.z - sz) < o.r + .5)); // ağaç gövdesi gibi ince engellerde tırmanma yok
      if (big) {
        wr = 1;
        $G.P.wrT -= dt;
        $G.P.wnx = -nx; $G.P.wnz = -nz;
        $G.P.vy = Math.max($G.P.vy, 10 * C.jmp);
        $G.P.air0 = 1;
        $G.P.jc = 0;
        if (!$G.P.wr) { sfx('jump', 1); inc('wallrun'); }
        if (Math.random() < dt * 12) VFX.dust($G.P.x + nx * .6, $G.P.y - .6, $G.P.z + nz * .6, 2, 0x9a9a9a, 2);
      }
    }
    $G.P.wr = wr;
  }
  if ($G.P.sl || $G.P.dsh > 0) {
    const ax = ($G.P.x - ox) / dt,
      az = ($G.P.z - oz) / dt;
    if (Math.hypot(ax, az) < vm * .5) {
      $G.P.vx = ax;
      $G.P.vz = az;
    }
  }
  const gf = groundAt($G.P.x, $G.P.z, $G.P.y - 1),
    g = gf + 1;
  $G.P.vy -= 32 * dt;
  $G.P.y += $G.P.vy * dt;
  if ($G.P.y < g - .4) $G.P.y = g - .4;
  if ($G.P.vy <= 0 && $G.P.y <= g + .4) {
    if ($G.P.air0) {
      const lk = Math.min(1.5, -$G.P.vy / 20);
      sfx('land', lk);
      VFX.dust($G.P.x, gf + .1, $G.P.z, Math.round(4 + lk * 8), $G.BI ? 0xb08a6a : 0x8a7a62, 3 + lk * 4);
      if ($G.P.vy < -14) $G.shk = Math.max($G.shk, .12);
      // düşme hasarı (Megabonk): 24 birim/sn üstü iniş, 'Düşme hasarı azaltma' statı ve Yaban bağışık; su yumuşatır
      const hug = $G.P.vy < -24 && $G.OBS.some(o => Math.hypot(o.x - $G.P.x, o.z - $G.P.z) < (o.r || 1) + 1.2 && (o.t == null || o.t > $G.P.y));
      if (hug) inc('wallhug'); // Megabonk Wallhugger: duvara yaslanınca düşme hasarı yok
      if ($G.P.vy < -24 && !hug && CR[$G.CI].k != 'yaban' && !(gf < $G.WLV) && !chalFlag('afk')) {
        const fd = Math.round(Math.min($G.P.mh * .5, (-$G.P.vy - 24) * $G.P.mh * .04) * Math.max(0, 1 - (C.fall || 0)));
        if (fd > 0) {
          $G.P.inv = Math.min($G.P.inv, 0);
          $G.P.fallHit = 1;
          hurtP(fd, null);
          $G.P.fallHit = 0;
          inc('fall');
        }
      }
      $G.P.landT = 0;
    }
    $G.P.y = g;
    $G.P.vy = 0;
    $G.P.jc = 0;
    $G.P.air0 = 0;
    $G.P.wrT = 1;
  }
  const gr = $G.P.y <= g + .05;
  $G.P.air = !gr && $G.P.y > g + .7;
  {
    const inW = $G.P.y - 1 < $G.WLV - .12 && gf < $G.WLV;
    if (inW && !$G.P.inW) {
      VFX.emit(VFX.ADD, $G.P.x, $G.WLV + .1, $G.P.z, {
        n: 18,
        sp: [3, 7],
        up: 5,
        life: [.4, .7],
        s: [.15, .3],
        s1: .2,
        c: 0xcfeaff,
        g: 16,
        d: 1
      });
      ringFx($G.P.x, $G.WLV + .05, $G.P.z, 0xcfeaff, 2.5, 10);
      sfx('splash');
    }
    if (inW && vm > 3 && Math.random() < dt * 9) ringFx($G.P.x, $G.WLV + .04, $G.P.z, 0xbfe0f0, 1.2, 6);
    $G.P.inW = inW;
  }
  if ($G.P.y > g + 1) $G.P.air0 = 1;
  if (!$G.K[' ']) $G.P.jr = 1;
  if (gr) {
    $G.P.landT += dt;
    if ($G.P.landT > .35) $G.P.hop = 0;
  }
  if ($G.K[' '] && !afk && $G.P.jr && $G.P.wr) {
    // duvardan sıçrama: duvar normali yönünde itme, yeni duvar için sayaç kısmen dolar
    $G.P.jr = 0;
    $G.P.wr = 0;
    $G.P.wrT = Math.max($G.P.wrT, .5);
    $G.P.vx = $G.P.wnx * spd * .9;
    $G.P.vz = $G.P.wnz * spd * .9;
    $G.P.vy = 12 * C.jmp;
    $G.P.flip = 1;
    VFX.dust($G.P.x, $G.P.y - .6, $G.P.z, 5, 0x9a9a9a, 3);
    sfx('jump', 1);
  } else if ($G.K[' '] && !afk && (gr || $G.P.jr && $G.P.jc < C.air)) {
    // tavşan zıplaması herkese açık (Megabonk): iner inmez zıplayan hız biriktirir; Gölge iki kat
    if (gr) $G.P.hop = $G.P.landT < .2 && $G.P.jr ? Math.min(5, $G.P.hop + 1) : 0;
    $G.P.jr = 0;
    if (!gr) {
      $G.P.jc++;
      $G.P.flip = 1;
      VFX.emit(VFX.ADD, $G.P.x, $G.P.y - 1, $G.P.z, {
        n: 14,
        sp: [3, 6],
        flat: .05,
        life: [.25, .4],
        s: [.3, .5],
        s1: .1,
        c: 0xa8e3d6
      });
    } else {
      if ($G.P.landT < .14 && Math.hypot($G.P.vx, $G.P.vz) > spd * .9) {
        $G.P.vx *= 1.05;
        $G.P.vz *= 1.05;
      }
      VFX.dust($G.P.x, $G.P.y - .95, $G.P.z, 3, $G.BI ? 0xb08a6a : 0x8a7a62, 2);
    }
    $G.P.vy = 12 * C.jmp;
    sfx('jump', gr ? 0 : 1);
  }
  for (const p of $G.JP) if (Math.hypot($G.P.x - p.x, $G.P.z - p.z) < 1.7 && $G.P.y - 1 <= p.y + .7 && $G.P.y - 1 >= p.y - .6 && $G.P.vy <= 1) {
    $G.P.vy = 25;
    $G.P.jc = 0;
    $G.P.air0 = 1;
    sfx('pad');
    VFX.emit(VFX.ADD, p.x, p.y + .5, p.z, {
      n: 20,
      sp: [2, 6],
      up: 8,
      life: [.4, .7],
      s: [.3, .5],
      s1: .1,
      c: 0x9fe8d8,
      g: 6
    });
    ringFx(p.x, p.y + .4, p.z, 0x9fe8d8, 3, 10);
  }
  $G.P.ft -= dt;
  if (gr && $G.P.sl && vm > 5 && $G.P.ft <= 0) {
    $G.P.ft = .05;
    const bx2 = -$G.P.vx / vm,
      bz2 = -$G.P.vz / vm;
    VFX.emit(VFX.SPK, $G.P.x, gf + .15, $G.P.z, {
      n: 2,
      sp: [4, 9],
      dir: [bx2, .5, bz2],
      cone: .6,
      life: [.15, .3],
      s: [.3, .5],
      s1: .2,
      c: 0xffa040,
      br: 1.4,
      g: 12
    });
    VFX.dust($G.P.x, gf + .1, $G.P.z, 1, $G.BI ? 0xb08a6a : 0x8a7a62, 1.5);
  }
  if ($G.P.dsh > 0) VFX.emit(VFX.ADD, $G.P.x, $G.P.y - .3, $G.P.z, {
    n: 2,
    sp: [0, 1],
    life: [.2, .35],
    s: [.6, .9],
    s1: .1,
    c: 0xa8e3d6,
    rad: .5
  });
  if (!chalFlag('noregen')) $G.P.hp = Math.min(Math.max($G.P.hp, hpCap()), $G.P.hp + C.regen * dt * ($G.P.fount > 0 ? 3 : 1));
  inc('dist', vm * dt);
  // Hızlı Koşucu: aşama boss'u 5 dakikada devrilmezse koşu biter
  {
    const sr = chalFlag('speedrun');
    if (sr && !$G.P.final && $G.P.stT - ($G.P.stS || 0) > sr && !($G.GATE && $G.GATE.st >= 2)) {
      toast('Hızlı Koşucu: süre doldu.');
      $G.P.inv = 0;
      $G.P.shieldT = 0;
      $G.P.hp = 0;
      hurtP(1e9, null, 1);
    }
    const es = chalFlag('earlySwarm');
    if (es && !$G.P.swarm && !$G.P.final && $G.P.stT >= es) {
      $G.P.swarm = 1;
      $G.P.swT0 = $G.P.stT;
      toast('Erken Dalga: Albastılar şimdiden geliyor.');
      sfx('boss');
    }
  }
  // kalkan: 4 sn vurulmayınca 2 sn'de dolar
  $G.P.noDmgT += dt;
  if ($G.P.noDmgT > $G.P.noDmgMax) $G.P.noDmgMax = $G.P.noDmgT;
  if (C.shield > 0 && $G.P.noDmgT > 4 && $G.P.shd < C.shield) $G.P.shd = Math.min(C.shield, $G.P.shd + C.shield * dt / 2);
  if ($G.P.shd > C.shield) $G.P.shd = C.shield;
  if ($G.P.fount > 0) $G.P.fount -= dt;
  otTick(dt);
  arenaTick(dt);
  gyTick(dt);
  fogMark();
  bzUpd(dt);
  $G.P.chF += dt / 60;
  // oyuncu durumları: yavaşlama, zehir, yanma, güç süreleri
  if ($G.P.slowT > 0) $G.P.slowT -= dt;
  if ($G.P.puSpd > 0) $G.P.puSpd -= dt;
  if ($G.P.pgT > 0) $G.P.pgT -= dt;
  for (const [k, c] of [['poiT', 0x8fe06a], ['burnT', 0xff7a2a], ['bleedT', 0xc4302b], ['bpoiT', 0x5a9a3a]]) if ($G.P[k] > 0) {
    $G.P[k] -= dt;
    // zehir %1/sn, yanma %1.5/sn, kanama %2/sn, boss zehri %3/sn (azami canın); zırh işlemez
    $G.P.hp -= $G.P.mh * (k == 'poiT' ? .01 : k == 'burnT' ? .015 : k == 'bleedT' ? .02 : .03) * dt;
    if (Math.random() < dt * 6) VFX.mote($G.P.x, $G.P.y + .8, $G.P.z, c, 1.4);
    if ($G.P.hp <= 0) {
      $G.P.hp = 1;
      $G.P.inv = 0;
      hurtP(1e9, null, 1);
    }
  }
  // kilit sayaçları: koşuda Lanet Tomu 10, zorluk +%40
  if (!$G.P.c10 && $G.P.T.some(t => t.k == 'curse' && t.lv >= 10)) { $G.P.c10 = 1; inc('curse10'); }
  if (!$G.P.d40 && ($G.FRC & 31) == 0 && diffPct() >= 40) { $G.P.d40 = 1; inc('diff40'); }
  if (!$G.P.d100 && ($G.FRC & 31) == 0 && diffPct() >= 100) { $G.P.d100 = 1; inc('diff100'); }
  if ($G.P.swarm) for (const s of [60, 120, 360]) if (swT() >= s && !$G.P['sw' + s]) { $G.P['sw' + s] = 1; inc('sw' + s); }
  // Mahzen temizliği: mühür içindeki her pot kırıldı ve her sandık açıldı (Megabonk Pot görevi)
  if ($G.P.mzK && !$G.P.mzc && ($G.FRC & 15) == 0 && $G.P.mzK.pots.every(p => p.o) && ($G.P.mzOpened || 0) >= $G.P.mzK.ch) { $G.P.mzc = 1; inc('mzclean'); toast('Mahzen tertemiz: her pot ve sandık açıldı'); }
  // Kızışma uyarısı: 3 dakikada bir düşmanların sertleştiği bildirilir. Akın ya da ara boss bildirimiyle aynı ana
  // denk gelirse ekrandaki yazı silinene kadar bekler (toast tek satır, üst üste yazınca öncekini siler).
  if (!$G.P.swarm && !$G.P.final && !$G.ARENA) {
    if ($G.P.stT >= 25 && $G.P.stT - dt < 25) tip('kizisma', 'Kızışma', 'Aşama uzadıkça düşmanlar sertleşir: her 3 dakikada daha çok gelir ve daha sert vururlar. Boss Kapısı’nı bulup boss’u erken devirmek işini kolaylaştırır.');
    const n = Math.floor($G.P.stT / KZ_ADIM);
    if (n > ($G.P.kzN || 0) && $G.P.stT < stLen()) {
      $G.P.kzN = n;
      $G.P.kzQ = `${n * 3}. dakika: düşmanlar sertleşti. Vuruşları artık +%${Math.round((kzK() - 1) * 100)}.`;
      $G.P.kzD = 1;
    }
  }
  if ($G.P.kzQ && ($G.P.kzD -= dt) <= 0 && !document.getElementById('tt').textContent) {
    toast($G.P.kzQ);
    $G.P.kzQ = '';
    sfx('growl');
  }
  for (const at of SWT()) if (!$G.P.swarm && $G.P.stT >= at && $G.P.stT - dt < at) {
    $G.P.akin = 22;
    $G.P.akN = ($G.P.akN || 0) + 1;
    toast('Akın! Sürü her yönden geliyor.');
    tip('akin', 'Akın', 'Her aşamada iki kez sürü her yönden gelir. Alan silahları ve Tengri Ateşi gücü bu anlar için.');
    sfx('boss');
    for (let i = 0; i < 26; i++) {
      const a = i / 26 * 6.283;
      spawn(i % 5 == 4 ? 1 : i % 7 == 6 ? 4 : 0, {
        x: $G.P.x + Math.cos(a) * 34,
        z: $G.P.z + Math.sin(a) * 34
      });
    }
  }
  if ($G.P.akin > 0) $G.P.akin -= dt;
  $G.spT -= ($G.P.frz > 0 ? 0 : dt) * ($G.P.chg ? 2.5 : 1) * (1 + $G.P.greed) * ($G.P.akin > 0 ? 3 : 1);
  if ($G.spT <= 0 && $G.E.length < ($G.P.swarm ? 210 : $G.P.akin > 0 ? 220 : 175)) {
    $G.spT = ($G.P.swarm ? .1 : Math.max(.2, 1.25 - $G.P.stT * .0028 - Math.min(3, $G.P.stage) * .3)) / (1 + (diffMul() - 1) * .3);
    for (let i = 0; i < 1 + Math.floor($G.P.stT / 100) + Math.min(4, $G.P.stage) + ($G.P.swarm ? 2 + Math.min(4, Math.floor(swT() / 90)) : 0); i++) spawn(pickType());
  }
  if ($G.P.swarm && swT() > 60 && $G.P.frz <= 0) {
    const w = swT(),
      tier = w > 720 ? 3 : w > 360 ? 2 : 1;
    $G.P.ghT = ($G.P.ghT || 0) - dt;
    if ($G.P.ghT <= 0) {
      $G.P.ghT = Math.max(.35, 3.2 - w / 260);
      if (($G.P.ghW || 0) < tier) {
        $G.P.ghW = tier;
        toast(['', 'Albastılar geldi. Son dalga artık affetmez.', 'Mor Albastılar çıktı. Daha hızlı, daha sert.', 'Kızıl Albastılar uyandı. Kaç düşman devirebilirsin?'][tier]);
        sfx('boss');
      }
      // Albastı sayısı da büyür: 4 dakikada bir sürüye bir tane daha (en çok 5)
      for (let i = 0, n = 1 + Math.min(4, Math.floor(w / 240)); i < n; i++) spawn(1, {
        ghost: tier
      });
    }
  }
  if (!$G.P.swarm) {
    $G.P.thT = ($G.P.thT == null ? rn(50, 90) : $G.P.thT) - dt;
    if ($G.P.thT <= 0) {
      $G.P.thT = rn(70, 115);
      $G.P.thN = ($G.P.thN || 0) + 1;
      const sv = $G.P.thN % 2 == 0;
      spawn(sv ? 4 : 1, {
        thief: 1,
        silv: sv,
        x: $G.P.x + rn(-30, 30),
        z: $G.P.z + rn(-30, 30)
      });
      toast(sv ? 'Gümüş iskelet göründü. Yakalarsan anında seviye atlarsın.' : 'Altın yarasa göründü. Kaçmadan yakala.');
    }
  }
  // ara boss: anlar run.js MBT içinde; listedeki türler sırayla döner (Mezarlık: Kemik'in Babası, Hayalet Beyi, Kemik'in Babası)
  for (const at of MBT()) if (!$G.P.swarm && $G.P.stT >= at && $G.P.stT - dt < at) {
    $G.P.mbN = ($G.P.mbN || 0) + 1;
    const ml = MINIS[$G.P.map] || MINIS.koru;
    spawn(ml[($G.P.mbN - 1) % ml.length], {
      el: 1,
      mini: 1
    });
  }
  $G.P.chT -= dt;
  if ($G.P.chT <= 0) {
    $G.P.chT = 35;
    if ($G.CH.length < 10) {
      const [x, z] = spot($G.P.x, $G.P.z, 30, 70, 8);
      mkChest({
        x,
        z
      });
    }
  }
  for (const c of $G.CH) {
    c.m.rotation.y += dt * .6;
    if (c.w && Math.hypot(c.m.position.x - $G.P.x, c.m.position.z - $G.P.z) > 7) c.w = 0;
  }
  for (const n of $G.NP) if (n.lock && Math.hypot(n.m.position.x - $G.P.x, n.m.position.z - $G.P.z) > 6) n.lock = 0;
  if ($G.GATE) {
    $G.GATE.sw.rotation.z += dt * 1.5;
    if ($G.GATE.st == 2) $G.GATE.por.material.opacity = .6 + Math.sin($G.T * 3) * .15;
  }
  const wc = $G.P.chg;
  $G.P.chg = 0;
  for (const s of $G.SH) {
    const q = s.m.position,
      d = Math.hypot(q.x - $G.P.x, q.z - $G.P.z);
    s.o.rotation.y += dt * 2;
    if (s.d) continue;
    if ((s.t == 0 || s.t == 5) && s.p > 0 && d >= 6) s.lft = 1; // alandan çıkıldı (Kaos Tomu koşulu)
    if ((s.t == 0 || s.t == 5) && d < 6 && Math.abs(q.y - $G.P.y) < 4) {
      if (!s.p) tip('ocak', 'Ocak', 'Halkanın içinde dur, dolunca üç stat seçeneği çıkar; zorluk da seçeneklerden biri olabilir. Alandan çıkarsan Kaos Tomu görevi için sayılmaz. Altın ocak yalnız efsanevi verir.');
      $G.P.chg = 1;
      const st0 = Math.floor(s.p * 2);
      s.p += dt * shrineRate();
      if (Math.floor(s.p * 2) > st0 || !st0 && !s.cs) { s.cs = 1; sfx('chg', Math.floor(s.p * 2)); } // dolum sesi: yarım birimde bir yükselen nota
      if (Math.random() < .6) VFX.mote(q.x, q.y + .4, q.z, SHC[s.t] || 0xa8e3d6, 2.4);
      if (s.p >= 6) {
        useShrine(s);
        break;
      }
    }
  }
  if (TOUCH && $G.S == 'play') interact(1);
  if ($G.S != 'play') return;
  for (const b of $G.BRK) {
    if (b.o) continue;
    const q = b.m.position;
    if (Math.hypot(q.x - $G.P.x, q.z - $G.P.z) < 2.3 && Math.abs(q.y - $G.P.y) < 3.5) {
      b.o = 1;
      instHide(b.im, b.i);
      if (b.ty == 'kb' || b.ty == 'kbb' || b.ty == 'tw') inc('pots');
      if ((b.ty == 'kb' || b.ty == 'kbb') && CR[$G.CI].k == 'anka' && $G.BRK.every(x => (x.ty != 'kb' && x.ty != 'kbb') || x.o)) inc('allpumpkin');
      if (b.ty == 'tw') {
        for (let i = 0; i < 4; i++) drop(q.x + rn(-2, 2), q.z + rn(-2, 2), 'xp', 3 + $G.P.stage * 2, q.y - .8);
        const w = $G.P.stage == 0 ? 'katana' : $G.P.stage == 1 && $G.P.tier >= 2 ? 'shotgun' : null;
        if (w && !$G.META.l[w] && Math.random() < .05) {
          inc('drop_' + w);
          toast('Çalı yumağından bir silah çıktı: ' + (w == 'katana' ? 'Yatağan' : 'Çakaralmaz'));
        }
      }
      fireHook('pot', { q, ty: b.ty });
      const fy = q.y - .8;
      $G.DSRC = {
        x: q.x,
        y: q.y + .6,
        z: q.z
      };
      if (b.ty == 'cr') {
        puff(q.x, q.y, q.z, 0x9fe8d8, 16);
        sfxAt('ice', q.x, q.z);
        for (let i = 0; i < 6; i++) drop(q.x + rn(-2, 2), q.z + rn(-2, 2), 'xp', 3 + $G.P.stage * 2, fy);
      } else {
        puff(q.x, q.y, q.z, b.ty == 'kb' || b.ty == 'kbb' ? 0xff8a2a : 0xc9a24a, 16);
        sfxAt('pot', q.x, q.z);
        sfxAt('loot', q.x, q.z);
        for (let i = 0; i < (b.ty == 'kbb' ? 21 : 7); i++) drop(q.x + rn(-2, 2), q.z + rn(-2, 2), 'au', 2 + $G.P.stage * 2, fy);
        if (Math.random() < .15) drop(q.x, q.z, 'sv', 1, fy);
      }
      $G.DSRC = null;
    }
  }
  for (const p of $G.POT) {
    const q = p.m.position;
    if (Math.hypot(q.x - $G.P.x, q.z - $G.P.z) < 1.9 && Math.abs(q.y - $G.P.y) < 3) {
      p.o = 1;
      instHide($G.PINST, p.i);
      inc('pots');
      fireHook('pot', { q });
      puff(q.x, q.y, q.z, 0x8a5a32, 10);
      sfxAt('pot', q.x, q.z);
      $G.DSRC = {
        x: q.x,
        y: q.y,
        z: q.z
      };
      const r = p.sv ? 2 : Math.random(),
        fy = q.y - .7,
        bm = p.big ? 3 : 1;
      if (p.sv) {
        // gümüş pot: küçük 1, büyük 2 gümüş (Megabonk)
        for (let i = 0; i < (p.big ? 2 : 1); i++) drop(q.x + rn(-1, 1), q.z + rn(-1, 1), 'sv', 1, fy);
      } else if (r < .72) {
        const n = (2 + (Math.random() * 3 | 0)) * bm;
        for (let i = 0; i < n; i++) drop(q.x + rn(-1.5, 1.5), q.z + rn(-1.5, 1.5), 'au', Math.round((1 + ($G.P.stT > 240 ? 1 : 0) + $G.P.stage) * potMul()), fy);
      } else if (r < .88) {
        for (let i = 0; i < 3 * bm; i++) drop(q.x + rn(-1.5, 1.5), q.z + rn(-1.5, 1.5), 'xp', Math.round((2 + $G.P.stage) * potMul()), fy);
      } else if (Math.random() < C.puc) {
        const ks = Object.keys(PUD).filter(k => !PUD[k].item);
        mkPU(q.x, q.z, ks[Math.random() * ks.length | 0], fy);
      }
      if (Math.random() < .04) drop(q.x, q.z, 'sv', 1, fy);
      $G.DSRC = null;
    }
  }
  $G.POT = $G.POT.filter(p => !p.o);
  for (const u of $G.PU) {
    const q = u.m.position;
    u.m.rotation.y += dt * 2;
    q.y = u.by + 1.2 + Math.sin($G.T * 3) * .2;
    if (Math.hypot(q.x - $G.P.x, q.z - $G.P.z) < 2 && Math.abs(q.y - $G.P.y) < 3) {
      u.o = 1;
      sc.remove(u.m);
      const t = u.t;
      $G.P.puN = ($G.P.puN || 0) + 1;
      inc('pu');
      inc('pu_' + t);
      sfx('shrine');
      if (t == 'mag') {
        for (const o of $G.G) o.pull = 1;
        toast('Mıknatıs: bütün kristaller ve altınlar sana geliyor');
      }
      const pb = C.pub || 1;
      if (t == 'bolt') {
        $G.P.rage = 15 * pb;
        toast('Mor Yıldırım: 15 saniye hasar 1.5 kat, saldırı hızı 2 kat');
      }
      if (t == 'heal') {
        $G.P.hp = Math.min($G.P.mh, $G.P.hp + $G.P.mh * .08 + 10);
        toast('Lahmacun: canın doldu');
      }
      if (t == 'shield') {
        $G.P.shieldT = 15 * pb;
        toast('Kalkan: 15 saniye boyunca hasar almazsın');
      }
      if (t == 'gold') {
        $G.P.pgT = 15 * pb;
        toast('Altın: 15 saniye her öldürme +1 altın');
      }
      if (t == 'nuke') {
        let n = 0;
        for (const e of $G.E) {
          const p = e.m.position;
          if (e.dead || Math.hypot(p.x - q.x, p.z - q.z) > 15) continue;
          if (e.boss || e.kd && e.kd.fx && e.kd.fx.kefen) hurtE(e, e.mh * .1, 0, { src: 'nuke' });else {
            e.hp = 0;
            killE(e);
            n++;
          }
        }
        $G.shk = Math.max($G.shk, .9);
        ringFx(q.x, q.y - 1, q.z, 0xffe08a, 15, 40);
        toast(`Tengri Ateşi: ${n} düşman kül oldu`);
      }
      if (t == 'clock') {
        $G.P.frz = 12 * pb;
        sfx('freeze');
        toast('Saat: düşmanlar 12 saniye donup kalır');
      } else sfx('power');
      VFX.pick(q.x, q.y, q.z, PUD[t].c);
      ringFx(q.x, q.y - 1, q.z, PUD[t].c, 4, 12);
    }
  }
  $G.PU = $G.PU.filter(u => !u.o);
  fireHook('tick', { dt });
  weapons(dt, vm);
  torUpd(dt);
  slUpd(dt);
  vxUpd(dt);
  separate($G.E);
  const frz = $G.P.frz > 0;
  $G.frzN = 0;
  for (const e of $G.E) {
    if (e.dead) continue;
    if (e.frzT > 0) $G.frzN++;
    e.f -= dt;
    e.oh -= dt;
    e.jt -= dt;
    e.slow -= dt;
    if (e.fl && e.f <= 0) unflash(e);
    if (frz) {
      e.hr -= dt;
      continue;
    }
    stTick(e, dt);
    if (e.dead) continue;
    const y = e.yd || TY[e.t],
      q = e.m.position,
      dx = $G.P.x - q.x,
      dz = $G.P.z - q.z,
      d = Math.hypot(dx, dz) || 1,
      sm = stMove(e),
      act = stActs(e),
      ph2 = $G.T * ASP[e.t] + e.s;
    let s = y.sp * (C.enSp || 1) * (1 + (diffMul() - 1) * .15) * Math.min(1.9, 1 + $G.P.stT / 900 + $G.P.stage * .12) * sm * (e.ghost ? ghostSp() * [1, 1, 1.12, 1.25][e.ghost | 0] : e.thief ? .85 : 1),
      mvx = dx / d,
      mvz = dz / d,
      face = Math.atan2(dx, dz);
    if (e.thief) {
      mvx = -mvx;
      mvz = -mvz;
      face = Math.atan2(mvx, mvz);
      e.life -= dt;
      if (e.life <= 0) {
        e.dead = 1;
        e.gone = 1;
        puff(q.x, q.y + 1, q.z, 0xe2b04a, 18);
        rmE(e.m, e.u);
        toast(e.silv ? 'Gümüş iskelet kaçtı' : 'Altın yarasa kaçtı');
        continue;
      }
    }
    if (d > 115 && e.t != 3) {
      const a = rn(0, 6.28);
      q.x = cl($G.P.x + Math.cos(a) * 62);
      q.z = cl($G.P.z + Math.sin(a) * 62);
      e.fy = groundTop(q.x, q.z);
      continue;
    }
    if (e.t == 4) {
      if (d < 14) s *= -.8;
      else if (d < 22) {
        // menzil bandında yana kayar (yön 1.6-3.2 sn'de bir değişir): yerinde dikilen bir nişan tahtası olmasın; yüzü oyuncuda kalır
        e.sdT = (e.sdT || 0) - dt;
        if (e.sdT <= 0) {
          e.sdT = rn(1.6, 3.2);
          e.sd = Math.random() < .5 ? -1 : 1;
        }
        mvx = -dz / d * e.sd;
        mvz = dx / d * e.sd;
        s *= .4;
      }
    }
    if (e.kd && e.kd.fx) {
      const f = e.kd.fx;
      if (f.static || f.pylon) s = 0;
      if (e.fleeT > 0) {
        e.fleeT -= dt;
        mvx = -mvx;
        mvz = -mvz;
        face = Math.atan2(mvx, mvz);
        s *= 1.3;
      }
      if (f.frog && d > 26) s = 0; // kurbağa yaklaşılmadan yerinden kımıldamaz
      if (f.boom) {
        if (e.fuse == null && d < e.r + 1.4) {
          e.fuse = .55;
          e.m.scale.setScalar(e.ba * 1.15);
        }
        if (e.fuse != null) {
          e.fuse -= dt;
          s = 0;
          if (e.fuse <= 0) {
            // patlama: 3.5 m içinde hasar, oyuncuyu havaya fırlatır
            const R = 3.5;
            if (Math.hypot(q.x - $G.P.x, q.z - $G.P.z) < R + 1 && Math.abs(q.y - $G.P.y) < 4) {
              hurtP(e.dmg * 1.5, e);
              $G.P.vy = Math.max($G.P.vy, 14);
              $G.P.air0 = 1;
            }
            for (const o of $G.E) if (o !== e && !o.dead && Math.hypot(o.m.position.x - q.x, o.m.position.z - q.z) < R) hurtE(o, e.dmg, 1, { src: 'boom', dot: 1 });
            puff(q.x, q.y + 1, q.z, 0xff6a2a, 22);
            ringFx(q.x, q.y + .2, q.z, 0xff8a3a, R, 10);
            sfxAt('boom', q.x, q.z);
            $G.shk = Math.max($G.shk, .3);
            e.hp = 0;
            e.nodrop = 1;
            killE(e);
            continue;
          }
        }
      }
      if (f.roll) {
        e.rt = (e.rt || 0) - dt;
        if (e.rt <= 0 || !e.rd) {
          e.rt = rn(2, 4);
          const an = Math.atan2(dx, dz) + rn(-.6, .6);
          e.rd = [Math.sin(an), Math.cos(an)];
        }
        mvx = e.rd[0];
        mvz = e.rd[1];
        face = Math.atan2(mvx, mvz);
        e.m.rotation.x += dt * 9;
      }
      if (f.kefen) s = y.sp * .62 * sm;
    }
    if (e.spm > 1 && e.cdir) {
      mvx = e.cdir[0];
      mvz = e.cdir[1];
      face = Math.atan2(mvx, mvz);
      s *= e.spm;
    }
    if (e.t == 5 && act) {
      if (e.cs == 1) {
        s = 0;
        e.ct -= dt;
        face = Math.atan2(e.cdx, e.cdz);
        if (e.ct <= 0) {
          e.cs = 2;
          e.ct = .75;
          e.u.tel.visible = false;
        }
      } else if (e.cs == 2) {
        mvx = e.cdx;
        mvz = e.cdz;
        s = 26 * sm;
        face = Math.atan2(mvx, mvz);
        e.ct -= dt;
        if (e.ct <= 0) {
          e.cs = 3;
          e.ct = .6;
        }
      } else if (e.cs == 3) {
        s = 0;
        e.ct -= dt;
        if (e.ct <= 0) {
          e.cs = 0;
          e.cc = rn(2.5, 4.5);
        }
      } else {
        e.cc -= dt;
        if (e.cc <= 0 && d < 22 && Math.abs($G.P.y - 1 - e.fy) < 3) {
          e.cs = 1;
          e.ct = .8;
          e.cdx = dx / d;
          e.cdz = dz / d;
          e.u.tel.visible = true;
          sfxAt('growl', q.x, q.z, 5);
        }
      }
    }
    // devler (taş dev, tanklar, ara boss devleri) değerek değil, okunur bir yumrukla vurur: yaklaşınca durur, kollarını
    // kaldırır, 0.66. saniyede önüne indirir. İnen yerin 1.7 m + gövde yarıçapı içindeki oyuncu türün hasarının 1.25 katını alır.
    // Kalkışı görüp geri çekilen kaçar; eskiden dev, dokunduğu her saniye uyarısız vuruyordu.
    if (e.t == 2 && act && !gSlamOff(e)) {
      if (e.ak > 0) {
        e.ak += dt;
        s = 0;
        face = e.akF;
        if (!e.akH && e.ak >= .66) {
          e.akH = 1;
          const ix = q.x + Math.sin(face) * e.r * .8,
            iz = q.z + Math.cos(face) * e.r * .8,
            R = e.r + 1.7,
            gy = groundAt(ix, iz, e.fy + 1);
          if (Math.hypot($G.P.x - ix, $G.P.z - iz) < R && Math.abs($G.P.y - 1 - gy) < 2.5) hurtP(e.dmg * 1.25, e);
          ringFx(ix, gy + .15, iz, 0xd8c8a8, R, 10);
          VFX.dust(ix, gy + .2, iz, 8, $G.BI ? 0xb08a6a : 0x7a6e58, R * .8);
          sfxAt('pot', ix, iz);
          if (Math.hypot($G.P.x - ix, $G.P.z - iz) < R + 6) $G.shk = Math.max($G.shk, .18);
        }
        if (e.ak >= .9) {
          e.ak = 0;
          e.akC = rn(.9, 1.4);
        }
      } else {
        e.akC = (e.akC || 0) - dt;
        if (e.akC <= 0 && d < e.r + 2.6 && Math.abs($G.P.y - 1 - e.fy) < 3) {
          e.ak = 1e-4;
          e.akH = 0;
          e.akF = face;
          s = 0;
          sfxAt('growl', q.x, q.z, 2);
        }
      }
    }
    if (e.t == 3 && e.slam > 0) {
      s = 0;
      e.slam -= dt;
      if (e.slam <= 0) bossSlam(e);
    }
    q.x = cl(q.x + mvx * s * dt);
    q.z = cl(q.z + mvz * s * dt);
    if (e.kx || e.kz) {
      q.x = cl(q.x + e.kx * dt);
      q.z = cl(q.z + e.kz * dt);
      const kd = Math.exp(-8 * dt);
      e.kx *= kd;
      e.kz *= kd;
      if (Math.abs(e.kx) + Math.abs(e.kz) < .05) e.kx = e.kz = 0;
    }
    if (e.t == 1) {
      e.fy = groundTop(q.x, q.z);
      q.y = e.fy + 1.5 + Math.sin(ph2 * .5) * .5;
    } else {
      pushOut(q, e.t == 3 ? e.r * .45 : e.r * .7);
      const bt = pushPlat(q, e.r * .7, e.fy),
        gnd = groundAt(q.x, q.z, e.fy);
      e.vy -= 40 * dt;
      e.fy += e.vy * dt;
      let og = 0;
      if (e.fy <= gnd) {
        e.fy = gnd;
        e.vy = 0;
        og = 1;
      }
      if (og && bt > -1e8 && e.jt <= 0 && $G.P.y - 1 > e.fy + 1) {
        e.vy = Math.sqrt(80 * (bt - e.fy + .9));
        e.jt = 1.4;
      }
      q.y = e.fy + (og && s > 0 ? Math.abs(Math.sin(ph2)) * (e.t == 0 ? .12 : .2) : 0);
    }
    e.m.rotation.y = face;
    {
      const k = Math.max(0, e.sq || 0) / .14;
      e.sq = (e.sq || 0) - dt;
      e.m.scale.set(e.ba * (1 + .16 * k), e.ba * (1 - .2 * k), e.ba * (1 + .16 * k));
    }
    e.hr -= dt;
    if (d < 16 && Math.random() < dt * .05) sfxAt('growl', q.x, q.z, e.t);
    {
      const U = e.u,
        st = U.st || (U.st = {});
      e.gp = (e.gp == null ? e.s : e.gp) + dt * (e.t == 1 ? ASP[1] : Math.max(-22, Math.min(22, s * GPK[e.t] / e.ba)));
      st.ph = e.gp;
      st.m = Math.min(1, Math.abs(s) / (y.sp * .55));
      st.t = $G.T;
      st.near = d < e.r * 1.5 + 2 && !(e.t == 2 && !gSlamOff(e)); // yumruklu dev kolunu yalnız gerçek vuruşta kaldırır
      st.atk = e.ak > 0 ? Math.min(.99, e.ak * 1.12) : 0; // anim: kol 0.54 sn'de tepede, 0.66'da yerde (vuruş anı)
      st.slam = e.slam;
      st.cs = e.cs;
      st.hit = e.hr > 0 ? e.hr / .2 : 0;
      st.dead = 0;
      st.aim = e.t == 4 && d < 32 ? e.sh < .8 ? Math.min(1, (.8 - e.sh) / .35) : e.sh > 2.1 ? Math.min(1, (e.sh - 2.1) / .3) : 0 : 0;
      e.adt = (e.adt || 0) + dt;
      const lv = d < 32 ? 1 : d < 64 ? 2 : 4,
        bh = (q.x - cam.position.x) * -Math.sin($G.yaw) + (q.z - cam.position.z) * -Math.cos($G.yaw) < -6;
      if (($G.FRC + (e.s * 7 | 0)) % (bh ? 6 : lv) == 0) {
        ANIM.cr(U, e.t, st, e.adt);
        e.adt = 0;
      }
    }
    if (e.t == 3 && act && !(e.kd && e.kd.fx && e.kd.fx.kefen)) {
      bossTick(e, dt, d, dx, dz);
      e.sh -= dt;
      if (e.sh <= 0) {
        e.sh = e.fin ? 1.7 : 2.3;
        const o = Math.random(),
          n = e.fin ? 16 : 12;
        for (let i = 0; i < n; i++) {
          const a = o + i * 6.283 / n;
          $G.EB.push({
            m: eShot(q.x, $G.HT(q.x, q.z) + 1.2, q.z, 'n'),
            vx: Math.cos(a) * 16,
            vz: Math.sin(a) * 16,
            l: 5,
            gnd: 1
          });
        }
      }
      e.st2 -= dt;
      if (e.st2 <= 0 && d < 30 && e.slam <= 0) {
        e.slam = .9;
        e.st2 = e.fin ? 5 : 6.5;
        sfx('growl');
      }
      if (e.fin) {
        e.sm -= dt;
        if (e.sm <= 0) {
          e.sm = 14;
          for (let i = 0; i < 4; i++) {
            const a = i / 4 * 6.283;
            spawn(i % 2 ? 5 : 0, {
              x: q.x + Math.cos(a) * 7,
              z: q.z + Math.sin(a) * 7
            });
          }
        }
      }
    }
    if (e.t == 4 && !e.thief && act) {
      const sh0 = e.sh;
      e.sh -= dt;
      // atıştan 0.35 sn önce yayın ucunda kısa bir parıltı: ok geliyor, yön değiştir. Menzil dışındaysa sayaç parıltının
      // önünde bekler; atış anında görüş yoksa yeniden parıltıya döner. Böylece uyarısız ok olmaz.
      if (sh0 > .35 && e.sh <= .35) {
        if (d < 30) VFX.emit(VFX.ADD, q.x + Math.sin(face) * e.r * .6, q.y + 1.8, q.z + Math.cos(face) * e.r * .6, { n: 5, sp: [.2, 1], life: [.3, .45], s: [1.1, 1.6], s1: .2, c: 0xffe2a0 });
        else e.sh = .36;
      }
      if (e.sh <= 0 && !(d < 30 && los(q.x, q.y + 1.8, q.z, $G.P.x, $G.P.y, $G.P.z))) e.sh = .5;
      if (e.sh <= 0) {
        e.sh = 2.4;
        // öngörülü nişan: okun uçuşu boyunca oyuncunun gideceği yere. Eskiden olduğu yere atıyordu; koşan oyuncuya
        // 30 sn'de 68 oktan 2'si değiyordu. Öngörü %75 (ara boss ve elitte %100), artı yarım metrelik sapma:
        // düz koşan vurulur, yön değiştiren ya da daire çizen çoğunlukla kurtulur.
        const v = 24,
          ox = q.x,
          oy = q.y + 1.8,
          oz = q.z,
          L = e.mini || e.el ? 1 : .75;
        let tx = $G.P.x,
          tz = $G.P.z,
          ft = d / v;
        for (let k = 0; k < 2; k++) {
          tx = $G.P.x + $G.P.vx * ft * L;
          tz = $G.P.z + $G.P.vz * ft * L;
          ft = Math.min(1.6, Math.hypot(tx - ox, tz - oz) / v);
        }
        const sa = rn(-.5, .5),
          ad = Math.hypot(tx - ox, tz - oz) || 1;
        const px = -(tz - oz) / ad,
          pz = (tx - ox) / ad;
        tx += px * sa;
        tz += pz * sa;
        const hd = Math.hypot(tx - ox, tz - oz) || 1,
          tt = hd / v;
        $G.EB.push({
          m: eShot(ox, oy, oz, 'n'),
          vx: (tx - ox) / tt,
          vz: (tz - oz) / tt,
          vy: ($G.P.y + .1 - oy) / tt,
          l: 3,
          d: e.dmg * .5 // tür hasarına bağlı (İskelet okçu eskisi gibi 10, Kaktüs 15; elit 1.5 kat)
        });
        sfxAt('throw', q.x, q.z);
      }
    }
    // temas hasarı: düşman başına 1 sn vuruş bekleme (Megabonk); oyuncunun 0.15 sn koruması ayrıca işler
    if (e.atkT > 0) e.atkT -= dt;
    if (!e.thief && act && e.dmg > 0 && !(e.atkT > 0) && $G.P.inv <= 0 && !(e.t == 2 && !gSlamOff(e)) && Math.hypot(dx, q.y + e.r - $G.P.y, dz) < e.r + .9) {
      e.atkT = 1;
      hurtP(e.cs == 2 ? e.dmg * 1.3 : e.dmg, e);
    }
  }
  $G.E = $G.E.filter(e => !e.dead);
  for (const b of $G.EB) {
    const q = b.m.position;
    ebFx(b, dt);
    if ($G.P.frz > 0) continue;
    if (b.home) {
      const hx = $G.P.x - q.x, hy = $G.P.y - q.y, hz = $G.P.z - q.z,
        L = Math.hypot(hx, hy, hz) || 1,
        k = Math.min(1, dt * 2.2);
      b.vx += (hx / L * 11 - b.vx) * k;
      b.vy = ((b.vy || 0) + (hy / L * 11 - (b.vy || 0)) * k);
      b.vz += (hz / L * 11 - b.vz) * k;
    }
    q.x += b.vx * dt;
    q.z += b.vz * dt;
    if (b.gnd) q.y = $G.HT(q.x, q.z) + 1.2;else q.y += (b.vy || 0) * dt;
    b.l -= dt;
    if (solidAt(q.x, q.y, q.z)) {
      b.l = 0;
      puff(q.x, q.y, q.z, 0x8a6a5a, 3);
    }
    // isabet: oyuncu gövdesi dikey bir silindir (yatayda 1.1, dikeyde ayağın 0.15 altından başın üstüne, P.y − 1.15 … P.y + 0.9).
    // Eskiden P.y çevresinde 1.4'lük küreydi; alçak atış dizden geçerken ıskalıyordu. Zıplayan oyuncunun ayağı
    // mermiyi geçtiyse vurulmaz (boss halkasının üstünden atlamak eskisi gibi çalışır).
    if (Math.hypot(q.x - $G.P.x, q.z - $G.P.z) < 1.1 && q.y > $G.P.y - 1.15 && q.y < $G.P.y + .9) {
      hurtP(b.d || 10 * DMK());
      if (b.ice) {
        $G.P.frzP = Math.max($G.P.frzP || 0, 1); // Megabonk: mavi küre 1 sn dondurur
        sfx('ice');
      }
      b.l = 0;
    }
    if (b.l <= 0) sc.remove(b.m);
  }
  $G.EB = $G.EB.filter(b => b.l > 0);
  for (const w of $G.SW) {
    w.r += 22 * dt;
    w.m.scale.setScalar(w.r);
    w.m.material.opacity = Math.max(0, .85 * (1 - w.r / w.mx));
    const pd = Math.hypot($G.P.x - w.x, $G.P.z - w.z),
      fy = $G.P.y - 1,
      og = fy <= groundAt($G.P.x, $G.P.z, fy) + .35;
    if (!w.hit && og && Math.abs(pd - w.r) < 1.4 && Math.abs(fy - w.y) < 3.5) {
      w.hit = 1;
      hurtP(22 * DMK());
      $G.P.vy = 9;
    }
    if (w.r >= w.mx) kill(w.m);
  }
  $G.SW = $G.SW.filter(w => w.r < w.mx);
  const mr = 6 * C.mag,
    bn = bonus();
  for (const o of $G.G) {
    const q = o.m.position,
      dx = $G.P.x - q.x,
      dz = $G.P.z - q.z,
      d = Math.hypot(dx, dz) || 1;
    o.m.rotation.y += dt * (o.air ? 14 : 3);
    if (o.air) {
      o.vy -= 32 * dt;
      q.x = cl(q.x + o.vx * dt);
      q.z = cl(q.z + o.vz * dt);
      q.y += o.vy * dt;
      o.m.rotation.x += dt * 9;
      const gy = groundAt(q.x, q.z, q.y + .5) + .9;
      if (q.y <= gy && o.vy < 0) {
        q.y = gy;
        if (o.bc < 1 && o.vy < -5) {
          o.bc++;
          o.vy *= -.34;
          o.vx *= .45;
          o.vz *= .45;
          if (o.ty == 'au' && Math.random() < .5) sfxAt('coin', q.x, q.z);
        } else {
          o.air = 0;
          o.by = gy - .9;
          o.m.rotation.x = 0;
        }
      }
      if (o.air) continue;
    }
    if (d < mr || o.pull) {
      const sv = o.pull ? 60 : 35;
      q.x += dx / d * sv * dt;
      q.z += dz / d * sv * dt;
      o.by += ($G.P.y - 1 - o.by) * Math.min(1, dt * 8);
    }
    q.y = o.by + .9 + Math.sin($G.T * 4 + q.x) * .2;
    if (d < 1.8 && Math.abs(q.y - $G.P.y) < 3) {
      o.c = 1;
      const pk = fireHook('pick', { ty: o.ty, v: o.v, q });
      o.v = pk.v;
      if (o.ty == 'xp') {
        $G.P.xp += (o.v + $G.P.bk) * C.xp * bn;
        $G.P.xpT += (o.v + $G.P.bk) * C.xp * bn;
        $G.P.bk = 0;
        sfx('xp');
        VFX.pick(q.x, q.y, q.z, 0x9fe8d8);
      } else if (o.ty == 'au') {
        const v = Math.max(1, Math.round((o.v + $G.P.bg) * C.gold * bn));
        $G.P.gold += v;
        $G.P.goldT += v;
        $G.P.bg = 0;
        sfx('gold');
        VFX.pick(q.x, q.y, q.z, 0xffd36a);
      } else if (o.ty == 'sv') {
        $G.P.silv += o.v;
        sfx('coin');
        VFX.pick(q.x, q.y, q.z, 0xeef4ff);
        const el = dmgNum({
          x: q.x,
          y: q.y,
          z: q.z
        }, o.v, .4, 0);
        if (el) {
          el.textContent = '+' + o.v + ' gümüş';
          el.classList.add('sv');
        }
      } else if (o.ty == 'ky') {
        addItem('kafesanahtar');
        toast('Kafes Anahtarı: korudaki kafesi açar');
        sfx('quest');
      } else $G.P.hp = Math.min($G.P.mh, $G.P.hp + $G.P.mh * .2);
    }
  }
  $G.G = $G.G.filter(o => !o.c);
  while ($G.G.length > 260) {
    let fi = 0,
      fd = -1;
    $G.G.forEach((o, i) => {
      const d = (o.m.position.x - $G.P.x) ** 2 + (o.m.position.z - $G.P.z) ** 2;
      if (d > fd && o.ty != 'hl' && o.ty != 'ky') {
        fd = d;
        fi = i;
      }
    });
    const o = $G.G[fi];
    if (o.ty == 'xp') $G.P.bk += o.v;else if (o.ty == 'au') $G.P.bg += o.v;
    $G.G.splice(fi, 1);
  }
  gSync();
  fxUpd(dt);
  $G.P.qt -= dt;
  if ($G.P.qt <= 0) {
    $G.P.qt = 1;
    qCheck();
  }
  if ($G.S == 'play' && $G.P.xp >= $G.P.need) {
    $G.P.xp -= $G.P.need;
    $G.P.lv++;
    $G.P.need = need($G.P.lv);
    calc();
    fireHook('level', { lv: $G.P.lv });
    sfx('lvl');
    ringFx($G.P.x, $G.P.y - .8, $G.P.z, 0xa8e3d6, 7, 18);
    VFX.lvl($G.P.x, $G.P.y, $G.P.z);
    choose('level', luOpts());
  }
}

export function fxUpd(dt) {
  VFX.upd(dt);
  for (const p of $G.PT) {
    p.vy -= 20 * dt;
    const q = p.m.position;
    q.x += p.vx * dt;
    q.y += p.vy * dt;
    q.z += p.vz * dt;
    p.l -= dt;
    p.m.scale.setScalar(p.s * Math.max(0, p.l * 1.8));
    if (p.l <= 0) sc.remove(p.m);
  }
  $G.PT = $G.PT.filter(p => p.l > 0);
  for (const d of $G.DY) {
    d.t -= dt;
    const st = d.u.st || (d.u.st = {});
    st.hit = st.near = st.slam = st.cs = st.aim = st.m = 0;
    st.t = $G.T;
    const q = d.m.position;
    if (d.fly) {
      d.vy -= 30 * dt;
      q.x = cl(q.x + d.vx * dt);
      q.z = cl(q.z + d.vz * dt);
      q.y += d.vy * dt;
      if (d.b < 2) {
        d.m.rotation.x += d.wx * dt;
        d.m.rotation.z += d.wz * dt;
      }
      const g = groundAt(q.x, q.z, q.y + 1);
      if (q.y < g && d.vy < 0) {
        q.y = g;
        if (d.b < 2 && d.vy < -4) {
          d.b++;
          d.vy *= -.3;
          d.vx *= .5;
          d.vz *= .5;
          d.wx *= .4;
          d.wz *= .4;
          VFX.dust(q.x, g + .1, q.z, 5, $G.BI ? 0xb08a6a : 0x7a6e58, 3);
          sfxAt('land', q.x, q.z, .4);
        } else {
          d.vy = 0;
          d.b = 2;
          d.vx *= .8;
          d.vz *= .8;
        }
      }
      if (d.b >= 2) {
        const rx = Math.atan2(Math.sin(d.m.rotation.x), Math.cos(d.m.rotation.x));
        d.m.rotation.x = rx + ((rx >= 0 ? 1.4 : -1.4) - rx) * Math.min(1, dt * 9);
        d.m.rotation.z *= Math.exp(-9 * dt);
      }
      st.dead = 1;
      st.fly = d.b < 2 ? 1 : 0;
      if (d.t < .4) {
        q.y -= dt * 1.4;
        d.m.scale.setScalar(d.s * Math.max(.02, d.t / .4));
      }
    } else if (d.melt) {
      const k = 1 - d.t / d.d0;
      st.dead = 1;
      st.fly = 0;
      q.x = cl(q.x + d.vx * dt * (1 - k));
      q.z = cl(q.z + d.vz * dt * (1 - k));
      d.m.rotation.x = Math.min(.35, d.m.rotation.x + dt * 1.5);
      const sc_ = k < .25 ? 1 + k * .3 : Math.max(.02, 1.075 * (1 - (k - .25) / .75));
      d.m.scale.set(d.s * sc_, d.s * Math.max(.02, 1 - k * k), d.s * sc_);
      q.y -= dt * .8 * k;
    } else if (d.big) {
      // boss: yavaşça öne devrilir, yere çarpınca toz ve sarsıntı, sonra toprağa gömülür
      const k = 1 - d.t / d.d0;
      st.dead = Math.min(1, k / .3);
      st.fly = 0;
      const fall = Math.min(1, k / .45);
      d.m.rotation.x = fall * fall * 1.35;
      if (!d.hit && fall >= 1) {
        d.hit = 1;
        $G.shk = Math.max($G.shk, 1.2);
        VFX.dust(q.x, groundAt(q.x, q.z, q.y + 1) + .1, q.z, 30, $G.BI ? 0xb08a6a : 0x7a6e58, 10);
        sfxAt('land', q.x, q.z, 1.5);
      }
      if (k > .72) {
        q.y -= dt * 2.2;
        d.m.scale.setScalar(d.s * Math.max(.02, 1 - (k - .72) / .28));
      }
    } else {
      const k = 1 - d.t / .9;
      st.dead = Math.min(1, k / .5);
      st.fly = 0;
      d.m.rotation.x = Math.min(.45, d.m.rotation.x + dt * 1.2);
      if (k > .62) {
        q.y -= dt * 1.8;
        d.m.scale.setScalar(d.s * Math.max(.02, 1 - (k - .62) / .38));
      }
    }
    ANIM.cr(d.u, d.ty, st, dt);
    if (d.t <= 0) rmE(d.m, d.u);
  }
  $G.DY = $G.DY.filter(d => d.t > 0);
  for (const r of $G.FXR) {
    r.r += r.s * dt;
    r.m.scale.setScalar(r.r);
    r.m.material.opacity = Math.max(0, 1 - r.r / r.mx);
    if (r.r >= r.mx) kill(r.m);
  }
  $G.FXR = $G.FXR.filter(r => r.r < r.mx);
}

// ---- arayüz
