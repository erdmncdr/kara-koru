-- Kara Koru · hesaplar ve ortak sıralama (Supabase)
-- Supabase panelinde SQL Editor'e yapıştırıp çalıştır. Tekrar çalıştırmak güvenli (if not exists / or replace);
-- ilk sürümün (tarayıcı sırrıyla sahiplik, kk_sahip tablosu) üstüne çalıştırılırsa onu hesap modeline taşır.
--
-- Hesap: Supabase Auth (kullanıcı adı + şifre; istemci adı e-posta biçimine çevirir, e-posta gönderilmez,
-- panelde "Confirm email" kapalı olmalı). Kayıt olunca tetikleyici kk_hesap satırını açar.
-- kk_hesap.veri oyuncunun bütün kaydını tutar (ilerleme, rekorlar, ayarlar); yalnız sahibi okur, yazma kk_kaydet ile.
-- kk_skor herkese açık sıralamadır; yazma yalnız kk_skor_gonder ile, giriş yapmış oyuncunun kendi satırına.
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

-- oyuncunun kaydını yazar; dönüş: sunucu zamanı (istemci son eşitlemeyi buna göre tutar)
create or replace function public.kk_kaydet(p_veri jsonb) returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid := auth.uid();
  v_t timestamptz;
begin
  if v_id is null then
    raise exception 'giris gerekli' using errcode = '42501';
  end if;
  if p_veri is null or jsonb_typeof(p_veri) <> 'object' or pg_column_size(p_veri) >= 262144 then
    raise exception 'gecersiz kayit' using errcode = '22023';
  end if;
  update public.kk_hesap set veri = p_veri, guncel = now() where id = v_id returning guncel into v_t;
  if v_t is null then
    raise exception 'hesap yok' using errcode = '42501';
  end if;
  return v_t;
end;
$$;
revoke all on function public.kk_kaydet(jsonb) from public, anon;
grant execute on function public.kk_kaydet(jsonb) to authenticated;

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

create or replace function public.kk_skor_gonder(
  p_k integer, p_c integer, p_s integer, p_t integer, p_lv integer, p_ch jsonb
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid := auth.uid();
  v_ad text;
  v_son timestamptz;
  v_ch jsonb := '{}'::jsonb;
  v_key text;
  v_val jsonb;
begin
  if v_id is null then
    raise exception 'giris gerekli' using errcode = '42501';
  end if;
  -- kahraman başına rekorlar yeniden kurulur: yalnız 0-63 anahtarı ve sayısal k (s, t isteğe bağlı) kalır, değerler sınırlanır
  if p_ch is not null and jsonb_typeof(p_ch) = 'object' then
    for v_key, v_val in select key, value from jsonb_each(p_ch) loop
      continue when v_key !~ '^[0-9]{1,2}$' or v_key::int > 63
        or jsonb_typeof(v_val) <> 'object' or jsonb_typeof(v_val -> 'k') is distinct from 'number';
      v_ch := v_ch || jsonb_build_object(v_key, jsonb_build_object(
        'k', least(greatest(floor((v_val ->> 'k')::numeric), 0), 10000000)::int,
        's', case when jsonb_typeof(v_val -> 's') = 'number' then least(greatest(floor((v_val ->> 's')::numeric), 0), 20)::int else 0 end,
        't', case when jsonb_typeof(v_val -> 't') = 'number' then least(greatest(floor((v_val ->> 't')::numeric), 0), 86400)::int else 0 end));
    end loop;
  end if;

  select ad, son_skor into v_ad, v_son from public.kk_hesap where id = v_id for update;
  if not found then
    raise exception 'hesap yok' using errcode = '42501';
  end if;
  if v_son > now() - interval '15 seconds' then
    raise exception 'cok sik' using errcode = '54000';
  end if;
  update public.kk_hesap set son_skor = now() where id = v_id;

  -- ana satır en iyi koşuyu tutar; kahraman başına rekorlar (ch) her kahramanın en yükseğiyle birleşir
  insert into public.kk_skor as o (id, ad, k, c, s, t, lv, ch, at)
  values (v_id, v_ad, least(greatest(coalesce(p_k, 0), 0), 10000000), least(greatest(coalesce(p_c, 0), 0), 63),
    least(greatest(coalesce(p_s, 0), 0), 20), least(greatest(coalesce(p_t, 0), 0), 86400), least(greatest(coalesce(p_lv, 0), 0), 100000), v_ch, now())
  on conflict (id) do update set
    ad = excluded.ad,
    ch = (select coalesce(jsonb_object_agg(coalesce(a.key, b.key),
            case when b.value is null then a.value
                 when a.value is null then b.value
                 when (b.value ->> 'k')::numeric > (a.value ->> 'k')::numeric then b.value
                 else a.value end), '{}'::jsonb)
          from jsonb_each(o.ch) a full outer join jsonb_each(excluded.ch) b on a.key = b.key),
    k = greatest(o.k, excluded.k),
    c = case when excluded.k > o.k then excluded.c else o.c end,
    s = case when excluded.k > o.k then excluded.s else o.s end,
    t = case when excluded.k > o.k then excluded.t else o.t end,
    lv = case when excluded.k > o.k then excluded.lv else o.lv end,
    at = case when excluded.k > o.k then now() else o.at end;
end;
$$;
revoke all on function public.kk_skor_gonder(integer, integer, integer, integer, integer, jsonb) from public, anon;
grant execute on function public.kk_skor_gonder(integer, integer, integer, integer, integer, jsonb) to authenticated;
