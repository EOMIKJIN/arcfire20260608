/**
 * 미션 진행 저장: `progresses[missionId].objectives[objectiveId]` boolean.
 * 트랙: `mission_*` 튜토리얼 · `story_*` 메인스토리 · `sandbox_*` 수락 의뢰 — `missionTrack.ts`
 * 목표 타입 계약: `src/missions/missionObjectiveDsl.ts`.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { scheduleUserCloudSync } from '../firebase/userCloudSyncSchedule';
import { Mission, MissionProgress } from '../types';
import {
  FIRST_TUTORIAL_MISSION_ID,
  getMissionById,
  isCampaignPrimaryMissionId,
  isMainStoryMissionId,
  isQuestMissionId,
  isTutorialMissionId,
} from '../missions/missionCatalog';
import { isArcCoreInstanceMissionId } from '../missions/arcCoreInstanceMissionResolver';
import {
  isCaptainPersonalMissionId,
  parseCaptainPersonalMissionId,
} from '../missions/captainPersonalMissionIds';
import {
  clearCaptainPersonalMaterializedCache,
  forgetCaptainPersonalMaterializedMission,
  rematerializeCaptainPersonalMissionsFromProgresses,
} from '../missions/captainPersonalMissionResolver';
import {
  kstDayKeyFromMs,
  resolvePersonalDeclineUntilDayKey,
} from '../missions/captainPersonalMissionOffer';
import { canCompleteSequentialObjective } from '../missions/missionObjectiveSequence';
import { resolveCurrentMainStoryOfferMissionId, resolveMainStoryAfterBindMissionComplete } from '../missions/mainStory/resolveMainStoryProgression';
import { useMainStoryProgressStore } from './mainStoryProgressStore';
import { isMissionAvailable } from '../engine/MissionEngine';
import { usePlayerStore } from './playerStore';
import { resolveMissionClearDialogSceneId } from '../game/ingameDialog/ingameDialogSceneIndex';
import type { PresentIngameDialogOptions } from '../game/ingameDialog/ingameDialogTypes';
import {
  collectHydratePendingMissionClears,
  emptyPendingMissionClearFields,
  enqueuePendingMissionClear,
  isMissionInClearPipeline,
  promoteNextPendingMissionClear,
} from '../missions/pendingMissionClearQueue';
import {
  resolveClearDialogSpeakerCaptainId,
  resolveMissionClearAssignedNpcCaptainId,
  resolveMissionClearNpcSceneKind,
} from '../missions/resolveMissionClearNpcContext';
import {
  resolveMissionContactPlanetIdForSystem,
  resolveBarHostCaptainIdAtPlanet,
} from '../missions/missionClearContactLookups';
import { getNpcCaptain } from '../npc/npcFleetRegistry';
import {
  computeExpiredMissionSweep,
  stampMissionExpiresAtMs,
} from '../missions/missionTimeLimit';
import { t } from '../i18n';
import { showArcAlert } from '../utils/showArcAlert';
import { resolveNewlyActivatedMissionId } from '../missions/missionProgressAlertCopy';
import {
  presentMissionChainUpdateAlert,
  presentMissionObjectiveProgressAlert,
} from '../missions/presentMissionProgressAlert';
import {
  CLEARED_ARC_INST_SNAPSHOT_LIMIT,
  type ClearedArcInstSnapshot,
  pruneOrphanArcInstProgresses as computeOrphanArcInstPrune,
  shouldReconcileOrphanArcInstWithBoard,
} from '../missions/arcCoreInstanceProgressCleanup';
import {
  sanitizeActiveMissionId,
  sanitizeMissionProgresses,
} from '../missions/missionProgressSanitize';

export type PendingMissionClearDialog = {
  missionId: string;
  sceneId: string;
  options: PresentIngameDialogOptions;
};

const STORAGE_KEY = 'arcfire_missions_v1';
const MISSION_PERSIST_COALESCE_MS = 1500;

let missionPersistTimer: ReturnType<typeof setTimeout> | null = null;
let missionPersistWrite: Promise<void> = Promise.resolve();

function cancelScheduledMissionPersist(): void {
  if (!missionPersistTimer) return;
  clearTimeout(missionPersistTimer);
  missionPersistTimer = null;
}

function sanitizeClearedArcInstCount(raw: unknown): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1_000_000, Math.floor(n)));
}

function sanitizeClearedArcInstSnapshots(raw: unknown): ClearedArcInstSnapshot[] {
  if (!Array.isArray(raw)) return [];
  const out: ClearedArcInstSnapshot[] = [];
  for (let i = 0; i < raw.length && out.length < CLEARED_ARC_INST_SNAPSHOT_LIMIT; i += 1) {
    const row = raw[i] as { instanceId?: unknown; title?: unknown; completedAt?: unknown };
    if (!row || typeof row !== 'object') continue;
    const instanceId = typeof row.instanceId === 'string' ? row.instanceId.trim() : '';
    if (!instanceId.startsWith('arc_inst_')) continue;
    const titleRaw = typeof row.title === 'string' ? row.title.trim() : instanceId;
    const completedAt =
      typeof row.completedAt === 'number' && Number.isFinite(row.completedAt)
        ? Math.floor(row.completedAt)
        : 0;
    out.push({
      instanceId,
      title: (titleRaw || instanceId).slice(0, 80),
      completedAt,
    });
  }
  return out;
}

/** 부트 스윕(타이틀 알림 금지) → 허브/차원항로에서 1회 표시 */
let pendingExpireNotifyCount = 0;

export type SweepExpiredMissionsOpts = {
  nowMs?: number;
  notify?: boolean;
};

/** arcCoreInstanceMissionBoardStore 정적 import 금지 — applyLocalGameSaveSnapshot ↔ missionStore 순환 방지 */
function arcCoreInstanceMissionBoardStore() {
  return require('./arcCoreInstanceMissionBoardStore').useArcCoreInstanceMissionBoardStore as typeof import('./arcCoreInstanceMissionBoardStore').useArcCoreInstanceMissionBoardStore;
}

type ActiveBundle = { mission: Mission; progress: MissionProgress };

function emptyObjectives(m: Mission): Record<string, boolean> {
  return Object.fromEntries(m.objectives.map((o) => [o.id, false]));
}

function backfillMissingExpiresAt(
  progresses: Record<string, MissionProgress>,
): { next: Record<string, MissionProgress>; changed: boolean } {
  let changed = false;
  let next = progresses;
  const ids = Object.keys(progresses);
  for (let i = 0; i < ids.length; i += 1) {
    const id = ids[i]!;
    const progress = progresses[id]!;
    if (progress.status !== 'active') continue;
    if (typeof progress.expiresAtMs === 'number' && Number.isFinite(progress.expiresAtMs)) continue;
    const mission = getMissionById(progress.missionId);
    if (!mission) continue;
    const startedAt = progress.startedAt ?? Date.now();
    const expiresAtMs = stampMissionExpiresAtMs(mission, startedAt);
    if (expiresAtMs == null) continue;
    if (!changed) next = { ...progresses };
    next[id] = { ...progress, startedAt, expiresAtMs };
    changed = true;
  }
  return { next, changed };
}

function createActiveMissionProgress(mission: Mission, startedAt = Date.now()): MissionProgress {
  const expiresAtMs = stampMissionExpiresAtMs(mission, startedAt);
  const personal = isCaptainPersonalMissionId(mission.id);
  return {
    missionId: mission.id,
    status: 'active',
    objectives: emptyObjectives(mission),
    startedAt,
    assignedClearNpcCaptainId: resolveAssignedClearNpcCaptainIdForMission(mission),
    ...(expiresAtMs != null ? { expiresAtMs } : {}),
    ...(personal && mission.instanceTemplateMissionId
      ? {
          captainPersonalTemplateId: mission.instanceTemplateMissionId,
          captainPersonalOfferPlanetId: mission.offerPlanetId,
        }
      : {}),
    ...(mission.title.trim() ? { titleSnapshot: mission.title.trim().slice(0, 80) } : {}),
  };
}

function afterCaptainPersonalMissionSettled(
  missionId: string,
  kind: 'cleared' | 'expired',
): void {
  if (!isCaptainPersonalMissionId(missionId)) return;
  forgetCaptainPersonalMaterializedMission(missionId);
  if (kind !== 'cleared') return;
  const parsed = parseCaptainPersonalMissionId(missionId);
  if (!parsed) return;
  const dayKey = kstDayKeyFromMs();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { patchCaptainPersonalMemory } = require('../store/orbitPresenceMemoryStore') as typeof import('../store/orbitPresenceMemoryStore');
  patchCaptainPersonalMemory(parsed.captainId, {
    personalThanksPending: true,
    lastPersonalOfferDayKey: dayKey,
    declineUntilDayKey: resolvePersonalDeclineUntilDayKey(dayKey),
  });
}

function dropExpiredPendingClears(
  state: Pick<
    MissionState,
    'pendingMissionDialogId' | 'pendingMissionClearDialog' | 'pendingMissionClearQueue'
  >,
  expiredIds: ReadonlySet<string>,
): Partial<
  Pick<
    MissionState,
    'pendingMissionDialogId' | 'pendingMissionClearDialog' | 'pendingMissionClearQueue'
  >
> | null {
  const queue = state.pendingMissionClearQueue.filter((row) => !expiredIds.has(row.missionId));
  const headExpired =
    !!state.pendingMissionDialogId && expiredIds.has(state.pendingMissionDialogId);
  if (!headExpired && queue.length === state.pendingMissionClearQueue.length) return null;
  if (headExpired) {
    return promoteNextPendingMissionClear(queue);
  }
  return { pendingMissionClearQueue: queue };
}

function presentExpiredMissionAlert(count: number): void {
  if (count <= 0) return;
  showArcAlert(
    t('mission.timeLimit.expiredTitle'),
    t('mission.timeLimit.expiredBody', { count }),
  );
}

function flushPendingExpireAlert(): void {
  const count = pendingExpireNotifyCount;
  pendingExpireNotifyCount = 0;
  presentExpiredMissionAlert(count);
}

function noteMissionExpireWatch(): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { isMissionExpireWatchBusy, scheduleMissionExpireWatch } =
      require('../missions/missionExpireRealtimeWatch') as typeof import('../missions/missionExpireRealtimeWatch');
    if (isMissionExpireWatchBusy()) return;
    scheduleMissionExpireWatch();
  } catch {
    /* 워치 미기동 */
  }
}

function clearMissionExpireWatchSafe(): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { clearMissionExpireWatch } =
      require('../missions/missionExpireRealtimeWatch') as typeof import('../missions/missionExpireRealtimeWatch');
    clearMissionExpireWatch();
  } catch {
    /* 워치 미기동 */
  }
}

function isActiveMissionAllObjectivesDone(mission: Mission, progress: MissionProgress): boolean {
  if (progress.status !== 'active' || mission.objectives.length === 0) return false;
  for (let i = 0; i < mission.objectives.length; i += 1) {
    if (!progress.objectives[mission.objectives[i]!.id]) return false;
  }
  return true;
}

/** 수락 시점 스냅샷 — 컨택 대상 퀘스트만 목적지 담당. 아니면 undefined(오퍼레이터). */
function resolveAssignedClearNpcCaptainIdForMission(mission: Mission): string | undefined {
  return (
    resolveMissionClearAssignedNpcCaptainId(
      mission,
      resolveMissionContactPlanetIdForSystem,
      resolveBarHostCaptainIdAtPlanet,
    ) ?? undefined
  );
}

function backfillAssignedClearContacts(
  progresses: Record<string, MissionProgress>,
): { next: Record<string, MissionProgress>; changed: boolean } {
  let changed = false;
  let next = progresses;
  const ids = Object.keys(progresses);
  for (let i = 0; i < ids.length; i += 1) {
    const id = ids[i]!;
    const progress = progresses[id]!;
    if (progress.status !== 'active') continue;
    if (progress.assignedClearNpcCaptainId) continue;
    const mission = getMissionById(progress.missionId);
    if (!mission) continue;
    const assigned = resolveAssignedClearNpcCaptainIdForMission(mission);
    if (!assigned) continue;
    if (!changed) next = { ...progresses };
    next[id] = { ...progress, assignedClearNpcCaptainId: assigned };
    changed = true;
  }
  return { next, changed };
}

function buildPendingClearDialog(
  mission: Mission,
  progress: MissionProgress,
): PendingMissionClearDialog | null {
  const landingPlanetId = usePlayerStore.getState().player?.currentPlanetId ?? null;
  const assignedCaptainId = resolveClearDialogSpeakerCaptainId(
    mission,
    progress.assignedClearNpcCaptainId,
    landingPlanetId,
    resolveBarHostCaptainIdAtPlanet,
  );
  const sceneKind = resolveMissionClearNpcSceneKind(mission.objectives);
  const clearSceneId = resolveMissionClearDialogSceneId(mission.id, assignedCaptainId, sceneKind);
  if (!clearSceneId) return null;
  const npcCaptain = assignedCaptainId ? getNpcCaptain(assignedCaptainId) : null;
  return {
    missionId: mission.id,
    sceneId: clearSceneId,
    options: {
      context: {
        missionTitle: mission.title,
        missionTitleEn: mission.titleEn,
        npcCaptainId: assignedCaptainId ?? undefined,
        npcName: npcCaptain?.displayName,
        npcNameEn: npcCaptain?.displayNameEn,
      },
      completionActions: [{ type: 'grant_mission_rewards', missionId: mission.id }],
    },
  };
}

/** 튜토리얼 체인 종단(next 없음) 완료 시 player.flags.tutorialComplete 기입 */
function markTutorialCompleteIfChainEnded(missionId: string): void {
  if (!isTutorialMissionId(missionId)) return;
  const mission = getMissionById(missionId);
  if (!mission || mission.nextMissionId) return;
  const ps = usePlayerStore.getState();
  const player = ps.player;
  if (!player || player.flags.tutorialComplete) return;
  ps.setPlayer({
    ...player,
    flags: {
      ...player.flags,
      tutorialComplete: true,
    },
  });
  void ps.persist();
}

/** 세이브 로드 소급 — 이미 종단 튜토리얼을 끝낸 계정 */
function reconcileTutorialCompleteFromProgress(
  progresses: Record<string, MissionProgress>,
): void {
  const ps = usePlayerStore.getState();
  const player = ps.player;
  if (!player || player.flags.tutorialComplete) return;
  for (const progress of Object.values(progresses)) {
    if (progress.status !== 'complete') continue;
    if (!isTutorialMissionId(progress.missionId)) continue;
    const mission = getMissionById(progress.missionId);
    if (mission && !mission.nextMissionId) {
      ps.setPlayer({
        ...player,
        flags: { ...player.flags, tutorialComplete: true },
      });
      void ps.persist();
      return;
    }
  }
}

/** 주선 종료 후 남은 활성(메인스토리 → 의뢰)으로 activeMissionId 승계 */
function findFallbackActiveMissionId(
  progresses: Record<string, MissionProgress>,
  excludeMissionId: string,
): string | null {
  let questId: string | null = null;
  for (const progress of Object.values(progresses)) {
    if (progress.missionId === excludeMissionId || progress.status !== 'active') continue;
    if (isMainStoryMissionId(progress.missionId)) return progress.missionId;
    if (
      isQuestMissionId(progress.missionId)
      || isArcCoreInstanceMissionId(progress.missionId)
      || isCaptainPersonalMissionId(progress.missionId)
    ) {
      questId = progress.missionId;
    }
  }
  return questId;
}

/** 대화 종료 후 보상·다음 미션 — completeObjective / finalizeMissionCompletion 공용 */
function applyMissionCompletionRewards(missionId: string): void {
  if (useMissionStore.getState().progresses[missionId]?.rewardedAt) return;
  const mission = getMissionById(missionId);
  if (!mission) return;
  const r = mission.rewards;
  const ps = usePlayerStore.getState();
  if (ps.player) {
    ps.addCredits(r.credits);
    if (r.exp) ps.addExp(r.exp);
    if (r.skillPointBonus) {
      const p = usePlayerStore.getState().player!;
      ps.setPlayer({ ...p, skillPoints: p.skillPoints + r.skillPointBonus });
    }
    if (r.items?.length) {
      for (const itemId of r.items) {
        const goodId = itemId?.trim();
        if (goodId) ps.addInventoryItem(goodId, 1);
      }
    }
    void ps.persist();
  }
  markTutorialCompleteIfChainEnded(missionId);
}

function advanceMissionChainAfterComplete(
  missionId: string,
  completed: MissionProgress,
  progresses: Record<string, MissionProgress>,
  activeMissionId: string | null,
): { progresses: Record<string, MissionProgress>; activeMissionId: string | null } {
  const mission = getMissionById(missionId);
  if (!mission) {
    return { progresses, activeMissionId };
  }
  const nextProgresses = { ...progresses, [missionId]: completed };
  let nextActiveId = activeMissionId;

  if (isMainStoryMissionId(missionId)) {
    const flags = useMainStoryProgressStore.getState().choiceFlags;
    const graph = resolveMainStoryAfterBindMissionComplete(missionId, nextProgresses, flags);
    if (graph.completedQuestId) {
      useMainStoryProgressStore.getState().recordQuestCompleted(
        graph.completedQuestId,
        graph.pendingChapterEndSceneId,
      );
    }
    if (graph.nextBindMissionId) {
      const nextM = getMissionById(graph.nextBindMissionId);
      if (nextM) {
        nextActiveId = nextM.id;
        nextProgresses[nextM.id] = createActiveMissionProgress(nextM);
      } else if (nextActiveId === missionId) {
        nextActiveId = findFallbackActiveMissionId(nextProgresses, missionId);
      }
    } else if (nextActiveId === missionId) {
      nextActiveId = findFallbackActiveMissionId(nextProgresses, missionId);
    }
    return { progresses: nextProgresses, activeMissionId: nextActiveId };
  }

  if (mission.nextMissionId) {
    const nextM = mission.nextMissionId ? getMissionById(mission.nextMissionId) : undefined;
    if (nextM) {
      nextActiveId = nextM.id;
      nextProgresses[nextM.id] = createActiveMissionProgress(nextM);
    } else if (nextActiveId === missionId) {
      nextActiveId = findFallbackActiveMissionId(nextProgresses, missionId);
    }
  } else if (nextActiveId === missionId) {
    nextActiveId = findFallbackActiveMissionId(nextProgresses, missionId);
  }

  return { progresses: nextProgresses, activeMissionId: nextActiveId };
}

export type AcceptQuestMissionResult =
  | 'accepted'
  | 'not_found'
  | 'not_quest'
  | 'wrong_planet'
  | 'level_locked'
  | 'already_active'
  | 'already_complete'
  | 'prereq_missing'
  | 'wrong_captain'
  | 'not_on_board'
  | 'no_objectives';

/** 메인 스토리(story_*) — 허브 [대화] 수락 전용 */
export type AcceptMainStoryMissionResult =
  | 'accepted'
  | 'not_found'
  | 'not_main_story'
  | 'wrong_planet'
  | 'level_locked'
  | 'already_active'
  | 'already_complete'
  | 'prereq_missing'
  | 'wrong_captain'
  | 'no_objectives';

/** @deprecated `AcceptQuestMissionResult` */
export type AcceptInstanceMissionResult = AcceptQuestMissionResult;

type MissionAcceptContext = { planetId: string; playerLevel: number; expectCaptainId?: string };

interface MissionState {
  progresses: Record<string, MissionProgress>;
  activeMissionId: string | null;
  /** 보드에서 지운 arc_inst 완료 누적. 이력 배열이 아님. */
  clearedArcInstCount: number;
  clearedArcInstSnapshots: ClearedArcInstSnapshot[];
  pendingMissionDialogId: string | null;
  /** 미션 클리어 대화 헤드 — 허브·무역·은하도착·이동전투 postFlow에서 present */
  pendingMissionClearDialog: PendingMissionClearDialog | null;
  /** 동시 완료 시 헤드를 덮어쓰지 않음. persist 없음. */
  pendingMissionClearQueue: PendingMissionClearDialog[];
  loadLocalMissions: () => Promise<void>;
  sweepExpiredMissions: (opts?: SweepExpiredMissionsOpts) => number;
  persistMissions: () => Promise<void>;
  persistMissionsImmediate: () => Promise<void>;
  flushScheduledMissionPersist: () => Promise<void>;
  pruneOrphanArcInstProgresses: (boardInstanceIds: ReadonlySet<string>) => number;
  /** 보드 hydrate 이후. 빈 초회 보드는 건드리지 않는다. */
  reconcileOrphanArcInstWithBoard: () => number;
  resetLocalMissions: () => Promise<void>;
  /** 튜토리얼 스토리(mission_*) 체인 시작 — 온보딩·인트로 전용 */
  initTutorialStory: () => void;
  /** @deprecated `initTutorialStory` */
  initMissions: () => void;
  getActiveMission: () => ActiveBundle | null;
  /** 수락형 퀘스트(sandbox_*) — 바·허브 NPC 대화 */
  acceptQuestMission: (
    missionId: string,
    context: MissionAcceptContext,
  ) => AcceptQuestMissionResult;
  /** 메인 스토리(story_*) — 허브 [대화] 수락 */
  acceptMainStoryMission: (
    missionId: string,
    context: MissionAcceptContext,
  ) => AcceptMainStoryMissionResult;
  /** @deprecated `acceptQuestMission` */
  acceptInstanceMission: (
    missionId: string,
    context: MissionAcceptContext,
  ) => AcceptQuestMissionResult;
  completeObjective: (missionId: string, objectiveId: string) => void;
  /** 인게임 미션 완료 대화 종료 후 호출 */
  finalizeMissionCompletion: (missionId: string) => void;
  /** 목표 전부 완료인데 pending이 없을 때 클리어 대화 재등록 */
  requeueMissionClearDialogIfReady: (missionId: string) => boolean;
}

export const useMissionStore = create<MissionState>((set, get) => ({
  progresses: {},
  activeMissionId: null,
  clearedArcInstCount: 0,
  clearedArcInstSnapshots: [],
  pendingMissionDialogId: null,
  pendingMissionClearDialog: null,
  pendingMissionClearQueue: [],

  loadLocalMissions: async () => {
    cancelScheduledMissionPersist();
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) {
        clearCaptainPersonalMaterializedCache();
        set({
          progresses: {},
          activeMissionId: null,
          clearedArcInstCount: 0,
          clearedArcInstSnapshots: [],
          ...emptyPendingMissionClearFields<PendingMissionClearDialog>(),
        });
      } else {
        const parsed = JSON.parse(raw) as Pick<
          MissionState,
          'progresses' | 'activeMissionId' | 'clearedArcInstCount' | 'clearedArcInstSnapshots'
        >;
        const sanitized = sanitizeMissionProgresses(parsed.progresses ?? {});
        const backfill = backfillAssignedClearContacts(sanitized.progresses);
        const progresses = backfill.next;
        rematerializeCaptainPersonalMissionsFromProgresses(progresses);
        const activeMissionId = sanitizeActiveMissionId(parsed.activeMissionId, progresses);
        set({
          progresses,
          activeMissionId,
          clearedArcInstCount: sanitizeClearedArcInstCount(parsed.clearedArcInstCount),
          clearedArcInstSnapshots: sanitizeClearedArcInstSnapshots(parsed.clearedArcInstSnapshots),
        });
        if (sanitized.changed || backfill.changed) {
          void get().persistMissions();
        }
        reconcileTutorialCompleteFromProgress(progresses);
        const state = get();
        if (!state.pendingMissionClearDialog && !state.pendingMissionDialogId) {
          const rows = Object.values(state.progresses);
          const recovered: PendingMissionClearDialog[] = [];
          for (let i = 0; i < rows.length; i += 1) {
            const progress = rows[i]!;
            const mission = getMissionById(progress.missionId);
            if (!mission || !isActiveMissionAllObjectivesDone(mission, progress)) continue;
            const pending = buildPendingClearDialog(mission, progress);
            if (!pending) continue;
            recovered.push(pending);
          }
          if (recovered.length > 0) {
            set(collectHydratePendingMissionClears(recovered));
          }
        }
      }
    } catch {
      /* ignore */
    }
    get().sweepExpiredMissions({ notify: false });
    noteMissionExpireWatch();
  },

  sweepExpiredMissions: (opts) => {
    const nowMs = opts?.nowMs ?? Date.now();
    const notify = opts?.notify === true;
    const state = get();
    const backfill = backfillMissingExpiresAt(state.progresses);
    const computed = computeExpiredMissionSweep({
      progresses: backfill.next,
      activeMissionId: state.activeMissionId,
      nowMs,
      resolveMission: getMissionById,
    });
    if (computed.expiredIds.length === 0) {
      if (backfill.changed) {
        set({ progresses: backfill.next });
        void get().persistMissions();
      }
      if (notify) flushPendingExpireAlert();
      noteMissionExpireWatch();
      return 0;
    }

    const expiredSet = new Set(computed.expiredIds);
    for (let i = 0; i < computed.expiredIds.length; i += 1) {
      afterCaptainPersonalMissionSettled(computed.expiredIds[i]!, 'expired');
    }
    const pendingPatch = dropExpiredPendingClears(state, expiredSet);
    set({
      progresses: computed.nextProgresses,
      activeMissionId: computed.nextActiveMissionId,
      ...(pendingPatch ?? {}),
    });

    const board = arcCoreInstanceMissionBoardStore().getState();
    for (let i = 0; i < computed.restoreListedInstanceIds.length; i += 1) {
      board.markBoardEntryListed(computed.restoreListedInstanceIds[i]!);
    }

    if (computed.cargoRemovals.length > 0) {
      const ps = usePlayerStore.getState();
      let stripped = false;
      for (let i = 0; i < computed.cargoRemovals.length; i += 1) {
        const row = computed.cargoRemovals[i]!;
        if (ps.removeInventoryItemBestEffort(row.goodId, row.quantity) > 0) stripped = true;
      }
      if (stripped) void ps.persist();
    }

    void get().persistMissions();
    pendingExpireNotifyCount += computed.expiredIds.length;
    if (notify) flushPendingExpireAlert();
    noteMissionExpireWatch();
    return computed.expiredIds.length;
  },

  persistMissions: async () => {
    cancelScheduledMissionPersist();
    missionPersistTimer = setTimeout(() => {
      missionPersistTimer = null;
      void get().persistMissionsImmediate();
    }, MISSION_PERSIST_COALESCE_MS);
  },

  persistMissionsImmediate: async () => {
    cancelScheduledMissionPersist();
    const run = async () => {
      const {
        progresses,
        activeMissionId,
        clearedArcInstCount,
        clearedArcInstSnapshots,
      } = get();
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          progresses,
          activeMissionId,
          clearedArcInstCount,
          clearedArcInstSnapshots,
        }),
      );
      scheduleUserCloudSync();
    };
    missionPersistWrite = missionPersistWrite.then(run, run);
    await missionPersistWrite;
  },

  flushScheduledMissionPersist: async () => {
    if (!missionPersistTimer) return;
    await get().persistMissionsImmediate();
  },

  pruneOrphanArcInstProgresses: (boardInstanceIds) => {
    const state = get();
    const result = computeOrphanArcInstPrune({
      progresses: state.progresses,
      boardInstanceIds,
      resolveTitle: (id) => {
        const snap = state.progresses[id]?.titleSnapshot?.trim();
        if (snap) return snap;
        return getMissionById(id)?.title;
      },
      prevCount: state.clearedArcInstCount,
      prevSnapshots: state.clearedArcInstSnapshots,
    });
    if (!result.changed) return 0;
    set({
      progresses: result.nextProgresses,
      clearedArcInstCount: result.clearedArcInstCount,
      clearedArcInstSnapshots: result.clearedArcInstSnapshots,
    });
    void get().persistMissions();
    return result.prunedIds.length;
  },

  reconcileOrphanArcInstWithBoard: () => {
    const board = arcCoreInstanceMissionBoardStore().getState();
    if (!shouldReconcileOrphanArcInstWithBoard({
      hydrated: board.hydrated,
      loadedFromStorage: board.loadedFromStorage,
      entryCount: board.entries.length,
    })) {
      return 0;
    }
    const keptIds = new Set<string>();
    for (let i = 0; i < board.entries.length; i += 1) {
      keptIds.add(board.entries[i]!.instanceId);
    }
    return get().pruneOrphanArcInstProgresses(keptIds);
  },

  resetLocalMissions: async () => {
    cancelScheduledMissionPersist();
    clearMissionExpireWatchSafe();
    await AsyncStorage.removeItem(STORAGE_KEY);
    pendingExpireNotifyCount = 0;
    clearCaptainPersonalMaterializedCache();
    set({
      progresses: {},
      activeMissionId: null,
      clearedArcInstCount: 0,
      clearedArcInstSnapshots: [],
      ...emptyPendingMissionClearFields<PendingMissionClearDialog>(),
    });
  },

  initTutorialStory: () => {
    if (get().activeMissionId) return;
    const m = getMissionById(FIRST_TUTORIAL_MISSION_ID);
    if (!m) return;
    const progress = createActiveMissionProgress(m);
    set({
      activeMissionId: m.id,
      progresses: { ...get().progresses, [m.id]: progress },
    });
    void get().persistMissions();
    noteMissionExpireWatch();
  },

  initMissions: () => {
    get().initTutorialStory();
  },

  getActiveMission: () => {
    const { activeMissionId, progresses } = get();
    if (!activeMissionId) return null;
    const mission = getMissionById(activeMissionId);
    const progress = progresses[activeMissionId];
    if (!mission || !progress || progress.status !== 'active') return null;
    return { mission, progress };
  },

  acceptQuestMission: (missionId, context) => {
    get().sweepExpiredMissions({ notify: false });
    const mission = getMissionById(missionId);
    if (!mission) return 'not_found';
    if (mission.objectives.length === 0) return 'no_objectives';

    if (isCaptainPersonalMissionId(missionId)) {
      if (mission.offerPlanetId && mission.offerPlanetId !== context.planetId) return 'wrong_planet';
      if (
        context.expectCaptainId &&
        mission.offerCaptainId &&
        mission.offerCaptainId !== context.expectCaptainId
      ) {
        return 'wrong_captain';
      }

      const personalState = get();
      const existingPersonal = personalState.progresses[missionId];
      if (existingPersonal?.status === 'active') return 'already_active';
      if (existingPersonal?.status === 'complete') return 'already_complete';

      const personalLevel = mission.levelRequired ?? 1;
      if (context.playerLevel < personalLevel) return 'level_locked';

      const personalProgress = createActiveMissionProgress(mission);
      const currentActive = personalState.activeMissionId;
      const nextActiveId =
        !currentActive
        || isQuestMissionId(currentActive)
        || isArcCoreInstanceMissionId(currentActive)
        || isCaptainPersonalMissionId(currentActive)
          ? missionId
          : currentActive;

      set({
        progresses: { ...personalState.progresses, [missionId]: personalProgress },
        activeMissionId: nextActiveId,
      });
      void get().persistMissions();
      noteMissionExpireWatch();
      return 'accepted';
    }

    if (isArcCoreInstanceMissionId(missionId)) {
      const boardEntry = arcCoreInstanceMissionBoardStore().getState().findBoardEntry(missionId);
      if (!boardEntry || boardEntry.boardStatus !== 'listed') return 'not_on_board';
      if (boardEntry.offerPlanetId !== context.planetId) return 'wrong_planet';
      if (
        context.expectCaptainId &&
        boardEntry.offerCaptainId &&
        boardEntry.offerCaptainId !== context.expectCaptainId
      ) {
        return 'wrong_captain';
      }

      const state = get();
      const existing = state.progresses[missionId];
      if (existing?.status === 'active') return 'already_active';
      if (existing?.status === 'complete') return 'already_complete';

      const requiredLevel = mission.levelRequired ?? 1;
      if (context.playerLevel < requiredLevel) return 'level_locked';

      const progress = createActiveMissionProgress(mission);

      const currentActive = state.activeMissionId;
      // 주선(튜토리얼·메인스토리) 유지 — 의뢰 수락 시 activeMissionId 덮어쓰지 않음
      const nextActiveId =
        !currentActive
        || isQuestMissionId(currentActive)
        || isArcCoreInstanceMissionId(currentActive)
        || isCaptainPersonalMissionId(currentActive)
          ? missionId
          : currentActive;

      set({
        progresses: { ...state.progresses, [missionId]: progress },
        activeMissionId: nextActiveId,
      });
      arcCoreInstanceMissionBoardStore().getState().markBoardEntryAccepted(missionId);
      void get().persistMissions();
      noteMissionExpireWatch();
      return 'accepted';
    }

    if (!isQuestMissionId(missionId)) return 'not_quest';
    if (mission.objectives.length === 0) return 'no_objectives';
    if (mission.offerPlanetId && mission.offerPlanetId !== context.planetId) return 'wrong_planet';
    if (
      context.expectCaptainId &&
      mission.offerCaptainId &&
      mission.offerCaptainId !== context.expectCaptainId
    ) {
      return 'wrong_captain';
    }

    const state = get();
    const existing = state.progresses[missionId];
    if (existing?.status === 'active') return 'already_active';
    if (existing?.status === 'complete') return 'already_complete';

    const requiredLevel = mission.levelRequired ?? 1;
    if (context.playerLevel < requiredLevel) return 'level_locked';

    const completedIds = Object.values(state.progresses)
      .filter((row) => row.status === 'complete')
      .map((row) => row.missionId);
    if (!isMissionAvailable(mission, completedIds)) return 'prereq_missing';

    const progress = createActiveMissionProgress(mission);

    const currentActive = state.activeMissionId;
    // QuestHUD 주선: 튜토리얼·메인스토리 진행 중이면 유지, 없으면 수락 의뢰
    const nextActiveId =
      !currentActive || !isCampaignPrimaryMissionId(currentActive) ? missionId : currentActive;

    set({
      progresses: { ...state.progresses, [missionId]: progress },
      activeMissionId: nextActiveId,
    });
    void get().persistMissions();
    noteMissionExpireWatch();
    return 'accepted';
  },

  acceptInstanceMission: (missionId, context) => get().acceptQuestMission(missionId, context),

  acceptMainStoryMission: (missionId, context) => {
    get().sweepExpiredMissions({ notify: false });
    const mission = getMissionById(missionId);
    if (!mission) return 'not_found';
    if (!isMainStoryMissionId(missionId)) return 'not_main_story';
    if (mission.objectives.length === 0) return 'no_objectives';
    if (mission.offerPlanetId && mission.offerPlanetId !== context.planetId) return 'wrong_planet';
    if (
      context.expectCaptainId
      && mission.offerCaptainId
      && mission.offerCaptainId !== context.expectCaptainId
    ) {
      return 'wrong_captain';
    }

    const state = get();
    const existing = state.progresses[missionId];
    if (existing?.status === 'active') return 'already_active';
    if (existing?.status === 'complete') return 'already_complete';

    const requiredLevel = mission.levelRequired ?? 1;
    if (context.playerLevel < requiredLevel) return 'level_locked';

    const completedIds = Object.values(state.progresses)
      .filter((row) => row.status === 'complete')
      .map((row) => row.missionId);
    if (!isMissionAvailable(mission, completedIds)) return 'prereq_missing';

    const openMainStoryId = resolveCurrentMainStoryOfferMissionId(
      state.progresses,
      useMainStoryProgressStore.getState().choiceFlags,
    );
    if (openMainStoryId !== missionId) return 'prereq_missing';

    const progress = createActiveMissionProgress(mission);

    const currentActive = state.activeMissionId;
    // 주선 우선: tutorial > main_story > quest
    let nextActiveId = missionId;
    if (currentActive && isTutorialMissionId(currentActive)) {
      nextActiveId = currentActive;
    }

    set({
      progresses: { ...state.progresses, [missionId]: progress },
      activeMissionId: nextActiveId,
    });
    void get().persistMissions();
    noteMissionExpireWatch();
    return 'accepted';
  },

  completeObjective: (missionId, objectiveId) => {
    get().sweepExpiredMissions({ notify: false });
    const mission = getMissionById(missionId);
    if (!mission) return;

    const state = get();
    if (isMissionInClearPipeline(state, missionId)) return;

    const prev = state.progresses[missionId];
    if (!prev || prev.status !== 'active') return;
    if (prev.objectives[objectiveId]) return;
    if (!canCompleteSequentialObjective(mission, prev, objectiveId)) return;

    const objectives = { ...prev.objectives, [objectiveId]: true };
    const allDone = mission.objectives.every((o) => objectives[o.id]);

    if (!allDone) {
      set({
        progresses: { ...state.progresses, [missionId]: { ...prev, objectives } },
      });
      void get().persistMissions();
      presentMissionObjectiveProgressAlert({
        missionId,
        completedObjectiveId: objectiveId,
        objectives,
      });
      return;
    }

    const completed: MissionProgress = {
      ...prev,
      objectives,
      status: 'complete',
      completedAt: Date.now(),
      titleSnapshot: prev.titleSnapshot ?? getMissionById(missionId)?.title,
    };

    const incoming = buildPendingClearDialog(mission, prev);
    if (incoming) {
      set({
        progresses: { ...state.progresses, [missionId]: { ...prev, objectives } },
        ...enqueuePendingMissionClear(state, incoming),
      });
      void get().persistMissions();
      // 클리어 대사 후 finalize에서 체인 업데이트 팝업
      return;
    }

    const chain = advanceMissionChainAfterComplete(
      missionId,
      completed,
      state.progresses,
      state.activeMissionId,
    );
    set({
      ...chain,
      ...(state.pendingMissionDialogId === missionId
        ? promoteNextPendingMissionClear(state.pendingMissionClearQueue)
        : {}),
    });
    noteMissionExpireWatch();
    if (isArcCoreInstanceMissionId(missionId)) {
      arcCoreInstanceMissionBoardStore().getState().markBoardEntryCleared(missionId);
    }
    afterCaptainPersonalMissionSettled(missionId, 'cleared');
    void (async () => {
      await get().persistMissionsImmediate();
      const latest = get().progresses[missionId];
      if (!latest?.rewardedAt) {
        applyMissionCompletionRewards(missionId);
        const paid = get().progresses[missionId];
        if (paid && !paid.rewardedAt) {
          set({
            progresses: {
              ...get().progresses,
              [missionId]: { ...paid, rewardedAt: Date.now() },
            },
          });
          void get().persistMissions();
        }
      }
    })();
    presentMissionChainUpdateAlert({
      completedMissionId: missionId,
      nextMissionId: resolveNewlyActivatedMissionId(
        missionId,
        state.progresses,
        chain.progresses,
        chain.activeMissionId,
      ),
    });
  },

  requeueMissionClearDialogIfReady: (missionId) => {
    const mission = getMissionById(missionId);
    if (!mission) return false;
    const state = get();
    const progress = state.progresses[missionId];
    if (!progress || !isActiveMissionAllObjectivesDone(mission, progress)) return false;
    if (isMissionInClearPipeline(state, missionId) && state.pendingMissionClearDialog) return true;
    const incoming = buildPendingClearDialog(mission, progress);
    if (!incoming) return false;
    set(enqueuePendingMissionClear(state, incoming));
    return true;
  },

  finalizeMissionCompletion: (missionId) => {
    const state = get();
    if (state.pendingMissionDialogId !== missionId) return;
    const prev = state.progresses[missionId];
    if (!prev) return;

    const completed: MissionProgress = {
      ...prev,
      status: 'complete',
      completedAt: prev.completedAt ?? Date.now(),
      titleSnapshot: prev.titleSnapshot ?? getMissionById(missionId)?.title,
    };
    const chain = advanceMissionChainAfterComplete(
      missionId,
      completed,
      state.progresses,
      state.activeMissionId,
    );
    set({
      ...chain,
      ...promoteNextPendingMissionClear(state.pendingMissionClearQueue),
    });
    noteMissionExpireWatch();
    if (isArcCoreInstanceMissionId(missionId)) {
      arcCoreInstanceMissionBoardStore().getState().markBoardEntryCleared(missionId);
    }
    afterCaptainPersonalMissionSettled(missionId, 'cleared');
    void (async () => {
      await get().persistMissionsImmediate();
      const latest = get().progresses[missionId];
      if (!latest?.rewardedAt) {
        applyMissionCompletionRewards(missionId);
        const paid = get().progresses[missionId];
        if (paid && !paid.rewardedAt) {
          set({
            progresses: {
              ...get().progresses,
              [missionId]: { ...paid, rewardedAt: Date.now() },
            },
          });
          void get().persistMissions();
        }
      }
    })();
    presentMissionChainUpdateAlert({
      completedMissionId: missionId,
      nextMissionId: resolveNewlyActivatedMissionId(
        missionId,
        state.progresses,
        chain.progresses,
        chain.activeMissionId,
      ),
    });
  },
}));
