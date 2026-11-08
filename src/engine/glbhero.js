// engine/glbhero.js · Kara Koru
// Meshy ile üretilmiş, iskeletli Alp. Varsayılan açık; adreste ?eski (ya da localStorage kk_meshy=0) kodla kurulmuş
// eski gövdeyi geri getirir. Alp seçiliyken eski gövde gizlenir, aynı boya ölçeklenmiş GLB konur.
// Hareketler (Meshy kütüphanesi): menüde rahat bekleme, oyunda kılıç-kalkan savaş duruşu; hıza göre yürüme ile hızlı
// koşu karışımı (ayak hızı ölçülerek eşlenir); zıplama (dikey hıza göre kare), çift zıplamada takla büzülmesi (oyun
// gövdeyi kendisi döndürür), kayma (en alçak duruş), atılma (dönen hızlı adım); saldırı ve darbe yalnız üst gövdede.
// Kılıç ve kalkan da Meshy modeli; kılıç sağ ele kabzasından, kalkan sol ön kola yüzü kola dik takılır.
// Şapka baş kemiğine taşınır; kostüm dokunun piksellerine uygulanır.
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as T from 'three';
import { $G } from '../core/store.js';
import { SKINF } from '../game/heroes.js';
import { RIMU } from './renderer.js';

const U = n => new URL(`../assets/model/${n}.glb`, import.meta.url).href;
const URLS = {
  alp: { model: U('alp'), yuru: U('alp_yuru'), hareket: U('alp_hareket'), hareket2: U('alp_hareket2'), kilic: U('alp_kilic'), kalkan: U('alp_kalkan') }
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
// klipler ve silahlar bir kez yüklenir; model her kahraman kurulumunda yeniden ayrıştırılır (sahne nesnesi paylaşılamaz)
function ortak(k) {
  if (!cache[k]) {
    const u = URLS[k];
    cache[k] = Promise.all([u.yuru, u.hareket, u.hareket2, u.kilic, u.kalkan].map(x => LD.loadAsync(x))).then(([w, h, h2, kl, kn]) => {
      const by = (g, n) => g.animations.find(a => a.name == n);
      return {
        C: kok({
          walk: w.animations[0], idle: by(h, 'Idle'), slashR: by(h, 'Right_Hand_Sword_Slash'), slashL: by(h, 'Left_Slash'),
          jump: by(h, 'Regular_Jump'), slide: by(h, 'slide_light'), hit: by(h, 'Hit_Reaction'),
          combat: by(h2, 'Combat_Stance'), run: by(h2, 'RunFast'), flip: by(h2, 'Backflip_Jump'), dash: by(h2, 'Quick_Step_and_Spin_Dodge')
        }),
        kilic: kl.scene, kalkan: kn.scene
      };
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
function tak(nes, kemik, dunyaPos, dunyaYon, boy, eksen = new T.Vector3(0, 1, 0), dondur = 0) {
  kemik.updateWorldMatrix(true, false);
  const kq = new T.Quaternion(), ks = new T.Vector3(), kp = new T.Vector3();
  kemik.matrixWorld.decompose(kp, kq, ks);
  const q = new T.Quaternion().setFromUnitVectors(eksen, dunyaYon.clone().normalize());
  if (dondur) q.multiply(new T.Quaternion().setFromAxisAngle(eksen, dondur));
  nes.quaternion.copy(kq.clone().invert().multiply(q));
  nes.position.copy(kemik.worldToLocal(dunyaPos.clone()));
  nes.scale.setScalar(boy / ks.x);
  kemik.add(nes);
}

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
  // eski gövdenin boyu şimdi ölçülür, gövde hemen gizlenir: yüklenirken eski Alp görünüp sonra yenisine dönmesin
  const b0 = new T.Box3().setFromObject(hedef.g), h0 = Math.max(1, b0.max.y - b0.min.y);
  for (const c of hedef.g.children) c.visible = false;
  // eski gövdenin gözleri ayrı çizilir (engine/eyes.js, eski kemikten): yeni yüzün önünde havada kalmasın
  const gozler = hedef.eyes;
  hedef.eyes = null;
  Promise.all([LD.loadAsync(URLS[key].model), ortak(key)]).then(([m, O]) => {
    if ($G.H !== hedef) return; // bu arada başka kahraman seçildi
    const C = O.C;
    const root = m.scene;
    root.traverse(o => malzeme(o, sk));
    root.updateMatrixWorld(true);
    const b1 = new T.Box3().setFromObject(root), h1 = Math.max(1e-4, b1.max.y - b1.min.y), s = h0 / h1;
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
    // kılıç: model dik, ağız +Y. Kabzanın ortası (alttaki %6..%18 dilimi) ele gelir; ağız ön kolun devamında, öne eğik
    {
      const bt = kutu(O.kilic), hk = bt.max.y - bt.min.y,
        kb = kutu(O.kilic, v => v.y > bt.min.y + hk * .06 && v.y < bt.min.y + hk * .18),
        pv = kb.getCenter(new T.Vector3()),
        el = wp('RightHand'), kol = el.clone().sub(wp('RightForeArm')).normalize();
      tak(kap(O.kilic, pv, hk, sk), bone('RightHand'), el.clone().addScaledVector(kol, h0 * .035), kol.clone().addScaledVector(ileri, 1.1), h0 * .5, undefined, Math.PI / 2);
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
    // şapka: eski gövdenin baş kemiğinden yenisinin başına, miğferin tepesine
    if (hedef.hat) {
      const bas = wp('Head'), tepe = new T.Vector3(bas.x, b0.min.y + h0 * .93, bas.z);
      tak(hedef.hat, bone('Head'), tepe, yuk, hedef.hat.getWorldScale(new T.Vector3()).x);
      hedef.hat.visible = true;
    }
    const mixer = new T.AnimationMixer(root),
      A = {};
    for (const k of ANA) {
      A[k] = mixer.clipAction(bol(C[k], false));
      A[k + '_u'] = mixer.clipAction(bol(C[k], true));
    }
    for (const k of ['slashR', 'slashL', 'hit']) A[k] = mixer.clipAction(bol(C[k], true));
    for (const a of Object.values(A)) a.play(), a.setEffectiveWeight(0);
    for (const k of ['jump', 'flip', 'slide', 'dash', 'slashR', 'slashL', 'hit']) {
      A[k].timeScale = 0;
      if (A[k + '_u']) A[k + '_u'].timeScale = 0;
    }
    G = { H: hedef, root, mixer, A, h0, w: { idle: 1 }, wu: 0, slT: 0, ust: null };
    // denetim araçları için (tools/meshy-el.mjs): duruşu dondurup tek klip anı göstermek
    /** @type {any} */ (window).__glb = G;
    /** @type {any} */ (G).tick = glbTick;
    /** @type {any} */ (G).ayak = AYAK;
  }).catch(e => {
    // yüklenemezse eski gövde geri gelir
    console.warn('Meshy modeli yüklenemedi', e);
    for (const c of hedef.g.children) c.visible = true;
    hedef.eyes = gozler;
  });
}

// oyun açılırken dosyaları önceden indirmeye başla: menü gelince model hazır olsun (tarayıcı önbelleğine düşer)
if (meshyOn()) {
  ortak('alp').catch(() => {});
  fetch(URLS.alp.model).catch(() => {});
}

// saldırı klip aralıkları: oyunun saldırı ilerlemesi (0..1, 0.42 sn) savuruşun hazırlık, vuruş ve bitişine eşlenir
const SAL = { slashR: [.12, .95], slashL: [.3, 1.2] };
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
  A.walk.timeScale = A.walk_u.timeScale = Math.min(2, Math.max(.5, vm / (AYAK.walk * h0)));
  A.run.timeScale = A.run_u.timeScale = Math.min(KOS_UST, Math.max(.7, vm / (AYAK.run * h0)));
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
    ust = (P.side | 0) ? 'slashL' : 'slashR';
    const [a, b] = SAL[ust];
    ut = a + (b - a) * at;
  } else if (pl && P.hit > 0) {
    ust = 'hit';
    ut = (1 - Math.min(1, P.hit / .45)) * .9;
  }
  G.wu += ((ust ? 1 : 0) - G.wu) * Math.min(1, dt * (ust ? 30 : 8));
  if (ust) G.ust = ust;
  for (const n of ['slashR', 'slashL', 'hit']) A[n].setEffectiveWeight(n == G.ust ? G.wu : 0);
  if (ust) A[ust].time = ut;
  for (const n of ANA) {
    A[n].setEffectiveWeight(G.w[n]);
    A[n + '_u'].setEffectiveWeight(G.w[n] * (1 - G.wu));
  }
  G.mixer.update(dt);
}
