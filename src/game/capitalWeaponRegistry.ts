import type { CapitalWeaponCsvRow } from '../data/generated';
import { getCapitalWeaponRow, isKnownCapitalWeaponId } from './capitalWeaponRowLookup';

export { getCapitalWeaponRow, isKnownCapitalWeaponId };
export type { CapitalWeaponCsvRow };

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

/** 로켓탄 착탄 분산 반경(px) — 단일 점이 아닌 원형 스프레드 */
export const ROCKET_IMPACT_SPREAD_RADIUS_PX = 22;

export function resolveRocketImpactSpreadRadiusPx(weaponId: string): number {
  const row = getCapitalWeaponRow(weaponId);
  if (!row) return ROCKET_IMPACT_SPREAD_RADIUS_PX;
  return Math.max(12, Math.min(36, Math.round(row.rangePx * 0.22)));
}

/** 무기 테이블 기준 초당 피해량(평균) */
export function computeCapitalWeaponDps(weaponId: string): number | null {
  const row = getCapitalWeaponRow(weaponId);
  if (!row) return null;
  const reloadSec = Math.max(0.45, row.cooldownMs / 1000);
  const salvo = Math.max(1, row.salvoCount);
  return (row.damage * salvo) / reloadSec;
}
