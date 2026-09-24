// ============================================================
// 은하 지도 — 다음 분쟁 판정 예고(1h 순환) 노드 링 오버레이
// ============================================================

import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, AppState, type AppStateStatus } from 'react-native';
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

function isAppForeground(state: AppStateStatus): boolean {
  return state === 'active';
}

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
  /** 기본=분쟁 빨강. 이상현상은 보라. */
  ringColor?: string;
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
  ringColor,
}: {
  anchor: RingAnchor;
  rotation: SharedValue<number>;
  ringColor: string;
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
            borderColor: ringColor,
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
  ringColor = RING_COLOR,
}: GalaxyMapContestedZoneRingOverlayProps) {
  const rotation = useSharedValue(0);
  /** 백그라운드에서는 링 View 트리 자체를 내려 Views/애니 잔류를 막는다(overnight soak). */
  const [appForeground, setAppForeground] = useState(() =>
    isAppForeground(AppState.currentState),
  );
  const ringsLive = animActive && appForeground;

  const restartSpin = useCallback(() => {
    startContestedRingSpin(rotation);
  }, [rotation]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      setAppForeground(isAppForeground(next));
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!ringsLive) {
      cancelAnimation(rotation);
      return undefined;
    }
    restartSpin();
    return () => {
      cancelAnimation(rotation);
    };
  }, [ringsLive, rotation, restartSpin]);

  const anchors = useMemo((): RingAnchor[] => {
    // 동일 systemId 중복 입력 시 React same-key 경고 — 성계당 링 1개만
    const seen = new Set<string>();
    const out: RingAnchor[] = [];
    for (let i = 0; i < systems.length; i += 1) {
      const sys = systems[i]!;
      if (seen.has(sys.id)) continue;
      seen.add(sys.id);
      const pos = toScreen(sys.position);
      const isCurrent = sys.id === currentSystemId;
      out.push({
        systemId: sys.id,
        cx: pos.x,
        cy: pos.y,
        nodeR: isCurrent ? NODE_R_CURRENT : NODE_R,
      });
    }
    return out;
  }, [systems, currentSystemId, toScreen]);

  if (!ringsLive || anchors.length === 0) return null;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {anchors.map((anchor) => (
        <ContestedZoneRingMark
          key={`contested-ring-${anchor.systemId}`}
          anchor={anchor}
          rotation={rotation}
          ringColor={ringColor}
        />
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
