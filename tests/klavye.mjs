// Klavye gezinmesi: ana menü, Otağ, ayarlar (kaydırıcı), seviye kartları, duraklatma; oyunda Tab büyük harita.
// node tests/klavye.mjs <url> <ekran klasörü>   (CHROME ortam değişkeni Chrome yolunu verir)
import { chromium } from 'playwright';
const br = await chromium.launch({ executablePath: process.env.CHROME, headless: true, args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const pg = await br.newPage({ viewport: { width: 1280, height: 720 } });
await pg.addInitScript(() => { Element.prototype.requestPointerLock = function(){}; localStorage.setItem('kk_set', JSON.stringify({ q: 1 })); localStorage.setItem('kk_tut','1') });
const errs = []; pg.on('pageerror', e => errs.push(e.message));
await pg.goto(process.argv[2], { waitUntil: 'domcontentloaded' }); await pg.waitForFunction(() => typeof S !== 'undefined' && S === 'menu', null, { timeout: 90000 });
await pg.waitForTimeout(1200);
const ae = () => pg.evaluate(() => { const a = document.activeElement, cs = getComputedStyle(a); return `${(a.textContent || a.type || '').trim().replace(/\s+/g,' ').slice(0, 22)} [${cs.outlineStyle} ${cs.outlineWidth}]` });
const P = async (k, n = 1) => { for (let i = 0; i < n; i++) await pg.keyboard.press(k); return ae(); };
const r = {};
r.menu_tab = await P('Tab'); r.menu_down2 = await P('ArrowDown', 2); r.menu_up = await P('ArrowUp'); r.menu_shiftTab = await P('Shift+Tab');
if (process.argv[3]) await pg.screenshot({ path: process.argv[3] + '/44_menu_odak.png' });
r.menu_enterOyna = (await pg.keyboard.press('Enter'), await pg.evaluate(() => menuPg));
r.kahraman_ok = (await pg.keyboard.press('ArrowRight'), await pg.evaluate(() => CI));
r.kahraman_tab = await P('Tab');
await pg.evaluate(() => { menu(); settings() }); await pg.waitForTimeout(300);
r.ayar_tab3 = await P('Tab', 3);
// kaydırıcıya kadar git, sağ ok değeri değiştirir mi
for (let i = 0; i < 20; i++) { const t = await pg.evaluate(() => document.activeElement.type); if (t == 'range') break; await pg.keyboard.press('Tab'); }
const v0 = await pg.evaluate(() => document.activeElement.type == 'range' ? document.activeElement.value : 'kaydırıcı yok');
await pg.keyboard.press('ArrowRight'); const v1 = await pg.evaluate(() => document.activeElement.value);
r.kaydirici = `${v0} → ${v1}, odak: ${await ae()}`;
await pg.evaluate(() => { closeSet(); start(); P.inv = 1e9 }); await pg.waitForTimeout(6000); await pg.evaluate(() => { if (S === 'ready') goReady() }); await pg.waitForTimeout(1500);
await pg.evaluate(() => choose('level', luOpts())); await pg.waitForTimeout(400);
r.kart_down = await P('ArrowDown'); r.kart_right = await P('ArrowRight');
if (process.argv[3]) await pg.screenshot({ path: process.argv[3] + '/45_kart_odak.png' });
const w0 = await pg.evaluate(() => P.W.length + P.T.length); await pg.keyboard.press('Enter'); await pg.waitForTimeout(300);
r.kart_enter = `${await pg.evaluate(() => S)}, silah+tom ${w0} → ${await pg.evaluate(() => P.W.length + P.T.length)}`;
await pg.evaluate(() => { if (S != 'play') back(); }); await pg.keyboard.press('Escape'); await pg.waitForTimeout(300);
r.duraklat = `${await pg.evaluate(() => S)} ${await P('ArrowDown')}`;
await pg.keyboard.press('Escape'); await pg.waitForTimeout(200);
r.oyunda_tab = (await pg.keyboard.down('Tab'), await pg.waitForTimeout(150), await pg.evaluate(() => !!BMV + ' S=' + S)); await pg.keyboard.up('Tab');
for (const [k, v] of Object.entries(r)) console.log(k.padEnd(16), v);
console.log('hata:', errs.length ? errs : 'yok'); await br.close();
