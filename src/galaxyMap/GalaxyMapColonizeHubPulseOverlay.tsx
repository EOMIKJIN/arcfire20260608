// ============================================================
// 은하 지도 — 개척 운용 중 허브 맥박 (Reanimated UI 스레드)
// JS Animated SVG opacity 금지 — 팬/감속과 같은 UI 스레드만 사용
// ============================================================

import React, { memo, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, AppState, type AppStateStatus } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { collectStelliumColonizeMarkSystemIds } from '../arcCore/colonize/stelliumColonizeTypes';
import { useStelliumColonizeStore } from '../store/stelliumColonizeStore';
import { LAYOUT } from '../utils/theme';
import type { StarSystem } from '../types';
import {
  colonizePulseTiming,
  resolveVisitedNodeInnerR,
} from './galaxyMapColonizeHubPulse';

function isAppForeground(state: AppStateStatus): boolean {
  return state === 'active';
}

const NODE_R = LAYOUT.map_node_radius;
const COLONIZE_HUB_DOT_FILL = '#000000';
const PULSE_MIN = 0.18;
const PULSE_MAX = 1;
const MAX_PULSE_DOTS = 3;

type ToScreenFn = (pos: { x: number; y: number }) => { x: number; y: number };

type GalaxyMapColonizeHubPulseOverlayProps = {
  systems: readonly StarSystem[];
  toScreen: ToScreenFn;
  /** false면 맥박 정지(이동·백그라운드·STAGE 미준비) */
  animActive: boolean;
};

type PulseAnchor = {
  systemId: string;
  cx: number;
  cy: number;
  r: number;
  index: number;
};

const ColonizeHubPulseMark = memo(function ColonizeHubPulseMark({
  anchor,
  live,
}: {
  anchor: PulseAnchor;
  live: boolean;
}) {
  const opacity = useSharedValue(PULSE_MIN);
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  useEffect(() => {
    if (!live) {
      cancelAnimation(opacity);
      opacity.value = PULSE_MIN;
      return undefined;
    }
    const { delayMs, halfMs } = colonizePulseTiming(anchor.systemId, anchor.index);
    opacity.value = withDelay(
      delayMs,
      withRepeat(
        withSequence(
          withTiming(PULSE_MAX, {
            duration: halfMs,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(PULSE_MIN, {
            duration: halfMs,
            easing: Easing.inOut(Easing.sin),
          }),
        ),
        -1,
        false,
      ),
    );
    return () => {
      cancelAnimation(opacity);
    };
  }, [live, anchor.systemId, anchor.index, opacity]);

  const size = anchor.r * 2;
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.dot,
        {
          left: anchor.cx - anchor.r,
          top: anchor.cy - anchor.r,
          width: size,
          height: size,
          borderRadius: anchor.r,
        },
        pulseStyle,
      ]}
    />
  );
});

export const GalaxyMapColonizeHubPulseOverlay = memo(function GalaxyMapColonizeHubPulseOverlay({
  systems,
  toScreen,
  animActive,
}: GalaxyMapColonizeHubPulseOverlayProps) {
  const colonizeRevision = useStelliumColonizeStore((s) => s.revision);
  const [appForeground, setAppForeground] = useState(() => isAppForeground(AppState.currentState));
  const pulseLive = animActive && appForeground;

  const anchors = useMemo((): PulseAnchor[] => {
    const markIds = collectStelliumColonizeMarkSystemIds(
      useStelliumColonizeStore.getState().byPlanetId,
    );
    if (markIds.length === 0) return [];
    const markSet = new Set(markIds);
    const seen = new Set<string>();
    const out: PulseAnchor[] = [];
    for (let i = 0; i < systems.length; i += 1) {
      const sys = systems[i]!;
      if (!markSet.has(sys.id) || seen.has(sys.id)) continue;
      seen.add(sys.id);
      const pos = toScreen(sys.position);
      out.push({
        systemId: sys.id,
        cx: pos.x,
        cy: pos.y,
        r: resolveVisitedNodeInnerR(NODE_R),
        index: out.length,
      });
      if (out.length >= MAX_PULSE_DOTS) break;
    }
    return out;
  }, [systems, toScreen, colonizeRevision]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      setAppForeground(isAppForeground(next));
    });
    return () => sub.remove();
  }, []);

  if (!pulseLive || anchors.length === 0) return null;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {anchors.map((anchor) => (
        <ColonizeHubPulseMark
          key={`colonize-hub-${anchor.systemId}`}
          anchor={anchor}
          live={pulseLive}
        />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  dot: {
    position: 'absolute',
    backgroundColor: COLONIZE_HUB_DOT_FILL,
  },
});
