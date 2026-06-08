// ============================================================
// 함선 임시 비주얼 — 픽셀 스프라이트 대신 그리드 블록 (조선소·전투 등)
// ============================================================

import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../utils/theme';

export type ShipGridTone = 'player' | 'enemy' | 'neutral';

type Props = {
  /** 한 칸 크기 (dp) */
  cellSize?: number;
  cols?: number;
  rows?: number;
  flip?: boolean;
  tone?: ShipGridTone;
};

/** 기본 그리드: 가로로 긴 기함형 비율 (열 > 행) */
const DEFAULT_COLS = 18;
const DEFAULT_ROWS = 7;

export function ShipGridPlaceholder({
  cellSize = 8,
  cols = DEFAULT_COLS,
  rows = DEFAULT_ROWS,
  flip,
  tone = 'neutral',
}: Props) {
  const accent = useMemo(() => {
    if (tone === 'player') return COLORS.safe_zone;
    if (tone === 'enemy') return COLORS.pvp_zone;
    return COLORS.info;
  }, [tone]);

  const w = cols * cellSize;
  const h = rows * cellSize;

  const cells = useMemo(() => {
    const out: { x: number; y: number; bg: string }[] = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        /** 가로로 긴 함체: 거의 전폭 × 중앙 부근만 세로로 두껍게 */
        const hullish =
          x >= Math.floor(cols * 0.06) &&
          x < Math.ceil(cols * 0.94) &&
          y >= Math.floor(rows * 0.22) &&
          y < Math.ceil(rows * 0.78);
        const checker = (x + y) % 2 === 0;
        const base = hullish
          ? checker
            ? `${COLORS.bg_input}E6`
            : `${COLORS.bg_panel}CC`
          : checker
            ? `${COLORS.bg_secondary}AA`
            : `${COLORS.bg_primary}99`;
        out.push({ x, y, bg: base });
      }
    }
    return out;
  }, [rows, cols]);

  return (
    <View
      style={[
        styles.wrap,
        {
          width: w,
          height: h,
          borderColor: accent,
          transform: flip ? [{ scaleX: -1 }] : undefined,
        },
      ]}
      accessibilityLabel="함선 임시 그리드"
    >
      {cells.map(({ x, y, bg }) => (
        <View
          key={`${y}-${x}`}
          style={{
            position: 'absolute',
            left: x * cellSize,
            top: y * cellSize,
            width: cellSize,
            height: cellSize,
            backgroundColor: bg,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    borderWidth: 1,
    borderRadius: 2,
    overflow: 'hidden',
  },
});
