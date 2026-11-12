// engine/glbboss.js · Kara Koru
// Boss'ların Meshy modelleri (Tepegöz, Erlik, Dev Hortlak). Kahramanlardaki yol (engine/glbhero.js): Codex çizimi → Meshy modeli →
// iskelet. Üç boss aynı hareket dosyasını paylaşır (Meshy iskeletlerinde kemik adları ortak; klipler Tepegöz'ün iskeletinde
// üretildi, kalça yüksekliği her modelin kendi oranına çevrilir).
//
// Oyun boss'u hâlâ eski gövdeyle kurar (game/creatures.js mkE: çarpışma, ölçek, havuz ona bağlı). Model inince eski gövde
// gizlenir (çoklu çizim yuvası bırakılır, kemiğe bağlı parçalar saklanır), GLB aynı boya ölçeklenip gövdenin altına takılır.
// Hareketler oyunun boss durumundan sürülür: yürüme hıza göre; yere vurma oyunun 0,9 sn'lik sayacına, savurma mermi halkasının
// sayacına eşlenir (vuruş anı klipteki vuruş karesine denk gelir); hücumda koşu, gelişte kükreme, ölümde devrilme.
// Gövde havuza dönerken (freeE) model sökülür ve eski parçalar geri açılır. Yüklenemezse eski gövde kalır.
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as T from 'three';
import { $G } from '../core/store.js';
import { meshyOn } from './glbhero.js';
import { iskinRelease } from './iskin.js';
import { RIMU } from './renderer.js';

const U = n => new URL(`../assets/model/${n}.glb`, import.meta.url).href;
// boss türü (data/enemies.js BOSSP k) → model
// ara boss'lar da aynı yoldan (data/enemies.js KINDS anahtarı): hareketleri boss'larınkini paylaşır
const URLS = { tepegoz: U('boss_tepegoz'), erlik: U('boss_erlik'), hortlakboss: U('boss_hortlak'), karakoncolos_dev: U('ara_karakoncolos') };
const KLIP = U('boss_hareket'), BEKLE = U('alp_hareket');
// modelin boyu, boss'un çarpışma yarıçapının katı olarak (yarıçap 5 → 9,5 birim: oyuncunun ~3,3 katı; omuz genişliği yarıçapa
// denk gelir). Eski gövdenin kutusuna eşlenince 17 birim çıkıyordu: baş ekrana sığmıyordu. yer: yerden pay
export const BOSS = { boy: 1.9, yer: 0 };
// kliplerin oyunla eşlenen anları (sn). vur: klipte vuruşun yere/hedefe değdiği an; bas: hareketin başladığı an.
// Yere vurma oyunda 0,9 sn sürer (e.slam 0,9 → 0, bitince hasar); yakın vuruşta hasar anı st.atk = 0,66 (≈0,59 sn).
export const AN = {
  slam: { bas: .3, vur: 1.85, son: 3 }, // kol 0,4-1,4 sn havada, 1,85'te yerde
  vurus: { bas: .45, vur: 1.6, son: 1.83 }, // 1,2'de tepede, 1,6'da yerde
  kukre: { bas: 1.9, sure: 2.6 }, // klibin göğüs dövme bölümü (1,9-4,5 sn)
  // kliplerin kendi ayak hızı (boy/sn; klipte yere basan ayağın geri kayma hızı ölçüldü): oynatma hızı = boss'un hızı / bu değer,
  // böylece yerdeki ayak kaymaz. Koşu klipten: 4,84 m/sn ÷ 1,8 m. alt/ust: oynatma hızının sınırları
  yuru: { hiz: .4, alt: .35, ust: 2.2 }, // klipte yerdeki ayak 0,64-0,70 m/sn (÷ 1,8 m ≈ 0,37); oyunda tarandı (tools/boss-olc.mjs): kayma oranı 0,22 → 0,78, 0,31 → 0,47, 0,40 → 0,26, 0,48 → 0,31, 0,74 → 0,54, eski değer 1 → 0,59
  kos: { hiz: 2.69, alt: .6, ust: 1.8 }
};

const LD = new GLTFLoader(), buf = {};
let klipP = null;
function modelBuf(k) {
  if (!buf[k]) buf[k] = fetch(URLS[k]).then(r => { if (!r.ok) throw new Error('http ' + r.status); return r.arrayBuffer(); }).catch(e => { delete buf[k]; throw e; });
  return buf[k];
}
// kök hareketi sil (oyun boss'u kendisi taşır): kalçanın yatay kayması sabitlenir, yüksekliği kalır
function kok(c) {
  for (const tr of c.tracks) {
    if (tr.name != 'Hips.position') continue;
    const v = tr.values, x0 = v[0], z0 = v[2];
    for (let i = 0; i < v.length; i += 3) v[i] = x0, v[i + 2] = z0;
  }
  return c;
}
function klipler() {
  if (!klipP) {
    klipP = Promise.all([LD.loadAsync(KLIP), LD.loadAsync(BEKLE)]).then(([g, b]) => {
      const by = n => kok(g.animations.find(a => a.name == n)), kalca = g.scene.getObjectByName('Hips');
      return { C: { yuru: by('Yuru'), slam: by('Slam'), vurus: by('Vurus'), kukre: by('Kukre'), kos: by('Kos'), ol: by('Ol'), bekle: kok(b.animations.find(a => a.name == 'Idle').clone()) }, kalca: kalca ? kalca.position.y : 0 };
    }).catch(e => { klipP = null; throw e; });
  }
  return klipP;
}
// üst gövde kemikleri (kükreme yürürken yalnız bunlarda oynar)
const UST = /^(Spine\d*|neck|Head|head_end|headfront|(Left|Right)(Shoulder|Arm|ForeArm|Hand))\./;

function malzeme(o) {
  if (!o.isMesh) return;
  o.castShadow = true;
  o.frustumCulled = false;
  const mt = o.material;
  mt.metalness = 0;
  mt.roughness = .75;
  mt.color.multiplyScalar(1.1);
  if (mt.map) {
    mt.emissiveMap = mt.map;
    mt.emissive.setRGB(1, 1, 1);
    mt.emissiveIntensity = .18;
  }
  mt.onBeforeCompile = sh => {
    sh.uniforms.rimCol = RIMU;
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 rimCol;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n{float rimF=1.0-clamp(dot(normal,normalize(vViewPosition)),0.0,1.0);totalEmissiveRadiance+=rimCol*(rimF*rimF*rimF);}');
  };
  mt.customProgramCacheKey = () => 'glbrim';
}

// bu aşamanın boss modeli önceden insin (boss gelince eski gövde görünmesin)
export function glbBossHazirla(...ks) {
  for (const k of ks) glbHazir1(k);
}
function glbHazir1(k) {
  if (!meshyOn() || !URLS[k]) return;
  modelBuf(k).catch(() => {});
  klipler().catch(() => {});
}

// boss doğunca (game/enemies.js): model iner, eski gövdenin yerine geçer
export function glbBoss(e) {
  const k = e.bp ? e.bp.k : e.kind, u = e.u;
  if (!meshyOn() || !URLS[k] || !u || u.glb) return;
  u.glb = { bekliyor: 1 };
  Promise.all([modelBuf(k).then(b => LD.parseAsync(b, '')), klipler()]).then(([m, K]) => {
    if (u.glb == null || !u.glb.bekliyor || !u.g.parent) return void (u.glb = null); // bu arada öldü ve havuza döndü
    const root = m.scene;
    root.traverse(malzeme);
    root.updateMatrixWorld(true);
    // eski gövdenin yerel tabanı (bağlama duruşu) ve modelin boyu
    const g0 = u.d.g;
    if (!g0.boundingBox) g0.computeBoundingBox();
    const hY = e.r * BOSS.boy / e.ba, b1 = new T.Box3().setFromObject(root), h1 = Math.max(1e-4, b1.max.y - b1.min.y), s = hY / h1; // hY: gövdenin yerel uzayında boy
    root.scale.setScalar(s);
    root.position.y = g0.boundingBox.min.y - b1.min.y * s + BOSS.yer;
    // eski gövde: çoklu çizim yuvası bırakılır, kemiğe bağlı parçalar (aksesuar, halka) ve ayrı çizilen gözler saklanır
    iskinRelease(u);
    const gizli = [];
    // seçkin halkası ve hücum çizgisi (oyun kendisi açıp kapatır) yerinde kalır
    u.g.traverse(o => { if (o !== u.g && o !== u.tel && !o.userData.ring && o.visible && (o.isMesh || o.isSprite || o.isPoints)) { o.visible = false; gizli.push(o); } });
    const gozler = u.eyes;
    u.eyes = null;
    u.g.add(root);
    // klipler: kalça yüksekliği bu modelin oranına çevrilir
    const kalca = root.getObjectByName('Hips'), oran = K.kalca > 0 && kalca ? kalca.position.y / K.kalca : 1;
    const uyar = c => {
      const y = c.clone();
      for (const tr of y.tracks) if (tr.name == 'Hips.position') { const v = tr.values = tr.values.slice(); for (let i = 0; i < v.length; i += 3) v[i] = kalca.position.x, v[i + 1] *= oran, v[i + 2] = kalca.position.z; }
      return y;
    };
    const mixer = new T.AnimationMixer(root), A = {};
    for (const [ad, c] of Object.entries(K.C)) {
      if (!c) continue;
      const y = ad == 'bekle' ? uyar(c) : uyar(c);
      A[ad] = mixer.clipAction(ad == 'kukre' || ad == 'vurus' ? new T.AnimationClip(ad + '_ust', y.duration, y.tracks.filter(t => UST.test(t.name))) : y);
      A[ad].play();
      A[ad].setEffectiveWeight(0);
    }
    for (const ad of ['slam', 'vurus', 'kukre', 'ol']) if (A[ad]) A[ad].timeScale = 0;
    u.glb = { root, mixer, A, gizli, gozler, w: { bekle: 1 }, t: 0, kukre: 0, slamT: 9, vurT: 9.5, mats: [], h: hY };
    root.traverse(o => { if (o.isMesh) u.glb.mats.push(o.material); });
    if (__KOPRU__) /** @type {any} */ (window).__boss = u.glb, /** @type {any} */ (window).__bossAN = AN, /** @type {any} */ (window).__T3 = T;
  }).catch(err => {
    console.warn('Boss modeli yüklenemedi', err);
    u.glb = null;
  });
}

// gövde havuza dönerken (game/creatures.js freeE): model sökülür, eski parçalar geri açılır
export function glbBossBirak(u) {
  const G = u && u.glb;
  if (!G) return;
  u.glb = null;
  if (G.bekliyor) return;
  G.mixer.stopAllAction();
  u.g.remove(G.root);
  G.root.traverse(o => {
    if (!o.isMesh) return;
    o.geometry.dispose();
    for (const k of ['map', 'normalMap']) if (o.material[k]) o.material[k].dispose();
    o.material.dispose();
    if (o.skeleton) o.skeleton.dispose();
  });
  for (const o of G.gizli) o.visible = true;
  u.eyes = G.gozler;
}

const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const ANA = ['bekle', 'yuru', 'kos', 'slam', 'ol'];
function karis(G, hedef, dt, hiz = 9) {
  const k = 1 - Math.exp(-hiz * dt);
  for (const ad of ANA) {
    if (!G.A[ad]) continue;
    const w = (G.w[ad] || 0) + ((hedef[ad] || 0) - (G.w[ad] || 0)) * k;
    G.w[ad] = w;
    G.A[ad].setEffectiveWeight(w);
  }
}

// her karede (game/update.js): e boss, s o karedeki yürüme hızı (birim/sn)
export function glbBossTick(e, dt, s) {
  const G = e.u.glb;
  if (!G || G.bekliyor) return;
  const A = G.A, hedef = {};
  G.t += dt;
  // yere vurma: oyunun 0,9 sn'lik sayacı klibin [bas, vur] aralığına eşlenir; vuruştan sonra klip kendi hızında biter
  if (e.slam > 0) {
    G.slamT = 0;
    A.slam.time = AN.slam.bas + (1 - e.slam / .9) * (AN.slam.vur - AN.slam.bas);
  } else if (G.slamT < 9) {
    G.slamT += dt;
    A.slam.time = Math.min(AN.slam.son, AN.slam.vur + G.slamT);
  }
  const slamW = e.slam > 0 ? 1 : 1 - sm(.15, AN.slam.son - AN.slam.vur, G.slamT);
  // savurma (üst gövdede, bacaklar yürümeye devam eder): boss'un mermi halkası sayacına eşlenir. Halka atılmadan VUR_ON sn önce kol
  // kalkar, halka çıktığı anda iner; sonra klip kendi hızında biter. (Eski gövdede halka hareketsiz çıkıyordu.)
  const VUR_ON = .7;
  if (e.sh > 0 && e.sh < VUR_ON && e.slam <= 0) {
    G.vurT = 0;
    A.vurus.time = AN.vurus.bas + (1 - e.sh / VUR_ON) * (AN.vurus.vur - AN.vurus.bas);
  } else if (G.vurT < 9) {
    G.vurT += dt;
    A.vurus.time = Math.min(AN.vurus.son, AN.vurus.vur + G.vurT);
  }
  const vurW = (G.vurT == 0 ? sm(VUR_ON, VUR_ON - .2, e.sh) : 1 - sm(.1, .45, G.vurT)) * (1 - slamW);
  A.vurus.setEffectiveWeight(vurW);
  if (slamW > .01) hedef.slam = slamW;
  const kalan = 1 - (hedef.slam || 0);
  // yürüme ve hücum: hız boss'un ölçeğine bölünür (klibin ayak hızı boy başına)
  // hücumcu ara boss (tür 5): atılma evresinde (cs 2) koşar
  const boyHiz = s / Math.max(.1, G.h * e.ba), kosuyor = (e.spm > 1.5 || e.cs == 2) && s > 0;
  if (kosuyor) {
    hedef.kos = kalan;
    A.kos.timeScale = Math.max(AN.kos.alt, Math.min(AN.kos.ust, boyHiz / AN.kos.hiz));
  } else {
    const y = sm(.02, .25, boyHiz);
    hedef.yuru = kalan * y;
    hedef.bekle = kalan * (1 - y);
    A.yuru.timeScale = Math.max(AN.yuru.alt, Math.min(AN.yuru.ust, boyHiz / AN.yuru.hiz));
  }
  karis(G, hedef, dt);
  // geliş kükremesi: ilk saniyelerde üst gövdede (bacaklar yürümeye devam eder)
  if (A.kukre) {
    // hücumcu ara boss atılmadan önce nişan alırken (cs 1, 0,8 sn) de göğsünü döver
    if (e.cs == 1 && G.csOn != 1) G.t = .15;
    G.csOn = e.cs;
    const kt = G.t, w = e.cs == 1 ? 1 : kt < AN.kukre.sure ? sm(0, .25, kt) * (1 - sm(AN.kukre.sure - .4, AN.kukre.sure, kt)) : 0;
    A.kukre.time = Math.min(A.kukre.getClip().duration - .01, AN.kukre.bas + kt);
    A.kukre.setEffectiveWeight(w * (1 - Math.max(hedef.slam || 0, vurW)));
  }
  // darbe: kısa parlama (eski gövdedeki vuruş flaşının karşılığı)
  const hit = e.hr > 0 ? Math.min(1, e.hr / .2) : 0;
  if (hit != G.hit) {
    G.hit = hit;
    for (const m of G.mats) m.emissiveIntensity = .18 + hit * .9;
  }
  G.mixer.update(dt);
}

// ölüm (game/update.js, DY listesi): k 0 → 1. Devrilme klibi oynar; oyun gövdeyi ayrıca döndürmez
export function glbBossOl(u, k, dt) {
  const G = u.glb;
  if (!G || G.bekliyor) return false;
  const A = G.A;
  if (!A.ol) return false;
  for (const ad of ANA) if (A[ad]) A[ad].setEffectiveWeight(ad == 'ol' ? 1 : 0);
  if (A.kukre) A.kukre.setEffectiveWeight(0);
  if (A.vurus) A.vurus.setEffectiveWeight(0);
  A.ol.time = Math.min(A.ol.getClip().duration - .02, k / .6 * A.ol.getClip().duration);
  if (G.hit) { G.hit = 0; for (const m of G.mats) m.emissiveIntensity = .18; }
  G.mixer.update(dt);
  return true;
}
