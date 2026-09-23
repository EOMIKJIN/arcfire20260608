// 허브 STAGE 이탈·계정 purge 때 채팅/inbound 통신만 닫는다. worldmap 고착 안전망 아님.

import { abortIngameDialogLeavingStage } from '../../game/ingameDialog/ingameDialogApi';
import { useArcOverlayStore } from '../../ui/overlay/arcOverlayStore';
import { isArcCoreChatOverlayToDismiss } from './arcCoreChatOverlayDismissPolicy';
import {
  hideArcCoreAgentSurfaceForCombat,
  unmountArcCoreAgentSurface,
} from './arcCoreAgentSurfaceStore';

export function dismissArcCoreChatOverlays(opts?: { unmountAgent?: boolean }): void {
  abortIngameDialogLeavingStage();
  useArcOverlayStore.getState().dismissWhere(isArcCoreChatOverlayToDismiss);
  if (opts?.unmountAgent) {
    unmountArcCoreAgentSurface();
    return;
  }
  hideArcCoreAgentSurfaceForCombat();
}
