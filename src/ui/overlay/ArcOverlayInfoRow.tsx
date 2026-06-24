import React, { memo } from 'react';
import { Text, View } from 'react-native';
import type { ArcOverlayVisualTheme } from './tacticalOverlayPreview';
import { overlayInfoRowStyles as phosphorStyles } from './overlayInfoRowStyles';
import { tacticalOverlayInfoRowStyles as tacticalStyles } from './tacticalOverlayStyles';

type Props = {
  label: string;
  value: string;
  visualTheme?: ArcOverlayVisualTheme;
};

/** 범용 오버레이 라벨·값 행 — phosphor(시안/흰) · tactical(라이트 카드) */
export const ArcOverlayInfoRow = memo(function ArcOverlayInfoRow({
  label,
  value,
  visualTheme = 'phosphor',
}: Props) {
  const styles = visualTheme === 'tactical' ? tacticalStyles : phosphorStyles;
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
});
