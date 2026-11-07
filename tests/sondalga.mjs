// Son Dalga ölçümü: bot bir kademeyi gerçek oyunla güçlenerek bitirir, sonra Son Dalga'da ölene kadar oynar.
// Güçlenme evresinde can her karede dolar (denge.mjs gibi); Son Dalga'da dolmaz, bot gerçek hasarla hayatta kalmaya çalışır.
//
//   node tests/sondalga.mjs <url> [profil=zayif,orta,guclu] [tohum=4242]
//   HERO=kam node tests/sondalga.mjs ...      kahraman (varsayılan Alp; diğerlerinin kilidi açılır)
//   CAP=1800 node tests/sondalga.mjs ...      Son Dalga'da en çok kaç saniye oynanır (varsayılan 1800)
//   SET_T=eva:26,aspd:33 node ...              güçlü profilde Son Dalga başında tomları bu seviyelerle kurar (uç build denemesi)
//
// Tanı: oyun koduna geçici olarak window.__gd (Albastıya hasar kaynağı), __hm (vuruş kancası çarpanı), __ls (can çalma
// kaynağı), __hp (hurtP sonuçları), __last (son darbe) sayaçları eklenmiş bir yapıda bunlar da yazdırılır.
//
// Profiller (bot gerçek bir oyuncudan zayıf build kurar; güçlü profil iyi bir oyuncuyu taklit etmek için takviye alır):
//   zayif  Kara Koru K1, aşama başına 300 sn güçlenme
//   orta   Kara Koru K2, aşama başına 360 sn
//   guclu  Kara Koru K3, aşama başına 420 sn, sonra silah seviyeleri ×1.5, tomlar +6, 8 destansı/efsanevi eşya
//
// Son Dalga botu: yürüyerek büyük daire çizer (sürüyü peşinde gezdirir), yakına gelen düşmandan atılarak kaçar,
// seviye kartında silah ve tomu dönüşümlü seçer, altını yetince yakındaki sandığı açar.
// Çıktı: dakika dakika öldürme, dakikada öldürme, can, düşman sayısı, hayalet kademesi; ölüm anı ve nedeni.
import { chromium } from 'playwright';
import fs from 'node:fs';

const url = process.argv[2] || 'http://localhost:5173/';
const profs = (process.argv[3] || 'zayif,orta,guclu').split(',');
const seed = +(process.argv[4] || 4242);
const HERO = process.env.HERO || 'alp', CAP = +(process.env.CAP || 1800);
const PROF = { zayif: { tier: 1, farm: 300 }, orta: { tier: 2, farm: 360 }, guclu: { tier: 3, farm: 420, boost: 1 } };
const MAC = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const exe = process.env.CHROME || ['/usr/bin/google-chrome', MAC].find(p => fs.existsSync(p));
const br = await chromium.launch({ executablePath: exe, headless: true, args: process.platform == 'darwin' ? ['--use-angle=metal', '--ignore-gpu-blocklist'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const sleep = ms => new Promise(r => setTimeout(r, ms));

// n kare oynar. mode: 'farm' (can dolar, en yakın düşmana yürür) ya da 'sd' (Son Dalga, can dolmaz, kaçarak daire çizer)
const chunk = (pg, n, mode, until) => pg.evaluate(([n, mode, until]) => {
  const B = window.__bot || (window.__bot = { picks: 0, frames: 0, log: [], k0: 0, t0: 0, lastMin: -1, taken: 0 });
  // kart seçimi: yeni silah > iyi tomlar (öncelik sırası) > silah yükseltmesi > diğer tomlar; zararlı tomlar en son
  const GOOD = ['dmg', 'hp', 'regen', 'arm', 'aspd', 'cnt', 'crit', 'size', 'ls', 'eva', 'shield', 'dur', 'spd'], BAD = ['kumar', 'curse', 'chaos'];
  const pick = () => {
    if (CHM != 'level') return 0;
    let bi = 0, bs = -1e9;
    CHO.forEach((o, i) => {
      const tk = String(o.key || '').replace(/^t_/, '');
      let sc = o.kind == 'Silah' ? 100 : o.kind == 'Silah yükseltmesi' ? 40 + (B.picks % 2) * 15 : o.kind && o.kind.startsWith('Tom') ? (BAD.includes(tk) ? -50 : GOOD.includes(tk) ? 62 - GOOD.indexOf(tk) * 2 - (B.picks % 2) * 15 : 10) : 0;
      sc += (o.rar || 0) * 4;
      if (sc > bs) { bs = sc; bi = i; }
    });
    B.picks++;
    return bi;
  };
  if (S === 'pause') S = 'play';
  if (S !== 'play') return { S, stop: 'durum:' + S };
  let done = '';
  for (let i = 0; i < n && !done; i++) {
    let nd = 1e9, ne = null;
    if (B.frames % 6 == 0 || mode == 'sd') for (const e of E) { if (e.dead || e.kd && e.kd.fx && (e.kd.fx.pylon || e.kd.fx.flee)) continue; const d = Math.hypot(e.m.position.x - P.x, e.m.position.z - P.z); if (d < nd) { nd = d; ne = e; } }
    if (mode == 'farm') {
      if (ne && nd > 6) yaw = yawT = Math.atan2(-(ne.m.position.x - P.x), -(ne.m.position.z - P.z));
      else yaw = yawT = yaw + .5 / 60;
      K = { w: 1 };
      P.hp = P.mh;
    } else {
      // kaçış: 30 m içindeki düşmanlardan uzaklık karesiyle ağırlıklı itme, üstüne yan yön (sürüyü peşinde döndürür);
      // itme zayıfsa daire çizer, harita ya da arena kenarına yaklaşınca merkeze çekilir
      let rx = 0, rz = 0;
      for (const e of E) { if (e.dead) continue; const dx = P.x - e.m.position.x, dz = P.z - e.m.position.z, d2 = dx * dx + dz * dz; if (d2 < 900 && d2 > .01) { const w = 1 / d2; rx += dx * w; rz += dz * w; } }
      const rl = Math.hypot(rx, rz), r = Math.hypot(P.x, P.z), lim = ARENA ? ARENA - 8 : 230;
      let mx, mz;
      if (rl > .004) { mx = rx / rl - rz / rl * .6; mz = rz / rl + rx / rl * .6; } else { mx = -Math.sin(yaw + .55 / 60); mz = -Math.cos(yaw + .55 / 60); }
      if (r > lim * .8) { const k = Math.min(1.5, (r - lim * .8) / (lim * .2) * 1.5); mx -= P.x / r * k; mz -= P.z / r * k; }
      yaw = yawT = Math.atan2(-mx, -mz);
      K = { w: 1 };
      // çok yakına gelen düşmandan atılarak kaç
      if (ne && nd < 2.2 && P.cd <= 0) K.Shift = 1;
    }
    const hp0 = P.hp;
    upd(1 / 60);
    B.frames++;
    if (mode == 'sd' && P.hp < hp0) B.taken += hp0 - P.hp;
    // Albastıyı ne öldürdü: son vuran silah ya da etki
    if (mode == 'sd') { B.gk = B.gk || {}; B.gl = B.gl || new Set(); for (const e of B.gl) if (e.dead) { const k = (e.lastW || '?') + (e.lastEl ? '/' + e.lastEl : ''); B.gk[k] = (B.gk[k] || 0) + 1; B.gl.delete(e); } for (const e of E) if (e.ghost && !e.dead) B.gl.add(e); }
    if (S === 'choice') chPick(pick());
    else if (S === 'item') closeItem();
    else if (S === 'over') {
      const near = E.filter(e => !e.dead && Math.hypot(e.m.position.x - P.x, e.m.position.z - P.z) < 8).sort((a, b) => b.dmg - a.dmg).slice(0, 3).map(e => (e.ghost ? 'albastı' + e.ghost : e.kind || e.t) + ':' + Math.round(e.dmg));
      B.death = { sw: Math.round(swT()), st: P.stage, fin: P.final ? 1 : 0, fall: P.fallDead ? 1 : 0, son: window.__last || null, kills, mh: Math.round(P.mh), arm: +(P.C.armE || 0).toFixed(2), eva: +(P.C.eva || 0).toFixed(2), dmk: +DMK().toFixed(1), yakin: near.join(' ') };
      done = 'öldü'; break;
    } else if (S !== 'play') { done = 'durum:' + S; break; }
    if (B.frames % 240 == 0 && CH.length) {
      let c = null, bd = 1e9;
      for (const x of CH) { const d = Math.hypot(x.m.position.x - P.x, x.m.position.z - P.z); if (d < bd) { bd = d; c = x } }
      if (c && bd < 40) { tryChest(c); if (S === 'item') closeItem(); }
    }
    if (mode == 'sd') {
      const m = Math.floor(swT() / 60);
      if (m != B.lastMin) {
        const ghosts = E.filter(e => !e.dead && e.ghost).length;
        B.log.push({ dk: m, kills, dkOld: kills - B.k0, hp: Math.round(P.hp), mh: Math.round(P.mh), en: E.length, ghosts, ghW: P.ghW || 0, lv: P.lv, alinan: Math.round(B.taken), ls: Math.round((P.c.lsheal || 0) - (B.ls0 || 0)), ev: (P.c.evade || 0) - (B.ev0 || 0), eva: +(P.C.eva || 0).toFixed(2), evaR: +(P.C.evaR || 0).toFixed(2), lsC: +(P.C.ls || 0).toFixed(2), arm: +(P.C.armE || 0).toFixed(2), rg: +(P.C.regen || 0).toFixed(1), dmk: +DMK().toFixed(1), hpx: +(diff() / Math.max(1e-9, B.d0 || diff())).toFixed(1), st: { dmg: +P.C.dmg.toFixed(2), crit: +P.C.crit.toFixed(2), critd: +P.C.critd.toFixed(2), aspd: +P.C.aspd.toFixed(2), cnt: P.C.cnt, op: P.opened || 0, wd: Object.entries(P.W).map(([i, w]) => w.k + ':' + Math.round(w.s.dmg)).join(',') }, gmh: Math.round(E.reduce((a, e) => e.ghost && !e.dead ? Math.max(a, e.mh) : a, 0)) });
        B.k0 = kills; B.taken = 0; B.lastMin = m; B.ls0 = P.c.lsheal || 0; B.ev0 = P.c.evade || 0;
        if (!B.d0) B.d0 = diff();
      }
      if (swT() >= until) done = 'süre';
    } else if (P.stT >= until) done = 'farm';
  }
  K = {};
  if (S === 'play') S = 'pause';
  return { stop: done, S, stT: Math.round(P.stT), sw: Math.round(swT()), kills, lv: P.lv, hp: Math.round(P.hp), mh: Math.round(P.mh), en: E.length, death: B.death || null, nan: !isFinite(P.x + P.y + P.z + P.hp), w: P.W.map(w => w.k + w.lv).join(' '), t: P.T.map(t => t.k + t.lv).join(' '), items: Object.values(P.I).reduce((a, b) => a + b, 0), il: Object.entries(P.I).filter(e => e[1]).map(e => e[0] + e[1]).join(' '), C: { eva: +(P.C.eva || 0).toFixed(2), ls: +(P.C.ls || 0).toFixed(2), aspd: +(P.C.aspd || 0).toFixed(2), arm: +(P.C.armE || 0).toFixed(2), regen: +(P.C.regen || 0).toFixed(1), oh: +(P.C.overheal || 0).toFixed(2), hp: Math.round(P.C.hp) } };
}, [n, mode, until]);

const out = [];
for (const prof of profs) {
  const pr = PROF[prof];
  if (!pr) { console.log('profil yok:', prof); continue; }
  const pg = await br.newPage({ viewport: { width: 640, height: 360 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.addInitScript(seed => {
    // Başsız Chrome'da bile fare kilidi kullanıcının gerçek imlecini yakalayabiliyor; testler imlece dokunmasın
    Element.prototype.requestPointerLock = function () { return Promise.resolve(); };
    localStorage.setItem('kk_set', JSON.stringify({ q: 0, bl: 0, al: 0, tips: 0 })); localStorage.setItem('kk_tut', '1');
    localStorage.setItem('kk_meta', JSON.stringify({ v: 6, tier: { koru: 2 } }));
    let s = seed; Math.random = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 };
  }, seed);
  await pg.goto(url);
  await pg.waitForFunction(() => typeof S !== 'undefined' && S === 'menu', null, { timeout: 90000 });
  await sleep(1500);
  await pg.evaluate(([t, hero]) => { const i = CR.findIndex(c => c.k == hero); if (CR[i].lock) META.l[CR[i].lock] = 1; CI = i; selMap('koru', t); MSEL.chal = ''; resetRun(); start(); }, [pr.tier, HERO]);
  await pg.waitForFunction(() => S === 'play', null, { timeout: 60000 });
  await pg.evaluate(() => { S = 'pause'; window.__bot = null; });
  const T0 = Date.now();
  // güçlenme: her aşamada pr.farm sn oyna, boss'u anında devir, sonraki aşamaya geç; son aşamanın boss'u kademeyi bitirir
  let r;
  for (let st = 0; st < pr.tier; st++) {
    let g = 0;
    do { r = await chunk(pg, 1800, 'farm', pr.farm); } while (!r.stop && ++g < 60);
    if (r.stop != 'farm') { console.log(prof, 'güçlenme kesildi:', r.stop, JSON.stringify(r.death), 'stT', r.stT, 'can', r.hp + '/' + r.mh, r.w, r.t); break; }
    const last = st == pr.tier - 1;
    await pg.evaluate(last => {
      S = 'play';
      // geçiş boyunca ölümsüz: boss beklenirken ve yeni aşama yüklenirken oyun gerçek zamanlı akar, bot can doldurmaz;
      // makine yüklüyken bu aralık uzayıp güçlenme evresinde ölüme yol açıyordu. Sonraki chunk'tan önce kaldırılır.
      P.inv = 1e9;
      if (GATE && GATE.st == 0) summonBoss();
      for (let i = 0; i < 400 && !E.some(e => e.t === 3 && e.boss); i++) { upd(1 / 60); P.hp = P.mh; } // arenada boss kendisi gelir
      for (const e of E) if (e.t === 3 && e.boss) { e.hp = 0; killE(e); }
      for (const e of E) if (e.kd && e.kd.fx && e.kd.fx.pylon) { e.hp = 0; killE(e); }
      E = E.filter(e => !e.dead);
      if (S === 'choice') chPick(0); if (S === 'item') closeItem();
      if (!last) { GATE.st = 2; nextStage(); } else S = 'pause';
    }, last);
    if (!last) {
      await pg.waitForFunction(() => S === 'play' || S === 'ready', null, { timeout: 30000 }).catch(() => {});
      await pg.evaluate(() => { if (S === 'ready') goReady(); if (S === 'play') S = 'pause'; });
    }
    await pg.evaluate(() => { P.inv = 0; P.hp = P.mh; });
  }
  const pre = await pg.evaluate(([boost, setT]) => {
    if (boost) {
      for (const w of P.W) w.lv = Math.round(w.lv * 1.5);
      for (const t of P.T) { t.lv += 6; t.v = (t.v || 0) + (TDF[t.k].v || 0) * 6; }
      if (setT) P.T = setT.split(',').map(x => { const [k, l] = x.split(':'); if (!TDF[k] || !TDF[k].v) throw new Error('SET_T yalnız tek statlı tomlar: ' + k); return { k, lv: +l, v: TDF[k].v * +l }; });
      const good = Object.keys(ITD).filter(k => (ITD[k].r == 2 || ITD[k].r == 3) && !ITD[k].cor);
      for (let i = 0; i < 8; i++) addItem(good[Math.floor(Math.random() * good.length)], 1);
      calc();
    }
    return { won: P.won, swarm: P.swarm, lv: P.lv, mh: Math.round(P.mh), w: P.W.map(w => w.k + w.lv).join(' '), t: P.T.map(t => t.k + t.lv).join(' '), items: Object.values(P.I).reduce((a, b) => a + b, 0), kills, dmg: +P.C.dmg.toFixed(2), arm: +(P.C.armE || 0).toFixed(2), regen: +(P.C.regen || 0).toFixed(1) };
  }, [!!pr.boost, process.env.SET_T || '']);
  if (!pre.swarm) { console.log(prof, 'Son Dalga başlamadı', JSON.stringify(pre)); await pg.close(); continue; }
  console.log(prof, 'Son Dalga başında:', JSON.stringify(pre), '| güçlenme', Math.round((Date.now() - T0) / 1000), 'sn');
  await pg.evaluate(() => { window.__bot.log = []; window.__gd = {}; window.__hm = {}; window.__ls = {}; window.__hp = {}; window.__bot.k0 = kills; window.__bot.ls0 = P.c.lsheal || 0; window.__bot.ev0 = P.c.evade || 0; window.__bot.lastMin = -1; window.__bot.d0 = 0; P.hp = P.mh; });
  let g = 0;
  do { r = await chunk(pg, 1800, 'sd', CAP); } while (!r.stop && ++g < 2000);
  const gd = await pg.evaluate(() => window.__gd || null);
  const hm = await pg.evaluate(() => window.__hm || null);
  const lsd = await pg.evaluate(() => window.__ls || null);
  const hpd = await pg.evaluate(() => window.__hp || null);
  const log = await pg.evaluate(() => window.__bot.log), gk = await pg.evaluate(() => window.__bot.gk || {});
  const sdKills = r.kills - pre.kills;
  const res = { prof, hero: HERO, tier: pr.tier, sonuc: r.stop, sure: r.sw, sdOldurme: sdKills, toplam: r.kills, lvSon: r.lv, death: r.death, son: { w: r.w, t: r.t, il: r.il, C: r.C }, nan: r.nan, hata: [...new Set(errs)].slice(0, 3), pre, log };
  out.push(res);
  console.log(prof, '→', r.stop, 'Son Dalga', r.sw, 'sn, öldürme', sdKills, '(toplam', r.kills + ')', r.death ? 'ölüm: ' + JSON.stringify(r.death) : '');
  console.log('  Albastıyı öldüren:', JSON.stringify(gk));
  console.log('  dk  öldürme/dk  can      düşman  albastı  kademe  hasarÇ  canÇ  alınan');
  for (const l of log) console.log('  ' + [String(l.dk).padEnd(3), String(l.dkOld).padEnd(11), (l.hp + '/' + l.mh).padEnd(8), String(l.en).padEnd(7), String(l.ghosts).padEnd(8), String(l.ghW).padEnd(7), String(l.dmk).padEnd(7), String(l.hpx).padEnd(5), String(l.alinan).padEnd(8), 'çalma ' + l.ls, 'kaçış ' + l.ev, 'eva ' + l.eva + '/' + l.evaR, 'ls ' + l.lsC].join(' '));
  console.log('  son:', JSON.stringify(res.son));
  if (gd && Object.keys(gd).length) console.log('  Albastıya hasar:', Object.entries(gd).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, v]) => k + ' ' + v.toExponential(2)).join(' | '));
  if (hm && Object.keys(hm).length) console.log('  Albastı vuruşunda kanca çarpanı (geometrik ort. × / vuruş sayısı):', Object.entries(hm).map(([k, r]) => [k, Math.exp(r[0] / r[1]), r[1], r[2]]).filter(x => Math.abs(x[1] - 1) > .01 || x[0] == 'TOPLAM').sort((a, b) => b[1] - a[1]).map(x => x[0] + ' ×' + x[1].toFixed(2) + ' (' + x[2] + (x[3] ? ', en çok ×' + x[3].toExponential(1) : '') + ')').join(' | '));
  if (lsd && Object.keys(lsd).length) console.log('  can çalma kaynağı:', Object.entries(lsd).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, v]) => k + ' ' + v).join(' | '));
  if (hpd && Object.keys(hpd).length) console.log('  hurtP:', JSON.stringify(hpd));
  console.log('  statlar (dk):\n' + log.filter(l => l.dk % 5 == 0).map(l => '    ' + l.dk + ' ' + JSON.stringify(l.st)).join('\n'));
  console.log('  Albastı azami canı (dk):', log.map(l => l.dk + ':' + (l.gmh || 0).toExponential(1)).join(' '));
  if (errs.length) console.log('  sayfa hatası:', [...new Set(errs)].slice(0, 3).join(' | '));
  await pg.close();
}
fs.mkdirSync('test-results', { recursive: true });
fs.writeFileSync('test-results/sondalga-' + HERO + '-' + seed + '.json', JSON.stringify({ url, seed, cap: CAP, out }, null, 1));
await br.close();
