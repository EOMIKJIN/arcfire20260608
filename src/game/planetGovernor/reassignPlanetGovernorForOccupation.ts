// ============================================================
// 점령 변경 시 총사령관 예비 풀에서 재배정
// ============================================================

import {
  assignPlanetGovernorFromReserve,
  hydratePlanetGovernorAssignmentStore,
  type PlanetGovernorAssignment,
} from './planetGovernorAssignmentStore';
import type { GovernorOccupationSide } from './planetGovernorReservePool';

export async function reassignPlanetGovernorForOccupation(params: {
  planetId: string;
  newFactionSide: GovernorOccupationSide;
}): Promise<PlanetGovernorAssignment | null> {
  await hydratePlanetGovernorAssignmentStore();
  return assignPlanetGovernorFromReserve({
    planetId: params.planetId,
    occupationSide: params.newFactionSide,
  });
}

/** store hydrate 완료 후 동기 호출 — territorial hold 적용 직후 */
export function reassignPlanetGovernorForOccupationSync(params: {
  planetId: string;
  newFactionSide: GovernorOccupationSide;
}): PlanetGovernorAssignment | null {
  return assignPlanetGovernorFromReserve({
    planetId: params.planetId,
    occupationSide: params.newFactionSide,
  });
}
