// ============================================================
// 인게임 대화 — 씬 종료 정책·액션 실행 (미션·플래그 연동)
// ============================================================

import { useMissionStore } from '../../store/missionStore';
import { usePlayerStore } from '../../store/playerStore';
import type { StorySceneCompletionPolicy } from '../../types';
import type { IngameDialogCompletionAction } from './ingameDialogTypes';

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
  const snapshot = usePlayerStore.getState().player;
  if (!snapshot) return;
  const prevSeen = snapshot.flags.seenStorySceneIds ?? [];
  if (prevSeen.includes(sceneId)) return;
  usePlayerStore.getState().setPlayer({
    ...snapshot,
    flags: {
      ...snapshot.flags,
      seenStorySceneIds: [...prevSeen, sceneId],
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
  useMissionStore.getState().initMissions();
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
      useMissionStore.getState().initMissions();
      break;
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
