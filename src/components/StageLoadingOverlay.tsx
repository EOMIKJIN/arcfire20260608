// ============================================================
// 스테이지 내 실제 대기 — ArcOverlayHost blocking kind 위임
// ============================================================

import React, { useLayoutEffect } from 'react';
import { useArcOverlayStore } from '../ui/overlay/arcOverlayStore';

type Props = {
  visible: boolean;
  /** 기본 LOADING.... */
  label?: string;
  /** 화면별 고유 id — 미지정 시 stage-loading */
  overlayId?: string;
};

export function StageLoadingOverlay({
  visible,
  label = 'LOADING....',
  overlayId = 'stage-loading',
}: Props) {
  // useEffect 는 paint 뒤 — replace 직후 1프레임 공백. layout 직후 present 로 전환 직후 깜빡임 방지.
  useLayoutEffect(() => {
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
        message: label,
        dismissOnBackdrop: false,
      });
    } else {
      state.patchOverlay(overlayId, { message: label });
    }
    return () => {
      useArcOverlayStore.getState().dismissWhere((e) => e.id === overlayId);
    };
  }, [visible, overlayId, label]);
  return null;
}
