// Denge ölçümü: oyunu kendi kendine oynatır, her aşamada boss'u belli bir anda çağırır ve düşme süresini ölçer.
// Oyun mantığı el ile adımlanır (upd(1/60)); çizim beklenmez, bu yüzden bir aşama birkaç saniyede biter.
//
//   npm run build && npx vite preview --port 4173
//   node tests/denge.mjs http://localhost:4173/ [kademeler=1,2,3] [bossAnı=300] [tohum=4242]
//   bossAnı: ilk aşamada boss'un çağrıldığı saniye; sonraki aşamalarda LATER (varsayılan 120) sn sonra çağrılır
//   TIERM=1,1.6,2.15 node tests/denge.mjs ...   kademe çarpanını o koşu için değiştirir (aday denemek için)
//   Üç Diyar (8 Kasım 2026): her kademe üç aşama, Kara Koru → Kızıl Bozkır → Mühürlü Mahzen; kademeler yalnız zorluk.
//   CHAL=<anahtar> node tests/denge.mjs ...       meydan okumayla koşar (data/challenges.js)
//   HERO=kam ALL=1 node tests/denge.mjs ...       kahramanı seçer; ALL=1 bütün silah, tom, eşya ve kahraman kilitlerini açar
//   (8 kahramanlık etkin kadroyla tarama: her biri için bir koşu; sayfa hatası, NaN ve sıfır hasar aranır)
//   MORTAL=1 node tests/denge.mjs ...             bot ölümlü oynar: can doldurulmaz (yenilenme, can çalma, kalkan işler), ilk ölümde koşu biter
//   OUT=dosya.json                                 sonuç dosyası (paralel taramada çakışmasın)
//   Tarama örneği (7 Kasım 2026, YOL_HARITASI "Bot denge taraması"): 8 kahraman × 3 harita × 2 tohum, ölümlü ve ölümsüz
//   Mahzen (3. aşama): bot boss anında dört tabutu sırayla açar, bekçileri devirip anahtarları toplar, sonra Dev Hortlak'ı çağırır.
//
// Bot: en yakın düşmana yürür, yanındayken daire çizer (kristalleri toplar, sürüyü peşinde gezdirir). Seviye kartında önce boş silah
// slotunu doldurur, sonra silah yükseltmesi ile tomu dönüşümlü seçer. Altını yettiğinde en yakın sandığı açar.
// Sunak, tüccar ve kazan kullanmaz.
// Final arenasında direkleri doldurur. Ölmez: her karede canı doldurulur, alınan hasar ayrıca toplanır. Yani gerçek bir oyuncudan zayıf bir build
// ve cezasız bir hayatta kalma ölçer; sayılar mutlak değil, kademeler arası karşılaştırma içindir.
import { chromium } from 'playwright';
import fs from 'node:fs';

const url = process.argv[2] || 'http://localhost:4173/';
const tiers = (process.argv[3] || '1,2,3').split(',').map(Number);
const bossAt = +(process.argv[4] || 300), seed = +(process.argv[5] || 4242);
const TM = process.env.TIERM ? process.env.TIERM.split(',').map(Number) : null;
const MAP = 'koru'; // rota hep Kara Koru'dan başlar
const HERO = process.env.HERO || '', ALL = !!process.env.ALL, CHALK = process.env.CHAL || '';
const MORTAL = !!process.env.MORTAL;
const LATER = +(process.env.LATER || 120); // sonraki aşamalarda boss'un çağrıldığı an (aşama başından sn)
const CAP = 600; // boss bu kadar saniyede düşmezse ölçüm kesilir
const sleep = ms => new Promise(r => setTimeout(r, ms));
const MAC = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const exe = process.env.CHROME || ['/usr/bin/google-chrome', MAC].find(p => fs.existsSync(p));
const br = await chromium.launch({ executablePath: exe, headless: true, args: process.platform == 'darwin' ? ['--use-angle=metal', '--ignore-gpu-blocklist'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });

// n kare oynar. mode: 'farm' boss anına kadar, 'boss' boss ölene kadar. Dönüş: durum özeti.
const chunk = (pg, n, mode, until) => pg.evaluate(([n, mode, until, mortal]) => {
  const B = window.__bot || (window.__bot = { taken: 0, frames: 0, chests: 0, picks: 0, bossDmg: 0, bossPrev: 0 });
  // kart seçimi: yeni silah > (silah yükseltmesi / tom) dönüşümlü > ilk kart
  const pick = () => {
    if (CHM != 'level') return 0;
    const f = k => CHO.findIndex(o => o.kind == k);
    let i = f('Silah');
    if (i < 0) { const wu = f('Silah yükseltmesi'), tn = f('Tom'), tu = f('Tom yükseltmesi'), t = tn >= 0 ? tn : tu; i = B.picks % 2 == 0 ? (wu >= 0 ? wu : t) : (t >= 0 ? t : wu); }
    B.picks++;
    return Math.max(0, i);
  };
  const dmgSum = () => Object.values(P.wdmg || {}).reduce((a, b) => a + b, 0);
  const boss = () => mode == 'mini' ? E.find(e => e.keyDrop && !e.dead) : E.find(e => e.boss && !e.dead);
  const fight = mode == 'boss' || mode == 'mini';
  if (S === 'pause') S = 'play';
  if (S !== 'play') return { S, stop: 'durum' };
  K = fight && !mortal ? {} : { w: 1 };
  let done = '';
  for (let i = 0; i < n && !done; i++) {
    // ölümlü bot: basit bir oyuncu gibi kaçar. Düşman ve mermilerden uzaklaşır, güvendeyken kristale ya da uzaktaki düşmana gider,
    // boss dövüşünde boss'un çevresinde daire çizer; harita kenarından merkeze döner.
    if (mortal && !(fight && E.some(e => !e.dead && e.kd && e.kd.fx && e.kd.fx.pylon)) && B.frames % 4 == 0) {
      // 16 yön örneklenir; her yönde 2.5 ve 6 m ilerideki noktanın tehlikesi (yakın düşman ve mermi) ölçülür, en düşük maliyetli yön seçilir.
      // Hedef çekimi (kristal, boss çevresi, uzak düşman) ve harita kenarı maliyete eklenir; mevcut yöne küçük bir tercih titremeyi önler.
      const near = [], bul = [];
      for (const e of E) { if (e.dead) continue; const q = e.m.position; if (Math.abs(q.x - P.x) < 22 && Math.abs(q.z - P.z) < 22) near.push([q.x, q.z, (e.r || .5) + .6, e.boss ? 3 : e.mini ? 2 : 1]); }
      for (const q of EB || []) { const m = q.m.position; if (Math.abs(m.x - P.x) < 16 && Math.abs(m.z - P.z) < 16) bul.push([m.x, m.z, q.vx || 0, q.vz || 0]); }
      let tx = 0, tz = 0;
      const b = fight ? boss() : null;
      if (b) {
        const dx = P.x - b.m.position.x, dz = P.z - b.m.position.z, d = Math.hypot(dx, dz) || 1, want = 8 + (b.r || 0);
        tx = -dz / d + dx / d * (want - d) * .25; tz = dx / d + dz / d * (want - d) * .25;
      } else {
        let gd = 12, g = null;
        for (const o of G || []) { const d = Math.hypot(o.m.position.x - P.x, o.m.position.z - P.z); if (d < gd) { gd = d; g = o; } }
        if (g) { tx = (g.m.position.x - P.x) / gd; tz = (g.m.position.z - P.z) / gd; }
        else { let bd = 90, t = null; for (const e of E) { if (e.dead) continue; const d = Math.hypot(e.m.position.x - P.x, e.m.position.z - P.z); if (d < bd) { bd = d; t = e; } }
          if (t && bd > 5) { tx = (t.m.position.x - P.x) / bd; tz = (t.m.position.z - P.z) / bd; } }
      }
      const tl = Math.hypot(tx, tz); if (tl > 1) { tx /= tl; tz /= tl; }
      const lim = (ARENA || 270) - 6, cy = -Math.sin(yaw), cz = -Math.cos(yaw);
      let best = 1e9, bx = cy, bz = cz;
      for (let k = 0; k < 16; k++) {
        const a = k / 16 * Math.PI * 2, ux = Math.cos(a), uz = Math.sin(a);
        let c = 0;
        for (const L of [1.2, 2.8, 5.5]) {
          const px = P.x + ux * L, pz = P.z + uz * L, tL = L / 8; // yaklaşık 8 m/sn: o noktaya varış süresi
          for (const n of near) { const d = Math.hypot(n[0] - px, n[1] - pz) - n[2]; c += n[3] / Math.max(.25, d) ** 3 / L; }
          for (const q of bul) { const d = Math.hypot(q[0] + q[2] * tL - px, q[1] + q[3] * tL - pz); c += 3 / Math.max(.3, d) ** 2 / L; }
          if (Math.abs(px) > lim || Math.abs(pz) > lim) c += 5;
        }
        c -= (ux * tx + uz * tz) * .12 + (ux * cy + uz * cz) * .04;
        if (c < best) { best = c; bx = ux; bz = uz; }
      }
      yaw = yawT = Math.atan2(-bx, -bz);
      K = { w: 1 };
    } else if (mortal && B.frames % 4) { /* önceki yön sürer */ }
    else
    // güçlenme: en yakın düşman 6 m'den uzaksa ona yürür (yavaş düşmanlar daire çizen bota yetişemiyordu), yakınsa daire çizer
    if (!fight && !mortal) {
      if (B.frames % 12 == 0) { let bd = 60; B.tg = null; for (const e of E) { if (e.dead || e.kd && e.kd.fx && (e.kd.fx.pylon || e.kd.fx.flee)) continue; const d = Math.hypot(e.m.position.x - P.x, e.m.position.z - P.z); if (d < bd) { bd = d; B.tg = e; } } B.td = bd; }
      if (B.tg && !B.tg.dead && B.td > 6) yaw = yawT = Math.atan2(-(B.tg.m.position.x - P.x), -(B.tg.m.position.z - P.z));
      else yaw = yawT = yaw + .5 / 60;
    }
    // final arenası: korunan boss için dolmamış direğin yanına geçer (ışınlanır; gerçek oyuncu 12 m yürür)
    if (fight) { const py = E.find(e => !e.dead && e.kd && e.kd.fx && e.kd.fx.pylon); if (py) { const q = py.m.position; if (Math.hypot(q.x - P.x, q.z - P.z) > 3) { P.x = q.x + 1.5; P.z = q.z; P.y = groundAt(P.x, P.z, q.y + 5) + .1; P.vx = P.vz = P.vy = 0; } K = {}; }
      // direk yoksa boss'a yürür ve dibinde durur (gerçek oyuncu boss'a odaklanır; ileri yön -sin(yaw), -cos(yaw))
      else if (!mortal) { const b = boss(); if (b) { const dx = b.m.position.x - P.x, dz = b.m.position.z - P.z; if (Math.hypot(dx, dz) > 4 + b.r) { yaw = yawT = Math.atan2(-dx, -dz); K = { w: 1 }; } else K = {}; } } }
    const mh = P.mh;
    if (!mortal) P.hp = mh;
    const h0 = P.hp;
    upd(1 / 60);
    B.frames++;
    if (P.hp < h0) { B.taken += h0 - P.hp; B.hits = (B.hits || 0) + 1; }
    if (K.w && Math.hypot(P.vx, P.vz) < 3) B.slow = (B.slow || 0) + 1;
    if (S === 'choice') chPick(pick());
    else if (S === 'item') closeItem();
    else if (S === 'over') {
      // ölüm teşhisi: can her karede dolduğu için tek karede azami candan fazla hasar gerekir
      const near = E.filter(e => !e.dead && Math.hypot(e.m.position.x - P.x, e.m.position.z - P.z) < 8).sort((a, b) => b.dmg - a.dmg).slice(0, 3).map(e => (e.kind || e.t) + (e.mini ? '(ara)' : '') + (e.el ? '(elit)' : '') + ':' + Math.round(e.dmg));
      B.death = { mh: Math.round(mh), hp: Math.round(P.hp), arm: +(P.C.armE || 0).toFixed(2), diff: +diffMul().toFixed(2), dmk: +DMK().toFixed(2), yakin: near.join(' '), curse: +(P.C.curse || 0).toFixed(2), enDmg: P.C.enDmg || 1, ot: Math.round(P.ot || 0), swarm: P.swarm || 0, eb: EB.length, bz: (BZ || []).map(z => z.kind).join(), vurus: B.hits || 0, yavas: +((B.slow || 0) / B.frames).toFixed(2), hiz: +Math.hypot(P.vx, P.vz).toFixed(1), tt: Math.round(P.tt), lv: P.lv };
      if (!mortal) P.hp = P.mh; done = 'öldü'; break;
    }
    else if (S !== 'play') { done = 'durum:' + S; break; }
    if (B.frames % 180 == 0 && CH.length) {
      let c = null, bd = 1e9;
      for (const x of CH) { const d = Math.hypot(x.m.position.x - P.x, x.m.position.z - P.z); if (d < bd) { bd = d; c = x } }
      const g0 = P.gold, n0 = CH.length;
      if (c) { tryChest(c); if (CH.length < n0) B.chests++; if (S === 'item') closeItem(); }
    }
    { const b = boss(); if (b) { if (B.bossPrev > b.hp) B.bossDmg += B.bossPrev - b.hp; B.bossPrev = b.hp; } else B.bossPrev = 0; }
    if (mode == 'farm' && !B.d60 && P.tt >= until - 60) B.d60 = { d: dmgSum(), t: P.tt };
    if (mode == 'farm' && (P.tt >= until || boss())) done = 'bossAnı';
    if (mode == 'boss' && !boss() && GATE && GATE.st != 1) done = 'bossÖldü';
    if (mode == 'mini' && !boss()) done = 'bekçiÖldü';
  }
  K = {};
  if (S === 'play') S = 'pause';
  const b = boss();
  return {
    stop: done, S, stT: +P.stT.toFixed(1), tt: +P.tt.toFixed(1), lv: P.lv, mh: Math.round(P.mh), kills, taken: Math.round(B.taken), dmg: Math.round(dmgSum()),
    w: P.W.map(w => w.k + w.lv).join(' '), t: Object.keys(P.T || {}).map(k => k + (P.T[k].lv || P.T[k])).join(' '), items: Object.values(P.I || {}).reduce((a, b) => a + b, 0),
    chests: B.chests, death: B.death || null, nan: !isFinite(P.x + P.y + P.z + P.hp + P.mh + P.xp + P.gold), hero: CR[CI].k, ot: Math.round(P.ot || 0), sT: Math.round(P.stT - (P.stS || 0)), dbg: (() => { const py = E.filter(e => !e.dead && e.kd && e.kd.fx && e.kd.fx.pylon); return { py: py.length, pd: py.map(o => Math.round(Math.hypot(o.m.position.x - P.x, o.m.position.z - P.z)) + '/' + Math.round(Math.hypot(o.m.position.x, o.m.position.z)) + '/' + (o.chg || 0).toFixed(1)).join(' '), ph: b ? b.ph : -1, inv: b ? +!!b.pyInv : -1, wdis: P.wdis, arena: ARENA, pr: Math.round(Math.hypot(P.x, P.z)), bd: b ? Math.round(Math.hypot(b.m.position.x - P.x, b.m.position.z - P.z)) : -1 }; })(), dps60: B.d60 ? Math.round((dmgSum() - B.d60.d) / Math.max(1, P.tt - B.d60.t)) : 0, bossDmg: Math.round(B.bossDmg), dist: Math.round(P.c && P.c.dist || 0), gate: GATE ? GATE.st : -1, bossHp: b ? Math.round(b.hp) : 0, bossMh: b ? Math.round(b.mh) : 0, en: E.length, stage: P.stage, tier: P.tier
  };
}, [n, mode, until, MORTAL]);

const out = [];
for (const tier of tiers) {
  const pg = await br.newPage({ viewport: { width: 640, height: 360 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  pg.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|ERR_NAME|net::|Failed to load resource|pointer lock/i.test(m.text())) errs.push('konsol: ' + m.text().slice(0, 200)); });
  await pg.addInitScript(seed => {
  // Başsız Chrome'da bile fare kilidi (pointer lock) kullanıcının gerçek imlecini yakalayabiliyor; testler imlece dokunmasın
  Element.prototype.requestPointerLock = function () { return Promise.resolve(); };
    localStorage.setItem('kk_set', JSON.stringify({ q: 0, bl: 0, al: 0 })); localStorage.setItem('kk_tut', '1');
    localStorage.setItem('kk_meta', JSON.stringify({ v: 3, tier: { koru: 2, bozkir: 2, mezarlik: 2 }, l: { bozkir: 1, mezarlik: 1 } }));
    let s = seed; Math.random = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 };
  }, seed);
  await pg.goto(url);
  await pg.waitForFunction(() => typeof S !== 'undefined' && S === 'menu', null, { timeout: 90000 });
  await sleep(2000);
  await pg.evaluate(([t, tm, map, hero, all, chal]) => { SET.al = 0; SET.tips = 0; if (tm) tm.forEach((v, i) => TIERM[i] = v);
    if (all) { for (const T of [WD, TDF, ITD]) for (const k in T) if (T[k].lock) META.l[T[k].lock] = 1; for (const c of CR) if (c.lock) META.l[c.lock] = 1; }
    if (hero) { const i = CR.findIndex(c => c.k == hero); if (i < 0) throw new Error('kahraman yok: ' + hero); if (CR[i].lock) META.l[CR[i].lock] = 1; CI = i; }
    selMap(map, t); MSEL.chal = chal || ''; resetRun(); start(); }, [tier, TM, MAP, HERO, ALL, CHALK]);
  await pg.waitForFunction(() => S === 'play', null, { timeout: 60000 });
  const mp = await pg.evaluate(() => { S = 'pause'; window.__bot = null; return P.map + ' K' + P.tier + (P.chal ? ' ' + P.chal.k : ''); });
  if (CHALK && !mp.endsWith(CHALK)) { console.log('meydan okuma uygulanmadı:', mp); await pg.close(); continue; }
  if (!mp.startsWith(MAP)) { console.log('harita açılamadı:', mp); await pg.close(); continue; }
  for (let stage = 0; stage < 3; stage++) {
    // boss anına kadar oyna
    // ilk aşamada bossAt saniye, sonraki aşamalarda 120 saniye güçlenme süresi (koşu saatiyle)
    const t0 = await pg.evaluate(() => P.tt), until = t0 + (stage == 0 ? bossAt : LATER);
    let r, guard = 0;
    do { r = await chunk(pg, 1800, 'farm', until); } while (!r.stop && ++guard < 40);
    if (r.stop != 'bossAnı') { out.push({ tier, stage: stage + 1, hata: r.stop, ...r }); if (r.death) console.log('ÖLÜM', JSON.stringify(r.death)); break; }
    let pre = r;
    // Mezarlık: dört tabut, dört bekçi, dört anahtar
    if (await pg.evaluate(() => P.map) == 'mezarlik') {
      const tab = [];
      for (let i = 0; i < 4; i++) {
        const t0 = r.tt;
        const okc = await pg.evaluate(() => { S = 'play'; const c = SH.find(s => s.t === 10 && !s.d); if (!c) { S = 'pause'; return false; } const q = c.m.position; P.x = q.x + 2; P.z = q.z; P.y = groundAt(P.x, P.z, q.y + 5) + .1; P.vx = P.vz = P.vy = 0; useShrine(c); S = 'pause'; return true; });
        if (!okc) { tab.push('tabut yok'); break; }
        let g2 = 0;
        do { r = await chunk(pg, 600, 'mini', 0); } while (!r.stop && r.tt - t0 < 300 && ++g2 < 40);
        tab.push(r.stop == 'bekçiÖldü' ? +(r.tt - t0).toFixed(1) : '>' + (r.tt - t0).toFixed(0) + ' ' + r.stop);
      }
      const keys = await pg.evaluate(() => P.mz ? P.mz.keys : -1);
      console.log('tabut bekçileri (sn):', tab.join(' / '), '| anahtar:', keys, '| seviye:', r.lv);
      pre = { ...r, mz: { tab, keys } };
    }
    // boss: arena aşamasında kendiliğinden gelir, diğerlerinde çağrılır
    const b0 = await pg.evaluate(() => { S = 'play'; if (GATE && GATE.st == 0) summonBoss(); const b = E.find(e => e.boss && !e.dead); S = 'pause'; return b ? { mh: Math.round(b.mh), n: BN() } : null; });
    if (!b0) { out.push({ tier, stage: stage + 1, hata: 'boss gelmedi', ...r }); break; }
    guard = 0;
    do { r = await chunk(pg, 600, 'boss', 0); } while (!r.stop && r.tt - pre.tt < CAP && ++guard < 80);
    const sec = +(r.tt - pre.tt).toFixed(1), killed = r.stop == 'bossÖldü';
    if (r.stop == 'öldü' && r.death) console.log('ÖLÜM', JSON.stringify(r.death));
    out.push({
      tier, stage: stage + 1, hero: pre.hero, nan: pre.nan || r.nan, hata: errs.length, boss: b0.n, uzatma: pre.ot, asamaSn: pre.sT, lv: pre.lv, w: pre.w, t: pre.t, items: pre.items, chests: pre.chests, mh: pre.mh,
      dps: pre.dps60, bossHp: b0.mh, ttk: killed ? sec : '>' + sec, kalan: killed ? 0 : Math.round(r.bossHp / b0.mh * 100) + '%',
      bossDps: Math.round((r.bossDmg - pre.bossDmg) / Math.max(1, sec)), olum: r.stop == 'öldü' ? +r.tt.toFixed(0) : 0, dist: pre.dist, hasarAlinan: +(pre.taken / Math.max(1, pre.tt)).toFixed(1), hasarBoss: +((r.taken - pre.taken) / Math.max(1, sec)).toFixed(1), kills: pre.kills
    });
    console.log(JSON.stringify(out[out.length - 1]));
    if (!killed) console.log('TEŞHİS', r.stop, JSON.stringify(r.dbg));
    if (!killed || stage == 2) break;
    // sonraki aşama: geçit gerçek zamanlı 2.4 sn bekler
    // geçiş gerçek zamanlı akar (bot adımlamaz); bu sürede alınan hasar ölçüme girmesin
    await pg.evaluate(() => { S = 'play'; window.__bot.d60 = null; P.inv = 1e9; nextStage(); });
    await pg.waitForFunction(() => S === 'play' || S === 'ready', null, { timeout: 30000 }).catch(() => {});
    await pg.evaluate(() => { if (S === 'ready') goReady(); P.inv = 0; P.hp = P.mh; if (S === 'play') S = 'pause'; });
  }
  if (errs.length) console.log('sayfa hatası:', [...new Set(errs)].slice(0, 3).join(' | '));
  await pg.close();
}
const pad = (v, n) => String(v).padEnd(n);
console.log('\n(dps: boss anından önceki son 60 sn, bütün düşmanlara)\nkademe aşama seviye can   dps   bossCanı  düşmeSüresi  bossaDps  alınan/sn  bossAlınan/sn  silahlar');
for (const o of out) console.log(o.hata ? `${o.tier} ${o.stage} HATA: ${o.hata} (S=${o.S}, stT=${o.stT})` :
  [pad(o.tier, 6), pad(o.stage, 5), pad(o.lv, 6), pad(o.mh, 5), pad(o.dps, 5), pad(o.bossHp, 9), pad(o.ttk + ' sn', 12), pad(o.bossDps, 9), pad(o.hasarAlinan, 10), pad(o.hasarBoss, 14), o.w].join(' '));
fs.mkdirSync('test-results', { recursive: true });
fs.writeFileSync(process.env.OUT || 'test-results/denge-' + MAP + (TM ? '-' + TM.join('_') : '') + '.json', JSON.stringify({ url, map: MAP, hero: HERO, mortal: MORTAL, bossAt, seed, tierm: TM, out }, null, 1));
await br.close();
