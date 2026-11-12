// Her menü ekranını birkaç ekran boyutunda açar; kaydırma gerektiren (içeriği taşan) öğeleri ve ekrandan taşan sayfayı raporlar.
// node tools/tasma-olc.mjs <url> <klasör>   (CHROME ortam değişkeni Chrome yolunu verir; test derlemesi: VITE_KOPRU=1)
// Çıktı: ekran başına bir satır; "TAŞIYOR" satırları düzeltilmesi gerekenler. "küçültme": panel ekrana sığsın diye uygulanan oran, "sayfa": sayfa sayısı. Klasöre her ekranın görüntüsü yazılır.
import { chromium } from 'playwright';
import fs from 'node:fs';
const [url, out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const BOY = (process.env.BOY || '1280x720,1920x1080,844x390,390x844').split(',').map(s => s.split('x').map(Number));
const EKRAN = [
  ['ana', () => menuPage('ana')], ['kahraman', () => { menuPage('kahraman'); selC(8, 1); }], ['harita', () => menuPage('harita')], ['meydan', () => menuPage('meydan')],
  ['otag_guc', () => otag('guc')], ['otag_kilit', () => otag('kilit')], ['otag_gorev', () => otag('gorev')], ['otag_koleksiyon', () => otag('koleksiyon')], ['otag_havuz', () => otag('havuz')],
  ['ayar_oyun', () => { settings(); setTab('oyun'); }], ['ayar_goruntu', () => setTab('goruntu')], ['ayar_ses', () => setTab('ses')], ['ayar_kontrol', () => setTab('kontrol')],
  ['yardim', () => { closeSet(); showHelp(); }], ['siralama', () => { closeHelp(); lbOpen(); }],
  // dolu sıralama: 40 sahte ortak satır ve 10 yerel rekor (yalnız bu sayfada, hiçbir yere yazılmaz)
  ['siralama_dolu', () => { const now = Date.now(); for (let i = 0; i < 10; i++) LB.push({ k: 900 - i * 37, c: i % 3, d: now - i * 864e5, m: 'koru', t: 1, w: i % 2 }); GL.db = {}; GL.ok = 1; GL.kind = 'claude'; GL.me = 'u7'; const R = []; for (let i = 0; i < 40; i++) R.push({ id: 'u' + i, ad: 'Savaşçı ' + (i + 1), k: 5000 - i * 111, c: i % 3, s: 600, t: 1, at: now - i * 1e6, ch: {} }); GL.rows = R; GL.tot = 40; GL.mine = R[7]; GL.prev = []; lbRender(); }],
  ['duraklat', () => { menu(); start(); P.inv = 1e9; pause(); }], ['seviye', () => { resume(); choose('level', luOpts()); }], // dolu koşu sonu: sekiz silahın hasarı, on tamamlanan görev, açılanlar
  ['bitti_dolu', () => { P.wdmg = {}; Object.keys(WD).slice(0, 8).forEach((k, i) => (P.wdmg[k] = 90000 / (i + 1))); P.qDone = QD.slice(0, 10); kills = 4321; P.tt = 900; over(0); }],
  ['bitti_olum', () => over(0)], ['bitti_zafer', () => { menu(); start(); over(1); }]
];
const br = await chromium.launch({ executablePath: process.env.CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
let kotu = 0;
for (const [w, h] of BOY) {
  const pg = await br.newPage({ viewport: { width: w, height: h }, hasTouch: w < 900, isMobile: w < 900 });
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.addInitScript(() => { Element.prototype.requestPointerLock = function () {}; localStorage.setItem('kk_tut', '1'); localStorage.setItem('kk_set', JSON.stringify({ q: 0, bl: 0 })); });
  await pg.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await pg.waitForFunction(() => typeof S !== 'undefined' && S === 'menu' && !!window.MSEL, null, { timeout: 90000 });
  await sleep(800);
  // dolu kayıt: en uzun listeler çıksın (bütün kilitler açık, görevlerin yarısı bitmiş, eşyalar görülmüş)
  await pg.evaluate(() => { META.s = 9999; for (const c of CR) if (c.lock) META.l[c.lock] = 1; for (const u of ML) META.l[u.k] = 1; QD.forEach((q, i) => { if (i % 2) META.q[q.k] = 1; }); for (const u of MU) META.u[u.k] = u.m; for (const a of ACHM.concat(ACHD)) META.achv[a.k] = Date.now(); });
  for (const [ad, f] of EKRAN) {
    let hata = '';
    try { await pg.evaluate(f); } catch (e) { hata = String(e.message).split('\n')[0]; }
    await sleep(500);
    const r = await pg.evaluate(() => {
      const O = document.getElementById('ov'), vis = e => { const q = e.getBoundingClientRect(); return q.width > 0 && q.height > 0; }, ad = e => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (e.className && typeof e.className == 'string' ? '.' + e.className.trim().split(/\s+/).join('.') : '');
      const kay = [], tas = [];
      for (const e of [O, ...O.querySelectorAll('*')]) {
        if (!vis(e)) continue;
        const cs = getComputedStyle(e), dy = e.scrollHeight - e.clientHeight, dx = e.scrollWidth - e.clientWidth;
        if (/(auto|scroll)/.test(cs.overflowY) && dy > 1) kay.push(ad(e) + ' ↕' + dy);
        if (/(auto|scroll)/.test(cs.overflowX) && dx > 1) kay.push(ad(e) + ' ↔' + dx);
      }
      // kaydırma kapalıyken ekranın dışında kalan (kırpılan) içerik: katmanın doğrudan içindeki panelin alt ve sağ kenarı (giriş animasyonunun kaydırması düşülür)
      for (const e of O.children) { const q0 = e.getBoundingClientRect(), ky = new DOMMatrixReadOnly(getComputedStyle(e).transform).m42 * (parseFloat(e.style.zoom) || 1), q = { height: q0.height, bottom: q0.bottom - ky, top: q0.top - ky, right: q0.right }; if (q.height && (q.bottom > innerHeight + 1 || q.right > innerWidth + 1 || q.top < -1)) tas.push(ad(e) + ` alt ${Math.round(q.bottom - innerHeight)} sağ ${Math.round(q.right - innerWidth)} üst ${Math.round(q.top)}`); }
      // ekranın dışına taşan herhangi bir görünür öğe (kırpılmış içerik): ilk üçü
      let nd = 0;
      for (const e of O.querySelectorAll('*')) { if (nd >= 3) break; if (!vis(e) || e.closest('#tip,#tt')) continue; const q = e.getBoundingClientRect(), ky = (() => { let y = 0; for (let x = e; x && x != O; x = x.parentElement) { const t = getComputedStyle(x).transform; if (t && t != 'none') y += new DOMMatrixReadOnly(t).m42 * (parseFloat(x.style.zoom) || 1); } return y; })(); if (q.bottom - ky > innerHeight + 2 || q.right > innerWidth + 2 || q.left < -2 || q.top - ky < -2) { tas.push('öğe ' + ad(e).slice(0, 40) + ` alt ${Math.round(q.bottom - ky - innerHeight)} sağ ${Math.round(q.right - innerWidth)}`); nd++; } }
      return { kay, tas, S: typeof S !== 'undefined' ? S : '', z: [...O.children].map(e => e.style.zoom).filter(Boolean).map(x => (+x).toFixed(2)).join(','), sy: [...O.querySelectorAll('[data-sy]')].map(k => k._sy ? k._sy.n : '?').join(',') };
    });
    const sorun = r.kay.length || r.tas.length || hata;
    if (sorun) kotu++;
    console.log(`${w}x${h} ${ad.padEnd(16)} ${sorun ? 'TAŞIYOR' : 'tamam  '} ${r.z ? 'küçültme ' + r.z + ' ' : ''}${r.sy ? 'sayfa ' + r.sy + ' ' : ''}${r.kay.join(' | ')}${r.tas.length ? ' || dışarıda: ' + r.tas.join(' | ') : ''}${hata ? ' || hata: ' + hata : ''}`);
    await pg.screenshot({ path: `${out}/${w}x${h}_${ad}.png` });
  }
  if (errs.length) console.log(`${w}x${h} sayfa hataları:`, [...new Set(errs)].join(' ; ').slice(0, 400));
  await pg.close();
}
await br.close();
console.log(kotu ? `${kotu} ekran taşıyor` : 'Hiçbir ekran taşmıyor');
process.exit(kotu ? 1 : 0);
