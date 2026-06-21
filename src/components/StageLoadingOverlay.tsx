// ============================================================
// 스테이지 내 실제 대기 — ArcOverlayHost blocking kind 위임
// ============================================================

import React, { useLayoutEffect, useState } from 'react';
import { useArcOverlayStore } from '../ui/overlay/arcOverlayStore';

/** 1프레임짜리 ready 토글로 LOADING 오버레이가 깜빡이지 않도록 지연 */
const SHOW_DEBOUNCE_MS = 120;

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
  const [showOverlay, setShowOverlay] = useState(false);

  useLayoutEffect(() => {
    if (!visible) {
      setShowOverlay(false);
      return;
    }
    const t = setTimeout(() => setShowOverlay(true), SHOW_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [visible]);

  useLayoutEffect(() => {
    if (!showOverlay) {
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
  }, [showOverlay, overlayId, label]);

  return null;
}
