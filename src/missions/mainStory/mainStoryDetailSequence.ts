/**
 * 본편 세부 미션 커서 — 연퀘 스텝 × 순차 목표.
 * 틱/persist 없음. HUD·오퍼만.
 */
import type { MissionProgress } from '../../types';
import { MISSIONS_FROM_CSV } from '../../data/generated/csvMissions';
import { getCurrentSequentialObjective } from '../missionObjectiveSequence';
import {
  getMainStoryChainStepByBindMissionId,
  getMainStoryQuest,
  getMainStoryQuestByBindMissionId,
  listEffectiveMainStoryChainSteps,
} from './mainStoryCatalog';

export type MainQuestDetailCursor = {
  questId: string;
  index1: number;
  total: number;
};

export function resolveMainQuestDetailCursor(
  missionId: string,
  progress: Pick<MissionProgress, 'objectives'>,
): MainQuestDetailCursor | null {
  const step = getMainStoryChainStepByBindMissionId(missionId);
  const quest =
    (step ? getMainStoryQuest(step.parentQuestId) : undefined)
    ?? getMainStoryQuestByBindMissionId(missionId);
  if (!quest) return null;

  const steps = listEffectiveMainStoryChainSteps(quest.questId);
  const ready: { bindId: string; count: number }[] = [];
  for (let i = 0; i < steps.length; i += 1) {
    const row = steps[i]!;
    if (row.contentStatus !== 'ready' || !row.bindMissionId) continue;
    const mission = MISSIONS_FROM_CSV[row.bindMissionId];
    const count = mission && mission.objectives.length > 0 ? mission.objectives.length : 1;
    ready.push({ bindId: row.bindMissionId, count });
  }
  if (ready.length === 0) return null;

  let total = 0;
  for (let i = 0; i < ready.length; i += 1) total += ready[i]!.count;

  let walked = 0;
  for (let i = 0; i < ready.length; i += 1) {
    const row = ready[i]!;
    if (row.bindId !== missionId) {
      walked += row.count;
      continue;
    }
    const mission = MISSIONS_FROM_CSV[missionId];
    let local = 0;
    if (mission && mission.objectives.length > 0) {
      const current = getCurrentSequentialObjective(mission, progress);
      if (current) {
        const idx = mission.objectives.findIndex((obj) => obj.id === current.id);
        local = idx >= 0 ? idx : 0;
      } else {
        local = mission.objectives.length - 1;
      }
    }
    return { questId: quest.questId, index1: walked + local + 1, total };
  }
  return null;
}
