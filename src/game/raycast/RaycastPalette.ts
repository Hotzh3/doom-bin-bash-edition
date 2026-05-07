/**
 * Central Raycast mode colors: dark infernal terminal arena.
 * Authored for this project — not sampled from third-party game assets.
 */
export const RAYCAST_PALETTE = {
  voidBlack: 0x020206,
  floorVoid: 0x04060a,
  /** Distance fog tint — near-black with a faint sick cast. */
  fogVoid: 0x030508,
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
  telegraphAmber: 0xffc850
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
