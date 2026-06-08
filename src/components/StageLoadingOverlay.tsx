// ============================================================
// 스테이지 내 실제 대기(레이아웃·비동기 등)가 있을 때만 덮는 로딩 표시
// ============================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../utils/theme';

type Props = {
  visible: boolean;
  /** 기본 LOADING.... */
  label?: string;
};

export function StageLoadingOverlay({ visible, label = 'LOADING....' }: Props) {
  if (!visible) return null;
  return (
    <View style={styles.root} pointerEvents="auto" accessibilityLabel="로딩">
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(6,10,20,0.52)',
    zIndex: 20,
  },
  label: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    letterSpacing: 4,
    color: COLORS.ink_light,
  },
});
