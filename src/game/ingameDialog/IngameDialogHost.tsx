// ============================================================
// IngameDialogHost — 루트 단일 narrative 오버레이 (ArcOverlayHost 연동)
// ============================================================

import React, { memo, useEffect, useLayoutEffect, useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { prefetchImageSources } from '../../assetPipeline/prefetchImageSources';
import { useArcNarrativeOverlay } from '../../ui/overlay/useArcNarrativeOverlay';
import type { ArcNarrativeOverlayConfig } from '../../ui/overlay/useArcNarrativeOverlay';
import { resolveOverlayEdgeInsets } from '../../ui/overlay/overlayInsets';
import { NARRATIVE_DIALOG_LAYOUT } from '../../ui/overlay/narrativeDialogLayout';
import {
  setActiveNarrativeDialogSplitOptions,
  type NarrativeDialogSplitOptions,
} from '../../ui/overlay/splitNarrativeDialogSegments';
import { useAppSettingsStore } from '../../store/appSettingsStore';
import { usePlayerStore } from '../../store/playerStore';
import { useIngameDialogStore } from '../../store/ingameDialogStore';
import { getIngameDialogSceneById } from './ingameDialogSceneIndex';
import { buildIngameDialogViewModel } from './ingameDialogViewModel';
import { INGAME_DIALOG_OVERLAY_ID } from './ingameDialogTypes';
import {
  buildAdhocIngameDialogSessionPack,
  buildCsvIngameDialogSessionPack,
} from './ingameDialogSessionPack';
import { IngameDialogPortraitWarmer } from './IngameDialogPortraitWarmer';
import {
  resolveSessionAutoDismissKey,
  resolveSessionAutoDismissMode,
  resolveSessionAutoDismissMs,
  shouldArmSessionAutoDismiss,
} from './ingameDialogAutoDismiss';

export const IngameDialogHost = memo(function IngameDialogHost() {
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const edges = resolveOverlayEdgeInsets(insets);
  const session = useIngameDialogStore((s) => s.session);
  const pressNext = useIngameDialogStore((s) => s.pressNext);
  const pressCancel = useIngameDialogStore((s) => s.pressCancel);
  const dismiss = useIngameDialogStore((s) => s.dismiss);
  const dismissCancelRemaining = useIngameDialogStore((s) => s.dismissCancelRemaining);
  const markPageComplete = useIngameDialogStore((s) => s.markPageComplete);
  const attachSessionPack = useIngameDialogStore((s) => s.attachSessionPack);
  const markPackReady = useIngameDialogStore((s) => s.markPackReady);
  const locale = useAppSettingsStore((s) => s.locale);
  const nickname = usePlayerStore((s) => s.player?.nickname);

  const splitOptions = useMemo((): NarrativeDialogSplitOptions => ({
    windowWidth,
    widthInsets: {
      safeLeft: edges.left,
      safeRight: edges.right,
      hostHorizontalPadPx: NARRATIVE_DIALOG_LAYOUT.hostHorizontalPadPx,
    },
  }), [windowWidth, edges.left, edges.right]);

  useEffect(() => {
    if (!session) {
      setActiveNarrativeDialogSplitOptions(undefined);
      return;
    }
    setActiveNarrativeDialogSplitOptions(splitOptions);
    return () => setActiveNarrativeDialogSplitOptions(undefined);
  }, [session, splitOptions]);

  const scene = session?.kind === 'csv_scene' ? getIngameDialogSceneById(session.sceneId) : null;

  useLayoutEffect(() => {
    if (!session || session.pack) return;
    if (session.kind === 'csv_scene') {
      if (!scene) return;
      attachSessionPack(buildCsvIngameDialogSessionPack({
        scene,
        locale,
        nickname,
        context: session.context,
        splitOptions,
        completionActionTypes: session.completionActions.map((a) => a.type),
      }));
      return;
    }
    const payload = session.payload;
    attachSessionPack(buildAdhocIngameDialogSessionPack({
      adhocId: session.adhocId,
      label: payload.label,
      text: payload.text,
      typewriterSpeedMs: payload.typewriterSpeedMs,
      imageSource: payload.imageSource,
      portraitScale: payload.portraitScale,
      buttonText: payload.buttonText,
      secondaryButtonText: payload.secondaryButtonText,
      showAcceptCancelChoice: payload.showAcceptCancelChoice,
      completionActionTypes: payload.completionActions?.map((a) => a.type),
      locale,
      splitOptions,
    }));
  }, [session, scene, locale, nickname, splitOptions, attachSessionPack]);

  useEffect(() => {
    const sources = session?.pack?.uniquePortraitSources;
    if (!sources || sources.length === 0) return;
    void prefetchImageSources(sources);
  }, [session?.pack]);

  const overlayVisible = session?.ready === true;

  const viewModel = useMemo(() => {
    if (!session || !overlayVisible) return null;
    return buildIngameDialogViewModel({ session, scene, locale, nickname, splitOptions });
  }, [session, overlayVisible, scene, locale, nickname, splitOptions]);

  const config = useMemo((): ArcNarrativeOverlayConfig | null => {
    if (!session || !viewModel) return null;
    return {
      anchor: NARRATIVE_DIALOG_LAYOUT.popupAnchor,
      label: viewModel.label,
      text: viewModel.text,
      typewriterKey: viewModel.typewriterKey,
      typewriterSpeedMs: viewModel.typewriterSpeedMs,
      typewriterActive: true,
      onTextComplete: markPageComplete,
      imageSource: viewModel.imageSource,
      portraitScale: viewModel.portraitScale,
      maxLines: viewModel.maxLines,
      onPressNext: pressNext,
      onPressSecondary: viewModel.showAcceptCancelChoice ? pressCancel : undefined,
      nextDisabled: viewModel.nextDisabled,
      buttonText: viewModel.buttonText,
      secondaryButtonText: viewModel.secondaryButtonText,
      showActionButton: viewModel.hasMoreDialogue || viewModel.isFinalStep,
    };
  }, [session, viewModel, markPageComplete, pressNext, pressCancel]);

  useArcNarrativeOverlay(
    INGAME_DIALOG_OVERLAY_ID,
    overlayVisible && Boolean(viewModel),
    config,
  );

  const autoDismissKey = resolveSessionAutoDismissKey(session);
  const autoDismissMs = resolveSessionAutoDismissMs(session);
  const autoDismissArmed = overlayVisible && shouldArmSessionAutoDismiss(
    session,
    Boolean(viewModel?.isFinalStep),
  );
  useEffect(() => {
    if (!autoDismissArmed || !autoDismissKey || autoDismissMs <= 0) return;
    const key = autoDismissKey;
    const timer = setTimeout(() => {
      const cur = useIngameDialogStore.getState().session;
      if (resolveSessionAutoDismissKey(cur) !== key) return;
      if (resolveSessionAutoDismissMode(cur) === 'first_idle') {
        dismissCancelRemaining();
        return;
      }
      dismiss();
    }, autoDismissMs);
    return () => clearTimeout(timer);
  }, [autoDismissArmed, autoDismissKey, autoDismissMs, dismiss, dismissCancelRemaining]);

  const warmerSources = session?.pack?.uniquePortraitSources;
  const warmerKey = session
    ? (session.kind === 'csv_scene' ? session.sceneId : session.adhocId)
    : 'idle';

  if (!session || !warmerSources || warmerSources.length === 0) {
    return null;
  }

  return (
    <IngameDialogPortraitWarmer
      key={warmerKey}
      sources={warmerSources}
      onWarmed={markPackReady}
    />
  );
});
