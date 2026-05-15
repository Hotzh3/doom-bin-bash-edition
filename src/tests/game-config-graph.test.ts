import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const testDir = fileURLToPath(new URL('.', import.meta.url));

/**
 * Regression: `config.ts` imports scene classes; raycast scenes must not import `config.ts`
 * for viewport constants or production Rollup can emit a TDZ ("Cannot access before initialization")
 * in the `game-raycast-scenes` chunk (GitHub Pages black screen).
 */
describe('game config module graph', () => {
  const readScene = (name: string): string =>
    readFileSync(resolve(testDir, '..', 'game', 'scenes', name), 'utf8');

  it('RaycastScene imports dimensions instead of config for GAME_WIDTH / GAME_HEIGHT', () => {
    const src = readScene('RaycastScene.ts');
    expect(src).toMatch(/import\s*\{[^}]*GAME_(?:WIDTH|HEIGHT)[^}]*\}\s*from\s*['"]\.\.\/dimensions['"]/);
    expect(src).not.toContain("from '../config'");
  });

  it('RaycastWorldLockedScene imports dimensions instead of config', () => {
    const src = readScene('RaycastWorldLockedScene.ts');
    expect(src).toContain("from '../dimensions'");
    expect(src).not.toContain("from '../config'");
  });

  it('game config pulls dimensions for width / height', () => {
    const src = readFileSync(resolve(testDir, '..', 'game', 'config.ts'), 'utf8');
    expect(src).toContain("from './dimensions'");
  });

  it('exposes dimensions without Phaser', async () => {
    const { GAME_WIDTH, GAME_HEIGHT } = await import('../game/dimensions');
    expect(GAME_WIDTH).toBe(960);
    expect(GAME_HEIGHT).toBe(540);
  });
});
