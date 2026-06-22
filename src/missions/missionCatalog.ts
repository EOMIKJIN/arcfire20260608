import { Mission } from '../types';
import { MISSIONS_FROM_CSV } from '../data/generated';

/** 스토리 체인 시작 id — `tables/content/missions.csv` 정본과 동기. */
export const FIRST_MISSION_ID = 'mission_001';

/** Table-First 정본: `missions.csv` → `MISSIONS_FROM_CSV` 단일 소스. */
export function getMissionById(missionId: string): Mission | undefined {
  return MISSIONS_FROM_CSV[missionId];
}

export function listAllMissions(): Mission[] {
  return Object.values(MISSIONS_FROM_CSV);
}

export function isInstanceMissionId(missionId: string): boolean {
  return missionId.startsWith('sandbox_');
}

export function isStoryMissionId(missionId: string): boolean {
  return missionId.startsWith('mission_');
}

export function listInstanceMissions(): Mission[] {
  const out: Mission[] = [];
  for (const mission of Object.values(MISSIONS_FROM_CSV)) {
    if (isInstanceMissionId(mission.id)) out.push(mission);
  }
  return out;
}

export function listStoryMissions(): Mission[] {
  const out: Mission[] = [];
  for (const mission of Object.values(MISSIONS_FROM_CSV)) {
    if (isStoryMissionId(mission.id)) out.push(mission);
  }
  return out;
}
