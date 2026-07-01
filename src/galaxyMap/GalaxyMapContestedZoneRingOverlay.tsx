// ============================================================
// 은하 지도 — 다음 분쟁 판정 예고(1h 순환) 노드 링 오버레이
// ============================================================

import React, { memo, useCallback, useEffect, useMemo } from 'react';
import { View, StyleSheet, AppState } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { LAYOUT } from '../utils/theme';
import type { StarSystem } from '../types';

const NODE_R = LAYOUT.map_node_radius;
const NODE_R_CURRENT = LAYOUT.map_node_radius_start;

/** 행성 마커 바깥 여백(px) — 얇은 타겟 링 */
const RING_PAD = 7;
const RING_SPIN_MS = 14_000;

/** 어두운 맵 위에서도 분쟁 표기가 보이도록 밝은 붉은 점선 */
const RING_COLOR = 'rgba(255, 108, 108, 0.88)';

type ToScreenFn = (pos: { x: number; y: number }) => { x: number; y: number };

type GalaxyMapContestedZoneRingOverlayProps = {
  systems: readonly StarSystem[];
  currentSystemId: string;
  toScreen: ToScreenFn;
  /** false면 회전 애니메이션 정지(화면 이탈) */
  animActive: boolean;
};

type RingAnchor = {
  systemId: string;
  cx: number;
  cy: number;
  nodeR: number;
};

function startContestedRingSpin(rotation: SharedValue<number>): void {
  cancelAnimation(rotation);
  rotation.value = 0;
  rotation.value = withRepeat(
    withTiming(360, { duration: RING_SPIN_MS, easing: Easing.linear }),
    -1,
    false,
  );
}

const ContestedZoneRingMark = memo(function ContestedZoneRingMark({
  anchor,
  rotation,
}: {
  anchor: RingAnchor;
  rotation: SharedValue<number>;
}) {
  const ringSize = (anchor.nodeR + RING_PAD) * 2;
  const half = ringSize / 2;

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View
      pointerEvents="none"
      style={[
        styles.markWrap,
        {
          left: anchor.cx - half,
          top: anchor.cy - half,
          width: ringSize,
          height: ringSize,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.ring,
          {
            width: ringSize,
            height: ringSize,
            borderRadius: half,
            borderColor: RING_COLOR,
          },
          ringStyle,
        ]}
      />
    </View>
  );
});

export const GalaxyMapContestedZoneRingOverlay = memo(function GalaxyMapContestedZoneRingOverlay({
  systems,
  currentSystemId,
  toScreen,
  animActive,
}: GalaxyMapContestedZoneRingOverlayProps) {
  const rotation = useSharedValue(0);
  const restartSpin = useCallback(() => {
    startContestedRingSpin(rotation);
  }, [rotation]);

  useEffect(() => {
    if (!animActive) {
      cancelAnimation(rotation);
      return undefined;
    }
    restartSpin();
    return () => {
      cancelAnimation(rotation);
    };
  }, [animActive, rotation, restartSpin]);

  /** RN Animated.loop는 JS 스레드·백그라운드 복귀 후 멈춤 — 포그라운드 재시작 */
  useEffect(() => {
    if (!animActive) return undefined;
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') restartSpin();
    });
    return () => sub.remove();
  }, [animActive, restartSpin]);

  const anchors = useMemo((): RingAnchor[] => {
    return systems.map((sys) => {
      const pos = toScreen(sys.position);
      const isCurrent = sys.id === currentSystemId;
      return {
        systemId: sys.id,
        cx: pos.x,
        cy: pos.y,
        nodeR: isCurrent ? NODE_R_CURRENT : NODE_R,
      };
    });
  }, [systems, currentSystemId, toScreen]);

  if (anchors.length === 0) return null;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {anchors.map((anchor) => (
        <ContestedZoneRingMark key={anchor.systemId} anchor={anchor} rotation={rotation} />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  markWrap: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 1.35,
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
});
