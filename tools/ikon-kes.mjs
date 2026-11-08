// Simge sayfası kesici: saydam (ya da yeşil zeminli) ızgara görselini tek tek simgelere böler.
// node tools/ikon-kes.mjs <sayfa.png> <sütun> <satır> <çıkış klasörü> ad1,ad2,... [--yesil]
// Hücreler sabit ızgaradan değil, boş satır/sütun aralıklarından bulunur (üretici simgeleri tam ortalamaz).
// Düşük alfalı kırıntılar silinir; her simge kareye tamamlanıp 128 px WebP yazılır.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const [src, cols, rows, out, names, flag] = process.argv.slice(2);
if (!names) { console.error('kullanım: node tools/ikon-kes.mjs sayfa.png sütun satır klasör ad1,ad2,... [--yesil]'); process.exit(1); }
const list = names.split(',');
fs.mkdirSync(out, { recursive: true });
const br = await chromium.launch({ executablePath: process.env.CHROME, headless: true });
const pg = await br.newPage();
const b64 = fs.readFileSync(src).toString('base64');
const res = await pg.evaluate(async ({ b64, C, R, n, SZ, green }) => {
  const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
  const W = img.width, H = img.height, cv = new OffscreenCanvas(W, H), cx = cv.getContext('2d');
  cx.drawImage(img, 0, 0);
  const id = cx.getImageData(0, 0, W, H), d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    if (green) {
      const r = d[i], g = d[i + 1], b = d[i + 2], m = Math.max(r, b), k = g - m;
      if (k > 0) { const a = k > 120 ? 0 : k < 40 ? 1 : 1 - (k - 40) / 80; d[i + 1] = m + Math.min(k, 6); d[i + 3] = Math.round(d[i + 3] * a); }
    }
    // kırıntı temizliği: çok saydam pikseller tamamen silinir, kenar yumuşaklığı korunur
    if (d[i + 3] < 48) d[i + 3] = 0;
  }
  cx.putImageData(id, 0, 0);
  // zemin saydam gelmediyse (köşeler opak) sayfa kullanılamaz
  const op = [0, W - 1, (H - 1) * W, H * W - 1].filter(p => d[p * 4 + 3] > 100).length;
  if (op >= 3) return { opak: 1 };
  const A = (x, y) => d[(y * W + x) * 4 + 3] > 110;
  // izdüşümden dolu aralıklar; beklenen sayıya birleştir ya da en geniş aralığı en ince yerinden böl
  const runs = (len, cnt, want) => {
    let r = [], s = -1;
    for (let i = 0; i < len; i++) { const on = cnt(i) > 2; if (on && s < 0) s = i; if (!on && s >= 0) { r.push([s, i - 1]); s = -1; } }
    if (s >= 0) r.push([s, len - 1]);
    r = r.filter(([a, b]) => b - a > len * 0.02);
    while (r.length > want) { let bi = 0, bg = 1e9; for (let i = 0; i < r.length - 1; i++) { const g = r[i + 1][0] - r[i][1]; if (g < bg) { bg = g; bi = i; } } r.splice(bi, 2, [r[bi][0], r[bi + 1][1]]); }
    while (r.length < want && r.length) {
      let wi = 0; r.forEach((q, i) => { if (q[1] - q[0] > r[wi][1] - r[wi][0]) wi = i; });
      const [a, b] = r[wi], lo = a + Math.floor((b - a) * .25), hi = a + Math.floor((b - a) * .75); let m = lo, mv = 1e9;
      for (let i = lo; i <= hi; i++) { const v = cnt(i); if (v < mv) { mv = v; m = i; } }
      r.splice(wi, 1, [a, m], [m + 1, b]);
    }
    return r;
  };
  const rowCnt = y => { let c = 0; for (let x = 0; x < W; x += 2) if (A(x, y)) c++; return c; };
  const rs = runs(H, rowCnt, R), outs = [];
  for (const [y0, y1] of rs) {
    const colCnt = x => { let c = 0; for (let y = y0; y <= y1; y += 2) if (A(x, y)) c++; return c; };
    const want = Math.min(C, n - outs.length);
    for (const [x0, x1] of runs(W, colCnt, want)) {
      let a = x1, bb = y1, c = x0, e = y0;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (d[(y * W + x) * 4 + 3]) { if (x < a) a = x; if (x > c) c = x; if (y < bb) bb = y; if (y > e) e = y; }
      // hücrede dolu kare zemin: sınır kutusunun köşeleri opaksa simge kutu içinde gelmiştir
      const al = (x, y) => d[(y * W + x) * 4 + 3];
      if ([al(a + 2, bb + 2), al(c - 2, bb + 2), al(a + 2, e - 2), al(c - 2, e - 2)].filter(v => v > 100).length >= 3) return { opak: 1 };
      const s = Math.max(c - a, e - bb) * 1.04, mx = (a + c) / 2, my = (bb + e) / 2;
      const o = new OffscreenCanvas(SZ, SZ), oc = o.getContext('2d');
      oc.imageSmoothingQuality = 'high';
      // yalnız kendi aralığındaki pikseller: komşu simgeden taşan parça girmesin
      oc.beginPath(); oc.rect((x0 - (mx - s / 2)) * SZ / s, (y0 - (my - s / 2)) * SZ / s, (x1 - x0 + 1) * SZ / s, (y1 - y0 + 1) * SZ / s); oc.clip();
      oc.drawImage(cv, mx - s / 2, my - s / 2, s, s, 0, 0, SZ, SZ);
      const blob = await o.convertToBlob({ type: 'image/webp', quality: 0.9 });
      const buf = new Uint8Array(await blob.arrayBuffer()); let str = '';
      for (let q = 0; q < buf.length; q++) str += String.fromCharCode(buf[q]);
      outs.push(btoa(str));
    }
  }
  return outs.slice(0, n);
}, { b64, C: +cols, R: +rows, n: list.length, SZ: 128, green: flag == '--yesil' });
if (res.opak) { console.error(`${path.basename(src)}: ZEMİN SAYDAM DEĞİL, yeniden üret`); await br.close(); process.exit(2); }
let k = 0;
res.forEach((r, i) => { if (r && list[i] != '-') { fs.writeFileSync(path.join(out, list[i] + '.webp'), Buffer.from(r, 'base64')); k++; } });
console.log(`${path.basename(src)}: ${k}/${list.length} simge`);
await br.close();
