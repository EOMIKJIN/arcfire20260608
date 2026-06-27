import React, { memo } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { FONTS, OVERLAY_TOKENS, SPACING } from '../../../utils/theme';
import type { ArcOverlayVisualTheme } from '../tacticalOverlayPreview';
import {
  PLANET_DEV_LIST_DESCRIPTION_BLOCK_HEIGHT_PX,
  PLANET_DEV_LIST_DESCRIPTION_LINE_HEIGHT_PX,
  PLANET_DEV_LIST_DESCRIPTION_LINES,
  PLANET_INFO_DESCRIPTION_BLOCK_HEIGHT_PX,
  PLANET_INFO_DESCRIPTION_LINE_HEIGHT_PX,
  PLANET_INFO_DESCRIPTION_LINES,
} from '../overlayPanelLayout';
import { TACTICAL_OVERLAY } from '../tacticalOverlayStyles';

type Props = {
  /** planets.csv — `resolvePlanetTableDescription` / 스냅샷 `planetDescription` */
  description: string;
  visualTheme?: ArcOverlayVisualTheme;
  /** panelPrefix 첫 블록 — bodyPanel paddingTop 만으로 간격 확보 */
  compactTop?: boolean;
  /** 행성개발 목록 — 3줄·xs (줄바꿈은 CSV/i18n `\n`만) */
  variant?: 'planetInfo' | 'devList';
};

const androidTextFix = Platform.OS === 'android' ? { includeFontPadding: false as const } : null;

/** 행성 정보창 — 초상화 이미지 바로 아래 설명 */
export const PlanetInfoDescriptionBlock = memo(function PlanetInfoDescriptionBlock({
  description,
  visualTheme = 'phosphor',
  compactTop = false,
  variant = 'planetInfo',
}: Props) {
  const isTactical = visualTheme === 'tactical';
  const isDevList = variant === 'devList';
  const trimmed = description.trim();
  if (!trimmed) return null;

  const lineCount = isDevList ? PLANET_DEV_LIST_DESCRIPTION_LINES : PLANET_INFO_DESCRIPTION_LINES;
  const lineHeight = isDevList
    ? PLANET_DEV_LIST_DESCRIPTION_LINE_HEIGHT_PX
    : PLANET_INFO_DESCRIPTION_LINE_HEIGHT_PX;
  const blockHeight = isDevList
    ? PLANET_DEV_LIST_DESCRIPTION_BLOCK_HEIGHT_PX
    : PLANET_INFO_DESCRIPTION_BLOCK_HEIGHT_PX - SPACING.sm;

  const textStyle = [
    styles.block,
    compactTop ? styles.blockCompactTop : null,
    isDevList ? styles.blockDevList : null,
    isTactical ? styles.blockTactical : styles.blockPhosphor,
    { lineHeight },
    androidTextFix,
    isDevList
      ? { minHeight: blockHeight }
      : { minHeight: blockHeight, maxHeight: blockHeight },
  ];

  if (isDevList) {
    return (
      <View
        style={[
          styles.devListSummaryRegion,
          compactTop ? styles.blockCompactTop : null,
        ]}
      >
        <Text style={textStyle} numberOfLines={lineCount}>
          {trimmed}
        </Text>
      </View>
    );
  }

  return (
    <Text style={textStyle} numberOfLines={lineCount}>
      {trimmed}
    </Text>
  );
});

export { PLANET_INFO_DESCRIPTION_BLOCK_HEIGHT_PX };

const styles = StyleSheet.create({
  block: {
    marginTop: SPACING.sm,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    textAlign: 'left',
  },
  devListSummaryRegion: {
    marginTop: SPACING.xs,
    alignSelf: 'stretch',
  },
  blockDevList: {
    marginTop: 0,
    fontSize: FONTS.size.xs,
  },
  blockCompactTop: {
    marginTop: 0,
  },
  blockPhosphor: {
    color: OVERLAY_TOKENS.valueContentColor,
    opacity: 0.92,
  },
  blockTactical: {
    color: TACTICAL_OVERLAY.bodyInk,
  },
});
