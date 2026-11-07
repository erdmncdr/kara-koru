# Kara Koru

Türk mitolojisi temalı, tarayıcıda çalışan 3B hayatta kalma oyunu. Alp, Kam, Gölge ve kilidi açılan diğer kahramanlarla koruya gir, Tepegöz'ü devir, aşamalar arasında döngüye gir.

Oyun three.js ile çizilir. Karakterler, yaratıklar ve harita prosedürel olarak üretilir. Sesler ve Hicaz makamındaki müzik oyun açılışında bir Worker içinde sentezlenir, dışarıdan dosya yüklenmez.

## Başlarken

Node.js 20 ya da daha yenisi gerekir.

```bash
npm install
npm run dev
```

Tarayıcıda açılan adres oyunu gösterir. Kodu kaydettiğin anda sayfa yenilenir.

## Komutlar

| Komut | Ne yapar |
| --- | --- |
| `npm run dev` | Geliştirme sunucusu, anında yenileme |
| `npm run build` | `dist/` klasörüne yayına hazır site |
| `npm run build:single` | `dist-single/index.html` tek dosya, paylaşmak ya da artifact olarak açmak için |
| `npm run preview` | `dist/` çıktısını yerelde sunar |
| `npm test` | Başsız Chrome duman testi, önce `VITE_SUPABASE_URL= npm run build` (giriş ekranısız derleme) ve `npx vite preview --port 4173` gerekir |
| `npm run typecheck` | Bütün kaynakta tip denetimi (`tsc`, `checkJs`) |

## Hesaplar ve ortak sıralama

Yayın: https://kara-koru.netlify.app

Yayında giriş zorunludur: oyuncu kullanıcı adı ve şifreyle kayıt olur ya da girer, sonra oyun yüklenir. İlerleme (gümüş, kilitler, görevler, rütbeler, kostümler), rekorlar, sıralama satırı ve ayarlar hesapta durur; başka cihazdan girince aynısı gelir. Tarayıcıdaki kayıt önbellektir, değişince birkaç saniye içinde hesaba gönderilir. Hesaplardan önce oynanmış bir tarayıcıda açılan ilk hesap, o tarayıcıdaki ilerlemeyi devralır. Aynı tarayıcıda oyun tek sekmede çalışır; aynı hesap iki cihazda açıksa eski kayıtla çalışan cihaz hesabın üstüne yazamaz, yenilemesi istenir. Sıralama iki tablodur: tüm zamanlar ve her Pazartesi (Türkiye saati) sıfırlanan haftalık. Arka uç Supabase (giriş, veritabanı); kod `src/ui/hesap.js` ve `src/ui/supa.js`, şema `supabase/siralama.sql`.

Kullanıcı adı 3–15 karakter (harf, rakam, `_`, Türkçe harfler), büyük/küçük harfe duyarsız ve tekildir. E-posta istenmez: ad arka planda e-posta biçimine çevrilir, e-posta gönderilmez; bu yüzden şifre sıfırlama yoktur.

Kurulum (kendi Supabase projenle):

1. supabase.com'da ücretsiz bir proje aç.
2. Panelde **SQL Editor**'e `supabase/siralama.sql` dosyasını yapıştırıp çalıştır (tekrar çalıştırmak güvenli).
3. **Authentication → Sign In / Providers** altında **Confirm email**'i kapat.
4. **Project Settings → API Keys** sayfasından proje adresini ve **publishable** anahtarı (`sb_publishable_…`; eski projelerde `anon`) al; `.env.example` dosyasını `.env` olarak kopyalayıp doldur.
5. `npm run build` ile derle. Adres ve anahtar derlemeye gömülür; anahtar herkese açık olacak biçimde tasarlandı, yazma yetkisi oyuncunun oturumunda ve sunucudaki fonksiyonlarda.

**Netlify'da yayın:** Netlify'da "Add new site → Import an existing project" ile bu GitHub deposunu bağla; derleme ayarları `netlify.toml`'dan okunur (`npm run build`, `dist`). Adres ve anahtarı `.env` yerine **Site configuration → Environment variables** altına `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` olarak gir (gizli işaretleme), sonra yeniden derlet. Her `main` gönderimi siteyi günceller.

Adres ve anahtar yoksa (yerel geliştirme, Claude içinde) giriş ekranı gelmez, oyun kaydı yalnız tarayıcıda tutar. Testler ve botlar giriş ekranını geçemez; onlar için Supabase'siz derle: `VITE_SUPABASE_URL= npm run build`. Oyun tarayıcıda çalıştığı için skor uydurmak tamamen engellenemez; şema başkasının satırını değiştirmeyi, sınır dışı değerleri ve 15 saniyeden sık gönderimi engeller.

## Klasör yapısı

```
src/
  main.js        giriş noktası, başlatma sırası
  core/          ortak durum ($G), ayarlar, oyun döngüsü, yardımcılar
  engine/        three.js, renderer, ışıklar, ışıma ve renk düzenleme, parçacıklar
  geo/           prosedürel geometri, karakter ve yaratık modelleri, iskelet animasyonu
  world/         harita üretici, simge yapılar, çarpışma, ortam, hortumlar
  game/          kahramanlar, düşmanlar, silahlar, sunaklar, aşama akışı, güncelleme
  data/          silah, tom, eşya, düşman ve görev tabloları
  ui/            HUD, menüler, kartlar, mini harita, sıralama
  audio/         ses sentezi, ses motoru, ortam sesleri, müzik
  input/         klavye, fare, dokunmatik, kumanda
  styles/        arayüz CSS
tests/           duman testi ve ekran görüntüsü karşılaştırması
tools/           v22'yi modüllere ayıran araç ve kaynak v22 dosyası
docs/            mimari ve geliştirme notları
```

Ayrıntılar için [docs/MIMARI.md](docs/MIMARI.md). Megabonk ile içerik karşılaştırması ve geliştirme planı için [docs/YOL_HARITASI.md](docs/YOL_HARITASI.md).
