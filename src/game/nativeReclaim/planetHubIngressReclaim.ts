import { trimNativeBitmapCachesAsync } from 'arcfire-native-memory';

import { resolveActivePlanetSessionAnchorId } from './singlePlanetSessionKeep';
import {
  runPlanetHubIngressReclaimPass,
  type PlanetHubIngressReclaimOptions,
} from './runPlanetHubIngressReclaimPass';
import { emitMemProfileMarker } from '../devMemoryProfileBridge';

let pendingIngress = false;
let pendingInvalidateMemo = false;

/** worldmap · transit combat → planet replace 직전 */
export function markPlanetHubIngressReclaim(opts?: { invalidateMemoCaches?: boolean }): void {
  pendingIngress = true;
  if (opts?.invalidateMemoCaches) {
    pendingInvalidateMemo = true;
  }
}

/** planet focus 1회 — pending 시 Tier B cold reload */
export function consumePlanetHubIngressReclaim(): void {
  if (!pendingIngress) return;
  pendingIngress = false;
  const invalidateMemo = pendingInvalidateMemo;
  pendingInvalidateMemo = false;

  const planetId = resolveActivePlanetSessionAnchorId();
  runPlanetHubIngressReclaimPass(planetId, 'ingress_to_planet_hub', {
    invalidateMemoCaches: invalidateMemo,
  } satisfies PlanetHubIngressReclaimOptions);

  emitMemProfileMarker({
    stage: 'planet_hub',
    event: 'ingress_reclaim',
    detail: planetId ?? '',
  });

  void trimNativeBitmapCachesAsync().then((result) => {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      // eslint-disable-next-line no-console
      console.log(
        `[MEM] consumePlanetHubIngressReclaim fresco=${result.frescoCleared ?? false}`,
      );
    }
  });
}
