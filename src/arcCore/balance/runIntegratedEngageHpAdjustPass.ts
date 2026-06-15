// ============================================================
// 통합 레벨링 — v4.0 §10-3 일 1회 globalEngageHpMul 보정
// ============================================================

import { resolvePlanetTargetEngageSec } from './balanceTableRegistry';
import { listRecentMatchSummaries } from '../../store/combatMatchTelemetryStore';
import { usePlanetCoreRuntimeStore } from '../../store/planetCoreRuntimeStore';

const MIN_SAMPLES = 3;
const STEP = 0.025;
const MUL_MIN = 0.7;
const MUL_MAX = 1.3;

export type IntegratedEngageHpAdjustResult = {
  ran: boolean;
  sampleCount: number;
  avgEngageSec: number | null;
  targetEngageSec: number;
  previousMul: number;
  nextMul: number;
};

export async function runIntegratedEngageHpAdjustPass(
  referencePlanetId = 'eden_prime',
): Promise<IntegratedEngageHpAdjustResult> {
  const summaries = await listRecentMatchSummaries(20);
  const previousMul = usePlanetCoreRuntimeStore.getState().getGlobalEngageHpMul();
  const targetEngageSec = resolvePlanetTargetEngageSec(referencePlanetId);

  if (summaries.length < MIN_SAMPLES) {
    return {
      ran: false,
      sampleCount: summaries.length,
      avgEngageSec: null,
      targetEngageSec,
      previousMul,
      nextMul: previousMul,
    };
  }

  const avgEngageSec = summaries.reduce((sum, s) => sum + s.engageSec, 0) / summaries.length;
  let nextMul = previousMul;
  if (avgEngageSec > targetEngageSec * 1.12) {
    nextMul -= STEP;
  } else if (avgEngageSec < targetEngageSec * 0.88) {
    nextMul += STEP;
  }
  nextMul = Math.max(MUL_MIN, Math.min(MUL_MAX, nextMul));

  if (Math.abs(nextMul - previousMul) >= 0.0001) {
    await usePlanetCoreRuntimeStore.getState().setGlobalEngageHpMul(nextMul);
  }

  return {
    ran: true,
    sampleCount: summaries.length,
    avgEngageSec,
    targetEngageSec,
    previousMul,
    nextMul,
  };
}
