// GLB modelini düz ışıkta, dört açıdan ve yüze yakın çeker (oyundan bağımsız; modelin kendisini görmek için).
// node tools/model-bak.mjs <model.glb> <çıkış.png> [animasyonlu: 0/1]   (CHROME ortam değişkeni Chrome yolunu verir)
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
const [src, out, klipDosya] = process.argv.slice(2);
const br = await chromium.launch({ executablePath: process.env.CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await br.newPage({ viewport: { width: 1600, height: 820 } });
const kok = path.resolve('node_modules/three');
await pg.route('**/three/**', r => { const u = new URL(r.request().url()); return r.fulfill({ path: path.join(kok, u.pathname.replace(/^\/three\//, '')), contentType: 'text/javascript' }); });
await pg.route('**/model.glb', r => r.fulfill({ path: path.resolve(src), contentType: 'model/gltf-binary' }));
if (klipDosya) await pg.route('**/klip.glb', r => r.fulfill({ path: path.resolve(klipDosya), contentType: 'model/gltf-binary' }));
await pg.route('http://x/', r => r.fulfill({ contentType: 'text/html', body: `<!doctype html><body style="margin:0;background:#6d7f8c">
<script type="importmap">{"imports":{"three":"/three/build/three.module.js","three/addons/":"/three/examples/jsm/"}}</script>
<script type="module">
import * as T from 'three'; import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
const R = new T.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); R.setSize(1600, 820); R.outputColorSpace = T.SRGBColorSpace; document.body.appendChild(R.domElement);
R.setScissorTest(true);
const g = await new GLTFLoader().loadAsync('/model.glb'); const m = g.scene;
const sc = new T.Scene(); sc.add(m); sc.add(new T.HemisphereLight(0xffffff, 0x8a7a6a, 1.6)); const d = new T.DirectionalLight(0xffffff, 1.6); d.position.set(2, 4, 3); sc.add(d);
const b = new T.Box3().setFromObject(m), c = b.getCenter(new T.Vector3()), h = b.max.y - b.min.y, c0 = c.clone();
const vs = [[0, 'ön'], [Math.PI / 2, 'yan'], [Math.PI, 'arka'], [-Math.PI / 4, 'çapraz']];
const KL = ${klipDosya ? 1 : 0};
if (KL) {
  // klip anları: her biri ayrı karede, çapraz açıdan
  const kg = await new GLTFLoader().loadAsync('/klip.glb'), mx = new T.AnimationMixer(m), an = [];
  for (const c of kg.animations) for (const f of [.3, .6]) an.push([c, c.duration * f]);
  const W = 1600 / Math.min(8, an.length), Hh = 410;
  an.slice(0, 16).forEach(([c, t], i) => {
    mx.stopAllAction(); const a = mx.clipAction(c); a.play(); a.time = t; mx.update(0); m.updateMatrixWorld(true);
    const cam = new T.PerspectiveCamera(30, W / Hh, .01, 100), aa = -Math.PI / 5; cam.position.set(c0.x + Math.sin(aa) * h * 2.3, c0.y, c0.z + Math.cos(aa) * h * 2.3); cam.lookAt(c0);
    const x = (i % 8) * W, y = i < 8 ? Hh : 0; R.setViewport(x, y, W, Hh); R.setScissor(x, y, W, Hh); R.render(sc, cam);
  });
  window.bilgi = { klip: kg.animations.map(a => a.name) }; window.hazir = 1;
} else {
vs.forEach(([a], i) => { const cam = new T.PerspectiveCamera(30, 320 / 820, .01, 100); cam.position.set(c.x + Math.sin(a) * h * 2.1, c.y, c.z + Math.cos(a) * h * 2.1); cam.lookAt(c); R.setViewport(i * 320, 0, 320, 820); R.setScissor(i * 320, 0, 320, 820); R.render(sc, cam); });
const EL_YAKIN = ${process.env.EL ? 1 : 0};
const cam = new T.PerspectiveCamera(30, 1, .01, 100), hy = EL_YAKIN ? b.min.y + h * .45 : b.max.y - h * .14; const ex = EL_YAKIN ? b.min.x + (b.max.x - b.min.x) * .1 : c.x; cam.position.set(ex + h * .05, hy, c.z + h * (EL_YAKIN ? .35 : .75)); cam.lookAt(ex, hy, c.z);
R.setViewport(1280, 410, 320, 410); R.setScissor(1280, 410, 320, 410); cam.aspect = 320 / 410; cam.updateProjectionMatrix(); R.render(sc, cam);
const cam2 = new T.PerspectiveCamera(30, 320 / 410, .01, 100), gy = EL_YAKIN ? b.min.y + h * .45 : c.y + h * .1, ex2 = EL_YAKIN ? b.max.x - (b.max.x - b.min.x) * .1 : c.x; cam2.position.set(ex2 - h * .05, gy, c.z + h * (EL_YAKIN ? .35 : .9)); cam2.lookAt(ex2, gy, c.z);
R.setViewport(1280, 0, 320, 410); R.setScissor(1280, 0, 320, 410); R.render(sc, cam2);
let tri = 0; m.traverse(o => { if (o.isMesh) tri += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; });
const tx = []; m.traverse(o => { if (o.isMesh && o.material.map) tx.push(o.material.map.image.width + 'x' + o.material.map.image.height); });
window.bilgi = { tri, tx, boy: h.toFixed(3) }; window.hazir = 1;
}
</script></body>` }));
await pg.goto('http://x/');
await pg.waitForFunction(() => window.hazir, null, { timeout: 60000 });
console.log(JSON.stringify(await pg.evaluate(() => window.bilgi)));
await pg.screenshot({ path: out });
await br.close();
