import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePlayerStore } from '../store/playerStore';
import { useWorldStore } from '../store/worldStore';
import { deactivateRemovedSynthFrontierEconomies } from './economy/synthFrontierConvoyTradeBridge';
import { finalizeArcCoreSynthFrontierUnlock } from './worldExpansionSynthColonization';
import { persistArcCoreDailyUnlockRecord } from './arcCoreDailyUnlockVerification';
import {
  hydrateWorldExpansionGlobalPolicyCache,
  isArcCoreGlobalWorldExpansionEnabled,
  resolveArcCoreWorldExpansionGlobalPolicy,
} from './worldExpansionGlobalPolicy';
import { buildGlobalSynthUnlockTargetIds } from './worldExpansionGlobalSchedule';

const APPLIED_STATE_KEY = 'arcfire_world_expansion_global_applied_v1';

type AppliedGlobalExpansionState = {
  resetGeneration: number;
  epochDayKey: string;
  targetCount: number;
  lastSyncedAtMs: number;
};

export type SyncArcCoreGlobalWorldExpansionResult = {
  ran: boolean;
  globalEnabled: boolean;
  targetCount: number;
  added: string[];
  removed: string[];
  policyGeneration: number;
  epochDayKey: string;
};

async function loadAppliedState(): Promise<AppliedGlobalExpansionState | null> {
  try {
    const raw = await AsyncStorage.getItem(APPLIED_STATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AppliedGlobalExpansionState;
  } catch {
    return null;
  }
}

async function storeAppliedState(state: AppliedGlobalExpansionState): Promise<void> {
  try {
    await AsyncStorage.setItem(APPLIED_STATE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function ensurePlayerNotOnRemovedSystems(removed: readonly string[]): void {
  if (removed.length === 0) return;
  const removedSet = new Set(removed);
  const player = usePlayerStore.getState().player;
  if (!player) return;
  const currentSystemId = player.currentSystemId;
  if (!currentSystemId || !removedSet.has(currentSystemId)) return;
  usePlayerStore.getState().moveToSystem('arcadia');
}

/**
 * 벽시계·RTDB epoch 기준 전역 synth 개방 수를 로컬 worldStore에 맞춘다.
 * resetGeneration·epochDayKey 변경 시 초과 개방 synth는 잠금(reconcile).
 */
export async function syncArcCoreGlobalWorldExpansion(
  nowMs: number = Date.now(),
): Promise<SyncArcCoreGlobalWorldExpansionResult> {
  await hydrateWorldExpansionGlobalPolicyCache();
  const policy = resolveArcCoreWorldExpansionGlobalPolicy();
  const empty: SyncArcCoreGlobalWorldExpansionResult = {
    ran: false,
    globalEnabled: policy.globalScheduleEnabled,
    targetCount: 0,
    added: [],
    removed: [],
    policyGeneration: policy.resetGeneration,
    epochDayKey: policy.epochDayKey,
  };

  if (!policy.globalScheduleEnabled) return empty;

  const world = useWorldStore.getState();
  if (!world.loaded) return empty;

  const { targetCount, targetSynthIds } = buildGlobalSynthUnlockTargetIds(
    world.systems,
    policy,
    nowMs,
  );

  const { added, removed } = world.reconcileGlobalSynthUnlocks(targetSynthIds);
  ensurePlayerNotOnRemovedSystems(removed);
  if (removed.length > 0) {
    deactivateRemovedSynthFrontierEconomies(removed);
  }

  for (const systemId of added) {
    finalizeArcCoreSynthFrontierUnlock(systemId, 'global_schedule');
    void persistArcCoreDailyUnlockRecord(systemId);
  }

  await storeAppliedState({
    resetGeneration: policy.resetGeneration,
    epochDayKey: policy.epochDayKey,
    targetCount,
    lastSyncedAtMs: nowMs,
  });

  if (__DEV__ && (added.length > 0 || removed.length > 0)) {
    console.log(
      `[ArcCore/WorldExpansion] global sync gen=${policy.resetGeneration} epoch=${policy.epochDayKey} target=${targetCount} +${added.length} -${removed.length}`,
    );
  }

  return {
    ran: true,
    globalEnabled: true,
    targetCount,
    added,
    removed,
    policyGeneration: policy.resetGeneration,
    epochDayKey: policy.epochDayKey,
  };
}

/** RTDB ingest 직후·부트·일일 배치에서 호출 */
export function syncArcCoreGlobalWorldExpansionSync(
  nowMs: number = Date.now(),
): SyncArcCoreGlobalWorldExpansionResult {
  if (!isArcCoreGlobalWorldExpansionEnabled()) {
    const policy = resolveArcCoreWorldExpansionGlobalPolicy();
    return {
      ran: false,
      globalEnabled: false,
      targetCount: 0,
      added: [],
      removed: [],
      policyGeneration: policy.resetGeneration,
      epochDayKey: policy.epochDayKey,
    };
  }
  const world = useWorldStore.getState();
  if (!world.loaded) {
    const policy = resolveArcCoreWorldExpansionGlobalPolicy();
    return {
      ran: false,
      globalEnabled: true,
      targetCount: 0,
      added: [],
      removed: [],
      policyGeneration: policy.resetGeneration,
      epochDayKey: policy.epochDayKey,
    };
  }
  const policy = resolveArcCoreWorldExpansionGlobalPolicy();
  const { targetCount, targetSynthIds } = buildGlobalSynthUnlockTargetIds(
    world.systems,
    policy,
    nowMs,
  );
  const { added, removed } = world.reconcileGlobalSynthUnlocks(targetSynthIds);
  ensurePlayerNotOnRemovedSystems(removed);
  if (removed.length > 0) {
    deactivateRemovedSynthFrontierEconomies(removed);
  }
  for (const systemId of added) {
    finalizeArcCoreSynthFrontierUnlock(systemId, 'global_schedule');
    void persistArcCoreDailyUnlockRecord(systemId);
  }
  void storeAppliedState({
    resetGeneration: policy.resetGeneration,
    epochDayKey: policy.epochDayKey,
    targetCount,
    lastSyncedAtMs: nowMs,
  });
  return {
    ran: true,
    globalEnabled: true,
    targetCount,
    added,
    removed,
    policyGeneration: policy.resetGeneration,
    epochDayKey: policy.epochDayKey,
  };
}
