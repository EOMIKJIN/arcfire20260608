// ============================================================
// 은하 지도 — 다음 분쟁 판정 예고(1h 순환) 노드 링 오버레이
// ============================================================

import React, { memo, useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
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

const ContestedZoneRingMark = memo(function ContestedZoneRingMark({
  anchor,
  spin,
}: {
  anchor: RingAnchor;
  spin: Animated.AnimatedInterpolation<string>;
}) {
  const ringSize = (anchor.nodeR + RING_PAD) * 2;
  const half = ringSize / 2;

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
            transform: [{ rotate: spin }],
          },
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
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animActive) {
      spinAnim.stopAnimation();
      return;
    }
    const loop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: RING_SPIN_MS,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => {
      loop.stop();
    };
  }, [animActive, spinAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

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
        <ContestedZoneRingMark key={anchor.systemId} anchor={anchor} spin={spin} />
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
