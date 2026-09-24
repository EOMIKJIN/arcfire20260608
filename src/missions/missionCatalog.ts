import { Mission } from '../types';
import { MISSIONS_FROM_CSV } from '../data/generated';
import { getArcCoreInstanceMaterializedMission, isArcCoreInstanceMissionId } from './arcCoreInstanceMissionResolver';
import { isCaptainPersonalMissionId } from './captainPersonalMissionIds';
import { getCaptainPersonalMaterializedMission } from './captainPersonalMissionResolver';
import { isUnidentifiedAnomalyMissionId } from './unidentifiedAnomaly/unidentifiedAnomalyIds';
import { getUnidentifiedAnomalyMaterializedMission } from './unidentifiedAnomaly/unidentifiedAnomalyResolver';

export {
  FIRST_TUTORIAL_MISSION_ID,
  FIRST_MISSION_ID,
  MAIN_STORY_MISSION_PREFIX,
  isTutorialMissionId,
  isMainStoryMissionId,
  isCampaignPrimaryMissionId,
  isQuestMissionId,
  isSubQuestMissionId,
  CHAPTER1_NAMED_SIDE_QUEST_IDS,
  isChapter1NamedSideQuestId,
  isStoryMissionId,
  isInstanceMissionId,
  listTutorialMissions,
  listMainStoryMissions,
  listQuestMissions,
  listStoryMissions,
  listInstanceMissions,
  resolveMissionTrack,
  missionTrackHudPriority,
  type MissionTrack,
} from './missionTrack';

/** Table-First 정본: `missions.csv` → `MISSIONS_FROM_CSV` + ArcCore 인스턴스 clone. */
export function getMissionById(missionId: string): Mission | undefined {
  if (isArcCoreInstanceMissionId(missionId)) {
    return getArcCoreInstanceMaterializedMission(missionId);
  }
  if (isCaptainPersonalMissionId(missionId)) {
    return getCaptainPersonalMaterializedMission(missionId);
  }
  if (isUnidentifiedAnomalyMissionId(missionId)) {
    return getUnidentifiedAnomalyMaterializedMission(missionId);
  }
  return MISSIONS_FROM_CSV[missionId];
}

export function listAllMissions(): Mission[] {
  return Object.values(MISSIONS_FROM_CSV);
}
