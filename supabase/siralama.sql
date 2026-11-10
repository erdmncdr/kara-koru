-- Kara Koru · hesaplar ve ortak sıralama (Supabase)
-- Supabase panelinde SQL Editor'e yapıştırıp çalıştır. Tekrar çalıştırmak güvenli (if not exists / or replace);
-- ilk sürümün (tarayıcı sırrıyla sahiplik, kk_sahip tablosu) üstüne çalıştırılırsa onu hesap modeline taşır.
--
-- Hesap: Supabase Auth (kullanıcı adı + şifre; istemci adı e-posta biçimine çevirir, e-posta gönderilmez,
-- panelde "Confirm email" kapalı olmalı). Kayıt olunca tetikleyici kk_hesap satırını açar.
-- kk_hesap.veri oyuncunun bütün kaydını tutar (ilerleme, rekorlar, ayarlar); yalnız sahibi okur, yazma kk_kaydet ile.
-- kk_skor (tüm zamanlar) ve kk_hafta (haftalık) herkese açık sıralamadır; yazma yalnız kk_skor_gonder ile,
-- giriş yapmış oyuncunun kendi satırına.
-- Oyun istemci tarafında çalıştığı için skor uydurmak tamamen engellenemez; bu yapı başkasının satırını
-- değiştirmeyi, saçma değerleri ve seri gönderimi engeller.

-- ---- hesaplar
create table if not exists public.kk_hesap (
  id uuid primary key references auth.users (id) on delete cascade,
  ad text not null check (char_length(ad) between 3 and 15 and ad ~ '^[A-Za-z0-9_çğıöşüÇĞİÖŞÜ]+$'),
  veri jsonb not null default '{}'::jsonb check (jsonb_typeof(veri) = 'object' and pg_column_size(veri) < 262144),
  guncel timestamptz not null default now(),
  son_skor timestamptz,
  olus timestamptz not null default now()
);
create unique index if not exists kk_hesap_ad_idx on public.kk_hesap (lower(ad));

alter table public.kk_hesap enable row level security;
revoke all on public.kk_hesap from anon, authenticated;
grant select on public.kk_hesap to authenticated;
drop policy if exists kk_hesap_oku on public.kk_hesap;
create policy kk_hesap_oku on public.kk_hesap for select to authenticated using (id = (select auth.uid()));

-- kayıt olunca hesap satırı; ad kayıt sırasındaki üst veriden gelir (istemci doğrular, burada yeniden denetlenir)
create or replace function public.kk_yeni_hesap() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ad text := btrim(coalesce(new.raw_user_meta_data ->> 'ad', ''));
begin
  if char_length(v_ad) not between 3 and 15 or v_ad !~ '^[A-Za-z0-9_çğıöşüÇĞİÖŞÜ]+$' then
    raise exception 'gecersiz ad' using errcode = '22023';
  end if;
  insert into public.kk_hesap (id, ad) values (new.id, v_ad);
  return new;
end;
$$;
revoke all on function public.kk_yeni_hesap() from public, anon, authenticated;
drop trigger if exists kk_yeni_hesap on auth.users;
create trigger kk_yeni_hesap after insert on auth.users for each row execute function public.kk_yeni_hesap();

-- oyuncunun kaydını yazar. p_onceki: istemcinin bildiği son sunucu zamanı (guncel). Hesap o zamandan beri başka
-- cihazdan yazıldıysa 'cakisma' döner ve hiçbir şey yazılmaz (eski cihaz yeni ilerlemeyi geri almasın).
-- Dönüş: yeni sunucu zamanı.
drop function if exists public.kk_kaydet(jsonb);
create or replace function public.kk_kaydet(p_veri jsonb, p_onceki timestamptz) returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid := auth.uid();
  v_t timestamptz;
  v_eski jsonb;
begin
  if v_id is null then
    raise exception 'giris gerekli' using errcode = '42501';
  end if;
  if p_veri is null or jsonb_typeof(p_veri) <> 'object' or pg_column_size(p_veri) >= 262144 then
    raise exception 'gecersiz kayit' using errcode = '22023';
  end if;
  select guncel, veri into v_t, v_eski from public.kk_hesap where id = v_id for update;
  if not found then
    raise exception 'hesap yok' using errcode = '42501';
  end if;
  if (p_onceki is null and v_eski <> '{}'::jsonb) or (p_onceki is not null and v_t <> p_onceki) then
    -- PT409: PostgREST'e özgü kod, HTTP 409 döner. 40001 (serileştirme hatası) kullanılmaz: PostgREST onu sonsuza dek yeniden dener
    raise exception 'cakisma' using errcode = 'PT409';
  end if;
  update public.kk_hesap set veri = p_veri, guncel = greatest(now(), v_t + interval '1 microsecond') where id = v_id returning guncel into v_t;
  return v_t;
end;
$$;
revoke all on function public.kk_kaydet(jsonb, timestamptz) from public, anon;
grant execute on function public.kk_kaydet(jsonb, timestamptz) to authenticated;

-- ---- ortak sıralama
create table if not exists public.kk_skor (
  id uuid primary key,
  ad text not null check (char_length(ad) between 1 and 20),
  k integer not null check (k between 0 and 10000000),
  c smallint not null check (c between 0 and 63),
  s smallint not null default 0 check (s between 0 and 20),
  t integer not null default 0 check (t between 0 and 86400),
  lv integer not null default 0 check (lv between 0 and 100000),
  ch jsonb not null default '{}'::jsonb check (jsonb_typeof(ch) = 'object' and pg_column_size(ch) < 8192),
  at timestamptz not null default now()
);
create index if not exists kk_skor_k_idx on public.kk_skor (k desc);

-- ilk sürümden geçiş: tarayıcı sırrıyla sahiplik kalkar, satır sahibi hesaptır
drop function if exists public.kk_gonder(uuid, text, text, integer, integer, integer, integer, integer, jsonb);
alter table public.kk_skor drop constraint if exists kk_skor_id_fkey;
drop table if exists public.kk_sahip;
delete from public.kk_skor s where not exists (select 1 from public.kk_hesap h where h.id = s.id);
alter table public.kk_skor add constraint kk_skor_id_fkey foreign key (id) references public.kk_hesap (id) on delete cascade;

alter table public.kk_skor enable row level security;
revoke all on public.kk_skor from anon, authenticated;
grant select on public.kk_skor to anon, authenticated;
drop policy if exists kk_skor_oku on public.kk_skor;
create policy kk_skor_oku on public.kk_skor for select to anon, authenticated using (true);

-- ---- haftalık sıralama: her hafta (Pazartesi 00:00, Türkiye saati) sıfırdan başlar; eski haftalar kalır (geçen haftanın şampiyonları)
create table if not exists public.kk_hafta (
  hafta date not null,
  id uuid not null references public.kk_hesap (id) on delete cascade,
  ad text not null check (char_length(ad) between 1 and 20),
  k integer not null check (k between 0 and 10000000),
  c smallint not null check (c between 0 and 63),
  s smallint not null default 0 check (s between 0 and 20),
  t integer not null default 0 check (t between 0 and 86400),
  lv integer not null default 0 check (lv between 0 and 100000),
  ch jsonb not null default '{}'::jsonb check (jsonb_typeof(ch) = 'object' and pg_column_size(ch) < 8192),
  at timestamptz not null default now(),
  primary key (hafta, id)
);
create index if not exists kk_hafta_k_idx on public.kk_hafta (hafta, k desc);
create index if not exists kk_hafta_id_idx on public.kk_hafta (id);

alter table public.kk_hafta enable row level security;
revoke all on public.kk_hafta from anon, authenticated;
grant select on public.kk_hafta to anon, authenticated;
drop policy if exists kk_hafta_oku on public.kk_hafta;
create policy kk_hafta_oku on public.kk_hafta for select to anon, authenticated using (true);

-- içinde bulunulan haftanın ilk günü (istemci aynı hesabı yapar: UTC+3, Pazartesi)
create or replace function public.kk_bu_hafta() returns date
language sql stable set search_path = ''
as $$ select (date_trunc('week', now() at time zone 'Europe/Istanbul'))::date $$;

-- kahraman başına rekorlar yeniden kurulur: yalnız 0-63 anahtarı ve sayısal k (s, t isteğe bağlı) kalır, değerler sınırlanır
create or replace function public.kk_ch_temizle(p jsonb) returns jsonb
language plpgsql immutable set search_path = ''
as $$
declare
  v_ch jsonb := '{}'::jsonb;
  v_key text;
  v_val jsonb;
begin
  if p is null or jsonb_typeof(p) <> 'object' then
    return v_ch;
  end if;
  for v_key, v_val in select key, value from jsonb_each(p) loop
    continue when v_key !~ '^[0-9]{1,2}$' or v_key::int > 63
      or jsonb_typeof(v_val) <> 'object' or jsonb_typeof(v_val -> 'k') is distinct from 'number';
    v_ch := v_ch || jsonb_build_object(v_key, jsonb_build_object(
      'k', least(greatest(floor((v_val ->> 'k')::numeric), 0), 10000000)::int,
      's', case when jsonb_typeof(v_val -> 's') = 'number' then least(greatest(floor((v_val ->> 's')::numeric), 0), 20)::int else 0 end,
      't', case when jsonb_typeof(v_val -> 't') = 'number' then least(greatest(floor((v_val ->> 't')::numeric), 0), 86400)::int else 0 end));
  end loop;
  return v_ch;
end;
$$;

-- iki rekor kümesini birleştirir: her kahraman için en yüksek k
create or replace function public.kk_ch_birlestir(a jsonb, b jsonb) returns jsonb
language sql immutable set search_path = ''
as $$
  select coalesce(jsonb_object_agg(coalesce(x.key, y.key),
    case when y.value is null then x.value
         when x.value is null then y.value
         when (y.value ->> 'k')::numeric > (x.value ->> 'k')::numeric then y.value
         else x.value end), '{}'::jsonb)
  from jsonb_each(coalesce(a, '{}'::jsonb)) x full outer join jsonb_each(coalesce(b, '{}'::jsonb)) y on x.key = y.key
$$;
revoke all on function public.kk_ch_temizle(jsonb) from public, anon, authenticated;
revoke all on function public.kk_ch_birlestir(jsonb, jsonb) from public, anon, authenticated;

-- p_k..p_ch: oyuncunun tüm zamanların en iyisi (sunucudakiyle birleşir).
-- p_h: bu haftanın en iyi koşusu {hf, k, c, s, t, lv, ch}; hf istemcinin hesapladığı hafta, sunucununkiyle aynı değilse yok sayılır
-- (geçen haftadan kalmış gönderilmemiş koşu yeni haftaya yazılmasın).
drop function if exists public.kk_skor_gonder(integer, integer, integer, integer, integer, jsonb);
create or replace function public.kk_skor_gonder(
  p_k integer, p_c integer, p_s integer, p_t integer, p_lv integer, p_ch jsonb, p_h jsonb default null
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid := auth.uid();
  v_ad text;
  v_son timestamptz;
  v_ch jsonb := public.kk_ch_temizle(p_ch);
  v_hf date := public.kk_bu_hafta();
  v_hk integer;
begin
  if v_id is null then
    raise exception 'giris gerekli' using errcode = '42501';
  end if;

  select ad, son_skor into v_ad, v_son from public.kk_hesap where id = v_id for update;
  if not found then
    raise exception 'hesap yok' using errcode = '42501';
  end if;
  if v_son > now() - interval '15 seconds' then
    raise exception 'cok sik' using errcode = 'PT429'; -- HTTP 429; istemci giden kutusuyla sonra yeniden dener
  end if;
  update public.kk_hesap set son_skor = now() where id = v_id;

  -- ana satır en iyi koşuyu tutar; kahraman başına rekorlar (ch) her kahramanın en yükseğiyle birleşir
  insert into public.kk_skor as o (id, ad, k, c, s, t, lv, ch, at)
  values (v_id, v_ad, least(greatest(coalesce(p_k, 0), 0), 10000000), least(greatest(coalesce(p_c, 0), 0), 63),
    least(greatest(coalesce(p_s, 0), 0), 20), least(greatest(coalesce(p_t, 0), 0), 86400), least(greatest(coalesce(p_lv, 0), 0), 100000), v_ch, now())
  on conflict (id) do update set
    ad = excluded.ad,
    ch = public.kk_ch_birlestir(o.ch, excluded.ch),
    k = greatest(o.k, excluded.k),
    c = case when excluded.k > o.k then excluded.c else o.c end,
    s = case when excluded.k > o.k then excluded.s else o.s end,
    t = case when excluded.k > o.k then excluded.t else o.t end,
    lv = case when excluded.k > o.k then excluded.lv else o.lv end,
    at = case when excluded.k > o.k then now() else o.at end;

  -- haftalık satır: aynı birleştirme, yalnız bu haftanın koşularıyla
  if p_h is not null and jsonb_typeof(p_h) = 'object' and p_h ->> 'hf' = v_hf::text
     and jsonb_typeof(p_h -> 'k') = 'number' then
    v_hk := least(greatest(floor((p_h ->> 'k')::numeric), 0), 10000000)::int;
    if v_hk > 0 then
      insert into public.kk_hafta as o (hafta, id, ad, k, c, s, t, lv, ch, at)
      values (v_hf, v_id, v_ad, v_hk,
        case when jsonb_typeof(p_h -> 'c') = 'number' then least(greatest(floor((p_h ->> 'c')::numeric), 0), 63)::int else 0 end,
        case when jsonb_typeof(p_h -> 's') = 'number' then least(greatest(floor((p_h ->> 's')::numeric), 0), 20)::int else 0 end,
        case when jsonb_typeof(p_h -> 't') = 'number' then least(greatest(floor((p_h ->> 't')::numeric), 0), 86400)::int else 0 end,
        case when jsonb_typeof(p_h -> 'lv') = 'number' then least(greatest(floor((p_h ->> 'lv')::numeric), 0), 100000)::int else 0 end,
        public.kk_ch_temizle(p_h -> 'ch'), now())
      on conflict (hafta, id) do update set
        ad = excluded.ad,
        ch = public.kk_ch_birlestir(o.ch, excluded.ch),
        k = greatest(o.k, excluded.k),
        c = case when excluded.k > o.k then excluded.c else o.c end,
        s = case when excluded.k > o.k then excluded.s else o.s end,
        t = case when excluded.k > o.k then excluded.t else o.t end,
        lv = case when excluded.k > o.k then excluded.lv else o.lv end,
        at = case when excluded.k > o.k then now() else o.at end;
    end if;
  end if;
end;
$$;
revoke all on function public.kk_skor_gonder(integer, integer, integer, integer, integer, jsonb, jsonb) from public, anon;
grant execute on function public.kk_skor_gonder(integer, integer, integer, integer, integer, jsonb, jsonb) to authenticated;

-- ---- hesap silme (iOS uygulaması; App Store şartı: hesap açılabilen uygulamada hesap uygulama içinden silinebilmeli)
-- Giriş yapmış oyuncunun kendi hesabını siler. auth.users satırı gider; kk_hesap, kk_skor ve kk_hafta satırları ile
-- oturumlar (auth şemasındaki bağlı tablolar) zincirleme silinir. Geri alınamaz.
create or replace function public.kk_hesap_sil() returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid := auth.uid();
begin
  if v_id is null then
    raise exception 'giris gerekli' using errcode = '42501';
  end if;
  delete from auth.users where id = v_id;
end;
$$;
revoke all on function public.kk_hesap_sil() from public, anon;
grant execute on function public.kk_hesap_sil() to authenticated;
