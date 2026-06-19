// ============================================================
// [보완 #4] 일 1회 PGP 갱신 — 12:00 KST 배치에서만 실행 (실시간 없음)
// ============================================================

import { useWorldStore } from '../../store/worldStore';
import {
  planetCsvBaselineToRuntime,
  planetCoreRuntimeToGaugeView,
  usePlanetCoreRuntimeStore,
} from '../../store/planetCoreRuntimeStore';
import { calculatePlanetPgpFromStats } from '../../world/planetPgpModel';
import { resolvePlanetDevelopmentTdiPgpBonusBmu } from '../planetDevelopment/planetDevelopmentLevelBenefits';

export type PlanetPgpDailyPassResult = {
  ran: boolean;
  planetsUpdated: number;
};

export function runPlanetPgpDailyPass(): PlanetPgpDailyPassResult {
  const core = usePlanetCoreRuntimeStore.getState();
  if (!core.hydrated) return { ran: false, planetsUpdated: 0 };

  const systems = useWorldStore.getState().systems;
  let next = { ...core.byPlanetId };
  let planetsUpdated = 0;
  const t = Date.now();

  for (const sys of Object.values(systems)) {
    for (const planet of sys.planets) {
      const prev = next[planet.id] ?? planetCsvBaselineToRuntime(planet);
      const gauge = planetCoreRuntimeToGaugeView(prev);
      const pgp = calculatePlanetPgpFromStats(gauge) + resolvePlanetDevelopmentTdiPgpBonusBmu(planet.id);
      if (prev.pgp === pgp) continue;
      next = {
        ...next,
        [planet.id]: {
          ...prev,
          pgp,
          updatedAt: t,
        },
      };
      planetsUpdated += 1;
    }
  }

  if (planetsUpdated > 0) {
    usePlanetCoreRuntimeStore.setState({ byPlanetId: next });
    void core.persistPlanetCoreRuntime();
  }

  return { ran: true, planetsUpdated };
}
