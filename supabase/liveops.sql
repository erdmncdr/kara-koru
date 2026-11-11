-- Kara Koru · yönetim (LiveOps): yöneticiler, uzaktan ayar, etkinlik ve duyurular, moderasyon, sezon, panel özetleri
-- supabase/siralama.sql'den SONRA çalıştırılır. Tekrar çalıştırmak güvenli.
--
-- Güvenlik: yönetici anahtarı (service_role) hiçbir istemciye girmez. Yönetim paneli (yonetim.html) yöneticinin kendi oyun
-- hesabıyla giriş yapar; bütün yönetim işlevleri (kk_y_*) çağıranın kk_yonetici tablosunda olup olmadığına veritabanında
-- bakar. Tabloya satır yalnız SQL Editor'den eklenir (en altta). Paneli açabilen ama yönetici olmayan biri hiçbir şey
-- okuyamaz ve yazamaz. Her yazma işlemi kk_y_gunluk'a kaydedilir.
--
-- Herkese açık okunanlar (oyun açılışta çeker): kk_ayar (uzaktan ayar), kk_etkinlik (yalnız şu an geçerli satırlar),
-- kk_sezon ve kk_sezon_skor (kapanmış sezonlar).

-- ---- yöneticiler
create table if not exists public.kk_yonetici (
  id uuid primary key references public.kk_hesap (id) on delete cascade,
  olus timestamptz not null default now()
);
alter table public.kk_yonetici enable row level security;
revoke all on public.kk_yonetici from anon, authenticated;

-- panel açılışta sorar: giriş yapan hesap yönetici mi
create or replace function public.kk_yonetici_mi() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.kk_yonetici y where y.id = (select auth.uid())) $$;
revoke all on function public.kk_yonetici_mi() from public, anon;
grant execute on function public.kk_yonetici_mi() to authenticated;

-- iç denetim: yönetici değilse 42501; yöneticinin kimliğini döndürür
create or replace function public.kk_y_kontrol() returns uuid
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_id uuid := auth.uid();
begin
  if v_id is null or not exists (select 1 from public.kk_yonetici y where y.id = v_id) then
    raise exception 'yonetici degil' using errcode = '42501';
  end if;
  return v_id;
end;
$$;
revoke all on function public.kk_y_kontrol() from public, anon, authenticated;

-- ---- işlem günlüğü
create table if not exists public.kk_y_gunluk (
  id bigint generated always as identity primary key,
  kim uuid,
  ad text not null default '',
  ne text not null,
  ayrinti jsonb not null default '{}'::jsonb,
  at timestamptz not null default now()
);
create index if not exists kk_y_gunluk_at_idx on public.kk_y_gunluk (at desc);
alter table public.kk_y_gunluk enable row level security;
revoke all on public.kk_y_gunluk from anon, authenticated;

create or replace function public.kk_y_not(p_kim uuid, p_ne text, p_ayrinti jsonb) returns void
language sql security definer set search_path = ''
as $$
  insert into public.kk_y_gunluk (kim, ad, ne, ayrinti)
  values (p_kim, coalesce((select h.ad from public.kk_hesap h where h.id = p_kim), ''), p_ne, coalesce(p_ayrinti, '{}'::jsonb))
$$;
revoke all on function public.kk_y_not(uuid, text, jsonb) from public, anon, authenticated;

create or replace function public.kk_y_gunluk_oku(p_limit integer default 100) returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  perform public.kk_y_kontrol();
  return (select coalesce(jsonb_agg(to_jsonb(x) order by x.at desc), '[]'::jsonb)
    from (select g.id, g.ad, g.ne, g.ayrinti, g.at from public.kk_y_gunluk g order by g.at desc limit least(greatest(coalesce(p_limit, 100), 1), 500)) x);
end;
$$;
revoke all on function public.kk_y_gunluk_oku(integer) from public, anon;
grant execute on function public.kk_y_gunluk_oku(integer) to authenticated;

-- ---- uzaktan ayar: anahtar → JSON. Oyun açılışta hepsini okur (herkese açık), bilmediği anahtarı yok sayar.
--   denge : denge sabitleri (src/data/ayar-sema.js'teki kimlik → sayı); satır yoksa oyun kendi değerleriyle çalışır
--   bakim : { "acik": true, "mesaj": "..." } oyun açılmaz, mesaj gösterilir
--   surum : { "ios_min": "0.1.3", "mesaj": "..." } eski iOS sürümü güncellemeye yönlendirilir
create table if not exists public.kk_ayar (
  anahtar text primary key check (anahtar ~ '^[a-z][a-z0-9_]{0,31}$'),
  deger jsonb not null check (pg_column_size(deger) < 16384),
  guncel timestamptz not null default now(),
  kim uuid
);
alter table public.kk_ayar enable row level security;
revoke all on public.kk_ayar from anon, authenticated;
grant select (anahtar, deger, guncel) on public.kk_ayar to anon, authenticated;
drop policy if exists kk_ayar_oku on public.kk_ayar;
create policy kk_ayar_oku on public.kk_ayar for select to anon, authenticated using (true);

create table if not exists public.kk_ayar_gecmis (
  id bigint generated always as identity primary key,
  anahtar text not null,
  eski jsonb,
  yeni jsonb,
  kim uuid,
  ad text not null default '',
  at timestamptz not null default now()
);
create index if not exists kk_ayar_gecmis_at_idx on public.kk_ayar_gecmis (at desc);
alter table public.kk_ayar_gecmis enable row level security;
revoke all on public.kk_ayar_gecmis from anon, authenticated;

-- p_deger null ise satır silinir (oyun kendi değerine döner). Dönüş: yeni zaman.
create or replace function public.kk_y_ayar_yaz(p_anahtar text, p_deger jsonb) returns timestamptz
language plpgsql security definer set search_path = ''
as $$
declare
  v_kim uuid := public.kk_y_kontrol();
  v_eski jsonb;
  v_t timestamptz := now();
begin
  if p_anahtar is null or p_anahtar !~ '^[a-z][a-z0-9_]{0,31}$' then
    raise exception 'gecersiz anahtar' using errcode = '22023';
  end if;
  if p_deger is not null and pg_column_size(p_deger) >= 16384 then
    raise exception 'deger cok buyuk' using errcode = '22023';
  end if;
  select a.deger into v_eski from public.kk_ayar a where a.anahtar = p_anahtar for update;
  if p_deger is null or p_deger = 'null'::jsonb then
    delete from public.kk_ayar a where a.anahtar = p_anahtar;
  else
    insert into public.kk_ayar as a (anahtar, deger, guncel, kim) values (p_anahtar, p_deger, v_t, v_kim)
    on conflict (anahtar) do update set deger = excluded.deger, guncel = excluded.guncel, kim = excluded.kim;
  end if;
  insert into public.kk_ayar_gecmis (anahtar, eski, yeni, kim, ad)
  values (p_anahtar, v_eski, case when p_deger = 'null'::jsonb then null else p_deger end, v_kim,
    coalesce((select h.ad from public.kk_hesap h where h.id = v_kim), ''));
  perform public.kk_y_not(v_kim, 'ayar', jsonb_build_object('anahtar', p_anahtar));
  return v_t;
end;
$$;
revoke all on function public.kk_y_ayar_yaz(text, jsonb) from public, anon;
grant execute on function public.kk_y_ayar_yaz(text, jsonb) to authenticated;

create or replace function public.kk_y_ayar_gecmis(p_limit integer default 40) returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  perform public.kk_y_kontrol();
  return (select coalesce(jsonb_agg(to_jsonb(x) order by x.at desc), '[]'::jsonb)
    from (select g.id, g.anahtar, g.eski, g.yeni, g.ad, g.at from public.kk_ayar_gecmis g order by g.at desc
      limit least(greatest(coalesce(p_limit, 40), 1), 200)) x);
end;
$$;
revoke all on function public.kk_y_ayar_gecmis(integer) from public, anon;
grant execute on function public.kk_y_ayar_gecmis(integer) to authenticated;

-- ---- etkinlik ve duyurular: zaman aralıklı. tur: duyuru (yalnız yazı), etkinlik (çarpanlı), uyari.
--   carpan: { "xp": 2, "altin": 1.5, "gumus": 2 } etkinlik sürerken oyundaki kazanç çarpanları (oyun 0.25-5 arasına sıkıştırır)
create table if not exists public.kk_etkinlik (
  id bigint generated always as identity primary key,
  baslik text not null check (char_length(baslik) between 1 and 60),
  metin text not null default '' check (char_length(metin) <= 400),
  tur text not null default 'duyuru' check (tur in ('duyuru', 'etkinlik', 'uyari')),
  bas timestamptz not null default now(),
  bit timestamptz,
  aktif boolean not null default true,
  carpan jsonb not null default '{}'::jsonb check (jsonb_typeof(carpan) = 'object' and pg_column_size(carpan) < 1024),
  olus timestamptz not null default now(),
  kim uuid
);
create index if not exists kk_etkinlik_bas_idx on public.kk_etkinlik (bas desc);
alter table public.kk_etkinlik enable row level security;
revoke all on public.kk_etkinlik from anon, authenticated;
grant select (id, baslik, metin, tur, bas, bit, carpan) on public.kk_etkinlik to anon, authenticated;
drop policy if exists kk_etkinlik_oku on public.kk_etkinlik;
create policy kk_etkinlik_oku on public.kk_etkinlik for select to anon, authenticated
  using (aktif and bas <= now() and (bit is null or bit > now()));

create or replace function public.kk_y_etkinlikler() returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  perform public.kk_y_kontrol();
  return (select coalesce(jsonb_agg(to_jsonb(x) order by x.bas desc), '[]'::jsonb)
    from (select e.id, e.baslik, e.metin, e.tur, e.bas, e.bit, e.aktif, e.carpan, e.olus from public.kk_etkinlik e order by e.bas desc limit 200) x);
end;
$$;
revoke all on function public.kk_y_etkinlikler() from public, anon;
grant execute on function public.kk_y_etkinlikler() to authenticated;

-- p_id null ise yeni satır. p: { baslik, metin, tur, bas, bit, aktif, carpan }. Dönüş: satırın kimliği.
create or replace function public.kk_y_etkinlik_yaz(p_id bigint, p jsonb) returns bigint
language plpgsql security definer set search_path = ''
as $$
declare
  v_kim uuid := public.kk_y_kontrol();
  v_id bigint := p_id;
  v_baslik text := btrim(coalesce(p ->> 'baslik', ''));
  v_metin text := coalesce(p ->> 'metin', '');
  v_tur text := coalesce(p ->> 'tur', 'duyuru');
  v_bas timestamptz := coalesce((p ->> 'bas')::timestamptz, now());
  v_bit timestamptz := (p ->> 'bit')::timestamptz;
  v_aktif boolean := coalesce((p ->> 'aktif')::boolean, true);
  v_carpan jsonb := case when jsonb_typeof(p -> 'carpan') = 'object' then p -> 'carpan' else '{}'::jsonb end;
begin
  if char_length(v_baslik) not between 1 and 60 or char_length(v_metin) > 400 or v_tur not in ('duyuru', 'etkinlik', 'uyari') then
    raise exception 'gecersiz etkinlik' using errcode = '22023';
  end if;
  if v_bit is not null and v_bit <= v_bas then
    raise exception 'bitis baslangictan once' using errcode = '22023';
  end if;
  if v_id is null then
    insert into public.kk_etkinlik (baslik, metin, tur, bas, bit, aktif, carpan, kim)
    values (v_baslik, v_metin, v_tur, v_bas, v_bit, v_aktif, v_carpan, v_kim) returning id into v_id;
  else
    update public.kk_etkinlik e set baslik = v_baslik, metin = v_metin, tur = v_tur, bas = v_bas, bit = v_bit, aktif = v_aktif,
      carpan = v_carpan, kim = v_kim where e.id = v_id;
    if not found then
      raise exception 'etkinlik yok' using errcode = '22023';
    end if;
  end if;
  perform public.kk_y_not(v_kim, 'etkinlik', jsonb_build_object('id', v_id, 'baslik', v_baslik, 'aktif', v_aktif));
  return v_id;
end;
$$;
revoke all on function public.kk_y_etkinlik_yaz(bigint, jsonb) from public, anon;
grant execute on function public.kk_y_etkinlik_yaz(bigint, jsonb) to authenticated;

create or replace function public.kk_y_etkinlik_sil(p_id bigint) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_kim uuid := public.kk_y_kontrol();
  v_eski jsonb;
begin
  delete from public.kk_etkinlik e where e.id = p_id returning to_jsonb(e) into v_eski;
  if v_eski is not null then
    perform public.kk_y_not(v_kim, 'etkinlik_sil', v_eski);
  end if;
end;
$$;
revoke all on function public.kk_y_etkinlik_sil(bigint) from public, anon;
grant execute on function public.kk_y_etkinlik_sil(bigint) to authenticated;

-- ---- moderasyon
-- oyuncu listesi. p_sira: son (son koşu), skor (en iyi skor), yeni (kayıt tarihi), ret (reddedilen deneme sayısı)
create or replace function public.kk_y_oyuncular(p_ara text default '', p_sira text default 'son', p_limit integer default 50) returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_ara text := lower(btrim(coalesce(p_ara, '')));
  v_lim integer := least(greatest(coalesce(p_limit, 50), 1), 200);
begin
  perform public.kk_y_kontrol();
  return (
    with o as (
      select h.id, h.ad, h.olus, h.yasak, h.yon_not as "not",
        s.k, s.c, s.s, s.t, s.lv, coalesce(s.gizli, false) as gizli,
        coalesce(r.kosu, 0) as kosu, coalesce(r.ret, 0) as ret, r.son,
        exists (select 1 from public.kk_yonetici y where y.id = h.id) as yonetici
      from public.kk_hesap h
      left join public.kk_skor s on s.id = h.id
      left join (select q.hesap, count(*) as kosu, count(*) filter (where q.ret) as ret, max(q.at) as son
                 from public.kk_kosu_kayit q group by q.hesap) r on r.hesap = h.id
      where v_ara = '' or lower(h.ad) like '%' || replace(replace(v_ara, '%', ''), '_', '\_') || '%'
    ), sirali as (
      select o.*, row_number() over (order by
        case when p_sira = 'skor' then -coalesce(o.k, -1) end,
        case when p_sira = 'ret' then -o.ret end,
        case when p_sira = 'yeni' then -extract(epoch from o.olus) end,
        coalesce(o.son, o.olus) desc) as sira
      from o
    )
    select coalesce(jsonb_agg(to_jsonb(x) - 'sira' order by x.sira), '[]'::jsonb) from (select * from sirali where sira <= v_lim) x
  );
end;
$$;
revoke all on function public.kk_y_oyuncular(text, text, integer) from public, anon;
grant execute on function public.kk_y_oyuncular(text, text, integer) to authenticated;

-- koşu listesi. p_hesap verilirse o oyuncunun koşuları. p_filtre: hepsi, ret (reddedilen), hizli (saniyede 40'tan çok öldürme)
create or replace function public.kk_y_kosular(p_hesap uuid default null, p_filtre text default 'hepsi', p_limit integer default 60) returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  perform public.kk_y_kontrol();
  return (select coalesce(jsonb_agg(to_jsonb(x) order by x.at desc), '[]'::jsonb) from (
    select q.id, q.hesap, h.ad, q.at, q.plat, q.surum, q.c, q.kademe, q.s, q.t, q.lv, q.k, q.gercek, q.sonuc, q.neden, q.ret, q.ozet
    from public.kk_kosu_kayit q join public.kk_hesap h on h.id = q.hesap
    where (p_hesap is null or q.hesap = p_hesap)
      and (coalesce(p_filtre, 'hepsi') = 'hepsi'
        or (p_filtre = 'ret' and q.ret)
        or (p_filtre = 'hizli' and q.k > 40 * greatest(q.t, 30)))
    order by q.at desc limit least(greatest(coalesce(p_limit, 60), 1), 300)) x);
end;
$$;
revoke all on function public.kk_y_kosular(uuid, text, integer) from public, anon;
grant execute on function public.kk_y_kosular(uuid, text, integer) to authenticated;

-- yasak: oyuncu koşu başlatamaz, sıralama satırları gizlenir; kaldırılınca geri görünür. Hiçbir şey silinmez.
create or replace function public.kk_y_yasak(p_id uuid, p_yasak boolean, p_not text default null) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_kim uuid := public.kk_y_kontrol();
  v_ad text;
begin
  if p_id = v_kim and coalesce(p_yasak, false) then
    raise exception 'kendini yasaklayamazsin' using errcode = '22023';
  end if;
  update public.kk_hesap h set yasak = coalesce(p_yasak, false), yon_not = left(coalesce(p_not, h.yon_not), 300)
    where h.id = p_id returning h.ad into v_ad;
  if not found then
    raise exception 'hesap yok' using errcode = '22023';
  end if;
  update public.kk_skor s set gizli = coalesce(p_yasak, false) where s.id = p_id;
  update public.kk_hafta s set gizli = coalesce(p_yasak, false) where s.id = p_id;
  if coalesce(p_yasak, false) then
    delete from public.kk_kosu k where k.hesap = p_id;
  end if;
  perform public.kk_y_not(v_kim, case when coalesce(p_yasak, false) then 'yasak' else 'yasak_kaldir' end,
    jsonb_build_object('id', p_id, 'ad', v_ad, 'not', coalesce(p_not, '')));
end;
$$;
revoke all on function public.kk_y_yasak(uuid, boolean, text) from public, anon;
grant execute on function public.kk_y_yasak(uuid, boolean, text) to authenticated;

-- yalnız sıralamadan gizler (oyuncu oynamaya devam eder); yeni koşuları da gizli satıra yazılır
create or replace function public.kk_y_gizle(p_id uuid, p_gizli boolean) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_kim uuid := public.kk_y_kontrol();
begin
  update public.kk_skor s set gizli = coalesce(p_gizli, false) where s.id = p_id;
  update public.kk_hafta s set gizli = coalesce(p_gizli, false) where s.id = p_id;
  perform public.kk_y_not(v_kim, case when coalesce(p_gizli, false) then 'gizle' else 'goster' end,
    jsonb_build_object('id', p_id, 'ad', (select h.ad from public.kk_hesap h where h.id = p_id)));
end;
$$;
revoke all on function public.kk_y_gizle(uuid, boolean) from public, anon;
grant execute on function public.kk_y_gizle(uuid, boolean) to authenticated;

-- oyuncunun sıralama satırlarını KALICI siler (sahte rekor). Silinen satırlar günlüğe yazılır (elle geri konabilir).
create or replace function public.kk_y_skor_sil(p_id uuid) returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  v_kim uuid := public.kk_y_kontrol();
  v_skor jsonb;
  v_hafta jsonb;
  v_n integer := 0;
begin
  select to_jsonb(sk) into v_skor from public.kk_skor sk where sk.id = p_id; -- takma ad `s` olamaz: tabloda s sütunu var
  select coalesce(jsonb_agg(to_jsonb(w)), '[]'::jsonb) into v_hafta from public.kk_hafta w where w.id = p_id;
  delete from public.kk_skor s where s.id = p_id;
  get diagnostics v_n = row_count;
  delete from public.kk_hafta w where w.id = p_id;
  perform public.kk_y_not(v_kim, 'skor_sil', jsonb_build_object('id', p_id, 'skor', v_skor, 'hafta', v_hafta));
  return v_n + jsonb_array_length(v_hafta);
end;
$$;
revoke all on function public.kk_y_skor_sil(uuid) from public, anon;
grant execute on function public.kk_y_skor_sil(uuid) to authenticated;

-- ---- sezon: tüm zamanlar tablosu arşive taşınır ve sıfırlanır (büyük denge değişikliğinden sonra). Arşiv herkese açık.
create table if not exists public.kk_sezon (
  id bigint generated always as identity primary key,
  ad text not null check (char_length(ad) between 1 and 40),
  kapanis timestamptz not null default now(),
  satir integer not null default 0
);
create table if not exists public.kk_sezon_skor (
  sezon bigint not null references public.kk_sezon (id) on delete cascade,
  id uuid not null,
  ad text not null,
  k integer not null,
  c smallint not null,
  s smallint not null default 0,
  t integer not null default 0,
  lv integer not null default 0,
  ch jsonb not null default '{}'::jsonb,
  at timestamptz not null,
  primary key (sezon, id)
);
create index if not exists kk_sezon_skor_k_idx on public.kk_sezon_skor (sezon, k desc);
alter table public.kk_sezon enable row level security;
alter table public.kk_sezon_skor enable row level security;
revoke all on public.kk_sezon, public.kk_sezon_skor from anon, authenticated;
grant select on public.kk_sezon, public.kk_sezon_skor to anon, authenticated;
drop policy if exists kk_sezon_oku on public.kk_sezon;
create policy kk_sezon_oku on public.kk_sezon for select to anon, authenticated using (true);
drop policy if exists kk_sezon_skor_oku on public.kk_sezon_skor;
create policy kk_sezon_skor_oku on public.kk_sezon_skor for select to anon, authenticated using (true);

create or replace function public.kk_y_sezonlar() returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  perform public.kk_y_kontrol();
  return jsonb_build_object(
    'acik', (select count(*) from public.kk_skor),
    'sezonlar', (select coalesce(jsonb_agg(jsonb_build_object('id', z.id, 'ad', z.ad, 'kapanis', z.kapanis, 'satir', z.satir,
        'ilk', (select jsonb_build_object('ad', q.ad, 'k', q.k) from public.kk_sezon_skor q where q.sezon = z.id order by q.k desc limit 1))
      order by z.kapanis desc), '[]'::jsonb) from public.kk_sezon z));
end;
$$;
revoke all on function public.kk_y_sezonlar() from public, anon;
grant execute on function public.kk_y_sezonlar() to authenticated;

-- gizli satırlar arşive girmez ama onlar da silinir. Haftalık tablo kendi döngüsünde kalır.
create or replace function public.kk_y_sezon_kapat(p_ad text) returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  v_kim uuid := public.kk_y_kontrol();
  v_ad text := btrim(coalesce(p_ad, ''));
  v_sezon bigint;
  v_n integer;
begin
  if char_length(v_ad) not between 1 and 40 then
    raise exception 'sezon adi gerekli' using errcode = '22023';
  end if;
  lock table public.kk_skor in exclusive mode;
  insert into public.kk_sezon (ad) values (v_ad) returning id into v_sezon;
  insert into public.kk_sezon_skor (sezon, id, ad, k, c, s, t, lv, ch, at)
  select v_sezon, s.id, s.ad, s.k, s.c, s.s, s.t, s.lv, s.ch, s.at from public.kk_skor s where not s.gizli;
  get diagnostics v_n = row_count;
  update public.kk_sezon z set satir = v_n where z.id = v_sezon;
  -- `where true` şart: Supabase API oturumlarında koşulsuz DELETE / UPDATE'i engeller (pg_safeupdate: "DELETE requires a WHERE clause")
  delete from public.kk_skor where true;
  perform public.kk_y_not(v_kim, 'sezon_kapat', jsonb_build_object('sezon', v_sezon, 'ad', v_ad, 'satir', v_n));
  return v_n;
end;
$$;
revoke all on function public.kk_y_sezon_kapat(text) from public, anon;
grant execute on function public.kk_y_sezon_kapat(text) to authenticated;

-- ---- panel özeti: son p_gun gün (Türkiye saatiyle gün). Reddedilen koşular dağılımlara girmez.
create or replace function public.kk_y_ozet(p_gun integer default 14) returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_gun integer := least(greatest(coalesce(p_gun, 14), 1), 90);
  v_g1 date := (now() at time zone 'Europe/Istanbul')::date;
  v_g0 date;
  v_bas timestamptz;
begin
  perform public.kk_y_kontrol();
  v_g0 := v_g1 - (v_gun - 1);
  v_bas := v_g0::timestamp at time zone 'Europe/Istanbul';
  return jsonb_build_object(
    'gun', v_gun,
    'hesap', (select count(*) from public.kk_hesap),
    'hesap_24', (select count(*) from public.kk_hesap h where h.olus >= now() - interval '24 hours'),
    'yasak', (select count(*) from public.kk_hesap h where h.yasak),
    'kosu_24', (select count(*) from public.kk_kosu_kayit q where q.at >= now() - interval '24 hours'),
    'oyuncu_24', (select count(distinct q.hesap) from public.kk_kosu_kayit q where q.at >= now() - interval '24 hours'),
    'oyuncu_7', (select count(distinct q.hesap) from public.kk_kosu_kayit q where q.at >= now() - interval '7 days'),
    'kosu', (select count(*) from public.kk_kosu_kayit q where q.at >= v_bas),
    'ret', (select count(*) from public.kk_kosu_kayit q where q.at >= v_bas and q.ret),
    'sure', (select coalesce((percentile_cont(0.5) within group (order by q.t))::int, 0) from public.kk_kosu_kayit q where q.at >= v_bas and not q.ret),
    'gunluk', (select coalesce(jsonb_agg(jsonb_build_object('gun', d.gun, 'kosu', coalesce(a.kosu, 0), 'oyuncu', coalesce(a.oyuncu, 0), 'yeni', coalesce(n.yeni, 0)) order by d.gun), '[]'::jsonb)
      from (select g::date as gun from generate_series(v_g0::timestamp, v_g1::timestamp, interval '1 day') g) d
      left join (select (q.at at time zone 'Europe/Istanbul')::date as gun, count(*) as kosu, count(distinct q.hesap) as oyuncu
                 from public.kk_kosu_kayit q where q.at >= v_bas group by 1) a on a.gun = d.gun
      left join (select (h.olus at time zone 'Europe/Istanbul')::date as gun, count(*) as yeni
                 from public.kk_hesap h where h.olus >= v_bas group by 1) n on n.gun = d.gun),
    'kahraman', (select coalesce(jsonb_agg(to_jsonb(x) order by x.kosu desc), '[]'::jsonb) from (
      select q.c, count(*) as kosu, round(avg(q.lv))::int as lv,
        (percentile_cont(0.5) within group (order by q.k))::int as k,
        (percentile_cont(0.5) within group (order by q.t))::int as t,
        count(*) filter (where q.sonuc = 'zafer') as zafer, max(q.k) as enk, max(q.lv) as enlv
      from public.kk_kosu_kayit q where q.at >= v_bas and not q.ret group by q.c) x),
    'seviye', (select coalesce(jsonb_agg(jsonb_build_object('b', x.b, 'n', x.n) order by x.b), '[]'::jsonb) from (
      select least(q.lv / 10, 30) * 10 as b, count(*) as n from public.kk_kosu_kayit q where q.at >= v_bas and not q.ret group by 1) x),
    'neden', (select coalesce(jsonb_agg(jsonb_build_object('nd', x.neden, 'n', x.n) order by x.n desc), '[]'::jsonb) from (
      select q.neden, count(*) as n from public.kk_kosu_kayit q
      where q.at >= v_bas and not q.ret and q.sonuc = 'olum' and q.neden <> '' group by q.neden order by n desc limit 10) x),
    'asama', (select coalesce(jsonb_agg(jsonb_build_object('s', x.s, 'n', x.n) order by x.s), '[]'::jsonb) from (
      select case when q.sonuc in ('zafer', 'cikis') then 3 else least(q.s, 2) end as s, count(*) as n
      from public.kk_kosu_kayit q where q.at >= v_bas and not q.ret group by 1) x),
    'kademe', (select coalesce(jsonb_agg(jsonb_build_object('kd', x.kademe, 'n', x.n, 'zafer', x.zafer) order by x.kademe), '[]'::jsonb) from (
      select q.kademe, count(*) as n, count(*) filter (where q.sonuc in ('zafer', 'cikis')) as zafer
      from public.kk_kosu_kayit q where q.at >= v_bas and not q.ret group by q.kademe) x),
    'plat', (select coalesce(jsonb_agg(jsonb_build_object('p', x.plat, 'n', x.n) order by x.n desc), '[]'::jsonb) from (
      select q.plat, count(*) as n from public.kk_kosu_kayit q where q.at >= v_bas group by q.plat) x)
  );
end;
$$;
revoke all on function public.kk_y_ozet(integer) from public, anon;
grant execute on function public.kk_y_ozet(integer) to authenticated;

-- ---- ilk yönetici: kendi oyun hesabının adını yazıp bu satırı bir kez çalıştır (başka yönetici de aynı yolla eklenir)
-- insert into public.kk_yonetici (id) select id from public.kk_hesap where lower(ad) = lower('HESAP_ADIN') on conflict do nothing;
