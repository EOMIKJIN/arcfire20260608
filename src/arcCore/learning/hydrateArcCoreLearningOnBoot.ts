// ============================================================
// Learning Store 부트 hydrate — DORMANT (런타임 호출 금지)
// 설계 확정·일 1회 배치 게이트 후 ArcCoreDailyOpsSubCore에서만 연동 예정
// ============================================================

let bootScheduled = false;

/** @deprecated 설계 미완 — 현재 no-op. SubCore onBoot에서 호출하지 않는다. */
export function scheduleArcCoreLearningBootHydrate(): void {
  if (bootScheduled) return;
  bootScheduled = true;
  if (__DEV__) {
    console.log('[ArcCore/Learning] boot hydrate skipped (dormant until design Phase 2)');
  }
}
