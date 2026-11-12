// engine/glbhero.js · Kara Koru
// Meshy ile üretilmiş, iskeletli kahramanlar: Alp, Kam ve Kemik. Varsayılan açık; adreste ?eski (ya da localStorage kk_meshy=0)
// kodla kurulmuş eski gövdeyi geri getirir. Kahraman seçiliyken eski gövde gizlenir, aynı boya ölçeklenmiş GLB konur.
// Meshy iskeletlerinde kemik adları ortak: yürüme, koşu, zıplama, kayma, atılma, takla ve darbe klipleri Alp'in dosyalarından
// bütün kahramanlarda oynar (KLIP); kahramana özel olan yalnız model, elindekiler ve saldırı/duruş klipleri (KAHRAMAN).
// Alp (11 Kasım 2026, ikinci model): maskeli şampiyon, 17.742 üçgen, 2K doku; kızıl sorguç kodla kurulur (sorguc) ve savrulur.
// Kam (11 Kasım 2026): 18.485 üçgen, 2K doku. Bekleme, yürüme ve koşu Alp'le aynı doğal klipler; asa sağ yumruğun deliğinden
// geçer, yere basılı ve dik durur, sağ kol her karede asaya göre bükülür (asaTut: iki kemikli ters kinematik). Saldırıda kol
// serbest kalır: asayı göğe kaldırma ve ileri itme klipleri oynar.
// Hareketler (Meshy kütüphanesi): menüde rahat bekleme, oyunda kılıç-kalkan savaş duruşu; hıza göre yürüme ile hızlı
// koşu karışımı (ayak hızı ölçülerek eşlenir); zıplama (dikey hıza göre kare), çift zıplamada takla büzülmesi (oyun
// gövdeyi kendisi döndürür), kayma (en alçak duruş), atılma (dönen hızlı adım); saldırı ve darbe yalnız üst gövdede.
// Kılıç ve kalkan da Meshy modeli; kılıç sağ ele kabzasından, kalkan sol ön kola yüzü kola dik takılır. Klipler eldekini
// bilmez: her karede klipten sonra sağ kol kılıcı ya da asayı gövdeye göre tutacak biçimde kurulur, kalkan gövdeden dışarı çevrilir
// (asaTut: sagKol, kalkanTut); gövdeye girip girmediği tools/giris-olc.mjs ile ölçülür.
// Şapka baş kemiğine taşınır; kostüm dokunun piksellerine uygulanır.
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as T from 'three';
import { $G } from '../core/store.js';
import { CR, SKINF } from '../game/heroes.js';
import { HALO, RIMU } from './renderer.js';

const U = n => new URL(`../assets/model/${n}.glb`, import.meta.url).href;
// ortak klip dosyaları (bütün kahramanlar)
const KLIP = { yuru: U('alp_yuru'), hareket: U('alp_hareket'), hareket2: U('alp_hareket2') };
// kahramana özel dosyalar: model, elindekiler (es), kendi klipleri (klip)
const URLS = {
  alp: { model: U('alp'), es: { kilic: U('alp_kilic'), kalkan: U('alp_kalkan') } },
  kam: { model: U('kam'), es: { asa: U('kam_asa') }, klip: U('kam_buyu') },
  // kostum: ayrı modelli kostümler (iskelet ortak; klipler ve kod kahramanınki). Seçilince iner
  kemik: { model: U('kemik'), klip: U('kemik_at'), kostum: { ayaz: U('kemik_ayaz'), erlik: U('kemik_erlik'), akinci: U('kemik_akinci'), saman: U('kemik_saman') } }
};
// modelin anahtarı ve adresi: kostümün kendi modeli varsa o
const mAd = (k, sk) => (sk && URLS[k].kostum && URLS[k].kostum[sk] ? k + ':' + sk : k);
const mUrl = mk => { const [k, sk] = mk.split(':'); return sk ? URLS[k].kostum[sk] : URLS[k].model; };
// kahraman ayarı. sal: saldırı kliplerinin oyunun 0.42 sn'lik saldırı ilerlemesine eşlenen aralığı (sn).
// ayak, kosUst: kahramanın kendi koşu klibi varsa onun ayak hızı ve hızlanma üst sınırı (yoksa ortak AYAK, KOS_UST).
// sapkaUc: şapka başın uç eklemine oturur (başlığın köşe ortalaması yana kayıyor).
// boy: eski gövdeye göre eşlenen boyun çarpanı (Kemik'in eski gövdesi kısa ve 0,95 ölçekliydi: yeni model Alp ve Kam'ın
// yanında %80 boyda kalıyordu; baş eklemi 1,73'e karşı 2,14 ve 2,16. 1,2 ile 2,08)
// basOlcu: boy eski gövdenin kutusuna göre değil baş eklemine göre eşlenir (eski gövdede baştan uzun asa ya da boynuz varsa).
const KAHRAMAN = {
  alp: { sal: { atkR: [.12, .95], atkL: [.3, 1.2] }, ayak: { walk: .5, run: 3.7 } },
  kam: { sal: { atkR: [.3, 1.3], atkL: [.75, 1.65] }, basOlcu: 1, ayak: { walk: .7, run: 1.65 }, kosUst: 1.65 },
  kemik: { sal: { atkR: [1.1, 1.9], atkL: [3.1, 3.85] }, sapkaUc: 1, ayak: { walk: .52, run: 3.7 }, boy: 1.2 }
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
    buf[k] = fetch(mUrl(k))
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
      if (k == 'kemik') {
        // elinde bir şey yok: oyundaki duruş doğal bekleme (kılıç-kalkan gardı boş elle yumruk dövüşü gibi duruyordu); saldırılar
        // Kemik'in kendi klipleri: omuz üstünden fırlatma ve yukarıdan aşağı savurma
        const by = n => kg.animations.find(a => a.name == n);
        C = { ...C0, combat: C0.idle, ...kok({ atkR: by('Firlat'), atkL: by('Vur') }) };
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

// gövde çerçevesi için kemikler (cerceve): göğüs, kalça, boyun, iki omuz başı
const govdeK = bone => ({ s: bone('Spine02'), h: bone('Hips'), n: bone('neck') || bone('Head'), l: bone('LeftArm'), r: bone('RightArm'), lu: bone('LeftUpLeg'), ru: bone('RightUpLeg') });

// sorguç: miğferin tepesinden arkaya dökülen kızıl at kılı. Meshy ince kılı modele çıkarmıyor; kodla kurulur ve baş kemiğine
// bağlanır. Ortada kalın bir tutam, çevresinde ince teller; her biri eğri boyunca kalınlaşıp incelen bir boru; köşe renkli.
// Birim kahramanın boyu (tak ile h0'a ölçeklenir): +Y yukarı, -Z arkaya. İçteki grup (ic) koşuda ve havada savrulur (glbTick).
export const SORGUC = { boy: 1, kal: 1, yuk: -.012 };
function sorguc(sk) {
  const pos = [], col = [], idx = [], f = SKINF[sk], c0 = [.78, .09, .09], c1 = [.42, .03, .05], sag = new T.Vector3(1, 0, 0),
    p = new T.Vector3(), tg = new T.Vector3(), nr = new T.Vector3(), c = new T.Color();
  const tutam = (N, kal, n = 12, m = 7) => {
    const eg = new T.CatmullRomCurve3(N.map(a => new T.Vector3(a[0], a[1], a[2]).multiplyScalar(SORGUC.boy))), t0 = pos.length / 3;
    for (let i = 0; i <= n; i++) {
      const t = i / n, r = kal * SORGUC.kal * (Math.sin(Math.PI * Math.pow(t, .6)) * .9 + .12 * (1 - t));
      eg.getPoint(t, p);
      eg.getTangent(t, tg);
      nr.crossVectors(tg, sag).normalize();
      for (let j = 0; j < m; j++) {
        const a = j / m * Math.PI * 2, ca = Math.cos(a) * r * .8, sa = Math.sin(a) * r, k = j % 2 ? 1 : .7;
        pos.push(p.x + sag.x * ca + nr.x * sa, p.y + nr.y * sa, p.z + nr.z * sa);
        let rgb = [0, 1, 2].map(q => (c0[q] + (c1[q] - c0[q]) * t) * k);
        if (f) rgb = f(rgb[0], rgb[1], rgb[2]).map(v => Math.min(1, v));
        c.setRGB(rgb[0], rgb[1], rgb[2], T.SRGBColorSpace);
        col.push(c.r, c.g, c.b);
      }
    }
    for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) {
      const a = t0 + i * m + j, b = t0 + i * m + (j + 1) % m, d = a + m, e = b + m;
      idx.push(a, d, b, b, d, e);
    }
  };
  // ana tutam ve çevresinde uçlara doğru açılan ince teller: tek bir püskül gibi okunur, ucu saçaklıdır
  const ANA = [[0, 0, 0], [0, .035, -.004], [0, .06, -.03], [0, .055, -.075], [0, .02, -.115], [0, -.04, -.14], [0, -.11, -.155], [0, -.17, -.16]];
  tutam(ANA, .03);
  [[-.022, .012, 1.08, .9], [.022, .008, 1.1, .82], [-.011, -.014, .9, 1.06], [.012, -.018, .86, 1], [0, .02, 1.16, .74]].forEach(([x, dy, kz, boy]) =>
    tutam(ANA.map((q, i) => { const t = i / (ANA.length - 1); return [x * t * (2 - t), q[1] * boy + dy * t, q[2] * kz]; }), .017, 10, 5));
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new T.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  const mt = new T.MeshStandardMaterial({ vertexColors: true, side: T.DoubleSide }), o = new T.Mesh(g, mt), ic = new T.Group(), dis = new T.Group();
  malzeme(o, '');
  mt.emissive.setRGB(.1, .012, .012);
  ic.add(o);
  dis.add(ic);
  dis.userData.ic = ic;
  return dis;
}

// ---- Alp: kılıç sağ yumrukta, kalkan sol ön kolda
function takAlp({ O, root, bone, wp, ileri, sol, yuk, gq, h0, sk, sapka, gp }) {
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
    const kn = kap(O.kilic, pv, hk, sk), el = bone('RightHand');
    tak(kn, el, orta, yon, h0 * KILIC.boy, undefined, 0, yuk.clone().multiplyScalar(KILIC.kenar));
    // ters kinematik için elin kendi uzayında: ağzın yönü (h), yumruk ortası (c), kolun ekseni (a; h'ye dikleştirilir). Bkz. sagKol
    el.updateWorldMatrix(true, false);
    const qe = el.getWorldQuaternion(new T.Quaternion()).invert(),
      h = new T.Vector3(0, 1, 0).applyQuaternion(kn.quaternion).normalize(),
      a = wp('RightHand').sub(wp('RightForeArm')).normalize().applyQuaternion(qe);
    a.addScaledVector(h, -a.dot(h)).normalize();
    el.userData.asa = { tur: 'kilic', el, kol: bone('RightArm'), on: bone('RightForeArm'), h, a, c: kn.position.clone(), w: 1, gy: (wp('Spine02').y - gp.y) / h0, gv: govdeK(bone) };
  }
  // kalkan: model yüzü +Z. Kayışla ön kolun dış yüzüne (elin sırtına) bağlanır: A duruşunda avuç aşağı bakar, el
  // sırtı yukarı; kalkanın yüzü o yöne, ön kola dik. Kol hangi duruşta dönerse kalkan elin sırtıyla birlikte döner.
  // Merkezi bileğin biraz gerisinde, kolun dışına itilmiş; eldiven arkada kalsın diye sol el biraz küçültülür
  {
    const bt = kutu(O.kalkan), cap = Math.max(bt.max.x - bt.min.x, bt.max.y - bt.min.y),
      a = wp('LeftForeArm'), b = wp('LeftHand'), eks = b.clone().sub(a).normalize(),
      n = new T.Vector3(0, 1, 0).applyQuaternion(gq).multiplyScalar(KALKAN_YON).addScaledVector(ileri, .25);
    n.addScaledVector(eks, -n.dot(eks)).normalize();
    const merkez = a.clone().lerp(b, KALKAN.yer).addScaledVector(n, h0 * KALKAN.on);
    const kk = kap(O.kalkan, bt.getCenter(new T.Vector3()), cap, sk), ok = bone('LeftForeArm');
    tak(kk, ok, merkez, n, h0 * .3, new T.Vector3(0, 0, 1));
    bone('LeftHand').scale.setScalar(.7);
    // kalkanın yüzü her karede gövdeden dışarı çevrilir (kalkanTut): ön kolun uzayında dinlenme yönü saklanır
    ok.updateWorldMatrix(true, false);
    bone('RightHand').userData.kalkan = { nes: kk, on: ok, el: bone('LeftHand'), n0: n.clone().applyQuaternion(ok.getWorldQuaternion(new T.Quaternion()).invert()), kal: bone('Hips'), bas: bone('Head'), aci: 0 };
  }
  // sorguç: miğferin sivri ucuna (dinlenme duruşunda modelin en üst noktası). Şapka takılıysa konmaz (şapka aynı yere oturur)
  if (!sapka) {
    const ust = new T.Box3().setFromObject(root).max.y, uc = tepeOrta(root, ust - h0 * .012) || new T.Vector3(wp('Head').x, ust, wp('Head').z),
      s = sorguc(sk);
    tak(s, bone('Head'), uc.addScaledVector(yuk, h0 * SORGUC.yuk), yuk, h0, undefined, 0, sol);
    bone('RightHand').userData.sorguc = s.userData.ic;
  }
}

// asa ayarı (kahraman boyunun oranları; denetim aracından değiştirilebilir): boy asanın uzunluğu, tut tutma noktasının asanın
// altından oranı. Asanın duruşu kolun duruşuyla verilir (KA)
export const ASA = { boy: 1.15, tut: .47 };
// denetim: test derlemesinde adresle denenir (?asayan=.34&asayuk=.6)

// ---- Kemik: elinde bir şey yok (kemikleri fırlatır). Göğüs kafesinin içinde ve göz çukurlarında kor ışığı, başın çevresinde
// yükselen alev dilleri: toplamalı ışıma, göğüs ve baş kemiklerine bağlı (dokudaki turuncu boya gölgede sönük kalıyor). Alev
// dilleri her karede dünya uzayında yukarı yükselir (alevTick); arkadan başlığın üstünden, önden yüzün çevresinden görünür.
export const ALEV = { n: 18, cap: .086, yuk: .1, boy: .17, en: .085, taban: -.045, hiz: 1.1, op: .95 };
// alev dili dokusu: altı yuvarlak, ucu sivri damla; kenara doğru saydamlaşır (beyaz: rengi malzeme verir)
// ayrı modelli kostümlerde alev ve kor rengi: [ışıma, alev gövdesi, alev ucu, öz]
const ALEVR = {
  ayaz: [[.35, .75, 1], [.45, .8, 1], [.1, .3, .9], [.85, .97, 1]],
  erlik: [[.7, .3, 1], [.75, .4, 1], [.35, .05, .7], [.95, .8, 1]],
  akinci: [[.5, 1, .3], [.55, .95, .3], [.1, .5, .1], [.9, 1, .6]],
  saman: [[.2, .9, .8], [.25, .9, .8], [.05, .45, .55], [.8, 1, .95]]
};
// kostüme özel alev yerleşimi (ALEV'in üstüne): Ölü Akıncı'da alev miğferin sivri ucundan çıkar (başlık yok, halka çıplak kafatasını sarardı)
const ALEVK = { akinci: { cap: .03, taban: .035 } };
let alevDoku = null;
function alevD() {
  if (alevDoku) return alevDoku;
  const W = 48, H = 96, cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const cx = /** @type {CanvasRenderingContext2D} */ (cv.getContext('2d')), d = cx.createImageData(W, H);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const y = 1 - (j + .5) / H, x = Math.abs((i + .5) / W * 2 - 1),
      w = Math.pow(1 - y, .75) * Math.min(1, Math.sqrt(y / .2)) * .92, q = w > 0 ? x / w : 9, a = q >= 1 ? 0 : Math.pow(1 - q * q, 1.4) * Math.min(1, (1 - y) * 3), k = (j * W + i) * 4;
    d.data[k] = d.data[k + 1] = d.data[k + 2] = 255;
    d.data[k + 3] = a * 255;
  }
  cx.putImageData(d, 0, 0);
  alevDoku = new T.CanvasTexture(cv);
  alevDoku.colorSpace = T.SRGBColorSpace;
  return alevDoku;
}
function takKemik({ bone, wp, ileri, h0, sk }) {
  const f = SKINF[sk], kr = ALEVR[sk], renk = (r, g, b, i = 0) => {
    const x = kr ? kr[i] : f ? f(r, g, b) : [r, g, b];
    return new T.Color().setRGB(Math.min(1, x[0]), Math.min(1, x[1]), Math.min(1, x[2]), T.SRGBColorSpace);
  };
  const c = renk(1, .5, .14);
  const isik = (kemik, yer, boy, op, renk = c) => {
    const o = new T.Sprite(new T.SpriteMaterial({ map: HALO, color: renk, transparent: true, opacity: op, blending: T.AdditiveBlending, depthWrite: false, fog: true }));
    kemik.updateWorldMatrix(true, false);
    o.position.copy(kemik.worldToLocal(yer.clone()));
    o.scale.setScalar(boy / kemik.getWorldScale(new T.Vector3()).x);
    kemik.add(o);
    return o;
  };
  // Meshy iskeletinde omurga aşağıdan yukarı Spine02, Spine01, Spine: göğüs kafesinin ortası son ikisinin arasında
  const g = bone('Spine'), bas = bone('Head');
  // göğüs: kaburgaların önünde küçük parlak çekirdek, içinde geniş hale
  if (g && bone('Spine01')) {
    const orta = wp('Spine01').lerp(wp('Spine'), .55);
    isik(g, orta.clone().addScaledVector(ileri, h0 * .085), h0 * .15, .9, renk(1, .62, .2, 1));
    isik(g, orta.addScaledVector(ileri, h0 * .03), h0 * .36, .6);
  }
  if (!bas) return;
  const merkez = wp('Head').add(new T.Vector3(0, h0 * .055, 0));
  isik(bas, merkez.clone().addScaledVector(ileri, h0 * .075), h0 * .17, .9);
  // alev dilleri: başlığın çevresinde halka; sırayla doğar, yükselirken içe kapanıp incelir. Dıştaki turuncu gövde düz karışım
  // (açık zeminde de turuncu kalır), içteki sarı öz toplamalı
  const ks = bas.getWorldScale(new T.Vector3()).x, diller = [], c0 = renk(1, .62, .1, 1), c1 = renk(.9, .14, .02, 2), oz = renk(1, .85, .35, 3);
  for (let i = 0; i < ALEV.n; i++) {
    const ic = i % 4 == 3,
      o = new T.Sprite(new T.SpriteMaterial({ map: alevD(), color: (ic ? oz : c0).clone(), transparent: true, opacity: 0, blending: ic ? T.AdditiveBlending : T.NormalBlending, depthWrite: false, fog: true }));
    o.center.set(.5, .08);
    bas.add(o);
    diller.push({ o, ic, a: i / ALEV.n * Math.PI * 2 + (i % 2) * .5, f: (i * .618) % 1, r: ic ? .55 : .85 + ((i * 7) % 5) * .06 });
  }
  bone('RightHand').userData.alev = { bas, diller, m: bas.worldToLocal(merkez.clone().addScaledVector(ileri, h0 * .02)), h: h0 / ks, c0, c1, t: 0, ek: ALEVK[sk] || {} };
}
const _aq = new T.Quaternion(), _au = new T.Vector3(), _ax = new T.Vector3(), _az = new T.Vector3();
function alevTick(A, dt) {
  A.t += dt;
  // dünya yukarısı ve yatay eksenler başın kendi uzayında: baş eğilse de alev dik yükselir
  A.bas.getWorldQuaternion(_aq).invert();
  _au.set(0, 1, 0).applyQuaternion(_aq);
  _ax.set(1, 0, 0).applyQuaternion(_aq);
  _az.set(0, 0, 1).applyQuaternion(_aq);
  const h = A.h, cap = A.ek.cap ?? ALEV.cap, taban = A.ek.taban ?? ALEV.taban;
  for (const d of A.diller) {
    const u = (A.t * ALEV.hiz * (.8 + d.r * .3) + d.f) % 1, r = cap * h * d.r * (1 - u * .5),
      sal = Math.sin(A.t * 9 + d.a * 3) * .014 * h * u, k = Math.sin(Math.PI * Math.pow(u, .6)), b = d.ic ? .7 : 1;
    d.o.position.copy(A.m).addScaledVector(_ax, Math.cos(d.a) * r + sal).addScaledVector(_az, Math.sin(d.a) * r).addScaledVector(_au, (taban + u * ALEV.yuk) * h);
    d.o.scale.set(ALEV.en * h * b * (1 - u * .45), ALEV.boy * h * b * (.55 + k * .6), 1);
    d.o.material.opacity = ALEV.op * k;
    if (!d.ic) d.o.material.color.copy(A.c0).lerp(A.c1, u * u);
  }
}

// ---- Kam: asa sağ yumrukta, yumruğun deliğinden geçer (delik dinlenme duruşunda öne bakar, başparmak önde: Alp'in kılıcı gibi).
// Asa el kemiğine bağlıdır; beklerken ve yürürken eli asanın olması gereken yere asaTut götürür. Ucundaki kor taşına ışıma eklenir.
function takKam({ O, root, bone, wp, ileri, h0, sk, gp }) {
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
  el.userData.asa = { tur: 'asa', el, kol: bone('RightArm'), on: bone('RightForeArm'), h, a, n: new T.Vector3().crossVectors(h, a), c: nes.position.clone(), w: 1, gy: (wp('Spine02').y - gp.y) / h0, gv: govdeK(bone) };
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
export const KALKAN = { on: .09, ileri: .35, yer: 1 };
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
  // şapka ölçüye girmez: başından uzun bir şapka kutuyu büyütür, model de onunla birlikte büyürdü (Kemik'te %8)
  const sp0 = hedef.hat, spA = sp0 && sp0.parent;
  if (spA) spA.remove(sp0);
  const b0 = new T.Box3().setFromObject(hedef.g);
  if (spA) spA.add(sp0);
  let h0 = Math.max(1, b0.max.y - b0.min.y);
  // baş ekleminin yerden yüksekliği (eski gövdede asa ya da boynuz kutuyu büyütüyorsa boy buna göre eşlenir)
  const bas0 = hedef.b && hedef.b.hd ? hedef.b.hd.getWorldPosition(new T.Vector3()).y - b0.min.y : 0;
  // ölçüm anındaki gövde yüksekliği: model yüklenene kadar gövde yerine taşınmış olur, şapkanın yeri buna göre düzeltilir
  const gy0 = hedef.g.getWorldPosition(new T.Vector3()).y;
  const eskiler = hedef.g.children.slice(), gizle = () => { for (const c of eskiler) c.visible = false; };
  const mk = mAd(key, sk);
  if (hazir[mk]) gizle();
  // eski gövdenin gözleri ayrı çizilir (engine/eyes.js, eski kemikten): yeni yüzün önünde havada kalmasın
  const gozler = hedef.eyes;
  hedef.eyes = null;
  Promise.all([modelBuf(mk).then(b => LD.parseAsync(b, '')), ortak(key)]).then(([m, O]) => {
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
    if (ay.boy) s *= ay.boy, h0 *= ay.boy;
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
    const ctx = { O, root, bone, wp, ileri, sol, yuk, gq, h0, sk, sapka: !!hedef.hat, gp: hedef.g.getWorldPosition(new T.Vector3()) };
    if (key == 'alp') takAlp(ctx);
    else if (key == 'kam') takKam(ctx);
    else if (key == 'kemik') takKemik(ctx);
    // şapka: eski gövdenin baş kemiğinden yenisinin başına, miğferin tepesine
    if (hedef.hat) {
      const taban = hedef.g.getWorldPosition(new T.Vector3()).y - gy0 + b0.min.y,
        ucK = (ay.basOlcu || ay.sapkaUc) && bone('head_end') ? wp('head_end') : null,
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
    { const el = bone('RightHand'); if (el && el.userData.sorguc) /** @type {any} */ (G).sorguc = el.userData.sorguc; }
    { const el = bone('RightHand'); if (el && el.userData.kalkan) /** @type {any} */ (G).kalkan = el.userData.kalkan; }
    { const el = bone('RightHand'); if (el && el.userData.alev) /** @type {any} */ (G).alev = el.userData.alev; }
    // denetim araçları için (tools/meshy-el.mjs): duruşu dondurup tek klip anı göstermek. Yayın derlemesinde pencereye açılmaz
    if (__KOPRU__) /** @type {any} */ (window).__glb = G, /** @type {any} */ (window).__T = T; // __T: denetim araçları three sınıflarına erişsin (tools/giris-olc.mjs)
    /** @type {any} */ (G).tick = glbTick;
    /** @type {any} */ (G).asaTut = () => asaTut(G, 0, true); // denetim aracı dondurulmuş duruşta da uygulayabilsin
    /** @type {any} */ (G).tut = () => asaTut(G, 0, true);
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
    if (k) a.push(...indir(k, ($G.META && $G.META.skin && $G.META.skin['cur' + localStorage.getItem('kk_ci')]) || ''));
  } catch (e) {}
  return a;
}
// kayıttaki kahraman sırası (kk_ci) → anahtar; sıra kalıcıdır (game/heroes.js CR)
const ACILIS = { 1: 'kam', 8: 'kemik' };
// dosyaları inmiş kahramanlar
const hazir = {};
function indir(k, sk = '') {
  const mk = mAd(k, sk), a = [modelBuf(mk), ortak(k)];
  Promise.all(a).then(() => (hazir[mk] = 1), () => {});
  return a;
}
// kahraman sayfası açılınca: açılışta inmeyen kahramanların dosyaları arkada iner, seçilince model hemen gelir
export function glbHazirla() {
  if (!meshyOn()) return;
  for (const k of Object.keys(URLS)) if (!hazir[k]) indir(k);
  // seçili kostümün modeli de
  const k = CR[$G.CI] && CR[$G.CI].k, sk = ($G.META && $G.META.skin && $G.META.skin['cur' + $G.CI]) || '';
  if (URLS[k] && !hazir[mAd(k, sk)]) indir(k, sk);
}

const ANA = ['idle', 'combat', 'walk', 'run', 'jump', 'flip', 'slide', 'dash'];
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export function glbTick(dt) {
  if (!G) return;
  if ($G.H !== G.H) return void (G = null);
  if (/** @type {any} */ (G).alev) alevTick(/** @type {any} */ (G).alev, dt);
  if (G.dondur) return;
  const P = $G.P || {},
    pl = $G.S == 'play',
    vm = pl ? Math.hypot(P.vx || 0, P.vz || 0) : 0,
    A = G.A,
    h0 = G.h0;
  // sorguç: koşuda ve düşerken rüzgârla kalkar, yükselirken yatışır; dururken hafifçe salınır
  if (/** @type {any} */ (G).sorguc) {
    const sg = /** @type {any} */ (G).sorguc, T0 = $G.T || 0, vy = pl && P.air ? P.vy || 0 : 0,
      aci = Math.min(.5, vm * .045) + Math.max(-.15, Math.min(.4, -vy * .025)) + Math.sin(T0 * 2.1) * .04 + Math.sin(T0 * 7.3) * .02 * Math.min(1, vm / 6);
    sg.rotation.x += (aci - sg.rotation.x) * Math.min(1, dt * 7);
    sg.rotation.z = Math.sin(T0 * 1.6) * .05;
  }
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

// ---- eldekini tutan kol. Klipler asayı ve kılıcı bilmez (kol sarkar ya da sallanır, eldeki eliyle birlikte savrulur) ve boş elin
// avucunu açık bırakır (modelde parmak kemiği yok; öne uzanmış açık avuç dilenir gibi durur). Her karede klipten sonra:
//   sağ kol: kolun duruşu duruma göre tablodan gelir (KA asa, KT kılıç: üst kol, ön kol ve eldekinin yönü, gövdenin o anki yönüne
//     göre). Üst kol ve ön kol iki kemikli ters kinematikle o duruşa getirilir, el eldekini istenen yöne çevirir; bilek doğal
//     açıda tutulur (BILEK). Yalnız saldırıda bırakılır: kolu saldırı klibi sürer.
//   sol kol (Kam): beklerken ve büyü yaparken yanda sarkar, avuç bacağa bakar. Yürürken ve koşarken klibin kol salınımı kalır.
const _p0 = new T.Vector3(), _il = new T.Vector3(), _sg = new T.Vector3(), _up = new T.Vector3(0, 1, 0), _s = new T.Vector3(),
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
  if (!a && !G.kalkan) return;
  const g = G.H.g;
  g.updateWorldMatrix(true, false);
  g.getWorldPosition(_p0);
  g.getWorldQuaternion(_q0);
  _il.set(0, 0, 1).applyQuaternion(_q0);
  _sg.set(-1, 0, 0).applyQuaternion(_q0);
  _up.set(0, 1, 0).applyQuaternion(_q0);
  if (a) sagKol(G, a, dt, ani);
  if (a && a.sol) solKol(G, a.sol, dt, ani);
  if (G.kalkan) kalkanTut(G, G.kalkan, dt, ani);
}
// tutuş çerçevesi: eldeki nesnenin yeri ve yönü gövdeye göre verilir. Klipler gövdeyi kahramanın yönünden bağımsız döndürür
// (beklerken yan durur, atılırken döner, kayarken yatar): nesne kahramanın sabit çerçevesinde kalsaydı gövdenin içinden geçerdi.
//   taban (wT = 0): gövdenin baktığı yön yatayda (omuz ve kalça çizgilerinin toplamı: yürürken ikisi ters döner, toplamı sabit
//     kalır), yukarı dünya yukarısı (asa dik durur), çıpa göğüs ile kalçanın ortasının hizasında, kahramanın göğüs yüksekliğinde;
//   tam (wT = 1): gövdenin o anki üç boyutlu çerçevesi (omuzlar ve omurga), çıpa göğüs kemiği. Atılma, kayma, takla.
const _cA = new T.Vector3(), _ci = new T.Vector3(), _cs = new T.Vector3(), _cu = new T.Vector3(), _c1 = new T.Vector3(), _c2 = new T.Vector3();
function cerceve(G, a, wT) {
  const B = a.gv;
  B.s.getWorldPosition(_c1);
  B.h.getWorldPosition(_c2);
  _cu.copy(_up);
  _cA.copy(_c1).add(_c2).multiplyScalar(.5);
  _cA.addScaledVector(_cu, _p0.dot(_cu) + G.h0 * a.gy - _cA.dot(_cu));
  _cs.subVectors(B.r.getWorldPosition(_v1), B.l.getWorldPosition(_v2)).normalize();
  _v1.subVectors(B.ru.getWorldPosition(_v1), B.lu.getWorldPosition(_v2)).normalize();
  _cs.add(_v1);
  _cs.addScaledVector(_cu, -_cs.dot(_cu));
  if (_cs.lengthSq() < 1e-4) _cs.copy(_sg);
  _cs.normalize();
  _ci.crossVectors(_cu, _cs).normalize();
  if (wT < .002) return;
  _cA.lerp(_c1, wT);
  _v1.subVectors(B.r.getWorldPosition(_v1), B.l.getWorldPosition(_v2)).normalize();
  _v2.subVectors(B.n.getWorldPosition(_v2), _c2).normalize();
  _d.crossVectors(_v2, _v1).normalize(); // ileri = yukarı × sağ
  _ci.lerp(_d, wT).normalize();
  _cs.lerp(_v1, wT);
  _cs.addScaledVector(_ci, -_cs.dot(_ci)).normalize();
  _cu.crossVectors(_cs, _ci).normalize();
}
// Kam'ın asası: duruma göre kolun duruşu (KA; satırlar KT gibi: üst kol, ön kol, asanın yönü; [sağa, ileri, yukarı]). İlk sürümde
// tutma noktası veriliyordu: kol dirseği bükülmeden dümdüz yana uzanıyor, yumruk asaya dik açıyla oturuyordu. Şimdi üst kol gövdenin
// yanında, dirsek bükük, ön kol ileride; asa dik ve hafif dışa yatık (tepesi boynuzlardan uzak). Koşuda öne eğik, havada kalkık,
// atılırken ve kayarken mızrak gibi ileri (dirsek dışta ve yukarıda: ön kol asaya dik kalır).
export const KA = {
  idle: [.3, .2, -.93, .45, .85, .22, .17, .04, 1], combat: [.3, .2, -.93, .45, .85, .22, .17, .04, 1],
  walk: [.3, .15, -.94, .45, .85, .2, .17, .06, 1], run: [.35, -.15, -.92, .35, .9, .3, .17, .35, 1],
  jump: [.55, .05, -.78, .5, .7, .5, .05, .2, 1], flip: [.55, .05, -.78, .5, .7, .5, .05, .2, 1],
  slide: [.9, -.05, -.35, -.15, .2, -.9, -.1, 1, .5], dash: [.9, -.05, -.35, -.15, .2, -.9, -.2, .9, .5]
};
// Alp'in kılıcı: duruma göre kolun duruşu (KT). Her satır gövdeye göre üç yön, [sağa, ileri, yukarı]: üst kol (omuzdan dirseğe),
// ön kol (dirsekten bileğe), ağız. Tutma noktası değil kolun kendisi verilir: dirsek hep bükük ve gövdenin yanında, bilek doğal kalır.
// Beklerken ve yürürken kol sarkık, ağız ileri (alçak taşıma); savaşta ön kol ileri, ağız ileri-yukarı (orta gard); koşuda ağız
// yukarı; havada baş üstünde vuruşa hazır; atılmada ve kayarken dışa açık. Ağız hep gövdeden dışarı bakar: bacaktan, gövdeden geçmez.
export const KT = {
  idle: [.46, -.02, -.9, .22, .4, -.9, .42, .88, -.1], combat: [.3, -.15, -.9, -.15, .95, .1, .05, .5, .85],
  walk: [.52, -.1, -.86, .3, .5, -.82, .45, .82, .15], run: [.3, -.35, -.85, .05, .9, .25, .3, .25, .92],
  jump: [.55, .1, -.5, .25, .45, .85, .1, -.5, .8], flip: [.5, -.2, -.6, .1, .8, .4, .6, 0, .8],
  slide: [.4, -.3, -.7, .2, .85, .2, .45, .15, .88], dash: [.35, -.45, -.7, .25, .9, .1, .8, .2, .55]
};
// bilek: ön kol ile ağız arasındaki açı bu aralıkta tutulur (90° düz çekiç tutuşu; ağız ön kolun devamı gibi durursa yumruk
// bilekten kırık görünür). Kosinüs olarak: 62°..112°
const BILEK = { kilic: [-.37, .47], asa: [-.47, .47] }, KOL = { kilic: KT, asa: KA };
const _kt = [0, 0, 0, 0, 0, 0, 0, 0, 0], _ku = new T.Vector3();
function kolHedef(G, a) {
  const w = G.w, TB = KOL[a.tur], BL = BILEK[a.tur];
  let t = 0;
  _kt.fill(0);
  for (const k of ANA) {
    const x = w[k] || 0;
    if (!x) continue;
    t += x;
    for (let i = 0; i < 9; i++) _kt[i] += TB[k][i] * x;
  }
  if (t < 1e-4) for (let i = 0; i < 9; i++) _kt[i] = TB.idle[i];
  cerceve(G, a, Math.min(1, (w.dash || 0) + (w.slide || 0) + (w.flip || 0) + (w.jump || 0) * .5));
  // yürüyüşte ve koşuda ön kol adımla hafifçe salınır
  const yur = w.walk || 0, kos = w.run || 0, kl = yur >= kos ? G.A.walk : G.A.run,
    faz = yur + kos > .01 ? Math.sin(kl.time / kl.getClip().duration * Math.PI * 2) * (yur + kos) : 0;
  const yon = (v, i, ek) => v.set(0, 0, 0).addScaledVector(_cs, _kt[i]).addScaledVector(_ci, _kt[i + 1] + ek).addScaledVector(_cu, _kt[i + 2]).normalize();
  yon(_ku, 0, 0);
  yon(_f, 3, faz * .1);
  yon(_s, 6, a.tur == 'asa' ? faz * .07 * yur : 0); // asa yürüyüşte adımla öne gidip gelir
  // bilek sınırı: ağız, ön kol ile ağzın düzleminde izin verilen açıya çekilir
  const c = _f.dot(_s), cs = Math.min(BL[1], Math.max(BL[0], c));
  if (cs != c) {
    _v1.copy(_s).addScaledVector(_f, -c);
    if (_v1.lengthSq() < 1e-6) _v1.copy(_cu).addScaledVector(_f, -_cu.dot(_f));
    _s.copy(_v1.normalize()).multiplyScalar(Math.sqrt(1 - cs * cs)).addScaledVector(_f, cs);
  }
  if (__KOPRU__) a.bilek = Math.acos(_f.dot(_s)) * 180 / Math.PI; // denetim: bileğin açısı (derece)
}
function sagKol(G, a, dt, ani) {
  // darbede de eldeki kalır (darbe klibi kolu savurur, asa başın üstünde yatay döner); yalnız saldırı klipleri kolu alır
  const hedef = G.ust == 'hit' ? 1 : 1 - G.wu;
  a.w = ani ? hedef : a.w + (hedef - a.w) * Math.min(1, dt * 14);
  if (a.w < .005) return;
  a.kol.parent.updateWorldMatrix(true, false);
  a.kol.updateWorldMatrix(false, true);
  kolHedef(G, a);
  // iki kemikli ters kinematik: omuz S, dirsek E, bilek T
  a.kol.getWorldPosition(_S);
  a.on.getWorldPosition(_E);
  a.el.getWorldPosition(_H);
  a.el.getWorldScale(_sc);
  const L1 = _E.distanceTo(_S), L2 = _H.distanceTo(_E);
  let uz = 0, co = 1, si = 0;
  // kolun yönleri verilmiştir (_ku üst kol, _f ön kol): bilek omuzdan o yönlerle bulunur, el eldekini _s'ye çevirir
  _T.copy(_S).addScaledVector(_ku, L1).addScaledVector(_f, L2);
  _d.subVectors(_T, _S);
  uz = Math.min(L1 + L2 - 1e-3, Math.max(Math.abs(L1 - L2) + 1e-3, _d.length()));
  _d.normalize();
  co = Math.min(1, Math.max(-1, (L1 * L1 + uz * uz - L2 * L2) / (2 * L1 * uz)));
  si = Math.sqrt(1 - co * co);
  _pl.copy(_ku).addScaledVector(_d, -_ku.dot(_d));
  if (_pl.lengthSq() < 1e-6) _pl.copy(_cu).multiplyScalar(-1).addScaledVector(_d, _cu.dot(_d));
  _pl.normalize();
  _f.addScaledVector(_s, -_f.dot(_s)).normalize();
  elDonus(a.h, a.a, _s, _f);
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
// Alp'in kalkanı ön kola bağlıdır; kolu klip sürer. Klipler kalkanı bilmez: el nasıl dönerse kalkan da öyle döner, yüzü bacağa ya da
// göğse bakınca kenarı gövdenin içinden geçer. Her karede kalkan ön kolun ekseni çevresinde döndürülür: yüzü gövdenin ekseninden
// (kalça-baş doğrusu) dışarı, biraz da ileri bakar; merkezi ön kolun o yüzünde, koldan KALKAN.on kadar açıkta durur.
const _kn = new T.Vector3(), _ke = new T.Vector3(), _kr = new T.Vector3(), _km = new T.Vector3(), _kc = new T.Vector3(), _ky = new T.Vector3(), _kq = new T.Quaternion();
function kalkanTut(G, k, dt, ani) {
  const h0 = G.h0;
  k.on.updateWorldMatrix(true, false);
  k.on.getWorldPosition(_v1);
  k.el.getWorldPosition(_v2);
  _ke.subVectors(_v2, _v1).normalize();
  _km.copy(_v1).lerp(_v2, KALKAN.yer);
  k.on.getWorldQuaternion(_kq);
  _kr.copy(k.n0).applyQuaternion(_kq);
  _kr.addScaledVector(_ke, -_kr.dot(_ke)).normalize();
  // gövde ekseninde kalkana en yakın nokta
  k.kal.getWorldPosition(_v1);
  k.bas.getWorldPosition(_v2);
  _d.subVectors(_v2, _v1);
  const t = Math.min(1, Math.max(0, _kc.subVectors(_km, _v1).dot(_d) / Math.max(1e-6, _d.lengthSq())));
  _kc.copy(_v1).addScaledVector(_d, t);
  _kn.subVectors(_km, _kc);
  _kn.addScaledVector(_il, _kn.length() * KALKAN.ileri);
  _kn.addScaledVector(_ke, -_kn.dot(_ke));
  // hedef açı: dinlenme yönünden (elin sırtı) hedef yöne, ön kolun ekseni çevresinde
  let hedef = k.aci;
  if (_kn.length() > h0 * .02) {
    _kn.normalize();
    hedef = Math.atan2(_ky.crossVectors(_kr, _kn).dot(_ke), _kr.dot(_kn));
  }
  let fark = hedef - k.aci;
  fark -= Math.round(fark / (Math.PI * 2)) * Math.PI * 2;
  k.aci += ani ? fark : fark * Math.min(1, dt * 10);
  _kn.copy(_kr).applyAxisAngle(_ke, k.aci);
  // kalkanın eksenleri: +Z yüz (dışarı), +X ön kol boyunca
  _ky.crossVectors(_kn, _ke).normalize();
  _m1.makeBasis(_ke, _ky, _kn);
  _qR.setFromRotationMatrix(_m1);
  k.nes.quaternion.copy(_kq.invert().multiply(_qR));
  k.nes.position.copy(k.on.worldToLocal(_km.addScaledVector(_kn, h0 * KALKAN.on)));
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

// denetim: test derlemesinde tutuş ayarları adresle denenir (?asaboy=1.2&kalkanon=.09)
if (__KOPRU__) {
  const q = new URLSearchParams(location.search);
  for (const [on, o] of /** @type {[string, Record<string, number>][]} */ ([['asa', ASA], ['kalkan', KALKAN]]))
    for (const k of Object.keys(o)) if (q.get(on + k)) o[k] = +q.get(on + k);
}
