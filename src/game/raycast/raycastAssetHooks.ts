import type Phaser from 'phaser';

/**
 * Optional texture keys for future authored sprites (call sites must skip when missing).
 * Keep keys stable so dropping files into `public/` + preload can adopt them later.
 */
export const RAYCAST_OPTIONAL_TEXTURE_KEYS = {
  weaponPistol: 'raycast_weapon_pistol',
  weaponShotgun: 'raycast_weapon_shotgun',
  weaponLauncher: 'raycast_weapon_launcher',
  hudFrame: 'raycast_hud_frame'
} as const;

export function raycastTextureExists(scene: Phaser.Scene, key: string): boolean {
  return scene.textures.exists(key);
}

export function getRaycastTextureIfPresent(scene: Phaser.Scene, key: string): Phaser.Textures.Texture | null {
  return raycastTextureExists(scene, key) ? scene.textures.get(key) : null;
}

/** Call from RaycastScene when adding optional image loads later; safe no-op until assets exist. */
export function registerRaycastOptionalAssets(scene: Phaser.Scene): void {
  let queuedAsset = false;

  if (!scene.textures.exists(RAYCAST_OPTIONAL_TEXTURE_KEYS.weaponPistol)) {
    scene.load.image(
      RAYCAST_OPTIONAL_TEXTURE_KEYS.weaponPistol,
      'assets/raycast/weapons/pistol.png'
    );
    queuedAsset = true;
  }

  if (!scene.textures.exists(RAYCAST_OPTIONAL_TEXTURE_KEYS.weaponShotgun)) {
    scene.load.image(
      RAYCAST_OPTIONAL_TEXTURE_KEYS.weaponShotgun,
      'assets/raycast/weapons/shotgun.png'
    );
    queuedAsset = true;
  }

  if (!scene.textures.exists(RAYCAST_OPTIONAL_TEXTURE_KEYS.weaponLauncher)) {
    scene.load.image(
      RAYCAST_OPTIONAL_TEXTURE_KEYS.weaponLauncher,
      'assets/raycast/weapons/raygun.png'
    );
    queuedAsset = true;
  }

  if (queuedAsset && !scene.load.isLoading()) {
    scene.load.start();
  }
}