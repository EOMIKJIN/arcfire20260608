// ============================================================
// 일일 배치 실행 게이트 — 현재 돌고 있는 일일 배치를 외부(부트 settle 체인)에서
// 기다릴 수 있게 한다. 타이틀 버튼 로딩 게이지가 「배치 완료 = 입력 가능」과
// 일치하도록, catch-up 도중 void로 발화된 배치도 settle 전에 합류시킨다.
// (2026-07-19 타이틀 탭 직후 배치 경합 멈춤 재발 조치)
// ============================================================

let runningBatch: Promise<void> | null = null;

/** 일일 배치 시작 시 등록 — 실패해도 게이트는 해제된다. */
export function registerRunningArcCoreDailyBatch(batch: Promise<void>): void {
  const wrapped = batch
    .catch(() => {
      /* 배치 실패는 게이트 관심사 아님 */
    })
    .finally(() => {
      if (runningBatch === wrapped) runningBatch = null;
    });
  runningBatch = wrapped;
}

/** 현재 실행 중인 일일 배치가 있으면 끝날 때까지 대기(없으면 즉시 반환). */
export async function waitForArcCoreDailyBatchIdle(): Promise<void> {
  // 대기 중 새 배치가 등록될 수 있어 재확인 루프(상한 4회 — 실제로는 1~2회로 끝난다).
  for (let i = 0; i < 4; i++) {
    const current = runningBatch;
    if (!current) return;
    await current;
  }
}
