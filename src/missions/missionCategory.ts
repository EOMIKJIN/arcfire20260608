import type { Mission, MissionObjective } from '../types';

/** objectives 조합으로 파생 — 미션 id 하드코딩 없음. */
export type MissionPlayCategory = 'combat' | 'delivery' | 'travel' | 'event' | 'mixed';

function hasObjectiveType(objectives: MissionObjective[], type: MissionObjective['type']): boolean {
  for (let i = 0; i < objectives.length; i += 1) {
    if (objectives[i].type === type) return true;
  }
  return false;
}

export function deriveMissionPlayCategory(mission: Pick<Mission, 'objectives'>): MissionPlayCategory {
  const { objectives } = mission;
  const defeat = hasObjectiveType(objectives, 'defeat_enemy');
  const buy = hasObjectiveType(objectives, 'buy_goods');
  const reachSystem = hasObjectiveType(objectives, 'reach_system');
  const reachPlanet = hasObjectiveType(objectives, 'reach_planet');
  const deliver = hasObjectiveType(objectives, 'deliver_cargo');
  const eventLike = hasObjectiveType(objectives, 'deliver_cargo'); // v2: talk_npc 등 확장 시 여기 병합

  if (defeat && !buy && !reachSystem && !reachPlanet && !deliver) return 'combat';
  if (buy && reachSystem) return 'delivery';
  if (deliver) return 'delivery';
  if (reachPlanet || reachSystem) return 'travel';
  if (eventLike) return 'event';

  const flags = [defeat, buy, reachSystem, reachPlanet, deliver].filter(Boolean).length;
  if (flags > 1) return 'mixed';
  return 'mixed';
}

export function missionHasIncompleteDefeatEnemy(
  mission: Mission,
  progressObjectives: Record<string, boolean>,
): boolean {
  return mission.objectives.some(
    (obj) => obj.type === 'defeat_enemy' && progressObjectives[obj.id] !== true,
  );
}
