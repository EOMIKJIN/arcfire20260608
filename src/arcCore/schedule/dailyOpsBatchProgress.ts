// ============================================================
// 일일 배치 진행 관측 — hang 진단용 lastStep (영속 없음)
// ============================================================

let lastStep = 'idle';
let batchStartedAtMs = 0;

export function noteDailyOpsBatchStep(step: string): void {
  lastStep = step;
  if (step === 'batch_begin') {
    batchStartedAtMs = Date.now();
  }
  // eslint-disable-next-line no-console
  console.log(`[ArcCore/DailyOps][STEP] ${step}`);
}

export function getDailyOpsBatchLastStep(): string {
  return lastStep;
}

export function getDailyOpsBatchElapsedMs(): number {
  if (!batchStartedAtMs) return 0;
  return Math.max(0, Date.now() - batchStartedAtMs);
}
