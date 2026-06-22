/**
 * 미션 진행 저장: `progresses[missionId].objectives[objectiveId]` boolean.
 * 목표 타입 계약·완료 조건: `src/missions/missionObjectiveDsl.ts`.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { scheduleUserCloudSync } from '../firebase/userCloudSyncSchedule';
import { Mission, MissionProgress } from '../types';
import { FIRST_MISSION_ID, getMissionById, isInstanceMissionId } from '../missions/missionCatalog';
import { isMissionAvailable } from '../engine/MissionEngine';
import { usePlayerStore } from './playerStore';
import { resolveMissionClearDialogSceneId } from '../game/ingameDialog/ingameDialogSceneIndex';
import type { PresentIngameDialogOptions } from '../game/ingameDialog/ingameDialogTypes';

export type PendingMissionClearDialog = {
  missionId: string;
  sceneId: string;
  options: PresentIngameDialogOptions;
};

const STORAGE_KEY = 'arcfire_missions_v1';

type ActiveBundle = { mission: Mission; progress: MissionProgress };

function emptyObjectives(m: Mission): Record<string, boolean> {
  return Object.fromEntries(m.objectives.map((o) => [o.id, false]));
}

/** 대화 종료 후 보상·다음 미션 — completeObjective / finalizeMissionCompletion 공용 */
function applyMissionCompletionRewards(missionId: string): void {
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
    void ps.persist();
  }
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

  if (mission.nextMissionId) {
    const nextM = mission.nextMissionId ? getMissionById(mission.nextMissionId) : undefined;
    if (nextM) {
      nextActiveId = nextM.id;
      nextProgresses[nextM.id] = {
        missionId: nextM.id,
        status: 'active',
        objectives: emptyObjectives(nextM),
        startedAt: Date.now(),
      };
    } else if (nextActiveId === missionId) {
      nextActiveId = null;
    }
  } else if (nextActiveId === missionId) {
    nextActiveId = null;
  }

  return { progresses: nextProgresses, activeMissionId: nextActiveId };
}

export type AcceptInstanceMissionResult =
  | 'accepted'
  | 'not_found'
  | 'not_instance'
  | 'wrong_planet'
  | 'level_locked'
  | 'already_active'
  | 'already_complete'
  | 'prereq_missing';

interface MissionState {
  progresses: Record<string, MissionProgress>;
  activeMissionId: string | null;
  pendingMissionDialogId: string | null;
  /** 미션 클리어 대화 — planet 허브 진입 시에만 present (월드맵 overlay 크래시 방지) */
  pendingMissionClearDialog: PendingMissionClearDialog | null;
  loadLocalMissions: () => Promise<void>;
  persistMissions: () => Promise<void>;
  resetLocalMissions: () => Promise<void>;
  initMissions: () => void;
  getActiveMission: () => ActiveBundle | null;
  acceptInstanceMission: (
    missionId: string,
    context: { planetId: string; playerLevel: number },
  ) => AcceptInstanceMissionResult;
  completeObjective: (missionId: string, objectiveId: string) => void;
  /** 인게임 미션 완료 대화 종료 후 호출 */
  finalizeMissionCompletion: (missionId: string) => void;
}

export const useMissionStore = create<MissionState>((set, get) => ({
  progresses: {},
  activeMissionId: null,
  pendingMissionDialogId: null,
  pendingMissionClearDialog: null,

  loadLocalMissions: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Pick<MissionState, 'progresses' | 'activeMissionId'>;
        set({
          progresses: parsed.progresses ?? {},
          activeMissionId: parsed.activeMissionId ?? null,
        });
      }
    } catch {
      /* ignore */
    }
  },

  persistMissions: async () => {
    const { progresses, activeMissionId } = get();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ progresses, activeMissionId }));
    scheduleUserCloudSync();
  },

  resetLocalMissions: async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    set({ progresses: {}, activeMissionId: null, pendingMissionDialogId: null, pendingMissionClearDialog: null });
  },

  initMissions: () => {
    if (get().activeMissionId) return;
    const m = getMissionById(FIRST_MISSION_ID);
    if (!m) return;
    const progress: MissionProgress = {
      missionId: m.id,
      status: 'active',
      objectives: emptyObjectives(m),
      startedAt: Date.now(),
    };
    set({
      activeMissionId: m.id,
      progresses: { ...get().progresses, [m.id]: progress },
    });
    void get().persistMissions();
  },

  getActiveMission: () => {
    const { activeMissionId, progresses } = get();
    if (!activeMissionId) return null;
    const mission = getMissionById(activeMissionId);
    const progress = progresses[activeMissionId];
    if (!mission || !progress || progress.status !== 'active') return null;
    return { mission, progress };
  },

  acceptInstanceMission: (missionId, context) => {
    const mission = getMissionById(missionId);
    if (!mission) return 'not_found';
    if (!isInstanceMissionId(missionId)) return 'not_instance';
    if (mission.offerPlanetId && mission.offerPlanetId !== context.planetId) return 'wrong_planet';

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

    const progress: MissionProgress = {
      missionId,
      status: 'active',
      objectives: emptyObjectives(mission),
      startedAt: Date.now(),
    };

    const currentActive = state.activeMissionId;
    const nextActiveId =
      !currentActive || isInstanceMissionId(currentActive) ? missionId : currentActive;

    set({
      progresses: { ...state.progresses, [missionId]: progress },
      activeMissionId: nextActiveId,
    });
    void get().persistMissions();
    return 'accepted';
  },

  completeObjective: (missionId, objectiveId) => {
    const mission = getMissionById(missionId);
    if (!mission) return;

    const state = get();
    if (state.pendingMissionDialogId === missionId) return;

    const prev = state.progresses[missionId];
    if (!prev || prev.status !== 'active') return;

    const objectives = { ...prev.objectives, [objectiveId]: true };
    const allDone = mission.objectives.every((o) => objectives[o.id]);

    if (!allDone) {
      set({
        progresses: { ...state.progresses, [missionId]: { ...prev, objectives } },
      });
      void get().persistMissions();
      return;
    }

    const completed: MissionProgress = {
      ...prev,
      objectives,
      status: 'complete',
      completedAt: Date.now(),
    };

    const clearSceneId = resolveMissionClearDialogSceneId(missionId);
    if (clearSceneId) {
      set({
        pendingMissionDialogId: missionId,
        pendingMissionClearDialog: {
          missionId,
          sceneId: clearSceneId,
          options: {
            context: {
              missionTitle: mission.title,
              missionTitleEn: mission.titleEn,
            },
            completionActions: [{ type: 'grant_mission_rewards', missionId }],
          },
        },
        progresses: { ...state.progresses, [missionId]: { ...prev, objectives } },
      });
      void get().persistMissions();
      return;
    }

    const chain = advanceMissionChainAfterComplete(
      missionId,
      completed,
      state.progresses,
      state.activeMissionId,
    );
    set({ ...chain, pendingMissionDialogId: null, pendingMissionClearDialog: null });
    applyMissionCompletionRewards(missionId);
    void get().persistMissions();
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
    };
    const chain = advanceMissionChainAfterComplete(
      missionId,
      completed,
      state.progresses,
      state.activeMissionId,
    );
    set({ ...chain, pendingMissionDialogId: null, pendingMissionClearDialog: null });
    applyMissionCompletionRewards(missionId);
    void get().persistMissions();
  },
}));
