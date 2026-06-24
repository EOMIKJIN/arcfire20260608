import { trimNativeBitmapCachesAsync } from 'arcfire-native-memory';

import { runGalaxyMapSoftNativeReclaimPass } from './runGalaxyMapSoftNativeReclaimPass';
import { runStageNativeReclaimPass } from './runStageNativeReclaimPass';
import {
  resolveActivePlanetSessionAnchorId,
  resolveSinglePlanetSessionKeepIds,
} from './singlePlanetSessionKeep';
import { emitMemProfileMarker } from '../devMemoryProfileBridge';

type GalaxyIngressKind = 'from_planet_hub' | 'after_hub_combat';

let pendingKind: GalaxyIngressKind | null = null;

export function markGalaxyMapIngressFromPlanetHub(): void {
  pendingKind = 'from_planet_hub';
}

/** @deprecated 호환 — teardownPlanetHubCombatForGalaxyDeparture */
export function markPostHubCombatWorldmapIngressReclaim(): void {
  pendingKind = 'after_hub_combat';
}

/**
 * worldmap focus 1회 — planet blur reclaim 보완(Fresco·soft floor).
 */
export function consumeGalaxyMapIngressReclaim(): void {
  const kind = pendingKind;
  if (!kind) return;
  pendingKind = null;

  const anchor = resolveActivePlanetSessionAnchorId();
  const keep = resolveSinglePlanetSessionKeepIds(anchor);

  if (kind === 'after_hub_combat') {
    runStageNativeReclaimPass({
      stage: 'galaxy_map',
      reason: 'ingress_after_hub_combat',
      keepPlanetIds: keep,
      reclaimHubSkia: false,
      releaseGpuLayers: false,
    });
    runGalaxyMapSoftNativeReclaimPass('ingress_after_hub_combat', keep);
  } else {
    runGalaxyMapSoftNativeReclaimPass('ingress_from_planet_hub', keep);
  }

  void trimNativeBitmapCachesAsync().then((result) => {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      // eslint-disable-next-line no-console
      console.log(
        `[MEM] consumeGalaxyMapIngressReclaim kind=${kind} fresco=${result.frescoCleared ?? false}`,
      );
    }
  });

  emitMemProfileMarker({
    stage: 'galaxy_map',
    event: 'ingress_reclaim',
    detail: kind,
  });
}
