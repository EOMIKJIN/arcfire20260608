import { InteractionManager } from 'react-native';

import { trimNativeBitmapCachesAsync } from 'arcfire-native-memory';

import { compactPlanetMemoRegistryShells } from '../planetMemoCache';
import { prunePlanetNebulaProfilesExceptPlanetIds } from '../../store/planetNebulaStore';
import { signalHubBackdropNativeRemount } from './hubBackdropNativeRemountSignal';
import { signalHubSkiaNativeReclaim } from './hubSkiaNativeReclaimSignal';
import { HUB_BACKDROP_NATIVE_REMOUNT_DEFER_MS } from './processMemoryBudgetPolicy';
import { runSoftNativeReclaimPass } from './runSoftNativeReclaimPass';

export type DeepNativeReclaimPassOptions = {
  planetId: string;
  reason: string;
};

let backdropRemountTimer: ReturnType<typeof setTimeout> | null = null;
let backdropRemountRaf1 = 0;
let backdropRemountRaf2 = 0;

/**
 * SkiaDomView finalize race 방지 — dodge overlay 해제 → 2×rAF → RN Image remount만.
 * Skia Canvas key remount는 planetHubSubcomponents에서 금지(sticky dodge).
 */
function scheduleHubBackdropNativeRemount(reason: string): void {
  if (backdropRemountTimer) {
    clearTimeout(backdropRemountTimer);
    backdropRemountTimer = null;
  }
  if (backdropRemountRaf1) cancelAnimationFrame(backdropRemountRaf1);
  if (backdropRemountRaf2) cancelAnimationFrame(backdropRemountRaf2);

  signalHubSkiaNativeReclaim(`${reason}:pre_backdrop`);

  InteractionManager.runAfterInteractions(() => {
    backdropRemountRaf1 = requestAnimationFrame(() => {
      backdropRemountRaf2 = requestAnimationFrame(() => {
        backdropRemountRaf1 = 0;
        backdropRemountRaf2 = 0;
        backdropRemountTimer = setTimeout(() => {
          backdropRemountTimer = null;
          signalHubBackdropNativeRemount(reason);
        }, HUB_BACKDROP_NATIVE_REMOUNT_DEFER_MS);
      });
    });
  });
}

/**
 * PID 유지 중 Native(PSS) floor 2차 회수 — Fresco trim + RN Image 백드롭 remount.
 * 전투·route_blur full reclaim 과 별도. hub 체류 ~15분 주기.
 */
export function runDeepNativeReclaimPass(opts: DeepNativeReclaimPassOptions): void {
  scheduleHubBackdropNativeRemount(opts.reason);
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
