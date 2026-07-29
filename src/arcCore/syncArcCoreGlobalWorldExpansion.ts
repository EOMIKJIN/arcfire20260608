import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StarSystem } from '../types';
import { usePlayerStore } from '../store/playerStore';
import { useWorldStore } from '../store/worldStore';
import { useClanWarFoundationStore } from '../store/clanWarFoundationStore';
import { deactivateRemovedSynthFrontierEconomies } from './economy/synthFrontierConvoyTradeBridge';
import { finalizeArcCoreSynthFrontierUnlock } from './worldExpansionSynthColonization';
import { persistArcCoreDailyUnlockRecord } from './arcCoreDailyUnlockVerification';
import {
  hydrateWorldExpansionGlobalPolicyCache,
  isArcCoreGlobalWorldExpansionEnabled,
  resolveArcCoreWorldExpansionGlobalPolicy,
} from './worldExpansionGlobalPolicy';
import { buildGlobalSynthUnlockTargetIds } from './worldExpansionGlobalSchedule';
import { resolveWorldExpansionHardReset } from './worldExpansionGlobalResetDetection';

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
  /** 세대/epoch mismatch로 강제 재개방(초과 synth 잠금) 판정을 했는지 — 운영 로그·테스트용 */
  hardReset: boolean;
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

// ---- 세대/epoch mismatch 감지 (M1) — 동기 호출 경로(WorldExpansionSubCore.onBoot 등)용 인메모리 캐시 ----
// AsyncStorage read는 비동기이지만 실제 호출부 대부분(`syncArcCoreGlobalWorldExpansionSync`)은 동기라
// 모듈 로드 시점(= JS 번들 eval, `arcCoreHub.start()`보다 한참 먼저)에 백그라운드로 미리 읽어 둔다.
// 세션 내 첫 호출 전에 하이드레이트가 끝나지 않은 극히 드문 경우엔 안전 기본값(hardReset=false, 즉
// 파괴적 remove 없이 기존 접두 유지)로 처리 — 다음 호출에서 캐시가 채워져 재판정된다(자기 교정).
let appliedStateCache: AppliedGlobalExpansionState | null | undefined;
let appliedStateHydratePromise: Promise<void> | null = null;

function hydrateAppliedStateCacheOnce(): void {
  if (appliedStateHydratePromise) return;
  appliedStateHydratePromise = loadAppliedState().then((s) => {
    // 하이드레이트 완료 전에 실제 sync 호출이 먼저 캐시를 채웠으면 덮어쓰지 않음
    if (appliedStateCache === undefined) appliedStateCache = s;
  });
}
hydrateAppliedStateCacheOnce();

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
 * (M4) 재잠금된 synth 성계의 순수 neutral 자리표만 정리 — `seedSynthFrontierNeutralHold`가
 * 만든 것만 지운다(player_home·플레이어 독립국·클랜 점유는 store 쪽 가드로 보존).
 * 21코어·분쟁(BLUE/RED 시드) planetHolds는 애초에 `removed`(synth_* 한정)에 포함되지 않으므로 무관.
 */
function clearRemovedSynthFrontierHolds(
  removed: readonly string[],
  systems: Record<string, StarSystem>,
): void {
  if (removed.length === 0) return;
  const war = useClanWarFoundationStore.getState();
  for (const systemId of removed) {
    const sys = systems[systemId];
    for (const planet of sys?.planets ?? []) {
      war.clearSynthFrontierNeutralHold(planet.id);
    }
  }
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
    hardReset: false,
  };

  if (!policy.globalScheduleEnabled) return empty;

  const world = useWorldStore.getState();
  if (!world.loaded) return empty;

  // 비동기 경로 — AsyncStorage를 직접 await해 항상 실측 비교(캐시 레이스 없음)
  const appliedBefore = await loadAppliedState();
  const hardReset = resolveWorldExpansionHardReset(appliedBefore, policy);

  const currentSynthUnlocked = world.unlockedSystemIds.filter((id) => id.startsWith('synth_'));
  const { targetCount, targetSynthIds } = buildGlobalSynthUnlockTargetIds(
    world.systems,
    policy,
    nowMs,
    currentSynthUnlocked,
    !hardReset,
  );

  const { added, removed } = world.reconcileGlobalSynthUnlocks(targetSynthIds);
  ensurePlayerNotOnRemovedSystems(removed);
  if (removed.length > 0) {
    deactivateRemovedSynthFrontierEconomies(removed);
    clearRemovedSynthFrontierHolds(removed, world.systems);
  }

  for (const systemId of added) {
    finalizeArcCoreSynthFrontierUnlock(systemId, 'global_schedule');
    void persistArcCoreDailyUnlockRecord(systemId);
  }

  const nextApplied: AppliedGlobalExpansionState = {
    resetGeneration: policy.resetGeneration,
    epochDayKey: policy.epochDayKey,
    targetCount,
    lastSyncedAtMs: nowMs,
  };
  appliedStateCache = nextApplied;
  await storeAppliedState(nextApplied);

  if (__DEV__ && (added.length > 0 || removed.length > 0 || hardReset)) {
    console.log(
      `[ArcCore/WorldExpansion] global sync gen=${policy.resetGeneration} epoch=${policy.epochDayKey} ` +
        `target=${targetCount} +${added.length} -${removed.length} hardReset=${hardReset}`,
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
    hardReset,
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
      hardReset: false,
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
      hardReset: false,
    };
  }
  const policy = resolveArcCoreWorldExpansionGlobalPolicy();
  // 동기 호출 경로 — 모듈 로드 시 백그라운드 하이드레이트된 캐시로 비교(레이스 시 안전 기본값 false)
  const hardReset = resolveWorldExpansionHardReset(appliedStateCache, policy);
  const currentSynthUnlocked = world.unlockedSystemIds.filter((id) => id.startsWith('synth_'));
  const { targetCount, targetSynthIds } = buildGlobalSynthUnlockTargetIds(
    world.systems,
    policy,
    nowMs,
    currentSynthUnlocked,
    !hardReset,
  );
  const { added, removed } = world.reconcileGlobalSynthUnlocks(targetSynthIds);
  ensurePlayerNotOnRemovedSystems(removed);
  if (removed.length > 0) {
    deactivateRemovedSynthFrontierEconomies(removed);
    clearRemovedSynthFrontierHolds(removed, world.systems);
  }
  for (const systemId of added) {
    finalizeArcCoreSynthFrontierUnlock(systemId, 'global_schedule');
    void persistArcCoreDailyUnlockRecord(systemId);
  }
  const nextApplied: AppliedGlobalExpansionState = {
    resetGeneration: policy.resetGeneration,
    epochDayKey: policy.epochDayKey,
    targetCount,
    lastSyncedAtMs: nowMs,
  };
  appliedStateCache = nextApplied;
  void storeAppliedState(nextApplied);
  if (__DEV__ && (added.length > 0 || removed.length > 0 || hardReset)) {
    console.log(
      `[ArcCore/WorldExpansion] global sync(sync) gen=${policy.resetGeneration} epoch=${policy.epochDayKey} ` +
        `target=${targetCount} +${added.length} -${removed.length} hardReset=${hardReset}`,
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
    hardReset,
  };
}
