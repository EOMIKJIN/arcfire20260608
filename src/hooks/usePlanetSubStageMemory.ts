// ============================================================
// 행성 SUB-STAGE(무역소·조선소 등) 메모리 계약 — `2.1.memory.md` §4-1
// Hub는 push로 유지되므로 unmount 시 로컬 상태만 정리한다.
// planet.tsx blur 에서 hubSubStageNavRef 게이트 — full route_blur release 금지(정적 감사 필수).
// ============================================================

import { useStageMemory } from './useStageMemory';
import { releasePlanetSubStageMemory } from '../game/stageMemoryRelease';

export function usePlanetSubStageMemory(
  stageId: string,
  onUnmountCleanup?: () => void,
): void {
  useStageMemory(
    `substage:${stageId}`,
    () => {},
    () => {
      onUnmountCleanup?.();
      releasePlanetSubStageMemory(stageId);
    },
  );
}
