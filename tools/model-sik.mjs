// Meshy'den gelen GLB'yi oyuna girecek hale getirir (dokuları küçültme ve nicemleme ayrıca gltf-transform CLI ile yapılır).
//   model kipi : metalik/pürüz dokusu ve tanjantlar atılır (oyun malzemeyi kendisi kurar; three.js tanjantı türevle hesaplar)
//   klip kipi  : ağ, deri, malzeme ve dokular atılır; yalnız iskelet ve adı verilen klipler kalır. Klip aralığı kesilebilir.
//
//   GLTFT=<@gltf-transform paketlerinin bulunduğu node_modules> node tools/model-sik.mjs model <giriş.glb> <çıkış.glb>
//   GLTFT=... node tools/model-sik.mjs klip <giriş.glb> <çıkış.glb> <ad[:yeniAd[:bas-son sn]]> ...
//   (paketler proje bağımlılığı değil: npx @gltf-transform/cli bir kez çalıştırılınca ~/.npm/_npx altına iner)
// Ardından: gltf-transform resize / webp / resample / prune / quantize (docs/YOL_HARITASI.md "Kam modeli").
import { createRequire } from 'node:module';
import path from 'node:path';

const kok = process.env.GLTFT;
if (!kok) { console.error('GLTFT ortam değişkeni gerekli (dosyanın başındaki nota bak)'); process.exit(2); }
const { NodeIO } = createRequire(path.join(path.resolve(kok), 'x.js'))('@gltf-transform/core');
const [kip, giris, cikis, ...sec] = process.argv.slice(2);
const io = new NodeIO(), doc = await io.read(giris), root = doc.getRoot();

if (kip == 'model') {
  for (const m of root.listMaterials()) {
    m.setMetallicRoughnessTexture(null).setOcclusionTexture(null).setMetallicFactor(0).setRoughnessFactor(.7);
  }
  for (const me of root.listMeshes()) for (const p of me.listPrimitives()) { const t = p.getAttribute('TANGENT'); if (t) { p.setAttribute('TANGENT', null); } }
  for (const a of root.listAnimations()) a.dispose(); // dinlenme duruşu klibi gereksiz
} else if (kip == 'klip') {
  const ist = sec.map(s => { const [ad, yeni, ar] = s.split(':'); const [b, e] = (ar || '').split('-').map(Number); return { ad, yeni: yeni || ad, b: isFinite(b) ? b : null, e: isFinite(e) ? e : null }; });
  for (const a of root.listAnimations()) {
    const i = ist.find(x => x.ad == a.getName());
    if (!i) { a.dispose(); continue; }
    a.setName(i.yeni);
    if (i.b != null && i.e != null) {
      // aralığı kes: her örnekleyicide [b, e] içindeki anahtarlar kalır, zaman b kadar geri kayar
      for (const s of a.listSamplers()) {
        const gi = s.getInput(), go = s.getOutput(), t = gi.getArray(), v = go.getArray(), n = go.getElementSize();
        const k = []; for (let j = 0; j < t.length; j++) if (t[j] >= i.b - 1e-4 && t[j] <= i.e + 1e-4) k.push(j);
        let T, V;
        if (k.length < 2) {
          // aralıkta anahtarı olmayan seyrek iz (sabit duran kemik): aralığın başındaki değer iki anahtarla tutulur
          let j0 = 0; for (let j = 0; j < t.length; j++) if (t[j] <= i.b) j0 = j;
          T = new Float32Array([0, i.e - i.b]); V = new v.constructor(2 * n);
          for (let q = 0; q < 2; q++) for (let c = 0; c < n; c++) V[q * n + c] = v[j0 * n + c];
        } else {
          T = new Float32Array(k.length); V = new v.constructor(k.length * n);
          k.forEach((j, q) => { T[q] = t[j] - i.b; for (let c = 0; c < n; c++) V[q * n + c] = v[j * n + c]; });
          T[0] = Math.max(0, T[0]);
        }
        s.setInput(doc.createAccessor().setType('SCALAR').setArray(T).setBuffer(gi.getBuffer()));
        s.setOutput(doc.createAccessor().setType(go.getType()).setArray(V).setBuffer(go.getBuffer()));
      }
    }
  }
  for (const n of root.listNodes()) { n.setMesh(null); n.setSkin(null); }
  for (const x of [...root.listMeshes(), ...root.listSkins(), ...root.listMaterials(), ...root.listTextures()]) x.dispose();
  const kalan = root.listAnimations().map(a => a.getName());
  for (const i of ist) if (!kalan.includes(i.yeni)) console.error('klip bulunamadı:', i.ad);
} else { console.error('kip: model | klip'); process.exit(2); }

await io.write(cikis, doc);
console.log(kip, '→', cikis, 'klipler:', root.listAnimations().map(a => a.getName()).join(', ') || 'yok');
