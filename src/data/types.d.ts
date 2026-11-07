// data/types.d.ts · Kara Koru veri tablosu tipleri. Düzenleyici desteği için; derlemeye girmez.

/** Oyuncu stat anahtarları (data/stats.js STATS) */
export type StatKey = 'dmg' | 'aspd' | 'cnt' | 'size' | 'crit' | 'critd' | 'dur' | 'pspd' | 'kb' | 'bounce' | 'burst' | 'fire' | 'ice' | 'zap' | 'poison' | 'elite' | 'burn' | 'freeze' | 'hp' | 'regen' | 'shield' | 'thorns' | 'arm' | 'eva' | 'ls' | 'dmgred' | 'hurtcd' | 'overheal' | 'heal' | 'fall' | 'spd' | 'jmp' | 'air' | 'slam' | 'mag' | 'xp' | 'gold' | 'silver' | 'luck' | 'chest' | 'chestp' | 'shopp' | 'key' | 'pub' | 'puc' | 'diff' | 'curse' | 'holy' | 'wick' | 'elspawn' | 'enN' | 'enSz' | 'enSp' | 'enHp' | 'enDmg' | 'enScale' | 'effdur' | 'evolve' | 'block' | 'expl' | 'revive';

/** Stat katkısı: düz anahtar varsayılan katman; 'dmg*' çarpan, 'hp%' yüzde, 'hp+' düz */
export type StatFx = { [k in StatKey | `${StatKey}*` | `${StatKey}%` | `${StatKey}+`]?: number };

export interface Weapon {
  n: string; ic: string; d: string;
  /** taban silah statları: dmg, cnt, cd, prc, sz, spd, kb, dur, crit, critd, bnc */
  b: Record<string, number>;
  /** seviye havuzu: her seviyede 1-2 rastgele satır × nadirlik çarpanı */
  u: Record<string, number>;
  lock?: string; el?: 'fire' | 'ice' | 'zap' | 'poison'; sn?: Record<string, string>;
}

export interface Tome { n: string; ic: string; s: string; v: number; f?: 'i'; lock?: string; d?: string; rand?: 1 }

export interface Item {
  n: string; r: 0 | 2 | 3 | 4; ic: string; fx: StatFx; d: string;
  u?: 1; q?: 1; h?: 1; lock?: string;
}

export interface Hero {
  k: string; n: string; d: string; w: string; p: string; ps: string;
  b: StatFx; pr?: StatFx; pl?: StatFx; lock?: string; cost?: number; ud?: string; sc?: number;
}

export interface EnemyKind {
  n: string; t: 0 | 1 | 2 | 3 | 4 | 5; sc?: number;
  hp?: number; sp?: number; d?: number; xp?: number; au?: number;
  tint?: [number, number]; ghost?: 1 | 2 | 3;
  fx?: { poi?: 1; burn?: 1; frz?: 1; static?: 1; roll?: 1; gold?: 1; pylon?: 1; kefen?: 1; zones?: 1 };
  k?: string;
}

export interface BossProfile { n: string; k: string; p: ('charge' | 'laser' | 'pylons' | 'disable' | 'summon' | 'sand' | 'ice' | 'ghosts' | 'lava')[] }

export interface Quest { k: string; n: string; r: number; ul?: string; f: () => [number, number] }

export interface Challenge { k: string; n: string; d: string; m: number; st?: StatFx; fl?: Record<string, number> }

export interface MapDef { k: string; n: string; bi: number; tiers: number; lock?: string; d: string; ud?: string }

export interface Shop { k: string; n: string; st?: StatKey; v?: number; d?: string; m: number; c: number | number[]; qn?: number; unl?: number; need?: string }

/** Kalıcı kayıt (localStorage kk_meta) */
export interface Meta {
  v: number; s: number;
  u: Record<string, number>; l: Record<string, 1>; q: Record<string, 1>;
  st: { k: number; r: number; w: number; b: number; c: Record<string, number> };
  rank: Record<string, number>; skin: Record<string, 1 | string>; hat: Record<string, 1 | string>;
  ach: Record<string, number>; chal: Record<string, 1>; opt: Record<string, 1>; tier: Record<string, number>;
}
