// world/tornado.js · Kara Koru
// Bu dosya tek dosyalık sürümden (v22) otomatik ayrıldı. Ortak oyun durumu core/store.js içindeki $G nesnesinde.

import { $G } from '../core/store.js';
import { THREE } from '../engine/three.js';
import { sfx } from '../audio/engine.js';
import { toast } from '../core/helpers.js';
import { cl, rn } from '../core/util.js';
import { mk, sc } from '../engine/renderer.js';
import { VFX } from '../engine/vfx.js';
import { GLSLN, GU } from '../engine/gfx.js';
import { KBM } from '../game/enemies.js';

export let gTor, mTor, mTor2, mkTor;

export function __init_66() {
  // ---- çöl hortumları: oyuncuyu havaya fırlatır, düşmanları savurur
  gTor = new THREE.CylinderGeometry(2.6, .45, 13, 18, 6, true);
  gTor.translate && gTor.translate(0, 6.5, 0);
  // girdap: silindir uv'sinde zamanla kayan gürültü bantları; tepe seyrek, taban yoğun
  const swirl = (col, op, sp) => new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
      t: {
        value: 0
      },
      col: {
        value: new THREE.Color(col)
      },
      op: {
        value: op
      },
      sp: {
        value: sp
      }
    }]),
    vertexShader: '#include <fog_pars_vertex>\nvarying vec2 vU;void main(){vU=uv;vec4 mvPosition=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mvPosition;\n#include <fog_vertex>\n}',
    fragmentShader: '#include <fog_pars_fragment>\n' + GLSLN + 'uniform float t;uniform vec3 col;uniform float op;uniform float sp;varying vec2 vU;void main(){float n=vnz(vec2(vU.x*5.+vU.y*3.+t*sp,vU.y*7.-t*1.6))*.65+vnz(vec2(vU.x*11.-t*sp*1.7,vU.y*15.+t*.8))*.35;float a=smoothstep(.3,.75,n)*op*(.35+.65*(1.-vU.y))*smoothstep(0.,.1,vU.y)*smoothstep(1.,.85,vU.y);gl_FragColor=vec4(col*(0.85+.3*n),a);\n#include <colorspace_fragment>\n#include <fog_fragment>\n}',
    transparent: true,
    depthWrite: false,
    side: 2,
    fog: true
  });
  mkTor = () => {
    mTor = swirl(0xc8a070, .55, 1.1);
    mTor2 = swirl(0xe6c896, .4, -1.6);
    mTor.uniforms.t = GU.t;
    mTor2.uniforms.t = GU.t;
  };
}

export function clrTor() {
  for (const t of $G.TOR) sc.remove(t.m);
  $G.TOR.length = 0;
}

export function torUpd(dt) {
  if ($G.BI != 1) {
    if ($G.TOR.length) clrTor();
    return;
  }
  if (!mTor) mkTor(); // GU.t gfx başlatımından sonra var; malzeme ilk kullanımda kurulur
  while ($G.TOR.length < 3 && $G.P.stT > 4) {
    const a = rn(0, 6.28),
      d = rn(45, 80),
      x = cl($G.P.x + Math.cos(a) * d),
      z = cl($G.P.z + Math.sin(a) * d),
      g = new THREE.Group(),
      m1 = mk(gTor, mTor, 0, 0, 0, g),
      m2 = mk(gTor, mTor2, 0, 0, 0, g);
    m2.scale.set(.66, 1.06, .66);
    g.position.set(x, $G.HT(x, z), z);
    sc.add(g);
    $G.TOR.push({
      m: g,
      m1,
      m2,
      x,
      z,
      tx: x,
      tz: z,
      cd: 0
    });
  }
  for (const t of $G.TOR) {
    t.cd -= dt;
    if (Math.hypot(t.tx - t.x, t.tz - t.z) < 3) {
      t.tx = cl(t.x + rn(-30, 30));
      t.tz = cl(t.z + rn(-30, 30));
    }
    const dx = t.tx - t.x,
      dz = t.tz - t.z,
      dl = Math.hypot(dx, dz) || 1;
    t.x += dx / dl * 3.5 * dt;
    t.z += dz / dl * 3.5 * dt;
    const gy = $G.HT(t.x, t.z);
    t.m.position.set(t.x, gy, t.z);
    t.m1.rotation.y += dt * 4;
    t.m2.rotation.y -= dt * 6.5;
    t.m.rotation.z = Math.sin($G.T * 1.3 + t.x) * .08;
    t.m.rotation.x = Math.cos($G.T * 1.1 + t.z) * .08;
    if (Math.hypot($G.P.x - t.x, $G.P.z - t.z) < 90) {
      for (let i = 0; i < 2; i++) {
        const a = rn(0, 6.28),
          h = rn(0, 11),
          r = .6 + h * .17;
        VFX.emit(VFX.ALP, t.x + Math.cos(a) * r, gy + h, t.z + Math.sin(a) * r, {
          n: 1,
          sp: [0, .1],
          life: [.4, .7],
          s: [.5, .9],
          s1: 1.6,
          c: 0xc8a070,
          d: 1
        });
      }
      if (Math.random() < .5) VFX.dust(t.x, gy + .2, t.z, 1, 0xb08a6a, 4);
    }
    const pd = Math.hypot($G.P.x - t.x, $G.P.z - t.z);
    if (pd < 3.2 && $G.P.y - 1 < gy + 9 && t.cd <= 0) {
      t.cd = .9;
      $G.P.vy = Math.max($G.P.vy, 27);
      $G.P.air0 = 1;
      $G.P.jc = 0;
      const a = Math.atan2($G.P.z - t.z, $G.P.x - t.x) + 1.2;
      $G.P.vx += Math.cos(a) * 10;
      $G.P.vz += Math.sin(a) * 10;
      sfx('tornado');
      sfx('pad');
      if (!$G.P.torT) {
        $G.P.torT = 1;
        toast('Hortum seni havaya fırlattı');
      }
    }
    for (const e of $G.E) {
      if (e.dead || e.t == 3) continue;
      const p = e.m.position,
        d = Math.hypot(p.x - t.x, p.z - t.z);
      if (d < 3.6) {
        const a = Math.atan2(p.z - t.z, p.x - t.x) + .9;
        e.kx = (e.kx || 0) + Math.cos(a) * 30 * dt * KBM[e.t];
        e.kz = (e.kz || 0) + Math.sin(a) * 30 * dt * KBM[e.t];
      }
    }
  }
}
// ---- ekran katmanları: hız çizgileri, düşük can, donma
