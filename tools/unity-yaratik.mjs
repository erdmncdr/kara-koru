// Unity için düşman dışa aktarımı: her tür için oyunun kendi kurduğu kemikli modeli (mkE ile aynı: renk tonu ve gömülü
// aksesuarlar, saydam aksesuarlar ve parıltılar kemik çocuğu) SkinnedMesh olarak GLB'ye, iskelet bilgisini (kemik adları,
// kalça yüksekliği, bacak ölçüleri, gözler, ölçek) JSON'a yazar. Hareketler Unity'de geo/anim.js'in C# çevirisiyle oynar.
// node tools/unity-yaratik.mjs <oyun url> <çıktı klasörü> [biyom=0] [türler]   YALNIZ_GLB=1: yalnız Tripo modelli gövdesi olan türler (yeniden dışa aktarım)
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
const res = await pg.evaluate(async ([ekler, yalnizGlb]) => {
  const { GLTFExporter } = await import('/@id/three/examples/jsm/exporters/GLTFExporter.js');
  const C = await import('/src/game/creatures.js'), R = await import('/src/engine/renderer.js'), A = await import('/src/geo/accessories.js');
  const { KINDS, ROSTER } = await import('/src/data/enemies.js'), { $G } = await import('/src/core/store.js');
  const CT = await import('/src/data/content.js');
  const list = ekler ? ekler.split(',') : (ROSTER[['koru', 'bozkir', 'mezarlik'][$G.BI]] || ROSTER.koru).map(r => r.k).filter((k, i, a) => a.indexOf(k) == i);
  // Tripo modelli gövdeler (engine/glbdusman.js) inmiş olsun: mkE onları verir
  const GD = await import('/src/engine/glbdusman.js'); GD.glbDusmanHazirla(); await GD.glbDusmanBekle();
  // tür rengi oyunda shader'da dokuya boyanır (glbdusman.js malzeme); Unity için aynı işlem dokunun piksellerine uygulanır
  const T3 = await import('/@id/three');
  const boya = (map, [hex, oran]) => {
    const im = map.image, cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height;
    const cx = cv.getContext('2d'); cx.drawImage(im, 0, 0);
    const d = cx.getImageData(0, 0, cv.width, cv.height), a = d.data, c = new T3.Color(hex), L = x => (x /= 255) <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4, S = x => Math.round(255 * Math.min(1, x <= .0031308 ? x * 12.92 : 1.055 * x ** (1 / 2.4) - .055));
    for (let i = 0; i < a.length; i += 4) { const r = L(a[i]), g = L(a[i + 1]), b = L(a[i + 2]), l = (r * .3 + g * .59 + b * .11) * 1.5 + .06; a[i] = S(r + (c.r * l - r) * oran); a[i + 1] = S(g + (c.g * l - g) * oran); a[i + 2] = S(b + (c.b * l - b) * oran); }
    cx.putImageData(d, 0, 0);
    const t = new T3.CanvasTexture(cv); t.flipY = map.flipY; t.colorSpace = map.colorSpace; return t;
  };
  const out = {};
  for (const k of list) {
    const kd = { ...(KINDS[k] || { t: 3 }), k }, t = kd.t != null ? kd.t : 3;
    const u0 = C.mkE(t, false, kd), d = u0.d;
    if (yalnizGlb && !d.glb) continue;
    const u = R.skInst(d, 0);
    if (A.ACC.kind[k] && !d.glb) A.attachAcc(u, d.bones, A.ACC.kind[k], 1); // yeni gövdede aksesuar yok (creatures.js mkE)
    // dokulu gövde: doku ve renk dışa aktarılır (Unity KoruLook şablona _BaseMap olarak koyar); ışıma oyunun kendi malzemesinden gelir
    if (d.mat) { const m = d.mat.clone(); if (d.mat.userData.tint) m.map = boya(d.mat.map, d.mat.userData.tint); m.onBeforeCompile = () => {}; m.emissiveMap = null; m.emissive.setRGB(0, 0, 0); m.color.setRGB(Math.min(1, m.color.r), Math.min(1, m.color.g), Math.min(1, m.color.b)); m.vertexColors = true; u.m.material = m; } else u.m.material = u.m.material.clone();
    u.m.material.name = 'kk_yaratik';
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
}, [ekler, !!process.env.YALNIZ_GLB]);
for (const [k, v] of Object.entries(res.out)) {
  fs.writeFileSync(`${out}/yaratik_${k}.glb`, Buffer.from(v.b64, 'base64'));
  fs.writeFileSync(`${out}/yaratik_${k}.json`, JSON.stringify(v.rig));
  console.log(k, 't' + v.rig.t, (v.b64.length * .75 / 1024).toFixed(0) + ' KB', 'kemik', v.rig.bones.length, 'göz', v.rig.eyes.length);
}
console.log('hata:', errs.length ? errs.slice(0, 3) : 'yok');
await br.close();
