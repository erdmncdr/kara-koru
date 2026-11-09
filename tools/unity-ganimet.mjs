// Unity için ganimet modelleri: engine/vfx.js XP kristali, altın, kalp geometrileri (tek renk malzemeyle) GLB.
// node tools/unity-ganimet.mjs <oyun url> <çıktı klasörü>
import { chromium } from 'playwright';
import fs from 'node:fs';
const [url, out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const br = await chromium.launch({ executablePath: process.env.CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await br.newPage();
await pg.addInitScript(() => { Element.prototype.requestPointerLock = function () {}; localStorage.setItem('kk_tut', '1'); });
await pg.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
await pg.waitForFunction(() => typeof S !== 'undefined' && S === 'menu', null, { timeout: 90000 });
const r = await pg.evaluate(async () => {
  const { GLTFExporter } = await import('/@id/three/examples/jsm/exporters/GLTFExporter.js');
  const V = await import('/src/engine/vfx.js'), THREE = await import('/@id/three');
  const o = {};
  for (const [k, g, c] of [['xp', V.gXp, 0x3fd6c0], ['altin', V.gCoin, 0xe2b04a], ['kalp', V.gHeart, 0xe04848]]) {
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: c })); m.material.name = 'kk_ganimet_' + k;
    const b = new Uint8Array(await new GLTFExporter().parseAsync(m, { binary: true })); let s = '';
    for (let i = 0; i < b.length; i += 8192) s += String.fromCharCode.apply(null, b.subarray(i, i + 8192));
    g.computeBoundingBox(); o[k] = { b64: btoa(s), size: g.boundingBox.max.toArray().map((v, i) => +(v - g.boundingBox.min.toArray()[i]).toFixed(2)) };
  }
  return o;
});
for (const [k, v] of Object.entries(r)) { fs.writeFileSync(`${out}/ganimet_${k}.glb`, Buffer.from(v.b64, 'base64')); console.log(k, v.size.join('×')); }
await br.close();
