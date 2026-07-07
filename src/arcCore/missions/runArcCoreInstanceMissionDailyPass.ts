import { useArcCoreInstanceMissionBoardStore, replenishArcCoreInstanceMissionBoardForPlanet } from '../../store/arcCoreInstanceMissionBoardStore';
import type { ArcCoreInstanceMissionDailyPassResult } from '../../missions/arcCoreInstanceMissionTypes';

export type ArcCoreInstanceMissionDailyPassOutput = ArcCoreInstanceMissionDailyPassResult;

/**
 * ArcCore AI — 선술집 신규 의뢰 자동 등록 (일일 배치 · 7일 주기 갱신 · 행성당 listed 10건).
 * `runArcCoreDailyOpsBatch`에서 tavern bounty refresh 직후 호출.
 */
export function runArcCoreInstanceMissionDailyPass(nowMs = Date.now()): ArcCoreInstanceMissionDailyPassOutput {
  return useArcCoreInstanceMissionBoardStore.getState().runDailyRegistrationPass(nowMs);
}

/** 선술집 UI — ArcCore 보드 동기화(일일 replenishment와 동일 경로). */
export function syncArcCoreTavernInstanceBoardForPlanet(planetId: string, nowMs = Date.now()): number {
  return replenishArcCoreInstanceMissionBoardForPlanet(planetId, nowMs);
}
