/**
 * 미션 트랙 분류 — Table-First id 접두사 정본.
 *
 * | 트랙 | id 접두사 | 진입 | 설명 |
 * |---|---|---|---|
 * | tutorial | mission_* | initTutorialStory (온보딩·인트로) | 초기 튜토리얼 스토리 체인 |
 * | main_story | story_* | acceptMainStoryMission + mainStory 챕터 그래프 | 본편 메인 스토리 — 튜토리얼과 분리 |
 * | quest | sandbox_* · arc_cpt_* | acceptQuestMission (바·NPC·INFO 개인) | 수락형 의뢰·진행 |
 * | inst_tpl | tq_* | (ArcCore clone 전용) | 바 인스턴스 의뢰 템플릿 |
 * | cpt_tpl | cp_* | (함장 개인 clone 전용) | INFO 통신 개인미션 템플릿 |
 *
 * HUD/주 표시 우선순위: tutorial > main_story > quest
 */
import type { Mission } from '../types';
import { MISSIONS_FROM_CSV } from '../data/generated';
import { isCaptainPersonalMissionId } from './captainPersonalMissionIds';

export type MissionTrack = 'tutorial' | 'main_story' | 'quest';

/** ArcCore 바 인스턴스 clone 템플릿 접두사. */
export const BAR_INSTANCE_TEMPLATE_PREFIX = 'tq_';

/** 튜토리얼 스토리 체인 시작 — `missions.csv` mission_001 */
export const FIRST_TUTORIAL_MISSION_ID = 'mission_001';

/** 메인 스토리 id 접두사 — CSV에 `story_*` 행 추가 시 자동 편입 */
export const MAIN_STORY_MISSION_PREFIX = 'story_';

/** @deprecated `FIRST_TUTORIAL_MISSION_ID` 사용 */
export const FIRST_MISSION_ID = FIRST_TUTORIAL_MISSION_ID;

export function resolveMissionTrack(missionId: string): MissionTrack | null {
  if (isTutorialMissionId(missionId)) return 'tutorial';
  if (isMainStoryMissionId(missionId)) return 'main_story';
  if (isQuestMissionId(missionId) || isCaptainPersonalMissionId(missionId)) return 'quest';
  return null;
}

export function isTutorialMissionId(missionId: string): boolean {
  return missionId.startsWith('mission_');
}

export function isMainStoryMissionId(missionId: string): boolean {
  return missionId.startsWith(MAIN_STORY_MISSION_PREFIX);
}

export function isQuestMissionId(missionId: string): boolean {
  return missionId.startsWith('sandbox_');
}

/**
 * 챕터1 정식 서브퀘스트 부모 5종 — 바 의뢰 `sandbox_001`–`033`과 구분.
 * 지도 수락 마크·제품명 「서브퀘스트」는 이 집합만.
 */
export const CHAPTER1_NAMED_SIDE_QUEST_IDS = [
  'sandbox_034',
  'sandbox_035',
  'sandbox_036',
  'sandbox_037',
  'sandbox_038',
] as const;

const CHAPTER1_NAMED_SIDE_QUEST_ID_SET: ReadonlySet<string> = new Set(
  CHAPTER1_NAMED_SIDE_QUEST_IDS,
);

export function isChapter1NamedSideQuestId(missionId: string): boolean {
  return CHAPTER1_NAMED_SIDE_QUEST_ID_SET.has(missionId);
}

/** 튜토리얼·메인스토리 — QuestHUD/activeMissionId 주선 후보 */
export function isCampaignPrimaryMissionId(missionId: string): boolean {
  return isTutorialMissionId(missionId) || isMainStoryMissionId(missionId);
}

/** 트랙 HUD 정렬 가중치 — 낮을수록 주선 우선 */
export function missionTrackHudPriority(track: MissionTrack | null): number {
  if (track === 'tutorial') return 0;
  if (track === 'main_story') return 1;
  if (track === 'quest') return 2;
  return 9;
}

export function isBarInstanceTemplateMissionId(missionId: string): boolean {
  return missionId.startsWith(BAR_INSTANCE_TEMPLATE_PREFIX);
}

export function isArcCoreAutoInstanceMissionId(missionId: string): boolean {
  return missionId.startsWith('arc_inst_');
}

/** @deprecated `isTutorialMissionId` — 구 스토리 체인 명칭(튜토리얼). 메인스토리와 혼동 금지 */
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

export function listMainStoryMissions(): Mission[] {
  const out: Mission[] = [];
  for (const mission of Object.values(MISSIONS_FROM_CSV)) {
    if (isMainStoryMissionId(mission.id)) out.push(mission);
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

/** ArcCore 바 인스턴스 보드 — 행성 무관 tq_* 템플릿 풀. */
export function listBarInstanceTemplateMissions(): Mission[] {
  const out: Mission[] = [];
  for (const mission of Object.values(MISSIONS_FROM_CSV)) {
    if (isBarInstanceTemplateMissionId(mission.id)) out.push(mission);
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
