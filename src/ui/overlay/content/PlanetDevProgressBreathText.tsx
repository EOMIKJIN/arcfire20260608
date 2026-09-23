import React, { memo, useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, type StyleProp, type TextStyle } from 'react-native';

const BREATH_MIN = 0.16;
const BREATH_MAX = 1;
const BREATH_MS = 1600;

type Props = {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  accessibilityLabel?: string;
};

/** 개발 진행 중 라벨 — opacity만 호흡. Value 1회 · 루프 내 할당 없음. */
export const PlanetDevProgressBreathText = memo(function PlanetDevProgressBreathText({
  children,
  style,
  numberOfLines,
  accessibilityLabel,
}: Props) {
  const opacity = useRef(new Animated.Value(BREATH_MAX)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: BREATH_MIN,
          duration: BREATH_MS,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: BREATH_MAX,
          duration: BREATH_MS,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => {
      loop.stop();
      opacity.stopAnimation();
    };
  }, [opacity]);

  return (
    <Animated.Text
      style={[style, { opacity }]}
      numberOfLines={numberOfLines}
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </Animated.Text>
  );
});
