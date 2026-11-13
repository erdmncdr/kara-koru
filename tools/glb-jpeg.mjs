// GLB içindeki WebP ve PNG dokuları JPEG'e çevirir (Unity'nin glTF içe aktarıcısı WebP açamıyor: dosya hiç içe aktarılmıyor; three'nin
// dışa aktarıcısı tuvalden gelen dokuyu PNG yazar: 512'lik doku 540 KB). Saydamlık gerekmeyen dokular için.
// macOS sips ile çözer. GLTFT=<@gltf-transform node_modules> node tools/glb-jpeg.mjs <giriş.glb> <çıkış.glb> [kalite=88]
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import path from 'node:path'; import fs from 'node:fs'; import os from 'node:os';
const req = createRequire(path.join(path.resolve(process.env.GLTFT), 'x.js')), { NodeIO } = req('@gltf-transform/core'), { ALL_EXTENSIONS } = req('@gltf-transform/extensions');
const [a, b, q = '88'] = process.argv.slice(2), io = new NodeIO().registerExtensions(ALL_EXTENSIONS), d = await io.read(a), tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'glbjpg-'));
let n = 0;
for (const t of d.getRoot().listTextures()) {
  const mt = t.getMimeType();
  if (mt != 'image/webp' && mt != 'image/png') continue;
  const w = path.join(tmp, n + (mt == 'image/png' ? '.png' : '.webp')), j = path.join(tmp, n + '.jpg');
  fs.writeFileSync(w, t.getImage());
  execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', q, w, '--out', j], { stdio: 'ignore' });
  t.setImage(fs.readFileSync(j)).setMimeType('image/jpeg'); n++;
}
for (const e of d.getRoot().listExtensionsUsed()) if (e.extensionName == 'EXT_texture_webp') e.dispose();
await io.write(b, d);
console.log(`${n} doku JPEG'e çevrildi → ${b}; uzantılar: ${d.getRoot().listExtensionsUsed().map(e => e.extensionName).join(', ') || 'yok'}`);
