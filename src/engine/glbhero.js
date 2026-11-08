// engine/glbhero.js · Kara Koru
// DENEME: Meshy ile üretilmiş, iskeletli Alp modeli. Yalnız adreste ?meshy varken (ya da localStorage kk_meshy=1)
// ve Alp seçiliyken devreye girer; kodla kurulmuş gövde gizlenir, aynı boya ölçeklenmiş GLB konur.
// Hareketler: bekleme, yürüme, koşma, zıplama (dikey hıza göre karede tutulur), kayma (en alçak duruşta kalır),
// atılma (öne eğik hamle); saldırı ve darbe alma yalnız üst gövdede oynar, bacaklar yürümeye devam eder.
// Kılıç sağ ele, kalkan sol ön kola takılır; şapka baş kemiğine taşınır; kostüm dokunun piksellerine uygulanır.
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as T from 'three';
import { $G } from '../core/store.js';
import { SKINF } from '../game/heroes.js';

const U = n => new URL(`../assets/model/${n}.glb`, import.meta.url).href;
const URLS = { alp: { model: U('alp'), yuru: U('alp_yuru'), kos: U('alp_kos'), hareket: U('alp_hareket') } };

let on = null;
export function meshyOn() {
  if (on == null) {
    try {
      on = /[?&]meshy\b/.test(location.search) || localStorage.getItem('kk_meshy') == '1';
    } catch (e) {
      on = false;
    }
  }
  return on;
}

const LD = new GLTFLoader(),
  cache = {};
// klipler bir kez yüklenir; model her kahraman kurulumunda yeniden ayrıştırılır (sahne nesnesi paylaşılamaz)
function klipler(k) {
  if (!cache[k]) cache[k] = Promise.all([LD.loadAsync(URLS[k].yuru), LD.loadAsync(URLS[k].kos), LD.loadAsync(URLS[k].hareket)]).then(([w, r, h]) => {
    const by = n => h.animations.find(a => a.name == n);
    return kok({
      walk: w.animations[0], run: r.animations[0], idle: by('Idle'), slashR: by('Right_Hand_Sword_Slash'), slashL: by('Left_Slash'),
      jump: by('Regular_Jump'), slide: by('slide_light'), dash: by('Lean_Forward_Sprint'), hit: by('Hit_Reaction')
    });
  });
  return cache[k];
}

// kök hareketini sil: oyun karakterin yerini kendisi taşır. Kalçanın x/z kayması hep, y'si zıplamada silinir
// (kaymada kalça alçalır, bu kalır)
function kok(C) {
  for (const [k, c] of Object.entries(C)) {
    for (const tr of c.tracks) {
      if (!/^Hips\.position$/.test(tr.name)) continue;
      const v = tr.values, x0 = v[0], y0 = v[1], z0 = v[2];
      for (let i = 0; i < v.length; i += 3) {
        v[i] = x0;
        v[i + 2] = z0;
        if (k == 'jump') v[i + 1] = y0;
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

// kılıç: kavisli pala, altın balçak, koyu kabza; tutamak başlangıçta, ağız +Y yönünde
function kilic() {
  const g = new T.Group(),
    M = (c, r = .5) => new T.MeshStandardMaterial({ color: c, roughness: r, metalness: 0 }),
    sh = new T.Shape();
  sh.moveTo(-.025, 0);
  sh.quadraticCurveTo(-.03, .45, .05, .82);
  sh.lineTo(.065, .78);
  sh.quadraticCurveTo(.035, .45, .03, 0);
  const ag = new T.Mesh(new T.ExtrudeGeometry(sh, { depth: .012, bevelEnabled: false }), M(0xdfe6ee, .3));
  ag.position.set(0, .08, -.006);
  const bal = new T.Mesh(new T.BoxGeometry(.16, .025, .05), M(0xd6a12a));
  bal.position.y = .075;
  const kab = new T.Mesh(new T.CylinderGeometry(.018, .02, .15, 8), M(0x3a2216, .8));
  const top = new T.Mesh(new T.SphereGeometry(.026, 8, 6), M(0xd6a12a));
  top.position.y = -.08;
  g.add(ag, bal, kab, top);
  return g;
}

// kalkan: yuvarlak, kırmızı yüz, altın kenar ve göbek, güneş deseni; yüz +Y yönüne bakar
function kalkan() {
  const g = new T.Group(),
    M = (c, r = .55) => new T.MeshStandardMaterial({ color: c, roughness: r, metalness: 0 });
  const yuz = new T.Mesh(new T.CylinderGeometry(.27, .27, .035, 20), M(0xa8192a));
  const ken = new T.Mesh(new T.TorusGeometry(.27, .022, 6, 24), M(0xd6a12a));
  ken.rotation.x = Math.PI / 2;
  const gob = new T.Mesh(new T.ConeGeometry(.06, .06, 10), M(0xe2b23a));
  gob.position.y = .045;
  g.add(yuz, ken, gob);
  for (let i = 0; i < 8; i++) {
    const s = new T.Mesh(new T.BoxGeometry(.02, .006, .1), M(0xe2b23a));
    const a = i / 8 * Math.PI * 2;
    s.position.set(Math.sin(a) * .15, .02, Math.cos(a) * .15);
    s.rotation.y = a;
    g.add(s);
  }
  return g;
}

// nesneyi bir kemiğe, dünya uzayında istenen konum, yön (nesnenin +Y'si buraya bakar) ve boyla takar
function tak(nes, kemik, dunyaPos, dunyaYon, boy) {
  kemik.updateWorldMatrix(true, false);
  const kq = new T.Quaternion(), ks = new T.Vector3(), kp = new T.Vector3();
  kemik.matrixWorld.decompose(kp, kq, ks);
  const q = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), dunyaYon.clone().normalize());
  nes.quaternion.copy(kq.clone().invert().multiply(q));
  nes.position.copy(kemik.worldToLocal(dunyaPos.clone()));
  nes.scale.setScalar(boy / ks.x);
  kemik.add(nes);
}

// etkin GLB kahraman
let G = null;

// hero() sonrası çağrılır; uygun değilse hiçbir şey yapmaz
export function glbHero(H, key) {
  if (!meshyOn() || !URLS[key] || !H) return;
  const hedef = H,
    sk = ($G.META && $G.META.skin && $G.META.skin['cur' + $G.CI]) || '';
  Promise.all([LD.loadAsync(URLS[key].model), klipler(key)]).then(([m, C]) => {
    if ($G.H !== hedef) return; // bu arada başka kahraman seçildi
    const b0 = new T.Box3().setFromObject(hedef.g), h0 = Math.max(1, b0.max.y - b0.min.y);
    for (const c of hedef.g.children) c.visible = false;
    const root = m.scene;
    root.traverse(o => {
      if (!o.isMesh) return;
      o.castShadow = true;
      o.frustumCulled = false;
      const mt = o.material;
      // Meshy dokusu gölgeyi içinde taşıyor ve koyu: oyunun ışığında eski gövdeyle aynı parlaklığa gelsin
      mt.metalness = 0;
      mt.roughness = .7;
      mt.color.multiplyScalar(1.12);
      if (mt.map) {
        mt.map = kostum(mt.map, sk);
        mt.emissiveMap = mt.map;
        mt.emissive.setRGB(1, 1, 1);
        mt.emissiveIntensity = .2;
      }
    });
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
    // kılıç: sağ elin ucunda, ağız ön kolun devamında ve öne eğik (bekleme duruşunda aşağı-öne bakar)
    {
      const el = wp('RightHand'), kol = el.clone().sub(wp('RightForeArm')).normalize();
      tak(kilic(), bone('RightHand'), el.clone().addScaledVector(kol, h0 * .035), kol.clone().addScaledVector(ileri, 1.1), h0 * .5);
    }
    // kalkan: sol ön kolun ortasında, yüzü dışa (sola) ve hafif öne
    {
      const a = wp('LeftForeArm'), b = wp('LeftHand'), orta = a.clone().lerp(b, .55);
      tak(kalkan(), bone('LeftForeArm'), orta.addScaledVector(sol, h0 * .03), sol.clone().multiplyScalar(.85).addScaledVector(ileri, .5), h0 * .4);
    }
    // şapka: eski gövdenin baş kemiğinden yenisinin başına, miğferin tepesine
    if (hedef.hat) {
      const bas = wp('Head'), tepe = new T.Vector3(bas.x, b0.min.y + h0 * .93, bas.z);
      tak(hedef.hat, bone('Head'), tepe, yuk, hedef.hat.getWorldScale(new T.Vector3()).x);
      hedef.hat.visible = true;
    }
    const mixer = new T.AnimationMixer(root),
      A = {};
    for (const k of ['idle', 'walk', 'run', 'jump', 'slide', 'dash']) {
      A[k] = mixer.clipAction(bol(C[k], false));
      A[k + '_u'] = mixer.clipAction(bol(C[k], true));
    }
    for (const k of ['slashR', 'slashL', 'hit']) A[k] = mixer.clipAction(bol(C[k], true));
    for (const a of Object.values(A)) a.play(), a.setEffectiveWeight(0);
    for (const k of ['jump', 'slide', 'slashR', 'slashL', 'hit']) {
      A[k].timeScale = 0;
      if (A[k + '_u']) A[k + '_u'].timeScale = 0;
    }
    G = { H: hedef, root, mixer, A, w: { idle: 1 }, wu: 0, slT: 0, ust: null };
  }).catch(e => console.warn('Meshy modeli yüklenemedi', e));
}

// saldırı klip aralıkları: oyunun saldırı ilerlemesi (0..1, 0.42 sn) savuruşun hazırlık, vuruş ve bitişine eşlenir
const SAL = { slashR: [.12, .95], slashL: [.3, 1.2] };
const ANA = ['idle', 'walk', 'run', 'jump', 'slide', 'dash'];

export function glbTick(dt) {
  if (!G) return;
  if ($G.H !== G.H) return void (G = null);
  const P = $G.P || {},
    pl = $G.S == 'play',
    vm = pl ? Math.hypot(P.vx || 0, P.vz || 0) : 0,
    A = G.A;
  // ana durum
  const st = pl && P.dsh > 0 ? 'dash' : pl && P.sl ? 'slide' : pl && P.air ? 'jump' : vm > 7 ? 'run' : vm > 1.2 ? 'walk' : 'idle';
  const k = Math.min(1, dt * (st == 'jump' || st == 'dash' ? 18 : 10));
  for (const n of ANA) {
    const w = (G.w[n] || 0) + ((n == st ? 1 : 0) - (G.w[n] || 0)) * k;
    G.w[n] = w < .002 ? 0 : w;
  }
  // klip zamanları
  A.walk.timeScale = A.walk_u.timeScale = Math.max(.6, vm / 4.5);
  A.run.timeScale = A.run_u.timeScale = Math.max(.7, vm / 10);
  A.dash.timeScale = A.dash_u.timeScale = 1.6;
  if (st == 'jump') {
    // yükselirken çömelmeden tepeye (0.45..0.8), düşerken tepeden inişe (0.8..1.15)
    const vy = P.vy || 0, t = vy > 0 ? .8 - Math.min(1, vy / 14) * .35 : .8 + Math.min(1, -vy / 14) * .35;
    A.jump.time = A.jump_u.time = t;
  }
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
