// Yerel Supabase taklidi: supabase/siralama.sql ve supabase/liveops.sql'i süreç içi gerçek Postgres'te (PGlite) çalıştırır,
// oyunun ve yönetim panelinin kullandığı uçları (Auth: signup, token, logout; REST: tablo okuma, rpc) üstüne koyar.
// Kurallar taklit edilmez, SQL'in kendisi çalışır: yetki (RLS, yönetici denetimi) gerçek sunucudaki gibidir.
// Veri bellekte durur, süreç kapanınca gider. Üretime hiçbir şey gitmez.
//
//   npm i --prefix /tmp/pg @electric-sql/pglite
//   PGLITE=/tmp/pg/node_modules/@electric-sql/pglite/dist/index.js node tools/yerel-supa.mjs [port=8787] [--tohum]
//   VITE_SUPABASE_URL=http://127.0.0.1:8787 VITE_SUPABASE_ANON_KEY=test npm run dev
//
// --tohum: örnek veri (oyuncular, 14 günlük koşu kaydı, sıralama, bir etkinlik) ve bir yönetici hesabı açar.
// Yerel sınama hesapları (yalnız bu taklit sunucuda geçerli): tools/yerel-supa-sabit.mjs.
import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { TOHUM_OYUNCU, TOHUM_YONETICI } from './yerel-supa-sabit.mjs';

const mod = process.env.PGLITE;
if (!mod) { console.error('PGLITE ortam değişkeni gerekli (dosyanın başındaki nota bak)'); process.exit(2); }
const { PGlite } = await import(pathToFileURL(path.resolve(mod)).href);
const kok = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const PORT = +(process.argv.slice(2).find(a => /^\d+$/.test(a)) || 8787), TOHUM = process.argv.includes('--tohum');
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

const db = new PGlite();
await db.exec(`
  create role anon nologin; create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key default gen_random_uuid(), raw_user_meta_data jsonb not null default '{}');
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema public, auth to anon, authenticated;
`);
for (const f of ['siralama.sql', 'liveops.sql']) await db.exec(fs.readFileSync(path.join(kok, 'supabase', f), 'utf8'));

// ---- Auth (bellekte): e-posta → { id, ad, pw }
const users = new Map(), tokens = new Map(), refresh = new Map();
const rnd = () => crypto.randomBytes(18).toString('hex');
async function kayit(email, ad, pw) {
  const id = (await db.query(`insert into auth.users (raw_user_meta_data) values ($1) returning id`, [{ ad }])).rows[0].id;
  const u = { id, email, ad, pw };
  users.set(email, u);
  return u;
}
const oturum = u => {
  const at = rnd(), rt = rnd();
  tokens.set(at, u.id);
  refresh.set(rt, u.id);
  return { access_token: at, refresh_token: rt, expires_in: 3600, token_type: 'bearer', user: { id: u.id, email: u.email, user_metadata: { ad: u.ad } } };
};
const kim = req => { const m = /^Bearer (.+)$/.exec(req.headers.authorization || ''); return (m && tokens.get(m[1])) || null; };
// oyunun kullandığı e-posta biçimi (ui/hesap.js adEposta)
export const adEposta = ad => 'u' + [...new TextEncoder().encode(String(ad).toLocaleLowerCase('tr-TR'))].map(x => x.toString(16).padStart(2, '0')).join('') + '@oyuncu.kara-koru.app';

// rol ve kimlikle sorgu (RLS ve auth.uid() gerçek sunucudaki gibi işler)
async function sor(id, sql, par = []) {
  return db.transaction(async tx => {
    await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [id || '']);
    await tx.exec(`set local role ${id ? 'authenticated' : 'anon'}`);
    return (await tx.query(sql, par)).rows;
  });
}
// Postgres hata kodu → PostgREST HTTP durumu
const durum = kod => kod == '42501' ? 403 : /^PT(\d{3})$/.test(kod) ? +kod.slice(2) : kod == '42883' ? 404 : kod == '23505' ? 409 : 400;
const AD = /^[a-z_][a-z0-9_]*$/;

// PostgREST'in oyunun kullandığı alt kümesi: select, eşitlik / gt süzgeci, order, limit
function tabloSql(tablo, q) {
  const sel = (q.get('select') || '*').split(',').map(c => c.trim());
  if (!AD.test(tablo) || !sel.every(c => c == '*' || AD.test(c))) throw Object.assign(new Error('gecersiz istek'), { code: '22023' });
  const kosul = [], par = [];
  for (const [k, v] of q) {
    if (['select', 'order', 'limit', 'offset'].includes(k)) continue;
    const m = /^(eq|gt|gte|lt|lte)\.(.*)$/.exec(v);
    if (!AD.test(k) || !m) throw Object.assign(new Error('gecersiz suzgec'), { code: '22023' });
    par.push(m[2]);
    kosul.push(`${k} ${{ eq: '=', gt: '>', gte: '>=', lt: '<', lte: '<=' }[m[1]]} $${par.length}`);
  }
  const ord = (q.get('order') || '').split(',').filter(Boolean).map(o => { const [c, d] = o.split('.'); if (!AD.test(c)) throw Object.assign(new Error('gecersiz sira'), { code: '22023' }); return c + (d == 'desc' ? ' desc' : ''); });
  const ne = `from public.${tablo}` + (kosul.length ? ' where ' + kosul.join(' and ') : '');
  return { sql: `select ${sel.join(', ')} ${ne}` + (ord.length ? ' order by ' + ord.join(', ') : '') + ` limit ${Math.min(1000, +q.get('limit') || 1000)}`, say: `select count(*)::int n ${ne}`, par };
}

const sunucu = http.createServer((req, res) => {
  let body = '';
  req.on('data', d => (body += d));
  req.on('end', async () => {
    const u = new URL(req.url, 'http://x'), yol = u.pathname, q = u.searchParams;
    const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*', 'Access-Control-Expose-Headers': 'Content-Range' };
    const yanit = (kod, j, bas = {}) => { res.writeHead(kod, { 'Content-Type': 'application/json', ...CORS, ...bas }); res.end(j === undefined || kod == 204 ? '' : JSON.stringify(j)); };
    if (req.method == 'OPTIONS') return yanit(204);
    let j = {};
    try { j = body ? JSON.parse(body) : {}; } catch (e) {}
    try {
      // ---- Auth
      if (yol == '/auth/v1/signup' && req.method == 'POST') {
        const ad = j.data && j.data.ad;
        if (!j.email || typeof j.password != 'string' || j.password.length < 6) return yanit(422, { error_code: 'weak_password', msg: 'Password should be at least 6 characters' });
        if (users.has(j.email)) return yanit(422, { error_code: 'user_already_exists', msg: 'User already registered' });
        let k;
        try { k = await kayit(j.email, ad, j.password); } catch (e) { return yanit(500, { msg: 'Database error saving new user' }); }
        log('kayıt', ad);
        return yanit(200, oturum(k));
      }
      if (yol == '/auth/v1/token' && req.method == 'POST') {
        if (q.get('grant_type') == 'password') {
          const k = users.get(j.email);
          if (!k || k.pw !== j.password) return yanit(400, { error_code: 'invalid_credentials', msg: 'Invalid login credentials' });
          log('giriş', k.ad);
          return yanit(200, oturum(k));
        }
        if (q.get('grant_type') == 'refresh_token') {
          const id = refresh.get(j.refresh_token), k = id && [...users.values()].find(x => x.id == id);
          if (!k) return yanit(400, { error_code: 'refresh_token_not_found', msg: 'Invalid Refresh Token' });
          refresh.delete(j.refresh_token);
          return yanit(200, oturum(k));
        }
      }
      if (yol == '/auth/v1/logout' && req.method == 'POST') return yanit(204);
      // ---- rpc: gövdedeki anahtarlar adlı değişken olur
      let m = /^\/rest\/v1\/rpc\/([a-z_][a-z0-9_]*)$/.exec(yol);
      if (m && req.method == 'POST') {
        const ad = Object.keys(j);
        if (!ad.every(a => AD.test(a))) return yanit(400, { code: '22023', message: 'gecersiz degisken' });
        const var_ = await db.query(`select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = $1`, [m[1]]);
        if (!var_.rows.length) return yanit(404, { code: 'PGRST202', message: 'Could not find the function public.' + m[1] });
        const r = await sor(kim(req), `select public.${m[1]}(${ad.map((a, i) => `${a} => $${i + 1}`).join(', ')}) as r`, ad.map(a => j[a] !== null && typeof j[a] == 'object' ? JSON.stringify(j[a]) : j[a]));
        log('rpc', m[1]);
        return r[0].r === null || r[0].r === undefined || r[0].r === '' ? yanit(204) : yanit(200, r[0].r);
      }
      // ---- tablo okuma
      m = /^\/rest\/v1\/([a-z_][a-z0-9_]*)$/.exec(yol);
      if (m && (req.method == 'GET' || req.method == 'HEAD')) {
        const t = tabloSql(m[1], q), id = kim(req);
        if (req.method == 'HEAD') { const n = (await sor(id, t.say, t.par))[0].n; return yanit(200, undefined, { 'Content-Range': (n ? '0-0' : '*') + '/' + n }); }
        return yanit(200, await sor(id, t.sql, t.par));
      }
      log('bilinmeyen', req.method, req.url);
      yanit(404, { message: 'yok' });
    } catch (e) {
      const kod = e.code || '';
      log('hata', req.method, yol, kod, String(e.message).slice(0, 120));
      yanit(durum(kod), { code: kod, message: String(e.message) });
    }
  });
});

// ---- örnek veri: panelin dolu görünmesi için. Doğrudan tablolara yazılır (geçmiş tarihli kayıt işlevle yazılamaz).
async function tohum() {
  let s = 20261111;
  const r = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const adlar = ['bozkurt', 'umay', 'erlik_han', 'tulpar', 'kayra', 'ulgen', 'ayzit', 'tengri', 'alpaslan', 'gokbori', 'yelbegen', 'sheqo', 'cone', 'sickyG', 'yigidev', 'kutlu', 'ozan', 'bars', 'toygar', 'cicek', 'demir', 'ilbilge', 'kurmay', 'tomris', 'ece', 'bayan', 'suyun', 'tarkan'];
  const y = await kayit(adEposta(TOHUM_YONETICI.ad), TOHUM_YONETICI.ad, TOHUM_YONETICI.sifre);
  await db.query(`insert into public.kk_yonetici (id) values ($1)`, [y.id]);
  const o = await kayit(adEposta(TOHUM_OYUNCU.ad), TOHUM_OYUNCU.ad, TOHUM_OYUNCU.sifre);
  const ids = [o.id];
  for (const a of adlar) ids.push((await kayit(adEposta(a), a, rnd())).id);
  // hesaplar son 20 güne yayılır
  for (const id of ids) await db.query(`update public.kk_hesap set olus = now() - make_interval(secs => $2) where id = $1`, [id, Math.floor(r() * 20 * 86400)]);
  const kahraman = [0, 0, 0, 1, 1, 8, 8, 8, 2, 3, 16, 17, 18], neden = ['gulyabani', 'okcu', 'boss:tepegoz', 'karakoncolos', 'mumya', 'akrep', 'boss:erlik', 'hayalet', 'patlayan', 'kizilhayalet', 'boss:hortlakboss', 'dusme'];
  const silah = ['slash', 'bone', 'fire', 'zap', 'vortex', 'bolt', 'dexe'], tom = ['dmg', 'aspd', 'xp', 'hp', 'curse', 'regen', 'size'];
  let n = 0;
  for (let gun = 13; gun >= 0; gun--) {
    const adet = 22 + Math.floor(r() * 26) + (13 - gun) * 2;
    for (let i = 0; i < adet; i++) {
      const id = ids[Math.floor(r() * r() * ids.length)], c = kahraman[Math.floor(r() * kahraman.length)], yet = .4 + r() * r() * 2.2;
      const t = Math.floor(120 + r() * r() * 1900 * Math.min(1.4, yet)), sA = t > 1500 ? 2 : t > 700 ? 1 + (r() < .3 ? 1 : 0) : r() < .25 ? 1 : 0;
      const zafer = sA == 2 && r() < .35, lv = Math.max(3, Math.round(Math.min(125, 8 + t / 16 * (0.7 + r() * .6)))), k = Math.round(t * (2 + yet * 9) * (0.7 + r() * .6));
      const ret = r() < .012, ios = r() < .3;
      await db.query(`insert into public.kk_kosu_kayit (hesap, at, plat, surum, c, kademe, s, t, lv, k, gercek, sonuc, neden, ret, ozet)
        values ($1, now() - make_interval(secs => $2), $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [id, gun * 86400 + Math.floor(r() * 80000), ios ? 'ios' : 'web', ios ? '0.1.3' : '0.23.0', c, 1 + (r() < .25 ? 1 : 0) + (r() < .08 ? 1 : 0), sA, t, ret ? 400 + Math.floor(r() * 300) : lv,
          ret ? 400000 + Math.floor(r() * 600000) : k, ret ? 40 : t + Math.floor(r() * 90), zafer ? (r() < .5 ? 'zafer' : 'cikis') : 'olum', zafer ? '' : neden[Math.min(neden.length - 1, Math.floor(r() * (4 + sA * 4)))], ret,
          { w: [0, 1].map(() => [silah[Math.floor(r() * silah.length)], 5 + Math.floor(r() * 30), Math.floor(r() * 4e5)]), tm: [0, 1].map(() => [tom[Math.floor(r() * tom.length)], 3 + Math.floor(r() * 40)]), es: Math.floor(t / 22), au: Math.floor(t * 3) }]);
      n++;
    }
  }
  // sıralama tabloları koşu kayıtlarından kurulur (her oyuncunun en iyi koşusu; haftalık: bu haftanınkiler)
  await db.exec(`
    insert into public.kk_skor (id, ad, k, c, s, t, lv, ch, at)
    select distinct on (q.hesap) q.hesap, h.ad, q.k, q.c, q.s, q.t, q.lv, jsonb_build_object(q.c::text, jsonb_build_object('k', q.k, 's', q.s, 't', q.t)), q.at
    from public.kk_kosu_kayit q join public.kk_hesap h on h.id = q.hesap where not q.ret order by q.hesap, q.k desc;
    insert into public.kk_hafta (hafta, id, ad, k, c, s, t, lv, ch, at)
    select distinct on (q.hesap) public.kk_bu_hafta(), q.hesap, h.ad, q.k, q.c, q.s, q.t, q.lv, jsonb_build_object(q.c::text, jsonb_build_object('k', q.k, 's', q.s, 't', q.t)), q.at
    from public.kk_kosu_kayit q join public.kk_hesap h on h.id = q.hesap
    where not q.ret and q.at >= public.kk_bu_hafta()::timestamp at time zone 'Europe/Istanbul' order by q.hesap, q.k desc;
    insert into public.kk_etkinlik (baslik, metin, tur, bas, bit, carpan) values
      ('Çift tecrübe hafta sonu', 'Pazar gece yarısına kadar bütün tecrübe iki katı.', 'etkinlik', now() - interval '3 hours', now() + interval '2 days', '{"xp": 2}'),
      ('Yeni denge yayında', 'Seviye 60''tan sonra tecrübe gereği artıyor; Mavi İskelet artık sınırlı tecrübe veriyor.', 'duyuru', now() - interval '1 day', null, '{}'),
      ('Bakım: Cumartesi 04:00', 'Yarım saatlik kesinti planlandı.', 'uyari', now() + interval '2 days', now() + interval '3 days', '{}');
  `);
  log(`tohum: ${ids.length + 1} hesap, ${n} koşu kaydı; yönetici "${TOHUM_YONETICI.ad}", oyuncu "${TOHUM_OYUNCU.ad}" (şifreler tools/yerel-supa-sabit.mjs içinde)`);
}
if (TOHUM) await tohum();
sunucu.listen(PORT, '127.0.0.1', () => log('yerel supabase http://127.0.0.1:' + PORT + (TOHUM ? ' (örnek veriyle)' : '')));
