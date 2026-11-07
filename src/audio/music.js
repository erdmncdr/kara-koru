// audio/music.js · Kara Koru
// Bu dosya tek dosyalık sürümden (v22) otomatik ayrıldı. Ortak oyun durumu core/store.js içindeki $G nesnesinde.

import { $G } from '../core/store.js';
import { SET } from '../core/settings.js';
import { aBed } from './ambience.js';
import { AB } from './engine.js';

export let MS, MOT, SECS, RIF, BPR;

export function __init_48() {
  // ---- müzik: Hicaz, bağlama + davul + darbuka + ney + zurna + gırtlak dronu; sakin / çatışma / boss katmanları
  MS = {
    st: 0,
    nx: 0,
    I: .2,
    mode: '',
    bar: 0,
    sec: 0,
    ph: [],
    dr: null,
    dt: null,
    mel: 0
  };
  MOT = [[[0, 4, 4], [4, 5, 2], [6, 4, 2], [8, 3, 4], [12, 2, 2], [14, 1, 2], [16, 2, 6], [22, 1, 2], [24, 0, 8]], [[0, 0, 2], [2, 1, 2], [4, 2, 4], [8, 3, 2], [10, 4, 6], [16, 5, 2], [18, 4, 2], [20, 3, 2], [22, 2, 2], [24, 1, 4], [28, 2, 4]], [[0, 7, 4], [4, 6, 2], [6, 5, 2], [8, 4, 6], [14, 5, 2], [16, 4, 2], [18, 3, 2], [20, 2, 4], [24, 1, 2], [26, 2, 2], [28, 0, 4]], [[0, 4, 1], [1, 4, 1], [2, 4, 1], [3, 4, 1], [4, 5, 2], [6, 4, 2], [8, 3, 1], [9, 3, 1], [10, 3, 1], [11, 3, 1], [12, 2, 4], [16, 1, 2], [18, 2, 2], [20, 3, 2], [22, 2, 2], [24, 1, 4], [28, 0, 4]], [[0, 2, 2], [2, 3, 2], [4, 4, 4], [8, 3, 2], [10, 2, 2], [12, 1, 4], [16, 2, 2], [18, 1, 2], [20, 0, 6], [28, 0, 4]], [[0, 4, 6], [6, 3, 2], [8, 4, 2], [10, 5, 2], [12, 4, 4], [16, 3, 2], [18, 2, 2], [20, 1, 2], [22, 2, 2], [24, 0, 8]]];
  SECS = [[0, 4, 1, 0], [2, 3, 4, 5], [1, 0, 3, 4], [5, 2, 4, 0]];
  RIF = [[[0, -7, 1], [2, -7, .6], [3, -3, .7], [4, -7, .9], [6, -7, .6], [7, -3, .7], [8, -7, 1], [10, -6, .7], [11, -7, .6], [12, -7, .9], [14, -3, .7], [15, -5, .6]], [[0, -7, 1], [1, -7, .5], [2, -3, .7], [4, -7, .9], [5, -7, .5], [6, -2, .7], [8, -7, 1], [9, -7, .5], [10, -3, .7], [12, -6, .8], [14, -7, .7]]];
  BPR = [-7, -7, -1, -7, -6, -7, -2, -3];
}

// Makamlar: örnekler Hicaz dizisinde sentezlendi; diğer makamlar derece başına perde kaydırmasıyla çalınır.
export const MAKAM = {
  hicaz: [0, 1, 4, 5, 7, 8, 11, 12],
  huseyni: [0, 2, 3, 5, 7, 9, 10, 12],
  nihavend: [0, 2, 3, 5, 7, 8, 10, 12],
  rast: [0, 2, 4, 5, 7, 9, 10, 12],
  segah: [0, 1, 3, 5, 7, 8, 10, 12]
};
const MAP_MK = { koru: 'hicaz', bozkir: 'rast', mezarlik: 'nihavend' };
// Makamın karakteri yalnız birkaç perdenin yarım ses kayması olunca seçim duyulmuyordu.
// Her makamın kendi karar perdesi (tr, yarım ses), temposu (bpm çarpanı) ve ezgi sırası (mo) var.
const MK_CH = {
  hicaz: { tr: 0, bpm: 1, mo: 0 },
  huseyni: { tr: 2, bpm: .95, mo: 1 },
  nihavend: { tr: -2, bpm: .9, mo: 2 },
  rast: { tr: 3, bpm: 1.07, mo: 3 },
  segah: { tr: -3, bpm: 1.02, mo: 1 }
};
const mkCh = () => MK_CH[curMakam()] || MK_CH.hicaz;

export function curMakam() {
  const k = SET.mk && SET.mk != 'auto' ? SET.mk : MAP_MK[$G.P && $G.P.map] || 'hicaz';
  return MAKAM[k] ? k : 'hicaz';
}

// Örneklerin sentezlendiği dizi (synth.js HZ). MAKAM.hicaz'dan 7. derecede ayrılır (10, 11 değil); kaydırma buna göre hesaplanır.
const SYN_HZ = [0, 1, 4, 5, 7, 8, 10];

function makamRate(n) {
  // örnek adı: çalgı + derece (bag3, ney5, bas-7). Eksi dereceler alt oktavdır ve onlar da makama uyar.
  const m = /^(bag|bas|ney|zur)(-?\d)$/.exec(n);
  if (!m) return 1;
  const d = +m[2],
    mk = curMakam(),
    i = (d % 7 + 7) % 7;
  return Math.pow(2, (MAKAM[mk][i] - SYN_HZ[i] + mkCh().tr) / 12);
}

// Ayarlarda makam seçilince duyulur karşılık: dizinin sekiz perdesi bağlamayla çıkar, neyle karara iner.
export function makamPrev() {
  if (!$G.AC || $G.muted || SET.mus <= 0) return;
  const now = $G.AC.currentTime,
    t = now + .05;
  // önceki önizleme bitmeden yeni makam seçilirse eski notalar susar (yoksa iki dizi üst üste çalar)
  for (const x of MS.pv || []) try {
    x.gn.gain.cancelScheduledValues(now);
    x.gn.gain.setTargetAtTime(0, now, .015);
    x.s.stop(now + .1);
  } catch (e) {}
  MS.pv = [];
  const keep = x => x && MS.pv.push(x);
  for (let d = 0; d <= 7; d++) keep(mp('bag' + d, t + d * .13, .3, { len: .3, rv: .3, pan: -.15 }));
  [7, 4, 2, 0].forEach((d, i) => keep(mp('ney' + d, t + 1.15 + i * .3, .32, { len: i == 3 ? 1.2 : .3, rel: .15, rv: .5, pan: .15 })));
  MS.hold = $G.AC.currentTime + 2.9; // önizleme sürerken eşlik sussun
  MS.sec = null;
}

export function mp(n, t, g, o = {}) {
  const L = AB[n];
  if (!L || !L[0] || !$G.AC) return;
  const b = L[Math.floor(Math.random() * L.length)] || L[0];
  const s = $G.AC.createBufferSource();
  s.buffer = b;
  const mr = makamRate(n);
  if (o.rate || mr != 1) s.playbackRate.value = (o.rate || 1) * mr;
  const gn = $G.AC.createGain();
  gn.gain.value = g;
  s.connect(gn);
  let nd = gn;
  if (o.pan && $G.AC.createStereoPanner) {
    const p = $G.AC.createStereoPanner();
    p.pan.value = o.pan;
    nd.connect(p);
    nd = p;
  }
  nd.connect($G.MUB);
  if (o.rv) {
    const r = $G.AC.createGain();
    r.gain.value = o.rv;
    nd.connect(r);
    r.connect($G.RVM);
  }
  const st = Math.max($G.AC.currentTime, t + (Math.random() - .5) * .008);
  s.start(st);
  if (o.len) {
    gn.gain.setTargetAtTime(0, st + o.len, o.rel || .06);
    s.stop(st + o.len + .5);
  }
  return { s, gn };
}

export function drone(n, on, g) {
  const k = 'dr_' + n;
  let d = MS[k];
  if (!d && on && AB[n]) {
    d = MS[k] = aBed(n, $G.MUB, .5);
  }
  if (d) d.set(on ? g : 0, on ? 1.5 : 2);
}

export function musStep(s, t, I, sl, mode) {
  const b = s % 16,
    bar = Math.floor(s / 16);
  if (b == 0) {
    MS.bar = bar;
    if (bar % 8 == 0) MS.sec = SECS[Math.floor(Math.random() * SECS.length)];
  }
  const mot = MS.sec ? MOT[(MS.sec[Math.floor(bar / 2) % 4] + mkCh().mo) % MOT.length] : MOT[mkCh().mo % MOT.length],
    ms = bar % 2 * 16 + b;
  if (mode == 'menu') {
    if (b == 0 && bar % 2 == 0) mp('davG', t, .32, {
      rv: .4
    });
    if (b == 8 && bar % 4 == 3) mp('zil', t, .12, {
      pan: .3,
      rv: .5
    });
    if ((b == 6 || b == 10) && bar % 2 == 1) mp('dkK', t, .1, {
      pan: -.2,
      rv: .3
    });
    const arp = [[0, -7], [3, -3], [6, 0], [10, -3], [12, 2], [14, 0]];
    for (const [st, d] of arp) if (st == b && (bar % 4 != 3 || st < 8)) mp('bag' + d, t, .13 * (st == 0 ? 1.2 : .85), {
      pan: -.25,
      rv: .35,
      len: sl * 6
    });
    if (bar % 8 >= 4) for (const [st, d, l] of mot) if (st == ms && d >= 0 && d <= 7) mp('ney' + d, t, .3, {
      len: Math.min(1.6, l * sl * 1.6),
      rel: .15,
      rv: .6,
      pan: .15
    });
    return;
  }
  const boss = mode == 'boss';
  // davul
  if (boss) {
    if (b == 0 || b == 8 && bar % 2) mp('kos', t, .42, {
      rv: .3
    });
    if (b == 0 && bar % 8 == 0) mp('cym', t, .22, {
      rv: .4,
      pan: .2
    });
    if ([0, 6, 8, 14].includes(b)) mp('davG', t, .38);
    if (b == 4 || b == 12) mp('davT', t, .38, {
      pan: .15
    });
    if (b % 2 == 1) mp('dkK', t, .12 + .05 * +(b % 4 == 3), {
      pan: -.25
    });
  } else {
    if (I > .45) {
      if (b == 0 || b == 8 || I > .75 && b == 10) mp('davG', t, .42 * (b ? .8 : 1));
      if (b == 4 || b == 12 || I > .7 && b == 14) mp('davT', t, .3, {
        pan: .15
      });
    }
    if (I > .2) {
      if (b == 0 || b == 8) mp('dkD', t, .3, {
        pan: -.15
      });
      if (b == 2 || b == 6 || b == 12) mp('dkT', t, .2, {
        pan: -.2
      });
      if (I > .5 && [3, 5, 10, 11, 14, 15].includes(b)) mp('dkK', t, .1, {
        pan: -.25
      });
    }
  }
  // bas
  if (I > .35 || boss) {
    const r = boss ? -7 : BPR[bar % 8],
      pat = boss ? [0, 6, 8, 14] : [0, 3, 6, 8, 11, 14];
    if (pat.includes(b)) {
      const d = b == 6 ? Math.min(0, r + 7) : b == 14 && !boss ? Math.min(0, r + 4) : r;
      mp('bas' + d, t, .42, {
        len: sl * (b == 6 || b == 14 ? 2 : 3)
      });
    }
  }
  // bağlama tel ritmi
  if (I > .3 && !boss) {
    const R = RIF[Math.floor(bar / 4) % 2];
    for (const [st, d, v] of R) if (st == b) mp('bag' + d, t, .15 * v, {
      pan: -.3,
      len: sl * 2.2
    });
  }
  // ezgi
  if (boss) {
    for (const [st, d, l] of mot) if (st == ms && d >= 0 && d <= 7) mp('zur' + d, t, .2, {
      len: Math.min(1.1, l * sl * .95),
      pan: .1,
      rv: .2
    });
  } else if (I > .55 && bar % 8 >= 2) {
    for (const [st, d, l] of mot) if (st == ms) mp('bag' + Math.min(7, d + (d < 0 ? 0 : 0)), t, .24, {
      len: Math.min(1.3, l * sl * 1.2),
      pan: .25,
      rv: .25
    });
  } else if (I <= .55 && bar % 8 >= 4) {
    for (const [st, d, l] of mot) if (st == ms && d >= 0) mp('ney' + d, t, .26, {
      len: Math.min(1.6, l * sl * 1.3),
      rel: .15,
      rv: .5,
      pan: .2
    });
  }
}

export function musTick(dt, hot) {
  if (!$G.AC) return;
  const pz = /^(pause|choice|item|shop|kazan|trans|ready)$/.test($G.S);
  const mode = $G.S == 'over' ? 'over' : $G.S == 'menu' || $G.S == 'otag' || $G.S == 'set' && (MS.mode == 'menu' || !MS.mode) ? 'menu' : pz || $G.S == 'set' ? MS.mode || 'play' : hot ? 'boss' : 'play';
  const tI = mode == 'play' ? Math.min(.9, .28 + (typeof $G.E != 'undefined' ? $G.E.length : 0) / 70) : mode == 'boss' ? 1 : .2;
  if ($G.S == 'play') MS.I += (tI - MS.I) * Math.min(1, dt * .5);
  if (mode != MS.mode) {
    MS.mode = mode;
    MS.st = Math.ceil(MS.st / 16) * 16;
    MS.sec = null;
    if (mode == 'over') {
      const t = $G.AC.currentTime + .4;
      [[4, 0], [3, .5], [2, .9], [1, 1.3], [0, 1.9]].forEach(([d, o]) => mp('ney' + d, t + o, .3, {
        len: d ? .55 : 1.6,
        rel: .2,
        rv: .7
      }));
    }
  }
  // müzik sıfıra çekildiyse hiç nota planlanmaz
  const live = mode != 'over' && !$G.muted && SET.mus > 0;
  // dronlar da makamın karar perdesine iner çıkar
  const dr = Math.pow(2, mkCh().tr / 12);
  for (const k of ['dr_droneK', 'dr_droneT']) if (MS[k]) for (const x of [MS[k].a, MS[k].b]) x.s.playbackRate.setTargetAtTime(dr, $G.AC.currentTime, .3);
  drone('droneK', live, mode == 'menu' ? .38 : mode == 'boss' ? .12 : .16 * (1 - MS.I * .5));
  drone('droneT', live && (mode == 'menu' || mode == 'boss' || MS.I < .4), mode == 'boss' ? .14 : .11);
  if (!live) return;
  if (MS.hold && $G.AC.currentTime < MS.hold) {
    MS.nx = MS.hold;
    return;
  }
  const bpm = (mode == 'menu' ? 84 : mode == 'boss' ? 122 : 104 + MS.I * 12) * mkCh().bpm,
    sl = 60 / bpm / 4,
    now = $G.AC.currentTime;
  if (MS.nx < now - .25) MS.nx = now + .06;
  while (MS.nx < now + .22) {
    try {
      musStep(MS.st, MS.nx, MS.I, sl, mode);
    } catch (e) {}
    MS.nx += sl;
    MS.st++;
  }
}

export function musStart() {}

// ---- yardımcılar
