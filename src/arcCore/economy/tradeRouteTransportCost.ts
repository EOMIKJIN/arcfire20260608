// ============================================================
// tg_* 교역로 — 행성 간 맵 거리·운송비·순차익
// ============================================================

import { TradeRouteTransportPolicy_FROM_BALANCE_CSV } from '../../data/balance/generated';
import { getItemDef } from '../../data/itemRegistry';
import { resolveSystemPositionForPlanetId } from '../../world/resolvePlanetSystemPosition';

let policyKv: Map<string, string> | null = null;

function getPolicyKv(): Map<string, string> {
  if (!policyKv) {
    policyKv = new Map(
      TradeRouteTransportPolicy_FROM_BALANCE_CSV.map((row) => [row.key, row.value] as const),
    );
  }
  return policyKv;
}

function parseNum(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * 행성 쌍 거리 캐시 — 성계 좌표는 바뀌지 않는다. 크기 상한 = 교역 행성 수²(고정).
 * (품목까지 키에 넣으면 공급×수요×품목으로 끝없이 커져 JS 힙 보유분이 된다 — 2026-10-09 김클로드 검수)
 * 좌표를 못 찾은 쌍(신규 synth 성계 등록 전)은 캐시하지 않는다.
 */
const planetPairDistanceCache = new Map<string, number>();

/** 성계 좌표 기준 두 행성 간 유클리드 거리(맵 단위) */
export function resolvePlanetSystemMapDistance(planetIdA: string, planetIdB: string): number {
  if (!planetIdA || !planetIdB || planetIdA === planetIdB) return 0;
  const key = planetIdA < planetIdB ? `${planetIdA}|${planetIdB}` : `${planetIdB}|${planetIdA}`;
  const cached = planetPairDistanceCache.get(key);
  if (cached !== undefined) return cached;
  const posA = resolveSystemPositionForPlanetId(planetIdA);
  const posB = resolveSystemPositionForPlanetId(planetIdB);
  if (!posA || !posB) return 0;
  const distance = Math.hypot(posA.x - posB.x, posA.y - posB.y);
  planetPairDistanceCache.set(key, distance);
  return distance;
}

export function getTradeRouteReferenceMapDistance(): number {
  return Math.max(0.05, parseNum(getPolicyKv().get('reference_map_distance'), 0.28));
}

export function getTradeRouteMinNetProfitPerUnit(): number {
  return Math.max(0, parseNum(getPolicyKv().get('min_net_profit_per_unit'), 1));
}

/** 하역 순마진 중 아크코어 금고 귀속 비율(%) — CSV 정본 */
export function getConvoyNetMarginArcCoreSharePct(): number {
  return Math.max(0, Math.min(100, parseNum(getPolicyKv().get('convoy_net_margin_arc_core_share_pct'), 30)));
}

export function getConvoyTransportFuelSharePct(): number {
  return Math.max(0, Math.min(100, parseNum(getPolicyKv().get('convoy_transport_fuel_share_pct'), 85)));
}

export function getConvoyTransportOpsSharePct(): number {
  return Math.max(0, Math.min(100, parseNum(getPolicyKv().get('convoy_transport_ops_share_pct'), 15)));
}

/** 운송비 지출 txn note — 연료·기타 비용 분해(표시용) */
export function formatConvoyTransportSpendNote(totalCredits: number): string {
  const total = Math.max(0, Math.floor(totalCredits));
  if (total <= 0) return '운송비 0';
  const fuelPct = getConvoyTransportFuelSharePct();
  const fuel = Math.floor((total * fuelPct) / 100);
  const ops = total - fuel;
  return `연료 ${fuel}·기타 ${ops} cr (합 ${total})`;
}

/** 공급→수요 1개당 운송비(CR) — 거리 조회는 resolvePlanetSystemPosition 의 행성→성계 캐시를 탄다. 곱셈만 매번 한다. */
export function computeTradeRouteTransportCostPerUnit(
  supplyPlanetId: string,
  demandPlanetId: string,
  goodId: string,
): number {
  const kv = getPolicyKv();
  const costPerMapUnit = parseNum(kv.get('transport_cost_per_map_unit'), 150);
  const volumeMul = parseNum(kv.get('transport_volume_mul_per_unit'), 1);
  const def = getItemDef(goodId);
  const volume = Math.max(0.5, def?.volume ?? 1);
  const distance = resolvePlanetSystemMapDistance(supplyPlanetId, demandPlanetId);
  return Math.max(0, Math.floor(distance * costPerMapUnit * volume * volumeMul));
}

/**
 * 총차익(gross) → 순차익(net) = 총차익 − 운송비.
 * 거리 가중은 시세 차익(`resolveDistanceScaledTradeRouteGrossProfit`)에 이미 들어 있다.
 * 여기서 `거리/기준거리`를 다시 곱하면 먼 노선의 순익이 총차익보다 커진다.
 */
export function applyTradeRouteNetProfitPerUnit(
  grossProfitPerUnit: number,
  supplyPlanetId: string,
  demandPlanetId: string,
  goodId: string,
): number {
  if (grossProfitPerUnit <= 0) return 0;
  const minNet = getTradeRouteMinNetProfitPerUnit();
  const transport = computeTradeRouteTransportCostPerUnit(supplyPlanetId, demandPlanetId, goodId);
  return Math.max(minNet, Math.floor(grossProfitPerUnit) - transport);
}
