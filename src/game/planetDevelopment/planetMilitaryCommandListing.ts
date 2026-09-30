import { readFacilityModuleDetail, isFacilityModuleInstalled } from './planetFacilityModuleRuntime';

export const PLANET_DEV_MODULE_MILITARY_COMMAND = 'dev_military_command';

export function readPlanetMilitaryCommandDetail(planetId: string) {
  return readFacilityModuleDetail(planetId, PLANET_DEV_MODULE_MILITARY_COMMAND);
}

export function isPlanetMilitaryCommandInstalled(planetId: string): boolean {
  return isFacilityModuleInstalled(planetId, PLANET_DEV_MODULE_MILITARY_COMMAND);
}

export function resolvePlanetMilitaryCommandLevel(planetId: string): number {
  const detail = readPlanetMilitaryCommandDetail(planetId);
  if (!detail.installed) return 0;
  return Math.max(0, Math.floor(Number(detail.level) || 0));
}
