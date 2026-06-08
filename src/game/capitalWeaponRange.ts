import type { WeaponData } from '../types';
import type { CapitalWeaponCsvRow } from '../data/generated';
import { getCapitalWeaponRow } from './capitalWeaponRegistry';

/** `weapon_list.csv` `사거리px` — 실시간·WeaponData 공통 정본 */
export const CAPITAL_WEAPON_RANGE_PX_MIN = 24;

/** 미사ile 사거리 판정 완화(px) — 엔진 허용 오차(표 값 아님) */
export const CAPITAL_MISSILE_RANGE_LOOSEN_PX = 12;

/** 무기 id 미지정 시 항법 폴백(테이블 대체 아님 — dev·레거시 경로만) */
export const CAPITAL_WEAPON_RANGE_FALLBACK_LASER_PX = 162;
export const CAPITAL_WEAPON_RANGE_FALLBACK_MISSILE_PX = 180;

/** 궤도 씬 행성 지름 — 근접 브롤 상한 캡(씬 기하, 무기 교정 아님) */
export const CAPITAL_COMBAT_PLANET_DIAM_PX = 120;

export type CapitalCombatRangeBands = {
  laserEngageRangePx: number;
  missileMaxRangePx: number;
  laserBrawlOuterPx: number;
  laserBrawlInnerPx: number;
  missileIdealPairDistPx: number;
};

export function resolveCapitalWeaponRangePx(row: CapitalWeaponCsvRow): number {
  return Math.max(CAPITAL_WEAPON_RANGE_PX_MIN, row.rangePx);
}

export function resolveCapitalWeaponRangePxById(weaponId: string): number | null {
  const row = getCapitalWeaponRow(weaponId);
  if (!row) return null;
  return resolveCapitalWeaponRangePx(row);
}

/** 항법·교전 단계 — 테이블 사거리에서 파생(별도 교정 배율 없음) */
export function deriveCapitalCombatRangeBands(
  laserEngageRangePx: number,
  missileMaxRangePx: number,
): CapitalCombatRangeBands {
  const laser =
    laserEngageRangePx > 0
      ? Math.max(CAPITAL_WEAPON_RANGE_PX_MIN, laserEngageRangePx)
      : CAPITAL_WEAPON_RANGE_FALLBACK_LASER_PX;
  const missile =
    missileMaxRangePx > 0
      ? Math.max(CAPITAL_WEAPON_RANGE_PX_MIN, missileMaxRangePx)
      : CAPITAL_WEAPON_RANGE_FALLBACK_MISSILE_PX;
  const loosen = CAPITAL_MISSILE_RANGE_LOOSEN_PX;
  const laserBrawlOuterPx = laser;
  const laserBrawlInnerPx = Math.min(laser, CAPITAL_COMBAT_PLANET_DIAM_PX);
  const missileIdealPairDistPx = Math.min(
    missile + loosen - 4,
    Math.max(laserBrawlOuterPx + 24, missile * 0.9),
  );
  return {
    laserEngageRangePx: laser,
    missileMaxRangePx: missile,
    laserBrawlOuterPx,
    laserBrawlInnerPx,
    missileIdealPairDistPx,
  };
}

export function navalBrawlRingBoundsFromBands(bands: CapitalCombatRangeBands): {
  rMin: number;
  rMax: number;
} {
  const rMin = Math.max(bands.laserBrawlInnerPx * 0.44, 46);
  const rMax = Math.max(rMin + 4, Math.min(bands.laserBrawlOuterPx - 2, bands.laserEngageRangePx - 8));
  return { rMin, rMax };
}

export function buildWeaponDataFromCapitalRow(row: CapitalWeaponCsvRow): WeaponData {
  const sides = Math.max(6, Math.min(14, row.damage + 4));
  return {
    id: row.id,
    catalogId: row.id,
    name: row.name,
    type: row.kind,
    attackBonus: Math.max(0, Math.floor(row.damage * 0.8)),
    range: resolveCapitalWeaponRangePx(row),
    damageDice: { count: 1, sides, bonus: 0 },
  };
}

export function buildWeaponDataFromCapitalWeaponId(weaponId: string): WeaponData | null {
  const row = getCapitalWeaponRow(weaponId);
  if (!row) return null;
  return buildWeaponDataFromCapitalRow(row);
}
