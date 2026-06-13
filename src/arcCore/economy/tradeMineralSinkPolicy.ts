// ============================================================
// 무역소 구매 — weapon / capital_ship 광물 소모 (balance CSV)
// ============================================================

import { EconomyTradeMineralSinkPolicy_FROM_BALANCE_CSV } from '../../data/balance/generated';
import type { ItemDef } from '../../types';

export type TradeMineralSinkRequirement = {
  mineralItemId: string;
  qtyPerUnit: number;
};

const sinkByItemType = new Map<string, TradeMineralSinkRequirement>();

for (const row of EconomyTradeMineralSinkPolicy_FROM_BALANCE_CSV) {
  const itemType = String(row.itemType ?? '').trim();
  const mineralItemId = String(row.mineralItemId ?? '').trim();
  const qty = Number(row.qtyPerUnit);
  if (!itemType || !mineralItemId || !Number.isFinite(qty) || qty <= 0) continue;
  sinkByItemType.set(itemType, { mineralItemId, qtyPerUnit: Math.floor(qty) });
}

export function resolveTradeMineralSinkRequirement(
  itemDef: ItemDef | null | undefined,
): TradeMineralSinkRequirement | null {
  if (!itemDef?.type) return null;
  return sinkByItemType.get(itemDef.type) ?? null;
}

export function resolveTradeMineralSinkTotalQty(
  itemDef: ItemDef | null | undefined,
  buyQty: number,
): { mineralItemId: string; totalQty: number } | null {
  const req = resolveTradeMineralSinkRequirement(itemDef);
  if (!req) return null;
  const qty = Math.max(1, Math.floor(buyQty));
  return { mineralItemId: req.mineralItemId, totalQty: req.qtyPerUnit * qty };
}
