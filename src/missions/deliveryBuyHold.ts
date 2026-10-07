/**
 * 구매로 buy_goods 가 닫힌 성계 — 같은 체류에서 배달(reach)까지 닫지 않는다.
 * 다른 성계에 착륙하면 홀드를 풀고, 그 착륙에서 배달 조건을 본다.
 * persist 없음. 계정 초기화 시 clearDeliveryBuyHolds.
 */

const holdSystemByMissionId = new Map<string, string>();

export function noteDeliveryBuyCompletedAtSystem(missionId: string, systemId: string): void {
  const mission = missionId.trim();
  const system = systemId.trim();
  if (!mission || !system) return;
  holdSystemByMissionId.set(mission, system);
}

/**
 * true — 이 성계 착륙에서는 배달 완료를 미룬다.
 * 다른 성계면 홀드를 지우고 false.
 */
export function isDeliveryReachDeferred(missionId: string, landedSystemId: string): boolean {
  const mission = missionId.trim();
  const held = holdSystemByMissionId.get(mission);
  if (!held) return false;
  const landed = landedSystemId.trim();
  if (held !== landed) {
    holdSystemByMissionId.delete(mission);
    return false;
  }
  return true;
}

export function clearDeliveryBuyHolds(): void {
  holdSystemByMissionId.clear();
}
