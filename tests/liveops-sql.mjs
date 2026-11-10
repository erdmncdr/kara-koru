// supabase/siralama.sql + supabase/liveops.sql sınaması: iki dosyayı gerçek Postgres'te (PGlite, süreç içi) çalıştırır,
// yetki sınırlarını ve yönetim işlevlerini dener. Üretim veritabanına dokunmaz.
//
//   npm i --prefix /tmp/pg @electric-sql/pglite      (proje bağımlılığı değil; bir kez, istenen klasöre)
//   PGLITE=/tmp/pg/node_modules/@electric-sql/pglite/dist/index.js node tests/liveops-sql.mjs
//
// Supabase'e özgü parçalar taklit edilir: anon / authenticated rolleri, auth.users, auth.uid() (istek başlığındaki kimlik).
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const mod = process.env.PGLITE;
if (!mod) { console.error('PGLITE ortam değişkeni gerekli (dosyanın başındaki nota bak)'); process.exit(2); }
const { PGlite } = await import(pathToFileURL(path.resolve(mod)).href);
const kok = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const oku = f => fs.readFileSync(path.join(kok, 'supabase', f), 'utf8');

const db = new PGlite();
await db.exec(`
  create role anon nologin; create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key default gen_random_uuid(), raw_user_meta_data jsonb not null default '{}');
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema public, auth to anon, authenticated;
`);

let gecen = 0, kalan = 0;
const tamam = (ad, kosul, ek = '') => { if (kosul) gecen++; else kalan++; console.log((kosul ? 'GEÇTİ ' : 'KALDI ') + ad + (ek ? ' ' + ek : '')); };
// rol ve kimlikle tek sorgu; hata olursa { hata: kod }
async function sor(kim, sql, par = []) {
  try {
    return await db.transaction(async tx => {
      await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [kim && kim != 'anon' ? kim : '']);
      await tx.exec(`set local role ${kim == 'anon' ? 'anon' : kim ? 'authenticated' : 'postgres'}`);
      return (await tx.query(sql, par)).rows;
    });
  } catch (e) {
    return { hata: e.code || String(e.message) };
  }
}
const kok_ = (sql, par) => sor(null, sql, par);
const hataMi = (r, kod) => r && r.hata == kod;

// ---- 1. dosyalar iki kez çalışır
for (let i = 0; i < 2; i++) for (const f of ['siralama.sql', 'liveops.sql']) {
  try { await db.exec(oku(f)); } catch (e) { tamam(`${f} çalışır (${i + 1}. kez)`, false, e.message); process.exit(1); }
}
tamam('iki dosya iki kez hatasız çalışır', true);

// ---- 2. hesaplar
const yeni = async ad => (await kok_(`insert into auth.users (raw_user_meta_data) values ($1) returning id`, [{ ad }]))[0].id;
const A = await yeni('asena'), B = await yeni('bozkurt'), Y = await yeni('yonetici');
tamam('kayıt hesap satırını açar', (await kok_(`select count(*)::int n from public.kk_hesap`))[0].n == 3);

// ---- 3. yetki sınırları (yönetici yokken ve yönetici olmayan için)
tamam('anon yönetim özetini çağıramaz', hataMi(await sor('anon', `select public.kk_y_ozet()`), '42501'));
tamam('oyuncu yönetici değil', (await sor(A, `select public.kk_yonetici_mi() y`))[0].y === false);
for (const [ad, sql] of [
  ['özet', `select public.kk_y_ozet()`], ['ayar yazma', `select public.kk_y_ayar_yaz('denge', '{"sv_kat":9}')`],
  ['oyuncu listesi', `select public.kk_y_oyuncular()`], ['yasak', `select public.kk_y_yasak('${B}', true)`],
  ['skor silme', `select public.kk_y_skor_sil('${B}')`], ['sezon kapatma', `select public.kk_y_sezon_kapat('x')`],
  ['etkinlik yazma', `select public.kk_y_etkinlik_yaz(null, '{"baslik":"x"}')`], ['günlük', `select public.kk_y_gunluk_oku()`],
  ['koşu listesi', `select public.kk_y_kosular()`], ['gizleme', `select public.kk_y_gizle('${B}', true)`],
]) tamam('oyuncu çağıramaz: ' + ad, hataMi(await sor(A, sql), '42501'));
tamam('oyuncu kk_ayar tablosuna doğrudan yazamaz', hataMi(await sor(A, `insert into public.kk_ayar (anahtar, deger) values ('denge', '{}')`), '42501'));
tamam('oyuncu kk_yonetici tablosuna yazamaz', hataMi(await sor(A, `insert into public.kk_yonetici (id) values ('${A}')`), '42501'));
tamam('oyuncu iç denetim işlevini çağıramaz', hataMi(await sor(A, `select public.kk_y_kontrol()`), '42501'));
tamam('oyuncu koşu kayıtlarını okuyamaz', hataMi(await sor(A, `select * from public.kk_kosu_kayit`), '42501'));
tamam('oyuncu yönetici notunu okuyamaz', hataMi(await sor(A, `select yon_not from public.kk_hesap`), '42501'));
tamam('oyuncu yasak işaretini okuyamaz', hataMi(await sor(A, `select yasak from public.kk_hesap`), '42501'));
{ const r = await sor(A, `select id, ad from public.kk_hesap`); tamam('oyuncu yalnız kendi hesap satırını görür', r.length == 1 && r[0].id == A); }

// ---- 4. yönetici ve uzaktan ayar
await kok_(`insert into public.kk_yonetici (id) values ($1)`, [Y]);
tamam('yönetici tanınır', (await sor(Y, `select public.kk_yonetici_mi() y`))[0].y === true);
tamam('ayar yazılır', !(await sor(Y, `select public.kk_y_ayar_yaz('denge', '{"sv_kat":1.04}')`)).hata);
{ const r = await sor('anon', `select anahtar, deger from public.kk_ayar`); tamam('ayarı herkes okur', r.length == 1 && r[0].deger.sv_kat == 1.04); }
tamam('ayarı kimin yazdığı herkese açık değil', hataMi(await sor('anon', `select kim from public.kk_ayar`), '42501'));
await sor(Y, `select public.kk_y_ayar_yaz('denge', '{"sv_kat":1.05}')`);
{ const r = (await sor(Y, `select public.kk_y_ayar_gecmis() g`))[0].g; tamam('ayar geçmişi eskiyi ve yeniyi tutar', r.length == 2 && r[0].eski.sv_kat == 1.04 && r[0].yeni.sv_kat == 1.05 && r[0].ad == 'yonetici'); }
await sor(Y, `select public.kk_y_ayar_yaz('denge', null)`);
tamam('boş değer ayarı siler', (await sor('anon', `select 1 from public.kk_ayar`)).length == 0);
tamam('geçersiz anahtar reddedilir', hataMi(await sor(Y, `select public.kk_y_ayar_yaz('Denge!', '{}')`), '22023'));

// ---- 5. koşu, koşu kaydı, eski çağrı biçimi
const kosu = async (kim, geri = 600) => { const id = (await sor(kim, `select public.kk_kosu_basla() k`))[0].k; await kok_(`update public.kk_kosu set basla = now() - make_interval(secs => $2) where id = $1`, [id, geri]); return id; };
let k1 = await kosu(A);
tamam('koşu özetiyle biter', !(await sor(A, `select public.kk_kosu_bitir($1, 4200, 8, 2, 540, 96, $2)`, [k1, { p: 'web', v: '0.23.0', kd: 2, sn: 'olum', nd: 'gulyabani', w: [['bone', 21, 9000]], tm: [['xp', 12]], es: 14, au: 800 }])).hata);
{ const r = (await kok_(`select * from public.kk_kosu_kayit where hesap = $1`, [A]))[0];
  tamam('koşu kaydı alanları ayıklanır', r && r.plat == 'web' && r.surum == '0.23.0' && r.kademe == 2 && r.sonuc == 'olum' && r.neden == 'gulyabani' && r.k == 4200 && r.lv == 96 && !r.ret && r.gercek >= 599 && r.ozet.es == 14 && r.ozet.p === undefined); }
tamam('skor sıralamaya yazılır', (await sor('anon', `select k from public.kk_skor where id = $1`, [A]))[0]?.k == 4200);
let k2 = await kosu(B);
tamam('eski istemci (özetsiz, adlı değişkenlerle) çalışır', !(await sor(B, `select public.kk_kosu_bitir(p_kosu => $1, p_k => 9000, p_c => 1, p_s => 2, p_t => 580, p_lv => 110)`, [k2])).hata
  && (await sor('anon', `select k from public.kk_skor where id = $1`, [B]))[0]?.k == 9000);
tamam('belirteç tek kullanımlık', hataMi(await sor(B, `select public.kk_kosu_bitir($1, 10, 1, 0, 30, 2)`, [k2]), 'PT410'));
let k3 = await kosu(A, 5);
tamam('olanaksız skor hata vermez', !(await sor(A, `select public.kk_kosu_bitir($1, 900000, 8, 2, 2000, 500, '{"p":"web"}')`, [k3])).hata);
tamam('olanaksız skor ret olarak kaydedilir, sıralamaya yazılmaz', (await kok_(`select count(*)::int n from public.kk_kosu_kayit where hesap = $1 and ret`, [A]))[0].n == 1
  && (await sor('anon', `select k from public.kk_skor where id = $1`, [A]))[0].k == 4200);
let k4 = await kosu(A);
tamam('bozuk özet koşuyu düşürmez', !(await sor(A, `select public.kk_kosu_bitir($1, 100, 8, 0, 300, 20, '[1,2]')`, [k4])).hata);

// ---- 6. moderasyon
tamam('yasak', !(await sor(Y, `select public.kk_y_yasak($1, true, 'sahte skor')`, [A])).hata);
tamam('yasaklı oyuncu sıralamada görünmez', (await sor('anon', `select 1 from public.kk_skor where id = $1`, [A])).length == 0 && (await sor('anon', `select 1 from public.kk_hafta where id = $1`, [A])).length == 0);
tamam('yasaklı oyuncu koşu başlatamaz', hataMi(await sor(A, `select public.kk_kosu_basla()`), '42501'));
tamam('satır silinmedi (gizli)', (await kok_(`select gizli from public.kk_skor where id = $1`, [A]))[0].gizli === true);
await sor(Y, `select public.kk_y_yasak($1, false)`, [A]);
tamam('yasak kalkınca satır geri görünür, not kalır', (await sor('anon', `select 1 from public.kk_skor where id = $1`, [A])).length == 1 && (await kok_(`select yon_not from public.kk_hesap where id = $1`, [A]))[0].yon_not == 'sahte skor');
tamam('yönetici kendini yasaklayamaz', hataMi(await sor(Y, `select public.kk_y_yasak($1, true)`, [Y]), '22023'));
await sor(Y, `select public.kk_y_gizle($1, true)`, [B]);
tamam('gizlenen oyuncu görünmez ama oynar', (await sor('anon', `select 1 from public.kk_skor where id = $1`, [B])).length == 0 && !(await sor(B, `select public.kk_kosu_basla()`)).hata);
await sor(Y, `select public.kk_y_gizle($1, false)`, [B]);
{ const r = (await sor(Y, `select public.kk_y_oyuncular('ASE', 'skor', 10) o`))[0].o; tamam('oyuncu araması', r.length == 1 && r[0].ad == 'asena' && r[0].k == 4200 && r[0].kosu == 3 && r[0].ret == 1 && r[0].not == 'sahte skor'); }
{ const r = (await sor(Y, `select public.kk_y_oyuncular('', 'skor', 10) o`))[0].o; tamam('oyuncu listesi skora göre sıralı', r.length == 3 && r[0].ad == 'bozkurt' && r[1].ad == 'asena' && r[2].yonetici === true); }
{ const r = (await sor(Y, `select public.kk_y_kosular(null, 'ret', 10) o`))[0].o; tamam('reddedilen koşular listelenir', r.length == 1 && r[0].ad == 'asena' && r[0].k == 900000); }
{ const r = (await sor(Y, `select public.kk_y_kosular($1, 'hepsi', 10) o`, [A]))[0].o; tamam('oyuncunun koşuları', r.length == 3); }
tamam('skor silme iki tabloyu temizler', (await sor(Y, `select public.kk_y_skor_sil($1) n`, [A]))[0].n == 2 && (await kok_(`select 1 from public.kk_skor where id = $1`, [A])).length == 0);
{ const r = (await sor(Y, `select public.kk_y_gunluk_oku(50) g`))[0].g, s = r.find(x => x.ne == 'skor_sil'); tamam('silinen satır günlükte durur', s && s.ayrinti.skor.k == 4200 && s.ad == 'yonetici' && r.some(x => x.ne == 'yasak') && r.some(x => x.ne == 'ayar')); }

// ---- 7. etkinlikler
const e1 = (await sor(Y, `select public.kk_y_etkinlik_yaz(null, $1) id`, [{ baslik: 'Çift tecrübe', metin: 'Hafta sonu', tur: 'etkinlik', carpan: { xp: 2 } }]))[0].id;
await sor(Y, `select public.kk_y_etkinlik_yaz(null, $1)`, [{ baslik: 'Gelecek', bas: new Date(Date.now() + 864e5).toISOString() }]);
await sor(Y, `select public.kk_y_etkinlik_yaz(null, $1)`, [{ baslik: 'Kapalı', aktif: false }]);
await sor(Y, `select public.kk_y_etkinlik_yaz(null, $1)`, [{ baslik: 'Bitmiş', bas: new Date(Date.now() - 2 * 864e5).toISOString(), bit: new Date(Date.now() - 864e5).toISOString() }]);
{ const r = await sor('anon', `select id, baslik, carpan from public.kk_etkinlik`); tamam('oyun yalnız şu an geçerli etkinliği görür', r.length == 1 && r[0].baslik == 'Çift tecrübe' && r[0].carpan.xp == 2); }
tamam('yönetici hepsini görür', (await sor(Y, `select public.kk_y_etkinlikler() e`))[0].e.length == 4);
await sor(Y, `select public.kk_y_etkinlik_yaz($1, $2)`, [e1, { baslik: 'Çift tecrübe', aktif: false }]);
tamam('kapatılan etkinlik oyundan kalkar', (await sor('anon', `select 1 from public.kk_etkinlik`)).length == 0);
tamam('bitişi başlangıçtan önce olan reddedilir', hataMi(await sor(Y, `select public.kk_y_etkinlik_yaz(null, $1)`, [{ baslik: 'x', bas: '2026-01-02', bit: '2026-01-01' }]), '22023'));
await sor(Y, `select public.kk_y_etkinlik_sil($1)`, [e1]);
tamam('etkinlik silinir', (await sor(Y, `select public.kk_y_etkinlikler() e`))[0].e.length == 3);

// ---- 8. özet
{ const o = (await sor(Y, `select public.kk_y_ozet(7) o`))[0].o;
  tamam('özet sayıları', o.hesap == 3 && o.kosu == 4 && o.ret == 1 && o.kosu_24 == 4 && o.oyuncu_24 == 2 && o.gunluk.length == 7 && o.gunluk[6].kosu == 4 && o.gunluk[6].yeni == 3, JSON.stringify({ hesap: o.hesap, kosu: o.kosu, ret: o.ret, g: o.gunluk.length }));
  tamam('özet dağılımları', o.kahraman.length == 2 && o.kahraman.find(x => x.c == 8).kosu == 2 && o.neden[0].nd == 'gulyabani' && o.seviye.length >= 2 && o.plat.some(x => x.p == 'web') && o.asama.length >= 1); }

// ---- 9. sezon
{ const n = (await sor(Y, `select public.kk_y_sezon_kapat('Sezon 1') n`))[0].n;
  tamam('sezon kapanır: tablo arşive taşınır ve boşalır', n == 1 && (await sor('anon', `select 1 from public.kk_skor`)).length == 0 && (await sor('anon', `select ad, k from public.kk_sezon_skor`))[0].ad == 'bozkurt');
  const z = (await sor(Y, `select public.kk_y_sezonlar() z`))[0].z; tamam('sezon listesi', z.acik == 0 && z.sezonlar.length == 1 && z.sezonlar[0].ilk.k == 9000 && z.sezonlar[0].satir == 1); }
let k5 = await kosu(B);
await sor(B, `select public.kk_kosu_bitir($1, 300, 1, 0, 200, 15)`, [k5]);
tamam('sezondan sonra yeni skor yazılır', (await sor('anon', `select k from public.kk_skor where id = $1`, [B]))[0]?.k == 300);

// ---- 10. hesap silme zinciri
await sor(B, `select public.kk_hesap_sil()`);
tamam('hesap silinince koşu kayıtları da gider', (await kok_(`select count(*)::int n from public.kk_kosu_kayit where hesap = $1`, [B]))[0].n == 0);

console.log(`\n${gecen} geçti, ${kalan} kaldı`);
process.exit(kalan ? 1 : 0);
