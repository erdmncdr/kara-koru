// data/stats.js · Kara Koru
// Oyuncu stat tanımları. Her stat için ad, gösterim biçimi, taban değer ve varsayılan katman.
//
// Katmanlar: flat (tabana eklenir), pct (toplanır, 1+Σ çarpanı olur), mult (ayrı ayrı çarpılır).
//   sonuç = (taban + Σflat) × (1 + Σpct) × Π(1 + mult_i)
// İçerik tabloları düz anahtar kullanır ({ dmg: .1 } → varsayılan katman). Katman seçmek için
// anahtar sonuna işaret eklenir: 'dmg*' çarpan katmanı, 'hp%' yüzde katmanı, 'hp+' düz katman.
//
// Biçimler: x çarpan (% olarak), p olasılık/oran (%), n düz sayı, i tam sayı, r saniyede, s saniye.
// show: duraklatma ekranında her zaman görünür; cs: eski CS tablosunda yer alır (kart satırları).
const X = (n, b = 1, o = {}) => ({ n, f: 'x', b, l: 'pct', ...o });
const P = (n, b = 0, o = {}) => ({ n, f: 'p', b, l: 'flat', ...o });
const N = (n, b = 0, o = {}) => ({ n, f: 'n', b, l: 'flat', ...o });
const I = (n, b = 0, o = {}) => ({ n, f: 'i', b, l: 'flat', ...o });

export const STATS = {
  // saldırı
  dmg: X('Hasar', 1, { show: 1 }),
  aspd: X('Saldırı hızı', 1, { show: 1 }),
  cnt: I('Ek mermi', 0, { show: 1 }),
  size: X('Saldırı alanı', 1, { show: 1 }),
  crit: P('Kritik şansı', .05, { show: 1 }),
  critd: X('Kritik hasarı', 2),
  dur: X('Süre'),
  pspd: X('Mermi hızı'),
  kb: X('İtme'),
  bounce: I('Sekme'),
  burst: X('Patlama beklemesi'),
  fire: X('Ateş hasarı'),
  ice: X('Buz hasarı'),
  zap: X('Yıldırım hasarı'),
  poison: X('Zehir hasarı'),
  elite: X('Elit ve boss hasarı'),
  burn: P('Yakma şansı'),
  freeze: P('Dondurma şansı'),
  // savunma
  hp: N('Azami can', 120, { show: 1 }),
  regen: { n: 'Can yenilenmesi', f: 'r', b: .4, l: 'flat', show: 1 },
  shield: N('Kalkan'),
  thorns: N('Diken'),
  arm: P('Zırh', 0, { show: 1 }),
  eva: P('Kaçınma', 0, { show: 1 }),
  ls: P('Can çalma', 0, { show: 1 }),
  dmgred: X('Alınan hasar'),
  hurtcd: X('Darbe sonrası koruma'),
  overheal: P('Aşırı can'),
  heal: X('İyileşme'),
  fall: P('Düşme hasarı azaltma'),
  // hareket
  spd: X('Hareket hızı', 1, { show: 1 }),
  jmp: X('Zıplama gücü'),
  air: I('Havada zıplama', 0, { cs: 0 }),
  slam: N('Yere çarpma'),
  // ekonomi ve şans
  mag: X('Toplama alanı', 1, { show: 1 }),
  xp: X('Tecrübe kazancı', 1, { show: 1 }),
  gold: X('Altın kazancı', 1, { show: 1 }),
  silver: X('Gümüş kazancı'),
  luck: P('Şans', 0, { show: 1 }),
  chest: X('Sandık düşme'),
  chestp: X('Sandık fiyatı'),
  shopp: P('Tüccar indirimi'),
  key: P('Bedava sandık şansı'),
  pub: X('Güç etkisi'),
  puc: X('Güç düşme şansı'),
  // dünya
  diff: P('Zorluk'),
  curse: P('Lanet'),
  holy: N('Kutsallık'),
  wick: N('Kötülük'),
  elspawn: X('Elit doğma'),
  enN: X('Düşman sayısı'),
  enSz: X('Düşman boyutu'),
  enSp: X('Düşman hızı'),
  enHp: X('Düşman canı'),
  enDmg: X('Düşman hasarı'),
  enScale: X('Düşman ölçeklenmesi'),
  effdur: X('Etki süresi'),
  evolve: P('Evrim'),
  // Kara Koru'ya özgü
  block: N('Darbe engelleme', 0, { cs: 0 }),
  expl: P('Ölümde patlama', 0, { cs: 0 }),
  revive: I('Diriliş', 0, { cs: 0 }),
};

// Eski tablolarla uyum: BASE taban değerler, CS kart satırı adı ve biçimi.
export const BASE = Object.fromEntries(Object.entries(STATS).map(([k, d]) => [k, d.b]));
export const CS = Object.fromEntries(Object.entries(STATS).filter(([, d]) => /** @type {any} */ (d).cs !== 0).map(([k, d]) => [k, [d.n, d.f]]));

// Bir kaynağın katkılarını katmanlara dağıtır. o: { anahtar: değer }, m: çarpan (seviye vb.)
export function addStats(L, o, m = 1) {
  for (const k0 in o) {
    let k = k0, l = null;
    const c = k0[k0.length - 1];
    if (c == '*') { k = k0.slice(0, -1); l = 'mult'; } else if (c == '%') { k = k0.slice(0, -1); l = 'pct'; } else if (c == '+') { k = k0.slice(0, -1); l = 'flat'; }
    const d = STATS[k];
    if (!d) continue;
    const v = o[k0] * m;
    if (!(l || d.l) || (l || d.l) == 'flat') L.flat[k] = (L.flat[k] || 0) + v;
    else if ((l || d.l) == 'pct') L.pct[k] = (L.pct[k] || 0) + v;
    else L.mult[k] = (L.mult[k] || 1) * (1 + v);
  }
}

export function newLayers() {
  return { flat: {}, pct: {}, mult: {} };
}

// Katmanları tek değere indirger.
export function resolveStats(L) {
  const c = {};
  for (const k in STATS) {
    const d = STATS[k];
    c[k] = (d.b + (L.flat[k] || 0)) * (1 + (L.pct[k] || 0)) * (L.mult[k] || 1);
  }
  return c;
}

// Aşırı kritik: şans %100'ü aşınca her tam kat ek kritik sayılır.
// 1 kritik → critd (taban 2x); n ≥ 2 → ((n/2)² + n + 1) × critd/2. Dönüş: çarpan (1 = kritik yok).
export function critMul(C, r = Math.random()) {
  const ch = C.crit || 0,
    n = Math.floor(ch) + (r < ch - Math.floor(ch) ? 1 : 0);
  if (n <= 0) return 1;
  const cd = C.critd || 2;
  return n == 1 ? cd : ((n / 2) ** 2 + n + 1) * cd / 2;
}
