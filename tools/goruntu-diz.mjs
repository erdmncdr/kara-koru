// Birkaç görüntüyü tek sayfada ızgaraya dizer (karşılaştırma ve rapor için).
// node tools/goruntu-diz.mjs <çıkış.png> <sütun> <hücre genişliği> <hücre yüksekliği> <resim[:etiket]> ...   (CHROME ortam değişkeni Chrome yolunu verir)
import { chromium } from 'playwright';
import fs from 'node:fs';
const [out, sut, w, h, ...res] = process.argv.slice(2);
const br = await chromium.launch({ executablePath: process.env.CHROME, headless: true });
const n = res.length, C = +sut, R = Math.ceil(n / C);
const pg = await br.newPage({ viewport: { width: C * +w, height: R * +h } });
const hucre = res.map(r => { const i = r.indexOf('.png:'), yol = i > 0 ? r.slice(0, i + 4) : r, et = i > 0 ? r.slice(i + 5) : ''; const b = fs.readFileSync(yol).toString('base64'); return `<div style="position:relative;width:${w}px;height:${h}px;overflow:hidden"><img src="data:image/png;base64,${b}" style="width:100%;height:100%;object-fit:cover">${et ? `<span style="position:absolute;left:8px;top:6px;font:600 18px sans-serif;color:#fff;text-shadow:0 0 4px #000,0 0 4px #000">${et}</span>` : ''}</div>`; }).join('');
await pg.setContent(`<body style="margin:0;background:#111;display:grid;grid-template-columns:repeat(${C},${w}px)">${hucre}</body>`);
await pg.screenshot({ path: out });
await br.close();
