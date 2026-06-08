// ============================================================
// 아크파이어 온라인 - 무역 엔진
// ============================================================

import { TradeGood, MarketListing, Planet } from '../types';
import { TRADE_GOODS, getItemDef } from '../data/goods';

/** 행성 시장 가격 계산 (시드 기반 결정론적) */
export function generateMarket(planet: Planet, seed: number = Date.now()): MarketListing[] {
  return generateMarketByItemIds(planet.tradeGoods, seed);
}

/** 아이템 id 목록으로 시장 생성 (무역소 DB/중개소 연동용) */
export function generateMarketByItemIds(goodIds: readonly string[], seed: number = Date.now()): MarketListing[] {
  return goodIds.map(goodId => {
    const good = TRADE_GOODS[goodId];
    if (!good) return null;
    const isWeaponModule = getItemDef(goodId)?.type === 'weapon_module';

    // 간단한 가격 변동 시뮬레이션
    const variance = isWeaponModule ? 0 : good.priceVariance / 100;
    const rng = pseudoRandom(seed + goodId.charCodeAt(0));
    const priceMod = 1 + (rng - 0.5) * variance * 2;
    const price = isWeaponModule ? 1 : Math.floor(good.basePrice * priceMod);

    const demandRng = pseudoRandom(seed + goodId.charCodeAt(1));
    const demand: MarketListing['demand'] =
      demandRng < 0.33 ? 'low' : demandRng < 0.66 ? 'normal' : 'high';

    const stock = Math.floor(pseudoRandom(seed + goodId.length) * 50) + 10;

    return { goodId, price, stock, demand };
  }).filter(Boolean) as MarketListing[];
}

/** 구매 가격 계산 */
export function getBuyPrice(listing: MarketListing): number {
  if (getItemDef(listing.goodId)?.type === 'weapon_module') return 1;
  const demandMod = listing.demand === 'high' ? 1.2 : listing.demand === 'low' ? 0.8 : 1.0;
  return Math.floor(listing.price * demandMod);
}

/** 판매 가격 계산 (구매가의 90%) */
export function getSellPrice(listing: MarketListing): number {
  return Math.floor(getBuyPrice(listing) * 0.9);
}

/** 수익 예측 */
export function estimateProfit(
  buyListing: MarketListing,
  sellListing: MarketListing,
  quantity: number,
): number {
  return (getSellPrice(sellListing) - getBuyPrice(buyListing)) * quantity;
}

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}
