import { describe, expect, it } from 'vitest';
import {
  formatRaycastPauseMenuMxBody,
  RAYCAST_PAUSE_MENU_LABELS,
  truncatePauseField
} from '../game/raycast/RaycastPauseMenu';

describe('raycast pause menu formatting', () => {
  it('lays out two columns, single-line controls, and menu cursor', () => {
    const body = formatRaycastPauseMenuMxBody({
      volumePct: 80,
      selectionIndex: 2,
      worldLine: 'EP 1 · Sector demo',
      difficultyLabel: 'Standard',
      score: 1200,
      highScore: 4000,
      missionLine: 'Explora y exfiltra',
      objectiveLine: 'TOKEN',
      hintLine: 'Busca el token',
      tokensLine: 'Fichas · 1/2',
      secretsLine: 'Secretos · 0/1',
      modifiersLine: 'Ritmo estándar'
    });

    expect(body).toContain('VOLUMEN MAESTRO 80%');
    expect(body).toContain('// PARTIDA');
    expect(body).toContain('// OBJETIVO');
    expect(body).toContain('│');
    expect(body).toContain('CONTROLES');
    expect(body).toContain('WASD mover | Mouse mirar | 1/2/3 armas | R recargar | T reiniciar nivel | ESC pausa');
    expect(body).toContain('// MENÚ');
    expect(body).toMatch(/Mundo ·/);
    expect(body).not.toContain('PROGRESO');
    expect(body).toContain(`> ${RAYCAST_PAUSE_MENU_LABELS[2]}`);
    expect(body).toContain(`  ${RAYCAST_PAUSE_MENU_LABELS[0]}`);
    expect(RAYCAST_PAUSE_MENU_LABELS.length).toBe(7);
  });

  it('truncates long pause fields safely', () => {
    expect(truncatePauseField('1234567890', 6).endsWith('…')).toBe(true);
    expect(truncatePauseField('short', 20)).toBe('short');
  });
});
