// ============================================================
// 행성 안정도 — runtime 조회 (행성정보 UI)
// ============================================================

import { isPlanetContestedZone } from '../arcCore/balance/balanceTableRegistry';
import { usePlanetCoreRuntimeStore } from '../store/planetCoreRuntimeStore';
import {
  clampPlanetWdi,
  resolvePlanetStabilityTierFromWdi,
  type PlanetStabilityRebellionPhase,
  type PlanetStabilityTier,
} from './planetStabilityTierCore';

export type {
  PlanetStabilityRebellionPhase,
  PlanetStabilityTier,
  PlanetStabilityTierVisual,
} from './planetStabilityTierCore';

export {
  PLANET_STABILITY_TIER_ORDER,
  PLANET_STABILITY_TIER_VISUALS,
  PLANET_STABILITY_TIER_INACTIVE_OPACITY,
  clampPlanetWdi,
  resolvePlanetStabilityTierColor,
  resolvePlanetStabilityTierColorOpacity,
  resolvePlanetStabilityTierFillPct,
  resolvePlanetStabilityTierFromWdi,
  resolvePlanetStabilityTierIndex,
} from './planetStabilityTierCore';

export type PlanetStabilityDisplay = {
  tier: PlanetStabilityTier;
  wdi: number;
  rebellionPhase: PlanetStabilityRebellionPhase;
  contestedHeld: boolean;
};

export function resolvePlanetStabilityDisplay(planetId: string): PlanetStabilityDisplay {
  const id = planetId?.trim();
  if (!id) {
    return { tier: 'stable', wdi: 0, rebellionPhase: 'none', contestedHeld: false };
  }

  if (isPlanetContestedZone(id)) {
    return { tier: 'stable', wdi: 0, rebellionPhase: 'none', contestedHeld: true };
  }

  const detail = usePlanetCoreRuntimeStore.getState().getPlanetCoreRuntime(id)?.detail?.wealthDisparity;
  if (detail?.version === 1) {
    const rebellionPhase = detail.rebellionPhase ?? 'none';
    const wdi = clampPlanetWdi(detail.wdi);
    return {
      tier: resolvePlanetStabilityTierFromWdi(wdi, rebellionPhase),
      wdi,
      rebellionPhase,
      contestedHeld: false,
    };
  }

  return { tier: 'stable', wdi: 0, rebellionPhase: 'none', contestedHeld: false };
}
