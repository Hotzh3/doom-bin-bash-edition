import { describe, expect, it } from 'vitest';
import {
  buildRaycastDebugLine,
  buildRaycastFocusedEnemyLine,
  buildRaycastHudLine,
  buildRaycastPlayerHealthLine,
  formatRaycastObjectiveLabel,
  getRaycastHealthVisualState
} from '../game/raycast/RaycastHud';

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

    expect(hud).toBe('HP 82/100 | WPN Shotgun | TOK 1/1 | SEC 0/1 | OBJ EXIT');
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

    expect(hud).toContain('HP 18/100 CRIT');
    expect(hud).toContain('OBJ TOKEN');
    expect(hud).toContain('MSG CRITICAL BODY STATE');
    expect(hud.length).toBeLessThan(92);
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
    expect(formatRaycastObjectiveLabel('find key')).toBe('KEY');
    expect(formatRaycastObjectiveLabel('OPEN DOOR')).toBe('DOOR');
    expect(formatRaycastObjectiveLabel('Survive Ambush')).toBe('AMBUSH');
    expect(formatRaycastObjectiveLabel('Reach Exit')).toBe('EXIT');
    expect(formatRaycastObjectiveLabel('find token')).toBe('TOKEN');
    expect(formatRaycastObjectiveLabel('OPEN GATE')).toBe('GATE');
    expect(formatRaycastObjectiveLabel('Expect Ambush')).toBe('AMBUSH');
    expect(formatRaycastObjectiveLabel('EXIT READY')).toBe('EXIT');
  });

  it('builds a dedicated health line and shifts tone as health drops', () => {
    expect(buildRaycastPlayerHealthLine({ health: 100 })).toBe('HP 100/100 STABLE');
    expect(buildRaycastPlayerHealthLine({ health: 42 })).toBe('HP 42/100 LOW');
    expect(buildRaycastPlayerHealthLine({ health: 12 })).toBe('HP 12/100 CRITICAL');
  });

  it('returns stable low and critical health visuals for HUD styling', () => {
    expect(getRaycastHealthVisualState(90)).toMatchObject({ tone: 'stable', ratio: 0.9, color: '#9feee2' });
    expect(getRaycastHealthVisualState(50)).toMatchObject({ tone: 'low', ratio: 0.5, color: '#ffcf7c' });
    expect(getRaycastHealthVisualState(25)).toMatchObject({ tone: 'critical', ratio: 0.25, color: '#ff7a8a' });
  });

  it('builds a focused target line with enemy health and windup state', () => {
    expect(buildRaycastFocusedEnemyLine({ label: 'BRUTE', health: 96, maxHealth: 190, isWindingUp: true })).toBe(
      'TARGET BRUTE 96/190 WINDUP'
    );
  });
});
