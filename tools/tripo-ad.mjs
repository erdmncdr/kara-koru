// Tripo'nun iskeletli modelini (Mixamo adlı kemikler: mixamorig:Hips ...) oyunun Meshy düzenine getirir:
//   · kemik adları Meshy adlarına çevrilir (hareket klipleri kemik adıyla bağlanır)
//   · Tripo modeli +X'e bakar, Meshy +Z'ye: kök düğüm, sol kalça +X'e gelecek biçimde y ekseninde döndürülür
// Ardından klipler tools/klip-aktar.mjs ile bu iskelete çevrilir.
//   GLTFT=<@gltf-transform node_modules> node tools/tripo-ad.mjs <tripo model.glb> <çıkış.glb>
import { createRequire } from 'node:module';
import path from 'node:path';

const { NodeIO } = createRequire(path.join(path.resolve(process.env.GLTFT), 'x.js'))('@gltf-transform/core');
const [a, b] = process.argv.slice(2), io = new NodeIO(), d = await io.read(a), r = d.getRoot();
const E = { Spine: 'Spine02', Spine1: 'Spine01', Spine2: 'Spine', Neck: 'neck', HeadTop_End: 'head_end' };
let n = 0;
for (const x of r.listNodes()) { const m = /^mixamorig:(.+)$/.exec(x.getName()); if (m) { x.setName(E[m[1]] || m[1]); n++; } }
const bul = ad => r.listNodes().find(x => x.getName() == ad), sol = bul('LeftUpLeg').getWorldTranslation(), sag = bul('RightUpLeg').getWorldTranslation();
// sağ → sol yönü +X olmalı
// kök: kalçanın ebeveyni (CLI çıktısında sahnenin çocuğu olan Armature; stüdyo çıktısında bir düğümün altında ve zaten çevrilmiş)
const aci = Math.atan2(sol[2] - sag[2], sol[0] - sag[0]), kok = bul('Hips').getParentNode();
if (!kok) throw new Error('Hips kök düğümde: döndürülecek ebeveyn yok');
const q = kok.getRotation(), y = [0, Math.sin(aci / 2), 0, Math.cos(aci / 2)];
// y × q
kok.setRotation([y[3] * q[0] + y[1] * q[2], y[3] * q[1] + y[1] * q[3], y[3] * q[2] - y[1] * q[0], y[3] * q[3] - y[1] * q[1]]);
await io.write(b, d);
console.log(`${n} kemik adlandı, kök ${(aci * 57.2958).toFixed(1)}° döndü → ${b}`);
