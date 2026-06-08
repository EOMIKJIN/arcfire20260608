// ============================================================
// 무기 모듈 item id ↔ weapon_list id (순환 참조 없는 순수 코덱)
// ============================================================

import { CAPITAL_WEAPON_LIST_FROM_CSV } from '../data/generated';

export const WEAPON_ITEM_ID_PREFIX = 'weapon_item_';

export function weaponItemIdFromWeaponId(weaponId: string): string {
  return `${WEAPON_ITEM_ID_PREFIX}${weaponId}`;
}

export function weaponIdFromWeaponItemId(itemId: string): string | null {
  if (!itemId.startsWith(WEAPON_ITEM_ID_PREFIX)) return null;
  const weaponId = itemId.slice(WEAPON_ITEM_ID_PREFIX.length).trim();
  return weaponId.length > 0 ? weaponId : null;
}

export function isWeaponItemId(itemId: string): boolean {
  const weaponId = weaponIdFromWeaponItemId(itemId);
  return Boolean(weaponId && CAPITAL_WEAPON_LIST_FROM_CSV[weaponId]);
}
