import React, { memo } from 'react';
import { StyleSheet, Text } from 'react-native';
import { FONTS, OVERLAY_TOKENS, SPACING } from '../../../utils/theme';
import type { ArcOverlayVisualTheme } from '../tacticalOverlayPreview';
import {
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
};

/** 행성 정보창 — 초상화 이미지 바로 아래 3줄 설명 */
export const PlanetInfoDescriptionBlock = memo(function PlanetInfoDescriptionBlock({
  description,
  visualTheme = 'phosphor',
  compactTop = false,
}: Props) {
  const isTactical = visualTheme === 'tactical';
  const trimmed = description.trim();
  if (!trimmed) return null;

  return (
    <Text
      style={[
        styles.block,
        compactTop ? styles.blockCompactTop : null,
        isTactical ? styles.blockTactical : styles.blockPhosphor,
      ]}
      numberOfLines={PLANET_INFO_DESCRIPTION_LINES}
    >
      {trimmed}
    </Text>
  );
});

export { PLANET_INFO_DESCRIPTION_BLOCK_HEIGHT_PX };

const styles = StyleSheet.create({
  block: {
    marginTop: SPACING.sm,
    minHeight: PLANET_INFO_DESCRIPTION_BLOCK_HEIGHT_PX - SPACING.sm,
    maxHeight: PLANET_INFO_DESCRIPTION_BLOCK_HEIGHT_PX - SPACING.sm,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    lineHeight: PLANET_INFO_DESCRIPTION_LINE_HEIGHT_PX,
    textAlign: 'left',
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
