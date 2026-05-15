import type Phaser from 'phaser';
import type { RaycastEnemy } from './RaycastEnemy';

export type RaycastEnemySpriteState = 'idle' | 'walk1' | 'walk2' | 'attack' | 'damaged' | 'defeated';

/**
 * Optional texture keys for future authored sprites.
 * Call sites must skip/fallback when missing.
 */
export const RAYCAST_OPTIONAL_TEXTURE_KEYS = {
  weaponPistol: 'raycast_weapon_pistol',
  weaponShotgun: 'raycast_weapon_shotgun',
  weaponLauncher: 'raycast_weapon_launcher',
  hudFrame: 'raycast_hud_frame'
} as const;

export const RAYCAST_ENEMY_TEXTURE_KEYS: Record<
  RaycastEnemy['kind'],
  Record<RaycastEnemySpriteState, string>
> = {
  GRUNT: {
    idle: 'raycast_enemy_grunt_idle_front',
    walk1: 'raycast_enemy_grunt_walk_1_front',
    walk2: 'raycast_enemy_grunt_walk_2_front',
    attack: 'raycast_enemy_grunt_attack_front',
    damaged: 'raycast_enemy_grunt_damaged_front',
    defeated: 'raycast_enemy_grunt_defeated_front'
  },
  BRUTE: {
    idle: 'raycast_enemy_brute_idle_front',
    walk1: 'raycast_enemy_brute_walk_1_front',
    walk2: 'raycast_enemy_brute_walk_2_front',
    attack: 'raycast_enemy_brute_attack_front',
    damaged: 'raycast_enemy_brute_damaged_front',
    defeated: 'raycast_enemy_brute_defeated_front'
  },
  STALKER: {
    idle: 'raycast_enemy_stalker_idle_front',
    walk1: 'raycast_enemy_stalker_walk_1_front',
    walk2: 'raycast_enemy_stalker_walk_2_front',
    attack: 'raycast_enemy_stalker_attack_front',
    damaged: 'raycast_enemy_stalker_damaged_front',
    defeated: 'raycast_enemy_stalker_defeated_front'
  },
  RANGED: {
    idle: 'raycast_enemy_ranged_idle_front',
    walk1: 'raycast_enemy_ranged_walk_1_front',
    walk2: 'raycast_enemy_ranged_walk_2_front',
    attack: 'raycast_enemy_ranged_attack_front',
    damaged: 'raycast_enemy_ranged_damaged_front',
    defeated: 'raycast_enemy_ranged_defeated_front'
  },
  SCRAMBLER: {
    idle: 'raycast_enemy_scrambler_idle_front',
    walk1: 'raycast_enemy_scrambler_walk_1_front',
    walk2: 'raycast_enemy_scrambler_walk_2_front',
    attack: 'raycast_enemy_scrambler_attack_front',
    damaged: 'raycast_enemy_scrambler_damaged_front',
    defeated: 'raycast_enemy_scrambler_defeated_front'
  },
  FLASHER: {
    idle: 'raycast_enemy_flasher_idle_front',
    walk1: 'raycast_enemy_flasher_walk_1_front',
    walk2: 'raycast_enemy_flasher_walk_2_front',
    attack: 'raycast_enemy_flasher_attack_front',
    damaged: 'raycast_enemy_flasher_damaged_front',
    defeated: 'raycast_enemy_flasher_defeated_front'
  }
};

const OPTIONAL_IMAGE_ASSETS = [
  // GRUNT
  { key: RAYCAST_ENEMY_TEXTURE_KEYS.GRUNT.idle, path: 'assets/raycast/enemies/grunt/grunt_idle_front.png' },
  { key: RAYCAST_ENEMY_TEXTURE_KEYS.GRUNT.walk1, path: 'assets/raycast/enemies/grunt/grunt_walk_1_front.png' },
  { key: RAYCAST_ENEMY_TEXTURE_KEYS.GRUNT.walk2, path: 'assets/raycast/enemies/grunt/grunt_walk_2_front.png' },
  { key: RAYCAST_ENEMY_TEXTURE_KEYS.GRUNT.attack, path: 'assets/raycast/enemies/grunt/grunt_attack_front.png' },
  { key: RAYCAST_ENEMY_TEXTURE_KEYS.GRUNT.damaged, path: 'assets/raycast/enemies/grunt/grunt_damaged_front.png' },
  { key: RAYCAST_ENEMY_TEXTURE_KEYS.GRUNT.defeated, path: 'assets/raycast/enemies/grunt/grunt_defeated_front.png' },

  // BRUTE
  { key: RAYCAST_ENEMY_TEXTURE_KEYS.BRUTE.idle, path: 'assets/raycast/enemies/brute/brute_idle_front.png' },
  { key: RAYCAST_ENEMY_TEXTURE_KEYS.BRUTE.walk1, path: 'assets/raycast/enemies/brute/brute_walk_1_front.png' },
  { key: RAYCAST_ENEMY_TEXTURE_KEYS.BRUTE.walk2, path: 'assets/raycast/enemies/brute/brute_walk_2_front.png' },
  { key: RAYCAST_ENEMY_TEXTURE_KEYS.BRUTE.attack, path: 'assets/raycast/enemies/brute/brute_attack_front.png' },
  { key: RAYCAST_ENEMY_TEXTURE_KEYS.BRUTE.damaged, path: 'assets/raycast/enemies/brute/brute_damaged_front.png' },
  { key: RAYCAST_ENEMY_TEXTURE_KEYS.BRUTE.defeated, path: 'assets/raycast/enemies/brute/brute_defeated_front.png' },

  // STALKER
  { key: RAYCAST_ENEMY_TEXTURE_KEYS.STALKER.idle, path: 'assets/raycast/enemies/stalker/stalker_idle_front.png' },
  { key: RAYCAST_ENEMY_TEXTURE_KEYS.STALKER.walk1, path: 'assets/raycast/enemies/stalker/stalker_walk_1_front.png' },
  { key: RAYCAST_ENEMY_TEXTURE_KEYS.STALKER.walk2, path: 'assets/raycast/enemies/stalker/stalker_walk_2_front.png' },
  { key: RAYCAST_ENEMY_TEXTURE_KEYS.STALKER.attack, path: 'assets/raycast/enemies/stalker/stalker_attack_front.png' },
  { key: RAYCAST_ENEMY_TEXTURE_KEYS.STALKER.damaged, path: 'assets/raycast/enemies/stalker/stalker_damaged_front.png' },
  { key: RAYCAST_ENEMY_TEXTURE_KEYS.STALKER.defeated, path: 'assets/raycast/enemies/stalker/stalker_defeated_front.png' },

  // RANGED
  { key: RAYCAST_ENEMY_TEXTURE_KEYS.RANGED.idle, path: 'assets/raycast/enemies/ranged/ranged_idle_front.png' },
  { key: RAYCAST_ENEMY_TEXTURE_KEYS.RANGED.walk1, path: 'assets/raycast/enemies/ranged/ranged_walk_1_front.png' },
  { key: RAYCAST_ENEMY_TEXTURE_KEYS.RANGED.walk2, path: 'assets/raycast/enemies/ranged/ranged_walk_2_front.png' },
  { key: RAYCAST_ENEMY_TEXTURE_KEYS.RANGED.attack, path: 'assets/raycast/enemies/ranged/ranged_attack_front.png' },
  { key: RAYCAST_ENEMY_TEXTURE_KEYS.RANGED.damaged, path: 'assets/raycast/enemies/ranged/ranged_damaged_front.png' },
  { key: RAYCAST_ENEMY_TEXTURE_KEYS.RANGED.defeated, path: 'assets/raycast/enemies/ranged/ranged_defeated_front.png' },

  // SCRAMBLER
  { key: RAYCAST_ENEMY_TEXTURE_KEYS.SCRAMBLER.idle, path: 'assets/raycast/enemies/scrambler/scrambler_idle_front.png' },
  { key: RAYCAST_ENEMY_TEXTURE_KEYS.SCRAMBLER.walk1, path: 'assets/raycast/enemies/scrambler/scrambler_walk_1_front.png' },
  { key: RAYCAST_ENEMY_TEXTURE_KEYS.SCRAMBLER.walk2, path: 'assets/raycast/enemies/scrambler/scrambler_walk_2_front.png' },
  { key: RAYCAST_ENEMY_TEXTURE_KEYS.SCRAMBLER.attack, path: 'assets/raycast/enemies/scrambler/scrambler_attack_front.png' },
  { key: RAYCAST_ENEMY_TEXTURE_KEYS.SCRAMBLER.damaged, path: 'assets/raycast/enemies/scrambler/scrambler_damaged_front.png' },
  { key: RAYCAST_ENEMY_TEXTURE_KEYS.SCRAMBLER.defeated, path: 'assets/raycast/enemies/scrambler/scrambler_defeated_front.png' },

  // FLASHER
  { key: RAYCAST_ENEMY_TEXTURE_KEYS.FLASHER.idle, path: 'assets/raycast/enemies/flasher/flasher_idle_front.png' },
  { key: RAYCAST_ENEMY_TEXTURE_KEYS.FLASHER.walk1, path: 'assets/raycast/enemies/flasher/flasher_walk_1_front.png' },
  { key: RAYCAST_ENEMY_TEXTURE_KEYS.FLASHER.walk2, path: 'assets/raycast/enemies/flasher/flasher_walk_2_front.png' },
  { key: RAYCAST_ENEMY_TEXTURE_KEYS.FLASHER.attack, path: 'assets/raycast/enemies/flasher/flasher_attack_front.png' },
  { key: RAYCAST_ENEMY_TEXTURE_KEYS.FLASHER.damaged, path: 'assets/raycast/enemies/flasher/flasher_damaged_front.png' },
  { key: RAYCAST_ENEMY_TEXTURE_KEYS.FLASHER.defeated, path: 'assets/raycast/enemies/flasher/flasher_defeated_front.png' }
] as const;

export function raycastTextureExists(scene: Phaser.Scene, key: string): boolean {
  return scene.textures.exists(key);
}

export function getRaycastTextureIfPresent(scene: Phaser.Scene, key: string): Phaser.Textures.Texture | null {
  return raycastTextureExists(scene, key) ? scene.textures.get(key) : null;
}

/** Call from RaycastScene when adding optional image loads later; safe no-op until assets exist. */
export function registerRaycastOptionalAssets(scene: Phaser.Scene): void {
  let queuedAsset = false;

  for (const asset of OPTIONAL_IMAGE_ASSETS) {
    if (!scene.textures.exists(asset.key)) {
      scene.load.image(asset.key, asset.path);
      queuedAsset = true;
    }
  }

  if (queuedAsset && !scene.load.isLoading()) {
    scene.load.start();
  }
}