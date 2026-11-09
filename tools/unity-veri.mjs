// Unity için oyun verisi: data/ ve game/ altındaki içerik tablolarını (statlar, silahlar, kitaplar, eşyalar, kahramanlar,
// düşmanlar, nadirlikler, seviye eğrisi) tarayıcıda içe aktarıp tek JSON'a yazar. İşlevler atlanır; davranış C#'ta.
// node tools/unity-veri.mjs <oyun url> <çıktı.json>
import { chromium } from 'playwright';
import fs from 'node:fs';
const [url, out] = process.argv.slice(2);
const br = await chromium.launch({ executablePath: process.env.CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await br.newPage({ viewport: { width: 640, height: 360 } });
await pg.addInitScript(() => { Element.prototype.requestPointerLock = function () {}; localStorage.setItem('kk_tut', '1'); });
await pg.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
await pg.waitForFunction(() => typeof S !== 'undefined' && S === 'menu', null, { timeout: 90000 });
const res = await pg.evaluate(async () => {
  const C = await import('/src/data/content.js'), ST = await import('/src/data/stats.js'), EN = await import('/src/data/enemies.js');
  const HE = await import('/src/game/heroes.js'), CA = await import('/src/ui/cards.js'), SS = await import('/src/game/stats.js');
  let IT = {}; try { IT = await import('/src/data/items.js'); } catch (e) {}
  const temiz = v => JSON.parse(JSON.stringify(v, (k, x) => typeof x == 'function' ? undefined : x instanceof Set ? [...x] : x));
  const o = {
    STATS: temiz(ST.STATS), WD: temiz(C.WD), TDF: temiz(C.TDF), ITD: temiz(C.ITD || IT.ITD || {}), TY: temiz(C.TY),
    KINDS: temiz(EN.KINDS), ROSTER: temiz(EN.ROSTER), CR: temiz(HE.CR), STI: temiz(CA.STI || {}),
    RAR: temiz(C.RAR || CA.RAR || []), STL: temiz(C.STL || {}),
    need: Array.from({ length: 100 }, (_, i) => SS.need(i + 1)),
  };
  return o;
});
fs.writeFileSync(out, JSON.stringify(res));
console.log(Object.entries(res).map(([k, v]) => k + ':' + (Array.isArray(v) ? v.length : Object.keys(v).length)).join(' '), (fs.statSync(out).size / 1024).toFixed(0) + ' KB');
await br.close();
