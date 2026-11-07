// game/challenge.js · Kara Koru
// Meydan okuma uygulaması. Seçim $G.MSEL.chal, koşuda P.chal (CHAL kaydı). Stat katmanları calc'a
// (chalStats), bayraklar ilgili yerlere (chalFlag). Tamamlama: winRun → META.chal["k:map:tier"].

import { $G } from '../core/store.js';
import { addStats } from '../data/stats.js';
import { CHAL } from '../data/challenges.js';

export function chalOf(k) {
  return CHAL.find(c => c.k == k) || null;
}

export function chalKey(c, map, tier) {
  return c.k + ':' + map + ':' + tier;
}

export function chalDone(c, map, tier) {
  return !!$G.META.chal[chalKey(c, map, tier)];
}

export function chalCount() {
  return Object.keys($G.META.chal).length;
}

// koşu başında
export function chalApply(P) {
  const c = chalOf($G.MSEL.chal);
  P.chal = c;
  if (!c) return;
  const f = /** @type {any} */ (c.fl || {});
  if (f.ws) P.ws = Math.min(P.ws, f.ws);
  if (f.ts) P.ts = Math.min(P.ts, f.ts);
  if (f.greed) P.greed += f.greed;
  if (f.stl) P.stl = f.stl;
  if (f.curse10) P.T.push({ k: 'curse', lv: 10, v: .035 * 10 });
}

export function chalStats(L) {
  const c = $G.P && $G.P.chal;
  if (c && c.st) addStats(L, c.st);
}

export function chalFlag(k) {
  const c = $G.P && $G.P.chal;
  return c && c.fl ? c.fl[k] : undefined;
}

// kalıcı gümüş bonusu: tamamlanan her meydan okuma +%1
export function chalSilver() {
  return 1 + .01 * chalCount();
}
