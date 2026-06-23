// ============================================================
// 내구도 UI 문구 헬퍼
// ============================================================

import type { CargoItem } from '../../types';
import {
  isDurabilityTrackedInventoryGoodId,
  resolveDurabilityPct,
} from './durabilityModel';

export function formatInventoryDurabilityMeta(input: {
  cell: CargoItem;
  isEquipped: boolean;
  qtyLabel: (qty: number, equippedSuffix: string) => string;
  durabilityLabel: (qty: number, equippedSuffix: string, pct: number) => string;
  equippedSuffix: string;
}): string {
  const { cell, isEquipped, qtyLabel, durabilityLabel, equippedSuffix } = input;
  const equipped = isEquipped ? equippedSuffix : '';
  if (!isDurabilityTrackedInventoryGoodId(cell.goodId)) {
    return qtyLabel(cell.quantity, equipped);
  }
  const pct = Math.round(resolveDurabilityPct(cell.durabilityPct));
  return durabilityLabel(cell.quantity, equipped, pct);
}
