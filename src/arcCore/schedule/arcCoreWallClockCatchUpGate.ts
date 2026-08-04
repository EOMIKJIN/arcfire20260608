// ============================================================
// 벽시계 catch-up + territorial probe 게이트
// 타이틀 버튼 활성화를 막지 않는다. 차원항로(이어하기) prewarm에서만 합류한다.
// (2026-08-04 대표님 지시: 시작화면 배치/사전로딩 금지 → continue-warp 구간 전담)
// ============================================================

let runningCatchUp: Promise<void> | null = null;

/** catch-up·probe 시작 시 등록 — 실패해도 게이트는 해제된다. */
export function registerRunningArcCoreWallClockCatchUp(work: Promise<void>): void {
  const wrapped = work
    .catch(() => {
      /* catch-up 실패는 게이트 관심사 아님 */
    })
    .finally(() => {
      if (runningCatchUp === wrapped) runningCatchUp = null;
    });
  runningCatchUp = wrapped;
}

/** 현재 실행 중인 catch-up이 있으면 끝날 때까지 대기(없으면 즉시 반환). */
export async function waitForArcCoreWallClockCatchUpIdle(): Promise<void> {
  for (let i = 0; i < 4; i++) {
    const current = runningCatchUp;
    if (!current) return;
    await current;
  }
}
