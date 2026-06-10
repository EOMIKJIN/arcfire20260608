// ============================================================
// 전함 교전 무기 슬롯 — equipSlots ↔ combat runtime 공통 id
// ============================================================

import type { ShipyardEquipSlotId } from '../types';
import { getCapitalWeaponRow } from './capitalWeaponRegistry';

export const COMBAT_WEAPON_SLOT_IDS = [
  'WEAPON_1',
  'WEAPON_2',
  'WEAPON_3',
  'WEAPON_4',
] as const satisfies readonly ShipyardEquipSlotId[];

export type CombatWeaponSlotId = (typeof COMBAT_WEAPON_SLOT_IDS)[number];

/** 근접 로켓 기본 무기 — npc_ai_ships.closeRangeWeaponId 폴백·NPC 시드 공통 */
export const DEFAULT_CLOSE_RANGE_WEAPON_ID = 'w_missile_arc_005';

/** 무기 슬롯 의도적 해제 — persist·로드 시 기본 무장 재시드하지 않음 */
export const UNEQUIPPED_WEAPON_ITEM_ID = '0';

export function isEquipSlotFilled(
  slot: { itemDefId?: string | null; name?: string | null } | null | undefined,
): boolean {
  const id = String(slot?.itemDefId ?? '').trim();
  return Boolean(id && id !== UNEQUIPPED_WEAPON_ITEM_ID);
}

export function isCombatWeaponEquipSlot(id: ShipyardEquipSlotId): id is CombatWeaponSlotId {
  return (COMBAT_WEAPON_SLOT_IDS as readonly string[]).includes(id);
}

/** 비무기 슬롯만 equipCapacity와 비교(무기 4칸은 항상 해제) */
export function isShipyardEquipSlotLockedByCapacity(
  slotOrder: number,
  slotId: ShipyardEquipSlotId,
  equipCapacity: number,
): boolean {
  if (isCombatWeaponEquipSlot(slotId)) return false;
  const nonWeaponOrder = slotOrder - COMBAT_WEAPON_SLOT_IDS.length;
  return nonWeaponOrder > Math.max(0, equipCapacity);
}

/** 인벤 장착 시 대상 슬롯 — 로켓=3, 레이저=1, 미사일=2, 그 외=4(임시) */
export function resolveCombatWeaponSlotForWeaponId(weaponId: string): CombatWeaponSlotId | null {
  const id = weaponId.trim();
  if (!id) return null;
  const row = getCapitalWeaponRow(id);
  if (!row) return null;
  if (row.familyKind === 'rocket') return 'WEAPON_3';
  if (row.kind === 'laser' || row.familyKind === 'laser') return 'WEAPON_1';
  if (row.kind === 'missile') return 'WEAPON_2';
  return 'WEAPON_4';
}
