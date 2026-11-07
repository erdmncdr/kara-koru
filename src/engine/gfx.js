// engine/gfx.js · Kara Koru
// Bu dosya tek dosyalık sürümden (v22) otomatik ayrıldı. Ortak oyun durumu core/store.js içindeki $G nesnesinde.

import { $G } from '../core/store.js';
import { THREE } from './three.js';
import { SET } from '../core/settings.js';
import { R, VMAT, cam, envG, sc } from './renderer.js';
import { MODELS } from '../geo/models.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { grassGeo } from './realtrees.js';
import { BIO } from '../world/terrain.js';

export let GU, GLSLN, VMATT, VMATG, VMATB, ghash, BEAMT, BEAMT_UP, gBeamC, GRADE;

export function __init_32() {
  // ---- grafik: ışıma + renk düzenleme, zemin ayrıntısı, rüzgârda sallanan bitkiler, oyuncuyu izleyen çimen, yumuşak sandık huzmeleri
  GU = {
    t: {
      value: 0
    }
  };
  GLSLN = 'float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}\nfloat vnz(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x),mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x),f.y);}\n';
}

// zemin: dünya koordinatlı lekeler, kuru yamalar, ince doku, dik yamaçta koyulaşma
export function terrHook(m, bi) {
  m.onBeforeCompile = sh => {
    sh.uniforms.uDry = {
      value: bi == 1 ? .45 : bi == 2 ? .3 : .55
    };
    sh.uniforms.uFlower = {
      value: bi == 0 ? 1 : 0
    };
    sh.uniforms.uStrata = {
      value: bi == 1 ? 1 : 0
    };
    sh.uniforms.uT = GU.t;
    sh.uniforms.uFloor = {
      value: bi == 0 ? 1 : 0
    };
    sh.uniforms.uGrave = {
      value: bi == 2 ? 1 : 0
    };
    sh.uniforms.uMoss = {
      value: bi == 2 ? new THREE.Vector3(.12, .18, .1) : new THREE.Vector3(.14, .3, .09)
    };
    sh.vertexShader = 'varying vec3 vWP;varying vec3 vWN;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvWP=(modelMatrix*vec4(transformed,1.)).xyz;vWN=normalize(mat3(modelMatrix)*objectNormal);');
    sh.fragmentShader = 'varying vec3 vWP;varying vec3 vWN;uniform float uDry;uniform float uFlower;uniform float uStrata;uniform float uT;uniform float uFloor;uniform float uGrave;uniform vec3 uMoss;float kkLeaf=0.;\n' + GLSLN + sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n{float n1=vnz(vWP.xz*.09),n2=vnz(vWP.xz*.024+17.),n3=vnz(vWP.xz*.5+3.),n4=vnz(vWP.xz*1.9+9.);float sl=1.-clamp(vWN.y,0.,1.);vec3 c=diffuseColor.rgb;' + 'c*=.78+.4*n2;float dry=smoothstep(.55,.9,n1+(n3-.5)*.18)*uDry;c=mix(c,c*vec3(1.12,1.02,.7),dry);c=mix(c,c*vec3(.82,.95,.8),smoothstep(.55,.2,n1)*uDry*.6);' + 'float st=vnz(vWP.xz*vec2(7.,1.6)+vec2(0.,n4*3.)),cl=vnz(vWP.xz*3.1+5.);float gr=1.-dry;c*=1.+gr*(.14*(st-.5)+.18*(cl-.5));' + 'vec2 pc=floor(vWP.xz*3.),pf=fract(vWP.xz*3.);float pb=(1.-smoothstep(.06,.1,length(pf-vec2(.3+.4*h21(pc+2.1),.3+.4*h21(pc+4.3)))))*step(.9,h21(pc+1.7))*dry;c=mix(c,c*vec3(1.22,1.16,1.06),pb*.6);' + 'vec2 fc=floor(vWP.xz),ff=fract(vWP.xz);float fl=(1.-smoothstep(.04,.07,length(ff-vec2(.25+.5*h21(fc+.7),.25+.5*h21(fc+3.9)))))*step(.9,h21(fc+.3))*smoothstep(.4,.6,n2)*gr*uFlower;c=mix(c,mix(vec3(.85,.75,.3),vec3(.8,.76,.8),step(.5,h21(fc+9.))),fl*.8);' + 'c=mix(c,c*vec3(.7,.52,.48),uStrata*smoothstep(.14,.4,sl)*smoothstep(.3,.7,fract(vWP.y*.55+n4*.25)));c=mix(c,c*vec3(1.22,1.18,1.1),uStrata*smoothstep(.7,.9,n2)*(1.-smoothstep(.05,.2,sl)));' + 'float flat_=1.-smoothstep(.04,.18,sl);c*=1.+uStrata*flat_*.06*sin((vWP.x*.7+vWP.z*.35)*2.6+n3*5.);' + 'float low=uStrata*smoothstep(4.6,2.8,vWP.y)*flat_;if(low>.01){vec2 cp=vWP.xz*1.4;vec2 ci=floor(cp),cf=fract(cp);float f1=8.,f2=8.;for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){vec2 o=vec2(float(i),float(j));vec2 q=o+vec2(h21(ci+o),h21(ci+o+7.))-cf;float d=dot(q,q);if(d<f1){f2=f1;f1=d;}else if(d<f2)f2=d;}float crack=1.-smoothstep(.0,.07,sqrt(f2)-sqrt(f1));c=mix(c,c*vec3(.55,.45,.4),low*crack*.8);c*=1.-low*.08;}' + 'if(uStrata>.01){float sg=vnz(vWP.xz*14.)*.5+vnz(vWP.xz*31.+3.)*.5;c*=.93+.14*sg;' + // kum tanesi
        'float rip=smoothstep(.35,.65,abs(sin((vWP.x*.9+vWP.z*.45)*4.2+2.5*vnz(vWP.xz*.25+9.)+.6*(n3-.5))));c*=1.+flat_*(1.-dry)*.09*(rip-.5)*2.;' + // rüzgâr dalgacıkları (kumda)
        'vec2 gc=floor(vWP.xz*1.6+2.),gf=fract(vWP.xz*1.6+2.);float pav=0.;for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){vec2 o=vec2(float(i),float(j));vec2 q=o+vec2(.2+.6*h21(gc+o+1.),.2+.6*h21(gc+o+4.))-gf;float e=length(q*vec2(1.,1.4+.6*h21(gc+o+6.)));float rs=.1+.14*h21(gc+o+9.);pav=max(pav,(1.-smoothstep(rs,rs+.05,e))*step(.78,h21(gc+o+2.)));}' + // çakıl döşemesi (seyrek, değişken boy)
        'float pavA=flat_*smoothstep(.5,.8,n2)*pav;c=mix(c,mix(vec3(.4,.22,.14),vec3(.6,.36,.22),h21(gc+3.))*(.8+.35*n3),pavA*.8);kkLeaf+=pavA*.7;}' +
        'if(uGrave>.01){float wet=smoothstep(.45,.7,vnz(vWP.xz*.08+41.)+.3*(vnz(vWP.xz*.9+13.)-.5))*flat_;c*=1.-.35*wet;' + // ıslak koyu toprak yamaları
        'vec2 bc=floor(vWP.xz*1.9+7.),bf=fract(vWP.xz*1.9+7.);float bone=0.;for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){vec2 o=vec2(float(i),float(j));vec2 q=o+vec2(.25+.5*h21(bc+o+2.),.25+.5*h21(bc+o+5.))-bf;float a=h21(bc+o+8.)*6.283;vec2 r=vec2(cos(a)*q.x+sin(a)*q.y,-sin(a)*q.x+cos(a)*q.y);float e=max(abs(r.x)*1.2,abs(r.y)*5.);bone=max(bone,(1.-smoothstep(.2,.26,e))*step(.95,h21(bc+o+3.)));}' + // kemik parçaları (seyrek)
        'c=mix(c,vec3(.78,.74,.62)*(.8+.3*n4),bone*.85);kkLeaf+=bone*.5;' +
        'vec2 rc=floor(vWP.xz*2.6+3.),rf=fract(vWP.xz*2.6+3.);float rot=0.;for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){vec2 o=vec2(float(i),float(j));vec2 q=o+vec2(h21(rc+o+1.),h21(rc+o+9.))-rf;float a=h21(rc+o+4.)*6.283;vec2 r=vec2(cos(a)*q.x+sin(a)*q.y,-sin(a)*q.x+cos(a)*q.y);float e=length(r*vec2(1.,1.6+1.2*h21(rc+o+2.)));float rr_=.16+.12*h21(rc+o+7.);rot=max(rot,(1.-smoothstep(rr_,rr_+.07,e))*step(.82,h21(rc+o+6.)));}' + // çürük yapraklar (seyrek, kümeli)
        'float rotA=rot*smoothstep(.4,.7,vnz(vWP.xz*.5+17.));c=mix(c,vec3(.22,.15,.08)*(.75+.5*h21(rc)),rotA*.75*(1.-wet*.4));kkLeaf+=rotA*.4;' +
        'float gms=smoothstep(.5,.72,vnz(vWP.xz*.4+23.)+.2*(vnz(vWP.xz*3.+5.)-.5))*flat_;c=mix(c,uMoss*(.8+.3*n4),gms*.6);}' + // gri yosun
        'if(uFloor>.01){vec3 c0=vColor.rgb;float lit=uFloor*smoothstep(1.04,1.2,c0.r/(c0.g+1e-4))*flat_;' + // orman içi: köşe rengi kahverengiye kaymış yerler
        'vec2 lp=vWP.xz*4.6,li=floor(lp),lf=fract(lp);float leaf=0.;vec3 lcol=vec3(0.);for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){vec2 o=vec2(float(i),float(j));vec2 cc=o+vec2(h21(li+o+3.),h21(li+o+5.));vec2 d=lf-cc;float a=h21(li+o+8.)*6.283;vec2 r=vec2(cos(a)*d.x+sin(a)*d.y,-sin(a)*d.x+cos(a)*d.y);float e=length(r*vec2(1.,2.3));float k=(1.-smoothstep(.22,.34,e))*step(.42,h21(li+o+13.));if(k>leaf){leaf=k;float hh=h21(li+o+11.);lcol=mix(vec3(.38,.24,.12),vec3(.6,.42,.2),hh);lcol=mix(lcol,vec3(.5,.46,.24),step(.72,hh));lcol*=.9+.2*h21(li+o+17.);}}' +
        'c=mix(c,lcol*(.9+.2*n3),lit*leaf*.6);kkLeaf=lit*leaf*.6;' +
        'float ms=smoothstep(.52,.74,vnz(vWP.xz*.33+31.)+.25*(vnz(vWP.xz*2.6+7.)-.5));float mossA=uFloor*ms*(.22+.45*lit)*flat_;c=mix(c,uMoss*(.8+.35*n4+.2*vnz(vWP.xz*9.)),mossA);' + // yosun yamaları
        'float twg=smoothstep(.985,1.,abs(sin(vWP.x*3.1+vnz(vWP.xz*.7)*9.))*abs(sin(vWP.z*.9+vnz(vWP.xz*.5+4.)*7.)));c=mix(c,vec3(.32,.22,.1),lit*twg*.35);' + // ince dallar
        'vec2 sc_=floor(vWP.xz*2.1+5.),sf_=fract(vWP.xz*2.1+5.);float stn=(1.-smoothstep(.07,.12,length(sf_-vec2(.3+.4*h21(sc_+1.3),.3+.4*h21(sc_+6.1)))))*step(.86,h21(sc_+2.7));c=mix(c,vec3(.5,.48,.46)*(.8+.4*h21(sc_)),uFloor*stn*.5);kkLeaf+=uFloor*stn*.4;}' + // küçük taşlar
        'c*=.94+.07*n3+.03*n4;c=mix(c,c*vec3(.62,.6,.62),smoothstep(.2,.55,sl));' + 'float cs=vnz(vWP.xz*.012+vec2(uT*.006,uT*.0025))*.6+vnz(vWP.xz*.03+vec2(uT*.004,0.))*.4;c*=1.-.28*smoothstep(.5,.72,cs);' + 'diffuseColor.rgb=c;}').replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n{float b1=vnz(vWP.xz*.9+2.),b2=vnz(vWP.xz*.9+vec2(.08,0.)+2.),b3=vnz(vWP.xz*.9+vec2(0.,.08)+2.);vec3 off=(viewMatrix*vec4((b1-b2)*2.6,0.,(b1-b3)*2.6,0.)).xyz;normal=normalize(normal+off*(1.-smoothstep(.2,.55,1.-clamp(vWN.y,0.,1.))));normal=normalize(normal+vec3(-dFdx(kkLeaf),-dFdy(kkLeaf),0.)*1.2);}');
  };
  m.customProgramCacheKey = () => 'terr' + bi;
}
// rüzgâr: nesne uzayında yüksekliğe göre salınım; kök sabit kalır

// rüzgâr: nesne uzayında yüksekliğe göre salınım; kök sabit kalır
export function swayMat(k1, k2) {
  if (!VMAT.clone) return VMAT;
  const m = VMAT.clone();
  m.onBeforeCompile = sh => {
    sh.uniforms.uT = GU.t;
    sh.vertexShader = 'uniform float uT;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n{vec3 ip=vec3(0.);\n#ifdef USE_INSTANCING\nip=instanceMatrix[3].xyz;\n#endif\nfloat h=max(transformed.y,0.),w=sin(uT*1.5+ip.x*.23+ip.z*.19)*.55+sin(uT*2.7+ip.x*.61-ip.z*.4)*.25+sin(uT*.6+ip.z*.04+ip.x*.03)*.45;float a=' + k1 + '*h+' + k2 + '*h*h;transformed.x+=w*a;transformed.z+=w*a*.55;}');
  };
  m.customProgramCacheKey = () => 'sway' + k1 + k2;
  return m;
}

export function __init_33() {
  VMATT = swayMat('0.0', '0.0045');
  VMATG = swayMat('0.2', '0.0');
  VMATB = swayMat('0.025', '0.0');
}

export function VEGM(geo) {
  if (geo.userData && geo.userData.mat) return geo.userData.mat; // gerçekçi ağaçlar: kabuk / yaprak malzemesi geometride
  const k = geo.userData && geo.userData.key || '';
  if (/^(grass|fern|flw|reed|gf)/.test(k)) return VMATG;
  if (/^(pine|oak|palm|dead)/.test(k)) return VMATT;
  if (/^(bush|dbush)/.test(k)) return VMATB;
  return VMAT;
}
// oyuncuyu izleyen gür çimen

export function __init_34() {
  // oyuncuyu izleyen gür çimen
  $G.GF = null;
  ghash = (a, b) => {
    const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
    return v - Math.floor(v);
  };
}

// yer sisi (Mezarlık): alçak, yavaş kayan yarı saydam levhalar; dünya grubuna eklenir, haritayla silinir
export function fogSheets(bi, M, WG) {
  if (bi == 1 || SET.q == 0) return;
  const river = bi == 0; // Koru: ırmak kıyısında soluk sabah sisi; Mezarlık: her çukurda mor sis
  const geo = new THREE.PlaneGeometry(64, 64, 1, 1);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      t: GU.t,
      col: {
        value: river ? sc.fog.color.clone().lerp(new THREE.Color(1, 1, 1), .4).multiplyScalar(1.3) : sc.fog.color.clone().multiplyScalar(1.9)
      },
      op: {
        value: river ? .2 : .3
      }
    },
    vertexShader: 'varying vec2 vU;varying float vD;void main(){vU=uv;vec4 mv=modelViewMatrix*vec4(position,1.);vD=-mv.z;gl_Position=projectionMatrix*mv;}',
    fragmentShader: GLSLN + 'uniform float t;uniform vec3 col;uniform float op;varying vec2 vU;varying float vD;void main(){vec2 p=vU*5.;float n=vnz(p+vec2(t*.04,t*.015))*.6+vnz(p*2.3-vec2(t*.025,0.))*.4;float e=smoothstep(0.,.38,vU.x)*smoothstep(1.,.62,vU.x)*smoothstep(0.,.38,vU.y)*smoothstep(1.,.62,vU.y);float a=smoothstep(.42,.8,n)*e*op*smoothstep(3.,14.,vD);gl_FragColor=vec4(col,a);\n#include <colorspace_fragment>\n}',
    transparent: true,
    depthWrite: false,
    fog: false
  });
  mat.userData.own = 1;
  let n = 0;
  const fparts = [];
  for (let k = 0; k < 600 && n < (river ? 10 : 16); k++) {
    const x = Math.random() * 480 - 240,
      z = Math.random() * 480 - 240,
      h = M.ht(x, z);
    if (Math.hypot(x, z) < 20) continue;
    if (river ? !(M.flowD && M.flowD(x, z) < 15 && h < $G.WLV + 2.5) : h > 7.5) continue;
    // yalnız düz çukurlarda: kenarlar merkezden 1.2 m'den fazla sapmasın (yamaca saplanmasın)
    if ([[28, 0], [-28, 0], [0, 28], [0, -28], [20, 20], [-20, -20]].some(([dx, dz]) => Math.abs(M.ht(x + dx, z + dz) - h) > 1.2)) continue;
    const g2 = geo.clone();
    g2.rotateY(Math.random() * 6.28);
    g2.translate(x, h + 1.1, z);
    fparts.push(g2);
    n++;
  }
  geo.dispose();
  if (fparts.length) {
    const m = new THREE.Mesh(mergeGeometries(fparts, false), mat);
    fparts.forEach(p => p.dispose());
    m.renderOrder = 2;
    m.frustumCulled = false;
    m.userData.own = 1;
    WG.add(m);
  }
}

// ışık huzmeleri: güneş yönünde eğik, toplamalı, çapraz iki levha; Koru'da koru içinde, Mezarlık'ta ay demeti
export function lightShafts(bi, M, WG, pts) {
  if (bi == 1 || SET.q == 0 || !pts.length) return;
  const geo = new THREE.PlaneGeometry(bi == 0 ? 3 : 3.6, 44, 1, 1);
  geo.rotateZ(Math.PI); // huzme doku: tepede parlak, yere doğru söner
  geo.translate(0, 22, 0);
  const mat = new THREE.MeshBasicMaterial({
    color: bi == 0 ? 0xffd8a0 : 0xaab4ff,
    map: BEAMT_UP,
    transparent: true,
    opacity: bi == 0 ? .07 : .045,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    fog: true
  });
  mat.userData.own = 1;
  // bütün huzmeler tek geometri + tek mesh (önce nokta başına 2 mesh = 52 çizim çağrısıydı)
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(250, 180, -250).normalize()),
    parts = [], mt = new THREE.Matrix4(), mr = new THREE.Matrix4();
  pts.forEach(([x, z], i) => {
    for (let k = 0; k < 2; k++) {
      const g2 = geo.clone();
      mr.makeRotationY(k * Math.PI / 2 + i * .7);
      g2.applyMatrix4(mr);
      mt.makeRotationFromQuaternion(q);
      mt.setPosition(x, M.ht(x, z) - 3, z);
      g2.applyMatrix4(mt);
      parts.push(g2);
    }
  });
  geo.dispose();
  const mg = mergeGeometries(parts, false);
  parts.forEach(p => p.dispose());
  const m = new THREE.Mesh(mg, mat);
  m.userData.beam = 1;
  m.userData.own = 1;
  m.frustumCulled = false;
  WG.add(m);
}

export function grassField(bi) {
  if ($G.GF) {
    sc.remove($G.GF.m);
    $G.GF.m.dispose();
    $G.GF = null;
  }
  if (SET.q == 0) return;
  const N = bi ? 22 : 46,
    sp = bi ? 3.4 : 1.6,
    geo = grassGeo(bi ? 5 : 3, bi == 1 ? 'dry' : bi == 2 ? 'gray' : 'green');
  const m = new THREE.InstancedMesh(geo, geo.userData.mat, N * N);
  m.castShadow = false;
  m.frustumCulled = false;
  m.receiveShadow = true;
  const c = new THREE.Color(1, 1, 1);
  for (let i = 0; i < N * N; i++) m.setColorAt(i, c);
  sc.add(m);
  $G.GF = {
    m,
    N,
    sp,
    cx: 1e9,
    cz: 1e9,
    bi,
    d: new THREE.Object3D(),
    c
  };
}

export function grassUpd() {
  if (!$G.GF || !$G.P || !$G.MAP) return;
  const g = $G.GF,
    cx = Math.floor($G.P.x / g.sp),
    cz = Math.floor($G.P.z / g.sp);
  if (cx == g.cx && cz == g.cz) return;
  g.cx = cx;
  g.cz = cz;
  const h = g.N >> 1,
    d = g.d,
    col = g.c,
    m = g.m;
  let k = 0;
  for (let i = 0; i < g.N; i++) for (let j = 0; j < g.N; j++, k++) {
    const ix = cx + i - h,
      iz = cz + j - h,
      r1 = ghash(ix, iz),
      r2 = ghash(iz + 7.3, ix - 3.1),
      x = (ix + r1) * g.sp,
      z = (iz + r2) * g.sp,
      y = $G.HT(x, z),
      pt = ghash(Math.floor(x / 9), Math.floor(z / 9));
    let s = (g.bi ? .7 : .75) + .65 * ghash(ix * 3.1, iz * 5.7);
    if (y < $G.WLV + .25 || Math.hypot(x, z) < 9 || Math.abs(x) > 268 || Math.abs(z) > 268 || $G.MAP.pm && $G.MAP.pm(x, z) > .32 || pt < (g.bi ? .55 : .18)) s = 0;
    d.position.set(x, y - .04, z);
    d.rotation.set(0, r1 * 6.283, 0);
    d.scale.set(s, s * (.8 + .5 * r2), s);
    d.updateMatrix();
    m.setMatrixAt(k, d.matrix);
    const v = (g.bi ? .9 : 1.18) + .32 * ghash(ix + .5, iz - .5);
    col.setRGB(v * (g.bi ? 1 : .96), v * (g.bi ? .97 : 1.08), v * (g.bi ? .92 : .84));
    m.setColorAt(k, col);
  }
  m.instanceMatrix.needsUpdate = true;
  if (m.instanceColor) m.instanceColor.needsUpdate = true;
}
// sandık huzmesi: aşağıdan yukarı sönen, gölgesiz, toplamalı ışık

export function __init_35() {
  // sandık huzmesi: aşağıdan yukarı sönen, gölgesiz, toplamalı ışık
  BEAMT = (() => {
    const cv = document.createElement('canvas');
    cv.width = 4;
    cv.height = 64;
    const x = cv.getContext('2d'),
      gr = x.createLinearGradient(0, 0, 0, 64);
    gr.addColorStop(0, 'rgba(255,255,255,0)');
    gr.addColorStop(.55, 'rgba(255,255,255,.18)');
    gr.addColorStop(1, 'rgba(255,255,255,.75)');
    x.fillStyle = gr;
    x.fillRect(0, 0, 4, 64);
    const t = new THREE.CanvasTexture(cv);
    return t;
  })();
  // sandık/sunak huzmesi: yerde parlak, yukarı doğru söner (gökyüzüne uzanan direk görüntüsü yok)
  BEAMT_UP = BEAMT;
  BEAMT = (() => {
    const cv = document.createElement('canvas');
    cv.width = 4;
    cv.height = 64;
    const x = cv.getContext('2d'),
      gr = x.createLinearGradient(0, 0, 0, 64);
    gr.addColorStop(0, 'rgba(255,255,255,.7)');
    gr.addColorStop(.35, 'rgba(255,255,255,.22)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = gr;
    x.fillRect(0, 0, 4, 64);
    return new THREE.CanvasTexture(cv);
  })();
  gBeamC = new THREE.CylinderGeometry(.42, .42, 18, 10, 1, true);
  if (gBeamC.translate) gBeamC.translate(0, 9, 0);
}

export function chestBeam(col, parent) {
  const m = new THREE.Mesh(gBeamC, new THREE.MeshBasicMaterial({
    color: col,
    map: BEAMT,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    opacity: .45
  }));
  m.castShadow = false;
  m.receiveShadow = false;
  m.userData.beam = 1;
  parent.add(m);
  return m;
}
// son işleme: ışıma + doygunluk + vinyet + sRGB

export function __init_36() {
  // son işleme: ışıma + doygunluk + vinyet + sRGB
  GRADE = {
    uniforms: {
      tDiffuse: {
        value: null
      },
      uSat: {
        value: 1.02
      },
      uVig: {
        value: .42
      },
      uTint: {
        value: new THREE.Vector3(1, 1, 1)
      },
      uHurt: {
        value: 0
      },
      uLow: {
        value: 0
      }
    },
    vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'uniform sampler2D tDiffuse;uniform float uSat,uVig,uHurt,uLow;uniform vec3 uTint;varying vec2 vUv;void main(){vec3 c=clamp(texture2D(tDiffuse,vUv).rgb,0.,1.);c=mix(c,c*c*(3.-2.*c),.35);c=c*.97+.012;float l=dot(c,vec3(.2126,.7152,.0722));c=mix(vec3(l),c,uSat*(1.-.35*uLow))*uTint;vec2 d=vUv-.5;float r2=dot(d,d);c*=1.-uVig*r2*1.5;float edge=smoothstep(.08,.5,r2);c=mix(c,vec3(.55,.05,.03),edge*clamp(uHurt*.9+uLow*.7,0.,1.));gl_FragColor=vec4(max(c,vec3(0.)),1.);}'
  };
  $G.COMP = null;
  $G.BLOOM = null;
  $G.compFail = 0;
}

export function gfxInit() {
  if ($G.COMP || $G.compFail || !THREE.EffectComposer || !THREE.UnrealBloomPass) return;
  try {
    // HDR ara tampon + MSAA. Ton eşleme ve sRGB dönüşümü en sonda OutputPass ile yapılır.
    const w = innerWidth, h = innerHeight, pr = R.getPixelRatio();
    const rt = new THREE.WebGLRenderTarget(Math.floor(w * pr), Math.floor(h * pr), { type: THREE.HalfFloatType, samples: 4 });
    $G.COMP = new THREE.EffectComposer(R, rt);
    // Composer ikinci hedefi klonlar; ışıma ve renk düzenleme için MSAA gereksiz.
    $G.COMP.renderTarget2.dispose();
    $G.COMP.renderTarget2 = new THREE.WebGLRenderTarget(rt.width, rt.height, { type: THREE.HalfFloatType });
    $G.COMP.renderTarget2.texture.name = 'EffectComposer.rt2';
    $G.COMP.readBuffer = $G.COMP.renderTarget2;
    $G.COMP.addPass(new THREE.RenderPass(sc, cam));
    // hareket bulanıklığı: artık görüntü geçişi (ayar: mb)
    if (THREE.AfterimagePass) {
      $G.AIP = new THREE.AfterimagePass(.78);
      $G.AIP.enabled = !!SET.mb;
      $G.COMP.addPass($G.AIP);
    }
    $G.BLOOM = new THREE.UnrealBloomPass(new THREE.Vector2(w, h), .42, .5, BLOOM_TH);
    $G.COMP.addPass($G.BLOOM);
    $G.GRP = new THREE.ShaderPass(GRADE);
    $G.GRP.uniforms.uTint.value.fromArray(BIO[$G.BI].tint || [1, 1, 1]);
    $G.COMP.addPass($G.GRP);
    $G.COMP.addPass(new THREE.OutputPass());
    gfxSize();
  } catch (e) {
    console.warn('Son işleme kapatıldı:', e);
    $G.COMP = null;
    $G.compFail = 1;
  }
}

// ışıma eşiği: ışıma artık ton eşlemeden önce HDR değerler üzerinde çalışıyor
export const BLOOM_TH = 1.05;

let szT = 0;
export function gfxSize() {
  if (!$G.COMP) return;
  // Yeniden boyutlandırma art arda gelir; hedefleri yalnızca sakinleşince ayır.
  clearTimeout(szT);
  szT = setTimeout(() => {
    if (!$G.COMP) return;
    $G.COMP.setPixelRatio(R.getPixelRatio());
    $G.COMP.setSize(innerWidth, innerHeight);
  }, 120);
}

export function gfxFree() {
  if (!$G.COMP) return;
  $G.COMP.dispose();
  $G.COMP = null;
  $G.BLOOM = null;
  $G.AIP = null;
}

// ayar menüsünden: hareket bulanıklığı geçişini anında uygula
export function mbApply() {
  if ($G.AIP) $G.AIP.enabled = !!SET.mb;
}

export function gfxOn() {
  return SET.q == 2 && SET.bl !== 0 && $G.DRK > .75 && !$G.compFail;
}

export function gfxRender(dt) {
  GU.t.value += dt || 0;
  grassUpd();
  if (gfxOn()) {
    if (!$G.COMP) gfxInit();
    if ($G.COMP) {
      if ($G.AIP) $G.AIP.enabled = !!SET.mb;
      if ($G.GRP && $G.P) {
        const u = $G.GRP.uniforms, hp = $G.P.mh ? $G.P.hp / $G.P.mh : 1;
        u.uHurt.value = $G.S == 'play' ? Math.max(0, Math.min(1, ($G.P.hit || 0) / .45)) : 0;
        u.uLow.value = $G.S == 'play' && hp < .3 && $G.P.hp > 0 ? (1 - hp / .3) * (.6 + .4 * Math.sin(GU.t.value * 7)) : 0;
      }
      try {
        $G.COMP.render();
        return;
      } catch (e) {
        $G.compFail = 1;
        $G.COMP = null;
      }
    }
  } else if ($G.COMP) gfxFree();
  R.render(sc, cam);
}

// ---- veri
