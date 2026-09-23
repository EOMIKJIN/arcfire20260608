/**
 * 미션 클리어 대사 present — ingameDialogApi 를 거치지 않음(Api 재export → Completion 순환 차단).
 */

import {
  runAfterIngameDialogIdle,
  subscribeIngameDialogBecameIdle,
} from '../game/ingameDialog/ingameDialogIdle';
import { runAfterIngameDialogFeatureLinkDelay } from '../game/ingameDialog/ingameDialogFeatureLink';
import { useIngameDialogStore } from '../store/ingameDialogStore';
import { useMissionStore } from '../store/missionStore';

export function tryPresentPendingMissionClearDialog(): boolean {
  const pending = useMissionStore.getState().pendingMissionClearDialog;
  if (!pending) return false;
  if (useIngameDialogStore.getState().isActive()) {
    runAfterIngameDialogIdle(() => {
      tryPresentPendingMissionClearDialog();
    });
    return false;
  }
  const presented = useIngameDialogStore.getState().presentScene(pending.sceneId, {
    ...pending.options,
    skipSeenCheck: true,
  });
  if (!presented) return false;
  useMissionStore.setState({ pendingMissionClearDialog: null });
  return true;
}

/** 수락 대사가 끝난 뒤 pending 클리어를 띄움. Completion→수락 정적 import 순환 없음. */
subscribeIngameDialogBecameIdle(() => {
  if (!useMissionStore.getState().pendingMissionClearDialog) return;
  runAfterIngameDialogFeatureLinkDelay(() => {
    tryPresentPendingMissionClearDialog();
  });
});
