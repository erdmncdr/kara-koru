// engine/glbhero.js · Kara Koru
// Meshy ile üretilmiş, iskeletli kahramanlar: Alp ve Kam. Varsayılan açık; adreste ?eski (ya da localStorage kk_meshy=0)
// kodla kurulmuş eski gövdeyi geri getirir. Kahraman seçiliyken eski gövde gizlenir, aynı boya ölçeklenmiş GLB konur.
// Meshy iskeletlerinde kemik adları ortak: yürüme, koşu, zıplama, kayma, atılma, takla ve darbe klipleri Alp'in dosyalarından
// bütün kahramanlarda oynar (KLIP); kahramana özel olan yalnız model, elindekiler ve saldırı/duruş klipleri (KAHRAMAN).
// Kam (11 Kasım 2026): 18.485 üçgen, 2K doku. Bekleme, yürüme ve koşu Alp'le aynı doğal klipler; asa sağ yumruğun deliğinden
// geçer, yere basılı ve dik durur, sağ kol her karede asaya göre bükülür (asaTut: iki kemikli ters kinematik). Saldırıda kol
// serbest kalır: asayı göğe kaldırma ve ileri itme klipleri oynar.
// Hareketler (Meshy kütüphanesi): menüde rahat bekleme, oyunda kılıç-kalkan savaş duruşu; hıza göre yürüme ile hızlı
// koşu karışımı (ayak hızı ölçülerek eşlenir); zıplama (dikey hıza göre kare), çift zıplamada takla büzülmesi (oyun
// gövdeyi kendisi döndürür), kayma (en alçak duruş), atılma (dönen hızlı adım); saldırı ve darbe yalnız üst gövdede.
// Kılıç ve kalkan da Meshy modeli; kılıç sağ ele kabzasından, kalkan sol ön kola yüzü kola dik takılır.
// Şapka baş kemiğine taşınır; kostüm dokunun piksellerine uygulanır.
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as T from 'three';
import { $G } from '../core/store.js';
import { SKINF } from '../game/heroes.js';
import { HALO, RIMU } from './renderer.js';

const U = n => new URL(`../assets/model/${n}.glb`, import.meta.url).href;
// ortak klip dosyaları (bütün kahramanlar)
const KLIP = { yuru: U('alp_yuru'), hareket: U('alp_hareket'), hareket2: U('alp_hareket2') };
// kahramana özel dosyalar: model, elindekiler (es), kendi klipleri (klip)
const URLS = {
  alp: { model: U('alp'), es: { kilic: U('alp_kilic'), kalkan: U('alp_kalkan') } },
  kam: { model: U('kam'), es: { asa: U('kam_asa') }, klip: U('kam_buyu') }
};
// kahraman ayarı. sal: saldırı kliplerinin oyunun 0.42 sn'lik saldırı ilerlemesine eşlenen aralığı (sn).
// ayak, kosUst: kahramanın kendi koşu klibi varsa onun ayak hızı ve hızlanma üst sınırı (yoksa ortak AYAK, KOS_UST).
// basOlcu: boy eski gövdenin kutusuna göre değil baş eklemine göre eşlenir (eski gövdede baştan uzun asa ya da boynuz varsa).
const KAHRAMAN = {
  alp: { sal: { atkR: [.12, .95], atkL: [.3, 1.2] } },
  kam: { sal: { atkR: [.3, 1.3], atkL: [.75, 1.65] }, basOlcu: 1, ayak: { walk: .7, run: 1.65 }, kosUst: 1.65 }
};
// kliplerin kendi ayak hızı (boy/sn): oyunda sabit hızla ilerletilen modelde yerdeki ayağın kaymasını en aza indiren
// değer tarandı (tools/meshy-oyun.mjs ölçümü). Kalan ~%35, bileğin topuktan parmağa yuvarlanması
const AYAK = { walk: .7, run: 3.7 };
// çok hızlı koşuda bacaklar telaşlanmasın: koşu en fazla bu kadar hızlanır (üstünde az bir kayma kalır)
const KOS_UST = 2.1;

let on = null;
export function meshyOn() {
  if (on == null) {
    try {
      on = !/[?&]eski\b/.test(location.search) && localStorage.getItem('kk_meshy') != '0';
    } catch (e) {
      on = true;
    }
  }
  return on;
}

const LD = new GLTFLoader(),
  cache = {};
// modelin dosyası bir kez indirilir, bellekte tutulur; her kahraman kurulumunda bellekten ayrıştırılır (ağa yeniden gidilmez).
// İndirme başarısız olursa kayıt silinir: sonraki kurulum yeniden dener
const buf = {};
function modelBuf(k) {
  if (!buf[k]) {
    buf[k] = fetch(URLS[k].model)
      .then(r => {
        if (!r.ok) throw new Error('http ' + r.status);
        return r.arrayBuffer();
      })
      .catch(e => {
        delete buf[k];
        throw e;
      });
  }
  return buf[k];
}
// ortak klipler bir kez yüklenir ve kök hareketi bir kez silinir
let klipP = null;
function ortakKlip() {
  if (!klipP) {
    klipP = Promise.all([KLIP.yuru, KLIP.hareket, KLIP.hareket2].map(x => LD.loadAsync(x))).then(([w, h, h2]) => {
      const by = (g, n) => g.animations.find(a => a.name == n);
      return kok({
        walk: w.animations[0], idle: by(h, 'Idle'), atkR: by(h, 'Right_Hand_Sword_Slash'), atkL: by(h, 'Left_Slash'),
        jump: by(h, 'Regular_Jump'), slide: by(h, 'slide_light'), hit: by(h, 'Hit_Reaction'),
        combat: by(h2, 'Combat_Stance'), run: by(h2, 'RunFast'), flip: by(h2, 'Backflip_Jump'), dash: by(h2, 'Quick_Step_and_Spin_Dodge')
      });
    }).catch(e => {
      klipP = null;
      throw e;
    });
  }
  return klipP;
}
// kahramanın klip kümesi ve elindekiler bir kez yüklenir; model her kurulumda yeniden ayrıştırılır (sahne nesnesi paylaşılamaz)
function ortak(k) {
  if (!cache[k]) {
    const u = URLS[k], es = Object.entries(u.es || {});
    cache[k] = Promise.all([ortakKlip(), u.klip ? LD.loadAsync(u.klip) : null, ...es.map(([, x]) => LD.loadAsync(x))]).then(([C0, kg, ...E]) => {
      let C = C0;
      if (k == 'kam') {
        // bekleme ve oyundaki duruş aynı doğal bekleme klibi (kılıç-kalkan savaş duruşu asayla yakışmaz); saldırılar Kam'ın
        // kendi klipleri. Koşu da kendi klibi: ortak hızlı koşu gövdeyi 50° öne yatırır, bu dik koşar (10°)
        const by = n => kg.animations.find(a => a.name == n);
        C = { ...C0, combat: C0.idle, ...kok({ atkR: by('Asa_Kaldir'), atkL: by('Asa_It'), run: by('Kos') }) };
      }
      const O = { C };
      es.forEach(([ad], i) => (O[ad] = E[i].scene));
      return O;
    }).catch(e => {
      delete cache[k];
      throw e;
    });
  }
  return cache[k];
}

// kök hareketini sil: oyun karakterin yerini kendisi taşır. Kalçanın x/z kayması hep, y'si zıplama ve taklada silinir
// (kaymada kalça alçalır, bu kalır). Taklada kalçanın dönüşü de sabitlenir: oyun gövdeyi kendisi döndürür, klipten
// yalnız büzülme duruşu alınır.
function kok(C) {
  for (const [k, c] of Object.entries(C)) {
    // sol elin ölçeği kodla küçültülür (kalkanın arkasında kalsın); klipler bunu her karede 1'e döndürmesin
    c.tracks = c.tracks.filter(t => t.name != 'LeftHand.scale');
    for (const tr of c.tracks) {
      if (tr.name == 'Hips.quaternion' && k == 'flip') {
        const v = tr.values;
        for (let i = 4; i < v.length; i += 4) for (let j = 0; j < 4; j++) v[i + j] = v[j];
      }
      if (tr.name != 'Hips.position') continue;
      const v = tr.values, x0 = v[0], y0 = v[1], z0 = v[2];
      for (let i = 0; i < v.length; i += 3) {
        v[i] = x0;
        v[i + 2] = z0;
        if (k == 'jump' || k == 'flip') v[i + 1] = y0;
      }
    }
  }
  return C;
}

// üst gövde kemikleri: saldırı ve darbe yalnız bunlarda oynar
const UST = /^(Spine\d*|neck|Head|head_end|headfront|(Left|Right)(Shoulder|Arm|ForeArm|Hand))\./;
const bol = (c, ust) => new T.AnimationClip(c.name + (ust ? '_ust' : '_alt'), c.duration, c.tracks.filter(t => UST.test(t.name) == ust));

// kostüm: eski gövdenin renk fonksiyonu dokunun her pikseline uygulanır
function kostum(map, sk) {
  const f = SKINF[sk];
  if (!f || !map || !map.image) return map;
  const im = map.image, w = im.width, h = im.height, cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const cx = /** @type {CanvasRenderingContext2D} */ (cv.getContext('2d'));
  cx.drawImage(im, 0, 0);
  const d = cx.getImageData(0, 0, w, h), a = d.data;
  for (let i = 0; i < a.length; i += 4) {
    const [r, g, b] = f(a[i] / 255, a[i + 1] / 255, a[i + 2] / 255);
    a[i] = Math.min(255, r * 255);
    a[i + 1] = Math.min(255, g * 255);
    a[i + 2] = Math.min(255, b * 255);
  }
  cx.putImageData(d, 0, 0);
  const t = new T.CanvasTexture(cv);
  t.flipY = map.flipY;
  t.colorSpace = map.colorSpace;
  t.anisotropy = 4;
  return t;
}

// Meshy dokusu gölgeyi içinde taşıyor ve koyu: oyunun ışığında eski gövdeyle aynı parlaklığa gelsin
function malzeme(o, sk) {
  if (!o.isMesh) return;
  o.castShadow = true;
  o.frustumCulled = false;
  const mt = o.material;
  mt.metalness = 0;
  mt.roughness = .7;
  mt.color.multiplyScalar(1.12);
  if (mt.map) {
    if (sk) mt.map = kostum(mt.map, sk);
    mt.emissiveMap = mt.map;
    mt.emissive.setRGB(1, 1, 1);
    mt.emissiveIntensity = .2;
  }
  // kenar ışığı: oyundaki bütün karakterlerde olduğu gibi siluet arka plandan ayrılsın (renderer.js rimify ile aynı terim)
  mt.onBeforeCompile = sh => {
    sh.uniforms.rimCol = RIMU;
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 rimCol;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n{float rimF=1.0-clamp(dot(normal,normalize(vViewPosition)),0.0,1.0);totalEmissiveRadiance+=rimCol*(rimF*rimF*rimF);}');
  };
  mt.customProgramCacheKey = () => 'glbrim';
}

// silah modelini kendi kabına koyar: pv (modelin yerel koordinatında tutma noktası) kabın merkezine gelir,
// boyu `uzun` ekseninde 1 birim olur. Kap, tak() ile istenen boya ölçeklenir.
function kap(model, pv, uzunluk, sk = '') {
  const k = new T.Group(), m = model.clone(true);
  // klonlanan malzeme paylaşılmasın: kostüm ve kenar ışığı yalnız bu kopyaya
  m.traverse(o => { if (o.isMesh) o.material = o.material.clone(); malzeme(o, sk); });
  m.position.copy(pv).multiplyScalar(-1 / uzunluk);
  m.scale.multiplyScalar(1 / uzunluk);
  k.add(m);
  return k;
}
// modelin köşe noktalarından sınır kutusu (isteğe bağlı süzgeçle)
function kutu(model, suz) {
  const b = new T.Box3(), v = new T.Vector3();
  model.updateMatrixWorld(true);
  model.traverse(o => {
    if (!o.isMesh) return;
    const p = o.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld);
      if (!suz || suz(v)) b.expandByPoint(v);
    }
  });
  return b;
}

// nesneyi bir kemiğe, dünya uzayında istenen konum, yön (nesnenin `eksen`i buraya bakar) ve boyla takar
// yan: verilirse modelin +X ekseni bu yöne (eksene dik bileşenine) çevrilir (kılıcın keskin kenarı gibi)
function tak(nes, kemik, dunyaPos, dunyaYon, boy, eksen = new T.Vector3(0, 1, 0), dondur = 0, yan = null) {
  kemik.updateWorldMatrix(true, false);
  const kq = new T.Quaternion(), ks = new T.Vector3(), kp = new T.Vector3();
  kemik.matrixWorld.decompose(kp, kq, ks);
  let q;
  if (yan) {
    const y = dunyaYon.clone().normalize(), x = yan.clone().addScaledVector(y, -yan.dot(y)).normalize(), z = new T.Vector3().crossVectors(x, y);
    q = new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(x, y, z));
  } else q = new T.Quaternion().setFromUnitVectors(eksen, dunyaYon.clone().normalize());
  if (dondur) q.multiply(new T.Quaternion().setFromAxisAngle(eksen, dondur));
  nes.quaternion.copy(kq.clone().invert().multiply(q));
  nes.position.copy(kemik.worldToLocal(dunyaPos.clone()));
  nes.scale.setScalar(boy / ks.x);
  kemik.add(nes);
}

// yumruğun ortası: ağırlığı çoğunlukla bu el kemiğinde olan köşelerin dünya konumlarının ortası (dinlenme duruşu)
function yumruk(root, ad) {
  const t = new T.Vector3(), v = new T.Vector3();
  let n = 0;
  root.traverse(o => {
    if (!o.isSkinnedMesh) return;
    const bi = o.skeleton.bones.findIndex(b => b.name == ad);
    if (bi < 0) return;
    const p = o.geometry.attributes.position, si = o.geometry.attributes.skinIndex, sw = o.geometry.attributes.skinWeight;
    for (let i = 0; i < p.count; i++) {
      let w = 0;
      for (let j = 0; j < 4; j++) if (si.getComponent(i, j) == bi) w += sw.getComponent(i, j);
      if (w < .6) continue;
      // derili köşenin dünya konumu: three.js kemik dönüşümleriyle (bağlama matrisi dahil) hesaplar
      t.add(o.getVertexPosition(i, v).applyMatrix4(o.matrixWorld));
      n++;
    }
  });
  return n ? t.divideScalar(n) : null;
}

// miğferin tepesi: verilen yüksekliğin üstündeki derili köşelerin ortası (dinlenme duruşu). Tepe, baş ekleminin gerisinde kalır;
// şapka eklemin değil tepenin hizasına oturur
function tepeOrta(root, y) {
  const t = new T.Vector3(), v = new T.Vector3();
  let n = 0;
  root.traverse(o => {
    if (!o.isSkinnedMesh) return;
    const p = o.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      o.getVertexPosition(i, v).applyMatrix4(o.matrixWorld);
      if (v.y < y) continue;
      t.add(v);
      n++;
    }
  });
  return n ? t.divideScalar(n) : null;
}

// ---- Alp: kılıç sağ yumrukta, kalkan sol ön kolda
function takAlp({ O, root, bone, wp, ileri, sol, yuk, gq, h0, sk }) {
  // kılıç: model dik, ağız +Y. Yumruğun içindeki delik dinlenme duruşunda öne bakar (başparmak önde): kabza deliğin
  // ekseni boyunca, kabzanın ortası yumruğun ortasında; ağız başparmak tarafından (öne) çıkar, keskin kenar aşağıda.
  // Kılıç el kemiğine bağlıdır: kol nasıl dönerse yumrukla birlikte döner.
  {
    const bt = kutu(O.kilic), hk = bt.max.y - bt.min.y,
      kb = kutu(O.kilic, v => v.y > bt.min.y + hk * .06 && v.y < bt.min.y + hk * .18),
      pv = kb.getCenter(new T.Vector3()),
      orta = yumruk(root, 'RightHand') || wp('RightHand'),
      disa = sol.clone().negate(),
      yon = ileri.clone().applyAxisAngle(disa, -KILIC.egim);
    orta.addScaledVector(ileri, h0 * KILIC.ileri).addScaledVector(yuk, h0 * KILIC.yukari).addScaledVector(disa, h0 * KILIC.disa);
    tak(kap(O.kilic, pv, hk, sk), bone('RightHand'), orta, yon, h0 * KILIC.boy, undefined, 0, yuk.clone().multiplyScalar(KILIC.kenar));
  }
  // kalkan: model yüzü +Z. Kayışla ön kolun dış yüzüne (elin sırtına) bağlanır: A duruşunda avuç aşağı bakar, el
  // sırtı yukarı; kalkanın yüzü o yöne, ön kola dik. Kol hangi duruşta dönerse kalkan elin sırtıyla birlikte döner.
  // Merkezi bileğin biraz gerisinde, kolun dışına itilmiş; eldiven arkada kalsın diye sol el biraz küçültülür
  {
    const bt = kutu(O.kalkan), cap = Math.max(bt.max.x - bt.min.x, bt.max.y - bt.min.y),
      a = wp('LeftForeArm'), b = wp('LeftHand'), eks = b.clone().sub(a).normalize(),
      n = new T.Vector3(0, 1, 0).applyQuaternion(gq).multiplyScalar(KALKAN_YON).addScaledVector(ileri, .25);
    n.addScaledVector(eks, -n.dot(eks)).normalize();
    const merkez = a.clone().lerp(b, .82).addScaledVector(n, h0 * KALKAN_ON);
    tak(kap(O.kalkan, bt.getCenter(new T.Vector3()), cap, sk), bone('LeftForeArm'), merkez, n, h0 * .3, new T.Vector3(0, 0, 1));
    bone('LeftHand').scale.setScalar(.7);
  }
}

// asa ayarı (kahraman boyunun oranları; denetim aracından değiştirilebilir): boy asanın uzunluğu, tut tutma noktasının asanın
// altından oranı; yan / on / yuk tutma noktasının gövdeye göre yeri (sağa, öne, yerden)
export const ASA = { boy: 1.15, tut: .47, yan: .3, on: .2, yuk: .55 };
// denetim: test derlemesinde adresle denenir (?asayan=.34&asayuk=.6)
if (__KOPRU__) {
  const q = new URLSearchParams(location.search);
  for (const k of Object.keys(ASA)) if (q.get('asa' + k)) ASA[k] = +q.get('asa' + k);
}

// ---- Kam: asa sağ yumrukta, yumruğun deliğinden geçer (delik dinlenme duruşunda öne bakar, başparmak önde: Alp'in kılıcı gibi).
// Asa el kemiğine bağlıdır; beklerken ve yürürken eli asanın olması gereken yere asaTut götürür. Ucundaki kor taşına ışıma eklenir.
function takKam({ O, root, bone, wp, ileri, h0, sk }) {
  const el = bone('RightHand'), orta = yumruk(root, 'RightHand') || wp('RightHand');
  const bt = kutu(O.asa), hk = bt.max.y - bt.min.y,
    kb = kutu(O.asa, v => v.y > bt.min.y + hk * (ASA.tut - .05) && v.y < bt.min.y + hk * (ASA.tut + .05)),
    pv = kb.getCenter(new T.Vector3()),
    nes = kap(O.asa, pv, hk, sk);
  tak(nes, el, orta, ileri, h0 * ASA.boy);
  // ters kinematik için elin kendi uzayında: asanın yönü (h), yumruk ortası (c), kolun ekseni (a: ön koldan ele; h'ye dikleştirilir)
  el.updateWorldMatrix(true, false);
  const qe = el.getWorldQuaternion(new T.Quaternion()).invert(),
    h = new T.Vector3(0, 1, 0).applyQuaternion(nes.quaternion).normalize(),
    a = wp('RightHand').sub(wp('RightForeArm')).normalize().applyQuaternion(qe);
  a.addScaledVector(h, -a.dot(h)).normalize();
  el.userData.asa = { el, kol: bone('RightArm'), on: bone('RightForeArm'), h, a, n: new T.Vector3().crossVectors(h, a), c: nes.position.clone(), w: 1 };
  // sol kol (solKol): elin kendi uzayında kolun ekseni ve avucun baktığı yön. Dinlenme duruşunda avuç aşağı bakar
  const sl = bone('LeftHand');
  if (sl) {
    sl.updateWorldMatrix(true, false);
    const qs = sl.getWorldQuaternion(new T.Quaternion()).invert(),
      as = wp('LeftHand').sub(wp('LeftForeArm')).normalize(),
      ns = new T.Vector3(0, -1, 0);
    ns.addScaledVector(as, -ns.dot(as)).normalize();
    as.applyQuaternion(qs);
    ns.applyQuaternion(qs);
    el.userData.asa.sol = { el: sl, kol: bone('LeftArm'), on: bone('LeftForeArm'), a: as, n: ns, w: 0 };
  }
  // kor taşı: asanın tepesinde toplamalı ışıma (asayla birlikte ölçeklenir)
  const isik = new T.Sprite(new T.SpriteMaterial({ map: HALO, color: 0xff8a30, transparent: true, opacity: .8, blending: T.AdditiveBlending, depthWrite: false, fog: true }));
  isik.position.set(0, (bt.max.y - hk * .09 - pv.y) / hk, 0);
  isik.scale.setScalar(.34);
  nes.add(isik);
}

// kılıç ayarı (denetim aracından değiştirilebilir): yumruk ortasından kayma (boy oranı; ileri, yukarı, dışa),
// ağzın ileri yönden yukarı eğimi (radyan), keskin kenarın yönü (+1 aşağı)
export const KILIC = { ileri: 0, yukari: 0, disa: 0, egim: 0, kenar: 1, boy: .62 };

// kalkanın ön kolun önüne itilme payı (boyun oranı)
const KALKAN_ON = .06;
// el sırtının A duruşundaki yönü (+1 yukarı, -1 aşağı)
const KALKAN_YON = 1;

// etkin GLB kahraman
let G = null;

// hero() sonrası çağrılır; uygun değilse hiçbir şey yapmaz
export function glbHero(H, key) {
  if (!meshyOn() || !URLS[key] || !H) return;
  const hedef = H,
    sk = ($G.META && $G.META.skin && $G.META.skin['cur' + $G.CI]) || '';
  const ay = KAHRAMAN[key] || {};
  // eski gövdenin boyu şimdi ölçülür. Dosyaları inmiş kahramanda (açılışta Alp ve seçili kahraman; kahraman sayfası açılınca
  // diğerleri) gövde hemen gizlenir: eski gövde görünüp sonra yenisine dönmesin. İnmemişse o sürede eski gövde görünür kalır.
  hedef.g.updateMatrixWorld(true);
  const b0 = new T.Box3().setFromObject(hedef.g);
  let h0 = Math.max(1, b0.max.y - b0.min.y);
  // baş ekleminin yerden yüksekliği (eski gövdede asa ya da boynuz kutuyu büyütüyorsa boy buna göre eşlenir)
  const bas0 = hedef.b && hedef.b.hd ? hedef.b.hd.getWorldPosition(new T.Vector3()).y - b0.min.y : 0;
  // ölçüm anındaki gövde yüksekliği: model yüklenene kadar gövde yerine taşınmış olur, şapkanın yeri buna göre düzeltilir
  const gy0 = hedef.g.getWorldPosition(new T.Vector3()).y;
  const eskiler = hedef.g.children.slice(), gizle = () => { for (const c of eskiler) c.visible = false; };
  if (hazir[key]) gizle();
  // eski gövdenin gözleri ayrı çizilir (engine/eyes.js, eski kemikten): yeni yüzün önünde havada kalmasın
  const gozler = hedef.eyes;
  hedef.eyes = null;
  Promise.all([modelBuf(key).then(b => LD.parseAsync(b, '')), ortak(key)]).then(([m, O]) => {
    if ($G.H !== hedef) return; // bu arada başka kahraman seçildi
    const C = O.C;
    const root = m.scene;
    gizle();
    root.traverse(o => malzeme(o, sk));
    root.updateMatrixWorld(true);
    const b1 = new T.Box3().setFromObject(root), h1 = Math.max(1e-4, b1.max.y - b1.min.y);
    let s = h0 / h1;
    if (ay.basOlcu && bas0 > 0) {
      // baş eklemleri aynı yüksekliğe gelsin; h0 bundan sonra yeni gövdenin baş üstüne kadarki boyu (kılıç, asa ve ayak hızı ölçüsü)
      const bk = root.getObjectByName('Head'), be = root.getObjectByName('head_end') || bk,
        by1 = bk.getWorldPosition(new T.Vector3()).y - b1.min.y;
      s = bas0 / Math.max(1e-4, by1);
      h0 = (be.getWorldPosition(new T.Vector3()).y - b1.min.y) * s;
    }
    root.scale.multiplyScalar(s);
    root.position.y -= b1.min.y * s;
    hedef.g.add(root);
    hedef.g.updateMatrixWorld(true);
    const bone = n => root.getObjectByName(n),
      wp = n => bone(n).getWorldPosition(new T.Vector3()),
      gq = hedef.g.getWorldQuaternion(new T.Quaternion()),
      ileri = new T.Vector3(0, 0, 1).applyQuaternion(gq),
      sol = new T.Vector3(1, 0, 0).applyQuaternion(gq),
      yuk = new T.Vector3(0, 1, 0);
    const ctx = { O, root, bone, wp, ileri, sol, yuk, gq, h0, sk };
    if (key == 'alp') takAlp(ctx);
    else if (key == 'kam') takKam(ctx);
    // şapka: eski gövdenin baş kemiğinden yenisinin başına, miğferin tepesine
    if (hedef.hat) {
      const taban = hedef.g.getWorldPosition(new T.Vector3()).y - gy0 + b0.min.y,
        ucK = ay.basOlcu && bone('head_end') ? wp('head_end') : null,
        bas = ucK || tepeOrta(root, taban + h0 * .86) || wp('Head'), tepe = ucK || new T.Vector3(bas.x, taban + h0 * .93, bas.z);
      tak(hedef.hat, bone('Head'), tepe, yuk, hedef.hat.getWorldScale(new T.Vector3()).x);
      hedef.hat.visible = true;
    }
    const mixer = new T.AnimationMixer(root),
      A = {};
    for (const k of ANA) {
      A[k] = mixer.clipAction(bol(C[k], false));
      A[k + '_u'] = mixer.clipAction(bol(C[k], true));
    }
    for (const k of ['atkR', 'atkL', 'hit']) A[k] = mixer.clipAction(bol(C[k], true));
    for (const a of Object.values(A)) a.play(), a.setEffectiveWeight(0);
    for (const k of ['jump', 'flip', 'slide', 'dash', 'atkR', 'atkL', 'hit']) {
      A[k].timeScale = 0;
      if (A[k + '_u']) A[k + '_u'].timeScale = 0;
    }
    G = { H: hedef, root, mixer, A, h0, w: { idle: 1 }, wu: 0, slT: 0, ust: null, ay, sal: ay.sal || KAHRAMAN.alp.sal, ayak: ay.ayak || AYAK, kosUst: ay.kosUst || KOS_UST };
    // asa taşıyan kahraman: sağ kol her karede asaya göre bükülür (asaTut)
    { const el = bone('RightHand'); if (el && el.userData.asa) /** @type {any} */ (G).asa = el.userData.asa; }
    // denetim araçları için (tools/meshy-el.mjs): duruşu dondurup tek klip anı göstermek. Yayın derlemesinde pencereye açılmaz
    if (__KOPRU__) /** @type {any} */ (window).__glb = G;
    /** @type {any} */ (G).tick = glbTick;
    /** @type {any} */ (G).asaTut = () => asaTut(G, 0, true); // denetim aracı dondurulmuş duruşta da uygulayabilsin
  }).catch(e => {
    // yüklenemezse eski gövde geri gelir
    console.warn('Meshy modeli yüklenemedi', e);
    for (const c of eskiler) c.visible = true;
    hedef.eyes = gozler;
  });
}

// oyun açılırken dosyalar önceden indirilir: menü gelince model hazır olsun. Açılış ekranı bunların bitmesini bekler
// (ui/yukle.js); dönen dizi: [model dosyası, klipler ve silahlar]
export function glbOnYukle() {
  if (!meshyOn()) return [];
  // Alp her zaman (ortak klipler onun dosyalarında); son seçilen kahraman Kam ise o da (açılışta eski gövde görünmesin).
  // Diğer durumda Kam'ın dosyaları (~3,4 MB) kahraman sayfası açılınca iner: ilk açılışı ağırlaştırmaz.
  const a = [...indir('alp')];
  try {
    const k = ACILIS[localStorage.getItem('kk_ci') || ''];
    if (k) a.push(...indir(k));
  } catch (e) {}
  return a;
}
// kayıttaki kahraman sırası (kk_ci) → anahtar; sıra kalıcıdır (game/heroes.js CR)
const ACILIS = { 1: 'kam' };
// dosyaları inmiş kahramanlar
const hazir = {};
function indir(k) {
  const a = [modelBuf(k), ortak(k)];
  Promise.all(a).then(() => (hazir[k] = 1), () => {});
  return a;
}
// kahraman sayfası açılınca: açılışta inmeyen kahramanların dosyaları arkada iner, seçilince model hemen gelir
export function glbHazirla() {
  if (!meshyOn()) return;
  for (const k of Object.keys(URLS)) if (!hazir[k]) indir(k);
}

const ANA = ['idle', 'combat', 'walk', 'run', 'jump', 'flip', 'slide', 'dash'];
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export function glbTick(dt) {
  if (!G || G.dondur) return;
  if ($G.H !== G.H) return void (G = null);
  const P = $G.P || {},
    pl = $G.S == 'play',
    vm = pl ? Math.hypot(P.vx || 0, P.vz || 0) : 0,
    A = G.A,
    h0 = G.h0;
  // ana durum ve hedef ağırlıklar
  const st = pl && P.dsh > 0 ? 'dash' : pl && P.sl ? 'slide' : pl && P.air ? (P.flip > 0 ? 'flip' : 'jump') : vm > 1.2 ? 'move' : pl ? 'combat' : 'idle';
  const kos = sm(3.5, 7.5, vm),
    hedef = { idle: st == 'idle', combat: st == 'combat', walk: st == 'move' ? 1 - kos : 0, run: st == 'move' ? kos : 0, jump: st == 'jump', flip: st == 'flip', slide: st == 'slide', dash: st == 'dash' };
  const k = Math.min(1, dt * (st == 'jump' || st == 'flip' || st == 'dash' ? 18 : 10));
  for (const n of ANA) {
    const w = (G.w[n] || 0) + (+hedef[n] - (G.w[n] || 0)) * k;
    G.w[n] = w < .002 ? 0 : w;
  }
  // ayak hızı eşlemesi: klip, ayağı karakterin gerçek hızıyla geriye itecek hızda oynar
  A.walk.timeScale = A.walk_u.timeScale = Math.min(2, Math.max(.5, vm / (G.ayak.walk * h0)));
  A.run.timeScale = A.run_u.timeScale = Math.min(G.kosUst, Math.max(.7, vm / (G.ayak.run * h0)));
  if (st == 'jump') {
    // yükselirken çömelmeden tepeye (0.45..0.8), düşerken tepeden inişe (0.8..1.15)
    const vy = P.vy || 0, t = vy > 0 ? .8 - Math.min(1, vy / 14) * .35 : .8 + Math.min(1, -vy / 14) * .35;
    A.jump.time = A.jump_u.time = t;
  }
  // takla: oyun gövdeyi döndürür (P.flip 1 → 0); büzülme ortada en sıkı (klipte 1.6 sn)
  if (st == 'flip') A.flip.time = A.flip_u.time = 1.25 + Math.sin(Math.PI * (1 - P.flip)) * .35;
  // atılma 0.22 sn: dönen hızlı adımın alçalıp döndüğü bölüm
  if (st == 'dash') A.dash.time = A.dash_u.time = .1 + (1 - Math.min(1, P.dsh / .22)) * .75;
  if (st == 'slide') {
    G.slT = Math.min(.37, G.slT + dt);
    A.slide.time = A.slide_u.time = G.slT;
  } else G.slT = 0;
  // üst gövde katmanı: saldırı, yoksa darbe
  const at = pl && P.at != null ? P.at : 1;
  let ust = null, ut = 0;
  if (at < 1) {
    ust = (P.side | 0) ? 'atkL' : 'atkR';
    const [a, b] = G.sal[ust];
    ut = a + (b - a) * at;
  } else if (pl && P.hit > 0) {
    ust = 'hit';
    ut = (1 - Math.min(1, P.hit / .45)) * .9;
  }
  G.wu += ((ust ? 1 : 0) - G.wu) * Math.min(1, dt * (ust ? 30 : 8));
  if (ust) G.ust = ust;
  for (const n of ['atkR', 'atkL', 'hit']) A[n].setEffectiveWeight(n == G.ust ? G.wu : 0);
  if (ust) A[ust].time = ut;
  for (const n of ANA) {
    A[n].setEffectiveWeight(G.w[n]);
    A[n + '_u'].setEffectiveWeight(G.w[n] * (1 - G.wu));
  }
  G.mixer.update(dt);
  asaTut(G, dt);
}

// ---- Kam'ın kolları. Klipler asayı bilmez (kol sarkar ya da sallanır, asa eliyle birlikte savrulur) ve boş elin
// avucunu açık bırakır (modelde parmak kemiği yok; öne uzanmış açık avuç dilenir gibi durur). Her karede klipten sonra:
//   sağ kol: asanın olması gereken yer ve yön gövdeye göre hesaplanır (beklerken ve yürürken sağ önde, yere basılı ve dik;
//     koşuda, havada ve atılmada yerden kalkık ve öne eğik; kayarken alçak ve geriye yatık). Elin dünya dönüşü asayı o yöne
//     getirecek ve ön kol asaya dik gelecek biçimde seçilir; üst kol ve ön kol iki kemikli ters kinematikle bileği oraya
//     götürür (dirsek aşağı ve geride). Yalnız saldırıda bırakılır: kolu büyü klibi sürer.
//   sol kol: beklerken ve büyü yaparken yanda sarkar, avuç bacağa bakar. Yürürken ve koşarken klibin kol salınımı kalır.
const _p0 = new T.Vector3(), _il = new T.Vector3(), _sg = new T.Vector3(), _up = new T.Vector3(0, 1, 0), _G = new T.Vector3(), _s = new T.Vector3(),
  _f = new T.Vector3(), _n = new T.Vector3(), _T = new T.Vector3(), _S = new T.Vector3(), _E = new T.Vector3(), _H = new T.Vector3(), _d = new T.Vector3(),
  _pl = new T.Vector3(), _v1 = new T.Vector3(), _v2 = new T.Vector3(), _sc = new T.Vector3(),
  _q0 = new T.Quaternion(), _qR = new T.Quaternion(), _qp = new T.Quaternion(), _qw = new T.Quaternion(), _qd = new T.Quaternion(),
  _a1 = new T.Quaternion(), _a2 = new T.Quaternion(), _a3 = new T.Quaternion(), _m1 = new T.Matrix4(), _m2 = new T.Matrix4();
// kemiği dünya uzayında `simdi` yönünden `hedef` yönüne çevirir
function cevir(b, simdi, hedef) {
  _qd.setFromUnitVectors(simdi.normalize(), hedef.normalize());
  b.parent.getWorldQuaternion(_qp);
  _qw.copy(_qp).multiply(b.quaternion).premultiply(_qd);
  b.quaternion.copy(_qp.invert().multiply(_qw));
  b.updateWorldMatrix(false, true);
}
// elin dünya dönüşü: elin uzayındaki (x, y) eksenleri dünyadaki (X, Y) yönlerine gelsin (ikisi de birbirine dik birim yön)
function elDonus(x, y, X, Y) {
  _m1.makeBasis(x, y, _n.crossVectors(x, y)).transpose();
  _m2.makeBasis(X, Y, _n.crossVectors(X, Y)).multiply(_m1);
  return _qR.setFromRotationMatrix(_m2);
}
function asaTut(G, dt, ani = false) {
  const a = G.asa;
  if (!a) return;
  const g = G.H.g;
  g.updateWorldMatrix(true, false);
  g.getWorldPosition(_p0);
  g.getWorldQuaternion(_q0);
  _il.set(0, 0, 1).applyQuaternion(_q0);
  _sg.set(-1, 0, 0).applyQuaternion(_q0);
  _up.set(0, 1, 0).applyQuaternion(_q0);
  sagKol(G, a, dt, ani);
  if (a.sol) solKol(G, a.sol, dt, ani);
}
function sagKol(G, a, dt, ani) {
  // darbede de asa elde kalır (darbe klibi kolu savurur, asa başın üstünde yatay döner); yalnız büyü klipleri kolu alır
  const w = G.w, hedef = G.ust == 'hit' ? 1 : 1 - G.wu;
  a.w = ani ? hedef : a.w + (hedef - a.w) * Math.min(1, dt * 14);
  if (a.w < .005) return;
  const h0 = G.h0, kos = w.run || 0, yur = w.walk || 0, hava = (w.jump || 0) + (w.flip || 0), atl = w.dash || 0, kay = w.slide || 0;
  // yürüyüş adımı: asa adımla hafifçe kalkıp öne gider, sonra yere basar
  const faz = yur > .01 ? Math.sin(G.A.walk.time / G.A.walk.getClip().duration * Math.PI * 2) : 0;
  // tutma noktası ve asanın yönü
  _G.copy(_p0).addScaledVector(_sg, h0 * ASA.yan).addScaledVector(_il, h0 * (ASA.on + kos * .06 + atl * .05 + faz * .03 * yur))
    .addScaledVector(_up, h0 * (ASA.yuk + kos * .08 + hava * .14 + atl * .08 - kay * .22 + Math.max(0, faz) * .025 * yur));
  _s.copy(_up).addScaledVector(_il, .04 + kos * .3 + hava * .12 + atl * .45 - kay * 1.1 + faz * .07 * yur).addScaledVector(_sg, .03).normalize();
  // ön kolun yönü: ileri, biraz yukarı ve içe; asaya dik bileşeni alınır
  _f.copy(_il).addScaledVector(_up, .15).addScaledVector(_sg, -.3);
  _f.addScaledVector(_s, -_f.dot(_s)).normalize();
  elDonus(a.h, a.a, _s, _f);
  // bilek hedefi: yumruğun ortası tutma noktasına gelsin
  a.kol.parent.updateWorldMatrix(true, false);
  a.kol.updateWorldMatrix(false, true);
  a.el.getWorldScale(_sc);
  _T.copy(a.c).multiplyScalar(_sc.x).applyQuaternion(_qR);
  _T.subVectors(_G, _T);
  // iki kemikli ters kinematik: omuz S, dirsek E, bilek T
  a.kol.getWorldPosition(_S);
  a.on.getWorldPosition(_E);
  a.el.getWorldPosition(_H);
  const L1 = _E.distanceTo(_S), L2 = _H.distanceTo(_E);
  _d.subVectors(_T, _S);
  const uz = Math.min(L1 + L2 - 1e-3, Math.max(Math.abs(L1 - L2) + 1e-3, _d.length()));
  _d.normalize();
  const co = Math.min(1, Math.max(-1, (L1 * L1 + uz * uz - L2 * L2) / (2 * L1 * uz))), si = Math.sqrt(1 - co * co);
  // dirsek aşağı, geride ve biraz dışta
  _pl.copy(_up).multiplyScalar(-1).addScaledVector(_il, -.55).addScaledVector(_sg, .4);
  _pl.addScaledVector(_d, -_pl.dot(_d)).normalize();
  _a1.copy(a.kol.quaternion);
  _a2.copy(a.on.quaternion);
  _a3.copy(a.el.quaternion);
  // üst kol: dirsek yeni yerine
  _v2.copy(_S).addScaledVector(_d, L1 * co).addScaledVector(_pl, L1 * si).sub(_S);
  cevir(a.kol, _v1.subVectors(_E, _S), _v2);
  // ön kol: bilek hedefe
  a.on.getWorldPosition(_E);
  a.el.getWorldPosition(_H);
  _v2.copy(_S).addScaledVector(_d, uz).sub(_E);
  cevir(a.on, _v1.subVectors(_H, _E), _v2);
  // el: dünya dönüşü doğrudan
  a.el.parent.getWorldQuaternion(_qp);
  a.el.quaternion.copy(_qp.invert().multiply(_qR));
  karistir(a);
}
// yanda sarkan sol kol: üst kol aşağı, az dışta ve geride; ön kol dirsekten hafif öne; avuç bacağa bakar
const SOL = { ky: .16, kg: .1, oi: .22, oy: .05 };
function solKol(G, s, dt, ani) {
  const w = G.w, hedef = Math.min(1, (w.idle || 0) + (w.combat || 0) + (G.ust == 'hit' ? 0 : G.wu));
  s.w = ani ? hedef : s.w + (hedef - s.w) * Math.min(1, dt * 10);
  if (s.w < .005) return;
  s.kol.parent.updateWorldMatrix(true, false);
  s.kol.updateWorldMatrix(false, true);
  _a1.copy(s.kol.quaternion);
  _a2.copy(s.on.quaternion);
  _a3.copy(s.el.quaternion);
  s.kol.getWorldPosition(_S);
  s.on.getWorldPosition(_E);
  _v2.copy(_up).multiplyScalar(-1).addScaledVector(_sg, -SOL.ky).addScaledVector(_il, -SOL.kg);
  cevir(s.kol, _v1.subVectors(_E, _S), _v2);
  s.on.getWorldPosition(_E);
  s.el.getWorldPosition(_H);
  _f.copy(_up).multiplyScalar(-1).addScaledVector(_il, SOL.oi).addScaledVector(_sg, -SOL.oy).normalize();
  cevir(s.on, _v1.subVectors(_H, _E), _v2.copy(_f));
  // el ön kolun devamı; avuç gövdeye (sağa) ve az geriye bakar
  _s.copy(_sg).addScaledVector(_il, -.25);
  _s.addScaledVector(_f, -_s.dot(_f)).normalize();
  elDonus(s.a, s.n, _f, _s);
  s.el.parent.getWorldQuaternion(_qp);
  s.el.quaternion.copy(_qp.invert().multiply(_qR));
  karistir(s);
}
// geçişte klip duruşuyla karıştır (_a1.._a3: klibin verdiği dönüşler)
function karistir(a) {
  if (a.w >= .995) return;
  a.kol.quaternion.copy(_a1.slerp(a.kol.quaternion, a.w));
  a.on.quaternion.copy(_a2.slerp(a.on.quaternion, a.w));
  a.el.quaternion.copy(_a3.slerp(a.el.quaternion, a.w));
}
