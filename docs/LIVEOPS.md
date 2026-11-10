# Kurultay: yönetim paneli ve canlı işletim

Oyunu yayın yapmadan yönetmek için: uzaktan denge ayarı, etkinlik ve duyurular, koşu kayıtları, moderasyon, sezon, bakım modu.
Panel `yonetim.html` (canlıda `kara-koru.netlify.app/yonetim.html`), oyundan ayrı sayfa ve ayrı paket.

## Parçalar

| Parça | Nerede | Not |
| --- | --- | --- |
| Veritabanı | `supabase/siralama.sql`, sonra `supabase/liveops.sql` | İkisi de tekrar çalıştırılabilir. Sıra önemli. |
| Oyun tarafı | `src/core/ayar.js`, `src/data/ayar-sema.js`, `src/data/denge.js` | Açılışta `kk_ayar` ve `kk_etkinlik` okunur; ulaşılamazsa son yanıt, o da yoksa koddaki değerler. |
| Koşu özeti | `src/ui/menus.js` `over` → `ui/supa.js` → `kk_kosu_bitir(p_ozet)` | Yalnız giriş yapmış oyuncunun sıralamaya giren koşuları. |
| Panel | `yonetim.html`, `src/yonetim/` | Vite'ın ikinci girişi. |

## Güvenlik

Panelde gizli anahtar yok. Yönetici kendi oyun hesabıyla giriş yapar; her yönetim işlevi (`kk_y_*`) çağıranın `kk_yonetici`
tablosunda olup olmadığına veritabanında bakar. Sayfayı bulan biri giriş yapsa da hiçbir şey okuyamaz. Yönetici eklemek
yalnız SQL Editor'den: `liveops.sql` sonundaki satır. Panelden yapılan her değişiklik `kk_y_gunluk` tablosuna yazılır.

## Kurulum (bir kez)

1. Supabase SQL Editor'de `siralama.sql`, sonra `liveops.sql` çalıştırılır.
2. `insert into public.kk_yonetici (id) select id from public.kk_hesap where lower(ad) = lower('HESAP_ADI') on conflict do nothing;`
3. Oyun yayınlanır (`[yayinla]`). Sıra serbest: SQL çalışmadan yayınlanan oyun koddaki değerlerle çalışır, skoru özetsiz gönderir.

## Yeni ayar eklemek

`data/ayar-sema.js`'e satır (kimlik, sınırlar, koddaki değer), `core/ayar.js` `HEDEF`'e okuyucu ve yazıcı, Unity'de aynı kimlik.
Şemadaki varsayılan koddaki sabitle aynı olmalı; `tests/smoke.mjs` denetler.

## Yerelde denemek

Üretime dokunmadan, gerçek SQL ile (süreç içi Postgres):

```
npm i --prefix /tmp/pg @electric-sql/pglite
export PGLITE=/tmp/pg/node_modules/@electric-sql/pglite/dist/index.js
node tests/liveops-sql.mjs                       # SQL ve yetki sınamaları (60 denetim)
node tools/yerel-supa.mjs 8787 --tohum           # örnek veriyle yerel sunucu
VITE_SUPABASE_URL=http://127.0.0.1:8787 VITE_SUPABASE_ANON_KEY=test npm run dev
```

Panel `localhost:5173/yonetim.html`; sınama hesapları `tools/yerel-supa.mjs` başında.

## Bilinen sınırlar

- Denge değişikliği oyuncuya oyunu yeniden açınca ulaşır; süren koşuya dokunmaz.
- Koşu özeti istemciden gelir; sunucu yalnız öldürme sayısını geçen gerçek süreyle sınar. Reddedilen skor "Koşular"da görünür.
- Çıkış yapmadan menüye dönülen ya da yarıda bırakılan koşu kaydedilmez. Meydan okumalı koşular da (sıralamaya girmedikleri için).
