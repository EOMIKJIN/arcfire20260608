// ============================================================
// 범용 오버레이 탭형 제목 헤더 — 진한 네이비 + 대각 패턴 + 흰색 타이틀
// 모든 ArcOverlayHost 카드가 동일한 제목 영역을 공유한다.
// ============================================================
import React, { memo, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, Line, Pattern, Rect } from 'react-native-svg';
import { FONTS, OVERLAY_TOKENS, SPACING } from '../../utils/theme';

const HATCH_PATTERN_ID = 'arcOverlayTitleHatchV1';

const TitleHeaderPattern = memo(function TitleHeaderPattern() {
  return (
    <View style={styles.patternLayer} pointerEvents="none">
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFillObject}>
        <Defs>
          <Pattern
            id={HATCH_PATTERN_ID}
            width={8}
            height={8}
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-45)"
          >
            <Line x1={0} y1={0} x2={0} y2={8} stroke="rgba(255, 255, 255, 0.085)" strokeWidth={1.2} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${HATCH_PATTERN_ID})`} />
      </Svg>
    </View>
  );
});

type Props = {
  title: string;
  subtitle?: string;
  /** 기본 흰색 — 패배 등 의미색만 예외 */
  titleColor?: string;
  trailing?: ReactNode;
};

export const ArcOverlayTitleHeader = memo(function ArcOverlayTitleHeader({
  title,
  subtitle,
  titleColor = OVERLAY_TOKENS.titleHeaderTitleColor,
  trailing,
}: Props) {
  const hasTrailing = trailing != null;
  return (
    <View style={styles.shell}>
      <View style={styles.accentTop} pointerEvents="none" />
      <TitleHeaderPattern />
      <View style={[styles.content, hasTrailing ? styles.contentWithTrailing : null]}>
        <View style={[styles.textBlock, hasTrailing ? styles.textBlockTrailing : null]}>
          <Text
            style={[styles.title, hasTrailing ? styles.titleLeading : null, { color: titleColor }]}
            numberOfLines={2}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={[styles.subtitle, hasTrailing ? styles.subtitleLeading : null]}
              numberOfLines={2}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
        {hasTrailing ? <View style={styles.trailing}>{trailing}</View> : null}
      </View>
      <View style={styles.bottomRule} pointerEvents="none" />
    </View>
  );
});

const styles = StyleSheet.create({
  shell: {
    width: '100%',
    backgroundColor: OVERLAY_TOKENS.titleHeaderBg,
    overflow: 'hidden',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    minHeight: 44,
  },
  patternLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  accentTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: OVERLAY_TOKENS.titleHeaderTopAccent,
    zIndex: 2,
  },
  content: {
    position: 'relative',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    zIndex: 3,
    alignItems: 'center',
  },
  contentWithTrailing: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  textBlock: {
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  textBlockTrailing: {
    flex: 1,
    alignItems: 'flex-start',
  },
  trailing: {
    flexShrink: 0,
    paddingTop: 2,
  },
  title: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    letterSpacing: 1,
    textAlign: 'center',
  },
  titleLeading: {
    textAlign: 'left',
    letterSpacing: 0.5,
    fontSize: FONTS.size.lg,
  },
  subtitle: {
    marginTop: SPACING.xs,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: OVERLAY_TOKENS.titleHeaderSubtitleColor,
    textAlign: 'center',
    lineHeight: 16,
  },
  subtitleLeading: {
    textAlign: 'left',
    lineHeight: 18,
  },
  bottomRule: {
    position: 'absolute',
    bottom: 0,
    left: SPACING.md,
    right: SPACING.md,
    height: StyleSheet.hairlineWidth,
    backgroundColor: OVERLAY_TOKENS.titleHeaderBorder,
  },
});
