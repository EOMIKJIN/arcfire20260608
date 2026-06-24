import { trimNativeBitmapCachesAsync } from 'arcfire-native-memory';

import { compactPlanetMemoRegistryShells } from '../planetMemoCache';
import { prunePlanetNebulaProfilesExceptPlanetIds } from '../../store/planetNebulaStore';
import { signalHubBackdropNativeRemount } from './hubBackdropNativeRemountSignal';
import { runSoftNativeReclaimPass } from './runSoftNativeReclaimPass';

export type DeepNativeReclaimPassOptions = {
  planetId: string;
  reason: string;
};

/**
 * PID 유지 중 Native(PSS) floor 2차 회수 — Fresco trim + RN/Skia 백드롭 remount.
 * 전투·route_blur full reclaim 과 별도. hub 체류 ~15분 주기.
 */
export function runDeepNativeReclaimPass(opts: DeepNativeReclaimPassOptions): void {
  signalHubBackdropNativeRemount(opts.reason);
  runSoftNativeReclaimPass(opts.reason);
  prunePlanetNebulaProfilesExceptPlanetIds([opts.planetId]);
  compactPlanetMemoRegistryShells();

  void trimNativeBitmapCachesAsync().then((result) => {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      // eslint-disable-next-line no-console
      console.log(
        `[MEM] runDeepNativeReclaimPass reason=${opts.reason} fresco=${result.frescoCleared ?? false}`,
      );
    }
  });
}
