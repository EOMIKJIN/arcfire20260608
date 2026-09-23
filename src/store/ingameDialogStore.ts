// ============================================================
// 범용 인게임 대화 — 전역 세션 스토어
// ============================================================

import { create } from 'zustand';
import { STORY_SCENES_FROM_CSV } from '../data/generated/csvStoryScenes';
import {
  getIngameDialogSceneById,
  isIngameDialogScene,
  listIngameDialogScenesForTrigger,
} from '../game/ingameDialog/ingameDialogSceneIndex';
import { advanceIngameDialogSession } from '../game/ingameDialog/ingameDialogSessionLogic';
import { runIngameDialogCompletionBatch } from '../game/ingameDialog/ingameDialogCompletion';
import {
  cancelIngameDialogIdlePresentsAndNotify,
  drainIngameDialogIdleCallbacks,
} from '../game/ingameDialog/ingameDialogIdle';
import { cancelIngameDialogFeatureLinkDelay } from '../game/ingameDialog/ingameDialogFeatureLink';
import {
  bindUiSequenceDialogBusy,
  clearUiForegroundSequence,
  runWhenUiScreenReady,
} from '../ui/process/uiForegroundSequence';
import {
  resolveAdHocIngameDialogSegmentCount,
  resolveIngameDialogSegmentCount,
} from '../game/ingameDialog/ingameDialogViewModel';
import { getActiveNarrativeDialogSplitOptions } from '../ui/overlay/splitNarrativeDialogSegments';
import type {
  AdHocIngameDialogPayload,
  IngameDialogCompletionAction,
  IngameDialogSession,
  IngameDialogTriggerQuery,
  PresentIngameDialogOptions,
} from '../game/ingameDialog/ingameDialogTypes';
import { usePlayerStore } from './playerStore';
import { useAppSettingsStore } from './appSettingsStore';

let adhocSeq = 0;

type IngameDialogState = {
  session: IngameDialogSession | null;
  /** planet_landed 등 동일 착륙 1회 소비 */
  lastPlanetLandedId: string | null;
  presentScene: (sceneId: string, options?: PresentIngameDialogOptions) => boolean;
  presentAdHoc: (payload: AdHocIngameDialogPayload) => boolean;
  tryFireTrigger: (query: IngameDialogTriggerQuery, options?: PresentIngameDialogOptions) => boolean;
  dismiss: () => void;
  /** 첫 창 무입력 자동닫힘 — completion 없이 종료, 남은 페이지·대기 대사 취소 */
  dismissCancelRemaining: () => void;
  /** 허브 이탈·purge — NL 통신만 수락 없이 닫음. idle drain 없음(combat_end 체인 보호) */
  abortLeavingStage: () => void;
  pressNext: () => void;
  /**
   * [취소] — completion(수락) 없이 종료.
   * CSV 메인 스토리: onDismiss(배지 ack). adhoc 수락형 통신: onCancel만(메신저 금지).
   */
  pressCancel: () => void;
  markPageComplete: () => void;
  isActive: () => boolean;
  resetPlanetLandedDedupe: () => void;
};

function isSceneSeen(sceneId: string): boolean {
  const player = usePlayerStore.getState().player;
  return Boolean(player?.flags.seenStorySceneIds?.includes(sceneId));
}

function buildCompletionActionsForScene(
  sceneId: string,
  options?: PresentIngameDialogOptions,
): IngameDialogCompletionAction[] {
  const scene = getIngameDialogSceneById(sceneId);
  const actions = [...(options?.completionActions ?? [])];
  if (scene?.triggerRepeat === 'once') {
    actions.unshift({ type: 'mark_scene_seen', sceneId });
  }
  return actions;
}

async function finishSession(session: IngameDialogSession): Promise<void> {
  const onDismiss = session.kind === 'csv_scene' ? session.onDismiss : session.payload.onDismiss;
  if (session.kind === 'csv_scene') {
    const scene = getIngameDialogSceneById(session.sceneId);
    if (scene) {
      await runIngameDialogCompletionBatch(scene.completionPolicy, session.completionActions);
    }
  } else {
    for (const action of session.payload.completionActions ?? []) {
      await runIngameDialogCompletionBatch('none', [action]);
    }
  }
  onDismiss?.();
  drainIngameDialogIdleCallbacks();
}

export const useIngameDialogStore = create<IngameDialogState>((set, get) => ({
  session: null,
  lastPlanetLandedId: null,

  isActive: () => get().session != null,

  resetPlanetLandedDedupe: () => set({ lastPlanetLandedId: null }),

  presentScene: (sceneId, options) => {
    return runWhenUiScreenReady(() => {
      if (get().session) return false;
    const scene = getIngameDialogSceneById(sceneId);
    if (!scene || !isIngameDialogScene(scene)) return false;
    if (
      !options?.skipSeenCheck
      && scene.triggerRepeat === 'once'
      && isSceneSeen(sceneId)
    ) {
      return false;
    }
    set({
      session: {
        kind: 'csv_scene',
        sceneId,
        pageIndex: 0,
        segmentIndex: 0,
        pageComplete: false,
        completionActions: buildCompletionActionsForScene(sceneId, options),
        onDismiss: options?.onDismiss,
        context: options?.context ?? {},
        autoDismissMs: options?.autoDismissMs,
        autoDismissMode: options?.autoDismissMode,
      },
    });
    return true;
    }, options?.bypassScreenShell);
  },

  presentAdHoc: (payload) => {
    return runWhenUiScreenReady(() => {
    if (get().session) return false;
    adhocSeq += 1;
    set({
      session: {
        kind: 'adhoc',
        adhocId: `adhoc_${adhocSeq}`,
        segmentIndex: 0,
        pageComplete: false,
        payload,
      },
    });
    return true;
    }, payload.bypassScreenShell);
  },

  tryFireTrigger: (query, options) => {
    return runWhenUiScreenReady(() => {
    if (get().session) return false;
    if (query.triggerKey === 'planet_landed' && query.targetId) {
      if (get().lastPlanetLandedId === query.targetId) return false;
      set({ lastPlanetLandedId: query.targetId });
    }
    const candidates = listIngameDialogScenesForTrigger(query.triggerKey, query.targetId);
    for (const scene of candidates) {
      if (scene.triggerRepeat === 'once' && isSceneSeen(scene.id)) continue;
      return get().presentScene(scene.id, { ...options, bypassScreenShell: true });
    }
    return false;
    }, options?.bypassScreenShell);
  },

  dismiss: () => {
    const session = get().session;
    if (!session) return;
    set({ session: null });
    void finishSession(session);
  },

  dismissCancelRemaining: () => {
    const session = get().session;
    if (!session) return;
    set({ session: null });
    cancelIngameDialogFeatureLinkDelay();
    clearUiForegroundSequence();
    if (session.kind === 'csv_scene') {
      session.onDismiss?.();
    } else {
      session.payload.onCancel?.();
      if (!session.payload.onCancel) {
        session.payload.onDismiss?.();
      }
    }
    cancelIngameDialogIdlePresentsAndNotify();
  },

  abortLeavingStage: () => {
    clearUiForegroundSequence();
    cancelIngameDialogFeatureLinkDelay();
    const session = get().session;
    if (!session || session.kind !== 'adhoc') return;
    if (session.payload.abortOnStageLeave !== true) return;
    set({ session: null });
    session.payload.onCancel?.();
  },

  pressCancel: () => {
    const session = get().session;
    if (!session) return;
    if (session.kind === 'csv_scene') {
      if (!session.pageComplete) return;
      const hasMainStoryAccept = session.completionActions.some(
        (a) => a.type === 'accept_main_story_mission',
      );
      if (!hasMainStoryAccept) return;
      set({ session: null });
      session.onDismiss?.();
      drainIngameDialogIdleCallbacks();
      return;
    }
    if (!session.pageComplete) return;
    set({ session: null });
    session.payload.onCancel?.();
    drainIngameDialogIdleCallbacks();
  },

  markPageComplete: () => {
    const session = get().session;
    if (!session) return;
    if (session.kind === 'adhoc') {
      set({ session: { ...session, pageComplete: true } });
      return;
    }
    set({ session: { ...session, pageComplete: true } });
  },

  pressNext: () => {
    const session = get().session;
    if (!session) return;

    if (session.kind === 'adhoc') {
      if (!session.pageComplete) return;
      const segmentCount = resolveAdHocIngameDialogSegmentCount(
        session.payload.text,
        getActiveNarrativeDialogSplitOptions(),
      );
      const result = advanceIngameDialogSession(session, null, segmentCount);
      if (result.type === 'blocked') return;
      if (result.type === 'advanced') {
        set({ session: result.session });
        return;
      }
      set({ session: null });
      void finishSession(result.session);
      return;
    }

    const scene = getIngameDialogSceneById(session.sceneId);
    if (!scene) {
      set({ session: null });
      drainIngameDialogIdleCallbacks();
      return;
    }

    const locale = useAppSettingsStore.getState().locale;
    const nickname = usePlayerStore.getState().player?.nickname;
    const segmentCount = resolveIngameDialogSegmentCount(
      session,
      scene,
      locale,
      nickname,
      getActiveNarrativeDialogSplitOptions(),
    );
    const result = advanceIngameDialogSession(session, scene, segmentCount);
    if (result.type === 'blocked') return;
    if (result.type === 'advanced') {
      set({ session: result.session as IngameDialogSession });
      return;
    }
    const completedSession = result.session;
    set({ session: null });
    void finishSession(completedSession);
  },
}));

bindUiSequenceDialogBusy(() => useIngameDialogStore.getState().isActive());

// STORY_SCENES 참조 유지 — tree-shake 방지·타입 체크
void STORY_SCENES_FROM_CSV;
