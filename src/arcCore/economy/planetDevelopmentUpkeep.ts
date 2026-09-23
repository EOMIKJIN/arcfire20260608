// ============================================================
// 행성 개발 엔티티 — 레벨별 1일 유지비 집계 (개발도 비례 유지비 기반)
//   정본 수치: tables/balance/planet_defense_satellite_level_policy.csv (dailyUpkeepCredits)
//   향후 dev_energy_plant 등 신규 개발 엔티티는 본 집계에 슬롯만 추가한다(Table-First).
//   ⚠️ 일일 배치(runArcCorePlanetUpkeepDailyPass)·정보 스냅샷에서만 호출 — 틱/부트 경로 금지.
// ============================================================

import { resolveDefenseSatelliteDailyUpkeepCredits } from '../balance/planetDefenseSatelliteLevelPolicy';
import { resolveFacilityDailyUpkeepCredits } from '../balance/facilityDailyUpkeepPolicy';
import {
  isPlanetDefenseSatelliteInstalled,
  resolvePlanetDefenseSatelliteLevel,
} from '../../systems/planetaryDefense/planetDefenseSatelliteLevel';
import { readPlanetOrbitShipyardDetail } from '../../game/planetDevelopment/planetOrbitShipyardListing';
import { readPlanetResearchLabDetail } from '../../game/planetDevelopment/planetResearchLabListing';
import { readPlanetTradePortDetail } from '../../game/planetDevelopment/planetTradePortListing';
import { readPlanetPopulationDomeDetail } from '../../game/planetDevelopment/planetPopulationDomeListing';

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
 * 방위위성 = 기존 CSV 수치. 조선소·연구소·무역소·돔 = facility_daily_upkeep_policy 신규 슬롯.
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

  const shipyard = readPlanetOrbitShipyardDetail(planetId);
  if (shipyard.installed) {
    const dailyUpkeepCredits = resolveFacilityDailyUpkeepCredits('shipyard', shipyard.level);
    if (dailyUpkeepCredits > 0) {
      lines.push({ entityId: 'dev_orbit_shipyard', level: shipyard.level, dailyUpkeepCredits });
    }
  }
  const lab = readPlanetResearchLabDetail(planetId);
  if (lab.installed) {
    const dailyUpkeepCredits = resolveFacilityDailyUpkeepCredits('laboratory', lab.level);
    if (dailyUpkeepCredits > 0) {
      lines.push({ entityId: 'dev_research_lab', level: lab.level, dailyUpkeepCredits });
    }
  }
  const trade = readPlanetTradePortDetail(planetId);
  if (trade.installed) {
    const dailyUpkeepCredits = resolveFacilityDailyUpkeepCredits('trade_port', trade.level);
    if (dailyUpkeepCredits > 0) {
      lines.push({ entityId: 'dev_trade_port', level: trade.level, dailyUpkeepCredits });
    }
  }
  const dome = readPlanetPopulationDomeDetail(planetId);
  if (dome.installed) {
    const dailyUpkeepCredits = resolveFacilityDailyUpkeepCredits('population_dome', dome.level);
    if (dailyUpkeepCredits > 0) {
      lines.push({ entityId: 'dev_population_dome', level: dome.level, dailyUpkeepCredits });
    }
  }

  const totalCredits = lines.reduce((sum, l) => sum + l.dailyUpkeepCredits, 0);
  return { planetId, totalCredits, lines };
}

/** 행성 개발 엔티티 1일 유지비 합계(크레딧) — 효율 절감은 upkeep pass에서 적용 */
export function computePlanetDevelopmentDailyUpkeepCredits(planetId: string): number {
  return computePlanetDevelopmentUpkeepBreakdown(planetId).totalCredits;
}
