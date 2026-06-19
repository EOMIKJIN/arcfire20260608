import { readFacilityModuleDetail, isFacilityModuleInstalled } from './planetFacilityModuleRuntime';

/** 과학 연구소 — 허브 연구소(skilltree) 연동 */
export const PLANET_DEV_MODULE_RESEARCH_LAB = 'dev_research_lab';

const LEGACY_MODULE_ID = 'dev_laboratory';

export function readPlanetResearchLabDetail(planetId: string) {
  const cur = readFacilityModuleDetail(planetId, PLANET_DEV_MODULE_RESEARCH_LAB);
  if (cur.installed || cur.upgradeJob) return cur;
  return readFacilityModuleDetail(planetId, LEGACY_MODULE_ID);
}

export function isPlanetResearchLabInstalled(planetId: string): boolean {
  return isFacilityModuleInstalled(planetId, PLANET_DEV_MODULE_RESEARCH_LAB)
    || isFacilityModuleInstalled(planetId, LEGACY_MODULE_ID);
}
