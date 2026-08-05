import { useTavernBoardStore } from '../store/tavernBoardStore';
import { useWorldStore } from '../store/worldStore';
import {
  getExpansionUnlockIntervalSec,
  isArcExpansionTestOneShotConsumed,
  isArcExpansionTestOneShotEnvOn,
  markArcExpansionTestOneShotDoneAsync,
} from './arcCoreExpansionTestFlags';
import { isArcCoreGlobalWorldExpansionEnabled } from './worldExpansionGlobalPolicy';
import { syncArcCoreGlobalWorldExpansionSync } from './syncArcCoreGlobalWorldExpansion';
import { usePlayerStore } from '../store/playerStore';
import { finalizeArcCoreSynthFrontierUnlock } from './worldExpansionSynthColonization';
import { persistArcCoreDailyUnlockRecord } from './arcCoreDailyUnlockVerification';

/** 레거시 per-user 일일 1성계 (globalScheduleEnabled=false 일 때만) */
function tryLegacyPerUserArcCoreWorldDailyUnlock(): boolean {
  const world = useWorldStore.getState();
  if (!world.loaded) return false;
  const now = Date.now();
  const last = world.lastExpansionAtMs ?? 0;
  const intervalSec = getExpansionUnlockIntervalSec();
  if (last > 0 && now - last < intervalSec * 1000) return false;

  const currentSystemId = usePlayerStore.getState().player?.currentSystemId ?? null;
  const candidateId = world.pickArcCoreDailyUnlockCandidate(currentSystemId);
  if (!candidateId) return false;

  const targetSystem = world.getSystem(candidateId);
  if (!targetSystem) return false;
  const sourcePlanetId = targetSystem.planets[0]?.id;
  if (!sourcePlanetId) return false;

  world.unlockSystem(candidateId, 'arc_core_daily');
  finalizeArcCoreSynthFrontierUnlock(candidateId, 'daily');
  void persistArcCoreDailyUnlockRecord(candidateId);

  if (isArcExpansionTestOneShotEnvOn() && !isArcExpansionTestOneShotConsumed()) {
    void markArcExpansionTestOneShotDoneAsync();
    useTavernBoardStore.getState().pushNotice({
      i18nKey: 'news.expansionTest',
      i18nParams: { systemName: targetSystem.name, systemId: candidateId },
      title: `[TEST] Unexplored system opened`,
      body: `ArcCore one-shot test opened ${targetSystem.name}(${candidateId}). Daily cycle returns to 24h.`,
      tag: 'arccore',
      dedupeKey: 'arc_expansion_test_one_shot_v1',
    });
  }
  return true;
}

/**
 * 월드 확장 — `WorldExpansionSubCore`·일일 운영 배치 공용.
 * 기본: RTDB/CSV epoch 전역 일정(`syncArcCoreGlobalWorldExpansionSync`).
 */
export function tryArcCoreWorldDailyUnlock(): boolean {
  if (isArcCoreGlobalWorldExpansionEnabled()) {
    const result = syncArcCoreGlobalWorldExpansionSync();
    return result.added.length > 0;
  }
  return tryLegacyPerUserArcCoreWorldDailyUnlock();
}
