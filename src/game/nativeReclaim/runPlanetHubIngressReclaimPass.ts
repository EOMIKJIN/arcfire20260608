import { invalidateAllPlanetMemoCaches } from '../planetMemoCache';
import {
  prunePlanetNebulaProfilesExceptPlanetIds,
  prunePlanetNebulaProfilesLru,
} from '../../store/planetNebulaStore';
import { runCombatSkiaPresentationReclaim } from '../../combat/combatSkiaPresentationReclaim';
import { NEBULA_PROFILE_KEEP_ON_HUB_BLUR } from './processMemoryBudgetPolicy';
import { scheduleDeferredNativeReclaimPass } from './deferredNativeReclaimScheduler';
import { resolveSinglePlanetSessionKeepIds } from './singlePlanetSessionKeep';

export type PlanetHubIngressReclaimOptions = {
  /** true — worldmap·transit combat 등 cold 진입; memo 전량 무효화 후 lazy reload */
  invalidateMemoCaches?: boolean;
};

/**
 * 허브 STAGE focus — worldmap/combat replace 직후 1회.
 * Skia mount 전/직후 PSS floor 정리; hub Skia tear-down 은 하지 않는다.
 */
export function runPlanetHubIngressReclaimPass(
  planetId: string | null,
  reason: string,
  opts?: PlanetHubIngressReclaimOptions,
): void {
  const keep = resolveSinglePlanetSessionKeepIds(planetId);
  if (keep.length > 0) {
    prunePlanetNebulaProfilesExceptPlanetIds(keep);
  } else {
    prunePlanetNebulaProfilesLru(NEBULA_PROFILE_KEEP_ON_HUB_BLUR);
  }

  if (opts?.invalidateMemoCaches) {
    invalidateAllPlanetMemoCaches();
  }

  runCombatSkiaPresentationReclaim();

  scheduleDeferredNativeReclaimPass({
    stage: 'planet_hub',
    reason,
    keepPlanetIds: keep,
  });

  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    // eslint-disable-next-line no-console
    console.log(`[MEM] runPlanetHubIngressReclaimPass reason=${reason} keep=${keep.join(',') || '-'}`);
  }
}
