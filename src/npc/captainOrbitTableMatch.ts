// ============================================================
// CSV 함장 ↔ 행성 궤도 / 전투 슬롯 공통 매칭
// - 행성 id: basePlanetId, activityPlanetIds
// - 성계 id: baseSystemId, activitySystemIds (순찰·관문 등 CSV가 성계 단위로 기술된 경우)
// ============================================================

import type { NpcCaptain } from '../types';

export function captainMatchesPlanetOrbitTable(
  captain: NpcCaptain,
  planetId: string,
  systemId: string,
): boolean {
  return (
    captain.basePlanetId === planetId ||
    captain.activityPlanetIds.includes(planetId) ||
    captain.baseSystemId === systemId ||
    captain.activitySystemIds.includes(systemId)
  );
}
