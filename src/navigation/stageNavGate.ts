/**
 * STAGE 전환 — 버튼 탭 ↔ async teardown/navigate 사이 레이스 차단.
 * (Reanimated freezeOnBlur · Skia · react-native-screens Fragment SIGSEGV 방지)
 */

import { useCallback, useRef, useState } from 'react';
import { InteractionManager } from 'react-native';

/** Reanimated performOperations drain — worldmap/전투/허브 공통 */
export const DEFAULT_STAGE_NAV_DRAIN_MS = 64;

/**
 * InteractionManager.runAfterInteractions 는 blocking LOADING·Reanimated 전환이 남으면 영구 대기한다.
 * (continueSessionPrewarm · 출발→worldmap gate 고착과 동일 클래스)
 * deadline fallback 으로 navigate·scroll arm 이 반드시 1회 실행되게 한다.
 */
export const STAGE_UI_IDLE_DEADLINE_MS = 2500;

export function runStageUiAfterIdle(run: () => void): { cancel: () => void } {
  let ran = false;
  const invoke = () => {
    if (ran) return;
    ran = true;
    run();
  };
  const imTask = InteractionManager.runAfterInteractions(invoke);
  const deadlineId = setTimeout(invoke, STAGE_UI_IDLE_DEADLINE_MS);
  return {
    cancel: () => {
      imTask.cancel?.();
      clearTimeout(deadlineId);
    },
  };
}

export type StageNavGate = {
  /** UI 로딩·버튼 disabled · 오버레이용 */
  pending: boolean;
  /** 첫 탭 즉시 잠금 (연타 차단) */
  tryBegin: () => boolean;
  /** navigate 스케줄 1회만 */
  tryScheduleNavigate: () => boolean;
  reset: () => void;
  isLocked: () => boolean;
};

export function useStageNavGate(): StageNavGate {
  const inFlightRef = useRef(false);
  const navigateScheduledRef = useRef(false);
  const [pending, setPending] = useState(false);

  const tryBegin = useCallback(() => {
    if (inFlightRef.current) return false;
    inFlightRef.current = true;
    setPending(true);
    return true;
  }, []);

  const tryScheduleNavigate = useCallback(() => {
    if (navigateScheduledRef.current) return false;
    navigateScheduledRef.current = true;
    return true;
  }, []);

  const reset = useCallback(() => {
    inFlightRef.current = false;
    navigateScheduledRef.current = false;
    setPending(false);
  }, []);

  const isLocked = useCallback(() => inFlightRef.current, []);

  return { pending, tryBegin, tryScheduleNavigate, reset, isLocked };
}

export function runStageNavAfterTeardown(opts: {
  teardown: () => void;
  navigate: () => void;
  isMounted?: () => boolean;
  drainMs?: number;
}): void {
  // SVG/Skia gate-off 직후 React unmount 2프레임 대기 — teardown 선행 시 Native heap 잔류(worldmap 6/25~26)
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      opts.teardown();
      const task = runStageUiAfterIdle(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setTimeout(() => {
              if (opts.isMounted && !opts.isMounted()) return;
              opts.navigate();
            }, opts.drainMs ?? DEFAULT_STAGE_NAV_DRAIN_MS);
          });
        });
      });
      void task;
    });
  });
}
