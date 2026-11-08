# Kara Koru mimarisi

Bu belge kodun nasıl düzenlendiğini ve yeni içerik eklerken nereye dokunulacağını anlatır.

## Nereden geldi

Oyun 405 KB'lık tek bir HTML dosyası olarak geliştirildi. v22 sürümü `tools/split-v22.cjs` aracıyla otomatik olarak ES modüllerine ayrıldı. Araç Babel ile kapsam analizi yaptığı için hiçbir referans elle taşınmadı. Bölünmüş sürüm, v22 ile aynı duman testinden aynı sonuçlarla geçti. Ardından three.js r128'den r187'ye yükseltildi.

Orijinal dosya `tools/kara-koru-v22.html` içinde duruyor. Bir davranışın eskiden nasıl olduğunu görmek için açılabilir.

## Üç temel kural

### 1. Değişen durum `$G` içinde

Tek dosyalık sürümde 141 global `let` değişkeni vardı. ES modülleri başka bir modülün değişkenine atama yapamadığı için bunların hepsi `src/core/store.js` içindeki `$G` nesnesine taşındı.

```js
import { $G } from '../core/store.js';
$G.S        // oyun durumu: 'menu', 'play', 'pause', 'choice' ...
$G.P        // oyuncu
$G.E        // canlı düşmanlar
$G.kills    // öldürme sayısı
```

`const` olan tablolar, malzemeler ve fonksiyonlar kendi modüllerinden normal `import` ile alınır.

### 2. Başlatma sırası `main.js` içinde

Modüllerin üst düzeyinde çalışan kod yoktur. Her modülün başlatma kodu `__init_N` adlı fonksiyonlardadır ve `main.js` bunları tek dosyadaki orijinal sırayla çağırır. Bu sayede döngüsel importlar sorun çıkarmaz.

Yeni bir modül eklerken üst düzeyde sadece fonksiyon ve sabit tanımla. Sahneye nesne eklemek ya da olay dinleyicisi bağlamak gibi işleri bir başlatma fonksiyonuna koy ve onu `BOOT` listesinde uygun yere ekle.

### 3. `window` köprüsü

`main.js` her modül dışa aktarımını ve her `$G` alanını `window` üzerinden erişilebilir yapar. Tarayıcı konsolunda `P.hp = 999` ya da `spawn(3)` yazmak bu yüzden çalışır; testler ve botlar da buna dayanır.

Arayüz artık köprüye dayanmaz (6 Kasım 2026). Menüler HTML'i şablon dizgileriyle üretir, ama satır içi işleyici (`onclick="..."`) kalmadı: düğmeler `${A('menuPage', 'kahraman')}` ile `data-act` (işlev adı) ve `data-a` (JSON argümanlar) taşır. `ui/actions.js` belgeye tek tıklama, Enter, `input` ve `change` dinleyicisi bağlar; işlevi `main.js`'in topladığı modül dışa aktarımlarından adla bulur, kod dizgesi değerlendirmez. Kaydırıcı `data-in=setRange`, onay kutusu `data-ch=setCheck` ile çalışır; ayar geri çağrıları (`applyQ`, `aVol`...) ad olarak taşınır. Kumanda yeniden çizimden sonra odağı `data-act|data-a` anahtarıyla bulur. Bileşik tıklamalar için küçük dışa aktarımlar var: `pickMap`, `pickChal`, `setSeg`, `lbTab`. Dışa aktarılan işlev adları modüller arasında tekil olmalı (kayıt adla tutulur).

## Faz 0 ile gelen sistemler

| Modül | Ne yapar |
| --- | --- |
| `data/stats.js` | 61 statın adı, biçimi, tabanı ve katmanı. `calc()` sonucu `(taban + düz) × (1 + yüzde) × çarpanlar`. Anahtar sonekleri katman seçer: `'dmg*'` çarpan, `'hp%'` yüzde, `'hp+'` düz. `critMul` aşırı kritiği hesaplar. |
| `game/status.js` | Düşman durumları: yanma, donma, zehir yığını, kan izi, lanet, sersemleme, büyülenme. `addStatus(e, k, o)` ekler, `stTick` her kare işler, `stMove`/`stActs` hareket ve saldırı iznini verir. |
| `data/items.js` | 99 eşyanın tablosu: ad, nadirlik, simge, `fx` stat katkıları (sonekli anahtarlar), `u` tekil, `q` görev eşyası, `h` tetikli. |
| `game/items.js` | Eşya kancaları. Davranış `IH[anahtar]` altında, veri `ITD` saf kalır. `addItem`/`remItem` tekil sınırını uygular. Kancalar: hit, crit, kill, hurt, evade, pick, chest, shrine, stage, level, pot, tick, calc. Eşya durumu `P.IS`; hız ve hasar patlamaları `burst`; aşırı can `hpCap`/`heal`; yardımcılar `potMul`, `shrineRate`, `shrineReward`, `extraLines`. Tılsımlı Kandil vuruş kancalarını `again=1` ile ikinci kez çağırır. |
| `game/loot.js` | Kristal, altın, gümüş ve can tek InstancedMesh ile çizilir; `$G.G` kayıtları hafif `m` nesnesi taşır, `gSync` matrisleri yazar. |
| `game/creatures.js` | Düşman modeli havuzu. `freeE` sıfırlayıp havuza koyar, `mkE` havuzdan alır, `pruneE` biyom değişince eskileri bırakır. |
| `engine/eyes.js` | Yaratık ve kahraman gözleri renk başına tek InstancedMesh; parıltılı gözler tek Points. `loop` içinde `sc.updateMatrixWorld(true)` sonrasında `eyeSync` çağrılır. |
| `game/weapons2.js` | Faz 2 silahları. `weapons()` bilmediği anahtarı `fire2`'ye verir. Genel mermi listesi `$G.B2` (`mkProj`: home, bnc, prc, exec, bm, boomR, decay, grav+zone bayrakları) ve bölge listesi `$G.ZN2` (hortum, kapan). `aegisHit` Kalkan silahının engellemesi. Silah başına kritik (`wc`/`wcd`), itme (`kb`) ve anahtar (`w`) `hurtE` seçenekleriyle gider; `e.lastW` öldürme sayaçlarını besler. |
| `game/heroes.js` | 21 karakter (`CR`: `k` anahtar, `b` taban, `pr` rütbe başına stat, `lock`, `cost`, `sc` ölçek), pasif kancalar `HH[k]` (items.js `fireHook` üzerinden çağrılır) ve hesap kancası `hc`. Rütbe `rankOf(ci)` (`META.rank[k]` tecrübesi, 20·r^1.5 eşikleri). Kostümler `SKINS` köşe rengi dönüşümüdür (`applySkin`), şapkalar `HATS` baş kemiğine bağlanan küçük modellerdir (`hatMesh`). `hero(k, skin, hat)` model önbelleğini `h<k>:<skin>` anahtarıyla tutar. |
| `data/enemies.js` | Düşman türleri `KINDS` (taban sınıf `t`, ölçek, statlar, `tint` boyası, `ghost` malzemesi, `fx` davranış bayrakları), harita listeleri `ROSTER`, ara bosslar `MINIS`, boss profilleri `BOSSP`. `spawn('akrep')` tür anahtarıyla doğurur; `e.kd` türü, `e.yd` statları taşır. |
| `game/bosses.js` | Boss saldırı profilleri (`bossTick`: hücum, lazer, direkler, silah kilidi, çağırma, bataklık kum, buz, güdümlü hayalet, alev gölü). Final arenasında evre makinesi: `e.ph` %75/50/25 eşikleri, `pylonsSpawn` + `pylonTick` (boss `e.pyInv` iken hasar almaz, direk başına %1/sn iyileşir), açık silah sayısı `P.wdis` (weapons.js dizin sırasına göre keser) ve oyuncuya etki eden bölgeler `$G.BZ` (`bzUpd`). `bossDied` silah kilidini kaldırır. |
| `game/graveyard.js` | Mezarlık akışı: mühürlü Mahzen (30 öldürme ya da 120 sn, süre dolarsa Kara Kefen), dört tabut ve anahtarlar, mühürlü kapı; Kızıl Bozkır'da iskelet heykeli olayı (Kemik'in Babası → Mezarlık kilidi); Kara Koru'da kafes (Yaban) ve şüpheli çalı (Çalı). |
| `data/challenges.js` | 30 meydan okuma: gümüş çarpanı `m`, stat katmanları `st`, bayraklar `fl`. |
| `game/challenge.js` | Meydan okuma uygulaması: `chalApply` koşu başında (slot, zorluk, sayaç, lanet tomu), `chalStats` hesapta, `chalFlag(k)` bayrak okuma (kırılgan, uyuyan, eşyasız, sunaksız, altınsız, hızlı koşucu, kör, karanlık, boss canı, erken dalga ...). Tamamlama `winRun` içinde `META.chal["k:harita:kademe"]`, kalıcı +%1 gümüş. |
| `engine/gfx.js` `terrHook/fogSheets/lightShafts/grassField` | Zemin shader kancası (dünya koordinatlı çimen çizgileri, kuru yama, çakıl, çiçek, Bozkır tabakaları, normal dalgası), Mezarlık ve Koru ırmağı sis levhaları, ışık huzmeleri, oyuncuyu izleyen çimen alanı, rüzgâr malzemeleri, ışıma. |
| `world/mapm.js` | Simge yapılar ve süs modelleri (`MAPM`). Mezarlık seti: `tomb(v)`, `fence`, `lantern`, `mausoleum`; Bozkır: `cactus`, `outcrop`; Koru: `pstone`. Her yapı `{g, c}` döndürür; süsler düz geometri. |
| `world/mapgen.js` | Yükseklik alanı, ırmak/kanyon, simge yerleşimi, yollar, renkler. Biyom dalları: 0 Koru (ırmak), 1 Bozkır (kanyon, mesa), 2 Mezarlık (ırmak, kurgan/tapınak/iskelet, gri-mor palet). |
| `world/build.js` | three.js tarafı: zemin, su, simge yapılar (`placeLM`), biyoma göre bitki örtüsü ve süs yerleşimi (`buildMap`), `vegInst` instanced parçalar, kuşlar, bulutlar, mini harita arka planı. |
| `engine/realtrees.js` | Gerçekçi ağaçlar: kanvas kabuk (albedo+kabartma) ve yaprak kartı dokuları, UV'li gövde/dal silindirleri, yumuşatılmış normalli yaprak kartı taçları; `treeGeo(kind, sd, part)` önbellek, geometri `userData.mat` ile malzeme taşır. |
| `engine/iskin.js` | Instanced skinning (Faz 9): aynı model anahtarı + malzemeyi paylaşan düşmanlar tek `InstancedMesh`; her kare `iskinUpd` kök-yerel kemik matrislerini batch başına bir float dokuya yazar, vertex shader `gl_InstanceID` satırından okur. Vuruş flaşı yuva başına `iFl` attribute'u; gölge için aynı deformasyonu yapan `MeshDepthMaterial`. Düşman `skInst(d, 1)` ile kurulur (SkinnedMesh yok, kemikler grupta), `iskinAdd`/`iskinRelease`/`iskinMat` havuzla eşgüdümlü. Mat aksesuarlar `bakeAcc` ile geometriye gömülür; saydam parçalar ve parıltılar kemik çocuğu kalır. Konsolda `iskinStats()`. |
| `engine/warm.js` | Shader ön-derleme (Faz 9): temsilî nesneler menüde `compileAsync` ile derlenir, `warmTick` iki kare sonra kaldırır. Yeni bir malzeme bileşimi eklerken (ör. yeni ShaderMaterial, instanced + saydam) buraya bir temsilci ekle; duman testi "koşu boyunca yeni program derlenmedi" bunu yakalar. |
| `core/helpers.js` `tip(k, başlık, metin)` | Bağlamsal ipucu: anahtar başına bir kez (`kk_tips`), 9 sn panel, Esc kapatır, `SET.tips` ile kapanır. Tetikler: ilk sandık, tüccar, kazan, ocak, meydan okuma sunağı, ara boss, elit, akın, uzatma, Son Dalga, seviye ekranı, boss kapısı. |
| `ui/hud.js` + `ui/cards.js hudSlots/hudItems` | Oyun içi HUD: `index.html` içindeki sabit öğeler `hud()` ile güncellenir (`$G.hk` imzası değişince). Düzen Megabonk gibi: sol üst can/kalkan/atılma + silah ve tom yuvaları, üst orta altın·süre·öldürme + yol çubuğu + boss çubuğu, üst şerit tecrübe (sağda seviye), sağ üst mini harita, sol alt eşyalar, sağ alt kısayollar (ilk 10 sn, `body.kh0`). |
| `ui/icons.js ikon(id, ic, col, kind)` + `src/assets/ikon/` | Silah (`w_`), tom (`t_`) ve eşya (`i_`) simgeleri boyalı 128 px WebP; `import.meta.glob` ile pakete girer (tek dosyalık derlemede satır içi). Resmi olmayan anahtar eski SVG çizimine (`svg`) düşer. Üretim: `tools/ikon-tarif.mjs` (157 tarif, 8'li sayfalar) → `tools/ikon-uret.sh` (Codex görsel üretimi, saydam zemin) → `tools/ikon-kes.mjs` (boşluklardan hücre bulur, opak zemini reddeder, WebP yazar). |
| `ui/menus.js` `renderMenu/heroPage/mapPage/menuPage` | Giriş menüsü üç sabit sayfa: ana (`.mnav` büyük düğmeler), kahraman (`.hg/.hc` 4 sütunlu liste + `.chd` ayrıntı + `custHTML` rütbe/kostüm/şapka), harita (`.mg/.mc` kartlar, kademe düğmeleri, `chalHTML`). Sayfa `$G.menuPg`; Enter/Esc akışı `input/input.js`. Ayarlar `settings()` altı sekme (`$G.setPg`, `setTab`). |
| `ui/menus.js` `helpHTML/showHelp/closeHelp` | Kısayollar penceresi (F1 ya da ?): tuşlar, konsol komutları, dokunmatik ve kumanda; duraklatma ve ayarlar menüsünden de açılır. |
| `geo/accessories.js` | Aksesuar katmanı (Faz 8): `ACC.hero[k]` ve `ACC.kind[k]` parça listeleri, `attachAcc(u, bones, specs)` parçaları iskelet kemiğine çocuk olarak ekler (`userData.acc`). Düşmanlarda aksesuarlı türler ayrı havuz anahtarı alır. Dosya başında sınıf model ölçüleri. |
| `data/types.d.ts` | Veri tablolarının tip tanımları (Weapon, Tome, Item, Hero, EnemyKind, Quest, Challenge, MapDef, Shop, Meta). Derlemeye girmez. |
| `ui/actions.js` | Arayüz olay yönlendiricisi: `A(ad, ...arg)` öznitelik üretir, `regActions` modül işlevlerini kaydeder, `call(ad)` adla çağırır. |
| `ui/supa.js` | Ortak sıralama: Supabase REST'e paketsiz `fetch` (tüm zamanlar `kk_skor`, haftalık `kk_hafta`, `count=exact` ile oyuncu sayısı; yazma `kk_skor_gonder`), hafta hesabı (`haftaBasi`), gönderilmemiş rekorlar için giden kutusu. Kimlik ve belirteç `ui/hesap.js`'ten (`supaAuth`); şema `supabase/siralama.sql`. |
| `ui/hesap.js` | Oyuncu hesabı: kullanıcı adı + şifre (Supabase Auth), giriş/kayıt ekranı, oturum yenileme, çıkış. `hesapKapisi()` oyun modülleri başlamadan önce çalışır (`main.js`): hesabın kaydını indirip tarayıcıya yazar; sonra kayıt anahtarları (`HESAP_ANAHTAR`) yoklanır, değişince `kk_kaydet` ile gönderilir. Supabase ayarı yoksa kapalı. |
| `ui/console.js` | Komut konsolu (varsayılan açık, ayardan kapatılır). Ters tırnak ya da F10 açar; Tab tamamlar (komut, eşya/silah/tom/tür anahtarı), ↑↓ geçmiş, `yardim KOMUT` açıklar; `fps` köşe göstergesi, `kapi` ışınlanma, `kilit`, `turler`, `kisayollar`, `ipuclari sifirla`; `altin`, `gumus`, `seviye`, `esya`, `silah`, `tom`, `dogur`, `boss`, `asama`, `zaman`, `temizle`, `achepsi`, `gorevler`. Açıkken klavye oyuna gitmez. |
| `game/run.js` | Koşu yapısı: Üç Diyar rotası `ROTA` (aşama → harita: koru, bozkir, mezarlik; `nextStage` `P.map`'i değiştirir), `ASAMA` = 3, kademe yalnız zorluk (`$G.MSEL.tier`, `kk_map`; kayıt anahtarı `YOL` = 'koru'), `bossIdx` (Koru/Bozkır K1 hafif, K2-3 ağır biçim; Mezarlık Dev Hortlak), `TIERM` kademe çarpanı, `winRun` (son boss → Çıkış Geçidi, Son Dalga), `exitRun`, `otTick` (uzatma: sayaç dolunca uçan dalga), arena (`arenaBuild`/`arenaTrim`/`arenaTick`; yalnız Mahzen mührü kullanır, eski direkli final arenası kapalı: `isArena()` false), `MBT` ara boss zamanları. |

Kurallar:

- Nesneye özel geometri üretirken `ownG(geo)` ile işaretle; `kill`, `clr` ve `buildWorld` bunları serbest bırakır. Paylaşılan önbellek geometrileri (`envG`, `skData`) işaretlenmez.
- `hurtE(e, d, noNum, o)` dördüncü parametre `{ el, dot }` alır. Element etiketi hasarı `C[el]` ile çarpar; `dot` zamanla hasar için kritik, ses ve itme üretmez.
- Kalıcı kayıt `kk_meta` sürümlüdür (`META_V`). Yeni alan eklerken `metaDefault` içine varsayılanını koy ve sürümü artır; `migrateMeta` eski kayıtları tamamlar.
- Adlı sayaçlar: koşu içinde `inc(k)` ile `P.c[k]` artar, koşu sonunda `META.st.c`'ye işlenir; `cnt(k)` toplamı verir. Görev koşulları (`QD`) bunları okur; `ul` alanı tamamlanınca `META.l` kilidini açar.
- Kalkan puanı `P.shd` (azami `C.shield`), 4 sn vurulmayınca 2 sn'de dolar; `hurtP(d, src)` önce kalkanı eritir, `src` verilirse diken (`C.thorns`) saldırana işler.
- Ayar anahtarları `core/settings.js` içinde açıklamalı; arayüz etkileri `applyUI` (CSS değişkenleri `--mms`, `--hpc`, `body.novg`), parçacıklar `VFX.setOp` ve `emit` içindeki `SET.pd`, gölge `applyQ`, FPS sınırı `loop`. Müzik makamı `audio/music.js` içinde `MAKAM` (örnekler Hicaz'da sentezlenir, diğerleri derece başına perde kaydırma).
- Büyük haritanın sis perdesi `P.fog` (40×40 hücre, `fogMark` her kare oyuncunun çevresini işaretler); aşama kurulumunda sıfırlanır.
- Kilitli içerik üç katmandan geçer: `unl(lock)` (META.l), Toggler `META.opt['w_|t_|i_' + k]` (havuzdan çıkarma), ve kart seçiminde `ban`. Eşya kilitleri `data/items.js` içinde `lock`, görevleri `data/content.js` içinde `i_*`.
- Dükkân yükseltmeleri üç kapıyla kilitlenir: `need` (META.l anahtarı), `qn` (tamamlanan görev sayısı), `unl` (açılan kilit sayısı). `muLocked(u)` tek noktadan karar verir.
- Başarımlar `META.ach[k] = zaman`: her görev tamamlanınca (`qCheck`) ve her meydan okuma tamamlanınca (`ch_` öneki). Otağ "Başarımlar" sekmesi.
- Karakter kontrolleri indeksle değil anahtarla yapılır: `CR[$G.CI].k == 'golge'`. Yeni karakter eklerken listenin sonuna ekle; kaydedilmiş `kk_ci` indeksleri bozulmasın.
- Kilitli karakter iki adımda açılır: koşul görevi `META.l['q_<lock>']` verir, Otağ'da `buyChar` gümüşle `META.l[lock]` açar.
- Kapı durumları (`GATE.st`): 0 boss çağrılabilir, 1 boss sahada, 2 sonraki aşama geçidi, 3 çıkış geçidi. Koşu alanları: `P.map`, `P.tier`, `P.stage` (0 tabanlı), `P.final`, `P.exited`, `P.ot` (uzatma süresi), `P.swT0` (Son Dalga başlangıcı), `P.ws`/`P.ts` slot sayıları, `P.sk` atlama hakkı.
- Nadirlik `rarWeights(luck)` ile hesaplanır; silah ve tom seviye artışları `RAR[r].m` çarpanı alır. Silah seviyesi `P.wmax` (40), tom `P.tmax` (99) ile sınırlıdır.

## Yeni içerik eklemek

| Ne | Veri | Davranış |
| --- | --- | --- |
| Silah | `data/content.js` içinde `WD` (`b` taban, `u` seviye havuzu, `lock`, `el`) | `game/weapons2.js` içinde `fire2` (eski 12'si `game/weapons.js`) |
| Tom | `data/content.js` içinde `TDF` (`v` seviye başına, `lock`, `rand` kaos) | `game/stats.js` içinde `calc()`; `fx` taşıyan tomlar rastgele stat biriktirir |
| Eşya | `data/items.js` içinde `ITD` | `fx` alanı `calc()` ile otomatik uygulanır; tetikli davranış `game/items.js` içinde `IH` (aynı anahtar) |
| Düşman türü | `data/enemies.js` içinde `KINDS` ve `ROSTER` (taban sınıf `data/content.js` içinde `TY`) | model taban sınıftan, `tint` ile boyanır; ek davranış `fx` bayraklarıyla `game/update.js` içinde |
| Boss | `data/enemies.js` içinde `BOSSP` (harita → biçim, `run.js bossIdx` seçer) | saldırılar `game/bosses.js` içinde `bossTick` |
| Harita | `data/content.js` içinde `MAPS` | biyom `world/terrain.js` içinde `BIO` (indeks `MAPS.bi`), boss adları `data/enemies.js` içinde `BOSSP` |
| Sunak | `data/content.js` içinde `SHD`/`SHC` | model `game/objects.js` içinde `mkSh` (9+ için taban model eşlemesi), etki `game/interact.js` içinde `useShrine` |
| Güç | `data/content.js` içinde `PUD` | etki `game/update.js` içindeki toplama dalı |
| Kahraman | `game/heroes.js` içinde `CR` (koşul görevi `data/content.js` içinde `c_<k>`, `ul: 'q_<k>'`) | model `geo/models.js` içinde `hero()`; yeni karakterler `HVAR` ile taban model + renk eşlemesi, ayırt edici parçalar `geo/accessories.js` içinde `ACC.hero[k]` |
| Düşman türü | `data/enemies.js` içinde `KINDS` (+ harita listesi `ROSTER`) | görünüm `tint` + `geo/accessories.js` içinde `ACC.kind[k]`; davranış bayrakları `fx` (poi, burn, frz, static, roll, gold, pylon, kefen, zones, boom, arm, flee, frog, xpdrop) `game/update.js` ve `game/enemies.js` içinde; bestiyer satırı `k_kind_<k>` sayacından otomatik |
| Şapka | `game/heroes.js` içinde `HATS` + `hatMesh` | başarım görevi `data/content.js` içinde `h_<k>`, `ul: 'hat_<k>'` |
| Görev | `data/content.js` içinde `QD` | `f` fonksiyonu ilerlemeyi döndürür; meydan okuma (`ch_*`) ve kostüm (`s_*`) kategorileri `CHAL` ve `CR`'den türetilir |
| Başarım | `data/content.js` içinde `ACHM` (Megabonk aynası: kilit görevlerinden türetilir) ve `ACHD` (bize özgü) | `f` → [ilerleme, hedef]; `achCheck` görev denetimiyle birlikte çalışır, `META.achv` zaman damgası tutar |
| Sunak | `data/content.js` içinde `SHD` + `SHC` rengi | model `objects.js` `mkSh` (t ≥ 9 için taban model eşlemesi), etki `interact.js` `useShrine`, yerleşim `setupStage` |
| Olumsuz eşya | `data/items.js` `cor: 1` | "Lanetli" etiketi `RAR[5]`; havuz ağırlığı `r` ile aynı kalır |
| Ses | `audio/synth.js` içinde `REC` | `audio/engine.js` içinde `SM` ses düzeyi tablosu |

Yeni bir eşya çoğu zaman sadece `ITD` tablosuna bir satırdır.

```js
kurt: { n: 'Kurt Dişi', r: 2, ic: 'claw', fx: { crit: .05, dmg: .05 }, d: 'Kritik vuruş ve hasar biraz artar.' },
```

## three.js r187 notları

- Renk yönetimi açık. Hex renkler otomatik olarak doğrusal uzaya çevrilir. Köşe renkleri `engine/renderer.js` içindeki `toBG` ile elle çevrilir.
- Işıklar fiziksel birimde. Eski görünümü korumak için yoğunluklar `Math.PI` ile çarpıldı.
- Son işleme `three/addons` eklentilerinden gelir. Sıra `RenderPass`, `UnrealBloomPass`, renk düzenleme, `OutputPass`. Işıma ton eşlemeden önce HDR değerler üzerinde çalıştığı için eşik `BLOOM_TH` ile ayarlanır.
- `PCFSoftShadowMap` kaldırıldı, `PCFShadowMap` kullanılıyor.

## Test

```bash
npm run build
npx vite preview --port 4173 &
npm test
```

Performans: konsolda `perf` kare süresi ve program sayısını verir; takılma şüphesinde önce `R.info.programs.length` koşu boyunca artıyor mu diye bak (shader derlemesi), sonra `PERF.lastMax`.

`tests/smoke.mjs` menüyü açar, fareyle oyuna girer, stat motorunu, durum efektlerini, eşya kancalarını, nadirlik formülünü ve kayıt göçünü doğrular, 200 ve 400 düşmanla güncelleme süresini ve çizim çağrılarını ölçer, düşman havuzunu, kemik dokusu ve geometri sızıntısını, tüccar engelini, aşama geçişini, duraklatmayı, ölüm ekranını ve ses bankasını kontrol eder. `tests/shots.mjs` görsel karşılaştırma için ekran görüntüleri alır.

## Yol haritası

Sonraki adımlar, öncelik sırasıyla.

Oyun içeriği ve sistem planı [YOL_HARITASI.md](YOL_HARITASI.md) içinde. Teknik borç:

1. **Durum nesnesini bölmek.** `$G` alanlarını `player`, `world`, `ui` gibi gruplara ayırmak.
2. **`window` köprüsünü kaldırmak.** Satır içi `onclick`'ler olay yönlendiricisine taşındı (6 Kasım 2026); köprüyü artık yalnız konsol, testler ve botlar kullanıyor. Kaldırmak için önce testlere ayrı bir erişim yolu gerekir.
3. **TypeScript.** Tip denetimi açık (6 Kasım 2026): `npm run typecheck` bütün `src/` dosyalarını `checkJs` ile denetler, gevşek modda sıfır hata. Sırada `strict`'e doğru dosya dosya sıkılaştırma ve `$G` için tip tanımı.
4. ~~İskeletli düşmanlarda instancing.~~ Yapıldı: `engine/iskin.js` (Faz 9). Kalan: kahraman ve NPC'ler hâlâ tek SkinnedMesh (zaten birer tane).
