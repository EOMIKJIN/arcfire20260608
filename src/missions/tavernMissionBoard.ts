import type { Mission, MissionProgress } from '../types';
import { getMissionById, isQuestMissionId, isTutorialMissionId, listQuestMissions } from './missionCatalog';
import { isArcCoreInstanceMissionId } from './arcCoreInstanceMissionResolver';
import { useArcCoreInstanceMissionBoardStore } from '../store/arcCoreInstanceMissionBoardStore';
import type { ArcCoreInstanceMissionCategoryTag } from './arcCoreInstanceMissionTypes';

export type TavernBoardTab = 'board' | 'mission_status' | 'new_missions';

export type MissionStatusRow = {
  mission: Mission;
  progress: MissionProgress;
  isPrimaryActive: boolean;
};

/** 수락형 퀘스트(sandbox_*) 의뢰 상태 */
export type QuestMissionOfferState = 'available' | 'level_locked' | 'in_progress' | 'completed';

/** @deprecated `QuestMissionOfferState` */
export type InstanceMissionOfferState = QuestMissionOfferState;

export type QuestMissionOfferRow = {
  mission: Mission;
  state: QuestMissionOfferState;
  /** ArcCore AI 자동 등록 의뢰 메타 (신규 의뢰 탭). */
  arcCoreAuto?: {
    instanceId: string;
    categoryTag: ArcCoreInstanceMissionCategoryTag;
    templateMissionId: string;
  };
};

/** @deprecated `QuestMissionOfferRow` */
export type InstanceMissionOfferRow = QuestMissionOfferRow;

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

export function listActiveTutorialStatusRows(
  progresses: Record<string, MissionProgress>,
  activeMissionId: string | null,
): MissionStatusRow[] {
  return listActiveMissionStatusRows(progresses, activeMissionId).filter(
    (row) => isTutorialMissionId(row.mission.id),
  );
}

export function listActiveQuestStatusRows(
  progresses: Record<string, MissionProgress>,
  activeMissionId: string | null,
): MissionStatusRow[] {
  return listActiveMissionStatusRows(progresses, activeMissionId).filter(
    (row) => isQuestMissionId(row.mission.id) || isArcCoreInstanceMissionId(row.mission.id),
  );
}

export function listCompletedTutorialStatusRows(
  progresses: Record<string, MissionProgress>,
): MissionStatusRow[] {
  return listCompletedMissionStatusRows(progresses).filter((row) =>
    isTutorialMissionId(row.mission.id),
  );
}

export function listCompletedQuestStatusRows(
  progresses: Record<string, MissionProgress>,
): MissionStatusRow[] {
  return listCompletedMissionStatusRows(progresses).filter(
    (row) => isQuestMissionId(row.mission.id) || isArcCoreInstanceMissionId(row.mission.id),
  );
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

function resolveQuestOfferState(
  mission: Mission,
  playerLevel: number,
  progress: MissionProgress | undefined,
): QuestMissionOfferState {
  if (progress?.status === 'complete') return 'completed';
  if (progress?.status === 'active') return 'in_progress';
  const required = mission.levelRequired ?? 1;
  if (playerLevel < required) return 'level_locked';
  return 'available';
}

/** 선술집·허브 대화 공용 — 단일 퀘스트 수락 가능 여부 */
export function resolveQuestMissionOfferState(
  mission: Mission,
  playerLevel: number,
  progress: MissionProgress | undefined,
): QuestMissionOfferState {
  return resolveQuestOfferState(mission, playerLevel, progress);
}

/** @deprecated `resolveQuestMissionOfferState` */
export function resolveInstanceMissionOfferState(
  mission: Mission,
  playerLevel: number,
  progress: MissionProgress | undefined,
): QuestMissionOfferState {
  return resolveQuestMissionOfferState(mission, playerLevel, progress);
}

export function pickAvailableQuestMissionIdForCaptain(
  captainId: string,
  planetId: string,
  playerLevel: number,
  progresses: Record<string, MissionProgress>,
): string | null {
  const offers = listTavernQuestOffers(planetId, playerLevel, progresses);
  for (const row of offers) {
    if (row.mission.offerCaptainId !== captainId) continue;
    if (row.state === 'available') return row.mission.id;
  }
  return null;
}

/** @deprecated `pickAvailableQuestMissionIdForCaptain` */
export function pickAvailableInstanceMissionIdForCaptain(
  captainId: string,
  planetId: string,
  playerLevel: number,
  progresses: Record<string, MissionProgress>,
): string | null {
  return pickAvailableQuestMissionIdForCaptain(captainId, planetId, playerLevel, progresses);
}

export function listTavernQuestOffers(
  planetId: string,
  playerLevel: number,
  progresses: Record<string, MissionProgress>,
): QuestMissionOfferRow[] {
  const rows: QuestMissionOfferRow[] = [];
  for (const mission of listQuestMissions()) {
    if (mission.offerPlanetId !== planetId) continue;
    rows.push({
      mission,
      state: resolveQuestOfferState(mission, playerLevel, progresses[mission.id]),
    });
  }

  const boardEntries = useArcCoreInstanceMissionBoardStore.getState().entries;
  for (const entry of boardEntries) {
    if (entry.offerPlanetId !== planetId) continue;
    if (entry.boardStatus !== 'listed') continue;
    const mission = getMissionById(entry.instanceId);
    if (!mission) continue;
    rows.push({
      mission,
      state: resolveQuestOfferState(mission, playerLevel, progresses[entry.instanceId]),
      arcCoreAuto: {
        instanceId: entry.instanceId,
        categoryTag: entry.categoryTag,
        templateMissionId: entry.templateMissionId,
      },
    });
  }

  rows.sort((a, b) => {
    const arcA = a.arcCoreAuto ? 1 : 0;
    const arcB = b.arcCoreAuto ? 1 : 0;
    if (arcA !== arcB) return arcB - arcA;
    const levelA = a.mission.levelRequired ?? 1;
    const levelB = b.mission.levelRequired ?? 1;
    if (levelA !== levelB) return levelA - levelB;
    return a.mission.id.localeCompare(b.mission.id);
  });
  return rows;
}

/** @deprecated `listTavernQuestOffers` */
export function listTavernInstanceMissionOffers(
  planetId: string,
  playerLevel: number,
  progresses: Record<string, MissionProgress>,
): QuestMissionOfferRow[] {
  return listTavernQuestOffers(planetId, playerLevel, progresses);
}

export function countTutorialMissionsInProgress(
  progresses: Record<string, MissionProgress>,
): number {
  let count = 0;
  for (const progress of Object.values(progresses)) {
    if (progress.status !== 'active') continue;
    if (isTutorialMissionId(progress.missionId)) count += 1;
  }
  return count;
}

/** @deprecated `countTutorialMissionsInProgress` */
export function countStoryChainMissionsInProgress(
  progresses: Record<string, MissionProgress>,
): number {
  return countTutorialMissionsInProgress(progresses);
}
