// 퀘스트(의뢰)·메인스토리 수락 — 바·허브 대화 공용 피드백 (ArcOverlayHost alert)
// 튜토리얼 스토리(mission_*)는 initTutorialStory — 본 모듈 대상 아님
// ============================================================

import { showArcAlert } from '../utils/showArcAlert';
import {
  useMissionStore,
  type AcceptMainStoryMissionResult,
  type AcceptQuestMissionResult,
} from '../store/missionStore';
import { reconcileActiveMissionProgressAfterEvent } from './reconcileActiveMissionProgress';
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
      return t('bar.newMissions.acceptFailLevel');
    case 'already_active':
      return t('bar.newMissions.acceptFailActive');
    case 'already_complete':
      return t('bar.newMissions.acceptFailComplete');
    case 'wrong_planet':
      return t('bar.newMissions.acceptFailPlanet');
    case 'prereq_missing':
      return t('bar.newMissions.acceptFailPrereq');
    case 'wrong_captain':
      return t('bar.newMissions.acceptFailCaptain');
    case 'not_on_board':
      return t('bar.newMissions.acceptFailNotOnBoard');
    case 'no_objectives':
      return t('bar.newMissions.acceptFailNoObjectives');
    default:
      return t('bar.newMissions.acceptFailGeneric');
  }
}

/** @deprecated `questMissionAcceptFailMessage` */
export function instanceMissionAcceptFailMessage(
  result: Exclude<AcceptQuestMissionResult, 'accepted'>,
  t: AcceptFeedbackT,
): string {
  return questMissionAcceptFailMessage(result, t);
}

/** 바·인게임 대화 — acceptQuestMission + ArcOverlay alert */
export function tryAcceptQuestMissionWithFeedback(
  missionId: string,
  context: QuestMissionAcceptContext,
  t: AcceptFeedbackT,
): AcceptQuestMissionResult {
  const result = useMissionStore.getState().acceptQuestMission(missionId, context);
  const mission = getMissionById(missionId);
  const locale = useAppSettingsStore.getState().locale;
  const title = mission ? resolveMissionTitle(mission, locale) : missionId;
  if (result === 'accepted') {
    reconcileActiveMissionProgressAfterEvent();
    if (useMissionStore.getState().pendingMissionDialogId === missionId) {
      return result;
    }
  }
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
      t('bar.newMissions.acceptSuccessTitle'),
      t('bar.newMissions.acceptSuccessBody', { title: missionTitle }),
    );
    return;
  }
  showArcAlert(
    t('bar.newMissions.acceptFailTitle'),
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

export function mainStoryMissionAcceptFailMessage(
  result: Exclude<AcceptMainStoryMissionResult, 'accepted'>,
  t: AcceptFeedbackT,
): string {
  switch (result) {
    case 'level_locked':
      return t('bar.newMissions.acceptFailLevel');
    case 'already_active':
      return t('mission.mainStory.acceptFailActive');
    case 'already_complete':
      return t('mission.mainStory.acceptFailComplete');
    case 'wrong_planet':
      return t('mission.mainStory.acceptFailPlanet');
    case 'prereq_missing':
      return t('bar.newMissions.acceptFailPrereq');
    case 'wrong_captain':
      return t('mission.mainStory.acceptFailCaptain');
    case 'not_main_story':
      return t('mission.mainStory.acceptFailNotStory');
    case 'no_objectives':
      return t('bar.newMissions.acceptFailNoObjectives');
    default:
      return t('mission.mainStory.acceptFailGeneric');
  }
}

/** INFO 통신·허브 NPC 1차 대사 — acceptMainStoryMission + ArcOverlay alert */
export function tryAcceptMainStoryMissionWithFeedback(
  missionId: string,
  context: QuestMissionAcceptContext,
  t: AcceptFeedbackT,
): AcceptMainStoryMissionResult {
  const result = useMissionStore.getState().acceptMainStoryMission(missionId, context);
  const mission = getMissionById(missionId);
  const locale = useAppSettingsStore.getState().locale;
  const title = mission ? resolveMissionTitle(mission, locale) : missionId;
  if (result === 'accepted') {
    reconcileActiveMissionProgressAfterEvent();
    if (useMissionStore.getState().pendingMissionDialogId === missionId) {
      return result;
    }
    showArcAlert(
      t('mission.mainStory.acceptSuccessTitle'),
      t('mission.mainStory.acceptSuccessBody', { title }),
    );
    return result;
  }
  showArcAlert(t('mission.mainStory.acceptFailTitle'), mainStoryMissionAcceptFailMessage(result, t));
  return result;
}
