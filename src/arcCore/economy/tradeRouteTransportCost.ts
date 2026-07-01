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

/** 성계 좌표 기준 두 행성 간 유클리드 거리(맵 단위) */
export function resolvePlanetSystemMapDistance(planetIdA: string, planetIdB: string): number {
  if (!planetIdA || !planetIdB || planetIdA === planetIdB) return 0;
  const posA = resolveSystemPositionForPlanetId(planetIdA);
  const posB = resolveSystemPositionForPlanetId(planetIdB);
  if (!posA || !posB) return 0;
  return Math.hypot(posA.x - posB.x, posA.y - posB.y);
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

/** 공급→수요 1개당 운송비(CR) */
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
 * 총차익(gross) → 순차익(net).
 * 가까운 공급·수요 쌍은 거리 스케일로 차익이 작고, 먼 쌍은 상대적으로 커진다.
 */
export function applyTradeRouteNetProfitPerUnit(
  grossProfitPerUnit: number,
  supplyPlanetId: string,
  demandPlanetId: string,
  goodId: string,
): number {
  if (grossProfitPerUnit <= 0) return 0;
  const refDist = getTradeRouteReferenceMapDistance();
  const minNet = getTradeRouteMinNetProfitPerUnit();
  const distance = resolvePlanetSystemMapDistance(supplyPlanetId, demandPlanetId);
  const transport = computeTradeRouteTransportCostPerUnit(supplyPlanetId, demandPlanetId, goodId);
  const scale = refDist > 0 ? distance / refDist : 1;
  const scaledGross = Math.floor(grossProfitPerUnit * scale);
  return Math.max(minNet, scaledGross - transport);
}
