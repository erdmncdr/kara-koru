-- Kara Koru · ortak sıralama (Supabase)
-- Supabase panelinde SQL Editor'e yapıştırıp bir kez çalıştır. Tekrar çalıştırmak güvenli (if not exists / or replace).
--
-- Model: her oyuncunun tarayıcısı rastgele bir kimlik (uuid) ve bir sır üretir. Sırrın yalnız SHA-256 özeti saklanır.
-- Tabloya doğrudan yazma kapalı; yazma yalnız kk_gonder fonksiyonuyla olur. Fonksiyon sırrı doğrular, değerleri
-- sınırlar ve aynı kimliğin 15 saniyede bir kezden sık yazmasını engeller. Okuma herkese açık.
-- Oyun istemci tarafında çalıştığı için skor uydurmak tamamen engellenemez; bu yapı başkasının satırını
-- değiştirmeyi, saçma değerleri ve seri gönderimi engeller.

create table if not exists public.kk_sahip (
  id uuid primary key,
  sir_ozet text not null,
  son timestamptz not null default now()
);

create table if not exists public.kk_skor (
  id uuid primary key references public.kk_sahip (id) on delete cascade,
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

alter table public.kk_sahip enable row level security;
alter table public.kk_skor enable row level security;

-- sırlar tablosu kimseye açık değil (politika yok, yetki yok)
revoke all on public.kk_sahip from anon, authenticated;

-- skorlar: herkes okur, kimse doğrudan yazamaz
revoke all on public.kk_skor from anon, authenticated;
grant select on public.kk_skor to anon, authenticated;
drop policy if exists kk_skor_oku on public.kk_skor;
create policy kk_skor_oku on public.kk_skor for select to anon, authenticated using (true);

create or replace function public.kk_gonder(
  p_id uuid, p_sir text, p_ad text,
  p_k integer, p_c integer, p_s integer, p_t integer, p_lv integer, p_ch jsonb
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ozet text;
  v_son timestamptz;
  v_ad text;
  v_ch jsonb := '{}'::jsonb;
  v_key text;
  v_val jsonb;
begin
  if p_id is null or p_sir is null or char_length(p_sir) not between 32 and 128 then
    raise exception 'gecersiz kimlik' using errcode = '22023';
  end if;
  -- ad: denetim karakterleri ve köşeli ayraçlar atılır, 20 karaktere kısaltılır
  v_ad := btrim(left(regexp_replace(coalesce(p_ad, ''), '[[:cntrl:]<>&"]', '', 'g'), 20));
  if v_ad = '' then v_ad := 'Savaşçı'; end if;
  -- kahraman başına rekorlar yeniden kurulur: yalnız 0-63 anahtarı ve sayısal k (s, t isteğe bağlı) kalır, değerler sınırlanır;
  -- bozuk bir girdi diğer oyuncuların sıralama ekranını kırmasın
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

  select sir_ozet, son into v_ozet, v_son from public.kk_sahip where id = p_id for update;
  if not found then
    insert into public.kk_sahip (id, sir_ozet) values (p_id, encode(sha256(convert_to(p_sir, 'UTF8')), 'hex'));
  else
    if v_ozet <> encode(sha256(convert_to(p_sir, 'UTF8')), 'hex') then
      raise exception 'yetkisiz' using errcode = '42501';
    end if;
    if v_son > now() - interval '15 seconds' then
      raise exception 'cok sik' using errcode = '54000';
    end if;
    update public.kk_sahip set son = now() where id = p_id;
  end if;

  -- ana satır en iyi koşuyu tutar; kahraman başına rekorlar (ch) her kahramanın en yükseğiyle birleşir
  insert into public.kk_skor as o (id, ad, k, c, s, t, lv, ch, at)
  values (p_id, v_ad, p_k, p_c, p_s, p_t, p_lv, v_ch, now())
  on conflict (id) do update set
    ad = excluded.ad,
    -- kahraman başına rekorlar sunucuda birleşir (her kahraman için en yüksek k): iki sekmeden gelen eski bir anlık görüntü
    -- başka bir gönderimin rekorlarını silemez
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

revoke all on function public.kk_gonder(uuid, text, text, integer, integer, integer, integer, integer, jsonb) from public;
grant execute on function public.kk_gonder(uuid, text, text, integer, integer, integer, integer, integer, jsonb) to anon, authenticated;
