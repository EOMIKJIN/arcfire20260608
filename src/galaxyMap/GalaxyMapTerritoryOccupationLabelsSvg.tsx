import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { G, Text as SvgText } from 'react-native-svg';
import type { GalaxyTerritoryOccupationLabel } from './buildGalaxyTerritoryVoronoi';
import { GALAXY_MAP_LABELS_AS_RN_TEXT } from './GalaxyMapSystemsSvg';
import { withSvgPaintAlpha } from './svgPaintAlpha';

type Props = {
  labels: GalaxyTerritoryOccupationLabel[];
  nationLabelBySide: Record<'blue' | 'red' | 'independent', string>;
};

/** 점령 국가명 — 성계 노드 위 레이어 · 흰색 70% */
const TERRITORY_LABEL = {
  fill: '#F0F3FA',
  fontSize: 13,
  fontWeight: '700' as const,
  opacity: 0.7,
  stroke: 'rgba(6,10,20,0.28)',
  strokeWidth: 0.45,
};

const TERRITORY_LABEL_LINE_H = 16;
const TERRITORY_LABEL_BOX_W = 200;

/** 복구 스위치(GALAXY_MAP_LABELS_AS_RN_TEXT) OFF 때만 SVG 비트맵에 굽는다. */
export const GalaxyMapTerritoryOccupationLabelsSvg = memo(function GalaxyMapTerritoryOccupationLabelsSvg({
  labels,
  nationLabelBySide,
}: Props) {
  if (GALAXY_MAP_LABELS_AS_RN_TEXT || labels.length === 0) return null;

  return (
    <G pointerEvents="none">
      {labels.map((label) => (
        <SvgText
          key={`occ-label-${label.key}`}
          x={label.x}
          y={label.y}
          fill={withSvgPaintAlpha(TERRITORY_LABEL.fill, TERRITORY_LABEL.opacity)}
          fontSize={TERRITORY_LABEL.fontSize}
          fontWeight={TERRITORY_LABEL.fontWeight}
          textAnchor="middle"
          alignmentBaseline="middle"
          stroke={withSvgPaintAlpha(TERRITORY_LABEL.stroke, TERRITORY_LABEL.opacity)}
          strokeWidth={TERRITORY_LABEL.strokeWidth}
        >
          {nationLabelBySide[label.factionSide]}
        </SvgText>
      ))}
    </G>
  );
});

/** 점령 국가명 RN Text — 지도 카메라 View 아래 1x 좌표. (x, y) = 글자 중심 */
export const GalaxyMapTerritoryOccupationLabelsOverlay = memo(function GalaxyMapTerritoryOccupationLabelsOverlay({
  labels,
  nationLabelBySide,
}: Props) {
  if (!GALAXY_MAP_LABELS_AS_RN_TEXT || labels.length === 0) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {labels.map((label) => (
        <Text
          key={`occ-label-${label.key}`}
          allowFontScaling={false}
          numberOfLines={1}
          style={[
            styles.label,
            {
              left: label.x - TERRITORY_LABEL_BOX_W / 2,
              top: label.y - TERRITORY_LABEL_LINE_H / 2,
            },
          ]}
        >
          {nationLabelBySide[label.factionSide]}
        </Text>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  label: {
    position: 'absolute',
    width: TERRITORY_LABEL_BOX_W,
    textAlign: 'center',
    fontSize: TERRITORY_LABEL.fontSize,
    fontWeight: TERRITORY_LABEL.fontWeight,
    lineHeight: TERRITORY_LABEL_LINE_H,
    includeFontPadding: false,
    color: withSvgPaintAlpha(TERRITORY_LABEL.fill, TERRITORY_LABEL.opacity),
    // SVG stroke 0.45 외곽선 대체
    textShadowColor: withSvgPaintAlpha(TERRITORY_LABEL.stroke, TERRITORY_LABEL.opacity),
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 1,
  },
});
