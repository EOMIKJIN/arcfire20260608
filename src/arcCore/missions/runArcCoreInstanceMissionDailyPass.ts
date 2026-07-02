import { useArcCoreInstanceMissionBoardStore } from '../../store/arcCoreInstanceMissionBoardStore';
import type { ArcCoreInstanceMissionDailyPassResult } from '../../missions/arcCoreInstanceMissionTypes';

export type ArcCoreInstanceMissionDailyPassOutput = ArcCoreInstanceMissionDailyPassResult;

/**
 * ArcCore AI — 선술집 신규 의뢰 자동 등록 (일 1건 · 보드 최대 7 · 7일 주기 갱신).
 * `runArcCoreDailyOpsBatch`에서 tavern bounty refresh 직후 호출.
 */
export function runArcCoreInstanceMissionDailyPass(nowMs = Date.now()): ArcCoreInstanceMissionDailyPassOutput {
  return useArcCoreInstanceMissionBoardStore.getState().runDailyRegistrationPass(nowMs);
}
