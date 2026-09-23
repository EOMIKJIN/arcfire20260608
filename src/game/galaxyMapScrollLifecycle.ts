/**
 * STAGE 2 — 은하계 지도 Reanimated scroll 해제 (worldmap ↔ planet 반복 누적 방지)
 * 정본: planetHubWorkletContract · finalizeGalaxyMapSessionForExit → releaseGalaxyMapStageMemory
 */

import { cancelAnimation, type SharedValue } from 'react-native-reanimated';

export type GalaxyMapScrollHandles = {
  scrollX: SharedValue<number>;
  scrollY: SharedValue<number>;
  scrollAliveSv: SharedValue<number>;
};

let registeredHandles: GalaxyMapScrollHandles | null = null;

export function registerGalaxyMapScrollHandles(handles: GalaxyMapScrollHandles): () => void {
  registeredHandles = handles;
  return () => {
    if (registeredHandles === handles) {
      registeredHandles = null;
    }
  };
}

/** JS 스레드 — worldmap blur/unmount·finalizeGalaxyMapSessionForExit */
export function teardownGalaxyMapScrollFromJs(handles: GalaxyMapScrollHandles): void {
  // JS에서 scrollAlive=0 + cancelAnimation만.
  // onRender(Choreographer) 중 runOnUI 재진입은 Hermes UAF SIGSEGV (2026-09-20 23:45 성계이동).
  handles.scrollAliveSv.value = 0;
  cancelAnimation(handles.scrollX);
  cancelAnimation(handles.scrollY);
}

export function releaseGalaxyMapScrollIfRegistered(): void {
  if (!registeredHandles) return;
  teardownGalaxyMapScrollFromJs(registeredHandles);
  registeredHandles = null;
}
