// ============================================================
// facility_daily_upkeep_policy.csv — 조선소·연구소·무역소·돔
// 방위위성 수치는 planet_defense_satellite_level_policy.csv 정본 · 여기 없음
// ============================================================

import { FacilityDailyUpkeepPolicy_FROM_BALANCE_CSV } from '../../data/balance/generated';

export type FacilityDailyUpkeepType = 'shipyard' | 'laboratory' | 'trade_port' | 'population_dome';

const index = new Map<string, number>();

function keyOf(type: string, level: number): string {
  return `${type}:${level}`;
}

function buildIndex(): Map<string, number> {
  if (index.size > 0) return index;
  for (const row of FacilityDailyUpkeepPolicy_FROM_BALANCE_CSV) {
    const type = String(row.facilityType ?? '').trim();
    const level = Math.max(1, Math.floor(Number(row.level) || 1));
    const credits = Math.max(0, Math.floor(Number(row.dailyUpkeepCredits) || 0));
    index.set(keyOf(type, level), credits);
  }
  return index;
}

export function resolveFacilityDailyUpkeepCredits(
  facilityType: FacilityDailyUpkeepType,
  level: number,
): number {
  const lv = Math.max(1, Math.floor(level));
  return buildIndex().get(keyOf(facilityType, lv)) ?? 0;
}
