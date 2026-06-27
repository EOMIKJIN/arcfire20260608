import React, { memo, useCallback, useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Svg, { Defs, Line, Path, Pattern, Rect } from 'react-native-svg';
import { TACTICAL_OVERLAY } from '../../ui/overlay/tacticalOverlayStyles';

/** 균일 격자 간격 — major/minor 구분 없음 */
const GRID_CELL_PX = 20;

/** 패널 대비 위치(%) · 반지름(px) — 전체 약 4개 */
const HEX_DECOR = [
  { xPct: 0.13, yPct: 0.20, radius: 34 },
  { xPct: 0.84, yPct: 0.14, radius: 28 },
  { xPct: 0.58, yPct: 0.70, radius: 40 },
  { xPct: 0.20, yPct: 0.84, radius: 26 },
] as const;

type Props = {
  patternId?: string;
};

type Size = { w: number; h: number };

/** flat-top 정육각형 — fill 없음(속 빈 라인) */
function hexagonPath(cx: number, cy: number, radius: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i += 1) {
    const rad = (Math.PI / 3) * i - Math.PI / 6;
    pts.push(`${cx + radius * Math.cos(rad)},${cy + radius * Math.sin(rad)}`);
  }
  return `M ${pts.join(' L ')} Z`;
}

/**
 * 연구소 스킬 패널 — 균일 격자 + 드문드문 빈 정육각형 데코.
 * RN SVG: width/height 를 onLayout 픽셀로 고정해야 pattern fill 이 보임.
 */
export const SkillTreeBlueprintBackdrop = memo(function SkillTreeBlueprintBackdrop({
  patternId = 'skillTreeUniformGridV6',
}: Props) {
  const [size, setSize] = useState<Size>({ w: 0, h: 0 });

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width <= 0 || height <= 0) return;
    setSize((prev) => (prev.w === width && prev.h === height ? prev : { w: width, h: height }));
  }, []);

  const gridStroke = 'rgba(26, 35, 50, 0.17)';

  const hexPaths = useMemo(() => {
    if (size.w <= 0 || size.h <= 0) return [];
    return HEX_DECOR.map((item, index) => ({
      key: `hex-${index}`,
      d: hexagonPath(item.xPct * size.w, item.yPct * size.h, item.radius),
    }));
  }, [size.h, size.w]);

  if (size.w <= 0 || size.h <= 0) {
    return <View style={styles.layer} onLayout={onLayout} pointerEvents="none" />;
  }

  return (
    <View style={styles.layer} onLayout={onLayout} pointerEvents="none" accessibilityElementsHidden>
      <Svg width={size.w} height={size.h}>
        <Defs>
          <Pattern
            id={patternId}
            width={GRID_CELL_PX}
            height={GRID_CELL_PX}
            patternUnits="userSpaceOnUse"
          >
            <Line x1={0} y1={0} x2={0} y2={GRID_CELL_PX} stroke={gridStroke} strokeWidth={1} />
            <Line x1={0} y1={0} x2={GRID_CELL_PX} y2={0} stroke={gridStroke} strokeWidth={1} />
          </Pattern>
        </Defs>
        <Rect x={0} y={0} width={size.w} height={size.h} fill={`url(#${patternId})`} />
        {hexPaths.map((hex) => (
          <Path
            key={hex.key}
            d={hex.d}
            fill={TACTICAL_OVERLAY.cardBg}
            stroke="rgba(26, 35, 50, 0.10)"
            strokeWidth={1}
          />
        ))}
      </Svg>
    </View>
  );
});

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
});
