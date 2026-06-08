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

/** CSV `타겟팅`=타겟점 — 유도 재조준 없이 착탄점 고정 */
export function shouldLockMissileImpactPoint(weaponId: string): boolean {
  return getCapitalWeaponRow(weaponId)?.lockImpactPoint ?? false;
}

export function resolveMissileSalvoCount(weaponId: string): number {
  const row = getCapitalWeaponRow(weaponId);
  if (!row) return 1;
  return Math.max(1, row.salvoCount);
}

export function resolveMissileSalvoIntervalMs(
  weaponId: string,
  fallbackMs: number,
): number {
  const row = getCapitalWeaponRow(weaponId);
  if (!row) return fallbackMs;
  return Math.max(140, row.salvoIntervalMs > 0 ? row.salvoIntervalMs : fallbackMs);
}
