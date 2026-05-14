/**
 * Central Raycast mode colors: dark infernal terminal arena.
 * Authored for this project — not sampled from third-party game assets.
 */
export const RAYCAST_PALETTE = {
  voidBlack: 0x020206,
  floorVoid: 0x04060a,
  /** Distance fog tint — near-black with a faint terminal-green cast for World 1. */
  fogVoid: 0x030806,
  /** World 1 terminal envelope — green-black cinder cast mixed into base fog (distinct from W2 blue rift). */
  forgeHaze: 0x030806,
  corruptVeil: 0x3e1432,
  criticalVeil: 0x520818,
  muzzleWarm: 0xffde9c,
  damageFlash: 0xff2048,
  projectileHalo: 0xfff0a4,
  pickupHalo: 0x5cf0dc,
  enemyOutline: 0x060506,
  toxicGlow: 0x72f298,
  toxicMid: 0x3aac68,
  bloodGate: 0xdc2840,
  bloodDeep: 0x8a1022,
  rustWall: 0x4a2a14,
  rustBright: 0xc87038,
  corruptViolet: 0x6a4490,
  corruptMist: 0xb898d8,
  plasmaBright: 0x58f2e4,
  plasmaMid: 0x2a988c,
  boneBright: 0xe8e4dc,
  amberWarn: 0xff9a38,
  amberSoft: 0xffd090,
  wallSteel: 0x141a28,
  wallCrimson: 0x3a0c18,
  wallOxide: 0x0a3830,
  wallRust: 0x482610,
  patternSteel: 0x546578,
  patternCrimson: 0xe04058,
  patternOxide: 0x68e0c8,
  patternRust: 0xf09848,
  gateSignal: 0xe83048,
  telegraphRose: 0xf05870,
  telegraphAmber: 0xffc850,
  /** World 2 — abyss stratum (blue-violet void + ion fracture; deliberately not W1 green terminal). */
  /** Deeper blue fog vs W1 fogVoid — reads as “underworld seam,” not terminal haze. */
  riftFog: 0x02061a,
  /** Violet interference sheet separate from W1 corruption and W3 ember. */
  riftVeil: 0x21105a,
  /** Ion conductor line for shafts and readable cold highlights. */
  riftIon: 0x5ab8ff,
  riftViolet: 0x8a5cff,
  /** Basalt crust — cold blue deck, not W1 steel/oxide. */
  riftBasalt: 0x07112c,
  riftBone: 0xaeb8ff,
  /** Cold functional accent for W2-only blends; pickups keep their gameplay colors. */
  riftBloom: 0x6fd0ff
} as const;

/** CSS strings for Phaser text and DOM-adjacent HUD. */
export const RAYCAST_CSS = {
  hudPanel: '#04060acc',
  debugText: '#6a9084',
  systemText: '#52e8d4',
  warningText: '#ff4f68',
  keyText: '#ffe8b8',
  bodyText: '#d8d4cc',
  mutedText: '#6f8f82',
  accentText: '#58f2e4'
} as const;

/** World 2 HUD — violet-shifted terminal glass over abyss canvas (distinct from W1 teal corruption). */
export const RAYCAST_CSS_WORLD2 = {
  hudPanel: '#030d22cc',
  debugText: '#7a9ec8',
  systemText: '#a8e8ff',
  warningText: '#ff9ad0',
  keyText: '#f0ecff',
  bodyText: '#d4def5',
  mutedText: '#5a7a9c',
  accentText: '#7af0ff'
} as const;

/** World 3 — Ember Meridian: warm ash glass vs cold stratum (Phase 34). */
export const RAYCAST_CSS_WORLD3 = {
  hudPanel: '#140804cc',
  debugText: '#c87858',
  systemText: '#ffb090',
  warningText: '#ff5566',
  keyText: '#ffe8c8',
  bodyText: '#ecd8cc',
  mutedText: '#8a6050',
  accentText: '#ff8844'
} as const;

export type RaycastHudCssBundle = { [K in keyof typeof RAYCAST_CSS]: string };

export function getRaycastHudCss(segment: 'world1' | 'world2' | 'world3'): RaycastHudCssBundle {
  if (segment === 'world2') return RAYCAST_CSS_WORLD2;
  if (segment === 'world3') return RAYCAST_CSS_WORLD3;
  return RAYCAST_CSS;
}
