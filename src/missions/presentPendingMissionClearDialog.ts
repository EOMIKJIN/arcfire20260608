/**
 * 미션 클리어 대사 present — ingameDialogApi 를 거치지 않음(Api 재export → Completion 순환 차단).
 */

import {
  runAfterIngameDialogIdle,
  subscribeIngameDialogBecameIdle,
} from '../game/ingameDialog/ingameDialogIdle';
import { runAfterIngameDialogFeatureLinkDelay } from '../game/ingameDialog/ingameDialogFeatureLink';
import { isCombatEndOutcomeHold } from '../game/combat/combatEndOutcomeHold';
import { useIngameDialogStore } from '../store/ingameDialogStore';
import { useMissionStore } from '../store/missionStore';
import { useArcOverlayStore } from '../ui/overlay/arcOverlayStore';

function isCombatResultOverlayOpen(): boolean {
  return useArcOverlayStore.getState().stack.some((e) => e.kind === 'waveResult');
}

/**
 * 결과창이 스택에 있으면 미션 대사를 올리지 않는다(pending 유지).
 * 패배대사 idle → 1.5초 feature-link 가 결과창을 덮던 경로를 차단한다.
 */
export function tryPresentPendingMissionClearDialog(): boolean {
  const pending = useMissionStore.getState().pendingMissionClearDialog;
  if (!pending) return false;
  if (isCombatResultOverlayOpen()) return false;
  if (useIngameDialogStore.getState().isActive()) {
    runAfterIngameDialogIdle(() => {
      tryPresentPendingMissionClearDialog();
    });
    return false;
  }
  const presented = useIngameDialogStore.getState().presentScene(pending.sceneId, {
    ...pending.options,
    skipSeenCheck: true,
    // 전투 직후 planet_hub 셸이 한 프레임 ready=false여도 큐만 잡고 대기 폐기되면 클리어 대사가 영구 소실
    bypassScreenShell: true,
  });
  if (!presented || !useIngameDialogStore.getState().isActive()) return false;
  useMissionStore.setState({ pendingMissionClearDialog: null });
  return true;
}

/** 수락 대사가 끝난 뒤 pending 클리어를 띄움. Completion→수락 정적 import 순환 없음. */
subscribeIngameDialogBecameIdle(() => {
  if (!useMissionStore.getState().pendingMissionClearDialog) return;
  if (isCombatResultOverlayOpen()) return;
  // 전투 종료 체인이 pending 을 직접 소진한다. 여기 끼어들면 레벨업보다 1.5s 늦게 덮인다.
  if (isCombatEndOutcomeHold()) return;
  runAfterIngameDialogFeatureLinkDelay(() => {
    tryPresentPendingMissionClearDialog();
  });
});
