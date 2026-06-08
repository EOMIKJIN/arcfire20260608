// ============================================================
// 무역소 구매 탭 — 아이템 하위 구분(1차)
// 향후 `item_defs` 고유 구분자·태그 기반으로 `inferTradeBuySubTabFromGoodId`만 교체·확장.
// ============================================================

import { TRADE_GOODS, getItemDef } from '../data/goods';

export type TradeBuySubTabId = 'weapon' | 'equipment' | 'tech' | 'consumable' | 'ship';

export const TRADE_BUY_SUB_TAB_ORDER: TradeBuySubTabId[] = [
  'weapon',
  'equipment',
  'tech',
  'consumable',
  'ship',
];

export const TRADE_BUY_SUB_TAB_LABELS: Record<TradeBuySubTabId, string> = {
  weapon: '무기',
  equipment: '장비',
  tech: '기술',
  consumable: '소모품',
  ship: '함선',
};

/**
 * 무역 목록 한 줄(`goodId`)이 어느 구매 서브 탭에 속하는지 1차 추론.
 * 우선순위: 함선 → 무기(category) → 장비(kind/원자재/광물) → 소모품(kind/식량/일반 사치 무역품) → 기술·기타.
 */
export function inferTradeBuySubTabFromGoodId(goodId: string): TradeBuySubTabId {
  const def = getItemDef(goodId);
  const good = TRADE_GOODS[goodId];
  if (!def || !good) return 'tech';

  if (def.type === 'capital_ship') return 'ship';
  if (def.type === 'weapon_module') return 'weapon';
  if (good.category === 'weapon') return 'weapon';
  if (def.kind === 'equipment' || def.kind === 'raw_material' || good.category === 'mineral') {
    return 'equipment';
  }
  if (def.kind === 'consumable' || good.category === 'food') return 'consumable';
  if (good.category === 'luxury' && def.kind === 'trade_good') return 'consumable';
  if (good.category === 'tech') return 'tech';
  if (good.category === 'contraband') return 'tech';
  return 'tech';
}
