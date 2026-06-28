// ============================================================
// tg_* 교역 — 성계 노드(맵) 거리별 차익 가중(범용)
// ============================================================

import { TradeRouteTransportPolicy_FROM_BALANCE_CSV } from '../../data/balance/generated';
import {
  resolveGalaxySystemHopDistance,
  resolveSystemIdForPlanetIdFromGalaxy,
} from '../../world/resolvePlanetSystemPosition';
import type { TradeRouteAttrs } from './tradeRouteRegistry';
import { resolvePlanetSystemMapDistance } from './tradeRouteTransportCost';

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

export function getTradeRouteSupplyBuyPriceFactor(): number {
  const v = parseNum(getPolicyKv().get('supply_buy_price_factor'), 0.8);
  return clamp(v, 0.05, 1);
}

export function getTradeRouteShortRouteMaxHops(): number {
  return Math.max(0, Math.floor(parseNum(getPolicyKv().get('short_route_max_hops'), 2)));
}

export function getTradeRouteShortRouteMaxProfitMarginPct(): number {
  return clamp(parseNum(getPolicyKv().get('short_route_max_profit_margin_pct'), 30), 1, 200);
}

export function getTradeRouteReferenceRouteHops(): number {
  return Math.max(1, Math.floor(parseNum(getPolicyKv().get('reference_route_hops'), 6)));
}

function getProfitDistanceScaleAxis(): 'hops' | 'map' {
  return getPolicyKv().get('profit_distance_scale_axis') === 'map' ? 'map' : 'hops';
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function resolveSystemIdForPlanet(planetId: string): string | null {
  return resolveSystemIdForPlanetIdFromGalaxy(planetId);
}

function resolveSystemHopDistance(systemIdA: string, systemIdB: string): number {
  if (!systemIdA || !systemIdB) return 0;
  if (systemIdA === systemIdB) return 0;
  const hops = resolveGalaxySystemHopDistance(systemIdA, systemIdB);
  if (hops > 0) return hops;
  return getTradeRouteReferenceRouteHops();
}

/** 성계 연결 그래프 기준 행성 간 노드 홉(동일 성계=0) */
export function resolvePlanetSystemHopDistance(planetIdA: string, planetIdB: string): number {
  if (!planetIdA || !planetIdB || planetIdA === planetIdB) return 0;
  const sysA = resolveSystemIdForPlanet(planetIdA);
  const sysB = resolveSystemIdForPlanet(planetIdB);
  if (!sysA || !sysB) return 0;
  return resolveSystemHopDistance(sysA, sysB);
}

/**
 * 0=근거리(차익 상한) … 1=장거리(테이블 정본 차익).
 * hops·map 중 policy 축으로 선형 보간.
 */
export function resolveTradeRouteDistanceProfitWeight(
  supplyPlanetId: string,
  demandPlanetId: string,
): number {
  const shortHops = getTradeRouteShortRouteMaxHops();
  const refHops = Math.max(shortHops + 1, getTradeRouteReferenceRouteHops());
  const axis = getProfitDistanceScaleAxis();

  if (axis === 'map') {
    const refDist = Math.max(0.05, parseNum(getPolicyKv().get('reference_map_distance'), 0.28));
    const shortDist = refDist * (shortHops / refHops);
    const dist = resolvePlanetSystemMapDistance(supplyPlanetId, demandPlanetId);
    if (dist <= shortDist) return 0;
    if (dist >= refDist) return 1;
    return clamp((dist - shortDist) / (refDist - shortDist), 0, 1);
  }

  const hops = resolvePlanetSystemHopDistance(supplyPlanetId, demandPlanetId);
  if (hops <= shortHops) return 0;
  if (hops >= refHops) return 1;
  return (hops - shortHops) / (refHops - shortHops);
}

/** 생산지 매입 앵커(테이블 baseBuy × 정책 계수) */
export function resolveTradeRouteSupplyBuyAnchor(attrs: TradeRouteAttrs): number {
  return Math.max(1, Math.floor(attrs.baseBuyPrice * getTradeRouteSupplyBuyPriceFactor()));
}

/**
 * 공급→수요 거리 가중 차익(개당 CR).
 * 근거리: 생산 매입가 × short_route_max_profit_margin_pct.
 * 장거리: baseSell − 생산매입(테이블 정본).
 */
export function resolveDistanceScaledTradeRouteGrossProfit(
  attrs: TradeRouteAttrs,
  supplyPlanetId: string,
  demandPlanetId: string,
): number {
  const supplyBuy = resolveTradeRouteSupplyBuyAnchor(attrs);
  const tableSell = Math.max(supplyBuy + 1, attrs.baseSellPrice);
  const fullGross = Math.max(0, tableSell - supplyBuy);
  const shortCapGross = Math.max(
    1,
    Math.floor(supplyBuy * (getTradeRouteShortRouteMaxProfitMarginPct() / 100)),
  );
  const weight = resolveTradeRouteDistanceProfitWeight(supplyPlanetId, demandPlanetId);
  if (weight <= 0) return shortCapGross;
  if (weight >= 1) return fullGross;
  return Math.max(1, Math.floor(shortCapGross + (fullGross - shortCapGross) * weight));
}

/** 수요지 NPC 매입가(플레이어 판매) 앵커 — 거리 가중 */
export function resolveDistanceScaledDemandSellAnchor(
  attrs: TradeRouteAttrs,
  supplyPlanetId: string,
  demandPlanetId: string,
): number {
  const supplyBuy = resolveTradeRouteSupplyBuyAnchor(attrs);
  const gross = resolveDistanceScaledTradeRouteGrossProfit(attrs, supplyPlanetId, demandPlanetId);
  return Math.max(1, supplyBuy + gross);
}
