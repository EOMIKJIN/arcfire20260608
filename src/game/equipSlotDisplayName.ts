// ============================================================
// 장착 슬롯 표시명 — itemDefId 정본, weapon_list / item_defs 테이블 조회
// (equipSlots.name 은 저장 스냅샷이며 UI·로드 시 테이블로 갱신)
// ============================================================

import { CAPITAL_WEAPON_LIST_FROM_CSV, ITEM_DEFS_FROM_CSV } from '../data/generated';
import type { PlayerShip, ShipyardEquipSlotId } from '../types';
import { UNEQUIPPED_WEAPON_ITEM_ID } from './combatWeaponSlots';
import { weaponIdFromWeaponItemId } from './weaponItemId';

/** 레거시 접미사 제거(과거 빌드가 붙이던 " 모듈" / " Module") */
export function stripWeaponModuleSuffix(name: string): string {
  return name
    .replace(/\s*모듈\s*$/u, '')
    .replace(/\s*Module\s*$/i, '')
    .trim();
}

/**
 * 슬롯 UI·제원 표시용 이름.
 * 1) weapon_item_* → weapon_list.csv `name`
 * 2) 그 외 → item_defs.csv `name`
 * 3) 폴백 → 저장 스냅샷(접미사 정리)
 */
export function resolveEquipSlotDisplayName(
  itemDefId: string | null | undefined,
  storedName?: string | null,
): string {
  const raw = String(itemDefId ?? '').trim();
  if (!raw || raw === UNEQUIPPED_WEAPON_ITEM_ID) {
    return '미장착';
  }
  const weaponId = weaponIdFromWeaponItemId(raw);
  if (weaponId) {
    const row = CAPITAL_WEAPON_LIST_FROM_CSV[weaponId];
    if (row?.name?.trim()) return row.name.trim();
  }
  const def = ITEM_DEFS_FROM_CSV[raw];
  if (def?.name?.trim()) return stripWeaponModuleSuffix(def.name.trim());
  const legacy = storedName?.trim();
  if (legacy) return stripWeaponModuleSuffix(legacy);
  return raw;
}

/** 로드·persist 전 equipSlots.name 을 테이블 정본과 동기 */
export function normalizeEquipSlotNamesFromTables(
  slots: PlayerShip['equipSlots'] | undefined,
): NonNullable<PlayerShip['equipSlots']> {
  if (!slots || typeof slots !== 'object') return {};
  const out: NonNullable<PlayerShip['equipSlots']> = {};
  for (const [k, v] of Object.entries(slots)) {
    if (!v || typeof v !== 'object') continue;
    const itemDefId = String(v.itemDefId ?? '').trim();
    const name = String(v.name ?? '').trim();
    if (!itemDefId) continue;
    out[k as ShipyardEquipSlotId] = {
      itemDefId,
      name: resolveEquipSlotDisplayName(itemDefId, name),
    };
  }
  return out;
}
