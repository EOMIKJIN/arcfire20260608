/**
 * 본편 메인스토리 골격 카탈로그 — 부트 1회 인덱스.
 * 틱/렌더에서 CSV 재파싱·전량 rebuild 금지.
 */
import {
  MAIN_STORY_BRANCHES_FROM_CSV,
  MAIN_STORY_CHAPTERS_FROM_CSV,
  MAIN_STORY_CHAIN_STEPS_FROM_CSV,
  MAIN_STORY_QUESTS_FROM_CSV,
} from '../../data/generated/csvMainStorySpine';
import type {
  MainStoryBranchRow,
  MainStoryChapterRow,
  MainStoryChainStepRow,
  MainStoryQuestRow,
} from './mainStoryTypes';

let chaptersById: Map<string, MainStoryChapterRow> | null = null;
let questsById: Map<string, MainStoryQuestRow> | null = null;
let questByBindMissionId: Map<string, MainStoryQuestRow> | null = null;
let spineByChapterId: Map<string, MainStoryQuestRow[]> | null = null;
let branchesByFromQuestId: Map<string, MainStoryBranchRow[]> | null = null;
let stepsByParentQuestId: Map<string, MainStoryChainStepRow[]> | null = null;
let stepByBindMissionId: Map<string, MainStoryChainStepRow> | null = null;

function ensureIndexes(): void {
  if (chaptersById) return;

  chaptersById = new Map();
  for (const row of MAIN_STORY_CHAPTERS_FROM_CSV) chaptersById.set(row.id, row);

  questsById = new Map();
  questByBindMissionId = new Map();
  spineByChapterId = new Map();
  for (const row of MAIN_STORY_QUESTS_FROM_CSV) {
    questsById.set(row.questId, row);
    if (row.bindMissionId) questByBindMissionId.set(row.bindMissionId, row);
    if (row.questKind !== 'spine') continue;
    const list = spineByChapterId.get(row.chapterId) ?? [];
    list.push(row);
    spineByChapterId.set(row.chapterId, list);
  }
  for (const list of spineByChapterId.values()) {
    list.sort((a, b) => a.questIndex - b.questIndex);
  }

  branchesByFromQuestId = new Map();
  for (const row of MAIN_STORY_BRANCHES_FROM_CSV) {
    const list = branchesByFromQuestId.get(row.fromQuestId) ?? [];
    list.push(row);
    branchesByFromQuestId.set(row.fromQuestId, list);
  }
  for (const list of branchesByFromQuestId.values()) {
    list.sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));
  }

  stepsByParentQuestId = new Map();
  stepByBindMissionId = new Map();
  for (const row of MAIN_STORY_CHAIN_STEPS_FROM_CSV) {
    const list = stepsByParentQuestId.get(row.parentQuestId) ?? [];
    list.push(row);
    stepsByParentQuestId.set(row.parentQuestId, list);
    if (row.bindMissionId) stepByBindMissionId.set(row.bindMissionId, row);
  }
  for (const list of stepsByParentQuestId.values()) {
    list.sort((a, b) => a.stepIndex - b.stepIndex);
  }
}

export function listMainStoryChapters(): readonly MainStoryChapterRow[] {
  return MAIN_STORY_CHAPTERS_FROM_CSV;
}

export function getMainStoryChapter(chapterId: string): MainStoryChapterRow | undefined {
  ensureIndexes();
  return chaptersById!.get(chapterId);
}

export function getMainStoryQuest(questId: string): MainStoryQuestRow | undefined {
  ensureIndexes();
  return questsById!.get(questId);
}

export function getMainStoryQuestByBindMissionId(missionId: string): MainStoryQuestRow | undefined {
  ensureIndexes();
  return questByBindMissionId!.get(missionId);
}

export function listMainStorySpineQuests(chapterId: string): readonly MainStoryQuestRow[] {
  ensureIndexes();
  return spineByChapterId!.get(chapterId) ?? [];
}

export function listMainStoryBranchesFrom(questId: string): readonly MainStoryBranchRow[] {
  ensureIndexes();
  return branchesByFromQuestId!.get(questId) ?? [];
}

export function listMainStoryChainSteps(questId: string): readonly MainStoryChainStepRow[] {
  ensureIndexes();
  return stepsByParentQuestId!.get(questId) ?? [];
}

export function getMainStoryChainStepByBindMissionId(
  missionId: string,
): MainStoryChainStepRow | undefined {
  ensureIndexes();
  return stepByBindMissionId!.get(missionId);
}

/** 연퀘 스텝이 있으면 그것, 없으면 quest.bindMissionId 1스텝. */
export function listEffectiveMainStoryChainSteps(questId: string): readonly MainStoryChainStepRow[] {
  const steps = listMainStoryChainSteps(questId);
  if (steps.length > 0) return steps;
  const quest = getMainStoryQuest(questId);
  if (!quest?.bindMissionId) return [];
  return [
    {
      parentQuestId: quest.questId,
      stepIndex: 1,
      stepId: `${quest.questId}_s01`,
      bindMissionId: quest.bindMissionId,
      contentStatus: quest.contentStatus,
      stepKind: 'mission',
      titlePlaceholderKo: quest.titlePlaceholderKo,
      titlePlaceholderEn: quest.titlePlaceholderEn,
    },
  ];
}

export function isMainStoryQuestContentReady(quest: MainStoryQuestRow): boolean {
  return quest.contentStatus === 'ready';
}
