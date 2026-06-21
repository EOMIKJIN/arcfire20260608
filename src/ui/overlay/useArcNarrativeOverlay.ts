import { useEffect } from 'react';
import { useArcOverlayStore, type ArcOverlayNarrativeEntry } from './arcOverlayStore';

export type ArcNarrativeOverlayConfig = Omit<
  ArcOverlayNarrativeEntry,
  'id' | 'kind' | 'dismissOnBackdrop'
>;

/**
 * 화면 state → 루트 ArcOverlayHost narrative 동기.
 * typewriterKey 변경 시에만 재마운트, nextDisabled 등은 patchOverlay 로 갱신.
 */
export function useArcNarrativeOverlay(
  overlayId: string,
  visible: boolean,
  config: ArcNarrativeOverlayConfig | null,
): void {
  useEffect(() => {
    if (!visible || !config) {
      useArcOverlayStore.getState().dismissWhere((e) => e.id === overlayId);
      return;
    }
    const state = useArcOverlayStore.getState();
    const existing = state.stack.find((e) => e.id === overlayId);
    const entry: ArcOverlayNarrativeEntry = {
      id: overlayId,
      kind: 'narrative',
      dismissOnBackdrop: false,
      showActionButton: true,
      ...config,
    };
    if (!existing) {
      state.present(entry);
    } else if (existing.kind === 'narrative') {
      const contentChanged =
        existing.typewriterKey !== config.typewriterKey
        || existing.text !== config.text
        || existing.label !== config.label
        || existing.imageSource !== config.imageSource;
      if (contentChanged) {
        state.patchOverlay(overlayId, entry);
      }
    }
    return () => {
      useArcOverlayStore.getState().dismissWhere((e) => e.id === overlayId);
    };
  }, [
    visible,
    overlayId,
    config?.typewriterKey,
    config?.text,
    config?.label,
    config?.anchor,
    config?.typewriterSpeedMs,
    config?.imageSource,
  ]);

  useEffect(() => {
    if (!visible || !config) return;
    useArcOverlayStore.getState().patchOverlay(overlayId, {
      nextDisabled: config.nextDisabled,
      buttonText: config.buttonText,
      onPressNext: config.onPressNext,
      onTextComplete: config.onTextComplete,
      showActionButton: config.showActionButton,
    });
  }, [
    visible,
    overlayId,
    config?.nextDisabled,
    config?.buttonText,
    config?.showActionButton,
    config?.onPressNext,
    config?.onTextComplete,
  ]);
}
