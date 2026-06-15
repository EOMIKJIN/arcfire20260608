// ============================================================
// Planet Economy Fabric — 운영 실물 데이터 → 5대 스탯 → 무역 재고 연결 계약
// 김경제 에이전트 · v4.0 일 1회 배치 수렴
// ============================================================

import type { PlanetCoreGaugeView } from '../../store/planetCoreRuntimeStore';
import { usePlanetCoreRuntimeStore } from '../../store/planetCoreRuntimeStore';
import type {
  PlanetEconomyFabricDetail,
  PlanetEconomyFabricEvent,
} from '../../store/planetCoreMetricTypes';
import { planetAttackKstDayKey } from '../planetAttack/planetAttackKstDayKey';

const MAX_RECENT_EVENTS = 24;

export type PlanetEconomyOperationalSnapshot = {
  planetId: string;
  gauge: PlanetCoreGaugeView;
  supplyStockScale: number;
  windowConvoyProfit: number;
  windowConvoyTrips: number;
  windowDefenseLoss: number;
  windowSupplyUnitsDelivered: number;
};

function emptyFabricDetail(kstDayKey: string): PlanetEconomyFabricDetail {
  return {
    version: 1,
    window: {
      kstDayKey,
      convoyProfitCredits: 0,
      convoyTrips: 0,
      supplyUnitsDelivered: 0,
      attackDefenseLoss: 0,
      attackPopulationLoss: 0,
    },
    recentEvents: [],
  };
}

function resolveFabricDetail(
  prev: PlanetEconomyFabricDetail | undefined,
  kstDayKey: string,
): PlanetEconomyFabricDetail {
  if (!prev || prev.version !== 1) return emptyFabricDetail(kstDayKey);
  if (prev.window.kstDayKey !== kstDayKey) {
    return {
      ...prev,
      window: emptyFabricDetail(kstDayKey).window,
    };
  }
  return prev;
}

function appendEvent(
  detail: PlanetEconomyFabricDetail,
  event: PlanetEconomyFabricEvent,
): PlanetEconomyFabricDetail {
  return {
    ...detail,
    recentEvents: [event, ...detail.recentEvents].slice(0, MAX_RECENT_EVENTS),
  };
}

function patchPlanetFabricDetail(
  planetId: string,
  mutator: (detail: PlanetEconomyFabricDetail) => PlanetEconomyFabricDetail,
): void {
  const core = usePlanetCoreRuntimeStore.getState();
  if (!core.hydrated) return;
  const runtime = core.getPlanetCoreRuntime(planetId);
  if (!runtime) return;
  const kstDayKey = planetAttackKstDayKey();
  const prev = resolveFabricDetail(runtime.detail?.economyFabric, kstDayKey);
  const next = mutator(prev);
  core.patchPlanetCore(planetId, {
    detail: {
      ...runtime.detail,
      economyFabric: next,
    },
  });
}

/** 드론·공성 등 — 스탯 피해 후 운영 윈도우에 누적 */
export function recordPlanetEconomyAttackSignal(
  planetId: string,
  attackKind: string,
  applied: { defense: number; population: number },
): void {
  patchPlanetFabricDetail(planetId, (detail) => {
    let next = detail;
    if (applied.defense < 0) {
      next = {
        ...next,
        window: {
          ...next.window,
          attackDefenseLoss: next.window.attackDefenseLoss + Math.abs(applied.defense),
        },
      };
    }
    if (applied.population < 0) {
      next = {
        ...next,
        window: {
          ...next.window,
          attackPopulationLoss: next.window.attackPopulationLoss + Math.abs(applied.population),
        },
      };
    }
    return appendEvent(next, {
      kind: 'attack',
      atMs: Date.now(),
      payload: { attackKindHash: attackKind.length, defense: applied.defense, population: applied.population },
    });
  });
}

/** 아크 수송선 체류 정산 — 수익·물량 운영 윈도우 */
export function recordPlanetEconomyConvoySettlement(
  planetId: string,
  qty: number,
  profitCredits: number,
): void {
  if (qty <= 0 && profitCredits <= 0) return;
  patchPlanetFabricDetail(planetId, (detail) => {
    const next: PlanetEconomyFabricDetail = {
      ...detail,
      window: {
        ...detail.window,
        convoyTrips: detail.window.convoyTrips + 1,
        convoyProfitCredits: detail.window.convoyProfitCredits + Math.max(0, profitCredits),
        supplyUnitsDelivered: detail.window.supplyUnitsDelivered + Math.max(0, qty),
      },
    };
    return appendEvent(next, {
      kind: 'convoy_settlement',
      atMs: Date.now(),
      payload: { qty, profitCredits },
    });
  });
}

/**
 * 운영 실물(교역 재고 스케일·수송·피해)에서 산출한 생산지 재고 배율.
 * 일일 배치 `runPlanetEconomyFabricDailyPass`가 갱신 — 당일은 전일 reconcile 또는 1.0.
 */
export function resolvePlanetSupplyStockScale(planetId: string): number {
  const core = usePlanetCoreRuntimeStore.getState();
  if (!core.hydrated) return 1;
  const runtime = core.getPlanetCoreRuntime(planetId);
  const scale = runtime?.detail?.economyFabric?.lastDailyReconcile?.supplyStockScale;
  if (typeof scale === 'number' && Number.isFinite(scale)) {
    return Math.max(0.35, Math.min(1.65, scale));
  }
  return 1;
}

export function capturePlanetEconomyOperationalSnapshot(planetId: string): PlanetEconomyOperationalSnapshot | null {
  const core = usePlanetCoreRuntimeStore.getState();
  if (!core.hydrated) return null;
  const runtime = core.getPlanetCoreRuntime(planetId);
  if (!runtime) return null;
  const gauge = {
    resource: runtime.resource,
    population: runtime.population,
    defense: runtime.defense,
    technology: runtime.technology,
    environment: runtime.environment,
  };
  const fabric = runtime.detail?.economyFabric;
  return {
    planetId,
    gauge,
    supplyStockScale: resolvePlanetSupplyStockScale(planetId),
    windowConvoyProfit: fabric?.window.convoyProfitCredits ?? 0,
    windowConvoyTrips: fabric?.window.convoyTrips ?? 0,
    windowDefenseLoss: fabric?.window.attackDefenseLoss ?? 0,
    windowSupplyUnitsDelivered: fabric?.window.supplyUnitsDelivered ?? 0,
  };
}

export type PlanetEconomyFabricDailyPassResult = {
  ran: boolean;
  planetsReconciled: number;
};

/**
 * 24h 운영 윈도우 → 생산 재고 배율·(향후) 스탯 힌트 산출.
 * **일 1회** `runArcCoreDailyOpsBatch`에서만 호출.
 */
export function runPlanetEconomyFabricDailyPass(): PlanetEconomyFabricDailyPassResult {
  const core = usePlanetCoreRuntimeStore.getState();
  if (!core.hydrated) return { ran: false, planetsReconciled: 0 };

  const kstDayKey = planetAttackKstDayKey();
  let planetsReconciled = 0;

  for (const planetId of Object.keys(core.byPlanetId)) {
    const runtime = core.getPlanetCoreRuntime(planetId);
    if (!runtime) continue;

    const fabric = resolveFabricDetail(runtime.detail?.economyFabric, kstDayKey);
    const gauge = {
      resource: runtime.resource,
      population: runtime.population,
      defense: runtime.defense,
      technology: runtime.technology,
      environment: runtime.environment,
    };

    const operationalBase =
      (gauge.resource * 0.55 + gauge.population * 0.45) / 100;
    const convoyBoost = Math.min(0.15, fabric.window.convoyTrips * 0.02);
    const defensePenalty = Math.min(0.25, fabric.window.attackDefenseLoss * 0.004);
    const populationPenalty = Math.min(0.2, fabric.window.attackPopulationLoss * 0.006);
    const supplyStockScale = Math.max(
      0.35,
      Math.min(1.65, operationalBase * 0.85 + convoyBoost + 0.25 - defensePenalty - populationPenalty),
    );

    const nextFabric: PlanetEconomyFabricDetail = {
      ...fabric,
      lastDailyReconcile: {
        atMs: Date.now(),
        supplyStockScale,
        operationalBase,
        windowSummary: { ...fabric.window },
      },
      window: emptyFabricDetail(kstDayKey).window,
    };

    core.patchPlanetCore(planetId, {
      detail: {
        ...runtime.detail,
        economyFabric: nextFabric,
      },
    });
    planetsReconciled += 1;
  }

  return { ran: true, planetsReconciled };
}
