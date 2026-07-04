// ============================================================
// 아크코어 — 전역 행성 마스터 밸런스 패스
// - 월드 전 행성 5지표를 `planet_leveling_progression.csv` 목표로 부드럽게 동기
// - 런타임 메타는 `planetCoreRuntimeStore.detail.masterBalance` (CSV 쓰기 금지)
// ============================================================

import { LevelBandTargets_FROM_BALANCE_CSV } from '../../data/balance/generated';
import { forEachCoreOpenGameplayPlanet } from '../../world/coreOpenGameplayPlanets';
import {
  planetCoreRuntimeToGaugeView,
  usePlanetCoreRuntimeStore,
  type PlanetCoreGaugeView,
} from '../../store/planetCoreRuntimeStore';
import type { PlanetMasterBalanceDetail } from '../../store/planetCoreMetricTypes';
import { getPlanetMasterBalanceDetailForPlanet } from './planetZoneIndexRegistry';
import { deriveMasterBalanceCoreTargets } from './deriveMasterBalanceCoreTargets';
import {
  nudgeGaugeTowardTargetWithOptionalFloor,
  resolveEarlyZoneMasterBalanceAdjust,
} from './resolveEarlyZoneMasterBalanceTarget';
import { runPlayScenarioEconomyPass } from '../balance/runPlayScenarioEconomyPass';
import { resolvePlanetCoreStatAuthority } from '../balance/planetCoreStatAuthorityPolicy';
import { resolvePlanetCoreStatAuthorityContext } from '../planetCore/resolvePlanetCoreStatContext';

export type GlobalPlanetMasterBalancePassOptions = {
  /** 지표당 최대 변화량(0..100). 부트스트랩은 크게, 주기 패스는 작게 */
  maxDeltaPerStat?: number;
};

function resolveRuntimeCpmMul(recommendedPilotLevel: number): number {
  const band = LevelBandTargets_FROM_BALANCE_CSV.find(
    (b) =>
      recommendedPilotLevel >= parseNum(b.minLevel) &&
      recommendedPilotLevel <= parseNum(b.maxLevel),
  );
  if (!band) return 1;
  const tier = parseNum(band.targetCombatPowerTier, 1);
  return Math.max(0.85, Math.min(1.2, 0.9 + tier * 0.06));
}

function parseNum(raw: string | number | undefined, fallback = 0): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

type PlanetBalancePatch = {
  gauge: PlanetCoreGaugeView;
  masterBalance: PlanetMasterBalanceDetail;
};

export type GlobalPlanetMasterBalancePassResult = {
  planetsGaugeUpdated: number;
  planetsMetaOnly: number;
  planetsSkippedPlayerAuthority: number;
};

/**
 * 월드 **전 행성** 마스터 밸런스 동기. `hydrated` 전이면 noop.
 * Player/Home context — gauge authority는 equilibrium 전용(meta만 갱신).
 */
export function runGlobalPlanetMasterBalancePass(
  options?: GlobalPlanetMasterBalancePassOptions,
): GlobalPlanetMasterBalancePassResult {
  const empty: GlobalPlanetMasterBalancePassResult = {
    planetsGaugeUpdated: 0,
    planetsMetaOnly: 0,
    planetsSkippedPlayerAuthority: 0,
  };
  const coreStore = usePlanetCoreRuntimeStore.getState();
  if (!coreStore.hydrated) return empty;

  const defaultMaxDelta = options?.maxDeltaPerStat;
  const updates: Record<string, PlanetBalancePatch> = {};
  let planetsGaugeUpdated = 0;
  let planetsMetaOnly = 0;
  let planetsSkippedPlayerAuthority = 0;

  forEachCoreOpenGameplayPlanet(({ planetId, planet, system: sys }) => {
      const runtime = coreStore.getPlanetCoreRuntime(planetId);
      if (!runtime) return;

      const authorityContext = resolvePlanetCoreStatAuthorityContext(planetId);
      const authority = resolvePlanetCoreStatAuthority(authorityContext);
      if (!authority.masterBalanceGauge) {
        planetsSkippedPlayerAuthority += 1;
      }

      const baseDetail = getPlanetMasterBalanceDetailForPlanet(planetId, sys);
      const masterBalance = {
        ...baseDetail,
        runtimeCpmMul: resolveRuntimeCpmMul(baseDetail.recommendedPilotLevel),
      };
      const zoneTarget = deriveMasterBalanceCoreTargets(masterBalance);
      const { target, maxDelta, gaugeFloorPct } = resolveEarlyZoneMasterBalanceAdjust(
        planet,
        masterBalance.zoneIndex,
        zoneTarget,
      );
      const current = planetCoreRuntimeToGaugeView(runtime);
      const effectiveMaxDelta = defaultMaxDelta ?? maxDelta;
      const gauge = authority.masterBalanceGauge
        ? nudgeGaugeTowardTargetWithOptionalFloor(
            current,
            target,
            effectiveMaxDelta,
            gaugeFloorPct,
          )
        : current;

      const prevBal = runtime.detail?.masterBalance;
      const gaugeChanged =
        authority.masterBalanceGauge &&
        (gauge.resource !== current.resource ||
          gauge.population !== current.population ||
          gauge.defense !== current.defense ||
          gauge.technology !== current.technology ||
          gauge.environment !== current.environment);
      const metaChanged =
        !prevBal ||
        prevBal.zoneIndex !== masterBalance.zoneIndex ||
        prevBal.requiredFleetMinDps !== masterBalance.requiredFleetMinDps;

      if (gaugeChanged || metaChanged) {
        updates[planetId] = { gauge, masterBalance };
        if (gaugeChanged) planetsGaugeUpdated += 1;
        else if (metaChanged) planetsMetaOnly += 1;
      }
  });

  if (Object.keys(updates).length > 0) {
    coreStore.patchPlanetMasterBalanceBulk(updates);
  }
  runPlayScenarioEconomyPass(false);
  return {
    planetsGaugeUpdated,
    planetsMetaOnly,
    planetsSkippedPlayerAuthority,
  };
}
