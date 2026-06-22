/** 활성 전투 미션 시 transit 인카운터 확률 보정. */
export function resolveTransitEncounterChance(
  zone: string,
  hasActiveCombatMission: boolean,
): number {
  let base = 0.1;
  if (zone === 'neutral') base = 0.3;
  if (zone === 'pvp') base = 0.7;
  if (hasActiveCombatMission) return Math.min(1, base + 0.4);
  return base;
}
