// ============================================================
// 범용 인게임 대화 — 공개 API (화면·미션·트리거)
// ============================================================

import { useIngameDialogStore } from '../../store/ingameDialogStore';
import type { StorySceneTriggerKey } from '../../types';
import type {
  AdHocIngameDialogPayload,
  PresentIngameDialogOptions,
} from './ingameDialogTypes';

export function isIngameDialogActive(): boolean {
  return useIngameDialogStore.getState().isActive();
}

export function presentIngameDialogScene(
  sceneId: string,
  options?: PresentIngameDialogOptions,
): boolean {
  return useIngameDialogStore.getState().presentScene(sceneId, options);
}

export function presentAdHocIngameDialog(payload: AdHocIngameDialogPayload): boolean {
  return useIngameDialogStore.getState().presentAdHoc(payload);
}

export function dismissIngameDialog(): void {
  useIngameDialogStore.getState().dismiss();
}

export function tryFireIngameDialogTrigger(
  triggerKey: StorySceneTriggerKey,
  targetId: string | null,
  options?: PresentIngameDialogOptions,
): boolean {
  return useIngameDialogStore.getState().tryFireTrigger({ triggerKey, targetId }, options);
}

export function resetIngameDialogPlanetLandedDedupe(): void {
  useIngameDialogStore.getState().resetPlanetLandedDedupe();
}

export {
  registerIngameDialogCallback,
  markIngameDialogSceneSeen,
  runIntroSeenAndStartFirstMissionPolicy,
} from './ingameDialogCompletion';
export {
  getIngameDialogSceneById,
  resolveMissionClearDialogSceneId,
} from './ingameDialogSceneIndex';
export {
  resolveIngameDialogFallbackSceneId,
  resolveNpcCaptainDialogSceneId,
} from './resolveNpcCaptainDialogSceneId';
export type {
  PresentIngameDialogOptions,
  IngameDialogCompletionAction,
  IngameDialogTextContext,
} from './ingameDialogTypes';
export { INGAME_DIALOG_OVERLAY_ID } from './ingameDialogTypes';
