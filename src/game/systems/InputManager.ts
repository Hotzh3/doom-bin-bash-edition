import Phaser from 'phaser';

export interface PlayerControls {
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  shoot: Phaser.Input.Keyboard.Key;
}

export function createControls(scene: Phaser.Scene, map: string[]): PlayerControls {
  const keys = scene.input.keyboard?.addKeys(map.join(',')) as Record<string, Phaser.Input.Keyboard.Key>;
  return { left: keys[map[0]], right: keys[map[1]], up: keys[map[2]], down: keys[map[3]], shoot: keys[map[4]] };
}
