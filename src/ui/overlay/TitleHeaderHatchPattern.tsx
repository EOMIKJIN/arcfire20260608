import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Line, Pattern, Rect } from 'react-native-svg';

type Props = {
  /** SVG pattern id — 화면별로 고유값 (동시 마운트 시 충돌 방지) */
  patternId: string;
  stroke: string;
};

/** G-ARCHIVE tactical / phosphor 공통 — 제목 헤더 대각 해칭 (정적 1회 SVG) */
export const TitleHeaderHatchPattern = memo(function TitleHeaderHatchPattern({
  patternId,
  stroke,
}: Props) {
  return (
    <View style={styles.patternLayer} pointerEvents="none">
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFillObject}>
        <Defs>
          <Pattern
            id={patternId}
            width={8}
            height={8}
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-45)"
          >
            <Line x1={0} y1={0} x2={0} y2={8} stroke={stroke} strokeWidth={1.2} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </Svg>
    </View>
  );
});

const styles = StyleSheet.create({
  patternLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
});
