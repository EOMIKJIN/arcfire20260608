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

/** 일 1회 R·P 보정 상한(공격 신호와 분리) */
const FABRIC_GAUGE_NUDGE_CAP = 2;
const FABRIC_SUPPLY_UNITS_PER_R = 80;
const FABRIC_PLAYER_SELL_UNITS_PER_R = 40;
const FABRIC_PLAYER_TRADES_PER_P = 4;
const FABRIC_CONVOY_TRIPS_PER_P = 2;
const FABRIC_PLAYER_BUY_UNITS_PER_P = 30;

export type PlanetEconomyOperationalSnapshot = {
  planetId: string;
  gauge: PlanetCoreGaugeView;
  supplyStockScale: number;
  windowConvoyProfit: number;
  windowConvoyTrips: number;
  windowDefenseLoss: number;
  windowSupplyUnitsDelivered: number;
  windowPlayerTradeGross: number;
  windowPlayerTradeCount: number;
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
      playerTradeGrossCredits: 0,
      playerTradeCount: 0,
      playerBuyUnits: 0,
      playerSellUnits: 0,
    },
    recentEvents: [],
  };
}

function normalizeFabricWindow(
  window: Partial<PlanetEconomyFabricDetail['window']> & { kstDayKey: string },
): PlanetEconomyFabricDetail['window'] {
  return {
    kstDayKey: window.kstDayKey,
    convoyProfitCredits: Math.max(0, Number(window.convoyProfitCredits) || 0),
    convoyTrips: Math.max(0, Number(window.convoyTrips) || 0),
    supplyUnitsDelivered: Math.max(0, Number(window.supplyUnitsDelivered) || 0),
    attackDefenseLoss: Math.max(0, Number(window.attackDefenseLoss) || 0),
    attackPopulationLoss: Math.max(0, Number(window.attackPopulationLoss) || 0),
    playerTradeGrossCredits: Math.max(0, Number(window.playerTradeGrossCredits) || 0),
    playerTradeCount: Math.max(0, Number(window.playerTradeCount) || 0),
    playerBuyUnits: Math.max(0, Number(window.playerBuyUnits) || 0),
    playerSellUnits: Math.max(0, Number(window.playerSellUnits) || 0),
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
  return {
    ...prev,
    window: normalizeFabricWindow(prev.window),
  };
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

/** 플레이어 무역 — fabric 창에 누적(수수료 전 거래액·수량) */
export function recordPlanetEconomyPlayerTrade(
  planetId: string,
  side: 'buy' | 'sell',
  qty: number,
  grossCredits: number,
): void {
  const units = Math.max(0, Math.floor(qty));
  const gross = Math.max(0, Math.floor(grossCredits));
  if (!planetId || units <= 0 || gross <= 0) return;

  patchPlanetFabricDetail(planetId, (detail) => {
    const next: PlanetEconomyFabricDetail = {
      ...detail,
      window: {
        ...detail.window,
        playerTradeGrossCredits: detail.window.playerTradeGrossCredits + gross,
        playerTradeCount: detail.window.playerTradeCount + 1,
        playerBuyUnits: detail.window.playerBuyUnits + (side === 'buy' ? units : 0),
        playerSellUnits: detail.window.playerSellUnits + (side === 'sell' ? units : 0),
      },
    };
    return appendEvent(next, {
      kind: 'player_trade',
      atMs: Date.now(),
      payload: {
        side: side === 'buy' ? 1 : 2,
        units,
        gross,
      },
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
    windowPlayerTradeGross: fabric?.window.playerTradeGrossCredits ?? 0,
    windowPlayerTradeCount: fabric?.window.playerTradeCount ?? 0,
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
    const playerTradeBoost = Math.min(
      0.12,
      Math.floor(fabric.window.playerTradeGrossCredits / 1200) * 0.02 +
        Math.floor(fabric.window.playerTradeCount / 5) * 0.01,
    );
    const defensePenalty = Math.min(0.25, fabric.window.attackDefenseLoss * 0.004);
    const populationPenalty = Math.min(0.2, fabric.window.attackPopulationLoss * 0.006);
    const supplyStockScale = Math.max(
      0.35,
      Math.min(
        1.65,
        operationalBase * 0.85 + convoyBoost + playerTradeBoost + 0.25 - defensePenalty - populationPenalty,
      ),
    );

    const resourceNudge = Math.min(
      FABRIC_GAUGE_NUDGE_CAP,
      Math.floor(fabric.window.supplyUnitsDelivered / FABRIC_SUPPLY_UNITS_PER_R) +
        Math.floor(fabric.window.playerSellUnits / FABRIC_PLAYER_SELL_UNITS_PER_R),
    );
    const populationNudge = Math.min(
      FABRIC_GAUGE_NUDGE_CAP,
      Math.floor(fabric.window.playerTradeCount / FABRIC_PLAYER_TRADES_PER_P) +
        Math.floor(fabric.window.convoyTrips / FABRIC_CONVOY_TRIPS_PER_P) +
        Math.floor(fabric.window.playerBuyUnits / FABRIC_PLAYER_BUY_UNITS_PER_P),
    );

    const nextGauge: PlanetCoreGaugeView = {
      resource: Math.min(100, gauge.resource + resourceNudge),
      population: Math.min(100, gauge.population + populationNudge),
      defense: gauge.defense,
      technology: gauge.technology,
      environment: gauge.environment,
    };

    const nextFabric: PlanetEconomyFabricDetail = {
      ...fabric,
      lastDailyReconcile: {
        atMs: Date.now(),
        supplyStockScale,
        operationalBase,
        resourceNudge,
        populationNudge,
        windowSummary: { ...fabric.window },
      },
      window: emptyFabricDetail(kstDayKey).window,
    };

    core.patchPlanetCore(planetId, {
      resource: nextGauge.resource,
      population: nextGauge.population,
      detail: {
        ...runtime.detail,
        economyFabric: nextFabric,
      },
    });
    planetsReconciled += 1;
  }

  return { ran: true, planetsReconciled };
}
