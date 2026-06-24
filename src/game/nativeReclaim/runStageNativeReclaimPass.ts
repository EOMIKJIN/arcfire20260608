import { runCombatSkiaPresentationReclaim } from '../../combat/combatSkiaPresentationReclaim';
import { compactPlanetMemoRegistryShells } from '../planetMemoCache';
import {
  prunePlanetNebulaProfilesExceptPlanetIds,
  prunePlanetNebulaProfilesLru,
} from '../../store/planetNebulaStore';
import { releaseAllPlanetGpuLayers } from '../planetStageGpuSupervisor';
import { scheduleDeferredNativeReclaimPass } from './deferredNativeReclaimScheduler';
import { signalHubSkiaNativeReclaim } from './hubSkiaNativeReclaimSignal';
import { runNativeReclaimListeners } from './nativeReclaimRegistry';
import type { NativeReclaimStage } from './nativeReclaimContracts';
import {
  NEBULA_PROFILE_KEEP_ON_GALAXY_BLUR,
  NEBULA_PROFILE_KEEP_ON_HUB_BLUR,
} from './processMemoryBudgetPolicy';

export type StageNativeReclaimPassOptions = {
  stage: NativeReclaimStage;
  reason: string;
  keepPlanetIds?: readonly string[];
  /** false — 행성 간 착륙(planet_change) 등 허브 UI 유지 중 */
  reclaimHubSkia?: boolean;
  /** false — 허브 Skia mount 유지 중 GPU supervisor 일괄 해제 생략 */
  releaseGpuLayers?: boolean;
};

function pruneNebulaForStage(stage: NativeReclaimStage, keepPlanetIds?: readonly string[]): void {
  const keep = (keepPlanetIds ?? []).filter(Boolean);
  if (keep.length > 0) {
    prunePlanetNebulaProfilesExceptPlanetIds(keep);
    return;
  }
  const keepMax = stage === 'galaxy_map'
    ? NEBULA_PROFILE_KEEP_ON_GALAXY_BLUR
    : NEBULA_PROFILE_KEEP_ON_HUB_BLUR;
  prunePlanetNebulaProfilesLru(keepMax);
}

/**
 * STAGE blur/combat exit — Native(PSS) floor 1차 회수.
 * 프로세스 force-stop 은 monitor 하드실링(≥950MB) 최후 수단으로만 유지.
 */
export function runStageNativeReclaimPass(opts: StageNativeReclaimPassOptions): void {
  const reclaimHubSkia = opts.reclaimHubSkia !== false;
  const releaseGpu = opts.releaseGpuLayers !== false;

  if (opts.stage === 'planet_hub' && reclaimHubSkia) {
    signalHubSkiaNativeReclaim(opts.reason);
  }

  runCombatSkiaPresentationReclaim();

  if (releaseGpu) {
    releaseAllPlanetGpuLayers('route_blur');
  }
  pruneNebulaForStage(opts.stage, opts.keepPlanetIds);
  compactPlanetMemoRegistryShells();

  const immediateCount = runNativeReclaimListeners({
    stage: opts.stage,
    reason: opts.reason,
    phase: 'immediate',
    keepPlanetIds: opts.keepPlanetIds,
  });

  scheduleDeferredNativeReclaimPass(opts);

  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    // eslint-disable-next-line no-console
    console.log(
      `[MEM] runStageNativeReclaimPass stage=${opts.stage} reason=${opts.reason} immediate=${immediateCount}`,
    );
  }
}
