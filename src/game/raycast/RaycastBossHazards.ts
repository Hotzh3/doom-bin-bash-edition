export type RaycastBossHazardKind =
  | 'LASER'
  | 'MOVING_WALL'
  | 'CORRUPTION_ZONE'
  | 'LAVA_FLOOR'
  | 'DARKNESS_PULSE'
  | 'ROTATING_BARRIER';

export interface RaycastBossHazardDefinition {
  id: string;
  kind: RaycastBossHazardKind;
  telegraphMs: number;
  activeMs: number;
  cooldownMs: number;
  startOffsetMs: number;
  damagePerTick: number;
  damageTickMs: number;
  label: string;
  showOnMinimap?: boolean;
  line?: { x1: number; y1: number; x2: number; y2: number; width: number };
  rect?: { x: number; y: number; width: number; height: number };
  circle?: { x: number; y: number; radius: number };
  sweep?: { xFrom: number; xTo: number; y: number; halfHeight: number; width: number };
  rotate?: { x: number; y: number; length: number; width: number };
}

export interface RaycastBossHazardRuntime {
  def: RaycastBossHazardDefinition;
  nextDamageAt: number;
  lastPhase: 'idle' | 'telegraph' | 'active';
}

export interface RaycastBossHazardState {
  levelId: string;
  hazards: RaycastBossHazardRuntime[];
}

export interface RaycastBossHazardTickInput {
  nowMs: number;
  player: { x: number; y: number };
  bossAlive: boolean;
}

export interface RaycastBossHazardMarker {
  x: number;
  y: number;
  label: string;
  active: boolean;
}

export interface RaycastBossHazardTickResult {
  damage: number;
  triggerDarknessPulse: boolean;
  telegraphLabels: string[];
  activeLabels: string[];
  markers: RaycastBossHazardMarker[];
}

function phaseForHazard(def: RaycastBossHazardDefinition, nowMs: number): 'idle' | 'telegraph' | 'active' {
  const cycle = def.telegraphMs + def.activeMs + def.cooldownMs;
  if (cycle <= 0) return 'idle';
  const t = (Math.max(0, nowMs - def.startOffsetMs) % cycle + cycle) % cycle;
  if (t < def.telegraphMs) return 'telegraph';
  if (t < def.telegraphMs + def.activeMs) return 'active';
  return 'idle';
}

function pointLineDistance(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq <= 1e-6) return Math.hypot(px - x1, py - y1);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
  const cx = x1 + dx * t;
  const cy = y1 + dy * t;
  return Math.hypot(px - cx, py - cy);
}

function markerForHazard(def: RaycastBossHazardDefinition, nowMs: number): RaycastBossHazardMarker {
  if (def.circle) return { x: def.circle.x, y: def.circle.y, label: def.label, active: true };
  if (def.rect) return { x: def.rect.x + def.rect.width * 0.5, y: def.rect.y + def.rect.height * 0.5, label: def.label, active: true };
  if (def.line) return { x: (def.line.x1 + def.line.x2) * 0.5, y: (def.line.y1 + def.line.y2) * 0.5, label: def.label, active: true };
  if (def.sweep) {
    const cycle = def.telegraphMs + def.activeMs + def.cooldownMs;
    const p = cycle <= 0 ? 0 : ((Math.max(0, nowMs - def.startOffsetMs) % cycle) / cycle);
    return { x: def.sweep.xFrom + (def.sweep.xTo - def.sweep.xFrom) * p, y: def.sweep.y, label: def.label, active: true };
  }
  if (def.rotate) return { x: def.rotate.x, y: def.rotate.y, label: def.label, active: true };
  return { x: 7.5, y: 7.5, label: def.label, active: true };
}

function playerInsideHazard(def: RaycastBossHazardDefinition, nowMs: number, player: { x: number; y: number }): boolean {
  if (def.kind === 'DARKNESS_PULSE') return false;
  if (def.circle) return Math.hypot(player.x - def.circle.x, player.y - def.circle.y) <= def.circle.radius;
  if (def.rect) {
    return (
      player.x >= def.rect.x &&
      player.x <= def.rect.x + def.rect.width &&
      player.y >= def.rect.y &&
      player.y <= def.rect.y + def.rect.height
    );
  }
  if (def.line) {
    return pointLineDistance(player.x, player.y, def.line.x1, def.line.y1, def.line.x2, def.line.y2) <= def.line.width;
  }
  if (def.sweep) {
    const cycle = def.telegraphMs + def.activeMs + def.cooldownMs;
    const p = cycle <= 0 ? 0 : ((Math.max(0, nowMs - def.startOffsetMs) % cycle) / cycle);
    const cx = def.sweep.xFrom + (def.sweep.xTo - def.sweep.xFrom) * p;
    return (
      Math.abs(player.x - cx) <= def.sweep.width &&
      player.y >= def.sweep.y - def.sweep.halfHeight &&
      player.y <= def.sweep.y + def.sweep.halfHeight
    );
  }
  if (def.rotate) {
    const cycle = def.telegraphMs + def.activeMs + def.cooldownMs;
    const p = cycle <= 0 ? 0 : ((Math.max(0, nowMs - def.startOffsetMs) % cycle) / cycle);
    const a = p * Math.PI * 2;
    const x2 = def.rotate.x + Math.cos(a) * def.rotate.length;
    const y2 = def.rotate.y + Math.sin(a) * def.rotate.length;
    return pointLineDistance(player.x, player.y, def.rotate.x, def.rotate.y, x2, y2) <= def.rotate.width;
  }
  return false;
}

const WORLD1_HAZARDS: RaycastBossHazardDefinition[] = [
  {
    id: 'w1-laser',
    kind: 'LASER',
    telegraphMs: 950,
    activeMs: 1650,
    cooldownMs: 2400,
    startOffsetMs: 200,
    damagePerTick: 2,
    damageTickMs: 380,
    label: 'LASER',
    showOnMinimap: true,
    line: { x1: 3.5, y1: 7.5, x2: 11.5, y2: 7.5, width: 0.4 }
  },
  {
    id: 'w1-corrupt',
    kind: 'CORRUPTION_ZONE',
    telegraphMs: 900,
    activeMs: 1700,
    cooldownMs: 2900,
    startOffsetMs: 1600,
    damagePerTick: 2,
    damageTickMs: 420,
    label: 'CORRUPT',
    showOnMinimap: true,
    circle: { x: 7.5, y: 4.5, radius: 1.1 }
  },
  {
    id: 'w1-dark',
    kind: 'DARKNESS_PULSE',
    telegraphMs: 650,
    activeMs: 750,
    cooldownMs: 3100,
    startOffsetMs: 900,
    damagePerTick: 0,
    damageTickMs: 0,
    label: 'DARK'
  }
];

const WORLD2_HAZARDS: RaycastBossHazardDefinition[] = [
  ...WORLD1_HAZARDS.map((h, i) => ({ ...h, id: `w2-${h.id}`, startOffsetMs: h.startOffsetMs + i * 180 })),
  {
    id: 'w2-wall',
    kind: 'MOVING_WALL',
    telegraphMs: 760,
    activeMs: 1900,
    cooldownMs: 1800,
    startOffsetMs: 1200,
    damagePerTick: 2,
    damageTickMs: 300,
    label: 'SHIFT',
    showOnMinimap: true,
    sweep: { xFrom: 3, xTo: 12, y: 7.5, halfHeight: 4.8, width: 0.5 }
  },
  {
    id: 'w2-lava',
    kind: 'LAVA_FLOOR',
    telegraphMs: 840,
    activeMs: 2000,
    cooldownMs: 1800,
    startOffsetMs: 2600,
    damagePerTick: 3,
    damageTickMs: 320,
    label: 'LAVA',
    showOnMinimap: true,
    rect: { x: 5.5, y: 10, width: 4, height: 2.2 }
  }
];

const WORLD3_HAZARDS: RaycastBossHazardDefinition[] = [
  ...WORLD2_HAZARDS.map((h, i) => ({ ...h, id: `w3-${h.id}`, startOffsetMs: h.startOffsetMs + i * 120 })),
  {
    id: 'w3-rot',
    kind: 'ROTATING_BARRIER',
    telegraphMs: 700,
    activeMs: 2200,
    cooldownMs: 1450,
    startOffsetMs: 800,
    damagePerTick: 2,
    damageTickMs: 260,
    label: 'SPIN',
    showOnMinimap: true,
    rotate: { x: 7.5, y: 7.5, length: 4.5, width: 0.45 }
  }
];

export function getBossHazardsForLevel(levelId: string): RaycastBossHazardDefinition[] {
  if (levelId === 'bloom-warden-pit') return WORLD2_HAZARDS;
  if (levelId === 'ash-judge-seal') return WORLD3_HAZARDS;
  if (levelId === 'volt-archon-pit') return WORLD1_HAZARDS;
  return [];
}

export function createRaycastBossHazardState(levelId: string): RaycastBossHazardState {
  return {
    levelId,
    hazards: getBossHazardsForLevel(levelId).map((def) => ({
      def,
      nextDamageAt: def.startOffsetMs,
      lastPhase: 'idle'
    }))
  };
}

export function tickRaycastBossHazards(
  state: RaycastBossHazardState,
  input: RaycastBossHazardTickInput
): RaycastBossHazardTickResult {
  const result: RaycastBossHazardTickResult = {
    damage: 0,
    triggerDarknessPulse: false,
    telegraphLabels: [],
    activeLabels: [],
    markers: []
  };
  if (!input.bossAlive || state.hazards.length === 0) return result;

  for (const hz of state.hazards) {
    const phase = phaseForHazard(hz.def, input.nowMs);
    if (hz.def.showOnMinimap && (phase === 'telegraph' || phase === 'active')) {
      result.markers.push(markerForHazard(hz.def, input.nowMs));
    }
    if (phase === 'telegraph' && hz.lastPhase !== 'telegraph') result.telegraphLabels.push(hz.def.label);
    if (phase === 'active') {
      result.activeLabels.push(hz.def.label);
      if (hz.def.kind === 'DARKNESS_PULSE') {
        if (hz.lastPhase !== 'active') result.triggerDarknessPulse = true;
      } else if (input.nowMs >= hz.nextDamageAt && playerInsideHazard(hz.def, input.nowMs, input.player)) {
        result.damage += hz.def.damagePerTick;
        hz.nextDamageAt = input.nowMs + Math.max(120, hz.def.damageTickMs);
      }
    } else {
      hz.nextDamageAt = Math.max(hz.nextDamageAt, input.nowMs + 80);
    }
    hz.lastPhase = phase;
  }
  return result;
}

export function getRaycastBossHazardMarkers(
  state: RaycastBossHazardState,
  nowMs: number,
  bossAlive: boolean
): RaycastBossHazardMarker[] {
  if (!bossAlive) return [];
  const markers: RaycastBossHazardMarker[] = [];
  for (const hz of state.hazards) {
    const phase = phaseForHazard(hz.def, nowMs);
    if (!hz.def.showOnMinimap) continue;
    if (phase === 'telegraph' || phase === 'active') markers.push(markerForHazard(hz.def, nowMs));
  }
  return markers;
}
