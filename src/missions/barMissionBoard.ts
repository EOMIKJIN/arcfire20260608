import type { Mission, MissionProgress } from '../types';
import type { ClearedArcInstSnapshot } from './arcCoreInstanceProgressCleanup';
import {
  buildClearedArcInstHistoryRow,
  mergeClearedArcInstHistoryRows,
} from './clearedArcInstHistory';
import {
  getMissionById,
  isMainStoryMissionId,
  isQuestMissionId,
  isTutorialMissionId,
  listQuestMissions,
} from './missionCatalog';
import { isMissionAvailable } from '../engine/MissionEngine';
import { isArcCoreInstanceMissionId } from './arcCoreInstanceMissionResolver';
import { isUnidentifiedAnomalyMissionId } from './unidentifiedAnomaly/unidentifiedAnomalyIds';
import { useArcCoreInstanceMissionBoardStore } from '../store/arcCoreInstanceMissionBoardStore';
import { useMainStoryProgressStore } from '../store/mainStoryProgressStore';
import { resolveCurrentMainStoryOfferMissionId } from './mainStory/resolveMainStoryProgression';
import type { ArcCoreInstanceMissionCategoryTag } from './arcCoreInstanceMissionTypes';
import type { BarInstanceMissionDifficultyTier } from './barInstanceMissionDifficulty';

export type BarBoardTab = 'lounge' | 'perform' | 'board' | 'mission_status' | 'new_missions';

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
    registeredAtMs: number;
    difficultyTier?: BarInstanceMissionDifficultyTier;
    difficultyScore?: number;
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

export function listActiveMainStoryStatusRows(
  progresses: Record<string, MissionProgress>,
  activeMissionId: string | null,
): MissionStatusRow[] {
  return listActiveMissionStatusRows(progresses, activeMissionId).filter((row) =>
    isMainStoryMissionId(row.mission.id),
  );
}

export function listActiveQuestStatusRows(
  progresses: Record<string, MissionProgress>,
  activeMissionId: string | null,
): MissionStatusRow[] {
  return listActiveMissionStatusRows(progresses, activeMissionId).filter(
    (row) =>
      isQuestMissionId(row.mission.id)
      || isArcCoreInstanceMissionId(row.mission.id)
      || isUnidentifiedAnomalyMissionId(row.mission.id),
  );
}

export function listCompletedTutorialStatusRows(
  progresses: Record<string, MissionProgress>,
): MissionStatusRow[] {
  return listCompletedMissionStatusRows(progresses).filter((row) =>
    isTutorialMissionId(row.mission.id),
  );
}

export function listCompletedMainStoryStatusRows(
  progresses: Record<string, MissionProgress>,
): MissionStatusRow[] {
  return listCompletedMissionStatusRows(progresses).filter((row) =>
    isMainStoryMissionId(row.mission.id),
  );
}

export function listCompletedQuestStatusRows(
  progresses: Record<string, MissionProgress>,
  snapshots?: readonly ClearedArcInstSnapshot[],
): MissionStatusRow[] {
  const rows = listCompletedMissionStatusRows(progresses).filter(
    (row) =>
      isQuestMissionId(row.mission.id)
      || isArcCoreInstanceMissionId(row.mission.id)
      || isUnidentifiedAnomalyMissionId(row.mission.id),
  );
  mergeClearedArcInstHistoryRows(rows, snapshots, buildClearedArcInstHistoryRow);
  rows.sort((a, b) => (b.progress.completedAt ?? 0) - (a.progress.completedAt ?? 0));
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

/** 바·허브 대화 공용 — 단일 퀘스트 수락 가능 여부 */
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
  const offers = listBarQuestOffers(planetId, playerLevel, progresses);
  for (const row of offers) {
    if (row.mission.offerCaptainId !== captainId) continue;
    if (row.state === 'available') return row.mission.id;
  }
  return null;
}

/** 이 행성에서 수락 가능한 sandbox 의뢰 함장 — 바 닫혀도 INFO/대화 핀용. 상한 4. */
export function listAvailableQuestOfferCaptainIds(
  planetId: string,
  playerLevel: number,
  progresses: Record<string, MissionProgress>,
): string[] {
  const offers = listBarQuestOffers(planetId, playerLevel, progresses);
  const ids: string[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < offers.length; i += 1) {
    const row = offers[i]!;
    if (row.state !== 'available') continue;
    const id = String(row.mission.offerCaptainId ?? '').trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
    if (ids.length >= 4) break;
  }
  return ids;
}

/** 허브 [대화] — 메인 스토리(story_*) 수락 가능 id (함장·행성 매칭) */
export function pickAvailableMainStoryMissionIdForCaptain(
  captainId: string,
  planetId: string,
  playerLevel: number,
  progresses: Record<string, MissionProgress>,
): string | null {
  const offer = pickAvailableMainStoryOfferForPlanet(planetId, playerLevel, progresses);
  if (!offer) return null;
  if (offer.offerCaptainId !== captainId) return null;
  return offer.missionId;
}

/** 행성 허브 [대화] — 궤도 가시 여부와 무관하게 수락 가능한 메인 스토리 제안 */
export function pickAvailableMainStoryOfferForPlanet(
  planetId: string,
  playerLevel: number,
  progresses: Record<string, MissionProgress>,
): { missionId: string; offerCaptainId: string } | null {
  const openId = resolveCurrentMainStoryOfferMissionId(
    progresses,
    useMainStoryProgressStore.getState().choiceFlags,
  );
  if (!openId) return null;
  const mission = getMissionById(openId);
  if (!mission?.offerCaptainId) return null;
  if (mission.offerPlanetId && mission.offerPlanetId !== planetId) return null;
  const completedIds = Object.values(progresses)
    .filter((row) => row.status === 'complete')
    .map((row) => row.missionId);
  const state = resolveQuestOfferState(mission, playerLevel, progresses[mission.id]);
  if (state !== 'available') return null;
  if (!isMissionAvailable(mission, completedIds)) return null;
  return { missionId: mission.id, offerCaptainId: mission.offerCaptainId };
}

/** @deprecated `pickAvailableMainStoryOfferForPlanet` */
export function pickAvailableMainStoryMissionIdForPlanet(
  planetId: string,
  playerLevel: number,
  progresses: Record<string, MissionProgress>,
): string | null {
  return pickAvailableMainStoryOfferForPlanet(planetId, playerLevel, progresses)?.missionId ?? null;
}

/** 메인 스토리 제안 인게임 씬 id 관례 — `story_dialog_{missionId}` */
export function resolveMainStoryOfferDialogSceneId(missionId: string): string {
  return `story_dialog_${missionId}`;
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

export function listBarQuestOffers(
  planetId: string,
  playerLevel: number,
  progresses: Record<string, MissionProgress>,
): QuestMissionOfferRow[] {
  const rows: QuestMissionOfferRow[] = [];
  for (const mission of listQuestMissions()) {
    if (mission.objectives.length === 0) continue;
    if (mission.offerPlanetId !== planetId) continue;
    rows.push({
      mission,
      state: resolveQuestOfferState(mission, playerLevel, progresses[mission.id]),
    });
  }

  const boardEntries = useArcCoreInstanceMissionBoardStore.getState().entries;
  const seenInstanceIds = new Set<string>();
  for (const entry of boardEntries) {
    if (entry.offerPlanetId !== planetId) continue;
    if (entry.boardStatus !== 'listed') continue;
    if (seenInstanceIds.has(entry.instanceId)) continue;
    seenInstanceIds.add(entry.instanceId);
    const mission = getMissionById(entry.instanceId);
    if (!mission) continue;
    rows.push({
      mission,
      state: resolveQuestOfferState(mission, playerLevel, progresses[entry.instanceId]),
      arcCoreAuto: {
        instanceId: entry.instanceId,
        categoryTag: entry.categoryTag,
        templateMissionId: entry.templateMissionId,
        registeredAtMs: entry.registeredAtMs,
        difficultyTier: mission.instanceDifficultyTier,
        difficultyScore: mission.instanceDifficultyScore,
      },
    });
  }

  rows.sort((a, b) => {
    const tsA = a.arcCoreAuto?.registeredAtMs ?? 0;
    const tsB = b.arcCoreAuto?.registeredAtMs ?? 0;
    if (tsA !== tsB) return tsB - tsA;
    if (a.arcCoreAuto && !b.arcCoreAuto) return -1;
    if (!a.arcCoreAuto && b.arcCoreAuto) return 1;
    const levelA = a.mission.levelRequired ?? 1;
    const levelB = b.mission.levelRequired ?? 1;
    if (levelA !== levelB) return levelA - levelB;
    return a.mission.id.localeCompare(b.mission.id);
  });
  return rows;
}

/** @deprecated `listBarQuestOffers` */
export function listBarInstanceMissionOffers(
  planetId: string,
  playerLevel: number,
  progresses: Record<string, MissionProgress>,
): QuestMissionOfferRow[] {
  return listBarQuestOffers(planetId, playerLevel, progresses);
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
