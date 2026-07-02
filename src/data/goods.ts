// ============================================================
// 무역 상품 — 아이템 마스터(`item_defs.csv`)의 tradeable 부분집합
// ============================================================

import type { ItemDef, TradeGood } from '../types';
import { ITEM_DEFS_FROM_CSV } from './generated/csvItemDefs';
import { buildTradeGoodsRecord, getItemDef, listItemDefIds, listItemDefs } from './itemRegistry';

export const TRADE_GOODS: Record<string, TradeGood> = buildTradeGoodsRecord(ITEM_DEFS_FROM_CSV);

function itemDefToTradeGood(def: ItemDef): TradeGood {
  return {
    id: def.id,
    name: def.name,
    description: def.description,
    basePrice: def.basePrice,
    priceVariance: def.priceVariance,
    volume: def.volume,
    category: def.category,
  };
}

/** CSV tradeable + synth `ownership_*` (미개척 행성) */
export function getTradeGood(id: string): TradeGood | undefined {
  const cached = TRADE_GOODS[id];
  if (cached) return cached;
  const def = getItemDef(id);
  if (!def?.tradeable) return undefined;
  return itemDefToTradeGood(def);
}

export { getItemDef, listItemDefIds, listItemDefs };
export { ITEM_DEFS_FROM_CSV } from './generated/csvItemDefs';
