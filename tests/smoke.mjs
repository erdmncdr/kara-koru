// Kara Koru duman testi: oyunu başsız Chrome'da açar, ana akışları dener, rapor yazar.
// Kullanım:
//   npm run build:test && npx vite preview --port 4173 &   sonra   npm test
//   (build:test = VITE_KOPRU=1: testlerin kullandığı pencere köprüsü yalnız bu derlemede ve geliştirme sunucusunda vardır;
//    yayın derlemesinde oyun durumu pencereye açılmaz. Test derlemesi yayınlanmaz.)
//   node tests/smoke.mjs <url> [rapor-klasörü]
// Ortam: CHROME=/usr/bin/google-chrome (yoksa Playwright'ın Chromium'u kullanılır)
import { chromium } from 'playwright';
import fs from 'node:fs';

const url = process.argv[2] || 'http://localhost:4173/';
const out = process.argv[3] || 'test-results';
fs.mkdirSync(out, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const R = { url, checks: {} };
const ok = (name, pass, info) => { R.checks[name] = { pass: !!pass, info }; console.log((pass ? 'GEÇTİ ' : 'KALDI ') + name, info !== undefined ? JSON.stringify(info) : '') };

const br = await chromium.launch({
  executablePath: process.env.CHROME || (fs.existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : undefined),
  headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'],
});
const pg = await br.newPage({ viewport: { width: 1280, height: 720 } });
await pg.addInitScript(() => {
  // Başsız Chrome'da bile fare kilidi (pointer lock) kullanıcının gerçek imlecini yakalayabiliyor; testler imlece dokunmasın
  Element.prototype.requestPointerLock = function () { return Promise.resolve(); };
  localStorage.setItem('kk_set', JSON.stringify({ q: 0, bl: 0 }));
  // sahte kumanda: testler __pad'i doldurup padTick'i elle adımlar
  window.__pad = null; navigator.getGamepads = () => [window.__pad];
  // Kara Koru Kademe 3 seçili (kademe 2 tamamlanmış sayılır) ki aşama geçişi ve final arenası test edilebilsin
  localStorage.setItem('kk_meta', JSON.stringify({ v: 3, tier: { koru: 2 } }));
  localStorage.setItem('kk_map', JSON.stringify({ map: 'koru', tier: 3 }));
});
const errs = [];
pg.on('pageerror', e => errs.push(e.message));
pg.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|ERR_NAME|net::|Failed to load resource|pointer lock/i.test(m.text())) errs.push(m.text()) });
// three.js r128 CDN'den yükleyen eski tek dosya sürümleri için yerel kopya
const three = fs.existsSync('node_modules/three/build/three.min.js') ? fs.readFileSync('node_modules/three/build/three.min.js') : null;
await pg.route('**/*', r => {
  const u = r.request().url();
  if (three && u.includes('cdnjs') && u.includes('three')) return r.fulfill({ body: three, contentType: 'text/javascript' });
  if (u.startsWith('file:') || u.includes('localhost') || u.includes('127.0.0.1')) return r.continue();
  return r.abort();
});

const t0 = Date.now();
await pg.goto(url);
await pg.waitForFunction(() => typeof S !== 'undefined' && S === 'menu', null, { timeout: 90000 });
R.loadMs = Date.now() - t0;
await sleep(1500);
await pg.screenshot({ path: out + '/1_menu.png', timeout: 90000 });
// ana menüden açılan yardım penceresi kapanınca menüye döner (eskiden oyunu başlatmadan 'play' durumuna sokuyordu)
const hm = await pg.evaluate(() => { showHelp(); const h = S; closeHelp(); return { h, after: S, on: document.body.classList.contains('on') } });
ok('yardım penceresi menüye dönüyor', hm.h === 'help' && hm.after === 'menu' && !hm.on, hm);
ok('menü açıldı', true, { loadMs: R.loadMs });

// menü akışı: ana (Oyna) → kahraman (Devam) → harita (Koruya gir); hepsi kaydırmasız görünür
const vis = await pg.evaluate(() => {
  const see = re => { const el = [...document.querySelectorAll('button')].find(x => re.test(x.textContent)); if (!el) return false; const b = el.getBoundingClientRect(); return b.bottom <= innerHeight && b.top >= 0 };
  const o = { ana: see(/^Oyna/), pg0: menuPg };
  menuPage('kahraman'); o.hero = see(/Devam/) && document.querySelectorAll('.hc').length === heroIdx().length && !!document.querySelector('.hc.on');
  // kadro gezinmesi (ok tuşu = selC(CI ± 1)): Bahadır'dan (3) ileri Kemik'e (8) atlar, Alp'ten geri Tulpar'a sarar
  { const c0 = CI; selC(3, 1); selC(CI + 1, 1); const fw = CR[CI].k; selC(0, 1); selC(CI - 1, 1); const bw = CR[CI].k; o.nav = fw + '/' + bw; selC(c0, 1); }
  menuPage('harita'); o.map = see(/Koruya gir/) && see(/Üç Diyar/) && document.querySelectorAll('.mc').length === 1 && document.querySelectorAll('.rota li').length === 3;
  return o;
});
ok('menü sayfaları: Oyna, kahraman, harita, kadro gezinmesi', vis.ana && vis.pg0 === 'ana' && vis.hero && vis.nav === 'kemik/tulpar' && vis.map, vis);
// kumanda menüde: kapalı meydan okuma listesi, ayarlardaki kaydırıcı ve onay kutuları (eskiden yalnız düğme ve kartlara odaklanılıyordu)
const gp = await pg.evaluate(() => {
  window.__pad = { connected: true, axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false })) };
  const tick = n => { for (let i = 0; i < n; i++) padTick(1 / 60) },
    press = (i, n) => { __pad.buttons[i].pressed = true; tick(n || 1); __pad.buttons[i].pressed = false; tick(1) },
    act = () => document.activeElement,
    seek = sel => { for (let n = 0; n < 150; n++) { if (act().matches(sel)) return n; press(13) } return -1 };
  tick(1);
  const o = { hid: padItems().some(e => e.closest('.chl')) };
  o.sum = seek('summary'); press(0); o.open = act().parentNode.open;
  press(13); o.inL = !!act().closest('.chl'); const ak = e => e && e.dataset && e.dataset.act ? e.dataset.act + '|' + (e.dataset.a || '') : null; const key = ak(act());
  press(0); o.chal = MSEL.chal; o.kept = act().isConnected && ak(act()) === key;
  press(0); o.chal2 = MSEL.chal; o.back = act().tagName;
  settings(); o.rng = seek('input[type=range]');
  const r = act(), k0 = SET.rtw, lab = r.parentNode.querySelector('b').textContent;
  press(15); o.step = +(SET.rtw - k0).toFixed(2); o.lab = r.parentNode.querySelector('b').textContent !== lab; o.same = act() === r;
  press(15, 70); o.hold = Math.round((SET.rtw - k0) * 10);
  __pad.axes[0] = -1; tick(1); __pad.axes[0] = 0; tick(1); o.stick = Math.round((SET.rtw - k0) * 10);
  press(13); o.left = act() !== r;
  o.chk = seek('input[type=checkbox]'); const c0 = act().checked, n0 = SET.nk;
  press(0); o.tog = act().checked !== c0 && SET.nk !== n0; press(0); o.tog2 = act().checked === c0;
  o.tab = seek('.tabs button:nth-child(3)'); const tk = ak(act());
  press(0); o.tabKept = setPg === 'ses' && act().isConnected && ak(act()) === tk; o.pad = document.documentElement.classList.contains('pad');
  // yön ve A aynı karede: odak yokken çökmez, eski denetimi değil yeni odaklananı (ilk sekme) tıklar
  document.activeElement.blur(); __pad.buttons[13].pressed = __pad.buttons[0].pressed = true;
  try { tick(1); o.both = setPg === 'oyun' && ak(act()) === 'setTab|["oyun"]' } catch (e) { o.both = e.message }
  __pad.buttons[13].pressed = __pad.buttons[0].pressed = false; tick(1);
  SET.rtw = k0; press(1); o.S = S; o.pg = menuPg; // B: ayarlardan çık
  press(1); o.bPg = menuPg; press(1); o.bPg2 = menuPg; press(1); o.bPg3 = menuPg; menuPage('kahraman'); menuPage('harita');
  window.__pad = null; tick(1);
  return o;
});
ok('kumanda: açılır liste, kaydırıcı, onay kutusu, B ile geri', gp.both === true && gp.bPg === 'kahraman' && gp.bPg2 === 'ana' && gp.bPg3 === 'ana' && !gp.hid && gp.sum >= 0 && gp.open && gp.inL && gp.chal && gp.kept && gp.chal2 === '' && gp.back === 'SUMMARY' && gp.rng >= 0 && gp.step === .1 && gp.lab && gp.same && gp.hold >= 4 && gp.stick === gp.hold - 1 && gp.left && gp.chk >= 0 && gp.tog && gp.tog2 && gp.tab >= 0 && gp.tabKept && gp.pad && gp.S === 'menu' && gp.pg === 'harita', gp);
// kullanıcı geri bildirimi turu: ayarlar penceresi sabit boyutlu, makam herkese açık, müzik sıfırda yankı da susar, yeni menü
const fb = await pg.evaluate(() => {
  const o = {}; settings(); const hs = [];
  for (const t of ['oyun', 'goruntu', 'ses', 'arayuz', 'kontrol', 'gelismis']) { setTab(t); const r = document.querySelector('.setp').getBoundingClientRect(); hs.push(Math.round(r.height) + ':' + Math.round(r.top)) }
  o.fixed = new Set(hs).size === 1; o.hs = hs[0]; o.noan = OV.className.includes('noan');
  setTab('ses'); const mk = [...document.querySelectorAll('.seg button')].filter(b => /Hicaz|Rast|Segâh|Nihavend|Hüseyni/.test(b.textContent));
  o.mkOpen = mk.length === 5 && mk.every(b => !b.disabled);
  const mk0 = SET.mk; mk.find(b => /Rast/.test(b.textContent)).click(); o.mk = SET.mk; o.cur = curMakam(); SET.mk = mk0;
  aInit(); if (AC) { const m0 = SET.mus; SET.mus = 0; aVol(); o.mus0 = MUB.gain.value === 0 && RVMG.gain.value === 0; SET.mus = m0; aVol(); o.mus1 = RVMG.gain.value > 0 } else o.mus0 = o.mus1 = 'ses yok';
  setPg = 'oyun'; closeSet();
  menuPage('ana'); o.home = document.querySelectorAll('.mnav2 .mi').length; menuPage('kahraman'); o.tiles = document.querySelectorAll('.hg2 .hc').length === heroIdx().length && !!document.querySelector('.hinf h3');
  const w0 = document.querySelector('.hc.on').getBoundingClientRect().width; o.tile = Math.round(w0); menuPage('harita');
  return o;
});
ok('geri bildirim: sabit ayar penceresi, makam seçimi, müzik sıfırı, yeni menü', fb.fixed && fb.noan && fb.mkOpen && fb.mk === 'rast' && fb.cur === 'rast' && fb.mus0 && fb.mus1 && fb.home === 5 && fb.tiles && fb.tile >= 44, fb);
const box = await pg.locator('text=Koruya gir').boundingBox();
await pg.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
await sleep(1500);
ok('fare tıklamasıyla oyun başladı', await pg.evaluate(() => S === 'play'));
// shader ön-derleme menüde bitmiş olmalı; koşu boyunca yeni program derlenmemeli
await pg.waitForFunction(() => warmMs != null && !WARMG, null, { timeout: 60000 }).catch(() => {});
const warm0 = await pg.evaluate(() => ({ ms: warmMs, left: !!WARMG, prog: R.info.programs.length }));
ok('shader ön-derleme bitti', warm0.ms != null && !warm0.left && warm0.prog >= 30, warm0);

// birkaç saniye oyna: yürü, seviye kartlarını seç
const st0 = await pg.evaluate(() => P.stT);
for (let s = 0; s < 8; s++) {
  await pg.keyboard.down('wdsa'[s % 4]);
  for (let j = 0; j < 4; j++) {
    await sleep(250);
    const sv = await pg.evaluate(() => S);
    if (sv === 'choice') await pg.keyboard.press('1'); else if (sv === 'item') await pg.keyboard.press('e');
  }
  await pg.keyboard.up('wdsa'[s % 4]);
}
const st1 = await pg.evaluate(() => P.stT);
ok('oyun saati ilerliyor', st1 > st0, { from: +st0.toFixed(2), to: +st1.toFixed(2) });
await pg.screenshot({ path: out + '/2_play.png', timeout: 90000 });

// stat motoru: katmanlar ve aşırı kritik
const sm = await pg.evaluate(() => {
  const I0 = P.I, SB0 = P.SB; P.I = {}; P.SB = {}; calc(); const base = P.C.dmg;
  P.I = { bileki: 1, kalp: 1 }; P.SB = { 'dmg*': .15 }; calc(); const d = P.C.dmg, hp = P.C.hp;
  P.I = I0; P.SB = SB0; calc();
  return { d, exp: (base + ITD.bileki.fx.dmg + ITD.kalp.fx.dmg) * 1.15, hp, c2: critMul({ crit: 2.5, critd: 2 }, .9), c1: critMul({ crit: 1, critd: 2 }, .5), c0: critMul({ crit: .05, critd: 2 }, .9) };
});
ok('stat motoru katmanları', Math.abs(sm.d - sm.exp) < 1e-6 && sm.c2 === 4 && sm.c1 === 2 && sm.c0 === 1, sm);

// durum efektleri: yanma hasar verir, donma durdurur, zehir yığılır, kan izi hasarı artırır
const stt = await pg.evaluate(() => {
  P.inv = 1e9; spawn(2, { x: P.x + 20, z: P.z + 20 }); const e = E[E.length - 1]; const hp0 = e.hp;
  addStatus(e, 'burn', { d: 4, t: 3 }); for (let i = 0; i < 60; i++) stTick(e, 1 / 60); const afterBurn = e.hp;
  addStatus(e, 'frz', { t: 1 }); const mvF = stMove(e), actF = stActs(e); for (let i = 0; i < 90; i++) stTick(e, 1 / 60); const mvAfter = stMove(e);
  addStatus(e, 'poi', { n: 3, d: 1, t: 2 }); addStatus(e, 'poi', { n: 2 }); const stacks = e.poiN;
  const C0 = P.C; P.C = { ...C0, crit: 0, elite: 1, fire: 2, ls: 0, burn: 0, freeze: 0 };
  const h1 = e.hp; hurtE(e, 10, 1, { el: 'fire', dot: 1 }); const dFire = h1 - e.hp;
  addStatus(e, 'blood'); const h2 = e.hp; hurtE(e, 10, 1, { dot: 1 }); const dBlood = h2 - e.hp; P.C = C0;
  e.hp = 0; killE(e); E = E.filter(x => !x.dead);
  return { burned: +(hp0 - afterBurn).toFixed(2), mvF, actF, mvAfter, stacks, dFire, dBlood: +dBlood.toFixed(2) };
});
ok('durum efektleri', stt.burned > 3 && stt.mvF === 0 && stt.actF === false && stt.mvAfter === .5 && stt.stacks === 5 && stt.dFire === 20 && stt.dBlood === 12, stt);

// eşya kancaları: tekil sınırı, kazan filtresi, ölümde patlama kancası
const ih = await pg.evaluate(() => {
  const I0 = { ...P.I }; P.I = {};
  ITD.pul.u = 1; const a1 = addItem('pul'), a2 = addItem('pul'); const cnt = P.I.pul; const kz = kzOk('pul'); delete ITD.pul.u;
  spawn(0, { x: P.x + 30, z: P.z + 30 }); spawn(0, { x: P.x + 31, z: P.z + 30 }); const e1 = E[E.length - 2], e2 = E[E.length - 1]; const h0 = e2.hp;
  const C0 = P.C; P.C = { ...C0, expl: 1, dmg: 1, crit: 0, elite: 1, ls: 0, burn: 0, freeze: 0 };
  fireHook('kill', { e: e1, q: e1.m.position }); const dmg = +(h0 - e2.hp).toFixed(2); P.C = C0;
  let hits = 0; IH.__t = { hit(c) { c.d *= 2; hits++ } }; P.I.__t = 1; const r = fireHook('hit', { e: e2, d: 5 }).d; delete P.I.__t; delete IH.__t;
  for (const e of [e1, e2]) { e.hp = 0; killE(e) } E = E.filter(e => !e.dead); P.I = I0; calc();
  return { a1, a2, cnt, kz, dmg, hits, r };
});
ok('eşya kancaları', ih.a1 === 1 && ih.a2 === 0 && ih.cnt === 1 && ih.kz === false && ih.dmg === 10 && ih.hits === 1 && ih.r === 10, ih);

// nadirlik formülü, seviye tavanı, kayıt göçü
const rr = await pg.evaluate(() => {
  const w0 = rarWeights(0), w1 = rarWeights(12);
  const leg0 = w0[4] / w0.reduce((a, b) => a + b), leg1 = w1[4] / w1.reduce((a, b) => a + b);
  const C0 = P.C; P.C = { ...C0, luck: 0 }; const r0 = rollR(.5), rz = rollR(0); P.C = { ...C0, luck: 100 }; const rl = rollR(.5); P.C = C0;
  const W0 = P.W.map(w => w.lv); P.W[0].lv = P.wmax; const opts = luOpts().filter(o => o.kind === 'Silah yükseltmesi' && o.name === WD[P.W[0].k].n).length; P.W[0].lv = W0[0];
  const pr = l => { const w = itemRarW(l), t = w.reduce((a, b) => a + b); return w.map(x => +(x / t).toFixed(3)) };
  const ir0 = pr(0), ir1 = pr(1);
  const m = migrateMeta({ s: 42, u: { dmg: 2 }, st: { k: 5 } });
  return { ir0, ir1, leg0: +leg0.toFixed(4), leg1: +leg1.toFixed(3), r0, rz, rl, opts, mv: m.v, ms: m.s, mu: m.u.dmg, mk: m.st.k, mr: m.st.r, rank: typeof m.rank };
});
// aşama bossu canı aşamayla büyür (profil canı × BOSS_ST); kademe çarpanının karekökü Megabonk hasar oranlarını verir
const bh = await pg.evaluate(() => {
  const s0 = P.stage, S0 = P.stS, hp = [], want = [];
  P.stS = P.stT; // aşamanın ilk anı: süre çarpanı 1
  for (const st of [0, 1, 2]) { P.stage = st; spawn(3, { boss: 1, twin: 1, kind: 'tepegoz', bp: BOSSP.koru[st], x: P.x + 40, z: P.z }); const b = E[E.length - 1]; hp.push(Math.round(b.mh / diffMul() / .6)); want.push(BOSSP.koru[st].hp * BOSS_ST[st]); rmE(b.m, b.u); E = E.filter(x => x !== b); }
  // çağrıldığı ana göre: aşama başından 300 sn sonra 3 kat, en çok 6 kat
  P.stage = 0; P.stS = P.stT - 300; const t3 = +bossTime().toFixed(2); spawn(3, { boss: 1, twin: 1, kind: 'tepegoz', bp: BOSSP.koru[0], x: P.x + 40, z: P.z }); const b3 = E[E.length - 1]; const hp300 = Math.round(b3.mh / diffMul() / .6); rmE(b3.m, b3.u); E = E.filter(x => x !== b3);
  P.stS = P.stT - 5000; const tMax = bossTime();
  P.stage = s0; P.stS = S0;
  return { hp, want, t3, hp300, tMax, st: BOSS_ST.join(), dmgRatio: TIERM.map(t => +Math.sqrt(t).toFixed(2)).join() };
});
ok('boss canı aşamayla büyür, kademe hasar oranı', bh.hp.join() === bh.want.join() && bh.hp[0] < bh.hp[1] && bh.hp[1] < bh.hp[2] && bh.t3 === 3 && bh.hp300 === 27000 && bh.tMax === 6 && bh.dmgRatio === '1,1.26,1.47', bh);
// can çalma: Megabonk'taki gibi hasardan bağımsız, vuruş başına 1 can şansı; %100 garanti 1, %200 garanti 2
const lsr = await pg.evaluate(() => {
  spawn(0, { x: P.x + 30, z: P.z }); const e = E[E.length - 1]; e.mh = e.hp = 1e9;
  const C0 = P.C, run = ls => { P.C = { ...C0, ls, crit: 0, burn: 0, freeze: 0 }; const c0 = P.c.lsheal || 0; for (let i = 0; i < 20; i++) hurtE(e, 500, 1, { src: 'test' }); return (P.c.lsheal || 0) - c0 }; // src: eşya kancaları çalışmaz, sonraki kontroller etkilenmez
  const out = { z: run(0), one: run(1), two: run(2) };
  // kesirli pay: zar sabitlenir (0.25 her vuruşta tutar, 0.75 hiç tutmaz), sonra geri alınır
  const R0 = Math.random; Math.random = () => .25; out.hit = run(.5); Math.random = () => .75; out.miss = run(.5); Math.random = R0;
  P.C = C0; rmE(e.m, e.u); E = E.filter(x => x !== e);
  return out;
});
ok('can çalma: vuruş başına 1 can şansı', lsr.z === 0 && lsr.one === 20 && lsr.two === 40 && lsr.hit === 20 && lsr.miss === 0, lsr);
// vuruş kancası hedefi öldürürse (Buz Küpü kendi hasarını aynı düşmana vurur) dıştaki vuruş onu ikinci kez öldürmez
const dk = await pg.evaluate(() => {
  const I0 = P.I, R0 = Math.random;
  spawn(0, { x: P.x + 30, z: P.z }); const e = E[E.length - 1]; e.mh = e.hp = 5;
  const C0 = P.C; P.C = { ...C0, ls: 1, crit: 0 };
  P.I = { buzkup: 1 }; Math.random = () => .01; // zar sabit: Buz Küpü her vuruşta tetiklenir
  const k0 = kills, ks0 = P.c.k_slash || 0, l0 = P.c.lsheal || 0; hurtE(e, 50, 1, { w: 'slash' });
  Math.random = R0; P.I = I0; P.C = C0;
  // öldürme vuran silaha sayılır ve vuruşun can çalması kaybolmaz
  const out = { kills: kills - k0, dead: !!e.dead, slash: (P.c.k_slash || 0) - ks0, ls: (P.c.lsheal || 0) - l0 }; E = E.filter(x => !x.dead);
  return out;
});
ok('vuruş kancası öldürünce çifte öldürme olmaz', dk.kills === 1 && dk.dead && dk.slash === 1 && dk.ls === 1, dk);
// hata avından çıkanlar: eşya sayaçları NaN olmaz, Kara Kefen'in can çarpanı uygulanır, dokunmatik Kullan düğmesi var
const hb = await pg.evaluate(() => {
  const out = {};
  // Erlik Ruhu / Erlik Kanı: 25 öldürme kancasından sonra sayaçlar sayı
  const I0 = P.I, IS0 = P.IS; P.I = { erlikruh: 1, erlikkan: 1 }; P.IS = {};
  spawn(0, { x: P.x + 30, z: P.z }); const e = E[E.length - 1];
  for (let i = 0; i < 25; i++) fireHook('kill', { e });
  out.cnt = [P.IS.dsoulK, P.IS.dbloodK].join(); P.I = I0; P.IS = IS0; calc(); rmE(e.m, e.u); E = E.filter(x => x !== e);
  // Kara Kefen: boss sınıfında da hk çarpanı
  spawn('kefen', { x: P.x + 60, z: P.z, hk: 1e7, dk: 30, nm: 'Kara Kefen', mini: 1, nodrop: 1 }); const k = E[E.length - 1]; out.kefen = k.mh > 1e9; rmE(k.m, k.u); E = E.filter(x => x !== k);
  out.be = !!document.getElementById('be');
  return out;
});
ok('hata avı: sayaçlar, Kara Kefen, Kullan düğmesi', hb.cnt === '25,25' && hb.kefen && hb.be, hb);
// Cellat Palası: ara boss ve bossta infaz kesin değil, %2 şansla azami canın %2'si (zar sabitlenir)
const dx = await pg.evaluate(() => {
  const R0 = Math.random, hit = r => {
    spawn(0, { x: P.x + 40, z: P.z, mini: 1 }); const e = E[E.length - 1]; e.mh = e.hp = 1e6; const q = e.m.position;
    Math.random = () => r;
    mkProj(q.x, q.y + e.r, q.z, { c: 0xc8d0e0, sz: .8, long: 1 }, { vx: 0, vy: 0, vz: .01, l: 1, d: 1, prc: 3, exec: .12, o: { w: 'dexe' } });
    w2Upd(1 / 60); Math.random = R0;
    const lost = 1e6 - e.hp; for (const b of B2) kill(b.m); B2.length = 0; rmE(e.m, e.u); E = E.filter(x => x !== e);
    return lost;
  };
  return { miss: hit(.5), proc: hit(.01), ch: EXEC_BOSS };
});
ok('Cellat Palası bossta şansa bağlı', dx.miss < 1000 && dx.proc >= 20000 && dx.ch === .02, dx);
// ikinci hata avı: boş eşya havuzu, boş kart ekranı, Keloğlan, Kalkan, Gölge armağanı, yardım penceresi
const h2 = await pg.evaluate(() => {
  const out = {};
  // sıradan eşyaların hepsi Toggler ile kapalıyken itemOf sonsuz özyinelemeye girmez
  const o0 = META.opt; META.opt = {}; for (const k in ITD) if (ITD[k].r == 0) META.opt['i_' + k] = 1;
  try { const k = itemOf(0); out.item = !!ITD[k] && ITD[k].r != 0; } catch (e) { out.item = 'hata: ' + e.message.slice(0, 40); }
  META.opt = o0;
  // kart kalmayınca seçim ekranı açılmaz
  const s0 = S; choose('level', []); out.noCards = S === s0;
  // Keloğlan öldürücü darbede canı 1'e çekmez
  const I0 = P.I, hp0 = P.hp, R0 = Math.random; P.I = { keloglan: 1 }; Math.random = () => .01;
  P.hp = -5; fireHook('hurt', { d: 10 }); out.kel = P.hp; P.hp = 50; fireHook('hurt', { d: 10 }); out.kelLive = P.hp < 50 && P.hp >= 1;
  Math.random = R0; P.I = I0; P.hp = hp0;
  // Kalkan kapatılmışken darbe engellemez
  const W0 = P.W, wd0 = P.wdis, blk0 = P.c.blk, inv0 = P.inv; P.W = [newW('slash'), newW('aegis')]; P.W[1].ch = 2; P.wdis = 1; out.aegisOff = aegisHit(null); P.wdis = 0; out.aegisOn = aegisHit(null);
  for (const n of NV) kill(n.m); NV.length = 0; P.W = W0; P.wdis = wd0; P.inv = inv0; if (blk0 == null) delete P.c.blk; else P.c.blk = blk0; // sayaç sonraki Kalkan kontrolünü etkilemesin
  // Gölge: eski kayıtta armağan, yeni sürüm kaydında yok
  out.gOld = migrateMeta({ v: 5, st: { r: 3 } }).l.golge === 1; out.gNew = migrateMeta({ v: META_V, st: { r: 3 } }).l.golge == null;
  return out;
});
ok('ikinci hata avı: eşya havuzu, kartlar, Keloğlan, Kalkan, Gölge', h2.item === true && h2.noCards && h2.kel === -5 && h2.kelLive && h2.aegisOff === false && h2.aegisOn === true && h2.gOld && h2.gNew, h2);
// üçüncü hata avı: ulaşılamayan kilitler ve tüccar
const h3 = await pg.evaluate(() => {
  const out = {};
  // Kalkan dalgası 'aegis' etiketiyle vurur (Şaman Maskesi görevi buna bakar)
  const W0 = P.W, blk0 = P.c.blk, inv0 = P.inv; P.W = [newW('aegis')]; P.W[0].ch = 1; aegisHit(null); out.nvW = NV.length ? NV[NV.length - 1].w : null;
  for (const n of NV) kill(n.m); NV.length = 0; P.W = W0; P.inv = inv0; if (blk0 == null) delete P.c.blk; else P.c.blk = blk0;
  // Kaval kilitsiz; Hortlak Feneri görevi Dev Hortlak sayacıyla tamamlanır
  out.kaval = !ITD.kaval.lock && !QD.find(q => q.k == 'i_kaval').ul;
  const c0 = P.c.hortlak; P.c.hortlak = 1; out.fener = QD.find(q => q.k == 'i_hortlakfener').f()[0] >= 1; if (c0 == null) delete P.c.hortlak; else P.c.hortlak = c0;
  // aynı aşamada iki Kara sunak: Zaman Büküğü sayacı artar
  const bc0 = P.c.bc2 || 0, cur0 = P.bossCur, curN0 = P.bossCurN; P.bossCur = 0; P.bossCurN = 0;
  { const ks = SH.filter(s => s.t === 6 && !s.d); out.kara = ks.length; const u0 = P.shUsed; for (const k of ks.slice(0, 2)) useShrine(k); P.shUsed = u0; out.bc2 = (P.c.bc2 || 0) - bc0; P.bossCur = cur0; P.bossCurN = curN0; } // haritadaki iki sunak kullanılır; yenisi kurulmaz (engel eklemesin)
  // tüccar: zaten sahip olunan tekil eşya satılmaz, altın kesilmez
  const uk = Object.keys(ITD).find(k => ITD[k].u && !ITD[k].q), I0 = P.I, g0 = P.gold, sN = shopN, s0 = S;
  P.I = { ...I0, [uk]: 1 }; P.gold = 9999; shopN = { offer: [{ k: uk, pr: 10 }], m: SH[0].m }; S = 'shop'; buy(0); out.shop = { gold: P.gold, d: !!shopN && !shopN.d };
  shopN = sN; S = s0; P.I = I0; P.gold = g0;
  return out;
});
ok('üçüncü hata avı: Kalkan etiketi, kilitler, Kara sunak, tüccar', h3.nvW === 'aegis' && h3.kaval && h3.fener && h3.kara >= 2 && h3.bc2 === 1 && h3.shop.gold === 9999 && h3.shop.d, h3);
// sandık eşyası: Megabonk'un dört kademeli ağırlıkları 70/15/6/1.5; şans yokken %75.7/%16.2/%6.5/%1.6, %100 şansta Efsanevi %4.7
ok('sandık eşya nadirliği', rr.ir0.join() === '0.757,0,0.162,0.065,0.016' && rr.ir1[4] === .047 && rr.ir1[1] === 0, { ir0: rr.ir0, ir1: rr.ir1 });
ok('nadirlik, tavan, kayıt göçü', rr.leg0 < .02 && rr.leg1 > .3 && rr.r0 === 0 && rr.rz === 0 && rr.rl === 4 && rr.opts === 0 && rr.mv >= 4 && rr.ms === 42 && rr.mu === 2 && rr.mk === 5 && rr.mr === 0 && rr.rank === 'object', rr);

// Faz 2: her silah hasar veriyor, Kalkan engelliyor, kalkan puanı, diken, Kaos Tomu, kilitler
const wp = await pg.evaluate(() => {
  const clean = () => { for (const e of E.slice()) { e.hp = 0; killE(e) } E = E.filter(e => !e.dead); for (const d of DY) d.t = 0; fxUpd(.016);
    for (const a of [B, B2, AX, BO, FB, PZ, ZN2, NV, VXS]) { for (const o of a) kill(o.m); a.length = 0 } for (const o of SLS) kill(o.m); SLS = []; for (const o of G) o.c = 1; G = []; gSync(); P.xp = 0; if (S === 'choice') back(); S = 'play' };
  const W0 = P.W, out = {}; P.inv = 1e9; K.w = 1;
  for (const k of Object.keys(WD)) {
    if (k === 'aegis') continue;
    P.W = [newW(k)]; P.W[0].s.cd = .15; P.W[0].t = 0;
    for (let i = 0; i < 30; i++) spawn(0, { x: P.x + rn(-5, 5), z: P.z + rn(-5, 5) });
    const k0 = kills, hp0 = E.reduce((a, e) => a + e.hp, 0);
    for (let i = 0; i < 180; i++) { upd(1 / 60); P.xp = 0; if (S === 'choice') back() }
    const hp1 = E.filter(e => !e.dead).reduce((a, e) => a + e.hp, 0);
    out[k] = kills - k0 + (hp0 - hp1 > .5 ? 1 : 0);
    clean();
  }
  K.w = 0;
  // Kalkan (aegis) darbeyi engeller
  P.W = [newW('aegis')]; upd(1 / 60); spawn(0, { x: P.x + 30, z: P.z }); const e = E[E.length - 1];
  const C0 = P.C; P.C = { ...C0, eva: 0, block: 0 }; P.inv = 0; P.shieldT = 0; const h0 = P.hp; hurtP(40, e); const aeg = { same: P.hp === h0, nv: NV.length > 0, blk: P.c.blk, ch: P.W[0].ch };
  // kalkan puanı ve diken
  P.inv = 0; P.SB.shield = 30; P.SB.thorns = 15; calc(); P.C.eva = 0; P.C.block = 0; P.W = []; P.noDmgT = 10; for (let i = 0; i < 150; i++) upd(1 / 60);
  const shd0 = +P.shd.toFixed(1); P.inv = 0; const eh = e.hp, h1 = P.hp; hurtP(10, e); const sh = { shd0, shd1: +P.shd.toFixed(1), hpSame: P.hp === h1, thorn: +(eh - e.hp).toFixed(1) };
  delete P.SB.shield; delete P.SB.thorns; calc(); P.C = C0; P.W = W0;
  // Kaos Tomu ve kilitler
  const T0 = P.T; P.T = []; const o = mkOpt({ t: 'tn', k: 'chaos' }); o.apply(); const ch = P.T[0]; const chaos = { k: ch.k, fx: Object.keys(ch.fx).length }; P.T = T0; calc();
  const opts = []; for (let i = 0; i < 40; i++) for (const x of luOpts()) opts.push(x.key);
  const locked = opts.filter(x => x === 'rifle' || x === 'axe' || x === 't_cnt' || x === 't_chaos').length;
  clean(); P.inv = 1e9;
  return { out, aeg, sh, chaos, locked, nW: Object.keys(WD).length, nT: Object.keys(TDF).length, nQ: QD.length };
});
const dead = Object.entries(wp.out).filter(([, v]) => !(v > 0)).map(([k]) => k);
ok('her silah hasar veriyor (' + wp.nW + ' silah)', dead.length === 0, dead.length ? { dead } : wp.out);
ok('Kalkan darbeyi engelliyor', wp.aeg.same && wp.aeg.nv && wp.aeg.blk === 1, wp.aeg);
// 10 ham hasar Alp'in zırhıyla ~9.1'e iner ve kalkandan düşer
ok('kalkan puanı ve diken', wp.sh.shd0 === 30 && wp.sh.shd1 > 20 && wp.sh.shd1 < 22 && wp.sh.hpSame && wp.sh.thorn === 15, wp.sh);
ok('Kaos Tomu ve kilitli içerik havuzda yok', wp.chaos.k === 'chaos' && wp.chaos.fx === 1 && wp.locked === 0 && wp.nT === 27 && wp.nW === 32, { chaos: wp.chaos, locked: wp.locked, nW: wp.nW, nT: wp.nT, nQ: wp.nQ });

// Faz 3: her eşyanın kancaları hatasız çalışıyor (şans tabanlılar zorlanmış ve normal), hesap kancaları doğru
const it = await pg.evaluate(() => {
  const clean = () => { for (const e of E.slice()) { e.hp = 0; killE(e) } E = E.filter(e => !e.dead); for (const d of DY) d.t = 0; fxUpd(.016); for (const a of [B, B2, ZN2, NV, FB]) { for (const o of a) kill(o.m); a.length = 0 } for (const o of G) o.c = 1; G = []; gSync(); P.xp = 0; if (S === 'choice') back(); S = 'play' };
  const I0 = P.I, T0 = P.T, SB0 = { ...P.SB }, rnd = Math.random, fails = {}, ran = {}, ch0 = CH.length;
  P.I = {}; P.T = []; P.inv = 1e9; calc();
  for (const k of Object.keys(ITD)) {
    if (ITD[k].q) continue;
    try {
      P.I = {}; P.IS = {}; addItem(k); addItem(k);
      for (let i = 0; i < 10; i++) spawn(0, { x: P.x + rn(-4, 4), z: P.z + rn(-4, 4) });
      const e = E[E.length - 1];
      for (const force of [1, 0]) {
        if (force) Math.random = () => 0; else Math.random = rnd;
        P.inv = 0; P.shieldT = 0; P.hp = P.mh * .4;
        fireHook('hit', { e, d: 10, el: null }); fireHook('crit', { e, d: 20, cm: 2 }); fireHook('kill', { e, q: e.m.position });
        fireHook('hurt', { d: 5, src: e }); fireHook('evade', { src: e }); fireHook('pick', { ty: 'xp', v: 3, q: e.m.position }); fireHook('shrine', { s: SH[0] }); fireHook('stage', { sh: 0, pots: 0 }); fireHook('level', { lv: 2 }); fireHook('pot', { q: e.m.position });
        for (let i = 0; i < 120; i++) { if (E.length < 3) spawn(0, { x: P.x + 3, z: P.z + 3 }); upd(1 / 60); P.xp = 0; if (S === 'choice') back() }
        P.inv = 1e9;
      }
      Math.random = rnd; calc(); ran[k] = 1;
    } catch (err) { Math.random = rnd; fails[k] = String(err.message || err).slice(0, 80) }
    itemsClear(); clean(); while (CH.length > ch0) kill(CH.pop().m); // zorlanmış şans her öldürmede sandık düşürür
  }
  Math.random = rnd;
  // hesap kancaları
  P.I = {}; P.IS = {}; calc(); const arm0 = P.C.arm, th0 = P.C.thorns, wm0 = P.wmax, tm0 = P.tmax, dmg0 = P.C.dmg;
  addItem('dikenlikalkan'); const th1 = +(P.C.thorns - th0).toFixed(2), expTh = +(200 * P.C.arm).toFixed(2);
  P.I = {}; addItem('kazan'); addItem('kazan'); const wm = P.wmax - wm0, tm = P.tmax - tm0;
  P.I = {}; addItem('kulah'); const tm2 = P.tmax - tm0;
  P.I = {}; const tt0 = P.tt; P.tt = 125; addItem('kumsaati'); const dk = +(P.C.dmg - dmg0).toFixed(3); P.tt = tt0;
  P.I = {}; addItem('gogusluk'); const cap = hpCap() / P.mh; P.hp = P.mh; heal(1e9); const over = +(P.hp / P.mh).toFixed(2);
  P.I = I0; P.T = T0; P.SB = SB0; P.IS = {}; calc(); P.hp = Math.min(P.hp, P.mh); clean(); P.inv = 1e9;
  return { fails, n: Object.keys(ran).length, th1, expTh, wm, tm, tm2, dk, cap: +cap.toFixed(2), over, nI: Object.keys(ITD).length };
});
ok('her eşyanın kancaları çalışıyor (' + it.n + ' eşya)', Object.keys(it.fails).length === 0, Object.keys(it.fails).length ? it.fails : { n: it.n, nI: it.nI });
ok('eşya hesap kancaları', it.th1 === it.expTh && it.wm === 19 && it.tm === 0 && it.tm2 === 10 && Math.abs(it.dk - .16) < 1e-6 && it.cap === 1.75 && it.over === 1.75, it);

// Faz 4: etkin kadronun 8 karakter modeli kuruluyor (CR kayıt uyumu için 21 girdi tutar), kostüm ve şapka bağlanıyor,
// rütbe, pasifler, satın alma, kadro gezinmesi kaldırılanları atlıyor
const hr = await pg.evaluate(() => {
  const out = { cr: CR.length, n: heroIdx().length, built: 0, fails: [] };
  for (const i of heroIdx()) { try { const u = hero(i, '', ''); if (u.g && u.m && u.b.hd) out.built++; else out.fails.push(CR[i].k); skFree(u); } catch (e) { out.fails.push(CR[i].k + ':' + String(e.message).slice(0, 40)) } }
  const c0 = hero(0, '', ''); const a0 = c0.m.geometry.attributes.color.array[0]; skFree(c0);
  const cg = hero(0, 'gold', ''); const a1 = cg.m.geometry.attributes.color.array[0]; skFree(cg); out.skin = a0 !== a1;
  META.hat.tac = 1; const ch = hero(0, '', 'tac'); out.hat = !!ch.hat && ch.hat.parent === ch.b.hd; skFree(ch); delete META.hat.tac;
  META.rank.alp = 0; out.r1 = rankOf(0); META.rank.alp = 20 + 57 + 104 + 160 + 1; out.r5 = rankOf(0); META.rank.alp = 1e9; out.r100 = rankOf(0); META.rank.alp = 0;
  // Gölge pasifi: kaçınılan saldırıyı yapan düşman infaz edilir
  const ci0 = CI; CI = CR.findIndex(c => c.k === 'golge'); spawn(0, { x: P.x + 30, z: P.z }); const e = E[E.length - 1]; fireHook('evade', { src: e }); out.exec = !!e.dead; E = E.filter(x => !x.dead); CI = ci0;
  // Çalı pasifi (Bullseye): işaretli düşmana vurunca çevresi patlar, işaret bir kez çalışır, patlama zincirlemez
  {
    const E0 = E, sn = () => sc.children.filter(o => o.isSprite && o.material.depthTest === false).length;
    CI = CR.findIndex(c => c.k === 'cali');
    spawn(0, { x: P.x + 8, z: P.z }); const a = E[E.length - 1]; spawn(0, { x: P.x + 9.5, z: P.z }); const b = E[E.length - 1];
    spawn(0, { x: P.x + 22, z: P.z }); const far = E[E.length - 1];
    for (const x of [a, b, far]) x.mh = x.hp = 1e6;
    E = [a]; P.bullT = 0; heroHook('tick', { dt: .016 }); const marked = sn();
    E = [a, b, far]; const c0 = P.c.bull || 0;
    hurtE(a, 10, 0, { w: 'sniper' }); const d1 = 1e6 - b.hp, f1 = 1e6 - far.hp, n1 = (P.c.bull || 0) - c0, left = sn();
    hurtE(a, 10, 0, { w: 'sniper' }); const d2 = 1e6 - b.hp - d1;
    out.bull = { marked, d1: d1 > 0, far: f1, n1, left, d2 };
    for (const x of [a, b, far]) rmE(x.m, x.u);
    E = E0.filter(x => x !== a && x !== b && x !== far); bullClear(); CI = ci0;
  }
  // satın alma: koşul görevi tamamlanmış sayılır
  const s0 = META.s, l0 = META.l.tulpar, q0 = META.l.q_tulpar; META.s = 100; delete META.l.tulpar; META.l.q_tulpar = 1; buyChar('tulpar'); out.bought = !!META.l.tulpar && META.s === 100 - 19;
  if (l0) META.l.tulpar = l0; else delete META.l.tulpar; if (q0) META.l.q_tulpar = q0; else delete META.l.q_tulpar; META.s = s0; back(); S = 'play';
  out.cq = QD.filter(q => q.k.startsWith('c_')).length; out.hq = QD.filter(q => q.k.startsWith('h_')).length; out.hats = HATS.length; out.skins = SKINS.length;
  return out;
});
ok('8 karakter, kostüm, şapka, rütbe, pasif, satın alma', hr.cr === 21 && hr.n === 8 && hr.built === 8 && hr.skin && hr.hat && hr.r1 === 1 && hr.r5 === 5 && hr.r100 === 100 && hr.exec && hr.bull.marked === 1 && hr.bull.d1 && hr.bull.far === 0 && hr.bull.n1 === 1 && hr.bull.left === 0 && hr.bull.d2 === 0 && hr.bought && hr.cq === 18 && hr.hq === 28 && hr.hats === 28 && hr.skins === 7, hr);

// Faz 5: düşman türleri, boss profilleri, güçler, Mezarlık akışı
const f5 = await pg.evaluate(() => {
  const clean = () => { for (const e of E.slice()) { e.hp = 0; killE(e) } E = E.filter(e => !e.dead); for (const d of DY) d.t = 0; fxUpd(.016); for (const a of [B, B2, ZN2, NV, FB, EB, BZ]) { for (const o of a) kill(o.m); a.length = 0 } for (const o of G) o.c = 1; G = []; gSync(); P.xp = 0; if (S === 'choice') back(); S = 'play'; P.wdis = 0 };
  const out = { kinds: Object.keys(KINDS).length, pud: Object.keys(PUD).length, bio: BIO[2] && BIO[2].n, pick: typeof pickType() };
  P.inv = 1e9; clean();
  spawn('akrep', { x: P.x + 3, z: P.z }); const ak = E[E.length - 1]; const C0 = P.C; P.C = { ...C0, eva: 0, block: 0 }; P.inv = 0; P.shieldT = 0; P.poiT = 0; hurtP(5, ak); out.poi = P.poiT > 0; out.akrepFx = !!(ak.kd && ak.kd.fx.poi); P.C = C0; P.inv = 1e9; clean();
  spawn('direk', { x: P.x + 10, z: P.z }); const kk = E[E.length - 1]; const kx = kk.m.position.x; for (let i = 0; i < 60; i++) upd(1 / 60); out.staticOk = Math.abs(kk.m.position.x - kx) < .01; clean();
  spawn('kemikyumagi', { x: P.x + 12, z: P.z }); const ky = E[E.length - 1]; const kp = [ky.m.position.x, ky.m.position.z]; for (let i = 0; i < 60; i++) upd(1 / 60); out.rollMoved = Math.hypot(ky.m.position.x - kp[0], ky.m.position.z - kp[1]) > 3; clean();
  // boss profili: ikincil silah kilidi, direkler, lazer
  spawn(3, { boss: 1, kind: 'tepegoz', bp: BOSSP.koru[2], x: P.x + 20, z: P.z }); const bs = E[E.length - 1]; for (let i = 0; i < 540; i++) { upd(1 / 60); P.xp = 0; if (S === 'choice') back() } out.wdis = P.wdis; out.pylons = E.filter(e => e.kind === 'direk').length; { const f0 = P.c.fast || 0; P.stS = P.stT - 100; bs.hp = 0; killE(bs); out.fast = (P.c.fast || 0) - f0; } E = E.filter(e => !e.dead); out.wdisAfter = P.wdis; clean();
  spawn(3, { boss: 1, kind: 'erlik', bp: BOSSP.bozkir[0], x: P.x + 10, z: P.z }); for (let i = 0; i < 12; i++) upd(1 / 60); out.laser = ZP.length > 0; out.bossName = (E.find(e => e.boss) || {}).kind; clean();
  // Tengri Ateşi
  for (let i = 0; i < 20; i++) spawn(0, { x: P.x + rn(-6, 6), z: P.z + rn(-6, 6) }); const k0 = kills; mkPU(P.x + 1, P.z, 'nuke', P.y - 1); for (let i = 0; i < 5; i++) upd(1 / 60); out.nuke = kills - k0; clean();
  return out;
});
ok('düşman türleri, boss profilleri, güçler', f5.kinds >= 35 && f5.pud === 7 && f5.bio === 'Mezarlık' && f5.pick === 'string' && f5.poi && f5.akrepFx && f5.staticOk && f5.rollMoved && f5.wdis === 1 && f5.pylons >= 2 && f5.wdisAfter === 0 && f5.fast === 1 && f5.laser && f5.bossName === 'erlik' && f5.nuke >= 10, f5);
// Mezarlık: mühürlü mahzen, tabutlar, anahtarlar, Dev Hortlak
const gy = await pg.evaluate(() => {
  // Üç Diyar: Mahzen rotanın 3. aşaması; test doğrudan oraya kurar
  selMap('koru', 1); start(); P.inv = 1e9; P.stage = 2; P.map = 'mezarlik'; setupStage();
  const out = { mz: !!P.mz, arena: ARENA, coffins: SH.filter(s => s.t === 10).length };
  out.mzK = P.mzK ? { pots: P.mzK.pots.length, ch: P.mzK.ch } : null; { const c0 = cnt('mzclean'); for (const p of P.mzK.pots) p.o = 1; P.mzOpened = P.mzK.ch; for (let i = 0; i < 20; i++) upd(1 / 60); out.mzClean = cnt('mzclean') - c0; }
  for (let i = 0; i < 32; i++) { spawn(0, { x: P.x + 4, z: P.z + 4 }); const e = E[E.length - 1]; e.hp = 0; killE(e) } E = E.filter(e => !e.dead); upd(1 / 60);
  out.open = P.mz.open; out.arenaAfter = ARENA || 0;
  // gizli nesneler: Eski Maske ve Yılan yuvası haritada var, kullanınca eşya açılır ve görev sayacı artar
  { const m = SH.find(s => s.t === 18), y = SH.find(s => s.t === 19), l0 = { ...META.l }; out.hid = !!m && !!y && Math.hypot(y.m.position.x, y.m.position.z) < 28; if (m && y) { useShrine(m); useShrine(y); out.hidUl = !!META.l.eskimaske && !!META.l.yilan && cnt('oldmask') >= 1 && cnt('snek') >= 1; } META.l = { ...l0 }; }
  // tabut bekçisinin canı açıldığı ana göre büyür: (süre / 4 dk)³, 1 ile 60 arası
  const gT0 = P.stT; out.gm = [0, 240, 480, 5000].map(t => { P.stT = t; return +guardMul().toFixed(2) }).join(); P.stT = 480;
  const c = SH.find(s => s.t === 10); useShrine(c); const mb = E.find(e => e.keyDrop); out.mini = !!mb; out.gHp = mb ? Math.round(mb.mh / diffMul()) : 0; P.stT = gT0; if (mb) { mb.hp = 0; killE(mb); E = E.filter(e => !e.dead) } out.keys = P.mz.keys;
  // zamanlı ara bosslar dönüşümlü: Kemik'in Babası, Hayalet Beyi, Kemik'in Babası (13:00 / 9:00 / 3:00 kala)
  { const t0 = P.stT, ks = []; P.mbN = 0; P.swarm = 0; for (const at of MBT()) { P.stT = at - .001; const old = new Set(E); upd(1 / 60); const m = E.find(e => e.mini && !old.has(e)); ks.push(m ? m.kind : '-'); if (m) { m.hp = 0; killE(m) } } E = E.filter(e => !e.dead); P.stT = t0; P.mbN = 0; out.mbRot = ks.join(); out.mbAt = MBT().map(a => stLen() - a).join(); }
  summonBoss(); out.gateLocked = GATE.st === 0; P.mz.keys = 4; summonBoss(); out.gate = GATE.st; const b = E.find(e => e.boss); out.boss = b && b.bp && b.bp.n; out.bn = BN();
  for (const e of E.slice()) { e.hp = 0; killE(e) } E = E.filter(e => !e.dead); for (const d of DY) d.t = 0; fxUpd(.016);
  // harita yatırımı: her biyomun kendi süs seti kuruluyor (instanced mesh geometri anahtarları)
  const keys = () => { const k = new Set(); WG.traverse(c => { if (c.geometry && c.geometry.userData && c.geometry.userData.key) k.add(c.geometry.userData.key) }); return k };
  const km = keys(); out.mzKeys = ['tomb0', 'tomb1', 'tomb2', 'fence', 'lantern', 'rt_dead1', 'rt_dead4'].every(k => km.has(k)) && !km.has('spire1') && !km.has('cactus'); out.mzLm = LMS.some(l => l.t === 'kurgan') && !LMS.some(l => l.t === 'mesa'); out.mzFog = WG.children.filter(c => c.material && c.material.isShaderMaterial).length;
  start(); P.inv = 1e9; P.stage = 1; P.map = 'bozkir'; setupStage(); const kb = keys(); out.bzKeys = ['cactus', 'outcrop', 'spire1', 'agave'].every(k => kb.has(k)) && !kb.has('tomb0') && LMS.some(l => l.t === 'lostcaravan');
  selMap('koru', 3); start(); P.inv = 1e9;
  const kk = keys(); out.koKeys = ['pstone', 'rt_pine1', 'rl_pine1', 'rt_broad1', 'rl_autumn9', 'rt_dead1', 'rk_moss1', 'rg_green1', 'rb_broad1'].every(k => kk.has(k)) && !kk.has('tomb0');
  return out;
});
ok('harita süs setleri: Mezarlık, Bozkır, Koru', gy.mzKeys && gy.mzLm && gy.bzKeys && gy.koKeys, { mzKeys: gy.mzKeys, mzLm: gy.mzLm, mzFog: gy.mzFog, bzKeys: gy.bzKeys, koKeys: gy.koKeys });
ok('Mezarlık akışı', gy.mz && gy.mzK && gy.mzK.pots >= 8 && gy.mzK.ch >= 2 && gy.mzClean === 1 && gy.arena === 30 && gy.coffins === 4 && gy.open === 1 && gy.arenaAfter === 0 && gy.hid && gy.hidUl && gy.mini && gy.gm === '3,3,24,180' && gy.gHp === 1100 * 24 && gy.keys === 1 && gy.mbRot === 'baba,hayaletbeyi' && gy.mbAt === '450,150' && gy.gateLocked && gy.gate === 1 && gy.boss === 'Dev Hortlak' && gy.bn === 'Dev Hortlak', gy);

// Faz 6: görev sayısı, eşya kilitleri, Toggler, dükkân görev kapıları, meydan okumalar, başarımlar
const f6 = await pg.evaluate(() => {
  const out = { q: QD.length, chal: CHAL.length, locked: Object.keys(ITD).filter(k => ITD[k].lock).length, ach0: Object.keys(META.ach).length };
  const L0 = { ...META.l }; for (const k in META.l) if (ITD[k]) delete META.l[k];
  let leak = 0; for (let i = 0; i < 60; i++) { const k = itemOf(2); if (ITD[k].lock && !META.l[ITD[k].lock]) leak++ } out.leak = leak;
  META.l = L0;
  META.u.tg = 1; META.opt.w_bolt = 1; META.opt.t_dmg = 1; const W0 = P.W, T0 = P.T; P.W = [newW('orbit')]; P.T = []; let seen = 0; for (let i = 0; i < 40; i++) for (const o of luOpts()) if (o.key === 'bolt' || o.key === 't_dmg') seen++; out.optLeak = seen; delete META.opt.w_bolt; delete META.opt.t_dmg; delete META.u.tg; P.W = W0; P.T = T0;
  const q0 = META.q; META.q = {}; const u = MU.find(x => x.k === 'rr'); out.gate = muLocked(u); const s0 = META.s, l0 = mu('rr'); META.s = 100; buyMU('rr'); out.gateBuy = mu('rr') === l0; META.s = s0; META.q = q0;
  back(); S = 'play';
  // meydan okuma: Kırılgan tek darbede öldürür, Tek Silah bir slot, Uyuyan hareketi kilitler
  selChal('kirilgan'); start(); P.inv = 1e9; out.chalK = P.chal && P.chal.k; const C0 = P.C; P.C = { ...C0, eva: 0, block: 0, revive: 0 }; P.inv = 0; P.shieldT = 0; hurtP(1); out.fragile = S === 'over'; P.C = C0;
  selChal('teksilah'); start(); out.ws = P.ws; selChal('uyuyan'); start(); P.inv = 1e9; K.w = 1; for (let i = 0; i < 30; i++) upd(1 / 60); K.w = 0; out.afk = Math.hypot(P.vx, P.vz) < .01;
  selChal(''); start(); P.inv = 1e9;
  META.q.k500 = 1; META.ach.k500 = Date.now(); out.achHtml = /class="mrow/.test(achHTML()); delete META.q.k500; delete META.ach.k500;
  return out;
});
ok('görevler, kilitler, Toggler, dükkân kapıları, meydan okumalar', f6.q >= 141 && f6.chal === 30 && f6.locked >= 45 && f6.leak === 0 && f6.optLeak === 0 && f6.gate && f6.gateBuy && f6.chalK === 'kirilgan' && f6.fragile && f6.ws === 1 && f6.afk && f6.achHtml, f6);

// Faz 7: ayarlar, sis perdesi, konsol, silah aç/kapat, makam, parçacık saydamlığı, dokunmatik güvenliği
const f7 = await pg.evaluate(() => {
  const out = { setN: Object.keys(SET).length, mk: Object.keys(MAKAM).length };
  P.x = 0; P.z = 0; P.fog = null; fogMark(); out.fog = P.fog.reduce((a, b) => a + b, 0);
  SET.con = 1; run('altin 50'); const g0 = P.gold; run('altin 50'); out.con = P.gold === g0 + 50; run('esya yonca 2'); out.conItem = P.I.yonca === 2; delete P.I.yonca; calc(); SET.con = 0;
  const w = P.W[0]; w.off = 1; w.t = 0; const t0 = w.t; spawn(0, { x: P.x + 4, z: P.z }); upd(1 / 60); out.wOff = w.t <= 0; w.off = 0;
  VFX.setOp(.5); out.op = Math.abs((VFX.ADD.im || VFX.ADD).material.opacity - .5) < 1e-6; VFX.setOp(1);
  SET.mk = 'rast'; out.makam = curMakam(); SET.mk = 'auto'; out.makamAuto = curMakam();
  applyUI(); out.mms = getComputedStyle(document.documentElement).getPropertyValue('--mms').trim();
  for (const e of E.slice()) { e.hp = 0; killE(e) } E = E.filter(e => !e.dead);
  return out;
});
ok('ayarlar, sis perdesi, konsol, silah aç/kapat, makam', f7.setN >= 28 && f7.mk === 5 && f7.fog >= 20 && f7.con && f7.conItem && f7.wOff && f7.op && f7.makam === 'rast' && f7.makamAuto === 'hicaz' && f7.mms === '1', f7);

// Faz 8 (kalanlar): aksesuar katmanı, hareket bulanıklığı, bestiyer, meydan okuma koşulları, Mezarlık kabakları
const f8 = await pg.evaluate(() => {
  const out = {};
  const cntAcc = g => { let n = 0; g.traverse(o => { if (o.userData.acc) n++ }); return n };
  // her kahraman için aksesuar sayısı ve kemiğe bağlılık
  out.heroAcc = {};
  CR.forEach((c, i) => { if (!ACC.hero[c.k]) return; const u = hero(i, '', ''); out.heroAcc[c.k] = cntAcc(u.g); skFree(u) });
  out.heroAccN = Object.keys(out.heroAcc).length; out.heroAccOk = Object.values(out.heroAcc).every(n => n > 0);
  // düşman türleri: aksesuarlı türler ayrı havuz, serbest bırakılınca aksesuar duruyor
  const E0 = E.length; out.kindAcc = {};
  for (const k of Object.keys(ACC.kind)) { if (!KINDS[k]) { out.kindAcc[k] = 'tür yok'; continue } spawn(k, { x: P.x + 30, z: P.z }); const e = E[E.length - 1]; out.kindAcc[k] = cntAcc(e.m) + (e.u.d && e.u.d.g.userData.accN || 0) }
  out.kindAccOk = Object.values(out.kindAcc).every(n => typeof n == 'number' && n > 0);
  const e1 = E[E.length - 1], key1 = e1.u.key; e1.hp = 0; killE(e1); E = E.filter(e => !e.dead);
  spawn(Object.keys(ACC.kind).filter(k => KINDS[k]).pop(), { x: P.x + 30, z: P.z }); const e2 = E[E.length - 1];
  out.poolReuse = e2.u.key === key1 && cntAcc(e2.m) + (e2.u.d && e2.u.d.g.userData.accN || 0) === out.kindAcc[e2.kind];
  // aksesuarsız tür aksesuarlı havuzu kullanmıyor
  spawn(0, { x: P.x + 30, z: P.z }); out.plainAcc = cntAcc(E[E.length - 1].m);
  for (const e of E.slice()) { e.hp = 0; killE(e) } E = E.filter(e => !e.dead); out.E = E.length === E0;
  for (const d of DY) d.t = 0; fxUpd(.016); // ölüm gövdeleri sonraki ölçümü şişirmesin
  // hareket bulanıklığı
  out.aip = typeof AfterimagePass == 'function' && 'mb' in SET; const q0 = SET.q, b0 = SET.bl;
  SET.q = 2; SET.bl = 1; SET.mb = 1; gfxInit(); out.aipOn = !!(AIP && AIP.enabled); SET.mb = 0; mbApply(); out.aipOff = !AIP || !AIP.enabled; gfxFree(); SET.q = q0; SET.bl = b0; applyQ();
  // bestiyer
  const h = bestHTML(); out.best = (h.match(/class="mrow/g) || []).length; out.bestBoss = /Kademe 2-3/.test(h) && /Erlik/.test(h) && /final/.test(h) && !/Yargıç Erlik/.test(h);
  inc('k_kind_akrep'); out.bestSeen = /Akrep<\/b>/.test(bestHTML());
  // meydan okuma koşulları
  const ch0 = META.chal; META.chal = { a: 1, b: 1, c: 1, d: 1, e: 1, f: 1 }; const l0 = META.l.vortex; META.l.vortex = 1;
  out.gokce = QD.find(q => q.k == 'c_gokce').f().join('/'); const d0 = META.l.dagger; META.l.dagger = 1; out.tulpar = QD.find(q => q.k == 'c_tulpar').f().join('/');
  META.chal = ch0; META.l.vortex = l0; META.l.dagger = d0;
  // Mezarlık kabakları
  const bi0 = BI, m0 = P.map; BI = 2; P.map = 'mezarlik'; brkBuild(); out.kb = BRK.filter(b => b.ty == 'kb').length; BI = bi0; P.map = m0; brkBuild(); out.kbKoru = BRK.filter(b => b.ty == 'kb').length;
  out.types = typeof WD == 'object' && typeof KINDS == 'object';
  return out;
});
// Kemik, Anka, Çalı ve Tulpar kendi gövdeleriyle geldiği için aksesuarsız: 14 -> 10
ok('aksesuar katmanı: kahraman ve düşman', f8.heroAccN >= 10 && f8.heroAccOk && f8.kindAccOk && f8.poolReuse && f8.plainAcc === 0 && f8.E, f8);
ok('hareket bulanıklığı, bestiyer, meydan okuma koşulları, kabaklar', f8.aip && f8.aipOn && f8.aipOff && f8.best >= 40 && f8.bestBoss && f8.bestSeen && f8.gokce === '7/7' && f8.tulpar === '3/3' && f8.kb === 50 && f8.kbKoru === 0, f8);

// Faz 9: Megabonk eşleşme denetimi sonrası eklenenler
const f9 = await pg.evaluate(() => {
  const out = {}, C = P.C;
  // doğrusal zırh, boss delmesi, alınan hasar çarpanı, darbe sonrası koruma statı
  const hit = (d, src, arm, red, cd) => { P.inv = 0; P.shieldT = 0; P.shd = 0; C.eva = 0; C.block = 0; C.thorns = 0; C.armE = arm; C.dmgred = red; C.hurtcd = cd; P.hp = P.mh = 1000; hurtP(d, src); return { lost: 1000 - P.hp, inv: +P.inv.toFixed(2) } };
  out.arm = hit(100, null, .5, 1, 1); out.boss = hit(100, { t: 3, kd: null }, .5, 1, 1); out.red = hit(100, null, 0, .5, 2);
  C.armE = 0; C.dmgred = 1; C.hurtcd = 1; P.hp = P.mh; P.inv = 1e9;
  // Lanetli etiket, yeni tom, görev ve başarım tabloları, kayıt alanı
  out.rar = RAR.length; out.cor = ITD.kimiz.cor === 1 && ITD.kemikbacak.cor === 1; out.tBounce = !!TDF.bounce; out.nQ = QD.length; out.nA = ACHD.length; out.achv = typeof META.achv == 'object';
  out.qKeys = ['t_bounce', 'i_kemikbacak', 'ch_kirilgan', 's_alp', 'g_present'].every(k => QD.some(q => q.k == k));
  achCheck(); qCheck(); out.achK100 = !!META.q.a_k100 || !!META.achv.m_a_k100 || (META.st.k + kills) < 100;
  // Yankı durumu
  spawn(0, { x: P.x + 40, z: P.z }); const e = E[E.length - 1]; e.mh = e.hp = 1e6; addStatus(e, 'echo', { t: 3 }); const cr0 = P.C.crit; P.C.crit = 0; hurtE(e, 10, 1, { w: 'x' }); P.C.crit = cr0; out.echoQ = +e.echoQ.toFixed(2); const h0 = e.hp; stTick(e, .6); out.echoHit = +(h0 - e.hp).toFixed(2);
  // kontrol sınırı 20. dakikadan sonra
  const tt0 = P.tt; P.tt = 1800; e.ccN = 0; for (let i = 0; i < 9; i++) addStatus(e, 'stun', { t: 1 }); out.stun30 = e.ccN; P.tt = tt0; e.stunT = 0; e.ccN = 0;
  // Ayaz: aura
  const w0 = P.W.slice(); P.W = [newW('ice')]; P.W[0].t = 0; spawn(0, { x: P.x + 2, z: P.z }); const e2 = E[E.length - 1]; e2.mh = e2.hp = 1e6; weapons(1 / 60, 0); out.ice = { slow: e2.slow > 0, hp: e2.hp < e2.mh }; P.W = w0;
  // Denge taşı: en düşük seviyeli silah en yükseğe eşitlenir
  P.W = [newW('bolt'), newW('axe')]; P.W[0].lv = 5; P.W[1].lv = 1; mkSh(13); const s13 = SH[SH.length - 1]; useShrine(s13); out.balance = Object.keys(P.SB2 || {}).length; P.W = w0; calc();
  // Hediye: Noel Başlığı ve 3 eşya
  const n0 = Object.values(P.I).reduce((a, b) => a + b, 0); delete META.l.hat_noel; mkSh(14); const s14 = SH[SH.length - 1]; useShrine(s14); out.present = { hat: META.l.hat_noel === 1, items: Object.values(P.I).reduce((a, b) => a + b, 0) - n0 };
  // şapka satın alma
  META.l.hat_kulah = 1; delete META.hat.kulah; META.s = 100; buyHat('kulah'); out.hat = META.hat.kulah === 1 && META.s === 85;
  // tüccar kademesi ve indirim
  const sh = NP.find(n => n.t == 'shop'); out.tier = sh && sh.tier != null; P.C.shopp = .5; const nn = { offer: null, tier: 0 }; openShop(nn); back(); out.shopp = nn.offer.every(o => o.pr <= Math.max(5, Math.round([25, 0, 55, 100, 170][ITD[o.k].r] * (1 + P.stage * .6) * .5 / 5) * 5)); out.offer = nn.offer.map(o => [o.k, ITD[o.k].r, o.pr, P.stage]); P.C.shopp = 0;
  // düşme hasarı
  P.hp = P.mh = 1000; P.inv = 0; P.y = groundTop(P.x, P.z) + 30; P.vy = -40; P.air0 = 1; for (let i = 0; i < 90 && P.y > groundTop(P.x, P.z) + .5; i++) upd(1 / 60); out.fall = { lost: 1000 - P.hp, c: P.c.fall || 0 }; P.hp = P.mh; P.inv = 1e9;
  // tavşan zıplaması herkese açık
  P.landT = .05; P.jr = 1; P.hop = 0; K[' '] = 1; upd(1 / 60); K[' '] = 0; out.hop = P.hop;
  for (const x of E.slice()) { x.hp = 0; killE(x) } E = E.filter(x => !x.dead); for (const d of DY) d.t = 0; fxUpd(.016);
  out.setMo = 'mo' in SET; out.shd = SHD.length === 20 && SHC.length === 20;
  return out;
});
ok('Faz 9: zırh, boss delmesi, alınan hasar, darbe koruması', f9.arm.lost === 50 && f9.boss.lost === 75 && f9.red.lost === 50 && Math.abs(f9.red.inv - .3) < .01, { arm: f9.arm, boss: f9.boss, red: f9.red });
ok('Faz 9: Lanetli etiket, Sekme Tomu, görev ve başarım tabloları', f9.rar === 6 && f9.cor && f9.tBounce && f9.nQ >= 300 && f9.nA === 0 && f9.achv && f9.qKeys && f9.achK100, { rar: f9.rar, nQ: f9.nQ, nA: f9.nA, qKeys: f9.qKeys, achv: f9.achv });
ok('Faz 9: Yankı, kontrol sınırı, Ayaz aurası, Denge taşı, Hediye, şapka, tüccar, düşme, zıplama', f9.echoQ === 3 && f9.echoHit === 3 && f9.stun30 === 5 && f9.ice.slow && f9.ice.hp && f9.balance === 2 && f9.present.hat && f9.present.items === 0 && f9.hat && f9.tier && f9.shopp && f9.fall.lost > 0 && f9.fall.c === 1 && f9.hop === 1 && f9.setMo && f9.shd, f9);

// Faz 10: wiki doğrulaması sonrası eklenenler
const f10 = await pg.evaluate(() => {
  const out = {};
  out.kinds = Object.keys(KINDS).length; out.newKinds = ['gucluguly', 'gulyabanitank', 'patlayan', 'zirhliiskelet', 'kurbaga', 'maviiskelet', 'mumyatank', 'buyukakrep', 'tozluiskelet', 'zirhlitozlu', 'kafa', 'zombi'].every(k => KINDS[k]);
  // zırhlı: düz hasarın yarısı; kaçan: vurulunca uzaklaşır
  spawn('zirhliiskelet', { x: P.x + 20, z: P.z }); const z = E[E.length - 1]; z.mh = z.hp = 1000; const cr0 = P.C.crit, el0 = P.C.elite; P.C.crit = 0; P.C.elite = 1; P.air = 0; hurtE(z, 100, 1, { w: 'x' }); P.C.crit = cr0; P.C.elite = el0; out.armHalf = Math.round(1000 - z.hp);
  spawn('maviiskelet', { x: P.x + 20, z: P.z }); const b = E[E.length - 1]; b.mh = b.hp = 1000; hurtE(b, 10, 1, { w: 'x' }); out.flee = b.fleeT > 0;
  // patlayan: oyuncuya değince fitil, sonra patlar ve ölür
  spawn('patlayan', { x: P.x + 1.2, z: P.z }); const pb = E[E.length - 1]; pb.sp = 0; const h0 = P.hp = P.mh = 1000; P.inv = 0; P.C.armE = 0;
  for (let i = 0; i < 60 && !pb.dead; i++) upd(1 / 60); out.boom = { dead: !!pb.dead, lost: Math.round(h0 - P.hp) }; P.hp = P.mh; P.inv = 1e9;
  // mavi iskelet öldürünce seviye kristali bırakır
  const xv = () => G.filter(o => o.ty == 'xp').reduce((a, o) => a + o.v, 0); const g0 = xv(); b.hp = 0; killE(b); out.xpdrop = xv() - g0;
  // kurbağa öldürünce şapka sayacı
  const f0 = cnt('frog0'); spawn('kurbaga', { x: P.x + 20, z: P.z, nodrop: 1 }); const fr = E[E.length - 1]; fr.hp = 0; killE(fr); out.frog = cnt('frog0') - f0;
  // dükkân: gümüş 20 kademe, slot kapıları, Davul 5; aşama süreleri; ara boss zamanları
  out.sv = MU.find(u => u.k == 'sv').m; out.wsQn = JSON.stringify(MU.find(u => u.k == 'ws').qn); out.tsC = JSON.stringify(MU.find(u => u.k == 'ts').c); out.bb = MU.find(u => u.k == 'bb').c[0];
  const st0 = P.stage; P.stage = 0; out.len0 = stLen(); out.mbt0 = JSON.stringify(MBT()); out.swt0 = JSON.stringify(SWT()); P.stage = 2; out.len2 = stLen(); out.mbt2 = JSON.stringify(MBT()); P.stage = st0;
  // tomlar: Denge, İstifçi, Kumar; kilitler
  out.tomes = ['denge', 'istif', 'kumar'].every(k => TDF[k] && TDF[k].fxl); const T0 = P.T; P.T = []; mkOpt({ t: 'tn', k: 'kumar' }).apply(); out.kumar = P.T[0] && P.T[0].fx.dmg === .15; P.T = T0; calc();
  out.locks = !!WD.boom.lock && !!ITD.cizme.lock && !ITD.kofte.lock && !ITD.ayna.lock;
  out.q = ['w_boom', 'w_rocket', 'i_cizme', 'g_wallhug', 'g_ch30', 'h_gunes', 'h_tuccar4', 'h_silindir'].every(k => QD.some(q => q.k == k)) && !QD.some(q => q.k == 'w_scythe' || q.k == 'i_kofte');
  // Steam aynası başarımları, kostüm fiyatı, Mahzen kostümü, şapka sayısı
  out.achm = ACHM.length; out.skinCost = SKINS.map(s => s.cost).join(','); out.crypt = !!SKINS.find(s => s.k == 'crypt') && typeof CRYPT_N.alp == 'number'; out.hats = HATS.length;
  // altın Balbal ve Parlak Muz
  mkSh(1); const bal = SH[SH.length - 1]; bal.gold = 1; useShrine(bal); out.goldMoai = S === 'choice' && document.querySelectorAll('.cs .card, .cs > div').length >= 3; if (S === 'choice') back(); S = 'play';
  delete META.l.boom; mkSh(15); const muz = SH[SH.length - 1]; useShrine(muz); out.banana = META.l.boom === 1 && cnt('banana') >= 1;
  // eşya sabitleri
  out.items = ITD.yonca.fx.luck === .1 && ITD.suluk.fx['regen*'] === -.5 && !ITD.pehlivanyuzuk.fx.hp && Object.keys(ITD.altinhalka.fx).length === 0;
  // Zaman Mührü: ölümcül darbede kurtarır
  P.I.muhur = 1; delete (P.IS || {}).muhUsed; P.hp = P.mh = 100; P.inv = 0; P.shd = 0; P.C.eva = 0; P.C.block = 0; hurtP(500, null); out.muhur = { hp: P.hp, frz: P.frz > 10 }; delete P.I.muhur; P.frz = 0; P.hp = P.mh; P.inv = 1e9;
  for (const e of E.slice()) { e.hp = 0; killE(e) } E = E.filter(e => !e.dead); for (const d of DY) d.t = 0; fxUpd(.016); for (const o of G) o.c = 1; G = []; gSync();
  return out;
});
ok('Faz 10: yeni düşmanlar ve davranışları', f10.kinds >= 49 && f10.newKinds && f10.armHalf === 50 && f10.flee && f10.boom.dead && f10.boom.lost > 0 && f10.xpdrop > 0 && f10.frog === 1, f10);

// kalan açıklar: yanma formülü, Ocak 27 stat, duvar koşusu ve duvardan sıçrama
const f11b = await pg.evaluate(() => {
  const out = { sbd: SBD.length };
  spawn('gulyabani', { x: P.x + 20, z: P.z }); const e = E[E.length - 1]; addStatus(e, 'burn'); out.burn = { d: +e.burnD.toFixed(3), want: +(P.C.dmg * P.lv * .5 + 1).toFixed(3) };
  e.hp = 0; killE(e); E = E.filter(x => !x.dead);
  // önce yüksek bir engel aranır: 5 m'lik kayada oyuncu 20 karede tepeye varıyor, duvar teması kesiliyor ve sıçrama ölçülemiyordu
  const wall = h => OBS.find(o => !o.nm && o.t != null && o.t > Math.max(groundTop(o.x, o.z), groundTop(o.x, o.z + o.r + 1)) + h && o.r >= 1 && o.r < 6 && (o.b == null || o.b < groundTop(o.x, o.z) + 1));
  const o = wall(8) || wall(4);
  out.obs = !!o;
  if (o) {
    const px = P.x, pz = P.z, py = P.y; const g = groundTop(o.x, o.z + o.r + 1) + 1;
    P.x = o.x; P.z = o.z + o.r + 1; P.y = g; P.vx = P.vz = P.vy = 0; P.wrT = 1; yaw = 0; K.w = 1; S = 'play';
    for (let i = 0; i < 20; i++) upd(1 / 60);
    out.wr = { rise: +(P.y - g).toFixed(2), wr: P.wr, wrT: +P.wrT.toFixed(2) };
    K[' '] = 1; P.jr = 1; upd(1 / 60); out.wj = { vz: +P.vz.toFixed(1), vy: +P.vy.toFixed(1) }; K[' '] = 0; K.w = 0;
    P.x = px; P.z = pz; P.y = py; P.vx = P.vz = P.vy = 0;
  }
  return out;
});
ok('kalan açıklar: yanma formülü, Ocak 27 stat, duvar koşusu', f11b.sbd === 27 && f11b.burn.d === f11b.burn.want && f11b.obs && f11b.wr.rise > 1 && f11b.wr.wrT < 1 && f11b.wj.vz > 3 && f11b.wj.vy > 8, f11b);
ok('Faz 10: dükkân, aşama süreleri, tomlar, kilitler, başarım aynası, kostüm/şapka, sunaklar, eşyalar, Zaman Mührü', f10.sv === 20 && f10.wsQn === '[25,45]' && f10.tsC === '[35,135]' && f10.bb === 5 && f10.len0 === 600 && f10.len2 === 480 && f10.mbt0 === '[180,480]' && f10.mbt2 === '[90,390]' && f10.swt0 === '[240,420]' && f10.tomes && f10.kumar && f10.locks && f10.q && f10.achm >= 120 && f10.skinCost === '4,1,4,4,4,4,4' && f10.crypt && f10.hats === 28 && f10.goldMoai && f10.banana && f10.items && f10.muhur.hp === 1 && f10.muhur.frz, f10);

// Faz 11: doğrulanamayanların kararı
const f11 = await pg.evaluate(() => {
  const out = {};
  // gümüş çarpanı tavanı 8×: koşu sonu çarpanı
  // Ocak seçeneklerinde zorluk bir seçenek olabilir
  out.diffOpt = typeof sbOpt('diff', .08, 0).key == 'string' && STATS.diff != null;
  // kazan: kademe, kullanım, altın, rastgele feda
  const kz = NP.find(n => n.t == 'kazan'); out.kzTier = kz && kz.uses >= 1 && [3, 2, 1].includes(kz.uses);
  P.I = {}; addItem('yonca'); addItem('cizme'); calc(); P.gold = 1000; const g0 = P.gold; openKazan(kz); out.kzOpen = S === 'kazan';
  kzPick(0); out.kz = { gold: P.gold < g0, items: Object.values(P.I).reduce((a, b) => a + b, 0), uses: kz.uses };
  S = 'play';
  return out;
});
ok('Faz 11: zorluk seçeneği, kazan kademesi ve bedeli', f11.diffOpt && f11.kzTier && f11.kzOpen && f11.kz.gold && f11.kz.items === 2 && f11.kz.uses >= 0, f11);

// dövüş mekanikleri: Dönen Kılıçlar dibe sokulanı keser, Yıldırım çarptığı yerin çevresini çarpar, Zehir İzi dururken
// göllenip zehirler, okçu koşan oyuncunun önüne atar, dev yumruğu kalkıştan sonra iner ve geri çekilen kaçar
const cb = await pg.evaluate(() => {
  const out = {}, W0 = P.W, C0 = { eva: P.C.eva, block: P.C.block };
  const clr = () => { for (const e of E.slice()) { e.nodrop = 1; e.hp = 0; killE(e) } E = E.filter(e => !e.dead); for (const a of [EB, PZ]) { for (const o of a) kill(o.m); a.length = 0 } };
  const pin = (e, x, z) => { e.m.position.x = x; e.m.position.z = z; e.kx = e.kz = 0 };
  const fy = () => { P.y = groundTop(P.x, P.z) + 1; P.vx = P.vz = P.vy = 0 };
  K = {}; P.inv = 1e9; P.need = 1e12; fy();
  // kılıç: 1.6 m'deki düşman 3 sn içinde kesilir (eskiden yörünge 3.8 m'de, içerisi boştu)
  clr(); P.W = [newW('orbit')]; P.W[0].t = 0; P.wdmg = {};
  spawn('gulyabani', { x: P.x + 1.6, z: P.z }); let e = E[E.length - 1]; e.hp = e.mh = 1e9;
  // düşman oyuncunun zemin yüksekliğinde tutulur: eğimli bir başlangıç noktasında yükseklik farkı kılıç şeridini aşıyordu (ara sıra kalan denetim)
  for (let i = 0; i < 180; i++) { pin(e, P.x + 1.6, P.z); e.m.position.y = P.y - 1; upd(1 / 60) }
  out.orbitIn = Math.round(P.wdmg.orbit || 0);
  if (!out.orbitIn) out.orbitDbg = { S, size: +P.C.size.toFixed(2), dy: +(e.m.position.y + e.r - P.y).toFixed(2), dead: !!e.dead, wdis: P.wdis || 0 }; // ara sıra kalırsa nedeni görünsün
  // yıldırım: tek hedef sayısıyla bile 1.2 m yandaki ikinci düşman hasar alır
  clr(); P.W = [newW('zap')]; P.W[0].t = 0;
  spawn('gulyabani', { x: P.x + 8, z: P.z }); const z1 = E[E.length - 1]; spawn('gulyabani', { x: P.x + 8, z: P.z + 1.2 }); const z2 = E[E.length - 1];
  for (const o of [z1, z2]) o.hp = o.mh = 1e9;
  for (let i = 0; i < 3; i++) { pin(z1, P.x + 8, P.z); pin(z2, P.x + 8, P.z + 1.2); upd(1 / 60) }
  out.zap = [z1, z2].filter(o => o.hp < o.mh).length;
  // zehir izi: dururken 1 sn'de gölcük, üstündeki düşman zehirlenir
  clr(); P.W = [newW('poi')]; P.W[0].t = 0; fy();
  spawn('gulyabani', { x: P.x + .8, z: P.z }); e = E[E.length - 1]; e.hp = e.mh = 1e9;
  for (let i = 0; i < 80; i++) { pin(e, P.x + .8, P.z); P.vx = P.vz = 0; upd(1 / 60) }
  out.poi = { pz: PZ.length, poiN: e.poiN };
  // okçu: oyuncu yana koşarken ok, oyuncunun şu anki yerinin önüne atılır; hasar türün hasarına bağlı
  clr(); P.W = []; fy(); yaw = yawT = 0;
  spawn('okcu', { x: P.x, z: P.z - 20 }); e = E[E.length - 1]; e.hp = e.mh = 1e9; e.sh = 1;
  let b = null;
  for (let i = 0; i < 200 && !b; i++) { K = { d: 1 }; pin(e, P.x, P.z - 20); upd(1 / 60); b = EB[EB.length - 1] || null }
  K = {};
  out.arrow = b ? { lead: +(b.vx / Math.hypot(b.vx, b.vz) * Math.sign(P.vx || 1)).toFixed(2), pvx: +P.vx.toFixed(1), d: +(b.d / e.dmg).toFixed(2) } : null;
  // dev yumruğu: yerinde duran 0.6 sn'den sonra vurulur; kalkıştan hemen sonra geri çekilen vurulmaz
  P.C.eva = 0; P.C.block = 0;
  const slam = dodge => {
    clr(); fy(); P.inv = 0; P.shieldT = 0; P.mh = P.hp = 1e6;
    spawn('tasdev', { x: P.x, z: P.z - 4 }); const g = E[E.length - 1]; g.hp = g.mh = 1e9;
    let a0 = -1, hit = -1;
    for (let f = 0; f < 240; f++) { upd(1 / 60); P.hp = Math.max(P.hp, 1); if (g.ak > 0 && a0 < 0) a0 = f; if (dodge && a0 >= 0 && f == a0 + 12) P.z += 5; if (P.hp < 1e6 && hit < 0) hit = f; if (a0 >= 0 && f > a0 + 70) break }
    P.inv = 1e9;
    return { a0, dt: hit >= 0 && a0 >= 0 ? +((hit - a0) / 60).toFixed(2) : null };
  };
  out.slam = slam(0); out.dodge = slam(1);
  clr(); P.W = W0; P.C.eva = C0.eva; P.C.block = C0.block; calc(); P.hp = P.mh; K = {};
  return out;
});
ok('dövüş: kılıç dibi keser, yıldırım çevreyi çarpar, zehir dururken göllenir', cb.orbitIn > 0 && cb.zap === 2 && cb.poi.pz >= 1 && cb.poi.poiN > 0, cb);
ok('dövüş: okçu önüne atar, dev yumruğu kalkıştan sonra iner, geri çekilen kaçar', cb.arrow && cb.arrow.lead > .15 && Math.abs(cb.arrow.d - .5) < .01 && cb.slam.dt >= .6 && cb.slam.dt <= .75 && cb.dodge.dt === null && cb.dodge.a0 >= 0, { arrow: cb.arrow, slam: cb.slam, dodge: cb.dodge });

// Megabonk karşılıkları: atılma (Shift) ve kayma (C), güç listesi, Meydan okuma sunağı, Mezar taşı, Bekçi Hayalet yok, direkler
const f12 = await pg.evaluate(() => {
  const out = {};
  out.noDash = !!document.getElementById('dshf') && !!document.getElementById('bs'); // atılma geri geldi: Shift / sağ tık; C kayma
  out.pu = !PUD.wind && PUD.heal.item === 1;
  out.noBekci = !KINDS.bekcihayalet;
  out.hideDirek = KINDS.direk.hide === 1 && !/Direk<\/b>/.test(bestHTML());
  // Shift basılı: yerdeyken kayma
  P.y = groundTop(P.x, P.z) + 1; P.vy = 0; K.c = 1; upd(1 / 60); out.slide = P.sl === 1; K.c = 0; upd(1 / 60); P.sl = 0; P.cd = 0; K.Shift = 1; upd(1 / 60); out.dash = P.dsh > 0 && P.cd > 1; K.Shift = 0; for (let i = 0; i < 30; i++) upd(1 / 60);
  // Mezar taşı: tecrübe +%10, zorluk +%5
  const g0 = P.greed, x0 = P.SB.xp || 0; mkSh(9); useShrine(SH[SH.length - 1]); out.grave = { greed: +(P.greed - g0).toFixed(2), xp: +((P.SB.xp || 0) - x0).toFixed(2) };
  // Meydan okuma sunağı: seçince uygulanır
  P.chal = null; mkSh(8); useShrine(SH[SH.length - 1]); out.chalOpen = S === 'chalsh'; chalShrinePick('kirilgan'); out.chal = P.chal && P.chal.k === 'kirilgan'; P.chal = null; MSEL.chal = ''; S = 'play';
  // direk: boss korunur, yanında 3 sn durunca dolar
  spawn(3, { x: P.x + 30, z: P.z, boss: 1 }); const b = E[E.length - 1]; b.bp = { n: 'test', k: 'erlik', p: ['pylons'] }; b.sp = 0; b.mh = b.hp = 1e6;
  for (let i = 0; i < 3; i++) upd(1 / 60);
  const py = E.filter(e => e.kd && e.kd.fx && e.kd.fx.pylon); out.pylons = py.length;
  hurtE(b, 1000, 1, { w: 'x' }); out.protected = b.hp === b.mh;
  // durulacak nokta zıplama tahtasına denk gelmesin (oyuncuyu 11 m fırlatıp dolumu geciktiriyordu); araya giren seviye ekranı oyunu durdurmasın
  const need0 = P.need; P.need = 1e12;
  for (const p of py) {
    const q = p.m.position, dx = q.x - b.m.position.x, dz = q.z - b.m.position.z, L = Math.hypot(dx, dz) || 1;
    const sp = [[dx / L, dz / L], [-dx / L, -dz / L], [-dz / L, dx / L], [dz / L, -dx / L]].map(([ux, uz]) => [q.x + ux * 2, q.z + uz * 2]).find(([x, z]) => !JP.some(j => Math.hypot(j.x - x, j.z - z) < 4)) || [q.x + dx / L * 2, q.z + dz / L * 2];
    P.x = sp[0]; P.z = sp[1]; P.y = q.y + 1; P.vx = P.vz = P.vy = 0;
    for (let i = 0; i < 400 && !p.dead; i++) { upd(1 / 60); if (S === 'choice') back(); if (S !== 'play') S = 'play'; if (Math.hypot(P.x - q.x, P.z - q.z) > 4) { P.x = sp[0]; P.z = sp[1]; } }
  }
  P.need = need0;
  for (let i = 0; i < 3; i++) upd(1 / 60); hurtE(b, 1000, 1, { w: 'x' }); out.vulnerable = b.hp < b.mh;
  b.nodrop = 1; b.hp = 0; killE(b); for (const e of E.slice()) { e.nodrop = 1; e.hp = 0; killE(e) } E = E.filter(e => !e.dead); for (const d of DY) d.t = 0; fxUpd(.016); for (const o of G) o.c = 1; G = []; gSync(); P.xp = 0; if (S === 'choice') back(); S = 'play'; P.inv = 1e9;
  return out;
});
ok('Megabonk karşılıkları: kayma, güçler, sunaklar, Bekçi yok, direkler', f12.noDash && f12.dash && f12.pu && f12.noBekci && f12.hideDirek && f12.slide && f12.grave.greed === .05 && f12.grave.xp === .1 && f12.chalOpen && f12.chal && f12.pylons === 3 && f12.protected && f12.vulnerable, f12);

// konsol, kısayol penceresi, bağlamsal ipuçları
const f13 = await pg.evaluate(() => {
  const out = {};
  SET.con = 1; out.conDefault = true;
  conToggle(1); out.conOpen = !!document.querySelector('#con.on'); run('yardim perf'); out.help = /perf:/.test(document.querySelector('#conl').textContent); conToggle(0);
  showHelp(); out.helpS = S === 'help' && /Kısayollar/.test(document.querySelector('#ov').textContent); closeHelp(); out.back = S === 'play';
  localStorage.removeItem('kk_tips'); TIPS = {}; tip('t_test', 'Deneme', 'metin'); out.tipOn = !!document.querySelector('#tip.on'); const n0 = document.querySelector('#tip').textContent; tip('t_test', 'Deneme2', 'metin2'); out.tipOnce = document.querySelector('#tip').textContent === n0; document.querySelector('#tip').classList.remove('on');
  return out;
});
ok('konsol, kısayollar (F1), bağlamsal ipuçları', f13.conDefault && f13.conOpen && f13.help && f13.helpS && f13.back && f13.tipOn && f13.tipOnce, f13);

// CPU maliyeti ve çizim çağrıları (200 düşman)
const cpu = await pg.evaluate(() => {
  P.inv = 1e9; P.x = 0; P.z = 0; P.y = groundTop(0, 0) + 1; yaw = 0; cam.position.set(0, P.y + 14, 22); cam.lookAt(0, P.y, -14); cam.updateMatrixWorld();
  for (let i = 0; i < 200; i++) spawn(i % 5);
  const ri = R.info; ri.autoReset = false; let tu = 0, tr = 0; const N = 10;
  for (let i = 0; i < N; i++) { const a = performance.now(); upd(1 / 60); const b = performance.now(); ri.reset(); sc.updateMatrixWorld(); iskinUpd(); R.render(sc, cam); tu += b - a; tr += performance.now() - b }
  const calls = ri.render.calls; ri.autoReset = true;
  for (const e of E.slice()) { e.hp = 0; killE(e) } E = E.filter(e => !e.dead);
  return { E: 200, updMs: +(tu / N).toFixed(1), renderMs: +(tr / N).toFixed(1), drawCalls: calls };
});
R.cpu = cpu; ok('200 düşmanla güncelleme', cpu.updMs < 50, cpu);
const cpu4 = await pg.evaluate(() => {
  P.inv = 1e9; P.x = 0; P.z = 0; P.y = groundTop(0, 0) + 1; yaw = 0; cam.position.set(0, P.y + 14, 22); cam.lookAt(0, P.y, -14); cam.updateMatrixWorld();
  { const r0 = R.info; r0.autoReset = false; r0.reset(); sc.updateMatrixWorld(); iskinUpd(); R.render(sc, cam); var base = r0.render.calls; r0.autoReset = true; }
  for (let i = 0; i < 400; i++) spawn(i % 5);
  for (let i = 0; i < 120; i++) drop(P.x + (i % 12) * 2, P.z + Math.floor(i / 12) * 2, i % 3 ? 'xp' : 'au', 1);
  for (let i = 0; i < 12; i++) { upd(1 / 60); P.xp = 0; if (S === 'choice') back() } // ısınma: JIT ve ilk animasyon kareleri
  const ri = R.info; ri.autoReset = false; let tu = 0, tr = 0; const N = 20;
  for (let i = 0; i < N; i++) { const a = performance.now(); upd(1 / 60); const b = performance.now(); ri.reset(); sc.updateMatrixWorld(); iskinUpd(); R.render(sc, cam); tu += b - a; tr += performance.now() - b; P.xp = 0; if (S === 'choice') back() }
  const calls = ri.render.calls; ri.autoReset = true;
  const before = Object.values(poolStats()).reduce((a, b) => a + b, 0);
  for (const e of E.slice()) { e.hp = 0; killE(e) } E = E.filter(e => !e.dead);
  for (const d of DY) d.t = 0; fxUpd(.016);
  const pooled = Object.values(poolStats()).reduce((a, b) => a + b, 0);
  spawn(0); spawn(1); const after = Object.values(poolStats()).reduce((a, b) => a + b, 0);
  for (const e of E.slice()) { e.hp = 0; killE(e) } E = E.filter(e => !e.dead); for (const d of DY) d.t = 0; fxUpd(.016);
  for (const o of G) o.c = 1; G = []; gSync(); P.xp = 0; if (S === 'choice') back();
  return { E: 400, G: 120, updMs: +(tu / N).toFixed(1), renderMs: +(tr / N).toFixed(1), drawCalls: calls, base, extra: calls - base, before, pooled, after };
});
R.cpu4 = cpu4; // ölçüt: güncelleme başsız Chrome'da 12 ms altı (masaüstünde ~7 ms), çizim çağrısı düşman başına 1 + dünya payı
ok('400 düşman ve 120 ganimetle güncelleme (instanced skinning: düşman başına çizim çağrısı yok)', cpu4.updMs < 20 && cpu4.extra < 80, cpu4);
ok('düşman havuzu yeniden kullanılıyor', cpu4.pooled > cpu4.before && cpu4.after === cpu4.pooled - 2, { before: cpu4.before, pooled: cpu4.pooled, after: cpu4.after });

// kemik dokusu sızıntısı
const tex = await pg.evaluate(() => {
  // Oyuncu haritanın ortasında, kamera sabit: doğan her iskelet görüş alanında kalsın ki
  // kemik dokuları ilk döngüde yüklensin (görünmeyen iskeletin dokusu sonra yüklenir, sızıntı gibi görünür).
  const out = []; P.x = 0; P.z = 0; P.y = groundTop(0, 0) + 1; P.vx = P.vz = 0; yaw = 0; cam.position.set(0, P.y + 12, 16); cam.lookAt(0, P.y, -12); cam.updateProjectionMatrix();
  for (let c = 0; c < 4; c++) {
    const fx = -Math.sin(yaw), fz = -Math.cos(yaw);
    for (let i = 0; i < 80; i++) { const a = i / 80 - .5, r = 10 + (i % 5) * 2; spawn(i % 2 ? 0 : 4, { x: P.x + (fx * Math.cos(a) - fz * Math.sin(a)) * r, z: P.z + (fz * Math.cos(a) + fx * Math.sin(a)) * r }) }
    R.render(sc, cam); R.render(sc, cam);
    for (const e of E.slice()) { e.hp = 0; killE(e) } E = E.filter(e => !e.dead);
    for (const d of DY) d.t = 0; fxUpd(.016); R.render(sc, cam); out.push(R.info.memory.textures);
  }
  return out;
});
ok('doku sızıntısı yok', tex[3] <= tex[2] + 2, tex);

// mezar ruhu boss çubuğu ve bildirim çakışması
const grave = await pg.evaluate(() => {
  const g = MZ.find(x => x.st === 0 && x.i < 9); P.mzA = null; wakeGrave(g); hk = ''; hud(); toast('deneme bildirimi');
  const a = $('tt').getBoundingClientRect(), b = $('bb').getBoundingClientRect();
  return { bar: $('bn').textContent, overlap: !(a.bottom <= b.top || a.top >= b.bottom) };
});
ok('mezar ruhu adı', grave.bar === 'Mezar ruhu', grave.bar);
ok('bildirim boss çubuğunu örtmüyor', !grave.overlap);

// aşama geçişi, hazır ekranı, kapı etiketi
// boss ölünce saat 590'a atlar; yeni aşamada saat sıfırdan başlamalı (yoksa 540 sn'lik 2. aşama baştan Uzatma'da geçer)
// Diyar değişince yeni biyomun programları geçiş ekranında derlenir; shader sayımı geçişleri dışarıda bırakır
const warmA = await pg.evaluate(() => R.info.programs.length);
await pg.evaluate(() => { for (const e of E.slice()) { e.hp = 0; killE(e) } E = []; P.xp = 0; if (S === 'choice') back(); S = 'play'; GATE.st = 2; P.stT = 590; nextStage() });
await sleep(4000);
await pg.screenshot({ path: out + '/3_stage2.png', timeout: 180000 });
const st = await pg.evaluate(() => ({ S, stage: P.stage, biome: BIO[BI].n, stT: Math.round(P.stT), ot: P.ot || 0 }));
ok('2. aşamaya geçildi (Kızıl Bozkır), aşama saati sıfırdan', st.stage === 1 && st.biome === 'Kızıl Bozkır' && st.stT < 60 && st.ot === 0, st);
await pg.keyboard.press('e');
ok('hazır ekranı E ile kapanıyor', await pg.evaluate(() => S === 'play' || S === 'choice'));
// 2. aşamada ara boss kendi anında gelir ve Uzatma başlamaz
const s2 = await pg.evaluate(() => { if (S === 'choice') back(); S = 'play'; P.inv = 1e9; const t0 = P.stT, old = new Set(E); P.swarm = 0; P.stT = MBT()[0] - .001; upd(1 / 60); const m = E.find(e => e.mini && !old.has(e)); const o = { mini: !!m, at: MBT()[0], ot: P.ot || 0, len: stLen() }; if (m) { m.hp = 0; killE(m) } E = E.filter(e => !e.dead); P.stT = t0; P.xp = 0; if (S === 'choice') back(); return o });
ok('2. aşamada ara boss geliyor, Uzatma yok', s2.mini && s2.at === 120 && s2.ot === 0 && s2.len === 540, s2);
await pg.evaluate(() => { back(); S = 'play'; GATE.st = 2; P.x = GATE.x + 4; P.z = GATE.z + 4; P.y = groundTop(P.x, P.z) + 1; P.inv = 1e9 });
await sleep(2500);
const lab = await pg.evaluate(() => { S = 'play'; cam.position.set(GATE.x, GATE.m.position.y + 9, GATE.z + 18); cam.lookAt(GATE.x, GATE.m.position.y + 6, GATE.z); cam.updateMatrixWorld(); wlUpd(); return [...document.querySelectorAll('.wl')].filter(e => e.style.display != 'none').map(e => e.textContent).find(t => /Geçit/.test(t)) || '' });
ok('kapı etiketi Mühürlü Mahzen’i gösteriyor', /Mühürlü Mahzen’e geç/.test(lab), lab);

// uzatma, sandık fiyatı, zorluk göstergesi
const ot = await pg.evaluate(() => { S = 'play'; P.opened = 0; const pr = price(); const st0 = P.stT; P.stT = STL + .5; upd(1 / 60); const o = { pr, ot: P.ot > 0, bats: E.filter(e => e.t === 1).length, diff: diffPct() }; P.stT = st0; P.ot = 0; return o });
ok('uzatma ve sandık fiyatı', ot.pr === 30 && ot.ot && ot.bats >= 4 && ot.diff > 0, ot);

// Mühürlü Mahzen: 3. aşama Mezarlık, mühür (arena 30), anahtarlar, Dev Hortlak, zafer ve çıkış
await pg.evaluate(() => { for (const e of E.slice()) { e.hp = 0; killE(e) } E = []; for (const o of G) o.c = 1; G = []; gSync(); P.xp = 0; if (S === 'choice') back(); S = 'play'; GATE.st = 2; nextStage() });
await sleep(4000);
await pg.keyboard.press('e');
await sleep(300);
const ar = await pg.evaluate(() => ({ S: (S === 'choice' ? (back(), P.xp = 0, S) : S), stage: P.stage, map: P.map, biome: BIO[BI].n, arena: ARENA, wall: !!ARW, gateSt: GATE.st, mz: !!P.mz }));
const warmB = await pg.evaluate(() => R.info.programs.length);
ok('Mühürlü Mahzen kuruldu', ar.S === 'play' && ar.stage === 2 && ar.map === 'mezarlik' && ar.biome === 'Mezarlık' && ar.arena === 30 && ar.wall && ar.mz && ar.gateSt === 0, ar);
// başsız çizim yavaş, kare süresi .05'e kırpılıyor: oyun saatini doğrudan ilerlet
const ar2 = await pg.evaluate(() => { P.mz.kills = P.mz.need; upd(1 / 60); const open = P.mz.open === 1 && !ARENA; summonBoss(); const locked = GATE.st === 0; P.mz.keys = 4; summonBoss(); const b = E.find(e => e.t === 3 && e.boss); return { open, locked, boss: !!b, bn: b && b.bp && b.bp.n, gateSt: GATE.st } });
ok('mühür kırıldı, anahtarlarla Dev Hortlak geldi', ar2.open && ar2.locked && ar2.boss && ar2.bn === 'Dev Hortlak' && ar2.gateSt === 1, ar2);
const win = await pg.evaluate(() => { P.inv = 1e9; for (const e of E) if (e.t === 3) { e.hp = 0; killE(e) } E = E.filter(e => !e.dead); return { gateSt: GATE.st, won: P.won, swarm: P.swarm, tier: META.tier.koru, final: P.final } });
ok('kademe zaferi ve çıkış geçidi', win.gateSt === 3 && win.won === 1 && win.swarm === 1 && win.tier === 3 && win.final === 1, win);
await pg.evaluate(() => { if (S === 'choice') back(); P.xp = 0; for (const o of G) o.c = 1; G = []; gSync(); P.stT = P.swT0 + 200; exitRun() });
await sleep(300);
const ex = await pg.evaluate(() => ({ S, exited: P.exited, title: document.querySelector('#ov h1') && document.querySelector('#ov h1').textContent, k3open: tierOpen('koru', 3), text: document.querySelector('#ov .svb') ? document.querySelector('#ov .svb').textContent.slice(0, 80) : '', btn: document.querySelectorAll('#ov .ofb .act').length }));
ok('çıkış ekranı', ex.btn === 4 && ex.S === 'over' && ex.exited === 1 && ex.title === 'Korudan çıktın' && ex.k3open && /×3/.test(ex.text), ex);
await pg.screenshot({ path: out + '/5_exit.png', timeout: 90000 });
// yeni koşu: sonraki kontroller oyun içinde sürer
await pg.evaluate(() => start());
await sleep(1200);
ok('çıkıştan sonra yeni koşu', await pg.evaluate(() => S === 'play' && P.stage === 0 && !P.won && !ARENA));
await pg.evaluate(() => { P.inv = 1e9 });

// tüccardan alışveriş sonrası engel kalmıyor, aşama geçişinde geometri sızmıyor
const shopChk = await pg.evaluate(() => {
  S = 'play'; const n = NP.find(n => n.t === 'shop' && !n.d); if (!n) return { skip: 1 };
  const before = OBS.length; P.gold = 1e6; openShop(n); buy(0); S = 'play';
  return { before, after: OBS.length, inGrid: [...OG.values()].some(a => a.includes(n.ob)) };
});
ok('tüccar engeli siliniyor', shopChk.skip || (shopChk.after === shopChk.before - 1 && !shopChk.inGrid), shopChk);
// Aşama yeniden kurulunca sahneden çıkan ve dispose edilmeyen geometriler. Paylaşılan
// önbellek geometrileri (model, sandık, halka) kalabilir; sahip olunanlar ve instanced olanlar kalamaz.
const geo = await pg.evaluate(() => {
  const snap = () => { const m = new Map(); sc.traverse(o => { if (o.geometry) m.set(o.geometry.uuid, { g: o.geometry, o, d: 0 }) }); return m };
  R.render(sc, cam); const a = snap(); for (const [, v] of a) v.g.addEventListener('dispose', () => v.d = 1);
  // boss hasar bölgesi aşama kurulumunda kalkar (dizi ve sahne)
  const zm = mk(gCirc, BM(0xff5a1a), P.x, P.y, P.z); BZ.push({ m: zm, x: P.x, z: P.z, y: P.y, R: 3, kind: 'lava', l: 99 });
  setupStage(); const bzOk = BZ.length === 0 && !sc.children.includes(zm); R.render(sc, cam); const b = snap();
  const bad = [], shared = [];
  for (const [id, v] of a) if (!b.has(id) && !v.d) ((v.o.isInstancedMesh || v.o.userData.own || v.g.userData.own) ? bad : shared).push(v.g.type + '/' + v.o.type);
  S = 'play'; P.inv = 1e9;
  return { bad, shared: shared.length, bzOk };
});
ok('aşama geçişinde geometri sızıntısı yok', geo.bad.length === 0 && geo.shared <= 8 && geo.bzOk, geo);

// duraklat ve devam
// kumanda: oyundan menüye çubuk basılıyken girilirse odak kendiliğinden oynamaz (zıplama tuşuyla yanlış kart seçilmesin)
const gh = await pg.evaluate(() => {
  S = 'play'; window.__pad = { connected: true, axes: [1, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false })) };
  padTick(1 / 60); const jx = J.x; pause(); const a0 = document.activeElement; // duraklatma Devam et'e kendisi odaklanır
  for (let i = 0; i < 60; i++) padTick(1 / 60); const held = document.activeElement !== a0;
  __pad.axes[0] = 0; padTick(1 / 60); __pad.axes[0] = 1; padTick(1 / 60); const after = document.activeElement !== a0 && OV.contains(document.activeElement);
  window.__pad = null; padTick(1 / 60); resume();
  return { jx, held, after, jx2: J.x, S };
});
ok('kumanda: basılı çubuk menüde odağı oynatmaz', gh.jx === 1 && !gh.held && gh.after && gh.jx2 === 0 && gh.S === 'play', gh);
// Ctrl ile kayma (Megabonk varsayılanı), Megabonk düzeninde HUD, yeni ses tarifleri
const fb2 = await pg.evaluate(() => {
  const o = {}; S = 'play'; P.inv = 1e9; K = {}; P.dsh = 0;
  P.y = groundTop(P.x, P.z) + 1; P.vy = 0; upd(1 / 60); K.Control = 1; upd(1 / 60); o.ctrl = P.sl === 1; K.Control = 0; upd(1 / 60); o.off = P.sl === 0;
  hud(); const r = id => document.getElementById(id).getBoundingClientRect(), W = innerWidth, H = innerHeight;
  o.clock = /^\d+:\d\d$/.test(document.getElementById('rtv').textContent);
  o.left = r('st').left < 40 && r('st').top < 60 && r('au').left > r('rtm').right && r('kl').left > r('au').right;
  o.lvl = r('lvb').right > W - 40 && r('lvb').top < 70 && r('mm').top > r('lvb').bottom - 4;
  o.tm = Math.abs((r('tm').left + r('tm').right) / 2 - W / 2) < 30;
  o.xpw = Math.round(r('xpw').width) === W && r('xpw').top === 0;
  o.snd = typeof SFX.chg === 'function' && SMIN.hurt >= .1 && SM.chg && SM.hurt[0] <= -8;
  return o;
});
ok('geri bildirim: Ctrl ile kayma, Megabonk düzeninde arayüz, ocak dolum sesi', fb2.ctrl && fb2.off && fb2.clock && fb2.left && fb2.lvl && fb2.tm && fb2.xpw && fb2.snd, fb2);
// yeni ekranlar: duraklatmada odak Devam et'te; meydan okuma sunağı seçenekleri düğme (klavye ve kumanda erişir); ipucu kutusu ekran açıkken altta
const scr = await pg.evaluate(() => {
  S = 'play'; pause(); const o = { pz: !!document.querySelector('.pzx'), foc: document.activeElement && document.activeElement.matches('.mi.pri'), slots: !!document.querySelector('.pbs .sl') };
  resume(); const ch0 = P.chal; P.chal = null; openChalShrine(); o.chal = document.querySelectorAll('.chg2 button.chc').length === CHAL.length && S === 'chalsh';
  tip('t_' + Date.now(), 'Deneme', 'deneme'); const t = document.getElementById('tip'); o.tipLow = !t || t.getBoundingClientRect().top > innerHeight / 2; if (t) t.classList.remove('on');
  closeOv(); P.chal = ch0; o.S = S; return o;
});
const esc = await pg.evaluate(() => { const S0 = S; otag(); const a = S; dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); const b = S; S = S0; return { a, b } });
scr.otagEsc = esc.a === 'otag' && esc.b === 'menu';
await pg.evaluate(() => { start() }); await pg.waitForFunction(() => S === 'play', null, { timeout: 60000 }); await pg.evaluate(() => { P.inv = 1e9 });
ok('yeni ekranlar: duraklatma, meydan okuma sunağı, ipucu yeri, Otağ’da Esc', scr.otagEsc && scr.pz && scr.foc && scr.slots && scr.chal && scr.tipLow && scr.S === 'play', scr);
await pg.evaluate(() => { S = 'play'; pause() });
ok('duraklatma', await pg.evaluate(() => S === 'pause'));
await pg.keyboard.press('p');
ok('devam', await pg.evaluate(() => S === 'play'));

// ölüm ekranı (konsol kullanılmış koşu: sıralamaya girmez, sonuç ekranı söyler)
const lb0 = await pg.evaluate(() => { const n = JSON.stringify(LB); run('perf'); const safe = !P.con; run('altin 1'); return { n, safe, con: P.con, meta: !!META.con } });
await pg.evaluate(() => { spawn(0, { x: P.x + 20, z: P.z }); const e = E[E.length - 1]; hurtE(e, 12, 0, { w: 'orbit' }); P.inv = 0; P.shieldT = 0; P.C.eva = 0; P.C.block = 0; P.C.revive = 0; (P.IS || (P.IS = {})).muhUsed = 1; P.hp = 1; hurtP(9999) }); // muhUsed: Zaman Mührü rastgele düştüyse öldürücü darbeyi kesmesin
await sleep(800);
await pg.screenshot({ path: out + '/4_over.png', timeout: 90000 });
ok('ölüm ekranı', await pg.evaluate(() => S === 'over'));
const lb1 = await pg.evaluate(() => ({ n: JSON.stringify(LB), note: !!document.querySelector('#ov .lbno') }));
ok('konsol kullanılan koşu sıralamaya girmez', lb0.safe && lb0.con === 1 && !lb0.meta && lb1.n === lb0.n && lb1.note, { safe: lb0.safe, con: lb0.con, ayni: lb1.n === lb0.n, note: lb1.note });
ok('koşu sonu silah hasar grafiği', await pg.evaluate(() => !!document.querySelector('.wdc')));

// ses örnekleri üretildi mi
await sleep(3000);
const snd = await pg.evaluate(() => typeof AB === 'object' ? Object.keys(AB).length : -1);
ok('ses bankası doluyor', snd > 20, snd);

const warm1 = await pg.evaluate(() => ({ prog: R.info.programs.length, p0: 0 }));
ok('oynanış sırasında yeni shader programı derlenmedi (diyar geçişleri hariç)', (warmA - warm0.prog) + (warm1.prog - warmB) <= 3, { before: warm0.prog, preTrans: warmA, postTrans: warmB, after: warm1.prog });
// uzaktan ayar şeması (data/ayar-sema.js) koddaki sabitlerle aynı varsayılanı taşımalı; yoksa panelde "koddaki değer" yanlış görünür
const ayarFark = await pg.evaluate(() => window.__ayarFark);
ok('uzaktan ayar şeması koddaki değerlerle aynı', Array.isArray(ayarFark) && ayarFark.length === 0, ayarFark);
ok('sayfa hatası yok', errs.length === 0, errs.slice(0, 5));
R.errors = errs;
fs.writeFileSync(out + '/report.json', JSON.stringify(R, null, 1));
await br.close();
const failed = Object.entries(R.checks).filter(([, v]) => !v.pass).map(([k]) => k);
console.log(failed.length ? `\n${failed.length} kontrol kaldı: ${failed.join(', ')}` : '\nTüm kontroller geçti');
process.exit(failed.length ? 1 : 0);
