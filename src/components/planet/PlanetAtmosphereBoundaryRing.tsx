// ============================================================
// 행성 대기권 ↔ 우주 경계 — 외곽 zone 링 펄스 (메인 허브 PlanetDot)
// ============================================================

import React, { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

/** 최저 불투명 — 완전 0은 우주와 구분 불가 */
const ATMOSPHERE_PULSE_MIN_OPACITY = 0.14;
/** 밝음↔투명 왕복 반주기(ms) · reverse ping-pong 1주기 ≈ 15.6s */
const ATMOSPHERE_PULSE_HALF_MS = 7800;

type Props = {
  size: number;
  borderColor: string;
  borderWidth?: number;
};

export const PlanetAtmosphereBoundaryRing = React.memo(function PlanetAtmosphereBoundaryRing({
  size,
  borderColor,
  borderWidth = 2,
}: Props) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(ATMOSPHERE_PULSE_MIN_OPACITY, {
        duration: ATMOSPHERE_PULSE_HALF_MS,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );
  }, [pulse]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  const radius = size / 2;

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLabel="행성 대기권 경계"
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          width: size,
          height: size,
          borderRadius: radius,
          borderWidth,
          borderColor,
          backgroundColor: 'transparent',
        },
        ringStyle,
      ]}
    />
  );
});
