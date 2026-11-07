// engine/three.js · Kara Koru
// three.js'in değiştirilebilir bir kopyası. Oyun kodu THREE.X biçimini kullanıyor ve
// renk yönetimi için bazı sınıfları yamalıyor, ES modül ad alanı ise salt okunur.
import * as NS from 'three';
export const THREE = { ...NS };
