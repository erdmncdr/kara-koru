// Oyunun düşman iskeletlerini döker (tools/dusman-aktar.mjs girdisi): tip başına kemik adları, ebeveynleri, dinlenme konumları ve gövde boyu.
// node tools/dusman-iskelet.mjs <url> <çıkış klasörü>   (CHROME; test derlemesi VITE_KOPRU=1, adreste ?eski: kodla kurulan gövdeler)
import { chromium } from 'playwright';
import fs from 'node:fs';
const [url, out] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true });
const br = await chromium.launch({ executablePath: process.env.CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await br.newPage({ viewport: { width: 1280, height: 720 } });
await pg.addInitScript(() => { Element.prototype.requestPointerLock = function () {}; localStorage.setItem('kk_tut', '1'); });
await pg.goto(url, { waitUntil: 'domcontentloaded' });
await pg.waitForFunction(() => typeof S !== 'undefined' && S === 'menu' && !!window.MSEL, null, { timeout: 90000 });
await pg.evaluate(() => { start(); P.inv = 1e9; P.need = 1e12; });
await new Promise(r => setTimeout(r, 3000));
const r = await pg.evaluate(() => { const r = {}; for (const t of [0, 2, 4, 5]) { spawn(t, { x: P.x + 20, z: P.z + 20 }); const d = E[E.length - 1].u.d; d.g.computeBoundingBox(); const b = d.g.boundingBox; r[t] = { boy: +(b.max.y - b.min.y).toFixed(3), ucgen: d.g.index.count / 3, kemik: d.bones.map(x => ({ n: x.n, pi: x.pi, h: x.h.map(v => +v.toFixed(4)) })) }; } return r; });
for (const [t, v] of Object.entries(r)) { fs.writeFileSync(`${out}/e${t}.json`, JSON.stringify(v)); console.log('e' + t, 'boy', v.boy, 'üçgen', v.ucgen, 'kemik', v.kemik.length); }
await br.close();
