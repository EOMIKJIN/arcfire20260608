/**
 * Resident Set Tier — “알고 있는 데이터” vs “메모리 상주” 경계.
 * ArcMemoryGovernor 가 STAGE·lazy warm 시 tier 를 갱신한다.
 */

export type ResidentSetTier =
  | 'T0_boot_minimal'
  | 'T1_planet_hub'
  | 'T2_facility'
  | 'T3_galaxy_preflight'
  | 'T4_galaxy_map'
  | 'T5_combat'
  | 'T6_world_daily';

let currentTier: ResidentSetTier = 'T0_boot_minimal';
const warmedPlanetCatalogIds = new Set<string>();

export function getResidentSetTier(): ResidentSetTier {
  return currentTier;
}

export function setResidentSetTier(tier: ResidentSetTier): void {
  currentTier = tier;
}

export function markPlanetCatalogWarmed(planetId: string): void {
  if (planetId) warmedPlanetCatalogIds.add(planetId);
}

export function isPlanetCatalogWarmed(planetId: string): boolean {
  return warmedPlanetCatalogIds.has(planetId);
}

export function clearPlanetCatalogWarm(planetId: string): void {
  warmedPlanetCatalogIds.delete(planetId);
}

/** 테스트·계정 초기화 */
export function resetResidentSetRegistryForTests(): void {
  currentTier = 'T0_boot_minimal';
  warmedPlanetCatalogIds.clear();
}
