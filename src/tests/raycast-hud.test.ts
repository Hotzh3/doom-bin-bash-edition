import { describe, expect, it } from 'vitest';
import { buildRaycastDebugLine, buildRaycastHudLine, formatRaycastObjectiveLabel } from '../game/raycast/RaycastHud';

describe('raycast HUD', () => {
  it('builds a compact readable status line', () => {
    const hud = buildRaycastHudLine({
      health: 82,
      weaponLabel: 'Shotgun',
      keyCount: 1,
      keyTotal: 1,
      secretCount: 0,
      secretTotal: 1,
      objective: 'EXIT'
    });

    expect(hud).toBe('HP 82 | WPN Shotgun | TOK 1/1 | SEC 0/1 | OBJ EXIT');
    expect(hud.length).toBeLessThan(80);
  });

  it('marks critical health without expanding the HUD too much', () => {
    const hud = buildRaycastHudLine({
      health: 18,
      weaponLabel: 'Pistol',
      keyCount: 0,
      keyTotal: 1,
      secretCount: 1,
      secretTotal: 1,
      objective: 'TOKEN',
      criticalMessage: 'CRITICAL BODY STATE'
    });

    expect(hud).toContain('HP 18 CRIT');
    expect(hud).toContain('OBJ TOKEN');
    expect(hud).toContain('MSG CRITICAL BODY STATE');
    expect(hud.length).toBeLessThan(84);
  });

  it('keeps normal HUD free from debug internals', () => {
    const hud = buildRaycastHudLine({
      health: 64,
      weaponLabel: 'Pistol',
      keyCount: 0,
      keyTotal: 1,
      secretCount: 0,
      secretTotal: 1,
      objective: 'GATE'
    });

    expect(hud).not.toContain('AI');
    expect(hud).not.toContain('director');
    expect(hud).not.toContain('cd ');
    expect(hud).not.toContain('budget');
  });

  it('builds debug HUD line with director internals when toggled', () => {
    const debugHud = buildRaycastDebugLine({
      position: '2.5,12.5',
      directorLine: 'AI Tension | int 3 | cd 2s | budget 4',
      message: 'SYSTEM WATCHES'
    });

    expect(debugHud).toContain('POS 2.5,12.5');
    expect(debugHud).toContain('AI Tension');
    expect(debugHud).toContain('budget 4');
  });

  it('compresses longer objective phrases into readable HUD tags', () => {
    expect(formatRaycastObjectiveLabel('find token')).toBe('TOKEN');
    expect(formatRaycastObjectiveLabel('OPEN GATE')).toBe('GATE');
    expect(formatRaycastObjectiveLabel('Expect Ambush')).toBe('AMBUSH');
    expect(formatRaycastObjectiveLabel('EXIT READY')).toBe('EXIT');
  });
});
