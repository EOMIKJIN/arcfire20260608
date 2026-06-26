import React, { memo, useEffect, useRef } from 'react';
import { Animated, type StyleProp, type ViewStyle } from 'react-native';

const REVEAL_STAGGER_MS = 68;
const HIDE_STAGGER_MS = 42;
const HIDE_DURATION_MS = 150;

type RevealAxis = 'horizontal' | 'vertical';

type Props = {
  /** 스캔 완료 후 true — false면 완전 비표시 */
  revealed: boolean;
  /** true면 즉시 표시(행성 복귀·actionsUnlockedProp) */
  instant?: boolean;
  staggerIndex?: number;
  /** 접힘 시 역순 지연 — 미지정 시 reveal 과 동일 index */
  hideStaggerIndex?: number;
  axis?: RevealAxis;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

/**
 * 스캔 잠금 해제 시 타일 등장 — 채굴·대화·수색(→) / 행성개발(↑) 순차 pop.
 * RN Animated only — 허브 Skia worklet 경로와 분리.
 */
export const PlanetHubScanActionRevealSlot = memo(function PlanetHubScanActionRevealSlot({
  revealed,
  instant = false,
  staggerIndex = 0,
  hideStaggerIndex,
  axis = 'horizontal',
  style,
  children,
}: Props) {
  const progress = useRef(new Animated.Value(instant && revealed ? 1 : 0)).current;
  const hideDelayIndex = hideStaggerIndex ?? staggerIndex;

  useEffect(() => {
    if (instant && revealed) {
      progress.setValue(1);
      return;
    }
    if (!revealed) {
      Animated.timing(progress, {
        toValue: 0,
        duration: HIDE_DURATION_MS,
        delay: hideDelayIndex * HIDE_STAGGER_MS,
        useNativeDriver: true,
      }).start();
      return;
    }
    progress.setValue(0);
    Animated.spring(progress, {
      toValue: 1,
      delay: staggerIndex * REVEAL_STAGGER_MS,
      useNativeDriver: true,
      tension: 340,
      friction: 15,
      velocity: 3,
    }).start();
  }, [hideDelayIndex, instant, progress, revealed, staggerIndex]);

  const translateFrom = axis === 'vertical' ? 18 : -22;

  return (
    <Animated.View
      pointerEvents={revealed ? 'auto' : 'none'}
      style={[
        style,
        {
          opacity: progress,
          transform: [
            axis === 'vertical'
              ? {
                  translateY: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [translateFrom, 0],
                  }),
                }
              : {
                  translateX: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [translateFrom, 0],
                  }),
                },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
});
