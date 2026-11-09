// Unity için kahraman dışa aktarımı: Alp dışındaki kahramanların web'de koddan kurulan kemikli modelleri (heroes.js hero:
// MODELS.hero + aksesuarlar) SkinnedMesh olarak GLB'ye; iskelet bilgisi (kemik adları, yürüyüş ölçüleri gait, kalça yüksekliği,
// bacaklar, gözler, ölçek) JSON'a. Hareketler Unity'de geo/anim.js ANIM.hero çevirisiyle oynar.
// node tools/unity-kahraman.mjs <oyun url> <çıktı klasörü> [anahtarlar]
import { chromium } from 'playwright';
import fs from 'node:fs';
const [url, out, sec = ''] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const br = await chromium.launch({ executablePath: process.env.CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await br.newPage({ viewport: { width: 640, height: 360 } });
const errs = []; pg.on('pageerror', e => errs.push(e.message));
await pg.addInitScript(() => { Element.prototype.requestPointerLock = function () {}; localStorage.setItem('kk_tut', '1'); localStorage.setItem('kk_ci', '0'); localStorage.setItem('kk_meshy', '0'); localStorage.setItem('kk_set', JSON.stringify({ q: 2 })); });
await pg.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
await pg.waitForFunction(() => typeof S !== 'undefined' && S === 'menu', null, { timeout: 90000 });
const res = await pg.evaluate(async sec => {
  const { GLTFExporter } = await import('/@id/three/examples/jsm/exporters/GLTFExporter.js');
  const H = await import('/src/game/heroes.js'), R = await import('/src/engine/renderer.js'), A = await import('/src/geo/accessories.js'), M = await import('/src/geo/models.js');
  const CT = await import('/src/data/content.js');
  const CR = H.CR, out = {};
  for (let ci = 0; ci < CR.length; ci++) {
    const k = CR[ci].k; if (sec ? !sec.split(',').includes(k) : k == 'alp') continue;
    const d = R.skData('h' + ci, () => M.MODELS.hero(k), 1);
    const u = R.skInst(d, 0);
    if (A.ACC.hero[k]) A.attachAcc(u, d.bones, A.ACC.hero[k], 1);
    u.m.material = u.m.material.clone(); u.m.material.name = 'kk_yaratik';
    u.g.name = k;
    const glb = await new GLTFExporter().parseAsync(u.g, { binary: true });
    const a = new Uint8Array(glb); let s = '';
    for (let i = 0; i < a.length; i += 8192) s += String.fromCharCode.apply(null, a.subarray(i, i + 8192));
    const inf = JSON.parse(JSON.stringify(d.info || {}));
    if (inf.gait && Array.isArray(inf.gait.el)) { inf.gait.el0 = inf.gait.el[0]; inf.gait.el1 = inf.gait.el[1]; delete inf.gait.el; }
    out[k] = { b64: btoa(s), rig: { k, n: CR[ci].n, sc: CR[ci].sc || 1, names: u.names, info: inf, bones: d.bones.map(x => ({ n: x.n, pi: x.pi, h: x.h })), eyes: d.eyes.map(e => ({ bone: e.bone, p: e.p, r: e.r, sq: e.sq || 1, c: e.c, glow: e.glow || 0 })) } };
  }
  return out;
}, sec);
for (const [k, v] of Object.entries(res)) {
  fs.writeFileSync(`${out}/kahraman_${k}.glb`, Buffer.from(v.b64, 'base64'));
  fs.writeFileSync(`${out}/kahraman_${k}.json`, JSON.stringify(v.rig));
  console.log(k, (v.b64.length * .75 / 1024).toFixed(0) + ' KB', 'kemik', v.rig.bones.length, 'gait', JSON.stringify(v.rig.info.gait || {}).slice(0, 80));
}
console.log('hata:', errs.length ? errs.slice(0, 3) : 'yok');
await br.close();
