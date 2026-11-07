// core/state.js · Kara Koru
// Bu dosya tek dosyalık sürümden (v22) otomatik ayrıldı. Ortak oyun durumu core/store.js içindeki $G nesnesinde.

import { $G } from './store.js';
import { $ } from './util.js';
import { unl } from '../data/content.js';
import { CR, heroOn } from '../game/heroes.js';

export let fmt, OV;

export function __init_40() {
  // ---- durum
  $G.MZ = [];
  $G.KS = [];
  $G.MZC = null;
  $G.S = 'menu';
  $G.P = null;
  $G.H = null;
  $G.E = [];
  $G.B = [];
  $G.EB = [];
  $G.G = [];
  $G.CH = [];
  $G.OB = [];
  $G.NV = [];
  $G.PT = [];
  $G.ZP = [];
  $G.SH = [];
  $G.POT = [];
  $G.FB = [];
  $G.PZ = [];
  $G.PU = [];
  $G.AX = [];
  $G.BO = [];
  $G.SW = [];
  $G.DY = [];
  $G.NP = [];
  $G.FXR = [];
  $G.GATE = null;
  $G.AUm = null;
  $G.ICm = null;
  $G.HS = 0;
  $G.TOR = [];
  $G.SLS = [];
  $G.VXS = [];
  $G.DSRC = null;
  $G.T = 0;
  $G.kills = 0;
  $G.best = 0;
  $G.bestK = 0;
  $G.FRC = 0;
  $G.tutDone = 0;
  $G.yaw = 0;
  $G.pit = .5;
  $G.yawT = 0;
  $G.pitT = .5;
  $G.K = {};
  $G.J = {
    x: 0,
    y: 0
  };
  $G.md = 0;
  $G.spT = 0;
  $G.ph = 0;
  $G.pmx = 0;
  $G.pmz = 0;
  $G.shk = 0;
  $G.FX = 0;
  $G.FY = 3;
  $G.FZ = 0;
  $G.CI = 0;
  $G.CHM = '';
  $G.CHO = [];
  $G.prevS = 'menu';
  $G.shopN = null;
  $G.kz = null;
  try {
    $G.best = +localStorage.getItem('nb_best') || 0;
    $G.bestK = +localStorage.getItem('kk_bestk') || 0;
    $G.tutDone = +localStorage.getItem('kk_tut') || 0;
    $G.CI = Math.min(CR.length - 1, +localStorage.getItem('kk_ci') || 0);
    if (!heroOn($G.CI) || !unl(CR[$G.CI].lock)) $G.CI = 0; // kayıtlı karakter kadrodan çıkarıldıysa ya da kilitliyse Alp
  } catch (e) {}
  fmt = t => Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
  OV = $('ov');
}
