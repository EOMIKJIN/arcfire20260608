import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { COMBAT_END_HOLD_FADE_MS } from '../../game/combatEndHold';

const VEIL_OPACITY = 0.58;
const FADE_OUT_MS = 180;

type Props = {
  visible: boolean;
};

/**
 * 전투 종료 첫 박자용 딤. Animated.Value 1회 할당 · 틱/루프 없음.
 * 신규 overlay kind 아님 — 전투 캔버스 위 pointerEvents none.
 */
export function CombatEndHoldVeil({ visible }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      opacity.stopAnimation();
      Animated.timing(opacity, {
        toValue: VEIL_OPACITY,
        duration: COMBAT_END_HOLD_FADE_MS,
        useNativeDriver: true,
      }).start();
      return () => {
        opacity.stopAnimation();
      };
    }
    opacity.stopAnimation();
    Animated.timing(opacity, {
      toValue: 0,
      duration: FADE_OUT_MS,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setMounted(false);
    });
    return () => {
      opacity.stopAnimation();
    };
  }, [opacity, visible]);

  if (!mounted && !visible) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.veil, { opacity }]}
    />
  );
}

const styles = StyleSheet.create({
  veil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#05080f',
  },
});
