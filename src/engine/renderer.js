// engine/renderer.js · Kara Koru
// Bu dosya tek dosyalık sürümden (v22) otomatik ayrıldı. Ortak oyun durumu core/store.js içindeki $G nesnesinde.

import { $G } from '../core/store.js';
import { THREE } from './three.js';
import { SET } from '../core/settings.js';
import { clamp } from '../core/util.js';
import { gfxSize } from './gfx.js';
import { GEO } from '../geo/geo.js';
import { MODELS } from '../geo/models.js';

export let R, sc, cam, DRS, hemi, dl, LC, L, BM, gB, gSp, gCn, gDo, gBow, gCy, BCc, BMc, HALO, GMc, DET, mk, bx, sp, cn, cy, pv, s2l, VMAT, RC, ENV, gEye, SKMAT, FLMS, RIMU, GW;

export function __init_9() {
  // ---- motor
  R = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance'
  });
  document.body.prepend(R.domElement);
  R.shadowMap.enabled = true;
  R.shadowMap.type = THREE.PCFShadowMap;
  R.outputColorSpace = THREE.SRGBColorSpace;
  R.toneMapping = THREE.ACESFilmicToneMapping;
  R.toneMappingExposure = 1.08;
  sc = new THREE.Scene();
  sc.background = new THREE.Color(0x2b2140);
  sc.fog = new THREE.Fog(0x2b2140, 35, 190);
  cam = new THREE.PerspectiveCamera(70, 1, .1, 500);
  $G.DRK = 1;
  // dünya matrisleri core/loop.js içinde kare başına bir kez güncellenir
  sc.matrixWorldAutoUpdate = false;
  DRS = {
    ema: .016,
    t: 0
  };
}

// piksel bütçesi: retina ve 4K ekranlarda çizilen piksel sayısı sınırlanır (ısı ve pil); yüksek ~4.2, orta ~2.1 milyon piksel
const PXB = [0, 2.1e6, 4.2e6];
export function rs() {
  const tav = SET.q == 0 ? 1 : Math.min(devicePixelRatio, SET.q == 1 ? 1.5 : 2, Math.max(1, Math.sqrt(PXB[SET.q] / Math.max(1, innerWidth * innerHeight))));
  R.setPixelRatio(tav * $G.DRK);
  R.setSize(innerWidth, innerHeight);
  cam.aspect = innerWidth / innerHeight;
  cam.updateProjectionMatrix();
  try {
    gfxSize();
  } catch (e) {}
}

export function __init_10() {
  addEventListener('resize', rs);
  hemi = new THREE.HemisphereLight(0x8f7ae8, 0x2a1a30, 1.1 * Math.PI);
  sc.add(hemi);
  dl = new THREE.DirectionalLight(0xffa35c, 1.5 * Math.PI);
  dl.shadow.mapSize.set(2048, 2048);
  Object.assign(dl.shadow.camera, {
    left: -50,
    right: 50,
    top: 50,
    bottom: -50,
    far: 260
  });
  dl.shadow.bias = -.0003;
  dl.shadow.normalBias = .08; // yuvarlak büyük yüzeylerde (boss halkaları) gölge sivilcesi
  dl.shadow.camera.updateProjectionMatrix();
  sc.add(dl, dl.target);
}

export function applyQ() {
  dl.castShadow = SET.q > 0 && SET.shd !== 0;
  const ms = SET.q == 2 ? 2048 : 1024;
  dl.shadow.normalBias = SET.q == 2 ? .08 : .12;
  if (dl.shadow.mapSize.x != ms) {
    dl.shadow.mapSize.set(ms, ms);
    if (dl.shadow.map) {
      dl.shadow.map.dispose();
      dl.shadow.map = null;
    }
  }
  rs();
}

export function __init_11() {
  applyQ();
  LC = {};
  L = (c, r = .82) => LC[c + '_' + r] || (LC[c + '_' + r] = new THREE.MeshStandardMaterial({
    color: c,
    flatShading: true,
    roughness: r,
    metalness: 0
  }));
  BM = c => new THREE.MeshBasicMaterial({
    color: c
  });
  gB = new THREE.BoxGeometry(1, 1, 1);
  gSp = new THREE.SphereGeometry(1, 12, 9);
  gCn = new THREE.ConeGeometry(1, 1, 6);
  gDo = new THREE.DodecahedronGeometry(1, 0);
  gBow = new THREE.TorusGeometry(.62, .03, 4, 14, Math.PI);
  gCy = new THREE.CylinderGeometry(1, 1, 1, 10);
  BCc = {};
  BMc = c => BCc[c] || (BCc[c] = BM(c));
  HALO = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const x = c.getContext('2d');
    if (!x) return null;
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(.22, 'rgba(255,255,255,.5)');
    g.addColorStop(.6, 'rgba(255,255,255,.12)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  })();
  GMc = {};
}

export function glow(col, s, p, op = .85) {
  const k = col + '_' + op,
    m = GMc[k] || (GMc[k] = new THREE.SpriteMaterial({
      map: HALO,
      color: col,
      transparent: true,
      opacity: op,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: true
    }));
  const o = new THREE.Sprite(m);
  o.scale.set(s, s, 1);
  (p || sc).add(o);
  return o;
}

export function __init_12() {
  DET = (() => {
    const N = 256,
      c = document.createElement('canvas');
    c.width = c.height = N;
    const x = c.getContext('2d');
    if (!x) return null;
    const im = x.createImageData(N, N);
    for (let i = 0; i < N * N; i++) {
      const px = i % N,
        py = i / N | 0,
        v = .86 + .1 * Math.sin(px * .31 + Math.sin(py * .17) * 2) * Math.cos(py * .27) + (Math.random() - .5) * .16,
        u = Math.round(clamp(v, 0, 1) * 255);
      im.data[i * 4] = u;
      im.data[i * 4 + 1] = u;
      im.data[i * 4 + 2] = u;
      im.data[i * 4 + 3] = 255;
    }
    x.putImageData(im, 0, 0);
    for (let i = 0; i < 900; i++) {
      x.fillStyle = Math.random() < .5 ? 'rgba(255,255,255,.18)' : 'rgba(0,0,0,.16)';
      x.fillRect(Math.random() * N, Math.random() * N, 1 + Math.random() * 2, 3 + Math.random() * 5);
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(150, 150);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = R.capabilities.getMaxAnisotropy();
    return t;
  })();
  mk = (g, m, x, y, z, p) => {
    const o = new THREE.Mesh(g, m);
    o.position.set(x, y, z);
    (p || sc).add(o);
    return o;
  };
  bx = (m, w, h, d, x, y, z, p) => {
    const o = mk(gB, m, x, y, z, p);
    o.scale.set(w, h, d);
    return o;
  };
  sp = (m, r, x, y, z, p) => {
    const o = mk(gSp, m, x, y, z, p);
    o.scale.setScalar(r);
    return o;
  };
  cn = (m, w, h, x, y, z, p) => {
    const o = mk(gCn, m, x, y, z, p);
    o.scale.set(w, h, w);
    return o;
  };
  cy = (m, r, h, x, y, z, p) => {
    const o = mk(gCy, m, x, y, z, p);
    o.scale.set(r, h, r);
    return o;
  };
  pv = (x, y, p) => {
    const g = new THREE.Group();
    g.position.set(x, y, 0);
    p.add(g);
    return g;
  };
  s2l = v => v <= .04045 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4);
}

export function toBG(g) {
  const b = new THREE.BufferGeometry();
  b.setAttribute('position', new THREE.Float32BufferAttribute(g.p, 3));
  b.setAttribute('normal', new THREE.Float32BufferAttribute(g.n, 3));
  b.setAttribute('color', new THREE.Float32BufferAttribute(g.c.map(s2l), 3));
  b.setIndex(g.i);
  return b;
}

export function __init_13() {
  VMAT = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: .74,
    metalness: 0
  });
  structify(VMAT);
  RC = {};
  ENV = {};
  gEye = new THREE.SphereGeometry(1, 10, 8);
}

export function rigData(key, fn, q) {
  if (!RC[key]) {
    GEO.setQ(q);
    const m = fn();
    GEO.setQ(1);
    RC[key] = {
      root: toBG(m.root),
      parts: Object.fromEntries(Object.entries(m.parts).map(([k, v]) => [k, {
        p: v.p,
        g: toBG(v.g)
      }])),
      eyes: m.eyes
    };
  }
  return RC[key];
}

export function rigInst(d) {
  const g = new THREE.Group(),
    u = {
      g
    };
  g.add(new THREE.Mesh(d.root, VMAT));
  for (const k in d.parts) {
    const v = d.parts[k],
      q = new THREE.Group();
    q.position.set(v.p[0], v.p[1], v.p[2]);
    g.add(q);
    q.add(new THREE.Mesh(v.g, VMAT));
    u[k] = q;
  }
  for (const e of d.eyes) {
    const par = e.part ? u[e.part] : g,
      m = mk(gEye, BMc(e.c), e.p[0], e.p[1], e.p[2], par);
    m.scale.set(e.r, e.r * (e.sq || 1), e.r);
    if (e.glow) glow(e.c, e.glow, par, .7).position.set(e.p[0], e.p[1], e.p[2]);
  }
  return u;
}

export function __init_14() {
  SKMAT = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: .7,
    metalness: 0
  });
  FLMS = new THREE.MeshBasicMaterial({
    color: 0xffffff
  });
  // kenar ışığı: karakterlerin silueti arka plandan ayrılsın
  RIMU = {
    value: new THREE.Color(0)
  };
}

export function __init_15b() {
  // Üretimde shader hata denetimi kapalı: three.js her programda derleme günlüğünü eşzamanlı okur,
  // bu da sürücünün arka planda derlemesini engeller. Geliştirmede açık kalır.
  if (R && !import.meta.env.DEV) R.debug.checkShaderErrors = false;
}

// Karakter ve düşman malzemesi: köşe renginden malzeme sınıfı çıkarılır (çelik/altın → metal, doygun → kumaş,
// ten tonu → deri), nesne uzayında triplanar mikro doku (dokuma, deri taneciği, fırça izi), ince normal bozulması,
// pürüzlülük/metallik buna göre; metaller küçük bir PMREM gök ortamını yansıtır. Kenar ışığı korunur.
const MATGL = 'float mh21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}float mvn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mh21(i),mh21(i+vec2(1.,0.)),f.x),mix(mh21(i+vec2(0.,1.)),mh21(i+vec2(1.,1.)),f.x),f.y);}float mtri(vec3 p,vec3 n,float s){vec3 w=abs(n);w=w/(w.x+w.y+w.z+1e-4);return mvn(p.yz*s)*w.x+mvn(p.xz*s)*w.y+mvn(p.xy*s)*w.z;}';
export function rimify(m) {
  m.onBeforeCompile = sh => {
    sh.uniforms.rimCol = RIMU;
    sh.vertexShader = 'varying vec3 vOP;varying vec3 vON;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvOP=position;vON=normal;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 rimCol;varying vec3 vOP;varying vec3 vON;\n' + MATGL)
      .replace('#include <color_fragment>', '#include <color_fragment>\n' +
        'vec3 mc=diffuseColor.rgb;float mx_=max(mc.r,max(mc.g,mc.b)),mn_=min(mc.r,min(mc.g,mc.b));float sat=(mx_-mn_)/max(mx_,1e-4),lum=dot(mc,vec3(.3,.59,.11));' +
        'float gold=step(.45,sat)*step(.55,lum)*step(mc.g,mc.r)*step(mc.b*1.6,mc.g);' + // sarı-turuncu, parlak
        'float steel=(1.-smoothstep(.09,.16,sat))*smoothstep(.3,.5,lum)*(1.-smoothstep(.78,.9,lum));' +
        'float metalF=clamp(steel+gold,0.,1.);' +
        'float skinF=(1.-metalF)*smoothstep(.2,.4,sat)*(1.-smoothstep(.45,.6,sat))*step(mc.g,mc.r)*step(mc.b,mc.g)*smoothstep(.45,.6,lum);' + // ten
        'float clothF=(1.-metalF)*(1.-skinF);' +
        'vec3 on=normalize(vON);float g1=mtri(vOP,on,22.),g2=mtri(vOP,on,48.),g3=mtri(vOP,on,7.);' +
        'float weave=abs(sin(vOP.y*110.))*abs(sin((vOP.x+vOP.z)*110.));' + // ince dokuma ızgarası
        'float det=1.-smoothstep(.012,.05,fwidth(vOP.x+vOP.y+vOP.z));' + // uzakta mikro doku söner (kıvılcımlanma yok)
        'mc*=1.+det*(clothF*(.018*(g2-.5)+.012*(weave-.5)+.02*(g3-.5))+skinF*(.012*(g1-.5))+metalF*(.03*(g2-.5)+.03*(g3-.5)));' +
        'diffuseColor.rgb=mc;')
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor=mix(mix(.78,.5,skinF),.46,metalF)*(.96+.08*g2);')
      .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\nmetalnessFactor=metalF*.8;')
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n{float hd=mix(mtri(vOP,on,16.),mtri(vOP,on,40.),metalF);vec2 dh=vec2(dFdx(hd),dFdy(hd));vec3 off=vec3(-dh.x,-dh.y,0.)*det*(1.2*clothF+.5*skinF+3.*metalF);normal=normalize(normal+off);}')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n{float rimF=1.0-clamp(dot(normal,normalize(vViewPosition)),0.0,1.0);totalEmissiveRadiance+=rimCol*(rimF*rimF*rimF)*(1.-.5*metalF);totalEmissiveRadiance+=diffuseColor.rgb*skinF*rimF*rimF*.12;}');
  };
  m.customProgramCacheKey = () => 'charmat';
  return m;
}

// Yapı ve süs malzemesi: köşe renginden taş/ahşap sınıfı, dünya uzayında triplanar doku.
// Taş: tane, leke, düz ve eksene hizalı yüzeylerde harç çizgili bloklar (her blok hafif farklı ton); ahşap: damar çizgileri.
export function structify(m) {
  m.onBeforeCompile = sh => {
    sh.vertexShader = 'varying vec3 vWP;varying vec3 vWN;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n{vec4 kkw=vec4(transformed,1.);vec3 kkn=objectNormal;\n#ifdef USE_INSTANCING\nkkw=instanceMatrix*kkw;kkn=mat3(instanceMatrix)*kkn;\n#endif\nvWP=(modelMatrix*kkw).xyz;vWN=normalize(mat3(modelMatrix)*kkn);}');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWP;varying vec3 vWN;float kkH=0.;float kkSt=0.;float kkWd=0.;\n' + MATGL)
      .replace('#include <color_fragment>', '#include <color_fragment>\n{' +
        'vec3 c=diffuseColor.rgb;float mx_=max(c.r,max(c.g,c.b)),mn_=min(c.r,min(c.g,c.b));float sat=(mx_-mn_)/max(mx_,1e-4),lum=dot(c,vec3(.3,.59,.11));float warm=step(c.g,c.r)*step(c.b,c.g);' +
        'float woodF=smoothstep(.36,.26,lum)*smoothstep(.2,.38,sat)*warm;' + // ahşap koyu; kerpiç (lum>.4) taş kalır
        'float stoneF=(1.-woodF)*max((1.-smoothstep(.16,.26,sat))*(1.-smoothstep(.62,.74,lum)),smoothstep(.4,.52,lum)*(1.-smoothstep(.7,.8,lum))*warm*step(.3,sat));' + // keçe/kumaş gibi çok açık yüzeyler taş sayılmaz
        'vec3 n=normalize(vWN);vec3 p=vWP;float ax=max(abs(n.x),max(abs(n.y),abs(n.z)));float flatF=smoothstep(.86,.97,ax);' +
        'vec2 uvb=(abs(n.x)>=abs(n.z)&&abs(n.x)>=abs(n.y))?p.zy:((abs(n.y)>=abs(n.z))?p.xz:p.xy);' +
        'float det=1.-smoothstep(.02,.08,fwidth(p.x+p.y+p.z));float g1=mtri(p,n,5.),g2=mtri(p,n,16.),g3=mtri(p,n,30.);' +
        'vec2 bu=vec2(uvb.x/1.1+step(.5,fract(uvb.y/.55))*.5,uvb.y/.55);vec2 bf=fract(bu);float mortar=1.-smoothstep(.035,.08,min(min(bf.x,1.-bf.x)*1.1,min(bf.y,1.-bf.y)*.55));' +
        'float brick=mortar*flatF*stoneF*(1.-.5*step(.9,abs(n.y)));float bt=mh21(floor(bu));' +
        'c*=1.+stoneF*(.1*(g1-.5)+.1*(g2-.5)+.08*det*(g3-.5))+stoneF*flatF*.1*(bt-.5);c=mix(c,c*.55,brick*.8*det);' +
        'float grain=mvn(vec2(uvb.x*13.,uvb.y*1.5))*.55+mvn(vec2(uvb.x*38.,uvb.y*3.2))*.45;float knot=smoothstep(.72,.9,mvn(uvb*1.7+3.));' +
        'c*=1.+woodF*(.26*(grain-.5)-.18*knot);' +
        'kkH=det*(stoneF*(.4*g3+.6*brick)+woodF*.45*grain);kkSt=stoneF;kkWd=woodF;diffuseColor.rgb=c;}')
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,mix(.92,.72,kkWd),max(kkSt,kkWd));')
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n{vec2 dh=vec2(dFdx(kkH),dFdy(kkH));normal=normalize(normal+vec3(-dh.x,-dh.y,0.)*(6.*kkSt+3.*kkWd));}');
  };
  m.customProgramCacheKey = () => 'struct';
  return m;
}

// küçük gök ortamı: metaller için yansıma (ekvirektangüler kanvas → PMREM)
export function mkEnv() {
  if (!R || !THREE.PMREMGenerator) return null;
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 64;
  const x = c.getContext('2d');
  if (!x) return null;
  const g = x.createLinearGradient(0, 0, 0, 64);
  g.addColorStop(0, '#5a6aa8');
  g.addColorStop(.48, '#c9a98a');
  g.addColorStop(.52, '#6a5a48');
  g.addColorStop(1, '#2a221c');
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 64);
  const sun = x.createRadialGradient(96, 18, 0, 96, 18, 14);
  sun.addColorStop(0, 'rgba(255,240,210,1)');
  sun.addColorStop(1, 'rgba(255,200,140,0)');
  x.fillStyle = sun;
  x.fillRect(0, 0, 128, 64);
  const t = new THREE.CanvasTexture(c);
  t.mapping = THREE.EquirectangularReflectionMapping;
  t.colorSpace = THREE.SRGBColorSpace;
  const pm = new THREE.PMREMGenerator(R);
  const env = pm.fromEquirectangular(t).texture;
  pm.dispose();
  t.dispose();
  return env;
}

export function __init_15() {
  rimify(SKMAT);
  const env = mkEnv();
  if (env) {
    SKMAT.envMap = env;
    SKMAT.envMapIntensity = .6;
  }
}

export function skData(key, fn, q) {
  if (!RC[key]) {
    GEO.setQ(q);
    const m = fn();
    GEO.setQ(1);
    const g = toBG(m.geo);
    g.setAttribute('skinIndex', new THREE.Float32BufferAttribute(m.geo.si, 4));
    g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(m.geo.sw, 4));
    RC[key] = {
      g,
      bones: m.bones,
      eyes: m.eyes,
      info: m.info
    };
  }
  return RC[key];
}

export function skInst(d, inst) {
  const g = new THREE.Group(),
    b = {},
    bs = d.bones.map(x => {
      const o = new THREE.Bone();
      o.rotation.order = 'YXZ';
      b[x.n] = o;
      return o;
    });
  d.bones.forEach((x, i) => {
    const p = x.pi < 0 ? [0, 0, 0] : d.bones[x.pi].h;
    bs[i].position.set(x.h[0] - p[0], x.h[1] - p[1], x.h[2] - p[2]);
    if (x.pi >= 0) bs[x.pi].add(bs[i]);
  });
  let m = null;
  if (inst) {
    // instanced skinning (engine/iskin.js): mesh yok, kemikler doğrudan grupta
    d.bones.forEach((x, i) => {
      if (x.pi < 0) g.add(bs[i]);
    });
  } else {
    m = new THREE.SkinnedMesh(d.g, SKMAT);
    d.bones.forEach((x, i) => {
      if (x.pi < 0) m.add(bs[i]);
    });
    m.bind(new THREE.Skeleton(bs));
    g.add(m);
  }
  // gözler ayrı mesh değil: engine/eyes.js her kare kemik matrisinden instance üretir
  const eyes = d.eyes.map(e => {
    const i = d.bones.findIndex(x => x.n == e.bone),
      h = d.bones[i].h;
    return {
      bone: bs[i],
      q: [e.p[0] - h[0], e.p[1] - h[1], e.p[2] - h[2]],
      r: e.r,
      sq: e.sq || 1,
      c: e.c,
      glow: e.glow || 0
    };
  });
  return {
    g,
    m,
    b,
    bs,
    eyes,
    names: d.bones.map(x => x.n).filter(n => !/^c\d$/.test(n)),
    info: d.info,
    cph: Math.random() * 6.28
  };
}

export function envG(k, fn, q) {
  if (!ENV[k]) {
    GEO.setQ(q);
    ENV[k] = toBG(fn());
    GEO.setQ(1);
    ENV[k].userData.key = k;
  }
  return ENV[k];
}

export function __init_16() {
  GW = {
    axe: () => envG('w_axe', () => MODELS.wAxe(), 1),
    boom: () => envG('w_boom', () => MODELS.wBoom(), 1),
    sword: () => envG('w_sw', () => MODELS.wSword(), 1)
  };
}
