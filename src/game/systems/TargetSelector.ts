export interface TargetCandidate {
  x: number;
  y: number;
  alive: boolean;
}

export interface TargetOrigin {
  x: number;
  y: number;
}

export function selectClosestLivingTarget<T extends TargetCandidate>(origin: TargetOrigin, targets: T[]): T | null {
  const livingTargets = targets.filter((target) => target.alive);
  if (livingTargets.length === 0) return null;

  return livingTargets.reduce((closest, target) => {
    const closestDistance = getDistanceSquared(origin, closest);
    const targetDistance = getDistanceSquared(origin, target);
    return targetDistance < closestDistance ? target : closest;
  });
}

function getDistanceSquared(a: TargetOrigin, b: TargetOrigin): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}
