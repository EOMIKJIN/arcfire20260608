// ============================================================
// [보완 #4] 일 1회 PGP 갱신 — 12:00 KST 배치에서만 실행 (실시간 없음)
// ============================================================

import {
  markPlanetCoreRuntimeDirty,
  planetCsvBaselineToRuntime,
  planetCoreRuntimeToGaugeView,
  usePlanetCoreRuntimeStore,
} from '../../store/planetCoreRuntimeStore';
import { calculatePlanetPgpFromStats } from '../../world/planetPgpModel';
import { resolvePlanetDevelopmentTdiPgpBonusBmu } from '../planetDevelopment/planetDevelopmentLevelBenefits';
import { forEachCoreOpenGameplayPlanet } from '../../world/coreOpenGameplayPlanets';

export type PlanetPgpDailyPassResult = {
  ran: boolean;
  planetsUpdated: number;
};

export function runPlanetPgpDailyPass(): PlanetPgpDailyPassResult {
  const core = usePlanetCoreRuntimeStore.getState();
  if (!core.hydrated) return { ran: false, planetsUpdated: 0 };

  let next = { ...core.byPlanetId };
  let planetsUpdated = 0;
  const t = Date.now();

  forEachCoreOpenGameplayPlanet(({ planetId, planet }) => {
    const prev = next[planetId] ?? planetCsvBaselineToRuntime(planet);
    const gauge = planetCoreRuntimeToGaugeView(prev);
    const pgp = calculatePlanetPgpFromStats(gauge) + resolvePlanetDevelopmentTdiPgpBonusBmu(planetId);
    if (prev.pgp === pgp) return;
    next = {
      ...next,
      [planetId]: {
        ...prev,
        pgp,
        updatedAt: t,
      },
    };
    planetsUpdated += 1;
  });

  if (planetsUpdated > 0) {
    usePlanetCoreRuntimeStore.setState({ byPlanetId: next });
    markPlanetCoreRuntimeDirty();
    void core.persistPlanetCoreRuntime();
  }

  return { ran: true, planetsUpdated };
}
