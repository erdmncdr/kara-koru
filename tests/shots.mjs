// Sabit tohumlu ekran görüntüleri: aynı harita, aynı kamera. Görsel karşılaştırma için.
// node tests/shots.mjs <url> <klasör>
import { chromium } from 'playwright';
import fs from 'node:fs';
const url = process.argv[2] || 'http://localhost:4173/', out = process.argv[3] || 'test-results/shots';
fs.mkdirSync(out, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const br = await chromium.launch({ executablePath: fs.existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : undefined, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await br.newPage({ viewport: { width: 1280, height: 720 } });
await pg.addInitScript(() => {
  localStorage.setItem('kk_set', JSON.stringify({ q: 2, bl: 1 })); localStorage.setItem('kk_tut', '1');
  let s = 12345; Math.random = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 };
});
const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text().slice(0, 160)) });
await pg.route('**/*', r => { const u = r.request().url(); if (u.startsWith('file:') || u.includes('localhost')) return r.continue(); return r.abort() });
await pg.goto(url);
await pg.waitForFunction(() => typeof S !== 'undefined' && S === 'menu', null, { timeout: 90000 });
await sleep(6000); await pg.screenshot({ path: out + '/a_menu.png' });
await pg.evaluate(() => { start(); P.inv = 1e9; yawT = yaw = 2.2; pitT = pit = .42 });
await sleep(9000); await pg.screenshot({ path: out + '/b_forest.png' });
await pg.evaluate(() => { GATE.st = 2; nextStage() });
await sleep(6000); await pg.evaluate(() => { if (S === 'ready') goReady(); else { back(); S = 'play' } P.inv = 1e9; yawT = yaw = 4; pitT = pit = .35 });
await sleep(9000); await pg.screenshot({ path: out + '/c_desert.png' });
fs.writeFileSync(out + '/log.txt', [...new Set(errs)].join('\n'));
console.log('uyarı/hata:', [...new Set(errs)].length); await br.close();
