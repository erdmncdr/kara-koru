// Unity için HUD ölçüsü: oyunu telefon yatay ekranında (dokunmatik) açar, HUD öğelerinin hesaplanmış konum, boyut,
// renk ve yazı değerlerini JSON'a, görüntüsünü PNG'ye yazar. Unity HUD'u bu ölçülerle kurulur.
// node tools/unity-hud-olcu.mjs <oyun url> <çıktı klasörü> [genişlik=874] [yükseklik=402]
import { chromium } from 'playwright';
import fs from 'node:fs';
const [url, out, W = '874', H = '402'] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const br = await chromium.launch({ executablePath: process.env.CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await br.newContext({ viewport: { width: +W, height: +H }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const pg = await ctx.newPage();
await pg.addInitScript(() => { Element.prototype.requestPointerLock = function () {}; localStorage.setItem('kk_tut', '1'); localStorage.setItem('kk_ci', '0'); localStorage.setItem('kk_set', JSON.stringify({ q: 2, bl: 1 })); let s = 1; Math.random = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 }; window.__tohum = v => { s = v >>> 0; }; });
await pg.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
await pg.waitForFunction(() => typeof S !== 'undefined' && S === 'menu', null, { timeout: 90000 });
await pg.evaluate(() => { window.__tohum(1); start(); P.inv = 1e9 });
await new Promise(r => setTimeout(r, 7000));
await pg.evaluate(() => { if (S === 'ready') goReady() });
await new Promise(r => setTimeout(r, 4000));
const sel = ['#xpw', '#xpm', '#xpbar', '#xp', '#xpt', '#lvb', '#lt', '#st', '#rtm', '#rtv', '#au', '#auv', '#kl', '#klv', '.hpb', '.hpb .trk', '#hp', '#hpt', '.dsb', '.dsb .trk', '#dshf', '#bl', '#bl .hr', '#bl .sl', '#bl .sl b', '#bf', '#ct', '#tmr', '#tm', '#stn', '#tml', '#yol', '#rt', '#rth', '#aun', '#mm', '#lgd', '#bj', '#bs', '#bc', '#be', '#bp', '#joy', '#tt', '#obj', '#goal'];
const r = await pg.evaluate(sel => {
  const o = {};
  for (const s of sel) {
    const els = [...document.querySelectorAll(s)].slice(0, 6);
    o[s] = els.map(e => {
      const b = e.getBoundingClientRect(), c = getComputedStyle(e);
      return { x: +b.x.toFixed(1), y: +b.y.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1), disp: c.display, vis: c.visibility, op: c.opacity,
        bg: c.backgroundColor, bgi: c.backgroundImage.slice(0, 160), col: c.color, font: c.fontFamily.split(',')[0] + ' ' + c.fontWeight + ' ' + c.fontSize, ls: c.letterSpacing,
        br: c.borderRadius, stroke: c.webkitTextStrokeWidth + ' ' + c.webkitTextStrokeColor, bs: c.boxShadow.slice(0, 160), bd: c.border, ts: c.textShadow.slice(0, 80), txt: (e.innerText || '').slice(0, 40), html: e.children.length };
    });
  }
  return { o, vw: innerWidth, vh: innerHeight };
}, sel);
fs.writeFileSync(`${out}/hud_${W}x${H}.json`, JSON.stringify(r, null, 1));
// ikonlar: HUD'daki SVG'ler ve ilk silah yuvası, saydam arka planlı 128 px PNG
const ik = await pg.evaluate(() => {
  const o = {};
  const svg = (k, el) => { if (el) o[k] = el.outerHTML; };
  // saat: index.html'deki çizim (canlı DOM'daki svg bu sayfada şeritli çıkıyor)
  o.sure = '<svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>'; svg('altin', document.querySelector('#au svg')); svg('olum', document.querySelector('#kl svg'));
  svg('sandik', document.querySelector('#aun svg')); svg('yuva0', document.querySelector('#bl .sl svg'));
  return o;
});
for (const [k, h] of Object.entries(ik)) {
  const p2 = await ctx.newPage();
  await p2.setViewportSize({ width: 128, height: 128 });
  await p2.setContent(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>svg{display:block;width:128px!important;height:128px!important}</style></head><body style="margin:0;background:transparent;color:#fff">${h.replace(/currentColor/g, "#ffffff")}</body></html>`);
  await p2.screenshot({ path: `${out}/ikon_${k}.png`, omitBackground: true, clip: { x: 0, y: 0, width: 128, height: 128 } });
  await p2.close();
}
// mini harita arka planı (build.js MMBG)
const mm = await pg.evaluate(async () => { const { $G } = await import('/src/core/store.js'); return $G.MMBG ? $G.MMBG.toDataURL('image/png').split(',')[1] : ''; });
if (mm) fs.writeFileSync(`${out}/minimap.png`, Buffer.from(mm, 'base64'));
console.log('ikon', Object.keys(ik).join(','), 'harita', mm ? 'var' : 'yok');
await pg.screenshot({ path: `${out}/hud_${W}x${H}.png` });
console.log('tamam', Object.keys(r.o).filter(k => r.o[k].length).length, 'öğe');
await br.close();
