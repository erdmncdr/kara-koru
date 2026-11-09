// Unity için silah modelleri: engine/renderer.js GW (balta, bumerang, kılıç) GLB'ye.
// node tools/unity-silah-model.mjs <oyun url> <çıktı klasörü>
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
  const R = await import('/src/engine/renderer.js'), THREE = await import('/@id/three');
  const o = {};
  for (const k of ['axe', 'boom', 'sword']) {
    const g = R.GW[k]();
    const mat = new THREE.MeshStandardMaterial({ vertexColors: !!g.attributes.color, color: 0xffffff }); mat.name = 'kk_duz';
    const b = new Uint8Array(await new GLTFExporter().parseAsync(new THREE.Mesh(g, mat), { binary: true })); let s = '';
    for (let i = 0; i < b.length; i += 8192) s += String.fromCharCode.apply(null, b.subarray(i, i + 8192));
    g.computeBoundingBox(); o[k] = { b64: btoa(s), size: g.boundingBox.min.toArray().map((v, i) => +v.toFixed(2)) + ' .. ' + g.boundingBox.max.toArray().map(v => +v.toFixed(2)) };
  }
  return o;
});
for (const [k, v] of Object.entries(r)) { fs.writeFileSync(`${out}/silah_${k}.glb`, Buffer.from(v.b64, 'base64')); console.log(k, v.size); }
await br.close();
