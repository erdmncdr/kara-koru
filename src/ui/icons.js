// ui/icons.js · Kara Koru
// Bu dosya tek dosyalık sürümden (v22) otomatik ayrıldı. Ortak oyun durumu core/store.js içindeki $G nesnesinde.

import { $G } from '../core/store.js';

export let IC, svg, iconCol;

// Boyalı simgeler (src/assets/ikon/<tür>_<anahtar>.webp; w silah, t tom, i eşya). tools/ikon-*.{mjs,sh} ile üretilir.
// Resmi olmayan anahtar eski SVG çizimine düşer.
const ART = import.meta.glob('../assets/ikon/*.webp', { eager: true, query: '?url', import: 'default' });
export const art = id => ART['../assets/ikon/' + id + '.webp'];
export const ikon = (id, ic, col, kind) => { const u = art(id); return u ? `<img class=ika src="${u}" alt="" draggable=false>` : svg(ic, col, kind); };

export function __init_39() {
  // ---- simgeler
  IC = {
    key: '<circle cx="10" cy="16" r="5"/><path d="M15 16h13M24 16v5M28 16v4"/>',
    rifle: '<path d="M4 20l18-9 5 2-3 3-14 7z"/><path d="M8 20l-2 6M22 11l3-5"/>',
    scarf: '<path d="M8 6h16v8H8z"/><path d="M10 14l-2 12h6l2-12M20 14l2 12h-6l-2-12"/>',
    cup: '<path d="M8 8h14v10a7 7 0 0 1-14 0z"/><path d="M22 11h3a3 3 0 0 1 0 6h-3M11 26h8"/>',
    fist: '<path d="M8 14v8a6 6 0 0 0 6 6h5a5 5 0 0 0 5-5v-7a2 2 0 0 0-4 0v-2a2 2 0 0 0-4 0v-1a2 2 0 0 0-4 0v1a2 2 0 0 0-4 0z"/>',
    hourglass: '<path d="M9 5h14M9 27h14"/><path d="M10 5c0 6 6 8 6 11s-6 5-6 11M22 5c0 6-6 8-6 11s6 5 6 11"/>',
    fork: '<path d="M16 28V13"/><path d="M11 4v6a5 5 0 0 0 10 0V4M16 4v9"/>',
    potion: '<path d="M13 4h6M14 4v6l-6 10a4 4 0 0 0 4 6h8a4 4 0 0 0 4-6l-6-10V4"/><circle cx="16" cy="21" r="1.5"/>',
    hammer: '<path d="M6 10h12v7H6z"/><path d="M18 11h6l2 2-2 2h-6"/><path d="M11 17l-1 11h4l-1-11"/>',
    orb: '<circle cx="16" cy="16" r="9"/><path d="M10 12c2-3 10-3 12 0"/>',
    cheese: '<path d="M4 20l24-9v11H4z"/><circle cx="12" cy="18" r="1.8"/><circle cx="20" cy="16" r="1.4"/>',
    snake: '<path d="M6 22c4-6 8 2 12-4s6-8 8-5"/><circle cx="26" cy="12" r="2"/>',
    flute: '<path d="M4 24L24 4"/><path d="M8 20l2 2M12 16l2 2M16 12l2 2"/>',
    doll: '<circle cx="16" cy="9" r="4"/><path d="M11 14h10l2 8H9z"/><path d="M12 22v6M20 22v6"/>',
    glove: '<path d="M10 28V14a3 3 0 0 1 6 0v-6a3 3 0 0 1 6 0v10a4 4 0 0 1-4 4h-4"/><path d="M16 8V5"/>',
    lamp: '<path d="M11 6h10l2 10H9z"/><path d="M14 16v6h4v-6M11 26h10"/>',
    ghost: '<path d="M8 28V14a8 8 0 0 1 16 0v14l-4-3-4 3-4-3z"/><circle cx="13" cy="13" r="1.5"/><circle cx="19" cy="13" r="1.5"/>',
    cactus: '<path d="M14 28V6a2 2 0 0 1 4 0v22"/><path d="M8 12v6a3 3 0 0 0 3 3h3M24 9v8a3 3 0 0 1-3 3h-3"/>',
    barrel: '<path d="M9 6h14l2 10-2 10H9L7 16z"/><path d="M8 11h16M8 21h16"/>',
    anvil: '<path d="M6 12h20l-4 4h-8l-2 6h12v4H8v-4h3l2-6H8z"/>',
    pot: '<path d="M8 12h16l-2 14H10z"/><path d="M6 12h20M12 8h8"/>',
    hat: '<path d="M8 24l8-18 8 18z"/><path d="M5 24h22"/>',
    mask: '<path d="M6 10c6-4 14-4 20 0v8c0 6-5 9-10 9S6 24 6 18z"/><path d="M11 16h4M17 16h4"/>',
    cloak: '<path d="M16 4l-8 6v18h16V10z"/><path d="M12 28V12M20 28V12"/>',
    mirror: '<ellipse cx="16" cy="13" rx="7" ry="9"/><path d="M16 22v6M12 28h8"/>',
    wrench: '<path d="M8 24l10-10a5 5 0 0 0 7-6l-3 3-3-3 3-3a5 5 0 0 0-6 7L6 22z"/>',
    pumpkin: '<path d="M8 13c-4 2-4 12 0 14h16c4-2 4-12 0-14-3-2-6-2-8 0-2-2-5-2-8 0z"/><path d="M16 4v8"/>',
    aegis: '<path d="M16 4l9 3v8c0 6-4 10-9 13-5-3-9-7-9-13V7z"/><path d="M12 16l3 3 5-6"/>',
    rocket: '<path d="M16 4c4 4 5 10 3 16h-6c-2-6-1-12 3-16z"/><path d="M13 20l-4 4h14l-4-4"/><circle cx="16" cy="12" r="2"/>',
    tornado: '<path d="M6 7h20M8 12h16M11 17h11M13 22h7M15 27h3"/>',
    dexe: '<path d="M6 24L22 8l4 4L12 26z"/><path d="M8 26l-3 3M20 6l4-2"/>',
    sniper: '<circle cx="16" cy="16" r="9"/><path d="M16 3v8M16 21v8M3 16h8M21 16h8"/>',
    noodle: '<path d="M4 20c4-6 8-6 12 0s8 6 12 0"/><path d="M4 12c4 6 8 6 12 0s8-6 12 0"/>',
    dragon: '<path d="M6 22c0-8 6-14 14-14l-3 5 9 1-6 4 4 5c-8 1-14-1-18-1z"/>',
    mines: '<circle cx="16" cy="18" r="7"/><path d="M16 5v6M8 9l4 4M24 9l-4 4"/>',
    flask: '<path d="M13 4h6M14 4v7l-7 13a2 2 0 0 0 2 3h14a2 2 0 0 0 2-3l-7-13V4"/><path d="M10 20h12"/>',
    katana: '<path d="M5 27L25 7"/><path d="M22 4l6 6"/><path d="M8 24l-2 4"/>',
    blood: '<path d="M16 4c5 7 8 11 8 16a8 8 0 0 1-16 0c0-5 3-9 8-16z"/><path d="M12 20a4 4 0 0 0 4 4"/>',
    dagger: '<path d="M8 24L22 10"/><path d="M19 6l7 7"/><path d="M8 24l-3 3M11 21l2 2"/>',
    dice: '<rect x="6" y="6" width="20" height="20" rx="3"/><circle cx="11" cy="11" r="1.6"/><circle cx="21" cy="11" r="1.6"/><circle cx="16" cy="16" r="1.6"/><circle cx="11" cy="21" r="1.6"/><circle cx="21" cy="21" r="1.6"/>',
    hero: '<path d="M16 4v18"/><path d="M10 12h12"/><path d="M13 22h6l-3 6z"/>',
    corrupt: '<path d="M16 4v18"/><path d="M9 11l7 3 7-3"/><path d="M13 22h6l-3 6z"/><path d="M6 6l4 4M26 6l-4 4"/>',
    shotgun: '<path d="M4 18l20-8h5v4l-19 7z"/><path d="M9 21l-3 6M26 10l2-4"/>',
    scythe: '<path d="M8 28L22 6"/><path d="M22 6c-8 0-14 4-16 10 6-2 12-1 16 2"/>',
    korizi: '<path d="M6 26c6-4 8-10 6-16 4 2 6 6 5 10 3-1 4-4 4-7 3 4 4 9 1 13H6z"/>',
    kb: '<path d="M4 16h14"/><path d="M12 10l6 6-6 6"/><path d="M22 8v16M26 10v12"/>',
    pspd: '<path d="M4 16h10"/><path d="M8 10l6 6-6 6"/><path d="M17 16h10"/><path d="M21 10l6 6-6 6"/>',
    dur: '<circle cx="16" cy="17" r="10"/><path d="M16 10v7l5 3"/><path d="M13 4h6"/>',
    eva: '<path d="M6 22c6-10 14-10 20 0"/><path d="M6 10c6 10 14 10 20 0"/>',
    shieldt: '<path d="M16 4l9 3v8c0 6-4 10-9 13-5-3-9-7-9-13V7z"/><path d="M16 8v18"/>',
    thorns: '<path d="M16 28V8"/><path d="M16 12l-5-4M16 16l6-4M16 20l-6-3M16 24l5-3"/>',
    silver: '<circle cx="16" cy="16" r="10"/><path d="M12 13h8M12 19h8"/>',
    chaos: '<path d="M6 16c4-8 8-8 10 0s6 8 10 0"/><path d="M6 10l3 3M26 22l-3-3M16 6v4M16 22v4"/>',
    scroll: '<path d="M8 6h14a3 3 0 0 1 3 3v17H11a3 3 0 0 1-3-3z"/><path d="M8 23a3 3 0 0 1 3-3h14"/><path d="M12 11h8M12 15h8"/>',
    slash: '<path d="M4 22C9 11 18 6 28 6"/><path d="M8 27c5-8 12-12 21-13"/><path d="M15 17l-9 9"/>',
    vortex: '<path d="M16 16a2 2 0 1 1 3 1.6 5 5 0 1 1-8.6-3.6 8 8 0 1 1 13 7.4 11 11 0 1 1-17-13"/>',
    bolt: '<path d="M6 26L24 8"/><path d="M16 7h9v9"/><path d="M5 20l7 7"/>',
    orbit: '<circle cx="16" cy="16" r="11" stroke-dasharray="4 3"/><path d="M9 23L20 12l3-5-5 3L7 21"/><path d="M6 26l3-3"/>',
    nova: '<circle cx="16" cy="16" r="3"/><circle cx="16" cy="16" r="8"/><circle cx="16" cy="16" r="13" stroke-dasharray="3 3"/>',
    zap: '<path d="M18 3L8 18h7l-2 11 11-16h-7z"/>',
    fire: '<path d="M16 29c-5.5 0-9-3.6-9-8.6 0-5.6 5.4-8.4 5.6-14.4 3 2 5 5 5.2 8.2 1.2-1 2-2.8 2.2-4.6 3.8 3 6 6.8 6 10.8 0 5-4.1 8.6-10 8.6z"/>',
    poi: '<path d="M16 4c5 7 8 11 8 15a8 8 0 0 1-16 0c0-4 3-8 8-15z"/><circle cx="13" cy="19" r="2"/>',
    axe: '<path d="M8 28L21 9"/><path d="M17 5c5-1 10 2 11 8-4-1-8 0-10 3"/>',
    aura: '<circle cx="16" cy="16" r="5"/><path d="M16 3v4M16 25v4M3 16h4M25 16h4M7 7l3 3M22 22l3 3M25 7l-3 3M10 22l-3 3"/>',
    ice: '<path d="M16 3v26M5 9.5l22 13M27 9.5l-22 13"/><path d="M13 5l3 3 3-3M13 27l3-3 3 3"/>',
    boom: '<path d="M6 8c8-2 14 2 16 10 1 4 0 7-2 9-1-6-5-10-12-12-2-2-3-4-2-7z"/>',
    sword: '<path d="M7 25L21 11l3-6-6 3L4 22"/><path d="M5 27l4-4"/><path d="M9 19l4 4"/>',
    chev: '<path d="M6 8l8 8-8 8"/><path d="M16 8l8 8-8 8"/>',
    dots: '<circle cx="8" cy="16" r="3"/><circle cx="16" cy="16" r="3"/><circle cx="24" cy="16" r="3"/>',
    expand: '<path d="M5 12V5h7"/><path d="M27 12V5h-7"/><path d="M5 20v7h7"/><path d="M27 20v7h-7"/><rect x="11" y="11" width="10" height="10"/>',
    target: '<circle cx="16" cy="16" r="10"/><circle cx="16" cy="16" r="3.5"/><path d="M16 2v7M16 23v7M2 16h7M23 16h7"/>',
    heart: '<path d="M16 27S5 20.5 5 12.5A5.5 5.5 0 0 1 16 10a5.5 5.5 0 0 1 11 2.5C27 20.5 16 27 16 27z"/>',
    plus: '<circle cx="16" cy="16" r="11"/><path d="M16 10v12M10 16h12"/>',
    shield: '<path d="M16 4l10 4v7c0 7-4.5 11-10 13C10.5 26 6 22 6 15V8z"/>',
    run: '<path d="M3 11h9M5 16h9M3 21h9"/><path d="M17 8l8 8-8 8"/>',
    magnet: '<path d="M8 5v11a8 8 0 0 0 16 0V5"/><path d="M8 10h5M19 10h5"/>',
    star: '<path d="M16 4l3.5 7.6 8.3.9-6.2 5.6 1.8 8.2L16 22.1l-7.4 4.2 1.8-8.2-6.2-5.6 8.3-.9z"/>',
    coin: '<circle cx="16" cy="16" r="11"/><circle cx="16" cy="16" r="5.5"/>',
    clover: '<circle cx="11" cy="11" r="4.5"/><circle cx="21" cy="11" r="4.5"/><circle cx="11" cy="21" r="4.5"/><circle cx="21" cy="21" r="4.5"/>',
    drop: '<path d="M16 4c5 7 8 11 8 15a8 8 0 0 1-16 0c0-4 3-8 8-15z"/>',
    skull: '<path d="M16 4c-6 0-10 4-10 10 0 3 1 5 3 6v4h14v-4c2-1 3-3 3-6 0-6-4-10-10-10z"/><circle cx="12" cy="14" r="2"/><circle cx="20" cy="14" r="2"/><path d="M13 24v3M16 24v3M19 24v3"/>',
    boot: '<path d="M11 4h7v13l8 4v6H7v-6l4-4z"/>',
    bone: '<path d="M10 22l12-12"/><circle cx="8" cy="20" r="2.6"/><circle cx="12" cy="24" r="2.6"/><circle cx="20" cy="8" r="2.6"/><circle cx="24" cy="12" r="2.6"/>',
    whet: '<path d="M5 20l12-12 10 4-12 12z"/>',
    ring: '<circle cx="16" cy="19" r="8"/><path d="M12 9l4-5 4 5z"/>',
    meat: '<path d="M20 5c5 0 8 4 7 9-1 6-8 10-13 9l-5 5-3-3 5-5c-1-6 3-15 9-15z"/>',
    feather: '<path d="M25 5C13 7 8 15 7 27"/><path d="M25 5c1 9-5 16-15 17"/><path d="M12 19h6M14 14h7"/>',
    bag: '<path d="M7 12h18v15H7z"/><path d="M12 12V7h8v5"/><path d="M7 18h18"/>',
    gem: '<path d="M16 4l9 8-9 16-9-16z"/><path d="M7 12h18"/>',
    eye: '<path d="M3 16s5-8 13-8 13 8 13 8-5 8-13 8S3 16 3 16z"/><circle cx="16" cy="16" r="4"/>',
    compass: '<circle cx="16" cy="16" r="12"/><path d="M20 12l-2.5 5.5L12 20l2.5-5.5z"/>',
    claw: '<path d="M8 26c2-8 0-14-3-19"/><path d="M15 27c2-9 1-15-2-21"/><path d="M22 26c3-7 3-13 0-19"/>',
    wolf: '<path d="M6 26l2-15 5 5h6l5-5 2 15-10 3z"/>',
    scale: '<path d="M16 4c6 4 10 9 10 15a10 10 0 0 1-20 0c0-6 4-11 10-15z"/><path d="M11 16c3 2 7 2 10 0M10 22c4 2 8 2 12 0"/>'
  };
  // ---- özgün çizimler: fonksiyon simgeler ana rengi (c) alır, kendi dolgularını taşır (silahlar, tomlar, sık eşyalar)
  const K = { wood: '#8a5a3a', steel: '#d6dde6', steel2: '#8d98a6', gold: '#f0c45a', dark: '#2a2026', red: '#d9453a', white: '#fff6e8', green: '#6fbf5a', blue: '#5aa8e8', purple: '#a070e0', bone: '#efe4c8', fire: '#ff8a3a' };
  const glove = c => `<path d="M10 28V14a3 3 0 0 1 6 0v-6a3 3 0 0 1 6 0v10a4 4 0 0 1-4 4h-4z" fill="${c}"/><path d="M16 8V5" stroke="${c}" stroke-width="3"/><path d="M10 24h8" stroke="${K.dark}" stroke-width="1.5"/>`,
    ring = c => `<circle cx="16" cy="18" r="8" fill="none" stroke="${c}" stroke-width="4"/><circle cx="16" cy="18" r="8" fill="none" stroke="${K.white}" stroke-width="1" stroke-opacity=".5"/>`,
    shield = c => `<path d="M16 3l10 3v9c0 6-4 10-10 14-6-4-10-8-10-14V6z" fill="${c}"/><path d="M16 7v18" stroke="${K.dark}" stroke-width="1.2" stroke-opacity=".5"/>`,
    mask = c => `<path d="M6 10c6-4 14-4 20 0v8c0 6-5 9-10 9S6 24 6 18z" fill="${c}"/>`,
    key = c => `<circle cx="10" cy="16" r="6" fill="none" stroke="${c}" stroke-width="3.5"/><path d="M16 16h13M24 16v5M28 16v4" stroke="${c}" stroke-width="3"/>`;
  Object.assign(IC, {
    // silahlar
    bolt: c => `<path d="M5 27L19 13" stroke="${K.steel}" stroke-width="2.6"/><path d="M19 13l-1 7 8-6z" fill="${c}"/><path d="M5 27l1-6M5 27l6-1" stroke="${c}" stroke-width="2.4"/><path d="M13 26L25 14" stroke="${K.steel}" stroke-width="2"/><path d="M25 14l-1 6 7-5z" fill="${c}"/>`,
    orbit: c => `<circle cx="16" cy="16" r="9" fill="none" stroke="${c}" stroke-width="2" stroke-dasharray="4 3"/><path d="M16 3l2 6-2 2-2-2z" fill="${K.steel}"/><path d="M16 3l2 6-2 2-2-2z" fill="${K.steel}" transform="rotate(120 16 16)"/><path d="M16 3l2 6-2 2-2-2z" fill="${K.steel}" transform="rotate(240 16 16)"/><circle cx="16" cy="16" r="2.5" fill="${c}"/>`,
    nova: c => `<circle cx="16" cy="16" r="12" fill="none" stroke="${c}" stroke-width="2"/><circle cx="16" cy="16" r="7" fill="none" stroke="${c}" stroke-width="2.6"/><circle cx="16" cy="16" r="3" fill="${K.white}"/>`,
    zap: c => `<path d="M18 3L8 18h7l-2 11 11-16h-7z" fill="${c}"/><path d="M15 18l-1 6" stroke="${K.white}" stroke-width="1.5"/>`,
    fire: c => `<path d="M16 3c3 5 8 7 8 14a8 8 0 0 1-16 0c0-4 2-6 3-9 1 3 2 4 3 4 0-4 1-6 2-9z" fill="${c}"/><path d="M16 29a4 4 0 0 1-4-4c0-2 1-3 2-5 1 2 2 2 2 2 0-2 .5-3 1-4 2 2 3 4 3 7a4 4 0 0 1-4 4z" fill="${K.white}"/>`,
    poi: c => `<path d="M4 24c5-6 9 2 14-4s7-6 10-3" fill="none" stroke="${c}" stroke-width="3"/><path d="M8 10c2 3 2 4 0 6-2-2-2-3 0-6zM24 7c2 3 2 4 0 6-2-2-2-3 0-6z" fill="${K.green}"/>`,
    axe: c => `<path d="M9 28L22 9" stroke="${K.wood}" stroke-width="3.2"/><path d="M14 6c6-3 11 0 13 5-4 1-7 4-8 8-4-2-8-4-5-13z" fill="${K.steel}"/><path d="M27 11c-4 1-7 4-8 8" stroke="${c}" stroke-width="2"/>`,
    aura: c => `<circle cx="16" cy="16" r="10" fill="none" stroke="${c}" stroke-width="3.5"/><circle cx="16" cy="16" r="10" fill="none" stroke="${K.white}" stroke-width="1" stroke-dasharray="3 5"/><circle cx="16" cy="16" r="4" fill="${c}"/>`,
    ice: c => `<path d="M16 3v26M5 9.5l22 13M27 9.5L5 22.5" stroke="${c}" stroke-width="2.6"/><path d="M12 6l4 3 4-3M12 26l4-3 4 3M4 14l5 2-1 5M28 14l-5 2 1 5" stroke="${c}" stroke-width="2"/><circle cx="16" cy="16" r="3" fill="${K.white}"/>`,
    slash: c => `<path d="M6 26C10 14 18 8 28 6c-2 8-8 16-18 20z" fill="${K.steel}"/><path d="M28 6c-2 8-8 16-18 20" stroke="${c}" stroke-width="2"/><path d="M6 26l4-4" stroke="${K.dark}" stroke-width="3"/>`,
    vortex: c => `<path d="M16 16c0-3 4-3 4 0s-4 6-8 3-3-10 3-11 12 2 11 9-8 11-14 8" fill="none" stroke="${c}" stroke-width="3"/>`,
    boom: c => `<path d="M6 10c6-6 12-4 20 2l-4 4c-6-4-10-4-12 2z" fill="${c}"/><path d="M6 10l4 4c-2 4-1 8 2 12l-4 2c-5-6-6-13-2-18z" fill="${K.bone}"/>`,
    bone: c => `<path d="M9 10a3 3 0 1 1 3-3l8 8a3 3 0 1 1 3 3 3 3 0 1 1-3 3l-8-8a3 3 0 1 1-3-3z" fill="${K.bone}"/><path d="M12 12l8 8" stroke="${c}" stroke-width="1.6"/>`,
    rifle: c => `<path d="M3 20l17-7h7" stroke="${K.steel2}" stroke-width="3.2"/><path d="M4 21l-1 7h4l2-6z" fill="${K.wood}"/><path d="M12 17l6-2v4l-6 1z" fill="${K.wood}"/><path d="M20 13h8" stroke="${c}" stroke-width="2"/>`,
    aegis: c => `<path d="M16 3l10 3v9c0 6-4 10-10 14-6-4-10-8-10-14V6z" fill="${c}"/><path d="M16 7l6 2v6c0 4-3 7-6 9-3-2-6-5-6-9V9z" fill="${K.steel}"/><circle cx="16" cy="14" r="2.5" fill="${K.gold}"/>`,
    rocket: c => `<path d="M16 3c4 4 5 10 3 16h-6c-2-6-1-12 3-16z" fill="${K.steel}"/><path d="M16 3c2 2 3 4 3.5 6h-7c.5-2 1.5-4 3.5-6z" fill="${K.red}"/><path d="M13 19l-4 4h14l-4-4z" fill="${c}"/><circle cx="16" cy="12" r="2" fill="${K.blue}"/><path d="M14 23l2 6 2-6z" fill="${K.fire}"/>`,
    tornado: c => `<ellipse cx="16" cy="7" rx="11" ry="3.5" fill="${c}"/><ellipse cx="16" cy="13" rx="8" ry="2.8" fill="${c}"/><ellipse cx="17" cy="18.5" rx="5.5" ry="2.2" fill="${c}"/><ellipse cx="16" cy="23" rx="3.5" ry="1.8" fill="${c}"/><ellipse cx="17" cy="27" rx="2" ry="1.3" fill="${c}"/>`,
    dexe: c => `<path d="M8 7h16l4 10c-2 2-5 3-8 3H8z" fill="${K.steel}"/><path d="M8 20h12v2H8z" fill="${K.dark}"/><path d="M4 22h5v6H4z" fill="${K.wood}"/><circle cx="22" cy="10" r="1.5" fill="${K.dark}"/><path d="M14 13l3 5" stroke="${c}" stroke-width="2"/>`,
    sniper: c => `<path d="M3 22l20-8h6" stroke="${K.steel2}" stroke-width="3"/><path d="M4 23l-1 6h4l2-5z" fill="${K.wood}"/><rect x="12" y="8" width="9" height="4" rx="2" fill="${c}"/><path d="M16 12v3" stroke="${K.dark}" stroke-width="1.5"/>`,
    noodle: c => `<path d="M4 26L24 6" stroke="${c}" stroke-width="5"/><path d="M4 26L24 6" stroke="${K.white}" stroke-width="1.8"/><path d="M24 6l4-2M24 6l2 4M24 6l-1-4" stroke="${K.white}" stroke-width="2"/>`,
    dragon: c => `<path d="M6 20c2-8 8-12 16-11 3 0 5 2 6 5-3 0-5 1-6 3l-4 1c-2 2-5 3-8 3-2 0-3 0-4-1z" fill="${c}"/><circle cx="21" cy="12.5" r="1.5" fill="${K.dark}"/><path d="M22 18l3 3 2-4 3 5 1-6z" fill="${K.fire}"/><path d="M12 9l2-5 2 5zM17 8l1-4 2 4z" fill="${c}"/>`,
    mines: c => `<path d="M4 16c0-6 5-9 12-9s12 3 12 9H4z" fill="${K.steel2}"/><path d="M4 16c0 6 5 9 12 9s12-3 12-9H4z" fill="${K.steel}"/><path d="M7 16l2-3 2 3 2-3 2 3 2-3 2 3 2-3 2 3 2-3 2 3" fill="none" stroke="${K.dark}" stroke-width="1.5"/><circle cx="16" cy="16" r="3" fill="${c}"/>`,
    flask: c => `<path d="M13 4h6M14 4v6l-6 10a4 4 0 0 0 4 6h8a4 4 0 0 0 4-6l-6-10V4" fill="${K.white}" fill-opacity=".3" stroke="${K.steel}" stroke-width="1"/><path d="M9.5 19l3.5-6h6l3.5 6c1 2-1 5-3 5h-7c-2 0-4-3-3-5z" fill="${c}"/><circle cx="14" cy="21" r="1.2" fill="${K.white}"/>`,
    katana: c => `<path d="M6 26C12 20 20 12 27 4c0 6-4 14-16 22z" fill="${K.steel}"/><path d="M27 4c0 6-4 14-16 22" stroke="${K.white}" stroke-width="1.2"/><path d="M4 28l4-4" stroke="${c}" stroke-width="3.5"/><path d="M8 24l2 2" stroke="${K.gold}" stroke-width="2"/>`,
    blood: c => `<path d="M16 3c5 7 9 11 9 17a9 9 0 0 1-18 0c0-6 4-10 9-17z" fill="${K.red}"/><path d="M12 20c0 3 2 5 4 5" stroke="${K.white}" stroke-width="1.8" fill="none"/><path d="M16 11c3 3 4 6 2 9" stroke="${c}" stroke-width="1.8" fill="none"/>`,
    dagger: c => `<path d="M16 3l4 12-4 14-4-14z" fill="${K.steel}"/><path d="M16 3v26" stroke="${K.dark}" stroke-width="1"/><path d="M10 15h12" stroke="${K.gold}" stroke-width="2.6"/><path d="M8 11c-3-3-3-7 0-9 1 4 3 6 5 8zM24 11c3-3 3-7 0-9-1 4-3 6-5 8z" fill="${c}"/>`,
    dice: c => `<path d="M8 12c0-4 3-6 8-6s8 2 8 6c0 2-1 3-2 5 1 2 2 3 2 5 0 4-3 6-8 6s-8-2-8-6c0-2 1-3 2-5-1-2-2-3-2-5z" fill="${K.bone}"/><circle cx="12" cy="12" r="1.6" fill="${c}"/><circle cx="20" cy="12" r="1.6" fill="${c}"/><circle cx="16" cy="18" r="1.6" fill="${c}"/><circle cx="12" cy="23" r="1.6" fill="${c}"/><circle cx="20" cy="23" r="1.6" fill="${c}"/>`,
    hero: c => `<path d="M16 3l3 4v13l-3 3-3-3V7z" fill="${K.steel}"/><path d="M16 5v16" stroke="${K.white}" stroke-width="1.2"/><path d="M9 21h14" stroke="${K.gold}" stroke-width="3"/><path d="M14 23h4v5h-4z" fill="${c}"/><circle cx="16" cy="29" r="1.5" fill="${K.gold}"/>`,
    corrupt: c => `<path d="M16 3l4 3-1 5 2 3-2 4 1 3-4 2-4-2 1-3-2-4 2-3-1-5z" fill="${K.purple}"/><path d="M9 22h14" stroke="${K.dark}" stroke-width="3"/><path d="M14 24h4v5h-4z" fill="${K.dark}"/><path d="M16 6v14" stroke="${c}" stroke-width="1.6"/>`,
    shotgun: c => `<path d="M3 19l17-6h8M3 22l17-6" stroke="${K.steel2}" stroke-width="2.8"/><path d="M4 23l-1 6h5l2-6z" fill="${K.wood}"/><path d="M11 17l6-2v4l-6 2z" fill="${K.wood}"/><circle cx="28" cy="13" r="1.3" fill="${c}"/><circle cx="28" cy="16" r="1.3" fill="${c}"/>`,
    scythe: c => `<path d="M8 29L22 7" stroke="${K.wood}" stroke-width="3"/><path d="M22 7c-8-2-15 1-18 6 6-1 12-1 18 3 1-3 1-6 0-9z" fill="${K.steel}"/><path d="M4 13c6-1 12-1 18 3" stroke="${c}" stroke-width="1.6"/>`,
    korizi: c => `<path d="M3 26c4-3 8-3 12 0s8 3 14 0" stroke="${c}" stroke-width="3" fill="none"/><path d="M9 20c1-3 2-5 1-8 3 2 4 5 3 8zM17 18c1-4 3-6 2-10 3 3 5 6 3 10zM25 21c0-2 1-4 0-6 2 2 3 4 2 6z" fill="${K.fire}"/>`,
    // sık eşyalar
    whet: c => `<path d="M13 4h6v4h-6z" fill="${K.dark}"/><path d="M12 8h8l3 6v12a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2V14z" fill="${c}"/><path d="M13 14h6v7h-6z" fill="${K.white}" fill-opacity=".7"/>`,
    scarf: c => `<path d="M8 6h16v8H8z" fill="${c}"/><path d="M8 9h16M8 12h16" stroke="${K.white}" stroke-width="1" stroke-opacity=".6"/><path d="M10 14l-2 12h6l2-12zM20 14l2 12h-6l-2-12z" fill="${c}"/><path d="M9 25h5M18 25h5" stroke="${K.white}" stroke-width="1.5"/>`,
    cup: c => `<path d="M6 11h20l-3 13a4 4 0 0 1-4 3h-6a4 4 0 0 1-4-3z" fill="${c}"/><ellipse cx="16" cy="11" rx="10" ry="3" fill="${K.white}"/><path d="M12 29h8" stroke="${K.dark}" stroke-width="2"/>`,
    cup2: c => `<path d="M9 5h14l-2 8a5 5 0 0 1-10 0z" fill="${c}"/><path d="M16 18v7M11 26h10" stroke="${K.gold}" stroke-width="2.5"/><path d="M11 7h10" stroke="${K.white}" stroke-width="1.2"/>`,
    hourglass: c => `<path d="M8 4h16M8 28h16" stroke="${K.wood}" stroke-width="3"/><path d="M10 5c0 6 6 8 6 11s-6 5-6 11h12c0-6-6-8-6-11s6-5 6-11z" fill="${K.white}" fill-opacity=".3" stroke="${K.steel}" stroke-width="1"/><path d="M12 24c0-2 3-4 4-5 1 1 4 3 4 5z" fill="${c}"/><path d="M11 6h10l-5 6z" fill="${c}"/>`,
    target: c => `<circle cx="16" cy="16" r="11" fill="none" stroke="${c}" stroke-width="2.6"/><circle cx="16" cy="16" r="5" fill="none" stroke="${c}" stroke-width="2.4"/><path d="M16 2v7M16 23v7M2 16h7M23 16h7" stroke="${c}" stroke-width="2.6"/><circle cx="16" cy="16" r="1.8" fill="${K.red}"/>`,
    cheese: c => `<path d="M4 20l24-9v11H4z" fill="${c}"/><path d="M4 20l24-9" stroke="${K.white}" stroke-width="1.5"/><circle cx="12" cy="18" r="1.8" fill="${K.dark}" fill-opacity=".5"/><circle cx="20" cy="16" r="1.4" fill="${K.dark}" fill-opacity=".5"/><circle cx="17" cy="20" r="1" fill="${K.dark}" fill-opacity=".5"/>`,
    glove,
    glove2: c => glove(c) + `<path d="M24 3l-3 5h4l-3 5" stroke="${K.gold}" stroke-width="2" fill="none"/>`,
    glove3: c => glove(c) + `<path d="M24 5c1.5 2 1.5 3 0 4.5-1.5-1.5-1.5-2.5 0-4.5zM27 10c1.2 1.5 1.2 2.4 0 3.6-1.2-1.2-1.2-2.1 0-3.6z" fill="${K.green}"/>`,
    glove4: c => glove(c) + `<path d="M25 4c2.5 3 2.5 5 0 7.5-2.5-2.5-2.5-4.5 0-7.5z" fill="${K.red}"/>`,
    glove5: c => glove(c) + `<path d="M22 4l5 5M27 4l-5 5" stroke="${K.purple}" stroke-width="2"/>`,
    bag: c => `<path d="M8 12h16v15a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2z" fill="${c}"/><path d="M11 12V9a5 5 0 0 1 10 0v3" fill="none" stroke="${K.wood}" stroke-width="2.4"/><path d="M11 19h10" stroke="${K.dark}" stroke-width="2"/><rect x="13" y="21" width="6" height="5" fill="${K.wood}"/>`,
    cactus: c => `<path d="M13 28V8a3 3 0 0 1 6 0v20z" fill="${c}"/><path d="M8 12v6a3 3 0 0 0 3 3h2M24 9v8a3 3 0 0 1-3 3h-2" fill="none" stroke="${c}" stroke-width="4"/><path d="M10 28h12" stroke="${K.wood}" stroke-width="2.5"/><circle cx="16" cy="7" r="1.6" fill="${K.red}"/>`,
    plus: c => `<rect x="6" y="11" width="20" height="10" rx="5" fill="${K.bone}"/><path d="M11 11v10M16 11v10M21 11v10" stroke="${K.steel2}" stroke-width="1"/><path d="M16 4v24M4 16h24" stroke="${c}" stroke-width="3"/>`,
    meat2: c => `<path d="M5 20c6-9 16-9 22 0-6 9-16 9-22 0z" fill="${c}"/><path d="M9 20h14" stroke="${K.white}" stroke-width="1.5"/><path d="M5 20c6-9 16-9 22 0" stroke="${K.red}" stroke-width="1.5" fill="none"/>`,
    meat3: c => `<ellipse cx="16" cy="17" rx="12" ry="8" fill="${K.bone}"/><ellipse cx="16" cy="17" rx="9" ry="5.5" fill="${K.red}"/><circle cx="12" cy="16" r="1.3" fill="${K.green}"/><circle cx="18" cy="19" r="1.3" fill="${K.green}"/><circle cx="19" cy="15" r="1" fill="${K.dark}"/>`,
    gem: c => `<path d="M16 4l9 7-9 17-9-17z" fill="${c}"/><path d="M7 11h18M16 4l-4 7 4 17 4-17z" stroke="${K.white}" stroke-width="1.2" fill="none"/>`,
    ring,
    ring2: c => ring(c) + `<path d="M12 9l4-5 4 5-4 4z" fill="${K.blue}"/>`,
    ring3: c => ring(c) + `<path d="M8 8l-3-2M24 8l3-2M16 6V3" stroke="${c}" stroke-width="2"/>`,
    ring4: c => ring(c) + `<ellipse cx="16" cy="6" rx="6" ry="2" fill="none" stroke="${K.gold}" stroke-width="2"/>`,
    cloak: c => `<path d="M16 4l-8 6v18h16V10z" fill="${c}"/><path d="M16 4l-3 6h6z" fill="${K.dark}"/><path d="M12 28V12M20 28V12" stroke="${K.dark}" stroke-width="1.2" stroke-opacity=".6"/><circle cx="16" cy="12" r="1.5" fill="${K.gold}"/>`,
    shield,
    shield2: c => shield(c) + `<path d="M16 3l-2-3h4zM6 6L3 4l3 0zM26 6l3-2-3 0z" fill="${K.steel}"/>`,
    shield3: c => shield(c) + `<circle cx="16" cy="15" r="4" fill="${K.gold}"/>`,
    shield4: c => shield(c) + `<path d="M11 12h10M11 18h10" stroke="${K.steel}" stroke-width="2.4"/>`,
    mask,
    mask2: c => mask(c) + `<circle cx="12" cy="16" r="2.6" fill="${K.dark}"/><circle cx="20" cy="16" r="2.6" fill="${K.dark}"/><path d="M13 24h6" stroke="${K.dark}" stroke-width="2"/>`,
    mask3: c => mask(c) + `<path d="M11 16h4M17 16h4" stroke="${K.dark}" stroke-width="2"/><path d="M9 11l3 4-2 5" stroke="${K.dark}" stroke-width="1.5" fill="none"/>`,
    boot: c => `<path d="M9 4h8v12l8 5v5H9z" fill="${c}"/><path d="M9 26h16v2H9z" fill="${K.dark}"/><path d="M9 10h8M9 14h8" stroke="${K.dark}" stroke-width="1.2" stroke-opacity=".6"/>`,
    feather: c => `<path d="M24 4c-9 1-16 8-18 20 8 0 16-6 18-20z" fill="${c}"/><path d="M6 24L22 6" stroke="${K.white}" stroke-width="1.4"/><path d="M6 24l-2 4" stroke="${K.dark}" stroke-width="2"/>`,
    chev: c => `<path d="M10 3c8 6 8 20 0 26" fill="none" stroke="${K.wood}" stroke-width="3"/><path d="M10 3v26" stroke="${c}" stroke-width="1.6"/><path d="M10 16h14M24 16l-3-2M24 16l-3 2" stroke="${K.steel}" stroke-width="2"/>`,
    clover: c => `<circle cx="12" cy="12" r="5" fill="${c}"/><circle cx="20" cy="12" r="5" fill="${c}"/><circle cx="12" cy="20" r="5" fill="${c}"/><circle cx="20" cy="20" r="5" fill="${c}"/><path d="M16 20l-2 9" stroke="${K.green}" stroke-width="2"/>`,
    key,
    scroll: c => `<path d="M8 6h16v20H8z" fill="${K.bone}"/><path d="M8 6a3 3 0 0 0 0 6M24 6a3 3 0 0 1 0 6M8 20a3 3 0 0 0 0 6M24 20a3 3 0 0 1 0 6" fill="none" stroke="${K.wood}" stroke-width="2.5"/><path d="M12 12h8M12 16h8M12 20h5" stroke="${c}" stroke-width="1.6"/>`,
    wrench: c => `<path d="M6 10h12v7H6z" fill="${K.steel}"/><path d="M18 11h6l2 2-2 2h-6z" fill="${K.steel2}"/><path d="M11 17l-1 11h4l-1-11z" fill="${K.wood}"/><path d="M8 12h8" stroke="${c}" stroke-width="1.2"/>`,
    // stat ve tom sembolleri
    sword: c => `<path d="M16 3l3 4v12l-3 3-3-3V7z" fill="${K.steel}"/><path d="M16 5v15" stroke="${K.white}" stroke-width="1.2"/><path d="M10 21h12" stroke="${c}" stroke-width="3"/><path d="M14 23h4v5h-4z" fill="${K.wood}"/><path d="M6 8l3 3M26 8l-3 3" stroke="${c}" stroke-width="2"/>`,
    dots: c => `<circle cx="8" cy="16" r="4.2" fill="${c}"/><circle cx="16" cy="16" r="4.2" fill="${c}"/><circle cx="24" cy="16" r="4.2" fill="${c}"/><circle cx="7" cy="14.5" r="1.2" fill="${K.white}"/><circle cx="15" cy="14.5" r="1.2" fill="${K.white}"/><circle cx="23" cy="14.5" r="1.2" fill="${K.white}"/>`,
    expand: c => `<rect x="10" y="10" width="12" height="12" rx="2" fill="${c}"/><path d="M4 11V4h7M21 4h7v7M28 21v7h-7M11 28H4v-7" fill="none" stroke="${c}" stroke-width="2.6"/><path d="M4 4l5 5M28 4l-5 5M28 28l-5-5M4 28l5-5" stroke="${K.white}" stroke-width="1.6"/>`,
    kb: c => `<path d="M4 16h14" stroke="${c}" stroke-width="3.4"/><path d="M14 9l8 7-8 7z" fill="${c}"/><path d="M24 9c3 2 4 5 4 7s-1 5-4 7M26 5c4 3 5 8 5 11s-1 8-5 11" fill="none" stroke="${K.white}" stroke-width="2"/>`,
    pspd: c => `<path d="M6 16h16" stroke="${c}" stroke-width="3.2"/><path d="M18 9l10 7-10 7z" fill="${c}"/><path d="M3 10h8M2 16h3M3 22h8" stroke="${K.white}" stroke-width="2"/>`,
    dur: c => `<circle cx="16" cy="17" r="11" fill="${K.bone}"/><circle cx="16" cy="17" r="11" fill="none" stroke="${c}" stroke-width="2.6"/><path d="M16 10v7l5 3" fill="none" stroke="${K.dark}" stroke-width="2.4"/><path d="M12 4h8M16 4v2" stroke="${c}" stroke-width="2.4"/>`,
    eva: c => `<path d="M26 6L8 24" stroke="${K.steel2}" stroke-width="2.6"/><path d="M26 6l-7 1 6 6z" fill="${K.steel2}"/><path d="M8 24c-2-4-2-8 0-12 3 3 5 7 4 12z" fill="${c}"/><path d="M5 9c3 1 5 3 6 6M3 15c2 0 4 1 5 3" stroke="${K.white}" stroke-width="1.6" fill="none"/>`,
    shieldt: c => `<path d="M16 3l10 3v9c0 6-4 10-10 14-6-4-10-8-10-14V6z" fill="${c}"/><path d="M16 9v12M10 15h12" stroke="${K.white}" stroke-width="3"/>`,
    thorns: c => `<circle cx="16" cy="16" r="7" fill="${c}"/><path d="M16 9V3M16 23v6M9 16H3M23 16h6M11 11L7 7M21 11l4-4M11 21l-4 4M21 21l4 4" stroke="${K.green}" stroke-width="2.4"/><path d="M16 3l-2 3h4zM3 16l3-2v4zM29 16l-3-2v4zM16 29l-2-3h4z" fill="${K.green}"/>`,
    silver: c => `<ellipse cx="16" cy="22" rx="10" ry="4" fill="${K.steel2}"/><ellipse cx="16" cy="18" rx="10" ry="4" fill="${K.steel}"/><ellipse cx="16" cy="14" rx="10" ry="4" fill="${K.steel2}"/><ellipse cx="16" cy="10" rx="10" ry="4" fill="${K.steel}"/><ellipse cx="16" cy="10" rx="6" ry="2" fill="${c}"/>`,
    chaos: c => `<path d="M16 16c0-3 4-3 4 0s-4 6-8 3-3-10 3-11 12 2 11 9-8 11-14 8" fill="none" stroke="${c}" stroke-width="3"/><path d="M6 6l2 2M26 5l-2 2M27 25l-2-2M8 27l1-2" stroke="${K.gold}" stroke-width="2.2"/><circle cx="16" cy="16" r="1.6" fill="${K.white}"/>`,
    coin: c => `<circle cx="16" cy="16" r="11" fill="${K.gold}"/><circle cx="16" cy="16" r="7.5" fill="none" stroke="${K.dark}" stroke-width="1.2" stroke-opacity=".5"/><path d="M16 10v12M12.5 13h5a2.5 2.5 0 0 1 0 5h-3a2.5 2.5 0 0 0 0 5h5" fill="none" stroke="${K.dark}" stroke-width="1.8"/><path d="M9 11c2-2 4-3 7-3" stroke="${K.white}" stroke-width="1.6" fill="none"/>`,
    // kahraman portreleri (büst): omuzlar ana renk, baş ten, başlık karaktere özgü
    ...(() => {
      const SK = '#e8b89a', SK2 = '#c89070', HAIR = '#3a2a22',
        face = (sk = SK, eye = K.dark) => `<circle cx="16" cy="16" r="7.5" fill="${sk}"/><circle cx="13.3" cy="16" r="1.1" fill="${eye}"/><circle cx="18.7" cy="16" r="1.1" fill="${eye}"/>`,
        sh = c => `<path d="M5 29c1-5 5-7 11-7s10 2 11 7z" fill="${c}"/>`,
        must = `<path d="M12.5 19.5c2-1.2 5-1.2 7 0" stroke="${HAIR}" stroke-width="1.8" fill="none"/>`;
      return {
        h_alp: c => sh(c) + face() + `<path d="M8 16c0-7 3-11 8-13 5 2 8 6 8 13z" fill="${K.steel}"/><path d="M16 9v9" stroke="${K.steel}" stroke-width="2.4"/><path d="M16 3c3 1 5 3 6 6" stroke="${K.red}" stroke-width="2.6" fill="none"/>`,
        h_kam: c => sh(c) + face() + `<path d="M9 12l-2-9M16 10l0-8M23 12l2-9" stroke="${K.bone}" stroke-width="2.6"/><path d="M8 13h16" stroke="${K.red}" stroke-width="2.4"/><path d="M11 18l2 1M21 18l-2 1" stroke="${K.red}" stroke-width="1.4"/>`,
        h_golge: c => sh(c) + `<path d="M7 24c0-10 4-16 9-18 5 2 9 8 9 18z" fill="${c}"/><circle cx="16" cy="17" r="6" fill="${K.dark}"/><circle cx="13.5" cy="17" r="1.3" fill="#9fe8d8"/><circle cx="18.5" cy="17" r="1.3" fill="#9fe8d8"/>`,
        h_bahadir: c => sh(c) + face() + must + `<path d="M7 13c1-5 4-8 9-8s8 3 9 8z" fill="${HAIR}"/><path d="M7 13h18v3H7z" fill="${c}"/>`,
        h_boru: c => sh(c) + face() + `<path d="M8 15c0-6 3-9 8-9s8 3 8 9l-3-2h-10z" fill="${K.steel2}"/><path d="M9 8l-2-5 4 3zM23 8l2-5-4 3z" fill="${K.steel2}"/><path d="M14 8h4l-2 3z" fill="${K.dark}"/>`,
        h_ayaz: c => sh(c) + face('#eadbd0', '#4a90d8') + `<path d="M8 14l1-8 3 5 2-7 2 7 2-7 2 7 3-5 1 8z" fill="#cfefff"/><path d="M21 21l2-2M22 19l1 3M21 20l3 0" stroke="#9ee6ff" stroke-width="1.2"/>`,
        h_karahan: c => sh(c) + face(SK2) + `<path d="M8 12l2-7 3 4 3-5 3 5 3-4 2 7z" fill="${K.dark}"/><path d="M10 5l0-1M16 4v-1M22 5v-1" stroke="${K.gold}" stroke-width="2"/><path d="M8 12h16" stroke="${K.gold}" stroke-width="1.6"/><path d="M12 21c2 3 6 3 8 0v4H12z" fill="${HAIR}"/>`,
        h_tunc: c => sh(c) + face(SK2) + `<path d="M8 16c0-7 3-11 8-12 5 1 8 5 8 12z" fill="#c8904a"/><path d="M8 12c-3-2-4-5-3-9 2 2 3 4 4 7M24 12c3-2 4-5 3-9-2 2-3 4-4 7" fill="#c8904a"/><path d="M11 15h10" stroke="${K.dark}" stroke-width="1.4"/>`,
        h_kemik: c => sh(c) + `<path d="M7 22c0-10 4-15 9-15s9 5 9 15z" fill="${c}"/><circle cx="16" cy="16" r="7" fill="${K.bone}"/><circle cx="13.2" cy="15.5" r="1.8" fill="${K.dark}"/><circle cx="18.8" cy="15.5" r="1.8" fill="${K.dark}"/><path d="M14 20h4M15 20v2M17 20v2" stroke="${K.dark}" stroke-width="1"/>`,
        h_pehlivan: c => `<path d="M4 29c1-6 6-8 12-8s11 2 12 8z" fill="${SK}"/><path d="M4 29c1-6 6-8 12-8s11 2 12 8z" fill="${c}" fill-opacity=".0"/><path d="M12 25h8l1 4h-10z" fill="${K.red}"/>` + face() + `<path d="M11 19.5c2-1.5 8-1.5 10 0-1 1.6-3 2-5 2s-4-.4-5-2z" fill="${HAIR}"/><path d="M10 9c2-2 10-2 12 0" stroke="${SK2}" stroke-width="1.2" fill="none"/>`,
        h_yaban: c => sh(c) + face(SK2) + `<path d="M7 15c0-6 4-10 9-10s9 4 9 10l-3-3-3 3-3-3-3 3-3-3z" fill="${K.green}"/><path d="M10 19c1 5 4 8 6 8s5-3 6-8c-2 2-4 3-6 3s-4-1-6-3z" fill="${HAIR}"/><path d="M9 6l-3-3M23 6l3-3" stroke="${K.green}" stroke-width="2"/>`,
        h_haydut: c => sh(c) + face(SK2) + `<path d="M9 18h14c0 4-3 7-7 7s-7-3-7-7z" fill="${c}"/><path d="M8 11c1-4 4-7 8-7s7 3 8 7z" fill="${K.dark}"/><path d="M5 11h22v2H5z" fill="${K.dark}"/>`,
        h_umay: c => sh(c) + face('#f3dccb', '#4a90d8') + `<path d="M8 15c0-6 3-10 8-10s8 4 8 10l-2 8c-1-4-3-6-6-6s-5 2-6 6z" fill="${K.white}"/><ellipse cx="16" cy="5" rx="7" ry="2" fill="none" stroke="${K.gold}" stroke-width="1.8"/><path d="M3 22c3-3 5-3 7-1M29 22c-3-3-5-3-7-1" stroke="${K.white}" stroke-width="2" fill="none"/>`,
        h_asikci: c => sh(c) + face() + `<path d="M8 13c1-5 4-8 8-8s7 3 8 8z" fill="${c}"/><path d="M6 13h20v2H6z" fill="${c}"/><rect x="18" y="6" width="5" height="5" rx="1" fill="${K.bone}"/><circle cx="19.5" cy="7.5" r=".7" fill="${K.dark}"/><circle cx="21.5" cy="9.5" r=".7" fill="${K.dark}"/><path d="M13 19.5c1.5 1.5 4.5 1.5 6 0" stroke="${K.dark}" stroke-width="1.2" fill="none"/>`,
        h_gokce: c => sh(c) + face() + `<path d="M8 15c0-6 3-10 8-10s8 4 8 10c-2-3-4-4-8-4s-6 1-8 4z" fill="${HAIR}"/><path d="M20 10c3-4 6-6 9-6-1 3-3 6-6 8z" fill="#5aa8e8"/><path d="M3 24c2-4 5-6 9-6M29 24c-2-4-5-6-9-6" stroke="#5aa8e8" stroke-width="2.4" fill="none"/>`,
        h_sahmeran: c => sh(c) + face('#9ed08a', K.gold) + `<path d="M8 13c-3-2-4-6-2-9 2 2 3 4 4 7zM24 13c3-2 4-6 2-9-2 2-3 4-4 7z" fill="${K.green}"/><circle cx="6" cy="4" r="1.5" fill="${K.green}"/><circle cx="26" cy="4" r="1.5" fill="${K.green}"/><path d="M9 13c2-3 4-4 7-4s5 1 7 4z" fill="${K.green}"/>`,
        h_anka: c => sh(c) + `<circle cx="16" cy="16" r="7.5" fill="${K.fire}"/><path d="M19 15l7 2-7 2z" fill="${K.gold}"/><circle cx="14" cy="14.5" r="1.3" fill="${K.dark}"/><path d="M10 10c1-5 3-8 6-8-1 3 0 5 2 6-3-1-5 0-6 3zM14 7c2-3 5-4 8-3-2 2-3 4-3 6-1-2-3-3-5-3z" fill="${K.red}"/>`,
        h_cali: c => `<path d="M5 28c-2-8 2-14 7-15 1-4 7-4 8 0 5 1 9 7 7 15z" fill="${K.green}"/><circle cx="13" cy="19" r="1.4" fill="${K.dark}"/><circle cx="19" cy="19" r="1.4" fill="${K.dark}"/><circle cx="9" cy="17" r="1.6" fill="${c}"/><circle cx="23" cy="15" r="1.6" fill="${c}"/><circle cx="17" cy="11" r="1.4" fill="${c}"/><path d="M14 23c1 1 3 1 4 0" stroke="${K.dark}" stroke-width="1.2" fill="none"/>`,
        h_tulpar: c => sh(c) + `<path d="M9 12c3-4 7-6 12-5l5 7-3 1-2 5c-3 2-7 2-10 0l-2-8z" fill="#d9c7a8"/><path d="M8 10l3-6 1 5 3-5 1 6" fill="${K.dark}"/><circle cx="21" cy="12" r="1.3" fill="${K.dark}"/><path d="M22 18l3 1" stroke="${K.dark}" stroke-width="1.2"/><path d="M3 22c2-5 5-7 9-7M29 22c-2-5-5-7-9-7" stroke="${K.white}" stroke-width="2.4" fill="none"/>`,
        h_okcu: c => sh(c) + face(SK2) + `<path d="M8 20c-1-8 2-13 8-14 6 1 9 6 8 14l-3-4H11z" fill="${c}"/><path d="M4 9l24 14" stroke="${K.wood}" stroke-width="2"/><path d="M28 23l-4-1 2-3z" fill="${K.steel}"/><path d="M4 9l1 3-3 0z" fill="${K.bone}"/>`,
        h_orakci: c => sh(c) + `<path d="M7 25c0-11 4-17 9-19 5 2 9 8 9 19z" fill="${c}"/><ellipse cx="16" cy="18" rx="6" ry="7" fill="${K.dark}"/><circle cx="13.5" cy="17" r="1.2" fill="${K.red}"/><circle cx="18.5" cy="17" r="1.2" fill="${K.red}"/><path d="M24 4c-5 1-9 5-10 11 5-1 9-5 10-11z" fill="${K.steel}"/>`
      };
    })(),
    // nadir eşyalar
    fist: c => `<path d="M8 14v8a6 6 0 0 0 6 6h5a5 5 0 0 0 5-5v-7a2 2 0 0 0-4 0v-2a2 2 0 0 0-4 0v-1a2 2 0 0 0-4 0v1a2 2 0 0 0-4 0z" fill="${c}"/><path d="M10 20h12" stroke="${K.steel}" stroke-width="2"/><path d="M8 17h3M8 22h3" stroke="${K.dark}" stroke-width="1"/>`,
    fist2: c => `<circle cx="16" cy="14" r="9" fill="${K.bone}"/><path d="M11 13l3 1M18 14l3-1" stroke="${K.dark}" stroke-width="1.6"/><path d="M13 18c2 2 4 2 6 0" stroke="${K.dark}" stroke-width="1.4" fill="none"/><path d="M9 24h14v5H9z" fill="${c}"/><path d="M16 4c2 0 3 1 3 2" stroke="${K.dark}" stroke-width="1.4" fill="none"/>`,
    eye: c => `<circle cx="10" cy="17" r="5.5" fill="${K.white}" fill-opacity=".3" stroke="${c}" stroke-width="2.5"/><circle cx="22" cy="17" r="5.5" fill="${K.white}" fill-opacity=".3" stroke="${c}" stroke-width="2.5"/><path d="M15.5 17h1M4 15l-2-2M28 15l2-2" stroke="${c}" stroke-width="2"/><circle cx="10" cy="17" r="2" fill="${K.blue}"/><circle cx="22" cy="17" r="2" fill="${K.blue}"/>`,
    eye2: c => `<path d="M3 16c4-6 9-9 13-9s9 3 13 9c-4 6-9 9-13 9S7 22 3 16z" fill="${K.white}"/><circle cx="16" cy="16" r="6" fill="${K.gold}"/><circle cx="16" cy="16" r="3" fill="${K.dark}"/><path d="M3 16c4-6 9-9 13-9" stroke="${c}" stroke-width="2.4" fill="none"/>`,
    eye3: c => `<circle cx="16" cy="16" r="12" fill="${K.blue}"/><circle cx="16" cy="16" r="8" fill="${K.white}"/><circle cx="16" cy="16" r="5" fill="${c}"/><circle cx="16" cy="16" r="2.4" fill="${K.dark}"/>`,
    fork: c => `<path d="M16 28V13" stroke="${K.steel2}" stroke-width="3"/><path d="M11 4v6a5 5 0 0 0 10 0V4" fill="none" stroke="${K.steel}" stroke-width="2.6"/><path d="M16 4v9" stroke="${K.steel}" stroke-width="2.6"/><path d="M14 22h4v6h-4z" fill="${c}"/>`,
    potion: c => `<path d="M13 4h6M14 4v6l-6 10a4 4 0 0 0 4 6h8a4 4 0 0 0 4-6l-6-10V4" fill="${K.white}" fill-opacity=".3" stroke="${K.steel}" stroke-width="1"/><path d="M9.5 19l3.5-6h6l3.5 6c1 2-1 5-3 5h-7c-2 0-4-3-3-5z" fill="${c}"/><circle cx="14" cy="21" r="1.2" fill="${K.white}"/><path d="M12 3h8v2h-8z" fill="${K.wood}"/>`,
    orb: c => `<circle cx="16" cy="16" r="10" fill="${c}"/><circle cx="16" cy="16" r="10" fill="none" stroke="${K.white}" stroke-width="1.2" stroke-opacity=".5"/><path d="M18 8l-5 8h5l-4 8 8-10h-5z" fill="${K.gold}"/>`,
    orb2: c => `<circle cx="16" cy="17" r="10" fill="${K.dark}"/><circle cx="16" cy="17" r="6" fill="${c}"/><circle cx="16" cy="17" r="2.5" fill="${K.white}"/><path d="M8 9l2 3M24 9l-2 3M16 4v4" stroke="${K.fire}" stroke-width="2.4"/>`,
    snake: c => `<path d="M6 22c4-6 8 2 12-4s6-8 8-5" fill="none" stroke="${c}" stroke-width="4"/><path d="M6 22c4-6 8 2 12-4s6-8 8-5" fill="none" stroke="${K.green}" stroke-width="1.2" stroke-dasharray="2 3"/><circle cx="26" cy="12" r="3" fill="${c}"/><circle cx="27" cy="11" r=".9" fill="${K.dark}"/><path d="M28 14l2 2" stroke="${K.red}" stroke-width="1.5"/>`,
    drop: c => `<path d="M16 3c5 7 9 11 9 17a9 9 0 0 1-18 0c0-6 4-10 9-17z" fill="${c}"/><path d="M16 3c5 7 9 11 9 17a9 9 0 0 1-9 9z" fill="${K.red}"/><path d="M12 20c0 3 2 5 4 5" stroke="${K.white}" stroke-width="1.6" fill="none"/>`,
    drop2: c => `<path d="M16 3c5 7 9 11 9 17a9 9 0 0 1-18 0c0-6 4-10 9-17z" fill="${K.dark}"/><path d="M16 9c3 4 5 7 5 11a5 5 0 0 1-10 0c0-4 2-7 5-11z" fill="${c}"/><path d="M13 22c0 2 1 3 3 3" stroke="${K.purple}" stroke-width="1.6" fill="none"/>`,
    claw: c => `<path d="M8 6c3 4 4 9 3 14M14 4c3 5 4 10 3 16M20 5c3 4 3 9 2 14" fill="none" stroke="${c}" stroke-width="3.2"/><path d="M6 22c6-4 14-4 20 0l-3 6H9z" fill="${K.gold}"/><path d="M11 20l-1 8" stroke="${K.dark}" stroke-width="1"/>`,
    claw2: c => `<path d="M6 5c4 5 6 12 6 20M14 4c4 5 6 12 6 20M22 5c3 5 4 12 4 20" fill="none" stroke="${K.red}" stroke-width="3.4"/><path d="M6 5c4 5 6 12 6 20M14 4c4 5 6 12 6 20M22 5c3 5 4 12 4 20" fill="none" stroke="${c}" stroke-width="1" stroke-opacity=".6"/>`,
    flute: c => `<path d="M4 24L24 4" stroke="${K.wood}" stroke-width="5"/><path d="M4 24L24 4" stroke="${c}" stroke-width="1.2" stroke-opacity=".6"/><circle cx="10" cy="18" r="1.3" fill="${K.dark}"/><circle cx="14" cy="14" r="1.3" fill="${K.dark}"/><circle cx="18" cy="10" r="1.3" fill="${K.dark}"/><path d="M24 20c2 0 3 1 3 3" stroke="${K.white}" stroke-width="1.6" fill="none"/>`,
    ghost: c => `<path d="M8 28V14a8 8 0 0 1 16 0v14l-4-3-4 3-4-3z" fill="${c}"/><circle cx="13" cy="13" r="1.8" fill="${K.dark}"/><circle cx="19" cy="13" r="1.8" fill="${K.dark}"/><path d="M14 19c1 1 3 1 4 0" stroke="${K.dark}" stroke-width="1.4" fill="none"/>`,
    ghost2: c => `<path d="M10 28V12c0-5 3-8 6-8s6 3 6 8v16H10z" fill="${K.bone}"/><path d="M10 12h12M10 18h12M10 24h12" stroke="${K.steel2}" stroke-width="1"/><circle cx="13.5" cy="10" r="1.3" fill="${K.dark}"/><circle cx="18.5" cy="10" r="1.3" fill="${K.dark}"/><path d="M8 28h16" stroke="${c}" stroke-width="2.4"/>`,
    ghost3: c => `<path d="M4 24v-8a5 5 0 0 1 10 0v8l-2.5-2-2.5 2-2.5-2z" fill="${c}"/><path d="M18 26v-8a5 5 0 0 1 10 0v8l-2.5-2-2.5 2-2.5-2z" fill="${c}"/><path d="M11 14V8a5 5 0 0 1 10 0v6l-2.5-2-2.5 2-2.5-2z" fill="${K.white}"/><circle cx="8" cy="16" r="1" fill="${K.dark}"/><circle cx="22" cy="18" r="1" fill="${K.dark}"/><circle cx="15" cy="8" r="1" fill="${K.dark}"/>`,
    barrel: c => `<path d="M9 6h14l2 10-2 10H9L7 16z" fill="${K.wood}"/><path d="M8 11h16M8 21h16" stroke="${K.steel2}" stroke-width="2.2"/><path d="M12 8h8" stroke="${K.dark}" stroke-width="1" stroke-opacity=".5"/><circle cx="16" cy="16" r="3" fill="${c}"/><path d="M16 13v-2" stroke="${K.green}" stroke-width="1.6"/>`,
    pot: c => `<path d="M8 12h16l-2 14H10z" fill="${K.dark}"/><path d="M6 12h20" stroke="${K.steel2}" stroke-width="2.6"/><path d="M12 8h8" stroke="${K.steel2}" stroke-width="2"/><path d="M10 14h12l-1 6H11z" fill="${c}"/><path d="M12 6c0-2 1-3 1-5M19 6c0-2 1-3 1-5" stroke="${K.white}" stroke-width="1.4" stroke-opacity=".6" fill="none"/>`,
    mirror: c => `<ellipse cx="16" cy="13" rx="8" ry="10" fill="${K.gold}"/><ellipse cx="16" cy="13" rx="5.5" ry="7.5" fill="${c}"/><path d="M13 9c1-2 3-3 5-2" stroke="${K.white}" stroke-width="1.6" fill="none"/><path d="M16 23v5M12 28h8" stroke="${K.gold}" stroke-width="2.4"/>`,
    run: c => `<path d="M8 6h9v10l7 2v4H8z" fill="${c}"/><path d="M6 24h20v2H6z" fill="${K.steel}"/><path d="M8 26l-1 3M24 26l1 3" stroke="${K.steel2}" stroke-width="2.4"/><path d="M8 11h9M8 15h9" stroke="${K.dark}" stroke-width="1.2" stroke-opacity=".5"/>`,
    star: c => `<path d="M16 3l4 9 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z" fill="${c}"/><path d="M16 3l4 9 9 1-7 6" fill="${K.white}" fill-opacity=".35"/><path d="M12 20l8-8" stroke="${K.white}" stroke-width="1.6"/>`,
    star2: c => `<path d="M16 3l4 9 9 1-7 6 2 9-8-5z" fill="${c}"/><path d="M14 8l-3 4-7 1 7 6-2 9 6-4" fill="${K.steel2}"/><path d="M16 8l-2 8 3 4-1 7" stroke="${K.dark}" stroke-width="1.6" fill="none"/>`,
    compass: c => `<circle cx="16" cy="16" r="12" fill="${K.gold}"/><circle cx="16" cy="16" r="9" fill="${K.bone}"/><path d="M16 6l3 10-3 10-3-10z" fill="${K.red}"/><path d="M16 6l3 10h-6z" fill="${c}"/><circle cx="16" cy="16" r="1.5" fill="${K.dark}"/>`,
    lamp: c => `<path d="M11 6h10l2 10H9z" fill="${K.dark}"/><path d="M12 8h8l1 6h-10z" fill="${c}"/><path d="M14 16v6h4v-6M11 26h10" stroke="${K.wood}" stroke-width="2.6"/><path d="M13 3h6" stroke="${K.steel2}" stroke-width="2"/>`,
    lamp2: c => `<path d="M11 6h10l2 10H9z" fill="${K.dark}"/><path d="M12 8h8l1 6h-10z" fill="${K.green}"/><circle cx="16" cy="11" r="2" fill="${K.white}"/><path d="M14 16v6h4v-6M11 26h10" stroke="${c}" stroke-width="2.6"/><path d="M8 4c2 1 2 3 0 4M24 4c-2 1-2 3 0 4" stroke="${K.green}" stroke-width="1.5" fill="none"/>`,
    lamp3: c => `<path d="M5 18c3-4 8-5 14-5l8 2c-1 5-5 8-11 8s-9-2-11-5z" fill="${K.gold}"/><path d="M19 13c3 0 6 1 8 2" stroke="${K.dark}" stroke-width="1" fill="none"/><path d="M8 12c2-2 4-2 6 0" stroke="${K.gold}" stroke-width="2.4" fill="none"/><path d="M26 13c1-3 3-5 2-8-2 1-3 3-3 5" fill="${K.fire}"/><circle cx="16" cy="19" r="2" fill="${c}"/>`,
    skull: c => `<path d="M16 4a10 10 0 0 1 10 10c0 4-2 6-4 8v4h-12v-4c-2-2-4-4-4-8A10 10 0 0 1 16 4z" fill="${K.bone}"/><circle cx="12" cy="14" r="2.6" fill="${c}"/><circle cx="20" cy="14" r="2.6" fill="${c}"/><path d="M15 19l1-2 1 2z" fill="${K.dark}"/><path d="M12 24v3M16 24v3M20 24v3" stroke="${K.dark}" stroke-width="1.4"/>`,
    hammer: c => `<path d="M8 6h10v9H8z" fill="${K.wood}"/><path d="M8 6h10v2H8zM8 13h10v2H8z" fill="${K.steel2}"/><path d="M13 15l-1 13h4l-1-13z" fill="${K.wood}"/><path d="M18 8h4l2 2-2 2h-4z" fill="${c}"/>`,
    doll: c => `<circle cx="16" cy="9" r="4.5" fill="${K.bone}"/><path d="M11 14h10l2 8H9z" fill="${c}"/><path d="M12 22v6M20 22v6" stroke="${K.bone}" stroke-width="3"/><path d="M14 8l1 1M18 8l-1 1M14 11h4" stroke="${K.dark}" stroke-width="1.3"/><path d="M15 17l2 2M17 17l-2 2" stroke="${K.dark}" stroke-width="1.2"/><path d="M22 6l3-2" stroke="${K.steel2}" stroke-width="1.5"/>`,
    wolf: c => `<path d="M6 10l4-6 3 5h6l3-5 4 6v10c0 5-4 8-10 8S6 25 6 20z" fill="${c}"/><path d="M6 10l4-6 3 5M26 10l-4-6-3 5" fill="${K.dark}" fill-opacity=".35"/><circle cx="12" cy="15" r="1.6" fill="${K.gold}"/><circle cx="20" cy="15" r="1.6" fill="${K.gold}"/><path d="M14 21h4l-2 2z" fill="${K.dark}"/>`,
    meat: c => `<circle cx="16" cy="17" r="9" fill="${c}"/><circle cx="16" cy="17" r="9" fill="none" stroke="${K.red}" stroke-width="1.6"/><path d="M13 14l-2-3M19 14l2-3M16 12V9" stroke="${K.fire}" stroke-width="2"/><circle cx="13" cy="19" r="1" fill="${K.dark}"/><circle cx="18" cy="16" r="1" fill="${K.dark}"/>`,
    scale: c => `<path d="M16 4c6 0 10 4 10 10 0 7-5 12-10 14C11 26 6 21 6 14c0-6 4-10 10-10z" fill="${c}"/><path d="M16 4c6 0 10 4 10 10 0 7-5 12-10 14" fill="${K.white}" fill-opacity=".25"/><path d="M10 12c2 2 4 2 6 0s4-2 6 0M9 18c2 2 5 2 7 0s5-2 7 0" stroke="${K.dark}" stroke-width="1.2" fill="none"/>`,
    anvil: c => `<path d="M6 12h20l-4 4h-8l-2 6h12v4H8v-4h3l2-6H8z" fill="${K.steel2}"/><path d="M6 12h20l-4 4H10z" fill="${K.steel}"/><path d="M22 8l4-3" stroke="${c}" stroke-width="2.4"/>`,
    hat: c => `<path d="M8 24l8-18 8 18z" fill="${c}"/><path d="M5 24h22v3H5z" fill="${K.dark}"/><path d="M11 18h10" stroke="${K.gold}" stroke-width="2"/><path d="M16 6l-2-3M16 6l2-3" stroke="${K.bone}" stroke-width="1.6"/><circle cx="13" cy="21" r="1" fill="${K.gold}"/><circle cx="19" cy="21" r="1" fill="${K.gold}"/>`,
    heart: c => `<path d="M16 28C8 22 3 17 3 11a6 6 0 0 1 11-3l2 2 2-2a6 6 0 0 1 11 3c0 6-5 11-13 17z" fill="${c}"/><path d="M8 10c0-2 2-4 4-4" stroke="${K.white}" stroke-width="1.6" fill="none"/><path d="M12 13l3 3-2 4 5-4-2-3z" fill="${K.fire}"/>`,
    magnet: c => `<ellipse cx="16" cy="7" rx="10" ry="3" fill="${c}"/><ellipse cx="16" cy="12" rx="7" ry="2.4" fill="${c}"/><ellipse cx="17" cy="16.5" rx="4.5" ry="1.8" fill="${c}"/><path d="M12 20h8l-1 8h-6z" fill="${K.steel2}"/><path d="M14 22h4" stroke="${K.white}" stroke-width="1.2"/>`,
    pumpkin: c => `<path d="M8 13c-4 2-4 12 0 14h16c4-2 4-12 0-14-3-2-6-2-8 0-2-2-5-2-8 0z" fill="${c}"/><path d="M12 13v14M20 13v14" stroke="${K.dark}" stroke-width="1" stroke-opacity=".5"/><path d="M16 4c-2 3-1 6 0 8" stroke="${K.green}" stroke-width="2.5" fill="none"/><path d="M11 18l2 2 2-2zM17 18l2 2 2-2zM12 23h8l-2 2h-4z" fill="${K.dark}"/>`
  });
  // jeton çizici: koyu kalın dış çizgi + çizim. Fonksiyon simgeler kendi dolgularıyla (ince koyu ayraç), eski çizgi simgeler
  // ana renkle çizilir ve yarı saydam dolgu alır.
  // tom: kitap çerçevesi (renkli kapak, bej sayfa kenarı, sırt), sembol kapakta küçültülmüş
  const book = (c, inner) => `<path d="M7 5h17a2 2 0 0 1 2 2v19a2 2 0 0 1-2 2H7z" fill="${c}"/><path d="M7 5v23" stroke="${K.dark}" stroke-width="3"/><path d="M24 7v18l2 1V7z" fill="${K.bone}"/><path d="M10 9h11M10 25h11" stroke="${K.white}" stroke-width="1" stroke-opacity=".45"/><g transform="translate(16.5 16.5) scale(.5) translate(-16 -16)">${inner}</g>`;
  svg = (n, col, kind) => {
    const d = IC[n],
      c = col || 'currentColor';
    const strip = m => m.replace(/ (fill|stroke|stroke-width|stroke-opacity|fill-opacity|stroke-dasharray)="[^"]*"/g, ''),
      // yalnız dolgulu şekillere ışık-gölge örtüsü: fill="..." taşıyan öğeler kalır, çizgiler atılır
      lit = m => m.replace(/<(path|circle|ellipse|rect)\b([^>]*)\/>/g, (a, t, attrs) => / fill="(?!none)/.test(attrs) ? `<${t}${strip(attrs)} fill="url(#kkgl)" stroke="none"/>` : ''),
      DEFS = '<defs><linearGradient id="kkgl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".42"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient></defs>',
      wrap = (m, inner) => `<svg viewBox="0 0 32 32" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class=tk>${DEFS}<g stroke="#140f0c" stroke-width="5" fill="none">${strip(m)}</g><g stroke="#140f0c" stroke-width="${inner}">${m}</g><g>${lit(m)}</g></svg>`;
    if (kind == 't') {
      const sym = typeof d == 'function' ? d(K.white) : `<g stroke="${K.white}" stroke-width="3" fill="${K.white}" fill-opacity=".25">${d || ''}</g>`;
      return wrap(book(c, sym), 1);
    }
    if (typeof d == 'function') return wrap(d(c), 1.1);
    const p = d || '';
    return `<svg viewBox="0 0 32 32" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class=tk><g stroke="#140f0c" stroke-width="5.4" opacity=".92">${p}</g><g stroke="${c}" stroke-width="2.4" fill="${c}" fill-opacity=".3">${p}</g></svg>`;
  };
  // anahtara göre kalıcı renk: silahlar sıcak, tomlar serin, eşyalar tam palet
  const PW = ['#f0a35a', '#e86b4a', '#f5d26b', '#f08ac0', '#f0c090', '#e8945a', '#f5b36b', '#d86a6a'],
    PT = ['#6ad6c8', '#8fd37a', '#6fb0f0', '#b48cf0', '#9ad0a0', '#c8e070', '#7ccfe8', '#a0e0c8'],
    PI = ['#f0a35a', '#e86b4a', '#f5d26b', '#8fd37a', '#6ad6c8', '#6fb0f0', '#b48cf0', '#f08ac0', '#d8c8a0', '#9ad0a0', '#f0c090', '#c8e070'],
    hsh = k => {
      let h = 7;
      for (let i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) >>> 0;
      return h;
    };
  iconCol = (kind, key) => {
    const P = kind == 'w' ? PW : kind == 't' ? PT : PI;
    return P[hsh(String(key || kind)) % P.length];
  };
}
