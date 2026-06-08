// ============================================================
// 아이템 마스터 레지스트리 (CSV 기반)
// ============================================================

import type { ItemDef, TradeGood } from '../types';
import { ITEM_DEFS_FROM_CSV } from './generated/csvItemDefs';

export function getItemDef(id: string): ItemDef | undefined {
  return ITEM_DEFS_FROM_CSV[id];
}

export function listItemDefIds(): string[] {
  return Object.keys(ITEM_DEFS_FROM_CSV);
}

export function listItemDefs(): ItemDef[] {
  return Object.values(ITEM_DEFS_FROM_CSV);
}

/** `tradeable === true` 인 항목만 무역 엔진용 `TradeGood` 레코드로 변환 */
export function buildTradeGoodsRecord(defs: Record<string, ItemDef>): Record<string, TradeGood> {
  const out: Record<string, TradeGood> = {};
  for (const def of Object.values(defs)) {
    if (!def.tradeable) continue;
    out[def.id] = {
      id: def.id,
      name: def.name,
      description: def.description,
      basePrice: def.basePrice,
      priceVariance: def.priceVariance,
      volume: def.volume,
      category: def.category,
    };
  }
  return out;
}
