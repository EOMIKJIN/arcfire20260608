// ============================================================
// v2.0 §2 — 무역소 stockLimit → planetTradeMarketStore 재고 상한
// ============================================================

import { resolveTradePortStockLimit } from '../../arcCore/balance/facilityTradePortLevelPolicy';
import { resolveFacilityLevelByType } from './planetFacilityLevelResolver';

/** 설치·레벨 기준 SKU 재고 상한 — 미설치·0이면 null(글로벌 bounds만) */
export function resolvePlanetTradePortStockCap(planetId: string): number | null {
  const level = resolveFacilityLevelByType(planetId, 'trade_port');
  if (level <= 0) return null;
  const cap = resolveTradePortStockLimit(level);
  return cap > 0 ? cap : null;
}

export function clampStockToTradePortLimit(planetId: string, stock: number): number {
  const cap = resolvePlanetTradePortStockCap(planetId);
  if (cap == null) return Math.max(0, stock);
  return Math.max(0, Math.min(cap, Math.floor(stock)));
}
