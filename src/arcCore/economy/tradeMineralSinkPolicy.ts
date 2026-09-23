// ============================================================
// 무역소 구매 광물 싱크 (balance CSV)
// 2026-09-23: economy_trade_mineral_sink_policy.csv 데이터 행 비움.
// Map 비면 resolve* 전부 null — 구매는 크레딧(+수수료)만.
// 조선소 스탯 업그레이드(ore_ferrite/silicate/crystal)와 무관.
// ============================================================

import { EconomyTradeMineralSinkPolicy_FROM_BALANCE_CSV } from '../../data/balance/generated';
import { isWaveTestTradeItemDef } from '../../economy/waveDefenseTestTradeItems';
import type { ItemDef } from '../../types';

export type TradeMineralSinkRequirement = {
  mineralItemId: string;
  qtyPerUnit: number;
};

type SinkPolicyRow = {
  itemType?: string;
  mineralItemId?: string;
  qtyPerUnit?: string | number;
};

const sinkByItemType = new Map<string, TradeMineralSinkRequirement>();

// 데이터 행 0이면 generated `as const []` 가 never[] — 캐스트로 빈 정책 허용.
for (const row of EconomyTradeMineralSinkPolicy_FROM_BALANCE_CSV as readonly SinkPolicyRow[]) {
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
  // 웨이브 테스트 3종 면제(CSV 재기입 시에도 1크레딧 테스트 SKU가 막히지 않게).
  if (isWaveTestTradeItemDef(itemDef)) return null;
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
