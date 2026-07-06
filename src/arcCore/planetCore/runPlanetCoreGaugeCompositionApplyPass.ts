// ============================================================
// 일 1회 — gauge intent 합산·pct cap·composition apply (단일 patch)
// ============================================================

import { forEachCoreOpenGameplayPlanet } from '../../world/coreOpenGameplayPlanets';
import {
  planetCoreRuntimeToGaugeView,
  usePlanetCoreRuntimeStore,
} from '../../store/planetCoreRuntimeStore';
import { resolvePlanetCoreGaugeCompositionPolicy } from '../balance/planetCoreGaugeCompositionPolicy';
import { planetAttackKstDayKey } from '../planetAttack/planetAttackKstDayKey';
import {
  applyPlanetCoreGaugeComposition,
  PLANET_CORE_GAUGE_KEYS,
} from './planetCoreGaugeCompositionModel';
import {
  endPlanetCoreGaugeIntentBatch,
  getPlanetCoreGaugeIntentSnapshot,
  isPlanetCoreGaugeIntentBatchActive,
} from './planetCoreGaugeIntent';

export type PlanetCoreGaugeCompositionApplyResult = {
  ran: boolean;
  planetsUpdated: number;
};

export function runPlanetCoreGaugeCompositionApplyPass(): PlanetCoreGaugeCompositionApplyResult {
  const empty: PlanetCoreGaugeCompositionApplyResult = { ran: false, planetsUpdated: 0 };
  if (!isPlanetCoreGaugeIntentBatchActive()) return empty;

  const policy = resolvePlanetCoreGaugeCompositionPolicy();
  if (!policy.arcCoreIntentWithoutDev && !policy.playerDevIntentEnabled) {
    endPlanetCoreGaugeIntentBatch();
    return empty;
  }

  const coreStore = usePlanetCoreRuntimeStore.getState();
  if (!coreStore.hydrated) {
    endPlanetCoreGaugeIntentBatch();
    return empty;
  }

  const intentSnap = getPlanetCoreGaugeIntentSnapshot();
  const kstDayKey = planetAttackKstDayKey();
  let planetsUpdated = 0;

  forEachCoreOpenGameplayPlanet(({ planetId }) => {
    const runtime = coreStore.getPlanetCoreRuntime(planetId);
    if (!runtime) return;

    const intents = intentSnap.get(planetId);
    const arcIntent = intents?.arc_core ?? {
      resource: 0,
      population: 0,
      defense: 0,
      technology: 0,
      environment: 0,
    };
    const devIntent = intents?.player_dev ?? {
      resource: 0,
      population: 0,
      defense: 0,
      technology: 0,
      environment: 0,
    };

    const hasIntent = PLANET_CORE_GAUGE_KEYS.some(
      (k) => (arcIntent[k] ?? 0) !== 0 || (devIntent[k] ?? 0) !== 0,
    );
    if (!hasIntent) return;

    const current = planetCoreRuntimeToGaugeView(runtime);
    const applied = applyPlanetCoreGaugeComposition({
      planetId,
      current,
      composition: runtime.detail?.gaugeComposition,
      arcIntent,
      devIntent,
      kstDayKey,
    });

    if (!applied.changed) return;

    coreStore.patchPlanetCore(planetId, {
      ...applied.gauge,
      detail: {
        ...runtime.detail,
        gaugeComposition: applied.composition,
      },
    });
    planetsUpdated += 1;
  });

  endPlanetCoreGaugeIntentBatch();

  return {
    ran: planetsUpdated > 0,
    planetsUpdated,
  };
}
