import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ArcOverlayVisualTheme } from '../tacticalOverlayPreview';
import { overlayInfoRowStyles as phosphorStyles } from '../overlayInfoRowStyles';
import { tacticalOverlayInfoRowStyles as tacticalStyles } from '../tacticalOverlayStyles';
import type { PlanetCoreStatTrendView } from '../../../arcCore/planetCore/planetCoreStatOpsTrend';
import { formatPlanetCoreStatTrendDelta } from '../../../arcCore/planetCore/planetCoreStatOpsTrend';
import { COLORS, FONTS } from '../../../utils/theme';

type TrendInlineProps = {
  trend: PlanetCoreStatTrendView;
};

/** 시세표식 — rowValue 내부 nested Text (레이아웃=ArcOverlayInfoRow 동일) */
function PlanetCoreStatTrendInline({ trend }: TrendInlineProps) {
  if (trend.direction === 'flat') {
    return (
      <Text style={styles.trendFlat} accessibilityLabel="flat">
        · {formatPlanetCoreStatTrendDelta(0)}{' '}
      </Text>
    );
  }

  const isUp = trend.direction === 'up';
  return (
    <Text
      style={isUp ? styles.trendUp : styles.trendDown}
      accessibilityLabel={isUp ? 'up' : 'down'}
    >
      {isUp ? '▲' : '▼'} {formatPlanetCoreStatTrendDelta(trend.delta)}{' '}
    </Text>
  );
}

type StatRowProps = {
  label: string;
  pct: number;
  trend: PlanetCoreStatTrendView;
  visualTheme?: ArcOverlayVisualTheme;
};

/** 5대 스탯 행 — 추세(시세) + 퍼센티지 */
export const PlanetCoreStatInfoRow = memo(function PlanetCoreStatInfoRow({
  label,
  pct,
  trend,
  visualTheme = 'phosphor',
}: StatRowProps) {
  const rowStyles = visualTheme === 'tactical' ? tacticalStyles : phosphorStyles;
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.rowLabel}>{label}</Text>
      <Text style={rowStyles.rowValue} numberOfLines={1}>
        <PlanetCoreStatTrendInline trend={trend} />
        {pct}%
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  trendUp: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    color: COLORS.info,
  },
  trendDown: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    color: COLORS.danger,
  },
  trendFlat: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    color: 'rgba(160, 168, 180, 0.75)',
  },
});
