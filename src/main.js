// main.js · Kara Koru giriş noktası
import './styles/main.css';
import { $G } from './core/store.js';
import * as m0 from './core/util.js';
import * as m1 from './geo/geo.js';
import * as m2 from './geo/models.js';
import * as m3 from './geo/anim.js';
import * as m4 from './world/mapgen.js';
import * as m5 from './world/mapm.js';
import * as m6 from './core/settings.js';
import * as m7 from './engine/color.js';
import * as m8 from './engine/renderer.js';
import * as m9 from './world/terrain.js';
import * as m10 from './world/build.js';
import * as m11 from './world/ambient.js';
import * as m12 from './game/heroes.js';
import * as m13 from './game/creatures.js';
import * as m14 from './engine/postfx.js';
import * as m15 from './engine/gfx.js';
import * as m16 from './data/content.js';
import * as m17 from './ui/icons.js';
import * as m18 from './core/state.js';
import * as m19 from './audio/synth.js';
import * as m20 from './audio/engine.js';
import * as m21 from './audio/ambience.js';
import * as m22 from './audio/music.js';
import * as m23 from './core/helpers.js';
import * as m24 from './engine/vfx.js';
import * as m25 from './game/stats.js';
import * as m26 from './game/objects.js';
import * as m27 from './ui/menus.js';
import * as m28 from './ui/leaderboard.js';
import * as m29 from './game/enemies.js';
import * as m30 from './game/interact.js';
import * as m31 from './game/weapons.js';
import * as m32 from './world/tornado.js';
import * as m33 from './ui/screenfx.js';
import * as m34 from './game/weapon-fx.js';
import * as m35 from './ui/hud.js';
import * as m36 from './ui/bigmap.js';
import * as m37 from './input/gamepad.js';
import * as m38 from './input/input.js';
import * as m39 from './game/hero-anim.js';
import * as m40 from './core/loop.js';
import * as m41 from './core/boot.js';
import * as m56 from './world/props.js';
import * as m69 from './ui/cards.js';
import * as m71 from './game/features.js';
import * as m72 from './game/flow.js';
import * as m81 from './game/update.js';
import * as m90 from './data/stats.js';
import * as m91 from './game/status.js';
import * as m92 from './game/items.js';
import * as m93 from './game/loot.js';
import * as m94 from './engine/eyes.js';
import * as m95 from './game/run.js';
import * as m96 from './game/weapons2.js';
import * as m97 from './data/enemies.js';
import * as m98 from './game/bosses.js';
import * as m99 from './game/graveyard.js';
import * as m100 from './data/challenges.js';
import * as m101 from './game/challenge.js';
import * as m102 from './ui/console.js';
import * as m103 from './geo/accessories.js';
import * as m104 from './engine/warm.js';
import * as m105 from './engine/iskin.js';
import * as m106 from './ui/actions.js';
import * as m107 from './ui/hesap.js';
import * as m108 from './ui/yukle.js';
import * as m109 from './core/ayar.js';
import * as m110 from './ui/sayfa.js';

const MODS = { 'ui/sayfa': m110, 'core/util': m0, 'geo/geo': m1, 'geo/models': m2, 'geo/anim': m3, 'world/mapgen': m4, 'world/mapm': m5, 'core/settings': m6, 'engine/color': m7, 'engine/renderer': m8, 'world/terrain': m9, 'world/build': m10, 'world/ambient': m11, 'game/heroes': m12, 'game/creatures': m13, 'world/props': m56, 'engine/postfx': m14, 'engine/gfx': m15, 'data/content': m16, 'ui/icons': m17, 'core/state': m18, 'audio/synth': m19, 'audio/engine': m20, 'audio/ambience': m21, 'audio/music': m22, 'core/helpers': m23, 'engine/vfx': m24, 'game/stats': m25, 'ui/cards': m69, 'game/objects': m26, 'game/features': m71, 'game/flow': m72, 'ui/menus': m27, 'ui/leaderboard': m28, 'game/enemies': m29, 'game/interact': m30, 'game/weapons': m31, 'world/tornado': m32, 'ui/screenfx': m33, 'game/weapon-fx': m34, 'game/update': m81, 'ui/hud': m35, 'ui/bigmap': m36, 'input/gamepad': m37, 'input/input': m38, 'game/hero-anim': m39, 'core/loop': m40, 'core/boot': m41, 'data/stats': m90, 'game/status': m91, 'game/items': m92, 'game/loot': m93, 'engine/eyes': m94, 'game/run': m95, 'game/weapons2': m96, 'data/enemies': m97, 'game/bosses': m98, 'game/graveyard': m99, 'data/challenges': m100, 'game/challenge': m101, 'ui/console': m102, 'geo/accessories': m103, 'engine/warm': m104, 'engine/iskin': m105, 'ui/actions': m106, 'ui/hesap': m107 };
const BOOT = [
  ['core/util', '__init_1'],
  ['geo/geo', '__init_2'],
  ['geo/models', '__init_3'],
  ['geo/anim', '__init_4'],
  ['world/mapgen', '__init_5'],
  ['world/mapm', '__init_6'],
  ['core/settings', '__init_7'],
  ['engine/color', '__init_8'],
  ['engine/renderer', '__init_9'],
  ['engine/renderer', '__init_10'],
  ['engine/renderer', '__init_11'],
  ['engine/renderer', '__init_12'],
  ['engine/renderer', '__init_13'],
  ['engine/renderer', '__init_14'],
  ['engine/renderer', '__init_15'],
  ['engine/renderer', '__init_15b'],
  ['engine/renderer', '__init_16'],
  ['world/terrain', '__init_17'],
  ['world/terrain', '__init_18'],
  ['world/terrain', '__init_19'],
  ['world/terrain', '__init_20'],
  ['world/terrain', '__init_21'],
  ['world/build', '__init_22'],
  ['world/build', '__init_23'],
  ['world/build', '__init_24'],
  ['world/build', '__init_25'],
  ['world/ambient', '__init_26'],
  ['world/ambient', '__init_27'],
  ['world/ambient', '__init_28'],
  ['game/heroes', '__init_29'],
  ['game/heroes', '__init_29b'],
  ['game/creatures', '__init_30'],
  ['engine/postfx', '__init_31'],
  ['engine/gfx', '__init_32'],
  ['engine/gfx', '__init_33'],
  ['engine/gfx', '__init_34'],
  ['engine/gfx', '__init_35'],
  ['engine/gfx', '__init_36'],
  ['data/content', '__init_37'],
  ['data/content', '__init_38'],
  ['ui/icons', '__init_39'],
  ['core/state', '__init_40'],
  ['audio/synth', '__init_41'],
  ['audio/engine', '__init_42'],
  ['audio/engine', '__init_43'],
  ['audio/engine', '__init_44'],
  ['audio/engine', '__init_45'],
  ['audio/engine', '__init_46'],
  ['audio/ambience', '__init_47'],
  ['audio/music', '__init_48'],
  ['core/helpers', '__init_49'],
  ['core/helpers', '__init_50'],
  ['engine/vfx', '__init_51'],
  ['engine/vfx', '__init_52'],
  ['game/stats', '__init_53'],
  ['game/stats', '__init_54'],
  ['game/objects', '__init_55'],
  ['game/objects', '__init_56'],
  ['game/objects', '__init_57'],
  ['game/objects', '__init_58'],
  ['game/loot', '__init_59b'],
  ['game/run', '__init_59c'],
  ['ui/menus', '__init_59'],
  ['ui/sayfa', '__init_sayfa'],
  ['ui/leaderboard', '__init_60'],
  ['ui/leaderboard', '__init_61'],
  ['ui/leaderboard', '__init_62'],
  ['game/enemies', '__init_63'],
  ['game/bosses', '__init_63b'],
  ['game/interact', '__init_64'],
  ['game/weapons', '__init_65'],
  ['game/weapons2', '__init_65b'],
  ['world/tornado', '__init_66'],
  ['ui/screenfx', '__init_67'],
  ['game/weapon-fx', '__init_68'],
  ['game/weapon-fx', '__init_69'],
  ['ui/hud', '__init_70'],
  ['ui/hud', '__init_71'],
  ['ui/hud', '__init_72'],
  ['ui/hud', '__init_73'],
  ['ui/bigmap', '__init_74'],
  ['input/gamepad', '__init_75'],
  ['game/hero-anim', '__init_77'],
  ['core/loop', '__init_78'],
  ['input/input', '__init_79'],
  ['core/boot', '__init_80'],
];

// Testler için modül adlarını ve durum alanlarını window üzerinden erişilebilir yap. YALNIZ geliştirme sunucusunda ve test
// derlemesinde (VITE_KOPRU=1 npm run build) kurulur; yayında kurulmaz: yoksa tarayıcı konsolundan `kills = 1000000` gibi tek
// satırla oyun durumu değiştirilebiliyordu (10 Kasım 2026'da sıralamaya böyle sahte skor yazıldı).
// Arayüz düğmeleri artık bu köprüye dayanmaz: ui/actions.js data-act ile modül işlevlerini doğrudan çağırır.
function bridge() {
  for (const mod of Object.values(MODS)) for (const [k, v] of Object.entries(mod)) {
    if (k.startsWith('__init_')) continue;
    try { Object.defineProperty(window, k, { get: () => mod[k], set: v2 => { throw new Error(k + ' salt okunur') }, configurable: true }) } catch (e) {}
  }
  for (const k of Object.keys($G)) {
    try { Object.defineProperty(window, k, { get: () => $G[k], set: v => { $G[k] = v }, configurable: true }) } catch (e) {}
  }
}
if (__KOPRU__) bridge();
m106.regActions(Object.values(MODS));
m106.__init_actions();
// Hesap açıksa (Supabase ayarlı yayın) önce giriş: hesabın kaydı tarayıcıya inmeden modüller başlatılmaz,
// çünkü ayarlar, ilerleme ve rekorlar açılışta okunur (ui/hesap.js).
// Simgeler, modeller ve yazı tipleri açılışta indirilir (ui/yukle.js): indirme hemen başlar, giriş ekranı açıkken
// arkasında sürer; modüller ancak hepsi inince kurulur, yükleme ekranı menü çizilince kalkar.
m108.yukBasla();
// uzaktan ayar (core/ayar.js) girişten ve modüllerden önce: bakım açıksa oyun hiç açılmaz, denge sabitleri kurulumdan önce yerinde olur
m109.ayarYukle()
  .then(a => (a.bakim ? new Promise(() => m108.yukBakim(a.bakim.mesaj)) : m107.hesapKapisi()))
  .then(() => m108.yukBekle())
  .then(() => m108.yukAsama('Dünya kuruluyor…'))
  .then(() => {
    try {
      for (const [m, f] of BOOT) MODS[m][f]();
      m109.duyuruCiz();
    } finally {
      requestAnimationFrame(() => m108.yukBitir());
      setTimeout(() => m108.yukBitir(), 400); // arka sekmede kare gelmez
    }
  });
