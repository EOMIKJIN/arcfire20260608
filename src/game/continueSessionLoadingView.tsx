// ============================================================
// 이어하기 세션 — 항로 로딩 비주얼 (타이틀 / continue-warp 공용)
// ============================================================

import React, { memo, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Reanimated, { useAnimatedStyle, useFrameCallback, useSharedValue } from 'react-native-reanimated';
import { COLORS, FONTS, SPACING } from '../utils/theme';

const PARTICLE_COUNT = 96;

/** 0..1 의사난수 — 소실점 주변 각도를 균등에 가깝게 흩뜨려 ‘소용돌이’ 체감 제거 */
function fract01(n: number) {
  return n - Math.floor(n);
}

type WarpParticleSeed = {
  angle: number;
  phase0: number;
  speed: number;
};

function buildWarpParticles(n: number): WarpParticleSeed[] {
  const out: WarpParticleSeed[] = [];
  for (let i = 0; i < n; i++) {
    const angle = 2 * Math.PI * fract01(Math.sin(i * 12.9898) * 43758.5453);
    const phase0 = fract01(i * 0.61803398875 + 0.2718);
    const speed = 0.34 + ((i * 17) % 47) / 100;
    out.push({ angle, phase0, speed });
  }
  return out;
}

/**
 * 소실점(화면 중심)에서 바깥으로 직선 이동하는 스트릭.
 * 바깥 고정 래퍼에 방사각 회전, 안쪽은 부모 +x 축(= 시선 방향)으로만 이동.
 */
const WarpStreak = memo(function WarpStreak({
  angle,
  phase0,
  speed,
  cx,
  cy,
  rMin,
  rMax,
  tSec,
}: WarpParticleSeed & {
  cx: number;
  cy: number;
  rMin: number;
  rMax: number;
  tSec: Reanimated.SharedValue<number>;
}) {
  const style = useAnimatedStyle(() => {
    'worklet';
    const u = (((tSec.value * speed + phase0) % 1) + 1) % 1;
    /** 반지름 선형 — 등속 직선 운동 */
    const r = rMin + u * (rMax - rMin);
    /** 가까워질수록 길어지는 광선(원근 느낌) */
    const Lwant = 5 + u * 52;
    const L = Math.min(Lwant, Math.max(2.2, r - 0.6));
    const h = 1.1 + u * 2.1;
    let op = 0.12 + 0.58 * Math.sin(Math.PI * u);
    if (u < 0.04) op *= u / 0.04;
    if (u > 0.92) op *= (1 - u) / 0.08;
    return {
      position: 'absolute' as const,
      left: r - L,
      top: -h / 2,
      width: L,
      height: h,
      borderRadius: h / 2,
      backgroundColor: '#D4E4FF',
      opacity: op,
    };
  });
  return (
    <View
      style={{
        position: 'absolute',
        left: cx,
        top: cy,
        width: 1,
        height: 1,
        transform: [{ rotate: `${angle}rad` }],
      }}
      pointerEvents="none"
      collapsable={false}
    >
      <Reanimated.View style={style} pointerEvents="none" collapsable={false} />
    </View>
  );
});

function WarpTunnelLayer({ width, height }: { width: number; height: number }) {
  const cx = width * 0.5;
  const cy = height * 0.5;
  const rMax = Math.hypot(cx, cy) * 1.18;
  /** 소실점 근처 빈 영역(너무 두꺼운 중심 덩어리 방지) */
  const rMin = Math.min(6, rMax * 0.018);
  const particles = useMemo(() => buildWarpParticles(PARTICLE_COUNT), []);
  const tSec = useSharedValue(0);

  const frame = useFrameCallback(({ timeSincePreviousFrame }) => {
    'worklet';
    const dt = timeSincePreviousFrame ?? 0;
    if (dt <= 0 || dt > 120) return;
    tSec.value += dt / 1000;
  }, true);

  useEffect(() => {
    return () => {
      frame.setActive(false);
    };
  }, [frame]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p, i) => (
        <WarpStreak key={`warp-streak-${i}`} {...p} cx={cx} cy={cy} rMin={rMin} rMax={rMax} tSec={tSec} />
      ))}
    </View>
  );
}

export type ContinueSessionLoadingViewProps = {
  width: number;
  height: number;
  phaseLabel: string;
};

export function ContinueSessionLoadingView({ width, height, phaseLabel }: ContinueSessionLoadingViewProps) {
  return (
    <View style={[styles.root, { width, height }]}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.bg_primary }]} />
      <WarpTunnelLayer width={width} height={height} />
      <View style={styles.vignette} pointerEvents="none" />
      <View style={styles.centerWrap} pointerEvents="none">
        <View style={styles.centerCol}>
          <Text style={styles.title}>차원 항로 진입</Text>
          <Text style={styles.sub}>{phaseLabel}</Text>
          <Text style={styles.hint}>우주 맵·궤도 표시 경로를 미리 불러옵니다</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg_primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2,6,14,0.42)',
  },
  centerWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  centerCol: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    maxWidth: 320,
  },
  title: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    color: '#DCE9FF',
    letterSpacing: 3,
    fontWeight: FONTS.weight.bold,
  },
  sub: {
    marginTop: SPACING.sm,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.ink_light,
    letterSpacing: 1,
  },
  hint: {
    marginTop: SPACING.md,
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.ink_faint,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 15,
  },
});
