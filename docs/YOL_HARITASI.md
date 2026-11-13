# Kara Koru yol haritası

Hedef: Megabonk'un (v1.0.69, Şubat 2026) özellik kümesini **eksiksiz** karşılamak, üstüne Kara Koru'nun Türk mitolojisi kimliğini giydirmek. İlke şu: Megabonk'ta olan hiçbir sistem, sayı ya da içerik türü bizde eksik kalmayacak. Tema yalnızca isim, görsel ve sesi değiştirir, mekaniği budamaz.

Bu belge iki şeyi yapar. Önce bugünkü oyunla hedef arasındaki farkı sayılarla gösterir. Sonra farkı kapatacak işleri fazlara böler ve her fazın bitiş ölçütünü verir. Megabonk verisi üç kaynaktan derlendi: decompile edilmiş oyun verisi (`lukeod/megabonk_research`), topluluk veritabanları (megabonk.org, bonkmaster, survivorsdb) ve wiki özetleri. `(?)` işaretli sayılar tek kaynaklı ya da çelişkili, uygularken teyit edilmeli.

## 1. Nerede duruyoruz

### Güncel durum (5 Kasım 2026, oyundan sayıldı; kadro satırı 6 Kasım)

Aşağıdaki "başlangıç tablosu" projenin ilk gününü gösterir ve artık geçerli değildir; fazların hepsi tamamlandı. Bugünkü sayılar:

| Sistem | Kara Koru bugün | Megabonk | Durum |
| --- | --- | --- | --- |
| Karakter | 8 (4 taban + 4 ayrı gövde; rütbe, 7 kostüm türü, 28 şapka) | 21 | bilinçli olarak az: 21'in hepsi 4 gövdenin renk değişimiydi |
| Silah | 32 | 30 | tamam (+2 bize özgü) |
| Tom | 27 | 23 | tamam (+4) |
| Eşya | 98 (65'i tetikli, 7 lanetli) | 86 | tamam |
| Düşman türü | 50 | ~45–51 | tamam |
| Boss ve ara boss | 7 aşama bossu, 7 zamanlı ara boss + tabut bekçileri, heykel ve gizli bosslar | 19 | tamam |
| Harita | 3 (Kara Koru ve Kızıl Bozkır 3 kademe, Mezarlık tek) | 3 | tamam |
| Sunak ve etkileşim | 20 tür | 11 + etkileşimler | tamam |
| Güç | 7 | 6 (Faz 9 denetimi; ilk tablodaki 8 eskiydi) | tamam (+1) |
| Görev | 346 | ~141 + başarımlar | tamam |
| Meydan okuma | 30 | ~30 | tamam |
| Ayar anahtarı | 32 | ~30 | tamam |

Bilinen açıklar (hepsi belgenin ilgili turunda ayrıntılı):
- **Elle oyun testi.** Bugünkü denge değişiklikleri (kademe çarpanı, boss canı, aşama saati, can çalma, tabut bekçileri) yalnız bot ölçümüne dayanıyor.
- **Kaynaksız davranışlar.** Hayalet Beyi'nin saldırıları, tabut bekçilerinin güçlenme eğrisi, Bullseye patlama hasarı Megabonk'ta belgelenmemiş; tahmin. 6 Kasım 2026'da yeniden arandı (wiki arşivi, Steam yama notları, Fextralife, survivorsdb, decompile): Hayalet Beyi'nin wiki sayfası boş; tabut bossları açılış sırasına göre Jeff → Gary diye zorlaşıyor ama sayı yok; Bullseye'ın decompile'da yalnız alan adları var (değerler silinmiş). Bulunanlar işlendi: en çok 20 işaret (decompile), patlama Boyut ile ölçeklenir (v1.0.17).
- **Çelişkili iki sayı çözüldü (6 Kasım 2026).** 3. aşamanın ikinci ara bossu 1:30 kala (megabonk.wiki Bosses: "6:30 or 1:30 for tier 3"; eskiden 3:00). 3. silah slotu 25 gümüş kaldı: resmî yama notu (v1.0.4) görev sayısını 25 / 45 diye veriyor; gümüş fiyatında fan siteleri 25 ile 50 arasında bölünmüş, wiki dükkân sayfası "25 – 125" aralığı veriyor.
- **Açılış yüklemesi** (10 Kasım 2026, `ui/yukle.js`): simgeler (165 resim), Alp'in modelleri ve yazı tipleri artık oyun açılmadan indirilir; ilerleme `index.html` içindeki `#yuk` ekranında gösterilir (paket inmeden de görünür). Eskiden her dosya ekranda ilk göründüğü anda isteniyordu: kartlar ve kahraman sayfası ilk açılışta boş geliyordu. Giriş ekranı açıkken indirme arkasında sürer; ağ takılırsa (12 sn ilerleme yok) oyun yine açılır. Model dosyası bir kez indirilip bellekten ayrıştırılır. İlk ziyarette menüden önce ~3,6 MB iner; sonraki açılışlar tarayıcı önbelleğinden gelir.
- **Küsuratlı altın ve lahmacun** (11 Kasım 2026): Altın Kalkan hasar alınca seviye × 0,2 küsuratlı altın veriyordu, sayaç ondalığa dönüyordu; yuvarlanır (`game/items.js`; öteki bütün altın kaynakları zaten tam sayı). Yerdeki lahmacun öteki güçler gibi düz renkli çokyüzlüydü (kırmızı top); artık kendi ağı var: hamur, kızarmış kenar, kıyma, maydanoz, limon; eğik döner. İkisi de Unity'de aynı (`ItemHooks.cs`, `Powerups.cs`).
- **Dünya nesnelerinin modelleri** (12 Kasım 2026, `engine/glbprop.js`): Erdem "sunaklar, tapınaklar, kutular: çiz, modellemeye başlayalım" dedi. Codex'le on iki nesne çizildi (Ocak, Balbal, sandık, altın sandık, Boss Kapısı, gezgin tüccar, cadı kazanı, kan sunağı, kara sunak, açgözlülük taşı, çömlek, tabut); Erdem önerilen altısını onayladı: **sandık, altın sandık, Ocak, Balbal, Boss Kapısı, cadı kazanı** (`docs/model/nesne-<ad>.jpg`). Üretim: Meshy tek resimden model (30) + sadeleştirme (5; sandıklar 5.000, Balbal 6.000, Ocak ve kazan 7.000, kapı 9.000 üçgen), iskelet yok; altısı 210 kredi, kalan 166. Dosyalar `n_<ad>.glb` (0,68-0,91 MB; renk 1024, normal 512), nesne kurulurken iner. Kod: oyun nesneyi eski koduyla kurar (yer, etkileşim, ışıma, kristal ve halka ona bağlı); model inince eski ağ gizlenir, GLB eski ağın boyuna göre ölçeklenip tabanına oturur (`PROP.<ad>.boy`; Ocak 2,3: eski ağ alçak bir kaideydi). Ocak ve Altın ocak aynı model; kazanda kodla kurulan iksir yüzeyi ve alev konileri de gizlenir. `tools/nesne-cek.mjs` altı nesneyi oyunda çeker (nesne kamerayla oyuncunun arasına alınır). Denetim: 24 sandık, 18 sunak, kapı ve kazanda model takılı, hata yok, duman testi. Açık: altın Balbal (üç efsanevi eşya veren) artık altın renkte değil, sıradan Balbal'la aynı görünüyor; bedava (gri) sandık sıradan sandıkla aynı; sandık kapağı açılmıyor (tek parça); kalan altı çizim (tüccar, kan sunağı, kara sunak, açgözlülük taşı, çömlek, tabut) modellenmedi. Unity (`KaraKoruUnity`): `StageObjects.PropTak` (aşama nesnesinin gövde ağı boşaltılır, model eski gövdenin kutusuna göre takılır; ışıksız parçalar kalır), modeller `Models/Nesne*.glb`, malzeme ve kutu `KoruSetup`'ta. İlk denemede sandıklar dev çıktı: sandığın ışık sütunu ölçüye giriyordu; ölçü yalnız en çok köşeli ışıklı ağdan (gövde) alınıyor. Simülatörde (`KORU_NESNETEST`) sandık, Ocak, Balbal, kazan ve kapı doğru boyda görüldü, 43 nesneye model takıldı, hata yok.
- **Dev Karakoncolos modeli** (12 Kasım 2026, `engine/glbboss.js`): ilk ara boss modeli. Kara Koru'da ara boss'lar sırayla döner (Dev Karakoncolos, Kaya Devi, Kemik Okçu Başı), her oyuncunun ilk gördüğü bu; Kara Haydut ise yalnız Haydut taşından çağrılır (önce yanlış söylenmişti). Tasarım: kıllı, keçi boynuzlu kış cini; omuzlarda buz sarkıtları, sırtta kemik dikenler, boyunda çıngırak ve aşık kemiği kolyesi, toynaklar (`docs/model/ara-karakoncolos-on.jpg`, `-arka.jpg`). Üretim boss'larla aynı (40 kredi, 20.000 üçgen), kalan 4; `ara_karakoncolos.glb` 3,28 MB, aşama başlayınca arkada iner. Kod: `glbboss.js` ara boss'ları da kapsıyor (`URLS` anahtarı `KINDS` türü; `spawn` modeli olan `mini` için de `glbBoss` çağırır), hareketler boss'larınkini paylaşır: hücumcu türün (5) nişan evresinde (cs 1) göğüs dövme, atılmada (cs 2) koşu, ölümde devrilme. Seçkin halkası ve hücum çizgisi eski gövdeden kalır. Boy yarıçapın 1,9 katı: 4,7 birim (oyuncunun ~1,6 katı). `tools/araboss-cek.mjs`. Denetim: düz ışıkta dört açı, yürüyüş ve koşu klibi kare kare (bozulma yok), oyunda altı an, ölünce model sökülüyor, boss'lar hâlâ çalışıyor, duman testi (bir kez `kalan açıklar` kontrolü kaldı, iki tekrar geçti: kararsız). Unity: `Models/AraKarakoncolos.glb`, `Enemies.SpawnMini` modeli olan türde `BossTak` çağırır, `BossRig.Tick` nişan parametresi; simülatörde (`KORU_BOSSMODEL` sonunda) geliş, nişan ve atılmada görüldü, hata yok; ölüm karesi boş çıktı (devrilme iOS'ta görülmedi). Açık: diğer altı ara boss ve Kara Haydut eski gövdede.
- **Gölge modeli** (12 Kasım 2026, `engine/glbhero.js`): Erdem "Gölge'yi tamamen yap, ne lazımsa, sağlam olsun" dedi. Dördüncü Meshy kahramanı. Çizim oyundaki onaylı portreden (kapüşonlu, yüzü karanlıkta, sarı gözlü suikastçı; `docs/model/golge-on.jpg`, `-arka.jpg`, `golge-yatagan.jpg`), sağ el delikli yumruk. Üretim: model 30 + remesh 5 + iskelet 5; yatağan ayrı model 30 + remesh 5 (3.000 üçgen); dört hareket 12 (saplama 240, yukarı çekiş 221, öne eğik koşu 509, sinsi yürüyüş 559). Toplam 87 kredi, kalan 44 (hepsi kalıcı). Dosyalar `golge.glb` 2,19 MB, `golge_yatagan.glb` 263 KB, `golge_hareket.glb` 175 KB; Gölge seçilince ya da son seçilen oysa açılışta iner. Kod (`takGolge`): yatağan Alp'in kılıcı gibi yumruğun deliğinden geçer (`YATAGAN.boy` 0,42; ilk 0,5 uzun pala gibi duruyordu), sağ kol kılıç tutuşuyla kurulur; kapüşonun içinde iki sarı göz ışığı (`GOZ`; kostümde kostümün rengine uyar). Saldırılar kendi klipleri (`sal` aralıkları klipte sağ elin ileri uzadığı anlar örneklenerek bulundu: saplama 0,45-1,15, çekiş 0,7-1,4), koşu kendi öne eğik klibi (`ayak.run` 2,1: tarama 1,6 → 0,18, 2,1 → 0,18, 2,7 → 0,32, 3,3 → 0,44; kahramanlar içinde en az kayan), oyundaki duruş doğal bekleme. Sinsi yürüyüş klibi kullanılmıyor (adımı 0,18 boy/sn, oyun hızında kayardı; 3 kredi boşa gitti). Denetim: on bir duruş dört yönden, dört kostüm ve iki şapka seçim ekranında, duman testi. Portre değişmedi (zaten bu tasarım). Unity (`KaraKoruUnity`): `Models/GolgeModel.glb`, `GolgeYatagan.glb`, `GolgeHareket.glb`; `MeshyKind` kaydı (ölçek 1,6364 ve h0 2,9454 web'de ölçüldü), yatağan `AlpRig.AttachWeapons` ile kılıç gibi takılır (`swordBoy` 0,42, kabza dilimi), göz ışıkları `Efekt`; simülatörde (`KORU_MESHYTEST`) seçim ekranında ve kendi kendine koşuda görüldü, hata yok; koşu karelerinde karakter küçük, saldırı duruşları ve yatağanın eldeki açısı yakından incelenmedi. Açık: gerçek telefonda denenmedi; Unity'de kilitli kahraman seçiliyken karodaki portre beyaz zeminde soluk kalıyor (eski davranış, bütün kilitli kahramanlarda).
- **Bahadır modeli, Tripo ile** (13 Kasım 2026, `engine/glbhero.js`): Meshy kredisi bitince (26 Kasım 2026'da yenilenir) Erdem Tripo3D aboneliği aldı; ilk deneme Bahadır. Çizim Codex'le portreden (`docs/model/bahadir-on.jpg`, `-arka.jpg`). Üretim `tripo make ön arka --then decimate:18000,rig:spec=mixamo`: model 30 + sadeleştirme 30 + iskelet 25 = 85 kredi, kalan 915; 23.990 üçgen, 2K doku. Tripo iskeleti Meshy'ninkinden farklı kurulu (65 kemik, `mixamorig:` adları, parmaklar var, model +X'e bakar, ölçek ve dinlenme duruşu başka): Meshy klipleri doğrudan oynatılınca model çöküyor. Çözüm iki araç: `tools/tripo-ad.mjs` kemikleri Meshy adlarına çevirir ve modeli +Z'ye döndürür; `tools/klip-aktar.mjs` klipleri dünya uzayında bu iskelete çevirir (kemiğin dinlenmeden dönüşü hedefe uygulanır, iki dinlenme duruşunun kemik yönü farkı kapatılır: ayak 30°, omuz 24°, kol 9-14°; kalça yüksekliği oranı 0,546). İlk denemede model yana baktığı için bacaklar yana savruluyordu; döndürünce yürüyüş ve savurma Alp'in aslıyla kare kare aynı çıktı (`tools/model-poz.mjs`, `ACILAR=90,0` yandan ve önden). Ortak 13 klip çevrildi: `bahadir_hareket.glb` 355 KB, model `bahadir.glb` 2,17 MB; `URLS.bahadir.tum` ortak klip dosyalarının yerine bunu yükler (`tumKlip`). Yeni kredi harcamadan eski hareketler kullanılabiliyor: bundan sonraki Tripo modelleri aynı yoldan geçer. Elinde bir şey yok (baltanın çizimi var, modeli yok): oyundaki duruş doğal bekleme, saldırılar Alp'in savurmaları (yumrukla). Denetim: on bir duruş dört yönden, gerçek oyunda koşu, zıplama, takla, kayma, atılma; ayak kayması yürüyüş 0,53 koşu 0,35 (Alp'le aynı düzey), duman testi. Unity (`KaraKoruUnity`): `Models/BahadirModel.glb`, `BahadirHareket.glb`; `MeshyKind` artık bütün klipleri ve üst gövde maskesini kendi getirebilir (`idle, walk, jump, flip, slide, dash, hit, upperBody`), ölçek ve h0 3,1038 web'de ölçüldü; simülatörde (`KORU_MESHYTEST`) seçim ekranında ve kendi kendine koşuda görüldü, hata yok (koşu karesinde karakter küçük, hareketler yakından incelenmedi). **Balta** (13 Kasım 2026): Tripo'da çizimden (`docs/model/bahadir-balta.jpg`) model 30 + sadeleştirme 30 = 60 kredi, kalan 855; 7.784 üçgen (4.000 istendi), `bahadir_balta.glb` 746 KB. Dosyada ağız +X'e çevrildi. `takBahadir`: sap sağ yumruktan geçer (yumruğun ortası el ve parmak kemiklerinin ortası: Tripo elinde parmakların ağırlığı kendi kemiklerinde), baş öne, ağız aşağıda (`BALTA.boy` 0,58, `tut` 0,3); kol kılıç tutuşuyla kurulur, saldırılar Alp'in savurmaları. Denetim: on bir duruş dört yönden ve altı yakın kare, oyun içi denetim (ayak kayması yürüyüş 0,46 koşu 0,35), duman testi. Unity: `Models/BahadirBalta.glb` (ağız -X), yatağan gibi `AttachWeapons` ile takılır; simülatörde seçim ekranında (ağız aşağıda, sap yumrukta) ve koşuda görüldü, hata yok. Açık: gerçek telefonda denenmedi; Bahadır'ın paletinden türeyen Pehlivan, Yaban ve Çalı eski gövdede; kostümler dokuya renk dönüşümüyle uygulanıyor, seçim ekranında bakılmadı.
- **Çalı modeli** (13 Kasım 2026, `engine/glbhero.js`): ikinci Tripo kahramanı. Kalan üç kahramanın (Anka, Çalı, Tulpar) portreleri insan değil; Erdem'e iki tasarım gösterildi (A yürüyen çalı yaratığı, B çalı pelerinli izci), A'yı seçti: gövde tek yaprak topu, tek sarı göz, kök bacaklar, dal kollar, tepede iki dal (`docs/model/cali-on.jpg`, `-arka.jpg`). Üretim Bahadır'la aynı (85 kredi, kalan 770; 27.863 üçgen, 10 dakikadan uzun sürdü). `cali.glb` 2,28 MB, `cali_hareket.glb` 354 KB (aynı 13 klip, `tools/klip-aktar.mjs`; kalça yüksekliği oranı 0,372, bacaklar kısa). Kod: `URLS.cali.tum`; `tum` olan kahramanda oyundaki duruş doğal bekleme; `KAHRAMAN.cali` ayak hızı kalça oranına göre küçültüldü (yürüyüş 0,34, koşu 2,1), `boy` 1,1 (tepedeki dallar kutuya girdiği için gövde kısa kalıyordu). Elinde bir şey yok, saldırılar Alp'in savurmaları (yumrukla). Boynu ve beli olmayan gövde korkulan kadar bozulmadı: yürüyüş, savurma, zıplama, kayma ve koşuda yapraklar bütün kalıyor. Denetim: on bir duruş dört yönden, altı yakın kare, gerçek oyunda dokuz an, duman testi. Ayak kayması ölçümü bu gövdede yürüyüşte güvenilmez (kök ayaklar hep yere yakın, iki ayak da 'yerde' sayılıyor: 1,5 çıktı, hız değişince değişmedi); koşuda 0,43. Unity (`KaraKoruUnity`): `Models/CaliModel.glb`, `CaliHareket.glb`; Tripo kahramanlarının kurulumu ortak (`KORU_TRIPO`, maske `Anim/UstGovde_<ad>.mask`), ölçek 2,9105 ve h0 2,9048 web'de ölçüldü; simülatörde (`KORU_MESHYTEST`) seçim ekranında ve kendi kendine koşuda görüldü, hata yok. Açık: koşuda öne yatınca gövdenin altındaki boşluk mavimsi görünüyor; gerçek telefonda denenmedi; yürüyüş kayması gözle de yakından incelenmedi; kostümler ve şapka bakılmadı; portre aynı tasarım, değişmedi.
- **Kalan beş nesne, Tripo ile** (13 Kasım 2026, `engine/glbprop.js`): Erdem "karakter değil de diğerlerini yapalım" dedi. Daha önce çizilip modellenmemiş beş nesne: **kan sunağı, kara sunak, açgözlülük taşı, tabut, çömlek** (`docs/model/nesne-<ad>.jpg`). Üretim: `tripo make resim -p face_limit=6000` (sunaklarda 7000): üçgen sınırı üretimde verilince ayrı sadeleştirme adımı gerekmiyor, sınır tam tutuyor (çömlek 5.974) ve nesne başına 50 kredi (iki adımlı yol 60'tı; baltada 4.000 istenip 7.784 gelmişti). Beşi 250 kredi, kalan 520. Dosyalar `n_<ad>.glb` 0,38-0,51 MB. Kod: `mkSh` 3, 4, 6 ve 10 türünde `glbProp` çağırır (Tripo modelinin önü +X: `don` ile çevrilir); üstte dönen taş modelin tepesinin 0,55 üstüne çıkarılır. Çömlekler tek çizim çağrısıyla çizildiği için (`InstancedMesh`) ayrı yol: `glbPot` model inince ağın geometrisini ve malzemesini yerinde değiştirir, geometri eski çömleğin kutusuna oturtulur ve bir kez hazırlanıp bütün aşamalarda paylaşılır (ilk sürüm her aşamada kopyalıyordu: duman testinin geometri sızıntısı kontrolü yakaladı); çömlek toplu çizim için 2.560 üçgene indirildi (`n_comlek.glb` 128 KB). Gümüş çömleğin rengi (.45, .8, 1.5): kiremit dokuyu soğuk griye çeker. Denetim: 13 sunakta model takılı, altı nesne oyunda yakından, hata yok; duman testi (paylaşılan geometri sınırı 8 → 16: nesne modeli türü 11 oldu). Unity (`KaraKoruUnity`): `Models/NesneKanSunak.glb`, `NesneKaraSunak.glb`, `NesneAcgozluluk.glb`, `NesneTabut.glb`, `NesneComlek.glb`; `StageObjects.PropTak` dört sunak türünü de takar ve ışıksız taşı modelin üstüne çıkarır, `PotTak` her çömleğin çizimini kapatıp modeli eski ağın kutusuna oturtur (gümüşte renk bloğu). Simülatörde (`KORU_NESNETEST`) kan sunağı, açgözlülük taşı, kara sunak, çömlek ve gümüş çömlek görüldü, 57 nesneye model takıldı, hata yok; kan sunağının taşı karede seçilemedi (oyuncunun arkasında kalmış olabilir), tabut iOS'ta görülmedi. Açık: tabut yalnız Mezarlık'ta çıkıyor, Koru'da sınama için kurulan bir tanede bakıldı; Mezarlık'ın kabakları eski ağda; sunakların hangi yüzünün oyuncuya baktığı ayarlanmadı.
- **On nesne daha** (13 Kasım 2026): Erdem haritada kalanları sordu, önerilen onunu çizdirip onayladı: **rüzgâr taşı, meydan okuma sunağı, kafes, yumurta, haydut taşı, mezar taşı, mahzen, ruh kristali, kabak, İskelet Kralı heykeli** (`docs/model/nesne-<ad>.jpg`). Tripo'da aynı yoldan onu 500 kredi, **kalan 20** (Tripo'da yeni model için kredi kalmadı). Dosyalar `n_<ad>.glb` 0,27-0,52 MB; kristal 1.550, kabak 2.274 üçgene indirildi (77 ve 106 KB). Kod: sunak türü → model tablosu `TRIPO_SH` (`game/objects.js`; 2, 7, 8, 9, 11, 16, 17 eklendi), taş artık her durumda modelin tepesinin 0,55 üstüne konur (eski ağ uzunsa havada kalıyordu). Toplu çizilenlerin yolu genelleşti: `glbInst(inst, tür)` ve `TOPLU` (çömlek, kristal, kabak; küçük ve büyük kabak aynı model). Mahzen dünya grubundaki ayrı ağın yerine takılır (`world/build.js`; `glbProp`'a eski ağın dönüşü için `ek` parametresi). Boy ayarları: mezar taşı 2,6 (eski ağ alçak kaideydi, model çimde kayboluyordu), kafes ve yumurta 0,8. `tools/nesne2-cek.mjs` sunakları oyuncunun çevresine kurup çeker, sonra Mezarlık'a geçer (mührü açar; `MEZAR=1` yalnız Mezarlık). Denetim: Koru'da 44/46 sunakta model (kalan ikisi modeli olmayan türler), sekiz nesne oyunda; Mezarlık'ta kabak, büyük kabak, mahzen, mezar taşı, heykel, tabut görüldü; hata yok, duman testi geçti. Unity (`KaraKoruUnity`): yedi sunak modeli `StageObjects.TRIPO_SH` tablosuyla, kristal ve kabak `PotTak(go, sv, tür)` ile takılır; simülatörde (`KORU_NESNETEST`) rüzgâr taşı, meydan okuma sunağı, kafes, yumurta ve kristal taşlarıyla birlikte görüldü, 61 nesneye model takıldı, hata yok; haydut taşı, mezar taşı, heykel ve kabak iOS'ta görülmedi (Bozkır ve Mezarlık'ta çıkıyorlar, sınama Koru'da). Codex'teki Tripo eklentisi aynı `tripo` komutunu ve aynı krediyi kullanıyor (ayrı bağlantı değil); kılavuzundan `smart_low_poly` ve `--for anim` öğrenildi. Açık: Unity'de mahzen eski ağda (dünya ayrı dışa aktarılıyor, mahzenler o dosyanın içinde adsız); haritada modeli olmayan sunak türleri: şüpheli çalı, denge taşı, hediye, parlak muz, eski maske, yılan yuvası; kırılabilirlerden cevher ve çalı topu; Bozkır'da haydut taşına yerinde bakılmadı (Koru'da kurulan örnekte bakıldı).
- **Kaya Devi modeli, Tripo Stüdyo'dan** (13 Kasım 2026, `engine/glbboss.js`): ikinci ara boss. Tripo'nun kredisi iki ayrı cüzdan: abonelikten gelen **stüdyo kredisi** (3200; yalnız studio.tripo3d.ai'de geçer) ve komut satırının kullandığı **API kredisi** (kullandıkça öde, 100 kredi 1 dolar; ilk gün gelen 1000 tek seferlik hediyeydi, 20 kaldı). Aktarma yok (geliştirici sayfasında yalnız satın alma var); Meshy'de tek cüzdan olduğu için fark orada görünmüyordu. Çözüm: stüdyo uygulamadaki tarayıcı bölmesinden sürülür (Erdem giriş yapar). Akış: 3D Workspace → Model → çok görünüşlü sekme, ön ve arka çizim (dosya yükleme aracı yok: çizimler yerel sunucudan `Image` + canvas ile alınıp dosya girişine `DataTransfer` ile verilir; `fetch` engelleniyor, resim yolu geçiyor) → Generate (H3.1, 55) → Retopo (üçgen, 20.000, Smart Mesh; 35) → Rig (Humanoid, Mixamo; 20) → Export GLB (iskeletle; dosya `~/Downloads`'a iner). Toplam 110 stüdyo kredisi, kalan 3090. Çıktı 19.334 üçgen, 4K doku (2K'ya indirildi), aynı `mixamorig:` iskeleti; stüdyo çıktısında kök zaten çevrilmiş ve bir düğüm altında (`tools/tripo-ad.mjs` kalçanın ebeveynini döndürecek biçimde genelleşti). Çizim: yığma granit kayalardan dev, göğsünde ve omuzlarında petroglifler (dağ keçisi, güneş, tamga), yosun ve liken, sırtında iple bağlı kırık yazıt taşı (`docs/model/ara-kayadevi-on.jpg`, `-arka.jpg`). Hareketler: boss klipleri Tepegöz'ün iskeletinden (`boss_hareket.glb`), bekleme Alp'inkinden çevrilip tek dosyada birleştirildi (`ara_kayadevi_hareket.glb` 288 KB; `KLIP2`), model `ara_kayadevi.glb` 2,61 MB. Denetim: yürüyüş ve yere vurma kare kare, oyunda geliş, yürüyüş, bekleme, ölüm (model sökülüyor), boy 5,8 birim, duman testi. Unity (`KaraKoruUnity`): `Models/AraKayaDevi.glb`, `AraKayaDeviHareket.glb`; `BossModel.ust` (Tripo modelinin kendi üst gövde maskesi), klipler kendi dosyasından kalça oranı 1 ile; simülatörde (`KORU_BOSSMODEL` başında) gelişte ve yürüyüşte görüldü, hata yok; ölüm karesi boş çıktı (devrilme iOS'ta görülmedi, Karakoncolos'taki gibi). Açık: Kaya Devi hücumcu değil, nişan ve atılma yok; yere vurmada omuz kayaları esniyor (yakından bakılmadı).
- **Kemik Okçu Başı modeli** (13 Kasım 2026, `engine/glbboss.js`): üçüncü ara boss; Kara Koru'nun üç ara boss'u da artık modelli. Kaya Devi'yle aynı stüdyo akışı (110 stüdyo kredisi, kalan 2980; 19.927 üçgen). Çizim: iri iskelet savaşçı, lamel zırh, sol omuzda kurt kafatası, sorguçlu sivri miğfer, yırtık yeşil pelerin, belde sadak, sırtta kompozit yay (`docs/model/ara-okcubasi-on.jpg`, `-arka.jpg`); eller boş yumruk, yay sırtta (boss hareketlerinde elde yay tutuşu yok). `ara_okcubasi.glb` 2,76 MB, `ara_okcubasi_hareket.glb` 288 KB. Denetim: yürüyüş kare kare, oyunda geliş, yürüyüş, ölüm (model sökülüyor), duman testi. Boyu 3,25 birim: oyun bu türe küçük yarıçap veriyor (1,71; Kaya Devi 3,04), oyuncudan biraz uzun. Unity (`KaraKoruUnity`): `Models/AraOkcuBasi.glb`, `AraOkcuBasiHareket.glb`; simülatörde (`KORU_BOSSMODEL` başında, Tripo ara boss'ları sırayla) Okçu Başı ve Kaya Devi gelişte ve yürüyüşte görüldü, hata yok; ölümün ilk yarım saniyesinde ikisi de hâlâ ayakta, devrilmenin sonu iOS'ta görülmedi. Açık: ok atışı için ayrı hareket yok (boss'un savurma klibi oynuyor); oyun karelerinde oyuncunun arkasında kaldı, yakından bakılmadı.
- **Kalan sekiz harita nesnesi, Tripo Stüdyo'dan** (13 Kasım 2026): Erdem "harita nesnelerinden devam, komple" dedi. **Şüpheli çalı, denge taşı, hediye, parlak muz, eski maske, yılan yuvası** (sunak türleri 12, 13, 14, 15, 18, 19) ve toplu çizilen **cevher** ile **çalı topu** (`docs/model/nesne-<ad>.jpg`). Stüdyoda nesne akışı: tek resim → Generate (55) → Retopo üçgen (35; 7.000 / 6.000 / 5.000 / 4.000, toplu çizilenlerde 1.500) → Export GLB; nesne başına 90, sekizi 720 stüdyo kredisi, kalan 2260. Sekiz üretim aynı anda başlatılabiliyor (her biri kendi adresinde: `/workspace/generate/<id>`, sonra `/workspace/retopology/<id>`). Sayfadaki düğmeler koordinatla değil betikle bulunup tıklanıyor (Retopology düğmesi yalnız fiyat 35 ve üçgen kutusu istenen değerdeyken; Export penceresi açılıp ikinci Export). **İndirme Kaydet'e basılmadan alınıyor:** dosya `~/Downloads`'a gizli geçici adla (`.…claudefordesktop.…`) tam iniyor; GLB başlığındaki uzunluk dosya boyutuna eşitse kopyalanıyor (`scratchpad/nes4/al.sh`). Üçgen sayıları hedefe yakın çıktı (7.530, 5.791, 4.685, 4.017, 6.186, 6.778, 1.388, 1.280). Kod: `TRIPO_SH` altı tür, `TOPLU` cevher ve çalı topu; artık bütün sunak türlerinin modeli var (Koru'da 40/40). `tools/nesne2-cek.mjs` `YENI=1`. Denetim: altı sunak ve cevher oyunda, hata yok, duman testi. Unity (`KaraKoruUnity`): `Models/Nesne{Supheli,Denge,Hediye,Muz,Maske,Yilan,Cevher,CaliTopu}.glb`, `TRIPO_SH` ve `PotTak` aynı türlerle genişledi; simülatörde (`KORU_NESNETEST`) parlak muz ve cevher görüldü, 63 nesneye model takıldı, hata yok; şüpheli çalı ve hediye o haritada yoktu (rastlantıya bağlı çıkıyorlar), denge taşı, maske ve yılan yuvası iOS'ta görülmedi. Açık: çalı topu yalnız Bozkır'da, oyunda bakılmadı; eski maske karede bir yapının arkasında kaldı; hediye küçük duruyor; mahzen Unity'de eski ağda (dünya dışa aktarımı yalnız görünen ağları alıyor: `tools/unity-dunya.mjs` Mezarlık için yeniden çalıştırılırsa yeni model büyük olasılıkla kendiliğinden girer, denenmedi).
- **Sekiz ara boss daha, Tripo Stüdyo'dan** (13 Kasım 2026, `engine/glbboss.js`): Erdem "toplu üretime devam" dedi. **Kum Devi** (Bozkır), **Kemik'in Babası** ve **İskelet Kralı** (Mezarlık), **Kara Haydut**, dört tabut bekçisi **Cemil, Mahmut, Tahir, Garip** (`docs/model/ara-<ad>-on.jpg`, `-arka.jpg`; anahtarlar kumdevi, baba, iskeletkrali, haydut, tabut1-4). Sekizi aynı anda üretildi: 8 × 110 = 880 stüdyo kredisi, kalan 1380. Stüdyo betikleri sayfanın `localStorage`'ında saklandı (`__uret`, `__retopo`, `__rig`, `__indir`; sayfa her gezinmede yenilendiği için) ve her adım kendi adresinde çağrıldı (`/workspace/generate|retopology|rigging/<id>`). Sadeleştirmede üçgen sayısı kutusuna betikle yazılan 20.000 uygulanmadı: modeller ~10.000 üçgen çıktı (9.816-10.414; kutu elle yazılırsa tutuyor, Kaya Devi'nde öyle yapılmıştı). Ara boss için yeterli, telefonda daha hafif; öyle bırakıldı. Tarayıcı bölmesi kapanınca Tripo oturumu düştü (Erdem yeniden girdi) ve bölme daralınca üçgen sayısı etiketi gizlendiği için betik bekledi: stüdyo işinde görünüm 1400×900'e alınmalı. Hareketler Kaya Devi'ndeki gibi çevrildi (`ara_<ad>_hareket.glb` ~288 KB, modeller 1,85-2,41 MB). Kod: `TRIPO` listesi `URLS` ve `KLIP2`'yi doldurur; Kara Haydut'un türü olmadığı için `e.bandit → 'haydut'`, `spawn` haydut için de `glbBoss` çağırır. `tools/araboss-cek.mjs` `haydut` türünü tanır. Denetim: sekizi de oyunda geliş, yürüyüş ve ölümde çekildi, model yüklendi ve ölünce söküldü; boylar 3,25-5,78 birim (oyunun türe verdiği yarıçapa göre); duman testi. Unity (`KaraKoruUnity`): `Models/Ara<Ad>.glb` ve `Ara<Ad>Hareket.glb` (sekiz çift); `KoruSetup` Tripo ara boss'unun klip dosyasını model adından türetir; `Enemies.SpawnK` artık ara boss'ta `BossTak` çağırır (eskiden yalnız `SpawnMini`: Baba, İskelet Kralı, bekçiler ve Haydut `SpawnK`'dan doğuyor), haydut için anahtar `haydut`. Simülatörde (`KORU_BOSSMODEL` başında) sekizi de modeliyle yürürken görüldü, hata yok; ölümleri iOS'ta görülmedi. Açık: hareketler yakından kare kare incelenmedi (yalnız oyun kareleri); bekçiler ve Mezarlık boss'ları kendi diyarlarında değil Koru'da doğurularak sınandı; Akrep Ana ve Hayalet Beyi (iki ayaklı değil) ile Çalı'nın boss hâli eski gövdede.
- **Sıradan düşmanlar: Gulyabani denemesi** (13 Kasım 2026, `engine/glbdusman.js`): Erdem "düşmanlara geç" dedi; önce tek tiple deneme. Boss'lardaki yol burada işlemez: düşmanlar yüzlercesi tek çizim çağrısında (`engine/iskin.js`) on dört kemikli gövdeyle çizilir, hareketleri kodla üretilir (`geo/anim.js`), türlerin çoğu aynı gövdenin renk ve aksesuar çeşitlemesidir. Çözüm: yeni ağ oyunun on dört kemiğine aktarılır, gerisi aynı kalır. `tools/dusman-iskelet.mjs` oyunun iskeletlerini döker (e0, e2, e4, e5; `?eski` ile); `tools/dusman-aktar.mjs` Tripo'nun 65 kemikli modelini on dört kemiğe indirir (ağırlıklar toplanır), duruşu oyunun dinlenme duruşuna getirir (kollar aşağı, bacaklar oyundaki açıda, gövde tek eğimle öne; omurga kemiklerini ayrı ayrı eşlemek modeli 70° büküyordu), boyu eşler. Çalışma anında `glbDusman` veriyi `skData` biçiminde kurar (bacak ölçüleri yeni iskeletten yeniden hesaplanır), dokulu malzeme verir; iskelet örneği, toplu çizim, havuz, vuruş flaşı ve durum malzemeleri eski yoldan sürer. Tür renkleri (`tint`) malzeme rengine çevrilir. Gövdeye gömülen aksesuarı olan türler (böcek, hortlak, mumya, iskelet ...) ve son dalga gövdesi şimdilik eski gövdede. Stüdyoda 2.500 üçgen (kutuya elle yazınca tutuyor: 2.459), 110 kredi, kalan 1270; `d_gulyabani.glb` 343 KB (512 doku). İki hata: yön ayak ucundan ölçülünce 15° sapıyordu (kalça ekseninden ölçülüyor); dosyada köşe verisi iç içe durduğu için kemik ağırlıkları ham tampondan kopyalanınca ağ bozuk çizilip ışıma efektiyle bütün ekranı karartıyordu (öğe öğe okunuyor). Denetim (`tools/dusman-cek.mjs`): 80 ve 316 düşmanla kare süresi eskiyle aynı (16,6 ms, 60 karede sabit; üçgen sayısı da aynı düzeyde: 2.459'a karşı 2.424), duman testi. Açık: yalnız web; Unity düşman gövdelerini web'den dışa aktarımla alıyor (`tools/unity-yaratik.mjs`, köşe renkli malzeme): dokulu gövde için dışa aktarım ve malzeme uyarlanmalı. Yakın planda tek düşmana bakılmadı (yalnız kalabalık karesi); gerçek telefonda ölçülmedi; diğer tipler (taş dev, iskelet okçu, karakoncolos, uçanlar) bekliyor, uçanlar on dört kemikli değil.
- **Gezgin tüccar modeli** (12 Kasım 2026): yedinci nesne; çizimi hazırdı, Meshy'de aynı yoldan üretildi (35 kredi, kalan 131, hepsi kalıcı kredi; aylık kredi bitti, 26 Kasım 2026 15:36'da yenilenir). `n_tuccar.glb` 0,86 MB; ayakta duran eski tüccar gövdesinin yerine tekerlekli tezgâh (`PROP.tuccar.boy` 1,45). Tüccarın şapka rengi ve kazanın sıvı rengi kademeyi gösteriyordu, ikisi de modelde gizlendiği için seçkin, destansı ve efsanevi kademede nesnenin üstünde aynı renkte bir taş dönüyor (`mkNPC`, yalnız web). Gölge ve Bahadır'ın tam boy çizimleri ile Bahadır'ın baltası Codex'le çizildi (portrelerden; `scratchpad/kah`), modelleri Erdem'in kararıyla beklemede.
- **Boss hareket denetimi** (12 Kasım 2026): Erdem "kontrolleri gerçekleştir, animasyonlarda ve yürüyüşte özürlülük olmasın" dedi. (1) Altı klip üç boss modelinde kare kare, önden ve arkadan çekildi (`tools/model-poz.mjs`, 18 sayfa): bozulma görülen yürüyüş sayfaları incelendi, uzuv dönmesi ya da yırtılma yok; yürüyüşte kalça ±13° dönüyor (ağır yalpalama, klibin kendi karakteri). (2) Gerçek kusur: yürüyüş klibinin adım hızı 1 boy/sn varsayılmıştı, klipte yerdeki ayak 0,64-0,70 m/sn (≈0,37 boy/sn) gidiyor: boss ilerlerken klip gerekenin yarısı hızda oynuyor, ayaklar kayıyordu. `tools/boss-olc.mjs` (boss uzakta doğar, oyuncuya yürür; yere basan ayağın yatay hızı / boss'un hızı) ile tarandı: 0,22 → 0,78, 0,31 → 0,47, **0,40 → 0,26**, 0,48 → 0,31, 0,74 → 0,54, eski 1 → 0,59. `AN.yuru.hiz` 0,4 (Unity `YURU_HIZ`). Koşu klibinin hızı klipten ölçülen 2,69; hücumda uçuş evresi olduğu için "alçak ayak" ölçümü güvenilmez (1,3 veriyor), ölçümle ayarlanmadı. (3) Gerçek koşu (`tools/boss-dovus.mjs`: oyuncu kapıya götürülür, oyunun kendi `summonBoss`'u çağrılır, 18 sn dövüş, sonra öldürme): model ilk karede hazır (önceden indirme çalışıyor), yürüme ve yere vurma karışımları beklenen gibi, ölünce geçit açılıyor (`GATE.st` 2) ve model sökülüyor, hata yok. (4) Kahramanlar: eski `tools/meshy-oyun.mjs` yürüyüş ölçümü Kemik'te 1,0 veriyordu (bkz. kostüm maddesindeki açık). Aynı sağlam yöntemle yeniden ölçüldü: hız kısma tam tutmuyor, kahraman 4,5 birim/sn ile yürüme-koşu geçiş bölgesinde ölçülüyor (yürüme 0,74, koşu 0,26 ağırlık, yürüme klibi üst sınırda); kayma Alp 0,50, Kemik 0,58, Kam 0,65, ölçüm tekrarlanabilir. Kemik'in değeri büyütülünce kötüleşiyor (0,8 → 0,66, 1,2 → 0,73): bugünkü 0,52 doğru, değişiklik yapılmadı; eski 1,0 ölçüm hatasıydı. Geçiş bölgesindeki ~0,5 kayma iki klibin karışımından geliyor, bilinen sınır.
- **Boss modelleri** (12 Kasım 2026, `engine/glbboss.js`): Erdem "bossları tasarlayalım, modelleyelim, hareketler haşmetli" dedi. Üç boss da aynı eski gövdenin renk değişimiydi. Her biri için iki çizimden Erdem A'ları onayladı (`docs/model/boss-<ad>-on.jpg`, `-arka.jpg`): **Tepegöz** (taş derili, amber tek gözlü dev; kurt postu, kafatası kolyesi), **Erlik** (kömür karası, boğa boynuzlu yeraltı hükümdarı; kara demir zırh, mor pelerin), **Dev Hortlak** (kurgandan kalkmış ölü reis; tunç cenaze maskesi, açık kaburga, kefen sargıları). Üretim kahramanlarla aynı (model 30 + 22.000 üçgene remesh 5 + iskelet 5), üçü 120 kredi; hareketler Meshy kütüphanesinden altı klip, Tepegöz'ün iskeletinde bir kez üretildi (18 kredi) ve üç boss paylaşıyor: ağır yürüyüş (112), yere vurma (127), ağır savurma (128), göğüs döverek kükreme (88), kafa atarak hücum (512), geriye devrilerek ölüm (189); bekleme Alp'in ortak klibi. Kalan kredi 376. Dosyalar: `boss_tepegoz/erlik/hortlak.glb` (2,8-3,1 MB), `boss_hareket.glb` (291 KB); aşamanın boss'u aşama başladıktan 8 sn sonra arkada iner. Kod: oyun boss'u hâlâ eski gövdeyle kurar (çarpışma, ölçek, havuz); model inince eski gövde gizlenir (çoklu çizim yuvası bırakılır), GLB gövdenin altına takılır, gövde havuza dönerken sökülür (`glbBossBirak`, `freeE`). Hareketler oyunun boss durumundan sürülür (`glbBossTick`): yere vurmanın 0,9 sn'lik sayacı klipteki vuruş karesine, savurma boss'un mermi halkası sayacına eşlenir (kol halkadan 0,7 sn önce kalkar, halka çıkarken iner; üst gövdede) (`AN`; anlar klipte el yüksekliği örneklenerek bulundu), hücumda koşu, gelişte 2,6 sn üst gövdede kükreme, ölümde devrilme klibi (`glbBossOl`; eski gövdedeki öne yatırma atlanır), darbede kısa parlama. Boy çarpışma yarıçapına bağlı (`BOSS.boy` 1,9: yarıçap 5 → 9,5 birim, oyuncunun ~3,3 katı; eski gövdenin kutusuna eşlenince 17 birim çıkıyor, baş ekrana sığmıyordu). `tools/boss-cek.mjs` boss'u oyuncunun önüne doğurup dokuz durumda çeker. Denetim: üç boss dokuz durumda, ölümden sonra model sökülüyor, duman testi. Açık: üç kademe aynı modeli kullanıyor (ayırt edici renk ya da boyut yok); ikiz bosslar aynı modelin ikinci kopyası; ara bosslar (Kara Haydut, Kara Kefen) eski gövdede; gerçek telefonda denenmedi. Unity (`KaraKoruUnity`): `BossRig.cs` (iki katmanlı oynatma: gövdede bekleme, yürüme, koşu, yere vurma, ölüm; üst gövdede savurma ve kükreme), `Enemies.BossTak` / `BossBirak` (eski gövdenin çizimi kapatılır, havuzdan yeniden kullanılırken geri açılır), modeller `Models/BossTepegoz/Erlik/Hortlak.glb` ve `BossHareket.glb`, klipler `KoruSetup`'ta boss başına işlenir (kalça yüksekliği her modelin oranına çevrilir; bekleme Alp'in klibinden). Simülatörde (`KORU_BOSSMODEL`: üç boss sırayla kükreme, yürüyüş, yere vurma, savurma, ölüm) üçü de görüldü, hata yok. Meshy iskelet görevleri: Tepegöz 01a1d01e-75d0-7131-afd8-561198e1fbc4, Erlik 01a1d01d-8e3d-768e-9bdb-621516239266, Hortlak 01a1d020-143e-7444-baa5-898d0f930f7e.
- **Yerdeki can ve lahmacun kaybolur; ana menüde titreme; eşya sınırı** (12 Kasım 2026): (1) Erdem: yerdeki lahmacunlar çok birikiyor, bir süre sonra gitmeli. Can kalbi (`$G.G` `hl`) ve lahmacun (`$G.PU` `heal`) yere düştükten 30 sn sonra kaybolur, son 5 sn yanıp söner (`game/update.js` `YER_OMUR`, `YER_SON`; kalbin yanıp sönmesi `loot.js gSync`). Mıknatıs, kalkan gibi güçler kalır. Unity: `Loot` ve `Powerups`. Lahmacunun görünümü de değişti (Erdem "çok kötü görünüyor" dedi): kodla kurulmuş eğik yassı disk dönerken çoğu zaman kenarını ya da altını gösteriyor, kahverengi tabak gibi duruyordu; yerine eşyanın boyalı resmi (`i_lahmacun`) yüzü hep kameraya bakan levha olarak çiziliyor (`objects.js mkPU`, `LAH_BOY` 1,25; hafifçe sallanır). `tools/guc-yakin.mjs` yerdeki bir gücü oyunda yakından çeker. Unity: `Powerups` levha ağı ve `Lahmacun` malzemesi (malzeme `KoruSetup`'ta hazırlanır: çalışma anında `Shader.Find` derlemede boş dönüyor, ilk denemede hata verdi); simülatörde (`KORU_YERTEST`) dört lahmacun, bir kalp ve bir mıknatıs dizildi: lahmacunlar resimli göründü, 30 sn sonra lahmacun ve kalp gitti, mıknatıs kaldı. (2) Ana menüde fareyle satırların üstünde gezerken "Oyna" yanıp sönüyordu: satır aralarındaki boşlukta hiçbir satır gösterilmediği için birincil satır yeniden parlıyordu (ilk açılışta odak Oyna'da olduğu için görünmüyor, Otağ'dan dönünce odak yok, görünüyordu). Kural menünün tamamına bağlandı (`.mnav2:hover`); ölçüm: imleç beş satırın üstünden geçerken renk değişimi 8'den 1'e indi. (3) Eşya sınırı: bizde koşu başına eşya sayısı sınırsız, yalnız `u` işaretli eşyalar bir kez alınır. Megabonk'un ana oyununda genel bir eşya sınırı bulunamadı (sınırı topluluk yamaları ekliyor; ana oyunda yalnız Anvil ve Overpowered Lamp gibi birkaç eşya tek); Erdem'in koşulu "sınırsızsa öyle kalsın" olduğu için dokunulmadı.
- **Ölü Akıncı yeniden üretildi** (12 Kasım 2026): Erdem "boynu özürlü gibi" dedi. Neden: ilk tasarımdaki zincir yakalık miğferle omuz arasında uzun bir boru oluşturuyor, oyunda zürafa boynu gibi duruyordu. Yeni çizim (`docs/model/kemik-akinci-on.jpg`, `-arka.jpg`): yakalık yok, alçak tunç-demir miğfer doğrudan kafatasına oturuyor, çıplak kafatası ve kısa boyun omurları açıkta. Meshy'de aynı yoldan yeniden üretildi (40 kredi, kalan 514; iskelet görevi 01a1cfcb-dd4b-7022-b881-efc81ef51573), `kemik_akinci.glb` 2,39 MB. Alev miğferin ucunda kaldı, miğfer alçaldığı için tabanı indirildi (`ALEVK.akinci.taban` 0,1 → 0,035; Unity `kTaban`). Denetim: düz ışıkta dört açı, oyunda sekiz duruş yakından, gerçek oyun (hata yok).
- **Güç ve görev simgeleri** (12 Kasım 2026, `ui/menus.js` `gorevIkon`, `tools/ikon-tarif.mjs` `M` ve `Q`): silah, tom ve eşya simgeleri Codex'le boyanmıştı; Otağ'ın güç satırları ve görevler hâlâ kodla çizilmiş çizgi simgeydi (Erdem sordu, üretilmesini istedi). Aynı hattan 41 simge: 17 kalıcı güç (`m_<anahtar>`) ve 24 görev türü (`q_<tür>`: öldürme, boss, zafer, koşu, ruh, sandık, seviye, sunak, tüccar, kazan, altın, gümüş, efsane, dalga, kös, pot, vuruş, ölüm, meydan okuma, görev, şapka, kostüm, kilit, kapı); altı sayfa ilk üretimde saydam geldi, toplam 496 KB. Görev satırı açtığı şeyin resmini gösterir (silah, tom, eşya, kahraman portresi), açtığı bir şey yoksa anahtarından türünü bulur (`QTUR`); başarım satırları da aynı kuraldan simge aldı (önceden simgesizdi), tamamlananda köşede onay rozeti. 316 görev ve 265 başarımın hepsi var olan bir resme düşüyor (ölçüldü, eski çizime düşen yok). `node tools/ikon-tarif.mjs guc` yalnız bu sayfaların tarifini yazar. Unity'de aynı 41 PNG (`UI/Ikon`), `HudMenus.GorevIkon`; simülatörde Otağ'ın güç ve görev sayfalarında görüldü. Açık: şapka görevleri tek şapka resmini paylaşıyor (28 şapkanın ayrı resmi yok); gerçek telefonda denenmedi.
- **Kurultay'ın yeni görünümü** (12 Kasım 2026, `src/yonetim/`): Erdem "çok sade kaldı; animasyonlu, daha detaylı, daha net ve canlı, premium renkler" dedi. Düz kahverengi-altın zemin gitti: mora çalan gece zemini (gökte yavaş gezinen ışık, yıldız tozu), altı mücevher rengi (altın, turkuaz, lapis, erguvan, kor, yosun). Her bölümün kendi rengi var (`[data-s]` → `--v`): gezinme düğmesi, başlık çizgisi, seçili sekme, kaydırıcı ve odak o renkle yanar. Oyunun dili korundu (2 px siyah kenar, sert alt gölge, Alfa Slab One). Eklenen ayrıntı: gezinmede ikonlar, nabız kutularında ikon ve 14 günlük eğilim çizgisi (`grafik.js` `kivilcim`), günlük grafik başlıklarında "önceki 7 güne göre" yüzde, tablolarda kahraman portreleri (oyunun ikonları), geçişli ve tepesi parlak çubuklar, altı dolgulu çizgi. Hareket: bölüm açılınca tek sıralı giriş (`.gir`; yalnız bölüm ya da verisi değişince, her yeniden çizimde değil), sayılar sayarak gelir (`sayac`), çubuklar büyür, çizgi çizilir; düğmede ışık süpürmesi, çekmece ve pencere girişleri; hareket azaltma açıksa hepsi kapalı. İşlev değişmedi (aynı işlevler, aynı uçlar). Denetim: `tools/panel-cek.mjs` yerel taklit sunucuda yönetici girişiyle yedi bölümü 1440×900 ve 390×844'te çeker (yatay taşma 0, hata yok). Açık: canlıda denenmedi (yayınlanmadı); kalp atımı çizgisi denendi, yazının üstünden geçtiği için çıkarıldı.
- **Kaydırma yok, her şey sayfalı** (12 Kasım 2026, `ui/sayfa.js`): Erdem'in isteği: oyunda kaydırma çubuğu görünmesin, uzun içerik sayfa geçişli olsun. Katman (`#ov`) artık kaymaz. (1) Sayfalama: `data-sy="anahtar"` taşıyan kabın içindekiler kabın yüksekliğine sığan sayfalara dağıtılır (satır satır ölçülür; sayfaya sığmayan ızgara ya da liste kendi satırlarına bölünür; başlık sayfa sonunda kalmaz, ipucu denetiminden ayrılmaz), altta `‹ 2 / 7 ›`; geçiş düğmeyle, fare tekerleğiyle, PageUp/PageDown ve Q/E ile, dokunmatikte yana kaydırmayla, kumandada LB/RB ile. Sayfalı panel (`.syh`) ekranı kaplar. (2) Sığdırma: panel ekrandan uzunsa `zoom` ile küçülür (en çok yarıya); masaüstünde hiçbir ekranda devreye girmiyor, yatay telefonda 0,61-0,82. İçerik sonradan büyürse (`ResizeObserver`) yeniden ölçülür. Sayfalanan yerler: Otağ'ın bütün sekmeleri (Görevler üç alt sekme oldu: Süren, Tamamlanan, Başarımlar; açılır `<details>` listeleri kalktı; geniş ekranda iki sütun), Ayarlar sekmeleri, duraklatmanın sağ sütunu, sıralamanın iki listesi (alçak ya da dar ekranda kürsü gizlenir, ilk üç listeye girer; dar ekranda yerel rekorlar gizlenir), koşu sonu ayrıntıları. Meydan okuma seçimi harita sayfasındaki açılır listeden ayrı sayfalı ekrana taşındı (`menuPg` `meydan`; Esc ve B haritaya döner). Denetim: `tools/tasma-olc.mjs` 21 ekranı dört boyutta (1280×720, 1920×1080, 844×390, 390×844) dolu kayıtla açar; kaydırma isteyen ya da ekran dışına taşan öğe varsa raporlar: 84 birleşimin hepsi temiz. Duman testi: kumanda kontrolü yeni meydan okuma sayfasına ve RB/LB'ye göre güncellendi. Açık: görev listesi 1280×720'de 21 sayfa (satırlar yüksek); yatay telefonda sayfa başına 2-4 satır; hesap, eşya ve sunak pencereleri ayrıca ölçülmedi (kısa oldukları için yalnız sığdırmaya güveniyor); gerçek telefonda denenmedi.
- **Kemik'in boyu** (12 Kasım 2026, `engine/glbhero.js` `KAHRAMAN.kemik.boy`): Erdem "boyu neden ufak" dedi. Ölçüm: baş ekleminin yerden yüksekliği Alp 2,14, Kam 2,16, Kemik 1,73 (%80). Neden: yeni model eski gövdenin kutusuna eşleniyor; Kemik'in eski gövdesi kısaydı ve kahraman 0,95 ölçekli, ölçek modele ikinci kez de uygulanıyor. Çarpan 1,2 (baş eklemi 2,08; dört kostüm aynı kaydı kullanır). Unity'de `KoruSetup` `KemikBoy`. Kaynakta 0,95 ölçeğin iki kez uygulanması düzeltilmedi, çarpanla kapatıldı.
- **Kemik'in ayrı modelli kostümleri** (12 Kasım 2026, `engine/glbhero.js`, `game/heroes.js`): Erdem'in isteğiyle Kemik'e dört alternatif görünüm; bugüne kadarki kostümler aynı dokunun renk değişimiydi, bunlar ayrı model. Codex'le dört çizim (`docs/model/kemik-<ad>-on.jpg`, `-arka.jpg`; Kemik'in çizimi oran ve duruş örneği verilerek), Erdem dördünü de istedi: **Ayaz** (buz mavisi kemik, kurt kürkü başlık), **Erlik Elçisi** (altın işlemeli kara kemik, mor kaftan, boynuzlu başlık), **Ölü Akıncı** (levha zırh, sivri miğfer, zincir yakalık, yeşil pelerin), **Kam İskelet** (geyik boynuzlu başlık, tüy pelerin, çıngıraklar). Üretim Kemik'le aynı (model 30 + remesh 5 + iskelet 5), dördü 160 kredi, kalan 554. Dosyalar `kemik_ayaz/erlik/akinci/saman.glb` (2,4-2,7 MB), yalnız kostüm seçilince iner (`URLS.kemik.kostum`, `mAd`); iskelet, klipler, kor ışığı ve alev Kemik'in kodu. Meshy iskeleti boyu 1,8 m'ye eşitlediği için ölçek ve eklem yükseklikleri beş modelde aynı çıktı (ölçüldü), ayrı boy eşlemesi gerekmedi. Alev ve kor rengi kostüme göre (`ALEVR`: mavi, mor, yeşil, turkuaz); Akıncı'da miğfer halkayı içine aldığı için alev miğferin ucundan çıkar (`ALEVK`). `SKINS`'te `only: 'kemik'`; aynı gün Erdem "herkese aç" dedi: dördü de koşulsuz ve ücretsiz (`free: 1`, `skinOwn`; Unity `Kostum.Skin.free`, `OwnSkin`); ilk sürümdeki öldürme ve rütbe koşulları ile 6 gümüş kalktı. Kemik'in kendisi hâlâ kilitli kahraman. Kostüm satırı on düğmeyle iki satıra çıkıyor: etiket düğmelerin yanında kalır (ayrı satıra düşüp alttaki düğmeleri 720 pikselde ekran dışına itiyordu). Denetim: on bir duruş dört yönden (`SKIN=ayaz HERO=kemik tools/meshy-el.mjs`), gerçek oyun (`SKIN=… KI=8 tools/meshy-oyun.mjs`, hata yok; koşuda kayma 0,35), seçim ekranı, duman testi (kostüm sayısı 11). Unity'de (`KaraKoruUnity`): modeller `Models/KemikAyaz/Erlik/Akinci/Saman.glb`, `KoruGame.meshy` içinde `kemik:<kostüm>` kaydı (ölçüler ve klipler Kemik'inki), `MakeRig` seçili kostümün modelini kurar, renkler ve Akıncı'nın alev yeri `AlpRig.KemikRenk`; kostüm düğmeleri 7'den çoksa iki satıra bölünür (tek satırda panelden taşıyordu). Simülatörde (`KORU_KEMIKSKIN`: dört kostüm sırayla seçim ekranı ve kendi kendine koşu) dördü de görüldü, hata yok; duruşlar yakından incelenmedi. Açık: yürüme kayma oranı bu ölçümde varsayılan Kemik dahil 0,9 çıkıyor (önceki notta 0,11; hangisinin doğru olduğu incelenmedi); kahraman portresi kostümle değişmiyor; gerçek telefonda denenmedi. Meshy iskelet görevleri: ayaz 01a1cf15-ae16-74a3-ac30-f21c65eda333, erlik 01a1cf15-256f-754c-8e41-a88617a299b0, akıncı 01a1cf16-b669-7305-ab63-9eae514d3502, şaman 01a1cf16-a431-7370-a349-b0162b14adc9.
- **Kam ve Kemik Unity'de** (12 Kasım 2026, `KaraKoruUnity`): iOS'ta Kam ve Kemik artık web'deki Meshy modelleri (eski kodla kurulmuş gövdeler yalnız diğer kahramanlarda). `AlpRig` üç kahramanı taşır (`kind`): Kam'da asa (`AttachStaff`, `KA` tablosu, `SolKol`, uçta ışıma), Kemik'te kor ışığı ve baş alevi (`AttachKemik`, `Efekt`; alev dilleri `Vfx.FlameNow`), kendi klipleri ve ayak hızları `KoruGame.MeshyKind` ile gelir (`KoruSetup` doldurur; ölçek ve h0 web'de ölçülen değerler). Model dosyaları Alp'inkiyle aynı yoldan: iskeletli ham GLB → doku 2048 PNG, metalik ve normal doku atılır, dinlenme klibi KALIR (klipsiz dosyada glTFast kök düğümü farklı kurar: model 100 kat büyük ölçülür, klip yolları tutmaz). Şapka başın uç eklemine oturur. Simülatörde (`KORU_MESHYTEST`: üç kahraman sırayla seçim ekranı ve kendi kendine koşu) seçim ekranında ve koşuda görüldü, hata yok; duruşlar tek tek yakından incelenmedi, kostümler Unity'de bu iki modelde denenmedi, gerçek telefonda denenmedi. Web'de ayrıca: şapka boy ölçüsüne girmiyor (uzun şapkada Kemik %8 büyüyordu).
- **Kemik'in eksikleri** (12 Kasım 2026, `engine/glbhero.js`): (1) Baş alevi: başlığın çevresinde 18 alev dili (`ALEV`, `alevTick`; damla biçimli doku kodla çizilir, turuncu gövde düz karışım, sarı öz toplamalı; diller sırayla doğar, dünya yukarısına yükselip içe kapanır; kostümde rengi kostüme uyar). (2) Kor ışığı göğüs kafesinin ortasına taşındı: Meshy iskeletinde omurga aşağıdan yukarı Spine02, Spine01, Spine; ışık yanlışlıkla en alttaki ekleme (bele) konmuştu. (3) Kendi saldırıları: Meshy kütüphanesinden omuz üstünden fırlatma (393) ve yukarıdan aşağı savurma (389), 6 kredi, kalan 714; `kemik_at.glb` 136 KB (`Firlat`, `Vur`; aralıklar `KAHRAMAN.kemik.sal`). Oyundaki duruş doğal bekleme (kılıç-kalkan gardı boş elle yumruk dövüşü gibi duruyordu). (4) Şapka başın uç eklemine oturur (`sapkaUc`; başlığın köşe ortalaması yana kayıyor, şapka havada duruyordu). Yedi kostüm ve altı şapka seçim ekranında denendi. (5) Portreler: `h_kemik.webp` ve `h_alp.webp` yeni tasarımlardan Codex'le yeniden çizildi (tarz örneği Kam portresi, karakter örneği `docs/model/*-on.jpg`; `tools/ikon-kes.mjs` ile 128 px). Denetim: on bir duruş dört yönden, gerçek oyun (`KI=8`: koşuda kayma 0,35, yürümede 0,11), duman testi, tip denetimi.
- **Kemik modeli** (12 Kasım 2026, `engine/glbhero.js`): Kemik artık Meshy ile üretilmiş iskeletli model (Alp ve Kam'dan sonra üçüncü). Tasarım: Erdem'in isteği pelerinli, kemik kemik, Ghost Rider havasında bir iskelet; Codex'le üç seçenek çizildi (kurgan savaşçısı, cehennem süvarisi, hayalet koşucu), Erdem "kıyafetleri azalt" dedi, az kıyafetli üç çizimden A'yı seçti: fildişi iskeletin tamamı açıkta, altın işlemeli kızıl başlık ve omuzları örten kısa yırtık pelerin, tunç tokalı kemer, dar peştamal, çıplak kemik ayaklar (`docs/model/kemik-on.jpg`, `kemik-arka.jpg`). Üretim Kam'ınkiyle aynı: çoklu resimden model (30 kredi) → 18.000 üçgene remesh (5) → iskelet (5); toplam 40, kalan 720. İnce kemikler (kaburga araları, ön koldaki çift kemik, omurlar) ilk üretimde temiz çıktı. `kemik.glb` 2,32 MB (18.714 üçgen, renk 2048, normal 1024); açılışta inmez, son seçilen kahraman Kemik ise ya da kahraman sayfası açılınca iner. Elinde bir şey yok (kemik fırlatır); hareketlerin hepsi ortak klipler (savaş duruşu ve savuruşlar Alp'inki). Göğüs kafesinde ve yüzde kor ışığı kodla eklenir (`takKemik`, toplamalı ışıma; kaburgaların arkasında kaldığı için zayıf görünüyor). Ayak hızı `KAHRAMAN.kemik.ayak` (yürüme 0,52). Denetim: on duruş dört yönden, gerçek oyunda (`KI=8 tools/meshy-oyun.mjs`; araç kilitli kahramanın kilidini sınamada açar, yoksa oyun Alp'le açılıyordu) hata yok. Açık: gerçek telefonda denenmedi (diğer açıklar aynı gün kapandı, üstteki iki madde). Meshy görevleri: model 01a1cceb-99fb-7144-aefd-58e42758b648.
- **Eldekiler gövdeye girmiyor** (11 Kasım 2026, `engine/glbhero.js`): kılıç, kalkan ve asa birçok duruşta gövdenin içinden geçiyordu (Erdem: "düzgün durmuyor, karakterin içinden geçiyorlar"). Ölçüm aracı: `tools/giris-olc.mjs` (`HERO=kam`, `AYR=1`) her duruşun birkaç anında gövdenin derili ağını düz ağa çevirir, eldeki nesnelerin köşelerinden ışın atıp içeride kalanları sayar. Önce: Alp'te kalkan yürürken köşelerinin %27'siyle bacağa ve gövdeye, beklerken %10'uyla giriyordu, kılıç yürürken ve beklerken bacaklardan geçiyordu; Kam'da asa beklerken boynuzlara, atılırken ve kayarken gövdeye giriyordu. Nedenler ve çözüm: (1) klipler eldekini bilmez, el nasıl dönerse nesne öyle döner: Alp'in sağ kolu da artık Kam'ınki gibi klipten sonra iki kemikli ters kinematikle kurulur (`sagKol`, `kilicHedef`, tutuş tablosu `KT`; saldırıda kol klibe bırakılır). İlk sürümde tablo tutma noktası veriyordu: kol dümdüz uzanıyor, ağız ön kolun devamı gibi duruyor, yumruk bilekten kırık görünüyordu (Erdem: "bilek yamuk, aşağı bakıyor"; ön kol ile ağız arası ölçüldü: 14°-35°, doğalı 90° dolayı). Şimdi tablo kolun kendisini verir (üst kol, ön kol ve ağız yönleri: dirsek bükük ve gövdenin yanında) ve ağız ön kolla 62°-112° arasında tutulur (`BILEK`): beklerken ve yürürken kol sarkık, ağız ileri; savaşta ön kol ileri, ağız ileri-yukarı; koşuda ağız yukarı; havada baş üstünde; (2) kalkan ön kolun ekseni çevresinde her karede döndürülür, yüzü gövdenin ekseninden dışarı bakar (`kalkanTut`, `KALKAN`): savaş duruşunda tepsi gibi yatıp göğse girmez; (3) nesnenin yeri kahramanın sabit yönüne değil gövdenin o anki yönüne göre verilir (`cerceve`: yatayda omuz ve kalça çizgilerinin toplamı; atılma, kayma ve taklada gövdenin üç boyutlu çerçevesi): bekleme klibinde gövde yana dönünce asa gövdeye yapışıyordu; (4) kol çözümü iki geçişli: elin dönüşü gerçek ön kol yönüne göre kurulur, bilek ters dönmez; (5) Kam'ın asası dışa hafif yatık (boynuzlardan uzak), atılırken mızrak gibi ileri, kayarken ileri ve yukarı. Kam'ın kolu da 12 Kasım'da Alp'inki gibi kol yönleriyle kuruldu (`KA`, `kolHedef`): tutma noktası verilirken kol dirseği bükülmeden dümdüz yana uzanıyor, yumruk asaya dik açıyla oturuyordu (Erdem: "eli sakat gibi, dik açı olmuş"); şimdi üst kol gövdenin yanında, dirsek bükük, ön kol ileride, bilek 62°-118° arasında. Sonra: Alp'te kılıç her duruşta %0, kalkan en çok %0,4 (bir iki köşe dirseğe değiyor); Kam'da yalnız büyü hareketinin ilk anında dört köşe bacağa değiyor (kolu klip sürer). Kalkan ayarı test derlemesinde adresle denenir (`?kalkanon=.09`); kol duruşları tablolardan (`KT`, `KA`). Unity'de Alp'in karşılığı `AlpRig` (Kam'ın yeni modeli Unity'de yok).
- **Alp'in yeni modeli** (11 Kasım 2026, `engine/glbhero.js`): Alp, Kam'ın yöntemiyle yeniden üretildi (ilk Alp tek çizimden, 10.000 üçgen ve 1024 dokuyla yapılmıştı; Kam'ın yanında zayıf kalıyordu). Tasarım: dört çizimden Erdem'in seçtiği D, maskeli şampiyon: bıyıklı çelik yüz maskesi (Kıpçak savaş maskesi), zincir yakalık, koyu çelik ve altın levha zırh, göğüste çift başlı kartal, omuzlarda kızıl püsküller, kızıl kuşak ve şalvar, altın kakmalı kolçak ve dizlikler (`docs/model/alp-on.jpg`, `alp-arka.jpg`; Codex, Kam'ın çizimi tarz örneği verilerek). Üretim: Meshy çoklu resimden model (30 kredi) → 18.000 üçgene remesh (5) → iskelet (5); toplam 40, kalan 760. Sıkıştırma Kam'la aynı (`tools/model-sik.mjs model` + gltf-transform: renk 2048, normal 1024, WebP): `alp.glb` 2,75 MB (17.742 üçgen; eskisi 0,93 MB, açılışta indiği için ilk yükleme 1,8 MB büyüdü). Kemik adları ortak olduğu için dosya eskisinin yerine geçti: hareketler, kılıç, kalkan, kostümler ve şapka aynı kodla çalışıyor. Meshy kızıl sorgucu modele çıkarmadı (ince kıl): kodla kurulur (`sorguc`: ortada kalın bir tutam, çevresinde beş ince tel, köşe renkli boru; miğferin ucuna, baş kemiğine bağlı), koşuda ve düşerken rüzgârla kalkar, dururken salınır (`glbTick`); şapka takılıysa konmaz, kostümde rengi kostüme uyar. Yürüme ayak hızı yeni bacak oranına göre tarandı (`KAHRAMAN.alp.ayak.walk` 0,7 → 0,5: yürümede kayma oranı 0,88'den 0,44'e; koşu 3,7'de kaldı, 0,34; tarama `AYAK=y,k OLC=1 tools/meshy-oyun.mjs`). Denetim: on duruş dört yönden (`tools/meshy-el.mjs`), gerçek oyun kareleri ve telefon ekranı (`tools/meshy-oyun.mjs`), yedi kostüm ve bir şapka. Unity'de aynı model (`Models/AlpModel.glb`), sorguç `AlpRig.Sorguc`; simülatörde menüde ve oyunda görüldü. Açık: kahraman sayfasındaki portre (`h_alp.webp`) eski tasarımı gösteriyor; gerçek telefonda denenmedi. Meshy görevleri: model 01a1cba7-1cd6-758e-a68f-ada636934b52, remesh 01a1cbaa-8b05-720e-83fb-133959aa91e4, iskelet 01a1cbae-44aa-73fb-ad43-6fd6d6e94311.
- **Tecrübe kristali küçüldü** (11 Kasım 2026, `game/loot.js` `SPEC.xp`): yerdeki kristal dörtte bir küçük (ölçek 1 → 0,75), hâlesi de (1,5 → 1,15); kalabalıkta ekranı kaplıyordu. Altın, gümüş ve kalp aynı. Unity'de `Loot.cs` (0,55 → 0,41).
- **Güçlerin kendi şekilleri** (11 Kasım 2026, `game/objects.js` `GUCAG`): yerdeki altı güç de renkli çokyüzlü yerine kendi ağıyla çizilir: Mor Yıldırım şimşek, Altın üst üste altınlar ve dik duran damgalı altın, Kalkan kubbeli yuvarlak kalkan (tunç kuşak, kızıl orta, çelik göbek), Saat kum saati, Mıknatıs at nalı (kırmızı gövde, gümüş uçlar), Tengri Ateşi üç dilli alev. Her biri tek ağ, köşe renkli, ilk istendiğinde kurulur; ışıksız çizilir (gece ve gölgede okunsun), biçimi köşe rengine işlenen sabit üst ışık verir (`golgele`). Lahmacun aynı tabloda (`heal`), yiyecek olduğu için ışıklı malzemeyle. Unity'de aynı ölçülerle `Powerups.cs` `GucAgi`. Yeni güç eklenirse `GUCAG` ve `GucAgi`'ye şekli de eklenir.
- **Kam modeli** (11 Kasım 2026, `engine/glbhero.js`): Kam artık Meshy ile üretilmiş iskeletli model (Alp'ten sonra ikinci). Üretim: Codex ile ön ve arka görünüm çizimi (`docs/model/kam-on.jpg`, `kam-arka.jpg`; tıknaz oran, diz üstü yırtmaçlı kaftan, sağ el asa için delikli yumruk) → Meshy çoklu resimden model (30 kredi) → 18.000 üçgene remesh (5) → iskelet (5); asa ayrı çizim (`kam-asa.jpg`) → model (30) → 4.000 üçgene remesh (5); altı büyü klibi (18, üçü kullanılıyor). Toplam 93 kredi, kalan 800. Sıkıştırma `tools/model-sik.mjs` (metalik doku ve tanjant atılır; klip dosyasında yalnız iskelet ve seçilen klipler, aralık kesilebilir) + gltf-transform (resize, webp, prune, quantize): model 2,63 MB (18.485 üçgen, renk 2048, normal 1024), asa 583 KB, klipler 126 KB (iki büyü + koşu; `model-sik.mjs kat` klip dosyalarını birleştirir). Dosyalar açılışta inmez, Kam seçilince iner (o sırada eski gövde görünür). Kod: ortak klipler (yürüme, koşu, zıplama, kayma, atılma, takla, darbe) Alp'in dosyalarından bütün kahramanlarda oynar (Meshy iskeletlerinde kemik adları ortak; Kam'da denendi), kahramana özel olanlar `URLS` ve `KAHRAMAN` tablosunda. Kam'ın duruşu (aynı gün yeniden yapıldı; ilk sürümde büyücü duruş klibi sol avucu açık öne uzatıyordu, asa elde eğreti duruyordu, koşuda gövde 50° öne yatıyordu): bekleme ortak doğal bekleme klibi, koşu Kam'ın kendi dik koşu klibi (`Kos`, gövde 10°; ayak hızı `KAHRAMAN.kam.ayak`), asa yumruğun delik ekseninden geçer (`ASA`), ucunda ışıma. Kollar her karede klipten sonra kodla kurulur (`asaTut`): sağ kol iki kemikli ters kinematikle asayı kavrar (beklerken ve yürürken sağ önde, yere basılı ve dik; koşuda, havada, atılmada kalkık ve öne eğik; kayarken geriye yatık; yalnız büyü kliplerinde bırakılır), sol kol beklerken ve büyüde yanda sarkar, avuç bacağa bakar (modelde parmak kemiği yok, açık avuç öne uzanınca dilenir gibi duruyordu). Saldırı sırayla asayı göğe kaldırma ve ileri itme. Boy eski gövdenin baş eklemine göre eşlenir (eski gövdede asa kutuyu büyütüyordu). Denetim: `tools/model-poz.mjs` (klip anlarında yakından, önden ve arkadan), `tools/goruntu-diz.mjs` (karşılaştırma sayfası). Dosyalar açılışta son seçilen kahraman Kam ise, değilse kahraman sayfası açılınca iner (`glbHazirla`); inmişse eski gövde hiç görünmez. Bütün durumlar dört yönden (`HERO=kam GPU=1 tools/meshy-el.mjs`, `OLCEK=2` yakın inceleme) ve gerçek oyunda (`KI=1 GPU=1 tools/meshy-oyun.mjs`: koşuda ayak kayması 0,21), yedi kostümden üçü ve iki şapka, telefon ekranı denetlendi. Açık: iOS (Unity) tarafı eski Kam'da; kayma duruşunda kaftanın önü bacak arasında geriliyor; gerçek telefonda denenmedi. Meshy görevleri: model 01a1ca40-31b4-7607-b29c-95eed122d536, remesh 01a1ca43-23ae-763f-8d69-7c61c595c154, iskelet 01a1ca46-f04d-7117-b30e-02b5f58f7bb1, büyü klipleri 01a1ca55-42bc-77d6-a87e-fb2880a20108, asa 01a1ca54-cc53-7159-b33b-b92dd7e337eb, asa remesh 01a1ca55-c430-77d0-9a46-f6d78305e0ce.
- **Donuk ekranlar** (11 Kasım 2026, `core/loop.js` `DONUK`): tam ekran kaplamalar (Otağ, sıralama, yardım, duraklatma, kartlar, tüccar) açıkken sahne hiç çizilmez, son kare ekranda kalır; ana menü oyunla aynı karede (eskiden 30), ayarlar canlı. Eskiden kaplamaların arkasında sahne saniyede 20 kare çiziliyordu: arkada takılan bir dünya görünüyor ve ekran kartı menüyle paylaşılıyordu. Ölçüm (başsız Chromium, gerçek ekran kartı): tarayıcı her durumda 60 kare; donuk ekranda sahne çizimi 0, dönüşte sorunsuz. Bir karenin yeniden çizilmesi gerekirse `$G.CIZ` (durum değişimi ve tuval boyutu kendiliğinden kurar). iOS karşılığı: `HudMenus.Dondur` (ekran kopyası).
- **Kurultay: yönetim paneli ve canlı işletim** (11 Kasım 2026): uzaktan denge ayarı (18 sabit, yayın gerektirmez), etkinlik ve duyurular (menüde şerit; süreli tecrübe, altın, gümüş çarpanı), koşu kaydı (her koşunun özeti: kahraman, seviye, süre, ölüm nedeni, silahlar), moderasyon (yasak, sıralamadan gizleme, skor silme; reddedilen skorlar listesi), sezon kapatma, bakım modu, işlem günlüğü. Yetki veritabanında denetlenir, panelde gizli anahtar yok. Kurulum, mimari ve yerel sınama: `docs/LIVEOPS.md`. SQL gerçek Postgres'te sınanır (`tests/liveops-sql.mjs`, 60 denetim).
- **Seviye dengesi** (11 Kasım 2026, `game/stats.js` `SVD`): sıralamada 34 dakikada seviye 598'e (her silah 40, her tom 99) çıkıldı; hile değil, denge açığı. Bot ölçümü (`tests/denge.mjs`, ölümsüz kip, Kademe 1, Alp / Kam / Kemik × 3 tohum, aşama başına 9 dakika güçlenme): eski dengede seviye 61 / 130 / 250 (9. / 18. / 27. dakika); tecrübe tomlarını önceleyen botta (`ONCE=xp,curse`) 330'a kadar. Asıl kaynak Mavi İskelet: kaç seviye olunursa olunsun tam bir seviye bırakıyordu (kristal değeri Lanet'in tecrübe payına bölünmediği için lanetli build'de birkaç seviye) ve geç aşamada birkaç saniyede bir doğuyor; yalnız bu ödül sınırlanınca bot 250'den 120'ye indi. İkinci kaynak Bilgelik ve Lanet tomları: tecrübe çarpanı büyürken seviye gereği yalnız karesel büyüyordu (ödül sınırıyla bile tecrübe build'i 165-177). Yapılan: (1) seviye gereği 60. seviyeden sonra her seviyede 1.03 katına çıkar (60'a kadar aynı; gerek 80. seviyede 7 bin, 100'de 19,6 bin, 150'de 188 bin); (2) Mavi İskelet ve gümüş iskelet en çok 60. seviyenin gereği kadar (2280) tecrübe verir, kristal değeri bütün tecrübe çarpanlarına bölünür. Sonuç: hızlı oyun (boss 300 / 120 / 120 sn'de) değişmedi, seviye 21 / 37 / 49 (eski 23 / 38 / 51); uzun oyunda 56 / 92 / 109; tecrübe build'inde 67 / 101 / 120 (en çok 125). Tecrübe tomları artık 10-15 seviye kazandırıyor, oyunu kırmıyor. Boss canına dokunulmadı: uzun oyunda bosslar hâlâ build'e göre 5-400 sn'de düşüyor, ama fark seviyeden değil sandık eşyalarından geliyor (bot 27 dakikada 85-90 sandık açıyor; seviye 96 ile 245'te boss'a hasar aynı, 30-40 bin/sn), düz bir can çarpanı zayıf build'i cezalandırır; ayrı karar. Unity: `Build.cs` `Need` / `SvOdul`, `EnemyRun.cs`; taşırken iOS'ta Lanet'in altın ve tecrübe payının (`bonus`) hiç uygulanmadığı görüldü, eklendi.
- **Teknik borç** (`MIMARI.md`): `$G` bölme ve `window` köprüsünü kaldırma (köprü ve komut konsolu 10 Kasım 2026'dan beri yalnız geliştirme sunucusunda ve test derlemesinde var, `npm run build:test`; yayın derlemesinde ikisi de yok: konsoldan hile ve sahte skor yazıldığı için çıkarıldı), tip denetiminde `strict`'e geçiş.
- **Yayında (7 Kasım 2026), giriş zorunlu.** https://kara-koru.netlify.app (Netlify, `kara-koru` deposundan her `main` gönderiminde derlenir). Ortak sıralama Supabase'de (`kara-koru` projesi, Stockholm); şema kuruldu, canlıda sınandı: okuma açık, doğrudan yazma ve sırlar tablosu kapalı, yanlış sır ve 15 sn sınırı reddediliyor, düşük skor yüksekini ezmiyor, sitede gönderim, sıralama ve ad değişikliği çalışıyor. Deneme kayıtları silindi. Anahtar Supabase'in yeni `sb_publishable_` türü (eski `anon` anahtarları 2027 başında kalkıyor).

### Başlangıç tablosu (proje başında)

| Sistem | Kara Koru bugün | Megabonk | Açık |
| --- | --- | --- | --- |
| Karakter | 7 | 21 | 14 |
| Karakter rütbesi (1-100) ve pasif ölçekleme | yok | var | sistem |
| Kostüm (skin) | yok | karakter başına 2-4, altın skin rütbe 100 | sistem + ~60 kostüm |
| Şapka | yok | 21 | sistem + 21 |
| Silah | 12 | 30 | 18 |
| Silah seviyesi | sınırsız, sabit artış | azami 40, her seviyede 1-2 rastgele stat satırı x nadirlik çarpanı | sistem |
| Silah slotu | 4 sabit | 2, dükkândan 4'e | sistem |
| Tom | 15 | 23 | 8 |
| Tom slotu | 4 sabit | 2, dükkândan 4'e | sistem |
| Tom seviyesi | sınırsız | azami 99, nadirlik çarpanı | sistem |
| Eşya | 19 (4 nadirlik, 1 tanesi boş) | 86 (Sıradan, Nadir, Destansı, Efsanevi + Lanetli) | 67 |
| Eşya kancaları (vuruşta, öldürünce, hasar alınca, zamanla) | yalnızca sabit stat | 40+ tetikli eşya | sistem |
| Oyuncu statı | 22 | 57 | 35 |
| Element ve durum (yanma, donma, zehir, kan izi, lanet, sersemletme, büyüleme) | yalnızca yavaşlatma | 7 durum, 4 element | sistem |
| Kalkan, aşırı can, diken | yok | var | sistem |
| Seviye ekranı | 3 kart, yenile 3+, çıkar 2+ | 3 kart, Yenile/Atla/Çıkar dükkândan 6 kademe, luck formülü | kısmen |
| Harita | 2 biyom, sonsuz döngü | 3 harita, her biri 1-3 kademe, kademe = aşama sayısı + final boss | sistem |
| Aşama akışı | 10 dk, kapı + boss, geçit | 10 dk, 7:00 ve 2:00'de ara boss, boss portalı, sonraki aşama portalı, 0:00'da Uzatma, final arenası, Çıkış portalı | kısmen |
| Zorluk statı | greed + curse çarpanı | görünür Zorluk % statı, 6 kaynaktan artar | sistem |
| Düşman türü | 6 (+ elit, 3 ara boss, haydut, 3 albastı, 2 hırsız) | ~45 sıradan + elit sistemi | ~35 |
| Boss ve ara boss | 2 boss (ikiz), 3 ara boss, haydut, mezar ruhu | 19 (9 ana, 5 ara, 5 gizli/etkinlik) | 12 |
| Sunak ve etkileşim | 9 sunak, tüccar, cadı kazanı, mezar, kös | 11 sunak + tüccar, mikrodalga, kamp ateşi, boombox, kafes, totem, tabut, mezar | 6 |
| Güç (power-up) | 5 | 8 | 3 |
| Kalıcı dükkân | 11 stat yükseltmesi, 4 kilit | 8 sistem yükseltmesi (Gümüş, Yenile, Atla, Çıkar, Silah slotu, Tom slotu, Toggler, Boombox) + 100'e yakın kilit | sistem |
| Görev | 24 | ~141 (karakter 18, silah 22, tom 10, eşya 43, genel 15, meydan okuma 13, kostüm 20) | 117 |
| Meydan okuma | yok | ~30, koşu başına 1, gümüş çarpanı | sistem + 30 |
| Başarım | yok | 139 | sistem + 139 |
| Sıralama | kahraman başına yerel, ortak tablo isteğe bağlı | küresel tek tablo, meydan okuma koşuları hariç; Claude içinde paylaşılan tablo, dışarıda Supabase | yakın |
| Koşu sonu ekranı | öldürme, süre, aşama, dakikada | silah başına hasar, kazanılan gümüş, yeni açılan görevler, hızlı yeniden başlat | kısmen |
| Ayarlar | 13 anahtar | ~30 (görüntü, oyun, erişilebilirlik, konsol) | 17 |
| Harita ekranı | büyük harita var | sis perdesi (fog of war) | küçük |
| Para birimi | altın + gümüş | altın + gümüş, gümüş çarpanlı hayalet evresi | yakın |
| Mod | tek mod | tek mod + meydan okuma + final arenasında sonsuz | yakın |
| Platform | web, dokunmatik, kumanda | Steam, Deck | bizde fazla |

Özet: yapı sağlam, içerik hacmi ve üç büyük sistem eksik. Üç sistem şunlar: tetikli eşya ve durum efektleri, kademe tabanlı aşama akışı, görev ve kilit ekonomisi.

## 2. Faz planı

Fazlar birbirine bağımlı sırada. Her fazın sonunda `npm test` geçmeli ve duman testine o fazın kontrolü eklenmeli.

### Faz 0. Temel: hataları kapat, veriyi sisteme çevir

Bu faz içerik eklemez, sonraki her fazı ucuzlatır.

1. Bilinen hataları kapat. Instance tamponu sızıntısı (`world/ambient.js`), tüccar engeli (`game/interact.js`), MSAA hedef tekrarı (`engine/gfx.js`), işaretçi kilidi kilitlenmesi (`core/helpers.js`), ses `interrupted` durumu, Otağ çift sayım, mobil bildirim örtüşmesi.
2. **Stat motoru.** `calc()` yerine üç katmanlı formül: `(ekle) x (taban) x (çarpan)`. 57 stat anahtarı tek tabloda, gösterim biçimi (%, düz, /dk) tabloda. Kritik >%100 aşırı kritik, kaçınma azalan getirili (iç değer / (1 + iç değer), 6 Kasım 2026'dan beri; önce %100 tam kaçınmaydı), zırh hiperbolik gösterim.
3. **Durum ve element sistemi.** Düşman üzerinde yanma, donma, zehir yığını, kan izi, lanet, sersemletme, büyüleme. Element hasarı statları (ateş, buz, yıldırım, zehir). Yavaşlatma bunun içine taşınır.
4. **Eşya kanca sistemi.** Her eşya `{ onHit, onKill, onHurt, onPickup, onChest, onShrine, tick }` kancalarından istediğini tanımlar. Tekil (unique) eşya bayrağı. Olumsuz etkili eşyalar.
5. **Nadirlik formülü.** Decompile edilmiş formül: `bonus = ln(luck+1) x 1.5`, `w[i] = taban[i] x 1.5^(-(enYüksek-i-1) x bonus)`. Silah ve tom seviyeleri nadirlik çarpanı alır: 1.0 / 1.2 / 1.4 / 1.6 / 2.0.
6. **Düşman havuzu ve instancing.** Final evresinde 300-400 hayalet hedefi. Göz meshlerini modele göm, toplanabilirleri tek InstancedMesh yap. Ölçüt: 400 düşmanla `upd` < 8 ms, çizim çağrısı < 300.
7. **Kayıt sürümü.** `kk_meta` içine `v` alanı, göç fonksiyonu. Rütbe, kostüm, şapka, görev, başarım, meydan okuma alanları şimdiden şemaya girer.
8. **Durum nesnesini böl.** `$G` → `player`, `run`, `world`, `ui`, `meta`. `window` köprüsü sadece test için kalır, menüler olay dinleyicisine geçer.

Bitiş ölçütü: mevcut 19 eşya kanca sistemine taşınmış, mevcut 12 silah nadirlik çarpanlı seviye alıyor, duman testi 400 düşmanla geçiyor.

**Durum:** 1-7 tamamlandı. Ölçüm (başsız Chrome, yazılım çizimi): 400 düşman ve 120 ganimetle güncelleme ~7-9 ms, çizim çağrısı 471 (önce 983); 200 düşmanda 286 (önce 537). Çizim çağrısı artık düşman başına 1 iskeletli mesh; daha aşağısı instanced skinning ister, Faz 1'in Son Dalga maddesinde yeniden ele alınır. 8. madde (`$G` bölme, `window` köprüsü) ertelendi: davranış değiştirmeyen bir refactor olduğu için içerik fazlarından sonra yapılacak.

### Faz 1. Çekirdek döngü: kademe, aşama akışı, zorluk

1. **Harita ve kademe seçimi.** Menüde harita kartları, her haritada Kademe 1-3. Kademe N = N aşama + final boss. Kademe N+1, N'in final boss'u devrilince açılır.
2. **Aşama akışı.** 10 dakikalık aşama sayacı. 7:00 ve 2:00'de ara boss (3. aşamada 6:30 ve 1:30, wiki; 6 Kasım'a kadar 3:00'tü). Haritada **Boss Kapısı**; etkinleşince aşama boss'u gelir, boss canı geçen süreyle ölçeklenir. Boss ölünce Kademe 1'de Son Dalga, Kademe 2-3'te **Sonraki Aşama Geçidi** (sayaç sıfırlanmaz). Son kademede geçit küçük bir **final arenasına** ışınlar. Sayaç 0:00 olunca **Uzatma**: sonsuz uçan dalga, zamanla güçlenir.
3. **Son Dalga ve skor.** Final boss'tan sonra **Çıkış Geçidi** koşuyu bitirip puanlar; kalırsan sonsuz Son Dalga. Hayalet üst sınırı 400 (ilk 2 dk) / 300. Gümüş çarpanı hayatta kaldıkça büyür. Mevcut Albastı kademeleri (beyaz, mor, kızıl) buraya oturur; Mezarlık hayaletleriyle (beyaz, kara, mor, kızıl) birleşir.
4. **Zorluk % statı.** HUD'da görünür. Kaynakları: zaman, Açgözlülük sunağı +%5, Ocak sunağında seçilirse +%8 (nadirliğe göre +%16'ya kadar), Lanet Tomu +%3.5/seviye, Skuleg eşyası +%7, Lanetli Eldiven +%10, Kara Han pasifi, meydan okuma çarpanları. Düşman sayısı, canı, hızı, hasarı bundan türer.
5. **Elit sistemi.** Taç işareti, 10x tecrübe, sandık düşürme şansı %0.2 (sıradan %0.1) + zamanla artan ve düşünce sıfırlanan çarpan. "Elit doğma artışı" statı taban %0.6.
6. **Sandık ekonomisi.** Ücretli sandık 30 altından başlar, her satın almada artar, üst sınır yok. Ücretsiz ve altın sandık fiyatı yükseltmez. Anahtar eşyası ücretsiz açma şansı. Nadirlik maliyete değil şansa bağlı (taban ağırlıklar Sıradan 70 / Nadir 15 / Destansı 6 / Efsanevi 1.5; şans yokken %75.7 / %16.2 / %6.5 / %1.6).
7. **Slot sistemi.** Başlangıç 2 silah + 2 tom. Dükkândan 3. ve 4. slot.

Bitiş ölçütü: Kara Koru haritasında Kademe 1-2-3 baştan sona oynanıyor, duman testi her kademeyi geçiyor, Uzatma ve Çıkış Geçidi çalışıyor.

**Durum:** tamamlandı. Menüde harita ve kademe seçici; Kızıl Bozkır, Kara Koru K2'de 2. aşamaya geçince açılır; kademe N+1, N'in son boss'u devrilince. Aşama sayacı aşamalar arasında sıfırlanmaz, ara boss 7:00 ve 2:00'de (3. aşama: 6:30, 3:00; 5 Kasım 2026'ya kadar saat sıfırlanmadığı için 2. ve 3. aşamada bunlar işlemiyordu, düzeltildi), sayaç dolunca Uzatma (uçan dalga), K3'ün son aşaması 40 m yarıçaplı mühür arenası ve otomatik gelen boss. Son boss düşünce Çıkış Geçidi (`GATE.st` 3) ve Son Dalga; çıkış koşuyu puanlayıp bitirir, kalınan her 90 sn öldürme gümüşünü 1 kat artırır (en çok 16x). Zorluk yüzdesi HUD'da (`diffPct`), kaynakları: açgözlülük taşı +%5 (ve 25-30 altın), ocak +%8, lanet tomu, `diff` statı, zaman, kademe çarpanı (1 / 2.2 / 5). Elit doğma %0.6 × stat, elit 10x tecrübe, sandık düşme %0.2 / %0.1 artan zaman çarpanıyla. Ücretli sandık 30 altından başlar, her alımda ×1.25, tavan yok. Başlangıç 2 silah + 2 tom slotu; Otağ'da Silah slotu, Tom slotu, Atlama, Yenile ve Çıkar 6 kademeli maliyet merdiveniyle (görev sayısı kapıları `qn` alanında kayıtlı, Faz 6'da zorunlu olacak). Elit taç işareti sonradan eklendi (`enemies.js`, halkaya ek taç); ocak +%8 ve taban sandık ağırlıkları sonradan teyit edildi (5 Kasım 2026).

### Faz 2. Silahlar ve tomlar

**Silah seviyesi.** Seviye alınca silahın havuzundan 1-2 rastgele stat satırı (Sıradan'da 50/50 bir ya da iki) gelir, taban x nadirlik çarpanı. Havuz silah başına tanımlanır (ör. Kılıç: hasar, mermi, itme, boyut; Yay ve Tabanca: kritik şansı ve kritik hasarı ekler; Yıldırım ve Kemik: sekme ekler; Ateş İzi, Balta, Mayın: süre ekler). Azami seviye 40, Kazan eşyası +10. Evrim yok; sinerji, aynı statı paylaşan silahlara tomun uygulanması.

**30 silah.** Mevcut 12'si Megabonk karşılığıyla eşlendi, 18'i yeni. Kilit koşulları Megabonk ile birebir, isimler bizim.

| # | Megabonk | Kara Koru | Ne yapar | Taban (hasar/itme/kritik/mermi) | Kilit |
| --- | --- | --- | --- | --- | --- |
| 1 | Firestaff | **Ateş Topu** (var) | Patlayan ateş topu | 10/1/0/1 ateş | açık |
| 2 | Sword | **Kılıç Savuruşu** (var) | Önünde yay çizen kesik | 11/2/0/1 | açık |
| 3 | Bow | **Ruh Okları** (var, yeniden ayar) | Delen ok, yavaşlayan | 9/0.5/0/1 | açık |
| 4 | Lightning Staff | **Yıldırım** (var) | Yakına yıldırım, zincirleme | 7/1/0/1 yıldırım | açık |
| 5 | Chunkers | **Dönen Kılıçlar** (var) | 3 yörünge nesnesi | 12/2.5/0/3 | açık |
| 6 | Flamewalker | **Kor İzi** (Zehir İzi'nin yerine, ateş) | Arkanda ateş izi | 5/0/0/1 ateş | açık |
| 7 | Bone | **Kemik** | Seken kemik (1 sekme) | 11/1.5/10/1 | açık |
| 8 | Axe | **Balta** (var) | 2 dönen alan baltası, geri döner | 6/1/0/2 | 2.000 Kılıç öldürmesi |
| 9 | Aura | **Kor Halkası** (var) | Çevrende sürekli hasar | 6/0.5/0/alan | 2 dk üst üste hasar almamak |
| 10 | Revolver | **Tüfek** (Osmanlı fitilli) | En yakına 6 mermi | 5/0.4/5/6 | Kara Koru K1 bitir |
| 11 | Aegis | **Kalkan** | Darbeyi engeller, şok dalgası, diken statı hasara eklenir | 10/3/0/2 | Alp ile zırhla 500 hasar engelle |
| 12 | Slutty Rocket | **Havai Fişek** | Güdümlü füze | 11/2/5/1 | Tunç ile 15.000 öldürme |
| 13 | Bananarang | **Kemik Bumerang** (var) | Gidip gelen, çok vuruşlu | 9/1/0/1 | Koru'da gizli nesneyi bul |
| 14 | Tornado | **Hortum** | Fırlatan hortum | 8/3/0/1 | Kum fırtınasında 5 Ocak sunağı doldur |
| 15 | Dexecutioner | **Cellat Palası** | Delen kesik, infaz şansı | 9/1/0/1 | Kara Haydut'u yen |
| 16 | Sniper Rifle | **Uzun Menzilli** | Delen, elle nişan | 22/4/5/1 | Keskinlik Tomu 10 |
| 17 | Frostwalker | **Ayaz** (var, alan yapılır) | Donduran alan | 9/0.5/0/alan buz | Buz Küpü ile 1.000 dondur |
| 18 | Space Noodle | **Işık Hüzmesi** | Düşmana ışın, aradakilere vurur | 10/0.5/0/ışın | Tulpar ile Bozkır K2 boss'unu devir |
| 19 | Dragon's Breath | **Ejder Nefesi** | Ateş konisi | 16/0.5/0/koni ateş | Kam ile 1.000 Ruh Alevi öldür |
| 20 | Mines | **Kapan** | Yakınlık mayını | 10/4/0/1 | Havai Fişek ile 7.500 öldürme |
| 21 | Poison Flask | **Zehir Şişesi** | Alan + zehir | 1/1/0/1 zehir | Akrep ara boss'unu 3 kez öldür |
| 22 | Black Hole | **Girdap** (var) | Düşmanı çeker, patlar | 4.5/6/0/1 | İtme Tomu 10 |
| 23 | Katana | **Yatağan** | En yakına hızlı kesik | 11/1/0/1 | Bozkır K1'de Kemik Yumağı'ndan %5 düşer |
| 24 | Blood Magic | **Kan Büyüsü** | Öldürünce %5 azami can | 9/1/0/1 | Kan Tomu 12 |
| 25 | Wireless Dagger | **Uçan Hançer** | Güdümlü hançer | 9/0.4/0/1 yıldırım | Yıldırım 15. seviye |
| 26 | Dice | **Aşık Kemiği** | 1-6 hasar, 6 gelince kalıcı kritik | 0/2.5/10/1 | Şans Tomu 12 |
| 27 | Hero Sword | **Alp Kılıcı** | Kesik + kesik mermisi | 11/2/0/1 | Eşyasız, güçsüz, sunaksız boss devir |
| 28 | Corrupted Sword | **Erlik Kılıcı** | İki yöne keser, düşük canda daha sert | 12/2/0/1 | Lanet Tomu 20, 10 dk içinde |
| 29 | Shotgun | **Çakaralmaz** | Saçma, yakında güçlü, elle nişan | 9/3/5/1 | Bozkır K2'de Kemik Yumağı'ndan %5 |
| 30 | Scythe | **Tırpan** | Daire kesik, elit öldürünce büyük vuruş | 11/1/0/1 | Mezarlık boss'unu devir, 44 gümüş |

Mevcut **Şok Dalgası (nova)** ve **Zehir İzi (poi)** Megabonk'ta yok. İlke "olmayan hiçbir şey olmasın" olduğu için ikisi de kalır ama havuzda 31. ve 32. silah olur; Zehir İzi'nin ateş sürümü Kor İzi olur.

**23 tom.** Seviye başına değer x nadirlik çarpanı, azami 99.

| # | Megabonk | Kara Koru | Seviye başına | Kilit |
| --- | --- | --- | --- | --- |
| 1 | Damage | Güç Tomu (var) | +%8 hasar | açık |
| 2 | Agility | Çeviklik Tomu (var) | +%15 hız | açık |
| 3 | Cooldown | Hız Tomu (var) | +%7.5 saldırı hızı | açık |
| 4 | Quantity | Çokluk Tomu (var) | +1 mermi (Efsanevi +2) | 5.000 mermi at |
| 5 | Knockback | **İtme Tomu** | +% itme | açık |
| 6 | Armor | Zırh Tomu (var) | +%12 zırh | Alp ile 5.000 öldürme |
| 7 | HP | Can Tomu (var) | +25 can | açık |
| 8 | Regen | Yenilenme Tomu (var) | +40 can/dk | açık |
| 9 | Size | Boyut Tomu (var) | +%10 boyut | açık |
| 10 | Projectile Speed | **Mermi Hızı Tomu** | +% mermi hızı | açık |
| 11 | Duration | **Süre Tomu** | +%15 süre | Balta 10 |
| 12 | Evasion | **Kaçınma Tomu** | +%10 kaçınma (azalan) | açık |
| 13 | Attraction | Mıknatıs Tomu (var) | +%75 toplama | 8 Rüzgâr taşı |
| 14 | Luck | Şans Tomu (var) | +%7 şans | düşmandan %0.01 düşer |
| 15 | XP | Bilgelik Tomu (var) | +%7 tecrübe | bir koşuda 20 pot |
| 16 | Golden | Altın Tomu (var) | +%12 altın | açık |
| 17 | Precision | Keskinlik Tomu (var) | +%7 kritik | açık |
| 18 | Shield | **Kalkan Tomu** | +25 kalkan | açık |
| 19 | Bloody | Kan Tomu (var) | +%10 can çalma | 12.500 öldürme |
| 20 | Thorns | **Diken Tomu** | +15 diken | Kalkan ile 250 engelleme |
| 21 | Silver | **Gümüş Tomu** | +%12 gümüş | açık |
| 22 | Cursed | Lanet Tomu (var) | +zorluk | boss'u 5 dk altında devir |
| 23 | Chaos | **Kaos Tomu** | her seviye rastgele stat | K3'te üç aşamada bütün sunakları bölgeden çıkmadan doldur |

Bitiş ölçütü: 32 silah ve 23 tom veri tablosunda, her biri kilit koşuluyla; silah seviyeleri nadirlik çarpanlı; duman testi her silahı bir kez ateşleyip hata aramıyor.

**Durum:** tamamlandı. 32 silah (30 Megabonk karşılığı + Şok Dalgası ve Zehir İzi), 23 tom. Silah seviye havuzları silah başına (`u`): kritik şansı/hasarı, sekme, itme, süre satırları eklendi; mermi hızı, süre, itme, kalkan ve diken statları mekaniğe bağlı. Kilit koşulları 31 görev olarak `QD` içinde (`w_*`, `t_*`); henüz var olmayan içeriğe bağlı koşullar geçici hedeflerle (ör. Akrep Ana yerine "3 ara boss", Kemik Yumağı yerine "Bozkır K1'i bitir", Ruh Alevi yerine "Kam ile 1.000 öldürme"); Faz 5'te asıl koşullara çevrilecek. Megabonk'ta varsayılan olmayan Balta, Kor Halkası ve Girdap artık kilitli. Kan Tomu seviye başına %10 can çalma (Megabonk değeri) güçlü; dengeyi oynayışta gözle.

### Faz 3. Eşyalar

86 eşyanın tamamı. Nadirlik etiketleri iki kaynağın uyuştuğu yerde verildi (S sıradan, N nadir, D destansı, E efsanevi); boş olanlar uygularken karar verilir. Olumsuz etkili olanlar **(−)** ile işaretli. Mevcut eşyalar parantezde.

**Hasar ve kritik**
Gym Sauce → **Pehlivan Yağı** S +%10 hasar (Bileği Taşı) · Scarf → **Yün Atkı** S +0.5 düz hasar · Beer → **Kımız** S +%20 hasar, −%5 can (−) · Brass Knuckles → **Demir Yumruk** N 8 m içinde +%25 hasar · Time Bracelet → **Kum Saati** S dakikada +%8 hasar · Idle Juice → **Sabır Şerbeti** N durdukça +0.04 hasar/sn, en çok +%100 · Gamer Goggles → **Nazar Gözlüğü** düşük canda +%100'e kadar hasar · Demonic Soul → **Erlik Ruhu** D öldürdükçe biriken hasar · Boss Buster → **Dev Avcısı** elit ve boss'a +%15 · Tactical Glasses → **Kartal Gözü** +%20 hasar (25 sn içinde ara boss) · Credit Card Red → **Kızıl Kese** alınan sandık başına +%2.5 hasar · Forbidden Juice → **Yasak Şerbet** +%10 kritik · Giant Fork → **Dev Çatal** +%15 kritik, %14 mega kritik x4 · Demonic Blade → **Erlik Bıçağı** N +%1 kritik, kritikte %25 iyileşme · Grandma's Secret Tonic → **Nine Tonik'i** kritik 3 m'ye %50 sıçrar · Kızıl Pençe (var) kritik +%12 → **Giant Fork** ile birleştirilebilir.

**Vuruş tetikleri**
Big Bonk → **Tokmak** %2 (+1.5) şansla 20x alan vuruşu · Spicy Meatball → **Acı Köfte** E vuruşlar %65 zincir patlar · Slutty Cannon → **Top Güllesi** D %20 roket %100 (+40) · Lightning Orb → **Yıldırım Küresi** %25 yıldırım %40 + sersemletme · Ice Cube → **Buz Küpü** %20 buz kıymığı %80 (+40), %40 donma · Ice Crystal → **Buz Kristali** S %7.5 donma · Dragonfire → **Ejder Ateşi** %15 yanma · Moldy Cheese → **Küflü Peynir** S %40 zehir yığını · Snek → **Yılan** +4 zehir, %5 patlama · Unstable Transfusion → **Kararsız Kan** %35 kan izi · Bloody Cleaver → **Kanlı Satır** E can çalmada %50 kan izi (Börü 50. seviye) · Eagle Claw → **Kartal Pençesi** %8 havaya kaldırma, havadakine +%66 · Joe's Dagger → **Cellat Hançeri** E %1 infaz, her infazda +%1 hasar · Weeb Headset → **Kaval** %2 büyüleme 1.5 sn · Cursed Doll → **Lanetli Bebek** 2 düşmanı lanetler, saniyede azami canın %30'u · Power Glove → **Güç Eldiveni** %8 1.25x itme patlaması · Lightning Glove → **Yıldırım Eldiveni** 10 sn, 3x alan · Poison Glove → **Zehir Eldiveni** 8.5 sn, 1.5x, +10 zehir · Blood Glove → **Kan Eldiveni** 9 sn, 3.15x, %7.5 iyileşme · Cursed Glove → **Lanetli Eldiven** %5 lanet, +%10 zorluk, can x0.8 (−) · Overpowered Lamp → **Tılsımlı Kandil** E vuruş eşyaları bir kez daha zar atar (tekil) · Şahmeran Pulu (var) ölümde patlama → **Spicy Meatball** yerine korunur.

**Mermi ve silah**
Backpack → Sırt Çantası (var) S +1 mermi · Energy Core → **Kor Çekirdek** 4 sn'de 4 (+2) küre · Electric Plug → **Çakmak Taşı** vurulunca 15 (+4) hedefe zincir · Bob Dead → **Hortlak** her 14 m'de hayalet mermisi · Ghost → **Albastı Sürüsü** 6 hayalet · Soul Harvester → **Ruh Biçici** E öldürünce yığın başına 2 mermi · Cactus → **Kaktüs** vurulunca 2 diken x5 · Toxic Barrel → **Zehir Fıçısı** vurulunca 7 m'ye 5x zehir · Anvil → **Örs** E silah seviyeleri +1 stat satırı (tekil, 3 meydan okuma) · Pot → **Kazan** N silah azami +10, tom +5, fazladan yığın −1 · Wizard's Hat → **Kam Külahı** E tom seviyesi +10, azalarak +2 · Campfire → **Ocak Başı** durunca 1.100 can/dk, +1 satır.

**Can, zırh, savunma**
Oats → **Yulaf** S +25 can (Kemik Muska) · Beefy Ring → **Pehlivan Yüzüğü** +10 can, azami can başına +%0.2 hasar · Medkit → **Sargı Bezi** +45 yenilenme · Borgor → **Lahmacun** %2 (+1) şansla %8+10 iyileşme · Leeching Crystal → **Sülük Taşı** +50 can, −0.5 yenilenme (−) · Chonkplate → **Demir Göğüslük** +%75 aşırı can, +%20 can çalma · Holy Book → **Kutsal Kitap** E +100 can, +50 yenilenme, +%25 aşırı can, kutsal hale · Spiky Shield → **Dikenli Kalkan** +%10 zırh, zırh başına +200 diken · Quin's Mask → **Şaman Maskesi** +20 diken, diken %50 sıçrar · Slippery Ring → **Kaygan Yüzük** S +%15 kaçınma (Nazar Boncuğu) · Phantom Shroud → **Hayalet Kefeni** N +%5 kaçınma, kaçınınca patlama · Coward's Cloak → **Korkak Pelerini** +%5 hız, vurulunca %30 patlama · Mirror → **Ayna** alınan hasarı yansıtır, 8→4 sn · Golden Shield → **Altın Kalkan** vurulunca +6 altın · Gasmask → **Gaz Maskesi** D zehirli düşman başına +%0.5 zırh ve aşırı can · Speed Boi → **Zaman Büküğü** E %50 canda 2 sn zaman yavaşlar, 2x hasar · Kevin → **Keloğlan** D vurulunca %25 kendine yumruk, öldüremez (−) · Tunç Kalkan (var) 10 sn'de bir engelleme → Megabonk'ta karşılığı yok, kalır.

**Hareket**
Turbo Socks → Deri Çizme (var) +%15 hız · Flappy Feathers → Simurg Tüyü (var) +1 zıplama, hava hızı · Rollerblades → **Paten** hız arttıkça saldırı hızı +%40'a kadar · Golden Sneakers → **Altın Çarık** N metre başına 0.1 altın · Karga Tüyü (var) zıplama → Flappy Feathers'a katılır.

**Ekonomi, şans, tecrübe**
Golden Glove → Bakır Yüzük (var) +%15 altın · Credit Card Green → **Yeşil Kese** sandık başına +%2 şans, sandık fiyatı +%10 (−) · Clover → **Dört Yapraklı Yonca** S +%7.5 şans · Key → Demir Anahtar (var) %10 ücretsiz sandık · Echo Shard → **Yankı Kıymığı** +%12 ek tecrübe kıymığı · Shattered Wisdom → **Kırık Bilgelik** tecrübe kıymıkları düşmanı keser · Sucky Magnet → **Hortum Taşı** E düzenli tecrübe çekimi · Wrench → **Çekiç** S sunak +%4 dolum, +%7.5 ödül · Beacon → **Fener** dolu sunak iyileştirir, +2 sunak · Pumpkin → **Balkabağı** +8 pot, +%18 pot ödülü · Skuleg → **Kemik Bacak** +%7 zorluk (−) · Old Mask → **Eski Maske** +%15 elit doğma (−) · Bob's Light → **Hortlak Feneri** 45 sn'de bir küre · Za Warudo → **Zaman Mührü** E 15 sn zaman durdurma · Cage Key → **Kafes Anahtarı** görev eşyası · Golden Ring → **Altın Halka** E, etkisi yok · Kam Tumarı, Pusula, Pastırma, Kan Taşı, Kurt Postu, Ejder Kalbi (var) kalır.

Bitiş ölçütü: 86 + mevcut 6 fazladan = 92 eşya tabloda; her tetikli eşyanın birim testi var (sahte düşman, 1.000 vuruş, beklenen tetik oranı ±%2).

**Durum:** tamamlandı. `data/items.js` içinde 99 eşya (86 Megabonk, 12 Kara Koru'ya özgü, 1 görev eşyası); 64'ü tetikli, davranışları `game/items.js` içinde. Yeni kanca noktaları: kritik sonrası (`crit`), kaçınma (`evade`), aşama kurulumu (`stage`: ek ocak ve pot), stat hesabı (`calc`: zırha bağlı diken, sandık sayısına bağlı hasar ve şans, hıza bağlı saldırı hızı, zehirli düşman sayısına bağlı zırh, biriken öldürme bonusları, seviye tavanları). Aşırı can tavanı (`overheal`) yenilenme, can çalma ve iyileşmelerde uygulanır. Duman testi her eşyayı iki geçişte (şans zorlanmış ve normal) bütün kancalardan geçirir ve hesap kancalarını sayısal doğrular; tetik oranı istatistiği (±%2) yerine zorlanmış-şans geçişi kullanıldı. Tahmin işaretli: Altın Halka etkisi, Erlik Bıçağı iyileşme miktarı, Pehlivan Yüzüğü oranı, Tokmak alanı.

### Faz 4. Karakterler, rütbe, kostüm, şapka

**Rütbe.** Karakter başına 1-100, o karakterle kazanılan tecrübeyle dolar, pasif rütbeyle ölçeklenir. Rütbe 100 altın kostüm açar; hepsinde 100, Taç şapkasını.

**21 karakter.** Mevcut 7'si eşlendi, 14'ü yeni. Kilit: koşulu sağla, sonra gümüşle satın al.

| # | Megabonk | Kara Koru | Başlangıç silahı | Pasif | Kilit (gümüş) |
| --- | --- | --- | --- | --- | --- |
| 1 | Sir Oofie | **Alp** (var) | Kılıç Savuruşu | Demir deri: +%1 zırh/rütbe | açık |
| 2 | Fox | **Kam** (var) | Ateş Topu | Fal: +%1.5 şans/rütbe (kritik pasifi Tunç'a geçer) | açık |
| 3 | CL4NK | **Tunç** (bakır otomaton) | Tüfek | Keskin göz: +%1 kritik/rütbe | Kara Koru K1 + Tüfek |
| 4 | Calcium | **Kemik** (iskelet) | Kemik | Hız şeytanı: hız zamanla birikir, vurulunca yarılanır, hıza göre hasar | 1.000 iskelet; 9 |
| 5 | Megachad | **Pehlivan** | Kor Halkası | Kasma: hasarı engeller, sersemletir, her kasmada kalıcı +%2.5 hasar | Güç Tomu 7 + Kor Halkası; 10 |
| 6 | Monke | **Yaban** (dağ adamı) | Kemik Bumerang | Tırmanış: duvara tırmanır, yüksek zıplar, +2 can/rütbe | Koru'daki kafesten kurtar; 18 |
| 7 | Ogre | **Bahadır** (var) | Balta | Ganimet pasifi kalır | 15.000 Gulyabani + Balta; 12 |
| 8 | Bandit | **Haydut** | Cellat Palası | Akış: +%1 saldırı hızı/rütbe | Kara Haydut'u yen; 30 |
| 9 | Ninja | **Gölge** (var) | Yatağan | Gölge adımı: kaçınınca saldıranı infaz eder | Bozkır K1 + Yatağan; 32 |
| 10 | Vlad | **Börü** (var) | Kan Büyüsü | Kan kokusu: +%5 düz can çalma, +%1/rütbe | Bozkır K2 + Kan Büyüsü; 32 |
| 11 | Athena | **Umay** | Kalkan | Koruma: +2 diken/rütbe, düşük canda daha sert | Diken Tomu 8 + Kalkan; 16 |
| 12 | Dicehead | **Aşıkçı** | Aşık Kemiği | Kumar: her seviyede rastgele stat | 100 görev + Aşık Kemiği |
| 13 | Sir Chadwell | **Kara Han** (var) | Erlik Kılıcı | Lanetli kan: +%1 zorluk/rütbe | Kara Koru K3 + Erlik Kılıcı; 33 |
| 14 | Spaceman | **Gökçe** (gök gezgini) | Girdap | +%1.5 tecrübe/rütbe | 6 meydan okuma + Girdap |
| 15 | Amog | **Şahmeran** | Zehir Şişesi | Veba: +%1 zehir/rütbe, yarıçap 4→12 | Küflü Peynir ile 50.000 zehirle + Zehir Şişesi |
| 16 | Noelle | **Ayaz** (var) | Ayaz | Dayanıklı: +%1 boyut/rütbe | Cadı kazanında 3 kez üst üste Buz Kristali + Ayaz |
| 17 | Birdo | **Anka** | Hortum | Süzülme: havada +%1 hasar/rütbe | Hortumla taşınırken 100 öldürme + Hortum |
| 18 | Bush | **Çalı** | Uzun Menzilli | Tam isabet (Bullseye): rastgele düşmanı işaretler, işaretliye vurunca patlama; +%1 kritik hasarı/rütbe | Koru'daki Çalı'yı bul ve yen + Uzun Menzilli |
| 19 | Tony McZoom | **Tulpar** (kanatlı at) | Uçan Hançer | Kristaller hasar verir | 2 meydan okuma + Uçan Hançer |
| 20 | Robinette | **Okçu** | Ruh Okları | Kâr: +%1 altın/rütbe, +3 toplama, +%5 altın | Kara Koru K2 + Ruh Okları; 18 |
| 21 | Roberto | **Orakçı** | Tırpan | Her 60-120 sn ücretsiz hayalet sandığı | Tırpan + Mezarlık'ta Kara Kefen'i öldür; 37 |

**Kostüm.** Karakter başına: Altın (rütbe 100), Kara/Buz çeşidi (o karakterle 15.000 öldürme), Alev (K3 final boss'u o karakterle), Asit/Gelecek (ilk boss 6 dk altında). Gümüşle satın alınır, karakter seçiminde. Toplam ~60.

**21 şapka.** Hepsi başarımla açılır, kozmetik. Başlıcaları: Kurbağa x3 (Koru 1-3 aşamalarında kurbağa yumurtası), Tüccar (tüccardan al), Kazan, Keloğlan (Keloğlan eşyasıyla 100.000 yumruk), Taç (her karakterde rütbe 100), Kam Külahı, Soytarı (Şaman Maskesi ile Umay olarak 500 öldürme), Peynir (Şahmeran ile K3 final boss, 8 Küflü Peynir + Yılan), Uzun Fes (tek koşuda 300.000 öldürme), Çömlek, Baret, Demir Tolga, Noel (yılbaşı hediyesi).

Bitiş ölçütü: 21 karakter modeli `geo/models.js` içinde, rütbe ve kostüm kayıtta, karakter seçim ekranı rütbe çubuğu ve kostüm sekmesi gösteriyor.

**Durum:** tamamlandı. 14 yeni karakter mevcut `HVAR` sistemiyle taban model + palet olarak kuruldu (Tunç, Gökçe, Orakçı Alp'ten; Kemik, Haydut, Tulpar, Okçu Gölge'den; Umay, Aşıkçı, Şahmeran, Anka Kam'dan; Pehlivan, Yaban, Çalı Bahadır'dan; Pehlivan 1.12, Kemik 0.95 ölçekli). Özgün modeller Faz 7 cila işi. Pasifler rütbeye göre ölçeklenir (`pr`), özel davranışlar `HH`: Gölge kaçınınca infaz, Kemik hız birikimi, Pehlivan 8 saniyede kasma, Umay düşük canda hasar, Aşıkçı seviyede rastgele stat, Anka süzülme ve havada hasar, Tulpar kristal kesmesi, Orakçı hayalet sandığı. Kostüm: karakter başına Altın (rütbe 100), Kara (15.000 öldürme), Alev (K3 final boss), Asit (ilk boss 6 dk altı); köşe rengi dönüşümü, gümüşle satın alınır. 21 şapka başarım görevleriyle (`h_*`) açılır, baş kemiğine bağlanır. Karakter açılışı iki adım: koşul görevi (`c_*`) sonra gümüş. Megabonk'a uyum için Gölge artık kilitli (Bozkır K1 + Yatağan); eski kayıtlarda açık kalır. Faz 5 ve 6'ya bağlı koşullar geçici: Yaban (kafes), Çalı (gizli boss), Orakçı (Kara Kefen), Gökçe ve Tulpar (meydan okuma), Anka (hortum).

### Faz 5. Dünya: haritalar, düşmanlar, bosslar, etkileşimler

**3 harita.**

| Megabonk | Kara Koru | Arazi | Kilit |
| --- | --- | --- | --- |
| Forest | **Kara Koru** (var) | tepe, vadi, harabe kuleler (zıplama ister), kaydırak yamaçlar, çamur ve su 0.4x hız | açık |
| Desert | **Kızıl Bozkır** (var) | düz, açık, hortumlar yukarı fırlatır (düşme hasarı), kum fırtınası, bataklık kum −%40 | Tunç ile Kara Koru K2'de 2. aşamaya geç |
| Graveyard | **Mezarlık** (yeni) | dar, süreli **Mahzen** ile başlar → mezarlık; mühürlü kapılar, tabutlar, kırılan kabaklar; tek kademe | Kemik ile Bozkır K2'de 4 mezarı rahatsız et → 4 hayaleti öldür → iskelet heykeli → Kemik'in Babası |

**Mezarlık akışı.** Mahzen sayacı dolmadan çık (yoksa **Kara Kefen** gelir, sonsuz can) → hayaletlerden ve tabut ara bosslarından 4 **Mahzen Anahtarı** → kapı → 4 tabut → **Koca Bob** karşılığı **Dev Hortlak**.

**Düşmanlar (~45).** Koru: Gulyabani (var), Böcek, Arı, Hortlak (zombi). Bozkır: Akrep (zehir), Kaktüs (sabit ve yürüyen), Kaktüs Okçu, Kemik Yumağı (yuvarlanan, sunak dolumu bozar), Mumya ve Kadim Mumya, Altın İskelet, Ruh Alevi. Mezarlık: Hayalet (beyaz, kara, mor, kızıl), Kara Hayalet (elit), Bekçi Hayalet (donduran), İskelet. Son Dalga: uçanlar + hayaletler. Mevcut 6 tür bu listenin içine dağılır. Fextralife 51 kayıt sayıyor, tam tablo wiki'den alınacak.

**Bosslar (19).**

| Harita | Megabonk | Kara Koru | Geliş | Saldırı |
| --- | --- | --- | --- | --- |
| Koru K1 | Lil Bark | **Tepegöz** (var) | Boss Kapısı | kök şoku, yaprak atma |
| Koru K2 | Chadbark | **Ulu Tepegöz** (var) | Boss Kapısı | hücum, sarmaşık |
| Koru K3 | Bark Vader | **Kadim Tepegöz** | final arenası | ikincil silahları kapatır, iyileştiren direkler |
| Koru ara | Chunkham | **Dev Karakoncolos** (var) | 7:00/2:00 | çamur patlaması, yavaşlatma |
| Koru ara | Stone Golem | **Kaya Devi** (var) | 7:00/2:00 | yerden kaya, itme |
| Koru gizli | Bush | **Çalı** | çalıya vur | 12.5k can, karakter açar |
| Bozkır K1 | Lil Anubis | **Küçük Erlik** | Boss Kapısı | lazer yağmuru |
| Bozkır K2 | Anubruh | **Erlik** | Boss Kapısı | dönen mavi lazer, 20 sn'de akrep, bataklık |
| Bozkır K3 | Judge Anubis | **Yargıç Erlik** | final arenası | silah kapatır, kalkan direkleri, donduran buz |
| Bozkır ara | Sand Golem | **Kum Devi** | 7:00/2:00 | alan kapatma |
| Bozkır ara | Scorpionussy | **Akrep Ana** | 7:00/2:00 | zehir; Zehir Şişesi açar |
| Bozkır gizli | Bandit | **Kara Haydut** (var) | Haydut taşı | kement |
| Bozkır gizli | Calcium's Dad | **Kemik'in Babası** | 4 mezar + heykel | 35k can; Mezarlık açar |
| Mezarlık | Jeff/Mike/Ted/Gary | **Dört Tabut** | tabut | her biri anahtar düşürür |
| Mezarlık | Big Bob | **Dev Hortlak** | 4 tabut | şok dalgası, güdümlü hayalet, lav, tek vuruş (sunakta durarak kaçılır) |
| Mezarlık | Spooky Steve | **Kara Kefen** | mahzen sayacı | sonsuz can; Orakçı açar |
| Mezarlık ara | Ghostham the Dead | **Hayalet Beyi** | ara boss | 13:00 / 9:00 / 3:00 kala, Calcium's Dad ile dönüşümlü; saldırıları belgelenmemiş |

Mevcut **Kemik Okçu Başı** ara boss'u ve **Mezar ruhu** etkinliği Megabonk'ta yok, kalır.

**Sunak ve etkileşimler.** Mevcut 9 sunak Megabonk'un 11'ine eşlenir, eksikler eklenir:

| Megabonk | Kara Koru | Etki |
| --- | --- | --- |
| Charge Shrine | Ocak (var) | içinde dur → 3 stat'tan 1; zorluk seçeneklerden biri (+%8…16) |
| Golden Charge | Altın ocak (var) | efsanevi stat |
| Greed Shrine | Açgözlülük taşı (var, ayar) | +25-30 altın, zorluk +%5 |
| Challenge Shrine | Kan sunağı (var) | mor sürü, hepsini öldür → sandık |
| Shrine of Succ | Rüzgâr taşı (var) | tek kullanımlık mıknatıs |
| Boss Curse | Kara sunak (var, genişlet) | aşamadaki bütün boss ve ara bosslar +1 kopya, her kopya sandık; her etkinleşmede birikir |
| Moai | Balbal taşı (var) | 3 ücretsiz eşyadan 1 + güç; Altın Balbal efsanevi |
| Bandit Statue | Haydut taşı (var) | Kara Haydut |
| Skeleton Statue + 4 Graves | **İskelet heykeli** + mezarlar (var) | Kemik'in Babası |
| Coffins, Crypt doors | **Tabut**, **mühürlü kapı** | Mezarlık |
| Bloody Shrine, Totem | — | ayrı tür değil: Bloody Shrine, Boss Curse'ün diğer adı; "Totem" Greed ve Boss Curse için kullanılan ad |
| Shady Guy | Gezgin tüccar (var) | 3 eşya, şapka rengi nadirlik, fiyat süreyle ölçeklenir |
| Microwave | Cadı kazanı (var) | aynı nadirlikten birini feda ederek çoğalt |
| Campfire | **Kamp ateşi** | %25 can |
| Boombox | **Davul** (kös var, genişlet) | hepsini çal → müzik dükkânı |
| Cage + Golden Key | **Kafes** | Yaban'ı kurtar |
| Pots, Pumpkins | Pot (var), **Kabak** | gümüş, tecrübe, can |

Ab-ı hayat pınarı (var) Megabonk'ta yok, kalır.

**8 güç.** Mevcut Şifa (%33 can), Mıknatıs, Kalkan (15 sn), Saat (12 sn) ayarlanır; eklenecekler: **Rüzgâr** (1.8x hız 15 sn), **Mor Yıldırım** (1.5x hasar, 2x saldırı hızı 15 sn), **Altın** (öldürme başına +1 altın 15 sn), **Tengri Ateşi** (yarıçapta herkes ölür, boss'a büyük hasar). Öfke (var) Mor Yıldırım'a dönüşür. Güç çarpanı ve güç düşme şansı statları.

Bitiş ölçütü: 3 harita 3 kademe oynanabilir, 19 boss ve ~45 düşman tabloda, duman testi her boss'u çağırıp devirebiliyor.

**Durum:** tamamlandı. Mezarlık üçüncü biyom (karanlık palet, yoğun sis, 40 fazla pot) ve tek kademe: mühürlü Mahzen (30 öldürme ya da 120 saniye; süre dolarsa ölümsüz Kara Kefen avlar), dört tabut (Cemil, Mahmut, Tahir, Garip ara bossları anahtar düşürür), 4 anahtarla açılan mühürlü kapı, Dev Hortlak (güdümlü hayalet, alev gölü). Açılışı: Kemik ile Kızıl Bozkır'da dört mezar → Kemik'in Babası. Düşman türleri 37 (`KINDS`): harita başına liste ve zaman kapısı; temas zehri (Akrep), yanma (Ruh Alevi), donma (Bekçi Hayalet), sabit Kaktüs, yuvarlanan Kemik Yumağı, altın düşüren Altın İskelet, hayalet kademeleri. Megabonk'un 51 kaydına göre eksik olanlar varyant kadar (Arı, Böcek sayıldı; Kadim Mumya, Kara Hayalet var). Bosslar: Tepegöz üçlüsü (hücum, silah kilidi + iyileştiren direkler), Erlik üçlüsü (dönen lazer, akrep çağırma, bataklık kum, buz mermisi), Dev Hortlak, Kum Devi, Akrep Ana, Hayalet Beyi, dört tabut, Kemik'in Babası, Çalı, Kara Kefen, mevcut üç ara boss ve Kara Haydut: 19. Sunaklar: Kamp ateşi, Tabut, Kafes (Kafes Anahtarı haritada parlar, Yaban'ı açar), Şüpheli çalı. 8 güç: Şifa, Rüzgâr, Mor Yıldırım, Altın, Kalkan, Saat, Mıknatıs, Tengri Ateşi; düşme şansı ve etki süresi statlara bağlı. Kös üçlüsü Davul (müzik seçici) kilidini açar. Silah kilitleri gerçek koşullara çevrildi (Akrep Ana ×3, Kam ile Ruh Alevi, Kemik Yumağı düşürmesi, Dev Hortlak). Yeni düşman ve boss modelleri taban sınıf + boya; özgün modeller Faz 7. Megabonk'un gizli Yaban kafesinde "Altın Anahtar" bulma akışı basitleştirildi: anahtar her Kara Koru aşamasında bir yerde düşer.

### Faz 6. Meta: dükkân, kilitler, görevler, meydan okumalar, başarımlar

**Otağ dükkânı** sistem yükseltmelerine döner. Mevcut 8 stat yükseltmesi (Keskin demir, Kalın deri, ...) Megabonk'ta yok; ilke gereği kalır ama ayrı sekmeye gider.

| Yükseltme | Açılış | Kademe | Fiyat (gümüş) | Etki |
| --- | --- | --- | --- | --- |
| Gümüş | herhangi haritada K1 bitir | 20 | 8-11-18-25-…-442 | +%2.5 gümüş/kademe |
| Yenile (Fal taşı, var) | 20 görev | 6 | 8-15-24-33-43-55 | +1 yenileme/koşu |
| Silah slotu | 25 görev (3.), 45 görev (4.) | 2 | 25 / 125 (3. slot: wiki aralığı 25–125 ve bir fan rehberi 25, megabonk.org 50) | +1 slot |
| Atla | 30 görev | 6 | 8→55 | +1 atlama/koşu |
| Tom slotu | 35 görev (3.), 55 görev (4.) | 2 | 35 / 135 | +1 slot |
| Çıkar (Kara liste, var) | 40 görev | 6 | 8-15-24-33-43-55 | +1 havuzdan çıkarma/koşu |
| Toggler | 40 kilit satın al | 1 | 50 | açık içeriği havuzdan kapat |
| Davul (müzik) | Koru'daki bütün davulları çal | 1 | 5 | müzik seçici |

**Kilit ekonomisi.** Koşul → gümüşle satın al. Fiyat merdiveni 9-44 arası (karakter), 21 civarı (eşya). Toplam 100'e yakın kilit: 19 karakter, ~23 silah, 10 tom, ~50 eşya, 2 harita, kademeler, ~60 kostüm.

**Görevler (~141).** Kategoriler: karakter 18, silah 22, tom 10, eşya 43, genel 15, meydan okuma 13, kostüm 20. Görev sayısı dükkânı açar (20/25/30/35/40) ve Aşıkçı'yı (100). Mevcut 24 görev bunlara katılır. Tam liste megabonk.wiki/wiki/Quests ve destructoid "every quest" rehberinden alınacak; her görev için `{k, n, f, ul}` satırı.

**Meydan okumalar (~30).** Harita + kademe başına, koşuda 1 etkin, gümüş 1.5-2x, tamamlayınca kalıcı +%1 gümüş, sıralamaya yüklenmez. Çekirdek liste: **Kırılgan** (tek vuruşta öl, 1.6x), **Turbo** (sandık −%96, 5x ölçek), **Uyuyan** (hareket etmeden Son Dalga'ya ulaş), **Sürü** (2x düşman, 0.75x tecrübe, 1.5x hız), **Küçük** (0.8x hasar, hız, boyut), **Çıplak** (eşyasız), **Hiper** (2x tecrübe ve altın, 4x ölçek), **Eyvah / Vay / Yandık** (1.25x / 1.5x / 2x düşman canı, hasarı, hızı), **Hızlı Koşucu**.

**Başarımlar (139).** Yerel liste + ilerleme ekranı. Çoğu gizli (gizli karakter, boss, eşya). Şapkalar başarımdan açılır. Rütbe 100 ve kostüm görevleri buraya bağlanır.

**Koşu sonu.** Silah başına hasar grafiği, kazanılan gümüş, yeni tamamlanan görevler ve açılan kilitler, R basılı tutarak hızlı yeniden başlat. Mevcut öldürme/süre/aşama kalır.

Bitiş ölçütü: görev tablosu 141+ satır, meydan okuma seçici menüde, başarım ekranı var, `kk_meta` göçü eski kayıtları bozmadan geçiyor.

**Durum:** tamamlandı. Görevler 141+ (karakter 18, silah 23, tom 10, eşya 50, şapka 21, harita ve genel). 50 eşya Megabonk'taki gibi kilitli ve görevle açılır. Otağ beş sekme: Kalıcı güçler (görev ve kilit sayısı kapıları artık zorunlu: Yenile 20, Silah slotu 25, Atla 30, Tom slotu 35, Çıkar 40 görev; Toggler 40 kilit), Kilitler, Görevler, Havuz (Toggler: açık silah, tom ve eşyaları havuzdan çıkar), Başarımlar (her görev ve meydan okuma tamamlaması zaman damgasıyla). 30 meydan okuma menüde seçilir, harita + kademe başına ayrı tamamlanır, koşu gümüşünü 1.1-1.7 kat artırır, tamamlanınca kalıcı +%1 gümüş; meydan okumalı koşu sıralamaya yüklenmez. Koşu sonu ekranı silah başına hasar çubukları ve yeni açılanları gösterir. Megabonk'un 139 başarımına karşılık bizde görev ve meydan okuma tabanlı 170+ başarım kaydı var; ayrı bir başarım tablosu tutulmadı. Kostüm koşulları görev değil, doğrudan kostüm seçicide kontrol edilir (Megabonk'un 20 kostüm görevi).

### Faz 7. Arayüz, ayarlar, sıralama, cila

1. **HUD.** Sol üst altın, sağ üst sandık fiyatı, sayaç, öldürme, boss çubuğu, mini harita simgeleri (beyaz pot, sarı sandık, yeşil sunak, kırmızı ok boss kapısı, kırmızı kuru kafa boss, soluk kırmızı açgözlülük). Büyük haritaya **sis perdesi**. Hasar sayısı, hasar flaşı, düşük can vinyeti ayrı ayrı kapanabilir. Mini harita boyutu, can rengi.
2. **Seviye ekranı.** Kart kenar rengi nadirlik (yeşil, mavi, mor, sarı). Yenile / Atla / Çıkar sayaçları dükkândan. Sayı tuşuyla seçim ayarı. Envanterde silah aç/kapat.
3. **Ayarlar.** Görüntü: çözünürlük ölçeği, V-Sync, FPS sınırı, FOV, kamera uzaklığı, hareket bulanıklığı, bloom, gölge, parçacık yoğunluğu, parçacık ve mermi saydamlığı. Oyun: kamera sarsıntısı, hedefleme modu, rastgele hedef ağırlığı, hızlı yeniden başlat, sıralama yükleme ve görünürlük. Gelişmiş: komut konsolu. Tuş atama (bizde var, Megabonk'ta yok, kalır).
4. **Sıralama.** Küresel tek tablo (skor = öldürme), meydan okuma koşuları hariç, karakter adı görünür. Kahraman başına sekmeler kalır.
5. **Kodeks.** Karakter seçiminde stat, rütbe, kostüm. Görev listesi ve koleksiyon ekranı. Bestiary Megabonk'ta yok, bizde opsiyonel.
6. **Ses.** 23-24 parçalık müzik listesi hedefi (bizde Hicaz sentez; makam çeşitlenir: Hicaz, Hüseyni, Nihavend, Segâh), davul dükkânı ile seçilebilir. "Bonk" karşılığı tok vuruş sesi, kritik sayı büyümesi.
7. **Performans.** Geç oyunda FPS hedefi (Spooky yaması bunu düzeltti): 400 hayalet + 2.400 parçacık, orta cihazda 60 FPS. Mobil dokunmatik otomatik etkileşimden tehlikeli sunaklar çıkarılır.

Bitiş ölçütü: ayar sayısı 30+, sis perdesi, nadirlik renkli kartlar, konsol; duman testi mobil görünümde örtüşme kontrolü yapıyor.

**Durum:** tamamlandı. Ayarlar 29 anahtar (hareket bulanıklığı Faz 8): FPS sınırı, gölgeler, parçacık yoğunluğu ve saydamlığı, hasar flaşı, düşük can vinyeti, mini harita boyutu, can rengi, sayı tuşuyla seçim, rastgele hedef ağırlığı, hızlı yeniden başlat (R basılı), sıralamaya yükleme ve görünürlük, müzik makamı (Davul ile açılır: Hicaz, Hüseyni, Nihavend, Rast, Segâh; haritaya göre otomatik), komut konsolu. Mini haritada boss ve ara boss kuru kafası, soluk açgözlülük taşı, boss kapısı oku; büyük haritada sis perdesi. Duraklatma ekranında silah aç/kapat. Sıralama satırlarında harita, kademe ve çıkış işareti; meydan okumalı koşular yüklenmez. Otağ'a Koleksiyon sekmesi (silah, tom, eşya, görülen düşmanlar). Dokunmatikte otomatik etkileşim artık tehlikeli sunakları (açgözlülük, kara sunak, haydut, kan sunağı, tabut, çalı) ve boss kapısını atlar; kapı etiketinde çağırma düğmesi var. Faz 7'de açık kalan üç madde (özgün görünümler, bestiary, hareket bulanıklığı) Faz 8'de kapandı. Megabonk'ta olmayan tuş atama bizde de yok.

### Faz 8. Kalanlar: görünüm katmanı, hareket bulanıklığı, bestiyer, tipler

Faz 4 ve 5'te "sonraya" bırakılan ve Faz 7'de yapılmayan maddeler tek seferde.

1. **Aksesuar katmanı.** `geo/accessories.js`: kahraman, düşman türü ve boss başına kemiğe bağlı parça listesi (`ACC.hero`, `ACC.kind`). Parça: kemik, şekil (kutu, küre, koni, silindir, halka, düzlem, sekizyüzlü), renk, konum, ölçek, dönüş, parıltı, saydamlık. `attachAcc` parçayı iskeletin kemiğine çocuk olarak ekler; havuzdan dönen düşmanlar parçalarını korur. 14 yeni kahraman (Tunç siperlik ve omuzluk, Kemik kafatası maskesi ve kaburga, Pehlivan kuşak, Yaban yele ve sopa, Haydut bandana ve fişeklik, Umay kanat ve hale, Aşıkçı zar kesesi, Gökçe yıldız tacı ve küre, Şahmeran yılan kuyruğu ve başlık, Anka alev kanat ve ibik, Çalı yaprak topları, Tulpar at maskesi ve kanat, Okçu sadak ve yay, Orakçı kukuleta ve tırpan), 19 düşman türü (Böcek anten, Arı kanat ve iğne, Hortlak yama, Mumya sargı, İskelet kaburga, Ruh Alevi alev, Bekçi Hayalet zincir, Kara Hayalet kızıl göz, Hayalet Beyi taç, Kaktüs ve Kaktüs Okçu diken, Kemik Yumağı kemik halkaları, Kadim Mumya sargı ve taç, Altın İskelet taç ve kemer, Akrep ve Akrep Ana kuyruk, iğne ve kıskaç, Kum Devi kaya parçaları, dört tabut ara bossu, Kemik'in Babası kafatası, Çalı yaprak ve meyve, Direk kristal) ve 3 boss (Erlik boynuz, asa ve kristal; Dev Hortlak taç ve kaburga; Kara Kefen kefen perdeleri ve kızıl gözler). Parçalar sınıf model ölçülerine göre yerleştirilir (ölçüler dosyanın başında).
2. **Hareket bulanıklığı.** `SET.mb`; `AfterimagePass` composer'da RenderPass'ten hemen sonra, yalnızca yüksek kalite ve ışıma açıkken çalışır. Ayarlar menüsünde onay kutusu, `mbApply` anında uygular.
3. **Bestiyer.** Otağ'da yeni sekme: her düşman türü için sınıf, can, hız, hasar, hayalet kademesi, davranış bayrakları ve toplam öldürme; görülmeyen türler `???`. Bosslar harita ve kademeye göre, saldırı profilleri ve devirme sayısıyla (`bossk_<harita><kademe>` sayacı).
4. **Tip tanımları.** `data/types.d.ts`: StatKey, StatFx, Weapon, Tome, Item, Hero, EnemyKind, BossProfile, Quest, Challenge, MapDef, Shop, Meta. Derlemeye girmez; düzenleyici desteği içindir.
5. **Geçici koşullar.** Gökçe (Girdap + 6 meydan okuma) ve Tulpar (Uçan Hançer + 2 meydan okuma) artık gerçek meydan okuma sayısına bağlı; Yaban, Çalı ve Orakçı açıklamaları güncel. Mezarlık'ta 30 turuncu kabak (`kb` kırılabilir; pot sayacına ve `pot` kancasına girer).

**Durum:** tamamlandı. Duman testi her aksesuarlı kahraman ve türde parça sayısını, havuz anahtarını ve aksesuarsız türlerin temiz kaldığını, hareket bulanıklığı geçişini, bestiyer satırlarını, Gökçe ve Tulpar koşullarını ve kabak sayısını doğrular (49 kontrol). Bilerek yapılmayanlar: `$G` bölme ve `window` köprüsünü kaldırma (MIMARI.md teknik borç 1-2; satır içi `onclick` menüleri 60'tan fazla yerde köprüye bağlı, ayrı bir yeniden düzenleme işi), iskeletli düşmanlarda instanced skinning (400 düşmanda ölçülen çizim çağrısı eşiğin altında), elle modellenmiş özgün gövdeler (aksesuar katmanı aynı amacı çok daha ucuza karşılıyor; gövde modeli isteyen karakter çıkarsa `HVAR` + `ACC` birlikte kullanılır). Denge notları: kademe çarpanı `TIERM` otomatik koşu ölçümüyle [1, 1.6, 2.15] yapıldı ("Oyun dengesi", 5 Kasım 2026), elle oyun testi hâlâ gerekli; Kan Tomu can çalması Megabonk mekaniğine çekildi; nadirlik ve görev değerleri sonradan teyit edildi (Faz 10 ve 5 Kasım 2026).

### Faz 9. Performans ve Megabonk eşleşme denetimi

İki iş: oyun içi takılmaların ölçülüp kapatılması, sonra Megabonk ile madde madde karşılaştırma (decompile verisi: lukeod/megabonk_research `mechanics.md`, `enums.md`, `items.md`; Bonkipelago enumları; megabonk-asset listesi) ve eksiklerin uygulanması.

**Performans (ölçülen).** Chrome DevTools profili, 300 karışık düşman ve 8 patlayıcı silahla:

1. **Shader derlemesi oyun ortasında.** three.js her malzeme/nesne bileşimi için ilk çizimde program derler; 20 saniyelik dövüşte 23 yeni program, profilde 4-8 saniyelik tek görevler (`getShaderInfoLog`, `onFirstUse`). İlk patlama, ilk hayalet, ilk boss, ilk kademe geçişi takılması buydu. Çözüm `engine/warm.js`: oyunda görülebilecek her bileşimden (iskeletli × normal/hayalet 3 kademe/hırsız/haydut, düz × mat/saydam/çift yüzlü/sis kapalı/dokulu, standart × köşe renkli/saydam/düz gölgeli/su/zemin kancası 3 biyom, instanced, sprite, nokta) temsilî nesneler menüde görünmez boyutta sahneye konur, `compileAsync` ile (KHR_parallel_shader_compile) arka planda derlenir, iki kare sonra kaldırılır. Sonuç: koşu boyunca 0-1 yeni program. Üretimde `renderer.debug.checkShaderErrors` kapalı (derleme günlüğü eşzamanlı okunmuyor).
2. **Çift matris geçişi.** `loop` zorlamalı `updateMatrixWorld(true)` ile bütün sahneyi, ardından renderer bir daha geziyordu. Şimdi loop zorlamasız tek geçiş, `sc.matrixWorldAutoUpdate = false`.
3. **Dinamik çözünürlük adımı.** Her adım render hedeflerini (HDR MSAA + ışıma zinciri) yeniden ayırıyordu; .1 adım/3 sn yerine .2 adım/4 sn.
4. **Mini harita 30 Hz.**
5. **Ölçüm.** Konsolda `perf`: fps, 5 saniyelik pencerede en uzun kare ve 50 ms üstü kare sayısı, çözünürlük, düşman, çizim çağrısı, program, geometri, doku, ön-derleme süresi. Duman testi: ön-derleme bitti ve koşu boyunca yeni program derlenmedi.

Daha önce var olanlar (değişmedi): düşman animasyonu uzaklığa ve kamera arkasına göre seyreltilir, doğuş damlatılır, ses tekrarı sınırlı, havuzlar.

6. **Instanced skinning** (`engine/iskin.js`). Her düşman kendi SkinnedMesh'i ve kemik dokusuydu: 400 düşman = 400 çizim çağrısı + 400 doku yüklemesi + gölge geçişinde bir o kadar. Şimdi aynı model anahtarı ve malzemeyi paylaşanlar tek `InstancedMesh`; kemik matrisleri batch başına tek float dokuda, vertex shader `gl_InstanceID` satırından okur, gölge için aynı deformasyonu yapan derinlik malzemesi, vuruş flaşı yuva başına attribute. Mat aksesuarlar geometriye kemik ağırlığıyla gömüldü (ayrı mesh değil). Ölçüm (temiz sahne, 400 karışık düşman): çizim çağrısı 152 → 162 (önce ~550), 11 batch. Duman testi: 400 düşmanın sahneye eklediği çizim çağrısı 80'in altında.

**Eşleşme denetimi: uygulananlar.**

1. **Dövüş formülleri (decompile).** Zırh doğrusal `hasar × (1 − zırh)`, %100 bağışıklık; boss darbeleri zırhın yarısını, final boss dörtte üçünü deler (Son Dalga sürerken bütün darbeler de yarısını, 6 Kasım 2026). `Alınan hasar` ve `Darbe sonrası koruma` statları artık işliyor. İnfaz: boss ve ara boss ölmez, azami canının %2'sini kaybeder (mermi başına bir kez). Kontrol sınırı: 20. dakikadan sonra donma ve sersemleme süresi dakikada %10 azalır (en az beşte bir). Oyuncuda Kanama (haydut darbesi, 4 sn %2/sn) ve Boss Zehri (boss teması, 6 sn %3/sn).
2. **Hareket.** Düşme hasarı (24 birim/sn üstü iniş; `Düşme hasarı azaltma` statı; Yaban ve su bağışık). Tavşan zıplaması herkese açık (iner inmez zıplayan hız biriktirir, Gölge iki kat).
3. **Ölü statlar.** `Tüccar indirimi`, `Patlama beklemesi` (eşya tetik aralıkları), `Düşman boyutu`, `Düşman ölçeklenmesi`, `Sekme` (bütün mermilere ek sekme) artık işliyor. `Evrim`, `Kutsallık`, `Kötülük` tanımlı ama etkisi Megabonk'ta da doğrulanamadı (bkz. yapılmayanlar).
4. **Eşya sabitleri (decompile).** Acı Köfte %25 tetik / %65 sıçrama; Pehlivan Yüzüğü anlık cana göre; Yılan her vuruşta 4 yığın, +%40 zehir, +%5 patlama beklemesi; Ruh Biçici 2 mermi × yığın; Ayna 1 + 0.25n yansıtma; Altın Kalkan 6 + seviye×0.2 (en çok +20); Nine Toniği +%2 kritik, kritiklerin yarısı; Hayalet Kefeni 4'e kadar hayalet yığını (+%25 saldırı hızı, +%50 hasar); Yıldırım Küresi sersemletme %25; Fener doldurulan ocağın çevresinde saniyede %2.5; Cellat Hançeri dakikada en çok +%200.
5. **Lanetli nadirlik.** Olumsuz eşyalar (Kımız, Lanetli Eldiven, Kemik Bacak, Eski Maske, Suluk, Keloğlan, Yeşil Kese) `cor: 1` ile mor "Lanetli" etiketi alır; havuz ağırlıkları değişmedi. Kilit koşulları: Lanetli Bebek 10 ölüm, Lanetli Eldiven koşuda Lanet Tomu 10, Kemik Bacak koşuda zorluk +%40.
6. **Etkileşimler.** Denge taşı (en düşük seviyeli silah ve tomu en yükseğe eşitler; etki tahmin), Hediye (Kara Koru'da seyrek; Noel Başlığı ve üç eşya), Kızıl Bozkır'da çalı yumağı kırılabiliri, tüccar kademesi (şapka rengi: kara/mavi/mor/sarı = sıradan/seçkin/destansı/efsanevi, şans işlemez), Ocak zorluk artışı yarı yarıya ihtimalle.
7. **Meta hacmi.** Görevler 146 → 210: meydan okuma kategorisi (30), kostüm kategorisi (21, karakter başına Kademe 3 final boss), genel ekler (11). Ayrık başarım tablosu `ACHD` (113 kayıt: öldürme eşikleri, boss, koşu, zafer, harita kademeleri, her karakterle zafer, rütbe, silah 40, tom 99, görev ve meydan okuma eşikleri, şapka, kostüm, sunak, pot, sandık, elit, hayalet, uzatma, çıkış, ölüm...) ve Otağ'da Başarımlar sekmesi. Şapkalar görevle açılır, gümüşle alınır (15; Noel 18); bu aynı zamanda şapka sahipliğinin hiç atanmaması hatasını kapattı.
8. **Silah ve durum.** Ayaz artık donduran aura (Megabonk Frostwalker IceAura): içindekiler yavaşlar, üçüncü darbede donar. Keskin Nişancı "Baktığın yön" hedeflemesinde bakılan yöne ateş eder (crosshair). Yankı durumu: yıldırım kritikleri 3 sn yankı bırakır, yankılı düşmana gelen darbelerin %30'u yarım saniye sonra tekrar vurur (kaynak tahmin). Sekme Tomu (ETome Bounce; 1.000 sekme göreviyle açılır). Büyük harita saydamlığı ayarı. Elit tacı.

**Durum:** tamamlandı. Duman testi 54 kontrol: doğrusal zırh ve boss delmesi, alınan hasar ve koruma statı, Lanetli etiket, Sekme Tomu, görev/başarım tabloları, Yankı, kontrol sınırı, Ayaz aurası, Denge taşı, Hediye, şapka satın alma, tüccar kademesi ve indirim, düşme hasarı, zıplama.

**Bilerek yapılmayanlar ve doğrulanamayanlar.** ~~Duvar koşusu ve duvara yaslanınca düşme hasarının iptali~~ (ikisi de sonra eklendi: `update.js` duvar koşusu bloğu ve `wallhug` sayacı). Buz yüzeyi (haritalarda buz yok). Megabonk hız eğrisi `((stat−1.5)×0.25+1)` (birimleri doğrulanamadı, mevcut denge korundu). Darbe sonrası koruma 0.15 sn yerine 0.9 sn × stat (düşman temas hasarı buna göre dengeli). Denge Tomu (enum'da var, etkisi bilinmiyor). Evrim/Kutsallık/Kötülük statlarının etkisi. ~20 düşman varyantı (liste kaynağı ağ politikasıyla engelli: megabonk.wiki, megabonk.org, bonkmaster, survivorsdb). Başarım listesinin birebir Steam metinleri (sayı 102-108 arası; bizde 113 kendi tanımımız). Görev listesinin tam metni (210; Megabonk 230+, metinler bizim). Kademe çarpanı `TIERM` ile Megabonk'un harita kademesi hasar çarpanları (0.75/0.95/1.1) anlam farkı korundu.

### Faz 10. Wiki doğrulaması: düşman listesi, kilit koşulları, dükkân, kurallar, kostüm ve şapka

Ağ sınırı kalkınca ikinci bir denetim: megabonk.org, bonkmaster.com, survivorsdb.com, Fextralife veri tabanları (51 düşman, 264 görev satırı, 22 şapka, 40 etkileşim, 21 karakter), Steam'in resmî başarım listesi (139) ve iki topluluk rehberi. megabonk.wiki hâlâ erişilemiyor (TLS); megabonkwiki.net yapay zekâ üretimi ve oyun verisiyle çelişkili, kullanılmadı.

1. **Düşmanlar (Fextralife 51 satır).** 12 eksik tür eklendi: Güçlü Gulyabani, Gulyabani Tankı, Patlayan (oyuncuya değince fitil, yarım saniye sonra patlar ve havaya fırlatır), Zırhlı İskelet ve Zırhlı Tozlu İskelet (düz hasarın yarısı), Mumya Tankı, Büyük Akrep, Tozlu İskelet, Uçan Kafa, Zombi (Mezarlık), gizli Kurbağa (Kara Koru'da aşama başına bir, yaklaşınca kaçar, yakalayınca şapka), Mavi İskelet (seyrek, vurulunca kaçar, öldürünce bir seviye bırakır). Kadim Mumya 70/40, Kemik Yumağı 7/9/11 olarak düzeltildi. Dev Karakoncolos darbesi 2 sn yavaşlatır. Toplam tür 51.
2. **Kilit koşulları (Steam metinleri).** Silahlar: Cellat Palası 12.500 Kılıç öldürmesi, Işık Hüzmesi Tulpar ile Bozkır K2, Ayaz Buz Küpü ile 1.000 donma, Yatağan ve Çakaralmaz çalı yumağından (%5; 1. aşama / 2. aşama K2+), Kemik Bumerang gizli Parlak Muz, Havai Fişek Tunç ile 15.000, Tırpan yalnız Dev Hortlak. Karakterler: Umay Diken 9, Orakçı Kara Kefen'i infazla öldürme, fiyatlar (Gökçe 28, Şahmeran 26, Çalı 21, Tulpar 19), Kızıl Bozkır kapısı Tunç ile. Eşyalar: 14 eşya kilit kazandı (Deri Çizme, Dev Avcısı, Demir Anahtar, Buz Kristali, Kaktüs, Demir Yumruk, Sabır Şerbeti, Sülük Taşı, Zehir Fıçısı, Nazar Gözlüğü, Ejder Ateşi, Eski Maske, Yılan, Balkabağı), 14 eşya kilitten çıktı (Megabonk'ta varsayılan: Dev Çatal, Tokmak, Acı Köfte, Buz Küpü, Kararsız Kan, Yıldırım Eldiveni, Kan Eldiveni, Tılsımlı Kandil, Çakmak Taşı, Ocak Başı, Hayalet Kefeni, Ayna, Yeşil Kese, Altın Halka), 19 koşul gerçek metne çekildi. Genel: 45 ve 55 görevde ikinci silah ve tom slotu, Duvara Yaslanma (10 kez), meydan okuma 5/10/20/30. Görev sayısı 225.
3. **Dükkân.** Gümüş kesesi 20 kademe (8…442), silah slotu kapıları 25/45 görev, tom slotu 35/135 gümüş ve 35/55 görev, Davul 5 gümüş.
4. **Koşu kuralları.** Aşama süreleri 10/9/8 dk; ara boss 1-2. aşamada 7:00 ve 2:00 kala, 3. aşamada 6:30 ve 1:30 kala; akın 6:00/3:00 ve 5:30/4:00 kala. Son Dalga hayalet kademeleri: 1. dakikada Kara, 6. dakikada Mor, 12. dakikada Kızıl. Açgözlülük taşı +%5 zorluk ve 25-30 altın. Altın Balbal (beşte bir, üç efsanevi). Denge taşı gerçek etkisi: bir statı ikiye katlar, bir başkasını yarıya indirir (yalnız Mezarlık, iki tane). Hediye yalnız Noel Başlığı. Çalı yumağı tecrübe ve silah şansı. Duvara yaslanınca (bir engele bitişik iniş) düşme hasarı yok.
5. **Tomlar.** Denge Tomu (her statta küçük artış; Megabonk "Gain {value} in every stat"), İstifçi Tomu (her seviye haritada açık sandık), Kumar Tomu (etki tahmin: +%15 hasar, −%5 can). Sekme Tomu Kara Koru'ya özgü kaldı. Tom sayısı 27.
6. **Kostüm ve şapka.** Kostüm fiyatları 4/1/4/4 gümüş; beşinci kostüm Mahzen (ilk Mahzen'i karaktere göre 16-24 saniyeden kısa sürede açmak). Şapka koşulları Steam metinlerine çekildi (kurbağalar gizli kurbağa, tüccar şapkaları 4 kademe 100/80/60/50 alış, Kazan 50 kullanım, Keloğlan 100.000 yumruk, Taç her karakterde rütbe 100, Peynir 8 Küflü Peynir + Yılan ile K3, Uzun Fes 300.000 ve Silindir 100.000 tek koşu Koru öldürmesi, Çömlek Orakçı ile 4 Kazan, Demir Tolga dört kılıçla K3, Sarık Kam ile üç silah 40, Kalpak Gölge ile 2 Kara sunak); üç yeni şapka: Güneş Gözlüğü, Şerif Şapkası, Pilot Miğferi. Şapka sayısı 28 (Kara Koru'ya özgü 5 tanesi kaldı). Şapka gümüş fiyatı hiçbir kaynakta yok; 15/18 kaldı.
7. **Başarımlar.** Megabonk'ta başarımlar kilit görevlerinin kendisi; genel eşik başarımı yok. Otağ'da iki liste: "Megabonk başarımları" (`ACHM`: her kilit görevi + dükkân kapıları + meydan okuma sayıları, 120+) ve "Kara Koru başarımları" (`ACHD`, 113, bize özgü).
8. **Eşya düzeltmeleri (kaynak metinleri).** Yonca %10; Pehlivan Yüzüğü her 100 azami can için +%20; Kartal Gözü yalnız canı %90 üstü düşmana; Altın Halka hiçbir şey yapmaz (Megabonk'ta da öyle); Demir Yumruk +%20; Lahmacun öldürmede yere şifa bırakır; Albastı Sürüsü etkileşimde hayalet çağırır; Erlik Ruhu +%0.1 (en çok +%100); Erlik Kanı +0.5 (en çok 200); Sülük Taşı yenilenmeyi yarılar; Kazan yalnız silah, Kam Külahı yalnız tom, azalan paylarla; Zaman Mührü ölümcül darbede bir kez kurtarır; Zaman Büküğü 8+2n sn (en çok 15); Top Güllesi öldürmede; Ocak Başı'ndan silah satırı bonusu Örs'e; Lanetli Bebek tek hedef (yığın başına +1).

**Durum:** tamamlandı. Duman testi 57 kontrol.

**Doğrulanamayanların kararı (Faz 10 ek turu).** Wayback Machine ve megabonk.wiki bu ortamdan erişilemedi; arama motoru parçaları, resmî Steam yama notları ve ikincil rehberlerle şöyle kapatıldı:

- *Şapka gümüş fiyatı.* Yalnız Noel Başlığı 18 gümüş doğrulandı (gamerblurb). Diğerleri için hiçbir kaynak yok: 15 gümüş kararı korundu.
- *Son Dalga gümüş çarpanı.* Resmî yama notu: tavan 16× → 8×. Bizde de en çok 8× (90 saniyede bir +1). Büyüme formülü yayımlanmamış; bizimki tahmin.
- *Ocak zorluk olasılığı.* Wiki tablosu: zorluk, Ocak'ın 27 stat seçeneğinden biri ve nadirliğe göre %8 / 9.6 / 11.2 / 12.8 / 16 (nadirlik çarpanlarımız 1/1.2/1.4/1.6/2 ile birebir). Zorunlu ya da olasılıklı artış yok; artık üç seçenekten biri olarak çıkıyor, oyuncu isterse alır. Altın Ocak yalnız efsanevi, Anahtar +%7.5: zaten vardı.
- *Hayalet doğuş sınırı.* Hiçbir kaynakta sayı yok; bizimki (230 düşman, dalga başına 4 + süre/40) kaldı. Resmî not: 20. dakikadan sonra hayaletler hızlanır (bizde var) ve kontrol sınırı 15 donma/sersemleme, 20. dakikadan sonra yavaşça düşer: süre çarpanı yerine sayı tabanlı sınır yapıldı (düşman başına 15, dakikada bir azalır, en az 1).
- *Toggler fiyatı.* Wiki ve eski rehber 50 (40 kilit), yeni rehberler 4. Yama notu yok; wiki esas alınıp 50 kaldı.
- *Karakter fiyatları.* Roberto 37 doğrulandı (bizde Orakçı 37). Okçu, Anka, Ayaz, Aşıkçı için kaynak yok; mevcut değerler kaldı.
- *Cadı kazanı.* Wiki: bedel sandık fiyatının %34'ü altın, aynı nadirlikten rastgele bir eşya eritilir; kullanım sıradan 3, seçkin/destansı 2, efsanevi 1 (ikincil kaynak). Uygulandı: kazanın kademesi sıvı rengiyle belli, feda rastgele, altın ister, kullanım bitince patlar (Kazan Şapkası: 50 kazan tüket). "3 kez üst üste" ardışık aynı eşya sayılıyor.
- *Kaos Tomu.* Wiki: "alandan çıkmadan". Ocak alanından çıkış işaretleniyor; üç aşamada da bütün ocakların temiz dolması gerekiyor.
- *Boss erken ölünce.* Wiki'de süre davranışı yok, ikincil kaynaklar çelişkili. Topluluk rehberinin "10 saniye sonra Son Dalga" akışı uygulandı; geçit açık kalıyor.

**Silah ve karakter taban statları (ek tur).** Silahlar survivorsdb'nin v1.0.7 ölçümlerine çekildi: 28 silahın taban hasarı, mermi sayısı, sekme, itme, süre, kritik ve sıradan yükseltme adımları (ör. Kılıç 11 +2, Yıldırım 7 +2, Dönen Kılıçlar 12 +3 iki kılıç, Balta 6 +1.5 iki balta, Kor Halkası 6 +1.4, Ayaz 9 +2 süre 1.6, Girdap 4 +1.3 süre 2, Keskin Nişancı 22 +4, Aşık Kemiği kritik %17 +10). Megabonk'ta silah yükseltmesi olarak bekleme süresi yok (saldırı hızı tomdan gelir), bu yüzden `u` listelerinden `cd` çıkarıldı; yalnız bizde var olan anahtarlar kullanıldı (delme bizde kaldı). Erlik Kılıcı ve Tırpan için ölçüm yok, bizimki kaldı. Karakter taban statları Fextralife'ın 21 satırına çekildi (ör. Alp +50 can %15 zırh −%2 hız; Tunç −60 can 50 kalkan; Tulpar −30 can 10 kalkan %30 hız düşme hasarı yok; Kam %15 şans; Şahmeran %20 alan %20 süre +30 can %10 zırh), zıplama +1 → +%10 ve toplama alanı +1 → +%10 olarak çevrildi; rütbe pasifleri survivorsdb'ye göre (Kemik +%0.75 hasar, Bahadır +%1.5 hasar, Ayaz +%0.75 alan, Gölge +%0.5 kaçınma, Gökçe +%1 tecrübe, Tulpar +%2 toplama, Kara Han yalnız +%1 zorluk).

Mahzen içi sayım artık tam: mühür içine 8 pot ve 2 ücretsiz sandık konur, mühürdeki her pot kırılıp her sandık açılınca Kazan görevi sayılır.

**Kendi içeriğimiz Megabonk kalıbında (ek tur).** Megabonk'ta olmayan her şey Megabonk'un düzenine sokuldu:

- *Silahlar.* Şok Dalgası ve Zehir İzi artık görevle açılıyor (Dönen Kılıçlar ile 3.000 öldürme; 5.000 zehirleme), yükseltme satırlarında bekleme süresi yok, adımlar Megabonk ölçeğinde.
- *Eşyalar.* Kızıl Pençe, Şahmeran Pulu, Nazar Boncuğu, Tunç Kalkan, Simurg Tüyü, Ejder Kalbi, Kurt Postu görevle açılıyor; Pastırma, Pusula, Kan Taşı varsayılan. Bütün açıklamalar Megabonk gibi sayısal (+%12 kritik, +%35 hasar +30 can...).
- *Düşmanlar.* Yarasa ve İskelet okçu Fextralife ölçeğinde açık can/hız/hasar aldı.
- *Dükkân.* Sekiz stat yükseltmesi Gümüş kesesi kalıbına çekildi: 20 kademe, aynı fiyat merdiveni (8…442), küçük adımlar (+%1 hasar, +2 can, +%1 hız/şans, +%5 toplama, +%2 altın/tecrübe, +0.1 yenilenme), görev kapıları 10/15/20/25/30/35/45/50. Miras 10 kademe, 12 görev.
- *Şapkalar.* Beş kendi şapkamız Megabonk gibi karaktere özgü koşullara bağlandı: Kavuk (Kara Han ile Bozkır K3), Boynuzlu Miğfer (Bahadır ile tek koşuda 10.000), Börk (Börü ile 10.000 can çalma), Tülbent (Ayaz ile 500 donma), Baret (Tunç ile bir koşuda 20 sandık).
- *Başarımlar.* Ayrı "Kara Koru başarımları" listesi kalktı; 113 eşik başarımı Megabonk kalıbında gümüş ödüllü görev oldu (20-200 gümüş) ve tek başarım listesine girdi. Görev sayısı 347.

Kaktüs tek tür oldu (Megabonk Cactus Shooter: okçu sınıfı, 15/30/5, yavaş yürür); sabit Kaktüs ve Kaktüs okçu ayrımı kalktı.

**Kalan ekstralar Megabonk karşılığıyla değiştirildi (son tur).**

- *Atılma (Shift)* önce kaldırılmış, sonra kullanıcı isteğiyle geri alındı: Shift ve sağ tık atılma (0.22 sn, 1.6 sn bekleme, 0.3 sn dokunulmazlık, HUD çubuğu ve dokunmatik Atıl düğmesi), C ve kumanda B/LB/LT kayma.
- *Güçler* Megabonk'un altısı: Mor Yıldırım (Rage), Altın, Kalkan, Saat, Mıknatıs, Tengri Ateşi (Nuke). Rüzgâr kalktı; Şifa artık güç değil, Lahmacun eşyasının öldürmede bıraktığı yiyecek (Megabonk Borgar).
- *Ab-ı hayat pınarı* → **Meydan okuma sunağı** (Megabonk Challenge Shrine): 1. aşamada, meydan okuma seçilmemişse belirir; listeden seçilen meydan okuma anında uygulanır. Menüdeki ön seçim de duruyor.
- *Kamp ateşi* → **Mezar taşı** (Megabonk Gravestone): yalnız Mezarlık'ta, 15 tane; her biri tecrübe +%10, zorluk +%5.
- *Bekçi Hayalet* kaldırıldı (Mezarlık listesi Megabonk'un sekiz türüyle aynı). Tür sayısı 49 + gizli Direk.
- *İyileştiren direk* → **Direk** (Megabonk final boss pylons): boss üç direkle korunur, hasar almaz ve iyileşir; oyuncu her direğin yanında 3 saniye durup doldurur, üçü dolunca boss hasar alır. Direk düşman değil, bestiyerde görünmez.
- Kös/Davul zaten Megabonk'un Boombox'ı.

Artık Megabonk'ta karşılığı olmayan bir sistem kalmadı; isimler, modeller ve mitoloji teması Kara Koru'nun.

### Kapatılan farklar (üçüncü denetim, 3 Kasım 2026)

Üçüncü denetim turunun (Fextralife, survivorsdb, decompile notları, megabonk.org, Steam yama notları) 20 başlığı aynı sırayla uygulandı. [K] kaynak onaylı, [T] tahmin ya da çelişkili kaynak.

**Koşu akışı ve bosslar**
1. [K] Final boss evreleri: arenaya yalnız ilk silah açık girilir (`P.wdis`), %75/50/25 can eşiklerinde boss dokunulmaz olur ve üç direk doğar; direkler dolunca bir silah daha açılır, boss ölünce hepsi. Arena süresi 10 dk, mavi küre 1 sn donma (`P.frzP`). ✔
2. [K] Boss taban canları ve hasarları `BOSSP.hp/d`, ara boss ve tabut hayaletleri `KINDS.bhp/bd` ile sabit; formül yalnız bu alanı olmayanlara kalır. ✔
3. [K] Aşama boss'u bedava sandık bırakır ve haritadaki bütün kristalleri çeker (`o.pull`). ✔
4. [K] Kara sunak sayacı (`P.bossCur`) aşama başında sıfırlanır. ✔
5. [K] Zorluk cana tam, hasara yarım (`dsc`), hıza %15, doğuş aralığına %30 işler. `DMK()` kendisi değişmedi; hasar ölçeği doğuşta uygulanıyor. ✔
6. [K] Mezarlık 15 dk; ara boss 2/6/12. dakikada, akın 3/7/13. dakikada; çıkışta boss yok. ✔

**Harita içerikleri**
7. [K] Ocak 15, Açgözlülük 8, kazan 1-2 (Mezarlık 3-5), Mezarlık'ta sunak havuzu ikiye katlanır. ✔
8. [K] Pot tablosu: 40 küçük + 15 büyük + 6 küçük ve 1 büyük gümüş pot (gümüşler `p.sv`, büyükler ×3 damla); Mezarlık'ta 50 küçük / 20 büyük kabak. ✔
9. [K] Yumurta (16: üç güç-up) ve İskelet Kralı heykeli (17: `iskeletkrali` ara bossu) sunakları eklendi. ✔

**Seviye ve dövüş**
10. [K] Stat satırı sayısı nadirliğe eşit (Sıradan 1-2, Seçkin 2, Nadir 3, Destansı 4, Efsanevi 5). ✔
11. [K] Ocak havuzu 27 stat; eksik seçenekler (mermi hızı, süre, itme, kalkan, kaçınma, can çalma, diken, lanet, zorluk) kaynak değerleriyle, kaynakta adı okunamayan 6 slot en yakın statlarımızla (kritik hasarı, zıplama, düşme azaltma, etki süresi, iyileşme, elit doğma) dolduruldu. ✔
12. [K] Donma ve sersemleme varsayılan 3 sn (etki süresiyle çarpılır). Yanma hasarı saniyede hasar statı × seviye × 0.5 + 1 (`status.js addStatus` varsayılanı; silaha özel `d` verilirse o kalır). ✔
13. [K] İtme Tomu +%20, Bilgelik Tomu +%9. ✔
14. [K] Darbe sonrası koruma 0.15 sn × `hurtcd`. Temas hasarı boss/ara boss `d` alanlarıyla dengelendi. ✔

**Karakter ve içerik**
15. [K] Alp'in başlangıç silahı Kılıç. ✔
16. [K] Pasifler: altına göre hasar yalnız Okçu'da, Börü öldürme sayısı hasarı kaldırıldı, Umay kalkan yokken +%150 saldırı hızı, Kemik vurulunca %25 kayıp, Ayaz donmuş düşman başına +%1.5 (`$G.frzN`), Tulpar 30 m yolda 5 düşmana yıldırım. ✔
17. [K] 14 eski türün can/hız/hasar değerleri kaynağa çekildi; İskelet Koru, Hortlak Mezarlık listesinde. ✔
18. [K] Atkı havadayken +%50, Sargı +35 yenilenme/dk, Zaman Mührü açık, tek Tüy, Zaman Bileziği yalnız tecrübe, Yasak Şerbet toplam 100 kritik, Hortum Taşı yalnız Ocaklar. ✔
19. [K/T] Şahmeran 50.000 ve 100.000 öldürme kostümleri (`only`), Gümüş kesesi "bir Kademe 1 bitirince" kapısı (`win: 1`), Otomatik seviye ayarı (`SET.al`). ✔

**Hareket**
20. [K formül, T birim] Hız eğrisi ((stat−1)×0.375+1), [1,4] sınırlı. Düşme bağışıklığı Gökçe'de. Duvar koşusu: yüksek bir engele doğru koşarken 1 sn'e kadar dikey tırmanış (`P.wrT`, yere inince dolar), boşluk tuşu duvar normali yönünde sıçratır ve sayacı yarıya kadar doldurur; süre ve hızlar tahmin. ✔ [T]

Kalan açık yok. Kaynaksız: elit çarpanları ve ilk elitin bedava sandığı, nadirlik taban ağırlıkları, yenile/atla/çıkar kademe fiyatları, Toggler fiyatı, şapka fiyatları.

### Arayüz ve görsel düzeltmeler (3 Kasım 2026, kullanıcı geri bildirimi)

- **Giriş menüsü** tek uzun sütundan üç sabit sayfaya bölündü: Ana menü (Oyna, Otağ, Sıralama, Ayarlar, Nasıl oynanır), Adım 1 Kahraman (4 sütunlu liste, seçilenin ayrıntısı, rütbe, kostüm ve şapka), Adım 2 Harita ve kademe (harita kartları, kademe düğmeleri, isteğe bağlı meydan okuma). Her sayfa 720 piksel yükseklikte kaydırmasız sığar. Enter ileri, Esc geri, ok tuşları yalnız kahraman sayfasında karakter değiştirir. `$G.menuPg`, `menuPage(k)`.
- **Ayarlar** altı sekmeye ayrıldı: Oyun, Görüntü, Ses, Arayüz, Kontroller, Gelişmiş (`$G.setPg`, `setTab(k)`).
- **Temas hasarı:** 0.15 sn oyuncu koruması tek başına bir düşmanın saniyede altı kez vurmasına yol açıyordu. Düşman başına 1 sn vuruş bekleme (`e.atkT`) eklendi; Megabonk'ta da düşman saldırısı kendi bekleme süresiyle gider.
- **Minimal HUD (son):** oyun ekranındaki bütün metin kutuları kaldırıldı: İlk adımlar kutusu, hedef metni, durum satırı, aşama/zorluk satırı, "Sıradaki" satırı, sandık fiyatı notu, kısayol şeridi, mini harita açıklaması. Kalan: can/kalkan/atılma çubukları, silah ve tom yuvaları, altın · süre · öldürme, ince yol çubuğu, boss çubuğu, tecrübe şeridi, mini harita, eşya sırası. Dünya etiketleri yalnız 11 m içinde (kapı 30 m, en çok 8 etiket), yazılar küçük. F1 yardımı ve ipuçları ayarı aynen.
- **HUD, Megabonk düzeni (plaka tasarımı geri alındı):** sol üstte etiketsiz can çubuğu (sayı içinde, kalkan mavi dilim `#shdb`), altında ince atılma çubuğu, altında 4 silah ve 4 tom yuvası (`hudSlots`); üst ortada altın · süre · öldürme tek satır, altında aşama adı ve ince yol çubuğu; seviye şeridinin sağ ucunda seviye; sağ üstte ince halkalı mini harita; eşyalar biriktikçe sol altta (`#itr`, `hudItems`); kısayollar ve hedef metni ilk 10 saniye sonra söner. Ekranın ortası boş.
- **Simge tasarımı:** `ui/icons.js svg(n, col)` artık dolgulu "jeton" çizer: koyu kalın dış çizgi, anahtara göre renkli iç çizgi ve yarı saydam dolgu. Renk `iconCol(kind, key)` ile anahtardan türetilir (silahlar sıcak, tomlar serin, eşyalar tam palet); aynı temel şekli paylaşan eşyalar için çeşit simgeler (eldiven ×5, yüzük ×4, kalkan ×4, maske ×3, et ×3) eklendi. HUD yuvaları, seviye kartları, duraklatma ve menü aynı simgeleri kullanır.
- **Özgün simge çizimleri:** `ui/icons.js` içinde fonksiyon simgeler (`c => markup`): 32 silahın tamamı ve 29 sıradan/seçkin eşya çok renkli, dolgulu, kendi siluetiyle çizildi (çelik, ahşap, altın, kemik, ateş paleti `K`). Çizici koyu kalın dış çizgi + ince koyu ayraçlı dolgu üretir; eski çizgi simgeler aynı çiziciden yarı saydam dolguyla geçer. Tomlar kitap çerçevesinde (`svg(n, col, 't')`: renkli kapak, bej sayfa kenarı, kapakta sembol). Yasak Şerbet kadeh (`cup2`) aldı. İkinci tur: 38 nadir/destansı/efsanevi eşya da özgün çizildi; göz, hayalet, fener, pençe, damla, küre, yumruk ve yıldız paylaşan eşyalar ayrı simge anahtarları aldı (eye2/3, ghost2/3, lamp2/3, claw2, drop2, orb2, fist2, star2). Artık bütün silahlar ve 98 eşyanın tamamı kendi çizimine sahip. Üçüncü tur: tom ve Ocak stat sembolleri (kılıç, üç küre, genişleme, itme, mermi hızı, süre, kaçınma, kalkan, diken, gümüş, kaos, altın) çizildi; `cards.js STI` stat→simge eşlemesi Ocak ve Denge taşı kartlarını besler; çizici her dolgulu şekle dikey ışık-gölge örtüsü (`#kkgl`) ekler, yuvalar simge rengine göre yumuşak zemin alır (`--ik`); menü kahraman simgeleri de renkli.
- **Kahraman portreleri:** 21 kahramanın her biri için büst portre (`icons.js h_<k>`): omuzlar kahraman rengi, baş ten, başlık ve ayrıntılar karaktere özgü (Alp miğfer ve sorguç, Kam boynuzlu başlık, Gölge kukuleta, Börü kurt başlığı, Ayaz buz tacı, Kara Han altın taç, Tunç tunç miğfer, Kemik kafatası, Umay hale ve kanat, Şahmeran yılanlar, Anka alevli kuş, Çalı yapraklı çalı, Tulpar kanatlı at, Okçu yay, Orakçı tırpan...). Kahraman sayfası ve ayrıntı kutusunda silah simgesi yerine portre; kilitli olanlar soluk.
- **Mini harita glifleri:** kenar işaretleri koyu konturlu dolgulu şekiller (`glyph`): boss/ara boss kafatası, sandık gövde+kapak bandı, tüccar kapılı çadır, sunak elmas kristal, mahzen mezar taşı, kös davul, kapı ok, oyuncu çentikli ok.
- **Premium katman (tasarım sistemi):** `index.html` artık CSS'in istediği Grenze Gotisch ve Grenze yazı tiplerini yüklüyor (önce Philosopher/Alegreya yükleniyor, başlıklar Georgia'ya düşüyordu). Belirteçler: yarıçaplar, üç yüzey tonu, kıl çizgi, katmanlı gölge, pirinç vurgu. Bileşenler: birincil düğme fildişi gradyan ve bastırma durumu, ikincil düğme koyu gradyan, hap sekmeler, kbd rozetleri. Başlıklar altın gradyan ve alt çizgi, panel ve kartlar gradyan yüzey + kıl çizgi + iç ışık, seçili kahraman/harita kartı turuncu halka, nadirlik kartları üst şerit ve hover'da yükselip ışıma. Arka plan bulanık ve vinyetli, her ekran 320 ms içeri kayar. HUD: çubuklarda parlama, yuvalarda simge rengi halka, seviye şeridi gradyan, mini harita pirinç halka. Ayarlar: özel kaydırıcı, bölümlü seçiciler. Geçiş ekranı başlığı altın gradyan. Eski dikiş ve kilim kuşakları kaldırıldı.
- **Otağ:** sekmeler tek hap içinde, gümüş rozeti başlıkta; kalıcı güç satırları simgeli kartlar (stat simgesi STI'den, diğerleri MUI), seviye pipleri yerine dolu çubuk ve n/20; kilit satırlarında kahraman portresi ve içerik simgesi; görevlerde parşömen/yıldız simgesi ve ilerleme çubuğu; koleksiyon simge ızgarası (`.cg/.ci`, kilitliler gri ve soluk).
- **Seviye kartları ve duraklatma:** kartlar 252 px, üst kenarda nadirlik çizgisi, çerçeve yok; build satırı kartlardan kaldırıldı (HUD zaten gösteriyor). Duraklatma: büyük başlık, dört düğme, silah/tom/eşya satırı, karakter pasifi, silah kartları ve dört sütun istatistik; başlıklar küçük büyük harf.
- **HUD, seviye şeridi:** tecrübe çubuğu Megabonk yerleşimiyle ekranın en üst kenarına 16 px'lik tam genişlik şerit olarak alındı (`#xpw` artık `#hud`'un doğrudan çocuğu); solda seviye rozeti, sağda "Seviye N · x/y"; süre ve aşama satırı şeridin altına, can/altın ve mini harita 14 px aşağı kaydı.
- **Zemin shader'ı** (`engine/gfx.js terrHook`): anizotropik çimen çizgileri ve kümeleri, kuru yamalarda düzensiz kenar ve çakıl benekleri, Kara Koru'da seyrek çiçek benekleri, gürültü türevinden hafif normal dalgası. Hepsi dünya koordinatlı, doku yok.

### Harita yatırımı (3 Kasım 2026)

Üç harita gözden geçirildi; Mezarlık'ın aslında Bozkır üreticisini mor sisle kullandığı görüldü. Yapılanlar:

- **Yeni harita modelleri** (`world/mapm.js`): sarıklı, kırık ve yuvarlak mezar taşları (`tomb(v)`), demir parmaklık parçası (`fence`), fener direği (`lantern`), beşik çatılı türbe (`mausoleum`), kollu kaktüs (`cactus`), tabakalı kaya çıkıntısı (`outcrop`), yassı patika taşı (`pstone`). Hepsi prosedürel, `envG` ile tek geometri, `vegInst` ile instanced.
- **Mezarlık'a kendi dünyası:** arazi (alçak dalgalı toprak, seyrek sırtlar), bataklık ırmağı ve köprü, simgeler (tapınak, balbal çemberi, kule, iki kurgan, dev iskeleti, dikilitaş, göl, sur), gri-yeşil-mor palet, 14 mezar parseli (sıralı taşlar, parmaklık, köşede fener), dağınık taşlar, 5 türbe, ölü ağaçlar, mantar, kemik, sazlık, karga; `fogSheets` yer sisi (gürültülü yarı saydam levhalar, yalnız düz çukurlarda), kül ve ruh zerreleri; sis 52-195.
- **Kızıl Bozkır (ikinci tur):** Kayıp Kervan simgesi (devrik araba, kopuk tekerlekler, yırtık çadır, çömlekler, deve iskeleti, kumda sandık), agave rozetleri, kanyon tabanında kuru dere yatağı rengi, çatlak çamur (shader'da Voronoi çatlaklar) ve iri kayalar, düzlüklerde kum dalgası ve kum sürüklenmeleri, koyu kaya döşemesi lekeleri, mesa eteklerinde kaya çıkıntısı ve tepelerinde kaktüs/agave, vaha çevresinde yeşil çimen ve 8 palmiye, leş üstünde dönen akbabalar, hortumlara girdaplı gürültü shader'ı (sis uniform'larıyla).
- **Kara Koru:** kuru yama oranı düşürüldü (uDry .55), patika boyunca basamak taşları (~400), ağaç diplerinde orman altı çalıları. İkinci tur: iki sonbahar meşesi türü (taç `GEO.paint` ile turuncu/sarı, ağaçların dörtte biri), orman içinde yaprak döküntüsü toprak rengi (grove gürültüsüyle), yosunlu kayalar, orman kenarlarında kuru ağaç siluetleri, ırmak kıyısında soluk sabah sisi levhaları. Su malzemesi pürüzlülüğü .12'den .75'e: güneş yansıması ışımayla dev beyaz lekeye dönüşüyordu.
- Duman testi üç biyomun süs setlerini ve Mezarlık'ın simge listesini doğrular.

### Gerçekçi ağaçlar ve malzemeler (4 Kasım 2026)

- **Yeni modül `engine/realtrees.js`:** suluboya blob taçlar yerine yaprak kartlı taçlar. Kanvasla üretilen dokular: kabuk albedo + kabartma (dikey oluklar, çatlaklar; çam/meşe/kuru/huş çeşitleri), yaprak kartı (60 damar çizgili yaprak, alfa kesimli; yeşil, turuncu ve sarı sonbahar; çam iğne yelpazesi). Gövde ve dallar UV'li silindirler (`limbGeo`), taç kartları küme merkezinden dışa yumuşatılmış normallerle (`softNormals`) hacimli aydınlanır. Çam: 6 kademe × 11 kart; meşe: 4 dal + tepe, küme başına 12 kart; kuru ağaç: kabuklu gövde ve 4 dal.
- **Boru hattı:** `treeGeo(kind, sd, 't'|'l')` önbellekli BufferGeometry, `userData.mat` ile kabuk ya da yaprak malzemesini taşır; `VEGM` bunu öncelikli seçer. Gövde ve taç aynı konum/dönüşle iki instanced çizim (`rotOf/sclOf` konumdan deterministik). Yaprak malzemesi rüzgâr salınımını (`VMATT.onBeforeCompile`) paylaşır; alfa kesimli gölgeler.
- **Arazi:** zemin malzemesine ayrıntı dokusu kabartma olarak da bağlandı (`bumpMap: DET`), yüzey ince tanelenir.
- Mezarlık ve Bozkır kuru ağaçları aynı kabuk boru hattına geçti. Duman testi süs anahtarlarını `rt_/rl_` ile doğrular.

### Boss dövüşü geri bildirimi (4 Kasım 2026)

- **Geliş:** kamera sarsıntısı 1.1, 0.18 sn yavaşlama, yerde turuncu halka ve 26 parçacık toz.
- **Ölüm vuruşu:** 0.55 sn yavaş çekim, sarsıntı 1.6, altın ve turuncu iki halka, 40 kıvılcım. Boss gövdesi 2.6 sn kalır: öne devrilir (`d.big`), yere çarpınca toz + sarsıntı + iniş sesi, sonra toprağa gömülür.
- **Boss çubuğu:** final arenasında %75/50/25 evre işaretleri (`#bb.ph`), %25 altında kızıl parlama (`.low`), direkler açıkken mavi ve "korunuyor" etiketi (`.inv`).

### Arayüz yeniden: oyun dili ve boyalı simgeler (8 Kasım 2026)

Erdem'in geri bildirimi: arayüz "çok AI duruyor"; renkler, yazı tipleri, kutular ve düzen. Seçenek olarak keçe, Orhun taşı, kam davulu ve piksel yazılı yönler gösterildi, hepsi reddedildi. Onaylanan: Megabonk sadeliğinde ama piksel yazısız bir dil ve her silah, tom ve eşya için ayrı, güçlü çizimler.

- **v11 katmanı** (`main.css` sonu): başlık ve sayılar Alfa Slab One, metin Signika (ikisi de Türkçe harfleri tam basıyor; Lilita One ve Titan One basmıyor). Beyaz yazı siyah dış hatla (`paint-order:stroke`), kutular koyu, 2 px siyah kenar, 4 px köşe, sert alt gölge; seçili satır, sekme ve düğme beyaz. Buzlu cam, saç teli çizgi, hap sekme, gradyan başlık kalktı. Eski `--dsp`/`--txt` Philosopher/Alegreya istiyordu ama yüklenmiyordu, her şey Georgia ve Trebuchet'e düşüyordu; `index.html` artık yalnız Alfa Slab One, Signika ve Old Turkic yüklüyor.
- **Simgeler:** 32 silah, 27 tom, 98 eşya için tek tek yazılmış tariflerden (`tools/ikon-tarif.mjs`) Codex'in yerleşik görsel üretimiyle (Erdem'in ChatGPT hesabı) 20 sayfa çizildi, sayfalar kesilip 128 px WebP oldu (toplam ~1,4 MB). Kart, HUD yuvaları, eşya şeridi, koleksiyon, kahraman künyesi, duraklatma ve kilit satırları `ikon()` kullanıyor. Kahraman portreleri, stat ve görev simgeleri hâlâ eski SVG.
- Üretici bazen beyaz ya da gri kare zemin veriyor; `ikon-kes.mjs` köşe ve hücre denetimiyle bu sayfaları reddediyor, `ikon-uret.sh` ile yeniden üretiliyor (20 sayfadan 2'si yeniden üretildi).

Doğrulama: duman testi geçti; menü, kahraman, harita, Otağ, koleksiyon, ayarlar, HUD, seviye kartları, duraklatma, ölüm ve telefon menüsü ekran görüntüleriyle kontrol edildi (`tools/arayuz-goruntu.mjs`). Elle oynanmadı.

**Kontrol turu (aynı gün):** sandık, tüccar, ocak, meydan okuma, yardım, boss, diyar geçişi, final, sıralama ve telefon (dikey, yatay, dokunmatik) ekranları `tools/arayuz-goruntu2.mjs` ile çekildi. Düzeltilenler:

**UI/UX kontrolü (aynı gün):** 33 ekran yeniden çekilip incelendi. Düzeltilenler: duraklatma, ölüm, meydan okuma ve sıralama açıkken HUD artık altlarından sızmıyor (telefonda bütün pencerelerde gizli), dokunmatik düğmeler hiçbir pencerenin üstüne binmiyor; ölüm başlığındaki Ö noktaları üst satıra binmiyor; tüccar kademede farklı eşya kalmadıysa aynı eşyayı ikinci kez önermiyor; tomu olmayan 7 ocak gücü (zorluk, kritik hasarı, zıplama, düşme, etki süresi, iyileşme, elit doğma) en yakın boyalı resmi kullanıyor; seviye kısaltması her yerde "SV"; alt yazılarda yetim kelime kalmıyor (text-wrap:balance); koleksiyonda kilitliler üstü çizili değil, gri ve okunur; kısayollar paragrafı sola hizalı; boş tecrübe çubuğu kara şerit gibi durmuyor. Açık: kahraman portreleri, Otağ güç satırları, görev ve sıralama kahraman simgeleri hâlâ eski SVG; gerçek cihazda denenmedi.

**Giriş ekranı (aynı gün):** oyun girişten ve kayıt indirildikten sonra yüklendiği için 3D sahne arkada çalışamaz; yerine Codex ile simgelerle aynı boyalı tarzda bir arka plan çizildi (`src/assets/giris/arka.webp`: kurgan, balbal taşları, sonbahar korusu, ruh ışıkları). Üstünde yalnız CSS ile yavaş kamera kayması, ufuktan yükselen ruh ışığı sütunları, iki katman sis, yükselen korlar ve kenar karartması var; panel blok sekmeler, kalın kenarlı kutular ve sarı odakla oyun dilinde; başlık panelin üst kenarına oturur. Hareket azaltma ayarında animasyonlar durur. Resim yoksa gökyüzü geçişi ve dağ siluetiyle çalışır. Yerelde sahte Supabase adresiyle derlenip masaüstü, telefon ve kayıt sekmesinde denendi.

**Telefon oynanışı (aynı gün):** dikeyde dikey görüş açısı sabit kaldığı için yatay görüş 36°'ye iniyordu; dar ekranda FOV en-boy oranına göre artar (390x844'te yatay 48°, SE'de 54°). Sanal çubuğun görseli yoktu: dokunulan yerde taban ve parmakla oynayan topuz, küçük ölü bölge. Telefonda duraklatma yolu yoktu: sağ üstte duraklat düğmesi (sağ sütun altına kayar); uygulamadan ya da sekmeden çıkınca koşu duraklar. Büyük harita yalnız Tab ve Select ileydi: mini haritaya basılı tut. Atıl düğmesi bekleme süresince saat yönünde dolar; Kullan yakında kapı, sunak, tüccar ya da sandık yoksa soluk, varsa sarı parlar. Zıpla 78 px (yatayda 66), öbürleri 62 (54); başparmak yayına dizildi; yatayda çentik ve köşeler için safe-area sol/sağ payı. Zıpla ve Kay touchcancel'da da bırakılır. `tests/telefon.mjs` yedi boyutta (SE, orta, büyük; dikey, yatay; tablet) gerçek dokunma olaylarıyla düğme boyutu, çakışma, ekran dışı, çubuk, görüş açısı, Kullan, harita ve duraklatmayı ölçer. Gerçek cihazda denenmedi.

**Son görsel kontrol ve kahraman portreleri (aynı gün):** `tools/gorsel-denetim.mjs` 157 simgeyi adı ve açıklamasıyla tablo halinde, 8 kahramanın 3B modelini tek tek çeker; ad ile resim uyumsuzluğu ve eski çizime düşen simge çıkmadı. `tools/oyun-goruntu.mjs` üç diyarda çok silah, kalabalık düşman ve boss'la kare çeker; görsel hata çıkmadı. Stil dosyasında tanımsız ya da boşta animasyon yok. Kahraman portreleri Codex ile modellere bakılarak aynı boyalı tarzda çizildi (`src/assets/ikon/h_*.webp`); kahraman seçimi, Otağ kilitleri ve sıralamada kullanılıyor, kilitliler gri. Telefonda küçülen başlıklarda sabit 7 px dış hat harf aralarını dolduruyordu; hat yazı boyutuyla orantılı (.15em). Açık: stat ve görev simgeleri (Otağ güç satırları) hâlâ eski SVG.

**Meshy denemesi: Alp (aynı gün, yalnız `?meshy` ile):** Codex ile tam boy A duruşunda referans çizildi; Meshy resimden modeli (smart topology, 8.394 üçgen, 2K doku, 15 kredi) ve iskeleti (24 kemik, yürüme ve koşma klibi, 5 kredi) üretti. gltf-transform ile doku 1024 WebP, geometri nicemlendi: model 454 KB, yürüme 77 KB, koşma 67 KB (`src/assets/model/`). `src/engine/glbhero.js` adreste `?meshy` varken (ya da localStorage kk_meshy=1) Alp seçiliyse kodla kurulmuş gövdeyi gizler, GLB'yi aynı boya ölçekler; oyunda hıza göre yürüme ya da koşma klibi, dururken kollar indirilmiş bekleme. Meshy dokusu gölgeyi içinde taşıyıp koyu geldiği için renk ve hafif ışıma ile eski gövdenin parlaklığına getirildi. Bayraksız oyun değişmedi (GLB'ler yüklenmez). Eksik: kılıç ve kalkan (eski gövdenin eklentileri), saldırı, zıplama, kayma ve atılma hareketleri, kostümler ve şapka. Karşılaştırma: `tools/meshy-karsilastir.mjs`.

**Meshy Alp tamamlandı (aynı gün, hâlâ yalnız `?meshy`):** Meshy kütüphanesinden yedi hareket tek dosyada (21 kredi): bekleme (Idle), sağ ve sol kılıç savuruşu, zıplama, kayma, eğik hızlı koşu (atılma), darbe alma. Model ve doku sökülüp yalnız iskelet ve klipler bırakıldı (`alp_hareket.glb`, 281 KB); Alp toplam ~880 KB. `glbhero.js`: kök hareketi silinir (oyun yeri taşır); ana durum (bekleme, yürüme, koşma, zıplama, kayma, atılma) bütün gövdede yumuşak geçişle, saldırı ve darbe yalnız üst gövdede oynar (bacaklar yürümeye devam eder). Zıplama karesi dikey hıza göre seçilir, kayma en alçak duruşta tutulur, saldırı oyunun 0.42 sn'lik saldırı ilerlemesine eşlenir, sağ/sol oyunun `P.side` değerinden. Kılıç (kavisli pala) sağ ele ön kolun devamı yönünde, kalkan (kırmızı, altın güneş) sol ön kola kodla kurulup takılır; şapka eski gövdeden yeni baş kemiğine taşınır; kostümler (Altın, Kara, Alev, Asit, Mahzen, Kızıl, Beyaz) eski renk fonksiyonları dokunun piksellerine uygulanarak. `tools/meshy-alp.mjs` eski ve yeni Alp'i seçim, üç kostüm ve sekiz oyun anında yan yana çeker. Açık: gerçek cihazda denenmedi; bayrak olmadan oyun eski Alp'le açılır.

**Meshy Alp ikinci sürüm (aynı gün):** ilk model hareket halinde bozuluyordu: dize inen kaftan iskelette bacaklara bağlanıp saldırıda ve geniş adımda şemsiye gibi açılıp yırtılıyor, gövde bükülürken eziliyor; oranlar ince ve gerçekçiydi (oyunun ve eski Alp'in tıknaz tarzına uymuyordu), eller çıplak el gibiydi. Yeni referans: tıknaz oranlar (baş boyun dörtte biri), diz üstünde yanları yırtmaçlı kaftan, belirgin deri eldiven, peçe yalnız ağızda. Üretim smart topology yerine standart model (meshy-7.1, 30 kredi) + 10.000 üçgene remesh (5) + iskelet (5) + aynı yedi hareket (21). Remesh normal haritası getiriyor; metalik doku atıldı, normal 512 px, renk 1024 px WebP, tanjantlar silindi (three.js türevle işler): model 872 KB. Hareket ve kostüm kodu değişmedi. `tools/model-bak.mjs` bir GLB'yi düz ışıkta dört açıdan ya da klip anlarında çeker. Meshy kredisi toplam 102 harcandı.

**Meshy Alp tam 3B, varsayılan (aynı gün):** Meshy Alp artık varsayılan; `?eski` (ya da localStorage kk_meshy=0) kodla kurulmuş eski gövdeyi getirir. Kılıç (tek yöne kavisli pala, 1.572 üçgen, 83 KB) ve kalkan (kırmızı yüz, altın güneş ve perçinler, 2.761 üçgen, 121 KB) da Meshy ile üretildi; kılıç kabzasının ortasından ele, kalkan kayışla elin sırtına (A duruşunda yukarı) ve ön kola dik takılır, sol el %70. Yeni hareketler (15 kredi): oyunda kılıç-kalkan savaş duruşu (menüde rahat bekleme), hızlı koşu (eski koşu klibinin yerine), çift zıplamada takla büzülmesi (Backflip Jump; kalçanın dönüşü silinir, oyun gövdeyi kendisi döndürür, büzülme ortada en sıkı), atılmada dönen hızlı adım. Yürüme ile koşu hıza göre karışır (3.5–7.5). Ayak kayması oyunda sabit hızla ilerletilen modelde ölçüldü ve klip hızı katsayısı taranarak seçildi (yürüme 0.7, koşu 3.7 boy/sn); koşuda yerdeki ayağın kayma hızı gövde hızına oranla 0.87'den 0.32'ye indi, kalan kısım bileğin yuvarlanması. Eski gövde Meshy yüklenirken hemen gizlenir (eski Alp görünüp yenisine dönmesin), yüklenemezse geri gelir; dosyalar açılışta önceden indirilir. Alp dosyaları toplam ~1.6 MB. Araçlar: `tools/meshy-el.mjs` (on duruş × dört yön), `tools/meshy-oyun.mjs` (gerçek tuşlarla oyun kareleri, ayak kayması ölçümü, telefon), `tools/model-bak.mjs`. Meshy kredisi toplam 147. Klavye testi klasör verilmeyince görüntü yazmıyor (yanlışlıkla depoya giren `undefined/` silindi).

**Meshy Alp efekt denetimi (aynı gün):** 32 silahın hepsi eski ve yeni Alp'le yan yana çekildi (`tools/efekt-denetim.mjs`), ateş ve el efektleri yakın kamerayla dört anda (`tools/ates-yakin.mjs`: Ateş Topu, Ejder Nefesi, Kor Halkası, Kor İzi, Kılıç Savuruşu, Alp Kılıcı, Dönen Kılıçlar, Yıldırım); efektler oyuncu konumundan sabit yükseklikte çıktığı ve yeni model eski boya ölçeklendiği için ikisinde aynı yerde. Bulunanlar: Meshy malzemesinde oyundaki bütün karakterlerin kenar ışığı yoktu (RIMU, aynı terim eklendi); kostüm yalnız gövdeye uygulanıyordu, eski modeldeki gibi kılıç ve kalkana da uygulanıyor (malzemeler kopyalanarak); eski gövdenin ayrı çizilen gözleri (engine/eyes.js) yeni yüzün önünde havada kalırdı (Alp'te göz yok ama sonraki kahramanlar için gizleniyor, yükleme başarısız olursa geri gelir). Ara sıra görülen siyah kareler: 192 karelik avda geçersiz kamera değeri, bağlam kaybı ya da siyah kare çıkmadı; başsız tarayıcının ekran görüntüsü aksaklığı.

**Meshy Alp kılıç tutuşu (aynı gün):** önceki modelde eller açık ve parmaklar düzdü; kılıç avuca yapıştırılmış gibi duruyordu ve Meshy iskeletinde parmak kemiği olmadığından el sonradan kapatılamaz. Referans Codex ile düzenlendi (yalnız eller: içinden kabza geçecek delikli yumruk, başparmak önde); Meshy'nin A duruşu seçeneği eli yeniden açtığı için (`--pose-mode a-pose` yumruğu siliyor) duruş seçeneği kapalı üretildi, 12.000 üçgene remesh, iskelet; yumruk ve delik remesh sonrası da korunuyor. Kılıç artık yumruğun ortasından (el kemiğine çoğunlukla bağlı derili köşelerin ortası, `SkinnedMesh.getVertexPosition` ile) deliğin ekseni boyunca geçer: topuz yumruğun bir yanında, balçak ve ağız öbür yanında; keskin kenar aşağıda; boy %62. Ayar `KILIC` nesnesinde. Kalkan aynı; yüz tarafında el hiçbir duruşta görünmüyor. `tools/el-yakin.mjs` eli ayrı kamerayla dört duruşta altı açıdan çeker (UZAK ile mesafe). Hareket klipleri aynı (kemik adları ortak). Bu tur 100 Meshy kredisi; 36'sı A duruşlu, eli açık çıkan modelin hareketlerine gitti (iptal edilemedi). Kalan 893.

**Kamera ve ağaçlar (aynı gün):** kamera yalnız yerden yükselmeyi hesaba katıyordu; ağaç taçlarının içine girip ekranı yaprakla dolduruyor, ağaç arkada kalınca karakteri kapatıyordu. İki parçalı çözüm: (1) yaprak malzemesinde (realtrees.js `OKL`) kameraya 1.6–3.2 birimden yakın yapraklar ve kamera ile karakter arasındaki görüş hattını kapatan yapraklar ekran kapısı deseniyle seyrelip kaybolur; yalnız renk geçişi, gölgeler aynı; menüde kapalı. (2) kamera kolu (terrain.js `camHit`, loop.js): karakterin başından kameraya giden doğru katı bir engele (ağaç gövdesi, kaya; yapraklı taçta ortadaki 0.6 birimlik gövde, çünkü çam gövdesi tepeye kadar uzanır) çarparsa kamera hemen öne çekilir (en az 3 birim), yol açılınca yavaşça geri gider. `tools/kamera-agac.mjs` oyunu elle ilerleterek en yakın 12 ağacın dört yanında (kamera ağacın arkasında) 2160 kare ölçer: karakterin görüşü ağaçla kesilen kare 1549'dan 496'ya (kalanlar seyreltilmiş yaprak kenarı), gövdeyle kesilen 546'dan 0'a; kare görüntülerinde sekiz durumun sekizinde karakter görünüyor. Yandan bakışta ağaçlar değişmiyor.
- **Klavyeyle menü gezinmesi yoktu** (eski hata): Tab ve oklar her ekranda engelleniyordu (Tab oyunda büyük harita). Artık oyun dışında Tab, Shift+Tab ve oklar odağı kumandadaki gibi (`padItems`) taşır, Enter seçer; kahraman sayfasında oklar karakter seçer, kaydırıcıda sol/sağ değeri değiştirir. Sınama: `tests/klavye.mjs`.
- Odak her yerde 3 px sarı çerçeve (kumanda `.pad` dahil; eski 1,5 px beyaz çizgi beyaz düğmede görünmüyordu). Ana menüde odak başka satırdayken yalnız odaklı satır beyaz; satır geçiş animasyonu bir an beyaz üstüne beyaz gösterdiği için kalktı.
- Telefon: v11 boyutları eski dar ekran küçültmelerini eziyordu (sayaç can çubuğuna biniyordu); dar ve alçak ekran kuralları eklendi. Dokunmatik düğmeler oyun dilinde. Yatay telefonda seçim kartları yan yana sığar (eskiden 300 px sabit genişlikle alta kayıyordu).
- Diyar geçiş başlığı küçültüldü (Alfa Slab geniş, "Mühürlü Mahzen" ekranı dolduruyordu). Ocak gücü aynı statın tomu varsa onun resmini gösterir.

Denge botu (Alp, K1) üç diyarı geçti, sayfa hatası yok; duman testi geçti.

### Üç Diyar rotası: her aşama başka diyar, kademe zorluk, final Mühürlü Mahzen (8 Kasım 2026)

- **Karar (Erdem):** Koşu akışı Megabonk'unkine benzesin ama birebir olmasın. Eski yapı Megabonk'la aynıydı: kademe N = aynı haritada N aşama, Kademe 3'ün sonu direkli final arenası (boss %75/50/25'te dokunulmaz, direkler).
- **Yeni yapı:** Her koşu üç aşama, her aşama başka diyar: Kara Koru → Kızıl Bozkır → Mezarlık (Mühürlü Mahzen). `run.js ROTA`, `nextStage` geçişte `P.map`'i değiştirir; `setupStage` dünyayı, düşman listesini, sunakları ve boss'u diyara göre kurar. Kademe yalnız zorluk (`TIERM`); harita seçimi kalktı, menüde tek "Üç Diyar" kartı ve kademe düğmeleri.
- **Final:** Mahzen'in kendi mekaniği: başta mühür (2 dk'da 30 öldürme, yoksa Kara Kefen), dört tabutun bekçileri, dört anahtar, mühürlü kapıda Dev Hortlak. Ardından Çıkış Geçidi ve Son Dalga. Direkli arena kapalı (`isArena()` false); Kadim Tepegöz ve Yargıç Erlik biçimleri kullanılmıyor.
- **Bosslar:** `bossIdx`: Koru ve Bozkır'da K1 hafif biçim (Tepegöz, Küçük Erlik), K2-3 ağır biçim (Ulu Tepegöz, Erlik). Dev Hortlak canı 130 bin → 22 bin (final aşama çarpanı ×6 yüzünden). Mahzen süresi 15 → 10 dk; ara bosslar 2:30 ve 7:30, akınlar 4:00 ve 7:00. Tabut bekçisi canı aşama başına +1 kat (finalde ×3).
- **Kayıt ve görevler:** Kademe kaydı `META.tier.koru` (eski Kara Koru kademeleri rota kademesi sayılır). Haritaya bağlı görevler rotaya çevrildi; eski Bozkır sayaçları (win_bozkir2/3, tier.bozkir) hâlâ sayılıyor. Bozkır/Mezarlık harita kilitleri anlamsız: "Kızıl Bozkır'ı aç" → "Kızıl Bozkır'a ulaş", Kemik'in Babası görevi artık harita açmıyor. Kurbağa şapkaları her diyarda bir. Çalı yumağı (yalnız Bozkır) önce Yatağan'ı, sonra K2+'da Çakaralmaz'ı düşürür. Başarımlar a_m_bozkir/mezarlik kaldırıldı.
- **Ölçüm (tests/denge.mjs, ölümsüz bot, rotaya uyarlandı):** Kam, Alp, Bahadır K1-K3: üç diyar ve Dev Hortlak devrildi; aşama bossları 20-280 sn (çoğu 60-160), Dev Hortlak 16-158 sn; tabut bekçileri ×3 ile 0,3-57 sn. Ölümsüz bot K3'te tek karede gelen ani hasarla iki kez öldü (yavaşlatılmışken tank sürüsü). Smoke 74/74; shader sayımı diyar geçişlerini hariç tutuyor (yeni biyomun programları geçiş ekranında derleniyor).
- **Açık:** Kademe 1'de yeni oyuncu artık 2. ve 3. aşama zorluğunu da görüyor; gerçek oyuncu denemesi gerekiyor. Sıralama kademeyi ayırmıyor.

### Kızışma: aşama uzadıkça düşman vuruşu sertleşir (7 Kasım 2026)

- **Sorun:** Erdem Kam ile 1. aşamada 6. dakikayı geçtiğinde hâlâ ölmüyordu. `DMK` (sıradan düşman hasarı) aşama saatini hiç görmüyordu; süreyle yalnız can (`diff`), doğuş hızı ve tür listesi büyüyordu.
- **Çözüm:** `stats.js kzK`: ilk 2 dk ×1, sonra doğrusal; 1. aşamada 3 dk +%13, 6 dk +%50, 9 dk +%88, 10 dk ×2. 2. aşama sonunda +%50, 3. aşama sonunda +%30 (taban zaten büyük). Son Dalga'da başladığı andaki değerde donar, 10. dakikadan sonra sabit. `DMK` bununla çarpılır.
- **Bildirim:** 25. saniyede bir kez "Kızışma" ipucu; her 3 dakikada "N. dakika: düşmanlar sertleşti. Vuruşları artık +%X." (aynı karedeki ara boss/akın bildirimini ezmemek için 1 sn gecikmeyle ve ekran yazısı boşalınca). HUD yol çizelgesinde 3/6/9. dakikalar kırmızı çizgi. Final arenasında yok.
- **Yan düzeltmeler:** Yol çizelgesindeki akın işaretleri sabit 4:00/7:00 yerine `SWT()` (2. ve 3. aşamada yanlış yerdeydi). Aşama geçişindeki "Sayaç sıfırlanmaz" metinleri yanlıştı (sayaç sıfırlanıyor); düzeltildi. Harita seçimindeki ipucu aşama/kapı/geçit akışını anlatıyor. Oyunda görünen üç Megabonk göndermesi (Ocak Başı, Altın Halka, Kumar Tomu açıklamaları) kaldırıldı.
- **Ölçüm:** Kam bot karşılaştırması (`tests/denge.mjs`, eski/yeni, ölümlü ve ölümsüz) gürültülü: ölümlü bot iki sürümde de 3-4. dakikada ölüyor. Uyarıların zamanlaması adımlı Playwright betiğiyle doğrulandı (25 sn ipucu, 183/361/541 sn bildirimleri). Gerçek oyuncu hissi Erdem'in denemesine kaldı.

### Isınma: kare sınırı, piksel bütçesi, telefonda orta kalite (7 Kasım 2026)

Şikâyet: oyun bilgisayarı ve telefonu ısıtıyor. Ölçüm başsız Chrome + gerçek GPU (Apple M5, ANGLE Metal), `ioreg` "Device Utilization %" (boşta %0-2); 1512×982 retina ve 390×844 dpr 3 dokunmatik.

| Durum | Önce GPU | Sonra GPU |
|---|---|---|
| Masaüstü menü | %74 | %28 |
| Masaüstü oyun | %74 | %56 |
| Masaüstü duraklatma | %80 | %30 |
| Telefon menü | %44 | %24 |
| Telefon oyun | %52 | %47 (30 FPS: %27) |

- **FPS:** varsayılan 60 (önce sınırsız: 120 Hz ekranlarda iki kat kare; başsız ölçüm 60 Hz olduğu için bu kazanç tabloda yok). Oyun dışında kare sınırı: menü, hazır, geçiş 30; duraklatma, kartlar, Otağ, sıralama, ayarlar 20.
- **Piksel bütçesi:** yüksek kalite ~4.2, orta ~2.1 milyon piksel (retina 14" 3024×1964 → 2542×1651).
- **Dokunmatik:** ilk açılışta orta kalite (ışıma ve 4× MSAA ara tampon yok, en çok 1.5×). Ayar sürümü `sv: 2`: kayıtlı "sınırsız" FPS bir kez 60'a, dokunmatikte yüksek kalite bir kez ortaya iner.
- **Hata:** dinamik çözünürlük eşikleri 60 FPS'e göreydi; 30 FPS seçen oyuncunun çözünürlüğü yavaş sanılıp %60'a iniyordu. Eşikler hedef kare süresine bağlandı.
- **Süs yoğunluğu:** `vegInst` gölgesiz ve 20'den kalabalık kümeleri (çiçek, eğrelti, saz, mantar, patika taşı, çimen) orta kalitede %60, düşükte %40'a seyreltir; engel fn içinde öğe başına kurulduğu için atılan öğenin görünmez engeli kalmaz. Koru'da süs üçgeni 238 bin → 113 bin, sahne toplamı −%16.
- **Kare başına GPU süresi** (EXT_disjoint_timer_query_webgl2, M5): yüksek kalite 2542×1651'de ~12.5 ms; ışıma kapalı ~7.5 ms (ışıma ~%40), MSAA 0 yalnız −1 ms, gölge geçişi ihmal edilebilir, ışımayı yarım/çeyrek çözünürlükte hesaplamak kazandırmadı (maliyet tam çözünürlük adımlarında). Orta kalite telefon boyunda ~5 ms, çoğu sabit (çizim/üçgen): piksel 1/4'e inince yalnız −1 ms. Geçiş başına zamanlayıcı ANGLE/Metal'de güvenilmez çıktı.
- **Açık:** ışımanın tam çözünürlük maliyeti (UnrealBloomPass'ın MSAA ara tampona harmanlaması olabilir) incelenmedi; telefonda sabit maliyet için gölgeli nesnelerin parça boyu (`BK=300`, uzak parçalar elenemiyor) ve arazinin 115 bin üçgeni sıradaki adaylar. İşlemci tarafında JS kare başına küçük (profilde oyunda %86 boşta); ses sentezi bir çekirdeğin ~%10'u.

### Rekabetçi sıralama: haftalık tablo, podyum, senin yerin (7 Kasım 2026)

- **Haftalık tablo:** `kk_hafta` (hafta, id); hafta Pazartesi 00:00 Türkiye saati (`kk_bu_hafta()`, istemcide `haftaBasi()`). `kk_skor_gonder` yedinci parametre `p_h` ile haftanın en iyisini de birleştirir; `hf` sunucunun haftası değilse yok sayılır (geçen haftadan kalan gönderilmemiş koşu yeni haftaya yazılmaz). `p_h` varsayılanlı: eski istemci altı parametreyle çalışmayı sürdürür. Ortak `kk_ch_temizle` / `kk_ch_birlestir` iki tabloda aynı. PGlite'ta denendi: birleştirme, eski hafta, anon yazma reddi, hesap silinince haftalık satır da silinir.
- **Ekran:** Bu hafta / Tüm zamanlar seçimi (varsayılan bu hafta), yeni haftaya kalan süre, yarışan oyuncu sayısı (`count=exact`), ilk üç podyumda (altın, gümüş, bronz), listede kahraman simgesi, kendi satırın ilk 30 dışındaysa altta sabit. Sağda "Senin yerin": sıra, üst sıradakiyle fark, ilk 10'a ve zirveye kalan, üst yarıdaysa yüzdelik. Geçen haftanın ilk üçü altta.
- **Koşu sonu:** gönderimden önceki tabloya göre bu hafta ve tüm zamanlardaki sıra, "↑ N sıra yükseldin" (`lbSonuc`). Koşu sırasındaki hedef haftalık tablo doluysa ona göre.
- **Açık:** haftalık ödül yok; hile tamamen engellenemez (istemci oyunu).

### Hesaplar: zorunlu giriş, kayıt hesapta (7 Kasım 2026)

Yayında oyuncu kullanıcı adı ve şifreyle kayıt olur ya da girer; giriş zorunlu (kullanıcı kararı). İlerleme, rekorlar, sıralama satırı ve ayarlar hesapta.

- **Sunucu (`supabase/siralama.sql`).** Supabase Auth; kayıt tetikleyicisi `kk_hesap` satırını açar (ad 3–15 karakter, harf/rakam/_/Türkçe harf, büyük/küçük harfe duyarsız tekil). `kk_hesap.veri` oyunun kayıt anahtarlarını tutar; yalnız sahibi okur (RLS), yazma `kk_kaydet` ile (nesne, 256 KB sınırı). Sıralama hesaba bağlandı: `kk_skor_gonder` giriş yapmış oyuncunun kendi satırına yazar, ad hesaptan gelir; tarayıcı sırrıyla sahiplik (`kk_sahip`, `kk_gonder`) kaldırıldı. E-posta doğrulaması kapalı; kullanıcı adı istemcide e-posta biçimine çevrilir (`u<onaltılık>@oyuncu.kara-koru.app`), e-posta gönderilmez, şifre sıfırlama yok.
- **İstemci (`ui/hesap.js`).** `hesapKapisi()` oyun modüllerinden önce: oturum yoksa giriş/kayıt ekranı; girişten sonra hesabın kaydı indirilir ve tarayıcıya yazılır. Uzlaştırma: hesap boşsa tarayıcıdaki sahipsiz ilerleme hesaba geçer; tarayıcıda gönderilmemiş değişiklik varken hesap başka yerde değişmediyse tarayıcı kazanır; aksi hâlde hesap. Kayıt anahtarları 3 sn'de bir yoklanır, değiştiyse (en sık 8 sn'de bir) gönderilir; sayfa gizlenince ya da kapanırken de. Menüde "Çıkış yap": kayıt gönderilemezse çıkış yapılmaz; çıkışta tarayıcıdaki kayıt silinir. Sıralama ekranındaki ad formu kalktı (ad hesabın adı).
- **Eşzamanlılık.** `kk_kaydet` istemcinin bildiği son sunucu zamanını (`p_onceki`) ister; hesap o zamandan beri başka yerden yazıldıysa `PT409` (HTTP 409) döner, hiçbir şey yazılmaz, oyuncuya "sayfayı yenile" denir. (İlk denemede 40001 kullanıldı: PostgREST bu kodu serileştirme hatası sayıp saniyede bir sonsuza dek yeniden denedi, bağlantı havuzu tükendi ve API 504 verdi; PT409'a geçilince düzeldi.) Yanıtı kaybolan kendi kaydı 409'da tanınır (sunucudaki kaydın özeti gönderilenlerle karşılaştırılır), yanlış çakışma çıkmaz. Boş kayıt gönderilmez. Aynı tarayıcıda oyun tek sekmede çalışır: etkin sekme 2 sn'de bir imza atar (`kk_etkin`), ikinci sekme "Burada oyna" ile devralır, eskisi bekleme ekranına düşer. İlk indirme başarısızsa ya da indirilen kayıt tarayıcıya yazılamazsa (kota) oyun açılmaz, yeniden deneme ekranı gelir; hesaba hiçbir şey yüklenmez. Oturum yenilemesi 429/5xx'te korunur, yalnız 400/401/403'te biter; oyun sırasında biterse uyarı ve yeniden giriş düğmesi. Codex dört tur inceledi (14 bulgu, hepsi düzeltildi; son turda geri/ileri önbelleği, kapanışta kayıt-kilit sırası, iki sekmenin aynı anda açılması, boş hesapta kayıt sahipliği).
- **Doğrulama.** Şema PGlite'ta (auth taklidiyle) eski şemanın üstüne iki kez: kayıt, aynı ad, geçersiz ad, sahiplik, anon erişimi, büyük kayıt, skor kuralları, hesap silinince skorun silinmesi. Canlı Supabase'de komut satırından: kayıt, aynı ad, yanlış şifre, hesap okuma/yazma, skor. Tarayıcıda gerçek Supabase'e karşı uçtan uca: giriş ekranı oyun yüklenmeden geliyor, form uyarıları, kayıt, ilerlemenin hesaba gitmesi, başka cihazda büyük harfli adla giriş ve aynı ilerleme, yanlış şifre, çıkışta yerel kaydın silinmesi, eski yerel ilerlemenin yeni hesaba geçmesi, yeniden yüklemede oturumun sürmesi, sıralamada hesap adı; iki cihazda çakışma (eski cihaz 409 alır, sunucu yeni ilerlemeyi korur, yenileyince güncel kayıt gelir), ikinci sekmenin beklemesi ve devralma, çıkışta son değişikliğin gitmesi, yanıtı kaybolan kayıt, ilk indirme engelliyken açılmama, kota hatası, belirteç yenilemesinde 429 ve 400. Supabase'siz derlemede duman testi geçti.

### Bot denge taraması (7 Kasım 2026)

8 kahraman × 3 harita × bütün kademeler × 2 tohum, iki kipte (96 koşu, `tests/denge.mjs`). Ölümsüz kip boss düşme süresini ve alınan hasarı ölçer; yeni ölümlü kip (`MORTAL=1`) canı doldurmaz, bot 16 yönü örnekleyip en boş yöne kaçar, güvendeyken kristale ya da uzaktaki düşmana gider, boss'un çevresinde daire çizer. Ölümlü bot zayıf bir oyuncudur (zıplamaz, dükkân ve sunak kullanmaz, kalıcı yükseltmesi yok); süreleri mutlak değil, haritalar ve kahramanlar arası karşılaştırma içindir.

Ölümsüz kip, medyan (bossAlınan/can: boss dövüşünde saniyede alınan hasarın azami cana oranı):

| Harita | K | A | Seviye | Düşme (sn) | Alınan/sn | bossAlınan/can |
| --- | --- | --- | --- | --- | --- | --- |
| Kara Koru | 1 | 1 | 23 | 48 | 8.3 | 0.2 |
| Kara Koru | 3 | 1 / 2 / 3 | 22 / 29 / 35 | 42 / 68 / 78 | 25 / 26 / 30 | 0.4 / 0.4 / 0.3 |
| Kızıl Bozkır | 1 | 1 | 23 | 64 | 16.7 | 0.4 |
| Kızıl Bozkır | 3 | 1 / 2 / 3 | 23 / 31 / 34 | 61 / 50 / 79 | 38 / 39 / 44 | 0.6 / 0.6 / 0.7 |
| Mezarlık | 1 | 1 | 28 | 135 | 14.2 | 0.3 |

Bulgular:
- **Kızıl Bozkır, Kara Koru'nun aynı kademesinin yaklaşık iki katı hasar veriyor** (K1 16.7 / 8.3 sn başına). Nedeni düşman listesi: Kaktüs (uzaktan, hasar 30, ağırlık 16) ve Kadim Mumya (hasar 40; sıradan düşmanlar arasında en yüksek, Kara Koru'da en yüksek 30). K3 son aşamada Kadim Mumya tek vuruşta 139–143 vuruyor; oyuncunun canı 110–170. Ölümsüz botun 9 "ölümünün" 7'si bu tek vuruşlar (bot boss'un dibinde durduğu için yavaş düşmanlar yetişiyor). Bozkır, Kara Koru K2'de açıldığı için zor olması amaçlı, ölçüsü elle oyunla karar verilmeli.
- **Kahraman farkı 2.3 kat.** Boss düşme süresinin hücre medyanına oranı: Tulpar 0.7, Çalı 0.8, Anka 0.8, Bahadır 1.0, Kam 1.0, Kemik 1.1, Alp 1.5, Gölge 1.6. Ölümlü kipte de en iyi Tulpar ve Kemik (Kara Koru K1-K2'de çoğunlukla hayatta), Alp ve Gölge'nin fazla canı hayatta kalmaya yansımıyor.
- **K3'ün ilk aşaması şansa bağlı.** Aynı kahraman iki tohumda 300. saniyede seviye 11 ile 21 arasında, boss düşme süresi 27 ile 551 sn arasında (Alp, Bozkır K3). Kalıcı yükseltmesi olmayan bot K3'ün sağlam düşmanlarını erken temizleyemeyince tecrübe akışı duruyor.
- **Ölümlü kip:** ilk ölüm medyanı Kara Koru K1 256 sn, K2 193, K3 170; Bozkır K1 190, K2 163, K3 123; Mezarlık 16 koşuda 4 ölüm (en kolay). Sıra beklendiği gibi; sayılar zayıf bot içindir.
- **Hata düzeltildi: azami can sıfırın altına inebiliyordu.** Kımız (Megabonk Beer: +%20 hasar, −%5 azami can) ve Lanetli Eldiven'in yüzde cezası toplanarak birikir ve tabanı yoktu; 20 Kımız azami canı 0'a, 25'i −30'a indiriyordu. Azami can artık en az 1 (`stats.js`). Megabonk'ta birden fazla Beer'in nasıl biriktiği kaynaklarda yok; değer değiştirilmedi. Bir koşuda Tulpar'ın canı 50'ye inmişti.
- Sayfa hatası ve NaN yok.

Doğrulama: tip denetimi 0 hata, duman testi geçti, 25 Kımız ile azami can 1.

**Düzeltmeler (aynı gün, kullanıcı onayıyla).**
- Kadim Mumya'nın hasarı 40 → 30 (Kara Koru'nun en sert sıradan düşmanıyla aynı).
- Alp ve Gölge'ye +%25 taban hasar (yakın dövüş silahlarıyla boss'u en geç deviren ikiliydi; silahlara dokunulmadı, onları başka kahramanlar da kullanıyor).
- **Kumar Tomu'nun can cezası bileşik oldu.** Asıl can erimesi buradandı: −%5 azami can her seviyede toplanıyordu, 10. seviyede can yarıya, 20. seviyede sıfıra iniyordu (tom sınırı 99); ölümsüz botun canı 46–94'e düşüyordu. Artık her seviye kalan canın %5'ini alır: 10. seviye %59, 20. seviye %35, 30. seviye %19 (oyunda ölçüldü). Çarpan katmanlı (`*`) seviye statları bileşik işler (`cards.js`); yalnız Kumar kullanıyor. Etki hâlâ tahmin: Megabonk'ta Gamba Tome için kaynak bulunamadı.

**Yeniden ölçüm** (ölümsüz 6 tohum, ölümlü 2 tohum, 160 koşu). Koşular deterministik değil (çizim döngüsü rastgele sayı üretecini ilerletiyor; aynı ayarla düşme süresi 16 ile 43 sn arasında oynayabiliyor), bu yüzden tohum sayısı artırıldı.
- Kahraman oranı: Kemik 0.8, Çalı 0.8, Tulpar 0.8, Anka 0.9, Kam 1.0, Bahadır 1.2, Gölge 1.3, Alp 1.3 (önce 0.7 ile 1.6 arası, fark 2.3 kat; şimdi 1.6 kat). Alp en yüksek canla (182) ve en düşük boss hasarı oranıyla (0.3) tank rolünde.
- Bozkır / Kara Koru alınan hasar oranı K1'de 16 / 11.2, K3 son aşamada 43 / 34 (önce yaklaşık 2 kat).
- K3 son aşamada tek vuruş ölümleri sürüyor (Bozkır 45 koşuda 10, Kara Koru 47'de 6): taban hasarı 30 olan düşmanlar 3.47 aşama çarpanıyla 104 vuruyor, can tomu seçmeyen botun canı 110–140. Gerçek oyuncu can ve zırh topladığı için bu ölçüm botun build'ine bağlı; değiştirilmedi.

### Kalan işler turu: kaynaklar, sıralama, tip denetimi, olay yönlendirici (6 Kasım 2026)

- **Kaynak taraması** (wiki arşivi, Steam yama notları, Fextralife, survivorsdb, decompile): 3. aşamanın ikinci ara bossu 1:30 kala (wiki; eskiden 3:00). 3. silah slotu 25 gümüş kaldı (wiki aralığı 25–125; yama notu yalnız görev sayısını veriyor). Tam isabet en çok 20 işaret (decompile `MAX_MARKERS`; eskiden 3). Hayalet Beyi, tabut bossları ve Tam isabet patlama hasarı için kaynakta sayı yok; tahmin olarak kaldı.
- **Ortak sıralama Claude dışında: Supabase.** `supabase/siralama.sql` (tablo, RLS, `kk_gonder` fonksiyonu: SHA-256 özetli sırla sahiplik, değer sınırları, 15 sn hız sınırı; okuma herkese açık, doğrudan yazma kapalı), `ui/supa.js` (paketsiz `fetch`; gönderilmemiş rekorlar bir giden kutusunda genel ve kahraman başına en iyiyle birleşir, her gönderimde sunucudaki satırla birleştirilir, gönderimler sıralı, yükleme kapatılınca kutu silinir; kahraman başına rekorlar hem sunucuda hem istemcide doğrulanır), sıralama ekranında görünen ad formu. Adres ve anahtar `.env`'den derlemeye girer; yoksa eski davranış. Doğrulama: şema PGlite üzerinde 12 durumla (yetki, yanlış sır, hız sınırı, sınır dışı değer, ad temizliği, yeniden çalıştırma), istemci gerçek SQL'i çalıştıran yerel taklit sunucuya karşı tarayıcıda (yükleme, gönderim, sıra, ad değişikliği, `<b>` kaçışı, ilk 200 dışındaki oyuncunun rekorlarının korunması, 15 sn sınırına takılan ve çevrimdışı koşuların birleşip sonra gitmesi, bozuk satırın ekranı kırmaması, yükleme kapatma, depolama engelliyken sabit kimlik). Codex iki turda 10 sorun buldu, hepsi düzeltildi. Gerçek Supabase projesinde denenmedi.
- **Tip denetimi.** `tsconfig.json` + `npm run typecheck`: bütün `src/` `checkJs` ile denetleniyor, gevşek modda 105 hatadan 0'a. Gerçek hatalar: yinelenen nesne anahtarı (Kemik Bumerang `lock`) ve beş örtük küresel (içe aktarılmadan `window` köprüsünden kullanılan `CRYPT_N`, `spawn`, `inc`, `SET`, `MAPS`). Kalanı JSDoc tip ipuçlarıyla, davranış değişmeden.
- **Olay yönlendirici.** 55 satır içi işleyici (`onclick`, `oninput`, `onchange`, `onkeydown`) `ui/actions.js`'e taşındı: `data-act` + JSON argümanlar, kod dizgesi değerlendirilmez. Kumanda odak koruması ve duman testi yeni anahtara geçti. Doğrulama: duman testi 74/74 ve bütün düğme türlerini gerçek fare ve Enter ile gezen ayrı sınama (ayarlar: sekme, kaydırıcı, onay, segman; Otağ, sıralama sekmesi, kahraman, harita, meydan okuma, başlat; seviye kartı tıklama ve Enter, yasaklama kartı seçmeden, yeniden çekme; eşya kartı, duraklatma; tüccar, kazan, meydan okuma sunağı, aşama geçişi), sayfa hatası yok.
- **Son Dalga botu.** Aşama geçişlerinde oyuncu ölümsüz, can dolu; makine yüklüyken görülen güçlenme ölümleri kalktı (7 paralel koşuda 6 geçti; kalan biri 3. aşamada 131 canlı Kemik'in zırhlı iskeletten yediği gerçek tek darbe).

### Son Dalga: güçlü build sınırı (6 Kasım 2026)

Bir önceki turda Kemik + Ateş Topu (kaçınma tomu 26, saldırı hızı 33) Son Dalga'da 40 dakikayı doldurmuştu. Bota dakikalık can çalma, kaçış, zırh ve stat dökümü, Albastıya giden hasarın kaynağı, vuruş kancası çarpanları ve `hurtP` sonuçları eklenerek nedenler tek tek ölçüldü (`SET_T=eva:26,aspd:33` Son Dalga başında tomları kurar; tanı sayaçları geçici bir yapıda açılır). Dört ayrı açık çıktı:
- **Kaçınma tavansızdı.** İç değer doğrudan şans olarak kullanılıyordu; koşu başında 2,61, sonda 15,36 olan build her darbeden kaçıyordu. Artık Megabonk'taki gibi azalan getirili: şans = iç değer / (1 + iç değer) (0,1 → %9, 1 → %50, 15 → %94). Kart, eşya ve sunak önizlemeleri dönüştürülmüş değeri gösterir (iç değer 2'de Kaygan Yüzük %67 → %68, sonuç %68,3). Kaynaklar: Megabonk wiki ve topluluk veritabanı %94 yumuşak tavan diyor, formül resmî değil.
- **Tokmak çarpanı yığınla büyüyordu.** Belgede ve Megabonk'ta (Big Bonk) 20 kat; kod yığın başına +10 kat ekliyordu (24 yığında ×250) ve Tılsımlı Kandil ikinci denemede bir kez daha çarpıyordu. Albastı vuruşlarında kanca çarpanı ×190 bine çıkıyor, Albastı canı 40 dakikada milyon kat büyüse de siliniyordu. Çarpan artık sabit 20, yığın yalnız şansı artırır; Kandil'in ikinci denemesi ilk tutmadıysa işler. Kartal Gözü (şanssız sabit çarpan) Kandil geçişinde ikinci kez uygulanmaz.
- **Zırh %100'de tam bağışıklık** (decompile kuralı, normal aşamalarda korunuyor). 40 dakikayı dolduran her koşuda zırh 1'di. Ölümlerin neredeyse tamamı kaynağı olmayan darbelerden (mermi, alan) geliyordu, Albastılar bota 530 saniyede 8 kez dokundu. Son Dalga sürerken bütün darbeler zırhın yarısını deler.
- **Küçük hatalar.** `calc()` canı her çağrıda azami cana kırpıyordu (Erlik Ruhu her 20 öldürmede çağırıyor), aşırı can sürekli siliniyordu; artık aşırı can tavanına kırpar. Zehir ve yanmanın bitirdiği ölüm (`hurtP(1e9)`) kaçınma, engelleme ve Kalkan'la atlatılabiliyordu; artık atlatılamaz (Hızlı Koşucu süre sonu da).

**Ölçüm** (güçlü profil, CAP 2400 sn). Önce: Kemik tohum 44 ve 11, kaçınma + saldırı hızı build'i 2400 sn; tohum 44 doğal koşu 2400 sn; Alp tohum 44 (zırh 1) 2400 sn. Son yapıda: kaçınma + saldırı hızı 508 ve 518 sn, zırh 10 + saldırı hızı 916 sn, zırh 10 + kaçınma 578 sn, Alp doğal koşu 480 ve 515 sn. Ara yapılarda (zırh delmesi gelmeden) kaçınma + saldırı hızı 712–1106 sn, doğal koşular 500–790 sn ölçüldü, ama zırhı 1'e çıkan iki koşu (Kemik + Kor İzi, Alp + Kılıç Darbesi) yine 2400 sn'yi doldurdu; zırh delmesi bunun için eklendi. Son yapıda 40 dakikayı dolduran koşu yok. Bot sürümler arasında aynı build'i kurmuyor; karşılaştırma bu yüzden tomları kurulmuş (`SET_T`) koşularla yapıldı.

Doğrulama: duman testi 74/74 (son yapı dahil üç ayrı yapıda), Codex üç tur (önizleme ve bot sayaçları düzeltildi; son turda bulgu yok), önizleme tarayıcıda ölçüldü. Bot notu: aşama geçişlerinde oyun gerçek zamanlı ve can dolmadan bekler; makine çok yüklüyken (5 Chrome + test) güçlenme evresinde ölüm görülebiliyor, aynı tohumlar yük altında değilken geçti. Elle oynanmadı.

### Silah dengesi ve kadro artıkları (6 Kasım 2026)

**Ölçüm** (`tests/tezgah.mjs`, silah 5 seviye, dps durarak / koşarak). Önceki turdan sonra en zayıf ile en güçlü arasında ~12 kat fark vardı. Zayıfların çoğunda sorun sayı değil mekanikti:
- **Uzun Menzilli** 95 / 2 → 290 / 304. Adet yükseltmesi hiç işlemiyordu (her zaman tek atış); artık her adet ayrı bir hedefe. Varsayılan "Baktığın yön" hedeflemesinde hep kameranın baktığı yöne kör atış yapıyordu, kaçarken bütün atışlar boşa gidiyordu: şimdi önce bakılan yöndeki (±35°) en uzak hedefler, önde kimse yoksa çevredekiler. Seviye hasarı +4 → +6.
- **Aşık Kemiği** 71 → 356. Hasarı silahın hasarına bağlı değildi (zar × 2, hasar yükseltmesi yoktu). Artık silah hasarı × zar / 3,5 (1 zayıf, 6 neredeyse iki kat), taban 9, seviye +2, bir sekme.
- **Kan Büyüsü** 80 → 319: iki düşman deler, seviye hasarı +1,5 → +3.
- **Işık Hüzmesi** 131 → 347: hüzme hedefte durmaz, menzilin sonuna uzanır; her adet ayrı hedefe ayrı hüzme (seviyede +1 adet, bekleme 0,9 → 1,1).
- **Ejder Nefesi** 163 → 332: tek darbe yerine 0,28 sn'de üç dalga (taban hasar 15 → 12). Dalga aralığı saldırı aralığının üçte birini geçmez, yeni nefes bekleyen dalgaları düşürmez.
- **Şok Dalgası** 143 → 305 (bekleme 4 → 3, seviye hasarı +2,5 → +4). **Çakaralmaz** 159 → 259 (saçma bir düşman deler, bekleme 1,25, seviye +4). **Ruh Okları** 154 → 216, **Yıldırım** 131 → 221 (taban 9, bekleme 1,1, seviye +3).
- **Sekme** her vuruşta %10 zayıflar: mermi ve sekme sayısı birlikte arttığında (Kemik, Uçan Hançer) vuruş sayısı karesel büyüyordu. 5 sekmede toplam etki −%22, 20 sekmede 21 vuruştan ~9'a. Tezgâhta Kemik 564 → 472, Uçan Hançer 547 → 448 (hâlâ üst grupta).
Değişmeyen silahlar ±%10 içinde. Yakın dövüş silahlarının koşarken düşük çıkması tezgâhın geometrisi (oyuncu sürüden kaçıyor); karşılaştırmada durarak değer esas.

**Son Dalga.** Kemik ile güçlü profil, tohum 44, eski ve yeni sürüm: bot iki sürümde farklı build kurdu. Eskide Kemik + Yıldırım 8 dakikada öldü; yenide Kemik + Ateş Topu, kaçınma tomu 26 ve saldırı hızı 33 ile 40 dakikayı doldurdu (583 bin öldürme, Albastıların çoğunu Ateş Topu öldürdü). Uçtaki build'i taşıyan silah değil kaçınma ve saldırı hızı yığını gibi görünüyor (sonraki turda çözüldü: kaçınma, Tokmak ve zırh; bkz. Son Dalga: güçlü build sınırı).

**Kadro artıkları.** Kafes (Yaban kadrodan çıktı) artık her Kara Koru aşamasında çıkar ve açılınca bedava sandık bırakır; eskiden ödülsüzdü ve Yaban'ı almış kayıtlarda hiç çıkmıyordu. Anka'nın ibiği tepenin arkasına alındı: şapkalar (taç, kalpak) önüne oturuyor, eskiden ibiğin içinden geçiyordu. Yeni gövdelerin köşe sayısı ölçüldü, eski aralıkta: Anka 12 bin, Çalı 11 bin, Tulpar 14 bin, Kemik 20 bin (Gölge 11 bin, Kam 27,5 bin), her biri tek mesh. Pehlivan Yağı, Tunç Kalkan, Şahmeran Pulu adları kaldı: karaktere değil kültürel öğeye dayanıyorlar. Kaldırılan karakterlerin `c_*` görevleri bilinçli olarak gümüş görevi. Güncel durum tablosunda kadro 8.

Doğrulama: tezgâh (eski yapı ile yan yana, 31 silah), duman testi 74/74 (kılıç denetimi dört koşunun birinde kaldı, yeniden üretilemedi; düşman oyuncunun zeminine sabitlendi ve kalırsa tanı bilgisi yazılıyor), Anka şapka görüntüleri önce/sonra, Codex iki tur (bulunan altı sorun düzeltildi: Uzun Menzilli ön süzgeci ve en uzak seçimi, Ejder dalgalarının yüksek saldırı hızında düşmesi, Işık Hüzmesi'nin ölüp havuza dönen hedefe sapması ve uzatılınca yerin altına inmesi). Elle oynanmadı.

### Silah ve düşman dövüşü (6 Kasım 2026)

Ölçümle başlandı. `tests/tezgah.mjs` her silahı tek başına aynı sürüye karşı dener: 24 düşman, dört türden altışar; ölen yerine aynı tür doğar, oyunun kendi doğuşu kapalı. Oyuncu yerinde durur ya da daire çizerek koşar, silah 5 seviye güçlenmiş. Okçu isabeti ayrıca sayılır. Değişmeyen silahlar eski ve yeni sürümde ±%10 içinde aynı çıktı; aşağıdaki sayılar yerinde duran oyuncu için hasar/sn.

Bulgular:
- Yıldırım 38 ile en zayıf silahtı (Ruh Okları 146, Ateş Topu 564).
- Dönen Kılıçlar dibe sokulan 3000 canlı sürüye 346 verebiliyordu (Erlik Kılıcı 2.684); yörünge sabit 3.8 m'deydi ve içerisi boştu.
- Zehir İzi ve Kor İzi dururken hiç çalışmıyordu.
- Okçular daire çizerek koşan oyuncuya 30 sn'de 65 oktan 1'ini isabet ettiriyordu.

- **Dönen Kılıçlar** (`weapons.js`):
  - Yörünge 3 sn'lik bir nefesle R × 0.45 ile R arasında açılıp kapanır; dibe sokulan da kesilir.
  - İsabet, kılıcın o karede saptan uca taradığı açı dilimidir. Kılıç yörüngeye teğet durur; alan da görünen bıçakla aynıdır. Hızlı dönüşte araya düşen kaçmaz, uzun boss gövdesi de vurulur.
  - Her kılıç kendi isabet kaydını tutar. Eskiden düşman başına tek bekleme (0.35 sn) vardı ve fazladan kılıç aynı düşmana değemiyordu.
  - Sonuç: sürüde 625 → 875, dayanıklı sürüde 346 → 1.661 (Kılıç Savuruşu 1.051, Erlik Kılıcı 2.761).
- **Yıldırım:**
  - İlk hedef menzildeki en yakın 8 düşmandan rastgele seçilir. Hep en yakına düştüğünde başka silahın zaten öldürdüğü düşmana boşa çarpıyordu.
  - Her çarpma noktasının 2.3 m (× √Boyut) çevresindeki zincir dışı düşmanlar %60 hasar alır.
  - Bekleme 2.2 → 1.4 sn.
  - Sonuç: 38 → 130, dayanıklı sürüde 41 → 135.
- **Zehir İzi, Kor İzi:**
  - Gölcük zamana göre değil, iz yarıçapı kadar yol alındıkça düşer; dururken ayağın dibine saniyede bir (`trailDrop`).
  - Aynı izin üst üste binen gölcükleri bir düşmana tik başına bir kez vurur; hasar koşma hızına bağlı değil.
  - Zehir İzi zehir yığını bırakır ve zehir izden çıkınca da işler. Yığın başına hasar, tik hasarının 0.8'i; Zehir Şişesi'nde 0.4.
  - Alan tikleri ara sıra hasar sayısı gösterir (`hurtE` `num`).
  - Sonuç, öldürme sayısıyla: Zehir İzi yerinde 0 → 119, koşarken 50 → 87. Kor İzi yerinde 0 → 141, koşarken aynı (68-69).
  - Tezgâhın hasar sütunu zehir yığınının zamanla verdiği hasarı saymaz.
  - Zehir Şişesi'nin gölcükleri bu sınırın dışında, değişmedi.
- **Okçu** (`update.js`; Kaktüs ve okçu ara bosslar dahil):
  - Okun uçuşu boyunca oyuncunun gideceği yere nişan alır: öngörü %75, ara boss ve elitte %100, yarım metre sapma. Ok hızı 22 → 24.
  - Atıştan 0.35 sn önce yayın ucunda parıltı ve atış sesi. Menzil dışındaysa ya da atış anında görüş yoksa sayaç parıltıya geri döner; uyarısız ok yok.
  - Menzil bandında (14-22 m) dikilmek yerine yana kayar, yönü 1.6-3.2 sn'de bir değişir.
  - Ok hasarı türün hasarının yarısıdır: İskelet okçu eskisi gibi 10, Kaktüs 15, elit 1.5 kat. Eskiden her okçuda sabit 10'du.
  - Oyuncu isabeti P.y çevresinde 1.4'lük küre yerine dikey bir silindir: yatayda 1.1, ayağın 0.15 altından başın üstüne. Zıplayarak geçilen mermi vurmaz; boss halkasının üstünden atlamak eskisi gibi çalışır.
  - Sonuç: daire çizen oyuncuya isabet 65 oktan 1 → 14 (%22). Düz koşan vurulur, yön değiştiren çoğunlukla kurtulur.
- **Dev yumruğu** (taş dev, tanklar, Kadim Mumya, dev ara bosslar; direk ve Kemik Yumağı hariç):
  - Dev değerek vurmaz. Yaklaşınca durur, kollarını kaldırır ve 0.66. saniyede önüne indirir.
  - İnen yerin gövde yarıçapı + 1.7 m içindeki oyuncu türün hasarının 1.25 katını alır. Yerde toz halkası ve hafif sarsıntı çıkar; dev sonra 0.9-1.4 sn bekler.
  - Kol animasyonu vuruşa bağlandı (`anim.js` `s.atk`). Yakınken oynayan süs döngüsü bu devlerde kapalı.
  - Kalkışı görüp 0.25 sn içinde geri çekilen vurulmaz.

Doğrulama:
- Duman testi 74/74. İki yeni kontrol var:
  - 1.6 m'deki düşmanı kılıç keser, yıldırım 1.2 m yandakini çarpar, zehir dururken göllenip zehirler.
  - Okçu oyuncunun önüne atar ve ok hasarı türün yarısıdır. Yumruk kalkıştan 0.67 sn sonra iner; geri çekilen kaçar.
- Yumruğa, kılıç nefesine ve okçu parıltısına ekran görüntüsüyle bakıldı.
- Codex iki tur inceledi; bulguların hepsi düzeltildi:
  - Zıplama kapsülü ve menzil dışından gelen ilk okun uyarısı.
  - Kılıç isabetinin teğet bıçağa hizalanması.
  - Tezgâhın sürü kotası, doğuşu, hırsızları ve rapor klasörü; Kalkan tezgâhta ölçülmez.
- Girdap hasarı silaha yazılmıyordu (`weapon-fx.js` `vxUpd`): koşu sonu hasar grafiğinde görünmüyor, öldürmeleri Girdap'a sayılmıyordu. Düzeltildi.
- Denge botu (ölümsüz, daire çizen) eski ve yeni sürümde:
  - Alınan hasar/sn K1 15.5 → 12.2, K2 24 → 20.9 ve 22.7 → 21.6; ikinci tohumda 13 → 12.6.
  - Boss düşme süreleri botun seçtiği silaha göre iki yönde de oynuyor (90 → 154 sn ve 126 → 42 sn). Değişen silahlar boss'a ayrıca dokunmuyor, ama Dönen Kılıçlar artık boss gövdesine de değiyor.
- Elle oynanmadı. Okçuların gerçek oyunda ne kadar can yaktığı ve yumruğun hissi oyuncuda görülmeli.

### Premium siyah arayüz, kadro 8 karaktere indi (6 Kasım 2026)

**Arayüz.** Kahverengi ve krem tonlar aynı parlaklıkta grafite çevrildi (betikle, 217 renk); doygun renkler kaldı: altın para, kırmızı can, turkuaz tecrübe. `main.css` sonundaki "v10 · premium siyah" katmanı: yüzeyler yarı saydam siyah ve arkasını bulanıklaştırır (`--glass`), çerçeveler 1 px saç teli (`--line`), turuncu kor vurgusu, sol renk şeritleri, başlık altı süsleri ve değer parıltıları kalktı. Birincil düğme beyaz dolgu, ikincil saydam; seçili sekme beyaz hap; seçili karo ince beyaz halka; odak 1,5 px beyaz. Seçim kartlarında kalın üst şerit yerine nadirlik renginde 1 px üst çizgi. HUD yuvaları, can ve tecrübe çubukları düz ve saydam.

**Kadro 21 → 8.** 21 karakterin hepsi 4 taban gövdenin (Alp, Kam, Gölge, Bahadır) renk değişimiydi. Kalanlar: Alp, Kam, Gölge, Bahadır ve yeni gövdeli Kemik (iskelet), Anka (kuş-insan, ateş kanatları, tüy kuyruk), Çalı (yürüyen yaprak yumağı, kovukta gözler, kök ayaklar), Tulpar (at başlı, kanatlı, toynaklı). Yeni gövdeler aynı iskeleti (`humSK`) kullanır, animasyon, şapka ve kostüm çalışır. Kaldırılan 13 karakter (Börü, Ayaz, Kara Han, Tunç, Pehlivan, Yaban, Haydut, Umay, Aşıkçı, Gökçe, Şahmeran, Okçu, Orakçı) kayıt uyumu için `CR` içinde `off: 1` ile durur; `heroIdx()` etkin kadroyu verir. Seçim, Otağ, sıralama, görev ve başarımlar etkin kadroyu kullanır; kayıtlı seçim kaldırılan karakterse Alp'e döner.

Kaldırılan karakterlere bağlı açılışlar taşındı (görev anahtarları aynı): Kızıl Bozkır karaktersiz açılır (eskiden yalnız Tunç); Havai Fişek → Çalı, Kurt Postu → Tulpar, Gaz Maskesi → Kemik, Şahmeran Pulu → Gölge, Kanlı Satır → Bahadır, Kam Külahı → Kam, Şaman Maskesi → Alp, Balkabağı → Anka; şapkalar Soytarı → Kam, Peynir karaktersiz, Çömlek → Kemik, Baret → Bahadır, Şerif → Çalı, Kavuk → Tulpar, Börk → Alp, Tülbent → Gölge; Kızıl ve Beyaz kostümler Anka'ya. Kaldırılanların açılış görevleri gümüş görevi olarak durur. Kahraman görevi bitince "Otağ'da satın alınabilir" bildirimi artık çıkıyor (karşılaştırma `q_` önekini kaçırıyordu).

Doğrulama: duman testi 72/72; 8 modelin yan yana görüntüsü ve koşma/zıplama/kayma kareleri; menü, kahraman, harita, ayarlar, Otağ, sıralama, seviye, duraklatma, ölüm ve HUD ekran görüntüleri (masaüstü ve telefon genişliği). Elle oynanmadı.

### Sıralama güvenliği, Son Dalga dengesi, arayüz sadeleştirme (6 Kasım 2026)

**Konsol.** Oyunu etkileyen bir konsol komutu (altın, seviye, eşya, silah, ölümsüzlük...) kullanılan koşu sıralamaya girmez, rekor sayılmaz; sonuç ekranı bunu söyler. Menüde konsolla gümüş ya da kilit alan profil (`META.con`) ortak sıralamaya yüklemez, kendi rekorları tutulur. Bilgi komutları (yardim, perf, fps, gorevler...) işaretlemez.

**Son Dalga ölçümü** (`tests/sondalga.mjs`): bot kademeyi güçlenerek bitirir (bu evrede can dolar), sonra Son Dalga'da gerçek hasarla kaçarak oynar. Profiller: zayıf (K1, 300 sn), orta (K2), güçlü (K3, takviyeli). İlk ölçümde (4 tohum) güçlü build'lerin dördü de 40 dakikayı aştı, 650 bine varan öldürmeyle; kaçan bot hiç hasar almıyordu. Bulunan üç neden ve düzeltmeler:
- Albastılar 20. dakikaya kadar hızlanmıyordu ve oyuncuya yetişemiyordu. Artık hız Son Dalga'nın başından artar (`ghostSp`, 8 dakikada 2 kat), sürüdeki Albastı sayısı 4 dakikada bir artar (en çok 5).
- Geri itme, dondurma, yavaşlatma ve büyüleme güçlü build'lerde Albastıları sonsuza dek uzak tutuyordu; Albastılar artık bunlardan etkilenmez (yanma, zehir gibi hasar etkileri işler). Canlarına ayrıca kübik bir çarpan geldi (`ghostHp`: 4 dk ×2, 10 dk ×17, 20 dk ×146).
- Asıl döngü: Son Dalga'da dakikada binlerce öldürme arasında Mavi İskeletler her biri tam bir seviye veriyordu; güçlü build 10 dakikada seviye 124'ten 483'e çıkıyor, hasarı Albastıların üstel canını geçiyordu. Mavi İskelet Son Dalga'da doğmaz.

Son ölçüm (yarıda durduruldu, 9 koşu): zayıf 1,8 / 2,9 / 3,1 / 5,6 dk; orta 2,2 / 4,1 / 6,8 dk; güçlü 8,8 / 9,8 dk ve bir Kemik build'i 40 dakikayı doldurdu (288 bin öldürme). Build gücü artık süreye yansıyor; ama Kemik (mermi ve sekme sayısı seviyeyle birlikte artıyor) hâlâ uçta, ayrıca bakılmalı. Bot gerçek oyuncudan zayıf build kurar ve kusursuz kaçar; sayılar mutlak değil, karşılaştırma içindir. Elle oynanmadı.

**Sadeleştirme.** Otağ 7 sekmeden 4'e indi (Güçler, Kilitler, Görevler, Koleksiyon; Havuz yalnız Toggler alınınca görünür). Görevler bitmeye en yakın olandan sıralanır, ilk 40 görünür, kalanı ve tamamlananlar katlanır; Başarımlar görev sekmesinde katlanmış bölüm (görev geçmişi tekrarı ve geliştirici notu çıktı). Bestiyer Koleksiyon'a katıldı; görülmemiş türler tek tek "???" satırı yerine tek cümle. Ayarlar 6 sekmeden 4'e indi (Arayüz Görüntü'ye, Gelişmiş Oyun'a). Kısayollar penceresinde konsol komutları katlanmış "geliştirici aracı" bölümünde.

**Hata:** hasar sayısının sınıfı (`dn`) "tamamlandı" işaretiyle aynıydı; tamamlanmış başarım, görev ve meydan okuma düğmeleri hasar sayısı gibi ekrana sabitlenip uçuşuyordu (Başarımlar sekmesinde sol üstte üst üste binen kutular). Hasar sayısı `dnum` oldu.

Doğrulama: duman testi 72 kontrol, 72/72 (yeni: konsol kullanılan koşu sıralamaya girmez). Bu turun Codex incelemesi yapılmadı.

### Kalan ekranlar yeni tasarıma taşındı (6 Kasım 2026)

Giriş menüsünden sonra eski görünümde kalan ekranlar aynı dile çekildi: sola yaslı başlık (küçük üst yazı, başlık, sağda bilgi çipleri), içerik, altta ayrık düğme satırı.

- **Duraklatma** iki sütun: solda harita adı, aşama süresi, seviye, altın, hedef ve menü satırları (Devam et odakta gelir, kumandada A ile döner; Koşuyu bırak kırmızı); sağda kendi içinde kayan build: silah ve tom yuvaları, eşyalar, pasif, silah kartları, istatistikler.
- **Ölüm ve çıkış** tek sütun özet: üst yazıda harita, kademe, aşama ve rütbe; büyük başlık; dört sayı (öldürülen, süre, seviye, dakikada); gümüş kartı ve dökümü; yeni açılanlar çip olarak; tamamlanan görevlerin ilk dördü satır satır, kalanı tek cümlede (eskiden hepsi tek paragraftı); silah hasarı; dört düğme tek sırada. Bu ekranda ipucu kutusu kapatılır ve hiçbir düğmeye kendiliğinden odaklanılmaz (ölürken zıplamaya basan oyuncu sonucu görmeden yeniden başlamasın).
- **Otağ:** başlık ve gümüş çipi; kilitli güçlerde devre dışı "Kilitli" düğmesi yerine kilit simgeli yazı; en üst seviyeye çıkan güçte "En üst". Sekme değişince giriş animasyonu oynamaz.
- **Sıralama:** 22 metin düğmesi yerine kahraman seçimindeki gibi portre karoları; iki tablo kart içinde; açıklama alt satırda tek cümle.
- **Meydan okuma sunağı:** ortalanmış uzun liste yerine dört sütunlu kart ızgarası; seçenekler artık düğme (eskiden tıklanabilir div'di, klavye ve kumanda erişemiyordu).
- **Seçim ekranları** (seviye, sandık, tüccar, kazan): kartlar büyüdü (300 px, 60 px simge, 24 px ad); seviye ekranında altta şu anki silah ve tom yuvaları.
- **İpucu kutusu** bir ekran açıkken üstte başlığın üstüne biniyordu; artık altta durur.
- Kısayollar penceresinde kayma tuşu Ctrl olarak düzeltildi.

Doğrulama: duman testi 71 kontrol, iki kez 71/71 (yeni: duraklatma odağı ve build, sunak düğmeleri, ipucu yeri, Otağ’da Esc; çıkış ekranında dört düğme). Codex incelemesi iki sorun buldu, ikisi de düzeltildi: kısa ekranda ölüm ekranının başlığı kaydırılamayan yere itiliyordu; Otağ’da Esc gösteriliyordu ama çalışmıyordu (artık Esc ve kumandada B menüye döner). Ekranlar başsız Chrome'da gerçek GPU ile 1440×810 ve 390×760 boyutlarında görüntülendi. Aşama geçiş ekranı değişmedi. Gerçek kumanda ve telefonla denenmedi.

### Kullanıcı geri bildirimi turu: tuş, ses, görsel, arayüz (5 Kasım 2026)

Erdem oyunu deneyip on iki madde yazdı; hepsi ele alındı.

- **Kayma tuşu Ctrl** (Megabonk varsayılanı); C de çalışmaya devam ediyor. Oyundayken Ctrl+harf tarayıcı kısayolları engelleniyor. Windows ve Linux'ta Ctrl+W sekmeyi kapatır ve engellenemez; koşu sürerken Ctrl basılıysa tarayıcı çıkış onayı soruyor. macOS'ta birden çok klavye düzeni varsa Ctrl+Boşluk düzen değiştirir (kayarken zıplama); bu sistem kısayolu sayfadan engellenemez.
- **Müzik kısınca arkada müzik kalıyordu.** Notaların yankı gönderimi müzik ses düğümünden (MUB) önce alınıyor, yankı dönüşü ise ayara bağlı değildi; müzik sıfırda bile yankı kuyruğu duyuluyordu. Yankı dönüşü (`RVMG`) artık müzik ayarını izliyor; müzik sıfırken nota da planlanmıyor.
- **Makam seçimi.** İki sorun vardı: düğmeler Davul kilidine bağlıydı (kilitliyken basmıyordu) ve seçim açıkken de duyulmuyordu, çünkü fark yalnız birkaç perdenin yarım ses kaymasıydı ve eksi dereceli (alt oktav) notalar hiç kaymıyordu. Artık her makamın kendi karar perdesi, temposu ve ezgi sırası var, alt oktav notaları da makama uyuyor, seçince dizisi önizleme olarak çalınıyor. **Karar (Erdem onayladı, 6 Kasım 2026):** makam seçimi herkese açık; Davul hatıra eşyası olarak kaldı. Megabonk'ta müzik seçici (Boombox) kilitlidir, bu bilerek ayrılan bir fark.
- **Sesler.** Darbe: metalik çınlama ve doygunluk yerine kısa bir "tok" (enerjinin %95'i 124 ms → 78 ms, −3 dB); her darbede bütün sesi boğan alçak geçiren süzgeç kaldırıldı, en sık 0.12 sn'de bir çalar. Tecrübe: çınlayan cam yerine kısa marimba tıkı (267 → 80 ms, ağırlık merkezi 1356 → 836 Hz, −3 dB), pentatonik merdiven. Altın: 5.9 kHz merkezli şıngırtı yerine iki kısa sıcak tık (2.8 kHz, −4 dB). Ocak dolumu: dolum ilerledikçe iki oktav yükselen 12 kalimba notası (yeni `chg` sesi). Ölçümler `test-results/ses.mjs` ile üretilen örneklerden; kulakla dinlenmedi.
- **Ayarlar penceresi** sabit boyutlu: içerik kendi içinde kayar, sekme ve seçenek değişince pencere büyüyüp küçülmez, giriş animasyonu yeniden oynamaz.
- **Oyun içi arayüz Megabonk düzeninde:** üstte tam genişlik tecrübe çubuğu; sol üstte koşu süresi, altın, öldürme; altında can, silah ve tom sıraları (altlarında seviye), hedef kutusu; ortada aşama sayacı; sağ üstte sandık fiyatı, seviye, harita; altta eşya sırası.
- **Giriş menüsü yeniden çizildi:** ana sayfa metin ağırlıklı beş satır; kahramanlar 7×3 portre karosu (kilitli olan soluk ve kilit simgeli, koşulu tamam olan altın noktalı); seçilenin künyesi tek kartta (ad, rütbe, başlangıç silahı, stat rozetleri, pasif, kilit koşulu). Aynı sayfa yeniden çizilirken giriş animasyonu oynamaz.
- **Görseller** (`engine/vfx.js`, `game/loot.js`): düşman mermileri kırmızı küre yerine hız yönüne dönük, koyu dış çizgili gövdeler (normal: sarı uçlu kızıl mızrak ucu; boss buz atışı: mavi kristal; güdümlü: mor dikenli yıldız), kısa izle. Yerdeki can 3B kalp (kameraya bakar, atar). Sikke kalın, kenar çemberli ve kabartmalı; tecrübe dik altıgen kristal. Ganimet malzemeleri sahne ışığından bağımsız (matcap), gece de aynı okunur. Hız, ömür, isabet yarıçapı ve hasar değişmedi.

Doğrulama: duman testi 70 kontrol, iki kez 70/70 (iki yeni: sabit ayar penceresi, makam, müzik sıfırı, yeni menü; Ctrl ile kayma, HUD yerleşimi, ses tarifleri). Arayüz ve görseller başsız Chrome'da gerçek GPU ile 1440×810, 844×390 ve 390×760 boyutlarında ekran görüntüsüyle kontrol edildi. Codex incelemesi dört sorun buldu, dördü de düzeltildi: dar ekranda sayaç can çubuğunun üstüne biniyordu; dar ekranda ortalanmış ayar sekmelerinin başı kaydırılamıyordu; art arda makam seçince iki önizleme üst üste çalıyordu; alt oktav notalarının makam kayması sentez dizisi yerine yanlış taban diziyle hesaplanıyordu.

Denenmeyenler: sesler kulakla dinlenmedi (yalnız süre, düzey, tını ölçümü); gerçek boss dövüşünde buz ve güdümlü atış görülmedi (aynı kayıt biçimiyle elle eklenerek bakıldı); düşük kalite ayarında görsel alınmadı; gerçek telefon ya da tablette denenmedi. Otağ, duraklatma, seviye kartı ve sıralama ekranları eski görünümünde.

### Kumandayla menü erişimi (5 Kasım 2026)

Üçüncü hata avında açık kalan madde kapatıldı. Menüde kumanda odağı yalnız düğme ve kartları geziyordu; harita ekranındaki kapalı "Meydan okuma" başlığına, ayarlardaki kaydırıcılara ve onay kutularına ulaşılamıyordu.

- Odak listesi (`padItems`, `input/gamepad.js`): düğme, kart, açılır başlık (`summary`), kaydırıcı, onay kutusu. Kapalı bir açılır bölümün içindeki düğmeler listeye girmez.
- Kaydırıcı odaktayken sağ ve sol değeri bir adım değiştirir (ayarın kendi `oninput` yolu çalışır), yukarı ve aşağı öbür denetime geçer. A onay kutusunu çevirir, açılır başlığı açıp kapatır.
- Sol çubuk da yön tuşu sayılır; basılı tutulunca 0.4 sn sonra 0.09 sn aralıkla tekrar eder.
- Oyundan menüye çubuk basılıyken girilirse (seviye kartı, duraklatma) çubuk bırakılana dek odak oynamaz. Yoksa yürürken açılan kart ekranında odak kendiliğinden bir karta gider ve zıplama tuşu onu seçerdi.
- Tıklama ekranı yeniden çizdiğinde (ayar sekmesi, seçenek düğmesi, meydan okuma) odak aynı düğmede kalır; düğme kapanan bölümde kaldıysa başlığa döner.
- Kumandayla verilen odak `html.pad` sınıfıyla çerçevelenir (programla verilen odakta `:focus-visible` her tarayıcıda eşleşmiyor); fare ya da dokunuş gelince sınıf kalkar.
- B artık klavyedeki Esc ile aynı yerlerde geri götürür: ayarlar, yardım, sıralama ve menü sayfaları (eskiden yalnız tüccar, kazan ve meydan okuma dükkânı).

Doğrulama: duman testi 68 kontrol (iki yeni: sahte kumandayla açılır liste, kaydırıcı, onay kutusu, sekme, B ile geri, yön ve A aynı karede; basılı çubuk koruması). Odak çerçevesi başsız Chrome ekran görüntüsünde üç denetimde de görünüyor. Codex incelemesi bir hata buldu (yön ve A aynı karede basılınca eski denetim tıklanıyor, odak yokken çöküyordu); düzeltildi ve teste eklendi. Gerçek bir kumandayla denenmedi; test `navigator.getGamepads` yerine konan sahte nesneyle `padTick`'i adımlıyor.

Duman testinin ara sıra kalması: bu turdaki koşulardan birinde kumandayla ilgisiz iki kontrol birlikte kaldı (duvardan sıçrama, direkler). İki blok taze dünyalarda tekrar tekrar koşularak (`test-results/flake*.mjs`, 50 dünya) üç neden yeniden üretildi; üçü de test düzeneğinde, oyunda hata yok:

- Duvar testi ilk uygun engeli seçiyordu; 5 m'lik bir kaya gelirse oyuncu 20 karede tepeye varıyor, duvar teması kesiliyor ve sıçrama ölçülemiyordu. Artık önce 8 m ve üstü engel aranıyor.
- Direk dolumu sırasında seviye ekranı açılırsa oyun duruyor ve direk 260 karede dolmuyordu. Test artık seviye eşiğini kapatıyor ve ekranı kapatıp sürüyor.
- Oyuncunun konduğu nokta bir zıplama tahtasına denk gelirse 11 m yukarı fırlıyor, 5 m'lik dikey dolum sınırının dışında kalıyordu. Test artık tahtadan uzak bir yan seçiyor. Oyunda bu bir kilitlenme değil: dolum sıfırlanmaz, oyuncu direğin öbür yanında durabilir. 300 direk ölçümünde hiçbiri zeminden 1.4 m'den yüksekte değildi; 228 rastgele konumlu direğin hepsi doldu.

Düzeltmeden sonra duman testi üç kez art arda 68/68. Kalma oranı altıda bir ile on dörtte bir arasındaydı; üç koşu tek başına kanıt değil, dayanak yeniden üretilen nedenlerin kapatılması.

### Üçüncü hata avı: ulaşılamayan kilitler (5 Kasım 2026)

Codex'in yarım kalan avı yeniden çalıştırıldı (bu kez bulgularını bulduğu anda yazarak); ayrıca görevlerin okuduğu 112 sayaç, kodda artırılıp artırılmadığına göre betikle tarandı. 10 bulgunun 9'u düzeltildi:

| Hata | Düzeltme |
| --- | --- |
| **Eski Maske ve Yılan hiç açılamıyordu:** görevleri "bulundu" sayaçlarını bekliyor ama haritada bu nesneler yoktu | Mezarlık'a iki gizli nesne: Eski Maske (haritada) ve Yılan yuvası (Mahzen'in içinde); sunak türleri 18 ve 19 |
| **Kaval kendi kilidine bağlıydı:** açmak için 20 büyüleme gerekiyor, büyüleyen tek kaynak Kaval | Kaval varsayılan açık; görev gümüş ödüllü kaldı |
| **Hortlak Feneri kendi kilidine bağlıydı:** boss'u bu eşyayla öldürmek gerekiyordu (Megabonk'ta koşul arena lambası; bizde lamba yok) | Dev Hortlak'ı devirmek yeter |
| **Şaman Maskesi açılamıyordu:** Kalkan'ın karşı dalgası "Şok Dalgası" olarak sayılıyordu | dalga `aegis` etiketi taşır |
| **Kalpak ve Zaman Büküğü açılamıyordu:** aşamada tek Kara sunak vardı, sayaç da boss çağrılınca sıfırlanıyordu | her aşamada iki Kara sunak; aşama boyunca toplam ayrı sayılır (`P.bossCurN`) |
| **Kara Haydut'u öldürmek Börü'yü bedelsiz açıyordu** (koşul görevi ve 32 gümüş atlanıyordu) | kaldırıldı |
| Tüccardan, teklif görüldükten sonra başka yerden alınmış tekil eşya satın alınınca altın kesilip hiçbir şey verilmiyordu | satış reddedilir |
| "Çıplak" meydan okumasında tüccardan eşya alınabiliyordu | satış reddedilir |
| Koşu sonunda tamamlanan görevlerin (ilk koşu, zafer, rütbe) ödülü bir sonraki koşunun ilk seviye atlamasına kalıyordu | sayaçlar işlendikten sonra görevler bir kez daha denetlenir |

Kumandayla harita ekranındaki kapalı "Meydan okuma" bölümüne ve ayarlardaki kaydırıcı ile onay kutularına ulaşılamıyordu; bir sonraki turda kapatıldı (yukarıdaki "Kumandayla menü erişimi"). Codex ayrıca Otağ satın alma kapılarını, Kapan sınırını ve Dönen Kılıçlar'ın temizliğini inceledi, hata bulmadı. Duman testi 66 kontrol.

### İkinci tarama ve hata avı turu (5 Kasım 2026)

**Bot taramaları.** 30 meydan okumanın her biriyle bir koşu (`CHAL=<anahtar>`) ve Mezarlık'ta 21 kahramanla birer koşu: sayfa hatası, NaN ya da kilitlenme yok. Beklenen sonlar: Kırılgan'da bot 4. saniyede öldü (her darbe öldürür), Hızlı Koşucu'da 5 dakika dolunca koşu bitti, Ayaz Dev Hortlak'ın tek vuruşuyla öldü (bot sunağa sığınmıyor). Mezarlık'ta 21 kahramanın 21'i dört anahtarı topladı. Meydan okumalarda botun tek hedefe hasarı zayıf kaldı: 30 koşunun 5'inde ilk boss 10 dakikada düşmedi; denge kararı için elle oyun testi gerekiyor.

**Dokunmatik benzetimi** (844×390, dokunmatik bağlam): Kullan düğmesi görünüyor, otomatik etkileşim boss çağırmıyor, düğmeye dokununca boss geliyor. Dokunmatikte ipuçlarındaki "E ile" artık "Kullan düğmesiyle", ipucu dokununca kapanıyor, otomatik etkileşimin atladığı sunakların etiketi "Kullan:" diyor. Gerçek cihazda denenmedi.

**Codex'in ikinci hata avı** (kayıt, kartlar, silahlar, eşyalar, girdi) rapor yazamadan kesildi (model kapasitesi); günlüğündeki ara notlardan altı ipucu çıkarıldı, altısı da kodda doğrulanıp düzeltildi:

| Hata | Düzeltme |
| --- | --- |
| Ana menüde "Nasıl oynanır" açılıp kapatılınca oyun `start()` çağrılmadan oynanır duruma geçiyordu (kahraman kilidi denetimi atlanıyor) | yardım yalnız oyun, duraklatma, ayarlar ve menüden açılır; menüye geri döner |
| Sıradan eşyaların hepsi Toggler ile kapatılınca sandık açmak sonsuz özyinelemeyle çöküyordu (`itemOf`) | kademeli geri düşüş |
| Sunulacak seviye kartı kalmayınca (hepsi çıkarılmış ya da azami seviyede) boş seçim ekranında kalınıyordu | ekran açılmaz, küçük şifa; son kart çıkarılınca ekran kapanır |
| Keloğlan eşyası öldürücü darbede canı 1'e çekip oyuncuyu diriltiyordu | yalnız hayattayken işler |
| Kalkan, finalde kapatılmış silahken de darbe engelliyordu | kapalı silah engellemez |
| İlk koşusunu bitiren her yeni oyuncuya Gölge bedelsiz açılıyordu (eski kayıt armağanı her açılışta denetleniyordu) | armağan kayıt göçüne taşındı, yalnız sürüm 6 öncesi kayıtlara (`META_V` 6) |

"Bazı eşya kilitleri tamamlanamıyor" ipucu üçüncü turda açıldı (yukarıda). Duman testi 65 kontrol.

### Otomatik oyun testi ve hata avı (5 Kasım 2026)

Oynayarak denemek mümkün olmadığı için iki yoldan hata arandı.

**1. Bot taraması.** `tests/denge.mjs` artık kahraman seçiyor (`HERO=kam`), bütün kilitleri açabiliyor (`ALL=1`), sayfa ve konsol hatalarını, bozuk (NaN) değerleri ve ölümün nedenini raporluyor. 21 kahramanın her biriyle iki tarama yapıldı: Kara Koru kademe 1 ve Kızıl Bozkır kademe 2 (iki aşama). 42 koşunun 41'i tamamlandı; hata, NaN ya da kilitlenme yok. Tek ölüm: Orakçı, Bozkır 2. aşamada (beş tekrarda yeniden üretilemedi; hesapla, hücum eden elit ara boss 146 canlı bir kahramanı tam candan tek vuruşta öldürebiliyor: 40 × 2.05 × 1.4 × 1.3 ≈ 150).

**2. Codex ile kod okuyarak hata avı.** Bugün bulunan üç hatanın kalıpları (çifte işleme, sıfırlanmayan durum, tamamlanamayan koşul) bütün kodda arandı. 12 bulgunun 11'i kodda doğrulandı ve düzeltildi:

| Hata | Düzeltme |
| --- | --- |
| Dokunmatikte tabut, Kara sunak, Kan sunağı, haydut taşı ve çalı kullanılamıyordu: otomatik etkileşim bunları bilerek atlıyor, elle etkileşim düğmesi yoktu; Mezarlık bitirilemiyordu. (Düzeltme: boss kapısı bu listede değildi, onun dünya etiketinde zaten bir düğme vardı.) | "Kullan" düğmesi (`#be`) |
| "Yalnız" meydan okuması Mezarlık'ın zorunlu tabutlarını da siliyordu; boss hiç çağrılamıyordu | tabutlar sunak filtresinden muaf |
| Boss ölünce süreli görevler (5 dk'da boss, 30 sn'de boss) saat ileri alındıktan sonra ölçülüyor, hiç sayılmıyordu | saat ileri alınmadan önce ölçülür |
| Hızlı Koşucu'da Kara sunak kopyalarından ilki ölünce saat 590'a atlıyor, kapı kapalıyken koşu bitiyordu | başka boss yaşıyorsa saat ileri alınmaz |
| Boss hasar bölgeleri (lav, kum) aşama ve koşu değişiminde kalıyor, yeni oyuncuyu yakıyordu | `setupStage` temizler |
| Ölüm listesi doluyken ganimet ve sandık haritanın merkezinin altına düşüyordu (model havuza erken iade ediliyor, konumu sıfırlanıyor) | ölüm konumu kopyalanır |
| Kara Kefen "ölümsüz" değildi: 1e7 can çarpanı boss sınıfı dalında uygulanmıyordu | çarpan uygulanır |
| Menüden dönüp başlayınca Tek Silah / Tek Tom sınırı kalkıyordu | sınır yeniden uygulanır |
| Cellat Hançeri, Tılsımlı Kandil ile aynı ölü hedeften iki kalıcı bonus alabiliyordu | ölü hedef elenir |
| Erlik Ruhu ve Erlik Kanı sayaçları ilk öldürmede NaN oluyor, bonus gecikiyordu | sayaç sıfırdan başlar |
| Ganimet sınırı (260) kafes anahtarını silebiliyordu | anahtar muaf |
| HUD olay takvimi önceki koşunun haritasında kalabiliyordu | önbellek anahtarına harita ve süre eklendi |

Geçersiz çıkan bulgu: "Mezarlık kademe 3 final arenası tabutları siliyor" (Mezarlık tek kademe). Duman testi 62 kontrol; yeni kontroller süreli boss sayacını, eşya sayaçlarını, Kara Kefen'in canını, boss bölgelerinin temizlenmesini ve Kullan düğmesini sınar. Düzeltmelerden sonra iki bot koşusu daha (Mezarlık, Kara Koru kademe 3) sorunsuz bitti.

**Cellat Palası bossları eritiyordu, düzeltildi.** Pala bosslara her mermide kesin olarak azami canın %2'sini veriyordu; canı ne olursa olsun her boss 50 mermide ölüyordu (Haydut ile kademe 3 finali 6,8 sn, Bozkır 2. aşama boss'u 8 sn). Megabonk'ta infaz vuruş başına %2 şanstır ve boss'ta tutarsa azami canın %2'sini götürür (Steam rehberi, Rogue Ranker; megabonk.org bossların hiç etkilenmediğini söylüyor). Bizde de artık mermi başına %2 şans (`weapons2.js` `EXEC_BOSS`). Aynı koşu yeniden ölçüldü: Haydut ile kademe 3 bossları 78 / 73 / 171 sn ve 80 / 78 / 113 sn. Sıradan düşmanlardaki eşik infazı (canı %12'nin altına inen ölür) değiştirilmedi. Kara Kefen artık gerçekten çok dayanıklı olduğu için Orakçı'nın açılması Megabonk'taki gibi uzun bir infaz avı gerektirir (50 tutan infaz). Duman testi 63 kontrol.

### Aşama saati her aşamada sıfırdan başlar (5 Kasım 2026)

`nextStage` artık aşama geçişinde `P.stT`'yi sıfırlıyor (`flow.js`). Eskiden saat koşu boyunca birikiyor ve boss ölünce 590'a atlıyordu; 2. ve 3. aşama ilk saniyeden Uzatma'da geçiyor, ara bosslar ve akınlar hiç gelmiyordu. Şimdi her aşamanın kendi süresi (10 / 9 / 8 dk), ara boss ve akın anları işliyor. Zorluk, doğuş hızı ve tür listesi formülleri aşamayı zaten ayrıca hesaba kattığı için (`SF(stage)`, `stage × 240` ...) başka değişiklik gerekmedi. Duman testi: geçişten sonra saat sıfır, Uzatma yok, 2. aşamada ara boss 120. saniyede geliyor (61 kontrol).

Bu, 2. ve 3. aşamanın oynanışını baştan değiştirir: hayalet sürüsü yerine o aşamanın normal düşmanları. Bot 2. aşamada iki dakikada artık 23 → 30. seviyeye çıkıyor (önce 23 → 40). Boss çarpanları yeni koşullarda yeniden ölçüldü ve `BOSS_ST` [1, 7, 12] → **[1, 5, 6]** yapıldı (süre çarpanı `bossTime` ile birlikte; Kara Koru'da 2. aşama boss'u 3. dakikada ~88 bin, final ~62 bin can ve direk evreleri).

Bot ölçümü (boss ilk aşamada 5. dakikada, sonraki aşamalarda 3. dakikada çağrılır; düşme süresi sn):

| Aşama | `BOSS_ST` [1, 7, 12] | `BOSS_ST` [1, 5, 6] |
| --- | --- | --- |
| 2. aşama boss'u (Koru, Bozkır) | 38 – 288, ortanca ~110 | 23 – 178, ortanca ~80 |
| Final (direkli) | 127 – 514, ortanca ~230 | 78 – 152, ortanca ~135 |

On koşunun onunda da bütün bosslar düştü. Sayılar bot içindir; elle oyun testi yapılmadı. Final boss'unun taban canı 2. aşamanınkinden düşük kalıyor, çünkü final dövüşü silah kilidi ve üç direk evresiyle zaten uzuyor.

### Oyun dengesi: boss canı çağrıldığı ana göre büyür; aşama saati bulgusu (5 Kasım 2026)

**Uygulandı.** Aşama bossu canı artık çağrıldığı ana göre de büyüyor: aşamanın başından beri geçen her 150 sn için +1 kat, en çok 6 kat (`run.js` `bossTime`; `enemies.js` profil canı × `BOSS_ST` × `bossTime`). Faz 1'deki "boss canı geçen süreyle ölçeklenir" maddesi profilli bosslarda uygulanmıyordu. Erken çağıran zayıf oyuncu zayıf, geç çağıran güçlü oyuncu güçlü boss bulur. Dev Hortlak'ın taban canı 500.000 → 130.000 (çarpanla 5. dakikada ~510 bin, 8. dakikada ~590 bin).

İlk aşama boss'u, bot ölçümü (iki tohum; düşme süresi sn):

| Harita | 2. dk'da çağrı | 5. dk'da çağrı | 8. dk'da çağrı | Önce (5. dk, sabit can) |
| --- | --- | --- | --- | --- |
| Kara Koru | 16 bin can: 116 / 208 | 27 bin: 25 / 135 | 38 bin: 21 / 62 | 16 / 56 / 83 |
| Kızıl Bozkır | 14 bin: 78 / 354 | 24 bin: 38 / 65 | 34 bin: 14 / 61 | 10 / 12 / 15 |

Oyuncu gücü süreyle doğrusaldan hızlı büyüdüğü için geç çağrılan boss hâlâ daha çabuk düşüyor; eğri bilerek yumuşak tutuldu (2. dakikada çağıran zaten 2–6 dakika uğraşıyor). Duman testi çarpanı ve 300 sn'deki canı doğrular (60 kontrol).

**Bulgu (aynı gün düzeltildi, aşağıya bak): 2. ve 3. aşama baştan sona Uzatma'da geçiyordu.** Aşama saati `P.stT` koşu boyunca birikiyor, aşama geçişinde sıfırlanmıyor; boss ölünce de `stLen() − 10`'a (590) atlıyor. 2. aşamanın uzunluğu 540 sn olduğu için aşama ilk saniyeden "süre doldu" sayılıyor: hayalet sürüleri hemen başlıyor (ölçüm: 2. aşamanın 120. saniyesinde `P.ot` = 120), 7:00 ve 2:00'deki ara bosslar ile akınlar hiç gelmiyor (`MBT`/`SWT` anları çoktan geçmiş), 9 ve 8 dakikalık aşama süreleri işlemiyor. Bot 2. aşamada iki dakikada 23. seviyeden 40. seviyeye çıkıyor; bu yüzden 2. ve 3. aşama boss ölçümlerinin hepsi Uzatma koşullarında alındı ve `BOSS_ST` [1, 7, 12] o koşullara göre ayarlı. Belgedeki tasarım (her aşamanın kendi süresi ve ara boss anları) ile kod çelişiyor. Düzeltme aşama saatini aşama başına göreli yapmak (`stT − stS`) olur; 2. ve 3. aşamanın zorluğunu ve boss dengesini baştan değiştirir, ardından yeniden ölçüm gerekir.

### Oyun dengesi: üç haritada bot ölçümü ve çifte öldürme hatası (5 Kasım 2026)

Bot iki yönden geliştirildi: en yakın düşmana yürüyor (Kızıl Bozkır'ın yavaş düşmanları daire çizen bota yetişemiyor, bot 5 dakikada 9 düşman öldürüp 2. seviyede kalıyordu) ve `MAP=bozkir` / `MAP=mezarlik` ile diğer haritalarda koşuyor. Mezarlık'ta boss anında dört tabutu sırayla açıp bekçileri deviriyor, anahtarları toplayıp Dev Hortlak'ı çağırıyor. Bu bot öncekinden belirgin güçlü: 5. dakikada 18–28. seviye (önceki 7–19).

**Bulunan hata: çifte öldürme (`enemies.js`).** Mezarlık'ta dört tabuttan beş anahtar düştü. Neden: vuruş kancası içinde hedefe ayrıca hasar veren eşyalar (Buz Küpü, infaz eşyası) hedefi öldürünce dıştaki vuruş devam edip `killE`'yi ikinci kez çağırıyordu. Öldürme sayısı, tecrübe, altın, ganimet ve Mahzen anahtarı çiftleniyordu. `killE` artık ölü hedefte geri dönüyor, `hurtE` kanca hedefi öldürdüyse yalnız silahın hasar hanesini yazıp çıkıyor. Duman testi Buz Küpü ile tek öldürme sayıldığını doğrular (60 kontrol).

Güçlü botla boss düşme süreleri (sn; `TIERM` [1, 1.6, 2.15], `BOSS_ST` [1, 7, 12]; Koru ve Bozkır üçer tohum, boss 5. dakikada; Mezarlık üç tohum, boss 8. dakikada):

| Harita | Kademe-aşama | Boss canı | Düşme süresi | Boss anında seviye |
| --- | --- | --- | --- | --- |
| Kara Koru | 1-1 | 9.000 | 16 / 56 / 83 | 18–25 |
| Kara Koru | 2-1, 3-1 | 9.000 | 20 / 20 / 23 / 27 / 29 / 42 | 22–25 |
| Kara Koru | 2-2 | 56.000 | 10 / 12 / 22 | 39–58 |
| Kara Koru | 3-2 | 56.000 | 22 / 54 / 68 | 35–47 |
| Kara Koru | 3-3 (final) | 120.000 | 45 / 151 / 157 | 40–52 |
| Kızıl Bozkır | 1-1 | 8.000 | 10 / 12 / 15 | 24–28 |
| Kızıl Bozkır | 2-1, 3-1 | 8.000 | 14 / 23 / 23 / 29 / 50 / >600 | 11–28 |
| Kızıl Bozkır | 2-2 | 56.000 | 22 / 23 / 75 | 34–59 |
| Kızıl Bozkır | 3-2 | 56.000 | 11 / 53 | 41–48 |
| Kızıl Bozkır | 3-3 (final) | 96.000 | 41 / 279 | 48–52 |
| Mezarlık | tek | 500.000 | 73 / 152 / 253 | 53–74 |

Okunanlar:
- Hiçbir haritada kilitlenme kalmadı; üç haritanın finali de düşüyor. Bozkır 3-1'deki `>600` koşusu kilit değil: bot 11. seviyede kalmış, boss'a saniyede 12 hasar verebiliyor (kademe 3'te geri düşen toparlayamıyor; gerçek oyuncu bu noktada ölmüş olurdu).
- İlk aşama bossu güçlü botla çok hızlı düşüyor (Bozkır 10–15 sn, Koru 16–83 sn). İlk boss canı (8.000–9.000) ölçümle değil veriyle gelmişti; yükseltilmedi.
- Kademe 2'nin son bossu (2-2) hâlâ kısa (10–22 sn). Çarpanı daha da büyütmek mümkün ama bot gerçek oyuncunun yerini tutmuyor; elle oyun testinden sonra karar verilmeli.
- **Mezarlık tabut bekçileri anında ölüyordu** (0.5–10 sn; canları 1.100–9.000 sabit, boss anında oyuncu saniyede 4.000–9.000 hasar veriyor). Megabonk'ta bekçilerin giderek güçlendiği yazıyor ama sayı yok. **Düzeltildi:** bekçi canı tabutun açıldığı ana göre büyür, çarpan `(aşama süresi / 4 dk)³`, 1 ile 60 arası (`graveyard.js` `guardMul`): 4. dakikaya kadar ×1, 5. dakikada ×2, 8. dakikada ×8, 12. dakikada ×27. Bot ölçümü (dört bekçi, sn): 8. dakikada `1.5 / 1.8 / 5.7 / 8.5`, `1 / 3.8 / 5.9 / 8.1`, `9.3 / 10 / 11.7 / 12.7`, `4.4 / 4.2 / 6.9 / 7.9`; 5. dakikada `8.8 / 7.4 / 7.3 / 10`, `9.9 / 15.7 / 21.7 / 33.2`. İki koşuda 5. dakikada bekçiler 29–265 sn sürdü: bot bekçiye yaklaşsa da silahları en yakın düşmanı hedeflediği için kalabalıkta bekçiye hasar veremedi (ilk bekçi canı yalnız 2 katıyken 59–112 sn sürdü, yani asıl neden çarpan değil); gerçek oyuncuda nasıl olduğu elle denenmeli.
- Mezarlık'ta bot 8. dakikada 53–74. seviyede; bu bir anormallik değil. Aynı tohumla 5. dakikada Mezarlık 21. seviye (1.588 öldürme), Kara Koru 22. seviye (968 öldürme): hız aynı, fark boss'un üç dakika geç çağrılmasından (ve ilk koşuda çifte öldürme hatasından) geliyor.

### Oyun dengesi: otomatik koşu ölçümü (5 Kasım 2026)

`tests/denge.mjs` oyunu kendi kendine oynatır: bot daire çizerek yürür, seviye kartında önce boş silah slotunu doldurur sonra silah yükseltmesi ile tomu dönüşümlü seçer, altını yettiğinde sandık açar; ilk aşamada 5. dakikada, sonraki aşamalarda 2 dakika sonra boss'u çağırır ve boss gelince yerinde durur. Ölmez (her karede canı dolar, alınan hasar ayrıca toplanır); sunak, tüccar, kazan ve direk kullanmaz. Oyun mantığı el ile adımlandığı için üç kademe ~2 dakikada biter. `TIERM=1,1.6,2.15 node tests/denge.mjs ...` kademe çarpanını o koşu için değiştirir.

Kara Koru, yeni kayıt, Alp; her ayar için üç tohum (değerler koşu başına, `/` ile ayrılmış):

| Kademe-aşama | Çarpan | 5. dk seviye | 5. dk öldürme | Boss canı | Boss düşme süresi (sn) | Alınan hasar/sn |
| --- | --- | --- | --- | --- | --- | --- |
| 1-1 | mevcut | 17 / 15 / 11 | 786 / 960 / 256 | 9.000 | 224 / 91 / 246 | 7 / 5 / 5 |
| 2-1 | mevcut `2.2` | 12 / 10 / 7 | 293 / 303 / 93 | 9.000 | 48 / 100 / 51 | 9 / 11 / 9 |
| 2-1 | aday `1.6` | 10 / 12 / 15 | 207 / 392 / 606 | 9.000 | 86 / 49 / 55 | 6 / 9 / 7 |
| 3-1 | mevcut `5` | 8 / 8 / 4 | 101 / 119 / 40 | 9.000 | 50 / 140 / 111 | 18 / 12 / 21 |
| 3-1 | aday `2.15` | 20 / 9 / 18 | 901 / 188 / 1048 | 9.000 | 74 / 90 / 23 | 20 / 11 / 11 |
| 2-2 | mevcut | 28 / 26 / 27 | — | 8.000 | 36 / 17 / 34 | 17 / 28 / 28 |
| 3-2 | aday | 32 / 28 / 46 | — | 8.000 | 20 / 24 / 22 | 40 / 47 / 14 |

Okunanlar:
- **Boss canı aşamayla büyümüyor.** Aşama bossları profil canıyla gelir (Tepegöz 9.000, Ulu Tepegöz 8.000, Kadim Tepegöz 10.000); kademe çarpanı ve geçen süre bunlara uygulanmaz. Oyuncu iki aşama arasında 10. seviyelerden 27. seviyelere çıkarken boss canı düşüyor: ilk boss 50–250 sn'de, ikinci boss 17–36 sn'de düşüyor. Megabonk'ta boss canı aşamadan aşamaya katlanıyor.
- **Kademe 3 seviye atlamayı boğuyor.** Sıradan düşmanın canı ilk saniyeden 5 katı olduğu için bot 5 dakikada 40–119 düşman öldürüp 4–8. seviyede kalıyor; kademe 1'de 256–960 öldürme ve 11–17. seviye. Aday çarpanla (`2.15`) kademe 3'te 188–1048 öldürme ve 9–20. seviye; alınan hasar aynı düzeyde.
- **Aday çarpanın dayanağı.** `TIERM` [1, 1.6, 2.15] yapılırsa hasar oranı (karekök) 1.27 / 1.47 olur, yani decompile verisindeki 0.75 / 0.95 / 1.1 oranlarının aynısı; can çarpanı için kaynak yok, 1.6 / 2.15 bunun yan ürünü.
- **Sınırlar.** Koşudan koşuya oynama büyük (aynı ayarda boss süresi 91 ile 246 sn); üç tohum eğilim gösterir, kesin sayı vermez. Bot gerçek oyuncudan zayıf build kurar. Final arenasının boss'u ölçülemedi: bot direkleri doldurmuyor, boss sürekli korunuyor. Bir koşuda bot Uzatma'da öldü (her karede can dolmasına rağmen), nedeni araştırılmadı.

**Uygulandı (aynı gün).**
- `TIERM` [1, 2.2, 5] → **[1, 1.6, 2.15]** (`run.js`).
- Aşama bossu canı aşamayla büyür: profil canı × `BOSS_ST` **[1, 7, 12]** (`run.js`, `enemies.js`). Kara Koru'da 9.000 / 56.000 / 120.000. İlk deneme ×4 / ×8 idi; ikinci boss 24–64 sn'de düştüğü için yükseltildi.
- **Direk hatası düzeltildi (`bosses.js`).** Final arenasında itme gücü olan silahlar (Kılıç Savuruşu, Kemik, Kor İzi) direkleri mühür duvarının dışına itiyordu; oyuncu arenadan çıkamadığı için direk doldurulamıyor, boss sonsuza dek korunuyor ve iyileşiyordu. Ölçümde final dövüşlerinin yarısı böyle kilitlendi (direkler merkezden 49–52 m'de, duvar 40 m). Direkler artık doğdukları noktaya sabit; doğarken kaya ve ağaçların dışına çıkarılıyor (Codex incelemesinin bulduğu açık: engel içine sabitlenen direğe yaklaşılamıyordu) ve duvara 4 m'den yakın doğmuyorlar.
- Bot: boss'a yürüyüp dibinde durur, final arenasında direkleri doldurur (direğe ışınlanır).
- Testler artık fare kilidi istemiyor (başsız Chrome'da bile kullanıcının gerçek imlecini yakalayabiliyordu) ve duman testi geliştirme sunucusuna karşı da koşuyor.

Son ölçüm (yeni değerler, dört tohum; boss düşme süresi sn):

| Kademe-aşama | Boss canı | Düşme süresi | 5. dk seviye |
| --- | --- | --- | --- |
| 2-1 | 9.000 | 48 / 91 / 146 / 274 | 14–19 |
| 2-2 | 56.000 | 34 / 42 / 45 / 142 | 28–30 |
| 3-1 | 9.000 | 47 / 83 / 132 / 272 | 7–13 |
| 3-2 | 56.000 | 73 / 73 / 117 / 284 | 20–26 |
| 3-3 (final, direkli) | 120.000 | 40 / 69 / 87 / 143 | 32–47 |

Final boss'u dört koşunun dördünde de düştü. Sayılar bot içindir; gerçek oyuncu sunak, tüccar ve kalıcı yükseltmelerle daha güçlüdür, bu yüzden süreler oyunda daha kısa çıkar. Kızıl Bozkır ve Mezarlık bossları aynı çarpanı alır ama ölçülmedi. Duman testi 59 kontrol.

### Oyun dengesi: can çalma ve kademe çarpanı ölçümü (5 Kasım 2026)

**Can çalma Megabonk mekaniğine çekildi.** Bizde can çalma verilen hasarın yüzdesi kadar iyileştiriyordu; Megabonk'ta Lifesteal vuruş başına 1 can iyileşme şansı, %100 üstü ikinci can için şans (megabonk.wiki Bloody Tome, megabonk.org Stats, Dexerto; decompile notunda tamsayı `lifestealHeal` alanı). `hurtE` artık vuruş başına `⌊ls⌋` can verir, artan pay kadar şansla bir can daha. Ölçüm (koşunun ilk saniyeleri, Kılıç Savuruşu + Ruh Okları, 12 düşman, 10 sn, azami can 170):

| Can çalma | Eski iyileşme | Yeni iyileşme |
| --- | --- | --- |
| %10 (Kan Tomu 1. seviye) | 84 can | 8 can |
| %50 | 400 can | 31 can |

Eski hâlde iyileşme hasarla birlikte sınırsız büyüyordu; yenisi yalnız vuruş sayısıyla ölçeklenir. Etkilenenler: Kan Tomu, Börü (taban %5, rütbe başına +%1), Demir Göğüslük (+%20), Kan Taşı (+%3), Kan Yolu meydan okuması, Börk ve Erlik Bıçağı görev sayaçları (artık tamsayı can). Zamanla hasar (yanma, zehir tikleri) eskisi gibi can çalmaz; megabonk.org DoT tiklerinin de tetiklediğini söylüyor, wiki bunu doğrulamıyor, değiştirilmedi. Duman testi: %0 → 0, %100 → vuruş başına 1, %200 → 2 (58 kontrol).

**Kademe çarpanı ölçüldü (bu turda değiştirilmedi).** `TIERM` (bu ölçüm sırasında [1, 2.2, 5]; sonradan [1, 1.6, 2.15] yapıldı) sıradan düşmanın canını doğrudan, hasarını karekökle çarpıyor. Sıradan Gulyabani için oyundan okunan değerler (bu tablonun ilk hâlindeki "boss canı" sütunu profili olmayan genel formülü ölçüyordu ve yanıltıcıydı, kaldırıldı; gerçek aşama bossları için aşağıdaki otomatik koşu ölçümüne bak):

| Kademe | Aşama | Süre | Düşman canı | Düşman hasarı |
| --- | --- | --- | --- | --- |
| 1 | 1 | 0 / 4 / 8 dk | 7 / 18 / 29 | 15 |
| 2 | 1 | 0 / 4 / 8 dk | 15 / 40 / 65 | 22 |
| 2 | 2 | 0 / 4 / 8 dk | 65 / 104 / 144 | 36 |
| 3 | 1 | 0 / 4 / 8 dk | 35 / 91 / 147 | 34 |
| 3 | 2 | 0 / 4 / 8 dk | 147 / 237 / 326 | 54 |
| 3 | 3 | 0 / 4 / 8 dk | 257 / 380 / 504 | 79 |

Megabonk tarafında bulunabilen tek sayı düşman hasarının harita kademesi çarpanı: 0.75 / 0.95 / 1.1 (decompile, `RunConfig::GetEnemyDamage`), yani kademe 3 kademe 1'in 1.47 katı vuruyor. Bizde aynı aşamada oran 2.24. Can için kademe çarpanı hiçbir kaynakta yok. megabonk.org boss canlarını kabaca veriyor (Lil Bark ~100 bin, Chadbark ~500 bin, Bark Vader 18 milyon), yani Megabonk'ta boss canı aşamadan aşamaya katlanıyor.

### Wiki teyidi: `(?)` işaretli değerler (5 Kasım 2026)

Faz bölümlerinde kalan 14 `(?)` değeri iki koldan teyit edildi: Codex web aramasıyla (megabonk.wiki'nin dizinlenmiş metni, Steam yama notları ve başarım listesi), ben megabonk.org, megabonkinfo.org, decompile notları (`lukeod/megabonk_research`) ve Steam rehberleriyle. megabonk.wiki bu makineden hâlâ açılmıyor (TLS). Çoğu değer Faz 10'da koda zaten işlenmişti; işaretler eski kalmıştı ve yerinde düzeltildi.

| Değer | Sonuç | Kaynak | Kod |
| --- | --- | --- | --- |
| Ocak sunağı zorluğu | zorunlu değil; seçilebilen stat, +%8 / 9.6 / 11.2 / 12.8 / 16 | wiki Charge Shrine, megabonk.org | uyumlu |
| Sandık eşya ağırlıkları | 70 / 15 / 6 / 1.5 (Sıradan / Nadir / Destansı / Efsanevi), dört kademe | megabonkinfo.org, megabonk.org (topluluk kod analizi) | **düzeltildi** |
| Havai Fişek kilidi | CL4NK (Tunç) ile 15.000 öldürme | wiki, Steam başarımı | uyumlu |
| Seviye sınırı | tom 99, silah 40 (Sihirbaz Şapkası ve Tencere sınırı yükseltir) | wiki, Steam başarımı, v1.0.49 notu | uyumlu |
| Yenilenme Tomu | +40 can/dk (nadirliğe göre 48 / 56 / 64 / 80) | wiki Regen Tome | uyumlu |
| Altın Halka | Efsanevi, stat etkisi yok | wiki, megabonkinfo.org | uyumlu |
| Çalı pasifi | Bullseye: işaret + patlama, +%1 kritik hasarı/seviye | wiki, v1.0.17 notu | **eklendi** (aşağıda) |
| Mezarlık ara bossları | Calcium's Dad ve Ghostham the Dead, 13:00 / 9:00 / 3:00 kala dönüşümlü | wiki Graveyard, Steam rehberi | **eklendi**: Kemik'in Babası, Hayalet Beyi, Kemik'in Babası |
| Bloody Shrine, Totem | ayrı tür değil | Steam rehberleri | uyumlu |
| Gümüş kesesi | 20 kademe, +%2.5; fiyatlar 11…442, ilk fiyat kaynaklarda yok | Steam rehberi | uyumlu (ilk fiyat 8 tahmin) |
| Silah slotu | 25 / 45 görev; fiyat 125 (4.), 3. slot 25 ya da 50 | v1.0.4 notu; wiki ve rehber 25, megabonk.org 50 | 25 kaldı |
| Tom slotu | 35 / 55 görev; fiyat 35 / 135 | v1.0.4 notu; wiki (bir rehber 50 / 125 diyor) | uyumlu |
| Davul | 5 gümüş; aynı koşuda Forest'taki üç boombox | wiki, Steam başarımı, PC Gamer | uyumlu |
| 3. aşama ara bossu | ilki 6:30; ikincisi çelişkili | wiki Bosses 1:30, Steam rehberi 3:00 | 3:00 kaldı |

**Koddaki düzeltme.** Normal sandık eşya nadirliğini beş kademeli diziyle (`70 / 0 / 6 / 3 / 1.5`) hesaplıyordu: şans yokken Nadir %7.5, Destansı %3.7 çıkıyordu. Megabonk'ta eşya dört kademeli ve ağırlıklar `70 / 15 / 6 / 1.5`; şans yokken %75.7 / %16.2 / %6.5 / %1.6, %100 şansta Efsanevi %4.7. `stats.js` `itemRarW` bunu uygular; duman testine "sandık eşya nadirliği" kontrolü eklendi. Yükseltme tekliflerinin beş kademeli ağırlıkları (`RW_BASE`) için kaynak yok, tahmin olarak kaldı.

**Çalı'nın Tam isabet pasifi (Bullseye) eklendi.** `heroes.js` `HH.cali`: rastgele bir düşman kızıl nişangâhla işaretlenir (24 m içinde, aynı anda en çok 3, ömür 10 sn); işaretliye gelen ilk silah vuruşu çevresinde patlar (yarıçap `3.5 × Boyut`), işaret tek kullanımlık, patlama zincirlemez. Bekleme 5 sn, her 10 rütbede 0.4 sn kısalır, en az 1 sn (megabonk.org). Kaynaklarda olmayan ve tahmin edilen değerler: patlama hasarı (tetikleyen vuruş kadar), işaret sayısı, ömrü ve seçim menzili. Nişangâh normal karışımlı sprite, ışımaya girmez; koşu sıfırlanınca ve kahraman değişince temizlenir. Duman testi işareti, patlamayı, menzil dışını ve tek kullanımı doğrular.

**Açık kalanlar.**
- *Mezarlık ara boss sırası.* Dönüşüm eklendi (`MINIS.mezarlik`); hangisinin önce geldiği kaynaklarda yok, wiki'nin sıralamasına göre Kemik'in Babası ilk. Hayalet Beyi'nin saldırıları da belgelenmemiş, sıradan hayalet davranışıyla geliyor.
- *İki çelişkili sayı.* 3. silah slotu fiyatı ve 3. aşamanın ikinci ara boss anı. Yama notu bulunamadı; kod değiştirilmedi.

### Silah efekti denetimi: 32 silah gerçek GPU'da (5 Kasım 2026)

Tablo lokalde Apple M5 (ANGLE Metal) üzerinde çekildi: 32 silah, hatasız, ~2 dk. `tests/wfx.mjs` artık macOS'ta sistem Chrome'unu gerçek GPU ile açar (`WFX_SW=1` yazılım çiziciye döner, `CHROME` ikiliyi seçer), çiziciyi günlüğe yazar, `WFX_F0=3` ile ilk kareyi değiştirir (0.18 sn'lik titreşen şimşekler 4. karede gizli kalıyor) ve Kapan (`mines`) için de yürür.

**Asıl bulgu: beyaz toplar parçacıklardan değil, düşman gövdesinin vuruş parlamasından geliyordu.** `engine/iskin.js` vuruşta gövdeyi tam beyaza çevirip üstüne `1.4` ışıma ekliyordu; HDR'da ~2.4 eden bu değer ışıma eşiğinin (`BLOOM_TH` 1.05) iki katı, yani her vuruş düşmanı 0.1 sn boyunca beyaz bir ışıma topuna çeviriyordu. 32 silahın 20'sinde görülen "beyaza patlama" buydu; Ateş Topu'nda ekranın yarısını kaplayan beyazlık da 12 düşmanın aynı anda parlamasıydı, patlama sprite'ı değil.

Uygulananlar:
- **Vuruş parlaması (`iskin.js`):** gövde rengi `mix(renk, (1, .95, .86), .75)`, ışıma `1.4 → .28`. Düşman vurulunca açık renk bir silüet olarak okunuyor, ışıma topu yok.
- **Vuruş kıvılcımı (`VFX.hit`):** flaş `1.5–1.8 → .8–1` (kritik `2.4–2.6 → 1.3–1.5`), parlaklık `.5` (kritik `.75`), kıvılcım `5/9 → 4/8`.
- **Patlama (`VFX.boom`; Ateş Topu, Havai Fişek, Kapan):** flaş `R × 2.2 → R × 1.1`, renk `0xffd8a0`, parlaklık `.7`; ateş parçacığı `22 → 12`, kıvılcım `16 → 8`, duman `10 → 6` ve daha küçük.
- **Yıldırım (`VFX.zap`):** flaş `2.6 → 1.4`, kıvılcım `8 → 6`.
- **Kılıç hilali (`weapon-fx.js`; Kılıç Savuruşu, Yatağan, Alp Kılıcı, Erlik Kılıcı, Tırpan):** opaklık `1 → .55`, aynı anda çok savuruş varsa `.55 / √(n/2)` ile paylaşılır; köşe rengi biraz sıcak; kıvılcım `9 → 4`, `br 1.3 → 1`.

Sorun görülmeyenler: Ruh Okları, Dönen Kılıçlar, Şok Dalgası, Zehir İzi, Balta, Kor Halkası, Girdap, Kemik Bumerang, Kalkan, Zehir Şişesi, Kor İzi. Ölüm efekti ayrı bir çekimle (12 ölümlü düşman) bakıldı, taşma yok.

İkinci parça (`weapons2.js`, Codex ile):
- **Hortum:** koni opaklığı `.35 → .14 / √(etkin hortum)` (beş hortumda ~.063), doğarken 0.12 sn ve biterken 0.22 sn solar. Güçlenmişte beş koni artık düşmanları kapatmıyor.
- **Ejder Nefesi:** 14 additive parçacık 0.2 sn'de sönüyordu, alev görünmüyordu. Yerine koni boyunca altı sıra hâlinde 36 normal karışımlı turuncu parçacık (`0xff7624 → 0xe34412`, ömür .42–.5 sn); üst üste binince beyaza çıkmaz.
- **Kapan:** tetik yarıçapını (`2.2 × sz`) gösteren `.28` opaklıkta ince halka, ışık gövdenin üstüne alındı; halka kökün çocuğu, tek ortak malzeme.
- **Işık Hüzmesi:** genişlik `.16 → .22`.

Son tablo (32 silah, taban + güçlenmiş) hatasız çekildi; güçlenmiş 0.20 sn karelerinde beyaza patlayan silah kalmadı. Duman testi 56/56.

Codex ilk tabloları (düzeltme öncesi) bağımsız denetledi ve aynı sonuca vardı: Zehir İzi'nde additive parçacık sayısı sıfırken gövdeler beyazlıyordu, yani kaynak gövde parlamasıydı. Temiz buldukları: Kor Halkası, Ayaz, Girdap, Zehir Şişesi. Onun önerdiği ince ayarlar da uygulandı, etkilenen on silah yeniden çekildi, duman testi 56/56:
- Hilal kalınlığı `.46 → .22` (`weapon-fx.js` `gSlash`), dış yarıçap aynı; savuruşlar şerit değil yay olarak okunuyor.
- Art arda patlamalar: önceki patlamadan sonraki 0.3 sn içinde (koşu saati `P.tt`) gelen her patlama yarı parçacıkla çizilir (`VFX.boom`).
- Havai Fişek iz dumanı olasılığı `.8 → .35`; Hortum tozu `.5 × 2 → .2 × 1`; Kalkan tozu `10 → 4`.
- Şimşek (Yıldırım, Işık Hüzmesi): üç karede bir gizleyen titreşim kaldırıldı, ömür `.18 → .26 sn`; şimşek 0.07 ve 0.20 sn karelerinde kesintisiz görünüyor.

Ayaz'a sonradan menzilini gösteren soluk, kalıcı bir halka eklendi (`weapons.js` `ICm`; halka `.26`, zemin `.05` opaklık; aşama geçişinde kaldırılır). Ejder Nefesi sonradan aleve çevrildi (`weapons2.js`): 26 parçacık ağızdan çıkıp koni boyunca ilerler, büyüyüp turuncudan koyu kızıla döner (hız aralığı geniş olduğu için koni boşluksuz dolar), ağızda 10 kısa ömürlü sarı çekirdek, uçta 5 is parçacığı. Açık kalanlar: `wfx.mjs` Zehir İzi, Kor İzi ve Kapan'da oyuncuyu yürüttüğü için sonraki silahlar farklı bir noktada çekiliyor; karşılaştırmayı bozmuyor ama sabit sahne için her silahtan önce oyuncu başa alınabilir.

### Silah efekti denetimi: araç ve ilk bulgular (4 Kasım 2026)

Zaman tabanlı efektleri yazılım çizicide de değerlendirebilmek için kare adımlı bir çekim aracı yazıldı: `tests/wfx.mjs`. Oyun mantığı el ile adımlanır (`S='play'` → `upd(1/60)` × n → `S='pause'`), rAF döngüsü yalnız çizer; böylece her silah için 0.07 / 0.20 / 0.40 / 0.80 sn anları sabit kamera ve sabit düşman kümesiyle (12 ölümsüz düşman, hız %8, seviye atlama ve toast kapalı) yakalanır. Taban seviye 4 kare, güçlenmiş seviye (her `u` statı ×4) 2 kare; hepsi `sheet_<silah>.png` tablosunda, mermi ve parçacık sayıları `rapor.json`'da.

```
npm run build && npx vite preview --port 4173
node tests/wfx.mjs http://localhost:4173/ /tmp/wfx            # 32 silah, ~30 dk
node tests/wfx.mjs http://localhost:4173/ /tmp/wfx fire,slash  # seçili silahlar
```

Tam tur bulutta tamamlanmadı; ilk üç silahtan çıkan bulgular (5 Kasım turunda yeniden değerlendirildi ve düzeltildi, yukarıya bak; beyazlığın asıl kaynağı sprite değil gövde parlamasıydı):
- **Ateş Topu patlaması:** `VFX.boom` flaş sprite'ı `R × 2.2` (taban 11 m, güçlenmişte 18 m) ve 22 turuncu + 16 kıvılcım + 10 duman; bloom ile ekranın yarısı beyaza dönüyor. Aday: flaş `R × 1.1`, renk `0xffd8a0`, parçacıklar yarıya.
- **Kılıç Savuruşu (güçlenmiş):** hilal köşe rengi additive beyaz, opaklık 1; 5 savuruş × 9 kıvılcım (`br 1.3`) tek beyaz top oluyor. Aday: hilal opaklığı .55, kıvılcım 4/savuruş, `br 1`.
- **Ruh Okları:** taban hâliyle sakin; güçlenmişte 5 ok + her kare iz parçacığı yine kabul edilebilir.

### Darbe ve düşük can geri bildirimi (4 Kasım 2026)

`P.hit` (0.45 sn) yalnız sayılıyor, ekranda karşılığı yoktu. Renk düzenleme geçişine iki uniform eklendi (`GRADE uHurt/uLow`, `gfxRender` her kare doldurur):

- **Darbe:** kenarlardan içeri kızıl vinyet (`smoothstep(.08,.5,r²)` maskesi, koyu kızıl `.55,.05,.03`), 0.45 sn'de söner. Mevcut sarsıntı, vuruş durması ve parçacıklarla birlikte çalışır.
- **Düşük can (< %30):** 7 Hz nabızla soluk kızıl kenar ve %35'e varan doygunluk düşüşü; can azaldıkça güçlenir. Yalnız `S == 'play'` iken, ölünce kapanır.
- Ekranın ortası temiz kalır; HUD'a öğe eklenmedi.

### Performans yeniden ölçümü, görsel turlar sonrası (4 Kasım 2026)

Aksesuar, ışık havuzu, Mezarlık ışığı ve malzeme turlarından sonra aynı yöntemle (başsız Chrome, SwiftShader; kamera 0,0'da 400 düşman) üç harita üç kalitede ölçüldü. Çizim süreleri yazılım çizicide anlamsız; güvenilir sütunlar çağrı, üçgen, kurulum ve güncelleme süresi.

| kalite | harita | kurulum ms | boş çağrı / üçgen | 400 düşman çağrı / üçgen | düşman başına üçgen | geo/doku/prog |
|---|---|---|---|---|---|---|
| düşük | koru | 128 | 215 / 587k | 215 / 1350k | 1906 | 176/46/52 |
| düşük | bozkir | 702 | 209 / 523k | 214 / 1285k | 1906 | 156/48/53 |
| düşük | mezarlik | 640 | 231 / 605k | 231 / 1367k | 1906 | 165/46/56 |
| orta | koru | 199 | 310 / 920k | 310 / 2488k | 3920 | 186/49/63 |
| orta | bozkir | 653 | 276 / 780k | 284 / 2494k | 4286 | 159/51/64 |
| orta | mezarlik | 482 | 352 / 924k | 352 / 2492k | 3920 | 186/49/68 |
| yüksek | koru | 244 | 398 / 1045k | 398 / 2613k | 3920 | 199/49/63 |
| yüksek | bozkir | 573 | 329 / 809k | 337 / 2523k | 4286 | 162/51/64 |
| yüksek | mezarlik | 698 | 358 / 910k | 358 / 2478k | 3920 | 189/55/70 |

Önceki tabloya göre (orta): Koru 478 → 310 çağrı, Bozkır 367 → 276, Mezarlık 565 → 352; boş sahne üçgenleri Mezarlık'ta 1315k → 924k. Aksesuarlar ve ışık havuzları çağrı eklemedi (geometriye gömülü / tek mesh). Düşman başına üçgen orta ve yüksekte 3.9-4.3k: model kalitesi bilinçli olarak .45/.55'e döndürüldü (düşükte .36/.46 ve gölge geçişi yok → 1.9k). 400 düşmanda toplam 2.5M üçgen gerçek GPU'da sorun değil.

### Kahraman denetimi: 21 karakter yakın çekim (4 Kasım 2026)

Dörderli gruplar hâlinde tüm kahramanlar 3 m'den çekildi. Modeller temiz; sorun parlak parçalardaydı.

- **Göğüs aynası (Bahadır tabanı; Pehlivan, Yaban, Boru):** `0xdfe4ea × 1.1` beyaz top gibi patlıyordu → `0xb8c2cc × (1 − r·2.2)`, cilalı çelik disk.
- **Metal parlaklığı (`rimify`):** pürüzlülük .34 → .46, metallik .9 → .8, çevre haritası yoğunluğu .9 → .6. Zırh ve tokalar artık keskin beyaz nokta değil yumuşak parlama veriyor.
- **Kostüm paletleri (`HVAR`):** tüm kanalları ≥ 0xE0 olan 11 hedef renk %14 koyulaştırıldı (Umay, Tulpar, Ayaz, Kemik beyazları). Umay/Tulpar kanat düzlemleri `0xd8d4c8/0xd8d8e0`, saydamlık en çok .72.
- **Kam tabanı göz parıltısı:** .6 → .28 m (Ayaz'ın yüzünde beyaz güneş gibi görünüyordu).

### Hayalet ayrımı, boss denetimi ve parlaklık beneği düzeltmesi (4 Kasım 2026)

- **Benek hatası (`GRADE`):** parlak yüzeylerde (Dev Hortlak halkaları, zincir zırh, kemik) görülen sarı-siyah benekler shader gürültüsü değil, renk düzenleme geçişindeki filmik S eğrisinin 1'i aşan HDR değerlerde negatife düşmesiydi (`c²(3-2c)`, c>1.5 → siyah). Girdi artık [0,1] aralığına kırpılıyor. Deney: gölge kapalı ve çevre haritası kapalı iken benek sürdü; normal bozma kapalıyken sarı kenarlı siyah elips kaldı; sade malzemede yoktu.
- **Metal sınıfı:** `rimify` çelik sınıfı artık fildişi/kemik beyazını (lum > .78-.9) kapsamıyor; kemik ve beyaz halkalar yansıtıcı metal gibi parıldamıyor.
- **Gölge sivilcesi:** `normalBias` .03 → .08 (düşük/orta kalitede 1024 haritada .12), `bias` -.0004 → -.0003.
- **Hayaletler:** Mor Hayalet (mor kukuleta, açık gözler, etek dikenleri), Kızıl Hayalet (kızıl boynuz, sarı gözler, sırt dikenleri). Hayalet malzemesi geometriye gömülü parçalara da uygulandığı için silüet saydam kalır.
- **Boss denetimi:** Tepegöz (tek göz, boynuz), Erlik (mor ton, boynuz, asa), Dev Hortlak (taç, üç kemik halkası) yakın çekimde temiz.

### Düşman silüet ayrımı: aksesuar turu (4 Kasım 2026)

Yalnız renk tonuyla ayrılan 17 tür `geo/accessories.js` tablosuna kemik bazlı mat parçalar aldı (geometriye gömülür, ek çizim çağrısı yok; yaygın türlerde parıltı sprite'ı kullanılmadı).

- **Koru:** Güçlü Gulyabani (büyük boynuz, omuz dikenleri, dikenli tasma), Patlayan (turuncu şişkin karın, baştan fitil), Zırhlı İskelet (miğfer, siperlik, omuzluk, eğik göğüs plakası), Kurbağa (iri sarı gözler, sırt benekleri), Mavi İskelet (başta mavi kristal, omuz kristalleri), Gulyabani Tankı (miğfer, kol kalkanları, omuz boynuzları).
- **Bozkır:** Tozlu İskelet (baş sargısı, yırtık etek), Zırhlı Tozlu (toz rengi zırh takımı), Büyük Akrep (5 boğumlu kuyruk, yeşil parlayan iğne, kıskaç konileri, sırt dikenleri), Mumya Tankı (4 geniş sargı, koyu maske, kalın baş sargısı).
- **Mezarlık:** Zombi (açıkta kaburgalar, kol sargısı, yeşil gözler), Uçan Kafa (kızıl gözler, küçük boynuz, çene dişleri).
- **Ara bosslar:** Dev Karakoncolos (dev boynuz, sırt dikenleri, boyun halkası), Kaya Devi (sırt kaya dikenleri, iki mavi kristal), Kemik Okçu Başı (koni miğfer, altın halka, kemik omuzluk, kızıl pelerin).
- Plaka ve etekler gövdeye yaslanacak şekilde z ekseninde içeri alındı (öne eğik gulyabani duruşunda "tabela" gibi durmuyor).

### Karakter yüzey tanesi (4 Kasım 2026)

Boss ve 30 düşman türünün yakın çekim denetimi: kumaş/post sınıfına düşen koyu gövdelerde (Karakoncolos, Kaya Devi, Tepegöz, Erlik) üçdüzlemli normal bozma 40 birimlik frekansla "keçe/ kil tanesi" görünümü veriyordu.

- `rimify`: normal bozma frekansı metal dışı yüzeylerde 40 → 16 (deri kıvrımı gibi okunur, tane yok), genlik kumaş 2.5 → 1.2, deri .8 → .5, metal 4 → 3; parlaklık detayı kumaş .03/.02/.03 → .018/.012/.02, deri .015 → .012, metal .05/.05 → .03/.03. Kahraman zincir zırhı artık piksel gürültüsü değil halka dokusu olarak okunuyor.

### Mezarlık gece okunabilirliği ve ışık havuzları (4 Kasım 2026)

- **Mezarlık ışığı:** ay ışığı 1.0 → 1.35, gök ışığı .7 → .78 ve daha mavi (`0x8a94c4`), zemin tabanı açıklığı .17 → .21; mezar/türbe taşları iki ton açıldı (`0x62626e/0x4e4e5a/0x72727e`). Mezar taşları artık zeminden ayrışıyor.
- **Işık havuzları (`build.js lightPool/flushPools`):** ocak, meşale ve fenerlerin altına yerde sıcak radyal leke (HALO dokulu, toplamalı, köşe renkli). Harita kurulumu sırasında biriktirilir, sonunda tek mesh'e birleştirilir (+1 çizim çağrısı). Ocak 5.5 m, fener 3.6 m, meşale 3.2 m yarıçap. Kristal pınar (k=2) havuz almaz.

### Karakter ve düşman temizliği, minimal ölüm, zemin sakinleştirme (4 Kasım 2026)

Amaç: "yapay ve çocuksu çamur" görünümünden kurtulmak. Çamur hissini veren üç kaynak vardı: köşe rengine basılan yüksek genlikli fbm gürültüsü (benekli deri), blob yer değiştirmesi (topaklı gövde) ve deri/kumaş shader'ındaki üçdüzlemli detay + normal bozma.

- **Modeller (`geo/models.js`):** `shade(..., k * fbm)` biçimindeki 26 köşe-rengi gürültüsünün genliği yarıya indirildi (.15 ve üstü olanlar), `nzc` yardımcısı da yarım genlikle çalışır. Yaratık aralığındaki blob `amp: .12 → .05`, kıllı yaratıkların `shag` yer değiştirmesi .22 → .13, Taş Dev kaya topakları `amp .24 → .13, fr 2.4` (daha keskin, daha az topak).
- **Malzeme (`renderer.js rimify`):** deri detay parlaklığı .04 → .015, kumaş .05/.025/.06 → .03/.02/.03; normal bozma kumaş 4 → 2.5, deri 2.5 → .8, metal 7 → 4; pürüzlülük deri .58 → .5, kumaş .82 → .78, gürültü payı .16 → .08. Deri kenarlarına yumuşak yarı-geçirgenlik (`diffuse * skinF * rim² * .12`). Kenar ışığı (`RIMU`) .8 → .4 ve mavi ton griye yaklaştı (mor hale kalktı).
- **Düşman kalitesi:** orta/yüksek ayarda model çözünürlüğü .45/.55'e döndü; düşükte .36/.46 kalır (`creatures.js`, `SET.q`).
- **Minimal ölüm (`enemies.js die`, `update.js DY`):** sıradan düşmanlar artık havaya fırlayıp takla atmaz. Gövde yerinde kalır, vuruş yönünde 2.5 m/sn itilir, 0.55 sn'de hafif öne eğilip erir (ilk %25'te %7 şişer, sonra kısalarak küçülür ve toprağa iner); 6 kül zerresi (Mezarlık'ta mor, diğerlerinde koyu toprak). Mini bosslar 1.1 sn, bosslar 2.6 sn `d.big` devrilmesiyle ölür.
- **Zemin (`gfx.js terrHook`):** Koru yaprak döküntüsü hücre ölçeği 2.4 → 4.6 (yapraklar ~12 cm), renkler daha az doygun, karışım .9 → .6, yaprak bump 2.2 → 1.2, döküntü eşiği 1.0/1.14 → 1.04/1.2 (kahverengi lekeler dar). Çiçekler %40 küçüldü ve %20 soldu. Çakıl taşları: 1/5 hücre → 1/10, yarıçap .16 → .1, parlaklık 1.3 → 1.22 (Bozkır'daki "puantiye" gitti). Çimen çizgileri .22/.26 → .14/.18, ince dallar .7 → .35, küçük taşlar .8 → .5, genel ton gürültüsü .12/.06 → .07/.03. Çimen alanı 1500 → 1200 küme (düşükte 900).
- **Renk düzenleme (`GRADE`):** %35 filmik S eğrisi (`c²(3-2c)`), siyah seviyesi +.012, doygunluk 1.08 → 1.02, vinyet .32 → .42.
- **Huzmeler:** sandık/sunak huzmesi 36 m → 18 m, dokusu ters çevrildi (yerde parlak, yukarı doğru söner), opaklık .55 → .45. Gökyüzüne uzanan "beyaz direk" görüntüsü gitti; orman ışık huzmeleri eski dokuyu (`BEAMT_UP`) kullanır.

### Büyük harita, ölüm ekranı, düşük kalite gölgeleri (4 Kasım 2026)

- **Büyük harita (Tab):** mini haritayla aynı glif dili (koyu konturlu sandık, kristal, çadır, mezar taşı, davul, ok), konturlu etiketler (Tüccar, Kazan, Kös, Boss kapısı), keşfedilmiş simge kesiksiz/ keşfedilmemiş kesikli halka, sis perdesi kenarlarda yarı saydam, çerçeve pirinç halkalı ve yuvarlatılmış.
- **Ölüm/çıkış ekranı** sade: küçük büyük harf stat etiketleri, gümüş özeti tek kutu, silah hasar çubukları; build satırı kaldırıldı. Overlay giriş animasyonundan `fill-mode: both` çıkarıldı: kare üretilemeyen durumda (yazılım çizici, arka plan sekmesi) içerik görünmez kalıyordu.
- **Düşük kalite:** yaprak kartları gölge düşürmez (alfa kesimli gölge geçişi gerçek GPU'da en pahalı kalem); gövdeler düşürür.

### Performans ölçümü, görsel tur sonrası (4 Kasım 2026)

Ortam: başsız Chrome, SwiftShader (yazılım çizici, 4 çekirdek Xeon 2.1 GHz). Çizim süreleri gerçek GPU'yu temsil etmez (yazılım çizicide ve ilk karelerde shader derlemesiyle 10-460 ms arasında savruluyor); güvenilir sütunlar güncelleme süresi, çizim çağrısı, üçgen ve program sayıları.

| kalite | harita | yükleme ms | kurulum ms | boş upd/render ms | boş çağrı / üçgen | 400 düşman upd/render ms | 400 çağrı / üçgen | geo/doku/prog |
|---|---|---|---|---|---|---|---|---|
| düşük | koru | 12892 | 229 | 0.3 / 4.9 | 314 / 611k | 4.4 / 9.3 | 314 / 1630k | 248/46/51 |
| düşük | bozkir | 12892 | 1254 | 0.1 / 3.3 | 327 / 630k | 5.6 / 29.9 | 332 / 1649k | 240/48/52 |
| düşük | mezarlik | 12892 | 575 | 0.1 / 4.3 | 327 / 868k | 4.6 / 195.3 | 330 / 1887k | 251/46/57 |
| orta | koru | 10517 | 204 | 0.3 / 5.7 | 478 / 958k | 4.1 / 465 | 478 / 2673k | 251/48/62 |
| orta | bozkir | 10517 | 1220 | 0.1 / 3.2 | 367 / 920k | 2.1 / 190.3 | 375 / 2635k | 249/50/63 |
| orta | mezarlik | 10517 | 649 | 0.2 / 242 | 565 / 1315k | 4.3 / 14.4 | 568 / 3030k | 292/48/69 |
| yüksek | koru | 10908 | 87 | 0.4 / 12.7 | 518 / 922k | 2.8 / 242.6 | 518 / 2637k | 240/61/122 |
| yüksek | bozkir | 10908 | 991 | 0.1 / 3.9 | 404 / 880k | 3.1 / 160.8 | 412 / 2595k | 246/63/122 |
| yüksek | mezarlik | 10908 | 891 | 0.1 / 5.5 | 487 / 1315k | 5 / 205.5 | 490 / 3029k | 261/61/128 |

Sınıf bazında (orta kalite, boş sahne): Koru 958k üçgenin 302k'sı tek mesh'ler (arazi 180k + su + simge yapılar), 44k patika taşı, 35k cevher potları, 33k kaya, 31k çiçek, 29k meşe yaprağı. Mezarlık 1.3M: parmaklık 239k (parça başına 1.956 üçgen × ~120), kabak 110k + 44k, 45k sunak. Düşman başına ~4.3k üçgen (400 düşman +1.7M). Çizim çağrıları 314-568: bitki örtüsü 200 m'lik parçalara bölündüğü için tür başına 16-18 instanced çağrı; 40 toplamalı huzme/meşale; 20 sprite.

**Bulgular ve öncelik sırası**
1. Mezarlık parmaklığı: 1.956 üçgen çok; çubukları 4 kenarlı ve sayıyı yarıya indirince ~80k'ya iner.
2. Bitki örtüsü parça boyu 200 → 300 m: çağrı sayısı tür başına 18'den ~8'e; frustum kırpması biraz kabalaşır.
3. Kabak kırılabilirleri (154k) ve cevher potları (35k): düşük poligonlu sürüm, uzakta LOD.
4. Arazi 300×300 ızgara (180k): kenar dağları için seyrek ızgara ya da 240×240 (115k); zemin shader'ı başına piksel maliyeti büyümedi.
5. Bozkır kurulumu 1.0-1.25 s (kanvas dokuları + 44 kaya çıkıntısı + Voronoi): doku üretimi ilk açılışta önbelleğe alınıyor, sonrakiler ~0.3 s; ilk yüklemede yapılabilir.
6. Yüksek kalitede 122-128 program (ışıma + renk düzenleme + gölge varyantları): ön-derleme bunu kapsıyor, koşu sırasında yeni program yok.
Güncelleme (CPU) süresi 400 düşmanda 2-6 ms; sorun yok.

**Uygulanan iyileştirmeler ve sonuç (orta kalite, boş sahne):** parmaklık 4 kenarlı çubuk ve 5 kazık (1.956 → ~700 üçgen); bitki örtüsü parça boyu 200 → 300 m (küçük 150 → 225); cevher ve kabak düşük poligon blob (ws 10/hs 7) ve 3 külçe; arazi ızgarası 300 → 240 (aralık 2.5 m); kanvas dokular, ağaç/kaya geometrileri ve Mezarlık/Bozkır süs geometrileri ilk yüklemede (`warmAssets`).

| harita | çağrı önce → sonra | üçgen önce → sonra | kurulum ms önce → sonra |
|---|---|---|---|
| Koru | 478 → 408 | 958k → 859k | 204 → 295 |
| Bozkır | 367 → 355 | 920k → 818k | 1220 → 741 |
| Mezarlık | 565 → 405 | 1315k → 847k | 649 → 408 |

**İkinci tur:** Bozkır renkleri köşe başına 81 parçalı `dpoly` çağırıyordu (338 ms) → sütun tabanlı akış mesafesi (82 ms); kenar dağ gürültüsü yalnız |x|,|z|>200'de; ışık huzmeleri (52 mesh) ve sis levhaları (10-16 mesh) birer mesh'e birleştirildi (`mergeGeometries`); bitki örtüsü parça boyu her tür için 300 m; düşman model kalitesi .45/.55 → .36/.46 (düşman başına üçgen, gölge geçişi dahil, 4.286 → 3.186; 400 düşmanda 2.58M → 2.22M). Çizim çağrıları orta kalitede Koru 408 → ~310, Bozkır 355 → ~300. Kurulumun kalan maliyeti yükseklik alanı üretimi (~300 ms, 58k hücre × ~15 gürültü); geçiş ekranının arkasında kalıyor.

### Yapı malzemeleri: taş ve ahşap (4 Kasım 2026)

- `renderer.js structify(VMAT)`: yapı ve süs malzemesine dünya uzayında (instancing dahil) triplanar kanca. Köşe renginden sınıf: koyu, doygun, sıcak → ahşap; gri düşük doygunluk ya da parlak kızıl (Bozkır kerpiç) → taş; çok açık yüzeyler (keçe çadır) dışarıda. Taş: üç ölçekli tane ve leke, eksene hizalı düz yüzeylerde 1.1×0.55 m harç çizgili bloklar (kaydırmalı sıra, blok başına ton), kabartma. Ahşap: projeksiyon eksenine göre damar çizgileri ve budaklar, pürüzlülük .72 / taş .92. Uzakta ayrıntı söner.

### Bozkır ve Mezarlık zeminleri (4 Kasım 2026)

- **Bozkır** (`uStrata`): iki ölçekli kum tanesi, kumda rüzgâr dalgacıkları (kuru yamalarda kapalı), seyrek ve değişken boyutlu kızıl çakıl döşemesi (Voronoi, kabartmalı). Eski tabaka bantları, tuz kabuğu ve çatlak çamur korundu.
- **Mezarlık** (`uGrave`): ıslak koyu toprak yamaları, seyrek kemik parçaları (döndürülmüş ince dikdörtgen), kümeli çürük yapraklar (koyu, değişken boy), gri yosun. Koru'nun yaprak döküntüsü katmanı Mezarlık'ta kapalı.

### Orman tabanı (4 Kasım 2026)

- `terrHook` orman tabanı katmanı (`uFloor`: Koru 1, Mezarlık .7, Bozkır 0): köşe rengi kahverengiye kaymış yerlerde (r/g oranı) Voronoi hücreli döndürülmüş elips yaprak döküntüsü (üç ton, hücre başına rastgele boşluk), yosun yamaları (`uMoss`, Mezarlık'ta koyu), ince dal çizgileri, küçük gri taşlar. Yaprak ve taşlar ekran türevli kabartma alır (`kkLeaf`). Düz zeminle sınırlı (yamaçta kapalı).

### Karakter ve düşman malzemeleri (4 Kasım 2026)

- **`renderer.js rimify` → tam malzeme kancası:** köşe renginden malzeme sınıfı çıkarılır: düşük doygunluk + orta/yüksek parlaklık çelik, sarı-turuncu doygun ve parlak altın, turuncu ten tonu deri, geri kalanı kumaş. Nesne uzayında (dinlenme pozu) triplanar mikro doku: kumaşta ince dokuma ızgarası ve lekeler, deride tanecik, metalde fırça izi; pürüzlülük kumaş .82 / deri .58 / metal .34, metallik .9. Normal bozulması tek yükseklik örneği + ekran türevleri (ucuz). Kenar ışığı metalde yarıya iner.
- **Ortam yansıması:** `mkEnv` 128×64 ekvirektangüler kanvas (gök, ufuk sıcaklığı, güneş lekesi) → PMREM; `SKMAT.envMap` olarak atanır, instanced skinning klonları miras alır. Metaller artık siyah değil, gök ve güneşi yansıtır.
- Duman testinde 2. aşama ekran görüntüsü zaman aşımı 180 s (yazılım çizicide karakter shader'ı ağır).

### Dokulu kayalar, çimen ve çalılar (4 Kasım 2026)

- **Kayalar** (`realtrees.js rockGeo/rockMat`): ikosahedron + çok oktavlı gürültü yer değiştirmesi, yassı taban, küresel UV; kanvas granit dokusu (çatlak ağı, tane) ve kabartma. Koru yosunlu (üst yüzde yeşil), Bozkır kızıl, Mezarlık koyu gri. Eski blob kayalar kalktı.
- **Çimen** (`grassGeo/grassMat`): üç çapraz alfa kesimli kart, kanvas çimen tutamı dokusu (110 kıvrık yaprak, köke doğru koyu gradyan); yeşil, kuru ve gri çeşit; normal yukarı (zeminle aynı aydınlanma); oyuncuyu izleyen çimen alanı da aynı geometri.
- **Çalılar** (`bushGeo`): 14 yaprak kartı kümesi, Koru yeşil, Mezarlık sarı/turuncu, Bozkır sonbahar.
- **Çift yüzlü kart düzeltmesi:** three.js arka yüzde normali ters çeviriyordu (kartlar siyah kutu görünüyordu); `noFlip` kancası köşe normalini olduğu gibi kullanır. Yaprak ve çimen malzemelerine uygulandı.
- **Düşük kalite:** kart sayıları düşer (çam 5+2, meşe 7, çimen 2 kart, çalı 8), tutam 1100; önbellek anahtarları kaliteye göre ayrı.

### Harita yatırımı, üçüncü tur (4 Kasım 2026)

- **Su shader'ı:** `build.js` su malzemesine `onBeforeCompile` kancası: iki ölçekli, iki yönde kayan dalga normalleri (gürültü türevi), yüzeyde yavaş kayan koyu-açık lekeler. Doku kaydırması korunur.
- **Bulut gölgeleri:** `terrHook` iki ölçekli gürültüyle araziyi yavaşça süzülen lekelerle karartır (%28'e kadar); gerçek bulut sprite'larından bağımsız ama aynı hızda.
- **Ufuk dağları:** gökyüzü shader'ına iki katman silüet (gürültü tabanlı yükseklik profili, sis ve zirve rengine karışır); kenar dağlarının ardı boş görünmüyor.
- **Simge canlılığı:** `mkHearth(k=3)` meşale (direk + çift alev + hale), tapınak/dikilitaş/kervansarayda dört meşale; `mkFlag` rüzgârda dalgalanan bayrak (kule tepesinde, kamp ve kervansarayda; Bozkır kızıl, Koru mavi); `$G.FLAGS` her kare dalgalanır.
- **Mezarlık ruh ışıkları:** 14 gezinen hale (`$G.WISP`), oyuncu yaklaşınca kaçar, mor zerre bırakır.
- Işık huzmeleri inceltildi ve soluklaştırıldı (yakın planda geniş bant görünüyordu). Bayrak ve meşale geometrileri sahipli; sızıntı testi geçer.

### Işık ve gökyüzü (3 Kasım 2026)

- **Gökyüzü shader'ı** (`world/terrain.js skyD`): köşe renkli küre yerine ShaderMaterial. Zirve→ufuk geçişi, ufukta biyoma özgü ışık bandı (Koru alacakaranlık turuncusu, Bozkır gün batımı, Mezarlık mor), güneş halesi (`disc` × `halo`), ay halesi, yavaş kayan pus gürültüsü. `paintSky(B)` uniform'ları doldurur.
- **Hilal:** kanvas dokulu sprite ve arkasında hale; Koru ve Mezarlık'ta görünür, oyuncuya göre sabit yönde (`loop.js`).
- **Işık huzmeleri** (`engine/gfx.js lightShafts`): güneş yönünde eğik, çapraz iki toplamalı levha; Koru'da koru içinde 26, Mezarlık'ta 14 ay demeti. Sandık huzmesi dokusu ters çevrilerek kullanılır.
- **Biyom renk tonu:** renk düzenleme geçişine `uTint` (Bozkır sıcak, Mezarlık soğuk); `$G.GRP` geçişi `buildWorld` günceller.
- **Yıldız parıltısı** ve biyoma göre yıldız yoğunluğu (Bozkır'da soluk). Koru güneşi biraz daha sıcak ve yumuşak, Mezarlık ay ışığı daha soğuk.

## 3. Sıra ve kaba ağırlık

| Faz | Ağırlık | Neden bu sırada |
| --- | --- | --- |
| 0 Temel | büyük | sonraki her fazın maliyetini yarıya indirir |
| 1 Çekirdek döngü | orta | oyunun şekli bu; içerik buna oturur |
| 2 Silah ve tom | orta | en görünür içerik, eşya kancalarını kullanır |
| 3 Eşya | büyük | 86 satır, çoğu tetikli; birim test ister |
| 4 Karakter | büyük | kadro 8 (4 taban + 4 ayrı gövde) + rütbe + kostüm + şapka |
| 5 Dünya | büyük | 1 yeni harita, ~35 düşman, 12 boss |
| 8 Kalanlar | küçük | aksesuar katmanı, hareket bulanıklığı, bestiyer, tipler; Faz 4-7'nin açık uçları |
| 9 Performans ve eşleşme denetimi | orta | takılma kaynakları ölçülüp kapatıldı; decompile verisiyle madde madde karşılaştırma ve eksikler |
| 10 Wiki doğrulaması | orta | 51 düşman, Steam kilit koşulları, dükkân merdivenleri, koşu zamanları, kostüm/şapka, başarım aynası |
| 6 Meta | orta | veri ağırlıklı, sistem küçük |
| 7 Cila | orta | ayarlar, sıralama, ses, performans |

Faz 2 ve 3 paralel yürüyebilir, ikisi de Faz 0'a bağlı. Faz 4 modelleme işi olduğu için Faz 5 ile paralel.

## 4. Riskler ve kararlar

- **Veri kaynağı.** İlk oturumda wiki siteleri ağ politikasıyla engellendi; o turdan kalan `(?)` işaretleri 5 Kasım 2026 teyidinde kapatıldı (bkz. "Wiki teyidi"). megabonk.wiki hâlâ doğrudan açılmıyor; dizinlenmiş metni ve megabonk.org kullanılıyor. Uygulamaya başlamadan megabonk.wiki ve `lukeod/megabonk_research` deposu doğrudan okunmalı. İkincisi decompile veri olduğu için sayılar oradan alınmalı.
- **Fazladan içerik.** Bizde olup Megabonk'ta olmayanlar (Şok Dalgası, Zehir İzi, Tunç Kalkan, Ab-ı hayat pınarı, Kemik Okçu Başı, Mezar ruhu, Ayaz'ın buz sürümü, 8 stat yükseltmesi, tuş atama, dokunmatik, kumanda) silinmez. Havuzda kalır, Toggler ile kapatılabilir.
- **Performans tavanı.** Web ve mobilde 400 hayalet Faz 0'daki havuz ve instancing olmadan tutmaz. Faz 1'in Son Dalga maddesi Faz 0'ın 6. maddesine bağlı.
- **Model üretimi.** 14 karakter, ~35 düşman, 12 boss prosedürel modelle çizilecek. `geo/models.js` zaten 2.247 satır; karakter başına ayrı dosya ve ortak parça kütüphanesi gerekir.
- **TypeScript.** Faz 0'da `data/` tabloları için tip tanımı, 86 eşyanın kanca imzalarını yakalamak için şart.
- **İsimler.** Buradaki Türkçe adlar öneri. Mitolojik tutarlılık için Erlik, Umay, Tengri, Albastı, Karakoncolos, Tepegöz, Şahmeran, Tulpar, Anka, Aşık kemiği gibi yerleşik ögeler kullanıldı. Megabonk'un meme tonu (Monke, Amog, Kevin) bizde Keloğlan, Yaban, Lahmacun gibi yerel mizahla karşılanır.

## 5. Kaynaklar

- github.com/lukeod/megabonk_research (decompile veri: silahlar, eşyalar, statlar, nadirlik formülü)
- github.com/ashulgach/Bonkipelago, github.com/zandy2test/megabonk-asset (enum ve asset listeleri)
- megabonk.org/database, bonkmaster.com/database, survivorsdb.com/megabonk/unlocks
- megabonk.wiki (Shop, Quests, Challenges, Maps, Patch Notes)
- steamcommunity.com/sharedfiles/filedetails/?id=3571240516 ve ?id=3588811651 (topluluk rehberleri)
- thegamer.com, destructoid.com, dexerto.com, screenrant.com rehberleri
