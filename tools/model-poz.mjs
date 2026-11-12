// İskeletli GLB'yi bir klibin anlarında yakından çeker: üst sıra önden çapraz, alt sıra arkadan çapraz. Kamera kemiklerin
// o andaki konumuna göre çerçevelenir (Meshy iskeletinde kök ölçeği farklı olduğu için kutu ölçüsüne güvenilmez).
// node tools/model-poz.mjs <model.glb> <klip.glb> <çıkış.png> [anlar=0.1,0.35,0.6,0.85] [klip adı]   (CHROME ortam değişkeni Chrome yolunu verir)
// ACILAR=90,0 üst ve alt sıranın kamera açısı (derece; 0 önden, 90 yandan). Klip adı verilmezse dosyadaki ilk klip. Başka bir modelin klibi de denenebilir (Meshy iskeletlerinde kemik adları ortak).
import { chromium } from 'playwright';
import path from 'node:path';
const [src, klip, out, anlar = '0.1,0.35,0.6,0.85', klipAd = ''] = process.argv.slice(2);
const br = await chromium.launch({ executablePath: process.env.CHROME, headless: true, args: ['--use-angle=metal', '--ignore-gpu-blocklist'] });
const pg = await br.newPage({ viewport: { width: 1600, height: 1000 } });
const kok = path.resolve('node_modules/three');
await pg.route('**/three/**', r => { const u = new URL(r.request().url()); return r.fulfill({ path: path.join(kok, u.pathname.replace(/^\/three\//, '')), contentType: 'text/javascript' }); });
await pg.route('**/model.glb', r => r.fulfill({ path: path.resolve(src), contentType: 'model/gltf-binary' }));
await pg.route('**/klip.glb', r => r.fulfill({ path: path.resolve(klip), contentType: 'model/gltf-binary' }));
await pg.route('http://x/', r => r.fulfill({ contentType: 'text/html', body: `<!doctype html><body style="margin:0;background:#6d7f8c">
<script type="importmap">{"imports":{"three":"/three/build/three.module.js","three/addons/":"/three/examples/jsm/"}}</script>
<script type="module">
import * as T from 'three'; import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
const AN = [${anlar}], ACI = ${JSON.stringify((process.env.ACILAR || '-36,144').split(',').map((a, i) => [a * Math.PI / 180, i ? 0 : 500]))};
const R = new T.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); R.setSize(1600, 1000); R.outputColorSpace = T.SRGBColorSpace; R.setClearColor(0x6d7f8c); document.body.appendChild(R.domElement); R.setScissorTest(true);
const g = await new GLTFLoader().loadAsync('/model.glb'), m = g.scene, kg = await new GLTFLoader().loadAsync('/klip.glb');
const sc = new T.Scene(); sc.add(m); sc.add(new T.HemisphereLight(0xffffff, 0x8a7a6a, 1.7)); const d = new T.DirectionalLight(0xffffff, 1.5); d.position.set(2, 4, 3); sc.add(d);
m.traverse(o => { if (o.isSkinnedMesh) o.frustumCulled = false; });
const kemik = []; m.traverse(o => { if (o.isBone) kemik.push(o); });
const mx = new T.AnimationMixer(m), c = kg.animations.find(x => x.name == ${JSON.stringify(klipAd)}) || kg.animations[0], a = mx.clipAction(c); a.play();
const W = 1600 / AN.length, v = new T.Vector3();
AN.forEach((f, i) => {
  a.time = c.duration * f; mx.update(0); m.updateMatrixWorld(true);
  const b = new T.Box3(); for (const k of kemik) b.expandByPoint(k.getWorldPosition(v));
  const o = b.getCenter(new T.Vector3()), h = Math.max(b.max.y - b.min.y, .001) * 1.25;
  ACI.forEach(([aci, y]) => {
    const cam = new T.PerspectiveCamera(30, W / 500, h * .01, h * 50); cam.position.set(o.x + Math.sin(aci) * h * 2.5, o.y + h * .1, o.z + Math.cos(aci) * h * 2.5); cam.lookAt(o.x, o.y + h * .04, o.z);
    R.setViewport(i * W, y, W, 500); R.setScissor(i * W, y, W, 500); R.render(sc, cam);
  });
});
window.bilgi = { klipler: kg.animations.map(x => x.name), klip: c.name, sure: +c.duration.toFixed(2), kemik: kemik.length }; window.hazir = 1;
</script></body>` }));
await pg.goto('http://x/');
await pg.waitForFunction(() => window.hazir, null, { timeout: 120000 });
console.log(JSON.stringify(await pg.evaluate(() => window.bilgi)));
await pg.screenshot({ path: out });
await br.close();
