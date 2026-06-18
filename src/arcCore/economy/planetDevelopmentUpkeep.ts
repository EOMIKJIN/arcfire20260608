// ============================================================
// 행성 개발 엔티티 — 레벨별 1일 유지비 집계 (개발도 비례 유지비 기반)
//   정본 수치: tables/balance/planet_defense_satellite_level_policy.csv (dailyUpkeepCredits)
//   향후 dev_energy_plant 등 신규 개발 엔티티는 본 집계에 슬롯만 추가한다(Table-First).
//   ⚠️ 일일 배치(runArcCorePlanetUpkeepDailyPass)·정보 스냅샷에서만 호출 — 틱/부트 경로 금지.
// ============================================================

import { resolveDefenseSatelliteDailyUpkeepCredits } from '../balance/planetDefenseSatelliteLevelPolicy';
import {
  isPlanetDefenseSatelliteInstalled,
  resolvePlanetDefenseSatelliteLevel,
} from '../../systems/planetaryDefense/planetDefenseSatelliteLevel';

export type PlanetDevelopmentUpkeepLine = {
  entityId: string;
  level: number;
  dailyUpkeepCredits: number;
};

export type PlanetDevelopmentUpkeepBreakdown = {
  planetId: string;
  totalCredits: number;
  lines: PlanetDevelopmentUpkeepLine[];
};

/**
 * 행성의 모든 개발 엔티티 레벨별 1일 유지비 합산.
 * 현재 구현 완료 엔티티: 방위위성(defense_satellite). 그 외는 미구현(0).
 */
export function computePlanetDevelopmentUpkeepBreakdown(
  planetId: string,
): PlanetDevelopmentUpkeepBreakdown {
  const lines: PlanetDevelopmentUpkeepLine[] = [];

  if (isPlanetDefenseSatelliteInstalled(planetId)) {
    const level = resolvePlanetDefenseSatelliteLevel(planetId);
    const dailyUpkeepCredits = resolveDefenseSatelliteDailyUpkeepCredits(level);
    if (dailyUpkeepCredits > 0) {
      lines.push({
        entityId: 'defense_satellite',
        level,
        dailyUpkeepCredits,
      });
    }
  }

  const totalCredits = lines.reduce((sum, l) => sum + l.dailyUpkeepCredits, 0);
  return { planetId, totalCredits, lines };
}

/** 행성 개발 엔티티 1일 유지비 합계(크레딧)만 필요할 때의 단축 헬퍼. */
export function computePlanetDevelopmentDailyUpkeepCredits(planetId: string): number {
  return computePlanetDevelopmentUpkeepBreakdown(planetId).totalCredits;
}
