// ============================================================
// v2.4 — runPlanetCoreStatEquilibriumPass 위임 (하위 호환)
// ============================================================

import { runPlanetCoreStatEquilibriumPass } from '../planetCore/runPlanetCoreStatEquilibriumPass';

export type FacilityStatNudgePassResult = {
  ran: boolean;
  planetsProcessed: number;
  totalNudgeApplied: {
    resource: number;
    population: number;
    defense: number;
    technology: number;
    environment: number;
  };
};

/** @deprecated v2.4 — runPlanetCoreStatEquilibriumPass 사용 */
export function runFacilityStatNudgePass(): FacilityStatNudgePassResult {
  const r = runPlanetCoreStatEquilibriumPass();
  return {
    ran: r.ran,
    planetsProcessed: r.planetsProcessed,
    totalNudgeApplied: {
      resource: 0,
      population: 0,
      defense: 0,
      technology: 0,
      environment: 0,
    },
  };
}
