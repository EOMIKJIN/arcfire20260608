// ============================================================
// 스테이지 내 실제 대기 — ArcOverlayHost blocking kind 위임
// ============================================================

import React from 'react';
import { useArcBlockingOverlay } from '../ui/overlay/useArcBlockingOverlay';

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
  useArcBlockingOverlay(overlayId, visible, label);
  return null;
}
