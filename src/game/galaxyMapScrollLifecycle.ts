/**
 * STAGE 2 — 은하계 지도 Reanimated scroll 해제 (worldmap ↔ planet 반복 누적 방지)
 * 정본: planetHubWorkletContract · finalizeGalaxyMapSessionForExit → releaseGalaxyMapStageMemory
 */

import { cancelAnimation, runOnUI, type SharedValue } from 'react-native-reanimated';

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
  // JS에서 scrollAlive=0을 먼저 내린 뒤 UI에서 decay 취소 — blur 직후 제스처 이벤트 SIGSEGV 방지
  handles.scrollAliveSv.value = 0;
  const { scrollX, scrollY, scrollAliveSv } = handles;
  runOnUI(() => {
    'worklet';
    scrollAliveSv.value = 0;
    cancelAnimation(scrollX);
    cancelAnimation(scrollY);
  })();
}

export function releaseGalaxyMapScrollIfRegistered(): void {
  if (!registeredHandles) return;
  teardownGalaxyMapScrollFromJs(registeredHandles);
  registeredHandles = null;
}
