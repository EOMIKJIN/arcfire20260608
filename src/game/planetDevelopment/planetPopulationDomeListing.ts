import { readFacilityModuleDetail, isFacilityModuleInstalled } from './planetFacilityModuleRuntime';

/** 인구 거주 돔 — 허브 선술집 연동 (Lv1 설치 시 tavern 활성) */
export const PLANET_DEV_MODULE_POPULATION_DOME = 'dev_population_dome';

const LEGACY_MODULE_ID = 'dev_tavern';

export function readPlanetPopulationDomeDetail(planetId: string) {
  const cur = readFacilityModuleDetail(planetId, PLANET_DEV_MODULE_POPULATION_DOME);
  if (cur.installed || cur.upgradeJob) return cur;
  return readFacilityModuleDetail(planetId, LEGACY_MODULE_ID);
}

export function isPlanetPopulationDomeInstalled(planetId: string): boolean {
  return isFacilityModuleInstalled(planetId, PLANET_DEV_MODULE_POPULATION_DOME)
    || isFacilityModuleInstalled(planetId, LEGACY_MODULE_ID);
}
