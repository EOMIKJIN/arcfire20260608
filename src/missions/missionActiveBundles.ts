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
