/** Session-only preferences (Phaser registry). No localStorage — survives scene changes within one page load. */

export const SESSION_MOUSE_SENS_KEY = 'session_mouse_sens';
export const SESSION_SCREENSHAKE_KEY = 'session_screenshake';
export const SESSION_MINIMAP_DEFAULT_KEY = 'session_minimap_default';
export const SESSION_MASTER_VOLUME_KEY = 'session_master_volume';

export interface SessionRegistry {
  get(key: string): unknown;
  set(key: string, value: unknown): void;
}

const DEFAULT_MOUSE_SENS = 1;
const DEFAULT_SCREENSHAKE = true;
const DEFAULT_MINIMAP = true;
const DEFAULT_MASTER_VOL = 0.85;

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

export function ensureSessionSettings(registry: SessionRegistry): void {
  if (registry.get(SESSION_MOUSE_SENS_KEY) === undefined) registry.set(SESSION_MOUSE_SENS_KEY, DEFAULT_MOUSE_SENS);
  if (registry.get(SESSION_SCREENSHAKE_KEY) === undefined) registry.set(SESSION_SCREENSHAKE_KEY, DEFAULT_SCREENSHAKE);
  if (registry.get(SESSION_MINIMAP_DEFAULT_KEY) === undefined) registry.set(SESSION_MINIMAP_DEFAULT_KEY, DEFAULT_MINIMAP);
  if (registry.get(SESSION_MASTER_VOLUME_KEY) === undefined) registry.set(SESSION_MASTER_VOLUME_KEY, DEFAULT_MASTER_VOL);
}

export function getMouseSensitivity(registry: SessionRegistry): number {
  const v = Number(registry.get(SESSION_MOUSE_SENS_KEY));
  if (!Number.isFinite(v)) return DEFAULT_MOUSE_SENS;
  return clamp(v, 0.35, 2.25);
}

export function setMouseSensitivity(registry: SessionRegistry, value: number): void {
  registry.set(SESSION_MOUSE_SENS_KEY, clamp(value, 0.35, 2.25));
}

export function getScreenshakeEnabled(registry: SessionRegistry): boolean {
  const v = registry.get(SESSION_SCREENSHAKE_KEY);
  return v !== false;
}

export function setScreenshakeEnabled(registry: SessionRegistry, enabled: boolean): void {
  registry.set(SESSION_SCREENSHAKE_KEY, Boolean(enabled));
}

export function getMinimapDefaultVisible(registry: SessionRegistry): boolean {
  const v = registry.get(SESSION_MINIMAP_DEFAULT_KEY);
  return v !== false;
}

export function setMinimapDefaultVisible(registry: SessionRegistry, visible: boolean): void {
  registry.set(SESSION_MINIMAP_DEFAULT_KEY, Boolean(visible));
}

export function getSessionMasterVolume(registry: SessionRegistry): number {
  const v = Number(registry.get(SESSION_MASTER_VOLUME_KEY));
  if (!Number.isFinite(v)) return DEFAULT_MASTER_VOL;
  return clamp(v, 0, 1);
}

export function setSessionMasterVolume(registry: SessionRegistry, linear: number): void {
  registry.set(SESSION_MASTER_VOLUME_KEY, clamp(linear, 0, 1));
}
