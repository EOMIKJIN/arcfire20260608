// ============================================================
// 전투·교전 instance key — presence dedupe 공용
// ============================================================

export function buildMissionCombatInstanceKey(
  enemyTemplateId: string,
  planetId: string | null | undefined,
  captainId: string | null | undefined,
): string {
  const pid = String(planetId ?? 'any').trim() || 'any';
  const cid = String(captainId ?? 'unknown').trim() || 'unknown';
  return `mission_combat_${enemyTemplateId}_${pid}_${cid}`;
}

export function buildTransitCombatInstanceKey(
  systemId: string | null | undefined,
  captainId: string | null | undefined,
): string {
  const sid = String(systemId ?? 'any').trim() || 'any';
  const cid = String(captainId ?? 'unknown').trim() || 'unknown';
  return `transit_combat_${sid}_${cid}`;
}

export function buildHubCoPresenceCombatInstanceKey(
  planetId: string,
  captainIdA: string,
  captainIdB: string,
): string {
  const [a, b] = [captainIdA, captainIdB].sort();
  return `hub_copresence_${planetId}_${a}_${b}`;
}
