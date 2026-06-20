// ============================================================
// 행성별 시설 레벨 O(1) 조회 — runFacilityStatNudgePass·선행 조건 검사
// ============================================================

import {
  isPlanetDefenseSatelliteInstalled,
  resolvePlanetDefenseSatelliteLevel,
} from '../../systems/planetaryDefense/planetDefenseSatelliteLevel';
import { PLANET_DEV_MODULE_ORBIT_SHIPYARD, isPlanetOrbitShipyardInstalled, readPlanetOrbitShipyardDetail } from './planetOrbitShipyardListing';
import {
  PLANET_DEV_MODULE_TRADE_PORT,
  isPlanetTradePortInstalled,
  readPlanetTradePortDetail,
} from './planetTradePortListing';
import {
  PLANET_DEV_MODULE_RESEARCH_LAB,
  isPlanetResearchLabInstalled,
  readPlanetResearchLabDetail,
} from './planetResearchLabListing';
import {
  PLANET_DEV_MODULE_POPULATION_DOME,
  isPlanetPopulationDomeInstalled,
  readPlanetPopulationDomeDetail,
} from './planetPopulationDomeListing';
import { readFacilityModuleDetail } from './planetFacilityModuleRuntime';
import { resolveEffectiveFacilityDevView } from './planetCsvWorldFacilityBaseline';

export type InstalledFacilityLevel = {
  moduleId: string;
  facilityType: string;
  installed: boolean;
  level: number;
};

const MODULE_FACILITY_PAIRS: Array<{
  moduleId: string;
  facilityType: string;
  isInstalled: (planetId: string) => boolean;
  readLevel: (planetId: string) => number;
}> = [
  {
    moduleId: PLANET_DEV_MODULE_TRADE_PORT,
    facilityType: 'trade_port',
    isInstalled: isPlanetTradePortInstalled,
    readLevel: (planetId) => (isPlanetTradePortInstalled(planetId) ? readPlanetTradePortDetail(planetId).level : 0),
  },
  {
    moduleId: PLANET_DEV_MODULE_ORBIT_SHIPYARD,
    facilityType: 'shipyard',
    isInstalled: isPlanetOrbitShipyardInstalled,
    readLevel: (planetId) => (isPlanetOrbitShipyardInstalled(planetId) ? readPlanetOrbitShipyardDetail(planetId).level : 0),
  },
  {
    moduleId: 'defense_satellite',
    facilityType: 'defense_satellite',
    isInstalled: isPlanetDefenseSatelliteInstalled,
    readLevel: (planetId) => (isPlanetDefenseSatelliteInstalled(planetId) ? resolvePlanetDefenseSatelliteLevel(planetId) : 0),
  },
  {
    moduleId: PLANET_DEV_MODULE_RESEARCH_LAB,
    facilityType: 'laboratory',
    isInstalled: isPlanetResearchLabInstalled,
    readLevel: (planetId) => (isPlanetResearchLabInstalled(planetId) ? readPlanetResearchLabDetail(planetId).level : 0),
  },
  {
    moduleId: PLANET_DEV_MODULE_POPULATION_DOME,
    facilityType: 'tavern',
    isInstalled: isPlanetPopulationDomeInstalled,
    readLevel: (planetId) => (isPlanetPopulationDomeInstalled(planetId) ? readPlanetPopulationDomeDetail(planetId).level : 0),
  },
];

function resolvePairEffectiveLevel(
  planetId: string,
  moduleId: string,
  isDevInstalled: (planetId: string) => boolean,
  readDevLevel: (planetId: string) => number,
): { installed: boolean; level: number } {
  const detail = readFacilityModuleDetail(planetId, moduleId);
  const effective = resolveEffectiveFacilityDevView(planetId, moduleId, detail);
  if (effective.effectiveInstalled) {
    return { installed: true, level: effective.effectiveLevel };
  }
  if (isDevInstalled(planetId)) {
    return { installed: true, level: readDevLevel(planetId) };
  }
  return { installed: false, level: 0 };
}

export function listInstalledFacilityLevels(planetId: string): InstalledFacilityLevel[] {
  return MODULE_FACILITY_PAIRS.map((p) => {
    const eff = resolvePairEffectiveLevel(planetId, p.moduleId, p.isInstalled, p.readLevel);
    return {
      moduleId: p.moduleId,
      facilityType: p.facilityType,
      installed: eff.installed,
      level: eff.level,
    };
  });
}

export function resolveFacilityLevelByType(planetId: string, facilityType: string): number {
  const hit = MODULE_FACILITY_PAIRS.find((p) => p.facilityType === facilityType);
  if (!hit) return 0;
  return resolvePairEffectiveLevel(planetId, hit.moduleId, hit.isInstalled, hit.readLevel).level;
}

export function resolveModuleIdFromFacilityType(facilityType: string): string | null {
  return MODULE_FACILITY_PAIRS.find((p) => p.facilityType === facilityType)?.moduleId ?? null;
}
