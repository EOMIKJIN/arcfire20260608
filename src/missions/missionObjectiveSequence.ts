import type { Mission, MissionObjective, MissionProgress } from '../types';

/** CSV 행 순서. 앞 목표가 끝나야 다음 목표를 완료할 수 있다. */
export function getCurrentSequentialObjective(
  mission: Pick<Mission, 'objectives'>,
  progress: Pick<MissionProgress, 'objectives'>,
): MissionObjective | undefined {
  const objs = mission.objectives;
  for (let i = 0; i < objs.length; i += 1) {
    const obj = objs[i]!;
    if (!progress.objectives[obj.id]) return obj;
  }
  return undefined;
}

export function canCompleteSequentialObjective(
  mission: Pick<Mission, 'objectives'>,
  progress: Pick<MissionProgress, 'objectives'>,
  objectiveId: string,
): boolean {
  const objs = mission.objectives;
  for (let i = 0; i < objs.length; i += 1) {
    const obj = objs[i]!;
    if (obj.id === objectiveId) return true;
    if (!progress.objectives[obj.id]) return false;
  }
  return false;
}
