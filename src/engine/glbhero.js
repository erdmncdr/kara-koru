// engine/glbhero.js · Kara Koru
// DENEME: Meshy ile üretilmiş, iskeletli Alp modeli. Yalnız adreste ?meshy varken (ya da localStorage kk_meshy=1)
// ve Alp seçiliyken devreye girer; kodla kurulmuş gövde gizlenir, aynı boya ölçeklenmiş GLB konur.
// Oyunda hıza göre koşma ya da yürüme klibi, dururken kolları aşağı indirilmiş bekleme duruşu.
// Silah ve kalkan şimdilik yok (eski gövdenin eklentileriydi).
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { AnimationMixer, Box3, Vector3, LoopRepeat } from 'three';
import { $G } from '../core/store.js';

const URLS = {
  alp: [new URL('../assets/model/alp.glb', import.meta.url).href, new URL('../assets/model/alp_yuru.glb', import.meta.url).href, new URL('../assets/model/alp_kos.glb', import.meta.url).href]
};
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

const cache = {};
function yukle(k) {
  if (!cache[k]) {
    const ld = new GLTFLoader();
    cache[k] = Promise.all(URLS[k].map(u => ld.loadAsync(u)));
  }
  return cache[k];
}

// etkin GLB kahraman: { H, root, mixer, walk, run, arms }
let G = null;

// hero() sonrası çağrılır; uygun değilse hiçbir şey yapmaz
export function glbHero(H, key) {
  if (!meshyOn() || !URLS[key] || !H) return;
  const hedef = H;
  yukle(key).then(([m, w, r]) => {
    if ($G.H !== hedef) return; // bu arada başka kahraman seçildi
    // eski gövdenin boyu: yeni model aynı boya ölçeklenir
    const b0 = new Box3().setFromObject(hedef.g), h0 = Math.max(1, b0.max.y - b0.min.y);
    for (const c of hedef.g.children) c.visible = false;
    const root = m.scene; // aynı GLB bir kez kullanılır (menüden oyuna geçince yeniden yüklenir)
    cache[key] = null;
    root.traverse(o => {
      if (o.isMesh) {
        o.castShadow = true;
        o.frustumCulled = false;
        const m = o.material;
        if (m) {
          // Meshy dokusu gölgeyi içinde taşıyor ve koyu: oyunun ışığında eski gövdeyle aynı parlaklığa gelsin
          m.metalness = 0;
          m.roughness = .7;
          m.color.multiplyScalar(1.12);
          if (m.map) m.emissiveMap = m.map, m.emissive.setRGB(1, 1, 1), m.emissiveIntensity = .2;
        }
      }
    });
    root.updateMatrixWorld(true);
    const b1 = new Box3().setFromObject(root), h1 = Math.max(1e-4, b1.max.y - b1.min.y);
    const s = h0 / h1;
    root.scale.multiplyScalar(s);
    root.position.y -= b1.min.y * s;
    hedef.g.add(root);
    const mixer = new AnimationMixer(root),
      walk = mixer.clipAction(w.animations[0]),
      run = mixer.clipAction(r.animations[0]);
    for (const a of [walk, run]) a.setLoop(LoopRepeat, Infinity), a.play(), a.setEffectiveWeight(0);
    const bone = n => root.getObjectByName(n),
      kemik = [];
    root.traverse(o => o.isBone && kemik.push([o, o.quaternion.clone(), o.position.clone()]));
    G = { H: hedef, root, mixer, walk, run, kemik, arms: [bone('LeftArm'), bone('RightArm')], v: new Vector3() };
  }).catch(e => console.warn('Meshy modeli yüklenemedi', e));
}

// bekleme duruşunda kolların indirilme açısı (radyan, A duruşundan)
export let KOL = -.62;
export function kolAci(a) { KOL = a; }

// her kare: hıza göre klip ağırlıkları, dururken kollar aşağıda
export function glbTick(dt) {
  if (!G) return;
  if ($G.H !== G.H) return void (G = null);
  const pl = $G.S == 'play',
    vm = pl && $G.P ? Math.hypot($G.P.vx || 0, $G.P.vz || 0) : 0,
    kos = vm > 6 ? 1 : 0,
    yur = vm > 1.2 && !kos ? 1 : 0;
  G.walk.setEffectiveWeight(yur);
  G.run.setEffectiveWeight(kos);
  G.walk.timeScale = Math.max(.6, vm / 4);
  G.run.timeScale = Math.max(.7, vm / 9);
  G.mixer.update(dt);
  if (!yur && !kos) {
    // bekleme: A duruşundaki kolları gövdeye yaklaştır, hafif nefes
    const t = $G.T || 0;
    for (const [o, q, p] of G.kemik) o.quaternion.copy(q), o.position.copy(p);
    const [la, ra] = G.arms, n = Math.sin(t * 1.6) * .02;
    if (la) la.rotateZ(KOL + n);
    if (ra) ra.rotateZ(-KOL - n);
  }
}
