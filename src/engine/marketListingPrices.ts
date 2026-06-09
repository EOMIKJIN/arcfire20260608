// ============================================================
// 시장 리스팅 — 구매·판매 단가(TradeEngine·교역로 견적 공용)
// ============================================================

import type { MarketListing } from '../types';
import {
  isArcCorePricedMineral,
  resolveMineralSellPriceCredits,
} from '../arcCore/economy/mineralTradePricing';

/** 구매 가격 계산 */
export function getBuyPrice(listing: MarketListing): number {
  const demandMod = listing.demand === 'high' ? 1.2 : listing.demand === 'low' ? 0.8 : 1.0;
  return Math.max(1, Math.floor(listing.price * demandMod));
}

/** 판매 가격 계산 — 광물은 아크코어 정책가 우선, 그 외 구매가의 90% */
export function getSellPrice(
  listing: MarketListing,
  opts?: { planetId?: string; goodId?: string },
): number {
  const goodId = opts?.goodId ?? listing.goodId;
  if (opts?.planetId && isArcCorePricedMineral(goodId)) {
    const policy = resolveMineralSellPriceCredits(opts.planetId, goodId);
    if (policy != null) return policy;
  }
  return Math.floor(getBuyPrice(listing) * 0.9);
}
