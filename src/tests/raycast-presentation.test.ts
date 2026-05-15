import { describe, expect, it } from 'vitest';
import {
  buildRaycastDeathOverlayHint,
  buildRaycastDeathOverlaySummary,
  buildRaycastDifficultyMenuLine,
  buildMainMenuLayout,
  buildRaycastEpisodeBanner,
  buildRaycastHelpOverlayText,
  buildRaycastLevelStartObjectiveMessage,
  buildRaycastMasteryEndingLines,
  buildRaycastOverlayHint,
  buildRaycastPriorityMessage,
  buildRaycastStatusMessage,
  getMainMenuCopy,
  getPrologueCopy
} from '../game/raycast/RaycastPresentation';

describe('raycast presentation helpers', () => {
  it('exposes boot prologue copy for raycast and arena paths', () => {
    const ray = getPrologueCopy('raycast');
    const arena = getPrologueCopy('arena');

    expect(ray.lines).toHaveLength(4);
    expect(ray.lines[0]).toContain('dead signal');
    expect(ray.lines[1]).toContain('buried system woke up');
    expect(ray.lines[2]).toContain('Five sectors');
    expect(ray.continueLine).toContain('A');
    expect(arena.lines).toHaveLength(3);
    expect(arena.lines[0]).toContain('Simulation uplink');
    expect(arena.continueLine).toContain('B');
    expect(ray.backLine).toContain('ESC');
    expect(arena.backLine).toContain('ESC');
  });

  it('builds a banner that presents the mini episode and controls', () => {
    const banner = buildRaycastEpisodeBanner({
      currentLevelNumber: 2,
      totalLevels: 2,
      levelName: 'Lower Relay'
    });

    expect(banner).toContain('CINDER FORGE STRATUM');
    expect(banner).toContain('LVL 2/2 LOWER RELAY');
    expect(banner).not.toContain('MOVE WASD');
  });

  it('frames death overlay copy separately from sector-clear summaries', () => {
    const lines = buildRaycastDeathOverlaySummary('SECTOR 2/6 TEST');
    expect(lines[0]).toContain('ENLACE');
    expect(lines.join('\n')).toContain('SECTOR 2/6 TEST');
    expect(buildRaycastDeathOverlayHint()).toContain('REINTENTAR');
  });

  it('builds a World 3 banner when the meridian arc is active', () => {
    const banner = buildRaycastEpisodeBanner({
      currentLevelNumber: 1,
      totalLevels: 6,
      levelName: 'Ember Ramp',
      worldThreeSector: { index: 1, total: 3 }
    });

    expect(banner).toContain('WORLD 3 // EMBER MERIDIAN');
    expect(banner).toContain('THIRD HELL');
    expect(banner).toContain('SECTOR 1/3');
  });

  it('builds a World 2 banner when the rift arc is active', () => {
    const banner = buildRaycastEpisodeBanner({
      currentLevelNumber: 1,
      totalLevels: 6,
      levelName: 'Ion Stratum',
      worldTwoSector: { index: 1, total: 2 }
    });

    expect(banner).toContain('WORLD 2 // ABYSS STRATUM');
    expect(banner).toContain('NOT THE FORGE');
    expect(banner).toContain('SECTOR 1/2');
  });

  it('builds clear overlay hints for both next-level and finale states', () => {
    expect(
      buildRaycastOverlayHint({
        currentLevelNumber: 1,
        canAdvance: true,
        episodeComplete: false
      })
    ).toBe('N CONTINUAR  |  R REINICIAR SECTOR  |  ESC MENÚ');

    expect(
      buildRaycastOverlayHint({
        currentLevelNumber: 2,
        canAdvance: false,
        episodeComplete: true
      })
    ).toBe('R REPETIR FINAL  |  ESC MENÚ');

    expect(
      buildRaycastOverlayHint({
        currentLevelNumber: 6,
        canAdvance: false,
        episodeComplete: true,
        finaleBossCleared: true,
        worldTwoLocked: true
      })
    ).toBe('W MUNDO 2 (BLOQUEADO)  |  R REPETIR JEFE  |  ESC MENÚ');

    expect(
      buildRaycastOverlayHint({
        currentLevelNumber: 12,
        canAdvance: false,
        episodeComplete: true,
        masteryUnlocked: true
      })
    ).toBe('SEÑAL VERDADERA DESBLOQUEADA  |  R REPETIR FINAL  |  ESC MENÚ');
  });

  it('builds normal vs mastery ending footer lines compactly', () => {
    const normal = buildRaycastMasteryEndingLines({
      episodeComplete: true,
      fullArcClear: true,
      masteryUnlocked: false,
      impossibleModeUnlocked: false,
      hiddenChallengeHookUnlocked: false
    });
    expect(normal[0]).toContain('FINAL NORMAL');

    const mastery = buildRaycastMasteryEndingLines({
      episodeComplete: true,
      fullArcClear: true,
      masteryUnlocked: true,
      impossibleModeUnlocked: true,
      hiddenChallengeHookUnlocked: true
    });
    expect(mastery.join('\n')).toContain('FINAL SEÑAL VERDADERA');
    expect(mastery.join('\n')).toContain('FINAL SECRETO');
    expect(mastery.join('\n')).toContain('MODO IMPOSIBLE');
  });

  it('builds status copy for play, clear, and death states', () => {
    expect(buildRaycastStatusMessage(false, false, true)).toBe('Barre el sector. Mantente en movimiento.');
    expect(buildRaycastStatusMessage(true, false, true)).toBe(
      'Sector despejado. Presiona N para continuar, R para repetir o ESC para menú.'
    );
    expect(buildRaycastStatusMessage(true, true, true)).toBe('Episodio completado. Presiona R para repetir final o ESC para menú.');
    expect(buildRaycastStatusMessage(true, true, true, true, true)).toBe(
      'Jefe neutralizado. W para señal de Mundo 2, R para repetir jefe, ESC para menú.'
    );
    expect(buildRaycastStatusMessage(true, false, true, true, false)).toBe(
      'Jefe neutralizado. Presiona N para descender a Mundo 2, R para repetir jefe, ESC para menú.'
    );
    expect(buildRaycastStatusMessage(true, false, true, true, false, false, true)).toBe(
      'Archon cayó — el estrato abisal se abrió. Presiona N para descender, R para repetir jefe, ESC para menú.'
    );
    expect(buildRaycastStatusMessage(false, false, false)).toBe('Señal perdida. Presiona R para reintentar o ESC para menú.');
  });

  it('builds a quick help overlay with the expected control reminders', () => {
    const help = buildRaycastHelpOverlayText({
      difficultyLabel: 'Assist',
      difficultySummary: 'SOFTER DAMAGE // SLOWER PRESSURE // STRONGER REPAIRS'
    });

    expect(help).toContain('MOVER // WASD');
    expect(help).toContain('DISPARO // F, ESPACIO, CLICK');
    expect(help).toContain('ARMAS // 1, 2, 3');
    expect(help).toContain('MAPA // M');
    expect(help).toContain('INTERACTUAR // CAMINA SOBRE PORTONES, CERRADURAS Y SALIDAS');
    expect(help).toContain('DIFFICULTY // ASSIST // SOFTER DAMAGE // SLOWER PRESSURE // STRONGER REPAIRS');
    expect(help).toContain('MENÚ TÍTULO // A MODO 3D  |  B MODO 2D');
    expect(help).toContain('H O ? // MOSTRAR/OCULTAR AYUDA');
  });

  it('builds compact difficulty selector copy for the menu', () => {
    expect(
      buildRaycastDifficultyMenuLine({
        label: 'Standard',
        summary: 'Baseline raycast tuning.'
      })
    ).toBe('DIFFICULTY // STANDARD // BASELINE RAYCAST TUNING.');
  });

  it('prioritizes critical health and blocked objective warnings over routine hints', () => {
    expect(
      buildRaycastPriorityMessage({
        levelComplete: false,
        episodeComplete: false,
        playerAlive: true,
        playerHealth: 18,
        objective: 'FIND KEY',
        hint: 'FOLLOW THE OFF-PATH SIGNAL.',
        lowHealthHint: 'CRITICAL HEALTH. REPAIR CELL NEARBY, TAKE IT NOW.',
        combatMessage: 'HOSTILE PROCESS HIT',
        combatMessageActive: true,
        blockedHintActive: false
      })
    ).toEqual({
      text: 'CRITICAL HEALTH. REPAIR CELL NEARBY, TAKE IT NOW.',
      tone: 'critical'
    });

    expect(
      buildRaycastPriorityMessage({
        levelComplete: false,
        episodeComplete: false,
        playerAlive: true,
        playerHealth: 72,
        objective: 'FIND KEY',
        hint: 'TOKEN LOCKED. SWEEP THE SIDE ROUTE.',
        lowHealthHint: null,
        combatMessage: 'HOSTILE PROCESS HIT',
        combatMessageActive: true,
        blockedHintActive: true
      })
    ).toEqual({
      text: 'TOKEN LOCKED. SWEEP THE SIDE ROUTE.',
      tone: 'warning'
    });
  });

  it('builds short level-start objective callouts for the main goal types', () => {
    expect(buildRaycastLevelStartObjectiveMessage({ objective: 'FIND KEY', keyTotal: 1 })).toBe(
      'OBJETIVO // RECUPERA LA LLAVE Y ESCAPA.'
    );
    expect(buildRaycastLevelStartObjectiveMessage({ objective: 'SURVIVE AMBUSH', livingEnemyCount: 3 })).toBe(
      'OBJETIVO // ELIMINA TODOS LOS HOSTILES.'
    );
    expect(buildRaycastLevelStartObjectiveMessage({ objective: 'REACH EXIT' })).toBe('OBJETIVO // LLEGA AL PUNTO DE EXTRACCIÓN.');
    expect(buildRaycastLevelStartObjectiveMessage({ objective: 'SURVIVE AMBUSH', hasBoss: true })).toBe(
      'OBJETIVO // DERROTA AL JEFE Y EXTRAE.'
    );
  });

  it('falls back from combat alerts to exit and routine guidance when pressure is low', () => {
    expect(
      buildRaycastPriorityMessage({
        levelComplete: false,
        episodeComplete: false,
        playerAlive: true,
        playerHealth: 80,
        objective: 'REACH EXIT',
        hint: 'EXIT NODE IS LIVE. FINISH THE ROUTE.',
        lowHealthHint: null,
        combatMessage: undefined,
        combatMessageActive: false,
        blockedHintActive: false
      })
    ).toEqual({
      text: 'NODO DE SALIDA ACTIVO. CORTA RUTA A EXTRACCIÓN.',
      tone: 'info'
    });

    expect(
      buildRaycastPriorityMessage({
        levelComplete: false,
        episodeComplete: false,
        playerAlive: true,
        playerHealth: 80,
        objective: 'OPEN DOOR',
        hint: 'THE SEALED GATE IS THE NEXT BREACH POINT.',
        lowHealthHint: null,
        combatMessage: undefined,
        combatMessageActive: false,
        blockedHintActive: false
      })
    ).toEqual({
      text: 'THE SEALED GATE IS THE NEXT BREACH POINT.',
      tone: 'routine'
    });
  });

  it('uses authored low-health hints before the generic warning copy', () => {
    expect(
      buildRaycastPriorityMessage({
        levelComplete: false,
        episodeComplete: false,
        playerAlive: true,
        playerHealth: 42,
        objective: 'OPEN DOOR',
        hint: 'THE SEALED GATE IS THE NEXT BREACH POINT.',
        lowHealthHint: 'LOW HEALTH. REPAIR CELL NEARBY, STABILIZE BEFORE THE NEXT PUSH.',
        combatMessage: undefined,
        combatMessageActive: false,
        blockedHintActive: false
      })
    ).toEqual({
      text: 'LOW HEALTH. REPAIR CELL NEARBY, STABILIZE BEFORE THE NEXT PUSH.',
      tone: 'warning'
    });
  });

  it('exposes the boot menu title and A/B mode lines', () => {
    const copy = getMainMenuCopy();

    expect(copy.title).toBe('DOOM BIN BASH EDITION');
    expect(copy.press3d).toBe('Press A: 3D Mode');
    expect(copy.press2d).toBe('Press B: 2D Mode');
  });

  it('keeps the main menu layout ordered title then 3D then 2D option', () => {
    const layout = buildMainMenuLayout(960, 540);

    expect(layout.centerX).toBe(480);
    expect(layout.titleY).toBeLessThan(layout.option3dY);
    expect(layout.option3dY).toBeLessThan(layout.option2dY);
    expect(layout.titleFrameCenterY).toBeLessThan(layout.titleY);
  });

  it('keeps main menu vertical ordering on compact viewports', () => {
    const layouts = [
      { width: 640, height: 360 },
      { width: 854, height: 480 },
      { width: 1280, height: 720 }
    ];

    for (const { width, height } of layouts) {
      const layout = buildMainMenuLayout(width, height);
      expect(layout.titleY).toBeLessThan(layout.option3dY);
      expect(layout.option3dY).toBeLessThan(layout.option2dY);
    }
  });
});
