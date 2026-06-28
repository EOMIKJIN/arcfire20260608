/**
 * 미션 트랙 분류 — Table-First id 접두사 정본.
 *
 * | 트랙 | id 접두사 | 진입 | 설명 |
 * |---|---|---|---|
 * | tutorial | mission_* | initTutorialStory (온보딩·인트로) | 초기 개발 튜토리얼 스토리 체인 |
 * | quest | sandbox_* | acceptQuestMission (선술집·NPC 대화) | 수락형 의뢰·진행 (통합 퀘스트) |
 */
import type { Mission } from '../types';
import { MISSIONS_FROM_CSV } from '../data/generated';

export type MissionTrack = 'tutorial' | 'quest';

/** 튜토리얼 스토리 체인 시작 — `missions.csv` mission_001 */
export const FIRST_TUTORIAL_MISSION_ID = 'mission_001';

/** @deprecated `FIRST_TUTORIAL_MISSION_ID` 사용 */
export const FIRST_MISSION_ID = FIRST_TUTORIAL_MISSION_ID;

export function resolveMissionTrack(missionId: string): MissionTrack | null {
  if (isTutorialMissionId(missionId)) return 'tutorial';
  if (isQuestMissionId(missionId)) return 'quest';
  return null;
}

export function isTutorialMissionId(missionId: string): boolean {
  return missionId.startsWith('mission_');
}

export function isQuestMissionId(missionId: string): boolean {
  return missionId.startsWith('sandbox_');
}

/** @deprecated `isTutorialMissionId` — 구 스토리 체인 명칭 */
export function isStoryMissionId(missionId: string): boolean {
  return isTutorialMissionId(missionId);
}

/** @deprecated `isQuestMissionId` — 구 인스턴스 미션 명칭 */
export function isInstanceMissionId(missionId: string): boolean {
  return isQuestMissionId(missionId);
}

export function listTutorialMissions(): Mission[] {
  const out: Mission[] = [];
  for (const mission of Object.values(MISSIONS_FROM_CSV)) {
    if (isTutorialMissionId(mission.id)) out.push(mission);
  }
  return out;
}

export function listQuestMissions(): Mission[] {
  const out: Mission[] = [];
  for (const mission of Object.values(MISSIONS_FROM_CSV)) {
    if (isQuestMissionId(mission.id)) out.push(mission);
  }
  return out;
}

/** @deprecated `listTutorialMissions` */
export function listStoryMissions(): Mission[] {
  return listTutorialMissions();
}

/** @deprecated `listQuestMissions` */
export function listInstanceMissions(): Mission[] {
  return listQuestMissions();
}
