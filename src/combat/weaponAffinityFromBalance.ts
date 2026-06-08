// ============================================================
// weapon_affinity_matrix.csv — 무기 familyKind × 적 affinity 데미지 배율
// ============================================================

import { WeaponAffinityMatrix_FROM_BALANCE_CSV } from '../data/balance/generated';
import { getCapitalWeaponRow } from '../game/capitalWeaponRegistry';

const affinityMulByKey = new Map<string, number>(
  WeaponAffinityMatrix_FROM_BALANCE_CSV.map((row) => [
    `${row.weaponKind}:${row.targetAffinityKind}`,
    Number(row.damageMultiplier) || 1,
  ]),
);

function resolveWeaponKindForAffinity(weaponId: string, slotKind: 'laser' | 'missile'): string {
  const row = getCapitalWeaponRow(weaponId);
  if (row?.familyKind) return row.familyKind;
  return slotKind;
}

export function resolveWeaponAffinityDamageMultiplier(
  weaponId: string,
  slotKind: 'laser' | 'missile',
  targetAffinityKind: string,
): number {
  const weaponKind = resolveWeaponKindForAffinity(weaponId, slotKind);
  const affinity = targetAffinityKind.trim() || 'light';
  const direct = affinityMulByKey.get(`${weaponKind}:${affinity}`);
  if (direct != null) return direct;
  if (weaponKind !== slotKind) {
    const fallback = affinityMulByKey.get(`${slotKind}:${affinity}`);
    if (fallback != null) return fallback;
  }
  return 1;
}
