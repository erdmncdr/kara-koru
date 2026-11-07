// audio/ambience.js · Kara Koru
// Bu dosya tek dosyalık sürümden (v22) otomatik ayrıldı. Ortak oyun durumu core/store.js içindeki $G nesnesinde.

import { $G } from '../core/store.js';
import { AB, AU, genTick, irSet, sPlay, spat } from './engine.js';

export let aTg;

// ---- ortam: döngüler (sözde stereo), konumlu su/ateş, fırtına, kayma, rastgele kuşlar
export function loopP(n, bus, off, pan) {
  const L = AB[n];
  if (!L || !L[0]) return null;
  const s = $G.AC.createBufferSource();
  s.buffer = L[0];
  s.loop = true;
  const g = $G.AC.createGain();
  g.gain.value = 0;
  s.connect(g);
  let nd = g;
  if ($G.AC.createStereoPanner) {
    const p = $G.AC.createStereoPanner();
    p.pan.value = pan || 0;
    nd.connect(p);
    nd = p;
    s.pn = p;
  }
  nd.connect(bus || $G.AMB);
  s.start($G.AC.currentTime, (off || 0) % L[0].duration);
  return {
    s,
    g,
    p: s.pn
  };
}

export function aBed(n, bus, w = .7) {
  const a = loopP(n, bus, 0, -w),
    b = loopP(n, bus, AB[n][0].duration * .47, w);
  return a && b ? {
    a,
    b,
    set(v, k) {
      aTg(a.g.gain, v, k);
      aTg(b.g.gain, v, k);
    }
  } : null;
}

export function __init_47() {
  aTg = (p, v, k = .15) => {
    if (p && $G.AC) p.setTargetAtTime(v, $G.AC.currentTime, k);
  };
  $G.ambT = 3;
  $G.ambS = 0;
  $G.wD = {
    d: 99,
    pan: 0,
    t: 0
  };
  $G.hbT = 0;
  $G.lastBI = -1;
  $G.lowHP = 0;
}

export function wDist() {
  $G.wD.t = .35;
  if (typeof $G.HT == 'undefined' || !$G.P || $G.WLV < -50) {
    $G.wD.d = 99;
    return;
  }
  let best = 99,
    bx = 0,
    bz = 0;
  for (const r of [3, 6, 10, 15, 22, 30, 40]) for (let k = 0; k < 20; k++) {
    const a = k / 20 * 6.283,
      x = $G.P.x + Math.cos(a) * r,
      z = $G.P.z + Math.sin(a) * r;
    if (r < best && $G.HT(x, z) < $G.WLV - .15) {
      best = r;
      bx = x;
      bz = z;
      break;
    }
  }
  $G.wD.d = $G.P.inW ? 0 : best;
  if (best < 99) {
    const s = spat(bx, bz);
    $G.wD.pan = s.pan || 0;
  }
}

export function ambTick(dt, vm) {
  if (!$G.AC) return;
  genTick();
  const pl = $G.S == 'play';
  if (!AU.ready && AB.ambF && AB.ambD && AB.ambW && AB.ambFire && AB.ambStorm && AB.ambTor && AB.slide && AB.ambHorde && AB.orbL) {
    AU.ready = 1;
    AU.F = aBed('ambF');
    AU.D = aBed('ambD');
    AU.W = loopP('ambW');
    AU.fire = loopP('ambFire');
    AU.st = aBed('ambStorm');
    AU.tor = loopP('ambTor');
    AU.slide = loopP('slide', $G.SFXB);
    AU.hd = aBed('ambHorde', $G.AMB, .5);
    AU.orb = loopP('orbL', $G.SFXB);
    AU.aur = loopP('ambFire', $G.SFXB, 2.3);
  }
  if (typeof $G.BI != 'undefined' && $G.BI !== $G.lastBI) {
    $G.lastBI = $G.BI;
    irSet($G.BI);
  }
  // düşük can: dünya boğuklaşır, kalp atar
  const lh = pl && $G.P && $G.P.hp > 0 && $G.P.hp < $G.P.mh * .3;
  if (lh != $G.lowHP) {
    $G.lowHP = lh;
    $G.lpBase = lh ? 2600 : 20000;
    aTg($G.MLP.frequency, $G.lpBase, .4);
  }
  if (lh) {
    $G.hbT -= dt;
    if ($G.hbT <= 0) {
      $G.hbT = .82;
      sPlay('heart');
    }
  }
  // menü/duraklatma: müzik boğuk
  const pz = /^(pause|choice|item|shop|kazan|set|otag|ready)$/.test($G.S);
  aTg($G.MUF.frequency, pz ? 1200 : 20000, .25);
  if (!AU.ready) return;
  const ins = pl || pz || $G.S == 'trans';
  AU.F.set(ins && $G.BI == 0 ? .1 : $G.S == 'menu' ? .05 : 0, .9);
  AU.D.set(ins && $G.BI == 1 ? .12 : 0, .9);
  $G.wD.t -= dt;
  if ($G.wD.t <= 0) wDist();
  aTg(AU.W.g.gain, ins && $G.wD.d < 40 ? .22 * Math.pow(1 - $G.wD.d / 40, 1.6) : 0, .4);
  if (AU.W.p) aTg(AU.W.p.pan, $G.wD.pan * .8, .3);
  let fd = 1e9,
    fp = 0;
  if (ins && typeof $G.FIRES != 'undefined') for (const f of $G.FIRES) {
    const d = Math.hypot(f.x - $G.P.x, f.z - $G.P.z);
    if (d < fd) {
      fd = d;
      fp = spat(f.x, f.z).pan || 0;
    }
  }
  aTg(AU.fire.g.gain, fd < 26 ? .25 * Math.pow(1 - fd / 26, 1.5) : 0, .3);
  if (AU.fire.p) aTg(AU.fire.p.pan, fp, .2);
  AU.st.set(ins && typeof $G.STORM != 'undefined' && $G.STORM.on ? .4 : 0, 1.2);
  let td = 1e9,
    tp = 0;
  if (pl && typeof $G.TOR != 'undefined') for (const t of $G.TOR) {
    const d = Math.hypot(t.x - $G.P.x, t.z - $G.P.z);
    if (d < td) {
      td = d;
      tp = spat(t.x, t.z).pan || 0;
    }
  }
  aTg(AU.tor.g.gain, td < 40 ? .35 * (1 - td / 40) : 0, .3);
  if (AU.tor.p) aTg(AU.tor.p.pan, tp, .2);
  AU.hT = (AU.hT || 0) - dt;
  if (AU.hT <= 0) {
    AU.hT = .25;
    let ne = 0;
    if (pl && typeof $G.E != 'undefined') for (const e of $G.E) {
      const q = e.m && e.m.position;
      if (q && Math.abs(q.x - $G.P.x) < 30 && Math.abs(q.z - $G.P.z) < 30) ne++;
    }
    AU.hd.set(pl ? Math.min(.12, ne / 60 * .12) : 0, .6);
  }
  const ow = pl && $G.P && $G.P.W && $G.P.W.find(w => w.k == 'orbit'),
    aw = pl && $G.P && $G.P.W && $G.P.W.find(w => w.k == 'aura');
  aTg(AU.orb.g.gain, ow ? .07 : 0, .3);
  if (ow) aTg(AU.orb.s.playbackRate, .92 + Math.min(.4, (ow.lv - 1) * .05), .3);
  aTg(AU.aur.g.gain, aw ? .08 : 0, .4);
  aTg(AU.slide.g.gain, pl && $G.P && $G.P.sl && vm > 3 ? Math.min(.2, vm / 30 * .2) : 0, .06);
  aTg(AU.slide.s.playbackRate, .8 + Math.min(.5, vm / 60), .1);
  if (!pl || $G.muted) return;
  $G.ambT -= dt;
  if ($G.ambT <= 0) {
    const bi = $G.BI == 1,
      r = Math.random(),
      n = bi ? r < .35 ? 'hawk' : r < .8 ? 'trickle' : 'tornado' : r < .62 ? 'birdA' : r < .74 ? 'birdB' : r < .86 ? 'crow' : r < .95 ? 'pecker' : 'owl';
    $G.ambT = bi ? 9 + Math.random() * 14 : 3.5 + Math.random() * 7;
    const a = Math.random() * 6.283,
      d = 25 + Math.random() * 45,
      s = spat($G.P.x + Math.cos(a) * d, $G.P.z + Math.sin(a) * d);
    sPlay(n, {
      pan: s.pan,
      g: n == 'tornado' ? .25 : Math.max(.35, s.g * 1.6),
      lp: s.lp || 9000,
      rv: .35,
      bus: $G.AMB
    });
  }
}
// ---- müzik: Hicaz, bağlama + davul + darbuka + ney + zurna + gırtlak dronu; sakin / çatışma / boss katmanları
