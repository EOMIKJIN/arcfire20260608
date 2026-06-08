// ============================================================
// 실시간 전투 — Reanimated 프레임 루프 + 고정 Δt 시뮬 (JS 스레드에서 step)
// - worklet 안에서는 runOnJS 로만 시뮬 접근 (공유 ref/클로저 직접 금지)
// ============================================================

import { useCallback, useRef } from 'react';
import { runOnJS, useFrameCallback } from 'react-native-reanimated';
import { consumeBattleSimAccumulator } from './simClock';

/**
 * @returns `useFrameCallback` 제어 객체 — `setActive(true/false)` 로 시작/정지
 */
export function useBattleSimLoop(onSimStep: (dtMs: number) => void) {
  const accRef = useRef(0);
  const onSimRef = useRef(onSimStep);
  onSimRef.current = onSimStep;

  const tick = useCallback((dt: number) => {
    accRef.current = consumeBattleSimAccumulator(accRef.current, dt, ms => {
      onSimRef.current(ms);
    });
  }, []);

  const frame = useFrameCallback(({ timeSincePreviousFrame }) => {
    'worklet';
    const dt = timeSincePreviousFrame ?? 0;
    if (dt <= 0) return;
    runOnJS(tick)(dt);
  }, false);

  return frame;
}
