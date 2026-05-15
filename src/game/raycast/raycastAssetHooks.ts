import type Phaser from 'phaser';

/**
 * Optional texture keys for future authored sprites (call sites must skip when missing).
 * Keep keys stable so dropping files into `public/` + preload can adopt them later.
 */
export const RAYCAST_OPTIONAL_TEXTURE_KEYS = {
  weaponPistol: 'raycast_weapon_pistol',
  weaponShotgun: 'raycast_weapon_shotgun',
  weaponLauncher: 'raycast_weapon_launcher',
  hudFrame: 'raycast_hud_frame',

  enemyGruntIdleFront: 'raycast_enemy_grunt_idle_front',
  enemyBruteIdleFront: 'raycast_enemy_brute_idle_front',
  enemyStalkerIdleFront: 'raycast_enemy_stalker_idle_front',
  enemyRangedIdleFront: 'raycast_enemy_ranged_idle_front',
  enemyScramblerIdleFront: 'raycast_enemy_scrambler_idle_front',
  enemyFlasherIdleFront: 'raycast_enemy_flasher_idle_front'
} as const;

const OPTIONAL_IMAGE_ASSETS = [
  {
    key: RAYCAST_OPTIONAL_TEXTURE_KEYS.enemyGruntIdleFront,
    path: 'assets/raycast/enemies/grunt/grunt_idle_front.png'
  },
  {
    key: RAYCAST_OPTIONAL_TEXTURE_KEYS.enemyBruteIdleFront,
    path: 'assets/raycast/enemies/brute/brute_idle_front.png'
  },
  {
    key: RAYCAST_OPTIONAL_TEXTURE_KEYS.enemyStalkerIdleFront,
    path: 'assets/raycast/enemies/stalker/stalker_idle_front.png'
  },
  {
    key: RAYCAST_OPTIONAL_TEXTURE_KEYS.enemyRangedIdleFront,
    path: 'assets/raycast/enemies/ranged/ranged_idle_front.png'
  },
  {
    key: RAYCAST_OPTIONAL_TEXTURE_KEYS.enemyScramblerIdleFront,
    path: 'assets/raycast/enemies/scrambler/scrambler_idle_front.png'
  },
  {
    key: RAYCAST_OPTIONAL_TEXTURE_KEYS.enemyFlasherIdleFront,
    path: 'assets/raycast/enemies/flasher/flasher_idle_front.png'
  }
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