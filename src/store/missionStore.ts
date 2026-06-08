/**
 * 미션 진행 저장: `progresses[missionId].objectives[objectiveId]` boolean.
 * 목표 타입 계약·완료 조건: `src/missions/missionObjectiveDsl.ts`.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { scheduleUserCloudSync } from '../firebase/userCloudSyncSchedule';
import { Mission, MissionProgress } from '../types';
import { MISSIONS, FIRST_MISSION_ID } from '../data/missions';
import { usePlayerStore } from './playerStore';

const STORAGE_KEY = 'arcfire_missions_v1';

type ActiveBundle = { mission: Mission; progress: MissionProgress };

function emptyObjectives(m: Mission): Record<string, boolean> {
  return Object.fromEntries(m.objectives.map((o) => [o.id, false]));
}

interface MissionState {
  progresses: Record<string, MissionProgress>;
  activeMissionId: string | null;
  loadLocalMissions: () => Promise<void>;
  persistMissions: () => Promise<void>;
  resetLocalMissions: () => Promise<void>;
  initMissions: () => void;
  getActiveMission: () => ActiveBundle | null;
  completeObjective: (missionId: string, objectiveId: string) => void;
}

export const useMissionStore = create<MissionState>((set, get) => ({
  progresses: {},
  activeMissionId: null,

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
    set({ progresses: {}, activeMissionId: null });
  },

  initMissions: () => {
    if (get().activeMissionId) return;
    const m = MISSIONS[FIRST_MISSION_ID];
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
    const mission = MISSIONS[activeMissionId];
    const progress = progresses[activeMissionId];
    if (!mission || !progress || progress.status !== 'active') return null;
    return { mission, progress };
  },

  completeObjective: (missionId, objectiveId) => {
    const mission = MISSIONS[missionId];
    if (!mission) return;

    const state = get();
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
    const nextProgresses = { ...state.progresses, [missionId]: completed };
    let activeMissionId = state.activeMissionId;

    if (mission.nextMissionId) {
      const nextM = MISSIONS[mission.nextMissionId];
      if (nextM) {
        activeMissionId = nextM.id;
        nextProgresses[nextM.id] = {
          missionId: nextM.id,
          status: 'active',
          objectives: emptyObjectives(nextM),
          startedAt: Date.now(),
        };
      } else {
        activeMissionId = null;
      }
    } else {
      activeMissionId = null;
    }

    set({ progresses: nextProgresses, activeMissionId });

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
    void get().persistMissions();
  },
}));
