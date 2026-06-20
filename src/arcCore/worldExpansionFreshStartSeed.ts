/**
 * 계정 신규·초기화 시 아크코어가 즉시 개방하는 첫 미개척 성계(synth_073).
 * 일일 개방(`tryArcCoreWorldDailyUnlock`)과 별도 — `lastExpansionAtMs`는 건드리지 않는다.
 */
import { GAMEPLAY_SYSTEM_IDS } from '../data/galaxy100';
import { useWorldStore } from '../store/worldStore';
import { finalizeArcCoreSynthFrontierUnlock } from './worldExpansionSynthColonization';
import { persistArcCoreDailyUnlockRecord } from './arcCoreDailyUnlockVerification';
import { ARC_CORE_ACCOUNT_FRESH_START_SEED_SYSTEM_ID } from './worldExpansionConstants';

const BASELINE_UNLOCKED = new Set(GAMEPLAY_SYSTEM_IDS);

/** 게임플레이 기본 성계만 개방된 신규·초기화 월드인지 — 중간 진행 저장에는 시드를 적용하지 않는다. */
export function shouldApplyArcCoreAccountFreshStartSeed(): boolean {
  const world = useWorldStore.getState();
  if (!world.loaded) return false;
  if (world.isSystemUnlocked(ARC_CORE_ACCOUNT_FRESH_START_SEED_SYSTEM_ID)) return false;
  if (world.lastExpansionAtMs !== null) return false;
  const hasNonBaselineUnlock = world.unlockedSystemIds.some((id) => !BASELINE_UNLOCKED.has(id));
  return !hasNonBaselineUnlock;
}

/**
 * `world.loaded` 이후 호출. 신규·초기화 월드에 synth_073을 즉시 해금한다.
 * @returns 실제 해금 수행 여부
 */
export function applyArcCoreAccountFreshStartSeedUnlock(): boolean {
  if (!shouldApplyArcCoreAccountFreshStartSeed()) return false;

  const systemId = ARC_CORE_ACCOUNT_FRESH_START_SEED_SYSTEM_ID;
  const world = useWorldStore.getState();
  const target = world.getSystem(systemId);
  if (!target?.planets[0]?.id) return false;

  world.unlockSystem(systemId, 'arc_core_fresh_start_seed');
  finalizeArcCoreSynthFrontierUnlock(systemId, 'fresh_start_seed');
  void persistArcCoreDailyUnlockRecord(systemId);
  return true;
}
