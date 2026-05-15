import { describe, expect, it } from 'vitest';
import { formatRaycastPauseMenuBody, RAYCAST_PAUSE_MENU_LABELS } from '../game/raycast/RaycastPauseMenu';

describe('raycast pause menu formatting', () => {
  it('lists every pause entry with a cursor on the active row', () => {
    const body = formatRaycastPauseMenuBody(80, 2, {
      mission: 'Recupera la señal',
      objective: 'Llega a extracción',
      hint: 'Sigue el corredor central',
      difficulty: 'Estándar',
      levelWorld: 'MUNDO 1 · NIVEL 2',
      score: 1500,
      highScore: 1900,
      tokens: '1/1',
      secrets: '0/2',
      modifiers: 'Ninguno'
    });
    expect(body).toContain('ENTRADA BLOQUEADA');
    expect(body).toContain('MISIÓN: Recupera la señal');
    expect(body).toContain('OBJETIVO ACTUAL: Llega a extracción');
    expect(body).toContain('VOLUMEN MAESTRO 80%');
    expect(body).toContain(`> ${RAYCAST_PAUSE_MENU_LABELS[2]}`);
    expect(body).toContain(`  ${RAYCAST_PAUSE_MENU_LABELS[0]}`);
    expect(RAYCAST_PAUSE_MENU_LABELS.length).toBe(7);
  });
});
