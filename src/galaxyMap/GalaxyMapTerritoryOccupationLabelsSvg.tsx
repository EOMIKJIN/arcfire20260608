import React, { memo } from 'react';
import { G, Text as SvgText } from 'react-native-svg';
import type { GalaxyTerritoryOccupationLabel } from './buildGalaxyTerritoryVoronoi';

type Props = {
  labels: GalaxyTerritoryOccupationLabel[];
  nationLabelBySide: Record<'blue' | 'red', string>;
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

export const GalaxyMapTerritoryOccupationLabelsSvg = memo(function GalaxyMapTerritoryOccupationLabelsSvg({
  labels,
  nationLabelBySide,
}: Props) {
  if (labels.length === 0) return null;

  return (
    <G pointerEvents="none">
      {labels.map((label) => (
        <SvgText
          key={`occ-label-${label.key}`}
          x={label.x}
          y={label.y}
          fill={TERRITORY_LABEL.fill}
          fontSize={TERRITORY_LABEL.fontSize}
          fontWeight={TERRITORY_LABEL.fontWeight}
          textAnchor="middle"
          alignmentBaseline="middle"
          opacity={TERRITORY_LABEL.opacity}
          stroke={TERRITORY_LABEL.stroke}
          strokeWidth={TERRITORY_LABEL.strokeWidth}
        >
          {nationLabelBySide[label.factionSide]}
        </SvgText>
      ))}
    </G>
  );
});
