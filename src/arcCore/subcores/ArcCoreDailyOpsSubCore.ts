import { BaseArcSubCore } from './BaseArcSubCore';
import { shouldRunArcCoreDailyBatch } from '../schedule/arcCoreDailyOpsPolicy';
import {
  getArcCoreDailyOpsLastBatchDayKey,
  hydrateArcCoreDailyOpsState,
  markArcCoreDailyBatchCompleted,
} from '../schedule/arcCoreDailyOpsState';
import { runArcCoreDailyOpsBatch } from '../schedule/runArcCoreDailyOpsBatch';

/**
 * 아크코어 일일 운영 서브코어
 * - 벽시계 24h 관측(수송·궤도 등) 후 정책 시각(기본 12:00)에 1회 분석·재배치.
 * - 행성 코어·경제·AABS·월드 확장 등 고빈도 패스는 여기로 수렴한다.
 */
export class ArcCoreDailyOpsSubCore extends BaseArcSubCore {
  private lastProbeMs = 0;
  private batchRunning = false;

  constructor() {
    super('arc_core_daily_ops_subcore', '아크코어 일일 운영');
  }

  override onBoot(): void {
    void this.probeDailyBatch('boot');
  }

  override _advanceWallClock(wallDeltaSec: number): void {
    super._advanceWallClock(wallDeltaSec);
    const now = Date.now();
    if (now - this.lastProbeMs < 60_000) return;
    this.lastProbeMs = now;
    void this.probeDailyBatch('tick');
  }

  private async probeDailyBatch(_source: 'boot' | 'tick'): Promise<void> {
    if (this.batchRunning) return;
    await hydrateArcCoreDailyOpsState();
    const now = Date.now();
    if (!shouldRunArcCoreDailyBatch(now, getArcCoreDailyOpsLastBatchDayKey())) return;

    this.batchRunning = true;
    try {
      await runArcCoreDailyOpsBatch();
      await markArcCoreDailyBatchCompleted(now);
    } finally {
      this.batchRunning = false;
    }
  }
}
