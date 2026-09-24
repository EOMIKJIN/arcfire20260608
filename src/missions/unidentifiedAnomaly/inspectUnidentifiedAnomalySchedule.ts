export type UnidentifiedAnomalyScheduleState = {
  activeExpiresAtMs: number | null;
  nextSpawnAtMs: number;
};

export function inspectUnidentifiedAnomalySchedule(
  state: UnidentifiedAnomalyScheduleState,
  nowMs: number,
): { settleDue: boolean; spawnDue: boolean; nextAtMs: number | null } {
  const exp = state.activeExpiresAtMs;
  const settleDue = exp != null && exp <= nowMs;
  const spawnDue = (exp == null || settleDue) && state.nextSpawnAtMs <= nowMs;
  let nextAtMs: number | null = null;
  if (exp != null && exp > nowMs) nextAtMs = exp;
  if (state.nextSpawnAtMs > nowMs) {
    if (nextAtMs == null || state.nextSpawnAtMs < nextAtMs) nextAtMs = state.nextSpawnAtMs;
  }
  return { settleDue, spawnDue, nextAtMs };
}
