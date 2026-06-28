import type { Mission, MissionObjective, MissionProgress } from '../types';
import { getMissionById } from './missionCatalog';

export type MissionActiveBundle = {
  mission: Mission;
  progress: MissionProgress;
};

export function listActiveMissionBundles(
  progresses: Record<string, MissionProgress>,
): MissionActiveBundle[] {
  const rows: MissionActiveBundle[] = [];
  for (const progress of Object.values(progresses)) {
    if (progress.status !== 'active') continue;
    const mission = getMissionById(progress.missionId);
    if (!mission) continue;
    rows.push({ mission, progress });
  }
  return rows;
}

export function findFirstIncompleteObjective(
  bundles: MissionActiveBundle[],
  type: MissionObjective['type'],
): { bundle: MissionActiveBundle; objective: MissionObjective } | null {
  for (const bundle of bundles) {
    for (const objective of bundle.mission.objectives) {
      if (objective.type !== type) continue;
      if (bundle.progress.objectives[objective.id] === true) continue;
      return { bundle, objective };
    }
  }
  return null;
}

export function forEachIncompleteObjective(
  bundles: MissionActiveBundle[],
  type: MissionObjective['type'],
  visit: (bundle: MissionActiveBundle, objective: MissionObjective) => void,
): void {
  for (const bundle of bundles) {
    for (const objective of bundle.mission.objectives) {
      if (objective.type !== type) continue;
      if (bundle.progress.objectives[objective.id] === true) continue;
      visit(bundle, objective);
    }
  }
}

export function hasAnyActiveCombatMission(
  progresses: Record<string, MissionProgress>,
): boolean {
  return listActiveMissionBundles(progresses).some(
    (row) => row.mission.objectives.some(
      (obj) => obj.type === 'defeat_enemy' && row.progress.objectives[obj.id] !== true,
    ),
  );
}

/** 월드맵 transit — QuestHUD 주 미션(`activeMissionId`) 전투만 확률 보정 */
export function hasPrimaryActiveCombatMission(
  progresses: Record<string, MissionProgress>,
  activeMissionId: string | null | undefined,
): boolean {
  if (!activeMissionId) return false;
  const progress = progresses[activeMissionId];
  if (!progress || progress.status !== 'active') return false;
  const mission = getMissionById(activeMissionId);
  if (!mission) return false;
  return mission.objectives.some(
    (obj) => obj.type === 'defeat_enemy' && progress.objectives[obj.id] !== true,
  );
}
