import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../utils/theme';

type Props = { width: number; height: number; count?: number };

export function StarField({ width, height, count = 48 }: Props) {
  const stars = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const seed = (i * 7919 + 104729) % 100000;
      const x = (seed % 1000) / 1000;
      const y = ((seed * 7) % 1000) / 1000;
      const s = 1 + (seed % 3);
      const o = 0.15 + ((seed % 50) / 100);
      return { left: x * width, top: y * height, size: s, opacity: o };
    });
  }, [width, height, count]);

  return (
    <View style={[StyleSheet.absoluteFill, { width, height }]} pointerEvents="none">
      {stars.map((st, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: st.left,
            top: st.top,
            width: st.size,
            height: st.size,
            borderRadius: st.size / 2,
            backgroundColor: COLORS.ink_dark,
            opacity: st.opacity,
          }}
        />
      ))}
    </View>
  );
}
