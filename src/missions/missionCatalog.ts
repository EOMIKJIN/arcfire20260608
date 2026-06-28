import { Mission } from '../types';
import { MISSIONS_FROM_CSV } from '../data/generated';

export {
  FIRST_TUTORIAL_MISSION_ID,
  FIRST_MISSION_ID,
  isTutorialMissionId,
  isQuestMissionId,
  isStoryMissionId,
  isInstanceMissionId,
  listTutorialMissions,
  listQuestMissions,
  listStoryMissions,
  listInstanceMissions,
  resolveMissionTrack,
  type MissionTrack,
} from './missionTrack';

/** Table-First 정본: `missions.csv` → `MISSIONS_FROM_CSV` 단일 소스. */
export function getMissionById(missionId: string): Mission | undefined {
  return MISSIONS_FROM_CSV[missionId];
}

export function listAllMissions(): Mission[] {
  return Object.values(MISSIONS_FROM_CSV);
}
