import React, { memo } from 'react';
import { Text, View } from 'react-native';
import { overlayInfoRowStyles as styles } from './overlayInfoRowStyles';

type Props = {
  label: string;
  value: string;
};

/** 범용 오버레이 라벨·값 행 — 라벨(시안) / 값(흰색) 단일 스타일 */
export const ArcOverlayInfoRow = memo(function ArcOverlayInfoRow({ label, value }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
});
