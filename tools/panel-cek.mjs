// Yönetim panelini (Kurultay) yerel taklit sunucuda açar, yönetici hesabıyla girer ve her bölümün görüntüsünü alır.
// Önce: tools/yerel-supa.mjs --tohum çalışıyor ve panel o adrese göre derlenmiş olmalı (dosyanın başındaki nota bak).
// node tools/panel-cek.mjs <url/yonetim.html> <klasör>   (CHROME: Chrome yolu; BOY=1440x900,390x844; HAREKET=0: animasyon bitmiş kare)
import { chromium } from 'playwright';
import fs from 'node:fs';
import { TOHUM_YONETICI } from './yerel-supa-sabit.mjs';
const [url, out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const BOY = (process.env.BOY || '1440x900,390x844').split(',').map(s => s.split('x').map(Number));
const br = await chromium.launch({ executablePath: process.env.CHROME, headless: true });
for (const [w, h] of BOY) {
  const pg = await br.newPage({ viewport: { width: w, height: h } });
  const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() == 'error') errs.push(m.text()); });
  await pg.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await sleep(600);
  await pg.screenshot({ path: `${out}/${w}_0_giris.png` });
  await pg.fill('input[name=ad]', TOHUM_YONETICI.ad); await pg.fill('input[name=sifre]', TOHUM_YONETICI.sifre);
  await pg.click('#girF button');
  await pg.waitForSelector('.ray', { timeout: 20000 });
  let i = 1;
  for (const s of ['genel', 'denge', 'etkinlik', 'oyuncu', 'kosu', 'sezon', 'sistem']) {
    await pg.click(`.gez button[data-d="${s}"]`);
    await sleep(+process.env.BEKLE || 2200);
    await pg.screenshot({ path: `${out}/${w}_${i}_${s}.png`, fullPage: !!process.env.TAM });
    if (s == 'genel' && process.env.ERKEN) { await pg.click(`.gez button[data-d="denge"]`); await sleep(300); await pg.click(`.gez button[data-d="genel"]`); await sleep(+process.env.ERKEN); await pg.screenshot({ path: `${out}/${w}_${i}_${s}_erken.png` }); }
    if (s == 'oyuncu') { const r = await pg.$('.tb tr.tik'); if (r) { await r.click(); await sleep(1200); await pg.screenshot({ path: `${out}/${w}_${i}_${s}_cekmece.png` }); await pg.click('[data-a=kapat]'); } }
    i++;
  }
  const tasma = await pg.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  console.log(`${w}x${h} yatay taşma ${tasma} hata: ${errs.length ? [...new Set(errs)].join(' ; ').slice(0, 300) : 'yok'}`);
  await pg.close();
}
await br.close();
