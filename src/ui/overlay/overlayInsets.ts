import { STAGE_BOTTOM_MIN_INSET_PX } from '../../stages/layout';

export type EdgeInsetsLike = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

/** 오버레이 패딩용 — StageShell 과 동일한 하단 최소 inset 보충 */
export function resolveOverlayEdgeInsets(insets: EdgeInsetsLike): EdgeInsetsLike {
  return {
    top: insets.top,
    bottom: Math.max(insets.bottom, STAGE_BOTTOM_MIN_INSET_PX),
    left: insets.left,
    right: insets.right,
  };
}

/** 하단 정렬 narrative/dialog — magic number(72) 대신 단일 소스 */
export function resolveOverlayBottomAnchorPad(insets: EdgeInsetsLike, extraPx = 0): number {
  return Math.max(insets.bottom, STAGE_BOTTOM_MIN_INSET_PX) + extraPx;
}
