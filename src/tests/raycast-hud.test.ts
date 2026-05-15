import { describe, expect, it } from 'vitest';
import {
  formatRaycastEnemyTargetLabel,
  buildRaycastHudLayout,
  buildRaycastDebugLine,
  buildRaycastFocusedEnemyLine,
  buildRaycastHudLine,
  buildRaycastHudProgressLine,
  buildRaycastHudStatusLine,
  buildRaycastMinimapLegendLine,
  buildRaycastScoreHudLine,
  buildRaycastPlayerHealthLine,
  formatRaycastObjectiveLabel,
  getRaycastHealthVisualState,
  formatRaycastHudAmmunitionCount,
  shouldSuppressRaycastCenterHudBanner
} from '../game/raycast/RaycastHud';

describe('raycast HUD', () => {
  it('formats score and high score for the HUD strip', () => {
    expect(buildRaycastScoreHudLine(1240, 900)).toBe('SCORE 1240  |  HI 900');
    expect(buildRaycastScoreHudLine(-3, -1)).toBe('SCORE 0  |  HI 0');
  });

  it('builds a compact readable status line', () => {
    const hud = buildRaycastHudLine({
      health: 82,
      weaponLabel: 'Shotgun',
      difficultyLabel: 'STD',
      keyCount: 1,
      keyTotal: 1,
      secretCount: 0,
      secretTotal: 1,
      objective: 'EXIT'
    });

    expect(hud).toBe(
      'HP 82/100 | MUNICIÓN ∞/∞ | ARMA Shotgun | MOD STD | FICHAS 1/1 | SEC 0/1 | OBJ EXIT'
    );
    expect(hud.length).toBeLessThan(130);
  });

  it('splits the readable hub into status and progress lines', () => {
    expect(buildRaycastHudStatusLine(82, 'Shotgun')).toBe(
      'HP 82/100 STABLE  |  MUNICIÓN ∞/∞  |  ARMA Shotgun'
    );
    expect(buildRaycastHudStatusLine(82, 'Shotgun', 'AST')).toBe(
      'HP 82/100 STABLE  |  MUNICIÓN ∞/∞  |  ARMA Shotgun  |  MOD AST'
    );
    expect(buildRaycastHudProgressLine(1, 2, 0, 1)).toBe('FICHAS 1/2  |  SECRETOS 0/1');
  });

  it('marks critical health without expanding the HUD too much', () => {
    const hud = buildRaycastHudLine({
      health: 18,
      weaponLabel: 'Pistol',
      difficultyLabel: 'HRD',
      keyCount: 0,
      keyTotal: 1,
      secretCount: 1,
      secretTotal: 1,
      objective: 'TOKEN',
      criticalMessage: 'CRITICAL BODY STATE'
    });

    expect(hud).toContain('HP 18/100 CRIT');
    expect(hud).toContain('MOD HRD');
    expect(hud).toContain('OBJ TOKEN');
    expect(hud).toContain('MSG CRITICAL BODY STATE');
    expect(hud.length).toBeLessThan(150);
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
    expect(getRaycastHealthVisualState(90)).toMatchObject({ tone: 'stable', ratio: 0.9, color: '#58f2e4' });
    expect(getRaycastHealthVisualState(50)).toMatchObject({ tone: 'low', ratio: 0.5, color: '#ff8f2e' });
    expect(getRaycastHealthVisualState(25)).toMatchObject({ tone: 'critical', ratio: 0.25, color: '#ff1f48' });
  });

  it('builds a focused target line with enemy health and windup state', () => {
    expect(buildRaycastFocusedEnemyLine({ label: 'BRUTE', health: 96, maxHealth: 190, isWindingUp: true })).toBe(
      'TARGET BRUTE 96/190 ARMED'
    );
  });

  it('tags focused targets with a compact tactical role abbreviation', () => {
    expect(formatRaycastEnemyTargetLabel('GRUNT')).toBe('SCAV·PRS');
    expect(formatRaycastEnemyTargetLabel('STALKER')).toBe('STALK·FLK');
    expect(formatRaycastEnemyTargetLabel('RANGED')).toBe('TURRET·ZONE');
    expect(buildRaycastFocusedEnemyLine({ kind: 'BRUTE', health: 120, maxHealth: 190, isWindingUp: false })).toContain(
      'BRUTE·DEN'
    );
  });

  it('shows a single HUD ammo read in the primary status strip', () => {
    const line = buildRaycastHudStatusLine(90, 'Pistol', 'STD');
    expect(line.match(/MUNICIÓN/g)?.length).toBe(1);
    expect(line).toContain(`MUNICIÓN ${formatRaycastHudAmmunitionCount()}/${formatRaycastHudAmmunitionCount()}`);
    expect(line).not.toMatch(/WPN\b/);
  });

  it('suppresses center HUD banner during active gameplay', () => {
    expect(
      shouldSuppressRaycastCenterHudBanner({
        playerAlive: true,
        levelComplete: false,
        gamePaused: false,
        endScreenVisible: false
      })
    ).toBe(true);
    expect(
      shouldSuppressRaycastCenterHudBanner({
        playerAlive: true,
        levelComplete: false,
        gamePaused: true,
        endScreenVisible: false
      })
    ).toBe(true);
    expect(
      shouldSuppressRaycastCenterHudBanner({
        playerAlive: false,
        levelComplete: false,
        gamePaused: false,
        endScreenVisible: false
      })
    ).toBe(false);
  });

  it('builds a compact minimap legend line for key markers', () => {
    expect(buildRaycastMinimapLegendLine()).toBe('MAP M  |  KEY token  LOCK closed gate  OPEN clear gate  EXIT exfil');
  });

  it('separates the top-right HUD and minimap cluster at 960x540', () => {
    const layout = buildRaycastHudLayout(960, 540);
    const healthBarBottom = layout.healthBarY + layout.healthBarTrackHeight * 0.5;
    const minimapTitleTop = layout.minimapTitleY - layout.minimapTitleHeight * 0.5;
    const minimapFrameTop = layout.minimapFrameY - layout.minimapFrameHeight * 0.5;

    expect(layout.healthBarX + layout.healthBarWidth).toBe(944);
    expect(layout.minimapTitleX).toBe(847);
    expect(layout.minimapFrameWidth).toBe(194);
    expect(layout.minimapPanelWidth).toBe(178);
    expect(minimapTitleTop).toBeGreaterThan(healthBarBottom);
    expect(minimapFrameTop).toBeGreaterThan(healthBarBottom);
  });

  it('keeps the larger default minimap treatment on roomier viewports', () => {
    const layout = buildRaycastHudLayout(1280, 720);
    const healthBarBottom = layout.healthBarY + layout.healthBarTrackHeight * 0.5;
    const minimapTitleTop = layout.minimapTitleY - layout.minimapTitleHeight * 0.5;
    const minimapFrameTop = layout.minimapFrameY - layout.minimapFrameHeight * 0.5;

    expect(layout.minimapFrameWidth).toBe(232);
    expect(layout.minimapPanelWidth).toBe(212);
    expect(layout.minimapTitleY).toBe(98);
    expect(minimapTitleTop).toBeGreaterThan(healthBarBottom);
    expect(minimapFrameTop).toBeGreaterThan(healthBarBottom);
  });
});
