import { runAfterIngameDialogIdle } from '../../game/ingameDialog/ingameDialogIdle';
import {
  consumeResumeArcCoreAgentAfterIngameDialog,
  hasPendingResumeArcCoreAgentAfterIngameDialog,
  isArcCoreAgentSurfaceOpen,
  markResumeArcCoreAgentAfterIngameDialog,
  useArcCoreAgentSurfaceStore,
} from './arcCoreAgentSurfaceStore';

/** 함장 1차 통신을 위해 에이전트 면을 즉시 내리고, 확인 후 복귀 예약. */
export function parkArcCoreAgentForIngameDialog(): boolean {
  if (!isArcCoreAgentSurfaceOpen()) return false;
  markResumeArcCoreAgentAfterIngameDialog();
  useArcCoreAgentSurfaceStore.getState().activateGame({ immediate: true });
  return true;
}

export function resumeArcCoreAgentAfterIngameDialogIfPending(): boolean {
  if (!consumeResumeArcCoreAgentAfterIngameDialog()) return false;
  return useArcCoreAgentSurfaceStore.getState().activateAgent({ ignoreReopenLock: true });
}

/** 대사 present 성공 시 확인(idle) 뒤 복귀. 실패면 바로 복귀. */
export function scheduleResumeArcCoreAgentAfterIngameDialog(presented: boolean): void {
  if (!hasPendingResumeArcCoreAgentAfterIngameDialog()) return;
  if (!presented) {
    resumeArcCoreAgentAfterIngameDialogIfPending();
    return;
  }
  runAfterIngameDialogIdle(() => {
    resumeArcCoreAgentAfterIngameDialogIfPending();
  });
}
