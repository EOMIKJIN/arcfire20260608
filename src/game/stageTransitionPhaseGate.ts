/**
 * STAGE 전환 Phase Gate — teardown → drain → navigate → arm 직렬화.
 * stageNavGate.runStageNavAfterTeardown / usePlanetStageSession frozen 경로와 정합.
 */

import {
  DEFAULT_STAGE_NAV_DRAIN_MS,
  runStageNavAfterTeardown,
  runStageUiAfterIdle,
} from '../navigation/stageNavGate';

export type StageTransitionPhase =
  | 'A_intent_lock'
  | 'B_lifecycle_suspend'
  | 'C_session_release'
  | 'D_native_reclaim_deferred'
  | 'E_interaction_drain'
  | 'F_navigate'
  | 'G_target_mount'
  | 'H_ingress_reclaim'
  | 'I_gesture_arm'
  | 'J_unlock';

export type RunStagedHubDepartureOpts = {
  /** Phase C — Skia·memo·session 해제 */
  teardown: () => void;
  /** Phase F */
  navigate: () => void;
  /** Phase A 직전 — lazy warm 등 */
  preTeardown?: () => void;
  isMounted?: () => boolean;
};

/**
 * Planet hub lifecycle frozen → navigate — 2×rAF + IM drain + navigate.
 * usePlanetStageSession frozen effect와 동일 타이밍 (Phase E→F).
 */
export function scheduleStageNavigateAfterDrain(
  navigate: () => void,
  opts?: { isMounted?: () => boolean; drainMs?: number },
): { cancel: () => void } {
  let cancelled = false;
  let navigated = false;
  const runNavigate = () => {
    if (cancelled || navigated) return;
    if (opts?.isMounted && !opts.isMounted()) return;
    navigated = true;
    navigate();
  };
  const task = runStageUiAfterIdle(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(runNavigate, opts?.drainMs ?? DEFAULT_STAGE_NAV_DRAIN_MS);
      });
    });
  });
  const frozenFallback = setTimeout(runNavigate, 10000);
  return {
    cancel: () => {
      cancelled = true;
      task.cancel();
      clearTimeout(frozenFallback);
    },
  };
}

/**
 * Planet → worldmap 출발 — preflight 후 2×rAF teardown → IM drain → navigate.
 */
export function runStagedHubDepartureTransition(opts: RunStagedHubDepartureOpts): void {
  opts.preTeardown?.();
  runStageNavAfterTeardown({
    teardown: opts.teardown,
    navigate: opts.navigate,
    isMounted: opts.isMounted,
  });
}
