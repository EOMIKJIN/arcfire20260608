// ============================================================
// 인게임 대화 — 씬 종료 정책·액션 실행 (미션·플래그 연동)
// ============================================================

import { useMissionStore } from '../../store/missionStore';
import { usePlayerStore } from '../../store/playerStore';
import { SEEN_STORY_SCENE_IDS_MAX, capBoundedStringList } from '../../store/playerFlagBounds';
import type { StorySceneCompletionPolicy } from '../../types';
import type { IngameDialogCompletionAction } from './ingameDialogTypes';
import { t } from '../../i18n';
import {
  tryAcceptMainStoryMissionWithFeedback,
  tryAcceptQuestMissionWithFeedback,
} from '../../missions/instanceMissionAcceptFeedback';
import { applyTalkNpcMissionObjectives } from '../../missions/applyTalkNpcMissionObjectives';
import {
  missionIdFromObjectiveId,
  rememberStellaQuestTalk,
} from '../../arcCore/chat/stellaQuestTalkMemory';
import { filterIngameDialogPages, getIngameDialogSceneById } from './ingameDialogSceneIndex';

function rememberQuestTalkFromScene(sceneId: string): void {
  if (!sceneId.startsWith('story_dialog_') && !sceneId.startsWith('npc_dialog_sq_')) return;
  const scene = getIngameDialogSceneById(sceneId);
  const captain = scene ? (filterIngameDialogPages(scene)[0]?.speakerNpcCaptainId?.trim() ?? '') : '';
  if (!captain || captain === 'npc_cpt_operator_stella') return;
  let objectiveId = '';
  let missionId = '';
  if (sceneId.startsWith('story_dialog_obj_')) {
    objectiveId = sceneId.slice('story_dialog_'.length);
    missionId = missionIdFromObjectiveId(objectiveId);
  } else if (sceneId.startsWith('story_dialog_story_')) {
    missionId = sceneId.slice('story_dialog_'.length);
  }
  rememberStellaQuestTalk({ sceneId, speakerCaptainId: captain, missionId, objectiveId });
}

const callbackRegistry = new Map<string, () => void | Promise<void>>();

export function registerIngameDialogCallback(
  callbackId: string,
  fn: () => void | Promise<void>,
): () => void {
  callbackRegistry.set(callbackId, fn);
  return () => {
    callbackRegistry.delete(callbackId);
  };
}

export function markIngameDialogSceneSeen(sceneId: string): void {
  rememberQuestTalkFromScene(sceneId);
  const snapshot = usePlayerStore.getState().player;
  if (!snapshot) return;
  const prevSeen = snapshot.flags.seenStorySceneIds ?? [];
  if (prevSeen.includes(sceneId)) return;
  usePlayerStore.getState().setPlayer({
    ...snapshot,
    flags: {
      ...snapshot.flags,
      seenStorySceneIds: capBoundedStringList([...prevSeen, sceneId], SEEN_STORY_SCENE_IDS_MAX),
    },
  });
  void usePlayerStore.getState().persist();
}

export function runIntroSeenAndStartFirstMissionPolicy(): void {
  const player = usePlayerStore.getState().player;
  if (player) {
    usePlayerStore.getState().setPlayer({
      ...player,
      flags: {
        ...player.flags,
        introSeen: true,
        firstMissionStarted: true,
      },
    });
    void usePlayerStore.getState().persist();
  }
  useMissionStore.getState().initTutorialStory();
}

export async function runIngameDialogCompletionAction(
  action: IngameDialogCompletionAction,
): Promise<void> {
  switch (action.type) {
    case 'mark_scene_seen':
      markIngameDialogSceneSeen(action.sceneId);
      break;
    case 'grant_mission_rewards':
      useMissionStore.getState().finalizeMissionCompletion(action.missionId);
      break;
    case 'start_mission':
      useMissionStore.getState().initTutorialStory();
      break;
    case 'accept_quest_mission':
    case 'accept_instance_mission': {
      const player = usePlayerStore.getState().player;
      const level = player?.level ?? 1;
      tryAcceptQuestMissionWithFeedback(
        action.missionId,
        {
          planetId: action.planetId,
          playerLevel: level,
          expectCaptainId: action.expectCaptainId,
        },
        t,
      );
      break;
    }
    case 'accept_main_story_mission': {
      const player = usePlayerStore.getState().player;
      const level = player?.level ?? 1;
      tryAcceptMainStoryMissionWithFeedback(
        action.missionId,
        {
          planetId: action.planetId,
          playerLevel: level,
          expectCaptainId: action.expectCaptainId,
        },
        t,
      );
      break;
    }
    case 'complete_talk_npc':
      applyTalkNpcMissionObjectives(action.captainId, action.planetId);
      break;
    case 'record_orbit_comm': {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { recordOrbitComm } = require('../../store/orbitPresenceMemoryStore') as typeof import('../../store/orbitPresenceMemoryStore');
      recordOrbitComm({
        captainId: action.captainId,
        planetId: action.planetId,
        outcome: action.outcome,
        sceneId: action.sceneId,
        writeId: action.writeId,
      });
      break;
    }
    case 'mark_intro_seen_and_start_first_mission':
      runIntroSeenAndStartFirstMissionPolicy();
      break;
    case 'run_callback': {
      const fn = callbackRegistry.get(action.callbackId);
      if (fn) await Promise.resolve(fn());
      break;
    }
    default:
      break;
  }
}

export async function runIngameDialogCompletionPolicy(
  policy: StorySceneCompletionPolicy,
): Promise<void> {
  if (policy === 'mark_intro_seen_and_start_first_mission') {
    runIntroSeenAndStartFirstMissionPolicy();
  }
}

export async function runIngameDialogCompletionBatch(
  policy: StorySceneCompletionPolicy,
  actions: readonly IngameDialogCompletionAction[],
): Promise<void> {
  await runIngameDialogCompletionPolicy(policy);
  for (const action of actions) {
    await runIngameDialogCompletionAction(action);
  }
}
