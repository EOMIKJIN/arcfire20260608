import type { Mission, MissionProgress } from '../types';
import { getMissionById, isInstanceMissionId, listInstanceMissions } from './missionCatalog';

export type TavernBoardTab = 'board' | 'mission_status' | 'new_missions';

export type MissionStatusRow = {
  mission: Mission;
  progress: MissionProgress;
  isPrimaryActive: boolean;
};

export type InstanceMissionOfferState = 'available' | 'level_locked' | 'in_progress' | 'completed';

export type InstanceMissionOfferRow = {
  mission: Mission;
  state: InstanceMissionOfferState;
};

function resolveProgressMission(progress: MissionProgress): Mission | undefined {
  return getMissionById(progress.missionId);
}

export function listActiveMissionStatusRows(
  progresses: Record<string, MissionProgress>,
  activeMissionId: string | null,
): MissionStatusRow[] {
  const rows: MissionStatusRow[] = [];
  for (const progress of Object.values(progresses)) {
    if (progress.status !== 'active') continue;
    const mission = resolveProgressMission(progress);
    if (!mission) continue;
    rows.push({
      mission,
      progress,
      isPrimaryActive: progress.missionId === activeMissionId,
    });
  }
  rows.sort((a, b) => {
    if (a.isPrimaryActive !== b.isPrimaryActive) return a.isPrimaryActive ? -1 : 1;
    return (b.progress.startedAt ?? 0) - (a.progress.startedAt ?? 0);
  });
  return rows;
}

export function listCompletedMissionStatusRows(
  progresses: Record<string, MissionProgress>,
): MissionStatusRow[] {
  const rows: MissionStatusRow[] = [];
  for (const progress of Object.values(progresses)) {
    if (progress.status !== 'complete') continue;
    const mission = resolveProgressMission(progress);
    if (!mission) continue;
    rows.push({
      mission,
      progress,
      isPrimaryActive: false,
    });
  }
  rows.sort((a, b) => (b.progress.completedAt ?? 0) - (a.progress.completedAt ?? 0));
  return rows;
}

function resolveInstanceOfferState(
  mission: Mission,
  playerLevel: number,
  progress: MissionProgress | undefined,
): InstanceMissionOfferState {
  if (progress?.status === 'complete') return 'completed';
  if (progress?.status === 'active') return 'in_progress';
  const required = mission.levelRequired ?? 1;
  if (playerLevel < required) return 'level_locked';
  return 'available';
}

export function listTavernInstanceMissionOffers(
  planetId: string,
  playerLevel: number,
  progresses: Record<string, MissionProgress>,
): InstanceMissionOfferRow[] {
  const rows: InstanceMissionOfferRow[] = [];
  for (const mission of listInstanceMissions()) {
    if (mission.offerPlanetId !== planetId) continue;
    rows.push({
      mission,
      state: resolveInstanceOfferState(mission, playerLevel, progresses[mission.id]),
    });
  }
  rows.sort((a, b) => {
    const levelA = a.mission.levelRequired ?? 1;
    const levelB = b.mission.levelRequired ?? 1;
    if (levelA !== levelB) return levelA - levelB;
    return a.mission.id.localeCompare(b.mission.id);
  });
  return rows;
}

export function countStoryChainMissionsInProgress(
  progresses: Record<string, MissionProgress>,
): number {
  let count = 0;
  for (const progress of Object.values(progresses)) {
    if (progress.status !== 'active') continue;
    if (!isInstanceMissionId(progress.missionId)) count += 1;
  }
  return count;
}
