// ============================================================
// weapon_list.csv 생성본 조회 — leaf 모듈(다른 game/combat 모듈에 의존 없음)
// ============================================================

import {
  CAPITAL_WEAPON_LIST_FROM_CSV,
  type CapitalWeaponCsvRow,
} from '../data/generated';

export function getCapitalWeaponRow(weaponId: string): CapitalWeaponCsvRow | null {
  const id = weaponId.trim();
  if (!id) return null;
  return CAPITAL_WEAPON_LIST_FROM_CSV[id] ?? null;
}

export function isKnownCapitalWeaponId(weaponId: string): boolean {
  return getCapitalWeaponRow(weaponId) !== null;
}
