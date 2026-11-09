// Unity için düşman dışa aktarımı: her tür için oyunun kendi kurduğu kemikli modeli (mkE ile aynı: renk tonu ve gömülü
// aksesuarlar, saydam aksesuarlar ve parıltılar kemik çocuğu) SkinnedMesh olarak GLB'ye, iskelet bilgisini (kemik adları,
// kalça yüksekliği, bacak ölçüleri, gözler, ölçek) JSON'a yazar. Hareketler Unity'de geo/anim.js'in C# çevirisiyle oynar.
// node tools/unity-yaratik.mjs <oyun url> <çıktı klasörü> [biyom=0]
import { chromium } from 'playwright';
import fs from 'node:fs';
const [url, out, bi = '0', ekler = ''] = process.argv.slice(2); // ekler: virgüllü boss türleri (taban sınıf 3), ör. tepegoz
fs.mkdirSync(out, { recursive: true });
const br = await chromium.launch({ executablePath: process.env.CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await br.newPage({ viewport: { width: 640, height: 360 } });
const errs = []; pg.on('pageerror', e => errs.push(e.message));
await pg.addInitScript(() => { Element.prototype.requestPointerLock = function () {}; localStorage.setItem('kk_tut', '1'); localStorage.setItem('kk_ci', '0'); localStorage.setItem('kk_set', JSON.stringify({ q: 2 })); });
await pg.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
await pg.waitForFunction(() => typeof S !== 'undefined' && S === 'menu', null, { timeout: 90000 });
await pg.evaluate(() => { start(); P.inv = 1e9 });
await pg.waitForFunction(() => S === 'ready' || S === 'play', null, { timeout: 60000 });
// biyom 1-2: aşama geçişiyle (setupStage) dünya ve $G.BI o biyoma geçer (renk tonları biyoma bağlı olabilir)
if (+bi > 0) await pg.evaluate(async n => { const { $G } = await import('/src/core/store.js'); const O = await import('/src/game/objects.js'); $G.P.stage = n; $G.P.map = ['koru', 'bozkir', 'mezarlik'][n]; O.setupStage(); }, +bi);
const res = await pg.evaluate(async ekler => {
  const { GLTFExporter } = await import('/@id/three/examples/jsm/exporters/GLTFExporter.js');
  const C = await import('/src/game/creatures.js'), R = await import('/src/engine/renderer.js'), A = await import('/src/geo/accessories.js');
  const { KINDS, ROSTER } = await import('/src/data/enemies.js'), { $G } = await import('/src/core/store.js');
  const CT = await import('/src/data/content.js');
  const list = ekler ? ekler.split(',') : (ROSTER[['koru', 'bozkir', 'mezarlik'][$G.BI]] || ROSTER.koru).map(r => r.k).filter((k, i, a) => a.indexOf(k) == i);
  const out = {};
  for (const k of list) {
    const kd = { ...(KINDS[k] || { t: 3 }), k }, t = kd.t != null ? kd.t : 3;
    const u0 = C.mkE(t, false, kd), d = u0.d;
    const u = R.skInst(d, 0);
    if (A.ACC.kind[k]) A.attachAcc(u, d.bones, A.ACC.kind[k], 1);
    u.m.material = u.m.material.clone(); u.m.material.name = 'kk_yaratik';
    u.g.name = k;
    const glb = await new GLTFExporter().parseAsync(u.g, { binary: true });
    const a = new Uint8Array(glb); let s = '';
    for (let i = 0; i < a.length; i += 8192) s += String.fromCharCode.apply(null, a.subarray(i, i + 8192));
    out[k] = {
      b64: btoa(s),
      rig: {
        k, t, n: kd.n, sc: kd.sc || 1, hp: kd.hp != null ? kd.hp : CT.TY[t].hp, sp: kd.sp != null ? kd.sp : CT.TY[t].sp, d: kd.d != null ? kd.d : CT.TY[t].d,
        xp: kd.xp != null ? kd.xp : CT.TY[t].xp, r: CT.TY[t].r, nom: C.NOM[t], fx: kd.fx || null,
        names: u.names, info: d.info,
        bones: d.bones.map(x => ({ n: x.n, pi: x.pi, h: x.h })),
        eyes: d.eyes.map(e => ({ bone: e.bone, p: e.p, r: e.r, sq: e.sq || 1, c: e.c, glow: e.glow || 0 }))
      }
    };
  }
  return { out, list };
}, ekler);
for (const [k, v] of Object.entries(res.out)) {
  fs.writeFileSync(`${out}/yaratik_${k}.glb`, Buffer.from(v.b64, 'base64'));
  fs.writeFileSync(`${out}/yaratik_${k}.json`, JSON.stringify(v.rig));
  console.log(k, 't' + v.rig.t, (v.b64.length * .75 / 1024).toFixed(0) + ' KB', 'kemik', v.rig.bones.length, 'göz', v.rig.eyes.length);
}
console.log('hata:', errs.length ? errs.slice(0, 3) : 'yok');
await br.close();
