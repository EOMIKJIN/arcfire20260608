/**
 * `__neighbor_system__` — 인접 성계 배달/이동.
 * 대표님 정본: 특정 성계가 아니라 출발 성계가 아닌 아무 성계 착륙이면 완료.
 * 순수 함수 — galaxy/CSV I/O 없음.
 */
import type { Mission, MissionObjective } from '../types';
import { ARC_CORE_INSTANCE_MISSION_ID_PREFIX } from './arcCoreInstanceMissionTypes';

/** `arcCoreInstanceMissionPlanetContext.BAR_INSTANCE_NEIGHBOR_SYSTEM_PLACEHOLDER` 와 동일 */
const NEIGHBOR_SYSTEM_PLACEHOLDER = '__neighbor_system__';

export function isNeighborSystemPlaceholder(targetId: string): boolean {
  return targetId === NEIGHBOR_SYSTEM_PLACEHOLDER;
}

/** 이 reach_system 목표가 「아무 성계(출발지 제외)」 완료인지 */
export function isAnyNeighborReachObjective(
  missionId: string,
  obj: Pick<MissionObjective, 'type' | 'targetId'>,
): boolean {
  if (obj.type !== 'reach_system') return false;
  if (isNeighborSystemPlaceholder(obj.targetId)) return true;
  return missionId.startsWith(ARC_CORE_INSTANCE_MISSION_ID_PREFIX);
}

export function isAnyNeighborReachMission(mission: Pick<Mission, 'id' | 'objectives'>): boolean {
  const objs = mission.objectives;
  for (let i = 0; i < objs.length; i += 1) {
    if (isAnyNeighborReachObjective(mission.id, objs[i]!)) return true;
  }
  return false;
}

export function doesReachSystemObjectiveMatch(
  mission: Pick<Mission, 'id' | 'objectives'>,
  obj: Pick<MissionObjective, 'type' | 'targetId'>,
  landedSystemId: string,
  originSystemId: string | null,
): boolean {
  if (obj.type !== 'reach_system') return false;
  const landed = landedSystemId.trim();
  if (!landed) return false;
  if (isAnyNeighborReachObjective(mission.id, obj)) {
    const origin = originSystemId?.trim() ?? '';
    if (!origin) return false;
    return landed !== origin;
  }
  return obj.targetId === landed;
}
