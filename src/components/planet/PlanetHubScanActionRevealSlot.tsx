import React, { memo, useEffect, useRef, useState } from 'react';
import { Animated, View, type StyleProp, type ViewStyle } from 'react-native';

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
  /** horizontal: start=왼쪽에서, end=오른쪽에서(스캔→왼쪽 등장) */
  slideFrom?: 'start' | 'end';
  /**
   * true면 숨김 완료 후 레이아웃에서 제거.
   * 가로 5열(출발 정렬)에서는 false — 칸 너비 유지해 스캔이 오른쪽에 고정.
   */
  collapseWhenHidden?: boolean;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

/**
 * 스캔 잠금 해제 시 타일 등장 — 채굴·대화·수색 가로(오른쪽→왼쪽) 순차 pop.
 * 행성개발은 항시 표시(본 슬롯 미사용).
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
  /** 등장 완료 후 Plain View — 채굴 primary 등 자식 re-render 시 Animated opacity 깜박임 방지 */
  const [revealedSettled, setRevealedSettled] = useState(instant && revealed);
  const [layoutCollapsed, setLayoutCollapsed] = useState(collapseWhenHidden && !(instant && revealed));

  useEffect(() => {
    if (instant && revealed) {
      progress.setValue(1);
      revealedStableRef.current = true;
      setRevealedSettled(true);
      setLayoutCollapsed(false);
      return;
    }
    if (!revealed) {
      if (!revealedStableRef.current) {
        if (collapseWhenHidden) setLayoutCollapsed(true);
        return;
      }
      revealedStableRef.current = false;
      setRevealedSettled(false);
      Animated.timing(progress, {
        toValue: 0,
        duration: HIDE_DURATION_MS,
        delay: hideDelayIndex * HIDE_STAGGER_MS,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished && collapseWhenHidden) setLayoutCollapsed(true);
      });
      return;
    }
    /** 이미 표시 완료 — 부모 re-render·instant 토글 시 progress 0 리셋 깜박임 방지 */
    if (revealedStableRef.current) {
      progress.setValue(1);
      setRevealedSettled(true);
      setLayoutCollapsed(false);
      return;
    }
    revealedStableRef.current = true;
    setLayoutCollapsed(false);
    setRevealedSettled(false);
    progress.setValue(0);
    Animated.spring(progress, {
      toValue: 1,
      delay: staggerIndex * REVEAL_STAGGER_MS,
      useNativeDriver: true,
      tension: 340,
      friction: 15,
      velocity: 3,
    }).start(({ finished }) => {
      if (finished) setRevealedSettled(true);
    });
  }, [collapseWhenHidden, hideDelayIndex, instant, progress, revealed, staggerIndex]);

  if (layoutCollapsed && !revealed) {
    return null;
  }

  const translateFrom =
    axis === 'vertical' ? 18 : slideFrom === 'end' ? 22 : -22;

  if (revealedSettled && revealed) {
    return (
      <View pointerEvents="auto" style={style}>
        {children}
      </View>
    );
  }

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
