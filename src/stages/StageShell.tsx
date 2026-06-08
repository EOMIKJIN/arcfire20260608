import React, { memo, useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets, type Edge } from 'react-native-safe-area-context';
import { useStageAssetPrewarm } from '../assetPipeline/useStageAssetPrewarm';
import { StarField } from '../renderer/StarField';
import { COLORS } from '../utils/theme';
import type { StageRouteName } from './types';
import { getStageByRouteName } from './registry';
import { STAGE_TOP_INSET_PX, STAGE_BOTTOM_MIN_INSET_PX } from './layout';

type Props = {
  routeName: StageRouteName;
  children: React.ReactNode;
  /** 기본: 배경 없음(스테이지가 필요할 때만 stars를 명시) */
  background?: 'stars' | 'none';
  /** `background="stars"` 일 때 별 개수 — 행성 등 무거운 오버레이 위에서는 낮추는 것이 유리 */
  starFieldCount?: number;
  /**
   * 별 배경 위·포그라운드 UI 아래에 그릴 레이어(터치는 포그라운드가 받음).
   * 예: 메인스테이지 행성 연출
   */
  backgroundOverlay?: React.ReactNode;
  /**
   * 포그라운드(`children`) **위**에 절대 배치. `pointerEvents`는 통과(box-none) — 메인스테이지에서
   * 스크롤/패널이 배경 궤도를 가리지 않게 Reanimated 전투만 올릴 때 사용.
   */
  absoluteOverlay?: React.ReactNode;
  /** SafeArea 적용 edge */
  edges?: Edge[];
  /** 최상단 고정 공백(기본 ON) */
  topInset?: boolean;
  /** `SafeAreaView` 배경 — 미지정 시 `COLORS.bg_primary` */
  safeAreaBackgroundColor?: string;
};

function StageShellInner({
  routeName,
  children,
  background = 'none',
  backgroundOverlay,
  absoluteOverlay,
  starFieldCount = 70,
  edges,
  topInset = true,
  safeAreaBackgroundColor,
}: Props) {
  useStageAssetPrewarm(routeName);
  const meta = useMemo(() => getStageByRouteName(routeName), [routeName]);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  /** 시스템 inset만 쓰면(내비 숨김 등) 하단이 0에 가까워질 때, 최소 공백만큼 보충 */
  const foregroundBottomPad = Math.max(0, STAGE_BOTTOM_MIN_INSET_PX - insets.bottom);

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: safeAreaBackgroundColor ?? COLORS.bg_primary }]}
      edges={edges}
    >
      {background === 'stars' ? (
        <View style={styles.bg} pointerEvents="box-none">
          <View style={styles.bgStars} pointerEvents="none">
            <StarField width={width} height={height} count={starFieldCount} />
          </View>
          {backgroundOverlay ? (
            <View style={styles.bgOverlay} pointerEvents="box-none">
              {backgroundOverlay}
            </View>
          ) : null}
        </View>
      ) : null}

      {/* 스테이지 메타는 현재 UI에 노출하지 않되, 디버깅/확장을 위해 data-* 성격의 접근성 힌트만 남김 */}
      <View
        style={[styles.foreground, { paddingBottom: foregroundBottomPad }]}
        accessibilityLabel={`stage:${meta.id}`}
      >
        {topInset ? <View style={{ height: STAGE_TOP_INSET_PX }} /> : null}
        {children}
      </View>

      {absoluteOverlay ? (
        <View style={styles.absoluteOverlay} pointerEvents="none">
          {absoluteOverlay}
        </View>
      ) : null}
    </SafeAreaView>
  );
}

export const StageShell = memo(StageShellInner);

const styles = StyleSheet.create({
  safe: { flex: 1 },
  bg: { ...StyleSheet.absoluteFillObject },
  bgStars: { ...StyleSheet.absoluteFillObject },
  bgOverlay: { ...StyleSheet.absoluteFillObject },
  foreground: { flex: 1 },
  /** 별·포그라운드 위 — 터치는 box-none으로 하위로 전달 */
  absoluteOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    elevation: 24,
  },
});
