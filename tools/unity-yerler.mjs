// Unity için ortam verisi: adlı yerler (LMS: kule, tapınak, kamp...), ateşler (FIRES), kuşlar (BIRDS), yuvarlanan çalılar (TUMB).
// Dünya dışa aktarımıyla aynı tohum düzeninde oyunu açar ve bu listeleri var olan dünya verisi JSON'una ekler (GLB yeniden üretilmez). Yeni aktarımlarda unity-dunya.mjs
// bu alanı kendisi yazar. Dünya aynı mı diye engel sayısı JSON ile karşılaştırılır; tutmazsa dosyaya dokunulmaz.
// node tools/unity-yerler.mjs <oyun url> <json yolu> [aşama=0] [tohum=1]
import { chromium } from 'playwright';
import fs from 'node:fs';
const [url, yol, bi = '0', tohum = '1'] = process.argv.slice(2);
const br = await chromium.launch({ executablePath: process.env.CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await br.newPage({ viewport: { width: 960, height: 540 } });
await pg.addInitScript(t => {
  Element.prototype.requestPointerLock = function () {};
  localStorage.setItem('kk_tut', '1'); localStorage.setItem('kk_ci', '0');
  let s = t >>> 0; Math.random = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 };
  window.__tohum = v => { s = v >>> 0; };
}, +tohum);
await pg.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
await pg.waitForFunction(() => typeof S !== 'undefined' && S === 'menu', null, { timeout: 90000 });
await pg.evaluate(async ([b, t]) => { window.__tohum(t); start(); P.inv = 1e9 }, [+bi, +tohum]);
await pg.waitForFunction(() => S === 'ready' || S === 'play', null, { timeout: 60000 });
if (+bi > 0) await pg.evaluate(async ([n, t]) => { const { $G } = await import('/src/core/store.js'); const O = await import('/src/game/objects.js'); window.__tohum(t); $G.P.stage = n; $G.P.map = ['koru', 'bozkir', 'mezarlik'][n]; $G.P.stT = 0; O.setupStage(); }, [+bi, +tohum]);
await new Promise(r => setTimeout(r, 3000));
const r = await pg.evaluate(async () => {
  const { $G } = await import('/src/core/store.js');
  return {
    n: ($G.OBS || []).length,
    LMS: ($G.LMS || []).map(l => ({ n: l.n, t: l.t, x: l.x, z: l.z, r: l.r })),
    // ateşler (build.js mkHearth): k 0 kamp ateşi, 1 küçük ocak, 2 ruh ateşi (turkuaz), 3 meşale
    FIRES: ($G.FIRES || []).map(f => ({ x: f.x, y: f.y, z: f.z, k: f.k })),
    // kuşlar (mkBirds): daire merkezi, yükseklik, yarıçap, açı, hız, evre; GLB'deki sırayla
    BIRDS: ($G.BIRDS || []).map(b => ({ cx: b.cx, cz: b.cz, h: b.h, R: b.R, a: b.a, s: b.s, ph: b.ph })),
    TUMB: ($G.TUMB || []).map(t => t.s),
    // platformlar alt sınırıyla (bot): duvar koşusu ve katı sorgusu için
    PL: (() => { const st = new Set(); for (const a of $G.PG.values()) for (const p of a) st.add(p); return [...st].map(p => ({ x0: p.x0, x1: p.x1, z0: p.z0, z1: p.z1, top: p.top, bot: p.bot == null ? -1e9 : p.bot })); })()
  };
});
await br.close();
const d = JSON.parse(fs.readFileSync(yol, 'utf8'));
if (d.OBS.length != r.n) { console.log('dünya tutmuyor: json', d.OBS.length, 'oyun', r.n); process.exit(1); }
d.LMS = r.LMS; d.FIRES = r.FIRES; d.BIRDS = r.BIRDS; d.TUMB = r.TUMB; if (r.PL.length == d.PL.length) d.PL = r.PL; else console.log('platform sayısı tutmuyor', d.PL.length, r.PL.length);
fs.writeFileSync(yol, JSON.stringify(d));
console.log('yazıldı', yol, 'yer', r.LMS.length, 'ateş', r.FIRES.length, '(tür ' + [...new Set(r.FIRES.map(f => f.k))].join(',') + ')', 'kuş', r.BIRDS.length, 'çalı', r.TUMB.length, 'platform', r.PL.length, 'altı belli', r.PL.filter(p => p.bot > -1e8).length);
