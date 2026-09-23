import { useEffect } from 'react';
import { useArcOverlayStore, type ArcOverlayNarrativeEntry } from './arcOverlayStore';
import {
  isNarrativeOverlayContentChanged,
  resolveNarrativeOverlayWrite,
} from './narrativeOverlaySync';

export type ArcNarrativeOverlayConfig = Omit<
  ArcOverlayNarrativeEntry,
  'id' | 'kind' | 'dismissOnBackdrop'
>;

/**
 * 화면 state → 루트 ArcOverlayHost narrative 동기.
 * 페이지(typewriterKey/text) 변경은 patch 만. dismiss 는 창을 닫을 때·언마운트만.
 */
export function useArcNarrativeOverlay(
  overlayId: string,
  visible: boolean,
  config: ArcNarrativeOverlayConfig | null,
): void {
  useEffect(() => {
    const state = useArcOverlayStore.getState();
    const existing = state.stack.find((e) => e.id === overlayId);
    const write = resolveNarrativeOverlayWrite(
      visible,
      Boolean(config),
      existing?.kind === 'narrative',
      Boolean(
        config
        && existing?.kind === 'narrative'
        && isNarrativeOverlayContentChanged({
          existingTypewriterKey: existing.typewriterKey,
          existingText: existing.text,
          existingLabel: existing.label,
          existingPortraitScale: existing.portraitScale,
          nextTypewriterKey: config.typewriterKey,
          nextText: config.text,
          nextLabel: config.label,
          nextPortraitScale: config.portraitScale,
          imageChanged: existing.imageSource !== config.imageSource,
        }),
      ),
    );
    if (write === 'dismiss') {
      state.dismissWhere((e) => e.id === overlayId);
      return;
    }
    if (!config) return;
    const entry: ArcOverlayNarrativeEntry = {
      id: overlayId,
      kind: 'narrative',
      dismissOnBackdrop: false,
      showActionButton: true,
      ...config,
    };
    if (write === 'present') {
      state.present(entry);
      return;
    }
    if (write === 'patch') {
      state.patchOverlay(overlayId, entry);
    }
  }, [
    visible,
    overlayId,
    config?.typewriterKey,
    config?.text,
    config?.label,
    config?.anchor,
    config?.typewriterSpeedMs,
    config?.imageSource,
    config?.portraitScale,
  ]);

  useEffect(() => {
    return () => {
      useArcOverlayStore.getState().dismissWhere((e) => e.id === overlayId);
    };
  }, [overlayId]);

  useEffect(() => {
    if (!visible || !config) return;
    useArcOverlayStore.getState().patchOverlay(overlayId, {
      nextDisabled: config.nextDisabled,
      buttonText: config.buttonText,
      onPressNext: config.onPressNext,
      secondaryButtonText: config.secondaryButtonText,
      onPressSecondary: config.onPressSecondary,
      onTextComplete: config.onTextComplete,
      showActionButton: config.showActionButton,
    });
  }, [
    visible,
    overlayId,
    config?.nextDisabled,
    config?.buttonText,
    config?.secondaryButtonText,
    config?.showActionButton,
    config?.onPressNext,
    config?.onPressSecondary,
    config?.onTextComplete,
  ]);
}
