import { describe, expect, it } from 'vitest';
import { formatRaycastPauseMenuBody, RAYCAST_PAUSE_MENU_LABELS } from '../game/raycast/RaycastPauseMenu';

describe('raycast pause menu formatting', () => {
  it('lists every pause entry with a cursor on the active row', () => {
    const body = formatRaycastPauseMenuBody(80, 2);
    expect(body).toContain('ENTRADA BLOQUEADA');
    expect(body).toContain('VOLUMEN MAESTRO 80%');
    expect(body).toContain(`> ${RAYCAST_PAUSE_MENU_LABELS[2]}`);
    expect(body).toContain(`  ${RAYCAST_PAUSE_MENU_LABELS[0]}`);
    expect(RAYCAST_PAUSE_MENU_LABELS.length).toBe(7);
  });
});
