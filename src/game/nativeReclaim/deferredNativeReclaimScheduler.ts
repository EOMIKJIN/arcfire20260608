import { InteractionManager } from 'react-native';

import { runNativeReclaimListeners } from './nativeReclaimRegistry';
import type { NativeReclaimStage } from './nativeReclaimContracts';
import { DEFERRED_NATIVE_RECLAIM_DELAY_MS } from './processMemoryBudgetPolicy';

let deferredTimer: ReturnType<typeof setTimeout> | null = null;
let deferredRaf1 = 0;
let deferredRaf2 = 0;

/**
 * Phase-2 reclaim — InteractionManager + 2×rAF + 지연.
 * `Image.clearMemoryCache()` 동기 호출 금지(ANR). deferred listener 만 실행.
 */
export function scheduleDeferredNativeReclaimPass(opts: {
  stage: NativeReclaimStage;
  reason: string;
  keepPlanetIds?: readonly string[];
}): void {
  if (deferredTimer) {
    clearTimeout(deferredTimer);
    deferredTimer = null;
  }
  if (deferredRaf1) cancelAnimationFrame(deferredRaf1);
  if (deferredRaf2) cancelAnimationFrame(deferredRaf2);

  InteractionManager.runAfterInteractions(() => {
    deferredRaf1 = requestAnimationFrame(() => {
      deferredRaf2 = requestAnimationFrame(() => {
        deferredRaf1 = 0;
        deferredRaf2 = 0;
        deferredTimer = setTimeout(() => {
          deferredTimer = null;
          const count = runNativeReclaimListeners({
            stage: opts.stage,
            reason: `${opts.reason}:deferred`,
            phase: 'deferred',
            keepPlanetIds: opts.keepPlanetIds,
          });
          if (typeof __DEV__ !== 'undefined' && __DEV__ && count > 0) {
            // eslint-disable-next-line no-console
            console.log(`[MEM] deferredNativeReclaim stage=${opts.stage} listeners=${count}`);
          }
        }, DEFERRED_NATIVE_RECLAIM_DELAY_MS);
      });
    });
  });
}
