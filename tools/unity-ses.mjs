// Unity için sesler: web oyunu sesleri dosyadan değil kodla sentezler (audio/synth.js). Aynı sentez başsız tarayıcıda
// her ses ve varyasyon için çalıştırılır, 16 bit WAV olarak yazılır; çalma ayarları (engine.js SM: kazanç dB, eşzamanlı
// sınır, öncelik, yankı, perde oynaması; SMIN: en kısa tekrar aralığı) ses.json'a.
// node tools/unity-ses.mjs <oyun url> <çıktı klasörü>
import { chromium } from 'playwright';
import fs from 'node:fs';
const [url, out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const br = await chromium.launch({ executablePath: process.env.CHROME, headless: true });
const pg = await br.newPage();
const errs = []; pg.on('pageerror', e => errs.push(e.message));
await pg.addInitScript(() => { localStorage.setItem('kk_tut', '1'); });
await pg.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
await pg.waitForFunction(() => typeof S !== 'undefined' && S === 'menu', null, { timeout: 90000 });
const list = await pg.evaluate(async () => {
  const Y = await import('/src/audio/synth.js'), EN = await import('/src/audio/engine.js');
  return Object.keys(Y.SND.SREC.REC).map(n => [n, Y.SND.SREC.REC[n].n, EN.SRT(n)]);
});
const meta = await pg.evaluate(async () => { const EN = await import('/src/audio/engine.js'); return { SM: EN.SM, SMIN: EN.SMIN }; });
meta.N = {}; meta.SR = {};
let toplam = 0;
function wav(chs, sr) {
  const n = chs[0].length, nc = chs.length, b = Buffer.alloc(44 + n * nc * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * nc * 2, 4); b.write('WAVE', 8); b.write('fmt ', 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20);
  b.writeUInt16LE(nc, 22); b.writeUInt32LE(sr, 24); b.writeUInt32LE(sr * nc * 2, 28); b.writeUInt16LE(nc * 2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * nc * 2, 40);
  for (let i = 0; i < n; i++) for (let c = 0; c < nc; c++) b.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(chs[c][i] * 32767))), 44 + (i * nc + c) * 2);
  return b;
}
for (const [n, k, sr] of list) {
  meta.N[n] = k; meta.SR[n] = sr;
  for (let v = 0; v < k; v++) {
    const x = await pg.evaluate(async ([n, v, sr]) => {
      const Y = await import('/src/audio/synth.js');
      Y.SND.DSP.setSR(sr);
      const r = Y.SND.sRender(n, v);
      return r.map(c => Array.from(c));
    }, [n, v, sr]);
    const b = wav(x, sr); toplam += b.length;
    fs.writeFileSync(`${out}/${n}_${v}.wav`, b);
  }
}
fs.writeFileSync(`${out}/ses.json`, JSON.stringify(meta));
console.log('ses', list.length, 'dosya', list.reduce((a, l) => a + l[1], 0), (toplam / 1e6).toFixed(1) + ' MB');
console.log('hata:', errs.length ? errs.slice(0, 3) : 'yok');
await br.close();
