// ============================================================
// 무역 상품 — 아이템 마스터(`item_defs.csv`)의 tradeable 부분집합
// ============================================================

import type { TradeGood } from '../types';
import { ITEM_DEFS_FROM_CSV } from './generated/csvItemDefs';
import { buildTradeGoodsRecord, getItemDef, listItemDefIds, listItemDefs } from './itemRegistry';

export const TRADE_GOODS: Record<string, TradeGood> = buildTradeGoodsRecord(ITEM_DEFS_FROM_CSV);

export { getItemDef, listItemDefIds, listItemDefs };
export { ITEM_DEFS_FROM_CSV } from './generated/csvItemDefs';
