import { useMemo } from 'react';
import { useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { resolveOverlayContentHeight } from './overlayInsets';
import {
  OVERLAY_PANEL_BODY_PADDING_TOP_PX,
  resolveOverlayPanelCardBudget,
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
  const insets = useSafeAreaInsets();
  return useMemo(() => {
    const layoutHeight = resolveOverlayContentHeight(winH, insets);
    const budget = resolveOverlayPanelCardBudget(winH, insets);
    return {
      minHeight: Math.min(resolveOverlayPanelMinHeight(layoutHeight), budget),
      maxHeight: Math.min(resolveOverlayPanelMaxHeight(layoutHeight), budget),
      bodyStyle: { paddingTop: OVERLAY_PANEL_BODY_PADDING_TOP_PX },
    };
  }, [winH, insets.top, insets.bottom, insets.left, insets.right]);
}

/** @deprecated `useOverlayPanelChrome` */
export function usePlanetOverlayPanelChrome(): ReturnType<typeof useOverlayPanelChrome> {
  return useOverlayPanelChrome();
}
