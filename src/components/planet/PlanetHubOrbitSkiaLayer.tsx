// ============================================================
// 행성 허브 궤도 — 아크코어 수송선: ◇ + 함장 캡션을 한 마크로 동기 이동
// (Skia 다이아 / RN 캡션 분리 시 궤도 회전 중 위치가 어긋나 보이는 문제 방지)
// ============================================================

import React, { memo, useLayoutEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { type SharedValue, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import type { ArcNpcTrafficShip } from '../../store/arcNpcTrafficStore';
import { FONTS } from '../../utils/theme';
import { readPlanetOrbitClockMs } from '../../arcCore/orbitClockMsBridge';
import { PLANET_MAIN_ORBIT_SCENE_SIZE } from '../../stages/planetMainStageLayout';
import { computeArcNpcShipScreenPacked, packArcNpcShipsToFloat32 } from './planetOrbitHubWorklets';

const AnimatedView = Animated.createAnimatedComponent(View);

import { PLANET_HUB_ORBIT_CAPITAL_RENDER_MAX } from '../../game/planetHubOrbitRenderBudget';

const HUB_ARC_CAPTION_MAX = PLANET_HUB_ORBIT_CAPITAL_RENDER_MAX;
const ORBIT_MARK_ANCHOR_PX = 7;

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
  },
  markWrap: {
    position: 'absolute',
    width: ORBIT_MARK_ANCHOR_PX * 2,
    height: ORBIT_MARK_ANCHOR_PX * 2,
    left: 0,
    top: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelCol: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    maxWidth: 220,
  },
  diamond: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: 'rgba(220,200,255,0.92)',
    lineHeight: 11,
    textAlign: 'center',
  },
  caption: {
    fontFamily: FONTS.mono,
    fontSize: 6,
    lineHeight: 8,
    color: 'rgba(220,200,255,0.9)',
    textAlign: 'center',
    marginTop: 1,
    maxWidth: 70,
    textShadowColor: 'rgba(20,10,32,0.65)',
    textShadowOffset: { width: 0, height: 0.5 },
    textShadowRadius: 1.5,
  },
});

const HubArcOrbitMark = memo(function HubArcOrbitMark({
  index,
  caption,
  orbitClockMs,
  syncMsSv,
  flatSv,
  shipCountSv,
  center,
}: {
  index: number;
  caption: string;
  orbitClockMs: SharedValue<number>;
  syncMsSv: SharedValue<number>;
  flatSv: SharedValue<number[]>;
  shipCountSv: SharedValue<number>;
  center: number;
}) {
  const animated = useAnimatedStyle(() => {
    'worklet';
    const p = computeArcNpcShipScreenPacked(
      index,
      orbitClockMs.value,
      syncMsSv.value,
      flatSv.value,
      shipCountSv.value,
      center,
    );
    if (!p) {
      return {
        opacity: 0,
        transform: [{ translateX: -9999 }, { translateY: -9999 }],
      };
    }
    return {
      opacity: p.opacity,
      transform: [{ translateX: p.x - ORBIT_MARK_ANCHOR_PX }, { translateY: p.y - ORBIT_MARK_ANCHOR_PX }],
    };
  }, [index, center]);

  return (
    <AnimatedView style={[styles.markWrap, animated]} pointerEvents="none">
      <View style={styles.labelCol}>
        <Text style={styles.diamond}>◇</Text>
        {caption ? (
          <Text style={styles.caption} numberOfLines={1} ellipsizeMode="tail">
            {caption}
          </Text>
        ) : null}
      </View>
    </AnimatedView>
  );
});

export const PlanetHubOrbitSkiaLayer = memo(function PlanetHubOrbitSkiaLayer({
  orbitClockMs,
  arcShips,
  arcCaptionHeads,
}: {
  orbitClockMs: SharedValue<number>;
  arcShips: ArcNpcTrafficShip[];
  arcCaptionHeads: string[];
}) {
  const flatSv = useSharedValue<number[]>([]);
  const syncMsSv = useSharedValue(0);
  const shipCountSv = useSharedValue(0);
  const arcPackSigRef = useRef('');

  const arcPackSig = useMemo(
    () =>
      arcShips
        .map(s =>
          [
            s.id,
            s.phase,
            s.phaseDurationSec.toFixed(3),
            s.orbitRadiusPx.toFixed(2),
            s.edgeAngleRad.toFixed(4),
            s.arcTrafficDwellRadPerSec.toFixed(4),
          ].join(':'),
        )
        .join('|'),
    [arcShips],
  );

  useLayoutEffect(() => {
    if (arcPackSigRef.current === arcPackSig) return;
    arcPackSigRef.current = arcPackSig;
    shipCountSv.value = arcShips.length;
    flatSv.value = packArcNpcShipsToFloat32(arcShips);
    syncMsSv.value = readPlanetOrbitClockMs();
  }, [arcPackSig, arcShips, flatSv, shipCountSv, syncMsSv]);

  const center = PLANET_MAIN_ORBIT_SCENE_SIZE / 2;
  const arcCaptionSlots = useMemo(
    () => Array.from({ length: HUB_ARC_CAPTION_MAX }, (_, i) => arcCaptionHeads[i] ?? ''),
    [arcCaptionHeads],
  );
  const markCount = Math.min(arcShips.length, HUB_ARC_CAPTION_MAX);
  if (markCount <= 0) return null;

  return (
    <View
      style={styles.root}
      pointerEvents="none"
      accessibilityLabel="행성 궤도 아크 수송선"
      accessibilityRole="image"
      accessible
    >
      {Array.from({ length: markCount }, (_, index) => (
        <HubArcOrbitMark
          key={`hub-arc-mark-${index}`}
          index={index}
          caption={arcCaptionSlots[index] ?? ''}
          orbitClockMs={orbitClockMs}
          syncMsSv={syncMsSv}
          flatSv={flatSv}
          shipCountSv={shipCountSv}
          center={center}
        />
      ))}
    </View>
  );
});
