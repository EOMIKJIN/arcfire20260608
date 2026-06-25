import { useMemo } from 'react';
import { useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import {
  OVERLAY_PANEL_BODY_PADDING_TOP_PX,
  resolveOverlayPanelMaxHeight,
  resolveOverlayPanelMinHeight,
} from './overlayPanelLayout';

/** `layout="panel"` 카드 — min/max 높이·body 패딩 (ArcOverlayCard 기본값과 동일) */
export function useOverlayPanelChrome(): {
  minHeight: number;
  maxHeight: number;
  bodyStyle: StyleProp<ViewStyle>;
} {
  const { height: winH } = useWindowDimensions();
  return useMemo(
    () => ({
      minHeight: resolveOverlayPanelMinHeight(winH),
      maxHeight: resolveOverlayPanelMaxHeight(winH),
      bodyStyle: { paddingTop: OVERLAY_PANEL_BODY_PADDING_TOP_PX },
    }),
    [winH],
  );
}

/** @deprecated `useOverlayPanelChrome` */
export function usePlanetOverlayPanelChrome(): ReturnType<typeof useOverlayPanelChrome> {
  return useOverlayPanelChrome();
}
