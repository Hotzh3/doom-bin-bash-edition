import { describe, expect, it } from 'vitest';
import { formatRaycastPauseMenuMxBody, RAYCAST_PAUSE_MENU_LABELS } from '../game/raycast/RaycastPauseMenu';

describe('raycast pause menu formatting', () => {
  it('lays out four columns plus menu cursor', () => {
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
      tokensLine: 'Tokens · 1/2',
      secretsLine: 'Secretos · 0/1',
      modifiersLine: 'Ritmo estándar'
    });

    expect(body).toContain('PAUSA');
    expect(body).toContain('ENTRADA BLOQUEADA');
    expect(body).toContain('VOLUMEN MAESTRO 80%');
    expect(body).toContain('RUN');
    expect(body).toContain('OBJETIVO');
    expect(body).toContain('PROGRESO');
    expect(body).toContain('CONTROLES');
    expect(body).toMatch(/Mundo \/ Nivel ·/);
    expect(body).toContain(`> ${RAYCAST_PAUSE_MENU_LABELS[2]}`);
    expect(body).toContain(`  ${RAYCAST_PAUSE_MENU_LABELS[0]}`);
    expect(RAYCAST_PAUSE_MENU_LABELS.length).toBe(7);
  });
});
