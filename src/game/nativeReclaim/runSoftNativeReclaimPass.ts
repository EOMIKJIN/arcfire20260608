import { compactPlanetMemoRegistryShells } from '../planetMemoCache';
import { prunePlanetNebulaProfilesLru, usePlanetNebulaStore } from '../../store/planetNebulaStore';
import { runCombatSkiaPresentationReclaim } from '../../combat/combatSkiaPresentationReclaim';
import { NEBULA_PROFILE_KEEP_ON_GALAXY_BLUR } from './processMemoryBudgetPolicy';

/**
 * PSS soft zone(800~950MB) / 포그라운드 복귀 — hub Skia tear-down 없이 floor 완화.
 * force-stop 전 1차 대응.
 */
export function runSoftNativeReclaimPass(reason: string): void {
  const profileCount = Object.keys(usePlanetNebulaStore.getState().profilesByPlanetId).length;
  if (profileCount > NEBULA_PROFILE_KEEP_ON_GALAXY_BLUR) {
    prunePlanetNebulaProfilesLru(NEBULA_PROFILE_KEEP_ON_GALAXY_BLUR);
  }
  compactPlanetMemoRegistryShells();
  runCombatSkiaPresentationReclaim();
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    // eslint-disable-next-line no-console
    console.log(`[MEM] runSoftNativeReclaimPass reason=${reason} nebulaBefore=${profileCount}`);
  }
}
