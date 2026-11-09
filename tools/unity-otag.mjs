// Unity için Otağ verisi: kalıcı yükseltmeler (MU), gümüşle açılanlar (ML), görevler (QD) ve kilitler. Görev koşulları
// (f) web'de JS kapanışları; burada sade bir ifade diline çevrilir (yardımcılar: cnt, tomLv, wLv, runC, runK, runV, swT,
// diffPct, heroK, unlCount, rankCount, keysLen, tierAny; M = kalıcı kayıt, P = koşu) ve sayfadaki gerçek değerle sınanır.
// node tools/unity-otag.mjs <oyun url> <çıktı json>
import { chromium } from 'playwright';
import fs from 'node:fs';
const [url, out] = process.argv.slice(2);
const br = await chromium.launch({ executablePath: process.env.CHROME, headless: true, args: ['--use-angle=swiftshader'] });
const pg = await (await br.newContext({ viewport: { width: 640, height: 360 } })).newPage();
await pg.addInitScript(() => { localStorage.setItem('kk_tut', '1'); });
await pg.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
await pg.waitForFunction(() => typeof S !== 'undefined' && S === 'menu', null, { timeout: 90000 });
const res = await pg.evaluate(async () => {
  const CT = await import('/src/data/content.js'), H = await import('/src/game/heroes.js'), { $G } = await import('/src/core/store.js');
  const CH = await import('/src/data/challenges.js');
  const CR = H.CR, HI = H.heroIdx();
  const MAN = {
    t_chaos: "[P && P.tier >= 3 ? ((runC('chgall0') ? 1 : 0) + (runC('chgall1') ? 1 : 0) + (runC('chgall2') ? 1 : 0)) : 0, 3]",
    h_sarik: "[P && heroK() == 'kam' ? ((wLv('fire') >= 40 ? 1 : 0) + (wLv('zap') >= 40 ? 1 : 0) + (wLv('blood') >= 40 ? 1 : 0)) : 0, 3]"
  };
  const norm = (src, q) => {
    if (MAN[q.k]) return MAN[q.k];
    let s = src.replace(/^\(\)\s*=>\s*/, '').trim();
    // başarım üreteçlerinin kapanış değişkenleri anahtardan: a_k100 (n), a_m_koru2 (t), a_c_alp (i)
    let m;
    if ((m = /^a_[a-z]+(\d+)$/.exec(q.k))) s = s.replace(/\bn\]/, m[1] + ']').replace(/tot\(\)/, '(M.st.k + runK())');
    if ((m = /^a_m_(\w+?)(\d)$/.exec(q.k))) s = s.replace(/>= t\b/, '>= ' + m[2]);
    if ((m = /^a_c_(\w+)$/.exec(q.k))) s = s.replace(/\+ i\)/, '+ ' + CR.findIndex(c => c.k == m[1]) + ')');
    if (s.startsWith('{')) return null;
    s = s.replace(/CR\.findIndex\(c => c\.k == '(\w+)'\)/g, (_, k) => CR.findIndex(c => c.k == k));
    s = s.replace(/heroIdx\(\)\.filter\(i => rankOf\(i\) >= (\d+)\)\.length/g, 'rankCount($1)').replace(/heroIdx\(\)\.length/g, HI.length);
    s = s.replace(/Object\.keys\(\$G\.META\.l\)\.filter\(k => !k\.startsWith\('q_'\) && !k\.startsWith\('hat_'\)\)\.length/g, 'unlCount()');
    s = s.replace(/Object\.keys\(\$G\.META\.(\w+)\)\.length/g, "keysLen('$1')");
    s = s.replace(/Object\.keys\(\$G\.META\.hat\)\.filter\(k => k != 'cur' && \$G\.META\.hat\[k\] === 1\)\.length/g, 'hatCount()').replace(/Object\.keys\(\$G\.META\.skin\)\.filter\(k => k\.includes\(':'\)\)\.length/g, 'skinCount()');
    s = s.replace(/Object\.values\(\$G\.META\.tier\)\.some\(t => t >= (\d+)\)/g, 'tierAny($1)');
    // [a, b].filter(v => İFADE).length → toplam
    s = s.replace(/\[([^\]]*)\]\.filter\((\w+) => ([^)]*\)[^)]*)\)\.length/g, (_, l, v, e) => '(' + l.split(',').map(x => '(' + e.replace(new RegExp('\\b' + v + '\\b', 'g'), x.trim()) + ' ? 1 : 0)').join(' + ') + ')');
    if (q.k.startsWith('ch_')) s = s.replace(/Object\.keys\(\$G\.META\.chal\)\.some\(x => x\.split\(':'\)\[0\] == c\.k\)/, `chalDone('${q.k.slice(3)}')`);
    if (q.k.startsWith('s_')) { const i = CR.findIndex(c => 's_' + c.k == q.k); s = s.replace(/\+ i\)/, `+ ${i})`); }
    // karmaşık başarım/görev ifadeleri: Unity'deki yardımcı adlarına
    s = s.replace(/\$G\.P && \$G\.P\.IS && \$G\.P\.IS\.kzLast == '(\w+)' \? \$G\.P\.IS\.kzRun : 0/g, "kzRun('$1')");
    s = s.replace(/\$G\.P\.I\.(\w+) \|\| 0/g, "item('$1')");
    s = s.replace(/HI\.filter\(i => unl\(CR\[i\]\.lock\)\)\.length/g, 'heroesUnl()').replace(/HI\.length/g, HI.length);
    s = s.replace(/Math\.max\(0, \.\.\.HI\.map\(i => rankOf\(i\)\)\)/g, 'rankMax()').replace(/HI\.filter\(i => rankOf\(i\) >= (\d+)\)\.length/g, 'rankCount($1)');
    s = s.replace(/Object\.keys\(WD\)\.filter\(k => unl\(WD\[k\]\.lock\)\)\.length, Object\.keys\(WD\)\.length/, 'unlW(), ' + Object.keys(CT.WD).length);
    s = s.replace(/Object\.keys\(TDF\)\.filter\(k => unl\(TDF\[k\]\.lock\)\)\.length, Object\.keys\(TDF\)\.length/, 'unlT(), ' + Object.keys(CT.TDF).length);
    s = s.replace(/Object\.keys\(ITD\)\.filter\(k => !ITD\[k\]\.q && unl\(ITD\[k\]\.lock\)\)\.length, Object\.keys\(ITD\)\.filter\(k => !ITD\[k\]\.q\)\.length/, 'unlI(), ' + Object.keys(CT.ITD).filter(k => !CT.ITD[k].q).length);
    s = s.replace(/Object\.keys\(\$G\.P\.I\)\.length/g, 'itemKinds()');
    s = s.replace(/new Set\(Object\.keys\(\$G\.META\.chal\)\.map\(x => x\.split\(':'\)\[0\]\)\)\.size, CHAL\.length/, 'chalKinds(), ' + (CH.CHAL || []).length);
    s = s.replace(/MU\.filter\(u => mu\(u\.k\) >= u\.m\)\.length, MU\.length/, 'muMaxed(), ' + CT.MU.length);
    s = s.replace(/\$G\.META/g, 'M').replace(/\$G\.P/g, 'P').replace(/\$G\.kills/g, 'kills()').replace(/CR_K\(\)/g, 'heroK()');
    s = s.replace(/;?\s*\}?\s*$/, '');
    if (!s.startsWith('[') || !s.endsWith(']')) return null;
    return s;
  };
  const QD = CT.QD.map(q => ({ k: q.k, n: q.n, r: q.r, ul: q.ul || null, e: norm(q.f.toString(), q) }));
  // sınama: çevrilen ifade sayfanın gerçek META'sıyla aynı sonucu verir mi
  const M = $G.META, P = $G.P;
  const cnt = CT.cnt, tomLv = () => 0, wLv = () => 0, runC = () => 0, runK = () => 0, runV = () => 0, swT = () => 0, diffPct = () => 0, kills = () => 0, heroK = () => CR[$G.CI].k;
  const unlCount = () => Object.keys(M.l).filter(k => !k.startsWith('q_') && !k.startsWith('hat_')).length, rankCount = n => HI.filter(i => H.rankOf(i) >= n).length;
  const kzRun = k => P && P.IS && P.IS.kzLast == k ? P.IS.kzRun : 0, item = k => P ? P.I[k] || 0 : 0, heroesUnl = () => HI.filter(i => !CR[i].lock || M.l[CR[i].lock]).length, rankMax = () => Math.max(0, ...HI.map(i => H.rankOf(i)));
  const unlW = () => Object.keys(CT.WD).filter(k => !CT.WD[k].lock || M.l[CT.WD[k].lock]).length, unlT = () => Object.keys(CT.TDF).filter(k => !CT.TDF[k].lock || M.l[CT.TDF[k].lock]).length, unlI = () => Object.keys(CT.ITD).filter(k => !CT.ITD[k].q && (!CT.ITD[k].lock || M.l[CT.ITD[k].lock])).length, itemKinds = () => P ? Object.keys(P.I).length : 0;
  const chalKinds = () => new Set(Object.keys(M.chal).map(x => x.split(':')[0])).size, muMaxed = () => CT.MU.filter(u => (M.u[u.k] || 0) >= u.m).length;
  const hatCount = () => Object.keys(M.hat).filter(k => k != 'cur' && M.hat[k] === 1).length, skinCount = () => Object.keys(M.skin).filter(k => k.includes(':')).length;
  const keysLen = k => Object.keys(M[k]).length, tierAny = n => Object.values(M.tier).some(t => t >= n), chalDone = k => Object.keys(M.chal).some(x => x.split(':')[0] == k);
  let bad = [];
  for (const q of QD) {
    if (!q.e) { bad.push(q.k + ' (çevrilemedi)'); continue; }
    try { const v = eval(q.e); const w = CT.QD.find(x => x.k == q.k).f(); if (v[1] != w[1] || v[0] != w[0]) bad.push(q.k + ' farklı ' + JSON.stringify(v) + ' ' + JSON.stringify(w)); } catch (e) { bad.push(q.k + ' hata ' + e.message + ' :: ' + q.e); }
  }
  const lk = o => Object.fromEntries(Object.entries(o).filter(([k, v]) => v.lock).map(([k, v]) => [k, v.lock]));
  return {
    MU: CT.MU, ML: CT.ML, QD, CRL: CR.filter(c => !c.off).map(c => ({ k: c.k, lock: c.lock || null, cost: c.cost || 0, ud: c.ud || '' })),
    LK: { w: lk(CT.WD), t: lk(CT.TDF), i: lk(CT.ITD) }, CHAL: (CH.CHAL || []).map(c => ({ k: c.k, n: c.n })), bad
  };
});
fs.writeFileSync(out, JSON.stringify(res));
console.log('MU', res.MU.length, 'ML', res.ML.length, 'QD', res.QD.length, 'kilit', Object.keys(res.LK.w).length, Object.keys(res.LK.t).length, Object.keys(res.LK.i).length);
console.log('sorunlu', res.bad.length); for (const b of res.bad.slice(0, 60)) console.log(' ', b);
await br.close();
