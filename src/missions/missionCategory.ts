import type { Mission, MissionObjective } from '../types';

/** objectives 조합으로 파생 — 미션 id 하드코딩 없음. */
export type MissionPlayCategory = 'combat' | 'delivery' | 'travel' | 'event' | 'mixed';

function hasObjectiveType(objectives: MissionObjective[], type: MissionObjective['type']): boolean {
  for (let i = 0; i < objectives.length; i += 1) {
    if (objectives[i].type === type) return true;
  }
  return false;
}

/**
 * 배송 의뢰 — 성계 도착이 아니라 행성 허브 착륙에서 reach_system 완료.
 * `type=delivery` 또는 목표 조합이 delivery(구매+항행 / deliver_cargo).
 */
export function isDeliveryHubLandingMission(
  mission: Pick<Mission, 'type' | 'objectives'>,
): boolean {
  if (mission.type === 'delivery') return true;
  return deriveMissionPlayCategory(mission) === 'delivery';
}

export type ReachSystemApplyGate = 'system_arrival' | 'hub_landing';

/**
 * reach_system 은 행성 허브 착륙에서만 완료. 성계 도착은 연출만.
 * 향후 지도 이동 전용 퀘스트가 필요하면 `_mission` 분기를 여기 추가한다.
 */
export function shouldApplyReachSystemObjective(
  _mission: Pick<Mission, 'type' | 'objectives'>,
  gate: ReachSystemApplyGate,
): boolean {
  return gate === 'hub_landing';
}

export function deriveMissionPlayCategory(mission: Pick<Mission, 'objectives'>): MissionPlayCategory {
  const { objectives } = mission;
  const defeat = hasObjectiveType(objectives, 'defeat_enemy');
  const buy = hasObjectiveType(objectives, 'buy_goods');
  const reachSystem = hasObjectiveType(objectives, 'reach_system');
  const reachPlanet = hasObjectiveType(objectives, 'reach_planet');
  const deliver = hasObjectiveType(objectives, 'deliver_cargo');
  const talk = hasObjectiveType(objectives, 'talk_npc');
  const eventLike =
    talk
    || hasObjectiveType(objectives, 'deliver_cargo')
    || hasObjectiveType(objectives, 'collect_item');

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
