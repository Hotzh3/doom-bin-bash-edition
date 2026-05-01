import Phaser from 'phaser';

export interface PlayerControls {
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  shoot: Phaser.Input.Keyboard.Key;
  weapon1: Phaser.Input.Keyboard.Key;
  weapon2: Phaser.Input.Keyboard.Key;
  weapon3: Phaser.Input.Keyboard.Key;
}

export function createControls(scene: Phaser.Scene, map: string[]): PlayerControls {
  const weaponMap = [map[5] ?? 'ONE', map[6] ?? 'TWO', map[7] ?? 'THREE'];
  const keyMap = [...map.slice(0, 5), ...weaponMap];
  const keys = scene.input.keyboard?.addKeys(keyMap.join(',')) as Record<string, Phaser.Input.Keyboard.Key>;
  return {
    left: keys[map[0]],
    right: keys[map[1]],
    up: keys[map[2]],
    down: keys[map[3]],
    shoot: keys[map[4]],
    weapon1: keys[weaponMap[0]],
    weapon2: keys[weaponMap[1]],
    weapon3: keys[weaponMap[2]]
  };
}
