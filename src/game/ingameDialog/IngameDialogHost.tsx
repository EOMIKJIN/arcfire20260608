// ============================================================
// IngameDialogHost — 루트 단일 narrative 오버레이 (ArcOverlayHost 연동)
// ============================================================

import React, { memo, useEffect, useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

export const IngameDialogHost = memo(function IngameDialogHost() {
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const edges = resolveOverlayEdgeInsets(insets);
  const session = useIngameDialogStore((s) => s.session);
  const pressNext = useIngameDialogStore((s) => s.pressNext);
  const markPageComplete = useIngameDialogStore((s) => s.markPageComplete);
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

  const viewModel = useMemo(() => {
    if (!session) return null;
    return buildIngameDialogViewModel({ session, scene, locale, nickname, splitOptions });
  }, [session, scene, locale, nickname, splitOptions]);

  const config = useMemo((): ArcNarrativeOverlayConfig | null => {
    if (!session || !viewModel) return null;
    return {
      anchor: NARRATIVE_DIALOG_LAYOUT.popupAnchor,
      label: viewModel.label,
      text: viewModel.text,
      typewriterKey: viewModel.typewriterKey,
      typewriterSpeedMs: viewModel.typewriterSpeedMs,
      onTextComplete: markPageComplete,
      imageSource: viewModel.imageSource,
      maxLines: viewModel.maxLines,
      onPressNext: pressNext,
      nextDisabled: viewModel.nextDisabled,
      buttonText: viewModel.buttonText,
      showActionButton: viewModel.hasMoreDialogue || viewModel.isFinalStep,
    };
  }, [session, viewModel, markPageComplete, pressNext]);

  useArcNarrativeOverlay(INGAME_DIALOG_OVERLAY_ID, Boolean(session), config);

  return null;
});
