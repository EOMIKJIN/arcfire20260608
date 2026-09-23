import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, type StyleProp, type ViewStyle } from 'react-native';

const REVEAL_STAGGER_MS = 92;
const HIDE_STAGGER_MS = 48;
const HIDE_DURATION_MS = 160;
const WING_SLIDE_PX = 28;

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
  /** horizontal: start=왼쪽에서, end=오른쪽에서(스캔→왼쪽 등장) */
  slideFrom?: 'start' | 'end';
  /**
   * true면 숨김 완료 후 레이아웃에서 제거.
   * 가로 5열에서는 false — 칸 너비 유지해 스캔이 가운데에 고정.
   */
  collapseWhenHidden?: boolean;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

/**
 * 스캔 잠금 해제 시 타일 등장 — 가운데 스캔에서 좌·우 날개(안쪽→바깥) 순차 pop.
 * native driver 사용 금지: JS 값이 0에 남으면 스캔 완료 리렌더에서 타일이 사라진다.
 * 등장 후 View 교체도 금지(그 스왑이 깜박임).
 * RN Animated only — 허브 Skia worklet 경로와 분리.
 */
export const PlanetHubScanActionRevealSlot = memo(function PlanetHubScanActionRevealSlot({
  revealed,
  instant = false,
  staggerIndex = 0,
  hideStaggerIndex,
  axis = 'horizontal',
  slideFrom = 'start',
  collapseWhenHidden = false,
  style,
  children,
}: Props) {
  const progress = useRef(new Animated.Value(instant && revealed ? 1 : 0)).current;
  const hideDelayIndex = hideStaggerIndex ?? staggerIndex;
  const revealedStableRef = useRef(instant && revealed);
  const [layoutCollapsed, setLayoutCollapsed] = useState(collapseWhenHidden && !(instant && revealed));

  const translateFrom = axis === 'vertical' ? 18 : slideFrom === 'end' ? WING_SLIDE_PX : -WING_SLIDE_PX;

  const motionStyle = useMemo(
    () => ({
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
        {
          scaleX: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0.72, 1],
          }),
        },
      ],
    }),
    [axis, progress, translateFrom],
  );

  useEffect(() => {
    if (instant && revealed) {
      progress.stopAnimation();
      progress.setValue(1);
      revealedStableRef.current = true;
      setLayoutCollapsed(false);
      return undefined;
    }
    if (!revealed) {
      revealedStableRef.current = false;
      const hide = Animated.timing(progress, {
        toValue: 0,
        duration: HIDE_DURATION_MS,
        delay: hideDelayIndex * HIDE_STAGGER_MS,
        useNativeDriver: false,
      });
      hide.start(({ finished }) => {
        if (finished && collapseWhenHidden) setLayoutCollapsed(true);
      });
      return () => hide.stop();
    }
    if (revealedStableRef.current) {
      return undefined;
    }
    setLayoutCollapsed(false);
    progress.setValue(0);
    const show = Animated.spring(progress, {
      toValue: 1,
      delay: staggerIndex * REVEAL_STAGGER_MS,
      useNativeDriver: false,
      tension: 340,
      friction: 15,
      velocity: 3,
    });
    show.start(({ finished }) => {
      if (!finished) return;
      progress.setValue(1);
      revealedStableRef.current = true;
    });
    return () => show.stop();
  }, [collapseWhenHidden, hideDelayIndex, instant, progress, revealed, staggerIndex]);

  if (layoutCollapsed && !revealed) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents={revealed ? 'auto' : 'none'}
      style={[style, motionStyle]}
    >
      {children}
    </Animated.View>
  );
});
