import { clearCapitalRealtimeCombatPresentationCaches } from '../combat/clearCapitalRealtimeCombatCaches';
import type { CapitalRealtimeCombatSim } from '../combat/capitalRealtimeTypes';
import { markPostHubCombatWorldmapIngressReclaim } from './nativeReclaim/runPostHubCombatWorldmapIngressReclaim';
import { runStageNativeReclaimPass } from './nativeReclaim/runStageNativeReclaimPass';

export type TeardownPlanetHubCombatForGalaxyDepartureOpts = {
  previousPlanetId?: string | null;
};

/**
 * 베가 웨이브 등 허브 궤도 전투 후 은하계 지도 출발 — freezeOnBlur 전에 동기 halt.
 * (시설 push 는 `captureSuspendSnapshot` 유지)
 */
export function teardownPlanetHubCombatForGalaxyDeparture(
  sim: CapitalRealtimeCombatSim | null,
  opts?: TeardownPlanetHubCombatForGalaxyDepartureOpts,
): void {
  sim?.haltForGalaxyDeparture?.();

  clearCapitalRealtimeCombatPresentationCaches();

  const keepPlanetIds = opts?.previousPlanetId?.trim()
    ? [opts.previousPlanetId.trim()]
    : [];

  runStageNativeReclaimPass({
    stage: 'planet_hub',
    reason: 'galaxy_departure_after_combat',
    keepPlanetIds,
    reclaimHubSkia: true,
    releaseGpuLayers: true,
  });

  markPostHubCombatWorldmapIngressReclaim();

  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    // eslint-disable-next-line no-console
    console.log(
      `[MEM] teardownPlanetHubCombatForGalaxyDeparture planet=${opts?.previousPlanetId ?? '?'}`,
    );
  }
}
