import { useEffect } from 'react';
import { useArcOverlayStore } from './arcOverlayStore';

/** 스테이지 로딩 등 — 루트 blocking kind */
export function useArcBlockingOverlay(
  overlayId: string,
  visible: boolean,
  message?: string,
): void {
  useEffect(() => {
    if (!visible) {
      useArcOverlayStore.getState().dismissWhere((e) => e.id === overlayId);
      return;
    }
    const state = useArcOverlayStore.getState();
    const existing = state.stack.find((e) => e.id === overlayId);
    if (!existing) {
      state.present({
        id: overlayId,
        kind: 'blocking',
        message,
        dismissOnBackdrop: false,
      });
    } else {
      state.patchOverlay(overlayId, { message });
    }
    return () => {
      useArcOverlayStore.getState().dismissWhere((e) => e.id === overlayId);
    };
  }, [visible, overlayId, message]);
}
