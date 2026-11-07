// audio/engine.js · Kara Koru
// Bu dosya tek dosyalık sürümden (v22) otomatik ayrıldı. Ortak oyun durumu core/store.js içindeki $G nesnesinde.

import { $G } from '../core/store.js';
import { SND, SNDSRC } from './synth.js';
import { SET } from '../core/settings.js';
import { cam } from '../engine/renderer.js';

export let AB, AQ, AU, sfxT, CMB, VOX, LASTV, SM, SRT, SPRI, dB, WOODLM, STONELM, HMAT, SFX, SMIN;

export function __init_42() {
  // ---- ses motoru: üretilmiş örnek bankası, kanallar (dünya/arayüz/müzik/ortam), biyom yankısı, konum, ses önceliği, uyarlanır müzik
  $G.AC = null;
  $G.muted = 0;
  $G.WK = null;
  $G.MG = undefined;
  $G.MLP = undefined;
  $G.LIM = undefined;
  $G.WB = undefined;
  $G.SFXB = undefined;
  $G.UIB = undefined;
  $G.MUB = undefined;
  $G.MUF = undefined;
  $G.MDK = undefined;
  $G.AMB = undefined;
  $G.ADK = undefined;
  $G.RVE = undefined;
  $G.RVM = undefined;
  $G.RVMG = undefined;
  $G.WIDE = undefined;
  $G.lpBase = 20000;
  $G.irBI = -1;
  AB = {};
  AQ = [];
  AU = {};
  sfxT = {};
  CMB = {
    xp: {
      n: 0,
      t: 0
    },
    au: {
      n: 0,
      t: 0
    }
  };
  VOX = [];
  LASTV = {};
  // ad -> [kazanç dB, eşzamanlı sınır, öncelik, yankı, perde oynaması, kanal]
  SM = {
    kos: [-5, 2, 5, .35, .03],
    stepG: [-19, 3, 1, .04, .05],
    stepS: [-19, 3, 1, .04, .05],
    stepR: [-18, 3, 1, .06, .05],
    stepW: [-18, 3, 1, .06, .05],
    stepA: [-17, 3, 1, .05, .06],
    jump: [-13, 2, 2, .05, .04],
    ajump: [-10, 2, 2, .08, .05],
    land: [-9, 2, 2, .06, .05],
    dash: [-8, 2, 3, .1, .04],
    splash: [-8, 2, 2, .1, .06],
    hit0: [-15, 6, 2, .05, .09],
    hit1: [-16, 6, 2, .05, .09],
    hit2: [-14, 6, 2, .05, .08],
    hit4: [-14, 6, 2, .05, .08],
    hit5: [-15, 6, 2, .05, .09],
    crit: [-12, 3, 3, .08, .06],
    bonk: [-12, 5, 3, .1, .08],
    kill0: [-12, 4, 3, .12, .06],
    kill1: [-10, 4, 3, .1, .08],
    kill2: [-8, 3, 4, .18, .05],
    kill4: [-8, 4, 3, .12, .06],
    kill5: [-8.5, 3, 4, .15, .05],
    kill3: [-1, 1, 6, .3, 0],
    growl0: [-20, 3, 2, .15, .08],
    growl1: [-19, 3, 1, .1, .1],
    growl2: [-15, 2, 2, .2, .06],
    growl4: [-16, 3, 2, .12, .08],
    growl5: [-12, 3, 3, .18, .06],
    growl9: [-3, 1, 5, .3, .03],
    hurt: [-8, 2, 5, .08, .04],
    heart: [-7, 1, 5, 0, 0],
    slam: [-3, 2, 5, .3, .04],
    shoot: [-11, 4, 2, .06, .05],
    ice: [-13, 3, 2, .08, .05],
    fire: [-10, 3, 2, .1, .05],
    boom: [-9, 4, 4, .22, .06],
    nova: [-10.5, 2, 3, .18, .04],
    zap: [-8, 3, 3, .2, .05],
    throw: [-12, 3, 2, .08, .06],
    shing: [-17, 4, 1, .06, .07],
    coin: [-19, 3, 1, .05, .06],
    swish: [-11, 3, 2, .06, .07],
    vortex: [-9, 2, 3, .2, .04],
    tornado: [-8, 1, 3, .2, .03],
    xp: [-19, 4, 1, .06, 0],
    chg: [-13, 4, 3, .22, 0],
    gold: [-18, 4, 1, .06, 0],
    loot: [-9, 2, 3, .1, .04],
    buy: [-8, 2, 4, .08, .03],
    pot: [-10, 3, 2, .1, .07],
    pad: [-8, 2, 3, .15, .04],
    power: [-7, 2, 4, .18, .02],
    freeze: [-6, 1, 4, .25, 0],
    lvl: [-4, 1, 6, .18, 0, 'ui'],
    chest: [-4, 1, 6, .18, 0, 'ui'],
    quest: [-6, 1, 5, .2, 0, 'ui'],
    shrine: [-6, 1, 5, .25, 0],
    portal: [-6, 1, 5, .25, 0],
    boss: [-3, 1, 6, .25, 0, 'ui'],
    ui: [-15, 3, 4, 0, .04, 'ui'],
    deny: [-12, 2, 4, 0, 0, 'ui'],
    card: [-17, 4, 3, 0, .06, 'ui'],
    pick: [-7, 1, 5, .12, 0, 'ui'],
    birdA: [-24, 2, 0, .3, .08],
    birdB: [-26, 1, 0, .4, .02],
    crow: [-20, 1, 0, .35, .06],
    pecker: [-19, 1, 0, .35, .05],
    owl: [-26, 1, 0, .45, .02],
    hawk: [-24, 1, 0, .4, .05],
    trickle: [-18, 1, 0, .2, .1]
  };
  SRT = n => /^(bas|drone|amb(D|F|Storm|W|Tor|Horde)|kos|davG|slam|growl2|growl9|kill2|kill3|heart|boss)/.test(n) ? 22050 : 32000;
  SPRI = n => /^(ui|deny|card|pick)$/.test(n) ? 0 : /^(drone|bag|ney|dk|zil|davG|davT)/.test(n) ? 1 : /^(step|jump|ajump|land|dash|slide|hit|crit|bonk|kill[0145]|xp|gold|coin|shoot|lvl|chest|hurt|heart)/.test(n) ? 2 : /^(swish|ice|fire|boom|nova|zap|throw|shing|vortex|amb)/.test(n) ? 3 : 4;
}

export function aBuild(ctx) {
  $G.AC = ctx;
  const c = $G.AC;
  $G.LIM = c.createDynamicsCompressor();
  $G.LIM.threshold.value = -4;
  $G.LIM.knee.value = 0;
  $G.LIM.ratio.value = 20;
  $G.LIM.attack.value = .001;
  $G.LIM.release.value = .12;
  $G.LIM.connect(c.destination);
  $G.MG = c.createGain();
  $G.MG.connect($G.LIM);
  $G.MLP = c.createBiquadFilter();
  $G.MLP.type = 'lowpass';
  $G.MLP.frequency.value = 20000;
  $G.MLP.Q.value = .5;
  $G.MLP.connect($G.MG);
  $G.WB = c.createGain();
  $G.WB.connect($G.MLP);
  const glu = c.createDynamicsCompressor();
  glu.threshold.value = -20;
  glu.knee.value = 10;
  glu.ratio.value = 3;
  glu.attack.value = .004;
  glu.release.value = .16;
  glu.connect($G.WB);
  const slp = c.createBiquadFilter();
  slp.type = 'lowpass';
  slp.frequency.value = 10000;
  slp.Q.value = .5;
  slp.connect(glu);
  $G.SFXB = c.createGain();
  $G.SFXB.connect(slp);
  $G.UIB = c.createGain();
  $G.UIB.connect($G.MG);
  $G.MUB = c.createGain();
  $G.MUF = c.createBiquadFilter();
  $G.MUF.type = 'lowpass';
  $G.MUF.frequency.value = 20000;
  $G.MDK = c.createGain();
  $G.MUB.connect($G.MUF);
  $G.MUF.connect($G.MDK);
  $G.MDK.connect($G.WB);
  $G.AMB = c.createGain();
  $G.ADK = c.createGain();
  const alp = c.createBiquadFilter();
  alp.type = 'lowpass';
  alp.frequency.value = 4500;
  alp.Q.value = .5;
  $G.AMB.connect(alp);
  alp.connect($G.ADK);
  $G.ADK.connect($G.WB);
  $G.RVE = c.createConvolver();
  const re = c.createGain();
  re.gain.value = .38;
  $G.RVE.connect(re);
  re.connect($G.WB);
  $G.RVM = c.createConvolver();
  // müzik yankısı: notalar yankıya MUB'dan önce gönderilir, bu yüzden dönüş kazancı da müzik ayarını izlemeli
  // (yoksa müzik sıfıra çekilince yankı kuyruğu duyulmaya devam eder)
  const rm = $G.RVMG = c.createGain();
  rm.gain.value = .55;
  $G.RVM.connect(rm);
  rm.connect($G.MDK);
  $G.RVM.buffer = mkIR(2.4, .02, 9000, 0, 0);
  // genişletici: tek kanallı stingleri hafif stereo yap (Haas)
  $G.WIDE = c.createGain();
  const pL = c.createStereoPanner ? c.createStereoPanner() : null,
    pR = c.createStereoPanner ? c.createStereoPanner() : null,
    dl = c.createDelay(.05);
  dl.delayTime.value = .013;
  if (pL) {
    pL.pan.value = -.45;
    pR.pan.value = .45;
    $G.WIDE.connect(pL);
    pL.connect($G.UIB);
    $G.WIDE.connect(dl);
    dl.connect(pR);
    pR.connect($G.UIB);
  } else $G.WIDE.connect($G.UIB);
  aVol();
  $G.irBI = -1;
  irSet(0);
  genStart();
}

export function aInit() {
  if ($G.AC) {
    // iOS Safari arka plandan dönüşte 'interrupted' bildirir.
    if ($G.AC.state != 'running' && $G.AC.resume) $G.AC.resume().catch(() => {});
    return;
  }
  try {
    aBuild(new (window.AudioContext || /** @type {any} */ (window).webkitAudioContext)());
  } catch (e) {
    $G.AC = null;
  }
}

export function aVol() {
  if (!$G.AC) return;
  const t = $G.AC.currentTime;
  $G.MG.gain.setTargetAtTime($G.muted ? 0 : 1, t, .02);
  $G.SFXB.gain.value = SET.sfx * 1.15;
  $G.UIB.gain.value = SET.sfx * 1.15;
  $G.MUB.gain.value = SET.mus * .95;
  $G.RVMG.gain.value = SET.mus * 1.1; // varsayılan .5'te eski .55 düzeyi
  $G.AMB.gain.value = SET.sfx * .9;
}
// yankı darbe tepkisi: sn uzunluk, ön gecikme, ton (parlaklık), yansıma tipi (0 salon, 1 orman, 2 kanyon)

// yankı darbe tepkisi: sn uzunluk, ön gecikme, ton (parlaklık), yansıma tipi (0 salon, 1 orman, 2 kanyon)
export function mkIR(sec, pre, tone, ty, bi) {
  const sr = $G.AC.sampleRate,
    n = Math.floor(sr * (sec + pre)),
    b = $G.AC.createBuffer(2, n, sr);
  let s = 12345 + ty * 99;
  const R = () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296 * 2 - 1;
  };
  for (let c = 0; c < 2; c++) {
    const d = b.getChannelData(c),
      p0 = Math.floor(pre * sr);
    let lp = 0;
    for (let i = p0; i < n; i++) {
      const t = (i - p0) / sr,
        e = Math.exp(-t * 6.9 / sec),
        fc = tone * Math.exp(-t / (sec * .4)) + 500,
        a = Math.exp(-6.283 * fc / sr);
      lp = R() * (1 - a) + lp * a;
      d[i] = lp * e * Math.min(1, t / .012) * 1.4;
    }
    const taps = ty == 2 ? [[.17, .5], [.31, .32], [.47, .18]] : ty == 1 ? [[.011, .5], [.019, .4], [.027, .35], [.041, .3], [.053, .22]] : [[.009, .45], [.016, .35], [.023, .3], [.034, .22]];
    for (const [tt, g] of taps) {
      const j = p0 + Math.floor((tt + (c ? .004 : 0)) * sr);
      for (let k = 0; k < Math.floor(sr * .006) && j + k < n; k++) d[j + k] += R() * g * Math.exp(-k / (sr * .0015));
    }
  }
  return b;
}

export function irSet(bi) {
  if (!$G.AC || $G.irBI === bi) return;
  $G.irBI = bi;
  try {
    $G.RVE.buffer = bi == 1 ? mkIR(1, .012, 4200, 2) : mkIR(1.5, .006, 3200, 1);
  } catch (e) {}
}
// ---- örnek üretimi: arka iş parçacığında (Worker), olmazsa ana iş parçacığında dilim dilim

// ---- örnek üretimi: arka iş parçacığında (Worker), olmazsa ana iş parçacığında dilim dilim
export function genStart() {
  const names = Object.keys(SND.SREC.REC).sort((a, b) => SPRI(a) - SPRI(b));
  for (const n of names) for (let v = 0; v < SND.SREC.REC[n].n; v++) AQ.push([n, v, SRT(n)]);
  try {
    const code = 'const L=(' + SNDSRC.toString() + ')();onmessage=e=>{const [n,v,sr]=e.data;L.DSP.setSR(sr);let x;try{x=L.sRender(n,v)}catch(err){x=[new Float32Array(32)]}postMessage([n,v,sr,x],x.map(c=>c.buffer))}';
    $G.WK = new Worker(URL.createObjectURL(new Blob([code], {
      type: 'text/javascript'
    })));
    $G.WK.onmessage = e => {
      const [n, v, sr, x] = e.data;
      bankAdd(n, v, sr, x);
      genNext();
    };
    $G.WK.onerror = () => {
      $G.WK = null;
    };
    AU.inF = 0;
    for (let i = 0; i < 3; i++) genNext();
  } catch (e) {
    $G.WK = null;
  }
}

export function genNext() {
  if (!$G.WK || !AQ.length) return;
  $G.WK.postMessage(AQ.shift());
}

export function genTick() {
  if ($G.WK || !AQ.length) return;
  const t0 = performance.now(),
    bud = $G.S == 'play' ? 3 : 14;
  while (AQ.length && performance.now() - t0 < bud) {
    const [n, v, sr] = AQ.shift();
    try {
      SND.DSP.setSR(sr);
      bankAdd(n, v, sr, SND.sRender(n, v));
    } catch (e) {}
  }
}

export function bankAdd(n, v, sr, x) {
  try {
    const b = $G.AC.createBuffer(x.length, x[0].length, sr);
    x.forEach((c, i) => b.getChannelData(i).set(c));
    (AB[n] || (AB[n] = []))[v] = b;
  } catch (e) {}
}

export function __init_43() {
  dB = v => Math.pow(10, v / 20);
}

// ---- çalma: ses havuzu, eşzamanlı sınır, öncelik
export function vClean(t) {
  for (let i = VOX.length - 1; i >= 0; i--) if (VOX[i].e < t) VOX.splice(i, 1);
}

export function vStop(o, t) {
  try {
    o.g.gain.setTargetAtTime(0, t, .012);
    o.s.stop(t + .08);
  } catch (e) {}
  o.e = 0;
}

export function sPlay(n, o = {}) {
  if (!$G.AC || $G.muted) return null;
  const L = AB[n];
  if (!L) return null;
  const m = SM[n] || [-10, 4, 2, .1, 0],
    t = $G.AC.currentTime + (o.at || 0);
  let v = o.v;
  if (v == null) {
    const k = L.length;
    v = Math.floor(Math.random() * k);
    if (k > 2 && v === LASTV[n]) v = (v + 1) % k;
    LASTV[n] = v;
  }
  const b = L[v % L.length] || L.find(x => x);
  if (!b) return null;
  vClean($G.AC.currentTime);
  const pr = o.pr != null ? o.pr : m[2];
  let same = 0,
    old = null;
  for (const x of VOX) if (x.n == n) {
    same++;
    if (!old || x.t < old.t) old = x;
  }
  if (same >= m[1] && old) vStop(old, t);
  if (VOX.length >= 28) {
    let lo = null;
    for (const x of VOX) if (x.e && (!lo || x.pr < lo.pr || x.pr == lo.pr && x.t < lo.t)) lo = x;
    if (lo && lo.pr <= pr) vStop(lo, t);else return null;
  }
  const s = $G.AC.createBufferSource();
  s.buffer = b;
  const rt = (o.rate || 1) * (1 + (m[4] || 0) * (Math.random() * 2 - 1));
  s.playbackRate.value = rt;
  const g = $G.AC.createGain();
  g.gain.value = dB(m[0]) * (o.g != null ? o.g : 1);
  s.connect(g);
  let nd = g;
  if (o.lp && o.lp < 16000) {
    const f = $G.AC.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = o.lp;
    nd.connect(f);
    nd = f;
  }
  const bus = o.bus || (m[5] == 'ui' ? $G.WIDE : $G.SFXB);
  if (o.pan && $G.AC.createStereoPanner) {
    const p = $G.AC.createStereoPanner();
    p.pan.value = Math.max(-1, Math.min(1, o.pan));
    nd.connect(p);
    nd = p;
  }
  nd.connect(bus);
  const rv = (o.rv != null ? o.rv : m[3]) * (bus == $G.MUB ? 0 : 1);
  if (rv > 0) {
    const r = $G.AC.createGain();
    r.gain.value = rv;
    nd.connect(r);
    r.connect($G.RVE);
  }
  s.start(t);
  const e = t + b.duration / rt + .05,
    rec = {
      n,
      s,
      g,
      t,
      e,
      pr
    };
  VOX.push(rec);
  return rec;
}
// dinleyiciye göre konum: stereo, uzaklık kazancı, hava emilimi (alçak geçiren), uzakta daha çok yankı

// dinleyiciye göre konum: stereo, uzaklık kazancı, hava emilimi (alçak geçiren), uzakta daha çok yankı
export function spat(x, z) {
  if (typeof cam == 'undefined') return {};
  const dx = x - cam.position.x,
    dz = z - cam.position.z,
    d = Math.hypot(dx, dz) || 1,
    rx = Math.cos($G.yaw),
    rz = -Math.sin($G.yaw);
  const dp = Math.max(0, d - 9);
  return {
    pan: Math.max(-.8, Math.min(.8, (dx * rx + dz * rz) / (d + 4))),
    g: Math.max(.05, Math.min(1, 1 / (1 + dp / 16))),
    lp: d > 22 ? Math.max(1500, 17000 - (d - 22) * 230) : 0,
    rvx: Math.min(.3, dp / 110)
  };
}

export function __init_44() {
  $G.SPO = null;
}

export function sfx(n, a) {
  if (!$G.AC || $G.muted || SET.sfx <= 0) return;
  const t = performance.now() / 1000,
    m = SMIN[n] || 0;
  if (m && sfxT[n] && t - sfxT[n] < m) return;
  sfxT[n] = t;
  try {
    (SFX[n] || ((a, o) => sP(n, o)))(a, $G.SPO || {});
  } catch (e) {}
}

export function sfxAt(n, x, z, a) {
  if (!$G.AC || $G.muted) return;
  const s = spat(x, z);
  $G.SPO = s;
  sfx(n, a);
  $G.SPO = null;
}

export function sP(n, o, ex) {
  const m = SM[n] || [0, 0, 0, .1];
  const r = Object.assign({}, o || {}, ex || {});
  r.g = (o && o.g != null ? o.g : 1) * (ex && ex.g != null ? ex.g : 1);
  if (o && o.rvx) r.rv = (ex && ex.rv != null ? ex.rv : m[3]) + o.rvx;
  return sPlay(n, r);
}
// zemin türü: su, ahşap, taş, çimen, kum

export function __init_45() {
  // zemin türü: su, ahşap, taş, çimen, kum
  WOODLM = {
    bridge: 1,
    tower: 1,
    camp: 1,
    pond: 1
  };
  STONELM = {
    temple: 1,
    stones: 1,
    wall: 1,
    caravan: 1,
    kurgan: 1,
    mesa: 1,
    obelisk: 1,
    skeleton: 1,
    oasis: 1
  };
}

export function surf() {
  if (typeof $G.P == 'undefined' || !$G.P) return 'G';
  if ($G.P.inW) return 'A';
  let h = 0;
  try {
    h = $G.HT($G.P.x, $G.P.z);
  } catch (e) {}
  if ($G.P.y - 1 > h + .35) {
    let best = null,
      bd = 1e9;
    for (const l of typeof $G.LMS != 'undefined' ? $G.LMS : []) {
      const d = Math.hypot($G.P.x - l.x, $G.P.z - l.z) - l.r;
      if (d < bd) {
        bd = d;
        best = l;
      }
    }
    if (best && bd < 6 && WOODLM[best.t]) return 'W';
    return 'R';
  }
  if ($G.BI == 1) return 'S';
  try {
    if ($G.MAP && $G.MAP.pm && $G.MAP.pm($G.P.x, $G.P.z) > .55) return 'S';
  } catch (e) {}
  return 'G';
}

export function duck(db, hold, rel) {
  if (!$G.AC) return;
  const t = $G.AC.currentTime,
    g = dB(db);
  for (const p of [$G.MDK.gain, $G.ADK.gain]) {
    p.cancelScheduledValues(t);
    p.setTargetAtTime(g, t, .04);
    p.setTargetAtTime(1, t + hold, rel);
  }
}

export function muffle(f, hold) {
  if (!$G.AC) return;
  const t = $G.AC.currentTime,
    p = $G.MLP.frequency;
  p.cancelScheduledValues(t);
  p.setTargetAtTime(f, t, .008);
  p.setTargetAtTime($G.lpBase, t + hold, .15);
}

export function __init_46() {
  HMAT = [0, 1, 2, 0, 4, 5];
  SFX = {
    hit: (m, o) => sP('hit' + (HMAT[m | 0] | 0), o),
    crit: (m, o) => {
      sP('crit', o);
      sP('hit' + (HMAT[m | 0] | 0), o, {
        g: .6
      });
    },
    bonk: (m, o) => sP('bonk', o),
    kill: (t, o) => sP('kill' + ((t | 0) == 3 ? 3 : [0, 1, 2, 3, 4, 5][t | 0]), o),
    growl: (t, o) => sP('growl' + (t == null ? 9 : t == 3 ? 9 : t), o),
    step: (a, o) => {
      const s = surf(),
        v = $G.P ? Math.hypot($G.P.vx, $G.P.vz) : 10;
      sP('step' + s, o, {
        g: Math.min(1.2, .55 + v / 26),
        rate: a ? 1.03 : .97
      });
    },
    land: (k, o) => {
      k = Math.min(1.6, k || 1);
      sP('land', o, {
        g: .45 + .45 * k
      });
      sP('step' + surf(), o, {
        g: .6 + .4 * k,
        rate: .9
      });
      if (k > 1.1) muffle(3500, .05);
    },
    jump: (a, o) => sP(a ? 'ajump' : 'jump', o),
    hurt: (a, o) => {
      // her darbede bütün sesi boğan alçak geçiren süzgeç kaldırıldı; yalnız hafif bir kısma kalıyor
      sP('hurt', o);
      duck(-2.5, .15, .25);
    },
    heart: () => sPlay('heart'),
    xp: () => {
      const c = CMB.xp,
        t = $G.AC.currentTime;
      c.n = t - c.t < .5 ? Math.min(c.n + 1, 7) : 0;
      c.t = t;
      const st = [0, 2, 4, 7, 9, 12, 14, 16][c.n]; // pentatonik: art arda toplamada hoş bir merdiven
      sPlay('xp', {
        rate: Math.pow(2, st / 12)
      });
    },
    gold: () => {
      const c = CMB.au,
        t = $G.AC.currentTime;
      c.n = t - c.t < .5 ? Math.min(c.n + 1, 7) : 0;
      c.t = t;
      sPlay('gold', {
        rate: Math.pow(2, c.n / 24)
      });
    },
    lvl: () => {
      sPlay('lvl');
      duck(-8, 1.2, .5);
    },
    chest: r => {
      sPlay('chest', {
        v: Math.max(0, Math.min(4, r | 0))
      });
      duck(-9, 1.4 + (r | 0) * .3, .6);
    },
    boss: () => {
      sPlay('boss');
      duck(-10, 2.6, .8);
    },
    quest: () => {
      sPlay('quest');
      duck(-6, 1.2, .5);
    },
    shrine: (a, o) => {
      sP('shrine', o);
      duck(-5, 1.5, .6);
    },
    portal: (a, o) => {
      sP('portal', o);
      duck(-4, 1.2, .6);
    },
    slam: (a, o) => {
      sP('slam', o);
      muffle(2500, .06);
    },
    boom: (a, o) => sP('boom', o),
    zap: (a, o) => sP('zap', o),
    shing: (a, o) => sP('shing', o),
    freeze: () => {
      sPlay('freeze');
      duck(-6, 1, .6);
    },
    // ocak dolumu: a = 0..11 adım; iki oktavlık pentatonik çıkış
    chg: a => sPlay('chg', {
      rate: Math.pow(2, [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26][Math.max(0, Math.min(11, a | 0))] / 12)
    }),
    power: () => sPlay('power'),
    buy: () => sPlay('buy'),
    dash: (a, o) => sP('dash', o),
    pick: () => sPlay('pick'),
    card: i => sPlay('card', {
      at: (i | 0) * .07
    })
  };
  SMIN = {
    hurt: .12,
    hit: .03,
    crit: .06,
    xp: .045,
    gold: .05,
    shoot: .05,
    ice: .05,
    kill: .03,
    bonk: .04,
    pot: .05,
    growl: .3,
    step: .09,
    shing: .06,
    coin: .06,
    fire: .07,
    throw: .07,
    zap: .08,
    boom: .05,
    swish: .05,
    loot: .06,
    vortex: .2,
    card: 0,
    land: .12
  };
}
