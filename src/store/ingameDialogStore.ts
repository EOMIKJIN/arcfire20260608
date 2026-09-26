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
import { bumpIngameDialogLeaveAbortGen } from '../game/ingameDialog/ingameDialogLeaveAbort';
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
import { isOfferDeclineActionType } from '../game/ingameDialog/resolveIngameDialogFinalLabel';
import {
  INGAME_DIALOG_READY_TIMEOUT_MS,
  type IngameDialogSessionPack,
} from '../game/ingameDialog/ingameDialogSessionPack';
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
let adhocFinishGen = 0;

function isThenable(value: unknown): value is Promise<void> {
  return Boolean(value) && typeof (value as { then?: unknown }).then === 'function';
}

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
  /** 시설 나가기 — CSV·adhoc 전부 종료. completion·다음 턴 체인 없음 */
  abortAllOnLeave: () => void;
  pressNext: () => void;
  /**
   * [취소] — completion(수락) 없이 종료.
   * CSV 메인/의뢰: onDismiss(배지 ack, 수락 없음). adhoc 수락형 통신: onCancel만(메신저 금지).
   */
  pressCancel: () => void;
  markPageComplete: () => void;
  attachSessionPack: (pack: IngameDialogSessionPack) => void;
  markPackReady: () => void;
  isActive: () => boolean;
  resetPlanetLandedDedupe: () => void;
};

let readyTimer: ReturnType<typeof setTimeout> | null = null;
let readyGen = 0;

function clearReadyWatch(): void {
  if (readyTimer) {
    clearTimeout(readyTimer);
    readyTimer = null;
  }
}

function beginReadyWatch(): void {
  clearReadyWatch();
  readyGen += 1;
  const gen = readyGen;
  readyTimer = setTimeout(() => {
    readyTimer = null;
    if (readyGen !== gen) return;
    useIngameDialogStore.getState().markPackReady();
  }, INGAME_DIALOG_READY_TIMEOUT_MS);
}

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
        stepIndex: 0,
        pageComplete: false,
        ready: false,
        pack: null,
        completionActions: buildCompletionActionsForScene(sceneId, options),
        onDismiss: options?.onDismiss,
        context: options?.context ?? {},
        autoDismissMs: options?.autoDismissMs,
        autoDismissMode: options?.autoDismissMode,
      },
    });
    beginReadyWatch();
    return true;
    }, options?.bypassScreenShell);
  },

  presentAdHoc: (payload) => {
    return runWhenUiScreenReady(() => {
    const current = get().session;
    if (current?.kind === 'adhoc' && payload.replaceActiveAdhoc === true) {
      set({
        session: {
          kind: 'adhoc',
          adhocId: current.adhocId,
          segmentIndex: 0,
          stepIndex: 0,
          pageComplete: false,
          ready: current.ready === true,
          pack: null,
          payload,
        },
      });
      return true;
    }
    if (current) return false;
    adhocSeq += 1;
    set({
      session: {
        kind: 'adhoc',
        adhocId: `adhoc_${adhocSeq}`,
        segmentIndex: 0,
        stepIndex: 0,
        pageComplete: false,
        ready: false,
        pack: null,
        payload,
      },
    });
    beginReadyWatch();
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

  attachSessionPack: (pack) => {
    const session = get().session;
    if (!session) return;
    if (session.pack) return;
    set({ session: { ...session, pack } });
    if (pack.uniquePortraitSources.length === 0) {
      get().markPackReady();
    }
  },

  markPackReady: () => {
    clearReadyWatch();
    const session = get().session;
    if (!session || session.ready) return;
    set({ session: { ...session, ready: true } });
  },

  dismiss: () => {
    const session = get().session;
    if (!session) return;
    adhocFinishGen += 1;
    clearReadyWatch();
    readyGen += 1;
    set({ session: null });
    void finishSession(session);
  },

  dismissCancelRemaining: () => {
    const session = get().session;
    if (!session) return;
    adhocFinishGen += 1;
    clearReadyWatch();
    readyGen += 1;
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
    adhocFinishGen += 1;
    clearUiForegroundSequence();
    cancelIngameDialogFeatureLinkDelay();
    const session = get().session;
    if (!session || session.kind !== 'adhoc') return;
    if (session.payload.abortOnStageLeave !== true) return;
    clearReadyWatch();
    readyGen += 1;
    set({ session: null });
    session.payload.onCancel?.();
  },

  abortAllOnLeave: () => {
    bumpIngameDialogLeaveAbortGen();
    adhocFinishGen += 1;
    clearReadyWatch();
    readyGen += 1;
    clearUiForegroundSequence();
    cancelIngameDialogFeatureLinkDelay();
    cancelIngameDialogIdlePresentsAndNotify();
    if (!get().session) return;
    set({ session: null });
  },

  pressCancel: () => {
    const session = get().session;
    if (!session) return;
    if (session.kind === 'csv_scene') {
      if (!session.pageComplete) return;
      const canDeclineOffer = session.completionActions.some((a) => isOfferDeclineActionType(a.type));
      if (!canDeclineOffer) return;
      clearReadyWatch();
      readyGen += 1;
      set({ session: null });
      session.onDismiss?.();
      drainIngameDialogIdleCallbacks();
      return;
    }
    if (!session.pageComplete) return;
    clearReadyWatch();
    readyGen += 1;
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
      const segmentCount = session.pack
        ? session.pack.steps.length
        : resolveAdHocIngameDialogSegmentCount(
          session.payload.text,
          getActiveNarrativeDialogSplitOptions(),
        );
      const result = advanceIngameDialogSession(session, null, segmentCount);
      if (result.type === 'blocked') return;
      if (result.type === 'advanced') {
        set({ session: result.session });
        return;
      }
      const finishing = result.session;
      if (finishing.kind !== 'adhoc') return;
      const finishGen = adhocFinishGen + 1;
      adhocFinishGen = finishGen;
      void (async () => {
        for (const action of finishing.payload.completionActions ?? []) {
          await runIngameDialogCompletionBatch('none', [action]);
        }
        if (adhocFinishGen !== finishGen) return;
        const ret = finishing.payload.onDismiss?.();
        if (isThenable(ret)) await ret;
        if (adhocFinishGen !== finishGen) return;
        const cur = get().session;
        if (cur && cur !== finishing && cur.kind === 'adhoc') {
          drainIngameDialogIdleCallbacks();
          return;
        }
        clearReadyWatch();
        readyGen += 1;
        set({ session: null });
        drainIngameDialogIdleCallbacks();
      })();
      return;
    }

    const scene = getIngameDialogSceneById(session.sceneId);
    if (!scene) {
      clearReadyWatch();
      readyGen += 1;
      set({ session: null });
      drainIngameDialogIdleCallbacks();
      return;
    }

    const locale = useAppSettingsStore.getState().locale;
    const nickname = usePlayerStore.getState().player?.nickname;
    const segmentCount = session.pack
      ? 1
      : resolveIngameDialogSegmentCount(
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
    clearReadyWatch();
    readyGen += 1;
    set({ session: null });
    void finishSession(completedSession);
  },
}));

bindUiSequenceDialogBusy(() => useIngameDialogStore.getState().isActive());

// STORY_SCENES 참조 유지 — tree-shake 방지·타입 체크
void STORY_SCENES_FROM_CSV;
