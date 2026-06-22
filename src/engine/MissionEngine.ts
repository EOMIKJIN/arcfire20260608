// ============================================================
// 아크파이어 온라인 - 미션 엔진
// ============================================================

import { Mission, MissionProgress, MissionObjective } from '../types';
import { getMissionById } from '../missions/missionCatalog';

/** 미션 목표 달성 체크 */
export function checkObjective(
  objective: MissionObjective,
  eventType: MissionObjective['type'],
  targetId: string,
  quantity: number = 1,
): boolean {
  if (objective.complete) return true;
  if (objective.type !== eventType) return false;
  if (objective.targetId !== targetId) return false;
  if (objective.quantity && quantity < objective.quantity) return false;
  return true;
}

/** 미션 전체 완료 여부 */
export function isMissionComplete(
  mission: Mission,
  progress: MissionProgress,
): boolean {
  return mission.objectives.every(obj => progress.objectives[obj.id] === true);
}

/** 다음 미션 ID 반환 */
export function getNextMission(missionId: string): string | null {
  return getMissionById(missionId)?.nextMissionId ?? null;
}

/** 미션 사용 가능 여부 (선행 미션 완료 체크) */
export function isMissionAvailable(
  mission: Mission,
  completedMissionIds: string[],
): boolean {
  return mission.prerequisiteIds.every(id => completedMissionIds.includes(id));
}

/** 목표 업데이트 후 progress 반환 */
export function updateObjective(
  progress: MissionProgress,
  objectiveId: string,
): MissionProgress {
  return {
    ...progress,
    objectives: {
      ...progress.objectives,
      [objectiveId]: true,
    },
  };
}

/** 초기 미션 progress 생성 */
export function createMissionProgress(missionId: string): MissionProgress {
  const mission = getMissionById(missionId);
  if (!mission) throw new Error(`Mission not found: ${missionId}`);

  const objectives: Record<string, boolean> = {};
  mission.objectives.forEach(obj => { objectives[obj.id] = false; });

  return {
    missionId,
    status: 'active',
    objectives,
    startedAt: Date.now(),
  };
}
