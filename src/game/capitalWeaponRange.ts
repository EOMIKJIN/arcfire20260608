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
  /** 무기 사거리에서 파생한 페어 최단 유지거리 — 헐 겹침(38)보다 우선 */
  minHoldPairDistPx: number;
};

export function resolveCapitalWeaponRangePx(row: CapitalWeaponCsvRow): number {
  return Math.max(CAPITAL_WEAPON_RANGE_PX_MIN, row.rangePx);
}

export function resolveCapitalWeaponRangePxById(weaponId: string): number | null {
  const row = getCapitalWeaponRow(weaponId);
  if (!row) return null;
  return resolveCapitalWeaponRangePx(row);
}

/** 근접 무기 미장착 시 레이저 사거리의 이 비율을 최단 유지거리로 씀 */
export const CAPITAL_LASER_MIN_HOLD_FRAC = 0.72;
/** 행성 지름보다 무기 사거리를 우선 — 헐 밀착(46px) 선회 금지 */
export const CAPITAL_MIN_HOLD_FLOOR_PX = 88;

/** 항법·교전 단계 — 테이블 사거리에서 파생(별도 교정 배율 없음) */
export function deriveCapitalCombatRangeBands(
  laserEngageRangePx: number,
  missileMaxRangePx: number,
  closeRangeMaxRangePx = 0,
): CapitalCombatRangeBands {
  const laser =
    laserEngageRangePx > 0
      ? Math.max(CAPITAL_WEAPON_RANGE_PX_MIN, laserEngageRangePx)
      : CAPITAL_WEAPON_RANGE_FALLBACK_LASER_PX;
  const missile =
    missileMaxRangePx > 0
      ? Math.max(CAPITAL_WEAPON_RANGE_PX_MIN, missileMaxRangePx)
      : CAPITAL_WEAPON_RANGE_FALLBACK_MISSILE_PX;
  const close =
    closeRangeMaxRangePx > 0
      ? Math.max(CAPITAL_WEAPON_RANGE_PX_MIN, closeRangeMaxRangePx)
      : 0;
  const loosen = CAPITAL_MISSILE_RANGE_LOOSEN_PX;
  const laserBrawlOuterPx = laser;
  const minHoldPairDistPx = Math.max(
    CAPITAL_MIN_HOLD_FLOOR_PX,
    close > 0 ? close : laser * CAPITAL_LASER_MIN_HOLD_FRAC,
  );
  const laserBrawlInnerPx = Math.min(laser, minHoldPairDistPx);
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
    minHoldPairDistPx,
  };
}

export function navalBrawlRingBoundsFromBands(bands: CapitalCombatRangeBands): {
  rMin: number;
  rMax: number;
} {
  const rMin = Math.max(bands.minHoldPairDistPx * 0.92, bands.laserBrawlInnerPx * 0.9);
  const rMax = Math.max(
    rMin + 4,
    Math.min(bands.laserBrawlOuterPx - 2, bands.laserEngageRangePx - 8, rMin + 28),
  );
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
