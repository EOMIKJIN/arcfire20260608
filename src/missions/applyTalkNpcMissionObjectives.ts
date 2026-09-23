import { useMissionStore } from '../store/missionStore';
import { resolveCurrentTalkNpcAt } from './talkNpcObjective';

/** 대화 종료 1회. persist는 completeObjective만. */
export function applyTalkNpcMissionObjectives(captainId: string, planetId: string): void {
  const talk = resolveCurrentTalkNpcAt(planetId, captainId);
  if (!talk) return;
  useMissionStore.getState().completeObjective(talk.missionId, talk.objectiveId);
}
