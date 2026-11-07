// engine/postfx.js · Kara Koru
// Son işleme geçişleri three.js'in kendi eklentilerinden gelir.
import { THREE } from './three.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { AfterimagePass } from 'three/addons/postprocessing/AfterimagePass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export { EffectComposer, RenderPass, ShaderPass, UnrealBloomPass, OutputPass, AfterimagePass };

export function __init_31() {
  // eski kodla uyum: gfx.js bu sınıflara THREE üzerinden erişiyor
  Object.assign(THREE, { EffectComposer, RenderPass, ShaderPass, UnrealBloomPass, OutputPass, AfterimagePass });
}
