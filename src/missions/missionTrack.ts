/**
 * 미션 트랙 분류 — Table-First id 접두사 정본.
 *
 * | 트랙 | id 접두사 | 진입 | 설명 |
 * |---|---|---|---|
 * | tutorial | mission_* | initTutorialStory (온보딩·인트로) | 초기 개발 튜토리얼 스토리 체인 |
 * | quest | sandbox_* | acceptQuestMission (선술집·NPC 대화) | 수락형 의뢰·진행 (통합 퀘스트) |
 * | inst_tpl | tq_* | (ArcCore clone 전용) | 선술집 인스턴스 의뢰 템플릿 — offerPlanetId 없음 |
 */
import type { Mission } from '../types';
import { MISSIONS_FROM_CSV } from '../data/generated';

export type MissionTrack = 'tutorial' | 'quest';

/** ArcCore 선술집 인스턴스 clone 템플릿 접두사. */
export const TAVERN_INSTANCE_TEMPLATE_PREFIX = 'tq_';

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

export function isTavernInstanceTemplateMissionId(missionId: string): boolean {
  return missionId.startsWith(TAVERN_INSTANCE_TEMPLATE_PREFIX);
}

export function isArcCoreAutoInstanceMissionId(missionId: string): boolean {
  return missionId.startsWith('arc_inst_');
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

/** ArcCore 선술집 인스턴스 보드 — 행성 무관 tq_* 템플릿 풀. */
export function listTavernInstanceTemplateMissions(): Mission[] {
  const out: Mission[] = [];
  for (const mission of Object.values(MISSIONS_FROM_CSV)) {
    if (isTavernInstanceTemplateMissionId(mission.id)) out.push(mission);
  }
  out.sort((a, b) => a.id.localeCompare(b.id));
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
