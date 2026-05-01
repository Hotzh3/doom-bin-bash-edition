export interface RaycastRunSummaryInput {
  elapsedMs: number;
  enemiesKilled: number;
  secretsFound: number;
  secretTotal: number;
  tokensFound: number;
  tokenTotal: number;
  damageTaken: number;
}

export function formatRunDuration(elapsedMs: number): string {
  const safeMs = Math.max(0, Math.floor(elapsedMs));
  const totalSeconds = Math.floor(safeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const tenths = Math.floor((safeMs % 1000) / 100);

  return `${minutes}:${seconds.toString().padStart(2, '0')}.${tenths}`;
}

export function buildRaycastRunSummary(input: RaycastRunSummaryInput): string[] {
  return [
    `TIME ${formatRunDuration(input.elapsedMs)}`,
    `ENEMIES KILLED ${input.enemiesKilled}`,
    `SECRETS ${input.secretsFound}/${input.secretTotal}`,
    `TOKENS ${input.tokensFound}/${input.tokenTotal}`,
    `DAMAGE TAKEN ${input.damageTaken}`
  ];
}
