import { InteractionManager } from 'react-native';
import { BaseArcSubCore } from './BaseArcSubCore';
import { shouldRunArcCoreDailyBatch } from '../schedule/arcCoreDailyOpsPolicy';
import {
  getArcCoreDailyOpsLastBatchAtMs,
  getArcCoreDailyOpsLastBatchCompletedDayKey,
  hydrateArcCoreDailyOpsState,
  markArcCoreDailyBatchCompleted,
  markArcCoreDailyBatchStarted,
} from '../schedule/arcCoreDailyOpsState';
import { registerRunningArcCoreDailyBatch } from '../schedule/arcCoreDailyBatchGate';
import { runArcCoreDailyOpsBatch } from '../schedule/runArcCoreDailyOpsBatch';
import { formatArcCoreOpsDayKey, resolveArcCoreDailyOpsPolicy } from '../schedule/arcCoreDailyOpsPolicy';
import { setArcCoreDailyOpsSummaryPending } from '../schedule/arcCoreDailyOpsSummaryPending';
import { runArcCorePlanetDevWallTick } from '../planetDevelopment/runArcCorePlanetDevWallTick';
import { usePlayerStore } from '../../store/playerStore';
import {
  getDailyOpsBatchElapsedMs,
  getDailyOpsBatchLastStep,
  noteDailyOpsBatchStep,
} from '../schedule/dailyOpsBatchProgress';
import { pushArcCoreDailyKpiToRtdbIfDue } from '../learning/pushArcCoreDailyKpiToRtdb';
import { isArcCoreRtdbAvailableForSession } from '../../firebase/rtdbRefs';
import { getCurrentUser } from '../../firebase/auth';

/** 배치가 던지고 실패한 뒤 — 매 60초 틱마다 즉시 재시도 스팸을 막는 세션 내(비영속) 쿨다운 */
const DAILY_BATCH_FAILURE_COOLDOWN_MS = 10 * 60 * 1000;

/**
 * 배치 전체 상한 — hang 시 markCompleted 미도달·batchRunning 영구 고착을 끊고 재시도.
 * 정상 실측은 수십 초대. 4분은 여유 상한.
 */
const DAILY_OPS_BATCH_HARD_BUDGET_MS = 4 * 60 * 1000;

/**
 * 아크코어 일일 운영 서브코어
 * - 벽시계 24h 관측(수송·궤도 등) 후 정책 시각(기본 12:00)에 1회 분석·재배치.
 * - 행성 코어·경제·AABS·월드 확장 등 고빈도 패스는 여기로 수렴한다.
 */
export class ArcCoreDailyOpsSubCore extends BaseArcSubCore {
  private lastProbeMs = 0;
  private batchRunning = false;
  /** Wave A′(task_id=daily-ops-batch-incomplete-fix-20260803) — throw 시 재시도 쿨다운용 */
  private lastFailureAtMs = 0;

  constructor() {
    super('arc_core_daily_ops_subcore', '크로노스 · 일일 운영');
  }

  override onBoot(): void {
    // 부트 프레임 차단 금지 — 타이틀/허브 첫 렌더가 끝난 뒤 유휴 시점에 일일 배치 실행.
    // (정오 이후 부팅 시 무거운 경제·코어 배치가 JS 스레드를 점유해 시작 화면이 멈추는 회귀 방지)
    InteractionManager.runAfterInteractions(() => {
      void this.probeDailyBatch('boot');
    });
  }

  override _advanceWallClock(wallDeltaSec: number): void {
    super._advanceWallClock(wallDeltaSec);
    const now = Date.now();
    if (now - this.lastProbeMs < 60_000) return;
    this.lastProbeMs = now;
    void runArcCorePlanetDevWallTick(now);
    void this.probeDailyBatch('tick');
  }

  private async probeDailyBatch(_source: 'boot' | 'tick'): Promise<void> {
    if (this.batchRunning) return;
    if (this.lastFailureAtMs && Date.now() - this.lastFailureAtMs < DAILY_BATCH_FAILURE_COOLDOWN_MS) {
      return;
    }
    // 중복 실행 방지 — 아래 await(hydrateArcCoreDailyOpsState) 진입 전에 동기로 플래그를
    // 세운다. boot 트리거(InteractionManager)와 60초 tick 트리거가 근접 시각에 겹치면,
    // 플래그를 await 뒤에 세웠을 때 둘 다 위 `if (this.batchRunning) return;`를 통과해
    // runArcCoreDailyOpsBatch()가 동시에 두 번 실행되는 경합이 있었다(실기 logcat에서
    // market micro-adjust/trade-route daily market 결과가 완전히 동일한 값으로 두 번
    // 찍히는 것으로 확인). 2026-08-04 수정.
    this.batchRunning = true;
    try {
      await hydrateArcCoreDailyOpsState();
      const now = Date.now();
      const signupAtMs = usePlayerStore.getState().player?.createdAt ?? null;
      if (
        !shouldRunArcCoreDailyBatch(now, {
          // Wave A(task_id=daily-ops-batch-incomplete-fix-20260803) — 게이트는 "완료" 기준.
          lastBatchCompletedDayKey: getArcCoreDailyOpsLastBatchCompletedDayKey(),
          signupAtMs,
        })
      ) {
        return;
      }

      const batchWork = (async () => {
        try {
          // 시작 관측 기록(게이트에는 더 이상 쓰이지 않음 — Wave A) — 실기 진단·감사용으로만 유지.
          await markArcCoreDailyBatchStarted(now);
          // eslint-disable-next-line no-console
          console.log(
            `[ArcCore/DailyOps] batch started dayKey=${formatArcCoreOpsDayKey(now, resolveArcCoreDailyOpsPolicy().timeZone)} source=${_source}`,
          );
          const lastBatchAt = getArcCoreDailyOpsLastBatchAtMs();
          const batchResult = await Promise.race([
            runArcCoreDailyOpsBatch(),
            new Promise<never>((_, reject) => {
              setTimeout(() => {
                reject(
                  new Error(
                    `daily_ops_budget_exceeded ms=${DAILY_OPS_BATCH_HARD_BUDGET_MS} lastStep=${getDailyOpsBatchLastStep()} elapsedMs=${getDailyOpsBatchElapsedMs()}`,
                  ),
                );
              }, DAILY_OPS_BATCH_HARD_BUDGET_MS);
            }),
          ]);

          // 완료 도장 최우선 — summary/RTDB보다 먼저. AtMs는 실제 완료 시각(Date.now).
          const completedAtMs = Date.now();
          await markArcCoreDailyBatchCompleted(completedAtMs);
          noteDailyOpsBatchStep('markCompleted');
          // eslint-disable-next-line no-console
          console.log(
            `[ArcCore/DailyOps] batch completed dayKey=${formatArcCoreOpsDayKey(completedAtMs, resolveArcCoreDailyOpsPolicy().timeZone)} elapsedMs=${completedAtMs - now}`,
          );

          const policy = resolveArcCoreDailyOpsPolicy();
          const dayKey = formatArcCoreOpsDayKey(completedAtMs, policy.timeZone);
          const hoursSinceLastBatch =
            lastBatchAt != null && lastBatchAt > 0
              ? Math.max(0, (completedAtMs - lastBatchAt) / (60 * 60 * 1000))
              : 0;
          try {
            await setArcCoreDailyOpsSummaryPending({
              dayKey,
              hoursSinceLastBatch,
              economyFabric: batchResult.economyFabric,
              simOverlayIngest: batchResult.simOverlayIngest,
              economyLearning: batchResult.economyLearning,
            });
          } catch (summaryErr) {
            // eslint-disable-next-line no-console
            console.error('[ArcCore/DailyOps] summary pending failed (completed already marked)', summaryErr);
          }

          // RTDB는 완료 도장 이후 최선노력 — hang이 게이트를 다시 막지 않음.
          if (batchResult.learningKpi) {
            void pushArcCoreDailyKpiToRtdbIfDue({
              localDeviceId: getCurrentUser().uid,
              learningResult: batchResult.learningKpi,
              rtdbAvailable: isArcCoreRtdbAvailableForSession(),
            }).catch(() => {
              /* ignore */
            });
          }

          this.lastFailureAtMs = 0;
        } catch (err) {
          // Wave A′ — throw 시 markCompleted 금지(그 날 재시도 여지를 남김) + 세션 쿨다운만.
          // eslint-disable-next-line no-console
          console.error(
            `[ArcCore/DailyOps] probeDailyBatch threw — completed 마크 안 함, 재시도 대기 lastStep=${getDailyOpsBatchLastStep()}`,
            err,
          );
          this.lastFailureAtMs = Date.now();
        }
      })();
      // 차원항로 진입 prewarm(runContinueSessionPrewarm)이 배치 종료를 기다릴 수 있게
      // 등록 — 타이틀 버튼 게이트는 더 이상 이 배치를 기다리지 않는다(2026-08-04).
      registerRunningArcCoreDailyBatch(batchWork);
      await batchWork;
    } finally {
      this.batchRunning = false;
    }
  }
}
