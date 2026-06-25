// ============================================================
// 범용 오버레이 카드 셸 — header + body(+scroll) + footerDock 레이아웃 정본
// footer는 body 밖(card 직속) — overflow:hidden·스크롤에 버튼 가림 방지
// ============================================================
import React, { memo, useMemo, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import { OVERLAY_TOKENS, SPACING } from '../../utils/theme';
import { ArcOverlayTitleHeader } from './ArcOverlayTitleHeader';
import type { ArcOverlayVisualTheme } from './tacticalOverlayPreview';
import { tacticalOverlayCardStyles } from './tacticalOverlayStyles';
import { resolveOverlayPanelTitles } from './overlayPanelTitles';
import {
  OVERLAY_CARD_LAYOUT,
  OVERLAY_FOOTER_DOCK_MIN_HEIGHT,
  OVERLAY_PANEL_BODY_PADDING_TOP_PX,
  OVERLAY_PANEL_CARD_MAX_HEIGHT_PCT,
  OVERLAY_PANEL_CARD_MIN_HEIGHT_PCT,
  resolveOverlayPanelMaxHeight,
  resolveOverlayPanelMinHeight,
} from './overlayPanelLayout';

export type ArcOverlayCardLayout = 'compact' | 'panel';

type Props = {
  title: string;
  subtitle?: string;
  titleColor?: string;
  trailing?: ReactNode;
  /** panel 전용 — ScrollView 위 고정 블록(초상화·배너 등) */
  panelPrefix?: ReactNode;
  /** panel 전용 — bodyPanel padding 밖 카드 전폭(행성 이미지 등) */
  panelBleedPrefix?: ReactNode;
  layout?: ArcOverlayCardLayout;
  /** bounded 카드에서 flex 보조 — 미전달 시 flex:1 스크롤만 사용 */
  scrollMaxHeight?: number;
  minHeight?: number | `${number}%`;
  maxHeight?: number | `${number}%`;
  footer?: ReactNode;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  bodyStyle?: StyleProp<ViewStyle>;
  /** phosphor(기본) · tactical(G-ARCHIVE 라이트 카드 시험) */
  visualTheme?: ArcOverlayVisualTheme;
};

export const ArcOverlayCard = memo(function ArcOverlayCard({
  title,
  subtitle,
  titleColor,
  trailing,
  panelPrefix,
  panelBleedPrefix,
  layout = 'compact',
  scrollMaxHeight,
  minHeight,
  maxHeight,
  footer,
  children,
  style,
  bodyStyle,
  visualTheme = 'phosphor',
}: Props) {
  const { height: winH } = useWindowDimensions();
  const isPanel = layout === 'panel';
  const isTactical = visualTheme === 'tactical';
  const hasFooter = footer != null;
  const panelMinPx = useMemo(() => resolveOverlayPanelMinHeight(winH), [winH]);
  const panelMaxPx = useMemo(() => resolveOverlayPanelMaxHeight(winH), [winH]);
  const resolvedMinHeight =
    minHeight
    ?? (isPanel ? panelMinPx : hasFooter ? OVERLAY_PANEL_CARD_MIN_HEIGHT_PCT : undefined);
  const resolvedMaxHeight =
    maxHeight
    ?? (isPanel ? panelMaxPx : hasFooter ? OVERLAY_PANEL_CARD_MAX_HEIGHT_PCT : undefined);
  const resolvedBodyStyle = isPanel
    ? [{ paddingTop: OVERLAY_PANEL_BODY_PADDING_TOP_PX }, bodyStyle]
    : bodyStyle;
  const isBounded = resolvedMinHeight != null || resolvedMaxHeight != null;
  const resolvedTitles = useMemo(
    () => resolveOverlayPanelTitles(visualTheme, title, subtitle),
    [visualTheme, title, subtitle],
  );

  return (
    <View
      style={[
        styles.card,
        isTactical ? tacticalOverlayCardStyles.card : null,
        isBounded ? styles.cardBounded : null,
        resolvedMinHeight != null ? { minHeight: resolvedMinHeight } : null,
        resolvedMaxHeight != null ? { maxHeight: resolvedMaxHeight } : null,
        style,
      ]}
    >
      <View style={styles.headerWrap}>
        <ArcOverlayTitleHeader
          title={resolvedTitles.title}
          subtitle={resolvedTitles.subtitle}
          titleColor={titleColor}
          trailing={trailing}
          visualTheme={visualTheme}
        />
      </View>
      {isPanel && panelBleedPrefix ? (
        <View style={styles.panelBleedWrap}>{panelBleedPrefix}</View>
      ) : null}
      {isPanel ? (
        <>
          <View
            style={[
              styles.bodyPanel,
              isTactical ? tacticalOverlayCardStyles.bodyPanel : null,
              isBounded ? styles.bodyPanelBounded : null,
              resolvedBodyStyle,
            ]}
          >
            {panelPrefix ? <View style={styles.panelPrefixWrap}>{panelPrefix}</View> : null}
            <ScrollView
              style={[
                isBounded ? styles.scrollBounded : null,
                !isBounded && scrollMaxHeight != null ? { maxHeight: scrollMaxHeight } : null,
              ]}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
              {children}
            </ScrollView>
          </View>
          {hasFooter ? (
            <View style={[styles.footerDock, isTactical ? tacticalOverlayCardStyles.footerDock : null]}>
              {footer}
            </View>
          ) : null}
        </>
      ) : (
        <>
          <View
            style={[
              styles.bodyCompact,
              isBounded ? styles.bodyCompactBounded : null,
              isTactical ? tacticalOverlayCardStyles.bodyPanel : null,
              bodyStyle,
            ]}
          >
            {children}
          </View>
          {hasFooter ? (
            <View style={[styles.footerDock, isTactical ? tacticalOverlayCardStyles.footerDock : null]}>
              {footer}
            </View>
          ) : null}
        </>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    ...OVERLAY_CARD_LAYOUT,
    flexDirection: 'column',
    alignItems: 'stretch',
    borderWidth: 1.5,
    borderColor: OVERLAY_TOKENS.phosphorBorder,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: OVERLAY_TOKENS.phosphorCardBg,
    flexShrink: 0,
  },
  cardBounded: {
    flexDirection: 'column',
  },
  headerWrap: {
    flexShrink: 0,
  },
  panelBleedWrap: {
    alignSelf: 'stretch',
    width: '100%',
    flexShrink: 0,
  },
  bodyCompact: {
    alignSelf: 'stretch',
    width: '100%',
    padding: SPACING.xl,
    paddingBottom: SPACING.lg,
    alignItems: 'center',
  },
  bodyCompactBounded: {
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 0,
    justifyContent: 'center',
  },
  bodyPanel: {
    alignSelf: 'stretch',
    width: '100%',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  bodyPanelBounded: {
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 0,
  },
  panelPrefixWrap: {
    flexShrink: 0,
  },
  scrollBounded: {
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 0,
  },
  scrollContent: {
    paddingBottom: SPACING.sm,
    flexGrow: 1,
  },
  footerDock: {
    flexShrink: 0,
    alignSelf: 'stretch',
    borderTopWidth: 1,
    borderTopColor: OVERLAY_TOKENS.phosphorBorder,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    minHeight: OVERLAY_FOOTER_DOCK_MIN_HEIGHT,
    backgroundColor: 'rgba(8, 14, 24, 0.96)',
  },
});
