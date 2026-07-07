// ============================================================
// [v5] 일 1회 소유권 증서 가격 갱신 — 12:00 KST 배치 (실시간 없음)
// ============================================================

import { planetAttackKstDayKey } from '../planetAttack/planetAttackKstDayKey';
import {
  markPlanetCoreRuntimeDirty,
  usePlanetCoreRuntimeStore,
} from '../../store/planetCoreRuntimeStore';
import { isPlanetOwnershipDeedCatalogEligible } from '../balance/planetOwnershipDeedCatalog';
import { computePlanetOwnershipDeedValuation } from '../balance/computePlanetOwnershipDeedValuation';
import { forEachCoreOpenGameplayPlanet } from '../../world/coreOpenGameplayPlanets';

export type PlanetOwnershipDeedPricingDailyPassResult = {
  ran: boolean;
  planetsUpdated: number;
};

export function runPlanetOwnershipDeedPricingDailyPass(): PlanetOwnershipDeedPricingDailyPassResult {
  const core = usePlanetCoreRuntimeStore.getState();
  if (!core.hydrated) return { ran: false, planetsUpdated: 0 };

  const kstDayKey = planetAttackKstDayKey();
  const updatedAtMs = Date.now();
  let planetsUpdated = 0;

  forEachCoreOpenGameplayPlanet(({ planetId }) => {
    if (!isPlanetOwnershipDeedCatalogEligible(planetId)) return;

    const runtime = core.getPlanetCoreRuntime(planetId);
    if (!runtime) return;

    const valuation = computePlanetOwnershipDeedValuation(planetId);
    const prev = runtime.detail?.ownershipDeedPricing;
    if (
      prev?.kstDayKey === kstDayKey
      && prev.priceCredits === valuation.priceCredits
      && prev.annualTangibleCredits === valuation.annualTangibleCredits
      && prev.qualitativeCredits === valuation.qualitativeCredits
    ) {
      return;
    }

    core.patchPlanetCore(planetId, {
      detail: {
        ...runtime.detail,
        ownershipDeedPricing: {
          version: 1,
          kstDayKey,
          priceCredits: valuation.priceCredits,
          annualTangibleCredits: valuation.annualTangibleCredits,
          qualitativeCredits: valuation.qualitativeCredits,
          dailyGrossCredits: valuation.dailyGrossCredits,
          dailyNetCredits: valuation.dailyNetCredits,
          pgpBmu: valuation.pgpBmu,
          updatedAtMs,
        },
      },
    });
    planetsUpdated += 1;
  });

  if (planetsUpdated > 0) {
    markPlanetCoreRuntimeDirty();
    void core.persistPlanetCoreRuntime();
  }

  return { ran: true, planetsUpdated };
}
