// 퀘스트(의뢰) 수락 — 선술집·허브 대화 공용 피드백 (ArcOverlayHost alert)
// 튜토리얼 스토리(mission_*)는 initTutorialStory — 본 모듈 대상 아님
// ============================================================

import { showArcAlert } from '../utils/showArcAlert';
import { useMissionStore, type AcceptQuestMissionResult } from '../store/missionStore';
import { getMissionById } from './missionCatalog';
import { resolveMissionTitle } from '../i18n/missionText';
import { useAppSettingsStore } from '../store/appSettingsStore';

type AcceptFeedbackT = (key: string, params?: Record<string, string | number>) => string;

export type QuestMissionAcceptContext = {
  planetId: string;
  playerLevel: number;
  /** 허브 대화 경로 — missions.csv offerCaptainId 교차 검증 */
  expectCaptainId?: string;
};

/** @deprecated `QuestMissionAcceptContext` */
export type InstanceMissionAcceptContext = QuestMissionAcceptContext;

export function questMissionAcceptFailMessage(
  result: Exclude<AcceptQuestMissionResult, 'accepted'>,
  t: AcceptFeedbackT,
): string {
  switch (result) {
    case 'level_locked':
      return t('tavern.newMissions.acceptFailLevel');
    case 'already_active':
      return t('tavern.newMissions.acceptFailActive');
    case 'already_complete':
      return t('tavern.newMissions.acceptFailComplete');
    case 'wrong_planet':
      return t('tavern.newMissions.acceptFailPlanet');
    case 'prereq_missing':
      return t('tavern.newMissions.acceptFailPrereq');
    case 'wrong_captain':
      return t('tavern.newMissions.acceptFailCaptain');
    case 'not_on_board':
      return t('tavern.newMissions.acceptFailNotOnBoard');
    default:
      return t('tavern.newMissions.acceptFailGeneric');
  }
}

/** @deprecated `questMissionAcceptFailMessage` */
export function instanceMissionAcceptFailMessage(
  result: Exclude<AcceptQuestMissionResult, 'accepted'>,
  t: AcceptFeedbackT,
): string {
  return questMissionAcceptFailMessage(result, t);
}

/** 선술집·인게임 대화 — acceptQuestMission + ArcOverlay alert */
export function tryAcceptQuestMissionWithFeedback(
  missionId: string,
  context: QuestMissionAcceptContext,
  t: AcceptFeedbackT,
): AcceptQuestMissionResult {
  const result = useMissionStore.getState().acceptQuestMission(missionId, context);
  const mission = getMissionById(missionId);
  const locale = useAppSettingsStore.getState().locale;
  const title = mission ? resolveMissionTitle(mission, locale) : missionId;
  showQuestMissionAcceptFeedback(result, title, t);
  return result;
}

/** @deprecated `tryAcceptQuestMissionWithFeedback` */
export function tryAcceptInstanceMissionWithFeedback(
  missionId: string,
  context: QuestMissionAcceptContext,
  t: AcceptFeedbackT,
): AcceptQuestMissionResult {
  return tryAcceptQuestMissionWithFeedback(missionId, context, t);
}

export function showQuestMissionAcceptFeedback(
  result: AcceptQuestMissionResult,
  missionTitle: string,
  t: AcceptFeedbackT,
): void {
  if (result === 'accepted') {
    showArcAlert(
      t('tavern.newMissions.acceptSuccessTitle'),
      t('tavern.newMissions.acceptSuccessBody', { title: missionTitle }),
    );
    return;
  }
  showArcAlert(
    t('tavern.newMissions.acceptFailTitle'),
    questMissionAcceptFailMessage(result, t),
  );
}

/** @deprecated `showQuestMissionAcceptFeedback` */
export function showInstanceMissionAcceptFeedback(
  result: AcceptQuestMissionResult,
  missionTitle: string,
  t: AcceptFeedbackT,
): void {
  showQuestMissionAcceptFeedback(result, missionTitle, t);
}
