// ============================================================
// 스테이지 메모리 계약 — `1.arcfire_flowchart.md` · `2.1.memory.md` §원칙 2
// 모든 주요 스테이지 루트에서 진입(onMount)·이탈(onUnmount) 정리 쌍을 강제한다.
// ============================================================

import { useEffect, useLayoutEffect, useRef } from 'react';
import { logStageMemoryRelease } from '../game/stageMemoryRelease';

/**
 * @param stageId - 스테이지 식별자(로그·디버깅용). 변경 시 mount/unmount 재실행.
 */
export function useStageMemory(
  stageId: string,
  onMount: () => void | Promise<void>,
  onUnmount: () => void,
): void {
  const onMountRef = useRef(onMount);
  const onUnmountRef = useRef(onUnmount);
  // 렌더 중 ref.current 할당 — Freeze/Hermes read-only TypeError (worldmap·planet 전환)
  useLayoutEffect(() => {
    onMountRef.current = onMount;
    onUnmountRef.current = onUnmount;
  }, [onMount, onUnmount]);

  useEffect(() => {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      // eslint-disable-next-line no-console
      console.log(`[MEM] ${stageId} mount`);
    }
    void onMountRef.current();
    return () => {
      onUnmountRef.current();
      logStageMemoryRelease(stageId);
    };
  }, [stageId]);
}
