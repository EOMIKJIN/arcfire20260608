// ============================================================
// 일 1회 시민 체류 패스 — 역할-시간 acc → world_default 5지표
// 수송 PHASE_WEIGHT·환경 다양성 패스와 축 분리. onBoot 금지.
// ============================================================

import { useArcNpcTrafficStore } from '../../store/arcNpcTrafficStore';
import {
  usePlanetCoreRuntimeStore,
  type PlanetCoreGaugeView,
} from '../../store/planetCoreRuntimeStore';
import { listCoreOpenGameplayPlanetIds } from '../../world/coreOpenGameplayPlanets';
import { getCaptainPresenceWorldIndex } from '../captainPresence/buildCaptainPresenceWorldIndex';
import { invalidateCaptainPresenceWorldIndexCache } from '../captainPresence/captainPresenceWorldIndexCache';
import { resolvePlanetCoreStatAuthorityContext } from '../planetCore/resolvePlanetCoreStatContext';
import { isFrontierWildernessGaugeHold } from '../../world/galaxyFrontierDevelopmentRidge';
import {
  applyPlanetCoreGaugeChangeOrIntent,
  isPlanetCoreGaugeIntentBatchActive,
} from '../planetCore/planetCoreGaugeIntent';
import { resolvePlanetDwellCivicPolicy } from './planetDwellCivicPolicy';
import {
  consumeDwellCivicIntegerDeltas,
  listDwellCivicAccPlanetIds,
} from './planetDwellCivicAcc';
import { invalidateDwellSignalIndex } from './planetDwellSignals';

export type PlanetDwellCivicDailyPassResult = {
  ran: boolean;
  planetsProcessed: number;
  planetsApplied: number;
};

function clamp100(n: number): number {
  return Math.max(0, Math.min(100, Math.round(Number.isFinite(n) ? n : 0)));
}

function addGauge(base: PlanetCoreGaugeView, delta: PlanetCoreGaugeView): PlanetCoreGaugeView {
  return {
    resource: clamp100(base.resource + delta.resource),
    population: clamp100(base.population + delta.population),
    defense: clamp100(base.defense + delta.defense),
    technology: clamp100(base.technology + delta.technology),
    environment: clamp100(base.environment + delta.environment),
  };
}

function gaugeChanged(a: PlanetCoreGaugeView, b: PlanetCoreGaugeView): boolean {
  return (
    a.resource !== b.resource ||
    a.population !== b.population ||
    a.defense !== b.defense ||
    a.technology !== b.technology ||
    a.environment !== b.environment
  );
}

/**
 * 컨보이 정산 직후. 플레이어 소유/홈은 context 게이트로 스킵(1안 OFF).
 * 적용 후 신호·presence를 무효화하고 인덱스를 1회 재빌드해 다음날 틱 occupancy를 맞춘다.
 */
export function runPlanetDwellCivicDailyPass(): PlanetDwellCivicDailyPassResult {
  const empty: PlanetDwellCivicDailyPassResult = { ran: false, planetsProcessed: 0, planetsApplied: 0 };
  const coreStore = usePlanetCoreRuntimeStore.getState();
  if (!coreStore.hydrated) return empty;

  const policy = resolvePlanetDwellCivicPolicy();
  const cap = policy.dailyStatCap;
  const updates: Record<string, PlanetCoreGaugeView> = {};
  const planetIds = new Set([...listCoreOpenGameplayPlanetIds(), ...listDwellCivicAccPlanetIds()]);
  let planetsProcessed = 0;
  let planetsApplied = 0;

  for (const planetId of planetIds) {
    planetsProcessed += 1;
    if (
      resolvePlanetCoreStatAuthorityContext(planetId) !== 'world_default'
      || isFrontierWildernessGaugeHold(planetId)
    ) {
      consumeDwellCivicIntegerDeltas(planetId, cap);
      continue;
    }
    const runtime = coreStore.getPlanetCoreRuntime(planetId);
    if (!runtime) {
      consumeDwellCivicIntegerDeltas(planetId, cap);
      continue;
    }
    const delta = consumeDwellCivicIntegerDeltas(planetId, cap);
    const before: PlanetCoreGaugeView = {
      resource: runtime.resource,
      population: runtime.population,
      defense: runtime.defense,
      technology: runtime.technology,
      environment: runtime.environment,
    };
    const after = addGauge(before, delta);
    if (!gaugeChanged(before, after)) continue;
    applyPlanetCoreGaugeChangeOrIntent(planetId, before, after, 'arc_core', () => {
      updates[planetId] = after;
    });
    planetsApplied += 1;
  }

  if (!isPlanetCoreGaugeIntentBatchActive() && Object.keys(updates).length > 0) {
    coreStore.patchPlanetCoresBulk(updates);
  }

  invalidateDwellSignalIndex();
  invalidateCaptainPresenceWorldIndexCache();
  try {
    getCaptainPresenceWorldIndex(useArcNpcTrafficStore.getState().ships);
  } catch {
    /* 인덱스 재빌드 실패는 다음 허브 진입에서 회복 */
  }

  return { ran: true, planetsProcessed, planetsApplied };
}
