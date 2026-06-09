// ============================================================
// 무역소 구매 탭 — 4분류(무기·장비·함선·아이템)
// 정본: item_defs `type` / `kind` — 세부 분류는 추후 이 모듈만 확장.
// ============================================================

import { getItemDef } from '../data/goods';

export type TradeBuySubTabId = 'weapon' | 'equipment' | 'ship' | 'item';

export const TRADE_BUY_SUB_TAB_ORDER: TradeBuySubTabId[] = [
  'weapon',
  'equipment',
  'ship',
  'item',
];

export const TRADE_BUY_SUB_TAB_LABELS: Record<TradeBuySubTabId, string> = {
  weapon: '무기',
  equipment: '장비',
  ship: '함선',
  item: '아이템',
};

/**
 * 무역 목록 한 줄(`goodId`) → 구매 서브 탭.
 * - type `capital_ship` → 함선
 * - type `weapon_module` → 무기
 * - kind `equipment` → 장비
 * - 그 외(교역품·광물·식량·소유권·tg_* 등) → 아이템
 */
export function inferTradeBuySubTabFromGoodId(goodId: string): TradeBuySubTabId {
  const def = getItemDef(goodId);
  if (!def) return 'item';

  if (def.type === 'capital_ship') return 'ship';
  if (def.type === 'weapon_module') return 'weapon';
  if (def.kind === 'equipment') return 'equipment';

  return 'item';
}
