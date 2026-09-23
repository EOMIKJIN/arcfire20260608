import type { MissionProgress } from '../../types';
import { formatMainStoryQuestId, MAIN_STORY_CHAPTER_COUNT } from './mainStoryIds';
import {
  getMainStoryChapter,
  getMainStoryChainStepByBindMissionId,
  getMainStoryQuest,
  getMainStoryQuestByBindMissionId,
  listEffectiveMainStoryChainSteps,
  listMainStoryBranchesFrom,
  listMainStoryChapters,
  listMainStorySpineQuests,
} from './mainStoryCatalog';
import type { MainStoryAfterMissionComplete, MainStoryNextResolve, MainStoryQuestRow } from './mainStoryTypes';

function isMissionComplete(
  progresses: Record<string, MissionProgress>,
  missionId: string | null | undefined,
): boolean {
  if (!missionId) return false;
  return progresses[missionId]?.status === 'complete';
}

function isQuestComplete(
  quest: MainStoryQuestRow,
  progresses: Record<string, MissionProgress>,
): boolean {
  const steps = listEffectiveMainStoryChainSteps(quest.questId);
  if (steps.length === 0) return false;
  for (const step of steps) {
    if (step.contentStatus !== 'ready' || !step.bindMissionId) return false;
    if (!isMissionComplete(progresses, step.bindMissionId)) return false;
  }
  return true;
}

function firstIncompleteReadyBindMissionId(
  questId: string,
  progresses: Record<string, MissionProgress>,
): string | null {
  const steps = listEffectiveMainStoryChainSteps(questId);
  for (const step of steps) {
    if (step.contentStatus !== 'ready' || !step.bindMissionId) continue;
    if (!isMissionComplete(progresses, step.bindMissionId)) return step.bindMissionId;
  }
  return null;
}

export function mainStoryBranchConditionMatches(
  conditionKind: string,
  conditionValue: string,
  flags: Readonly<Record<string, string>>,
): boolean {
  if (conditionKind === 'always') return true;
  if (conditionKind === 'flag') {
    const key = conditionValue.trim();
    if (!key) return false;
    const v = flags[key];
    return v === '1' || v === 'true';
  }
  return false;
}

export function pickEnabledMainStoryBranch(
  branches: readonly { enabled: boolean; conditionKind: string; conditionValue: string }[],
  flags: Readonly<Record<string, string>>,
): number {
  for (let i = 0; i < branches.length; i += 1) {
    const branch = branches[i]!;
    if (!branch.enabled) continue;
    if (!mainStoryBranchConditionMatches(branch.conditionKind, branch.conditionValue, flags)) {
      continue;
    }
    return i;
  }
  return -1;
}

function resolveDefaultNextQuestId(quest: MainStoryQuestRow): {
  nextQuestId: string | null;
  chapterEnded: boolean;
  campaignEnded: boolean;
} {
  const chapter = getMainStoryChapter(quest.chapterId);
  if (!chapter) return { nextQuestId: null, chapterEnded: false, campaignEnded: false };

  if (quest.questKind === 'spine' && !quest.isChapterCloser) {
    const spine = listMainStorySpineQuests(quest.chapterId);
    const idx = spine.findIndex((row) => row.questId === quest.questId);
    const next = idx >= 0 ? spine[idx + 1] : undefined;
    return { nextQuestId: next?.questId ?? null, chapterEnded: false, campaignEnded: false };
  }

  if (quest.questKind === 'spine' && quest.isChapterCloser) {
    const order = chapter.order;
    if (order >= MAIN_STORY_CHAPTER_COUNT) {
      return { nextQuestId: null, chapterEnded: true, campaignEnded: true };
    }
    return {
      nextQuestId: formatMainStoryQuestId(order + 1, 1),
      chapterEnded: true,
      campaignEnded: false,
    };
  }

  return { nextQuestId: null, chapterEnded: false, campaignEnded: false };
}

export function resolveMainStoryNextQuest(
  fromQuestId: string,
  flags: Readonly<Record<string, string>> = {},
): MainStoryNextResolve {
  const quest = getMainStoryQuest(fromQuestId);
  if (!quest) {
    return {
      fromQuestId,
      nextQuestId: null,
      reason: 'awaiting_content',
      chapterEnded: false,
      campaignEnded: false,
      usedBranchId: null,
    };
  }

  const branches = listMainStoryBranchesFrom(fromQuestId);
  const picked = pickEnabledMainStoryBranch(branches, flags);
  if (picked >= 0) {
    const branch = branches[picked]!;
    return {
      fromQuestId,
      nextQuestId: branch.toQuestId,
      reason: 'branch',
      chapterEnded: false,
      campaignEnded: false,
      usedBranchId: branch.id,
    };
  }

  const def = resolveDefaultNextQuestId(quest);
  if (def.campaignEnded) {
    return {
      fromQuestId,
      nextQuestId: null,
      reason: 'campaign_end',
      chapterEnded: true,
      campaignEnded: true,
      usedBranchId: null,
    };
  }
  if (def.chapterEnded) {
    return {
      fromQuestId,
      nextQuestId: def.nextQuestId,
      reason: 'chapter_end',
      chapterEnded: true,
      campaignEnded: false,
      usedBranchId: null,
    };
  }
  return {
    fromQuestId,
    nextQuestId: def.nextQuestId,
    reason: def.nextQuestId ? 'default' : 'awaiting_content',
    chapterEnded: false,
    campaignEnded: false,
    usedBranchId: null,
  };
}

/** 본선 순서대로 첫 미완료 퀘스트. 분기로 빠진 완료 퀘는 next 해석으로 따라감. */
export function resolveCurrentMainStoryQuest(
  progresses: Record<string, MissionProgress>,
  flags: Readonly<Record<string, string>> = {},
): MainStoryQuestRow | null {
  const firstChapter = listMainStoryChapters()[0];
  if (!firstChapter) return null;
  const firstSpine = listMainStorySpineQuests(firstChapter.id)[0];
  if (!firstSpine) return null;

  let cursor: MainStoryQuestRow | undefined = firstSpine;
  const seen = new Set<string>();
  while (cursor && !seen.has(cursor.questId)) {
    seen.add(cursor.questId);
    if (!isQuestComplete(cursor, progresses)) return cursor;
    const next = resolveMainStoryNextQuest(cursor.questId, flags);
    if (!next.nextQuestId) return null;
    cursor = getMainStoryQuest(next.nextQuestId);
  }
  return cursor ?? null;
}

export function resolveCurrentMainStoryOfferMissionId(
  progresses: Record<string, MissionProgress>,
  flags: Readonly<Record<string, string>> = {},
): string | null {
  const quest = resolveCurrentMainStoryQuest(progresses, flags);
  if (!quest || quest.contentStatus !== 'ready') return null;
  return firstIncompleteReadyBindMissionId(quest.questId, progresses);
}

export function resolveMainStoryAfterBindMissionComplete(
  missionId: string,
  progresses: Record<string, MissionProgress>,
  flags: Readonly<Record<string, string>> = {},
): MainStoryAfterMissionComplete {
  const empty: MainStoryAfterMissionComplete = {
    completedQuestId: null,
    completedStepId: null,
    nextBindMissionId: null,
    nextQuestId: null,
    chapterEnded: false,
    campaignEnded: false,
    pendingChapterEndSceneId: null,
  };

  const step = getMainStoryChainStepByBindMissionId(missionId);
  const quest =
    (step ? getMainStoryQuest(step.parentQuestId) : undefined) ??
    getMainStoryQuestByBindMissionId(missionId);
  if (!quest) return empty;

  const steps = listEffectiveMainStoryChainSteps(quest.questId);
  const stepIdx = steps.findIndex((row) => row.bindMissionId === missionId);
  if (stepIdx >= 0 && stepIdx < steps.length - 1) {
    const nextStep = steps[stepIdx + 1];
    return {
      completedQuestId: null,
      completedStepId: steps[stepIdx]?.stepId ?? step?.stepId ?? null,
      nextBindMissionId:
        nextStep?.contentStatus === 'ready' ? nextStep.bindMissionId : null,
      nextQuestId: quest.questId,
      chapterEnded: false,
      campaignEnded: false,
      pendingChapterEndSceneId: null,
    };
  }

  if (!isQuestComplete(quest, progresses)) {
    return {
      ...empty,
      completedStepId: step?.stepId ?? null,
    };
  }

  const next = resolveMainStoryNextQuest(quest.questId, flags);
  const chapter = getMainStoryChapter(quest.chapterId);
  const pendingChapterEndSceneId =
    next.chapterEnded && chapter?.endStoryReady ? chapter.endStorySceneId : null;
  const nextQuest = next.nextQuestId ? getMainStoryQuest(next.nextQuestId) : undefined;

  return {
    completedQuestId: quest.questId,
    completedStepId: steps[stepIdx]?.stepId ?? step?.stepId ?? null,
    nextBindMissionId: nextQuest
      ? firstIncompleteReadyBindMissionId(nextQuest.questId, progresses)
      : null,
    nextQuestId: next.nextQuestId,
    chapterEnded: next.chapterEnded,
    campaignEnded: next.campaignEnded,
    pendingChapterEndSceneId,
  };
}

export function resolveChapterEndIntroHref(chapterId: string): string | null {
  const chapter = getMainStoryChapter(chapterId);
  if (!chapter?.endStoryReady || !chapter.endStorySceneId) return null;
  return `/(game)/intro?sceneId=${chapter.endStorySceneId}&flow=chapterEnd`;
}
